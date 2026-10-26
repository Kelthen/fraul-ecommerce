// Garde-fou « code propre » (L-51) : refuse une classe CSS qui n'est plus utilisée nulle part dans src/.
// Les classes fabriquées dans le code (`seen-${g}`, `cf-${k}`, `pile-${id}` du tableau des commandes) sont déclarées dans DYNAMIC.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const CSS = ["src/app/globals.css", "src/walk/walk.css"];
const DYNAMIC = [/^seen-/, /^cf-/, /^pile-/];

const files = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : [p]; });
const code = files("src").filter((f) => /\.(tsx?|js)$/.test(f)).map((f) => readFileSync(f, "utf8")).join("\n");
const used = (c) => new RegExp(`(?<![\\w-])${c.replace(/[-]/g, "\\-")}(?![\\w-])`).test(code);

const dead = CSS.flatMap((f) => {
  const css = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/url\([^)]*\)/g, "");
  const names = new Set([...css.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((m) => m[1]));
  return [...names].filter((c) => !DYNAMIC.some((r) => r.test(c)) && !used(c)).map((c) => `${f} : .${c}`);
});
if (dead.length) { console.error(`Classes CSS inutilisées (à supprimer) :\n${dead.join("\n")}`); process.exit(1); }
console.log("CSS : aucune classe morte.");
