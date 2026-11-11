"""Score of chapter VIII «¿Hasta dónde llega la estructura?» (public/audio/cap8.wav), on src/cap8.json. The same palette
as the opening and chapters I-VII (audio/dune.py); every visible event has its sound.

- Title: the braam on the title, over the web.
- The journey: a boom as the neurons open into the web; a soft chord on the pair; a low doubt on the question.
- Measuring: a pulse per counter; a rising run for the 27 orders; a swell on the band; a low hit on the broken laws;
  a pulse per metric (bright when alike, low when not); the two images part with a long tone.
- Observed: a pulse per spectrum; a pulse per map; a slow swell out through the fractal of clusters.
- The test: a pulse per sphere; a chord on «ocho veces»; a pulse on the survey; a pulse per point of the curve;
  a hit where the fractal is ruled out.
- Four claims: a pulse per card. Close: a long swell out to an even texture; a last low braam.

Usage: PYTHONPATH=pylib python3 audio/sonido_cap8.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, hz, oleaje, poner, sub, t_, voz  # noqa: E402

K = json.loads((RAIZ / "src" / "cap8.json").read_text())
V = json.loads((RAIZ / "src" / "cap8_voz.json").read_text())
VZ = K["voz"]
fin = K["total"]
N = int(fin * SR) + SR
m = np.zeros((N, 2))


def pulso(f, dur=0.8):
    t = t_(int(dur * SR))
    env = (1 - np.exp(-t * 400)) * np.exp(-t * 6)
    return env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.6 * np.sin(np.pi * f * t))


def p(t, nota, dur=1.0, vol=0.26, sala=SALA_C, mezcla=0.35):
    poner(m, t, con_reverb(pulso(hz(nota), dur), sala, mezcla), vol)


ESCALA = [50, 54, 55, 57, 58, 62, 63, 66, 67, 69, 74, 75, 78]
poner(m, 0.3, sub(26, fin - 0.3, ataque=2.0, sat=0.6), 0.2)
# title
poner(m, 0.2, oleaje(4.6), 0.35)
poner(m, K["titulo"], con_reverb(braam([26, 38, 45], 6.5, ataque=0.03, abre=0.9, brillo=1.0), SALA, 0.45), 0.85)
poner(m, K["titulo"], bombo(1.3), 0.95)
poner(m, K["titulo"] + 0.4, con_reverb(voz([(62, 2.0), (63, 1.0), (66, 2.5), (62, 2.5)], "a"), SALA, 0.55), 0.3)
# the journey
p(K["neuronas"], 57, 1.6, 0.2, SALA, 0.5)
poner(m, K["abre"], con_reverb(braam([38, 45], 3.0, ataque=0.05, abre=1.0, brillo=1.0), SALA, 0.5), 0.45)
poner(m, K["abre"] + 0.4, bombo(1.0), 0.5)
for i, n in enumerate([62, 66, 69]):
    p(K["parecen"] + i * 0.25, n, 1.6, 0.18, SALA, 0.5)
p(VZ[1] + 0.9, 49, 2.0, 0.26, SALA, 0.5)                                 # «no es lo mismo que ser igual»
poner(m, K["pregunta"], con_reverb(voz([(62, 3.0), (66, 3.0)], "o", vib=3.5), SALA, 0.6), 0.16)
# measuring
for x in (K["cortes"],):
    p(x, 57, 1.4, 0.2, SALA, 0.5)
p(VZ[3] + 0.3, 62, 1.2, 0.22); p(K["galaxias"] + 0.3, 66, 1.2, 0.22)
for i in range(9):                                                      # the jump, order by order
    p(K["ordenes"] + 0.4 + i * 0.24, ESCALA[2 + i], 0.7, 0.12)
poner(m, K["espectro"], oleaje(4.0), 0.25)
poner(m, K["banda"], con_reverb(voz([(62, 3.5), (69, 3.0)], "a", vib=3.0), SALA, 0.6), 0.16)
p(VZ[5], 50, 1.6, 0.24, SALA, 0.5)                                       # the curves part
poner(m, K["quiebran"] + 4.6, con_reverb(braam([38, 45], 2.6, ataque=0.02, abre=1.0, brillo=1.0), SALA, 0.45), 0.4)
p(K["metricas"], 69, 1.6, 0.26, SALA, 0.5)                               # alike
p(K["otras"], 45, 1.8, 0.28, SALA, 0.5)                                  # not alike
p(K["limites"], 55, 1.2, 0.18); p(K["corte"], 55, 1.2, 0.18)
poner(m, K["deshace"], con_reverb(voz([(62, 3.0), (57, 3.0)], "o", vib=3.0), SALA, 0.6), 0.18)
poner(m, K["deshace"] + 1.4, bombo(0.9), 0.4)
# observed
for i in range(3):
    p(K["telescopios"] + 0.3 + i * 0.6, [62, 57, 50][i], 1.2, 0.2)
p(K["mapas"], 62, 1.6, 0.22, SALA, 0.5); p(K["vacios"], 57, 1.6, 0.22, SALA, 0.5)
poner(m, K["fractal"], oleaje(K["esferas"] - K["fractal"] - 1.0), 0.3)
poner(m, K["fractal"], con_reverb(braam([38, 45], 8.0, ataque=5.0, abre=4.0, brillo=0.9), SALA, 0.45), 0.3)
p(VZ[11], 45, 2.0, 0.22, SALA, 0.5)                                      # no average density
# the test
for x, n in [(K["esfera1"], 62), (K["agranda"] + 0.6, 66), (K["otravez"] + 0.5, 69), (K["pareja"] + 0.3, 62), (K["duplicar"], 66), (K["duplicar"] + 1.4, 69)]:
    p(x, n, 1.0, 0.22)
poner(m, K["duplicar"] + 1.4, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 2.5)], "a", vib=3.0), SALA, 0.6), 0.16)
p(K["ritmo"], 57, 1.6, 0.22, SALA, 0.5); p(K["tres"], 69, 1.6, 0.24, SALA, 0.5)
for x in (K["censo"], K["lejos"]):
    p(x, 57, 1.6, 0.22, SALA, 0.5)
for i in range(14):                                                     # a point of the curve each
    p(K["grafica"] + 1.6 + i * (K["setenta"] - K["grafica"] - 1.6) / 14, ESCALA[min(12, i)], 0.6, 0.1)
poner(m, K["setenta"], con_reverb(voz([(62, 3.0), (66, 2.0), (69, 4.0)], "a", vib=4.0), SALA, 0.6), 0.22)
poner(m, K["descarta"], con_reverb(braam([26, 38, 45], 3.5, ataque=0.02, abre=1.0, brillo=1.1), SALA, 0.45), 0.55)
poner(m, K["descarta"], bombo(1.1), 0.65)
# four claims
for i, x in enumerate(K["tarjetas"]):
    p(x, [62, 66, 45, 69][i], 1.6, 0.26, SALA, 0.5)
# close
poner(m, K["cierre"], oleaje(fin - K["cierre"] - 1.0), 0.35)
poner(m, K["cierre"], con_reverb(braam([38, 45], 8.0, ataque=4.0, abre=3.0, brillo=0.9), SALA, 0.45), 0.3)
poner(m, VZ[19] + 0.4, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 4.0)], "o", vib=4.6), SALA, 0.6), 0.18)
poner(m, K["puente"], con_reverb(voz([(62, 3.0), (66, 2.0), (69, 2.0), (74, 4.0)], "a", vib=4.0), SALA, 0.6), 0.2)
poner(m, fin - 6.0, con_reverb(braam([26, 38, 45], 6.0, ataque=2.0, abre=2.0, brillo=0.8), SALA, 0.5), 0.35)
for _, _, t0, *_ in K["inserciones"]:
    p(t0, 45, 1.6, 0.14, SALA, 0.5)

tt = np.arange(N) / SR
duck = np.ones(N)
for a, v in zip(VZ, V):
    duck -= 0.42 * np.clip(np.minimum((tt - a + 0.3) / 0.3, (a + v["fin"] + 0.4 - tt) / 0.5), 0, 1)
m *= np.clip(duck, 0.45, 1)[:, None]
y = m[:int(fin * SR)]
y = y / max(1e-9, np.abs(y).max()) * 0.9
with wave.open(str(RAIZ / "public" / "audio" / "cap8.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo cap8.wav", f"{len(y) / SR:.1f} s")
