// Tests des filtres du catalogue : node --test src/models/catalog/filters.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { NO_FILTERS, activeCount, applyFilters, facets, filtersQuery, parseFilters, type Filterable } from "./filters.ts";

const price = (us: number) => ({ us, ca: us * 2, uk: us, eu: us });
const items: Filterable[] = [
  { slug: "a", category: "hoodie", brandSlug: "nike", brandName: "Nike", colors: ["#141416"], sizes: ["M", "L"], prices: price(100) },
  { slug: "b", category: "pants", brandSlug: "nike", brandName: "Nike", colors: ["#680209", "#141416"], sizes: ["S"], prices: price(50) },
  { slug: "c", category: "hoodie", brandSlug: "erd", brandName: "ERD", colors: ["#680209"], sizes: ["42", "9", "XL"], prices: price(300) },
];
const slugs = (l: Filterable[]) => l.map((p) => p.slug);
const q = (s: string) => new URLSearchParams(s);

test("sans filtre : tout, dans l'ordre du catalogue", () => {
  assert.deepEqual(slugs(applyFilters(items, NO_FILTERS, "us")), ["a", "b", "c"]);
});

test("une valeur ou une autre dans un filtre, les deux entre filtres", () => {
  const run = (s: string) => slugs(applyFilters(items, parseFilters(q(s)), "us"));
  assert.deepEqual(run("type=hoodie"), ["a", "c"]);
  assert.deepEqual(run("type=hoodie,pants"), ["a", "b", "c"]);
  assert.deepEqual(run("type=hoodie&marque=nike"), ["a"]);
  assert.deepEqual(run("couleur=680209"), ["b", "c"]);
  assert.deepEqual(run("taille=S,XL"), ["b", "c"]);
  assert.deepEqual(run("type=hoodie&taille=S"), []);
});

test("tri par prix, selon la zone du visiteur", () => {
  assert.deepEqual(slugs(applyFilters(items, parseFilters(q("tri=prix-croissant")), "us")), ["b", "a", "c"]);
  assert.deepEqual(slugs(applyFilters(items, parseFilters(q("tri=prix-decroissant")), "ca")), ["c", "a", "b"]);
});

test("le lien garde les filtres, et se relit à l'identique", () => {
  const f = parseFilters(q("type=hoodie,pants&marque=nike&couleur=680209&taille=M&tri=prix-croissant"));
  assert.deepEqual(parseFilters(q(filtersQuery(f))), f);
  assert.equal(activeCount(f), 5);
  assert.equal(filtersQuery(NO_FILTERS), "");
});

test("une adresse abîmée ne casse rien", () => {
  const f = parseFilters(q("tri=n-importe&type=<script>,hoodie&couleur=%22"));
  assert.equal(f.sort, "nouveautes");
  assert.deepEqual(f.types, ["hoodie"]);
  assert.deepEqual(f.colors, []);
});

test("on ne propose que les valeurs qui ont des articles, tailles dans l'ordre", () => {
  const v = facets(items);
  assert.deepEqual(v.types, ["hoodie", "pants"]);
  assert.deepEqual(v.brands, [{ id: "erd", label: "ERD" }, { id: "nike", label: "Nike" }]);
  assert.deepEqual(v.colors, ["141416", "680209"]);
  assert.deepEqual(v.sizes, ["S", "M", "L", "XL", "9", "42"]);
});
