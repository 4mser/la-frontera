import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarLoco } from "./loco";

// «Deleite» · the wild section, as a standalone sample (src/loco.ts, audio/sonido_loco.py)
export const VideoLoco: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { if (ref.current) dibujarLoco(ref.current.getContext("2d")!, frame / 30, frame); }, [frame]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#020306" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/loco.wav")} volume={1} />
    </AbsoluteFill>
  );
};
