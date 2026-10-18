"use client";

import Link from "next/link";
import { useState } from "react";
import type { Brand } from "@/lib/catalog";
import { BrandTile } from "./BrandTile";

/** Annuaire des marques : recherche + grille de pastilles (de A à Z). */
export function BrandDirectory({ brands }: { brands: Brand[] }) {
  const [q, setQ] = useState("");
  const list = brands.filter((b) => b.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <label className="sr-only" htmlFor="brand-q">
        Chercher une marque
      </label>
      <input id="brand-q" className="dir-search" type="search" placeholder="Chercher une marque" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length === 0 && <p className="empty">Aucune marque ne correspond à « {q} ».</p>}
      <ul className="bround-grid">
        {list.map((b) => (
          <li key={b.slug}>
            <BrandTile brand={b} variant="grid" />
            <span className="bround-name">{b.name}</span>
            <Link className="bround-walk" href={`/walk/${b.slug}`}>
              Voir la boutique
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
