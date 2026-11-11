"""Instruments for a desert-epic film score, shared by the prologue and the intro: an original sound, no borrowed
melody. A huge saturated sub drone; «braams» (walls of distorted low brass whose harmonics bloom and close); a
female voice (formant synthesis, slow vibrato, glides and small ornaments, a second voice a little detuned); deep
drum booms; reverse swells. All in D Phrygian dominant (D Eb F# G A Bb C).
"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent / "sonido-serie"))
from sonido import SR, con_reverb, filtro, hz, ir_reverb, rng, t_  # noqa: E402,F401

SALA = ir_reverb(seg=7.0, brillo=3500, pre=0.03)          # a vast, dark hall
SALA_C = ir_reverb(seg=3.0, brillo=5000, pre=0.015)


def norm(x):
    return x / max(1e-9, np.abs(x).max())


def poner(dst, t0, x, g=1.0):
    x = np.stack([x, x], 1) if x.ndim == 1 else x
    i = int(t0 * SR)
    if i < 0:
        x, i = x[-i:], 0
    k = min(len(x), len(dst) - i)
    if k > 0:
        dst[i:i + k] += x[:k] * g


def sub(nota, dur, ataque=4.0, sat=1.6):
    """A huge sub drone: sine with a slow wobble, gently saturated so it is felt on small speakers too."""
    n = int(dur * SR); t = t_(n)
    f = hz(nota) * (1 + 0.003 * np.sin(2 * np.pi * 0.11 * t))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.35 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    x = np.tanh(sat * x) / np.tanh(sat)
    return x * np.minimum(1, t / ataque) * np.minimum(1, (dur - t) / 2.5)


def braam(notas, dur, ataque=0.25, abre=1.2, sat=2.4, brillo=1.0):
    """A wall of distorted low brass: detuned saw stacks whose upper harmonics bloom and close, then saturation."""
    n = int(dur * SR); t = t_(n)
    x = np.zeros(n)
    corte = 1 + 26 * brillo * (t / abre) * np.exp(1 - t / abre)
    for nota in notas:
        for det in (-0.006, 0.0, 0.007):
            f0 = hz(nota) * (1 + det)
            fase = 2 * np.pi * f0 * t
            for k in range(1, int(min(60, 9000 / f0))):
                x += np.sin(k * fase + det * 40 * k) / k * np.exp(-(k - 1) / corte)
    x = np.tanh(sat * norm(x)) / np.tanh(sat)
    x *= np.minimum(1, t / ataque) * np.exp(-np.maximum(0, t - dur * 0.35) * 1.6 / dur * 2)
    return filtro(x, corte_alto=2600)


# female vowel formants (frequency, gain, bandwidth)
FORMANTES = {
    "a": [(850, 1.0, 90), (1220, 0.55, 110), (2810, 0.25, 160), (3800, 0.08, 220)],
    "o": [(500, 1.0, 80), (900, 0.55, 100), (2830, 0.12, 170), (3800, 0.05, 220)],
    "u": [(330, 1.0, 70), (820, 0.35, 100), (2700, 0.08, 170)],
}


def _linea(frase, vib, vocal, detune=0.0, retraso=0.0):
    dur = sum(d for _, d in frase)
    n = int(dur * SR); t = t_(n)
    f = np.zeros(n); i = 0
    prev = hz(frase[0][0])
    for j, (nota, d) in enumerate(frase):
        k = int(d * SR); tt = np.arange(k) / SR
        g = np.clip(tt / 0.16, 0, 1)
        curva = prev + (hz(nota) - prev) * (g * g * (3 - 2 * g))
        # a small ornament: on longer notes, a quick turn up a step and back, as in the desert vocal style
        if d >= 2.0 and j % 2 == 0:
            o = np.exp(-((tt - 0.42) / 0.07) ** 2)
            curva *= 1 + 0.06 * o
        f[i:i + k] = curva
        prev = hz(nota); i += k
    # vibrato that arrives late on each phrase, like a held breath that starts to tremble
    f = f * (1 + detune) * (1 + 0.016 * np.sin(2 * np.pi * vib * t + retraso) * np.clip((t - 0.6) / 1.4, 0, 1))
    fase = 2 * np.pi * np.cumsum(f) / SR
    x = np.zeros(n)
    for k in range(1, 24):
        fk = f * k
        a = sum(g * np.exp(-((fk - F) / bw) ** 2 / 2) for F, g, bw in FORMANTES[vocal]) + 0.015 / k
        x += a * np.sin(k * fase)
    x += 0.05 * filtro(rng.standard_normal(n), corte_bajo=1500, corte_alto=7000) * np.clip(f / 600, 0, 1)   # breath
    env = np.minimum(1, t / 0.9) * np.minimum(1, (dur - t) / 1.6)
    return norm(x) * env


def voz(frase, vocal="a", vib=5.4):
    """A female line: [(midi, seconds), ...]; a lead voice and a second one, a little detuned and late, for depth."""
    a = _linea(frase, vib, vocal)
    b = _linea(frase, vib * 0.93, vocal, detune=0.004, retraso=1.3)
    return norm(a + 0.45 * b)


def bombo(fuerza=1.0):
    """A deep drum boom: a pitch-dropping body and a soft skin thump."""
    n = int(3.0 * SR); t = t_(n)
    f = 46 * (1 + 1.2 * np.exp(-t * 18))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    x += filtro(rng.standard_normal(n), corte_alto=500) * np.exp(-t * 30) * 0.6
    return np.tanh(1.8 * x) * fuerza


def oleaje(dur, sube=True):
    """A reverse swell: filtered noise that grows (or fades) towards one instant."""
    n = int(dur * SR); t = t_(n)
    u = t / dur if sube else 1 - t / dur
    r = rng.standard_normal(n)
    x = filtro(r, corte_bajo=40, corte_alto=300) * (1 - u) + filtro(r, corte_bajo=60, corte_alto=2500) * u
    return norm(x) * u ** 3
