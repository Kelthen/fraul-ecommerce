"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadMyOrders } from "@/app/compte/actions";
import { authLive } from "@/lib/auth-client";
import { demoOrders } from "@/models/orders/demo";
import { STAGES, trackingView, type Order } from "@/models/orders/tracking";
import { useAccount } from "../AccountProvider";

/** « Mes commandes » dans Mon compte : étape, fourchette, lien vers le suivi. Sans Supabase : commandes d'exemple. */
export function MyOrders() {
  const { token } = useAccount();
  const [orders, setOrders] = useState<Order[] | "error" | null>(null);
  useEffect(() => {
    let live = true;
    if (!authLive) {
      setOrders(demoOrders(Date.now())); // eslint-disable-line react-hooks/set-state-in-effect -- date du visiteur, une fois
      return;
    }
    void token()
      .then((t) => (t ? loadMyOrders(t) : null))
      .catch(() => null)
      .then((r) => { if (live) setOrders(r ?? "error"); });
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- une fois à l'ouverture de la page
  if (orders === null) return null;
  if (orders === "error") return <p className="muted">Tes commandes ne se chargent pas pour l&apos;instant. Réessaie dans un instant.</p>;
  if (!orders.length) return <p className="muted">Aucune commande avec cette adresse pour l&apos;instant.</p>;
  return (
    <ul className="orders">
      {orders.map((o) => {
        const v = trackingView(o);
        const n = o.lines.filter((l) => !l.refundedAt).reduce((a, l) => a + l.qty, 0);
        return (
          <li key={o.id}>
            <Link href={`/suivi?code=${o.id}`} className="order-row">
              <span className="o-id">{o.id}</span>
              <span className={`o-stage${v.stage === STAGES.length - 1 ? " done" : ""}`}>{STAGES[v.stage].label}</span>
              <span className="o-meta">
                {n} pièce{n > 1 ? "s" : ""}
                {v.window ? ` · livraison ${v.window}` : o.deliveredAt ? ` · livrée le ${new Date(o.deliveredAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}` : ""}
                {v.refunds.length ? " · 1 pièce remboursée" : ""}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
