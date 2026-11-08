"use client";

import { useEffect, useState } from "react";
import { marginsAction, saveArticleAction, uploadPhotoAction } from "@/app/admin/articles/actions";
import type { AdminArticle } from "@/lib/server/admin-articles";
import type { ZoneMargin } from "@/models/admin/article";
import { NewBrandPanel } from "./NewBrandPanel";
import { NewTypePanel } from "./NewTypePanel";

// Formulaire d'article de l'admin, pensé pour le téléphone de Jean Paul : photos prises ou choisies,
// réduites ici (1600 px, JPEG) avant l'envoi, prix en dollars, marge visible dans chaque devise avant d'enregistrer.

type Props = {
  article: AdminArticle | null;
  brands: { slug: string; name: string }[];
  categories: { id: string; label: string; sizes: string[]; weight: number }[];
  colors: { hex: string; name: string }[];
};

/**
 * Réduit une photo du téléphone (souvent 4 à 12 Mo) à 1400 px au plus, en JPEG, puis baisse la qualité
 * jusqu'à passer sous 900 Ko : l'envoi au serveur est limité (next.config.ts, serverActions.bodySizeLimit).
 */
async function shrink(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const encode = (q: number) => new Promise<Blob>((ok, ko) => c.toBlob((b) => (b ? ok(b) : ko(new Error("photo illisible"))), "image/jpeg", q));
  let blob = await encode(0.82);
  for (const q of [0.7, 0.6, 0.5]) {
    if (blob.size <= 900_000) break;
    blob = await encode(q);
  }
  return blob;
}

const NEW_BRAND = "__nouvelle";
const NEW_TYPE = "__nouveau-type";

const isRedirect = (e: unknown) => String((e as { digest?: unknown } | null)?.digest ?? "").startsWith("NEXT_REDIRECT");

