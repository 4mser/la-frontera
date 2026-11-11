# LA FRONTERA · Arquitectura v3 · desde el Capítulo III (versión para congelar)

**CONGELADA el 23 oct 2026** en lo narrativo: tesis, orden, función de cada capítulo y **duración objetivo de 55 min**. Las afirmaciones científicas no se congelan todavía: cada capítulo cierra su narración y su montaje solo con sus fuentes primarias verificadas (sección 5). El Cap. VII se escribe con la misma estructura en cada caso (problema → aporte de la geometría → resultado verificable → límite). Los materiales porosos se quedan solo si tienen una función narrativa clara.

**23 oct 2026.** Corrige la v2 (`ARQUITECTURA-v2-desde-capitulo-3.md`) según la revisión externa. Incluye:
- las auditorías pedidas: corazón, logística–Mandelbrot, Richardson, fronteras y cosmología;
- duraciones que suman bien;
- el cambio que cada acto produce en el espectador.

Niveles de evidencia:
- **[M]** matemática demostrada;
- **[O]** observación;
- **[Mod]** modelo;
- **[A]** aplicación documentada;
- **[I]** investigación en curso;
- **[H]** hipótesis.

---

## 1 · La tesis que sostiene la película

La película no trata de demostrar que todo es fractal. Trata de **cómo aprendemos a ver, medir y comprender el mundo sin confundir nuestros modelos con la realidad completa**.

Lo que cambia en el espectador, acto por acto:

| Tramo | El espectador… |
|---|---|
| Prólogo y Caps. I–II (producidos) | descubre que reglas sencillas generan estructuras que desafían la intuición |
| Cap. III | descubre que incluso medir una forma concreta exige elegir una escala y un método |
| Caps. IV–VI | aprende a distinguir **semejanza, mecanismo, medición y predicción** |
| Cap. VII | descubre que estas ideas también se convierten en herramientas |
| Caps. VIII–IX | confronta la intuición con la evidencia y se pregunta por el alcance del lenguaje matemático |
| Cap. X | comprende que una frontera puede marcar el límite de una explicación y también el comienzo de otra pregunta |

**El hilo científico** es el rango de escalas: toda ley medida vale en un tramo. Aparece en la costa (III), el corazón (V), las herramientas (VII) y el cosmos (VIII), y se vuelve reflexión en IX.

---

## 2 · Auditorías

### 2.1 · Corazón (Cap. V)

**Método.** El script es `animatic/herramientas/auditoria_corazon.py` y los resultados están en `animatic/datos/auditoria_corazon.json`.
- Todos los registros de PhysioNet: nsr2db, sanos, n = 54, y chf2db, insuficiencia cardíaca congestiva, n = 29.
- El mismo procedimiento del prólogo para todos: intervalos entre latidos normales (0,3–2 s), α₁ sobre 4–16 latidos y α₂ sobre 16–64, como en Peng et al. 1995.
- Ningún registro quedó excluido.
- Para cada registro se registraron la duración, la fracción de latidos normales, la edad, el sexo y la clase NYHA, que salen de sus cabeceras.

**Resultados.**

| | Sanos (54) | Insuficiencia (29) | Prueba |
|---|---|---|---|
| α₁, mediana [rango intercuartil] | 1,30 [1,16–1,38] | 1,01 [0,81–1,19] | Mann–Whitney z = 4,7, p ≈ 2·10⁻⁶ · δ de Cliff = 0,63 · IC 95 % de la diferencia de medianas: 0,13 a 0,46 |
| α₂, mediana [rango intercuartil] | 1,06 [1,00–1,15] | 1,25 [1,14–1,27] | z = −4,9, p ≈ 1·10⁻⁶ · δ = −0,65 · IC 95 %: −0,22 a −0,12 |

