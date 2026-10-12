import type { ReactNode } from "react";

export type LegalSection = { title: string; body: ReactNode };

// Squelettes des pages légales : la structure est prête, le texte final doit
// être rédigé et validé par un juriste avant le lancement.
export function LegalPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro?: ReactNode; sections: LegalSection[] }) {
  return (
    <article className="wrap legal">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="draft">Brouillon : à compléter et à faire valider par un juriste avant la mise en ligne.</p>
      {intro && <p>{intro}</p>}
      {sections.map((s) => (
        <section key={s.title}>
          <h2>{s.title}</h2>
          {s.body}
        </section>
      ))}
    </article>
  );
}

export const Todo = ({ children }: { children: ReactNode }) => <span className="todo">[À FOURNIR : {children}]</span>;
