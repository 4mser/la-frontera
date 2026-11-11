"""Voice of chapter 2 «Entre la nada y el algo» (public/voz/c2/N.mp3, one per sentence group) and its word timings
(src/cap2_voz.json). Same voice and pace as chapter 1. Names are written as they are said: «Mandelbrót», «Yüliaá»
(Gaston Julia), «Pier Fatú» (Pierre Fatou), «Jáusdorf» (Hausdorff), «Láibnitz» (Leibniz). After making it, always run
audio/verifica_idioma.py on it: the multilingual voice must never slip into another language.

Usage: PYTHONPATH=pylib python3 audio/voz_cap2.py [line numbers to make again; default: all]
"""
import asyncio
import json
import sys
from pathlib import Path

import edge_tts

RAIZ = Path(__file__).resolve().parent.parent
VOZ, RATE, PITCH = "en-US-BrianMultilingualNeural", "-10%", "-2Hz"
LINEAS = [
    # 2 · a copy, and its opposite
    "En el capítulo anterior, cada parte era una copia exacta del todo.",
    "Pero no todos los fractales funcionan así.",
    "El conjunto de Mandelbrót tiene patrones que regresan: pequeñas copias de sí mismo.",
    "Pero al acercarnos aparecen también estructuras que no son réplicas de lo que ya vimos.",
    "La complejidad no siempre consiste en repetir una forma. A veces consiste en descubrir qué permanece cuando la forma cambia.",
    "Mil billones de aumentos más abajo aparece otra copia del conjunto. Pero el paisaje que la rodea no se parece a nada de lo anterior.",
    "La naturaleza tampoco hace copias exactas. Lo que se mantiene al acercarse a una nube es su rugosidad: la forma cambia.",
    # 3 · a constant, a world
    "El conejo nació de una sola constante. Cada constante define una dinámica, y esa dinámica dibuja un conjunto de Yüliaá.",
    "Basta con mover la constante un poco para que el mundo entero cambie de forma.",
    "Algunos de esos conjuntos permanecen de una sola pieza. Otros se fragmentan hasta convertirse en polvo.",
    "De un lado queda algo: un mundo entero, de una sola pieza. Del otro queda casi nada: un polvo de puntos sueltos.",
    "¿Cómo saber de qué lado cae cada constante, sin tener que dibujar su mundo completo?",
    "Hace un siglo, Pier Fatú y Gastón Yüliaá encontraron la respuesta: basta con seguir un solo punto, el cero.",
    "Si la órbita del cero se queda cerca, el mundo es de una sola pieza. Si se escapa, el mundo se rompe en polvo.",
    "Ahora pintemos cada constante del plano según el destino de su cero.",
    "Ya lo viste al comienzo de la película: es el conjunto de Mandelbrót.",
    "Cada punto de esta figura es una constante, y cada constante es un mundo.",
    # the map, explored
    "En el cuerpo principal, los mundos son círculos deformados, siempre de una sola pieza.",
    "En este bulbo, todos los mundos tienen la forma de la basílica.",
    "En este otro aparece el conejo, con tres orejas que se tocan en un punto. Mira la antena del bulbo: también tiene tres brazos.",
    "Y en este, cinco brazos. El mapa nos dice cuántos brazos tendrá cada mundo.",
    "Fuera del mapa, en cambio, cada mundo se rompe en polvo.",
    "Y en la frontera ocurre algo más profundo. Acerquémonos al mapa y a su mundo en el mismo punto.",
    "Es la misma forma. La matemática Tan Lei lo demostró en mil novecientos noventa: en esos puntos del borde, el mapa se parece al mundo que describe.",
    "Por eso decimos que es el mapa de todos esos mundos.",
    "Dentro, cada mundo es algo: una sola pieza. Fuera, cada mundo es casi nada: un polvo.",
    "Y la frontera es la línea exacta donde el algo se rompe en nada.",
    "Ahí, entre la nada y el algo, vive toda la complejidad que acabamos de ver.",
    # the asymptote, and Leibniz's question
    "Acerquémonos a un solo punto de esa frontera, y no nos detengamos.",
    "Cada vuelta de la espiral se parece a la anterior, pero nunca es la misma. Podemos seguir acercándonos para siempre, y nunca llegaremos al fondo.",
    "Es un límite: nos acercamos cada vez más a un punto que jamás alcanzamos.",
    "Ese punto no tiene largo, ni área, ni forma. Es lo más parecido a la nada que puede existir. Y aun así, es algo: pertenece al conjunto.",
    "En mil setecientos catorce, Láibnitz escribió la pregunta más difícil de todas: ¿por qué hay algo, y no más bien nada?",
    "Nadie sabe responderla. Pero el mismo Láibnitz, en mil seiscientos noventa y siete, diseñó una medalla para su sistema binario: con solo el uno y el cero, quería mostrar cómo todo puede salir de la nada.",
    "Volvamos entonces al cero, al vacío, y apliquemos la regla una sola vez.",
    "Con un paso aparece un círculo. Con diez pasos aparece una forma. Con infinitos pasos aparece una frontera infinita.",
    "Y cerca de cualquier punto de esa frontera, por pequeño que sea el trozo, el conjunto entero vuelve a aparecer.",
    "Lo que parecía casi nada contiene otra vez el todo, y así sin fin.",
    "Quizá esa sea la respuesta del fractal a la pregunta de Láibnitz: en la frontera entre la nada y el algo, el vacío nunca está del todo vacío.",
    # 4 · Cantor
    "Toma una línea de largo uno. Quítale el tercio del medio. Y vuelve a hacerlo con cada pedazo que queda, una y otra vez.",
    "En cada paso, el largo total se reduce: dos tercios, cuatro novenos, ocho veintisieteavos. En el límite, el largo es cero.",
    "Pero aun así, el conjunto no desaparece.",
    "Quedan infinitos puntos. Tantos como en la línea completa.",
    "Un conjunto de largo cero puede tener tantos puntos como una línea entera.",
    "El polvo de los mundos rotos tiene esta misma estructura, aunque su forma sea otra. Casi nada, y a la vez, infinito.",
    # 5 · the time that does not end
    "Fuera del conjunto, toda órbita termina escapando.",
    "Pero cerca de la frontera, ese escape tarda cada vez más: cien vueltas, después mil, después diez mil.",
    "Y en la frontera misma, el punto ya pertenece al conjunto: nunca escapa.",
    "La matemática sigue funcionando en ese borde. Lo que deja de bastar es nuestra intuición.",
    # 6 · what we do not know
    "La frontera del conjunto de Mandelbrót tiene dimensión de Jáusdorf dos. La misma dimensión que el plano.",
    "Pero dimensión y área son cosas distintas. Una frontera puede tener dimensión dos y, aun así, área cero.",
    "El conjunto tiene área, porque contiene regiones interiores. Pero su frontera…",
    "¿Tiene área? Todavía no sabemos demostrar si es positiva o nula.",
    "Una figura perfectamente definida. Una propiedad demostrada. Y una pregunta que sigue abierta.",
    # 7 · close
    "Largo cero, e infinitos puntos.",
    "Una frontera con la dimensión de un plano, cuya área todavía no sabemos determinar.",
    "Entre la nada y el algo… cabe el infinito.",
]


