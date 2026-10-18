// Test de fumée sur viewport téléphone (règle 7 de CLAUDE.md).
// Usage : npm run build && npm start (dans un autre terminal), puis
//         node scripts/smoke.mjs [url] [dossier-captures]
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "smoke-shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const results = [];
async function check(name, fn) {
  try { await fn(); results.push(`OK   ${name}`); } catch (e) { results.push(`FAIL ${name} — ${e.message.split("\n")[0]}`); }
}

await check("accueil", async () => {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1 }).waitFor();
  await shot("01-accueil");
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(400);
  await shot("02-accueil-nouveautes");
});

await check("aucun pays affiché", async () => {
  const text = await page.locator("body").innerText();
  const found = ["Canada", "USA", "Royaume-Uni", "France", "Belgique", "Afrique", "CA$"].filter((w) => text.includes(w));
  if (found.length) throw new Error(`mots trouvés : ${found.join(", ")}`);
});

await check("fiche produit avec photos (face, dos, détail)", async () => {
  await page.goto(BASE + "/produit/nike-techfleece-noir-gris-veste", { waitUntil: "networkidle" });
  const img = page.locator(".pdp-stage.photo img");
  if (!(await img.evaluate((el) => el.complete && el.naturalWidth > 0))) throw new Error("photo de face non chargée");
  await page.getByRole("button", { name: "Dos" }).click();
  await page.getByRole("button", { name: "Détail" }).click();
  await shot("04b-produit-photos");
});

await check("fiche produit + panier", async () => {
  await page.goto(BASE + "/marques/trapstar", { waitUntil: "networkidle" });
  await shot("03-marque");
  await page.locator(".card:not(:has(.photo))").first().click(); // produit dessiné (démo)
  await page.getByRole("button", { name: "Au panier" }).waitFor();
  await shot("04-produit");
  await page.getByRole("button", { name: "Tourner l'article" }).first().click();
  await page.waitForTimeout(700);
  await shot("05-produit-dos");
  await page.getByRole("button", { name: "Au panier" }).click();
  await page.goto(BASE + "/panier", { waitUntil: "networkidle" });
  await page.locator(".cart-item").first().waitFor();
  await shot("06-panier");
});

await check("crée ta tenue : liste sans 3D, montre, short + chaussettes", async () => {
  await page.goto(BASE + "/tenue", { waitUntil: "networkidle" });
  if (await page.locator(".outfit-3d canvas").count()) throw new Error("la 3D se charge sans qu'on la demande");
  await page.getByRole("tab", { name: /Montre/ }).click();
  await page.locator(".piece").first().click();
  await page.getByRole("tab", { name: /Pantalon ou short/ }).click();
  await page.getByRole("button", { name: /Short/ }).first().click();
  await page.getByRole("tab", { name: /Chaussettes/ }).waitFor();          // le short active les chaussettes
  const photo = page.locator(".outfit-left .pdp-stage.photo img");         // la vraie photo du short, en grand
  await photo.waitFor();
  if (!(await photo.evaluate((el) => el.complete && el.naturalWidth > 0))) throw new Error("photo du short non chargée");
  await shot("07-tenue-liste");
});

await check("crée ta tenue : mannequin 3D et zoom sur la montre", async () => {
  await page.getByRole("button", { name: "Mannequin 3D" }).click();
  await page.locator(".outfit-3d[data-ready]").waitFor({ timeout: 20000 });
  await page.getByRole("tab", { name: /Montre/ }).click();
  await page.waitForTimeout(1500);
  await shot("07b-tenue-3d-montre");
  await page.getByRole("button", { name: "Vue d'ensemble" }).click();
  await page.waitForTimeout(1500);
  await shot("07c-tenue-3d-ensemble");
});

