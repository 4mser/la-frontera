"""Box counting for chapter IV (src/cap4_cajas.json): the three final forms, each drawn as a black-and-white image of
1024 px on its longer side, are covered by boxes of 4 to 64 px; the slope of log N(ε) against log(1/ε) is the
dimension. The same method for the three, so the numbers can be compared with each other (not with values measured
by other methods).

Usage: PYTHONPATH=pylib python3 herramientas/cajas_cap4.py datos/cap4/erosion_final.q32
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
L = 1024
EPS = [4, 8, 16, 32, 64]


REJ = {}


def cuenta(b, nombre=None):
    if nombre:   # the boxes that touch the form at 64, 32 and 16 px, to draw them (row-major indices)
        REJ[nombre] = {"h": b.shape[0], "w": b.shape[1], "cajas": {}}
        for e in (64, 32, 16):
            h, w = b.shape[0] // e * e, b.shape[1] // e * e
            c = b[:h, :w].reshape(h // e, e, w // e, e).any(axis=(1, 3))
            REJ[nombre]["cajas"][str(e)] = np.nonzero(c.ravel())[0].tolist()
    n = []
    for e in EPS:
        h, w = b.shape[0] // e * e, b.shape[1] // e * e
        c = b[:h, :w].reshape(h // e, e, w // e, e).any(axis=(1, 3))
        n.append(int(c.sum()))
    m = np.polyfit(np.log(1 / np.array(EPS, float)), np.log(n), 1)[0]
    return round(float(m), 2), n


out = {}
# 1 · diffusion: every particle a disc of its real size
D = json.loads((RAIZ / "src" / "cap4_dla.json").read_text())
P = np.array(D["pts"]).reshape(-1, 2)
r = np.abs(P).max() * 1.02; s = L / (2 * r)
im = Image.new("1", (L, L)); d = ImageDraw.Draw(im)
for x, y in P:
    cx, cy = L / 2 + x * s, L / 2 + y * s; d.ellipse((cx - s, cy - s, cx + s, cy + s), fill=1)
out["difusion"] = cuenta(np.array(im), "difusion")
# 2 · erosion: the channels (cells where the water of the last window is in the top of its log range)
q = np.log1p(np.fromfile(sys.argv[1], np.float32).reshape(540, 960)); q /= q.max()
b = np.array(Image.fromarray((q > 0.55).astype(np.uint8) * 255).resize((L, L * 540 // 960), Image.NEAREST)) > 0
out["erosion"] = cuenta(b, "erosion")
# 3 · vessels: every segment drawn with the width of a capillary (1 px)
V = json.loads((RAIZ / "src" / "cap4_vasos.json").read_text())
N = np.array(V["nodos"]).reshape(-1, 2); s = L / 2.05
im = Image.new("1", (L, L)); d = ImageDraw.Draw(im)
for i, p in enumerate(V["padre"]):
    if p >= 0:
        d.line((L / 2 + N[p, 0] * s, L / 2 + N[p, 1] * s, L / 2 + N[i, 0] * s, L / 2 + N[i, 1] * s), fill=1, width=1)
out["vasos"] = cuenta(np.array(im), "vasos")
out["eps"] = EPS
out["rejillas"] = REJ
(RAIZ / "src" / "cap4_cajas.json").write_text(json.dumps(out))
print({k: v for k, v in out.items() if k != "rejillas"})
