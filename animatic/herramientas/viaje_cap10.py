"""Chapter X, the first part of the shot with no cut, as one camera that never pans away from its target (Powers of
Ten): from outside the cosmic web (our own particles, as in chapters VII and VIII) into its brightest node; the node's
glow is a galaxy (M51, ESA/Hubble), centred on its core; into the core until one point of light is left, and that
point is the Earth (GOES-16); the Earth, whole; down through the clouds over southern Chile to the fjords of the
Moraleda Channel (ISS062, NASA); into the water, a glint of sun, and the glint is a drop. 45 s, 30 fps →
public/p10/vid/viaje/NNNN.jpg. The scale labels are drawn by the chapter (src/cap10.ts).

v2 (4 nov): every stage zooms on a fixed anchor at the centre of the frame; one zoom rate R(t) is shared by every
stage, so two images that overlap move as one; the web keeps flying while it fades (it used to vanish at 9 s); the
Earth keeps its round shape (its source is squeezed horizontally) and has a round, feathered border.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from concurrent.futures import ProcessPoolExecutor

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "herramientas"))
Image.MAX_IMAGE_PIXELS = None
W, H, FPS, DUR = 1920, 1080, 30, 45.0
OUT = RAIZ / "public/p10/vid/viaje"
P = RAIZ / "public"
_cache = {}


def ease(x): x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)


def imagen(ruta, forma="rect"):
    clave = (ruta, forma)
    if clave not in _cache:
        im = Image.open(P / ruta).convert("RGB")
        if im.width > 9000: im = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
        if forma == "rect":            # a feathered border, so no image ever shows its edge
            m = np.ones((im.height, im.width), np.float32)
            b = int(0.12 * min(im.width, im.height))
            r = np.clip(np.arange(im.width) / b, 0, 1); r = np.minimum(r, r[::-1]); r = r * r * (3 - 2 * r)
            c = np.clip(np.arange(im.height) / b, 0, 1); c = np.minimum(c, c[::-1]); c = c * c * (3 - 2 * c)
            m = np.outer(c, r)
        else:                          # the Earth: its own disk, with a thin soft limb
            cx, cy, rx, ry = forma
            yy, xx = np.mgrid[0:im.height, 0:im.width]
            d = np.hypot((xx / im.width - cx) / rx, (yy / im.height - cy) / ry)
            m = np.clip((1.0 - d) / 0.012, 0, 1)
        _cache[clave] = (im, Image.fromarray((m * 255).astype(np.uint8)))
    return _cache[clave]


# ── the old interface, still used by herramientas/giro_cap10.py ──
ETAPAS = []


def vista(k, t):
    ruta, t0, t1, w0, w1, c0, c1 = ETAPAS[k]
    u = min(max((t - t0) / (t1 - t0), 0), 1)
    w = np.exp(np.log(w0) + (np.log(w1) - np.log(w0)) * u)
    s = ease(u)
    return ver(ruta, w, (c0[0] + (c1[0] - c0[0]) * s, c0[1] + (c1[1] - c0[1]) * s))


def ver(ruta, w, c, sx=1.0, forma="rect"):
    """the frame of an image whose view is w image-widths wide, centred on c (fractions); sx stretches it in x"""
    im, borde = imagen(ruta, forma)
    vw = w * im.width; a = vw / W
    x0, y0 = c[0] * im.width - (W / 2) * a / sx, c[1] * im.height - (H / 2) * a
    T = (a / sx, 0, x0, 0, a, y0)
    out = im.transform((W, H), Image.AFFINE, T, resample=Image.BICUBIC, fillcolor=(0, 0, 0))
    m = borde.transform((W, H), Image.AFFINE, T, resample=Image.BILINEAR, fillcolor=0)
    return np.asarray(out).astype(np.float32) / 255 * (np.asarray(m).astype(np.float32) / 255)[..., None]


# ── the one camera: a zoom rate (e-folds per second), keyed; every stage's width is w_ref·e^−(Z(t)−Z(t_ref)) ──
RATE = [(8.0, 0.72), (9.4, 0.55), (10.6, 0.10), (13.0, 0.10), (14.6, 0.95), (16.0, 1.25), (16.3, 1.25), (18.2, 1.05),
        (18.9, 0.04), (21.0, 0.04), (22.0, 0.85), (25.2, 0.85), (26.6, 0.09), (38.4, 0.09), (39.8, 0.35), (40.7, 0.60),
        (45.5, 0.62)]
_TT = np.arange(0, DUR + 1, 1 / 600)
_R = np.interp(_TT, [k for k, _ in RATE], [v for _, v in RATE])
_Z = np.concatenate([[0], np.cumsum((_R[1:] + _R[:-1]) / 2 * np.diff(_TT))])
def Z(t): return float(np.interp(t, _TT, _Z))
def ancho(w_ref, t_ref, t): return w_ref * np.exp(-(Z(t) - Z(t_ref)))


GAL = "p10/real/galaxia_m51_heic0506a_large.jpg"
TIERRA = "p5/4-tierra.jpg"
FIORDOS = "p10/real/chile_fiordos_moraleda_iss062_lrg.jpg"
GOTA = "p10/real/gota_rocio_hoja_cc0.jpg"
NUCLEO = (0.387, 0.475)                          # the core of M51
DISCO = (0.552, 0.5, 0.443, 0.5)                 # the Earth's disk in its image (an ellipse: the source is squeezed)
SX_T = 0.5 / 0.443 * 4096 / 4096                 # x stretch that makes it round
AYSEN = (0.612, 0.835)                           # southern Chile, under the clouds
CANAL = (0.43, 0.50)                             # a channel among the islands
PERLA = (0.467, 0.443)                           # the largest drop


def red(t):
    """our cosmic web, flying into its brightest node (0 – 8.6 s)"""
    import cosmos_cap8 as C
    F = C.F
    nodo = F.nodos[np.argmax(F.masa * (np.linalg.norm(F.nodos, axis=1) < 0.7))]
    u = min(t / 8.6, 1)
    dist = np.exp(np.log(11.0) + (np.log(0.05) - np.log(11.0)) * u ** 1.15)
    ang = 1.0 + 0.03 * min(t, 8.6)
    Q = F.WEB - nodo * ease(u * 1.6)
    img = F.splat(Q, F.BRI * 0.5, C.WEBCOL, dist, ang)
    img = C.copias(img, C.OF2, C.RO2, C.SUBA, 0.03, 2.6, dist, ang, 0.7 * (1 - ease((t - 3) / 4)))
    img = F.brillo(img, 0.9)
    return (1 - np.exp(-img * 1.9 / (1 + 1.2 * (1 - u)))).astype(np.float32)


_red_fin = {}
def red_volando(t):
    """after 8.6 s the web goes on flying at the camera's rate: its last frame, scaled about the centre"""
    if "im" not in _red_fin:
        _red_fin["im"] = Image.fromarray((np.clip(red(8.6), 0, 1) * 255).astype(np.uint8))
    s = np.exp(Z(t) - Z(8.6))
    a = 1 / s
    T = (a, 0, W / 2 - W / 2 * a, 0, a, H / 2 - H / 2 * a)
    return np.asarray(_red_fin["im"].transform((W, H), Image.AFFINE, T, resample=Image.BICUBIC, fillcolor=(0, 0, 0))).astype(np.float32) / 255


