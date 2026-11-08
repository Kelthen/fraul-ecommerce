"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/catalog";
import { Price } from "../Price";

// Défilé de looks de l'accueil (retours de Rhamone du 8 nov., docs/ACCUEIL-LOOKS.md) : mannequins détourés posés
// sur le fond du site (aucun cadre), effet de profondeur 3D :
// le personnage du centre en entier et en grand, les autres en profondeur. Glisser (ou flèches) amène le suivant
// au centre ; toucher le personnage du centre ouvre ses pièces (volet par le bas au téléphone, à côté sur ordinateur).

type ShownLook = { id: string; title: string; photo?: string; items: Product[] };

export function LooksStrip({ looks }: { looks: ShownLook[] }) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null);
  const start = useRef<number | null>(null);
  const swiped = useRef(false);
  const n = looks.length;
  const go = (d: number) => setIdx((i) => (i + d + n) % n);
  const look = looks[idx];

  // Téléphone : volet par le bas. Ordinateur : la liste reste à côté de la scène (pas de volet).
  useEffect(() => {
    const d = sheet.current;
    if (!d) return;
    const small = window.matchMedia("(max-width: 899px)").matches;
    if (open && small && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const pieces = (
    <ul className="look-items">
      {look.items.map((p) => (
        <li key={p.slug}>
          <Link href={`/produit/${p.slug}`} className="look-item">
            {/* eslint-disable-next-line @next/next/no-img-element -- photos du catalogue */}
            <img src={p.image.front} alt="" loading="lazy" />
            <span>
              <span className="br">{p.brandName}</span>
              <span className="nm">{p.name}</span>
              <span className="pr"><Price prices={p.prices} /></span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={open ? "looks-wrap is-open" : "looks-wrap"}>
      <div
        className="looks-scene"
        onPointerDown={(e) => { start.current = e.clientX; swiped.current = false; }}
        onPointerUp={(e) => {
          if (start.current === null) return;
          const dx = e.clientX - start.current;
          start.current = null;
          if (Math.abs(dx) > 40) {
            swiped.current = true; // le clic qui suit le geste n'ouvre pas le look
            go(dx < 0 ? 1 : -1);
          }
        }}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}
      >
        {looks.map((l, i) => {
          let off = i - idx;
          if (off > n / 2) off -= n;
          if (off < -n / 2) off += n;
          const far = Math.abs(off);
          const center = off === 0;
          return (
            <button
              key={l.id}
              type="button"
              className={center ? "looker is-center" : "looker"}
              style={{
                transform: `translateX(calc(-50% + ${Math.sign(off) * [0, 78, 128, 165][Math.min(far, 3)]}%)) rotateY(${-Math.sign(off) * Math.min(far, 2) * 9}deg) scale(${[1, 0.58, 0.43, 0.36][Math.min(far, 3)]})`,
                filter: far ? `blur(${far * 1.2}px) saturate(${1 - far * 0.12})` : undefined,
                zIndex: 10 - far,
                opacity: far > 2 ? 0 : [1, 0.9, 0.65][far],
                pointerEvents: far > 2 ? "none" : undefined,
              }}
              onClick={() => {
                if (swiped.current) return;
                if (center) setOpen(true);
                else setIdx(i);
              }}
              aria-label={center ? `Voir les pièces du look ${l.title}` : `Amener le look ${l.title} au centre`}
              tabIndex={far > 1 ? -1 : 0}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- photos des looks, déjà réduites */}
              <img src={l.photo ?? l.items[0].image.front} alt="" draggable={false} loading={far > 1 ? "lazy" : "eager"} />
            </button>
          );
        })}
      </div>

      <div className="looks-bar">
        <button type="button" className="looks-arrow" onClick={() => go(-1)} aria-label="Look précédent">←</button>
        <div className="looks-caption">
          <b>{look.title}</b>
          <button type="button" className="looks-see" onClick={() => setOpen(true)}>Voir les {look.items.length} pièces</button>
        </div>
        <button type="button" className="looks-arrow" onClick={() => go(1)} aria-label="Look suivant">→</button>
      </div>
      <div className="looks-dots" aria-hidden="true">
        {looks.map((l, i) => <span key={l.id} className={i === idx ? "on" : undefined} />)}
      </div>

      {open && (
        <aside className="looks-side" aria-label={`Pièces du look ${look.title}`}>
          <div className="f-head">
            <h3>{look.title}</h3>
            <button type="button" className="f-x" onClick={() => setOpen(false)} aria-label="Fermer">×</button>
          </div>
          {pieces}
        </aside>
      )}

      <dialog ref={sheet} className="f-sheet" aria-labelledby="look-title" onClose={() => setOpen(false)} onClick={(e) => { if (e.target === sheet.current) setOpen(false); }}>
        <div className="f-panel">
          <div className="f-head">
            <h2 id="look-title">{look.title}</h2>
            <button type="button" className="f-x" onClick={() => setOpen(false)} aria-label="Fermer">×</button>
          </div>
          <div className="f-body">{pieces}</div>
        </div>
      </dialog>
    </div>
  );
}
