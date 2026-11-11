"""Exploration step.
  paso.py nuevo TAG cre cim radius [facs]       find minibrot near a point, save state TAG, render views
  paso.py elige TAG NEWTAG F px py [rfac] [facs] pick pixel (px,py) of the 480x270 panel rendered at width |s|*F
                                                 around TAG's nucleus, find the minibrot there, save as NEWTAG"""
import sys, os, math, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
import hp, explora

D = "/tmp/mandel"

import motor
REF = None  # (nucleus, period, Z) of the current level, for fast perturbed ball periods

def busca(cr, ci, r):
    if REF is not None:
        (nr, ni), pr, Z = REF
        p = motor.periodo_bola(Z, True, hp.tof(cr - nr), hp.tof(ci - ni), r, 2000000)
        if p <= 0 or p > 30000: return None
    else:
        p = hp.ball_period(cr, ci, r, 400000)
    if p is None: return None
    if REF is not None:
        it, a, b = motor.newton_bola(Z, True, hp.tof(cr - nr), hp.tof(ci - ni), p)
        if it < 0: return None
        cr, ci = nr + hp.fx(a), ni + hp.fx(b)
    n = hp.nucleus(cr, ci, p, steps=12)
    if n is None: return None
    q = hp.min_period(*n, p)
    if q is None: return None
    s = hp.size(*n, q)
    return n, q, s

def guarda_estado(tag, n, p, s, extra=None):
    d = {"re": hp.todec(n[0], 130), "im": hp.todec(n[1], 130), "period": p, "size": s[0], "arg": s[1]}
    if extra: d.update(extra)
    json.dump(d, open(f"{D}/estado_{tag}.json", "w"), indent=1)

def lee_estado(tag):
    d = json.load(open(f"{D}/estado_{tag}.json"))
    return (hp.fx(d["re"]), hp.fx(d["im"])), d["period"], d["size"], d

def paneles(tag, n, p, s, facs):
    ims = []
    for f in facs:
        col, *_ = explora.vista(n[0], n[1], s * f, w=480, h=270, ref=(n, p))
        col = col.copy()
        col[134:136, 236:244] = [0, 1, 0]; col[131:139, 239:241] = [0, 1, 0]
        ims.append(col)
    while len(ims) % 2: ims.append(np.zeros_like(ims[0]))
    big = np.concatenate([np.concatenate(ims[i:i+2], 1) for i in range(0, len(ims), 2)], 0)
    Image.fromarray((np.clip(big, 0, 1) * 255).astype(np.uint8)).save(f"{D}/{tag}.png")

if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "nuevo":
        tag = sys.argv[2]
        cr, ci, r = hp.fx(sys.argv[3]), hp.fx(sys.argv[4]), float(sys.argv[5])
        facs = [float(x) for x in sys.argv[6].split(",")] if len(sys.argv) > 6 else [4, 40, 400, 4000]
        n, p, s = busca(cr, ci, r)
    else:
        tag0, tag = sys.argv[2], sys.argv[3]
        F, px, py = float(sys.argv[4]), float(sys.argv[5]), float(sys.argv[6])
        rfac = float(sys.argv[7]) if len(sys.argv) > 7 else 3.0
        facs = [float(x) for x in sys.argv[8].split(",")] if len(sys.argv) > 8 else [4, 40, 400, 4000]
        n0, p0, s0, d0 = lee_estado(tag0)
        REF = (n0, p0, hp.periodic_orbit(n0[0], n0[1], p0))
        pix = s0 * F / 480
        cr = n0[0] + hp.fx((px - 240) * pix)
        ci = n0[1] - hp.fx((py - 135) * pix)
        if rfac < 0:
            for rf in [0.03, 0.1, 0.3, 1, 3, 10, 30]:
                b = busca(cr, ci, pix * rf)
                if b is None: print(rf, None); continue
                n, p, s = b
                dist = math.hypot(hp.tof(n[0] - cr), hp.tof(n[1] - ci)) / pix
                print("r %.2f px: period %d size %.3g (log10 %.2f) arg %.2f at %.1f px" % (rf, p, s[0], math.log10(s[0]), s[1], dist))
            sys.exit()
        n, p, s = busca(cr, ci, pix * rfac)
        dist = math.hypot(hp.tof(n[0] - cr), hp.tof(n[1] - ci)) / pix
        print("found at %.1f px from the click" % dist)
    print("period", p, "size %.4g arg %.3f  log10 %.2f" % (s[0], s[1], math.log10(s[0])))
    guarda_estado(tag, n, p, s)
    paneles(tag, n, p, s[0], facs)
