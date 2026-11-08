"use client";

import { useRef, useState, type ReactNode } from "react";

/** Une vue de l'article : une photo, ou un dessin quand la photo manque. */
export type GalleryView = { label: string; src?: string; art?: ReactNode };

type Props = { name: string; views: GalleryView[]; className?: string };

const ZOOM = 2.5;

/**
 * Galerie d'un article (fiche produit et fiche en grand du Walk) : on glisse d'une vue à l'autre
 * (face, dos, détails), compteur « 1 / 3 », miniatures.
 * Toucher une photo l'affiche en grand (elle prend aussi la place des miniatures, Rhamone 8 nov.) ; toucher encore
 * zoome à cet endroit, en pleine définition ; glisser le doigt déplace la loupe ; toucher encore dézoome.
 */
export function ProductGallery({ name, views, className }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [big, setBig] = useState(false);
  const n = views.length;

  const go = (i: number) => {
    const t = track.current;
    if (!t) return;
    setZoom(null);
    t.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * t.clientWidth, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const at = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  return (
    <div className={`gal${big ? " is-big" : ""}${className ? ` ${className}` : ""}`}>
      <div className="gal-frame">
        <div
          className={`gal-track${zoom ? " zoomed" : ""}`}
          ref={track}
          onScroll={(e) => {
            const t = e.currentTarget, i = Math.round(t.scrollLeft / Math.max(1, t.clientWidth));
            if (i !== k) { setK(i); setZoom(null); }
          }}
        >
          {views.map((v, i) => (
            <div className={`gal-slide${v.src && isCut(v.src) ? " is-cut" : ""}`} key={`${v.label}-${i}`} aria-hidden={i !== k}>
              {v.src ? (
                <button
                  type="button"
                  className="gal-zoom"
                  tabIndex={i === k ? 0 : -1}
                  aria-label={zoom && i === k ? "Dézoomer" : big ? `Zoomer sur la vue ${v.label.toLowerCase()}` : `Voir en grand la vue ${v.label.toLowerCase()}`}
                  onClick={(e) => {
                    if (zoom) { setZoom(null); return; }
                    if (!big) { setBig(true); return; }
                    // Clavier : pas de position de doigt, on zoome au centre.
                    setZoom(e.detail ? at(e) : { x: 50, y: 50 });
                  }}
                  onPointerMove={(e) => { if (zoom && i === k) setZoom(at(e)); }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- captures du fournisseur, test de rendu avant détourage */}
                  <img
                    src={v.src}
                    alt={`${name}, vue ${v.label.toLowerCase()}`}
                    loading={i ? "lazy" : undefined}
                    draggable={false}
                    // Zoom en pleine définition : l'image est vraiment affichée ZOOM fois plus grande (pas un agrandissement
                    // d'une image déjà réduite, qui rendait flou sur iPhone) ; le point touché reste sous le doigt.
                    style={zoom && i === k ? { position: "absolute", maxWidth: "none", width: `${ZOOM * 100}%`, height: `${ZOOM * 100}%`, left: `${-(ZOOM - 1) * zoom.x}%`, top: `${-(ZOOM - 1) * zoom.y}%` } : undefined}
                  />
                </button>
              ) : (
                v.art
              )}
            </div>
          ))}
        </div>
        {n > 1 && (
          <>
            <span className="gal-count" aria-live="polite">{k + 1} / {n}</span>
            <button className="gal-arrow l" type="button" aria-label="Vue précédente" disabled={k === 0} onClick={() => go(k - 1)}>‹</button>
            <button className="gal-arrow r" type="button" aria-label="Vue suivante" disabled={k === n - 1} onClick={() => go(k + 1)}>›</button>
          </>
        )}
        {views[k]?.src && <span className="gal-hint" aria-hidden="true">{zoom ? "Touche pour dézoomer" : big ? "Touche pour zoomer" : "Touche pour agrandir"}</span>}
        {big && (
          <button type="button" className="gal-shrink" aria-label="Réduire la photo" onClick={() => { setZoom(null); setBig(false); }}>×</button>
        )}
      </div>
      {n > 1 && !big && (
        <div className="thumbs" role="group" aria-label="Vues de l'article">
          {views.map((v, i) => (
            <button key={`${v.label}-${i}`} type="button" aria-pressed={i === k} aria-label={v.label} onClick={() => go(i)}>
              {v.src ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniature
                <img src={v.src} alt="" loading="lazy" />
              ) : (
                <span className="thumb-art">{v.art}</span>
              )}
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Photo détourée (dossier « detoure » du stockage, rempli par le détourage automatique). */
const isCut = (src: string) => src.includes("/produits/detoure/");

/** Vues d'un article à partir de ses photos : face, dos, puis autant de détails qu'il y en a (numérotés s'il y en a plusieurs). */
export function photoViews(image: { front: string; back?: string; details?: string[]; cut?: { front?: string; back?: string } }): GalleryView[] {
  const details = image.details ?? [];
  return [
    // Face et dos détourés quand c'est possible : l'article seul, sur le fond du site (Rhamone, 8 nov. : « deux couleurs
    // différentes cassent le mood, l'article doit être mis en valeur »).
    { src: image.cut?.front ?? image.front, label: "Face" },
    ...(image.back ? [{ src: image.cut?.back ?? image.back, label: "Dos" }] : []),
    ...details.map((src, i) => ({ src, label: details.length > 1 ? `Détail ${i + 1}` : "Détail" })),
  ];
}
