"""Data of chapter V «Un corazón no es un metrónomo» (src/cap5_datos.json), all from PhysioNet through the same
pipeline as the prologue and the audit (herramientas/latido_datos.py, herramientas/auditoria_corazon.py):

- the two representative records (nsr018, healthy; chf223, heart failure), each as: the first 400 NN intervals
  (beat by beat), the whole record in 1.200 bins (min, mean, max of the intervals) for the 24-hour view, one hour in
  600 bins and five minutes beat by beat (for the magnifiers), and its DFA curve (log n, log F) with α1 (4–16) and
  α2 (16–64);
- a stretch of 64 healthy beats, for the DFA demonstration on screen;
- every record of both groups (α1, α2, age), from datos/auditoria_corazon.json;
- for the infinite zoom: all the healthy intervals, and the longest piece of the Spain–Portugal border (chapter III).

Usage: PYTHONPATH=pylib python3 herramientas/corazon_cap5.py
"""
import json
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
src = (RAIZ / "herramientas" / "latido_datos.py").read_text().split("# the record of each group")[0]
exec(compile(src.replace("Path(__file__)", f"Path({str(RAIZ / 'herramientas' / 'x.py')!r})"), "latido_datos", "exec"))


def bins(x, n):
    k = len(x) // n
    s = x[: k * n].reshape(n, k)
    return {"min": np.round(s.min(1), 3).tolist(), "med": np.round(s.mean(1), 3).tolist(), "max": np.round(s.max(1), 3).tolist()}


def serie(nombre):
    x, _ = nn(nombre)
    t = np.cumsum(x) / 3600
    escalas = np.unique(np.round(np.logspace(np.log10(4), np.log10(1000), 24)).astype(int))
    F = dfa(x, escalas)
    lx, ly = np.log10(escalas), np.log10(F)
    e1 = np.unique(np.round(np.logspace(np.log10(4), np.log10(16), 8)).astype(int))
    e2 = np.unique(np.round(np.logspace(np.log10(16), np.log10(64), 8)).astype(int))
    a1 = float(np.polyfit(np.log10(e1), np.log10(dfa(x, e1)), 1)[0])
    a2 = float(np.polyfit(np.log10(e2), np.log10(dfa(x, e2)), 1)[0])
    # the hour and the five minutes for the magnifiers: an hour in the middle of the record
    h0 = int(np.searchsorted(t, t[-1] * 0.35)); h1 = int(np.searchsorted(t, t[h0] + 1.0))
    m1 = int(np.searchsorted(t, t[h0] + 5 / 60))
    return {"n": len(x), "horas": round(float(t[-1]), 2), "latidos": np.round(x[:400], 3).tolist(), "dia": bins(x, 1200),
            "hora": bins(x[h0:h1], 600), "hora_en": [round(h0 / len(x), 4), round(h1 / len(x), 4)],
            "minutos": np.round(x[h0:m1], 3).tolist(), "dfa": {"lx": np.round(lx, 4).tolist(), "ly": np.round(ly, 4).tolist()},
            "a1": round(a1, 3), "a2": round(a2, 3)}


sano, ic = serie("nsr018"), serie("chf223")
x, _ = nn("nsr018")
A = json.loads((RAIZ / "datos" / "auditoria_corazon.json").read_text())
grupos = {g: [[r["alfa1"], r["alfa2"], r["edad"]] for r in A["registros"][g] if r["incluido"]] for g in ("nsr2db", "chf2db")}
# for the infinite zoom: every healthy interval, and the Spain–Portugal border of chapter III (the longest piece, km)
FR = json.loads((RAIZ / "src" / "cap3_datos.json").read_text())["espana_portugal"]["piezas"][1]
xi, _ = nn("chf223")
out = {"todoIC": np.round(xi, 3).tolist(), "todo": np.round(x, 3).tolist(), "frontera": FR, "sano": sano, "ic": ic, "tramo": np.round(x[1000:1064], 3).tolist(), "grupos": grupos, "comparaciones": A["comparaciones"]}
(RAIZ / "src" / "cap5_datos.json").write_text(json.dumps(out, separators=(",", ":")))
print("sano", sano["n"], sano["horas"], sano["a1"], sano["a2"], "| ic", ic["n"], ic["horas"], ic["a1"], ic["a2"], "| grupos", {k: len(v) for k, v in grupos.items()})
