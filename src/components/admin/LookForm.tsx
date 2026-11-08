"use client";

import { useState } from "react";
import { uploadPhotoAction } from "@/app/admin/articles/actions";
import { saveLookAction } from "@/app/admin/looks/actions";
import type { AdminLook } from "@/lib/server/admin-looks";
import { shrink } from "./ArticleForm";

// Formulaire d'un look, pensé pour le téléphone de Jean Paul : une photo de la personne entière sur un fond uni
// (détourée ensuite automatiquement), un nom, puis on touche les articles portés (2 à 6).

type Article = { slug: string; name: string; brand: string; photo: string };
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function LookForm({ look, articles }: { look: AdminLook | null; articles: Article[] }) {
  const [title, setTitle] = useState(look?.title ?? "");
  const [photo, setPhoto] = useState(look?.photo ?? "");
  const [items, setItems] = useState<string[]>(look?.items ?? []);
  const [onSite, setOnSite] = useState(look?.onSite ?? true);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function send(file?: File) {
    if (!file) return;
    setErrors([]);
    setBusy("Envoi de la photo…");
    try {
      const fd = new FormData();
      fd.set("photo", new File([await shrink(file)], "look.jpg", { type: "image/jpeg" }));
      const r = await uploadPhotoAction(fd);
      if ("url" in r) setPhoto(r.url);
      else setErrors([r.error]);
    } catch {
      setErrors(["Cette photo n'a pas pu être lue. Essaie une autre photo."]);
    }
    setBusy(null);
  }

  async function save() {
    setBusy("Enregistrement…");
    setErrors([]);
    const r = await saveLookAction({ id: look?.id, title, photo, items, onSite }).catch((e: unknown) => {
      if (String((e as { digest?: unknown } | null)?.digest ?? "").startsWith("NEXT_REDIRECT")) throw e;
      return { errors: ["La connexion a coupé. Réessaie."] };
    });
    if (r?.errors) setErrors(r.errors);
    setBusy(null);
  }

  const toggle = (slug: string) => setItems((x) => (x.includes(slug) ? x.filter((s) => s !== slug) : x.length >= 6 ? x : [...x, slug]));
  const words = fold(q).split(/\s+/).filter(Boolean);
  const shown = articles.filter((a) => items.includes(a.slug) || words.every((w) => fold(`${a.brand} ${a.name}`).includes(w)));

  return (
    <form className="admin-form" onSubmit={(e) => (e.preventDefault(), void save())}>
      <label>
        Nom du look
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tout noir Corteiz" maxLength={60} required />
      </label>

      <fieldset>
        <legend>Photo du look</legend>
        <p className="muted">La personne en entier, de la tête aux pieds, sur un fond uni. Le fond est enlevé tout seul.</p>
        {photo ? (
          <span className="admin-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element -- miniature de l'admin */}
            <img src={photo} alt="" />
            <button type="button" className="link" onClick={() => setPhoto("")}>Changer</button>
          </span>
        ) : (
          <input type="file" accept="image/*" onChange={(e) => void send(e.target.files?.[0])} />
        )}
      </fieldset>

      <fieldset>
        <legend>Articles portés ({items.length} / 6)</legend>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher : corteiz, hoodie…" aria-label="Chercher un article" />
        <ul className="admin-pick">
          {shown.map((a) => (
            <li key={a.slug}>
              <button type="button" aria-pressed={items.includes(a.slug)} onClick={() => toggle(a.slug)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- miniature de l'admin */}
                <img src={a.photo} alt="" loading="lazy" />
                <span className="admin-brand">{a.brand}</span>
                <span className="admin-name">{a.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      <label className="admin-check">
        <input type="checkbox" checked={onSite} onChange={(e) => setOnSite(e.target.checked)} />
        Visible sur l&apos;accueil
      </label>

      {errors.length > 0 && (
        <ul className="todo" role="alert">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      <button className="pill solid" disabled={!!busy}>{busy ?? (look ? "Enregistrer les changements" : "Ajouter le look")}</button>
    </form>
  );
}
