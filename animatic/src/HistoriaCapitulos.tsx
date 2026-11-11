import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { MONO, SANS } from "./theme";

// Instagram story (1080 × 1920): the film goes out episode by episode on Instagram, TikTok and YouTube, and the full film is
// already on YouTube. Same language as the premiere cover (title filled with fractal worlds, amber and cream, retro
// finish). Content stays between y = 250 and y = 1670; the band ZONA is left empty for Instagram's link sticker.
// The brand is named in the kicker (a logo over the fractal fought with it).
// props: { v: "a" | "b", guia?: boolean } — a: the opening Julia, b: the spirals of a Misiurewicz point.
const W = 1080, H = 1920;
export const ZONA = { y: 1550, h: 120 };
const LUGARES: [number, number, number][] = [[-0.7436447860, 0.1318252536, 0.006], [0.2925, 0.0149, 0.03], [-0.10109636, 0.95628651, 0.05], [-0.77568377, 0.13646737, 0.004],
  [-1.40115519, 0.0, 0.004], [-1.7687, 0.0017, 0.01], [-0.16070135, 1.0375665, 0.02], [-1.25066, 0.02012, 0.006], [-0.7473, 0.1102, 0.03], [0.3245, 0.0425, 0.02]];
const YT = typeof Path2D !== "undefined" ? [new Path2D("M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"), new Path2D("m10 15 5-3-5-3z")] : null;
// Instagram glyph (lucide, ISC): rounded square, lens and dot
const IG = typeof Path2D !== "undefined" ? [new Path2D("M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z"), new Path2D("M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z")] : null;
// TikTok note (simple-icons, CC0)
const TT = typeof Path2D !== "undefined" ? new Path2D("M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z") : null;
type Ctx = CanvasRenderingContext2D;
const sp = (c: Ctx, v: number) => { (c as unknown as { letterSpacing: string }).letterSpacing = `${v}px`; };
const AM = "255,190,120", CR = "255,244,222";

const linea = (ctx: Ctx, txt: string, y: number, tam: number, col: string, fam: string, peso: number, esp: number, glow = 0.4, alfa = 0.97) => {
  ctx.save(); ctx.font = `${peso} ${tam}px "${fam}"`; sp(ctx, esp); ctx.textAlign = "center";
  const x = W / 2 + esp / 2;
  ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(10px)"; ctx.fillStyle = `rgba(${col},${glow})`; ctx.fillText(txt, x, y);
  ctx.globalCompositeOperation = "source-over"; ctx.filter = "none"; ctx.fillStyle = `rgba(${col},${alfa})`; ctx.fillText(txt, x, y); ctx.restore();
};

// a line of large letters, each filled with a fractal world of its own (as the film's title)
const fractalTexto = (ctx: Ctx, texto: string, y: number, tam: number, esp: number, semilla = 0) => {
  const capa = document.createElement("canvas"); capa.width = W; capa.height = H; const c = capa.getContext("2d")!;
  const le = document.createElement("canvas"); le.width = W; le.height = H; const l = le.getContext("2d")!;
  c.font = `700 ${tam}px "${SANS}"`;
  const anchos = [...texto].map((ch) => c.measureText(ch).width), total = anchos.reduce((a, b) => a + b, 0) + esp * (texto.length - 1);
  let x = W / 2 - total / 2;
  [...texto].forEach((ch, i) => {
    const wch = anchos[i] + esp;
    if (ch !== " ") {
      l.globalCompositeOperation = "source-over"; l.clearRect(0, 0, W, H);
      const [vx, vy, va] = LUGARES[(i + semilla) % LUGARES.length], bw = Math.ceil(wch + 30), bh = Math.ceil(tam * 1.4);
      const f = pintarFractalTeaser(bw * 2, bh * 2, { cx: vx, cy: vy, esc: (7 * va) / (bw * 2), rot: 0, modo: 0, lente: 1e9, fase: (i + semilla) * 0.37, paleta: PALETAS[(i + semilla) % 4], brillo: 1.0, maxIt: 600, tiempo: 1 });
      l.drawImage(f, x - 15, y - tam * 1.05, bw, bh);
      l.globalCompositeOperation = "lighter"; l.fillStyle = "rgba(175,155,195,0.45)"; l.fillRect(x - 15, y - tam * 1.05, bw, bh);
      l.globalCompositeOperation = "destination-in"; l.font = `700 ${tam}px "${SANS}"`; l.fillStyle = "#fff"; l.textAlign = "left"; l.fillText(ch, x, y);
      c.drawImage(le, 0, 0);
    }
    x += wch;
  });
  ctx.save(); ctx.drawImage(capa, 0, 0); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.4; ctx.filter = "blur(14px)"; ctx.drawImage(capa, 0, 0); ctx.restore();
};

