"""Epilogue, act B «Todo lo que hemos aprendido a mirar»: the film comes back, each image with its own motion,
one plane per sentence of the voice (cuts on the start of the sentence that names what is seen):

  36.0 a delta seen from above (real) → its channels become a river network that digs itself (our erosion, ch. IV)
  45.4 the Koch snowflake builds itself: infinite length, finite area (ch. I)
  51.8 the Spain–Portugal border walked with rulers of 80, 20 and 5 km (ch. III)
  57.2 the gaps between tree crowns (real) become the Sierpiński triangle, rule after rule (ch. I, VII)
  61.8 the Lorenz attractor draws itself and is left as a cloud of points (ch. VI)
  66.0 a Sierpiński antenna that a wave crosses; the vessels of a retina; the rhythm of a heart (ch. VII, IV, V)
  74.6 a galaxy (Hubble), and the cosmic web pulling back until it looks even (ch. VIII)

Times are seconds of the epilogue (0 = the copy at ×10⁵⁶). Frames → public/p10/vid/epiB/NNNN.jpg, frame 0 = 36.0 s.
usage: PYTHONPATH=pylib python3 herramientas/epilogo_b.py [frames]
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from concurrent.futures import ProcessPoolExecutor

RAIZ = Path(__file__).resolve().parent.parent
P = RAIZ / "public"
OUT = P / "p10/vid/epiB"
W, H, FPS = 1920, 1080, 30
T0, T1 = 36.0, 86.0
Image.MAX_IMAGE_PIXELS = None
CREMA, AMBAR, AZUL, ROJO, CIAN = (1.0, 0.957, 0.87), (1.0, 0.745, 0.47), (0.59, 0.745, 1.0), (1.0, 0.51, 0.43), (0.59, 0.87, 0.89)


def ease(x): x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)
def ventana(t, a, b, d=0.5): return min(ease((t - a) / d), 1 - ease((t - (b - d)) / d))
def arr(im): return np.asarray(im.convert("RGB")).astype(np.float32) / 255


_cache = {}
def img(ruta):
    if ruta not in _cache: _cache[ruta] = Image.open(P / ruta).convert("RGB")
    return _cache[ruta]


def cubre(im, z=1.0, c=(0.5, 0.5)):
    """the image covering the frame, pushed by z about the fraction c"""
    s = max(W / im.width, H / im.height) * z
    a = 1 / s
    x0 = c[0] * im.width - W / 2 * a; y0 = c[1] * im.height - H / 2 * a
    return arr(im.transform((W, H), Image.AFFINE, (a, 0, x0, 0, a, y0), resample=Image.BICUBIC))


def luz(lineas, ancho=2.0, col=CREMA, brillo=1.0):
    """glowing lines: [(points, alpha)] in pixels → float image (a core and two halos, added)"""
    capa = Image.new("L", (W, H), 0); d = ImageDraw.Draw(capa)
    for pts, a in lineas:
        if len(pts) > 1 and a > 0.01: d.line([tuple(p) for p in pts], fill=int(255 * min(1, a)), width=max(1, int(round(ancho))), joint="curve")
    base = np.asarray(capa).astype(np.float32) / 255
    h1 = np.asarray(capa.filter(ImageFilter.GaussianBlur(4))).astype(np.float32) / 255
    h2 = np.asarray(capa.filter(ImageFilter.GaussianBlur(16))).astype(np.float32) / 255
    v = np.clip(base * 0.9 + h1 * 1.1 + h2 * 1.4, 0, 1.6) * brillo
    return v[..., None] * np.array(col, np.float32)


# ── the shots ────────────────────────────────────────────────────────────────────────────────────────────────────
def delta(t):
    k = int(np.clip((t - 36.0) * 30, 0, 164))
    return cubre(img(f"p2/delta/{k + 1:04d}.jpg"), 1.0 + 0.012 * (t - 36.0)) * 0.95


EROS = sorted((P / "p4/erosion").glob("*.png"))
def erosion(t):
    u = np.clip((t - 41.0) / 4.4, 0, 1) * (len(EROS) - 1)
    i = int(u); f = u - i
    def a(k):
        A = np.asarray(Image.open(EROS[min(k, len(EROS) - 1)]).resize((W, H), Image.BICUBIC)).astype(np.float32)[..., 3] / 255
        return A
    A = a(i) * (1 - f) + a(i + 1) * f
    v = np.clip(A, 0, 1) ** 0.6
    halo = np.asarray(Image.fromarray((v * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
    out = v[..., None] * np.array(CIAN) * 0.9 + halo[..., None] * np.array(AZUL) * 0.8
    return out + np.array([0.01, 0.015, 0.03], np.float32)


def koch_pts(n):
    pts = [np.array([np.cos(a), np.sin(a)]) for a in np.pi / 2 + np.arange(4) * 2 * np.pi / 3]
    seg = [pts[0], pts[1], pts[2], pts[0]]
    for _ in range(n):
        nv = []
        for p, q in zip(seg[:-1], seg[1:]):
            d = (q - p) / 3; a = p + d; b = p + 2 * d
            c = a + np.array([d[0] * 0.5 + d[1] * 0.866, -d[0] * 0.866 + d[1] * 0.5])
            nv += [p, a, c, b]
        nv.append(seg[-1]); seg = nv
    return np.array(seg)
KOCH = [koch_pts(n) for n in range(7)]
def koch(t):
    u = np.clip((t - 45.6) / 0.85, 0, 6.0)
    n = int(u); f = ease(u - n)
    P0 = KOCH[n]
    if n < 6:
        P1 = KOCH[n + 1]
        # the new level grows out of the old one: each new point starts on its old segment
        Q = P1.copy()
        for i in range(len(P1)):
            j = i // 4; r = i % 4
            p, q = P0[min(j, len(P0) - 1)], P0[min(j + 1, len(P0) - 1)]
            base = p + (q - p) * (r / 4 if r < 3 else 2 / 3) if r != 2 else p + (q - p) * 0.5
            Q[i] = base + (P1[i] - base) * f
        P0 = Q
    s = H * 0.40
    pts = np.c_[W / 2 + P0[:, 0] * s, H * 0.53 - P0[:, 1] * s]
    return luz([(pts, 1.0)], 2.0, AMBAR, ventana(t, 45.4, 51.8, 0.3))


EP = json.loads((RAIZ / "src/cap3_datos.json").read_text())["espana_portugal"]
_todos = np.array([p for pz in EP["piezas"] for p in pz])
_x0, _y0 = _todos.min(0); _x1, _y1 = _todos.max(0)
_s = min(W * 0.5 / (_x1 - _x0), H * 0.9 / (_y1 - _y0))
def _m(p): return [W / 2 + (q[0] - (_x0 + _x1) / 2) * _s for q in p], [H / 2 + (q[1] - (_y0 + _y1) / 2) * _s for q in p]
def frontera(t):
    L = []
    for pz in EP["piezas"]:
        xs, ys = _m(pz); L.append((list(zip(xs, ys)), 0.45))
    out = luz(L, 1.6, CREMA, 1.0)
    for k, (reg, col, t0) in enumerate([("80", AZUL, 52.4), ("20", CREMA, 53.9), ("5", AMBAR, 55.3)]):
        a = ease((t - t0) / 0.8)
        if a <= 0: continue
        Lc = []
        for c in EP["medidas"][reg]["caminatas"]:
            xs, ys = _m(c); n = max(2, int(len(xs) * a)); Lc.append((list(zip(xs[:n], ys[:n])), 1.0))
        out = out + luz(Lc, 2.6, col, 1.0)
    return out * ventana(t, 51.8, 57.4, 0.3)


def sierp(n, x, y, s, lst):
    if n == 0: lst.append([(x, y - s * 0.577), (x - s / 2, y + s * 0.289), (x + s / 2, y + s * 0.289)]); return
    for dx, dy in [(0, -s * 0.289), (-s / 4, s * 0.144), (s / 4, s * 0.144)]:
        sierp(n - 1, x + dx, y + dy, s / 2, lst)
def sierpinski(t, t0, x, y, s, col=CREMA, nmax=7, vel=0.45, relleno=0.18):
    """the triangle, rule after rule: glowing outlines (and a faint fill); level n dissolves into n + 1"""
    u = np.clip((t - t0) / vel, 0, nmax)
    n = int(u); f = ease(u - n) if n < nmax else 0.0
    capas = []
    for k, a in [(n, 1.0 - f), (min(n + 1, nmax), f)]:
        if a <= 0.01: continue
        capa = Image.new("L", (W, H), 0); d = ImageDraw.Draw(capa); tr = []; sierp(k, x, y, s, tr)
        for tri in tr:
            d.polygon(tri, fill=int(255 * relleno))
            d.line(list(tri) + [tri[0]], fill=255, width=2 if k < 5 else 1)
        capas.append(np.asarray(capa).astype(np.float32) / 255 * a)
    base = np.maximum.reduce(capas) if capas else np.zeros((H, W), np.float32)
    bi = Image.fromarray((np.clip(base, 0, 1) * 255).astype(np.uint8))
    h1 = np.asarray(bi.filter(ImageFilter.GaussianBlur(4))).astype(np.float32) / 255
    h2 = np.asarray(bi.filter(ImageFilter.GaussianBlur(14))).astype(np.float32) / 255
    return np.clip(base * 0.9 + h1 * 1.0 + h2 * 1.2, 0, 1.6)[..., None] * np.array(col, np.float32)


def arbol(t):
    a = cubre(img("p2/fotos/arboles.jpg"), 1.0 + 0.02 * (t - 57.2), (0.5, 0.5)) * 0.9
    m = ease((t - 58.8) / 0.9)
    S = sierpinski(t, 58.9, W / 2, H * 0.56, H * 0.86, CREMA, 7, 0.36)
    return a * (1 - 0.8 * m) + S * m


LZ = np.array(json.loads((RAIZ / "src/cap6_lorenz.json").read_text())["atractor"]).reshape(-1, 2)
def lorenz(t):
    u = ease((t - 61.9) / 3.0)
    n = max(2, int(len(LZ) * u))
    x = W / 2 + LZ[:n, 0] * H * 0.019; y = H * 0.96 - LZ[:n, 1] * H * 0.019
    out = luz([(list(zip(x, y)), 0.55)], 1.0, CREMA, 0.8)
    if t > 64.4:                                          # it is left as a cloud of points
        k = ease((t - 64.4) / 1.4)
        idx = np.arange(0, len(LZ), 9)
        capa = Image.new("L", (W, H), 0); d = ImageDraw.Draw(capa)
        for i in idx:
            px, py = W / 2 + LZ[i, 0] * H * 0.019, H * 0.96 - LZ[i, 1] * H * 0.019
            d.point((px, py), fill=255)
        pts = np.asarray(capa.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255 * 3
        out = out * (1 - 0.7 * k) + pts[..., None] * np.array(AMBAR) * k
    return out * ventana(t, 61.8, 66.2, 0.3)


def antena(t):
    S = sierpinski(66.0 + 3.0, 0, W / 2, H * 0.56, H * 0.7, AMBAR, 5, 1)
    # a wave crossing it: a bright band that travels and rings the triangles of each scale
    fase = (t - 66.0) / 2.6
    xx = np.arange(W)[None, :] / W
    onda = 0.5 + 0.5 * np.cos(2 * np.pi * (xx * 3.0 - fase * 3.0))
    frente = np.exp(-((xx - (fase * 1.3 - 0.15)) / 0.08) ** 2)
    ondas = (onda * 0.06 + frente * 0.25)[..., None] * np.array(AZUL, np.float32)
    return (S * (0.7 + 0.8 * frente[..., None]) + np.broadcast_to(ondas, (H, W, 3))) * ventana(t, 66.0, 69.9, 0.3)


VS = json.loads((RAIZ / "src/cap4_vasos.json").read_text())
VN = np.array(VS["nodos"]).reshape(-1, 2); VP = VS["padre"]; VNACE = np.array(VS["nace"]); VA = np.array(VS["ancho"])
def retina(t):
    """«comprender un tejido»: vessels that grow toward the cells that still need oxygen (our simulation, ch. IV)"""
    paso = ease((t - 69.6) / 1.8) * VS["pasos"]
    capa = Image.new("L", (W, H), 0); d = ImageDraw.Draw(capa)
    s = H * 0.44
    for i, pa in enumerate(VP):
        if pa < 0 or VNACE[i] > paso: continue
        a = min(1.0, paso - VNACE[i] + 0.3)
        w = max(1, int(1 + 3.2 * np.log1p(VA[i]) / np.log1p(VA.max())))
        x0, y0 = W / 2 + VN[pa, 0] * s, H / 2 + VN[pa, 1] * s
        x1, y1 = W / 2 + (VN[pa, 0] + (VN[i, 0] - VN[pa, 0]) * a) * s, H / 2 + (VN[pa, 1] + (VN[i, 1] - VN[pa, 1]) * a) * s
        d.line([(x0, y0), (x1, y1)], fill=255, width=w)
    b = np.asarray(capa).astype(np.float32) / 255
    h1 = np.asarray(capa.filter(ImageFilter.GaussianBlur(4))).astype(np.float32) / 255
    h2 = np.asarray(capa.filter(ImageFilter.GaussianBlur(14))).astype(np.float32) / 255
    out = b[..., None] * np.array(ROJO) * 0.95 + (h1 * 0.9 + h2 * 0.9)[..., None] * np.array([1.0, 0.35, 0.25])
    return out * ventana(t, 69.6, 71.6, 0.3)


RR = np.array(json.loads((RAIZ / "src/cap5_datos.json").read_text())["todo"][30000:32000])
def corazon(t):
    off = int((t - 71.4) * 40); n = 420
    v = RR[off:off + n]
    pts = list(zip(np.linspace(W * 0.06, W * 0.94, n), H * 0.5 + (0.78 - v) * H * 1.3))
    out = luz([(pts, 1.0)], 1.8, ROJO, 1.0)
    yy, xx = np.mgrid[0:H, 0:W]
    out = out + (np.exp(-np.hypot(xx - pts[-1][0], yy - pts[-1][1]) / 24) * 0.9)[..., None] * np.array(ROJO)
    return out * ventana(t, 71.4, 74.8, 0.3)


def galaxia(t):
    return cubre(img("p5/2-galaxia.jpg"), 1.15 + 0.05 * (t - 74.6)) * ventana(t, 74.4, 78.6, 0.5)


def red(t):
    k = int(np.clip(300 + (t - 77.8) * 95, 0, 1079))                   # the second half of the pull-back, faster
    return cubre(img(f"p8/vid/homogeneo/{k:04d}.jpg"), 1.0) * ease((t - 77.8) / 0.8)


PLANOS = [(36.0, 41.6, delta), (41.0, 45.6, erosion), (45.4, 51.8, koch), (51.8, 57.4, frontera), (57.2, 61.9, arbol),
          (61.8, 66.2, lorenz), (66.0, 69.9, antena), (69.6, 71.6, retina), (71.4, 74.8, corazon), (74.4, 78.6, galaxia), (77.8, 86.0, red)]


def cuadro(fr):
    t = T0 + fr / FPS
    img_ = np.zeros((H, W, 3), np.float32)
    for a, b, f in PLANOS:
        if a <= t < b:
            if f is delta: img_ = img_ + f(t) * ease((t - 36.0) / 1.2) * (1 - ease((t - 41.0) / 0.6))
            elif f is erosion: img_ = img_ + f(t) * ease((t - 41.0) / 0.6) * (1 - ease((t - 45.3) / 0.3))
            else: img_ = img_ + f(t)
    Image.fromarray((np.clip(img_, 0, 1) * 255).astype(np.uint8)).save(OUT / f"{fr:04d}.jpg", quality=92)
    return fr


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    sel = [int(a) for a in sys.argv[1:]] or range(int((T1 - T0) * FPS))
    with ProcessPoolExecutor() as ex:
        for _ in ex.map(cuadro, sel, chunksize=2): pass
    print("ok", len(sel))
