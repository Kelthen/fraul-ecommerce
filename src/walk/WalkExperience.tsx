"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCart } from "@/components/CartProvider";
import type { BrandStyle, Category, CategoryId } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { startWalk } from "./engine";
import "./walk.css";

/** Article compact transmis au navigateur : [slug, nom, prix, couleur, couleurs]. */
export type WalkItem = [string, string, number, string, string[]];

export type WalkData = {
  shops: { name: string; slug: string; style: BrandStyle }[];
  allBrands: { name: string; slug: string; style: BrandStyle }[];
  categories: Pick<Category, "id" | "label" | "sizes">[];
  /** Articles par marque puis par rayon. */
  items: Record<string, Partial<Record<CategoryId, WalkItem[]>>>;
};

type Props = { data: WalkData; startBrand?: string };

const ACCENT_DARK = ["#141416", "#202833", "#2B2A2C", "#420A0D", "#680209", "#6B6766", "#0A0A0C"];

export function WalkExperience({ data, startBrand }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { add, count } = useCart();
  const addRef = useRef(add);
  useEffect(() => {
    addRef.current = add;
  }, [add]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const css = getComputedStyle(document.documentElement);
    const fonts = {
      sans: css.getPropertyValue("--font-sans").trim() || "Montserrat, Arial, sans-serif",
      serif: css.getPropertyValue("--font-serif").trim() || "Georgia, serif",
    };
    const sizesOf = (cat: CategoryId) => data.categories.find((c) => c.id === cat)?.sizes ?? [];
    const brandOf = (name: string) => data.allBrands.find((b) => b.name === name);
    const shopIndex = startBrand ? data.shops.findIndex((s) => s.slug === startBrand) : -1;
    const startName = startBrand ? data.allBrands.find((b) => b.slug === startBrand)?.name : undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const walk = startWalk(el, {
      shops: data.shops,
      allBrands: data.allBrands,
      categories: data.categories,
      fonts,
      formatPrice,
      // Copies : la boutique peut changer la couleur d'un article sans toucher au catalogue.
      getItems: (brandName: string, cat: CategoryId) => {
        const b = brandOf(brandName);
        return (b ? data.items[b.slug]?.[cat] ?? [] : []).map(([slug, n, p, c, vars]) => ({
          slug, n, p, c, a: ACCENT_DARK.includes(c) ? "#EAE0C8" : "#420A0D", vars, sizes: sizesOf(cat), brand: brandName, cat,
        }));
      },
      onAdd: (it: { slug: string; n: string; p: number; c: string; a: string; brand: string; cat: string; sizes: string[] }, size?: string) =>
        addRef.current({ slug: it.slug, name: it.n, brandName: it.brand, category: it.cat, color: it.c, accent: it.a, price: it.p, size, sizes: it.sizes }),
      onExit: () => router.push("/"),
      onFallback: (slug: string) => router.push(`/marques/${slug}`),
      onOpenProduct: (it: { slug: string }) => router.push(`/produit/${it.slug}`),
      startShop: shopIndex >= 0 ? shopIndex : undefined,
      startStore: shopIndex < 0 ? startName : undefined,
    });

    return () => {
      walk.destroy();
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
              <button className="pill ghost" id="wQuit" type="button">
                Quitter
              </button>
              <span className="w-name">Fraul Walk</span>
              <Link className="pill ghost cart-chip" href="/panier" aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}>
                Panier {count}
              </Link>
            </div>
            <div className="hud">
              <div className="intro" id="intro">
                <p className="eyebrow">Fraul Walk</p>
                <h1>Le mall</h1>
                <p>Fais défiler pour avancer d&apos;une boutique à l&apos;autre. Touche une vitrine pour entrer.</p>
                <p className="scroll-hint">↓ Fais défiler pour entrer dans le mall</p>
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
                <div className="prog" id="prog" />
              </div>
            </div>
            <div className="veil" id="veil" />
          </div>
        </div>
      </div>

      <div className="store" id="store" hidden>
        <canvas id="sgl" aria-label="Intérieur de la boutique" />
        <div className="s-top">
          <button className="pill ghost" id="sQuit" type="button">
            Sortir
          </button>
          <span className="s-title" id="sTitle">
            Boutique
          </span>
        </div>
        <div className="s-bottom" id="sBottom" hidden>
          <p className="s-hint">Choisis un rayon, on t&apos;y emmène.</p>
          <div className="s-cats" id="sCats" />
          <p className="s-back">↑ Fais défiler vers l&apos;arrière pour sortir</p>
        </div>
        <button className="s-arrow l" id="sPrev" type="button" hidden aria-label="Article précédent">
          ‹
        </button>
        <button className="s-arrow r" id="sNext" type="button" hidden aria-label="Article suivant">
          ›
        </button>
        <p className="s-swipe" id="sSwipe" hidden>
          Glisse pour faire défiler
        </p>
        <section className="s-info" id="sInfo" hidden aria-label="Article sorti du rayon">
          <div className="s-in s-ir">
            <div style={{ minWidth: 0 }}>
              <p className="eyebrow" id="iBrand" />
              <h3 id="iName" />
            </div>
            <span className="s-price" id="iPrice" />
          </div>
          <div className="s-in s-ir">
            <div className="dots" id="iDots" />
            <span className="i-count" id="iCount" />
          </div>
          <div className="s-in sizes" id="iSizes" />
          <div className="s-in s-act">
            <button className="add" id="iAdd" type="button">
              Ajouter au panier
            </button>
            <button className="pill ghost" id="iClose" type="button" aria-label="Voir l'article de près">
              Zoom
            </button>
            <button className="pill ghost" id="iPage" type="button" aria-label="Ouvrir la fiche produit">
              Fiche
            </button>
          </div>
          <div className="s-chips" id="sChips" />
        </section>
      </div>

      <div className="over" id="dir" hidden role="dialog" aria-label="Toutes les marques">
        <div className="o-head">
          <div className="r">
            <div>
              <p className="eyebrow">Annuaire</p>
              <h2>Toutes les marques</h2>
            </div>
            <button className="close" id="dirClose" type="button">
              Fermer
            </button>
          </div>
          <label className="sr-only" htmlFor="dirq">
            Chercher une marque
          </label>
          <input className="q" id="dirq" type="search" placeholder="Chercher une marque" autoComplete="off" />
        </div>
        <div className="o-body">
          <div className="o-inner" id="dirList" />
        </div>
      </div>

      <div className="loader" id="loader" hidden>
        <b>Fraul Walk</b>
        <p className="eyebrow">Ouverture des portes</p>
        <div className="bar">
          <i />
        </div>
      </div>
    </div>
  );
}
