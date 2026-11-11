"""Epilogue of chapter X, act A «Una forma que nos lleva a otra»: the camera keeps going into the dark centre of the
copy at ×10⁵⁶ and never turns back. The copy's dark interior is rounded, little by little, into a pupil (a polar warp
that maps its outline Rs(θ) onto a circle); its escape-time rings become the fibres of a real iris (Osmo Lundell,
CC BY-SA), a front that travels from the edge of the frame inwards; through the pupil, far inside, a light: the
retina (OptometrusPrime, CC BY-SA 2.0) grows out of the dark and the camera follows its vessels until they are lost
in the dark. 36 s, 30 fps → public/p10/vid/ojo/NNNN.jpg. Every frame depends only on t.

usage: PYTHONPATH=pylib python3 herramientas/ojo_epilogo.py [frames]
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from concurrent.futures import ProcessPoolExecutor

RAIZ = Path(__file__).resolve().parent.parent
P = RAIZ / "public"
OUT = P / "p10/vid/ojo"
W, H, FPS, DUR = 1920, 1080, 30, 36.0
Image.MAX_IMAGE_PIXELS = None


def ease(x): x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)


def oscuro_conexo(rgb, semilla, umbral):
    """mask of the dark region connected to the seed (flood fill on a thresholded copy)"""
    L = (rgb.mean(axis=2) < umbral).astype(np.uint8) * 255
    im = Image.fromarray(L).copy()
    ImageDraw.floodfill(im, semilla, 128)
    return np.array(im) == 128


# ── the copy: its dark interior, its centre and its outline per angle ──
COPIA = np.asarray(Image.open(P / "p10/vid/mandel/1979.jpg").convert("RGB")).astype(np.float32) / 255
_m = oscuro_conexo(COPIA, (840, 540), 0.10)
# the bulbs that touch it only at a point count too: every dark pixel near it, then closed (dilate, erode)
_yy, _xx = np.mgrid[0:H, 0:W]
_c0 = np.array(np.nonzero(_m)).mean(axis=1)
_m = (COPIA.mean(axis=2) < 0.10) & (np.hypot(_yy - _c0[0], _xx - _c0[1]) < 430)
_mi = Image.fromarray((_m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(41)).filter(ImageFilter.MinFilter(41))
_m = np.array(_mi) > 127
_ys, _xs = np.nonzero(_m)
CX, CY = float(_xs.mean()), float(_ys.mean())                    # centroid of the dark interior (source pixels)
RC = float(np.sqrt(_m.sum() / np.pi))                             # radius of the circle of the same area
_ang = np.arctan2(_ys - CY, _xs - CX); _rad = np.hypot(_xs - CX, _ys - CY)
NB = 720
_b = ((_ang + np.pi) / (2 * np.pi) * NB).astype(int) % NB
RS = np.zeros(NB); np.maximum.at(RS, _b, _rad)
RS = np.maximum(RS, 0.55 * RC)
RS = np.array([RS[(np.arange(-8, 9) + i) % NB].max() for i in range(NB)])   # no narrow notches
_k = np.ones(25) / 25
RS = np.convolve(np.concatenate([RS[-12:], RS, RS[:12]]), _k, "same")[12:-12]   # smooth, circularly

# ── the iris: its pupil ──
IRIS = Image.open(P / "p10/real/ojo_iris_lundell_ccbysa.jpg").convert("RGB")
_ir = np.asarray(IRIS.resize((IRIS.width // 4, IRIS.height // 4))).astype(np.float32) / 255
_mp = oscuro_conexo(_ir, (int(_ir.shape[1] * 0.52), int(_ir.shape[0] * 0.52)), 0.12)
_py, _px = np.nonzero(_mp)
IPX, IPY = float(_px.mean()) * 4, float(_py.mean()) * 4
IPR = float(np.sqrt(_mp.sum() / np.pi)) * 4                        # pupil radius in the iris image (px)

# ── the retina ──
_ret = Image.open(P / "p5/6-retina.png")
RET = Image.new("RGB", _ret.size, (0, 0, 0)); RET.paste(_ret.convert("RGB"), mask=_ret.split()[-1] if _ret.mode == "RGBA" else None)
RDX, RDY, RDR = 0.495 * RET.width, 0.5 * RET.height, 0.495 * RET.height   # the fundus disc
RTX, RTY = 0.355 * RET.width, 0.43 * RET.height                             # where the camera goes: the optic disc, where vessels branch

# ── one zoom for everything: rate keyed in e-folds per second ──
RATE = [(0, 0.035), (6, 0.05), (9, 0.07), (11.0, 0.10), (12.5, 0.45), (15.0, 0.60), (36, 0.60)]
RATE_R = [(0, 0.9), (13.8, 0.9), (17.0, 0.95), (19.2, 0.45), (20.6, 0.12), (36, 0.08)]   # the retina's own approach (v3: shorter)
_TT = np.arange(0, DUR + 1, 1 / 600)
_Z = np.concatenate([[0], np.cumsum(np.interp(_TT, *zip(*RATE))[1:] * np.diff(_TT))])
def Z(t): return float(np.exp(np.interp(t, _TT, _Z)))
_ZR = np.concatenate([[0], np.cumsum(np.interp(_TT, *zip(*RATE_R))[1:] * np.diff(_TT))])
def ZR(t): return float(np.exp(np.interp(t, _TT, _ZR)))

XX, YY = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))


def bilineal(img, sx, sy):
    h, w = img.shape[:2]
    sx = np.clip(sx, 0, w - 1.001); sy = np.clip(sy, 0, h - 1.001)
    x0 = sx.astype(np.int32); y0 = sy.astype(np.int32); fx = (sx - x0)[..., None]; fy = (sy - y0)[..., None]
    a = img[y0, x0]; b = img[y0, x0 + 1]; c = img[y0 + 1, x0]; d = img[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def centro(t):
    """the pupil's place on screen: from where the copy's interior is to the centre of the frame"""
    u = ease(t / 6.0)
    return CX + (W / 2 - CX) * u, CY + (H / 2 - CY) * u


def copia(t, z, w):
    """the copy, pushed by z about its interior and warped by w ∈ [0, 1] so the interior becomes a circle"""
    px, py = centro(t)
    dx, dy = XX - px, YY - py
    r = np.hypot(dx, dy); th = np.arctan2(dy, dx)
    rs = RS[(((th + np.pi) / (2 * np.pi)) * NB).astype(int) % NB]
    gan = RC / rs - 1
    rsrc = r / z
    for _ in range(5):                                            # solve r = z·ρ·f(θ, ρ) for ρ
        u = rsrc / rs
        k = np.clip((2.6 - u) / 1.6, 0, 1); k = k * k * (3 - 2 * k)
        rsrc = r / (z * (1 + w * gan * k))
    return bilineal(COPIA, CX + rsrc * np.cos(th), CY + rsrc * np.sin(th))


def iris(t, z):
    """the iris, with its pupil exactly on the circle the copy's interior became"""
    px, py = centro(t)
    a = IPR / (RC * z)
    T = (a, 0, IPX - px * a, 0, a, IPY - py * a)
    return np.asarray(IRIS.transform((W, H), Image.AFFINE, T, resample=Image.BICUBIC, fillcolor=(0, 0, 0))).astype(np.float32) / 255


