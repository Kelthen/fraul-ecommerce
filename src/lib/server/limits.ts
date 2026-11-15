import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { LIMITS, clientIpFrom, type LimitName } from "@/models/security/limits";
import { db } from "./db";
import { sessionKey } from "./env";

// Limites d'essais, comptées dans la base (un compteur en mémoire repartirait de zéro à chaque serveur).
// Le visiteur n'est gardé qu'en empreinte. Si la base ne répond pas, on laisse passer : les codes et le paiement
// ont leurs propres vérifications, et un client ne doit pas être bloqué par une panne du compteur.

export async function clientIp(): Promise<string> {
  const h = await headers();
  return clientIpFrom(h.get("x-real-ip"), h.get("x-forwarded-for"));
}

/** Compte un essai ; faux si la limite est dépassée. */
export async function allow(name: LimitName, who: string): Promise<boolean> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return true; // en local, sans base
  const { max, seconds } = LIMITS[name];
  const key = `${name}:${createHmac("sha256", sessionKey()).update(who).digest("hex").slice(0, 32)}`;
  return db.rpc<boolean>("take_rate_limit", { p_key: key, p_max: max, p_seconds: seconds }).catch((e) => {
    console.error("[limites]", name, e);
    return true;
  });
}

/** Retire les compteurs dépassés (tâche quotidienne). */
export const purgeLimits = () => db.remove("rate_limits", `reset_at=lt.${encodeURIComponent(new Date().toISOString())}`);
