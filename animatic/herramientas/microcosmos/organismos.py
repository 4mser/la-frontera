"""Procedural Haeckel-like organisms (local coordinates, unit-ish size).

Every organism is a Geo: static glass/organic primitives plus dynamic parts (axopods, cilia,
flagella) that are evaluated per frame.  All randomness comes from the rng passed in, so the
whole library is deterministic.

Segment kinds:  0 = surface bar (normal given -> fresnel rim lighting)
                1 = tube / spine (axis given)
Materials:      0 = silica glass (cream/teal, iridescent), 1 = protoplasm (amber), 2 = cool membrane
"""
import numpy as np

TAU = 2 * np.pi


class Geo:
    def __init__(self):
        self.sA, self.sB, self.sw0, self.sw1, self.sN, self.sK, self.sBr, self.sM = ([] for _ in range(8))
        self.pP, self.pR, self.pBr, self.pM = [], [], [], []
        self.hC, self.hR, self.hRim, self.hFill, self.hM = [], [], [], [], []
        self.axo = []   # (base, dir, length, width, amp, phase, freq, nbeads, br)
        self.cil = []   # (base, normal, tangent, length, width, phase, freq, br)
        self.flag = []  # (base, dir, side, length, width, phase, freq, br)
        self.radius = 1.0

    # --- static primitives -------------------------------------------------------------
    def seg(self, a, b, w0, w1, n, kind, br, mat=0):
        a = np.atleast_2d(np.asarray(a, float)); b = np.atleast_2d(np.asarray(b, float))
        m = len(a)
        self.sA.append(a); self.sB.append(b)
        self.sw0.append(np.broadcast_to(np.asarray(w0, float), (m,)).copy())
        self.sw1.append(np.broadcast_to(np.asarray(w1, float), (m,)).copy())
        self.sN.append(np.broadcast_to(np.asarray(n, float), (m, 3)).copy())
        self.sK.append(np.full(m, kind, np.int8))
        self.sBr.append(np.broadcast_to(np.asarray(br, float), (m,)).copy())
        self.sM.append(np.full(m, mat, np.int8))

    def pts(self, p, r, br, mat=0):
        p = np.atleast_2d(np.asarray(p, float)); m = len(p)
        self.pP.append(p)
        self.pR.append(np.broadcast_to(np.asarray(r, float), (m,)).copy())
        self.pBr.append(np.broadcast_to(np.asarray(br, float), (m,)).copy())
        self.pM.append(np.full(m, mat, np.int8))

    def sph(self, c, r, rim, fill, mat=1):
        self.hC.append(np.asarray(c, float)); self.hR.append(r); self.hRim.append(rim); self.hFill.append(fill); self.hM.append(mat)

    def done(self):
        cat = lambda L, d: (np.concatenate(L) if L else np.zeros(d))
        self.S = dict(A=cat(self.sA, (0, 3)), B=cat(self.sB, (0, 3)), w0=cat(self.sw0, (0,)), w1=cat(self.sw1, (0,)),
                      N=cat(self.sN, (0, 3)), K=cat(self.sK, (0,)), Br=cat(self.sBr, (0,)), M=cat(self.sM, (0,)))
        self.P = dict(P=cat(self.pP, (0, 3)), R=cat(self.pR, (0,)), Br=cat(self.pBr, (0,)), M=cat(self.pM, (0,)))
        self.H = dict(C=np.array(self.hC).reshape(-1, 3), R=np.array(self.hR, float), Rim=np.array(self.hRim, float),
                      Fill=np.array(self.hFill, float), M=np.array(self.hM, int))
        # vectorised dynamic parts
        if self.axo:
            a = self.axo
            self.AX = dict(base=np.array([x[0] for x in a]), dir=np.array([x[1] for x in a]), L=np.array([x[2] for x in a]),
                           w=np.array([x[3] for x in a]), amp=np.array([x[4] for x in a]), ph=np.array([x[5] for x in a]),
                           fr=np.array([x[6] for x in a]), nb=np.array([x[7] for x in a]), br=np.array([x[8] for x in a]))
            d = self.AX['dir']
            t = np.cross(d, np.where(np.abs(d[:, 2:3]) < 0.9, [[0, 0, 1.0]], [[1.0, 0, 0]]))
            t /= np.linalg.norm(t, axis=1, keepdims=True)
            self.AX['u'] = t; self.AX['v'] = np.cross(d, t)
        else:
            self.AX = None
        self.CI = None
        if self.cil:
            c = self.cil
            self.CI = dict(base=np.array([x[0] for x in c]), n=np.array([x[1] for x in c]), tg=np.array([x[2] for x in c]),
                           L=np.array([x[3] for x in c]), w=np.array([x[4] for x in c]), ph=np.array([x[5] for x in c]),
                           fr=np.array([x[6] for x in c]), br=np.array([x[7] for x in c]))
        self.FL = None
        if self.flag:
            c = self.flag
            self.FL = dict(base=np.array([x[0] for x in c]), d=np.array([x[1] for x in c]), s=np.array([x[2] for x in c]),
                           L=np.array([x[3] for x in c]), w=np.array([x[4] for x in c]), ph=np.array([x[5] for x in c]),
                           fr=np.array([x[6] for x in c]), br=np.array([x[7] for x in c]))
        return self


