// Types du catalogue. Ils suivent le schéma de base de données (supabase/migrations/).

import type { Cost } from "@/models/pricing/price";
import type { PriceTable } from "@/models/pricing/public";

export type FontKey = "sansX" | "sansXi" | "sansL" | "serif" | "serifI" | "serifIB";

/** Style d'une marque : pilote la vitrine, l'enseigne, l'intérieur de la boutique et les mannequins. */
export type BrandStyle = {
  name: string;
  bg: string;
  fg: string;
  font: FontKey;
  /** Espacement des lettres, en em. */
  sp: number;
  /** Nom écrit en majuscules sur l'enseigne. */
  up: boolean;
};

export type Brand = {
  slug: string;
  name: string;
  style: BrandStyle;
  /** Présente comme boutique dans le Walk. */
  inWalk: boolean;
};

export type CategoryId =
  | "tee" | "hoodie" | "jacket" | "pants" | "shorts" | "socks" | "sneaker"
  | "cap" | "glasses" | "watch" | "jewelry" | "bag";

/**
 * Emplacement d'une pièce dans « Crée ta tenue ». Une seule pièce par emplacement :
 * pantalon et short partagent `bottom`, donc ils s'excluent. `accessory` (sacs) reste hors tenue.
 * Doit rester aligné sur l'enum SQL `outfit_slot` (migration proposée à Serge).
 */
export type OutfitSlot =
  | "cap" | "glasses" | "neck" | "watch" | "top" | "layer" | "bottom" | "socks" | "shoes" | "accessory";

export type Category = {
  id: CategoryId;
  slug: string;
  label: string;
  slot: OutfitSlot;
  sizes: string[];
};

export type Product = {
  slug: string;
  brandSlug: string;
  brandName: string;
  category: CategoryId;
  name: string;
  /** Prix par zone et par groupe. Le coût fournisseur ne quitte jamais le serveur. */
  prices: PriceTable;
  /** Couleur principale et couleur d'accent. */
  color: string;
  accent: string;
  /** Variantes de couleur proposées. */
  colors: string[];
  sizes: string[];
  /** Photos : face obligatoire, dos et détails si elles existent. Un article sans photo n'est pas sur le site. */
  image: { front: string; back?: string; details?: string[] };
};

/** Article côté serveur : coût (¥), poids (g) et prix tapé en dollars. Ne jamais l'envoyer au navigateur. */
export type PricedProduct = Omit<Product, "prices"> & { cost: Cost };
