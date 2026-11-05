// Fiche d'article saisie dans l'admin par Jean Paul : vérification et marge. Pur, sans base (testé dans article.test.ts).
// Prix tapé en dollars (droits et livraison compris) ; coût en ¥ obligatoire (Serge, 3 nov. 2026) :
// sans lui, ni prix plancher (R5) ni alerte de marge.
import { ZONES, type ZoneId } from "../pricing/config.ts";
import { customerPrice, landedCost, type Cost } from "../pricing/price.ts";

export type ArticleInput = {
  slug?: string;
  brand: string;
  category: string;
  name: string;
  priceUsd: number;
  costCny: number;
  weightG: number;
  colors: string[];
  sizes: string[];
  supplierRef?: string;
  photos: { front: string; back?: string; details: string[] };
  onSite: boolean;
};

/** Sous cette marge (en % du prix payé), l'admin prévient (Serge, 3 nov. 2026). */
export const MARGIN_ALERT_PCT = 10;
const HEX = /^#[0-9A-F]{6}$/i;
const PHOTO = /^(\/images\/library\/[a-z0-9-]+\.(jpg|jpeg|png|webp)|https:\/\/[a-z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/produits\/[A-Za-z0-9/_.-]+)$/;

/** Adresse de photo remise d'aplomb : sans espaces ni retours à la ligne, sans « // » en trop après le domaine. */
export const cleanPhotoUrl = (u: string) => u.replace(/\s+/g, "").replace(/([^:])\/{2,}/g, "$1/");

/** La fiche avec ses adresses de photos nettoyées (à appeler avant articleProblems et l'enregistrement). */
export const cleanArticle = (a: ArticleInput): ArticleInput => ({
  ...a,
  photos: { front: cleanPhotoUrl(a.photos.front), back: a.photos.back ? cleanPhotoUrl(a.photos.back) : undefined, details: a.photos.details.map(cleanPhotoUrl) },
});

/** Problèmes de la fiche, en clair, prêts à afficher. Tableau vide = fiche correcte. */
export function articleProblems(a: ArticleInput, known: { brands: string[]; categories: string[] }): string[] {
  const p: string[] = [];
  if (!known.brands.includes(a.brand)) p.push("Choisis une marque.");
  if (!known.categories.includes(a.category)) p.push("Choisis une catégorie.");
  if (a.name.trim().length < 3 || a.name.length > 120) p.push("Le nom doit faire entre 3 et 120 caractères.");
  if (!(a.priceUsd >= 1 && a.priceUsd <= 20000)) p.push("Prix en dollars : entre 1 et 20 000.");
  if (!(a.costCny > 0 && a.costCny <= 100000)) p.push("Coût en ¥ obligatoire (il protège du prix trop bas).");
  if (!(a.weightG >= 10 && a.weightG <= 30000)) p.push("Poids : entre 10 g et 30 kg.");
  if (!a.colors.length || a.colors.length > 6 || !a.colors.every((c) => HEX.test(c))) p.push("Couleur : touche au moins une pastille de couleur (6 au plus).");
  if (!a.sizes.length || a.sizes.length > 15 || a.sizes.some((s) => !s.trim() || s.length > 12)) p.push("Tailles : 1 à 15, séparées par des virgules.");
  if (a.supplierRef && a.supplierRef.length > 80) p.push("Référence fournisseur trop longue.");
  const all = [a.photos.front, ...(a.photos.back ? [a.photos.back] : []), ...a.photos.details];
  if (!a.photos.front) p.push("Ajoute au moins la photo de face.");
  else if (!all.every((u) => PHOTO.test(u))) p.push("Une photo n'a pas été envoyée correctement : remets-la.");
  if (a.photos.details.length > 6) p.push("6 photos de détail au plus.");
  return p;
}

export type ZoneMargin = { zone: ZoneId; currency: string; price: number; landed: number; marginPct: number; raisedToFloor: boolean; low: boolean };

/** Prix payé, coût rendu et marge dans chaque zone : ce que Jean Paul voit avant d'enregistrer. */
export function marginsByZone(priceUsd: number, costCny: number, weightG: number): ZoneMargin[] {
  const cost: Cost = { cny: costCny, g: weightG, usd: priceUsd };
  return (Object.keys(ZONES) as ZoneId[]).map((zone) => {
    const price = customerPrice(cost, zone);
    const landed = landedCost(cost, zone);
    const asked = customerPrice({ ...cost, cny: 0, g: 0 }, zone); // prix converti, sans plancher
    const marginPct = Math.round(((price - landed) / price) * 100);
    return { zone, currency: ZONES[zone].currency, price, landed, marginPct, low: marginPct < MARGIN_ALERT_PCT, raisedToFloor: price > asked };
  });
}

/** Adresse lisible de l'article, unique : « nike-tech-fleece-noir », puis « …-2 » si elle existe déjà. */
export function articleSlug(brandSlug: string, name: string, taken: (s: string) => boolean): string {
  const base = `${brandSlug}-${name}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  if (!taken(base)) return base;
  for (let i = 2; ; i++) if (!taken(`${base}-${i}`)) return `${base}-${i}`;
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Liste de l'admin : recherche (« nike pantalon » = tous les mots, sans accents, dans le nom, la marque ou le type),
 * filtres marque et type, puis classée par marque. L'ordre d'origine est gardé dans chaque marque.
 */
export function filterArticles<T extends { name: string; brand: string; category: string }>(
  list: T[],
  f: { q?: string; brand?: string; type?: string },
  label: { brand: (slug: string) => string; type: (id: string) => string },
): T[] {
  const words = fold(f.q ?? "").split(/\s+/).filter(Boolean);
  return list
    .filter((a) => (!f.brand || a.brand === f.brand) && (!f.type || a.category === f.type))
    .filter((a) => {
      const text = fold(`${a.name} ${label.brand(a.brand)} ${a.brand} ${label.type(a.category)}`);
      return words.every((w) => text.includes(w));
    })
    .map((a, i) => ({ a, i }))
    .sort((x, y) => label.brand(x.a.brand).localeCompare(label.brand(y.a.brand), "fr") || x.i - y.i)
    .map((x) => x.a);
}