# ---------------------------------------------------------------------------------------
def unit(v):
    v = np.asarray(v, float)
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


def icosphere(freq):
    """Class-I geodesic subdivision of the icosahedron. Returns unit vertices, triangles."""
    p = (1 + 5 ** 0.5) / 2
    V = np.array([[-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0], [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p],
                  [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1]], float)
    V = unit(V)
    # rotate so that vertex 0 points to -z (towards the camera)
    a = V[0]; b = np.array([0, 0, -1.0])
    V = V @ rot_between(a, b).T
    F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6],
         [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10],
         [8, 6, 7], [9, 8, 1]]
    verts, index, tris = [], {}, []

    def vid(x):
        k = tuple(np.round(x, 6))
        if k not in index:
            index[k] = len(verts); verts.append(x)
        return index[k]
    for (i, j, k) in F:
        A, B, C = V[i], V[j], V[k]
        grid = {}
        for u in range(freq + 1):
            for v in range(freq + 1 - u):
                w = freq - u - v
                x = unit((A * u + B * v + C * w) / freq)
                grid[(u, v)] = vid(x)
        for u in range(freq):
            for v in range(freq - u):
                tris.append((grid[(u, v)], grid[(u + 1, v)], grid[(u, v + 1)]))
                if u + v < freq - 1:
                    tris.append((grid[(u + 1, v)], grid[(u + 1, v + 1)], grid[(u, v + 1)]))
    return np.array(verts), np.array(tris)


def rot_between(a, b):
    a = unit(a); b = unit(b); v = np.cross(a, b); c = float(np.dot(a, b))
    if c < -0.999999:
        ax = unit(np.cross(a, [1, 0, 0]) if abs(a[0]) < 0.9 else np.cross(a, [0, 1, 0]))
        return rodrigues(ax, np.pi)
    vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + vx + vx @ vx / (1 + c)


def rodrigues(ax, ang):
    ax = unit(ax); K = np.array([[0, -ax[2], ax[1]], [ax[2], 0, -ax[0]], [-ax[1], ax[0], 0]])
    return np.eye(3) + np.sin(ang) * K + (1 - np.cos(ang)) * K @ K


def goldberg(freq):
    """Dual of the geodesic sphere: pore centres (= geodesic vertices), nodes (= triangle centroids), bars."""
    V, T = icosphere(freq)
    C = unit(V[T].mean(axis=1))
    edges = {}
    for ti, (a, b, c) in enumerate(T):
        for e in ((a, b), (b, c), (c, a)):
            k = (min(e), max(e)); edges.setdefault(k, []).append(ti)
    bars = np.array([v for v in edges.values() if len(v) == 2])
    return V, C, bars


