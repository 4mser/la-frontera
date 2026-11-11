"""LA FRONTERA · YouTube episodes: the «next chapter» preview that closes each episode (a mini trailer, ~22 s).

Grammar of the approved trailer (fractales/trailer/audio_trailer.py), at 120 BPM:
  card «EN EL PRÓXIMO CAPÍTULO» over a dimmed shot + the voice «En el próximo capítulo de La frontera.» (braam + boom)
  → hook A and hook B: the film's clean voice (public/voz/cN) over the shot where the film says it (boom on the cut)
  → hypercut: 8 shots of the chapter, one per beat, pulses climbing → half a second of silence
  → HIT: the chapter's own title card (braam + boom + choir), fade to black.
The label «PRÓXIMO CAPÍTULO · N» stays top-left over the hooks and the hypercut.

usage: PYTHONPATH=../animatic/pylib python3 arma_previas.py [chapter numbers, default 2..10]  → previas/previa-N.mp4 (4K)
"""
import json, re, subprocess, sys, unicodedata, wave
from pathlib import Path
import numpy as np

AQUI = Path(__file__).resolve().parent
ANI = AQUI.parent / "animatic"
sys.path.insert(0, str(ANI / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, hz, oleaje, poner, sub, t_, voz  # noqa: E402

MASTER = Path.home() / "Development/BN_Videos/entregables/La-frontera/YouTube/La-frontera-YouTube-4K.mp4"
SRT = Path.home() / "Development/BN_Videos/entregables/La-frontera/YouTube/La-frontera.es.srt"
B = 0.5                                                     # one beat at 120 BPM

# chapter: span in the master, its title card [start, length], and two hooks (voice line, first words, last words)
CAPS = {   # hiper/fondo chosen by hand from contact sheets of each chapter (every 3 s); vis = picture for a hook, if not its own
    2: dict(span=(483.0, 1010.67), titulo=(485.6, 5.0), ganchos=[(17, "Cada punto", "un mundo"), (53, "Tiene área", "o nula")],
            hiper=[495.5, 546.0, 642.5, 725.0, 800.0, 852.0, 918.0, 994.5], fondo=725.0),
    3: dict(span=(1012.03, 1369.10), titulo=(1018.6, 4.6), ganchos=[(8, "Para la frontera", "doscientos catorce"), (28, "Medir también", "una escala", 1154.5)],
            hiper=[1036.0, 1144.0, 1183.0, 1234.0, 1267.0, 1297.0, 1303.0, 1318.0], fondo=1267.0),
    4: dict(span=(1373.43, 1660.0), titulo=(1376.6, 4.8), ganchos=[(6, "Con miles", "vuelven a abrir"), (22, "La misma apariencia", "muy distintas")],
            hiper=[1394.4, 1397.4, 1400.4, 1439.4, 1463.4, 1502.4, 1529.4, 1568.4], fondo=1499.4),
    5: dict(span=(1670.0, 2082.17), titulo=(1678.4, 5.0), ganchos=[(1, "Debería un", "mismo tiempo", 1742.0), (26, "Un corazón que", "de alarma")],
            hiper=[1688.0, 1760.0, 1781.0, 1904.0, 1955.0, 1988.0, 2030.0, 2063.0], fondo=1955.0),
    6: dict(span=(2087.0, 2352.60), titulo=(2087.8, 5.0), ganchos=[(17, "El caos tiene", "se deja ver"), (1, "Cómo puede", "ser impredecible")],
            hiper=[2159.0, 2165.0, 2210.0, 2222.0, 2231.0, 2243.0, 2270.0, 2279.0], fondo=2231.0),
    7: dict(span=(2353.63, 2682.47), titulo=(2358.4, 3.8), ganchos=[(3, "Así que fabricó", "a su balcón"), (13, "puede la forma", "sobre la salud")],
            hiper=[2386.6, 2389.6, 2425.6, 2467.6, 2503.6, 2509.6, 2650.6, 2677.6], fondo=2467.6),
    8: dict(span=(2682.70, 3013.60), titulo=(2691.8, 4.8), ganchos=[(4, "Y entre un tejido", "de magnitud", 2703.7), (11, "En los años", "fractal sin fin", 2979.7)],
            hiper=[2685.7, 2697.7, 2718.7, 2778.7, 2814.7, 2829.7, 2859.7, 2910.7], fondo=2700.7),
    9: dict(span=(3018.0, 3205.27), titulo=(3018.8, 5.0), ganchos=[(1, "En mil seiscientos", "lengua matemática"), (3, "Por qué funciona", "deja de funcionar")],
            hiper=[3027.7, 3033.7, 3057.7, 3066.7, 3105.7, 3132.7, 3147.7, 3195.7], fondo=3132.7),
    10: dict(span=(3210.0, 3776.0), titulo=(3275.3, 4.8), ganchos=[(6, "Desde lo más grande", "ninguna medición", 3291.0), (13, "Cincuenta y seis", "Completa", 3445.5)],
             hiper=[3303.0, 3336.0, 3363.0, 3402.0, 3507.0, 3594.0, 3657.0, 3705.0], fondo=3438.0),
}


def palabras_de(s):
    return re.findall(r"[\wáéíóúüñÁÉÍÓÚÜÑ]+", s)


def plano(s):
    s = unicodedata.normalize("NFD", s.lower())
    return " ".join(palabras_de("".join(ch for ch in s if unicodedata.category(ch) != "Mn")))


def corte_voz(cap, linea, desde, hasta):
    """[start, end] of a phrase inside public/voz/c{cap}/{linea}.mp3, by the word timings."""
    v = json.loads((ANI / f"src/cap{cap}_voz.json").read_text())[linea - 1]
    pal = v["palabras"]; ws = [plano(w) for w, _ in pal]
    a = plano(desde).split(); b = plano(hasta).split()
    i = next(k for k in range(len(ws)) if ws[k:k + len(a)] == a)
    j = next(k for k in range(i, len(ws)) if ws[k:k + len(b)] == b) + len(b) - 1
    t0 = max(0.0, pal[i][1] - 0.06)
    t1 = pal[j + 1][1] - 0.08 if j + 1 < len(pal) else v["fin"] + 0.12
    return t0, t1, " ".join(ws[i:i + 4])


def cues():
    out = []
    for blq in SRT.read_text().strip().split("\n\n"):
        l = blq.split("\n")
        if len(l) < 3: continue
        h = re.findall(r"(\d+):(\d+):(\d+),(\d+)", l[1])[0]
        out.append((int(h[0]) * 3600 + int(h[1]) * 60 + int(h[2]) + int(h[3]) / 1000, plano(" ".join(l[2:]))))
    return out


CUES = cues()


def en_pelicula(clave, span):
    """master time where the film says these words (the cue, or two joined cues, that hold the phrase's first four)."""
    for n in (4, 3, 2):
        c = " ".join(clave.split()[:n])
        hits = [t for (t, txt), (_, sig) in zip(CUES, CUES[1:] + [(0, "")]) if c in txt + " " + sig and span[0] <= t <= span[1]]
        if hits:
            return hits[0]
    raise ValueError(clave)


def cuadros(t0, dur, fps=1.0, w=192, h=108):
    out = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{t0:.3f}", "-i", str(MASTER), "-t", f"{dur:.3f}", "-an",
                          "-vf", f"fps={fps},scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(out, np.uint8).reshape(-1, h, w, 3).astype(float) / 255


def hipercorte(cap, evitar, n=8):
    """n shots for the hypercut: bright, colourful, detailed frames of the chapter, spread over it, steady for a beat."""
    a, b = CAPS[cap]["span"]
    F = cuadros(a, b - a, fps=2.0)
    ts = a + np.arange(len(F)) / 2.0
    lum = F.mean(3); sat = F.max(3) - F.min(3)
    det = np.abs(np.diff(lum, axis=1)).mean((1, 2)) + np.abs(np.diff(lum, axis=2)).mean((1, 2))
    base = (lum.mean((1, 2)) ** 0.6) * (0.4 + sat.mean((1, 2))) * (det * 40)
    cambio = np.r_[np.abs(np.diff(lum, axis=0)).mean((1, 2)), 1.0]
    for umbral, quieto in [(0.09, 0.035), (0.05, 0.035), (0.03, 0.05)]:          # dark chapters (the heart) get lower bars
        score = base * (lum.mean((1, 2)) > umbral) * (cambio < quieto)       # same shot half a second later
        for e in evitar:
            score[np.abs(ts - e) < 8] = 0
        score[ts < a + 12] = 0                                                    # not the title card
        orden = [k for k in np.argsort(-score) if score[k] > 0]
        for sep in [(b - a) / (n + 3), (b - a) / (n * 2), 6.0]:      # spread them out, as far as the chapter allows
            elegidos = []
            for k in orden:
                if all(abs(ts[k] - t) > sep for t in elegidos):
                    elegidos.append(ts[k])
                if len(elegidos) == n: return sorted(elegidos), elegidos[0]
    raise ValueError(f"cap {cap}: only {len(elegidos)} shots")


def mp3(ruta, t0=0.0, t1=None):
    args = ["ffmpeg", "-loglevel", "error", "-ss", f"{t0:.3f}", "-i", str(ruta)] + (["-t", f"{t1 - t0:.3f}"] if t1 else []) + ["-ac", "2", "-ar", str(SR), "-f", "s16le", "-"]
    return np.frombuffer(subprocess.run(args, capture_output=True, check=True).stdout, np.int16).reshape(-1, 2).astype(float) / 32767


def rampa(x, ent=0.0, sal=0.0):
    n = len(x); g = np.ones(n)
    if ent: g[:int(ent * SR)] = np.linspace(0, 1, int(ent * SR))
    if sal: g[n - int(sal * SR):] = np.minimum(g[n - int(sal * SR):], np.linspace(1, 0, int(sal * SR)))
    return x * g[:, None]


def pulso(f, dur=0.8):
    t = t_(int(dur * SR)); env = (1 - np.exp(-t * 400)) * np.exp(-t * 6)
    return env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.6 * np.sin(np.pi * f * t))


def shepard(dur, sube=1 / 3, f0=55.0, n=8, centro=440.0, suelta=0.05):
    k = int(dur * SR); t = np.arange(k) / SR; x = np.zeros(k)
    for i in range(n):
        pos = (i + sube * t) % n; f = f0 * 2 ** pos
        x += np.exp(-0.5 * (np.log2(f / centro) / 1.3) ** 2) * np.sin(2 * np.pi * np.cumsum(f) / SR)
    return x / n * np.minimum(1, t / 1.0) * np.clip((dur - t) / suelta, 0, 1)


def arriba(x):
    return np.ceil(x / B - 1e-6) * B


def previa(cap):
    C = CAPS[cap]
    vozA, vozB = [corte_voz(cap, *g[:3]) for g in C["ganchos"]]
    tA, tB = [g[3] if len(g) > 3 else en_pelicula(v[2], C["span"]) for g, v in zip(C["ganchos"], (vozA, vozB))]
    vozA, vozB = vozA[:2], vozB[:2]
    intro_v = mp3(AQUI / "voz/intro.mp3"); d_intro = len(intro_v) / SR
    # timeline (beats)
    T_INTRO = 0.0; D_INTRO = arriba(0.5 + d_intro + 0.6)
    T_A = T_INTRO + D_INTRO; D_A = arriba(vozA[1] - vozA[0] + 0.25 + 0.6)
    T_B = T_A + D_A; D_B = arriba(vozB[1] - vozB[0] + 0.25 + 0.6)
    T_H = T_B + D_B; NH = 8; D_H = NH * B  # (hipercorte always returns NH shots)
    T_S = T_H + D_H; D_S = 0.5                                       # silence (black)
    T_T = T_S + D_S; D_T = C["titulo"][1]
    DUR = T_T + D_T
    hiper, fondo = (C["hiper"], C["fondo"]) if "hiper" in C else hipercorte(cap, [tA, tB])

    # ── picture ──
    seg = [(fondo, D_INTRO, "intro"), (tA, D_A, "a"), (tB, D_B, "b")] + [(h, B, "h") for h in hiper] + [(None, D_S, "negro"), (C["titulo"][0], D_T, "titulo")]
    ins, fil, k = [], [], 0
    for i, (t0, d, tipo) in enumerate(seg):
        if tipo == "negro":
            fil.append(f"color=c=black:s=3840x2160:r=30:d={d:.3f},format=yuv420p[s{i}]")
            continue
        ins += ["-ss", f"{t0:.3f}", "-t", f"{d:.3f}", "-i", str(MASTER)]
        f = f"[{k}:v]setpts=PTS-STARTPTS,fps=30,format=yuv420p"
        if tipo == "intro":
            f += f",crop=iw/1.6:ih/1.6,scale=3840:2160,eq=brightness=-0.08:saturation=0.85,lutyuv=y=val*0.55,gblur=sigma=22,fade=in:d=0.4,fade=out:st={d - 0.12:.3f}:d=0.12"
        elif tipo == "titulo":
            f += f",fade=in:d=0.15,fade=out:st={d - 0.9:.3f}:d=0.9"
        fil.append(f + f"[s{i}]"); k += 1
    nv = len(seg)
    ins += ["-loop", "1", "-t", f"{DUR:.3f}", "-i", str(AQUI / "graficos/tarjeta.png"),
            "-loop", "1", "-t", f"{DUR:.3f}", "-i", str(AQUI / f"graficos/rotulo_{cap}.png")]
    fil.append("".join(f"[s{i}]" for i in range(nv)) + f"concat=n={nv}:v=1:a=0[base]")
    fil.append(f"[{k}:v]format=rgba,fade=in:st=0.35:d=0.5:alpha=1,fade=out:st={D_INTRO - 0.45:.3f}:d=0.35:alpha=1[tj]")
    fil.append(f"[{k + 1}:v]format=rgba,fade=in:st={T_A + 0.2:.3f}:d=0.4:alpha=1,fade=out:st={T_S - 0.25:.3f}:d=0.25:alpha=1[ro]")
    fil.append("[base][tj]overlay=0:0:enable='lt(t,%.3f)'[b1];[b1][ro]overlay=0:0:enable='between(t,%.3f,%.3f)',format=yuv420p[v]" % (D_INTRO, T_A, T_S))

    # ── sound ──
    N = int((DUR + 0.5) * SR); m = np.zeros((N, 2))

    def p(t, nota, dur=1.0, vol=0.26, sala=SALA_C, mezcla=0.35):
        poner(m, t, con_reverb(pulso(hz(nota), dur), sala, mezcla), vol)

    poner(m, 0.0, con_reverb(braam([26, 38, 45], 6.0, ataque=0.03, abre=1.2, brillo=1.1), SALA, 0.55), 0.8)
    poner(m, 0.0, bombo(1.4), 0.9)
    poner(m, 0.0, sub(26, T_S + 0.3, ataque=1.5, sat=0.7), 0.15)
    poner(m, 0.6, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 4.0)], "a", vib=3.5), SALA, 0.7), 0.12)
    nb = int(round((T_H - T_A) / B))
    for i in range(nb):                                              # the hooks: a soft pulse on every beat
        x = T_A + i * B
        p(x, [50, 57, 62, 57][i % 4], 1.0, 0.09, SALA, 0.5)
        if i % 2 == 0: poner(m, x, bombo(0.6), 0.28)
    for x, br in [(T_A, [33, 45, 50]), (T_B, [26, 38, 50])]:
        poner(m, x, con_reverb(braam(br, 4.5, ataque=0.01, abre=1.0, brillo=1.15), SALA, 0.5), 0.6)
        poner(m, x, bombo(1.2), 0.8)
    poner(m, T_B - 1.5, oleaje(1.5), 0.35)
    for i in range(NH):                                              # the hypercut: a boom per shot, pulses climbing
        x = T_H + i * B
        poner(m, x, bombo(0.9 + 0.3 * (i % 4 == 0)), 0.6 + 0.2 * (i % 4 == 0))
        p(x, [62, 66, 69, 74, 78, 81, 86, 90][i], 0.5, 0.11 + 0.01 * i, SALA_C, 0.4)
        p(x + B / 2, [62, 66, 69, 74, 78, 81, 86, 90][i], 0.3, 0.07 + 0.006 * i, SALA_C, 0.4)
    poner(m, T_H, con_reverb(shepard(D_H), SALA, 0.4), 0.45)
    poner(m, T_H, oleaje(D_H), 0.5)
    tt = np.arange(N) / SR
    m[(tt > T_S) & (tt < T_T)] *= 0.0                                # half a second of silence
    poner(m, T_T, con_reverb(braam([26, 33, 38, 45, 50], 8.0, ataque=0.005, abre=1.6, brillo=1.3), SALA, 0.55), 1.0)
    poner(m, T_T, bombo(2.0), 1.0)
    poner(m, T_T, sub(26, D_T + 0.5, ataque=0.5, sat=0.7), 0.16)
    poner(m, T_T + 0.4, con_reverb(voz([(62, 2.0), (66, 2.0), (69, 3.0)], "a", vib=4.0), SALA, 0.7), 0.15)
    m *= np.clip((DUR - tt) / 1.0, 0, 1)[:, None]
    m = m / max(1e-9, np.abs(m).max()) * 0.8
    # the voices, with the score ducked under them
    voces = np.zeros((N, 2)); duck = np.ones(N)
    for t0, x in [(0.45, intro_v), (T_A + 0.25, mp3(ANI / f"public/voz/c{cap}/{C['ganchos'][0][0]}.mp3", *vozA)),
                  (T_B + 0.25, mp3(ANI / f"public/voz/c{cap}/{C['ganchos'][1][0]}.mp3", *vozB))]:
        x = rampa(x, 0.02, 0.06)
        poner(voces, t0, x, 1.0)
        d = len(x) / SR
        duck -= 0.5 * np.clip(np.minimum((tt - t0 + 0.3) / 0.3, (t0 + d + 0.3 - tt) / 0.4), 0, 1)
    m *= np.clip(duck, 0.45, 1)[:, None]
    mezcla = m * 0.9 + voces
    mezcla = mezcla / max(1e-9, np.abs(mezcla).max()) * 0.9
    (AQUI / "previas").mkdir(exist_ok=True)
    wav = AQUI / f"previas/previa-{cap}.wav"
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(mezcla, -1, 1) * 32767).astype("<i2").tobytes())
    ins += ["-i", str(wav)]
    sal = AQUI / f"previas/previa-{cap}.mp4"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y"] + ins + ["-filter_complex", ";".join(fil), "-map", "[v]", "-map", f"{k + 2}:a",
                    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:v", "hevc_videotoolbox", "-b:v", "45M", "-tag:v", "hvc1",
                    "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-t", f"{DUR:.3f}", str(sal)], check=True)
    info = dict(cap=cap, dur=DUR, ganchos=[tA, tB], voz=[vozA, vozB], hiper=hiper, tiempos=dict(A=T_A, B=T_B, H=T_H, T=T_T))
    (AQUI / f"previas/previa-{cap}.json").write_text(json.dumps(info, indent=1))
    print(cap, f"{DUR:.1f}s", "ganchos en", tA, tB, "hiper", [round(h, 1) for h in hiper])


if __name__ == "__main__":
    for c in [int(a) for a in sys.argv[1:]] or list(range(2, 11)):
        previa(c)
