"""Living microcosm: one continuous darkfield-microscopy camera move inside a drop of water.

Time parameterised: frame(i) renders frame i deterministically.  See README.md.
"""
import ctypes
import os
import pickle
import numpy as np
from PIL import Image

import organismos as O

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1920, 1080, 30
DUR = 45.0
NFR = int(round(DUR * FPS))
F = 2200.0                      # focal length in pixels (~47 deg horizontal fov)

# ---- Julia set at the heart of the hero -------------------------------------------------
JULIA_C = (-0.7436, 0.1318)
JULIA_IT = 2500
LEV0 = 0.7      # Green-potential level of the membrane (a near-circular equipotential)
JULIA_RC = 2.0  # complex radius that maps onto the nucleus membrane radius

# ---- palette (linear light) -------------------------------------------------------------
CREAM = np.array([1.00, 0.86, 0.66])
TEAL = np.array([0.36, 0.64, 0.80])
AMBER = np.array([1.00, 0.64, 0.34])
COOL = np.array([0.55, 0.76, 0.95])
BG = np.array([0.0004, 0.0008, 0.0019])
LIGHT = O.unit(np.array([-0.75, 0.50, 0.30]))   # light from the left side, slightly above

# ---- timing -----------------------------------------------------------------------------
# zoom = log-distance from the camera to the hero centre, integrated from a smooth rate profile
RATE_KEYS = [(0, 0.040), (6, 0.044), (14, 0.05), (20, 0.085), (25, 0.17), (30, 0.22), (33, 0.29), (36, 0.32),
             (38.4, 0.26), (40, 0.20), (42, 0.18), (45, 0.16)]
D_END = 0.064                   # final distance -> nucleus (r=0.02) is ~690 px radius, Julia ~60% of width
SHELLS = (1.0, 0.42, 0.18)
R_NUC = 0.02

_tg = np.linspace(0, DUR, 45001)
_kt = np.array([k[0] for k in RATE_KEYS]); _kr = np.array([k[1] for k in RATE_KEYS])


def _rate(t):
    i = np.clip(np.searchsorted(_kt, t) - 1, 0, len(_kt) - 2)
    u = (t - _kt[i]) / (_kt[i + 1] - _kt[i]); u = u * u * (3 - 2 * u)
    return _kr[i] + (_kr[i + 1] - _kr[i]) * u


_r = _rate(_tg)
_cum = np.concatenate([[0], np.cumsum((_r[1:] + _r[:-1]) * 0.5 * np.diff(_tg))])
_logd = np.log(D_END) + (_cum[-1] - _cum)


def dist(t):
    return float(np.exp(np.interp(t, _tg, _logd)))


def time_at(dv):
    return float(np.interp(-np.log(dv), -_logd, _tg))


def sm(a, b, x):
    u = np.clip((x - a) / (b - a), 0, 1)
    return u * u * (3 - 2 * u)


def camera(t):
    d = dist(t)
    k = 1 - sm(3, 30, t)
    return np.array([d * 0.11 * k, -d * 0.035 * k, -d])


# ---- scene construction (deterministic) ---------------------------------------------------
FEATURED = [  # kind, scale, time, screen x, screen y, Z (camera depth at that time)
    ('heliozoan', 0.42, 5.5, 560, 470, 6.8),
    ('centric', 0.55, 10.5, 1390, 650, 6.2),
    ('phaeodarian', 0.62, 14.5, 640, 690, 5.8),
    ('acantharian', 0.55, 18.6, 1420, 390, 5.0),
]
FOCUS_TRACK = [(0.0, 'surface'), (2.6, 0), (8.4, 1), (12.6, 2), (16.8, 3), (20.6, 'hero')]
RACK = 1.6


