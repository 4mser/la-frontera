"""LA FRONTERA · trailer v2: a classic film opening (black, braams, the voice in short lines, one clean shot per word)
and then the hypercut of v1 (approved: «en el 1:40 el video se puso muy genial»). Clean shots: limpios/ (chapter X
rendered with --props '{"limpio":true}'). Subtitles on everything (SubsTrailer, laid over) and an .srt for YouTube.

usage: PYTHONPATH=../animatic/pylib python3 arma_trailer2.py [previa]
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

AQUI = Path(__file__).resolve().parent
ANI = AQUI.parent / "animatic"
sys.path.insert(0, str(ANI / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, hz, oleaje, poner, sub, t_, voz  # noqa: E402

FILM = Path.home() / "Development/BN_Videos/entregables/La-frontera/Corrido/La-frontera-corrido-v6.mp4"
L = AQUI / "limpios"
PARTES = AQUI / "partes2"
FPS = 30
PREVIA = sys.argv[1:] == ["previa"]
DUR = 48.0 if PREVIA else 48.0

# picture: (trailer start, source, source start, duration); None = black
PLANOS = [
    (0.0, None, 0, 2.2),
    (2.2, FILM, 3.0, 3.3),                 # the first point of light of the film
    (5.5, L / "escarcha.mp4", 0.0, 1.9),
    (7.4, None, 0, 0.7),
    (8.1, L / "delta.mp4", 0.2, 1.2),      # «en un río»
    (9.3, L / "rayo.mp4", 0.0, 2.0),       # «en un rayo» (the flash lands on the word)
    (11.3, L / "arbol.mp4", 0.0, 2.0),     # «en las ramas de un árbol»
    (13.3, L / "corazon.mp4", 0.0, 2.0),   # «en el ritmo de un corazón»
    (15.3, None, 0, 3.7),
    (19.0, L / "nace.mp4", 0.4, 3.6),      # the set is born out of the dark
    (22.6, L / "descenso.mp4", 0.0, 5.4),  # the dive
    (28.0, None, 0, 0.6),
    (28.6, L / "ojo.mp4", 0.4, 5.8),       # an iris forms around the dark
    (34.4, None, 0, 0.6),
]
# the voice: (line number in src/trailer_voz.json, start)
VOZ = [(9, 2.6), (10, 7.8), (11, 15.8), (12, 19.4), (13, 28.8)]
HIPER = 35.0                               # the hypercut of v1 (its picture and sound) from here


def extrae(nombre, fuente, t_src, dur, t_dest):
    n = round((t_dest + dur) * FPS) - round(t_dest * FPS)
    out = PARTES / f"{nombre}-{n}-{t_src:.2f}.mp4"
    if out.exists(): return out
    if fuente is None:
        cmd = ["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "color=c=0x020306:s=1920x1080:r=30", "-frames:v", str(n)]
    else:
        cmd = ["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{t_src:.3f}", "-i", str(fuente), "-frames:v", str(n), "-an"]
    subprocess.run(cmd + ["-vf", f"fps={FPS},format=yuv420p", "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-profile:v", "high", str(out)], check=True)
    return out


def imagen():
    PARTES.mkdir(exist_ok=True)
    lista = [extrae(f"p{i:02d}", f, s, d, a) for i, (a, f, s, d) in enumerate(PLANOS)]
    v1 = json.loads((AQUI / "plan.json").read_text())["hiper"]
    for j, (a, s, d) in enumerate(v1):
        a2 = a - 100.0 + HIPER
        if PREVIA and a2 >= DUR: break
        dd = min(d, DUR - a2) if PREVIA else d
        lista.append(extrae(f"h{j:03d}", FILM, s, dd, a2))
    (AQUI / "lista2.txt").write_text("".join(f"file '{p}'\n" for p in lista))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(AQUI / "lista2.txt"), "-c", "copy", str(AQUI / "video2.mp4")], check=True)


def pulso(f, dur=0.8):
    t = t_(int(dur * SR)); env = (1 - np.exp(-t * 400)) * np.exp(-t * 6)
    return env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.6 * np.sin(np.pi * f * t))


def mp3(ruta):
    out = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(ruta), "-ac", "2", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(out, np.int16).reshape(-1, 2).astype(float) / 32767


def sonido():
    N = int(DUR * SR); m = np.zeros((N, 2))
    # the opening: a low swell in the dark, one real heartbeat with the light, a braam for every world
    poner(m, 0.0, sub(26, 35.0, ataque=2.5, sat=0.6), 0.16)
    w = wave.open(str(ANI / "public/audio/corazon.wav")); cor = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, w.getnchannels()).astype(float) / 32767
    on = json.loads((ANI / "public/audio/latidos_audio.json").read_text())
    i0 = int(on[30] * SR) - int(0.05 * SR); uno = cor[i0:i0 + int(0.9 * SR)] * np.linspace(1, 0, int(0.9 * SR))[:, None] ** 0.6
    poner(m, 2.2, con_reverb(uno, SALA_C, 0.3), 1.0)
    for x, br, vol in [(5.5, [26, 38, 45], 0.85), (19.0, [26, 33, 38, 45], 1.0), (28.0, [33, 45, 50], 0.7)]:
        poner(m, x, con_reverb(braam(br, 6.0, ataque=0.01, abre=1.3, brillo=1.2), SALA, 0.55), vol)
        poner(m, x, bombo(1.6), 0.95)
    for x, n_ in [(8.1, 57), (9.3, 62), (11.3, 66), (13.3, 69)]:                  # a tuned hit on every word
        poner(m, x, con_reverb(pulso(hz(n_), 1.4), SALA, 0.5), 0.3); poner(m, x, bombo(0.8), 0.45)
    poner(m, 9.83, con_reverb(braam([26, 38], 2.0, ataque=0.003, abre=0.6, brillo=1.5), SALA, 0.4), 0.5)   # the lightning
    poner(m, 15.6, con_reverb(voz([(62, 3.0), (66, 3.0)], "o", vib=2.5), SALA, 0.7), 0.12)
    poner(m, 22.6, con_reverb(voz([(66, 3.0), (69, 3.0), (74, 4.0)], "a", vib=4.0), SALA, 0.7), 0.18)
    poner(m, 29.0, con_reverb(voz([(57, 3.0), (62, 4.0)], "o", vib=2.5), SALA, 0.7), 0.12)
    poner(m, 30.4, oleaje(4.0), 0.55)
    tt = np.arange(N) / SR
    m[(tt > 34.4) & (tt < 35.0)] = 0.0                                                # half a second of silence: the drop
    # the voice, the score ducked under it
    V = json.loads((ANI / "src/trailer_voz.json").read_text()); voces = np.zeros((N, 2)); duck = np.ones(N)
    for k, t0 in VOZ:
        poner(voces, t0, mp3(ANI / f"public/voz/trailer/{k}.mp3"), 1.0)
        duck -= 0.45 * np.clip(np.minimum((tt - t0 + 0.3) / 0.3, (t0 + V[k - 1]["fin"] + 0.4 - tt) / 0.5), 0, 1)
    m *= np.clip(duck, 0.5, 1)[:, None]
    m = m / max(1e-9, np.abs(m).max()) * 0.85 + voces * 0.95
    # the hypercut's own sound (v1 mix, 100 s →) from HIPER on
    w = wave.open(str(AQUI / "audio.wav")); v1 = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2).astype(float) / 32767
    tramo = v1[int(100.0 * SR):int((100.0 + DUR - HIPER) * SR)]
    poner(m, HIPER, tramo, 1.0)
    m = m / max(1e-9, np.abs(m).max()) * 0.9
    with wave.open(str(AQUI / "audio2.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(m, -1, 1) * 32767).astype("<i2").tobytes())
    return V


def subtitulos(V):
    cues = [[round(t0, 2), round(t0 + V[k - 1]["fin"] + 0.25, 2), V[k - 1]["texto"]] for k, t0 in VOZ]
    (AQUI / "subs2.json").write_text(json.dumps({"cues": cues, "dur": DUR}, ensure_ascii=False))
    srt = []
    f = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round((x % 1) * 1000)):03d}"
    for i, (a, b, txt) in enumerate(cues, 1): srt.append(f"{i}\n{f(a)} --> {f(b)}\n{txt}\n")
    (AQUI / "trailer2.srt").write_text("\n".join(srt))
    subprocess.run(["npx", "remotion", "render", "src/index.ts", "SubsTrailer", str(AQUI / "subs2.mov"), f"--props={AQUI / 'subs2.json'}",
                    "--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png", "--log=error"], cwd=ANI, check=True)


if __name__ == "__main__":
    imagen(); V = sonido(); subtitulos(V)
    out = Path.home() / "Development/BN_Videos/entregables/La-frontera/Trailer" / ("La-frontera-trailer-v2-previa.mp4" if PREVIA else "La-frontera-trailer-v2.mp4")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(AQUI / "video2.mp4"), "-i", str(AQUI / "subs2.mov"), "-i", str(AQUI / "audio2.wav"),
                    "-filter_complex", "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v]", "-map", "[v]", "-map", "2:a",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(out)], check=True)
    print("listo", out)
