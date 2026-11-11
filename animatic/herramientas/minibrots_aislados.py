"""Searches isolated mini-Mandelbrots: Newton from random seeds near the border, then keeps only nuclei whose
surrounding ring (2.5 sizes out) lies almost entirely outside the set (attached bulbs fail this test)."""
import json
import random
import sys
sys.path.insert(0, "herramientas")
from minibrots import nucleo, talla  # noqa: E402

def escapa(c, it=1500):
    z = 0j
    for k in range(it):
        z = z * z + c
        if z.real * z.real + z.imag * z.imag > 4:
            return k
    return it

random.seed(5)
semillas = []
while len(semillas) < 500:
    c = complex(random.uniform(-2, 0.5), random.uniform(0, 1.15))
    k = escapa(c, 400)
    if 40 < k < 400:
        semillas.append(c)
hallados = []
for s in semillas:
    for p in range(3, 34):
        c = nucleo(s, p, 40)
        if c is None or abs(c) > 2:
            continue
        r = talla(c, p)
        if not (4e-4 < r < 0.03) or any(abs(c - h[0]) < r for h in hallados):
            continue
        anillo = [c + 2.5 * r * complex(__import__("math").cos(a), __import__("math").sin(a)) for a in [i * 0.39 for i in range(16)]]
        dentro = sum(escapa(q) >= 1500 for q in anillo)
        if dentro <= 1:
            hallados.append((c, p, r))
        break
hallados.sort(key=lambda h: -h[2])
print(json.dumps([{"cx": h[0].real, "cy": h[0].imag, "p": h[1], "talla": h[2]} for h in hallados]))
