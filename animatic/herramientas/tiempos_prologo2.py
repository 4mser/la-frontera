"""Timing of the prologue v2 «El borde de todo» (src/prologo2.json), on the voice (src/prologo2_voz.json) and on the
real healthy record: the heart beats on its real intervals until the music cuts, then slows down; a lone beat
between the last two lines; the last beat writes the rule.

Usage: PYTHONPATH=pylib python3 herramientas/tiempos_prologo2.py
"""
import json
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
L = json.loads((RAIZ / "src" / "latido.json").read_text())
V = json.loads((RAIZ / "src" / "prologo2_voz.json").read_text())
rr = np.array(L["sano"]["rr"])
pal = lambda k, w: next(p[1] for p in V[k]["palabras"] if p[0].lower().strip(".,¿?") == w)

SILENCIO = 3.2
# lines 1-4 belong to the prologue; 5 and 6 are spoken inside the intro, after the collapse (see VideoApertura)
# the coast's line comes after a silence in which the coast draws itself; its question is also written on screen
voz = [17.5, round(17.5 + V[0]["fin"] + 2.6, 2)]
# the coast: «¿Cuánto mide una costa?» draws it; Mandelbrot asks the question; the six rulers walk it from «regla»
# on, one every 1.25 s; then the dive into one point, with ever smaller rulers, until the length reads ∞
REGLA0 = voz[1] + pal(1, "regla")
reglas = [REGLA0 + 1.25 * j for j in range(6)]
zoom_costa = [reglas[-1] + 1.25, reglas[-1] + 6.75]
retrato = [voz[1] + pal(1, "en") - 0.3, voz[1] + pal(1, "depende") + 0.4]
voz += [zoom_costa[1] + 1.8]          # ∞ holds a moment before the next line
voz += [round(voz[2] + V[2]["fin"] + 1.8, 2)]      # a breath before the last question
CORTE = voz[3] + V[3]["fin"] + 0.5          # the music cuts right after the question
SOLO = CORTE + 1.3                           # a lone beat in the silence
ULTIMO = SOLO + 1.6                          # the next beat is the intro's first hit
v = 120
inicio = int(np.argmax(np.convolve(rr, np.ones(v) / v, mode="valid")))
t, latidos, k = SILENCIO, [], inicio
while t < CORTE:
    latidos.append(round(t, 3))
    t += rr[k]
    k += 1
lentos = [round(SOLO, 3)]
foto0 = next(x for x in latidos if x > 16.0)
destellos = []
for b0, b1 in zip(latidos, latidos[1:]):
    if b0 < 6.0 or b0 >= foto0:
        continue
    por = 1 if b0 < 8.0 else 2 if b0 < 10.0 else 3 if b0 < 13.0 else 4
    for q in range(por):
        destellos.append([round(b0 + q * (b1 - b0) / por, 3), 1 if q == 0 else 0])
# the list of the first line: each shot comes in just before its word is spoken, with a short dissolve
LISTA = [("delta", "río"), ("rayo", "rayo"), ("arboles", "árboles"), ("manos", "manos"), ("nervios", "sistema"), ("neurona", "neurona")]
FUNDE = 0.35
inicios = [voz[0] + pal(0, w) - 0.55 for _, w in LISTA]
cosmos0 = voz[0] + pal(0, "cuando") - 0.4
planos = {n: [round(a, 2), round(b + FUNDE, 2)] for (n, _), a, b in zip(LISTA, inicios, inicios[1:] + [cosmos0 + 0.85])}
P = {
    "fps": 30, "silencio": SILENCIO, "inicio": inicio, "latidos": latidos, "lentos": lentos, "voz": voz,
    "puntos": [SILENCIO, 10.0], "zoom": [10.0, 15.2],
    # [start, end] of every shot; consecutive shots overlap for the dissolve
    "corazon": [0.0, 17.2], "foto": [next(x for x in latidos if x > 16.0) - 0.03, round(planos["delta"][0] + 1.0, 2)], **planos, "funde": FUNDE,
    "cosmos": [round(cosmos0, 2), round(voz[1] - 1.4, 2)], "costa": [round(voz[1] - 2.4, 2), round(voz[2] - 0.4, 2)],
    "pregunta": [round(voz[1] - 0.1, 2), round(voz[1] + pal(1, "en") - 0.2, 2)], "reglas": [round(x, 2) for x in reglas],
    "zoomCosta": [round(x, 2) for x in zoom_costa], "retrato": [round(x, 2) for x in retrato],
    # the Mandelbrot is no longer shown here (the intro brings it); the music still swells over lines 3 and 4
    "mandel": [9999, 9999], "zoomM": [voz[2], CORTE - 0.2], "corte": round(CORTE, 2),
    # the coast gathers into a point of light that beats until the intro's first hit
    "punto": [round(voz[2] - 1.2, 2), ULTIMO], "ecuacion": [round(voz[2] + pal(2, "simple") + 0.2, 2), round(voz[2] + pal(2, "simple") + 2.4, 2)], "inicioIntro": round(ULTIMO, 3), "total": round(ULTIMO, 3),
    # lines 5 and 6, inside the intro (seconds from the intro's start)
    # «Porque, a veces…» lands so that «universo» falls on the match cut from the fractal to a real galaxy
    "vozIntro": [27.2, 42.0],
    # the heart as light: the first beats are pure pulses; then each beat opens a circle onto a glimpse of the world,
    # one per beat at first, then two, three and four per beat: a burst of forms that never repeats, until the beat
    # that opens onto the coast stays open. [time, 1 on a beat / 0 between beats]
    "destellos": destellos,
    # the quick list is named by the voice; only the long shots keep a caption
    "etiquetas": {"foto": "COSTA DE CHILE · DESDE LA ESTACIÓN ESPACIAL", "cosmos": "RED CÓSMICA · SIMULACIÓN"},
}
(RAIZ / "src" / "prologo2.json").write_text(json.dumps(P))
print("corte", P["corte"], "· solo", SOLO, "· intro empieza", ULTIMO, "· total", P["total"])
