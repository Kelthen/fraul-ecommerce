"use client";

import { useState } from "react";
import { createTypeAction, type NewType } from "@/app/admin/articles/actions";
import { SLOTS } from "@/models/admin/category";
import type { OutfitSlot } from "@/lib/catalog/types";

// « + Nouveau type » de la fiche article (ex. maillots) : nom, tailles, poids moyen, où ça se porte.
// Dans le formulaire de l'article : pas de <form> ici (un formulaire ne s'imbrique pas), Entrée n'enregistre rien.

type Props = { onCreated: (t: NewType) => void; onCancel: () => void };
const noEnter = (e: React.KeyboardEvent) => { if (e.key === "Enter") e.preventDefault(); };

export function NewTypePanel({ onCreated, onCancel }: Props) {
  const [label, setLabel] = useState("");
  const [sizes, setSizes] = useState("S, M, L, XL");
  const [weight, setWeight] = useState("300");
  const [slot, setSlot] = useState<OutfitSlot>("top");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function create() {
    setBusy(true);
    setErrors([]);
    const r = await createTypeAction({ label, sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean), weightG: Number(weight.replace(",", ".")), slot })
      .catch(() => ({ errors: ["La création a échoué. Réessaie dans un instant."] }));
    setBusy(false);
    if ("type" in r) onCreated(r.type);
    else setErrors(r.errors);
  }

  return (
    <div className="admin-panel" role="group" aria-label="Nouveau type">
      <label>
        Nom du type
        <input value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={noEnter} placeholder="Maillots" maxLength={40} autoFocus />
      </label>
      <label>
        Tailles (séparées par des virgules)
        <input value={sizes} onChange={(e) => setSizes(e.target.value)} onKeyDown={noEnter} />
      </label>
      <label>
        Poids moyen (grammes)
        <input value={weight} onChange={(e) => setWeight(e.target.value)} onKeyDown={noEnter} inputMode="numeric" />
      </label>
      <label>
        Ça se porte où ?
        <select value={slot} onChange={(e) => setSlot(e.target.value as OutfitSlot)}>
          {SLOTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </label>
      {errors.length > 0 && (
        <ul className="todo" role="alert">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      <div className="admin-acts">
        <button type="button" className="pill solid" disabled={busy} onClick={() => void create()}>{busy ? "Création…" : "Créer le type"}</button>
        <button type="button" className="pill ghost" disabled={busy} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}
