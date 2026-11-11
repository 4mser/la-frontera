# LA FRONTERA · Capítulo VII · Del patrón a la herramienta

**Guion v1 · 24 oct 2026 · para producción.** Escrito sobre la arquitectura v3 congelada (`ARQUITECTURA-v3-congelable.md`, sección VII). Sigue lo aprendido en los Caps. V y VI: una pregunta al comienzo, una conclusión clara, cada idea explicada con calma y en pantalla, retrato de toda persona nombrada y poco Mandelbrot.

**Duración objetivo:** unos 5:30. La arquitectura asigna 6:30. Los materiales porosos (Katz y Thompson, 1985) quedan fuera, porque la arquitectura los mantiene solo si tienen una función narrativa clara y su rango de escalas no se pudo verificar en la primaria.

**Pregunta:** ¿qué pasa cuando dejamos de mirar los fractales y empezamos a usarlos?

**Estructura de cada movimiento (arquitectura):** problema → aporte de la geometría → resultado verificable → límite. El nivel de madurez va rotulado: **APLICACIÓN COMERCIAL**, **HERRAMIENTA DE INVESTIGACIÓN**.

**Lo que el espectador ya trae:**
- el triángulo y la autosemejanza (Cap. I);
- la frontera España–Portugal y su D ≈ 1,12 medida (Cap. III);
- los vasos de la retina (Caps. III–IV) y la señal del corazón medida en el tiempo (Cap. V);
- la idea de rango (Caps. III y V).

---

## 0 · Título (0:00 – 0:14)

- **IMAGEN:** un triángulo de Sierpiński se construye en líneas de cobre, iteración por iteración. En el golpe, el título completo, como en los Caps. II y VI: **DEL PATRÓN A LA HERRAMIENTA**, con **CAPÍTULO VII** arriba.

## 1 · La pregunta (0:14 – 0:35)

> **VOZ:** Hasta aquí hemos mirado fractales: en la matemática, en la naturaleza, en el ritmo de un corazón. ¿Qué pasa cuando dejamos de mirarlos y empezamos a usarlos?

- **IMAGEN:** tres tarjetas, una tras otra: **DISEÑAR · UNA ANTENA**, **REPRESENTAR · UN PAISAJE**, **MEDIR · UNA RETINA**.

## 2 · Diseñar: una antena (0:35 – 2:15) · APLICACIÓN COMERCIAL

- **IMAGEN:** una onda de radio que llega a una varilla: la varilla vibra mejor con la onda de su tamaño.

> **VOZ:** Una antena funciona mejor con las ondas que tienen un tamaño parecido al suyo. Un teléfono necesita hablar en muchas bandas a la vez, pero dentro de él casi no hay espacio. [F1]

- **IMAGEN:** un edificio de departamentos, esquemático, de noche; en el piso 27, una pequeña antena de papel de aluminio pegada a la baranda.

> **VOZ:** A fines de los años ochenta, un radioaficionado de Boston no podía instalar antenas en su edificio. Así que fabricó una pequeña, de papel de aluminio, con forma fractal, y la pegó a su balcón. Funcionó, hasta que el dueño del edificio la cortó. [F2]

- **IMAGEN:** retrato de **CARLES PUENTE** (crédito institucional). El triángulo de Sierpiński en cobre, con sus cinco escalas resaltadas: **10,9 · 5,45 · 2,72 · 1,36 · 0,68 CM**.

> **VOZ:** En mil novecientos noventa y seis, Carles Puente y su equipo, en Barcelona, construyeron una antena con la forma del triángulo de Sierpiński. El mismo triángulo aparece a cinco escalas, cada una la mitad de la anterior. [F3]

- **IMAGEN:** a la derecha, un gráfico de las bandas en que la antena funciona: cinco valles, cada uno debajo de su escala. Rótulos: **12,6 · 6,4 · 3,3 · 1,62 GHZ** y la quinta, **0,64**, desplazada.

> **VOZ:** Y la antena funcionó en cinco bandas, separadas por el mismo factor dos. Cada escala del triángulo sintoniza una frecuencia. La autosemejanza de la forma se convierte en autosemejanza del comportamiento. [F3]

> **VOZ:** Durante años, antenas con formas de este tipo fueron las más comunes en los teléfonos inteligentes. [F4]

- **IMAGEN:** la quinta banda, marcada: **NO CAE DONDE DEBERÍA: EL TRIÁNGULO REAL TERMINA**.

