// Connexion à l'admin par e-mail : liste des adresses autorisées et règles du code. Pur (testé dans login.test.ts).
// Un compte client avec une adresse de la liste passe par les mêmes étapes : code par e-mail, puis application (src/app/compte/team-actions.ts).

export const CODE_MINUTES = 10;
export const MAX_ATTEMPTS = 5;
/** Délai avant de renvoyer un code à la même adresse : limite les e-mails et les essais. */
export const RESEND_SECONDS = 60;

export const normalizeEmail = (raw: unknown): string => (typeof raw === "string" ? raw.trim().toLowerCase().slice(0, 254) : "");

/** Adresses de la variable ADMIN_EMAILS, séparées par des virgules ou des espaces. */
export const parseAdminEmails = (raw: string | undefined): string[] =>
  (raw ?? "").split(/[\s,;]+/).map(normalizeEmail).filter((e) => e.includes("@"));

export const cleanCode = (raw: unknown): string => (typeof raw === "string" ? raw.replace(/\D/g, "") : "");

export type PendingCode = { attempts: number; expiresAt: number };

/** Un code peut-il encore être essayé ? */
export const canTry = (p: PendingCode, now: number): boolean => p.attempts < MAX_ATTEMPTS && p.expiresAt > now;

/** Un nouveau code peut-il partir ? Pas si le précédent vient d'être envoyé. */
export const canResend = (lastSentAt: number | null, now: number): boolean =>
  lastSentAt === null || now - lastSentAt >= RESEND_SECONDS * 1000;
