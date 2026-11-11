"""Score of chapter III «La medida de lo irregular» (public/audio/cap3.wav), on src/cap3.json. The same palette as the
opening and chapters I-II (audio/dune.py, D Phrygian dominant): a heartbeat-like pulse, a clean sub, braams and booms,
the female voice, tuned pulses, reverse swells. (A chamber palette was tried and rejected: audio/camara.py is kept
only as history.)

- Title: a tuned pulse on every step of the dividers, a swell as the camera pulls back, the braam on the title.
- Richardson: the voice low over the watercolour; a muffled boom on «guerra»; a shimmer on the frontispiece.
- Europe and its borders: a pulse climbing as the borders light up.
- Two figures: every figure lands on a pulse and a drum.
- Three steps: a drum ostinato that pushes; every step of the 80 and 20 km dividers is a tuned pulse (the 5 km steps
  a soft high tick); the arrival on a braam.
- The 49th parallel: the same; the arrival on a resolved chord of the voice.
- The law: a pulse per point; the panel on the sub; the largest braam when the law is named.
- The rivers: the voice high, a long swell; a boom on «agua».
- The range: pulses spacing out over the stones; bells at every ×3 of Koch.
- Close: the rivers drawing themselves on a rising swell and the voice; a boom on «crecen»; a last heartbeat.

Usage: PYTHONPATH=pylib python3 audio/sonido_cap3.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, filtro, hz, norm, oleaje, poner, sub, t_, voz  # noqa: E402

K = json.loads((RAIZ / "src" / "cap3.json").read_text())
V = json.loads((RAIZ / "src" / "cap3_voz.json").read_text())
D = json.loads((RAIZ / "src" / "cap3_datos.json").read_text())
VZ = K["voz"]
N = int(K["total"] * SR) + SR
fin = K["total"]
m = np.zeros((N, 2))


def leer(ruta):
    w = wave.open(str(ruta))
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float).reshape(-1, w.getnchannels()) / 32767


CORAZON = leer(RAIZ / "public" / "audio" / "corazon.wav")
ONSETS = json.loads((RAIZ / "public" / "audio" / "latidos_audio.json").read_text())


def latido(k):
    i = int((ONSETS[k] - 0.05) * SR)
    x = CORAZON[i:i + int(0.8 * SR), 0].copy() * np.linspace(1, 0, int(0.8 * SR)) ** 0.6
    x = filtro(x, corte_alto=700)
    t = t_(len(x))
    x = x + np.sin(2 * np.pi * 42 * t) * np.exp(-t * 14) * 0.5 * np.abs(x).max()
    return x / np.abs(x).max()


def pulso(f, dur=0.8):
    t = t_(int(dur * SR))
    env = (1 - np.exp(-t * 400)) * np.exp(-t * 6)
    return env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.6 * np.sin(np.pi * f * t))


def brillo(dur, caida=1.2):
    n = int(dur * SR); t = t_(n)
    x = sum(np.sin(2 * np.pi * hz(mm) * t + mm) for mm in (86, 90, 93, 98)) * 0.25
    x += 0.4 * filtro(np.random.default_rng(3).standard_normal(n), corte_bajo=4000, corte_alto=11000)
    return x * np.exp(-t * caida) * np.minimum(1, t / 0.02)


def suave(x):
    return x * x * (3 - 2 * x)


def pasos_en(t0, t1, nsteps):
    ts, k = [], 1
    for i in range(1, 4001):
        if suave(i / 4000) * nsteps >= k:
            ts.append(t0 + (t1 - t0) * i / 4000)
            k += 1
    return ts


def nsteps(med):
    return sum(len(c) - 1 for c in med["caminatas"])


ESCALA = [50, 51, 54, 55, 57, 58, 60, 62, 63, 66, 67, 69]

# ─── 0 · title ───
for i, g in enumerate(K["pasosTitulo"]):      # on the landing of every step (the point lights up at g + 0.55)
    poner(m, g + 0.55, con_reverb(pulso(hz([62, 63, 66, 67][i]), 1.0), SALA, 0.45), 0.32)
    poner(m, g + 0.55, con_reverb(bombo(0.45 + 0.05 * i), SALA_C, 0.25), 0.4)
poner(m, 0.2, sub(26, K["retrato"] + 1.0, ataque=2.0, sat=0.6), 0.24)
poner(m, K["pasosTitulo"][3] + 0.6, oleaje(K["titulo"] - K["pasosTitulo"][3] - 0.6), 0.45)
poner(m, K["titulo"], con_reverb(braam([26, 38, 45], 6.5, ataque=0.03, abre=0.9, brillo=1.0), SALA, 0.45), 0.85)
poner(m, K["titulo"], bombo(1.3), 0.95)
poner(m, K["titulo"] + 0.4, con_reverb(voz([(62, 2.0), (63, 1.0), (66, 2.5), (62, 2.5)], "a"), SALA, 0.55), 0.3)

# ─── 1 · Richardson ───
poner(m, K["retrato"], con_reverb(voz([(50, 4.0), (51, 2.0), (54, 4.0), (50, 5.0)], "o", vib=4.6), SALA, 0.6), 0.16)
poner(m, K["retrato"], con_reverb(sub(38, 16.0, ataque=3.0), SALA, 0.3), 0.2)
guerra = VZ[4] + [t for p, t in V[4]["palabras"] if p.strip(".,:").lower() == "guerra"][0]
poner(m, guerra, filtro(bombo(1.0), corte_alto=220), 0.55)
poner(m, K["cuadricula"], con_reverb(brillo(5.0, 0.5), SALA, 0.6), 0.2)
poner(m, K["cuadricula"] + 0.3, con_reverb(voz([(69, 2.5), (70, 2.0), (69, 3.0)], "a", vib=5.4), SALA, 0.6), 0.14)
poner(m, K["renuncia"], con_reverb(braam([38, 45], 4.0, ataque=0.8, abre=1.6, brillo=0.6), SALA, 0.4), 0.35)
for i in range(10):    # the borders of Europe lighting up
    poner(m, K["fichas"] + 0.6 + i * 1.1, con_reverb(pulso(hz(ESCALA[i % len(ESCALA)] + 12), 0.8), SALA, 0.5), 0.14)

# ─── 2 · two figures ───
poner(m, K["iberia"] - 0.6, oleaje(0.6), 0.3)
for t0, nota in zip(K["cifrasES"] + K["cifrasBN"], [62, 63, 66, 67]):
    poner(m, t0, con_reverb(pulso(hz(nota), 1.4), SALA, 0.45), 0.34)
    poner(m, t0, con_reverb(bombo(0.6), SALA_C, 0.25), 0.45)
for i in range(3):
    poner(m, K["hoy"] + 1.0 + i * 0.5, con_reverb(pulso(hz(69 + 3 * i), 1.0), SALA_C, 0.35), 0.24)

# ─── 3 · three steps ───
C0, LL = K["compases"], K["llegadas"]
poner(m, C0 - 1.0, oleaje(1.0), 0.4)
t, i = C0, 0
while t < LL[2] + 0.2:        # the drum ostinato, pushing
    crece = min(1, (t - C0) / 6)
    poner(m, t, con_reverb(bombo(0.45 + 0.25 * crece if i % 4 == 0 else 0.35), SALA_C, 0.25), 0.3 + 0.2 * crece)
    t += 60 / 112 / 2
    i += 1
for k, r in enumerate(("80", "20")):
    for j, tt in enumerate(pasos_en(C0 + 0.6, LL[k], nsteps(D["espana_portugal"]["medidas"][r]))):
        poner(m, tt, con_reverb(pulso(hz([50, 62][k] + [0, 3, 7, 10][j % 4]), 0.6), SALA_C, 0.3), [0.3, 0.16][k])
poner(m, C0, con_reverb(voz([(66, 3.0), (69, 2.5), (70, 3.0), (69, 3.5)], "o", vib=5.0), SALA, 0.6), 0.14)
T13 = K["terminos"][0][2]            # the term «LA MEDIDA DEPENDE DE LA REGLA» appears
poner(m, T13, con_reverb(braam([38, 45, 50], 5.0, ataque=0.05, abre=1.2, brillo=0.9), SALA, 0.45), 0.6)
poner(m, T13, bombo(1.2), 0.8)

# ─── 3b · the 49th parallel ───
P0, PL = VZ[14] + 1.0, K["llegaP"]
for k, r in enumerate(("80", "20")):
    for tt in pasos_en(P0, PL, nsteps(D["paralelo_49"]["medidas"][r])):
        poner(m, tt, con_reverb(pulso(hz([57, 69][k]), 0.5), SALA_C, 0.3), [0.22, 0.1][k])
for nota in (50, 57, 62, 66):     # resolved
    poner(m, PL + 0.1, con_reverb(voz([(nota, 5.0)], "o", vib=4.6), SALA, 0.6), 0.12)

# ─── 4 · the law ───
G = K["grafico"]
for i, nota in enumerate([67, 66, 63, 62, 58]):
    poner(m, G + 0.3 + i * 0.25, con_reverb(pulso(hz(nota), 1.0), SALA_C, 0.35), 0.28)
for i in range(5):
    poner(m, G + 1.8 + i * 0.25, con_reverb(pulso(hz(69), 1.0), SALA_C, 0.35), 0.22)
poner(m, K["panel"], con_reverb(sub(38, 8.0, ataque=1.0), SALA, 0.3), 0.3)
poner(m, K["panel"], con_reverb(brillo(4.0, 0.6), SALA, 0.5), 0.16)
for i, nota in enumerate([74, 72, 69, 69, 67, 62]):
    poner(m, K["abanico"] + 0.3 + i * 0.4, con_reverb(pulso(hz(nota), 1.4), SALA, 0.45), 0.26)
poner(m, K["retratos"], con_reverb(voz([(62, 3.0), (66, 2.0), (67, 3.0), (66, 4.0)], "a", vib=5.2), SALA, 0.6), 0.2)
dimf = K["terminos"][1][2]      # the term «LEY DE RICHARDSON» lands, with the two values
poner(m, dimf - 1.2, oleaje(1.2), 0.5)
poner(m, dimf - 0.1, con_reverb(braam([26, 38, 45, 50, 57], 7.0, ataque=0.03, abre=1.1, brillo=1.2), SALA, 0.5), 0.95)
poner(m, dimf - 0.1, bombo(1.5), 1.0)
poner(m, dimf + 0.1, con_reverb(voz([(81, 1.5), (82, 1.0), (78, 2.0), (74, 3.0)], "a", vib=6.0), SALA, 0.6), 0.34)

# ─── 5 · the rivers ───
R0 = K["rios"]
poner(m, R0, oleaje(K["agua"] - R0), 0.35)
poner(m, R0 + 0.5, con_reverb(voz([(74, 3.0), (78, 2.5), (76, 3.0), (74, 4.0)], "a", vib=5.6), SALA, 0.6), 0.2)
poner(m, K["agua"], con_reverb(braam([38, 45, 50], 5.0, ataque=0.05, abre=1.2, brillo=0.9), SALA, 0.45), 0.55)
poner(m, K["agua"], bombo(1.2), 0.75)

# ─── 6 · the range ───
poner(m, K["rango"], con_reverb(sub(38, K["escalas"] - K["rango"] + 2.0, ataque=1.5), SALA, 0.3), 0.24)
t, dt, j = K["escalas"], 0.6, 0
while t < K["koch"]:
    poner(m, t, con_reverb(pulso(hz([74, 69, 66, 62][j % 4]), 1.0), SALA, 0.45), 0.24)
    t += dt
    dt *= 1.2
    j += 1
Z0 = K["koch"] + 0.6
for k in range(1, 4):
    for i in range(1, 2001):
        u = i / 2000
        e = 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2
        if e >= k / 3:
            poner(m, Z0 + (K["cierre"] - K["koch"] - 1.6) * u, con_reverb(pulso(hz([74, 78, 81][k - 1]), 1.4), SALA, 0.55), 0.24)
            break

# ─── 7 · close ───
poner(m, K["cierre"], con_reverb(voz([(50, 4.0), (51, 2.0), (54, 4.0), (50, 6.0)], "o", vib=4.6), SALA, 0.6), 0.16)
poner(m, K["rio"], oleaje(VZ[29] - K["rio"]), 0.45)
poner(m, K["rio"], con_reverb(braam([41, 48], VZ[29] - K["rio"] + 0.3, ataque=2.5, abre=3.0, brillo=0.7), SALA, 0.4), 0.3)
poner(m, K["rio"] + 1.0, con_reverb(voz([(74, 2.0), (75, 1.0), (78, 2.5), (81, 3.0), (78, 4.0)], "a", vib=5.8), SALA, 0.6), 0.24)
crecen = VZ[29] + [t for p, t in V[29]["palabras"] if p.strip(".,:").lower() == "crecen"][0]
poner(m, crecen, con_reverb(braam([26, 38, 45], 5.0, ataque=0.03, abre=1.0, brillo=1.0), SALA, 0.5), 0.6)
poner(m, crecen, bombo(1.2), 0.8)
poner(m, fin - 1.6, latido(5), 0.7)

# under the voice, the bed steps back
tt = np.arange(N) / SR
duck = np.ones(N)
for a, v in zip(VZ, V):
    duck -= 0.42 * np.clip(np.minimum((tt - a + 0.3) / 0.3, (a + v["fin"] + 0.4 - tt) / 0.5), 0, 1)
m *= np.clip(duck, 0.45, 1)[:, None]
y = m[:int(fin * SR)]
y = y / max(1e-9, np.abs(y).max()) * 0.9
with wave.open(str(RAIZ / "public" / "audio" / "cap3.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo cap3.wav", f"{len(y) / SR:.1f} s")
