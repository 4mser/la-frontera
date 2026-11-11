"""LA FRONTERA · reel 9:16: the whole film on fast-forward, like a VHS tape.

  0.0  ▶ PLAY: the film plays, at its own speed
  1.8  clunk: ▶▶, the tape speeds up (×40 → ×200): the picture jumps from moment to moment through tracking noise,
       the sound is the film itself squealing past, over the motor's whine; the counter runs to 1:03:58 and every
       chapter's number and name comes up as the tape crosses it
 30.0  ■ STOP (a clunk, a burst of noise), and the end card (VideoCierreReel): the title, what it is, the premiere

usage: PYTHONPATH=../animatic/pylib python3 reel_rebobinado.py
"""
import json, subprocess, sys, wave
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

AQUI = Path(__file__).resolve().parent
ANI = AQUI.parent / "animatic"
sys.path.insert(0, str(ANI / "audio"))
from dune import SALA, SR, bombo, braam, con_reverb, poner, sub, voz  # noqa: E402

FILM = Path.home() / "Development/BN_Videos/entregables/La-frontera/Corrido/La-frontera-corrido-v7.mp4"
R = AQUI / "reel"; R.mkdir(exist_ok=True)
FR = R / "cuadros"; FR.mkdir(exist_ok=True)
FPS, W, H = 30, 1080, 1920
T_PLAY, T_FF, T_STOP, T_FIN = 0.0, 1.8, 30.0, 36.4
F0, FEND = 10.0, 3838.3
CAPS = [(0.0, "", "APERTURA"), (178.987, "CAPÍTULO I", "LA REGLA"), (479.36, "CAPÍTULO II", "ENTRE LA NADA Y EL ALGO"), (1011.31, "CAPÍTULO III", "LA MEDIDA DE LO IRREGULAR"),
        (1369.81, "CAPÍTULO IV", "CÓMO CRECE UNA FORMA"), (1665.92, "CAPÍTULO V", "UN CORAZÓN NO ES UN METRÓNOMO"), (2082.86, "CAPÍTULO VI", "LA MISMA REGLA, EN EL TIEMPO"),
        (2353.24, "CAPÍTULO VII", "DEL PATRÓN A LA HERRAMIENTA"), (2647.43, "CAPÍTULO VIII", "¿HASTA DÓNDE LLEGA LA ESTRUCTURA?"), (2974.74, "CAPÍTULO IX", "EL LENGUAJE Y SUS RANGOS"),
        (3166.98, "CAPÍTULO X", "LA FRONTERA")]
F_PLAY = F0 + T_FF                                 # where the fast-forward starts in the film


# the fast-forward: steady at V0 for a while, then it speeds up exponentially, faster and faster, to the stop
T_ACEL, V0 = 7.0, 30.0
_F_ACEL = F_PLAY + V0 * (T_ACEL - T_FF)
def _resto(k): return V0 * (np.exp(k * (T_STOP - T_ACEL)) - 1) / k
_lo, _hi = 1e-4, 2.0
for _ in range(80):                                  # the rate that lands the tape exactly on the film's end
    _mid = (_lo + _hi) / 2
    if _resto(_mid) > FEND - 1.0 - _F_ACEL: _hi = _mid
    else: _lo = _mid
K_ACEL = (_lo + _hi) / 2


def pelicula(t):
    """film time shown at reel time t (play, then the fast-forward)"""
    if t < T_FF: return F0 + t
    if t < T_ACEL: return F_PLAY + V0 * (t - T_FF)
    return _F_ACEL + V0 * (np.exp(K_ACEL * (min(t, T_STOP) - T_ACEL)) - 1) / K_ACEL


def velocidad(t):
    if t < T_FF: return 1.0
    dt = 1 / FPS
    return (pelicula(t + dt) - pelicula(t)) / dt


def _entrada(a):
    return next((x / 300 for x in range(int(T_FF * 300), int(T_STOP * 300)) if pelicula(x / 300) >= a), None)
ENTRADA = [T_PLAY] + [_entrada(a) for a, _, _ in CAPS[1:]]             # reel time at which the tape enters each chapter


def capitulo(f):
    k = max(i for i, (a, _, _) in enumerate(CAPS) if f >= a)
    return k


# ── the picture ──
def extrae(i):
    t = i / FPS
    out = FR / f"f{i:04d}.jpg"
    if not out.exists():
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{pelicula(t):.3f}", "-i", str(FILM), "-frames:v", "1", "-vf", "scale=1080:608", "-q:v", "2", str(out)], check=True)
    return out


MONO = "/System/Library/Fonts/Menlo.ttc"
SANS = str(ANI / "public/fonts")
def fuente(tam, peso="mono"):
    if peso == "mono": return ImageFont.truetype(MONO, tam, index=1)
    for f in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf",):
        return ImageFont.truetype(f, tam)


