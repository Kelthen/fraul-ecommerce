# Atlas face/dos d'un look pour assets-src/blender/mannequin-habille.py (photos détourées avec rembg, scripts/detourage.py).
# Atlas 1024x1024 : face à gauche, dos à droite (chaque photo détourée, couleurs étendues dans le vide pour que les
# bords du mannequin ne prennent pas le fond clair). Usage : atlas.py face-cut.png dos-cut.png sortie.jpg
import sys, numpy as np
from PIL import Image, ImageFilter
def fill(path):
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im).astype(float) / 255
    rgb, al = a[..., :3], a[..., 3:4]
    out = rgb * al; w = al.copy(); acc_rgb, acc_w = out.copy(), w.copy()
    for r in (2, 4, 8, 16, 32, 64):
        b = lambda x: np.asarray(Image.fromarray((x * 255).astype(np.uint8).squeeze() if x.shape[-1] == 1 else (x * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(float) / 255
        pw = b(w); pr = b(np.clip(out, 0, 1))
        pw = pw[..., None] if pw.ndim == 2 else pw
        m = (acc_w < 0.5)
        col = pr / np.maximum(pw, 1e-3)
        acc_rgb = np.where(m, col, acc_rgb); acc_w = np.where(m & (pw > 0.02), 1, acc_w)
    res = np.where(al > 0.5, rgb, acc_rgb)
    return Image.fromarray((np.clip(res, 0, 1) * 255).astype(np.uint8)), im.size
f, size = fill(sys.argv[1]); d, _ = fill(sys.argv[2])
W, H = size
at = Image.new("RGB", (W * 2, H)); at.paste(f, (0, 0)); at.paste(d, (W, 0))
at.resize((2048, 2048 * H // (W * 2) if False else 1024 * 2 * H // (W * 2) )).save(sys.argv[3], quality=90)
print("atlas", W * 2, H)
