// Réglages des prix : le SEUL fichier à modifier pour changer une marge, une livraison ou une remise.
// ⚠️ Valeurs de TEST, « décidé par l'équipe, à confirmer » (Rhamone + Serge, voir CLAUDE.md §9 « À décider »).

export type ZoneId = "us" | "ca" | "uk" | "eu";
export type Currency = "USD" | "CAD" | "GBP" | "EUR";

export type Zone = {
  currency: Currency;
  /** Taux du jour : 1 ¥ = `fx` unités de la devise (test ; plus tard mis à jour chaque jour). */
  fx: number;
  /** Livraison, en devise, par kilo. */
  shippingPerKg: number;
  /** Droits et taxes estimés, en % de (marchandise + livraison). */
  dutiesPct: number;
  /** Marge de la zone, en % du coût rendu (prix catalogue volontairement haut). */
  marginPct: number;
};

export const ZONES: Record<ZoneId, Zone> = {
  us: { currency: "USD", fx: 0.14, shippingPerKg: 12, dutiesPct: 15, marginPct: 120 },
  ca: { currency: "CAD", fx: 0.19, shippingPerKg: 16, dutiesPct: 18, marginPct: 120 },
  uk: { currency: "GBP", fx: 0.11, shippingPerKg: 10, dutiesPct: 20, marginPct: 120 },
  eu: { currency: "EUR", fx: 0.13, shippingPerKg: 11, dutiesPct: 22, marginPct: 120 },
};

/** Pays de livraison → zone. Jamais affiché sur le site (décision du 2026-10-12). */
export const COUNTRY_ZONE: Record<string, ZoneId> = { US: "us", CA: "ca", GB: "uk", FR: "eu", BE: "eu" };

/** Zone par défaut quand le pays est inconnu ou hors des pays livrés. */
export const DEFAULT_ZONE: ZoneId = "us";

export type GroupId = "public" | "vip" | "fidele" | "revendeur";

/** Groupes de clients et leur remise (Serge §2). Lancement : 2 ou 3 groupes (R6). */
export const GROUPS: Record<GroupId, { label: string; discountPct: number }> = {
  public: { label: "Visiteur", discountPct: 0 },
  vip: { label: "VIP", discountPct: 10 },
  fidele: { label: "Fidèle", discountPct: 25 },
  revendeur: { label: "Revendeur", discountPct: 40 },
};

/** Prix plancher (R5) : jamais sous le coût rendu + cette marge, quelles que soient les remises. */
export const MIN_MARGIN_PCT = 20;
