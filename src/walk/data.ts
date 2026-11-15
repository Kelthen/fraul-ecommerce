import { CATEGORIES, getBrands, getProducts, getWalkBrands } from "@/lib/catalog";
import { loadLookRows } from "@/lib/catalog/db";
import { TEST_LOOKS, resolveLooks } from "@/models/home/looks";
import { RACKS } from "./models/store-layout";
import type { WalkData, WalkItem } from "./WalkExperience";

/** Une boutique du mall n'affiche que les rayons qui ont un portant placé (store-layout.ts). */
const inStore = (cat: string) => cat in RACKS;

/** Données compactes envoyées au Walk (calculées au build). */
export async function getWalkData(): Promise<WalkData> {
  const [shops, brands, products] = await Promise.all([getWalkBrands(), getBrands(), getProducts()]);
  const items: WalkData["items"] = {};
  for (const p of products) {
    if (!inStore(p.category)) continue;
    const row: WalkItem = p.image ? [p.slug, p.name, p.prices, p.color, p.colors, p.image] : [p.slug, p.name, p.prices, p.color, p.colors];
    ((items[p.brandSlug] ??= {})[p.category] ??= []).push(row);
  }
  // Looks de l'accueil, rangés par boutique selon la marque réelle de leurs pièces (un look multimarque va dans chaque
  // boutique concernée) : l'écran publicitaire de la boutique les fait défiler (Rhamone, 9 nov.). Avec photo seulement.
  const fromAdmin = ((await loadLookRows()) ?? []).map((r) => ({ id: r.id, title: r.title, photo: r.cutout!, items: r.items }));
  const looks: WalkData["looks"] = {};
  for (const l of resolveLooks(fromAdmin.length ? fromAdmin : TEST_LOOKS, products)) {
    if (!l.photo) continue;
    for (const b of new Set(l.items.map((p) => p.brandSlug))) {
      const entry = { title: l.title, items: l.items.filter((p) => p.brandSlug === b && inStore(p.category)).map((p) => [p.slug, p.category] as [string, string]) };
      // Écran publicitaire de la boutique : le look de face, puis de dos s'il existe (Rhamone, 14 nov.).
      (looks[b] ??= []).push({ photo: l.photo, ...entry });
      if (l.back) looks[b].push({ photo: l.back, ...entry });
    }
  }
  const pick = (b: { name: string; slug: string; style: WalkData["shops"][number]["style"] }) => ({ name: b.name, slug: b.slug, style: b.style });
  return {
    shops: shops.map(pick),
    allBrands: brands.map(pick),
    categories: CATEGORIES.filter((c) => inStore(c.id)).map(({ id, slug, label, sizes }) => ({ id, slug, label, sizes })),
    items,
    looks,
  };
}
