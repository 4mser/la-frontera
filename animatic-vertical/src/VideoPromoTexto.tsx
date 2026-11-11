import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, getInputProps, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";

// Transparent text layers (1080 × 1920) for the Instagram reel of the documentary, in the film's type: Space Grotesk
// for large words (cream, the title's soft glow), IBM Plex Mono spaced for labels (the HUD), amber on one line only.
// Every line is measured and shrunk until it fits inside the safe area, so nothing is ever cut.
// Instagram covers ~250 px at the top and ~350 px at the bottom: the safe area is y 260–1560, x 70–1010.
const W = 1080, H = 1920, X0 = 80, X1 = W - 80, Y0 = 270, Y1 = 1560;
const GROT = "Space Grotesk", MONO = "IBM Plex Mono";
const CREMA = "255,244,222", AMBAR = "255,190,120";
type Ctx = CanvasRenderingContext2D;
// the YouTube logo (Lucide «youtube», 24 × 24): red body, white play
const YT = typeof Path2D !== "undefined" ? [new Path2D("M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"), new Path2D("m10 15 5-3-5-3z")] : null;
// the logo centred at (cx, cy), «ancho» px wide
const logo = (ctx: Ctx, cx: number, cy: number, ancho: number) => {
  if (!YT) return;
  const k = ancho / 19;
  ctx.save(); ctx.translate(cx - 12 * k, cy - 12 * k); ctx.scale(k, k);
  ctx.shadowColor = "rgba(255,30,30,0.55)"; ctx.shadowBlur = 10; ctx.fillStyle = "#FF0000"; ctx.fill(YT[0]);
  ctx.shadowBlur = 0; ctx.fillStyle = "#FFFFFF"; ctx.fill(YT[1]); ctx.restore();
};
// dark bands under the HUD (they also hide the film's own captions at the edges of the crop)
const bandas = (ctx: Ctx) => {
  const a = ctx.createLinearGradient(0, 0, 0, 420); a.addColorStop(0, "rgba(2,3,6,0.92)"); a.addColorStop(0.7, "rgba(2,3,6,0.6)"); a.addColorStop(1, "rgba(2,3,6,0)");
  ctx.fillStyle = a; ctx.fillRect(0, 0, W, 420);
  const b = ctx.createLinearGradient(0, 1440, 0, H); b.addColorStop(0, "rgba(2,3,6,0)"); b.addColorStop(0.35, "rgba(2,3,6,0.7)"); b.addColorStop(1, "rgba(2,3,6,0.95)");
  ctx.fillStyle = b; ctx.fillRect(0, 1440, W, H - 1440);
};
const sp = (ctx: Ctx, px: number) => { (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`; };
// the largest size ≤ max at which s fits in width w
const ajusta = (ctx: Ctx, s: string, font: (t: number) => string, esp: number, max: number, w: number) => {
  let t = max;
  for (; t > 8; t -= 1) { ctx.font = font(t); sp(ctx, t * esp); if (ctx.measureText(s).width <= w) break; }
  return t;
};
const grande = (ctx: Ctx, s: string, y: number, max: number, peso = 700, esp = 0.05, col = CREMA, w = X1 - X0) => {
  ctx.save();
  const f = (t: number) => `${peso} ${t}px "${GROT}"`;
  const t = ajusta(ctx, s, f, esp, max, w);
  ctx.font = f(t); sp(ctx, t * esp); ctx.textAlign = "center";
  ctx.shadowColor = "rgba(2,3,6,0.95)"; ctx.shadowBlur = t * 0.7; ctx.fillStyle = `rgba(${col},1)`; ctx.fillText(s, W / 2, y);
  ctx.shadowBlur = 0; ctx.globalCompositeOperation = "lighter"; ctx.filter = `blur(${t * 0.13}px)`; ctx.fillStyle = `rgba(${col},0.5)`; ctx.fillText(s, W / 2, y);
  ctx.filter = "none"; ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = `rgba(${col},0.97)`; ctx.fillText(s, W / 2, y);
  ctx.restore();
  return t;
};
const rotulo = (ctx: Ctx, s: string, y: number, max: number, col = CREMA, a = 0.9, alin: CanvasTextAlign = "center", x = W / 2) => {
  ctx.save();
  const f = (t: number) => `500 ${t}px "${MONO}"`;
  const t = ajusta(ctx, s, f, 0.28, max, alin === "left" ? X1 - x : alin === "right" ? x - X0 : X1 - X0);
  ctx.font = f(t); sp(ctx, t * 0.28); ctx.textAlign = alin;
  ctx.shadowColor = "rgba(2,3,6,1)"; ctx.shadowBlur = t; ctx.fillStyle = `rgba(${col},${a})`; ctx.fillText(s, x, y); ctx.fillText(s, x, y);
  ctx.restore();
};
const esquinas = (ctx: Ctx) => {
  const m = 56, b = 34;
  ctx.save(); ctx.strokeStyle = `rgba(${CREMA},0.6)`; ctx.lineWidth = 2.5; ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 8; ctx.beginPath();
  for (const [x, y, sx, sy] of [[m, Y0 - 40, 1, 1], [W - m, Y0 - 40, -1, 1], [m, Y1 + 40, 1, -1], [W - m, Y1 + 40, -1, -1]]) { ctx.moveTo(x, y + sy * b); ctx.lineTo(x, y); ctx.lineTo(x + sx * b, y); }
  ctx.stroke(); ctx.restore();
};
const CAPS: Record<string, [string, string]> = {
  apertura: ["", "APERTURA"], I: ["CAPÍTULO I", "LA REGLA"], II: ["CAPÍTULO II", "ENTRE LA NADA Y EL ALGO"],
  III: ["CAPÍTULO III", "LA MEDIDA DE LO IRREGULAR"], IV: ["CAPÍTULO IV", "CÓMO CRECE UNA FORMA"],
  V: ["CAPÍTULO V", "UN CORAZÓN NO ES UN METRÓNOMO"], VI: ["CAPÍTULO VI", "LA MISMA REGLA, EN EL TIEMPO"],
  VII: ["CAPÍTULO VII", "DEL PATRÓN A LA HERRAMIENTA"], VIII: ["CAPÍTULO VIII", "¿HASTA DÓNDE LLEGA LA ESTRUCTURA?"],
  IX: ["CAPÍTULO IX", "EL LENGUAJE Y SUS RANGOS"], X: ["CAPÍTULO X", "LA FRONTERA"], coda: ["", "CODA"],
};

export const VideoPromoTexto: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender("fuentes"));
  const v = ((getInputProps() as { v?: string }).v ?? "hud");
  useLayoutEffect(() => {
    Promise.all([
      loadFont({ family: GROT, url: staticFile("fonts/grotesk-700.woff2"), weight: "700" }),
      loadFont({ family: GROT, url: staticFile("fonts/grotesk-300.woff2"), weight: "300" }),
      loadFont({ family: MONO, url: staticFile("fonts/plex-500.woff2"), weight: "500" }),
    ]).then(() => {
      const ctx = ref.current!.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);
      if (v === "hud") {
        esquinas(ctx);
      } else if (v === "abre") {
        logo(ctx, W / 2, 770, 300);
        grande(ctx, "YA EN YOUTUBE", 1030, 130);
        rotulo(ctx, "NUEVO DOCUMENTAL · LA FRONTERA", 1105, 30, AMBAR, 1);
      } else if (v === "pausa") {
        grande(ctx, "67 MINUTOS", 960, 130);
        rotulo(ctx, "UN DOCUMENTAL SOBRE FRACTALES", 1040, 30, AMBAR, 1);
      } else if (v === "fin") {
        logo(ctx, W / 2, 1180, 190);
        grande(ctx, "YA EN YOUTUBE", 1360, 104);
        rotulo(ctx, "MÍRALO COMPLETO · LINK EN LA BIO", 1435, 28, AMBAR, 1);
      } else if (v.startsWith("cap-")) {
        const [num, nombre] = CAPS[v.slice(4)];
        if (num) rotulo(ctx, num, Y1 - 52, 24, AMBAR, 1, "left", 100);
        rotulo(ctx, nombre, Y1 - 10, 30, CREMA, 0.95, "left", 100);
      }
      continueRender(h);
    });
  }, [h, v]);
  return <AbsoluteFill><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
