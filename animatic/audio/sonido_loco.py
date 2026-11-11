"""«Deleite» · the wild section (sample, public/audio/loco.wav): 128 BPM, almost electronic, still the film's D Phrygian
dominant and its desert braams and voice. Four-on-the-floor kick with a hard punch, an off-beat saw bass ducked by
the kick, a 16th-note pluck arpeggio whose filter opens section by section, claps on 2 and 4, soft off-beat hats,
risers into every section and a braam on every change. The last beat closes into a reversed swell and a final hit.

Usage: PYTHONPATH=pylib python3 audio/sonido_loco.py
"""
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, filtro, hz, oleaje, poner, t_, voz  # noqa: E402

BPM, T0, BEATS = 128, 0.0, 64
BEAT = 60 / BPM
B = lambda k: T0 + k * BEAT
FIN = T0 + 66 * BEAT
N = int((FIN + 4) * SR)
m = np.zeros((N, 2))          # drums (not ducked)
mel = np.zeros((N, 2))        # bass, arp, pads (ducked by the kick)
rng = np.random.default_rng(3)


def bombo_e(f0=165, f1=46, dur=0.42):
    t = t_(int(dur * SR))
    f = f1 + (f0 - f1) * np.exp(-t * 38)
    fase = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(fase) * np.exp(-t * 7.5)
    click = filtro(rng.standard_normal(len(t)), corte_bajo=2500) * np.exp(-t * 300) * 0.35
    return np.tanh(1.8 * (x + click))


def palma(dur=0.35):
    n = int(dur * SR); t = t_(n)
    ruido = filtro(rng.standard_normal(n), corte_bajo=900, corte_alto=4200)
    env = sum(np.exp(-np.maximum(t - d, 0) * 60) * (t >= d) for d in (0, 0.011, 0.022)) * np.exp(-t * 9)
    cuerpo = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30) * 0.4
    return (ruido * env + cuerpo) * 0.8


def hat(dur=0.05, abierto=False):
    n = int((0.22 if abierto else dur) * SR); t = t_(n)
    return filtro(rng.standard_normal(n), corte_bajo=7500, corte_alto=14000) * np.exp(-t * (14 if abierto else 90))


def sierra(f, dur, corte, det=0.12, ataque=0.004, caida=6.0):
    n = int(dur * SR); t = t_(n)
    x = sum(2 * ((t * f * (1 + d * det / 100) + k * 0.13) % 1) - 1 for k, d in enumerate((-1, 0, 1)))
    x = filtro(x / 3, corte_alto=corte)
    return x * np.minimum(1, t / ataque) * np.exp(-t * caida)


# the chords, one per section of 8 beats (the film's mode): D, Eb, Bb, D, Gm (break), Eb, Bb, D
ACORDES = [[50, 54, 57, 62], [51, 55, 58, 63], [46, 50, 53, 58], [50, 54, 57, 62], [43, 46, 50, 55], [51, 55, 58, 63], [46, 50, 53, 58], [50, 54, 57, 62]]
RAICES = [26, 27, 22, 26, 31, 27, 22, 26]
CORTES = [1400, 2600, 4200, 5200, 900, 6500, 7200, 8000]
golpea = lambda k: not (32 <= k < 40) and k < 62           # the break and the last two beats have no kick
for k in range(BEATS):
    if golpea(k):
        poner(m, B(k), bombo_e(), 0.95)
        if k % 2 == 1:
            poner(m, B(k), con_reverb(palma(), SALA_C, 0.25), 0.42)
        poner(m, B(k + 0.5), hat(abierto=k >= 40), 0.12 if k < 40 else 0.1)
        if k >= 8:
            poner(m, B(k + 0.25), hat(), 0.05); poner(m, B(k + 0.75), hat(), 0.05)
# the build (beats 36–40): a clap roll that doubles, rising
for i, (a0, n) in enumerate([(36, 4), (37, 4), (38, 8), (39, 16)]):
    for j in range(n):
        poner(m, B(a0 + j / n), con_reverb(palma(0.2), SALA_C, 0.2), 0.12 + 0.05 * i + 0.002 * j)
# the bass: off-beat 8ths (silent in the break's first half, and in the last two beats)
for k in range(BEATS):
    if 32 <= k < 36 or k >= 62:
        continue
    s_ = k // 8
    r = RAICES[s_]
    nb = int(BEAT * 0.45 * SR)
    poner(mel, B(k + 0.5), sierra(hz(r + 12), BEAT * 0.45, 900, caida=5.0), 0.5)
    poner(mel, B(k + 0.5), np.sin(2 * np.pi * hz(r) * t_(nb)) * np.exp(-t_(nb) * 4), 0.55)
