// Tests des envies : node --test src/models/envies/envies.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { ENVIES_MAX, hasEnvie, parseEnvies, toggleEnvie, type Envie } from "./envies.ts";

const item = (slug: string): Omit<Envie, "at"> => ({ slug, name: "Hoodie", brand: "Nike", category: "hoodie", cost: { cny: 300, g: 700 }, color: "#141416", accent: "#EAE0C8" });

test("toucher « Envie » ajoute en tête, toucher encore retire", () => {
  let l = toggleEnvie([], item("a"), 1);
  l = toggleEnvie(l, item("b"), 2);
  assert.deepEqual(l.map((e) => e.slug), ["b", "a"]);
  assert.ok(hasEnvie(l, "a"));
  l = toggleEnvie(l, item("a"), 3);
  assert.deepEqual(l.map((e) => e.slug), ["b"]);
});

test("liste plafonnée : les plus anciennes sortent", () => {
  let l: Envie[] = [];
  for (let i = 0; i < ENVIES_MAX + 5; i++) l = toggleEnvie(l, item(`p${i}`), i);
  assert.equal(l.length, ENVIES_MAX);
  assert.equal(l[0].slug, `p${ENVIES_MAX + 4}`);
});

test("stockage abîmé ou piégé : on garde seulement ce qui est propre", () => {
  assert.deepEqual(parseEnvies("pas du json"), []);
  assert.deepEqual(parseEnvies('{"a":1}'), []);
  const raw = JSON.stringify([{ ...item("a"), at: 1, photo: "javascript:alert(1)" }, { ...item("a"), at: 2 }, { slug: "x" }, null]);
  const l = parseEnvies(raw);
  assert.equal(l.length, 1);
  assert.equal(l[0].photo, undefined);
});
