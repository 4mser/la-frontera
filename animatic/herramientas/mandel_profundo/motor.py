"""Shared helpers: C renderer wrapper and colouring."""
import ctypes, os, math
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
_lib = ctypes.CDLL(os.path.join(AQUI, "libperturb.dylib"))
_lib.render.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int,
                        ctypes.c_double, ctypes.c_double, ctypes.c_double, ctypes.c_int, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_int]
NHILOS = max(1, (os.cpu_count() or 8))


def calcula(Z, periodic, w, h, offr, offi, pix, maxit, hilos=NHILOS):
    """Z: complex numpy array of the reference orbit. Returns (nu, de) float32 arrays (h, w); nu = -1 inside."""
    zr = np.ascontiguousarray(Z.real, dtype=np.float64)
    zi = np.ascontiguousarray(Z.imag, dtype=np.float64)
    nu = np.empty((h, w), np.float32)
    de = np.empty((h, w), np.float32)
    _lib.render(zr.ctypes.data, zi.ctypes.data, len(Z), 1 if periodic else 0, w, h, offr, offi, pix, maxit,
                nu.ctypes.data, de.ctypes.data, hilos)
    return nu, de


# FUEGO-like palette (src/fractalTeaser.ts): navy -> indigo -> ember -> amber -> cream -> rose -> navy
PAL = np.array([
    [0.00, 0.035, 0.03, 0.13],
    [0.20, 0.14, 0.11, 0.40],
    [0.38, 0.60, 0.24, 0.16],
    [0.54, 0.97, 0.62, 0.26],
    [0.66, 1.00, 0.92, 0.74],
    [0.80, 0.50, 0.22, 0.32],
    [1.00, 0.035, 0.03, 0.13],
])


def paleta(u):
    u = np.mod(u, 1.0)
    xs = PAL[:, 0]
    i = np.clip(np.searchsorted(xs, u, side="right") - 1, 0, len(xs) - 2)
    a, b = PAL[i], PAL[i + 1]
    f = np.clip((u - a[..., 0]) / (b[..., 0] - a[..., 0]), 0, 1)
    f = f * f * (3 - 2 * f)
    return a[..., 1:] * (1 - f)[..., None] + b[..., 1:] * f[..., None]


def colorea(nu, de, base, escala, fase=0.0, ss=1):
    """base: escape-count floor of the view; escala: count span of the view (both smoothed along the zoom)."""
    dentro = nu < 0
    x = np.maximum(nu - base, 0.0) / escala
    u = 0.55 * np.log1p(x * 6.0) + 0.35 * np.sqrt(x) + fase
    col = paleta(u)
    piso = 0.12 + 0.88 * np.clip(x * 3.0, 0, 1) ** 0.8
    col = col * piso[..., None]
    d = de / ss  # distance in output pixels
    borde = np.exp(-np.clip(d, 0, 50) * 0.9)
    oro = np.array([1.0, 0.80, 0.50])
    col = col * (1 - 0.35 * borde)[..., None] + borde[..., None] * oro * 0.55
    col[dentro] = np.array([0.012, 0.01, 0.02])
    return col


_lib.ball_period.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_double, ctypes.c_double, ctypes.c_double, ctypes.c_int]
_lib.ball_period.restype = ctypes.c_int


def periodo_bola(Z, periodic, offr, offi, r, maxit):
    zr = np.ascontiguousarray(Z.real, dtype=np.float64)
    zi = np.ascontiguousarray(Z.imag, dtype=np.float64)
    return _lib.ball_period(zr.ctypes.data, zi.ctypes.data, len(Z), 1 if periodic else 0, offr, offi, r, maxit)


_lib.newton_pert.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_double, ctypes.c_double, ctypes.c_int, ctypes.c_int, ctypes.c_void_p]
_lib.newton_pert.restype = ctypes.c_int


def newton_bola(Z, periodic, offr, offi, p, steps=60):
    zr = np.ascontiguousarray(Z.real, dtype=np.float64)
    zi = np.ascontiguousarray(Z.imag, dtype=np.float64)
    out = np.zeros(2)
    it = _lib.newton_pert(zr.ctypes.data, zi.ctypes.data, len(Z), 1 if periodic else 0, offr, offi, p, steps, out.ctypes.data)
    return it, out[0], out[1]


_bla = ctypes.CDLL(os.path.join(AQUI, "libbla.dylib"))
_bla.render_bla.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_double, ctypes.c_double,
                            ctypes.c_double, ctypes.c_long, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_int, ctypes.c_double,
                            ctypes.c_void_p, ctypes.c_long, ctypes.c_double, ctypes.c_double, ctypes.c_int]
EPS_BLA = 2.0 ** -40


def calcula_bla(Z, w, h, offr, offi, pix, maxit, lista=None, nu=None, de=None, eps=EPS_BLA, hilos=NHILOS, ref_abs=None):
    """Z: periodic reference orbit Z_0..Z_P (Z_P == 0). Computes all pixels, or only those in `lista` (into nu/de)."""
    P = len(Z) - 1
    zr = np.ascontiguousarray(Z.real, dtype=np.float64)
    zi = np.ascontiguousarray(Z.imag, dtype=np.float64)
    if nu is None:
        nu = np.empty((h, w), np.float32)
        de = np.empty((h, w), np.float32)
    lp, nl = None, 0
    if lista is not None:
        lista = np.ascontiguousarray(lista, dtype=np.int32)
        lp, nl = lista.ctypes.data, len(lista)
    _bla.render_bla(zr.ctypes.data, zi.ctypes.data, P, w, h, offr, offi, pix, maxit, nu.ctypes.data, de.ctypes.data,
                    hilos, eps, lp, nl, ref_abs.real if ref_abs is not None else 0.0,
                    ref_abs.imag if ref_abs is not None else 0.0, 1 if ref_abs is not None else 0)
    return nu, de