def retina(t, zr):
    """the fundus, its disc of radius 7·zr px, always centred on the optic disc (the light far inside is the disc itself)"""
    cx, cy = RTX, RTY                                             # aimed at the optic disc from the first instant: no pan
    a = RDR / (7.0 * zr)
    T = (a, 0, cx - W / 2 * a, 0, a, cy - H / 2 * a)
    return np.asarray(RET.transform((W, H), Image.AFFINE, T, resample=Image.BICUBIC, fillcolor=(0, 0, 0))).astype(np.float32) / 255


def cuadro(fr):
    t = fr / FPS
    z = Z(t)
    img = np.zeros((H, W, 3), np.float32)
    pupila = RC * z                                               # radius of the pupil on screen
    rmax = np.hypot(W, H) / 2 + 300
    px, py = centro(t)
    r = np.hypot(XX - px, YY - py)
    if pupila < rmax + 200:
        w = ease((t - 0.8) / 6.0)
        F = copia(t, z, w)
        # the iris front: from beyond the corners to the pupil's edge, between 3 and 9.5 s
        u = ease((t - 3.0) / 9.5)                                   # the front keeps going, through the pupil's dark: no jump
        frente = rmax + (0.0 - rmax) * u
        m = np.clip((r - frente) / 260 + 0.5, 0, 1)[..., None] * ease((t - 2.6) / 1.0)
        if t >= 12.6: m = np.ones_like(m)
        I = iris(t, z) if u > 0 or t >= 12.6 else 0
        img = F * (1 - m) + I * m
    # far inside the pupil, a light: the retina
    T0 = 13.8
    if t >= T0:
        zr = ZR(t) / ZR(T0)
        R = retina(t, zr)
        luz = ease((t - T0) / 1.2)
        dentro = np.clip((pupila - r) / 40, 0, 1)[..., None]             # only inside the pupil, until it fills the frame
        img = img * (1 - dentro) + R * luz * dentro if pupila < rmax + 200 else R
        if t < T0 + 4.0:                                              # its glow, like light at the end of a tunnel
            g = np.exp(-np.hypot(XX - W / 2, YY - H / 2) / (60 + 7.0 * zr * 2.5))[..., None] * np.array([1.0, 0.55, 0.3]) * 0.35 * (1 - ease((t - T0 - 1.5) / 2.5))
            img = img + g * luz
    # the vessels are lost in the dark
    if t > 22.3:                                                     # v3: the retina lasts ~8 s, then the dark
        k = ease((t - 22.3) / 3.9)
        rr = np.hypot(XX - W / 2, YY - H / 2) / (np.hypot(W, H) / 2)
        vel = np.clip(1 - k * (0.4 + 1.2 * rr), 0, 1)[..., None]
        pim = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(float(1 + 14 * k)))
        img = np.asarray(pim).astype(np.float32) / 255 * vel * (1 - k)
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(OUT / f"{fr:04d}.jpg", quality=92)
    return fr


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    print(f"copia: centro ({CX:.0f}, {CY:.0f}), radio {RC:.0f} px · iris: pupila ({IPX:.0f}, {IPY:.0f}), radio {IPR:.0f} px")
    sel = [int(a) for a in sys.argv[1:]] or range(int(DUR * FPS))
    with ProcessPoolExecutor() as ex:
        for _ in ex.map(cuadro, sel, chunksize=2): pass
    print("ok", len(sel))
