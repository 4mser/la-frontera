"""Score of chapter X «La frontera» (public/audio/cap10.wav), on src/cap10.json. The same palette
as the opening and chapters I-VII (audio/dune.py); every visible event has its sound.

- Title: the braam on the title, over the web.
- The journey: a boom as the neurons open into the web; a soft chord on the pair; a low doubt on the question.
- Measuring: a pulse per counter; a rising run for the 27 orders; a swell on the band; a low hit on the broken laws;
  a pulse per metric (bright when alike, low when not); the two images part with a long tone.
- Observed: a pulse per spectrum; a pulse per map; a slow swell out through the fractal of clusters.
- The test: a pulse per sphere; a chord on «ocho veces»; a pulse on the survey; a pulse per point of the curve;
  a hit where the fractal is ruled out.
- Four claims: a pulse per card. Close: a long swell out to an even texture; a last low braam.

Usage: PYTHONPATH=pylib python3 audio/sonido_cap10.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, hz, oleaje, poner, sub, t_, voz  # noqa: E402

K = json.loads((RAIZ / "src" / "cap10.json").read_text())
V = json.loads((RAIZ / "src" / "cap10_voz.json").read_text())
VZ = K["voz"]
EPI = json.loads((RAIZ / "src" / "epilogo.json").read_text())
EV = json.loads((RAIZ / "src" / "epilogo_voz.json").read_text())
fin = EPI["fin"] if EPI["activo"] else K["total"]
N = int(fin * SR) + SR
m = np.zeros((N, 2))


def pulso(f, dur=0.8):
    t = t_(int(dur * SR))
    env = (1 - np.exp(-t * 400)) * np.exp(-t * 6)
    return env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.6 * np.sin(np.pi * f * t))


def p(t, nota, dur=1.0, vol=0.26, sala=SALA_C, mezcla=0.35):
    poner(m, t, con_reverb(pulso(hz(nota), dur), sala, mezcla), vol)


ESCALA = [50, 54, 55, 57, 58, 62, 63, 66, 67, 69, 74, 75, 78]


def shepard(dur, sube=1 / 9, f0=55.0, n=8, centro=440.0, suelta=0.05):
    """a tone that rises without end: octave-spaced partials gliding up, each fading in at the bottom and out at the top"""
    k = int(dur * SR); t = np.arange(k) / SR
    x = np.zeros(k)
    for i in range(n):
        pos = (i + sube * t) % n                                   # octaves above f0
        f = f0 * 2 ** pos
        fase = 2 * np.pi * np.cumsum(f) / SR
        amp = np.exp(-0.5 * (np.log2(f / centro) / 1.3) ** 2)
        x += amp * np.sin(fase)
    return x / n * np.minimum(1, t / 2.0) * np.clip((dur - t) / suelta, 0, 1) ** 1.5


def latido(t, vol=0.9):
    poner(m, t, bombo(0.7), vol); poner(m, t + 0.28, bombo(0.5), vol * 0.6)


J, M, Z, G, F = K["viaje"], K["micro"], K["mandel"], K["giro"], K["final"]
poner(m, 0.3, sub(26, fin - 0.3, ataque=4.0, sat=0.6), 0.16)
# 0 · in the dark: heartbeats under the promise
for i in range(7):
    latido(0.8 + i * 1.05, 0.7 - 0.06 * i)
poner(m, VZ[0] + 0.4, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 4.0)], "o", vib=3.5), SALA, 0.6), 0.16)
# 1 · the returns: one pulse each; the title
for x, n in [(K["corazon"], 57), (K["costa"], 62), (K["richardson"], 50), (K["red"], 66)]:
    p(x, n, 2.0, 0.26, SALA, 0.5)
latido(K["corazon"] + 0.2, 0.4); latido(K["corazon"] + 1.1, 0.35)
poner(m, K["red"], oleaje(K["titulo"] - K["red"]), 0.3)
poner(m, K["titulo"] - 1.2, oleaje(1.2), 0.5)
poner(m, K["titulo"], con_reverb(braam([26, 33, 38, 45], 8.0, ataque=0.03, abre=1.0, brillo=1.1), SALA, 0.5), 0.95)
poner(m, K["titulo"], bombo(1.6), 1.0)
poner(m, K["titulo"] + 0.5, con_reverb(voz([(62, 2.5), (63, 1.0), (66, 2.5), (69, 4.0)], "a"), SALA, 0.6), 0.32)
# 2 · the shot with no cut: a slow pulse that never stops, a braam at each new world
for i in range(int((Z - J) / 1.6)):
    p(J + i * 1.6, [50, 57, 62, 57][i % 4], 1.4, 0.07 + 0.05 * i / ((Z - J) / 1.6), SALA, 0.5)
for x, br in [(J + 0.0, [26, 38, 45]), (J + 7.5, [38, 45, 50]), (J + 16.5, [26, 38, 45]), (J + 25.5, [33, 45, 50]), (J + 41.0, [38, 45])]:
    poner(m, x, con_reverb(braam(br, 5.0, ataque=0.08, abre=1.2, brillo=1.0), SALA, 0.5), 0.5)
    poner(m, x, bombo(1.0), 0.45)
poner(m, J, oleaje(M - J), 0.28)
poner(m, J + 16.0, con_reverb(voz([(69, 3.0), (74, 4.0)], "a", vib=4.0), SALA, 0.6), 0.16)    # the star becomes the Earth
# the drop and the microcosm: a breath, then glassy pulses (the organisms) and a choir
poner(m, M - 1.6, oleaje(2.0), 0.5)
g_ = np.random.default_rng(10)
for tt_ in np.sort(g_.uniform(1.5, 44.0, 46)):
    p(M + tt_, int(g_.choice([74, 75, 78, 81, 86, 90])), 1.6, 0.05, SALA, 0.7)
poner(m, M + 2.0, con_reverb(voz([(62, 6.0), (66, 6.0), (69, 8.0), (74, 10.0)], "a", vib=3.0), SALA, 0.7), 0.2)
poner(m, M + 36.0, con_reverb(braam([38, 45, 50], 9.0, ataque=4.0, abre=3.0, brillo=1.0), SALA, 0.55), 0.4)
# 3 · the rule alone: a big hit on entering, then a tone that rises without end for the whole fall
poner(m, Z, con_reverb(braam([26, 33, 38, 45, 50], 9.0, ataque=0.01, abre=1.3, brillo=1.2), SALA, 0.55), 0.9)
poner(m, Z, bombo(1.8), 1.0)
poner(m, Z + 0.5, con_reverb(shepard(K["copia"] - Z - 0.5 + 4.5, suelta=5.0), SALA, 0.5), 0.55)
poner(m, Z + 0.5, sub(26, K["copia"] - Z - 0.5 + 5.0, ataque=10.0, sat=0.8), 0.25)
for i in range(6):                                                        # every ten orders of magnitude
    poner(m, Z + 10.0 * (i + 1) - 0.2, bombo(0.9), 0.3 + 0.05 * i)
# the copy: the rise opens into one chord (no silence: the dropout of v1 broke the fall)
poner(m, K["copia"] + 0.25, con_reverb(voz([(62, 4.0), (66, 4.0), (69, 4.0), (74, 6.0)], "a", vib=4.5), SALA, 0.7), 0.3)
poner(m, K["copia"] + 0.25, con_reverb(braam([26, 38, 45], 7.0, ataque=0.5, abre=2.0, brillo=0.9), SALA, 0.6), 0.5)
def leer(ruta):
    w = wave.open(str(ruta))
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float).reshape(-1, w.getnchannels()) / 32767


if EPI["activo"]:
    # EPILOGUE · A: the copy's chord is still ringing; the real heart of the prologue comes in as the iris appears,
    # closest in the dark of the pupil, while the retina's light opens far inside; then only the heart and a low drone
    E0 = EPI["inicio"]
    cor = leer(RAIZ / "public" / "audio" / "corazon.wav")
    tr = cor[int(20.0 * SR):int(20.0 * SR) + int(36.0 * SR)]
    te = np.arange(len(tr)) / SR + 6.0
    env = np.interp(te, [6.0, 9.5, 13.5, 15.5, 18.0, 30.0, 36.0, 42.0], [0.0, 0.35, 0.55, 0.75, 0.55, 0.45, 0.32, 0.25])
    poner(m, E0 + 6.0, con_reverb(tr * env[:, None], SALA_C, 0.25), 0.9)
    poner(m, E0 + 2.5, sub(26, 34.0, ataque=6.0, sat=0.6), 0.13)
    poner(m, E0 + 15.8, con_reverb(voz([(62, 4.0), (66, 4.0), (69, 7.0)], "a", vib=3.5), SALA, 0.7), 0.2)
    poner(m, E0 + 17.0, con_reverb(braam([38, 45, 50], 10.0, ataque=4.0, abre=3.0, brillo=0.9), SALA, 0.6), 0.32)
    for i, x in enumerate([20.4, 21.9, 23.4, 24.9]):
        p(E0 + x, [74, 78, 74, 69][i], 2.2, 0.05, SALA, 0.75)
    E0 = EPI["inicio"] - EPI.get("salto", 0.0)                  # v3: from act B on, everything sounds «salto» seconds earlier
    # B · the film comes back: a tuned pulse on every plane, rising; the web pulls back on a swell that opens and is held
    for i, x in enumerate([36.0, 41.0, 45.4, 51.8, 57.2, 61.8, 66.0, 69.6, 71.4, 74.4]):
        p(E0 + x, [50, 54, 57, 62, 63, 66, 69, 74, 75, 78][i], 2.4, 0.09 + 0.012 * i, SALA, 0.6)
    poner(m, E0 + 36.5, con_reverb(voz([(62, 5.0), (66, 5.0), (69, 6.0), (74, 8.0), (69, 8.0)], "a", vib=3.5), SALA, 0.7), 0.15)
    poner(m, E0 + 44.0, sub(33, 40.0, ataque=8.0, sat=0.7), 0.08)
    poner(m, E0 + 77.6, oleaje(7.0), 0.4)
    poner(m, E0 + 77.8, con_reverb(braam([26, 38, 45, 50], 9.0, ataque=2.5, abre=3.0, brillo=1.0), SALA, 0.6), 0.45)
    # C · the chart: quiet, a pulse per band; the edges shimmer; the band with no edges and the set born out of the dark
    poner(m, E0 + 86.0, con_reverb(voz([(50, 8.0), (54, 8.0), (57, 10.0)], "o", vib=2.5), SALA, 0.7), 0.1)
    for x, n_ in [(88.4, 62), (98.8, 57), (99.4, 62), (102.9, 50), (107.5, 66)]:
        p(E0 + x, n_, 2.6, 0.16, SALA, 0.6)
    for i in range(6):
        p(E0 + 116.0 + i * 0.35, [74, 78, 81, 78, 74, 81][i], 1.8, 0.05, SALA, 0.8)
    poner(m, E0 + 122.4, oleaje(2.0), 0.35)
    poner(m, E0 + 124.2, con_reverb(braam([26, 33, 38, 45], 10.0, ataque=1.2, abre=2.5, brillo=1.0), SALA, 0.6), 0.6)
    poner(m, E0 + 124.2, bombo(1.2), 0.5)
    poner(m, E0 + 128.0, con_reverb(shepard(48.0, sube=1 / 12, suelta=4.0), SALA, 0.5), 0.32)
    poner(m, E0 + 145.6, con_reverb(voz([(62, 6.0), (66, 6.0), (69, 8.0)], "a", vib=3.5), SALA, 0.7), 0.16)
    poner(m, E0 + 156.0, con_reverb(voz([(66, 6.0), (69, 6.0), (74, 10.0)], "a", vib=4.0), SALA, 0.7), 0.2)
    # D · the widest opening of the film: no chain of hits; layers that open, the choir, long braams
    poner(m, E0 + 174.6, con_reverb(braam([26, 38, 45, 50], 14.0, ataque=3.0, abre=5.0, brillo=1.0), SALA, 0.6), 0.55)
    poner(m, E0 + 175.0, sub(26, 70.0, ataque=10.0, sat=0.8), 0.12)
    for x, fr_, vol in [(181.0, [(62, 6.0), (66, 6.0), (69, 8.0)], 0.16), (195.0, [(66, 6.0), (69, 6.0), (74, 8.0)], 0.18),
                        (207.0, [(69, 6.0), (74, 6.0), (78, 10.0)], 0.22), (221.0, [(74, 6.0), (78, 6.0), (81, 12.0)], 0.24)]:
        poner(m, E0 + x, con_reverb(voz(fr_, "a", vib=4.0), SALA, 0.7), vol)
    for x, br, vol in [(200.4, [38, 45, 50], 0.42), (214.8, [26, 38, 45, 57], 0.5), (233.6, [26, 33, 38, 45, 50], 0.62)]:
        poner(m, E0 + x, con_reverb(braam(br, 12.0, ataque=3.5, abre=4.0, brillo=1.05), SALA, 0.6), vol)
    poner(m, E0 + 226.0, oleaje(8.0), 0.45)
    # E · Planck, the Earth, a coast, a heart: the opening holds, a long tone under it
    poner(m, E0 + 251.0, con_reverb(voz([(62, 8.0), (57, 10.0)], "o", vib=2.0), SALA, 0.75), 0.12)
    poner(m, E0 + 250.0, sub(26, 82.0, ataque=6.0, sat=0.6), 0.1)
    tr2 = cor[int(40.0 * SR):int(40.0 * SR) + int(5.2 * SR)]
    env2 = np.interp(np.arange(len(tr2)) / SR, [0, 0.4, 4.4, 5.2], [0.0, 0.7, 0.6, 0.0])
    poner(m, E0 + 272.2, con_reverb(tr2 * env2[:, None], SALA_C, 0.25), 0.9)            # the rings are these beats
    # the detail in what is simple: a tuned pulse on every image of nature, rising; the lightning cracks on its flash
    for i, x in enumerate([290.6, 297.3, 301.4, 305.7, 310.6, 313.8, 315.4, 317.7]):
        p(E0 + x, [57, 62, 66, 69, 74, 78, 81, 86][i], 2.6, 0.12 + 0.015 * i, SALA, 0.6)
    poner(m, E0 + 306.43, con_reverb(braam([26, 33, 38, 45], 4.0, ataque=0.005, abre=0.8, brillo=1.4), SALA, 0.5), 0.75)
    poner(m, E0 + 306.43, bombo(1.6), 0.9)
    for x, fr_, vol in [(291.5, [(62, 5.0), (66, 5.0), (69, 6.0)], 0.14), (301.5, [(66, 4.0), (69, 4.0), (74, 6.0)], 0.17),
                        (311.0, [(69, 4.0), (74, 4.0), (78, 8.0)], 0.2), (320.0, [(74, 5.0), (78, 5.0), (81, 6.0), (86, 8.0)], 0.24)]:
        poner(m, E0 + x, con_reverb(voz(fr_, "a", vib=4.0), SALA, 0.7), vol)
    # the rise to the title: a tone that climbs, a swell, layers that open; no silence before the hit
    poner(m, E0 + 318.0, con_reverb(shepard(18.4, sube=1 / 6, suelta=0.3), SALA, 0.5), 0.4)
    poner(m, E0 + 326.0, oleaje(10.0), 0.6)
    poner(m, E0 + 329.0, con_reverb(braam([38, 45, 50, 57], 7.5, ataque=6.0, abre=4.0, brillo=1.1), SALA, 0.6), 0.5)
    # THE TITLE
    poner(m, E0 + 336.0, con_reverb(braam([26, 33, 38, 45, 50], 12.0, ataque=0.01, abre=1.4, brillo=1.25), SALA, 0.55), 1.0)
    poner(m, E0 + 336.0, bombo(2.0), 1.0)
    poner(m, E0 + 336.2, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 3.0), (74, 8.0)], "a", vib=4.5), SALA, 0.7), 0.3)
    poner(m, E0 + 336.0, sub(26, 12.0, ataque=0.2, sat=0.9), 0.2)
    # THE CREDITS: a steady pulse (80 per minute), a braam every eight beats, the voice above; it fades at the end
    B_ = 0.75
    for i in range(int((411.0 - 344.5) / B_)):
        x = 344.5 + i * B_
        f_ = min(1.0, (x - 344.5) / 6.0) * min(1.0, (411.0 - x) / 5.0)
        p(E0 + x, [50, 57, 62, 57, 50, 57, 63, 57][i % 8], 1.2, 0.11 * f_, SALA, 0.5)
        if i % 4 == 0: poner(m, E0 + x, bombo(0.8), 0.35 * f_)
        if i % 16 == 0: poner(m, E0 + x, con_reverb(braam([26, 38, 45], 9.0, ataque=1.5, abre=2.5, brillo=0.9), SALA, 0.6), 0.35 * f_)
    for x, fr_ in [(348.0, [(62, 6.0), (66, 6.0), (69, 8.0)]), (366.0, [(66, 6.0), (69, 6.0), (74, 8.0)]), (384.0, [(69, 6.0), (74, 6.0), (69, 8.0)])]:
        poner(m, E0 + x, con_reverb(voz(fr_, "a", vib=3.5), SALA, 0.7), 0.15)
    poner(m, E0 + 344.0, sub(26, 93.0, ataque=4.0, sat=0.6), 0.1)
    # THE MARK (src/logoFinal.ts): the epicycles rise a note per contour that closes; the release; LEC, TUR, ES; the shine
    TS_ = 413.75
    poner(m, E0 + TS_ - 3.75, con_reverb(voz([(62, 2.0), (66, 2.0)], "o", vib=2.5), SALA, 0.7), 0.12)
    for i, x in enumerate([3.5 - 0.25 - (4 - j) * 0.125 for j in range(5)]):
        p(E0 + TS_ - 3.75 + x, [62, 66, 69, 74, 78][i], 1.6, 0.12, SALA, 0.6)
    poner(m, E0 + TS_, con_reverb(braam([26, 38, 45, 50], 8.0, ataque=0.02, abre=1.6, brillo=1.1), SALA, 0.6), 0.6)
    poner(m, E0 + TS_, bombo(1.4), 0.7)
    for x, n_ in [(1.7, 62), (2.25, 66), (2.8, 69)]:
        p(E0 + TS_ + x, n_, 2.4, 0.28, SALA, 0.6)
    poner(m, E0 + TS_ + 2.8, con_reverb(voz([(62, 2.5), (66, 2.5), (69, 3.0), (74, 9.0)], "a", vib=4.0), SALA, 0.7), 0.24)
    poner(m, E0 + TS_ + 3.85, con_reverb(braam([38, 45, 50, 57], 10.0, ataque=0.3, abre=3.0, brillo=1.0), SALA, 0.65), 0.38)
# 4 · the turn: quiet; a heartbeat when the eye appears; the choir when the web returns
if not EPI["activo"]:
    latido(G + 6.0, 0.4); latido(G + 7.0, 0.35)
    for i, x in enumerate([G + 11.0, G + 14.6, G + 19.5, G + 24.0]):
        p(x, [57, 62, 66, 69][i], 2.0, 0.2, SALA, 0.6)
    poner(m, G + 24.0, con_reverb(braam([38, 45, 50], 6.0, ataque=1.0, abre=2.0, brillo=1.0), SALA, 0.55), 0.5)
    poner(m, G + 24.0, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 5.0)], "o", vib=4.0), SALA, 0.6), 0.22)
    # 5 · the end: heartbeats, the widening border, the last word, silence, the name
    for i in range(6):
        latido(F + 0.6 + i * 1.05, 0.6 - 0.07 * i)
    poner(m, F + 2.0, oleaje(K["nombre"] - F - 2.0), 0.3)
    poner(m, VZ[15] + 0.3, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 3.0), (74, 6.0)], "a", vib=4.0), SALA, 0.7), 0.24)
    poner(m, K["nombre"], con_reverb(braam([26, 38, 45], 8.0, ataque=0.05, abre=1.5, brillo=0.9), SALA, 0.6), 0.6)
    poner(m, K["nombre"], bombo(1.4), 0.7)

tt = np.arange(N) / SR
duck = np.ones(N)
voces = [(a, v) for k, (a, v) in enumerate(zip(VZ, V)) if not (EPI["activo"] and k > 12)]
if EPI["activo"]:
    voces += [(a, v) for a, v in zip(EPI["voz"], EV) if a >= 0]
for a, v in voces:
    duck -= 0.42 * np.clip(np.minimum((tt - a + 0.3) / 0.3, (a + v["fin"] + 0.4 - tt) / 0.5), 0, 1)
m *= np.clip(duck, 0.45, 1)[:, None]
tt3 = np.arange(N) / SR
if EPI["activo"]:                                   # the very end: everything fades with the last credit
    tt4 = np.arange(N) / SR - EPI["inicio"] + EPI.get("salto", 0.0)
    m *= np.clip((437.0 - tt4) / 3.0, 0, 1)[:, None]
y = m[:int(fin * SR)]
y = y / max(1e-9, np.abs(y).max()) * 0.9
with wave.open(str(RAIZ / "public" / "audio" / "cap10.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo cap10.wav", f"{len(y) / SR:.1f} s")
