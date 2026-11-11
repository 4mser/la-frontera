# LA FRONTERA · Capítulo V · Un corazón no es un metrónomo

**Guion v4 · 24 oct 2026 · para producción.** v4: el capítulo gira en torno a una pregunta («¿debería un corazón sano latir como un reloj?») y cierra con una conclusión clínica, tres espirales (sano, insuficiencia, metrónomo) y el puente visual al Cap. VI (la ecuación logística y su diagrama de bifurcación). Antes, v3: Fuentes verificadas. Tras ver la previa v1, Nico pidió que se entienda qué tiene que ver con los fractales y con todo lo anterior, más efecto «wow» y un final que se entienda: se agregan el puente con los capítulos anteriores, el **zoom infinito al latido** junto a la frontera del Cap. III y el **final con latidos que abren fractales**. Escrito sobre la arquitectura v3 congelada (`ARQUITECTURA-v3-congelable.md`, sección V y auditoría 2.1).

**Duración objetivo:** 5:00. La voz suma unos 3:20, con ritmo parecido al del Cap. IV (4:56 con 3:45 de voz).

**Pregunta:** ¿puede un ritmo vivo tener estructura a muchas escalas, y qué nos dice eso?

**Función:** el centro emocional de la película. Todo el capítulo es del corazón.

**Lo que el espectador ya trae:**
- el latido real del prólogo, de una persona sana de PhysioNet;
- la recta de Richardson: medir a muchas escalas y mirar la inclinación (Cap. III);
- «la misma apariencia puede tener causas distintas» (Cap. IV).

**Lo que este capítulo agrega:**
- los intervalos entre latidos como una línea que nunca está quieta;
- el análisis de fluctuaciones sin tendencia (DFA), mostrado como herramienta, con la estética de la recta de Richardson;
- **la diferencia entre grupos y su solapamiento** (auditoría 2.1): la honestidad del capítulo.

**Cuidado (de la arquitectura):** no diagnosticar, no universalizar «salud = complejidad», declarar lo que no se controló.

**Convenciones:** como en los Caps. III y IV. Toda persona nombrada en la voz o en un rótulo aparece con su retrato y su crédito.

**Datos:** todos propios, de `datos/physionet` y `herramientas/auditoria_corazon.py`.
- Persona sana: nsr018, hombre de 68 años, 106.271 latidos normales en 23,0 h; α₁ = 1,30 y α₂ = 1,05. Es el registro más cercano a la mediana de su grupo.
- Persona con insuficiencia: chf223, 56 años, clase NYHA III, 101.560 latidos en 20,4 h; α₁ = 1,07 y α₂ = 1,26. También el más cercano a la mediana.
- Grupos: 54 sanos y 29 con insuficiencia; medianas α₁ 1,30 frente a 1,01 y α₂ 1,06 frente a 1,25.

---

## 0 · Título (0:00 – 0:14)

- **IMAGEN:**
  - Negro. El latido con que cerró el Cap. IV vuelve: un pulso de luz en el centro, con el sonido real del corazón.
  - Cada latido deja un punto que se desplaza a la izquierda. Los puntos forman una fila que sube y baja apenas.
  - **En el golpe:** **UN CORAZÓN NO ES UN METRÓNOMO**, con **CAPÍTULO V** arriba. Cada palabra aparece con un latido. La tipografía es delgada, como en los Caps. II a IV.
- **SONIDO:** los latidos reales de nsr018, con sus intervalos reales. El *braam* del título cae en un latido.

## 1 · El latido se vuelve una línea (0:14 – 0:50)

- **IMAGEN:** sobre el latido de luz, un instante de un metrónomo: un péndulo de luz que marca tiempos idénticos.

> **VOZ:** ¿Debería un corazón sano latir como un reloj, siempre al mismo tiempo? Casi todos diríamos que sí.

- **IMAGEN:** antes de la línea, un relámpago de lo ya visto, un plano por latido: el Mandelbrot, la frontera, la dendrita, los ríos. Luego solo el latido.

