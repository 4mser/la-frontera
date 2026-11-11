import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarCap2 } from "./cap2";
import K from "./cap2.json";

// Chapter 2 preview: the drawing, the score, and the sentences of the voice on their starts
export const VideoCap2: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  // the photos (the cloud, Fatou, Julia), loaded once
  const [fotos, setFotos] = useState<Record<string, HTMLImageElement> | null>(null);
  const [espera] = useState(() => delayRender("fotos"));
  useLayoutEffect(() => {
    const rutas: Record<string, string> = { nube: "p2/destellos/14-nubes.jpg", fatou: "p2/fotos/fatou.jpg", julia: "p2/fotos/julia.jpg", leibniz: "p2/fotos/leibniz.jpg" };
    const out: Record<string, HTMLImageElement> = {};
    let faltan = Object.keys(rutas).length;
    const listo = () => { if (--faltan === 0) { setFotos(out); continueRender(espera); } };
    for (const [k, r] of Object.entries(rutas)) { const i = new Image(); i.onload = () => { out[k] = i; listo(); }; i.onerror = listo; i.src = staticFile(r); }
  }, [espera]);
  useLayoutEffect(() => {
    if (ref.current && fotos) dibujarCap2(ref.current.getContext("2d")!, frame / K.fps, frame, fotos);
  }, [frame, fotos]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/cap2.wav")} volume={1} />
      {K.voz.map((t, k) => t < 0 ? null : (
        <Sequence key={k} from={Math.round(t * K.fps)}>
          <Audio src={staticFile(`voz/c2/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
