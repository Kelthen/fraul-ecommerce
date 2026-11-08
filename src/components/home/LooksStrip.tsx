"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Product } from "@/lib/catalog";
import { Price } from "../Price";

// Défilé de looks de l'accueil : on fait glisser, on touche un look, ses pièces s'ouvrent dans un volet par le bas.

type ShownLook = { id: string; title: string; photo?: string; items: Product[] };

export function LooksStrip({ looks }: { looks: ShownLook[] }) {
  const sheet = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<ShownLook | null>(null);
  const show = (l: ShownLook) => {
    setOpen(l);
    sheet.current?.showModal();
  };

  return (
    <>
      <div className="row looks">
        {looks.map((l) => (
          <button key={l.id} type="button" className="look" onClick={() => show(l)} aria-label={`Voir les pièces du look ${l.title}`}>
            <span className={l.photo ? "look-pic" : "look-pic look-stack"} style={l.photo ? undefined : { gridTemplateRows: `repeat(${l.items.length}, 1fr)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- photos du catalogue, parfois hébergées chez Supabase */}
              {l.photo ? <img src={l.photo} alt="" loading="lazy" /> : l.items.map((p) => <img key={p.slug} src={p.image.front} alt="" loading="lazy" />)}
            </span>
            <span className="nm">{l.title}</span>
            <span className="look-n">{l.items.length} pièces</span>
          </button>
        ))}
      </div>

      <dialog ref={sheet} className="f-sheet" aria-labelledby="look-title" onClick={(e) => { if (e.target === sheet.current) sheet.current?.close(); }}>
        <div className="f-panel">
          <div className="f-head">
            <h2 id="look-title">{open?.title}</h2>
            <button type="button" className="f-x" onClick={() => sheet.current?.close()} aria-label="Fermer">×</button>
          </div>
          <ul className="f-body look-items">
            {open?.items.map((p) => (
              <li key={p.slug}>
                <Link href={`/produit/${p.slug}`} className="look-item">
                  {/* eslint-disable-next-line @next/next/no-img-element -- photos du catalogue */}
                  <img src={p.image.front} alt="" />
                  <span>
                    <span className="br">{p.brandName}</span>
                    <span className="nm">{p.name}</span>
                    <span className="pr"><Price prices={p.prices} /></span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}
