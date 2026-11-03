// Alerte à l'équipe : l'argent est passé, mais la commande n'a pas pu être enregistrée. Pur (testé dans alert.test.ts).
import { esc } from "../relay/messages.ts";

export function unrecordedPaymentAlert(s: { id: string; amount_total: number | null; currency: string | null; customer_details: { email: string | null } | null }): string {
  const amount = s.amount_total != null ? `${(s.amount_total / 100).toFixed(2)} ${(s.currency ?? "").toUpperCase()}` : "montant inconnu";
  return (
    `🚨 <b>Paiement encaissé, commande NON enregistrée</b>\n` +
    `${esc(amount)} · ${esc(s.customer_details?.email ?? "e-mail inconnu")}\n` +
    `Session Stripe : <code>${esc(s.id)}</code>\n` +
    `La base ne répond pas. Vérifier Supabase, puis ouvrir Stripe : le paiement y est bien.`
  );
}
