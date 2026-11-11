"""Sound of the prologue (public/audio/prologo2.wav), on src/prologo2.json, in the manner of a large-scale film score
of the desert-epic kind: an original piece, no borrowed melody.

- Silence; then a real heart, close and deep, on the record's own intervals.
- A huge sub drone that rises out of the dark with the glimpses, and a reverse swell into the moment the coast opens,
  which lands on a «braam» (a wall of distorted low brass).
- A female voice (audio/dune.py) sings a long phrase in D Phrygian dominant over the journey; quieter, higher, over
  the coast.
- Over the last lines: deep drum booms that get denser, braams that climb, the voice up an octave; everything stops
  dead right after the question. A lone beat in the silence; the next beat is the intro's first hit.

Usage: PYTHONPATH=pylib python3 audio/sonido_prologo2.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, filtro, oleaje, poner, sub, t_, voz  # noqa: E402

P = json.loads((RAIZ / "src" / "prologo2.json").read_text())
V = json.loads((RAIZ / "src" / "prologo2_voz.json").read_text())
N = int(P["total"] * SR) + 2 * SR


def leer(ruta):
    w = wave.open(str(ruta))
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float).reshape(-1, w.getnchannels()) / 32767


CORAZON = leer(RAIZ / "public" / "audio" / "corazon.wav")
ONSETS = json.loads((RAIZ / "public" / "audio" / "latidos_audio.json").read_text())


def latido(k, cerca=1.0):
    i = int((ONSETS[k % len(ONSETS)] - 0.05) * SR)
    x = CORAZON[i:i + int(0.8 * SR), 0].copy()
    x *= np.linspace(1, 0, len(x)) ** 0.6
    x = filtro(x, corte_alto=700 + 500 * (1 - cerca))
    t = t_(len(x))
    x = x + np.sin(2 * np.pi * 42 * t) * np.exp(-t * 14) * 0.5 * np.abs(x).max() * cerca
    return x / np.abs(x).max()


m = np.zeros((N, 2))
mus = np.zeros((N, 2))
corte = P["corte"]
VOZ = [(a, v["fin"]) for a, v in zip(P["voz"], V)]

# 1 · the heart, real, under everything; it steps back a little under the voice
for k, tb in enumerate(P["latidos"]):
    g = 0.6 if any(a - 0.3 <= tb <= a + d for a, d in VOZ) else 1.0
    poner(m, tb, latido(k), g)
poner(m, P["lentos"][0], con_reverb(latido(5, cerca=0.85), SALA_C, 0.25)[:, 0], 1.0)

# 2 · the drone rises out of the dark with the glimpses; a reverse swell into the coast, which lands on a braam
foto = P["foto"][0]
poner(mus, 5.5, sub(26, corte - 5.5, ataque=6.0), 0.55)
poner(mus, foto - 6.0, oleaje(6.0), 0.35)
poner(mus, foto, con_reverb(braam([26, 38, 45], 9.0, abre=1.0), SALA, 0.45), 0.85)
poner(mus, foto, bombo(1.2), 0.9)
# the journey: a second, higher drone and the voice
poner(mus, foto + 2.0, sub(38, corte - foto - 2.0, ataque=5.0, sat=1.2), 0.25)
frase1 = [(69, 2.4), (70, 1.2), (74, 3.0), (75, 1.4), (74, 1.2), (70, 2.6), (69, 4.0)]
poner(mus, P["voz"][0] + 1.0, con_reverb(voz(frase1, "a"), SALA, 0.55), 0.32)
# the cosmos: a softer braam, an octave up
poner(mus, P["cosmos"][0], con_reverb(braam([38, 45, 50], 7.0, abre=1.6, brillo=0.7), SALA, 0.5), 0.45)
# the coast: the music draws back; a quiet, higher line
frase2 = [(74, 3.0), (75, 1.6), (74, 2.0), (70, 3.4), (72, 4.0)]
poner(mus, P["costa"][0] + 2.5, con_reverb(voz(frase2, "o"), SALA, 0.6), 0.18)
for r in P["reglas"]:
    poner(mus, r, con_reverb(bombo(0.35), SALA_C, 0.3), 0.35)

# 3 · the last lines: booms that thicken, braams that climb, the voice an octave up; it all stops dead at the cut
a0 = P["voz"][2]
for k, tb in enumerate(b for b in P["latidos"] if b >= a0 - 0.1):
    u = (tb - a0) / (corte - a0)
    poner(mus, tb, con_reverb(bombo(0.5 + 0.6 * u), SALA_C, 0.25), 0.8)
    if u > 0.55:                                       # between beats, the drums double
        poner(mus, tb + 0.48, con_reverb(bombo(0.35 + 0.4 * u), SALA_C, 0.25), 0.6)
for tb, notas, g in [(a0, [26, 38, 45], 0.75), (a0 + 6.2, [29, 41, 48], 0.85), (P["voz"][3] - 0.2, [31, 43, 50, 55], 1.0)]:
    poner(mus, tb, con_reverb(braam(notas, 8.0, abre=0.9, brillo=1.2), SALA, 0.45), g)
frase3 = [(78, 2.0), (79, 1.0), (81, 2.4), (82, 1.6), (81, 1.2), (79, 2.0), (78, 3.0), (79, 3.0)]
poner(mus, a0 + 2.0, con_reverb(voz(frase3, "a", vib=5.6), SALA, 0.5), 0.28)
poner(mus, corte - 5.0, oleaje(5.0), 0.5)
# ducking: the music steps back under the voice
tt = np.arange(N) / SR
duck = np.ones(N)
for a, d in VOZ:
    duck -= 0.38 * np.clip(np.minimum((tt - a + 0.4) / 0.4, (a + d + 0.4 - tt) / 0.6), 0, 1)
mus *= duck[:, None]
# the hard stop, right after the question
mus[int(corte * SR):] = 0
m += mus
m = m[:int(P["total"] * SR)]
y = m / max(1e-9, np.abs(m).max()) * 0.9
with wave.open(str(RAIZ / "public" / "audio" / "prologo2.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo prologo2.wav", f"{len(y) / SR:.1f} s")
