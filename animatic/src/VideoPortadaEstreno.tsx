import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, getInputProps, staticFile } from "remotion";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { MONO, SANS } from "./theme";

// Cover for the trailer and the premiere (1920 × 1080). props: { v: "a" | "b" | "c" }
const W = 1920, H = 1080;
const LUGARES: [number, number, number][] = [[-0.7436447860, 0.1318252536, 0.006], [0.2925, 0.0149, 0.03], [-0.10109636, 0.95628651, 0.05], [-0.77568377, 0.13646737, 0.004],
  [-1.40115519, 0.0, 0.004], [-1.7687, 0.0017, 0.01], [-0.16070135, 1.0375665, 0.02], [-1.25066, 0.02012, 0.006], [-0.7473, 0.1102, 0.03], [0.3245, 0.0425, 0.02]];
const YT = typeof Path2D !== "undefined" ? [new Path2D("M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"), new Path2D("m10 15 5-3-5-3z")] : null;
type Ctx = CanvasRenderingContext2D;
const sp = (c: Ctx, v: number) => { (c as unknown as { letterSpacing: string }).letterSpacing = `${v}px`; };
const linea = (ctx: Ctx, txt: string, x: number, y: number, tam: number, col: string, fam: string, peso: number, esp: number, alin: CanvasTextAlign = "center", glow = 0.4) => {
  ctx.save(); ctx.font = `${peso} ${tam}px "${fam}"`; sp(ctx, esp); ctx.textAlign = alin;
  const dx = alin === "center" ? esp / 2 : 0;
  ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)"; ctx.fillStyle = `rgba(${col},${glow})`; ctx.fillText(txt, x + dx, y);
  ctx.globalCompositeOperation = "source-over"; ctx.filter = "none"; ctx.fillStyle = `rgba(${col},0.97)`; ctx.fillText(txt, x + dx, y); ctx.restore();
};
// a line of large letters, each filled with a fractal world of its own (as the film's title)
const fractalTexto = (ctx: Ctx, texto: string, x0: number, y: number, tam: number, esp: number, alin: "center" | "left", semilla = 0) => {
  const capa = document.createElement("canvas"); capa.width = W; capa.height = H; const c = capa.getContext("2d")!;
  const le = document.createElement("canvas"); le.width = W; le.height = H; const l = le.getContext("2d")!;
  c.font = `700 ${tam}px "${SANS}"`;
  const anchos = [...texto].map((ch) => c.measureText(ch).width), total = anchos.reduce((a, b) => a + b, 0) + esp * (texto.length - 1);
  let x = alin === "center" ? x0 - total / 2 : x0;
  [...texto].forEach((ch, i) => {
    const wch = anchos[i] + esp;
    if (ch !== " ") {
      l.globalCompositeOperation = "source-over"; l.clearRect(0, 0, W, H);
      const [vx, vy, va] = LUGARES[(i + semilla) % LUGARES.length], bw = Math.ceil(wch + 30), bh = Math.ceil(tam * 1.4);
      const f = pintarFractalTeaser(bw, bh, { cx: vx, cy: vy, esc: (7 * va) / bw, rot: 0, modo: 0, lente: 1e9, fase: (i + semilla) * 0.37, paleta: PALETAS[(i + semilla) % 4], brillo: 1.0, maxIt: 600, tiempo: 1 });
      l.drawImage(f, x - 15, y - tam * 1.05, bw, bh);
      l.globalCompositeOperation = "lighter"; l.fillStyle = "rgba(175,155,195,0.45)"; l.fillRect(x - 15, y - tam * 1.05, bw, bh);
      l.globalCompositeOperation = "destination-in"; l.font = `700 ${tam}px "${SANS}"`; l.fillStyle = "#fff"; l.textAlign = "left"; l.fillText(ch, x, y);
      c.drawImage(le, 0, 0);
    }
    x += wch;
  });
  ctx.save(); ctx.drawImage(capa, 0, 0); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.4; ctx.filter = "blur(16px)"; ctx.drawImage(capa, 0, 0); ctx.restore();
};
const youtube = (ctx: Ctx, x0: number, y: number, k: number, texto: string, tam: number, alin: "center" | "left") => {
  ctx.save(); ctx.font = `600 ${tam}px "${SANS}"`; sp(ctx, 3);
  const tw = ctx.measureText(texto).width, iw = 24 * k, x = alin === "center" ? x0 - (iw + 18 + tw) / 2 : x0;
  if (YT) { ctx.save(); ctx.translate(x, y - 12 * k - tam * 0.35); ctx.scale(k, k); ctx.shadowColor = "rgba(255,40,40,0.5)"; ctx.shadowBlur = 14; ctx.fillStyle = "#FF0000"; ctx.fill(YT[0]); ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.fill(YT[1]); ctx.restore(); }
  ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,244,222,0.95)"; ctx.fillText(texto, x + iw + 18, y); ctx.restore();
};
const FONDOS: Record<string, string> = { a: "trailer/fondo_julia.jpg", b: "trailer/fondo_mandel.jpg", c: "trailer/fondo_red.jpg" };
export const VideoPortadaEstreno: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const v = ((getInputProps() as { v?: string }).v ?? "a") as "a" | "b" | "c";
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [espera] = useState(() => delayRender("fondo"));
  useLayoutEffect(() => { const i = new Image(); i.onload = () => { setImg(i); continueRender(espera); }; i.src = staticFile(FONDOS[v]); }, [espera, v]);
  useLayoutEffect(() => {
    if (!img) return;
    const ctx = ref.current!.getContext("2d")!;
    ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
    const AM = "255,190,120", CR = "255,244,222";
    if (v === "a") {
      ctx.save(); ctx.filter = "brightness(1.5) saturate(1.2)"; ctx.drawImage(img, 0, 0, W, H); ctx.restore();
      const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 900); g.addColorStop(0, "rgba(2,3,6,0.72)"); g.addColorStop(1, "rgba(2,3,6,0.25)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      linea(ctx, "UN DOCUMENTAL DE B&N LECTURES", W / 2, 250, 22, CR, MONO, 500, 12, "center", 0.2);
      fractalTexto(ctx, "LA FRONTERA", W / 2, 440, 168, 14, "center");
      linea(ctx, "FRACTALES: LA GEOMETRÍA DEL INFINITO", W / 2, 520, 36, AM, SANS, 600, 8, "center", 0.35);
      ctx.save(); ctx.strokeStyle = "rgba(255,190,120,0.5)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(W / 2 - 260, 600); ctx.lineTo(W / 2 + 260, 600); ctx.stroke(); ctx.restore();
      linea(ctx, "ESTRENO", W / 2, 680, 26, AM, MONO, 500, 16, "center", 0.35);
      linea(ctx, "7 DE NOVIEMBRE", W / 2, 790, 96, CR, SANS, 300, 22, "center", 0.45);
      youtube(ctx, W / 2, 880, 2.4, "YOUTUBE  ·  @bnlectures", 36, "center");
    } else if (v === "b") {
      ctx.save(); ctx.filter = "brightness(1.15) saturate(1.15)"; ctx.drawImage(img, 0, 0, W, H); ctx.restore();
      const g = ctx.createLinearGradient(0, 0, W * 0.75, 0); g.addColorStop(0, "rgba(2,3,6,0.96)"); g.addColorStop(0.55, "rgba(2,3,6,0.7)"); g.addColorStop(1, "rgba(2,3,6,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const X = 140;
      linea(ctx, "ESTRENO EN YOUTUBE", X, 230, 26, AM, MONO, 500, 14, "left", 0.35);
      fractalTexto(ctx, "7 NOV", X, 470, 250, 18, "left", 3);
      fractalTexto(ctx, "LA FRONTERA", X, 650, 120, 10, "left");
      linea(ctx, "FRACTALES: LA GEOMETRÍA DEL INFINITO", X, 722, 32, AM, SANS, 600, 6, "left", 0.35);
      linea(ctx, "DOCUMENTAL  ·  64 MINUTOS  ·  10 CAPÍTULOS", X, 800, 22, CR, MONO, 500, 8, "left", 0.2);
      youtube(ctx, X, 900, 2.2, "@bnlectures", 36, "left");
    } else {
      ctx.save(); const s = 1.5; ctx.drawImage(img, W * 0.12 - (W * s - W) / 2, -(H * s - H) / 2, W * s, H * s); ctx.restore();
      const g = ctx.createLinearGradient(0, 0, W * 0.7, 0); g.addColorStop(0, "rgba(2,3,6,0.95)"); g.addColorStop(0.6, "rgba(2,3,6,0.6)"); g.addColorStop(1, "rgba(2,3,6,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const X = 140;
      linea(ctx, "DEL COSMOS A LA ESPUMA CUÁNTICA", X, 260, 22, CR, MONO, 500, 10, "left", 0.2);
      fractalTexto(ctx, "LA FRONTERA", X, 440, 150, 12, "left");
      linea(ctx, "FRACTALES: LA GEOMETRÍA DEL INFINITO", X, 520, 34, AM, SANS, 600, 7, "left", 0.35);
      linea(ctx, "ESTRENO", X, 660, 26, AM, MONO, 500, 16, "left", 0.35);
      linea(ctx, "7 DE NOVIEMBRE", X, 765, 92, CR, SANS, 300, 20, "left", 0.45);
      youtube(ctx, X, 860, 2.3, "YOUTUBE  ·  @bnlectures", 36, "left");
    }
    const pp = postProceso(ctx.canvas, W, H, { px: 1, semilla: 7, bloom: 0.32, expo: 0.94, aberr: 0.025, vineta: 0.5, grano: 0.04, scan: 0.12, curva: 0, esq: 0.02, impacto: 0, ruido: 0.4, flicker: 0, lineaY: -1, lineaA: 0, grade: 1.6, tiempo: 1, halo: 0.6 });
    if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
  }, [img, v]);
  return <AbsoluteFill style={{ backgroundColor: "#020306" }}><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
