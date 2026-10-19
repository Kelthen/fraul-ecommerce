// Comptes clients : e-mail + mot de passe, avec un code envoyé par e-mail (décision de Rhamone, 17 oct. 2026).
// Ce module ne fait que vérifier ce que le visiteur tape ; le vrai contrôle se fera côté serveur
// (Supabase Auth, captcha Turnstile, limites d'essais : zone de Serge, voir docs/POUR-SERGE.md §2.4).

export const PASSWORD_MIN = 10;
export const CODE_LENGTH = 6;
/** Après autant d'essais ratés, on attend avant de réessayer. */
export const MAX_TRIES = 5;
export const LOCK_MS = 60_000;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Mots de passe trop courants (échantillon) : refusés même s'ils sont assez longs. */
const COMMON = ["motdepasse", "password", "azertyuiop", "qwertyuiop", "1234567890", "0123456789", "fraulfraul", "iloveyou12"];

export const normalizeEmail = (s: string) => s.trim().toLowerCase();
export const isEmail = (s: string) => s.length <= 254 && EMAIL.test(normalizeEmail(s));

/** Problème du mot de passe, ou null s'il convient. */
export function passwordProblem(pw: string, email = ""): string | null {
  if (pw.length < PASSWORD_MIN) return `Au moins ${PASSWORD_MIN} caractères.`;
  if (pw.length > 128) return "128 caractères au plus.";
  const low = pw.toLowerCase();
  if (COMMON.some((c) => low.includes(c))) return "Trop courant, choisis-en un autre.";
  const local = normalizeEmail(email).split("@")[0];
  if (local.length >= 4 && low.includes(local)) return "Évite d'y mettre ton e-mail.";
  if (new Set(pw).size < 5) return "Trop répétitif.";
  return null;
}

/** Le code reçu par e-mail : 6 chiffres (espaces tolérés). */
export const cleanCode = (s: string) => s.replace(/\s+/g, "");
export const isCode = (s: string) => new RegExp(`^\\d{${CODE_LENGTH}}$`).test(cleanCode(s));

/** Essais ratés : verrou d'une minute après MAX_TRIES (le serveur aura le sien, celui-ci évite de marteler). */
export type Tries = { n: number; until: number };
export const noTries: Tries = { n: 0, until: 0 };
export const locked = (t: Tries, now = Date.now()) => t.until > now;
export function failTry(t: Tries, now = Date.now()): Tries {
  const n = t.until && t.until <= now ? 1 : t.n + 1;
  return n >= MAX_TRIES ? { n: 0, until: now + LOCK_MS } : { n, until: 0 };
}
