// Tests des modèles du Walk : node --test src/walk/models/walk.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { createLayerStack } from "./layers.ts";
import { SLOTS } from "./mall-layout.ts";
import { route } from "./store-layout.ts";
import { ENTRY, EXIT, pathAt, progressForShop } from "./walk-path.ts";

const N = 27;

test("le T a 27 vitrines, toutes tournées vers l'allée", () => {
  assert.equal(SLOTS.length, N);
  for (const s of SLOTS) assert.equal(Math.abs(s.nx) + Math.abs(s.nz), 1);
});

test("parcours : entrée à 0 %, sortie à 100 %", () => {
  const a = pathAt(0, N, 10), b = pathAt(1, N, 10);
  assert.deepEqual([a.x, a.z, a.shop], [ENTRY.p[0], ENTRY.p[1], -1]);
  assert.deepEqual([b.x, b.z, b.shop], [EXIT.p[0], EXIT.p[1], -2]);
});

test("sauter à une boutique la met face à la caméra", () => {
  for (const k of [0, 5, 13, 26]) {
    const pt = pathAt(progressForShop(k, N), N, 10), s = SLOTS[k];
    assert.equal(pt.shop, k);
    assert.ok(Math.abs(pt.x - (s.x + s.nx * 10)) < 1e-9 && Math.abs(pt.z - (s.z + s.nz * 10)) < 1e-9, `boutique ${k}`);
  }
});

test("la boutique regardée ne recule jamais quand on avance", () => {
  let last = -1;
  for (let p = 0.04; p < 0.98; p += 0.001) {
    const shop = pathAt(p, N, 10).shop;
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
