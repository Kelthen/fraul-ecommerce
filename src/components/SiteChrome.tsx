"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { useEnvies } from "./EnviesProvider";
import { IconBag, IconBrands, IconHeart, IconHome, IconOutfit, IconSearch, IconWalk } from "./Icons";

const NAV = [
  { href: "/walk", label: "Fraul Walk", walk: true },
  { href: "/#nouveautes", label: "Nouveautés" },
  { href: "/marques", label: "Marques" },
  { href: "/tenue", label: "Crée ta tenue" },
  { href: "/suivi", label: "Suivi" },
];

const isCurrent = (path: string, href: string) => (href === "/" ? path === "/" : !href.includes("#") && path.startsWith(href));

export function SiteHeader() {
  const path = usePathname();
  const { count } = useCart();
  const envies = useEnvies().count;
  if (path.startsWith("/walk")) return null; // le mall occupe tout l'écran
  return (
    <header className="top">
      <div className="wrap top-in">
        <Link className="logo" href="/" aria-label="Fraul, accueil">
          Fraul
        </Link>
        <nav className="nav" aria-label="Navigation principale">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={n.walk ? "walk" : undefined} aria-current={isCurrent(path, n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="top-acts">
          <Link className="icon-btn" href="/marques" aria-label="Rechercher une marque">
            <IconSearch />
          </Link>
          <Link className="icon-btn cart-btn" href="/envies" aria-label={`Mes envies, ${envies} pièce${envies > 1 ? "s" : ""}`}>
            <IconHeart />
            {envies > 0 && <b aria-hidden="true">{envies}</b>}
          </Link>
          <Link className="icon-btn cart-btn" href="/panier" aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}>
            <IconBag />
            <b aria-hidden="true">{count}</b>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function TabBar() {
  const path = usePathname();
  const { count } = useCart();
  if (path.startsWith("/walk")) return null;
  const tabs = [
    { href: "/", label: "Accueil", icon: <IconHome /> },
    { href: "/marques", label: "Marques", icon: <IconBrands /> },
    { href: "/walk", label: "Walk", icon: <IconWalk />, walk: true },
    { href: "/tenue", label: "Tenue", icon: <IconOutfit /> },
    { href: "/panier", label: count ? `Panier · ${count}` : "Panier", icon: <IconBag /> },
  ];
  return (
    <nav className="tabbar" aria-label="Navigation rapide">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={t.walk ? "walk" : undefined} aria-current={isCurrent(path, t.href) ? "page" : undefined}>
          <span>{t.icon}</span>
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function FooterGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path.startsWith("/walk") ? null : <>{children}</>;
}
