"""Timing of chapter V «Un corazón no es un metrónomo» (src/cap5.json), on its voice (src/cap5_voz.json, made by
audio/voz_cap5.py from fractales/GUION-capitulo-5-corazon.md) and on the real beats of nsr018 (src/cap5_datos.json).

Usage: PYTHONPATH=pylib python3 herramientas/tiempos_cap5.py
"""
import json
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
V = json.loads((RAIZ / "src" / "cap5_voz.json").read_text())
DAT = json.loads((RAIZ / "src" / "cap5_datos.json").read_text())
voz = {}


def tras(k, hueco):
    return round(voz[k] + V[k]["fin"] + hueco, 2)


def en(k, w, n=0):
    hits = [t for p, t in V[k]["palabras"] if p.lower().strip(".,:;¿?…") == w]
    return round(voz[k] + hits[n], 2)


def di(k, t):
    voz[k] = round(t, 2)
    return voz[k]


# 0 · title: the real beats of nsr018 from 0.8 s; the title on beat 8, one word per beat
latidos = (0.8 + np.concatenate([[0], np.cumsum(DAT["sano"]["latidos"][:60])])).round(3).tolist()
titulo = latidos[8]
# the question that drives the chapter, with a metronome beside the beat
di(0, latidos[14] + 0.2)                     # «¿Debería un corazón sano latir como un reloj…?»
k = next(i for i, x in enumerate(latidos) if x > tras(0, 0.4))
puente = round(latidos[k], 2)                # the bridge: one form of the film on each of five beats
pk = k
di(1, puente + 0.3)                          # «Hasta ahora, los fractales de esta historia…»
linea = tras(1, 0.4)
di(2, linea + 0.6)                           # «Al comienzo de esta historia escuchamos un corazón…»
di(3, tras(2, 0.6))                          # «Si en vez de escucharlo anotamos…»
metronomo = round(voz[3] + V[3]["fin"] + 0.3, 2)
di(4, metronomo + 0.3)                       # «Un metrónomo marcaría siempre el mismo tiempo…»
# 2 · twenty-four hours
dia = tras(4, 0.8)
di(5, dia + 0.6)                             # «Este es un día casi completo…»
di(6, tras(5, 4.0))                          # «Hay horas en que el ritmo baja…»
# 2b · the infinite zoom: Koch and the heart, one push per beat
zoom = tras(6, 0.8)
di(7, zoom + 0.6)                            # «Acerquémonos a esta línea como nos acercamos a la curva de Koch…»
di(8, tras(7, 1.6))                          # «De un día a una hora…»
di(9, tras(8, 1.2))                          # «Hasta que llegamos a unos pocos latidos…»
zoomFin = en(9, "latidos") + 0.4
mapaFin = round(voz[8] + 4.0, 2)
zoomLat = []
tz = zoom + 0.4
for r in DAT["sano"]["latidos"][100:]:
    if tz > zoomFin:
        break
    zoomLat.append(round(tz, 3)); tz += r
# 3 · measuring at many scales
dfa = tras(9, 1.2)
di(10, dfa + 1.2)                            # «Para medir esa estructura… un equipo de Boston…»
di(11, tras(10, 0.6))                        # «La idea es sencilla…»
ventanas = [en(11, "corta"), en(11, "tendencia"), en(11, "aparta")]
di(12, tras(11, 0.6))                        # «Luego se repite con ventanas cada vez más grandes…»
crecen = [voz[12] + 0.4, en(12, "recta")]
di(13, tras(12, 3.0))                        # «Es la misma herramienta que usó Richardson…»
di(14, tras(13, 0.6))                        # «Para este corazón…»
alfas = [en(14, "tres"), en(14, "cinco")]
di(15, tras(14, 0.6))                        # «Un ritmo completamente al azar…»
refs = [en(15, "medio"), en(15, "medio", 1), en(15, "uno", 2)]
# 4 · another heart
otro = tras(15, 1.0)
di(16, otro + 0.6)                           # «Ahora otra persona…»
di(17, tras(16, 0.5))                        # «Su línea también varía…»
alfasIC = [en(17, "siete"), en(17, "veintiséis")]
# 5 · eighty-three people
nubes = tras(17, 1.2)
di(18, nubes + 0.6)                          # «Dos personas no prueban nada…»
llegan = [en(18, "cincuenta"), en(18, "veintinueve")]
di(19, tras(18, 5.0))                        # «Como grupo…»
di(20, tras(19, 0.6))                        # «Pero las nubes se tocan…»
solapa = en(20, "tocan")
di(21, tras(20, 0.6))                        # «Tampoco controlamos todo…»
ivanov = tras(21, 0.6)
di(22, ivanov + 0.8)                         # «Otros estudios…»
# 6 · close: the dive into the wound heartbeat (faster and faster, until a silence); three spirals and the
# conclusion; the bridge to chapter VI (one equation and its bifurcation diagram)
cierre = tras(22, 1.2)
montaje = [round(cierre + 0.6, 3)]
for j in range(15):
    montaje.append(round(montaje[-1] + 0.85 * (0.3 / 0.85) ** (j / 14), 3))
