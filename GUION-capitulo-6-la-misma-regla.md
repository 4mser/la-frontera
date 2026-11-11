# LA FRONTERA · Capítulo VI · La misma regla, en el tiempo

**Guion v2 · 24 oct 2026 · para producción.** v2: el cierre con partículas que dibujan el atractor y una conclusión explícita. Escrito sobre la arquitectura v3 congelada (`ARQUITECTURA-v3-congelable.md`, sección VI y especificación 2.2). Toma en cuenta lo aprendido con el Cap. V:
- el capítulo tiene **una pregunta al comienzo y una conclusión clara**;
- cada idea se explica con calma, y lo que se ve en pantalla siempre se dice;
- toda persona nombrada aparece con su retrato;
- el Mandelbrot aparece **una sola vez**, en el momento de la revelación, y con sentido.

**Duración objetivo:** unos 5:00.

**Pregunta:** ¿cómo puede algo obedecer leyes exactas y aun así ser impredecible?

**Lo que el espectador ya trae:**
- Richardson y su sueño de calcular el tiempo atmosférico (Cap. III);
- el conjunto de Mandelbrot como mapa de las constantes c de z² + c (Cap. II);
- la ecuación logística y su diagrama de bifurcación: orden, duplicaciones, caos y una copia en miniatura dentro del caos (final del Cap. V).

**Lo que este capítulo agrega, cuatro ideas y solo cuatro:**
1. Lorenz: un modelo atmosférico simple amplifica diferencias mínimas;
2. determinista no significa predecible;
3. **la logística es z² + c sobre la recta real**: el diagrama de bifurcación se encaja debajo del Mandelbrot;
4. la universalidad de Feigenbaum: 4,669 en la matemática, y un valor parecido medido en un experimento real.

**Cuidado (arquitectura):** no decir «el caos es fractal»; no extrapolar Lorenz al clima en general.

---

## 0 · Título (0:00 – 0:14)

- **IMAGEN:** abre donde terminó el Cap. V: el diagrama de bifurcación, tenue. Una sola órbita lo recorre como un punto que salta. En el golpe: **LA MISMA REGLA, EN EL TIEMPO**, con **CAPÍTULO VI** arriba.

## 1 · El sueño de Richardson (0:14 – 0:55)

- **IMAGEN:** el retrato de Richardson (Cap. III) vuelve, y detrás su cuadrícula sobre Europa.

> **VOZ:** ¿Cómo puede algo obedecer leyes exactas y aun así ser impredecible?

> **VOZ:** Richardson soñaba con calcular el tiempo atmosférico resolviendo sus ecuaciones. Si se conocen las leyes y el estado de hoy, pensaba, el de mañana debería poder calcularse.

> **VOZ:** Cuarenta años después, otro meteorólogo descubrió por qué ese sueño tiene un límite.

## 2 · Lorenz y la diferencia mínima (0:55 – 2:00)

- **IMAGEN:** retrato de **EDWARD N. LORENZ**. Rótulo: **MIT · 1961**.

> **VOZ:** Edward Lorenz simulaba un modelo del tiempo atmosférico en su primera computadora. Un día quiso repetir un cálculo, y lo reinició desde la mitad, copiando una línea de números de una impresión. [F1]

- **IMAGEN:** dos líneas de pronóstico superpuestas, idénticas. Rótulos: **0,506127** y **0,506**, con la nota **EL EJEMPLO QUE SUELE CONTARSE: UN NÚMERO REDONDEADO A TRES DECIMALES**.

> **VOZ:** Fue por un café y volvió una hora después. Lo que no sabía era que la impresión mostraba solo tres decimales: los números que copió estaban redondeados. [F1]

- **IMAGEN:** las dos líneas se separan lentamente y luego por completo.

> **VOZ:** Al principio, los nuevos valores repetían los anteriores. Pero la diferencia se duplicaba cada pocos días simulados, y en el segundo mes los dos pronósticos ya no se parecían en nada. [F1]

- **IMAGEN:** el sistema de Lorenz de 1963, proyectado en el plano: la figura de las dos alas. Dos puntos que empiezan casi juntos recorren las alas y se separan.

> **VOZ:** En mil novecientos sesenta y tres publicó un sistema de solo tres ecuaciones con ese mismo comportamiento: soluciones que nunca se repiten, y estados casi iguales que terminan siendo muy distintos. [F2]

## 3 · Determinista no es predecible (2:00 – 2:40)

- **IMAGEN:** la ecuación logística del Cap. V. Dos poblaciones que empiezan en 0,400000 y 0,400001. Con r = 3,2 siguen juntas; con r = 3,9 se separan antes de 30 años.

> **VOZ:** Lo mismo ocurre con la regla del capítulo anterior. Dos poblaciones que empiezan con una diferencia de una millonésima siguen iguales cuando la regla está en orden.

> **VOZ:** En la zona del caos, en cambio, se separan antes de treinta años. No hay azar en ninguna parte. La regla es exacta, pero cualquier error en el punto de partida, por pequeño que sea, termina creciendo.

## 4 · La misma regla (2:40 – 4:00)

- **IMAGEN:** el diagrama de bifurcación completo. Arriba, aparece el conjunto de Mandelbrot, quieto, con su eje real marcado.

> **VOZ:** Pero esta regla esconde algo más. Si se cambian las variables de la manera correcta, la ecuación de las poblaciones se convierte exactamente en z al cuadrado más c. [F3]

