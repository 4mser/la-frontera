import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarCap10, ponLimpio, ponTrailer } from "./cap10";
ponLimpio(Boolean((getInputProps() as { limpio?: boolean }).limpio));
ponTrailer(Boolean((getInputProps() as { trailer?: boolean }).trailer));
import K from "./cap10.json";
import EPI from "./epilogo.json";

// Chapter 10: the drawing, the score, and the sentences of the voice on their starts
export const VideoCap10: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  // the portraits, the retina steps and the cosmic web, loaded once
  const [fotos, setFotos] = useState<Record<string, HTMLImageElement> | null>(null);
  const [espera] = useState(() => delayRender("fotos"));
  useLayoutEffect(() => {
    const rutas: Record<string, string> = { richardson: "p3/richardson.jpg", haeckel: "p10/haeckel.jpg", lamina: "p10/real/haeckel_41_acanthophracta.jpg",
      viajeFin: "p10/vid/viaje/1349.jpg", microFin: "p10/vid/micro/1349.jpg", mandelFin: "p10/vid/mandel/1979.jpg", marca: "p10/logo/bn-mark.png" };
    const out: Record<string, HTMLImageElement> = {};
    let faltan = Object.keys(rutas).length;
    const listo = () => { if (--faltan === 0) { setFotos(out); continueRender(espera); } };
    for (const [k, r] of Object.entries(rutas)) { const i = new Image(); i.onload = () => { out[k] = i; listo(); }; i.onerror = listo; i.src = staticFile(r); }
  }, [espera]);
  // the real video clips: the frame of this instant, loaded for this frame only
  const t = frame / K.fps;
  const lista = [...(K.clips as [string, number, number, number][]).filter(([n]) => !(EPI.activo && n === "giro")), ...(EPI.activo ? (EPI.clips as [string, number, number, number][]) : [])];
  const LEN = { ...(K.vidLen as Record<string, number>), ...(EPI.vidLen as Record<string, number>) };
  // the clip whose span holds this instant (the one starting first wins only when none does)
  const clip = lista.find(([, t0, t1]) => t >= t0 && t < t1) ?? lista.find(([, t0, t1]) => t >= t0 - 0.5 && t <= t1 + 0.5);
  const kv = clip ? `${clip[0]}/${String(Math.max(0, Math.min(LEN[clip[0]] - 1, Math.floor((t - clip[1]) * 30) + clip[3]))).padStart(4, "0")}` : "";
  const [vid, setVid] = useState<{ k: string; im: HTMLImageElement } | null>(null);
  useLayoutEffect(() => {
    if (!kv || vid?.k === kv) return;
    const h = delayRender(`video ${kv}`);
    const i = new Image();
    i.onload = () => { setVid({ k: kv, im: i }); continueRender(h); };
    i.onerror = () => continueRender(h);
    i.src = staticFile(`${kv.startsWith("homogeneo") ? "p8" : "p10"}/vid/${kv}.jpg`);
  }, [kv, vid]);
  useLayoutEffect(() => {
    if (ref.current && fotos && (!kv || vid?.k === kv)) dibujarCap10(ref.current.getContext("2d")!, frame / K.fps, frame, kv && vid ? { ...fotos, [`vid_${clip![0]}`]: vid.im } : fotos);
  }, [frame, fotos, vid, kv, clip]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/cap10.wav")} volume={1} />
      {EPI.activo && EPI.voz.map((t, k) => t < 0 ? null : (
        <Sequence key={`e${k}`} from={Math.round(t * K.fps)}>
          <Audio src={staticFile(`voz/epi/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
      {K.voz.map((t, k) => t < 0 || (EPI.activo && k > 12) ? null : (
        <Sequence key={k} from={Math.round(t * K.fps)}>
          <Audio src={staticFile(`voz/c10/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
