"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CATALOGUE_TAG } from "@/lib/catalog/db";
import { listArticles } from "@/lib/server/admin-articles";
import { deleteLook, saveLook } from "@/lib/server/admin-looks";
import { isAdmin } from "@/lib/server/admin-session";
import { lookProblems, type LookInput } from "@/models/admin/look";

// Actions de l'admin des looks. Une action serveur est une adresse publique : chacune revérifie la session.

export async function saveLookAction(raw: LookInput): Promise<{ errors: string[] }> {
  if (!(await isAdmin())) return { errors: ["Session expirée : reconnecte-toi."] };
  const input: LookInput = {
    id: typeof raw.id === "string" ? raw.id : undefined,
    title: String(raw.title ?? "").slice(0, 80),
    photo: String(raw.photo ?? "").replace(/\s+/g, ""),
    items: (Array.isArray(raw.items) ? raw.items : []).map(String).slice(0, 12),
    onSite: Boolean(raw.onSite),
  };
  const errors = lookProblems(input, (await listArticles()).map((a) => a.slug));
  if (errors.length) return { errors };
  try {
    await saveLook(input);
    updateTag(CATALOGUE_TAG);
  } catch (e) {
    console.error("[admin looks] enregistrement", e);
    return { errors: ["L'enregistrement a échoué. Réessaie dans un instant."] };
  }
  redirect(`/admin/looks?msg=${encodeURIComponent("Look enregistré. Il apparaît sur l'accueil dès que sa photo est détourée (une dizaine de minutes).")}`);
}

export async function deleteLookAction(form: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");
  await deleteLook(String(form.get("id") ?? ""));
  updateTag(CATALOGUE_TAG);
  redirect(`/admin/looks?msg=${encodeURIComponent("Look supprimé.")}`);
}
