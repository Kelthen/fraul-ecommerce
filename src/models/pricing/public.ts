// Ce que le navigateur a le droit de connaître sur les prix : les zones, leur devise et les prix publics.
// Marges, taux, droits, coûts et remises de groupe restent dans config.ts et price.ts, côté serveur.

export type ZoneId = "us" | "ca" | "uk" | "eu";
export type Currency = "USD" | "CAD" | "GBP" | "EUR";

export const ZONE_CURRENCY: Record<ZoneId, Currency> = { us: "USD", ca: "CAD", uk: "GBP", eu: "EUR" };

/** Zone par défaut quand le pays est inconnu ou hors des pays livrés. */
export const DEFAULT_ZONE: ZoneId = "us";

/** Prix public d'un article dans chaque zone. Le prix d'un client remisé partira de son compte, jamais de cette table. */
export type PriceTable = Record<ZoneId, number>;

/** Le stockage du navigateur n'est pas fiable : vérifie la forme avant d'afficher un prix. */
export const isPriceTable = (t: unknown): t is PriceTable =>
  !!t && typeof t === "object" && (Object.keys(ZONE_CURRENCY) as ZoneId[]).every((z) => Number.isFinite((t as Record<string, unknown>)[z]));
