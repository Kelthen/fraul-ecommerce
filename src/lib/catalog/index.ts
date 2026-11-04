// Point d'accès unique au catalogue. Les pages n'appellent que ces fonctions.
// Vrais articles : la base (src/lib/catalog/db.ts), modifiable depuis l'admin ; copie de secours si elle ne répond pas.
// Articles de démo (dessinés) : dans le code. Marques et catégories : dans le code pour l'instant.
import { WALK_BRANDS, slugify } from "./brands";
import { loadSiteRows, toProduct } from "./db";
import { BRANDS, CATEGORIES, DEMO_PRODUCTS, NEW_ARRIVALS, REAL_SNAPSHOT, accentFor } from "./demo";
import { priceTable } from "@/models/pricing/price";
import type { Brand, Category, CategoryId, PricedProduct, Product } from "./types";

export type { Brand, Category, CategoryId, PricedProduct, Product } from "./types";
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

/** Vrais articles du site (base, ou copie de secours), puis les articles de démo. */
async function pricedProducts(): Promise<PricedProduct[]> {
  const rows = await loadSiteRows();
  const real = rows ? rows.map((r) => toProduct(r, BRANDS, CATEGORIES, accentFor)).filter((p): p is PricedProduct => p !== null) : REAL_SNAPSHOT;
  return [...real, ...DEMO_PRODUCTS];
}

/** Ce que les pages reçoivent : les prix, jamais le coût. */
const toPublic = ({ cost, ...p }: PricedProduct): Product => ({ ...p, prices: priceTable(cost) });
const allProducts = async () => (await pricedProducts()).map(toPublic);

/** Article avec son coût, pour le paiement et les commandes. Serveur seulement. */
export async function getPricedProduct(slug: string): Promise<PricedProduct | undefined> {
  return (await pricedProducts()).find((p) => p.slug === slug);
}

export async function getProducts(): Promise<Product[]> {
  return allProducts();
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await allProducts()).find((p) => p.slug === slug);
}

export async function getProductsByBrand(brandSlug: string): Promise<Product[]> {
  return (await allProducts()).filter((p) => p.brandSlug === brandSlug);
}

export async function getProductsByCategory(id: CategoryId): Promise<Product[]> {
  return (await allProducts()).filter((p) => p.category === id);
}

/** Nouveautés : les vrais produits avec photo d'abord (une pièce par marque, puis les suivantes), complétés par la démo. */
export async function getNewArrivals(): Promise<Product[]> {
  const products = await allProducts();
  const real = products.filter((p) => p.image);
  const firstOfBrand = real.filter((p, i) => real.findIndex((q) => q.brandSlug === p.brandSlug) === i);
  const picked = [...firstOfBrand, ...real.filter((p) => !firstOfBrand.includes(p))].slice(0, 8);
  const demo = NEW_ARRIVALS.map(([brand, cat, k]) => products.filter((p) => p.brandSlug === slugify(brand) && p.category === cat && !p.image)[k]);
  return [...picked, ...demo].slice(0, 8);
}

/** Pièces proposées dans « Crée ta tenue » : quelques articles par emplacement. */
export async function getOutfitPieces(): Promise<Record<"top" | "bottom" | "shoes", Product[]>> {
  const walk = WALK_BRANDS.slice(0, 8).map(slugify);
  const products = await allProducts();
  const pick = (cats: CategoryId[]) =>
    products.filter((p) => cats.includes(p.category) && walk.includes(p.brandSlug)).filter((_, i) => i % 3 === 0).slice(0, 8);
  return { top: pick(["tee", "hoodie"]), bottom: pick(["pants"]), shoes: pick(["sneaker"]) };
}
