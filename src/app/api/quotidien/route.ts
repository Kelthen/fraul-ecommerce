import { SUPABASE_URL } from "@/lib/server/env";
import { sendDueShippedEmails } from "@/lib/server/mailer";

// Tâche planifiée Vercel (vercel.json), une fois par jour : le plan gratuit de Supabase se met en pause
// après environ 7 jours sans activité, et un paiement passé pendant la pause ne s'enregistre pas.
// Lecture d'une ligne publique avec la clé publique : aucun secret à fournir, sans danger si un inconnu l'appelle
// (les e-mails dus ne partent qu'une fois, à leur heure).

export async function GET(request: Request) {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) return new Response("clé publique absente", { status: 503, headers: { "Cache-Control": "no-store" } });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/brands?select=id&limit=1`, { headers: { apikey: key }, cache: "no-store" }).catch(() => null);
  if (!res?.ok) console.error("[quotidien] Supabase ne répond pas", res?.status, new URL(request.url).pathname);
  // Filet pour les e-mails « En route » : le bot les envoie aussi à chaque geste de l'équipe.
  if (res?.ok && process.env.SUPABASE_SERVICE_ROLE_KEY) await sendDueShippedEmails(new URL(request.url).origin).catch((e) => console.error("[quotidien] e-mails", e));
  return new Response(res?.ok ? "ok" : "base injoignable", { status: res?.ok ? 200 : 502, headers: { "Cache-Control": "no-store" } });
}
