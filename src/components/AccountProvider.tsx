"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Compte client en DÉMO : rien ne part sur un serveur, aucun mot de passe n'est gardé (même pas dans le navigateur).
// Le vrai compte (Supabase Auth, code par e-mail, Turnstile) sera branché par Serge (docs/POUR-SERGE.md §2.4).

export type DemoAccount = { email: string; since: number; marketing: boolean };
type AccountCtx = {
  account: DemoAccount | null;
  signIn: (email: string) => void;
  signOut: () => void;
  setMarketing: (on: boolean) => void;
};

const Ctx = createContext<AccountCtx | null>(null);
const KEY = "fraul.account.demo.v1";

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<DemoAccount | null>(null);

  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem(KEY) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage au montage
      if (a && typeof a.email === "string") setAccount({ email: a.email, since: Number(a.since) || Date.now(), marketing: a.marketing === true });
    } catch {
      /* stockage indisponible : pas de compte */
    }
  }, []);

  const save = useCallback((a: DemoAccount | null) => {
    setAccount(a);
    try {
      if (a) localStorage.setItem(KEY, JSON.stringify(a));
      else localStorage.removeItem(KEY);
    } catch {
      /* ignoré */
    }
  }, []);

  const value = useMemo<AccountCtx>(
    () => ({
      account,
      signIn: (email) => save({ email, since: Date.now(), marketing: false }), // pas d'e-mails marketing sans accord (RGPD)
      signOut: () => save(null),
      setMarketing: (on) => account && save({ ...account, marketing: on }),
    }),
    [account, save],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAccount doit être utilisé dans <AccountProvider>");
  return c;
}
