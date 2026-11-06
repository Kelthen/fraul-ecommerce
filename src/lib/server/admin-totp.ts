import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { base32Encode, matchTotp, twoFactorOn } from "@/models/admin/totp";
import { db, eq } from "./db";
import { adminChatId, sessionKey } from "./env";
import { sendEmail } from "./mailer";
import { sendMessage } from "./telegram";

// Double vérification de l'admin : un premier code (e-mail ou Telegram), puis celui de l'application d'authentification.
// Mot de passe + code e-mail ne suffirait pas : le mot de passe se réinitialise par ce même e-mail.
// Secours si le téléphone est perdu : le code de l'autre canal (e-mail et Telegram réunis), puis nouvelle inscription.

/** Coupée jusqu'au lancement : sans ADMIN_2FA=true, le premier code ouvre l'admin, comme avant le 6 nov. */
export const totpRequired = () => twoFactorOn(process.env.ADMIN_2FA);

export type FirstFactor = "email" | "telegram";
export type PendingLogin = { email: string; factor: FirstFactor };
type Row = { email: string; secret_enc: string; confirmed_at: string | null; last_step: number };

const COOKIE = "tuc_admin_mfa";
const MINUTES = 15; // assez pour installer l'application à la première connexion
const sign = (s: string) => createHmac("sha256", sessionKey()).update(`mfa|${s}`).digest("hex");
const load = (email: string) => db.one<Row>("admin_totp", `select=*&email=${eq(email)}`);

/** Premier code bon : le visiteur passe à l'étape de l'application. La session admin n'est pas encore ouverte. */
export async function startSecondStep(email: string, factor: FirstFactor): Promise<void> {
  const body = `${Date.now() + MINUTES * 60_000}|${factor}|${email}`;
  (await cookies()).set(COOKIE, `${body}|${sign(body)}`, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: MINUTES * 60 });
}

export async function readSecondStep(): Promise<PendingLogin | null> {
  const parts = ((await cookies()).get(COOKIE)?.value ?? "").split("|");
  if (parts.length !== 4) return null;
  const [exp, factor, email, mac] = parts;
  const want = Buffer.from(sign(`${exp}|${factor}|${email}`));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got) || Number(exp) < Date.now()) return null;
  return { email, factor: factor === "telegram" ? "telegram" : "email" };
}

export const endSecondStep = async () => (await cookies()).delete(COOKIE);

// Le secret est chiffré : une copie de la base seule ne permet pas de produire des codes.
const secretKey = () => createHash("sha256").update(sessionKey()).update("admin-totp").digest();
function seal(secret: Buffer): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", secretKey(), iv);
  const data = Buffer.concat([c.update(secret), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}
function open(sealed: string): Buffer {
  const [iv, tag, data] = sealed.split(".").map((p) => Buffer.from(p, "base64"));
  const d = createDecipheriv("aes-256-gcm", secretKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]);
}

/** La clé à ajouter dans l'application, ou null si cet admin est déjà inscrit. */
export async function enrollmentKey(email: string): Promise<string | null> {
  const row = await load(email);
  if (row?.confirmed_at) return null;
  if (row) {
    try {
      return base32Encode(open(row.secret_enc));
    } catch {
      // Clé service changée pendant une inscription pas finie : on repart d'un secret neuf, rien n'était encore protégé.
    }
  }
  const secret = randomBytes(20);
  await db.insert("admin_totp", { email, secret_enc: seal(secret), last_step: 0 }, "email");
  return base32Encode(secret);
}

/** "first" : premier code bon, l'inscription est finie. Chaque code ne sert qu'une fois, même envoyé deux fois en même temps. */
export async function checkTotp(email: string, code: string): Promise<"ok" | "first" | "no"> {
  const row = await load(email);
  if (!row) return "no";
  let secret: Buffer;
  try {
    secret = open(row.secret_enc);
  } catch (e) {
    console.error("[admin] secret illisible", e); // la clé service a changé : passer par le secours
    return "no";
  }
  const step = matchTotp(secret, code, Date.now(), Number(row.last_step));
  if (step === null) return "no";
  const patch = row.confirmed_at ? { last_step: step } : { last_step: step, confirmed_at: new Date().toISOString() };
  const claimed = await db.update("admin_totp", `email=${eq(email)}&last_step=lt.${step}`, patch);
  if (!claimed.length) return "no";
  return row.confirmed_at ? "ok" : "first";
}

export const resetTotp = (email: string) => db.remove("admin_totp", `email=${eq(email)}`);

/** L'équipe et la personne sont prévenues de tout changement d'application. */
export async function warnTotpChange(email: string, what: string): Promise<void> {
  await Promise.all([
    sendMessage(adminChatId(), `🔐 Admin TakeUrClothes : ${what} pour ${email}.`).catch((e) => console.warn("[admin] alerte Telegram", e)),
    sendEmail(email, "Sécurité de ton accès admin", `Admin TakeUrClothes : ${what}.\n\nSi ce n'est pas toi, préviens l'équipe tout de suite.`).catch((e) => console.warn("[admin] alerte e-mail", e)),
  ]);
}
