import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, getInputProps, staticFile } from "remotion";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { MONO, SANS } from "./theme";

// YouTube thumbnail (1280 × 720): one strong picture, a few very large words, strong contrast. props: { v }
const W = 1280, H = 720;
const LUGARES: [number, number, number][] = [[-0.7436447860, 0.1318252536, 0.006], [0.2925, 0.0149, 0.03], [-0.10109636, 0.95628651, 0.05], [-0.77568377, 0.13646737, 0.004],
  [-1.40115519, 0.0, 0.004], [-1.7687, 0.0017, 0.01], [-0.16070135, 1.0375665, 0.02], [-1.25066, 0.02012, 0.006], [-0.7473, 0.1102, 0.03], [0.3245, 0.0425, 0.02]];
type Ctx = CanvasRenderingContext2D;
const sp = (c: Ctx, v: number) => { (c as unknown as { letterSpacing: string }).letterSpacing = `${v}px`; };
const texto = (ctx: Ctx, t: string, x: number, y: number, tam: number, col: string, fam: string, peso: number, esp: number, alin: CanvasTextAlign, glow = 0.5) => {
  ctx.save(); ctx.font = `${peso} ${tam}px "${fam}"`; sp(ctx, esp); ctx.textAlign = alin;
  ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 18; ctx.fillStyle = `rgba(${col},1)`; ctx.fillText(t, x, y);
  ctx.shadowBlur = 0; ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(10px)"; ctx.fillStyle = `rgba(${col},${glow})`; ctx.fillText(t, x, y); ctx.restore();
};
const fractal = (ctx: Ctx, t: string, x0: number, y: number, tam: number, esp: number, alin: "left" | "center") => {
  const capa = document.createElement("canvas"); capa.width = W; capa.height = H; const c = capa.getContext("2d")!;
  const le = document.createElement("canvas"); le.width = W; le.height = H; const l = le.getContext("2d")!;
  c.font = `800 ${tam}px "${SANS}"`;
  const an = [...t].map((ch) => c.measureText(ch).width), tot = an.reduce((a, b) => a + b, 0) + esp * (t.length - 1);
  let x = alin === "center" ? x0 - tot / 2 : x0;
  [...t].forEach((ch, i) => {
    const w = an[i] + esp;
    if (ch !== " ") {
      l.globalCompositeOperation = "source-over"; l.clearRect(0, 0, W, H);
      const [vx, vy, va] = LUGARES[i % LUGARES.length], bw = Math.ceil(w + 20), bh = Math.ceil(tam * 1.3);
      l.drawImage(pintarFractalTeaser(bw, bh, { cx: vx, cy: vy, esc: (7 * va) / bw, rot: 0, modo: 0, lente: 1e9, fase: i * 0.37, paleta: PALETAS[i % 4], brillo: 1.05, maxIt: 600, tiempo: 1 }), x - 10, y - tam, bw, bh);
      l.globalCompositeOperation = "lighter"; l.fillStyle = "rgba(200,180,215,0.6)"; l.fillRect(x - 10, y - tam, bw, bh);
      l.globalCompositeOperation = "destination-in"; l.font = `800 ${tam}px "${SANS}"`; l.fillStyle = "#fff"; l.textAlign = "left"; l.fillText(ch, x, y);
      c.drawImage(le, 0, 0);
    }
    x += w;
  });
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 22; ctx.drawImage(capa, 0, 0); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.45; ctx.filter = "blur(12px)"; ctx.drawImage(capa, 0, 0); ctx.restore();
};
const etiqueta = (ctx: Ctx, t: string, x: number, y: number, tam: number, fondo: string, col: string) => {
  ctx.save(); ctx.font = `800 ${tam}px "${SANS}"`; sp(ctx, 3); const w = ctx.measureText(t).width + 34;
  ctx.fillStyle = fondo; ctx.beginPath(); ctx.roundRect(x, y - tam * 0.95, w, tam * 1.35, 10); ctx.fill();
  ctx.fillStyle = col; ctx.textAlign = "left"; ctx.fillText(t, x + 17, y); ctx.restore();
};
const FONDOS: Record<string, string> = { a: "trailer/fondo_mandel.jpg", b: "trailer/copia.jpg", c: "trailer/fondo_julia.jpg" };
export const VideoPortadaYoutube: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const v = ((getInputProps() as { v?: string }).v ?? "a") as "a" | "b" | "c";
  // doc: the thumbnail of the full documentary (no trailer or premiere badge)
  const doc = (getInputProps() as { doc?: boolean }).doc === true;
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [espera] = useState(() => delayRender("fondo"));
  useLayoutEffect(() => { const i = new Image(); i.onload = () => { setImg(i); continueRender(espera); }; i.src = staticFile(FONDOS[v]); }, [espera, v]);
  useLayoutEffect(() => {
    if (!img) return;
    const ctx = ref.current!.getContext("2d")!;
    ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
    const CR = "255,246,228", AM = "255,190,110";
    if (v === "a") {
      // the seahorses of the Mandelbrot set, bright, on the right; on the left, the date and the title
      ctx.save(); ctx.filter = "brightness(1.5) saturate(1.5) contrast(1.15)"; ctx.drawImage(img, -W * 0.02, -H * 0.12, W * 1.24, H * 1.24); ctx.restore();
      const g = ctx.createLinearGradient(0, 0, W * 0.72, 0); g.addColorStop(0, "rgba(2,3,6,0.97)"); g.addColorStop(0.55, "rgba(2,3,6,0.75)"); g.addColorStop(1, "rgba(2,3,6,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      etiqueta(ctx, "TRÁILER", 70, 140, 34, "rgba(255,0,0,0.95)", "#fff");
      texto(ctx, "ESTRENO", 74, 205, 30, AM, SANS, 800, 10, "left", 0.4);
      texto(ctx, "7 NOV", 62, 395, 210, CR, SANS, 800, 4, "left", 0.5);
      fractal(ctx, "LA FRONTERA", 70, 525, 96, 6, "left");
      texto(ctx, "FRACTALES: LA GEOMETRÍA DEL INFINITO", 74, 590, 31, AM, SANS, 700, 2, "left", 0.35);
    } else if (v === "b") {
      // the copy at ×10⁵⁶, full frame, and the number that says where it is
      ctx.save(); ctx.filter = "brightness(1.1) saturate(1.2) contrast(1.08)"; ctx.drawImage(img, 0, 0, W, H); ctx.restore();
      const g = ctx.createLinearGradient(0, H * 0.55, 0, H); g.addColorStop(0, "rgba(2,3,6,0)"); g.addColorStop(1, "rgba(2,3,6,0.92)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const g2 = ctx.createLinearGradient(0, 0, W * 0.5, 0); g2.addColorStop(0, "rgba(2,3,6,0.85)"); g2.addColorStop(1, "rgba(2,3,6,0)");
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
      texto(ctx, "×10", 60, 300, 190, CR, SANS, 800, 2, "left", 0.5);
      texto(ctx, "56", 60 + 345, 190, 100, CR, SANS, 800, 2, "left", 0.5);
      texto(ctx, "Y SIGUE IGUAL", 66, 380, 56, AM, SANS, 800, 4, "left", 0.4);
      fractal(ctx, "LA FRONTERA", 70, 640, 96, 6, "left");
      etiqueta(ctx, doc ? "DOCUMENTAL COMPLETO" : "TRÁILER · 7 NOV", doc ? 742 : 820, doc ? 92 : 640, 32, "rgba(255,0,0,0.95)", "#fff");
    } else {
      // the question, very large, over the trailer's last background
      ctx.save(); ctx.filter = "brightness(1.9) saturate(1.4) contrast(1.1)"; ctx.drawImage(img, 0, 0, W, H); ctx.restore();
      ctx.fillStyle = "rgba(2,3,6,0.45)"; ctx.fillRect(0, 0, W, H);
      texto(ctx, "¿HASTA DÓNDE", W / 2, 230, 118, CR, SANS, 800, 2, "center", 0.5);
      texto(ctx, "LLEGA UNA FORMA?", W / 2, 360, 104, CR, SANS, 800, 2, "center", 0.5);
      fractal(ctx, "LA FRONTERA", W / 2, 520, 92, 6, "center");
      etiqueta(ctx, doc ? "DOCUMENTAL COMPLETO" : "TRÁILER · ESTRENO 7 NOV", W / 2 - (doc ? 190 : 230), 640, 32, "rgba(255,0,0,0.95)", "#fff");
    }
    ctx.save(); const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.95); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.45)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); ctx.restore();
  }, [img, v]);
  return <AbsoluteFill style={{ backgroundColor: "#020306" }}><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
