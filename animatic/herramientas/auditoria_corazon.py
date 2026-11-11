"""Audit of the heart comparison (chapter V): every record of PhysioNet nsr2db (healthy) and chf2db (heart failure)
through the same pipeline as the prologue (herramientas/latido_datos.py: normal-to-normal intervals, 0.3-2 s, DFA
alpha1 on 4-16 beats and alpha2 on 16-64 beats), with record length, retained beats, age and sex from the headers.
Group test: Mann-Whitney U (normal approximation, tie-corrected), Cliff's delta, bootstrap 95 % CI of the difference
of medians, overlap, and the same comparison restricted to an age band shared by both groups.

Usage: PYTHONPATH=pylib python3 herramientas/auditoria_corazon.py
"""
import json
import math
import re
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
D = RAIZ / "datos" / "physionet"
src = (RAIZ / "herramientas" / "latido_datos.py").read_text().split("# the record of each group")[0]
exec(compile(src.replace("Path(__file__)", f"Path({str(RAIZ / 'herramientas' / 'x.py')!r})"), "latido_datos", "exec"))

e1 = np.unique(np.round(np.logspace(np.log10(4), np.log10(16), 8)).astype(int))
e2 = np.unique(np.round(np.logspace(np.log10(16), np.log10(64), 8)).astype(int))


def cabecera(r):
    t = (D / f"{r}.hea").read_text()
    edad = re.search(r"Age:\s*([\d.]+)", t)
    sexo = re.search(r"Sex:\s*(\w)", t)
    nyha = re.search(r"NYHA class:\s*([\w-]+)", t)
    return (float(edad.group(1)) if edad else None, sexo.group(1) if sexo else None, nyha.group(1) if nyha else None)


def total_anotados(r):
    an = anotaciones(D / f"{r}.ecg")
    return sum(1 for _, a in an if a == 1), len(an)


def mann_whitney(a, b):
    x = np.concatenate([a, b]); n1, n2 = len(a), len(b)
    orden = x.argsort(); rangos = np.empty(len(x)); rangos[orden] = np.arange(1, len(x) + 1)
    # ties: average ranks
    for v in np.unique(x):
        m = x == v
        if m.sum() > 1:
            rangos[m] = rangos[m].mean()
    U1 = rangos[:n1].sum() - n1 * (n1 + 1) / 2
    _, cuentas = np.unique(x, return_counts=True)
    N = n1 + n2
    var = n1 * n2 / 12 * ((N + 1) - (cuentas ** 3 - cuentas).sum() / (N * (N - 1)))
    z = (U1 - n1 * n2 / 2) / math.sqrt(var)
    p = math.erfc(abs(z) / math.sqrt(2))
    return float(U1), float(z), float(p)


def cliff(a, b):
    return float(((a[:, None] > b[None, :]).sum() - (a[:, None] < b[None, :]).sum()) / (len(a) * len(b)))


def ic_mediana(a, b, n=4000, sem=1):
    g = np.random.default_rng(sem)
    d = [np.median(g.choice(a, len(a))) - np.median(g.choice(b, len(b))) for _ in range(n)]
    return [round(float(np.percentile(d, 2.5)), 3), round(float(np.percentile(d, 97.5)), 3)]


filas = {}
for db in ("nsr2db", "chf2db"):
    filas[db] = []
    for r in (D / f"RECORDS-{db}").read_text().split():
        x, fs = nn(r)
        edad, sexo, nyha = cabecera(r)
        normales, todos = total_anotados(r)
        fila = {"registro": r, "fs": fs, "nn": len(x), "horas": round(float(x.sum() / 3600), 2), "fraccion_normales": round(normales / max(1, todos), 3),
                "edad": edad, "sexo": sexo, "nyha": nyha, "incluido": len(x) >= 20000}
        if fila["incluido"]:
            fila["alfa1"] = round(float(np.polyfit(np.log10(e1), np.log10(dfa(x, e1)), 1)[0]), 3)
            fila["alfa2"] = round(float(np.polyfit(np.log10(e2), np.log10(dfa(x, e2)), 1)[0]), 3)
        filas[db].append(fila)

out = {"metodo": __doc__.strip().split("\n\n")[0], "registros": filas, "comparaciones": {}}
def compara(nombre, filtro):
    S = [f for f in filas["nsr2db"] if f["incluido"] and filtro(f)]
    C = [f for f in filas["chf2db"] if f["incluido"] and filtro(f)]
    res = {"n_sanos": len(S), "n_ic": len(C)}
    for k in ("alfa1", "alfa2"):
        a = np.array([f[k] for f in S]); b = np.array([f[k] for f in C])
        U, z, p = mann_whitney(a, b)
        lo, hi = max(a.min(), b.min()), min(a.max(), b.max())
        res[k] = {"mediana_sanos": round(float(np.median(a)), 3), "mediana_ic": round(float(np.median(b)), 3),
                  "iqr_sanos": [round(float(np.percentile(a, 25)), 3), round(float(np.percentile(a, 75)), 3)],
                  "iqr_ic": [round(float(np.percentile(b, 25)), 3), round(float(np.percentile(b, 75)), 3)],
                  "mann_whitney_z": round(z, 2), "p": float(f"{p:.2g}"), "cliff_delta": round(cliff(a, b), 2),
                  "ic95_dif_medianas": ic_mediana(a, b),
                  "en_zona_comun": int(((a >= lo) & (a <= hi)).sum() + ((b >= lo) & (b <= hi)).sum())}
    edades = lambda L: [f["edad"] for f in L if f["edad"] is not None]
    res["edad_mediana"] = [float(np.median(edades(S))) if edades(S) else None, float(np.median(edades(C))) if edades(C) else None]
    res["horas_mediana"] = [float(np.median([f["horas"] for f in S])), float(np.median([f["horas"] for f in C]))]
    res["fraccion_normales_mediana"] = [float(np.median([f["fraccion_normales"] for f in S])), float(np.median([f["fraccion_normales"] for f in C]))]
    out["comparaciones"][nombre] = res
    print(nombre, json.dumps(res, ensure_ascii=False))
compara("todos", lambda f: True)
compara("edad_50_a_75", lambda f: f["edad"] is not None and 50 <= f["edad"] <= 75)
excl = {db: [f["registro"] for f in filas[db] if not f["incluido"]] for db in filas}
out["excluidos_por_menos_de_20000_latidos"] = excl
print("excluidos", excl)
(RAIZ / "datos" / "auditoria_corazon.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
