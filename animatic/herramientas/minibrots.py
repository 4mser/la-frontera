"""Finds mini-Mandelbrots (nuclei of hyperbolic components) with Newton's method and estimates their size.

For period p the nucleus c solves f_c^p(0) = 0. Size: the standard estimate (b = 1, l = 1; for each iterate
l = 2 z l, b += 1/l; size = 1 / (b l^2)). Prints candidates sorted by size, with their centre and the width
that frames each copy whole.
"""
import cmath
import json

def nucleo(c, p, it=60):
    for _ in range(it):
        z, dz = 0j, 0j
        for _ in range(p):
            dz = 2 * z * dz + 1
            z = z * z + c
        if dz == 0:
            return None
        paso = z / dz
        c -= paso
        if abs(paso) < 1e-15:
            break
    # check the period is exact (not a divisor)
    z = 0j
    for k in range(1, p + 1):
        z = z * z + c
        if abs(z) < 1e-9 and k < p:
            return None
    return c if abs(z) < 1e-9 else None

def talla(c, p):
    z, l, b = 0j, 1 + 0j, 1 + 0j
    for _ in range(1, p):
        z = z * z + c
        l = 2 * z * l
        b = b + 1 / l
    return abs(1 / (b * l * l))

if __name__ == "__main__":
    semillas = [complex(-0.75 + dx, 0.1 + dy) for dx in (-0.01, 0, 0.01) for dy in (-0.02, 0, 0.02, 0.04)]
    semillas += [complex(-1.78 + d, 0) for d in (-0.1, -0.05, 0, 0.03)] + [complex(0.27 + d, 0.007) for d in (-0.01, 0, 0.01)]
    semillas += [complex(-0.16, 1.04), complex(-0.1, 0.95), complex(0.35, 0.4), complex(-0.55, 0.62), complex(-1.25, 0.05), complex(0.4, 0.3)]
    vistos = []
    for s in semillas:
        for p in range(3, 40):
            c = nucleo(s, p)
            if c is None or abs(c) > 2:
                continue
            r = talla(c, p)
            if not (3e-4 < r < 0.06):
                continue
            if any(abs(c - v[0]) < r * 0.5 for v in vistos):
                continue
            vistos.append((c, p, r))
    vistos.sort(key=lambda v: -v[2])
    print(json.dumps([{"cx": v[0].real, "cy": v[0].imag, "p": v[1], "talla": v[2], "ancho": v[2] * 7.5} for v in vistos], indent=0))
