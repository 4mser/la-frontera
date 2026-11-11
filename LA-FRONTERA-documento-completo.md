# LA FRONTERA · Documento completo del proyecto

*Fractales: la geometría del infinito.* Documental gratuito de B&N Lectures. Estado al 4 de noviembre de 2026.

Este documento es para que otra persona o IA entienda todo el proyecto sin haberlo visto nacer: qué es, cómo está construido, qué dice cada minuto, qué reglas de estilo están aprobadas, qué se rechazó y en qué estamos ahora, que es crear el final. Todo lo que aquí aparece está tomado de los archivos del proyecto o medido sobre el video.

---

## 0 · Lo esencial en diez líneas

1. **Qué es:** un documental de 57:46 (1920×1080, 30 fps) sobre fractales, científico, matemático y filosófico. Busca dejar pensando.
2. **Idea central:** una regla mínima, **z → z² + c**, dibuja una frontera de complejidad infinita, el conjunto de Mandelbrot. Formas parecidas aparecen en la naturaleza, en el cuerpo y en el cosmos. La película separa qué parecidos tienen fundamento matemático y cuáles son solo analogías, y en qué rango de escalas vale cada descripción.
3. **Hilo conductor:** tres fronteras. Las que dibujan las formas, las que nos separan y las que limitan lo que creemos conocer.
4. **Estructura:** apertura (prólogo + intro + viaje de escalas + título) y 10 capítulos. El X, «La frontera», es el final.
5. **Cómo se hace:** motion graphics programados en Remotion (Canvas 2D y WebGL), con fractales calculados en vivo, simulaciones propias en Python/C y material real de archivo con licencia libre. Lleva un acabado «retro de película» común a todo (bloom, halo, grano, viñeta y aberración leve).
6. **Música:** partitura original hecha con código (Python), con la paleta de una «épica del desierto»: sub-bajos, braams, voz femenina sintética en frigio dominante en re, bombos graves, swells y el latido real de un corazón sano.
7. **Voz:** TTS masculina, grave y pausada (edge-tts «en-US-BrianMultilingualNeural» hablando en español, de −10 % a −16 % de velocidad y −2 Hz). Cada frase se genera por separado y se verifica que suene en español.
8. **Rigor:** cada afirmación tiene su fuente en el guion de su capítulo, y lo ilustrativo se rotula en pantalla («RECREACIÓN», «AMPLIACIÓN ILUSTRATIVA»).
9. **Entregable vigente:** `~/Development/BN_Videos/entregables/La-frontera/Corrido/La-frontera-corrido-v3.mp4`, que es la concatenación exacta de la apertura y los 10 capítulos.
10. **Tarea actual:** rehacer el final, desde la copia del Mandelbrot a ×10⁵⁶, para que sea «legendario». El pedido literal está en la sección 9.

---

## 1 · Mapa de la película (corrido v3)

| Tramo | Inicio | Fin | Dura | De qué va | Imágenes clave |
|---|---|---|---|---|---|
| Apertura | 0:00 | 2:59 | 2:59 | El latido como luz; formas que se repiten (río, rayo, árboles, manos, sistema nervioso, neurona); la costa; la regla; montaje al pulso; el Mandelbrot; viaje de lo macro a lo micro (red cósmica → galaxia → Tierra → huracán → ojo → retina → neuronas → red cósmica); título | romanesco, delta, red cósmica, Mandelbrot, Benoît Mandelbrot, ojo |
| I · La regla | 2:59 | 7:56 | 4:57 | z → z² + c; órbitas que escapan o se quedan; qué es un fractal; Koch, Sierpiński, helecho de Barnsley; dimensión (1,26 de Koch); Julia y Fatou; el borde que no termina | Koch, triángulo, helecho real y calculado, grilla de dimensiones, conejo de Douady |
| II · Entre la nada y el algo | 7:59 | 16:51 | 8:52 | Fractales no autosemejantes; zoom al valle de los caballitos; Julia conexos o polvo; teorema de Fatou–Julia (seguir el cero); el mapa de mundos; teorema de Tan Lei; el punto de Misiurewicz; Leibniz: ¿por qué hay algo y no nada?; Cantor; dimensión de Hausdorff 2 del borde y su área abierta | espiral profunda, mosaico de Julias, retratos de Fatou, Julia y Leibniz |
| III · La medida de lo irregular | 16:51 | 22:49 | 5:58 | Lewis Fry Richardson (la ambulancia de 1916, el pronóstico a mano); las fronteras España–Portugal y Bélgica–Países Bajos; experimento propio con reglas de 80, 20 y 5 km; el paralelo 49; la ley de Richardson; Mandelbrot y la dimensión (1,12 frente a 1,14) | acuarela del convoy, mapas satelitales, gráficos log-log |
| IV · Cómo crece una forma | 22:49 | 27:46 | 4:56 | Tres mecanismos de ramificación: DLA (Witten y Sander), erosión, vasos por colonización del espacio; conteo de cajas: tres dimensiones distintas; el parecido no implica un mismo origen | DLA, red de ríos, vasos en disco, dendritas, copos, retina |
| V · Un corazón no es un metrónomo | 27:46 | 34:43 | 6:57 | Variabilidad del latido (PhysioNet), estructura fractal en el tiempo, DFA (alfa 1 y 2), sanos contra insuficiencia, límites del método; el mapa logístico: del orden al caos | línea del latido, curvas DFA, nubes de puntos, espirales de latidos, diagrama de bifurcación |
| VI · La misma regla, en el tiempo | 34:43 | 39:13 | 4:30 | Richardson y su sueño; Lorenz y el redondeo (1963); sensibilidad; la logística es z² + c sobre una recta; Feigenbaum 4,669; mercurio (4,4); el caos tiene geometría | mariposa de Lorenz con 4.000 puntos, retratos de Lorenz y Feigenbaum |
| VII · Del patrón a la herramienta | 39:13 | 44:07 | 4:54 | Antena de Sierpiński (Puente, 1996; cinco bandas); montañas por desplazamiento del punto medio (Carpenter, Génesis de Star Trek, como recreación propia); dimensión de los vasos de la retina (revisión de 2025); todo funciona en un rango | antena, paisaje fractal, fondo de ojo, examen oftalmológico, Big Bang al revés |
| VIII · ¿Hasta dónde llega la estructura? | 44:07 | 49:35 | 5:27 | Cerebro frente a red cósmica (Vazza y Feletti, 2020); la red real (2dF, SDSS); la hipótesis del universo fractal y su refutación (Scrimgeour et al. 2012, homogeneidad desde unos 70 Mpc); cuatro afirmaciones que suelen confundirse | neuronas frente a red cósmica, esferas de conteo, curva que llega a 3, telescopios |
| IX · El lenguaje y sus rangos | 49:35 | 52:47 | 3:12 | Galileo (el libro en lengua matemática); Wigner (la eficacia irrazonable); descubrir, inventar o relacionar; dos caras: la forma del Mandelbrot no la eligió nadie, el largo de la costa depende de la regla; cada ley sobre su banda de escalas | página de Il Saggiatore, retrato de Wigner, mapa de bandas |
| X · La frontera (v1) | 52:47 | 57:46 | 4:59 | Promesa de las tres fronteras; regresos (corazón, costa, Richardson, cosmos); título; «un último viaje, sin cortes»: red cósmica → galaxia → Tierra → fiordos de Chile → gota → microcosmos (Haeckel) → membrana → Julia → Mandelbrot hasta ×10⁵⁶ → copia completa → ojo → retina → neuronas → red cósmica → curva de Koch que no termina → LA FRONTERA | ver sección 8 |

La narración exacta, frase por frase y con su tiempo, está en el **Apéndice A**. Lo que se ve en cada capítulo según el código está en el **Apéndice B**.

---

## 2 · El lenguaje visual aprobado

### Acabado
- Hay un post-proceso común (`teaser-v1b/src/gl.ts`, función `postProceso`) que se aplica a cada cuadro. Parámetros del capítulo X: bloom 0,36, halo 0,75, aberración 0,03, viñeta 0,62, grano 0,05, líneas de barrido 0,18, ruido 0,5, gradación 1,8, curvatura 0 y esquinas 0,03. En los golpes grandes se suma un «impacto».
- **Fondo** negro azulado #020306. **Crema** #FFF4DE para el texto principal, **ámbar** (255,190,120) para lo secundario, azul (150,190,255) y rojo (255,130,110) para datos.
- **Tipografía:** Space Grotesk (300 o 600) para títulos y palabras grandes, IBM Plex Mono 500 en mayúsculas muy espaciadas para los rótulos. Los títulos llevan un halo suave (un desenfoque de 12–18 px en modo «lighter»).
- **Tarjetas de capítulo:** «CAPÍTULO X» chico en ámbar sobre el título grande en crema y espaciado, más una línea de qué trata.
- **Rótulos de escala:** abajo a la izquierda, potencia en sans light («10²¹ m») y nombre en mono ámbar («UNA GALAXIA»). En el zoom matemático: «× 10⁵⁶ · AUMENTO».
- **Créditos de material:** una línea mono chica centrada abajo («RETRATO: NOAA · DOMINIO PÚBLICO»).
- **Retratos:** foto con licencia libre, en sepia suave, dentro de un marco fino, con el nombre y los años debajo. Toda persona que la voz nombra aparece con su foto.

### Cámara y montaje (reglas firmes)
- **Cámara frontal siempre.** Nada de cámara inclinada, perspectiva, 3D literal ni mareos. Solo se permiten empujes lentos, zooms y giros casi quietos.
- **Un plano a la vez.** Cuando hay una foto o un video, la escena de abajo no se dibuja. Las transiciones duran 0,3 s como máximo, salvo en los planos continuos tipo «viaje sin cortes», donde las etapas se funden mientras siguen moviéndose.
- **Los cortes caen en el inicio de la frase** que nombra lo que se ve, anclados a los tiempos de palabra de la voz. Cada plano dura 3 s o más. La animación de una escena empieza cuando su plano entra.
- **Nada de pantalla vacía ni de «pizarra que ilustra la voz».** La imagen cuenta algo por sí misma, siempre hay fractal vivo o material real, y la matemática ocurre dentro de la belleza.
- **Todo lo que la voz enumera aparece en pantalla** y se queda hasta que la voz termina.
- **Si la voz nombra algo concreto, se muestra eso mismo.** Si tiene derechos, se hace una recreación propia rotulada como tal.
- **Las anécdotas se cuentan con motion graphics bien hechos**, en vez de llenarlas de fotos.
- **Las formas geométricas llevan brillo y resplandor** (cobre o luz), nunca planas.
- **No repetir la forma general del Mandelbrot** sin razón. Las mini-copias también cuentan, así que hay que usar lugares distintos del borde.
- Los movimientos visuales grandes van al pulso o al golpe musical, con resortes críticamente amortiguados y nunca con rebote.

### Rechazado (no volver a proponer sin una muestra corta)
- El animatic con gráficos de datos «poco cinematográfico, aburrido».
- El relieve sombreado y el Julia 3D de cuaterniones («horrible»).
- La cámara inclinada en perspectiva con foco selectivo y partículas («marea»).
- Las simulaciones «de la vida» hechas a mano (rayo, retina, neuronas, ríos o bronquios dibujados por código), incluso en su versión realista. Para esas cosas se usa material real.
- Un acabado de cine propio (ACES, halation, destellos) distinto al del teaser.
- La paleta sonora «de cámara» (cello, piano, tics, agua).
- El zoom lento, la mutación a Julia en profundidad que queda vacía, las pantallas que se parten, el blanco brusco, el estallido con zoom y los cortes secos fuera del clímax.
- Un punto de luz que se vuelve fractal al inicio («le quita poder»).

