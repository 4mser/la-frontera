"""The prologue's voice (public/voz/prologo-N.mp3), Brian, close and unhurried; the last two lines lower.
Also writes src/prologo_voz.json: the duration of every line and the time of the words that the image follows.

Usage: PYTHONPATH=pylib python3 audio/voz_prologo.py
"""
import asyncio
import json
from pathlib import Path

import edge_tts

RAIZ = Path(__file__).resolve().parent.parent
LINEAS = [
    ("Tu corazón late unas cien mil veces al día, y casi nunca lo hace dos veces de la misma manera. "
     "Los intervalos se alargan y se acortan. Incluso cuando estás quieto, el corazón responde a un cuerpo que siempre está cambiando. "
     "Al medirlo con precisión aparece algo inesperado: sus variaciones guardan una relación entre ellas, "
     "y esa relación se repite en segundos, en minutos y en horas.", "-10%", "-2Hz"),
    ("En un corazón que falla, esa relación se debilita. Sigue latiendo, pero la organización de sus variaciones cambió.", "-10%", "-2Hz"),
    ("Demasiada rigidez puede ser una señal de que algo se perdió. El azar puro tampoco tiene esa organización. "
     "Lo que importa es cómo se relacionan los cambios.", "-10%", "-2Hz"),
    ("Y esa pregunta va mucho más allá del corazón. ¿Qué ocurre en el límite entre lo que permanece y lo que escapa? "
     "Entre el orden y el caos.", "-12%", "-3Hz"),
    ("En la frontera.", "-18%", "-5Hz"),
    ("Hay fronteras que esconden mundos enteros.", "-18%", "-5Hz"),
]


async def main():
    info = []
    for k, (texto, rate, pitch) in enumerate(LINEAS, 1):
        com = edge_tts.Communicate(texto, "en-US-BrianMultilingualNeural", rate=rate, pitch=pitch, boundary="WordBoundary")
        palabras, fin = [], 0.0
        with open(RAIZ / "public" / "voz" / f"prologo-{k}.mp3", "wb") as f:
            async for trozo in com.stream():
                if trozo["type"] == "audio":
                    f.write(trozo["data"])
                elif trozo["type"] == "WordBoundary":
                    t0 = trozo["offset"] / 1e7
                    palabras.append([trozo["text"], round(t0, 2)])
                    fin = t0 + trozo["duration"] / 1e7
        info.append({"fin": round(fin, 2), "palabras": palabras})
    (RAIZ / "src" / "prologo_voz.json").write_text(json.dumps(info, ensure_ascii=False))


asyncio.run(main())
