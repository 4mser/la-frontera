"""Titles and descriptions of the 10 YouTube episodes of La frontera → entregables/.../episodios/textos/EpNN.txt + textos.json"""
import json
from pathlib import Path

YT = Path.home() / "Development/BN_Videos/entregables/La-frontera/YouTube"
SAL = YT / "episodios/textos"
DOC = (YT / "descripcion.txt").read_text()
CREDITOS = DOC[DOC.index("Un documental de B&N Lectures"):DOC.index("#fractales")].strip()

EP = {
    1: ("No tiene fondo: la regla z² + c",
        "Una regla de una línea, z → z² + c, repetida sin fin, dibuja una frontera de complejidad infinita. Este primer episodio abre el viaje: qué es un fractal, qué significa que una forma tenga detalle a todas las escalas y por qué la curva de Koch, el triángulo de Sierpiński y el helecho comparten una misma idea.",
        ["0:00 Apertura", "2:59 I · La regla"]),
    2: ("Entre la nada y el algo",
        "El conjunto de Mandelbrot es el mapa de infinitos mundos: cada punto es una constante, y cada constante dibuja un conjunto de Julia que puede ser de una sola pieza o romperse en polvo. Su frontera tiene dimensión dos, y todavía nadie sabe demostrar si su área es positiva o nula.",
        None),
    3: ("¿Cuánto mide una frontera?",
        "Lewis Fry Richardson quería entender por qué los países van a la guerra y terminó descubriendo que una misma frontera mide distinto según la regla con que se mida. Repetimos su experimento con datos reales de España y Portugal, y de esas medidas sale la dimensión fractal de una línea.",
        None),
    4: ("Cómo crece una forma",
        "Un mineral que crece como un árbol, los ríos de una montaña y los vasos de un tejido se parecen mucho. Simulamos cómo crece cada uno: partículas que se pegan, agua que excava y células que piden oxígeno. Tres mecanismos distintos para una misma apariencia.",
        None),
    5: ("Un corazón no es un metrónomo",
        "¿Debería un corazón sano latir como un reloj? Con registros reales de PhysioNet medimos la estructura de los latidos a muchas escalas de tiempo, comparamos corazones sanos con corazones con insuficiencia y llegamos a una sola regla que va del orden al caos.",
        None),
    6: ("El caos tiene forma",
        "Cómo puede algo obedecer leyes exactas y aun así ser impredecible. Lorenz y su café, las duplicaciones de Feigenbaum, el mercurio que las confirma en un laboratorio y la sorpresa final: la ecuación de las poblaciones es la misma regla del conjunto de Mandelbrot.",
        None),
    7: ("Del patrón a la herramienta",
        "Qué pasa cuando dejamos de mirar los fractales y empezamos a usarlos: una antena de papel de aluminio pegada a un balcón, las montañas generadas por computadora del cine, y la forma de los vasos del ojo como herramienta de investigación en salud. Cada una funciona dentro de un rango de escalas.",
        None),
    8: ("¿Es fractal el universo?",
        "Un cerebro y la red cósmica se parecen tanto que cuesta distinguirlos. ¿Cuánto se parecen de verdad? Revisamos el estudio que los comparó y los censos de galaxias que pusieron a prueba la idea de un universo fractal sin fin.",
        None),
    9: ("¿Por qué funciona la matemática?",
        "Galileo escribió que el universo está escrito en lengua matemática, y Wigner llamó a su eficacia un regalo que no entendemos ni merecemos. Ponemos cada ley de esta serie sobre una sola escala para ver dónde funciona cada una y dónde deja de hacerlo.",
        None),
    10: ("El último viaje: 56 órdenes de magnitud",
         "El capítulo final: un último viaje sin cortes, desde lo más grande que podemos observar hasta donde ya no llega ninguna medición, cincuenta y seis órdenes de magnitud más abajo. Termina con una coda musical, un recorrido por las formas fractales de la matemática y de la naturaleza, y los créditos.",
         ["0:00 X · La frontera", "9:26 Coda", "11:37 Créditos"]),
}

ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]


def texto(n):
    t, resumen, caps = EP[n]
    lineas = [resumen, ""]
    if n < 10:
        sig = EP[n + 1][0]; lineas += [f"Al final, una previa del episodio {n + 1}: {sig}" + ("" if sig.endswith("?") else "."), ""]
    lineas += [f"La frontera es un documental de B&N Lectures sobre fractales, contado en 10 episodios. Este es el episodio {n} de 10"
               + (" (Apertura y capítulo I)." if n == 1 else f" (capítulo {ROMANOS[n - 1]}).")]
    lineas += ["Todas las figuras matemáticas están calculadas con simulaciones propias. Lo ilustrativo va rotulado en pantalla como recreación.", ""]
    lineas += ["Documental completo: https://youtu.be/gdXREAZeusY", ""]
    if caps:
        lineas += ["Capítulos"] + caps + [""]
    lineas += [CREDITOS, "", "#fractales #Mandelbrot #documental"]
    return f"{t} | La frontera · Ep. {n}", "\n".join(lineas)


if __name__ == "__main__":
    SAL.mkdir(parents=True, exist_ok=True)
    todo = {}
    for n in EP:
        titulo, desc = texto(n)
        assert len(titulo) <= 100 and len(desc) <= 5000, (n, len(titulo), len(desc))
        (SAL / f"Ep{n:02d}.txt").write_text(f"TÍTULO\n{titulo}\n\nDESCRIPCIÓN\n{desc}\n")
        todo[n] = dict(titulo=titulo, descripcion=desc)
        print(n, len(titulo), len(desc), titulo)
    (SAL / "textos.json").write_text(json.dumps(todo, ensure_ascii=False, indent=1))
