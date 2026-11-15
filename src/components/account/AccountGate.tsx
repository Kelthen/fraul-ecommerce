"use client";

import Link from "next/link";
import { useAccount } from "../AccountProvider";
import { AuthForm } from "./AuthForm";

/** Sous-page du compte : son titre et le retour vers l'accueil du compte ; sans session, la connexion. */
export function AccountGate({ title, children }: { title: string; children: React.ReactNode }) {
  const { account } = useAccount();
  if (!account) return <AuthForm />;
  return (
    <div className="auth account">
      <p className="eyebrow"><Link className="link" href="/compte">← Mon compte</Link></p>
      <h1>{title}</h1>
      {children}
    </div>
  );
}
