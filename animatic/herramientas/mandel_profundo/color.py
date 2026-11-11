"""Colouring for the deep zoom (film look: navy depths, amber-cream glowing filaments, near-black interior)."""
import numpy as np

# palette stops along the escape-count coordinate (FUEGO-like, src/fractalTeaser.ts)
PAL = np.array([
    [0.00, 0.030, 0.035, 0.12],   # navy
    [0.18, 0.10, 0.10, 0.36],     # indigo
    [0.36, 0.48, 0.18, 0.20],     # ember / wine
    [0.54, 0.95, 0.55, 0.20],     # amber
    [0.68, 1.00, 0.88, 0.66],     # cream
    [0.84, 0.55, 0.26, 0.30],     # rose-copper
    [1.00, 0.030, 0.035, 0.12],   # navy
])
CREMA = np.array([1.0, 0.86, 0.62])
C_GLOBAL = 0.253
G_GLOBAL = 0.47
INTERIOR = np.array([0.010, 0.009, 0.016])


def paleta(u):
    u = np.mod(u, 1.0)
    xs = PAL[:, 0]
    i = np.clip(np.searchsorted(xs, u, side="right") - 1, 0, len(xs) - 2)
    a, b = PAL[i], PAL[i + 1]
    f = np.clip((u - a[..., 0]) / (b[..., 0] - a[..., 0]), 0, 1)
    f = f * f * (3 - 2 * f)
    return a[..., 1:] * (1 - f)[..., None] + b[..., 1:] * f[..., None]


def colorea(nu, de, base, span, ss=2, fase=0.0):
    """nu: smooth escape count (-1 inside); de: distance estimate in render pixels; base/span: the view's
    escape-count floor and spread (smoothed along the zoom); ss: supersampling factor."""
    dentro = nu < 0
    if base is None:
        # global mapping (the same at every depth, so consecutive keyframes agree exactly):
        # u = C * nu^G gives each view ~1 palette cycle from shallow (nu ~ 10) to deep (nu ~ 10^4)
        u = C_GLOBAL * np.maximum(nu, 0.0) ** G_GLOBAL + fase
    else:
        x = np.maximum(nu - base, 0.0) / span
        u = 0.85 * np.log1p(2.0 * x) + fase
    col = paleta(u)
    d = np.maximum(de / ss, 1e-6)               # distance to the set in output pixels
    ld = np.log2(d)
    # luminance: full near the set, falling into deep navy far away (scale-free: measured in pixels)
    lum = np.clip(1.0 - 0.10 * np.maximum(ld - 1.0, 0.0), 0.12, 1.0)
    col = col * lum[..., None]
    # a fine glowing thread right on the boundary (sub-pixel distance)
    filo = np.exp(-((ld + 0.5) / 1.3) ** 2)
    col = col * (1 - 0.35 * filo)[..., None] + filo[..., None] * CREMA * 0.35
    # far field fades to the navy of the palette's start
    lejos = np.clip((ld - 4.0) / 5.0, 0.0, 1.0)
    col = col * (1 - 0.8 * lejos)[..., None] + lejos[..., None] * PAL[0, 1:] * 0.9
    col[dentro] = INTERIOR
    return col
