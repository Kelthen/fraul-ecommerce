// Codes d'une application d'authentification (TOTP, RFC 6238), sans dépendance. Pur (testé dans totp.test.ts).
import { createHmac, timingSafeEqual } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PERIOD = 30;
/** Un code d'avant ou d'après reste accepté : l'horloge d'un téléphone n'est jamais exacte à la seconde. */
const WINDOW = 1;

export const TOTP_DIGITS = 6;

/** Double vérification de l'admin : coupée jusqu'au lancement (décision de Serge, 6 nov. 2026), ADMIN_2FA=true l'allume. */
export const twoFactorOn = (setting: string | undefined) => setting?.trim().toLowerCase() === "true";

export function base32Encode(bytes: Buffer): string {
  let bits = 0, value = 0, out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
    value &= (1 << bits) - 1;
  }
  return bits ? out + ALPHABET[(value << (5 - bits)) & 31] : out;
}

/** Le code d'un pas de 30 secondes. */
export function totpCode(secret: Buffer, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const mac = createHmac("sha1", secret).update(counter).digest();
  const at = mac[mac.length - 1] & 15;
  const n = (mac.readUInt32BE(at) & 0x7fffffff) % 10 ** TOTP_DIGITS;
  return String(n).padStart(TOTP_DIGITS, "0");
}

/** Le pas du code s'il est bon et plus récent que le dernier accepté, sinon null : un code ne sert qu'une fois. */
export function matchTotp(secret: Buffer, code: string, nowMs: number, lastStep: number): number | null {
  if (!new RegExp(`^\\d{${TOTP_DIGITS}}$`).test(code)) return null;
  const now = Math.floor(nowMs / 1000 / PERIOD);
  const given = Buffer.from(code);
  let found: number | null = null;
  for (let step = now - WINDOW; step <= now + WINDOW; step++) {
    if (timingSafeEqual(Buffer.from(totpCode(secret, step)), given) && step > lastStep && found === null) found = step;
  }
  return found;
}

/** Le lien lu par l'application (dans le QR code). */
export const otpauthUrl = (email: string, secretB32: string) =>
  `otpauth://totp/TakeUrClothes:${encodeURIComponent(email)}?secret=${secretB32}&issuer=TakeUrClothes&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${PERIOD}`;

/** La clé à taper à la main, par groupes de 4. */
export const readableKey = (secretB32: string) => secretB32.replace(/(.{4})(?=.)/g, "$1 ");