def build_scene():
    rng = np.random.default_rng(20261024)
    lib = {}
    hero = O.spumellaria(np.random.default_rng(7), 3, hero=True)
    for k, fn in O.KINDS.items():
        lib[k] = [fn(np.random.default_rng(100 + j * 17 + len(k))) for j in range(2)]
    inst = []

    def add(kind, var, scale, pos, vel, ax, om, R0, featured=-1):
        inst.append(dict(kind=kind, var=var, scale=scale, pos=np.asarray(pos, float), vel=np.asarray(vel, float),
                         ax=O.unit(ax), om=om, R0=R0, feat=featured, ph=rng.uniform(0, 100)))

    # featured organisms, positioned so they cross the frame where the focus pulls to them
    for fi, (kind, sc, tf, sx, sy, Z) in enumerate(FEATURED):
        cam = camera(tf)
        vel = rng.normal(0, 0.03, 3) * sc
        if kind == 'centric':
            vel = np.array([-0.05, 0.015, 0]) * sc
        pf = np.array([(sx - W / 2) * Z / F + cam[0], -(sy - H / 2) * Z / F + cam[1], cam[2] + Z])
        R0 = O.rodrigues(rng.normal(size=3), rng.uniform(0, 6))
        if kind == 'centric':
            R0 = O.rodrigues([1, 0.2, 0], 0.75)
        add(kind, 0, sc, pf - vel * tf, vel, rng.normal(size=3), rng.uniform(0.05, 0.12) * rng.choice([-1, 1]), R0, fi)

    kinds = ['spumellaria', 'spumellaria2', 'heliozoan', 'acantharian', 'centric', 'pennate', 'phaeodarian', 'discoid',
             'foram', 'cyrtoid', 'ciliate', 'flagellate', 'centric', 'pennate', 'spumellaria2', 'foram']
    sizes = dict(spumellaria=0.32, spumellaria2=0.3, heliozoan=0.26, acantharian=0.4, centric=0.36, pennate=0.45,
                 phaeodarian=0.42, discoid=0.42, foram=0.38, cyrtoid=0.42, ciliate=0.28, flagellate=0.22)
    d0 = dist(0)
    n = 0
    tries = 0
    while n < 64 and tries < 5000:
        tries += 1
        kind = kinds[n % len(kinds)]
        z = rng.uniform(-d0 + 2.5, 14.0)
        Zc = z + d0
        x = rng.uniform(-1.15, 1.15) * 0.44 * Zc
        y = rng.uniform(-1.15, 1.15) * 0.25 * Zc
        r = np.hypot(x, y)
        sc = sizes[kind] * rng.uniform(0.65, 1.35)
        if -14 < z < 7 and r < 1.0 + 3.2 * sc + (2.8 if z > -5 else 1.2):
            continue  # keep the hero's line of sight clear
        if any(np.linalg.norm(o['pos'] - [x, y, z]) < 2.2 * (o['scale'] + sc) * 1.4 for o in inst):
            continue
        vel = rng.normal(0, 0.035, 3) * sc
        if kind == 'pennate':
            vel = rng.normal(0, 1, 3); vel = vel / np.linalg.norm(vel) * 0.08 * sc
        add(kind, int(rng.integers(0, 2)), sc, [x, y, z], vel, rng.normal(size=3),
            rng.uniform(0.04, 0.16) * rng.choice([-1, 1]), O.rodrigues(rng.normal(size=3), rng.uniform(0, 6)))
        n += 1
    # a distant layer behind the hero: soft, small, gives the drop its depth
    for j in range(36):
        kind = kinds[(j * 5) % len(kinds)]
        z = rng.uniform(4.0, 30.0)
        ang = rng.uniform(0, TAU); rad = rng.uniform(2.5, 0.42 * (z + d0))
        sc = sizes[kind] * rng.uniform(0.8, 1.6)
        add(kind, int(rng.integers(0, 2)), sc, [rad * np.cos(ang), rad * np.sin(ang) * 0.6, z], rng.normal(0, 0.03, 3) * sc,
            rng.normal(size=3), rng.uniform(0.04, 0.12) * rng.choice([-1, 1]), O.rodrigues(rng.normal(size=3), rng.uniform(0, 6)))
    # a few companions near the hero, visible during the approach (outside its line of sight)
    for j, (kind, ang, rad, z, sc) in enumerate([('heliozoan', 2.6, 4.2, -1.2, 0.3), ('centric', 0.5, 4.6, 1.0, 0.45),
                                                   ('foram', 4.1, 4.0, 0.3, 0.42), ('cyrtoid', 5.4, 3.7, -2.0, 0.38),
                                                   ('ciliate', 1.4, 3.4, -3.0, 0.24), ('pennate', 3.4, 3.2, -2.6, 0.35)]):
        add(kind, j % 2, sc, [rad * np.cos(ang), rad * np.sin(ang), z], rng.normal(0, 0.03, 3) * sc, rng.normal(size=3),
            rng.uniform(0.05, 0.12), O.rodrigues(rng.normal(size=3), rng.uniform(0, 6)))

    # suspended particles at several scales (so the zoom always has grain around it)
    parts = []
    for N, box, rmed, ctr in ((7500, (15, 9, -d0 - 1, 15), 0.010, None), (3500, (3.2,), 0.0028, 0), (2600, (0.85,), 0.0009, 0),
                               (1800, (0.34,), 0.00035, 0), (700, (0.018,), 0.00012, 0)):
        if ctr is None:
            P = np.c_[rng.uniform(-box[0], box[0], N), rng.uniform(-box[1], box[1], N), rng.uniform(box[2], box[3], N)]
        else:
            P = O.unit(rng.normal(size=(N, 3))) * box[0] * rng.uniform(0, 1, (N, 1)) ** (1 / 3)
        r = rmed * np.exp(rng.normal(0, 0.5, N))
        parts.append(np.c_[P, r, rng.uniform(0, TAU, (N, 3)), rng.uniform(0.3, 1.2, N), rng.uniform(0, 1, N),
                           np.full(N, len(parts))])
    parts = np.concatenate(parts)
    return dict(hero=hero, lib=lib, inst=inst, parts=parts)


TAU = 2 * np.pi
_SCENE = None
_LIB = None


