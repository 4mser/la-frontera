"""Timing of chapter VI «La misma regla, en el tiempo» (src/cap6.json), on its voice (src/cap6_voz.json, made by
audio/voz_cap6.py from fractales/GUION-capitulo-6-la-misma-regla.md).

Usage: PYTHONPATH=pylib python3 herramientas/tiempos_cap6.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
V = json.loads((RAIZ / "src" / "cap6_voz.json").read_text())
voz = {}


def tras(k, hueco):
    return round(voz[k] + V[k]["fin"] + hueco, 2)


def en(k, w, n=0):
    hits = [t for p, t in V[k]["palabras"] if p.lower().strip(".,:;¿?…") == w]
    return round(voz[k] + hits[n], 2)


def di(k, t):
    voz[k] = round(t, 2)
    return voz[k]


titulo = 5.0
# 1 · the question; Richardson's dream
richardson = 11.0
di(0, richardson + 0.6)                      # «¿Cómo puede algo obedecer leyes exactas…?»
di(1, tras(0, 1.4))                          # «Ríchardson soñaba con calcular el tiempo…»
di(2, tras(1, 0.6))                          # «Cuarenta años después, otro meteorólogo…»
# 2 · Lorenz: the rounded numbers, two forecasts that part, the two wings
lorenz = tras(2, 0.8)
di(3, lorenz + 0.6)                          # «Édward Lórenz simulaba un modelo…»
anecdota = tras(3, 0.3)
di(4, anecdota + 0.6)                        # «Fue por un café…»
di(5, tras(4, 0.6))                          # «Al principio, los nuevos valores repetían…»
separa = [round(anecdota + 0.8, 2), tras(5, 0.0)]
alas = tras(5, 0.6)
di(6, alas + 1.0)                            # «En mil novecientos sesenta y tres publicó un sistema…»
ecuaciones = en(6, "tres", 1) if len([1 for q, _ in V[6]["palabras"] if q.lower().strip(".,:") == "tres"]) > 1 else en(6, "ecuaciones")
# 3 · determinism is not prediction
logistica = tras(6, 2.5)
di(7, logistica + 0.6)                       # «Lo mismo ocurre con la regla del capítulo anterior…»
di(8, tras(7, 1.5))                          # «En la zona del caos, en cambio…»
# 4 · the same rule
revela = tras(8, 1.0)
mandel = revela + 0.2
di(9, revela + 1.6)                          # «Pero esta regla esconde algo más…»
formula = en(9, "cambian")
transforma = [en(9, "convierte") - 0.5, tras(9, 4.0)]
di(10, tras(9, 4.5))                         # «El diagrama de las poblaciones es la misma regla…»
enlaces = en(10, "duplicación")
di(11, tras(10, 1.4))                        # «Y la copia en miniatura que encontramos…»
copia = round(voz[11] + 0.5, 2)
# 5 · Feigenbaum; the experiment
feigen = tras(11, 1.5)
di(12, feigen + 3.0)                         # «En mil novecientos setenta y ocho, Míchel Fáigenbaum…»
di(13, tras(12, 0.6))                        # «Y descubrió que ese mismo número…»
libchaber = tras(13, 0.6)
di(14, libchaber + 1.5)                      # «Años después, un equipo de físicos calentó mercurio…»
# 6 · close: 4.000 points born together spread and draw the wings; the conclusion
cierre = tras(14, 1.2)
nube = round(cierre + 0.3, 2)
di(15, cierre + 2.5)                         # «Saber la regla no es saber el resultado. Cuatro mil puntos…»
di(16, tras(15, 4.0))                        # «Pero mira lo que hacen juntos…»
di(17, tras(16, 1.5))                        # «Lórenz, las poblaciones y el conjunto de Mandelbrot…»
conclusion = tras(17, 0.3)
di(18, tras(17, 2.0))                        # «Y aun sin poder predecirlo todo…»
total = tras(18, 5.0)

K = {"fps": 30, "voz": [voz[k] for k in range(19)], "titulo": titulo, "richardson": richardson, "lorenz": lorenz, "anecdota": anecdota,
     "separa": separa, "alas": alas, "ecuaciones": ecuaciones, "logistica": logistica, "revela": revela, "mandel": mandel, "formula": formula, "transforma": transforma,
     "enlaces": enlaces, "copia": copia, "feigen": feigen, "iFeig": 12, "libchaber": libchaber, "cierre": cierre, "nube": nube, "iCierre": 15, "conclusion": conclusion,
     "total": total,
     "creditoLorenz": "FOTO: AGU, CORTESÍA AIP EMILIO SEGRÈ VISUAL ARCHIVES",
     "creditoFeigenbaum": "FOTO: PREDRAG CVITANOVIĆ · CC BY-SA 2.0",
     "creditoLibchaber": "", "libchaberLinea": "",
     "libchaberValor": "δ = 4,4 ± 0,1 · MERCURIO · 1982"}
(RAIZ / "src" / "cap6.json").write_text(json.dumps(K, ensure_ascii=False))
print({k: v for k, v in K.items() if k != "voz"})
print("total", f"{int(total // 60)}:{total % 60:04.1f}")
