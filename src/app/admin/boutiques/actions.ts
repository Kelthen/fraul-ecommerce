"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CATALOGUE_TAG } from "@/lib/catalog/db";
import { isAdmin } from "@/lib/server/admin-session";
import { uploadPhoto } from "@/lib/server/admin-articles";
import { listBoutiques, placeBoutique, removeBoutique, saveBoutique, setVisible } from "@/lib/server/admin-boutiques";
import { boutiqueProblems, type BoutiqueInput } from "@/models/admin/boutique";

// Actions de l'admin des boutiques. Une action serveur est une adresse publique : chacune revérifie la session.

const back = (msg: string) => redirect(`/admin/boutiques?msg=${encodeURIComponent(msg)}`);

export async function uploadLogoAction(form: FormData): Promise<{ url: string } | { error: string }> {
  if (!(await isAdmin())) return { error: "Session expirée : reconnecte-toi." };
  const file = form.get("logo");
  if (!(file instanceof File)) return { error: "Aucun logo reçu." };
  try {
    return { url: await uploadPhoto(file) };
  } catch (e) {
    console.error("[admin boutiques] logo", e);
    return { error: e instanceof Error ? e.message : "Logo non envoyé." };
  }
}

export async function saveBoutiqueAction(input: BoutiqueInput): Promise<{ slug: string } | { errors: string[] }> {
  if (!(await isAdmin())) return { errors: ["Session expirée : reconnecte-toi."] };
  try {
    const others = (await listBoutiques()).filter((b) => b.slug !== input.slug).map((b) => b.name);
    const errors = boutiqueProblems(input, others);
    if (errors.length) return { errors };
    const slug = await saveBoutique(input);
    updateTag(CATALOGUE_TAG); // le site montre le changement tout de suite
    return { slug };
  } catch (e) {
    console.error("[admin boutiques] enregistrement", e);
    return { errors: ["L'enregistrement a échoué. Réessaie dans un instant."] };
  }
}

export async function toggleVisibleAction(form: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/commandes");
  const show = form.get("show") === "1";
  await setVisible(String(form.get("slug") ?? ""), show);
  updateTag(CATALOGUE_TAG);
  back(show ? "Boutique remise sur le site." : "Boutique masquée : elle et ses articles ne se voient plus sur le site.");
}

export async function moveBoutiqueAction(form: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/commandes");
  await placeBoutique(String(form.get("slug") ?? ""), Number(form.get("place")));
  updateTag(CATALOGUE_TAG);
  back("Place dans le mall changée.");
}

export async function removeBoutiqueAction(form: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/commandes");
  const done = await removeBoutique(String(form.get("slug") ?? ""));
  updateTag(CATALOGUE_TAG);
  back(done ? "Boutique retirée." : "Retrait impossible : cette boutique a des articles. Masque-la plutôt.");
}
