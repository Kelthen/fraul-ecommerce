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

await check("envies : garder une pièce, la retrouver, la retirer", async () => {
  await page.goto(BASE + "/produit/nike-techfleece-noir-gris-veste", { waitUntil: "networkidle" });
  await page.locator(".pdp-envie").click();
  if ((await page.locator(".pdp-envie").getAttribute("aria-pressed")) !== "true") throw new Error("le bouton Envie ne s'allume pas");
  await page.goto(BASE + "/envies", { waitUntil: "networkidle" });
  await page.locator(".envie-card").first().waitFor({ timeout: 5000 });
  await shot("06b-envies");
  await page.locator(".envie-card .envie-btn").first().click();
  await page.locator(".envies-empty").waitFor({ timeout: 5000 });
});

await check("suivi : 4 étapes, fourchette, remboursement, code invalide refusé, e-mails", async () => {
  await page.goto(BASE + "/suivi?code=frl%201031", { waitUntil: "networkidle" });
  await page.locator(".track-eta").waitFor({ timeout: 5000 });
  if ((await page.locator(".steps li").count()) !== 4) throw new Error("le suivi n'a pas 4 étapes");
  if (!/entre le .+ et le /.test(await page.locator(".track-eta").textContent())) throw new Error("pas de fourchette de livraison");
  if ((await page.locator('.steps li[aria-current="step"] b').textContent()) !== "En transit") throw new Error("mauvaise étape en cours");
  if (!(await page.locator(".track-refund").count())) throw new Error("la pièce remboursée n'apparaît pas");
  await shot("06e-suivi");
  await page.fill("#track-code", "ABC");
  await page.getByRole("button", { name: "Suivre" }).click();
  await page.locator("#track-err").waitFor({ timeout: 3000 });
  await page.goto(BASE + "/suivi/e-mails", { waitUntil: "networkidle" });
  await page.locator(".mail").nth(3).waitFor({ timeout: 5000 });
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (wide) throw new Error("les e-mails débordent en largeur");
});

