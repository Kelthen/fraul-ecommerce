"use client";

import Link from "next/link";

/** Nombre d'articles qui remplissent le sac jusqu'en haut. */
const FULL = 5;

/**
 * Sac de shopping du Walk : il se remplit à chaque article ajouté et sautille ; le toucher ouvre le panier.
 * Toujours visible, dans le mall comme dans les boutiques.
 */
export function Bag({ count }: { count: number }) {
  const level = Math.min(count, FULL) / FULL;
  const fillH = 13 * level;
  return (
    <Link className="bag-chip" href="/panier" aria-label={`Mon sac, ${count} article${count > 1 ? "s" : ""}`}>
      {/* key = count : l'animation repart à chaque ajout */}
      <svg key={count} className={count ? "bag-ico bump" : "bag-ico"} viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <clipPath id="bagClip">
            <path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z" />
          </clipPath>
        </defs>
        <rect className="bag-fill" x="4" y={21 - fillH} width="16" height={fillH} clipPath="url(#bagClip)" />
        <path className="bag-line" d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z" />
        <path className="bag-line" d="M9 10V6.5a3 3 0 0 1 6 0V10" />
      </svg>
      <span className="bag-n">{count}</span>
    </Link>
  );
}
