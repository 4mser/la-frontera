import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, dibujarCap7 } from "./cap7";
import K from "./cap7.json";

// Chapter 7: the drawing, the score, and the sentences of the voice on their starts
export const VideoCap7: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  // the portraits, the retina steps and the cosmic web, loaded once
  const [fotos, setFotos] = useState<Record<string, HTMLImageElement> | null>(null);
  const [espera] = useState(() => delayRender("fotos"));
  useLayoutEffect(() => {
    const rutas: Record<string, string> = { puente: "p7/puente.jpg", carpenter: "p7/carpenter.jpg", ret_color: "p7/retina-color.jpg", ret_verde: "p7/retina-verde.jpg", ret_realce: "p7/retina-realce.jpg", ret_vasos: "p7/retina-vasos.png", cosmos: "p2/cosmos/0001.jpg", helecho: "p2/destellos/08-helecho.jpg",
      antenaPatente: "p7/real/antena-patente.png", iphone: "p7/real/iphone-antena.jpg", boston: "p7/real/boston.jpg", radioaficionado: "p7/real/radioaficionado.jpg",
      cordilleras: "p7/real/cordilleras.jpg", startrek: "p7/real/startrek.jpg", examenOjo: "p7/real/examen-ojo.jpg", fondoExamen: "p7/real/fondo-ojo-examen.jpg" };
    const out: Record<string, HTMLImageElement> = {};
    let faltan = Object.keys(rutas).length;
    const listo = () => { if (--faltan === 0) { setFotos(out); continueRender(espera); } };
    for (const [k, r] of Object.entries(rutas)) { const i = new Image(); i.onload = () => { out[k] = i; listo(); }; i.onerror = listo; i.src = staticFile(r); }
  }, [espera]);
  // the real video clips: the frame of this instant, loaded for this frame only
  const t = frame / K.fps;
  const clip = ([...K.inserciones, ["video", "final", K.final, K.total, "", "", -15]] as [string, string, number, number, string, string][]).find(([tipo, , t0, t1]) => tipo === "video" && t >= t0 - 0.5 && t <= t1 + 0.5);
  const kv = clip ? `${clip[1]}/${String(Math.max(0, Math.min(((K as { vidLen?: Record<string, number> }).vidLen?.[clip[1]] ?? K.vidN) - 1, Math.floor((t - clip[2] + 0.5) * 30) + ((clip as unknown as number[])[6] ?? 0)))).padStart(4, "0")}` : "";
  const [vid, setVid] = useState<{ k: string; im: HTMLImageElement } | null>(null);
  useLayoutEffect(() => {
    if (!kv || vid?.k === kv) return;
    const h = delayRender(`video ${kv}`);
    const i = new Image();
    i.onload = () => { setVid({ k: kv, im: i }); continueRender(h); };
    i.onerror = () => continueRender(h);
    i.src = staticFile(`p7/vid/${kv}.jpg`);
  }, [kv, vid]);
  useLayoutEffect(() => {
    if (ref.current && fotos && (!kv || vid?.k === kv)) dibujarCap7(ref.current.getContext("2d")!, frame / K.fps, frame, kv && vid ? { ...fotos, [`vid_${clip![1]}`]: vid.im } : fotos);
  }, [frame, fotos, vid, kv, clip]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/cap7.wav")} volume={1} />
      {K.voz.map((t, k) => t < 0 ? null : (
        <Sequence key={k} from={Math.round(t * K.fps)}>
          <Audio src={staticFile(`voz/c7/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
