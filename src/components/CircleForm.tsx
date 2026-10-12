"use client";

import { useCart } from "./CartProvider";

// Pas encore de backend : on ne fait pas semblant d'enregistrer l'inscription.
// À brancher : captcha Turnstile + double opt-in + preuve de consentement (table consents).
export function CircleForm() {
  const { toast } = useCart();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        toast("Inscriptions bientôt ouvertes : rien n'a été envoyé.");
      }}
    >
      <label className="sr-only" htmlFor="circle-contact">
        Ton e-mail ou ton numéro WhatsApp
      </label>
      <input id="circle-contact" name="contact" type="text" autoComplete="email" placeholder="Ton e-mail ou WhatsApp" />
      <button className="pill solid" type="submit">
        Rejoindre
      </button>
    </form>
  );
}
