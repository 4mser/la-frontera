"""The close of chapter VII: out through the cosmic web, time runs backwards until everything is one point,
then the Big Bang: a nearly uniform gas expands and the web forms again. Own particle render → public/p7/vid/final.
Illustration: the web is built from nodes and filaments, not from a cosmological simulation."""
import numpy as np, sys
from PIL import Image, ImageFilter
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor

W, H, FPS, DUR = 1920, 1080, 30, 31.5
OUT = Path(__file__).resolve().parent.parent / "public/p7/vid/final"
r = np.random.default_rng(1)

# ── the web: nodes (clusters), each joined to its nearest neighbours by filaments ──
NN = 90
nodos = r.uniform(-1, 1, (NN, 3)) * np.array([1.3, 0.8, 1.0])
masa = r.pareto(1.6, NN) + 0.3
d = np.linalg.norm(nodos[:, None] - nodos[None], axis=2)
pares = {tuple(sorted((i, j))) for i in range(NN) for j in np.argsort(d[i])[1:4]}
pares = np.array(sorted(pares))
NF, NC, NB = 240_000, 90_000, 50_000
seg = pares[r.integers(0, len(pares), NF)]
u = r.uniform(0, 1, NF) ** 1.0
u = np.where(r.uniform(0, 1, NF) < 0.5, u ** 2.2, 1 - (1 - u) ** 2.2)        # denser near the nodes
fil = nodos[seg[:, 0]] * (1 - u[:, None]) + nodos[seg[:, 1]] * u[:, None] + r.normal(0, 0.009, (NF, 3)) * (1 + 1.5 * np.minimum(u, 1 - u))[:, None]
k = r.choice(NN, NC, p=masa / masa.sum())
clu = nodos[k] + r.normal(0, 1, (NC, 3)) * (0.012 + 0.012 * np.sqrt(masa[k]))[:, None]
fondo = r.uniform(-1.4, 1.4, (NB, 3)) * np.array([1.3, 0.8, 1.0])
# a second, finer level: small nodes along the big filaments, joined among themselves (the web inside the web)
NS = 700
chicos = fil[r.integers(0, NF, NS)] + r.normal(0, 0.12, (NS, 3))
d2 = np.linalg.norm(chicos[:, None] - chicos[None], axis=2)
p2 = np.array(sorted({tuple(sorted((i, j))) for i in range(NS) for j in np.argsort(d2[i])[1:4]}))
NF2 = 420_000
s2 = p2[r.integers(0, len(p2), NF2)]; u2 = r.uniform(0, 1, NF2)
fil2 = chicos[s2[:, 0]] * (1 - u2[:, None]) + chicos[s2[:, 1]] * u2[:, None] + r.normal(0, 0.008, (NF2, 3))
WEB = np.concatenate([fil, clu, fondo, fil2])
N = len(WEB)
BRI = np.concatenate([np.full(NF, 1.0), np.full(NC, 1.8), np.full(NB, 0.3), np.full(NF2, 0.45)])
# the early universe: the same particles, spread almost uniformly in a ball
dirs = r.normal(0, 1, (N, 3)); dirs /= np.linalg.norm(dirs, axis=1)[:, None]
BOLA = dirs * (r.uniform(0, 1, N) ** (1 / 3))[:, None] * 1.5
STARS = r.uniform(0, 1, (1500, 2)) * [W, H]; STARB = r.uniform(0.05, 0.4, 1500)

def ease(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)

# timeline (s): 0–3 pull out of the web · 3–9 the whole web · 9–13.4 collapse · 13.4–14.2 one point · 14.2 bang · 17–23 the web forms · –27.5 hold
T_COL, T_PUNTO, T_BANG = 9.0, 13.4, 14.2

