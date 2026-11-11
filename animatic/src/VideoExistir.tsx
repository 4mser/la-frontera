import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { H, LOCUCION, Medios, VID, VOZ_NICO, VOZ_REAL, Vida, W, dibujarExistir, recursos } from "./existir";
import K from "./existir.json";

// imágenes ya cargadas (las fotos se piden en muchos cuadros; los cuadros de video, en uno)
const cache = new Map<string, HTMLImageElement | null>();
const cargar = (k: string) => new Promise<void>((ok) => {
  if (cache.has(k)) return ok();
  const i = new Image();
  i.onload = () => { cache.set(k, i); ok(); };
  i.onerror = () => { cache.set(k, null); ok(); };
  i.src = k.startsWith("@") ? staticFile(k.slice(1)) : staticFile(`existir/${k}${k === "logo" ? ".png" : ".jpg"}`);
});

// «Qué extraño es existir»: el dibujo, la música y cada frase de la voz en su inicio
export const VideoExistir: React.FC<{ post?: boolean }> = ({ post = true }) => {
  const frame = useCurrentFrame();
  const t = frame / K.fps;
  const ref = useRef<HTMLCanvasElement>(null);
  const [base, setBase] = useState<{ vida: Vida | null } | null>(null);
  const [inicio] = useState(() => delayRender("datos"));
  useLayoutEffect(() => {
    (async () => {
      try { Object.assign(VID, await (await fetch(staticFile("existir/vid.json"))).json()); } catch { /* sin videos */ }
      let vida: Vida | null = null;
      try {
        const meta = await (await fetch(staticFile("existir/vida/meta.json"))).json();
        const pos = new Uint16Array(await (await fetch(staticFile("existir/vida/pos.bin"))).arrayBuffer());
        vida = { ...meta, pos };
      } catch { /* sin simulación */ }
      setBase({ vida });
      continueRender(inicio);
    })();
  }, [inicio]);
  const [listos, setListos] = useState(-1);
  useLayoutEffect(() => {
    if (!base) return;
    const h = delayRender(`medios ${frame}`);
    Promise.all(recursos(t).map(cargar)).then(() => { setListos(frame); continueRender(h); });
  }, [base, frame, t]);
  useLayoutEffect(() => {
    if (!ref.current || !base || listos !== frame) return;
    const m: Medios = {};
    for (const k of recursos(t)) m[k] = cache.get(k) ?? undefined;
    // los cuadros de video ya dibujados no se vuelven a usar
    for (const k of cache.keys()) if (k.startsWith("vid/") && !(k in m) && cache.size > 400) cache.delete(k);
    dibujarExistir(ref.current.getContext("2d")!, t, frame, m, base.vida, post);
  }, [frame, t, base, listos, post]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
      {/* con la voz tratada («pro») la música viene agachada bajo esa voz */}
      <Audio src={staticFile(VOZ_NICO.endsWith("pro") ? `audio/existir-${VOZ_NICO}.wav` : K.musica)} volume={1} />
      {!LOCUCION && VOZ_REAL.map((v, k) => (
        <Sequence key={k} from={Math.round(v * K.fps)}>
          <Audio src={staticFile(`voz/existir${VOZ_NICO ? "-" + VOZ_NICO : ""}/${k + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
