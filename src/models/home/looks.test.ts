// Tests du défilé de looks : node --test src/models/home/looks.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveLooks } from "./looks.ts";

const products = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];

test("une pièce retirée du site disparaît du look ; un look à moins de 2 pièces n'est pas montré", () => {
  const r = resolveLooks(
    [
      { id: "1", title: "Complet", items: ["a", "b"] },
      { id: "2", title: "Une pièce partie", items: ["a", "x", "c"] },
      { id: "3", title: "Plus assez", items: ["b", "x"] },
    ],
    products,
  );
  assert.deepEqual(r.map((l) => [l.id, l.items.map((p) => p.slug)]), [["1", ["a", "b"]], ["2", ["a", "c"]]]);
});
