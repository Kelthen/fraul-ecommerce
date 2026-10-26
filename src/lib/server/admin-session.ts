import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { adminChatId, sessionKey } from "./env";
import { sendMessage } from "./telegram";

// Connexion de démo au tableau de bord : un code à 8 chiffres envoyé dans la conversation du bot
// (le compte de Jean Paul, ou le groupe de l'équipe). Pas de mot de passe à retenir, pas de variable de plus.
// ⚠️ Provisoire : la vraie connexion (Supabase Auth + double vérification, ARCHITECTURE §4) remplacera ceci.

const PENDING = "fraul_admin_code";
const SESSION = "fraul_admin";
const CODE_MINUTES = 5;
const SESSION_HOURS = 12;

const sign = (s: string) => createHmac("sha256", sessionKey()).update(s).digest("hex");
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const cookieOpts = { httpOnly: true, secure: true, sameSite: "strict" as const, path: "/" };

export async function sendLoginCode(): Promise<void> {
  const code = String(randomInt(0, 100_000_000)).padStart(8, "0");
  const exp = Date.now() + CODE_MINUTES * 60_000;
  await sendMessage(adminChatId(), `🔐 Code de connexion au tableau de bord Fraul : <code>${code}</code>\nValable ${CODE_MINUTES} min. Ne le donne à personne.`);
  (await cookies()).set(PENDING, `${exp}.${sign(`code|${code}|${exp}`)}`, { ...cookieOpts, maxAge: CODE_MINUTES * 60 });
}

export async function checkLoginCode(code: string): Promise<boolean> {
  const jar = await cookies();
  const [exp, mac] = (jar.get(PENDING)?.value ?? "").split(".");
  const clean = code.replace(/\D/g, "");
  if (!exp || !mac || Number(exp) < Date.now() || !same(mac, sign(`code|${clean}|${exp}`))) return false;
  jar.delete(PENDING);
  const sessionExp = Date.now() + SESSION_HOURS * 3_600_000;
  jar.set(SESSION, `${sessionExp}.${sign(`session|${sessionExp}`)}`, { ...cookieOpts, maxAge: SESSION_HOURS * 3600 });
  return true;
}

export async function isAdmin(): Promise<boolean> {
  const [exp, mac] = ((await cookies()).get(SESSION)?.value ?? "").split(".");
  return !!exp && !!mac && Number(exp) > Date.now() && same(mac, sign(`session|${exp}`));
}

export async function hasPendingCode(): Promise<boolean> {
  return !!(await cookies()).get(PENDING);
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION);
}
