import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarCap1 } from "./cap1";
import K from "./cap1.json";

// Chapter 1 animatic: the canvas drawing, the voice of each scene on its start, and the pulses
export const VideoCap1: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    if (ref.current) dibujarCap1(ref.current.getContext("2d")!, frame / K.fps, frame);
  }, [frame]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/cap1.wav")} volume={1} />
      {K.voz.map((t, k) => (
        <Sequence key={k} from={Math.round(t * K.fps)}>
          <Audio src={staticFile(`voz/c1-${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
