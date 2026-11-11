import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarDireccion, type Dir } from "./direcciones";
import type { Datos } from "./escena";
import DIR from "./direcciones.json";

export const VideoDireccion: React.FC<{ dir: Dir }> = ({ dir }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [handle] = useState(() => delayRender("datos"));
  useLayoutEffect(() => {
    fetch(staticFile("datos/latidos.json")).then((r) => r.json()).then((d) => {
      setDatos({ ...d, latidosAudio: [] });
      continueRender(handle);
    });
  }, [handle]);
  useLayoutEffect(() => {
    if (!datos || !ref.current) return;
    dibujarDireccion(ref.current.getContext("2d")!, dir, datos, frame / DIR.fps, frame);
  }, [datos, frame, dir]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile(`audio/dir-${dir}.wav`)} volume={0.9} />
      <Sequence from={Math.round(DIR[dir].voz * DIR.fps)}>
        <Audio src={staticFile(`voz/dir-${dir}.mp3`)} volume={1} />
      </Sequence>
    </AbsoluteFill>
  );
};
