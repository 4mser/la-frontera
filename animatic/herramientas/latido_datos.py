"""RR intervals from PhysioNet long-term records (MIT annotation format) and their detrended fluctuation analysis.

Writes src/latido.json for the prologue: the healthy and the heart-failure NN intervals (normal-to-normal beats),
24 h each, and the DFA curve of both (log n, log F(n)) with its slope.

Usage: PYTHONPATH=pylib python3 herramientas/latido_datos.py
"""
import json
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
D = RAIZ / "datos" / "physionet"


def anotaciones(ruta):
    """(sample, code) of every annotation in an MIT-format annotation file."""
    b = ruta.read_bytes()
    i, t, out = 0, 0, []
    while i + 1 < len(b):
        w = b[i] | (b[i + 1] << 8)
        i += 2
        a, d = w >> 10, w & 0x3FF
        if a == 0 and d == 0:
            break
        if a == 59:  # SKIP: a 32-bit interval follows (PDP-11 order: high word first)
            hi = b[i] | (b[i + 1] << 8)
            lo = b[i + 2] | (b[i + 3] << 8)
            t += (hi << 16) | lo
            i += 4
            continue
        if a in (60, 61, 62):  # NUM, SUB, CHN
            continue
        if a == 63:  # AUX: d bytes of text, padded to even
            i += d + (d & 1)
            continue
        t += d
        out.append((t, a))
    return out


def nn(nombre):
    fs = float((D / f"{nombre}.hea").read_text().split()[2].split("/")[0])
    an = anotaciones(D / f"{nombre}.ecg")
    rr = []
    for (t0, a0), (t1, a1) in zip(an, an[1:]):
        if a0 == 1 and a1 == 1:  # normal to normal
            r = (t1 - t0) / fs
            if 0.3 < r < 2.0:
                rr.append(r)
    return np.array(rr), fs


def dfa(x, escalas):
    y = np.cumsum(x - x.mean())
    F = []
    for n in escalas:
        m = len(y) // n
        seg = y[: m * n].reshape(m, n)
        k = np.arange(n)
        A = np.vstack([k, np.ones(n)]).T
        coef, *_ = np.linalg.lstsq(A, seg.T, rcond=None)
        res = seg - (A @ coef).T
        F.append(np.sqrt((res ** 2).mean()))
    return np.array(F)


# the record of each group closest to its median exponents (herramientas/latido_grupos.py)
G = json.loads((RAIZ / "datos" / "latido_grupos.json").read_text())
sano, fs1 = nn(G["nsr2db"]["representativo"])
ic, fs2 = nn(G["chf2db"]["representativo"])
escalas = np.unique(np.round(np.logspace(np.log10(4), np.log10(2000), 30)).astype(int))
out = {"fuente": f"PhysioNet: nsr2db {G['nsr2db']['representativo']} (ritmo sinusal normal) y chf2db {G['chf2db']['representativo']} (insuficiencia cardíaca congestiva), los más cercanos a la mediana de su grupo", "grupos": G}
for nombre, x in (("sano", sano), ("ic", ic)):
    F = dfa(x, escalas)
    lx, ly = np.log10(escalas), np.log10(F)
    pend = np.polyfit(lx, ly, 1)[0]
    # short (4-16 beats) and long (16-64 beats) range exponents, as in Peng et al. 1995
    a1 = np.polyfit(lx[escalas <= 16], ly[escalas <= 16], 1)[0]
    a2 = np.polyfit(lx[(escalas >= 16) & (escalas <= 64)], ly[(escalas >= 16) & (escalas <= 64)], 1)[0]
    out[nombre] = {"rr": [round(float(v), 4) for v in x], "horas": round(float(x.sum() / 3600), 2), "lpm": round(float(60 / x.mean()), 1),
                   "dfa": {"logn": [round(float(v), 4) for v in lx], "logF": [round(float(v), 4) for v in ly], "alfa": round(float(pend), 3), "alfa1": round(float(a1), 3), "alfa2": round(float(a2), 3)}}
    print(nombre, len(x), "latidos", out[nombre]["horas"], "h", out[nombre]["lpm"], "lpm medio · alfa", out[nombre]["dfa"]["alfa"], "alfa1 (4-16)", out[nombre]["dfa"]["alfa1"], "alfa2 (16-64)", out[nombre]["dfa"]["alfa2"])
(RAIZ / "src" / "latido.json").write_text(json.dumps(out))
