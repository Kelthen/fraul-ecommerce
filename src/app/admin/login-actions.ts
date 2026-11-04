"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkAdminCode, sendAdminCode } from "@/lib/server/admin-email-login";
import { startAdminSession } from "@/lib/server/admin-session";
import { CODE_MINUTES, cleanCode, normalizeEmail } from "@/models/admin/login";

// Connexion à l'admin par e-mail. Même réponse pour une adresse connue ou non.

const PENDING_EMAIL = "tuc_admin_email"; // même nom dans AdminLogin.tsx
const SENT = "Si cette adresse a accès à l'admin, un code vient de partir.";
const back = (msg: string): never => redirect(`/admin?msg=${encodeURIComponent(msg)}`);

export async function requestEmailCode(form: FormData): Promise<void> {
  const email = normalizeEmail(form.get("email"));
  if (!email.includes("@")) back("Entre ton adresse e-mail.");
  await sendAdminCode(email).catch((e) => console.error("[admin] envoi du code", e));
  (await cookies()).set(PENDING_EMAIL, email, { httpOnly: true, secure: true, sameSite: "strict", path: "/admin", maxAge: CODE_MINUTES * 60 });
  back(SENT);
}

export async function verifyEmailCode(form: FormData): Promise<void> {
  const jar = await cookies();
  const email = normalizeEmail(jar.get(PENDING_EMAIL)?.value);
  const ok = email ? await checkAdminCode(email, cleanCode(form.get("code"))).catch((e) => (console.error("[admin] code", e), false)) : false;
  if (!ok) back("Code incorrect ou expiré. Réessaie, ou demande un nouveau code.");
  jar.delete({ name: PENDING_EMAIL, path: "/admin" });
  await startAdminSession();
  redirect("/admin");
}

export async function changeEmail(): Promise<void> {
  (await cookies()).delete({ name: PENDING_EMAIL, path: "/admin" });
  redirect("/admin");
}