**Robustez.**
1. **Se reproduce exactamente** con el código y los datos del proyecto: son las mismas medianas que usa el prólogo.
2. **La edad no lo explica.** Restringido a la franja de 50–75 años, con 45 sanos y 21 con insuficiencia y edades medianas de 65 y 62, las diferencias se mantienen: α₁ 1,30 frente a 1,02 (p ≈ 1·10⁻⁴) y α₂ 1,07 frente a 1,26 (p ≈ 2·10⁻⁵).
3. **La duración no lo explica.** Los registros con insuficiencia son algo más cortos, 20,4 h frente a 23,2 h de mediana. Recortados todos a sus primeras 16 h, las medianas quedan en 1,29 / 1,05 los sanos y 1,02 / 1,25 los de insuficiencia.

**Lo que no se controló.**
- Medicación: los registros no la informan.
- Calidad de la señal, más allá de la fracción de latidos normales: 99,6 % frente a 97,9 %.
- Los criterios de selección de pacientes de cada base de datos.

**Cómo puede decirse.** Es una diferencia robusta **entre grupos**, en estos datos. Las distribuciones se solapan: varias personas con insuficiencia tienen valores dentro del rango de los sanos. **No sirve para diagnosticar a una persona.**

**Coherencia con la literatura.** El sentido de la diferencia coincide con lo publicado:
- Peng et al. 1995, por verificar la versión primaria;
- la pérdida de multifractalidad en la insuficiencia (Ivanov et al. 1999, *Nature* 399: 461) [O, verificado].

### 2.2 · Logística y Mandelbrot (Cap. VI): especificación verificable

**La transformación** [M]. La ecuación logística x' = r·x·(1 − x) es exactamente z' = z² + c con:
- **z = r·(½ − x)**;
- **c = r/2 − r²/4**.

**Comprobación numérica.** Iterando ambas 30 pasos con r = 3,7, la diferencia máxima es 1,5·10⁻¹¹ (error de redondeo). El punto crítico x = ½ de la logística corresponde a z = 0: **la órbita que estudia el diagrama de bifurcación es la misma órbita de 0 del Mandelbrot**.

**Correspondencia de puntos clave** (calculada):

| Logística | r | c | En el Mandelbrot |
|---|---|---|---|
| Nace el punto fijo estable | 1 | 0,25 | La cúspide del cardioide |
| Primera duplicación (1 → 2) | 3 | −0,75 | El cuello entre el cardioide y el bulbo de período 2 |
| Segunda (2 → 4) | 1 + √6 ≈ 3,449 | −1,25 | El borde del bulbo de período 2 con el de período 4 |
| Acumulación de Feigenbaum | ≈ 3,56995 | ≈ −1,40116 | El punto de Feigenbaum sobre el eje real |
| Ventana de período 3 | 1 + √8 ≈ 3,828 | −1,75 | El inicio de la copia de período 3 (núcleo en −1,7549) |
| Fin | 4 | −2 | La punta de la antena |

**Período del atractor** de z² + c sobre el eje real, calculado: c = −0,5 → 1; −1 → 2; −1,3 → 4; −1,38 → 8; −1,395 → 16; −1,76 → 3; −1,77 → 6. Coincide con los bulbos y las copias que atraviesa el eje real.

**Cómo se anima sin mentir.**
1. El diagrama se dibuja primero en sus ejes originales (r, x).
2. **El eje horizontal se deforma** con c = r/2 − r²/4. No es lineal: los tramos se comprimen o se estiran.
3. **El eje vertical se transforma** con z = r·(½ − x). La escala vertical depende de r, así que cada columna se reescala.
4. Recién entonces el eje horizontal coincide con el eje real del conjunto de Mandelbrot y se alinea debajo de él.
5. **El eje vertical del diagrama (los valores de z) no es el eje imaginario del Mandelbrot.** Se dice en pantalla: «arriba: dónde vive la órbita · abajo: el mapa de las constantes».

Lo que coincide son **las posiciones en c** donde cambia el comportamiento. No hay una superposición de figuras.

**Feigenbaum.**
- δ ≈ 4,669 [M].
- Medida experimental: δ ≈ 4,4 ± 0,1 en convección de helio (Libchaber y colaboradores, 1982; primera observación en 1979) [O, fuentes secundarias: verificar la primaria antes de citar el año].

