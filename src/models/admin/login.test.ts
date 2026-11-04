// Tests de la connexion admin : node --test src/models/admin/login.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_ATTEMPTS, canResend, canTry, cleanCode, normalizeEmail, parseAdminEmails } from "./login.ts";

test("liste des admins : virgules ou espaces, casse ignorée, entrées vides ignorées", () => {
  assert.deepEqual(parseAdminEmails(" A@x.com, b@Y.com;c@z.com\nd@z.com ,,"), ["a@x.com", "b@y.com", "c@z.com", "d@z.com"]);
  assert.deepEqual(parseAdminEmails(undefined), []);
  assert.deepEqual(parseAdminEmails("pasuneadresse"), []);
});

test("adresse et code tapés sont nettoyés", () => {
  assert.equal(normalizeEmail("  JP@Exemple.COM "), "jp@exemple.com");
  assert.equal(normalizeEmail(42), "");
  assert.equal(cleanCode(" 123 456 "), "123456");
});

test("un code s'essaie 5 fois au plus, et jamais après expiration", () => {
  const now = 1000;
  assert.ok(canTry({ attempts: MAX_ATTEMPTS - 1, expiresAt: now + 1 }, now));
  assert.ok(!canTry({ attempts: MAX_ATTEMPTS, expiresAt: now + 1 }, now));
  assert.ok(!canTry({ attempts: 0, expiresAt: now }, now));
});

test("un nouveau code part au plus une fois par minute", () => {
  assert.ok(canResend(null, 0));
  assert.ok(!canResend(0, 59_000));
  assert.ok(canResend(0, 60_000));
});
