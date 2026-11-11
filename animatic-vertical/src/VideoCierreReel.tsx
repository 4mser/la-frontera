import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { MONO, SANS } from "./theme";

// The fast-forward reel's end (1080 × 1920, 6 s): the title filled with living fractals over a turning Julia set,
// what the film is, and the premiere
const W = 1080, H = 1920, FPS = 30;
const LUGARES: [number, number, number][] = [[-0.7436447860, 0.1318252536, 0.006], [0.2925, 0.0149, 0.03], [-0.10109636, 0.95628651, 0.05], [-0.77568377, 0.13646737, 0.004],
  [-1.40115519, 0.0, 0.004], [-1.7687, 0.0017, 0.01], [-0.16070135, 1.0375665, 0.02], [-1.25066, 0.02012, 0.006], [-0.7473, 0.1102, 0.03], [0.3245, 0.0425, 0.02]];
const YT = typeof Path2D !== "undefined" ? [new Path2D("M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"), new Path2D("m10 15 5-3-5-3z")] : null;
const sv = (x: number) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
type Ctx = CanvasRenderingContext2D;
const sp = (c: Ctx, v: number) => { (c as unknown as { letterSpacing: string }).letterSpacing = `${v}px`; };
let capa: HTMLCanvasElement | null = null, le: HTMLCanvasElement | null = null;
export const VideoCierreReel: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext("2d")!, t = frame / FPS;
    ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
    const fondo = pintarFractalTeaser(W, H, { cx: -0.4, cy: 0.2, esc: (1.4 * Math.exp(-0.08 * t)) / W, rot: 0.03 * t, julia: [-0.8 + 0.02 * Math.cos(t * 0.4), 0.156 + 0.02 * Math.sin(t * 0.4)], modo: 0, lente: 1e9, fase: 0.03 * t, paleta: PALETAS[2], brillo: 0.9, maxIt: 400, tiempo: t });
    ctx.globalAlpha = 0.3 * sv(t / 0.6); ctx.drawImage(fondo, 0, 0, W, H); ctx.globalAlpha = 1;
    const linea = (txt: string, y: number, tam: number, col: string, fam: string, peso: number, esp: number, a: number, glow = 0.4) => {
      if (a <= 0.01) return;
      ctx.save(); ctx.font = `${peso} ${tam}px "${fam}"`; sp(ctx, esp); ctx.textAlign = "center"; ctx.globalAlpha = a;
      ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)"; ctx.fillStyle = `rgba(${col},${glow})`; ctx.fillText(txt, W / 2 + esp / 2, y);
      ctx.globalCompositeOperation = "source-over"; ctx.filter = "none"; ctx.fillStyle = `rgba(${col},0.97)`; ctx.fillText(txt, W / 2 + esp / 2, y); ctx.restore();
    };
    // the title
    if (!capa) { capa = document.createElement("canvas"); capa.width = W; capa.height = H; le = document.createElement("canvas"); le.width = W; le.height = H; }
    const c = capa.getContext("2d")!, l = le!.getContext("2d")!; c.clearRect(0, 0, W, H);
    const texto = "LA FRONTERA", tam = 136, esp = 8, yT = 640;
    c.font = `700 ${tam}px "${SANS}"`;
    const an = [...texto].map((ch) => c.measureText(ch).width);
    let x = W / 2 - (an.reduce((a, b) => a + b, 0) + esp * (texto.length - 1)) / 2;
    [...texto].forEach((ch, i) => {
      const w = an[i] + esp;
      if (ch !== " ") {
        l.globalCompositeOperation = "source-over"; l.clearRect(0, 0, W, H);
        const [vx, vy, va] = LUGARES[i % LUGARES.length], bw = Math.ceil(w + 30), bh = Math.ceil(tam * 1.4);
        l.drawImage(pintarFractalTeaser(bw, bh, { cx: vx, cy: vy, esc: (7 * va * Math.exp(-0.2 * t)) / bw, rot: 0, modo: 0, lente: 1e9, fase: 0.12 * t + i * 0.37, paleta: PALETAS[i % 4], brillo: 1.0, maxIt: 500, tiempo: t }), x - 15, yT - tam * 1.05, bw, bh);
        l.globalCompositeOperation = "lighter"; l.fillStyle = "rgba(175,155,195,0.5)"; l.fillRect(x - 15, yT - tam * 1.05, bw, bh);
        l.globalCompositeOperation = "destination-in"; l.font = `700 ${tam}px "${SANS}"`; l.fillStyle = "#fff"; l.textAlign = "left"; l.fillText(ch, x, yT);
        c.drawImage(le!, 0, 0);
      }
      x += w;
    });
    const at = sv(t / 0.7);
    ctx.save(); ctx.globalAlpha = at; ctx.filter = `blur(${(10 * (1 - at)).toFixed(1)}px)`; ctx.drawImage(capa, 0, 0); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.4 * at; ctx.filter = "blur(16px)"; ctx.drawImage(capa, 0, 0); ctx.restore();
    linea("FRACTALES: LA GEOMETRÍA DEL INFINITO", yT + 78, 34, "255,190,120", SANS, 600, 5, sv((t - 0.4) / 0.6), 0.35);
    linea("UN DOCUMENTAL DE B&N LECTURES", yT - 220, 22, "255,244,222", MONO, 500, 10, sv((t - 0.2) / 0.6), 0.2);
    linea("APERTURA  ·  10 CAPÍTULOS  ·  64 MINUTOS", 930, 30, "255,244,222", MONO, 500, 6, sv((t - 0.9) / 0.6), 0.25);
    linea("ESTRENO", 1180, 30, "255,190,120", MONO, 500, 16, sv((t - 1.5) / 0.6), 0.35);
    linea("7 DE NOVIEMBRE", 1300, 96, "255,244,222", SANS, 300, 16, sv((t - 1.7) / 0.6), 0.45);
    const ay = sv((t - 2.2) / 0.6);
    if (ay > 0.01 && YT) {
      ctx.save(); ctx.globalAlpha = ay; ctx.font = `600 44px "${SANS}"`; sp(ctx, 3);
      const tw = ctx.measureText("YOUTUBE  ·  @bnlectures").width, k = 2.6, iw = 24 * k, x0 = W / 2 - (iw + 20 + tw) / 2, yy = 1420;
      ctx.save(); ctx.translate(x0, yy - 12 * k - 15); ctx.scale(k, k); ctx.shadowColor = "rgba(255,40,40,0.5)"; ctx.shadowBlur = 14; ctx.fillStyle = "#FF0000"; ctx.fill(YT[0]); ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.fill(YT[1]); ctx.restore();
      ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,244,222,0.97)"; ctx.fillText("YOUTUBE  ·  @bnlectures", x0 + iw + 20, yy); ctx.restore();
    }
    const fin = sv((t - 5.3) / 0.7); if (fin > 0) { ctx.fillStyle = `rgba(2,3,6,${fin})`; ctx.fillRect(0, 0, W, H); }
    const pp = postProceso(ctx.canvas, W, H, { px: 1, semilla: frame % 97, bloom: 0.34, expo: 0.93, aberr: 0.03, vineta: 0.55, grano: 0.05, scan: 0.16, curva: 0, esq: 0.03, impacto: 0, ruido: 0.5, flicker: 0, lineaY: -1, lineaA: 0, grade: 1.7, tiempo: t, halo: 0.7 });
    if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
  }, [frame]);
  return <AbsoluteFill style={{ backgroundColor: "#020306" }}><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
