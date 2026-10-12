import Link from "next/link";
import { BrandTile } from "@/components/BrandTile";
import { CircleForm } from "@/components/CircleForm";
import { GarmentArt } from "@/components/GarmentArt";
import { IconArrow, IconCheck, IconLock, IconPin, IconSpark, IconWalk } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { getBrands, getNewArrivals, getWalkBrands } from "@/lib/catalog";
import { signCss, signWord } from "@/lib/catalog/brands";

export default async function Home() {
  const [walkBrands, brands, news] = await Promise.all([getWalkBrands(), getBrands(), getNewArrivals()]);
  const featured = walkBrands.slice(0, 8);
  const fronts = [...walkBrands, ...walkBrands];

  return (
    <>
      {/* Entrée du mall : le Fraul Walk est l'expérience principale du site. */}
      <section className="mall-hero" aria-labelledby="hero-title">
        <div className="mall-scene" aria-hidden="true">
          <span className="ceil" />
          <span className="ceil" />
          <div className="belt">
            {fronts.map((b, i) => (
              <div key={`${b.slug}-${i}`} className="front" style={{ "--fb": b.style.bg, "--ff": b.style.fg } as React.CSSProperties}>
                <div className="sg" style={signCss(b.style)}>
                  {signWord(b.style)}
                </div>
                <div className="dr" />
              </div>
            ))}
          </div>
        </div>
        <div className="mall-copy">
          <div className="wrap">
            <p className="eyebrow">Fraul Walk · Drop 001</p>
            <h1 id="hero-title">
              Le shopping
              <br />
              <em>se visite.</em>
            </h1>
            <p className="lead">
              Streetwear et luxe 100 % authentiques, une boutique par marque. Passe devant les vitrines, entre et repars
              avec tes pièces.
            </p>
            <div className="hero-acts">
              <Link className="pill solid" href="/walk">
                <IconWalk /> Entrer dans le mall
              </Link>
              <Link className="pill ghost" href="#nouveautes">
                Voir les nouveautés
              </Link>
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
              <h3 style={{ fontSize: 30, margin: "8px 0" }}>{t}</h3>
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
            <h2 id="outfit-title" style={{ fontSize: "clamp(38px, 8vw, 72px)", lineHeight: 0.95, margin: "8px 0 16px" }}>
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
            {(
              [
                ["tee", "#0A0A0C", "#EAE0C8"],
                ["pants", "#8F8880", "#420A0D"],
                ["sneaker", "#680209", "#EAE0C8"],
              ] as const
            ).map(([t, c, a]) => (
              <div key={t} className="piece" style={{ aspectRatio: "3/4" }}>
                <GarmentArt type={t} color={c} accent={a} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec wrap" aria-labelledby="track-title">
        <div className="track-grid">
          <div>
            <p className="eyebrow">Suivi de commande</p>
            <h2 id="track-title" style={{ fontSize: "clamp(38px, 7vw, 64px)", lineHeight: 1, marginTop: 8 }}>
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
            <p className="eyebrow">Le cercle Fraul</p>
            <h2 id="circle-title" style={{ marginTop: 8 }}>Les drops avant tout le monde.</h2>
          </div>
          <CircleForm />
        </div>
      </section>
    </>
  );
}
