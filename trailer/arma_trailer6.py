"""LA FRONTERA · trailer v6, the arc «three truths»:

  0.25  HOOK: out of black, the copy at ×10⁵⁶ bursts onto the screen (a flash, a hit), 2 s; a dry hit to black
  2.75  the dive (cosmos → quantum foam), «Si te acercas lo suficiente…»
 20.05  ┃ TODO TIENE UNA FORMA ┃   then the moving shots: coast, lightning, crowns → Sierpiński, vessels, Koch
 38.95  ┃ LA FORMA TIENE UNA REGLA ┃   then the one shot: Julia → Mandelbrot → the dive → the copy → the iris
 64.90  ┃ LA REGLA NO TIENE FIN ┃   then the hypercut, clean, matched on shape (hiper6.py)
 92.30  near silence: ┃ ¿HASTA DÓNDE LLEGA UNA FORMA? ┃ (and the voice)
 95.30  the flower → the title → ESTRENO 7 DE NOVIEMBRE → the mark, on one background

Every shot is laid on an absolute timeline (layers over black, each fading in over the one below), so no dissolve
moves anything. One score from the first frame to the last. Subtitles word by word (not over the intertitles).

usage: PYTHONPATH=../animatic/pylib python3 arma_trailer6.py [imagen sonido subs mezcla]
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

AQUI = Path(__file__).resolve().parent
ANI = AQUI.parent / "animatic"
sys.path.insert(0, str(ANI / "audio")); sys.path.insert(0, str(AQUI))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, hz, oleaje, poner, sub, voz  # noqa: E402
from arma_trailer3 import L, pulso, shepard  # noqa: E402
import arma_trailer5 as V5  # noqa: E402

FPS = 30
P5, P6 = AQUI / "partes5", AQUI / "partes6"
G = V5.G                                           # the dive, 17.3 s
H0 = 2.75                                          # the dive starts here
I1 = H0 + G
DB = (I1 - 0.35 + 2.4 - 0.35) - (V5.T_COSTA - 0.5)   # the moving shots, v5 → v6 (the coast rises under the first intertitle's end)
I2, I3, I4 = V5.T_C + DB, 0.0, 0.0
DC = (I2 + 2.4) - V5.T_C                           # the one shot, v5 → v6
I3 = V5.C_FIN + DC
HIPER = I3 + 2.4
I4 = HIPER + 25.0
E0 = I4 + 3.0
DUR = E0 + V5.E_LEN

VOZ = [(14, None, H0 + 12.3)] + [(k, p, t + DB) for k, p, t in V5.VOZ if k in (15, 16)] + \
      [(k, p, t + DC) for k, p, t in V5.VOZ if k in (17, 18, 19, 20)] + [(22, None, I4 + 0.35), (21, None, E0 + 3.2)]
SIN_SUBS = {22}                                    # the question is the intertitle itself


def tomas():
    """(start, file, source start, length, fade in): laid in this order, each one over the ones before"""
    T = [
        (0.25, L / "copia.mp4", 5.0, 2.0, 0.06),
        (H0, L / "apertura2.mp4", 0.0, G, 0.0),
        (I1 - 0.35, P6 / "i1.mp4", 0.0, 2.4, 0.35),
        (V5.T_COSTA - 0.5 + DB, P5 / "costa.mp4", 0.0, None, 0.4),
        (V5.T_RAYO + DB, P5 / "rayo.mp4", 0.0, None, V5.X),
        (V5.T_ARBOL + DB, P5 / "arbol.mp4", 0.0, None, V5.X),
        (V5.T_VASOS + DB, P5 / "vasos.mp4", 0.0, None, V5.X),
        (V5.T_KOCH + DB, P5 / "koch.mp4", 0.0, None, V5.X),
        (I2, P6 / "i2.mp4", 0.0, 2.4, 0.4),
        (I2 + 2.4, P5 / "central.mp4", 0.0, None, 0.4),
        (I3, P6 / "i3.mp4", 0.0, 2.4, 0.4),
        (HIPER, P6 / "hiper.mp4", 0.0, 25.0, 0.0),
        (I4, P6 / "i4.mp4", 0.0, 3.0, 0.0),
        (E0, P5 / "final.mp4", 0.0, None, 0.45),
    ]
    return T


def imagen():
    T = tomas()
    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i", f"color=c=0x020306:s=1920x1080:r={FPS}:d={DUR:.3f}"]
    fil = []
    for k, (a, f, s, d, x) in enumerate(T, 1):
        cmd += ["-ss", f"{s:.3f}"] + (["-t", f"{d:.3f}"] if d else []) + ["-i", str(f)]
        fade = f",fade=t=in:st=0:d={x:.3f}:alpha=1" if x > 0 else ""
        fil.append(f"[{k}:v]fps={FPS},format=yuva420p{fade},setpts=PTS-STARTPTS+{a:.4f}/TB[l{k}]")
    prev = "[0:v]"
    for k in range(1, len(T) + 1):
        fil.append(f"{prev}[l{k}]overlay=eof_action=pass:repeatlast=0[b{k}]"); prev = f"[b{k}]"
    # the hook's flash: white that falls away as the copy appears
    fil.append(f"color=c=0xFFF4E2:s=1920x1080:r={FPS}:d=0.6,format=yuva420p,fade=t=out:st=0:d=0.45:alpha=1,setpts=PTS-STARTPTS+0.25/TB[fl]")
    fil.append(f"{prev}[fl]overlay=eof_action=pass:repeatlast=0,trim=duration={DUR:.3f},format=yuv420p[v]")
    subprocess.run(cmd + ["-filter_complex", ";".join(fil), "-map", "[v]", "-c:v", "libx264", "-preset", "fast", "-crf", "14", "-pix_fmt", "yuv420p", "-r", str(FPS), str(AQUI / "video6.mp4")], check=True)


def sonido():
    N = int(DUR * SR); m = np.zeros((N, 2)); tt = np.arange(N) / SR
    def B(t, notas, dur, vol, ataque=0.01, abre=1.3, brillo=1.2): poner(m, t, con_reverb(braam(notas, dur, ataque=ataque, abre=abre, brillo=brillo), SALA, 0.55), vol)
    def P(t, n_, vol=0.3, dur=1.4, sala=SALA, mez=0.5): poner(m, t, con_reverb(pulso(hz(n_), dur), sala, mez), vol)
    def p2(t, nota, dur, vol): poner(m, t, con_reverb(pulso(hz(nota), dur), SALA_C, 0.4), vol)
    # the bed: one low D from the first frame to the last; it never stops, it swells and recedes with the acts
    cama = sub(26, DUR + 0.5, ataque=0.8, sat=0.65)[:N]
    env = np.interp(tt, [0, 0.3, 2.2, 2.8, H0 + 2, I1, I2, I3, HIPER, I4, I4 + 2.5, E0, E0 + V5.E_TIT, E0 + V5.E_CARTEL, DUR - 3, DUR],
                    [0.3, 1.0, 1.0, 0.35, 0.8, 1.0, 0.85, 0.9, 0.9, 0.45, 0.55, 0.8, 1.0, 0.7, 0.6, 0.0])
    cama = cama * (env[:len(cama), None] if cama.ndim == 2 else env[:len(cama)])
    poner(m, 0.0, cama if cama.ndim == 2 else np.stack([cama, cama], 1), 0.14)
    # ── HOOK: the hit as the copy bursts in; a dry hit as it goes, its tail left ringing in the dark
    B(0.25, [26, 33, 38, 45, 50], 5.0, 1.0, ataque=0.003, abre=1.8, brillo=1.35); poner(m, 0.25, bombo(2.2), 1.0)
    poner(m, 0.3, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 2.5)], "a", vib=4.5), SALA, 0.7), 0.18)
    poner(m, 2.25, bombo(1.6), 1.0); B(2.25, [26, 38], 2.5, 0.7, ataque=0.002, abre=0.5, brillo=1.5)
    m[(tt > 2.33) & (tt < 2.75)] *= np.linspace(1, 0.25, int(((tt > 2.33) & (tt < 2.75)).sum()))[:, None]
    # ── the dive: a tuned hit on every world, closer and louder; a tone that never stops rising; the flare
    lleg = [x + H0 for x in V5.llegadas()]
    B(H0 + 0.15, [26, 33, 38, 45], 5.0, 0.7, ataque=0.4, abre=1.6)
    poner(m, H0 + 0.5, con_reverb(shepard(G - 0.5, sube=1 / 4.5, suelta=0.05), SALA, 0.45), 0.4)
    escala = [50, 53, 57, 60, 62, 65, 69, 72, 74, 77, 81, 84, 86, 89, 93, 96, 98]
    for k, x in enumerate(lleg):
        u = k / max(1, len(lleg) - 1)
        P(x, escala[min(k, len(escala) - 1)] - 12, 0.16 + 0.14 * u, 1.2); poner(m, x, bombo(0.7 + 0.5 * u), 0.3 + 0.45 * u)
        if k in (3, 7, 11, 14): B(x, [26, 38, 45] if k % 2 else [33, 45, 50], 3.0, 0.45 + 0.2 * u, ataque=0.02)
    poner(m, H0 + 9.4, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 4.0)], "a", vib=4.0), SALA, 0.7), 0.16)
    poner(m, I1 - 1.6, oleaje(1.6), 0.5)
    # ── the three intertitles: each a great hit, a choir that opens, a low swell under the words
    for x in (I1, I2, I3):
        B(x, [26, 33, 38, 45, 50], 6.0, 1.0, ataque=0.005, abre=1.5, brillo=1.25); poner(m, x, bombo(2.0), 1.0)
        poner(m, x + 0.1, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 2.5)], "a", vib=4.0), SALA, 0.7), 0.2)
    poner(m, I2 - 1.8, con_reverb(shepard(1.8, sube=1 / 1.5, suelta=0.02), SALA, 0.4), 0.35)
    poner(m, I3 - 1.8, con_reverb(shepard(1.8, sube=1 / 1.5, suelta=0.02), SALA, 0.4), 0.35)
    # ── the moving shots
    tc = V5.T_COSTA - 0.5 + DB + 0.5
    poner(m, tc, con_reverb(voz([(57, 4.0), (62, 6.0), (66, 6.0)], "o", vib=2.5), SALA, 0.7), 0.12)
    for x, n_ in [(tc + 0.4, 57), (V5.T_RAYO + DB, 62), (V5.T_ARBOL + DB + 0.15, 66), (V5.T_VASOS + DB, 69), (V5.T_KOCH + DB, 74)]:
        P(x, n_, 0.26); poner(m, x, bombo(0.8), 0.42)
    B(20.8 + DB, [26, 38], 2.2, 0.6, ataque=0.003, abre=0.6, brillo=1.5); poner(m, 20.8 + DB, bombo(1.2), 0.7)
    for k in range(5): P(V5.T_KOCH + DB + 0.3 + k * 0.85, [62, 66, 69, 74, 78][k], 0.18, 1.0)
    # ── the one shot: the rule, the dive, the copy, the iris
    c = DC
    B(35.54 + c, [26, 33, 38, 45], 9.0, 1.0); poner(m, 35.54 + c, bombo(1.8), 1.0)
    poner(m, 35.7 + c, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 4.0)], "a", vib=4.0), SALA, 0.7), 0.16)
    poner(m, 38.4 + c, con_reverb(shepard(46.69 - 38.4, sube=1 / 2.6, suelta=0.05), SALA, 0.45), 0.5)
    for k in range(16): poner(m, 39.6 + c + k * 0.4, bombo(0.6), 0.25 + 0.03 * k)
    poner(m, 45.2 + c, oleaje(1.5), 0.55)
    B(46.69 + c, [26, 38, 45, 50], 8.0, 1.0, ataque=0.01, abre=2.0); poner(m, 46.69 + c, bombo(2.0), 1.0)
    poner(m, 46.8 + c, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 2.0), (74, 4.0)], "a", vib=4.5), SALA, 0.7), 0.24)
    poner(m, 49.0 + c, con_reverb(voz([(57, 3.0), (62, 3.0), (66, 4.0)], "o", vib=2.5), SALA, 0.7), 0.16)
    B(51.6 + c, [33, 45, 50, 57], 6.0, 0.5, ataque=1.2, abre=2.5, brillo=1.0)
    # ── the hypercut: 120 BPM, a boom on every beat, pulses climbing, a braam every two bars, the last 8 s in 16ths
    poner(m, I3 + 0.6, con_reverb(shepard(HIPER - I3 - 0.6, sube=1 / 1.2, suelta=0.02), SALA, 0.4), 0.45)
    for i in range(34):
        x = HIPER + i * 0.5
        poner(m, x, bombo(0.9 + 0.3 * (i % 4 == 0)), 0.55 + 0.25 * (i % 4 == 0))
        p2(x + 0.25, [50, 57, 62, 66, 69, 74][(i // 4) % 6], 0.6, 0.12)
        if i % 8 == 0: B(x, [26, 38, 45] if i % 16 == 0 else [33, 45, 50], 4.0, 0.5, ataque=0.02, abre=1.0, brillo=1.1)
    for i in range(32):
        x = HIPER + 17.0 + i * 0.25
        poner(m, x, bombo(0.7), 0.35 + 0.02 * i); p2(x, [62, 66, 69, 74, 78, 81, 86, 90][i // 4], 0.4, 0.1 + 0.004 * i)
    poner(m, HIPER + 17.0, con_reverb(shepard(8.0, sube=1 / 3, suelta=0.05), SALA, 0.4), 0.5)
    poner(m, HIPER + 17.0, oleaje(8.0), 0.55)
    # the hypercut ends on its biggest hit, and the question rises out of its tail
    B(I4, [26, 33, 38, 45, 50], 7.0, 1.0, ataque=0.004, abre=1.6, brillo=1.3); poner(m, I4, bombo(2.2), 1.0)
    poner(m, I4 + 0.8, con_reverb(voz([(50, 2.5), (57, 3.0)], "o", vib=2.0), SALA, 0.75), 0.1)
    # ── the end: the flower; the rise to the title; the title; the card on a slow pulse; the mark
    E = E0
    B(E, [26, 38, 45, 50], 9.0, 0.8, ataque=0.6, abre=2.0, brillo=1.1)
    poner(m, E + 0.6, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 4.0)], "a", vib=4.0), SALA, 0.7), 0.16)
    poner(m, E + 3.0, con_reverb(voz([(66, 4.0), (69, 4.0), (74, 6.0)], "a", vib=4.0), SALA, 0.7), 0.18)
    poner(m, E + V5.E_TIT - 6.0, con_reverb(shepard(6.0, sube=1 / 3, suelta=0.02), SALA, 0.45), 0.42)
    poner(m, E + V5.E_TIT - 4.0, oleaje(4.0), 0.6)
    B(E + V5.E_TIT, [26, 33, 38, 45, 50], 12.0, 1.0, ataque=0.01, abre=1.4, brillo=1.25); poner(m, E + V5.E_TIT, bombo(2.0), 1.0)
    poner(m, E + V5.E_TIT + 0.2, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 3.0), (74, 8.0)], "a", vib=4.5), SALA, 0.7), 0.3)
    for i in range(int((V5.E_SUELTA - 3.75 - V5.E_CARTEL) / 0.75)):
        x = E + V5.E_CARTEL - 1.0 + i * 0.75
        P(x, [50, 57, 62, 57, 50, 57, 63, 57][i % 8], 0.11, 1.2, SALA, 0.5)
        if i % 4 == 0: poner(m, x, bombo(0.8), 0.35)
    B(E + V5.E_CARTEL, [26, 38, 45], 6.0, 0.6, ataque=0.02, abre=1.4, brillo=1.1); poner(m, E + V5.E_CARTEL, bombo(1.6), 0.8)
    poner(m, E + V5.E_CARTEL, con_reverb(voz([(62, 5.0), (66, 5.0), (69, 6.0)], "a", vib=3.5), SALA, 0.7), 0.15)
    TS = E + V5.E_SUELTA
    poner(m, TS - 3.75, con_reverb(voz([(62, 2.0), (66, 2.0)], "o", vib=2.5), SALA, 0.7), 0.12)
    for i, x in enumerate([3.5 - 0.25 - (4 - j) * 0.125 for j in range(5)]): P(TS - 3.75 + x, [62, 66, 69, 74, 78][i], 0.12, 1.6, SALA, 0.6)
    B(TS, [26, 38, 45, 50], 8.0, 0.65, ataque=0.02, abre=1.6, brillo=1.1); poner(m, TS, bombo(1.4), 0.7)
    for x, n_ in [(1.7, 62), (2.25, 66), (2.8, 69)]: P(TS + x, n_, 0.28, 2.4, SALA, 0.6)
    poner(m, TS + 2.8, con_reverb(voz([(62, 2.5), (66, 2.5), (69, 3.0), (74, 9.0)], "a", vib=4.0), SALA, 0.7), 0.24)
    B(TS + 3.85, [38, 45, 50, 57], 10.0, 0.38, ataque=0.3, abre=3.0, brillo=1.0)
    # the voice, the score ducked under it
    voces = np.zeros((N, 2)); duck = np.ones(N)
    for k, pieza, t0 in VOZ:
        x = V5.trozo_voz(k, pieza); poner(voces, t0, x, 1.0); fin = t0 + len(x) / SR
        duck -= 0.45 * np.clip(np.minimum((tt - t0 + 0.3) / 0.3, (fin + 0.4 - tt) / 0.5), 0, 1)
    m *= np.clip(duck, 0.5, 1)[:, None]
    m *= np.clip((DUR - tt) / 3.0, 0, 1)[:, None]
    m = m / max(1e-9, np.abs(m).max()) * 0.85 + voces * 0.95
    m = m / max(1e-9, np.abs(m).max()) * 0.9
    with wave.open(str(AQUI / "audio6.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(m, -1, 1) * 32767).astype("<i2").tobytes())


def subtitulos():
    V = json.loads((ANI / "src/trailer_voz.json").read_text())
    cues = []
    for k, pieza, t0 in VOZ:
        if k in SIN_SUBS: continue
        v = V[k - 1]; toks = v["texto"].split(); pal = v["palabras"]
        a0, b0 = pieza if pieza else (0.0, v["fin"])
        ws = [[toks[i], round(t0 + pal[i][1] - a0, 3)] for i in range(len(pal)) if a0 - 0.01 <= pal[i][1] < b0]
        cues.append([round(t0, 2), round(t0 + (b0 - a0) + 0.5, 2), ws])
    cues.sort(key=lambda c: c[0])
    for i in range(len(cues) - 1): cues[i][1] = min(cues[i][1], cues[i + 1][0] - 0.05)
    (AQUI / "subs6.json").write_text(json.dumps({"cues": cues, "dur": DUR}, ensure_ascii=False))
    f = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round((x % 1) * 1000)):03d}"
    srt = [(a, b, " ".join(w for w, _ in ws)) for a, b, ws in cues] + [(I4 + 0.35, I4 + 2.9, "¿Hasta dónde llega una forma?")]
    srt.sort()
    (AQUI / "trailer6.srt").write_text("\n".join(f"{i}\n{f(a)} --> {f(b)}\n{t}\n" for i, (a, b, t) in enumerate(srt, 1)))
    subprocess.run(["npx", "remotion", "render", "src/index.ts", "SubsTrailer", str(AQUI / "subs6.mov"), f"--props={AQUI / 'subs6.json'}",
                    "--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png", "--log=error"], cwd=ANI, check=True)


if __name__ == "__main__":
    pasos = sys.argv[1:] or ["imagen", "sonido", "subs", "mezcla"]
    if "imagen" in pasos: imagen()
    if "sonido" in pasos: sonido()
    if "subs" in pasos: subtitulos()
    if "mezcla" in pasos:
        out = Path.home() / "Development/BN_Videos/entregables/La-frontera/Trailer/La-frontera-trailer-v6.mp4"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(AQUI / "video6.mp4"), "-i", str(AQUI / "subs6.mov"), "-i", str(AQUI / "audio6.wav"),
                        "-filter_complex", f"[0:v][1:v]overlay=0:0:format=auto,fade=t=out:st={DUR - 2.5:.2f}:d=2.5,format=yuv420p[v]", "-map", "[v]", "-map", "2:a",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(out)], check=True)
        import shutil; shutil.copy(AQUI / "trailer6.srt", out.with_suffix(".srt"))
        print("listo", out, round(DUR, 2), "s")
