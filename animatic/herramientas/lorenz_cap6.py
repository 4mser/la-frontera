"""Data of chapter VI (src/cap6_lorenz.json): the Lorenz system of 1963 (σ = 10, ρ = 28, β = 8/3), integrated with RK4.

- the attractor: one long trajectory projected on the (x, z) plane, for the background;
- the anecdote of the rounded number (illustrated with this system, not with Lorenz's 1961 weather model): two runs
  from the same state, one with x multiplied by 0.506 / 0.506127 (the same relative cut of the printout);
- two points that start almost together and separate on the wings;
- a cloud: 4.000 points in a tiny ball, one sample per film frame (0,04 time units each), as it spreads over the
  attractor (public/p6/nube.bin, int16).

Usage: PYTHONPATH=pylib python3 herramientas/lorenz_cap6.py
"""
import json
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
S, R, B = 10.0, 28.0, 8 / 3


def f(p):
    x, y, z = p[..., 0], p[..., 1], p[..., 2]
    return np.stack([S * (y - x), x * (R - z) - y, x * y - B * z], -1)


def rk4(p, h):
    k1 = f(p); k2 = f(p + h / 2 * k1); k3 = f(p + h / 2 * k2); k4 = f(p + h * k3)
    return p + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)


def corre(p, h, n, cada):
    out = []
    for i in range(n):
        p = rk4(p, h)
        if i % cada == 0:
            out.append(p.copy())
    return np.array(out)


h = 0.002
p0 = np.array([1.0, 1.0, 1.0])
for _ in range(20000):
    p0 = rk4(p0, h)
atractor = corre(p0, h, 60000, 2)[:, [0, 2]]
# the rounded restart: the same state, x cut like 0.506127 → 0.506
a = corre(p0.copy(), h, 15000, 25)
pb = p0.copy(); pb[0] *= 0.506 / 0.506127
b = corre(pb, h, 15000, 25)
# two points on the wings, 1e-5 apart
dos = corre(np.stack([p0, p0 + np.array([1e-5, 0, 0])]), h, 20000, 5)
# the cloud: 4.000 points in a ball of radius 1e-3, one sample per film frame (0,04 time units each), written as
# int16 (×300) to public/p6/nube.bin: frames × points × (x, z)
NUBE, CUADROS = 4000, 1700
v = g_normal = np.random.default_rng(6).normal(size=(NUBE, 3)); v /= np.linalg.norm(v, axis=1)[:, None]
nube0 = p0 + v * 1e-3 * np.random.default_rng(7).random((NUBE, 1)) ** (1 / 3)
nube = corre(nube0, h, 20 * CUADROS, 20)[:, :, [0, 2]]
(RAIZ / "public" / "p6").mkdir(parents=True, exist_ok=True)
np.round(nube * 300).astype("<i2").tofile(RAIZ / "public" / "p6" / "nube.bin")
r1 = lambda x: np.round(x, 2).tolist()
D = {"atractor": r1(atractor.ravel()), "a": r1(a[:, 0]), "b": r1(b[:, 0]), "dosA": r1(dos[:, 0][:, [0, 2]].ravel()), "dosB": r1(dos[:, 1][:, [0, 2]].ravel()),
     "nubeN": NUBE, "nubeF": len(nube), "nubeEscala": 300}
(RAIZ / "src" / "cap6_lorenz.json").write_text(json.dumps(D, separators=(",", ":")))
sep = np.abs(np.array(D["a"]) - np.array(D["b"]))
print("atractor", len(atractor), "anécdota: separación > 5 en la muestra", int(np.argmax(sep > 5)), "de", len(sep), "nube cuadros", len(nube), "MB nube", round((RAIZ / "public" / "p6" / "nube.bin").stat().st_size / 1e6, 1),
      "KB", (RAIZ / "src" / "cap6_lorenz.json").stat().st_size // 1024)
