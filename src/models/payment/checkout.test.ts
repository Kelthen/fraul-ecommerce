// Tests du paiement : node --test src/models/payment/checkout.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { customerPrice } from "../pricing/price.ts";
import { MAX_QTY, ONE_SIZE, checkoutParams, countriesOf, packCart, priceCart, unpackCart, type PayableProduct } from "./checkout.ts";

const HOODIE: PayableProduct = { slug: "trapstar-hoodie-noir", name: "Hoodie", brandName: "Trapstar", cost: { cny: 300, g: 700 }, colors: ["#141416"], sizes: ["S", "M", "L"] };
const CAP: PayableProduct = { slug: "nike-casquette", name: "Casquette", brandName: "Nike", cost: { cny: 90, g: 150 }, colors: ["#141416", "#F1ECE0"], sizes: [] };
const find = (slug: string) => [HOODIE, CAP].find((p) => p.slug === slug);

test("le prix vient du catalogue, jamais du navigateur", () => {
  const r = priceCart([{ slug: HOODIE.slug, color: "#141416", size: "M", qty: 2, price: 1 }], "eu", find);
  assert.ok(r.ok);
  const unit = Math.round(customerPrice(HOODIE.cost, "eu") * 100);
  assert.equal(r.lines[0].unitPrice, unit);
  assert.equal(r.total, unit * 2);
  assert.equal(r.currency, "EUR");
  assert.equal(r.lines[0].title, "Trapstar · Hoodie");
});

test("panier refusé : vide, produit inconnu, taille ou couleur inexistante, quantité folle", () => {
  assert.deepEqual(priceCart([], "us", find), { ok: false, problem: "empty" });
  assert.deepEqual(priceCart("x", "us", find), { ok: false, problem: "empty" });
  assert.deepEqual(priceCart([{ slug: "inconnu", color: "#141416", qty: 1 }], "us", find), { ok: false, problem: "unknown-product" });
  assert.deepEqual(priceCart([{ slug: HOODIE.slug, color: "#141416", qty: 1 }], "us", find), { ok: false, problem: "bad-size" });
  assert.deepEqual(priceCart([{ slug: HOODIE.slug, color: "#141416", size: "XXXL", qty: 1 }], "us", find), { ok: false, problem: "bad-size" });
  assert.deepEqual(priceCart([{ slug: HOODIE.slug, color: "#FF0000", size: "M", qty: 1 }], "us", find), { ok: false, problem: "bad-color" });
  for (const qty of [0, -1, 1.5, MAX_QTY + 1, "2"]) {
    assert.deepEqual(priceCart([{ slug: CAP.slug, color: "#141416", qty }], "us", find), { ok: false, problem: "bad-qty" });
  }
});

test("article sans taille : taille unique", () => {
  const r = priceCart([{ slug: CAP.slug, color: "#F1ECE0", qty: 1 }], "uk", find);
  assert.ok(r.ok);
  assert.equal(r.lines[0].size, ONE_SIZE);
  assert.equal(r.currency, "GBP");
});

test("seuls les pays de la zone sont proposés à l'adresse de livraison", () => {
  assert.deepEqual(countriesOf("eu").sort(), ["BE", "FR"]);
  assert.deepEqual(countriesOf("us"), ["US"]);
  assert.deepEqual(countriesOf("ca"), ["CA"]);
  assert.deepEqual(countriesOf("uk"), ["GB"]);
});

test("le panier gardé chez Stripe se relit à l'identique, en morceaux de moins de 500 caractères", () => {
  const r = priceCart(
    Array.from({ length: 20 }, (_, i) => ({ slug: i % 2 ? CAP.slug : HOODIE.slug, color: "#141416", size: "L", qty: (i % 9) + 1 })),
    "us",
    find,
  );
  assert.ok(r.ok);
  const chunks = packCart(r.lines);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((c) => c.length <= 500));
  assert.deepEqual(
    unpackCart(chunks),
    r.lines.map((l) => ({ slug: l.slug, color: l.color, size: l.size, qty: l.qty })),
  );
});

test("session Stripe : montants en centimes, devise, pays, retour vers la page merci", () => {
  const r = priceCart([{ slug: HOODIE.slug, color: "#141416", size: "M", qty: 1 }], "ca", find);
  assert.ok(r.ok);
  const f = checkoutParams({ lines: r.lines, currency: r.currency, zone: "ca", baseUrl: "https://x.test", photo: () => "https://x.test/a.jpg" });
  assert.equal(f.get("line_items[0][price_data][currency]"), "cad");
  assert.equal(f.get("line_items[0][price_data][unit_amount]"), String(r.lines[0].unitPrice));
  assert.equal(f.get("shipping_address_collection[allowed_countries][0]"), "CA");
  assert.equal(f.get("success_url"), "https://x.test/commande/merci?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(f.get("metadata[zone]"), "ca");
  assert.equal(f.get("metadata[cart0]"), `${HOODIE.slug}|#141416|M|1`);
});
