"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_ZONE, GROUPS, ZONES, type GroupId, type ZoneId } from "@/models/pricing/config";
import { customerPrice, type Cost } from "@/models/pricing/price";

// Contrôleur des prix côté navigateur : zone (cookie posé par src/proxy.ts) et groupe du client.
// Tant que les comptes n'existent pas, le groupe ne se choisit que sur la page de test /test/prix.
// Affichage seulement : le paiement recalcule tout côté serveur.

type PricingCtx = {
  zone: ZoneId;
  group: GroupId;
  /** Prix du client pour ce coût, en unités de la devise de sa zone. */
  price: (cost: Cost) => number;
  /** « 89 USD » : code de devise, car « $ » seul confond USD et CAD (Serge, 13 oct.). */
  format: (amount: number) => string;
  /** Remise de groupe active : on l'indique au client (mention « prix personnalisé », R4). */
  personalised: boolean;
  setTest: (zone: ZoneId | null, group: GroupId | null) => void;
};

const Ctx = createContext<PricingCtx | null>(null);
const TEST_KEY = "fraul.test.pricing";
const isZone = (z: unknown): z is ZoneId => typeof z === "string" && z in ZONES;
const isGroup = (g: unknown): g is GroupId => typeof g === "string" && g in GROUPS;
const fmtCache = new Map<string, Intl.NumberFormat>();

function readCookieZone(): ZoneId | null {
  const m = document.cookie.match(/(?:^|;\s*)fraul_zone=([a-z]+)/);
  return m && isZone(m[1]) ? m[1] : null;
}

export function PricingProvider({ children }: { children: React.ReactNode }) {
  // Premier rendu = zone par défaut (même HTML que le serveur), puis la vraie zone après montage.
  const [zone, setZone] = useState<ZoneId>(DEFAULT_ZONE);
  const [group, setGroup] = useState<GroupId>("public");

  useEffect(() => {
    let t: { zone?: unknown; group?: unknown } = {};
    try {
      t = JSON.parse(localStorage.getItem(TEST_KEY) || "{}");
    } catch {
      /* stockage indisponible */
    }
    /* eslint-disable react-hooks/set-state-in-effect -- lecture unique du cookie et du stockage au montage */
    setZone(isZone(t.zone) ? t.zone : (readCookieZone() ?? DEFAULT_ZONE));
    if (isGroup(t.group)) setGroup(t.group);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const setTest = useCallback<PricingCtx["setTest"]>((z, g) => {
    const nz = z ?? readCookieZone() ?? DEFAULT_ZONE, ng = g ?? "public";
    setZone(nz);
    setGroup(ng);
    try {
      if (z || g) localStorage.setItem(TEST_KEY, JSON.stringify({ zone: z, group: g }));
      else localStorage.removeItem(TEST_KEY);
    } catch {
      /* ignoré */
    }
  }, []);

  const value = useMemo<PricingCtx>(() => {
    const currency = ZONES[zone].currency;
    let f = fmtCache.get(currency);
    if (!f) fmtCache.set(currency, (f = new Intl.NumberFormat("fr-FR", { style: "currency", currency, currencyDisplay: "code", maximumFractionDigits: 0 })));
    return {
      zone,
      group,
      price: (cost) => customerPrice(cost, zone, group),
      format: (amount) => f.format(amount),
      personalised: GROUPS[group].discountPct > 0,
      setTest,
    };
  }, [zone, group, setTest]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePricing() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePricing doit être utilisé dans <PricingProvider>");
  return c;
}
