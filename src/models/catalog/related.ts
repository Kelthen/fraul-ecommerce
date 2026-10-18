// Propositions sous une fiche (Walk et fiche produit) : 12 articles au plus, en rangées pleines de 3.
// 1. la même marque, même rayon ; 2. la même marque, autres rayons (« complète la tenue ») ;
// 3. les autres boutiques, même rayon, pour finir de remplir. Les articles avec une vraie photo passent devant.

export type RelatedItem = { slug: string; brand: string; cat: string; photo: boolean };
export type RelatedKey = "same" | "outfit" | "others";
export type RelatedSection<T> = { key: RelatedKey; items: T[] };

export const RELATED_MAX = 12;
const ROW = 3;
const SECTION_MAX = 6;

const photoFirst = <T extends RelatedItem>(xs: T[]) => [...xs.filter((x) => x.photo), ...xs.filter((x) => !x.photo)];

/** Une pièce par rayon à tour de rôle, pour varier la tenue proposée. */
function roundRobin<T extends RelatedItem>(xs: T[]): T[] {
  const byCat = new Map<string, T[]>();
  for (const x of xs) (byCat.get(x.cat) ?? byCat.set(x.cat, []).get(x.cat)!).push(x);
  const queues = [...byCat.values()], out: T[] = [];
  for (let i = 0; out.length < xs.length; i++) for (const q of queues) if (q[i]) out.push(q[i]);
  return out;
}

/** Garde des rangées pleines (3, 6…) quand il y a au moins une rangée. */
const fullRows = <T>(xs: T[]) => (xs.length >= ROW ? xs.slice(0, xs.length - (xs.length % ROW)) : xs);

export function related<T extends RelatedItem>(all: T[], cur: T, max = RELATED_MAX): RelatedSection<T>[] {
  const pool = all.filter((x) => x.slug !== cur.slug);
  const candidates: [RelatedKey, T[]][] = [
    ["same", photoFirst(pool.filter((x) => x.brand === cur.brand && x.cat === cur.cat))],
    ["outfit", roundRobin(photoFirst(pool.filter((x) => x.brand === cur.brand && x.cat !== cur.cat)))],
    ["others", photoFirst(pool.filter((x) => x.brand !== cur.brand && x.cat === cur.cat))],
  ];
  const out: RelatedSection<T>[] = [];
  let left = max;
  for (const [key, xs] of candidates) {
    if (left <= 0) break;
    const items = fullRows(xs.slice(0, Math.min(key === "others" ? left : SECTION_MAX, left)));
    if (items.length) { out.push({ key, items }); left -= items.length; }
  }
  return out;
}
