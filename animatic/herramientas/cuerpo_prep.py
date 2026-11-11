"""Shots of the first line's list (public/p2/fotos/): «En árboles y plantas», «En tus manos», «En tu sistema nervioso».

- árboles: crown shyness in a Malaysian rainforest, from below (the gaps between the crowns branch like a river).
- manos: the open palm on black, the same one as in p4 (its lines branch too).
- mandelbrot: Benoit Mandelbrot at TED 2010, his set behind him (for the coast's question).
- nervios: Vesalius' figure of the nerves (Fabrica, 1543), inverted to light lines on black and tinted warm; an oval
  mask fades out the printed text around it.

Usage: PYTHONPATH=pylib python3 herramientas/cuerpo_prep.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
MAT = RAIZ.parent / "material-prologo" / "cuerpo"
OUT = RAIZ / "public" / "p2" / "fotos"

a = Image.open(MAT / "copas-timidas-rohitjahnavi.jpg").convert("RGB")
a = a.resize((2880, round(2880 * a.height / a.width)), Image.LANCZOS)
arr = (np.asarray(a, dtype=float) / 255) ** 1.2
a = Image.fromarray((np.clip(arr * np.array([0.92, 1.0, 0.95]), 0, 1) * 255).astype(np.uint8))
a.save(OUT / "arboles.jpg", quality=92)

Image.open(RAIZ / "public" / "p4" / "06-mano.jpg").convert("RGB").resize((2880, 1620), Image.LANCZOS).save(OUT / "manos.jpg", quality=92)

v = Image.open(MAT / "vesalio-fabrica-p353-354.jpg").convert("L")
W0, H0 = v.size
# the figure from the head to the waist, with the arms (above the fold of the book and below its heading)
fig = v.crop((int(0.30 * W0), int(0.095 * H0), int(0.78 * W0), int(0.49 * H0)))
fig = ImageOps.autocontrast(ImageOps.invert(fig), cutoff=1)
lado_h = 1620
fig = fig.resize((round(lado_h * fig.width / fig.height), lado_h), Image.LANCZOS)
g = np.asarray(fig, dtype=float) / 255
g = np.clip((g - 0.18) / 0.82, 0, 1) ** 1.3
yy, xx = np.mgrid[0:g.shape[0], 0:g.shape[1]]
ovalo = np.clip((1 - np.hypot((xx / g.shape[1] - 0.5) / 0.40, (yy / g.shape[0] - 0.52) / 0.55)) / 0.25, 0, 1)
g = g * ovalo
rgb = np.dstack([g * 1.0, g * 0.86, g * 0.66])
lienzo = np.zeros((1620, 2880, 3))
x0 = (2880 - g.shape[1]) // 2
lienzo[:, x0:x0 + g.shape[1]] = rgb
img = Image.fromarray((np.clip(lienzo, 0, 1) * 255).astype(np.uint8))
img.filter(ImageFilter.GaussianBlur(0.6)).save(OUT / "nervios.jpg", quality=92)
# Benoit Mandelbrot at TED 2010, with his set on the screen behind him (the coast's question is his)
m = Image.open(MAT / "mandelbrot-ted2010-jurvetson.jpg").convert("RGB")
m = m.resize((2400, round(2400 * m.height / m.width)), Image.LANCZOS)
arr = (np.asarray(m, dtype=float) / 255) ** 1.15 * 0.92
Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8)).save(OUT / "mandelbrot.jpg", quality=92)
# «En tu sistema nervioso»: three small images Nico chose (source not identified), each on black at full height,
# centred, its edges fading out: the whole nervous system, a dissection of it, the brain with its nerves
def sobre_negro(ruta, caja, salida, sube=0.0):
    im = Image.open(MAT / ruta).convert("RGB")
    w, h = im.size
    im = im.crop((int(caja[0] * w), int(caja[1] * h), int(caja[2] * w), int(caja[3] * h)))
    alto = 1080
    im = im.resize((round(alto * im.width / im.height), alto), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
    a = np.asarray(im, dtype=float) / 255
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    bx, by = np.minimum(xx, a.shape[1] - 1 - xx) / (0.16 * a.shape[1]), np.minimum(yy, a.shape[0] - 1 - yy) / (0.1 * a.shape[0])
    borde = np.clip(np.minimum(bx, by), 0, 1) ** 1.6
    lienzo = np.zeros((1080, 1920, 3))
    x0 = (1920 - a.shape[1]) // 2
    # the film's bloom lifts whites a lot: the bright nerves are brought down so they keep their lines
    lienzo[:, x0:x0 + a.shape[1]] = (a ** (1 + sube)) * 0.72 * borde[..., None]
    Image.fromarray((np.clip(lienzo, 0, 1) * 255).astype(np.uint8)).save(OUT / salida, quality=93)
sobre_negro("nervios-plastinado-sin-fuente.png", (0.06, 0.0, 0.94, 1.0), "nervios-1.jpg", 0.7)
sobre_negro("nervios-diseccion-sin-fuente.png", (0.36, 0.0, 1.0, 1.0), "nervios-2.jpg", 0.7)
sobre_negro("nervios-cerebro-3d-sin-fuente.png", (0.0, 0.0, 1.0, 1.0), "nervios-3.jpg", 0.2)
print("listo arboles.jpg manos.jpg nervios.jpg mandelbrot.jpg nervios-1..3.jpg")