---

## 3 · Cómo está construido (técnico)

### Carpetas
- Proyecto: `~/Development/BN_Videos/fractales/`. Los guiones van en `GUION-*.md`, las direcciones en `DIRECCION-motion.md` y `DIRECCION-fotografia.md`, y las fuentes en `FUENTES-capitulo-*.md`.
- Código: `fractales/animatic/`, con Remotion 4.0.534, React y TypeScript.
  - `src/Root.tsx` registra las composiciones `Cap1` … `Cap10` y la apertura.
  - `src/VideoCapN.tsx` es el componente: un `<canvas>` en el que cada cuadro se dibuja con `dibujarCapN(ctx, t, frame, fotos)`, más el audio de la partitura y una `<Audio>` por frase de voz colocada en su segundo.
  - `src/capN.ts` es todo el dibujo del capítulo, con funciones por escena y ventanas de tiempo (`ventana`, `pr`, `eSuave`, `eOut`, `eIO`).
  - `src/capN.json` guarda los tiempos del capítulo: inicio de cada frase de voz (`voz`), marcas de escenas, `total` y `clips` (secuencias de video pre-renderizadas).
  - `src/capN_voz.json` tiene el texto, la duración y el inicio de cada palabra de cada frase, para anclar cortes a palabras con `palabra(k, "costa")`.
  - `src/capN_datos.json` y similares guardan los datos calculados (corazón, fronteras, Lorenz, DLA…).
  - `herramientas/tiempos_capN.py` construye `capN.json` a partir de la voz.
  - `herramientas/*.py` y `herramientas/c/*.c` generan las simulaciones y los datos, y algunas secuencias de cuadros JPG.
  - `audio/voz_capN.py` genera la voz, `audio/sonido_capN.py` la partitura y `audio/verifica_idioma.py` revisa el idioma.
  - `public/` contiene las imágenes reales (`p3/`, `p5/`, `p10/real/`…), las secuencias pre-renderizadas (`public/p10/vid/<clip>/NNNN.jpg`), `audio/capN.wav` y `voz/cN/K.mp3`.
- Entregables: `~/Development/BN_Videos/entregables/La-frontera/` (una carpeta por capítulo y `Corrido/`).
- El corrido v3 es la concatenación exacta de `Apertura/La-frontera-apertura-v21.mp4`, `Capitulo-1/Cap1-v24.mp4`, `Capitulo-2/Cap2-v8.mp4`, `Cap3-previa-v4`, `Cap4-previa-v1`, `Cap5-previa-v6`, `Cap6-previa-v3`, `Cap7-previa-v8`, `Cap8-previa-v1`, `Cap9-previa-v2` y `Cap10-previa-v1`. La suma da 3465,75 s, igual que el corrido.

### Comandos
```bash
cd ~/Development/BN_Videos/fractales/animatic
PYTHONPATH=pylib python3 audio/voz_cap10.py          # voz (edge-tts) → public/voz/c10/*.mp3 + src/cap10_voz.json
python3 audio/verifica_idioma.py ...                 # cada frase debe dar «es» con p ≥ 0,85
PYTHONPATH=pylib python3 herramientas/tiempos_cap10.py   # tiempos → src/cap10.json
PYTHONPATH=pylib python3 audio/sonido_cap10.py       # partitura → public/audio/cap10.wav
PYTHONPATH=pylib python3 herramientas/viaje_cap10.py # secuencias pre-renderizadas
npx remotion render src/index.ts Cap10 out/Cap10.mp4 --gl=angle --concurrency=100% --timeout=240000
npx remotion render src/index.ts Cap10 out/previa.mp4 --frames=2550-4050 ...   # previas por tramos
```

### Fractales y simulaciones (todo calculado, nada dibujado a mano)
- **Mandelbrot y Julia** se calculan en vivo en el canvas o en WebGL, con las tres paletas del teaser.
- **Zoom profundo hasta ×10⁵⁶ (cap. X):** `herramientas/mandel_profundo/` usa perturbación con aproximación bilineal (BLA) en C (`bla.c`) sobre una órbita de referencia de un núcleo periódico. El destino de alta precisión está en `destino.json`, centrado en un mini-Mandelbrot cerca de −0,7436485500936… + 0,1318277209255… i. Se renderizan cuadros clave en `public/p10/mandel/kNNNN.png` (el ancho del cuadro k es 3,2·2⁻ᵏ, hasta k = 187) y `interpola.py` compone el zoom continuo sin costuras.
- **Koch, Sierpiński, helecho de Barnsley, conjunto de Cantor** y la grilla de dimensiones (cap. I y II).
- **Fronteras reales** (cap. III, `fronteras_cap3.py`, `costa_chile.py`) desde Natural Earth 10m, medidas con el método del compás.
- **DLA** (`dla_cap4.py` + `c/dla2`, fuera de red), **erosión** (`erosion_cap4.py` + `c/gotas.c`), **vasos** por colonización del espacio (`vasos_cap4.py`, Runions 2005/2007) y **conteo de cajas** (`cajas_cap4.py`).
- **Corazón:** intervalos RR reales de PhysioNet (nsr2db sanos, chf2db insuficiencia), con DFA propio (`latido_datos.py`, `latido_grupos.py`, `corazon_cap5.py`, `auditoria_corazon.py`). El latido que suena en el prólogo es el de un registro sano real.
- **Mapa logístico** y bifurcación; **Lorenz** con RK4 (σ 10, ρ 28, β 8/3) y 4.000 trayectorias (`lorenz_cap6.py`).
- **Antena de Sierpiński, paisaje por desplazamiento del punto medio, recreación de Génesis** (`genesis_cap7.py`) y **retina** convertida en número (`retina_cap7.py`).
- **Red cósmica de partículas propia** (`final_cap7.py`, `cosmos_cap8.py`), con imágenes de IllustrisTNG y el conteo en esferas (cap. VIII).
- **Microcosmos vivo** (`herramientas/microcosmos/`): un rasterizador aditivo en C con organismos procedurales inspirados en Haeckel (radiolarios con conchas anidadas, acantarios con la ley de Müller, diatomeas, foraminíferos…). Son 45 s de plano continuo que terminan en un Julia con la silueta del núcleo.
- **Viaje sin cortes del cap. X** (`viaje_cap10.py`): ver la sección 8.

### Material real
Viene de NASA (GOES-16, ISS, Blue Marble), ESA/Hubble (M51, M101), ESO, IllustrisTNG, Wikimedia Commons, NIH/NEI, Pexels y PhysioNet. Las procedencias y licencias están en `material-prologo/PROCEDENCIA.md` y en las tablas de fuentes de cada guion. Las licencias CC BY exigen atribución, que se pone en pantalla. Ojo: el corrido todavía no tiene créditos finales.

---

## 4 · Música y sonido

- **Paleta única** de todo el documental: `audio/dune.py`.
  - `sub(nota, dur)` es un dron sub-grave con vaivén lento y saturación suave.
  - `braam(notas, dur)` es un muro de metales graves saturados.
  - `voz(frase, vocal)` es una voz femenina sintética que canta frases largas en frigio dominante en re (notas MIDI 62, 63, 66, 69, 74…).
  - `bombo()` da los golpes graves y `oleaje(dur)` los swells.
  - Los pulsos afinados son senos con ataque y caída.
  - Hay dos reverbs: `SALA` (7 s, una sala inmensa y oscura) y `SALA_C` (3 s).
  - El latido real tiene doble golpe (`latido()`: bombo + bombo a 0,28 s).
- **Reglas:**
  - Cada movimiento visual tiene su sonido sincronizado: golpes graves afinados, acordes que suben o crecen, nunca soplos ni «whoosh».
  - La variedad viene de cómo se usan los instrumentos (ritmo, densidad, silencios, dónde cae cada braam), no de instrumentos nuevos.
  - La voz siempre se oye: la música se baja automáticamente bajo cada frase (ducking a 0,45).
- **Cap. X, partitura actual** (`audio/sonido_cap10.py`):
  - En la oscuridad hay latidos bajo la promesa. Cada regreso lleva un pulso, y el título un braam con bombo.
  - En el viaje suena un pulso lento que nunca para, con un braam en cada mundo nuevo y la voz femenina cuando la estrella se vuelve la Tierra.
  - En el microcosmos hay pulsos vidriosos al azar y un coro.
  - Al entrar al zoom matemático suena un golpe grande y después un **tono de Shepard que sube sin fin** durante toda la caída, con un bombo cada diez órdenes de magnitud. La copia llega con un acorde.
  - En el giro hay silencio relativo, latido y coro cuando vuelve la red.
  - En el final, latidos, la última frase, silencio y un braam sobre el nombre.
- **Mediciones del corrido v3:**
  - Integrado −17,9 LUFS, con un rango de sonoridad (LRA) de solo 5,1 LU.
  - Minuto a minuto se queda entre −19 y −23 LUFS durante toda la película, y casi no hay silencios reales.
  - Al documental le falta respirar, con silencios antes de las revelaciones y finales de capítulo en calma. El final debería tener el contraste dinámico más grande de toda la película.

---

## 5 · Voz

- Se genera con edge-tts y la voz «en-US-BrianMultilingualNeural» hablando en español, con rate −10 % y pitch −2 Hz. Es una voz provisional: el plan siempre fue que la película final llevara una voz humana.
- Cada frase es un mp3 aparte, ubicado a mano para dejar pausas de cine.
- Los nombres se escriben como se pronuncian: «Benuá Mandelbrót», «Ríchardson», «Yüliaá», «Pier Fatú», «Láibnitz», «Érnst Héckel».
- **Regla crítica:** la voz multilingüe se pasa al inglés o al portugués en frases cortas («Uno.», «Dos dimensiones.»). Por eso:
  - nada de frases de una o dos palabras;
  - nada de imperativos con enclítico que acentúe mal («Divídela» se cambia por «divide esa línea»);
  - cada frase se verifica con `audio/verifica_idioma.py`, que exige español con p ≥ 0,85 según whisper. Transcribir no basta, porque whisper en español «entiende» igual.

---

## 6 · Reglas de escritura

- Español neutro con «tú», nunca voseo.
- Nunca usar la construcción «no es X, es Y» (ni «no X, sino Y» como muletilla).
- Tono sobrio, sin tono de IA, sin exageración ni frases de eslogan.
- Cada afirmación lleva su fuente en la tabla del guion. Se dice el rango de escalas en que vale cada descripción, y los parecidos se separan de las identidades.
- Los capítulos abren con una pregunta y cierran con una conclusión clara que empuja al siguiente.
- El texto en pantalla es más corto que la voz y no la repite palabra por palabra.

---

## 7 · Lo que se diagnosticó del corrido completo (3 nov)

