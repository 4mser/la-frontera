"""LA FRONTERA · the 10 YouTube episodes: each chapter cut from the 4K master (v10) at the blacks between chapters,
followed by the preview of the next chapter (arma_previas.py), plus its Spanish subtitles (the film's SRT, shifted,
and the preview's own voice).

usage: python3 arma_episodios.py [episode numbers, default 1..10]
  → entregables/La-frontera/YouTube/episodios/La-frontera-EpNN.mp4 + .es.srt
"""
import json, re, subprocess, sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
ANI = AQUI.parent / "animatic"
YT = Path.home() / "Development/BN_Videos/entregables/La-frontera/YouTube"
MASTER = YT / "La-frontera-YouTube-4K.mp4"
SRT = YT / "La-frontera.es.srt"
SAL = YT / "episodios"
FIN = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(MASTER)], capture_output=True, text=True).stdout)

# [start, end] in the master: from 0.3 s before a chapter's black ends to 0.35 s into the next black
EPISODIOS = {
    1: (0.0, 479.40),       # opening + I · La regla
    2: (482.70, 1011.00),
    3: (1011.73, 1369.45),
    4: (1373.13, 1660.35),
    5: (1669.70, 2082.50),
    6: (2086.70, 2352.95),
    7: (2353.33, 2682.55),
    8: (2682.62, 3013.95),
    9: (3017.60, 3205.60),
    10: (3209.70, FIN),     # X · La frontera + Coda + credits
}


def hms(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def segs(x):
    h, m, s, ms = map(int, re.findall(r"\d+", x)); return h * 3600 + m * 60 + s + ms / 1000


def subtitulos(ep, a, b, previa):
    out = []
    for blq in SRT.read_text().strip().split("\n\n"):
        l = blq.split("\n")
        if len(l) < 3: continue
        t0, t1 = [segs(x) for x in l[1].split(" --> ")]
        if t1 > a and t0 < b:
            out.append((max(0.0, t0 - a), min(b, t1) - a, "\n".join(l[2:])))
    if previa:
        d = b - a
        cap = json.loads((AQUI / f"previas/previa-{ep + 1}.json").read_text())
        intro = 2.52                                            # voz/intro.mp3, checked with whisper
        out.append((d + 0.45, d + 0.45 + intro, "En el próximo capítulo de La frontera."))
        import importlib.util
        spec = importlib.util.spec_from_file_location("ap", AQUI / "arma_previas.py"); ap = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(ap)
        for (g, (v0, v1), T) in zip(ap.CAPS[ep + 1]["ganchos"], cap["voz"], [cap["tiempos"]["A"], cap["tiempos"]["B"]]):
            v = json.loads((ANI / f"src/cap{ep + 1}_voz.json").read_text())[g[0] - 1]
            pal = [w for w, ts in v["palabras"] if v0 - 0.01 <= ts < v1]
            # the subtitle text: the same words, with the film's spelling (the SRT), found by the phrase's first words
            texto = frase_srt(" ".join(pal)) or " ".join(pal)
            out.append((d + T + 0.25, d + T + 0.25 + (v1 - v0), texto))
    return "\n".join(f"{i}\n{hms(t0)} --> {hms(t1)}\n{txt}\n" for i, (t0, t1, txt) in enumerate(out, 1))


def plano(s):
    import unicodedata
    s = unicodedata.normalize("NFD", s.lower())
    return " ".join(re.findall(r"\w+", "".join(ch for ch in s if unicodedata.category(ch) != "Mn")))


def frase_srt(palabras):
    """the phrase as the film's SRT writes it (its spelling, punctuation and numbers in words)."""
    texto = " ".join(" ".join(b.split("\n")[2:]) for b in SRT.read_text().strip().split("\n\n"))
    p = plano(palabras).split()
    toks = re.findall(r"\S+", texto)
    pt = [plano(t) for t in toks]
    for i in range(len(toks)):
        j, k, n = i, 0, len(p)
        while k < n and j < len(toks):
            w = pt[j].split()
            if not w: j += 1; continue
            if w != p[k:k + len(w)]: break
            k += len(w); j += 1
        if k == n:
            frase = " ".join(toks[i:j])
            return frase[0].upper() + frase[1:]
    return None


def episodio(ep):
    a, b = EPISODIOS[ep]
    SAL.mkdir(exist_ok=True)
    cuerpo = SAL / f".cuerpo-{ep:02d}.mp4"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{a:.3f}", "-i", str(MASTER), "-t", f"{b - a:.3f}",
                    "-vf", "fps=30,format=yuv420p" + (",fade=in:d=0.3" if ep > 1 else ""), "-af", "aresample=48000" + (",afade=in:d=0.3" if ep > 1 else ""),
                    "-c:v", "hevc_videotoolbox", "-b:v", "45M", "-tag:v", "hvc1", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-ac", "2",
                    str(cuerpo)], check=True)
    final = SAL / f"La-frontera-Ep{ep:02d}.mp4"
    if ep < 10:
        lista = SAL / f".lista-{ep:02d}.txt"
        lista.write_text(f"file '{cuerpo}'\nfile '{AQUI / f'previas/previa-{ep + 1}.mp4'}'\n")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lista), "-c", "copy",
                        "-movflags", "+faststart", str(final)], check=True)
        lista.unlink()
        cuerpo.unlink()
    else:
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(cuerpo), "-c", "copy", "-movflags", "+faststart", str(final)], check=True)
        cuerpo.unlink()
    d = b - a
    (SAL / f"La-frontera-Ep{ep:02d}.es.srt").write_text(subtitulos(ep, a, b, ep < 10))
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(final)], capture_output=True, text=True).stdout)
    print(ep, f"capítulo {d:.1f}s + previa → {dur:.1f}s", final.name, flush=True)


if __name__ == "__main__":
    for e in [int(x) for x in sys.argv[1:]] or range(1, 11):
        episodio(e)
