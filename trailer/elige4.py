"""the hypercut's shots, chosen again: one per slice of the film, in order; only moments that hold still for the whole
cut and a little around it (no frame caught in the middle of a dissolve), each one unlike every shot already chosen
(no photograph twice, no shot that seems to last longer than its beat). → hiper4.json [[trailer t, film t, dur]…]"""
import json, numpy as np
from pathlib import Path
from arma_trailer import hiper_cortes
AQUI = Path(__file__).parent
F = np.load(AQUI / "estables.npy").astype(np.float32) / 255           # every 0.5 s from 200 s
N = len(F)
g = F.mean(axis=3)
d = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2, 3))                     # change between consecutive half-seconds
quieto = np.full(N, 9.0)
for i in range(1, N - 3): quieto[i] = max(d[i - 1], d[i], d[i + 1], d[i + 2])  # 1.5 s around the start, still
lum = F.mean(axis=(1, 2, 3)); sat = (F.max(axis=3) - F.min(axis=3)).mean(axis=(1, 2)); det = np.abs(np.diff(g, axis=2)).mean(axis=(1, 2))
score = np.clip(lum, 0, 0.5) + 1.6 * sat + 6.0 * det - 5.0 * (lum < 0.07) - 30.0 * np.clip(quieto - 0.012, 0, None) - 4.0 * (det < np.percentile(det, 45)) - 2.0 * (lum < 0.11)
mini = g.reshape(N, 18, 5, 32, 5).mean(axis=(2, 4)).reshape(N, -1)       # 32×18 thumbnails, normalised: their shape
mini = mini - mini.mean(axis=0, keepdims=True)                           # without the film's own vignette
mini = (mini - mini.mean(axis=1, keepdims=True)) / (mini.std(axis=1, keepdims=True) + 0.02)
color = F.reshape(N, -1, 3).mean(axis=1)
escena = np.concatenate([[0], np.cumsum(d > 0.035)])                    # a new scene at every hard change
def parecido(i, j): c = float((mini[i] * mini[j]).mean()); return (escena[i] == escena[j] and c > 0.3) or c > 0.55
LIM = float(np.percentile(score, 50)); print("umbral", round(LIM, 3))
cortes = hiper_cortes()
tramos = np.array_split(np.arange(N), len(cortes))
elegidos = []
for n_, ix in enumerate(tramos):
    ult = elegidos[-1] if elegidos else -1
    for ancho in (0, 1, 2, 4, 8):                # the slice, then wider and wider (always after the last shot)
        vec = np.concatenate(tramos[max(0, n_ - ancho):n_ + 1 + ancho])
        vec = vec[vec > ult + 2]
        ok = [i for i in vec if score[i] > LIM and quieto[i] <= 0.045 and not any(parecido(i, j) for j in elegidos) and not any(float((mini[i] * mini[j]).mean()) > 0.2 or (np.abs(color[i] - color[j]).max() < 0.035 and min(lum[i], lum[j]) > 0.15) for j in elegidos[-2:])]
        if ok:
            cen = ix.mean()
            elegidos.append(max(ok, key=lambda i: score[i]) if ancho == 0 else min(ok, key=lambda i: abs(i - cen))); break
    else:
        print("sin plano para", n_); elegidos.append(int(vec[0]) if len(vec) else ult + 3)
plan = [[a, 200.0 + i / 2 + 0.05, dd] for (a, dd), i in zip(cortes, elegidos)]
(AQUI / "hiper4.json").write_text(json.dumps(plan))
print(len(plan), "cortes;", "quietud máx", round(float(max(quieto[i] for i in elegidos)), 4))
