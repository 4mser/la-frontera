import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarMontajeTeaser } from "./montajeTeaser";
import MONT from "./montaje.json";

export const VideoTeaser: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    if (ref.current) dibujarMontajeTeaser(ref.current.getContext("2d")!, frame / MONT.fps, frame);
  }, [frame]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/montaje.wav")} volume={0.9} />
      <Sequence from={Math.round(MONT.voz * MONT.fps)}>
        <Audio src={staticFile("voz/montaje.mp3")} volume={1} />
      </Sequence>
    </AbsoluteFill>
  );
};