# ---------------------------------------------------------------------------------------
def lattice_shell(g, R, freq, rng, barw=0.2, br=1.0, jitter=0.06, spinule=0.0, center=(0, 0, 0), node_br=0.6, curve=True):
    """Spherical lattice shell with hexagonal/pentagonal pores (Goldberg polyhedron bars)."""
    V, C, bars = goldberg(freq)
    C = unit(C + rng.normal(0, jitter / freq, C.shape))
    ctr = np.asarray(center, float)
    a = C[bars[:, 0]]; b = C[bars[:, 1]]
    elen = np.linalg.norm(a - b, axis=1).mean() * R
    w = barw * elen
    if curve:
        m = unit(a + b)
        for p, q in ((a, m), (m, b)):
            n = unit(p + q)
            g.seg(ctr + p * R, ctr + q * R, w, w, n, 0, br)
    else:
        g.seg(ctr + a * R, ctr + b * R, w, w, unit(a + b), 0, br)
    if node_br > 0:
        g.pts(ctr + C * R, w * 0.55, br * node_br)
    if spinule > 0:
        L = spinule * elen
        g.seg(ctr + C * R, ctr + C * (R + L * 1.4), w * 0.28, w * 0.04, C, 1, br * 0.6)
    return elen


def branch(g, base, d, L, w, levels, rng, br=1.0, spread=0.55, nchild=(2, 3), ratio=0.62, thorns=0, mat=0, kink=0.06):
    """Recursive branching spine (tapered tube), each branch splitting into smaller branches."""
    base = np.asarray(base, float); d = unit(d)
    nseg = 4
    pts = [base]
    dd = d.copy()
    for i in range(nseg):
        dd = unit(dd + rng.normal(0, kink, 3))
        pts.append(pts[-1] + dd * L / nseg)
    pts = np.array(pts)
    ws = np.linspace(w, w * (0.55 if levels > 0 else 0.05), nseg + 1)
    for i in range(nseg):
        g.seg(pts[i], pts[i + 1], ws[i], ws[i + 1], unit(pts[i + 1] - pts[i]), 1, br, mat)
    if thorns:
        # little lateral hooks along the main spine (Haeckel's Acanthophracta)
        perp = unit(np.cross(d, rng.normal(size=3)))
        for j in range(thorns):
            s = 0.25 + 0.6 * j / max(thorns - 1, 1)
            p = base + d * L * s
            ang = j * 2.39996
            q = rodrigues(d, ang) @ perp
            g.seg(p, p + unit(q * 1.0 + d * 0.5) * L * 0.09, w * 0.35, w * 0.03, q, 1, br * 0.7, mat)
    if levels <= 0:
        return
    tip = pts[-1]
    k = rng.integers(nchild[0], nchild[1] + 1)
    perp = unit(np.cross(dd, rng.normal(size=3)))
    off = rng.uniform(0, TAU)
    for j in range(k):
        q = rodrigues(dd, off + TAU * j / k) @ perp
        nd = unit(dd * np.cos(spread) + q * np.sin(spread))
        branch(g, tip, nd, L * ratio * rng.uniform(0.85, 1.1), w * 0.55, levels - 1, rng, br * 0.92, spread * 1.05,
               nchild, ratio, 0, mat, kink)


def axopods(g, n, R0, L, rng, w=0.004, amp=0.05, br=0.55, beads=3, dirs=None, avoid=None):
    for i in range(n):
        d = unit(rng.normal(size=3)) if dirs is None else dirs[i]
        if avoid is not None and np.dot(d, avoid) > 0.93:
            continue
        g.axo.append((d * R0, d, L * rng.uniform(0.6, 1.15), w, amp * rng.uniform(0.5, 1.4), rng.uniform(0, TAU),
                      rng.uniform(0.25, 0.6), beads, br * rng.uniform(0.6, 1.1)))


