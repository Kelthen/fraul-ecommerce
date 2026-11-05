// Tests de la fiche d'article de l'admin : node --test src/models/admin/article.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { MARGIN_ALERT_PCT, articleProblems, articleSlug, filterArticles, findDuplicate, marginsByZone, type ArticleInput } from "./article.ts";

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
  assert.match(articleProblems({ ...ok, colors: ["rouge"] }, known).join(), /pastille de couleur/);
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

test("adresse de photo avec espace, retour à la ligne ou « // » : nettoyée puis acceptée", async () => {
  const { cleanArticle } = await import("./article.ts");
  const bad = "https://abc.supabase.co\n//storage/v1/object/public/produits/2026-11/a.jpg ";
  const fixed = cleanArticle({ ...ok, photos: { front: bad, details: [bad] } });
  assert.equal(fixed.photos.front, "https://abc.supabase.co/storage/v1/object/public/produits/2026-11/a.jpg");
  assert.deepEqual(articleProblems(fixed, known), []);
  assert.match(articleProblems({ ...ok, photos: { front: bad, details: [] } }, known).join(), /remets-la/);
});

test("liste de l'admin : « nike pantalon » trouve le pantalon Nike, classé par marque", () => {
  const list = [
    { name: "Hoodie noir", brand: "trapstar", category: "hoodie" },
    { name: "Jogging Tech", brand: "nike", category: "pants" },
    { name: "Hoodie gris", brand: "nike", category: "hoodie" },
  ];
  const label = { brand: (s: string) => ({ nike: "Nike", trapstar: "Trapstar" })[s] ?? s, type: (id: string) => ({ pants: "Pantalons", hoodie: "Hoodies" })[id] ?? id };
  assert.deepEqual(filterArticles(list, { q: "Nike pantalon" }, label).map((a) => a.name), ["Jogging Tech"]);
  assert.deepEqual(filterArticles(list, { type: "hoodie" }, label).map((a) => a.name), ["Hoodie gris", "Hoodie noir"]);
  assert.deepEqual(filterArticles(list, { brand: "trapstar", q: "" }, label).map((a) => a.name), ["Hoodie noir"]);
  assert.equal(filterArticles(list, {}, label).length, 3);
});

test("doublon : même marque et même nom, sans tenir compte des majuscules ni des accents", () => {
  const list = [{ slug: "nike-hoodie-noir", brand: "nike", name: "Hoodie Noir" }];
  assert.equal(findDuplicate(list, { brand: "nike", name: "  hoodie  noir " })?.slug, "nike-hoodie-noir");
  assert.equal(findDuplicate(list, { brand: "trapstar", name: "Hoodie noir" }), null);
  assert.equal(findDuplicate(list, { brand: "nike", name: "Hoodie noir", slug: "nike-hoodie-noir" }), null); // lui-même
});
