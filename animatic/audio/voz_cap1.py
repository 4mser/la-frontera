"""Voice of chapter 1 «La regla» (public/voz/c1-N.mp3, one per scene) and its word timings (src/cap1_voz.json).

Same voice and pace as the opening (audio/voz_prologo2.py). Each scene is a list of (text, earliest start, pause)
pieces: each piece is spoken on its own and placed at its earliest start or, if later, a pause after the previous one,
so the scene breathes where the script says. Names and letters are written as they are said: «Gastón Yüliaá»
(Gaston Julia, stressed at the end as in French), «ce» for the constant c.

Usage: PYTHONPATH=pylib python3 audio/voz_cap1.py [scene numbers to make again; default: all]
"""
import asyncio
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts

RAIZ = Path(__file__).resolve().parent.parent
VOZ, RATE, PITCH = "en-US-BrianMultilingualNeural", "-10%", "-2Hz"
ESCENAS = [
    # 1 · back to the rule
    [("Volvamos a la regla.", 0.0, 0.0),
     ("Toma un número.", 0.0, 1.5), ("Multiplícalo por sí mismo.", 0.0, 0.5), ("Súmale una constante, ce.", 0.0, 0.5),
     ("Y con el resultado… vuelve a empezar.", 0.0, 0.7),
     ("Eso es todo. Una sola regla, repetida una y otra vez.", 0.0, 1.0)],
    # 2 · two fates (the numbers land one per pulse)
    [("Empecemos en cero, con ce igual a uno.", 0.0, 0.0),
     ("Uno.", 0.0, 0.9), ("Dos.", 0.0, 0.6), ("Cinco.", 0.0, 0.6), ("Veintiséis.", 0.0, 0.6), ("Seiscientos setenta y siete.", 0.0, 0.6),
     ("Se escapa. Cada vuelta lo lanza más lejos, sin límite.", 0.0, 0.8),
     ("Con ce igual a menos uno, el número va y viene.", 0.0, 1.5),
     ("Por muchas veces que repitas la regla, se queda cerca de casa.", 0.0, 0.5),
     ("Escapar, o quedarse.", 0.0, 1.0)],
    # 3 · the first border
    [("Si probamos todas las constantes de la recta, las que se quedan forman un solo tramo.", 0.0, 0.0),
     ("Desde menos dos… hasta un cuarto.", 0.0, 0.5),
     ("Justo en el borde, los números dudan.", 0.0, 1.5), ("Un poco más acá, se quedan para siempre.", 0.0, 0.6),
     ("Un poco más allá, tardan decenas de vueltas en decidirse… pero se escapan.", 0.0, 0.6),
     ("Ahí está la primera frontera. Pero en una recta, una frontera son apenas dos bordes.", 0.0, 1.5)],
    # 4 · a plane of numbers
    [("Para ver la verdadera forma de la regla hay que salir de la recta.", 0.0, 0.0),
     ("Los números complejos son puntos de un plano. Tienen una parte que va hacia los lados y otra que va hacia arriba.", 0.0, 1.0),
     ("Elevar al cuadrado un número así es girarlo y estirarlo a la vez.", 0.0, 1.0),
     ("Su ángulo se duplica. Su distancia al centro se multiplica por sí misma.", 0.0, 0.5),
     ("Si está a menos de uno del centro, se acerca. Si está a más de uno, se aleja.", 0.0, 0.8),
     ("Y sumar ce es moverlo siempre en la misma dirección.", 0.0, 1.0),
     ("Ahora cada constante es un punto del plano.", 0.0, 1.2),
     ("Partimos siempre de cero, y para saber su destino basta con una pregunta: ¿sale alguna vez de este círculo?", 0.0, 0.5),
     ("Si sale, sabemos que se irá al infinito.", 0.0, 0.6)],
    # 5 · the map (the long silence after the reveal is placed in the edit, between the two pieces)
    [("Probamos un punto. Y otro. Y otro.", 0.0, 0.0),
     ("Los que escapan los pintamos según lo rápido que huyen. Los que se quedan, de negro.", 0.0, 0.8),
     ("Nadie trazó este contorno a mano.", 0.0, 7.0),
     ("Aparece al preguntarle a cada punto del plano si se queda o se escapa.", 0.0, 0.6)],
    # 6 · the worlds of each point
    [("Pero cada punto de este mapa guarda algo más.", 0.0, 0.0),
     ("Si dejamos fija la constante y cambiamos el número de partida, la regla dibuja otra figura.", 0.0, 1.0),
     ("Se llama conjunto de Yüliaá.", 0.0, 0.5),
     ("Cuando la constante está dentro del conjunto, su mundo es de una sola pieza.", 0.0, 1.5),
     ("Cuando está afuera, se deshace en polvo.", 0.0, 0.5),
     ("Cada punto del conjunto de Mandelbrot es una constante. Y esa constante decide cómo será su conjunto de Yüliaá.", 0.0, 1.5),
     ("Por eso el conjunto de Mandelbrot es un mapa: organiza todos esos mundos.", 0.0, 1.0),
     ("Y en ciertos puntos de su borde, al acercarse, el mapa y el mundo empiezan a parecerse.", 0.0, 1.5)],
    # 7 · the people behind it
    [("En 1915, en la Primera Guerra Mundial, una bala le destruyó la nariz a un joven matemático francés, Gastón Yüliaá.", 0.0, 0.0),
     ("Siguió trabajando desde el hospital.", 0.0, 0.6),
     ("Tres años después publicó su estudio sobre estas reglas repetidas.", 0.0, 0.6),
     ("No tenía cómo verlas.", 0.0, 1.0), ("Las imaginó.", 0.0, 0.5),
     ("Sesenta años después, las computadoras empezaron a dibujarlas.", 0.0, 1.5),
     ("Las primeras imágenes eran toscas.", 0.0, 0.5),
     ("Con los años, la frontera fue apareciendo cada vez más nítida.", 0.0, 0.5)],
    # 8 · the question that opens chapter 2
    [("Una regla que cabe en una línea dibuja una frontera que no termina.", 0.0, 0.0),
     ("Su borde es tan quebrado que, a toda escala, sigue apareciendo detalle.", 0.0, 1.0),
     ("Tanto, que los matemáticos demostraron algo difícil de imaginar: según una medida precisa de la rugosidad, esa línea tiene la misma dimensión que un plano.", 0.0, 0.6),
     ("¿Qué significa que una forma tenga detalle infinito?", 0.0, 2.0)],
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
    return palabras, fin


async def main(cuales):
    ruta_info = RAIZ / "src" / "cap1_voz.json"
    info = json.loads(ruta_info.read_text()) if ruta_info.exists() else [None] * len(ESCENAS)
    for k, piezas in enumerate(ESCENAS, 1):
        if k not in cuales:
            continue
        palabras, fin, frases = [], 0.0, []
        with tempfile.TemporaryDirectory() as tmp:
            entradas, filtros = [], []
            for j, (texto, desde, pausa) in enumerate(piezas):
                ruta = Path(tmp) / f"{j}.mp3"
                pal, f = await habla(texto, ruta)
                desde = max(desde, fin + pausa if j else 0.0)
                palabras += [[p, round(desde + t, 2)] for p, t in pal]
                frases.append([texto, round(desde, 2), round(desde + f, 2)])
                fin = desde + f
                entradas += ["-i", str(ruta)]
                filtros.append(f"[{j}]adelay={int(desde * 1000)}|{int(desde * 1000)}[a{j}]")
            mezcla = ";".join(filtros) + ";" + "".join(f"[a{j}]" for j in range(len(piezas))) + f"amix=inputs={len(piezas)}:normalize=0"
            salida = RAIZ / "public" / "voz" / f"c1-{k}.mp3"
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *entradas, "-filter_complex", mezcla, "-c:a", "libmp3lame", "-b:a", "96k", str(salida)], check=True)
        info[k - 1] = {"fin": round(fin, 2), "palabras": palabras, "frases": frases}
        print(f"c1-{k}.mp3", round(fin, 2), "s")
    ruta_info.write_text(json.dumps(info, ensure_ascii=False))


asyncio.run(main({int(a) for a in sys.argv[1:]} or set(range(1, len(ESCENAS) + 1))))