def scene():
    global _SCENE
    if _SCENE is None:
        path = os.environ.get('MICRO_CACHE', '/tmp/microcosmos_scene.pkl')
        if os.path.exists(path):
            with open(path, 'rb') as f:
                _SCENE = pickle.load(f)
        else:
            _SCENE = build_scene()
            with open(path + '.tmp', 'wb') as f:
                pickle.dump(_SCENE, f)
            os.replace(path + '.tmp', path)
    return _SCENE


def clib():
    global _LIB
    if _LIB is None:
        _LIB = ctypes.CDLL(os.path.join(HERE, 'librender.so'))
        fp = ctypes.POINTER(ctypes.c_float)
        _LIB.render.argtypes = [ctypes.c_int, ctypes.c_int, fp, ctypes.c_int, fp, ctypes.c_int, fp, ctypes.c_int, fp]
        _LIB.blur_rgb.argtypes = [fp, ctypes.c_int, ctypes.c_int, ctypes.c_float]
        _LIB.julia.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_float, ctypes.c_float, ctypes.c_double, ctypes.c_double,
                               ctypes.c_double, ctypes.c_double, ctypes.c_int, ctypes.c_float, ctypes.c_float, ctypes.c_float, ctypes.c_float,
                               ctypes.c_float, ctypes.c_float, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, fp]
    return _LIB


def fptr(a):
    return a.ctypes.data_as(ctypes.POINTER(ctypes.c_float))


# ---- hero motion and focus ----------------------------------------------------------------
def hero_rot(t):
    spin = 0.045 * (t - DUR)                       # spin about the view axis, 0 at the last frame
    wob = 0.22 * np.sin(0.21 * t + 0.4) * (1 - sm(16, 30, t))
    return O.rodrigues([0, 0, 1], spin) @ O.rodrigues([1, 0.35, 0], wob), spin


def inst_pose(o, t):
    w = o['ph']
    wander = 0.06 * o['scale'] * np.array([np.sin(0.23 * t + w), np.sin(0.19 * t + 2 * w), np.sin(0.17 * t + 3 * w)])
    pos = o['pos'] + o['vel'] * t + wander
    R = O.rodrigues(o['ax'], o['om'] * t + w) @ o['R0']
    return pos, R


def focus_target(t, cam):
    d = dist(t)
    S = scene()

    def zof(tag):
        if tag == 'surface':
            return 0.25
        if tag == 'hero':
            # optical section through the equator while approaching; then the pore on the axis of each
            # shell stays sharp until it frames the view, and focus racks to the next shell as we cross it
            lr = np.log(d)
            pts = [(4.0, 0.0), (2.6, 0.25), (2.0, 1.0), (1.3, 1.0), (1.05, 0.42), (0.56, 0.42), (0.45, 0.18),
                   (0.245, 0.18), (0.19, 0.0), (0.01, 0.0)]
            xs = [np.log(p[0]) for p in pts][::-1]; ys = [p[1] for p in pts][::-1]
            rho = float(np.interp(lr, xs, ys))
            return max(d - rho * 0.99, 0.03 * d)
        o = [x for x in S['inst'] if x['feat'] == tag][0]
        pos, _ = inst_pose(o, t)
        return max(pos[2] - cam[2], 0.05)
    cur = FOCUS_TRACK[0][1]; z = np.log(zof(cur))
    for tk, tag in FOCUS_TRACK[1:]:
        u = sm(tk - RACK / 2, tk + RACK / 2, t)
        if u <= 0:
            break
        z = z * (1 - u) + np.log(zof(tag)) * u
    return float(np.exp(z))


# ---- emission -----------------------------------------------------------------------------
class Batch:
    def __init__(self):
        self.S, self.P, self.H = [], [], []


def light_color(Nw, kind, V, mat, br, phase):
    """Darkfield lighting: fresnel rim on surfaces, oblique side light, thin-film iridescence."""
    if len(Nw) == 0:
        return np.zeros((0, 3))
    ndv = np.abs(np.einsum('ij,ij->i', Nw, V))
    side = Nw @ LIGHT
    surf = kind == 0
    fres = np.where(surf, 0.34 + 0.66 * (1 - ndv) ** 2.4, 0.75 + 0.25 * np.sqrt(np.clip(1 - side ** 2, 0, 1)))
    side_s = np.where(surf, side, np.sqrt(np.clip(1 - side ** 2, 0, 1)) * 0.6 - 0.1)
    warm = np.clip(0.45 + 0.65 * side_s, 0, 1)[:, None]
    col = TEAL * (1 - warm) + CREAM * warm
    irid = 1 + 0.10 * np.cos(TAU * (2.4 * (1 - ndv)[:, None] + phase[:, None] + np.array([0, 0.33, 0.67])))
    col = col * irid
    col = np.where((mat == 1)[:, None], AMBER, col)
    col = np.where((mat == 2)[:, None], COOL, col)
    b = br * fres * (0.55 + 0.6 * np.clip(side_s, -0.3, 1))
    return col * b[:, None]


