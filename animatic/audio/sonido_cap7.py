"""Score of chapter VII «Del patrón a la herramienta» (public/audio/cap7.wav), on src/cap7.json. The same palette as
the opening and chapters I-V (audio/dune.py); every visible event has its sound.

- Title: the braam on the title; a pulse for each tool card.
- Antenna: a soft tone under the waves; a hit when the foil antenna is cut down; a pulse on the portrait; a pulse
  for each scale and, rising, for each band; a low, slightly off pulse for the fifth band.
- Landscape: a pulse on the portrait; one tuned pulse per level of the midpoint rule; a swell as the ranges rise; a
  braam on Génesis; a swell into the pixel and a hit where the detail ends.
- Retina: a pulse per step; a chord per box size; a braam on the number; pulses on the caveats.
- Close: a pulse per tool; a long swell out to the cosmic web; a last low braam.

Usage: PYTHONPATH=pylib python3 audio/sonido_cap7.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, filtro, hz, oleaje, poner, sub, t_, voz  # noqa: E402

K = json.loads((RAIZ / "src" / "cap7.json").read_text())
V = json.loads((RAIZ / "src" / "cap7_voz.json").read_text())
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
# title and question
for i in range(7):
    p(0.6 + i * 4.0 / 7, ESCALA[i + 2], 0.6, 0.12)
poner(m, K["titulo"] - 1.2, oleaje(1.2), 0.45)
poner(m, K["titulo"], con_reverb(braam([26, 38, 45], 6.5, ataque=0.03, abre=0.9, brillo=1.0), SALA, 0.45), 0.85)
poner(m, K["titulo"], bombo(1.3), 0.95)
poner(m, K["titulo"] + 0.4, con_reverb(voz([(62, 2.0), (63, 1.0), (66, 2.5), (62, 2.5)], "a"), SALA, 0.55), 0.3)
for i in range(3):
    p(K["tarjetas"] + i * 0.9, [62, 66, 69][i], 1.4, 0.26, SALA, 0.45)
# antenna
poner(m, K["antena"], con_reverb(voz([(69, K["edificio"] - K["antena"])], "o", vib=3.0), SALA, 0.5), 0.08)
poner(m, K["corte"], con_reverb(braam([38, 45], 3.0, ataque=0.02, abre=1.0, brillo=1.1), SALA, 0.45), 0.45)
poner(m, K["corte"], bombo(0.9), 0.6)
# the radio amateur's story, beat by beat on his sentence
PAL = {f"{w}{i}": t for i, (w, t) in enumerate(K["vozPal"][2])}
V2 = VZ[2]
p(V2 + PAL["ochenta5"] - 0.3, 50, 2.0, 0.22, SALA, 0.5)                   # the city
p(V2 + PAL["radioaficionado7"], 62, 1.6, 0.24, SALA, 0.5)                 # his window lights
poner(m, V2 + PAL["antenas13"] + 0.3, bombo(0.8), 0.55)                   # PROHIBIDO
for k, w in enumerate(["papel23", "aluminio25", "fractal28"]):
    p(V2 + PAL[w], [66, 69, 74][k], 1.0, 0.24)                            # each level cut from the foil
p(V2 + PAL["pegó31"], 57, 1.2, 0.22)
p(V2 + PAL["Funcionó35"], 69, 2.0, 0.26, SALA, 0.5)
p(K["puente"], 57, 1.8, 0.28, SALA, 0.5)
for i in range(1, 7):
    p(K["construyeron"] + (i / 7) * 3.6, ESCALA[1 + i], 0.8, 0.16)        # the copper triangle, level by level
for i in range(5):
    p(K["escalas"] + i * 0.7, ESCALA[2 + i], 1.0, 0.2)
    p(K["sintoniza"] - 2.5 + i * 0.6, ESCALA[6 + i], 1.0, 0.24)
p(K["quinta"], 49, 2.0, 0.3, SALA, 0.5)
# landscape
p(K["carpenter"] - 0.3, 62, 1.8, 0.28, SALA, 0.5)
for i in range(11):
    p(VZ[8] + 0.6 + i * 9.0 / 11, ESCALA[min(12, i + 1)], 0.8, 0.2)
poner(m, VZ[8] + 8.0, oleaje(3.0), 0.35)
poner(m, K["genesis"] - 0.2, oleaje(5.5), 0.4)                        # the wave of fire
poner(m, K["genesis"], con_reverb(braam([26, 38, 45, 50], 5.0, ataque=0.05, abre=1.0, brillo=1.0), SALA, 0.5), 0.6)
p(K["frontera"], 62, 1.6, 0.26, SALA, 0.45)
poner(m, K["pixel"] + 0.5, oleaje(5.0), 0.4)
poner(m, K["pixel"] + 5.2, con_reverb(braam([38, 45], 3.5, ataque=0.03, abre=1.0, brillo=1.0), SALA, 0.45), 0.5)
# retina
for i, tt in enumerate([K["retina"], K["pasos"] + 0.4, K["pasos"] + 2.4, K["pasos"] + 4.4]):
    p(tt, [50, 57, 62, 66][i], 1.4, 0.24, SALA, 0.45)
for j in range(3):
    for nota in ([50, 57, 62], [54, 62, 66], [57, 66, 69])[j]:
        p(K["pasos"] + 6.4 + j * 1.2, nota, 1.2, 0.12, SALA, 0.45)
poner(m, K["numero"], con_reverb(braam([26, 38, 45, 50], 5.5, ataque=0.03, abre=1.0, brillo=1.0), SALA, 0.5), 0.65)
poner(m, K["numero"], bombo(1.2), 0.75)
p(K["revision"], 57, 1.6, 0.26, SALA, 0.45)
for i in range(3):
    p(VZ[15] + 1.0 + i * 1.6, [55, 54, 50][i], 1.0, 0.2)
# cancer (added 7 nov): the healthy tree, the tumour's network (a low swell under its growth), the boxes, the values, the cells
p(K["cancer"], 50, 1.6, 0.24, SALA, 0.45)
for i in range(5):
    p(K["cancer"] + 0.4 + i * 0.75, ESCALA[2 + i], 0.9, 0.12)
p(K["tumor"], 49, 2.0, 0.24, SALA, 0.5)
poner(m, K["tumor"], oleaje(6.5), 0.3)
for j in range(3):
    for nota in ([50, 57, 62], [54, 62, 66], [57, 66, 69])[j]:
        p(K["cajas"] + j * 1.2, nota, 1.2, 0.12, SALA, 0.45)
poner(m, K["cajas"] + 2.6, con_reverb(braam([38, 45, 50], 4.0, ataque=0.05, abre=1.0, brillo=0.9), SALA, 0.5), 0.45)
p(K["celulas"], 57, 1.6, 0.24, SALA, 0.45)
p(VZ[21] + 0.4, 62, 1.6, 0.2, SALA, 0.45)
# real material: a soft low pulse as each photograph or clip comes in
for _, _, t0, *_ in K["inserciones"]:
    p(t0, 45, 1.6, 0.14, SALA, 0.5)
# close
for i in range(3):
    p(K["cierre"] + i * 0.7, [62, 66, 69][i], 1.4, 0.26, SALA, 0.45)
# the finale: out through the web; the collapse (a reversed swell); one point (silence); the Big Bang; the web forms
B = K["bang"]
poner(m, K["universo"], oleaje(B - 1.0 - K["universo"]), 0.4)
poner(m, K["universo"], con_reverb(braam([38, 45], 6.0, ataque=4.0, abre=3.0, brillo=0.9), SALA, 0.4), 0.3)
poner(m, VZ[18] + 0.4, con_reverb(voz([(62, 3.0), (66, 2.0), (69, 4.0)], "o", vib=4.6), SALA, 0.6), 0.18)
al_reves = con_reverb(braam([26, 38, 45, 50], 5.6, ataque=0.02, abre=1.2, brillo=1.1), SALA, 0.6)[::-1]
poner(m, B - 0.8 - len(al_reves) / SR, al_reves, 0.7)                     # everything falls back in
poner(m, B, con_reverb(braam([26, 33, 38, 45, 50], 9.0, ataque=0.005, abre=1.4, brillo=1.25), SALA, 0.55), 0.95)
poner(m, B, bombo(2.0), 1.0)
poner(m, B, oleaje(7.0), 0.6)
p(B + 3.8, 50, 3.0, 0.3, SALA, 0.6)                                       # the oldest light
poner(m, B + 4.0, con_reverb(voz([(62, 2.5), (66, 2.0), (69, 3.0)], "o", vib=3.5), SALA, 0.6), 0.18)
g_ = np.random.default_rng(5)
for tt_ in np.sort(g_.uniform(8.6, 12.5, 14)):                           # the first stars, one by one
    p(B + tt_, int(g_.choice([74, 75, 78, 81, 86])), 1.2, 0.07, SALA, 0.6)
poner(m, B + 8.6, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 3.0), (74, 6.0)], "a", vib=4.0), SALA, 0.6), 0.24)   # the web forms
poner(m, B + 12.0, con_reverb(braam([26, 38, 45, 50], 6.0, ataque=2.5, abre=2.5, brillo=1.0), SALA, 0.55), 0.45)   # and it goes on
poner(m, fin - 6.0, con_reverb(braam([26, 38, 45], 6.0, ataque=2.0, abre=2.0, brillo=0.8), SALA, 0.5), 0.35)

tt = np.arange(N) / SR
duck = np.ones(N)
for a, v in zip(VZ, V):
    duck -= 0.42 * np.clip(np.minimum((tt - a + 0.3) / 0.3, (a + v["fin"] + 0.4 - tt) / 0.5), 0, 1)
m *= np.clip(duck, 0.45, 1)[:, None]
# one point: a near silence just before the bang
tt2 = np.arange(N) / SR
m *= np.clip(1 - 0.95 * np.clip(np.minimum((tt2 - (B - 0.8)) / 0.25, (B - tt2) / 0.01), 0, 1), 0.05, 1)[:, None]
y = m[:int(fin * SR)]
y = y / max(1e-9, np.abs(y[:int(K["final"] * SR)]).max()) * 0.9        # level set by the chapter, not by the bang
y = np.tanh(y / 0.95) * 0.95
with wave.open(str(RAIZ / "public" / "audio" / "cap7.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo cap7.wav", f"{len(y) / SR:.1f} s")
