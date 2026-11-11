"""The desert-epic layer of the intro in the film (public/audio/montaje_dune.wav), on src/montaje.json and the timing
of the opening (src/prologo2.json, src/prologo2_voz.json). It is added on top of the intro's own score, so the
approved hits stay where they are and gain weight:

- the first hit, after the prologue's silence, is an enormous braam;
- a sub drone under the montage, and a deep boom every second beat;
- braams that climb into the climax and a colossal one on the collapse;
- after the collapse, the female voice over the still Mandelbrot (it steps back under «Esta es una película…»);
- on the word «universo», a radiant chord with the raised third, the voice up high, and a last braam with the title.

Usage: PYTHONPATH=pylib python3 audio/sonido_mg_dune.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, oleaje, poner, sub, voz  # noqa: E402

M = json.loads((RAIZ / "src" / "montaje.json").read_text())
P = json.loads((RAIZ / "src" / "prologo2.json").read_text())
V = json.loads((RAIZ / "src" / "prologo2_voz.json").read_text())
L = M["latidos"]
N = int(M["total"] * SR)
m = np.zeros((N, 2))
corte, calma, titulo = M["corte"], M["calma"], M["titulo"]
v5, v6 = P["vozIntro"]
universo = v6 + next(p[1] for p in V[5]["palabras"] if p[0].lower().strip(".,") == "universo")

# the burst: the first hit
poner(m, L[0], con_reverb(braam([26, 38, 45, 50], 9.0, ataque=0.03, abre=0.8, brillo=1.3), SALA, 0.4), 1.0)
poner(m, L[0], bombo(1.6), 1.0)
# under the montage: the drone, a boom every second beat
poner(m, L[0], sub(26, corte - L[0] + 0.5, ataque=1.0), 0.45)
for k, b in enumerate(L[1:], 1):
    if k % 2 == 0:
        poner(m, b, con_reverb(bombo(0.45 + 0.3 * k / len(L)), SALA_C, 0.25), 0.55)
# into the climax: braams that climb, a swell to the collapse
c0 = M["climax"]
for tb, notas, g in [(c0, [29, 41, 48], 0.7), (c0 + (corte - c0) / 2, [31, 43, 50, 55], 0.8)]:
    poner(m, tb, con_reverb(braam(notas, 6.0, abre=0.7, brillo=1.2), SALA, 0.4), g)
poner(m, corte - 3.0, oleaje(3.0), 0.5)
# the collapse: a colossal braam that rings into the silence
poner(m, corte, con_reverb(braam([26, 38, 45, 50, 57], 12.0, ataque=0.02, abre=1.0, brillo=1.4), SALA, 0.5), 1.0)
poner(m, corte, bombo(1.8), 1.0)
# after the collapse: the voice over the still set
poner(m, calma + 0.5, con_reverb(voz([(69, 3.0), (70, 1.4), (74, 3.2), (72, 1.6), (70, 2.4), (69, 4.5)], "a"), SALA, 0.55), 0.45)
# the dive: the drone returns and rises; «universo» opens a radiant chord, the voice up high
poner(m, M["voz"] + M["dibuja"] - 1.0, sub(26, titulo - (M["voz"] + M["dibuja"]) + 2.0, ataque=4.0), 0.45)
poner(m, universo - 3.0, oleaje(3.0), 0.4)
poner(m, universo, con_reverb(braam([38, 45, 50, 54, 57], 9.0, ataque=0.15, abre=1.4, sat=1.6, brillo=0.9), SALA, 0.55), 0.85)
poner(m, universo + 0.3, con_reverb(voz([(81, 2.6), (82, 1.2), (86, 3.0), (85, 3.0)], "u", vib=5.8), SALA, 0.6), 0.4)
# the cosmic zoom: a deep boom when each new world appears (the stage times of src/cosmos.json; the galaxy's detail tile
# is the same image, so it gets none), a swell that grows towards the neurons, and the arrival: when the neurons open
# into the cosmic web, a radiant braam with the voice up high, held until the title
C = json.loads((RAIZ / "src" / "cosmos.json").read_text())
E = C["etapas"]


def tiempos_etapas():
    """Time at which each stage begins: the same camera as src/montajeMG.ts (constant zoom speed that eases in from the
    cut and settles on arrival), integrated over the log-zoom."""
    LZ = np.concatenate([[0], np.cumsum([np.log(e["entra"][2] / e["sale"][2]) for e in E])])
    lfin = LZ[-1]
    def ess(x):
        x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
    lfrena = LZ[C["frena"]]
    ritmo = lambda L: ((0.3 + 0.7 * ess(L / 1.0)) * (0.12 + 0.88 * (1 - ess((L - (lfin - 0.9)) / 0.9)))
                       * (0.62 + 0.6 * (1 - ess((L - (lfrena - 1.6)) / 1.4)))
                       * (1 + C["acelera"]["cuanto"] * ess((L - LZ[C["acelera"]["etapa"]] - 0.3) / 0.6)
                          * (1 - ess((L - (LZ[C["acelera"]["etapa"] + 1] - 0.8)) / 0.6))))
    n = 4000
    Lm = lfin * (np.arange(n) + 0.5) / n
    t = np.concatenate([[0], np.cumsum(lfin / n / ritmo(Lm))])
    t = C["corte"] + t * (C["llega"] - C["corte"]) / t[-1]
    return [float(np.interp(L, lfin * np.arange(n + 1) / n, t)) for L in LZ[:-1]]


T_ETAPAS = tiempos_etapas()
nuevas = [T_ETAPAS[k] for k in range(1, len(E) - 1) if E[k]["src"] != "p5/3-estrella.jpg"]
print("stages at", [round(x, 2) for x in T_ETAPAS])
for i, tb in enumerate(nuevas):
    poner(m, tb - 0.1, con_reverb(bombo(0.5 + 0.5 * (i + 1) / len(nuevas)), SALA_C, 0.3), 0.75)
llegada = T_ETAPAS[-1] + 0.4
poner(m, C["corte"] + 1.0, oleaje(llegada - C["corte"] - 1.0), 0.45)
poner(m, C["corte"] + 1.5, sub(38, llegada - C["corte"], ataque=3.0, sat=1.2), 0.3)
poner(m, llegada, con_reverb(braam([26, 38, 45, 50, 57], 6.0, ataque=0.05, abre=1.3, brillo=1.1), SALA, 0.55), 0.85)
poner(m, llegada, bombo(1.1), 0.8)
poner(m, llegada + 0.2, con_reverb(voz([(86, 2.0), (85, 1.4), (81, 3.0)], "u", vib=5.8), SALA, 0.6), 0.35)
# the title
poner(m, titulo, con_reverb(braam([26, 38, 45, 50], 7.0, ataque=0.02, abre=0.9, brillo=1.2), SALA, 0.5), 0.95)
poner(m, titulo, bombo(1.4), 1.0)
# ducking under the two lines spoken in the intro
tt = np.arange(N) / SR
duck = np.ones(N)
for a, d in [(v5, V[4]["fin"]), (v6, V[5]["fin"])]:
    duck -= 0.4 * np.clip(np.minimum((tt - a + 0.4) / 0.4, (a + d + 0.4 - tt) / 0.6), 0, 1)
m *= duck[:, None]
y = m / max(1e-9, np.abs(m).max()) * 0.9
with wave.open(str(RAIZ / "public" / "audio" / "montaje_dune.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
print("listo montaje_dune.wav", f"{len(y) / SR:.1f} s · universo en", round(universo, 2))
