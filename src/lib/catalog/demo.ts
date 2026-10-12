// DONNÉES DE DÉMONSTRATION — aucune vraie donnée pour l'instant.
// Générées de façon déterministe (mêmes produits à chaque build). Elles seront
// remplacées par la base de données ; seules les fonctions de ./index.ts changent.
import { ALL_BRANDS, WALK_BRANDS, brandStyle, hash, slugify } from "./brands";
import type { Brand, Category, CategoryId, Product } from "./types";

export const CATEGORIES: Category[] = [
  { id: "tee", slug: "t-shirts", label: "T-shirts", slot: "top", sizes: ["XS", "S", "M", "L", "XL"] },
  { id: "hoodie", slug: "hoodies", label: "Hoodies", slot: "top", sizes: ["S", "M", "L", "XL", "XXL"] },
  { id: "pants", slug: "pantalons", label: "Pantalons", slot: "bottom", sizes: ["28", "30", "32", "34", "36"] },
  { id: "sneaker", slug: "sneakers", label: "Sneakers", slot: "shoes", sizes: ["40", "41", "42", "43", "44", "45"] },
  { id: "cap", slug: "chapeaux", label: "Chapeaux", slot: "accessory", sizes: ["Unique"] },
  { id: "bag", slug: "accessoires", label: "Accessoires", slot: "accessory", sizes: ["Unique"] },
];

export const COLORS = ["#F1ECE0", "#141416", "#680209", "#420A0D", "#6B6766", "#EAE0C8", "#202833", "#9A938A", "#2B2A2C", "#C9BFAA"];
export const DARK = ["#141416", "#202833", "#2B2A2C", "#420A0D", "#680209", "#6B6766", "#0A0A0C"];
export const accentFor = (c: string) => (DARK.includes(c) ? "#EAE0C8" : "#420A0D");

const NAMES: Record<CategoryId, string[]> = {
  tee: ["T-shirt essentiel", "T-shirt oversize", "T-shirt brodé", "T-shirt heavyweight", "T-shirt délavé"],
  hoodie: ["Hoodie brodé", "Hoodie oversize", "Hoodie zippé", "Hoodie molleton épais", "Hoodie délavé"],
  pants: ["Jogging cargo", "Pantalon droit", "Jogging molleton", "Cargo ripstop", "Pantalon large"],
  sneaker: ["Sneaker basse cuir", "Sneaker montante", "Runner mesh", "Sneaker rétro", "Sneaker plateforme"],
  cap: ["Casquette brodée", "Casquette 5 panneaux", "Bob", "Casquette délavée", "Casquette logo"],
  bag: ["Sacoche bandoulière", "Sac banane", "Tote bag", "Pochette", "Sac à dos"],
};
const PRICE: Record<CategoryId, [number, number]> = {
  tee: [65, 95], hoodie: [140, 220], pants: [120, 180], sneaker: [120, 240], cap: [35, 70], bag: [45, 160],
};

/** Nombre d'articles par rayon et par marque (démo). */
export const PER_RAYON = 6;

export const BRANDS: Brand[] = ALL_BRANDS.map((name) => ({
  slug: slugify(name),
  name,
  style: brandStyle(name),
  inWalk: WALK_BRANDS.includes(name),
}));

function makeProducts(brand: Brand, cat: Category): Product[] {
  const names = NAMES[cat.id];
  const [lo, hi] = PRICE[cat.id];
  const seed = hash(`${brand.name}|${cat.id}`);
  return Array.from({ length: PER_RAYON }, (_, i) => {
    const ci = (i * 3 + seed) % COLORS.length;
    const color = COLORS[ci];
    const name = names[(i + seed) % names.length];
    return {
      slug: `${brand.slug}-${slugify(name)}-${cat.id}-${i + 1}`,
      brandSlug: brand.slug,
      brandName: brand.name,
      category: cat.id,
      name,
      price: Math.round((lo + ((i * 37 + seed) % (hi - lo))) / 5) * 5,
      color,
      accent: accentFor(color),
      colors: [color, COLORS[(ci + 3) % COLORS.length], COLORS[(ci + 6) % COLORS.length]],
      sizes: cat.sizes,
    };
  });
}

export const PRODUCTS: Product[] = BRANDS.flatMap((b) => CATEGORIES.flatMap((c) => makeProducts(b, c)));

/** Nouveautés mises en avant (démo). */
export const NEW_ARRIVALS: [string, CategoryId, number][] = [
  ["Trapstar", "hoodie", 2], ["Nike", "sneaker", 0], ["Corteiz", "pants", 3], ["Stüssy", "tee", 1],
  ["Represent", "hoodie", 5], ["Palm Angels", "tee", 4], ["Essentials", "pants", 0], ["Carhartt WIP", "cap", 2],
];
