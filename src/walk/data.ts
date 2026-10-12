import { CATEGORIES, getBrands, getProducts, getWalkBrands } from "@/lib/catalog";
import type { WalkData, WalkItem } from "./WalkExperience";

/** Données compactes envoyées au Fraul Walk (calculées au build). */
export async function getWalkData(): Promise<WalkData> {
  const [shops, brands, products] = await Promise.all([getWalkBrands(), getBrands(), getProducts()]);
  const items: WalkData["items"] = {};
  for (const p of products) {
    const row: WalkItem = [p.slug, p.name, p.price, p.color, p.colors];
    ((items[p.brandSlug] ??= {})[p.category] ??= []).push(row);
  }
  const pick = (b: { name: string; slug: string; style: WalkData["shops"][number]["style"] }) => ({ name: b.name, slug: b.slug, style: b.style });
  return {
    shops: shops.map(pick),
    allBrands: brands.map(pick),
    categories: CATEGORIES.map(({ id, label, sizes }) => ({ id, label, sizes })),
    items,
  };
}
