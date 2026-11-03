import { SUPABASE_URL } from "@/lib/server/env";

// Tâche planifiée Vercel (vercel.json), une fois par jour : le plan gratuit de Supabase se met en pause
// après environ 7 jours sans activité, et un paiement passé pendant la pause ne s'enregistre pas.
// Lecture d'une ligne publique avec la clé publique : aucun secret, rien d'écrit, sans danger si un inconnu l'appelle.

export async function GET(request: Request) {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) return new Response("clé publique absente", { status: 503, headers: { "Cache-Control": "no-store" } });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/brands?select=id&limit=1`, { headers: { apikey: key }, cache: "no-store" }).catch(() => null);
  if (!res?.ok) console.error("[quotidien] Supabase ne répond pas", res?.status, new URL(request.url).pathname);
  return new Response(res?.ok ? "ok" : "base injoignable", { status: res?.ok ? 200 : 502, headers: { "Cache-Control": "no-store" } });
}
