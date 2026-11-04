import "server-only";
import { cartReminderEmail, disputeAlert, paymentFailedAlert, paymentFailedEmail, refundAlert, refundStatus, type Charge, type Dispute } from "@/models/payment/events";
import { DbError, db, eq } from "./db";
import { adminChatId } from "./env";
import { sendEmail } from "./mailer";
import { sessionOfPaymentIntent, type CheckoutSession } from "./stripe";
import { sendMessage } from "./telegram";

// Événements Stripe autres que le paiement réussi. Un e-mail ne part jamais pour un paiement de test.

type Order = { id: string; number: string };
type StripeEvent = { id: string; type: string; livemode: boolean; data: { object: unknown } };

async function orderOfSession(sessionId: string): Promise<Order | null> {
  const p = await db.one<{ orders: Order | null }>("payments", `select=orders(id,number)&provider_ref=${eq(sessionId)}`);
  return p?.orders ?? null;
}

/** Commande d'un paiement Stripe. Null si elle est introuvable : l'alerte le dira plutôt que de se taire. */
async function findByIntent(paymentIntent: string | null): Promise<{ order: Order | null; session: string | null }> {
  if (!paymentIntent) return { order: null, session: null };
  const session = await sessionOfPaymentIntent(paymentIntent).catch((e) => (console.error("[stripe] session du paiement", e), null));
  return { order: session ? await orderOfSession(session) : null, session };
}

/** Relance : seulement si cette adresse a un compte qui a accepté les nouveautés. Sans accord, rien ne part. */
async function acceptsNews(email: string): Promise<boolean> {
  const c = await db.one<{ id: string }>("customers", `select=id&email=${eq(email.trim().toLowerCase())}`);
  return Boolean(c && (await db.one("consents", `select=id&customer_id=${eq(c.id)}&kind=eq.marketing&revoked_at=is.null`)));
}

/** Traite un événement déjà authentifié, une seule fois par identifiant d'événement. */
export async function handleStripeEvent(event: StripeEvent, baseUrl: string): Promise<string> {
  const lock = { provider_event_id: event.id, provider: "stripe", payload: { type: event.type } };
  try {
    await db.insert("payment_events", lock);
  } catch (e) {
    if (e instanceof DbError && e.isUnique) return "déjà traité";
    throw e;
  }
  try {
    await apply(event, baseUrl);
    await db.update("payment_events", `provider_event_id=${eq(event.id)}`, { processed_at: new Date().toISOString() });
    return "traité";
  } catch (e) {
    await db.remove("payment_events", `provider_event_id=${eq(event.id)}`).catch(() => {}); // Stripe réessaiera
    throw e;
  }
}

async function apply(event: StripeEvent, baseUrl: string): Promise<void> {
  const live = event.livemode;
  switch (event.type) {
    case "checkout.session.async_payment_failed": {
      const s = event.data.object as CheckoutSession;
      const order = await orderOfSession(s.id);
      if (order) await db.update("orders", `id=${eq(order.id)}`, { status: "cancelled" });
      await db.update("payments", `provider_ref=${eq(s.id)}`, { status: "failed" });
      await sendMessage(adminChatId(), paymentFailedAlert(s, order?.number ?? null, live));
      const to = s.customer_details?.email;
      if (live && to) {
        const m = paymentFailedEmail(baseUrl);
        await sendEmail(to, m.subject, m.text);
      }
      return;
    }
    case "checkout.session.expired": {
      const s = event.data.object as CheckoutSession;
      const to = s.customer_details?.email;
      if (live && to && (await acceptsNews(to))) {
        const m = cartReminderEmail(baseUrl);
        await sendEmail(to, m.subject, m.text);
      }
      return;
    }
    case "charge.refunded": {
      const c = event.data.object as Charge;
      const { order, session } = await findByIntent(c.payment_intent);
      const status = refundStatus(c);
      if (session) await db.update("payments", `provider_ref=${eq(session)}`, { status });
      if (order && status === "refunded") await db.update("orders", `id=${eq(order.id)}`, { status: "refunded" });
      await sendMessage(adminChatId(), refundAlert(c, order?.number ?? null, live));
      return;
    }
    case "charge.dispute.created": {
      const d = event.data.object as Dispute;
      const { order } = await findByIntent(d.payment_intent);
      await sendMessage(adminChatId(), disputeAlert(d, order?.number ?? null, live));
      return;
    }
  }
}
