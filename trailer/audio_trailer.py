"""LA FRONTERA · trailer v1, the sound: the film's own sound where the picture is the film's own moment (the cold open,
the title, the mark), and between them a new score in the palette of the whole film (fractales/animatic/audio/dune.py):
a hit on every act and every question, half a second of silence before the hypercut, the hypercut at 120 BPM that
speeds up to a hit, and the voice (public/voz/trailer, the film's voice, checked with verifica_idioma.py).

usage: PYTHONPATH=../animatic/pylib python3 audio_trailer.py  → audio.wav, then trailer.mp4 (picture from arma_trailer.py)
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

AQUI = Path(__file__).resolve().parent
ANI = AQUI.parent / "animatic"
sys.path.insert(0, str(ANI / "audio"))
from dune import SALA, SALA_C, SR, bombo, braam, con_reverb, hz, oleaje, poner, sub, t_, voz  # noqa: E402

FILM = Path.home() / "Development/BN_Videos/entregables/La-frontera/Corrido/La-frontera-corrido-v6.mp4"
DUR = 160.0
N = int(DUR * SR)
m = np.zeros((N, 2))


def pulso(f, dur=0.8):
    t = t_(int(dur * SR)); env = (1 - np.exp(-t * 400)) * np.exp(-t * 6)
    return env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.6 * np.sin(np.pi * f * t))


def p(t, nota, dur=1.0, vol=0.26, sala=SALA_C, mezcla=0.35):
    poner(m, t, con_reverb(pulso(hz(nota), dur), sala, mezcla), vol)


def shepard(dur, sube=1 / 9, f0=55.0, n=8, centro=440.0, suelta=0.3):
    k = int(dur * SR); t = np.arange(k) / SR; x = np.zeros(k)
    for i in range(n):
        pos = (i + sube * t) % n; f = f0 * 2 ** pos
        x += np.exp(-0.5 * (np.log2(f / centro) / 1.3) ** 2) * np.sin(2 * np.pi * np.cumsum(f) / SR)
    return x / n * np.minimum(1, t / 2.0) * np.clip((dur - t) / suelta, 0, 1)


def pelicula(t0, dur):
    """the film's own sound for a span (stereo, SR)"""
    out = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{t0:.3f}", "-i", str(FILM), "-t", f"{dur:.3f}", "-vn", "-ac", "2", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(out, np.int16).reshape(-1, 2).astype(float) / 32767


def mp3(ruta):
    out = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(ruta), "-ac", "2", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(out, np.int16).reshape(-1, 2).astype(float) / 32767


def rampa(x, ent=0.0, sal=0.0):
    n = len(x); g = np.ones(n)
    if ent: g[:int(ent * SR)] = np.linspace(0, 1, int(ent * SR))
    if sal: g[n - int(sal * SR):] = np.minimum(g[n - int(sal * SR):], np.linspace(1, 0, int(sal * SR)))
    return x * g[:, None]


# ── the score, 20 → 135 ──
partitura = np.zeros((N, 2)); mm = m
m = partitura
poner(m, 20.0, con_reverb(braam([26, 38, 45], 7.0, ataque=0.03, abre=1.2, brillo=1.1), SALA, 0.55), 0.85)
poner(m, 20.0, bombo(1.4), 0.9)
poner(m, 20.0, sub(26, 79.5, ataque=3.0, sat=0.7), 0.14)
for i in range(14):
    p(20.0 + i * 1.0, [50, 57, 62, 57][i % 4], 1.2, 0.1, SALA, 0.5)
poner(m, 21.5, con_reverb(voz([(62, 4.0), (66, 4.0), (69, 5.0)], "a", vib=3.5), SALA, 0.7), 0.14)
poner(m, 34.0, con_reverb(braam([33, 45, 50], 7.0, ataque=0.05, abre=1.4, brillo=1.1), SALA, 0.55), 0.75)
poner(m, 34.0, bombo(1.2), 0.8)
poner(m, 35.0, con_reverb(voz([(66, 4.0), (69, 4.0), (74, 6.0)], "a", vib=4.0), SALA, 0.7), 0.17)
poner(m, 45.0, oleaje(1.6), 0.45)
poner(m, 46.0, con_reverb(shepard(9.4, sube=1 / 7), SALA, 0.5), 0.45)
for x, br in [(55.0, [26, 38, 45]), (62.0, [33, 45, 50]), (69.0, [26, 38, 50])]:          # the three questions
    poner(m, x, con_reverb(braam(br, 5.0, ataque=0.01, abre=1.0, brillo=1.2), SALA, 0.5), 0.7)
    poner(m, x, bombo(1.3), 0.85)
cor = None
try:
    w = wave.open(str(ANI / "public/audio/corazon.wav")); cor = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, w.getnchannels()).astype(float) / 32767
    poner(m, 69.2, con_reverb(rampa(cor[int(20 * SR):int(26.5 * SR)], 0.3, 1.2), SALA_C, 0.25), 0.8)   # the heart: real beats
