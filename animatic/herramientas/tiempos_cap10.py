"""Timing of chapter X «La frontera» (src/cap10.json), on its voice (src/cap10_voz.json, made by audio/voz_cap10.py
from fractales/GUION-capitulo-10-frontera.md) and on its own clips:
- viaje (45 s): the cosmic web → a galaxy → the Earth → the fjords of Chile → a drop (herramientas/viaje_cap10.py);
- micro (45 s): the living microcosm, ending on a Julia set (herramientas/microcosmos/);
- mandel (66 s): the deep zoom, 60 s to ×10⁶⁰ and 6 s on the copy (herramientas/mandel_profundo/);
- giro (30 s): a pupil, an eye, the retina, the neurons, the cosmic web (herramientas/giro_cap10.py).

Usage: PYTHONPATH=pylib python3 herramientas/tiempos_cap10.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
V = json.loads((RAIZ / "src" / "cap10_voz.json").read_text())
voz = {}


def tras(k, hueco):
    return round(voz[k] + V[k]["fin"] + hueco, 2)


def di(k, t):
    voz[k] = round(t, 2)
    return voz[k]


DUR = {"viaje": 45.0, "micro": 45.0, "mandel": 66.0, "giro": 30.0}
# 0 · in the dark: a heartbeat, a point
di(0, 6.0)                                   # «Al comienzo, prometimos un viaje por tres fronteras…»
# 1 · the returns
corazon = di(1, tras(0, 1.4))                # «Un corazón sano no late como un reloj…»
costa = di(2, tras(1, 1.2))                  # «Una costa no tiene un largo verdadero…»
richardson = di(3, tras(2, 1.2))             # «Richardson midió fronteras…»
red = di(4, tras(3, 1.2))                    # «Y la red del cosmos…»
titulo = tras(4, 1.4)
di(5, titulo + 5.0)                          # «Entonces, ¿qué significa conocer desde una frontera?…»
# 2 · the shot with no cut
viaje = tras(5, 0.6)
di(6, viaje + 1.0)                           # «Entre lo más grande que podemos observar…»
di(7, viaje + 26.5)                          # «Medida en línea recta, la costa de Chile…»
micro = round(viaje + DUR["viaje"], 2)
di(8, micro + 5.0)                           # «En una gota de agua de mar viven organismos…»
di(9, tras(8, 1.6))                          # «Algunas de ellas, las diatomeas…»
di(10, micro + 37.5)                         # «Y ahí, donde la vida dibuja sus bordes…»
mandel = round(micro + DUR["micro"], 2)
di(11, mandel + 15.4)                        # «Desde aquí, ya no hay nada que medir…» (when the image would be under 10⁻¹⁹ m)
copia = round(mandel + 60.0, 2)
di(12, copia + 0.6)                          # «Sesenta órdenes de magnitud más abajo, la misma forma. Completa.»
# 3 · the turn
giro = round(mandel + DUR["mandel"], 2)
di(13, giro + 8.5)                           # «Pero toda esta profundidad la recorrió alguien…»
di(14, giro + 24.6)                          # «La frontera no está solo en las cosas…»
# 4 · the end
final = round(giro + DUR["giro"], 2)
di(15, final + 5.0)                          # «Una frontera puede marcar el límite de una explicación…»
nombre = tras(15, 4.0)
total = round(nombre + 9.0, 2)

clips = [["homogeneo", red - 0.4, titulo + 0.4, 120], ["viaje", viaje, micro, 0], ["micro", micro, mandel, 0], ["mandel", mandel, giro, 0], ["giro", giro, final + 0.5, 0]]
K = {"fps": 30, "voz": [voz[k] for k in range(16)], "corazon": corazon, "costa": costa, "richardson": richardson, "red": red,
     "titulo": titulo, "viaje": viaje, "micro": micro, "mandel": mandel, "copia": copia, "giro": giro, "final": final, "nombre": nombre,
     "total": total, "clips": [[a, round(b, 2), round(c, 2), d] for a, b, c, d in clips],
     "vidLen": {"viaje": 1350, "micro": 1350, "mandel": 1980, "giro": 900, "homogeneo": 1080}}
(RAIZ / "src" / "cap10.json").write_text(json.dumps(K, ensure_ascii=False))
print({k: v for k, v in K.items() if k not in ("voz", "clips")})
print("total", f"{int(total // 60)}:{total % 60:04.1f}")
