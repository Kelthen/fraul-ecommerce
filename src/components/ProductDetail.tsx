"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { accentFor } from "@/lib/catalog/demo";
import { Price, PriceNote } from "./Price";
import { useCart } from "./CartProvider";
import { GarmentArt } from "./GarmentArt";
import { ProductGallery, photoViews } from "./product/ProductGallery";
import { EnvieButton } from "./EnvieButton";

const COLOR_NAMES: Record<string, string> = {
  "#F1ECE0": "Écru", "#141416": "Noir", "#680209": "Bordeaux", "#420A0D": "Vin", "#6B6766": "Gris anthracite",
  "#EAE0C8": "Perle", "#202833": "Marine", "#9A938A": "Pierre", "#2B2A2C": "Charbon", "#C9BFAA": "Sable",
};

type Props = { product: Product; categoryLabel: string; brandWord: string };

export function ProductDetail({ product, categoryLabel, brandWord }: Props) {
  const { add } = useCart();
  const router = useRouter();
  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState(product.sizes[Math.min(2, product.sizes.length - 1)]);
  const [front, setFront] = useState(true);
  const accent = accentFor(color);
  const colorName = COLOR_NAMES[color] ?? "Couleur";
  const line = { slug: product.slug, name: product.name, brandName: product.brandName, category: product.category, color, accent, cost: product.cost, size, sizes: product.sizes };

  return (
    <div className="pdp">
      {product.image ? (
        <ProductGallery name={product.name} views={photoViews(product.image)} />
      ) : (
      <div className="pdp-stage">
        <span className="ghost-word" aria-hidden="true">Fraul</span>
        <GarmentArt
          key={`${front}-${color}`}
          className="art flip"
          type={product.category}
          color={color}
          accent={accent}
          back={!front}
          word={brandWord}
          label={`${product.name}, vue ${front ? "de face" : "de dos"}`}
        />
        <div className="pdp-turn">
          <button className="round" type="button" aria-label="Tourner l'article" onClick={() => setFront((f) => !f)}>‹</button>
          <span>FACE / DOS</span>
          <button className="round" type="button" aria-label="Tourner l'article" onClick={() => setFront((f) => !f)}>›</button>
        </div>
      </div>
      )}

      <div className="pdp-info">
        <p className="eyebrow">{product.brandName} · {categoryLabel}</p>
        <h1 style={{ marginTop: 10 }}>{product.name}</h1>
        <p className="sub muted">{colorName}{product.image ? "" : ` · Vue ${front ? "de face" : "de dos"}`}</p>

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
            <a className="link" href="#guide">Guide des tailles</a>
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
            <b><Price cost={product.cost} /></b>
            <PriceNote />
          </div>
          <span className="muted" style={{ fontSize: 12, textAlign: "right", lineHeight: 1.5 }}>
            Délai de livraison
            <br />
            <strong style={{ color: "var(--ink)" }}>affiché au panier</strong>
          </span>
        </div>

        <div className="buy">
          <button className="pill line" type="button" onClick={() => add(line)}>
            Au panier
          </button>
          <button
            className="pill solid"
            type="button"
            onClick={() => {
              add(line);
              router.push("/panier");
            }}
          >
            Acheter · {size}
          </button>
        </div>

        <EnvieButton
          className="pdp-envie"
          item={{ slug: product.slug, name: product.name, brand: product.brandName, category: product.category, cost: product.cost, color, accent, photo: product.image?.front }}
        />

        <Link className="pdp-walk" href={`/walk/${product.brandSlug}`}>
          <span>
            <span className="eyebrow">Fraul Walk</span>
            <br />
            <b>Voir dans la boutique {product.brandName}</b>
          </span>
          <span aria-hidden="true">→</span>
        </Link>

        <div className="notes">
          <details id="guide">
            <summary>Guide des tailles</summary>
            <p className="todo">[À FOURNIR : guide des tailles {product.brandName}, avec les équivalences de pointures]</p>
          </details>
          <details>
            <summary>Matière et entretien</summary>
            <p className="todo">[À FOURNIR : composition et entretien, depuis la fiche fournisseur]</p>
          </details>
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
