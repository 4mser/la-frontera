"""Short- and long-range fluctuation exponents (alpha1: 4-16 beats, alpha2: 16-64 beats) of every record in the
PhysioNet nsr2db (healthy) and chf2db (heart failure) databases, the group medians, and the record of each group
closest to its median: that is the documented criterion for the records shown in the prologue.

Usage: PYTHONPATH=pylib python3 herramientas/latido_grupos.py
"""
import json
import sys
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "herramientas"))
D = RAIZ / "datos" / "physionet"
src = (RAIZ / "herramientas" / "latido_datos.py").read_text().split("sano, fs1 = nn")[0]
exec(compile(src.replace("Path(__file__)", f"Path({str(RAIZ / 'herramientas' / 'x.py')!r})"), "latido_datos", "exec"))

e1 = np.unique(np.round(np.logspace(np.log10(4), np.log10(16), 8)).astype(int))
e2 = np.unique(np.round(np.logspace(np.log10(16), np.log10(64), 8)).astype(int))
res = {}
for db in ("nsr2db", "chf2db"):
    filas = []
    for r in (D / f"RECORDS-{db}").read_text().split():
        x, _ = nn(r)
        if len(x) < 20000:
            continue
        a1 = np.polyfit(np.log10(e1), np.log10(dfa(x, e1)), 1)[0]
        a2 = np.polyfit(np.log10(e2), np.log10(dfa(x, e2)), 1)[0]
        filas.append((r, a1, a2, len(x)))
    A1, A2 = np.array([f[1] for f in filas]), np.array([f[2] for f in filas])
    m1, m2 = np.median(A1), np.median(A2)
    s1, s2 = A1.std(), A2.std()
    mejor = min(filas, key=lambda f: ((f[1] - m1) / s1) ** 2 + ((f[2] - m2) / s2) ** 2)
    res[db] = {"n": len(filas), "alfa1_mediana": round(float(m1), 3), "alfa2_mediana": round(float(m2), 3), "representativo": mejor[0],
               "alfa1": round(float(mejor[1]), 3), "alfa2": round(float(mejor[2]), 3)}
    print(db, len(filas), "registros · mediana α1", round(m1, 2), "α2", round(m2, 2), "· representativo", mejor[0], round(mejor[1], 2), round(mejor[2], 2))
(RAIZ / "datos" / "latido_grupos.json").write_text(json.dumps(res, indent=1))
