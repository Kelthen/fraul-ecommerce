// Commande de la base → commande du suivi client. Pur (testé dans tracking.test.ts).
// Le client ne reçoit que ceci : ni adresse, ni prix, ni fournisseur.
import { DEFAULT_ZONE, ZONES, type ZoneId } from "../pricing/config.ts";
import type { Order, StepId } from "./tracking.ts";

export type TrackingRow = {
  number: string;
  status: string;
  created_at: string;
  price_snapshot: { zone?: string } | null;
  order_items: { title: string; size: string | null; qty: number }[];
  order_parcels: { forwarded_at: string | null; received_at: string | null }[];
  shipments: { status: string; shipped_at: string | null; delivered_at: string | null }[];
};

/** Annulée ou remboursée : plus de suivi à montrer. */
export const isClosed = (status: string) => status === "cancelled" || status === "refunded";

const TRANSPORT: Record<string, StepId> = {
  shipped: "shipped",
  exception: "shipped",
  in_transit: "flying",
  customs: "customs",
  out_for_delivery: "out",
  delivered: "delivered",
};

/** Le colis fait foi une fois parti ; avant, ce sont les colis attendus chez l'expéditeur. */
export function stepFromRow(o: Pick<TrackingRow, "status" | "order_parcels" | "shipments">): StepId {
  const moved = o.shipments.map((s) => TRANSPORT[s.status]).find(Boolean) ?? TRANSPORT[o.status];
  if (moved) return moved;
  const parcels = o.order_parcels;
  if (parcels.length && parcels.every((p) => p.received_at)) return "gathered";
  if (parcels.some((p) => p.forwarded_at || p.received_at) || o.status === "sent_to_supplier" || o.status === "supplier_confirmed") return "preparing";
  return "paid";
}

const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : undefined);

export function orderFromRow(o: TrackingRow): Order {
  const z = o.price_snapshot?.zone;
  const zone: ZoneId = z && z in ZONES ? (z as ZoneId) : DEFAULT_ZONE;
  return {
    id: o.number,
    paidAt: new Date(o.created_at).getTime(),
    shippedAt: time(o.shipments.find((s) => s.shipped_at)?.shipped_at),
    deliveredAt: time(o.shipments.find((s) => s.delivered_at)?.delivered_at),
    zone,
    step: stepFromRow(o),
    lines: o.order_items.map((l) => ({ name: l.title, brand: "", size: l.size ?? undefined, qty: l.qty })),
  };
}
