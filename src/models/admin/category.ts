// Nouveau type de vêtement créé depuis la fiche article (Rhamone, 8 nov. 2026). Pur (testé dans category.test.ts).
import type { OutfitSlot } from "../../lib/catalog/types.ts";

export type CategoryInput = { label: string; sizes: string[]; weightG: number; slot: OutfitSlot };

/** « Ça se porte où ? » : la place de la pièce dans une tenue (enum SQL outfit_slot). */
export const SLOTS: { id: OutfitSlot; label: string }[] = [
  { id: "top", label: "Haut (t-shirt, maillot, chemise)" },
  { id: "layer", label: "Par-dessus (sweat, veste)" },
  { id: "bottom", label: "Bas (pantalon, short, jupe)" },
  { id: "shoes", label: "Aux pieds (chaussures)" },
  { id: "socks", label: "Chaussettes" },
  { id: "cap", label: "Sur la tête (casquette, bonnet)" },
  { id: "glasses", label: "Lunettes" },
  { id: "neck", label: "Au cou (bijou, écharpe)" },
  { id: "watch", label: "Au poignet (montre, bracelet)" },
  { id: "accessory", label: "Accessoire (sac, ceinture…)" },
];

/** Adresse du type : « Maillots de foot » → « maillots-de-foot ». Sert aussi de code dans la base. */
export const categorySlug = (label: string): string =>
  label.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

/** Problèmes, en clair. `taken` : adresses et noms déjà utilisés (en minuscules). */
export function categoryProblems(c: CategoryInput, taken: string[]): string[] {
  const p: string[] = [];
  const slug = categorySlug(c.label);
  if (c.label.trim().length < 3 || c.label.length > 40 || !slug) p.push("Nom du type : entre 3 et 40 caractères.");
  else if (taken.includes(slug) || taken.includes(c.label.trim().toLowerCase())) p.push("Ce type existe déjà : choisis-le dans la liste.");
  if (!c.sizes.length || c.sizes.length > 15 || c.sizes.some((s) => !s.trim() || s.length > 12)) p.push("Tailles : 1 à 15, séparées par des virgules (« Unique » si une seule).");
  if (!(c.weightG >= 10 && c.weightG <= 30000)) p.push("Poids moyen : entre 10 g et 30 kg.");
  if (!SLOTS.some((s) => s.id === c.slot)) p.push("Choisis où ça se porte.");
  return p;
}
