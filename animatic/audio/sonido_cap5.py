"""Score of chapter V «Un corazón no es un metrónomo» (public/audio/cap5.wav), on src/cap5.json. The same palette
as the opening and chapters I-IV (audio/dune.py). The heart is the real one: every beat of nsr018 at its real time,
with the heartbeat sound of the prologue.

- Title and the line: the real beats; the braam on the title; a quiet tick for the metronome.
- The bridge: a tuned pulse on each of the six forms.
- The day: a long swell as 24 hours unroll.
- The infinite zoom: a real beat on every push, a rising swell, a pulse when the map runs out of detail and a braam
  where the heart's range ends.
- The DFA: a pulse on the portrait; one on each step of the demonstration (cut, trend, distance); one on each window
  size; soft ticks as the points of the curve appear; pulses on α1, α2 and the three reference lines.
- The other heart: a low pulse; pulses on its α1 and α2.
- 83 people: a soft tick per point as it lands (high for the healthy, lower for heart failure); pulses on the
  medians; a braam where the clouds touch; pulses on what we did not control and on the portrait.
- Close: the real beats again; the dive into the wound heartbeat (day, hour, minute), one push per beat, faster and
  faster, over a rising swell; a dry silence; the heart beats calm under three spirals (healthy, heart failure,
  metronome); a rising swell into the logistic rule; a pulse at each doubling of its bifurcation diagram; a braam
  when it is whole.

Usage: PYTHONPATH=pylib python3 audio/sonido_cap5.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, filtro, hz, oleaje, poner, sub, t_, voz  # noqa: E402

K = json.loads((RAIZ / "src" / "cap5.json").read_text())
V = json.loads((RAIZ / "src" / "cap5_voz.json").read_text())
DAT = json.loads((RAIZ / "src" / "cap5_datos.json").read_text())
VZ = K["voz"]
fin = K["total"]
N = int(fin * SR) + SR
m = np.zeros((N, 2))


def leer(ruta):
    w = wave.open(str(ruta))
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float).reshape(-1, w.getnchannels()) / 32767


CORAZON = leer(RAIZ / "public" / "audio" / "corazon.wav")
ONSETS = json.loads((RAIZ / "public" / "audio" / "latidos_audio.json").read_text())


def latido(k):
    i = int((ONSETS[k % len(ONSETS)] - 0.05) * SR)
    x = CORAZON[i:i + int(0.8 * SR), 0].copy() * np.linspace(1, 0, int(0.8 * SR)) ** 0.6
    x = filtro(x, corte_alto=700)
    t = t_(len(x))
    x = x + np.sin(2 * np.pi * 42 * t) * np.exp(-t * 14) * 0.5 * np.abs(x).max()
    return x / np.abs(x).max()


def pulso(f, dur=0.8):
    t = t_(int(dur * SR))
    env = (1 - np.exp(-t * 400)) * np.exp(-t * 6)
    return env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.6 * np.sin(np.pi * f * t))


ESCALA = [50, 54, 55, 57, 58, 62, 63, 66, 67, 69, 74, 75, 78]


def p(t, nota, dur=1.0, vol=0.26, sala=SALA_C, mezcla=0.35):
    poner(m, t, con_reverb(pulso(hz(nota), dur), sala, mezcla), vol)


LAT = [latido(k) for k in range(6)]
TL = 0.8 + np.concatenate([[0], np.cumsum(DAT["sano"]["latidos"])])
poner(m, 0.3, sub(26, fin - 0.3, ataque=2.0, sat=0.6), 0.18)

# ─── 0-1 · the real beats, the title, the metronome ───
for k, tl in enumerate(TL):
    if tl > K["dia"] + 0.3:
        break
    poner(m, tl, LAT[k % 6], 0.62 * min(1.0, (K["dia"] + 0.3 - tl) / 1.5))
poner(m, K["titulo"] - 1.2, oleaje(1.2), 0.4)
poner(m, K["titulo"], con_reverb(braam([26, 38, 45], 6.5, ataque=0.03, abre=0.9, brillo=1.0), SALA, 0.45), 0.8)
poner(m, K["titulo"] + 0.4, con_reverb(voz([(62, 2.0), (63, 1.0), (66, 2.5), (62, 2.5)], "a"), SALA, 0.55), 0.28)
t = K["metronomo"]
while t < K["dia"]:
    p(t, 86, 0.18, 0.05)
    t += 0.78

# ─── 2 · the day ───
poner(m, K["dia"] + 0.4, oleaje(10.0), 0.38)
poner(m, K["dia"] + 0.4, con_reverb(braam([38, 45], 10.0, ataque=8.0, abre=3.0, brillo=0.7), SALA, 0.4), 0.25)
# the bridge: a tuned pulse on each of the five cuts
for k, nota in enumerate((50, 54, 57, 62, 66)):
    p(TL[K['pk'] + k], nota, 1.2, 0.26, SALA, 0.4)

# ─── 2b · the infinite zoom: a real beat on every push, over a swell that rises; the end of each range ───
zl = K["zoomLat"]
for k, tz in enumerate(zl):
    poner(m, tz, LAT[k % 6], 0.6)
    p(tz, ESCALA[min(len(ESCALA) - 1, k // 3)], 0.6, 0.12)
poner(m, zl[0], oleaje(K["zoomFin"] - zl[0]), 0.4)
poner(m, zl[0], con_reverb(braam([38, 45], K["zoomFin"] - zl[0], ataque=K["zoomFin"] - zl[0] - 2.0, abre=3.0, brillo=0.8), SALA, 0.4), 0.3)
p(K["mapaFin"], 57, 2.0, 0.3, SALA, 0.5)
poner(m, K["zoomFin"] - 0.1, con_reverb(braam([26, 38, 45, 50], 5.5, ataque=0.03, abre=1.0, brillo=1.0), SALA, 0.5), 0.7)
poner(m, K["zoomFin"] - 0.1, bombo(1.3), 0.8)

# ─── 3 · the DFA ───
p(K["dfa"] + 0.2, 57, 1.8, 0.28, SALA, 0.5)
for tt, nota in zip(K["ventanas"], (62, 66, 69)):
    p(tt - 0.3, nota, 1.0, 0.22)
c0 = K["crecen"][0]
for j, nota in enumerate((62, 66, 69)):
    p(c0 + j * 1.8, nota, 1.2, 0.24)
npts, dur = len(DAT["sano"]["dfa"]["lx"]), K["crecen"][1] - c0 + 4.0
for i in range(npts):
    # eIO on the points: they appear at the times where the ease-in-out crosses i / npts
    uu = np.linspace(0, 1, 2001); e = np.where(uu < 0.5, 4 * uu ** 3, 1 - (-2 * uu + 2) ** 3 / 2)
    p(c0 + dur * uu[min(2000, np.searchsorted(e, (i + 1) / npts))], 74 + (i % 4) * 2, 0.4, 0.06)
for tt, nota in zip(K["alfas"], (69, 74)):
    p(tt - 0.3, nota, 1.4, 0.3, SALA, 0.45)
for tt, nota in zip(K["refs"], (50, 57, 62)):
    p(tt - 0.3, nota, 1.2, 0.2)

# ─── 4 · the other heart ───
p(K["otro"], 50, 2.0, 0.3, SALA, 0.5)
for tt, nota in zip(K["alfasIC"], (63, 58)):
    p(tt - 0.3, nota, 1.4, 0.3, SALA, 0.45)

# ─── 5 · eighty-three people ───
for t0, n, dur, nota in ((K["llegan"][0], 54, 6.0, 81), (K["llegan"][1], 29, 4.5, 74)):
    for i in range(n):
        p(t0 + (i / n) * dur, nota + (i % 3), 0.35, 0.07)
for i in range(2):
    p(VZ[19] + 1.0 + i * 0.8, [62, 58][i], 1.4, 0.28, SALA, 0.45)
poner(m, K["solapa"] - 0.3, con_reverb(braam([38, 45, 50], 4.5, ataque=0.05, abre=1.2, brillo=0.9), SALA, 0.45), 0.5)
poner(m, K["solapa"] - 0.2, con_reverb(voz([(62, 2.0), (61, 1.0), (57, 3.0)], "a", vib=5.0), SALA, 0.6), 0.2)
for i in range(3):
    p(VZ[21] + 1.0 + i * 1.2, [57, 55, 54][i], 1.0, 0.2)
p(K["ivanov"] + 0.2, 62, 1.6, 0.26, SALA, 0.5)

# ─── 6 · close: the real beats again; then one fractal per beat, faster, until a silence ───
t0 = K["cierre"] + 0.4
for k, tl in enumerate(TL - TL[0] + t0):
    if tl > K["montaje"][0] - 0.3:
        break
    poner(m, tl, LAT[k % 6], 0.62 * min(1.0, (tl - t0 + 0.3) / 1.5))
poner(m, K["cierre"], con_reverb(voz([(50, 4.0), (51, 2.0), (54, 4.0), (50, 6.0)], "o", vib=4.6), SALA, 0.6), 0.14)
fm = K["montaje"]
poner(m, fm[0], con_reverb(braam([38, 45], fm[-1] - fm[0] + 0.6, ataque=fm[-1] - fm[0], abre=3.0, brillo=1.0), SALA, 0.4), 0.35)
for k, tm in enumerate(fm):
    poner(m, tm, LAT[k % 6], 0.7)
    p(tm, ESCALA[min(len(ESCALA) - 1, k * len(ESCALA) // len(fm))], 0.8, 0.22 + 0.01 * k)
# the dive (day → hour → minute): a swell that rises with the beats and is cut dry by the silence
fin_caos = K["quieto"] - 0.9
poner(m, fm[0] + 2.4, con_reverb(voz([(62, 2.5), (66, 2.5), (69, max(0.5, fin_caos - fm[0] - 2.4 - 5.0))], "a", vib=5.6), SALA, 0.5), 0.2)
x = oleaje(fin_caos - fm[0] + 0.05)
x[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))[:, None] if x.ndim == 2 else np.linspace(1, 0, int(0.05 * SR))
poner(m, fm[0], x, 0.45)
# then the heart beats calm again, on a low chord
poner(m, K["quieto"], con_reverb(braam([26, 38, 45], 7.0, ataque=0.03, abre=0.9, brillo=1.0), SALA, 0.5), 0.65)
poner(m, K["quieto"] + 0.4, con_reverb(voz([(62, 2.5), (63, 1.0), (66, 3.0), (62, 4.0)], "a", vib=5.4), SALA, 0.6), 0.28)
for k, tc in enumerate(K["calma"]):
    if tc > K["logistica"] + 0.5:
        break
    poner(m, tc, LAT[k % 6], 0.5 * min(1.0, (K["logistica"] + 0.5 - tc) / 2.0))
# the three spirals, one pulse each as it starts to wind
for i, nota in enumerate((62, 58, 50)):
    p(K["tres"] + i * 0.5, nota, 1.8, 0.24, SALA, 0.5)
p(VZ[24] + 1.0, 57, 2.0, 0.28, SALA, 0.5)          # the clinical finding
p(VZ[25] + 0.6, 51, 2.0, 0.26, SALA, 0.5)          # «demasiado parejo»
# the bridge: a rising swell into the rule; the diagram drawn with the voice (a pulse at r = 3 and at each doubling,
# a low hit where chaos begins, a braam when it is whole); the dive into the miniature copy; a last chord
lg, B = K["logistica"], K["bif"]
poner(m, lg, oleaje(B["t0"] - lg + 0.5), 0.3)
poner(m, lg + 1.4, con_reverb(voz([(62, 1.5), (66, 1.5), (69, 2.0)], "a", vib=5.0), SALA, 0.6), 0.18)
p(K["ecuacion"], 57, 2.4, 0.3, SALA, 0.5)
uu = np.linspace(0, 1, 4001); ee = np.where(uu < 0.5, 4 * uu ** 3, 1 - (-2 * uu + 2) ** 3 / 2)
cuando = lambda r: (B["t30"] + (B["t357"] - B["t30"]) * uu[np.searchsorted(ee, (r - 3.0) / 0.57)])
p(B["t30"], 62, 1.6, 0.28, SALA, 0.45)
for r, nota in ((3.449, 66), (3.544, 69), (3.5644, 74)):
    p(cuando(r), nota, 1.2, 0.26, SALA, 0.45)
poner(m, B["t357"], con_reverb(braam([38, 45], B["t4"] - B["t357"] + 0.5, ataque=B["t4"] - B["t357"], abre=3.0, brillo=1.1), SALA, 0.4), 0.35)
poner(m, B["t357"], bombo(1.0), 0.5)
poner(m, B["t4"], con_reverb(braam([26, 38, 45, 50], 5.0, ataque=0.03, abre=1.0, brillo=1.0), SALA, 0.5), 0.6)
zi0, zi1, zo0, zo1 = B["zoom"]
poner(m, zi0, oleaje(zi1 - zi0), 0.4)
poner(m, zi1, con_reverb(braam([38, 45, 50, 57], 4.5, ataque=0.05, abre=1.2, brillo=1.1), SALA, 0.45), 0.55)
poner(m, zi1, con_reverb(voz([(74, 1.5), (78, 1.0), (81, 2.5)], "a", vib=5.8), SALA, 0.6), 0.22)
poner(m, VZ[33] + 0.4, con_reverb(voz([(62, 3.0), (66, 2.0), (69, 4.0)], "o", vib=4.6), SALA, 0.6), 0.18)
poner(m, K["total"] - 4.5, con_reverb(braam([26, 38, 45], 4.5, ataque=1.5, abre=1.5, brillo=0.8), SALA, 0.5), 0.35)

tt = np.arange(N) / SR
duck = np.ones(N)
for a, v in zip(VZ, V):
    duck -= 0.42 * np.clip(np.minimum((tt - a + 0.3) / 0.3, (a + v["fin"] + 0.4 - tt) / 0.5), 0, 1)
m *= np.clip(duck, 0.45, 1)[:, None]
y = m[:int(fin * SR)]
y = y / max(1e-9, np.abs(y).max()) * 0.9
with wave.open(str(RAIZ / "public" / "audio" / "cap5.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo cap5.wav", f"{len(y) / SR:.1f} s")
