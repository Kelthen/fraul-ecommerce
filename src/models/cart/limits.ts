// Limites du panier, partagées par le navigateur et le paiement. Rien d'autre ici : ce fichier part dans le
// navigateur, il ne doit pas importer les prix ni les marges (src/models/pricing/).

/** Exemplaires d'un même article (même taille, même couleur) dans une commande. */
export const MAX_QTY = 10;
/** Lignes différentes dans un panier. */
export const MAX_LINES = 20;

export const clampQty = (n: number): number => Math.max(1, Math.min(MAX_QTY, Math.floor(n) || 1));