async def habla(texto, ruta):
    com = edge_tts.Communicate(texto, VOZ, rate=RATE, pitch=PITCH, boundary="WordBoundary")
    palabras, fin = [], 0.0
    with open(ruta, "wb") as f:
        async for trozo in com.stream():
            if trozo["type"] == "audio":
                f.write(trozo["data"])
            elif trozo["type"] == "WordBoundary":
                t0 = trozo["offset"] / 1e7
                palabras.append([trozo["text"], round(t0, 2)])
                fin = t0 + trozo["duration"] / 1e7
    return palabras, round(fin, 2)


async def main(cuales):
    ruta_info = RAIZ / "src" / "cap2_voz.json"
    info = json.loads(ruta_info.read_text()) if ruta_info.exists() else []
    info = (info + [None] * len(LINEAS))[:len(LINEAS)]
    for k, texto in enumerate(LINEAS, 1):
        if k not in cuales and info[k - 1] and info[k - 1]["texto"] == texto:
            continue
        palabras, fin = await habla(texto, RAIZ / "public" / "voz" / "c2" / f"{k}.mp3")
        info[k - 1] = {"texto": texto, "fin": fin, "palabras": palabras}
        print(k, fin, texto[:60])
    ruta_info.write_text(json.dumps(info, ensure_ascii=False))


asyncio.run(main({int(a) for a in sys.argv[1:]} or set(range(1, len(LINEAS) + 1))))
