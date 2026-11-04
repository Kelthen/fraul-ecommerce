// « Mes envies » : les pièces qu'on garde de côté (bouton « Envie », décision de Rhamone du 18 oct. 2026).
// Gardées sur le téléphone pour l'instant ; synchronisées avec le compte quand les comptes seront branchés
// (table `wishlists` du schéma). Chaque envie garde un instantané pour s'afficher sans recharger le catalogue ;
// elle garde aussi sa table de prix par zone et groupe, jamais le coût.
import { isPriceTable, type PriceTable } from "../pricing/price.ts";

export type Envie = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  prices: PriceTable;
  color: string;
  accent: string;
  /** Photo de face, quand le produit en a une. */
  photo?: string;
  /** Ajoutée le (horodatage, ms). */
  at: number;
};

/** Au-delà, les plus anciennes sortent de la liste. */
export const ENVIES_MAX = 200;

export const hasEnvie = (list: Envie[], slug: string) => list.some((e) => e.slug === slug);

/** Ajoute en tête ou retire si elle y est déjà. */
export function toggleEnvie(list: Envie[], item: Omit<Envie, "at">, now = Date.now()): Envie[] {
  if (hasEnvie(list, item.slug)) return list.filter((e) => e.slug !== item.slug);
  return [{ ...item, at: now }, ...list].slice(0, ENVIES_MAX);
}

/** Relit la liste stockée en ignorant tout ce qui est abîmé ou bizarre (le stockage du navigateur n'est pas fiable). */
export function parseEnvies(raw: string | null): Envie[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    return data
      .filter((e): e is Envie => !!e && typeof e.slug === "string" && typeof e.name === "string" && typeof e.brand === "string" && isPriceTable(e.prices))
      .filter((e) => !seen.has(e.slug) && !!seen.add(e.slug))
      .map((e) => ({ ...e, photo: typeof e.photo === "string" && /^(\/|https:\/\/)/.test(e.photo) ? e.photo : undefined }))
      .slice(0, ENVIES_MAX);
  } catch {
    return [];
  }
}
