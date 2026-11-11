"""Timing grid for La frontera (DIRECCION-motion.md): a heart that speeds up from 60 to 120 BPM and stays at 120 until
the collapse; bars of four beats; then the voice section and the return to the first frame.

Usage: python3 herramientas/tiempos_frontera.py  ->  src/frontera.json
"""
import json
import math
import subprocess
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
N_LATIDOS = 52
t, latidos = 0.6, []
for k in range(N_LATIDOS):
    latidos.append(round(t, 3))
    t += 0.5 + 0.5 * math.exp(-k / 5)
compases = [latidos[4 * b] for b in range(N_LATIDOS // 4)] + [round(t, 3)]
colapso = latidos[48] + 0.25            # the six wedges close into a point
voz_dur = 28.49
ff = subprocess.run(["python3", "-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"], capture_output=True, text=True, env={"PYTHONPATH": str(RAIZ / "pylib")}).stdout.strip()
if ff:
    salida = subprocess.run([ff, "-i", str(RAIZ / "public" / "voz" / "montaje.mp3")], capture_output=True, text=True).stderr
    import re
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", salida)
    if m:
        voz_dur = 60 * int(m[2]) + float(m[3])
silencio = colapso + 0.05
latido_solo = colapso + 0.55
florece = colapso + 1.0                 # the point opens into the whole set
voz = florece + 0.7
D = {
    "fps": 30, "latidos": latidos, "compases": compases, "colapso": round(colapso, 3), "silencio": round(silencio, 3),
    "latidoSolo": round(latido_solo, 3), "florece": round(florece, 3), "voz": round(voz, 3),
    "regla": round(voz + 3.5, 3), "reglaFin": round(voz + 10.8, 3), "titulo": round(voz + voz_dur + 0.4, 3),
}
D["vuelta"] = round(D["titulo"] + 4.0, 3)
D["total"] = round(D["vuelta"] + 2.6, 3)
(RAIZ / "src" / "frontera.json").write_text(json.dumps(D, indent=1))
print({k: v for k, v in D.items() if k not in ("latidos", "compases")}, "latidos", len(latidos), "último", latidos[-1])
