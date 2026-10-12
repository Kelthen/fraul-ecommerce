import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = { title: "Panier", robots: { index: false } };

export default function CartPage() {
  return (
    <section className="sec wrap" style={{ paddingTop: 48 }}>
      <p className="eyebrow">Ton panier</p>
      <h1 style={{ fontSize: "clamp(42px, 8vw, 80px)", lineHeight: 0.95, margin: "8px 0 28px" }}>Panier</h1>
      <CartView />
    </section>
  );
}
