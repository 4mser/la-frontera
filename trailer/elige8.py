"""the hypercut by chapters: for each of the ten chapters, its best moving moments (something being drawn or moving
in part of the frame, never a dissolve, a cut or a title card), in its own order, never two alike.
→ hiper8.json {"bloques": [[chapter, start, n, d]…], "planos": [[trailer t, film t, d]…]}"""
import json, numpy as np
from pathlib import Path
AQUI = Path(__file__).parent
F = np.load(AQUI / "estables.npy").astype(np.float32) / 255; N = len(F); g = F.mean(axis=3)
dif = np.abs(np.diff(g, axis=0)); frac = (dif > 0.05).mean(axis=(1, 2)); media = dif.mean(axis=(1, 2))
lum = F.mean(axis=(1, 2, 3)); sat = (F.max(axis=3) - F.min(axis=3)).mean(axis=(1, 2)); det = np.abs(np.diff(g, axis=2)).mean(axis=(1, 2))
DET = np.percentile(det, 40)
bueno = np.zeros(N, bool)
for i in range(1, N - 2):
    fr = frac[i]
    bueno[i] = (0.015 <= fr <= 0.35 and not (media[i] > 0.02 and fr > 0.45) and frac[i - 1] < 0.6
                and det[i] > DET and lum[i + 1] > 0.75 * lum[i] and det[i + 1] > 0.75 * det[i])
score = np.clip(lum, 0, 0.5) + 1.6 * sat + 6.0 * det + 4.0 * np.sqrt(np.concatenate([frac, [0]])) - 2.0 * (lum < 0.06)
mini = g.reshape(N, 18, 5, 32, 5).mean(axis=(2, 4)).reshape(N, -1); mini = mini - mini.mean(axis=0, keepdims=True)
mini = (mini - mini.mean(axis=1, keepdims=True)) / (mini.std(axis=1, keepdims=True) + 0.02)
d_all = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2, 3)); escena = np.concatenate([[0], np.cumsum(d_all > 0.035)])
def parecido(i, j): c = float((mini[i] * mini[j]).mean()); return (escena[i] == escena[j] and c > 0.3) or c > 0.55
CAPS = [178.987, 479.36, 1011.306667, 1369.813667, 1665.920667, 2082.859667, 2353.238667, 2647.425667, 2974.742667, 3166.977667, 3838.31]
BLOQUES = [(10, 0.5)] * 8 + [(20, 0.25), (32, 0.25)]
idx = lambda s: int(round((s - 200.0) * 2))
plan, bloques, t, elegidos = [], [], 0.0, []
for k, (n, d) in enumerate(BLOQUES):
    a, b = max(CAPS[k] + 12.0, 200.5), CAPS[k + 1] - 4.0
    if k == 9: b = CAPS[k] + 400.0                     # chapter X: before its credits
    ix = np.arange(idx(a), min(N - 3, idx(b)))
    suyos = []
    for umbral, exige in ((0.45, True), (0.6, True), (0.6, False), (0.8, False)):
        if len(suyos) >= n: break
        for i in sorted(ix, key=lambda i: -score[i]):
            if len(suyos) >= n: break
            if exige and not bueno[i]: continue
            if any(abs(i - j) < 10 for j in suyos): continue
            if any((escena[i] == escena[j] and float((mini[i] * mini[j]).mean()) > 0.25) or float((mini[i] * mini[j]).mean()) > umbral for j in elegidos + suyos): continue
            suyos.append(i)
    suyos = sorted(suyos)[:n]; elegidos += suyos
    bloques.append([k + 1, round(t, 3), len(suyos), n * d])
    dd = n * d / len(suyos)                        # the block keeps its length (on the beat)
    for i in suyos: plan.append([round(t, 4), 200.0 + i / 2, dd]); t += dd
(AQUI / "hiper8.json").write_text(json.dumps({"bloques": bloques, "planos": plan, "dur": t}))
print(len(plan), "planos,", round(t, 2), "s")
