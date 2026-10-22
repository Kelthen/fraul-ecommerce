// Tests du relais des commandes : node --test src/models/relay/relay.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeOrderNumber, normalizeTrackingCode, parseTrackingMessage } from "./codes.ts";
import { commandOf, isGroupChat, parseAllowedUsers } from "./access.ts";
import {
  confirmedCard,
  esc,
  messageLink,
  orderButtons,
  orderMessage,
  orderTitle,
  parcelStatusLine,
  supplierBlock,
  todoButtons,
  todoMessage,
  trackingCard,
  undoButtons,
  undoCodeQuestion,
  undoQuestion,
  undoableStep,
  type RelayOrder,
} from "./messages.ts";
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
    { id: "p2", supplier: "Fournisseur B", lines: [{ title: "Hoodie <logo>", brand: "Trapstar", color: "noir", size: "M", qty: 1 }], forwardedAt: "2026-10-21T16:04:00Z", forwardedBy: "Serge" },
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
  assert.equal((m.match(/À envoyer :/g) ?? []).length, 1, "B est déjà envoyé");
  assert.match(m, /📤 Envoyé : Fournisseur B/);
  assert.ok(!m.includes("<logo>"));
});

test("boutons : seulement la prochaine étape ; ↩️ Corriger 15 min, avec confirmation", () => {
  const t = Date.parse("2026-10-21T16:10:00Z");
  const b = orderButtons(order, t);
  assert.deepEqual(b[0], [{ text: "📤 J'ai envoyé à Fournisseur A", data: "fwd:p1" }], "rien à corriger sur A");
  assert.equal(b[1][0].data, "rcv:p2", "secours si l'expéditeur ne coche pas");
  assert.equal(b[1][1].data, "unq:p2", "↩️ demande d'abord confirmation");
  assert.equal(orderButtons(order, t + 20 * 60_000)[1].length, 1, "plus de ↩️ après 15 min");
  const q = undoQuestion("FRL-2026-000123", { id: "p2", supplier: "Fournisseur B" }, "forwarded");
  assert.match(q.text, /annuler « envoyé au fournisseur » pour <b>Fournisseur B<\/b>/);
  assert.deepEqual(q.buttons.flat().map((x) => x.data), ["unf:p2:f", "keep:p2"], "l'étape est dans le bouton (double-tap sans effet)");
  const uuid = "123e4567-e89b-12d3-a456-426614174000";
  for (const data of [...b.flat().map((x) => x.data), `unq:${uuid}`, `unf:${uuid}:r`, `keep:${uuid}`, `rsd:${uuid}`, `keepc:${uuid}`, `undq:${uuid}`])
    assert.ok(Buffer.byteLength(data) <= 64, "limite Telegram de 64 octets");
});

test("aucun bouton qui reste après validation", () => {
  const t = Date.parse("2026-10-23T18:00:00Z");
  const done = { parcels: order.parcels.map((p) => ({ ...p, forwardedAt: "2026-10-21T16:04:00Z", receivedAt: "2026-10-23T13:00:00Z" })) };
  assert.deepEqual(orderButtons(done, t), [], "tout reçu depuis longtemps : plus aucun bouton");
  const justNow = { parcels: [{ ...done.parcels[0], receivedAt: "2026-10-23T17:55:00Z", receivedBy: "l'expéditeur" }] };
  assert.deepEqual(orderButtons(justNow, t), [[{ text: "↩️ Corriger : Fournisseur A", data: "unq:p1" }]], "seulement Corriger, 15 min");
  assert.deepEqual(undoButtons("s1"), [[{ text: "↩️ Corriger (15 min)", data: "undq:s1" }]]);
  assert.deepEqual(undoCodeQuestion("LP1", "FRL-1", "s1").buttons.flat().map((x) => x.data), ["undo:s1", "keepc:s1"]);
});