# ---------------------------------------------------------------------------------------
# organism library
def spumellaria(rng, nested=3, hero=False):
    """Actinomma-like: nested concentric lattice shells joined by radial bars, branching radial spines."""
    g = Geo()
    radii = [1.0, 0.42, 0.18][:nested]
    freqs = [6, 5, 5] if hero else [4, 3, 2]
    for i, (R, f) in enumerate(zip(radii, freqs)):
        lattice_shell(g, R, f, rng, barw=0.15 if i == 0 else 0.13, br=1.0 if i == 0 else 0.85, jitter=0.05,
                      spinule=0.35 if i == 0 else 0.0, node_br=0.0 if hero else 0.3)
        g.sph((0, 0, 0), R * 0.995, 0.06, 0.004, 0)  # faint glass surface
    # radial struts connecting shells, and branching main spines (avoid the camera axis)
    V, _ = icosphere(1)
    ico = unit(V[:12]) if len(V) >= 12 else V
    I0, _ = icosphere(1)
    ax = np.array([0, 0, -1.0])
    main = [v for v in I0 if abs(np.dot(v, ax)) < 0.95][:10]
    _, C1, _ = goldberg(1)
    sec = [c for c in C1 if abs(np.dot(c, ax)) < 0.9]
    for d in main:
        for i in range(len(radii) - 1):
            g.seg(d * radii[i + 1], d * radii[i], 0.010 * radii[i] + 0.002, 0.010 * radii[i] + 0.002, d, 1, 0.6)
        branch(g, d * radii[0], d, 0.95, 0.045, 3 if hero else 2, rng, br=1.0, spread=0.5, ratio=0.6, thorns=6)
    for d in sec:
        branch(g, d * radii[0], d, 0.45, 0.022, 2, rng, br=0.8, spread=0.6, ratio=0.55)
    # protoplasm: amber endoplasm inside the second shell, frothy glow between shells
    g.sph((0, 0, 0), 0.72, 0.035, 0.004, 1)
    g.sph((0, 0, 0), radii[-1] * 0.8 if nested > 1 else 0.3, 0.05, 0.004, 1)
    # frothy alveoli between the shells (small translucent bubbles)
    nb = 90 if hero else 30
    bp = unit(rng.normal(size=(nb, 3))) * rng.uniform(radii[-1] * 1.1 if nested > 1 else 0.3, 0.85, (nb, 1))
    if hero:
        bp = bp[np.abs(bp[:, 0]) + np.abs(bp[:, 1]) > 0.06]  # keep the axis clear
    for p in bp:
        g.sph(p, rng.uniform(0.015, 0.04), 0.03, 0.0015, 2)
    axopods(g, 220 if hero else 60, 1.0, 2.2, rng, w=0.0045, amp=0.07, br=0.5, beads=3,
            avoid=ax if hero else None)
    g.radius = 2.6
    return g.done()


def heliozoan(rng):
    g = Geo()
    g.sph((0, 0, 0), 1.0, 0.16, 0.012, 1)
    g.sph((0, 0, 0), 0.45, 0.14, 0.02, 2)          # nucleus
    # granular cytoplasm and a layer of tiny siliceous scales
    p = unit(rng.normal(size=(500, 3))) * rng.uniform(0.2, 0.97, (500, 1)) ** 0.5
    g.pts(p, 0.012, 0.35, 1)
    s = unit(rng.normal(size=(420, 3))) * 1.03
    t = unit(np.cross(s, rng.normal(size=(420, 3))))
    g.seg(s - t * 0.025, s + t * 0.025, 0.012, 0.012, unit(s), 0, 0.55)
    dirs = unit(rng.normal(size=(170, 3)))
    axopods(g, 170, 1.0, 3.0, rng, w=0.012, amp=0.10, br=0.75, beads=4, dirs=dirs)
    g.radius = 4.0
    return g.done()


