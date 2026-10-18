// Bouton retour du téléphone ↔ couches du Walk (annuaire, boutique, rayon, zoom).
// Chaque couche ouverte ajoute une entrée d'historique (même URL) : « retour » ferme la couche du dessus.
// La pile (models/layers.ts) fait foi ; l'historique la suit.
import { createLayerStack, type Layer } from "../models/layers.ts";

type Options = {
  /** Vrai quand le Walk est démonté : on ne touche plus à l'historique. */
  isDead: () => boolean;
  /** Appelé après chaque retour du téléphone (pour remettre le focus à jour). */
  onBack?: () => void;
  /** Coupe l'écouteur quand le Walk est démonté. */
  signal: AbortSignal;
};

export function connectHistory({ isDead, onBack, signal }: Options) {
  const layers = createLayerStack();
  // Profondeur actuelle de l'historique ; à l'arrivée sur une entrée laissée par une visite
  // précédente (retour depuis une fiche produit), sync() la nettoie.
  let depth = (history.state && history.state.fw) || 0;
  let pending = false;

  function sync() {
    if (pending || isDead()) return; // un retour lancé par nous est en route
    while (depth < layers.size) history.pushState({ fw: ++depth }, "");
    if (depth > layers.size) {
      pending = true;
      history.go(layers.size - depth);
    }
  }

  window.addEventListener(
    "popstate",
    (e) => {
      const d = (e.state && e.state.fw) || 0;
      depth = d;
      if (pending) pending = false;
      else layers.shutTo(d);
      sync();
      onBack?.();
    },
    { signal },
  );

  return {
    has: layers.has,
    sync,
    open(name: string, close: Layer["close"]) { if (layers.open(name, close)) sync(); },
    close(name: string) { if (layers.close(name)) sync(); },
    drop(name: string) { if (layers.drop(name)) sync(); },
  };
}
