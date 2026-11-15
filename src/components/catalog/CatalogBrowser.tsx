"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import type { Product } from "@/lib/catalog";
import { COLOR_NAMES } from "@/lib/catalog/palette";
import { SORTS, activeCount, applyFilters, facets, filtersQuery, parseFilters, type Filters, type SortId } from "@/models/catalog/filters";
import { ProductCard } from "../ProductCard";
import { usePricing } from "../PricingProvider";

// Catalogue avec bouton « Filtrer » (volet par le bas au téléphone) : photos d'abord (L-58), filtres dans l'adresse
// (lien partageable sur WhatsApp), seulement les valeurs qui ont des articles.

type Label = { id: string; label: string };
type Props = {
  products: Product[];
  categories: Label[];
  /** Sans filtre, regroupe par catégorie avec un titre (page d'une marque). */
  grouped?: boolean;
};

type Group = "types" | "brands" | "colors" | "sizes";

export function CatalogBrowser({ products, categories, grouped = false }: Props) {
  const params = useSearchParams();
  const path = usePathname();
  const router = useRouter();
  const { zone } = usePricing();
  const sheet = useRef<HTMLDialogElement>(null);
  const f = parseFilters(params);
  const shown = applyFilters(products, f, zone);
  const values = facets(products);
  const typeName = (id: string) => categories.find((c) => c.id === id)?.label ?? id;
  const brandName = (id: string) => values.brands.find((b) => b.id === id)?.label ?? id;
  const colorName = (hex: string) => COLOR_NAMES[`#${hex}`] ?? `#${hex}`;

  const update = (next: Filters) => {
    const q = filtersQuery(next);
    router.replace(q ? `${path}?${q}` : path, { scroll: false });
  };
  const toggle = (group: Group, v: string) =>
    update({ ...f, [group]: f[group].includes(v) ? f[group].filter((x) => x !== v) : [...f[group], v] });

  const chips: { key: string; label: string; off: () => void }[] = [
    ...f.types.map((v) => ({ key: `t${v}`, label: typeName(v), off: () => toggle("types", v) })),
    ...f.brands.map((v) => ({ key: `b${v}`, label: brandName(v), off: () => toggle("brands", v) })),
    ...f.colors.map((v) => ({ key: `c${v}`, label: colorName(v), off: () => toggle("colors", v) })),
    ...f.sizes.map((v) => ({ key: `s${v}`, label: v, off: () => toggle("sizes", v) })),
  ];
  const count = activeCount(f);
  const showGroups = grouped && !count && f.sort === "nouveautes";

  const option = (group: Group, id: string, label: string) => (
    <button key={id} type="button" className="f-opt" aria-pressed={f[group].includes(id)} onClick={() => toggle(group, id)}>{label}</button>
  );

  return (
    <div className="catalog">
      <div className="cat-bar">
        <button type="button" className="f-open" onClick={() => sheet.current?.showModal()}>
          Filtrer{count ? ` (${count})` : ""}
        </button>
        <span className="muted cat-count" aria-live="polite">{shown.length} pièce{shown.length > 1 ? "s" : ""}</span>
        <label className="cat-sort">
          <span className="sr-only">Trier</span>
          <select value={f.sort} onChange={(e) => update({ ...f, sort: e.target.value as SortId })}>
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {chips.length > 0 && (
        <ul className="f-chips" aria-label="Filtres actifs">
          {chips.map((c) => (
            <li key={c.key}>
              <button type="button" className="f-chip" onClick={c.off} aria-label={`Retirer le filtre ${c.label}`}>{c.label} <span aria-hidden="true">×</span></button>
            </li>
          ))}
          <li><button type="button" className="link f-clear" onClick={() => update({ ...f, types: [], brands: [], colors: [], sizes: [] })}>Tout effacer</button></li>
        </ul>
      )}

      {shown.length === 0 ? (
        <p className="muted cat-empty">Aucune pièce avec ces filtres. Retire-en un pour en voir plus.</p>
      ) : showGroups ? (
        categories.map((c) => {
          const items = shown.filter((p) => p.category === c.id);
          if (!items.length) return null;
          return (
            <section key={c.id} className="cat-block" aria-labelledby={`cat-${c.id}`}>
              <h2 id={`cat-${c.id}`}>{c.label}</h2>
              <div className="grid">{items.map((p) => <ProductCard key={p.slug} product={p} />)}</div>
            </section>
          );
        })
      ) : (
        <div className="grid">{shown.map((p) => <ProductCard key={p.slug} product={p} />)}</div>
      )}

      <dialog ref={sheet} className="f-sheet" aria-labelledby="f-title" onClick={(e) => { if (e.target === sheet.current) sheet.current?.close(); }}>
        <div className="f-panel">
          <div className="f-head">
            <h2 id="f-title">Filtrer</h2>
            <button type="button" className="f-x" onClick={() => sheet.current?.close()} aria-label="Fermer">×</button>
          </div>
          <div className="f-body">
            {values.types.length > 1 && (
              <fieldset><legend>Type</legend><div className="f-opts">{values.types.map((id) => option("types", id, typeName(id)))}</div></fieldset>
            )}
            {values.brands.length > 1 && (
              <fieldset><legend>Marque</legend><div className="f-opts">{values.brands.map((b) => option("brands", b.id, b.label))}</div></fieldset>
            )}
            {values.colors.length > 1 && (
              <fieldset>
                <legend>Couleur</legend>
                <div className="f-opts">
                  {values.colors.map((hex) => (
                    <button key={hex} type="button" className="f-color" style={{ background: `#${hex}` }} aria-pressed={f.colors.includes(hex)} aria-label={colorName(hex)} title={colorName(hex)} onClick={() => toggle("colors", hex)} />
                  ))}
                </div>
              </fieldset>
            )}
            {values.sizes.length > 1 && (
              <fieldset><legend>Taille</legend><div className="f-opts">{values.sizes.map((s) => option("sizes", s, s))}</div></fieldset>
            )}
          </div>
          <button type="button" className="pill solid f-see" onClick={() => sheet.current?.close()}>
            Voir {shown.length} pièce{shown.length > 1 ? "s" : ""}
          </button>
        </div>
      </dialog>
    </div>
  );
}

/** Pendant le chargement, et pour les moteurs de recherche : la grille complète, sans filtre. */
export function CatalogFallback({ products }: { products: Product[] }) {
  return <div className="grid">{products.map((p) => <ProductCard key={p.slug} product={p} />)}</div>;
}
