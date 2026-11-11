"""frames of the film every 0.5 s (160×90), for the hypercut's choice: kept as estables.npy (uint8)"""
import subprocess, numpy as np
from pathlib import Path
FILM = Path.home() / "Development/BN_Videos/entregables/La-frontera/Corrido/La-frontera-corrido-v6.mp4"
out = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", "200", "-to", "3400", "-i", str(FILM), "-vf", "fps=2,scale=160:90", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
np.save(Path(__file__).parent / "estables.npy", np.frombuffer(out, np.uint8).reshape(-1, 90, 160, 3))
