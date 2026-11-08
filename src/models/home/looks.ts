// Défilé de looks de l'accueil (idée de Rhamone, 8 nov. 2026 ; docs/ACCUEIL-LOOKS.md). Pur (testé dans looks.test.ts).
// Version de test : looks écrits ici avec les vrais articles. Version finale : ajoutés depuis l'admin (photo + pièces).

export type Look = {
  id: string;
  title: string;
  /** Photo du look porté (mannequin). Sans photo : les photos des pièces, côte à côte. */
  photo?: string;
  /** Adresses des articles portés, du haut vers le bas. */
  items: string[];
};

/** Looks de test, avec des pièces en ligne le 8 nov. 2026 (à remplacer par ceux ajoutés par Jean Paul dans l'admin). */
export const TEST_LOOKS: Look[] = [
  // Photos : essais de ChatGPT validés par Rhamone le 8 nov. (docs/ACCUEIL-LOOKS.md). Chaussures illustratives, non vendues ;
  // petits textes parfois déformés (t-shirt Valley) : à corriger ou remplacer par des photos fidèles avant la mise en ligne.
  { id: "corteiz-noir", title: "Tout noir Corteiz", photo: "/images/looks/look-corteiz.jpg", items: ["corteiz-hoodie-corteiz-noir", "corteiz-jogging-corteiz-noir"] },
  { id: "valley-acne", title: "Valley Dreams et Acne Studios", photo: "/images/looks/look-valley-acne.jpg", items: ["valley-dreams-t-shirt-valley-blanc", "acne-studios-pant-delave-acne-studios"] },
  { id: "denim-tears", title: "Corteiz x Denim Tears", photo: "/images/looks/look-corteiz-denim-tears.jpg", items: ["corteiz-hoodie-corteiz-x-denim-tears", "corteiz-pant-corteiz-x-denim"] },
  { id: "acne-kappa", title: "Acne Studios x Kappa", photo: "/images/looks/look-acne-kappa.jpg", items: ["acne-studios-veste-acne-studios-x-kappa-noir", "acne-studios-pant-acne-studios-x-kappa-noir"] },
  { id: "gallery-acne", title: "Gallery Dept et Acne Studios", photo: "/images/looks/look-gallery-acne.jpg", items: ["gallery-dept-gallery-dept-long-sleeve-pocket-tee", "acne-studios-pant-delave-acne-studios"] },
  { id: "paly-acne", title: "Paly Wood et Acne Studios", photo: "/images/looks/look-paly-acne.jpg", items: ["paly-wood-t-shirt-paly-blanc", "acne-studios-pant-acne-studios-x-kappa-noir"] },
];

/**
 * Garde, dans chaque look, les pièces encore sur le site (une pièce masquée ou supprimée disparaît toute seule).
 * Un look avec moins de 2 pièces n'est plus un look : il n'est pas montré.
 */
export function resolveLooks<P extends { slug: string }>(looks: Look[], products: P[]): (Omit<Look, "items"> & { items: P[] })[] {
  return looks
    .map((l) => ({ ...l, items: l.items.map((s) => products.find((p) => p.slug === s)).filter((p): p is P => !!p) }))
    .filter((l) => l.items.length >= 2);
}
