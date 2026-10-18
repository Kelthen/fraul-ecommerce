import type { CategoryId } from "@/lib/catalog";
import { GARMENT_PATHS } from "@/lib/catalog/art";
import { DARK } from "@/lib/catalog/demo";

// Dessins provisoires, en attendant les vraies photos détourées (face / dos).
// Repris de la démo V2 pour garder le même rendu partout (site et Fraul Walk).

type Props = {
  type: CategoryId;
  color: string;
  accent: string;
  back?: boolean;
  /** Mot imprimé au dos (nom de la marque, en texte). */
  word?: string;
  className?: string;
  label?: string;
};

export function GarmentArt({ type, color, accent, back = false, word, className, label }: Props) {
  const stroke = DARK.includes(color) ? "rgba(234,224,200,.22)" : "rgba(0,0,0,.25)";
  const a = accent;
  const mirror = back && (type === "sneaker" || type === "cap");
  return (
    <svg
      viewBox="0 0 100 110"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id="shd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".10" />
          <stop offset=".55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".38" />
        </linearGradient>
      </defs>
      <g transform={mirror ? "translate(100 0) scale(-1 1)" : undefined}>
        <path d={GARMENT_PATHS[type]} fill={color} stroke={stroke} strokeWidth={1} />
        <path d={GARMENT_PATHS[type]} fill="url(#shd)" />
        {type === "tee" &&
          (back ? (
            <>
              <path d="M42 5 Q50 8 58 5" fill="none" stroke={a} strokeWidth={2.2} />
              {word && <BackWord word={word} color={a} y={46} />}
            </>
          ) : (
            <>
              <path d="M42 4 Q50 13 58 4" fill="none" stroke={a} strokeWidth={2.2} />
              <rect x={57} y={28} width={9} height={6} rx={1} fill={a} opacity={0.85} />
            </>
          ))}
        {type === "hoodie" &&
          (back ? (
            <>
              <path d="M34 10 Q50 30 66 10" fill="none" stroke={a} strokeWidth={2} />
              {word && <BackWord word={word} color={a} y={56} />}
            </>
          ) : (
            <>
              <path d="M38 10 Q50 27 62 10" fill="none" stroke={a} strokeWidth={2} />
              <path d="M46 22 V36 M54 22 V36" stroke={a} strokeWidth={1.4} />
              <path d="M36 74 H64 L68 92 H32 Z" fill="none" stroke={a} strokeWidth={1.4} opacity={0.6} />
            </>
          ))}
        {type === "pants" && (
          <>
            <path d="M26 13 H74" stroke={a} strokeWidth={2} />
            {back ? (
              <g fill="none" stroke={a} strokeWidth={1.2} opacity={0.6}>
                <rect x={31} y={22} width={12} height={12} />
                <rect x={57} y={22} width={12} height={12} />
              </g>
            ) : (
              <path d="M50 13 V30" stroke={a} strokeWidth={1.2} opacity={0.6} />
            )}
          </>
        )}
        {type === "sneaker" && (
          <>
            <path d="M8 76 H96 V84 Q96 89 90 89 H13 Q8 89 8 84 Z" fill={a} />
            <path d="M40 56 L46 52 M44 60 L51 55 M48 63 L56 58" stroke={a} strokeWidth={2} strokeLinecap="round" />
          </>
        )}
        {type === "cap" && (
          <>
            <path d="M50 34 V74 M30 40 Q36 58 34 74 M70 40 Q66 58 68 74" fill="none" stroke={a} strokeWidth={1.3} opacity={0.6} />
            <circle cx={50} cy={35} r={2.6} fill={a} />
            {back ? <rect x={42} y={66} width={16} height={5} fill={a} /> : <rect x={40} y={52} width={16} height={7} rx={1} fill={a} opacity={0.85} />}
          </>
        )}
        {type === "jacket" && (
          <>
            <path d="M50 16 V106" stroke={a} strokeWidth={1.6} />
            {!back && <path d="M32 70 H44 M56 70 H68" stroke={a} strokeWidth={1.4} opacity={0.6} />}
            {back && word && <BackWord word={word} color={a} y={50} />}
          </>
        )}
        {type === "shorts" && (
          <>
            <path d="M24 27 H76" stroke={a} strokeWidth={2} />
            {!back && <path d="M50 27 V40" stroke={a} strokeWidth={1.2} opacity={0.6} />}
          </>
        )}
        {type === "socks" && <path d="M38 16 H62 M38 22 H62" stroke={a} strokeWidth={2} />}
        {type === "glasses" && (
          <path d="M44 54 Q50 48 56 54 M8 52 L2 46 M92 52 L98 46" fill="none" stroke={a} strokeWidth={2} strokeLinecap="round" />
        )}
        {type === "watch" && (
          <>
            <circle cx={50} cy={55} r={15} fill="none" stroke={a} strokeWidth={1.4} />
            <path d="M50 55 V45 M50 55 L57 59" stroke={a} strokeWidth={1.8} strokeLinecap="round" />
          </>
        )}
        {type === "bag" && (
          <>
            <path d="M26 48 C26 18 74 18 74 48" fill="none" stroke={a} strokeWidth={3} />
            <path d="M20 60 H80" stroke={a} strokeWidth={1.6} />
            {!back && <rect x={44} y={70} width={12} height={8} rx={1} fill={a} opacity={0.85} />}
          </>
        )}
      </g>
    </svg>
  );
}

function BackWord({ word, color, y }: { word: string; color: string; y: number }) {
  return (
    <text
      x={50}
      y={y}
      textAnchor="middle"
      fill={color}
      fontFamily="var(--font-serif), Georgia, serif"
      fontWeight={700}
      fontSize={word.length > 9 ? 6 : 8}
      letterSpacing={0.6}
    >
      {word.toUpperCase()}
    </text>
  );
}
