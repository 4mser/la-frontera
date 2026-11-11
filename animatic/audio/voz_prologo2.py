"""Voice of the prologue v2 «El borde de todo» (public/voz/p2-N.mp3) and its timings (src/prologo2_voz.json).

A line can be a list of (text, earliest start, pause) pieces: each piece is spoken on its own and placed at its earliest
start (seconds from the start of the line) or, if later, a pause after the previous piece ends. So each named thing
lands on its image («En un río» on the delta...) and the line breathes where it should.

Usage: PYTHONPATH=pylib python3 audio/voz_prologo2.py [line numbers to make again, e.g. 1 5; default: all]
"""
import asyncio
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts

RAIZ = Path(__file__).resolve().parent.parent
# names are written as they are said (Benoit Mandelbrot → «Benuaá Mandelbrót»: the long final vowel makes the voice stress it, as in French)
LINEAS = [
    # pieces: (text, earliest start, pause after the previous piece)
    ([("Hay formas que aparecen una y otra vez.", 0.0, 0.0), ("En un río.", 3.3, 0.9), ("En un rayo.", 5.4, 0.5),
      ("En árboles y plantas.", 7.5, 0.5), ("En tus manos.", 9.7, 0.5), ("En tu sistema nervioso.", 11.8, 0.5),
      ("En una neurona.", 15.4, 0.5),
      ("Y cuando las miramos de cerca, descubrimos algo extraño: ningún contorno es tan simple como parecía.", 0.0, 1.4)], "-10%", "-2Hz"),
    ([("¿Cuánto mide una costa?", 0.0, 0.0), ("En 1967, Benuaá Mandelbrót mostró que no hay una sola respuesta:", 0.0, 1.4),
      ("depende de la regla con que la recorras.", 0.0, 0.6), ("Cambias la escala, y aparece el detalle.", 0.0, 1.0),
      ("Y con reglas cada vez más pequeñas, la medida no deja de crecer.", 0.0, 1.0)], "-10%", "-2Hz"),
    # the second sentence waits for the rule to be written on screen
    ([("Hay una frontera que nace de una regla matemática extraordinariamente simple.", 0.0, 0.0),
      ("Una regla capaz de revelar una complejidad que parece no terminar.", 0.0, 1.6)], "-10%", "-2Hz"),
    ("¿Y si algunas de las formas que encontramos en la naturaleza fueran pistas de algo más profundo?", "-12%", "-3Hz"),
    ("Este es un viaje por las fronteras. Las que dibujan las formas. Las que nos separan. "
     "Y las que limitan lo que creemos conocer.", "-14%", "-4Hz"),
    ("Porque, a veces, para encontrar un universo entero, basta con mirar más de cerca.", "-16%", "-5Hz"),
]


async def habla(texto, rate, pitch, ruta):
    """Speaks one text into an mp3; returns its words with their times and the end of the last one."""
    com = edge_tts.Communicate(texto, "en-US-BrianMultilingualNeural", rate=rate, pitch=pitch, boundary="WordBoundary")
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
    ruta_info = RAIZ / "src" / "prologo2_voz.json"
    info = json.loads(ruta_info.read_text()) if ruta_info.exists() else [None] * len(LINEAS)
    for k, (texto, rate, pitch) in enumerate(LINEAS, 1):
        if k not in cuales:
            continue
        salida = RAIZ / "public" / "voz" / f"p2-{k}.mp3"
        if isinstance(texto, str):
            palabras, fin = await habla(texto, rate, pitch, salida)
        else:
            # each piece on its own, then all of them laid on one track at their offsets
            palabras, fin = [], 0.0
            with tempfile.TemporaryDirectory() as tmp:
                entradas, filtros = [], []
                for j, (trozo, desde, pausa) in enumerate(texto):
                    ruta = Path(tmp) / f"{j}.mp3"
                    pal, f = await habla(trozo, rate, pitch, ruta)
                    desde = max(desde, fin + pausa if j else 0.0)
                    palabras += [[p, round(desde + t, 2)] for p, t in pal]
                    fin = desde + f
                    entradas += ["-i", str(ruta)]
                    filtros.append(f"[{j}]adelay={int(desde * 1000)}|{int(desde * 1000)}[a{j}]")
                mezcla = ";".join(filtros) + ";" + "".join(f"[a{j}]" for j in range(len(texto))) + f"amix=inputs={len(texto)}:normalize=0"
                subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *entradas, "-filter_complex", mezcla, "-c:a", "libmp3lame", "-b:a", "96k", str(salida)], check=True)
        info[k - 1] = {"fin": round(fin, 2), "palabras": palabras}
        print(f"p2-{k}.mp3", round(fin, 2), "s")
    ruta_info.write_text(json.dumps(info, ensure_ascii=False))


asyncio.run(main({int(a) for a in sys.argv[1:]} or set(range(1, len(LINEAS) + 1))))
