"""LA FRONTERA · trailer v3 (complete): a hyper-zoom hook; one clean shot per word; fractal transitions (the next shot
opens through a growing Julia set); the rule, the dive, the copy at ×10⁵⁶; «¿qué es la realidad?»; silence; the
hypercut of v1 (approved); a flower that becomes a fractal; the title, the card and the mark with the film's own sound.
Subtitles animated word by word (SubsTrailer), and an .srt for YouTube.

usage: PYTHONPATH=../animatic/pylib python3 arma_trailer3.py
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np
from PIL import Image

AQUI = Path(__file__).resolve().parent
ANI = AQUI.parent / "animatic"
sys.path.insert(0, str(ANI / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, hz, oleaje, poner, sub, t_, voz  # noqa: E402

FILM = Path.home() / "Development/BN_Videos/entregables/La-frontera/Corrido/La-frontera-corrido-v6.mp4"
L = AQUI / "limpios"; PARTES = AQUI / "partes3"; FPS = 30; W, H = 1920, 1080
DUR = 101.0
HIPER = 40.5
# picture: (start, source, source start, duration, transition in: None | "julia")
PLANOS = [
    (0.0, "gancho", 0, 4.4, None),
    (4.4, None, 0, 0.88, None),
    (5.28, L / "viaje.mp4", 27.5, 1.16, None),        # «una costa»
    (6.44, L / "rayo.mp4", 0.43, 1.22, None),      # «un rayo» (the flash on the word)
    (7.66, L / "arbol.mp4", 0.0, 1.87, None),      # «las ramas de un árbol»
    (9.53, L / "retina.mp4", 3.0, 2.07, None),     # «los vasos de tus propios ojos»
    (11.6, L / "koch.mp4", 0.4, 4.3, None),        # «todos repiten su forma, escala tras escala»
    (15.9, None, 0, 2.34, None),
    (18.24, L / "nace.mp4", 0.4, 3.06, None),         # «una regla»: the set is born out of the dark
    (21.3, L / "descenso.mp4", 0.0, 5.6, None),    # «repítela»
    (26.9, L / "copia.mp4", 0.0, 7.7, None),          # «…la misma forma, completa»
    (34.6, None, 0, 0.4, None),
    (35.0, L / "ojo.mp4", 0.4, 5.0, None),            # «entonces, ¿qué es la realidad?»
    (40.0, None, 0, 0.5, None),                       # silence: the drop
]
CIERRE = [
    (65.5, L / "flor.mp4", 0.0, 10.5, None),          # «un viaje hasta el borde de lo que podemos conocer»
    (76.0, FILM, 3737.34, 8.0, None),                 # the title
    (84.0, AQUI / "partes" / "cartel.mp4", 0.0, 4.0, None),
    (88.0, FILM, 3811.6, 13.0, None),                 # the mark
]
VOZ = [(14, 0.3), (15, 4.95), (16, 12.0), (17, 16.3), (18, 21.5), (19, 27.75), (20, 35.2), (21, 67.0)]


def nframes(a, d): return round((a + d) * FPS) - round(a * FPS)


def x264(): return ["-vf", f"fps={FPS},format=yuv420p", "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-profile:v", "high"]


def parte(nombre, fuente, s, d, a):
    n = nframes(a, d); out = PARTES / f"{nombre}-{n}-{s:.2f}.mp4"
    if out.exists(): return out
    if fuente is None:
        cmd = ["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "color=c=0x020306:s=1920x1080:r=30", "-frames:v", str(n)] + x264()
    elif fuente == "gancho":                     # the whole journey of chapter X in 4.4 s, with motion blur
        cmd = ["ffmpeg", "-loglevel", "error", "-y", "-i", str(L / "viaje.mp4"), "-vf", f"tmix=frames=7,setpts=PTS/10.2,fps={FPS},format=yuv420p", "-frames:v", str(n),
               "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-profile:v", "high"]
    else:
        cmd = ["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{s:.3f}", "-i", str(fuente), "-frames:v", str(n), "-an"] + x264()
    subprocess.run(cmd + [str(out)], check=True)
    return out


def mascara_julia(n, c=(-0.123, 0.745)):
    """a filled Julia set (the Douady rabbit) that grows from a point to beyond the frame: the transition's mask"""
    out = PARTES / f"mascara-{n}.mp4"
    if out.exists(): return out
    w, h = 960, 540
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    fr = []
    for k in range(n):
        u = (k + 1) / n; u = u * u * (3 - 2 * u)
        esc = 1.6 / (0.02 + 3.0 * u ** 1.6)
        zr = (xx - w / 2) / h * esc; zi = (yy - h / 2) / h * esc
        it = np.zeros_like(zr); viva = np.ones_like(zr, bool)
        for _ in range(60):
            zr2 = zr * zr - zi * zi + c[0]; zi = 2 * zr * zi + c[1]; zr = zr2
            fuera = (zr * zr + zi * zi) > 16
            it[viva & fuera] = _; viva &= ~fuera
        dentro = viva.astype(np.float32)
        borde = np.clip(1 - it / 22, 0, 1) * (~viva)                 # a soft glow just outside the set
        m = np.clip(dentro + 0.6 * borde ** 2, 0, 1)
        m = np.maximum(m, np.clip((u - 0.7) / 0.3, 0, 1) ** 1.5)          # ends fully open: no hard cut
        fr.append((m * 255).astype(np.uint8))
    p = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-",
                          "-vf", f"scale={W}:{H},format=yuv420p", "-c:v", "libx264", "-preset", "fast", "-crf", "12", str(out)], stdin=subprocess.PIPE)
    for f in fr: p.stdin.write(f.tobytes())
    p.stdin.close(); p.wait()
    return out


