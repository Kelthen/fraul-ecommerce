// Combien d'essais par action, sur quelle durée. Pur (testé dans limits.test.ts).
// Assez large pour un vrai client qui se trompe, trop court pour essayer tous les codes ou inonder l'équipe.

export type LimitRule = { max: number; seconds: number };

const MINUTE = 60;
const HOUR = 3600;

export const LIMITS = {
  /** Demander un code admin par e-mail, par adresse IP. */
  adminSend: { max: 10, seconds: HOUR },
  /** Taper un code admin, par adresse IP. */
  adminCheck: { max: 20, seconds: 15 * MINUTE },
  /** Taper un code admin, par adresse e-mail : renvoyer des codes ne donne pas plus d'essais. */
  adminCheckEmail: { max: 20, seconds: HOUR },
  /** Demander un code Telegram : par adresse IP, et pour tout le site (le groupe de l'équipe ne doit pas être inondé). */
  telegramSend: { max: 5, seconds: 15 * MINUTE },
  telegramSendAll: { max: 30, seconds: HOUR },
  /** Taper un code Telegram : même logique. */
  telegramCheck: { max: 10, seconds: 15 * MINUTE },
  telegramCheckAll: { max: 60, seconds: HOUR },
  /** Chercher une commande avec son numéro et son e-mail. */
  track: { max: 30, seconds: 10 * MINUTE },
  /** Ouvrir une page de paiement Stripe. */
  checkout: { max: 20, seconds: 10 * MINUTE },
  /** Envoyer une demande Finds (en plus des limites par e-mail et par heure). */
  finds: { max: 5, seconds: HOUR },
} satisfies Record<string, LimitRule>;

export type LimitName = keyof typeof LIMITS;

export const TOO_MANY = "Trop d'essais. Réessaie dans quelques minutes.";

/** L'adresse du visiteur : celle posée par Vercel, sinon la première de la chaîne. */
export function clientIpFrom(realIp: string | null, forwarded: string | null): string {
  return realIp?.trim() || forwarded?.split(",")[0]?.trim() || "inconnu";
}
