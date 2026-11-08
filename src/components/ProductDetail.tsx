"use client";

import Link from "next/link";
import { LIVE_SITE } from "@/lib/live-site";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { COLOR_NAMES, accentFor } from "@/lib/catalog/palette";
import { Price, PriceNote } from "./Price";
import { useCart } from "./CartProvider";
import { ProductGallery, photoViews } from "./product/ProductGallery";
import { EnvieButton } from "./EnvieButton";
import { QtyStepper } from "./QtyStepper";


type Props = { product: Product; categoryLabel: string };

export function ProductDetail({ product, categoryLabel }: Props) {
  const { add } = useCart();
  const router = useRouter();
  const [color, setColor] = useState(product.colors[0]);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState(product.sizes[Math.min(2, product.sizes.length - 1)]);
  const accent = accentFor(color);
  const colorName = COLOR_NAMES[color] ?? "Couleur";
  // Photos de la couleur choisie si Jean Paul les a mises, sinon les photos principales.
  const shown = product.imageByColor?.[color];
  const image = shown ? { front: shown.front, back: shown.back } : product.image;
  const line = { slug: product.slug, name: product.name, brandName: product.brandName, category: product.category, color, accent, prices: product.prices, photo: image.front, size, sizes: product.sizes };

  return (
    <div className="pdp">
      <ProductGallery key={color} name={product.name} views={photoViews(image)} />

      <div className="pdp-info">
        <p className="eyebrow">{product.brandName} · {categoryLabel}</p>
        <h1 style={{ marginTop: 10 }}>{product.name}</h1>
        <p className="sub muted">{colorName}</p>

        <div className="opt">
          <div className="opt-head">
            <span className="eyebrow">Couleur</span>
          </div>
          <div className="swatches">
            {product.colors.map((c) => (
              <button key={c} type="button" className="swatch" aria-label={COLOR_NAMES[c] ?? c} aria-pressed={c === color} onClick={() => setColor(c)}>
                <i style={{ background: c }} />
              </button>
            ))}
          </div>
        </div>

        <div className="opt">
          <div className="opt-head">
            <span className="eyebrow">Taille</span>
            {!LIVE_SITE && <a className="link" href="#guide">Guide des tailles</a>}
          </div>
          <div className="sizes">
            {product.sizes.map((s) => (
              <button key={s} type="button" className="size" aria-pressed={s === size} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="price-box">
          <div>
            <span className="eyebrow">Ton prix</span>
            <b><Price prices={product.prices} /></b>
            <PriceNote />
          </div>
          <span className="muted" style={{ fontSize: 12, textAlign: "right", lineHeight: 1.5 }}>
            Délai de livraison
            <br />
            <strong style={{ color: "var(--ink)" }}>affiché au panier</strong>
          </span>
        </div>

        <div className="buy">
          <QtyStepper value={qty} onChange={setQty} />
          <button className="pill line" type="button" onClick={() => add(line, qty)}>
            Au panier
          </button>
          <button
            className="pill solid"
            type="button"
            onClick={() => {
              add(line, qty);
              router.push("/panier");
            }}
          >
            Acheter · {size}
          </button>
        </div>

        <EnvieButton
          className="pdp-envie"
          item={{ slug: product.slug, name: product.name, brand: product.brandName, category: product.category, prices: product.prices, color, accent, photo: image.front }}
        />

        <Link className="pdp-walk" href={`/walk/${product.brandSlug}`}>
          <span>
            <span className="eyebrow">Walk</span>
            <br />
            <b>Voir dans la boutique {product.brandName}</b>
          </span>
          <span aria-hidden="true">→</span>
        </Link>

        <div className="notes">
          {!LIVE_SITE && (
            <>
              <details id="guide">
                <summary>Guide des tailles</summary>
                <p className="todo">[À FOURNIR : guide des tailles {product.brandName}, avec les équivalences de pointures]</p>
              </details>
              <details>
                <summary>Matière et entretien</summary>
                <p className="todo">[À FOURNIR : composition et entretien, depuis la fiche fournisseur]</p>
              </details>
            </>
          )}
          <details>
            <summary>Livraison et retours</summary>
            <p>
              Suivi à chaque étape avec ton code de suivi. Voir <Link href="/livraison">livraison</Link> et <Link href="/retours">retours</Link>.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
