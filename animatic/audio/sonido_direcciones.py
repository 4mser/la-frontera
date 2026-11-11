"""Provisional sound for the three opening directions, on the timing map src/direcciones.json.

Usage: PYTHONPATH=pylib python3 audio/sonido_direcciones.py  ->  public/audio/dir-A.wav, dir-B.wav, dir-C.wav
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ.parent.parent / "sonido-serie"))
from sonido import IR_GRANDE, IR_SALA, SR, con_reverb, filtro, hz, pad, pluck, rng, t_  # noqa: E402

D = json.loads((RAIZ / "src" / "direcciones.json").read_text())


def leer(ruta):
    w = wave.open(str(ruta))
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float).reshape(-1, w.getnchannels()) / 32767
    return x


CORAZON = leer(RAIZ / "public" / "audio" / "corazon.wav")
ONSETS = json.loads((RAIZ / "public" / "audio" / "latidos_audio.json").read_text())


def latido_real(k=3):
    """One real lub-dub from the heart recording (beat k of the track)."""
    i = int((ONSETS[k] - 0.06) * SR)
    x = CORAZON[i:i + int(0.85 * SR)].copy()
    x *= np.linspace(1, 0, len(x))[:, None] ** 0.5
    return x / np.abs(x).max()


def golpe(f=hz(31), dur=2.2, vel=1.0):
    n = int(dur * SR); t = t_(n)
    fr = f * (1 + 1.2 * np.exp(-t * 30))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 2.4) * np.minimum(1, t / 0.004)
    return filtro(x, corte_alto=320) * vel


def acorde(notas, dur, brillo=1400, ataque=1.5):
    return sum(pad(hz(m), dur, detune=0.08, brillo=brillo, ataque=ataque) for m in notas)


def poner(dst, t0, x, g=1.0):
    x = np.stack([x, x], 1) if x.ndim == 1 else x
    i = int(t0 * SR)
    k = min(len(x), len(dst) - i)
    if k > 0:
        dst[i:i + k] += x[:k] * g


def ascenso(dur, f0=hz(38), f1=hz(62)):
    """A riser: filtered noise and a gliding tone that climb together."""
    n = int(dur * SR); t = t_(n)
    p = t / dur
    f = f0 * (f1 / f0) ** (p ** 1.6)
    tono = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    aire = filtro(rng.standard_normal(n), corte_bajo=300, corte_alto=5000) * 0.25
    return (tono * 0.6 + aire) * p ** 2.2


def cortar(m, a, b):
    i, j = int(a * SR), int(b * SR)
    m[i:j] = 0


def final(m, nombre, total):
    m = con_reverb(m[:, 0], IR_GRANDE, 0.28)[: int(total * SR)] * 0.5 + con_reverb(m[:, 1], IR_GRANDE, 0.28)[: int(total * SR)] * 0.5
    m = m / np.abs(m).max() * 0.85
    with wave.open(str(RAIZ / "public" / "audio" / (f"dir-{nombre}.wav" if len(nombre) == 1 else f"{nombre}.wav")), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(m, -1, 1) * 32767).astype("<i2").tobytes())
    print("listo", nombre)


def titulo(m, t0):
    poner(m, t0, golpe(hz(26), 4.0, 1.0), 1.0)
    ch = acorde([38, 50, 57, 62, 64, 69], 4.0, brillo=2400, ataque=0.08)
    poner(m, t0, ch * np.linspace(1, 0, len(ch)) ** 1.2, 0.9)


def dir_a():
    A = D["A"]; m = np.zeros((int(A["total"] * SR), 2))
    lr = latido_real()
    poner(m, 0.3, lr, 0.8)
    dur = A["corte"] - A["inmersion"]
    poner(m, A["inmersion"], ascenso(dur), 0.45)
    poner(m, A["inmersion"], acorde([50, 57, 61, 64, 69, 73], dur, brillo=900, ataque=0.05) * np.linspace(0.4, 1.0, int(dur * SR)), 0.7)
    for k, tb in enumerate(A["latidos"]):
        poner(m, tb, golpe(vel=0.6 + 0.4 * k / len(A["latidos"])), 0.9)
        poner(m, tb, lr, 0.35)
    for tt in np.sort(rng.uniform(A["inmersion"] + 3, A["corte"], 90)):
        poner(m, tt, pluck(hz(rng.choice([74, 76, 78, 81, 85, 86, 88])), 0.15, dec=0.8), 0.25 * (tt - A["inmersion"]) / dur)
    cortar(m, A["corte"], A["latidoSolo"] - 0.01)
    poner(m, A["latidoSolo"], lr, 1.0)
    poner(m, A["voz"] - 0.6, acorde([38, 45], A["titulo"] - A["voz"] + 0.6, brillo=500, ataque=1.0), 0.35)
    titulo(m, A["titulo"])
    final(m, "A", A["total"])


def dir_b():
    B = D["B"]; m = np.zeros((int(B["total"] * SR), 2))
    cor = CORAZON[int(0.2 * SR): int((0.2 + B["corte"] + 0.4) * SR)]
    poner(m, 0.4, cor, 1.0)
    largo = B["corte"] - 1.0
    pd = acorde([38, 50, 57, 61, 64, 66], largo, brillo=1200, ataque=4.0)
    poner(m, 1.0, pd * np.linspace(0.5, 1.0, len(pd)), 0.8)
    poner(m, B["sube"], ascenso(B["corte"] - B["sube"], hz(50), hz(74)), 0.35)
    alto = acorde([74, 78, 81], B["corte"] - B["sube"], brillo=3600, ataque=2.0)
    poner(m, B["sube"], alto, 0.35)
    cortar(m, B["corte"], B["titulo"] - 0.01)
    titulo(m, B["titulo"])
    final(m, "B", B["total"])


def dir_c():
    C = D["C"]; m = np.zeros((int(C["total"] * SR), 2))
    lr = latido_real()
    dur = C["corte"] - C["latidos"][0]
    poner(m, C["latidos"][0], ascenso(dur, hz(33), hz(57)), 0.5)
    dr = acorde([38, 45, 50], dur, brillo=700, ataque=0.5)
    poner(m, C["latidos"][0], dr * np.linspace(0.5, 1.0, len(dr)), 0.6)
    for k, tb in enumerate(C["latidos"]):
        poner(m, tb, golpe(vel=0.7 + 0.3 * k / len(C["latidos"])), 1.0)
        poner(m, tb, lr, 0.45)
        poner(m, tb, pluck(hz([62, 66, 69, 74, 78, 81][k % 6]), 0.2, dec=0.5), 0.3)
    cortar(m, C["corte"], C["calma"])
    calma = C["titulo"] - C["calma"]
    pd = acorde([50, 57, 61, 64, 69], calma, brillo=1600, ataque=2.5)
    poner(m, C["calma"], pd, 0.55)
    titulo(m, C["titulo"])
    final(m, "C", C["total"])


if __name__ == "__main__" and "montaje" not in sys.argv[1:]:
    dir_a(); dir_b(); dir_c()


def trueno(dur=3.5):
    n = int(dur * SR); t = t_(n)
    crack = filtro(rng.standard_normal(n), corte_bajo=900, corte_alto=7000) * np.exp(-t * 18)
    rumor = filtro(rng.standard_normal(n), corte_alto=180) * np.exp(-t * 1.2) * (1 - np.exp(-t * 6)) * 3.0
    return crack * 0.6 + rumor


def montaje():
    M = json.loads((RAIZ / "src" / "montaje.json").read_text())
    m = np.zeros((int(M["total"] * SR), 2))
    lr = latido_real()
    L = M["latidos"]
    dur = M["corte"] - L[0]
    poner(m, L[0], ascenso(dur, hz(33), hz(57)), 0.5)
    dr = acorde([38, 45, 50], dur, brillo=700, ataque=0.5)
    poner(m, L[0], dr * np.linspace(0.5, 1.0, len(dr)), 0.6)
    poner(m, 0.15, lr, 0.7)
    for k, tb in enumerate(L):
        poner(m, tb, golpe(vel=0.7 + 0.3 * k / len(L)), 1.0)
        poner(m, tb, lr, 0.45)
        poner(m, tb, pluck(hz([62, 66, 69, 74, 78, 81][k % 6]), 0.2, dec=0.5), 0.3)
    # the lightning shot: a crack when the stroke lands, thunder after
    poner(m, L[0] + (L[1] - L[0]) * 0.34, trueno(), 0.55)
    cortar(m, M["corte"], M["latidoSolo"] - 0.01)
    poner(m, M["latidoSolo"], lr, 1.0)
    calma = M["titulo"] - M["calma"]
    pd = acorde([50, 57, 61, 64, 69], calma, brillo=1600, ataque=3.0)
    poner(m, M["calma"], pd, 0.5)
    titulo(m, M["titulo"])
    final(m, "montaje", M["total"])


if __name__ == "__main__" and "montaje" in sys.argv[1:]:
    montaje()
