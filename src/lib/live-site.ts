// Vrai si le site tourne en production. Sert à cacher les « [À FOURNIR] » devant les clients, jamais les manques
// légaux (mentions, CGV, confidentialité) : ceux-là restent visibles tant qu'ils ne sont pas remplis.
export const LIVE_SITE = process.env.NEXT_PUBLIC_LIVE_SITE === "1";
