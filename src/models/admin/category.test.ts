// Tests du nouveau type de vêtement : node --test src/models/admin/category.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { categoryProblems, categorySlug } from "./category.ts";

const ok = { label: "Maillots de foot", sizes: ["S", "M", "L"], weightG: 250, slot: "top" as const };

test("adresse lisible, sans accents", () => {
  assert.equal(categorySlug("Écharpes & bonnets"), "echarpes-bonnets");
});

test("un type correct passe ; un doublon et un mauvais poids sont refusés", () => {
  assert.deepEqual(categoryProblems(ok, ["t-shirts", "hoodies"]), []);
  assert.match(categoryProblems(ok, ["maillots-de-foot"]).join(), /existe déjà/);
  assert.match(categoryProblems({ ...ok, label: "T-shirts" }, ["t-shirts"]).join(), /existe déjà/);
  assert.match(categoryProblems({ ...ok, weightG: 0 }, []).join(), /Poids/);
  assert.match(categoryProblems({ ...ok, sizes: [] }, []).join(), /Tailles/);
});
