import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { SUPABASE_URL } from "@/lib/server/env";
import { brandStyle } from "./brands";
import type { Brand, BrandStyle, Category, PricedProduct } from "./types";

// Vrais articles lus dans la base (Supabase), avec la clé service : les coûts ne sont plus lisibles avec la clé
// publique (migration 0012). Mis en cache ; l'admin vide le cache « catalogue » à chaque modification.
// Si la base ne répond pas (pause, panne, réglage absent), on renvoie null : le site garde sa copie de secours.

export const CATALOGUE_TAG = "catalogue";

export type Row = {
  slug: string;
  title: { fr?: string };
  cost: number | null;
  price_usd: number | null;
  weight_g: number | null;
  colors: string[];
  sizes: string[] | null;
  brands: { slug: string } | null;
  categories: { code: string } | null;
  product_images: { view: "front" | "back" | "detail"; path: string; position: number }[];
};

const SELECT = "slug,title,cost,price_usd,weight_g,colors,sizes,position,brands(slug),categories(code),product_images(view,path,position)";

/** Transforme une ligne de la base en article du site ; null si elle est incomplète (marque ou catégorie inconnue). */
export function toProduct(r: Row, brands: Brand[], categories: Category[], accentFor: (c: string) => string): PricedProduct | null {
  const brand = brands.find((b) => b.slug === r.brands?.slug);
  const cat = categories.find((c) => c.id === r.categories?.code);
  const name = r.title?.fr;
  if (!brand || !cat || !name || r.cost == null || !r.weight_g || !r.colors.length) return null;
  const imgs = [...r.product_images].sort((a, b) => a.position - b.position);
  const front = imgs.find((i) => i.view === "front")?.path;
  if (!front) return null;
  return {
    slug: r.slug,
    brandSlug: brand.slug,
    brandName: brand.name,
    category: cat.id,
    name,
    cost: { cny: r.cost / 100, g: r.weight_g, ...(r.price_usd ? { usd: r.price_usd / 100 } : {}) },
    color: r.colors[0],
    accent: accentFor(r.colors[0]),
    colors: r.colors,
    sizes: r.sizes?.length ? r.sizes : cat.sizes,
    image: { front, back: imgs.find((i) => i.view === "back")?.path, details: imgs.filter((i) => i.view === "detail").map((i) => i.path) },
  };
}

export type BrandRow = { slug: string; name: string; style: Partial<BrandStyle> | null; logo_url: string | null };

/** Transforme une ligne de la base en marque du site. */
export function toBrand(r: BrandRow): Brand {
  const style: BrandStyle = { ...brandStyle(r.name), ...r.style, name: r.name };
  if (r.logo_url) style.logo = r.logo_url;
  return { slug: r.slug, name: r.name, style };
}

/** Lignes brutes des articles du site, dans l'ordre d'affichage ; null si la base ne répond pas. */
export async function loadSiteRows(): Promise<Row[] | null> {
  "use cache";
  cacheTag(CATALOGUE_TAG);
  return read<Row>(`products?select=${SELECT}&status=eq.active&on_site=is.true&order=position.asc,created_at.asc`);
}

/** Boutiques visibles, dans l'ordre du mall ; null si la base ne répond pas. */
export type CategoryRow = { code: string; slug: string; name: { fr?: string }; slot: Category["slot"]; sizes: string[]; weight_g: number | null };

/** Types de vêtement de la base (ceux du code, plus ceux créés depuis l'admin). */
export async function loadCategoryRows(): Promise<CategoryRow[] | null> {
  "use cache";
  cacheTag(CATALOGUE_TAG);
  return read<CategoryRow>("categories?select=code,slug,name,slot,sizes,weight_g&order=position.asc");
}

export async function loadBrandRows(): Promise<BrandRow[] | null> {
  "use cache";
  cacheTag(CATALOGUE_TAG);
  return read<BrandRow>("brands?select=slug,name,style,logo_url&active=is.true&order=walk_position.asc.nullslast,name.asc");
}

async function read<T>(path: string): Promise<T[] | null> {
  const url = SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    cacheLife("hours");
    return null;
  }
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const rows = (await res.json()) as T[];
    cacheLife("hours"); // l'admin vide ce cache à chaque modification : les changements se voient tout de suite
    return rows;
  } catch (e) {
    cacheLife("minutes"); // base en panne : on réessaie vite, sans rester des heures sur la copie de secours
    console.error("[catalogue] base injoignable, copie de secours utilisée :", e);
    return null;
  }
}

/** Liste des types : ceux du code d'abord (dessins du Walk), puis ceux créés depuis l'admin. */
export function mergeCategories(code: Category[], rows: CategoryRow[] | null): Category[] {
  const extra = (rows ?? [])
    .filter((r) => !code.some((c) => c.id === r.code))
    .map((r): Category => ({ id: r.code, slug: r.slug, label: r.name.fr ?? r.code, slot: r.slot, sizes: r.sizes, ...(r.weight_g ? { weight: r.weight_g } : {}) }));
  return [...code, ...extra];
}
