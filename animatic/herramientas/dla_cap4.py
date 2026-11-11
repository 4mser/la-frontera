"""Diffusion-limited aggregation for chapter IV (src/cap4_dla.json): runs herramientas/c/dla2 (off-lattice, discs of
diameter 2) and keeps, in arrival order, every particle; the full walks of the first three (launched from a visible
circle) and of twelve late particles (to show that they hit the tips); and the mass–radius dimension.

Usage: PYTHONPATH=pylib python3 herramientas/dla_cap4.py
"""
import json
import subprocess
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent
N, SEMILLA, RVIS = 60000, 11, 140
subprocess.run(["cc", "-O3", "-o", str(RAIZ / "c" / "dla2"), str(RAIZ / "c" / "dla2.c"), "-lm"], check=True)
out = subprocess.run([str(RAIZ / "c" / "dla2"), str(N + 12), str(SEMILLA), str(N), str(N + 12), str(RVIS)], capture_output=True, text=True, check=True).stdout
P, CAM = [], {}
for l in out.splitlines():
    a = l.split()
    if a[0] == "p":
        P.append([float(a[1]), float(a[2])])
    else:
        v = np.array(a[2:], float).reshape(-1, 2)
        if len(v) > 1500:                      # at most 1500 points per walk is plenty on screen
            v = v[np.linspace(0, len(v) - 1, 1500).astype(int)]
        CAM[int(a[1])] = np.round(v, 1).tolist()
P = np.array(P)
r = np.hypot(*P[:N].T)
rs = np.array([20, 40, 80, 160, 320])
D = float(np.polyfit(np.log(rs), np.log([(r < x).sum() for x in rs]), 1)[0])
rmax_hasta = np.maximum.accumulate(np.hypot(*P.T)).round(1)
DAT = {"n": N, "pts": np.round(P, 1).ravel().tolist(), "rmax": rmax_hasta[::50].tolist(), "rvis": RVIS,
       "caminatas": {str(k): v for k, v in CAM.items()}, "D_masa_radio": round(D, 3)}
(RAIZ.parent / "src" / "cap4_dla.json").write_text(json.dumps(DAT, separators=(",", ":")))
print("N", N, "rmax", rmax_hasta[N - 1], "D", round(D, 3), {k: len(v) for k, v in CAM.items()})
