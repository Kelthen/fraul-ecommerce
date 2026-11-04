// Événements Stripe autres que le paiement réussi : ce qu'on écrit à l'équipe et au client. Pur (testé dans events.test.ts).
import { esc } from "../relay/messages.ts";

export type Charge = { id: string; amount: number; amount_refunded: number; currency: string; refunded: boolean; payment_intent: string | null };
export type Dispute = { id: string; amount: number; currency: string; reason: string; payment_intent: string | null; evidence_details?: { due_by: number | null } | null };
export type FailedSession = { id: string; amount_total: number | null; currency: string | null; customer_details: { email: string | null } | null };

const money = (cents: number | null, currency: string | null) =>
  cents == null ? "montant inconnu" : `${(cents / 100).toFixed(2)} ${(currency ?? "").toUpperCase()}`;
const orderLine = (number: string | null) => (number ? `Commande <code>${esc(number)}</code>` : "⚠️ Aucune commande trouvée pour ce paiement : à vérifier dans Stripe");
const testMark = (live: boolean) => (live ? "" : " (test)");

/** État du paiement après un remboursement : remboursé en entier, ou en partie seulement. */
export const refundStatus = (c: Pick<Charge, "refunded" | "amount" | "amount_refunded">) =>
  c.refunded || c.amount_refunded >= c.amount ? ("refunded" as const) : ("partially_refunded" as const);

export function refundAlert(c: Charge, number: string | null, live: boolean): string {
  const whole = refundStatus(c) === "refunded";
  return (
    `↩️ <b>${whole ? "Commande remboursée" : "Remboursement partiel"}</b>${testMark(live)}\n` +
    `${esc(money(c.amount_refunded, c.currency))} sur ${esc(money(c.amount, c.currency))}\n${orderLine(number)}\n` +
    (whole ? "Ne pas expédier si le colis n'est pas parti." : "La commande reste ouverte : retirer la pièce remboursée.")
  );
}

export function disputeAlert(d: Dispute, number: string | null, live: boolean): string {
  const due = d.evidence_details?.due_by;
  return (
    `🚨 <b>Litige bancaire ouvert</b>${testMark(live)}\n` +
    `${esc(money(d.amount, d.currency))} · motif : ${esc(d.reason)}\n${orderLine(number)}\n` +
    (due ? `Répondre dans Stripe avant le ${new Date(due * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "America/Toronto" })} (heure de Toronto).` : "Répondre dans Stripe au plus vite.")
  );
}

export function paymentFailedAlert(s: FailedSession, number: string | null, live: boolean): string {
  return (
    `⚠️ <b>Paiement échoué</b>${testMark(live)}\n` +
    `${esc(money(s.amount_total, s.currency))} · ${esc(s.customer_details?.email ?? "e-mail inconnu")}\n` +
    (number ? `Commande <code>${esc(number)}</code> annulée.` : "Aucune commande n'avait été enregistrée.")
  );
}

export const paymentFailedEmail = (baseUrl: string) => ({
  subject: "Ton paiement n'a pas abouti",
  text: `Ton paiement TakeUrClothes n'a pas abouti, et tu n'as pas été débité pour cette commande.\n\nTes pièces t'attendent peut-être encore dans ton panier :\n${baseUrl}/panier\n\nUne question ? Réponds à cet e-mail.`,
});

export const cartReminderEmail = (baseUrl: string) => ({
  subject: "Ton panier t'attend",
  text: `Tu n'as pas terminé ta commande TakeUrClothes. Tes pièces sont encore dans ton panier, sur le même appareil :\n${baseUrl}/panier\n\nTu reçois cet e-mail parce que tu as demandé les nouveautés et les drops. Tu peux changer ce choix dans ton compte :\n${baseUrl}/compte/reglages`,
});