**Lorenz.** «Deterministic Nonperiodic Flow», *J. Atmos. Sci.* 20 (1963) [verificar cita]. La dimensión ≈ 2,05 de su atractor (Grassberger y Procaccia, 1983) está **pendiente**: no se usa hasta verificarla.

**Reducción de carga.** El Cap. VI usa **cuatro conceptos**: sensibilidad (Lorenz), determinista no es predecible, la logística como la regla de Mandelbrot en la recta, y la universalidad de Feigenbaum. **Se elimina la dimensión del atractor de Lorenz.**

### 2.3 · Richardson (Cap. III)

| Afirmación | Estado |
|---|---|
| 1881–1953; cuáquero | Verificado (MacTutor) |
| 1916: deja la Oficina Meteorológica para manejar ambulancias en Francia (Friends' Ambulance Unit, ~1916–1919) | Verificado (MacTutor, Quakers in the World) |
| Entre turnos hace los cálculos de su pronóstico de prueba; falla, pero el método es el de la predicción numérica actual; libro de 1922 | Verificado (MacTutor) |
| 1920: deja la Oficina cuando pasa al Ministerio del Aire, por razones de conciencia | Verificado (resumen MacTutor y Oxford DNB) · releer el texto primario antes de grabar |
| *Statistics of Deadly Quarrels* (1960) y «The problem of contiguity» (1961, *General Systems Yearbook* 6: 139), póstumos | Verificado (MacTutor; referencia 2 de Mandelbrot 1967) |
| Su ley «no atrajo atención» hasta Mandelbrot | Verificado (Mandelbrot 1967, p. 636) |
| D = 1,25 (oeste de Gran Bretaña), 1,15 (Alemania, 1899), 1,14 (España–Portugal), 1,13 (Australia) y 1,02 (Sudáfrica) | **Verificado en el original** (Mandelbrot 1967, p. 637) |

### 2.4 · Fronteras (Cap. III)

| Afirmación | Estado | Cómo se dice |
|---|---|---|
| España–Portugal: 987 y 1.214 km; Bélgica–Países Bajos: 380 y 449 km | Fuentes secundarias (Britannica y otras), que no coinciden en qué país dio cada cifra | Sin atribuir a un país |
| La frontera actual España–Portugal mide 1.214 km, y **740 km corren por ríos** (Miño, Duero, Tajo y Guadiana) | Capítulo académico sobre cuencas compartidas | «Más de la mitad sigue a cuatro ríos» · verificar en fuente oficial |
| Nuestra medición España–Portugal: 722 (80), 784 (40), 884 (20), 941 (10), 1.014 (5), 1.046 (2,5) y 1.064 km (1,25) | Dato propio (Natural Earth 10m) | — |
| **1,14 (Richardson) frente a 1,12 (nosotros)** | Métodos distintos | **Compatibles, no una confirmación.** Otros mapas, otro rango de reglas y otro ajuste. Se dice «un valor muy parecido» |
| **Estados Unidos–Canadá por el paralelo 49 (de −123° a −95°): 2.022 km con todas las reglas, de 80 a 5 km; D = 1,000** | **Dato propio** (Natural Earth) | El contraste: una línea trazada con regla no se alarga |
| Frontera Egipto–Sudán por el paralelo 22 | **No verificada.** Nuestro cálculo da D = 1,014, porque incluye tramos irregulares | **Se reemplaza** por Estados Unidos–Canadá |

### 2.5 · Cosmología (Cap. VIII)

- **Lo que dice WiggleZ** (Scrimgeour et al. 2012, *MNRAS* 425: 116) [O]:
  - la distribución de galaxias **es compatible con la homogeneidad** a partir de unos 70–80 *h*⁻¹ Mpc, con una dimensión de correlación dentro del 1 % de 3;
  - **descarta** un fractal con D₂ < 2,97 entre unos 80 y 300 *h*⁻¹ Mpc.
- **Lo que no dice.** No demuestra que la estructura a escalas menores sea «estrictamente fractal». Que haya agrupamiento con relaciones de escala no es lo mismo que una ley fractal precisa.
- **El cierre corregido**, con la propuesta de la revisión:

  > «La materia se agrupa, forma filamentos y deja enormes vacíos. Pero, al ampliar la escala, esas diferencias se atenúan. La pregunta no es solo si el universo tiene estructura, sino hasta qué escala podemos describirla con la misma ley.»

- **La gráfica** muestra exactamente lo que se mide: la dimensión de correlación D₂(r) del catastro frente a la escala r, con su banda de error, acercándose a 3. Se rotula «D₂ = 3: DISTRIBUCIÓN HOMOGÉNEA». La curva se redibuja desde las cifras del artículo y se cita en pantalla.

### 2.6 · Cap. IX

Se elimina la regla de 10⁻³⁵ a 10²⁶ m y la idea de un «tamaño mínimo de la matemática». La longitud de Planck no está demostrada como mínimo de la realidad. La secuencia representa **los rangos en que nuestras descripciones y mediciones han sido probadas**: bandas de validez de cada ley vista en la película. No representa un límite de la naturaleza.

---

## 3 · Duración realista

Producido: **16:54**. Objetivo: **55 minutos**, sin recortar a la fuerza los momentos clave.

| Cap. | Título | Duración | Acumulado |
|---|---|---|---|
| — | Apertura + I + II | 16:54 | 16:54 |
| III | La medida de lo irregular | 5:00 | 21:54 |
| IV | Cómo crece una forma | 5:00 | 26:54 |
| V | Un corazón no es un metrónomo | 5:00 | 31:54 |
| VI | La misma regla, en el tiempo | 4:30 | 36:24 |
| VII | Del patrón a la herramienta | 6:30 | 42:54 |
| VIII | ¿Hasta dónde llega la estructura? | 5:30 | 48:24 |
| IX | El lenguaje y sus rangos | 3:30 | 51:54 |
| X | La frontera | 3:30 | **55:24** |

**La película queda en ≈ 55 min.**

Si hay que llegar a 50 min, quedan dos caminos honestos, y ninguno es «un minuto menos por capítulo»:
- (a) VI se integra al final de V como «el corazón no es caótico en el sentido de Lorenz», lo que exige revisar ese matiz científico. Ahorra 4:30.
- (b) VII queda en dos movimientos, antenas y retina, y lo procedural pasa a ser un puente de 40 s. Ahorra 2:00.

**Mi recomendación:** 55 min.

---

## 4 · Arquitectura congelable

Cada capítulo con: pregunta, función, enseñanzas, caso, secuencias que merecen producirse, cuidado, aprovecha, evita, cierre y paso al siguiente.

### III · La medida de lo irregular · 5:00
- **Pregunta:** ¿puede una medida depender de la herramienta con que miramos?
- **Función:** el puente de la matemática ideal a la realidad medida; el primer capítulo **experimental**.
- **Enseña:**
  - la medida depende de la regla, y cada medición es correcta para la suya;
  - la ley de Richardson (una recta en escala logarítmica) [O, empírica];
  - la inclinación **ordena** la irregularidad;
  - la dimensión de algo real vale **en un rango**.
- **Caso:** Richardson como personaje:
  - pacifista y meteorólogo;
  - calcula el tiempo atmosférico a mano en el frente;
  - deja su trabajo por conciencia en 1920;
  - mide fronteras para entender las guerras;
  - muere sin que nadie note su ley.
- **Secuencias a producir:**
  1. el retrato y el pronóstico hecho a mano (la cuadrícula sobre Europa);
  2. dos cifras para una misma línea;
  3. **tres compases a la vez** sobre la frontera real (80 / 20 / 5 km);
  4. los puntos que caen sobre una recta y el panel L(ε) = M·ε^(1−D);
  5. las rectas de Richardson redibujadas, que ordenan la irregularidad (1,02 · 1,14 · 1,25);
  6. **Estados Unidos–Canadá**: la regla cambia y el largo no (2.022 km), D = 1;
  7. **España–Portugal sobre sus ríos**: más de la mitad de la línea es agua;
  8. la recta se aplana bajo ~1 km (límite de los datos), con un breve viaje de escalas: roca, arena.
- **Cuidado:**
  - 1,14 frente a 1,12, «compatibles»;
  - las cifras sin atribuir a un país;
  - verificar los 740 km por ríos en una fuente oficial.
- **Aprovecha:** el compás del prólogo y la dimensión del Cap. I.
- **Evita:** volver a explicar la dimensión y presentar la paradoja como novedad.
- **Cierre:** «Medir también es decidir: elegir una regla es elegir una escala.»
- **Paso a IV:** la frontera recta la trazó una persona; la quebrada, un río. ¿Cómo dibuja un río?

### IV · Cómo crece una forma · 5:00
- **Pregunta:** ¿por qué tantas cosas se ramifican, y es siempre por la misma razón?
- **Función:** de describir a **explicar con mecanismos**.
- **Enseña tres mecanismos, y solo tres:**
  1. **crecimiento por difusión** (DLA) [Mod], que da las dendritas minerales;
  2. **erosión**: la red de drenaje que se organiza [O/Mod];
  3. **transporte que llena el espacio**: árboles de vasos y bronquios [Mod].

  **El parecido no implica un origen común.**
- **Caso:** tres simulaciones propias que crecen a la vez y luego se ponen junto a sus fotos reales. Las dendritas de manganeso ya salen en el prólogo y vuelven explicadas.
- **Secuencias a producir:**
  1. una partícula que vaga sola, luego miles, y aparece la forma;
  2. la lluvia sobre un relieve, y los canales se organizan;
  3. un árbol que crece hasta alcanzar todos los puntos de un volumen;
  4. el conteo de cajas sobre las tres da números distintos;
  5. la lista del prólogo regresa con un mecanismo bajo cada imagen.
- **Fuera:** sistemas L, Hack, Murray, West–Brown–Enquist y el rayo como capítulo propio. Como mucho, un rótulo.
- **Cuidado:** verificar la dimensión ≈ 1,71 del DLA (Witten y Sander 1981) y el modelo de redes de drenaje elegido. No decir «todo lo ramificado es fractal».
- **Cierre:** la misma apariencia, causas distintas.
- **Paso a V:** algunas formas no se ven en el espacio, sino en el tiempo. El latido vuelve a sonar.

### V · Un corazón no es un metrónomo · 5:00
- **Pregunta:** ¿puede un ritmo vivo tener estructura a muchas escalas, y qué nos dice eso?
- **Función:** **el centro emocional de la película**. Todo el capítulo es del corazón.
- **Enseña:**
  - un corazón sano no late a intervalos iguales; su variación tiene correlaciones a muchas escalas de tiempo [O];
  - el DFA, mostrado como herramienta (ventanas que crecen) y no como lección;
  - **la diferencia entre grupos** (auditoría 2.1) y su solapamiento;
  - la pérdida de multifractalidad en la insuficiencia (Ivanov 1999) [O].
- **Caso:** dos personas anónimas de PhysioNet, 24 horas de su corazón, y después 83 personas.
- **Secuencias a producir:**
  1. el latido del prólogo se detiene y se vuelve una línea de puntos;
  2. 24 horas en 10 segundos;
  3. el DFA en pantalla, con la misma estética de la recta de Richardson, para que el espectador **reconozca la herramienta**;
  4. **las dos nubes de puntos, 54 y 29, que se solapan.** Esa superposición es la honestidad del capítulo.
- **Cuidado:** no diagnosticar, no universalizar «salud = complejidad» y declarar lo que no se controló.
- **Cierre:** «Un corazón sano no es un metrónomo», y la salud presentada como una pregunta de investigación: algo que parece vivir entre la rigidez y el desorden.
- **Paso a VI:** si un sistema regido por leyes fisiológicas varía así, ¿qué pasa con uno regido por ecuaciones exactas?

### VI · La misma regla, en el tiempo · 4:30
- **Pregunta:** ¿cómo puede algo obedecer leyes exactas y aun así ser impredecible?
- **Función:** **el pago de los capítulos I y II**. La regla de siempre, ahora en el tiempo.
- **Enseña cuatro ideas:**
  1. Richardson soñaba con calcular el tiempo atmosférico, y Lorenz encontró que un modelo atmosférico simple amplifica diferencias mínimas;
  2. determinista no significa predecible [M];
  3. **la logística es z² + c en la recta real** (especificación 2.2) [M];
  4. la universalidad de Feigenbaum: 4,669 en la matemática, ≈ 4,4 medido en helio [M/O].
- **Secuencias a producir:**
  1. dos trayectorias de Lorenz que se separan;
  2. **el momento:** el diagrama de bifurcación se transforma paso a paso, deformando el eje horizontal y reescalando el vertical, y se encaja **debajo** del eje real del Mandelbrot. Los cambios de período coinciden con los bulbos y la ventana de período 3 con la copia en −1,75. El rótulo «ARRIBA: DÓNDE VIVE LA ÓRBITA · ABAJO: EL MAPA DE LAS CONSTANTES» deja claro qué se compara;
  3. las duplicaciones que se acercan en la proporción 4,669.
- **Cuidado:** no decir «el caos es fractal» ni extrapolar Lorenz al clima en general.
- **Cierre:** saber la regla no es saber el resultado.
- **Paso a VII:** aun sin predecirlo todo, ¿podemos usar esta geometría?

### VII · Del patrón a la herramienta · 6:30
- **Pregunta:** ¿qué pasa cuando dejamos de mirar los fractales y empezamos a usarlos?
- **Función:** el acto práctico. Cuatro movimientos, cada uno con un problema, un mecanismo, un resultado y un límite. El nivel de madurez va rotulado en pantalla: «APLICACIÓN COMERCIAL», «HERRAMIENTA DE INVESTIGACIÓN» o «PREGUNTA ABIERTA».
- **Movimientos:**
  1. **Diseñar · antenas (2:00).** Una antena pequeña y multibanda: la autosemejanza de la geometría se traduce en bandas.
     - Puente et al. (UPC), Sierpiński multibanda, *Electronics Letters* (1996) [A];
     - Cohen (1995) y la anécdota del casero (IEEE History Center) [A];
     - límites: no son superiores en todo, y los límites físicos de las antenas pequeñas siguen en estudio [I]; la prioridad entre Cohen y la UPC está en disputa.
  2. **Representar · mundos digitales (1:45).** Un paisaje generado ante los ojos del espectador:
     - desplazamiento del punto medio y octavas de ruido;
     - la costa del Cap. III regenerada con su rugosidad medida;
     - historia: *Vol Libre* (1980) y *Star Trek II* (1982) [verificar];
     - límite: no toda la generación procedural es fractal.
  3. **Medir lo vivo en una imagen · la retina (1:45).** Fondo de ojo → segmentación de los vasos → conteo de cajas → un número. Una dimensión más baja se asocia con más riesgo cardiovascular en revisiones recientes [I]. Límites: métodos heterogéneos, sin uso diagnóstico por sí sola. Es el contraste con el Cap. V: allí se medía una señal en el tiempo; aquí, una geometría en una imagen.
  4. **Materia y horizonte (1:00).**
     - rocas porosas con poros de estructura fractal, D de 2,57 a 2,87 en algunas areniscas (Katz y Thompson 1985) [O, verificar primaria], con su uso para modelar la permeabilidad [Mod];
     - preguntas abiertas rotuladas como tales [I/H].
- **Secuencia a producir:** la cadena del borde del Mandelbrot a la pista de una antena, a la onda y al teléfono; el paisaje paso a paso; la retina que se segmenta y se vuelve un número.
- **Cierre:** cada herramienta funciona **en un rango**: la antena en sus bandas, el paisaje hasta su píxel, la retina hasta su resolución.
- **Paso a VIII:** ¿y el rango más grande de todos?

### VIII · ¿Hasta dónde llega la estructura? · 5:30
- **Pregunta:** ¿la estructura del cosmos sigue la misma ley a todas las escalas?
- **Función:** la culminación científica: una pregunta fascinante confrontada con la evidencia.
- **Enseña:**
  - **abre con la semejanza de la apertura, medida:** Vazza y Feletti (2020), con espectro de potencia y métricas de red. Ellos lo llaman estudio piloto y declaran sus limitaciones: conectividad aproximada por proximidad, un marcador y nodos no estándar. Es una semejanza cuantificada, no un mecanismo común;
  - galaxias, filamentos y vacíos [O];
  - WiggleZ: compatible con la homogeneidad desde unos 70–80 *h*⁻¹ Mpc [O];
  - las cuatro afirmaciones que se confunden: agrupado, con relaciones de escala en un tramo, fractal a toda escala, homogéneo a gran escala.
- **Secuencias a producir:**
  1. neuronas y red cósmica superpuestas; algunas métricas coinciden y otras no, y la superposición se deshace;
  2. **el viaje de la apertura al revés**, que se vuelve la gráfica D₂(r) acercándose a 3, con su banda de error.
- **Cierre:** el de la auditoría 2.5.
- **Paso a IX:** si la matemática describe tan bien y solo en ciertos tramos, ¿qué es lo que estamos describiendo?

### IX · El lenguaje y sus rangos · 3:30
- **Pregunta:** ¿por qué funciona describir el mundo con matemática, y dónde deja de funcionar?
- **Enseña:**
  - Wigner (1960) [verificar el texto];
  - tres posturas en una frase cada una (descubrimos estructuras, inventamos lenguajes, estudiamos relaciones), sin resolver el debate;
  - la película como evidencia de ambas caras: el Mandelbrot no lo eligió nadie, y la dimensión de una costa depende de cómo la medimos.
- **Secuencia:** las bandas de validez de cada ley vista en la película (costa, corazón, cosmos), dibujadas sobre una sola escala. Lo que se ve son **los rangos donde la evidencia las respalda**, no un límite de la naturaleza.
- **Evita:** «¿por qué hay algo?» y el tamaño mínimo.
- **Paso a X.**

### X · La frontera · 3:30
- **Pregunta:** ¿qué significa conocer desde una frontera?
- **Regresos, cada uno con significado nuevo:**
  - el latido: un ritmo entre el orden y el desorden;
  - la costa: una decisión de escala;
  - Richardson y las fronteras que nos separan;
  - la red cósmica: una pregunta con datos.
- **Final:** un pulso, un punto y una frontera que se amplía sin prometer un último nivel. Negro.
- **Línea de cierre:** queda por escribir. Saldrá de la tesis: una frontera puede marcar el límite de una explicación y el comienzo de otra pregunta.
- **Evita:** volver a explicar Mandelbrot, Cantor o Leibniz.

---

## 5 · Fuentes primarias pendientes antes de cada guion

| Cap. | Por verificar |
|---|---|
| III | Los 740 km de frontera por ríos (fuente oficial); el texto de MacTutor y del Oxford DNB sobre 1920; la frontera EE. UU.–Canadá por el paralelo 49 (tratados de 1818 y 1846) |
| IV | Witten y Sander 1981 (D ≈ 1,71); el modelo de drenaje que se use |
| V | Peng et al. 1995 (*Chaos* 5: 82) |
| VI | Lorenz 1963; Libchaber et al. 1982 (año y valor); la referencia de Feigenbaum 1978 |
| VII | Puente 1996 (cita exacta en IEEE Xplore); *Vol Libre* y *Star Trek II*; la revisión de la retina de 2025; Katz y Thompson 1985 |
| VIII | La figura de D₂(r) de WiggleZ, para redibujarla con sus cifras |
| IX | Wigner 1960, el texto original |
