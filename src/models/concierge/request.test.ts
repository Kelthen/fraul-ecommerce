// Tests de Fraul Finds (pièces sur demande) : node --test src/models/concierge/request.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { LIMITS, validateRequest } from "./request.ts";

const ok = { item: "Hoodie Nike Tech Fleece vert", email: "Client@Exemple.com " };

test("une demande simple passe, nettoyée", () => {
  const r = validateRequest({ ...ok, brand: "  Nike  ", note: "taille\u0007 M  si possible" });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.email, "client@exemple.com");
    assert.equal(r.value.brand, "Nike");
    assert.equal(r.value.note, "taille M si possible");
    assert.equal(r.value.link, "");
  }
});

test("article et e-mail obligatoires", () => {
  const r = validateRequest({ item: " a ", email: "pas-un-email" });
  assert.ok(!r.ok);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ["email", "item"]);
});

test("le lien doit être une adresse web (pas javascript:)", () => {
  for (const link of ["javascript:alert(1)", "ftp://x.com/a", "pas un lien"]) {
    const r = validateRequest({ ...ok, link });
    assert.ok(!r.ok && r.errors.link, link);
  }
  assert.ok(validateRequest({ ...ok, link: "https://www.nike.com/t/tech-fleece" }).ok);
});

test("textes trop longs refusés", () => {
  const r = validateRequest({ ...ok, note: "x".repeat(LIMITS.note + 1) });
  assert.ok(!r.ok && r.errors.note);
});

test("le champ piège rempli (robot) bloque la demande", () => {
  const r = validateRequest({ ...ok, website: "http://spam.example" });
  assert.ok(!r.ok && r.errors.form);
});
