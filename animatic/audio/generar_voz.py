"""Provisional narration for the La frontera animatic (prologue and chapter I of script v7).

Usage (from the project root):
    PYTHONPATH=pylib python3 audio/generar_voz.py        # generates the lines that have no mp3 yet
    PYTHONPATH=pylib python3 audio/generar_voz.py 3 7    # regenerates only lines 3 and 7
Writes public/voz/NN.mp3, src/voz.json (duration of each line) and src/palabras.json (start of every word).
Note: the text is sent to the Microsoft Edge voice service (edge-tts). The final film uses a human voice.
"""
import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

import edge_tts
import imageio_ffmpeg

VOZ = "es-CL-LorenzoNeural"
VELOCIDAD = "-8%"
TONO = "-2Hz"
RAIZ = Path(__file__).resolve().parent.parent
FF = imageio_ffmpeg.get_ffmpeg_exe()

# One entry per spoken line, in the same order as LINEAS in src/linea.ts.
GUION = [
    # 00 Prólogo · el corazón
    "Esto es un corazón sano. Escúchalo bien: nunca late exactamente igual dos veces.",
    # 01 Prólogo · el reloj
    "Durante mucho tiempo se pensó que un cuerpo sano era un cuerpo estable, como un reloj. "
    "Las mediciones mostraron algo más interesante.",
    # 02 Prólogo · las escalas
    "El latido sano fluctúa con un patrón parecido en escalas de tiempo muy distintas. "
    "En algunas enfermedades del corazón, y con la edad, ese patrón tiende a perderse.",
    # 03 Prólogo · el borde
    "Hay algo en el borde entre el orden y el caos que se parece mucho a estar vivo.",
    # 04 I · la regla
    "Un número. Lo multiplicas por sí mismo, y le sumas una constante. Y repites.",
    # 05 I · las órbitas
    "Algunos números, al repetir la regla, se van al infinito. Otros se quedan para siempre cerca de casa.",
    # 06 I · nadie lo diseñó
    "Todo lo que vas a ver cabe en esa línea. Nadie lo diseñó.",
    # 07 I · Mandelbrot y Penrose
    "En mil novecientos ochenta, en una computadora de IBM, Benoît Mandelbrot vio esta figura con nitidez por primera vez. "
    "Pero la figura ya estaba ahí, escondida en la regla, esperando. "
    "El matemático Roger Penrose la comparó con el Everest: nadie la inventó. Alguien llegó hasta ella.",
    # 08 I · la pregunta
    "Y si se llega hasta ella, ¿dónde estaba antes?",
]


def duracion(mp3: Path) -> float:
    salida = subprocess.run([FF, "-i", str(mp3)], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", salida)
    return round(60 * int(m[2]) + float(m[3]), 2)


async def generar(i: int, texto: str, carpeta: Path):
    mp3 = carpeta / f"{i:02d}.mp3"
    com = edge_tts.Communicate(texto, VOZ, rate=VELOCIDAD, pitch=TONO, boundary="WordBoundary")
    marcas = []
    with open(mp3, "wb") as f:
        async for trozo in com.stream():
            if trozo["type"] == "audio":
                f.write(trozo["data"])
            elif trozo["type"] == "WordBoundary":
                marcas.append([trozo["text"], round(trozo["offset"] / 1e7, 2)])
    return marcas


async def main():
    carpeta = RAIZ / "public" / "voz"
    carpeta.mkdir(parents=True, exist_ok=True)
    ruta_pal = RAIZ / "src" / "palabras.json"
    palabras = json.loads(ruta_pal.read_text(encoding="utf-8")) if ruta_pal.exists() else []
    palabras += [[] for _ in range(len(GUION) - len(palabras))]
    pedidas = {int(x) for x in sys.argv[1:]}
    for i, texto in enumerate(GUION):
        mp3 = carpeta / f"{i:02d}.mp3"
        if (pedidas and i not in pedidas) or (not pedidas and mp3.exists() and palabras[i]):
            continue
        palabras[i] = await generar(i, texto, carpeta)
        print(i, len(palabras[i]), "palabras", flush=True)
    duraciones = [duracion(carpeta / f"{i:02d}.mp3") for i in range(len(GUION))]
    (RAIZ / "src" / "voz.json").write_text(json.dumps(duraciones), encoding="utf-8")
    ruta_pal.write_text(json.dumps(palabras[: len(GUION)], ensure_ascii=False), encoding="utf-8")
    print("duraciones", duraciones, "total", round(sum(duraciones), 1))


asyncio.run(main())
