import Link from "next/link";
import type { Brand } from "@/lib/catalog";
import { signCss, signWord } from "@/lib/catalog/brands";

// Pastille d'une marque : son nom en texte, avec le style de son enseigne (jamais le logo déposé).
// Changer l'apparence des pastilles, c'est ici (et .btile / .bround dans globals.css).
//   variant="card"  : pavé rectangulaire (accueil)
//   variant="round" : pastille ronde (page Marques, comme la grille du fournisseur)

export function BrandTile({ brand, variant = "card" }: { brand: Brand; variant?: "card" | "round" }) {
  const st = brand.style;
  const word = signWord(st);
  if (variant === "round") {
    // Taille du texte relative au diamètre (unités cqi) : au plus 2 lignes, les noms longs rétrécissent.
    const longest = Math.max(...word.split(" ").map((w) => w.length));
    const fitLen = Math.max(longest, Math.ceil(word.length / 2), 4);
    const size = 78 / (fitLen * (0.66 + st.sp));
    return (
      <Link className="bround" href={`/marques/${brand.slug}`} aria-label={brand.name} style={{ background: st.bg, color: st.fg }}>
        <span className="wm" style={{ ...signCss(st), fontSize: `clamp(9px, ${size.toFixed(1)}cqi, 26px)` }}>
          {word}
        </span>
      </Link>
    );
  }
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
