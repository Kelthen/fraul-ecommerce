// Types du catalogue. Ils suivent le schéma de base de données
// (supabase/migrations/0001_initial_schema.sql) pour qu'on puisse remplacer
// les données de démonstration par la vraie base sans toucher aux pages.

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
  /** Présente comme boutique dans le Fraul Walk. */
  inWalk: boolean;
};

export type CategoryId = "tee" | "hoodie" | "pants" | "sneaker" | "cap" | "bag";

/** Emplacement d'une pièce dans « Crée ta tenue ». */
export type OutfitSlot = "top" | "bottom" | "shoes" | "accessory";

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
  /** Prix affiché, en unités entières (démo). Le vrai prix sera calculé côté serveur. */
  price: number;
  /** Couleur principale et couleur d'accent du dessin provisoire. */
  color: string;
  accent: string;
  /** Variantes de couleur proposées. */
  colors: string[];
  sizes: string[];
  /** Photo détourée (face / dos) quand elle existe ; sinon on dessine. */
  image?: { front: string; back?: string };
};
