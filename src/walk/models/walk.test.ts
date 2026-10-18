// Tests des modèles du Walk : node --test src/walk/models/walk.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { createLayerStack } from "./layers.ts";
import { route } from "./store-layout.ts";
import { pathAt, progressForShop } from "./walk-path.ts";
import { layoutT } from "../modes/t.ts";
import type { Slot } from "./mall-layout.ts";

const N = 31;
const MALL = layoutT(N);
const { slots: SLOTS, entry: ENTRY, exit: EXIT } = MALL;

test("le T a une vitrine par marque (27 au départ, 31 aujourd'hui), toutes tournées vers l'allée", () => {
  for (const n of [27, 29, 31, 35]) assert.equal(layoutT(n).slots.length >= n, true, `${n} boutiques`);
  assert.equal(layoutT(27).slots.length, 27);
  assert.equal(SLOTS.length, N);
  for (const s of SLOTS) assert.equal(Math.abs(s.nx) + Math.abs(s.nz), 1);
});

test("le plan de 27 boutiques n'a pas bougé (mêmes vitrines qu'avant les modes de mall)", () => {
  const s = layoutT(27).slots;
  assert.deepEqual([s[0].x, s[0].z, s[26].x, s[26].z], [7, 37.75, -7, 37.75]);
  assert.deepEqual(layoutT(27).dims.STEM_END, 50);
  assert.deepEqual(layoutT(27).dims.BAR_X, 33);
});

test("deux vitrines ne se chevauchent jamais, même à 35 boutiques", () => {
  for (const n of [27, 31, 35]) {
    const s: Slot[] = layoutT(n).slots;
    for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
      const same = s[i].nx === s[j].nx && s[i].nz === s[j].nz && (s[i].nx ? s[i].x === s[j].x : s[i].z === s[j].z);
      if (same) assert.ok(Math.hypot(s[i].x - s[j].x, s[i].z - s[j].z) >= 8.5 - 1e-9, `${n} : vitrines ${i} et ${j}`);
    }
  }
});

test("parcours : entrée à 0 %, sortie à 100 %", () => {
  const a = pathAt(0, N, 10, MALL), b = pathAt(1, N, 10, MALL);
  assert.deepEqual([a.x, a.z, a.shop], [ENTRY.p[0], ENTRY.p[1], -1]);
  assert.deepEqual([b.x, b.z, b.shop], [EXIT.p[0], EXIT.p[1], -2]);
});

test("sauter à une boutique la met face à la caméra", () => {
  for (const k of [0, 5, 13, 26, 30]) {
    const pt = pathAt(progressForShop(k, N), N, 10, MALL), s = SLOTS[k];
    assert.equal(pt.shop, k);
    assert.ok(Math.abs(pt.x - (s.x + s.nx * 10)) < 1e-9 && Math.abs(pt.z - (s.z + s.nz * 10)) < 1e-9, `boutique ${k}`);
  }
});

test("la boutique regardée ne recule jamais quand on avance", () => {
  let last = -1;
  for (let p = 0.04; p < 0.98; p += 0.001) {
    const shop = pathAt(p, N, 10, MALL).shop;
    if (shop >= 0) { assert.ok(shop >= last, `${p}`); last = shop; }
  }
});

test("dans la boutique, on contourne l'îlot central", () => {
  assert.equal(route([-2.2, -6.4], [-2.2, -12.4]).length, 2);  // même côté : tout droit
  assert.equal(route([-2.2, -6.4], [2.2, -11.9]).length, 3);   // on traverse : un détour
});

test("couches : fermer la boutique ferme aussi rayon et zoom, de haut en bas", () => {
  const L = createLayerStack(), closed: string[] = [];
  for (const n of ["store", "rayon", "zoom"]) L.open(n, (anim) => closed.push(`${n}${anim ? "*" : ""}`));
  assert.equal(L.open("rayon", () => {}), false);
  L.close("store");
  assert.deepEqual(closed, ["zoom", "rayon", "store*"]);
  assert.equal(L.size, 0);
});

test("couches : le retour du téléphone ne ferme que le dessus", () => {
  const L = createLayerStack(), closed: string[] = [];
  for (const n of ["dir", "store", "rayon"]) L.open(n, () => closed.push(n));
  L.shutTo(2);
  assert.deepEqual(closed, ["rayon"]);
  assert.ok(L.drop("store") && !L.has("store") && L.has("dir"));
});
