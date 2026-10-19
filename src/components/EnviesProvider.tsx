"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { hasEnvie, parseEnvies, toggleEnvie, type Envie } from "@/models/envies/envies";
import { useCart } from "./CartProvider";

// « Mes envies » côté navigateur (démo) : synchronisées avec le compte quand les comptes seront branchés.

type EnviesCtx = {
  list: Envie[];
  count: number;
  has: (slug: string) => boolean;
  toggle: (item: Omit<Envie, "at">) => void;
};

const Ctx = createContext<EnviesCtx | null>(null);
const KEY = "fraul.envies.v1";

export function EnviesProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useCart();
  const [list, setList] = useState<Envie[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage au montage
      setList(parseEnvies(localStorage.getItem(KEY)));
    } catch {
      /* stockage indisponible : liste vide */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      /* ignoré */
    }
  }, [list]);

  const toggle = useCallback<EnviesCtx["toggle"]>(
    (item) => {
      const on = !hasEnvie(list, item.slug);
      setList((prev) => toggleEnvie(prev, item));
      toast(on ? `Dans tes envies : ${item.name}` : `Retiré de tes envies : ${item.name}`);
    },
    [list, toast],
  );

  const value = useMemo<EnviesCtx>(() => ({ list, count: list.length, has: (s) => hasEnvie(list, s), toggle }), [list, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEnvies() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useEnvies doit être utilisé dans <EnviesProvider>");
  return c;
}
