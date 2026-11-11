"""Provisional line for the pulse montage (public/voz/montaje.mp3)."""
import asyncio
import json
from pathlib import Path

import edge_tts

RAIZ = Path(__file__).resolve().parent.parent
TEXTO = ("Todo lo que acabas de ver sale de una sola regla. "
         "Un número, multiplicado por sí mismo, más una constante. "
         "Repetida una y otra vez, dibuja un borde que nunca termina. "
         "Cada copia contiene otras copias. Cada punto guarda un mundo distinto. "
         "Nadie lo inventó: estaba ahí, esperando que alguien mirara. "
         "Y mientras más nos acercamos, más hay por ver.")

async def main():
    com = edge_tts.Communicate(TEXTO, "en-US-BrianMultilingualNeural", rate="-8%", pitch="-2Hz", boundary="WordBoundary")
    marcas = []
    with open(RAIZ / "public" / "voz" / "montaje.mp3", "wb") as f:
        async for trozo in com.stream():
            if trozo["type"] == "audio":
                f.write(trozo["data"])
            elif trozo["type"] == "WordBoundary":
                marcas.append([trozo["text"], round(trozo["offset"] / 1e7, 2)])
    (RAIZ / "src" / "palabras_montaje.json").write_text(json.dumps(marcas, ensure_ascii=False))


asyncio.run(main())
print("listo")
