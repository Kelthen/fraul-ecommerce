// Tests des modèles du Walk : node --test src/walk/models/walk.test.ts
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createLayerStack } from "./layers.ts";
import { RACKS, STORE_ZONES, route } from "./store-layout.ts";
import { AT_CAISSE, AT_CONCIERGE, AT_ENTRY, AT_EXIT, pathAt, progressForCaisse, progressForConcierge, progressForShop, stopProgress } from "./walk-path.ts";
import { layoutT } from "../modes/t.ts";
import { shopType, type Slot } from "./mall-layout.ts";

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
  assert.deepEqual([b.x, b.z, b.shop], [EXIT.p[0], EXIT.p[1], AT_EXIT]);
});

test("Finds : un arrêt vers la 10e boutique, face au comptoir, entre deux boutiques", () => {
  const { after, slot } = MALL.concierge;
  const pt = pathAt(progressForConcierge(N, MALL), N, 10, MALL);
  assert.equal(pt.shop, AT_CONCIERGE);
  assert.ok(Math.abs(pt.x - (slot.x + slot.nx * 7)) < 1e-9 && Math.abs(pt.z - (slot.z + slot.nz * 7)) < 1e-9);
  assert.equal(pathAt(progressForShop(after - 1, N, MALL), N, 10, MALL).shop, after - 1);
  assert.equal(pathAt(progressForShop(after, N, MALL), N, 10, MALL).shop, after);
  assert.ok(after >= 9 && after <= 11, `arrêt après ${after} boutiques`);
  // Le comptoir est au pied du « TUC » (centre du mall, z = -16), tourné vers la caméra.
  assert.ok(Math.hypot(slot.x, slot.z + 16) < 4.5);
});

test("sauter à une boutique la met face à la caméra", () => {
  for (const k of [0, 5, 13, 26, 30]) {
    const pt = pathAt(progressForShop(k, N, MALL), N, 10, MALL), s = SLOTS[k];
    assert.equal(pt.shop, k);
    assert.ok(Math.abs(pt.x - (s.x + s.nx * 10)) < 1e-9 && Math.abs(pt.z - (s.z + s.nz * 10)) < 1e-9, `boutique ${k}`);
  }
});

test("points d'arrêt : un par étape, dans l'ordre entrée → boutiques et Finds → sortie (un cran = une boutique)", () => {
  const seen = Array.from({ length: N + 3 }, (_, j) => pathAt(stopProgress(j, N), N, 10, MALL).shop);
  const shops = seen.filter((k) => k >= 0);
  assert.deepEqual(shops, Array.from({ length: N }, (_, k) => k), "chaque boutique a exactement un arrêt, dans l'ordre");
  assert.equal(seen[0], AT_ENTRY);
  assert.equal(seen[N + 2], AT_EXIT);
  assert.equal(seen.filter((k) => k === AT_CONCIERGE).length, 1);
});

test("la Caisse : un arrêt juste avant la sortie, seulement si le sac n'est pas vide (Rhamone, 18 oct.)", () => {
  const sans = Array.from({ length: N + 3 }, (_, j) => pathAt(stopProgress(j, N), N, 10, MALL).shop);
  assert.ok(!sans.includes(AT_CAISSE), "sac vide : pas de Caisse");
  const avec = Array.from({ length: N + 4 }, (_, j) => pathAt(stopProgress(j, N, true), N, 10, MALL, true).shop);
  assert.deepEqual(avec.slice(-2), [AT_CAISSE, AT_EXIT], "Caisse puis sortie");
  assert.deepEqual(avec.filter((k) => k >= 0), Array.from({ length: N }, (_, k) => k), "toutes les boutiques gardent leur arrêt");
  assert.equal(pathAt(progressForCaisse(N), N, 10, MALL, true).shop, AT_CAISSE);
  assert.equal(pathAt(progressForShop(5, N, MALL, true), N, 10, MALL, true).shop, 5);
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

test("petit mall (8 boutiques ou moins) : le tronc seul, Finds entre la montée et la descente, chaque arrêt a sa vitrine", () => {
  for (const n of [1, 2, 5, 6, 8]) {
    const m = layoutT(n);
    assert.ok(m.slots.length >= n, `${n} boutiques`);
    assert.ok(m.concierge.after <= n, `Finds après ${m.concierge.after} sur ${n}`);
    assert.ok(m.slots.slice(0, n).every((s) => Math.abs(s.x) === m.dims.STEM_X));
    for (let k = 0; k < n; k++) assert.equal(pathAt(progressForShop(k, n, m), n, 10, m).shop, k);
    assert.equal(pathAt(progressForConcierge(n, m), n, 10, m).shop, AT_CONCIERGE);
  }
});

test("3 architectures de boutique : toutes présentes dès 3 boutiques, jamais deux fois la même côte à côte", () => {
  assert.equal(new Set([0, 1, 2].map(shopType)).size, 3);
  for (let k = 1; k < 40; k++) assert.notEqual(shopType(k), shopType(k - 1), `boutiques ${k - 1} et ${k}`);
});

test("chaque rayon a sa place : portant et arrêt de caméra, dans les murs, le chemin évite l'îlot", () => {
  for (const cat of ["tee", "hoodie", "jacket", "pants", "shorts", "socks", "sneaker", "cap", "glasses", "watch", "jewelry", "bag"]) {
    const r = RACKS[cat], z = STORE_ZONES[cat];
    assert.ok(r && z, cat);
    const reach = r.side ? 12 * r.side : 3.4 * r.sp; // jusqu'où vont les pièces de chaque côté de la pièce choisie
    for (const sign of [-1, 1]) {
      const x = r.o[0] + sign * reach * r.d[0], k = r.o[2] + sign * reach * r.d[2];
      assert.ok(Math.abs(x) <= 6 && k <= 0.45 && k >= -16, `${cat} sort des murs : ${x}, ${k}`);
    }
    assert.ok(route(STORE_ZONES.hub.p, z.p).length >= 2);
  }
});

test("les portants d'un même mur ne se chevauchent pas", () => {
  const span = (c: string) => { const r = RACKS[c], reach = r.side ? 12 * r.side : 3.4 * r.sp; return [r.o[2] - reach, r.o[2] + reach]; };
  for (const [a, b] of [["jacket", "tee"], ["tee", "hoodie"], ["shorts", "cap"]]) {
    assert.ok(span(a)[0] >= span(b)[1] - 0.01, `${a} et ${b}`);
  }
});

test("toute photo du mall se charge en crossOrigin, sinon les photos envoyées s'affichent en noir", () => {
  const engine = readFileSync(new URL("../engine.js", import.meta.url), "utf8");
  assert.equal(engine.match(/new Image\(\)/g)?.length, 1);
  assert.match(engine, /const webImage = \(\) => \{ const im = new Image\(\); im\.crossOrigin = "anonymous"/);
});
