"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { submitFinds } from "@/app/sur-demande/actions";
import { Captcha } from "@/components/account/Captcha";
import { TURNSTILE_SITE_KEY } from "@/lib/auth-client";
import { LIMITS, validateRequest, type ConciergeField, type ConciergeRequest } from "@/models/concierge/request";

type Props = {
  brand?: string;
  /** Page /sur-demande : préremplir la marque avec ?marque=… (lien « Demande-le » d'une boutique). */
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
 * Formulaire « Finds » : une pièce sur demande (page /sur-demande et comptoir du Walk).
 * La demande part dans la base et l'équipe est prévenue. En local, sans base, elle est seulement vérifiée.
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
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const onCaptcha = useCallback((t: string) => setCaptcha(t), []);

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
        {demo && <p className="todo">Démo : la demande n&apos;est pas encore envoyée à l&apos;équipe.</p>}
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
        const input = { item: get("item"), brand: get("brand"), size: get("size"), link: get("link"), email: get("email"), note: get("note"), website: get("website") };
        const r = validateRequest(input);
        if (!r.ok) { setErrors(r.errors); return; }
        if (TURNSTILE_SITE_KEY && !captcha) { setErrors({ form: "Vérification en cours, réessaie dans une seconde." }); return; }
        setErrors({});
        setBusy(true);
        void submitFinds(input, captcha)
          .catch(() => ({ ok: false as const, errors: { form: "La demande n'est pas partie. Réessaie dans un instant." } }))
          .then((res) => {
            setBusy(false);
            setCaptcha("");
            setCaptchaKey((k) => k + 1); // un jeton de captcha ne sert qu'une fois
            if (res.ok) { setDemo(res.ok === "demo"); setSent(res.value); }
            else setErrors(res.errors);
          });
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
      <Captcha key={captchaKey} onToken={onCaptcha} />
      {errors.form && <p className="cf-err" role="alert">{errors.form}</p>}
      <button className="pill solid" type="submit" disabled={busy}>Envoyer ma demande</button>
      <p className="cf-small">On ne te demande ni paiement ni mot de passe. Ton e-mail sert seulement à te répondre.</p>
    </form>
  );
}
