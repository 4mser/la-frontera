import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujar, type Datos } from "./escena";
import LINEA from "./linea.json";
import VOZ from "./voz.json";

const FPS = LINEA.fps;

// Music dips under the voice (slow, so it never pumps); the heart stays as it was recorded.
const hablando = (t: number) => LINEA.voz.some((v, i) => t > v - 0.4 && t < v + (VOZ as number[])[i] + 0.4);
const volMusica = (f: number) => {
  const t = f / FPS;
  let g = 0;
  // smooth over ±0.8 s
  for (let k = -4; k <= 4; k++) g += hablando(t + k * 0.2) ? 1 : 0;
  return 0.42 - 0.14 * (g / 9);
};

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [handle] = useState(() => delayRender("datos"));
  useLayoutEffect(() => {
    Promise.all([fetch(staticFile("datos/latidos.json")).then((r) => r.json()), fetch(staticFile("audio/latidos_audio.json")).then((r) => r.json())]).then(
      ([d, l]) => {
        setDatos({ ...d, latidosAudio: l });
        continueRender(handle);
      },
    );
  }, [handle]);
  useLayoutEffect(() => {
    if (!datos || !ref.current) return;
    const ctx = ref.current.getContext("2d")!;
    dibujar(ctx, datos, frame / FPS, frame);
  }, [datos, frame]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#07060f" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/corazon.wav")} volume={0.95} />
      <Audio src={staticFile("audio/musica.wav")} volume={volMusica} />
      {LINEA.voz.map((t, i) => (
        <Sequence key={i} from={Math.round(t * FPS)} durationInFrames={Math.ceil(((VOZ as number[])[i] + 0.5) * FPS)}>
          <Audio src={staticFile(`voz/${String(i).padStart(2, "0")}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
