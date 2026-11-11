"""LA FRONTERA · trailer v8.

  0.0   the copy at ×10⁵⁶ fills with light; out of the light, the cosmic web; the dive to the quantum foam
 19.9   ┃ TODO TIENE UNA FORMA ┃ over the foam, which goes on under it
 22.3   coast measured · the bolt · the branches of a tree · your nervous system · vessels growing · Koch
 38.7   ┃ LA FORMA TIENE UNA REGLA ┃ over Koch
 41.0   z → z² + c is written on «regla»; repeated: the point jumps, its orbit draws the rabbit, complete; the dive to
        ×10⁵⁶ lands on «misma»; the copy becomes an iris («Una sola línea de matemática…»)
 65.7   ┃ DIEZ CAPÍTULOS ┃ over the iris
 68.1   the ten chapters, each one 5 s of its moving moments (chapter X, 8 s), its number and name over its first shots
121.1   ┃ ¿HASTA DÓNDE LLEGA UNA FORMA? ┃
124.1   the flower → the title → ESTRENO 7 DE NOVIEMBRE → the mark

Intertitles are transparent and lie over the moving picture, which dims under them (no cut, no black).

usage: PYTHONPATH=../animatic/pylib python3 arma_trailer8.py [imagen sonido subs mezcla]
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
from arma_trailer7 import retiempo  # noqa: E402

FPS, W, H = 30, 1920, 1080
P5, P6, P7, P8 = AQUI / "partes5", AQUI / "partes6", AQUI / "partes7", AQUI / "partes8"
P8.mkdir(exist_ok=True)
GANCHO = 2.7
APERTURA = 678 / 30                                # the hook, the dive, the foam's tail
I1 = GANCHO + 17.2
T_COSTA = I1 + 2.4
T_RAYO, T_ARBOL, T_NERV, T_VASOS, T_KOCH = T_COSTA + 3.0, T_COSTA + 4.7, T_COSTA + 7.0, T_COSTA + 9.3, T_COSTA + 11.9
I2 = T_KOCH + 4.5
C0 = I2 + 2.3
T17, T18 = C0 + 0.2, C0 + 5.0
T19 = T18 + 5.6
MISMA = T19 + 3.99
T20 = MISMA + 2.5
I3 = MISMA + 2.3 + 7.85
HIPER = I3 + 2.4
PLAN = json.loads((AQUI / "hiper8.json").read_text())
HDUR = PLAN["dur"]
I4 = HIPER + HDUR
E0 = I4 + 3.0
DUR = E0 + V5.E_LEN
ARBOL = AQUI.parent / "material-prologo/epilogo/pexels-35253814-arbol.mp4"
L15 = [(0.0, 1.21), (1.21, 2.38), (2.38, 4.21), (4.21, 6.07), (6.07, 8.19)]
VOZ = [(14, None, GANCHO + 12.3), (15, L15[0], T_COSTA + 0.4), (15, L15[1], T_RAYO + 0.3 - 0.25), (15, L15[2], T_ARBOL + 0.15),
       (15, L15[3], T_NERV + 0.15), (15, L15[4], T_VASOS + 0.15), (16, None, T_KOCH + 0.3),
       (17, None, T17), (18, None, T18), (19, None, T19), (20, None, T20), (22, None, I4 + 0.35), (21, None, E0 + 3.2)]
SIN_SUBS = {22}


def clip(nombre, fuente, s, d, extra=0.0):
    """a shot of d seconds from s (and, if asked, its last frame held for extra seconds, for an intertitle over it)"""
    out = P8 / f"{nombre}.mp4"
    if not out.exists():
        pad = f",tpad=stop_mode=clone:stop_duration={extra:.3f}" if extra else ""
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{s:.3f}", "-i", str(fuente), "-an", "-vf", f"fps={FPS},scale={W}:{H}{pad}",
                        "-frames:v", str(int(round((d + extra) * FPS))), "-c:v", "libx264", "-preset", "fast", "-crf", "14", "-pix_fmt", "yuv420p", str(out)], check=True)
    return out


def hipercorte():
    out = P8 / "hiper.mp4"
    if out.exists(): return out
    trozos = []
    for j, (a, s, d) in enumerate(PLAN["planos"]):
        n = round((a + d) * FPS) - round(a * FPS)
        p = P8 / f"h{j:03d}-{n}.mp4"
        if not p.exists():
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{s:.3f}", "-i", str(FILM), "-an", "-frames:v", str(n), "-vf", f"fps={FPS}",
                            "-c:v", "libx264", "-preset", "fast", "-crf", "14", "-pix_fmt", "yuv420p", str(p)], check=True)
        trozos.append(p)
    (P8 / "hiper.txt").write_text("".join(f"file '{p}'\n" for p in trozos))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(P8 / "hiper.txt"), "-c", "copy", str(out)], check=True)
    return out


def tomas():
    """(start, file, source start, length, fade in, alpha?) in order, each one over the ones before"""
    X = 0.3
    regla = retiempo("regla", FILM, [(C0, 74.5), (T17 + 1.7, 77.0), (T17 + 2.3, 78.1), (T18 - 0.2, 80.6)])
    itera = retiempo("itera8", FILM, [(T18 - 0.4, 190.8), (T18 + 1.4, 197.0), (T18 + 4.2, 213.6), (T19 + 0.1, 215.6)])
    m0 = 5277 / 30
    buceo = retiempo("buceo8", AQUI / "partes5/mandel_todo.mp4", [(T19 - 0.4, 180.0 - m0), (T19 + 0.6, 183.0 - m0), (MISMA - 0.8, 230.5 - m0),
                                                                  (MISMA, 237.8 - m0), (MISMA + 2.3, 240.1 - m0), (I3 + 2.4, 256.6 - m0)])
    return [
        (0.0, L / "apertura4.mp4", 0.0, APERTURA, 0.0, False),
        (T_COSTA - 0.1, clip("costa", P5 / "costa.mp4", 0.0, T_RAYO - T_COSTA + 0.1 + X), 0.0, None, 0.7, False),
        (T_RAYO, P5 / "rayo.mp4", 0.0, None, X, False),
        (T_ARBOL, clip("arbol", ARBOL, 3.0, T_NERV - T_ARBOL + X), 0.0, None, X, False),
        (T_NERV, clip("nervios", FILM, 29.6, T_VASOS - T_NERV + X), 0.0, None, X, False),
        (T_VASOS, P5 / "vasos.mp4", 0.0, None, X, False),
        (T_KOCH, clip("koch", P5 / "koch.mp4", 0.0, 4.5, extra=2.8), 0.0, None, X, False),
        (C0, regla, 0.0, None, 0.7, False),
        (T18 - 0.4, itera, 0.0, None, 0.4, False),
        (T19 - 0.4, buceo, 0.0, None, 0.5, False),
        (HIPER, hipercorte(), 0.0, HDUR, 0.6, False),
        (HIPER, P7 / "capitulos.mov", 0.0, HDUR, 0.0, True),
        (E0, P5 / "final.mp4", 0.0, None, 0.6, False),
    ]


VELOS = [(I1, 3.0), (I2, 3.0), (I3, 3.0), (I4 - 0.2, 3.4)]      # the picture dims under each intertitle
LETRAS = [(I1, P6 / "t1.mov"), (I2, P6 / "t2.mov"), (I3, P6 / "t3.mov"), (I4, P6 / "t4.mov")]


def imagen():
    T = tomas()
    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi", "-i", f"color=c=0x020306:s=1920x1080:r={FPS}:d={DUR:.3f}"]
    fil, n = [], 0
    def capa(a, f, s, d, x):
        nonlocal n
        n += 1
        cmd.extend(["-ss", f"{s:.3f}"] + (["-t", f"{d:.3f}"] if d else []) + ["-i", str(f)])
        fade = f",fade=t=in:st=0:d={x:.3f}:alpha=1" if x > 0 else ""
        fil.append(f"[{n}:v]fps={FPS},format=yuva420p{fade},setpts=PTS-STARTPTS+{a:.4f}/TB[l{n}]")
        return f"[l{n}]"
    capas = [capa(a, f, s, d, x) for a, f, s, d, x, _ in T]
    velos = []
    for k, (a, d) in enumerate(VELOS):
        fil.append(f"color=c=0x020306:s=1920x1080:r={FPS}:d={d:.3f},format=rgba,colorchannelmixer=aa=0.62,fade=t=in:st=0:d=0.8:alpha=1,"
                   f"fade=t=out:st={d - 0.8:.3f}:d=0.8:alpha=1,setpts=PTS-STARTPTS+{a:.4f}/TB[v{k}]")
        velos.append(f"[v{k}]")
    letras = [capa(a, f, 0.0, None, 0.0) for a, f in LETRAS]
    prev = "[0:v]"
    for k, c in enumerate(capas + velos + letras):
        fil.append(f"{prev}{c}overlay=eof_action=pass:repeatlast=0:format=auto[b{k}]"); prev = f"[b{k}]"
    fil.append(f"{prev}trim=duration={DUR:.3f},format=yuv420p[v]")
    subprocess.run(cmd + ["-filter_complex", ";".join(fil), "-map", "[v]", "-c:v", "libx264", "-preset", "fast", "-crf", "14", "-pix_fmt", "yuv420p", "-r", str(FPS), str(AQUI / "video8.mp4")], check=True)


def sonido():
    N = int(DUR * SR); m = np.zeros((N, 2)); tt = np.arange(N) / SR
    def B(t, notas, dur, vol, ataque=0.01, abre=1.3, brillo=1.2): poner(m, t, con_reverb(braam(notas, dur, ataque=ataque, abre=abre, brillo=brillo), SALA, 0.55), vol)
    def P(t, n_, vol=0.3, dur=1.4, sala=SALA, mez=0.5): poner(m, t, con_reverb(pulso(hz(n_), dur), sala, mez), vol)
    def p2(t, nota, dur, vol): poner(m, t, con_reverb(pulso(hz(nota), dur), SALA_C, 0.4), vol)
    cama = sub(26, DUR + 0.5, ataque=0.8, sat=0.65)[:N]
    env = np.interp(tt, [0, 0.3, 2.0, GANCHO, I1, I2, I3, HIPER, I4, I4 + 2.5, E0, E0 + V5.E_TIT, E0 + V5.E_CARTEL, DUR - 3, DUR],
                    [0.3, 1.0, 0.8, 0.6, 1.0, 0.85, 0.9, 0.9, 0.45, 0.55, 0.8, 1.0, 0.7, 0.6, 0.0])
    cama = cama * (env[:len(cama), None] if cama.ndim == 2 else env[:len(cama)])
    poner(m, 0.0, cama if cama.ndim == 2 else np.stack([cama, cama], 1), 0.14)
    # the hook: a hit as the copy bursts in; it swells into light, and the light is the web
    B(0.25, [26, 33, 38, 45, 50], 6.0, 1.0, ataque=0.003, abre=1.8, brillo=1.35); poner(m, 0.25, bombo(2.2), 1.0)
    poner(m, 0.3, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 2.5)], "a", vib=4.5), SALA, 0.7), 0.18)
    poner(m, 1.2, con_reverb(shepard(GANCHO - 1.0, sube=1 / 1.5, suelta=0.3), SALA, 0.5), 0.35)
    poner(m, GANCHO - 1.2, oleaje(1.4), 0.45)
    # the dive
    lleg = [x + GANCHO for x in V5.llegadas()]
    poner(m, GANCHO + 0.5, con_reverb(shepard(17.0, sube=1 / 4.5, suelta=0.05), SALA, 0.45), 0.4)
    escala = [50, 53, 57, 60, 62, 65, 69, 72, 74, 77, 81, 84, 86, 89, 93, 96, 98]
    for k, x in enumerate(lleg):
        u = k / max(1, len(lleg) - 1)
        P(x, escala[min(k, len(escala) - 1)] - 12, 0.16 + 0.14 * u, 1.2); poner(m, x, bombo(0.7 + 0.5 * u), 0.3 + 0.45 * u)
        if k in (3, 7, 11, 14): B(x, [26, 38, 45] if k % 2 else [33, 45, 50], 3.0, 0.45 + 0.2 * u, ataque=0.02)
    poner(m, GANCHO + 9.4, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 4.0)], "a", vib=4.0), SALA, 0.7), 0.16)
    # the intertitles: a hit, a choir opening, a swell before
    for x in (I1, I2, I3):
        B(x, [26, 33, 38, 45, 50], 6.0, 0.95, ataque=0.02, abre=1.5, brillo=1.2); poner(m, x, bombo(1.8), 0.9)
        poner(m, x + 0.1, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 2.5)], "a", vib=4.0), SALA, 0.7), 0.2)
        poner(m, x - 1.6, con_reverb(shepard(1.6, sube=1 / 1.5, suelta=0.02), SALA, 0.4), 0.3)
    # the moving shots
    poner(m, T_COSTA, con_reverb(voz([(57, 4.0), (62, 6.0), (66, 6.0)], "o", vib=2.5), SALA, 0.7), 0.12)
    for x, n_ in [(T_COSTA + 0.4, 57), (T_RAYO, 62), (T_ARBOL, 66), (T_NERV, 69), (T_VASOS, 72), (T_KOCH, 74)]:
        P(x, n_, 0.26); poner(m, x, bombo(0.8), 0.42)
    B(T_RAYO + 0.3, [26, 38], 2.2, 0.6, ataque=0.003, abre=0.6, brillo=1.5); poner(m, T_RAYO + 0.3, bombo(1.2), 0.7)
    for k in range(5): P(T_KOCH + 0.3 + k * 0.85, [62, 66, 69, 74, 78][k], 0.18, 1.0)
    # the rule: written; repeated (a tick per jump, faster); the set complete; the dive; the copy; the iris
    B(T17 + 1.94, [38, 45, 50, 57], 5.0, 0.8, ataque=0.004, abre=1.2, brillo=1.4); poner(m, T17 + 1.94, bombo(1.4), 0.8)
    P(T17 + 1.94, 86, 0.3, 2.5); P(T17 + 2.1, 93, 0.2, 2.5)
    x, paso = T18, 0.4
    while x < T18 + 4.2:
        P(x, [74, 78, 81, 86][int((x - T18) * 3) % 4], 0.12 + 0.05 * (x - T18) / 4, 0.5, SALA_C, 0.4); x += paso; paso = max(0.07, paso * 0.86)
    B(T18 + 4.2, [26, 38, 45, 50], 6.0, 0.8, ataque=0.3, abre=2.0, brillo=1.15)
    poner(m, T18 + 4.3, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 3.0)], "a", vib=4.0), SALA, 0.7), 0.18)
    poner(m, T19 - 0.4, con_reverb(shepard(MISMA - T19 + 0.4, sube=1 / 1.8, suelta=0.05), SALA, 0.45), 0.5)
    for k in range(12): poner(m, T19 + 0.4 + k * 0.3, bombo(0.6), 0.25 + 0.04 * k)
    poner(m, MISMA - 1.4, oleaje(1.4), 0.55)
    B(MISMA, [26, 38, 45, 50], 8.0, 1.0, ataque=0.01, abre=2.0); poner(m, MISMA, bombo(2.0), 1.0)
    poner(m, MISMA + 0.1, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 2.0), (74, 4.0)], "a", vib=4.5), SALA, 0.7), 0.24)
    poner(m, MISMA + 2.3, con_reverb(voz([(57, 3.0), (62, 3.0), (66, 4.0)], "o", vib=2.5), SALA, 0.7), 0.16)
    B(MISMA + 4.9, [33, 45, 50, 57], 6.0, 0.5, ataque=1.2, abre=2.5, brillo=1.0)
    # the ten chapters (120 BPM): a braam and a deep hit as each chapter begins, a boom on every beat, a tuned pulse on
    # every cut, one step higher with each chapter; IX in 16ths; X in 16ths with a rising tone, to the question's hit
    notas = [50, 53, 55, 57, 60, 62, 65, 67, 69, 74]
    for k, a, n, d in PLAN["bloques"]:
        x0 = HIPER + a
        B(x0, [26, 38, 45] if k % 2 else [33, 45, 50], 5.0, 0.6, ataque=0.02, abre=1.2, brillo=1.15); poner(m, x0, bombo(1.6), 0.85)
        sub_ = 0.5 if k <= 8 else 0.25
        for i in range(int(round(d / sub_))):
            x = x0 + i * sub_
            poner(m, x, bombo(0.8 if sub_ == 0.5 else 0.6), (0.5 if i % 2 == 0 else 0.35) + 0.02 * k)
            p2(x + (0.25 if sub_ == 0.5 else 0.0), notas[k - 1] + [0, 7, 12, 7][i % 4], 0.5, 0.1 + 0.006 * k)
    poner(m, HIPER + PLAN["bloques"][-1][1], con_reverb(shepard(PLAN["bloques"][-1][3], sube=1 / 2.5, suelta=0.05), SALA, 0.4), 0.55)
    poner(m, I4 - 4.0, oleaje(4.0), 0.6)
    B(I4, [26, 33, 38, 45, 50], 7.0, 1.0, ataque=0.004, abre=1.6, brillo=1.3); poner(m, I4, bombo(2.2), 1.0)
    poner(m, I4 + 0.8, con_reverb(voz([(50, 2.5), (57, 3.0)], "o", vib=2.0), SALA, 0.75), 0.1)
    # the end
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
    with wave.open(str(AQUI / "audio8.wav"), "wb") as w:
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
    (AQUI / "subs8.json").write_text(json.dumps({"cues": cues, "dur": DUR}, ensure_ascii=False))
    f = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round((x % 1) * 1000)):03d}"
    srt = sorted([(a, b, " ".join(w for w, _ in ws)) for a, b, ws in cues] + [(I4 + 0.35, I4 + 2.9, "¿Hasta dónde llega una forma?")])
    (AQUI / "trailer8.srt").write_text("\n".join(f"{i}\n{f(a)} --> {f(b)}\n{t}\n" for i, (a, b, t) in enumerate(srt, 1)))
    subprocess.run(["npx", "remotion", "render", "src/index.ts", "SubsTrailer", str(AQUI / "subs8.mov"), f"--props={AQUI / 'subs8.json'}",
                    "--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png", "--log=error"], cwd=ANI, check=True)


if __name__ == "__main__":
    pasos = sys.argv[1:] or ["imagen", "sonido", "subs", "mezcla"]
    if "imagen" in pasos: imagen()
    if "sonido" in pasos: sonido()
    if "subs" in pasos: subtitulos()
    if "mezcla" in pasos:
        out = Path.home() / "Development/BN_Videos/entregables/La-frontera/Trailer/La-frontera-trailer-v8.mp4"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(AQUI / "video8.mp4"), "-i", str(AQUI / "subs8.mov"), "-i", str(AQUI / "audio8.wav"),
                        "-filter_complex", f"[0:v][1:v]overlay=0:0:format=auto,fade=t=out:st={DUR - 2.5:.2f}:d=2.5,format=yuv420p[v]", "-map", "[v]", "-map", "2:a",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(out)], check=True)
        import shutil; shutil.copy(AQUI / "trailer8.srt", out.with_suffix(".srt"))
        print("listo", out, round(DUR, 2), "s")
