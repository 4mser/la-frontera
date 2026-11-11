# Microcosmos vivo · capítulo final de «La frontera»

Plano continuo de 45 s (1350 cuadros a 30 fps, 1920×1080) dentro de una gota de agua, con estética de microscopía de campo oscuro. Organismos inspirados en las láminas de Haeckel (*Kunstformen der Natur*). El zoom nunca se detiene: atraviesa el enjambre, se acerca a un radiolario protagonista, cruza sus tres conchas anidadas por los poros y termina en el conjunto de Julia que forma la silueta de su núcleo.

Salida: `public/p10/vid/micro/0000.jpg … 1349.jpg`.

## Cómo renderizar

Desde esta carpeta:

```bash
PYTHONPATH=../../pylib python3 render.py all                 # los 1350 cuadros (~1,5 min con 14 núcleos)
PYTHONPATH=../../pylib python3 render.py frames 0 600 1349   # cuadros sueltos
PYTHONPATH=../../pylib python3 render.py range 900 1200 --step 10 --out /tmp/prueba
PYTHONPATH=../../pylib python3 render.py sheet --n 12 --out /tmp/hoja.jpg   # hoja de contacto
```

- `render.py` compila `render.c` en `librender.so` si hace falta (`cc -O3 -ffast-math -shared -fPIC`).
- La escena es determinista: semillas fijas y todo depende solo del tiempo `t = i / 30`. Cualquier cuadro se puede volver a renderizar suelto.
- La geometría se guarda en caché en `MICRO_CACHE` (por omisión `/tmp/microcosmos_scene.pkl`). Si cambias `organismos.py` o `build_scene()`, borra ese archivo.
- `--workers N` fija el número de procesos (por omisión, núcleos − 1).

## Archivos

| Archivo | Qué hace |
|---|---|
| `organismos.py` | Biblioteca procedural: Spumellaria con conchas anidadas (Actinomma), heliozoo, acantario (20 espinas según la ley de Müller), diatomea céntrica (Coscinodiscus) y pennada, feodario (Aulosphaera), Discoidea con brazos ramificados, foraminífero en espiral logarítmica, Cyrtoidea, ciliado y flagelado |
| `escena.py` | Tiempo, cámara, foco, colocación de organismos, iluminación, núcleo-Julia y posproceso |
| `render.c` | Rasterizador aditivo con capas de desenfoque: barras de vidrio con borde de Fresnel, puntos, discos de bokeh, membranas y el campo del Julia |
| `render.py` | Render en paralelo y hoja de contacto |

## Cómo se ve lo que se ve

- **Campo oscuro aditivo.** Todo suma luz sobre un fondo negro azulado. No hay oclusión, como en el vidrio iluminado de lado.
- **Fractal en el cuerpo.** Las conchas son poliedros de Goldberg: poros hexagonales y pentagonales, con tres conchas concéntricas. Las espinas se ramifican de forma recursiva en 3 o 4 niveles. Las diatomeas tienen filas de poros que se duplican hacia el borde, los Discoidea brazos dicotómicos y los foraminíferos cámaras en espiral logarítmica.
- **Vida.** Rotación y deriva lenta. Los axópodos ondulan con una onda viajera y llevan cuentas que se desplazan por ellos. Los cilios baten en ondas metacrónicas, los flagelos ondulan y las pennadas se deslizan. Las partículas en suspensión tienen movimiento browniano.
- **Óptica.** La profundidad de campo es real: el círculo de confusión vale `K·|1 − Zf/Z|` y cada primitiva cae en una de 8 capas de desenfoque (las grandes se calculan a resolución reducida). Los puntos muy desenfocados se dibujan como discos de bokeh. Hay rayos de luz volumétricos, bloom, aberración cromática radial, viñeta, curva fílmica y grano. La gradación es fija en todo el plano.

## Tiempos (beats)

| Tramo | Qué pasa |
|---|---|
| 0–3,5 s | Superficie de la gota: velo de luz desenfocado y anillo refractado que sale del cuadro. El foco viaja al primer organismo |
| 3,5–20 s | El enjambre. El foco pasa por heliozoo (≈5,5 s), diatomea céntrica (≈10,5 s), feodario (≈14,5 s) y acantario (≈18,6 s) |
| 20–32 s | Acercamiento al radiolario protagonista (corte óptico por el ecuador) |
| 32–39,5 s | A través de las conchas: cruce de la 1.ª concha (R=1) en ≈33,4 s, de la 2.ª (R=0,42) en ≈36,2 s y de la 3.ª (R=0,18) en ≈39,3 s. El foco sostiene el poro del eje y salta a la concha siguiente al cruzarlo |
| 38–39,8 s | La membrana del núcleo (una equipotencial casi circular) se enciende |
| 39,8–44,6 s | La equipotencial de Green baja década a década hasta el borde del conjunto de Julia. Todo lo demás se funde a negro (41–44,6 s) |
| 44,6–45 s | Julia luminoso, centrado, ≈60 % del ancho, sobre negro. Entrega al zoom de Mandelbrot (el fundido lo hace el montaje) |

## Parámetros que controlan el tiempo (`escena.py`)

- `RATE_KEYS`: velocidad de zoom `d ln(distancia)/dt` por tramos. Nunca es cero. `D_END` fija la distancia final; `dist(t)` y `time_at(d)` la convierten. `python3 escena.py` imprime cuándo se cruza cada concha.
- `FEATURED` y `FOCUS_TRACK` (con `RACK`): qué organismos protagonizan el enjambre, dónde aparecen y cuándo los toma el foco.
- `focus_target()`: la tabla `pts` define, en función de la distancia, el foco sobre las conchas: primero el ecuador y luego el poro de cada concha.
- `Ctx.K`: intensidad del desenfoque en el tiempo.
- `julia_layer()`: `m` (círculo → equipotencial, 38–39,8 s), `u` (barrido del nivel, 39,8–44,6 s), `gw` (grosor del borde).
- `frame()`: `fade` (fundido a negro del resto, 41–44,6 s, y apertura suave).
- `drop_surface()`: el velo y el anillo de la gota (0–3,2 s).

## El conjunto de Julia

- **c = −0,7436 + 0,1318i** (`JULIA_C`), en el valle de los caballitos de mar. Con este c el conjunto es casi polvo: los puntos escapan muy despacio. Se ve denso y lleno de espirales.
- 2500 iteraciones, radio de escape 10⁶ y supermuestreo 2×2.
- El borde se dibuja con el potencial de Green en espacio logarítmico. La distancia al nivel `G = lev` vale `(1 − lev/G)/|∇ log G|` y tiende a la estimación de distancia clásica cuando `lev → 0`.
- La membrana usa el radio complejo `JULIA_RC = 2,0`, que se proyecta sobre la membrana del núcleo (radio 0,02 en el mundo). El último cuadro tiene la rotación en 0 (el giro del radiolario se anula en t = 45 s).
- Encuadre del último cuadro: centro del Julia en el centro de la imagen, escala ≈ 2,0/687 unidades complejas por píxel, eje real horizontal.