> **VOZ:** Hasta ahora, los fractales de esta historia fueron formas en el espacio: costas, fronteras, ramas. Pero también puede haber estructura dentro de estructura en el tiempo.

- **IMAGEN:** la fila de puntos se ordena en un gráfico: a la derecha, el número de latido; hacia arriba, cuánto duró cada intervalo. Los puntos suben y bajan.

> **VOZ:** Al comienzo de esta historia escuchamos un corazón. Era el registro real de una persona sana, guardado en una base de datos pública de investigación. [F1]

> **VOZ:** Si en vez de escucharlo anotamos cuánto dura cada intervalo entre un latido y el siguiente, aparece una línea que nunca está quieta.

- **IMAGEN:** debajo aparece, en gris, la línea de un metrónomo: todos los puntos a la misma altura. Rótulo: **METRÓNOMO** y **CORAZÓN SANO · PHYSIONET, NSR018**.

> **VOZ:** Un metrónomo marcaría siempre el mismo tiempo. Un corazón sano acelera y frena sin parar, incluso cuando estamos en reposo.

## 2 · Veinticuatro horas (0:50 – 1:30)

- **IMAGEN:**
  - La línea se extiende: 24 horas en unos 10 segundos. Las horas pasan en un contador discreto.
  - Al final, el día entero cabe en la pantalla: una banda que sube y baja por horas.

> **VOZ:** Este es un día casi completo de esa persona: más de cien mil latidos. [F1]

> **VOZ:** Hay horas en que el ritmo baja y horas en que sube, como en cualquier día con momentos de actividad y de descanso.

### 2b · Zoom infinito al latido

- **IMAGEN:**
  - Pantalla partida. A la izquierda, **MATEMÁTICA · CURVA DE KOCH**, que tiene detalle sin fin. A la derecha, **TIEMPO · CORAZÓN SANO**: el día completo. (v3b: la frontera del Cap. III se cambió por Koch, porque al acercarse se acababa el detalle del mapa digital y parecía que la frontera dejaba de ser fractal.)
  - Las dos se acercan a la vez, en un descenso continuo que avanza a golpes, uno por latido, como el descenso al Mandelbrot.
  - En cada escala la escala vertical se ajusta, como al acercarse a una costa, y la línea del corazón se ve igual de quebrada. Rótulos que cambian: **24 H → 1 H → 5 MIN → 30 S**.
  - La curva de Koch sigue mostrando el mismo detalle: rótulo **DETALLE SIN FIN**.
  - El corazón llega a unos pocos latidos, y cada punto es un latido: **AQUÍ SE ACABA EL RANGO**.
  - Nota: **ESCALA VERTICAL AJUSTADA EN CADA ACERCAMIENTO**.

> **VOZ:** Acerquémonos a esta línea como nos acercamos a la curva de Koch, la que nunca se acaba.

> **VOZ:** De un día a una hora, de una hora a unos minutos: en cada escala aparecen subidas dentro de subidas, igual de quebradas. Es una estructura fractal, pero en el tiempo. [F2, F5]

> **VOZ:** Hasta que llegamos a unos pocos latidos, y ahí se acaba. La curva matemática sigue sin fin; el corazón, como toda forma real, guarda esa estructura solo dentro de un rango de escalas.

## 3 · Medir a muchas escalas (1:30 – 2:45)

- **IMAGEN:** rótulo **ANÁLISIS DE FLUCTUACIONES SIN TENDENCIA · PENG Y OTROS, 1995**, con el retrato de Chung-Kang Peng.

> **VOZ:** Para medir esa estructura, en mil novecientos noventa y cinco un equipo de Boston usó un método llamado análisis de fluctuaciones sin tendencia. [F2]

- **IMAGEN:**
  - Sobre la línea se dibujan ventanas iguales. En cada una aparece una recta: su tendencia. La distancia entre la línea y su tendencia se ilumina.
  - Las ventanas crecen: 4 latidos, 16, 64. Cada tamaño deja un punto en un gráfico logarítmico a la derecha, con la misma estética que la recta de Richardson.

