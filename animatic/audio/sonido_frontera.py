"""Sound for La frontera (public/audio/frontera.wav), on the timing grid src/frontera.json (DIRECCION-motion.md).

- Intro: a real heartbeat, a low drone that grows and a reversed swell into a deep impact when the first shot opens.
- Montage: a kick and a real heartbeat on every pulse, a chord progression whose filter opens as the heart speeds
  up, a pluck arpeggio that doubles in the climax and a tonal riser into the collapse (no whooshes).
- After the collapse: silence, one heartbeat, then a wide luminous ambience with a slow melodic motif under the voice,
  and a deep boom with an open chord that resolves on the title.

Usage: PYTHONPATH=pylib python3 audio/sonido_frontera.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ.parent.parent / "sonido-serie"))
from sonido import IR_GRANDE, IR_SALA, SR, con_reverb, filtro, hz, pad, pluck, rng, t_  # noqa: E402

M = json.loads((RAIZ / "src" / "frontera.json").read_text())
M["corte"] = M["colapso"]
M["calma"] = M["florece"]
L = [x for x in M["latidos"] if x < M["colapso"]]
TOTAL = M["total"]
N = int(TOTAL * SR)


def leer(ruta):
    w = wave.open(str(ruta))
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float).reshape(-1, w.getnchannels()) / 32767
    return x


CORAZON = leer(RAIZ / "public" / "audio" / "corazon.wav")
ONSETS = json.loads((RAIZ / "public" / "audio" / "latidos_audio.json").read_text())


def latido(k=3):
    i = int((ONSETS[k] - 0.06) * SR)
    x = CORAZON[i:i + int(0.85 * SR)].copy()
    x *= np.linspace(1, 0, len(x))[:, None] ** 0.5
    return x / np.abs(x).max()


def poner(dst, t0, x, g=1.0):
    x = np.stack([x, x], 1) if x.ndim == 1 else x
    i = int(t0 * SR)
    if i < 0:
        x = x[-i:]; i = 0
    k = min(len(x), len(dst) - i)
    if k > 0:
        dst[i:i + k] += x[:k] * g


def golpe(f=hz(30), dur=1.8, vel=1.0, clic=0.25):
    n = int(dur * SR); t = t_(n)
    fr = f * (1 + 2.2 * np.exp(-t * 38))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 3.0) * np.minimum(1, t / 0.003)
    x += filtro(rng.standard_normal(n), corte_bajo=1500, corte_alto=7000) * np.exp(-t * 60) * clic
    return filtro(x, corte_alto=2400) * vel


def impacto(dur=5.0):
    n = int(dur * SR); t = t_(n)
    sub = np.sin(2 * np.pi * np.cumsum(hz(26) * (1 + 1.5 * np.exp(-t * 6))) / SR) * np.exp(-t * 0.9)
    ruido = filtro(rng.standard_normal(n), corte_alto=900) * np.exp(-t * 2.5) * 0.6
    return con_reverb(sub + ruido, IR_GRANDE, 0.45)


def ascenso(dur, f0, f1):
    n = int(dur * SR); t = t_(n)
    p = t / dur
    f = f0 * (f1 / f0) ** (p ** 1.5)
    tono = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) + 0.25 * np.sin(2 * np.pi * np.cumsum(f * 2) / SR)
    return tono * 0.5 * p ** 2.4


def acorde(notas, dur, brillo=1400, ataque=1.0):
    return sum(pad(hz(m), dur, detune=0.08, brillo=brillo, ataque=ataque) for m in notas)


def hecho(m):
    izq = con_reverb(m[:, 0], IR_GRANDE, 0.26)[:N]
    der = con_reverb(m[:, 1], IR_GRANDE, 0.26)[:N]
    y = np.stack([izq[:, 0], der[:, 1]], 1)
    return y / np.abs(y).max() * 0.88


def montaje():
    m = np.zeros((N, 2))
    lr = latido()
    c = M["corte"]
    # ── bar 1: only the real heartbeat over a low drone ──
    for tb in L[:4]:
        poner(m, tb, lr, 1.0)
    dr = acorde([26, 38], L[4] + 0.6, brillo=300, ataque=1.2)
    poner(m, 0.0, dr * np.linspace(0.3, 1.0, len(dr)), 0.55)
    poner(m, L[4] - 0.85, ascenso(0.85, hz(40), hz(64)), 0.4)
    poner(m, L[4], impacto(4.0), 0.9)
    # ── progression: Dm9, Bbmaj7, Gm9, A7sus, changing every three beats; the filter opens with the heart ──
    prog = [[38, 50, 53, 57, 64], [34, 46, 50, 53, 57], [31, 43, 46, 50, 57], [33, 45, 50, 52, 55]]
    for k in range(4, len(L), 4):
        t0 = L[k]
        t1 = L[k + 4] if k + 4 < len(L) else c
        u = (t0 - L[0]) / (c - L[0])
        ch = acorde(prog[(k // 4 - 1) % 4], t1 - t0 + 0.6, brillo=600 + 3200 * u ** 1.3, ataque=0.12)
        poner(m, t0, ch * np.linspace(1, 0.85, len(ch)), 0.5 + 0.25 * u)
    # ── pulse: a kick and the real heartbeat; plucks that double in the climax ──
    escala = [62, 65, 69, 72, 74, 76, 77, 81]
    for k, tb in enumerate(L):
        if k < 4:
            continue
        u = k / len(L)
        poner(m, tb, golpe(vel=0.75 + 0.35 * u), 1.0)
        poner(m, tb, lr, 0.35)
        sub = 2 if k < 36 else 4
        iv = ((L[k + 1] if k + 1 < len(L) else c) - tb) / sub
        for j in range(sub):
            nota = escala[(k * 3 + j * 2) % len(escala)] + (12 if j % 2 and u > 0.5 else 0)
            poner(m, tb + j * iv, pluck(hz(nota), 0.25, dec=0.7), 0.16 + 0.1 * u)
    # ── riser into the collapse ──
    poner(m, c - 5.0, ascenso(5.0, hz(38), hz(74)), 0.55)
    # ── the collapse: hard silence, then one heartbeat with a long tail ──
    i0 = int(c * SR)
    m[i0:int(M["latidoSolo"] * SR)] = 0
    m[int(M["latidoSolo"] * SR):] = 0
    poner(m, M["latidoSolo"], con_reverb(lr[:, 0], IR_GRANDE, 0.5), 1.0)
    # ── ending: wide luminous ambience and a slow motif under the voice ──
    a0, tt = M["calma"], M["titulo"]
    amb = acorde([38, 50, 57, 62, 64, 66, 69], tt - a0 + 0.4, brillo=1500, ataque=3.5)
    poner(m, a0, amb * np.linspace(0.6, 1.0, len(amb))[:, None] if amb.ndim > 1 else amb * np.linspace(0.6, 1.0, len(amb)), 0.42)
    motivo = [74, 78, 81, 76, 74, 69, 71, 78, 81, 83, 81, 76]
    tm = M["voz"] + 0.8
    k = 0
    while tm < tt - 1.5:
        poner(m, tm, con_reverb(pluck(hz(motivo[k % len(motivo)]), 0.3, dec=2.2), IR_GRANDE, 0.55), 0.22)
        if k % 4 == 0:
            poner(m, tm, con_reverb(pluck(hz(motivo[k % len(motivo)] - 12), 0.25, dec=2.5), IR_GRANDE, 0.5), 0.14)
        tm += 1.55
        k += 1
    poner(m, tt - 3.0, ascenso(3.0, hz(50), hz(74)), 0.25)
    # ── the title: a deep boom and an open chord that resolves ──
    poner(m, tt, impacto(5.0), 1.1)
    fin = acorde([26, 38, 50, 57, 62, 66, 69, 74], TOTAL - tt, brillo=2600, ataque=0.06)
    poner(m, tt, fin * np.linspace(1, 0, len(fin)) ** 1.4, 0.75)
    for j, nota in enumerate([74, 78, 81, 86]):
        poner(m, tt + 0.05 + j * 0.09, con_reverb(pluck(hz(nota), 0.35, dec=3.0), IR_GRANDE, 0.6), 0.25)
    y = hecho(m)
    with wave.open(str(RAIZ / "public" / "audio" / "frontera.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
    print("listo frontera.wav", f"{len(y) / SR:.1f} s")


if __name__ == "__main__":
    montaje()