def acantharian(rng):
    """20 radial spines in Mueller's arrangement (5 circles of 4)."""
    g = Geo()
    lats = [0, 30, -30, 60, -60]
    for i, la in enumerate(lats):
        for k in range(4):
            lo = np.radians(k * 90 + (45 if i % 2 else 0))
            l = np.radians(la)
            d = np.array([np.cos(l) * np.cos(lo), np.cos(l) * np.sin(lo), np.sin(l)])
            L = 1.6 if la == 0 else 1.3
            branch(g, d * 0.08, d, L, 0.06, 1, rng, br=1.0, spread=0.35, nchild=(2, 2), ratio=0.18, thorns=4, kink=0.0)
            # apophyses: four little wings near the base
            for j in range(4):
                q = rodrigues(d, j * TAU / 4) @ unit(np.cross(d, [0.3, 0.2, 1]))
                b = d * 0.42
                g.seg(b, b + q * 0.14 + d * 0.05, 0.02, 0.004, q, 1, 0.8)
    g.sph((0, 0, 0), 0.38, 0.2, 0.02, 1)
    p = unit(rng.normal(size=(150, 3))) * rng.uniform(0.1, 0.36, (150, 1))
    g.pts(p, 0.012, 0.4, 1)
    axopods(g, 60, 0.38, 1.4, rng, w=0.006, amp=0.06, br=0.45, beads=2)
    g.radius = 1.8
    return g.done()


def centric_diatom(rng, R=1.0):
    """Coscinodiscus-like valve: self-similar radial rows of areolae that double outward, radial ribs."""
    g = Geo()
    z = 0.0
    ring = lambda r, n: np.stack([r * np.cos(np.linspace(0, TAU, n + 1)), r * np.sin(np.linspace(0, TAU, n + 1)), np.full(n + 1, z)], 1)
    for r, w, b in ((R, 0.03, 1.0), (R * 0.965, 0.012, 0.6)):
        P = ring(r, 160)
        g.seg(P[:-1], P[1:], w, w, unit(np.c_[P[:-1, :2], np.zeros(160)]), 0, b)
    # girdle: a second valve edge slightly behind
    P = ring(R * 0.99, 160); P[:, 2] = 0.12
    g.seg(P[:-1], P[1:], 0.02, 0.02, unit(np.c_[P[:-1, :2], np.zeros(160)]), 0, 0.5)
    s = 0.034 * R
    n0 = 8
    pts = []
    rr = 0.06 * R
    while rr < 0.94 * R:
        n = n0 * 2 ** int(np.floor(np.log2(max(TAU * rr / s / n0, 1))))
        a = np.arange(n) * TAU / n + (rr * 3.1)
        pts.append(np.c_[rr * np.cos(a), rr * np.sin(a), np.zeros(n)])
        rr += s
    pts = np.concatenate(pts)
    r = np.linalg.norm(pts[:, :2], axis=1)
    g.pts(pts, 0.009 * R, 0.55 + 0.35 * np.cos(r * 30) ** 2)
    # radial ribs between primary sectors (self-similar: ribs start at increasing radius)
    for lvl, (k, r0) in enumerate(((8, 0.08), (16, 0.35), (32, 0.6))):
        for j in range(k):
            if lvl and j % 2 == 0:
                continue
            a = (j + 0.5) * TAU / k
            u = np.array([np.cos(a), np.sin(a), 0])
            g.seg(u * r0 * R, u * 0.95 * R, 0.010, 0.010, u, 1, 0.55 - 0.1 * lvl)
    P = ring(0.06 * R, 24)
    g.seg(P[:-1], P[1:], 0.01, 0.01, unit(np.c_[P[:-1, :2], np.zeros(24)]), 0, 0.8)
    g.sph((0.1 * R, -0.05 * R, 0.05), 0.25 * R, 0.06, 0.012, 1)  # chloroplast glow (amber)
    g.radius = R * 1.1
    return g.done()