- **Voz:** son 58 minutos de TTS, y lo que más eleva la obra es una voz humana.
- **Mezcla plana:** LRA de 5 LU y casi sin silencios.
- **El tramo central se apaga.** Entre los minutos 20 y 40 el brillo medio baja a la mitad y la saturación cae de 0,14 a 0,02. Del 28:30 al 38:00 hay casi diez minutos de gráficos azules sobre negro. En total, el 40 % de los cuadros está casi en negro.
- **Hilo humano:** las personas aparecen como fichas sueltas. Mandelbrot, el forastero que miró lo que otros descartaban, podría ser el eje.
- **Legibilidad:** muchos rótulos mono son diminutos y de bajo contraste.
- **No hay créditos finales**, y el material CC BY exige atribución.
- **Duración:** probablemente sobran unos 10 minutos en los tramos de gráficos (caps. V y VIII).

---

## 8 · El capítulo X en detalle (estado actual)

**Archivos:** `src/cap10.ts`, `src/cap10.json`, `src/VideoCap10.tsx`, `audio/sonido_cap10.py`, `audio/voz_cap10.py`, `herramientas/viaje_cap10.py`, `herramientas/giro_cap10.py`, `herramientas/mandel_profundo/`, `herramientas/microcosmos/`. Guion v1: `fractales/GUION-capitulo-10-frontera.md`. Los respaldos de v1 están en `animatic/respaldos/cap10/`.

**Línea de tiempo** (segundos dentro del capítulo, que empieza en el 52:47 del corrido):

| t | Marca | Qué pasa |
|---|---|---|
| 0 – 18,7 | oscuro | latidos y un punto de luz; «las que dibujan las formas / las que nos separan / las que limitan lo que creemos conocer» |
| 18,7 – 66,9 | regresos | el corazón (cap. V), la costa (III), Richardson (III), la red que se vuelve pareja (VIII) |
| 66,9 – 87,8 | título | «CAPÍTULO X · LA FRONTERA»; «¿QUÉ SIGNIFICA CONOCER DESDE UNA FRONTERA?»; «UN ÚLTIMO VIAJE · SIN CORTES» |
| 87,8 – 132,8 | viaje | red cósmica → galaxia M51 → una estrella → la Tierra → sur de Chile → fiordos del canal Moraleda → el agua → una gota (secuencia `public/p10/vid/viaje`, 45 s) |
| 132,8 – 177,8 | micro | microcosmos vivo en la gota; Haeckel; diatomeas; la membrana de un radiolario se vuelve Julia (`vid/micro`, 45 s) |
| 177,8 – 237,8 | mandel | el Julia se abre en el Mandelbrot y empieza el zoom: «si esta imagen midiera 10 micrómetros… del tamaño de un átomo… de un núcleo… más pequeña que lo más pequeño medido (~10⁻¹⁹ m)… NINGUNA MEDICIÓN LLEGA AQUÍ · SOLO QUEDA LA REGLA» (`vid/mandel`, 66 s) |
| 237,8 | copia | «×10⁵⁶ · LA MISMA FORMA, COMPLETA» |
| 243,8 – 274,3 | giro (v1) | el centro oscuro de la copia se vuelve la pupila; zoom hacia afuera hasta el ojo entero y después hacia adentro: retina → neuronas → red cósmica; «ALGUIEN MIRA»; «LA FRONTERA NO ESTÁ SOLO EN LAS COSAS / TAMBIÉN EN CÓMO LAS MIRAMOS» (`vid/giro`, 30 s) |
| 273,8 – 298,8 | final (v1) | latidos; una curva de Koch que se amplía en loop sin último nivel; «Una frontera puede marcar el límite de una explicación. Y también el comienzo de otra pregunta.»; LA FRONTERA |

**Cambios hechos el 4 nov** (en previas, todavía no en el corrido):
1. **Viaje v2** (`viaje_cap10.py` reescrito, con previa en `animatic/out/cap10v2/previa-viaje.mp4`):
   - Una sola cámara que siempre apunta al centro, al estilo de *Powers of Ten*. Una única velocidad de zoom R(t) la comparten todas las etapas, así que dos imágenes que se funden se mueven como una.
   - La red cósmica sigue volando mientras se desvanece; antes desaparecía de golpe a los 9 s, en el 54:24.
   - La galaxia queda centrada en su núcleo y se entra al núcleo hasta un punto de luz, que se abre en la Tierra.
   - La Tierra se ve redonda (la fuente venía achatada) y con su borde propio.
   - Se baja sobre el sur de Chile y se atraviesan las nubes hasta los fiordos. Un destello de sol sobre el agua se convierte en la gota.
2. **Sonido de la copia:** la v1 bajaba toda la música a un 8 % justo antes de la copia, en el 56:45, y le quitaba la emoción al zoom. Ahora el tono de Shepard se resuelve dentro del acorde de la copia con una caída de 5 s. La previa está en `out/cap10v2/previa-copia.mp4`.

**Problemas que siguen abiertos en el final v1:**
- El ojo hace un zoom hacia afuera y luego uno hacia adentro (giro, de t = 0 a 8 y de 11 a 15), y no se siente fluido.
- La transición de la copia al ojo (56:55) es un fundido simple.
- El cierre dura solo 55 s y no recoge la película.

---

## 9 · Lo que pidió el autor para el final (sus palabras)

> «En 56:55 podría ser mucho más legendaria con buenos blend, algo realmente épico para que eso sea la transición al final final.»

> «En el final es molesto que el ojo haga zoom out y después zoom in, no se siente fluido ni con buen blend transition.»

> «Quiero que el final siga, que dé una conclusión bestial sobre lo que es la realidad en sí, que el final te deje pensando y maravillando por todo lo que vimos a lo largo del documental, algo realmente épico, fuera de serie, científico, filosófico, poético, algo digno del mismísimo Christopher Nolan.»

> Sobre la propuesta: «C, pero extendido, algo realmente profundo e inspirador. Es el final: debe recopilar mucho del documental y ser muy poético, largo y filosófico, y realmente bien hecho.»

---

## 10 · Propuesta vigente del final (v2, por aprobar)

Archivo: `fractales/GUION-capitulo-10-final-v2.md`. Reemplaza el giro y el cierre (de 55 s pasa a unos 5 min). Resumen:

- **A · La copia se vuelve un ojo, sin retroceder nunca (~35 s).**
  - La cámara sigue cayendo al centro oscuro de la copia. Los filamentos del borde se funden en las fibras de un iris, el centro se vuelve la pupila y el halo, el reflejo de la córnea.
  - Se sigue hacia adentro: retina, neuronas y red cósmica.
  - Voz: «Toda esta profundidad la recorrió alguien…» y «La frontera no está solo en las cosas. También está en cómo las miramos.»
- **B · La isla (~45 s).**
  - Un nodo de la red es el Mandelbrot entero, como una isla de luz en un mar oscuro. Sobre su orilla se dibuja la costa medida con reglas cada vez más cortas.
  - La isla del conocimiento de John Wheeler («a medida que la isla crece, también crece su costa»), en paráfrasis. La atribución viene de Horgan, «The New Challenges», *Scientific American* 267(6), dic. 1992, según Wikiquote; falta ver el original.
  - El remate: si esa orilla es fractal como las costas de la película, nunca se termina de recorrer.
- **C · Lo que vimos, lo que significa, lo que somos (~3 min 20 s).**
  - C1: diez frases, una por capítulo, con un plano real de cada capítulo.
  - C2: la lección («una parte de la descripción la encontramos, otra la ponemos nosotros»).
  - C3: el clímax («la realidad se deja conocer por sus bordes, y nunca termina de mostrarse entera»).
  - C4: lo que somos («en nosotros, la materia que formó galaxias y costas aprendió a medirse a sí misma»), y cierra con la frase final de v1.
- **Coda · El comienzo (~30 s).** Negro, el latido de luz del primer cuadro de la película, los primeros destellos del prólogo, negro, LA FRONTERA, un último latido y silencio. El final contiene el comienzo, como el conjunto.

El texto completo de cada frase está en ese archivo. El autor pidió que la parte C se extienda todavía más y sea más profunda, poética y filosófica.

**Límites que el final debe respetar** (los fijó la propia película):
- Los fractales reales valen solo en un rango de escalas.
- El universo se vuelve parejo desde unos 70 Mpc.
- El parecido entre cerebro y cosmos está medido en un tramo y no implica la misma ley.
- El área del borde del Mandelbrot sigue abierta.
- La pregunta de Leibniz no tiene respuesta. El capítulo II ya cerró con «entre la nada y el algo… cabe el infinito», así que no conviene repetirlo tal cual.

**Lo que el final puede usar:**
- Toda la paleta sonora (con el contraste dinámico más grande del documental).
- El zoom profundo (ya existen cuadros clave hasta k = 187).
- Planos de cualquier capítulo (se pueden re-renderizar sin rótulos desde sus composiciones).
- Material real con licencia y el latido real del prólogo.

---

## 11 · Decisiones pendientes

1. Aprobar el texto del final v2, incluida la parte C extendida.
2. Verificar en el original la cita de Wheeler, o reemplazarla.
3. Aprobar la coda en loop, que vuelve al primer latido.
4. Producir y revisar por partes con previas cortas. El autor quiere decidir plano por plano y nada de renders completos a ciegas. El orden sería A, B, C1…C4 y coda.
5. Después: créditos finales con fuentes y licencias, voz humana y una remezcla con dinámica.

---

## Apéndice C · Guion del final v2 (texto completo de la propuesta)


Reemplaza el tramo «el giro» y «el final» del Capítulo X (desde la copia a ×10⁵⁶). Se conservan el viaje sin cortes v2 y la copia. Duración estimada del tramo nuevo: unos 5 minutos (el actual dura 55 s).

Reglas que se mantienen: cámara frontal, un plano a la vez, cortes en el inicio de la frase que nombra lo que se ve, planos de 3 s o más, paleta sonora de `dune.py`, voz verificada frase por frase con `verifica_idioma.py`.

---

### A · La copia se vuelve un ojo (sin retroceder nunca) · ~35 s

- **IMAGEN:** la copia completa a ×10⁵⁶. La cámara sigue cayendo hacia su centro oscuro. Los filamentos del borde se funden en las fibras de un iris, el centro oscuro se vuelve la pupila y el halo del conjunto, el reflejo de la córnea. Seguimos hacia adentro por la pupila: la retina, las neuronas, y las neuronas se abren en la red cósmica. No hay zoom hacia afuera en ningún momento.
- **SONIDO:** el acorde de la copia sigue sonando; el latido del prólogo entra cuando aparece el iris.

> Toda esta profundidad la recorrió alguien. Cada escala de este viaje pasó por un ojo, y por una red de neuronas que se parece a la red del cosmos.

> La frontera no está solo en las cosas. También está en cómo las miramos.

### B · La isla · ~45 s

- **IMAGEN:** un nodo de la red es el conjunto de Mandelbrot entero, pequeño, como una isla de luz en un mar oscuro. Su orilla brilla. Empuje lento hacia ella. Sobre la orilla se dibuja la costa de Chile medida con reglas cada vez más cortas (Cap. III y X).

> El físico John Wheeler describió el conocimiento con una imagen: vivimos en una isla, rodeada por un mar de lo que no sabemos. Y a medida que la isla crece, también crece su costa. [F1 · por verificar]

> Pero esta película nos enseñó algo sobre las costas. Su largo depende de la escala con que se miran, y mientras más de cerca las recorremos, más se alargan.

> Si la orilla de lo que sabemos es así, nunca vamos a terminar de recorrerla. Cada respuesta acerca la mirada, y cada vez que nos acercamos, el borde muestra más detalle que antes.

