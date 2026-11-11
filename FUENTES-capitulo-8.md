# Fuentes del capítulo VIII: «¿Hasta dónde llega la estructura?»

Verificación hecha el 24 de octubre de 2026 leyendo los artículos originales (PDF de Frontiers, PDF y fuente LaTeX de arXiv) y las páginas de licencia de cada archivo. Las citas van en el idioma original, copiadas del texto. Todo lo que no se pudo comprobar está marcado como **NO VERIFICADO**.

Material descargado:

- `animatic/public/p8/vazza_feletti_2020_fig1.jpg`, `fig2.jpg` y `fig3.jpg`: figuras del artículo de Vazza y Feletti, a la resolución original del PDF.
- `animatic/public/p8/wigglez_d2.json`: datos D2(r) de WiggleZ.
- `animatic/public/p8/real/`: fotos, videos y mapas con licencia verificada (ver la sección 5).

---

## 1. Vazza y Feletti (2020): red neuronal y red cósmica

**Referencia:** Vazza F. y Feletti A. (2020). «The Quantitative Comparison Between the Neuronal Network and the Cosmic Web». *Frontiers in Physics* 8:525731. Brief Research Report, publicado el 16 de noviembre de 2020. DOI: [10.3389/fphy.2020.525731](https://doi.org/10.3389/fphy.2020.525731)

**Autores:** F. Vazza (Universidad de Bolonia, Hamburger Sternwarte e INAF) y A. Feletti (Instituto de Neurocirugía de la Universidad de Verona, Azienda Ospedaliera-Universitaria di Modena).

| Afirmación | Cita exacta | Ubicación | Estado |
|---|---|---|---|
| Comparan muestras reales de cerebelo y corteza con una simulación cosmológica | «We analyzed several independent samples of cerebral and of cerebellar human cortex were formalin-fixed and paraffin-embedded [8], sampling slices of depth 4 μm, with magnification factors of 4×, 10× and 40×.» | Materiales y métodos, 2.1 | VERIFICADO |
| Las muestras se obtuvieron durante cirugías | «Small samples of the human cerebral and cerebellar cortex were harvested during corticectomy to approach subcortical tumors» | 2.3 | VERIFICADO |
| Usan un solo marcador | «Neurofilaments were labeled using the Neurofilament (2F11) Mouse Monoclonal Antibody» | 2.1 | VERIFICADO |
| La simulación es un cubo de 100 Mpc de lado | «a high-resolution (2400³ cells and dark matter particles) simulation of a cubic 100³ Mpc³ cosmic volume […] performed with the grid code ENZO» | 2.2 | VERIFICADO |
| Usan 12 cortes del cubo, de 25 Mpc de grosor cada uno | «we produced 12 different thin slices (with thickness 25 Mpc) from the simulated volume» | 2.2 | VERIFICADO |
| Número de neuronas del cerebro: **86 000 millones** (no 69 000 millones) | «the adult human brain contains Nneu ≈ 8.6 ± 0.8 · 10¹⁰ neurons in total» | Resultados, 3.1 | VERIFICADO |
| Los **69 000 millones** son las neuronas del cerebelo | «the cerebellum has about ∼ 6.9 · 10¹⁰ neurons ( ∼ 80% of brain neurons)» | 3.1 | VERIFICADO |
| Galaxias del universo observable: **2,6 billones** (no 100 000 millones) | «a total of Ng ∼ 2.6 · 10¹² galaxies may be present in within the sphere of the observable Universe [12], with up to ∼ 5 · 10¹⁰ galaxies with masses equal or larger to the one of the Milky Way» | 3.1 (cita a Conselice et al. 2016) | VERIFICADO |
| Las dos redes tienen del orden de 10¹⁰ a 10¹¹ nodos | «the two systems are organized in well defined networks, with ∼ 10¹⁰ − 10¹¹ nodes interconnected through filaments (if we consider as nodes all galaxies with masses comparable or larger to that of the Milky Way […])» | 3.1 | VERIFICADO |
| En ambos sistemas, cerca del 75 % es material «pasivo» | «in both cases ∼ 75% of the mass/energy distribution is made of an apparently passive material […] water in the case of the brain, and dark energy in cosmology» | 3.1 | VERIFICADO |
| A gran escala no se parecen | «Especially on large scales, the various samples do not show any spectacular degree of similarity.» | 3.2 | VERIFICADO |
| El parecido aparece solo con 40 aumentos | «At the highest magnification achieved in our brain slices, however, the refined network of neuronal bodies and of filaments start presenting some similarity with the cosmic web on ≤ 20 Mpc scales.» | 3.2 | VERIFICADO |
| La escala horizontal del espectro se elige después | «power spectra are free to be slid horizontally in the plot, in the sense that the reference scale L related to k = 1 is decided a-posteriori» | 3.3 | VERIFICADO |
| Escalas equivalentes: 1,6 mm del cerebro contra 100 Mpc del cosmos | «we adjusted the horizontal scale so that k = 1 corresponds to L = 1.6 mm in brain samples, and to L = 100 Mpc in the cosmic web. This corresponds to a scaling ratio of 1.875 · 10²⁷ between the two systems.» | 3.3 | VERIFICADO |
| **Resultado espectral:** el cerebelo entre 0,01 y 1,6 mm se parece a la red cósmica entre 1 y 100 Mpc, a lo largo de unas dos décadas de escala | «We find a large agreement across nearly ∼ 2 decades in spatial scales. The similarity between the cerebellum on 0.01 − 1.6 mm scales and the dark matter distribution of the cosmic web on 1 − 10² Mpc scales is remarkable.» | 3.3 | VERIFICADO |
| Por encima de 1 a 2 mm el espectro del cerebro difiere | «the fluctuations measured on ≥ 1 − 2 mm scales in brain samples present a steeper spectral shape than in cosmic web spectra» | 3.3 | VERIFICADO |
| No hay una ley de potencia única, como tendría un fractal simple | «In all cases we measure broken power laws, unlike what is expected for (simpler) fractal distributions» | 3.3 | VERIFICADO (útil para la tesis del capítulo) |
| Como control, nubes, ramas de árboles y turbulencia dan espectros distintos | «such systems display a more regular power-law spectral behavior, clearly at variance with what found in the main networks» | 3.3 | VERIFICADO |
| Un espectro parecido no implica una forma parecida | «power spectra are blind to phase correlations in the continuous field, hence two morphologically different distributions can still produce similar spectra» | 3.3 | VERIFICADO |
| Conexiones por proximidad, con una distancia de enlace elegida a mano | «The choice of llink is arbitrary […] We thus focused on one specific choice for the linking length […] llink = 1.2 Mpc […] we thus consistently rescaled the linking length in 40× brain samples to llink = 16 μm.» | 3.4 | VERIFICADO |
| **Grado medio de conexión.** Red cósmica: 3,8 a 4,1 conexiones por nodo, con 3800 a 4700 nodos. Cerebelo: 1,9 a 3,7. Corteza: 4,6 a 5,4, con 1800 a 2000 nodos | «N ∼ 3800 − 4700 nodes in our cosmic web slices, with an average number of 〈k〉 ∼ 3.8 − 4.1 connections per node. For the cerebellum slices we measured 〈k〉 ∼ 1.9 − 3.7, while for the cortex we measured 〈k〉 ∼ 4.6 − 5.4 for the N ∼ 1800 − 2000 identified nodes.» | 3.4 | VERIFICADO |
| **Coeficiente de agrupamiento:** coincide. Todas las redes tienen picos entre 0,1 y 0,4 | «all measured distributions of C measure a few different peaks in the C ∼ 0.1 − 0.4 range, clearly indicating that all networks are highly correlated» | 3.4 | VERIFICADO |
| **Centralidad de grado:** coincide solo en parte. Ambas superan a una red aleatoria, pero la red cósmica tiene picos más bajos que el cerebro | «The networks also have values of degree centrality clearly much larger (by three to four orders of magnitude) than corresponding random networks. In the cosmic network, the distributions of Cd are approximately Poissonian […] even if the peaks of the distribution are at lower values than the brain samples.» | 3.4 | VERIFICADO |
| La conectividad neuronal de largo alcance queda fuera | «while proximity can accurately describe the cosmic web, neural webs are based on connections and therefore our analysis is not sensitive to long-range connectivity. But indeed long-range connectivity is known to be a crucial feature of neural webs.» | 3.4 | VERIFICADO |
| No miden la conectividad neuronal real | «our procedure does not consider the true neural connectivity but an approximation of it, based on simple proximity» | Resumen | VERIFICADO |
| Los autores lo llaman un trabajo «exploratorio». La expresión *pilot study* no aparece en el artículo | «a full scan of network parameters as a function of llink is beyond the goals of this first exploratory work» | 3.4 | VERIFICADO («pilot study»: NO APARECE) |
| Limitaciones declaradas por los autores | «We are aware that this approach has several limitations. First, our comparison focused on density of matter. […] Our results should be further validated with different markers […] Second, we assumed that the highest stain density is located at the level of neuronal Soma, which is an approximation, leading to a non-standard definition of nodes. […] Third, our study has been based on histological slices, which can obviously show only a tiny portion of the brain network itself.» | Discusión | VERIFICADO |
| La diferencia de escala entre ambos sistemas es de unos 10²⁷ | «despite the dramatic disparity in spatial scales (i.e., ∼ 10²⁷) of these two systems» | Discusión | VERIFICADO |
| Comparan la memoria del cerebro (unos 2,5 PB) con la información de la red cósmica (unos 4,3 PB), y ellos mismos advierten que podría ser una coincidencia | «Such close agreement may appear as a mere coincidence, considering that, given ambiguities in defining both networks, particularly the cosmic web, these numbers are known only approximately.» | Discusión | VERIFICADO |
| Conclusión prudente | «our findings hint at the fact that similar network configurations can emerge from the interaction of entirely different physical processes» | Discusión | VERIFICADO |

**Licencia del artículo y de sus figuras:** «Copyright © 2020 Vazza and Feletti. This is an open-access article distributed under the terms of the Creative Commons Attribution License (CC BY). The use, distribution or reproduction in other forums is permitted, provided the original author(s) and the copyright owner(s) are credited and that the original publication in this journal is cited». La página del artículo enlaza a [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). **Las figuras se pueden reutilizar en el video con crédito**, por ejemplo: «Vazza & Feletti (2020), *Front. Phys.* 8:525731, CC BY 4.0». La Figura 1 es la que pone lado a lado los cortes de cerebelo y corteza y la red cósmica simulada, a 4×, 10× y 40×. Los cortes histológicos los preparó Elena Zunarelli, según los agradecimientos del artículo, pero los titulares del copyright son los dos autores.

Aviso: la imagen de colores que circuló en la prensa en 2020 (una neurona junto a la red cósmica) viene del comunicado de la Universidad de Bolonia y no es una figura del artículo. Su licencia **NO VERIFICADA**. No la usamos.

---

## 2. Scrimgeour et al. (2012): WiggleZ y la transición a la homogeneidad

**Referencia:** Scrimgeour M. I., Davis T., Blake C. et al. (2012). «The WiggleZ Dark Energy Survey: the transition to large-scale cosmic homogeneity». *MNRAS* 425, 116–134. DOI: [10.1111/j.1365-2966.2012.21402.x](https://doi.org/10.1111/j.1365-2966.2012.21402.x). arXiv: [1205.6812](https://arxiv.org/abs/1205.6812) (v2). Los datos bibliográficos se confirmaron en Crossref.

| Afirmación | Cita exacta | Ubicación | Estado |
|---|---|---|---|
| Más de 200 000 galaxias azules, en un volumen de alrededor de 1 Gpc³ | «a spectroscopic survey of over 200 000 blue galaxies in a cosmic volume of ∼ 1 h⁻³ Gpc³» | Resumen | VERIFICADO |
| Telescopio y cifras del censo | «a large-scale spectroscopic galaxy redshift survey conducted at the 3.9m Anglo-Australian Telescope, and was completed in January 2011. It maps a cosmic volume of ∼ 1 Gpc³ up to redshift z = 1, and has obtained 239 000 redshifts for UV-selected emission-line galaxies with a median redshift of zmed = 0.6. Of these, 179 599 are in regions contiguous enough to be used for our analysis. It covers ∼ 1000 deg² of equatorial sky in 7 regions» | Sección 2 | VERIFICADO |
| Rango de corrimiento al rojo del análisis | Cuatro tramos: «0.1 < z < 0.3, 0.3 < z < 0.5, 0.5 < z < 0.7 and 0.7 < z < 0.9». Galaxias por tramo (Tabla 2): 25 187, 45 698, 70 191 y 38 523 | Sección 2 | VERIFICADO |
| Espectrógrafo | «the AAOmega spectrograph, and the running of the AAT» | Agradecimientos | VERIFICADO |
| **D2 queda a menos del 1 % de 3** por encima de unos 70 a 80 Mpc/h | «The mean number of galaxies N(< r) in spheres of comoving radius r is proportional to r³ within 1 per cent, or equivalently the fractal dimension of the sample is within 1 per cent of D2 = 3, at radii larger than 71 ± 8 h⁻¹ Mpc at z ∼ 0.2, 70 ± 5 h⁻¹ Mpc at z ∼ 0.4, 81 ± 5 h⁻¹ Mpc at z ∼ 0.6, and 75 ± 4 h⁻¹ Mpc at z ∼ 0.8.» | Resumen | VERIFICADO |
| R_H = 71 ± 8 h⁻¹ Mpc. Ojo: es el valor del **tramo z ≈ 0,2** obtenido con el análisis de verosimilitud, no un valor de la muestra completa. Con el ajuste polinómico de la Tabla 4, ese tramo da 70 ± 7 | Tabla 4, columna «Likelihood analysis», D2(r), 0.1 < z < 0.3: «71 ± 8». Columna «WiggleZ data»: «70 ± 7» | Tabla 4 | VERIFICADO |
| **Fractal descartado (resumen)** | «We can exclude a fractal distribution with fractal dimension below D2 = 2.97 on scales from ∼ 80 h⁻¹ Mpc up to the largest scales probed by our measurement, ∼300 h⁻¹ Mpc, at 99.99 per cent confidence.» | Resumen | VERIFICADO |
| Fractal descartado (conclusiones). La redacción cambia: dice «up to», no «below» | «We can exclude a fractal with fractal dimension up to D2 = 2.97, on scales between ∼ 80h⁻¹ Mpc, and the largest scales probed by our measurement, ∼ 300h⁻¹ Mpc, at 99.99 per cent confidence.» | Sección 9 | VERIFICADO |
| La transición es gradual, sin un corte brusco | «we expect the Universe to have a gradual approach to large-scale homogeneity rather than a sudden transition» | Introducción | VERIFICADO |
| El propio artículo presenta el debate | «some researchers have found a transition from D2 < 3 to D2 = 3, at around 70 – 150 h⁻¹ Mpc (…) whereas other authors have found no such transition (Coleman & Pietronero 1992; Pietronero et al. 1997; Sylos Labini et al. 1998; …)» | Introducción | VERIFICADO |
| La definición de la escala de homogeneidad es, en parte, una convención | «Since there is only a gradual approach to homogeneity, such a definition may be arbitrary.» | Introducción | VERIFICADO (útil para la tesis: el umbral del 1 % lo eligen los autores) |
| Los resultados coinciden con el modelo ΛCDM | «Our N(< r) and D2(r) results show a very strong agreement with a FRW-based ΛCDM+WMAP model» | Conclusiones | VERIFICADO |

### Datos para redibujar la curva D2(r): `animatic/public/p8/wigglez_d2.json`

El artículo **no publica tabla numérica** de D2(r); los datos solo aparecen en la Figura 6. Los valores no se estimaron a ojo: se extrajeron de las **coordenadas vectoriales** del archivo original de la figura (`D2_fit_297title_new.eps`, PostScript generado con IDL e incluido en la fuente de arXiv). El archivo se leyó como texto y no se ejecutó.

- **Calibración.** Eje x logarítmico, con marcas en 10 y 100 h⁻¹ Mpc. Eje y logarítmico, con marcas de 2,4 a 3,1. Como control, la misma calibración aplicada a los marcadores rojos de R_H devuelve 70,6; 70,0; 81,1 y 74,9 h⁻¹ Mpc, que coinciden con la Tabla 4 (70 ± 7, 70 ± 5, 81 ± 4 y 74 ± 4).
- **Precisión.** Alrededor de ±0,001 en D2 y ±0,5 % en r.
- **Error.** `err` es la mitad de la barra de 1σ dibujada. Los extremos exactos de cada barra van en `d2_lo` y `d2_hi`.
- **Campos principales.** `r`, `d2` y `err` corresponden al tramo 0,1 < z < 0,3, el mismo del valor de R_H = 71 ± 8 que se cita. Los cuatro tramos completos están en `all_slices`.

Valores del tramo 0,1 < z < 0,3 (r en h⁻¹ Mpc):

| r | 12,6 | 15,8 | 20,0 | 25,1 | 31,6 | 39,8 | 50,1 | 63,1 | 79,4 | 100 | 126 | 158 | 200 | 251 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D2 | 2,589 | 2,657 | 2,725 | 2,789 | 2,853 | 2,897 | 2,935 | 2,963 | 2,979 | 2,987 | 2,994 | 3,001 | 3,007 | 3,001 |
| ± | 0,016 | 0,014 | 0,012 | 0,010 | 0,009 | 0,008 | 0,007 | 0,007 | 0,006 | 0,007 | 0,007 | 0,007 | 0,010 | 0,009 |

Los tramos 0,5 < z < 0,7 y 0,7 < z < 0,9 llegan hasta r ≈ 316 h⁻¹ Mpc.

---

## 3. La red cósmica observada

| Afirmación | Cita exacta | Fuente | Estado |
|---|---|---|---|
| Mapa del SDSS: cada punto es una galaxia | «Slices through the SDSS 3-dimensional map of the distribution of galaxies. Earth is at the center, and each point represents a galaxy, typically containing about 100 billion stars. […] The outer circle is at a distance of two billion light years. The region between the wedges was not mapped by the SDSS because dust in our own Galaxy obscures the view» | [SDSS-III, galería](https://www.sdss3.org/science/gallery_sdss_pie2.php). Crédito: M. Blanton y SDSS | VERIFICADO |
| 2dFGRS: 221 414 galaxias con corrimiento al rojo fiable | «The 2dF Galaxy Redshift Survey (2dFGRS) has obtained spectra for 245591 sources, mainly galaxies […] Reliable redshifts were measured for 221414 galaxies. […] cover an area of approximately 1500 square degrees» | Colless et al. 2003, «The 2dF Galaxy Redshift Survey: Final Data Release», [arXiv:astro-ph/0306581](https://arxiv.org/abs/astro-ph/0306581) | VERIFICADO |
| Vacíos de unos 15 Mpc/h de radio, que ocupan cerca del 40 % del volumen | «We use the voidfinder algorithm to identify a total of 289 voids in the 2dFGRS with radius larger than 10h⁻¹Mpc. These voids have an average effective radius of 14.89 ± 2.65 h⁻¹Mpc in the North Galactic Pole region (NGP) and 15.61 ± 2.84 h⁻¹Mpc in the South […] average density contrast of δρ/ρ = −0.94 ± 0.02 […] The total volume of the universe filled by these void regions is approximately 40%.» | Hoyle y Vogeley 2004, *ApJ* 607:751, [arXiv:astro-ph/0312533](https://arxiv.org/abs/astro-ph/0312533) | VERIFICADO |
| Gran Muralla Sloan: 1370 millones de años luz de largo | «Prominent in the map is a Sloan Great Wall of galaxies 1.37 billion light years long, 80% longer than the Great Wall discovered by Geller and Huchra and therefore the largest observed structure in the universe.» | Gott et al. 2005, «A Map of the Universe», *ApJ* 624:463, [arXiv:astro-ph/0310571](https://arxiv.org/abs/astro-ph/0310571) | VERIFICADO (era «la mayor» en 2005; hoy se conocen estructuras mayores, así que conviene no repetir esa parte) |
| Los filamentos miden decenas de megaparsecs | «Long filaments of ordinary and dark matter, with extension of several tens of Megaparsecs, connect clusters and groups of galaxies and are separated by mostly empty space» | Vazza y Feletti 2020, 3.1 | VERIFICADO (afirmación general de los autores, citando una revisión) |

---

## 4. El debate: ¿el universo es fractal a toda escala?

| Afirmación | Cita exacta | Fuente | Estado |
|---|---|---|---|
| Pietronero propone en 1987 una estructura fractal única, sin escala de homogeneidad | «The correct correlation analysis strongly supports the existence of a single fractal (self-similar) structure extending from the galaxy scale up to the present limits of observation. […] In addition the present observational data do not support the existence of a length-scale above which the distribution of matter becomes homogeneous.» | Pietronero L. (1987), «The fractal structure of the universe: Correlations of galaxies and clusters and the average mass density», *Physica A* 144(2–3):257–284. DOI: [10.1016/0378-4371(87)90191-9](https://doi.org/10.1016/0378-4371(87)90191-9). Resumen leído en [IDEAS/RePEc](https://ideas.repec.org/a/eee/phsmap/v144y1987i2p257-284.html); texto completo de pago | VERIFICADO (resumen) |
| Coleman y Pietronero publican en 1992 una revisión extensa con la misma tesis | Datos de Crossref: «The fractal structure of the universe», *Physics Reports* 213, 311–389, mayo de 1992. DOI: [10.1016/0370-1573(92)90112-D](https://doi.org/10.1016/0370-1573(92)90112-D). Resumen del artículo compañero, escrito por los mismos autores: «The reanalysis of galaxy and cluster distributions without any assumptions show long range (fractal) correlations up to the present observational limits without any tendency towards homogenization.» (*Physica A* 185, 1992, 45–55, [IDEAS](https://ideas.repec.org/a/eee/phsmap/v185y1992i1p45-55.html)) | Crossref; IDEAS | VERIFICADO (referencia y tesis). El resumen textual de *Physics Reports* está **NO VERIFICADO** |
| En 1996 el grupo sostiene una dimensión cercana a 2 hasta unos 1000 Mpc/h | «all the available data are consistent with each other and show fractal correlations (with dimension D ≃ 2) up to the deepest scales probed until now (1000 h⁻¹Mpc) […] The evidence for this being very strong up to 150 h⁻¹Mpc […] and progressively weaker (statistically) at larger distances due to the limited data.» | Pietronero, Montuori y Sylos Labini, «On the Fractal Structure of the Visible Universe», [arXiv:astro-ph/9611197](https://arxiv.org/abs/astro-ph/9611197) | VERIFICADO |
| WiggleZ (2012) incluye a estos autores entre quienes «no encontraron transición» | Ver la sección 2 | Scrimgeour et al. 2012 | VERIFICADO |
| Postura de Mandelbrot en *The Fractal Geometry of Nature* (1982/1983) sobre los cúmulos de galaxias: capítulo, dimensión que propone y cita textual | No se pudo leer el libro: el ejemplar de archive.org es de préstamo restringido y la página de Yale que lo resume no cargó por un certificado vencido | — | **NO VERIFICADO**. No atribuirle frases ni cifras sin revisar el libro |

Para presentar el debate con justicia: Pietronero y su grupo hicieron una crítica metodológica legítima. Señalaron que la función de correlación ξ(r) supone una densidad media bien definida, y WiggleZ reconoce ese riesgo en su sección de pruebas con fractales («assumes a homogeneous distribution outside the survey (e.g. Coleman & Pietronero 1992 …)»). Lo que zanjaron los censos grandes fue la cuestión empírica, con más volumen y pruebas sobre fractales sintéticos.

---

## 5. Material visual

Las licencias se comprobaron en la página de cada archivo: metadatos de Wikimedia Commons y wikitext de la plantilla de licencia, o la página de licencia de la institución. Las rutas son relativas a `animatic/public/p8/`.

| Archivo | Tema | Fuente | Licencia | Crédito |
|---|---|---|---|---|
| `vazza_feletti_2020_fig1.jpg` (1994×1379) | Cortes de cerebelo y corteza junto a la red cósmica simulada, a 4×, 10× y 40× | Figura 1, PDF de [doi:10.3389/fphy.2020.525731](https://doi.org/10.3389/fphy.2020.525731) | CC BY 4.0 | Vazza & Feletti (2020), Front. Phys. 8:525731, CC BY 4.0 |
| `vazza_feletti_2020_fig2.jpg` (1941×571) | Espectros de potencia P(k) | Figura 2, mismo artículo | CC BY 4.0 | Ídem |
| `vazza_feletti_2020_fig3.jpg` (1994×1244) | Redes reconstruidas, coeficiente de agrupamiento y centralidad de grado | Figura 3, mismo artículo | CC BY 4.0 | Ídem |
| `wigglez_d2.json` | Datos D2(r) | Figura 6 de Scrimgeour et al. 2012 | Datos factuales extraídos. Hay que redibujar la curva, no copiar la figura de MNRAS | «Datos: Scrimgeour et al. 2012, MNRAS 425, 116» |
| `real/sdss_mapa_galaxias_blanton.jpg` (892×887) | Mapa del SDSS en dos cuñas; cada punto es una galaxia | [sdss3.org](https://www.sdss3.org/science/gallery_sdss_pie2.php) y [sdss4.org/science/orangepie](https://www.sdss4.org/science/orangepie/) | CC BY. Política del SDSS: «We provide all images on a Creative Commons Attribution license (CC-BY)» ([Image Use Policy](https://www.sdss.org/collaboration/image-use-policy/)) | M. Blanton and the Sloan Digital Sky Survey |
| `real/2dfgrs_mapa_schaap.gif` (1074×683) | Reconstrucción 3D (DTFE) del 2dFGRS, con la Gran Muralla Sloan | [Commons](https://commons.wikimedia.org/wiki/File:2dfdtfe.gif) | CC BY-SA 3.0 | Willem Schaap. Ojo: la licencia SA exige compartir la obra derivada con la misma licencia |
| `real/aat_exterior.jpg` (5184×3456) | Cúpula del Telescopio Anglo-Australiano sobre el monte | [Commons](https://commons.wikimedia.org/wiki/File:Anglo_Australian_Telescope_-_panoramio.jpg) | CC BY 3.0 | Annette Teng |
| `real/aat_cupula.jpg` (2304×1728) | Cúpula del AAT | [Commons](https://commons.wikimedia.org/wiki/File:Anglo-Australian_Telescope_dome.JPG) | CC BY-SA 3.0 | Diceman Stephen West |
| `real/aat_interior_cupula.jpg` (1107×1333) | Interior de la cúpula del AAT | [Commons](https://commons.wikimedia.org/wiki/File:Anglo-Australian_Telecope_dome_interior.jpg) | CC BY-SA 3.0 | Diceman Stephen West |
| `real/aat_observatorio_dp.jpg` (2288×1712) | El AAO al atardecer, con canguros | [Commons](https://commons.wikimedia.org/wiki/File:Anglo-Australian_Observatory.JPG) | Dominio público | Astro690 (no se exige crédito) |
| `real/eso_vlt_timelapse.webm` (4K) | Time-lapse del VLT en Paranal, con la Luna saliendo | [Commons](https://commons.wikimedia.org/wiki/File:Time-lapse_of_VLT.webm) / [ESO](http://www.eso.org/public/videos/colosimo_paranal_03/) | CC BY 4.0 | ESO/J. Colosimo |
| `real/eso_paranal_atardecer_timelapse.webm` (4K) | Noche en Paranal: estrellas girando y un telescopio observando | [Commons](https://commons.wikimedia.org/wiki/File:An_evening_time-lapse_at_Paranal.webm) | CC BY 4.0 | ESO/J. Colosimo |
| `real/eso_paranal_amanecer_timelapse.webm` (4K) | Madrugada en Paranal: los telescopios del VLT observando | [Commons](https://commons.wikimedia.org/wiki/File:Morning_observations_time-lapse_at_Paranal.webm) | CC BY 4.0 | ESO/J. Colosimo |
| `real/hubble_ultra_deep_field_2014.jpg` (2300×2100) | Hubble Ultra Deep Field 2014 | [Commons](https://commons.wikimedia.org/wiki/File:NASA-HS201427a-HubbleUltraDeepField2014-20140603.jpg) / HubbleSite | Dominio público (NASA/STScI) | NASA, ESA, H. Teplitz and M. Rafelski (IPAC/Caltech), A. Koekemoer (STScI), R. Windhorst (ASU), Z. Levay (STScI) |
| `real/jwst_primer_campo_profundo.jpg` (4537×4630) | Primer campo profundo del Webb (SMACS 0723) | [Commons](https://commons.wikimedia.org/wiki/File:Webb%27s_First_Deep_Field.jpg) / [webbtelescope.org](https://webbtelescope.org/contents/media/images/2022/038/01G7JGTH21B5GN9VCYAHBXKSD1) | Dominio público. STScI: «no claim to copyright is being asserted by STScI and material on this site may be freely used as in the public domain» ([Content Use Policy](https://www.stsci.edu/copyright)) | NASA, ESA, CSA, and STScI |
| `real/planck_cmb_esa.jpg` (4000×2000, desde el TIFF original) | Fondo cósmico de microondas visto por Planck | [ESA](https://www.esa.int/ESA_Multimedia/Images/2013/03/Planck_CMB) | **ESA Standard Licence. Ver la nota al final de esta sección** | ESA and the Planck Collaboration |
| `real/cajal_celula_purkinje.jpg` (611×715) | Dibujo de Cajal: células de Purkinje (A) y granulares (B) del cerebelo de paloma, 1899 | [Commons](https://commons.wikimedia.org/wiki/File:PurkinjeCell.jpg) | Dominio público (PD-old-auto-expired; Cajal murió en 1934) | Santiago Ramón y Cajal, 1899. Instituto Cajal, Madrid |
| `real/cajal_glia_medula_1899.jpg` (904×735) | Dibujo de Cajal: células gliales de la médula espinal de ratón, 1899. **No son neuronas** | [Commons](https://commons.wikimedia.org/wiki/File:Nyt-Cajal_DRAWING_m1673-resized-for-web.jpg) | Dominio público (PD-US-expired; además, el autor murió hace más de 70 años) | Santiago Ramón y Cajal, 1899. Instituto Cajal (CSIC), Madrid |
| `real/purkinje_raton_fluorescencia.png` (3082×3082) | Fluorescencia: cuerpos de neuronas de Purkinje en un pliegue del cerebelo de ratón | [Commons](https://commons.wikimedia.org/wiki/File:Purkinje_neuron_cell_bodies_in_a_mouse_cerebellum_fold_-_Ksena_Longrin.png) | CC BY 4.0 | Kseniia Bondarenko (Ksena Longrin) / Morne Arin |
| `real/cerebelo_tincion_plata.jpg` (6143×4095) | Tinción de plata de cerebelo; se ven células de Purkinje | [Commons](https://commons.wikimedia.org/wiki/File:Cerebellum_silver_stain.jpg) | CC BY-SA 4.0 | Lazar.zenit |
| `real/cerebro_humano_corte.jpg` (3264×2448) | Corte de cerebro humano (foto) | [Commons](https://commons.wikimedia.org/wiki/File:Human_brain_section.jpg) | CC BY-SA 4.0 | Bozonhiggsa |
| `real/cerebro_humano_lateral.jpg` (701×487, baja resolución) | Cerebro humano en vista lateral (foto de anatomía) | [Commons](https://commons.wikimedia.org/wiki/File:Human_brain_lateral_view.JPG) | CC BY 2.5 | John A. Beal, PhD, LSU Health Sciences Center Shreveport |

**Planck y la ESA Standard Licence.** Texto de las [condiciones de la ESA](https://www.esa.int/ESA_Multimedia/Copyright_Notice_Images): «Images and videos available on the ESA Website can be used, reproduced, broadcasted and publicly performed for educational, editorial or informational purposes (e.g. to illustrate […] documentaries, news programmes, informational or educational videos for VOD services or social media […]), free of charge and without requesting a separate authorisation from ESA». También dicen: «Images or videos available on the ESA Website shall not be used for a commercial purpose, such as but not limited to, entertainment, advertisement, merchandising, etc. A commercial use requires a separate written authorisation by ESA.»

En la práctica:

- Un documental divulgativo en YouTube con el crédito «ESA and the Planck Collaboration» entra en el uso informativo o educativo.
- **Si el canal está monetizado o el video se vende, la ESA podría considerarlo uso comercial.** No está claro. Lo seguro es escribir a spaceinimages@esa.int y pedir confirmación.
- La copia en NOIRLab y la de Commons aparecen como CC BY 4.0, pero la imagen es de la ESA y NOIRLab no puede cambiarle la licencia. No usar esa ruta.

**Material descartado:**

- **Millennium Simulation (MPA Garching).** La [página de visualización](https://wwwmpa.mpa-garching.mpg.de/galform/data_vis/index.shtml) solo dice: «When material of this page is used, credit has to be given to the author(s) as well as to the Max-Planck-Institute for Astrophysics.» No tiene licencia explícita ni dice nada sobre uso comercial o en video. No es claramente libre, así que no se descargó. Como alternativa para la red cósmica están las figuras de Vazza y Feletti (CC BY 4.0).
- **Imagen de prensa de la Universidad de Bolonia** (neurona junto a la red cósmica): licencia NO VERIFICADA, no se descargó.

### Retratos de personas

Se buscaron en Wikimedia Commons y en Wikidata (propiedad P18, imagen).

| Persona | Retrato libre | Detalle |
|---|---|---|
| Franco Vazza | **NO EXISTE** | Wikidata Q136573729 no tiene imagen; Commons no tiene retrato |
| Alberto Feletti | **NO EXISTE** | Wikidata Q97674900 no tiene imagen; Commons no tiene retrato |
| Morag Scrimgeour | **NO EXISTE** | Wikidata Q125118633 no tiene imagen; Commons no tiene retrato |
| Luciano Pietronero | **NO EXISTE** | Wikidata Q1873322 no tiene imagen; Commons no tiene retrato |
| Santiago Ramón y Cajal | Sí existen retratos en dominio público en Commons. No se descargaron porque no se pidieron | Si se nombra a Cajal en la voz, hay que agregar su retrato |

Según la regla de retratos del proyecto, **no conviene nombrar a Vazza, Feletti, Scrimgeour ni Pietronero** en la voz ni en rótulos. Se puede decir «dos investigadores italianos, un astrofísico y un neurocirujano» o «el equipo del censo WiggleZ», y dejar la cita bibliográfica en pantalla o en la descripción.
