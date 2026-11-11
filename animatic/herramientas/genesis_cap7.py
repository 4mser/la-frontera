"""A recreation (own animation) of the Genesis sequence idea: a dead planet, a wave of fire that
leaves fractal terrain behind it, then a flight over the new mountains. Frames → public/p7/vid/genesis."""
import numpy as np, sys
from PIL import Image, ImageFilter
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor

W, H, FPS = 1280, 720, 30
NA, NB = 165, 285          # planet frames, flight frames
OUT = Path(__file__).resolve().parent.parent / "public/p7/vid/genesis"
rng = np.random.default_rng(7)

def ds(n, rough, seed):
    """diamond–square heightmap, size 2^n (periodic), the rule of the chapter in 2D"""
    r = np.random.default_rng(seed); N = 2 ** n; h = np.zeros((N, N)); s = N; a = 1.0
    while s > 1:
        m = s // 2
        c = (h[::s, ::s] + np.roll(h[::s, ::s], -1, 0) + np.roll(h[::s, ::s], -1, 1) + np.roll(np.roll(h[::s, ::s], -1, 0), -1, 1)) / 4
        h[m::s, m::s] = c + r.uniform(-a, a, c.shape)
        e1 = (h[::s, ::s] + np.roll(h[::s, ::s], -1, 1) + h[m::s, m::s] + np.roll(h[m::s, m::s], 1, 0)) / 4
        h[::s, m::s] = e1 + r.uniform(-a, a, e1.shape)
        e2 = (h[::s, ::s] + np.roll(h[::s, ::s], -1, 0) + h[m::s, m::s] + np.roll(h[m::s, m::s], 1, 1)) / 4
        h[m::s, ::s] = e2 + r.uniform(-a, a, e2.shape)
        s = m; a *= rough
    return (h - h.min()) / (h.max() - h.min())

ALT = ds(10, 0.55, 3)                    # terrain heights (alive)
_gy, _gx = np.gradient(ALT * 300)
SOMBRA = np.clip(0.75 + 0.5 * (-_gx * 0.6 - _gy * 0.4) / np.sqrt(1 + _gx ** 2 + _gy ** 2), 0.25, 1.3)   # light from the low sun
DEAD = ds(9, 0.6, 11)                    # the dead moon's texture
STARS = np.zeros((H, W, 3)); _i = rng.integers(0, H * W, 900); STARS.reshape(-1, 3)[_i] = rng.uniform(0.2, 1, (900, 1))

def tierra(h):
    """height → colour: sea, shore, green, rock, snow"""
    c = np.empty(h.shape + (3,))
    stops = [(0, (8, 30, 70)), (0.3, (20, 80, 130)), (0.33, (190, 175, 130)), (0.38, (60, 120, 50)), (0.55, (40, 85, 40)), (0.7, (120, 100, 82)), (0.82, (235, 235, 240)), (1, (255, 255, 255))]
    for k in range(3):
        c[..., k] = np.interp(h, [s for s, _ in stops], [v[k] for _, v in stops])
    return c / 255