def estado(t):
    """scale a, how much web structure w (0 = uniform gas), heat (0 cold … 1 white), camera distance and angle"""
    if t < T_COL:
        a, w, heat = 1.0, 1.0, 0.0
    elif t < T_BANG:
        x = np.clip((t - T_COL) / (T_PUNTO - T_COL), 0, 1)
        a = max(1 - x ** 2.4, 0.0) + 1e-3; w = 1 - ease((x - 0.35) / 0.6); heat = x ** 1.5
    else:
        x = t - T_BANG
        a = 1.25 * (1 - np.exp(-x * 0.9)) + 0.02 * x + 1e-3
        w = ease((x - 1.5) / 5.5); heat = np.exp(-x * 0.8)
    dist = 0.12 + 1.9 * ease(t / 3.2) ** 0.7 if t < 3.2 else 2.02 + 0.03 * (t - 3.2) + (0.5 * ease((t - T_BANG - 6) / 8) if t > T_BANG else 0)
    ang = 0.35 + 0.035 * t + (0.6 * ease((t - T_COL) / (T_PUNTO - T_COL)) ** 2 if t > T_COL else 0) + (0.6 if t > T_BANG else 0)
    return a, w, heat, dist, ang

def proyecta(P, dist, ang):
    c, s = np.cos(ang), np.sin(ang)
    x = P[:, 0] * c - P[:, 2] * s; z = P[:, 0] * s + P[:, 2] * c; y = P[:, 1]
    tilt = 0.28; y, z = y * np.cos(tilt) - z * np.sin(tilt), y * np.sin(tilt) + z * np.cos(tilt)
    z = z + dist
    ok = z > 0.03
    f = H * 0.95
    return W / 2 + x / np.maximum(z, 0.03) * f, H / 2 + y / np.maximum(z, 0.03) * f, z, ok

def cuadro(fr):
    t = fr / FPS
    if t >= T_BANG:
        img = expansion(t)
        Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(OUT / f"{fr:04d}.jpg", quality=92)
        return fr
    acc = np.zeros((3, H * W))
    for sub in range(3):                                  # motion blur: three instants inside the frame
        ts = t + sub / (3 * FPS)
        a, w, heat, dist, ang = estado(ts)
        P = (BOLA * (1 - w) + WEB * w) * a
        if T_COL < ts < T_BANG:                           # the collapse spins up
            sw = 2.5 * ease((ts - T_COL) / (T_PUNTO - T_COL)) ** 2 / (np.linalg.norm(P[:, [0, 2]], axis=1) + 0.15)
            c, s = np.cos(sw), np.sin(sw); P = np.stack([P[:, 0] * c - P[:, 2] * s, P[:, 1], P[:, 0] * s + P[:, 2] * c], 1)
        x, y, z, ok = proyecta(P, dist, ang)
        ok &= (x >= 0) & (x < W - 1) & (y >= 0) & (y < H - 1)
        idx = (y[ok].astype(int) * W + x[ok].astype(int))
        b = BRI[ok] / np.maximum(z[ok], 0.25) ** 1.2 * 0.5
        # colour: cold web amber/blue, hot = white-blue
        cold = np.array([1.0, 0.7, 0.35]); fil_b = np.array([0.45, 0.5, 1.0]); hot = np.array([0.8, 0.9, 1.0]); gas = np.array([1.0, 0.45, 0.18])
        mezc = np.where(BRI[ok] > 1.2, 0.0, np.where(BRI[ok] < 0.5, 0.85, 0.55))
        for ch in range(3):
            colc = (cold[ch] * (1 - mezc) + fil_b[ch] * mezc) * w + gas[ch] * (1 - w)   # the young gas glows orange until the web forms
            col = colc * (1 - heat) + hot[ch] * heat
            acc[ch] += np.bincount(idx, b * col, H * W)
    img = acc.reshape(3, H, W).transpose(1, 2, 0) / 3
    a, w, heat, dist, ang = estado(t)
    # glow
    pim = Image.fromarray((np.clip(img * 0.5, 0, 1) * 255).astype(np.uint8)).resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(6)).resize((W, H), Image.BILINEAR)
    img = img + np.asarray(pim) / 255 * 0.9
    img = 1 - np.exp(-img * 2.0)
    # stars far behind (not during the point and the flash)
    if t < T_COL + 2 or t > T_BANG + 4:
        sa = 1 - ease((t - T_COL) / 2) if t < T_BANG else ease((t - T_BANG - 4) / 3)
        si = STARS.astype(int); img[si[:, 1], si[:, 0]] += (STARB * sa)[:, None]
    yy, xx = np.mgrid[0:H, 0:W]; rr = np.hypot(xx - W / 2, yy - H / 2)
    # the point: everything in one place
    if T_PUNTO - 0.6 < t < T_BANG + 0.1:
        k = ease((t - T_PUNTO + 0.6) / 0.6) * (1 - ease((t - T_BANG) / 0.1)) if t < T_BANG else 1.0
        pulso = 1 + 0.15 * np.sin(t * 40)
        img = img * (1 - 0.9 * k) + (np.exp(-(rr / (5 * pulso)) ** 2) * 1.6 + np.exp(-rr / 60) * 0.25)[..., None] * np.array([0.9, 0.95, 1.0]) * k
    # the bang: flash, then a shock ring running outwards
    if t >= T_BANG:
        x = t - T_BANG
        img = img + np.exp(-x * 9) * 1.0                                                   # the first instant: everything white
        img = img + (np.exp(-rr / (W * 0.06 * (1 + 4 * x))) * np.exp(-x * 0.9) * 2.0)[..., None] * np.array([1.0, 0.9, 0.75])
        R = W * 0.05 + W * 0.9 * (1 - np.exp(-x * 1.1))
        img = img + (np.exp(-((rr - R) / (14 + 40 * x)) ** 2) * np.exp(-x * 0.7) * 0.9)[..., None] * np.array([1.0, 0.75, 0.45])
    img = np.clip(img, 0, 1)
    Image.fromarray((img * 255).astype(np.uint8)).save(OUT / f"{fr:04d}.jpg", quality=90)
    return fr