#### C · Lo que vimos, lo que significa, lo que somos · ~3 min 20 s

#### C1 · Lo que vimos (la película entera, una imagen por frase)

Montaje de planos reales de cada capítulo, sin rótulos, uno por frase, cortados en el inicio de cada frase. Entre estación y estación, la orilla de la isla sigue viva en el fondo. La música avanza con un pulso lento que crece estación por estación.

| # | Voz | Imagen (capítulo) |
|---|---|---|
| 1 | Empezamos con una regla que cabe en una línea: toma un número, multiplícalo por sí mismo, súmale una constante y vuelve a empezar. | z → z² + c escrita en luz; el conejo de Douady naciendo (I) |
| 2 | De esa repetición salió una curva cuyo borde mide infinito y que, aun así, encierra un área finita. Una forma que vive entre las dimensiones. | el copo de Koch creciendo; «1,26» (I) |
| 3 | Salió también un mapa de infinitos mundos, donde cada punto decide si queda algo o casi nada, y donde la frontera entre los dos tiene la dimensión de un plano. | Julia conexos y polvo; el mapa de Mandelbrot (II) |
| 4 | Después salimos a medir el mundo. Un hombre que se negó a tomar un arma quiso entender la guerra, y descubrió que una frontera tiene un largo distinto para cada regla. | Richardson, la ambulancia de 1916, la frontera de España y Portugal (III) |
| 5 | Vimos crecer ramas de tres maneras: partículas que se pegan, agua que excava, tejidos que piden oxígeno. Y aprendimos que dos formas pueden parecerse sin compartir su origen. | DLA, erosión y vasos lado a lado (IV) |
| 6 | Escuchamos un corazón sano, que acelera y frena sin parar, y descubrimos que su salud parece vivir en algún lugar entre la rigidez y el desorden. | la línea del latido acercándose escala a escala (V) |
| 7 | Vimos que una regla exacta puede ser impredecible, y que aun así el caos dibuja siempre la misma forma: un orden que no se deja predecir, pero sí se deja ver. | la mariposa de Lorenz formándose con cuatro mil puntos (VI) |
| 8 | Usamos esas formas para que una antena escuche en cinco bandas, para inventar montañas que nunca existieron y para leer en un ojo algo sobre el corazón. | antena de Sierpiński, el paisaje de Carpenter, la retina (VII) |
| 9 | Y contamos galaxias, una por una, hasta ver que la red del cosmos se vuelve pareja a gran escala. Hasta el universo tiene un tramo donde cada descripción funciona. | la red cósmica real; la curva que llega a tres (VIII) |
| 10 | Galileo escribió que el universo está escrito en lengua matemática, y Wigner lo llamó un regalo que no entendemos. En cada capítulo encontramos lo mismo: cada ley funciona dentro de su tramo, y más allá de él se vuelve una pregunta. | el libro de Galileo, Wigner, las bandas de todas las leyes (IX) |

#### C2 · Lo que significa (vuelve el descenso continuo por la orilla)

- **IMAGEN:** de vuelta en la orilla de la isla, el descenso continuo a velocidad constante por un lugar del borde que no vimos antes; el contador de aumento sigue subiendo.
- **SONIDO:** el pulso se apaga; queda el sub y la voz femenina larga.

> Quizá esa sea la lección más honda de todo este viaje. Cada vez que creímos tener una forma completa, al acercarnos apareció otra escala, otro detalle, otro borde.

> Las costas, los ríos, los latidos y las galaxias no se dejan atrapar en una sola mirada. Lo que sabemos de ellos depende de la distancia desde la que miramos, y de la regla con que medimos.

> Una parte de la descripción la encontramos en el mundo. Otra parte la ponemos nosotros. Y lo que llamamos realidad aparece en el encuentro entre las dos.

#### C3 · Lo que es la realidad (el clímax de la película)

- **IMAGEN:** el descenso se acelera; la orilla se enciende de oro y magenta (el pulso de color aprobado del clímax de la apertura); estallido de luz que no corta: se abre en un borde nuevo.
- **SONIDO:** el golpe más grande de todo el documental: braam, coro y bombo, sin cortes ni silencios bruscos.

> Tal vez la realidad se parezca a esta figura: unas pocas reglas, perfectamente definidas, y un borde que ninguna mirada alcanza a recorrer entero.

> Quizá eso sea lo más hondo que podemos decir de ella: que se deja conocer por sus bordes, y que nunca termina de mostrarse entera.

> Y esa es, tal vez, su forma más generosa de existir: siempre deja algo más por ver.

#### C4 · Lo que somos (se recoge hasta quedar el latido)

- **IMAGEN:** material real, un plano por cosa nombrada: los vasos de una retina, un delta visto desde el espacio, neuronas, la red cósmica; al final, el latido como luz del prólogo.
- **SONIDO:** la música se retira; queda el latido real del prólogo (PhysioNet) y un tono largo.

> Y nosotros no la miramos desde afuera. Estamos hechos de sus mismas fronteras: vasos que se ramifican como ríos, neuronas que en un tramo de escalas se ordenan como galaxias, un latido que nunca se repite del todo.

> En nosotros, la materia que formó galaxias y costas aprendió a medirse a sí misma. Y cada pregunta que hacemos nos acerca un poco más a esa frontera que, mientras más la miramos, más detalle tiene.

> Una frontera puede marcar el límite de una explicación. Y también el comienzo de otra pregunta.

#### Coda · El comienzo · ~30 s

- **IMAGEN:** el descenso sigue; todo se oscurece hasta el negro. En el negro, un latido de luz: el primer cuadro de la película. Arrancan los primeros destellos del prólogo (copo, romanesco, red del Himalaya, vasos de la retina). Al cuarto latido, negro. Título: LA FRONTERA. En negro, un último latido. Silencio.
- La película termina donde empezó: como el conjunto, contiene su propio comienzo.

---

### Fuentes

| # | Afirmación | Estado |
|---|---|---|
| F1 | John Wheeler: «We live on an island surrounded by a sea of ignorance. As our island of knowledge grows, so does the shore of our ignorance», citado por John Horgan en «The New Challenges», *Scientific American* 267 (6), dic. 1992, p. 20 (referencia de Wikiquote; no pude abrir el artículo original). La voz lo parafrasea, no lo cita textual. | Atribución con fuente secundaria · pendiente ver el original |
| — | Todo lo demás retoma afirmaciones ya verificadas en los Caps. I–IX (sus tablas de fuentes) | Verificado en cada capítulo |

---

## Apéndice A · Narración exacta del corrido v3, con tiempos absolutos

Texto tal como suena. Los nombres van escritos como se pronuncian («Ríchardson», «Mandelbrót», «Yüliaá»). El tiempo es el inicio de cada frase en `La-frontera-corrido-v3.mp4` (58 min, 1920×1080, 30 fps).

### Apertura (prólogo, montaje al pulso, viaje de escalas y título) · 0:00 – 2:59

> Hay formas que aparecen una y otra vez.
- `0:21,7` En un río. — imagen: Delta de un río visto desde un dron (video): canales que se ramifican.
- `0:23,4` En un rayo. — imagen: Rayo nocturno (video); la descarga cae dentro del plano.
- `0:25,3` En árboles y plantas. — imagen: Timidez de las copas, vista desde abajo: las grietas de cielo entre las copas se ramifican como un río (selva de Malasia).
- `0:27,8` En tus manos. — imagen: Palma de una mano abierta sobre negro, con sus líneas.
- `0:29,7` En tu sistema nervioso. — imagen: Tres imágenes seguidas, unos 1,4 s cada una, sobre negro: el sistema nervioso completo en vitrina (plastinado), una disección del sistema nervioso sobre una mesa y el cerebro con sus nervios. *(Sin licencia identificada: pendiente.)*
- `0:33,5` En una neurona. — imagen: Dendritas de una neurona al microscopio.
> Y cuando las miramos de cerca, descubrimos algo extraño: ningún contorno es tan simple como parecía.
- `2:18,5` 10²⁵ m · LA RED CÓSMICA — imagen: Mapa de materia oscura de la simulación IllustrisTNG (300 Mpc)
- `2:20,5` 10²³ m · UN CÚMULO DE GALAXIAS — imagen: Galaxias sobre los filamentos (IllustrisTNG)
- `2:21,7` 10²¹ m · UNA GALAXIA — imagen: M101, la galaxia del Molinete (Hubble)
- `2:25,2` 10¹⁹ m · UNA ESTRELLA — imagen: La estrella a resolución completa
- `2:27,4` 10⁷ m · LA TIERRA — imagen: Disco completo del GOES-16, el 10 sep 2017, con el huracán Irma
- `2:31,5` 10⁶ m · UN HURACÁN — imagen: Irma a resolución completa
- `2:35,3` 10⁵ m · EL OJO DEL HURACÁN — imagen: Ojo del huracán Florence, fotografiado desde la Estación Espacial
- `2:36,8` 10⁻² m · UN OJO — imagen: Macro de un iris humano
- `2:38,8` 10⁻³ m · LA RETINA — imagen: Fondo de ojo, entrando por el disco óptico, de donde sale el nervio hacia el cerebro
- `2:41,7` 10⁻⁴ m · NEURONAS — imagen: Red de axones al microscopio (confocal)
- `2:44,2` 10²⁵ m · LA RED CÓSMICA — imagen: La misma red del comienzo: el viaje se cierra en un círculo

### Capítulo I · La regla · 2:59 – 7:56 (dura 4:57)

