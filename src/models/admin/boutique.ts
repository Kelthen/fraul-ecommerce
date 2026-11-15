// Fiche de boutique saisie dans l'admin par Jean Paul : vérification, couleur tirée du logo, place dans le mall.
// Pur, sans base ni navigateur (testé dans boutique.test.ts).
import { slugify } from "../../lib/catalog/brands.ts";

export type BoutiqueInput = {
  slug?: string;
  name: string;
  logo?: string;
  color: string;
  /** Couleur du nom sur l'enseigne ; sans elle, la plus lisible sur le fond. */
  textColor?: string;
  /** Place dans le mall : 1 = la première boutique du parcours. */
  place: number;
  visible: boolean;
};

const HEX = /^#[0-9A-F]{6}$/i;
const LOGO = /^https:\/\/[a-z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/produits\/[a-z0-9/-]+\.(jpg|jpeg|png|webp)$/;
const FALLBACK = "#111113";
/** En dessous, le nom d'une marque se lit mal sur son enseigne. */
const MIN_CONTRAST = 3;

/** Problèmes de la fiche, en clair, prêts à afficher. `others` : noms des autres boutiques. Tableau vide = fiche correcte. */
export function boutiqueProblems(b: BoutiqueInput, others: string[]): string[] {
  const p: string[] = [];
  if (b.name.trim().length < 2 || b.name.length > 60) p.push("Le nom doit faire entre 2 et 60 caractères.");
  else if (others.some((o) => slugify(o) === slugify(b.name))) p.push("Une boutique porte déjà ce nom."); // « Gucci » et « gucci », la même
  if (!HEX.test(b.color) || (b.textColor !== undefined && !HEX.test(b.textColor))) p.push("Choisis une couleur.");
  else if (!b.logo && b.textColor && contrast(b.color, b.textColor) < MIN_CONTRAST) p.push("Ces deux couleurs sont trop proches : le nom serait illisible.");
  if (b.logo && !LOGO.test(b.logo)) p.push("Le logo n'a pas été envoyé correctement : remets-le.");
  if (!Number.isInteger(b.place) || b.place < 1) p.push("La place dans le mall doit être un nombre, à partir de 1.");
  return p;
}

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const luminance = (hex: string) => {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Écart de lisibilité entre deux couleurs, de 1 (identiques) à 21 (noir sur blanc). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Texte lisible sur cette couleur : encre sur fond clair, ivoire sur fond sombre. */
export function textOn(hex: string): string {
  const [r, g, b] = channels(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#141416" : "#FFFEF7";
}

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

type Tally = [number, number, number, number]; // rouge, vert, bleu cumulés, nombre de pixels

/** Couleurs d'un logo (pixels RVBA), des plus présentes aux moins présentes. Le fond clair et la transparence ne comptent jamais. */
function logoPalette(rgba: ArrayLike<number>): { vivid: Tally[]; dark: Tally[]; vividShare: number } {
  const vivid = new Map<number, Tally>();
  const dark = new Map<number, Tally>();
  let opaque = 0;
  let vividCount = 0;
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue;
    opaque++;
    const [r, g, b] = [rgba[i], rgba[i + 1], rgba[i + 2]];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const isVivid = max - min > 40 && max > 40 && min < 225;
    if (!isVivid && min > 170) continue; // blanc, gris clair : le fond
    const bucket = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const map = isVivid ? vivid : dark;
    const e = map.get(bucket) ?? [0, 0, 0, 0];
    e[0] += r; e[1] += g; e[2] += b; e[3]++;
    map.set(bucket, e);
    if (isVivid) vividCount++;
  }
  const sorted = (m: Map<number, Tally>) => [...m.values()].sort((x, y) => y[3] - x[3]);
  return { vivid: sorted(vivid), dark: sorted(dark), vividShare: opaque ? vividCount / opaque : 0 };
}

const tallyHex = ([r, g, b, n]: Tally) => toHex(r / n, g / n, b / n);

/**
 * Les 2 couleurs d'enseigne tirées d'un logo. Fond : la couleur vive la plus présente, ou un noir pour un logo noir et blanc.
 * Texte : la couleur suivante du logo qui se lit sur ce fond, sinon l'encre ou l'ivoire.
 */
export function logoColors(rgba: ArrayLike<number>): { color: string; textColor: string } {
  const { vivid, dark, vividShare } = logoPalette(rgba);
  // Quelques pixels colorés (bords adoucis d'un logo noir) ne font pas une couleur.
  const main = vividShare >= 0.02 ? vivid : dark;
  const color = main[0] ? tallyHex(main[0]) : FALLBACK;
  const next = [...main.slice(1), ...(main === vivid ? dark : [])].map(tallyHex).find((c) => contrast(c, color) >= MIN_CONTRAST);
  return { color, textColor: next ?? textOn(color) };
}

/** Couleur de boutique tirée d'un logo. */
export const logoColor = (rgba: ArrayLike<number>) => logoColors(rgba).color;

/** La liste avec `item` à la place demandée (1 = en tête) ; une place trop grande le met à la fin. */
export function moveToPlace<T>(list: T[], item: T, place: number): T[] {
  const rest = list.filter((x) => x !== item);
  const at = Math.min(Math.max(0, place - 1), rest.length);
  return [...rest.slice(0, at), item, ...rest.slice(at)];
}
