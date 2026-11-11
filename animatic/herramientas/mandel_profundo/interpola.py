"""Composes 1920x1080 video frames of the deep zoom from the keyframes public/p10/mandel/kNNNN.png.

Keyframe k shows width 3.2*2^-k (2560x1440). A frame at zoom progress u (k = floor(u), f = u - k) scales
keyframe k by 2^f about the camera centre and cross-fades (weight f) to keyframe k+1, which covers the
central 2^(f-1) of the frame; outside it, keyframe k re-coloured with k+1's colour parameters
(mandel/sig/kNNNN.png) is used, so the hand-over never shows a seam.

usage:
  python3 interpola.py frame U out.jpg              one frame at progress U
  python3 interpola.py secuencia [lista.json]       frames public/p10/vid/mandel/NNNN.jpg
        lista.json: a JSON list of u per frame (or {"u": [...]}); without it, the default timeline:
        60 s at 30 fps with constant zoom speed (1 s ease-in, 2.5 s ease-down at the end), then a 6 s
        slow push until the final minibrot spans 40% of the frame width.
  python3 interpola.py linea                        prints the default timeline (time, u, width, depth)
options: --fps 30  --out DIR  --procs N  --quality 92
"""
import sys, os, json, math, argparse
from multiprocessing import Pool
import numpy as np
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import camino

RAIZ = os.path.abspath(os.path.join(AQUI, "..", ".."))
KEYS = os.environ.get("MANDEL_KEYS", os.path.join(RAIZ, "public", "p10", "mandel"))
SALIDA = os.path.join(RAIZ, "public", "p10", "vid", "mandel")
KW, KH = 2560, 1440
OW, OH = 1920, 1080

_cache = {}


def keyframe(k, sig=False):
    clave = (k, sig)
    if clave not in _cache:
        if len(_cache) > 5:
            _cache.pop(next(iter(_cache)))
        ruta = os.path.join(KEYS, "sig" if sig else "", "k%04d.png" % k)
        _cache[clave] = Image.open(ruta).convert("RGB")
    return _cache[clave]


def parche(k, u, sig=False):
    """Keyframe k resampled into the frame at progress u: (x0, y0, x1, y1) output region and the RGB patch."""
    wk, wu = camino.ancho(k), camino.ancho(u)
    ck, cu = camino.centro_rel(k), camino.centro_rel(u)
    s = (wk / KW) / (wu / OW)                     # output pixels per keyframe pixel
    shx = (ck.real - cu.real) / (wu / OW)
    shy = -(ck.imag - cu.imag) / (wu / OW)
    X = lambda x: (x - KW / 2) * s + OW / 2 + shx
    Y = lambda y: (y - KH / 2) * s + OH / 2 + shy
    x0 = max(0, math.ceil(X(0) - 1e-6)); x1 = min(OW, math.floor(X(KW) + 1e-6))
    y0 = max(0, math.ceil(Y(0) - 1e-6)); y1 = min(OH, math.floor(Y(KH) + 1e-6))
    if x1 <= x0 or y1 <= y0:
        return None
    ix = lambda X_: (X_ - OW / 2 - shx) / s + KW / 2
    iy = lambda Y_: (Y_ - OH / 2 - shy) / s + KH / 2
    box = (max(0.0, ix(x0)), max(0.0, iy(y0)), min(float(KW), ix(x1)), min(float(KH), iy(y1)))
    im = keyframe(k, sig).resize((x1 - x0, y1 - y0), Image.LANCZOS, box=box)
    return (x0, y0, x1, y1), np.asarray(im, dtype=np.float32)


