"""A real stretch of the Chilean coast (Natural Earth 10m, public domain) measured with the compass method:
for each ruler length, walk the coast in steps of that length and count the steps. Writes src/costa.json with the
coastline (in km, local projection) and, for every ruler, the vertices of the walk and the measured length.

Usage: PYTHONPATH=pylib python3 herramientas/costa_chile.py
"""
import json
import math
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
G = json.loads((RAIZ / "datos" / "natural-earth" / "ne_10m_coastline.geojson").read_text())
# the fjords of Aysén and Chiloé: one of the most broken coasts on Earth
LON0, LON1, LAT0, LAT1 = -75.8, -72.2, -47.6, -41.4
mejor = None
for f in G["features"]:
    g = f["geometry"]
    partes = [g["coordinates"]] if g["type"] == "LineString" else g["coordinates"]
    for p in partes:
        # the longest run of consecutive vertices inside the box (no jumps across points that left it)
        run = []
        for x, y in p:
            if LON0 <= x <= LON1 and LAT0 <= y <= LAT1:
                run.append((x, y))
                if mejor is None or len(run) > len(mejor):
                    mejor = list(run)
            else:
                run = []
pts = np.array(mejor)
# drop repeated vertices (zero-length segments)
pts = pts[np.r_[True, np.any(np.diff(pts, axis=0) != 0, axis=1)]]
latm = math.radians(pts[:, 1].mean())
km = np.stack([(pts[:, 0] - pts[:, 0].mean()) * 111.32 * math.cos(latm), (pts[:, 1] - pts[:, 1].mean()) * 110.57], 1)


def compas(c, r):
    """Walk the polyline from its first point in straight steps of length r (km): each step ends where a circle of
    radius r around the current point first crosses the coast further along."""
    paso = [c[0]]
    p, k, u0 = c[0], 0, 0.0
    while k < len(c) - 1:
        hallado = False
        while k < len(c) - 1:
            a, b = c[k], c[k + 1]
            if np.hypot(*(b - p)) >= r:
                d, f = b - a, a - p
                A, B, C = d @ d, 2 * f @ d, f @ f - r * r
                disc = B * B - 4 * A * C
                if A > 0 and disc >= 0:
                    raices = [(-B - math.sqrt(disc)) / (2 * A), (-B + math.sqrt(disc)) / (2 * A)]
                    ok = [u for u in raices if u0 - 1e-9 <= u <= 1 + 1e-9]
                    if ok:
                        u = min(ok)
                        p = a + u * d
                        paso.append(p)
                        u0 = u
                        hallado = True
                        break
            k += 1
            u0 = 0.0
        if not hallado:
            break
    return np.array(paso)


reglas = [160, 80, 40, 20, 10, 5]
med = []
for r in reglas:
    w = compas(km, r)
    med.append({"regla": r, "pasos": len(w) - 1, "largo": round((len(w) - 1) * r), "puntos": [[round(x, 2), round(y, 2)] for x, y in w]})
    print(f"regla {r:4d} km · {len(w) - 1:4d} pasos · largo {(len(w) - 1) * r:6d} km")
total = float(np.sum(np.hypot(*np.diff(km, axis=0).T)))
print("vértices", len(km), "· largo de la línea de datos", round(total), "km · extensión", np.ptp(km, 0).round())
out = {"fuente": "Natural Earth 10m coastline (dominio público)", "region": [LON0, LON1, LAT0, LAT1],
       "costa": [[round(x, 2), round(y, 2)] for x, y in km], "medidas": med}
(RAIZ / "src" / "costa.json").write_text(json.dumps(out))
