import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarCap9 } from "./cap9";
import K from "./cap9.json";

// Chapter 9: the drawing, the score, and the sentences of the voice on their starts
export const VideoCap9: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  // the portraits, the retina steps and the cosmic web, loaded once
  const [fotos, setFotos] = useState<Record<string, HTMLImageElement> | null>(null);
  const [espera] = useState(() => delayRender("fotos"));
  useLayoutEffect(() => {
    const rutas: Record<string, string> = { galileo: "p9/galileo.jpg", portada: "p9/galileo_saggiatore_1623_portada.png", pagina: "p9/galileo_saggiatore_favaro_p232.jpg",
      wigner: "p9/wigner.jpg", ribera: "p3/ribera.jpg", rio: "p4/05-rio.jpg", antena: "p7/real/antena-patente.png", galaxias: "p8/real/hubble_ultra_deep_field_2014.jpg" };
    const out: Record<string, HTMLImageElement> = {};
    let faltan = Object.keys(rutas).length;
    const listo = () => { if (--faltan === 0) { setFotos(out); continueRender(espera); } };
    for (const [k, r] of Object.entries(rutas)) { const i = new Image(); i.onload = () => { out[k] = i; listo(); }; i.onerror = listo; i.src = staticFile(r); }
  }, [espera]);
  useLayoutEffect(() => {
    if (ref.current && fotos) dibujarCap9(ref.current.getContext("2d")!, frame / K.fps, frame, fotos);
  }, [frame, fotos]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/cap9.wav")} volume={1} />
      {K.voz.map((t, k) => t < 0 ? null : (
        <Sequence key={k} from={Math.round(t * K.fps)}>
          <Audio src={staticFile(`voz/c9/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