> **VOZ:** La idea es sencilla. Se corta la serie en ventanas del mismo tamaño, en cada una se quita la tendencia y se mide cuánto se aparta la línea de ella. [F2]

> **VOZ:** Luego se repite con ventanas cada vez más grandes. Si los puntos caen sobre una recta en escala logarítmica, su inclinación es un número que llamamos alfa. [F2]

> **VOZ:** Es la misma herramienta que usó Richardson con las fronteras: medir a muchas escalas y mirar la inclinación.

- **IMAGEN:** los puntos forman dos tramos rectos con un quiebre cerca de 16 latidos. Rótulos: **α₁ = 1,30 · 4 A 16 LATIDOS** y **α₂ = 1,05 · 16 A 64 LATIDOS**.

> **VOZ:** Para este corazón, en ventanas de cuatro a dieciséis latidos, alfa vale uno coma tres. En ventanas de dieciséis a sesenta y cuatro, uno coma cero cinco. [F3]

- **IMAGEN:** tres rectas de referencia, finas: **0,5 · AL AZAR**, **1 · RUIDO 1/f**, **1,5 · RUIDO BROWNIANO**. La recta del corazón queda entre ellas.

> **VOZ:** Un ritmo completamente al azar daría un medio. Uno que solo deriva lentamente daría uno y medio. Este corazón queda cerca de uno, entre ambos extremos. [F2]

## 4 · Otro corazón (2:45 – 3:25)

- **IMAGEN:** debajo de la línea sana aparece otra: **INSUFICIENCIA CARDÍACA · PHYSIONET, CHF223**. Las dos se recorren a la vez, latido a latido.

> **VOZ:** Ahora otra persona, de otra base de datos: alguien con insuficiencia cardíaca congestiva. [F1]

- **IMAGEN:** su DFA se dibuja junto al primero, en ámbar sobre azul. Los quiebres van en sentidos opuestos.

> **VOZ:** Su línea también varía, pero de otra manera. En las ventanas cortas, su alfa baja a uno coma cero siete. En las largas, sube a uno coma veintiséis. [F3]

## 5 · Ochenta y tres personas (3:25 – 4:25)

- **IMAGEN:**
  - Un plano con α₁ en un eje y α₂ en el otro. Los dos puntos anteriores quedan marcados.
  - Llegan, uno a uno, los 54 sanos en azul y los 29 con insuficiencia en ámbar.
  - Dos nubes, con sus medianas. **La zona donde se solapan se ilumina.**

> **VOZ:** Dos personas no prueban nada. Por eso hicimos lo mismo con todos los registros de esas dos bases de datos: cincuenta y cuatro personas sanas y veintinueve con insuficiencia. [F3]

> **VOZ:** Como grupo, los corazones sanos tienen un alfa corto más alto y un alfa largo más bajo. La diferencia es clara, y se mantiene al comparar personas de edades parecidas. [F3]

> **VOZ:** Pero las nubes se tocan. Varias personas con insuficiencia quedan dentro del rango de las sanas. Esta medida describe diferencias entre grupos, y no sirve para diagnosticar a nadie.

- **IMAGEN:** rótulo **LO QUE NO CONTROLAMOS · MEDICACIÓN · CRITERIOS DE SELECCIÓN DE CADA BASE**.

> **VOZ:** Tampoco controlamos todo. No sabemos qué medicamentos tomaba cada persona, y cada base de datos eligió a sus pacientes con sus propios criterios. [F3]

- **IMAGEN:** rótulo **MULTIFRACTALIDAD · IVANOV Y OTROS, 1999**, con el retrato de Plamen Ch. Ivanov.

> **VOZ:** Otros estudios, con otras herramientas, encontraron algo parecido: en la insuficiencia, el ritmo pierde parte de su variedad a distintas escalas. [F4]

## 6 · Cierre

