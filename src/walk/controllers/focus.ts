// Fenêtres du Walk (conciergerie, fiche en grand, annuaire, boutique) : fond inerte, Tab bouclé dans la fenêtre du dessus,
// focus rendu au bouton d'où l'on vient à la fermeture.

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
const visible = (el: Element) => el.getClientRects().length > 0;

type Els = { root: HTMLElement; walk: HTMLElement; store: HTMLElement; dir: HTMLElement; sheets: HTMLElement[]; signal: AbortSignal };

export function createFocusController({ root, walk, store, dir, sheets, signal }: Els) {
  /** Panneau du dessus (conciergerie, fiche en grand) s'il y en a un d'ouvert. */
  const sheet = () => sheets.find((el) => !el.hidden) ?? null;
  /** Fenêtre ouverte du dessus : un panneau, puis l'annuaire, puis la boutique. */
  const top = () => sheet() ?? (!dir.hidden ? dir : !store.hidden ? store : null);

  /** Rend inerte tout ce qui est sous la fenêtre ouverte. */
  function update() {
    const f = !!sheet(), d = !dir.hidden, s = !store.hidden;
    walk.inert = f || d || s;
    store.inert = f || (d && s);
    dir.inert = f && d;
  }

  window.addEventListener(
    "keydown",
    (e) => {
      const m = top();
      if (e.key !== "Tab" || !m) return;
      const els = [...m.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !(el as HTMLButtonElement).disabled && visible(el));
      if (!els.length) { e.preventDefault(); return; }
      const first = els[0], last = els[els.length - 1], a = document.activeElement;
      if (e.shiftKey && (a === first || !m.contains(a))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || !m.contains(a))) { e.preventDefault(); first.focus(); }
    },
    { signal },
  );

  return {
    update,
    /** Élément qui a le focus au moment d'ouvrir une fenêtre (pour le lui rendre ensuite). */
    opener(): HTMLElement | null {
      const a = document.activeElement;
      return a instanceof HTMLElement && a !== document.body && root.contains(a) ? a : null;
    },
    /** Rend le focus à `el` s'il est encore là et visible, sinon à `fallback`. */
    giveBack(el: HTMLElement | null, fallback: HTMLElement | null) {
      const t = el && el.isConnected && visible(el) && !el.closest("[inert]") ? el : fallback;
      if (t && visible(t)) t.focus({ preventScroll: true });
    },
  };
}
