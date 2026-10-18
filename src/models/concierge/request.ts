// Conciergerie « Demande un article » : le visiteur décrit une pièce introuvable sur le site,
// l'équipe la cherche chez les fournisseurs et répond par e-mail (décision de Rhamone, 18 oct. 2026).
// Ce module ne fait que vérifier et nettoyer la demande. Le texte reste une donnée : il ne sera
// jamais exécuté ni donné tel quel comme consigne à un outil ou à une IA (règle anti-injection).

export type ConciergeInput = {
  item: string;
  brand?: string;
  size?: string;
  link?: string;
  email: string;
  note?: string;
  /** Champ piège invisible : un humain le laisse vide, un robot le remplit. */
  website?: string;
};

export type ConciergeRequest = Required<Omit<ConciergeInput, "website">>;
export type ConciergeField = keyof ConciergeRequest;
export type ConciergeResult =
  | { ok: true; value: ConciergeRequest }
  | { ok: false; errors: Partial<Record<ConciergeField | "form", string>> };

export const LIMITS: Record<ConciergeField, number> = { item: 160, brand: 60, size: 20, link: 500, email: 254, note: 1000 };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Retire les caractères de contrôle et les espaces en trop (le texte est affiché tel quel à l'équipe). */
const clean = (s: string | undefined) => (s ?? "").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").replace(/[ \t]+/g, " ").trim();

export function validateRequest(input: ConciergeInput): ConciergeResult {
  if (clean(input.website)) return { ok: false, errors: { form: "Demande refusée." } };
  const v: ConciergeRequest = {
    item: clean(input.item),
    brand: clean(input.brand),
    size: clean(input.size),
    link: clean(input.link),
    email: clean(input.email).toLowerCase(),
    note: clean(input.note),
  };
  const errors: Partial<Record<ConciergeField, string>> = {};
  if (v.item.length < 3) errors.item = "Décris l'article (au moins 3 caractères).";
  if (!EMAIL.test(v.email)) errors.email = "Une adresse e-mail valide, pour te répondre.";
  if (v.link) {
    try {
      const u = new URL(v.link);
      if (u.protocol !== "https:" && u.protocol !== "http:") errors.link = "Un lien qui commence par https://";
    } catch {
      errors.link = "Un lien qui commence par https://";
    }
  }
  for (const k of Object.keys(LIMITS) as ConciergeField[]) {
    if (v[k].length > LIMITS[k]) errors[k] = `${LIMITS[k]} caractères au plus.`;
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: v };
}
