"""Score of chapter 2 «Entre la nada y el algo», first part (public/audio/cap2.wav), on src/cap2.json. Same family as
chapter 1 (audio/dune.py, D Phrygian dominant): a heartbeat, a clean sub, the chant only where it means something.

- The title: one heartbeat; a falling pulse and a drum each time the segment loses its middle thirds; the braam.
- Koch beside Mandelbrot: a chime at every ×3 (Koch is the same again each time).
- The dive to ×10¹⁵: a chime at every ×10, a long swell into the arrival on a copy of the set; the cloud, a shimmer.
- The Julia sets: one note per stop as the constant moves; the dust, falling notes.
- One piece or dust; the orbit of 0, inside (notes that settle) and outside (notes that climb).
- The map: a shimmer as the sample is painted, a swell under the sweep, a braam on the reveal; the mosaic, a shimmer.
- The map explored: one note per bulb; Tan Lei: a swell under the twin zoom; the border: the largest arrival.

Usage: PYTHONPATH=pylib python3 audio/sonido_cap2.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, _linea, bombo, braam, con_reverb, filtro, hz, norm, oleaje, poner, sub, t_, voz  # noqa: E402

K = json.loads((RAIZ / "src" / "cap2.json").read_text())
V = json.loads((RAIZ / "src" / "cap2_voz.json").read_text())
N = int(K["total"] * SR) + SR


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


def canto_suave(nota, dur):
    """The deep chant, filtered and soft, with a fade at both ends (never a hum under everything)."""
    x = np.tanh(2.2 * _linea([(nota, dur)], 0.0, "u"))
    t = t_(len(x))
    x = filtro(norm(x) * (1 + 0.25 * np.sin(2 * np.pi * 0.09 * t)), corte_alto=520)
    return x * np.minimum(1, t / 1.5) * np.minimum(1, (dur - t) / 2.0)


def pulso(f, dur=0.8):
    t = t_(int(dur * SR))
    env = (1 - np.exp(-t * 400)) * np.exp(-t * 6)
    return env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.6 * np.sin(np.pi * f * t))


def brillo(dur, caida=1.2):
    n = int(dur * SR); t = t_(n)
    x = sum(np.sin(2 * np.pi * hz(m) * t + m) for m in (86, 90, 93, 98)) * 0.25
    x += 0.4 * filtro(np.random.default_rng(3).standard_normal(n), corte_bajo=4000, corte_alto=11000)
    return x * np.exp(-t * caida) * np.minimum(1, t / 0.02)


ez = lambda x: 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2
m = np.zeros((N, 2))
fin = K["total"]
# 1 · the title
poner(m, K["segmento"][0], con_reverb(pulso(147, 1.4), SALA_C, 0.35), 0.3)
for i, g in enumerate(K["cantor"]):
    poner(m, g, con_reverb(pulso(hz([74, 72, 69, 66, 64, 62, 57][i]), 0.9), SALA, 0.45), 0.3)
    poner(m, g, con_reverb(bombo(0.45 + 0.05 * i), SALA_C, 0.25), 0.45)
poner(m, K["cantor"][0], con_reverb(canto_suave(38, K["titulo"] - K["cantor"][0] + 5.0), SALA, 0.4), 0.14)
poner(m, K["titulo"] - 1.1, oleaje(1.1), 0.5)
poner(m, K["titulo"], con_reverb(braam([26, 38, 45], 7.0, ataque=0.03, abre=0.9, brillo=1.1), SALA, 0.45), 0.9)
poner(m, K["titulo"], bombo(1.4), 1.0)
poner(m, K["titulo"] + 0.4, con_reverb(voz([(62, 2.0), (63, 1.0), (66, 2.5), (62, 2.5)], "a"), SALA, 0.55), 0.34)
poner(m, K["titulo"] - 0.2, sub(26, K["punto"] - K["titulo"] - 0.5, ataque=0.6, sat=0.6), 0.26)
# 2 · Koch beside Mandelbrot: a chime at every ×3 (to ×3⁷)
S0 = K["split"] + 1.5; S1 = K["splitFin"] - 0.6
poner(m, K["split"], con_reverb(braam([38, 45], 3.5, ataque=0.8, abre=1.6, brillo=0.6), SALA, 0.4), 0.4)
k = 1
for i in range(1, 4000):
    if 3 ** (7 * ez(i / 4000)) >= 3 ** k:
        poner(m, S0 + (S1 - S0) * i / 4000, con_reverb(pulso(hz([69, 74, 78, 81, 86, 81, 78][(k - 1) % 7]), 1.3), SALA, 0.5), 0.2)
        k += 1
poner(m, K["split"] + 1.0, con_reverb(voz([(66, 3.0), (69, 2.5), (70, 3.0), (69, 3.5)], "o", vib=5.0), SALA, 0.6), 0.16)
# the dive to ×10¹⁵: a chime at every ×10, a long rising swell, the voice high; the arrival on the braam
B0, B1 = K["buceo"]
sm = lambda x: x * x * (3 - 2 * x)
k = 1
for i in range(1, 6000):
    if 10 ** (15 * sm(i / 6000)) >= 10 ** k:
        poner(m, B0 + (B1 - B0) * i / 6000, con_reverb(pulso(hz([74, 78, 81, 86, 90][k % 5]), 1.2), SALA, 0.55), 0.14)
        k += 1
poner(m, B0, con_reverb(braam([38, 45], 4.0, ataque=1.0, abre=2.0, brillo=0.6), SALA, 0.4), 0.35)
poner(m, B0 + 4.0, con_reverb(voz([(69, 4.0), (70, 3.0), (74, 4.0), (75, 3.0), (74, 5.0)], "a", vib=5.4), SALA, 0.6), 0.14)
poner(m, B1 - 6.0, oleaje(6.0), 0.45)
poner(m, B1 - 6.0, con_reverb(braam([41, 48], 6.3, ataque=3.0, abre=3.0, brillo=0.7), SALA, 0.4), 0.3)
poner(m, B1, con_reverb(braam([26, 38, 45, 50], 7.0, ataque=0.03, abre=1.1, brillo=1.1), SALA, 0.5), 0.8)
poner(m, B1, bombo(1.4), 0.9)
poner(m, B1 + 0.2, con_reverb(voz([(78, 1.5), (81, 1.5), (78, 2.0), (74, 3.0)], "a", vib=5.8), SALA, 0.6), 0.3)
# the cloud: a soft shimmer
poner(m, K["nube"], con_reverb(brillo(5.0, 0.5), SALA, 0.6), 0.18)
poner(m, K["nube"], con_reverb(voz([(62, 3.0), (66, 2.5), (64, 4.0)], "o", vib=4.6), SALA, 0.6), 0.14)
# 3 · the Julia sets: one note per stop; the dust: falling notes
poner(m, K["julia"], con_reverb(braam([38, 45, 50], 4.0, ataque=0.6, abre=1.4, brillo=0.7), SALA, 0.45), 0.4)
for i, g in enumerate(K["paradas"]):
    poner(m, g, con_reverb(pulso(hz([62, 66, 69, 74, 78, 81][i]), 1.2), SALA, 0.45), 0.28)
for i in range(6):
    poner(m, K["polvo"] + 0.3 + 0.35 * i, con_reverb(pulso(hz([86, 81, 78, 74, 69, 66][i]), 0.9), SALA, 0.5), 0.18)
poner(m, K["polvo"] + 0.3, con_reverb(brillo(3.0), SALA, 0.5), 0.16)
# one piece or dust: a low note for the whole world, a high scatter for the dust
poner(m, K["lados"], con_reverb(sub(38, 5.0, ataque=1.0), SALA, 0.3), 0.3)
poner(m, K["voz"][10] + 4.6, con_reverb(brillo(3.0, 0.8), SALA, 0.5), 0.14)
# the question; Fatou and Julia: the 0 lights up; its orbit: soft notes that settle (inside), climbing notes (outside)
poner(m, K["pregunta"], con_reverb(voz([(62, 3.0), (63, 2.0), (62, 3.0)], "o", vib=4.6), SALA, 0.6), 0.14)
poner(m, K["orbitas"], con_reverb(pulso(hz(74), 2.0), SALA, 0.55), 0.35)
poner(m, K["orbitas"], con_reverb(bombo(0.7), SALA_C, 0.3), 0.5)
for i in range(9):
    poner(m, K["quedan"] + 0.32 * i, con_reverb(pulso(hz([62, 66, 69][i % 3]), 0.7), SALA, 0.45), 0.2)
for i in range(6):
    poner(m, K["escapa"] - 1.2 + 0.3 * i, con_reverb(pulso(hz(69 + 4 * i), 0.6), SALA_C, 0.35), 0.22)
# the map: a shimmer for the sample, a swell under the sweep into the reveal
poner(m, K["mapa"], con_reverb(sub(38, 4.0, ataque=1.0), SALA, 0.3), 0.3)
poner(m, K["voz"][14] + 0.6, con_reverb(brillo(K["barrido"][0] - K["voz"][14], 0.4), SALA, 0.5), 0.16)
B0 = K["barrido"][0]; R = K["revela"]
poner(m, B0, oleaje(R - B0), 0.45)
poner(m, B0, con_reverb(braam([41, 48], R - B0 + 0.3, ataque=2.0, abre=3.0, brillo=0.7), SALA, 0.4), 0.35)
poner(m, R, con_reverb(braam([26, 38, 45, 50, 57], 8.0, ataque=0.02, abre=1.1, brillo=1.3), SALA, 0.5), 1.0)
poner(m, R, bombo(1.6), 1.0)
poner(m, R + 0.15, con_reverb(voz([(81, 1.5), (82, 1.0), (78, 2.0), (74, 3.0)], "a", vib=6.0), SALA, 0.6), 0.4)
for nota in (50, 57, 62, 66):
    poner(m, R + 0.3, con_reverb(voz([(nota, 6.5)], "o", vib=4.6), SALA, 0.6), 0.12)
poner(m, R - 1.0, con_reverb(canto_suave(38, 8.0), SALA, 0.4), 0.14)
# the mosaic: a shimmer as the worlds appear on their constants
poner(m, K["mosaico"], con_reverb(brillo(5.0, 0.4), SALA, 0.6), 0.22)
poner(m, K["mosaico"] + 0.4, con_reverb(voz([(74, 2.0), (78, 2.0), (76, 3.0)], "a", vib=5.4), SALA, 0.6), 0.2)
# the map explored: one note per country, a deeper one outside; the antenna, three chimes
for i, n in enumerate([62, 57, 66, 69, 50]):
    poner(m, K["voz"][17 + i] - 0.8, con_reverb(pulso(hz(n), 1.6), SALA, 0.5), 0.3)
for j in range(3):
    poner(m, K["antena"] + 1.2 + 0.4 * j, con_reverb(pulso(hz([78, 81, 86][j]), 1.2), SALA, 0.5), 0.2)
poner(m, K["voz"][21] - 0.8, con_reverb(brillo(3.0, 0.8), SALA, 0.5), 0.14)
# Tan Lei: a swell under the twin zoom, a braam when the two shapes are one
T0, T1 = K["tanZoom"]
poner(m, K["tanLei"], con_reverb(braam([38, 45], 3.5, ataque=0.8, abre=1.6, brillo=0.6), SALA, 0.4), 0.35)
poner(m, T0, oleaje(T1 - T0), 0.4)
poner(m, T0, con_reverb(voz([(66, 2.0), (69, 2.0), (70, 2.0)], "a", vib=5.4), SALA, 0.6), 0.18)
poner(m, K["voz"][23], con_reverb(braam([26, 38, 45, 50], 6.0, ataque=0.05, abre=1.2, brillo=1.0), SALA, 0.5), 0.6)
poner(m, K["voz"][23] + 0.2, con_reverb(voz([(74, 1.5), (78, 1.5), (81, 2.5), (78, 3.0)], "a", vib=5.8), SALA, 0.6), 0.28)
# the meaning: inside (a warm low chord), outside (a faint scatter), the border (the largest arrival)
poner(m, K["dentro"], con_reverb(voz([(50, 4.0)], "o", vib=4.0), SALA, 0.6), 0.16)
poner(m, K["dentro"], con_reverb(voz([(57, 4.0)], "o", vib=4.2), SALA, 0.6), 0.12)
poner(m, K["fuera"], con_reverb(brillo(3.0, 0.9), SALA, 0.5), 0.14)
F = K["frontera"]
poner(m, F - 1.0, oleaje(1.0), 0.45)
poner(m, F, con_reverb(braam([26, 38, 45, 50, 57], 8.0, ataque=0.02, abre=1.1, brillo=1.2), SALA, 0.5), 0.9)
poner(m, F, bombo(1.6), 1.0)
poner(m, F + 0.2, con_reverb(voz([(74, 1.5), (75, 1.0), (74, 2.0), (69, 3.0)], "a", vib=5.6), SALA, 0.6), 0.34)
poner(m, K["dimFin"] - 0.5, con_reverb(canto_suave(38, K["punto"] - K["dimFin"] + 2.0), SALA, 0.4), 0.14)
# 4 · Cantor: a falling pulse and a drum on every cut; a chime on every length named; a chime at every ×9 of the dive
for i, g in enumerate(K["cortes"]):
    poner(m, g, con_reverb(pulso(hz([74, 72, 69, 66, 64, 62, 57][i]), 0.9), SALA, 0.45), 0.3)
    poner(m, g, con_reverb(bombo(0.45 + 0.05 * i), SALA_C, 0.25), 0.45)
for i, g in enumerate(K["largos"]):
    poner(m, g, con_reverb(pulso(hz([81, 78, 74, 62][i]), 1.4), SALA, 0.5), 0.22)
Z0, Z1 = K["cantorZoom"]
k = 1
for i in range(1, 4000):
    x = i / 4000
    if 9 ** (3.2 * (4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2)) >= 9 ** k:
        poner(m, Z0 + (Z1 - Z0) * x, con_reverb(pulso(hz([78, 81, 86][k % 3]), 1.2), SALA, 0.55), 0.18)
        k += 1
poner(m, K["voz"][41], con_reverb(voz([(69, 2.5), (74, 2.5), (73, 3.0)], "a", vib=5.4), SALA, 0.6), 0.16)
poner(m, K["polvoJ"], con_reverb(brillo(4.0, 0.6), SALA, 0.6), 0.18)
# the border line: the braam (F, above); the time that does not end: one tick per constant, higher and longer
for i, g in enumerate(K["marcas"]):
    poner(m, g, con_reverb(pulso(hz(62 + 4 * i), 0.6 + 0.3 * i), SALA, 0.45), 0.24)
    poner(m, g, con_reverb(bombo(0.4 + 0.06 * i), SALA_C, 0.25), 0.4)
poner(m, K["marcas"][1], oleaje(K["nunca"] - K["marcas"][1]), 0.35)
poner(m, K["nunca"], con_reverb(sub(26, 6.0, ataque=0.3), SALA, 0.35), 0.4)
poner(m, K["nunca"], con_reverb(voz([(74, 3.0), (69, 4.0)], "o", vib=4.6), SALA, 0.6), 0.16)
# 5 · dimension: a braam when the border lights; the area; then the border alone, and silence before the question
poner(m, K["dim0"], con_reverb(braam([38, 45, 50], 5.0, ataque=0.5, abre=1.4, brillo=0.8), SALA, 0.45), 0.45)
poner(m, K["areaIn"], con_reverb(voz([(50, 3.0)], "o", vib=4.0), SALA, 0.6), 0.16)
poner(m, K["soloBorde"], con_reverb(pulso(hz(81), 2.0), SALA, 0.6), 0.2)
poner(m, K["voz"][52], con_reverb(pulso(hz(74), 2.4), SALA, 0.6), 0.22)
# the asymptote: a chime at every ×10, slowly descending; the voice very high and soft; the sub thins out
A0, A1 = K["asintota"]
for j in range(1, 14):
    poner(m, A0 + (A1 - A0) * (0.075 + (j / 13) * 0.925) - 0.4, con_reverb(pulso(hz([86, 81, 78, 74][j % 4]), 1.6), SALA, 0.6), 0.12)
poner(m, A0 + 2.0, con_reverb(voz([(81, 5.0), (82, 3.0), (81, 5.0), (78, 6.0), (74, 8.0)], "a", vib=5.0), SALA, 0.65), 0.12)
# the point: one heartbeat in the dark; the question in silence
poner(m, K["punto"], latido(4), 0.8)
poner(m, K["punto"] + 1.6, latido(5), 0.5)
# Leibniz's medal: a soft shimmer and a high chime
poner(m, K["medalla"], con_reverb(brillo(4.0, 0.6), SALA, 0.6), 0.16)
poner(m, K["medalla"] + 0.3, con_reverb(pulso(hz(81), 2.0), SALA, 0.6), 0.2)
# the void: almost nothing, a low breath
poner(m, K["vacio"], con_reverb(sub(26, K["revela2"] - K["vacio"] + 1.0, ataque=3.0), SALA, 0.3), 0.22)
# the steps: one drum and one tuned pulse per step while they can be counted, then the steps rush into a swell
P1, P10, PI = K["pasos"]
golpes = [K["anillo1"]] + [P1 + 0.8 + (P10 - P1 - 0.8) * k / 9 for k in range(1, 10)]
escala = [50, 53, 57, 58, 62, 65, 69, 70, 74, 77]
for i, g in enumerate(golpes):
    poner(m, g, con_reverb(bombo(0.5 + 0.05 * i), SALA_C, 0.25), 0.6)
    poner(m, g, con_reverb(pulso(hz(escala[i]), 0.9), SALA, 0.45), 0.28)
tt = PI
for k in range(60):
    poner(m, tt, con_reverb(pulso(hz(74 + (k % 5) * 3), 0.3), SALA_C, 0.3), 0.08 + 0.002 * k)
    tt += max(0.03, 0.25 * (0.93 ** k))
    if tt > K["revela2"] - 0.1: break
poner(m, PI, oleaje(K["revela2"] - PI), 0.55)
poner(m, PI, con_reverb(braam([41, 48], K["revela2"] - PI + 0.3, ataque=1.5, abre=3.0, brillo=0.8), SALA, 0.4), 0.4)
R2 = K["revela2"]
poner(m, R2, con_reverb(braam([26, 38, 45, 50, 57], 8.0, ataque=0.02, abre=1.1, brillo=1.3), SALA, 0.5), 1.0)
poner(m, R2, bombo(1.6), 1.0)
poner(m, R2 + 0.2, con_reverb(voz([(81, 1.5), (82, 1.0), (78, 2.0), (74, 3.0)], "a", vib=6.0), SALA, 0.6), 0.4)
for nota in (50, 57, 62, 66):
    poner(m, R2 + 0.3, con_reverb(voz([(nota, 6.0)], "o", vib=4.6), SALA, 0.6), 0.12)
# the fast dive: a chime at every ×10 and a swell into the copy
D0, D1 = K["buceo2"]
k = 1
for i in range(1, 6000):
    x = i / 6000
    if 10 ** (15 * (4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2)) >= 10 ** k:
        poner(m, D0 + (D1 - D0) * x, con_reverb(pulso(hz([74, 78, 81, 86, 90][k % 5]), 1.0), SALA, 0.5), 0.14)
        k += 1
poner(m, D0, oleaje(D1 - D0), 0.45)
poner(m, D1, con_reverb(braam([26, 38, 45, 50], 7.0, ataque=0.03, abre=1.1, brillo=1.1), SALA, 0.5), 0.8)
poner(m, D1, bombo(1.4), 0.9)
# the rings again, on the copy: softer, slower, the voice high
A0, A1 = K["anillosMini"]
for i in range(10):
    poner(m, A0 + (A1 - A0) * (i / 10) ** 0.7, con_reverb(pulso(hz(escala[9 - i] + 12), 0.8), SALA, 0.5), 0.12)
poner(m, A0, con_reverb(voz([(86, 3.0), (81, 3.0), (78, 4.0)], "a", vib=5.4), SALA, 0.65), 0.16)
# the answer: a warm chord that stays to the end
F2 = K["voz"][38]
for nota in (38, 45, 50, 57, 62):
    poner(m, F2 - 0.5, con_reverb(voz([(nota, fin - F2 + 0.5)], "o", vib=4.2), SALA, 0.6), 0.1)
poner(m, F2 - 0.5, con_reverb(canto_suave(38, fin - F2 + 0.5), SALA, 0.4), 0.14)
poner(m, fin - 1.6, latido(5), 0.7)
# the pause before «¿Tiene área?»: the voice waits, the music only steps back a little (a full silence felt like a fault)
S0, S1 = K["silencio"]
tt0 = np.arange(N) / SR
m *= np.clip(1 - 0.25 * np.clip(np.minimum((tt0 - S0) / 0.8, (S1 - tt0) / 0.8), 0, 1), 0.75, 1)[:, None]
# under the voice, the bed steps back
tt = np.arange(N) / SR
duck = np.ones(N)
for a, v in zip(K["voz"], V):
    if a < 0:
        continue
    duck -= 0.42 * np.clip(np.minimum((tt - a + 0.3) / 0.3, (a + v["fin"] + 0.4 - tt) / 0.5), 0, 1)
m *= np.clip(duck, 0.45, 1)[:, None]
y = m[:int(fin * SR)]
y = y / max(1e-9, np.abs(y).max()) * 0.9
with wave.open(str(RAIZ / "public" / "audio" / "cap2.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo cap2.wav", f"{len(y) / SR:.1f} s")
