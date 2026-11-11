"""«Qué extraño es existir»: prepara el material real para la composición Existir (1080×1920, 30 fps).
Videos → public/existir/vid/<nombre>/0000.jpg… (tramo, velocidad, recorte vertical centrado en cx).
Fotos → public/existir/<nombre>.jpg (reducidas, sin recortar: el encuadre lo decide la escena).
Procedencia y licencias: fractales/material-prologo/PROCEDENCIA.md y que-extrano-es-existir/material/PROCEDENCIA.md.

Uso: python3 herramientas/existir_prep.py [nombres…]   (sin nombres: todo lo que falte)
"""
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
UNI = RAIZ.parent / "material-prologo" / "universo"
MAT = RAIZ.parent.parent / "que-extrano-es-existir" / "material"
OUT = RAIZ / "public" / "existir"

# nombre: (fuente, inicio s, duración en pantalla s, velocidad, cx del recorte 0..1, filtro extra)
VIDEOS = {
    "alma": (UNI / "via-lactea-alma-timelapse.mp4", 0.0, 7.2, 1.0, 0.42, ""),
    "pilares": (UNI / "nebulosa-pilares-creacion-3d.mp4", 49.0, 6.8, 1.0, 0.5, ""),
    "webb": (UNI / "webb-ceers-vuelo-5000-galaxias.mp4", 8.0, 7.2, 1.0, 0.5, ""),
    "andromeda": (UNI / "andromeda-zoom-phat.mp4", 23.5, 5.6, 2.0, 0.5, ""),
    "mitosis": (MAT / "01c-mitosis-embrion-drosophila-lightsheet.webm", 15.0, 3.7, 1.0, 0.5, "unsharp=5:5:0.6"),
    "abrazo": (MAT / "09c-pareja-silueta-abrazo-vertical-4k.mp4", 0.3, 5.1, 1.0, 0.5, ""),
    "sol": (MAT / "05-sol-sdo-171-4k-flare-x87-2024-05-14.mp4", 0.0, 4.1, 1.0, 0.5, "SOL"),
    "vinilo": (MAT / "disco" / "p3713449.mp4", 8.5, 3.4, 2.0, 0.5, "ANCHO"),
    "issA": (MAT / "10c-iss-cinco-minutos-en-orbita-atardecer-noche.webm", 25.0, 3.4, 1.0, 0.15, ""),
    "issB": (MAT / "10a-iss-aurora-noche-tormenta-2025-11-12-4k.mp4", 16.0, 7.6, 1.0, 0.35, ""),
    "nosotros": (MAT / "amanecer" / "p15787200.mp4", 0.5, 2.6, 1.0, 0.5, ""),
    "amanecer": (MAT / "amanecer" / "p39020806.mp4", 0.0, 12.0, 1.0, 0.5, ""),
    "jades": (MAT / "epico" / "jades-vuelo.mp4", 0.0, 8.2, 1.0, 0.5, ""),
    "redcosmica": (RAIZ.parent / "material-prologo" / "nasa-svs14598-cosmic-web-2200-12s.mp4", 0.0, 5.4, 1.0, 0.5, ""),
}
FOTOS = {
    "flammarion": (MAT / "07a-grabado-flammarion-1888-con-leyenda.jpg", 3000),
    "cielo-a": (MAT / "03a-silueta-via-lactea-chajnantor-horalek.jpg", 3400),
    "cielo-b": (MAT / "03b-silueta-plataforma-paranal-nube-magallanes.jpg", 3400),
    "punto": (MAT / "04-pale-blue-dot-revisited-pia23645.png", 5230),
    "tierra-noche": (MAT / "06a-tierra-black-marble-2016-13500x6750.jpg", 8192),
    "tierra-nubes": (MAT / "06b-tierra-nubes-8192x4096.png", 8192),
}


def video(nombre, fuente, t0, dur, vel, cx, extra):
    d = OUT / "vid" / nombre
    if d.exists():
        shutil.rmtree(d)
    d.mkdir(parents=True)
    vf = f"setpts=PTS/{vel},fps=30,scale=-2:1920:flags=lanczos,crop=1080:1920:(iw-1080)*{cx}:0" + (f",{extra}" if extra else "")
    if extra == "ANCHO":  # más angosto que 9:16: se ajusta al ancho y se recorta el alto
        vf = f"setpts=PTS/{vel},fps=30,scale=1080:-2:flags=lanczos,crop=1080:1920:0:(ih-1920)/2"
    if nombre == "mitosis":   # el original es un time-lapse a 12 fps: cuadros intermedios por movimiento hasta 30 fps
        vf = f"minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,scale=-2:1920:flags=lanczos,crop=1080:1920:(iw-1080)*{cx}:0,unsharp=5:5:0.6"
    if extra == "SOL":   # el disco entero, a lo ancho, centrado en negro
        vf = f"setpts=PTS/{vel},fps=30,scale=1080:1080:flags=lanczos,pad=1080:1920:0:420:black"
    if "cosmic-web-2200" in str(fuente):
        vf = f"setpts=PTS/{vel},fps=30,crop=ih*9/16*0.8:ih*0.8:(iw-ow)/2:(ih-oh)/2,scale=1080:1920:flags=lanczos"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t0), "-t", str(dur * vel + 0.2), "-i", str(fuente), "-an", "-vf", vf,
                    "-frames:v", str(int(round(dur * 30)) + 3), "-q:v", "3", "-start_number", "0", str(d / "%04d.jpg")], check=True)
    n = len(list(d.glob("*.jpg")))
    print(nombre, n, "cuadros")
    return n


if __name__ == "__main__":
    import json
    pedir = set(sys.argv[1:])
    largos_ruta = OUT / "vid.json"
    largos = json.loads(largos_ruta.read_text()) if largos_ruta.exists() else {}
    for k, v in VIDEOS.items():
        if (pedir and k not in pedir) or (not pedir and k in largos):
            continue
        if not Path(v[0]).exists():
            print("falta", k, v[0]); continue
        largos[k] = video(k, *v)
    for k, (fuente, ancho) in FOTOS.items():
        if (pedir and k not in pedir) or not Path(fuente).exists():
            continue
        subprocess.run(["sips", "-Z", str(ancho), str(fuente), "--setProperty", "format", "jpeg", "--out", str(OUT / f"{k}.jpg")], check=True, capture_output=True)
        print(k, "foto")
    largos_ruta.write_text(json.dumps(largos))
