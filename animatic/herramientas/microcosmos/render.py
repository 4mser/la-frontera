"""Render driver for the microcosm shot.

  PYTHONPATH=../../pylib python3 render.py all  [--out DIR] [--workers N]
  PYTHONPATH=../../pylib python3 render.py frames 0 150 300 [--out DIR]
  PYTHONPATH=../../pylib python3 render.py sheet [--n 12] [--out FILE.jpg]
  PYTHONPATH=../../pylib python3 render.py range A B [--step S] [--out DIR]
"""
import argparse
import os
import subprocess
import sys
import time
from multiprocessing import Pool

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
DEF_OUT = os.path.join(ROOT, 'public', 'p10', 'vid', 'micro')
os.environ.setdefault('MICRO_CACHE', '/tmp/microcosmos_scene.pkl')


def build_lib():
    src = os.path.join(HERE, 'render.c'); so = os.path.join(HERE, 'librender.so')
    if not os.path.exists(so) or os.path.getmtime(so) < os.path.getmtime(src):
        subprocess.check_call(['cc', '-O3', '-ffast-math', '-shared', '-fPIC', '-o', so, src, '-lm'])


def _job(a):
    i, out, scale = a
    import escena
    p = os.path.join(out, '%04d.jpg' % i)
    t0 = time.time()
    escena.frame(i, p, scale)
    return i, time.time() - t0


def run(frames, out, workers, scale=1.0):
    os.makedirs(out, exist_ok=True)
    import escena
    escena.scene()  # build the cache once before forking workers
    t0 = time.time()
    done = 0
    with Pool(workers) as pool:
        for i, dt in pool.imap_unordered(_job, [(i, out, scale) for i in frames]):
            done += 1
            if done % 25 == 0 or done == len(frames):
                el = time.time() - t0
                print('%d/%d  %.1fs elapsed  eta %.0fs' % (done, len(frames), el, el / done * (len(frames) - done)), flush=True)
    return time.time() - t0


def sheet(frames, src, out, cols=4):
    from PIL import Image, ImageDraw
    ims = [Image.open(os.path.join(src, '%04d.jpg' % i)) for i in frames]
    w, h = 480, 270
    rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (cols * w, rows * h), (20, 20, 20))
    dr = ImageDraw.Draw(S)
    for k, (i, im) in enumerate(zip(frames, ims)):
        x, y = (k % cols) * w, (k // cols) * h
        S.paste(im.resize((w, h), Image.LANCZOS), (x, y))
        dr.text((x + 6, y + 4), '%d  t=%.1fs' % (i, i / 30), fill=(255, 220, 160))
    S.save(out, quality=90)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('mode')
    ap.add_argument('args', nargs='*', type=float)
    ap.add_argument('--out')
    ap.add_argument('--workers', type=int, default=max(os.cpu_count() - 1, 1))
    ap.add_argument('--n', type=int, default=12)
    ap.add_argument('--step', type=int, default=1)
    ap.add_argument('--scale', type=float, default=1.0)
    a = ap.parse_args()
    build_lib()
    sys.path.insert(0, HERE)
    import escena
    if a.mode == 'all':
        el = run(list(range(escena.NFR)), a.out or DEF_OUT, a.workers)
        print('total %.1f s' % el)
    elif a.mode == 'frames':
        run([int(x) for x in a.args], a.out or DEF_OUT, a.workers, a.scale)
    elif a.mode == 'range':
        run(list(range(int(a.args[0]), int(a.args[1]), a.step)), a.out or DEF_OUT, a.workers, a.scale)
    elif a.mode == 'sheet':
        n = a.n
        fr = [int(round(k * (escena.NFR - 1) / (n - 1))) for k in range(n)]
        tmp = os.path.join(os.path.dirname(a.out or '/tmp/x.jpg'), 'sheet_frames')
        run(fr, tmp, a.workers)
        sheet(fr, tmp, a.out or os.path.join(tmp, 'sheet.jpg'))
        print(a.out)