# ── after the bang ──────────────────────────────────────────────────────────────────────────────────────────────
def campo(n, beta, seed):
    """periodic smooth noise by spectral synthesis: amplitude k^-beta, random phases"""
    g = np.random.default_rng(seed)
    kx = np.fft.fftfreq(n)[:, None]; ky = np.fft.fftfreq(n)[None, :]; k = np.hypot(kx, ky); k[0, 0] = 1
    f = (g.normal(size=(n, n)) + 1j * g.normal(size=(n, n))) * k ** (-beta); f[0, 0] = 0
    c = np.real(np.fft.ifft2(f)); return (c - c.mean()) / c.std()
PLASMA = campo(1024, 1.6, 21)
CMB = campo(1024, 1.25, 33)
YY, XX = np.mgrid[0:H, 0:W]; RR = np.hypot(XX - W / 2, YY - H / 2); TH = np.arctan2(YY - H / 2, XX - W / 2)

def paleta(v, stops):
    out = np.empty(v.shape + (3,))
    for ch in range(3): out[..., ch] = np.interp(v, [a for a, _ in stops], [c[ch] for _, c in stops])
    return out
FUEGO = [(0, (0, 0, 0)), (0.25, (0.45, 0.05, 0.02)), (0.5, (1.0, 0.35, 0.05)), (0.75, (1.0, 0.8, 0.4)), (1, (1.0, 1.0, 0.95))]
PLANCK = [(-2.5, (0.0, 0.0, 0.35)), (-1.2, (0.1, 0.35, 1.0)), (0, (0.92, 0.9, 0.85)), (1.2, (1.0, 0.55, 0.1)), (2.5, (0.75, 0.08, 0.04))]

# streaks: matter rushing out past the camera
NS_ = 26000
SANG = r.uniform(0, 2 * np.pi, NS_); SR0 = r.uniform(2, 60, NS_) ** 1.0; SV = r.uniform(0.6, 1.6, NS_); SB = r.uniform(0.3, 1, NS_)

# stars that ignite: brightest cluster particles, each with its own moment
IGN = np.arange(NF, NF + NC)[r.uniform(0, 1, NC) < 0.12]; T_IGN = r.uniform(8.6, 12.5, len(IGN))
# the web repeated around, for the last pull-back (a sparse copy in each neighbouring cell)
OFS = np.array([[i, j, k] for i in range(-2, 3) for j in range(-2, 3) for k in range(-2, 3) if (i, j, k) != (0, 0, 0)]) * np.array([2.5, 1.6, 2.0])
OFS = OFS + r.uniform(-0.4, 0.4, OFS.shape)
OPESO = np.exp(-(np.linalg.norm(OFS / np.array([2.5, 1.6, 2.0]), axis=1) / 1.9) ** 2)      # a round, soft edge that fades into the dark
OROT = r.uniform(0, 2 * np.pi, len(OFS))                                                   # each cell turned, so nothing repeats
SUB = r.uniform(0, 1, N) < 0.06

