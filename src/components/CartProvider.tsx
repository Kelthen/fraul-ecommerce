"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// Panier côté navigateur (démo). Le vrai panier sera recalculé côté serveur :
// le navigateur n'envoie jamais de prix, seulement des identifiants et des quantités.

export type CartLine = {
  slug: string;
  name: string;
  brandName: string;
  category: string;
  color: string;
  accent: string;
  /** Prix de démonstration affiché, jamais utilisé pour encaisser. */
  price: number;
  size?: string;
  sizes: string[];
  qty: number;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (index: number, qty: number) => void;
  setSize: (index: number, size: string) => void;
  remove: (index: number) => void;
  toast: (msg: string) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "fraul.cart.v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const loaded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage au montage
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* stockage indisponible : panier vide */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignoré */
    }
  }, [lines]);

  const toast = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2400);
  }, []);

  const add = useCallback<CartCtx["add"]>(
    (line, qty = 1) => {
      setLines((prev) => {
        const i = prev.findIndex((l) => l.slug === line.slug && l.size === line.size && l.color === line.color);
        if (i >= 0) return prev.map((l, k) => (k === i ? { ...l, qty: l.qty + qty } : l));
        return [...prev, { ...line, qty }];
      });
      toast(`Ajouté : ${line.name}${line.size ? ` · ${line.size}` : ""}`);
    },
    [toast],
  );

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      count: lines.reduce((a, l) => a + l.qty, 0),
      add,
      setQty: (i, qty) => setLines((p) => (qty <= 0 ? p.filter((_, k) => k !== i) : p.map((l, k) => (k === i ? { ...l, qty } : l)))),
      setSize: (i, size) => setLines((p) => p.map((l, k) => (k === i ? { ...l, size } : l))),
      remove: (i) => setLines((p) => p.filter((_, k) => k !== i)),
      toast,
    }),
    [lines, add, toast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast" role="status" aria-live="polite" hidden={!msg}>
        {msg}
      </div>
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return c;
}
