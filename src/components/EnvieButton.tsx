"use client";

import type { Envie } from "@/models/envies/envies";
import { useEnvies } from "./EnviesProvider";

type Props = { item: Omit<Envie, "at">; className?: string; compact?: boolean };

/** Bouton « Envie » : garde la pièce dans « Mes envies » (cœur plein quand elle y est). */
export function EnvieButton({ item, className, compact = false }: Props) {
  const { has, toggle } = useEnvies();
  const on = has(item.slug);
  return (
    <button
      type="button"
      className={`envie-btn${on ? " on" : ""}${className ? ` ${className}` : ""}`}
      aria-pressed={on}
      aria-label={on ? `Retirer ${item.name} de mes envies` : `Garder ${item.name} dans mes envies`}
      onClick={() => toggle(item)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="envie-ico">
        <path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.8 4.5 7.2 4.5c2 0 3.4 1.1 4.8 2.9 1.4-1.8 2.8-2.9 4.8-2.9 3.4 0 5.6 3.3 4.4 6.7-1.7 4.7-9.2 9.3-9.2 9.3z" />
      </svg>
      {!compact && <span>{on ? "Dans mes envies" : "Envie"}</span>}
    </button>
  );
}
