import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarCap1p } from "./cap1p";
import K from "./cap1p.json";

// Chapter 1 preview: the drawing, the score, and the five sentences of the voice on their starts
export const VideoCap1p: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  // the real fern photo, loaded once
  const [foto, setFoto] = useState<HTMLImageElement | null>(null);
  const [espera] = useState(() => delayRender("helecho"));
  useLayoutEffect(() => {
    const i = new Image();
    i.onload = () => { setFoto(i); continueRender(espera); };
    i.onerror = () => continueRender(espera);
    i.src = staticFile("p2/fotos/helecho.jpg");
  }, [espera]);
  useLayoutEffect(() => {
    if (ref.current && foto) dibujarCap1p(ref.current.getContext("2d")!, frame / K.fps, frame, foto);
  }, [frame, foto]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/cap1p.wav")} volume={1} />
      {K.voz.map((t, k) => (
        <Sequence key={k} from={Math.round(t * K.fps)}>
          <Audio src={staticFile(`voz/c1p/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
