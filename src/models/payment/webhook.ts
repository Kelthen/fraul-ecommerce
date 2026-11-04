// Webhook Stripe : signature et événements traités. Pur (testé dans webhook.test.ts).
import { createHmac, timingSafeEqual } from "node:crypto";

/** Événements à cocher dans Stripe. Tout le reste reçoit « ignoré ». */
export const WEBHOOK_EVENTS = ["checkout.session.completed", "checkout.session.async_payment_succeeded"] as const;
export const isHandledEvent = (type: string) => (WEBHOOK_EVENTS as readonly string[]).includes(type);

const TOLERANCE_S = 300;

/**
 * Vérifie l'en-tête Stripe-Signature (HMAC SHA-256 de « horodatage.corps »), à 5 min près.
 * https://docs.stripe.com/webhooks#verify-manually
 */
export function verifySignature(rawBody: string, header: string | null, secret: string, now = Date.now()): boolean {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.split("=") as [string, string]);
  const t = Number(parts.find(([k]) => k === "t")?.[1]);
  if (!Number.isFinite(t) || Math.abs(now / 1000 - t) > TOLERANCE_S) return false;
  const want = Buffer.from(createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex"));
  return parts.some(([k, v]) => k === "v1" && v?.length === want.length && timingSafeEqual(Buffer.from(v), want));
}
