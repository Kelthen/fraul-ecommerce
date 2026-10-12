"use client";

import Link from "next/link";
import { useState } from "react";

type Item = { name: string; slug: string; inWalk: boolean };

export function BrandDirectory({ brands }: { brands: Item[] }) {
  const [q, setQ] = useState("");
  const list = brands.filter((b) => b.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <label className="sr-only" htmlFor="brand-q">
        Chercher une marque
      </label>
      <input id="brand-q" className="dir-search" type="search" placeholder="Chercher une marque" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length === 0 && <p className="empty">Aucune marque ne correspond à « {q} ».</p>}
      <div style={{ maxWidth: 760 }}>
        {list.map((b, i) => {
          const letter = b.name[0].toUpperCase();
          const head = i === 0 || list[i - 1].name[0].toUpperCase() !== letter ? letter : null;
          return (
            <div key={b.slug}>
              {head && <p className="letter">{head}</p>}
              <div className="brand-row">
                <Link className="go" href={`/marques/${b.slug}`}>
                  <strong>{b.name}</strong>
                  <span>Voir la boutique</span>
                </Link>
                <Link className="chip" href={`/walk/${b.slug}`}>
                  Dans le mall
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
