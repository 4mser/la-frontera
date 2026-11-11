"""Camera path shared by the renderer and interpola.py."""
import os, json, math
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
DEST = json.load(open(os.path.join(AQUI, "destino.json")))
W0 = 3.2
KMAX = 187           # last keyframe index (keyframes 0..KMAX)
U_EASE = 8.0         # the centre eases from the whole set's centre to the target over u in [0, U_EASE]
S_MINUS_T = complex(DEST["start_center"][0] - float(DEST["center_re"]), DEST["start_center"][1] - float(DEST["center_im"]))


def ancho(u):
    return W0 * 2.0 ** (-u)


def h(u):
    if u >= U_EASE:
        return 0.0
    x = u / U_EASE
    return 1 - x * x * x * (x * (6 * x - 15) + 10)


def centro_rel(u):
    """Camera centre minus target, as a complex double."""
    return S_MINUS_T * 2.0 ** (-u) * h(u)


def ancho_minibrot():
    return 2.5 * DEST["size"]   # extent of the final minibrot including its antenna


def u_relleno(frac):
    """u at which the final minibrot spans `frac` of the frame width."""
    return math.log2(W0 * frac / ancho_minibrot())