def vhs(a, t, rapido, rng):
    """the tape's look: colour bleeding sideways, scanlines, a soft picture; on fast-forward, noise bars that roll"""
    a = a.astype(np.float32)
    s = 3 + (5 if rapido else 0)
    a[..., 0] = np.roll(a[..., 0], s, axis=1); a[..., 2] = np.roll(a[..., 2], -s, axis=1)
    a[1::2] *= 0.86
    if rapido:
        h = a.shape[0]
        for k in range(2):
            y0 = int((t * (220 + 90 * k) + k * 260) % (h + 80)) - 40
            alto = rng.integers(10, 26)
            y1, y2 = max(0, y0), min(h, y0 + alto)
            if y2 > y1:
                ruido = rng.random((y2 - y1, a.shape[1], 1)) * 255
                a[y1:y2] = a[y1:y2] * 0.25 + ruido * 0.75
                a[y1:y2] = np.roll(a[y1:y2], rng.integers(-40, 40), axis=1)
        # the tracking tear near the bottom
        y = int(h * 0.86 + rng.integers(-6, 6))
        a[y:y + 8] = np.roll(a[y:y + 8], rng.integers(30, 120), axis=1)
        a += rng.normal(0, 9, a.shape)
    return np.clip(a, 0, 255).astype(np.uint8)


