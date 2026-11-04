import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

// Politique de sécurité du contenu : tout vient du site lui-même (polices
// auto-hébergées, three.js dans le bundle). Seules exceptions : Supabase Auth
// (comptes, photos des articles ajoutés depuis l'admin) et le captcha Turnstile de Cloudflare.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://rqrdccsxyyufqlenmpct.supabase.co";
const turnstile = "https://challenges.cloudflare.com";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${turnstile}${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase}`,
  "font-src 'self'",
  `connect-src 'self' ${supabase}${dev ? " ws:" : ""}`,
  `frame-src ${turnstile}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
];

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_LIVE_SITE: process.env.VERCEL_ENV === "production" ? "1" : "" },
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async redirects() {
    // « Chapeaux » est devenu « Casquettes » (oct. 2026) : les anciens liens restent valables.
    return [{ source: "/categorie/chapeaux", destination: "/categorie/casquettes", permanent: true }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
