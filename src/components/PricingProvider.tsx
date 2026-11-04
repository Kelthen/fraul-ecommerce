"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_ZONE, GROUPS, ZONES, type GroupId, type ZoneId } from "@/models/pricing/config";
import type { PriceTable } from "@/models/pricing/price";

// Contrôleur des prix côté navigateur : choisit le prix de la zone (cookie posé par src/proxy.ts) et du groupe.
// Le navigateur reçoit des prix, jamais le coût. Le groupe reste « public » tant qu'il n'est pas relié au compte.
// Affichage seulement : le paiement recalcule tout côté serveur.

type PricingCtx = {
  zone: ZoneId;
  group: GroupId;
  /** Prix du client, en unités de la devise de sa zone. */
  price: (prices: PriceTable) => number;
  /** « 89 USD » : code de devise, car « $ » seul confond USD et CAD (Serge, 13 oct.). */
  format: (amount: number) => string;
  /** Remise de groupe active : on l'indique au client (mention « prix personnalisé », R4). */
  personalised: boolean;
};

const Ctx = createContext<PricingCtx | null>(null);
const isZone = (z: unknown): z is ZoneId => typeof z === "string" && z in ZONES;
const fmtCache = new Map<string, Intl.NumberFormat>();

function readCookieZone(): ZoneId | null {
  const m = document.cookie.match(/(?:^|;\s*)tuc_zone=([a-z]+)/);
  return m && isZone(m[1]) ? m[1] : null;
}

export function PricingProvider({ children }: { children: React.ReactNode }) {
  // Premier rendu = zone par défaut (même HTML que le serveur), puis la vraie zone après montage.
  const [zone, setZone] = useState<ZoneId>(DEFAULT_ZONE);
  const group: GroupId = "public";

  useEffect(() => {
    setZone(readCookieZone() ?? DEFAULT_ZONE); // eslint-disable-line react-hooks/set-state-in-effect -- lecture unique du cookie au montage
  }, []);

  const value = useMemo<PricingCtx>(() => {
    const currency = ZONES[zone].currency;
    let f = fmtCache.get(currency);
    if (!f) fmtCache.set(currency, (f = new Intl.NumberFormat("fr-FR", { style: "currency", currency, currencyDisplay: "code", maximumFractionDigits: 0 })));
    return {
      zone,
      group,
      price: (prices) => prices[zone][group],
      format: (amount) => f.format(amount),
      personalised: GROUPS[group].discountPct > 0,
    };
  }, [zone, group]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePricing() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePricing doit être utilisé dans <PricingProvider>");
  return c;
}
