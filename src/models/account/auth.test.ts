// Tests des comptes : node --test src/models/account/auth.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { LOCK_MS, MAX_TRIES, failTry, isCode, isEmail, locked, noTries, passwordProblem } from "./auth.ts";

test("e-mail", () => {
  assert.ok(isEmail(" Client@Exemple.com "));
  assert.ok(!isEmail("client@exemple"));
  assert.ok(!isEmail("pas un mail"));
});

test("mot de passe : longueur, trop courant, e-mail dedans, répétitif", () => {
  assert.match(passwordProblem("court")!, /10/);
  assert.match(passwordProblem("monPassword2026")!, /courant/);
  assert.match(passwordProblem("rhamon-2026-fraul!", "rhamon@exemple.com")!, /e-mail/);
  assert.match(passwordProblem("aaaaaaaaaaab")!, /répétitif/);
  assert.equal(passwordProblem("Velours-Bordeaux-19"), null);
});

test("code : 6 chiffres, espaces tolérés", () => {
  assert.ok(isCode("123 456"));
  assert.ok(!isCode("12345"));
  assert.ok(!isCode("12a456"));
});

test("trop d'essais ratés : verrou d'une minute, puis on repart", () => {
  let t = noTries;
  for (let i = 0; i < MAX_TRIES; i++) t = failTry(t, 1000);
  assert.ok(locked(t, 1000));
  assert.ok(!locked(t, 1000 + LOCK_MS + 1));
  assert.equal(failTry(t, 1000 + LOCK_MS + 1).n, 1);
});
