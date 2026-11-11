import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarPrologo2, imagenes, ponLimpio, type Cache } from "./prologo2";
ponLimpio(Boolean((getInputProps() as { limpio?: boolean }).limpio));
import P from "./prologo2.json";

// images stay cached across frames; each frame waits until the ones it needs are loaded
const cache: Cache = new Map();
const carga = (src: string) =>
  new Promise<void>((ok) => {
    if (cache.has(src)) return ok();
    const i = new Image();
    i.onload = () => { cache.set(src, i); ok(); };
    i.onerror = () => ok();
    i.src = staticFile(src);
  });

export const VideoPrologo2: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const t = frame / P.fps;
    const handle = delayRender(`prologo2 ${frame}`);
    Promise.all(imagenes(t).map(carga)).then(() => {
      if (ref.current) dibujarPrologo2(ref.current.getContext("2d")!, t, frame, cache);
      continueRender(handle);
    });
  }, [frame]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/prologo2.wav")} volume={1} />
      {P.voz.map((t, k) => (
        <Sequence key={k} from={Math.round(t * P.fps)}>
          <Audio src={staticFile(`voz/p2-${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
