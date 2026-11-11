"""Timing of chapter III «La medida de lo irregular» (src/cap3.json), on its voice (src/cap3_voz.json, one mp3 per
line, made by audio/voz_cap3.py from fractales/GUION-capitulo-3-la-medida.md, v3).

Usage: PYTHONPATH=pylib python3 herramientas/tiempos_cap3.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
V = json.loads((RAIZ / "src" / "cap3_voz.json").read_text())
voz = {}


def tras(k, hueco):
    return round(voz[k] + V[k]["fin"] + hueco, 2)


def en(k, w, n=0):
    hits = [t for p, t in V[k]["palabras"] if p.lower().strip(".,:;¿?…") == w]
    return round(voz[k] + hits[n], 2)


def di(k, t):
    voz[k] = round(t, 2)
    return voz[k]


# 0 · title: four steps of the dividers, then the title word by word, one tick each
pasosTitulo = [1.6, 2.5, 3.4, 4.3]
titulo = 6.6
# 1 · the man who measured to understand war
retrato = 12.6
di(0, retrato + 0.6)                         # «En mil novecientos dieciséis…»
di(1, tras(0, 0.8))                          # «Se llamaba Lewis Fry Richardson…»
cuadricula = tras(1, 0.6)
di(2, cuadricula + 0.6)                      # «Durante la guerra trabajó en una idea extraordinaria…»
di(3, tras(2, 0.8))                          # «Su primer intento fue un fracaso práctico…»
renuncia = tras(3, 0.8)
di(4, renuncia + 0.5)                        # «En mil novecientos veinte…»
fichas = tras(4, 0.9)
di(5, fichas + 0.4)                          # «Entonces decidió estudiar la guerra misma…»
di(6, tras(5, 0.7))                          # «Para eso necesitaba un dato…»
# 2 · two figures for one line
iberia = tras(6, 0.8)
di(7, iberia + 0.7)                          # «Y no lo era…»
cifrasES = [en(7, "novecientos"), en(7, "mil")]
benelux = tras(7, 0.6)
di(8, benelux + 0.4)                         # «Entre Bélgica y los Países Bajos…»
cifrasBN = [en(8, "trescientos"), en(8, "cuatrocientos")]
hoy = tras(8, 0.8)
di(9, hoy + 0.4)                             # «Incluso hoy…»
di(10, tras(9, 0.8))                         # «Richardson sospechó…»
di(11, tras(10, 0.8))                        # «Para entender por qué, hicimos nuestro propio experimento…»
# 3 · three steps on the same border
compases = tras(11, 0.6)
di(12, compases + 1.6)                       # «Con pasos de ochenta kilómetros…»
llegadas = [en(12, "setecientos"), en(12, "ochocientos"), en(12, "mil")]
di(13, tras(12, 1.0))                        # «Las tres medidas son correctas…»
# 3b · a border that does not grow
paralelo = tras(13, 1.0)
di(14, paralelo + 0.6)                       # «Ahora midamos otra frontera…»
di(15, tras(14, 0.6))                        # «Con pasos de ochenta, de veinte o de cinco…»
llegaP = en(15, "dos")
# 4 · the law and its slope
grafico = tras(15, 1.0)
di(16, grafico + 0.6)                        # «Si anotamos estas medidas en una escala especial…»
pendiente = tras(16, 0.4)
di(17, pendiente + 0.4)                      # «La recta horizontal…»
panel = en(17, "inclinación") - 0.2
abanico = tras(17, 1.0)
di(18, abanico + 0.6)                        # «Cada línea tiene su inclinación…»
retratos = tras(18, 1.0)
di(19, retratos + 0.5)                       # «Richardson murió…»
di(20, tras(19, 0.6))                        # «Catorce años más tarde, Mandelbrot…»
comparacion = tras(20, 0.8)
di(21, comparacion + 0.4)                    # «Para la frontera entre España y Portugal, Richardson obtuvo…»
# 5 · who drew each line
rios = tras(21, 1.4)
di(22, rios + 0.5)                           # «La del paralelo cuarenta y nueve… lo dibujó el agua.»
agua = en(22, "agua")
# 6 · how far it holds
rango = tras(22, 1.4)
di(23, rango + 0.5)                          # «Pero llega un punto en que el mapa…»
escalas = tras(23, 0.6)
di(24, escalas + 0.5)                        # «Y aunque pudiéramos acercarnos más…»
di(25, tras(24, 0.8))                        # «Por eso, cuando calculamos una dimensión…»
koch = round(voz[25] + 1.0, 2)
# 7 · close
cierre = tras(25, 1.6)
di(26, cierre + 0.5)                         # «Richardson buscaba medir…»
di(27, tras(26, 0.8))                        # «Medir también es decidir…»
rio = tras(27, 0.9)
di(28, rio + 0.6)                            # «Pero medir una forma no es lo mismo…»
di(29, tras(28, 1.0))                        # «Parecerse no significa tener el mismo origen…»
total = tras(29, 3.0)

VOZ = [voz[k] for k in range(30)]
K = {"fps": 30, "voz": VOZ, "pasosTitulo": pasosTitulo, "titulo": titulo, "retrato": retrato, "cuadricula": cuadricula,
     "renuncia": renuncia, "fichas": fichas, "iberia": iberia, "cifrasES": cifrasES, "benelux": benelux, "cifrasBN": cifrasBN,
     "hoy": hoy, "compases": compases, "llegadas": llegadas, "paralelo": paralelo, "llegaP": llegaP, "grafico": grafico,
     "pendiente": pendiente, "panel": panel, "abanico": abanico, "retratos": retratos, "comparacion": comparacion,
     "rios": rios, "agua": agua, "rango": rango, "escalas": escalas, "koch": koch, "cierre": cierre, "rio": rio,
     "terminos": [
         ["LA MEDIDA DEPENDE DE LA REGLA", "", round(voz[13] + 0.4, 2), round(paralelo - 0.2, 2)],
         ["LEY DE RICHARDSON", "DE LA INCLINACIÓN SE OBTIENE LA DIMENSIÓN", round(comparacion + 0.4, 2), round(rios - 0.2, 2)],
         ["UNA DIMENSIÓN, DENTRO DE UN RANGO", "", round(en(25, "rango") - 0.3, 2), round(cierre - 0.2, 2)]],
     "total": total}
(RAIZ / "src" / "cap3.json").write_text(json.dumps(K, ensure_ascii=False))
print(json.dumps({k: v for k, v in K.items() if k not in ("terminos",)}, ensure_ascii=False))