def pennate_diatom(rng, L=1.0):
    g = Geo()
    n = 120
    a = np.linspace(-1, 1, n + 1)
    half = 0.17 * L * np.sqrt(np.clip(1 - a ** 2, 0, 1)) ** 0.9
    for sgn in (1, -1):
        P = np.c_[a * L, sgn * half, np.zeros(n + 1)]
        nn = unit(np.c_[np.gradient(half) * 0 + a * 0.2, np.full(n + 1, sgn), np.zeros(n + 1)])
        g.seg(P[:-1], P[1:], 0.018 * L, 0.018 * L, nn[:-1], 0, 1.0)
    # raphe and central nodule
    g.seg([-0.92 * L, 0, 0], [-0.04 * L, 0, 0], 0.008 * L, 0.008 * L, [0, 0, 1], 1, 0.7)
    g.seg([0.04 * L, 0, 0], [0.92 * L, 0, 0], 0.008 * L, 0.008 * L, [0, 0, 1], 1, 0.7)
    g.pts([[0, 0, 0]], 0.02 * L, 0.8)
    # transverse striae of dots
    for x in np.linspace(-0.9, 0.9, 46):
        h = 0.17 * L * np.sqrt(max(1 - x ** 2, 0)) ** 0.9
        ys = np.linspace(0.02 * L, h * 0.9, max(int(h / (0.012 * L)), 2))
        for sgn in (1, -1):
            g.pts(np.c_[np.full(len(ys), x * L), sgn * ys, np.zeros(len(ys))], 0.0045 * L, 0.45)
    g.sph((0.3 * L, 0, 0), 0.10 * L, 0.06, 0.012, 1)
    g.sph((-0.3 * L, 0, 0), 0.10 * L, 0.06, 0.012, 1)
    g.radius = L * 1.05
    return g.done()


def phaeodarian(rng):
    """Aulosphaera-like: big thin geodesic lattice with a small branching tree at every node."""
    g = Geo()
    V, C, bars = goldberg(2)
    C = unit(C + rng.normal(0, 0.02, C.shape))
    a = C[bars[:, 0]]; b = C[bars[:, 1]]
    g.seg(a, b, 0.012, 0.012, unit(a + b), 0, 0.85)
    for c in C:
        branch(g, c, c, 0.22, 0.012, 2, rng, br=0.7, spread=0.7, nchild=(2, 3), ratio=0.55, kink=0.1)
    g.sph((0, 0, 0), 0.35, 0.14, 0.012, 1)
    g.sph((0, 0, 0), 0.98, 0.05, 0.003, 2)
    p = unit(rng.normal(size=(200, 3))) * rng.uniform(0.05, 0.33, (200, 1))
    g.pts(p, 0.01, 0.35, 1)
    g.radius = 1.4
    return g.done()


