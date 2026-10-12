// Calcul des prix : fonctions pures, sans page ni navigateur (testées dans price.test.ts).
// Le paiement recalculera tout côté serveur avec l'adresse de livraison : le navigateur n'envoie jamais un prix.
import { COUNTRY_ZONE, DEFAULT_ZONE, GROUPS, MIN_MARGIN_PCT, ZONES, type GroupId, type ZoneId } from "./config.ts";

/** Ce que coûte un article chez le fournisseur : prix en yuans et poids en grammes. */
export type Cost = { cny: number; g: number };

export const zoneOf = (country?: string | null): ZoneId => (country && COUNTRY_ZONE[country.toUpperCase()]) || DEFAULT_ZONE;

/** Coût rendu chez le client : marchandise + livraison au poids + droits et taxes estimés. */
export function landedCost(cost: Cost, zoneId: ZoneId): number {
  const z = ZONES[zoneId];
  const goods = cost.cny * z.fx + (cost.g / 1000) * z.shippingPerKg;
  return goods * (1 + z.dutiesPct / 100);
}

/** Arrondi « propre » vers le haut : finit par 9 (87,43 → 89). */
export function roundUp9(x: number): number {
  const n = Math.ceil(x - 1e-9);
  return n + ((9 - (n % 10) + 10) % 10);
}

/** Arrondi « propre » vers le bas : finit par 9 (87,43 → 79). */
export function roundDown9(x: number): number {
  const n = Math.floor(x + 1e-9);
  return n - ((n % 10) + 1) % 10;
}

/** Prix catalogue de la zone (avant toute remise). */
export const catalogPrice = (cost: Cost, zoneId: ZoneId): number =>
  roundUp9(landedCost(cost, zoneId) * (1 + ZONES[zoneId].marginPct / 100));

/** Prix plancher : coût rendu + marge minimale, arrondi à l'unité supérieure (R5). */
export const floorPrice = (cost: Cost, zoneId: ZoneId): number => Math.ceil(landedCost(cost, zoneId) * (1 + MIN_MARGIN_PCT / 100));

/** Prix payé par le client : catalogue moins la remise de son groupe, jamais sous le plancher. */
export function customerPrice(cost: Cost, zoneId: ZoneId, groupId: GroupId = "public"): number {
  const catalog = catalogPrice(cost, zoneId);
  const pct = GROUPS[groupId].discountPct;
  if (!pct) return catalog;
  return Math.max(roundDown9(catalog * (1 - pct / 100)), floorPrice(cost, zoneId));
}