// the three platforms side by side, centred: [icon] INSTAGRAM  ·  [icon] TIKTOK  ·  [icon] YOUTUBE
const plataformas = (ctx: Ctx, y: number) => {
  const tam = 28, k = 1.75, iw = 24 * k, gap = 14, sepw = 56;
  ctx.save(); ctx.font = `600 ${tam}px "${SANS}"`; sp(ctx, 3);
  const items: [string, "ig" | "tt" | "yt"][] = [["INSTAGRAM", "ig"], ["TIKTOK", "tt"], ["YOUTUBE", "yt"]];
  const anchos = items.map(([t]) => ctx.measureText(t).width);
  let x = W / 2 - (anchos.reduce((a, b) => a + b, 0) + items.length * (iw + gap) + (items.length - 1) * sepw) / 2;
  const icono = (tipo: "ig" | "tt" | "yt") => {
    ctx.save(); ctx.translate(x, y - 12 * k - tam * 0.35); ctx.scale(k, k);
    if (tipo === "yt" && YT) { ctx.shadowColor = "rgba(255,40,40,0.5)"; ctx.shadowBlur = 14; ctx.fillStyle = "#FF0000"; ctx.fill(YT[0]); ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.fill(YT[1]); }
    else if (tipo === "tt" && TT) {
      // the note with its cyan and red echoes, as the brand draws it
      ctx.save(); ctx.translate(-0.9, -0.6); ctx.fillStyle = "rgba(37,244,238,0.9)"; ctx.fill(TT); ctx.restore();
      ctx.save(); ctx.translate(0.9, 0.6); ctx.fillStyle = "rgba(254,44,85,0.9)"; ctx.fill(TT); ctx.restore();
      ctx.shadowColor = `rgba(${CR},0.4)`; ctx.shadowBlur = 10; ctx.fillStyle = `rgba(${CR},0.97)`; ctx.fill(TT);
    } else if (tipo === "ig" && IG) {
      ctx.shadowColor = `rgba(${CR},0.45)`; ctx.shadowBlur = 10; ctx.strokeStyle = `rgba(${CR},0.95)`; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.stroke(IG[0]); ctx.stroke(IG[1]); ctx.beginPath(); ctx.arc(17.5, 6.5, 1.2, 0, Math.PI * 2); ctx.fillStyle = `rgba(${CR},0.95)`; ctx.fill();
    }
    ctx.restore(); x += iw + gap;
  };
  items.forEach(([t, tipo], i) => {
    icono(tipo); ctx.textAlign = "left"; ctx.fillStyle = `rgba(${CR},0.95)`; ctx.fillText(t, x, y); x += anchos[i];
    if (i < items.length - 1) { ctx.fillStyle = `rgba(${AM},0.8)`; ctx.textAlign = "center"; ctx.fillText("·", x + sepw / 2, y); x += sepw; }
  });
  ctx.restore();
};

const separador = (ctx: Ctx, y: number, media = 200) => {
  ctx.save(); const g = ctx.createLinearGradient(W / 2 - media, 0, W / 2 + media, 0);
  g.addColorStop(0, `rgba(${AM},0)`); g.addColorStop(0.5, `rgba(${AM},0.55)`); g.addColorStop(1, `rgba(${AM},0)`);
  ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(W / 2 - media, y); ctx.lineTo(W / 2 + media, y); ctx.stroke(); ctx.restore();
};

// a thin drawn arrow pointing down to the sticker, with a soft glow
const flecha = (ctx: Ctx, y0: number, y1: number) => {
  ctx.save(); ctx.strokeStyle = `rgba(${AM},0.9)`; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.shadowColor = `rgba(${AM},0.6)`; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.moveTo(W / 2, y0); ctx.lineTo(W / 2, y1); ctx.moveTo(W / 2 - 13, y1 - 15); ctx.lineTo(W / 2, y1); ctx.lineTo(W / 2 + 13, y1 - 15); ctx.stroke(); ctx.restore();
};

type Vista = { cx: number; cy: number; ancho: number; julia?: [number, number]; pal: number; fase: number; rot: number };
const VISTAS: Record<string, Vista> = {
  // the opening Julia (as the LinkedIn cover chosen on 24 Oct), turned to stand upright
  a: { cx: 0, cy: 0, ancho: 4.4, julia: [-0.835, -0.2321], pal: 0, fase: 0.3, rot: Math.PI / 2 + 0.2 },
  // spirals inside spirals: the Misiurewicz point of the closing act
  b: { cx: -0.77568377 + 0.0004, cy: 0.13646737 + 0.0006, ancho: 0.0042, pal: 2, fase: 0.4, rot: 0.3 },
};

