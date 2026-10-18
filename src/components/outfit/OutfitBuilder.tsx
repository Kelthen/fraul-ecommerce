"use client";

// « Crée ta tenue » : la liste des pièces marche toujours (même sans 3D) ; le mannequin 3D se charge
// à la demande et zoome sur la pièce choisie. Règles : src/models/outfit/slots.ts ; zooms : camera.ts.
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import { pick, visibleSlots, type Outfit, type WearSlot } from "@/models/outfit/slots";
import type { Worn } from "@/outfit3d/mannequin";
import { Price, PriceNote } from "../Price";
import { useCart } from "../CartProvider";
import { GarmentArt } from "../GarmentArt";
import { ProductPhotos } from "../ProductPhotos";

const OutfitViewer = dynamic(() => import("@/outfit3d/OutfitViewer"), { ssr: false });

type Pieces = Record<WearSlot, Product[]>;

/** Tenue de départ : un haut, un bas et une paire, pour que le mannequin ne soit pas vide. */
const START: WearSlot[] = ["top", "bottom", "shoes"];

export function OutfitBuilder({ pieces }: { pieces: Pieces }) {
  const { add } = useCart();
  const all = useMemo(() => new Map(Object.values(pieces).flat().map((p) => [p.slug, p])), [pieces]);
  const catOf = useCallback((slug: string) => all.get(slug)?.category, [all]);
  const [outfit, setOutfit] = useState<Outfit>(() => Object.fromEntries(START.map((s) => [s, pieces[s][0]?.slug])));
  const [tab, setTab] = useState<WearSlot>("top");
  /** Grande zone : la vraie photo de la pièce (par défaut) ou le mannequin 3D (chargé au premier clic). */
  const [stage, setStage] = useState<"photo" | "3d">("photo");
  const [view3d, setView3d] = useState<"off" | "on" | "unavailable">("off");
  const [focus, setFocus] = useState<{ slot: WearSlot | null; key: number }>({ slot: null, key: 0 });
  const zoomTo = (slot: WearSlot | null) => setFocus((f) => ({ slot, key: f.key + 1 }));
  const unavailable = useCallback(() => { setView3d("unavailable"); setStage("photo"); }, []);

  const slots = visibleSlots(outfit, catOf);
  const chosen = slots.map((s) => ({ slot: s, product: outfit[s.id] ? all.get(outfit[s.id]!) : undefined }));
  const wornProducts = chosen.flatMap((c) => (c.product ? [c.product] : []));
  const worn: Worn = useMemo(
    () => Object.fromEntries(Object.entries(outfit).flatMap(([s, slug]) => { const p = all.get(slug!); return p ? [[s, { category: p.category, color: p.color }]] : []; })),
    [outfit, all],
  );
  const current = outfit[tab] ? all.get(outfit[tab]!) : undefined;

  // Toucher une pièce montre sa vraie photo en grand ; « Mannequin 3D » montre la tenue, cadrée sur cette pièce.
  // Toucher une pièce déjà portée la montre seulement ; on la retire avec « Retirer ».
  function choose(slug: string) {
    if (outfit[tab] !== slug) setOutfit((o) => pick(o, tab, slug, catOf));
    setStage("photo");
    zoomTo(tab);
  }
  function show3d() {
    setView3d((v) => (v === "off" ? "on" : v));
    setStage("3d");
    zoomTo(tab);
  }
  function openTab(slot: WearSlot) {
    setTab(slot);
    zoomTo(slot);
  }

  return (
    <div className="outfit">
      <div className="outfit-left">
        <div className="outfit-switch" role="group" aria-label="Affichage">
          <button type="button" aria-pressed={stage === "photo"} onClick={() => setStage("photo")}>Photo</button>
          <button type="button" aria-pressed={stage === "3d"} disabled={view3d === "unavailable"} onClick={show3d}>Mannequin 3D</button>
        </div>
        {view3d === "on" && (
          <div hidden={stage !== "3d"}>
            <OutfitViewer worn={worn} focus={focus.slot} focusKey={focus.key} onOverview={() => zoomTo(null)} onUnavailable={unavailable} />
          </div>
        )}
        {stage === "photo" &&
          (current?.image ? (
            <ProductPhotos key={current.slug} name={current.name} image={current.image} />
          ) : (
            <div className="outfit-flat">
              {current ? <GarmentArt type={current.category} color={current.color} accent={current.accent} className="outfit-art" /> : <Silhouette outfit={outfit} all={all} />}
              {!current && <p className="muted" style={{ fontSize: 13 }}>Choisis une pièce pour la voir ici.</p>}
            </div>
          ))}
        {view3d === "unavailable" && (
          <p className="muted" style={{ fontSize: 13 }}>La 3D n&apos;est pas disponible sur cet appareil : les photos et la liste suffisent pour composer et acheter.</p>
        )}
        {current && (
          <div className={stage === "3d" ? "outfit-card" : "outfit-card text"}>
            {stage === "3d" && (
              <div className={current.image ? "pic photo" : "pic"}>
                {current.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- captures du fournisseur, test de rendu
                  <img src={current.image.front} alt="" />
                ) : (
                  <GarmentArt type={current.category} color={current.color} accent={current.accent} />
                )}
              </div>
            )}
            <div>
              <span className="eyebrow">{slots.find((s) => s.id === tab)?.label}</span>
              <b>{current.brandName} · {current.name}</b>
              <Price cost={current.cost} />
            </div>
            <button type="button" className="link outfit-remove" onClick={() => setOutfit((o) => pick(o, tab, current.slug, catOf))}>
              Retirer
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="outfit-slotbar" role="tablist" aria-label="Emplacements de la tenue">
          {slots.map((s) => {
            const p = outfit[s.id] ? all.get(outfit[s.id]!) : undefined;
            return (
              <button key={s.id} type="button" role="tab" aria-selected={tab === s.id} className="oslot" onClick={() => openTab(s.id)}>
                <span>{s.label}</span>
                <b>{p ? p.brandName : "Vide"}</b>
              </button>
            );
          })}
        </div>
        <div className="pieces" role="tabpanel" aria-label={slots.find((s) => s.id === tab)?.label}>
          {pieces[tab].map((p) => (
            <button key={p.slug} type="button" className="piece" aria-pressed={outfit[tab] === p.slug} aria-label={`${p.brandName} ${p.name}`} onClick={() => choose(p.slug)}>
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniature photo
                <img src={p.image.front} alt="" loading="lazy" />
              ) : (
                <GarmentArt type={p.category} color={p.color} accent={p.accent} />
              )}
            </button>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          Touche une pièce pour la voir en photo et l&apos;ajouter à ta tenue.{tab === "bottom" ? " Avec un short, les chaussettes apparaissent." : ""}
        </p>

        <div className="outfit-total">
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }} className="muted">
            <span>{wornProducts.length} pièce{wornProducts.length > 1 ? "s" : ""} · tailles à choisir au panier</span>
            <span>{wornProducts.length > 0 && <Price costs={wornProducts} />}</span>
          </div>
          <button
            className="pill ink"
            type="button"
            disabled={wornProducts.length === 0}
            onClick={() => wornProducts.forEach((p) => add({ slug: p.slug, name: p.name, brandName: p.brandName, category: p.category, color: p.color, accent: p.accent, cost: p.cost, sizes: p.sizes }))}
          >
            Tout ajouter au panier
          </button>
          <PriceNote />
        </div>
      </div>
    </div>
  );
}

