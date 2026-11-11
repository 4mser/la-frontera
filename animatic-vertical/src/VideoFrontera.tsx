import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarFrontera } from "./frontera";
import F from "./frontera.json";

export const VideoFrontera: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [marca, setMarca] = useState<HTMLImageElement | null>(null);
  const [handle] = useState(() => delayRender("marca"));
  useLayoutEffect(() => {
    const i = new Image();
    i.onload = () => { setMarca(i); continueRender(handle); };
    i.onerror = () => continueRender(handle);
    i.src = staticFile("lectures-logo.png");
  }, [handle]);
  useLayoutEffect(() => {
    if (ref.current && marca) dibujarFrontera(ref.current.getContext("2d")!, frame / F.fps, frame, marca);
  }, [frame, marca]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/frontera.wav")} volume={0.9} />
      <Sequence from={Math.round(F.voz * F.fps)}>
        <Audio src={staticFile("voz/montaje.mp3")} volume={1} />
      </Sequence>
    </AbsoluteFill>
  );
};
