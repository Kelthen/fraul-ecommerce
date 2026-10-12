import type { CSSProperties } from "react";
import type { BrandStyle, FontKey } from "./types";

// Une ligne de données par marque pilote sa vitrine, son enseigne, l'intérieur
// de sa boutique et les vêtements des mannequins (repris de la démo V2).

export const FONTS: Record<FontKey, { family: "sans" | "serif"; weight: number; italic: boolean }> = {
  sansX: { family: "sans", weight: 800, italic: false },
  sansXi: { family: "sans", weight: 800, italic: true },
  sansL: { family: "sans", weight: 300, italic: false },
  serif: { family: "serif", weight: 600, italic: false },
  serifI: { family: "serif", weight: 400, italic: true },
  serifIB: { family: "serif", weight: 600, italic: true },
};

const PRESET: Record<string, Omit<BrandStyle, "name">> = {
  Nike: { bg: "#111113", fg: "#FFFEF7", font: "sansXi", sp: 0.02, up: true },
  Trapstar: { bg: "#680209", fg: "#FFFEF7", font: "sansX", sp: 0.16, up: true },
  Corteiz: { bg: "#E6DCC4", fg: "#141416", font: "serif", sp: 0.1, up: true },
  "Stüssy": { bg: "#202833", fg: "#EAE0C8", font: "serifI", sp: 0.02, up: false },
  Represent: { bg: "#0E0E10", fg: "#EAE0C8", font: "sansL", sp: 0.3, up: true },
  "Palm Angels": { bg: "#F3EEE2", fg: "#141416", font: "serifIB", sp: 0.02, up: false },
  Essentials: { bg: "#5F5B59", fg: "#FFFEF7", font: "sansL", sp: 0.26, up: true },
  "Carhartt WIP": { bg: "#420A0D", fg: "#EAE0C8", font: "sansX", sp: 0.06, up: true },
};

const AUTO_BG = ["#111113", "#680209", "#E6DCC4", "#202833", "#420A0D", "#F3EEE2", "#2B2A2C", "#5F5B59"];

export const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Style d'une marque : réglage manuel s'il existe, sinon généré à partir du nom. */
export function brandStyle(name: string): BrandStyle {
  const preset = PRESET[name];
  if (preset) return { name, ...preset };
  const h = hash(name);
  const bg = AUTO_BG[h % AUTO_BG.length];
  const keys = Object.keys(FONTS) as FontKey[];
  const font = keys[(h >>> 3) % keys.length]; // décalage non signé : la démo V2 plantait ici pour certaines marques
  const light = ["#E6DCC4", "#F3EEE2"].includes(bg);
  const italic = FONTS[font].italic && font.startsWith("serif");
  return {
    name,
    bg,
    fg: light ? "#141416" : "#FFFEF7",
    font,
    sp: FONTS[font].weight === 300 ? 0.24 : italic ? 0.02 : 0.08,
    up: !italic,
  };
}

/** Texte de l'enseigne (jamais le logo déposé de la marque). */
export const signWord = (st: BrandStyle) => (st.up ? st.name.toUpperCase() : st.name);

/** Style CSS du nom de marque, avec les polices du site. */
export function signCss(st: BrandStyle): CSSProperties {
  const f = FONTS[st.font];
  return {
    fontFamily: f.family === "serif" ? "var(--font-serif)" : "var(--font-sans)",
    fontWeight: f.weight,
    fontStyle: f.italic ? "italic" : "normal",
    letterSpacing: `${st.sp}em`,
  };
}

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'.]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Noms de marques à titre d'exemple : le vrai catalogue viendra du fournisseur.
export const ALL_BRANDS = [
  "Adidas", "Amiri", "Arc’teryx", "Broken Planet", "Carhartt WIP", "Chrome Hearts", "Cole Buxton",
  "Corteiz", "Denim Tears", "Essentials", "Fear of God", "Gallery Dept.", "Hellstar", "Jordan",
  "Moncler", "New Balance", "Nike", "Off-White", "Palm Angels", "Represent", "Rhude", "Sp5der",
  "Stone Island", "Stüssy", "Syna World", "The North Face", "Trapstar",
];

/** Marques phares : en tête du parcours du mall (début du tronc du T, là où tout le monde passe). */
const FEATURED = ["Nike", "Trapstar", "Corteiz", "Stüssy", "Represent", "Palm Angels", "Essentials", "Carhartt WIP"];

/** Ordre des 27 boutiques dans le mall en T : les marques phares, puis les autres de A à Z.
 *  (décidé par l'équipe, à confirmer) */
export const WALK_BRANDS = [...FEATURED, ...ALL_BRANDS.filter((b) => !FEATURED.includes(b))];
