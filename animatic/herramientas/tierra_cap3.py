"""Satellite backgrounds for chapter III: crops of NASA's Blue Marble (equirectangular, 24000x12000, public domain,
material-prologo/cap3/blue-marble-24000.jpg) reprojected to the same local km projection as the borders
(herramientas/fronteras_cap3.py), so the borders sit exactly on the image. Writes public/p3/tierra-*.jpg and their
bounds in km to src/cap3_tierra.json.

Usage: PYTHONPATH=pylib python3 herramientas/tierra_cap3.py
"""
import json
import math
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None
RAIZ = Path(__file__).resolve().parent.parent
SRC = RAIZ.parent / "material-prologo" / "cap3" / "blue-marble-24000.jpg"
R = 6371.0
REGIONES = {
    "iberia": {"origen": (-7.5, 40.0), "lon": (-11.5, 5.0), "lat": (34.5, 45.5)},
    "benelux": {"origen": (4.8, 51.3), "lon": (1.0, 8.5), "lat": (48.8, 54.0)},
    "norteamerica": {"origen": (-109.0, 49.0), "lon": (-140.0, -55.0), "lat": (25.0, 66.0)},
    "europa": {"origen": (8.0, 49.0), "lon": (-14.0, 30.0), "lat": (33.0, 62.0)},
}
img = Image.open(SRC)
W0, H0 = img.size
out = {}
for nombre, r in REGIONES.items():
    (l0, b0), (L1, L2), (B1, B2) = r["origen"], r["lon"], r["lat"]
    caja = (int((L1 + 180) / 360 * W0), int((90 - B2) / 180 * H0), int((L2 + 180) / 360 * W0), int((90 - B1) / 180 * H0))
    rec = img.crop(caja)
    k = math.cos(math.radians(b0))
    # km covered, and the same pixels per km on both axes
    kx0, kx1 = (L1 - l0) * math.pi / 180 * R * k, (L2 - l0) * math.pi / 180 * R * k
    ky0, ky1 = (B1 - b0) * math.pi / 180 * R, (B2 - b0) * math.pi / 180 * R
    ppk = min(3000 / (kx1 - kx0), 3000 / (ky1 - ky0))
    rec = rec.resize((int((kx1 - kx0) * ppk), int((ky1 - ky0) * ppk)), Image.LANCZOS)
    rec.save(RAIZ / "public" / "p3" / f"tierra-{nombre}.jpg", quality=90)
    out[nombre] = {"x0": round(kx0, 1), "x1": round(kx1, 1), "y0": round(ky0, 1), "y1": round(ky1, 1), "px": rec.size}
    print(nombre, rec.size, out[nombre])
(RAIZ / "src" / "cap3_tierra.json").write_text(json.dumps(out))
