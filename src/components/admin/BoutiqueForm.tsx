"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveBoutiqueAction, uploadLogoAction } from "@/app/admin/boutiques/actions";
import type { AdminBoutique } from "@/lib/server/admin-boutiques";
import { logoColor, textOn } from "@/models/admin/boutique";

// Formulaire de boutique de l'admin, pensé pour le téléphone de Jean Paul. Le logo est réduit ici en PNG
// (la transparence reste), et la couleur de la boutique en est tirée ; il peut la changer avant d'enregistrer.

const LOGO_PX = 512;

/** Réduit le logo et lit sa couleur. */
async function readLogo(file: File): Promise<{ png: Blob; color: string }> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, LOGO_PX / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * scale));
  c.height = Math.max(1, Math.round(img.height * scale));
  const x = c.getContext("2d")!;
  x.drawImage(img, 0, 0, c.width, c.height);
  const color = logoColor(x.getImageData(0, 0, c.width, c.height).data);
  const png = await new Promise<Blob>((ok, ko) => c.toBlob((b) => (b ? ok(b) : ko(new Error("logo illisible"))), "image/png"));
  return { png, color };
}

export function BoutiqueForm({ boutique, total }: { boutique: AdminBoutique | null; total: number }) {
  const router = useRouter();
  const last = boutique ? total : total + 1;
  const [name, setName] = useState(boutique?.name ?? "");
  const [logo, setLogo] = useState(boutique?.logo ?? "");
  const [color, setColor] = useState(boutique?.color ?? "#111113");
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
      const { png, color: found } = await readLogo(f);
      const fd = new FormData();
      fd.set("logo", new File([png], "logo.png", { type: "image/png" }));
      const r = await uploadLogoAction(fd);
      if ("url" in r) {
        setLogo(r.url);
        setColor(found);
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

      <label>
        Couleur de la boutique {logo ? "(tirée du logo, tu peux la changer)" : ""}
        <input className="admin-color" type="color" value={color} onChange={(e) => setColor(e.target.value.toUpperCase())} />
      </label>

      <div className="admin-sign" style={{ background: color, color: textOn(color) }} aria-label="Aperçu de l'enseigne">
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
