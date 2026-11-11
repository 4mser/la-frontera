import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarCap4 } from "./cap4";
import K from "./cap4.json";
import ERO from "./cap4_erosion.json";

// Chapter 4: the drawing, the score, and the sentences of the voice on their starts
export const VideoCap4: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  // the portraits, the photographs and the snapshots of the eroded relief, loaded once
  const [fotos, setFotos] = useState<Record<string, HTMLImageElement> | null>(null);
  const [espera] = useState(() => delayRender("fotos"));
  useLayoutEffect(() => {
    const rutas: Record<string, string> = {
      witten: "p4/witten.png", sander: "p4/sander.jpg", iturbe: "p4/rodriguez-iturbe.jpg", rinaldo: "p4/rinaldo.jpg",
      runions: "p4/runions.jpg", prusinkiewicz: "p4/prusinkiewicz.jpg", pirolusita: "p2/destellos/20-pirolusita.jpg",
      retina: "p2/destellos/04-retina.jpg", drenaje: "p2/destellos/03-drenaje-himalaya.jpg", copo: "p2/destellos/01-copo-de-nieve.jpg",
      escarcha: "p2/destellos/18-escarcha.jpg", romanesco: "p2/destellos/02-romanesco.jpg",
    };
    for (let k = 0; k < ERO.fotos; k++) rutas[`ero${k}`] = `p4/erosion/${String(k).padStart(2, "0")}.png`;
    const out: Record<string, HTMLImageElement> = {};
    let faltan = Object.keys(rutas).length;
    const listo = () => { if (--faltan === 0) { setFotos(out); continueRender(espera); } };
    for (const [k, r] of Object.entries(rutas)) { const i = new Image(); i.onload = () => { out[k] = i; listo(); }; i.onerror = listo; i.src = staticFile(r); }
  }, [espera]);
  useLayoutEffect(() => {
    if (ref.current && fotos) dibujarCap4(ref.current.getContext("2d")!, frame / K.fps, frame, fotos);
  }, [frame, fotos]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/cap4.wav")} volume={1} />
      {K.voz.map((t, k) => t < 0 ? null : (
        <Sequence key={k} from={Math.round(t * K.fps)}>
          <Audio src={staticFile(`voz/c4/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