def con_transicion(i, prev, cur, d_t=0.3):
    """the cut at cur's start: for d_t seconds, cur shows through a growing Julia set over the end of prev"""
    a0, f0, s0, d0, _ = prev; a1, f1, s1, d1, _ = cur
    n = nframes(a1, d_t)
    A = parte(f"tA{i:02d}", f0, s0 + d0, d_t, a1) if f0 not in (None, "gancho") else parte(f"tA{i:02d}", None, 0, d_t, a1)
    B = parte(f"tB{i:02d}", f1, s1, d_t, a1)
    M = mascara_julia(n)
    out = PARTES / f"t{i:02d}-{n}.mp4"
    if not out.exists():
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(A), "-i", str(B), "-i", str(M), "-filter_complex",
                        "[0:v]format=yuv420p[a];[1:v]format=yuv420p[b];[2:v]format=gray,scale=1920:1080[m];[a][b][m]maskedmerge,format=yuv420p[v]",
                        "-map", "[v]", "-frames:v", str(n)] + ["-c:v", "libx264", "-preset", "fast", "-crf", "16", "-profile:v", "high", str(out)], check=True)
    resto = parte(f"p{i:02d}", f1, s1 + d_t, d1 - d_t, a1 + d_t)
    return [out, resto]


def imagen():
    PARTES.mkdir(exist_ok=True)
    lista = []
    for i, pl in enumerate(PLANOS):
        a, f, s, d, tr = pl
        if tr == "julia": lista += con_transicion(i, PLANOS[i - 1], pl)
        else: lista.append(parte(f"p{i:02d}", f, s, d, a))
    v1 = json.loads((AQUI / "plan.json").read_text())["hiper"]
    for j, (a, s, d) in enumerate(v1):
        lista.append(parte(f"h{j:03d}", FILM, s, d, a - 100.0 + HIPER))
    for i, (a, f, s, d, _) in enumerate(CIERRE):
        lista.append(parte(f"c{i:02d}", f, s, d, a))
    (AQUI / "lista3.txt").write_text("".join(f"file '{p}'\n" for p in lista))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(AQUI / "lista3.txt"), "-c", "copy", str(AQUI / "video3.mp4")], check=True)


def pulso(f, dur=0.8):
    t = t_(int(dur * SR)); env = (1 - np.exp(-t * 400)) * np.exp(-t * 6)
    return env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.6 * np.sin(np.pi * f * t))


def shepard(dur, sube=1 / 9, f0=55.0, n=8, centro=440.0, suelta=0.3):
    k = int(dur * SR); t = np.arange(k) / SR; x = np.zeros(k)
    for i in range(n):
        pos = (i + sube * t) % n; f = f0 * 2 ** pos
        x += np.exp(-0.5 * (np.log2(f / centro) / 1.3) ** 2) * np.sin(2 * np.pi * np.cumsum(f) / SR)
    return x / n * np.minimum(1, t / 0.6) * np.clip((dur - t) / suelta, 0, 1)


