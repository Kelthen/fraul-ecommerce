"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_ZONE, ZONE_CURRENCY, type PriceTable, type ZoneId } from "@/models/pricing/public";

// Contrôleur des prix côté navigateur : choisit le prix de la zone (cookie posé par src/proxy.ts).
// Le navigateur reçoit les prix publics, jamais le coût ni le prix d'un groupe.
// Affichage seulement : le paiement recalcule tout côté serveur.

type PricingCtx = {
  zone: ZoneId;
  /** Prix du client, en unités de la devise de sa zone. */
  price: (prices: PriceTable) => number;
  /** « 89 USD » : code de devise, car « $ » seul confond USD et CAD (Serge, 13 oct.). */
  format: (amount: number) => string;
  /** Remise de groupe active : on l'indique au client (mention « prix personnalisé », R4). Pas encore reliée au compte. */
  personalised: boolean;
};

const Ctx = createContext<PricingCtx | null>(null);
const isZone = (z: unknown): z is ZoneId => typeof z === "string" && z in ZONE_CURRENCY;
const fmtCache = new Map<string, Intl.NumberFormat>();

function readCookieZone(): ZoneId | null {
  const m = document.cookie.match(/(?:^|;\s*)tuc_zone=([a-z]+)/);
  return m && isZone(m[1]) ? m[1] : null;
}

export function PricingProvider({ children }: { children: React.ReactNode }) {
  // Premier rendu = zone par défaut (même HTML que le serveur), puis la vraie zone après montage.
  const [zone, setZone] = useState<ZoneId>(DEFAULT_ZONE);

  useEffect(() => {
    setZone(readCookieZone() ?? DEFAULT_ZONE); // eslint-disable-line react-hooks/set-state-in-effect -- lecture unique du cookie au montage
  }, []);

  const value = useMemo<PricingCtx>(() => {
    const currency = ZONE_CURRENCY[zone];
    let f = fmtCache.get(currency);
    if (!f) fmtCache.set(currency, (f = new Intl.NumberFormat("fr-FR", { style: "currency", currency, currencyDisplay: "code", minimumFractionDigits: 0, maximumFractionDigits: 2 })));
    return {
      zone,
      price: (prices) => prices[zone],
      format: (amount) => f.format(amount),
      personalised: false,
    };
  }, [zone]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePricing() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePricing doit être utilisé dans <PricingProvider>");
  return c;
}
