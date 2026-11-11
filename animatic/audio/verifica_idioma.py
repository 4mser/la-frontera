"""Checks that every sentence of the voice is spoken in Spanish (the multilingual TTS voice sometimes slips into
Portuguese or English on short sentences, while a transcription still «understands» them).

Each sentence is cut out of its mp3 by the word timings and given to whisper's language detection on its own; a
sentence passes only if the detected language is Spanish with p ≥ 0.85.

Usage: python3 audio/verifica_idioma.py src/cap1p_voz.json public/voz/c1p/{n}.mp3 [index offset, default 1]
       (prints one line per failing sentence; exit code 1 if any fails)
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

MODELO = Path.home() / "Library/Application Support/nova-mac/whisper/ggml-large-v3-turbo-q5_0.bin"


def idioma(wav):
    out = subprocess.run(["whisper-cli", "-m", str(MODELO), "-l", "auto", "-dl", "-f", wav], capture_output=True, text=True).stderr
    m = re.search(r"auto-detected language: (\w+) \(p = ([\d.]+)\)", out)
    return (m.group(1), float(m.group(2))) if m else ("?", 0.0)


def oraciones(texto, palabras):
    """[(sentence, start, end)] using the word timings: sentences end at . ? ! : ;"""
    frases = [f.strip() for f in re.split(r"(?<=[.?!:;…])\s+", texto) if f.strip()]
    out, i = [], 0
    for f in frases:
        n = len(re.findall(r"[\wáéíóúüñÁÉÍÓÚÜÑ]+", f))
        if i >= len(palabras):
            break
        a = palabras[i][1]
        b = palabras[i + n][1] if i + n < len(palabras) else None
        out.append((f, a, b))
        i += n
    return out


def verifica(json_path, patron, base=1, solo=None):
    V = json.loads(Path(json_path).read_text())
    malas = []
    with tempfile.TemporaryDirectory() as tmp:
        for k, v in enumerate(V):
            if solo is not None and k not in solo:
                continue
            mp3 = patron.format(n=k + base)
            for f, a, b in oraciones(v["texto"], v["palabras"]):
                wav = f"{tmp}/s.wav"
                corte = ["-ss", str(max(0, a - 0.05))] + (["-to", str(b - 0.02)] if b else [])
                subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", mp3, *corte, "-ar", "16000", "-ac", "1", wav], check=True)
                lang, p = idioma(wav)
                if lang != "es" or p < 0.85:
                    malas.append((k, f, lang, p))
                    print(f"[{k}] {lang} p={p:.2f} · {f}")
    return malas


if __name__ == "__main__":
    base = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    sys.exit(1 if verifica(sys.argv[1], sys.argv[2], base) else 0)
