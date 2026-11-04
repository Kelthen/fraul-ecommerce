"use client";

import Link from "next/link";
import { useState } from "react";
import { startCheckout } from "@/app/panier/actions";
import type { CategoryId } from "@/lib/catalog";
import { Price, PriceNote } from "./Price";
import { useCart } from "./CartProvider";
import { GarmentArt } from "./GarmentArt";

export function CartView() {
  const { lines, setQty, setSize, remove } = useCart();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!lines.length) {
    return (
      <div className="empty">
        <p>Ton panier est vide.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
          <Link className="pill solid" href="/walk">Entrer dans le mall</Link>
          <Link className="pill ghost" href="/marques">Voir les marques</Link>
        </div>
      </div>
    );
  }
  const missingSize = lines.some((l) => l.sizes.length > 1 && !l.size);
  return (
    <>
      <ul className="cart-list">
        {lines.map((l, i) => (
          <li key={`${l.slug}-${l.size}-${l.color}`} className="cart-item">
            <Link className="pic" href={`/produit/${l.slug}`} aria-label={`${l.name}, voir la fiche`}>
              <GarmentArt type={l.category as CategoryId} color={l.color} accent={l.accent} />
            </Link>
            <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
              <span className="eyebrow">{l.brandName}</span>
              <span style={{ color: "var(--ink)" }}>{l.name}</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {l.sizes.length > 1 ? (
                  <>
                    <label className="sr-only" htmlFor={`size-${i}`}>Taille</label>
                    <select id={`size-${i}`} value={l.size ?? ""} onChange={(e) => setSize(i, e.target.value)}>
                      <option value="" disabled>Taille ?</option>
                      {l.sizes.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </>
                ) : (
                  <span className="muted" style={{ fontSize: 13 }}>Taille unique</span>
                )}
                <span className="qty">
                  <button type="button" aria-label="Retirer un" onClick={() => setQty(i, l.qty - 1)}>−</button>
                  <span aria-live="polite">{l.qty}</span>
                  <button type="button" aria-label="Ajouter un" onClick={() => setQty(i, l.qty + 1)}>+</button>
                </span>
              </div>
            </div>
            <div style={{ display: "grid", justifyItems: "end", gap: 8 }}>
              <b style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}><Price prices={l.prices} qty={l.qty} /></b>
              <button type="button" className="link" onClick={() => remove(i)}>Retirer</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="summary">
        <div className="line"><span>Sous-total</span><b style={{ color: "var(--ink)" }}><Price lines={lines} /></b></div>
        <div className="line muted"><span>Livraison, droits et taxes</span><span>inclus, rien à payer à la livraison</span></div>
        <div className="line"><span>Total estimé</span><span className="total"><Price lines={lines} /></span></div>
        <PriceNote />
        {missingSize && <p className="todo">Choisis une taille pour chaque article.</p>}
        <button
          className="pill solid"
          type="button"
          disabled={missingSize || paying}
          onClick={async () => {
            setPaying(true);
            setError(null);
            // Seulement des identifiants et des quantités : le serveur recalcule chaque prix.
            const r = await startCheckout(lines.map((l) => ({ slug: l.slug, size: l.size, color: l.color, qty: l.qty }))).catch(() => ({
              error: "Le paiement ne répond pas. Réessaie dans un instant.",
            }));
            if ("url" in r) window.location.assign(r.url);
            else {
              setError(r.error);
              setPaying(false);
            }
          }}
        >
          {paying ? "Ouverture du paiement…" : "Payer"}
        </button>
        {error && <p className="todo" role="alert">{error}</p>}
        <p className="muted" style={{ fontSize: 12 }}>Paiement sécurisé par Stripe. L&apos;adresse de livraison se remplit à l&apos;étape suivante.</p>
      </div>
    </>
  );
}
