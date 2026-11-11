"""Renders the keyframes public/p10/mandel/kNNNN.png (2560x1440, 2x2 supersampled), plus
public/p10/mandel/sig/kNNNN.png: the same keyframe coloured with keyframe k+1's colour parameters.
Keyframe k shows width 3.2*2^-k centred on camino.centro (eased from the whole set's centre for k < 8).
usage: python3 render_keyframes.py [k0 k1] [--skip-existing] [--out DIR] [--scale S]"""
import sys, os, json, time, math, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image, ImageFilter
import camino, motor, color
from estadisticas import referencia, offset

RAIZ = os.path.abspath(os.path.join(camino.AQUI, "..", ".."))
SALIDA = os.path.join(RAIZ, "public", "p10", "mandel")
W, H, SS = 2560, 1440, 2
K_FIJO = 184


def parametros_color():
    """Escape-count floor and spread per keyframe, smoothed along the zoom (log domain, gaussian sigma 3)."""
    st = json.load(open(os.path.join(camino.AQUI, "estadisticas.json")))
    p1 = np.array([s["pct"][1] for s in st])
    p95 = np.array([s["pct"][6] for s in st])
    lb = np.log(np.maximum(p1 * 0.98, 1.0))
    ls = np.log(np.maximum(p95 - p1, 10.0))
    def suave(a, sig=3.0):
        n = len(a)
        r = np.arange(-int(4 * sig), int(4 * sig) + 1)
        g = np.exp(-0.5 * (r / sig) ** 2)
        pad = np.concatenate([np.full(len(r) // 2, a[0]), a, np.full(len(r) // 2, a[-1])])
        return np.convolve(pad, g / g.sum(), mode="valid")
    b, s = np.exp(suave(lb)), np.exp(suave(ls))
    # the last keyframes share one colouring: the final minibrot then glows the same in all of them
    b[K_FIJO:] = b[K_FIJO]
    s[K_FIJO:] = s[K_FIJO]
    return b, s, st


def maxit_de(k, st):
    P = camino.DEST["period"]
    s = st[min(k, len(st) - 1)]
    p0 = s["pct"][0]
    if k > 100 and (s["inside"] > 0.0005 or s["late"] > 0.0005):
        return int(p0 + 300 * P)
    return int(max(20000, 6 * p0 + 20000))


def colorea_ss(nu, de, base, span, w, h, ss):
    col = color.colorea(nu, de, base, span, ss=ss).astype(np.float32)
    dentro = (nu < 0).astype(np.float32)
    # 2x2 box downsample
    col = col.reshape(h, ss, w, ss, 3).mean(axis=(1, 3))
    dentro = dentro.reshape(h, ss, w, ss).mean(axis=(1, 3))
    # faint warm glow spilling from the boundary into the interior
    if dentro.max() > 0:
        im = Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8))
        r = max(2.0, w / 320.0)
        glow = np.asarray(im.filter(ImageFilter.GaussianBlur(r)), dtype=np.float32) / 255.0
        glow2 = np.asarray(im.filter(ImageFilter.GaussianBlur(r * 4)), dtype=np.float32) / 255.0
        calido = np.array([1.0, 0.78, 0.5], np.float32)
        col = col + dentro[..., None] * (0.55 * glow + 0.35 * glow2) * calido
    return np.clip(col, 0, 1)


def render(k, Z, absc, bases, spans, st, w=W, h=H, ss=SS):
    """Returns (keyframe k in its own colouring, keyframe k in keyframe k+1's colouring, maxit, inside fraction).
    The second image lets interpola.py fill the part of the frame keyframe k+1 does not cover with exactly
    the colours of k+1, so the cross-fade never shows a seam."""
    ancho = camino.ancho(k)
    o = offset(k)
    ws, hs = w * ss, h * ss
    pix = ancho / ws
    mi = maxit_de(k, st)
    nu, de = motor.calcula_bla(Z, ws, hs, o.real, o.imag, pix, mi, ref_abs=absc if ancho > 1e-9 else None)
    col = colorea_ss(nu, de, bases[k], spans[k], w, h, ss)
    sig = None
    if k + 1 < len(bases):
        sig = colorea_ss(nu, de * 2.0, bases[k + 1], spans[k + 1], w, h, ss)   # distances in k+1's pixels
    return col, sig, mi, float((nu < 0).mean())


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("rango", nargs="*", type=int)
    ap.add_argument("--skip-existing", action="store_true")
    ap.add_argument("--out", default=SALIDA)
    ap.add_argument("--scale", type=float, default=1.0, help="resolution scale for tests")
    a = ap.parse_args()
    k0, k1 = (a.rango + [0, camino.KMAX])[:2] if a.rango else (0, camino.KMAX)
    os.makedirs(a.out, exist_ok=True)
    Z, absc = referencia()
    bases, spans, st = parametros_color()
    w, h = int(W * a.scale), int(H * a.scale)
    t0 = time.time()
    for k in range(k0, k1 + 1):
        ruta = os.path.join(a.out, "k%04d.png" % k)
        if a.skip_existing and os.path.exists(ruta):
            continue
        t = time.time()
        col, sig, mi, fin = render(k, Z, absc, bases, spans, st, w, h)
        Image.fromarray((col * 255 + 0.5).astype(np.uint8)).save(ruta, compress_level=4)
        if sig is not None and k < camino.KMAX:
            os.makedirs(os.path.join(a.out, "sig"), exist_ok=True)
            Image.fromarray((sig * 255 + 0.5).astype(np.uint8)).save(os.path.join(a.out, "sig", "k%04d.png" % k), compress_level=4)
        print("k%04d  width %.3e  maxit %d  inside %.3f  %.1fs  (total %.0fs)" % (k, camino.ancho(k), mi, fin, time.time() - t, time.time() - t0), flush=True)
