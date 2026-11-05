"use server";

import { checkAdminCode, isAdminEmail, sendAdminCode } from "@/lib/server/admin-email-login";
import { isAdmin } from "@/lib/server/admin-session";
import { startSecondStep } from "@/lib/server/admin-totp";
import { verifiedUser } from "@/lib/server/customer";
import { cleanCode } from "@/models/admin/login";

// Accès à l'admin depuis « Mon compte » (demande de Rhamone, 5 nov. 2026) : un client connecté (mot de passe)
// dont l'adresse est dans ADMIN_EMAILS reçoit un code par e-mail, puis passe à l'application d'authentification sur /admin.
// Le mot de passe ne compte pas comme vérification : il se réinitialise par ce même e-mail. Les autres clients ne voient rien.

export type TeamState = "none" | "admin" | "code";

export async function teamStateAction(token: unknown): Promise<TeamState> {
  const user = await verifiedUser(token).catch(() => null);
  if (!user || !isAdminEmail(user.email)) return "none";
  return (await isAdmin()) ? "admin" : "code";
}

export async function teamSendCodeAction(token: unknown): Promise<boolean> {
  const user = await verifiedUser(token).catch(() => null);
  if (!user || !isAdminEmail(user.email)) return false;
  await sendAdminCode(user.email).catch((e) => console.error("[compte] code équipe", e));
  return true;
}

export async function teamCheckCodeAction(token: unknown, code: unknown): Promise<boolean> {
  const user = await verifiedUser(token).catch(() => null);
  if (!user || !isAdminEmail(user.email)) return false;
  const ok = await checkAdminCode(user.email, cleanCode(code)).catch((e) => (console.error("[compte] code équipe", e), false));
  if (ok) await startSecondStep(user.email, "email");
  return ok;
}
