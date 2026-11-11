"""Timing of chapter VII «Del patrón a la herramienta» (src/cap7.json), on its voice (src/cap7_voz.json, made by
audio/voz_cap7.py from fractales/GUION-capitulo-7-herramienta.md).

Usage: PYTHONPATH=pylib python3 herramientas/tiempos_cap7.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
V = json.loads((RAIZ / "src" / "cap7_voz.json").read_text())
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
pregunta = 8.6
di(0, pregunta + 0.5)                        # «Hasta aquí hemos mirado fractales…»
tarjetas = tras(0, 0.2)
repaso = [en(0, "matemática"), en(0, "naturaleza"), en(0, "ritmo"), en(0, "qué")]   # the three, then the question
# 2 · design: an antenna
antena = round(tarjetas + 4.8, 2)
di(1, antena + 0.6)                          # «Una antena funciona mejor con las ondas…»
edificio = tras(1, 0.6)
di(2, edificio + 0.5)                        # «A fines de los años ochenta, un radioaficionado de Boston…»
corte = en(2, "cortó")
puente = tras(2, 0.8)
di(3, puente + 1.2)                          # «En mil novecientos noventa y seis, Cárles Puénte…»
escalas = en(3, "cinco")
construyeron = en(3, "construyeron")
bandas = tras(3, 0.6)
di(4, bandas + 0.4)                          # «Y la antena funcionó en cinco bandas…»
sintoniza = en(4, "sintoniza")
di(5, tras(4, 0.6))                          # «Durante años, antenas con formas de este tipo…»
quinta = tras(5, 0.5)
di(6, quinta + 0.4)                          # «Pero la quinta banda no cayó exactamente donde debía…»
# 3 · represent: a landscape
paisaje = tras(6, 1.2)
di(7, paisaje + 0.6)                         # «Dibujar una montaña punto por punto…»
regla = tras(7, 0.4)
di(8, regla + 0.4)                           # «Se toma el punto medio de una línea…»
genesis = tras(8, 3.8)                       # room for the real ridges after «aparece una cordillera»
di(9, genesis + 0.3)                         # «Dos años después, esa misma técnica…»
frontera = tras(9, 0.8)
di(10, frontera + 0.6)                       # «La misma regla puede inventar una frontera…»
pixel = tras(10, 0.4)
di(11, pixel + 0.3)                          # «El detalle, en cambio, se acaba en el píxel…»
# 4 · measure: a retina
retina = tras(11, 1.2)
di(12, retina + 0.6)                         # «En el capítulo del corazón medimos una señal…»
pasos = tras(12, 0.3)
di(13, pasos + 0.4)                          # «Una fotografía del fondo del ojo se convierte…»
numero = round(pasos + 8.5, 2)
revision = tras(13, 1.6)
di(14, revision + 0.4)                       # «Una revisión de catorce estudios…»
di(15, tras(14, 0.6))                        # «Pero cada estudio mide de una manera distinta…»
# 4b · measure: cancer (added 7 nov): healthy vessels beside a tumour's, then cell contours
cancer = tras(15, 1.4)
di(19, cancer + 0.8)                         # «La misma pregunta se hace en la investigación del cáncer…»
tumor = en(19, "los")                        # the tumour's network starts growing on «Los vasos que alimentan un tumor»
di(20, tras(19, 0.7))                        # «Medida con cajas…»
cajas = round(voz[20] - 0.1, 2)
celulas = en(20, "algo")                     # «Algo parecido ocurre con el contorno de las células…»
di(21, tras(20, 0.8))                        # «Se estudia como ayuda…»
# 5 · close: three tools, three ranges; out to the cosmic web
cierre = tras(21, 1.2)
di(16, cierre + 1.5)                         # «Ninguna de estas herramientas usa un fractal infinito…»
di(17, tras(16, 0.6))                        # «Usar un fractal es saber en qué rango…»
universo = tras(17, 0.4)
di(18, universo + 3.0)                       # «¿Y el rango más grande de todos?…»
final = universo                             # the close: out through the web, the collapse, the Big Bang (herramientas/final_cap7.py)
bang = round(final + 14.2, 2)
total = round(final + 31.0, 2)

# the shot list: one shot at a time, cut at the start of the sentence that names it (feedback-frontera-montaje)
inserciones = [
    # «Un teléfono necesita hablar en muchas bandas…» → a phone tower; «pero dentro de él casi no hay espacio» → inside a phone
    ["video", "torre", en(1, "un", 1) - 0.25, en(1, "pero") - 0.25, "UNA TORRE DE TELEFONÍA", "VIDEO: WIKIDEAS1 · CC0"],
    ["foto", "iphone", en(1, "pero") - 0.25, edificio - 0.1, "LA ANTENA DE UN TELÉFONO, POR DENTRO", "FOTO: RAIMOND SPEKKING · CC BY-SA 4.0"],
    # the radio amateur's story is drawn as motion graphics (cap7.ts, historia): no inserts over it
    # «Durante años, antenas con formas de este tipo…» → a patented fractal antenna
    ["foto", "antenaPatente", voz[5] - 0.25, quinta - 0.1, "UNA ANTENA FRACTAL PATENTADA · PATENTE DE EE. UU. 6.452.553", "DIBUJO DE PATENTE · DOMINIO PÚBLICO"],
    # «Dibujar una montaña punto por punto es imposible.» → real mountains
    ["video", "dron", paisaje, en(7, "en") - 0.25, "MONTAÑAS REALES · MYŌKŌ-TOGAKUSHI, JAPÓN", "VIDEO: BENLISQUARE · CC BY-SA 4.0"],
    # after «…aparece una cordillera»: real ridges in the haze, in the pause
    ["foto", "cordilleras", tras(8, 0.2), genesis - 0.2, "CORDILLERAS REALES EN LA NIEBLA · AGUMBE, INDIA", "FOTO: PRADYUMNAKP · CC0"],
    # «Dos años después… la secuencia Génesis…» → our own recreation of it (herramientas/genesis_cap7.py)
    # «…dibujó el planeta» → the dead planet; «de la secuencia Génesis en una película de Star Trek» → the film; «una de las primeras…» → the flight
    ["video", "genesis", genesis - 0.2, en(9, "de") - 0.25, "RECREACIÓN · LA SECUENCIA GÉNESIS DE STAR TREK II (1982)", "ANIMACIÓN PROPIA CON LA MISMA REGLA · LA ORIGINAL ES DE LUCASFILM PARA PARAMOUNT"],
    ["foto", "startrek", en(9, "de") - 0.25, en(9, "una", 1) - 0.25, "STAR TREK II: LA IRA DE KHAN (1982) · UN UNIFORME ORIGINAL DE LA PELÍCULA", "FOTO: MARCIN WICHARY · CC BY 2.0 · LOGOTIPO: DOMINIO PÚBLICO"],
    ["video", "genesis", en(9, "una", 1) - 0.25, frontera - 0.25, "RECREACIÓN · EL VUELO SOBRE LAS MONTAÑAS NUEVAS", "ANIMACIÓN PROPIA CON LA MISMA REGLA · LA ORIGINAL ES DE LUCASFILM PARA PARAMOUNT", 150],
    # «En el capítulo del corazón medimos una señal en el tiempo.» → an eye exam; «Aquí la pregunta es otra…» → a fundus camera
    ["foto", "examenOjo", retina, en(12, "aquí") - 0.25, "UN EXAMEN DE OJOS · INSTITUTO NACIONAL DEL OJO, EE. UU.", "FOTO: NIH · DOMINIO PÚBLICO"],
    ["foto", "fondoExamen", en(12, "aquí") - 0.25, pasos + 0.1, "UNA CÁMARA DE FONDO DE OJO EN USO", "FOTO: AJEESHKUMAR4U · CC BY-SA 4.0"],
]
carpenter = round(voz[7] + [t for q, t in V[7]["palabras"] if q.lower() == "en"][0] - 0.25, 2)   # the portrait on «En mil novecientos ochenta»
K = {"fps": 30, "voz": [voz[k] for k in range(22)], "cancer": cancer, "tumor": tumor, "cajas": cajas, "celulas": celulas, "titulo": titulo, "pregunta": pregunta, "tarjetas": tarjetas, "repaso": repaso, "antena": antena,
     "edificio": edificio, "corte": corte, "puente": puente, "escalas": escalas, "construyeron": construyeron, "bandas": bandas, "sintoniza": sintoniza, "quinta": quinta,
     "paisaje": paisaje, "carpenter": carpenter, "regla": regla, "genesis": genesis, "frontera": frontera, "pixel": pixel, "retina": retina,
     "pasos": pasos, "numero": numero, "revision": revision, "cierre": cierre, "universo": universo, "final": final, "bang": bang, "total": total, "inserciones": [[a, b, round(c, 2), round(d, 2), e, f, *g] for a, b, c, d, e, f, *g in inserciones], "vidN": 210, "vidLen": {"genesis": 450, "final": 975}, "vozPal": [[], [], [[w, round(x, 2)] for w, x in V[2]["palabras"]]]}
(RAIZ / "src" / "cap7.json").write_text(json.dumps(K))
print({k: v for k, v in K.items() if k != "voz"})
print("total", f"{int(total // 60)}:{total % 60:04.1f}")
