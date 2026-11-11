import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarMontajeMG, imagenesCosmos } from "./montajeMG";
import MONT from "./montaje.json";
// the images of the cosmic zoom, loaded only while they are on screen (film version)
const cosmos = new Map<string, HTMLImageElement>();
const carga = (src: string) =>
  new Promise<void>((ok) => {
    if (cosmos.has(src)) return ok();
    const i = new Image();
    i.onload = () => { cosmos.set(src, i); ok(); };
    i.onerror = () => ok();
    i.src = staticFile(src);
  });

export const VideoMG: React.FC<{ pelicula?: boolean }> = ({ pelicula = false }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [marca, setMarca] = useState<HTMLImageElement | null>(null);
  const [handle] = useState(() => delayRender("marca"));
  useLayoutEffect(() => {
    const i = new Image();
    i.onload = () => { setMarca(i); continueRender(handle); };
    i.onerror = () => continueRender(handle);
    i.src = staticFile("lectures-logo.png");
  }, [handle]);
  useLayoutEffect(() => {
    if (!ref.current || !marca) return;
    const t = frame / MONT.fps;
    const lista = pelicula ? imagenesCosmos(t) : [];
    const dibuja = () => ref.current && dibujarMontajeMG(ref.current.getContext("2d")!, t, frame, marca, pelicula, pelicula ? cosmos : undefined);
    if (lista.every((s) => cosmos.has(s))) { dibuja(); return; }
    const h = delayRender(`cosmos ${frame}`);
    Promise.all(lista.map(carga)).then(() => { dibuja(); continueRender(h); });
  }, [frame, marca, pelicula]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/montaje.wav")} volume={0.9} />
      {pelicula && <Audio src={staticFile("audio/montaje_dune.wav")} volume={0.85} />}
      {!pelicula && (
        <Sequence from={Math.round(MONT.voz * MONT.fps)}>
          <Audio src={staticFile("voz/montaje.mp3")} volume={1} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