- `3:01` Volvamos a la regla.
- `3:05` Toma un número.
- `3:06` Multiplícalo por sí mismo.
- `3:09` Súmale una constante, ce.
- `3:12` Y con el resultado… vuelve a empezar.
- `3:16` Eso es todo. Una sola regla, repetida una y otra vez.
- `3:23` Empecemos en cero, con ce igual a uno.
- `3:27` Uno.
- `3:29` Dos.
- `3:30` Cinco.
- `3:31` Veintiséis.
- `3:32` Seiscientos setenta y siete.
- `3:35` Se escapa. Cada vuelta lo lanza más lejos, sin límite.
- `3:42` Con ce igual a menos uno, el número va y viene.
- `3:46` Por muchas veces que repitas la regla, se queda cerca de casa.
- `3:52` Escapar, o quedarse.
- `3:56` Si probamos todas las constantes de la recta, las que se quedan forman un solo tramo.
- `4:03` Desde menos dos… hasta un cuarto.
- `4:07` Justo en el borde, los números dudan.
- `4:11` Un poco más acá, se quedan para siempre.
- `4:15` Un poco más allá, tardan decenas de vueltas en decidirse… pero se escapan.
- `4:22` Ahí está la primera frontera. Pero en una recta, una frontera son apenas dos bordes.
- `4:30` Para ver la verdadera forma de la regla hay que salir de la recta.
- `4:36` Los números complejos son puntos de un plano. Tienen una parte que va hacia los lados y otra que va hacia arriba.
- `4:44` Elevar al cuadrado un número así es girarlo y estirarlo a la vez.
- `4:49` Su ángulo se duplica. Su distancia al centro se multiplica por sí misma.
- `4:56` Si está a menos de uno del centro, se acerca. Si está a más de uno, se aleja.
- `5:04` Y sumar ce es moverlo siempre en la misma dirección.
- `5:09` Ahora cada constante es un punto del plano.
- `5:12` Partimos siempre de cero, y para saber su destino basta con una pregunta: ¿sale alguna vez de este círculo?
- `5:21` Si sale, sabemos que se irá al infinito.
- `5:26` Probamos un punto. Y otro. Y otro.
- `5:30` Los que escapan los pintamos según lo rápido que huyen. Los que se quedan, de negro.
- `5:44` Nadie trazó este contorno a mano.
- `5:47` Aparece al preguntarle a cada punto del plano si se queda o se escapa.
- `5:53` Pero cada punto de este mapa guarda algo más.
- `5:58` Si dejamos fija la constante y cambiamos el número de partida, la regla dibuja otra figura.
- `6:05` Se llama conjunto de Yüliaá.
- `6:09` Cuando la constante está dentro del conjunto, su mundo es de una sola pieza.
- `6:15` Cuando está afuera, se deshace en polvo.
- `6:20` Cada punto del conjunto de Mandelbrot es una constante. Y esa constante decide cómo será su conjunto de Yüliaá.
- `6:29` Por eso el conjunto de Mandelbrot es un mapa: organiza todos esos mundos.
- `6:36` Y en ciertos puntos de su borde, al acercarse, el mapa y el mundo empiezan a parecerse.
- `6:45` En 1915, en la Primera Guerra Mundial, una bala le destruyó la nariz a un joven matemático francés, Gastón Yüliaá.
- `6:55` Siguió trabajando desde el hospital.
- `6:58` Tres años después publicó su estudio sobre estas reglas repetidas.
- `7:04` No tenía cómo verlas.
- `7:06` Las imaginó.
- `7:09` Sesenta años después, las computadoras empezaron a dibujarlas.
- `7:15` Las primeras imágenes eran toscas.
- `7:18` Con los años, la frontera fue apareciendo cada vez más nítida.
- `7:24` Una regla que cabe en una línea dibuja una frontera que no termina.
- `7:30` Su borde es tan quebrado que, a toda escala, sigue apareciendo detalle.
- `7:36` Tanto, que los matemáticos demostraron algo difícil de imaginar: según una medida precisa de la rugosidad, esa línea tiene la misma dimensión que un plano.
- `7:50` ¿Qué significa que una forma tenga detalle infinito?

### Capítulo II · Entre la nada y el algo · 7:59 – 16:51 (dura 8:52)

- `8:12` En el capítulo anterior, cada parte era una copia exacta del todo.
- `8:18` Pero no todos los fractales funcionan así.
- `8:22` El conjunto de Mandelbrót tiene patrones que regresan: pequeñas copias de sí mismo.
- `8:31` Pero al acercarnos aparecen también estructuras que no son réplicas de lo que ya vimos.
- `8:39` La complejidad no siempre consiste en repetir una forma. A veces consiste en descubrir qué permanece cuando la forma cambia.
- `8:59` Mil billones de aumentos más abajo aparece otra copia del conjunto. Pero el paisaje que la rodea no se parece a nada de lo anterior.
- `9:11` La naturaleza tampoco hace copias exactas. Lo que se mantiene al acercarse a una nube es su rugosidad: la forma cambia.
- `9:22` El conejo nació de una sola constante. Cada constante define una dinámica, y esa dinámica dibuja un conjunto de Yüliaá.
- `9:32` Basta con mover la constante un poco para que el mundo entero cambie de forma.
- `9:49` Algunos de esos conjuntos permanecen de una sola pieza. Otros se fragmentan hasta convertirse en polvo.
- `9:58` De un lado queda algo: un mundo entero, de una sola pieza. Del otro queda casi nada: un polvo de puntos sueltos.
- `10:09` ¿Cómo saber de qué lado cae cada constante, sin tener que dibujar su mundo completo?
- `10:17` Hace un siglo, Pier Fatú y Gastón Yüliaá encontraron la respuesta: basta con seguir un solo punto, el cero.
- `10:26` Si la órbita del cero se queda cerca, el mundo es de una sola pieza. Si se escapa, el mundo se rompe en polvo.
- `10:37` Ahora pintemos cada constante del plano según el destino de su cero.
- `10:48` Ya lo viste al comienzo de la película: es el conjunto de Mandelbrót.
- `10:55` Cada punto de esta figura es una constante, y cada constante es un mundo.
- `11:04` En el cuerpo principal, los mundos son círculos deformados, siempre de una sola pieza.
- `11:13` En este bulbo, todos los mundos tienen la forma de la basílica.
- `11:21` En este otro aparece el conejo, con tres orejas que se tocan en un punto. Mira la antena del bulbo: también tiene tres brazos.
- `11:33` Y en este, cinco brazos. El mapa nos dice cuántos brazos tendrá cada mundo.
- `11:41` Fuera del mapa, en cambio, cada mundo se rompe en polvo.
- `11:48` Y en la frontera ocurre algo más profundo. Acerquémonos al mapa y a su mundo en el mismo punto.
- `11:59` Es la misma forma. La matemática Tan Lei lo demostró en mil novecientos noventa: en esos puntos del borde, el mapa se parece al mundo que describe.
- `12:11` Por eso decimos que es el mapa de todos esos mundos.
- `12:17` Dentro, cada mundo es algo: una sola pieza. Fuera, cada mundo es casi nada: un polvo.
- `13:19` Y la frontera es la línea exacta donde el algo se rompe en nada.
- `14:39` Ahí, entre la nada y el algo, vive toda la complejidad que acabamos de ver.
- `14:46` Acerquémonos a un solo punto de esa frontera, y no nos detengamos.
- `14:52` Cada vuelta de la espiral se parece a la anterior, pero nunca es la misma. Podemos seguir acercándonos para siempre, y nunca llegaremos al fondo.
- `15:04` Es un límite: nos acercamos cada vez más a un punto que jamás alcanzamos.
- `15:11` Ese punto no tiene largo, ni área, ni forma. Es lo más parecido a la nada que puede existir. Y aun así, es algo: pertenece al conjunto.
- `15:25` En mil setecientos catorce, Láibnitz escribió la pregunta más difícil de todas: ¿por qué hay algo, y no más bien nada?
- `15:36` Nadie sabe responderla. Pero el mismo Láibnitz, en mil seiscientos noventa y siete, diseñó una medalla para su sistema binario: con solo el uno y el cero, quería mostrar cómo todo puede salir de la nada.
- `15:52` Volvamos entonces al cero, al vacío, y apliquemos la regla una sola vez.
- `15:59` Con un paso aparece un círculo. Con diez pasos aparece una forma. Con infinitos pasos aparece una frontera infinita.
- `16:13` Y cerca de cualquier punto de esa frontera, por pequeño que sea el trozo, el conjunto entero vuelve a aparecer.
- `16:25` Lo que parecía casi nada contiene otra vez el todo, y así sin fin.
- `16:32` Quizá esa sea la respuesta del fractal a la pregunta de Láibnitz: en la frontera entre la nada y el algo, el vacío nunca está del todo vacío.
- `12:28` Toma una línea de largo uno. Quítale el tercio del medio. Y vuelve a hacerlo con cada pedazo que queda, una y otra vez.
- `12:38` En cada paso, el largo total se reduce: dos tercios, cuatro novenos, ocho veintisieteavos. En el límite, el largo es cero.
- `12:50` Pero aun así, el conjunto no desaparece.
- `12:55` Quedan infinitos puntos. Tantos como en la línea completa.
- `13:00` Un conjunto de largo cero puede tener tantos puntos como una línea entera.
- `13:07` El polvo de los mundos rotos tiene esta misma estructura, aunque su forma sea otra. Casi nada, y a la vez, infinito.
- `13:25` Fuera del conjunto, toda órbita termina escapando.
- `13:30` Pero cerca de la frontera, ese escape tarda cada vez más: cien vueltas, después mil, después diez mil.
- `13:40` Y en la frontera misma, el punto ya pertenece al conjunto: nunca escapa.
- `13:47` La matemática sigue funcionando en ese borde. Lo que deja de bastar es nuestra intuición.
- `13:56` La frontera del conjunto de Mandelbrót tiene dimensión de Jáusdorf dos. La misma dimensión que el plano.
- `14:05` Pero dimensión y área son cosas distintas. Una frontera puede tener dimensión dos y, aun así, área cero.
- `14:15` El conjunto tiene área, porque contiene regiones interiores. Pero su frontera…
- `14:23` ¿Tiene área? Todavía no sabemos demostrar si es positiva o nula.
- `14:30` Una figura perfectamente definida. Una propiedad demostrada. Y una pregunta que sigue abierta.
- `—` Largo cero, e infinitos puntos.
- `—` Una frontera con la dimensión de un plano, cuya área todavía no sabemos determinar.
- `16:44` Entre la nada y el algo… cabe el infinito.

### Capítulo III · La medida de lo irregular · 16:51 – 22:50 (dura 5:59)

- `17:05` En mil novecientos dieciséis, un meteorólogo inglés cambió su oficina por una ambulancia en el frente francés.
- `17:13` Se llamaba Lúis Frai Ríchardson. Era cuáquero y objetor de conciencia: no aceptaba tomar un arma.
- `17:22` Durante la guerra trabajó en una idea extraordinaria: calcular el tiempo atmosférico resolviendo las ecuaciones que lo describen. Hizo los cálculos a mano, en el frente.
- `17:35` Su primer intento fue un fracaso práctico. Pero el principio que exploraba se convertiría en una de las bases de la predicción meteorológica moderna.
- `17:46` En mil novecientos veinte, la oficina meteorológica pasó a depender del Ministerio del Aire, y Ríchardson renunció: no quería trabajar para la guerra.
- `17:58` Entonces decidió estudiar la guerra misma, con números. Se preguntó, por ejemplo, si los países que comparten más frontera pelean más entre sí.
- `18:10` Para eso necesitaba un dato que parecía sencillo: cuánto mide cada frontera.
- `18:17` Y no lo era. Para la frontera entre España y Portugal encontró dos cifras: novecientos ochenta y siete kilómetros, y mil doscientos catorce.
- `18:28` Entre Bélgica y los Países Bajos pasaba lo mismo: trescientos ochenta, contra cuatrocientos cuarenta y nueve.
- `18:37` Incluso hoy, distintas fuentes dan cifras distintas para la misma línea.
- `18:43` Ríchardson sospechó que nadie se había equivocado: cada uno había medido con una regla distinta.
- `18:50` Para entender por qué, hicimos nuestro propio experimento: una sola fuente de datos, y distintas reglas.
- `19:01` Con pasos de ochenta kilómetros, la frontera mide setecientos veintidós. Con pasos de veinte, ochocientos ochenta y cuatro. Con pasos de cinco, mil catorce.
- `19:14` Las tres medidas son correctas. Lo que cambia es el tamaño del paso: cuanto más corto, más larga resulta la frontera.
- `19:25` Ahora midamos otra frontera: la que separa a Estados Unidos y Canadá a lo largo del paralelo cuarenta y nueve.
- `19:33` Con pasos de ochenta, de veinte o de cinco kilómetros, mide siempre lo mismo: dos mil veintidós. Esa línea se trazó sobre un paralelo, en un tratado. En todo el rango que medimos, achicar la regla no revela ningún detalle nuevo.
- `19:52` Si anotamos estas medidas en una escala especial, donde cada marca multiplica la anterior, los puntos caen en línea recta. Fue lo que encontró Ríchardson.
- `20:04` La recta horizontal es la de una línea que no cambia con la regla. La que baja es la de una línea que se sigue quebrando. Y de esa inclinación se obtiene un número.
- `20:17` Cada línea tiene su inclinación: casi horizontal para la costa de Sudáfrica, mucho más empinada para la costa oeste de Gran Bretaña.
- `20:29` Ríchardson murió en mil novecientos cincuenta y tres, y su trabajo se publicó después, casi sin que nadie lo notara.
- `20:37` Catorce años más tarde, Mandelbrót vio lo que escondía esa inclinación: de ella se obtiene la dimensión fractal de la línea.
- `20:47` Para la frontera entre España y Portugal, Ríchardson obtuvo uno coma catorce. Con nuestros datos y nuestro método, obtenemos uno coma doce: un valor muy parecido, medido de otra forma.
- `21:04` La del paralelo cuarenta y nueve se trazó en un tratado. La frontera entre España y Portugal, en cambio, sigue en buena parte el curso de cuatro ríos. Lo quebrado de esa línea no lo dibujó un tratado: lo dibujó el agua.
- `21:22` Pero llega un punto en que el mapa ya no tiene más detalle que ofrecernos, y la recta se aplana. Eso no dice que la frontera real se vuelva lisa: dice dónde termina nuestra información.
- `21:36` Y aunque pudiéramos acercarnos más, una frontera política no es una costa: está definida por acuerdos, coordenadas y accidentes geográficos. La regla sigue cambiando, pero también cambia aquello que estamos midiendo.
- `21:53` Por eso, cuando calculamos una dimensión a partir de datos reales, importa el rango de escalas en el que la relación se mantiene.
- `22:04` Ríchardson buscaba medir las fronteras que separan a los países. Descubrió que una misma línea podía tener distintas longitudes, según cómo se midiera.
- `22:16` Medir también es decidir: elegir una regla es elegir una escala.
- `22:23` Pero medir una forma no es lo mismo que entender cómo llegó a existir. ¿Por qué se ramifica un río? ¿Por qué algunos minerales crecen como pequeños árboles? ¿Por qué ciertas redes de vasos se parecen a las que vemos desde el espacio?
- `22:40` Parecerse no significa tener el mismo origen. Para descubrirlo, hay que mirar cómo crecen.

