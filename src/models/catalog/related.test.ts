// Tests des propositions sous une fiche : node --test src/models/catalog/related.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { RELATED_MAX, related, type RelatedItem } from "./related.ts";

const it = (slug: string, brand: string, cat: string, photo = false): RelatedItem => ({ slug, brand, cat, photo });
const many = (brand: string, cat: string, n: number, photo = false) => Array.from({ length: n }, (_, i) => it(`${brand}-${cat}-${i}`, brand, cat, photo));

test("12 propositions au plus, en rangées pleines de 3, sans l'article lui-même", () => {
  const all = [...many("Nike", "hoodie", 10), ...many("Nike", "tee", 5), ...many("Nike", "pants", 5), ...many("Ami", "hoodie", 10)];
  const cur = all[0];
  const s = related(all, cur);
  const flat = s.flatMap((x) => x.items);
  assert.equal(flat.length, RELATED_MAX);
  assert.ok(!flat.includes(cur));
  for (const x of s) assert.equal(x.items.length % 3, 0);
  assert.deepEqual(s.map((x) => x.key), ["same", "outfit"]);
});

test("la tenue varie les rayons et les vraies photos passent devant", () => {
  const all = [it("cur", "Nike", "hoodie"), ...many("Nike", "tee", 4), ...many("Nike", "pants", 2, true), ...many("Nike", "cap", 2)];
  const outfit = related(all, all[0]).find((x) => x.key === "outfit")!.items;
  assert.deepEqual(outfit.slice(0, 3).map((x) => x.cat), ["pants", "tee", "cap"]);
});

test("une petite marque est complétée par les autres boutiques du même rayon", () => {
  const all = [it("cur", "ERD", "tee", true), it("erd-2", "ERD", "tee", true), ...many("Nike", "tee", 20)];
  const s = related(all, all[0]);
  assert.deepEqual(s.map((x) => x.key), ["same", "others"]);
  assert.equal(s[0].items.length, 1); // moins d'une rangée : gardée telle quelle
  assert.equal(s[1].items.length, 9);
});

test("rien à proposer : aucune section", () => {
  assert.deepEqual(related([it("seul", "X", "tee")], it("seul", "X", "tee")), []);
});
