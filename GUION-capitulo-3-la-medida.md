# LA FRONTERA · Capítulo III · La medida de lo irregular

**Guion v3 · 23 oct 2026 · para producción.** Escrito sobre la arquitectura v3 congelada (`ARQUITECTURA-v3-congelable.md`). Incorpora la segunda revisión externa (`GUION-capitulo-3-la-medida-v2.md` queda como historial):
- la pendiente es 1 − D, y la dimensión se obtiene de ella;
- las cifras publicadas y la medición propia van rotuladas y separadas;
- se distingue el límite del mapa del límite de la realidad;
- el orden ahora es frontera irregular → frontera recta → pendiente;
- el cierre abre el Cap. IV sin prometer una causa única.

**Duración objetivo:** 5:15. La voz suma unos 3:05; el resto son pausas, silencios y secuencias sin narración. La arquitectura asigna 5:00; los 15 s extra salen del margen del Cap. IX.

**Pregunta:** ¿puede una medida depender de la herramienta con que miramos?

**Lo que el espectador ya trae:**
- la costa medida con seis reglas (prólogo);
- Mandelbrot y su artículo de 1967 (prólogo);
- la dimensión contada por copias (Cap. I).

**Lo que este capítulo agrega:**
- el personaje;
- el experimento con datos propios;
- **la ley** y su inclinación como forma de **ordenar** la irregularidad;
- **la recta que no se alarga**;
- **el rango**.

