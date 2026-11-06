"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CATEGORIES } from "@/lib/catalog/fallback";
import { CATALOGUE_TAG } from "@/lib/catalog/db";
import { isAdmin } from "@/lib/server/admin-session";
import { deleteArticle, getArticle, listArticles, saveArticle, setOnSite, slugTaken, uploadPhoto } from "@/lib/server/admin-articles";
import { listBoutiques } from "@/lib/server/admin-boutiques";
import { articleProblems, cleanArticle, findDuplicate, articleSlug, marginsByZone, type ArticleInput, type ZoneMargin } from "@/models/admin/article";

// Actions de l'admin des articles. Une action serveur est une adresse publique : chacune revérifie la session.

/** Marge dans chaque zone, affichée pendant la saisie. */
export async function marginsAction(priceUsd: number, costCny: number, weightG: number): Promise<ZoneMargin[] | null> {
  if (!(await isAdmin())) return null;
  return priceUsd > 0 && costCny > 0 && weightG > 0 ? marginsByZone(priceUsd, costCny, weightG) : null;
}

export async function uploadPhotoAction(form: FormData): Promise<{ url: string } | { error: string }> {
  if (!(await isAdmin())) return { error: "Session expirée : reconnecte-toi." };
  const file = form.get("photo");
  if (!(file instanceof File)) return { error: "Aucune photo reçue." };
  try {
    return { url: await uploadPhoto(file) };
  } catch (e) {
    console.error("[admin articles] photo", e);
    return { error: e instanceof Error ? e.message : "Photo non envoyée." };
  }
}

/** Enregistre, puis renvoie à la liste. La redirection se fait ici, côté serveur : un router.push du téléphone après
 *  l'enregistrement restait parfois sans effet et la fiche ne se fermait pas (retour de Serge, 6 nov.). */
export async function saveArticleAction(raw: ArticleInput): Promise<{ errors: string[] }> {
  const input = cleanArticle(raw);
  if (!(await isAdmin())) return { errors: ["Session expirée : reconnecte-toi."] };
  const known = { brands: (await listBoutiques()).map((b) => b.slug), categories: CATEGORIES.map((c) => c.id) };
  const errors = articleProblems(input, known);
  if (errors.length) return { errors };
  const isNew = !input.slug;
  if (!isNew && !(await getArticle(input.slug!))) return { errors: ["Article introuvable."] };
  const twin = findDuplicate(await listArticles(), input);
  if (twin)
    return { errors: [`« ${twin.name} » existe déjà pour cette marque${twin.onSite ? "" : " (masqué)"}. Ouvre-le dans la liste pour le modifier, ou change la description (ajoute la couleur, par exemple).`] };
  try {
    const slug = input.slug || articleSlug(input.brand, input.name, () => false);
    await saveArticle({ ...input, slug: isNew ? await uniqueSlug(slug) : slug }, isNew);
  } catch (e) {
    console.error("[admin articles] enregistrement", e);
    return { errors: ["L'enregistrement a échoué. Réessaie dans un instant."] };
  }
  updateTag(CATALOGUE_TAG); // le site montre le changement tout de suite
  redirect(`/admin/articles?msg=${encodeURIComponent(isNew ? "Article ajouté." : "Article modifié.")}`);
}

async function uniqueSlug(base: string): Promise<string> {
  if (!(await slugTaken(base))) return base;
  for (let i = 2; i < 100; i++) if (!(await slugTaken(`${base}-${i}`))) return `${base}-${i}`;
  throw new Error("Trop d'articles avec ce nom");
}

export async function toggleOnSiteAction(form: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/commandes");
  const slug = String(form.get("slug") ?? "");
  const show = form.get("show") === "1";
  await setOnSite(slug, show);
  updateTag(CATALOGUE_TAG);
  redirect(`/admin/articles?msg=${encodeURIComponent(show ? "Article remis sur le site." : "Article masqué : il n'est plus visible sur le site.")}`);
}

export async function deleteArticleAction(form: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/commandes");
  const slug = String(form.get("slug") ?? "");
  let msg: string;
  try {
    const r = await deleteArticle(slug);
    if (r === "ordered") {
      await setOnSite(slug, false);
      msg = "Cet article a déjà été commandé : il est masqué (pas supprimé) pour garder l'historique des commandes.";
    } else msg = r === "deleted" ? "Article supprimé." : "Article introuvable.";
    updateTag(CATALOGUE_TAG);
  } catch (e) {
    console.error("[admin articles] suppression", e);
    msg = "La suppression a échoué. Réessaie dans un instant.";
  }
  redirect(`/admin/articles?msg=${encodeURIComponent(msg)}`);
}
