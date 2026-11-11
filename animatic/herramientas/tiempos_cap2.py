"""Timing of chapter 2 «Entre la nada y el algo» (src/cap2.json), on its voice (src/cap2_voz.json, one mp3 per
sentence group, made by audio/voz_cap2.py). See fractales/GUION-capitulo-2-el-mapa.md (v5). This is the first part:
the title, a copy and its opposite, and the map of the worlds (lines 1 to 28).

Usage: PYTHONPATH=pylib python3 herramientas/tiempos_cap2.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
V = json.loads((RAIZ / "src" / "cap2_voz.json").read_text())
voz = {}


def tras(k, hueco):
    return round(voz[k] + V[k]["fin"] + hueco, 2)


def en(k, w, n=0):
    hits = [t for p, t in V[k]["palabras"] if p.lower().strip(".,:¿?…") == w]
    return round(voz[k] + hits[n], 2)


def di(k, t):
    voz[k] = round(t, 2)
    return voz[k]


# 1 · title: a heartbeat, a segment that loses its middle thirds on every beat, then the title
latido = 0.6
segmento = [1.0, 2.0]
cantor, t, d = [], 2.3, 0.75
for _ in range(7):
    cantor.append(round(t, 2)); t += d; d *= 0.85
titulo = round(cantor[-1] + 0.8, 2)
# 2 · a copy, and its opposite: Koch beside Mandelbrot to ×3⁷; then the dive to ×10¹⁵; then a cloud
split = round(titulo + 5.6, 2)
di(0, split + 0.8)                                 # «En el capítulo anterior…»
di(1, tras(0, 0.8))                                # «Pero no todos los fractales…»
di(2, tras(1, 0.8))                                # «El conjunto de Mandelbrót tiene patrones…»
splitFin = max(tras(2, 1.2), round(split + 19.0, 2))
buceo = [round(splitFin - 0.4, 2)]
di(3, splitFin + 1.2)                              # «Pero al acercarnos aparecen…»
di(4, tras(3, 2.5))                                # «La complejidad no siempre consiste…»
llegada = max(tras(4, 2.0), round(buceo[0] + 30.0, 2))
buceo.append(llegada)
di(5, llegada - 0.4)                               # «Mil billones de aumentos más abajo…»
nube = tras(5, 1.6)
di(6, nube + 0.8)                                  # «La naturaleza tampoco…»
nubeFin = tras(6, 1.4)
# 3 · a constant, a world
julia = nubeFin
di(7, julia + 0.8)                                 # «El conejo nació de una sola constante…»
paradas = [round(tras(7, 0.2), 2)]
di(8, paradas[0] + 0.3)                            # «Basta con mover la constante…»
for _ in range(5):
    paradas.append(round(paradas[-1] + 2.7, 2))
polvo = round(paradas[-1] + 2.6, 2)
di(9, polvo + 0.4)                                 # «Algunos… otros se fragmentan…»
lados = tras(9, 1.0)
di(10, lados + 0.8)                                # «De un lado queda algo…»
pregunta = tras(10, 1.4)
di(11, pregunta + 0.4)                             # «¿Cómo saber de qué lado cae…?»
di(12, tras(11, 1.2))                              # «Hace un siglo, Pier Fatú y Gastón Yüliaá…»
orbitas = round(en(12, "cero") - 0.2, 2)
fatou = round(en(12, "fatú") - 0.3, 2)
juliaNombre = round(en(12, "yüliaá") - 0.3, 2)
di(13, tras(12, 0.8))                              # «Si la órbita del cero se queda cerca…»
quedan = round(voz[13] + 0.3, 2)                   # the orbit inside is followed while «se queda cerca» is said
escapa = round(en(13, "escapa") - 0.3, 2)
mapa = tras(13, 1.6)
di(14, mapa + 0.3)                                 # «Ahora pintemos cada constante…»
barrido = [tras(14, 0.6)]
barrido.append(round(barrido[0] + 4.5, 2))
di(15, barrido[1] + 1.4)                           # «Ya lo viste al comienzo de la película…»
revela = round(en(15, "conjunto") - 0.1, 2)
mosaico = tras(15, 1.0)
di(16, mosaico + 0.6)                              # «Cada punto de esta figura es una constante…»
# the map, explored: a cursor on the map, its world beside it
explora = tras(16, 2.4)
di(17, explora + 1.8)                              # cardioid
di(18, tras(17, 2.4))                              # basilica bulb
di(19, tras(18, 2.4))                              # rabbit bulb (and its antenna)
antena = round(en(19, "antena") - 0.3, 2)
di(20, tras(19, 2.4))                              # five arms
di(21, tras(20, 2.2))                              # outside: dust
tanLei = tras(21, 1.6)
di(22, tanLei + 0.4)                               # «Y en la frontera ocurre algo más profundo…»
tanZoom = [round(tras(22, -1.2), 2)]
di(23, tras(22, 3.8))                              # «Es la misma forma. La matemática Tan Lei…»
tanZoom.append(round(voz[23] + 1.0, 2))
di(24, tras(23, 1.4))                              # «Por eso decimos que es el mapa…»
final = tras(24, 1.0)
di(25, final + 0.6)                                # «Dentro, cada mundo es algo…»
dentro = round(voz[25] + 0.2, 2)
fuera = round(en(25, "fuera") - 0.2, 2)
# 4 · almost nothing: the Cantor set (length zero, infinitely many points), and the dust of the broken worlds
cantor0 = tras(25, 1.4)
di(39, cantor0 + 1.4)                              # «Toma una línea de largo uno. Quítale el tercio del medio…»
cortes = [round(en(39, "medio") + 0.1, 2)]
t = en(39, "vuelve") + 0.2
for d in (0.8, 0.7, 0.6, 0.55, 0.5, 0.45):
    cortes.append(round(t, 2)); t += d
di(40, max(tras(39, 1.0), round(t + 0.2, 2)))      # «En cada paso, el largo total se reduce…»
largos = [round(en(40, w), 2) for w in ("tercios", "novenos", "veintisieteavos", "cero")]
di(41, tras(40, 1.2))                              # «Pero aun así, el conjunto no desaparece.»
cantorZoom = [round(voz[41] + 0.4, 2)]
di(42, tras(41, 1.0))                              # «Quedan infinitos puntos…»
di(43, tras(42, 1.0))                              # «Un conjunto de largo cero puede tener tantos puntos…»
cantorZoom.append(tras(43, 0.6))
di(44, tras(43, 1.4))                              # «El polvo de los mundos rotos tiene esta misma estructura…»
polvoJ = round(voz[44] + 0.6, 2)
cantorFin = tras(44, 1.4)
# the border, then the time that does not end along c = −0,75 + ε·i
di(26, cantorFin + 0.8)                            # «Y la frontera es la línea exacta…»
frontera = round(voz[26] + 0.3, 2)
escape0 = tras(26, 1.4)
di(45, escape0 + 1.0)                              # «Fuera del conjunto, toda órbita termina escapando.»
di(46, tras(45, 1.0))                              # «Pero cerca de la frontera… cien vueltas, después mil, después diez mil.»
# one constant per mark, closer and closer: ε = 0,1 · 0,03 · 0,01 · 0,003 · 0,001 · 0,0003 (33, 105, 315, 1048, 3143,
# 10473 turns, computed); «cien» on 105, «mil» on 1048, «diez mil» on 10473
_c, _m, _d = en(46, "cien"), en(46, "mil"), en(46, "diez")
marcas = [round(voz[45] + 0.8, 2), round(_c - 0.2, 2), round((_c + _m) / 2, 2), round(_m - 0.2, 2), round((_m + _d) / 2, 2), round(_d - 0.1, 2)]
di(47, tras(46, 1.4))                              # «Y en la frontera misma… nunca escapa.»
nunca = round(en(47, "nunca") - 0.2, 2)
di(48, tras(47, 1.2))                              # «La matemática sigue funcionando en ese borde…»
# 5 · dimension and area: the border has dimension 2; whether it has area is still open
dim0 = tras(48, 1.6)
di(49, dim0 + 1.0)                                 # «La frontera… tiene dimensión de Jáusdorf dos…»
di(50, tras(49, 1.2))                              # «Pero dimensión y área son cosas distintas…»
di(51, tras(50, 1.2))                              # «El conjunto tiene área… Pero su frontera…»
areaIn = round(en(51, "área") - 0.2, 2)
soloBorde = round(en(51, "frontera") - 0.6, 2)
silencio = [tras(51, 0.0), tras(51, 2.2)]          # two seconds of silence before the question
di(52, tras(51, 2.2))                              # «¿Tiene área? Todavía no sabemos…»
di(53, tras(52, 1.2))                              # «Una figura perfectamente definida…»
dimFin = tras(53, 1.2)
di(27, dimFin + 0.6)                               # «Ahí, entre la nada y el algo…»
# the asymptote: the camera sinks into one point of the border (a Misiurewicz point) and does not stop
asintota = [round(voz[27] - 0.3, 2)]
di(28, tras(27, 1.2))                              # «Acerquémonos a un solo punto…»
di(29, tras(28, 1.0))                              # «Cada vuelta de la espiral…»
di(30, tras(29, 1.0))                              # «Es una asíntota…»
di(31, tras(30, 1.4))                              # «Ese punto no tiene largo, ni área…»
asintota.append(round(voz[31] + 1.0, 2))           # the spiral closes into a single point of light
punto = round(voz[31] + V[31]["fin"] - 1.0, 2)
di(32, tras(31, 2.2))                              # «En mil setecientos catorce, Láibnitz…»
pregunta2 = round(en(32, "por") - 0.1, 2)
leibniz = round(en(32, "láibnitz") - 0.4, 2)
di(33, tras(32, 2.0))                              # «Nadie sabe responderla. Pero el mismo Láibnitz… medalla…»
medalla = round(en(33, "medalla") - 0.3, 2)
vacio = tras(33, 0.8)                              # the plane, empty, around the 0
di(34, vacio + 0.6)                                # «Volvamos entonces al cero, al vacío…»
anillo1 = round(en(34, "vez") + 0.1, 2)            # the rule, once: the first curve
di(35, tras(34, 1.0))                              # «Con un paso… con diez pasos… con infinitos pasos…»
pasos = [round(en(35, "un"), 2), round(en(35, "diez"), 2), round(en(35, "infinitos"), 2)]
revela2 = tras(35, 0.6)                            # the curves have converged: the whole set, lit
di(36, revela2 + 4.2)                              # «Y cerca de cualquier punto de esa frontera…» (the dive)
buceo2 = [round(voz[36] - 0.2, 2), round(voz[36] + V[36]["fin"] + 0.6, 2)]
di(37, tras(36, 3.4))                              # «Lo que parecía casi nada contiene otra vez el todo…»
anillosMini = [round(voz[37] - 0.4, 2), round(voz[37] + V[37]["fin"] + 1.0, 2)]
di(38, tras(37, 1.8))                              # «Quizá esa sea la respuesta del fractal…»
di(56, tras(38, 2.4))                              # «Entre la nada y el algo… cabe el infinito.» (voice only: no card)
cierre = round(voz[56] + V[56]["fin"] + 0.6, 2)
total = round(cierre + 3.5, 2)

VOZ = [voz.get(k, -1) for k in range(57)]    # −1: not used in this cut
K = {"fps": 30, "voz": VOZ, "latido": latido, "segmento": segmento, "cantor": cantor, "titulo": titulo,
     "split": split, "splitFin": splitFin, "buceo": buceo, "nube": nube, "nubeFin": nubeFin,
     "julia": julia, "paradas": paradas, "polvo": polvo, "lados": lados, "pregunta": pregunta, "orbitas": orbitas, "fatou": fatou, "juliaNombre": juliaNombre,
     "quedan": quedan, "escapa": escapa, "mapa": mapa, "barrido": barrido, "revela": revela, "mosaico": mosaico,
     "explora": explora, "antena": antena, "tanLei": tanLei, "tanZoom": tanZoom, "final": final, "dentro": dentro,
     "fuera": fuera, "frontera": frontera, "asintota": asintota, "punto": punto, "pregunta2": pregunta2, "leibniz": leibniz,
     "medalla": medalla, "vacio": vacio, "anillo1": anillo1, "pasos": pasos, "revela2": revela2, "buceo2": buceo2,
     "anillosMini": anillosMini, "cantor0": cantor0, "cortes": cortes, "largos": largos, "cantorZoom": cantorZoom,
     "polvoJ": polvoJ, "cantorFin": cantorFin, "escape0": escape0, "marcas": marcas, "nunca": nunca, "dim0": dim0,
     "areaIn": areaIn, "soloBorde": soloBorde, "silencio": silencio, "dimFin": dimFin, "cierre": cierre,
     "terminos": [
         ["COPIAS EXACTAS", "", round(voz[0] + 0.4, 2), round(voz[1] + 0.2, 2)],
         ["NO TODO FRACTAL ES AUTOSEMEJANTE", "", round(voz[1] + 0.2, 2), round(splitFin + 0.4, 2)],
         ["LO QUE SE MANTIENE: LA RUGOSIDAD", "LA FORMA CAMBIA", round(en(6, "rugosidad") - 0.3, 2), round(nubeFin - 0.1, 2)],
         ["CONJUNTOS DE JULIA", "UNA CONSTANTE, UN MUNDO", round(en(7, "yüliaá") - 0.2, 2), round(paradas[1] - 0.2, 2)],
         ["UNA PIEZA O POLVO", "", round(voz[9] + 0.4, 2), round(lados - 0.1, 2)],
         ["TEOREMA DE FATOU Y JULIA", "BASTA SEGUIR EL CERO", round(en(12, "cero") + 0.4, 2), round(mapa - 0.1, 2)],
         ["EL CONJUNTO DE MANDELBROT", "EL MAPA DE TODOS ESOS MUNDOS", round(revela + 0.2, 2), round(mosaico + 0.8, 2)],
         ["TEOREMA DE TAN LEI", "EN EL BORDE, EL MAPA SE PARECE AL MUNDO", round(en(23, "lei") + 0.2, 2), round(voz[24] - 0.2, 2)],
         ["CONJUNTO DE CANTOR", "LARGO CERO, INFINITOS PUNTOS", round(voz[42] + 0.2, 2), round(voz[44] - 0.2, 2)],
         ["MISMA ESTRUCTURA, DISTINTA FORMA", "", round(polvoJ + 0.6, 2), round(cantorFin - 0.1, 2)],
         ["ENTRE LA NADA Y EL ALGO", "", round(frontera + 1.2, 2), round(escape0 - 0.2, 2)],
         ["DIVERGENCIA DEL TIEMPO DE ESCAPE", "", round(voz[46] + 0.4, 2), round(voz[47] + V[47]["fin"] + 0.4, 2)],
         ["DIMENSIÓN DE HAUSDORFF 2", "SHISHIKURA, 1998", round(en(49, "jáusdorf") - 0.2, 2), round(voz[50] + 0.2, 2)],
         ["PREGUNTA ABIERTA", "¿LA FRONTERA TIENE ÁREA POSITIVA, O CERO?", round(voz[52] + 0.4, 2), round(dimFin - 0.2, 2)],
         ["UN LÍMITE", "CADA VEZ MÁS CERCA, SIN LLEGAR NUNCA", round(en(30, "límite") - 0.2, 2), round(voz[31] - 0.3, 2)],
         ["¿POR QUÉ HAY ALGO Y NO NADA?", "LEIBNIZ, 1714", round(pregunta2, 2), round(voz[33] + 3.0, 2)],
         ["DEL CERO, UNA FRONTERA INFINITA", "", round(revela2 + 0.2, 2), round(voz[36] - 0.2, 2)],
         ["EL VACÍO NUNCA ESTÁ DEL TODO VACÍO", "", round(en(38, "vacío") - 0.4, 2), cierre]],
     "total": total}
(RAIZ / "src" / "cap2.json").write_text(json.dumps(K, ensure_ascii=False))
print(json.dumps({k: v for k, v in K.items() if k != "terminos"}, ensure_ascii=False))
