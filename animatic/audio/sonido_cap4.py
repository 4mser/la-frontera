"""Score of chapter IV «Cómo crece una forma» (public/audio/cap4.wav), on src/cap4.json. The same palette as the
opening and chapters I-III (audio/dune.py): every visible event has its sound.

- Title: a tuned pulse every time the small aggregate triples; the braam on the title.
- Three forms: a pulse as each photograph appears; a low pulse as each one fills the frame.
- Diffusion: a pulse on each portrait; the voice held while each walker wanders and a pulse when it sticks; a pulse
  every time the aggregate triples, over a swell; a braam when it is complete; high soft pulses as the late walkers
  hit the tips; a pulse as the mineral appears.
- Erosion: the rain as a soft noise bed; a rising swell while the network organizes; a pulse at every few snapshots;
  a braam when the network is complete; pulses on the portraits and the real network.
- Vessels: a shimmer as the points appear; pulses on the portraits; a pulse every ten steps of growth, climbing; a
  braam when the tree is complete; a pulse on the retina.
- Boxes: a chord as each grid appears; a pulse under each number.
- The prologue list: a pulse per tile.
- Close: a swell as the three forms meet; the voice; two heartbeats.

Usage: PYTHONPATH=pylib python3 audio/sonido_cap4.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, filtro, hz, oleaje, poner, sub, t_, voz  # noqa: E402

K = json.loads((RAIZ / "src" / "cap4.json").read_text())
V = json.loads((RAIZ / "src" / "cap4_voz.json").read_text())
N_PART = json.loads((RAIZ / "src" / "cap4_dla.json").read_text())["n"]
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
    i = int((ONSETS[k] - 0.05) * SR)
    x = CORAZON[i:i + int(0.8 * SR), 0].copy() * np.linspace(1, 0, int(0.8 * SR)) ** 0.6
    x = filtro(x, corte_alto=700)
    t = t_(len(x))
    x = x + np.sin(2 * np.pi * 42 * t) * np.exp(-t * 14) * 0.5 * np.abs(x).max()
    return x / np.abs(x).max()


def pulso(f, dur=0.8):
    t = t_(int(dur * SR))
    env = (1 - np.exp(-t * 400)) * np.exp(-t * 6)
    return env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.6 * np.sin(np.pi * f * t))


def brillo(dur, caida=1.2):
    n = int(dur * SR); t = t_(n)
    x = sum(np.sin(2 * np.pi * hz(mm) * t + mm) for mm in (86, 90, 93, 98)) * 0.25
    x += 0.4 * filtro(np.random.default_rng(3).standard_normal(n), corte_bajo=4000, corte_alto=11000)
    return x * np.exp(-t * caida) * np.minimum(1, t / 0.02)


def lluvia(dur):
    n = int(dur * SR); t = t_(n)
    x = filtro(np.random.default_rng(9).standard_normal(n), corte_bajo=1500, corte_alto=9000)
    return x * np.minimum(1, t / 1.5) * np.minimum(1, (dur - t) / 1.5)


def p(t, nota, dur=1.0, vol=0.26, sala=SALA_C, mezcla=0.35):
    poner(m, t, con_reverb(pulso(hz(nota), dur), sala, mezcla), vol)


ESCALA = [50, 54, 55, 57, 58, 62, 63, 66, 67, 69, 74, 75, 78]
poner(m, 0.3, sub(26, fin - 0.3, ataque=2.0, sat=0.6), 0.2)

# ─── 0 · title ───
p(K["semilla"] + 0.2, 50, 1.6, 0.3, SALA, 0.5)
u0, du = K["semilla"] + 0.4, K["titulo"] - K["semilla"] - 0.6
for k, n in enumerate((3, 10, 30, 100, 300, 1000)):
    p(u0 + du * np.log(n) / np.log(3000), ESCALA[k], 1.0, 0.22)
poner(m, K["titulo"] - 1.2, oleaje(1.2), 0.45)
poner(m, K["titulo"], con_reverb(braam([26, 38, 45], 6.5, ataque=0.03, abre=0.9, brillo=1.0), SALA, 0.45), 0.85)
poner(m, K["titulo"], bombo(1.3), 0.95)
poner(m, K["titulo"] + 0.4, con_reverb(voz([(62, 2.0), (63, 1.0), (66, 2.5), (62, 2.5)], "a"), SALA, 0.55), 0.3)

# ─── 1 · three forms ───
for tt, nota in zip(K["fotos3"], (62, 66, 69)):
    p(tt - 0.3, nota, 1.4, 0.28, SALA, 0.45)
t0, t1 = VZ[1], K["difusion"] - 0.6
for i in range(3):
    p(t0 + i * (t1 - t0) / 3 - 0.3, [50, 54, 57][i], 1.8, 0.26, SALA, 0.5)

# ─── 2 · diffusion ───
for tt, nota in zip(K["retratosWS"], (62, 66)):
    p(tt - 0.2, nota, 1.4, 0.26, SALA, 0.45)
for i, ((a, b), nota) in enumerate(zip(K["cam"], (62, 66, 69))):
    poner(m, a, con_reverb(voz([(nota + 12, b - a + 0.4)], "o", vib=4.6), SALA, 0.6), 0.07)
    p(b, nota, 1.4, 0.34, SALA, 0.45)
    poner(m, b, con_reverb(bombo(0.5 + 0.05 * i), SALA_C, 0.25), 0.4)
c0, c1 = K["crece"]
poner(m, c0, oleaje(c1 - c0), 0.4)
umbral, k = 12, 0
for i in range(1, 6001):
    u = i / 6000
    if 4 * (N_PART / 4) ** u >= umbral:
        p(c0 + (c1 - c0) * u, ESCALA[min(k, len(ESCALA) - 1)], 1.0, 0.24 + 0.01 * k)
        umbral *= 3; k += 1
poner(m, c1 - 0.1, con_reverb(braam([26, 38, 45, 50], 6.0, ataque=0.03, abre=1.0, brillo=1.0), SALA, 0.5), 0.75)
poner(m, c1 - 0.1, bombo(1.3), 0.85)
poner(m, c1 + 0.2, con_reverb(voz([(62, 2.0), (66, 1.5), (69, 3.0)], "a", vib=5.2), SALA, 0.6), 0.22)
for j in range(10):
    p(K["pantalla"] + j * 0.55 + 1.6, [74, 78, 81][j % 3], 0.8, 0.14)
p(K["manganeso"] + 0.6, 57, 2.0, 0.28, SALA, 0.5)

# ─── 3 · erosion ───
poner(m, K["lluvia"] - 1.2, lluvia(K["cauces"][0] + 9.2 - K["lluvia"]), 0.18)
a, b = K["cauces"]
poner(m, a, con_reverb(braam([38, 45], b - a, ataque=b - a - 2.0, abre=3.0, brillo=0.7), SALA, 0.4), 0.3)
for j, ks in enumerate((2, 5, 9, 14, 20, 28, 40)):
    p(a + (b - a) * (ks / 40) ** (1 / 0.75), ESCALA[j + 2], 1.2, 0.22, SALA, 0.4)
poner(m, b - 0.1, con_reverb(braam([26, 38, 45], 5.0, ataque=0.03, abre=1.0, brillo=1.0), SALA, 0.5), 0.6)
poner(m, b - 0.1, bombo(1.2), 0.7)
p(K["optimas"] + 1.5, 62, 1.4, 0.26, SALA, 0.45)
p(K["optimas"] + 1.8, 66, 1.4, 0.24, SALA, 0.45)
p(VZ[12] + 1.6, 57, 2.0, 0.26, SALA, 0.5)

# ─── 4 · vessels ───
poner(m, K["vasos"] + 0.4, con_reverb(brillo(3.0, 0.8), SALA, 0.5), 0.12)
p(K["colonia"] + 1.4, 62, 1.4, 0.26, SALA, 0.45)
p(K["colonia"] + 1.7, 66, 1.4, 0.24, SALA, 0.45)
a, b = K["arbol"]
poner(m, a, oleaje(b - a), 0.32)
for j in range(1, 10):
    # the tree grows with an ease-in-out: the step j/10 arrives at the time where eIO(u) = j/10
    uu = np.linspace(0, 1, 4001); e = np.where(uu < 0.5, 4 * uu ** 3, 1 - (-2 * uu + 2) ** 3 / 2)
    p(a + (b - a) * uu[np.searchsorted(e, j / 10)], ESCALA[j + 1], 1.0, 0.22)
poner(m, b - 0.1, con_reverb(braam([26, 38, 45, 50], 5.5, ataque=0.03, abre=1.0, brillo=1.0), SALA, 0.5), 0.6)
poner(m, b - 0.1, bombo(1.2), 0.7)
p(K["retina"], 57, 2.0, 0.26, SALA, 0.5)

# ─── 5 · boxes ───
r0, r1 = K["rejilla"]
for j in range(3):
    for nota in ([50, 57, 62], [54, 62, 66], [57, 66, 69])[j]:
        p(r0 + j * (r1 - r0) / 3, nota, 1.4, 0.13, SALA, 0.45)
for i in range(3):
    p(r1 - 0.2 + i * 0.4, [62, 66, 69][i], 1.4, 0.3, SALA, 0.45)

# ─── 6 · the prologue list ───
for i in range(6):
    p(K["mosaico"] + i * 0.45, ESCALA[3 + i], 1.0, 0.22)

# ─── 7 · close ───
poner(m, K["cierre"], oleaje(2.0), 0.4)
poner(m, K["cierre"] + 1.9, con_reverb(braam([38, 45, 50], 4.0, ataque=0.05, abre=1.2, brillo=0.9), SALA, 0.45), 0.45)
poner(m, K["cierre"] + 2.0, con_reverb(voz([(62, 2.0), (63, 1.0), (66, 2.5), (62, 3.0)], "a", vib=5.4), SALA, 0.6), 0.22)
for k, tl in enumerate(K["latidos"]):
    poner(m, tl, latido(4 + k), 0.75)

tt = np.arange(N) / SR
duck = np.ones(N)
for a, v in zip(VZ, V):
    duck -= 0.42 * np.clip(np.minimum((tt - a + 0.3) / 0.3, (a + v["fin"] + 0.4 - tt) / 0.5), 0, 1)
m *= np.clip(duck, 0.45, 1)[:, None]
y = m[:int(fin * SR)]
y = y / max(1e-9, np.abs(y).max()) * 0.9
with wave.open(str(RAIZ / "public" / "audio" / "cap4.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo cap4.wav", f"{len(y) / SR:.1f} s")
