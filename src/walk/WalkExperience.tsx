"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/CartProvider";
import type { BrandStyle, Category, CategoryId } from "@/lib/catalog/types";
import { usePricing } from "@/components/PricingProvider";
import type { Cost } from "@/models/pricing/price";
import { startWalk } from "./engine";
import { QuickView, type FicheItem } from "./QuickView";
import { ConciergeForm } from "@/components/concierge/ConciergeForm";
import "./walk.css";

/** Article compact transmis au navigateur : [slug, nom, coût, couleur, couleurs, photos?]. */
export type WalkItem = [string, string, Cost, string, string[], FicheItem["photos"]?];

export type WalkData = {
  shops: { name: string; slug: string; style: BrandStyle }[];
  allBrands: { name: string; slug: string; style: BrandStyle }[];
  categories: Pick<Category, "id" | "label" | "sizes">[];
  /** Articles par marque puis par rayon. */
  items: Record<string, Partial<Record<CategoryId, WalkItem[]>>>;
};

type Props = { data: WalkData; startBrand?: string };

const ACCENT_DARK = ["#141416", "#202833", "#2B2A2C", "#420A0D", "#680209", "#6B6766", "#0A0A0C"];

/** Une ligne compacte → l'article complet (copie : la boutique peut le recolorer sans toucher au catalogue). */
function toItem(data: WalkData, brand: string, cat: CategoryId, [slug, n, p, c, vars, photos]: WalkItem) {
  return {
    slug, n, p, c, a: ACCENT_DARK.includes(c) ? "#EAE0C8" : "#420A0D", vars, sizes: data.categories.find((x) => x.id === cat)?.sizes ?? [], brand, cat,
    photos: photos ?? null,
    // Moteur 3D : photo de face et de dos du portant (le dos reprend la face s'il manque).
    img: photos ? [photos.front, photos.back ?? photos.front] : null,
  };
}

