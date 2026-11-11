"""«¿Y si no hubiera un significado escrito en alguna parte?»: partículas que se organizan solas («particle life»).
Cinco especies, una matriz de atracciones (nadie dibuja la forma): del caos uniforme nacen membranas y células.
Mundo toroidal 9:16. Escribe public/existir/vida/pos.bin (uint16 x,y por partícula y cuadro) y meta.json.

Uso: python3 herramientas/existir_vida.py
"""
import json
from pathlib import Path

import numpy as np

OUT = Path(__file__).resolve().parent.parent / "public" / "existir" / "vida"
N, K = 4200, 5
CUADROS, SUB = 170, 2
AX, AY = 0.5625, 1.0                       # mundo 9:16
R_MAX, BETA, DT, FUERZA = 0.07, 0.3, 0.02, 10.0
FRIC = 0.5 ** (DT / 0.04)

rng = np.random.default_rng(23)
# matriz pensada para membranas: cada especie se pega a la siguiente y rechaza a la anterior
A = np.array([
    [0.9, 0.6, -0.3, 0.0, -0.5],
    [-0.4, 0.8, 0.7, -0.2, 0.0],
    [0.0, -0.4, 0.7, 0.8, -0.3],
    [-0.3, 0.0, -0.4, 0.6, 0.9],
    [0.8, -0.3, 0.0, -0.4, 0.7],
], np.float32)
tipo = rng.integers(0, K, N)
pos = np.stack([rng.random(N) * AX, rng.random(N) * AY], 1).astype(np.float32)
vel = np.zeros_like(pos)
Aij = A[tipo][:, tipo]


def fuerza(r):
    out = np.zeros_like(r)
    m1 = r < BETA
    out[m1] = r[m1] / BETA - 1
    m2 = (r >= BETA) & (r < 1)
    return out, m2


def paso():
    global pos, vel
    acc = np.zeros_like(pos)
    for i0 in range(0, N, 700):
        p = pos[i0:i0 + 700]
        d = pos[None, :, :] - p[:, None, :]
        d[..., 0] -= AX * np.round(d[..., 0] / AX)
        d[..., 1] -= AY * np.round(d[..., 1] / AY)
        r = np.sqrt((d ** 2).sum(-1)) / R_MAX + 1e-6
        f, m2 = fuerza(r)
        a = Aij[i0:i0 + 700]
        f[m2] = a[m2] * (1 - np.abs(2 * r[m2] - 1 - BETA) / (1 - BETA))
        f[r >= 1] = 0
        acc[i0:i0 + 700] = (d / (r[..., None] * R_MAX) * f[..., None]).sum(1) * R_MAX * FUERZA
    vel = vel * FRIC + acc * DT
    pos = pos + vel * DT
    pos[:, 0] %= AX
    pos[:, 1] %= AY


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    datos = np.zeros((CUADROS, N, 2), np.uint16)
    for c in range(CUADROS):
        datos[c, :, 0] = np.clip(pos[:, 0] / AX * 65535, 0, 65535)
        datos[c, :, 1] = np.clip(pos[:, 1] / AY * 65535, 0, 65535)
        for _ in range(SUB):
            paso()
        if c % 20 == 0:
            print(c, flush=True)
    (OUT / "pos.bin").write_bytes(datos.tobytes())
    (OUT / "meta.json").write_text(json.dumps({"n": N, "cuadros": CUADROS, "tipo": tipo.tolist()}))
    print("listo")
