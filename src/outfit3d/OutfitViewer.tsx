"use client";

// Vue 3D du mannequin. Chargée seulement quand le client touche « Voir sur le mannequin » :
// three.js n'est jamais téléchargé sur le chemin d'achat (docs/ARCHITECTURE.md).
import { useEffect, useRef, useState } from "react";
import type { WearSlot } from "@/models/outfit/slots";
import type { Worn } from "./mannequin";
import type { OutfitScene } from "./scene";

type Props = {
  worn: Worn;
  /** Emplacement à cadrer (null = vue d'ensemble) ; `focusKey` change à chaque demande, même répétée. */
  focus: WearSlot | null;
  focusKey: number;
  onOverview: () => void;
  onUnavailable: () => void;
};

export default function OutfitViewer({ worn, focus, focusKey, onOverview, onUnavailable }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OutfitScene | null>(null);
  const [ready, setReady] = useState(false);
  const latest = useRef({ worn, focus });
  useEffect(() => { latest.current = { worn, focus }; }, [worn, focus]);

  useEffect(() => {
    let alive = true;
    const el = host.current;
    if (!el) return;
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) {
      onUnavailable();
      return;
    }
    Promise.all([import("three"), import("./scene")])
      .then(([THREE, { createOutfitScene }]) => {
        if (!alive) return;
        const s = createOutfitScene(THREE, el);
        s.dress(latest.current.worn);
        s.focus(latest.current.focus);
        sceneRef.current = s;
        setReady(true);
      })
      .catch(onUnavailable);
    return () => {
      alive = false;
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  }, [onUnavailable]);

  useEffect(() => { sceneRef.current?.dress(worn); }, [worn]);
  useEffect(() => { sceneRef.current?.focus(focus); }, [focus, focusKey]);

  return (
    <div className="outfit-3d" ref={host} data-ready={ready || undefined}>
      {!ready && <p className="outfit-3d-wait">Chargement du mannequin…</p>}
      <div className="outfit-3d-bar">
        <span>{ready ? "Glisse pour tourner · pince pour zoomer" : ""}</span>
        <button type="button" className="pill line sm" onClick={onOverview}>Vue d&apos;ensemble</button>
      </div>
    </div>
  );
}
