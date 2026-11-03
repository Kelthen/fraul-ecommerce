"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lookupOrder } from "@/app/suivi/actions";
import { lineLabel } from "@/models/orders/emails";
import { STAGES, normalizeCode, trackingView, type Order } from "@/models/orders/tracking";
import { useAccount } from "./AccountProvider";

const DEMO_CODES = ["TUC-1042", "TUC-1031", "TUC-1017"];
const day = (t: number) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

type Found = { code: string; order?: Order; closed?: boolean };

/**
 * Suivi de commande : 4 étapes, une phrase sur l'étape en cours, livraison estimée en fourchette (PARCOURS-COMMANDE §7.1).
 * Lit la base : numéro + e-mail de la commande. `demo` (hors production) : trois commandes d'exemple en plus.
 */
export function TrackView({ demo = false }: { demo?: boolean }) {
  const { account } = useAccount();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(-1);

  const look = async (raw: string, mail: string) => {
    const c = normalizeCode(raw);
    setStep(-1);
    if (!c) {
      setFound(null);
      setError("Un code TakeUrClothes commence par TUC, par exemple TUC-2026-000123.");
      return;
    }
    setCode(c);
    const isDemo = demo && DEMO_CODES.includes(c);
    if (!isDemo && !mail.trim()) {
      setFound(null);
      setError("Ajoute l'e-mail utilisé pour la commande.");
      return;
    }
    setError("");
    setBusy(true);
    const r = await lookupOrder(c, mail).catch(() => ({ status: "error" as const }));
    setBusy(false);
    if (r.status === "error") {
      setFound(null);
      setError("Le suivi ne répond pas. Réessaie dans un instant.");
      return;
    }
    setFound({ code: c, order: r.status === "found" ? r.order : undefined, closed: r.status === "closed" });
  };

  // Lien d'un e-mail ou de « Mes commandes » : /suivi?code=TUC-2026-000123 (le code est prêt, il reste l'e-mail).
  useEffect(() => {
    const c = new URLSearchParams(location.search).get("code");
    if (!c) return;
    const n = normalizeCode(c);
    if (demo && n && DEMO_CODES.includes(n)) void look(c, ""); // eslint-disable-line react-hooks/set-state-in-effect -- lecture unique de l'adresse au chargement
    else setCode(n ?? c);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- une seule fois, au chargement

  // Client connecté (lien de « Mes commandes ») : son e-mail est déjà connu.
  useEffect(() => {
    if (!account) return;
    setEmail(account.email); // eslint-disable-line react-hooks/set-state-in-effect -- reprend le compte chargé du téléphone
    const c = new URLSearchParams(location.search).get("code");
    if (c && normalizeCode(c)) void look(c, account.email);
  }, [account?.email]); // eslint-disable-line react-hooks/exhaustive-deps -- seulement quand le compte change

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
          Ton numéro s&apos;affiche à la fin du paiement. Entre-le avec l&apos;e-mail de ta commande.
        </p>
        <form className="track-form" onSubmit={(e) => { e.preventDefault(); void look(code, email); }}>
          <label className="sr-only" htmlFor="track-code">Code de suivi</label>
          <input id="track-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="TUC-2026-000123" autoComplete="off" aria-invalid={error ? true : undefined} aria-describedby={error ? "track-err" : undefined} />
          <label className="sr-only" htmlFor="track-email">E-mail de la commande</label>
          <input id="track-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail de la commande" autoComplete="email" />
          <button className="pill solid" type="submit" disabled={busy}>Suivre</button>
        </form>
        {error && <p className="cf-err" id="track-err" role="alert" style={{ marginTop: 10 }}>{error}</p>}
        {demo && (
          <p className="todo" style={{ marginTop: 14, fontSize: 13 }}>
            Démo : essaie {DEMO_CODES.map((c, i) => (
              <span key={c}>{i ? ", " : ""}<button type="button" className="link-btn" onClick={() => void look(c, "")}>{c}</button></span>
            ))}.
          </p>
        )}
      </div>

      {found && (
        <div aria-live="polite" className="track-res">
          <p className="eyebrow" style={{ marginBottom: 6 }}>{found.code}</p>
          {found.closed ? (
            <p className="muted">Cette commande a été annulée ou remboursée. Une question ? Écris-nous.</p>
          ) : !found.order || !view ? (
            <p className="muted">Aucune commande avec ce numéro et cet e-mail. Vérifie les deux, puis réessaie.</p>
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
