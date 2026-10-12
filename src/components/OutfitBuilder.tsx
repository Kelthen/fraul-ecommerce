"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";
import { GarmentArt } from "./GarmentArt";

type Slot = "top" | "bottom" | "shoes";
const LABELS: Record<Slot, string> = { top: "Hauts", bottom: "Bas", shoes: "Chaussures" };
const HINTS: Record<Slot, string> = {
  top: "Touche un haut pour l'essayer sur le mannequin.",
  bottom: "Touche un bas pour l'essayer.",
  shoes: "Touche une paire pour l'essayer.",
};

export function OutfitBuilder({ pieces }: { pieces: Record<Slot, Product[]> }) {
  const { add } = useCart();
  const [tab, setTab] = useState<Slot>("top");
  const [pick, setPick] = useState<Record<Slot, number>>({ top: 0, bottom: 0, shoes: 0 });
  const t = pieces.top[pick.top], b = pieces.bottom[pick.bottom], s = pieces.shoes[pick.shoes];
  const total = t.price + b.price + s.price;

  return (
    <div className="outfit">
      <div className="outfit-stage">
        <div className="outfit-model">
          <svg role="img" aria-label={`Mannequin portant : ${t.name}, ${b.name}, ${s.name}`} viewBox="0 0 120 260">
            <ellipse cx="60" cy="18" rx="13" ry="16" fill="#FFFEF7" />
            <path d="M53 32 L67 32 L66 42 L54 42 Z" fill="#FFFEF7" />
            <path d="M30 46 Q60 38 90 46 L104 92 L94 96 L86 70 L86 128 L34 128 L34 70 L26 96 L16 92 Z" fill={t.color} stroke="rgba(10,10,12,0.25)" />
            <path d="M34 128 L86 128 L90 226 L66 226 L60 152 L54 226 L30 226 Z" fill={b.color} stroke="rgba(10,10,12,0.25)" />
            <path d="M26 226 L56 226 L58 240 L18 240 Q16 230 26 226 Z M64 226 L94 226 Q104 230 102 240 L62 240 Z" fill={s.color} stroke="rgba(10,10,12,0.3)" />
            <ellipse cx="60" cy="250" rx="52" ry="7" fill="rgba(10,10,12,0.12)" />
          </svg>
        </div>
        <div className="outfit-slots">
          <div><span>HAUT</span><b>{t.brandName} · {t.name}</b></div>
          <div><span>BAS</span><b>{b.brandName} · {b.name}</b></div>
          <div><span>CHAUSSURES</span><b>{s.brandName} · {s.name}</b></div>
        </div>
      </div>

      <div>
        <div className="tabs" role="tablist" aria-label="Type de pièce">
          {(Object.keys(LABELS) as Slot[]).map((k) => (
            <button key={k} type="button" role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
              {LABELS[k]}
            </button>
          ))}
        </div>
        <div className="pieces" role="tabpanel" aria-label={LABELS[tab]}>
          {pieces[tab].map((p, i) => (
            <button key={p.slug} type="button" className="piece" aria-pressed={pick[tab] === i} aria-label={`${p.brandName} ${p.name}`} onClick={() => setPick({ ...pick, [tab]: i })}>
              <GarmentArt type={p.category} color={p.color} accent={p.accent} />
            </button>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>{HINTS[tab]}</p>

        <div className="outfit-total">
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }} className="muted">
            <span>3 pièces · tailles à choisir au panier</span>
            <span>{formatPrice(total)}</span>
          </div>
          <button
            className="pill ink"
            type="button"
            onClick={() => [t, b, s].forEach((p) => add({ slug: p.slug, name: p.name, brandName: p.brandName, category: p.category, color: p.color, accent: p.accent, price: p.price, sizes: p.sizes }))}
          >
            Ajouter la tenue au panier
          </button>
        </div>
      </div>
    </div>
  );
}
