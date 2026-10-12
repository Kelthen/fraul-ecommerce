import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <p className="logo" style={{ marginBottom: 12 }}>Fraul</p>
            <p>Streetwear et luxe, à parcourir comme une vraie promenade de boutiques.</p>
          </div>
          <div>
            <h3>Boutique</h3>
            <ul>
              <li><Link href="/walk">Fraul Walk</Link></li>
              <li><Link href="/#nouveautes">Nouveautés</Link></li>
              <li><Link href="/marques">Marques</Link></li>
              <li><Link href="/tenue">Crée ta tenue</Link></li>
            </ul>
          </div>
          <div>
            <h3>Aide</h3>
            <ul>
              <li><Link href="/suivi">Suivi de commande</Link></li>
              <li><Link href="/livraison">Livraison et douane</Link></li>
              <li><Link href="/retours">Retours et remboursements</Link></li>
            </ul>
          </div>
          <div>
            <h3>Nous suivre</h3>
            <ul>
              <li><span className="todo">[À FOURNIR : liens réseaux sociaux]</span></li>
            </ul>
          </div>
        </div>
        <div className="foot-legal">
          <span>© 2026 Fraul</span>
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
