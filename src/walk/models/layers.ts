// Pile des couches ouvertes dans le Walk (annuaire, boutique, rayon, zoom), sans page ni historique.
// Le contrôleur (engine.js) la relie au bouton retour du téléphone.

export type Layer = { name: string; close: (animate: boolean) => void };

export function createLayerStack() {
  const stack: Layer[] = [];
  const indexOf = (name: string) => stack.findIndex((L) => L.name === name);
  /** Ferme les couches à partir de i, de haut en bas ; seule la dernière fermée est animée. */
  const shutFrom = (i: number) => stack.splice(i).reverse().forEach((L, k, a) => L.close(k === a.length - 1));
  return {
    get size() { return stack.length; },
    has: (name: string) => indexOf(name) >= 0,
    /** Ajoute une couche si elle n'est pas déjà ouverte ; renvoie vrai si ajoutée. */
    open(name: string, close: Layer["close"]) {
      if (indexOf(name) >= 0) return false;
      stack.push({ name, close });
      return true;
    },
    /** Ferme cette couche et celles au-dessus. */
    close(name: string) {
      const i = indexOf(name);
      if (i >= 0) shutFrom(i);
      return i >= 0;
    },
    /** Retire une couche déjà fermée par ailleurs, sans rien rappeler. */
    drop(name: string) {
      const i = indexOf(name);
      if (i >= 0) stack.splice(i, 1);
      return i >= 0;
    },
    /** Ne garde que les `depth` premières couches (retour du téléphone). */
    shutTo(depth: number) { if (depth < stack.length) shutFrom(depth); },
  };
}
