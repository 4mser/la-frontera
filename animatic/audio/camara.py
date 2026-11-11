"""Chamber instruments for chapter III onwards: a new colour after the desert-epic palette of the opening and
chapters I-II (audio/dune.py). Bowed strings (cello, viola) by additive synthesis with a body resonance, bow noise
and a vibrato that grows; a struck piano with slightly stretched partials; the metallic tick of a pair of dividers;
running water. D Dorian (D E F G A B C).
"""
import numpy as np

from dune import SR, filtro, hz, t_  # noqa: F401

_g = np.random.default_rng(7)

# the resonances of a cello body (Hz, gain, width): they colour every harmonic that falls near them
CUERPO = [(110, 0.8, 60), (290, 1.0, 90), (580, 0.7, 160), (1150, 0.45, 300), (2600, 0.25, 700)]


def _cuerpo(f):
    return 0.25 + sum(g * np.exp(-((f - c) / w) ** 2) for c, g, w in CUERPO)


def cuerda(nota, dur, vel=0.7, ataque=0.35, vib=5.2, prof=0.006, brillo=1.0, arco=0.05):
    """A bowed string: harmonics 1/n with the body's resonances, a vibrato that grows after the attack, a little bow
    noise, and a slow swell of the bow."""
    n = int(dur * SR)
    t = t_(n)
    f0 = hz(nota)
    viba = prof * np.minimum(1, t / 0.8) * (1 + 0.15 * np.sin(2 * np.pi * 0.3 * t))
    fase = 2 * np.pi * np.cumsum(f0 * (1 + viba * np.sin(2 * np.pi * vib * t))) / SR
    x = np.zeros(n)
    for k in range(1, 16):
        fk = f0 * k
        if fk > 7000:
            break
        x += np.sin(k * fase + _g.uniform(0, 6.28)) * (1 / k ** (1.15 / brillo)) * _cuerpo(fk)
    ruido = filtro(_g.standard_normal(n), corte_bajo=f0 * 2, corte_alto=5000) * arco
    env = np.minimum(1, t / ataque) * np.minimum(1, (dur - t) / 0.5) * (0.85 + 0.15 * np.sin(np.pi * np.minimum(1, t / dur)))
    y = (x / 6 + ruido) * env
    return y * vel


def spiccato(nota, vel=0.6):
    """A short bowed note, bounced: for the ostinato."""
    return cuerda(nota, 0.32, vel, ataque=0.02, vib=0, prof=0, brillo=1.2, arco=0.12) * np.exp(-t_(int(0.32 * SR)) * 7)


def piano(nota, dur=3.5, vel=0.6):
    """A struck string: partials slightly stretched (inharmonicity), each decaying faster the higher it is, and the
    thump of the hammer."""
    n = int(dur * SR)
    t = t_(n)
    f0, B = hz(nota), 0.0004
    x = np.zeros(n)
    for k in range(1, 12):
        fk = f0 * k * np.sqrt(1 + B * k * k)
        if fk > 9000:
            break
        x += np.sin(2 * np.pi * fk * t) * (0.9 ** k) / k ** 0.6 * np.exp(-t * (0.6 + 0.9 * k) * (220 / max(f0, 80)) ** 0.3)
    martillo = filtro(_g.standard_normal(n), corte_bajo=200, corte_alto=3000) * np.exp(-t * 60) * 0.3
    return (x * 0.5 + martillo) * np.minimum(1, t / 0.004) * vel


def tic(altura=1.0, vel=0.5):
    """The tick of a pair of dividers set down on paper: a dry metallic ping and a short scratch."""
    n = int(0.25 * SR)
    t = t_(n)
    f = 3100 * altura
    ping = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 55)
    rasp = filtro(_g.standard_normal(n), corte_bajo=1800, corte_alto=7000) * np.exp(-t * 140) * 0.6
    return (ping * 0.5 + rasp) * vel


def agua(dur, vel=0.5):
    """Running water: brown noise through a low band whose centre wanders, with small bright bubbles."""
    n = int(dur * SR)
    t = t_(n)
    marron = np.cumsum(_g.standard_normal(n))
    marron -= np.convolve(marron, np.ones(2000) / 2000, mode="same")
    x = filtro(marron, corte_bajo=80, corte_alto=900)
    x /= np.abs(x).max() + 1e-9
    burb = np.zeros(n)
    for _ in range(int(dur * 9)):
        i = _g.integers(0, max(1, n - 4000))
        f = _g.uniform(500, 1600)
        tt = t_(4000)
        burb[i:i + 4000] += np.sin(2 * np.pi * f * tt * (1 + 2 * tt)) * np.exp(-tt * 70) * _g.uniform(0.05, 0.25)
    env = np.minimum(1, t / 1.5) * np.minimum(1, (dur - t) / 1.5)
    return (x * 0.8 + burb) * env * vel


def campana(nota, vel=0.4, dur=3.0):
    """A small bell, for the chimes of the Koch zoom (as in chapter I, but softer)."""
    n = int(dur * SR)
    t = t_(n)
    f = hz(nota)
    return sum(np.sin(2 * np.pi * f * r * t) * g * np.exp(-t * d) for r, g, d in ((1, 1, 1.2), (2.76, 0.4, 3), (5.4, 0.2, 6))) * vel * np.minimum(1, t / 0.003)
