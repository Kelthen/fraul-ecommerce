"use client";

import Link from "next/link";
import { GarmentArt } from "./GarmentArt";
import { Price } from "./Price";
import { EnvieButton } from "./EnvieButton";
import { useEnvies } from "./EnviesProvider";
import type { CategoryId } from "@/lib/catalog";

/** Page « Mes envies » : les pièces gardées de côté, du plus récent au plus ancien. */
export function EnviesView({ available }: { available: string[] }) {
  const { list } = useEnvies();
  const inStock = new Set(available);
  return (
    <>
      <p className="eyebrow">Mes envies</p>
      <h1 style={{ fontSize: "clamp(42px, 8vw, 72px)", lineHeight: 1, marginTop: 8 }}>Gardé de côté</h1>
      {list.length === 0 ? (
        <div className="envies-empty">
          <p className="muted">Rien pour l&apos;instant. Touche le cœur « Envie » sur une pièce pour la retrouver ici.</p>
          <Link className="pill solid" href="/walk">Entrer dans le mall</Link>
        </div>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 12 }}>
            {list.length} pièce{list.length > 1 ? "s" : ""}. Gardées sur ce téléphone pour l&apos;instant.
          </p>
          <ul className="grid envies-grid">
            {list.map((e) => {
              const gone = !inStock.has(e.slug);
              return (
              <li key={e.slug} className={`envie-card${gone ? " gone" : ""}`}>
                <Link className="card" href={gone ? `/sur-demande?marque=${encodeURIComponent(e.brand)}` : `/produit/${e.slug}`}>
                  <div className={e.photo ? "pic photo" : "pic"}>
                    {e.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- captures du fournisseur, test de rendu avant détourage
                      <img src={e.photo} alt="" loading="lazy" />
                    ) : (
                      <GarmentArt type={e.category as CategoryId} color={e.color} accent={e.accent} />
                    )}
                  </div>
                  <span className="br">{e.brand}</span>
                  <span className="nm">{e.name}</span>
                  {gone ? (
                    <span className="pr gone-note">Plus disponible · <u>la faire chercher</u></span>
                  ) : (
                    <span className="pr"><Price cost={e.cost} /></span>
                  )}
                </Link>
                <EnvieButton compact item={e} className="on-card" />
              </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
