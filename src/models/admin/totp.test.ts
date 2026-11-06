// Tests des codes d'authentification : node --test src/models/admin/totp.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { base32Encode, matchTotp, otpauthUrl, readableKey, totpCode, twoFactorOn } from "./totp.ts";

const SECRET = Buffer.from("12345678901234567890"); // secret de la RFC 6238

test("vecteurs officiels de la RFC 6238 (6 derniers chiffres)", () => {
  assert.equal(totpCode(SECRET, Math.floor(59 / 30)), "287082");
  assert.equal(totpCode(SECRET, Math.floor(1111111109 / 30)), "081804");
  assert.equal(totpCode(SECRET, Math.floor(2000000000 / 30)), "279037");
});

test("base32 : valeur de référence", () => {
  assert.equal(base32Encode(SECRET), "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  assert.equal(base32Encode(Buffer.from("f")), "MY");
});

test("le code du moment et celui d'à côté passent, pas au-delà", () => {
  const now = 1_800_000_000_000, step = Math.floor(now / 30000);
  assert.equal(matchTotp(SECRET, totpCode(SECRET, step), now, 0), step);
  assert.equal(matchTotp(SECRET, totpCode(SECRET, step - 1), now, 0), step - 1);
  assert.equal(matchTotp(SECRET, totpCode(SECRET, step + 1), now, 0), step + 1);
  assert.equal(matchTotp(SECRET, totpCode(SECRET, step - 2), now, 0), null);
});

test("un code déjà utilisé ne resert pas, un code mal formé non plus", () => {
  const now = 1_800_000_000_000, step = Math.floor(now / 30000);
  assert.equal(matchTotp(SECRET, totpCode(SECRET, step), now, step), null);
  assert.equal(matchTotp(SECRET, totpCode(SECRET, step - 1), now, step), null);
  assert.equal(matchTotp(SECRET, "12345", now, 0), null);
  assert.equal(matchTotp(SECRET, "abcdef", now, 0), null);
});

test("double vérification : allumée seulement par ADMIN_2FA=true", () => {
  assert.equal(twoFactorOn(undefined), false);
  assert.equal(twoFactorOn(""), false);
  assert.equal(twoFactorOn("false"), false);
  assert.equal(twoFactorOn(" TRUE "), true);
});

test("lien de l'application et clé lisible", () => {
  const url = otpauthUrl("jp@exemple.com", "ABCDEFGH");
  assert.ok(url.startsWith("otpauth://totp/TakeUrClothes:jp%40exemple.com?secret=ABCDEFGH&issuer=TakeUrClothes"));
  assert.equal(readableKey("ABCDEFGHIJ"), "ABCD EFGH IJ");
});
