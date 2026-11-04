"use client";

import Link from "next/link";
import { STAGES, stageIndex } from "@/models/orders/tracking";
import { useAccount } from "../AccountProvider";
import { useCart } from "../CartProvider";
import { useEnvies } from "../EnviesProvider";
import { useMyOrders } from "../orders/MyOrders";
import { AuthForm } from "./AuthForm";

const many = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/** Accueil du compte : une grille de cases qui tient sur un écran de téléphone. Non connecté : la connexion. */
export function AccountView() {
  const { account } = useAccount();
  if (!account) return <AuthForm />;
  return <Home email={account.email} />;
}

function Home({ email }: { email: string }) {
  const { count: cart } = useCart();
  const { count: envies } = useEnvies();
  const orders = useMyOrders();
  const list = Array.isArray(orders) ? orders : [];
  const last = list.reduce<(typeof list)[number] | null>((a, o) => (!a || o.paidAt > a.paidAt ? o : a), null);
  const tiles = [
    { href: "/compte/commandes", title: "Mes commandes", note: orders === null ? " " : orders === "error" ? "À revoir" : list.length ? `${many(list.length, "commande")}${last ? ` · ${STAGES[stageIndex(last.step)].label}` : ""}` : "Aucune pour l'instant" },
    { href: "/envies", title: "Mes envies", note: envies ? many(envies, "pièce") : "Rien de gardé" },
    { href: "/panier", title: "Mon panier", note: cart ? many(cart, "pièce") : "Vide" },
    { href: "/suivi", title: "Suivre un colis", note: "Avec ton numéro" },
    { href: "/compte/reglages", title: "Réglages", note: "E-mail, mot de passe" },
  ];
  return (
    <div className="auth account">
      <p className="acc-hello">Bonjour</p>
      <p className="muted">{email}</p>
      <ul className="acc-grid">
        {tiles.map((t) => (
          <li key={t.href}>
            <Link className="acc-tile" href={t.href}>
              <b>{t.title}</b>
              <span>{t.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
