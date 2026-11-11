"""Score of «Deleite», the musical finale (public/audio/deleite.wav), on src/deleite.json: the desert-epic palette of
audio/dune.py (braams, booms, the female voice, sub, tuned pulses, swells), D Phrygian dominant, 100 BPM.
Part 1: lenses, diagonal, triptych, life, kaleidoscope, mosaic; every gesture of the picture has its sound.

Usage: PYTHONPATH=pylib python3 audio/sonido_deleite.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, hz, oleaje, poner, sub, t_, voz  # noqa: E402

D = json.loads((RAIZ / "src" / "deleite.json").read_text())
BEAT = 60 / D["bpm"]
B = lambda k: D["t0"] + k * BEAT
fin = D["total"]
N = int((fin + 4) * SR)
m = np.zeros((N, 2))


def pulso(f, dur=0.8):
    t = t_(int(dur * SR))
    env = (1 - np.exp(-t * 400)) * np.exp(-t * 6)
    return env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.6 * np.sin(np.pi * f * t))


def p(t, nota, dur=1.0, vol=0.26, sala=SALA_C, mezcla=0.35):
    poner(m, t, con_reverb(pulso(hz(nota), dur), sala, mezcla), vol)


def golpe(t, notas, g=0.7, dur=4.0):
    poner(m, t, con_reverb(braam(notas, dur, ataque=0.03, abre=0.9, brillo=1.1), SALA, 0.45), g)
    poner(m, t, bombo(1.2), 0.85)


# D Phrygian dominant: D Eb F# G A Bb C
ESC = [50, 51, 54, 55, 57, 58, 60, 62, 63, 66, 67, 69, 70, 72, 74, 75, 78, 79, 81, 82, 84, 86]
# the bed: a sub drone, a deep boom every second beat; a quiet tuned pulse on every beat (the heartbeat of the grid)
poner(m, B(0), sub(26, B(85) - B(0), ataque=1.5), 0.4)
poner(m, B(101), sub(26, B(125) - B(101), ataque=1.5), 0.4)
poner(m, B(141), sub(26, B(165) - B(141), ataque=1.5), 0.42)
for k in range(2, 165, 2):
    if 85 <= k < 101 or 125 <= k < 141:
        continue
    poner(m, B(k), con_reverb(bombo(0.42 + 0.3 * min(k, 60) / 60), SALA_C, 0.25), 0.5)
ost = [50, 57, 62, 57, 51, 57, 62, 66]
for k in range(0, 149):
    if 28 <= k < 40 or 85 <= k < 101 or 111 <= k < 121 or 125 <= k < 141:
        continue                                                     # the creatures breathe without the grid
    p(B(k), ost[k % 8] + (12 if k >= 50 else 0), 0.5, 0.07)
# 1 · lenses: the first hit; the power grows (a swell); lens 1 and lens 2; the lens takes the frame
golpe(B(0), [26, 38, 45, 50], 1.0, 8.0)
poner(m, B(0.5), oleaje(B(3) - B(0.5)), 0.35)
golpe(B(3), [31, 43, 50, 55], 0.7)
p(B(3) + 0.05, 74, 1.6, 0.26, SALA, 0.5)
p(B(6), 81, 1.6, 0.24, SALA, 0.5); p(B(6) + 0.15, 86, 1.6, 0.18, SALA, 0.5)
poner(m, B(8.4), oleaje(B(10) - B(8.4)), 0.5)
golpe(B(10), [26, 38, 45, 50, 57], 0.85, 5.0)
# 2 · the diagonal cuts in; it sweeps across
golpe(B(11), [33, 45, 52, 57], 0.6, 3.5)
for i, k in enumerate(range(12, 16)):
    p(B(k), ESC[7 + i * 2], 0.8, 0.16)
poner(m, B(16.4), oleaje(B(18) - B(16.4)), 0.45)
# 3 · the triptych: three hits, one per panel; the middle panel opens
for i in range(3):
    poner(m, B(18 + 0.1 * i), con_reverb(bombo(0.9), SALA_C, 0.3), 0.8)
    p(B(18 + 0.1 * i), [50, 57, 62][i], 1.4, 0.22, SALA, 0.45)
golpe(B(18), [26, 38, 45], 0.6, 3.0)
for k in range(19, 26):
    p(B(k) + BEAT / 2, ESC[9 + (k % 4)], 0.6, 0.1)
poner(m, B(26), oleaje(B(28) - B(26)), 0.5)
golpe(B(28), [31, 38, 43, 50], 0.7, 6.0)
# 4 · life: the female voice, long; soft pulses for the legs; the jellyfish brings the voice up high
poner(m, B(28.5), con_reverb(voz([(62, 2.5), (63, 1.25), (66, 2.5), (62, 2.0), (57, 3.0)], "a", vib=5.0), SALA, 0.6), 0.32)
for i in range(22):
    p(B(29) + i * BEAT / 2, [74, 78, 81, 78][i % 4], 0.5, 0.05 + 0.02 * (i % 2))
poner(m, B(32), con_reverb(voz([(81, 2.5), (82, 1.25), (86, 3.0), (81, 3.5)], "u", vib=5.8), SALA, 0.6), 0.3)
poner(m, B(32), sub(38, B(40) - B(32), ataque=2.0, sat=1.2), 0.18)
poner(m, B(38), oleaje(B(40) - B(38)), 0.45)
# 5 · the kaleidoscope: a hit; the hexagon opens; an arpeggio that climbs; De Jong takes the frame
golpe(B(40), [26, 38, 45, 50, 57], 0.85, 5.0)
p(B(41), 86, 2.0, 0.22, SALA, 0.55)
for i in range(16):
    p(B(41) + i * BEAT / 3, ESC[min(len(ESC) - 1, 4 + i)], 0.6, 0.1 + 0.004 * i)
poner(m, B(46.5), oleaje(B(48.5) - B(46.5)), 0.5)
golpe(B(48.5), [31, 43, 50, 55, 62], 0.75, 4.0)
# 6 · the mosaic: one pulse per world, from the centre out; the grid closes; the last hit, wide, with the voice
for n in range(9):
    p(B(50 + n * 0.5), ESC[6 + n * 2 if 6 + n * 2 < len(ESC) else -1], 1.0, 0.2, SALA, 0.45)
    poner(m, B(50 + n * 0.5), con_reverb(bombo(0.5), SALA_C, 0.25), 0.35)
poner(m, B(56.5), oleaje(B(58) - B(56.5)), 0.6)
golpe(B(58), [26, 33, 38, 45, 50, 57], 1.0, 9.0)
poner(m, B(58) + 0.2, con_reverb(voz([(81, 2.5), (82, 1.25), (86, 3.0), (81, 3.0)], "a", vib=5.8), SALA, 0.6), 0.4)

# ═══ part 2 ═══
# 7 · geometry: four panels, four hits; Hilbert traced (rising pulses); the seam opens on Vicsek
for i in range(4):
    poner(m, B(61 + 0.25 * i), con_reverb(bombo(0.8), SALA_C, 0.3), 0.7)
    p(B(61 + 0.25 * i), [62, 66, 69, 74][i], 1.2, 0.22, SALA, 0.45)
golpe(B(61), [26, 38, 45, 50], 0.8, 5.0)
for i, k in enumerate(range(63, 72)):
    p(B(k) + BEAT / 2, ESC[5 + (i % 6)], 0.6, 0.11)
poner(m, B(71.6), oleaje(B(73) - B(71.6)), 0.5)
golpe(B(73), [31, 43, 50, 55], 0.7, 4.0)
for i in range(8):
    p(B(73.5 + i), ESC[min(len(ESC) - 1, 6 + i)], 0.8, 0.14)
poner(m, B(79.6), oleaje(B(81) - B(79.6)), 0.5)
golpe(B(81), [26, 33, 38, 45, 50], 0.85, 6.0)
# 8 · trees: the grid stops; a warm voice; one low note per plant as it starts to grow; the real tree
poner(m, B(85), sub(31, B(101) - B(85), ataque=3.0, sat=1.0), 0.28)
poner(m, B(85.3), con_reverb(voz([(62, 3.0), (66, 2.0), (69, 3.0), (67, 2.0), (66, 4.0)], "o", vib=4.4), SALA, 0.6), 0.3)
for i in range(4):
    p(B(85 + 1.25 * i), [45, 50, 52, 57][i], 2.4, 0.26, SALA, 0.55)
poner(m, B(92), con_reverb(voz([(74, 2.5), (73, 1.25), (69, 4.0)], "a", vib=5.0), SALA, 0.6), 0.22)
golpe(B(95), [33, 45, 52, 57], 0.55, 4.0)
poner(m, B(99), oleaje(B(101) - B(99)), 0.55)
# 9 · nature: a hit; one pulse per photograph; the romanesco opens on the golden angle; the sunflower
golpe(B(101), [26, 38, 45, 50, 57], 0.9, 6.0)
for n in range(12):
    p(B(101 + n * 0.33), ESC[min(len(ESC) - 1, 2 + n)], 0.9, 0.15, SALA, 0.45)
poner(m, B(108.6), oleaje(B(111) - B(108.6)), 0.5)
golpe(B(111.5), [31, 38, 43, 50, 55], 0.7, 6.0)
poner(m, B(111.7), con_reverb(voz([(81, 2.5), (82, 1.25), (86, 3.0), (85, 2.0), (81, 3.0)], "u", vib=5.6), SALA, 0.6), 0.32)
for i in range(20):
    p(B(112) + i * BEAT / 4, [62, 66, 69, 74, 78][i % 5] + 12 * (i // 10), 0.5, 0.08)
golpe(B(117), [26, 38, 45, 50], 0.6, 4.0)
poner(m, B(118), con_reverb(voz([(74, 2.5), (78, 2.5), (81, 4.0)], "a", vib=5.2), SALA, 0.6), 0.26)
for i in range(3):
    poner(m, B(121 + 0.12 * i), con_reverb(bombo(0.9), SALA_C, 0.3), 0.75)
    p(B(121 + 0.12 * i), [57, 62, 66][i], 1.4, 0.22, SALA, 0.45)
golpe(B(125), [26, 38, 45, 50], 0.55, 6.0)

# 10 · webs: the grid stops; a high voice; one soft pulse per radial; the spiral, a slow rising line; the dive
poner(m, B(125.3), con_reverb(voz([(81, 3.0), (79, 2.0), (78, 3.0), (74, 4.0)], "u", vib=5.2), SALA, 0.65), 0.26)
for i in range(26):
    p(B(125.5) + i * 2.5 * BEAT / 26, [74, 78, 81, 86][i % 4], 0.9, 0.06, SALA, 0.5)
for i in range(15):
    p(B(128) + i * 5.5 * BEAT / 15, ESC[min(len(ESC) - 1, 3 + i)], 1.2, 0.09, SALA, 0.55)
poner(m, B(133.5), oleaje(B(141) - B(133.5)), 0.4)
poner(m, B(133.5), sub(38, B(141) - B(133.5), ataque=3.0, sat=1.0), 0.2)
for i, k in enumerate([134.5, 137.8]):
    p(B(k), [86, 90][i], 2.0, 0.16, SALA, 0.6)
# 11 · chaos: Lorenz, three voices that start together and part; the logistic map: the pulse doubles as it
# bifurcates (1, 2, 4, 8 per beat); Hénon: a rising 16th line; the riser into the drop
golpe(B(141), [26, 38, 45, 50], 0.75, 5.0)
for i in range(16):
    for v, d in enumerate((0, 1, -1)):
        p(B(141 + i * 0.5) + 0.01 * v * i, [62, 66, 69][v] + (d * (i // 4) if i > 6 else 0), 0.6, 0.07)
golpe(B(149), [31, 43, 50, 55], 0.7, 4.0)
for i, (a0, n) in enumerate([(149, 1), (150, 2), (151, 4), (152, 8)]):
    for kk in range(2):
        for j in range(n):
            p(B(a0 + kk * 0.5 + j / (2 * n)) if False else B(a0 + (kk + j / n) * 0.5), ESC[4 + (j % 6)], 0.4, 0.07 + 0.01 * i)
for j in range(40):
    p(B(153) + j * BEAT / 8, ESC[(j * 5) % len(ESC)], 0.3, 0.06)
golpe(B(157), [33, 45, 52, 57], 0.7, 4.0)
for j in range(56):
    p(B(157) + j * BEAT / 4 * (1 - 0.3 * j / 56), ESC[min(len(ESC) - 1, 2 + j // 3)], 0.3, 0.05 + 0.002 * j)
poner(m, B(161), oleaje(B(165) - B(161)), 0.7)
rev = con_reverb(braam([26, 38, 45, 50], 2.0, ataque=0.02, abre=1.2, brillo=1.2), SALA, 0.5)[::-1]
poner(m, B(165) - len(rev) / SR, rev, 0.55)

T_LOCO = B(165)
pre = m[:int((T_LOCO + 3.0) * SR)]
pre = pre / max(1e-9, np.abs(pre).max()) * 0.8
w_ = wave.open(str(RAIZ / "public" / "audio" / "loco.wav"))
loco = np.frombuffer(w_.readframes(w_.getnframes()), dtype=np.int16).astype(float).reshape(-1, 2) / 32767
fin_ = T_LOCO + len(loco) / SR
y = np.zeros((int(fin_ * SR) + 10, 2))
y[:len(pre)] += pre
i0 = int(T_LOCO * SR)
y[i0:i0 + len(loco)] += loco * 0.95
y = y[:int(D["total"] * SR)]
with wave.open(str(RAIZ / "public" / "audio" / "deleite.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo deleite.wav", f"{len(y) / SR:.1f} s")