quieto = round(montaje[-1] + 1.2, 2)
tres = round(quieto + 0.2, 2)                # three spirals: healthy, heart failure, metronome
di(23, tres + 3.0)                           # «Un corazón sano no es un metrónomo…»
di(24, tras(23, 0.6))                        # «Y eso importa. Ya en los años ochenta…»
di(25, tras(24, 0.6))                        # «Un corazón que late demasiado parejo…»
di(26, tras(25, 0.8))                        # «Estructura dentro de estructura…»
logistica = tras(26, 0.3)                    # the spiral fades; the line of beats becomes the line of one rule
di(27, logistica + 1.2)                      # «Un corazón obedece a muchas leyes a la vez. Veamos…»
ecuacion = tras(27, 0.2)
di(28, ecuacion + 0.4)                       # «Esta regla se usó para describir cómo cambia una población…»
# the bifurcation diagram drawn with the voice: order until r = 3, doublings until r ≈ 3,57, chaos until r = 4
b0 = tras(28, 0.4)
di(29, b0 + 0.3)                             # «Con r pequeño, la población se asienta en un solo valor…»
b30 = tras(29, 0.0)
di(30, tras(29, 0.4))                        # «Al subir r, ese valor se divide en dos…»
b357 = tras(30, 0.0)
di(31, tras(30, 0.4))                        # «Y de pronto aparece el caos…»
b4 = tras(31, 0.0)
zoomB = [tras(31, 0.6)]
di(32, zoomB[0] + 0.4)                       # «Si nos acercamos, dentro del caos aparecen copias más pequeñas…»
zoomB += [round(zoomB[0] + 4.5, 2), tras(32, 0.3), tras(32, 3.3)]   # in, hold, out
di(33, tras(32, 0.8))                        # «Entre el orden del metrónomo y el desorden total…»
total = tras(33, 5.0)
bifurca = [b0, b4]
bif = {"t0": b0, "t30": b30, "t357": b357, "t4": b4, "zoom": zoomB}
calma = []
tc = quieto
for r in DAT["sano"]["latidos"][200:]:
    calma.append(round(tc, 3)); tc += r
    if tc > logistica + 1.0:
        break
oscuro = logistica

K = {"fps": 30, "voz": [voz[k] for k in range(34)], "latidos": latidos, "titulo": titulo, "puente": puente, "pk": pk, "linea": linea,
     "metronomo": metronomo, "dia": dia, "zoom": zoom, "zoomFin": zoomFin, "mapaFin": mapaFin, "zoomLat": zoomLat, "dfa": dfa,
     "ventanas": ventanas, "crecen": crecen, "alfas": alfas, "refs": refs, "otro": otro, "alfasIC": alfasIC, "nubes": nubes,
     "llegan": llegan, "solapa": solapa, "ivanov": ivanov, "cierre": cierre, "montaje": montaje, "quieto": quieto, "calma": calma,
     "tres": tres, "logistica": logistica, "bifurca": bifurca, "bif": bif, "ecuacion": ecuacion, "oscuro": oscuro, "total": total}
(RAIZ / "src" / "cap5.json").write_text(json.dumps(K))
print({k: v for k, v in K.items() if k not in ("voz", "latidos")})
print("total", f"{int(total // 60)}:{total % 60:04.1f}")