### Capítulo IV · Cómo crece una forma · 22:50 – 27:46 (dura 4:56)

- `23:03` Al final del capítulo anterior quedaron tres formas: un mineral que crece como un pequeño árbol, los vasos que alimentan el ojo y los ríos de una montaña vistos desde el espacio.
- `23:15` Se parecen tanto que es fácil pensar que las produce una misma ley. Para saberlo, hay que verlas crecer.
- `23:25` En mil novecientos ochenta y uno, dos físicos, Tómas Uíten y Léonard Sánder, propusieron un juego muy simple.
- `23:34` En el centro hay una partícula fija. Desde lejos llega otra, que vaga al azar, sin rumbo, hasta que toca a la primera y se queda pegada.
- `23:45` Luego llega otra, y después otra más. Cada una camina a ciegas y se detiene en cuanto roza el grupo.
- `23:59` Con miles de partículas aparece una forma que nadie dibujó: ramas que se abren y se vuelven a abrir.
- `24:09` La razón es sencilla. Una partícula que vaga desde lejos tropieza antes con las puntas que con los huecos. Las puntas crecen, y los huecos quedan protegidos detrás de ellas.
- `24:23` Modelos basados en la difusión se han usado para explicar las dendritas de manganeso que aparecen en las grietas de algunas rocas: el mineral disuelto avanza por el agua y precipita sobre lo que ya creció.
- `24:38` Un río crece de otra manera. Imaginemos un terreno con pequeñas irregularidades, y una lluvia que cae pareja sobre todo él.
- `24:48` El agua baja por la pendiente y se junta en las partes más bajas. Donde se junta más agua, la corriente es más fuerte y excava más.
- `25:03` Ese surco más hondo atrae todavía más agua. Así, poco a poco, el terreno se organiza en una red de cauces que drena cada rincón.
- `25:14` Aquí nadie llega desde afuera. La forma la decide el propio relieve, que se va gastando por donde corre el agua.
- `25:26` Al estudiar redes de drenaje reales, se encontró que su estructura se parece mucho a la de redes que gastan la menor energía posible para llevar el agua hasta el mar.
- `25:39` Los vasos de un tejido responden a otra necesidad. Cada célula necesita oxígeno, y ninguna puede estar demasiado lejos de un vaso.
- `25:49` Cuando una zona recibe poco oxígeno, sus células liberan señales químicas, y los vasos cercanos brotan y crecen hacia ellas.
- `26:02` En la simulación, cada punto es un lugar que todavía necesita ser alcanzado. El árbol crece hacia los puntos cercanos, y cada punto se apaga cuando una rama llega hasta él.
- `26:17` El resultado es un árbol que llena el espacio sin cruzarse consigo mismo, y que se detiene cuando ya no queda nada por alcanzar.
- `26:29` Tres formas ramificadas y tres mecanismos distintos: partículas que se pegan, agua que excava y tejidos que piden oxígeno.
- `26:39` Si medimos su dimensión contando cuántas cajas hacen falta para cubrirlas a distintas escalas, obtenemos tres números diferentes.
- `26:49` Y aunque dos de esos números coincidieran, eso no nos diría nada sobre la causa. Una dimensión describe cómo una forma ocupa el espacio; su origen hay que buscarlo en otra parte.
- `27:05` Las formas que vimos al comienzo de esta historia tienen, cada una, su propia manera de crecer: el hielo que se forma desde el aire húmedo, el agua que desgasta la montaña, las plantas que siguen su propio programa.
- `27:23` La misma apariencia puede tener causas muy distintas. Para entender una forma, además de medirla, hay que saber qué la hizo crecer.
- `27:34` Pero hay formas que no se ven en el espacio. Se despliegan en el tiempo, latido a latido.

### Capítulo V · Un corazón no es un metrónomo · 27:46 – 34:43 (dura 6:57)

- `27:59` ¿Debería un corazón sano latir como un reloj, siempre al mismo tiempo? Casi todos diríamos que sí.
- `28:08` Hasta ahora, los fractales de esta historia fueron formas en el espacio: costas, fronteras, ramas. Pero también puede haber estructura dentro de estructura en el tiempo.
- `28:22` Al comienzo de esta historia escuchamos un corazón. Era el registro real de una persona sana, guardado en una base de datos pública de investigación.
- `28:33` Si en vez de escucharlo anotamos cuánto dura cada intervalo entre un latido y el siguiente, aparece una línea que nunca está quieta.
- `28:42` Un metrónomo marcaría siempre el mismo tiempo. Un corazón sano acelera y frena sin parar, incluso cuando estamos en reposo.
- `28:53` Este es un día casi completo de esa persona: más de cien mil latidos.
- `29:02` Hay horas en que el ritmo baja y horas en que sube, como en cualquier día con momentos de actividad y de descanso.
- `29:11` Acerquémonos a esta línea como nos acercamos a la curva de Koch, la que nunca se acaba.
- `29:19` De un día a una hora, de una hora a unos minutos: en cada escala aparecen subidas dentro de subidas, igual de quebradas. Es una estructura fractal, pero en el tiempo.
- `29:33` Hasta que llegamos a unos pocos latidos, y ahí se acaba. La curva matemática sigue sin fin; el corazón, como toda forma real, guarda esa estructura solo dentro de un rango de escalas.
- `29:49` Para medir esa estructura, en mil novecientos noventa y cinco un equipo de Boston usó un método llamado análisis de fluctuaciones sin tendencia.
- `29:59` La idea es sencilla. Se corta la serie en ventanas del mismo tamaño, en cada una se quita la tendencia y se mide cuánto se aparta la línea de ella.
- `30:10` Luego se repite con ventanas cada vez más grandes. Si los puntos caen sobre una recta en escala logarítmica, su inclinación es un número que llamamos alfa.
- `30:25` Es la misma herramienta que usó Ríchardson con las fronteras: medir a muchas escalas y mirar la inclinación.
- `30:32` Para este corazón, en ventanas de cuatro a dieciséis latidos, alfa vale uno coma tres. En ventanas de dieciséis a sesenta y cuatro, uno coma cero cinco.
- `30:45` Un ritmo completamente al azar daría un medio. Uno que solo deriva lentamente daría uno y medio. Este corazón queda cerca de uno, entre ambos extremos.
- `30:59` Ahora otra persona, de otra base de datos: alguien con insuficiencia cardíaca congestiva.
- `31:06` Su línea también varía, pero de otra manera. En las ventanas cortas, su alfa baja a uno coma cero siete. En las largas, sube a uno coma veintiséis.
- `31:21` Dos personas no prueban nada. Por eso hicimos lo mismo con todos los registros de esas dos bases de datos: cincuenta y cuatro personas sanas y veintinueve con insuficiencia.
- `31:38` Como grupo, los corazones sanos tienen un alfa corto más alto y un alfa largo más bajo. La diferencia es clara, y se mantiene al comparar personas de edades parecidas.
- `31:51` Pero las nubes se tocan. Varias personas con insuficiencia quedan dentro del rango de las sanas. Esta medida describe diferencias entre grupos, y no sirve para diagnosticar a nadie.
- `32:05` Tampoco controlamos todo. No sabemos qué medicamentos tomaba cada persona, y cada base de datos eligió a sus pacientes con sus propios criterios.
- `32:17` Otros estudios, con otras herramientas, encontraron algo parecido: en la insuficiencia, el ritmo pierde parte de su variedad a distintas escalas.
- `32:42` Un corazón sano no es un metrónomo. Su ritmo parece vivir en algún lugar entre la rigidez y el desorden.
- `32:50` Y eso importa. Ya en los años ochenta, un estudio con cientos de personas que habían sufrido un infarto encontró que quienes tenían un ritmo menos variable corrían, como grupo, un riesgo mayor.
- `33:05` Un corazón que late demasiado parejo puede ser una señal de alarma. Su variedad a muchas escalas parece ser parte de su capacidad de adaptarse, y entender por qué sigue siendo una pregunta abierta.
- `33:19` Estructura dentro de estructura, a muchas escalas: la idea que encontramos en las costas y en los ríos aparece también en el ritmo de un corazón.
- `33:30` Un corazón obedece a muchas leyes a la vez. Veamos qué ocurre con algo mucho más simple: una sola regla, repetida una y otra vez.
- `33:41` Esta regla se usó para describir cómo cambia una población de un año al siguiente. El número r mide cuán rápido se reproduce.
- `33:51` Con r pequeño, la población se asienta en un solo valor: un ritmo perfectamente parejo, como el del metrónomo.
- `34:00` Al subir r, ese valor se divide en dos, luego en cuatro, luego en ocho: ciclos que se repiten, cada vez más largos.
- `34:10` Y de pronto aparece el caos: valores que nunca se repiten, aunque en la regla no hay nada de azar.
- `34:18` Si nos acercamos, dentro del caos aparecen copias más pequeñas del mismo diagrama. Otra vez, estructura dentro de estructura.
- `34:29` Entre el orden del metrónomo y el desorden total, una sola ecuación lo contiene todo. En el próximo capítulo veremos cómo.

