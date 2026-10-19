// Tests de la lumière selon l'heure : node --test src/walk/models/daylight.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { MIN_HEMI, daylightAt, nightAt } from "./daylight.ts";

test("midi = plein jour, 19 h = soir plus sombre, 3 h = nuit", () => {
  const midi = daylightAt(12), soir = daylightAt(19), nuit = daylightAt(3);
  assert.equal(midi.night, 0);
  assert.equal(midi.label, "jour");
  assert.equal(soir.label, "soir");
  assert.ok(soir.hemi < midi.hemi && soir.hemi > nuit.hemi);
  assert.equal(nuit.label, "nuit");
});

test("jamais noir : ambiance au-dessus du plancher, fond jamais #000", () => {
  for (let h = 0; h < 24; h += 0.25) {
    const d = daylightAt(h);
    assert.ok(d.hemi >= MIN_HEMI - 1e-9, `${h} h`);
    assert.ok(d.sky > 0x202020, `${h} h`);
  }
});

test("la lumière baisse sans à-coup au crépuscule et remonte à l'aube", () => {
  for (let h = 16; h < 21; h += 0.1) assert.ok(nightAt(h + 0.1) >= nightAt(h) - 1e-9, `${h} h`);
  for (let h = 6; h < 8; h += 0.1) assert.ok(nightAt(h + 0.1) <= nightAt(h) + 1e-9, `${h} h`);
  assert.equal(nightAt(24 + 12), 0);
});
