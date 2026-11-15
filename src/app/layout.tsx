import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Martian_Mono, Monomakh, Montserrat } from "next/font/google";
import { AccountProvider } from "@/components/AccountProvider";
import { CartProvider } from "@/components/CartProvider";
import { EnviesProvider } from "@/components/EnviesProvider";
import { PricingProvider } from "@/components/PricingProvider";
import { FooterGate, SiteHeader, TabBar } from "@/components/SiteChrome";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_LIVE, SITE_URL } from "@/lib/format";
import "./globals.css";

const serif = Bodoni_Moda({ variable: "--font-serif", subsets: ["latin"], style: ["normal", "italic"], display: "swap" });
const sans = Montserrat({ variable: "--font-sans", subsets: ["latin"], style: ["normal", "italic"], display: "swap" });
// Petits textes d'aide sur les photos (« Touche pour agrandir »), choix de Rhamone du 9 nov. 2026.
const note = Monomakh({ variable: "--font-note", subsets: ["latin"], weight: "400", display: "swap" });
// Titre de l'accueil « Le shopping se visite » : Rhamone veut Sawith Mono (Pekotype, payante, 9 nov.). En attendant
// l'achat de la licence, Martian Mono (gratuite, très proche) — décidé par l'équipe, à confirmer. Avec le fichier de
// Sawith Mono : le poser dans src/app/fonts/ et remplacer cette ligne par next/font/local, même variable.
const titleMono = Martian_Mono({ variable: "--font-title-mono", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "TakeUrClothes — le mall streetwear et luxe", template: "%s · TakeUrClothes" },
  description:
    "Streetwear et luxe 100 % authentiques, une boutique par marque, drops limités et suivi de commande à chaque étape.",
  openGraph: { type: "website", siteName: "TakeUrClothes", locale: "fr_FR" },
  twitter: { card: "summary_large_image" },
  robots: SITE_LIVE ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#FFFEF7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TakeUrClothes",
  url: SITE_URL,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable} ${note.variable} ${titleMono.variable}`}>
      <body>
        <a className="skip" href="#contenu">
          Aller au contenu
        </a>
        <PricingProvider>
          <CartProvider>
            <EnviesProvider>
              <AccountProvider>
                <SiteHeader />
                <main id="contenu">{children}</main>
                <FooterGate>
                  <SiteFooter />
                </FooterGate>
                <TabBar />
              </AccountProvider>
            </EnviesProvider>
          </CartProvider>
        </PricingProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}