await check("suivi", async () => {
  await page.goto(BASE + "/suivi", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Suivre" }).click();
  await page.waitForTimeout(1800);
  await shot("08-suivi");
});

await check("prix : devise de la zone, groupe de test, ligne de confirmation", async () => {
  await page.goto(BASE + "/marques/trapstar", { waitUntil: "networkidle" });
  const usd = await page.locator(".card .pr").first().innerText();
  if (!/\d.*USD$/.test(usd.trim())) throw new Error(`prix par défaut inattendu : ${usd}`);
  await page.goto(BASE + "/test/prix", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "EUR", exact: true }).click();
  await page.getByRole("button", { name: /VIP/ }).click();
  await shot("15-test-prix");
  await page.goto(BASE + "/marques/trapstar", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector(".card .pr")?.textContent?.includes("EUR"), null, { timeout: 5000 });
  await page.locator(".card").first().click();
  await page.getByText("Prix personnalisé pour ton compte.").waitFor({ timeout: 5000 });
  await page.getByText(/Droits et taxes inclus\. Prix final confirmé selon l'adresse de livraison\./).first().waitFor();
  await shot("16-produit-prix-eur-vip");
  const text = await page.locator("body").innerText();
  const found = ["Canada", "USA", "Royaume-Uni", "France", "Belgique", "CA$", "$CA", "US$"].filter((w) => text.includes(w));
  if (found.length) throw new Error(`pays ou devise nationale affichés : ${found.join(", ")}`);
  await page.goto(BASE + "/test/prix", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Revenir à la vraie zone/ }).click();
});

// Va à la boutique k (0 = première) en faisant défiler le mall comme un visiteur.
const goShop = (k, n = 27) => page.locator("#walk").evaluate((el, [k, n]) => {
  const track = el.querySelector("#walkTrack");
  el.scrollTop = ((k + 1 + 0.1) / (n + 1)) * (track.offsetHeight - el.clientHeight);
}, [k, n]);

