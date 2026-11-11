"""Data of chapter III «La medida de lo irregular» (src/cap3_datos.json), from Natural Earth 10m (public domain):

- the Spain-Portugal border, measured with the compass method for steps of 80, 40, 20, 10, 5, 2.5 and 1.25 km, with
  the walks (polygon vertices) of every step, and the log-log fit on 80-5 km (slope m, D = 1 - m);
- the United States-Canada border along the 49th parallel (lon -123 to -95), measured the same way;
- the Belgium-Netherlands border (scene 2);
- the silhouettes of Spain, Portugal, the United States and Canada, simplified for drawing;
- the rivers Minho, Douro/Duero, Tagus/Tajo and Guadiana, and which stretches of the Spain-Portugal border run within
  1.5 km of one of them (a check of «in good part along four rivers», not a measurement for the voice).

- Europe (scene 1).

Everything is in km, in a local equirectangular projection (x east, y north) centred on each region.

Usage: python3 herramientas/fronteras_cap3.py
"""
import json
import math
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
NE = RAIZ / "datos" / "natural-earth"
R = 6371.0


def carga(nombre):
    return json.loads((NE / f"{nombre}.geojson").read_text())["features"]


def partes(geom):
    t = geom["type"]
    if t == "LineString":
        return [geom["coordinates"]]
    if t in ("MultiLineString", "Polygon"):
        return geom["coordinates"]
    if t == "MultiPolygon":
        return [anillo for pol in geom["coordinates"] for anillo in pol]
    return []


def proyecta(pts, lon0, lat0):
    k = math.cos(math.radians(lat0))
    return [((x - lon0) * math.pi / 180 * R * k, (y - lat0) * math.pi / 180 * R) for x, y in pts]


def largo(P):
    return sum(math.dist(a, b) for a, b in zip(P, P[1:]))


def compas(P, r):
    """Walk a pair of dividers of opening r along the polyline P: every new point is the first point of P further on
    at distance r from the current one. Returns the vertices of the walk and the measured length (steps · r plus the
    remainder to the end)."""
    cur, i, verts = P[0], 0, [P[0]]
    while True:
        hallado = False
        while i < len(P) - 1:
            a, b = P[i], P[i + 1]
            if math.dist(cur, b) >= r:
                dx, dy = b[0] - a[0], b[1] - a[1]
                fx, fy = a[0] - cur[0], a[1] - cur[1]
                A, B, C = dx * dx + dy * dy, 2 * (fx * dx + fy * dy), fx * fx + fy * fy - r * r
                disc = B * B - 4 * A * C
                if disc >= 0 and A > 0:
                    t = (-B + math.sqrt(disc)) / (2 * A)
                    if 0 <= t <= 1:
                        cur = (a[0] + t * dx, a[1] + t * dy)
                        verts.append(cur)
                        P = [cur] + P[i + 1:]
                        i, hallado = 0, True
                        break
            i += 1
        if not hallado:
            break
    resto = math.dist(cur, P[-1])
    return verts + [P[-1]], (len(verts) - 1) * r + resto


def pendiente(pares):
    xs = [math.log10(r) for r, _ in pares]
    ys = [math.log10(L) for _, L in pares]
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)


def simplifica(P, tol):
    """Douglas-Peucker, for silhouettes only (never for the measured borders)."""
    if len(P) < 3:
        return P
    a, b = P[0], P[-1]
    dmax, imax = 0.0, 0
    for i in range(1, len(P) - 1):
        p = P[i]
        L = math.dist(a, b) or 1e-9
        d = abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L
        if d > dmax:
            dmax, imax = d, i
    if dmax <= tol:
        return [a, b]
    return simplifica(P[: imax + 1], tol)[:-1] + simplifica(P[imax:], tol)