def project(P, cam):
    X = P - cam
    Z = X[:, 2]
    return X, Z


class Ctx:
    def __init__(self, t):
        self.t = t
        self.cam = camera(t)
        self.d = dist(t)
        self.zf = focus_target(t, self.cam)
        self.K = 24.0 - 9.0 * sm(27, 32, t) - 3.0 * sm(38, 41, t)
        self.znear = 0.02 * self.d
        self.gain = 1.0

    def coc(self, Z):
        c = self.K * np.abs(1 - self.zf / np.maximum(Z, 1e-6))
        return c


def emit_segments(ctx, B, A, Bp, w0, w1, col, extra_dim=1.0):
    """A,Bp world endpoints; w world widths; col (n,3) intensity."""
    if len(A) == 0:
        return
    cam = ctx.cam
    XA = A - cam; XB = Bp - cam
    za, zb = XA[:, 2], XB[:, 2]
    zn = ctx.znear
    keep = (za > zn) | (zb > zn)
    XA, XB, w0, w1, col = XA[keep], XB[keep], w0[keep], w1[keep], col[keep]
    za, zb = XA[:, 2], XB[:, 2]
    # clip to the near plane
    ca = za < zn
    if ca.any():
        u = ((zn - za[ca]) / (zb[ca] - za[ca]))[:, None]
        XA[ca] = XA[ca] + (XB[ca] - XA[ca]) * u
    cb = zb < zn
    if cb.any():
        u = ((zn - zb[cb]) / (za[cb] - zb[cb]))[:, None]
        XB[cb] = XB[cb] + (XA[cb] - XB[cb]) * u
    za, zb = XA[:, 2], XB[:, 2]
    xa = W / 2 + F * XA[:, 0] / za; ya = H / 2 - F * XA[:, 1] / za
    xb = W / 2 + F * XB[:, 0] / zb; yb = H / 2 - F * XB[:, 1] / zb
    zm = 0.5 * (za + zb)
    coc = ctx.coc(zm)
    pw0 = np.minimum(F * w0 / za, 600); pw1 = np.minimum(F * w1 / zb, 600)
    dim = np.where(coc > 64, (64 / np.maximum(coc, 1e-3)) ** 2, 1.0)
    coc = np.minimum(coc, 64)
    # fog: far beyond focus slowly dims (water scattering)
    att = 1 / (1 + (zm / (4.0 * ctx.zf + 2.5 * ctx.d)) ** 2) * np.clip(zm / (0.35 * ctx.zf), 0, 1) ** 2
    c = col * (dim * att * extra_dim)[:, None]
    m = 3000
    vis = (np.maximum(xa, xb) > -m) & (np.minimum(xa, xb) < W + m) & (np.maximum(ya, yb) > -m) & (np.minimum(ya, yb) < H + m)
    vis &= (np.maximum(xa, xb) > -3 * coc - pw0) & (np.minimum(xa, xb) < W + 3 * coc + pw0)
    vis &= (np.maximum(ya, yb) > -3 * coc - pw0) & (np.minimum(ya, yb) < H + 3 * coc + pw0)
    vis &= c.max(1) > 2e-4
    # Liang-Barsky clip to a generous screen box (clamping coordinates would bend the lines)
    dx, dy = xb - xa, yb - ya
    t0 = np.zeros_like(xa); t1 = np.ones_like(xa)
    for p, q in ((-dx, xa + m), (dx, W + m - xa), (-dy, ya + m), (dy, H + m - ya)):
        with np.errstate(divide='ignore', invalid='ignore'):
            r = q / p
        neg = p < 0; pos = p > 0
        t0 = np.where(neg, np.maximum(t0, r), t0)
        t1 = np.where(pos, np.minimum(t1, r), t1)
        vis &= ~((p == 0) & (q < 0))
    vis &= t0 <= t1
    nxa, nya = xa + dx * t0, ya + dy * t0
    nxb, nyb = xa + dx * t1, ya + dy * t1
    nw0 = pw0 + (pw1 - pw0) * t0; nw1 = pw0 + (pw1 - pw0) * t1
    rec = np.c_[nxa, nya, nxb, nyb, nw0, nw1, c, c, coc][vis]
    B.S.append(rec.astype(np.float32))


def emit_points(ctx, B, P, r, col):
    if len(P) == 0:
        return
    X = P - ctx.cam
    Z = X[:, 2]
    k = Z > ctx.znear
    X, Z, r, col = X[k], Z[k], r[k], col[k]
    x = W / 2 + F * X[:, 0] / Z; y = H / 2 - F * X[:, 1] / Z
    coc = ctx.coc(Z)
    dim = np.where(coc > 64, (64 / np.maximum(coc, 1e-3)) ** 2, 1.0)
    coc = np.minimum(coc, 64)
    att = 1 / (1 + (Z / (4.0 * ctx.zf + 2.5 * ctx.d)) ** 2) * np.clip(Z / (0.35 * ctx.zf), 0, 1) ** 2
    pr = F * r / Z
    c = col * (dim * att)[:, None]
    pad = 3 * coc + 3 * pr + 2
    vis = (x > -pad) & (x < W + pad) & (y > -pad) & (y < H + pad) & (c.max(1) * np.maximum(pr, 0.6) ** 2 > 1e-4)
    B.P.append(np.c_[x, y, pr, c, coc][vis].astype(np.float32))


