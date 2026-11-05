import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { CODE_MINUTES, canResend, canTry, parseAdminEmails } from "@/models/admin/login";
import { db, eq } from "./db";
import { sessionKey } from "./env";
import { sendEmail } from "./mailer";

// Code de connexion à l'admin envoyé par e-mail. Une adresse hors de la liste ne reçoit rien, et le visiteur voit la même
// réponse : la page ne révèle jamais qui est admin. Le code n'est gardé qu'en empreinte, avec son nombre d'essais.

type Row = { email: string; code_hash: string; attempts: number; expires_at: string; created_at: string };

const hash = (email: string, code: string) => createHmac("sha256", sessionKey()).update(`admin-email|${email}|${code}`).digest("hex");
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const load = (email: string) => db.one<Row>("admin_login_codes", `select=*&email=${eq(email)}`);
const allowed = (email: string) => parseAdminEmails(process.env.ADMIN_EMAILS).includes(email);
/** L'adresse (déjà vérifiée par le compte client) fait-elle partie de l'équipe ? */
export const isAdminEmail = allowed;

export async function sendAdminCode(email: string): Promise<void> {
  if (!allowed(email)) return;
  const now = Date.now();
  const old = await load(email);
  if (old && !canResend(Date.parse(old.created_at), now)) return;
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(
    "admin_login_codes",
    { email, code_hash: hash(email, code), attempts: 0, expires_at: new Date(now + CODE_MINUTES * 60_000).toISOString(), created_at: new Date(now).toISOString() },
    "email",
  );
  await sendEmail(email, `Ton code d'accès à l'admin : ${code}`, `Ton code d'accès à l'admin TakeUrClothes : ${code}\n\nIl reste valable ${CODE_MINUTES} minutes. Si tu n'as rien demandé, ignore cet e-mail.`);
}

/** Vrai si le code est bon. Chaque essai est compté avant la comparaison ; un code réussi ne resservira pas. */
export async function checkAdminCode(email: string, code: string): Promise<boolean> {
  if (!allowed(email) || code.length !== 6) return false;
  const row = await load(email);
  if (!row || !canTry({ attempts: row.attempts, expiresAt: Date.parse(row.expires_at) }, Date.now())) return false;
  // Conditionnel : deux essais en même temps ne comptent pas pour un seul.
  const counted = await db.update("admin_login_codes", `email=${eq(email)}&attempts=${eq(row.attempts)}`, { attempts: row.attempts + 1 });
  if (!counted.length || !same(row.code_hash, hash(email, code))) return false;
  await db.remove("admin_login_codes", `email=${eq(email)}`);
  return true;
}