### Capítulo VI · La misma regla, en el tiempo · 34:43 – 39:13 (dura 4:30)

- `34:54` ¿Cómo puede algo obedecer leyes exactas y aun así ser impredecible?
- `35:01` Ríchardson soñaba con calcular el tiempo atmosférico resolviendo sus ecuaciones. Si se conocen las leyes y el estado de hoy, pensaba, el de mañana debería poder calcularse.
- `35:14` Cuarenta años después, otro meteorólogo descubrió por qué ese sueño tiene un límite.
- `35:22` Édward Lórenz simulaba un modelo del tiempo atmosférico en su primera computadora. Un día quiso repetir un cálculo, y lo reinició desde la mitad, copiando una línea de números de una impresión.
- `35:36` Fue por un café y volvió una hora después. Lo que no sabía era que la impresión mostraba solo tres decimales: los números que copió estaban redondeados.
- `35:48` Al principio, los nuevos valores repetían los anteriores. Pero la diferencia se duplicaba cada pocos días simulados, y en el segundo mes los dos pronósticos ya no se parecían en nada.
- `36:03` En mil novecientos sesenta y tres publicó un sistema de solo tres ecuaciones con ese mismo comportamiento: soluciones que nunca se repiten, y estados casi iguales que terminan siendo muy distintos.
- `36:19` Lo mismo ocurre con la regla del capítulo anterior. Dos poblaciones que empiezan con una diferencia de una millonésima siguen iguales cuando la regla está en orden.
- `36:32` En la zona del caos, en cambio, se separan antes de treinta años. No hay azar en ninguna parte. La regla es exacta, pero cualquier error en el punto de partida, por pequeño que sea, termina creciendo.
- `36:50` Pero esta regla esconde algo más. Si se cambian las variables de la manera correcta, la ecuación de las poblaciones se convierte exactamente en z al cuadrado más c.
- `37:07` El diagrama de las poblaciones es la misma regla del conjunto de Mandelbrot, recorrida sobre una sola línea. Cada duplicación ocurre justo donde la línea cruza a un nuevo bulbo del conjunto.
- `37:22` Y la copia en miniatura que encontramos dentro del caos está exactamente debajo de una copia del Mandelbrot. Una regla en el tiempo y una forma en el plano son la misma cosa vista de dos maneras.
- `37:39` En mil novecientos setenta y ocho, Míchel Fáigenbaum midió cuánto se acercan las duplicaciones entre sí. Cada tramo es unas cuatro coma seis siete veces más corto que el anterior.
- `37:52` Y descubrió que ese mismo número aparece en muchas otras reglas distintas, siempre que tengan una sola joroba, como esta.
- `38:03` Años después, un equipo de físicos calentó mercurio en una pequeña caja y vio aparecer las mismas duplicaciones. Midieron cuatro coma cuatro, muy cerca del número de la matemática.
- `38:20` Saber la regla no es saber el resultado. Cuatro mil puntos que empiezan casi juntos terminan, en pocos segundos, en lugares que nadie podría anticipar.
- `38:35` Pero mira lo que hacen juntos. Ninguno se repite, y aun así todos dibujan la misma forma. El caos tiene geometría: un orden que no se deja predecir, pero sí se deja ver.
- `38:50` Lórenz, las poblaciones y el conjunto de Mandelbrot cuentan lo mismo: una regla exacta puede producir sorpresas, y esas sorpresas tienen forma.
- `39:03` Y aun sin poder predecirlo todo, ¿podemos usar esta geometría para algo?

### Capítulo VII · Del patrón a la herramienta · 39:13 – 44:07 (dura 4:54)

- `39:22` Hasta aquí hemos mirado fractales: en la matemática, en la naturaleza, en el ritmo de un corazón. ¿Qué pasa cuando dejamos de mirarlos y empezamos a usarlos?
- `39:40` Una antena funciona mejor con las ondas que tienen un tamaño parecido al suyo. Un teléfono necesita hablar en muchas bandas a la vez, pero dentro de él casi no hay espacio.
- `39:53` A fines de los años ochenta, un radioaficionado de Boston no podía instalar antenas en su edificio. Así que fabricó una pequeña, de papel de aluminio, con forma fractal, y la pegó a su balcón. Funcionó, hasta que el dueño del edificio la cortó.
- `40:14` En mil novecientos noventa y seis, Cárles Puénte y su equipo, en Barcelona, construyeron una antena con la forma del triángulo de Sierpínski. El mismo triángulo aparece a cinco escalas, cada una la mitad de la anterior.
- `40:31` Y la antena funcionó en cinco bandas, separadas por el mismo factor dos. Cada escala del triángulo sintoniza una frecuencia. La autosemejanza de la forma se convierte en autosemejanza del comportamiento.
- `40:46` Durante años, antenas con formas de este tipo fueron las más comunes en los teléfonos inteligentes.
- `40:54` Pero la quinta banda no cayó exactamente donde debía. Los autores lo atribuyen a que el triángulo real se corta: tiene cinco escalas, no infinitas. Funciona en su rango.
- `41:09` Dibujar una montaña punto por punto es imposible. En mil novecientos ochenta, Lóren Cárpenter mostró en un congreso una película con montañas generadas por computadora, hechas con una regla muy simple.
- `41:24` Se toma el punto medio de una línea y se mueve un poco al azar. Luego se repite en cada mitad, con movimientos cada vez más pequeños. Con unas pocas reglas, aparece una cordillera.
- `41:43` Dos años después, esa misma técnica dibujó el planeta de la secuencia Génesis en una película de Estar Trek, una de las primeras imágenes generadas por computadora en el cine.
- `41:56` La misma regla puede inventar una frontera con la rugosidad que medimos en la de España y Portugal. No es la frontera real, pero tiene su forma de ser irregular.
- `42:08` El detalle, en cambio, se acaba en el píxel. Y no todo lo que se genera así en los videojuegos y el cine es fractal: muchas técnicas solo lo imitan en unas pocas escalas.
- `42:23` En el capítulo del corazón medimos una señal en el tiempo. Aquí la pregunta es otra: ¿puede la forma de los vasos de un ojo decir algo sobre la salud?
- `42:34` Una fotografía del fondo del ojo se convierte en un mapa de sus vasos, y el mapa, en un número: su dimensión, contada con cajas como las del capítulo de las ramas.
- `42:48` Una revisión de catorce estudios, publicada en dos mil veinticinco, encontró que una dimensión más baja se asocia con más riesgo cardiovascular, sobre todo en las arterias pequeñas.
- `43:01` Pero cada estudio mide de una manera distinta, el número cambia con el método, y una asociación en grupos no es un diagnóstico. Por ahora es una herramienta de investigación.
- `43:16` Ninguna de estas herramientas usa un fractal infinito. La antena funciona en sus bandas, el paisaje hasta su píxel, la retina hasta la resolución de la foto.
- `43:28` Usar un fractal es saber en qué rango de escalas describe al mundo. Fuera de ese rango, deja de servir.
- `43:39` ¿Y el rango más grande de todos? ¿Hasta dónde llega la estructura del universo?

### Capítulo VIII · ¿Hasta dónde llega la estructura? · 44:07 – 49:35 (dura 5:27)

- `44:17` Al comienzo de este viaje, una red de neuronas se abrió y se convirtió en la red del cosmos. Se parecían tanto que costaba distinguirlas.
- `44:28` Pero parecerse no es lo mismo que ser igual. ¿Cuánto se parecen de verdad? ¿Y la estructura del cosmos sigue la misma ley a todas las escalas?
- `44:39` En dos mil veinte, un astrofísico y un neurocirujano italianos decidieron medirlo. Tomaron cortes muy finos de un cerebro humano y los compararon con una simulación del universo.
- `44:52` El cerebro tiene unos ochenta y seis mil millones de neuronas. En el universo observable hay unos dos billones y medio de galaxias. Y entre un tejido y otro hay un salto de veintisiete órdenes de magnitud.
- `45:08` Primero compararon cómo se reparte la materia en cada escala. Entre una centésima de milímetro y un milímetro y medio, el cerebelo se parece a la red cósmica entre uno y cien megapársecs, y un megapársec son más de tres millones de años luz.
- `45:25` Fuera de ese tramo, las curvas se separan. Y los autores advierten algo más: ninguna de las dos sigue una ley simple, como la de un fractal. Siguen leyes que se quiebran.
- `45:39` Luego trataron cada imagen como una red, donde cada neurona o cada galaxia es un nodo unido a sus vecinos cercanos. Algunas medidas coinciden, como cuántos vecinos de un nodo están unidos entre sí. Otras no coinciden.
- `45:56` Los propios autores lo llaman un primer trabajo exploratorio. Las conexiones se definieron por cercanía, con una distancia elegida a mano, y un corte de tejido es una parte mínima del cerebro. El parecido está medido, pero no demuestra un mecanismo común.
- `46:16` Para ver la red cósmica real, y no una simulación, hay que saber dónde está cada galaxia. Los telescopios miden su luz y, por cuánto se corre hacia el rojo, calculan a qué distancia está cada una.
- `46:32` Los mapas muestran lo mismo que la simulación: galaxias agrupadas en cúmulos, unidas por filamentos, y vacíos de decenas de megapársecs que ocupan cerca del cuarenta por ciento del volumen.
- `46:45` En los años ochenta, algunos físicos propusieron una idea audaz: que las galaxias forman un fractal sin fin. Que, por grande que sea la escala, siempre habría más agrupamiento y vacíos más grandes.
- `47:01` Si fuera así, el universo no tendría una densidad promedio. ¿Cómo se decide algo como esto? La respuesta está en contar galaxias, una por una, a escalas cada vez más grandes.
- `47:16` Se elige una galaxia y se cuentan sus vecinas dentro de una esfera. Luego se agranda la esfera y se cuenta otra vez. Si la materia llenara el espacio de forma pareja, al duplicar el radio habría ocho veces más galaxias.
- `47:33` En un fractal, el número crecería más lento. Ese ritmo de crecimiento es una dimensión, la misma idea de la costa y de las ramas. Tres significa que la materia es pareja. Menos de tres, que es fractal.
- `47:51` En dos mil doce, un censo hecho con el telescopio anglo-australiano repitió esa cuenta con casi ciento ochenta mil galaxias, hasta miles de millones de años luz de distancia.
- `48:03` A escalas pequeñas, la dimensión es menor que tres: las galaxias están agrupadas. Pero, a medida que crece la esfera, la dimensión sube y se acerca a tres. Desde unos setenta megapársecs, ya no se distingue de tres.
- `48:21` Entre unos ochenta y trescientos megapársecs, el censo descartó un fractal con dimensión menor que dos coma noventa y siete, con una confianza del noventa y nueve coma noventa y nueve por ciento.
- `48:35` Por eso conviene separar cuatro afirmaciones que suelen confundirse. Las galaxias están agrupadas, y eso es cierto. Hay relaciones de escala en un tramo, y también es cierto. En cambio, la idea de un universo fractal a toda escala queda descartada por las mediciones. Y a gran escala, los datos son compatibles con un universo homogéneo.
- `49:02` La materia se agrupa, forma filamentos y deja enormes vacíos. Pero, al ampliar la escala, esas diferencias se atenúan.
- `49:13` La pregunta no es solo si el universo tiene estructura, sino hasta qué escala podemos describirla con la misma ley.
- `49:22` Y si la matemática describe tan bien el mundo, pero solo en ciertos tramos, ¿qué es, exactamente, lo que estamos describiendo?