def emit_spheres(ctx, B, C, R, rim, fill, col):
    if len(C) == 0:
        return
    X = C - ctx.cam
    Z = X[:, 2]
    dcam = np.linalg.norm(X, axis=1)
    k = (Z > ctx.znear) & (dcam > R * 1.05)
    if not k.any():
        return
    X, Z, R, rim, fill, col, dcam = X[k], Z[k], R[k], rim[k], fill[k], col[k], dcam[k]
    x = W / 2 + F * X[:, 0] / Z; y = H / 2 - F * X[:, 1] / Z
    pr = F * R / np.sqrt(np.maximum(dcam ** 2 - R ** 2, 1e-12))
    near = sm(1.05, 1.6, dcam / R)               # fade out as the camera enters the membrane
    coc = ctx.coc(Z)
    dim = np.where(coc > 64, (64 / np.maximum(coc, 1e-3)) ** 2, 1.0)
    coc = np.minimum(coc, 64)
    att = 1 / (1 + (Z / (4.0 * ctx.zf + 2.5 * ctx.d)) ** 2) * np.clip(Z / (0.35 * ctx.zf), 0, 1) ** 2
    c = col * (near * dim * att)[:, None]
    vis = (x + pr > -3 * coc) & (x - pr < W + 3 * coc) & (y + pr > -3 * coc) & (y - pr < H + 3 * coc) & (pr < 5000)
    B.H.append(np.c_[x, y, pr, rim, fill, c, coc][vis].astype(np.float32))


