"use client";

import { MAX_QTY } from "@/models/cart/limits";

/** Choix de la quantité avant d'ajouter au panier : − 1 +, de 1 à MAX_QTY. */
export function QtyStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <span className="qty" role="group" aria-label="Quantité">
      <button type="button" aria-label="Un de moins" disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label="Un de plus" disabled={value >= MAX_QTY} onClick={() => onChange(value + 1)}>+</button>
    </span>
  );
}
