import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getBrands, getProducts, getStockedCategories } from "@/lib/catalog";
import { SITE_URL } from "@/lib/format";

// Calculé à chaque visite (connection) : sinon il restait figé au dernier déploiement et Google ne voyait pas les
// articles ajoutés depuis l'admin (scan du 22 nov. : ~309 articles listés sur 408). Le catalogue lui-même reste en
// cache, vidé par l'admin à chaque modification : aucune charge en plus sur la base.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [brands, products, categories] = await Promise.all([getBrands(), getProducts(), getStockedCategories()]);
  const pages = ["", "/walk", "/marques", "/sur-demande", "/suivi", "/livraison", "/retours", "/cgv", "/mentions-legales", "/confidentialite", "/cookies"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...brands.map((b) => ({ url: `${SITE_URL}/marques/${b.slug}` })),
    { url: `${SITE_URL}/tout` },
    ...categories.map((c) => ({ url: `${SITE_URL}/categorie/${c.slug}` })),
    ...products.map((p) => ({ url: `${SITE_URL}/produit/${p.slug}` })),
  ];
}
