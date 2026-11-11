"""Life fractals rendered in the visual language of the real image of each thing (the structure is still computed):
- venas: fundus photograph (retina, optic disc, macula; veins darker and wider, arteries lighter with a light reflex),
  vessel trees split by Murray's law
- neuronas: fluorescence microscopy (green and magenta channels, dendritic spines, out-of-focus layers)
- relampago: night storm (clouds lit by the stroke, hills in silhouette), dielectric breakdown model
- rio: satellite view (terrain, dark water, vegetation along the banks)
- pulmon: 3D reconstruction look (shaded tubes)

Usage: PYTHONPATH=pylib python3 herramientas/realistas.py [name ...]  ->  public/planos/<name>.jpg and <name>-g.png
"""
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).parent))
from planos import OUT, dilatar, rot  # noqa: E402

W, H = 2560, 1440
SS = 2
rng = np.random.default_rng(31)


def ruido(escala, semilla, octavas=5):
    """Fractal noise (fBm) at final size, values ~0..1."""
    r = np.random.default_rng(semilla)
    total = np.zeros((H, W)); amp = 1.0; suma = 0
    for o in range(octavas):
        n = max(2, int(escala * 2 ** o))
        base = r.random((n, int(n * W / H) + 1))
        im = Image.fromarray(base.astype(np.float32), mode="F").resize((W, H), Image.BICUBIC)
        total += np.asarray(im, float) * amp
        suma += amp; amp *= 0.5
    return total / suma


def desenfoque(a, sigma):
    """Gaussian blur in full precision (FFT), so smooth fields have no 8-bit terraces."""
    fy = np.fft.fftfreq(a.shape[0])[:, None]; fx = np.fft.rfftfreq(a.shape[1])[None, :]
    k = np.exp(-2 * (np.pi * sigma) ** 2 * (fx ** 2 + fy ** 2))
    return np.fft.irfft2(np.fft.rfft2(a) * k, s=a.shape)


def tubos(draw, segs, capas, ss=SS):
    """Shaded tubes: each layer (width factor, colour) drawn over all segments, so crossings stay clean."""
    for f, col in capas:
        for x0, y0, x1, y1, w in segs:
            ww = max(1, int(round(w * f * ss)))
            draw.line([(x0 * ss, y0 * ss), (x1 * ss, y1 * ss)], fill=col, width=ww)
            if ww > 2:
                r = ww / 2
                draw.ellipse([x1 * ss - r, y1 * ss - r, x1 * ss + r, y1 * ss + r], fill=col)


def mapa_crecimiento(segs_g):
    G = Image.new("L", (W * SS, H * SS), 0)
    d = ImageDraw.Draw(G)
    for x0, y0, x1, y1, w, g in sorted(segs_g, key=lambda s: -s[4]):
        d.line([(x0 * SS, y0 * SS), (x1 * SS, y1 * SS)], fill=int(1 + 254 * min(1, g)), width=max(1, int((w + 3) * SS)))
    return dilatar(G.resize((W, H), Image.NEAREST), 6)


def guardar(nombre, rgb, G, fondo):
    """fondo: the same scene without the growing structure, shown where it has not grown yet."""
    Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(OUT / f"{nombre}.jpg", quality=93)
    Image.fromarray((np.clip(fondo, 0, 1) * 255).astype(np.uint8)).save(OUT / f"{nombre}-f.jpg", quality=90)
    G.save(OUT / f"{nombre}-g.png")
    print("listo", nombre)


def capa(segs, capas, blur=0):
    im = Image.new("RGB", (W * SS, H * SS), (0, 0, 0))
    tubos(ImageDraw.Draw(im), segs, capas)
    im = im.resize((W, H), Image.LANCZOS)
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(im, float) / 255


# ─── retina ────────────────────────────────────────────────────────────────────────────────────────────────────
def arbol_vascular(x, y, ang, r, curva, gen_max, rmin, g0=0.0):
    segs = []

    def rama(x, y, ang, r, g, gen, curva):
        if r < rmin or gen > gen_max:
            return
        largo = r * rng.uniform(34, 52)
        n = 28
        ola = rng.uniform(0, 6.28)
        for k in range(n):
            # vessels wander smoothly: a gentle curve plus a slow wave, never straight polylines
            ang += curva / 2.8 + 0.035 * math.sin(k * 0.45 + ola) + rng.normal(0, 0.012)
            L = largo / n
            x2, y2 = x + L * math.cos(ang), y + L * math.sin(ang)
            segs.append((x, y, x2, y2, r * 2 * (1 - 0.12 * k / n), g + 0.05 * k / n))
            x, y = x2, y2
        g += 0.05
        a = rng.uniform(0.3, 0.7)
        r1, r2 = r * a ** (1 / 3), r * (1 - a) ** (1 / 3)  # Murray's law
        t1 = math.acos(np.clip((r ** 4 + r1 ** 4 - r2 ** 4) / (2 * r ** 2 * r1 ** 2), -1, 1))
        t2 = math.acos(np.clip((r ** 4 + r2 ** 4 - r1 ** 4) / (2 * r ** 2 * r2 ** 2), -1, 1))
        s = 1 if rng.random() < 0.5 else -1
        rama(x, y, ang + s * t1, r1, g, gen + 1, curva * 0.7)
        rama(x, y, ang - s * t2, r2, g, gen + 1, -curva * 0.4)

    rama(x, y, ang, r, g0, 0, curva)
    return segs