def discoid(rng, arms=4):
    """Discoidea (Haeckel pl. 11/91): spongy concentric disc with dichotomously branching chambered arms."""
    g = Geo()
    for r in np.linspace(0.06, 0.34, 7):
        n = int(40 + r * 200)
        th = np.linspace(0, TAU, n + 1)
        P = np.c_[r * np.cos(th), r * np.sin(th), np.zeros(n + 1)]
        g.seg(P[:-1], P[1:], 0.012, 0.012, unit(np.c_[P[:-1, :2], np.zeros(n)]), 0, 0.7)
    for j in range(24):
        a = j * TAU / 24
        u = np.array([np.cos(a), np.sin(a), 0])
        g.seg(u * 0.06, u * 0.34, 0.008, 0.008, u, 1, 0.5)

    def arm(base, d, L, wid, lvl):
        d = unit(d)
        nrm = np.array([-d[1], d[0], 0])
        ns = 7
        for i in range(ns):
            p0 = base + d * L * i / ns; p1 = base + d * L * (i + 1) / ns
            for s in (1, -1):
                bulge = 1 + 0.12 * np.sin(np.pi * (i + 0.5) / ns * 3)
                g.seg(p0 + nrm * wid * s * bulge, p1 + nrm * wid * s * bulge, 0.014, 0.014, nrm * s, 0, 0.9)
            if i % 2 == 1:
                g.seg(p1 + nrm * wid * 0.9, p1 - nrm * wid * 0.9, 0.006, 0.006, d, 1, 0.22)  # chamber walls
            pp = p0[None] + d[None] * L / ns * rng.uniform(0, 1, (5, 1)) + nrm[None] * rng.uniform(-0.8, 0.8, (5, 1)) * wid
            g.pts(pp, 0.006, 0.3)
        tip = base + d * L
        if lvl == 0:
            g.seg(tip, tip + d * L * 0.4, 0.016, 0.002, d, 1, 0.8)
            return
        for s in (1, -1):
            nd = rodrigues([0, 0, 1], s * 0.5) @ d
            arm(tip, nd, L * 0.62, wid * 0.72, lvl - 1)
    off = rng.uniform(0, TAU)
    for k in range(arms):
        a = off + k * TAU / arms
        d = np.array([np.cos(a), np.sin(a), 0])
        arm(d * 0.34, d, 0.42, 0.075, 2)
    g.sph((0, 0, 0), 0.22, 0.3, 0.05, 1)
    g.radius = 1.4
    return g.done()


def spiral_foram(rng):
    """Planispiral chambers on a logarithmic spiral (Hastigerina-like), with long spines."""
    g = Geo()
    b = 0.17
    k = 0
    cs = []
    for i in range(14):
        th = i * 0.62
        r = 0.05 * np.exp(b * th * 1.5)
        cs.append((np.array([r * np.cos(th), r * np.sin(th), 0.0]), 0.42 * r + 0.012))
    for c, rad in cs:
        n = 48
        th = np.linspace(0, TAU, n + 1)
        P = c + np.c_[rad * np.cos(th), rad * np.sin(th), np.zeros(n + 1)]
        g.seg(P[:-1], P[1:], 0.012, 0.012, unit(np.c_[np.cos(th[:-1]), np.sin(th[:-1]), np.zeros(n)]), 0, 0.85)
        g.sph(c, rad * 0.95, 0.05, 0.008, 1)
        q = c + unit(rng.normal(size=(30, 3)) * [1, 1, 0.3]) * rad * rng.uniform(0.2, 0.9, (30, 1))
        g.pts(q, 0.006, 0.45)
        if rad > 0.06:
            for j in range(5):
                a = rng.uniform(0, TAU)
                d = unit(np.array([np.cos(a), np.sin(a), rng.normal(0, 0.4)]))
                branch(g, c + d * rad, d, 0.9 * rad / 0.2, 0.014, 0, rng, br=0.7, thorns=3)
    # bubble capsule halo
    g.radius = 1.5
    return g.done()


