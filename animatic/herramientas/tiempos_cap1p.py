"""Timing of the chapter 1 preview (src/cap1p.json): the title, then the rule explained inside the plane of the
Douady rabbit, on the voice (src/cap1p_voz.json, five whole sentences recorded one by one) and on the score.

Usage: PYTHONPATH=pylib python3 herramientas/tiempos_cap1p.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
V = json.loads((RAIZ / "src" / "cap1p_voz.json").read_text())


def pal(k, w):
    return next(t for p, t in V[k]["palabras"] if p.lower().strip(".,") == w)


LATIDOS = [0.6, 1.55]            # two heartbeats in the dark
TITULO = 2.6                     # the hit: CAPÍTULO I · LA REGLA
ENTRA = [8.6, 10.4]              # the letters open into the plane
voz = [11.0]
for k, hueco in enumerate([1.5, 1.6, 1.7]):
    voz.append(round(voz[-1] + V[k]["fin"] + hueco, 2))
paso = {
    "z": round(voz[0] + pal(0, "número"), 2),
    "cuadrado": [round(voz[1] + 0.2, 2), round(voz[1] + 0.2 + 2.2, 2)],
    "c": round(voz[2] + pal(2, "constante"), 2),
    "vuelve": round(voz[3] + pal(3, "vuelve"), 2),
}
# one continuous gesture: on «vuelve a empezar» the same point keeps jumping, one landing per beat, each landing
# left as light; the beats speed up without a break and the landings pile up into the drawing (see src/cap1p.ts)
golpes, t, d = [], paso["vuelve"] + 0.15, 0.8
while len(golpes) < 10:
    golpes.append(round(t, 2)); t += d; d *= 0.93
nube0 = golpes[0]
nube, d = [], 0.42
while len(nube) < 16:
    nube.append(round(t, 2)); t += d; d *= 0.95
voz.append(round(nube[4] - 0.2, 2))       # «Eso es todo…» over the drawing
revela = round(nube[-1] + 0.9, 2)         # the shape the orbits draw: the set itself, sharp
# ─── what a fractal is (voice pieces 6–31) ─────────────────────────────────────────────────────────────────────
def tras(k, hueco):
    """start of the next piece: hueco seconds after piece k ends"""
    return round(voz[k] + V[k]["fin"] + hueco, 2)
def en(k, w, n=0):
    hits = [t for p, t in V[k]["palabras"] if p.lower().strip(".,:¿?…") == w]
    return round(voz[k] + hits[n], 2)
voz.append(round(revela + 2.0, 2))                       # 5  «A una forma así se le llama fractal.»
voz.append(tras(5, 1.0))                                 # 6  «¿Pero qué es exactamente un fractal?»
circulo = [tras(6, 0.3)]                                 # 1 · a circle: zoom into its edge, it turns into a line
voz.append(round(circulo[0] + 0.7, 2))                   # 7  «Acerquémonos al borde de un círculo.»
zoomC = [round(voz[7] + 1.2, 2)]
voz.append(tras(7, 0.6))                                 # 8  «Mientras más te acercas, más recto se ve.»
voz.append(tras(8, 0.9))                                 # 9  «Al final, es solo una línea.»
zoomC.append(tras(9, 0.4))
zoomA = [tras(9, 1.0)]                                   # … and the rabbit's border: it never smooths out
voz.append(round(zoomA[0] + 0.3, 2))                     # 10 «Ahora, acerquémonos al borde de un fractal.»
voz.append(tras(10, 1.4))                                # 11 «Nunca se vuelve liso…»
voz.append(tras(11, 1.4))                                # 12 «Esa es la primera idea…»
zoomA.append(tras(12, 1.0))
fuera = [round(zoomA[1] + 0.6, 2), round(zoomA[1] + 0.61, 2)]   # back to ×1 once the plane is gone
koch = round(zoomA[1] + 0.2, 2)                          # 2 · Koch, built by repeating one rule
voz.append(round(koch + 0.8, 2))                         # 13 «Casi siempre nace de repetir una regla sencilla.»
voz.append(tras(13, 1.0))                                # 14 «Toma una línea. Divídela en tres.»
lineaK = voz[14]; tercios = en(14, "tres")
voz.append(tras(14, 1.0))                                # 15 «Reemplaza el tramo del medio…»
nivelesK = [round(voz[15] + 0.6, 2)]
voz.append(tras(15, 1.4))                                # 16 «Ahora haz lo mismo con cada tramo nuevo. Y otra vez. Y otra.»
nivelesK += [en(16, "ahora"), en(16, "vez"), en(16, "otra", 1), round(voz[16] + V[16]["fin"] + 0.5, 2), round(voz[16] + V[16]["fin"] + 1.2, 2)]
copo = round(nivelesK[-1] + 1.2, 2)                      # the curve closes into the snowflake
voz.append(round(copo + 2.6, 2))                         # 17 «Mira una de sus partes…» (3 · self-similarity)
parte = [round(voz[17] + 0.8, 2), round(voz[17] + V[17]["fin"] + 2.2, 2)]
voz.append(tras(17, 0.8))                                # 18 «A eso se le llama autosemejanza.»
parte[1] = tras(18, 2.8)                                 # the dive into Koch goes on after «autosemejanza»
sier = tras(18, 3.4)                                     # Sierpiński
voz.append(round(sier + 0.4, 2))                         # 19 «Pasa lo mismo con un triángulo…»
nivelesS = [round(sier + 1.2 + 0.75 * k, 2) for k in range(6)]
sierZoom = [round(nivelesS[-1] + 0.9, 2), round(nivelesS[-1] + 7.4, 2)]   # then a deep dive into one corner, ×2⁹
helecho = max(tras(19, 1.0), round(sierZoom[1] + 0.3, 2))   # Barnsley's fern
voz.append(round(helecho + 0.3, 2))                      # 20 «O con un helecho que nace de solo cuatro reglas.»
helechoZoom = [tras(20, 1.6), round(tras(20, 1.6) + 7.0, 2)]   # the dive into a leaf: the whole fern again, four times
foto = round(helechoZoom[1] + 0.3, 2)                    # a real fern
voz.append(round(foto + 0.6, 2))                         # 21 «En la naturaleza…»
copo2 = tras(21, 1.6)                                    # 4 · infinite border, finite area
voz.append(round(copo2 + 0.8, 2))                        # 22 «Cada paso alarga el borde del copo en un tercio.»
nivelesL = [round(voz[22] + 0.4 + 0.62 * k, 2) for k in range(7)]
voz.append(max(tras(22, 1.0), round(nivelesL[-1] + 0.4, 2)))   # 23 «Después de infinitos pasos…»
infinito = en(23, "infinito")
costa = tras(23, 1.0)
voz.append(round(costa + 0.5, 2))                        # 24 «Es la misma paradoja de la costa.»
dim = tras(24, 1.8)                                      # 5 · dimension
voz.append(round(dim + 0.3, 2))                          # 25 «Por eso los fractales necesitan una medida nueva…»
terminoDim = round(en(25, "dimensión") - 0.1, 2)
panel = []                                               # when each panel starts: line, square, cube, Koch
voz.append(round(terminoDim + 1.0, 2)); panel.append(voz[26])   # 26 «Agranda una línea al doble…» (1 s after the term)
voz.append(tras(26, 0.7))                                # 27 «Dos es dos elevado a uno…»
voz.append(tras(27, 1.0)); panel.append(voz[28])         # 28 «Agranda un cuadrado al doble…»
voz.append(tras(28, 1.0)); panel.append(voz[29])         # 29 «Un cubo, al doble…»
voz.append(tras(29, 1.0))                                # 30 «La dimensión es el número al que hay que elevar…»
regla = voz[30]
voz.append(tras(30, 1.2)); panel.append(voz[31])         # 31 «Ahora agranda la curva de Koch tres veces…»
voz.append(tras(31, 0.8))                                # 32 «Cuatro es tres elevado a… uno coma veintiséis.»
d126 = en(32, "uno")
voz.append(tras(32, 0.9))                                # 33 «Su dimensión no es un número entero.»
voz.append(tras(33, 1.2))                                # 34 «Más que una línea. Menos que un plano.»
regla2 = round(voz[34] - 0.4, 2)
voz.append(tras(34, 0.8))                                # 35 «Un fractal vive entre las dimensiones.»
vuelta = tras(35, 1.4)                                   # 6 · why the rabbit has this shape
voz.append(round(vuelta + 1.0, 2))                       # 36 «¿Y por qué el conejo tiene esta forma?»
voz.append(tras(36, 0.8))                                # 37 «Elige cualquier punto… y mira cuánto se aleja del centro.»
saltosIn, t, d = [], round(voz[37] + V[37]["fin"] - 1.0, 2), 0.62
for _ in range(10):
    saltosIn.append(round(t, 2)); t += d; d *= 0.96
voz.append(round(saltosIn[3], 2))                        # 38 «Este punto nunca se aleja… Lo pintamos de azul.»
pintaIn = round(max(en(38, "azul"), saltosIn[-1] + 0.5), 2)
saltosOut, t, d = [], tras(38, 0.8), 0.72
for _ in range(9):
    saltosOut.append(round(t, 2)); t += d
voz.append(round(saltosOut[0] + 0.2, 2))                 # 39 «Este otro, en cambio, se aleja… Lo pintamos de un color cálido.»
pintaOut = round(max(en(39, "cálido") - 0.2, saltosOut[-1] + 0.6), 2)
muestra = [tras(39, 0.6)]
voz.append(round(muestra[0] + 0.2, 2))                   # 40 «Ahora haz lo mismo con cada punto del plano…»
muestra.append(round(voz[40] + V[40]["fin"] - 0.3, 2))
barrido = [round(muestra[1] + 0.8, 2)]
voz.append(round(barrido[0] + 0.3, 2))                   # 41 «Y así, punto por punto, aparece el conejo.»
barrido.append(round(voz[41] + V[41]["fin"] + 0.6, 2))
frontera = round(barrido[1] + 0.8, 2)
voz.append(round(frontera + 0.2, 2))                     # 42 «Su borde dorado separa…»
voz.append(tras(42, 0.9))                                # 43 «Y ese borde… es el fractal.»
total = tras(43, 4.5)
# the key terms, written large when the voice says them (an infographic layer): [term, line under it, from, to]
terminos = [["FRACTAL", "DEL LATÍN FRACTUS · QUEBRADO", round(en(5, "fractal") - 0.1, 2), round(voz[6] + V[6]["fin"] + 0.4, 2)],
            ["DETALLE A TODAS LAS ESCALAS", "", round(en(12, "escalas") - 0.6, 2), round(zoomA[1] + 0.3, 2)],
            ["AUTOSEMEJANZA", "CADA PARTE ES UNA COPIA DEL TODO", round(voz[18] + 0.3, 2), round(sier - 0.2, 2)],
            ["DIMENSIÓN", "CUÁNTAS COPIAS APARECEN AL AGRANDAR", terminoDim, round(terminoDim + 6.0, 2)],
            ["EL CONEJO DE DOUADY", "UN FRACTAL · UN CONJUNTO DE JULIA", round(en(41, "conejo") - 0.3, 2), round(voz[43] + V[43]["fin"] + 1.0, 2)]]

K = {"fps": 30, "latidos": LATIDOS, "titulo": TITULO, "entra": ENTRA, "voz": voz, "paso": paso,
     "golpes": golpes, "nube0": nube0, "nube": nube, "revela": revela, "total": total,
     "zoomA": zoomA, "fuera": fuera, "frontera": frontera,
     "saltosIn": saltosIn, "pintaIn": pintaIn, "saltosOut": saltosOut, "pintaOut": pintaOut, "barrido": barrido,
     "muestra": muestra, "sierZoom": sierZoom, "helechoZoom": helechoZoom,
     "circulo": circulo, "zoomC": zoomC, "koch": koch, "lineaK": lineaK, "tercios": tercios, "nivelesK": nivelesK,
     "copo": copo, "parte": parte, "sier": sier, "nivelesS": nivelesS, "helecho": helecho, "foto": foto,
     "copo2": copo2, "nivelesL": nivelesL, "infinito": infinito, "costa": costa, "dim": dim, "regla2": regla2, "panel": panel, "regla": regla, "d126": d126,
     "vuelta": vuelta, "terminos": terminos,
     "dentro": [0.18, 0.38], "afuera": [-0.88, 0.38], "beta": [1.182354745467234, -0.5969304290954944], "zoomMax": 8000,
     "c": [-0.123, 0.745], "z0": [0.35, 0.25],
     # inside the title's letters: a close view of the rabbit's border
     "tit": {"foco": [-0.36, 0.44], "zoom": 4.0, "pal": 2}}
(RAIZ / "src" / "cap1p.json").write_text(json.dumps(K))
print(json.dumps(K))
