// Point d'accès unique au catalogue. Les pages n'appellent que ces fonctions.
// Articles : la base (src/lib/catalog/db.ts), modifiable depuis l'admin ; copie de secours si elle ne répond pas.
// Boutiques : la base aussi. Une marque sans article ou masquée n'existe pas sur le site. Catégories : dans le code.
import { loadBrandRows, loadSiteRows, toBrand, toProduct } from "./db";
import { BRANDS, CATEGORIES, REAL_SNAPSHOT, accentFor } from "./fallback";
import { priceTable } from "@/models/pricing/price";
import type { Brand, Category, CategoryId, PricedProduct, Product } from "./types";

export type { Brand, Category, CategoryId, PricedProduct, Product } from "./types";
export { CATEGORIES } from "./fallback";

const stockedSlugs = async () => new Set((await pricedProducts()).map((p) => p.brandSlug));

export async function getBrands(): Promise<Brand[]> {
  const [stocked, brands] = await Promise.all([stockedSlugs(), visibleBrands()]);
  return brands.filter((b) => stocked.has(b.slug));
}

/** Boutiques visibles, dans l'ordre choisi dans l'admin ; celles de la copie de secours si la base ne répond pas. */
async function visibleBrands(): Promise<Brand[]> {
  const rows = await loadBrandRows();
  return rows ? rows.map(toBrand) : BRANDS;
}

/** Boutiques du mall, dans l'ordre du parcours. */
export const getWalkBrands = getBrands;

export async function getBrand(slug: string): Promise<Brand | undefined> {
  return (await getBrands()).find((b) => b.slug === slug);
}

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id)!;
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return CATEGORIES.find((c) => c.slug === slug);
}

/** Articles du site : la base, ou la copie de secours si elle ne répond pas. */
async function pricedProducts(): Promise<PricedProduct[]> {
  const [rows, brands] = await Promise.all([loadSiteRows(), visibleBrands()]);
  return rows ? rows.map((r) => toProduct(r, brands, CATEGORIES, accentFor)).filter((p): p is PricedProduct => p !== null) : REAL_SNAPSHOT;
}

/** Faux si le site montre sa copie de secours : ses prix peuvent être périmés, on n'encaisse pas. */
export const catalogIsLive = async () => (await loadSiteRows()) !== null;

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

/** Catégories qui ont au moins un article, dans l'ordre d'affichage. */
export async function getStockedCategories(): Promise<Category[]> {
  const stocked = new Set((await pricedProducts()).map((p) => p.category));
  return CATEGORIES.filter((c) => stocked.has(c.id));
}

/** Nouveautés : une pièce par marque d'abord, puis les suivantes. */
export async function getNewArrivals(): Promise<Product[]> {
  const products = await allProducts();
  const first = products.filter((p, i) => products.findIndex((q) => q.brandSlug === p.brandSlug) === i);
  return [...first, ...products.filter((p) => !first.includes(p))].slice(0, 8);
}

/** Pièces proposées dans « Crée ta tenue ». Un emplacement sans pièce disponible reste vide. */
export async function getOutfitPieces(): Promise<Record<"top" | "bottom" | "shoes", Product[]>> {
  const products = await allProducts();
  const pick = (cats: CategoryId[]) => products.filter((p) => cats.includes(p.category)).slice(0, 12);
  return { top: pick(["tee", "hoodie"]), bottom: pick(["pants", "shorts"]), shoes: pick(["sneaker"]) };
}
