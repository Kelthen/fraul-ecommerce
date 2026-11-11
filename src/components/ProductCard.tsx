import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { EnvieButton } from "./EnvieButton";
import { Price } from "./Price";

/** Carte d'une pièce. Le cœur (« Mes envies ») est posé sur la photo, à côté du lien (un bouton ne peut pas être dans
 *  un lien) : le toucher garde la pièce sans ouvrir sa fiche (Rhamone, 11 nov.). */
export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="card-box">
      <Link className="card" href={`/produit/${product.slug}`}>
        <div className="pic photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- photos du catalogue, parfois hébergées chez Supabase */}
          <img src={product.image.front} alt="" loading="lazy" />
        </div>
        <span className="br">{product.brandName}</span>
        <span className="nm">{product.name}</span>
        <span className="pr"><Price prices={product.prices} /></span>
      </Link>
      <EnvieButton
        compact
        className="on-card"
        item={{ slug: product.slug, name: product.name, brand: product.brandName, category: product.category, prices: product.prices, color: product.color, accent: product.accent, photo: product.image.front }}
      />
    </div>
  );
}
