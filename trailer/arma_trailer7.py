"""LA FRONTERA · trailer v7.

  0.0   the hook flows: the copy at ×10⁵⁶ bursts in and recedes to a point of light, the brightest node of the cosmic
        web, and the dive begins there (cosmos → quantum foam), «Si te acercas lo suficiente…»
 19.65  ┃ TODO TIENE UNA FORMA ┃  coast measured, the bolt, the branches of a tree (real), vessels growing, Koch
 38.2   ┃ LA FORMA TIENE UNA REGLA ┃  the rule written (z → z² + c, the prologue), repeated (the point that jumps,
        its orbit, the set it draws: chapter I), the dive to ×10⁵⁶ (chapter X), the copy, the copy becomes an iris
 64.1   ┃ DIEZ CAPÍTULOS ┃  the hypercut: the whole film in order, 104 moving shots in 28 s, faster and faster
 94.5   ┃ ¿HASTA DÓNDE LLEGA UNA FORMA? ┃
 97.5   the flower → the title → ESTRENO 7 DE NOVIEMBRE → the mark, on one background

usage: PYTHONPATH=../animatic/pylib python3 arma_trailer7.py [imagen sonido subs mezcla]
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

AQUI = Path(__file__).resolve().parent
ANI = AQUI.parent / "animatic"
sys.path.insert(0, str(ANI / "audio")); sys.path.insert(0, str(AQUI))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, hz, oleaje, poner, sub, voz  # noqa: E402
from arma_trailer3 import FILM, L, pulso, shepard  # noqa: E402
import arma_trailer5 as V5  # noqa: E402

FPS, W, H = 30, 1920, 1080
P5, P6, P7 = AQUI / "partes5", AQUI / "partes6", AQUI / "partes7"
P7.mkdir(exist_ok=True)
GANCHO = 2.7
G = GANCHO + 17.3                                  # the hook and the dive
I1 = G
DB = (I1 - 0.35 + 2.4 - 0.35) - (V5.T_COSTA - 0.5)
I2 = V5.T_C + DB
C0 = I2 + 2.4                                      # the rule
T17, T18, T19 = C0 + 0.2, C0 + 5.0, C0 + 9.4
MISMA = T19 + 3.99
T20 = MISMA + 2.5
I3 = MISMA + 2.3 + 7.85
HIPER = I3 + 2.4
HDUR = 28.0
I4 = HIPER + HDUR
E0 = I4 + 3.0
DUR = E0 + V5.E_LEN
ARBOL = AQUI.parent / "material-prologo/epilogo/pexels-35253814-arbol.mp4"

VOZ = [(14, None, GANCHO + 12.3)] + [(k, p, t + DB) for k, p, t in V5.VOZ if k in (15, 16)] + \
      [(17, None, T17), (18, None, T18), (19, None, T19), (20, None, T20), (22, None, I4 + 0.35), (21, None, E0 + 3.2)]
SIN_SUBS = {22}


def retiempo(nombre, fuente, nudos):
    """a shot retimed: output time → source time along a smooth monotone curve; each output frame is the average of the
    source frames its half-frame shutter covers (real motion blur when it runs fast)"""
    out = P7 / f"{nombre}.mp4"
    if out.exists(): return out
    t_out = [a for a, _ in nudos]; t_src = [b for _, b in nudos]
    s0 = max(0.0, min(t_src) - 0.2)
    lee = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-ss", f"{s0:.3f}", "-i", str(fuente), "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    esc = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                            "-c:v", "libx264", "-preset", "fast", "-crf", "14", "-pix_fmt", "yuv420p", str(out)], stdin=subprocess.PIPE)
    buf, base, ultimo = {}, 0, [np.zeros((H, W, 3), np.uint8)]
    def fr(i):
        nonlocal base
        while base <= i:
            b = lee.stdout.read(W * H * 3)
            if not b: return ultimo[0]                 # past the source's end: its last frame, held
            buf[base] = ultimo[0] = np.frombuffer(b, np.uint8).reshape(H, W, 3); base += 1
        return buf.get(i, ultimo[0])
    n = int(round((t_out[-1] - t_out[0]) * FPS))
    for k in range(n):
        t = t_out[0] + k / FPS
        a, b = (V5.pchip(t_out, t_src, np.array([t - 0.25 / FPS, t + 0.25 / FPS])) - s0) * FPS
        i0 = max(0, int(np.floor(a))); idx = list(range(i0, max(i0, int(np.ceil(b))) + 1))[:14]
        acc = np.zeros((H, W, 3), np.float32)
        for i in idx: acc += fr(i)
        esc.stdin.write((acc / len(idx)).astype(np.uint8).tobytes())
        for j in [j for j in buf if j < i0 - 1]: del buf[j]
    esc.stdin.close(); esc.wait(); lee.kill()
    return out


def hipercorte():
    out = P7 / "hiper.mp4"
    if out.exists(): return out
    plan = json.loads((AQUI / "hiper7.json").read_text())
    trozos = []
    for j, (a, s, d) in enumerate(plan):
        n = round((a + d) * FPS) - round(a * FPS)
        p = P7 / f"h{j:03d}-{n}.mp4"
        if not p.exists():
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{s:.3f}", "-i", str(FILM), "-an", "-frames:v", str(n), "-vf", f"fps={FPS}",
                            "-c:v", "libx264", "-preset", "fast", "-crf", "14", "-pix_fmt", "yuv420p", str(p)], check=True)
        trozos.append(p)
    (P7 / "hiper.txt").write_text("".join(f"file '{p}'\n" for p in trozos))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(P7 / "hiper.txt"), "-c", "copy", str(out)], check=True)
    return out


def tomas():
    arbol = P7 / "arbol.mp4"
    if not arbol.exists():
        d = V5.T_VASOS - V5.T_ARBOL + V5.X
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", "3.0", "-i", str(ARBOL), "-an", "-vf", f"fps={FPS},scale={W}:{H}", "-frames:v", str(int(round(d * FPS))),
                        "-c:v", "libx264", "-preset", "fast", "-crf", "14", "-pix_fmt", "yuv420p", str(arbol)], check=True)
    regla = retiempo("regla", FILM, [(C0, 74.5), (T17 + 1.7, 77.0), (T17 + 2.3, 78.1), (T18 - 0.2, 80.6)])
    itera = retiempo("itera", FILM, [(T18 - 0.4, 190.8), (T18 + 1.4, 197.0), (T19 - 0.1, 213.6)])
    buceo = retiempo("buceo", AQUI / "partes5/mandel_todo.mp4", [(T19 - 0.4, 180.0 - 5277 / 30), (T19 + 0.6, 183.0 - 5277 / 30), (MISMA - 0.8, 230.5 - 5277 / 30),
                                                                  (MISMA, 237.8 - 5277 / 30), (MISMA + 2.3, 240.1 - 5277 / 30), (I3, 255.8 - 5277 / 30)])
    return [
        (0.0, L / "apertura3.mp4", 0.0, G, 0.0),
        (I1 - 0.35, P6 / "i1.mp4", 0.0, 2.4, 0.35),
        (V5.T_COSTA - 0.5 + DB, P5 / "costa.mp4", 0.0, None, 0.4),
        (V5.T_RAYO + DB, P5 / "rayo.mp4", 0.0, None, V5.X),
        (V5.T_ARBOL + DB, arbol, 0.0, None, V5.X),
        (V5.T_VASOS + DB, P5 / "vasos.mp4", 0.0, None, V5.X),
        (V5.T_KOCH + DB, P5 / "koch.mp4", 0.0, None, V5.X),
        (I2, P6 / "i2.mp4", 0.0, 2.4, 0.4),
        (C0, regla, 0.0, None, 0.4),
        (T18 - 0.4, itera, 0.0, None, 0.4),
        (T19 - 0.4, buceo, 0.0, None, 0.5),
        (I3, P6 / "i3b.mp4", 0.0, 2.4, 0.4),
        (HIPER, hipercorte(), 0.0, HDUR, 0.0),
        (I4, P6 / "i4.mp4", 0.0, 3.0, 0.0),
        (E0, P5 / "final.mp4", 0.0, None, 0.45),
    ]


def imagen():
    todo = AQUI / "partes5/mandel_todo.mp4"
    if not todo.exists():
        (P7 / "mandel.txt").write_text("".join(f"file '{L / f'mandel_{k}.mp4'}'\n" for k in "abcd"))
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(P7 / "mandel.txt"), "-c", "copy", str(todo)], check=True)
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
    fil.append(f"{prev}trim=duration={DUR:.3f},format=yuv420p[v]")
    subprocess.run(cmd + ["-filter_complex", ";".join(fil), "-map", "[v]", "-c:v", "libx264", "-preset", "fast", "-crf", "14", "-pix_fmt", "yuv420p", "-r", str(FPS), str(AQUI / "video7.mp4")], check=True)


def sonido():
    N = int(DUR * SR); m = np.zeros((N, 2)); tt = np.arange(N) / SR
    def B(t, notas, dur, vol, ataque=0.01, abre=1.3, brillo=1.2): poner(m, t, con_reverb(braam(notas, dur, ataque=ataque, abre=abre, brillo=brillo), SALA, 0.55), vol)
    def P(t, n_, vol=0.3, dur=1.4, sala=SALA, mez=0.5): poner(m, t, con_reverb(pulso(hz(n_), dur), sala, mez), vol)
    def p2(t, nota, dur, vol): poner(m, t, con_reverb(pulso(hz(nota), dur), SALA_C, 0.4), vol)
    cama = sub(26, DUR + 0.5, ataque=0.8, sat=0.65)[:N]
    env = np.interp(tt, [0, 0.3, 2.0, GANCHO, G, I2, I3, HIPER, I4, I4 + 2.5, E0, E0 + V5.E_TIT, E0 + V5.E_CARTEL, DUR - 3, DUR],
                    [0.3, 1.0, 0.8, 0.6, 1.0, 0.85, 0.9, 0.9, 0.45, 0.55, 0.8, 1.0, 0.7, 0.6, 0.0])
    cama = cama * (env[:len(cama), None] if cama.ndim == 2 else env[:len(cama)])
    poner(m, 0.0, cama if cama.ndim == 2 else np.stack([cama, cama], 1), 0.14)
    # ── the hook: a hit as the copy bursts in; as it recedes a tone falls with it into the point of light
    B(0.25, [26, 33, 38, 45, 50], 6.0, 1.0, ataque=0.003, abre=1.8, brillo=1.35); poner(m, 0.25, bombo(2.2), 1.0)
    poner(m, 0.3, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 2.5)], "a", vib=4.5), SALA, 0.7), 0.18)
    poner(m, 1.35, con_reverb(shepard(GANCHO - 1.2, sube=-1 / 2.0, suelta=0.3), SALA, 0.5), 0.35)
    P(GANCHO - 0.1, 81, 0.25, 2.0)
    # ── the dive
    lleg = [x + GANCHO for x in V5.llegadas()]
    poner(m, GANCHO + 0.5, con_reverb(shepard(17.3 - 0.5, sube=1 / 4.5, suelta=0.05), SALA, 0.45), 0.4)
    escala = [50, 53, 57, 60, 62, 65, 69, 72, 74, 77, 81, 84, 86, 89, 93, 96, 98]
    for k, x in enumerate(lleg):
        u = k / max(1, len(lleg) - 1)
        P(x, escala[min(k, len(escala) - 1)] - 12, 0.16 + 0.14 * u, 1.2); poner(m, x, bombo(0.7 + 0.5 * u), 0.3 + 0.45 * u)
        if k in (3, 7, 11, 14): B(x, [26, 38, 45] if k % 2 else [33, 45, 50], 3.0, 0.45 + 0.2 * u, ataque=0.02)
    poner(m, GANCHO + 9.4, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 4.0)], "a", vib=4.0), SALA, 0.7), 0.16)
    poner(m, I1 - 1.6, oleaje(1.6), 0.5)
    # ── the intertitles
    for x in (I1, I2, I3):
        B(x, [26, 33, 38, 45, 50], 6.0, 1.0, ataque=0.005, abre=1.5, brillo=1.25); poner(m, x, bombo(2.0), 1.0)
        poner(m, x + 0.1, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 2.5)], "a", vib=4.0), SALA, 0.7), 0.2)
    for x in (I2, I3): poner(m, x - 1.8, con_reverb(shepard(1.8, sube=1 / 1.5, suelta=0.02), SALA, 0.4), 0.35)
    # ── the moving shots
    tc = V5.T_COSTA + DB
    poner(m, tc, con_reverb(voz([(57, 4.0), (62, 6.0), (66, 6.0)], "o", vib=2.5), SALA, 0.7), 0.12)
    for x, n_ in [(tc + 0.4, 57), (V5.T_RAYO + DB, 62), (V5.T_ARBOL + DB + 0.15, 66), (V5.T_VASOS + DB, 69), (V5.T_KOCH + DB, 74)]:
        P(x, n_, 0.26); poner(m, x, bombo(0.8), 0.42)
    B(20.8 + DB, [26, 38], 2.2, 0.6, ataque=0.003, abre=0.6, brillo=1.5); poner(m, 20.8 + DB, bombo(1.2), 0.7)
    for k in range(5): P(V5.T_KOCH + DB + 0.3 + k * 0.85, [62, 66, 69, 74, 78][k], 0.18, 1.0)
    # ── the rule: a crystal hit when it is written; each jump of the point a tick, faster and faster; the set appears;
    # the dive rises; the copy lands; the iris opens
    B(T17 + 1.94, [38, 45, 50, 57], 5.0, 0.8, ataque=0.004, abre=1.2, brillo=1.4); poner(m, T17 + 1.94, bombo(1.4), 0.8)
    P(T17 + 1.94, 86, 0.3, 2.5); P(T17 + 2.1, 93, 0.2, 2.5)
    x, paso = T18, 0.4
    while x < T19 - 0.6:
        P(x, [74, 78, 81, 86][int((x - T18) * 3) % 4], 0.12 + 0.05 * (x - T18) / 4, 0.5, SALA_C, 0.4); x += paso; paso = max(0.07, paso * 0.86)
    B(T19 - 0.9, [26, 38, 45, 50], 5.0, 0.7, ataque=0.8, abre=2.0, brillo=1.1)
    poner(m, T19 - 0.4, con_reverb(shepard(MISMA - T19 + 0.4, sube=1 / 1.8, suelta=0.05), SALA, 0.45), 0.5)
    for k in range(12): poner(m, T19 + 0.4 + k * 0.3, bombo(0.6), 0.25 + 0.04 * k)
    poner(m, MISMA - 1.4, oleaje(1.4), 0.55)
    B(MISMA, [26, 38, 45, 50], 8.0, 1.0, ataque=0.01, abre=2.0); poner(m, MISMA, bombo(2.0), 1.0)
    poner(m, MISMA + 0.1, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 2.0), (74, 4.0)], "a", vib=4.5), SALA, 0.7), 0.24)
    poner(m, MISMA + 2.3, con_reverb(voz([(57, 3.0), (62, 3.0), (66, 4.0)], "o", vib=2.5), SALA, 0.7), 0.16)
    B(MISMA + 4.9, [33, 45, 50, 57], 6.0, 0.5, ataque=1.2, abre=2.5, brillo=1.0)
    # ── the hypercut (120 BPM): halves, then 16ths, then sextuplets, rising to the hit of the question
    poner(m, I3 + 0.6, con_reverb(shepard(HIPER - I3 - 0.6, sube=1 / 1.2, suelta=0.02), SALA, 0.4), 0.45)
    for i in range(20):
        x = HIPER + i * 0.5
        poner(m, x, bombo(0.9 + 0.3 * (i % 4 == 0)), 0.55 + 0.25 * (i % 4 == 0)); p2(x + 0.25, [50, 57, 62, 66, 69, 74][(i // 4) % 6], 0.6, 0.12)
        if i % 8 == 0: B(x, [26, 38, 45] if i % 16 == 0 else [33, 45, 50], 4.0, 0.5, ataque=0.02, abre=1.0, brillo=1.1)
    for i in range(48):
        x = HIPER + 10.0 + i * 0.25
        poner(m, x, bombo(0.8), 0.4 + 0.006 * i); p2(x, [57, 62, 66, 69, 74, 78][i // 8], 0.4, 0.1 + 0.002 * i)
        if i % 16 == 0: B(x, [26, 38, 45, 50], 4.0, 0.55, ataque=0.02, abre=1.2, brillo=1.15)
    for i in range(36):
        x = HIPER + 22.0 + i / 6
        poner(m, x, bombo(0.6), 0.45 + 0.012 * i); p2(x, [74, 78, 81, 86, 90, 93][i // 6], 0.3, 0.12 + 0.003 * i)
    poner(m, HIPER + 20.0, con_reverb(shepard(8.0, sube=1 / 2.5, suelta=0.05), SALA, 0.4), 0.55)
    poner(m, HIPER + 22.0, oleaje(6.0), 0.6)
    B(I4, [26, 33, 38, 45, 50], 7.0, 1.0, ataque=0.004, abre=1.6, brillo=1.3); poner(m, I4, bombo(2.2), 1.0)
    poner(m, I4 + 0.8, con_reverb(voz([(50, 2.5), (57, 3.0)], "o", vib=2.0), SALA, 0.75), 0.1)
    # ── the end
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
    voces = np.zeros((N, 2)); duck = np.ones(N)
    for k, pieza, t0 in VOZ:
        x = V5.trozo_voz(k, pieza); poner(voces, t0, x, 1.0); fin = t0 + len(x) / SR
        duck -= 0.45 * np.clip(np.minimum((tt - t0 + 0.3) / 0.3, (fin + 0.4 - tt) / 0.5), 0, 1)
    m *= np.clip(duck, 0.5, 1)[:, None]
    m *= np.clip((DUR - tt) / 3.0, 0, 1)[:, None]
    m = m / max(1e-9, np.abs(m).max()) * 0.85 + voces * 0.95
    m = m / max(1e-9, np.abs(m).max()) * 0.9
    with wave.open(str(AQUI / "audio7.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(m, -1, 1) * 32767).astype("<i2").tobytes())


def subtitulos():
    V = json.loads((ANI / "src/trailer_voz.json").read_text())
    cues = []
    for k, pieza, t0 in VOZ:
        if k in SIN_SUBS: continue
        v = V[k - 1]; toks = v["texto"].split(); pal = v["palabras"]
        a0, b0 = pieza if pieza else (0.0, v["fin"])
        ws = [[toks[i], round(t0 + pal[i][1] - a0, 3)] for i in range(min(len(pal), len(toks))) if a0 - 0.01 <= pal[i][1] < b0]
        cues.append([round(t0, 2), round(t0 + (b0 - a0) + 0.5, 2), ws])
    cues.sort(key=lambda c: c[0])
    for i in range(len(cues) - 1): cues[i][1] = min(cues[i][1], cues[i + 1][0] - 0.05)
    (AQUI / "subs7.json").write_text(json.dumps({"cues": cues, "dur": DUR}, ensure_ascii=False))
    f = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round((x % 1) * 1000)):03d}"
    srt = sorted([(a, b, " ".join(w for w, _ in ws)) for a, b, ws in cues] + [(I4 + 0.35, I4 + 2.9, "¿Hasta dónde llega una forma?")])
    (AQUI / "trailer7.srt").write_text("\n".join(f"{i}\n{f(a)} --> {f(b)}\n{t}\n" for i, (a, b, t) in enumerate(srt, 1)))
    subprocess.run(["npx", "remotion", "render", "src/index.ts", "SubsTrailer", str(AQUI / "subs7.mov"), f"--props={AQUI / 'subs7.json'}",
                    "--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png", "--log=error"], cwd=ANI, check=True)


if __name__ == "__main__":
    pasos = sys.argv[1:] or ["imagen", "sonido", "subs", "mezcla"]
    if "imagen" in pasos: imagen()
    if "sonido" in pasos: sonido()
    if "subs" in pasos: subtitulos()
    if "mezcla" in pasos:
        out = Path.home() / "Development/BN_Videos/entregables/La-frontera/Trailer/La-frontera-trailer-v7.mp4"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(AQUI / "video7.mp4"), "-i", str(AQUI / "subs7.mov"), "-i", str(AQUI / "audio7.wav"),
                        "-filter_complex", f"[0:v][1:v]overlay=0:0:format=auto,fade=t=out:st={DUR - 2.5:.2f}:d=2.5,format=yuv420p[v]", "-map", "[v]", "-map", "2:a",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(out)], check=True)
        import shutil; shutil.copy(AQUI / "trailer7.srt", out.with_suffix(".srt"))
        print("listo", out, round(DUR, 2), "s")