- **IMAGEN, sin voz (unos 9 s): el latido se vuelve fractal.** Las 24 horas reales del corazón sano se enrollan en una espiral de luz, una vuelta por hora; con cada latido la cámara entra a una hora (una espiral de minutos) y a un minuto (una espiral de latidos). El corazón acelera hasta un silencio seco.
- **IMAGEN:** tres espirales de 24 horas, lado a lado, que se dibujan solas: **CORAZÓN SANO**, **INSUFICIENCIA CARDÍACA** y **METRÓNOMO**. La del metrónomo es una sucesión de círculos perfectos.

> **VOZ:** Un corazón sano no es un metrónomo. Su ritmo parece vivir en algún lugar entre la rigidez y el desorden.

- **IMAGEN:** el metrónomo y la insuficiencia se apagan un poco; la espiral sana late.

> **VOZ:** Y eso importa. Ya en los años ochenta, un estudio con cientos de personas que habían sufrido un infarto encontró que quienes tenían un ritmo menos variable corrían, como grupo, un riesgo mayor. [F7]

> **VOZ:** Un corazón que late demasiado parejo puede ser una señal de alarma. Su variedad a muchas escalas parece ser parte de su capacidad de adaptarse, y entender por qué sigue siendo una pregunta abierta. [F8]

> **VOZ:** Estructura dentro de estructura, a muchas escalas: la idea que encontramos en las costas y en los ríos aparece también en el ritmo de un corazón.

- **IMAGEN, puente al Cap. VI (v5: explicado, unos 45 s):** la espiral sana se apaga y queda la línea del latido; la línea se transforma en una serie de puntos que salta según una sola regla.

> **VOZ:** Un corazón obedece a muchas leyes a la vez. Veamos qué ocurre con algo mucho más simple: una sola regla, repetida una y otra vez.

- **IMAGEN:** la ecuación xₙ₊₁ = r · xₙ · (1 − xₙ), grande. Debajo, la serie de puntos.

> **VOZ:** Esta regla se usó para describir cómo cambia una población de un año al siguiente. El número r mide cuán rápido se reproduce. [F9]

- **IMAGEN:** el diagrama de bifurcación se dibuja de izquierda a derecha, al ritmo de la voz. Rótulos que aparecen en cada zona: **ORDEN**, **DUPLICACIONES**, **CAOS**.

> **VOZ:** Con r pequeño, la población se asienta en un solo valor: un ritmo perfectamente parejo, como el del metrónomo. [F9]

> **VOZ:** Al subir r, ese valor se divide en dos, luego en cuatro, luego en ocho: ciclos que se repiten, cada vez más largos. [F9]

> **VOZ:** Y de pronto aparece el caos: valores que nunca se repiten, aunque en la regla no hay nada de azar. [F9]

- **IMAGEN:** la cámara se acerca a la ventana de orden que hay dentro del caos (cerca de r ≈ 3,84) y allí aparece una copia en miniatura del diagrama completo.

> **VOZ:** Si nos acercamos, dentro del caos aparecen copias más pequeñas del mismo diagrama. Otra vez, estructura dentro de estructura. [F10]

- **IMAGEN:** la cámara vuelve al diagrama completo, que queda en pantalla varios segundos.

> **VOZ:** Entre el orden del metrónomo y el desorden total, una sola ecuación lo contiene todo. En el próximo capítulo veremos cómo.

- **Corte al Capítulo VI** desde el diagrama de bifurcación.

---

## Fuentes

