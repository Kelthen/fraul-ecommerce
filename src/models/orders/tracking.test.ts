// Tests du suivi de commande : node --test src/models/orders/tracking.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { demoOrders } from "./demo.ts";
import { emailHtml, emailText } from "./email-html.ts";
import { EMAIL_KINDS, lineLabel, orderEmail } from "./emails.ts";
import { isClosed, orderFromRow, stepFromRow, type TrackingRow } from "./from-db.ts";
import { STAGES, STEPS, TRANSIT_DAYS, deliveryWindow, formatWindow, normalizeCode, trackingView } from "./tracking.ts";

const DAY = 86_400_000;
const paidAt = Date.UTC(2026, 9, 19, 12);
const days = (w: { from: number; to: number }) => [(w.from - paidAt) / DAY, (w.to - paidAt) / DAY];

test("4 étapes, et chaque point du suivi tombe dans l'une d'elles", () => {
  assert.deepEqual(STAGES.map((s) => s.label), ["Payée", "En cours de traitement", "En transit", "Livrée"]);
  for (const s of STEPS) assert.ok(STAGES.some((g) => g.id === s.stage), s.id);
  assert.equal(STEPS[0].stage, "traitement", "en traitement dès le paiement (Serge)");
});

test("fourchettes dans les objectifs : USA/UK < 10 j, Canada < 14 j, France ~14 j", () => {
  assert.deepEqual(days(deliveryWindow({ paidAt, zone: "us" })), [7, 10]);
  assert.deepEqual(days(deliveryWindow({ paidAt, zone: "uk" })), [7, 10]);
  assert.ok(days(deliveryWindow({ paidAt, zone: "ca" }))[1] <= 14);
  assert.ok(days(deliveryWindow({ paidAt, zone: "eu" }))[1] <= 14);
});

test("le fournisseur le plus lent recule la fourchette, jamais sous la préparation normale", () => {
  assert.deepEqual(days(deliveryWindow({ paidAt, zone: "us", prepDays: 5 })), [9, 12]);
  assert.deepEqual(days(deliveryWindow({ paidAt, zone: "us", prepDays: 1 })), [7, 10]);
});

test("une fois expédiée, la fourchette part de l'expédition", () => {
  const shippedAt = paidAt + 2 * DAY;
  const w = deliveryWindow({ paidAt, shippedAt, zone: "ca" });
  assert.equal(w.from, shippedAt + TRANSIT_DAYS.ca[0] * DAY);
});

test("fourchette écrite en clair, sur un ou deux mois", () => {
  const d = (m: number, j: number) => Date.UTC(2026, m, j, 12);
  assert.equal(formatWindow({ from: d(9, 28), to: d(10, 2) }, "UTC"), "entre le 28 oct. et le 2 nov.");
  assert.equal(formatWindow({ from: d(10, 3), to: d(10, 7) }, "UTC"), "entre le 3 et le 7 nov.");
});

test("vue du suivi : étape, phrase, remboursement, pas de fourchette une fois livré", () => {
  const [prep, transit, done] = demoOrders(paidAt);
  assert.equal(trackingView(prep).stage, 1);
  assert.match(trackingView(prep).text, /préparation/);
  assert.ok(trackingView(prep).window);
  assert.equal(trackingView(transit).stage, 2);
  assert.equal(trackingView(transit).refunds.length, 1);
  assert.equal(trackingView(done).stage, 3);
  assert.equal(trackingView(done).window, undefined);
});

test("code de suivi : tolère minuscules et espaces, refuse le reste", () => {
  assert.equal(normalizeCode(" tuc 1042 "), "TUC-1042");
  assert.equal(normalizeCode("TUC-1042"), "TUC-1042");
  assert.equal(normalizeCode("TUC-2026-000123"), "TUC-2026-000123");
  assert.equal(normalizeCode("tuc 2026 123"), "TUC-2026-000123");
  assert.equal(normalizeCode("FRL-2026-000008"), "FRL-2026-000008");
  for (const bad of ["", "1042", "TUC-", "ABC-1042", "TUC-12<script>"]) assert.equal(normalizeCode(bad), null, bad);
});

