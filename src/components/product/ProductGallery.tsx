"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Une vue de l'article : une photo, ou un dessin quand la photo manque. */
export type GalleryView = { label: string; src?: string; art?: ReactNode };

type Props = { name: string; views: GalleryView[]; className?: string };

const ZOOM = 2.5, MAX = 4;

/** Zoom d'une photo : échelle s (1 = normal) et position (x, y) du coin haut-gauche de l'image dans son cadre, en pixels. */
type View = { s: number; x: number; y: number };
const NONE: View = { s: 1, x: 0, y: 0 };

/** Garde l'image agrandie dans son cadre (w × h) : pas de bord vide qui apparaît en la déplaçant. */
const clampView = (v: View, w: number, h: number): View => {
  const s = Math.min(MAX, Math.max(1, v.s));
  return { s, x: Math.min(0, Math.max(w - s * w, v.x)), y: Math.min(0, Math.max(h - s * h, v.y)) };
};

/**
 * Galerie d'un article (fiche produit et fiche en grand du Walk) : on glisse d'une vue à l'autre
 * (face, dos, détails), compteur « 1 / 3 », miniatures.
 * Toucher une photo l'affiche en grand (elle prend aussi la place des miniatures, Rhamone 8 nov.) ; toucher encore
 * zoome à cet endroit ; toucher encore dézoome.
 * Au téléphone, on zoome en écartant deux doigts et on dézoome en les rapprochant (×4 au plus), un doigt déplace la
 * photo zoomée (Rhamone, 9 nov.). Le zoom du navigateur est bloqué sur la photo : agrandir toute la page avec la 3D
 * du Walk derrière faisait planter le navigateur du téléphone (vidéo de Rhamone du 8 nov.).
 * Pendant le geste, l'image glisse (transformation, fluide) ; au lâcher, elle est réellement affichée à la nouvelle
 * taille, en pleine définition (un agrandissement d'image réduite rendait flou sur iPhone).
 */
