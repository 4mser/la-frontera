"""Sound of the prologue (public/audio/prologo.wav), on src/prologo.json: silence, then a real heart, close and deep,
on the exact intervals of the record; a soft low chord when the camera pulls back, under the data, cut before the
last line; then only the slowing beats, and the last one is the cut to chapter I.

Usage: PYTHONPATH=pylib python3 audio/sonido_prologo.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ.parent.parent / "sonido-serie"))
from sonido import IR_GRANDE, SR, con_reverb, filtro, hz, pad, t_  # noqa: E402

P = json.loads((RAIZ / "src" / "prologo.json").read_text())
N = int(P["total"] * SR) + SR


def leer(ruta):
    w = wave.open(str(ruta))
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float).reshape(-1, w.getnchannels()) / 32767


CORAZON = leer(RAIZ / "public" / "audio" / "corazon.wav")
ONSETS = json.loads((RAIZ / "public" / "audio" / "latidos_audio.json").read_text())


def latido(k, cerca=1.0):
    """One real heartbeat from the recording, low-passed with a little sub, as through a stethoscope."""
    i = int((ONSETS[k % len(ONSETS)] - 0.05) * SR)
    x = CORAZON[i:i + int(0.8 * SR), 0].copy()
    x *= np.linspace(1, 0, len(x)) ** 0.6
    x = filtro(x, corte_alto=700 + 500 * (1 - cerca))
    t = t_(len(x))
    x = x + np.sin(2 * np.pi * 42 * t) * np.exp(-t * 14) * 0.5 * np.abs(x).max() * cerca
    return x / np.abs(x).max()


def poner(dst, t0, x, g=1.0):
    x = np.stack([x, x], 1) if x.ndim == 1 else x
    i = int(t0 * SR)
    k = min(len(x), len(dst) - i)
    if k > 0:
        dst[i:i + k] += x[:k] * g


def mono(x):
    return x[:, 0] if x.ndim > 1 else x


m = np.zeros((N, 2))
VOZ = json.loads((RAIZ / "src" / "prologo_voz.json").read_text())
voces = [(t, v["fin"]) for t, v in zip(P["voz"], VOZ)]
for k, tb in enumerate(P["latidos"]):
    # under the voice the heart steps back a little
    g = 0.55 if any(v - 0.4 <= tb <= v + d for v, d in voces) else 1.0
    poner(m, tb, latido(k), g)
for k, tb in enumerate(P["lentos"]):
    poner(m, tb, con_reverb(latido(k + 3, cerca=1 - k / 9), IR_GRANDE, 0.15 + 0.05 * k)[:, 0], 1.0 - 0.04 * k)
# a soft low chord from the pull-back until the line starts to wind
z0, corte = P["zoom"][0], P["enrolla"][0]
cho = mono(sum(pad(hz(n), corte - z0 + 1.0, detune=0.06, brillo=500, ataque=6.0) for n in (38, 45, 50, 57)))
env = np.minimum(1, np.linspace(0, (corte - z0 + 1.0) / 4, len(cho)))
i1 = int((corte - z0) * SR)
env[i1:] *= np.linspace(1, 0, len(env) - i1) ** 2
poner(m, z0, cho * env, 0.22)
m = m[:int(P["total"] * SR)]
y = m / max(1e-9, np.abs(m).max()) * 0.9
with wave.open(str(RAIZ / "public" / "audio" / "prologo.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo prologo.wav", f"{len(y) / SR:.1f} s")
