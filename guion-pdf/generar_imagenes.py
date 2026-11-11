"""Computed images for the La frontera script PDF. Every image is calculated, none is illustration.

Usage: PYTHONPATH=../../pylib python3 generar_imagenes.py [name ...]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).parent / "img"
OUT.mkdir(exist_ok=True)

# creamy palette: deep violet -> magenta -> peach -> cream -> cyan -> back
STOPS = np.array([
    [12, 8, 28], [70, 24, 92], [176, 64, 128], [238, 140, 120],
    [250, 214, 170], [255, 244, 222], [150, 222, 226], [52, 110, 160], [12, 8, 28],
], float) / 255


def paleta(t):
    t = np.mod(t, 1.0) * (len(STOPS) - 1)
    i = np.floor(t).astype(int); f = (t - i)[..., None]
    f = f * f * (3 - 2 * f)
    return STOPS[i] * (1 - f) + STOPS[np.minimum(i + 1, len(STOPS) - 1)] * f


def brillo(rgb, radio=18, fuerza=0.55):
    """Soft bloom: screen-blend a blurred copy over the image."""
    im = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8))
    b = np.asarray(im.filter(ImageFilter.GaussianBlur(radio)), float) / 255
    return 1 - (1 - rgb) * (1 - b * fuerza)


def guardar(nombre, rgb):
    Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(OUT / f"{nombre}.jpg", quality=92)
    print("saved", nombre)


def escape(c, z0=None, it=800, bail=1e6):
    z = np.zeros_like(c) if z0 is None else z0.copy()
    nu = np.full(c.shape, np.nan)
    vivo = np.ones(c.shape, bool)
    for n in range(it):
        z[vivo] = z[vivo] ** 2 + c[vivo]
        a = np.abs(z)
        sale = vivo & (a > bail)
        nu[sale] = n + 1 - np.log2(np.log(a[sale]))
        vivo &= ~sale
        if not vivo.any():
            break
    return nu


def plano(cx, cy, ancho, w, h):
    x = np.linspace(cx - ancho / 2, cx + ancho / 2, w)
    alto = ancho * h / w
    y = np.linspace(cy + alto / 2, cy - alto / 2, h)
    return x[None, :] + 1j * y[:, None]


def mandel(nombre, cx, cy, ancho, w, h, it, escala, fase=0.0, ss=2, oscuro=0):
    c = plano(cx, cy, ancho, w * ss, h * ss)
    nu = escape(c, it=it)
    rgb = paleta(np.log1p(np.nan_to_num(nu)) * escala + fase)
    if oscuro:
        rgb *= (np.clip(np.nan_to_num(nu, nan=99) / oscuro, 0, 1) ** 2)[..., None]
    rgb[np.isnan(nu)] = 0
    rgb = rgb.reshape(h, ss, w, ss, 3).mean((1, 3))
    guardar(nombre, brillo(rgb))


def julia(c, w, h, it=400, ancho=3.2):
    z = plano(0, 0, ancho, w, h)
    return escape(np.full(z.shape, c), z0=z, it=it)


def en_mandelbrot(c, it=5000):
    z = 0
    for _ in range(it):
        z = z * z + c
        if abs(z) > 2:
            return False
    return True


def julias():
    cs = [complex(-1, 0), complex(-0.123, 0.745), complex(-0.39054, -0.58679), complex(-0.7269, 0.1889), complex(-0.75, 0.25), complex(-0.1, 0.9)]
    w = h = 900
    for k, c in enumerate(cs):
        nu = julia(c, w * 2, h * 2, ancho=3.0)
        rgb = paleta(np.log1p(np.nan_to_num(nu)) * 0.55 + 0.1 * k)
        rgb *= (np.clip(np.nan_to_num(nu, nan=99) / 14, 0, 1) ** 1.6)[..., None]
        rgb[np.isnan(nu)] = np.array([255, 244, 222]) / 255 * 0.92
        rgb = rgb.reshape(h, 2, w, 2, 3).mean((1, 3))
        dentro = en_mandelbrot(c)
        guardar(f"julia{k}", brillo(rgb, 10, 0.4))
        print(k, c, "dentro" if dentro else "fuera")


def mariposa():
    from math import gcd
    W = H = 1800
    acc = np.zeros((H, W))
    for q in range(1, 90):
        for p in range(0, q + 1):
            if gcd(p, q) != 1:
                continue
            a = p / q
            for nu in np.linspace(0, 2 * np.pi / q, 6, endpoint=False):
                n = np.arange(q)
                M = np.diag(2 * np.cos(2 * np.pi * a * n + nu))
                if q > 1:
                    M += np.diag(np.ones(q - 1), 1) + np.diag(np.ones(q - 1), -1)
                    M[0, -1] += 1; M[-1, 0] += 1
                else:
                    M = M + 2
                E = np.linalg.eigvalsh(M)
                x = ((E + 4) / 8 * (W - 1)).astype(int)
                y = int((1 - a) * (H - 1))
                acc[y, np.clip(x, 0, W - 1)] += 1
    acc = np.asarray(Image.fromarray(np.minimum(acc, 1).astype(np.float32) * 255).convert("L").filter(ImageFilter.GaussianBlur(1.1)), float) / 255
    acc = np.clip(acc * 2.4, 0, 1)
    yy = np.linspace(0, 1, H)[:, None] * np.ones((1, W))
    col = paleta(0.25 + yy * 0.5)
    rgb = col * acc[..., None]
    guardar("mariposa", brillo(rgb, 8, 0.6))


def costa():
    rng = np.random.default_rng(7)
    W, H = 1800, 1200
    th = np.linspace(0, 2 * np.pi, 6000, endpoint=False)
    r = np.ones_like(th)
    for k in range(2, 900):
        r += rng.normal() * k ** -1.25 * 0.55 * np.cos(k * th + rng.uniform(0, 2 * np.pi))
    pts = np.stack([W / 2 + r * np.cos(th) * 520, H / 2 + r * np.sin(th) * 420], 1)
    im = Image.new("RGB", (W, H), (10, 8, 22))
    d = ImageDraw.Draw(im)
    d.polygon([tuple(p) for p in pts], fill=(28, 22, 44))
    d.line([tuple(p) for p in np.vstack([pts, pts[:1]])], fill=(250, 214, 170), width=3)

    def compas(L):
        out = [pts[0]]; i = 0
        while i < len(pts) - 1:
            j = i + 1
            while j < len(pts) and np.linalg.norm(pts[j] - out[-1]) < L:
                j += 1
            if j >= len(pts):
                break
            out.append(pts[j]); i = j
        out.append(pts[0])
        return np.array(out)

    for L, col in ((260, (150, 222, 226)), (110, (238, 140, 120))):
        poly = compas(L)
        d.line([tuple(p) for p in poly], fill=col, width=4)
        for p in poly:
            d.ellipse([p[0] - 6, p[1] - 6, p[0] + 6, p[1] + 6], fill=col)
    rgb = np.asarray(im, float) / 255
    guardar("costa", brillo(rgb, 10, 0.5))


def cosmos():
    rng = np.random.default_rng(3)
    N = 512
    k = np.fft.fftfreq(N) * N
    kx, ky = np.meshgrid(k, k, indexing="ij")
    k2 = kx ** 2 + ky ** 2; k2[0, 0] = 1
    amp = k2 ** (-2.2) * np.exp(-k2 / 28 ** 2)
    phi_k = (rng.normal(size=(N, N)) + 1j * rng.normal(size=(N, N))) * np.sqrt(amp); phi_k[0, 0] = 0
    kx = kx * 2 * np.pi / N; ky = ky * 2 * np.pi / N
    sx = np.real(np.fft.ifft2(1j * kx * phi_k)); sy = np.real(np.fft.ifft2(1j * ky * phi_k))
    div = np.real(np.fft.ifft2(-(kx ** 2 + ky ** 2) * phi_k))
    norma = div.std(); sx /= norma; sy /= norma
    q = np.stack(np.meshgrid(np.arange(N), np.arange(N), indexing="ij"), 0).astype(float)
    sub = 3
    qx = (q[0][:, :, None] + np.linspace(0, 1, sub, endpoint=False)).reshape(-1)
    qy = (q[1][:, None, :].repeat(1, 0)[:, :, None] + 0).reshape(-1)
    qx = np.repeat(q[0].reshape(-1), sub * sub) + np.tile(np.repeat(np.linspace(0, 1, sub, endpoint=False), sub), N * N)
    qy = np.repeat(q[1].reshape(-1), sub * sub) + np.tile(np.tile(np.linspace(0, 1, sub, endpoint=False), sub), N * N)
    ix = np.repeat(np.arange(N * N), sub * sub)
    D = 1.15
    x = (qx + D * sx.reshape(-1)[ix]) % N
    y = (qy + D * sy.reshape(-1)[ix]) % N
    W, H = 1800, 1200
    dens, _, _ = np.histogram2d(y * H / N, x * W / N, bins=(H, W), range=((0, H), (0, W)))
    v = np.log1p(dens * 3); v = v / v.max()
    v = np.asarray(Image.fromarray((v * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6)), float) / 255
    v = v / v.max()
    v = np.clip((v - 0.15) / 0.85, 0, 1) ** 1.3
    rgb = paleta(0.05 + v * 0.55) * v[..., None] ** 0.9
    guardar("cosmos", brillo(rgb, 12, 0.6))


def entrenabilidad():
    """Grid of small tanh networks, each trained with a different pair of learning rates (layer 1, layer 2)."""
    rng = np.random.default_rng(0)
    G = 360; n, d, h = 8, 8, 8
    X = rng.normal(size=(n, d)); Y = rng.normal(size=(n,))
    W1_0 = rng.normal(size=(h, d)) / np.sqrt(d); W2_0 = rng.normal(size=(h,)) / np.sqrt(h)
    l1 = np.logspace(-0.2, 1.0, G); l2 = np.logspace(-0.75, -0.15, G)
    L1, L2 = np.meshgrid(l1, l2)
    L1 = L1.reshape(-1); L2 = L2.reshape(-1)
    Nn = G * G
    W1 = np.broadcast_to(W1_0, (Nn, h, d)).copy(); W2 = np.broadcast_to(W2_0, (Nn, h)).copy()
    pasos = 400
    perdida = np.zeros(Nn); diverge = np.full(Nn, pasos)
    vivo = np.ones(Nn, bool)
    for t in range(pasos):
        A = np.tanh(np.einsum("nhd,sd->nsh", W1, X))
        P = np.einsum("nsh,nh->ns", A, W2)
        E = P - Y
        loss = (E ** 2).mean(1)
        g2 = np.einsum("ns,nsh->nh", E, A) * 2 / n
        dA = E[:, :, None] * W2[:, None, :] * (1 - A ** 2) * 2 / n
        g1 = np.einsum("nsh,sd->nhd", dA, X)
        W1 -= L1[:, None, None] * g1; W2 -= L2[:, None] * g2
        malo = vivo & (~np.isfinite(loss) | (loss > 1e6))
        diverge[malo] = t; vivo &= ~malo
        W1[~vivo] = 0; W2[~vivo] = 0
        perdida[vivo] += np.log10(loss[vivo] + 1e-12)
    perdida /= pasos
    dv = diverge.reshape(G, G)[::-1]; pv = perdida.reshape(G, G)[::-1]; vv = vivo.reshape(G, G)[::-1]
    rgb = np.zeros((G, G, 3))
    tn = np.clip((pv - np.percentile(pv[vv], 2)) / (np.ptp(pv[vv]) + 1e-9), 0, 1)
    azul = np.array([20, 40, 110]) / 255; cian = np.array([120, 200, 230]) / 255
    rgb[vv] = (azul * (1 - tn[vv, None]) + cian * tn[vv, None])
    td = np.clip(np.log1p(dv) / np.log1p(pasos), 0, 1)
    crema = np.array([255, 240, 214]) / 255; magenta = np.array([176, 64, 128]) / 255
    rgb[~vv] = crema * (1 - td[~vv, None]) + magenta * td[~vv, None]
    im = Image.fromarray((rgb * 255).astype(np.uint8)).resize((1440, 1440), Image.NEAREST)
    guardar("maquina", np.asarray(im, float) / 255)
    print("diverged fraction", (~vivo).mean())


def arbol():
    W, H = 1400, 1600
    im = Image.new("RGB", (W, H), (10, 8, 22))
    d = ImageDraw.Draw(im)
    rng = np.random.default_rng(5)

    def rama(x, y, ang, L, g, ancho):
        if g > 12 or L < 3:
            return
        x2 = x + L * np.cos(ang); y2 = y - L * np.sin(ang)
        t = g / 12
        col = tuple(int(v * 255) for v in paleta(0.42 - t * 0.3))
        d.line([(x, y), (x2, y2)], fill=col, width=max(1, int(ancho)))
        for s in (-1, 1):
            rama(x2, y2, ang + s * (0.42 + rng.normal() * 0.08), L * (0.76 + rng.normal() * 0.04), g + 1, ancho * 0.72)

    rama(W / 2, H - 80, np.pi / 2, 300, 0, 26)
    rgb = np.asarray(im, float) / 255
    guardar("arbol", brillo(rgb, 10, 0.55))


def orbitas():
    """Long exposure of real orbits of z -> z^2 + c (escaping orbits accumulated, Buddhabrot)."""
    rng = np.random.default_rng(11)
    W, H = 1800, 1200
    acc = np.zeros((3, H, W))
    esc = 290; cx0, cy0 = W / 2 + 0.45 * esc, H / 2
    for lote in range(10):
        c = rng.uniform(-2, 1, 300000) + 1j * rng.uniform(-1.3, 1.3, 300000)
        for canal, it in enumerate((60, 300, 1500)):
            z = np.zeros_like(c); vivo = np.ones(c.shape, bool); n_esc = np.full(c.shape, -1)
            for n in range(it):
                z[vivo] = z[vivo] ** 2 + c[vivo]
                s_ = vivo & (np.abs(z) > 4); n_esc[s_] = n; vivo &= ~s_
            cs = c[n_esc > 12]
            z = np.zeros_like(cs)
            for n in range(it):
                z = z * z + cs
                ok = np.abs(z) < 2.2
                if not ok.any():
                    break
                zz = z[ok]
                x = (cx0 + zz.real * esc).astype(int); y = (cy0 - zz.imag * esc).astype(int)
                m = (x >= 0) & (x < W) & (y >= 0) & (y < H)
                np.add.at(acc[canal], (y[m], x[m]), 1)
    v = np.stack([(a / np.percentile(a[a > 0], 99.95)) ** 0.75 for a in acc], -1)
    v = np.clip(v, 0, 1)
    col = np.array([[176, 64, 128], [250, 214, 170], [150, 222, 226]]) / 255
    rgb = np.clip(v @ col, 0, 1)
    guardar("orbitas", brillo(rgb, 8, 0.5))


def orbitas_lineas():
    W, H = 1800, 1200
    im = Image.new("RGB", (W, H), (8, 6, 18))
    d = ImageDraw.Draw(im)
    esc = 380; cx0, cy0 = W * 0.58, H / 2

    def P(z):
        return (cx0 + z.real * esc, cy0 - z.imag * esc)

    for c, col, n in ((complex(-0.12, 0.70), (250, 214, 170), 60), (complex(0.32, 0.05), (150, 222, 226), 60), (complex(-0.2, 1.02), (238, 140, 120), 9), (complex(0.4, 0.4), (176, 64, 128), 7)):
        z = 0j; pts = [P(z)]
        for _ in range(n):
            z = z * z + c
            if abs(z) > 4:
                break
            pts.append(P(z))
        d.line(pts, fill=col, width=3)
        for p in pts:
            d.ellipse([p[0] - 6, p[1] - 6, p[0] + 6, p[1] + 6], fill=col)
    rgb = np.asarray(im, float) / 255
    guardar("orbitas", brillo(rgb, 9, 0.6))


TAREAS = {
    "portada": lambda: mandel("portada", -1.3, 0.0, 5.0, 2400, 1350, 700, 0.42, 0.62),
    "caballitos": lambda: mandel("caballitos", -0.7453, 0.1127, 0.0065, 1800, 1200, 1400, 0.38, 0.1),
    "minibrot": lambda: mandel("minibrot", -1.7605, 0.0, 0.07, 1800, 1200, 1600, 0.4, 0.3),
    "punto": lambda: mandel("punto", -0.62, 0.0, 9.0, 1800, 1200, 400, 0.42, 0.62, oscuro=9),
    "julias": julias,
    "mariposa": mariposa,
    "costa": costa,
    "cosmos": cosmos,
    "maquina": entrenabilidad,
    "arbol": arbol,
    "orbitas": orbitas,
}

if __name__ == "__main__":
    for nombre in sys.argv[1:] or TAREAS:
        TAREAS[nombre]()
