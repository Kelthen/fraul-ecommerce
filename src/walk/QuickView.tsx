"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GarmentArt } from "@/components/GarmentArt";
import { EnvieButton } from "@/components/EnvieButton";
import { Price, PriceNote } from "@/components/Price";
import { ProductGallery, photoViews, type GalleryView } from "@/components/product/ProductGallery";
import type { CategoryId } from "@/lib/catalog/types";
import { related, type RelatedKey } from "@/models/catalog/related";
import type { Cost } from "@/models/pricing/price";

/** Article tel que la fiche en grand le reçoit (moteur du Walk ou catalogue compact). */
export type FicheItem = {
  slug: string; n: string; p: Cost; c: string; a: string; vars: string[]; sizes: string[];
  brand: string; cat: CategoryId; photos: { front: string; back?: string; details?: string[] } | null;
};

type Props = {
  item: FicheItem | null;
  /** Tous les articles du mall : les propositions en viennent. */
  all: FicheItem[];
  catLabel: (cat: CategoryId) => string;
  onClose: () => void;
  /** Une proposition touchée devient l'article affiché (le portant suit s'il est dans le rayon ouvert). */
  onPick: (it: FicheItem) => void;
  onAdd: (it: FicheItem, size?: string) => void;
};

function Art({ it, back = false, label }: { it: FicheItem; back?: boolean; label?: string }) {
  return <GarmentArt className="art" type={it.cat} color={it.c} accent={it.a} back={back} word={it.brand} label={label} />;
}

function views(it: FicheItem): GalleryView[] {
  if (it.photos) return photoViews(it.photos);
  return [
    { label: "Face", art: <Art it={it} label={`${it.n}, vue de face`} /> },
    { label: "Dos", art: <Art it={it} back label={`${it.n}, vue de dos`} /> },
  ];
}

/** Fiche en grand dans une boutique du Walk : toutes les photos, taille, panier, et 12 propositions en dessous. */
export function QuickView({ item, all, catLabel, onClose, onPick, onAdd }: Props) {
  const sheet = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [size, setSize] = useState<{ slug: string; v?: string }>({ slug: "" });
  const pickedSize = item && size.slug === item.slug ? size.v : item?.sizes[Math.min(2, item.sizes.length - 1)];

  const sections = useMemo(() => {
    if (!item) return [];
    const tag = (x: FicheItem) => ({ slug: x.slug, brand: x.brand, cat: x.cat, photo: !!x.photos, x });
    return related(all.map(tag), tag(item));
  }, [all, item]);

  useEffect(() => {
    if (!item) return;
    sheet.current?.scrollTo({ top: 0 });
    closeBtn.current?.focus({ preventScroll: true });
  }, [item]);

  const title = (key: RelatedKey, it: FicheItem) =>
    key === "same" ? `Autres ${catLabel(it.cat).toLowerCase()} ${it.brand}` : key === "outfit" ? "Complète la tenue" : `${catLabel(it.cat)} des autres boutiques`;

  return (
    <div className="fiche" id="fiche" hidden={!item} role="dialog" aria-modal="true" aria-labelledby="fName">
      {item && (
        <>
          <div className="f-top">
            <p className="eyebrow">{item.brand} · {catLabel(item.cat)}</p>
            <button className="ic" type="button" aria-label="Fermer" ref={closeBtn} onClick={onClose}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <div className="f-body" ref={sheet}>
            <ProductGallery key={item.slug} name={item.n} views={views(item)} className="f-gal" />
            <div className="f-info">
              <h2 id="fName">{item.n}</h2>
              <p className="f-price"><Price cost={item.p} /></p>
              <PriceNote />
              <div className="sizes" role="group" aria-label="Taille">
                {item.sizes.map((z) => (
                  <button key={z} type="button" className="size" aria-pressed={z === pickedSize} onClick={() => setSize({ slug: item.slug, v: z })}>{z}</button>
                ))}
              </div>
              <div className="f-act">
                {/* Style « Signature » choisi par Rhamone (21 oct.) : panier bordeaux avec sac, cœur rond, lien vers la fiche. */}
                <button className="add" type="button" onClick={() => onAdd(item, pickedSize)}><svg className="bag" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>Au panier</button>
                <EnvieButton compact item={{ slug: item.slug, name: item.n, brand: item.brand, category: item.cat, cost: item.p, color: item.c, accent: item.a, photo: item.photos?.front }} />
                <Link className="f-more" href={`/produit/${item.slug}`}>Fiche complète <span aria-hidden="true">→</span></Link>
              </div>
            </div>
            {sections.map((s) => (
              <section className="f-rel" key={s.key} aria-label={title(s.key, item)}>
                <h3>{title(s.key, item)}</h3>
                <ul>
                  {s.items.map(({ x }) => (
                    <li key={x.slug}>
                      <button type="button" onClick={() => onPick(x)}>
                        <span className={x.photos ? "pic photo" : "pic"}>
                          {x.photos ? (
                            // eslint-disable-next-line @next/next/no-img-element -- captures du fournisseur, test de rendu avant détourage
                            <img src={x.photos.front} alt="" loading="lazy" />
                          ) : (
                            <Art it={x} />
                          )}
                        </span>
                        <span className="br">{x.brand}</span>
                        <span className="nm">{x.n}</span>
                        <span className="pr"><Price cost={x.p} /></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
