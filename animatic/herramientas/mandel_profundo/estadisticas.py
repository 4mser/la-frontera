"""Low-resolution pass over every keyframe: escape-count statistics used to choose max iterations and the
colouring parameters (smoothed along the zoom). Writes estadisticas.json."""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import camino, hp, motor

def referencia():
    d = camino.DEST
    n = (hp.fx(d["nucleus_re"]), hp.fx(d["nucleus_im"]))
    Z = hp.periodic_orbit(n[0], n[1], d["period"])
    absc = complex(float(d["nucleus_re"]), float(d["nucleus_im"]))
    return Z, absc

def offset(k):
    o = complex(*camino.DEST["camera_offset_from_nucleus"]) + camino.centro_rel(k)
    return o

if __name__ == "__main__":
    Z, absc = referencia()
    W, H = 320, 180
    out = []
    numin_prev = 0
    t0 = time.time()
    for k in range(camino.KMAX + 1):
        w = camino.ancho(k)
        o = offset(k)
        mi = int(max(20000, 6 * numin_prev + 20000))
        nu, de = motor.calcula_bla(Z, W, H, o.real, o.imag, w / W, mi, ref_abs=absc if w > 1e-9 else None)
        ext = nu[nu >= 0]
        pc = np.percentile(ext, [0, 1, 5, 25, 50, 75, 95, 99, 99.9]).tolist()
        tardio = float((ext > mi * 0.5).mean())
        out.append({"k": k, "maxit_stats": mi, "pct": pc, "inside": float((nu < 0).mean()), "late": tardio})
        numin_prev = pc[0]
        print(k, mi, [round(x) for x in pc], "in %.3f late %.4f" % (out[-1]["inside"], tardio), "%.0fs" % (time.time() - t0), flush=True)
    json.dump(out, open(os.path.join(camino.AQUI, "estadisticas.json"), "w"), indent=0)
