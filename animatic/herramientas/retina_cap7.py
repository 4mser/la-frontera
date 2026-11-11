"""The retina of chapter VII: a real fundus photograph (Wikimedia Commons, OptometrusPrime, CC BY-SA 2.0) turned into
a number, step by step, with our own simple method:
1. the green channel, where the vessels contrast most;
2. vessels are darker than their surroundings: a black-hat (a wide blur minus the image), inside the round field;
3. a threshold and a clean-up of tiny specks → the vessel map;
4. box counting on the map (boxes of 4 to 64 px on 1024 px) → its dimension.
Writes public/p7/retina-{color,verde,realce,vasos}.png (1600 px wide, cropped to the disc) and src/cap7_retina.json
(the dimension, the counts and the boxes that touch the map at 64, 32 and 16 px).

Usage: PYTHONPATH=pylib python3 herramientas/retina_cap7.py <original fundus png>
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
im = Image.open(sys.argv[1]).convert("RGB")
a = np.asarray(im).astype(float)
# the round field of view: brightness above a floor
lum = a.mean(2)
cam = lum > 20
ys, xs = np.nonzero(cam)
cy, cx = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2
r = min(ys.max() - ys.min(), xs.max() - xs.min()) / 2 * 0.97
# crop a square around the disc, to 1024 px for the measurement
x0, y0 = int(cx - r), int(cy - r)
L = 1024
def recorta(img):
    return img.crop((x0, y0, x0 + int(2 * r), y0 + int(2 * r))).resize((L, L), Image.LANCZOS)
color = recorta(im)
g = np.asarray(color).astype(float)[:, :, 1]
yy, xx = np.mgrid[0:L, 0:L]
dentro = (xx - L / 2) ** 2 + (yy - L / 2) ** 2 < (L / 2 * 0.95) ** 2
# black-hat: what is darker than a wide neighbourhood
fondo = np.asarray(Image.fromarray(g.astype(np.uint8)).filter(ImageFilter.GaussianBlur(9))).astype(float)
realce = np.clip(fondo - g, 0, None) * dentro
realce = realce / np.percentile(realce[dentro], 99.5)
vasos = (realce > 0.2) & dentro
# clean-up: an opening removes isolated specks
v8 = Image.fromarray((vasos * 255).astype(np.uint8))
v8 = v8.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
vasos = np.asarray(v8) > 0
EPS = [4, 8, 16, 32, 64]
def cuenta(b):
    n = []
    for e in EPS:
        c = b[: L // e * e, : L // e * e].reshape(L // e, e, L // e, e).any(axis=(1, 3))
        n.append(int(c.sum()))
    return round(float(np.polyfit(np.log(1 / np.array(EPS, float)), np.log(n), 1)[0]), 2), n
D, n = cuenta(vasos)
cajas = {}
for e in (64, 32, 16):
    c = vasos.reshape(L // e, e, L // e, e).any(axis=(1, 3))
    cajas[str(e)] = np.nonzero(c.ravel())[0].tolist()
out = RAIZ / "public" / "p7"; out.mkdir(parents=True, exist_ok=True)
color.save(out / "retina-color.jpg", quality=93)
Image.fromarray(g.astype(np.uint8)).save(out / "retina-verde.jpg", quality=93)
Image.fromarray((np.clip(realce, 0, 1) * 255).astype(np.uint8)).save(out / "retina-realce.jpg", quality=93)
Image.fromarray((vasos * 255).astype(np.uint8)).save(out / "retina-vasos.png")
(RAIZ / "src" / "cap7_retina.json").write_text(json.dumps({"D": D, "n": n, "eps": EPS, "L": L, "cajas": cajas}))
print("D", D, n, "fracción de vasos", round(float(vasos[dentro].mean()), 3))
