"""LA FRONTERA · trailer v5.

  0.0  the dive (src/aperturaTrailer.ts, the film's own cosmic-zoom engine): web → … → eye → retina → neurons → dew →
       radiolarians → a diatom → an electron's cloud → a nucleus → a proton → the foam; it flares into light
 17.3  out of the light, the coast being measured (prologue); the bolt strikes on «rayo»; tree crowns that become
       Sierpiński; the vessels of a retina growing; Koch building itself — each one moving, on short dissolves
 33.3  ONE shot of chapter X, retimed to the voice: a Julia set forms, the Mandelbrot set appears around it on «regla»,
       the dive speeds up on «repítela» (real motion blur), the copy arrives on «misma», the copy becomes an iris
 56.85 the hypercut (v1's beat, shots chosen again by elige4.py)
 81.85 ONE shot of the film's end in trailer mode: the flower that becomes a fractal, the title, the card «PRONTO · EN
       YOUTUBE · @bnlectures» and the mark (its charges small Julia sets), all on one background
One score from the first frame to the last (no splice, no silence), the voice in its phrases, subtitles word by word.

usage: PYTHONPATH=../animatic/pylib python3 arma_trailer5.py
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

AQUI = Path(__file__).resolve().parent
ANI = AQUI.parent / "animatic"
sys.path.insert(0, str(ANI / "audio")); sys.path.insert(0, str(AQUI))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, hz, oleaje, poner, sub, voz  # noqa: E402
from arma_trailer3 import FILM, L, leer, pulso, rampa, shepard  # noqa: E402

FPS, W, H = 30, 1920, 1080
P5 = AQUI / "partes5"; P5.mkdir(exist_ok=True)
EPIB = ANI / "public/p10/vid/epiB"
RAYOS = AQUI.parent / "material-prologo/epilogo/pexels-11025478-rayos.mp4"
X = 0.3                                            # the dissolve between two moving shots

G = 519 / 30                                       # the dive
T_COSTA, T_RAYO, T_ARBOL, T_VASOS, T_KOCH, T_C = G, 20.3, 22.0, 26.2, 28.8, 33.3
C_FIN = 56.85                                      # the hypercut starts
HIPER = C_FIN
E0 = HIPER + 25.0                                  # the ending
E_LEN = (18016 - 16795 + 1) / 30
DUR = E0 + E_LEN
# the ending, in its own seconds: e = 325.5 + s (chapter X's epilogue clock)
E_TIT, E_CARTEL, E_SUELTA, E_FIN = 336.0 - 325.5, 345.8 - 325.5, 355.2 - 325.5, 366.2 - 325.5

# the voice: (line, piece [a, b] in its own seconds or None = whole, start in the trailer)
L15 = [(0.0, 1.24), (1.24, 2.42), (2.42, 4.31), (4.31, 6.46)]
VOZ = [(14, None, 12.3), (15, L15[0], 17.7), (15, L15[1], 20.8 - (1.49 - 1.24)), (15, L15[2], 22.15), (15, L15[3], 26.4),
       (16, None, 29.1), (17, None, 33.6), (18, None, 38.4), (19, None, 42.7), (20, None, 49.6), (21, None, E0 + 3.2)]


def x264(): return ["-c:v", "libx264", "-preset", "fast", "-crf", "14", "-pix_fmt", "yuv420p", "-r", str(FPS)]


def nfr(d): return int(round(d * FPS))


def clip_video(nombre, fuente, s, d, vel=1.0):
    out = P5 / f"{nombre}.mp4"
    if not out.exists():
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{s:.3f}", "-i", str(fuente), "-an", "-vf", f"setpts=PTS/{vel},fps={FPS},scale={W}:{H}", "-frames:v", str(nfr(d))] + x264() + [str(out)], check=True)
    return out


def clip_epib(nombre, e0, d, vel=1.0):
    out = P5 / f"{nombre}.mp4"
    if not out.exists():
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", f"{30 * vel}", "-start_number", str(int(round((e0 - 36.0) * 30))), "-i", str(EPIB / "%04d.jpg"),
                        "-vf", f"fps={FPS}", "-frames:v", str(nfr(d))] + x264() + [str(out)], check=True)
    return out


# ── C · one shot of chapter X, retimed: output time → chapter time, a smooth monotone curve through these knots ──
C_SRC0 = 5277 / 30                                 # the file's first frame
NUDOS = [(T_C, 176.6), (35.54, 178.05), (38.4, 181.0), (39.6, 184.5), (45.6, 232.6), (46.69, 237.8), (49.0, 240.1), (C_FIN, 255.75)]


def pchip(xs, ys, x):
    xs, ys = np.asarray(xs, float), np.asarray(ys, float)
    h = np.diff(xs); dl = np.diff(ys) / h
    m = np.zeros_like(ys)
    for k in range(1, len(xs) - 1):
        if dl[k - 1] * dl[k] > 0:
            w1, w2 = 2 * h[k] + h[k - 1], h[k] + 2 * h[k - 1]
            m[k] = (w1 + w2) / (w1 / dl[k - 1] + w2 / dl[k])
    m[0], m[-1] = dl[0], dl[-1]
    k = np.clip(np.searchsorted(xs, x) - 1, 0, len(xs) - 2)
    t = (x - xs[k]) / h[k]
    h00, h10, h01, h11 = 2 * t**3 - 3 * t**2 + 1, t**3 - 2 * t**2 + t, -2 * t**3 + 3 * t**2, t**3 - t**2
    return h00 * ys[k] + h10 * h[k] * m[k] + h01 * ys[k + 1] + h11 * h[k] * m[k + 1]


def central():
    out = P5 / "central.mp4"
    if out.exists(): return out
    partes = [L / f"mandel_{k}.mp4" for k in "abcd"]
    lista = P5 / "mandel.txt"; lista.write_text("".join(f"file '{p}'\n" for p in partes))
    lee = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lista), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    esc = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"] + x264() + [str(out)], stdin=subprocess.PIPE)
    n_out = nfr(C_FIN - T_C)
    buf, base = {}, 0                               # source frames kept while needed (index → array)
    def fuente(i):
        nonlocal base
        while base <= i:
            b = lee.stdout.read(W * H * 3)
            if not b: return buf[max(buf)] if buf else np.zeros((H, W, 3), np.uint8)
            buf[base] = np.frombuffer(b, np.uint8).reshape(H, W, 3); base += 1
        return buf[i]
    for k in range(n_out):
        t = T_C + k / FPS
        # the shutter: half a frame of output time, mapped to the chapter's frames (several when it runs fast)
        a, b = (pchip(*zip(*NUDOS), np.array([t - 0.25 / FPS, t + 0.25 / FPS])) - C_SRC0) * FPS
        i0, i1 = int(np.floor(a)), max(int(np.floor(a)), int(np.ceil(b)))
        idx = list(range(max(0, i0), max(0, i1) + 1))[:12]
        acc = np.zeros((H, W, 3), np.float32)
        for i in idx: acc += fuente(i)
        esc.stdin.write((acc / len(idx)).astype(np.uint8).tobytes())
        for j in [j for j in buf if j < i0 - 1]: del buf[j]
    esc.stdin.close(); esc.wait(); lee.kill()
    return out


def hipercorte():
    out = P5 / "hiper.mp4"
    if out.exists(): return out
    plan = json.loads((AQUI / "hiper5.json").read_text())
    trozos = []
    for j, (a, s, d) in enumerate(plan):
        a2 = a - 100.0 + HIPER
        n = round((a2 + d) * FPS) - round(a2 * FPS)
        p = P5 / f"h{j:03d}-{n}.mp4"
        if not p.exists():
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{s:.3f}", "-i", str(FILM), "-an", "-frames:v", str(n), "-vf", f"fps={FPS}"] + x264() + [str(p)], check=True)
        trozos.append(p)
    (P5 / "hiper.txt").write_text("".join(f"file '{p}'\n" for p in trozos))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(P5 / "hiper.txt"), "-c", "copy", str(out)], check=True)
    return out


def final():
    out = P5 / "final.mp4"
    if not out.exists():
        (P5 / "final.txt").write_text("".join(f"file '{L / n}'\n" for n in ("fin_a.mp4", "fin_b.mp4")))
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(P5 / "final.txt"), "-vf", f"fps={FPS}"] + x264() + [str(out)], check=True)
    return out


def imagen():
    # (start, file, how it comes in: dissolve seconds, 0 = cut); each file is long enough to overlap the next one
    # (start, file, dissolve in, whether the shot before was made longer to cover the dissolve)
    tomas = [
        (0.0, L / "apertura2.mp4", 0, False),
        (T_COSTA, clip_video("costa", L / "costa.mp4", 0.45, T_RAYO - T_COSTA + X + 0.5), 0.5, False),
        (T_RAYO, clip_video("rayo", RAYOS, 6.95, T_ARBOL - T_RAYO + X), X, True),
        (T_ARBOL, clip_epib("arbol", 57.55, T_VASOS - T_ARBOL + X, (61.7 - 57.55) / (T_VASOS - T_ARBOL + X)), X, True),
        (T_VASOS, clip_epib("vasos", 70.0, T_KOCH - T_VASOS + X, (71.55 - 70.0) / (T_KOCH - T_VASOS + X)), X, True),
        (T_KOCH, clip_epib("koch", 45.7, T_C - T_KOCH + 0.45, (51.6 - 45.7) / (T_C - T_KOCH + 0.45)), X, True),
        (T_C, central(), 0.45, True),
    ]
    cortes = [hipercorte(), final()]                 # after the iris: straight cuts (on the beat, on the hit)
    cmd = ["ffmpeg", "-loglevel", "error", "-y"]
    for _, f, _, _ in tomas: cmd += ["-i", str(f)]
    fil, prev = [], "[0:v]"
    for k in range(1, len(tomas)):
        a, _, x, largo = tomas[k]
        d = max(x, 1 / FPS)
        off = a if largo else a - d          # a cut: the last frame of the shot before
        fil.append(f"{prev}[{k}:v]xfade=transition=fade:duration={d:.4f}:offset={off:.4f}[v{k}]")
        prev = f"[v{k}]"
    n = len(tomas)
    for j, c in enumerate(cortes): cmd += ["-i", str(c)]
    fil.append(f"{prev}fps={FPS},format=yuv420p[a0]")
    for j in range(len(cortes)): fil.append(f"[{n + j}:v]fps={FPS},format=yuv420p[c{j}]")
    fil.append("[a0]" + "".join(f"[c{j}]" for j in range(len(cortes))) + f"concat=n={len(cortes) + 1}:v=1:a=0[v]")
    subprocess.run(cmd + ["-filter_complex", ";".join(fil), "-map", "[v]", "-t", f"{DUR:.3f}"] + x264() + [str(AQUI / "video5.mp4")], check=True)


def llegadas():
    """when each world of the dive arrives (the zoom engine of src/aperturaTrailer.ts, recomputed from the same list)"""
    E = json.loads((ANI / "src/apertura_etapas.json").read_text())
    LZ = np.concatenate([[0], np.cumsum([np.log(e["entra"][2] / e["sale"][2]) for e in E])])
    DURS = [e["dur"] for e in E]
    MED = (LZ[:-1] + LZ[1:]) / 2; TASA = np.diff(LZ) / DURS
    def ritmo(Lv):
        if Lv >= MED[-1]: r = TASA[-1]
        elif Lv < MED[0]: r = TASA[0]
        else:
            i = np.searchsorted(MED, Lv) - 1; u = (Lv - MED[i]) / (MED[i + 1] - MED[i]); u = u * u * (3 - 2 * u)
            r = TASA[i] * (TASA[i + 1] / TASA[i]) ** u
        q = min(max(Lv / 1.0, 0), 1); return r * (0.3 + 0.7 * q * q * (3 - 2 * q))
    n = 6000; Ls = (np.arange(n) + 0.5) / n * LZ[-1]
    T = np.concatenate([[0], np.cumsum(LZ[-1] / n / np.array([ritmo(x) for x in Ls]))])
    T = 0.25 + T / T[-1] * (17.0 - 0.25)
    return [float(np.interp(x, np.linspace(0, LZ[-1], n + 1), T)) for x in LZ[1:-1]]


def trozo_voz(k, pieza):
    x = leer(ANI / f"public/voz/trailer/{k}.mp3")
    if pieza is None: return x
    a, b = pieza
    y = x[int(max(0, a - 0.02) * SR):int(b * SR)].copy()
    f = int(0.015 * SR); y[:f] *= np.linspace(0, 1, f)[:, None]; y[-f:] *= np.linspace(1, 0, f)[:, None]
    return y


def sonido():
    N = int(DUR * SR); m = np.zeros((N, 2)); tt = np.arange(N) / SR
    def B(t, notas, dur, vol, ataque=0.01, abre=1.3, brillo=1.2): poner(m, t, con_reverb(braam(notas, dur, ataque=ataque, abre=abre, brillo=brillo), SALA, 0.55), vol)
    def P(t, n_, vol=0.3, dur=1.4, sala=SALA, mez=0.5): poner(m, t, con_reverb(pulso(hz(n_), dur), sala, mez), vol)
    # the bed: one low D from the first frame to the last, never cut; it swells with each act
    cama = sub(26, DUR + 0.5, ataque=1.5, sat=0.65)
    env = np.interp(tt, [0, 2, G, T_C, HIPER - 1, HIPER + 25, E0 + E_TIT, E0 + E_CARTEL, DUR - 3, DUR], [0.6, 0.8, 1.0, 0.75, 0.9, 0.7, 1.0, 0.7, 0.6, 0.0])
    c_ = cama[:N]; c_ = c_ * (env[:len(c_), None] if c_.ndim == 2 else env[:len(c_)])
    poner(m, 0.0, c_ if c_.ndim == 2 else np.stack([c_, c_], 1), 0.14)
    # ── A · the dive: a tuned hit on every world, closer and louder as they come faster; a tone that never stops rising
    B(0.15, [26, 33, 38, 45], 5.0, 0.8, ataque=0.4, abre=1.6)
    poner(m, 0.15, con_reverb(voz([(50, 4.0), (57, 4.0), (62, 5.0)], "o", vib=2.5), SALA, 0.7), 0.1)
    poner(m, 0.5, con_reverb(shepard(G - 0.5, sube=1 / 4.5, suelta=0.05), SALA, 0.45), 0.4)
    escala = [50, 53, 57, 60, 62, 65, 69, 72, 74, 77, 81, 84, 86, 89, 93, 96, 98]
    lleg = llegadas()
    for k, x in enumerate(lleg):
        u = k / max(1, len(lleg) - 1)
        P(x, escala[min(k, len(escala) - 1)] - 12, 0.16 + 0.14 * u, 1.2); poner(m, x, bombo(0.7 + 0.5 * u), 0.3 + 0.45 * u)
        if k in (3, 7, 12, 15): B(x, [26, 38, 45] if k % 2 else [33, 45, 50], 3.0, 0.45 + 0.2 * u, ataque=0.02)
    poner(m, 9.4, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 4.0)], "a", vib=4.0), SALA, 0.7), 0.16)
    poner(m, G - 1.6, oleaje(1.6), 0.5)
    B(G - 0.1, [26, 33, 38, 45, 50], 7.0, 1.0, ataque=0.004, abre=1.6, brillo=1.3); poner(m, G - 0.1, bombo(2.2), 1.0)
    # ── B · the moving shots: a pad that holds them together, a tuned hit on each, the lightning on its strike
    poner(m, T_COSTA, con_reverb(voz([(57, 4.0), (62, 6.0), (66, 6.0)], "o", vib=2.5), SALA, 0.7), 0.12)
    for x, n_ in [(T_COSTA + 0.4, 57), (T_RAYO, 62), (T_ARBOL + 0.15, 66), (T_VASOS, 69), (T_KOCH, 74)]:
        P(x, n_, 0.26); poner(m, x, bombo(0.8), 0.42)
    B(20.8, [26, 38], 2.2, 0.6, ataque=0.003, abre=0.6, brillo=1.5); poner(m, 20.8, bombo(1.2), 0.7)
    for k in range(5): P(T_KOCH + 0.3 + k * 0.85, [62, 66, 69, 74, 78][k], 0.18, 1.0)
    poner(m, T_KOCH, con_reverb(shepard(T_C - T_KOCH + 2.0, sube=1 / 8, suelta=1.0), SALA, 0.5), 0.25)
    # ── C · the rule, the dive, the copy, the iris: one long gesture
    B(35.54, [26, 33, 38, 45], 9.0, 1.0); poner(m, 35.54, bombo(1.8), 1.0)
    poner(m, 35.7, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 4.0)], "a", vib=4.0), SALA, 0.7), 0.16)
    poner(m, 38.4, con_reverb(shepard(46.69 - 38.4, sube=1 / 2.6, suelta=0.05), SALA, 0.45), 0.5)
    for k in range(16): poner(m, 39.6 + k * 0.4, bombo(0.6), 0.25 + 0.03 * k)
    poner(m, 45.2, oleaje(1.5), 0.55)
    B(46.69, [26, 38, 45, 50], 8.0, 1.0, ataque=0.01, abre=2.0); poner(m, 46.69, bombo(2.0), 1.0)
    poner(m, 46.8, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 2.0), (74, 4.0)], "a", vib=4.5), SALA, 0.7), 0.24)
    poner(m, 49.0, con_reverb(voz([(57, 3.0), (62, 3.0), (66, 4.0)], "o", vib=2.5), SALA, 0.7), 0.16)
    B(51.6, [33, 45, 50, 57], 6.0, 0.5, ataque=1.2, abre=2.5, brillo=1.0)
    poner(m, 53.4, con_reverb(shepard(C_FIN - 53.4, sube=1 / 2.2, suelta=0.02), SALA, 0.4), 0.45)
    poner(m, 54.8, oleaje(2.05), 0.6)
    # ── D · the hypercut: 120 BPM, a boom on every beat, tuned pulses climbing, a braam every two bars, the last 8 s in 16ths
    def p2(t, nota, dur, vol): poner(m, t, con_reverb(pulso(hz(nota), dur), SALA_C, 0.4), vol)
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
    # ── E · the end: the hit that closes the hypercut opens the flower; the rise to the title; the title; the card on a
    # slow pulse; the mark (as at the end of the film); everything fades with the mark
    B(E0, [26, 33, 38, 45, 50], 10.0, 1.0, ataque=0.005, abre=1.6, brillo=1.3); poner(m, E0, bombo(2.0), 1.0)
    poner(m, E0 + 0.6, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 4.0)], "a", vib=4.0), SALA, 0.7), 0.16)
    poner(m, E0 + 3.0, con_reverb(voz([(66, 4.0), (69, 4.0), (74, 6.0)], "a", vib=4.0), SALA, 0.7), 0.18)
    poner(m, E0 + E_TIT - 6.0, con_reverb(shepard(6.0, sube=1 / 3, suelta=0.02), SALA, 0.45), 0.42)
    poner(m, E0 + E_TIT - 4.0, oleaje(4.0), 0.6)
    B(E0 + E_TIT, [26, 33, 38, 45, 50], 12.0, 1.0, ataque=0.01, abre=1.4, brillo=1.25); poner(m, E0 + E_TIT, bombo(2.0), 1.0)
    poner(m, E0 + E_TIT + 0.2, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 3.0), (74, 8.0)], "a", vib=4.5), SALA, 0.7), 0.3)
    for i in range(int((E_SUELTA - 3.75 - E_CARTEL) / 0.75)):
        x = E0 + E_CARTEL - 1.0 + i * 0.75
        P(x, [50, 57, 62, 57, 50, 57, 63, 57][i % 8], 0.11, 1.2, SALA, 0.5)
        if i % 4 == 0: poner(m, x, bombo(0.8), 0.35)
    poner(m, E0 + E_CARTEL, con_reverb(voz([(62, 5.0), (66, 5.0), (69, 6.0)], "a", vib=3.5), SALA, 0.7), 0.15)
    TS = E0 + E_SUELTA
    poner(m, TS - 3.75, con_reverb(voz([(62, 2.0), (66, 2.0)], "o", vib=2.5), SALA, 0.7), 0.12)
    for i, x in enumerate([3.5 - 0.25 - (4 - j) * 0.125 for j in range(5)]): P(TS - 3.75 + x, [62, 66, 69, 74, 78][i], 0.12, 1.6, SALA, 0.6)
    B(TS, [26, 38, 45, 50], 8.0, 0.65, ataque=0.02, abre=1.6, brillo=1.1); poner(m, TS, bombo(1.4), 0.7)
    for x, n_ in [(1.7, 62), (2.25, 66), (2.8, 69)]: P(TS + x, n_, 0.28, 2.4, SALA, 0.6)
    poner(m, TS + 2.8, con_reverb(voz([(62, 2.5), (66, 2.5), (69, 3.0), (74, 9.0)], "a", vib=4.0), SALA, 0.7), 0.24)
    B(TS + 3.85, [38, 45, 50, 57], 10.0, 0.38, ataque=0.3, abre=3.0, brillo=1.0)
    # the voice, the score ducked under it
    V = json.loads((ANI / "src/trailer_voz.json").read_text()); voces = np.zeros((N, 2)); duck = np.ones(N)
    for k, pieza, t0 in VOZ:
        x = trozo_voz(k, pieza); poner(voces, t0, x, 1.0); fin = t0 + len(x) / SR
        duck -= 0.45 * np.clip(np.minimum((tt - t0 + 0.3) / 0.3, (fin + 0.4 - tt) / 0.5), 0, 1)
    m *= np.clip(duck, 0.5, 1)[:, None]
    m *= np.clip((DUR - tt) / 3.0, 0, 1)[:, None]
    m = m / max(1e-9, np.abs(m).max()) * 0.85 + voces * 0.95
    m = m / max(1e-9, np.abs(m).max()) * 0.9
    with wave.open(str(AQUI / "audio5.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(m, -1, 1) * 32767).astype("<i2").tobytes())
    return V


def subtitulos(V):
    cues = []
    for k, pieza, t0 in VOZ:
        v = V[k - 1]; toks = v["texto"].split(); pal = v["palabras"]
        a0, b0 = pieza if pieza else (0.0, v["fin"])
        ws = [[toks[i], round(t0 + pal[i][1] - a0, 3)] for i in range(len(pal)) if a0 - 0.01 <= pal[i][1] < b0]
        cues.append([round(t0, 2), round(t0 + (b0 - a0) + 0.5, 2), ws])
    for i in range(len(cues) - 1): cues[i][1] = min(cues[i][1], cues[i + 1][0] - 0.05)
    (AQUI / "subs5.json").write_text(json.dumps({"cues": cues, "dur": DUR}, ensure_ascii=False))
    f = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round((x % 1) * 1000)):03d}"
    (AQUI / "trailer5.srt").write_text("\n".join(f"{i}\n{f(a)} --> {f(b)}\n{' '.join(w for w, _ in ws)}\n" for i, (a, b, ws) in enumerate(cues, 1)))
    subprocess.run(["npx", "remotion", "render", "src/index.ts", "SubsTrailer", str(AQUI / "subs5.mov"), f"--props={AQUI / 'subs5.json'}",
                    "--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png", "--log=error"], cwd=ANI, check=True)


if __name__ == "__main__":
    pasos = sys.argv[1:] or ["imagen", "sonido", "subs", "mezcla"]
    V = None
    if "imagen" in pasos: imagen()
    if "sonido" in pasos: V = sonido()
    if "subs" in pasos: subtitulos(V or json.loads((ANI / "src/trailer_voz.json").read_text()))
    if "mezcla" in pasos:
        out = Path.home() / "Development/BN_Videos/entregables/La-frontera/Trailer/La-frontera-trailer-v5.mp4"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(AQUI / "video5.mp4"), "-i", str(AQUI / "subs5.mov"), "-i", str(AQUI / "audio5.wav"),
                        "-filter_complex", f"[0:v][1:v]overlay=0:0:format=auto,fade=t=out:st={DUR - 2.5:.2f}:d=2.5,format=yuv420p[v]", "-map", "[v]", "-map", "2:a",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(out)], check=True)
        import shutil; shutil.copy(AQUI / "trailer5.srt", out.with_suffix(".srt"))
        print("listo", out, round(DUR, 2), "s")
