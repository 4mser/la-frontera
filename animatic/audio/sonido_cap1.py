"""Sound of the chapter 1 animatic (public/audio/cap1.wav), on src/cap1.json: a real heartbeat that writes the rule,
a sub drone barely there, a tuned pulse on every jump of the orbit (higher each time for c = 1, two soft notes that
alternate for c = −1), and the drone stepping back under the voice. A sketch for timing, not the final score.

Usage: PYTHONPATH=pylib python3 audio/sonido_cap1.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, con_reverb, filtro, poner, sub, t_  # noqa: E402

K = json.loads((RAIZ / "src" / "cap1.json").read_text())
V = json.loads((RAIZ / "src" / "cap1_voz.json").read_text())
N = int(K["total"] * SR) + SR


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


def pulso(f, dur=0.9, brillo=0.25):
    """A tuned pulse with the heart's attack: a sine and a soft octave, fast decay."""
    t = t_(int(dur * SR))
    env = (1 - np.exp(-t * 300)) * np.exp(-t * 5.5)
    return env * (np.sin(2 * np.pi * f * t) + brillo * np.sin(2 * np.pi * 2 * f * t) + 0.5 * np.sin(2 * np.pi * f / 2 * t))


m = np.zeros((N, 2))
poner(m, 0.3, latido(3), 1.0)
poner(m, 1.0, sub(26, K["total"] - 1.0, ataque=6.0), 0.18)
# c = 1: each jump a little higher (A minor pentatonic up)
for s, f in zip(K["c1"]["saltos"], [110, 131, 147, 165, 196]):
    poner(m, s, con_reverb(pulso(f), SALA_C, 0.3), 0.6)
# c = −1: two notes that swing, soft, like a heart at rest
for j, s in enumerate(K["cm1"]["saltos"]):
    poner(m, s, con_reverb(pulso(110 if j % 2 == 0 else 98, 1.2, 0.1), SALA, 0.4), 0.35)
# under the voice, the bed steps back
tt = np.arange(N) / SR
duck = np.ones(N)
for a, v in zip(K["voz"], V):
    for _, f0, f1 in v["frases"]:
        duck -= 0.3 * np.clip(np.minimum((tt - (a + f0) + 0.3) / 0.3, (a + f1 + 0.5 - tt) / 0.5), 0, 1)
m *= np.clip(duck, 0.4, 1)[:, None]
y = m[:int(K["total"] * SR)]
y = y / max(1e-9, np.abs(y).max()) * 0.7
with wave.open(str(RAIZ / "public" / "audio" / "cap1.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo cap1.wav", f"{len(y) / SR:.1f} s")