> **VOZ:** Pero la quinta banda no cayó exactamente donde debía. Los autores lo atribuyen a que el triángulo real se corta: tiene cinco escalas, no infinitas. Funciona en su rango. [F3]

## 3 · Representar: un paisaje (2:15 – 3:40) · APLICACIÓN COMERCIAL

- **IMAGEN:** un segmento horizontal de luz.

> **VOZ:** Dibujar una montaña punto por punto es imposible. En mil novecientos ochenta, Loren Carpenter mostró en un congreso una película con montañas generadas por computadora, hechas con una regla muy simple. [F5]

- **IMAGEN:** retrato de **LOREN CARPENTER** (CC BY-SA 4.0). Luego la regla en vivo:
  - se toma el punto medio del segmento y se mueve hacia arriba o hacia abajo al azar;
  - cada mitad se divide otra vez, con un movimiento más pequeño;
  - con cada paso aparece una cordillera, y detrás otras más tenues, como en la niebla.

> **VOZ:** Se toma el punto medio de una línea y se mueve un poco al azar. Luego se repite en cada mitad, con movimientos cada vez más pequeños. Con unas pocas reglas, aparece una cordillera. [F6]

> **VOZ:** Dos años después, esa misma técnica dibujó el planeta de la secuencia Génesis en una película de Star Trek, una de las primeras imágenes generadas por computadora en el cine. [F5]

- **IMAGEN:** a la izquierda, la frontera real España–Portugal (Cap. III). A la derecha, una frontera inventada con la misma regla, ajustada a su rugosidad medida, D ≈ 1,12. Se parecen.

> **VOZ:** La misma regla puede inventar una frontera con la rugosidad que medimos en la de España y Portugal. No es la frontera real, pero tiene su forma de ser irregular.

> **VOZ:** El detalle, en cambio, se acaba en el píxel. Y no todo lo que se genera así en los videojuegos y el cine es fractal: muchas técnicas solo lo imitan en unas pocas escalas.

## 4 · Medir: una retina (3:40 – 5:00) · HERRAMIENTA DE INVESTIGACIÓN

- **IMAGEN:** la foto real del fondo de ojo (crédito: OptometrusPrime, CC BY-SA 2.0).

> **VOZ:** En el capítulo del corazón medimos una señal en el tiempo. Aquí la pregunta es otra: ¿puede la forma de los vasos de un ojo decir algo sobre la salud?

- **IMAGEN, paso a paso, con rótulos:**
  1. **EL CANAL VERDE**, donde los vasos contrastan más;
  2. **LO QUE ES MÁS OSCURO QUE SU ENTORNO**: los vasos se encienden;
  3. **EL MAPA DE LOS VASOS**;
  4. **CAJAS DE 64, 32 Y 16 PÍXELES** sobre el mapa;
  5. el número: **D ≈ 1,31 · MÉTODO PROPIO SIMPLE**.

> **VOZ:** Una fotografía del fondo del ojo se convierte en un mapa de sus vasos, y el mapa, en un número: su dimensión, contada con cajas como las del capítulo de las ramas.

> **VOZ:** Una revisión de catorce estudios, publicada en dos mil veinticinco, encontró que una dimensión más baja se asocia con más riesgo cardiovascular, sobre todo en las arterias pequeñas. [F7]

> **VOZ:** Pero cada estudio mide de una manera distinta, el número cambia con el método, y una asociación en grupos no es un diagnóstico. Por ahora es una herramienta de investigación. [F7]

## 5 · Cierre (5:00 – 5:35)

- **IMAGEN:** las tres herramientas en fila, cada una con una barra que muestra su rango: **LA ANTENA · 5 BANDAS**, **EL PAISAJE · HASTA EL PÍXEL**, **LA RETINA · HASTA SU RESOLUCIÓN**.

> **VOZ:** Ninguna de estas herramientas usa un fractal infinito. La antena funciona en sus bandas, el paisaje hasta su píxel, la retina hasta la resolución de la foto.

> **VOZ:** Usar un fractal es saber en qué rango de escalas describe al mundo. Fuera de ese rango, deja de servir.

- **IMAGEN:** la cámara se aleja de la retina, cada vez más, hasta un cielo de galaxias.

> **VOZ:** ¿Y el rango más grande de todos? ¿Hasta dónde llega la estructura del universo?

- **Corte al Capítulo VIII.**

---

## Fuentes