def emit_org(ctx, B, g, pos, R, sc, t, phase0=0.0, br=1.0, skip_spheres=False):
    # cull with the bounding sphere
    X = pos - ctx.cam
    if X[2] + g.radius * sc < ctx.znear:
        return
    if X[2] > 0:
        rpx = F * g.radius * sc / max(X[2], 1e-6)
        sx = W / 2 + F * X[0] / X[2]; sy = H / 2 - F * X[1] / X[2]
        c = min(float(ctx.coc(X[2])), 64)
        if sx + rpx < -3 * c or sx - rpx > W + 3 * c or sy + rpx < -3 * c or sy - rpx > H + 3 * c:
            return
    S = g.S
    if len(S['A']):
        A = pos + sc * S['A'] @ R.T; Bp = pos + sc * S['B'] @ R.T
        Nw = S['N'] @ R.T
        mid = 0.5 * (A + Bp)
        V = O.unit(mid - ctx.cam)
        ph = phase0 + 0.13 * np.arange(len(A)) % 1.0 * 0.0 + 0.6 * (mid @ np.array([0.3, 0.5, 0.2])) / max(sc, 1e-3)
        col = light_color(Nw, S['K'], V, S['M'], S['Br'] * br, ph)
        emit_segments(ctx, B, A, Bp, S['w0'] * sc, S['w1'] * sc, col)
    P = g.P
    if len(P['P']):
        Pw = pos + sc * P['P'] @ R.T
        cc = np.where((P['M'] == 1)[:, None], AMBER * 0.9, CREAM * 0.85 + TEAL * 0.15)
        emit_points(ctx, B, Pw, P['R'] * sc, cc * (P['Br'] * br)[:, None])
    Hh = g.H
    if len(Hh['C']) and not skip_spheres:
        Cw = pos + sc * Hh['C'] @ R.T
        cc = np.stack([[TEAL * 0.7 + CREAM * 0.3, AMBER, COOL][m] for m in Hh['M']])
        emit_spheres(ctx, B, Cw, Hh['R'] * sc, Hh['Rim'], Hh['Fill'], cc * br)
    # axopods: thin radial filaments, gently waving, beads streaming along them
    if g.AX is not None:
        ax = g.AX
        ns = 7
        s = np.linspace(0, 1, ns + 1)
        L = ax['L'][:, None]
        wv = (np.sin(TAU * ax['fr'][:, None] * t + ax['ph'][:, None] - 3.0 * s[None]) * 0.8)
        wv2 = (np.cos(TAU * ax['fr'][:, None] * 0.7 * t + 1.3 * ax['ph'][:, None] - 2.4 * s[None]) * 0.6)
        amp = (ax['amp'][:, None] * L * s[None] ** 1.6)
        Pl = (ax['base'][:, None, :] + ax['dir'][:, None, :] * (L * s[None])[..., None] +
              ax['u'][:, None, :] * (amp * wv)[..., None] + ax['v'][:, None, :] * (amp * wv2)[..., None])
        Pw = pos + sc * Pl.reshape(-1, 3) @ R.T
        Pw = Pw.reshape(len(L), ns + 1, 3)
        A = Pw[:, :-1].reshape(-1, 3); Bp = Pw[:, 1:].reshape(-1, 3)
        wl = (ax['w'][:, None] * np.linspace(1.0, 0.25, ns + 1)[None]) * sc
        w0 = wl[:, :-1].reshape(-1); w1 = wl[:, 1:].reshape(-1)
        dirs = O.unit(Bp - A + 1e-12)
        V = O.unit(0.5 * (A + Bp) - ctx.cam)
        brs = np.repeat(ax['br'], ns) * br * np.tile(np.linspace(1.0, 0.45, ns), len(L))
        col = light_color(dirs, np.ones(len(A), np.int8), V, np.zeros(len(A), np.int8), brs, np.zeros(len(A)))
        emit_segments(ctx, B, A, Bp, w0, w1, col)
        # beads (extrusomes) travelling along each axopod
        nb = int(ax['nb'][0])
        if nb > 0:
            k = np.arange(nb)
            sp = (ax['ph'][:, None] / TAU + k[None] / nb + 0.035 * t * np.where(np.arange(len(L)) % 2, 1, -1)[:, None]) % 1.0
            sp = 0.12 + 0.8 * sp
            fi = sp * ns; i0 = np.minimum(fi.astype(int), ns - 1); fr = (fi - i0)[..., None]
            rows = np.arange(len(L))[:, None]
            Pb = Pw[rows, i0] * (1 - fr) + Pw[rows, i0 + 1] * fr
            rb = (ax['w'][:, None] * 1.6 * sc) * np.ones_like(sp)
            cb = np.repeat((CREAM * 0.9)[None], Pb.reshape(-1, 3).shape[0], 0) * (np.repeat(ax['br'], nb) * br * 0.9)[:, None]
            emit_points(ctx, B, Pb.reshape(-1, 3), rb.reshape(-1), cb)
    if g.CI is not None:
        ci = g.CI
        x = TAU * ci['fr'] * t + ci['ph']
        th = 0.85 * np.sin(x) + 0.3 * np.sin(2 * x)
        segs = []
        p = ci['base'].copy()
        for j in range(3):
            a = th * (0.6 + 0.4 * j)
            d = ci['n'] * np.cos(a)[:, None] + ci['tg'] * np.sin(a)[:, None]
            q = p + d * (ci['L'] / 3)[:, None]
            segs.append((p, q)); p = q
        A = np.concatenate([s[0] for s in segs]); Bq = np.concatenate([s[1] for s in segs])
        A = pos + sc * A @ R.T; Bq = pos + sc * Bq @ R.T
        w = np.tile(ci['w'], 3) * sc
        V = O.unit(0.5 * (A + Bq) - ctx.cam)
        col = light_color(O.unit(Bq - A + 1e-12), np.ones(len(A), np.int8), V, np.zeros(len(A), np.int8),
                          np.tile(ci['br'], 3) * br, np.zeros(len(A)))
        emit_segments(ctx, B, A, Bq, w, w * 0.6, col)
    if g.FL is not None:
        fl = g.FL
        ns = 16
        s = np.linspace(0, 1, ns + 1)
        Pl = (fl['base'][:, None] + fl['d'][:, None] * (fl['L'][:, None] * s)[..., None] +
              fl['s'][:, None] * (0.13 * fl['L'][:, None] * s ** 0.8 * np.sin(TAU * fl['fr'][:, None] * t - 9 * s + fl['ph'][:, None]))[..., None])
        Pw = (pos + sc * Pl.reshape(-1, 3) @ R.T).reshape(len(fl['L']), ns + 1, 3)
        A = Pw[:, :-1].reshape(-1, 3); Bq = Pw[:, 1:].reshape(-1, 3)
        w = np.repeat(fl['w'], ns) * sc
        V = O.unit(0.5 * (A + Bq) - ctx.cam)
        col = light_color(O.unit(Bq - A + 1e-12), np.ones(len(A), np.int8), V, np.zeros(len(A), np.int8),
                          np.repeat(fl['br'], ns) * br, np.zeros(len(A)))
        emit_segments(ctx, B, A, Bq, w, w * 0.5, col)


# ---- screen-space layers --------------------------------------------------------------------
_GRID = None


def grid():
    global _GRID
    if _GRID is None:
        y, x = np.mgrid[0:H, 0:W].astype(np.float32)
        _GRID = (x, y)
    return _GRID


def shafts(t):
    """Faint volumetric light shafts entering from the upper left (darkfield illumination cone)."""
    x, y = grid()
    ang = np.radians(-32)
    n = np.array([np.cos(ang), np.sin(ang)])
    u = (x - W * 0.1) * n[0] + (y + H * 0.2) * n[1]
    along = (x - W * 0.1) * -n[1] + (y + H * 0.2) * n[0]
    acc = np.zeros_like(x)
    for k, (o, w, a) in enumerate(((180, 160, 1.0), (520, 90, 0.6), (820, 220, 0.8), (1150, 120, 0.5))):
        oo = o + 40 * np.sin(0.13 * t + k * 1.7)
        acc += a * np.exp(-((u - oo) / w) ** 2)
    acc *= np.exp(-np.maximum(along, 0) / 1700.0)
    return acc