| # | Afirmación | Fuente | Estado |
|---|---|---|---|
| F1 | nsr2db: 54 registros largos en ritmo sinusal normal (30 hombres de 28,5 a 76 años y 24 mujeres de 58 a 73); chf2db: 29 registros de personas de 34 a 79 años con insuficiencia cardíaca congestiva, clases NYHA I a III; 128 muestras por segundo. Las páginas dicen «long-term»: las ~23 h son medición nuestra | PhysioNet (páginas de nsr2db y chf2db); cita estándar: Pollard y otros, *Nature Health* 1: 792 (2026), y Goldberger y otros, *Circulation* 101: e215 (2000) | Verificado en las páginas |
| F2 | DFA: integrar la serie, cortarla en ventanas de n latidos, ajustar una recta en cada una, restar la tendencia, medir la fluctuación F(n); α es la inclinación de log F frente a log n. α₁ sobre 4–16 latidos y α₂ sobre 16–64. α = 0,5 sin correlación (ruido blanco), α = 1 ruido 1/f, α = 1,5 ruido browniano. En la insuficiencia, α₁ más bajo y α₂ más alto | Peng, Havlin, Stanley y Goldberger, *Chaos* 5: 82 (1995), doi:10.1063/1.166141. Peng y Goldberger, en Harvard Medical School y Beth Israel Hospital, Boston; Stanley, Boston University; Havlin, Bar Ilan | Verificado en el texto completo. **Usaron su propia cohorte (12 sanos y 15 con insuficiencia), no estas bases**: la voz no lo mezcla |
| F3 | Valores de nsr018 y chf223; 54 y 29 personas; diferencias de grupo, edad y solapamiento; lo no controlado | Auditoría propia (`herramientas/auditoria_corazon.py`, `datos/auditoria_corazon.json`) | Dato propio |
| F5 | El ritmo cardíaco sano tiene correlaciones de tipo fractal en un rango amplio de escalas (α ≈ 1 sobre 10²–10⁴ latidos en sanos) | Peng y otros (1995), p. 84: «α=1.00±0.11»; medición propia: α sobre 16–1.000 latidos en nsr018 | Verificado · la voz habla de «estructura fractal en el tiempo» dentro de un rango |
| F6 | En el tejido cardíaco se observan ondas de excitación en espiral, ligadas a arritmias | Davidenko y otros, *Nature* 355: 349 (1992); Gray y otros, *Nature* 392: 75 (1998) | **Por verificar en los resúmenes** antes de grabar · la simulación usa el modelo de Barkley (1991), un medio excitable genérico, y se rotula como ilustrativa |
| F7 | 808 personas que sobrevivieron a un infarto; variabilidad = desviación estándar de los intervalos normales en 24 h; «The relative risk of mortality was 5.3 times higher in the group with HR variability of less than 50 ms than the group with HR variability of more than 100 ms» | Kleiger y otros, *Am J Cardiol* 59: 256 (1987), doi:10.1016/0002-9149(87)90795-8 | Verificado en el resumen |
| F8 | «…such loss of complexity leads to an impaired ability to adapt to physiologic stress» (planteado como hipótesis, sobre el envejecimiento) | Lipsitz y Goldberger, *JAMA* 267: 1806 (1992) | Verificado en el resumen · por eso la voz dice «parece» |
| F9 | La ecuación logística como modelo de poblaciones; punto fijo, duplicaciones de periodo y caos | May, *Nature* 261: 459 (1976) | **Verificando** |
| F10 | Copias en miniatura del diagrama dentro de las ventanas periódicas | Strogatz, *Nonlinear Dynamics and Chaos*; cálculo propio (r entre 3,841 y 3,857) | **Verificando** |
| F4 | Pérdida de multifractalidad en la insuficiencia: «We uncover a loss of multifractality for a life-threatening condition, congestive heart failure» | Ivanov y otros, *Nature* 399: 461 (1999), doi:10.1038/20924 | Verificado en el resumen |

## Decisiones tomadas en este guion

- **El día y la noche:** los registros no dicen a qué hora empiezan, así que la voz habla de «horas de actividad y de descanso» sin afirmar cuándo duerme la persona.
- **Los números de la voz** son los de las dos personas representativas. Los de grupo van en pantalla.
- **Las referencias 0,5, 1 y 1,5** se dicen como lo que da cada tipo de ritmo, sin decir que el valor 1 «es la salud».
- **Personas nombradas:** Peng (retrato de Commons, CC BY-SA 4.0) e Ivanov (retrato institucional de la Universidad de Boston, con crédito).
