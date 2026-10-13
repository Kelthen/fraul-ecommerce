import { NextResponse, type NextRequest } from "next/server";

// Devine la zone de prix à partir du pays de l'adresse internet (en-tête fourni par Vercel).
// Le pays n'est jamais affiché : seul le cookie `fraul_zone` (us, ca, uk, eu) part vers le navigateur,
// qui affiche la bonne devise. Le paiement recalculera le prix avec l'adresse de livraison.
const ZONE: Record<string, string> = { US: "us", CA: "ca", GB: "uk", FR: "eu", BE: "eu" };

export function proxy(request: NextRequest) {
  const res = NextResponse.next();
  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase();
  const zone = (country && ZONE[country]) || "us";
  if (request.cookies.get("fraul_zone")?.value !== zone)
    res.cookies.set("fraul_zone", zone, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax", secure: true });
  return res;
}

export const config = {
  // Pages seulement : ni fichiers statiques, ni images, ni favicon.
  matcher: ["/((?!_next/|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-z0-9]+$).*)"],
};
