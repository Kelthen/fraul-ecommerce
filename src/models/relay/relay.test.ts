// Tests du relais des commandes : node --test src/models/relay/relay.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeOrderNumber, normalizeTrackingCode, parseTrackingMessage } from "./codes.ts";
import { esc, orderButtons, orderMessage, supplierBlock, trackingCard, type RelayOrder } from "./messages.ts";
import { orderStatusOf, pileOf } from "./piles.ts";

test("numéros de commande : formats long et court, jamais deviné", () => {
  assert.equal(normalizeOrderNumber("FRL-2026-000123"), "FRL-2026-000123");
  assert.equal(normalizeOrderNumber("frl 2026 123"), "FRL-2026-000123");
  assert.equal(normalizeOrderNumber("FRL-1042"), "FRL-1042");
  assert.equal(normalizeOrderNumber("1042"), null);
  assert.equal(normalizeOrderNumber("FRL-"), null);
});

test("codes de suivi : formats courants acceptés, mots refusés", () => {
  assert.equal(normalizeTrackingCode("lp123456789cn"), "LP123456789CN");
  assert.equal(normalizeTrackingCode("YT 2412 3456 7890 1234"), "YT2412345678901234");
  assert.equal(normalizeTrackingCode("1Z999AA10123456784"), "1Z999AA10123456784");
  assert.equal(normalizeTrackingCode("expedie"), null, "pas de chiffre");
  assert.equal(normalizeTrackingCode("12345"), null, "trop court");
});

test("un message transféré : une paire par ligne, séparateurs libres", () => {
  const r = parseTrackingMessage("FRL-2026-000123 → LP123456789CN\nfrl-1042: YT2412345678901234\nFRL 2026 7 = 1Z999AA10123456784");
  assert.deepEqual(r.pairs, [
    { order: "FRL-2026-000123", code: "LP123456789CN" },
    { order: "FRL-1042", code: "YT2412345678901234" },
    { order: "FRL-2026-000007", code: "1Z999AA10123456784" },
  ]);
  assert.deepEqual(r.rejected, []);
});

test("jamais de commande devinée : ligne sans numéro FRL ou sans code → rejetée", () => {
  const r = parseTrackingMessage("LP123456789CN\nFRL-2026-000123\nFRL-2026-000124 LP111111111CN LP222222222CN");
  assert.deepEqual(r.pairs, []);
  assert.equal(r.rejected.length, 3);
});

test("même commande avec deux codes différents → les deux refusés", () => {
  const r = parseTrackingMessage("FRL-2026-000123 → LP123456789CN\nFRL-2026-000123 → LP999999999CN\nFRL-2026-000124 → LP555555555CN");
  assert.deepEqual(r.pairs, [{ order: "FRL-2026-000124", code: "LP555555555CN" }]);
  assert.equal(r.rejected.length, 2);
});

const order: RelayOrder = {
  number: "FRL-2026-000123",
  isDemo: true,
  total: "358 USD",
  margin: "142 USD",
  firstName: "Awa",
  city: "Paris",
  sheetUrl: "https://exemple.test/f/abc",
  sheetExpires: "28 oct.",
  parcels: [
    { id: "p1", supplier: "Fournisseur A", lines: [{ title: "Tech Fleece veste", brand: "Nike", color: "noir", size: "L", qty: 1, supplierRef: "A-88213" }] },
    { id: "p2", supplier: "Fournisseur B", lines: [{ title: "Hoodie <logo>", brand: "Trapstar", color: "noir", size: "M", qty: 1 }], forwardedAt: "x" },
  ],
};

test("bloc à transférer : ni prix, ni adresse, ni nom du client", () => {
  const b = supplierBlock(order.number, order.parcels[0]);
  assert.match(b, /FRL-2026-000123/);
  assert.match(b, /A-88213/);
  for (const secret of ["358", "142", "USD", "Awa", "Paris"]) assert.ok(!b.includes(secret), secret);
});

test("message à Jean Paul : prix et marge pour lui, HTML échappé, un bloc par fournisseur", () => {
  const m = orderMessage(order);
  assert.match(m, /COMMANDE TEST/);
  assert.match(m, /358 USD/);
  assert.match(m, /Hoodie &lt;logo&gt;/);
  assert.equal((m.match(/À transférer/g) ?? []).length, 2);
  assert.ok(!m.includes("<logo>"));
});

test("boutons : transféré, puis colis reçu", () => {
  const b = orderButtons(order);
  assert.equal(b[0][0].data, "fwd:p1");
  assert.equal(b[1][0].data, "rcv:p2");
  assert.ok(b.flat().every((x) => Buffer.byteLength(x.data) <= 64), "limite Telegram de 64 octets");
});

test("carte de vérification : prénom + ville seulement", () => {
  const c = trackingCard("LP123456789CN", { number: "FRL-2026-000123", firstName: "Awa", city: "Paris", articles: 2, isDemo: false });
  assert.match(c.replace(/<[^>]+>/g, ""), /FRL-2026-000123 · Awa · Paris · 2 articles/);
  assert.equal(esc("a<b"), "a&lt;b");
});

const HOUR = 3_600_000;
const now = Date.UTC(2026, 9, 20, 12);

test("piles : à transférer, en attente, en retard, expédiée", () => {
  const fresh = { paidAt: now - HOUR, parcels: [{ supplier: "A" }] };
  assert.equal(pileOf(fresh, now).pile, "a_transferer");
  const waiting = { paidAt: now - 2 * 24 * HOUR, parcels: [{ supplier: "A", forwardedAt: now - HOUR }] };
  assert.equal(pileOf(waiting, now).pile, "en_attente");
  const late = { paidAt: now - 5 * 24 * HOUR, parcels: [{ supplier: "A", forwardedAt: now - 4 * 24 * HOUR }, { supplier: "B", forwardedAt: 1, receivedAt: 1 }] };
  const r = pileOf(late, now);
  assert.equal(r.pile, "en_retard");
  assert.match(r.reasons[0], /A depuis plus de 4 jours/);
  assert.equal(pileOf({ ...late, shippedAt: now }, now).pile, "expediee");
  assert.equal(pileOf({ paidAt: now - 30 * HOUR, parcels: [{ supplier: "A" }] }, now).pile, "en_retard", "pas transférée après 24 h");
});

test("statut de commande selon les colis", () => {
  assert.equal(orderStatusOf({ paidAt: 0, parcels: [{ supplier: "A" }, { supplier: "B", forwardedAt: 1 }] }), "paid");
  assert.equal(orderStatusOf({ paidAt: 0, parcels: [{ supplier: "A", forwardedAt: 1 }, { supplier: "B", forwardedAt: 1 }] }), "sent_to_supplier");
  assert.equal(orderStatusOf({ paidAt: 0, parcels: [{ supplier: "A", forwardedAt: 1, receivedAt: 2 }] }), "supplier_confirmed");
  assert.equal(orderStatusOf({ paidAt: 0, shippedAt: 3, parcels: [] }), "shipped");
});
