import { stripeWebhookSecret } from "@/lib/server/env";
import { fulfillCheckout } from "@/lib/server/orders";
import { verifyWebhook, type CheckoutSession } from "@/lib/server/stripe";

// Webhook Stripe : enregistre la commande même si le client ferme la page avant le retour « merci ».
// Sécurité : signature vérifiée avec STRIPE_WEBHOOK_SECRET (whsec_…) ; sans elle, rien n'est traité.
// Événements à cocher dans Stripe : checkout.session.completed, checkout.session.async_payment_succeeded.

export async function POST(request: Request) {
  const secret = stripeWebhookSecret();
  if (!secret) return new Response("webhook non configuré", { status: 503 });
  const body = await request.text();
  if (!verifyWebhook(body, request.headers.get("stripe-signature"), secret)) return new Response("signature invalide", { status: 400 });

  const event = JSON.parse(body) as { type: string; data: { object: CheckoutSession } };
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return new Response("ignoré");
  const base = new URL(request.url).origin;
  try {
    const r = await fulfillCheckout(event.data.object.id, base);
    // « pending » : la page « merci » est en train d'enregistrer ; Stripe renverra l'événement, sans risque de doublon.
    return new Response(r.status, { status: r.status === "pending" ? 409 : 200 });
  } catch (e) {
    console.error("[stripe] webhook", e);
    return new Response("erreur", { status: 500 }); // Stripe réessaie plus tard
  }
}
