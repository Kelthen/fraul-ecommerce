"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { saveMarketing, syncAccount } from "@/app/compte/actions";
import { authLive, refreshSession, signOutEverywhere, type Session } from "@/lib/auth-client";

// Compte client : Supabase Auth (e-mail + mot de passe + code par e-mail). Aucun mot de passe n'est gardé.
// Sans clé publique (développement local), le compte reste une démo gardée sur le téléphone.

export type Account = { email: string; since: number; marketing: boolean };
type AccountCtx = {
  account: Account | null;
  /** Démo seulement. */
  signIn: (email: string) => void;
  /** Vrai compte : garde la session après connexion ou code validé. */
  adopt: (s: Session, acceptedTerms?: boolean, wantsNews?: boolean) => Promise<void>;
  signOut: () => void;
  setMarketing: (on: boolean) => void;
  /** Jeton à jour pour parler au serveur, ou null si la session est finie. */
  token: () => Promise<string | null>;
};

const Ctx = createContext<AccountCtx | null>(null);
const KEY = authLive ? "tuc.account.v1" : "tuc.account.demo.v1";
const REFRESH_MARGIN = 60_000;

type Stored = Account & { session?: Session };

const write = (a: Stored | null) => {
  try {
    if (a) localStorage.setItem(KEY, JSON.stringify(a));
    else localStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible : le compte dure le temps de la page */
  }
};

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useState<Stored | null>(null);

  const save = useCallback((a: Stored | null) => {
    setStored(a);
    write(a);
  }, []);

  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (a && typeof a.email === "string" && (!authLive || a.session)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage au montage
        setStored({ email: a.email, since: Number(a.since) || Date.now(), marketing: a.marketing === true, session: a.session });
      }
    } catch {
      /* stockage indisponible : pas de compte */
    }
  }, []);

  const token = useCallback(async () => {
    const s = stored?.session;
    if (!s) return null;
    if (s.expires_at - REFRESH_MARGIN > Date.now()) return s.access_token;
    try {
      const next = await refreshSession(s.refresh_token);
      save({ ...stored, session: next });
      return next.access_token;
    } catch {
      save(null);
      return null;
    }
  }, [stored, save]);

  // Une fois par ouverture : rattrape la fiche client et les CGV si la base ne répondait pas à l'inscription.
  const synced = useRef(false);
  useEffect(() => {
    if (synced.current || !stored?.session) return;
    synced.current = true;
    void token()
      .then((t) => (t ? syncAccount(t, false) : null))
      .then((p) => { if (p) setStored((a) => (a ? { ...a, marketing: p.marketing } : a)); })
      .catch(() => {});
  }, [stored, token]);

  const value = useMemo<AccountCtx>(() => {
    return {
      account: stored ? { email: stored.email, since: stored.since, marketing: stored.marketing } : null,
      signIn: (email) => save({ email, since: Date.now(), marketing: false }), // pas d'e-mails marketing sans accord (RGPD)
      adopt: async (session, acceptedTerms = false, wantsNews = false) => {
        const profile = await syncAccount(session.access_token, acceptedTerms).catch(() => null);
        synced.current = true;
        if (wantsNews) await saveMarketing(session.access_token, true).catch(() => false);
        save({ email: session.email, since: session.since, marketing: wantsNews || profile?.marketing === true, session });
      },
      signOut: () => {
        if (stored?.session) void signOutEverywhere(stored.session.access_token);
        save(null);
      },
      setMarketing: (on) => {
        if (!stored) return;
        save({ ...stored, marketing: on });
        if (stored.session) void token().then((t) => { if (t) void saveMarketing(t, on); });
      },
      token,
    };
  }, [stored, save, token]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAccount doit être utilisé dans <AccountProvider>");
  return c;
}
