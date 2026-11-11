"""Word-timed subtitles for a vertical episode reel (ReelEp1, ReelEp2), from the voice itself.

Times: each voice clip's start in the reel timeline (the same arithmetic as VideoReelEp1 / VideoApertura, checked
against the reel's audio with herramientas/ubica_voz.py: 0.00–0.03 s) plus the word offsets that the TTS gave
(*_voz.json). Text: the film's reviewed .srt (spelling and punctuation; the TTS words are phonetic, «Benuaá»),
matched word by word to the voice words. Cut into short lines for a phone, at punctuation where possible.

    python3 herramientas/subs_desde_voz.py <ep>  → src/subs_ep<ep>.json
"""
import json, re, sys, unicodedata
from pathlib import Path

AQUI = Path(__file__).resolve().parent.parent
SRC = AQUI / "src"
EP = int(sys.argv[1]) if len(sys.argv) > 1 else 1
SRT = Path.home() / f"Development/BN_Videos/entregables/La-frontera/YouTube/episodios/La-frontera-Ep{EP:02d}.es.srt"
FPS = 30
MAX = 30                    # characters per line

if EP == 1:
    # the opening (prologue, then the intro with the prologue's last two lines) and chapter I after 0.3 s of black
    P = json.loads((SRC / "prologo2.json").read_text()); M = json.loads((SRC / "montaje.json").read_text())
    K = json.loads((SRC / "cap1p.json").read_text())
    inicio_intro = round((P["inicioIntro"] - M["latidos"][0]) * FPS)
    inicio_cap1 = inicio_intro + round(M["total"] * FPS) + 9
    pv, cv = json.loads((SRC / "prologo2_voz.json").read_text()), json.loads((SRC / "cap1p_voz.json").read_text())
    clips = [(t, pv[k]) for k, t in enumerate(P["voz"])]
    clips += [(inicio_intro / FPS + t, pv[4 + k]) for k, t in enumerate(P["vozIntro"])]
    clips += [(inicio_cap1 / FPS + t, cv[k]) for k, t in enumerate(K["voz"])]
else:
    # the chapter alone, from 0; clips at −1 are not played
    K = json.loads((SRC / f"cap{EP}.json").read_text()); cv = json.loads((SRC / f"cap{EP}_voz.json").read_text())
    clips = sorted(((t, cv[k]) for k, t in enumerate(K["voz"]) if t >= 0), key=lambda x: x[0])
# voice words with their end: the next word's start, or the clip's end
V = []
for t, c in clips:
    pal = c["palabras"]
    for i, (w, o) in enumerate(pal):
        fin = pal[i + 1][1] if i + 1 < len(pal) else c["fin"]
        V.append([w, t + o, t + min(fin, o + 0.9)])

def norm(w):
    return re.sub(r"[^a-z0-9ñ]", "", "".join(ch for ch in unicodedata.normalize("NFD", w.lower()) if unicodedata.category(ch) != "Mn"))

# the .srt's text in order, up to the end of the chapter (the preview of Ep. 2 is not in the reel), without the
# stutters of its timing («una de sus» before «Mira una de sus partes:»)
cues = []
for b in SRT.read_text(encoding="utf-8").strip().split("\n\n"):
    l = b.split("\n")
    if len(l) >= 3: cues.append(" ".join(l[2:]).strip())
fin = next(i for i, c in enumerate(cues) if c.startswith("En el próximo capítulo"))
cues = cues[:fin]
cues = [c for i, c in enumerate(cues) if not (i + 1 < len(cues) and norm(c) in norm(cues[i + 1]) and len(c) < len(cues[i + 1]))]
S = [w for c in cues for w in c.split()]

# match the two word lists (difflib); in a replaced stretch of the same length the words pair one to one (the TTS's
# own spellings: «Benuaá», «Duadí», numbers); anything else lies between its neighbours
import difflib
nS, nV = [norm(w) for w in S], [norm(w[0]) for w in V]
tiempos = [None] * len(S)
for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, nS, nV, autojunk=False).get_opcodes():
    if op == "equal" or (op == "replace" and i2 - i1 == j2 - j1):
        for k in range(i2 - i1): tiempos[i1 + k] = (V[j1 + k][1], V[j1 + k][2])
    elif op == "replace" and j2 > j1:
        for k in range(i2 - i1):                            # spread over the voice words it replaces
            v = V[j1 + min(j2 - j1 - 1, round(k * (j2 - j1) / (i2 - i1)))]; tiempos[i1 + k] = (v[1], v[2])
sin = [S[i] for i, t in enumerate(tiempos) if t is None]
assert len(sin) <= 6, f"text words without voice: {sin}"
for i, t in enumerate(tiempos):
    if t is None:
        a = tiempos[i - 1][1]; tiempos[i] = (a, a + 0.3)
for i in range(1, len(tiempos)):                            # never back in time
    if tiempos[i][0] < tiempos[i - 1][0]: tiempos[i] = (tiempos[i - 1][0], max(tiempos[i - 1][0], tiempos[i][1]))

# lines: first phrases (a sentence end, a comma or colon, a pause > 0.5 s); a phrase longer than MAX is split into
# the fewest even pieces, never leaving a line on a little word («a», «de», «y») that belongs to the next one
DEBIL = set("a al de del el la las lo los y e o u en un una unos unas que se por con para su sus es mi tu le".split())
frases, cur = [], []
for i, w in enumerate(S):
    cur.append(i)
    sig = i + 1 < len(S)
    pausa = sig and tiempos[i + 1][0] - tiempos[i][1] > 0.5
    if not sig or w[-1] in ".?!…:;" or (w[-1] == "," and len(" ".join(S[k] for k in cur)) > 12) or pausa:
        frases.append(cur); cur = []

def partir(f):
    L = lambda ks: len(" ".join(S[k] for k in ks))
    if L(f) <= MAX: return [f]
    n = -(-L(f) // MAX)
    while True:
        # dynamic programme: n pieces, each <= MAX, minimise the spread of lengths plus a cost for weak line ends
        best = {0: (0.0, [])}
        for _ in range(n):
            nxt = {}
            for ini, (c, cortes) in best.items():
                for fin in range(ini + 1, len(f) + 1):
                    largo = L(f[ini:fin])
                    if largo > MAX: break
                    pen = (largo - L(f) / n) ** 2 + (400 if fin < len(f) and norm(S[f[fin - 1]]) in DEBIL else 0)
                    if fin not in nxt or c + pen < nxt[fin][0]: nxt[fin] = (c + pen, cortes + [fin])
            best = nxt
        if len(f) in best:
            cortes, ini, out = best[len(f)][1], 0, []
            for c in cortes: out.append(f[ini:c]); ini = c
            return out
        n += 1

lineas = [p for f in frases for p in partir(f)]
out = []
for n, ln in enumerate(lineas):
    t0 = tiempos[ln[0]][0]; t1 = tiempos[ln[-1]][1] + 0.35
    if n + 1 < len(lineas): t1 = min(t1, tiempos[lineas[n + 1][0]][0])
    out.append({"t0": round(t0, 3), "t1": round(t1, 3), "palabras": [[S[k], round(tiempos[k][0], 3)] for k in ln]})
(SRC / f"subs_ep{EP}.json").write_text(json.dumps(out, ensure_ascii=False))
print(len(out), "líneas · palabras", len(S), "· sin voz:", sin)
