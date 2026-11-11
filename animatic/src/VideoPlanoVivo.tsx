import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { H, W, dibujarPlanoVivo } from "./montajeMG";

export const VideoPlanoVivo: React.FC<{ nombre: string }> = ({ nombre }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    if (ref.current) dibujarPlanoVivo(ref.current.getContext("2d")!, frame / fps, frame, nombre, durationInFrames / fps);
  }, [frame, fps, durationInFrames, nombre]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};