except Exception:
    pass
poner(m, 76.0, oleaje(4.0), 0.6)
poner(m, 80.0, con_reverb(braam([26, 33, 38, 45], 9.0, ataque=0.01, abre=1.5, brillo=1.25), SALA, 0.55), 0.9)
poner(m, 80.0, bombo(1.8), 1.0)
poner(m, 81.5, con_reverb(voz([(57, 5.0), (62, 6.0)], "o", vib=2.5), SALA, 0.7), 0.14)
poner(m, 92.0, con_reverb(shepard(7.4, sube=1 / 10, suelta=0.2), SALA, 0.5), 0.4)
poner(m, 92.0, sub(26, 7.4, ataque=2.0, sat=0.8), 0.18)
# THE HYPERCUT: 120 BPM, a boom on every beat, tuned pulses climbing, a braam every two bars; the last 8 s in 16ths
for i in range(50):
    x = 100.0 + i * 0.5
    poner(m, x, bombo(0.9 + 0.3 * (i % 4 == 0)), 0.55 + 0.25 * (i % 4 == 0))
    p(x + 0.25, [50, 57, 62, 66, 69, 74][(i // 4) % 6], 0.6, 0.12, SALA_C, 0.4)
    if i % 8 == 0: poner(m, x, con_reverb(braam([26, 38, 45] if i % 16 == 0 else [33, 45, 50], 4.0, ataque=0.02, abre=1.0, brillo=1.1), SALA, 0.5), 0.5)
for i in range(32):
    x = 117.0 + i * 0.25
    poner(m, x, bombo(0.7), 0.35 + 0.02 * i)
    p(x, [62, 66, 69, 74, 78, 81, 86, 90][i // 4], 0.4, 0.1 + 0.004 * i, SALA_C, 0.4)
poner(m, 117.0, con_reverb(shepard(8.0, sube=1 / 3, suelta=0.05), SALA, 0.4), 0.5)
poner(m, 117.0, oleaje(8.0), 0.55)
poner(m, 125.0, con_reverb(braam([26, 33, 38, 45, 50], 10.0, ataque=0.005, abre=1.6, brillo=1.3), SALA, 0.55), 1.0)
poner(m, 125.0, bombo(2.0), 1.0)
poner(m, 125.6, con_reverb(voz([(62, 3.0), (66, 3.0), (69, 4.0)], "a", vib=4.0), SALA, 0.7), 0.16)
poner(m, 131.0, oleaje(4.0), 0.5)
poner(m, 125.0, sub(26, 10.5, ataque=1.0, sat=0.7), 0.16)
silencio = (np.arange(N) / SR > 99.45) & (np.arange(N) / SR < 100.0)            # half a second before the hypercut
partitura[silencio] *= 0.0
partitura *= np.clip((135.6 - np.arange(N) / SR) / 0.6, 0, 1)[:, None]          # into the title's own sound
partitura = partitura / max(1e-9, np.abs(partitura).max()) * 0.8
m = mm

# ── the voice (ducked score under it) ──
V = json.loads((ANI / "src/trailer_voz.json").read_text())
T_VOZ = [21.0, 35.0, 56.0, 62.6, 69.6, 81.0, 92.4, 125.6]
voces = np.zeros((N, 2)); duck = np.ones(N); tt = np.arange(N) / SR
for k, (t0, v) in enumerate(zip(T_VOZ, V)):
    poner(voces, t0, mp3(ANI / f"public/voz/trailer/{k + 1}.mp3"), 1.0)
    duck -= 0.45 * np.clip(np.minimum((tt - t0 + 0.3) / 0.3, (t0 + v["fin"] + 0.4 - tt) / 0.5), 0, 1)
partitura *= np.clip(duck, 0.5, 1)[:, None]

# ── the film's own sound: the cold open, the title, the card, the mark ──
pel = np.zeros((N, 2))
poner(pel, 0.0, rampa(pelicula(0.0, 20.4), 0, 0.4), 1.0)
poner(pel, 135.0, rampa(pelicula(3736.9, 12.0), 0.15, 0.8), 1.0)
poner(pel, 147.0, rampa(pelicula(3811.6, 13.0), 0.3, 2.0), 1.0)

mezcla = pel + partitura * 0.9 + voces * 0.95
mezcla = mezcla / max(1e-9, np.abs(mezcla).max()) * 0.9
with wave.open(str(AQUI / "audio.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mezcla, -1, 1) * 32767).astype("<i2").tobytes())
# final: picture + sound, loudness for YouTube (−14 LUFS, −1.5 dBTP)
SAL = Path.home() / "Development/BN_Videos/entregables/La-frontera/Trailer/La-frontera-trailer-v1.mp4"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(AQUI / "video.mp4"), "-i", str(AQUI / "audio.wav"), "-map", "0:v", "-map", "1:a",
                "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(SAL)], check=True)
print("listo", SAL)