test("carte de suivi : avertit s'il manque un colis, ne promet rien au client", () => {
  const card = { number: "FRL-2026-000123", firstName: "Awa", city: "Paris", articles: 2, isDemo: false };
  assert.match(trackingCard("LP123456789CN", { ...card, missing: ["Fournisseur B"] }), /⚠️ Pas encore reçu chez l'expéditeur : <b>Fournisseur B<\/b>/);
  assert.ok(!trackingCard("LP123456789CN", { ...card, missing: [] }).includes("⚠️"));
  const c = confirmedCard("LP123456789CN", card, "Serge");
  assert.match(c, /✅ <b>Code enregistré<\/b> \(Serge\)/);
  assert.ok(!/client est prévenu/i.test(c));
});

test("annulation : le dernier geste, jamais plus vieux que 15 min", () => {
  const t = Date.parse("2026-10-21T16:10:00Z");
  assert.equal(undoableStep({ forwardedAt: "2026-10-21T16:00:00Z" }, t), "forwarded");
  assert.equal(undoableStep({ forwardedAt: "2026-10-21T15:00:00Z", receivedAt: "2026-10-21T16:05:00Z" }, t), "received");
  assert.equal(undoableStep({ forwardedAt: "2026-10-21T16:05:00Z", receivedAt: "2026-10-21T15:00:00Z" }, t), null, "reçu trop ancien");
  assert.equal(undoableStep({}, t), null);
});

test("lignes d'état et titre : ce qui est fait, par qui, ce qui reste", () => {
  assert.match(parcelStatusLine(order.parcels[0]), /⏳ <b>Fournisseur A<\/b> : à envoyer au fournisseur/);
  const l = parcelStatusLine(order.parcels[1]);
  assert.match(l, /📤 <b>Fournisseur B<\/b> : envoyé au fournisseur 21 oct\. à 12:04 \(Serge\)/, "heure de Toronto");
  assert.match(orderTitle(order), /Nouvelle commande/);
  const all = { ...order, parcels: order.parcels.map((p) => ({ ...p, forwardedAt: "2026-10-21T16:04:00Z" })) };
  assert.match(orderTitle(all), /Tout envoyé aux fournisseurs · FRL-2026-000123/);
  const recv = { ...order, parcels: order.parcels.map((p) => ({ ...p, forwardedAt: "2026-10-21T16:04:00Z", receivedAt: "2026-10-23T13:00:00Z" })) };
  assert.match(orderTitle(recv), /Tous les colis reçus/);
  assert.match(parcelStatusLine({ ...order.parcels[0], supplier: "<A>", receivedAt: "2026-10-23T13:00:00Z", receivedBy: "Rha<mone" }), /📥 <b>&lt;A&gt;<\/b> : reçu chez l'expéditeur .*\(Rha&lt;mone\)/);
});

test("/afaire : à transférer, puis à recevoir ; liens en groupe, boutons sinon", () => {
  assert.equal(messageLink(-1001234567890, 42), "https://t.me/c/1234567890/42");
  assert.equal(messageLink(6639441546, 42), null, "conversation privée : pas de lien");
  assert.equal(messageLink(null, null), null);
  const list = [
    { orderId: "o1", number: "FRL-2026-000002", isDemo: true, link: null, toForward: ["A", "B"], toReceive: [] },
    { orderId: "o2", number: "FRL-2026-000005", isDemo: false, link: "https://t.me/c/1/9", toForward: ["A"], toReceive: ["B"] },
  ];
  const m = todoMessage(list);
  assert.match(m, /3 blocs à envoyer aux fournisseurs/);
  assert.match(m, /FRL-2026-000002 \(test\) → A, B/);
  assert.match(m, /<a href="https:\/\/t\.me\/c\/1\/9">FRL-2026-000005<\/a> → A/);
  assert.match(m, /1 colis attendu chez l'expéditeur/);
  assert.deepEqual(todoButtons(list), [[{ text: "🔁 FRL-2026-000002", data: "rsd:o1" }]]);
  assert.match(todoMessage([]), /Rien en attente/);
});

test("accès : conversation privée ou groupe, comptes autorisés", () => {
  assert.deepEqual(parseAllowedUsers(undefined, 6639441546), [6639441546], "privé : le titulaire");
  assert.deepEqual(parseAllowedUsers("", -1001234567890), [], "groupe sans liste : personne");
  assert.deepEqual(parseAllowedUsers(" 6639441546, 123456789;123456789 x", -100123), [6639441546, 123456789]);
  assert.ok(isGroupChat(-100123) && !isGroupChat(42));
  assert.equal(commandOf("/afaire@FraulservicesBot"), "/afaire");
  assert.equal(commandOf("/AIDE stp"), "/aide");
  assert.equal(commandOf("FRL-2026-000001 → LP123456789CN"), null);
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