### Capítulo IX · El lenguaje y sus rangos · 49:35 – 52:47 (dura 3:12)

- `49:45` En mil seiscientos veintitrés, Galiléo escribió que el universo es un gran libro abierto ante nuestros ojos, y que está escrito en lengua matemática.
- `49:55` Sus letras, decía, son triángulos, círculos y otras figuras geométricas. Sin ellas, uno da vueltas en vano por un oscuro laberinto.
- `50:08` En esta película, unas pocas reglas escritas con símbolos describieron fronteras, ríos, corazones, antenas y galaxias. ¿Por qué funciona describir el mundo con matemática? ¿Y dónde deja de funcionar?
- `50:25` En mil novecientos sesenta, el físico Eugene Wígner escribió un ensayo sobre esta sorpresa. Dijo que la enorme utilidad de la matemática en las ciencias naturales roza lo misterioso, y que no tiene una explicación racional.
- `50:42` Y la llamó un regalo maravilloso, que no entendemos ni merecemos.
- `50:47` Pero en el mismo ensayo advirtió algo más. Las leyes de la naturaleza son de una precisión casi fantástica, y a la vez de un alcance estrictamente limitado.
- `51:00` Hay varias maneras de responder por qué funciona. Para algunos, la matemática descubre estructuras que existen sin nosotros. Para otros, es un lenguaje que inventamos. Y para otros, estudia relaciones, sin importar de qué están hechas las cosas.
- `51:20` El debate sigue abierto, y no vamos a cerrarlo aquí. Pero lo que vimos en esta película muestra dos caras de la misma moneda.
- `51:29` Nadie eligió la forma del conjunto de Mandelbrot. Aparece sola, cuando se sigue la regla hasta el final.
- `51:38` En cambio, el largo de una frontera dependía de la regla con que la medíamos. Una parte de la descripción la encontramos, y otra parte la ponemos nosotros.
- `51:51` Si ponemos cada ley de esta película sobre una sola escala, ninguna la cubre entera. La antena funciona entre menos de un centímetro y once. La frontera, entre cinco y ochenta kilómetros. Las galaxias se agrupan hasta unos cien megapársecs.
- `52:10` Y el corazón, en el tiempo, guarda su estructura entre unos minutos y unas horas. Solo en la matemática el detalle sigue sin fin.
- `52:21` Ninguna de las bandas marca un límite de la naturaleza. Cada una marca hasta dónde la evidencia respalda cada descripción. Más allá de sus bordes, cada ley se vuelve una pregunta.
- `52:36` Toda descripción tiene una frontera. ¿Qué significa, entonces, conocer desde ella?

### Capítulo X · La frontera (v1, la que está en el corrido) · 52:47 – 57:46 (dura 4:59)

- `52:53` Al comienzo, prometimos un viaje por tres fronteras. Las que dibujan las formas. Las que nos separan. Y las que limitan lo que creemos conocer.
- `53:06` Un corazón sano no late como un reloj. Su ritmo vive en una frontera, entre el orden y el desorden, y esa variedad, a muchas escalas, parece ser parte de su salud.
- `53:20` Una costa no tiene un largo verdadero. Tiene un largo para cada regla. Medir también es decidir desde qué escala miramos.
- `53:30` Ríchardson midió fronteras porque quería entender por qué los países van a la guerra. Descubrió que ni siquiera el largo de una frontera era una pregunta sencilla.
- `53:42` Y la red del cosmos, que parecía un fractal sin fin, se vuelve pareja a gran escala. No lo supimos por intuición, sino midiendo.
- `53:59` Entonces, ¿qué significa conocer desde una frontera? Para responder, hagamos un último viaje. Sin cortes. Desde lo más grande que podemos observar, hasta donde ya no llega ninguna medición.
- `54:16` Entre lo más grande que podemos observar y lo más pequeño que hemos medido hay unos cuarenta y seis órdenes de magnitud.
- `54:41` Medida en línea recta, la costa de Chile tiene unos cuatro mil trescientos kilómetros. Siguiendo cada bahía, cada fiordo y cada isla, más de ochenta mil.
- `55:05` En una gota de agua de mar viven organismos de una sola célula, con esqueletos de sílice, como de vidrio. Érnst Héckel describió más de cuatro mil especies, y las dibujó hace más de un siglo. Sus formas se repiten dentro de sí mismas.
- `55:24` Algunas de ellas, las diatomeas, hacen cerca de una quinta parte de la fotosíntesis de la Tierra.
- `55:37` Y ahí, donde la vida dibuja sus bordes, la matemática dibuja los suyos.
- `56:00` Desde aquí, ya no hay nada que medir. Ningún experimento ha llegado a distancias tan pequeñas. Solo queda la regla, y la regla sigue.
- `56:45` Cincuenta y seis órdenes de magnitud más abajo, la misma forma. Completa.
- `56:59` Pero toda esta profundidad la recorrió alguien. Cada escala de este viaje pasó por un ojo, y por una red de neuronas que se parece a la red del cosmos.
- `57:15` La frontera no está solo en las cosas. También está en cómo las miramos.
- `57:26` Una frontera puede marcar el límite de una explicación. Y también el comienzo de otra pregunta.


---

## Apéndice B · Qué se ve en cada capítulo, según el código (comentario de cabecera de cada `src/capN.ts`)

Texto original del código, en inglés, sin editar. Describe las escenas, simulaciones y transiciones tal como están programadas.

### `src/cap1.ts`

> CAPÍTULO 1 · «La regla» (fractales/GUION-capitulo-1-la-regla.md). Animatic: the whole voice on its timeline; scenes 1 and 2 drawn as in the script (the rule written by the point of light; the two orbits on a number line); scenes 3–8 as placeholder cards with the line being spoken, until they are built. Same finish as the opening.

### `src/cap2.ts`

> CAPÍTULO II · «Entre la nada y el algo» (fractales/GUION-capitulo-2-el-mapa.md, v5). First part: the title (a segment that loses its middle thirds), a copy and its opposite (Koch beside Mandelbrot), a dive of ×10⁸ into the seahorse valley down to another copy of the set, a cloud, the Julia sets as c moves, one piece or dust, the theorem of Fatou and Julia (follow 0), the map painted, a mosaic of worlds on it, the map explored bulb by bulb, Tan Lei's theorem (at the border, map and world look alike), and the title's meaning: inside something, outside almost nothing, the border between them. Every figure is computed; the camera only zooms and slides.

### `src/cap3.ts`

> CAPÍTULO III · «La medida de lo irregular» (fractales/GUION-capitulo-3-la-medida.md, v3). Richardson (archive: the 1919 watercolour of his ambulance convoy, the frontispiece of his 1922 book), the Spain–Portugal border measured with three dividers at once over NASA's Blue Marble, a magnifier on a meander, the 49th parallel that does not grow, the log-log law (slope m, D = 1 − m), Richardson's lines, the rivers, the range where the law holds, and the river network of the peninsula drawing itself. All borders are real data (Natural Earth 10m), measured by herramientas/fronteras_cap3.py; the satellite crops are reprojected to the same km by herramientas/tierra_cap3.py.

### `src/cap4.ts`

> CAPÍTULO IV · «Cómo crece una forma» (fractales/GUION-capitulo-4-como-crece.md, v2). Three mechanisms that branch, each one our own simulation next to its real photograph: diffusion-limited aggregation (herramientas/dla_cap4.py), raindrops that cut a relief into a river network (herramientas/erosion_cap4.py) and a tree that grows towards the places that still need it (herramientas/vasos_cap4.py); then the three measured with the same box counting (herramientas/cajas_cap4.py), the forms of the prologue with their mechanism, and the heartbeat that opens chapter V.

### `src/cap5.ts`

> CAPÍTULO V · «Un corazón no es un metrónomo» (fractales/GUION-capitulo-5-corazon.md, v3). The heart of the prologue becomes a line of intervals; 24 hours of it; the detrended fluctuation analysis (DFA) drawn like Richardson's law; a heart with failure beside it; then 83 people as two overlapping clouds (our own audit of PhysioNet nsr2db and chf2db, herramientas/auditoria_corazon.py); and the healthy line that beats again. v3: a bridge (one form of the film per beat), the infinite zoom into the heartbeat beside the border of chapter III, and a close where every beat opens a fractal of the film, faster and faster, until a silence.

### `src/cap6.ts`

> CAPÍTULO VI · «La misma regla, en el tiempo» (fractales/GUION-capitulo-6-la-misma-regla.md). Richardson's dream; Lorenz's rounded number and the two wings of his 1963 system (herramientas/lorenz_cap6.py); the logistic rule of chapter V, exact and still unpredictable; the moment: its bifurcation diagram deformed with c = r/2 − r²/4 and z = r(½ − x) until it sits under the real axis of the Mandelbrot set; Feigenbaum's 4,669; and a cloud of uncertainty spreading over Lorenz's wings.

### `src/cap7.ts`

> CAPÍTULO VII · «Del patrón a la herramienta» (fractales/GUION-capitulo-7-herramienta.md). Three tools, each with a problem, what the geometry brings, a result and a limit: the Sierpiński antenna (Puente et al. 1996) and its five bands; landscapes by midpoint displacement (Carpenter 1980; Fournier, Fussell & Carpenter 1982) and a border invented with the measured roughness of chapter III; a real fundus photograph turned into a number (herramientas/retina_cap7.py). The close: every tool works in a range; out to the cosmic web.

### `src/cap8.ts`

> CAPÍTULO VIII · «¿Hasta dónde llega la estructura?» (fractales/GUION-capitulo-8-estructura.md). The likeness of the opening (neurons and the cosmic web) measured (Vazza & Feletti 2020: a power spectrum alike over two decades, some network metrics alike and others not, broken power laws, a first exploratory work); the observed web (2dF, SDSS); the idea of a fractal universe with no end (Pietronero 1987); counting galaxies in spheres; the WiggleZ curve D₂(r) rising to 3 (Scrimgeour et al. 2012, figure 6, redrawn from its numbers); four claims kept apart; the close: out to an even texture. No researcher is named: none has a free portrait (fractales/FUENTES-capitulo-8.md).

### `src/cap9.ts`

> CAPÍTULO IX · «El lenguaje y sus rangos» (fractales/GUION-capitulo-9-lenguaje.md). Galileo's book written in the language of mathematics (Il Saggiatore, 1623); what this film described with a few rules; Wigner (1960): a gift we neither understand nor deserve, and laws of «strictly limited scope»; three ways of answering, left open; two faces: the Mandelbrot set nobody chose, and a border whose length depends on the ruler; the bands where each law of the film has evidence, on one scale of metres and one of seconds; only mathematics has detail without end.

### `src/cap10.ts`

> CAPÍTULO X · «La frontera» (fractales/GUION-capitulo-10-frontera.md). The end of the film. In the dark, a heartbeat and the promise of the opening (three frontiers); four returns, each with a new meaning (the heart, the coast, Richardson, the cosmic web); the title; then one shot with no cut: the cosmic web, a galaxy, the Earth, the fjords of Chile, a drop, a living microcosm (a recreation after Haeckel), a Julia set, and the Mandelbrot set down to ×10⁶⁰, past every measurement, to a whole copy; the turn: that dark is a pupil, someone is looking; the last line.

