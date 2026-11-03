// Comptes clients : e-mail + mot de passe, avec un code envoyé par e-mail (décision de Rhamone, 17 oct. 2026).
// Ce module vérifie ce que le visiteur tape ; le vrai contrôle est chez Supabase Auth (captcha Turnstile, limites d'essais).

export const PASSWORD_MIN = 10;
export const CODE_LENGTH = 6;
/** Après autant d'essais ratés, on attend avant de réessayer. */
export const MAX_TRIES = 5;
export const LOCK_MS = 60_000;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Mots de passe trop courants (échantillon) : refusés même s'ils sont assez longs. */
const COMMON = ["motdepasse", "password", "azertyuiop", "qwertyuiop", "1234567890", "0123456789", "takeurclothes", "iloveyou12"];

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

export type AuthProblem = "bad-credentials" | "not-confirmed" | "bad-code" | "weak-password" | "rate-limit" | "captcha" | "email-unavailable" | "network" | "unknown";

/** Message pour le visiteur. Jamais de quoi deviner si une adresse a déjà un compte. */
export function authErrorMessage(p: AuthProblem): string {
  return {
    "bad-credentials": "E-mail ou mot de passe incorrect.",
    "not-confirmed": "Confirme d'abord ton adresse avec le code reçu.",
    "bad-code": "Ce code ne correspond pas, ou il a expiré.",
    "weak-password": "Choisis un autre mot de passe.",
    "rate-limit": "Trop d'essais. Réessaie dans quelques minutes.",
    captcha: "La vérification a échoué. Réessaie.",
    "email-unavailable": "L'envoi d'e-mails est indisponible pour l'instant. Réessaie plus tard.",
    network: "Pas de réponse. Vérifie ta connexion, puis réessaie.",
    unknown: "Ça n'a pas marché. Réessaie dans un instant.",
  }[p];
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

/**
 * Date d'acceptation des CGV à enregistrer, ou null. La date gardée à l'inscription fait foi ;
 * sinon, le visiteur vient d'accepter. Une valeur illisible ne vaut pas acceptation.
 */
export function termsToRecord(acceptedNow: boolean, savedAt: unknown, now: Date): string | null {
  if (typeof savedAt === "string" && !Number.isNaN(Date.parse(savedAt)) && Date.parse(savedAt) <= now.getTime()) return new Date(savedAt).toISOString();
  return acceptedNow ? now.toISOString() : null;
}
