"""Images of the cosmic journey (public/p5/): from the cosmic web down to the neurons, and back to the cosmic web.

Every stage is framed so the shape that closes one stage is the shape that opens the next (see src/cosmos.json):
the web's brightest node holds a group of galaxies, one of them holds the spiral, a star of the spiral holds the Earth,
the Earth is the iris, the pupil holds the retina. Prints the M101 star picked, for cosmos.json.

Usage: PYTHONPATH=pylib python3 herramientas/viaje_prep.py
"""
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
RAIZ = Path(__file__).resolve().parent.parent
MAT = RAIZ.parent / "material-prologo"
OUT = RAIZ / "public" / "p5"
OUT.mkdir(exist_ok=True)


def guarda(im, nombre):
    im.convert("RGB").save(OUT / nombre, quality=92)
    print(nombre, im.size)


# 1 · the cosmic web: the TNG300 dark-matter map (300 Mpc), without the panel's border and scale bar
red = Image.open(MAT / "viaje" / "tng-3boxes-dm-pillepich.png").convert("RGB").crop((1705, 74, 3542, 2093))
guarda(red, "1-red.jpg")
# 1b · the galaxies along the filaments (TNG100 stellar mass), graded to the web's warm nodes over a faint blue
e = np.asarray(Image.open(MAT / "viaje" / "tng100-estrellas.png").convert("L"), dtype=float) / 255
rgb = e[..., None] * np.array([1.0, 0.86, 0.7]) + 0.22 * np.sqrt(e)[..., None] * np.array([0.25, 0.45, 0.85])
# its edges fade to black, so it can appear smaller than the frame over the web without a straight line
yy, xx = np.mgrid[0:e.shape[0], 0:e.shape[1]]
borde = np.clip(np.minimum.reduce([xx, yy, e.shape[1] - xx, e.shape[0] - yy]) / 260, 0, 1) ** 1.5
guarda(Image.fromarray((np.clip(rgb * borde[..., None], 0, 1) * 255).astype(np.uint8)), "1b-galaxias.jpg")

# 2 · M101 on a square of black, its outer arms fading into space
m = Image.open(MAT / "viaje" / "m101-hubble-heic0602a.jpg").convert("RGB")
W0, H0 = m.size
lado = W0
cuadro = Image.new("RGB", (lado, lado))
dy = (lado - H0) // 2
cuadro.paste(m, (0, dy))
g = cuadro.resize((4096, 4096), Image.LANCZOS)
yy, xx = np.mgrid[0:4096, 0:4096] / 4096
rr = np.hypot(xx - 0.49, yy - (0.505 * H0 + dy) / lado)
mascara = np.clip((0.38 - rr) / 0.12, 0, 1) ** 1.5
guarda(Image.fromarray((np.asarray(g) * mascara[..., None]).astype(np.uint8)), "2-galaxia.jpg")

# 3 · one star of an outer arm, at full resolution: the detail tile of the galaxy (same pixels, sharper)
# a bright star with diffraction spikes, picked by eye near (10714, 8918), centred on its peak
gris = np.asarray(m.convert("L").crop((10674, 8878, 10754, 8958)).filter(ImageFilter.GaussianBlur(3)), dtype=float)
y, x = np.unravel_index(gris.argmax(), gris.shape)
sx, sy = x + 10674, y + 8878
print("star", sx, sy, "in the galaxy square:", sx / lado, (sy + dy) / lado)
det = m.crop((sx - 2048, sy - 2048, sx + 2048, sy + 2048))
guarda(det, "3-estrella.jpg")

# 4 · the whole Earth, GOES-16 full disk on 10 Sep 2017, with Hurricane Irma over Florida; 4b · Irma at full
# resolution (the detail tile, 3000 px around its eye); 4c · the eye of a hurricane seen from the space station, which
# turns into the human eye
tierra = Image.open(MAT / "viaje" / "tierra-goes16-irma-2017-09-10.jpg").convert("RGB")
IX, IY = 6185, 2770
print("irma in the earth square:", IX / tierra.width, IY / tierra.height)
# clouds are the brightest thing in the film: a deeper curve keeps their texture (and Irma's eye) from burning to white
def profundo(im, g):
    a = (np.asarray(im, dtype=float) / 255) ** g
    return Image.fromarray((np.clip(1.15 * a / (1 + 0.15 * a), 0, 1) * 255).astype(np.uint8))
# the Earth and its detail tile share the same curve, so the hand-over from one to the other cannot be seen
guarda(profundo(tierra.resize((4096, 4096), Image.LANCZOS), 1.7), "4-tierra.jpg")
guarda(profundo(tierra.crop((IX - 1500, IY - 1500, IX + 1500, IY + 1500)), 1.7), "4b-huracan.jpg")
guarda(profundo(Image.open(MAT / "viaje" / "huracan-florence-gerst.jpg").convert("RGB"), 1.45), "4c-ojo-huracan.jpg")
# 5 · an eye; 6 · a retina (on black, a perfect disc); 7 · neurons
o = Image.open(MAT / "viaje" / "ojo-matt-ming.jpg").convert("RGB")
# the window's reflection in the pupil goes: inside the pupil, anything brighter than the pupil turns pupil-dark
oa = np.asarray(o, dtype=float)
yy, xx = np.mgrid[0:o.height, 0:o.width]
pupila = ((xx / o.width - 0.41) / 0.112) ** 2 + ((yy / o.height - 0.515) / 0.205) ** 2 < 1
brillo = oa.max(axis=2)
m_ref = Image.fromarray(((pupila & (brillo > 32)) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(10))
mr = np.asarray(m_ref, dtype=float)[..., None] / 255
oscuro = np.array([9, 9, 11], dtype=float)
guarda(Image.fromarray((oa * (1 - mr) + oscuro * mr).astype(np.uint8)), "5-ojo.jpg")
f = Image.open(MAT / "viaje" / "retina-optometrusprime.png").convert("RGB")
yy, xx = np.mgrid[0:f.height, 0:f.width]
disco = np.clip((0.322 * f.width - np.hypot(xx - 0.497 * f.width, yy - 0.492 * f.height)) / 8, 0, 1)
# a PNG whose outside is transparent: it sits in the pupil
rgb = (np.asarray(f.filter(ImageFilter.UnsharpMask(2, 40, 2)), dtype=float) / 255) ** 1.15
# the optic disc is the brightest thing in the film at that moment: its highlights roll off instead of clipping
rgb = 1.3 * rgb / (1 + 0.65 * rgb)
Image.fromarray(np.dstack([rgb * 255, disco * 255]).astype(np.uint8), "RGBA").save(OUT / "6-retina.png")
print("6-retina.png", f.size)
guarda(Image.open(MAT / "zoom" / "08-neurona.jpg").resize((4096, 4096), Image.LANCZOS), "7-neuronas.jpg")
