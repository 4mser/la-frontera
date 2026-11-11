import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { MONO, SANS } from "./theme";

// The trailer's cover (1080 × 1920, everything that matters inside the 4:5 the profile grid shows): the copy at ×10⁵⁶
// become an iris, the title filled with living fractals (as in the film), the premiere
const W = 1080, H = 1920;
const LUGARES: [number, number, number][] = [[-0.7436447860, 0.1318252536, 0.006], [0.2925, 0.0149, 0.03], [-0.10109636, 0.95628651, 0.05], [-0.77568377, 0.13646737, 0.004],
  [-1.40115519, 0.0, 0.004], [-1.7687, 0.0017, 0.01], [-0.16070135, 1.0375665, 0.02], [-1.25066, 0.02012, 0.006], [-0.7473, 0.1102, 0.03], [0.3245, 0.0425, 0.02]];
const YT = typeof Path2D !== "undefined" ? [new Path2D("M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"), new Path2D("m10 15 5-3-5-3z")] : null;
export const VideoPortadaTrailer: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [espera] = useState(() => delayRender("fondo"));
  useLayoutEffect(() => { const i = new Image(); i.onload = () => { setImg(i); continueRender(espera); }; i.src = staticFile("trailer/portada_fondo.jpg"); }, [espera]);
  useLayoutEffect(() => {
    if (!img) return;
    const ctx = ref.current!.getContext("2d")!;
    ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
    // the iris, its pupil a little below the centre of the 4:5
    const s = 1.08, iw = img.width * s, ih = img.height * s;
    ctx.drawImage(img, W / 2 - iw / 2, H * 0.53 - ih / 2, iw, ih);
    // the dark above and below, for the words
    const g1 = ctx.createLinearGradient(0, 0, 0, H * 0.42); g1.addColorStop(0, "rgba(2,3,6,0.97)"); g1.addColorStop(0.55, "rgba(2,3,6,0.75)"); g1.addColorStop(1, "rgba(2,3,6,0)");
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H * 0.42);
    const g2 = ctx.createLinearGradient(0, H * 0.62, 0, H); g2.addColorStop(0, "rgba(2,3,6,0)"); g2.addColorStop(0.45, "rgba(2,3,6,0.8)"); g2.addColorStop(1, "rgba(2,3,6,0.97)");
    ctx.fillStyle = g2; ctx.fillRect(0, H * 0.62, W, H * 0.38);
    const linea = (txt: string, y: number, tam: number, col: string, fam: string, peso: number, esp: number, glow = 0.4) => {
      ctx.save(); ctx.font = `${peso} ${tam}px "${fam}"`; (ctx as unknown as { letterSpacing: string }).letterSpacing = `${esp}px`; ctx.textAlign = "center";
      ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)"; ctx.fillStyle = `rgba(${col},${glow})`; ctx.fillText(txt, W / 2 + esp / 2, y);
      ctx.globalCompositeOperation = "source-over"; ctx.filter = "none"; ctx.fillStyle = `rgba(${col},0.97)`; ctx.fillText(txt, W / 2 + esp / 2, y); ctx.restore();
    };
    // the title: every letter its own fractal world
    const texto = "LA FRONTERA", tam = 132, esp = 10, yT = 520;
    const capa = document.createElement("canvas"); capa.width = W; capa.height = H; const c = capa.getContext("2d")!;
    const let_ = document.createElement("canvas"); let_.width = W; let_.height = H; const l = let_.getContext("2d")!;
    c.font = `700 ${tam}px "${SANS}"`;
    const anchos = [...texto].map((ch) => c.measureText(ch).width);
    let x = W / 2 - (anchos.reduce((a, b) => a + b, 0) + esp * (texto.length - 1)) / 2;
    [...texto].forEach((ch, i) => {
      const wch = anchos[i] + esp;
      if (ch !== " ") {
        l.globalCompositeOperation = "source-over"; l.clearRect(0, 0, W, H);
        const [vx, vy, va] = LUGARES[i % LUGARES.length], bw = Math.ceil(wch + 30), bh = Math.ceil(tam * 1.4);
        const f = pintarFractalTeaser(bw, bh, { cx: vx, cy: vy, esc: (7 * va) / bw, rot: 0, modo: 0, lente: 1e9, fase: i * 0.37, paleta: PALETAS[i % 4], brillo: 1.0, maxIt: 600, tiempo: 1 });
        l.drawImage(f, x - 15, yT - tam * 1.05, bw, bh);
        l.globalCompositeOperation = "lighter"; l.fillStyle = "rgba(175,155,195,0.45)"; l.fillRect(x - 15, yT - tam * 1.05, bw, bh);
        l.globalCompositeOperation = "destination-in"; l.font = `700 ${tam}px "${SANS}"`; l.fillStyle = "#fff"; l.textAlign = "left"; l.fillText(ch, x, yT);
        c.drawImage(let_, 0, 0);
      }
      x += wch;
    });
    ctx.save(); ctx.drawImage(capa, 0, 0); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.4; ctx.filter = "blur(16px)"; ctx.drawImage(capa, 0, 0); ctx.restore();
    linea("FRACTALES: LA GEOMETRÍA DEL INFINITO", yT + 76, 30, "255,190,120", SANS, 600, 6, 0.35);
    linea("UN DOCUMENTAL DE B&N LECTURES", 400 - 60, 20, "255,244,222", MONO, 500, 9, 0.2);
    // the premiere
    linea("ESTRENO", 1430, 24, "255,190,120", MONO, 500, 14, 0.35);
    linea("7 DE NOVIEMBRE", 1520, 78, "255,244,222", SANS, 300, 16, 0.45);
    ctx.save(); ctx.font = `600 34px "${SANS}"`; (ctx as unknown as { letterSpacing: string }).letterSpacing = "3px";
    const tw = ctx.measureText("YOUTUBE  ·  @bnlectures").width, k = 2.4, iw2 = 24 * k, x0 = W / 2 - (iw2 + 18 + tw) / 2, yy = 1600;
    if (YT) { ctx.save(); ctx.translate(x0, yy - 12 * k - 12); ctx.scale(k, k); ctx.shadowColor = "rgba(255,40,40,0.5)"; ctx.shadowBlur = 14; ctx.fillStyle = "#FF0000"; ctx.fill(YT[0]); ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.fill(YT[1]); ctx.restore(); }
    ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,244,222,0.95)"; ctx.fillText("YOUTUBE  ·  @bnlectures", x0 + iw2 + 18, yy); ctx.restore();
    const pp = postProceso(ctx.canvas, W, H, { px: 1, semilla: 7, bloom: 0.32, expo: 0.94, aberr: 0.025, vineta: 0.5, grano: 0.04, scan: 0.12, curva: 0, esq: 0.02, impacto: 0, ruido: 0.4, flicker: 0, lineaY: -1, lineaA: 0, grade: 1.6, tiempo: 1, halo: 0.6 });
    if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
  }, [img]);
  return <AbsoluteFill style={{ backgroundColor: "#020306" }}><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
