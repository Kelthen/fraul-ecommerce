import Link from "next/link";

export default function NotFound() {
  return (
    <section className="sec wrap" style={{ minHeight: "60svh" }}>
      <p className="eyebrow">Erreur 404</p>
      <h1 style={{ fontSize: "clamp(42px, 8vw, 80px)", lineHeight: 0.95, margin: "8px 0 18px" }}>Cette vitrine est vide.</h1>
      <p className="muted">La page demandée n&apos;existe pas ou plus.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
        <Link className="pill solid" href="/walk">Entrer dans le mall</Link>
        <Link className="pill ghost" href="/">Accueil</Link>
      </div>
    </section>
  );
}