def frontera(a3, b3, filtro=None):
    out = []
    for f in carga("ne_10m_admin_0_boundary_lines_land"):
        p = f["properties"]
        if {p["ADM0_A3_L"], p["ADM0_A3_R"]} == {a3, b3}:
            for q in partes(f["geometry"]):
                if filtro:
                    q = [v for v in q if filtro(v)]
                if len(q) > 1:
                    out.append(q)
    return out


def siluetas(nombres, lon0, lat0, caja, tol):
    out = {}
    for f in carga("ne_10m_admin_0_countries"):
        n = f["properties"]["ADM0_A3"]
        if n not in nombres:
            continue
        anillos = []
        for q in partes(f["geometry"]):
            if not any(caja[0] <= x <= caja[1] and caja[2] <= y <= caja[3] for x, y in q):
                continue
            P = proyecta(q, lon0, lat0)
            h = len(P) // 2          # a closed ring: simplify each half (its two ends are the same point)
            P = simplifica(P[: h + 1], tol)[:-1] + simplifica(P[h:], tol)
            if len(P) >= 4:
                anillos.append([[round(x, 1), round(y, 1)] for x, y in P])
        out[n] = anillos
    return out


r2 = lambda P: [[round(x, 2), round(y, 2)] for x, y in P]
PASOS = [80, 40, 20, 10, 5, 2.5, 1.25]
datos = {"fuente": "Natural Earth 10m (dominio público): admin_0_boundary_lines_land, admin_0_countries, rivers_lake_centerlines", "km": True}

# Spain-Portugal
LON0, LAT0 = -7.5, 40.0
es = [proyecta(q, LON0, LAT0) for q in frontera("ESP", "PRT")]
# north to south: the pieces in the order of their northernmost point
es.sort(key=lambda P: -max(y for _, y in P))
med = {}
for r in PASOS:
    caminatas, total = [], 0.0
    for P in es:
        v, L = compas(P, r)
        caminatas.append(r2(v))
        total += L
    med[str(r)] = {"largo": round(total, 1), "caminatas": caminatas}
m = pendiente([(r, med[str(r)]["largo"]) for r in (80, 40, 20, 10, 5)])
datos["espana_portugal"] = {"origen": [LON0, LAT0], "piezas": [r2(P) for P in es], "largo_vertices": round(sum(largo(P) for P in es), 1),
                            "medidas": med, "pendiente_80_5": round(m, 3), "D": round(1 - m, 3)}

# rivers, and which border vertices lie within 1.5 km of one
rios = {}
for f in carga("ne_10m_rivers_lake_centerlines"):
    n = f["properties"].get("name")
    if n in ("Minho", "Duero", "Douro", "Tajo", "Tejo", "Guadiana"):
        clave = {"Minho": "MIÑO", "Duero": "DUERO", "Douro": "DUERO", "Tajo": "TAJO", "Tejo": "TAJO", "Guadiana": "GUADIANA"}[n]
        rios.setdefault(clave, []).extend(r2(proyecta(q, LON0, LAT0)) for q in partes(f["geometry"]))
datos["rios"] = rios
# the whole river network of the peninsula (scene 7: it draws itself from the big rivers to the small ones)
red = []
for nombre in ("ne_10m_rivers_lake_centerlines", "ne_10m_rivers_europe"):
    for f in carga(nombre):
        rank = f["properties"].get("scalerank") or 10
        for q in partes(f["geometry"]):
            if any(-10 <= x <= 3.5 and 36 <= y <= 44 for x, y in q):
                P = simplifica(proyecta(q, LON0, LAT0), 0.6)
                if len(P) > 1:
                    red.append({"r": rank, "p": r2(P)})
red.sort(key=lambda d: d["r"])
datos["red_iberia"] = red
segs = [(a, b) for lista in rios.values() for q in lista for a, b in zip(q, q[1:])]


def dist_seg(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    L2 = dx * dx + dy * dy or 1e-9
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2))
    return math.dist(p, (a[0] + t * dx, a[1] + t * dy))


