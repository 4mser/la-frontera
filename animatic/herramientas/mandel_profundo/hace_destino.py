"""Builds destino.json from the exploration states (/tmp/mandel/estado_[a-f].json): the chain of minibrots
the zoom passes by, and the final target (camera centre = visual centre of the last minibrot)."""
import sys, os, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hp

CADENA = ["a", "b", "c", "d", "e", "f"]
C_VISUAL = -0.65  # visual centre of the Mandelbrot set in nucleus-relative standard coordinates

niveles = []
for t in CADENA:
    d = json.load(open(f"/tmp/mandel/estado_{t}.json"))
    n = (hp.fx(d["re"]), hp.fx(d["im"]))
    p = d["period"]
    a, arg, s = hp.size(*n, p)
    resid = hp.true_period_check(*n, p)
    niveles.append({"re": hp.todec(n[0], 120), "im": hp.todec(n[1], 120), "period": p, "size": a, "size_arg": arg,
                    "log10_size": math.log10(a), "residual_zP": resid})
    print(t, p, "%.3e" % a, "residual %.1e" % resid)
fin = niveles[-1]
n = (hp.fx(fin["re"]), hp.fx(fin["im"]))
s = fin["size"] * complex(math.cos(fin["size_arg"]), math.sin(fin["size_arg"]))
off = s * C_VISUAL
cam = (n[0] + hp.fx(off.real), n[1] + hp.fx(off.imag))
dest = {
    "description": "Deep Mandelbrot zoom target for La frontera (final chapter). Camera centre = visual centre of the final minibrot.",
    "center_re": hp.todec(cam[0], 120), "center_im": hp.todec(cam[1], 120),
    "nucleus_re": fin["re"], "nucleus_im": fin["im"],
    "period": fin["period"], "size": fin["size"], "size_arg_rad": fin["size_arg"],
    "camera_offset_from_nucleus": [off.real, off.imag],
    "start_center": [-0.75, 0.0], "start_width": 3.2,
    "chain": niveles,
}
json.dump(dest, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "destino.json"), "w"), indent=1)
print("centre", dest["center_re"][:40], dest["center_im"][:40])
