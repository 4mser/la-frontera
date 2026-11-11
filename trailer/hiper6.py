"""the hypercut, cinematic: the moments chosen by elige5.py (something being drawn or moving), rendered again from
their own chapters with no lettering (--props '{"limpio":true}'), then put in an order where every cut matches: the
last frame of a shot and the first of the next share their shape (a circle into a circle, a spiral into a spiral),
never two shots of the same chapter in a row; each shot pushes in slightly, so the motion never stops at a cut.
→ partes6/hiper.mp4 (25 s, the cuts of v1 at 120 BPM)

usage: PYTHONPATH=../animatic/pylib python3 hiper6.py
"""
import json, subprocess
from pathlib import Path
import numpy as np
from arma_trailer import hiper_cortes

AQUI = Path(__file__).resolve().parent
ANI = AQUI.parent / "animatic"
BUNDLE = "/private/tmp/claude-501/-Users-nicolasmoreno/67aefa3b-2dd0-4fd1-a6d2-d6f193c5b8a6/scratchpad/bundleH"
P6 = AQUI / "partes6"; P6.mkdir(exist_ok=True)
CAPS = [("Cap1", 178.987), ("Cap2", 479.36), ("Cap3", 1011.306667), ("Cap4", 1369.813667), ("Cap5", 1665.920667),
        ("Cap6", 2082.859667), ("Cap7", 2353.238667), ("Cap8", 2647.425667), ("Cap9", 2974.742667), ("Cap10", 3166.977667)]
N_REND = 16                                        # frames rendered per moment (the longest cut is 15)


def capitulo(s):
    k = max(i for i, (_, off) in enumerate(CAPS) if s >= off)
    return k, CAPS[k][0], s - CAPS[k][1]


def render(j, s):
    out = P6 / f"n{j:03d}.mp4"
    if out.exists(): return out
    k, comp, c = capitulo(s)
    a = int(round(c * 30))
    subprocess.run(["npx", "remotion", "render", BUNDLE, comp, str(out), f"--frames={a}-{a + N_REND - 1}", "--muted", "--props={\"limpio\":true}",
                    "--gl=angle", "--timeout=240000", "--crf=14", "--log=error"], cwd=ANI, check=True, capture_output=True)
    return out


def miniatura(ruta, cual):
    """a 32×18 grey thumbnail of the first or last frame, normalised (its shape)"""
    sel = "select=eq(n\\,0)" if cual == 0 else f"select=eq(n\\,{N_REND - 1})"
    b = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(ruta), "-vf", f"{sel},scale=32:18,format=gray", "-frames:v", "1", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    m = np.frombuffer(b, np.uint8).astype(np.float32)
    return (m - m.mean()) / (m.std() + 4.0), float(m.mean())


def main():
    plan = json.loads((AQUI / "hiper5b.json").read_text())
    todos = [render(j, s) for j, (_, s, _) in enumerate(plan)]
    # the clean render of a moment can be empty (its picture was lettering): keep the 66 fullest, in the film's order
    def lleno(c):
        b = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(c), "-vf", "select=eq(n\\,8),scale=160:90,format=gray", "-frames:v", "1", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
        g = np.frombuffer(b, np.uint8).astype(np.float32) / 255
        return float(np.clip(g.mean(), 0, 0.4) + 6 * np.abs(np.diff(g.reshape(90, 160), axis=1)).mean()), float(g.mean())
    q = [lleno(c) for c in todos]
    validos = [j for j in range(len(todos)) if q[j][1] > 0.05 and q[j][0] > 0.12]
    validos = sorted(sorted(validos, key=lambda j: -q[j][0])[:len(hiper_cortes())])
    print("válidos", len([j for j in range(len(todos)) if q[j][1] > 0.05 and q[j][0] > 0.12]), "de", len(todos))
    clips = [todos[j] for j in validos]
    cap = [capitulo(plan[j][1])[0] for j in validos]
    ini = [miniatura(c, 0) for c in clips]; fin = [miniatura(c, 1) for c in clips]
    # the chain: from the first shot, always on to the unused shot whose first frame best continues this one's last
    orden, libres = [0], set(range(1, len(clips)))
    while libres:
        a = orden[-1]
        def costo(b):
            forma = 1 - float((fin[a][0] * ini[b][0]).mean())
            luz = abs(fin[a][1] - ini[b][1]) / 60
            return forma + luz + (0.8 if cap[b] == cap[a] else 0) + 0.004 * abs(b - a)    # and loosely in the film's order
        b = min(libres, key=costo); orden.append(b); libres.remove(b)
    cortes = hiper_cortes()
    partes = []
    for i, ((t, d), j) in enumerate(zip(cortes, orden)):
        n = round((t + d - 100.0) * 30) - round((t - 100.0) * 30)
        out = P6 / f"c{i:03d}.mp4"
        if not out.exists():
            # a slow push-in across the shot (1.00 → 1.04), about the centre
            z = f"scale=iw*(1+0.04*n/{max(1, n - 1)}):ih*(1+0.04*n/{max(1, n - 1)}):eval=frame,crop=1920:1080"
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(clips[j]), "-vf", f"{z},fps=30,format=yuv420p", "-frames:v", str(n),
                            "-c:v", "libx264", "-preset", "fast", "-crf", "14", str(out)], check=True)
        partes.append(out)
    (P6 / "hiper.txt").write_text("".join(f"file '{p}'\n" for p in partes))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(P6 / "hiper.txt"), "-c", "copy", str(P6 / "hiper.mp4")], check=True)
    (P6 / "orden.json").write_text(json.dumps(orden))
    print("hipercorte", len(partes), "planos")


if __name__ == "__main__":
    main()