export const HistoriaCapitulos: React.FC<{ v?: string; guia?: boolean }> = ({ v = "a", guia = false }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [espera] = useState(() => delayRender("historia"));
  useLayoutEffect(() => {
    const i = new Image();
    i.onload = () => { Promise.all([`700 40px "${SANS}"`, `600 40px "${SANS}"`, `400 40px "${SANS}"`, `300 40px "${SANS}"`, `500 24px "${MONO}"`].map((f) => document.fonts.load(f))).then(() => setLogo(i)); };
    i.src = staticFile("lectures-logo.png");
  }, []);
  useLayoutEffect(() => {
    if (!logo) return;
    const ctx = ref.current!.getContext("2d")!;
    const V = VISTAS[v] ?? VISTAS.a;
    ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
    // the fractal fills the top of the frame and sinks into night where the text begins
    const ss = 2, y0 = 125, alto = 800;
    const f = pintarFractalTeaser(W * ss, alto * ss, {
      cx: V.cx, cy: V.cy, esc: V.ancho / (W * ss), rot: V.rot, julia: V.julia, modo: 0, lente: 1e9, fase: V.fase, paleta: PALETAS[V.pal], brillo: 0.95,
      maxIt: V.julia ? 420 : Math.round(260 + 170 * Math.log10(Math.max(1, 2.8 / ((V.ancho / (W * ss)) * ss * 1920)))), tiempo: 0,
    });
    // feathered at the top and bottom, so the frame never shows where the drawing ends
    const capa = document.createElement("canvas"); capa.width = W; capa.height = H; const cc = capa.getContext("2d")!;
    cc.imageSmoothingQuality = "high"; cc.filter = "brightness(1.25) saturate(1.15)"; cc.drawImage(f, 0, y0, W, alto); cc.filter = "none";
    const m = cc.createLinearGradient(0, y0, 0, y0 + alto);
    m.addColorStop(0, "rgba(0,0,0,0)"); m.addColorStop(0.18, "rgba(0,0,0,1)"); m.addColorStop(0.8, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0)");
    cc.globalCompositeOperation = "destination-in"; cc.fillStyle = m; cc.fillRect(0, 0, W, H);
    ctx.drawImage(capa, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(2,3,6,0.9)"); g.addColorStop(0.1, "rgba(2,3,6,0.15)"); g.addColorStop(0.3, "rgba(2,3,6,0.05)");
    g.addColorStop(0.4, "rgba(2,3,6,0.55)"); g.addColorStop(0.48, "rgba(2,3,6,0.93)"); g.addColorStop(1, "#020306");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    linea(ctx, "UN DOCUMENTAL DE B&N LECTURES", 840, 22, CR, MONO, 500, 10, 0.2, 0.85);
    fractalTexto(ctx, "LA FRONTERA", 962, 118, 10);
    linea(ctx, "FRACTALES: LA GEOMETRÍA DEL INFINITO", 1024, 29, AM, SANS, 600, 5, 0.35);
    separador(ctx, 1086);

    linea(ctx, "CAPÍTULO A CAPÍTULO", 1160, 24, AM, MONO, 500, 12, 0.35);
    linea(ctx, "Iremos publicando cada episodio", 1222, 40, CR, SANS, 400, 0, 0.3);
    linea(ctx, "en Instagram, TikTok y YouTube.", 1274, 40, CR, SANS, 400, 0, 0.3);
    plataformas(ctx, 1350);

    linea(ctx, "¿PREFIERES VERLO COMPLETO?", 1440, 24, AM, MONO, 500, 10, 0.35);
    linea(ctx, "La versión completa ya está en YouTube.", 1490, 34, CR, SANS, 400, 0, 0.3, 0.9);
    flecha(ctx, 1514, 1546);

    const pp = postProceso(ctx.canvas, W, H, { px: 1, semilla: 7, bloom: 0.32, expo: 0.94, aberr: 0.025, vineta: 0.5, grano: 0.04, scan: 0.12, curva: 0, esq: 0.02, impacto: 0, ruido: 0.4, flicker: 0, lineaY: -1, lineaA: 0, grade: 1.6, tiempo: 1, halo: 0.6 });
    if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }

    if (guia) {
      // where the link sticker goes (only in the preview, never in the final image)
      ctx.save(); ctx.setLineDash([10, 8]); ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2;
      const sw = 560; ctx.beginPath(); ctx.roundRect(W / 2 - sw / 2, ZONA.y + 10, sw, ZONA.h - 20, 22); ctx.stroke();
      ctx.font = `500 22px "${MONO}"`; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillText("STICKER DE ENLACE", W / 2, ZONA.y + ZONA.h / 2 + 8);
      ctx.strokeStyle = "rgba(255,80,80,0.6)"; ctx.setLineDash([]); ctx.lineWidth = 1;
      for (const yy of [250, H - 250]) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
      ctx.restore();
    }
    continueRender(espera);
  }, [logo, v, guia, espera]);
  return <AbsoluteFill style={{ backgroundColor: "#020306" }}><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