await check("fraul walk : mall en T", async () => {
  await page.goto(BASE + "/walk", { waitUntil: "networkidle" });
  await page.locator("#walk:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(2500);
  await shot("09-walk-entree");
  if (await page.locator("#walk.nogl").count()) throw new Error("WebGL indisponible (mode de secours)");
  for (const [k, name] of [[0, "10-walk-boutique-01"], [5, "10b-walk-boutique-06"], [13, "10c-walk-mur-du-haut"], [24, "10d-walk-retour-tronc"]]) {
    await goShop(k);
    await page.waitForTimeout(1800);
    await shot(name);
  }
  const shown = await page.locator("#bname").innerText();
  if (!shown) throw new Error("nom de boutique vide");
});

await check("fraul walk : toucher la vitrine pour entrer", async () => {
  await goShop(1);
  await page.waitForTimeout(1800);
  const box = await page.locator("#gl").boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.42);
  await page.locator("#sBottom:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);
  await shot("11-boutique");
});

await check("fraul walk : rayon puis retour en arrière", async () => {
  await page.locator("#sCats .s-cat").nth(1).click();
  await page.locator("#sInfo:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await shot("12-rayon");
  await page.locator("#iAdd").click();
  await page.mouse.move(195, 400);
  await page.mouse.wheel(0, -300);                 // arrière : retour au centre
  await page.locator("#sBottom:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.mouse.wheel(0, -300);                 // arrière au centre : on sort
  await page.locator("#store").waitFor({ state: "hidden", timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot("12b-sorti-de-la-boutique");
});

await check("fraul walk : sortie du mall", async () => {
  await page.locator("#walk").evaluate((el) => (el.scrollTop = el.scrollHeight));
  await page.locator("#outro:not([hidden])").waitFor({ timeout: 10000 });
  await page.waitForTimeout(1500);
  await shot("12c-sortie");
});

// Bouton retour du téléphone (page.goBack) : chaque retour ferme la couche du dessus, puis quitte le Walk.
const back = async () => { await page.goBack({ timeout: 10000 }).catch(() => {}); await page.waitForTimeout(400); };
await check("retour : annuaire, focus piégé, Échap", async () => {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.goto(BASE + "/walk", { waitUntil: "networkidle" });
  await page.locator("#walk:not([hidden])").waitFor({ timeout: 20000 });
  await goShop(1);
  await page.waitForTimeout(1500);
  await page.locator("#dirBtn").click();
  await page.locator("#dir:not([hidden])").waitFor();
  if (!(await page.locator("#walk").evaluate((el) => el.inert))) throw new Error("fond non inerte");
  for (let i = 0; i < 40; i++) await page.keyboard.press("Tab");
  if (!(await page.evaluate(() => document.querySelector("#dir").contains(document.activeElement)))) throw new Error("le focus sort de l'annuaire");
  await back();
  await page.locator("#dir").waitFor({ state: "hidden", timeout: 5000 });
  if (!page.url().endsWith("/walk")) throw new Error(`retour a quitté le Walk : ${page.url()}`);
  await page.locator("#dirBtn").click();
  await page.locator("#dir:not([hidden])").waitFor();
  await page.keyboard.press("Escape");
  await page.locator("#dir").waitFor({ state: "hidden", timeout: 5000 });
  if (!(await page.evaluate(() => document.activeElement?.id === "dirBtn"))) throw new Error("focus non rendu au bouton d'origine");
  await page.waitForTimeout(600);
});

await check("retour : zoom → rayon → boutique → mall → page précédente", async () => {
  const box = await page.locator("#gl").boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.42);
  await page.locator("#sBottom:not([hidden])").waitFor({ timeout: 20000 });
  if (!(await page.locator("#walk").evaluate((el) => el.inert))) throw new Error("mall non inerte sous la boutique");
  await page.locator("#sCats .s-cat").nth(0).click();
  await page.locator("#sInfo:not([hidden])").waitFor({ timeout: 20000 });
  await page.locator("#iClose").click();
  if ((await page.locator("#iClose").textContent()) !== "Ranger") throw new Error("zoom non ouvert");
  await back();
  if ((await page.locator("#iClose").textContent()) !== "Zoom") throw new Error("retour n'a pas rangé le zoom");
  if (await page.locator("#sInfo").isHidden()) throw new Error("retour a fermé le rayon au lieu du zoom");
  await back();
  await page.locator("#sBottom:not([hidden])").waitFor({ timeout: 20000 });
  await shot("14-retour-centre-boutique");
  await back();
  await page.locator("#store").waitFor({ state: "hidden", timeout: 20000 });
  if (!page.url().endsWith("/walk")) throw new Error(`retour a quitté le Walk : ${page.url()}`);
  await page.waitForTimeout(800);
  await back();
  await page.waitForURL((u) => !u.pathname.startsWith("/walk"), { timeout: 10000 });
});

await check("lien direct vers une boutique du mall", async () => {
  await page.goto(BASE + "/walk/amiri", { waitUntil: "networkidle" });
  await page.locator("#aisle:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1800);
  const name = await page.locator("#bname").innerText();
  if (name !== "Amiri") throw new Error(`boutique affichée : ${name}`);
  await shot("13-devant-amiri");
});

await check("boutique d'une marque hors du mall, avec peu d'articles", async () => {
  await page.goto(BASE + "/walk/travis-scott", { waitUntil: "networkidle" });
  await page.locator("#sCats .s-cat").first().waitFor({ state: "visible", timeout: 20000 });
  const rayons = await page.locator("#sCats .s-cat").allTextContents();
  if (rayons.join() !== "Hoodies et sweats") throw new Error(`rayons affichés : ${rayons.join(", ")}`);
  await page.locator("#sCats .s-cat").first().click();
  await page.locator("#sInfo:not([hidden])").waitFor({ timeout: 20000 });
  await shot("14-boutique-travis-scott");
});

await browser.close();
console.log(results.join("\n"));
console.log(errors.length ? `\nErreurs navigateur :\n${[...new Set(errors)].join("\n")}` : "\nAucune erreur navigateur.");
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
