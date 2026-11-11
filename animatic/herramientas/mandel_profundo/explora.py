"""Quick previews for choosing the zoom path.
usage: python3 explora.py out.png cre cim width [w h maxit]"""
import sys, math, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
import hp, motor


def referencia(cr, ci, radio, maxp=200000):
    p = hp.ball_period(cr, ci, radio, maxp)
    if p is None:
        return None
    n = hp.nucleus(cr, ci, p)
    q = hp.min_period(*n, p)
    if q != p:
        p = q
    return n, p


def vista(cr, ci, ancho, w=480, h=270, maxit=None, ref=None):
    radio = ancho * 0.6
    if ref is None:
        ref = referencia(cr, ci, radio)
    (nr, ni), p = ref
    Z = hp.periodic_orbit(nr, ni, p)
    pix = ancho / w
    offr, offi = hp.tof(cr - nr), hp.tof(ci - ni)
    if maxit is None:
        maxit = max(4000, 100 * p)
    nu, de = motor.calcula(Z, True, w, h, offr, offi, pix, maxit)
    ext = nu[nu >= 0]
    base = np.percentile(ext, 1) if ext.size else 0
    esc = max(np.percentile(ext, 60) - base, 1.0) if ext.size else 1
    col = motor.colorea(nu, de, base, esc * 4)
    return col, p, (nr, ni), nu


if __name__ == "__main__":
    out, a, b, w = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
    col, p, n, nu = vista(hp.fx(a), hp.fx(b), w)
    Image.fromarray((np.clip(col, 0, 1) ** (1 / 1.0) * 255).astype(np.uint8)).save(out)
    print("period", p, "inside%", (nu < 0).mean() * 100)