def cyrtoid(rng):
    """Nassellarian helmet (Haeckel pl. 31): lattice on a surface of revolution, apical horn, feet."""
    g = Geo()
    zs = np.linspace(0, 1, 13)
    prof = 0.12 + 0.42 * np.sin(np.clip(zs * 1.15, 0, 1) * np.pi / 2) ** 1.2 - 0.07 * np.sin(zs * np.pi * 2.0) ** 2
    nphi = 22
    pts = np.zeros((len(zs), nphi, 3))
    for i, (z, r) in enumerate(zip(zs, prof)):
        ph = np.arange(nphi) * TAU / nphi + (i % 2) * TAU / nphi / 2
        rr = r * (1 + rng.normal(0, 0.025, nphi))
        pts[i] = np.c_[rr * np.cos(ph), rr * np.sin(ph), np.full(nphi, 0.5 - z) + rng.normal(0, 0.008, nphi)]
    for i in range(len(zs)):
        P = pts[i]; Q = np.roll(P, -1, 0)
        g.seg(P, Q, 0.02, 0.02, unit(np.c_[P[:, :2], np.zeros(nphi)]), 0, 0.85)
        if i + 1 < len(zs):
            N = pts[i + 1]; N2 = np.roll(N, 1, 0) if i % 2 else np.roll(N, -1, 0)
            g.seg(P, N, 0.016, 0.016, unit(np.c_[P[:, :2], np.zeros(nphi)]), 0, 0.7)
    branch(g, [0, 0, 0.5], [0, 0, 1], 0.45, 0.03, 1, rng, br=0.9, spread=0.3, nchild=(2, 3), ratio=0.4, thorns=4)
    for k in range(3):
        a = k * TAU / 3
        d = unit([np.cos(a), np.sin(a), -1.3])
        branch(g, pts[-1, k * nphi // 3], d, 0.5, 0.025, 1, rng, br=0.8, spread=0.4, ratio=0.4)
    g.sph([0, 0, 0.32], 0.16, 0.3, 0.05, 1)
    g.radius = 1.1
    return g.done()


def ciliate(rng):
    """Ovoid ciliate: glassy pellicle meridians (fresnel rim) and beating cilia in metachronal waves."""
    g = Geo()
    a, b = 1.0, 0.55
    nm, nl = 18, 26
    u = np.linspace(-np.pi / 2, np.pi / 2, nl)
    for j in range(nm):
        ph = j * TAU / nm
        P = np.c_[a * np.sin(u), b * np.cos(u) * np.cos(ph), b * np.cos(u) * np.sin(ph)]
        N = unit(np.c_[np.sin(u) / a, np.cos(u) * np.cos(ph) / b, np.cos(u) * np.sin(ph) / b])
        g.seg(P[:-1], P[1:], 0.008, 0.008, N[:-1], 0, 0.55)
        for i in range(1, nl - 1, 2):
            tg = unit(P[i + 1] - P[i])
            g.cil.append((P[i], N[i], tg, 0.13, 0.006, -i * 0.55 - j * 0.1, 1.6, 0.55))
    g.sph([0, 0, 0], b * 0.95, 0.0, 0.006, 1)
    p = rng.normal(size=(260, 3)) * [0.45, 0.22, 0.22]
    g.pts(p, 0.012, 0.35, 1)
    g.sph([0.15, 0.05, 0], 0.18, 0.15, 0.015, 2)  # macronucleus
    g.radius = 1.2
    return g.done()


def flagellate(rng):
    g = Geo()
    g.sph((0, 0, 0), 0.25, 0.15, 0.012, 1)
    g.sph((0.08, 0, 0), 0.08, 0.15, 0.02, 2)
    p = rng.normal(size=(40, 3)) * 0.09
    g.pts(p, 0.01, 0.4, 1)
    g.flag.append((np.array([0.25, 0, 0]), np.array([1.0, 0, 0]), np.array([0, 1.0, 0]), 1.3, 0.012, 0.0, 2.2, 0.7))
    g.flag.append((np.array([0.22, 0.05, 0]), np.array([0.7, 0.7, 0]), np.array([0, 0, 1.0]), 0.8, 0.010, 1.0, 2.6, 0.6))
    g.radius = 1.5
    return g.done()


KINDS = dict(spumellaria=lambda r: spumellaria(r, 3), spumellaria2=lambda r: spumellaria(r, 2), heliozoan=heliozoan,
             acantharian=acantharian, centric=centric_diatom, pennate=pennate_diatom, phaeodarian=phaeodarian,
             discoid=discoid, foram=spiral_foram, cyrtoid=cyrtoid, ciliate=ciliate, flagellate=flagellate)
