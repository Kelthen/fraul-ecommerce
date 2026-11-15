// Tests du webhook Stripe : node --test src/models/payment/webhook.test.ts
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { isHandledEvent, isPaidEvent, verifySignature } from "./webhook.ts";

const SECRET = "whsec_test";
const NOW = 1_800_000_000_000;
const BODY = '{"type":"checkout.session.completed"}';
const sign = (body: string, t: number, secret = SECRET) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
const T = NOW / 1000;

test("signature valide acceptée, y compris à côté d'une ancienne signature", () => {
  assert.ok(verifySignature(BODY, sign(BODY, T), SECRET, NOW));
  assert.ok(verifySignature(BODY, `${sign(BODY, T)},v1=${"0".repeat(64)}`, SECRET, NOW));
});

test("signature refusée : corps modifié, autre secret, en-tête absent ou illisible", () => {
  assert.ok(!verifySignature(`${BODY} `, sign(BODY, T), SECRET, NOW));
  assert.ok(!verifySignature(BODY, sign(BODY, T, "whsec_autre"), SECRET, NOW));
  assert.ok(!verifySignature(BODY, null, SECRET, NOW));
  assert.ok(!verifySignature(BODY, "n'importe quoi", SECRET, NOW));
  assert.ok(!verifySignature(BODY, `t=${T}`, SECRET, NOW));
});

test("signature refusée si elle a plus de 5 minutes, dans les deux sens", () => {
  assert.ok(verifySignature(BODY, sign(BODY, T - 299), SECRET, NOW));
  assert.ok(!verifySignature(BODY, sign(BODY, T - 301), SECRET, NOW));
  assert.ok(!verifySignature(BODY, sign(BODY, T + 301), SECRET, NOW));
});

test("événements : le paiement réussi enregistre la commande, les 4 autres ont leur traitement, le reste est ignoré", () => {
  assert.ok(isPaidEvent("checkout.session.completed") && isPaidEvent("checkout.session.async_payment_succeeded"));
  for (const t of ["checkout.session.async_payment_failed", "checkout.session.expired", "charge.refunded", "charge.dispute.created"]) {
    assert.ok(isHandledEvent(t), t);
    assert.ok(!isPaidEvent(t), t);
  }
  assert.ok(!isHandledEvent("payment_intent.payment_failed"));
});