await check("compte (démo) : création avec code, mauvais code refusé, déconnexion", async () => {
  await page.goto(BASE + "/compte", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Créer un compte" }).click();
  await page.locator("input[name=email]").fill("test@exemple.com");
  await page.locator("input[name=password]").fill("court");
  await page.getByRole("button", { name: "Recevoir mon code" }).click();
  if (!(await page.locator(".af-err").count())) throw new Error("mot de passe trop court accepté");
  await page.locator("input[name=password]").fill("Velours-Bordeaux-19");
  await page.getByRole("button", { name: "Recevoir mon code" }).click();
  await page.locator("input[name=code]").fill("000000");
  await page.getByRole("button", { name: "Valider" }).click();
  if ((await page.locator(".af-err").textContent()) !== "Ce code ne correspond pas.") throw new Error("mauvais code accepté");
  await shot("06c-compte-code");
  await page.locator("input[name=code]").fill("246 810");
  await page.getByRole("button", { name: "Valider" }).click();
  await page.locator(".account").waitFor({ timeout: 5000 });
  await shot("06d-mon-compte");
  if ((await page.locator(".order-row").count()) !== 3) throw new Error("Mes commandes : 3 commandes de démo attendues");
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await page.waitForURL(BASE + "/");
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
  // Étapes du parcours (walk-path.ts) : entrée, boutiques avec Fraul Finds après les `conAfter` premières, sortie.
  const stops = Number(el.dataset.stops) || n + 1, after = Number(el.dataset.conAfter ?? Infinity);
  el.scrollTop = ((k + 1 + (k >= after ? 1 : 0) + 0.1) / stops) * (track.offsetHeight - el.clientHeight);
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
  await page.locator("#store[data-mode=\"hub\"]:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);
  // Les mannequins viennent du modèle Blender de Rhamone (25 oct.), pas du dessin de secours.
  if ((await page.locator("[data-mannequin]").getAttribute("data-mannequin")) !== "blender") throw new Error("mannequin Blender non chargé");
  await shot("11-boutique");
});

await check("fraul walk : rayon, défiler ne fait pas sortir, ← revient au centre, ✕ fait sortir", async () => {
  await page.locator("#sCats .s-cat").nth(1).click();
  await page.locator("#sInfo:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await shot("12-rayon");
  // Dans un rayon, sur téléphone : la liste des rayons est repliée derrière « Rayons », le rayon ouvert y est surligné (Rhamone, 22 oct.).
  if (await page.locator("#sCats").isVisible()) throw new Error("dans un rayon, la liste des rayons n'est pas repliée");
  await page.locator("#sTog").click();
  if ((await page.locator("#sCats .s-cat.on").count()) !== 1) throw new Error("dans un rayon, le rayon ouvert n'est pas surligné");
  await shot("12a-rayon-liste-ouverte");
  await page.locator("#sTog").click();
  await page.locator("#iAdd").click();
  // Aucun défilement ne fait sortir d'une boutique (Rhamone, 21 oct.).
  await page.mouse.move(195, 400);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(800);
  if (await page.locator("#sInfo").isHidden()) throw new Error("défiler a fait quitter le rayon");
  if ((await page.locator("#sQuit").getAttribute("aria-label")) !== "Revenir au centre de la boutique") throw new Error("dans un rayon, le bouton du haut n'est pas ←");
  await page.locator("#sQuit").click();            // ← : retour au centre
  await page.locator("#store[data-mode=\"hub\"]:not([hidden])").waitFor({ timeout: 20000 });
  if ((await page.locator("#sCats .s-cat.on").count()) !== 1) throw new Error("le rayon visité n'est pas surligné dans la liste");
  await page.waitForTimeout(600);
  await page.locator("#sQuit").click();            // ✕ : on sort
  await page.locator("#store").waitFor({ state: "hidden", timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot("12b-sorti-de-la-boutique");
});

await check("fraul walk : la Caisse avant la sortie quand le sac n'est pas vide", async () => {
  const n = Number((await page.locator("#count").textContent()).split("/")[1]);
  await page.locator("#walk").evaluate((el, n) => {
    if (Number(el.dataset.stops) !== n + 3) throw new Error(`sac rempli : ${el.dataset.stops} étapes (attendu ${n + 3}, avec la Caisse)`);
    const track = el.querySelector("#walkTrack");
    el.scrollTop = ((n + 2.1) / (n + 3)) * (track.offsetHeight - el.clientHeight);
  }, n);
  await page.locator("#caisse:not([hidden])").waitFor({ timeout: 10000 });
  if (!(await page.locator("#caisse .c-lines li").count())) throw new Error("la Caisse n'affiche pas le contenu du sac");
  await page.waitForTimeout(2500);
  await shot("12c-caisse");
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
  await page.locator("#store[data-mode=\"hub\"]:not([hidden])").waitFor({ timeout: 20000 });
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
  await page.locator("#store[data-mode=\"hub\"]:not([hidden])").waitFor({ timeout: 20000 });
  await shot("14-retour-centre-boutique");
  await back();
  await page.locator("#store").waitFor({ state: "hidden", timeout: 20000 });
  if (!page.url().endsWith("/walk")) throw new Error(`retour a quitté le Walk : ${page.url()}`);
  await page.waitForTimeout(800);
  await back();
  await page.waitForURL((u) => !u.pathname.startsWith("/walk"), { timeout: 10000 });
});

await check("Fraul Finds : une pièce sur demande (page, puis dans le mall)", async () => {
  await page.goto(BASE + "/sur-demande?marque=Nike", { waitUntil: "networkidle" });
  if ((await page.locator("input[name=brand]").inputValue()) !== "Nike") throw new Error("marque non préremplie");
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  if ((await page.locator(".cf-err").count()) < 2) throw new Error("erreurs non affichées (article, e-mail)");
  await page.locator("input[name=item]").fill("Tech Fleece vert sapin");
  await page.locator("input[name=email]").fill("test@exemple.com");
  await shot("17-fraul-finds");
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await page.locator(".concierge-done").waitFor({ timeout: 5000 });
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (wide) throw new Error("la page déborde en largeur");
  await page.goto(BASE + "/walk", { waitUntil: "networkidle" });
  await page.locator("#walk:not([hidden])").waitFor({ timeout: 20000 });
  await page.locator("#walk").evaluate((el) => {   // arrêt Fraul Finds, en haut du tronc
    const track = el.querySelector("#walkTrack"), after = Number(el.dataset.conAfter), stops = Number(el.dataset.stops);
    el.scrollTop = ((after + 1 + 0.1) / stops) * (track.offsetHeight - el.clientHeight);
  });
  await page.locator("#conStop:not([hidden])").waitFor({ timeout: 10000 });
  await page.waitForTimeout(7000); // saut long (vers la 10e boutique) : la caméra glisse jusqu'au comptoir
  await shot("18a-fraul-finds-comptoir");
  // Toucher le comptoir ouvre Fraul Finds, jamais la boutique cachée derrière (retour de Rhamone, 18 oct.)
  const gl = await page.locator("#gl").boundingBox();
  await page.mouse.click(gl.x + gl.width / 2, gl.y + gl.height * 0.41);
  await page.locator("#concierge:not([hidden])").waitFor({ timeout: 5000 });
  if (await page.locator("#store").isVisible()) throw new Error("le comptoir a ouvert une boutique");
  await back();
  await page.locator("#concierge").waitFor({ state: "hidden", timeout: 5000 });
  await page.locator("#conStopBtn").click();
  await page.locator("#concierge:not([hidden])").waitFor({ timeout: 5000 });
  if (!(await page.locator("#walk").evaluate((el) => el.inert))) throw new Error("mall non inerte sous Fraul Finds");
  await shot("18-fraul-finds-mall");
  await back();
  await page.locator("#concierge").waitFor({ state: "hidden", timeout: 5000 });
  if (!page.url().endsWith("/walk")) throw new Error(`retour a quitté le Walk : ${page.url()}`);
});

await check("heure du jour : à 19 h le mall est plus sombre et éclairé ; vitrine vivante", async () => {
  await page.goto(BASE + "/walk/travis-scott?heure=19", { waitUntil: "networkidle" });
  await page.locator("#aisle:not([hidden])").waitFor({ timeout: 20000 });
  if ((await page.locator("#walk").getAttribute("data-time")) !== "soir") throw new Error("19 h n'est pas le soir");
  await page.waitForTimeout(2500);
  await shot("19-mall-19h-vitrine-vivante");
  await page.goto(BASE + "/walk/travis-scott?heure=12", { waitUntil: "networkidle" });
  await page.locator("#aisle:not([hidden])").waitFor({ timeout: 20000 });
  if ((await page.locator("#walk").getAttribute("data-time")) !== "jour") throw new Error("midi n'est pas le jour");
  await page.waitForTimeout(2500);
  await shot("19b-mall-midi-vitrine-vivante");
});

await check("entrer et sortir sans attendre (fondu, pas de marche), trajet court vers un rayon", async () => {
  await page.goto(BASE + "/walk/amiri", { waitUntil: "networkidle" });
  await page.locator("#aisle:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);
  const before = await page.locator("#bname").innerText();
  let t = Date.now();
  await page.locator("#enter").click();
  await page.locator("#store[data-mode=\"hub\"]:not([hidden])").waitFor({ timeout: 20000 });
  const tIn = Date.now() - t;
  t = Date.now();
  await page.locator("#sCats .s-cat").first().click();
  await page.locator("#sInfo:not([hidden])").waitFor({ timeout: 20000 });
  const tRayon = Date.now() - t;
  await page.locator("#sQuit").click(); // ← : centre de la boutique
  await page.locator("#store[data-mode=\"hub\"]:not([hidden])").waitFor({ timeout: 20000 });
  await page.locator("#sQuit").click(); // ✕ : sortir
  t = Date.now();
  await page.locator("#store").waitFor({ state: "hidden", timeout: 20000 });
  const tOut = Date.now() - t;
  const after = await page.locator("#bname").innerText();
  if (after !== before) throw new Error(`en sortant : vitrine ${after}, attendu ${before}`);
  // La durée de l'animation vers le rayon est mesurée par le moteur (fiable) : 0,5 s au plus (Rhamone, 19 oct.).
  const walkMs = Number(await page.locator("#store").getAttribute("data-walk-ms"));
  if (!(walkMs > 0 && walkMs <= 500)) throw new Error(`trajet vers le rayon : ${walkMs} ms (0,5 s au plus)`);
  // Temps réels : garde-fou large, le navigateur de test dessine la 3D sans carte graphique (très variable, bien plus lent qu'un téléphone).
  if (tIn > 2500 || tRayon > 3500 || tOut > 800) throw new Error(`trop lent : entrer ${tIn} ms, rayon ${tRayon} ms, sortir ${tOut} ms`);
  console.log(`     entrer ${tIn} ms · rayon ${tRayon} ms · sortir ${tOut} ms`);
});

await check("raccourcis : recherche « hoodie » → rayon, reprise à la dernière boutique, aide affichée une seule fois", async () => {
  await page.goto(BASE + "/walk/amiri", { waitUntil: "networkidle" });
  await page.locator("#aisle:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.goto(BASE + "/walk", { waitUntil: "networkidle" });
  await page.locator("#aisle:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);
  if ((await page.locator("#bname").innerText()) !== "Amiri") throw new Error("pas de reprise à la dernière boutique");
  if (await page.locator(".tap-hint").isVisible()) throw new Error("« Touche la vitrine » encore affiché alors qu'on est déjà entré");
  await page.locator("#wSearch").click();
  await page.locator("#dirq").fill("hoodie");
  await page.locator("#dirList .go[data-cat]").first().waitFor({ timeout: 5000 });
  await shot("20-recherche-hoodie");
  await page.locator("#dirList .go[data-cat]").first().click();
  await page.locator("#sInfo:not([hidden])").waitFor({ timeout: 20000 });
  await shot("20b-recherche-rayon");
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
  // Même gabarit pour toutes les boutiques : les 6 rayons partout, même vides (Rhamone, 19 oct.).
  const rayons = await page.locator("#sCats .s-cat").allTextContents();
  if (rayons.length !== 6 || !rayons.includes("Hoodies et sweats")) throw new Error(`rayons affichés : ${rayons.join(", ")}`);
  if (await page.locator("#store #sCon, #store .s-back").count()) throw new Error("Fraul Finds ou l'aide « défiler » encore dans la boutique");
  // En haut de la boutique : retour et loupe en icônes ; la loupe ouvre la recherche par-dessus la boutique.
  if ((await page.locator("#sQuit").innerText()).trim()) throw new Error("le bouton retour de la boutique a encore du texte");
  await page.locator("#sSearch").click();
  await page.locator("#dir:not([hidden])").waitFor({ timeout: 5000 });
  await page.locator("#dirClose").click();
  await page.locator("#dir").waitFor({ state: "hidden", timeout: 5000 });
  if (await page.locator("#store").isHidden()) throw new Error("fermer la recherche a fermé la boutique");
  await page.locator("#sCats .s-cat", { hasText: "Sneakers" }).click();
  await page.locator("#sInfo.empty:not([hidden])").waitFor({ timeout: 20000 });
  if ((await page.locator("#iName").textContent()) !== "Rien ici pour l'instant.") throw new Error("rayon vide mal affiché");
  if (await page.locator("#iAdd").isVisible()) throw new Error("bouton Au panier dans un rayon vide");
  await shot("14a-rayon-vide");
  if ((await page.locator("#iElse .s-cat").count()) < 1) throw new Error("rayon vide : pas de proposition chez d'autres marques");
  const other = await page.locator("#iElse .s-cat").first().textContent();
  await page.locator("#iElse .s-cat").first().click();
  await page.locator("#sInfo:not(.empty):not([hidden])").waitFor({ timeout: 20000 });
  if (!(await page.locator("#sTitle").textContent()).startsWith(other)) throw new Error(`n'est pas allé chez ${other}`);
  if (!(await page.locator("#iBrand").textContent()).includes("Sneakers")) throw new Error("pas arrivé au rayon sneakers de l'autre marque");
  await page.goto(BASE + "/walk/travis-scott", { waitUntil: "networkidle" });
  await page.locator("#aisle:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.locator("#enter").click();
  await page.locator("#sCats .s-cat", { hasText: "Hoodies et sweats" }).click();
  await page.locator("#sInfo:not(.empty):not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await shot("14-boutique-travis-scott");
  const cut = await page.evaluate(() => [...document.querySelectorAll("#sInfo .s-act > *, #iPrice")].some((el) => el.getBoundingClientRect().right > innerWidth + 1));
  if (cut) throw new Error("un bouton ou le prix sort de l'écran");
  // Toucher l'article devant soi = la fiche en grand, avec toutes ses photos.
  const b2 = await page.locator("#sgl").boundingBox();
  await page.mouse.click(b2.x + b2.width / 2, b2.y + b2.height * 0.4);
  await page.locator("#fiche:not([hidden])").waitFor({ timeout: 5000 });
  if ((await page.locator("#fiche .gal-slide img").count()) < 2) throw new Error("la fiche n'a pas face et dos");
  const cutF = await page.evaluate(() => [...document.querySelectorAll("#fiche .f-act > *")].some((el) => el.getBoundingClientRect().right > innerWidth + 1));
  if (cutF) throw new Error("un bouton de la fiche sort de l'écran");
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

// PC (Rhamone, 21 oct. : écran blanc et lenteur sur grand écran, la molette changeait de boutique).
for (const [w, h, dpr] of [[1920, 1080, 1], [2560, 1440, 1.5]]) {
  await check(`PC ${w}×${h} : image pas trop lourde, molette, carte graphique qui décroche`, async () => {
    const dctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    const pc = await dctx.newPage();
    pc.on("pageerror", (e) => errors.push(`pageerror (PC) : ${e.message}`));
    try {
      await pc.goto(BASE + "/walk/trapstar", { waitUntil: "networkidle" }); // 2e boutique : le cran suivant mène à la 3e
      await pc.locator("#aisle:not([hidden])").waitFor({ timeout: 30000 });
      await pc.waitForTimeout(1200);
      const px = await pc.locator("#gl").evaluate((c) => c.width * c.height);
      if (px > 2.6e6) throw new Error(`mall dessiné en ${(px / 1e6).toFixed(1)} millions de points (2,4 au plus)`);
      // Un cran de molette = une boutique (Rhamone, 21 oct.), dans les deux sens.
      const shop = await pc.locator("#bname").innerText();
      const idx = async () => Number((await pc.locator("#count").innerText()).match(/\d+/)[0]);
      const i0 = await idx();
      await pc.mouse.move(w / 2, h / 2);
      await pc.mouse.wheel(0, 100); await pc.waitForTimeout(1800);
      if ((await idx()) !== i0 + 1) throw new Error(`un cran vers le bas : boutique ${i0} → ${await idx()} (attendu ${i0 + 1})`);
      await pc.mouse.wheel(0, -100); await pc.waitForTimeout(1800);
      if ((await idx()) !== i0) throw new Error(`un cran vers le haut : retour à ${await idx()} (attendu ${i0})`);
      // Entrer, ouvrir un rayon : la molette ne fait jamais sortir ; on sort par ← puis ✕, devant la même boutique.
      await pc.locator("#enter").click();
      await pc.locator("#store[data-mode=\"hub\"]:not([hidden])").waitFor({ timeout: 30000 });
      const spx = await pc.locator("#sgl").evaluate((c) => c.width * c.height);
      if (spx > 2.6e6) throw new Error(`boutique dessinée en ${(spx / 1e6).toFixed(1)} millions de points`);
      await pc.locator("#sCats .s-cat").first().click();
      await pc.locator("#sInfo:not([hidden])").waitFor({ timeout: 30000 });
      for (let k = 0; k < 10; k++) { await pc.mouse.wheel(0, -120); await pc.waitForTimeout(70); }
      await pc.waitForTimeout(800);
      if (await pc.locator("#store").isHidden()) throw new Error("la molette a fait sortir de la boutique");
      await pc.screenshot({ path: `${OUT}/20-pc-${w}.png` });
      // Sur PC, la liste des rayons reste ouverte en bas à gauche, sans toucher la fiche de l'article.
      const list = await pc.locator("#sCats").boundingBox(), info = await pc.locator("#sInfo .s-in").first().boundingBox();
      if (!list || list.x > 40 || list.x + list.width > info.x) throw new Error("sur PC, la liste des rayons n'est pas dans le coin bas-gauche");
      await pc.locator("#sQuit").click();
      await pc.locator("#store[data-mode=\"hub\"]:not([hidden])").waitFor({ timeout: 20000 });
      await pc.locator("#sQuit").click();
      await pc.locator("#store").waitFor({ state: "hidden", timeout: 20000 });
      await pc.waitForTimeout(600);
      const after = await pc.locator("#bname").innerText();
      if (after !== shop) throw new Error(`en sortant, autre boutique : ${shop} → ${after}`);
      // La carte graphique décroche puis revient : le mall se redessine (pas d'écran blanc, pas de version sans 3D).
      await pc.locator("#gl").evaluate((c) => { const x = c.getContext("webgl2") || c.getContext("webgl"); window.__lose = x.getExtension("WEBGL_lose_context"); window.__lose.loseContext(); });
      await pc.waitForTimeout(500);
      await pc.evaluate(() => window.__lose.restoreContext());
      await pc.waitForTimeout(1500);
      if (await pc.locator("#walk.nogl").count()) throw new Error("après le retour de la carte graphique, le mall est passé sans 3D");
      await pc.screenshot({ path: `${OUT}/21-pc-${w}-apres-decrochage.png` });
      // Elle ne revient pas : au bout de 4 s, la version sans 3D (jamais un écran blanc).
      await pc.locator("#gl").evaluate(() => window.__lose.loseContext());
      await pc.locator("#walk.nogl").waitFor({ timeout: 8000 });
    } finally { await dctx.close(); }
  });
}
await check("fiche en grand → « Fiche complète » → retour au Walk : « Fermer » marche toujours", async () => {
  // Bug vu par Rhamone (21 oct.) : la fiche restait ouverte au retour et « Fermer » ne répondait plus.
  await page.goto(BASE + "/walk/trapstar", { waitUntil: "networkidle" });
  await page.locator("#aisle:not([hidden])").waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);
  await page.locator("#enter").click();
  await page.locator("#store[data-mode=\"hub\"]:not([hidden])").waitFor({ timeout: 20000 });
  await page.locator("#sCats .s-cat").first().click();
  await page.locator("#sInfo:not([hidden])").waitFor({ timeout: 20000 });
  await page.locator("#iPage").click();
  await page.locator("#fiche:not([hidden])").waitFor({ timeout: 5000 });
  await page.locator("#fiche a", { hasText: "Fiche complète" }).click();
  await page.waitForURL(/\/produit\//, { timeout: 15000 });
  await page.goBack();
  await page.waitForURL(/\/walk/, { timeout: 15000 });
  await page.waitForTimeout(2500);
  if (await page.locator("#fiche:not([hidden])").count()) throw new Error("la fiche est restée ouverte au retour");
  // Le moteur repart : on peut rouvrir une fiche et la fermer.
  if (await page.locator("#store:not([hidden])").count() === 0) await page.locator("#enter").click();
  await page.locator("#store[data-mode=\"hub\"]:not([hidden]), #sInfo:not([hidden])").first().waitFor({ timeout: 20000 });
  if (await page.locator("#sInfo:not([hidden])").count() === 0) { await page.locator("#sCats .s-cat").first().click(); await page.locator("#sInfo:not([hidden])").waitFor({ timeout: 20000 }); }
  await page.locator("#iPage").click();
  await page.locator("#fiche:not([hidden])").waitFor({ timeout: 5000 });
  await page.locator("#fiche .f-top .ic").click();
  await page.locator("#fiche:not([hidden])").waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
  if (await page.locator("#fiche:not([hidden])").count()) throw new Error("« Fermer » ne ferme pas la fiche après le retour");
});

await browser.close();
console.log(results.join("\n"));
console.log(errors.length ? `\nErreurs navigateur :\n${[...new Set(errors)].join("\n")}` : "\nAucune erreur navigateur.");
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