/** Silhouette 2D (sans 3D) : montre les couleurs du haut, du bas et des chaussures. */
function Silhouette({ outfit, all }: { outfit: Outfit; all: Map<string, Product> }) {
  const col = (s: WearSlot, fallback: string) => (outfit[s] ? all.get(outfit[s]!)?.color : undefined) ?? fallback;
  const top = col("layer", col("top", "#FFFEF7"));
  const short = outfit.bottom && all.get(outfit.bottom)?.category === "shorts";
  return (
    <svg role="img" aria-label="Aperçu de la tenue" viewBox="0 0 120 260" className="outfit-sil">
      <ellipse cx="60" cy="18" rx="13" ry="16" fill={col("cap", "#FFFEF7")} />
      <path d="M53 32 L67 32 L66 42 L54 42 Z" fill="#FFFEF7" />
      <path d="M30 46 Q60 38 90 46 L104 92 L94 96 L86 70 L86 128 L34 128 L34 70 L26 96 L16 92 Z" fill={top} stroke="rgba(10,10,12,0.25)" />
      <path d="M34 128 L86 128 L90 226 L66 226 L60 152 L54 226 L30 226 Z" fill="#FFFEF7" stroke="rgba(10,10,12,0.15)" />
      <path d={short ? "M34 128 L86 128 L88 176 L64 176 L60 152 L56 176 L32 176 Z" : "M34 128 L86 128 L90 226 L66 226 L60 152 L54 226 L30 226 Z"} fill={col("bottom", "#FFFEF7")} stroke="rgba(10,10,12,0.25)" />
      <path d="M26 226 L56 226 L58 240 L18 240 Q16 230 26 226 Z M64 226 L94 226 Q104 230 102 240 L62 240 Z" fill={col("shoes", "#FFFEF7")} stroke="rgba(10,10,12,0.3)" />
      <ellipse cx="60" cy="250" rx="52" ry="7" fill="rgba(10,10,12,0.12)" />
    </svg>
  );
}
