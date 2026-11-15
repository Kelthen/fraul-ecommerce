import "server-only";
import type { LookInput } from "@/models/admin/look";
import { db, eq } from "./db";

// Looks de l'accueil vus et modifiés depuis l'admin (clé service, après vérification de la session).
// La photo est détourée ensuite par le détourage automatique (colonne cutout) ; le look n'apparaît sur l'accueil qu'alors.

export type AdminLook = { id: string; title: string; photo: string; cutout: string | null; items: string[]; onSite: boolean };
type Row = { id: string; title: string; photo: string; cutout: string | null; items: string[]; on_site: boolean };

const toLook = (r: Row): AdminLook => ({ id: r.id, title: r.title, photo: r.photo, cutout: r.cutout, items: r.items, onSite: r.on_site });

export async function listLooks(): Promise<AdminLook[]> {
  return (await db.select<Row>("looks", "select=*&order=position.asc,created_at.desc")).map(toLook);
}

export async function getLook(id: string): Promise<AdminLook | null> {
  const r = await db.one<Row>("looks", `select=*&id=${eq(id)}`);
  return r ? toLook(r) : null;
}

/** Crée ou modifie le look. Une nouvelle photo efface l'ancien détourage (il sera refait). */
export async function saveLook(l: LookInput): Promise<string> {
  const fields = { title: l.title.trim(), photo: l.photo, items: [...new Set(l.items)], on_site: l.onSite };
  if (l.id) {
    const old = await getLook(l.id);
    if (!old) throw new Error("Look introuvable");
    await db.update("looks", `id=${eq(l.id)}`, { ...fields, ...(old.photo !== l.photo ? { cutout: null } : {}) });
    return l.id;
  }
  const [first] = await db.select<{ position: number }>("looks", "select=position&order=position.asc&limit=1");
  const [row] = await db.insert<{ id: string }>("looks", { ...fields, position: (first?.position ?? 0) - 1 });
  return row.id;
}

export async function deleteLook(id: string): Promise<void> {
  await db.remove("looks", `id=${eq(id)}`);
}
