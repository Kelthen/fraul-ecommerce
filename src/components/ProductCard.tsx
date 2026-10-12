import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { GarmentArt } from "./GarmentArt";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link className="card" href={`/produit/${product.slug}`}>
      <div className="pic">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- photos détourées à venir
          <img src={product.image.front} alt="" loading="lazy" />
        ) : (
          <GarmentArt type={product.category} color={product.color} accent={product.accent} />
        )}
      </div>
      <span className="br">{product.brandName}</span>
      <span className="nm">{product.name}</span>
      <span className="pr">{formatPrice(product.price)}</span>
    </Link>
  );
}
