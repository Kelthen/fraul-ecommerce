"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Rangée qui défile toute seule vers la gauche, sans fin, comme le bandeau des marques (Rhamone, 15 nov. :
 * « il faut que ça défile aussi les nouveautés »). On peut toujours la faire glisser au doigt : le défilement
 * s'arrête pendant le geste et reprend 4 s après. Les cartes sont affichées deux fois pour boucler sans saut ; la
 * deuxième copie est cachée aux lecteurs d'écran. Mouvement réduit demandé : pas de défilement automatique.
 */
export default function AutoRow({ children, speed = 28 }: { children: ReactNode; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, last = 0, pausedUntil = 0, visible = true, pos = el.scrollLeft;
    const pause = (ms = 4000) => { pausedUntil = performance.now() + ms; };
    const step = (t: number) => {
      raf = requestAnimationFrame(step);
      const dt = last ? Math.min(t - last, 100) : 0;
      last = t;
      if (!visible || t < pausedUntil) { pos = el.scrollLeft; return; }
      const half = el.scrollWidth / 2;
      pos += (speed * dt) / 1000;
      if (pos >= half) pos -= half; // la deuxième copie est identique : on revient au début sans que ça se voie
      el.scrollLeft = pos;
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.1 });
    io.observe(el);
    const onTouch = () => pause();
    const onLeave = () => pause(1200);
    el.addEventListener("pointerdown", onTouch);
    el.addEventListener("wheel", onTouch, { passive: true });
    el.addEventListener("touchstart", onTouch, { passive: true });
    el.addEventListener("focusin", () => pause(8000));
    el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") pause(1e9); });
    el.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [speed]);

  return (
    <div className="row auto-row" ref={ref}>
      {children}
      <div className="auto-row-copy" aria-hidden="true" inert>
        {children}
      </div>
    </div>
  );
}
