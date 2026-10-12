// Point d'accès unique au catalogue. Aujourd'hui : données de démonstration.
// Demain : requêtes à la base (Supabase). Les pages n'appellent que ces fonctions.
import { WALK_BRANDS, slugify } from "./brands";
import { BRANDS, CATEGORIES, NEW_ARRIVALS, PRODUCTS } from "./demo";
import type { Brand, Category, CategoryId, Product } from "./types";

export type { Brand, Category, CategoryId, Product } from "./types";
export { CATEGORIES } from "./demo";

export async function getBrands(): Promise<Brand[]> {
  return BRANDS;
}

/** Boutiques du mall, dans l'ordre du parcours. */
export async function getWalkBrands(): Promise<Brand[]> {
  return WALK_BRANDS.map((name) => BRANDS.find((b) => b.name === name)!);
}

export async function getBrand(slug: string): Promise<Brand | undefined> {
  return BRANDS.find((b) => b.slug === slug);
}

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id)!;
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return CATEGORIES.find((c) => c.slug === slug);
}

export async function getProducts(): Promise<Product[]> {
  return PRODUCTS;
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return PRODUCTS.find((p) => p.slug === slug);
}

export async function getProductsByBrand(brandSlug: string): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.brandSlug === brandSlug);
}

export async function getProductsByCategory(id: CategoryId): Promise<Product[]> {
  return PRODUCTS.filter((p) => p.category === id);
}

export async function getNewArrivals(): Promise<Product[]> {
  return NEW_ARRIVALS.map(([brand, cat, k]) => PRODUCTS.filter((p) => p.brandSlug === slugify(brand) && p.category === cat)[k]);
}

/** Pièces proposées dans « Crée ta tenue » : quelques articles par emplacement. */
export async function getOutfitPieces(): Promise<Record<"top" | "bottom" | "shoes", Product[]>> {
  const walk = WALK_BRANDS.slice(0, 8).map(slugify);
  const pick = (cats: CategoryId[]) =>
    PRODUCTS.filter((p) => cats.includes(p.category) && walk.includes(p.brandSlug)).filter((_, i) => i % 3 === 0).slice(0, 8);
  return { top: pick(["tee", "hoodie"]), bottom: pick(["pants"]), shoes: pick(["sneaker"]) };
}
