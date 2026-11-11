"""Score of chapter IX «El lenguaje y sus rangos» (public/audio/cap9.wav), on src/cap9.json. The same palette
as the opening and chapters I-VII (audio/dune.py); every visible event has its sound.

- Title: the braam on the title, over the web.
- The journey: a boom as the neurons open into the web; a soft chord on the pair; a low doubt on the question.
- Measuring: a pulse per counter; a rising run for the 27 orders; a swell on the band; a low hit on the broken laws;
  a pulse per metric (bright when alike, low when not); the two images part with a long tone.
- Observed: a pulse per spectrum; a pulse per map; a slow swell out through the fractal of clusters.
- The test: a pulse per sphere; a chord on «ocho veces»; a pulse on the survey; a pulse per point of the curve;
  a hit where the fractal is ruled out.
- Four claims: a pulse per card. Close: a long swell out to an even texture; a last low braam.

Usage: PYTHONPATH=pylib python3 audio/sonido_cap9.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, hz, oleaje, poner, sub, t_, voz  # noqa: E402

K = json.loads((RAIZ / "src" / "cap9.json").read_text())
V = json.loads((RAIZ / "src" / "cap9_voz.json").read_text())
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
# title: one soft pulse per rule, then the braam
for i in range(6):
    p(0.3 + i * 0.35, ESCALA[3 + i], 0.8, 0.12)
poner(m, K["titulo"] - 1.2, oleaje(1.2), 0.4)
poner(m, K["titulo"], con_reverb(braam([26, 38, 45], 6.5, ataque=0.03, abre=0.9, brillo=1.0), SALA, 0.45), 0.85)
poner(m, K["titulo"], bombo(1.3), 0.95)
poner(m, K["titulo"] + 0.4, con_reverb(voz([(62, 2.0), (63, 1.0), (66, 2.5), (62, 2.5)], "a"), SALA, 0.55), 0.3)
# Galileo
p(K["galileo"], 57, 1.8, 0.26, SALA, 0.5)
p(K["portada"], 62, 1.6, 0.22, SALA, 0.5)
for x, n in [(K["pagina"], 66), (K["letras"], 69), (K["laberinto"], 50)]:
    p(x, n, 1.6, 0.22, SALA, 0.5)
# the film, panel by panel; the question
for i, x in enumerate(K["paneles"]):
    p(x, ESCALA[5 + i], 1.0, 0.2)
poner(m, K["pregunta"], con_reverb(voz([(62, 3.0), (66, 3.0)], "o", vib=3.5), SALA, 0.6), 0.18)
# Wigner
p(K["wigner"], 57, 1.8, 0.26, SALA, 0.5)
p(K["misterio"], 62, 1.6, 0.2, SALA, 0.5)
poner(m, VZ[4], con_reverb(voz([(62, 2.0), (66, 2.0), (69, 3.0)], "a", vib=3.5), SALA, 0.6), 0.2)
p(K["limitado"] + 0.6, 45, 2.0, 0.3, SALA, 0.5)
# three ways
for i, x in enumerate(K["tarjetas"]):
    p(x, [62, 66, 69][i], 1.6, 0.26, SALA, 0.5)
# two faces
poner(m, K["mandel"], oleaje(6.5), 0.3)
poner(m, K["mandel"] + 3.9, con_reverb(braam([38, 45], 3.0, ataque=0.05, abre=1.0, brillo=1.0), SALA, 0.5), 0.4)
for i in range(3):
    p(K["frontera"] + 1.2 + i * 0.9, [50, 57, 62][i], 1.0, 0.22)
p(K["encontramos"], 69, 1.6, 0.22, SALA, 0.5)
# the bands
poner(m, K["bandas"], con_reverb(voz([(62, 4.0), (69, 4.0)], "o", vib=3.0), SALA, 0.6), 0.14)
for i, x in enumerate([K["b_antena"], K["b_frontera"], K["b_galaxias"], K["b_galaxias"] + 1.6, K["corazon"] + 3.8]):
    p(x, [69, 66, 62, 57, 50][i], 1.6, 0.24, SALA, 0.5)
poner(m, K["infinito"], con_reverb(voz([(62, 3.0), (66, 3.0), (69, 3.0), (74, 4.0)], "a", vib=4.0), SALA, 0.6), 0.22)
poner(m, K["evidencia"], con_reverb(braam([38, 45], 5.0, ataque=1.5, abre=2.0, brillo=0.9), SALA, 0.5), 0.35)
poner(m, K["bordes"], oleaje(fin - K["bordes"] - 1.0), 0.3)
poner(m, K["puente"], con_reverb(voz([(62, 3.0), (66, 2.0), (69, 2.0), (74, 4.0)], "a", vib=4.0), SALA, 0.6), 0.2)
poner(m, fin - 6.0, con_reverb(braam([26, 38, 45], 6.0, ataque=2.0, abre=2.0, brillo=0.8), SALA, 0.5), 0.35)

tt = np.arange(N) / SR
duck = np.ones(N)
for a, v in zip(VZ, V):
    duck -= 0.42 * np.clip(np.minimum((tt - a + 0.3) / 0.3, (a + v["fin"] + 0.4 - tt) / 0.5), 0, 1)
m *= np.clip(duck, 0.45, 1)[:, None]
y = m[:int(fin * SR)]
y = y / max(1e-9, np.abs(y).max()) * 0.9
with wave.open(str(RAIZ / "public" / "audio" / "cap9.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo cap9.wav", f"{len(y) / SR:.1f} s")
