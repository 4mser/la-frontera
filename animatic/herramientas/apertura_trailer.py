"""LA FRONTERA · trailer, the opening: one camera that never leaves the centre of the frame and never stops going in,
from the cosmic web to the foam of space-time. Every world appears inside the point the camera is diving into and
grows out of it at the camera's own rate (one zoom rate Z(t) shared by every stage, as the journey of chapter X).

web → cluster → galaxy → star → Earth → hurricane → its eye → an eye → its dendrites → a leaf with dew → a drop →
radiolarians → a diatom → atoms → (simulated) an electron's cloud → a nucleus → quarks and their field → quantum foam.

usage: PYTHONPATH=pylib python3 herramientas/apertura_trailer.py [frames…]  → public/trailer/apertura/NNNN.jpg
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from concurrent.futures import ProcessPoolExecutor

Image.MAX_IMAGE_PIXELS = None
RAIZ = Path(__file__).resolve().parent.parent
P = RAIZ / "public"
OUT = P / "trailer/apertura"
W, H, FPS = 1920, 1080, 30


def sv(x): x = np.clip(x, 0.0, 1.0); return x * x * (3 - 2 * x)


# ── the stages: (source, anchor (cx, cy), view width at entry, at exit, seconds, options) ──
# the width is the view's width in units of the source (image widths for a photograph); the anchor never moves
ETAPAS = [
    ("p5/1-red.jpg",                                   (0.458, 0.49),  0.80, 0.14, 1.5, {}),
    ("p5/1b-galaxias.jpg",                             (0.485, 0.649), 0.30, 0.09, 0.8, {}),
    ("p5/2-galaxia.jpg",                               (0.6758, 0.6717), 4.05, 0.13, 1.1, {}),
    ("p5/3-estrella.jpg",                              (0.5, 0.5),     0.5, 0.06, 0.7, {}),
    ("p5/4-tierra.jpg",                                (0.5702, 0.2553), 8.46, 0.14, 1.2, {}),
    ("p5/4b-huracan.jpg",                              (0.508, 0.507), 0.5, 0.075, 0.7, {}),
    ("p5/4c-ojo-huracan.jpg",                          (0.57, 0.45),   0.42, 0.2, 0.6, {}),
    ("p5/5-ojo.jpg",                                   (0.41, 0.515),  0.395, 0.144, 0.8, {}),
    ("p5/7-neuronas.jpg",                              (0.875, 0.385), 0.5, 0.05, 0.9, {}),
    ("p10/real/gota_rocio_hoja_cc0.jpg",               (0.467, 0.443), 0.75, 0.05, 1.0, {}),
    ("p10/real/radiolario_dorataspida_drews.jpg",      (0.5, 0.5),     1.3, 0.12, 0.8, {}),
    ("p10/real/radiolario_grobe.jpg",                  (0.5, 0.5),     1.2, 0.10, 0.7, {}),
    ("p10/real/diatomea_arachnoidiscus_picturepest.jpg", (0.4975, 0.4975), 1.1, 0.06, 0.8, {"invertir": True}),
    ("p4/09-atomos.jpg",                               (0.69, 0.66),   0.9, 0.22, 0.6, {}),
    ("orbital",                                        (0.0, 0.0),     75.0, 1.2, 1.1, {}),
    ("nucleo",                                         (0.0, 0.0),     160.0, 2.4, 1.0, {}),
    ("quarks",                                         (0.0, 0.0),     2.4, 0.32, 1.1, {}),
    ("espuma",                                         (0.0, 0.0),     1.0, 0.004, 1.9, {}),
]
CRUCE = 0.55                                     # e-folds of overlap between two stages
NZ = [np.log(e[2] / e[3]) for e in ETAPAS]
Z0 = np.concatenate([[0], np.cumsum(NZ)])        # where each stage begins on the zoom axis
DUR = sum(e[4] for e in ETAPAS)

# the zoom rate: each stage's own (e-folds / s) at its middle, smoothed, then scaled to land exactly on the end
_mid = np.cumsum([e[4] for e in ETAPAS]) - np.array([e[4] for e in ETAPAS]) / 2
_TT = np.arange(0, DUR + 1e-9, 1 / 600)
_R = np.interp(_TT, _mid, [n / e[4] for n, e in zip(NZ, ETAPAS)])
_R *= np.clip(_TT / 0.5, 0.25, 1)                # it starts gently, out of the dark
_Zc = np.concatenate([[0], np.cumsum((_R[1:] + _R[:-1]) / 2 * np.diff(_TT))])
_Zc *= Z0[-1] / _Zc[-1]
def Z(t): return float(np.interp(t, _TT, _Zc))


_cache = {}
def fuente(ruta, op):
    if ruta not in _cache:
        im = Image.open(P / ruta).convert("RGB")
        if max(im.size) > 6000: im = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
        a = np.asarray(im).astype(np.float32) / 255
        if op.get("invertir"): a = (1 - a) ** 1.4 * np.array([1.0, 0.93, 0.8], np.float32)
        b = int(0.08 * min(im.size))              # a feathered border: no image ever shows its edge
        r = sv(np.arange(im.width) / b); r = np.minimum(r, r[::-1])
        c = sv(np.arange(im.height) / b); c = np.minimum(c, c[::-1])
        a = a * np.outer(c, r)[..., None]
        _cache[ruta] = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    return _cache[ruta]


def foto(ruta, c, w, op):
    im = fuente(ruta, op)
    a = w * im.width / W
    T = (a, 0, c[0] * im.width - W / 2 * a, 0, a, c[1] * im.height - H / 2 * a)
    return np.asarray(im.transform((W, H), Image.AFFINE, T, resample=Image.BICUBIC, fillcolor=(0, 0, 0))).astype(np.float32) / 255


# ── the simulated worlds: x, y in the stage's own units, the frame w units wide ──
def rejilla(w):
    x = (np.arange(W) - W / 2 + 0.5) * (w / W)
    y = (np.arange(H) - H / 2 + 0.5) * (w / W)
    return np.meshgrid(x, y)


def brillo(img, r=18, k=0.6):
    pim = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(r / 4))
    return img + k * np.asarray(pim.resize((W, H), Image.BILINEAR)).astype(np.float32) / 255


def orbital(w, t):
    """an electron's cloud: |ψ|² of hydrogen's 4f (m=0) plus a little 3d, cut through its axis, turning slowly; the
    nucleus a point of light at the centre (units: Bohr radii)"""
    x, y = rejilla(w)
    ang = 0.35 * t
    xr, yr = x * np.cos(ang) - y * np.sin(ang), x * np.sin(ang) + y * np.cos(ang)
    r = np.hypot(xr, yr) + 1e-6; c = yr / r
    f4 = r ** 6 * np.exp(-r / 2) * (5 * c ** 3 - 3 * c) ** 2 / 2.2e4
    d3 = r ** 4 * np.exp(-2 * r / 3) * (3 * c ** 2 - 1) ** 2 / 70.0
    d = np.clip(f4 + 0.6 * d3, 0, None)
    d = 1 - np.exp(-d * 1.5)
    img = d[..., None] * np.array([1.0, 0.72, 0.38], np.float32) + (d ** 3)[..., None] * np.array([0.3, 0.35, 0.4], np.float32)
    rr = np.hypot(x, y) / w * W                   # the nucleus: a point that stays a point (its glow, in pixels)
    img += (np.exp(-np.hypot(x, y) / 0.03) * 1.6 + np.exp(-rr / 9) * 0.6)[..., None] * np.array([1.0, 0.95, 0.85], np.float32)
    return brillo(img, 24, 0.5)


_rng = np.random.default_rng(7)
_NUC = []
while len(_NUC) < 16:                             # sixteen nucleons packed in a ball (units: fm)
    p = _rng.normal(size=3); p = p / np.linalg.norm(p) * _rng.uniform(0, 1.9) ** 0.7 * 1.9
    if len(_NUC) == 0: p = np.zeros(3)
    if all(np.linalg.norm(p - q[:3]) > 1.25 for q in _NUC): _NUC.append(np.r_[p, len(_NUC) % 2])


def nucleo(w, t):
    """a nucleus: protons (amber) and neutrons (pale blue) as lit spheres, the one at the centre in front"""
    x, y = rejilla(w)
    img = np.zeros((H, W, 3), np.float32); zb = np.full((H, W), -9.0, np.float32)
    ang = 0.25 * t; ca, sa = np.cos(ang), np.sin(ang)
    luz = np.array([-0.45, -0.55, 0.7]); luz /= np.linalg.norm(luz)
    for i, (px, py, pz, tipo) in sorted(enumerate(_NUC), key=lambda q: q[1][2] * 0 + (q[0] == 0) * 9 + q[1][2]):
        X, Zz = px * ca + pz * sa, -px * sa + pz * ca
        if i == 0: Zz = 5.0
        R = 0.85
        dx, dy = x - X, y - py
        q = R * R - dx * dx - dy * dy
        m = (q > 0) & (Zz > zb)
        if not m.any(): continue
        nz = np.sqrt(np.clip(q, 0, None)) / R
        dif = np.clip((-dx / R * luz[0] - dy / R * luz[1] + nz * luz[2]), 0, 1)
        esp = dif ** 28
        col = np.array([1.0, 0.62, 0.32] if tipo == 0 else [0.55, 0.72, 1.0], np.float32)
        s = (0.12 + 0.9 * dif)[..., None] * col + esp[..., None] * 0.8
        img[m] = s[m]; zb[m] = Zz
    rr = np.hypot(x, y)
    img += (np.exp(-rr / 2.6) * 0.25)[..., None] * np.array([1.0, 0.8, 0.6], np.float32)
    return brillo(img, 20, 0.45)


def _ruido(x, y, sem):
    """value noise, smooth, on any grid (one octave at unit frequency)"""
    xi, yi = np.floor(x).astype(np.int64), np.floor(y).astype(np.int64)
    fx, fy = x - xi, y - yi; fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    def h(a, b):
        n = (a * 374761393 + b * 668265263 + sem * 2147483647) & 0xFFFFFFFF
        n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
        return ((n ^ (n >> 16)) & 0xFFFF) / 65535.0
    return (h(xi, yi) * (1 - fx) + h(xi + 1, yi) * fx) * (1 - fy) + (h(xi, yi + 1) * (1 - fx) + h(xi + 1, yi + 1) * fx) * fy


def quarks(w, t):
    """inside a nucleon: three quarks (the three colour charges), the gluon field between them as flux tubes that
    meet in a Y, and the sea of pairs that appear and vanish (units: fm, the nucleon 0.85 fm in radius)"""
    x, y = rejilla(w)
    img = np.zeros((H, W, 3), np.float32)
    rr = np.hypot(x, y)
    img += (np.exp(-((rr - 0.85) / 0.05) ** 2) * 0.35 + np.exp(-rr / 0.6) * 0.18)[..., None] * np.array([1.0, 0.85, 0.7], np.float32)
    cols = [np.array(c, np.float32) for c in ([1.0, 0.35, 0.25], [0.35, 1.0, 0.5], [0.35, 0.55, 1.0])]
    for k in range(3):
        a = 0.6 * t + k * 2 * np.pi / 3
        qx, qy = 0.48 * np.cos(a) * (1 + 0.08 * np.sin(2.1 * t + k)), 0.48 * np.sin(a) * (1 + 0.08 * np.cos(1.7 * t + k))
        # the tube: distance to the segment from the quark to the junction, wobbling with the field
        L = np.hypot(qx, qy); ux, uy = qx / L, qy / L
        s = np.clip(x * ux + y * uy, 0, L); d = np.hypot(x - s * ux, y - s * uy)
        wob = 0.05 * (_ruido(s * 9 + 3 * t, k * 7.0 + 0 * s, 11) - 0.5)
        tubo = np.exp(-((d + wob) / 0.035) ** 2) * (0.6 + 0.4 * _ruido(s * 14 - 5 * t, k * 3.0 + 0 * s, 5))
        img += (tubo * 0.45 * np.clip(s / 0.12, 0.25, 1))[..., None] * (0.55 * cols[k] + 0.45)
        dq = np.hypot(x - qx, y - qy)
        img += (np.exp(-dq / 0.045) * 1.3 + np.exp(-dq / 0.16) * 0.35)[..., None] * cols[k]
    # the sea: pairs flickering in and out, every 0.12 s a new generation
    gen = int(t / 0.12)
    for g in (gen - 1, gen):
        rg = np.random.default_rng(1000 + g)
        vida = np.sin(np.pi * np.clip((t - g * 0.12) / 0.24, 0, 1))
        for _ in range(16):
            px, py = rg.uniform(-0.8, 0.8, 2); ang = rg.uniform(0, np.pi); sep = rg.uniform(0.02, 0.06)
            for sg in (1, -1):
                d = np.hypot(x - px - sg * sep * np.cos(ang), y - py - sg * sep * np.sin(ang))
                img += (np.exp(-d / 0.012) * 0.7 * vida)[..., None] * np.array([1.0, 0.95, 0.85], np.float32)
    return brillo(img / (1 + 0.35 * img.max(axis=2, keepdims=True)), 22, 0.45)


def espuma(w, t):
    """space-time at the smallest scale: a foam that never settles, the same at every depth (octaves sliding through
    a window in log-scale, so the zoom never reaches its end)"""
    x, y = rejilla(1.0)
    acc = np.zeros((H, W), np.float32); tot = 0
    L = -np.log2(w)                                # how deep we are, in octaves
    for k in range(-1, 6):
        o = np.floor(L) + k                         # an octave that exists at depth o
        f = 2.0 ** o * 3.0                          # its frequency on screen
        peso = np.exp(-0.5 * ((o - L - 2.2) / 1.4) ** 2)
        sx = x * f / (2 ** L); sy = y * f / (2 ** L)
        sem = int(o) & 0xFFFF
        n = _ruido(sx + 0.9 * t + 31.7 * sem % 97, sy - 0.6 * t + 17.3 * sem % 89, sem)
        acc += peso * n; tot += peso
    n = acc / tot
    burb = np.exp(-((n - 0.5) / 0.035) ** 2)        # the bubble walls
    v = 0.15 * n + burb * 0.9
    img = v[..., None] * np.array([1.0, 0.86, 0.66], np.float32) + (burb ** 4)[..., None] * np.array([0.4, 0.5, 0.7], np.float32)
    return brillo(img, 26, 0.6)


SIM = {"orbital": orbital, "nucleo": nucleo, "quarks": quarks, "espuma": espuma}


def etapa(k, t):
    ruta, c, w0, w1, _, op = ETAPAS[k]
    w = w0 * np.exp(-(Z(t) - Z0[k]))
    return SIM[ruta](w, t) if ruta in SIM else foto(ruta, c, w, op)


RR = np.hypot(np.arange(W)[None, :] - W / 2, np.arange(H)[:, None] - H / 2) / np.hypot(W / 2, H / 2)


def cuadro(fr):
    t = fr / FPS; z = Z(t)
    k = int(np.searchsorted(Z0, z, side="right") - 1); k = min(max(k, 0), len(ETAPAS) - 1)
    img = etapa(k, t)
    # the next world opens out of the centre of this one: a round, soft window that grows to beyond the corners
    if k + 1 < len(ETAPAS) and z > Z0[k + 1] - CRUCE:
        p = (z - (Z0[k + 1] - CRUCE)) / (2 * CRUCE)
        R = 1.5 * sv(p) ** 0.8
        m = sv((R - RR) / 0.28)[..., None]
        img = img * (1 - m) + etapa(k + 1, t) * m
    elif k > 0 and z < Z0[k] + CRUCE:
        p = (z - (Z0[k] - CRUCE)) / (2 * CRUCE)
        R = 1.5 * sv(p) ** 0.8
        m = sv((R - RR) / 0.28)[..., None]
        img = etapa(k - 1, t) * (1 - m) + img * m
    # out of the dark at the start; the foam flares white at the very end (the hit), then the cut to black
    img *= sv(t / 0.5)
    img = img + sv((t - (DUR - 0.45)) / 0.45) * 1.2
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(OUT / f"{fr:04d}.jpg", quality=92)
    return fr


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    sel = [int(a) for a in sys.argv[1:]] or range(int(round(DUR * FPS)))
    with ProcessPoolExecutor() as ex:
        for _ in ex.map(cuadro, sel, chunksize=2): pass
    print("ok", DUR, "s", len(list(OUT.glob("*.jpg"))), "frames")