export function ProductGallery({ name, views, className }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  const [view, setView] = useState<View>(NONE);
  const [big, setBig] = useState(false);
  const n = views.length;
  const zoom = view.s > 1;
  // Vue en cours pendant un geste (sans redessiner la page à chaque mouvement) et vue de départ du geste.
  const live = useRef<{ img: HTMLImageElement | null; box: DOMRect | null; base: View; cur: View; d0: number; m0: [number, number]; moved: boolean }>({ img: null, box: null, base: NONE, cur: NONE, d0: 0, m0: [0, 0], moved: false });
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);

  const go = (i: number) => {
    const t = track.current;
    if (!t) return;
    setView(NONE);
    t.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * t.clientWidth, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  // Gestes à deux doigts (et à un doigt une fois zoomé) : écouteurs natifs non passifs pour bloquer le zoom de la page.
  useEffect(() => {
    const t = track.current;
    if (!t) return;
    const L = live.current;
    const pts = (e: TouchEvent, r: DOMRect) => Array.from(e.touches).map((p) => [p.clientX - r.left, p.clientY - r.top] as [number, number]);
    const show = (v: View) => {
      L.cur = v;
      if (L.img) L.img.style.transform = `translate(${v.x - L.base.x}px, ${v.y - L.base.y}px) scale(${v.s / L.base.s})`;
    };
    const start = (e: TouchEvent) => {
      const slide = (e.target as HTMLElement).closest(".gal-zoom");
      const img = slide?.querySelector("img");
      if (!slide || !img) return;
      if (e.touches.length < 2 && viewRef.current.s <= 1) return; // un doigt sans zoom : on laisse glisser d'une vue à l'autre
      e.preventDefault();
      const r = slide.getBoundingClientRect(), p = pts(e, r);
      L.img = img; L.box = r; L.base = viewRef.current; L.cur = L.base; L.moved = true;
      img.style.transformOrigin = "0 0";
      L.m0 = p.length > 1 ? [(p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2] : p[0];
      L.d0 = p.length > 1 ? Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]) : 0;
      L.base = { ...L.cur };
    };
    const move = (e: TouchEvent) => {
      if (!L.img || !L.box) return;
      e.preventDefault();
      const r = L.box, p = pts(e, r), b = L.base;
      if (p.length > 1) {
        if (!L.d0) { // deuxième doigt posé en cours de route : on repart de là
          L.base = { ...L.cur }; L.m0 = [(p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2]; L.d0 = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]); return;
        }
        const m: [number, number] = [(p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2], d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]);
        const s = Math.min(MAX, Math.max(1, (b.s * d) / L.d0));
        // Le point de la photo qui était sous les doigts reste sous les doigts.
        const px = (L.m0[0] - b.x) / b.s, py = (L.m0[1] - b.y) / b.s;
        show(clampView({ s, x: m[0] - px * s, y: m[1] - py * s }, r.width, r.height));
      } else if (p.length === 1 && b.s > 1) {
        if (L.d0) { L.base = { ...L.cur }; L.m0 = p[0]; L.d0 = 0; return; } // un doigt levé : on continue à déplacer
        show(clampView({ ...b, x: b.x + p[0][0] - L.m0[0], y: b.y + p[0][1] - L.m0[1] }, r.width, r.height));
      }
    };
    const end = (e: TouchEvent) => {
      if (!L.img || e.touches.length) return;
      const v = L.cur.s < 1.05 ? NONE : L.cur;
      L.img.style.transform = "";
      L.img = null;
      setView(v);
      setTimeout(() => { L.moved = false; }, 350); // pas de « toucher » parasite juste après un pincement
    };
    const noGesture = (e: Event) => e.preventDefault(); // Safari : pincement natif de la page
    t.addEventListener("gesturestart", noGesture);
    t.addEventListener("touchstart", start, { passive: false });
    t.addEventListener("touchmove", move, { passive: false });
    t.addEventListener("touchend", end);
    t.addEventListener("touchcancel", end);
    return () => { t.removeEventListener("gesturestart", noGesture); t.removeEventListener("touchstart", start); t.removeEventListener("touchmove", move); t.removeEventListener("touchend", end); t.removeEventListener("touchcancel", end); };
  }, []);

  /** Zoom ×2,5 au point touché (ou au centre au clavier). */
  const zoomAt = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const [mx, my] = e.detail ? [e.clientX - r.left, e.clientY - r.top] : [r.width / 2, r.height / 2];
    setView(clampView({ s: ZOOM, x: mx - mx * ZOOM, y: my - my * ZOOM }, r.width, r.height));
  };

  return (
    <div className={`gal${big ? " is-big" : ""}${className ? ` ${className}` : ""}`}>
      <div className="gal-frame">
        <div
          className={`gal-track${zoom ? " zoomed" : ""}`}
          ref={track}
          onScroll={(e) => {
            const t = e.currentTarget, i = Math.round(t.scrollLeft / Math.max(1, t.clientWidth));
            if (i !== k) { setK(i); setView(NONE); }
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
                    if (live.current.moved) return; // fin d'un pincement, pas un toucher
                    if (zoom) { setView(NONE); return; }
                    if (!big) { setBig(true); return; }
                    zoomAt(e);
                  }}
                  onPointerMove={(e) => {
                    // À la souris, la loupe suit le pointeur (au doigt, on déplace la photo en la faisant glisser).
                    if (!zoom || i !== k || e.pointerType !== "mouse") return;
                    const r = e.currentTarget.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
                    setView(clampView({ s: view.s, x: -(view.s - 1) * r.width * fx, y: -(view.s - 1) * r.height * fy }, r.width, r.height));
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- captures du fournisseur, test de rendu avant détourage */}
                  <img
                    src={v.src}
                    alt={`${name}, vue ${v.label.toLowerCase()}`}
                    loading={i ? "lazy" : undefined}
                    draggable={false}
                    // Zoom en pleine définition : l'image est vraiment affichée s fois plus grande (pas un agrandissement
                    // d'une image déjà réduite, qui rendait flou sur iPhone).
                    style={zoom && i === k ? { position: "absolute", maxWidth: "none", width: `${view.s * 100}%`, height: `${view.s * 100}%`, left: `${view.x}px`, top: `${view.y}px` } : undefined}
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
          <button type="button" className="gal-shrink" aria-label="Réduire la photo" onClick={() => { setView(NONE); setBig(false); }}>×</button>
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
