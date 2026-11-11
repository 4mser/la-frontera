"""Voice of chapter X «La frontera» (public/voz/c10/N.mp3, one per line of the script) and its word
timings (src/cap10_voz.json). Same voice and pace as chapters I and II. The lines are read from the script
(fractales/GUION-capitulo-10-frontera.md, every «> **VOZ:**» line, sources stripped), and names are rewritten as they
are said: «Ríchardson». After making it, run audio/verifica_idioma.py.

Usage: PYTHONPATH=pylib python3 audio/voz_cap10.py [line numbers to make again; default: the changed ones]
"""
import asyncio
import json
import re
import sys
from pathlib import Path

import edge_tts

RAIZ = Path(__file__).resolve().parent.parent
GUION = RAIZ.parent / "GUION-capitulo-10-frontera.md"
VOZ, RATE, PITCH = "en-US-BrianMultilingualNeural", "-10%", "-2Hz"
PRONUNCIA = [("Richardson", "Ríchardson"), ("Ernst Haeckel", "Érnst Héckel")]


def lineas():
    out = []
    for l in GUION.read_text().splitlines():
        m = re.match(r"> \*\*VOZ[^*]*:\*\* (.*)", l)
        if m:
            t = re.sub(r"\s*\[F[\d, F]*\]\s*$", "", m.group(1)).strip()
            for a, b in PRONUNCIA:
                t = t.replace(a, b)
            out.append(t)
    return out


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
    L = lineas()
    (RAIZ / "public" / "voz" / "c10").mkdir(parents=True, exist_ok=True)
    ruta_info = RAIZ / "src" / "cap10_voz.json"
    info = json.loads(ruta_info.read_text()) if ruta_info.exists() else []
    info = (info + [None] * len(L))[:len(L)]
    for k, texto in enumerate(L, 1):
        if k not in cuales and info[k - 1] and info[k - 1]["texto"] == texto:
            continue
        palabras, fin = await habla(texto, RAIZ / "public" / "voz" / "c10" / f"{k}.mp3")
        info[k - 1] = {"texto": texto, "fin": fin, "palabras": palabras}
        print(k, fin, texto[:60])
    ruta_info.write_text(json.dumps(info, ensure_ascii=False))


asyncio.run(main({int(a) for a in sys.argv[1:]}))
