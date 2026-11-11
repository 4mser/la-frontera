"""Timing of chapter IV «Cómo crece una forma» (src/cap4.json), on its voice (src/cap4_voz.json, made by
audio/voz_cap4.py from fractales/GUION-capitulo-4-como-crece.md, v2).

Usage: PYTHONPATH=pylib python3 herramientas/tiempos_cap4.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
V = json.loads((RAIZ / "src" / "cap4_voz.json").read_text())
voz = {}


def tras(k, hueco):
    return round(voz[k] + V[k]["fin"] + hueco, 2)


def en(k, w, n=0):
    hits = [t for p, t in V[k]["palabras"] if p.lower().strip(".,:;¿?…") == w]
    return round(voz[k] + hits[n], 2)


def di(k, t):
    voz[k] = round(t, 2)
    return voz[k]


# 0 · title: a small aggregate grows from a seed; the title on the hit
semilla = 0.8
titulo = 6.4
# 1 · three forms, one question
formas = 12.4
di(0, formas + 0.6)                          # «Al final del capítulo anterior quedaron tres formas…»
fotos3 = [en(0, "mineral"), en(0, "vasos"), en(0, "ríos")]
di(1, tras(0, 0.7))                          # «Se parecen tanto…»
# 2 · a wandering particle
difusion = tras(1, 1.0)
di(2, difusion + 0.8)                        # «En mil novecientos ochenta y uno… Witten y Sander…»
retratosWS = [en(2, "uíten"), en(2, "sánder")]
di(3, tras(2, 0.6))                          # «En el centro hay una partícula fija…»
cam1 = [en(3, "llega") - 0.2, en(3, "pegada") + 0.15]
di(4, tras(3, 0.5))                          # «Luego llega otra…»
cam2 = [voz[4] + 0.3, en(4, "más") + 0.1]
cam3 = [en(4, "más") + 0.4, en(4, "grupo") + 0.2]
crece = [cam3[1] + 0.8, cam3[1] + 15.8]
di(5, crece[0] + 6.0)                        # «Con miles de partículas…»
pantalla = crece[1] + 0.8                    # ten late walkers: they hit the tips
di(6, pantalla + 0.4)                        # «La razón es sencilla…»
puntas = [en(6, "puntas"), tras(6, -0.2)]
manganeso = tras(6, 0.6)
di(7, manganeso + 0.6)                       # «Modelos basados en la difusión…»
# 3 · rain on a relief
erosion = tras(7, 1.2)
di(8, erosion + 0.8)                         # «Un río crece de otra manera…»
lluvia = en(8, "lluvia")
di(9, tras(8, 0.6))                          # «El agua baja por la pendiente…»
cauces = [voz[9] + 1.0, 0.0]
di(10, tras(9, 5.0))                         # «Ese surco más hondo…» (5 s of the network organizing without voice)
di(11, tras(10, 0.6))                        # «Aquí nadie llega desde afuera…»
cauces[1] = tras(11, 0.4)
optimas = tras(11, 0.8)
di(12, optimas + 3.4)                        # «Al estudiar redes de drenaje reales…» (the two portraits first)
# 4 · a tree that seeks what it lacks
vasos = tras(12, 1.2)
di(13, vasos + 0.8)                          # «Los vasos de un tejido…»
di(14, tras(13, 0.6))                        # «Cuando una zona recibe poco oxígeno…»
colonia = tras(14, 0.6)
di(15, colonia + 3.4)                        # «En la simulación, cada punto…» (the two portraits first)
arbol = [voz[14] + 1.0, tras(15, 4.0)]       # the tree starts to grow when the voice says the vessels sprout
di(16, arbol[1] - 2.0)                       # «El resultado es un árbol…»
retina = tras(16, 0.4)
# 5 · counting boxes
cajas = tras(16, 3.4)
di(17, cajas + 0.8)                          # «Tres formas ramificadas…»
di(18, tras(17, 0.5))                        # «Si medimos su dimensión…»
rejilla = [voz[18] + 1.0, tras(18, 0.6)]
di(19, tras(18, 1.6))                        # «Y aunque dos de esos números coincidieran…»
# 6 · the prologue list returns
mosaico = tras(19, 1.0)
di(20, mosaico + 1.2)                        # «Las formas que vimos al comienzo…»
# 7 · close
cierre = tras(20, 1.2)
di(21, cierre + 2.2)                         # «La misma apariencia…» (the three forms meet first)
oscuro = tras(21, 0.8)
di(22, oscuro + 1.0)                         # «Pero hay formas que no se ven en el espacio…»
latidos = [tras(22, 0.9), tras(22, 1.75)]
total = round(latidos[1] + 3.0, 2)

K = {"fps": 30, "voz": [voz[k] for k in range(23)], "semilla": semilla, "titulo": titulo, "formas": formas, "fotos3": fotos3,
     "difusion": difusion, "retratosWS": retratosWS, "cam": [cam1, cam2, cam3], "crece": crece, "pantalla": pantalla, "puntas": puntas,
     "manganeso": manganeso, "erosion": erosion, "lluvia": lluvia, "cauces": cauces, "optimas": optimas, "vasos": vasos,
     "colonia": colonia, "arbol": arbol, "retina": retina, "cajas": cajas, "rejilla": rejilla, "mosaico": mosaico, "cierre": cierre,
     "oscuro": oscuro, "latidos": latidos, "total": total}
(RAIZ / "src" / "cap4.json").write_text(json.dumps(K, ensure_ascii=False))
print({k: v for k, v in K.items() if k != "voz"})
print("total", total, f"{int(total // 60)}:{total % 60:04.1f}")
