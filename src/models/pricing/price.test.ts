// Tests du calcul des prix : node --test src/models/pricing/price.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { GROUPS, ZONES, type GroupId, type ZoneId } from "./config.ts";
import { MAX_DISCOUNT_DRIFT, catalogPrice, customerPrice, floorPrice, landedCost, roundNice, zoneOf, type Cost } from "./price.ts";

const TEE: Cost = { cny: 190, g: 250 };
const SNEAKER: Cost = { cny: 430, g: 1300 };

test("arrondi propre au plus proche : …9, et …4 / …9 sous 50", () => {
  assert.equal(roundNice(87.43), 89);
  assert.equal(roundNice(83), 79);
  assert.equal(roundNice(89), 89);
  assert.equal(roundNice(31), 29);
  assert.equal(roundNice(36), 34);
  assert.equal(roundNice(37), 39);
  assert.equal(roundNice(2), 4);
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
    assert.equal(p % 10, p < 50 ? (p % 5 === 4 ? p % 10 : -1) : 9, `${z} : ${p}`);
    assert.ok(Math.abs(p - landedCost(TEE, z) * (1 + ZONES[z].marginPct / 100)) <= 5);
  }
});

test("la remise réelle reste à ±3 points du % du groupe, petits prix compris (Serge, 13 oct.)", () => {
  // Cas signalé par Serge : 60 ¥ / 300 g, où VIP tombait au même prix que Fidèle.
  const costs: Cost[] = [{ cny: 60, g: 300 }, TEE, SNEAKER];
  for (let cny = 40; cny <= 1500; cny += 7) costs.push({ cny, g: 250 + (cny % 900) });
  for (const z of Object.keys(ZONES) as ZoneId[])
    for (const c of costs) {
      const cat = catalogPrice(c, z);
      for (const g of Object.keys(GROUPS) as GroupId[]) {
        const p = customerPrice(c, z, g);
        if (p === floorPrice(c, z)) continue; // le plancher peut volontairement réduire la remise
        const real = (1 - p / cat) * 100;
        assert.ok(Math.abs(real - GROUPS[g].discountPct) <= MAX_DISCOUNT_DRIFT, `${z} ${c.cny}¥ ${g} : ${cat} → ${p} (−${real.toFixed(1)} %)`);
      }
      assert.ok(customerPrice(c, z, "vip") > customerPrice(c, z, "fidele") || customerPrice(c, z, "fidele") === floorPrice(c, z));
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
