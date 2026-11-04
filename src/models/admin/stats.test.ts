// Tests du tableau de bord : node --test src/models/admin/stats.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { salesByCurrency, topItems, type SaleOrder } from "./stats.ts";

const NOW = Date.parse("2026-11-04T18:00:00Z");
const ago = (days: number) => new Date(NOW - days * 86_400_000).toISOString();
const o = (p: Partial<SaleOrder>): SaleOrder => ({ total: 10000, currency: "USD", status: "paid", isDemo: false, createdAt: ago(0.1), margin: 4000, items: [{ title: "Hoodie", qty: 1 }], ...p });

test("ventes par devise : test, non payées et remboursées exclues ; jamais USD + EUR mélangés", () => {
  const orders = [
    o({}),
    o({ total: 20000, margin: 8000 }),
    o({ currency: "EUR", total: 9000 }),
    o({ isDemo: true }),
    o({ status: "pending_payment" }),
    o({ status: "refunded" }),
    o({ createdAt: ago(3) }),
  ];
  const today = salesByCurrency(orders, 1, NOW);
  assert.deepEqual(today.find((t) => t.currency === "USD"), { currency: "USD", orders: 2, total: 30000, average: 15000, margin: 12000 });
  assert.equal(today.find((t) => t.currency === "EUR")!.orders, 1);
  assert.equal(salesByCurrency(orders, 7, NOW).find((t) => t.currency === "USD")!.orders, 3);
});

test("meilleurs articles : en pièces, sur la période", () => {
  const orders = [o({ items: [{ title: "Short", qty: 3 }] }), o({ items: [{ title: "Hoodie", qty: 2 }] }), o({ items: [{ title: "Short", qty: 1 }], createdAt: ago(40) })];
  assert.deepEqual(topItems(orders, 30, 5, NOW), [{ title: "Short", qty: 3 }, { title: "Hoodie", qty: 2 }]);
});
