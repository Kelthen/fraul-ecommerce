import "server-only";
import { brandStyle, slugify } from "@/lib/catalog/brands";
import type { BrandStyle } from "@/lib/catalog/types";
import { moveToPlace, textOn, type BoutiqueInput } from "@/models/admin/boutique";
import { db, eq } from "./db";

// Boutiques (table brands) vues et modifiées depuis l'admin (clé service, après vérification de la session).
// Une boutique sans article ne se voit pas sur le site, même « visible ». Masquer garde tout ; retirer efface la ligne,
// seulement si aucun article ne s'y rattache (les commandes passées gardent ainsi leurs fiches).

export type AdminBoutique = {
  slug: string;
  name: string;
  logo: string | null;
  color: string;
  textColor: string;
  visible: boolean;
  /** Place dans le mall, à partir de 1. */
  place: number;
  articles: number;
};

type Row = {
  id: string;
  slug: string;
  name: string;
  style: Partial<BrandStyle>;
  logo_url: string | null;
  active: boolean;
  products: { count: number }[];
};

const SELECT = "select=id,slug,name,style,logo_url,active,products(count)&order=walk_position.asc.nullslast,name.asc";

const rows = () => db.select<Row>("brands", SELECT);

const toBoutique = (r: Row, i: number): AdminBoutique => ({
  slug: r.slug,
  name: r.name,
  logo: r.logo_url,
  color: r.style?.bg ?? brandStyle(r.name).bg,
  textColor: r.style?.fg ?? brandStyle(r.name).fg,
  visible: r.active,
  place: i + 1,
  articles: r.products[0]?.count ?? 0,
});

export const listBoutiques = async (): Promise<AdminBoutique[]> => (await rows()).map(toBoutique);

export const getBoutique = async (slug: string): Promise<AdminBoutique | null> =>
  (await listBoutiques()).find((b) => b.slug === slug) ?? null;

/** Range les places à la suite, en ne touchant que les boutiques qui bougent. */
async function writePlaces(before: string[], after: string[]): Promise<void> {
  for (let i = 0; i < after.length; i++) {
    if (before[i] !== after[i]) await db.update("brands", `slug=${eq(after[i])}`, { walk_position: i });
  }
}

export async function placeBoutique(slug: string, place: number): Promise<void> {
  const slugs = (await rows()).map((r) => r.slug);
  await writePlaces(slugs, moveToPlace(slugs, slug, place));
}

/** Adresse libre pour un nouveau nom : « corteiz », puis « corteiz-2 » si elle existe déjà. */
function freeSlug(name: string, taken: string[]): string {
  const base = slugify(name) || "boutique";
  if (!taken.includes(base)) return base;
  for (let i = 2; ; i++) if (!taken.includes(`${base}-${i}`)) return `${base}-${i}`;
}

export async function saveBoutique(b: BoutiqueInput): Promise<string> {
  const all = await rows();
  const old = b.slug ? all.find((r) => r.slug === b.slug) : null;
  if (b.slug && !old) throw new Error("Boutique introuvable");
  const name = b.name.trim();
  const fields = {
    name,
    // Police et espacement gardés, ou choisis d'après le nom ; couleur choisie par Jean Paul.
    style: { ...brandStyle(name), ...old?.style, name, bg: b.color.toUpperCase(), fg: (b.textColor ?? textOn(b.color)).toUpperCase() },
    logo_url: b.logo || null,
    active: b.visible,
    in_walk: true,
  };
  const slug = old ? old.slug : freeSlug(name, all.map((r) => r.slug));
  if (old) await db.update("brands", `slug=${eq(slug)}`, fields);
  else await db.insert("brands", { slug, ...fields, walk_position: all.length });
  await placeBoutique(slug, b.place);
  return slug;
}

export async function setVisible(slug: string, visible: boolean): Promise<void> {
  await db.update("brands", `slug=${eq(slug)}`, { active: visible });
}

/** Efface la boutique. Refusé si des articles s'y rattachent : ils restent liés aux commandes passées. */
export async function removeBoutique(slug: string): Promise<boolean> {
  const b = await getBoutique(slug);
  if (!b || b.articles > 0) return false;
  await db.remove("brands", `slug=${eq(slug)}`);
  const slugs = (await rows()).map((r) => r.slug);
  await writePlaces([], slugs);
  return true;
}
