import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, getInputProps, useCurrentFrame } from "remotion";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { SANS } from "./theme";

// The trailer's intertitles: one line in large letters, each letter filled with a fractal world of its own that keeps
// moving (as the film's title); it comes out of a blur, holds while its worlds dive, and goes back into the blur.
// props: { texto, dur }
type P = { texto?: string; dur?: number; transparente?: boolean };
const W = 1920, H = 1080, FPS = 30;
const sv = (x: number) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
export const interDur = () => Math.round(((getInputProps() as P).dur ?? 2.4) * FPS);
// places on the border of the Mandelbrot set (seahorses, spirals, a dendrite, Feigenbaum's point…)
const LUGARES: [number, number, number][] = [[-0.7436447860, 0.1318252536, 0.006], [0.2925, 0.0149, 0.03], [-0.10109636, 0.95628651, 0.05], [-0.77568377, 0.13646737, 0.004],
  [-1.40115519, 0.0, 0.004], [-1.7687, 0.0017, 0.01], [-0.16070135, 1.0375665, 0.02], [-1.25066, 0.02012, 0.006], [-0.7473, 0.1102, 0.03], [0.3245, 0.0425, 0.02]];
let capa: HTMLCanvasElement | null = null, letra: HTMLCanvasElement | null = null;
export const VideoIntertitulo: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const { texto = "TODO TIENE UNA FORMA", dur = 2.4, transparente = false } = getInputProps() as P;
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext("2d")!, t = frame / FPS;
    if (!capa) { capa = document.createElement("canvas"); capa.width = W; capa.height = H; letra = document.createElement("canvas"); letra.width = W; letra.height = H; }
    const c = capa.getContext("2d")!, l = letra!.getContext("2d")!;
    if (transparente) ctx.clearRect(0, 0, W, H); else { ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H); }
    c.clearRect(0, 0, W, H);
    const tam = texto.length > 26 ? 74 : texto.length > 18 ? 90 : 112, esp = texto.length > 26 ? 10 : 14;
    c.font = `700 ${tam}px "${SANS}"`; (c as unknown as { letterSpacing: string }).letterSpacing = "0px";
    const anchos = [...texto].map((ch) => c.measureText(ch).width);
    const total = anchos.reduce((a, b) => a + b, 0) + esp * (texto.length - 1);
    let x = W / 2 - total / 2; const y = H / 2 + tam * 0.36;
    [...texto].forEach((ch, i) => {
      const wch = anchos[i] + esp;
      if (ch !== " ") {
        l.globalCompositeOperation = "source-over"; l.clearRect(0, 0, W, H);
        const [vx, vy, va] = LUGARES[(i * 3) % LUGARES.length];
        const bw = Math.ceil(wch + 40), bh = Math.ceil(tam * 1.4);
        const f = pintarFractalTeaser(bw, bh, { cx: vx, cy: vy, esc: (7 * va * Math.exp(-0.22 * t)) / bw, rot: 0.05 * t * (i % 2 ? 1 : -1), modo: 0, lente: 1e9, fase: 0.12 * t + i * 0.37, paleta: PALETAS[i % 4], brillo: 1.0, maxIt: 500, tiempo: t });
        l.drawImage(f, x - 20, y - tam * 1.05, bw, bh);
        l.globalCompositeOperation = "lighter"; l.fillStyle = "rgba(175,155,195,0.5)"; l.fillRect(x - 20, y - tam * 1.05, bw, bh);
        l.globalCompositeOperation = "destination-in"; l.font = `700 ${tam}px "${SANS}"`; l.fillStyle = "#fff"; l.textAlign = "left"; l.fillText(ch, x, y);
        c.drawImage(letra!, 0, 0);
      }
      x += wch;
    });
    const ent = sv(t / 0.8), sal = 1 - sv((t - (dur - 0.7)) / 0.7), a = ent * sal;
    const z = 1.06 - 0.06 * sv(t / 0.9) + 0.02 * (t / dur);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    ctx.globalAlpha = a; ctx.filter = `blur(${(10 * (1 - ent) + 8 * (1 - sal)).toFixed(1)}px)`; ctx.drawImage(capa, 0, 0);
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a * 0.35; ctx.filter = "blur(16px)"; ctx.drawImage(capa, 0, 0);
    ctx.restore();
    const pp = transparente ? null : postProceso(ctx.canvas, W, H, { px: 1, semilla: frame % 97, bloom: 0.36, expo: 0.92, aberr: 0.03, vineta: 0.62, grano: 0.05, scan: 0.18, curva: 0, esq: 0.03, impacto: 0, ruido: 0.5, flicker: 0, lineaY: -1, lineaA: 0, grade: 1.8, tiempo: t, halo: 0.75 });
    if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
  }, [frame, texto, dur, transparente]);
  return <AbsoluteFill style={{ backgroundColor: transparente ? "transparent" : "#000" }}><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
