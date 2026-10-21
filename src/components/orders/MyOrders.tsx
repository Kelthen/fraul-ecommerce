"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { demoOrders } from "@/models/orders/demo";
import { STAGES, trackingView } from "@/models/orders/tracking";

/** « Mes commandes » dans Mon compte : étape, fourchette, lien vers le suivi. Démo : commandes d'exemple. */
export function MyOrders() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []); // eslint-disable-line react-hooks/set-state-in-effect -- date du visiteur, une fois
  if (now === null) return null;
  return (
    <ul className="orders">
      {demoOrders(now).map((o) => {
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
