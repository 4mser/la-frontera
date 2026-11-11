"""LA FRONTERA · trailer v4: the opening is one unbroken dive (herramientas/apertura_trailer.py: from the cosmic web to
the quantum foam, every world growing out of the last at one shared zoom rate), with a hit on every world; then one
clean shot per word on straight cuts; the hypercut with its shots chosen again (elige4.py: still, never two alike);
the flower that becomes a fractal; the title; and the card and the mark on one and the same background
(CartelTrailer → partes/cierre.mp4). Subtitles animated word by word, and an .srt for YouTube.

usage: PYTHONPATH=../animatic/pylib python3 arma_trailer4.py
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

AQUI = Path(__file__).resolve().parent
ANI = AQUI.parent / "animatic"
sys.path.insert(0, str(ANI / "audio")); sys.path.insert(0, str(AQUI))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, hz, oleaje, poner, sub, voz  # noqa: E402
from arma_trailer3 import FILM, L, leer, pulso, rampa, shepard, nframes  # noqa: E402

PARTES = AQUI / "partes4"; FPS = 30
G = 519 / 30                                     # the opening's own length (17.3 s)
D = G - 4.4                                      # everything after the opening moves by this much (v3 → v4)
HIPER = 40.5 + D
CIERRE_T = 84.0 + D
DUR = CIERRE_T + 533 / 30
MUNDOS = [1.61, 2.31, 3.47, 4.15, 5.39, 6.2, 6.77, 7.44, 8.36, 9.33, 10.1, 10.8, 11.64, 12.17, 13.31, 14.39, 15.3]   # each world's arrival
PLANOS = [
    (0.0, L / "apertura.mp4", 0.0, G),
    (G, None, 0, 0.88),
    (5.28 + D, L / "viaje.mp4", 27.5, 1.16),     # «una costa»
    (6.44 + D, AQUI.parent / "material-prologo/epilogo/pexels-11025478-rayos.mp4", 7.25, 1.22),   # «un rayo»: the bolt strikes on the word
    (7.66 + D, L / "arbol.mp4", 0.0, 1.87),      # «las ramas de un árbol»
    (9.53 + D, L / "retina.mp4", 3.0, 2.07),     # «los vasos de tus propios ojos»
    (11.6 + D, L / "koch.mp4", 0.4, 4.3),        # «todos repiten su forma, escala tras escala»
    (15.9 + D, None, 0, 2.34),
    (18.24 + D, L / "nace.mp4", 0.4, 3.06),      # «una regla»
    (21.3 + D, L / "descenso.mp4", 0.0, 5.6),    # «repítela»
    (26.9 + D, L / "copia.mp4", 0.0, 7.7),       # «…la misma forma, completa»
    (34.6 + D, None, 0, 0.4),
    (35.0 + D, L / "ojo.mp4", 0.4, 5.0),         # «entonces, ¿qué es la realidad?»
    (40.0 + D, None, 0, 0.5),
]
CIERRE = [
    (65.5 + D, L / "flor.mp4", 0.0, 10.5),
    (76.0 + D, FILM, 3737.34, 8.0),              # the title
    (CIERRE_T, AQUI / "partes" / "cierre.mp4", 0.0, 533 / 30),   # the card, then the mark, on one background
]
VOZ = [(14, 12.2), (15, 4.95 + D), (16, 12.0 + D), (17, 16.3 + D), (18, 21.5 + D), (19, 27.75 + D), (20, 35.2 + D), (21, 67.0 + D)]
LOGO_FILM = 3811.31                              # the film's sound of the mark, from the first circle


def parte(nombre, fuente, s, d, a):
    n = nframes(a, d); out = PARTES / f"{nombre}-{n}-{s:.2f}.mp4"
    if out.exists(): return out
    if fuente is None: cmd = ["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "color=c=0x020306:s=1920x1080:r=30", "-frames:v", str(n)]
    else: cmd = ["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{s:.3f}", "-i", str(fuente), "-frames:v", str(n), "-an"]
    subprocess.run(cmd + ["-vf", f"fps={FPS},format=yuv420p", "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-profile:v", "high", str(out)], check=True)
    return out


def imagen():
    PARTES.mkdir(exist_ok=True)
    lista = [parte(f"p{i:02d}", f, s, d, a) for i, (a, f, s, d) in enumerate(PLANOS)]
    for j, (a, s, d) in enumerate(json.loads((AQUI / "hiper4.json").read_text())):
        lista.append(parte(f"h{j:03d}", FILM, s, d, a - 100.0 + HIPER))
    lista += [parte(f"c{i:02d}", f, s, d, a) for i, (a, f, s, d) in enumerate(CIERRE)]
    (AQUI / "lista4.txt").write_text("".join(f"file '{p}'\n" for p in lista))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(AQUI / "lista4.txt"), "-c", "copy", str(AQUI / "video4.mp4")], check=True)


def sonido():
    N = int(DUR * SR); m = np.zeros((N, 2)); tt = np.arange(N) / SR
    def B(t, notas, dur, vol, ataque=0.01, abre=1.3, brillo=1.2): poner(m, t, con_reverb(braam(notas, dur, ataque=ataque, abre=abre, brillo=brillo), SALA, 0.55), vol)
    def P(t, n_, vol=0.3, dur=1.4): poner(m, t, con_reverb(pulso(hz(n_), dur), SALA, 0.5), vol)
    # ── the dive: a swell out of the dark, a tone that never stops climbing, a tuned hit on every world, and the
    # hits getting closer and louder as the worlds come faster; a white flash and the biggest hit of all at the end
    poner(m, 0.0, sub(26, G + 1.0, ataque=1.2, sat=0.7), 0.16)
    B(0.15, [26, 33, 38, 45], 5.0, 0.8, ataque=0.4, abre=1.6)
    poner(m, 0.15, con_reverb(voz([(50, 4.0), (57, 4.0), (62, 5.0)], "o", vib=2.5), SALA, 0.7), 0.1)
    poner(m, 0.5, con_reverb(shepard(G - 0.5, sube=1 / 4.5, suelta=0.05), SALA, 0.45), 0.42)
    escala = [50, 53, 57, 60, 62, 65, 69, 72, 74, 77, 81, 84, 86, 89, 93, 96, 98]
    for k, x in enumerate(MUNDOS):
        u = k / (len(MUNDOS) - 1)
        P(x, escala[k] - 12, 0.16 + 0.14 * u, 1.2); poner(m, x, bombo(0.7 + 0.5 * u), 0.35 + 0.45 * u)
        if k in (3, 7, 12, 15): B(x, [26, 38, 45] if k % 2 else [33, 45, 50], 3.0, 0.45 + 0.2 * u, ataque=0.02)
    poner(m, 9.4, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 4.0)], "a", vib=4.0), SALA, 0.7), 0.16)
    poner(m, G - 1.6, oleaje(1.6), 0.5)
    B(G, [26, 33, 38, 45, 50], 7.0, 1.0, ataque=0.004, abre=1.6, brillo=1.3); poner(m, G, bombo(2.2), 1.0)
    # ── the words (as v3, after the opening): one tuned hit per shot, the lightning on its flash ──
    for x, n_ in [(5.28, 57), (6.44, 62), (7.66, 66), (9.53, 69)]:
        P(x + D, n_); poner(m, x + D, bombo(0.8), 0.5)
    B(6.54 + D, [26, 38], 2.0, 0.55, ataque=0.003, abre=0.6, brillo=1.5)
    B(11.6 + D, [33, 45, 50], 5.0, 0.6, ataque=0.05)
    for k in range(5): P(11.75 + D + k * 0.85, [62, 66, 69, 74, 78][k], 0.2, 1.0)
    poner(m, 16.0 + D, con_reverb(voz([(50, 2.0), (54, 2.2)], "o", vib=2.0), SALA, 0.7), 0.12)
    B(18.24 + D, [26, 33, 38, 45], 8.0, 1.0); poner(m, 18.24 + D, bombo(1.8), 1.0)
    poner(m, 21.3 + D, con_reverb(voz([(62, 2.5), (66, 2.5), (69, 3.0)], "a", vib=4.0), SALA, 0.7), 0.2)
    poner(m, 21.3 + D, con_reverb(shepard(10.5, sube=1 / 6, suelta=1.5), SALA, 0.5), 0.4)
    B(31.74 + D, [26, 38, 45, 50], 7.0, 0.8, ataque=0.3, abre=2.0)
    poner(m, 31.74 + D, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 2.0), (74, 3.0)], "a", vib=4.5), SALA, 0.7), 0.24)
    poner(m, 34.6 + D, bombo(1.4), 0.8)
    w = wave.open(str(ANI / "public/audio/corazon.wav")); cor = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, w.getnchannels()).astype(float) / 32767
    on = json.loads((ANI / "public/audio/latidos_audio.json").read_text()); i0 = int(on[30] * SR) - int(0.05 * SR)
    uno = cor[i0:i0 + int(0.9 * SR)] * np.linspace(1, 0, int(0.9 * SR))[:, None] ** 0.6
    poner(m, 38.0 + D, con_reverb(uno, SALA_C, 0.3), 1.0)
    poner(m, 36.5 + D, oleaje(3.5), 0.55)
    poner(m, 65.5 + D, sub(26, 11.0, ataque=1.0, sat=0.6), 0.14)
    poner(m, 66.0 + D, con_reverb(voz([(62, 4.0), (66, 4.0), (69, 4.0)], "a", vib=3.5), SALA, 0.7), 0.18)
    poner(m, 71.5 + D, con_reverb(shepard(4.5, sube=1 / 3, suelta=0.05), SALA, 0.4), 0.45)
    poner(m, 72.0 + D, oleaje(4.0), 0.55)
    m[(tt > 40.0 + D) & (tt < HIPER + 25.0)] = 0.0
    m[tt >= 76.0 + D] = 0.0
    V = json.loads((ANI / "src/trailer_voz.json").read_text()); voces = np.zeros((N, 2)); duck = np.ones(N)
    for k, t0 in VOZ:
        poner(voces, t0, leer(ANI / f"public/voz/trailer/{k}.mp3"), 1.0)
        duck -= 0.45 * np.clip(np.minimum((tt - t0 + 0.3) / 0.3, (t0 + V[k - 1]["fin"] + 0.4 - tt) / 0.5), 0, 1)
    m *= np.clip(duck, 0.5, 1)[:, None]
    m = m / max(1e-9, np.abs(m).max()) * 0.85
    # the hypercut's own sound (v1: 120 BPM, the cuts on its beats); the title's and the mark's from the film
    v1w = wave.open(str(AQUI / "audio.wav")); v1 = np.frombuffer(v1w.readframes(v1w.getnframes()), np.int16).reshape(-1, 2).astype(float) / 32767
    poner(m, HIPER, rampa(v1[int(100.0 * SR):int(125.8 * SR)], 0, 0.6), 1.0)
    poner(m, 76.0 + D, rampa(leer(FILM, 3737.34, 12.0), 0.05, 0.8), 1.0)
    poner(m, CIERRE_T + 4.0, rampa(leer(FILM, LOGO_FILM, DUR - CIERRE_T - 4.0), 0.2, 2.0), 1.0)
    m = m + voces * 0.95
    m = m / max(1e-9, np.abs(m).max()) * 0.9
    with wave.open(str(AQUI / "audio4.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(m, -1, 1) * 32767).astype("<i2").tobytes())
    return V


def subtitulos(V):
    cues = []
    for k, t0 in VOZ:
        v = V[k - 1]; toks = v["texto"].split(); pal = v["palabras"]
        ws = [[toks[i], round(t0 + pal[i][1], 3)] for i in range(len(pal))] if len(toks) == len(pal) else [[w_, round(t0 + tw, 3)] for w_, tw in pal]
        cues.append([round(t0, 2), round(t0 + v["fin"] + 0.6, 2), ws])
    (AQUI / "subs4.json").write_text(json.dumps({"cues": cues, "dur": DUR}, ensure_ascii=False))
    f = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round((x % 1) * 1000)):03d}"
    (AQUI / "trailer4.srt").write_text("\n".join(f"{i}\n{f(a)} --> {f(b)}\n{V[k - 1]['texto']}\n" for i, ((a, b, _), (k, _t)) in enumerate(zip(cues, VOZ), 1)))
    subprocess.run(["npx", "remotion", "render", "src/index.ts", "SubsTrailer", str(AQUI / "subs4.mov"), f"--props={AQUI / 'subs4.json'}",
                    "--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png", "--log=error"], cwd=ANI, check=True)


if __name__ == "__main__":
    imagen(); V = sonido(); subtitulos(V)
    out = Path.home() / "Development/BN_Videos/entregables/La-frontera/Trailer/La-frontera-trailer-v4.mp4"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(AQUI / "video4.mp4"), "-i", str(AQUI / "subs4.mov"), "-i", str(AQUI / "audio4.wav"),
                    "-filter_complex", f"[0:v][1:v]overlay=0:0:format=auto,fade=t=out:st={DUR - 2.5:.2f}:d=2.5,format=yuv420p[v]", "-map", "[v]", "-map", "2:a",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(out)], check=True)
    import shutil; shutil.copy(AQUI / "trailer4.srt", out.with_suffix(".srt"))
    print("listo", out, round(DUR, 2), "s")
