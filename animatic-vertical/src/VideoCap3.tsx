import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarCap3 } from "./cap3";
import K from "./cap3.json";

// Chapter 3: the drawing, the score, and the sentences of the voice on their starts
export const VideoCap3: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  // the photos (portraits, the river, the border stone, the stones, three forms of the prologue), loaded once
  const [fotos, setFotos] = useState<Record<string, HTMLImageElement> | null>(null);
  const [espera] = useState(() => delayRender("fotos"));
  useLayoutEffect(() => {
    const rutas: Record<string, string> = { richardson: "p3/richardson.jpg", mandelbrot: "p2/fotos/mandelbrot.jpg", ribera: "p3/ribera.jpg", hito: "p3/hito.jpg", piedras: "p3/piedras.jpg", pirolusita: "p2/destellos/20-pirolusita.jpg", retina: "p2/destellos/04-retina.jpg", drenaje: "p2/destellos/03-drenaje-himalaya.jpg", ssa13: "p3/ssa13-1918.jpg", cuadricula: "p3/cuadricula-1922.jpg", iberia: "p3/tierra-iberia.jpg", benelux: "p3/tierra-benelux.jpg", norteamerica: "p3/tierra-norteamerica.jpg", europa: "p3/tierra-europa.jpg" };
    const out: Record<string, HTMLImageElement> = {};
    let faltan = Object.keys(rutas).length;
    const listo = () => { if (--faltan === 0) { setFotos(out); continueRender(espera); } };
    for (const [k, r] of Object.entries(rutas)) { const i = new Image(); i.onload = () => { out[k] = i; listo(); }; i.onerror = listo; i.src = staticFile(r); }
  }, [espera]);
  useLayoutEffect(() => {
    if (ref.current && fotos) dibujarCap3(ref.current.getContext("2d")!, frame / K.fps, frame, fotos);
  }, [frame, fotos]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/cap3.wav")} volume={1} />
      {K.voz.map((t, k) => t < 0 ? null : (
        <Sequence key={k} from={Math.round(t * K.fps)}>
          <Audio src={staticFile(`voz/c3/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