fluvial, total_l = 0.0, 0.0
marcas = []
for P in es:
    mp = []
    for a, b in zip(P, P[1:]):
        mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        cerca = min(dist_seg(mid, s0, s1) for s0, s1 in segs) < 1.5
        mp.append(cerca)
        L = math.dist(a, b)
        total_l += L
        fluvial += L if cerca else 0
    marcas.append(mp)
datos["espana_portugal"]["tramo_fluvial"] = marcas
datos["espana_portugal"]["fraccion_fluvial_aprox"] = round(fluvial / total_l, 3)

# Belgium-Netherlands
LONB, LATB = 4.8, 51.3
be = [proyecta(q, LONB, LATB) for q in frontera("BEL", "NLD")]
datos["belgica_paises_bajos"] = {"origen": [LONB, LATB], "piezas": [r2(P) for P in be], "largo_vertices": round(sum(largo(P) for P in be), 1)}

# United States-Canada along the 49th parallel
LONU, LATU = -109.0, 49.0
us = [proyecta(q, LONU, LATU) for q in frontera("USA", "CAN", lambda v: abs(v[1] - 49) < 0.05 and -123 < v[0] < -95)]
medu = {}
for r in PASOS:
    caminatas, total = [], 0.0
    for P in us:
        v, L = compas(P, r)
        caminatas.append(r2(v))
        total += L
    medu[str(r)] = {"largo": round(total, 1), "caminatas": caminatas}
mu = pendiente([(r, medu[str(r)]["largo"]) for r in (80, 40, 20, 10, 5)])
datos["paralelo_49"] = {"origen": [LONU, LATU], "piezas": [r2(P) for P in us], "medidas": medu, "pendiente_80_5": round(mu, 3), "D": round(1 - mu, 3)}

# silhouettes
datos["iberia"] = siluetas({"ESP", "PRT"}, LON0, LAT0, (-10, 4, 35.5, 44.5), 1.5)
datos["benelux"] = siluetas({"BEL", "NLD"}, LONB, LATB, (2, 8, 49, 54), 0.8)
datos["norteamerica"] = siluetas({"USA", "CAN"}, LONU, LATU, (-135, -60, 25, 62), 6.0)
# Europe, for the redrawn grid of Richardson's forecast (scene 1)
EUROPA = {"ESP", "PRT", "FRA", "BEL", "NLD", "LUX", "DEU", "CHE", "AUT", "ITA", "DNK", "POL", "CZE", "SVK", "HUN", "SVN", "HRV", "GBR", "IRL"}
datos["europa"] = {"origen": [8.0, 49.0], "paises": siluetas(EUROPA, 8.0, 49.0, (-11, 25, 36, 59), 5.0)}
# every land border of Europe in that frame (scene 1: «do countries with more common border fight more?»)
fe = []
for f in carga("ne_10m_admin_0_boundary_lines_land"):
    for q in partes(f["geometry"]):
        if any(-11 <= x <= 25 and 36 <= y <= 59 for x, y in q):
            P = simplifica(proyecta(q, 8.0, 49.0), 1.0)
            if len(P) > 1:
                fe.append(r2(P))
datos["europa"]["fronteras"] = fe

(RAIZ / "src" / "cap3_datos.json").write_text(json.dumps(datos, ensure_ascii=False, separators=(",", ":")))
print("España-Portugal:", {r: med[str(r)]["largo"] for r in PASOS}, "m =", round(m, 3), "D =", round(1 - m, 3), "· fluvial ≈", datos["espana_portugal"]["fraccion_fluvial_aprox"])
print("Paralelo 49:", {r: medu[str(r)]["largo"] for r in PASOS}, "m =", round(mu, 3), "D =", round(1 - mu, 3))
print("Bélgica-Países Bajos, largo de vértices:", datos["belgica_paises_bajos"]["largo_vertices"])
print("Tamaño:", round(len((RAIZ / "src" / "cap3_datos.json").read_text()) / 1e6, 2), "MB")
