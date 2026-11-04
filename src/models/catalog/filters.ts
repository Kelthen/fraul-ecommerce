// Filtres du catalogue : lecture et écriture dans l'adresse (lien partageable), tri, valeurs proposées.
// Pur (testé dans filters.test.ts). Dans un même filtre, une valeur OU une autre ; entre deux filtres, les deux à la fois.
import type { PriceTable, ZoneId } from "../pricing/public.ts";

export type Filterable = { slug: string; category: string; brandSlug: string; brandName: string; colors: string[]; sizes: string[]; prices: PriceTable };

export const SORTS = [
  { id: "nouveautes", label: "Nouveautés" },
  { id: "prix-croissant", label: "Prix croissant" },
  { id: "prix-decroissant", label: "Prix décroissant" },
] as const;
export type SortId = (typeof SORTS)[number]["id"];

export type Filters = { types: string[]; brands: string[]; colors: string[]; sizes: string[]; sort: SortId };
export const NO_FILTERS: Filters = { types: [], brands: [], colors: [], sizes: [], sort: "nouveautes" };

const CLEAN = /^[\p{L}\p{N} ._-]{1,40}$/u;
const list = (raw: string | null) => [...new Set((raw ?? "").split(",").map((v) => v.trim()).filter((v) => CLEAN.test(v)))].slice(0, 30);

/** Lit les filtres de l'adresse. Ce qui est abîmé ou inconnu est ignoré. */
export function parseFilters(q: { get(name: string): string | null }): Filters {
  const sort = q.get("tri");
  return {
    types: list(q.get("type")),
    brands: list(q.get("marque")),
    colors: list(q.get("couleur")).map((c) => c.toUpperCase()),
    sizes: list(q.get("taille")),
    sort: SORTS.some((s) => s.id === sort) ? (sort as SortId) : "nouveautes",
  };
}

/** Écrit les filtres pour l'adresse, sans ce qui est vide. Les couleurs perdent leur # (illisible dans un lien). */
export function filtersQuery(f: Filters): string {
  const q = new URLSearchParams();
  if (f.types.length) q.set("type", f.types.join(","));
  if (f.brands.length) q.set("marque", f.brands.join(","));
  if (f.colors.length) q.set("couleur", f.colors.join(","));
  if (f.sizes.length) q.set("taille", f.sizes.join(","));
  if (f.sort !== "nouveautes") q.set("tri", f.sort);
  return q.toString();
}

export const activeCount = (f: Filters) => f.types.length + f.brands.length + f.colors.length + f.sizes.length;

const colorKey = (hex: string) => hex.replace("#", "").toUpperCase();

/** Les articles qui passent les filtres, triés. « Nouveautés » garde l'ordre du catalogue. */
export function applyFilters<T extends Filterable>(items: T[], f: Filters, zone: ZoneId): T[] {
  const kept = items.filter(
    (p) =>
      (!f.types.length || f.types.includes(p.category)) &&
      (!f.brands.length || f.brands.includes(p.brandSlug)) &&
      (!f.colors.length || p.colors.some((c) => f.colors.includes(colorKey(c)))) &&
      (!f.sizes.length || p.sizes.some((s) => f.sizes.includes(s))),
  );
  if (f.sort === "nouveautes") return kept;
  const dir = f.sort === "prix-croissant" ? 1 : -1;
  return [...kept].sort((a, b) => dir * (a.prices[zone] - b.prices[zone]));
}

/** Ordre des tailles : vêtements du plus petit au plus grand, pointures par nombre. */
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "Unique", "TU"];
function bySize(a: string, b: string) {
  const [i, j] = [SIZE_ORDER.indexOf(a), SIZE_ORDER.indexOf(b)];
  if (i >= 0 && j >= 0) return i - j;
  if (i >= 0 || j >= 0) return i >= 0 ? -1 : 1;
  return Number(a) - Number(b) || a.localeCompare(b, "fr");
}

/** Valeurs à proposer : seulement celles qui ont au moins un article. */
export function facets(items: Filterable[]) {
  const brands = new Map(items.map((p) => [p.brandSlug, p.brandName]));
  return {
    types: [...new Set(items.map((p) => p.category))],
    brands: [...brands].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label, "fr")),
    colors: [...new Set(items.flatMap((p) => p.colors.map(colorKey)))],
    sizes: [...new Set(items.flatMap((p) => p.sizes))].sort(bySize),
  };
}