def venas():
    disco = (W * 0.66, H * 0.5); macula = (W * 0.36, H * 0.52)
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    n1 = ruido(6, 1); n2 = ruido(28, 2, 4); n3 = ruido(90, 6, 2)
    base = np.stack([0.80 + 0.12 * n1, 0.36 + 0.10 * n1, 0.16 + 0.06 * n2], -1)
    base *= (0.78 + 0.35 * n2[..., None] * 0.6) * (0.94 + 0.12 * n3[..., None])
    dm = np.hypot(xx - macula[0], yy - macula[1])
    base *= (1 - 0.42 * np.exp(-(dm / 230) ** 2))[..., None]
    base += np.exp(-(dm / 9) ** 2)[..., None] * np.array([0.6, 0.45, 0.3])  # foveal reflex
    dd = np.hypot(xx - disco[0], yy - disco[1])
    disco_m = np.clip(1.2 - dd / 120, 0, 1) ** 0.6
    base = base * (1 - disco_m[..., None]) + disco_m[..., None] * np.array([1.0, 0.86, 0.6])
    base += np.exp(-(dd / 45) ** 2)[..., None] * np.array([0.25, 0.25, 0.2])
    vena, arteria = [], []
    # arcades: superior and inferior temporal (curving around the macula), plus nasal branches
    for ang, curva in ((math.pi * 0.93, 0.03), (math.pi * 1.07, -0.03), (-0.35, 0.0), (0.35, 0.0), (math.pi * 0.62, 0.012), (math.pi * 1.38, -0.012)):
        vena += arbol_vascular(disco[0], disco[1], ang + 0.04, 8.0, curva * 1.4, 5, 2.0)
        arteria += arbol_vascular(disco[0], disco[1], ang - 0.06, 6.2, curva * 1.5, 5, 1.8)
    sv = [(a, b, c, d, w) for a, b, c, d, w, _ in vena]
    sa = [(a, b, c, d, w) for a, b, c, d, w, _ in arteria]
    som = capa(sv + sa, [(1.6, (255, 255, 255))], blur=3)  # soft shadow around the vessels
    V = capa(sv, [(1.0, (255, 255, 255))])[..., 0]
    A = capa(sa, [(1.0, (255, 255, 255))])[..., 0]
    R = capa(sa, [(0.28, (255, 255, 255))], blur=0.6)[..., 0]
    img = base * (1 - 0.18 * som[..., :1])
    img = img * (1 - V[..., None]) + V[..., None] * np.array([0.42, 0.07, 0.07])
    img = img * (1 - A[..., None]) + A[..., None] * np.array([0.72, 0.17, 0.10])
    img += R[..., None] * np.array([0.30, 0.16, 0.12])
    ang = np.arctan2(yy - disco[1], xx - disco[0])
    brillo_fibras = (0.5 + 0.5 * np.sin(ang * 90 + ruido(10, 3, 2) * 6)) * np.exp(-dd / 420) * 0.03
    img = img + brillo_fibras[..., None] * np.array([1.0, 0.8, 0.6])
    base = base + brillo_fibras[..., None] * np.array([1.0, 0.8, 0.6])
    suave = lambda a: np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.3)), float) / 255
    img, base = suave(img), suave(base)
    vineta = (1 - 0.35 * (np.hypot(xx - W / 2, yy - H / 2) / (W * 0.62)) ** 2)[..., None]
    guardar("venas", img * vineta, mapa_crecimiento(vena + arteria), base * vineta)


# ─── fluorescence neurons ──────────────────────────────────────────────────────────────────────────────────────
def neurona(cx, cy, escala):
    segs, espinas = [], []

    def dendrita(x, y, ang, r, g, gen, L0):
        if gen > 6 or r < 0.6:
            return
        n = 12
        for k in range(n):
            ang += rng.normal(0, 0.14)
            L = L0 / n
            x2, y2 = x + L * math.cos(ang), y + L * math.sin(ang)
            segs.append((x, y, x2, y2, r * 2, g + 0.06 * k / n))
            if gen >= 2 and rng.random() < 0.6:
                a2 = ang + rng.choice([-1, 1]) * rng.uniform(1.0, 1.9)
                espinas.append((x2, y2, x2 + 6 * escala * math.cos(a2), y2 + 6 * escala * math.sin(a2), 1.4, g))
            x, y = x2, y2
            r *= 0.975
        g += 0.06
        for s in (-1, 1):
            if rng.random() < 0.9:
                dendrita(x, y, ang + s * rng.uniform(0.3, 0.7), r * 0.8, g, gen + 1, L0 * 0.8)

    for d in range(rng.integers(5, 8)):
        dendrita(cx, cy, rng.uniform(0, 2 * math.pi), 4.2 * escala, 0.0, 0, 150 * escala)
    return segs, espinas


