// Tests de la fiche de boutique : node --test src/models/admin/boutique.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { boutiqueProblems, logoColor, moveToPlace, textOn, type BoutiqueInput } from "./boutique.ts";

const LOGO = "https://abc.supabase.co/storage/v1/object/public/produits/2026-11/ab-12.png";
const ok: BoutiqueInput = { name: "Corteiz", logo: LOGO, color: "#680209", place: 1, visible: true };

/** Image de `n` pixels d'une couleur, en RVBA. */
const px = (n: number, r: number, g: number, b: number, a = 255) => Array.from({ length: n }, () => [r, g, b, a]).flat();

test("fiche correcte, le logo est facultatif", () => {
  assert.deepEqual(boutiqueProblems(ok, ["Nike"]), []);
  assert.deepEqual(boutiqueProblems({ ...ok, logo: undefined }, []), []);
});

test("fiche refusée : nom vide, nom déjà pris, couleur, logo d'ailleurs, place", () => {
  assert.equal(boutiqueProblems({ ...ok, name: " " }, []).length, 1);
  assert.match(boutiqueProblems({ ...ok, name: "NIKE " }, ["Nike"])[0], /déjà/);
  assert.equal(boutiqueProblems({ ...ok, color: "rouge" }, []).length, 1);
  assert.equal(boutiqueProblems({ ...ok, logo: "https://exemple.com/x.png" }, []).length, 1);
  assert.equal(boutiqueProblems({ ...ok, logo: "javascript:alert(1)" }, []).length, 1);
  assert.equal(boutiqueProblems({ ...ok, place: 0 }, []).length, 1);
  assert.equal(boutiqueProblems({ ...ok, place: 1.5 }, []).length, 1);
});

test("couleur du logo : la couleur vive, jamais le fond blanc ni la transparence", () => {
  assert.equal(logoColor([...px(800, 255, 255, 255), ...px(200, 200, 16, 32)]), "#C81020");
  assert.equal(logoColor([...px(800, 0, 0, 0, 0), ...px(200, 16, 80, 200)]), "#1050C8");
});

test("couleur du logo : noir et blanc donne un noir, quelques pixels colorés n'y changent rien", () => {
  assert.equal(logoColor([...px(800, 255, 255, 255), ...px(200, 10, 10, 12)]), "#0A0A0C");
  assert.equal(logoColor([...px(990, 10, 10, 12), ...px(10, 200, 16, 32)]), "#0A0A0C");
});

test("couleur du logo : rien de lisible donne le noir de secours", () => {
  assert.equal(logoColor([]), "#111113");
  assert.equal(logoColor(px(100, 255, 255, 255)), "#111113");
  assert.equal(logoColor(px(100, 1, 2, 3, 0)), "#111113");
});

test("texte lisible sur la couleur de la boutique", () => {
  assert.equal(textOn("#680209"), "#FFFEF7");
  assert.equal(textOn("#F3EEE2"), "#141416");
});

test("place dans le mall", () => {
  assert.deepEqual(moveToPlace(["a", "b", "c"], "c", 1), ["c", "a", "b"]);
  assert.deepEqual(moveToPlace(["a", "b", "c"], "a", 2), ["b", "a", "c"]);
  assert.deepEqual(moveToPlace(["a", "b", "c"], "a", 99), ["b", "c", "a"]);
  assert.deepEqual(moveToPlace(["a", "b"], "n", 2), ["a", "n", "b"]);
});