def cuadro(i):
    out = FR / f"r{i:04d}.jpg"
    if out.exists(): return out
    t = i / FPS; f = pelicula(t); rapido = t >= T_FF; rng = np.random.default_rng(i)
    lienzo = Image.new("RGB", (W, H), (3, 3, 7))
    img = Image.open(extrae(i)).convert("RGB")
    if rapido and rng.random() < 0.18: img = img.filter(ImageFilter.GaussianBlur(1.5))
    jit = int(rng.integers(-3, 4)) if rapido else 0
    lienzo.paste(Image.fromarray(vhs(np.asarray(img), t, rapido, rng)), (0, (H - 608) // 2 + jit))
    d = ImageDraw.Draw(lienzo)
    blanco = (238, 238, 232)
    # the OSD: the mode, the speed, the counter
    if t < T_FF: d.text((70, 330), "▶ PLAY", font=fuente(70), fill=blanco)
    else:
        v = velocidad(t); vv = int(round(v / 10) * 10)
        d.text((70, 330), f"▶▶ ×{vv}", font=fuente(70), fill=blanco)
    hh, mm, ss = int(f // 3600), int(f % 3600 // 60), int(f % 60)
    d.text((70, 420), f"{hh}:{mm:02d}:{ss:02d}", font=fuente(56), fill=blanco)
    d.text((W - 70, 330), "SP", font=fuente(56), fill=blanco, anchor="ra")
    # the chapter being crossed: it comes up when the tape enters it
    k = capitulo(f); a0 = CAPS[k][0]
    # reel time at which this chapter was entered
    tk = ENTRADA[k] or T_FF
    destello = max(0.0, 1 - (t - tk) / 0.25) if k > 0 else 0
    num, nombre = CAPS[k][1], CAPS[k][2]
    col = tuple(int(c + (255 - c) * destello) for c in (255, 190, 120))
    if num: d.text((W / 2, 1450), num, font=fuente(46), fill=col, anchor="mm")
    tam = 62 if len(nombre) < 22 else 50 if len(nombre) < 28 else 42
    d.text((W / 2, 1530), nombre, font=fuente(tam, "sans"), fill=tuple(int(c + (255 - c) * destello) for c in (255, 244, 222)), anchor="mm")
    # how much film there is, and where we are in it
    d.text((W / 2, 1700), "APERTURA · 10 CAPÍTULOS · 64 MIN", font=fuente(30), fill=(200, 200, 196), anchor="mm")
    x0, x1, y = 120, W - 120, 1770
    d.line([(x0, y), (x1, y)], fill=(90, 90, 96), width=4)
    for a, _, _ in CAPS[1:]: xa = x0 + (x1 - x0) * a / FEND; d.line([(xa, y - 10), (xa, y + 10)], fill=(150, 150, 156), width=2)
    d.line([(x0, y), (x0 + (x1 - x0) * f / FEND, y)], fill=(255, 190, 120), width=6)
    lienzo.save(out, quality=93)
    return out


def imagen():
    n = int(round(T_STOP * FPS))
    with ThreadPoolExecutor(8) as ex: list(ex.map(extrae, range(n)))
    with ThreadPoolExecutor(8) as ex: list(ex.map(cuadro, range(n)))
    # the STOP: the last frame, held, with a burst of noise; then the end card
    fin = np.asarray(Image.open(FR / f"r{n - 1:04d}.jpg")).astype(np.float32)
    rng = np.random.default_rng(1)
    for j in range(12):
        a = fin.copy(); k = 1 - j / 12
        a[(H - 608) // 2:(H + 608) // 2] = a[(H - 608) // 2:(H + 608) // 2] * (0.6 * k) + rng.random((608, W, 1)) * 255 * 0.5 * k
        im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)); dd = ImageDraw.Draw(im)
        dd.rectangle([60, 320, 600, 410], fill=(3, 3, 7)); dd.text((70, 330), "■ STOP", font=fuente(70), fill=(238, 238, 232))
        im.save(FR / f"r{n + j:04d}.jpg", quality=93)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", str(FPS), "-i", str(FR / "r%04d.jpg"), "-i", str(R / "cierre.mp4"),
                    "-filter_complex", f"[0:v]fps={FPS},format=yuv420p[a];[1:v]fps={FPS},format=yuv420p[b];[a][b]concat=n=2:v=1:a=0[v]", "-map", "[v]",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", str(R / "video.mp4")], check=True)


# ── the sound ──
def sonido():
    dur = T_STOP + 0.4 + 6.0
    N = int(dur * SR); m = np.zeros((N, 2)); tt = np.arange(N) / SR
    # the film's own sound, read as the tape passes: grains of it, sped up (the squeal of a fast-forward)
    print("leyendo el audio de la película…")
    b = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(FILM), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    pel = np.frombuffer(b, np.int16).astype(np.float32) / 32767
    g = int(0.03 * SR); ven = np.hanning(2 * g)
    cinta = np.zeros(N)
    for k in range(int(T_STOP * SR / g)):
        t = k * g / SR; f = pelicula(t); v = velocidad(t)
        pitch = 1.0 if t < T_FF else min(6.0, 1.6 + v / 90)           # higher as it goes faster
        s0 = int(f * SR); L = int(2 * g * pitch)
        trozo = pel[s0:s0 + L]
        if len(trozo) < L: break
        trozo = np.interp(np.linspace(0, L - 1, 2 * g), np.arange(L), trozo) * ven
        cinta[k * g:k * g + 2 * g] += trozo[:max(0, min(2 * g, N - k * g))]
    gan = np.where(tt < T_FF, 1.0, 0.55)
    m += (cinta * gan)[:, None]
    # the motor: a whine that rises with the speed, a hiss, a flutter; and the clunks of the buttons
    vel = np.array([velocidad(x) for x in np.arange(0, dur, 0.01)])
    v_s = np.interp(tt, np.arange(0, dur, 0.01), vel) * (tt >= T_FF) * (tt < T_STOP)
    f_w = 700 + 6 * v_s
    fase = 2 * np.pi * np.cumsum(f_w) / SR
    rng = np.random.default_rng(3)
    zumbido = (0.05 * np.sin(fase) + 0.02 * np.sin(2.01 * fase)) * (v_s > 0) * (1 + 0.3 * np.sin(2 * np.pi * 7 * tt))
    siseo = np.convolve(rng.normal(0, 1, N), np.ones(6) / 6, "same") * 0.03 * (v_s > 0)
    m += (zumbido + siseo)[:, None]
    def clunk(t0, vol=0.8):
        k = int(0.12 * SR); x = np.arange(k) / SR
        c = (np.sin(2 * np.pi * 90 * x) * np.exp(-x * 40) + rng.normal(0, 1, k) * np.exp(-x * 90) * 0.6) * vol
        poner(m, t0, np.stack([c, c], 1), 1.0)
    clunk(T_FF - 0.02); clunk(T_STOP, 1.0)
    for tk in ENTRADA[1:]:                                              # a tick as each chapter goes by
        if tk: clunk(tk, 0.25)
    m[(tt >= T_STOP) & (tt < T_STOP + 0.4)] *= np.linspace(1, 0, int(((tt >= T_STOP) & (tt < T_STOP + 0.4)).sum()))[:, None]
    m[tt >= T_STOP + 0.4] = 0
    poner(m, T_STOP, np.stack([rng.normal(0, 1, int(0.4 * SR)) * np.linspace(0.25, 0, int(0.4 * SR))] * 2, 1), 1.0)
    # the end card: the hit of the film's title, a choir, a low tone
    E = T_STOP + 0.4
    poner(m, E, con_reverb(braam([26, 33, 38, 45, 50], 6.0, ataque=0.01, abre=1.5, brillo=1.25), SALA, 0.55), 0.9)
    poner(m, E, bombo(2.0), 0.9)
    poner(m, E + 0.2, con_reverb(voz([(62, 2.5), (66, 2.5), (69, 3.0)], "a", vib=4.5), SALA, 0.7), 0.25)
    c_ = sub(26, 6.0, ataque=0.3, sat=0.7); poner(m, E, c_ if c_.ndim == 2 else np.stack([c_, c_], 1), 0.16)
    m *= np.clip((dur - tt) / 0.8, 0, 1)[:, None]
    m = m / max(1e-9, np.abs(m).max()) * 0.9
    with wave.open(str(R / "audio.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(m, -1, 1) * 32767).astype("<i2").tobytes())


if __name__ == "__main__":
    imagen(); sonido()
    out = Path.home() / "Development/BN_Videos/entregables/La-frontera/Trailer/La-frontera-reel-rebobinado.mp4"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(R / "video.mp4"), "-i", str(R / "audio.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(out)], check=True)
    print("listo", out)
