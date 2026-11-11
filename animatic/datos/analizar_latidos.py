"""RR intervals and DFA from PhysioNet beat annotations (nsr2db and chf2db, 128 Hz).

Reads MIT-format .ecg annotation files, keeps normal-to-normal intervals, computes detrended fluctuation
analysis for every record (to check the group difference honestly) and exports the two chosen records for the
video to ../public/datos/latidos.json.

Usage: PYTHONPATH=../../../pylib python3 analizar_latidos.py
"""
import json
from pathlib import Path

import numpy as np

AQUI = Path(__file__).parent
DESC = AQUI / "descargas"
SALIDA = AQUI.parent / "public" / "datos"
FS = 128.0
NORMAL = 1  # MIT annotation code for a normal beat


def leer_anotaciones(ruta):
    """Minimal reader for the MIT annotation format: returns (sample, code) pairs."""
    datos = np.fromfile(ruta, dtype="<u2")
    muestras, codigos = [], []
    t = 0
    i = 0
    while i < len(datos):
        w = int(datos[i]); codigo = w >> 10; delta = w & 0x3FF
        if codigo == 0 and delta == 0:
            break
        if codigo == 59:  # SKIP: next two words are a 32-bit interval (PDP-11 order)
            alto, bajo = int(datos[i + 1]), int(datos[i + 2])
            salto = (alto << 16) | bajo
            if salto >= 2 ** 31:
                salto -= 2 ** 32
            t += salto
            i += 3
            continue
        if codigo in (60, 61, 62):  # NUM, SUB, CHN
            i += 1
            continue
        if codigo == 63:  # AUX: delta bytes of text follow, padded to an even count
            i += 1 + (delta + 1) // 2
            continue
        t += delta
        muestras.append(t); codigos.append(codigo)
        i += 1
    return np.array(muestras), np.array(codigos)


def intervalos_nn(ruta):
    m, c = leer_anotaciones(ruta)
    rr = np.diff(m) / FS
    nn = (c[1:] == NORMAL) & (c[:-1] == NORMAL)
    rr = rr[nn]
    t = m[1:][nn] / FS
    ok = (rr > 0.3) & (rr < 2.0)  # drop physiologically impossible gaps (lead-off, missed beats)
    return t[ok], rr[ok]


def dfa(rr, escalas):
    y = np.cumsum(rr - rr.mean())
    F = []
    for n in escalas:
        k = len(y) // n
        seg = y[: k * n].reshape(k, n)
        x = np.arange(n)
        A = np.vstack([x, np.ones(n)]).T
        coef, *_ = np.linalg.lstsq(A, seg.T, rcond=None)
        res = seg - (A @ coef).T
        F.append(np.sqrt((res ** 2).mean()))
    return np.array(F)


def pendiente(escalas, F, lo, hi):
    m = (escalas >= lo) & (escalas <= hi)
    return float(np.polyfit(np.log10(escalas[m]), np.log10(F[m]), 1)[0])


ESCALAS = np.unique(np.round(np.logspace(np.log10(4), np.log10(2000), 32)).astype(int))


def resumen(db):
    filas = []
    for r in (DESC / f"{db}-RECORDS.txt").read_text().split():
        ruta = DESC / f"{r}.ecg"
        if not ruta.exists():
            continue
        t, rr = intervalos_nn(ruta)
        rr = rr[:100000]
        F = dfa(rr, ESCALAS)
        cab = (DESC / f"{r}.hea").read_text().split("\n")
        filas.append(dict(r=r, n=len(rr), a1=pendiente(ESCALAS, F, 4, 16), a2=pendiente(ESCALAS, F, 16, 2000), cab=" ".join(l for l in cab if l.startswith("#"))))
    return filas


if __name__ == "__main__":
    grupos = {db: resumen(db) for db in ("nsr2db", "chf2db")}
    for db, filas in grupos.items():
        a1 = np.array([f["a1"] for f in filas]); a2 = np.array([f["a2"] for f in filas])
        print(f"{db}: {len(filas)} records · alpha1 {a1.mean():.2f} ± {a1.std():.2f} · alpha2 {a2.mean():.2f} ± {a2.std():.2f}")
    for f in grupos["nsr2db"] + grupos["chf2db"]:
        print(f"  {f['r']}  n={f['n']:6d}  a1={f['a1']:.2f}  a2={f['a2']:.2f}  {f['cab']}")
    (AQUI / "resumen_dfa.json").write_text(json.dumps(grupos, indent=1, ensure_ascii=False))


def exportar(sano="nsr006", chf="chf209"):
    """Selection rule fixed in advance: same sex, closest age, first record in database order."""
    def serie(r):
        t, rr = intervalos_nn(DESC / f"{r}.ecg")
        cab = (DESC / f"{r}.hea").read_text()
        import re
        edad = int(re.search(r"Age:\s*(\d+)", cab)[1]); sexo = re.search(r"Sex:\s*(\w)", cab)[1]
        return dict(id=r, edad=edad, sexo=sexo, t=[round(float(x), 2) for x in t], rr=[round(float(x), 3) for x in rr]), rr
    S, rs = serie(sano)
    Cc, rc = serie(chf)
    Fs = dfa(rs[:100000], ESCALAS); Fc = dfa(rc[:100000], ESCALAS)
    grupos = json.loads((AQUI / "resumen_dfa.json").read_text())
    g = {db: dict(n=len(f), a1=float(np.mean([x["a1"] for x in f])), sd=float(np.std([x["a1"] for x in f]))) for db, f in grupos.items()}
    out = dict(sano=S, chf=Cc, dfa=dict(escalas=ESCALAS.tolist(), sano=Fs.tolist(), chf=Fc.tolist(),
               a1s=pendiente(ESCALAS, Fs, 4, 16), a1c=pendiente(ESCALAS, Fc, 4, 16), a2s=pendiente(ESCALAS, Fs, 16, 2000), a2c=pendiente(ESCALAS, Fc, 16, 2000)),
               grupo=g)
    SALIDA.mkdir(parents=True, exist_ok=True)
    (SALIDA / "latidos.json").write_text(json.dumps(out, separators=(",", ":")))
    print("exportado", sano, chf, g)


if __name__ == "__main__":
    exportar()
