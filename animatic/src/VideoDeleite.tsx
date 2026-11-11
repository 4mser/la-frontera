import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { FOTOS, H, W, dibujarDeleite } from "./deleite";
import D from "./deleite.json";

// «Deleite»: the musical finale of the film (src/deleite.ts, audio/sonido_deleite.py); the nature photos load once
export const VideoDeleite: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [fotos, setFotos] = useState<Map<string, HTMLImageElement> | null>(null);
  const [handle] = useState(() => delayRender("fotos"));
  useLayoutEffect(() => {
    const m = new Map<string, HTMLImageElement>();
    Promise.all(Object.entries(FOTOS).map(([k, src]) => new Promise<void>((ok) => { const i = new Image(); i.onload = () => { m.set(k, i); ok(); }; i.onerror = () => ok(); i.src = staticFile(src); })))
      .then(() => { setFotos(m); continueRender(handle); });
  }, [handle]);
  useLayoutEffect(() => {
    if (ref.current && fotos) dibujarDeleite(ref.current.getContext("2d")!, frame / D.fps, frame, fotos);
  }, [frame, fotos]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#020306" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/deleite.wav")} volume={1} />
    </AbsoluteFill>
  );
};
