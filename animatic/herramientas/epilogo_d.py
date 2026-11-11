"""Epilogue, acts D «Una parte del universo» and E «Lo que significa estar aquí»: real footage, one plane at a time,
each cut on the start of the sentence that names it. Times are seconds of the epilogue (0 = the copy at ×10⁵⁶).
Frames → public/p10/vid/epiD/NNNN.jpg, frame 0 = 175.0 s. The last point of light and the title are drawn by
src/cap10.ts. Sources and licences: fractales/material-prologo/epilogo/ (Pexels licence; NASA, public domain) and the
archive already in the film (ESO CC BY 4.0, NASA/ESA, GOES-16, ISS).

usage: PYTHONPATH=pylib python3 herramientas/epilogo_d.py [frames]
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from concurrent.futures import ProcessPoolExecutor

RAIZ = Path(__file__).resolve().parent.parent
P = RAIZ / "public"
MAT = RAIZ.parent / "material-prologo/epilogo"
TMP = RAIZ / "tmp/epiD"
OUT = P / "p10/vid/epiD"
W, H, FPS = 1920, 1080, 30
T0, T1 = 175.0, 331.0
Image.MAX_IMAGE_PIXELS = None
ROJO = (1.0, 0.51, 0.43)


def ease(x): x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)


# plane: (start, end, source, source start (s), speed, zoom start, zoom end, centre, crop (fraction kept, for logos))
PLANOS = [
    # D · una parte del universo
    (175.0, 181.2, "vid:" + str(RAIZ / "public/p8/real/eso_paranal_atardecer_timelapse.webm"), 30.0, 1, 1.0, 1.06, (0.5, 0.5), 1),  # the sky, a set of lights
    (181.0, 189.6, "img:p8/real/jwst_primer_campo_profundo.jpg", 0, 1, 1.0, 1.25, (0.5, 0.5), 1),                       # galaxies of long ago
    (189.4, 192.9, "vid:" + str(MAT / "pexels-6346221-investigadora.mp4"), 1.0, 1, 1.02, 1.08, (0.5, 0.45), 1),            # the rhythm of a cell
    (192.7, 195.4, "particulas", 0, 1, 1, 1, (0.5, 0.5), 1),                                                                  # the path of a particle
    (195.2, 200.6, "vid:" + str(MAT / "pexels-7744220-compas.mp4"), 4.0, 1, 1.0, 1.05, (0.5, 0.5), 1),                    # the shape of a border
    (200.4, 206.8, "img:" + "../../material-prologo/epilogo/nasa-jpl-pia23645-pale-blue-dot.jpg", 0, 1, 1.05, 1.7, (0.593, 0.517), 1),  # a small planet
    (206.6, 215.0, "vid:" + str(MAT / "pexels-9121395-telescopio.mp4"), 2.0, 1, 1.0, 1.04, (0.5, 0.5), 1),               # matter that asks
    (214.8, 224.8, "img:" + "../../material-prologo/epilogo/esa-hubble-heic0515a-cangrejo.jpg", 0, 1, 1.0, 1.3, (0.5, 0.5), 1),  # forged in stars
    (224.6, 228.6, "vid:" + str(MAT / "pexels-9783955-ojo.mp4"), 1.0, 1, 1.0, 1.06, (0.55, 0.45), 1),                    # our eyes
    (228.4, 233.8, "vid:" + str(MAT / "pexels-40476958-manos.mp4"), 1.0, 1, 1.02, 1.08, (0.5, 0.5), 1),                  # our hands, our heart
    (233.6, 240.8, "vid:" + str(MAT / "pexels-4504193-playa.mp4"), 6.0, 1, 1.18, 1.0, (0.5, 0.45), 1),                   # to contemplate the stars
    (240.6, 251.4, "vid:" + str(MAT / "pexels-19880790-via-lactea-costa.mp4"), 0.0, 0.47, 1.25, 1.0, (0.5, 0.6), 1),
    # E · lo que significa estar aquí
    (251.2, 258.6, "img:p8/real/planck_cmb_esa.jpg", 0, 1, 1.0, 1.15, (0.5, 0.5), 1),                                       # the oldest light: it existed long before
    (258.4, 268.3, "tierra", 0, 1, 1, 1, (0.5, 0.5), 1),                                                                      # the Earth turning, day into night
    (268.1, 272.4, "vid:" + str(RAIZ.parent / "material-prologo/pexels-39213473.mp4"), 2.0, 1, 1.0, 1.08, (0.5, 0.5), 1),  # a coast, and its geometry
    (272.2, 276.8, "pulso", 0, 1, 1, 1, (0.5, 0.5), 1),                                                                       # the rhythm of a heart, as light
    (276.6, 284.6, "vid:" + str(RAIZ.parent / "material-prologo/universo/galaxia-espiral-m74-zoom.mp4"), 20.0, 1, 1.0, 1.06, (0.5, 0.5), 1),  # galaxies
    (284.4, 290.8, "img:p8/real/hubble_ultra_deep_field_2014.jpg", 0, 1, 1.0, 1.4, (0.5, 0.5), 1),                         # what lies beyond
    # E · la naturaleza: el detalle en lo sencillo
    (290.6, 297.5, "vid:" + str(MAT / "pexels-31981787-diente-de-leon.mp4"), 3.0, 1, 1.0, 1.08, (0.5, 0.5), 1),
    (297.3, 301.6, "vid:" + str(MAT / "pexels-34844391-girasol.mp4"), 2.0, 1, 1.05, 1.2, (0.62, 0.5), 1),
    (301.4, 305.9, "vid:" + str(MAT / "pexels-35253814-arbol.mp4"), 4.0, 1, 1.0, 1.06, (0.5, 0.5), 1),
    (305.7, 310.8, "vid:" + str(MAT / "pexels-11025478-rayos.mp4"), 3.6, 1, 1.0, 1.04, (0.5, 0.5), 1),
    (310.6, 314.0, "vid:" + str(MAT / "pexels-35309659-escarcha.mp4"), 2.0, 1, 1.0, 1.06, (0.5, 0.5), 1),
    (313.8, 315.6, "vid:" + str(MAT / "pexels-4508052-helecho.mp4"), 6.0, 1, 1.0, 1.04, (0.5, 0.5), 1),
    (315.4, 317.9, "vid:" + str(MAT / "pexels-35403227-hoja.mp4"), 4.0, 1, 1.0, 1.05, (0.5, 0.5), 1),
    (317.7, 331.0, "vid:" + str(MAT / "pexels-856019-flor.mp4"), 2.0, 0.8, 1.0, 1.12, (0.55, 0.5), 1),                    # a flower opens; it becomes the title
]
LENTOS = {0, 11, 12, 13, 25}          # planes that come in with a long dissolve


def carpeta(k):
    """cache folder of a plane, named after its source and its span (a change of either extracts it again)"""
    import hashlib
    a, b, src, ss, vel = PLANOS[k][:5]
    return TMP / f"{k:02d}-{hashlib.md5(f'{src}|{ss}|{vel}|{b - a}'.encode()).hexdigest()[:8]}"


def extrae(k):
    """the frames a video plane needs, at 30 fps, cached in tmp/epiD/k/"""
    a, b, src, ss, vel = PLANOS[k][:5]
    d = carpeta(k)
    n = int(np.ceil((b - a) * FPS)) + 2
    if d.exists() and len(list(d.glob("*.jpg"))) >= n: return
    d.mkdir(parents=True, exist_ok=True)
    dur = (b - a) * vel + 0.5
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(ss), "-t", str(dur), "-i", src[4:],
                    "-vf", f"setpts=PTS/{vel},fps=30,scale=2304:1296:force_original_aspect_ratio=increase,crop=2304:1296",
                    "-q:v", "2", str(d / "%05d.jpg")], check=True)


def cubre(im, z, c):
    s = max(W / im.width, H / im.height) * z; a = 1 / s
    x0 = c[0] * im.width - W / 2 * a; y0 = c[1] * im.height - H / 2 * a
    return np.asarray(im.convert("RGB").transform((W, H), Image.AFFINE, (a, 0, x0, 0, a, y0), resample=Image.BICUBIC)).astype(np.float32) / 255


_img = {}
def imagen(ruta):
    if ruta not in _img: _img[ruta] = Image.open(P / ruta).convert("RGB")
    return _img[ruta]


RR = np.array(json.loads((RAIZ / "src/cap5_datos.json").read_text())["todo"][52000:54000])
def corazon(t, a0):
    off = int((t - a0) * 40); n = 420; v = RR[off:off + n]
    v = 0.78 + (v - RR.mean()) / (RR.std() + 1e-9) * 0.045
    capa = Image.new("L", (W, H), 0); d = ImageDraw.Draw(capa)
    pts = list(zip(np.linspace(W * 0.06, W * 0.94, n), H * 0.5 + (0.78 - v) * H * 1.3))
    d.line(pts, fill=255, width=2, joint="curve")
    b = np.asarray(capa).astype(np.float32) / 255
    h1 = np.asarray(capa.filter(ImageFilter.GaussianBlur(4))).astype(np.float32) / 255
    h2 = np.asarray(capa.filter(ImageFilter.GaussianBlur(16))).astype(np.float32) / 255
    yy, xx = np.mgrid[0:H, 0:W]
    g = np.exp(-np.hypot(xx - pts[-1][0], yy - pts[-1][1]) / 24) * 0.9
    return (np.clip(b * 0.9 + h1 * 1.1 + h2 * 1.4, 0, 1.6) + g)[..., None] * np.array(ROJO, np.float32)


def particulas(t, a0):
    """the paths of particles in a magnetic field, as in a bubble chamber: each spirals in as it loses energy"""
    u = ease((t - a0) / 2.2)
    capa = Image.new("L", (W, H), 0); d = ImageDraw.Draw(capa)
    rng = np.random.default_rng(7)
    v0 = (W * 0.42, H * 0.55)
    for k in range(9):
        q = 1 if k % 2 else -1; ang = rng.uniform(0, 2 * np.pi); r0 = rng.uniform(140, 520); perd = rng.uniform(0.25, 0.6)
        pts = [v0]; x, y = v0; th = ang; r = r0
        n = int(260 * u)
        for i in range(n):
            ds = 6.0; th += q * ds / r; r *= (1 - perd * ds / 900)
            x += ds * np.cos(th); y += ds * np.sin(th); pts.append((x, y))
            if r < 6: break
        if len(pts) > 1: d.line(pts, fill=int(200 + 55 * (k % 3) / 2), width=2)
    for i in range(int(400 * u)):                                     # bubbles along nothing: the chamber's own speckle
        d.point((rng.uniform(0, W), rng.uniform(0, H)), fill=90)
    b = np.asarray(capa).astype(np.float32) / 255
    h1 = np.asarray(capa.filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
    h2 = np.asarray(capa.filter(ImageFilter.GaussianBlur(12))).astype(np.float32) / 255
    fondo = np.array([0.02, 0.04, 0.08], np.float32)
    return fondo + (b * 0.8 + h1 * 1.0 + h2 * 1.2)[..., None] * np.array([0.6, 0.85, 1.0], np.float32)


def pulso(t, a0):
    """a heart, as light: one ring for each real beat (the healthy record of the prologue), widening and fading"""
    on = np.cumsum(RR[:40]) - RR[0]
    s = t - a0
    yy, xx = np.mgrid[0:H, 0:W]; r = np.hypot(xx - W / 2, yy - H / 2)
    out = np.zeros((H, W), np.float32)
    for b in on:
        e = s - b
        if e < 0 or e > 3.0: continue
        rad = 40 + 520 * (1 - np.exp(-e * 1.4)); ancho = 6 + 30 * e
        out += np.exp(-((r - rad) / ancho) ** 2) * np.exp(-e * 1.1) * 0.9
        out += np.exp(-r / (30 + 40 * e)) * np.exp(-e * 4) * 1.2
    return np.clip(out, 0, 1.6)[..., None] * np.array(ROJO, np.float32)


_TEX = {}
def textura(clave, ruta, w=8192):
    if clave not in _TEX:
        im = Image.open(ruta).convert("RGB"); im = im.resize((w, w // 2), Image.LANCZOS)
        _TEX[clave] = np.asarray(im).astype(np.float32) / 255
    return _TEX[clave]


def tierra3d(t, a0):
    """the Earth turning under a fixed Sun: by day (Blue Marble), and the lights of its cities coming on as they pass
    into the night (Black Marble 2016); orthographic view, a thin atmosphere"""
    dia = textura("dia", RAIZ.parent / "material-prologo/cap3/blue-marble-24000.jpg")
    noche = textura("noche", MAT / "nasa-black-marble-2016-mapa.jpg")
    R = H * 0.42
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    nx = (xx - W / 2) / R; ny = -(yy - H / 2) / R; r2 = nx * nx + ny * ny
    dentro = r2 < 1
    nz = np.sqrt(np.clip(1 - r2, 0, 1))
    inc = np.radians(18.0)                                           # tilt toward the viewer, a little of the south
    y2 = ny * np.cos(inc) - nz * np.sin(inc); z2 = ny * np.sin(inc) + nz * np.cos(inc)
    lat = np.arcsin(np.clip(y2, -1, 1)); lon = np.arctan2(nx, z2) + np.radians(-20 - 6.0 * (t - a0))      # the surface turns east, into the night
    u = ((lon / (2 * np.pi) + 0.5) % 1) * (dia.shape[1] - 1); v = (0.5 - lat / np.pi) * (dia.shape[0] - 1)
    ui = u.astype(np.int32); vi = np.clip(v.astype(np.int32), 0, dia.shape[0] - 1)
    D = dia[vi, ui]; Nn = noche[vi, ui]
    D = np.clip((D - 0.04) * 1.05, 0, 1) * np.array([0.92, 0.95, 0.85])      # a less saturated ocean
    sol = np.array([-0.93, 0.12, 0.35]); sol = sol / np.linalg.norm(sol)
    luzd = nx * sol[0] + ny * sol[1] + nz * sol[2]
    k = np.clip((luzd + 0.08) / 0.22, 0, 1); k = k * k * (3 - 2 * k)
    color = D * (0.25 + 0.95 * k[..., None]) * k[..., None] + Nn * (1.6 * (1 - k))[..., None] ** 1.0 * np.array([1.0, 0.86, 0.6])
    borde = np.clip((1 - np.sqrt(r2)) / 0.006, 0, 1)
    img = np.where(dentro[..., None], color * borde[..., None], 0)
    atm = np.exp(-np.clip(np.sqrt(r2) - 1, 0, None) / 0.025) * (np.sqrt(r2) > 0.97) * np.clip(luzd + 0.3, 0, 1)
    return np.clip(img + atm[..., None] * np.array([0.25, 0.45, 0.9]) * 0.6, 0, 1).astype(np.float32)


DISCO = (0.552, 0.5, 0.443, 0.5)
def tierra(t, z):
    """GOES-16, made round again (its source is squeezed), on black"""
    im = imagen("p5/4-tierra.jpg")
    sx = 0.5 / 0.443
    w = 2.3 / z
    a = w * im.width / W
    x0 = DISCO[0] * im.width - (W / 2) * a / sx; y0 = DISCO[1] * im.height - (H / 2) * a
    out = np.asarray(im.transform((W, H), Image.AFFINE, (a / sx, 0, x0, 0, a, y0), resample=Image.BICUBIC)).astype(np.float32) / 255
    yy, xx = np.mgrid[0:H, 0:W]
    r = np.hypot((xx - W / 2) * a / sx / im.width / DISCO[2], (yy - H / 2) * a / im.height / DISCO[3])
    return out * np.clip((1 - r) / 0.01, 0, 1)[..., None]


def plano(k, t):
    a, b, src, ss, vel, z0, z1, c, _ = PLANOS[k]
    u = (t - a) / (b - a); z = z0 + (z1 - z0) * ease(u) if z0 > z1 else z0 * (z1 / z0) ** u
    if src.startswith("img:"):
        x = cubre(imagen(src[4:]), z, c)
        if "planck" in src:                                            # the map's white page → the dark of the film
            lum = x.mean(axis=2, keepdims=True); sat = x.max(axis=2, keepdims=True) - x.min(axis=2, keepdims=True)
            x = x * np.clip(1 - np.clip((lum - 0.85) / 0.1, 0, 1) * np.clip((0.12 - sat) / 0.08, 0, 1), 0, 1)
            x = x * 0.55                                               # v3: a steady, low brightness (it glowed too much)
        return x
    if src == "corazon": return corazon(t, a)
    if src == "particulas": return particulas(t, a)
    if src == "pulso": return pulso(t, a)
    if src == "tierra": return tierra3d(t, a)
    d = carpeta(k)
    i = min(int((t - a) * FPS) + 1, len(list(d.glob("*.jpg"))))
    return cubre(Image.open(d / f"{i:05d}.jpg"), z, c)


def cuadro(fr):
    t = T0 + fr / FPS
    img = np.zeros((H, W, 3), np.float32)
    vivos = [k for k, p in enumerate(PLANOS) if p[0] <= t < p[1]]
    for j, k in enumerate(vivos):
        a, b = PLANOS[k][:2]
        dentro = 1.0 if k in LENTOS else 0.3                          # cuts are short; a few planes dissolve slowly
        m = ease((t - a) / dentro) if k > 0 else 1.0
        sale = 1 - ease((t - (b - 0.3)) / 0.3) if k == len(PLANOS) - 1 else 1.0
        x = plano(k, t)
        img = img * (1 - m) + x * m * sale if j > 0 else x * (m if k else 1.0) * sale
    if t < 176.4:                                                      # the border of the set dissolves into the galaxy
        try:
            C = np.asarray(Image.open(sorted((P / "p10/vid/epiC").glob("*.jpg"))[-1])).astype(np.float32) / 255
            u = ease((t - 175.0) / 1.4)
            lum = img.mean(axis=2, keepdims=True)
            mask = np.clip(u * 1.6 - (1 - lum) * 0.6, 0, 1)            # the bright parts of the galaxy arrive first
            img = C * (1 - mask) + img * mask
        except IndexError:
            pass
    if t > 329.0: img = img * (1 - 0.6 * ease((t - 329.0) / 2.0))     # the flower dims under the fractal that becomes the title
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(OUT / f"{fr:04d}.jpg", quality=92)
    return fr


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for k, p in enumerate(PLANOS):
        if p[2].startswith("vid:"): extrae(k)
    sel = [int(a) for a in sys.argv[1:]] or range(int((T1 - T0) * FPS))
    with ProcessPoolExecutor() as ex:
        for _ in ex.map(cuadro, sel, chunksize=2): pass
    print("ok", len(sel))
