// Tests du calcul des prix : node --test src/models/pricing/price.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { GROUPS, ZONES, type GroupId, type ZoneId } from "./config.ts";
import { catalogPrice, customerPrice, floorPrice, landedCost, roundDown9, roundUp9, zoneOf, type Cost } from "./price.ts";

const TEE: Cost = { cny: 190, g: 250 };
const SNEAKER: Cost = { cny: 430, g: 1300 };

test("arrondi propre : finit toujours par 9", () => {
  assert.equal(roundUp9(87.43), 89);
  assert.equal(roundUp9(89), 89);
  assert.equal(roundUp9(90.01), 99);
  assert.equal(roundDown9(87.43), 79);
  assert.equal(roundDown9(89), 89);
  assert.equal(roundDown9(100), 99);
});

test("zone devinée par le pays, jamais affichée ; inconnu = zone par défaut", () => {
  assert.equal(zoneOf("US"), "us");
  assert.equal(zoneOf("ca"), "ca");
  assert.equal(zoneOf("GB"), "uk");
  assert.equal(zoneOf("BE"), "eu");
  assert.equal(zoneOf("JP"), "us");
  assert.equal(zoneOf(null), "us");
});

test("coût rendu = marchandise + livraison au poids + droits", () => {
  // 190 ¥ × 0,14 = 26,6 $ ; 0,25 kg × 12 $ = 3 $ ; +15 % de droits
  assert.ok(Math.abs(landedCost(TEE, "us") - 29.6 * 1.15) < 1e-9);
});

test("prix catalogue : marge de la zone, arrondi propre", () => {
  for (const z of Object.keys(ZONES) as ZoneId[]) {
    const p = catalogPrice(TEE, z);
    assert.equal(p % 10, 9, `${z} : ${p}`);
    assert.ok(p >= landedCost(TEE, z) * (1 + ZONES[z].marginPct / 100));
  }
});

test("la remise du groupe baisse le prix, sans code", () => {
  const pub = customerPrice(TEE, "us");
  assert.equal(pub, catalogPrice(TEE, "us"));
  assert.ok(customerPrice(TEE, "us", "vip") < pub);
  assert.ok(customerPrice(TEE, "us", "revendeur") < customerPrice(TEE, "us", "fidele"));
});

test("prix plancher : aucune remise ne fait vendre sous coût + marge minimale (R5)", () => {
  for (const z of Object.keys(ZONES) as ZoneId[])
    for (const g of Object.keys(GROUPS) as GroupId[])
      for (const c of [TEE, SNEAKER, { cny: 5, g: 2000 }])
        assert.ok(customerPrice(c, z, g) >= floorPrice(c, z), `${z}/${g}`);
});
