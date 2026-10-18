// Recherche en haut du mall : une marque ou une pièce (« hoodie », « basket », « sac »…).
// Une pièce tapée mène directement au rayon de chaque boutique qui en a.

/** Mots que les visiteurs tapent pour chaque rayon (sans accents, en minuscules). */
const WORDS: Record<string, string[]> = {
  tee: ["t-shirt", "tshirt", "tee", "polo", "haut"],
  hoodie: ["hoodie", "sweat", "pull", "capuche"],
  jacket: ["veste", "manteau", "doudoune", "blouson", "jacket"],
  pants: ["pantalon", "jogging", "jean", "cargo"],
  shorts: ["short"],
  socks: ["chaussette"],
  sneaker: ["basket", "sneaker", "chaussure", "running"],
  cap: ["casquette", "bonnet", "chapeau", "cap"],
  glasses: ["lunette"],
  watch: ["montre"],
  jewelry: ["bijou", "collier", "chaine", "bague", "bracelet"],
  bag: ["sac", "pochette", "sacoche", "bag"],
};

export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Rayons (parmi `cats`) que la recherche `q` désigne : par leur nom affiché ou par un mot courant. 3 lettres minimum. */
export function matchCategories(q: string, cats: [id: string, label: string][]): string[] {
  const f = fold(q);
  if (f.length < 3) return [];
  return cats
    .filter(([id, label]) => fold(label).includes(f) || (WORDS[id] ?? []).some((w) => w.startsWith(f) || f.startsWith(w)))
    .map(([id]) => id);
}
