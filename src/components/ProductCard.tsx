import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { Price } from "./Price";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link className="card" href={`/produit/${product.slug}`}>
      <div className="pic photo">
        {/* eslint-disable-next-line @next/next/no-img-element -- photos du catalogue, parfois hébergées chez Supabase */}
        <img src={product.image.front} alt="" loading="lazy" />
      </div>
      <span className="br">{product.brandName}</span>
      <span className="nm">{product.name}</span>
      <span className="pr"><Price prices={product.prices} /></span>
    </Link>
  );
}
