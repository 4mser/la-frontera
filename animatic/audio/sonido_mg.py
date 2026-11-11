"""Sound for the montage (public/audio/montaje.wav), on src/montaje.json: only the essentials, cinematic and cosmic.

- The hit on every beat: a deep impact (a sine dropping in pitch with a low transient) and a long dark tail, with the
  real heartbeat underneath. It is the most important sound of the film.
- Underneath: a constant low drone and wide chords that open slowly as the heart speeds up.
- The climax: hits on every eighth and then every sixteenth over a swelling chord, up to a white burst whose
  largest hit rings out into the silence; then one heartbeat.
- The ending: a wide, slow cosmic chord under the voice, and a last, larger hit on the title.
No plucks, no arpeggios, no whooshes, no risers.

Usage: PYTHONPATH=pylib python3 audio/sonido_mg.py
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ.parent.parent / "sonido-serie"))
from sonido import IR_GRANDE, SR, con_reverb, filtro, hz, pad, rng, t_  # noqa: E402

M = json.loads((RAIZ / "src" / "montaje.json").read_text())
L = M["latidos"]
TOTAL = M["total"]
N = int(TOTAL * SR)


def leer(ruta):
    w = wave.open(str(ruta))
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float).reshape(-1, w.getnchannels()) / 32767


CORAZON = leer(RAIZ / "public" / "audio" / "corazon.wav")
ONSETS = json.loads((RAIZ / "public" / "audio" / "latidos_audio.json").read_text())


def latido(k=3):
    i = int((ONSETS[k] - 0.06) * SR)
    x = CORAZON[i:i + int(0.85 * SR)].copy()
    x *= np.linspace(1, 0, len(x))[:, None] ** 0.5
    return x / np.abs(x).max()


def poner(dst, t0, x, g=1.0):
    x = np.stack([x, x], 1) if x.ndim == 1 else x
    i = int(t0 * SR)
    k = min(len(x), len(dst) - i)
    if k > 0:
        dst[i:i + k] += x[:k] * g


def golpe(dur=3.5, grave=hz(28), fuerza=1.0):
    """Cinematic hit: a sine that drops from a punch into a sub tone, a short low transient, a long dark tail."""
    n = int(dur * SR); t = t_(n)
    f = grave * (1 + 2.6 * np.exp(-t * 40))
    cuerpo = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.7) * np.minimum(1, t / 0.002)
    # a dry, immediate attack, so the impact is felt exactly on its instant (not 80 ms later)
    ataque = filtro(rng.standard_normal(n), corte_bajo=60, corte_alto=2500) * np.exp(-t * 70) * 1.1
    seco = filtro(cuerpo + ataque, corte_alto=1800) * fuerza
    return con_reverb(seco, IR_GRANDE, 0.35)


def tono(nota, dur=1.4, fuerza=0.5):
    """A tuned low hit (like a deep tom) on a note of the key."""
    n = int(dur * SR); t = t_(n)
    f = hz(nota) * (1 + 0.5 * np.exp(-t * 30))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2) * np.minimum(1, t / 0.003)
    x += 0.35 * np.sin(4 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    return con_reverb(filtro(x, corte_alto=1500) * fuerza, IR_GRANDE, 0.3)


def acorde(notas, dur, brillo=1200, ataque=2.5):
    return sum(pad(hz(m), dur, detune=0.07, brillo=brillo, ataque=ataque) for m in notas)


def montaje():
    m = np.zeros((N, 2))
    lr = latido()
    c = M["corte"]
    # the constant low drone, from the first second to the collapse
    dron = acorde([26, 38, 45], c + 1.0, brillo=260, ataque=2.0)
    poner(m, 0.0, dron * np.minimum(1, np.linspace(0, 2.2, len(dron)) ** 2), 0.65)
    # wide chords that open slowly as the heart speeds up (Dm9, Bbmaj7, Gm9, Asus), one every four beats
    prog = [[38, 50, 53, 57, 64, 69], [34, 46, 50, 53, 57, 65], [31, 43, 46, 50, 57, 62], [33, 45, 50, 52, 57, 64]]
    for k in range(0, len(L), 4):
        t0 = L[k]
        t1 = L[k + 4] if k + 4 < len(L) else c
        u = (t0 - L[0]) / (c - L[0])
        ch = acorde(prog[(k // 4) % 4], t1 - t0 + 1.2, brillo=500 + 2200 * u ** 1.4, ataque=0.6)
        poner(m, t0 - 0.2, ch, 0.42 + 0.3 * u)
    # the hit on every beat, with the real heartbeat underneath; it grows with the heart
    for k, tb in enumerate(L):
        u = k / len(L)
        poner(m, tb, golpe(fuerza=(1.3 if k == 0 else 0.75 + 0.45 * u)), 1.0)
        poner(m, tb, lr, 0.3)
    # every visible gesture has one deep tuned hit, on the exact frame (same timings as src/montajeMG.ts);
    # nothing on the cuts or inside the continuous takes
    gestos = {
        "tripticoPunto": [(0, 38, 0.5)],
        "descenso": [(0, 45, 0.45), (1, 50, 0.4), (2, 38, 0.55)],
        "organismo0": [(1, 50, 0.4)],
        "mosaicoVivo": [(0, 41, 0.4), (1, 45, 0.4)],
        "diagonalVivo": [(0, 43, 0.4), (1, 45, 0.4)],
        "division": [(1, 41, 0.45), (2, 45, 0.45)],
        "caleido": [(0, 50, 0.4), (1, 53, 0.3), (2, 57, 0.3)],
        "tripticoVivo": [(0, 38, 0.45), (1, 41, 0.4), (2, 45, 0.4)],
    }
    # every gesture lands on a beat of its shot: (beat inside the shot, note, strength)
    b = 0
    for entrada in M["seq"]:
        nombre, _, n = entrada.partition("*")
        n = int(n or 1)
        for j, nota, f in gestos.get(nombre, []):
            poner(m, L[b + j], tono(nota, fuerza=f), 1.0)
        b += n
    # the climax: hits on every eighth, then every sixteenth, growing, under a chord that swells to the burst
    subs, ini = M["subs"], M["climax"]
    for j, ts in enumerate(subs):
        u = j / len(subs)
        poner(m, ts, golpe(dur=1.4, grave=hz(30 + 6 * u), fuerza=0.55 + 0.6 * u), 1.0)
    swell = acorde([38, 45, 50, 57, 62, 69, 74], c - ini + 0.2, brillo=3200, ataque=0.3)
    poner(m, ini, swell * np.linspace(0.3, 1.2, len(swell)) ** 2, 0.55)
    # the burst: everything stops on the largest hit, whose tail rings into the silence
    # before the last hit the sound draws back for an instant (the breath before the impact)
    j0, j1 = int((c - 0.3) * SR), int(c * SR)
    m[j0:j1] *= np.linspace(1, 0.3, j1 - j0)[:, None] ** 1.5
    # everything fades out in 0.6 s under the last hit, instead of stopping dead
    i0, i1 = int(c * SR), int((c + 0.6) * SR)
    m[i0:i1] *= np.linspace(1, 0, i1 - i0)[:, None] ** 2
    m[i1:] = 0
    poner(m, c, golpe(dur=6.0, grave=hz(22), fuerza=1.8), 1.0)
    cola = acorde([26, 38, 50, 57, 62, 69], 4.5, brillo=1800, ataque=0.02)
    poner(m, c, cola * np.linspace(1, 0, len(cola)) ** 2.2, 0.6)
    poner(m, M["latidoSolo"], con_reverb(lr[:, 0], IR_GRANDE, 0.5), 1.0)
    # the ending: a wide, slow cosmic chord under the voice, with a quiet high layer that breathes in
    a0, tt = M["calma"], M["titulo"]
    largo = tt - a0 + 0.6
    amb = acorde([26, 38, 50, 57, 62, 64, 69], largo, brillo=1400, ataque=5.0)
    poner(m, a0, amb * np.linspace(0.55, 1.0, len(amb)), 0.45)
    alto = acorde([81, 86, 88], largo, brillo=3600, ataque=8.0)
    poner(m, a0 + 2.0, alto * np.sin(np.pi * np.linspace(0, 1, len(alto))) ** 1.5, 0.12)
    # the breath before the title: the ambience draws back for half a second
    j0, j1 = int((tt - 0.5) * SR), int(tt * SR)
    m[j0:j1] *= np.linspace(1, 0.2, j1 - j0)[:, None] ** 1.5
    m[j1:] *= 0.2
    # the title: the largest hit and an open chord that resolves
    poner(m, tt, golpe(dur=6.0, grave=hz(24), fuerza=1.5), 1.0)
    fin = acorde([26, 38, 50, 57, 62, 66, 69, 74], TOTAL - tt, brillo=2400, ataque=0.08)
    poner(m, tt, fin * np.linspace(1, 0, len(fin)) ** 1.4, 0.7)
    izq = con_reverb(m[:, 0], IR_GRANDE, 0.22)[:N]
    der = con_reverb(m[:, 1], IR_GRANDE, 0.22)[:N]
    y = np.stack([izq[:, 0], der[:, 1]], 1)
    y = y / np.abs(y).max() * 0.9
    with wave.open(str(RAIZ / "public" / "audio" / "montaje.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
    print("listo montaje.wav", f"{len(y) / SR:.1f} s")


if __name__ == "__main__":
    montaje()
