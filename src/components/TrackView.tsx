"use client";

import { useEffect, useState } from "react";

const STEPS = [
  ["Commandée", "Paiement confirmé, le fournisseur reçoit la commande."],
  ["Préparée", "Articles vérifiés et emballés."],
  ["Expédiée", "Code de suivi transmis par le transporteur."],
  ["En route", "En transit vers ton adresse."],
  ["Livrée", "Réception confirmée."],
];

// Exemple animé : le vrai suivi (codes, étapes du transporteur) arrive avec les premières commandes.
export function TrackView() {
  const [code, setCode] = useState("");
  const [shown, setShown] = useState<string | null>(null);
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (shown === null) return;
    const timers = [0, 1, 2].map((k) => setTimeout(() => setStep(k), 350 + k * 450));
    return () => timers.forEach(clearTimeout);
  }, [shown]);

  return (
    <div className="track-grid">
      <div>
        <p className="eyebrow">Suivi de commande</p>
        <h1 style={{ fontSize: "clamp(42px, 8vw, 72px)", lineHeight: 1, marginTop: 8 }}>Où est ma commande ?</h1>
        <p className="muted" style={{ marginTop: 12, maxWidth: "42ch" }}>
          Entre ton code de suivi : tu vois ta pièce avancer jusqu&apos;à ta porte.
        </p>
        <form
          className="track-form"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(-1);
            setShown(code.trim() || "FRL-EXEMPLE");
          }}
        >
          <label className="sr-only" htmlFor="track-code">Code de suivi</label>
          <input id="track-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="FRL-2026-000123" autoComplete="off" />
          <button className="pill solid" type="submit">Suivre</button>
        </form>
      </div>
      {shown !== null && (
        <div aria-live="polite">
          <p className="eyebrow" style={{ marginBottom: 6 }}>{shown}</p>
          <p className="todo" style={{ marginBottom: 22, fontSize: 13 }}>
            Exemple de démonstration : le suivi réel sera activé avec les premières commandes.
          </p>
          <ol className="steps">
            <i className="fill" style={{ height: `${Math.max(0, step) * 25}%` }} aria-hidden="true" />
            {STEPS.map(([t, d], i) => (
              <li key={t} className={`${i <= step ? "on" : ""} ${i === step ? "now" : ""}`}>
                <b>{t}</b>
                <span>{d}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
