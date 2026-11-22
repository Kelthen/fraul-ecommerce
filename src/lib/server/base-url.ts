import { headers } from "next/headers";
import { SITE_URL } from "@/lib/format";

/**
 * Adresse du site pour les liens qu'on fabrique côté serveur (retour Stripe, liens Telegram, fiche expéditeur).
 * On garde l'adresse de la requête pour que les previews renvoient vers elles-mêmes, mais seulement si c'est l'une
 * des nôtres : le domaine du site, une preview Vercel du projet ou le poste local. Sinon (en-tête trafiqué),
 * l'adresse officielle. Scan du 22 nov. 2026.
 */
export async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim().toLowerCase();
  const site = new URL(SITE_URL);
  const ours =
    host === site.host ||
    host === site.host.replace(/^www\./, "") ||
    /^fraul-ecommerce-[a-z0-9-]+-kelthen\.vercel\.app$/.test(host) ||
    /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  if (!ours) return SITE_URL.replace(/\/$/, "");
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  return `${proto}://${host}`;
}
