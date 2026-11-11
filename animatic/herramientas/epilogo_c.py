"""Epilogue, act C «La realidad y sus fronteras»: the background of the act and the dive along a new place of the
Mandelbrot border (never the seahorse valley of the long dive of chapter X).

- 0 → MANDEL0: the last image of act B (the even cosmic web) dissolves to the dark where the scale chart is drawn
  (the chart itself is drawn by src/cap10.ts, over this clip);
- MANDEL0 → end: the set is born out of the dark (whole, small) and the camera dives at constant speed toward a
  Misiurewicz point of the border; the colouring is the one of the deep zoom (herramientas/mandel_profundo/color.py).

Frames → public/p10/vid/epiC/NNNN.jpg (act time t = frame / 30).
usage: PYTHONPATH=pylib python3 herramientas/epilogo_c.py [frames] | prueba
"""
import ctypes, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from concurrent.futures import ProcessPoolExecutor

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "herramientas" / "mandel_profundo"))
import color  # noqa: E402

LIB = ctypes.CDLL(str(RAIZ / "herramientas/c/libmandel_epi.dylib"))
LIB.calcula.argtypes = [ctypes.c_double] * 3 + [ctypes.c_int] * 3 + [ctypes.POINTER(ctypes.c_float)] * 2 + [ctypes.c_int]
W, H, FPS = 1920, 1080, 30
OUT = RAIZ / "public/p10/vid/epiC"
DUR = 90.0
MANDEL0 = 42.0                                    # when the set is born (v6: after the chart has gone)
CX, CY = -0.10109636384562, 0.95628651080914      # a Misiurewicz point: the tip of a spiral that repeats without end
FONDO = RAIZ / "public/p10/vid/epiB"              # act B's last frame


def campo(cx, cy, ancho, w, h, maxit, hilos=4):
    nu = np.zeros(w * h, np.float32); de = np.zeros(w * h, np.float32)
    LIB.calcula(cx, cy, ancho, w, h, maxit, nu.ctypes.data_as(ctypes.POINTER(ctypes.c_float)), de.ctypes.data_as(ctypes.POINTER(ctypes.c_float)), hilos)
    return nu.reshape(h, w), de.reshape(h, w)


def ease(x): x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)


def vista(t):
    """width of the view and the centre: the whole set, then a constant-speed dive to the point"""
    s = max(0.0, t - MANDEL0)
    w = 3.4 * np.exp(-0.5 * max(0.0, s - 4.0))                       # the whole set for 4 s, then a dive at constant speed
    return w, CX, CY                                              # v6: centred on the point from the start, no pan


def mandel(t, ss=1.5):
    w, cx, cy = vista(t)
    ow, oh = int(W * ss), int(H * ss)
    prof = -np.log10(w / 3.4)
    nu, de = campo(cx, cy, w, ow, oh, int(400 + 900 * prof), 4)
    rgb = color.colorea(nu, de, None, None, ss=ss, fase=0.02 * t)
    im = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
    return np.asarray(im).astype(np.float32) / 255


def cuadro(fr):
    t = fr / FPS
    img = np.zeros((H, W, 3), np.float32)
    if t < MANDEL0 + 1.0:
        try:
            b = np.asarray(Image.open(sorted(FONDO.glob("*.jpg"))[-1]).filter(ImageFilter.GaussianBlur(2 + 6 * ease(t / 6)))).astype(np.float32) / 255
        except Exception:
            b = img
        img = b * (0.25 + 0.75 * (1 - ease(t / 5.0)))                 # the web stays, dim, under the chart
        img = img * (1 - ease((t - (MANDEL0 - 3.0)) / 3.0))
    if t >= MANDEL0:
        a = ease((t - MANDEL0) / 2.5)
        img = img * (1 - a) + mandel(t) * a
    if t > DUR - 3.0:
        img = img * (1 - 0.0 * ease((t - DUR + 3.0) / 3.0))
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(OUT / f"{fr:04d}.jpg", quality=92)
    return fr


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    if sys.argv[1:] == ["prueba"]:
        hoja = []
        for wv in [3.4, 0.3, 3e-2, 3e-3, 3e-4, 3e-6, 3e-8, 3e-10, 1e-12]:
            nu, de = campo(CX if wv < 3 else -0.6, CY if wv < 3 else 0.0, wv, 480, 270, int(400 + 900 * -np.log10(wv / 3.4)), 8)
            hoja.append((np.clip(color.colorea(nu, de, None, None, ss=1), 0, 1) * 255).astype(np.uint8))
        Image.fromarray(np.vstack([np.hstack(hoja[i:i + 3]) for i in range(0, 9, 3)])).save("/private/tmp/claude-501/-Users-nicolasmoreno/67aefa3b-2dd0-4fd1-a6d2-d6f193c5b8a6/scratchpad/epi/prueba_epiC.png")
        print("ok prueba")
        sys.exit()
    sel = [int(a) for a in sys.argv[1:]] or range(int(DUR * FPS))
    with ProcessPoolExecutor(max_workers=4) as ex:
        for _ in ex.map(cuadro, sel, chunksize=2): pass
    print("ok", len(sel))
