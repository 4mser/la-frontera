import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { AP, RUTAS_APERTURA, dibujarApertura } from "./aperturaTrailer";

// The trailer's opening dive (src/aperturaTrailer.ts): picture only; the score is made by fractales/trailer
export const APERTURA_FRAMES = Math.round(AP.fin * 30);
export const VideoAperturaTrailer: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [fotos, setFotos] = useState<Map<string, HTMLImageElement> | null>(null);
  const [espera] = useState(() => delayRender("fotos de la apertura", { timeoutInMilliseconds: 240000 }));
  useLayoutEffect(() => {
    const m = new Map<string, HTMLImageElement>();
    let faltan = RUTAS_APERTURA.length;
    const listo = () => { if (--faltan === 0) { setFotos(m); continueRender(espera); } };
    for (const r of RUTAS_APERTURA) { const i = new Image(); i.onload = () => { m.set(r, i); listo(); }; i.onerror = listo; i.src = staticFile(r); }
  }, [espera]);
  useLayoutEffect(() => {
    if (!fotos) return;
    dibujarApertura(ref.current!.getContext("2d")!, frame / 30, fotos);
  }, [frame, fotos]);
  return <AbsoluteFill style={{ backgroundColor: "#020306" }}><canvas ref={ref} width={1920} height={1080} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