def compone(u):
    u = min(max(u, 0.0), float(camino.KMAX))
    k = min(int(math.floor(u)), camino.KMAX)
    f = u - k
    (x0, y0, x1, y1), base = parche(k, u)
    out = base  # keyframe k always covers the whole frame
    if f > 1e-4 and k + 1 <= camino.KMAX:
        p = parche(k + 1, u)
        if p is not None:
            (a0, b0, a1, b1), pt = p
            h, w = pt.shape[:2]
            feather = max(1.0, 0.07 * (1.0 - f) * w)
            xs = np.minimum(np.arange(w) + 0.5, w - np.arange(w) - 0.5)
            ys = np.minimum(np.arange(h) + 0.5, h - np.arange(h) - 0.5)
            # no feather on sides that touch the frame border (nothing of keyframe k+1 is missing there)
            if a0 == 0 and a1 == OW: xs = np.full(w, 1e9)
            if b0 == 0 and b1 == OH: ys = np.full(h, 1e9)
            m = np.clip(np.minimum(xs[None, :], ys[:, None]) / feather, 0, 1)
            m = m * m * (3 - 2 * m)
            # keyframe k in k+1's colours fills what k+1 does not cover, so colours match across its edge
            _, nxt = parche(k, u, sig=True)
            nxt = nxt.copy()
            m = m[..., None]
            nxt[b0:b1, a0:a1] = nxt[b0:b1, a0:a1] * (1 - m) + pt * m
            out = out * (1 - f) + nxt * f
    return Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8))


def linea_defecto(fps=30, t_zoom=60.0, t_hold=6.0, frac_final=0.40, push=0.40, t_in=1.0, t_out=2.5):
    """u per frame: constant zoom speed (eased in over t_in and down over t_out), then a slow push of
    `push` octaves over t_hold ending with the final minibrot spanning frac_final of the frame width."""
    u_fin = camino.u_relleno(frac_final)
    vp = push / t_hold                         # push speed (octaves/s)
    n = int(round((t_zoom + t_hold) * fps))
    dt = 1.0 / fps
    # speed profile with unknown cruise speed V: v = V*e_in*(1-d) + vp*d, d = ramp down over the last t_out s
    def perfil(V):
        us, u = [], 0.0
        for i in range(n):
            us.append(u)
            t = (i + 0.5) * dt
            e_in = min(1.0, t / t_in) if t_in > 0 else 1.0
            e_in = e_in * e_in * (3 - 2 * e_in)
            if t < t_zoom - t_out:
                d = 0.0
            elif t < t_zoom:
                d = (t - (t_zoom - t_out)) / t_out
                d = d * d * (3 - 2 * d)
            else:
                d = 1.0
            v = V * e_in * (1 - d) + vp * d
            if t > t_zoom:                      # the push eases out over its last 40%
                r = (t - t_zoom) / t_hold
                v = vp * (1.0 if r < 0.6 else max(0.0, 1 - ((r - 0.6) / 0.4) ** 2) * 1.0)
            u += v * dt
        return us, u
    lo, hi = 0.1, 20.0
    for _ in range(80):
        V = 0.5 * (lo + hi)
        _, uf = perfil(V)
        if uf > u_fin: hi = V
        else: lo = V
    us, uf = perfil(0.5 * (lo + hi))
    us[-1] = min(us[-1], u_fin)
    return us


def _trabajo(args):
    i, u, out, q = args
    compone(u).save(os.path.join(out, "%04d.jpg" % i), quality=q, subsampling=0)
    return i


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("modo", choices=["frame", "secuencia", "linea"])
    ap.add_argument("args", nargs="*")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--out", default=SALIDA)
    ap.add_argument("--procs", type=int, default=max(1, (os.cpu_count() or 4) - 2))
    ap.add_argument("--quality", type=int, default=92)
    a = ap.parse_args()
    if a.modo == "frame":
        compone(float(a.args[0])).save(a.args[1], quality=a.quality, subsampling=0)
    elif a.modo == "linea":
        us = linea_defecto(a.fps)
        for i in range(0, len(us), a.fps):
            u = us[i]
            print("t=%5.1fs  u=%7.3f  width=%.2e  (10^%d)" % (i / a.fps, u, camino.ancho(u), math.floor(math.log10(camino.ancho(u)))))
        print("last frame u=%.3f" % us[-1])
    else:
        if a.args:
            d = json.load(open(a.args[0]))
            us = d["u"] if isinstance(d, dict) else d
        else:
            us = linea_defecto(a.fps)
        os.makedirs(a.out, exist_ok=True)
        with Pool(a.procs) as pool:
            for n, i in enumerate(pool.imap_unordered(_trabajo, [(i, u, a.out, a.quality) for i, u in enumerate(us)], chunksize=8)):
                if n % 100 == 0:
                    print("%d/%d" % (n, len(us)), flush=True)
        print("done:", len(us), "frames in", a.out)
