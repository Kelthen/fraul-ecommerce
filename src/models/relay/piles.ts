// Tableau de bord de Fraul : chaque commande payée tombe dans une pile (docs/PARCOURS-COMMANDE.md §3).
// « à transférer » → « en attente » (colis ou code de suivi) → expédiée ; « en retard » passe devant tout.
// Pur : l'heure est passée en paramètre (testé dans piles.test.ts).

export const FORWARD_ALERT_HOURS = 24; // commande non transférée aux fournisseurs
export const PARCEL_ALERT_DAYS = 4; // colis d'un fournisseur pas reçu chez l'expéditeur (§7.2, Serge)
export const TRACKING_ALERT_DAYS = 6; // tous les colis reçus mais toujours pas de code de suivi

export type PileId = "a_transferer" | "en_attente" | "en_retard" | "expediee";

export const PILES: { id: PileId; label: string }[] = [
  { id: "en_retard", label: "En retard" },
  { id: "a_transferer", label: "À envoyer aux fournisseurs" },
  { id: "en_attente", label: "En attente (colis ou suivi)" },
  { id: "expediee", label: "Expédiées" },
];

export type PileOrder = {
  paidAt: number;
  shippedAt?: number | null;
  parcels: { supplier: string; forwardedAt?: number | null; receivedAt?: number | null }[];
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function pileOf(o: PileOrder, now: number): { pile: PileId; reasons: string[] } {
  if (o.shippedAt) return { pile: "expediee", reasons: [] };
  const reasons: string[] = [];
  const age = now - o.paidAt;
  const notForwarded = o.parcels.filter((p) => !p.forwardedAt);
  const notReceived = o.parcels.filter((p) => !p.receivedAt);
  if (notForwarded.length && age > FORWARD_ALERT_HOURS * HOUR)
    reasons.push(`Pas encore envoyée à ${notForwarded.map((p) => p.supplier).join(", ")} (plus de ${FORWARD_ALERT_HOURS} h)`);
  if (notReceived.length && age > PARCEL_ALERT_DAYS * DAY)
    reasons.push(`Colis attendu de ${notReceived.map((p) => p.supplier).join(", ")} depuis plus de ${PARCEL_ALERT_DAYS} jours`);
  if (!notReceived.length && age > TRACKING_ALERT_DAYS * DAY) reasons.push(`Tout est reçu mais pas de code de suivi après ${TRACKING_ALERT_DAYS} jours`);
  if (reasons.length) return { pile: "en_retard", reasons };
  return { pile: notForwarded.length ? "a_transferer" : "en_attente", reasons };
}

/** Statut de la commande (enum SQL `order_status`) selon l'avancement des colis. */
export function orderStatusOf(o: PileOrder): "paid" | "sent_to_supplier" | "supplier_confirmed" | "shipped" {
  if (o.shippedAt) return "shipped";
  if (o.parcels.length && o.parcels.every((p) => p.receivedAt)) return "supplier_confirmed";
  if (o.parcels.length && o.parcels.every((p) => p.forwardedAt)) return "sent_to_supplier";
  return "paid";
}
