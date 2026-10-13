"use client";

import type { Cost } from "@/models/pricing/price";
import { usePricing } from "./PricingProvider";

/** Prix affiché d'un ou plusieurs articles (× quantité), dans la devise de la zone. */
export function Price({ cost, costs, qty = 1 }: { cost?: Cost; costs?: { cost: Cost; qty?: number }[]; qty?: number }) {
  const { price, format } = usePricing();
  const total = cost ? price(cost) * qty : (costs ?? []).reduce((a, l) => a + price(l.cost) * (l.qty ?? 1), 0);
  return <>{format(total)}</>;
}

/** Petite ligne sous le prix : droits inclus (DDP, Serge 13 oct.), confirmation à l'adresse (R2), plus la mention « prix personnalisé » quand une remise s'applique (R4). */
export function PriceNote() {
  const { personalised } = usePricing();
  return (
    <p className="price-note">
      {personalised ? "Prix personnalisé pour ton compte. " : ""}Droits et taxes inclus. Prix final confirmé selon l&apos;adresse de livraison.
    </p>
  );
}
