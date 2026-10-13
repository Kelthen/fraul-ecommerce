"use client";

import { GROUPS, MIN_MARGIN_PCT, ZONES, type GroupId, type ZoneId } from "@/models/pricing/config";
import { catalogPrice, floorPrice, type Cost } from "@/models/pricing/price";
import { usePricing } from "./PricingProvider";

type Item = { slug: string; name: string; cost: Cost };

/** Vue de la page /test/prix : choix zone + groupe, et détail du calcul pour quelques articles. */
export function PricingTester({ items }: { items: Item[] }) {
  const { zone, group, price, format, setTest } = usePricing();
  return (
    <div style={{ display: "grid", gap: 22, marginTop: 22 }}>
      <fieldset className="chips" aria-label="Zone (devise)">
        <legend className="eyebrow">Zone (devise)</legend>
        {(Object.keys(ZONES) as ZoneId[]).map((z) => (
          <button key={z} type="button" className="pill ghost" aria-pressed={zone === z} onClick={() => setTest(z, group)}>
            {ZONES[z].currency}
          </button>
        ))}
      </fieldset>
      <fieldset className="chips" aria-label="Groupe du client">
        <legend className="eyebrow">Groupe du client</legend>
        {(Object.keys(GROUPS) as GroupId[]).map((g) => (
          <button key={g} type="button" className="pill ghost" aria-pressed={group === g} onClick={() => setTest(zone, g)}>
            {GROUPS[g].label} {GROUPS[g].discountPct ? `−${GROUPS[g].discountPct} %` : ""}
          </button>
        ))}
      </fieldset>
      <table className="price-table">
        <thead>
          <tr><th>Article</th><th>Catalogue</th><th>Plancher (+{MIN_MARGIN_PCT} %)</th><th>Prix du client</th></tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.slug}>
              <td>{it.name}</td>
              <td>{format(catalogPrice(it.cost, zone))}</td>
              <td>{format(floorPrice(it.cost, zone))}</td>
              <td><b>{format(price(it.cost))}</b></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="link" style={{ justifySelf: "start" }} onClick={() => setTest(null, null)}>
        Revenir à la vraie zone, sans groupe
      </button>
    </div>
  );
}
