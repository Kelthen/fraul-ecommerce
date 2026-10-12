import Link from "next/link";
import type { Brand } from "@/lib/catalog";
import { signCss, signWord } from "@/lib/catalog/brands";

export function BrandTile({ brand }: { brand: Brand }) {
  const st = brand.style;
  const word = signWord(st);
  // Les noms longs rétrécissent au lieu de passer à la ligne.
  const size = Math.min(26, 150 / (word.length * (0.66 + st.sp)));
  return (
    <Link className="btile" href={`/marques/${brand.slug}`} style={{ background: st.bg, color: st.fg }}>
      <span className="wm" style={{ ...signCss(st), fontSize: `${size.toFixed(1)}px` }}>
        {word}
      </span>
      <small>Entrer dans la boutique</small>
    </Link>
  );
}
