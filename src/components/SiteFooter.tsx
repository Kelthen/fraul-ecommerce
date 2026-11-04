import Link from "next/link";
import { SOCIAL } from "@/content/social";

const ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 20.5l1.3-4.4A8.5 8.5 0 1 1 8 19.3l-4.5 1.2z" />
      <path d="M9 8.2c-.6.6-.8 1.5-.3 2.6.8 1.8 2.5 3.4 4.3 4.2 1.1.5 2 .3 2.6-.3l.6-.9-2-1.3-.9.8c-.8-.3-2-1.5-2.4-2.4l.8-.9-1.2-2.2z" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <p className="logo" style={{ marginBottom: 12 }}>TakeUrClothes</p>
            <p>Streetwear et luxe, à parcourir comme une vraie promenade de boutiques.</p>
          </div>
          <div>
            <h3>Boutique</h3>
            <ul>
              <li><Link href="/walk">Walk</Link></li>
              <li><Link href="/#nouveautes">Nouveautés</Link></li>
              <li><Link href="/tout">Tout voir</Link></li>
              <li><Link href="/marques">Marques</Link></li>
              <li><Link href="/tenue">Crée ta tenue</Link></li>
            </ul>
          </div>
          <div>
            <h3>Aide</h3>
            <ul>
              <li><Link href="/sur-demande">Finds : une pièce sur demande</Link></li>
              <li><Link href="/suivi">Suivi de commande</Link></li>
              <li><Link href="/livraison">Livraison et douane</Link></li>
              <li><Link href="/retours">Retours et remboursements</Link></li>
            </ul>
          </div>
          <div>
            <h3>Nous suivre</h3>
            <ul className="foot-social">
              {SOCIAL.map((n) => (
                <li key={n.id}>
                  {n.href ? (
                    <a href={n.href} target="_blank" rel="noopener noreferrer" aria-label={n.label} title={n.label}>{ICONS[n.id]}</a>
                  ) : (
                    <span className="foot-social-off" role="img" aria-label={n.label}>{ICONS[n.id]}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="foot-legal">
          <span>© 2026 TakeUrClothes</span>
          <span style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/cgv">CGV</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/cookies">Cookies</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