const row = (over: Partial<TrackingRow> = {}): TrackingRow => ({
  number: "TUC-2026-000123",
  status: "paid",
  created_at: "2026-11-03T12:00:00Z",
  price_snapshot: { zone: "ca" },
  order_items: [{ title: "Hoodie", size: "M", qty: 2 }],
  order_parcels: [{ forwarded_at: null, received_at: null }],
  shipments: [],
  ...over,
});
const parcel = (forwarded_at: string | null, received_at: string | null) => ({ forwarded_at, received_at });
const T = "2026-11-04T12:00:00Z";

test("base → suivi : l'étape suit les colis, puis le transport", () => {
  assert.equal(stepFromRow(row()), "paid");
  assert.equal(stepFromRow(row({ order_parcels: [parcel(T, null), parcel(null, null)] })), "preparing");
  assert.equal(stepFromRow(row({ order_parcels: [parcel(T, T), parcel(T, null)] })), "preparing");
  assert.equal(stepFromRow(row({ order_parcels: [parcel(T, T), parcel(T, T)] })), "gathered");
  assert.equal(stepFromRow(row({ status: "supplier_confirmed" })), "preparing");
  assert.equal(stepFromRow(row({ shipments: [{ status: "shipped", shipped_at: T, delivered_at: null }] })), "shipped");
  assert.equal(stepFromRow(row({ shipments: [{ status: "customs", shipped_at: T, delivered_at: null }] })), "customs");
  assert.equal(stepFromRow(row({ shipments: [{ status: "delivered", shipped_at: T, delivered_at: T }] })), "delivered");
  assert.equal(stepFromRow(row({ status: "shipped" })), "shipped", "le statut de la commande suffit si l'envoi manque");
});

test("base → suivi : le client ne reçoit ni adresse, ni prix, ni fournisseur", () => {
  const o = orderFromRow(row({ shipments: [{ status: "shipped", shipped_at: T, delivered_at: null }] }));
  assert.deepEqual(Object.keys(o).sort(), ["deliveredAt", "id", "lines", "paidAt", "shippedAt", "step", "zone"]);
  assert.equal(o.id, "TUC-2026-000123");
  assert.equal(o.zone, "ca");
  assert.equal(o.shippedAt, Date.parse(T));
  assert.deepEqual(o.lines, [{ name: "Hoodie", brand: "", size: "M", qty: 2 }]);
  assert.equal(lineLabel(o.lines[0]), "Hoodie · M · ×2");
});

test("base → suivi : zone inconnue = zone par défaut, commande annulée = plus de suivi", () => {
  assert.ok(orderFromRow(row({ price_snapshot: {} })).zone);
  assert.ok(orderFromRow(row({ price_snapshot: { zone: "xx" } })).zone !== ("xx" as string));
  assert.ok(isClosed("cancelled") && isClosed("refunded") && !isClosed("paid"));
});

test("e-mails : 4 sortes, jamais de pays ni de prix barré, toujours un lien", () => {
  const [prep, transit] = demoOrders(paidAt);
  for (const k of EMAIL_KINDS) {
    const m = orderEmail(k, k === "unavailable" ? transit : prep, { timeZone: "UTC" });
    const text = [m.subject, m.preheader, m.title, ...m.body].join(" ");
    assert.doesNotMatch(text, /USA|Canada|France|Belgique|Royaume|Chine/, k);
    assert.ok(m.cta.href.startsWith("/"), k);
    assert.doesNotMatch(text, /\.\./, `${k} : pas de double point`);
  }
  const un = orderEmail("unavailable", transit);
  assert.equal(un.lines.length, 1);
  assert.equal(un.lines[0].name, "Casquette");
  assert.ok(!orderEmail("paid", transit).lines.some((l) => l.refundedAt), "la pièce remboursée sort de la liste");
});

test("e-mail mis en forme : lien complet, texte protégé, version texte", () => {
  const [o] = demoOrders(paidAt);
  const m = orderEmail("paid", { ...o, id: "TUC-2026-000123", lines: [{ name: "Hoodie <b>", brand: "", size: "M", qty: 1 }] });
  const html = emailHtml(m, "https://exemple.com/");
  assert.ok(html.includes('href="https://exemple.com/suivi?code=TUC-2026-000123"'));
  assert.ok(html.includes("Hoodie &lt;b&gt; · M"));
  assert.ok(!html.includes("Hoodie <b>"));
  const text = emailText(m, "https://exemple.com");
  assert.ok(text.includes("Suivre ma commande : https://exemple.com/suivi?code=TUC-2026-000123"));
  assert.ok(text.includes("Hoodie <b> · M"));
});
