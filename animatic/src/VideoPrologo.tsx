import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarPrologo } from "./prologo";
import P from "./prologo.json";

export const VideoPrologo: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    if (ref.current) dibujarPrologo(ref.current.getContext("2d")!, frame / P.fps, frame);
  }, [frame]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/prologo.wav")} volume={1} />
      {P.voz.map((t, k) => (
        <Sequence key={k} from={Math.round(t * P.fps)}>
          <Audio src={staticFile(`voz/prologo-${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
