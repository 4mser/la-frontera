"""LA FRONTERA · trailer v1: picture from the full film (entregables/.../La-frontera-corrido-v6.mp4), cut to the beat.

Acts (trailer time → film time): the cold open with its own sound; the rule; the infinite; three questions; chaos;
«solo queda la regla»; the whole film in a hypercut at 120 BPM that speeds up to a hit; the copy becoming an eye;
the title (with its own sound); «Pronto · en YouTube · @bnlectures»; the mark forming (with its own sound).

usage: PYTHONPATH=../animatic/pylib python3 arma_trailer.py [video | lista]
Writes partes/*.mp4, video.mp4 (no sound) and plan.json (what the audio script reads).
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np

AQUI = Path(__file__).resolve().parent
FILM = Path.home() / "Development/BN_Videos/entregables/La-frontera/Corrido/La-frontera-corrido-v6.mp4"
PARTES = AQUI / "partes"
FPS = 30

# (trailer start, film start, duration, what)
PLANOS = [
    (0.0, 0.0, 20.0, "apertura: el latido, los destellos, la costa de Chile"),
    (20.0, 189.0, 14.0, "la regla: el punto que salta"),
    (34.0, 509.0, 12.0, "el conjunto y el valle de los caballitos de mar"),
    (46.0, 889.0, 9.0, "la espiral profunda"),
    (55.0, 928.0, 7.0, "Leibniz: ¿por qué hay algo y no nada?"),
    (62.0, 1097.0, 7.0, "la frontera de España y Portugal"),
    (69.0, 1950.0, 7.0, "el corazón: un día de latidos"),
    (76.0, 2048.0, 4.0, "el diagrama de bifurcación, hasta el caos"),
    (80.0, 2300.0, 12.0, "Lorenz: saber la regla no es saber el resultado"),
    (92.0, 3366.0, 8.0, "el descenso: ninguna medición llega aquí"),
]
T_HIPER, T_HIPER_FIN = 100.0, 125.0
FINAL = [
    (125.0, 3412.0, 10.0, "la copia se vuelve un ojo"),
    (135.0, 3736.9, 8.0, "el título"),
    (143.0, None, 4.0, "cartel: pronto en YouTube"),
    (147.0, 3811.6, 13.0, "la marca"),
]
DUR = 160.0


def hiper_cortes():
    """the cuts of the hypercut: 0.5 s each (one beat at 120 BPM), the last 8 s at 0.25 s"""
    t, cortes = T_HIPER, []
    while t < T_HIPER_FIN - 1e-6:
        d = 0.5 if t < T_HIPER_FIN - 8.0 else 0.25
        cortes.append((round(t, 3), d)); t += d
    return cortes


def candidatos(paso=3.0, t0=200.0, t1=3400.0):
    """scores every few seconds of the film: bright, colourful and detailed frames win; black or text-only frames lose"""
    cache = AQUI / "candidatos.json"
    if cache.exists(): return json.loads(cache.read_text())
    tt = np.arange(t0, t1, paso)
    w, h = 160, 90
    out = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", str(t0), "-to", str(t1), "-i", str(FILM), "-vf", f"fps=1/{paso},scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    fr = np.frombuffer(out, np.uint8).reshape(-1, h, w, 3).astype(np.float32) / 255
    res = []
    for k, f in enumerate(fr):
        lum = f.mean(); sat = (f.max(axis=2) - f.min(axis=2)).mean(); det = np.abs(np.diff(f.mean(axis=2), axis=1)).mean()
        res.append([float(tt[k]), float(lum), float(sat), float(det)])
    cache.write_text(json.dumps(res))
    return res


def elige(n):
    """n frames spread over the film in order: the film is split in n slices and the best frame of each is taken"""
    c = np.array(candidatos())
    score = np.clip(c[:, 1], 0, 0.5) * 1.0 + c[:, 2] * 1.6 + c[:, 3] * 6.0 - (c[:, 1] < 0.07) * 5.0
    tramos = np.array_split(np.arange(len(c)), n)
    return [float(c[ix[np.argmax(score[ix])], 0]) for ix in tramos]


def extrae(nombre, t_src, dur, fuente=FILM, t_dest=None):
    """a part with an exact number of frames: the ones its span covers on the trailer's own frame grid"""
    n = round((t_dest + dur) * FPS) - round(t_dest * FPS) if t_dest is not None else round(dur * FPS)
    out = PARTES / f"{nombre}-{n}-{t_src:.2f}.mp4"
    if out.exists(): return out
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{t_src:.3f}", "-i", str(fuente), "-frames:v", str(n), "-an",
                    "-vf", f"fps={FPS},format=yuv420p", "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-profile:v", "high", str(out)], check=True)
    return out


def video():
    PARTES.mkdir(exist_ok=True)
    lista, plan = [], {"planos": [], "hiper": []}
    for i, (a, s, d, que) in enumerate(PLANOS):
        lista.append(extrae(f"a{i:02d}", s, d, t_dest=a)); plan["planos"].append([a, s, d, que])
    cortes = hiper_cortes(); fuentes = elige(len(cortes))
    for j, ((a, d), s) in enumerate(zip(cortes, fuentes)):
        lista.append(extrae(f"h{j:03d}", s, d, t_dest=a)); plan["hiper"].append([a, s, d])
    for i, (a, s, d, que) in enumerate(FINAL):
        if s is None:
            lista.append(extrae(f"f{i:02d}", 0.0, d, PARTES / "cartel.mp4", t_dest=a))       # same encoding as every other part
        else:
            lista.append(extrae(f"f{i:02d}", s, d, t_dest=a))
        plan["planos"].append([a, s, d, que])
    (AQUI / "lista.txt").write_text("".join(f"file '{p}'\n" for p in lista))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(AQUI / "lista.txt"),
                    "-vf", f"fps={FPS},fade=t=out:st={DUR - 2.0}:d=2.0", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", str(AQUI / "video.mp4")], check=True)
    (AQUI / "plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=1))
    print("video.mp4", len(lista), "planos")


if __name__ == "__main__":
    if sys.argv[1:] == ["lista"]:
        cortes = hiper_cortes(); print(len(cortes), "cortes"); print([round(x) for x in elige(len(cortes))])
    else:
        video()