# the arp: 16ths over two octaves; the filter opens with each section, and sweeps open across the build
for k in range(BEATS):
    if k >= 62:
        continue
    s_ = k // 8
    notas = ACORDES[s_] + [n + 12 for n in ACORDES[s_]]
    corte = CORTES[s_] if not (36 <= k < 40) else 900 + (k - 36) * 1500
    for j in range(4):
        idx = (k * 4 + j) % 8
        nota = notas[idx if (k // 2) % 2 == 0 else 7 - idx]
        poner(mel, B(k + j / 4), sierra(hz(nota + 12), BEAT / 4 * 0.95, corte + (k - 36) * 400 * j / 4 * (36 <= k < 40), det=0.2, caida=9.0), 0.11 if k < 32 or k >= 36 else 0.07)
# pads: the chord held under each section
for s_ in range(8):
    for nota in ACORDES[s_]:
        poner(mel, B(s_ * 8), con_reverb(sierra(hz(nota), 8 * BEAT, 1600, det=0.35, ataque=0.4, caida=0.15), SALA, 0.5), 0.05 if s_ != 4 else 0.09)
# the desert: a braam on every change; risers into the sections; the voice in C, in the break and in the finale
for s_, notas in enumerate([[26, 38, 45, 50], [27, 39, 46, 51], [22, 34, 41, 46], [26, 38, 45, 50, 57], [31, 43, 50], [27, 39, 46, 51, 58], [22, 34, 41, 46, 53], [26, 38, 45, 50, 57]]):
    poner(m, B(s_ * 8), con_reverb(braam(notas, 3.5 if s_ != 4 else 6.0, ataque=0.02 if s_ != 4 else 0.6, abre=0.8, brillo=1.3), SALA, 0.4), 0.6 if s_ != 4 else 0.45)
    if s_ != 4:
        poner(m, B(s_ * 8), bombo(1.4), 0.6)
    if s_ > 0 and s_ != 4:
        poner(m, B(s_ * 8 - 2), oleaje(2 * BEAT), 0.55)
poner(m, B(36), oleaje(4 * BEAT), 0.7)                       # the long rise into the drop
poner(m, B(0), con_reverb(braam([26, 33, 38, 45, 50], 5.0, ataque=0.005, abre=1.2, brillo=1.4), SALA, 0.5), 0.8)
poner(mel, B(16) + 0.1, con_reverb(voz([(74, 1.5), (75, 0.75), (78, 1.5), (74, 1.5)], "a", vib=5.6), SALA, 0.55), 0.35)
poner(mel, B(32) + 0.1, con_reverb(voz([(67, 2.0), (70, 1.0), (74, 2.0), (72, 1.0), (70, 2.0)], "a", vib=5.0), SALA, 0.6), 0.4)
poner(mel, B(56) + 0.1, con_reverb(voz([(81, 1.5), (82, 0.75), (86, 1.5), (81, 1.5)], "u", vib=5.8), SALA, 0.55), 0.35)
# the close: beats 62–63 everything is pulled in (a reversed braam); beat 63, the final hit; then silence
rev = con_reverb(braam([26, 38, 45, 50], 2.2, ataque=0.02, abre=1.2, brillo=1.2), SALA, 0.5)[::-1]
poner(m, B(63) - len(rev) / SR, rev, 0.65)
poner(m, B(63), con_reverb(braam([26, 33, 38, 45, 50, 57], 6.0, ataque=0.005, abre=1.3, brillo=1.4), SALA, 0.5), 1.0)
poner(m, B(63), bombo(2.0), 1.0)
poner(m, B(63), bombo_e(120, 32, 1.2), 0.9)

# the sidechain: everything melodic ducks under the kick
tt = np.arange(N) / SR
duck = np.ones(N)
for k in range(BEATS):
    if not golpea(k):
        continue
    d = tt - B(k)
    duck *= 1 - 0.72 * np.where(d >= 0, np.exp(-d * 11), 0) * (d < BEAT)
y = m + mel * duck[:, None]
y = y[:int(FIN * SR)]
y = y / max(1e-9, np.abs(y).max()) * 0.95
y = np.tanh(y * 1.4) / np.tanh(1.4)
with wave.open(str(RAIZ / "public" / "audio" / "loco.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y * 0.9, -1, 1) * 32767).astype("<i2").tobytes())
print("listo loco.wav", f"{len(y) / SR:.1f} s")
