"""Provisional lines for the three opening directions (public/voz/dir-A.mp3, dir-B.mp3, dir-C.mp3)."""
import asyncio
import json
from pathlib import Path

import edge_tts

RAIZ = Path(__file__).resolve().parent.parent
LINEAS = {
    "A": "Nadie diseñó lo que acabas de ver. Cabe en una sola línea.",
    "B": "Esto es un corazón sano, durante un día entero. Nunca late exactamente igual dos veces.",
    "C": "Todo esto sale de una sola regla.",
}


async def main():
    for k, s in LINEAS.items():
        await edge_tts.Communicate(s, "es-CL-LorenzoNeural", rate="-12%", pitch="-3Hz").save(str(RAIZ / "public" / "voz" / f"dir-{k}.mp3"))
        print("listo", k)

asyncio.run(main())
