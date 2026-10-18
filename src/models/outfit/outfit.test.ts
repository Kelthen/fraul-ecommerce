import { test } from "node:test";
import assert from "node:assert/strict";
import { pick, visibleSlots, SLOTS, type Outfit } from "./slots.ts";
import { OVERVIEW, SHOTS, DIST_MIN, DIST_MAX } from "./camera.ts";

const CAT: Record<string, "pants" | "shorts" | "socks" | "watch" | "tee"> = {
  jogging: "pants", short: "shorts", chaussettes: "socks", montre: "watch", tee: "tee",
};
const cat = (s: string) => CAT[s];

test("choisir une pièce, puis la retoucher la retire (emplacement vide permis)", () => {
  let o: Outfit = {};
  o = pick(o, "watch", "montre", cat);
  assert.equal(o.watch, "montre");
  o = pick(o, "watch", "montre", cat);
  assert.equal(o.watch, undefined);
});

test("pantalon et short s'excluent", () => {
  let o = pick({}, "bottom", "jogging", cat);
  o = pick(o, "bottom", "short", cat);
  assert.equal(o.bottom, "short");
});

test("les chaussettes n'apparaissent qu'avec un short, et partent avec lui", () => {
  let o = pick({}, "bottom", "jogging", cat);
  assert.ok(!visibleSlots(o, cat).some((s) => s.id === "socks"));
  o = pick(o, "bottom", "short", cat);
  assert.ok(visibleSlots(o, cat).some((s) => s.id === "socks"));
  o = pick(o, "socks", "chaussettes", cat);
  o = pick(o, "bottom", "jogging", cat);
  assert.equal(o.socks, undefined);
});

test("chaque emplacement a un cadrage de caméra dans les limites du zoom", () => {
  for (const s of SLOTS) {
    const shot = SHOTS[s.id];
    assert.ok(shot, `cadrage manquant : ${s.id}`);
    assert.ok(shot.dist >= DIST_MIN && shot.dist <= DIST_MAX, s.id);
  }
  assert.ok(OVERVIEW.dist <= DIST_MAX);
});
