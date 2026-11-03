// Tests de l'alerte de paiement : node --test src/models/payment/alert.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { unrecordedPaymentAlert } from "./alert.ts";

test("alerte : montant, e-mail et session, texte protégé", () => {
  const m = unrecordedPaymentAlert({ id: "cs_live_abc", amount_total: 18900, currency: "cad", customer_details: { email: "a<b>@ex.co" } });
  assert.match(m, /189\.00 CAD/);
  assert.match(m, /cs_live_abc/);
  assert.match(m, /a&lt;b&gt;@ex\.co/);
  assert.ok(!m.includes("<b>@ex"));
});

test("alerte : même sans montant ni e-mail", () => {
  const m = unrecordedPaymentAlert({ id: "cs_live_x", amount_total: null, currency: null, customer_details: null });
  assert.match(m, /montant inconnu/);
  assert.match(m, /e-mail inconnu/);
});
