// Tests du message Finds : node --test src/models/concierge/alert.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { findsAlert } from "./alert.ts";

test("Finds : le texte du visiteur est protégé et le lien n'est pas cliquable", () => {
  const m = findsAlert({ item: "<b>Hoodie</b>", brand: "Nike", size: "M", link: "https://x.co/a?b=<c>", email: "a@b.co", note: "Vert & noir" });
  assert.ok(m.includes("&lt;b&gt;Hoodie&lt;/b&gt;</b> · Nike · M"));
  assert.ok(m.includes("<code>https://x.co/a?b=&lt;c&gt;</code>"));
  assert.ok(m.includes("Vert &amp; noir"));
  assert.ok(!m.includes("<a "));
});

test("Finds : les champs vides ne laissent aucune ligne", () => {
  const m = findsAlert({ item: "Veste", brand: "", size: "", link: "", email: "a@b.co", note: "" });
  assert.equal(m, "🔎 <b>Demande Finds</b>\n<b>Veste</b>\nRépondre à : a@b.co");
});