def leer(ruta, t0=None, dur=None):
    cmd = ["ffmpeg", "-loglevel", "error"] + (["-ss", f"{t0:.3f}"] if t0 is not None else []) + ["-i", str(ruta)] + (["-t", f"{dur:.3f}"] if dur else []) + ["-vn", "-ac", "2", "-ar", str(SR), "-f", "s16le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.int16).reshape(-1, 2).astype(float) / 32767


def rampa(x, ent=0.0, sal=0.0):
    g = np.ones(len(x))
    if ent: g[:int(ent * SR)] = np.linspace(0, 1, int(ent * SR))
    if sal: g[len(x) - int(sal * SR):] = np.minimum(g[len(x) - int(sal * SR):], np.linspace(1, 0, int(sal * SR)))
    return x * g[:, None]


def sonido():
    N = int(DUR * SR); m = np.zeros((N, 2)); tt = np.arange(N) / SR
    def B(t, notas, dur, vol, ataque=0.01, abre=1.3, brillo=1.2): poner(m, t, con_reverb(braam(notas, dur, ataque=ataque, abre=abre, brillo=brillo), SALA, 0.55), vol)
    def P(t, n_, vol=0.3, dur=1.4): poner(m, t, con_reverb(pulso(hz(n_), dur), SALA, 0.5), vol)
    # the hook: a huge hit on frame 0, a tone that climbs with the zoom, a stop when it lands
    B(0.0, [26, 33, 38, 45, 50], 6.0, 1.0); poner(m, 0.0, bombo(2.0), 1.0)
    poner(m, 0.0, con_reverb(shepard(4.4, sube=1 / 1.6, suelta=0.08), SALA, 0.4), 0.55)
    poner(m, 0.0, sub(26, 40.0, ataque=0.5, sat=0.7), 0.15)
    poner(m, 4.4, bombo(1.2), 0.8)
    # one tuned hit per word; the lightning cracks on its flash
    for x, n_ in [(5.28, 57), (6.44, 62), (7.66, 66), (9.53, 69)]:
        P(x, n_); poner(m, x, bombo(0.8), 0.5)
    B(6.54, [26, 38], 2.0, 0.55, ataque=0.003, abre=0.6, brillo=1.5)
    # Koch: a pulse per level, climbing
    B(11.6, [33, 45, 50], 5.0, 0.6, ataque=0.05)
    for k in range(5): P(11.75 + k * 0.85, [62, 66, 69, 74, 78][k], 0.2, 1.0)
    # the rule: the hit on «regla»; the dive: a voice and a tone that rises; the copy: a chord
    poner(m, 16.0, con_reverb(voz([(50, 2.0), (54, 2.2)], "o", vib=2.0), SALA, 0.7), 0.12)
    B(18.24, [26, 33, 38, 45], 8.0, 1.0); poner(m, 18.24, bombo(1.8), 1.0)
    poner(m, 21.3, con_reverb(voz([(62, 2.5), (66, 2.5), (69, 3.0)], "a", vib=4.0), SALA, 0.7), 0.2)
    poner(m, 21.3, con_reverb(shepard(10.5, sube=1 / 6, suelta=1.5), SALA, 0.5), 0.4)
    B(31.74, [26, 38, 45, 50], 7.0, 0.8, ataque=0.3, abre=2.0)
    poner(m, 31.74, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 2.0), (74, 3.0)], "a", vib=4.5), SALA, 0.7), 0.24)
    poner(m, 34.6, bombo(1.4), 0.8)
    # the question: one real heartbeat; a swell; silence
    w = wave.open(str(ANI / "public/audio/corazon.wav")); cor = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, w.getnchannels()).astype(float) / 32767
    on = json.loads((ANI / "public/audio/latidos_audio.json").read_text()); i0 = int(on[30] * SR) - int(0.05 * SR)
    uno = cor[i0:i0 + int(0.9 * SR)] * np.linspace(1, 0, int(0.9 * SR))[:, None] ** 0.6
    poner(m, 38.0, con_reverb(uno, SALA_C, 0.3), 1.0)
    poner(m, 36.5, oleaje(3.5), 0.55)
    # after the hypercut: a soft pad and the voice; a rise into the title (whose own sound comes from the film)
    poner(m, 65.5, sub(26, 11.0, ataque=1.0, sat=0.6), 0.14)
    poner(m, 66.0, con_reverb(voz([(62, 4.0), (66, 4.0), (69, 4.0)], "a", vib=3.5), SALA, 0.7), 0.18)
    poner(m, 71.5, con_reverb(shepard(4.5, sube=1 / 3, suelta=0.05), SALA, 0.4), 0.45)
    poner(m, 72.0, oleaje(4.0), 0.55)
    m[((tt > 40.0) & (tt < 40.5))] = 0.0
    m[(tt >= 40.5) & (tt < 65.5)] = 0.0
    m[tt >= 76.0] = 0.0
    # the voice, the score ducked under it
    V = json.loads((ANI / "src/trailer_voz.json").read_text()); voces = np.zeros((N, 2)); duck = np.ones(N)
    for k, t0 in VOZ:
        poner(voces, t0, leer(ANI / f"public/voz/trailer/{k}.mp3"), 1.0)
        duck -= 0.45 * np.clip(np.minimum((tt - t0 + 0.3) / 0.3, (t0 + V[k - 1]["fin"] + 0.4 - tt) / 0.5), 0, 1)
    m *= np.clip(duck, 0.5, 1)[:, None]
    m = m / max(1e-9, np.abs(m).max()) * 0.85
    # the hypercut's own sound (v1), the title and the mark (the film)
    v1w = wave.open(str(AQUI / "audio.wav")); v1 = np.frombuffer(v1w.readframes(v1w.getnframes()), np.int16).reshape(-1, 2).astype(float) / 32767
    poner(m, HIPER, rampa(v1[int(100.0 * SR):int(125.8 * SR)], 0, 0.6), 1.0)
    poner(m, 76.0, rampa(leer(FILM, 3737.34, 12.0), 0.05, 0.8), 1.0)
    poner(m, 88.0, rampa(leer(FILM, 3811.6, 13.0), 0.3, 2.0), 1.0)
    m = m + voces * 0.95
    m = m / max(1e-9, np.abs(m).max()) * 0.9
    with wave.open(str(AQUI / "audio3.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(m, -1, 1) * 32767).astype("<i2").tobytes())
    return V


def subtitulos(V):
    cues = []
    for k, t0 in VOZ:
        v = V[k - 1]; toks = v["texto"].split(); pal = v["palabras"]
        ws = [[toks[i], round(t0 + pal[i][1], 3)] for i in range(len(pal))] if len(toks) == len(pal) else [[w, round(t0 + tw, 3)] for w, tw in pal]
        cues.append([round(t0, 2), round(t0 + v["fin"] + 0.6, 2), ws])
    (AQUI / "subs3.json").write_text(json.dumps({"cues": cues, "dur": DUR}, ensure_ascii=False))
    f = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round((x % 1) * 1000)):03d}"
    (AQUI / "trailer3.srt").write_text("\n".join(f"{i}\n{f(a)} --> {f(b)}\n{V[k - 1]['texto']}\n" for i, ((a, b, _), (k, _t)) in enumerate(zip(cues, VOZ), 1)))
    subprocess.run(["npx", "remotion", "render", "src/index.ts", "SubsTrailer", str(AQUI / "subs3.mov"), f"--props={AQUI / 'subs3.json'}",
                    "--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png", "--log=error"], cwd=ANI, check=True)


if __name__ == "__main__":
    imagen(); V = sonido(); subtitulos(V)
    out = Path.home() / "Development/BN_Videos/entregables/La-frontera/Trailer/La-frontera-trailer-v3.mp4"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(AQUI / "video3.mp4"), "-i", str(AQUI / "subs3.mov"), "-i", str(AQUI / "audio3.wav"),
                    "-filter_complex", f"[0:v][1:v]overlay=0:0:format=auto,fade=t=out:st={DUR - 2}:d=2,format=yuv420p[v]", "-map", "[v]", "-map", "2:a",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(out)], check=True)
    import shutil; shutil.copy(AQUI / "trailer3.srt", out.with_suffix(".srt"))
    print("listo", out)
