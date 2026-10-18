import { CATEGORIES, getBrands, getProducts, getWalkBrands } from "@/lib/catalog";
import { RACKS } from "./models/store-layout";
import type { WalkData, WalkItem } from "./WalkExperience";

/** Une boutique du mall n'affiche que les rayons qui ont un portant placé (store-layout.ts). */
const inStore = (cat: string) => cat in RACKS;

/** Données compactes envoyées au Fraul Walk (calculées au build). */
export async function getWalkData(): Promise<WalkData> {
  const [shops, brands, products] = await Promise.all([getWalkBrands(), getBrands(), getProducts()]);
  const items: WalkData["items"] = {};
  for (const p of products) {
    if (!inStore(p.category)) continue;
    const row: WalkItem = [p.slug, p.name, p.cost, p.color, p.colors];
    ((items[p.brandSlug] ??= {})[p.category] ??= []).push(row);
  }
  const pick = (b: { name: string; slug: string; style: WalkData["shops"][number]["style"] }) => ({ name: b.name, slug: b.slug, style: b.style });
  return {
    shops: shops.map(pick),
    allBrands: brands.map(pick),
    categories: CATEGORIES.filter((c) => inStore(c.id)).map(({ id, label, sizes }) => ({ id, label, sizes })),
    items,
  };
}