def destello(t, tc, ancho_t, fuerza=1.4, col=(1.0, 0.95, 0.85)):
    """a point of light at the centre that swells and fades (gaussian in time)"""
    k = np.exp(-((t - tc) / ancho_t) ** 2)
    if k < 1e-3: return 0
    rr = np.hypot(np.arange(W)[None, :] - W / 2, np.arange(H)[:, None] - H / 2)
    return (np.exp(-rr / (18 + 26 * k)) * fuerza + np.exp(-rr / 220) * 0.35)[..., None] * k * np.array(col, np.float32)


def cuadro(fr):
    t = fr / FPS
    img = np.zeros((H, W, 3), np.float32)
    # 0 · the web, and its flight on while it fades into the galaxy
    if t < 8.6: img = red(t)
    elif t < 11.2: img = red_volando(t) * (1 - ease((t - 8.9) / 2.3))
    # 1 · the galaxy, centred on its core, grown out of the node's glow
    if 6.8 <= t < 16.6:
        a = ease((t - 6.8) / 2.6) * (1 - ease((t - 15.6) / 0.9))
        v = ver(GAL, ancho(2.3, 9.4, t), NUCLEO)
        v = np.clip((v - 0.13) / 0.87, 0, 1) ** 1.1                  # the Hubble frame's grey sky down to black
        img = np.maximum(img * (1 - 0.35 * a), v * a) if t < 11.2 else img * (1 - a) + v * a
    # 2 · one point of light is left, and that point is the Earth
    if 15.9 <= t < 26.8:
        a = ease((t - 15.9) / 0.9) * (1 - ease((t - 25.4) / 1.3))
        s = ease((t - 21.0) / 4.0)                                    # then the camera settles on southern Chile
        c = (DISCO[0] + (AYSEN[0] - DISCO[0]) * s, DISCO[1] + (AYSEN[1] - DISCO[1]) * s)
        img = img * (1 - a) + ver(TIERRA, ancho(30.0, 16.3, t), c, SX_T, DISCO) * a
    # 3 · through the clouds, to the fjords
    if 24.6 <= t < 41.4:
        a = ease((t - 25.2) / 1.4) * (1 - ease((t - 40.4) / 0.8))
        img = img * (1 - a) + ver(FIORDOS, ancho(0.62, 26.0, t), CANAL) * a
    # 4 · the drop, out of a glint on the water
    if t >= 40.3:
        a = ease((t - 40.5) / 0.9)
        img = img * (1 - a) + ver(GOTA, ancho(0.62, 41.0, t), PERLA) * a
    # the veils between worlds: the star, the cloud deck, the glint
    img = img + destello(t, 15.9, 0.75)
    v = float(np.exp(-((t - 25.6) / 0.75) ** 2))
    if v > 1e-3:
        pim = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10 + 30 * v))
        niebla = np.asarray(pim).astype(np.float32) / 255 * 0.5 + 0.5 * np.array([0.86, 0.89, 0.93], np.float32)
        img = img * (1 - 0.85 * v) + niebla * 0.85 * v
    img = img + destello(t, 40.6, 0.55, 1.2, (0.95, 0.98, 1.0))
    # entering the drop: everything goes soft and bright
    if t > 43.2:
        k = ease((t - 43.2) / 2.0)
        pim = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2 + 40 * k))
        img = np.asarray(pim).astype(np.float32) / 255 * (1 - 0.5 * k) + 0.25 * k * np.array([0.75, 0.85, 0.9])
    img = np.clip(img, 0, 1)
    Image.fromarray((img * 255).astype(np.uint8)).save(OUT / f"{fr:04d}.jpg", quality=92)
    return fr


if __name__ == "__main__":
    sel = [int(a) for a in sys.argv[1:]] or range(int(DUR * FPS))
    with ProcessPoolExecutor() as ex:
        for _ in ex.map(cuadro, sel, chunksize=2): pass
    print("ok", len(list(OUT.glob("*.jpg"))))
