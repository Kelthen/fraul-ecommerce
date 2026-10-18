"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LIMITS, validateRequest, type ConciergeField, type ConciergeRequest } from "@/models/concierge/request";

type Props = {
  brand?: string;
  /** Page /conciergerie : préremplir la marque avec ?marque=… (lien « Demande-le » d'une boutique). */
  brandFromUrl?: boolean;
  className?: string;
};
type Errors = Partial<Record<ConciergeField | "form", string>>;

const FIELDS: { k: ConciergeField; label: string; hint?: string; type?: string; area?: boolean; required?: boolean; auto?: string }[] = [
  { k: "item", label: "Quel article ?", hint: "Modèle, couleur… ex. « Tech Fleece vert sapin »", required: true },
  { k: "brand", label: "Marque" },
  { k: "size", label: "Taille" },
  { k: "link", label: "Lien vers une photo ou une fiche (facultatif)", type: "url", hint: "https://…" },
  { k: "email", label: "Ton e-mail, pour te répondre", type: "email", required: true, auto: "email" },
  { k: "note", label: "Précisions (facultatif)", area: true, hint: "Couleur exacte, délai souhaité…" },
];

/**
 * Formulaire « Demande un article » de la Conciergerie (page /conciergerie et comptoir du Walk).
 * Démo : la demande est vérifiée mais pas envoyée (pas d'e-mail réel avant le branchement de Supabase).
 */
export function ConciergeForm({ brand = "", brandFromUrl = false, className }: Props) {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const el = form.current?.elements.namedItem("brand");
    const m = brandFromUrl ? new URLSearchParams(location.search).get("marque") : null;
    if (m && el instanceof HTMLInputElement && !el.value) el.value = m.slice(0, LIMITS.brand);
  }, [brandFromUrl]);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<ConciergeRequest | null>(null);

  if (sent)
    return (
      <div className={`concierge-done${className ? ` ${className}` : ""}`} role="status">
        <p className="eyebrow">Demande notée</p>
        <h3>On part à la recherche de ta pièce.</h3>
        <p>
          <b>{sent.item}</b>
          {sent.brand ? ` · ${sent.brand}` : ""}
          {sent.size ? ` · ${sent.size}` : ""}
        </p>
        <p>Réponse par e-mail à {sent.email}.</p>
        <p className="todo">Démo : la demande n&apos;est pas encore envoyée à l&apos;équipe (branchement prévu avec les comptes).</p>
        <button className="pill ghost" type="button" onClick={() => setSent(null)}>Nouvelle demande</button>
      </div>
    );

  return (
    <form
      ref={form}
      className={`concierge-form${className ? ` ${className}` : ""}`}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const get = (k: string) => String(f.get(k) ?? "");
        const r = validateRequest({ item: get("item"), brand: get("brand"), size: get("size"), link: get("link"), email: get("email"), note: get("note"), website: get("website") });
        if (r.ok) { setErrors({}); setSent(r.value); }
        else setErrors(r.errors);
      }}
    >
      {FIELDS.map(({ k, label, hint, type, area, required, auto }) => {
        const fid = `${id}-${k}`, err = errors[k];
        const common = {
          id: fid, name: k, maxLength: LIMITS[k], placeholder: hint, required, autoComplete: auto ?? "off",
          "aria-invalid": err ? true : undefined, "aria-describedby": err ? `${fid}-err` : undefined,
        };
        return (
          <div className={`cf-field cf-${k}`} key={k}>
            <label htmlFor={fid}>{label}{required ? " *" : ""}</label>
            {area ? <textarea {...common} rows={3} /> : <input {...common} type={type ?? "text"} defaultValue={k === "brand" ? brand : undefined} />}
            {err && <span className="cf-err" id={`${fid}-err`}>{err}</span>}
          </div>
        );
      })}
      {/* Champ piège : caché aux humains, rempli par les robots */}
      <div className="cf-trap" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Site web</label>
        <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {errors.form && <p className="cf-err" role="alert">{errors.form}</p>}
      <button className="pill solid" type="submit">Envoyer ma demande</button>
      <p className="cf-small">On ne te demande ni paiement ni mot de passe. Ton e-mail sert seulement à te répondre.</p>
    </form>
  );
}
