// Commandes de démonstration (aucune vraie commande avant le branchement de Supabase et de Stripe).
// Les dates partent de « maintenant » pour que la démo reste crédible quel que soit le jour.
import type { Order } from "./tracking.ts";

const DAY = 86_400_000;

export function demoOrders(now: number): Order[] {
  return [
    {
      id: "FRL-1042",
      paidAt: now - 1 * DAY,
      zone: "us",
      step: "preparing",
      lines: [
        { name: "Tech Fleece hoodie", brand: "Nike", size: "M", qty: 1 },
        { name: "Air Max 90", brand: "Nike", size: "42", qty: 1 },
      ],
    },
    {
      id: "FRL-1031",
      paidAt: now - 6 * DAY,
      shippedAt: now - 2 * DAY,
      zone: "us",
      step: "flying",
      lines: [
        { name: "Hoodie logo", brand: "Amiri", size: "L", qty: 1 },
        { name: "Casquette", brand: "Amiri", qty: 1, refundedAt: now - 4 * DAY },
      ],
    },
    {
      id: "FRL-1017",
      paidAt: now - 16 * DAY,
      shippedAt: now - 12 * DAY,
      deliveredAt: now - 5 * DAY,
      zone: "us",
      step: "delivered",
      lines: [{ name: "Veste en cuir", brand: "Represent", size: "M", qty: 1 }],
    },
  ];
}

export const findDemoOrder = (id: string, now: number) => demoOrders(now).find((o) => o.id === id);
