import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { adminChatId, sessionKey } from "./env";
import { sendMessage } from "./telegram";

// Session du tableau de bord, et code de secours : 8 chiffres envoyés dans la conversation du bot
// (le compte de Jean Paul, ou le groupe de l'équipe). La connexion normale passe par e-mail (admin-email-login.ts).

const PENDING = "tuc_admin_code";
const SESSION = "tuc_admin";
const CODE_MINUTES = 5;
const SESSION_HOURS = 12;

const sign = (s: string) => createHmac("sha256", sessionKey()).update(s).digest("hex");
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const cookieOpts = { httpOnly: true, secure: true, sameSite: "strict" as const, path: "/" };

export async function sendLoginCode(): Promise<void> {
  const code = String(randomInt(0, 100_000_000)).padStart(8, "0");
  const exp = Date.now() + CODE_MINUTES * 60_000;
  await sendMessage(adminChatId(), `🔐 Code de connexion au tableau de bord TakeUrClothes : <code>${code}</code>\nValable ${CODE_MINUTES} min. Ne le donne à personne.`);
  (await cookies()).set(PENDING, `${exp}.${sign(`code|${code}|${exp}`)}`, { ...cookieOpts, maxAge: CODE_MINUTES * 60 });
}

export async function checkLoginCode(code: string): Promise<boolean> {
  const jar = await cookies();
  const [exp, mac] = (jar.get(PENDING)?.value ?? "").split(".");
  const clean = code.replace(/\D/g, "");
  if (!exp || !mac || Number(exp) < Date.now() || !same(mac, sign(`code|${clean}|${exp}`))) return false;
  jar.delete(PENDING);
  await startAdminSession();
  return true;
}

/** Ouvre la session de l'admin, après un code Telegram ou un code par e-mail. */
export async function startAdminSession(): Promise<void> {
  const exp = Date.now() + SESSION_HOURS * 3_600_000;
  (await cookies()).set(SESSION, `${exp}.${sign(`session|${exp}`)}`, { ...cookieOpts, maxAge: SESSION_HOURS * 3600 });
}

export async function isAdmin(): Promise<boolean> {
  await connection(); // lu à chaque requête : l'heure ci-dessous n'est jamais figée au rendu statique
  const [exp, mac] = ((await cookies()).get(SESSION)?.value ?? "").split(".");
  return !!exp && !!mac && Number(exp) > Date.now() && same(mac, sign(`session|${exp}`));
}

export async function hasPendingCode(): Promise<boolean> {
  return !!(await cookies()).get(PENDING);
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION);
}
