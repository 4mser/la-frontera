"""The cosmic web of chapter VIII, with the same particles as the close of chapter VII (herramientas/final_cap7.py):
- titulo: from the many webs where chapter VII ended, in to one web (behind the title);
- homogeneo: out from one web until filaments and voids blur into an even texture (the close: homogeneity).
Frames → public/p8/vid/{titulo,homogeneo}. Illustration, not a cosmological simulation."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from concurrent.futures import ProcessPoolExecutor

sys.path.insert(0, str(Path(__file__).resolve().parent))
import final_cap7 as F            # noqa: E402  (builds the web on import)

OUT = Path(__file__).resolve().parent.parent / "public/p8/vid"
FPS = 30
WEBCOL = np.where((F.BRI > 1.2)[:, None], np.array([1.0, 0.72, 0.38]), np.where((F.BRI < 0.5)[:, None], np.array([0.45, 0.5, 1.0]), np.array([0.6, 0.62, 1.0])))
r = np.random.default_rng(8)
CEL = np.array([2.5, 1.6, 2.0])
def rejilla(n):
    o = np.array([[i, j, k] for i in range(-n, n + 1) for j in range(-n, n + 1) for k in range(-n, n + 1) if (i, j, k) != (0, 0, 0)]) * CEL
    return o + r.uniform(-0.4, 0.4, o.shape), r.uniform(0, 2 * np.pi, len(o))
OF2, RO2 = rejilla(2)
OF4, RO4 = rejilla(4)
SUBA = r.uniform(0, 1, F.N) < 0.03
SUBB = r.uniform(0, 1, F.N) < 0.006

def copias(img, ofs, rots, sub, dens, peso_r, dist, ang, a):
    Q = F.WEB[sub]
    for o, ro in zip(ofs, rots):
        pe = np.exp(-(np.linalg.norm(o / CEL) / peso_r) ** 2)
        if pe < 0.04: continue
        c, s = np.cos(ro), np.sin(ro)
        Qr = np.stack([Q[:, 0] * c - Q[:, 2] * s, Q[:, 1], Q[:, 0] * s + Q[:, 2] * c], 1)
        img += F.splat(Qr + o, F.BRI[sub] * 0.5 / dens * 0.45 * a * pe, WEBCOL[sub], dist, ang)
    return img

def titulo(fr):
    t = fr / FPS                                  # 0 – 14 s: from far (where chapter VII ended) in to one web
    k = F.ease(t / 11.0)
    dist = 11.0 + (2.3 - 11.0) * k
    ang = 1.3 + 0.03 * (17.3 + t)
    img = F.splat(F.WEB, F.BRI * 0.5, WEBCOL, dist, ang)
    img = copias(img, F.OFS, F.OROT, F.SUB, 0.06, 1.9, dist, ang, 1 - F.ease((t - 8.5) / 4))
    img = F.brillo(img, 0.9)
    return 1 - np.exp(-img * 1.9)

def homogeneo(fr):
    t = fr / FPS                                  # 0 – 36 s: out, until the web is an even texture
    k = F.ease(t / 26.0) ** 1.2
    dist = 2.3 + (13.0 - 2.3) * k
    ang = 1.0 + 0.02 * t
    img = F.splat(F.WEB, F.BRI * 0.5, WEBCOL, dist, ang)
    img = copias(img, OF2, RO2, SUBA, 0.03, 2.6, dist, ang, F.ease(t / 4) * 0.7)
    img = copias(img, OF4, RO4, SUBB, 0.006, 4.2, dist, ang, F.ease((t - 3) / 8) * 0.5)
    img = F.brillo(img, 0.9)
    return 1 - np.exp(-img * 1.9 / (1 + 2.6 * k))          # the exposure follows the amount of matter in view

def hacer(arg):
    clip, fr = arg
    img = (titulo if clip == "titulo" else homogeneo)(fr)
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(OUT / clip / f"{fr:04d}.jpg", quality=90)
    return fr

if __name__ == "__main__":
    clips = sys.argv[1:2] or ["titulo", "homogeneo"]
    sel = [int(a) for a in sys.argv[2:]]
    trabajos = [(c, f) for c in clips for f in (sel or range({"titulo": 14 * FPS, "homogeneo": 36 * FPS}[c]))]
    with ProcessPoolExecutor() as ex:
        for _ in ex.map(hacer, trabajos, chunksize=1): pass
    print("ok", len(trabajos))