export function ArticleForm({ article, brands: initialBrands, categories: initialCategories, colors }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [addingType, setAddingType] = useState(false);
  const [brands, setBrands] = useState(initialBrands);
  const [addingBrand, setAddingBrand] = useState(false);
  const [brand, setBrand] = useState(article?.brand ?? "");
  const [category, setCategory] = useState(article?.category ?? "");
  const [name, setName] = useState(article?.name ?? "");
  const [priceUsd, setPriceUsd] = useState(article?.priceUsd?.toString() ?? "");
  const [costCny, setCostCny] = useState(article?.costCny.toString() ?? "");
  const [weightG, setWeightG] = useState(article?.weightG.toString() ?? "");
  const [picked, setPicked] = useState<string[]>(article?.colors ?? []);
  const [sizes, setSizes] = useState((article?.sizes ?? categories.find((c) => c.id === article?.category)?.sizes ?? []).join(", "));
  const [supplierRef, setSupplierRef] = useState(article?.supplierRef ?? "");
  const [onSite, setOnSite] = useState(article?.onSite ?? true);
  const [front, setFront] = useState(article?.photos.front ?? "");
  const [back, setBack] = useState(article?.photos.back ?? "");
  const [details, setDetails] = useState<string[]>(article?.photos.details ?? []);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const num = (s: string) => Number(s.replace(",", "."));
  // Le calcul reste sur le serveur : les marges et les taux ne vont jamais dans le navigateur.
  const [margins, setMargins] = useState<ZoneMargin[] | null>(null);
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      void marginsAction(num(priceUsd), num(costCny), num(weightG))
        .catch(() => null)
        .then((m) => { if (live) setMargins(m); });
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [priceUsd, costCny, weightG]);

  const onCategory = (id: string) => {
    setCategory(id);
    const c = categories.find((x) => x.id === id);
    if (c) {
      setSizes(c.sizes.join(", "));
      if (!weightG) setWeightG(String(c.weight));
    }
  };

  async function send(files: FileList | null, put: (url: string) => void) {
    if (!files?.length) return;
    setErrors([]);
    for (const f of Array.from(files)) {
      setBusy("Envoi de la photo…");
      try {
        const fd = new FormData();
        fd.set("photo", new File([await shrink(f)], "photo.jpg", { type: "image/jpeg" }));
        const r = await uploadPhotoAction(fd);
        if ("url" in r) put(r.url);
        else setErrors([r.error]);
      } catch {
        setErrors(["Cette photo n'a pas pu être lue. Essaie une autre photo."]);
      }
    }
    setBusy(null);
  }

  async function save() {
    setBusy("Enregistrement…");
    setErrors([]);
    const r = await saveArticleAction({
      slug: article?.slug,
      brand,
      category,
      name,
      priceUsd: num(priceUsd),
      costCny: num(costCny),
      weightG: num(weightG),
      colors: picked,
      sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean),
      supplierRef,
      photos: { front, back: back || undefined, details },
      onSite,
    }).catch((e: unknown) =>
      // Réussi : le serveur renvoie à la liste, et Next le signale en rejetant la promesse. Ce n'est pas une panne.
      isRedirect(e) ? null : { errors: ["La connexion a coupé. Réessaie."] },
    );
    if (r?.errors.length) {
      setErrors(r.errors);
      setBusy(null);
    }
  }

  const photo = (url: string, remove: () => void) => (
    <span className="admin-thumb">
      {/* eslint-disable-next-line @next/next/no-img-element -- miniature de l'admin, déjà réduite */}
      <img src={url} alt="" />
      <button type="button" className="link" onClick={remove}>Retirer</button>
    </span>
  );

  return (
    <form className="admin-form" onSubmit={(e) => (e.preventDefault(), save())}>
      <label>
        Marque
        <select value={brand} onChange={(e) => (e.target.value === NEW_BRAND ? setAddingBrand(true) : setBrand(e.target.value))} required>
          <option value="" disabled>Choisir…</option>
          {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
          <option value={NEW_BRAND}>+ Nouvelle marque…</option>
        </select>
      </label>
      {addingBrand && (
        <NewBrandPanel
          onCancel={() => setAddingBrand(false)}
          onCreated={(b) => {
            setBrands((list) => [...list, b]);
            setBrand(b.slug);
            setAddingBrand(false);
          }}
        />
      )}
      <label>
        Catégorie
        <select value={category} onChange={(e) => (e.target.value === NEW_TYPE ? setAddingType(true) : onCategory(e.target.value))} required>
          <option value="" disabled>Choisir…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          <option value={NEW_TYPE}>+ Nouveau type…</option>
        </select>
      </label>
      {addingType && (
        <NewTypePanel
          onCancel={() => setAddingType(false)}
          onCreated={(t) => {
            setCategories((list) => [...list, t]);
            setCategory(t.id);
            setSizes(t.sizes.join(", "));
            if (!weightG) setWeightG(String(t.weight));
            setAddingType(false);
          }}
        />
      )}
      <label>
        Description
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hoodie noir, logo rouge" maxLength={120} required />
      </label>
      <label>
        Prix de vente (USD, droits et livraison compris)
        <input value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} inputMode="decimal" placeholder="189" required />
      </label>
      <label>
        Coût chez le fournisseur (¥)
        <input value={costCny} onChange={(e) => setCostCny(e.target.value)} inputMode="decimal" placeholder="435" required />
      </label>
      <label>
        Poids (grammes)
        <input value={weightG} onChange={(e) => setWeightG(e.target.value)} inputMode="numeric" placeholder="700" required />
      </label>

      {margins && (
        <table className="admin-margins">
          <thead><tr><th>Devise</th><th>Prix client</th><th>Marge</th></tr></thead>
          <tbody>
            {margins.map((m) => (
              <tr key={m.zone} className={m.low || m.raisedToFloor ? "is-alert" : undefined}>
                <td>{m.currency}</td>
                <td>{m.price} {m.currency}</td>
                <td>
                  {m.marginPct} %{m.raisedToFloor ? " · relevé au prix plancher" : m.low ? " ⚠️ marge faible" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <fieldset>
        <legend>Couleurs (la première est la principale)</legend>
        <div className="admin-swatches">
          {colors.map((c) => (
            <button
              key={c.hex}
              type="button"
              aria-pressed={picked.includes(c.hex)}
              title={c.name}
              style={{ background: c.hex }}
              onClick={() => setPicked((p) => (p.includes(c.hex) ? p.filter((x) => x !== c.hex) : [...p, c.hex]))}
            >
              <span className="sr-only">{c.name}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <label>
        Tailles (séparées par des virgules)
        <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S, M, L, XL" required />
      </label>
      <label>
        Référence fournisseur (facultatif)
        <input value={supplierRef} onChange={(e) => setSupplierRef(e.target.value)} maxLength={80} />
      </label>

      <fieldset>
        <legend>Photos</legend>
        <p className="muted">Face (obligatoire)</p>
        {front ? photo(front, () => setFront("")) : <input type="file" accept="image/*" onChange={(e) => send(e.target.files, setFront)} />}
        <p className="muted">Dos</p>
        {back ? photo(back, () => setBack("")) : <input type="file" accept="image/*" onChange={(e) => send(e.target.files, setBack)} />}
        <p className="muted">Détails (jusqu&apos;à 6)</p>
        <div className="admin-thumbs">{details.map((d) => photo(d, () => setDetails((x) => x.filter((y) => y !== d))))}</div>
        {details.length < 6 && <input type="file" accept="image/*" multiple onChange={(e) => send(e.target.files, (u) => setDetails((x) => [...x, u].slice(0, 6)))} />}
      </fieldset>

      <label className="admin-check">
        <input type="checkbox" checked={onSite} onChange={(e) => setOnSite(e.target.checked)} />
        Visible sur le site
      </label>

      {errors.length > 0 && (
        <ul className="todo" role="alert">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      <button className="pill solid" disabled={!!busy}>{busy ?? (article ? "Enregistrer les changements" : "Ajouter l'article")}</button>
    </form>
  );
}
