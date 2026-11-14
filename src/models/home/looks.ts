// Défilé de looks de l'accueil (idée de Rhamone, 8 nov. 2026 ; docs/ACCUEIL-LOOKS.md). Pur (testé dans looks.test.ts).
// Version de test : looks écrits ici avec les vrais articles. Version finale : ajoutés depuis l'admin (photo + pièces).

export type Look = {
  id: string;
  title: string;
  /** Photo du look porté (mannequin). Sans photo : les photos des pièces, côte à côte. */
  photo?: string;
  /** Même personne vue de dos (facultatif ; sans elle, pas de bouton « Dos »). */
  back?: string;
  /** Adresses des articles portés, du haut vers le bas. */
  items: string[];
};

/** Looks de test, avec des pièces en ligne le 8 nov. 2026 (à remplacer par ceux ajoutés par Jean Paul dans l'admin). */
export const TEST_LOOKS: Look[] = [
  // Photos : essais de ChatGPT validés par Rhamone le 8 nov. (docs/ACCUEIL-LOOKS.md). Chaussures illustratives, non vendues ;
  // petits textes parfois déformés (t-shirt Valley) : à corriger ou remplacer par des photos fidèles avant la mise en ligne.
  { id: "corteiz-noir", title: "Tout noir Corteiz", photo: "/images/looks/look-corteiz.webp", back: "/images/looks/look-corteiz-dos.webp", items: ["corteiz-hoodie-corteiz-noir", "corteiz-jogging-corteiz-noir"] },
  { id: "valley-acne", title: "Valley Dreams et Acne Studios", photo: "/images/looks/look-valley-acne.webp", back: "/images/looks/look-valley-acne-dos.webp", items: ["valley-dreams-t-shirt-valley-blanc", "acne-studios-pant-delave-acne-studios"] },
  { id: "denim-tears", title: "Corteiz x Denim Tears", photo: "/images/looks/look-corteiz-denim-tears.webp", back: "/images/looks/look-corteiz-denim-tears-dos.webp", items: ["corteiz-hoodie-corteiz-x-denim-tears", "corteiz-pant-corteiz-x-denim"] },
  { id: "acne-kappa", title: "Acne Studios x Kappa", photo: "/images/looks/look-acne-kappa.webp", back: "/images/looks/look-acne-kappa-dos.webp", items: ["acne-studios-veste-acne-studios-x-kappa-noir", "acne-studios-pant-acne-studios-x-kappa-noir"] },
  { id: "gallery-acne", title: "Gallery Dept et Acne Studios", photo: "/images/looks/look-gallery-acne.webp", back: "/images/looks/look-gallery-acne-dos.webp", items: ["gallery-dept-gallery-dept-long-sleeve-pocket-tee", "acne-studios-pant-delave-acne-studios"] },
  // Looks face/dos de ChatGPT (14 nov., feat/gpt/looks-face-dos, docs/LOOKS-FACE-DOS-SERGE.md), détourés ici : pièces en
  // ligne vérifiées le 14 nov. ; chaussures de mise en scène, non vendues. Écarts produit signalés à corriger avant
  // publication (ex. col du Supreme, poches arrière). Titres décidés par l'équipe, à confirmer.
  { id: "broken-planet-gris", title: "Broken Planet gris", photo: "/images/looks/look-01.webp", back: "/images/looks/look-01-dos.webp", items: ["broken-planet-hoodie-grey-broken-planet", "broken-planet-women-short-grey-broken-planet"] },
  { id: "acne-bleu-ciel", title: "Acne Studios bleu ciel", photo: "/images/looks/look-02.webp", back: "/images/looks/look-02-dos.webp", items: ["acne-studios-longsleeve-sky-blue-acne-studios", "acne-studios-shorts-jeans-acne-studios"] },
  { id: "derschutze", title: "Derschutze noir et blanc", photo: "/images/looks/look-03.webp", back: "/images/looks/look-03-dos.webp", items: ["derschutze-black-t-shirt-derschutze", "derschutze-shorts-derschutze-white"] },
  { id: "vertabrae", title: "Vertabrae rouge délavé", photo: "/images/looks/look-04.webp", back: "/images/looks/look-04-dos.webp", items: ["vertabrae-hoodie-vertabrae-rouge-delave", "vertabrae-jogging-vertabrae-noir-vintage"] },
  { id: "trapstar-rose", title: "Trapstar rose", photo: "/images/looks/look-05.webp", back: "/images/looks/look-05-dos.webp", items: ["trapstar-women-hoodie-rose-trapstar", "trapstar-women-jogging-trapstar-pink"] },
  { id: "stussy-acne", title: "Stüssy et Acne Studios", photo: "/images/looks/look-06.webp", back: "/images/looks/look-06-dos.webp", items: ["stussy-pull-a-manche-stussy-multicolore", "acne-studios-jeans-acne-studios-streetwear"] },
  { id: "stussy-gallery", title: "Stüssy et Gallery Dept", photo: "/images/looks/look-07.webp", back: "/images/looks/look-07-dos.webp", items: ["stussy-t-shirt-stussy-beige", "gallery-dept-gallery-dept-pant-cafe"] },
  { id: "supreme-beige", title: "Supreme beige", photo: "/images/looks/look-08.webp", back: "/images/looks/look-08-dos.webp", items: ["supreme-hoodie-supreme-beige", "supreme-jogging-supreme-beige"] },
  { id: "paly-acne", title: "Paly Wood et Acne Studios", photo: "/images/looks/look-paly-acne.webp", back: "/images/looks/look-paly-acne-dos.webp", items: ["paly-wood-t-shirt-paly-blanc", "acne-studios-pant-acne-studios-x-kappa-noir"] },
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
