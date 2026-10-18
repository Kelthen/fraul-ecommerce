import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { Price } from "./Price";
import { GarmentArt } from "./GarmentArt";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link className="card" href={`/produit/${product.slug}`}>
      <div className={product.image ? "pic photo" : "pic"}>
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- captures du fournisseur, test de rendu avant détourage
          <img src={product.image.front} alt="" loading="lazy" />
        ) : (
          <GarmentArt type={product.category} color={product.color} accent={product.accent} />
        )}
      </div>
      <span className="br">{product.brandName}</span>
      <span className="nm">{product.name}</span>
      <span className="pr"><Price cost={product.cost} /></span>
    </Link>
  );
}
