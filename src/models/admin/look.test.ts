// Tests du look de l'admin : node --test src/models/admin/look.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { lookProblems } from "./look.ts";

const ok = { title: "Tout noir", photo: "https://abc.supabase.co/storage/v1/object/public/produits/2026-11/a.jpg", items: ["a", "b"], onSite: true };

test("un look complet passe ; il faut 2 à 6 articles qui existent et une vraie photo", () => {
  assert.deepEqual(lookProblems(ok, ["a", "b", "c"]), []);
  assert.match(lookProblems({ ...ok, items: ["a"] }, ["a", "b"]).join(), /2 à 6/);
  assert.match(lookProblems({ ...ok, items: ["a", "a"] }, ["a", "b"]).join(), /2 à 6/);
  assert.match(lookProblems({ ...ok, items: ["a", "z"] }, ["a", "b"]).join(), /n'existe plus/);
  assert.match(lookProblems({ ...ok, photo: "https://ailleurs.com/x.jpg" }, ["a", "b"]).join(), /remets-la/);
});
