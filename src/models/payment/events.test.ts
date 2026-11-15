// Tests des événements Stripe : node --test src/models/payment/events.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { cartReminderEmail, disputeAlert, paymentFailedAlert, paymentFailedEmail, refundAlert, refundStatus, type Charge } from "./events.ts";

const charge: Charge = { id: "ch_1", amount: 17900, amount_refunded: 17900, currency: "cad", refunded: true, payment_intent: "pi_1" };

test("remboursement entier ou partiel", () => {
  assert.equal(refundStatus(charge), "refunded");
  assert.equal(refundStatus({ ...charge, refunded: false, amount_refunded: 5000 }), "partially_refunded");
  assert.match(refundAlert(charge, "TUC-2026-000001", true), /Commande remboursée[\s\S]*179\.00 CAD[\s\S]*TUC-2026-000001/);
  assert.match(refundAlert({ ...charge, refunded: false, amount_refunded: 5000 }, "TUC-2026-000001", true), /Remboursement partiel[\s\S]*50\.00 CAD sur 179\.00 CAD/);
});

test("alerte sans commande trouvée : on le dit, et le mode test est signalé", () => {
  assert.match(refundAlert(charge, null, false), /\(test\)[\s\S]*Aucune commande/);
});

test("litige : montant, motif échappé, date limite", () => {
  const a = disputeAlert({ id: "dp_1", amount: 17900, currency: "cad", reason: "<fraude>", payment_intent: "pi_1", evidence_details: { due_by: 1_800_000_000 } }, "TUC-1", true);
  assert.match(a, /Litige[\s\S]*&lt;fraude&gt;[\s\S]*avant le/);
  assert.match(disputeAlert({ id: "dp_1", amount: 1, currency: "usd", reason: "general", payment_intent: null }, null, true), /au plus vite/);
});

test("paiement échoué : l'alerte dit si une commande est annulée", () => {
  const s = { id: "cs_1", amount_total: 100, currency: "usd", customer_details: { email: "a@b.c" } };
  assert.match(paymentFailedAlert(s, "TUC-1", true), /TUC-1<\/code> annulée/);
  assert.match(paymentFailedAlert(s, null, true), /Aucune commande/);
});

test("e-mails au client : lien vers le panier, et la relance dit pourquoi elle arrive", () => {
  assert.match(paymentFailedEmail("https://x.com").text, /https:\/\/x\.com\/panier/);
  const r = cartReminderEmail("https://x.com").text;
  assert.match(r, /nouveautés et les drops/);
  assert.match(r, /compte\/reglages/);
});
