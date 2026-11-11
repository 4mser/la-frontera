"""Space colonization for chapter IV (Runions et al. 2005; Runions, Lane & Prusinkiewicz 2007), in 2D on a disc like a
retina seen from the front. Points that still need to be reached are scattered over the disc; each one pulls the node
of the tree nearest to it, if that node is within the radius of influence; every pulled node grows a short segment
towards the mean direction of its points; a point is removed when a node comes within the kill distance. It ends when
no point can be reached.

Exports src/cap4_vasos.json: the points (with the step when each was reached), the nodes (position, parent, step of
birth) and a width for every node from the number of nodes downstream (only for drawing).

Usage: PYTHONPATH=pylib python3 herramientas/vasos_cap4.py
"""
import json
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
g = np.random.default_rng(4)
R, NP = 1.0, 3200                     # the disc and its points
DI, DK, PASO = 0.16, 0.045, 0.012     # radius of influence, kill distance, segment length
# the points: uniform in the disc
r = R * np.sqrt(g.random(NP)); a = g.random(NP) * 2 * np.pi
P = np.c_[r * np.cos(a), r * np.sin(a)]
vivo = np.ones(NP, bool); alcanzado = np.full(NP, -1)
# the vessels enter at the optic disc, left of the centre: four short stems, as in a retina
OD = np.array([-0.18, 0.0])
nodos = [OD.copy()]; padre = [-1]; nace = [0]
for ang in (0.6, 2.5, -0.6, -2.5):
    nodos.append(OD + 0.03 * np.array([np.cos(ang), np.sin(ang)])); padre.append(0); nace.append(0)
paso = 0
while True:
    paso += 1
    N = np.array(nodos)
    vp = np.nonzero(vivo)[0]
    if len(vp) == 0:
        break
    d = np.linalg.norm(P[vp, None, :] - N[None, :, :], axis=2)            # points × nodes
    cerca = d.argmin(1); dm = d[np.arange(len(vp)), cerca]
    # kill the points a node has reached
    muertos = dm < DK
    alcanzado[vp[muertos]] = paso; vivo[vp[muertos]] = False
    act = ~muertos & (dm < DI)
    if not act.any():
        break
    dirs = {}
    for pi, ni in zip(vp[act], cerca[act]):
        v = P[pi] - N[ni]; v /= np.linalg.norm(v)
        dirs.setdefault(ni, []).append(v)
    for ni, vs in dirs.items():
        v = np.mean(vs, 0)
        if np.linalg.norm(v) < 1e-6:
            continue
        v = v / np.linalg.norm(v) + g.normal(0, 0.08, 2)
        nodos.append(N[ni] + PASO * v / np.linalg.norm(v)); padre.append(int(ni)); nace.append(paso)
    if paso > 600:
        break
N = np.array(nodos); padre = np.array(padre)
# width: number of nodes downstream (pipe-like, only for drawing)
abajo = np.ones(len(N))
for i in range(len(N) - 1, 0, -1):
    abajo[padre[i]] += abajo[i]
ancho = np.round(np.sqrt(abajo), 2)
D = {"nodos": np.round(N, 4).ravel().tolist(), "padre": padre.tolist(), "nace": nace, "ancho": ancho.tolist(),
     "puntos": np.round(P, 4).ravel().tolist(), "alcanzado": alcanzado.tolist(), "pasos": paso, "od": OD.tolist()}
(RAIZ / "src" / "cap4_vasos.json").write_text(json.dumps(D, separators=(",", ":")))
print("pasos", paso, "nodos", len(N), "puntos sin alcanzar", int(vivo.sum()))
