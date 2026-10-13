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

/**
 * Arrondi « propre » au plus proche : sous 50, par pas de 5 (…4 / …9) ; au-dessus, finit par 9.
 * Ex. 87,43 → 89 ; 31 → 29 ; 36 → 34.
 */
export function roundNice(x: number): number {
  const step = x < 50 ? 5 : 10;
  return Math.max(step - 1, Math.round((x + 1) / step) * step - 1);
}

/** Écart maximal toléré entre la remise réelle et le % du groupe, en points (demande de Serge, 13 oct.). */
export const MAX_DISCOUNT_DRIFT = 3;

/** Prix catalogue de la zone (avant toute remise). */
export const catalogPrice = (cost: Cost, zoneId: ZoneId): number =>
  roundNice(landedCost(cost, zoneId) * (1 + ZONES[zoneId].marginPct / 100));

/** Prix plancher : coût rendu + marge minimale, arrondi à l'unité supérieure (R5). */
export const floorPrice = (cost: Cost, zoneId: ZoneId): number => Math.ceil(landedCost(cost, zoneId) * (1 + MIN_MARGIN_PCT / 100));

/**
 * Prix payé par le client : catalogue moins la remise de son groupe, jamais sous le plancher (R5).
 * Arrondi propre, sauf s'il fausse la remise de plus de MAX_DISCOUNT_DRIFT points (petits prix) :
 * on garde alors le prix à l'unité, pour que VIP reste VIP et Fidèle reste Fidèle.
 */
export function customerPrice(cost: Cost, zoneId: ZoneId, groupId: GroupId = "public"): number {
  const catalog = catalogPrice(cost, zoneId);
  const pct = GROUPS[groupId].discountPct;
  if (!pct) return catalog;
  const raw = catalog * (1 - pct / 100);
  const nice = roundNice(raw);
  const drift = Math.abs((1 - nice / catalog) * 100 - pct);
  return Math.max(drift <= MAX_DISCOUNT_DRIFT ? nice : Math.round(raw), floorPrice(cost, zoneId));
}
