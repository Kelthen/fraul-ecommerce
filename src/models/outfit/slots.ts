// Règles de « Crée ta tenue » : emplacements, choix d'une pièce, pantalon OU short, chaussettes.
// Aucun affichage ici : la page et la scène 3D lisent ces règles.
import type { CategoryId, OutfitSlot } from "../../lib/catalog/types.ts";

/** Emplacements portés sur le mannequin (les sacs, `accessory`, restent hors tenue). */
export type WearSlot = Exclude<OutfitSlot, "accessory">;

/** Ordre d'affichage, de la tête aux pieds. Changer un nom d'emplacement, c'est ici. */
export const SLOTS: { id: WearSlot; label: string }[] = [
  { id: "cap", label: "Casquette" },
  { id: "glasses", label: "Lunettes" },
  { id: "neck", label: "Bijoux" },
  { id: "watch", label: "Montre" },
  { id: "top", label: "Haut" },
  { id: "layer", label: "Veste / pull" },
  { id: "bottom", label: "Pantalon ou short" },
  { id: "socks", label: "Chaussettes" },
  { id: "shoes", label: "Chaussures" },
];

/** Tenue : une pièce (slug) au plus par emplacement ; un emplacement peut rester vide. */
export type Outfit = Partial<Record<WearSlot, string>>;

/** Les chaussettes ne se voient qu'avec un short : l'emplacement ne s'active qu'à ce moment-là. */
export const socksActive = (bottom: CategoryId | undefined) => bottom === "shorts";

/**
 * Choisit (ou retire, si elle est déjà portée) une pièce. Pantalon et short partagent l'emplacement
 * `bottom`, donc en choisir un remplace l'autre. Passer à un pantalon retire les chaussettes (cachées).
 */
export function pick(outfit: Outfit, slot: WearSlot, slug: string, categoryOf: (slug: string) => CategoryId | undefined): Outfit {
  const next: Outfit = { ...outfit };
  if (next[slot] === slug) delete next[slot];
  else next[slot] = slug;
  if (!socksActive(next.bottom ? categoryOf(next.bottom) : undefined)) delete next.socks;
  return next;
}

/** Emplacements proposés à l'écran : tous, sauf les chaussettes tant qu'il n'y a pas de short. */
export const visibleSlots = (outfit: Outfit, categoryOf: (slug: string) => CategoryId | undefined) =>
  SLOTS.filter((s) => s.id !== "socks" || socksActive(outfit.bottom ? categoryOf(outfit.bottom) : undefined));
