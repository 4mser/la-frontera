"""Timing of chapter IX «El lenguaje y sus rangos» (src/cap9.json), on its voice (src/cap9_voz.json, made by
audio/voz_cap9.py from fractales/GUION-capitulo-9-lenguaje.md).

Usage: PYTHONPATH=pylib python3 herramientas/tiempos_cap9.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
V = json.loads((RAIZ / "src" / "cap9_voz.json").read_text())
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
galileo = di(0, 10.2)                        # «En mil seiscientos veintitrés, Galileo escribió…»
portada = en(0, "que")
pagina = en(0, "y")
di(1, tras(0, 0.4))                          # «Sus letras, decía, son triángulos…»
letras = en(1, "son")
laberinto = en(1, "sin")
repaso = di(2, tras(1, 1.2))                 # «En esta película, unas pocas reglas…»
paneles = [en(2, w) for w in ("fronteras", "ríos", "corazones", "antenas", "galaxias")]
pregunta = en(2, "por")
wigner = di(3, tras(2, 1.4))                 # «En mil novecientos sesenta, el físico Eugene Wigner…»
misterio = en(3, "dijo")
di(4, tras(3, 0.5))                          # «Y la llamó un regalo maravilloso…»
alcance = di(5, tras(4, 0.8))                # «Pero en el mismo ensayo advirtió algo más…»
limitado = en(5, "y")
posturas = di(6, tras(5, 1.4))               # «Hay varias maneras de responder…»
tarjetas = [en(6, "para"), en(6, "para", 1), en(6, "y")]
di(7, tras(6, 0.6))                          # «El debate sigue abierto…»
caras = en(7, "pero")
mandel = di(8, tras(7, 1.0))                 # «Nadie eligió la forma del conjunto de Mandelbrot…»
frontera = di(9, tras(8, 0.8))               # «En cambio, el largo de una frontera…»
encontramos = en(9, "una", 1)
bandas = di(10, tras(9, 1.4))                # «Si ponemos cada ley de esta película sobre una sola escala…»
b_antena, b_frontera, b_galaxias = en(10, "la", 1), en(10, "la", 2), en(10, "las")
corazon = di(11, tras(10, 0.6))              # «Y el corazón, en el tiempo…»
infinito = en(11, "solo")
evidencia = di(12, tras(11, 1.0))            # «Estas bandas no marcan un límite de la naturaleza…»
bordes = en(12, "más")
puente = di(13, tras(12, 1.4))               # «Toda descripción tiene una frontera…»
total = tras(13, 4.0)

K = {"fps": 30, "voz": [voz[k] for k in range(14)], "titulo": titulo, "galileo": galileo, "portada": portada, "pagina": pagina,
     "letras": letras, "laberinto": laberinto, "repaso": repaso, "paneles": paneles, "pregunta": pregunta, "wigner": wigner,
     "misterio": misterio, "alcance": alcance, "limitado": limitado, "posturas": posturas, "tarjetas": tarjetas, "caras": caras,
     "mandel": mandel, "frontera": frontera, "encontramos": encontramos, "bandas": bandas, "b_antena": b_antena, "b_frontera": b_frontera,
     "b_galaxias": b_galaxias, "corazon": corazon, "infinito": infinito, "evidencia": evidencia, "bordes": bordes, "puente": puente, "total": total}
(RAIZ / "src" / "cap9.json").write_text(json.dumps(K, ensure_ascii=False))
print({k: v for k, v in K.items() if k != "voz"})
print("total", f"{int(total // 60)}:{total % 60:04.1f}")
