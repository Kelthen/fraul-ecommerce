// Look ajouté depuis l'admin (Rhamone, 8 nov. 2026). Pur (testé dans look.test.ts).

export type LookInput = { id?: string; title: string; photo: string; items: string[]; onSite: boolean };

const PHOTO = /^https:\/\/[a-z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/produits\/[A-Za-z0-9/_.-]+$/;

/** Problèmes, en clair. `slugs` : articles qui existent. */
export function lookProblems(l: LookInput, slugs: string[]): string[] {
  const p: string[] = [];
  if (l.title.trim().length < 2 || l.title.length > 60) p.push("Nom du look : entre 2 et 60 caractères.");
  if (!l.photo) p.push("Ajoute la photo du look porté (personne entière, sur un fond uni).");
  else if (!PHOTO.test(l.photo)) p.push("La photo n'a pas été envoyée correctement : remets-la.");
  const items = [...new Set(l.items)];
  if (items.length < 2 || items.length > 6) p.push("Choisis de 2 à 6 articles portés.");
  if (items.some((s) => !slugs.includes(s))) p.push("Un article choisi n'existe plus : retire-le.");
  return p;
}
