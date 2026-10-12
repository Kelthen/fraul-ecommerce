import type { MetadataRoute } from "next";
import { SITE_LIVE, SITE_URL } from "@/lib/format";

// Tant que le site n'est pas lancé (NEXT_PUBLIC_SITE_LIVE), on bloque l'indexation.
export default function robots(): MetadataRoute.Robots {
  if (!SITE_LIVE) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/panier", "/walk/"] }, sitemap: `${SITE_URL}/sitemap.xml` };
}
