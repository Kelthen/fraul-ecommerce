// Tests de la recherche du mall : node --test src/walk/models/search.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { matchCategories } from "./search.ts";

const CATS: [string, string][] = [["tee", "T-shirts"], ["hoodie", "Hoodies et sweats"], ["sneaker", "Sneakers"], ["bag", "Sacs"], ["pants", "Pantalons"]];

test("une pièce tapée trouve son rayon, avec ou sans accents ni pluriel", () => {
  assert.deepEqual(matchCategories("hoodie", CATS), ["hoodie"]);
  assert.deepEqual(matchCategories("Sweats", CATS), ["hoodie"]);
  assert.deepEqual(matchCategories("baskets", CATS), ["sneaker"]);
  assert.deepEqual(matchCategories("sac", CATS), ["bag"]);
  assert.deepEqual(matchCategories("jogging", CATS), ["pants"]);
});

test("trop court ou rien à voir : aucun rayon (on cherche alors une marque)", () => {
  assert.deepEqual(matchCategories("ni", CATS), []);
  assert.deepEqual(matchCategories("nike", CATS), []);
});
