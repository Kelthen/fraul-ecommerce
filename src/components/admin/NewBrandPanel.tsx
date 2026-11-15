"use client";

import { useState } from "react";
import { saveBoutiqueAction, uploadLogoAction } from "@/app/admin/boutiques/actions";
import { readLogo } from "./logo";

// « + Nouvelle marque » de la fiche article : nom, puis logo ou 2 couleurs. La marque créée est sélectionnée et
// l'article continue d'être rempli. Ce panneau vit dans le formulaire de l'article : pas de <form> ici, un formulaire
// ne s'imbrique pas dans un autre, et la touche Entrée ne doit pas enregistrer l'article.

/** À la fin du parcours : la place est ramenée à la dernière boutique (moveToPlace). */
const LAST_PLACE = 9999;

type Props = { onCreated: (brand: { slug: string; name: string }) => void; onCancel: () => void };

export function NewBrandPanel({ onCreated, onCancel }: Props) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [color, setColor] = useState("#111113");
  const [textColor, setTextColor] = useState("#FFFEF7");
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function send(file?: File) {
    if (!file) return;
    setErrors([]);
    setBusy("Envoi du logo…");
    try {
      const { png, color: bg, textColor: fg } = await readLogo(file);
      const fd = new FormData();
      fd.set("logo", png);
      const r = await uploadLogoAction(fd);
      if ("url" in r) {
        setLogo(r.url);
        setColor(bg);
        setTextColor(fg);
      } else setErrors([r.error]);
    } catch {
      setErrors(["Ce logo n'a pas pu être lu. Essaie une autre image."]);
    }
    setBusy(null);
  }

  async function create() {
    setErrors([]);
    setBusy("Création…");
    const r = await saveBoutiqueAction({ name, logo: logo || undefined, color, textColor, place: LAST_PLACE, visible: true })
      .catch(() => ({ errors: ["La création a échoué. Réessaie dans un instant."] }));
    setBusy(null);
    if ("slug" in r) onCreated({ slug: r.slug, name: name.trim() });
    else setErrors(r.errors);
  }

  return (
    <div className="admin-panel" role="group" aria-label="Nouvelle marque">
      <label>
        Nom de la marque
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
          placeholder="Gucci"
          maxLength={60}
          autoFocus
        />
      </label>

      <div className="admin-field">
        <p>Logo (facultatif : PNG, JPEG ou WebP)</p>
        <p className="muted">Seulement un logo que TakeUrClothes a le droit d&apos;afficher. Ses couleurs sont reprises toutes seules.</p>
        {logo ? (
          <button type="button" className="link" onClick={() => setLogo("")}>Retirer le logo</button>
        ) : (
          <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Logo de la marque" onChange={(e) => send(e.target.files?.[0])} />
        )}
      </div>

      <div className="admin-colors">
        <label>
          Fond
          <input className="admin-color" type="color" value={color} onChange={(e) => setColor(e.target.value.toUpperCase())} />
        </label>
        <label>
          Texte
          <input className="admin-color" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value.toUpperCase())} />
        </label>
      </div>

      <div className="admin-sign" style={{ background: color, color: textColor }} aria-label="Aperçu de l'enseigne">
        {/* eslint-disable-next-line @next/next/no-img-element -- aperçu du logo envoyé */}
        {logo ? <img src={logo} alt="" /> : <span>{name || "Nom de la marque"}</span>}
      </div>

      {errors.length > 0 && (
        <ul className="todo" role="alert">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      <div className="admin-acts">
        <button type="button" className="pill solid" disabled={!!busy} onClick={() => void create()}>{busy ?? "Créer la marque"}</button>
        <button type="button" className="pill ghost" disabled={!!busy} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}
