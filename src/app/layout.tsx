import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Forum, Martian_Mono, Monomakh, Montserrat } from "next/font/google";
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
// Titre de l'accueil « Le shopping se visite » et footer : Sawith Mono Light, validée par Rhamone (#115, 10 nov.).
// Sa licence reçue est « usage personnel » : interdit de la publier avant l'achat d'une licence web commerciale.
// En attendant, Martian Mono Light (gratuite, très proche) — décidé par l'équipe, à confirmer. Avec le fichier
// Sawith autorisé : le poser dans src/app/fonts/ et remplacer cette ligne par next/font/local, même variable, poids 300.
const titleMono = Martian_Mono({ variable: "--font-title-mono", subsets: ["latin"], weight: "300", display: "swap" });
// Petit texte sous le titre de l'accueil : Forum Regular, validée par Rhamone (#115). Licence SIL OFL, usage commercial permis.
const lead = Forum({ variable: "--font-lead", subsets: ["latin"], weight: "400", display: "swap" });

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
    <html lang="fr" className={`${serif.variable} ${sans.variable} ${note.variable} ${titleMono.variable} ${lead.variable}`}>
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