def julia_layer(ctx, t, spin):
    """The hero's nucleus: a glowing membrane whose silhouette morphs into the filled Julia set."""
    X = np.array([0.0, 0, 0]) - ctx.cam
    Z = X[2]
    rpx = F * R_NUC / Z
    if rpx < 2.0:
        return None
    cx = W / 2 + F * X[0] / Z; cy = H / 2 - F * X[1] / Z
    # circle -> smooth equipotential of the Julia set -> the boundary itself (level shrinks to 0)
    m = float(sm(38.0, 39.8, t))
    u = float(sm(39.8, 44.6, t))
    lev = np.log(LEV0) * np.exp(u * np.log(1800.0 / -np.log(LEV0)))
    gw = 1.8 - 1.3 * sm(40, 44.5, t)
    ext = rpx * 1.12 + 20 * gw + 4
    bx0, by0, bx1, by1 = int(cx - ext), int(cy - ext), int(cx + ext), int(cy + ext)
    if bx1 < 0 or by1 < 0 or bx0 >= W or by0 >= H:
        return None
    out = np.zeros((H, W, 2), np.float32)
    clib().julia(W, H, cx, cy, JULIA_RC / rpx, -spin, JULIA_C[0], JULIA_C[1], JULIA_IT, m, JULIA_RC, lev, gw, 0.035 * (1 - m), 0.9 * t,
                 bx0, by0, bx1, by1, fptr(out))
    e, f = out[..., 0], out[..., 1]
    glow = 0.35 + 0.65 * sm(36.5, 42, t)
    fin = float(sm(41.5, 44.4, t))
    # boundary: cream light; inside: amber protoplasm whose orbit-trap texture becomes the filled set
    img = e[..., None] * (CREAM * (0.50 + 0.15 * fin)) + (f * (0.035 + 0.20 * fin))[..., None] * (AMBER * (1 - fin) * 0.6 + CREAM * (0.4 + 0.6 * fin) * np.array([1.0, 0.93, 0.82]))
    img = (img * glow).astype(np.float32)
    halo = img.copy()
    clib().blur_rgb(fptr(halo), W, H, 7.0)
    img = img + halo * (TEAL / CREAM) * 0.16
    coc = float(min(ctx.coc(Z), 64))
    img = np.ascontiguousarray(img, dtype=np.float32)
    if coc > 0.6:
        clib().blur_rgb(fptr(img), W, H, coc)
    return img


def drop_surface(t):
    """Opening: we have just crossed the surface of the drop; a refracted ring of light leaves the frame."""
    if t > 3.2:
        return None
    x, y = grid()
    r = np.hypot(x - W * 0.52, y - H * 0.47)
    veil = (1 - sm(0, 2.8, t)) ** 2
    out = np.zeros((H, W, 3), np.float32)
    out += (veil * 0.05) * (CREAM * 0.85 + TEAL * 0.15) * np.exp(-(r / 1400.0) ** 2)[..., None]
    u = sm(0, 2.6, t)
    R0 = 260 + 1500 * u ** 1.3
    wid = 60 + 140 * u
    a = 0.17 * (1 - u) ** 1.5
    for ch, dr in enumerate((7, 0, -7)):
        out[..., ch] += a * np.exp(-((r - R0 - dr) / wid) ** 2) * (CREAM[ch] * 0.9 + 0.1)
    return out


