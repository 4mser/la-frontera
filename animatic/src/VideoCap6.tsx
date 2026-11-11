import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarCap6, ponNube } from "./cap6";
import K from "./cap6.json";

// Chapter 6: the drawing, the score, and the sentences of the voice on their starts
export const VideoCap6: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  // the portraits and the 1922 grid, loaded once
  const [fotos, setFotos] = useState<Record<string, HTMLImageElement> | null>(null);
  const [espera] = useState(() => delayRender("fotos"));
  useLayoutEffect(() => {
    const rutas: Record<string, string> = { richardson: "p3/richardson.jpg", cuadricula: "p3/cuadricula-1922.jpg", lorenz: "p6/lorenz.jpg", feigenbaum: "p6/feigenbaum.jpg" };
    const out: Record<string, HTMLImageElement> = {};
    let faltan = Object.keys(rutas).length;
    const listo = () => { if (--faltan === 0) { setFotos(out); continueRender(espera); } };
    for (const [k, r] of Object.entries(rutas)) { const i = new Image(); i.onload = () => { out[k] = i; listo(); }; i.onerror = listo; i.src = staticFile(r); }
  }, [espera]);
  // the cloud of the close: 4.000 points per frame, int16, loaded once
  const [nube, setNube] = useState(false);
  const [esperaN] = useState(() => delayRender("nube"));
  useLayoutEffect(() => {
    fetch(staticFile("p6/nube.bin")).then((r) => r.arrayBuffer()).then((b) => { ponNube(new Int16Array(b)); setNube(true); continueRender(esperaN); });
  }, [esperaN]);
  useLayoutEffect(() => {
    if (ref.current && fotos && nube) dibujarCap6(ref.current.getContext("2d")!, frame / K.fps, frame, fotos);
  }, [frame, fotos, nube]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/cap6.wav")} volume={1} />
      {K.voz.map((t, k) => t < 0 ? null : (
        <Sequence key={k} from={Math.round(t * K.fps)}>
          <Audio src={staticFile(`voz/c6/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
