import "server-only";
import { createHash } from "node:crypto";

// Réglages secrets, lus seulement côté serveur (variables d'environnement Vercel).
// Rien ici ne part vers le navigateur.

/** Adresse publique du projet Supabase `fraul` (pas un secret). */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://rqrdccsxyyufqlenmpct.supabase.co";

function need(name: string): string {
  // Les valeurs collées dans Vercel portent parfois un espace ou un retour à la ligne : on les retire.
  const v = process.env[name]?.trim();
  if (!v) throw new MissingSetting(name);
  return v;
}

export class MissingSetting extends Error {
  constructor(public setting: string) {
    super(`Réglage manquant : ${setting} (à ajouter dans Vercel → Settings → Environment Variables).`);
  }
}

export const serviceKey = () => need("SUPABASE_SERVICE_ROLE_KEY");
/** Code d'accès du bot ; accepte aussi une valeur collée avec le préfixe « bot » de l'adresse de l'API. */
export const botToken = () => need("TELEGRAM_BOT_TOKEN").replace(/^bot(?=\d+:)/, "");
/** Le seul compte Telegram que le bot écoute (Jean Paul ; Serge pendant la démo). */
export const adminChatId = () => Number(need("TELEGRAM_ADMIN_CHAT_ID"));

/**
 * Secret partagé entre Telegram et le site (en-tête X-Telegram-Bot-Api-Secret-Token).
 * Dérivé du code d'accès du bot : pas de variable de plus à créer, et il change si le bot est régénéré.
 */
export const webhookSecret = () => createHash("sha256").update(`fraul-webhook:${botToken()}`).digest("hex").slice(0, 48);

/** Clé pour signer les cookies de session de l'admin (dérivée de la clé service). */
export const sessionKey = () => createHash("sha256").update(`fraul-admin-session:${serviceKey()}`).digest();

export function missingSettings(): string[] {
  return ["SUPABASE_SERVICE_ROLE_KEY", "TELEGRAM_BOT_TOKEN", "TELEGRAM_ADMIN_CHAT_ID"].filter((n) => !process.env[n]?.trim());
}

/** Forme attendue du code d'accès Telegram (chiffres, deux-points, 30 caractères ou plus), sans jamais l'afficher. */
export function botTokenLooksValid(): boolean {
  try {
    return /^\d{5,}:[A-Za-z0-9_-]{30,}$/.test(botToken());
  } catch {
    return false;
  }
}
