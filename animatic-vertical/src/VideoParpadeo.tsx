import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, VOZ_T, Medios, cuadrosPeli, dibujarParpadeo } from "./parpadeo";
import K from "./parpadeo.json";

const cache = new Map<string, HTMLImageElement | undefined>();
const cargar = (ruta: string) => new Promise<HTMLImageElement | undefined>((ok) => {
  if (cache.has(ruta)) return ok(cache.get(ruta));
  const i = new Image(); i.onload = () => { cache.set(ruta, i); ok(i); }; i.onerror = () => { cache.set(ruta, undefined); ok(undefined); };
  i.src = staticFile(ruta);
});

// «Un parpadeo»: el dibujo, la música y cada frase de la voz guía en su inicio
export const VideoParpadeo: React.FC<{ post?: boolean; subs?: boolean }> = ({ post = true, subs = true }) => {
  const frame = useCurrentFrame();
  const t = frame / K.fps;
  const ref = useRef<HTMLCanvasElement>(null);
  const [base, setBase] = useState<{ m: Medios; cuantos: Record<string, number> } | null>(null);
  const [h0] = useState(() => delayRender("texturas"));
  useLayoutEffect(() => {
    (async () => {
      const nombres = ["tierra-noche.jpg", "tierra-dia.jpg", "tierra-nubes.jpg", "logo.png", "fosil.jpg", "manos.jpg", "tablilla.jpg", "cumulo.jpg"];
      const [noche, dia, nubes, logo, fosil, manos, tablilla, cumulo] = await Promise.all(nombres.map((n) => cargar(`parpadeo/${n}`)));
      let cuantos: Record<string, number> = {};
      try { cuantos = await (await fetch(staticFile("parpadeo/vid.json"))).json(); } catch { /* sin películas */ }
      setBase({ m: { noche, dia, nubes, logo, fosil, manos, tablilla, cumulo }, cuantos }); continueRender(h0);
    })();
  }, [h0]);
  const [listo, setListo] = useState<{ f: number; vid: Record<string, HTMLImageElement | undefined> } | null>(null);
  useLayoutEffect(() => {
    if (!base) return;
    const h = delayRender(`cuadros ${frame}`);
    const pide = cuadrosPeli(t, base.cuantos);
    Promise.all(Object.entries(pide).map(async ([n, r]) => [n, await cargar(r)] as const)).then((xs) => {
      for (const k of cache.keys()) if (k.includes("/vid/") && cache.size > 300 && !Object.values(pide).includes(k)) cache.delete(k);
      setListo({ f: frame, vid: Object.fromEntries(xs) }); continueRender(h);
    });
  }, [base, frame, t]);
  useLayoutEffect(() => {
    if (ref.current && base && listo && listo.f === frame) dibujarParpadeo(ref.current.getContext("2d")!, t, frame, { ...base.m, vid: listo.vid }, post, subs);
  }, [frame, t, base, listo, post, subs]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/parpadeo-musica.wav")} volume={0.7} />
      {VOZ_T.map((v, k) => (
        <Sequence key={k} from={Math.round(v * K.fps)}>
          <Audio src={staticFile(`voz/parpadeo/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
