"""the hypercut's shots, chosen for motion: one per slice of the film, in order, each one a moment when something is
being drawn or is moving in part of the frame (a border being traced, a set growing, a curve running), never a
dissolve (the whole frame changing at once) nor a cut; never two alike. → hiper5.json [[trailer t, film t, dur]…]"""
import json, numpy as np
from pathlib import Path
from arma_trailer import hiper_cortes
AQUI = Path(__file__).parent
F = np.load(AQUI / "estables.npy").astype(np.float32) / 255           # every 0.5 s from 200 s
N = len(F); g = F.mean(axis=3)
dif = np.abs(np.diff(g, axis=0))                                       # (N-1, 90, 160)
frac = (dif > 0.05).mean(axis=(1, 2))                                  # how much of the frame changes in half a second
media = dif.mean(axis=(1, 2))
# moving in part of the frame: 1.5 %–35 % of it changes, and not the whole frame faintly (a dissolve)
vivo = np.zeros(N); bueno = np.zeros(N, bool)
for i in range(1, N - 2):
    fr = frac[i]; disuelve = media[i] > 0.02 and fr > 0.45
    corte = frac[i - 1] > 0.6 or frac[i] > 0.6
    bueno[i] = 0.015 <= fr <= 0.35 and not disuelve and not corte
    vivo[i] = fr
lum0 = F.mean(axis=(1, 2, 3))
lum = lum0; sat = (F.max(axis=3) - F.min(axis=3)).mean(axis=(1, 2)); det = np.abs(np.diff(g, axis=2)).mean(axis=(1, 2))
score = np.clip(lum, 0, 0.5) + 1.6 * sat + 6.0 * det + 4.0 * np.sqrt(vivo) - 2.0 * (lum < 0.06)
mini = g.reshape(N, 18, 5, 32, 5).mean(axis=(2, 4)).reshape(N, -1)
mini = mini - mini.mean(axis=0, keepdims=True)
mini = (mini - mini.mean(axis=1, keepdims=True)) / (mini.std(axis=1, keepdims=True) + 0.02)
d_all = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2, 3))
escena = np.concatenate([[0], np.cumsum(d_all > 0.035)])
color = F.reshape(N, -1, 3).mean(axis=1)
def parecido(i, j): c = float((mini[i] * mini[j]).mean()); return (escena[i] == escena[j] and c > 0.3) or c > 0.55
DET = np.percentile(det, 40)
for i in range(1, N - 2): bueno[i] = bueno[i] and det[i] > DET and lum[i + 1] > 0.75 * lum[i] and det[i + 1] > 0.75 * det[i]
import sys
def cortes7():
    """v7: 10 s of half-second cuts, 12 s of quarter-second cuts, 6 s of sixth-of-a-second cuts (120 BPM)"""
    out, t = [], 0.0
    for dur, d in ((10.0, 0.5), (12.0, 0.25), (6.0, 1 / 6)):
        for _ in range(int(round(dur / d))): out.append((round(t, 4), d)); t += d
    return out
V7 = sys.argv[1:] == ["v7"]
NC = len(cortes7()) if V7 else (int(sys.argv[1]) if len(sys.argv) > 1 else len(hiper_cortes()))
cortes = cortes7() if V7 else ([(0.0, 0.5)] * NC if NC != len(hiper_cortes()) else hiper_cortes()); tramos = np.array_split(np.arange(N), len(cortes)); elegidos = []
for n_, ix in enumerate(tramos):
    ult = elegidos[-1] if elegidos else -1
    for ancho in (0, 1, 2, 4, 8):
        vec = np.concatenate(tramos[max(0, n_ - ancho):n_ + 1 + ancho]); vec = vec[vec > ult + 2]
        ok = [i for i in vec if bueno[i] and not any(parecido(i, j) for j in elegidos)
              and not any(float((mini[i] * mini[j]).mean()) > 0.2 or (np.abs(color[i] - color[j]).max() < 0.035 and min(lum[i], lum[j]) > 0.15) for j in elegidos[-2:])]
        if ok:
            cen = ix.mean(); elegidos.append(max(ok, key=lambda i: score[i]) if ancho == 0 else min(ok, key=lambda i: abs(i - cen))); break
    else:
        print("sin plano para", n_); elegidos.append(int(vec[0]) if len(vec) else ult + 3)
plan = [[a, 200.0 + i / 2, dd] for (a, dd), i in zip(cortes, elegidos)]
(AQUI / ("hiper7.json" if V7 else "hiper5.json" if NC == len(hiper_cortes()) else "hiper5b.json")).write_text(json.dumps(plan))
print(len(plan), "cortes; movimiento medio", round(float(np.mean([vivo[i] for i in elegidos])), 3))
