"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveBoutiqueAction, uploadLogoAction } from "@/app/admin/boutiques/actions";
import type { AdminBoutique } from "@/lib/server/admin-boutiques";
import { readLogo } from "./logo";

// Formulaire de boutique de l'admin, pensé pour le téléphone de Jean Paul. Le logo est réduit ici en PNG
// (la transparence reste), et les couleurs de la boutique en sont tirées ; il peut les changer avant d'enregistrer.

export function BoutiqueForm({ boutique, total }: { boutique: AdminBoutique | null; total: number }) {
  const router = useRouter();
  const last = boutique ? total : total + 1;
  const [name, setName] = useState(boutique?.name ?? "");
  const [logo, setLogo] = useState(boutique?.logo ?? "");
  const [color, setColor] = useState(boutique?.color ?? "#111113");
  const [textColor, setTextColor] = useState(boutique?.textColor ?? "#FFFEF7");
  const [place, setPlace] = useState(String(boutique?.place ?? last));
  const [visible, setVisible] = useState(boutique?.visible ?? true);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function send(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setErrors([]);
    setBusy("Envoi du logo…");
    try {
      const { png, color: bg, textColor: fg } = await readLogo(f);
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

  async function save() {
    setErrors([]);
    setBusy("Enregistrement…");
    const r = await saveBoutiqueAction({
      slug: boutique?.slug,
      name,
      logo: logo || undefined,
      color,
      textColor,
      place: Number(place),
      visible,
    }).catch(() => ({ errors: ["L'enregistrement a échoué. Réessaie dans un instant."] }));
    if ("slug" in r) router.push(`/admin/boutiques?msg=${encodeURIComponent(boutique ? "Boutique modifiée." : "Boutique ajoutée. Elle apparaîtra dans le mall avec son premier article.")}`);
    else {
      setErrors(r.errors);
      setBusy(null);
    }
  }

  return (
    <form className="admin-form" onSubmit={(e) => (e.preventDefault(), save())}>
      <label>
        Nom
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Corteiz" maxLength={60} required />
      </label>

      <fieldset>
        <legend>Logo (PNG, JPEG ou WebP)</legend>
        <p className="muted">Utilise seulement un logo que TakeUrClothes a le droit d&apos;afficher. Sans logo, l&apos;enseigne montre le nom.</p>
        {logo ? (
          <button type="button" className="link" onClick={() => setLogo("")}>Retirer le logo</button>
        ) : (
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => send(e.target.files)} />
        )}
      </fieldset>

      <div className="admin-colors">
        <label>
          Fond {logo ? "(tiré du logo)" : ""}
          <input className="admin-color" type="color" value={color} onChange={(e) => setColor(e.target.value.toUpperCase())} />
        </label>
        <label>
          Texte
          <input className="admin-color" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value.toUpperCase())} />
        </label>
      </div>

      <div className="admin-sign" style={{ background: color, color: textColor }} aria-label="Aperçu de l'enseigne">
        {/* eslint-disable-next-line @next/next/no-img-element -- aperçu du logo envoyé */}
        {logo ? <img src={logo} alt="" /> : <span>{name || "Nom de la boutique"}</span>}
      </div>

      <label>
        Place dans le mall (1 = la première, {last} = la dernière)
        <input type="number" min={1} max={last} value={place} onChange={(e) => setPlace(e.target.value)} required />
      </label>

      <label className="admin-check">
        <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
        Visible sur le site
      </label>

      {errors.length > 0 && (
        <ul className="todo" role="alert">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      <button className="pill solid" disabled={!!busy}>{busy ?? (boutique ? "Enregistrer les changements" : "Ajouter la boutique")}</button>
    </form>
  );
}
