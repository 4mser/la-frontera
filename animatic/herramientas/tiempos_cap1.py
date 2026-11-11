"""Timing of chapter 1 «La regla» (src/cap1.json), on its voice (src/cap1_voz.json).

Each scene's voice starts after the previous one ends plus a gap; the first starts after a silence. The beats of
scene 2 (the jumps of the orbit) land on the spoken numbers.

Usage: PYTHONPATH=pylib python3 herramientas/tiempos_cap1.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
V = json.loads((RAIZ / "src" / "cap1_voz.json").read_text())

SILENCIO = 2.4                        # black, then the point beats once and writes the rule
HUECO = [1.6, 2.0, 1.8, 1.6, 2.0, 2.2, 1.8]   # silence between scenes 1→2, 2→3, …
NOMBRES = ["Volver a la regla", "Dos destinos", "La primera frontera", "Un plano de números", "El mapa",
           "Los mundos de cada punto", "Las personas detrás", "La pregunta"]

voz = [SILENCIO]
for k in range(1, len(V)):
    voz.append(round(voz[-1] + V[k - 1]["fin"] + HUECO[k - 1], 2))


def frase(k, i):
    """[start, end] of piece i of scene k, in chapter time."""
    _, a, b = V[k]["frases"][i]
    return [round(voz[k] + a, 2), round(voz[k] + b, 2)]


def palabra(k, w, n=0):
    hits = [t for p, t in V[k]["palabras"] if p.lower().strip(".,¿?…") == w]
    return round(voz[k] + hits[n], 2)


# scene 1: the rule lights up part by part; the loop arrow on «vuelve»
regla = {"escribe": [0.9, 2.1], "z": palabra(0, "número"), "z2": palabra(0, "multiplícalo"), "c": palabra(0, "constante"),
         "vuelve": palabra(0, "vuelve")}
# scene 2: c = 1, the jumps on «uno, dos, cinco, veintiséis, seiscientos»; then c = −1 swings on a slow beat
saltos1 = [palabra(1, w, n) - 0.15 for w, n in [("uno", 1), ("dos", 0), ("cinco", 0), ("veintiséis", 0), ("seiscientos", 0)]]
menos = frase(1, 7)
saltos2 = [round(menos[0] + 0.9 + 0.85 * j, 2) for j in range(int((frase(1, 9)[0] - menos[0] - 0.9) / 0.85))]
escenas = [[voz[k] - (SILENCIO if k == 0 else HUECO[k - 1] / 2), voz[k] + V[k]["fin"] + (HUECO[k] / 2 if k < len(HUECO) else 3.0)] for k in range(len(V))]
escenas[0][0] = 0.0
C = {
    "fps": 30, "voz": voz, "escenas": [[round(a, 2), round(b, 2)] for a, b in escenas], "nombres": NOMBRES,
    "regla": regla,
    "c1": {"inicio": round(frase(1, 0)[0], 2), "saltos": [round(x, 2) for x in saltos1], "valores": [1, 2, 5, 26, 677],
           "escapa": frase(1, 6)},
    "cm1": {"inicio": menos[0], "saltos": saltos2, "lado": frase(1, 9)},
    "total": round(escenas[-1][1], 2),
}
(RAIZ / "src" / "cap1.json").write_text(json.dumps(C, ensure_ascii=False))
print(json.dumps({k: C[k] for k in ["voz", "escenas", "regla", "c1", "cm1", "total"]}, ensure_ascii=False))
