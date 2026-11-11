"""Provisional sound for the animatic, on the same time map as the picture (src/linea.json).

- corazon.wav: a real normal heart recording (PhysioNet/CinC Challenge 2016, record a0011, ODC-By 1.0),
  band-limited and slowed down for the silence before the title.
- musica.wav: temporary score in D, built in layers that follow the script (drone, pulse of the rule,
  orbit notes, the 100 000 points, the breathing chord and the approach to the border). Silences where the
  script asks for them.

Usage: PYTHONPATH=pylib python3 audio/generar_sonido.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ.parent.parent / "sonido-serie"))
from sonido import IR_GRANDE, IR_SALA, SR, con_reverb, filtro, hz, pad, pluck, t_  # noqa: E402

L = json.loads((RAIZ / "src" / "linea.json").read_text())
T = L["t"]
TOTAL = L["total"]
N = int(TOTAL * SR)


def escribir(nombre, x, pico=0.8):
    x = x / max(1e-9, np.abs(x).max()) * pico
    ruta = RAIZ / "public" / "audio" / nombre
    ruta.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(ruta), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    print("listo", nombre, f"{len(x) / SR:.1f} s")


def estereo(x):
    return np.stack([x, x], 1) if x.ndim == 1 else x


def poner(dst, t0, x, g=1.0):
    x = estereo(x) * g
    i = int(t0 * SR)
    if i >= len(dst):
        return
    k = min(len(x), len(dst) - i)
    dst[i:i + k] += x[:k]


def rampa(t, puntos):
    """Piecewise-linear gain from [(t, g), ...] evaluated on the time axis t."""
    xs, ys = zip(*puntos)
    return np.interp(t, xs, ys)


def leer_wav(ruta):
    w = wave.open(str(ruta))
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float)
    return x / np.abs(x).max(), sr


def remuestrear(x, sr_in, velocidad=1.0):
    """Resample to SR; velocidad < 1 plays slower and lower, like a tape."""
    n = int(len(x) / sr_in * SR / velocidad)
    pos = np.linspace(0, len(x) - 1, n)
    return np.interp(pos, np.arange(len(x)), x)


def corazon():
    x, sr = leer_wav(RAIZ / "datos" / "corazon" / "a0011.wav")
    x = filtro(x, corte_bajo=22, corte_alto=260, orden=2.0)
    x = x / np.abs(x).max()
    normal = remuestrear(x, sr)
    lento = remuestrear(x, sr, 0.78)
    pista = np.zeros((N, 2))
    t = t_(N)
    # real recording from the start until the silence, joined with a crossfade
    a = np.concatenate([normal, normal])
    poner(pista, T["corazon"], a * rampa(t_(len(a)), [(0, 0), (2.5, 1), (1e9, 1)]))
    corte = T["silencio1"]
    pista *= rampa(t, [(0, 1), (corte, 1), (corte + 1.4, 0), (TOTAL, 0)])[:, None]
    # slower and deeper from the silence to the title
    seg = lento[int(3.0 * SR):]
    poner(pista, corte, seg * rampa(t_(len(seg)), [(0, 0), (1.4, 1.1), (T["titulo"] - corte, 1.1), (T["tituloFin"] + 1.2 - corte, 0), (1e9, 0)]))
    return con_reverb(pista[:, 0], IR_SALA, 0.12)


def golpe(f=hz(38), dur=1.6, vel=1.0):
    n = int(dur * SR); t = t_(n)
    fr = f * (1 + 0.6 * np.exp(-t * 40))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 3.2) * np.minimum(1, t / 0.006)
    return filtro(x, corte_alto=400) * vel


def acorde(notas, dur, brillo=1400, ataque=2.5, g=1.0):
    return sum(pad(hz(m), dur, detune=0.08, brillo=brillo, ataque=ataque) for m in notas) * g


def musica():
    m = np.zeros((N, 2))
    t = t_(N)
    # 1 · drone under the prologue: D and A, very low, it breathes with the data
    d1 = acorde([38, 45, 50], T["silencio1"] + 1.0, brillo=700, ataque=6.0)
    poner(m, 1.0, d1 * rampa(t_(len(d1)), [(0, 0.6), (T["dfa"] - 1, 0.8), (T["dfaFin"], 1.0), (T["silencio1"] - 1.0, 0.9), (T["silencio1"], 0), (1e9, 0)]), 0.9)
    # 2 · the title: an open chord that blooms when the light writes LA FRONTERA
    tit = acorde([50, 57, 62, 64, 69], 8.0, brillo=2200, ataque=1.2)
    poner(m, T["titulo"], tit * rampa(t_(len(tit)), [(0, 0), (1.0, 1), (5.4, 1), (6.4, 0), (1e9, 0)]), 0.8)
    # 3 · the rule: one low pulse per stroke of z -> z^2 + c (the heartbeat turned into the motif)
    for k in range(6):
        poner(m, T["formula"] + 0.25 + k * 0.6, con_reverb(golpe(vel=0.9 if k % 2 == 0 else 0.6), IR_SALA, 0.25), 0.55)
    # 4 · drone returns with the voice; orbit notes over it
    d2 = acorde([38, 45, 52], T["corte"] - T["formula"] - 3.4, brillo=900, ataque=4.0)
    poner(m, T["formula"] + 3.6, d2, 0.75)
    penta = [62, 64, 66, 69, 71, 74, 76, 78]
    rng = np.random.default_rng(4)
    tt = T["orbitas"]
    while tt < T["corte"] - 0.5:
        nota = penta[rng.integers(len(penta))] + (12 if rng.random() < 0.25 else 0)
        poner(m, tt, con_reverb(pluck(hz(nota), 0.35, dec=1.6), IR_GRANDE, 0.45), 0.22)
        tt += 0.42 + rng.random() * 0.3
    # pulse of the rule keeps going softly under the orbits
    tt = T["orbitas"]
    while tt < T["corte"] - 0.4:
        poner(m, tt, golpe(vel=0.5), 0.35)
        tt += 0.96
    # 5 · the cut, then the 100 000 points: a shimmer of tiny high notes that thickens
    k = 0
    for tt in np.sort(rng.uniform(T["puntos"], T["conjunto"] - 0.15, 140)):
        nota = penta[rng.integers(len(penta))] + 12 + 12 * (rng.random() < 0.4)
        poner(m, tt, pluck(hz(nota), 0.12, dec=0.6), 0.10 + 0.25 * (tt - T["puntos"]) / (T["conjunto"] - T["puntos"]))
        k += 1
    # 6 · two seconds of total silence when the set appears (nothing scheduled between conjunto and respira)
    # 7 · the breathing chord: Dmaj9 opening slowly, with the heartbeat pulse back from the drift on
    largo = T["fin"] + 2.6 - T["respira"]
    resp = acorde([38, 50, 57, 61, 64, 66], largo, brillo=1600, ataque=5.0)
    poner(m, T["respira"], resp * rampa(t_(len(resp)), [(0, 0), (5, 0.9), (T["borde"] - T["respira"], 1.0), (T["fin"] - T["respira"], 1.15), (largo, 0)]), 0.9)
    tt = T["deriva"]
    while tt < T["fin"]:
        poner(m, tt, golpe(vel=0.55), 0.3)
        tt += 0.96
    # 8 · the approach to the border: a high layer that rises
    alto = acorde([74, 78, 81, 85], T["fin"] + 2.6 - T["borde"], brillo=3600, ataque=6.0)
    poner(m, T["borde"], alto * rampa(t_(len(alto)), [(0, 0), (8, 0.6), (T["fin"] - T["borde"], 0.9), (T["fin"] + 2.6 - T["borde"], 0)]), 0.5)
    # hard silences from the script
    m *= rampa(t, [(0, 1), (T["corte"] - 0.05, 1), (T["corte"], 0), (T["puntos"], 0), (T["puntos"] + 0.05, 1),
                   (T["conjunto"] - 0.08, 1), (T["conjunto"], 0), (T["respira"], 0), (T["respira"] + 0.05, 1), (TOTAL, 1)])[:, None]
    izq = con_reverb(m[:, 0], IR_GRANDE, 0.3)
    der = con_reverb(m[:, 1], IR_GRANDE, 0.3)
    return np.stack([izq[:, 0], der[:, 1]], 1)


def latidos_audio(x):
    """Onsets of the heart sounds in the final track, so the point of light beats with what is heard."""
    e = filtro(np.abs(x[:, 0]), corte_alto=7, orden=2.0)
    e = e / e.max()
    paso = SR // 200
    env = e[::paso]
    picos, ultimo = [], -1e9
    umbral = np.percentile(env, 92) * 0.55
    for i in range(1, len(env) - 1):
        ti = i * paso / SR
        if env[i] > umbral and env[i] >= env[i - 1] and env[i] >= env[i + 1] and ti - ultimo > 0.62:
            picos.append(round(ti, 3)); ultimo = ti
    (RAIZ / "public" / "audio" / "latidos_audio.json").write_text(json.dumps(picos))
    print(len(picos), "latidos en la pista")


if __name__ == "__main__":
    cor = corazon()[:N]
    latidos_audio(cor)
    escribir("corazon.wav", cor)
    escribir("musica.wav", musica()[:N])