**Convenciones:**
- **VOZ** es el texto exacto de la narración. En el archivo de voz, los nombres se escribirán como se pronuncian: «Lúis Frai Ríchardson», «Mandelbrót». Cada frase pasa por `audio/verifica_idioma.py`.
- **[F#]** remite a la tabla de fuentes del final.
- Los tiempos son aproximados y se ajustan con la voz real (`herramientas/tiempos_cap3.py`).

---

## 0 · Título (0:00 – 0:14)

- **IMAGEN:**
  - Negro. Un compás de dos puntas, dibujado en líneas finas de luz crema, abre sus patas.
  - Camina sobre una línea irregular de luz, un tramo real de la frontera España–Portugal sin rotular. Cada paso deja una marca ámbar y un arco tenue.
  - Al cuarto paso, la línea se apaga y el compás queda abierto, quieto.
  - **En el golpe:** **LA MEDIDA DE LO IRREGULAR**, con **CAPÍTULO III** arriba. La tipografía es delgada, como el título del Cap. II, pero se construye **por pasos de compás**: cada palabra aparece con un tic, de izquierda a derecha. Debe distinguirse del título del documental y de la regla graduada del Cap. I.
- **SONIDO:** un tic metálico, seco y suave por cada paso del compás. Los tics marcan el pulso. El *braam* y el *boom* del título caen en el golpe. Después, un dron grave que se queda.

## 1 · El hombre que medía para entender la guerra (0:14 – 1:12)

- **IMAGEN (0:14):** el retrato de Lewis Fry Richardson, con el mismo marco que Fatou, Julia y Leibniz. Rótulo: **LEWIS FRY RICHARDSON · 1881 – 1953**.

> **VOZ:** En mil novecientos dieciséis, un meteorólogo inglés cambió su oficina por una ambulancia en el frente francés. [F1]

> **VOZ:** Se llamaba Lewis Fry Richardson. Era cuáquero y objetor de conciencia: no aceptaba tomar un arma. [F1]

- **IMAGEN (0:26):**
  - El retrato se aparta a la izquierda. A la derecha se dibuja un mapa de Europa en líneas finas, y sobre él una cuadrícula.
  - En las celdas aparecen números **escritos a mano**, uno tras otro, como si alguien los calculara en ese momento.
  - Rótulo: **«WEATHER PREDICTION BY NUMERICAL PROCESS» · 1922**. Debajo, pequeño: **CUADRÍCULA REDIBUJADA**.

> **VOZ:** Durante la guerra trabajó en una idea extraordinaria: calcular el tiempo atmosférico resolviendo las ecuaciones que lo describen. Hizo los cálculos a mano, en el frente. [F1, F2]

> **VOZ:** Su primer intento fue un fracaso práctico. Pero el principio que exploraba se convertiría en una de las bases de la predicción meteorológica moderna. [F1, F2]

- **IMAGEN (0:44):** la cuadrícula se apaga celda por celda. Rótulo: **1920 · LA OFICINA METEOROLÓGICA PASA AL MINISTERIO DEL AIRE**.

> **VOZ:** En mil novecientos veinte, la oficina meteorológica pasó a depender del Ministerio del Aire, y Richardson renunció: no quería trabajar para la guerra. [F1]

- **IMAGEN (0:53):**
  - Fichas de cartulina en una pila, redibujadas en líneas, con nombres de conflictos y años.
  - Dos países en silueta, sin nombre, con su frontera común encendida.
  - Rótulo: **¿PELEAN MÁS LOS PAÍSES CON MÁS FRONTERA COMÚN?**

> **VOZ:** Entonces decidió estudiar la guerra misma, con números. Se preguntó, por ejemplo, si los países que comparten más frontera pelean más entre sí. [F1]

> **VOZ:** Para eso necesitaba un dato que parecía sencillo: cuánto mide cada frontera.

- **SONIDO:** bajo el retrato, la voz femenina canta una frase grave y lenta. En «guerra», un *boom* lejano y apagado. Bajo las fichas, un pulso suave de dos notas.

## 2 · Dos cifras para una misma línea (1:12 – 1:45)

- **IMAGEN (1:12):**
  - La península ibérica en silueta oscura.
  - La frontera España–Portugal (Natural Earth 10m) **se enciende de norte a sur**.
  - A cada lado aparece una cifra grande en ámbar: **987 km** y **1.214 km**, sin nombre de país.
  - Abajo, fijo durante toda la escena: **ESTIMACIONES PUBLICADAS · MÉTODOS Y FUENTES DISTINTOS**.

> **VOZ:** Y no lo era. Para la frontera entre España y Portugal encontró dos cifras: novecientos ochenta y siete kilómetros, y mil doscientos catorce. [F3]

- **IMAGEN (1:22):** corte a Bélgica y los Países Bajos. La frontera se enciende: **380 km** y **449 km**.

> **VOZ:** Entre Bélgica y los Países Bajos pasaba lo mismo: trescientos ochenta, contra cuatrocientos cuarenta y nueve. [F3]

- **IMAGEN (1:30):** vuelve la frontera ibérica. Sobre ella, en monoespaciada pequeña, se apilan las cifras que dan hoy distintas fuentes: **1.214 · 1.234 · ~1.250 KM**.

> **VOZ:** Incluso hoy, distintas fuentes dan cifras distintas para la misma línea. [F4]

> **VOZ:** Richardson sospechó que nadie se había equivocado: cada uno había medido con una regla distinta.

> **VOZ:** Para entender por qué, hicimos nuestro propio experimento: una sola fuente de datos, y distintas reglas.

- **SONIDO:** cada cifra cae con una nota corta y distinta, que suena en disonancia leve con la anterior. Al final, silencio de 0,8 s.

## 3 · La misma frontera, tres pasos (1:45 – 2:30)

**El momento visual del capítulo.**

- **IMAGEN (1:45):**
  - La frontera España–Portugal llena la pantalla, girada en vertical. Se ven los entrantes del Miño, el Duero, el Tajo y el Guadiana, pero los ríos todavía **no se nombran**.
  - Aparecen **tres compases de colores distintos**: azul (80 km), crema (20 km) y ámbar (5 km).
  - **Caminan a la vez**, cada uno a su ritmo: el de 80 da pasos largos y lentos; el de 5, pasos cortos y rápidos.
  - Cada uno deja su poligonal y lleva su contador arriba, en su color: **PASO 80 KM · 722 KM**, **PASO 20 KM · 884 KM** y **PASO 5 KM · 1.014 KM**.
  - Al terminar, las tres poligonales quedan superpuestas. La ámbar se mete en cada entrante; la azul los corta en línea recta.
  - Abajo, fijo: **MEDICIÓN PROPIA · NATURAL EARTH 10m · MÉTODO DE COMPÁS**.

> **VOZ:** Con pasos de ochenta kilómetros, la frontera mide setecientos veintidós. Con pasos de veinte, ochocientos ochenta y cuatro. Con pasos de cinco, mil catorce. [F5]

> **VOZ:** Las tres medidas son correctas. Lo que cambia es el tamaño del paso: cuanto más corto, más larga resulta la frontera.

- **EN PANTALLA:** «LA MEDIDA DEPENDE DE LA REGLA».
- **SONIDO:** tres ritmos de tics en tres alturas: grave, media y aguda. El de 5 km es un redoble. Cuando terminan, un acorde de tres notas que **no resuelve**.

### 3b · Una frontera que no se alarga (2:30 – 2:55)

- **IMAGEN (2:30):**
  - Corte. Norteamérica en silueta. La frontera Estados Unidos–Canadá a lo largo del **paralelo 49**, de −123° a −95°, se enciende: una recta perfecta.
  - Los **mismos tres compases** la recorren a la vez, con sus mismos colores y ritmos.
  - Los tres contadores marcan **2.022 KM**.
  - Rótulo: **PARALELO 49 · CONVENIO DE 1818 Y TRATADO DE OREGÓN, 1846**.

> **VOZ:** Ahora midamos otra frontera: la que separa a Estados Unidos y Canadá a lo largo del paralelo cuarenta y nueve. [F9]

> **VOZ:** Con pasos de ochenta, de veinte o de cinco kilómetros, mide siempre lo mismo: dos mil veintidós. Esa línea se trazó sobre un paralelo, en un tratado. En todo el rango que medimos, achicar la regla no revela ningún detalle nuevo. [F5, F9]

- **SONIDO:** los tres ritmos de tic **coinciden** y suenan como uno solo, sin acorde.

## 4 · La ley y su inclinación (2:55 – 4:00)

- **IMAGEN (2:55):**
  - Los contadores de las dos fronteras bajan y se vuelven puntos de **un solo gráfico**.
  - Eje horizontal: **TAMAÑO DEL PASO** (5 · 10 · 20 · 40 · 80 km). Eje vertical: **LARGO MEDIDO**. Ambos en escala logarítmica, con marcas que se multiplican.
  - Los puntos de España–Portugal forman una recta que **baja hacia la derecha**: pasos más largos, largo menor.
  - Los de EE. UU.–Canadá forman una recta **horizontal**.

> **VOZ:** Si anotamos estas medidas en una escala especial, donde cada marca multiplica la anterior, los puntos caen en línea recta. Fue lo que encontró Richardson. [F6]

- **IMAGEN (3:08):**
  - Sobre cada recta se dibuja su inclinación como un pequeño triángulo de pendiente, con su número:
    - **ESPAÑA–PORTUGAL · PENDIENTE m = −0,12**;
    - **EE. UU.–CANADÁ · PENDIENTE m = 0**.
  - Luego aparece el **PANEL**: «L(ε) = M · ε^(1 − D)». Debajo, escrito en dos tiempos: **PENDIENTE m = 1 − D**, y después **D = 1 − m**.
  - Al lado de cada recta, el resultado aparece como una suma que se resuelve: **1 − (−0,12) = 1,12** y **1 − 0 = 1**.

> **VOZ:** La recta horizontal es la de una línea que no cambia con la regla. La que baja es la de una línea que se sigue quebrando. Y de esa inclinación se obtiene un número. [F5]

- **IMAGEN (3:24):**
  - Junto a nuestras dos rectas aparecen, redibujadas, las de Richardson, cada una con su nombre y con la dimensión que se obtiene de su inclinación: **COSTA DE SUDÁFRICA · D = 1,02**, **COSTA DE AUSTRALIA · 1,13**, **ESPAÑA–PORTUGAL · 1,14**, **FRONTERA DE ALEMANIA (1899) · 1,15** y **COSTA OESTE DE GRAN BRETAÑA · 1,25**.
  - Un **CÍRCULO**, como referencia teórica, queda casi horizontal, sin comentario de voz.
  - Pie: **RECTAS REDIBUJADAS A PARTIR DE LAS DIMENSIONES DE RICHARDSON (1961), SEGÚN MANDELBROT (1967)**.

> **VOZ:** Cada línea tiene su inclinación: casi horizontal para la costa de Sudáfrica, mucho más empinada para la costa oeste de Gran Bretaña. [F7]

- **IMAGEN (3:36):** fundido lento a los retratos: Richardson a la izquierda y Mandelbrot (la misma foto del prólogo) a la derecha. Entre ambos, una línea de tiempo: **1953 · 1961 · 1967**.

> **VOZ:** Richardson murió en mil novecientos cincuenta y tres, y su trabajo se publicó después, casi sin que nadie lo notara. [F1, F8]

> **VOZ:** Catorce años más tarde, Mandelbrot vio lo que escondía esa inclinación: de ella se obtiene la dimensión fractal de la línea. [F8]

- **IMAGEN (3:50):** vuelve el gráfico. Junto a la recta española aparecen dos valores: **RICHARDSON · D = 1,14** y **NUESTRA MEDIDA · D = 1,12**. Debajo, en pequeño: **OTROS MAPAS · OTROS PASOS · OTRO AJUSTE**.

> **VOZ:** Para la frontera entre España y Portugal, Richardson obtuvo uno coma catorce. Con nuestros datos y nuestro método, obtenemos uno coma doce: un valor muy parecido, medido de otra forma. [F5, F7]

- **EN PANTALLA:** «LEY DE RICHARDSON» · DE LA INCLINACIÓN SE OBTIENE LA DIMENSIÓN.
- **Nota de animación:** en un gráfico de log(largo) frente a log(paso), una línea con D > 1 tiene pendiente **negativa**. La recta baja hacia la derecha y la pendiente siempre se muestra con su signo.
- **SONIDO:** una nota por cada recta del abanico, más grave cuanto más empinada. En «dimensión fractal», un *braam* medio. Bajo el 1,14 frente al 1,12, dos notas casi iguales, a un cuarto de tono, que se rozan.

## 5 · Quién dibujó cada línea (4:00 – 4:18)

- **IMAGEN (4:00):**
  - Vuelve la frontera ibérica.
  - Bajo ella se dibujan **los ríos** (Natural Earth, ríos 10m) en azul: Miño, Duero, Tajo y Guadiana, cada uno con su nombre.
  - Los tramos donde la frontera **es** el río se iluminan juntos.

> **VOZ:** La del paralelo cuarenta y nueve se trazó en un tratado. La frontera entre España y Portugal, en cambio, sigue en buena parte el curso de cuatro ríos. Lo quebrado de esa línea no lo dibujó un tratado: lo dibujó el agua. [F10]

- **IMAGEN (4:10):** a la izquierda, pequeño, el paralelo 49 recto. A la derecha, la frontera fluvial. Rótulos: **LA TRAZÓ UN TRATADO** y **LA DIBUJÓ EL AGUA**.
- **SONIDO:** un murmullo grave de agua, filtrado, y la voz femenina vuelve una octava abajo.

## 6 · Hasta dónde vale (4:18 – 4:50)

- **IMAGEN (4:18):**
  - El gráfico de España–Portugal se extiende hacia pasos más pequeños: **2,5 KM · 1.046** y **1,25 KM · 1.064**.
  - La recta **se dobla y se aplana**.
  - Una banda sombreada a la izquierda dice **EL MAPA YA NO TIENE MÁS DETALLE (~1 KM)**.

> **VOZ:** Pero llega un punto en que el mapa ya no tiene más detalle que ofrecernos, y la recta se aplana. Eso no dice que la frontera real se vuelva lisa: dice dónde termina nuestra información. [F5]

- **IMAGEN (4:30):**
  - Un viaje de escalas breve, con fotografías reales: un tramo del río fronterizo desde un satélite, la ribera, piedras en la orilla.
  - El mismo compás, del mismo tamaño en pantalla, recorre cada escala: **PASO 1 KM → 10 M → 10 CM**.
  - Junto a la ribera aparece, superpuesto, un hito de piedra de los que marcan la frontera, en una foto libre si se consigue.
  - Rótulo: **LA FRONTERA: ACUERDOS, COORDENADAS Y ACCIDENTES GEOGRÁFICOS**.

> **VOZ:** Y aunque pudiéramos acercarnos más, una frontera política no es una costa: está definida por acuerdos, coordenadas y accidentes geográficos. La regla sigue cambiando, pero también cambia aquello que estamos midiendo.

> **VOZ:** Por eso, cuando calculamos una dimensión a partir de datos reales, importa el rango de escalas en el que la relación se mantiene.

- **IMAGEN (4:44):**
  - El gráfico vuelve con la recta solo en su tramo válido, entre dos marcas: **AQUÍ VALE LA RELACIÓN**.
  - En pantalla partida, la curva de Koch del Cap. I sigue generando detalle a escalas cada vez menores, con el rótulo **MATEMÁTICA · DETALLE SIN FIN**. Del otro lado queda la frontera, con **DATOS REALES · UN RANGO**.
- **EN PANTALLA:** «UNA DIMENSIÓN, DENTRO DE UN RANGO DE ESCALAS».
- **SONIDO:** el dron se adelgaza al aplanarse la recta. Sobre las piedras, solo el tic del compás, cada vez más espaciado. Sobre Koch, una campanada aguda por cada ×3, como en el Cap. I.

## 7 · Cierre (4:50 – 5:15)

- **IMAGEN (4:50):**
  - La frontera España–Portugal sola, como una línea de luz sobre negro.
  - El compás se cierra y se aparta.

> **VOZ:** Richardson buscaba medir las fronteras que separan a los países. Descubrió que una misma línea podía tener distintas longitudes, según cómo se midiera.

> **VOZ:** Medir también es decidir: elegir una regla es elegir una escala.

- **IMAGEN (5:02):**
  - La línea se despega de la frontera y queda solo **el río**. Empieza a correr y se ramifica.
  - A su lado aparecen, en silencio y pequeñas, tres formas que el prólogo ya mostró: una dendrita de manganeso, unos vasos de la retina y una red de drenaje vista desde el espacio.

> **VOZ:** Pero medir una forma no es lo mismo que entender cómo llegó a existir. ¿Por qué se ramifica un río? ¿Por qué algunos minerales crecen como pequeños árboles? ¿Por qué ciertas redes de vasos se parecen a las que vemos desde el espacio?

> **VOZ:** Parecerse no significa tener el mismo origen. Para descubrirlo, hay que mirar cómo crecen.

- **SONIDO:** la voz femenina cierra la frase del comienzo del capítulo. En «crecen», un pulso de agua grave. Corte a negro con el último tic del compás.
- **Corte al Capítulo IV.**

---

## Producción

| Elemento | Qué es | Estado |
|---|---|---|
| Frontera España–Portugal | Natural Earth 10m, *admin_0_boundary_lines_land* (5 tramos, 486 vértices) | Descargado (`datos/natural-earth/`) |
| Frontera Bélgica–Países Bajos | Igual | Descargado |
| Frontera EE. UU.–Canadá, paralelo 49 | Igual, filtrado a 49° ± 0,05° y longitudes entre −123° y −95° | Descargado |
| Ríos Miño, Duero, Tajo y Guadiana | Natural Earth 10m, *rivers_lake_centerlines* | **Falta descargar** |
| Silueta de la península y de Norteamérica | Natural Earth 10m, *admin_0_countries* | **Falta descargar** |
| Compás: medición y caminata | Script nuevo `herramientas/fronteras_cap3.py`, que generalice el método de `costa_chile.py` y exporte las poligonales | **Por escribir** |
| Gráfico logarítmico, abanico de rectas y panel | Canvas | Por producir |
| Cuadrícula del pronóstico de 1922 | Redibujada por nosotros a partir de la descripción del libro; **no se copia la figura original** | Por producir |
| Retrato de Richardson | Commons, dominio público (NOAA) | **Falta descargar** |
| Retrato de Mandelbrot | Ya en uso (Jurvetson, CC BY 2.0) | Listo |
| Viaje de escalas: satélite, ribera, piedras, arena | Fotos con licencia libre | **Por buscar** |
| Curva de Koch | Reutilizar `kochVista` del Cap. I | Listo |

## Fuentes

| # | Afirmación | Fuente | Estado |
|---|---|---|---|
| F1 | Richardson (1881–1953), cuáquero y objetor de conciencia; de 1916 a 1919 en la Friends' Ambulance Unit, junto a la 16.ª división de infantería francesa; en 1920 la Oficina Meteorológica pasa al Ministerio del Aire y él renuncia por sus convicciones pacifistas; estudia matemáticamente las causas de la guerra, incluida la relación entre la frecuencia de las guerras y las fronteras comunes | MacTutor, biografía de Lewis Fry Richardson | **Verificado en la primaria** |
| F2 | Primer intento de predecir el tiempo resolviendo numéricamente sus ecuaciones (diferencias finitas), en *Weather Prediction by Numerical Process* (1922); la mayor parte de los cálculos se hizo en el frente, entre turnos; el resultado falló en la práctica, pero el principio es una de las bases de la predicción numérica moderna | MacTutor (método y libro); MacTutor DNB / Oxford DNB (cálculos entre turnos en el frente; fracaso del pronóstico) | Verificado en secundarias institucionales consistentes · leer el pasaje primario antes de grabar |
| F3 | 987 y 1.214 km (España–Portugal); 380 y 449 km (Bélgica–Países Bajos) | Britannica, «Coastline paradox», y otras secundarias; original: Richardson (1961) | Secundaria · **no se atribuye a ningún país** |
| F4 | Las cifras actuales difieren: 1.214, 1.234 y ~1.250 km | Capítulo académico sobre cuencas compartidas (1.214); postal.pt, que cita a HuffPost (1.234); dos artículos académicos (~1.250) | Verificado como discrepancia, que es justamente lo que se afirma |
| F5 | Nuestras mediciones: 722 (80), 784 (40), 884 (20), 941 (10), 1.014 (5), 1.046 (2,5) y 1.064 km (1,25). Ajuste log–log con pasos de 80 a 5 km: pendiente m = −0,124, de donde D = 1 − m = 1,124. EE. UU.–Canadá: 2.022 km con todos los pasos, m = 0 y D = 1,000 | Natural Earth 10m; método de compás (`costa_chile.py`, generalizado) | **Dato propio** · regenerar con el script del capítulo y guardarlo con el código |
| F6 | Richardson grafica el largo frente al paso en escala doblemente logarítmica y obtiene rectas | Mandelbrot (1967), fig. 1, que reproduce la fig. 17 de Richardson (1961) | Verificado en el original |
| F7 | D = 1,02 (Sudáfrica), 1,13 (Australia), 1,14 (España–Portugal), 1,15 (Alemania, 1899) y 1,25 (costa oeste de Gran Bretaña); el círculo tiende a un largo fijo | Mandelbrot (1967), pp. 636–637 | Verificado en el original |
| F8 | El trabajo póstumo de Richardson (*General Systems Yearbook* 6: 139, 1961) «no atrajo atención» hasta Mandelbrot (1967) | Mandelbrot (1967), p. 636 y ref. 2 | Verificado en el original |
| F9 | La frontera EE. UU.–Canadá por el paralelo 49: Convenio de 1818 (del lago de los Bosques a las Montañas Rocosas) y Tratado de Oregón de 1846 (hasta el estrecho de Georgia) | The Canadian Encyclopedia; Library of Congress | Verificado (secundarias institucionales) |
| F10 | Entre la mitad y el 60 % de la frontera España–Portugal sigue el cauce de ríos, sobre todo el Miño, el Duero, el Tajo y el Guadiana | Capítulo académico (740 de 1.214 km); artículo académico (~60 %); texto sobre comunicaciones de Portugal (50 %) | Verificado como rango · la voz dice «en buena parte» |

## Decisiones tomadas en este guion

- **España–Portugal:** las cifras van sin atribuir a un país y se agrega la discrepancia actual.
- **1,14 frente a 1,12:** se presentan como «un valor muy parecido, medido de otra forma». En pantalla van las tres diferencias de método.
- **La frontera recta:** EE. UU.–Canadá, medida por nosotros, en vez de Egipto–Sudán, que no se pudo verificar.
- **Los ríos:** «en buena parte», porque las fuentes dan del 50 % al 60 %.
- **La dimensión:** no se vuelve a explicar. Se **obtiene** de la inclinación (D = 1 − m), con la pendiente mostrada con su signo.
- **El límite de los datos:** se separa del límite de la realidad. Una frontera política no es una costa.
- **El orden:** la frontera irregular, luego la recta, luego la pendiente que cuantifica la diferencia. El círculo queda solo como referencia teórica en el gráfico.
- **El cierre:** abre el Cap. IV con preguntas sobre mecanismos, sin prometer una causa única.
- **Mandelbrot:** se usa su retrato del prólogo, sin repetir la historia de la costa.
