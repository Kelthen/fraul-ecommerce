"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findDemoOrder } from "@/models/orders/demo";
import { lineLabel } from "@/models/orders/emails";
import { STAGES, normalizeCode, trackingView, type Order } from "@/models/orders/tracking";

const DEMO_CODES = ["FRL-1042", "FRL-1031", "FRL-1017"];
const day = (t: number) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

type Found = { code: string; order?: Order };

/**
 * Suivi de commande : 4 étapes, une phrase sur l'étape en cours, livraison estimée en fourchette (PARCOURS-COMMANDE §7.1).
 * Démo : trois commandes d'exemple ; le vrai suivi lira la base quand Supabase sera branché.
 */
export function TrackView() {
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(-1);

  const look = (raw: string) => {
    const c = normalizeCode(raw);
    setStep(-1);
    if (!c) {
      setFound(null);
      setError("Un code Fraul commence par FRL, par exemple FRL-1042.");
      return;
    }
    setError("");
    setCode(c);
    setFound({ code: c, order: findDemoOrder(c, Date.now()) });
  };

  // Lien d'un e-mail ou de « Mes commandes » : /suivi?code=FRL-1042
  useEffect(() => {
    const c = new URLSearchParams(location.search).get("code");
    if (c) look(c); // eslint-disable-line react-hooks/set-state-in-effect -- lecture unique de l'adresse au chargement
  }, []);

  const view = found?.order ? trackingView(found.order) : null;
  useEffect(() => {
    if (!view) return;
    const timers = Array.from({ length: view.stage + 1 }, (_, k) => setTimeout(() => setStep(k), 200 + k * 260));
    return () => timers.forEach(clearTimeout);
  }, [found]); // eslint-disable-line react-hooks/exhaustive-deps -- rejoue l'animation à chaque nouvelle recherche

  return (
    <div className="track-grid">
      <div>
        <p className="eyebrow">Suivi de commande</p>
        <h1 style={{ fontSize: "clamp(42px, 8vw, 72px)", lineHeight: 1, marginTop: 8 }}>Où est ma commande ?</h1>
        <p className="muted" style={{ marginTop: 12, maxWidth: "42ch" }}>
          Ton code est dans l&apos;e-mail de confirmation et dans Mon compte.
        </p>
        <form className="track-form" onSubmit={(e) => { e.preventDefault(); look(code); }}>
          <label className="sr-only" htmlFor="track-code">Code de suivi</label>
          <input id="track-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="FRL-1042" autoComplete="off" aria-invalid={error ? true : undefined} aria-describedby={error ? "track-err" : undefined} />
          <button className="pill solid" type="submit">Suivre</button>
        </form>
        {error && <p className="cf-err" id="track-err" role="alert" style={{ marginTop: 10 }}>{error}</p>}
        <p className="todo" style={{ marginTop: 14, fontSize: 13 }}>
          Démo : essaie {DEMO_CODES.map((c, i) => (
            <span key={c}>{i ? ", " : ""}<button type="button" className="link-btn" onClick={() => look(c)}>{c}</button></span>
          ))}.
        </p>
      </div>

      {found && (
        <div aria-live="polite" className="track-res">
          <p className="eyebrow" style={{ marginBottom: 6 }}>{found.code}</p>
          {!found.order || !view ? (
            <p className="muted">Aucune commande avec ce code. Vérifie l&apos;e-mail de confirmation, ou écris-nous en y répondant.</p>
          ) : (
            <>
              <p className="track-eta">
                {view.window ? <>Livraison prévue <b>{view.window}</b></> : found.order.deliveredAt ? <>Livrée le <b>{day(found.order.deliveredAt)}</b></> : <>Livrée</>}
              </p>
              <ol className="steps">
                <i className="fill" style={{ height: `${(Math.max(0, step) / (STAGES.length - 1)) * 100}%` }} aria-hidden="true" />
                {STAGES.map((s, i) => (
                  <li key={s.id} className={`${i <= step ? "on" : ""} ${i === view.stage ? "now" : ""}`} aria-current={i === view.stage ? "step" : undefined}>
                    <b>{s.label}</b>
                    {i === 0 && <span>{day(found.order!.paidAt)}</span>}
                    {i === view.stage && i > 0 && <span className="track-live" key={found.order!.step}>{view.text}</span>}
                  </li>
                ))}
              </ol>
              {view.refunds.map((l) => (
                <p className="track-refund" key={l.name}>
                  <b>{lineLabel(l)}</b> n&apos;est plus disponible : remboursée le {day(l.refundedAt!)}.{" "}
                  <Link className="link" href={`/sur-demande?marque=${encodeURIComponent(l.brand)}`}>La faire chercher</Link>
                </p>
              ))}
              <ul className="track-lines">
                {found.order.lines.filter((l) => !l.refundedAt).map((l) => <li key={l.name}>{lineLabel(l)}</li>)}
              </ul>
              <p className="muted" style={{ fontSize: 13 }}>Mis à jour à chaque passage du colis. Droits et taxes inclus : rien à payer à la livraison.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