- **IMAGEN, el momento:**
  - En pantalla, la transformación: **c = r/2 − r²/4** y **z = r · (½ − x)**.
  - El eje horizontal del diagrama se deforma y el vertical se reescala columna por columna, hasta que el diagrama queda encajado **debajo** del eje real del Mandelbrot.
  - Líneas verticales unen cada cambio: la primera duplicación con el cuello del bulbo grande; la segunda con el bulbo siguiente; la ventana de período 3 con la copia en −1,75.
  - Rótulo: **ARRIBA: EL MAPA DE LAS CONSTANTES · ABAJO: DÓNDE VIVE LA ÓRBITA**.

> **VOZ:** El diagrama de las poblaciones es la misma regla del conjunto de Mandelbrot, recorrida sobre una sola línea. Cada duplicación ocurre justo donde la línea cruza a un nuevo bulbo del conjunto. [F3]

> **VOZ:** Y la copia en miniatura que encontramos dentro del caos está exactamente debajo de una copia del Mandelbrot. Una regla en el tiempo y una forma en el plano son la misma cosa vista de dos maneras. [F3]

## 5 · Un número que se repite (4:00 – 4:50)

- **IMAGEN:** retrato de **MITCHELL FEIGENBAUM**. Las duplicaciones del diagrama, cada vez más juntas, con sus distancias medidas.

> **VOZ:** En mil novecientos setenta y ocho, Mitchell Feigenbaum midió cuánto se acercan las duplicaciones entre sí. Cada tramo es unas cuatro coma seis siete veces más corto que el anterior. [F4]

> **VOZ:** Y descubrió que ese mismo número aparece en muchas otras reglas distintas, siempre que tengan una sola joroba, como esta. [F4]

- **IMAGEN:** un experimento de convección (redibujado, esquemático): una pequeña caja de mercurio calentada desde abajo, con sus rollos. Rótulo: **EXPERIMENTO CON MERCURIO · 1982 · δ = 4,4 ± 0,1**. (Sin nombres: no hay retrato con licencia del autor principal.)

> **VOZ:** Años después, un equipo de físicos calentó mercurio en una pequeña caja y vio aparecer las mismas duplicaciones. Midieron cuatro coma cuatro, muy cerca del número de la matemática. [F5]

## 6 · Cierre (v2: las partículas dibujan la forma; la conclusión)

- **IMAGEN:** negro. Sin la mariposa de fondo. Una bola diminuta de 4.000 puntos de luz, todos casi en el mismo lugar, avanza junta dejando estelas. Poco a poco se estira, se separa, se dispersa… y los puntos, sin repetirse nunca, van dibujando las dos alas. Al final la forma completa brilla, hecha solo de puntos en movimiento; la cámara se aleja lentamente.

> **VOZ:** Saber la regla no es saber el resultado. Cuatro mil puntos que empiezan casi juntos terminan, en pocos segundos, en lugares que nadie podría anticipar.

> **VOZ:** Pero mira lo que hacen juntos. Ninguno se repite, y aun así todos dibujan la misma forma. El caos tiene geometría: un orden que no se deja predecir, pero sí se deja ver.

> **VOZ:** Lorenz, las poblaciones y el conjunto de Mandelbrot cuentan lo mismo: una regla exacta puede producir sorpresas, y esas sorpresas tienen forma.

- **IMAGEN:** rótulo final, sobre la forma: **SABER LA REGLA NO ES SABER EL RESULTADO · PERO EL CAOS TIENE FORMA**.

> **VOZ:** Y aun sin poder predecirlo todo, ¿podemos usar esta geometría para algo?

- **Corte al Capítulo VII.**

---

## Fuentes

| # | Afirmación | Fuente | Estado |
|---|---|---|---|
| F1 | Lorenz repitió un cálculo tecleando una línea de números impresa antes; fue por un café y volvió una hora después; los valores primero repetían los anteriores; las diferencias se duplicaban cada cuatro días o así y en el segundo mes no quedaba parecido; los números impresos estaban redondeados (a tres decimales). Computadora: Royal McBee LGP-30, su primera. Año: 1961. Los dígitos 0,506127 y 0,506 son la versión divulgada | Lorenz, *The Essence of Chaos* (1993), p. 134, citado en Motter y Campbell, *Physics Today* (2013), arXiv:1306.5777; MIT Technology Review (2011) para el año y los dígitos | Verificado · los dígitos van rotulados como «el ejemplo que suele contarse» |
| F2 | «…slightly differing initial states can evolve into considerably different states»; «A simple system representing cellular convection is solved numerically» | Lorenz, *J. Atmos. Sci.* 20: 130 (1963), doi:10.1175/1520-0469(1963)020<0130:DNF>2.0.CO;2 | Verificado en el resumen |
| F3 | x' = r·x·(1 − x) es z' = z² + c con z = r(½ − x), c = r/2 − r²/4; correspondencias de r y c | Especificación 2.2 de la arquitectura (comprobada numéricamente) | Verificado [M] |
| F4 | «λ∞ − λn ∼ δ^−n (δ = 4.669201609103... for z = 2)» | Feigenbaum, *J. Stat. Phys.* 19: 25 (1978), doi:10.1007/BF01020332 | Verificado en el resumen · «una sola joroba» = máximo cuadrático (z = 2) |
| F5 | «The measured Feigenbaum number is δ = 4.4»; «δ = (R8 − R4)/(R16 − R8) = 4.4 ± 0.1» | Libchaber, Laroche y Fauve, *J. Physique Lett.* 43: L211 (1982), en mercurio | Verificado en el texto · el valor en helio no se usa |
