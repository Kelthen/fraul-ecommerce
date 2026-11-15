"""Détourage automatique des photos produit (Rhamone, 8 nov. 2026).

Lancé par .github/workflows/detourage.yml toutes les 10 minutes. Prend les photos de face et de dos pas encore
traitées (product_images.cutout null), et les photos des looks (looks.cutout null), enlève le fond (rembg, modèle birefnet-general-lite : bon aussi sur les
vêtements blancs), range le WebP transparent dans le stockage « produits/detoure/<id>.webp » et note son adresse.
En cas d'échec : cutout = '' (le site garde la photo d'origine, on ne réessaie pas en boucle).
Variables : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (secrets GitHub, jamais dans le dépôt).
"""
import io, json, os, sys, urllib.request

URL = os.environ.get("SUPABASE_URL", "https://rqrdccsxyyufqlenmpct.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
LIMIT = int(os.environ.get("DETOURAGE_LIMIT", "60"))
HEADERS = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}


def call(method, path, body=None, ctype="application/json", extra=None):
    data = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode()
    req = urllib.request.Request(f"{URL}{path}", data=data, method=method, headers={**HEADERS, "Content-Type": ctype, **(extra or {})})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def source(path):
    if path.startswith("/"):  # photo rangée dans le dépôt (public/images/library/…)
        return open(os.path.join("public", path.lstrip("/")), "rb").read()
    return urllib.request.urlopen(path, timeout=60).read()


def clean_background(im, cut):
    """Enlève le fond studio que rembg laisse parfois (ex. le blanc entre les manches sous l'ourlet, pull Stüssy,
    Rhamone 11 nov.) : les pixels proches de la couleur du fond et reliés au bord de la photo deviennent transparents.
    Seulement sur un fond clair et uni ; garde-fou : si cela retirait plus de 15 % du vêtement (vêtement blanc sur fond
    blanc), on garde le résultat de rembg tel quel."""
    import numpy as np
    from scipy import ndimage
    rgb = np.asarray(im, dtype=np.int16)
    alpha = np.asarray(cut.getchannel("A")).copy()
    rim = lambda m: np.concatenate([m[0], m[-1], m[:, 0], m[:, -1]])
    bg = np.median(rim(rgb), axis=0)
    near = np.abs(rgb - bg).sum(-1) < 36
    if bg.sum() < 600 or rim(near).mean() < 0.92:
        return cut  # pas un fond studio clair et uni : rien à corriger
    labels, _ = ndimage.label(near)
    edge = np.unique(rim(labels))
    background = np.isin(labels, edge[edge > 0])
    kept = alpha > 12
    removed = background & kept
    if removed.sum() > 0.15 * max(1, kept.sum()):
        return cut
    alpha[removed] = 0
    from PIL import Image
    cut.putalpha(Image.fromarray(alpha))
    return cut


def main():
    if not KEY:
        print("SUPABASE_SERVICE_ROLE_KEY absente : rien à faire.")
        return
    # Photos produit (face, dos) et photos des looks de l'accueil (/admin/looks) pas encore détourées.
    rows = [{**r, "table": "product_images", "name": r["id"]} for r in json.loads(call("GET", f"/rest/v1/product_images?select=id,path&cutout=is.null&view=in.(front,back)&limit={LIMIT}"))]
    rows += [{"id": r["id"], "path": r["photo"], "table": "looks", "name": f"look-{r['id']}"} for r in json.loads(call("GET", "/rest/v1/looks?select=id,photo&cutout=is.null&limit=20"))]
    print(len(rows), "photo(s) à détourer")
    if not rows:
        return
    from PIL import Image  # chargés seulement s'il y a du travail
    from rembg import new_session, remove

    session = new_session("birefnet-general-lite")
    for row in rows:
        try:
            im = Image.open(io.BytesIO(source(row["path"]))).convert("RGB")
            cut = clean_background(im, remove(im, session=session))
            box = cut.getchannel("A").point(lambda a: 255 if a > 12 else 0).getbbox()
            if box:
                cut = cut.crop(box)
            cut.thumbnail((1200, 1200), Image.LANCZOS)
            buf = io.BytesIO()
            cut.save(buf, "WEBP", quality=84, method=6)
            name = f"detoure/{row['name']}.webp"
            call("POST", f"/storage/v1/object/produits/{name}", buf.getvalue(), "image/webp", {"x-upsert": "true", "Cache-Control": "max-age=31536000"})
            done = f"{URL}/storage/v1/object/public/produits/{name}"
        except Exception as e:  # une photo illisible ne bloque pas les autres
            print("échec", row["id"], e, file=sys.stderr)
            done = ""
        call("PATCH", f"/rest/v1/{row['table']}?id=eq.{row['id']}", {"cutout": done}, extra={"Prefer": "return=minimal"})
        print("ok" if done else "vide", row["id"])


if __name__ == "__main__":
    main()
