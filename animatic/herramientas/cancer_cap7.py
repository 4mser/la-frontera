"""Data of the cancer scene of chapter VII (src/cap7_cancer.json): an illustrative simulation, labelled as such on screen.

- sano: an ordered vessel tree (binary branching, steady angles and length ratios), like healthy arteries and veins.
- tumor: a disordered network grown from the same root: tortuous random-walk branches, random sprouting, a few loops
  (anastomoses) and unperfused gaps, the traits Baish & Jain (Cancer Research, 2000) describe for tumour vessels.
- cajas: occupied boxes of the tumour network at three grid sizes, for the box-counting moment.
- celulas: cell contours, smooth (a few low harmonics) and ragged (the same cells with midpoint displacement).
Every segment carries the moment it is born (0..1) and a width, so the scene can grow it.

Usage: python3 herramientas/cancer_cap7.py
"""
import json
import math
import random
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
R4 = lambda v: round(v, 4)


def sano():
    seg = []
    def rama(x, y, ang, largo, ancho, nivel, t0):
        if nivel > 9:
            return
        x1, y1 = x + largo * math.cos(ang), y + largo * math.sin(ang)
        seg.append([x, y, x1, y1, t0, ancho])
        dt = 0.1
        for s in (-1, 1):
            rama(x1, y1, ang + s * (0.5 + 0.05 * (nivel % 2)), largo * 0.74, ancho * 0.72, nivel + 1, t0 + dt)
    rama(0.0, 0.98, -math.pi / 2, 0.5, 5.0, 0, 0.0)
    return seg


def tumor():
    rnd = random.Random(7)
    huecos = [(-0.35, -0.25, 0.22), (0.4, 0.1, 0.18), (0.05, -0.65, 0.14)]
    nodos, seg = [], []
    cola = [(0.0, 0.95, -math.pi / 2, 4.5, 0.0, 0)]
    while cola and len(seg) < 2600:
        cola.sort(key=lambda c: c[4])
        x, y, ang, ancho, t, gen = cola.pop(0)
        pasos = rnd.randint(8, 22)
        for _ in range(pasos):
            ang += rnd.gauss(0, 0.55)
            l = 0.028 + 0.012 * rnd.random()
            x1, y1 = x + l * math.cos(ang), y + l * math.sin(ang)
            if x1 * x1 + y1 * y1 > 1.0 or any((x1 - a) ** 2 + (y1 - b) ** 2 < r * r for a, b, r in huecos):
                break
            # a loop: the branch meets an older vessel and joins it
            cerca = [n for n in nodos if n[2] < gen and (n[0] - x1) ** 2 + (n[1] - y1) ** 2 < 0.0009]
            seg.append([x, y, x1, y1, t, ancho])
            nodos.append((x1, y1, gen))
            x, y, t = x1, y1, t + 0.012
            if cerca and rnd.random() < 0.5:
                break
            if rnd.random() < 0.13:
                cola.append((x, y, ang + rnd.choice((-1, 1)) * rnd.uniform(0.5, 1.6), max(0.8, ancho * rnd.uniform(0.55, 0.85)), t, gen + 1))
        ancho = max(0.8, ancho * 0.9)
        if rnd.random() < 0.7:
            cola.append((x, y, ang + rnd.gauss(0, 0.6), max(0.8, ancho * 0.85), t, gen + 1))
    m = max(s[4] for s in seg)
    return [[R4(a), R4(b), R4(c), R4(d), R4(e / m), round(f, 2)] for a, b, c, d, e, f in seg]


def cajas(seg):
    out = {}
    for n in (8, 16, 32):
        occ = set()
        for x0, y0, x1, y1, *_ in seg:
            for k in range(6):
                u = k / 5
                x, y = x0 + (x1 - x0) * u, y0 + (y1 - y0) * u
                occ.add(min(n - 1, int((y + 1) / 2 * n)) * n + min(n - 1, int((x + 1) / 2 * n)))
        out[str(n)] = sorted(occ)
    return out


def celulas():
    rnd = random.Random(11)
    lisas, rugosas = [], []
    centros = []
    while len(centros) < 14:
        c = (rnd.uniform(-0.75, 0.75), rnd.uniform(-0.75, 0.75))
        if c[0] ** 2 + c[1] ** 2 < 0.62 and all((c[0] - a) ** 2 + (c[1] - b) ** 2 > 0.11 for a, b in centros):
            centros.append(c)
    for cx, cy in centros:
        r = rnd.uniform(0.13, 0.17)
        fases = [rnd.uniform(0, 6.3) for _ in range(4)]
        base = []
        for i in range(64):
            th = i / 64 * 2 * math.pi
            rr = r * (1 + 0.08 * math.sin(2 * th + fases[0]) + 0.05 * math.sin(3 * th + fases[1]))
            base.append((cx + rr * math.cos(th), cy + rr * math.sin(th)))
        lisas.append([[R4(x), R4(y)] for x, y in base])
        # ragged: midpoint displacement on the same contour, four rounds, the push halving each time
        p, amp = base[::4], r * 0.2
        for _ in range(4):
            q = []
            for i in range(len(p)):
                a, b = p[i], p[(i + 1) % len(p)]
                mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
                dx, dy = b[0] - a[0], b[1] - a[1]
                L = math.hypot(dx, dy) or 1
                d = rnd.gauss(0, 1) * amp
                q += [a, (mx - dy / L * d, my + dx / L * d)]
            p, amp = q, amp * 0.55
        rugosas.append([[R4(x), R4(y)] for x, y in p])
    return {"lisas": lisas, "rugosas": rugosas, "centros": [[R4(a), R4(b)] for a, b in centros]}


S, T = sano(), tumor()
datos = {"sano": [[R4(a), R4(b), R4(c), R4(d), R4(e / max(s[4] for s in S)), round(f, 2)] for a, b, c, d, e, f in S],
         "tumor": T, "cajas": cajas(T), **celulas()}
(RAIZ / "src" / "cap7_cancer.json").write_text(json.dumps(datos, separators=(",", ":")))
print("sano", len(S), "tumor", len(T), {k: len(v) for k, v in datos["cajas"].items()})
