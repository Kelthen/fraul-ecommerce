// Tests des données structurées : node --test src/models/seo/jsonld.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { breadcrumbJsonLd, jsonLdHtml, productJsonLd } from "./jsonld.ts";

test("fil d'Ariane : positions à partir de 1, adresses complètes", () => {
  const b = breadcrumbJsonLd("https://x.com", [{ name: "Marques", path: "/marques" }, { name: "Nike", path: "/marques/nike" }]);
  assert.equal(b["@type"], "BreadcrumbList");
  assert.deepEqual(b.itemListElement[1], { "@type": "ListItem", position: 2, name: "Nike", item: "https://x.com/marques/nike" });
});

test("fiche produit : prix en dollars, disponibilité, image complète", () => {
  const input = { slug: "a", name: "Hoodie", brandName: "Nike", categoryLabel: "Hoodies", image: "/images/a.jpg", priceUsd: 179 };
  const p = productJsonLd("https://x.com", input);
  assert.equal(p.image, "https://x.com/images/a.jpg");
  assert.equal(p.offers.price, 179);
  assert.equal(p.offers.priceCurrency, "USD");
  assert.equal(productJsonLd("https://x.com", { ...input, image: "https://s.co/a.jpg" }).image, "https://s.co/a.jpg");
});

test("un nom d'article ne peut pas fermer la balise script", () => {
  assert.ok(!jsonLdHtml({ name: "</script><script>x" }).includes("</script"));
});
