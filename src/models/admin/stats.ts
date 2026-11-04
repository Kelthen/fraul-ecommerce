// Chiffres du tableau de bord de Jean Paul : ventes, panier moyen, marge, meilleurs articles.
// Pur, sans base (testé dans stats.test.ts). Les commandes de test et les commandes non payées ne comptent jamais.

export type SaleOrder = {
  total: number; // centimes
  currency: string;
  status: string;
  isDemo: boolean;
  createdAt: string; // ISO
  margin: number | null; // centimes, marge estimée figée à la commande
  items: { title: string; qty: number }[];
};

const NOT_SOLD = ["pending_payment", "cancelled", "refunded"];

export type Period = { label: string; days: number };
export const PERIODS: Period[] = [
  { label: "Aujourd'hui", days: 1 },
  { label: "7 jours", days: 7 },
  { label: "30 jours", days: 30 },
];

export type CurrencyTotal = { currency: string; orders: number; total: number; average: number; margin: number };

/** Ventes réelles d'une période, une ligne par devise (on n'additionne jamais des USD et des EUR). */
export function salesByCurrency(orders: SaleOrder[], days: number, now = Date.now()): CurrencyTotal[] {
  const from = now - days * 86_400_000;
  const by = new Map<string, CurrencyTotal>();
  for (const o of orders) {
    if (o.isDemo || NOT_SOLD.includes(o.status) || Date.parse(o.createdAt) < from) continue;
    const t = by.get(o.currency) ?? { currency: o.currency, orders: 0, total: 0, average: 0, margin: 0 };
    t.orders += 1;
    t.total += o.total;
    t.margin += o.margin ?? 0;
    by.set(o.currency, t);
  }
  return [...by.values()].map((t) => ({ ...t, average: Math.round(t.total / t.orders) })).sort((a, b) => b.total - a.total);
}

/** Articles les plus vendus (en pièces) sur la période. */
export function topItems(orders: SaleOrder[], days: number, limit = 5, now = Date.now()): { title: string; qty: number }[] {
  const from = now - days * 86_400_000;
  const by = new Map<string, number>();
  for (const o of orders) {
    if (o.isDemo || NOT_SOLD.includes(o.status) || Date.parse(o.createdAt) < from) continue;
    for (const i of o.items) by.set(i.title, (by.get(i.title) ?? 0) + i.qty);
  }
  return [...by.entries()]
    .map(([title, qty]) => ({ title, qty }))
    .sort((a, b) => b.qty - a.qty || a.title.localeCompare(b.title, "fr"))
    .slice(0, limit);
}
