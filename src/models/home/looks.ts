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

/** Looks de test, avec des pièces en ligne le 8 nov. 2026 (décidé par l'équipe, à remplacer par ceux de Jean Paul). */
export const TEST_LOOKS: Look[] = [
  { id: "corteiz-noir", title: "Tout noir Corteiz", items: ["corteiz-hoodie-corteiz-noir", "corteiz-jogging-corteiz-noir"] },
  { id: "denim-tears", title: "Corteiz x Denim Tears", items: ["corteiz-hoodie-corteiz-x-denim-tears", "corteiz-pant-corteiz-x-denim"] },
  { id: "acne-kappa", title: "Acne Studios x Kappa", items: ["acne-studios-veste-acne-studios-x-kappa-noir", "acne-studios-pant-acne-studios-x-kappa-noir"] },
  { id: "travis-flammes", title: "Travis Scott, été", items: ["travis-scott-hoodie-etoile-delave", "travis-scott-short-delave-flammes"] },
  { id: "delave", title: "Délavé", items: ["gallery-dept-hoodie-delave-gallery-dept", "acne-studios-pant-delave-acne-studios"] },
  { id: "violet-gris", title: "Violet et gris", items: ["valley-dreams-valley-dreams", "acne-studios-pant-acne-studios-gris"] },
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