| # | Afirmación | Fuente | Estado |
|---|---|---|---|
| F1 | Una antena resuena con longitudes de onda comparables a su tamaño; los teléfonos necesitan varias bandas en poco espacio | Principio general de antenas; Puente y otros (1996), introducción | Verificado (general) |
| F2 | Cohen, Boston, piso 27, contrato que prohibía antenas; antena fractal de papel de aluminio con motivo de pagoda en la baranda; el dueño la cortó | Cohen, *Communications Quarterly* 5: 7 (1995), recuadro «The First Fractal Antenna»; ETHW, «Fractal Antennas»; IEEE History | Verificado · sin nombre en la voz (no hay retrato identificable con licencia) · «fines de los ochenta»: según su relato, un año después de oír a Mandelbrot en 1987 |
| F3 | Antena de Sierpiński: cinco escalas con factor dos (10,9 · 5,45 · 2,72 · 1,36 · 0,68 cm); cinco bandas: 12,6 · 6,4 · 3,3 · 1,62 · 0,64 GHz; «spaced by a log-period of two»; la banda más baja desplazada (0,64 en vez de 0,81 GHz) por «the truncation of the fractal shape» | Puente, Romeu, Pous, García y Benítez, *Electronics Letters* 32: 1 (1996), doi:10.1049/el:19960033 | Verificado en el texto completo |
| F4 | «For many years, those were the dominant type of antenna found in smartphones» | Nordrum, *IEEE Spectrum* (14 mar 2017) | Verificado (secundaria institucional) |
| F5 | *Vol Libre*, SIGGRAPH 1980; Carpenter hizo las montañas fractales de la secuencia Génesis de *Star Trek II* (Lucasfilm, 1982) | Fournier, Fussell y Carpenter, *Commun. ACM* 25: 371 (1982), ref. 4; Alvy Ray Smith, «Genesis Demo» | Verificado · «una de las primeras» en vez de «la primera» |
| F6 | Subdivisión con desplazamiento del punto medio | Fournier, Fussell y Carpenter (1982) | Verificado en el texto |
| F7 | 14 estudios (8 de cohortes, 6 transversales); «The decreased retinal microvascular FD was significantly associated with the CVD risk, especially in retinal arteriole»; heterogeneidad de medición (cuatro sistemas); no establece causalidad | Lian y otros, *BMC Ophthalmology* 25: 668 (2025), doi:10.1186/s12886-025-04492-z | Verificado · el estudio de 2011 (Liew y otros) halló una relación en U: por eso se cita la revisión y se dice «se asocia» |
| F8 | D ≈ 1,31 de esta retina | Medición propia (`herramientas/retina_cap7.py`), método simple | Dato propio · se dice que depende del método |

---

## Añadido (7 nov 2026) · 4b · Medir: el cáncer (se monta después de la retina, antes del cierre)

- **IMAGEN:** simulación propia. A la izquierda, un árbol de vasos ordenado (**ARTERIAS Y VENAS SANAS · D ≈ 1,7**); a la derecha, una red torcida y desordenada, con huecos sin riego (**VASOS DE UN TUMOR · D ≈ 1,9**). Luego, contornos de células: lisos y rugosos.

> **VOZ:** La misma pregunta se hace en la investigación del cáncer. Los vasos que alimentan un tumor crecen de prisa y sin orden: se tuercen, se ramifican al azar y dejan zonas sin riego. [F9]

> **VOZ:** Medida con cajas, su dimensión fractal resulta más alta que la de las arterias y venas sanas. Algo parecido ocurre con el contorno de las células en una biopsia: cuanto más irregular, más alta su dimensión. [F9, F10]

> **VOZ:** Se estudia como ayuda para detectar antes y para anticipar cómo evolucionará la enfermedad. Igual que con la retina, es una herramienta en estudio, que acompaña el juicio de los especialistas. [F10]

| # | Afirmación | Fuente | Estado |
|---|---|---|---|
| F9 | Vasos de tumores (en ratones) con dimensión fractal ≈ 1,89 frente a ≈ 1,70 de arterias y venas normales (capilares normales ≈ 2); vasos más tortuosos y distribución más desordenada | Baish y Jain, «Fractals and cancer», *Cancer Research* 60: 3683 (2000) | Verificado en fuentes secundarias · se dice «arterias y venas» porque los capilares sanos llegan a 2 |
| F10 | La dimensión fractal del contorno celular y de la arquitectura del tejido se estudia como marcador diagnóstico y pronóstico en histopatología | Revisiones de análisis fractal en patología (p. ej., Baish y Jain 2000; literatura posterior) | Se dice «se estudia» y «herramienta en estudio» |
