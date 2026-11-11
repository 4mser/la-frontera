"""Erosion for chapter IV: rain on a nearly flat relief that leans towards the sea (the lower edge) organizes itself
into a river network. herramientas/c/gotas.c lets raindrops run downhill and cut the bed where water gathers (after
H. Beyer, 2015: the capacity of a drop grows with its speed, its water and the slope). The snapshots come closer
together at the start, when the network is born.

Exports public/p4/erosion/NN.png (RGBA): the channels in the blue of the water (the water that passed in that
window, log scale) over the contour lines of the relief in cream; and src/cap4_erosion.json (the snapshots).

Usage: PYTHONPATH=pylib python3 herramientas/erosion_cap4.py
"""
import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
W, H, GOTAS, FOTOS = 960, 540, 900000, 40
g = np.random.default_rng(5)
yy, xx = np.mgrid[0:H, 0:W].astype(float)
z = 0.16 * (H - 1 - yy) * (360 / H)
for esc, amp in ((135, 9), (60, 4), (24, 1.8), (9, 0.7)):   # the bumps, at the same sizes as the 640-wide tests ×1.5
    r = g.standard_normal((H // esc + 3, W // esc + 3)).astype(np.float32)
    z += amp * np.asarray(Image.fromarray(r, mode="F").resize((W, H), Image.BICUBIC))
z = z.astype(np.float32)
z0 = z.copy()
tmp = Path(tempfile.mkdtemp())
subprocess.run(["cc", "-O3", "-o", str(RAIZ / "herramientas/c/gotas"), str(RAIZ / "herramientas/c/gotas.c"), "-lm"], check=True)
subprocess.run([str(RAIZ / "herramientas/c/gotas"), str(W), str(H), str(GOTAS), str(FOTOS), "3", str(tmp / "g")], input=z.tobytes(), check=True)
out = RAIZ / "public" / "p4" / "erosion"
out.mkdir(parents=True, exist_ok=True)
AGUA, CREMA = np.array([120, 180, 255]), np.array([245, 230, 205])
ventanas = [int(GOTAS * ((i + 1) / FOTOS) ** 2) - int(GOTAS * (i / FOTOS) ** 2) for i in range(FOTOS)]
info = []
# the relief before any rain, as snapshot -1 (contours only)
for k in range(-1, FOTOS):
    zz = z0 if k < 0 else np.fromfile(tmp / f"g_{k:02d}.f32", np.float32).reshape(H, W)
    # contours of a smoothed relief, every 4 units, faint
    zs = np.asarray(Image.fromarray(zz, mode="F").resize((W // 4, H // 4), Image.BILINEAR).resize((W, H), Image.BICUBIC))
    f = np.abs(((zs / 4.0) % 1) - 0.5)
    cont = np.clip((f - 0.46) / 0.04, 0, 1) ** 2 * 0.45 * np.clip(zs - 1, 0, 1)
    if k >= 0:
        q = np.log1p(np.fromfile(tmp / f"g_{k:02d}.q32", np.float32).reshape(H, W))
        c = np.clip(q / q.max(), 0, 1) ** 1.5
    else:
        c = np.zeros_like(zz)
    a = np.maximum(cont * (1 - c), c)
    rgb = (CREMA[None, None] * (cont * (1 - c))[..., None] + AGUA[None, None] * c[..., None]) / np.maximum(a, 1e-6)[..., None]
    img = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)
    Image.fromarray(img, "RGBA").save(out / f"{k + 1:02d}.png", optimize=True)
    info.append(int(GOTAS * ((k + 1) / FOTOS) ** 2) if k >= 0 else 0)
    if k in (-1, 0, 3, 10, 39):
        print(k, "gotas", info[-1])
(RAIZ / "src" / "cap4_erosion.json").write_text(json.dumps({"fotos": FOTOS + 1, "gotas": info}))
np.save(tmp / "final.npy", np.fromfile(tmp / f"g_{FOTOS - 1:02d}.q32", np.float32).reshape(H, W))
zf = np.fromfile(tmp / f"g_{FOTOS - 1:02d}.f32", np.float32)
(RAIZ / "datos" / "cap4").mkdir(parents=True, exist_ok=True)
(RAIZ / "datos" / "cap4" / "erosion_final.q32").write_bytes((tmp / f"g_{FOTOS - 1:02d}.q32").read_bytes())   # for the box counting
print("tmp", tmp, "z final p1/p50/p99", np.percentile(zf, [1, 50, 99]).round(2))
