import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, W, VOZ_T, LOCUCION, Medios, cuadrosSim, cuadroMicro, dibujarKunst } from "./kunst";
import K from "./kunst.json";

const cache = new Map<string, HTMLImageElement | undefined>();
const cargar = (ruta: string) => new Promise<HTMLImageElement | undefined>((ok) => {
  if (cache.has(ruta)) return ok(cache.get(ruta));
  const i = new Image(); i.onload = () => { cache.set(ruta, i); ok(i); }; i.onerror = () => { cache.set(ruta, undefined); ok(undefined); };
  i.src = staticFile(ruta);
});
const FIJOS = ["haeckel", "binet", "clathrocanium", "lamina-spumellaria", "lamina-stephoidea", "lamina-cyrtoidea", "lamina-phaeodaria", "lamina-siphonophorae", "lamina-hexacoralla", "lamina-diatomea", "lamina-discomedusae", "radiolarien-1", "radiolarien-2", "challenger-4", "kdn-acanthometra", "kdn-spyroidea", "kdn-hexactinellae", "kdn-cubomedusae", "kdn-leptomedusae", "kdn-desmidiea", "kdn-actiniae", "kdn-discomedusae-88", "kdn-trachomedusae", "acuarela-3", "foto-haeckel-1914", "kdn-thalamophora", ...["stephoidea", "hexacoralla", "cyrtoidea", "spumellaria", "phaeodaria", "siphonophorae", "diatomea"].map((n) => `lamina-${n}-neg`)];

export const VideoKunst: React.FC<{ post?: boolean; subs?: boolean }> = ({ post = true, subs = true }) => {
  const frame = useCurrentFrame();
  const t = frame / K.fps;
  const ref = useRef<HTMLCanvasElement>(null);
  const [base, setBase] = useState<Medios | null>(null);
  const [h0] = useState(() => delayRender("láminas"));
  useLayoutEffect(() => {
    (async () => {
      const m: Medios = {};
      await Promise.all(FIJOS.map(async (n) => { m[n] = await cargar(`kunst/${n}.jpg`); }));
      m.logo = await cargar("kunst/logo.png");
      m["fija-coral"] = await cargar("kunst/sim/coral/0240.jpg"); m["fija-espuma"] = await cargar("kunst/sim/espuma/0200.jpg");
      setBase(m); continueRender(h0);
    })();
  }, [h0]);
  const [listo, setListo] = useState<{ f: number; sims: Medios } | null>(null);
  useLayoutEffect(() => {
    if (!base) return;
    const h = delayRender(`sims ${frame}`);
    const pide = cuadrosSim(t);
    const mc = cuadroMicro(t); if (mc) pide.micro = mc;
    Promise.all(Object.entries(pide).map(async ([n, r]) => [n === "micro" ? "micro" : `sim-${n}`, await cargar(r)] as const)).then((xs) => {
      for (const k of cache.keys()) if (k.includes("/sim/") && cache.size > 200 && !Object.values(pide).includes(k)) cache.delete(k);
      setListo({ f: frame, sims: Object.fromEntries(xs) }); continueRender(h);
    });
  }, [base, frame, t]);
  useLayoutEffect(() => {
    if (ref.current && base && listo && listo.f === frame) dibujarKunst(ref.current.getContext("2d")!, t, frame, { ...base, ...listo.sims }, post, subs);
  }, [frame, t, base, listo, post, subs]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      <Audio src={staticFile("audio/kunst-musica.wav")} volume={0.7} />
      {!LOCUCION && VOZ_T.map((v, k) => (
        <Sequence key={k} from={Math.round(v * K.fps)}>
          <Audio src={staticFile(`voz/kunst/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
