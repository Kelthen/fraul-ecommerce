import Link from "next/link";
import { BrandTile } from "@/components/BrandTile";
import { CircleForm } from "@/components/CircleForm";
import { IconArrow, IconCheck, IconLock, IconPin, IconSpark, IconWalk } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { LooksStrip } from "@/components/home/LooksStrip";
import { getBrands, getNewArrivals, getProducts, getWalkBrands } from "@/lib/catalog";
import { loadLookRows } from "@/lib/catalog/db";
import { TEST_LOOKS, resolveLooks } from "@/models/home/looks";
import { signCss, signWord } from "@/lib/catalog/brands";

export default async function Home() {
  const [walkBrands, brands, news, products] = await Promise.all([getWalkBrands(), getBrands(), getNewArrivals(), getProducts()]);
  // Looks ajoutés par Jean Paul dans l'admin (détourés) ; les looks de test tant qu'il n'y en a aucun.
  const fromAdmin = ((await loadLookRows()) ?? []).map((r) => ({ id: r.id, title: r.title, photo: r.cutout!, items: r.items }));
  const looks = resolveLooks(fromAdmin.length ? fromAdmin : TEST_LOOKS, products);
  const featured = walkBrands.slice(0, 8);
  // Plus de pièces sur l'accueil (Rhamone, 11 nov. : « la page d'accueil manque de placement de produit ») : les autres
  // pièces en ligne, une marque après l'autre, sans répéter les nouveautés.
  const rest = products.filter((p) => !news.some((n) => n.slug === p.slug));
  const byBrand = Object.values(Object.groupBy(rest, (p) => p.brandSlug)) as (typeof rest)[];
  const picks = Array.from({ length: Math.max(0, ...byBrand.map((g) => g.length)) }, (_, i) => byBrand.map((g) => g[i]).filter(Boolean)).flat().slice(0, 12);
  const fronts = [...walkBrands, ...walkBrands];

  return (
    <>
      {looks.length > 0 && (
        // Hero de l'accueil : le défilé de looks (Rhamone, 11 nov. : « la partie les looks sera le hero »). Textes décidés par l'équipe, à confirmer.
        <section className="looks-hero wrap" id="looks" aria-labelledby="looks-title">
          <div className="head">
            <div>
              <p className="eyebrow">Portés ensemble</p>
              <h1 id="looks-title">Les looks</h1>
            </div>
            <p className="muted">Touche un look pour voir ses pièces.</p>
          </div>
          <LooksStrip looks={looks} />
        </section>
      )}


      {/* Entrée du mall, juste après les looks (échange avec le hero, Rhamone, 11 nov.). */}
      <section className="mall-hero" aria-labelledby="hero-title">
        <div className="mall-scene" aria-hidden="true">
          <span className="ceil" />
          <span className="ceil" />
          <div className="belt">
            {fronts.map((b, i) => (
              <div key={`${b.slug}-${i}`} className="front" style={{ "--fb": b.style.bg, "--ff": b.style.fg } as React.CSSProperties}>
                <div className="sg" style={signCss(b.style)}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- logo déjà réduit à l'envoi */}
                  {b.style.logo ? <img className="brand-logo" src={b.style.logo} alt="" /> : signWord(b.style)}
                </div>
                <div className="dr" />
              </div>
            ))}
          </div>
        </div>
        <div className="mall-copy">
          <div className="wrap">
            <p className="eyebrow">Walk · Drop 001</p>
            <h2 id="hero-title">
              Le shopping
              <br />
              <em>se visite.</em>
            </h2>
            <p className="lead">
              Streetwear et luxe 100 % authentiques, une boutique par marque. Passe devant les vitrines, entre et repars
              avec tes pièces.
            </p>
            <div className="hero-acts">
              <Link className="pill solid" href="/walk">
                <IconWalk /> Entrer dans le mall
              </Link>
              {/* Lien simple : celui de Next ne refaisait pas défiler vers la même ancre au 2e clic (Rhamone, 11 nov.). */}
              <a className="pill ghost" href="#nouveautes">
                Voir les nouveautés
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="perks" aria-label="Nos engagements">
        <ul className="wrap">
          <li><IconCheck /> Pièces 100 % authentiques</li>
          <li><IconSpark /> Drops limités</li>
          <li><IconPin /> Suivi de commande en direct</li>
          <li><IconLock /> Paiement sécurisé</li>
        </ul>
      </section>


      <section className="sec wrap" id="nouveautes" aria-labelledby="new-title">
        <div className="head">
          <div>
            <p className="eyebrow">Arrivés cette semaine</p>
            <h2 id="new-title">Nouveautés</h2>
          </div>
          <Link className="link" href="/categorie/hoodies">
            Tout voir
          </Link>
        </div>
        <div className="row">
          {news.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {picks.length > 0 && (
        <section className="sec wrap" id="selection" aria-labelledby="picks-title">
          <div className="head">
            <div>
              <p className="eyebrow">Dans les boutiques</p>
              <h2 id="picks-title">À ne pas manquer</h2>
            </div>
            <Link className="link" href="/marques">
              Toutes les marques
            </Link>
          </div>
          <div className="grid">
            {picks.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      <div className="marquee" aria-hidden="true">
        <div>
          {[...featured, ...featured].map((b, i) => (
            <span key={i}>
              {b.name} <i>·</i>
            </span>
          ))}
        </div>
      </div>

      <section className="sec wrap" id="marques" aria-labelledby="brands-title">
        <div className="head">
          <div>
            <p className="eyebrow">Une boutique par marque</p>
            <h2 id="brands-title">Les marques</h2>
          </div>
          <p className="muted">Touche une marque pour entrer dans sa boutique.</p>
        </div>
        <div className="bgrid">
          {featured.map((b) => (
            <BrandTile key={b.slug} brand={b} />
          ))}
          <Link className="btile all" href="/marques">
            <span className="wm">Toutes les marques</span>
            <small>{brands.length} marques, de A à Z</small>
          </Link>
        </div>
      </section>

      <section className="sec wrap" aria-labelledby="how-title">
        <div className="head">
          <div>
            <p className="eyebrow">Comment ça marche</p>
            <h2 id="how-title">Une sortie shopping, sans sortir.</h2>
          </div>
        </div>
        <ol className="grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {[
            ["01", "Promène-toi", "Fais défiler pour longer les vitrines du mall, une marque après l'autre."],
            ["02", "Entre", "Une boutique par marque, vue à hauteur d'yeux. Choisis un rayon, on t'y emmène."],
            ["03", "Essaie du regard", "La pièce sort du rayon et tourne devant toi : face, dos, couleurs, tailles."],
            ["04", "Repars avec", "Ajoute au panier sans quitter la boutique, puis suis ta commande étape par étape."],
          ].map(([n, t, d]) => (
            <li key={n} style={{ borderTop: "1px solid var(--line)", paddingTop: 18 }}>
              <span className="eyebrow">{n}</span>
              <h3 className="how-t">{t}</h3>
              <p className="muted">{d}</p>
            </li>
          ))}
        </ol>
        <div style={{ marginTop: 28 }}>
          <Link className="pill solid" href="/walk">
            Commencer la visite <IconArrow />
          </Link>
        </div>
      </section>

      <section className="sec pearl" aria-labelledby="outfit-title">
        <div className="wrap outfit">
          <div>
            <p className="eyebrow">Drop 001 · Assemble</p>
            <h2 id="outfit-title" className="big-t" style={{ margin: "8px 0 16px" }}>
              Crée ta tenue
            </h2>
            <p style={{ maxWidth: "40ch" }}>Un haut, un bas, une paire : essaie-les sur le mannequin et ajoute la tenue entière au panier.</p>
            <div style={{ marginTop: 24 }}>
              <Link className="pill ink" href="/tenue">
                Commencer
              </Link>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} aria-hidden="true">
            {news.slice(0, 3).map((p) => (
              <div key={p.slug} className="piece" style={{ aspectRatio: "3/4", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- photos du catalogue, parfois hébergées chez Supabase */}
                <img src={p.image.front} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec wrap" aria-labelledby="track-title">
        <div className="track-grid">
          <div>
            <p className="eyebrow">Suivi de commande</p>
            <h2 id="track-title" className="big-t" style={{ marginTop: 8 }}>
              Où est ma commande ?
            </h2>
            <p className="muted" style={{ marginTop: 12, maxWidth: "40ch" }}>
              Avec ton code de suivi, tu vois ta pièce avancer, du départ jusqu&apos;à ta porte.
            </p>
            <div style={{ marginTop: 20 }}>
              <Link className="pill line" href="/suivi">
                Suivre une commande
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap" aria-labelledby="circle-title">
        <div className="circle">
          <div>
            <p className="eyebrow">Le cercle TakeUrClothes</p>
            <h2 id="circle-title" style={{ marginTop: 8 }}>Les drops avant tout le monde.</h2>
          </div>
          <CircleForm />
        </div>
      </section>
    </>
  );
}
