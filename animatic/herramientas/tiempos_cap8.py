"""Timing of chapter VIII «¿Hasta dónde llega la estructura?» (src/cap8.json), on its voice (src/cap8_voz.json, made by
audio/voz_cap8.py from fractales/GUION-capitulo-8-estructura.md), and its shot list.

Usage: PYTHONPATH=pylib python3 herramientas/tiempos_cap8.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
V = json.loads((RAIZ / "src" / "cap8_voz.json").read_text())
voz = {}


def tras(k, hueco):
    return round(voz[k] + V[k]["fin"] + hueco, 2)


def en(k, w, n=0):
    hits = [t for p, t in V[k]["palabras"] if p.lower().strip(".,:;¿?…") == w]
    return round(voz[k] + hits[n], 2)


def di(k, t):
    voz[k] = round(t, 2)
    return voz[k]


# 0 · title; 1 · the question
titulo = 5.0
di(0, 9.6)                                   # «Al comienzo de este viaje…»
neuronas = en(0, "una")
abre = en(0, "se", 1)
parecen = en(0, "se", 2)
di(1, tras(0, 0.6))                          # «Pero parecerse no es lo mismo que ser igual…»
pregunta = en(1, "y")
# 2 · measuring the likeness
medir = di(2, tras(1, 1.4))                  # «En dos mil veinte, un astrofísico y un neurocirujano…»
cortes = en(2, "tomaron")
di(3, tras(2, 0.5))                          # «El cerebro tiene unos ochenta y seis mil millones…»
galaxias = en(3, "en")
ordenes = en(3, "y", 2)
espectro = di(4, tras(3, 0.8))               # «Primero compararon cómo se reparte la materia…»
banda = en(4, "entre")
megaparsec = en(4, "y", 1)
di(5, tras(4, 0.4))                          # «Fuera de ese tramo, las curvas se separan…»
quiebran = en(5, "ninguna")
redes = di(6, tras(5, 0.8))                  # «Luego trataron cada imagen como una red…»
metricas = en(6, "algunas")
otras = en(6, "otras")
di(7, tras(6, 0.6))                          # «Los propios autores lo llaman un primer trabajo exploratorio…»
limites = en(7, "las")
deshace = en(7, "el")
# 3 · what is observed
observa = di(8, tras(7, 1.4))                # «Para ver la red cósmica real…»
telescopios = en(8, "los")
mapas = di(9, tras(8, 0.4))                  # «Los mapas muestran lo mismo que la simulación…»
vacios = en(9, "y")
fractal = di(10, tras(9, 1.0))               # «En los años ochenta, algunos físicos propusieron…»
di(11, tras(10, 0.4))                        # «Si fuera así, el universo no tendría una densidad promedio…»
contar = en(11, "la")
# 4 · the test
esferas = di(12, tras(11, 1.0))              # «Se elige una galaxia y se cuentan sus vecinas…»
pareja = en(12, "si")
di(13, tras(12, 0.6))                        # «En un fractal, el número crecería más lento…»
ritmo = en(13, "ese")
tres = en(13, "tres")
censo = di(14, tras(13, 1.0))                # «En dos mil doce, un censo…»
grafica = di(15, tras(14, 0.8))              # «A escalas pequeñas, la dimensión es menor que tres…»
sube = en(15, "pero")
setenta = en(15, "desde")
descarta = di(16, tras(15, 0.6))             # «Entre unos ochenta y trescientos megapársecs…»
# 5 · four claims
cuatro = di(17, tras(16, 1.4))               # «Por eso conviene separar cuatro afirmaciones…»
tarjetas = [en(17, "las"), en(17, "hay"), en(17, "en", 1), en(17, "y", 2)]
# 6 · close
cierre = di(18, tras(17, 1.6))               # «La materia se agrupa…»
di(19, tras(18, 0.6))                        # «La pregunta no es solo si el universo tiene estructura…»
puente = di(20, tras(19, 1.2))               # «Y si la matemática describe tan bien el mundo…»
total = tras(20, 4.0)

# the shot list: one shot at a time, cut at the start of the sentence that names it (feedback-frontera-montaje)
inserciones = [
    # «…un astrofísico y un neurocirujano italianos decidieron medirlo» → a human brain; «Tomaron cortes muy finos…» → their figure
    ["foto", "cerebro", medir - 0.25, cortes - 0.25, "UN CEREBRO HUMANO", "FOTO: BOZONHIGGSA · CC BY-SA 4.0"],
    ["foto", "fig1", cortes - 0.25, voz[3] - 0.25, "CEREBELO Y CORTEZA (ARRIBA) · UNA SIMULACIÓN DE LA RED CÓSMICA (ABAJO)", "FIGURA: F. VAZZA Y A. FELETTI, FRONTIERS IN PHYSICS (2020) · CC BY 4.0"],
    # «Luego trataron cada imagen como una red…» → their networks
    ["foto", "fig3", redes - 0.25, metricas - 0.25, "LAS REDES RECONSTRUIDAS: RED CÓSMICA, CEREBELO Y CORTEZA", "FIGURA: F. VAZZA Y A. FELETTI, FRONTIERS IN PHYSICS (2020) · CC BY 4.0"],
    # «Para ver la red cósmica real…» → an observatory at night
    ["video", "paranal", observa - 0.25, telescopios - 0.25, "UN OBSERVATORIO DE NOCHE · PARANAL, CHILE", "VIDEO: ESO/J. COLOSIMO · CC BY 4.0"],
    # «Los mapas muestran…» → 2dF; «…y vacíos…» → SDSS
    ["foto", "mapa2df", mapas - 0.25, vacios - 0.25, "CÚMULOS Y FILAMENTOS · RECONSTRUCCIÓN DEL CENSO 2DF", "IMAGEN: WILLEM SCHAAP · CC BY-SA 3.0"],
    ["foto", "sdss", vacios - 0.25, fractal - 0.25, "CADA PUNTO ES UNA GALAXIA · MAPA DEL SDSS, CON LA TIERRA EN EL CENTRO", "IMAGEN: M. BLANTON Y SDSS · CC BY"],
    # «…un censo hecho con el telescopio anglo-australiano…» → its dome
    ["foto", "aat", censo - 0.25, en(14, "repitió") - 0.25, "EL TELESCOPIO ANGLO-AUSTRALIANO · SIDING SPRING, AUSTRALIA", "FOTO: DICEMAN STEPHEN WEST · CC BY-SA 3.0"],
    ["foto", "aatDentro", en(14, "repitió") - 0.25, en(14, "hasta") - 0.25, "POR DENTRO: UN ESPEJO DE 3,9 METROS", "FOTO: DICEMAN STEPHEN WEST · CC BY-SA 3.0"],
]
# own clips drawn by the scenes (not inserts): [name, start, end, first frame]
clips = [["titulo", 0.0, voz[0] + 0.2, 0], ["homogeneo", cierre - 0.3, total + 0.5, 0]]

K = {"fps": 30, "voz": [voz[k] for k in range(21)], "titulo": titulo, "neuronas": neuronas, "abre": abre, "parecen": parecen, "pregunta": pregunta,
     "medir": medir, "cortes": cortes, "galaxias": galaxias, "ordenes": ordenes, "espectro": espectro, "banda": banda, "megaparsec": megaparsec,
     "quiebran": quiebran, "redes": redes, "metricas": metricas, "otras": otras, "limites": limites, "deshace": deshace, "observa": observa,
     "telescopios": telescopios, "mapas": mapas, "vacios": vacios, "fractal": fractal, "contar": contar, "esferas": esferas, "pareja": pareja,
     "ritmo": ritmo, "tres": tres, "censo": censo, "grafica": grafica, "sube": sube, "setenta": setenta, "descarta": descarta, "cuatro": cuatro,
     "tarjetas": tarjetas, "lejos": en(14, "hasta"), "corte": en(7, "y"), "duplicar": en(12, "al"), "agranda": en(12, "luego"), "esfera1": en(12, "esfera"), "otravez": en(12, "se", 3), "lento": voz[13], "cierre": cierre, "puente": puente, "total": total,
     "inserciones": [[a, b, round(c, 2), round(d, 2), e, f] for a, b, c, d, e, f in inserciones],
     "clips": [[a, round(b, 2), round(c, 2), d] for a, b, c, d in clips], "vidLen": {"paranal": 330, "titulo": 420, "homogeneo": 1080}}
D2 = json.loads((RAIZ / "public" / "p8" / "wigglez_d2.json").read_text())
K["d2"] = {"r": D2["r"], "d2": D2["d2"], "err": D2["err"]}
(RAIZ / "src" / "cap8.json").write_text(json.dumps(K, ensure_ascii=False))
for a, b, c, d, e, f in inserciones:
    print(f"{b:10s} {c:7.2f} → {d:7.2f}  ({d - c:4.1f} s)")
print({k: v for k, v in K.items() if k not in ("voz", "inserciones", "clips")})
print("total", f"{int(total // 60)}:{total % 60:04.1f}")