export function WalkExperience({ data, startBrand }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { add, count } = useCart();
  const addRef = useRef(add);
  const { price, format } = usePricing();
  const walkRef = useRef<ReturnType<typeof startWalk> | null>(null);
  const [fiche, setFiche] = useState<FicheItem | null>(null);
  const [concierge, setConcierge] = useState<{ brand: string } | null>(null);
  // Tous les articles du mall, pour les propositions sous la fiche en grand.
  const allItems = useMemo(
    () => data.allBrands.flatMap((b) => Object.entries(data.items[b.slug] ?? {}).flatMap(([cat, rows]) => rows.map((r) => toItem(data, b.name, cat as CategoryId, r)))),
    [data],
  );
  const catLabel = useCallback((cat: CategoryId) => data.categories.find((c) => c.id === cat)?.label ?? cat, [data]);
  const addItem = useCallback(
    (it: FicheItem, size?: string) => add({ slug: it.slug, name: it.n, brandName: it.brand, category: it.cat, color: it.c, accent: it.a, cost: it.p, size, sizes: it.sizes }),
    [add],
  );
  // La fiche vient de s'ouvrir ou de se fermer : le moteur remet le fond inerte et le focus à jour.
  useEffect(() => { walkRef.current?.refocus(); }, [fiche, concierge]);
  const priceRef = useRef((c: Cost) => format(price(c)));
  useEffect(() => {
    addRef.current = add;
    priceRef.current = (c: Cost) => format(price(c));
  }, [add, price, format]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const css = getComputedStyle(document.documentElement);
    const fonts = {
      sans: css.getPropertyValue("--font-sans").trim() || "Montserrat, Arial, sans-serif",
      serif: css.getPropertyValue("--font-serif").trim() || "Georgia, serif",
    };
    const brandOf = (name: string) => data.allBrands.find((b) => b.name === name);
    const shopIndex = startBrand ? data.shops.findIndex((s) => s.slug === startBrand) : -1;
    const startName = startBrand ? data.allBrands.find((b) => b.slug === startBrand)?.name : undefined;

    // ?heure=19 : voir le mall à une autre heure (essai sur la preview) ; sinon l'heure locale du visiteur.
    const hq = new URLSearchParams(location.search).get("heure");
    const hour = hq !== null && Number(hq) >= 0 && Number(hq) < 24 ? Number(hq) : undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const walk = (walkRef.current = startWalk(el, {
      shops: data.shops,
      allBrands: data.allBrands,
      categories: data.categories,
      fonts,
      formatPrice: (c: Cost) => priceRef.current(c),
      getItems: (brandName: string, cat: CategoryId) => {
        const b = brandOf(brandName);
        return (b ? data.items[b.slug]?.[cat] ?? [] : []).map((r) => toItem(data, brandName, cat, r));
      },
      onAdd: (it: { slug: string; n: string; p: Cost; c: string; a: string; brand: string; cat: string; sizes: string[] }, size?: string) =>
        addRef.current({ slug: it.slug, name: it.n, brandName: it.brand, category: it.cat, color: it.c, accent: it.a, cost: it.p, size, sizes: it.sizes }),
      onExit: () => router.push("/"),
      onFallback: (slug: string) => router.push(`/marques/${slug}`),
      onFiche: (it: FicheItem | null) => setFiche(it ? { ...it } : null),
      onConcierge: (c: { brand: string } | null) => setConcierge(c),
      hour,
      startShop: shopIndex >= 0 ? shopIndex : undefined,
      startStore: shopIndex < 0 ? startName : undefined,
    }));

    return () => {
      walk.destroy();
      walkRef.current = null;
      // Au retour sur le Walk (ex. « Fiche complète » puis retour), Next garde l'état de la page mais le moteur
      // repart de zéro : une fiche restée ouverte ne pourrait plus être fermée (Rhamone, 21 oct.). On la referme.
      setFiche(null);
      setConcierge(null);
      document.body.style.overflow = prevOverflow;
    };
  }, [data, startBrand, router]);

  return (
    <div className="fw" ref={root}>
      <div className="walk" id="walk" hidden>
        <div className="walk-track" id="walkTrack">
          <div className="stage" id="stage">
            <canvas id="gl" aria-label="Fraul Walk, promenade devant les boutiques" />
            <div className="w-top">
              {/* Icônes rondes bordeaux (choix de Rhamone, 21 oct.) : ✕ quitter, loupe chercher, sac = panier. */}
              <button className="ic" id="wQuit" type="button" aria-label="Quitter le mall">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
              <button className="ic" id="wSearch" type="button" aria-label="Chercher une marque ou une pièce">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              </button>
              <Link className="ic" href="/panier" aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
                {count > 0 && <span className="ic-n">{count}</span>}
              </Link>
            </div>
            <div className="hud">
              <div className="intro" id="intro">
                <p className="eyebrow">Fraul Walk</p>
                <h1>Le mall</h1>
                <p>Fais défiler pour avancer d&apos;une boutique à l&apos;autre. Touche une vitrine pour entrer.</p>
                <p className="scroll-hint">↓ Fais défiler pour entrer dans le mall</p>
              </div>
              <div className="outro con-stop" id="conStop" hidden>
                <p className="eyebrow">Au centre du mall</p>
                <h2>Fraul Finds</h2>
                <p className="c-sum">Une pièce introuvable dans les boutiques ? Décris-la, on te la trouve chez nos fournisseurs.</p>
                <div className="acts">
                  <button className="pill solid" id="conStopBtn" type="button">
                    Demande une pièce
                  </button>
                </div>
                <p className="scroll-hint">↓ Continue vers les boutiques</p>
              </div>
              <div className="outro" id="outro" hidden>
                <p className="eyebrow">Sortie</p>
                <h2>Merci de ta visite.</h2>
                <div className="acts">
                  <button className="pill solid" id="again" type="button">
                    Refaire un tour
                  </button>
                  <Link className="pill ghost" href="/panier">
                    Voir mon panier
                  </Link>
                </div>
              </div>
              <div className="aisle" id="aisle" hidden>
                <span className="count" id="count" />
                <span className="bname" id="bname" />
                <p className="tap-hint">Touche la vitrine pour entrer</p>
                <div className="acts">
                  <button className="pill solid" id="enter" type="button">
                    Entrer
                  </button>
                  <button className="pill ghost" id="dirBtn" type="button">
                    Toutes les marques
                  </button>
                </div>
                <button className="con-link" id="conBtn" type="button">
                  Une pièce introuvable ? <b>Fraul Finds →</b>
                </button>
                <div className="prog" id="prog" />
              </div>
            </div>
            <div className="veil" id="veil" />
          </div>
        </div>
      </div>

      <div className="store" id="store" hidden role="dialog" aria-modal="true" aria-labelledby="sTitle">
        <canvas id="sgl" aria-label="Intérieur de la boutique" />
        <div className="s-top">
          {/* ✕ au centre de la boutique (sortir), ← dans un rayon (revenir au centre) : seul moyen de sortir (Rhamone, 21 oct.). */}
          <button className="ic s-quit" id="sQuit" type="button" aria-label="Sortir de la boutique">
            <svg className="x" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            <svg className="back" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <span className="s-title" id="sTitle">
            Boutique
          </span>
          <button className="ic" id="sSearch" type="button" aria-label="Chercher une marque ou une pièce">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          </button>
        </div>
        <div className="s-bottom" id="sBottom" hidden>
          {/* Rayons en liste verticale sur le décor, façon menu de jeu (Rhamone, 21 oct.). */}
          <p className="s-label">Rayons</p>
          <div className="s-cats" id="sCats" />
        </div>
        <button className="s-arrow l" id="sPrev" type="button" hidden aria-label="Article précédent">
          ‹
        </button>
        <button className="s-arrow r" id="sNext" type="button" hidden aria-label="Article suivant">
          ›
        </button>
        <section className="s-info" id="sInfo" hidden aria-label="Article sorti du rayon">
          <div className="s-in s-ir">
            <div style={{ minWidth: 0 }}>
              <p className="eyebrow" id="iBrand" />
              <h3 id="iName" />
            </div>
            <span className="s-price" id="iPrice" />
          </div>
          <div className="s-in s-else" id="iElse" />
          <div className="s-in s-ir">
            <div className="dots" id="iDots" />
            <span className="i-count" id="iCount" />
          </div>
          <div className="s-in sizes" id="iSizes" />
          <div className="s-in s-act">
            <button className="add" id="iAdd" type="button">
              <svg className="bag" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
              Au panier
            </button>
            <button className="s-more" id="iPage" type="button" aria-label="Voir l'article en grand, toutes ses photos">
              En grand
            </button>
            <button className="s-more" id="iClose" type="button" aria-label="Tourner l'article de près">
              Tourner
            </button>
          </div>
          <div className="s-chips" id="sChips" />
        </section>
      </div>

      <QuickView
        item={fiche}
        all={allItems}
        catLabel={catLabel}
        onClose={() => walkRef.current?.closeFiche()}
        onPick={(it) => { walkRef.current?.showItem(it.slug); setFiche(it); }}
        onAdd={addItem}
      />

      <div className="over" id="concierge" hidden={!concierge} role="dialog" aria-modal="true" aria-labelledby="conTitle">
        <div className="o-head">
          <div className="r">
            <div>
              <p className="eyebrow">Fraul Finds · Sur demande</p>
              <h2 id="conTitle">Demande une pièce</h2>
            </div>
            <button className="ic" type="button" aria-label="Fermer" onClick={() => walkRef.current?.closeConcierge()}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </div>
        <div className="o-body">
          <div className="o-inner">
            <p className="con-intro">Décris la pièce : on la cherche chez nos fournisseurs et on te répond par e-mail.</p>
            {concierge && <ConciergeForm key={concierge.brand} brand={concierge.brand} />}
          </div>
        </div>
      </div>

      <div className="over" id="dir" hidden role="dialog" aria-modal="true" aria-label="Toutes les marques">
        <div className="o-head">
          <div className="r">
            <div>
              <p className="eyebrow">Marques et pièces</p>
              <h2>Trouver</h2>
            </div>
            <button className="ic" id="dirClose" type="button" aria-label="Fermer">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <label className="sr-only" htmlFor="dirq">
            Chercher une marque ou une pièce
          </label>
          <input className="q" id="dirq" type="search" placeholder="Une marque ou une pièce (hoodie, basket…)" autoComplete="off" />
        </div>
        <div className="o-body">
          <div className="o-inner" id="dirList" />
        </div>
      </div>

      <div className="loader" id="loader" hidden>
        <div className="spin" aria-hidden="true">
          <svg viewBox="0 0 100 110">
            <path d="M50 8c-6 0-9 4-9 8v4l-20 10-13 20 12 8 9-8v52h42V50l9 8 12-8-13-20-20-10v-4c0-4-3-8-9-8z" fill="#420A0D" />
            <path d="M41 20c3 5 15 5 18 0" fill="none" stroke="#EAE0C8" strokeWidth="2" />
          </svg>
        </div>
        <b>Fraul Walk</b>
      </div>
    </div>
  );
}
