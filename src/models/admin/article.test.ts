// Tests de la fiche d'article de l'admin : node --test src/models/admin/article.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { MARGIN_ALERT_PCT, articleProblems, articleSlug, marginsByZone, type ArticleInput } from "./article.ts";

const known = { brands: ["nike", "trapstar"], categories: ["hoodie", "tee"] };
const ok: ArticleInput = {
  brand: "nike",
  category: "hoodie",
  name: "Tech Fleece noir",
  priceUsd: 189,
  costCny: 435,
  weightG: 700,
  colors: ["#141416"],
  sizes: ["S", "M", "L"],
  photos: { front: "https://abc.supabase.co/storage/v1/object/public/produits/2026/abc.jpg", details: [] },
  onSite: true,
};

test("une fiche complète passe", () => {
  assert.deepEqual(articleProblems(ok, known), []);
});

test("le coût en ¥ est obligatoire (prix plancher), et chaque champ est vérifié", () => {
  assert.match(articleProblems({ ...ok, costCny: 0 }, known).join(), /Coût en ¥/);
  assert.match(articleProblems({ ...ok, brand: "inconnue" }, known).join(), /marque/);
  assert.match(articleProblems({ ...ok, colors: ["rouge"] }, known).join(), /couleurs/);
  assert.match(articleProblems({ ...ok, photos: { front: "", details: [] } }, known).join(), /photo de face/);
  assert.match(articleProblems({ ...ok, photos: { front: "https://ailleurs.com/x.jpg", details: [] } }, known).join(), /remets-la/);
});

test("marge par zone : prix converti ; un prix trop bas est relevé au plancher et signalé", () => {
  const m = marginsByZone(189, 435, 700);
  assert.equal(m.find((z) => z.zone === "us")!.price, 189);
  assert.ok(m.every((z) => !z.raisedToFloor));
  const low = marginsByZone(20, 435, 700);
  assert.ok(low.every((z) => z.raisedToFloor));
  assert.ok(low.every((z) => z.marginPct <= MARGIN_ALERT_PCT + 10));
});

test("adresse de l'article : lisible, sans accents, unique", () => {
  assert.equal(articleSlug("nike", "Tech Fleece — Noir / Gris chiné", () => false), "nike-tech-fleece-noir-gris-chine");
  const taken = new Set(["nike-polo", "nike-polo-2"]);
  assert.equal(articleSlug("nike", "Polo", (s) => taken.has(s)), "nike-polo-3");
});