# ---- frame ----------------------------------------------------------------------------------
def frame(i, out_path=None, scale=1.0):
    t = i / FPS
    S = scene()
    ctx = Ctx(t)
    B = Batch()
    # crowd
    for o in S['inst']:
        pos, R = inst_pose(o, t)
        g = S['lib'][o['kind']][o['var']]
        emit_org(ctx, B, g, pos, R, o['scale'], t + o['ph'], phase0=o['ph'] % 1.0)
    # hero
    Rh, spin = hero_rot(t)
    emit_org(ctx, B, S['hero'], np.zeros(3), Rh, 1.0, t, phase0=0.2, br=1.0 - 0.45 * sm(37.5, 41.0, t) - 0.3 * sm(40.5, 43.0, t))
    # particles: Brownian jitter plus slow drift
    pa = S['parts']
    P = pa[:, :3]; r = pa[:, 3]; ph = pa[:, 4:7]; fq = pa[:, 7]; tint = pa[:, 8]
    jig = (r[:, None] * np.where(r > 0.005, 6.0, 3.0)[:, None]) * np.sin(fq[:, None] * np.array([1.3, 1.1, 0.9]) * t + ph)
    drift = np.c_[0.8 * r * t, 0.5 * r * t, np.zeros(len(r))] * (r > 0.005)[:, None]
    Pw = P + jig + drift
    inside = np.linalg.norm(Pw, axis=1) < 1.0
    col = np.where(tint[:, None] < 0.75, CREAM * 0.55 + TEAL * 0.45, CREAM)
    col = np.where(inside[:, None], AMBER * 0.8 + CREAM * 0.2, col) * 0.42
    col = col * np.where(pa[:, 9] == 4, 1 - sm(40.0, 42.0, t), 1.0)[:, None]   # nucleus granules dissolve
    emit_points(ctx, B, Pw, r, col)

    segs = np.concatenate(B.S) if B.S else np.zeros((0, 13), np.float32)
    pts = np.concatenate(B.P) if B.P else np.zeros((0, 7), np.float32)
    sph = np.concatenate(B.H) if B.H else np.zeros((0, 9), np.float32)
    segs = np.ascontiguousarray(segs, np.float32); pts = np.ascontiguousarray(pts, np.float32)
    sph = np.ascontiguousarray(sph, np.float32)
    img = np.zeros((H, W, 3), np.float32)
    clib().render(W, H, fptr(segs), len(segs), fptr(pts), len(pts), fptr(sph), len(sph), fptr(img))

    fade = (1 - sm(41.0, 44.6, t)) * (0.7 + 0.3 * sm(0.0, 3.5, t))   # opening: soft; end: all but the Julia fades
    img *= 0.55 * fade
    # light shafts and particles catch the side light
    sh = shafts(t)
    img += (sh[..., None] * (0.006 * fade) * (TEAL * 0.8 + CREAM * 0.2)).astype(np.float32)
    jl = julia_layer(ctx, t, spin)
    if jl is not None:
        img += jl
    ds = drop_surface(t)
    if ds is not None:
        img += ds
    return post(img, i, t, out_path, scale)


def post(img, i, t, out_path, scale):
    lib = clib()
    # bloom (two radii), computed at quarter resolution
    q = np.ascontiguousarray(img.reshape(H // 4, 4, W // 4, 4, 3).mean(axis=(1, 3)), np.float32)
    b1 = q.copy(); lib.blur_rgb(fptr(b1), W // 4, H // 4, 3.0)
    b2 = q.copy(); lib.blur_rgb(fptr(b2), W // 4, H // 4, 14.0)
    bl = 0.22 * b1 + 0.18 * b2
    bl = np.asarray(Image.fromarray(bl[..., 0]).resize((W, H), Image.BILINEAR)), \
        np.asarray(Image.fromarray(bl[..., 1]).resize((W, H), Image.BILINEAR)), \
        np.asarray(Image.fromarray(bl[..., 2]).resize((W, H), Image.BILINEAR))
    img = img + np.stack(bl, -1)
    img += BG.astype(np.float32)
    # radial chromatic aberration: red slightly larger, blue slightly smaller
    ca = 0.0016
    ch = []
    for k, s in ((0, 1 + ca), (1, 1.0), (2, 1 - ca)):
        c = img[..., k]
        if s != 1.0:
            im = Image.fromarray(c)
            nw, nh = int(round(W * s)), int(round(H * s))
            im = im.resize((nw, nh), Image.BICUBIC)
            a = np.asarray(im)
            if s > 1:
                ox, oy = (nw - W) // 2, (nh - H) // 2
                a = a[oy:oy + H, ox:ox + W]
            else:
                pad = np.full((H, W), float(BG[k]), np.float32)
                ox, oy = (W - nw) // 2, (H - nh) // 2
                pad[oy:oy + nh, ox:ox + nw] = a
                a = pad
            c = a
        ch.append(c)
    img = np.stack(ch, -1)
    # vignette
    x, y = grid()
    rr = ((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2
    img = img * (1 - 0.28 * np.clip(rr / 2, 0, 1) ** 1.2)[..., None]
    # filmic tone curve, gentle cool shadows / warm highlights
    expo = 1.25
    tm = 1 - np.exp(-img * expo)
    tm = np.clip(tm, 0, 1) ** (1 / 2.2)
    rng = np.random.default_rng(1000 + i)
    gr = rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
    gr = np.repeat(np.repeat(gr, 2, 0), 2, 1) * 0.6 + rng.normal(0, 1, (H, W)).astype(np.float32) * 0.4
    tm = tm + (gr * 0.010)[..., None] * (0.6 + 0.4 * (1 - tm))
    out = np.clip(tm * 255 + 0.5, 0, 255).astype(np.uint8)
    im = Image.fromarray(out)
    if scale != 1.0:
        im = im.resize((int(W * scale), int(H * scale)), Image.LANCZOS)
    if out_path:
        im.save(out_path, quality=93)
    return im


if __name__ == '__main__':
    import sys
    for v in (1.6, 1.0, 0.62, 0.42, 0.27, 0.18, 0.2):
        print('d=%.3f at t=%.2f' % (v, time_at(v)))
    print('d0', dist(0), 'd(20)', dist(20), 'd(32)', dist(32))
