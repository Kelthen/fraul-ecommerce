"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkAdminCode, isAdminEmail, sendAdminCode } from "@/lib/server/admin-email-login";
import { checkLoginCode, sendLoginCode, startAdminSession } from "@/lib/server/admin-session";
import {
  checkTotp,
  endSecondStep,
  readSecondStep,
  resetTotp,
  startSecondStep,
  totpRequired,
  warnTotpChange,
  type FirstFactor,
} from "@/lib/server/admin-totp";
import { allow, clientIp } from "@/lib/server/limits";
import { CODE_MINUTES, cleanCode, normalizeEmail } from "@/models/admin/login";
import { TOO_MANY } from "@/models/security/limits";

// Connexion à l'admin en deux étapes : un code par e-mail (ou Telegram), puis l'application d'authentification.
// La 2e étape est coupée jusqu'au lancement (ADMIN_2FA, voir admin-totp.ts) : le premier code ouvre alors l'admin.
// Même réponse pour une adresse connue ou non. Chaque action revérifie tout : une action serveur est une adresse publique.

const PENDING_EMAIL = "tuc_admin_email"; // même nom dans AdminLogin.tsx
const SENT = "Si cette adresse a accès à l'admin, un code vient de partir.";
const WRONG = "Code incorrect ou expiré. Réessaie, ou demande un nouveau code.";
function go(msg: string, step = ""): never {
  redirect(`/admin?${step ? `etape=${step}&` : ""}msg=${encodeURIComponent(msg)}`);
}
const pendingEmail = async () => normalizeEmail((await cookies()).get(PENDING_EMAIL)?.value);
const clearPendingEmail = async () => (await cookies()).delete({ name: PENDING_EMAIL, path: "/admin" });

const telegramSendOk = async () => (await allow("telegramSend", await clientIp())) && (await allow("telegramSendAll", "tous"));
const telegramCheckOk = async () => (await allow("telegramCheck", await clientIp())) && (await allow("telegramCheckAll", "tous"));

export async function requestEmailCode(form: FormData): Promise<void> {
  const email = normalizeEmail(form.get("email"));
  if (!email.includes("@")) go("Entre ton adresse e-mail.");
  if (!(await allow("adminSend", await clientIp()))) go(TOO_MANY);
  await sendAdminCode(email).catch((e) => console.error("[admin] envoi du code", e));
  (await cookies()).set(PENDING_EMAIL, email, { httpOnly: true, secure: true, sameSite: "strict", path: "/admin", maxAge: CODE_MINUTES * 60 });
  go(SENT);
}

export async function verifyEmailCode(form: FormData): Promise<void> {
  if (!(await allow("adminCheck", await clientIp()))) go(TOO_MANY);
  const email = await pendingEmail();
  const ok = email ? await checkAdminCode(email, cleanCode(form.get("code"))).catch((e) => (console.error("[admin] code", e), false)) : false;
  if (!ok) go(WRONG);
  await firstCodeOk(email, "email");
}

/** Premier code bon : 2e étape si la double vérification est allumée, sinon l'admin s'ouvre. */
async function firstCodeOk(email: string, factor: FirstFactor): Promise<never> {
  await clearPendingEmail();
  if (totpRequired()) await startSecondStep(email, factor);
  else await startAdminSession();
  redirect("/admin");
}

/** Pas d'e-mail : le code part dans le groupe Telegram de l'équipe. La page reste la même pour une adresse inconnue. */
export async function requestTelegramCode(): Promise<void> {
  const email = await pendingEmail();
  if (!email) redirect("/admin");
  if (!(await telegramSendOk())) go(TOO_MANY);
  if (isAdminEmail(email)) await sendLoginCode().catch((e) => console.error("[admin] code Telegram", e));
  go("Si cette adresse a accès à l'admin, un code vient de partir sur Telegram.", "telegram");
}

export async function verifyTelegramCode(form: FormData): Promise<void> {
  if (!(await telegramCheckOk())) go(TOO_MANY, "telegram");
  const email = await pendingEmail();
  const ok = email && isAdminEmail(email) ? await checkLoginCode(String(form.get("code") ?? "")) : false;
  if (!ok) go(WRONG, "telegram");
  await firstCodeOk(email, "telegram");
}

export async function verifyTotp(form: FormData): Promise<void> {
  if (!totpRequired()) redirect("/admin");
  const pending = await readSecondStep();
  if (!pending) go("Recommence : le premier code a expiré.");
  if (!(await allow("adminCheck", await clientIp())) || !(await allow("adminTotp", pending.email))) go(TOO_MANY);
  const r = await checkTotp(pending.email, cleanCode(form.get("code"))).catch((e) => (console.error("[admin] application", e), "no" as const));
  if (r === "no") go("Code de l'application incorrect. Prends le code affiché en ce moment.");
  if (r === "first") await warnTotpChange(pending.email, "application d'authentification ajoutée");
  await endSecondStep();
  await startAdminSession();
  redirect("/admin");
}

/** Téléphone perdu : il faut aussi le code de l'autre canal. */
export async function startRecovery(): Promise<void> {
  if (!totpRequired()) redirect("/admin");
  const pending = await readSecondStep();
  if (!pending) go("Recommence : le premier code a expiré.");
  if (pending.factor === "email") {
    if (!(await telegramSendOk())) go(TOO_MANY);
    await sendLoginCode().catch((e) => console.error("[admin] code Telegram", e));
    go("Un code vient de partir sur le Telegram de l'équipe.", "secours");
  }
  if (!(await allow("adminSend", await clientIp()))) go(TOO_MANY);
  await sendAdminCode(pending.email).catch((e) => console.error("[admin] envoi du code", e));
  go("Un code vient de partir par e-mail.", "secours");
}

export async function verifyRecovery(form: FormData): Promise<void> {
  if (!totpRequired()) redirect("/admin");
  const pending = await readSecondStep();
  if (!pending) go("Recommence : le premier code a expiré.");
  if (!(await allow("adminCheck", await clientIp()))) go(TOO_MANY, "secours");
  const ok =
    pending.factor === "email"
      ? (await telegramCheckOk()) && (await checkLoginCode(String(form.get("code") ?? "")))
      : await checkAdminCode(pending.email, cleanCode(form.get("code"))).catch((e) => (console.error("[admin] code", e), false));
  if (!ok) go(WRONG, "secours");
  await resetTotp(pending.email);
  await warnTotpChange(pending.email, "application d'authentification retirée avec le code de secours");
  go("Ajoute maintenant ta nouvelle application.");
}

export async function changeEmail(): Promise<void> {
  await clearPendingEmail();
  await endSecondStep();
  redirect("/admin");
}