def splat(P, bri, cols, dist, ang):
    x, y, z, ok = proyecta(P, dist, ang)
    ok &= (x >= 0) & (x < W - 1) & (y >= 0) & (y < H - 1)
    idx = y[ok].astype(int) * W + x[ok].astype(int)
    b = bri[ok] / np.maximum(z[ok], 0.25) ** 1.2
    return np.stack([np.bincount(idx, b * cols[ok, ch], H * W) for ch in range(3)], -1).reshape(H, W, 3)

def brillo(img, k=0.9):
    pim = Image.fromarray((np.clip(img * 0.5, 0, 1) * 255).astype(np.uint8)).resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(7)).resize((W, H), Image.BILINEAR)
    return img + np.asarray(pim) / 255 * k

def expansion(t):
    x = t - T_BANG
    img = np.zeros((H, W, 3))
    # 1 · the hot plasma, a tunnel rushing outwards, cooling from white to red (0 – 4.6 s)
    if x < 4.6:
        vel = 9.0 * (1 - np.exp(-x * 0.7))
        prof = 90.0 / (RR + 25) + vel
        u = ((TH / (2 * np.pi) + 0.5) * 1024 * 2).astype(int) % 1024
        v = (prof * 140).astype(int) % 1024
        v2 = (prof * 330 + 400).astype(int) % 1024
        d = 0.65 * PLASMA[v, u] + 0.45 * PLASMA[v2, (u * 2 + 300) % 1024]
        temp = np.exp(-x * 0.35)
        nivel = np.clip(0.42 + 0.26 * d + 0.18 * temp - 0.00025 * RR * (1 - temp), 0, 1) * (0.5 + 0.4 * temp)
        img += paleta(nivel, FUEGO) * 0.55 * (1 - np.clip((x - 3.0) / 0.9, 0, 1))
        # streaks of matter
        for k in range(7):
            xs = x - k * 0.012
            rad = SR0 * np.exp(SV * xs * 1.4) * (1 + xs * 2)
            px = W / 2 + np.cos(SANG) * rad; py = H / 2 + np.sin(SANG) * rad
            ok = (px >= 0) & (px < W) & (py >= 0) & (py < H)
            idx = py[ok].astype(int) * W + px[ok].astype(int)
            b = (SB[ok] * np.exp(-xs * 0.6) * 0.3) * (1 - np.clip((xs - 3.0) / 0.9, 0, 1))
            img += np.bincount(idx, b, H * W).reshape(H, W)[..., None] * np.array([1.0, 0.85, 0.6])
        img += np.exp(-x * 8) * 1.5                                         # the first instant: everything white
        img += (np.exp(-RR / (W * 0.05 * (1 + 3 * x))) * np.exp(-x * 1.2) * 2.0)[..., None] * np.array([1.0, 0.92, 0.8])
    # 2 · the oldest light: the plasma clears and a sphere of tiny density differences is left (3.4 – 7.6 s)
    if 3.4 < x < 7.6:
        aS = np.clip((x - 3.5) / 0.6, 0, 1) * (1 - np.clip((x - 6.6) / 1.0, 0, 1))
        R = H * (2.6 - 2.18 * (1 - np.exp(-(x - 3.4) * 1.1)))
        xn = (XX - W / 2) / R; yn = (YY - H / 2) / R; r2 = xn ** 2 + yn ** 2; den = r2 < 1
        zn = np.sqrt(np.clip(1 - r2, 0, 1)); rot = 0.6 + x * 0.12
        X = xn * np.cos(rot) + zn * np.sin(rot); Z = -xn * np.sin(rot) + zn * np.cos(rot)
        lon = np.arctan2(X, Z); lat = np.arcsin(np.clip(yn, -1, 1))
        u = ((lon / (2 * np.pi) + 0.5) * 1023).astype(int) % 1024; v = ((lat / np.pi + 0.5) * 1023).astype(int) % 1024
        col = paleta(CMB[v, u], PLANCK) * (0.45 + 0.55 * zn)[..., None]
        borde = np.exp(-((np.sqrt(r2) - 1) / 0.025) ** 2)[..., None] * np.array([1.0, 0.7, 0.4]) * 0.6
        img = img * (1 - aS * den[..., None]) + (np.where(den[..., None], col, 0) + borde) * aS
    # 3 · dark ages, then gravity: the same particles gather into the web and the first stars ignite (6.6 s →)
    if x > 6.6:
        aP = np.clip((x - 6.6) / 1.0, 0, 1)
        w = ease((x - 7.2) / 5.0) ** 0.9
        a = 0.62 + 0.38 * ease((x - 6.6) / 5.5) + 0.012 * (x - 6.6)      # space keeps expanding
        P = (BOLA * (1 - w) + WEB * w) * a
        dist = 2.05 + 9.0 * ease((x - 12.0) / 5.3) ** 1.3
        ang = 1.3 + 0.03 * x
        # colour: the gas keeps the tint of the light it came from, then cools to the web's colours
        dirs_ = BOLA / (np.linalg.norm(BOLA, axis=1)[:, None] + 1e-6)
        if not hasattr(expansion, "tinte"):
            lon = np.arctan2(dirs_[:, 0], dirs_[:, 2]); lat = np.arcsin(np.clip(dirs_[:, 1], -1, 1))
            expansion.tinte = paleta(CMB[((lat / np.pi + 0.5) * 1023).astype(int) % 1024, ((lon / (2 * np.pi) + 0.5) * 1023).astype(int) % 1024], PLANCK)
        web_col = np.where((BRI > 1.2)[:, None], np.array([1.0, 0.72, 0.38]), np.where((BRI < 0.5)[:, None], np.array([0.45, 0.5, 1.0]), np.array([0.6, 0.62, 1.0])))
        cols = expansion.tinte * (1 - w) * 0.6 + web_col * w
        bri = BRI * (0.7 + 0.3 * w) * 0.5 * aP
        img = img * (1 - aP) + splat(P, bri, cols, dist, ang) * 1.0
        # the first stars: each lights with a flash, then stays
        dt = x - T_IGN
        on = dt > 0
        if on.any():
            fl = np.where(on, 0.6 + 4.0 * np.exp(-np.clip(dt, 0, None) * 3.0), 0)
            px, py, pz, ok = proyecta(P[IGN], dist, ang)
            ok &= on & (px >= 0) & (px < W - 1) & (py >= 0) & (py < H - 1)
            st = np.bincount(py[ok].astype(int) * W + px[ok].astype(int), fl[ok] * 1.6 / np.maximum(pz[ok], 0.25), H * W).reshape(H, W)
            stim = Image.fromarray((np.clip(st, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2))
            img += (np.asarray(stim) / 255 * 3.0)[..., None] * np.array([1.0, 0.95, 0.85]) + st[..., None] * np.array([1.0, 0.9, 0.7])
        # the last pull-back: the web does not end; the same structure goes on in every direction
        aR = ease((x - 12.2) / 3.0)
        if aR > 0.01:
            Q = WEB[SUB]
            for o, pe, ro in zip(OFS, OPESO, OROT):
                if pe < 0.05: continue
                c_, s_ = np.cos(ro), np.sin(ro)
                Qr = np.stack([Q[:, 0] * c_ - Q[:, 2] * s_, Q[:, 1], Q[:, 0] * s_ + Q[:, 2] * c_], 1)
                img += splat(Qr + o, BRI[SUB] * 0.5 / 0.06 * 0.45 * aR * pe, web_col[SUB], dist, ang)
    img = brillo(img, 0.9)
    img = 1 - np.exp(-img * 1.9)
    img *= 1 - np.clip((x - 15.6) / 1.6, 0, 1) * 0                       # the fade is done by the chapter
    return img


if __name__ == "__main__":
    sel = [int(x) for x in sys.argv[1:]] or range(int(DUR * FPS) + 30)
    with ProcessPoolExecutor() as ex:
        for _ in ex.map(cuadro, sel, chunksize=4): pass
    print("ok", len(list(OUT.glob("*.jpg"))))
