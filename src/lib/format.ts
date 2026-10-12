// Prix de démonstration. Le vrai prix (personnalisé par client) sera calculé
// côté serveur ; aucune devise ni aucun pays n'est affiché pour l'instant.
export const formatPrice = (amount: number) => `${amount.toLocaleString("fr-FR")} $`;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Tant que le site n'est pas lancé, on demande aux moteurs de ne pas l'indexer. */
export const SITE_LIVE = process.env.NEXT_PUBLIC_SITE_LIVE === "true";
