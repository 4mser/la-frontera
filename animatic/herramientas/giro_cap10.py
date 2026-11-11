"""Chapter X, the turn: the deepest copy's dark interior is a pupil (Osmo Lundell's iris); the camera pulls back to the
iris and to a whole eye; then in again through the pupil, as in the opening: the retina, the neurons, and the cosmic
web (IllustrisTNG) — the circle closes. 30 s, 30 fps → public/p10/vid/giro/NNNN.jpg. Images and the feathered,
log-speed zoom from herramientas/viaje_cap10.py; here each stage has its own zoom window and its own dissolve window."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from concurrent.futures import ProcessPoolExecutor

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "herramientas"))
import viaje_cap10 as V      # noqa: E402

FPS, DUR = 30, 30.0
OUT = RAIZ / "public/p10/vid/giro"
OJO = "p5/5-ojo.jpg"                                   # the eye of the opening (Matt Ming, CC BY 2.0, reflection removed)
PO = (0.428, 0.475)                                      # its pupil
# image, zoom (t0, t1, w0, w1, c0, c1), visible (in0, in1, out0, out1)
ETAPAS = [
    (OJO, (0.0, 8.0, 0.06, 0.85, PO, (0.47, 0.5)), (0.0, 1.5, 40, 41)),                # out of the pupil: an eye; someone is looking
    (OJO, (11.0, 15.0, 0.85, 0.04, (0.47, 0.5), PO), (0, 0, 14.6, 15.2)),             # and in again, through it
    ("p5/6-retina.png", (14.6, 20.5, 1.1, 0.08, (0.5, 0.5), (0.335, 0.42)), (14.6, 15.2, 19.5, 20.5)),
    ("p5/7-neuronas.jpg", (19.5, 25.0, 1.2, 0.25, (0.5, 0.5), (0.5, 0.5)), (19.5, 20.5, 24.0, 25.0)),
    ("p5/1-red.jpg", (24.0, 30.5, 0.12, 0.85, (0.5, 0.5), (0.5, 0.5)), (24.0, 25.0, 40, 41)),
]

def vista(ruta, t, z):
    t0, t1, w0, w1, c0, c1 = z
    V.ETAPAS = [(ruta, t0, t1, w0, w1, c0, c1)]
    return V.vista(0, t)

def cuadro(fr):
    t = fr / FPS
    img = np.zeros((V.H, V.W, 3), np.float32)
    for i, (ruta, z, (i0, i1, o0, o1)) in enumerate(ETAPAS):
        if i == 0 and t >= 11.0: continue
        if i == 1 and t < 11.0: continue
        a = min(V.ease((t - i0) / (i1 - i0)) if i1 > i0 else 1.0, 1 - V.ease((t - o0) / (o1 - o0)))
        if a <= 0.001: continue
        img = img * (1 - a) + vista(ruta, t, z) * a
    if t > 28.0: img = img * (1 - V.ease((t - 28.0) / 2.0))
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(OUT / f"{fr:04d}.jpg", quality=92)
    return fr

if __name__ == "__main__":
    sel = [int(a) for a in sys.argv[1:]] or range(int(DUR * FPS))
    with ProcessPoolExecutor() as ex:
        for _ in ex.map(cuadro, sel, chunksize=2): pass
    print("ok", len(sel))
