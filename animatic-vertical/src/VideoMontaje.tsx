import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { CON_FONDO, CRECEN, H, IMAGENES, W, dibujarMontaje } from "./montaje";
import { subirTextura } from "./plano";
import type { Datos } from "./escena";
import MONT from "./montaje.json";

const cargar = (src: string) =>
  new Promise<HTMLImageElement>((ok, mal) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = mal;
    i.src = src;
  });

export const VideoMontaje: React.FC<{ variante: "A" | "B" }> = ({ variante }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [handle] = useState(() => delayRender("planos"));
  useLayoutEffect(() => {
    const imgs = [...IMAGENES.map((n) => [n, `planos/${n}.jpg`]), ...CRECEN.map((n) => [`${n}-g`, `planos/${n}-g.png`]), ...CON_FONDO.map((n) => [`${n}-f`, `planos/${n}-f.jpg`])];
    Promise.all([
      fetch(staticFile("datos/latidos.json")).then((r) => r.json()),
      ...imgs.map(([k, src]) => cargar(staticFile(src)).then((im) => subirTextura(k, im))),
    ]).then(([d]) => {
      setDatos({ ...(d as Datos), latidosAudio: [] });
      continueRender(handle);
    });
  }, [handle]);
  useLayoutEffect(() => {
    if (!datos || !ref.current) return;
    dibujarMontaje(ref.current.getContext("2d")!, datos, frame / MONT.fps, frame, variante);
  }, [datos, frame, variante]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/montaje.wav")} volume={0.9} />
      <Sequence from={Math.round(MONT.voz * MONT.fps)}>
        <Audio src={staticFile("voz/montaje.mp3")} volume={1} />
      </Sequence>
    </AbsoluteFill>
  );
};
