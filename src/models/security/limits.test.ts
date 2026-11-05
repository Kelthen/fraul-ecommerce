// Tests des limites d'essais : node --test src/models/security/limits.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { CODE_MINUTES, MAX_ATTEMPTS } from "../admin/login.ts";
import { LIMITS, clientIpFrom } from "./limits.ts";

test("l'adresse du visiteur : celle de Vercel d'abord, jamais vide", () => {
  assert.equal(clientIpFrom("1.2.3.4", "9.9.9.9"), "1.2.3.4");
  assert.equal(clientIpFrom(null, "5.6.7.8, 10.0.0.1"), "5.6.7.8");
  assert.equal(clientIpFrom(null, null), "inconnu");
});

test("essayer tous les codes admin reste hors de portée, même en renvoyant des codes", () => {
  const perDay = (LIMITS.adminCheckEmail.max * 86400) / LIMITS.adminCheckEmail.seconds;
  assert.ok(perDay < 1000, `${perDay} essais par jour`);
  assert.ok(LIMITS.adminCheckEmail.max >= MAX_ATTEMPTS, "un vrai admin garde ses essais par code");
  assert.ok(LIMITS.adminCheck.seconds >= CODE_MINUTES * 60);
});

test("une limite permet toujours au moins un vrai essai", () => {
  for (const [name, rule] of Object.entries(LIMITS)) assert.ok(rule.max >= 1 && rule.seconds >= 60, name);
});
