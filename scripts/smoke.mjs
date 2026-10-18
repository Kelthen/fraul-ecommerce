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

await check("page marques : pastilles, recherche", async () => {
  await page.goto(BASE + "/marques", { waitUntil: "networkidle" });
  const n = await page.locator(".bround").count();
  if (n < 30) throw new Error(`${n} pastilles seulement`);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (wide) throw new Error("la page déborde en largeur");
  await shot("02b-marques");
  await page.locator("#brand-q").fill("trav");
  if ((await page.locator(".bround").count()) !== 1) throw new Error("la recherche ne filtre pas");
  await page.locator(".bround").first().click();
  await page.waitForURL("**/marques/travis-scott");
});

await check("fiche produit avec photos (face, dos, détail) et propositions", async () => {
  await page.goto(BASE + "/produit/nike-techfleece-noir-gris-veste", { waitUntil: "networkidle" });
  const img = page.locator(".gal-slide img").first();
  if (!(await img.evaluate((el) => el.complete && el.naturalWidth > 0))) throw new Error("photo de face non chargée");
  await page.getByRole("button", { name: "Dos", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".gal-count")?.textContent === "2 / 3");
  await page.getByRole("button", { name: "Détail", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".gal-count")?.textContent === "3 / 3");
  await page.locator(".gal-slide").nth(2).locator(".gal-zoom").click();
  if (!(await page.locator(".gal-track.zoomed").count())) throw new Error("toucher la photo ne zoome pas");
  await shot("04b-produit-photos-zoom");
  const n = await page.locator(".grid.rel .card").count();
  if (n < 6 || n > 12) throw new Error(`${n} propositions sous la fiche`);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (wide) throw new Error("la fiche déborde en largeur");
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

await check("crée ta tenue", async () => {
  await page.goto(BASE + "/tenue", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Bas" }).click();
  await page.locator(".piece").nth(2).click();
  await shot("07-tenue");
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
// Le nombre de boutiques est lu dans le compteur « Boutique 01 / 31 » (il suit la liste des marques).
const goShop = (k) => page.locator("#walk").evaluate((el, k) => {
  const n = Number(el.querySelector("#count").textContent.split("/")[1]) || 31;
  const track = el.querySelector("#walkTrack");
  el.scrollTop = ((k + 1 + 0.1) / (n + 1)) * (track.offsetHeight - el.clientHeight);
}, k);

await check("fraul walk : mall en T, 31 boutiques", async () => {
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
  await goShop(30);                                       // 31e et dernière boutique : une des 4 nouvelles marques
  await page.waitForTimeout(1800);
  const last = await page.locator("#bname").innerText(), count = await page.locator("#count").innerText();
  if (!/31/.test(count) || last.toLowerCase() !== "travis scott") throw new Error(`dernière boutique : ${last} (${count})`);
  await shot("10e-walk-31e-boutique");
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

await check("retour : fiche en grand → zoom → rayon → boutique → mall → page précédente", async () => {
  const box = await page.locator("#gl").boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.42);
  await page.locator("#sBottom:not([hidden])").waitFor({ timeout: 20000 });
  if (!(await page.locator("#walk").evaluate((el) => el.inert))) throw new Error("mall non inerte sous la boutique");
  await page.locator("#sCats .s-cat").nth(0).click();
  await page.locator("#sInfo:not([hidden])").waitFor({ timeout: 20000 });
  await page.locator("#iPage").click();
  await page.locator("#fiche:not([hidden])").waitFor({ timeout: 5000 });
  if (!(await page.locator("#store").evaluate((el) => el.inert))) throw new Error("boutique non inerte sous la fiche");
  if ((await page.locator("#fiche .f-rel li").count()) < 6) throw new Error("pas assez de propositions sous la fiche");
  await back();
  await page.locator("#fiche").waitFor({ state: "hidden", timeout: 5000 });
  if (await page.locator("#sInfo").isHidden()) throw new Error("retour a fermé le rayon au lieu de la fiche");
  await page.locator("#iClose").click();
  if ((await page.locator("#iClose").textContent()) !== "Ranger") throw new Error("zoom non ouvert");
  await back();
  if ((await page.locator("#iClose").textContent()) !== "Tourner") throw new Error("retour n'a pas rangé le zoom");
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

await check("entrer et sortir sans attendre (fondu, pas de marche), trajet court vers un rayon", async () => {
  await page.goto(BASE + "/walk/amiri", { waitUntil: "networkidle" });
  await page.locator("#aisle:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);
  const before = await page.locator("#bname").innerText();
  let t = Date.now();
  await page.locator("#enter").click();
  await page.locator("#sBottom:not([hidden])").waitFor({ timeout: 20000 });
  const tIn = Date.now() - t;
  t = Date.now();
  await page.locator("#sCats .s-cat").first().click();
  await page.locator("#sInfo:not([hidden])").waitFor({ timeout: 20000 });
  const tRayon = Date.now() - t;
  await page.locator("#sQuit").click();
  t = Date.now();
  await page.locator("#store").waitFor({ state: "hidden", timeout: 20000 });
  const tOut = Date.now() - t;
  const after = await page.locator("#bname").innerText();
  if (after !== before) throw new Error(`en sortant : vitrine ${after}, attendu ${before}`);
  // Seuils larges : le navigateur de test dessine la 3D sans carte graphique (bien plus lent qu'un téléphone).
  if (tIn > 1200 || tRayon > 1500 || tOut > 800) throw new Error(`trop lent : entrer ${tIn} ms, rayon ${tRayon} ms, sortir ${tOut} ms`);
  console.log(`     entrer ${tIn} ms · rayon ${tRayon} ms · sortir ${tOut} ms`);
});

await check("lien direct vers une boutique du mall", async () => {
  await page.goto(BASE + "/walk/amiri", { waitUntil: "networkidle" });
  await page.locator("#aisle:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1800);
  const name = await page.locator("#bname").innerText();
  if (name !== "Amiri") throw new Error(`boutique affichée : ${name}`);
  await shot("13-devant-amiri");
});

await check("boutique d'une nouvelle marque (dans le mall), avec peu d'articles", async () => {
  await page.goto(BASE + "/walk/travis-scott", { waitUntil: "networkidle" });   // devant sa vitrine
  await page.locator("#aisle:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1800);
  const name = await page.locator("#bname").innerText();
  if (name.toLowerCase() !== "travis scott") throw new Error(`vitrine affichée : ${name}`);
  const box = await page.locator("#gl").boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.42);    // toucher la vitrine = entrer
  await page.locator("#sCats .s-cat").first().waitFor({ state: "visible", timeout: 20000 });
  const rayons = await page.locator("#sCats .s-cat").allTextContents();
  if (rayons.join() !== "Hoodies et sweats") throw new Error(`rayons affichés : ${rayons.join(", ")}`);
  await page.locator("#sCats .s-cat").first().click();
  await page.locator("#sInfo:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await shot("14-boutique-travis-scott");
  const cut = await page.evaluate(() => [...document.querySelectorAll("#sInfo .s-act > *, #iPrice")].some((el) => el.getBoundingClientRect().right > innerWidth + 1));
  if (cut) throw new Error("un bouton ou le prix sort de l'écran");
  // Toucher l'article devant soi = la fiche en grand, avec toutes ses photos.
  const b2 = await page.locator("#sgl").boundingBox();
  await page.mouse.click(b2.x + b2.width / 2, b2.y + b2.height * 0.4);
  await page.locator("#fiche:not([hidden])").waitFor({ timeout: 5000 });
  if ((await page.locator("#fiche .gal-slide img").count()) < 2) throw new Error("la fiche n'a pas face et dos");
  await page.waitForTimeout(500); // fin de l'animation d'ouverture
  await shot("15-fiche-en-grand");
  await page.locator("#fiche .thumbs button").nth(1).click();
  await page.waitForFunction(() => document.querySelector("#fiche .gal-count")?.textContent?.startsWith("2 /"));
  await page.locator("#fiche .f-body").evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
  await shot("16-fiche-propositions");
  const first = await page.locator("#fName").textContent();
  await page.locator("#fiche .f-rel li button").first().click();
  await page.waitForFunction((t) => document.querySelector("#fName")?.textContent !== t, first);
});

await browser.close();
console.log(results.join("\n"));
console.log(errors.length ? `\nErreurs navigateur :\n${[...new Set(errors)].join("\n")}` : "\nAucune erreur navigateur.");
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
