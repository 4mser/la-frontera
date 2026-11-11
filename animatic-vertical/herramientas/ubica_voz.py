"""Finds where each voice clip actually sounds in a reel's audio: cross-correlates the clip's 20-ms energy envelope
with the reel's around the expected time, and prints expected vs measured.
    python3 herramientas/ubica_voz.py <reel.wav 16k mono> <clips.json: [[mp3, expected_s], ...]>"""
import array, json, math, subprocess, sys

def env(path, sr=8000, hop=160):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"], capture_output=True).stdout
    a = array.array("h", raw)
    e = [math.sqrt(sum(x * x for x in a[i:i + hop]) / hop) for i in range(0, len(a) - hop, hop)]
    # log energy, mean removed: the voice's rhythm, not its loudness against the music
    l = [math.log(1 + v) for v in e]; m = sum(l) / len(l)
    return [v - m for v in l]

R = env(sys.argv[1])
res = []
for mp3, esp in json.load(open(sys.argv[2])):
    c = env(mp3); n = len(c); nc = math.sqrt(sum(v * v for v in c)) or 1
    best, lag = -9, 0
    for k in range(int((esp - 8) * 50), int((esp + 8) * 50)):
        if k < 0 or k + n > len(R): continue
        seg = R[k:k + n]; s = sum(p * q for p, q in zip(c, seg)); ns = math.sqrt(sum(v * v for v in seg)) or 1
        r = s / (nc * ns)
        if r > best: best, lag = r, k
    res.append((mp3.split("/")[-1], esp, lag / 50, round(best, 2)))
    print(f"{res[-1][0]:12s} esperado {esp:8.2f}  medido {lag/50:8.2f}  dif {lag/50-esp:+6.2f}  r={best:.2f}", flush=True)
