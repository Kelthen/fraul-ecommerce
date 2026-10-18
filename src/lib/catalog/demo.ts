// DONNÉES DE DÉMONSTRATION — aucune vraie donnée pour l'instant.
// Générées de façon déterministe (mêmes produits à chaque build). Elles seront
// remplacées par la base de données ; seules les fonctions de ./index.ts changent.
import { ALL_BRANDS, REAL_PRODUCTS_ONLY, WALK_BRANDS, brandStyle, hash, slugify } from "./brands";
import { IMAGES, type ImageId } from "../images";
import { SUPPLIER_PRODUCTS } from "./supplier";
import { COLORS } from "./palette";
import type { Brand, Category, CategoryId, Product } from "./types";

/** Catégories du site, dans l'ordre d'affichage. Ajouter une catégorie : une ligne ici + NAMES, COST_CNY,
 *  WEIGHT_G ci-dessous + son dessin (art.ts). Dans le Walk, elle n'apparaît qu'une fois son portant placé
 *  (src/walk/models/store-layout.ts). */
export const CATEGORIES: Category[] = [
  { id: "tee", slug: "t-shirts", label: "T-shirts", slot: "top", sizes: ["XS", "S", "M", "L", "XL"] },
  { id: "hoodie", slug: "hoodies", label: "Hoodies et sweats", slot: "layer", sizes: ["S", "M", "L", "XL", "XXL"] },
  { id: "jacket", slug: "vestes-manteaux", label: "Vestes et manteaux", slot: "layer", sizes: ["S", "M", "L", "XL", "XXL"] },
  { id: "pants", slug: "pantalons", label: "Pantalons", slot: "bottom", sizes: ["28", "30", "32", "34", "36"] },
  { id: "shorts", slug: "shorts", label: "Shorts", slot: "bottom", sizes: ["S", "M", "L", "XL"] },
  { id: "socks", slug: "chaussettes", label: "Chaussettes", slot: "socks", sizes: ["36-40", "41-46"] },
  { id: "sneaker", slug: "sneakers", label: "Sneakers", slot: "shoes", sizes: ["40", "41", "42", "43", "44", "45"] },
  { id: "cap", slug: "casquettes", label: "Casquettes", slot: "cap", sizes: ["Unique"] },
  { id: "glasses", slug: "lunettes", label: "Lunettes", slot: "glasses", sizes: ["Unique"] },
  { id: "watch", slug: "montres", label: "Montres", slot: "watch", sizes: ["Unique"] },
  { id: "jewelry", slug: "bijoux", label: "Bijoux", slot: "neck", sizes: ["Unique"] },
  { id: "bag", slug: "accessoires", label: "Accessoires", slot: "accessory", sizes: ["Unique"] },
];

export { COLORS };
export const DARK = ["#141416", "#202833", "#2B2A2C", "#420A0D", "#680209", "#6B6766", "#0A0A0C"];
export const accentFor = (c: string) => (DARK.includes(c) ? "#EAE0C8" : "#420A0D");

const NAMES: Record<CategoryId, string[]> = {
  tee: ["T-shirt essentiel", "T-shirt oversize", "T-shirt brodé", "T-shirt heavyweight", "T-shirt délavé"],
  hoodie: ["Hoodie brodé", "Hoodie oversize", "Hoodie zippé", "Hoodie molleton épais", "Hoodie délavé"],
  pants: ["Jogging cargo", "Pantalon droit", "Jogging molleton", "Cargo ripstop", "Pantalon large"],
  sneaker: ["Sneaker basse cuir", "Sneaker montante", "Runner mesh", "Sneaker rétro", "Sneaker plateforme"],
  cap: ["Casquette brodée", "Casquette 5 panneaux", "Bob", "Casquette délavée", "Casquette logo"],
  bag: ["Sacoche bandoulière", "Sac banane", "Tote bag", "Pochette", "Sac à dos"],
  jacket: ["Veste workwear", "Doudoune", "Veste coach", "Bomber", "Parka"],
  shorts: ["Short molleton", "Short cargo", "Short de bain", "Short en jean", "Short mesh"],
  socks: ["Chaussettes logo", "Chaussettes côtelées", "Lot de 3 paires", "Chaussettes hautes", "Chaussettes sport"],
  glasses: ["Lunettes de soleil", "Lunettes ovales", "Lunettes rectangulaires", "Masque solaire", "Lunettes aviateur"],
  watch: ["Montre acier", "Montre chronographe", "Montre plongée", "Montre cuir", "Montre digitale"],
  jewelry: ["Collier chaîne", "Pendentif", "Chaîne cubaine", "Collier perles", "Ras-du-cou"],
};
/** Coût fournisseur de démo, en ¥ (fourchette par catégorie), et poids moyen en grammes. */
const COST_CNY: Record<CategoryId, [number, number]> = {
  tee: [150, 230], hoodie: [340, 530], pants: [290, 430], sneaker: [290, 580], cap: [85, 170], bag: [110, 390],
  jacket: [480, 900], shorts: [130, 230], socks: [30, 70], glasses: [120, 300], watch: [200, 600], jewelry: [80, 250],
};
const WEIGHT_G: Record<CategoryId, number> = {
  tee: 250, hoodie: 700, pants: 600, sneaker: 1300, cap: 150, bag: 600,
  jacket: 1200, shorts: 350, socks: 100, glasses: 150, watch: 200, jewelry: 80,
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
  const [lo, hi] = COST_CNY[cat.id];
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
      cost: { cny: Math.round((lo + ((i * 37 + seed) % (hi - lo))) / 5) * 5, g: WEIGHT_G[cat.id] },
      color,
      accent: accentFor(color),
      colors: [color, COLORS[(ci + 3) % COLORS.length], COLORS[(ci + 6) % COLORS.length]],
      sizes: cat.sizes,
    };
  });
}

/** Vrais produits du fournisseur (photos), avec un coût FICTIF : milieu de la fourchette de démo de leur catégorie. */
function supplierProducts(): Product[] {
  const src = (id: ImageId) => IMAGES[id].src;
  return SUPPLIER_PRODUCTS.map((p) => {
    const brand = BRANDS.find((b) => b.name === p.brand)!;
    const cat = CATEGORIES.find((c) => c.id === p.category)!;
    const [lo, hi] = COST_CNY[p.category];
    return {
      slug: p.slug,
      brandSlug: brand.slug,
      brandName: brand.name,
      category: p.category,
      name: p.name,
      cost: { cny: Math.round((lo + hi) / 10) * 5, g: WEIGHT_G[p.category] },
      color: p.color,
      accent: accentFor(p.color),
      colors: [p.color],
      sizes: cat.sizes,
      image: { front: src(p.image.front), back: p.image.back && src(p.image.back), details: p.image.details.map(src) },
    };
  });
}

/** Vrais produits en premier, puis la démo (pas de démo pour les marques qui n'ont que de vrais produits). */
export const PRODUCTS: Product[] = [
  ...supplierProducts(),
  ...BRANDS.filter((b) => !REAL_PRODUCTS_ONLY.includes(b.name)).flatMap((b) => CATEGORIES.flatMap((c) => makeProducts(b, c))),
];

/** Nouveautés mises en avant (démo). */
export const NEW_ARRIVALS: [string, CategoryId, number][] = [
  ["Trapstar", "hoodie", 2], ["Nike", "sneaker", 0], ["Corteiz", "pants", 3], ["Stüssy", "tee", 1],
  ["Represent", "hoodie", 5], ["Palm Angels", "tee", 4], ["Essentials", "pants", 0], ["Carhartt WIP", "cap", 2],
];
