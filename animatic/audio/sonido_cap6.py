"""Score of chapter VI «La misma regla, en el tiempo» (public/audio/cap6.wav), on src/cap6.json. The same palette as
the opening and chapters I-V (audio/dune.py); every visible event has its sound.

- Title: a soft tick for each jump of the orbit; the braam on the title.
- The question and Richardson: a low chord; a pulse on the portrait.
- Lorenz: a pulse on the portrait; the two forecasts as two held voices that drift apart in pitch; a braam when the
  forecasts no longer resemble each other; a shimmer as the wings draw.
- The two populations: soft ticks for the points, a pulse when the chaotic pair parts.
- The same rule: a low swell as the Mandelbrot appears; a rising swell under the transformation and a braam when the
  diagram lands under the axis; a pulse on each link; a braam and the voice on the two copies.
- Feigenbaum: a pulse on each doubling line, higher each time; a pulse on the measured value.
- Close: a pulse as the ball of points is born; a long swell while they spread and draw the wings; a braam on
  the conclusion; a soft chord under the question; a last low braam.

Usage: PYTHONPATH=pylib python3 audio/sonido_cap6.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, filtro, hz, oleaje, poner, sub, t_, voz  # noqa: E402

K = json.loads((RAIZ / "src" / "cap6.json").read_text())
V = json.loads((RAIZ / "src" / "cap6_voz.json").read_text())
VZ = K["voz"]
fin = K["total"]
N = int(fin * SR) + SR
m = np.zeros((N, 2))


def pulso(f, dur=0.8):
    t = t_(int(dur * SR))
    env = (1 - np.exp(-t * 400)) * np.exp(-t * 6)
    return env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.6 * np.sin(np.pi * f * t))


def _b(dur, caida=1.2):
    n = int(dur * SR); t = t_(n)
    x = sum(np.sin(2 * np.pi * hz(mm) * t + mm) for mm in (86, 90, 93, 98)) * 0.25
    x += 0.4 * filtro(np.random.default_rng(3).standard_normal(n), corte_bajo=4000, corte_alto=11000)
    return x * np.exp(-t * caida) * np.minimum(1, t / 0.02)


def p(t, nota, dur=1.0, vol=0.26, sala=SALA_C, mezcla=0.35):
    poner(m, t, con_reverb(pulso(hz(nota), dur), sala, mezcla), vol)


ESCALA = [50, 54, 55, 57, 58, 62, 63, 66, 67, 69, 74, 75, 78]
poner(m, 0.3, sub(26, fin - 0.3, ataque=2.0, sat=0.6), 0.2)
# title: the orbit jumps every 0,18 s from 0,5 s
for i in range(int((K["titulo"] - 0.5) / 0.18)):
    p(0.5 + 0.18 * (i + 1), 74 + (i * 5) % 12, 0.3, 0.05)
poner(m, K["titulo"] - 1.2, oleaje(1.2), 0.45)
poner(m, K["titulo"], con_reverb(braam([26, 38, 45], 6.5, ataque=0.03, abre=0.9, brillo=1.0), SALA, 0.45), 0.85)
poner(m, K["titulo"], bombo(1.3), 0.95)
poner(m, K["titulo"] + 0.4, con_reverb(voz([(62, 2.0), (63, 1.0), (66, 2.5), (62, 2.5)], "a"), SALA, 0.55), 0.3)
# the question, Richardson
poner(m, VZ[0], con_reverb(voz([(50, 3.0), (51, 2.0)], "o", vib=4.6), SALA, 0.6), 0.14)
p(VZ[1] - 0.2, 57, 1.8, 0.28, SALA, 0.5)
# Lorenz
p(K["lorenz"], 62, 1.8, 0.28, SALA, 0.5)
a, b = K["separa"]
poner(m, K["anecdota"], con_reverb(voz([(69, b - K["anecdota"])], "o", vib=3.0), SALA, 0.5), 0.1)
poner(m, K["anecdota"], con_reverb(voz([(69, (b - K["anecdota"]) * 0.5), (70, (b - K["anecdota"]) * 0.3), (63, (b - K["anecdota"]) * 0.2)], "a", vib=3.0), SALA, 0.5), 0.1)
poner(m, a, oleaje(b - a), 0.35)
poner(m, b - 0.1, con_reverb(braam([26, 38, 45], 5.0, ataque=0.03, abre=1.0, brillo=1.0), SALA, 0.5), 0.6)
poner(m, b - 0.1, bombo(1.2), 0.7)
poner(m, K["alas"], con_reverb(_b(4.0, 0.6), SALA, 0.5), 0.14)
for i, nota in enumerate((62, 66, 69)):          # the three equations
    p(K["ecuaciones"] + i * 0.5, nota, 1.2, 0.24, SALA, 0.45)
# the two populations
for i in range(40):
    p(VZ[7] + 2.0 + 6.0 * i / 40, 81, 0.25, 0.04)
    p(VZ[8] + 0.6 + 6.0 * i / 40, 74 + (i % 3), 0.25, 0.05)
p(VZ[8] + 0.6 + 6.0 * 0.45, 51, 2.0, 0.26, SALA, 0.5)
# the same rule
poner(m, K["mandel"], con_reverb(voz([(50, 4.0), (57, 4.0)], "o", vib=4.0), SALA, 0.6), 0.14)
t0, t1 = K["transforma"]
poner(m, t0, oleaje(t1 - t0), 0.45)
poner(m, t0, con_reverb(braam([38, 45], t1 - t0, ataque=t1 - t0 - 0.5, abre=3.0, brillo=1.0), SALA, 0.4), 0.3)
poner(m, t1, con_reverb(braam([26, 38, 45, 50], 6.0, ataque=0.03, abre=1.0, brillo=1.0), SALA, 0.5), 0.8)
poner(m, t1, bombo(1.4), 0.9)
for i, nota in enumerate((62, 66, 69, 74)):
    p(K["enlaces"] + i * 0.8, nota, 1.2, 0.26, SALA, 0.45)
poner(m, K["copia"], con_reverb(braam([38, 45, 50, 57], 5.0, ataque=0.05, abre=1.2, brillo=1.1), SALA, 0.45), 0.55)
poner(m, K["copia"], con_reverb(voz([(74, 1.5), (78, 1.0), (81, 3.0)], "a", vib=5.8), SALA, 0.6), 0.24)
# Feigenbaum
p(K["feigen"], 57, 1.8, 0.28, SALA, 0.5)
for i in range(6):
    p(VZ[12] + 3.0 + i * 0.6, ESCALA[4 + i], 1.0, 0.24)
p(K["libchaber"], 50, 2.0, 0.28, SALA, 0.5)
p(K["libchaber"] + 3.0, 62, 1.6, 0.3, SALA, 0.45)
# close: the ball is born on a pulse; a long swell while the points spread and draw the wings; a braam when the
# conclusion lands; the question on a soft chord; a last low braam
p(K["nube"], 62, 2.0, 0.3, SALA, 0.5)
poner(m, K["nube"], oleaje(K["conclusion"] - K["nube"]), 0.35)
poner(m, K["nube"] + 2.0, con_reverb(braam([38, 45], K["conclusion"] - K["nube"] - 2.0, ataque=K["conclusion"] - K["nube"] - 4.0, abre=3.0, brillo=0.9), SALA, 0.4), 0.3)
poner(m, VZ[16] + 4.0, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 4.0)], "a", vib=5.4), SALA, 0.6), 0.22)
poner(m, K["conclusion"], con_reverb(braam([26, 38, 45, 50], 6.0, ataque=0.03, abre=1.0, brillo=1.0), SALA, 0.5), 0.75)
poner(m, K["conclusion"], bombo(1.4), 0.85)
poner(m, VZ[18] + 0.4, con_reverb(voz([(62, 3.0), (66, 2.0), (69, 4.0)], "o", vib=4.6), SALA, 0.6), 0.18)
poner(m, fin - 4.5, con_reverb(braam([26, 38, 45], 4.5, ataque=1.5, abre=1.5, brillo=0.8), SALA, 0.5), 0.35)

tt = np.arange(N) / SR
duck = np.ones(N)
for a, v in zip(VZ, V):
    duck -= 0.42 * np.clip(np.minimum((tt - a + 0.3) / 0.3, (a + v["fin"] + 0.4 - tt) / 0.5), 0, 1)
m *= np.clip(duck, 0.45, 1)[:, None]
y = m[:int(fin * SR)]
y = y / max(1e-9, np.abs(y).max()) * 0.9
with wave.open(str(RAIZ / "public" / "audio" / "cap6.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo cap6.wav", f"{len(y) / SR:.1f} s")
