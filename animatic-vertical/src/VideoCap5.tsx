import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarCap5 } from "./cap5";
import K from "./cap5.json";

// Chapter 5: the drawing, the score, and the sentences of the voice on their starts
export const VideoCap5: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  // the two portraits, loaded once
  const [fotos, setFotos] = useState<Record<string, HTMLImageElement> | null>(null);
  const [espera] = useState(() => delayRender("fotos"));
  useLayoutEffect(() => {
    const rutas: Record<string, string> = { peng: "p5/peng.jpg", ivanov: "p5/ivanov.jpg", ero: "p4/erosion/40.png" };
    const out: Record<string, HTMLImageElement> = {};
    let faltan = Object.keys(rutas).length;
    const listo = () => { if (--faltan === 0) { setFotos(out); continueRender(espera); } };
    for (const [k, r] of Object.entries(rutas)) { const i = new Image(); i.onload = () => { out[k] = i; listo(); }; i.onerror = listo; i.src = staticFile(r); }
  }, [espera]);
  useLayoutEffect(() => {
    if (ref.current && fotos) dibujarCap5(ref.current.getContext("2d")!, frame / K.fps, frame, fotos);
  }, [frame, fotos]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/cap5.wav")} volume={1} />
      {K.voz.map((t, k) => t < 0 ? null : (
        <Sequence key={k} from={Math.round(t * K.fps)}>
          <Audio src={staticFile(`voz/c5/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
