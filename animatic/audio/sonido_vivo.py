"""Sound for the «vivo» preview: only the essentials (a deep hit and the real heartbeat on every beat, a low drone,
wide chords that change slowly). No other effects. Usage: PYTHONPATH=pylib python3 audio/sonido_vivo.py"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
import sonido_mg as S  # noqa: E402

V = json.loads((RAIZ / "src" / "vivo.json").read_text())
N = int(V["total"] * S.SR)
m = np.zeros((N, 2))
lr = S.latido()
dron = S.acorde([26, 38, 45], V["total"], brillo=260, ataque=1.0)
S.poner(m, 0.0, dron * np.minimum(1, np.linspace(0, 2.2, len(dron)) ** 2), 0.65)
prog = [[38, 50, 53, 57, 64, 69], [34, 46, 50, 53, 57, 65], [31, 43, 46, 50, 57, 62], [33, 45, 50, 52, 57, 64]]
L = V["latidos"]
for k in range(0, len(L), 4):
    t1 = L[k + 4] if k + 4 < len(L) else V["total"] - 0.5
    S.poner(m, L[k] - 0.2, S.acorde(prog[(k // 4) % 4], t1 - L[k] + 1.2, brillo=700 + 1800 * k / len(L), ataque=0.8), 0.5)
for k, tb in enumerate(L):
    S.poner(m, tb, S.golpe(fuerza=1.3 if k == 0 else 0.8 + 0.3 * k / len(L)), 1.0)
    S.poner(m, tb, lr, 0.3)
izq = S.con_reverb(m[:, 0], S.IR_GRANDE, 0.22)[:N]
der = S.con_reverb(m[:, 1], S.IR_GRANDE, 0.22)[:N]
y = np.stack([izq[:, 0], der[:, 1]], 1)
y = y / np.abs(y).max() * 0.9
fade = np.minimum(1, np.linspace(V["total"], 0, N) / 0.8)[:, None]
y = y * fade
with wave.open(str(RAIZ / "public" / "audio" / "vivo.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(S.SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo vivo.wav")
