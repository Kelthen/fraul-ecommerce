"use client";

import { useState } from "react";

type Props = { name: string; image: { front: string; back?: string; details?: string[] } };

/** Photos d'un produit : face, dos, détails. Miniatures pour changer de vue ; toucher la photo l'ouvre en grand. */
export function ProductPhotos({ name, image }: Props) {
  const views = [
    { src: image.front, label: "Face" },
    ...(image.back ? [{ src: image.back, label: "Dos" }] : []),
    ...(image.details ?? []).map((src) => ({ src, label: "Détail" })),
  ];
  const [k, setK] = useState(0);
  const v = views[k];
  return (
    <div className="pdp-photos">
      <a className="pdp-stage photo" href={v.src} target="_blank" rel="noopener" aria-label={`${name}, vue ${v.label.toLowerCase()} : ouvrir en grand`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- captures du fournisseur, test de rendu avant détourage */}
        <img key={v.src} className="flip" src={v.src} alt={`${name}, vue ${v.label.toLowerCase()}`} />
      </a>
      {views.length > 1 && (
        <div className="thumbs" role="group" aria-label="Vues de l'article">
          {views.map((x, i) => (
            <button key={x.src} type="button" aria-pressed={i === k} aria-label={x.label} onClick={() => setK(i)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- miniature */}
              <img src={x.src} alt="" loading="lazy" />
              <span>{x.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