def planeta(f):
    t = f / FPS
    R = H * (0.36 + 0.10 * (f / NA) ** 2)
    y, x = np.mgrid[0:H, 0:W].astype(float); x = (x - W / 2) / R; y = (y - H / 2) / R
    r2 = x * x + y * y; den = r2 < 1; z = np.sqrt(np.clip(1 - r2, 0, 1))
    rot = 0.25 + t * 0.05
    X = x * np.cos(rot) + z * np.sin(rot); Z = -x * np.sin(rot) + z * np.cos(rot); Y = y
    lon = np.arctan2(X, Z); lat = np.arcsin(np.clip(Y, -1, 1))
    u = ((lon / (2 * np.pi) + 0.5) * 1023).astype(int) % 1024; v = ((lat / np.pi + 0.5) * 1023).astype(int) % 1024
    ud = u // 2; vd = v // 2
    luzd = np.clip(0.25 + 0.85 * (-0.5 * x - 0.45 * y + 0.75 * z), 0, 1.2)
    muerto = (0.25 + 0.35 * DEAD[vd, ud])[..., None] * np.array([0.85, 0.82, 0.8])
    vivo = tierra(ALT[v, u])
    # the impact point, and the front growing around the sphere
    p0 = np.array([-0.35, -0.2, 0.92]); p0 /= np.linalg.norm(p0)
    p0r = np.array([p0[0] * np.cos(rot) + p0[2] * np.sin(rot), p0[1], -p0[0] * np.sin(rot) + p0[2] * np.cos(rot)])
    th = np.arccos(np.clip(X * p0r[0] + Y * p0r[1] + Z * p0r[2], -1, 1))
    rho = -0.05 + 3.0 * np.clip((t - 0.5) / 5.0, 0, 1) ** 1.5
    ruido = (DEAD[vd, ud] - 0.5) * 0.12
    d = th - rho + ruido
    mezcla = np.clip(-d / 0.04, 0, 1)[..., None]
    col = (muerto * (1 - mezcla) + vivo * mezcla) * luzd[..., None]
    fuego = np.exp(-(d / 0.05) ** 2) * (rho > 0) * (0.6 + 0.8 * DEAD[(vd + f * 3) % 512, ud])
    em = fuego[..., None] * np.array([1.6, 0.75, 0.2])
    img = np.where(den[..., None], col + em, 0)
    # atmosphere rim, glow and stars
    rim = np.exp(-((np.sqrt(r2) - 1) / 0.03) ** 2) * 0.5
    img += rim[..., None] * np.array([0.3, 0.5, 1.0]) * (mezcla.mean() > 0.3 or t > 3)
    gl = Image.fromarray((np.clip(np.where(den[..., None], em, 0), 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(18))
    img += np.asarray(gl) / 255 * 1.3
    img += STARS * (~den)[..., None]
    if f > NA - 12: img = img * (1 - (f - NA + 12) / 12) + np.array([1, 0.8, 0.5]) * ((f - NA + 12) / 12)
    return img

def vuelo(f):
    t = f / FPS
    N = 1024; hm = np.maximum(ALT, 0.3) * 420; col = tierra(ALT) * np.where(ALT > 0.3, SOMBRA, 1)[..., None]
    vel = 6.0; cx, cy = 300.0, 100 + t * vel * FPS / 3
    ang = 0.25 * np.sin(t * 0.35); alt = 330 + 25 * np.sin(t * 0.5); hor = H * 0.36
    img = np.zeros((H, W, 3))
    yy = np.arange(H)[:, None]
    sky = np.clip((yy / hor), 0, 1)
    img[:] = (np.array([0.05, 0.08, 0.2]) * (1 - sky) + np.array([1.0, 0.6, 0.3]) * sky)[:, :, :] if False else 0
    img[:] = (np.array([0.06, 0.09, 0.22])[None, None] * (1 - sky[..., None]) + np.array([0.95, 0.55, 0.28])[None, None] * sky[..., None])
    ybuf = np.full(W, H)
    sx = np.arange(W) / W - 0.5
    front = 140 + t * 90                                     # the wave of fire, ahead, running away
    zs = np.concatenate([np.arange(1, 200, 1.0), np.arange(200, 900, 3.0)])
    fogc = np.array([0.95, 0.6, 0.35])
    for z in zs:
        px = cx + (np.cos(ang) * sx * 2 * z - np.sin(ang) * z); py = cy + (np.sin(ang) * sx * 2 * z + np.cos(ang) * z)
        ix = px.astype(int) % N; iy = py.astype(int) % N
        fx = (px % 1)[:, None]; fy = (py % 1)[:, None]; ix1 = (ix + 1) % N; iy1 = (iy + 1) % N
        h = (hm[iy, ix] * (1 - fx[:, 0]) + hm[iy, ix1] * fx[:, 0]) * (1 - fy[:, 0]) + (hm[iy1, ix] * (1 - fx[:, 0]) + hm[iy1, ix1] * fx[:, 0]) * fy[:, 0]
        ys = ((alt - h) / z * 240 + hor).astype(int)
        c = (col[iy, ix] * (1 - fx) + col[iy, ix1] * fx) * (1 - fy) + (col[iy1, ix] * (1 - fx) + col[iy1, ix1] * fx) * fy
        if z > front: c = (0.25 + 0.35 * DEAD[iy // 2 % 512, ix // 2 % 512])[:, None] * np.array([0.75, 0.7, 0.68])
        fz = np.exp(-((z - front) / 14) ** 2)
        c = c + fz * np.array([1.8, 0.8, 0.2])
        if abs(z - front) < 1.6:
            # flames: a ragged sheet rising from the ground at the front
            alto = (60 + 50 * DEAD[(ix // 2 + f * 2) % 512, (iy // 2) % 512]) / z * 240
            yf = (ys - alto).astype(int)
            mf = (yy >= yf[None, :]) & (yy < np.minimum(ys, ybuf)[None, :])
            g = np.clip((yy - yf[None, :]) / np.maximum(alto, 1)[None, :], 0, 1)[..., None]
            llama = np.array([1.0, 0.95, 0.6]) * g + np.array([0.9, 0.3, 0.05]) * (1 - g)
            img = np.where(mf[..., None], img * 0.3 + llama * 0.9, img)
        k = min(1, (z / 900) ** 1.4); c = c * (1 - k) + fogc * k
        m = (yy >= ys[None, :]) & (yy < ybuf[None, :])
        img = np.where(m[..., None], c[None, :, :], img)
        ybuf = np.minimum(ybuf, np.maximum(ys, 0))
    if f < 12: img = img * (f / 12) + np.array([1, 0.8, 0.5]) * (1 - f / 12)
    if f > NB - 15: img = img * max(0, (NB - f) / 15)
    return img

def hacer(f):
    img = planeta(f) if f < NA else vuelo(f - NA)
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(OUT / f"{f:04d}.jpg", quality=90)
    return f

if __name__ == "__main__":
    sel = [int(a) for a in sys.argv[1:]] or range(NA + NB)
    with ProcessPoolExecutor() as ex:
        for f in ex.map(hacer, sel): pass
    print("ok", len(list(OUT.glob("*.jpg"))))
