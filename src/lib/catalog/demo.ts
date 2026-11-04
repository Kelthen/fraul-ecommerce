// Référence du catalogue : catégories, marques, et copie de secours des vrais articles.
// La base fait foi pour les articles (./db.ts). La copie ne sert que si elle ne répond pas, et le paiement refuse alors.
import { ALL_BRANDS, WALK_BRANDS, brandStyle, slugify } from "./brands";
import { IMAGES, type ImageId } from "../images";
import { SUPPLIER_PRODUCTS } from "./supplier";
import { COLORS, DARK, accentFor } from "./palette";
import type { Brand, Category, CategoryId, PricedProduct } from "./types";

/** Catégories du site, dans l'ordre d'affichage. Ajouter une catégorie : une ligne ici + COST_CNY,
 *  WEIGHT_G ci-dessous. Dans le Walk, elle n'apparaît qu'une fois son portant placé
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

export { COLORS, DARK, accentFor };

/** Coût de secours en ¥ (fourchette par catégorie), si la base ne répond pas, et poids moyen en grammes. */
const COST_CNY: Record<CategoryId, [number, number]> = {
  tee: [150, 230], hoodie: [340, 530], pants: [290, 430], sneaker: [290, 580], cap: [85, 170], bag: [110, 390],
  jacket: [480, 900], shorts: [130, 230], socks: [30, 70], glasses: [120, 300], watch: [200, 600], jewelry: [80, 250],
};
export const WEIGHT_G: Record<CategoryId, number> = {
  tee: 250, hoodie: 700, pants: 600, sneaker: 1300, cap: 150, bag: 600,
  jacket: 1200, shorts: 350, socks: 100, glasses: 150, watch: 200, jewelry: 80,
};

export const BRANDS: Brand[] = ALL_BRANDS.map((name) => ({
  slug: slugify(name),
  name,
  style: brandStyle(name),
  inWalk: WALK_BRANDS.includes(name),
}));

/** Copie de secours : les vrais articles avec leurs photos, coût au milieu de la fourchette de leur catégorie. */
function supplierProducts(): PricedProduct[] {
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

/** Copie de secours des vrais produits : la base fait foi (src/lib/catalog/db.ts), ceci ne sert que si elle ne répond pas. */
export const REAL_SNAPSHOT: PricedProduct[] = supplierProducts();
