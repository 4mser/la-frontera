# La frontera

Código, guiones y dirección del documental **La frontera**, sobre fractales: de una regla simple a un borde infinito, del corazón a la costa de Chile, del cáncer al cosmos.

- Documental completo: https://youtu.be/gdXREAZeusY
- Serie en 10 episodios (canal B&N Lectures), del 11 de noviembre al 14 de diciembre de 2026.

## Qué hay aquí

| Carpeta | Contenido |
|---|---|
| `animatic/src` | Composiciones de Remotion (React + canvas) de cada capítulo, la apertura y la coda. |
| `animatic/herramientas` | Simulaciones y preparación de datos en Python: DLA, erosión, Lorenz, latidos (DFA), cáncer, red cósmica, costa de Chile… |
| `animatic/audio` | Voz (edge-tts) y música y sonido generados por código para cada capítulo. |
| `animatic-vertical` | La misma película recompuesta en 9:16 para Reels, Shorts y TikTok. |
| `episodios` | Corte en episodios, previas del siguiente capítulo, textos y miniaturas para YouTube. |
| `trailer` | Armado y subtítulos de los tráileres. |
| `GUION-*.md`, `DIRECCION-*.md`, `FUENTES-*.md` | Guion por capítulo, dirección de motion y fotografía, y fuentes verificadas de cada imagen y dato. |

El material pesado (renders, fotos, videos de archivo, audio y datos de terceros como Natural Earth o PhysioNet) no está en el repo. Las imágenes usadas son de licencia libre y su origen está en los archivos `FUENTES-*.md`.

## Uso

```bash
cd animatic
npm install
npx remotion studio          # previsualizar
npx remotion render <Composición> out/video.mp4 --concurrency=100%
```

Las composiciones necesitan la carpeta `animatic/public` con el material, que no se publica.
