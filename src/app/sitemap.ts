import type { MetadataRoute } from "next";
import { CATEGORIES, getBrands, getProducts } from "@/lib/catalog";
import { SITE_URL } from "@/lib/format";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [brands, products] = await Promise.all([getBrands(), getProducts()]);
  const pages = ["", "/walk", "/marques", "/tenue", "/sur-demande", "/suivi", "/livraison", "/retours", "/cgv", "/mentions-legales", "/confidentialite", "/cookies"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...brands.map((b) => ({ url: `${SITE_URL}/marques/${b.slug}` })),
    ...CATEGORIES.map((c) => ({ url: `${SITE_URL}/categorie/${c.slug}` })),
    ...products.map((p) => ({ url: `${SITE_URL}/produit/${p.slug}` })),
  ];
}
