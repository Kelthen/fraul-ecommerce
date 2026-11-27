"use client";

import { useEffect } from "react";

/**
 * Animations de l'accueil au défilement (Rhamone, 15 nov. : « le site faut que ce soit vivant » ; les 7 propositions
 * validées). Remplace l'ancienne animation CSS « au défilement », que Safari sur iPhone ne gère pas.
 *
 * Un seul observateur de visibilité pour toute la page : chaque bloc s'anime UNE fois quand il entre à l'écran, avec
 * seulement des déplacements et de l'opacité (fluide au téléphone). Rien ne bouge si l'appareil demande moins
 * d'animations ; si ce script ne se charge pas, tout reste simplement visible (le masquage n'existe qu'avec la classe
 * `mo` posée ici). Aucune donnée, aucun appel réseau.
 */
const BLOCKS: [string, string][] = [
  [".mall-copy .wrap", "rise"], // entrée du mall : le texte monte ligne par ligne
  [".sec .head", "head"], // titres : trait bordeaux qui se dessine, titre qui monte
  [".perks ul", "pop"], // engagements : une icône après l'autre, petit rebond
  ["#nouveautes .row", "cascade"], // nouveautés : une pièce après l'autre, depuis la droite
  ["#selection .grid", "grid"], // à ne pas manquer : colonnes depuis la gauche, le bas, la droite
  [".bgrid", "flip"], // marques : les tuiles se retournent l'une après l'autre
  [".how-row", "steps"], // comment ça marche : étapes dans l'ordre, numéros qui comptent
];

export default function HomeMotion() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    const timers: number[] = [];

    const countUp = (el: HTMLElement) => {
      el.querySelectorAll<HTMLElement>(".how-n").forEach((n, i) => {
        const end = Number(n.textContent) || 0;
        let v = 0;
        n.textContent = "00";
        const tick = () => {
          v += 1;
          n.textContent = String(Math.min(v, end)).padStart(2, "0");
          if (v < end) timers.push(window.setTimeout(tick, 90));
        };
        timers.push(window.setTimeout(tick, 250 + i * 140));
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          el.classList.add("mo-in");
          if (el.dataset.mo === "steps") countUp(el);
          // Une fois arrivés, les éléments retrouvent leurs propres transitions (survol des cartes, etc.).
          timers.push(window.setTimeout(() => el.classList.add("mo-done"), 2600));
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    root.classList.add("mo");
    for (const [sel, kind] of BLOCKS) {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        el.dataset.mo = kind;
        const kids = Array.from(el.children) as HTMLElement[];
        kids.forEach((c, i) => c.style.setProperty("--i", String(Math.min(i, 10))));
        if (kind === "grid") {
          // Colonne de chaque pièce : gauche → depuis la gauche, droite → depuis la droite, milieu → depuis le bas.
          const cols = [...new Set(kids.map((c) => c.offsetLeft))].sort((a, b) => a - b);
          kids.forEach((c) => {
            const k = cols.indexOf(c.offsetLeft);
            const side = k === 0 ? -1 : k === cols.length - 1 ? 1 : 0;
            c.style.setProperty("--dx", `${side * 44}px`);
            c.style.setProperty("--dy", side ? "10px" : "44px");
          });
        }
        io.observe(el);
      });
    }

    // Entrée du mall : la rangée de façades avance doucement pendant qu'on défile (profondeur), calculée au plus une
    // fois par image et seulement quand la scène est à l'écran.
    const scene = document.querySelector<HTMLElement>(".mall-scene");
    let raf = 0;
    const onScroll = () => {
      if (!scene || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = scene.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
        scene.style.transform = `translateY(${(p * 40).toFixed(1)}px) scale(${(1 + p * 0.06).toFixed(3)})`;
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      io.disconnect();
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      root.classList.remove("mo");
      if (scene) scene.style.transform = "";
    };
  }, []);

  return null;
}
