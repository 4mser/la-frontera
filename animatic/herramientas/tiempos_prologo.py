"""Timing of the prologue (src/prologo.json), on the real healthy record and on the voice (src/prologo_voz.json):
every beat you hear falls on the interval the record measured; the image breathes alone until the camera has
pulled back; the three windows (seconds, minutes, hours) light up on the words; the heart slows down, a lone beat
between the last two lines, and the last beat is the cut to chapter I.

Usage: PYTHONPATH=pylib python3 herramientas/tiempos_prologo.py
"""
import json
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
L = json.loads((RAIZ / "src" / "latido.json").read_text())
V = json.loads((RAIZ / "src" / "prologo_voz.json").read_text())
rr = np.array(L["sano"]["rr"])
SILENCIO = 3.2
voz = [25.0]
voz.append(voz[0] + V[0]["fin"] + 4.0)        # the failing heart appears a second before
voz.append(voz[1] + V[1]["fin"] + 2.0)        # after the panel has started to build
enrolla = [voz[2] + V[2]["fin"] + 1.5, 0]
enrolla[1] = enrolla[0] + 5.0
voz.append(enrolla[0] + 0.5)
voz.append(voz[3] + V[3]["fin"] + 1.8)        # the real pause before «En la frontera»
solo = voz[4] + V[4]["fin"] + 1.6             # a lone beat
voz.append(solo + 1.0)
ultimo = voz[5] + V[5]["fin"] + 1.6
v = 120
inicio = int(np.argmax(np.convolve(rr, np.ones(v) / v, mode="valid")))
t, latidos, k = SILENCIO, [], inicio
while t < enrolla[0]:
    latidos.append(round(t, 3))
    t += rr[k]
    k += 1
# the heart slows down while the line winds; one beat just before «En la frontera», the lone beat, the last one
lentos, t = [], latidos[-1]
for d in (1.3, 1.7, 2.1, 2.5):
    t += d
    lentos.append(round(t, 3))
lentos += [round(voz[4] - 0.4, 3), round(solo, 3), round(ultimo, 3)]
ventanas = [round(voz[0] + next(p[1] for p in V[0]["palabras"] if p[0] == w), 2) for w in ("segundos", "minutos", "horas")]
P = {"fps": 30, "silencio": SILENCIO, "inicio": inicio, "latidos": latidos, "lentos": lentos,
     "zoom": [16.0, 27.0], "voz": [round(x, 2) for x in voz], "ventanas": ventanas, "ventanasFin": round(voz[1] - 1.6, 2),
     "ic": round(voz[1] - 1.0, 2), "dfa": [round(voz[1] + 3.0, 2), round(voz[1] + 14.0, 2)], "enrolla": [round(x, 2) for x in enrolla],
     "total": round(ultimo + 0.04, 3)}
(RAIZ / "src" / "prologo.json").write_text(json.dumps(P))
print("voz", P["voz"], "· ventanas", ventanas, "· ic", P["ic"], "· dfa", P["dfa"], "· enrolla", P["enrolla"], "· lentos", lentos, "· total", P["total"])
