"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Product } from "@/lib/catalog";
import { Price } from "../Price";

// Défilé de looks de l'accueil (retours de Rhamone du 8 nov., docs/ACCUEIL-LOOKS.md) : mannequins détourés posés
// sur le fond du site (aucun cadre), en file du plus petit au plus grand :
// le personnage du centre en entier et en grand, les autres en profondeur. Glisser (ou flèches) amène le suivant
// au centre ; toucher le personnage du centre ouvre ses pièces (volet par le bas au téléphone, à côté sur ordinateur).

const WIDE = "(min-width: 900px)";

type ShownLook = { id: string; title: string; photo?: string; items: Product[] };

export function LooksStrip({ looks }: { looks: ShownLook[] }) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  // Grand écran : la file prend toute la largeur (Rhamone, 8 nov. : « utilise la grandeur de l'écran »).
  const wide = useSyncExternalStore(
    (cb) => { const m = matchMedia(WIDE); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => matchMedia(WIDE).matches,
    () => false,
  );
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
            go(dx > 0 ? 1 : -1); // glisser vers la droite fait avancer la file
          }
        }}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}
      >
        {looks.map((l, i) => {
          // File « barres de réseau » (Rhamone, 8 nov., #103) : le look choisi est le plus grand, à droite ;
          // les suivants attendent à sa gauche, de plus en plus petits. « Suivant » fait avancer la file vers la droite.
          const rank = (i - idx + n) % n; // 0 : choisi ; 1, 2, 3 : les suivants ; le dernier vient de sortir à droite
          const leaving = rank === n - 1 && n > 5;
          const far = leaving ? 0 : Math.min(rank, 5);
          const center = rank === 0;
          // 5 personnes à la fois sur ordinateur, 4 au téléphone (Rhamone, 8 nov. : à 5, « trop serré »).
          const X = (wide ? [146, 36, -60, -137, -199, -240] : [40, -24, -66, -96, -125, -150])[far] + (leaving ? 90 : 0);
          return (
            <button
              key={l.id}
              type="button"
              className={center ? "looker is-center" : "looker"}
              style={{
                transform: `translateX(calc(-50% + ${X}%)) scale(${leaving ? 1.05 : (wide ? [1, 0.82, 0.66, 0.53, 0.43, 0.35] : [1, 0.64, 0.46, 0.34, 0.26, 0.2])[far]})`,
                // Flou de profondeur : plus le personnage est petit (loin), plus il est flou (Rhamone, 8 nov. : « air chic »).
                filter: far ? `blur(${[0, 0.6, 1.3, 2.1, 3, 3.6][far]}px) saturate(${1 - far * 0.08})` : undefined,
                transitionDelay: `${(leaving ? 0 : far) * 70}ms`, // la file avance l'un après l'autre
                zIndex: leaving ? 11 : 10 - far,
                opacity: leaving || far > (wide ? 4 : 3) ? 0 : 1,
                pointerEvents: leaving || far > (wide ? 4 : 3) ? "none" : undefined,
              }}
              onClick={() => {
                if (swiped.current) return;
                if (center) setOpen(true);
                else setIdx(i);
              }}
              aria-label={center ? `Voir les pièces du look ${l.title}` : `Amener le look ${l.title} au premier plan`}
              tabIndex={far > 1 ? -1 : 0}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- photos des looks, déjà réduites */}
              <img src={l.photo ?? l.items[0].image.front} alt="" draggable={false} style={{ animationName: idx % 2 ? "look-step-a" : "look-step-b" }} loading={far > 1 ? "lazy" : "eager"} />
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
