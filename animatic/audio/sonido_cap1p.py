"""Score of the chapter 1 preview (public/audio/cap1p.wav), on src/cap1p.json. An original piece in the manner of a
desert-epic «herald» cue (deep chant drone, a pulse like a heart that drives the build, a female voice that climbs,
one huge arrival): no borrowed melody, our own instruments (audio/dune.py), D Phrygian dominant.

- Two real heartbeats in the dark; a deep chanted drone rises out of them; a reverse swell lands on the title's braam.
- Over the title, the female voice, low and slow.
- Under the explained rule, almost nothing: the drone, and one sound per step (the number, the turn, the push).
- The loop: every turn of the rule is a drum hit and a tuned pulse, faster and faster; the voice comes back, higher.
- The cloud: the drums double, a swell grows; on the reveal, the largest braam, the voice at the top, a choir chord.

Usage: PYTHONPATH=pylib python3 audio/sonido_cap1p.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, _linea, bombo, braam, con_reverb, filtro, hz, norm, oleaje, poner, sub, t_, voz  # noqa: E402

K = json.loads((RAIZ / "src" / "cap1p.json").read_text())
V = json.loads((RAIZ / "src" / "cap1p_voz.json").read_text())
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


def canto(nota, dur):
    """A deep chanted drone: a low voice on «u», saturated so its overtones sing, slowly breathing."""
    x = _linea([(nota, dur)], 0.0, "u")
    x = np.tanh(2.2 * x)
    t = t_(len(x))
    return norm(x) * (1 + 0.25 * np.sin(2 * np.pi * 0.09 * t)) * np.minimum(1, t / 3.0)


def pulso(f, dur=0.8):
    t = t_(int(dur * SR))
    env = (1 - np.exp(-t * 400)) * np.exp(-t * 6)
    return env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.6 * np.sin(np.pi * f * t))


def giro(dur, f0, f1):
    """A soft rising glide for the turn of z → z²."""
    n = int(dur * SR); t = t_(n)
    f = f0 * (f1 / f0) ** (t / dur)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return x * np.sin(np.pi * t / dur) ** 1.5


def brillo(dur):
    """A high shimmer: filtered noise and a cluster of high partials, for the cloud lighting up."""
    n = int(dur * SR); t = t_(n)
    x = sum(np.sin(2 * np.pi * hz(m) * t + m) for m in (86, 90, 93, 98)) * 0.25
    x += 0.4 * filtro(np.random.default_rng(3).standard_normal(n), corte_bajo=4000, corte_alto=11000)
    return x * np.exp(-t * 1.2) * np.minimum(1, t / 0.02)


m = np.zeros((N, 2))
L1, L2 = K["latidos"]
poner(m, L1, latido(3), 1.0)
poner(m, L2, latido(4), 1.0)
fin = K["total"]
# the chant only where it means something (title, reveal, the border at the end), soft and filtered, so it never
# hums under the whole chapter; a clean sub under everything (no saturation: a saturated drone buzzes)
def canto_suave(nota, dur):
    x = filtro(canto(nota, dur), corte_alto=520)
    t = t_(len(x))
    return x * np.minimum(1, t / 1.5) * np.minimum(1, (dur - t) / 2.0)
for a0, a1 in [(L2, K["entra"][1]), (K["revela"] - 1.0, K["revela"] + 6.0), (K["frontera"] - 0.5, fin)]:
    poner(m, a0, con_reverb(canto_suave(38, a1 - a0), SALA, 0.4), 0.16)
poner(m, K["titulo"] - 0.2, sub(26, fin - K["titulo"] + 0.2, ataque=0.6, sat=0.6), 0.3)
# the title: a reverse swell, the braam and a boom; the voice low and slow over it
poner(m, K["titulo"] - 1.1, oleaje(1.1), 0.5)
poner(m, K["titulo"], con_reverb(braam([26, 38, 45], 7.0, ataque=0.03, abre=0.9, brillo=1.1), SALA, 0.45), 0.9)
poner(m, K["titulo"], bombo(1.4), 1.0)
poner(m, K["titulo"] + 0.4, con_reverb(voz([(62, 2.0), (63, 1.0), (66, 2.5), (62, 2.5)], "a"), SALA, 0.55), 0.36)
# the explained rule: one sound per step
P = K["paso"]
poner(m, P["z"], con_reverb(pulso(147, 1.2), SALA_C, 0.35), 0.35)
poner(m, P["cuadrado"][0], con_reverb(giro(P["cuadrado"][1] - P["cuadrado"][0], 147, 294), SALA, 0.4), 0.22)
poner(m, P["c"], con_reverb(bombo(0.6), SALA_C, 0.3), 0.45)
poner(m, P["c"] + 0.9, con_reverb(pulso(110, 1.2), SALA_C, 0.35), 0.3)
# the loop: a drum and a tuned pulse on every turn, climbing the scale; the voice returns, higher
escala = [50, 51, 54, 55, 57, 58, 60, 62, 63, 66, 67, 69, 70, 72]
for i, g in enumerate(K["golpes"]):
    poner(m, g, con_reverb(bombo(0.55 + 0.04 * i), SALA_C, 0.25), 0.7)
    poner(m, g, con_reverb(pulso(hz(escala[i % len(escala)]), 0.6), SALA_C, 0.3), 0.32)
poner(m, K["golpes"][2], con_reverb(voz([(69, 1.5), (70, 1.0), (74, 2.0)], "a", vib=5.8), SALA, 0.55), 0.3)
poner(m, K["golpes"][0], con_reverb(braam([38, 45], 4.0, ataque=1.2, abre=2.0, brillo=0.6), SALA, 0.4), 0.35)
# the cloud: a shimmer as thousands of points light up; the drums double; a swell into the reveal
poner(m, K["nube0"], con_reverb(brillo(3.0), SALA, 0.5), 0.35)
for i, g in enumerate(K["nube"]):
    poner(m, g, con_reverb(bombo(0.8 + 0.03 * i), SALA_C, 0.25), 0.75)
    if i < len(K["nube"]) - 1:
        poner(m, (g + K["nube"][i + 1]) / 2, con_reverb(bombo(0.45), SALA_C, 0.25), 0.5)
poner(m, K["nube"][0], oleaje(K["revela"] - K["nube"][0]), 0.6)
poner(m, K["nube"][0], con_reverb(braam([41, 48], K["revela"] - K["nube"][0] + 0.3, ataque=2.0, abre=3.0, brillo=0.7), SALA, 0.4), 0.4)
# the reveal: the largest braam, a boom, the voice at the top, a choir chord under it
R = K["revela"]
poner(m, R, con_reverb(braam([26, 38, 45, 50, 57], 8.0, ataque=0.02, abre=1.1, brillo=1.3), SALA, 0.5), 1.0)
poner(m, R, bombo(1.6), 1.0)
poner(m, R + 0.15, con_reverb(voz([(81, 1.5), (82, 1.0), (78, 2.0), (74, 3.0)], "a", vib=6.0), SALA, 0.6), 0.42)
for nota in (50, 57, 62, 66):
    poner(m, R + 0.3, con_reverb(voz([(nota, 6.5)], "o", vib=4.6), SALA, 0.6), 0.12)
# A · the dive: a swell into it, and a high chime at every ×e of magnification
ZA0, ZA1 = K["zoomA"]
poner(m, ZA0 - 1.6, oleaje(1.6), 0.3)
ez = lambda x: 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2
paso_b = 2.72                                  # a chime every ×e of magnification
k = 1
for i in range(1, 4000):
    tt = ZA0 + (ZA1 - ZA0) * i / 4000
    aum = K["zoomMax"] ** ez(i / 4000)
    if aum >= paso_b ** k:
        poner(m, tt, con_reverb(pulso(hz([74, 78, 81, 86][k % 4]), 1.4), SALA, 0.55), 0.22)
        k += 1
poner(m, ZA0, con_reverb(voz([(66, 2.0), (69, 2.0), (70, 2.5), (69, 3.0)], "o", vib=5.0), SALA, 0.6), 0.2)
# ─── what a fractal is ───
# the circle: a soft pad while the camera dives into its edge
poner(m, K["circulo"][0], con_reverb(voz([(62, 4.0), (57, 4.5)], "o", vib=4.6), SALA, 0.6), 0.16)
# Koch: the line, the thirds, then every level on a rising pulse; the snowflake closes on a braam and the voice
poner(m, K["lineaK"], con_reverb(pulso(147, 1.2), SALA_C, 0.35), 0.3)
poner(m, K["tercios"], con_reverb(pulso(220, 0.8), SALA_C, 0.3), 0.25)
for i, g in enumerate(K["nivelesK"]):
    poner(m, g, con_reverb(pulso(hz([57, 62, 64, 66, 69, 74][i % 6]), 1.0), SALA, 0.4), 0.32)
    poner(m, g, con_reverb(bombo(0.5 + 0.06 * i), SALA_C, 0.25), 0.45)
poner(m, K["copo"] + 0.6, con_reverb(braam([38, 45, 50], 5.0, ataque=0.4, abre=1.4, brillo=0.8), SALA, 0.45), 0.5)
poner(m, K["copo"] + 0.8, con_reverb(voz([(74, 1.5), (78, 1.5), (76, 2.0), (74, 2.5)], "a", vib=5.6), SALA, 0.6), 0.22)
# the part enlarged: a slow rising glide; «autosemejanza» on a soft chime
poner(m, K["parte"][0], con_reverb(giro(K["parte"][1] - K["parte"][0] - 1.0, 220, 660), SALA, 0.45), 0.16)
poner(m, K["voz"][18], con_reverb(pulso(hz(81), 1.6), SALA, 0.55), 0.2)
# Sierpiński: a hole on every beat, a falling note and a boom
for i, g in enumerate(K["nivelesS"]):
    poner(m, g, con_reverb(pulso(hz([74, 72, 69, 66, 64, 62][i]), 0.9), SALA, 0.4), 0.3)
    poner(m, g, con_reverb(bombo(0.5), SALA_C, 0.25), 0.4)
# the dive into Sierpiński's corner: a soft chime at every ×2
SZ0, SZ1 = K["sierZoom"]
k = 1
for i in range(1, 4000):
    if 2 ** (9 * ez(i / 4000)) >= 2 ** k:
        poner(m, SZ0 + (SZ1 - SZ0) * i / 4000, con_reverb(pulso(hz([69, 74, 78, 81][k % 4]), 1.2), SALA, 0.5), 0.18)
        k += 1
# the dive into the fern's leaf: a chime at every level (each leaf is the whole fern again)
HZ0, HZ1 = K["helechoZoom"]
for j in range(1, 5):
    poner(m, HZ0 + (HZ1 - HZ0) * (0.12 + 0.22 * (j - 1)), con_reverb(pulso(hz([69, 74, 78, 81][j - 1]), 1.4), SALA, 0.5), 0.2)
# the fern of four rules: a shimmer as its points rain in; the real fern: the voice, low
poner(m, K["helecho"] + 0.3, con_reverb(brillo(4.0), SALA, 0.5), 0.28)
poner(m, K["foto"], con_reverb(voz([(62, 2.5), (66, 2.0), (64, 3.0)], "o", vib=5.0), SALA, 0.6), 0.18)
# the border that grows: a climbing pulse on every step; «infinito» on a bright braam
for i, g in enumerate(K["nivelesL"]):
    poner(m, g, con_reverb(pulso(hz(57 + 3 * i), 0.8), SALA_C, 0.35), 0.3)
    poner(m, g, con_reverb(bombo(0.45 + 0.07 * i), SALA_C, 0.25), 0.4)
poner(m, K["infinito"] - 0.8, oleaje(0.8), 0.35)
poner(m, K["infinito"], con_reverb(braam([26, 38, 45, 50, 57], 5.0, ataque=0.03, abre=1.0, brillo=1.2), SALA, 0.5), 0.7)
poner(m, K["infinito"], bombo(1.2), 0.8)
poner(m, K["costa"], con_reverb(sub(38, 4.0, ataque=1.0), SALA, 0.3), 0.3)
# dimension: one note per panel, a click per copy that lands; the rule on a soft chime; «1,26» lit
for i, t0 in enumerate(K["panel"]):
    poner(m, t0 - 0.2, con_reverb(pulso(hz([62, 66, 69, 74][i]), 1.2), SALA, 0.4), 0.3)
    n, paso = [3, 9, 27, 4][i], [0.5, 0.3, 0.1, 0.5][i]
    for c in range(n):
        poner(m, t0 + 1.4 + paso * c, con_reverb(pulso(hz(81 + (2 * c) % 12), 0.3), SALA_C, 0.3), 0.14)
poner(m, K["regla"], con_reverb(pulso(hz(78), 1.6), SALA, 0.5), 0.22)
poner(m, K["d126"], con_reverb(pulso(hz(74), 1.8), SALA, 0.5), 0.3)
poner(m, K["regla2"], con_reverb(braam([38, 45, 50], 6.0, ataque=0.5, abre=1.6, brillo=0.9), SALA, 0.45), 0.55)
poner(m, K["regla2"] + 0.4, con_reverb(voz([(69, 1.5), (74, 1.5), (78, 2.5), (74, 3.0)], "a", vib=5.6), SALA, 0.6), 0.26)
# B · back to the rabbit, on a low braam; two neighbours jump: the one inside on a soft low note, the one outside climbing
poner(m, K["vuelta"], con_reverb(braam([38, 45], 3.5, ataque=0.8, abre=1.6, brillo=0.6), SALA, 0.4), 0.45)
# the point that stays: soft low notes, a chime when it is painted blue; the one that escapes: climbing notes, a
# warm chime; the sweep: a swell that grows as the rows are painted
for i, g in enumerate(K["saltosIn"]):
    poner(m, g, con_reverb(pulso(110 if i % 2 == 0 else 98, 1.0), SALA, 0.4), 0.26)
poner(m, K["pintaIn"], con_reverb(pulso(hz(74), 1.6), SALA, 0.5), 0.3)
for i, g in enumerate(K["saltosOut"]):
    poner(m, g, con_reverb(pulso(hz(62 + 3 * i), 0.7), SALA_C, 0.35), 0.28)
    poner(m, g, con_reverb(bombo(0.4 + 0.08 * i), SALA_C, 0.25), 0.4)
poner(m, K["pintaOut"], con_reverb(pulso(hz(81), 1.6), SALA, 0.5), 0.3)
# «haz lo mismo con cada punto»: a shimmer while the sample of points is painted
poner(m, K["muestra"][0] + 0.5, con_reverb(brillo(K["muestra"][1] - K["muestra"][0]), SALA, 0.5), 0.2)
B0, B1 = K["barrido"]
poner(m, B0, oleaje(K["frontera"] - B0), 0.4)                 # one swell, from the sweep into the border's braam
poner(m, B0, con_reverb(sub(45, B1 - B0 + 1.0, ataque=1.5), SALA, 0.3), 0.3)
# «El fractal es la frontera entre los dos»: the drawing returns in gold, on a braam and the voice
F = K["frontera"]
poner(m, F, con_reverb(braam([26, 38, 45, 50], 6.0, ataque=0.05, abre=1.2, brillo=1.0), SALA, 0.5), 0.75)
poner(m, F, bombo(1.2), 0.8)
poner(m, F + 0.2, con_reverb(voz([(74, 1.5), (75, 1.0), (74, 2.0), (69, 3.0)], "a", vib=5.6), SALA, 0.6), 0.32)
poner(m, fin - 1.4, latido(5), 0.7)
# under the voice, the bed steps back
tt = np.arange(N) / SR
duck = np.ones(N)
for a, v in zip(K["voz"], V):
    duck -= 0.42 * np.clip(np.minimum((tt - a + 0.3) / 0.3, (a + v["fin"] + 0.4 - tt) / 0.5), 0, 1)
m *= np.clip(duck, 0.45, 1)[:, None]
y = m[:int(fin * SR)]
y = y / max(1e-9, np.abs(y).max()) * 0.9
with wave.open(str(RAIZ / "public" / "audio" / "cap1p.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo cap1p.wav", f"{len(y) / SR:.1f} s")
