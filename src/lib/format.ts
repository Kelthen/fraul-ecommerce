// Les prix s'affichent via <Price> (src/components/Price.tsx), calculés par src/models/pricing.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Tant que le site n'est pas lancé, on demande aux moteurs de ne pas l'indexer. */
export const SITE_LIVE = process.env.NEXT_PUBLIC_SITE_LIVE === "true";