def neuronas():
    total = np.zeros((H, W, 3))
    lejos = None
    todos_g = []
    for capa_i, (blur, brillo, n) in enumerate(((14, 0.35, 7), (5, 0.6, 5), (0, 1.0, 5))):
        for k in range(n):
            cx, cy = rng.uniform(0.08, 0.92) * W, rng.uniform(0.1, 0.9) * H
            esc = rng.uniform(0.9, 1.4) * (0.8 if capa_i == 0 else 1)
            segs, esp = neurona(cx, cy, esc)
            magenta = rng.random() < 0.28
            col = np.array([1.0, 0.35, 0.85]) if magenta else np.array([0.45, 1.0, 0.55])
            s5 = [(a, b, c, d, w) for a, b, c, d, w, _ in segs + esp]
            L = capa(s5, [(1.0, (255, 255, 255))], blur=blur)[..., 0]
            soma = np.zeros((H, W)); yy, xx = np.ogrid[0:H, 0:W]
            soma += np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * (18 * esc) ** 2)))
            if blur:
                soma = np.asarray(Image.fromarray((soma * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur)), float) / 255
            total += (L[..., None] * 0.9 + soma[..., None] * 1.3) * col * brillo
            if capa_i == 2:
                todos_g += segs + esp
        if capa_i == 1:
            lejos = total.copy()
    halo = np.asarray(Image.fromarray((np.clip(total, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(16)), float) / 255
    img = total + halo * 0.6
    img += ruido(40, 9, 3)[..., None] * np.array([0.015, 0.03, 0.02])
    img = img / (1 + img * 0.35)
    fondo = lejos + ruido(40, 9, 3)[..., None] * np.array([0.015, 0.03, 0.02])
    guardar("neuronas", img, mapa_crecimiento(todos_g), fondo / (1 + fondo * 0.35))


# ─── night storm ───────────────────────────────────────────────────────────────────────────────────────────────
def relampago():
    from planos import rayo_fisico_segs
    segs = rayo_fisico_segs(top=H * 0.1, fondo=H * 0.9, poda=5)
    xc = segs[0][0]
    segs = [(xc + (a - xc) * 1.7, b, xc + (c - xc) * 1.7, d, w * 1.5, g) for a, b, c, d, w, g in segs]
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    nubes = ruido(5, 4) * 0.7 + ruido(16, 5, 4) * 0.3
    cielo = np.clip(1.25 - yy / (H * 0.5), 0, 1) ** 1.1 * (0.15 + 0.85 * nubes ** 1.6) * 1.4
    x_top = segs[0][0]
    luz = np.exp(-(((xx - x_top) / 900) ** 2 + ((yy - H * 0.12) / 360) ** 2))
    img = cielo[..., None] * (np.array([0.10, 0.10, 0.20]) + luz[..., None] * np.array([0.55, 0.55, 0.85]))
    img += np.array([0.02, 0.02, 0.05]) * (1 - yy / H)[..., None]
    # rain: thin slanted streaks in front of the storm
    lluvia = Image.new("L", (W, H), 0); dl = ImageDraw.Draw(lluvia)
    for _ in range(2600):
        x, y = rng.uniform(0, W), rng.uniform(0, H); L = rng.uniform(20, 60)
        dl.line([(x, y), (x - L * 0.18, y + L)], fill=int(rng.uniform(20, 70)), width=1)
    img += (np.asarray(lluvia.filter(ImageFilter.GaussianBlur(0.6)), float) / 255)[..., None] * np.array([0.25, 0.28, 0.4])
    cielo_solo = img.copy()
    s5 = [(a, b, c, d, w) for a, b, c, d, w, _ in segs]
    nucleo = capa(s5, [(1.0, (255, 255, 255))])[..., 0]
    g1 = capa(s5, [(1.0, (255, 255, 255))], blur=8)[..., 0]
    g2 = capa(s5, [(1.0, (255, 255, 255))], blur=40)[..., 0]
    g3 = capa(s5, [(1.0, (255, 255, 255))], blur=140)[..., 0]
    img += g3[..., None] * np.array([0.6, 0.5, 1.0]) * 3.0 * (1 - yy / H)[..., None] + g2[..., None] * np.array([0.5, 0.45, 1.0]) * 1.4 + g1[..., None] * np.array([0.6, 0.7, 1.0]) * 1.2 + nucleo[..., None] * 1.3
    # hills in silhouette
    perfil = H * 0.86 + 40 * np.sin(xx[0] / 300) + 25 * np.sin(xx[0] / 117 + 1) + 60 * (ruido(3, 7, 3)[0] - 0.5)
    img[yy > perfil[None, :]] *= 0.04
    cielo_solo[yy > perfil[None, :]] *= 0.04
    img = img / (1 + img * 0.3)
    guardar("relampago", img, mapa_crecimiento(segs), cielo_solo / (1 + cielo_solo * 0.3))


# ─── satellite rivers ──────────────────────────────────────────────────────────────────────────────────────────
def rio():
    """Rivers carve valleys into a height field; the terrain is lit by a low sun (hillshade), coloured by height,
    with vegetation along the water, as in a satellite image."""
    from planos import rio_segs
    segs = [(a, b, c, d, w * 0.55, g) for a, b, c, d, w, g in rio_segs()]
    s5 = [(a, b, c, d, w) for a, b, c, d, w, _ in segs]
    agua = capa(s5, [(1.0, (255, 255, 255))])[..., 0]
    cauce = capa(s5, [(3.0, (255, 255, 255))])[..., 0]
    mascara = capa(s5, [(4.0, (255, 255, 255))])[..., 0]
    valle = desenfoque(mascara, 70) * 1.0 + desenfoque(mascara, 18) * 0.6
    valle /= valle.max()
    alto = ruido(3, 21) * 1.0 + ruido(12, 22, 4) * 0.35 + ruido(60, 23, 2) * 0.06 - valle * 0.9
    gy, gx = np.gradient(alto * 140)
    n = np.stack([-gx, -gy, np.ones_like(gx)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    sol = np.array([-0.55, -0.45, 0.7]); sol /= np.linalg.norm(sol)
    sombra = np.clip((n * sol).sum(-1), 0, 1)
    a = (alto - alto.min()) / (alto.max() - alto.min())
    roca = np.array([0.62, 0.58, 0.52]); ocre = np.array([0.66, 0.50, 0.32]); seco = np.array([0.52, 0.44, 0.30])
    m1 = np.clip((a - 0.3) / 0.2, 0, 1)[..., None]; m2 = np.clip((a - 0.58) / 0.18, 0, 1)[..., None]
    tierra = seco * (1 - m1) + ocre * m1
    tierra = tierra * (1 - m2) + roca * m2
    tierra = tierra * (0.85 + 0.3 * ruido(40, 24, 3)[..., None])
    veg = np.clip(capa(s5, [(9.0, (255, 255, 255))], blur=30)[..., 0] * 1.6, 0, 1)
    color = tierra * (1 - 0.8 * veg[..., None]) + veg[..., None] * 0.8 * np.array([0.20, 0.32, 0.14])
    fondo = color * (0.35 + 0.85 * sombra[..., None])
    fondo = fondo * 0.92 + np.array([0.05, 0.06, 0.08])  # a little atmosphere
    img = fondo * (1 - 0.35 * cauce[..., None])
    img = img * (1 - agua[..., None]) + agua[..., None] * np.array([0.08, 0.16, 0.22]) * (0.8 + 0.4 * sombra[..., None])
    guardar("rio", img, mapa_crecimiento(segs), fondo)


# ─── bronchi as a 3D reconstruction ────────────────────────────────────────────────────────────────────────────
def pulmon():
    from planos import pulmon_segs
    segs = pulmon_segs(9)
    segs = [(a, b, c, d, w * 3.6, g) for a, b, c, d, w, g in segs]
    s5 = [(a, b, c, d, w) for a, b, c, d, w, _ in segs]
    im = capa(s5, [(1.0, (96, 46, 52)), (0.78, (176, 104, 100)), (0.52, (228, 168, 150)), (0.26, (255, 226, 205)), (0.09, (255, 250, 240))])
    sombra = capa(s5, [(1.8, (255, 255, 255))], blur=18)[..., 0]
    yy = np.mgrid[0:H, 0:W][0].astype(float)
    fondo = np.array([0.03, 0.025, 0.05]) + (yy / H)[..., None] * np.array([0.04, 0.02, 0.05])
    lleno = (im.sum(-1) > 0.02)[..., None]
    img = np.where(lleno, im, fondo * (1 - 0.6 * sombra[..., None]))
    guardar("pulmon", img, mapa_crecimiento(segs), np.broadcast_to(fondo, img.shape))


TAREAS = dict(venas=venas, neuronas=neuronas, relampago=relampago, rio=rio, pulmon=pulmon)

if __name__ == "__main__":
    for n in sys.argv[1:] or TAREAS:
        TAREAS[n]()
