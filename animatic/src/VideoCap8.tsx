import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarCap8 } from "./cap8";
import K from "./cap8.json";

// Chapter 8: the drawing, the score, and the sentences of the voice on their starts
export const VideoCap8: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  // the portraits, the retina steps and the cosmic web, loaded once
  const [fotos, setFotos] = useState<Record<string, HTMLImageElement> | null>(null);
  const [espera] = useState(() => delayRender("fotos"));
  useLayoutEffect(() => {
    const rutas: Record<string, string> = { neuronas: "p5/7-neuronas.jpg", red: "p5/1-red.jpg", cerebro: "p8/real/cerebro_humano_corte.jpg",
      fig1: "p8/vazza_feletti_2020_fig1.jpg", fig3: "p8/fig3_redes.jpg", mapa2df: "p8/real/2dfgrs_oscuro.jpg", sdss: "p8/real/sdss_mapa_galaxias_blanton.jpg",
      aat: "p8/real/aat_cupula.jpg", aatDentro: "p8/real/aat_interior_cupula.jpg" };
    const out: Record<string, HTMLImageElement> = {};
    let faltan = Object.keys(rutas).length;
    const listo = () => { if (--faltan === 0) { setFotos(out); continueRender(espera); } };
    for (const [k, r] of Object.entries(rutas)) { const i = new Image(); i.onload = () => { out[k] = i; listo(); }; i.onerror = listo; i.src = staticFile(r); }
  }, [espera]);
  // the real video clips: the frame of this instant, loaded for this frame only
  const t = frame / K.fps;
  const lista: [string, number, number, number][] = [
    ...(K.inserciones as [string, string, number, number, string, string][]).filter(([tipo]) => tipo === "video").map(([, n, t0, t1]) => [n, t0, t1, 15] as [string, number, number, number]),
    ...(K.clips as [string, number, number, number][]),
  ];
  const clip = lista.find(([, t0, t1]) => t >= t0 - 0.5 && t <= t1 + 0.5);
  const kv = clip ? `${clip[0]}/${String(Math.max(0, Math.min((K.vidLen as Record<string, number>)[clip[0]] - 1, Math.floor((t - clip[1]) * 30) + clip[3]))).padStart(4, "0")}` : "";
  const [vid, setVid] = useState<{ k: string; im: HTMLImageElement } | null>(null);
  useLayoutEffect(() => {
    if (!kv || vid?.k === kv) return;
    const h = delayRender(`video ${kv}`);
    const i = new Image();
    i.onload = () => { setVid({ k: kv, im: i }); continueRender(h); };
    i.onerror = () => continueRender(h);
    i.src = staticFile(`p8/vid/${kv}.jpg`);
  }, [kv, vid]);
  useLayoutEffect(() => {
    if (ref.current && fotos && (!kv || vid?.k === kv)) dibujarCap8(ref.current.getContext("2d")!, frame / K.fps, frame, kv && vid ? { ...fotos, [`vid_${clip![0]}`]: vid.im } : fotos);
  }, [frame, fotos, vid, kv, clip]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/cap8.wav")} volume={1} />
      {K.voz.map((t, k) => t < 0 ? null : (
        <Sequence key={k} from={Math.round(t * K.fps)}>
          <Audio src={staticFile(`voz/c8/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
