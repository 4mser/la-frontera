import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { dibujarLogo, D as D_LOGO } from "./logoFinal";
import CONTORNOS from "../public/p10/logo/marca-contornos.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { RGB, SANS, MONO } from "./theme";

// Trailer close: «PRONTO · [YouTube] EN YOUTUBE · @bnlectures» over a faint spiral Julia set that keeps turning (as the
// credits); the card leaves and, over the same background, the B&N Lectures mark forms (the film's own animation)
const W = 1920, H = 1080, FPS = 30, CARTEL = 4.0, DUR = CARTEL + D_LOGO + 10.0;
export const LOGO_DESDE = CARTEL;                // the mark's drawing starts here (its t = −D_LOGO)
// the YouTube mark (lucide-static 0.460, ISC), filled: the rounded screen in red, the play triangle in white
const YT_PANTALLA = new Path2D("M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17");
const YT_PLAY = new Path2D("m10 15 5-3-5-3z");
const sv = (x: number) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
export const CARTEL_FRAMES = Math.round(DUR * FPS);
export const VideoCartel: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [marca, setMarca] = useState<HTMLImageElement | undefined>(undefined);
  const [espera] = useState(() => delayRender("marca"));
  useLayoutEffect(() => { const i = new Image(); i.onload = () => { setMarca(i); continueRender(espera); }; i.onerror = () => continueRender(espera); i.src = staticFile("p10/logo/bn-mark.png"); }, [espera]);
  useLayoutEffect(() => {
    if (!marca) return;
    const ctx = ref.current!.getContext("2d")!, t = frame / FPS;
    ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
    const tl = t - LOGO_DESDE - D_LOGO;                                     // the mark's own clock
    const fondo = sv(t / 0.6) * (1 - 0.6 * sv((tl + 1.0) / 7.0));           // the same background, dimmed under the mark
    const a = sv(t / 0.6) * (1 - sv((t - (CARTEL - 0.6)) / 0.6));           // the card
    const l = pintarFractalTeaser(W, H, { cx: -0.4, cy: 0.2, esc: (1.2 * Math.exp(-0.12 * t)) / W, rot: 0, julia: [-0.8 + 0.02 * Math.cos(t * 0.3), 0.156 + 0.02 * Math.sin(t * 0.3)], modo: 0, lente: 1e9, fase: 0.02 * t, paleta: PALETAS[2], brillo: 0.9, maxIt: 400, tiempo: t });
    ctx.globalAlpha = 0.28 * fondo; ctx.drawImage(l, 0, 0, W, H); ctx.globalAlpha = 1;
    const txt = (s: string, y: number, tam: number, col: string, fam: string, peso: number, esp: number, alfa: number) => {
      ctx.font = `${peso} ${tam}px "${fam}"`; (ctx as unknown as { letterSpacing: string }).letterSpacing = `${esp}px`; ctx.textAlign = "center";
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(14px)"; ctx.fillStyle = `rgba(${col},${0.35 * alfa})`; ctx.fillText(s, W / 2 + esp / 2, y); ctx.restore();
      ctx.fillStyle = `rgba(${col},${0.97 * alfa})`; ctx.fillText(s, W / 2 + esp / 2, y);
    };
    txt("PRONTO", H * 0.46, 96, RGB.crema, SANS, 300, 40, a);
    const ay = a * sv((t - 0.4) / 0.6);
    ctx.font = `500 24px "${MONO}"`; (ctx as unknown as { letterSpacing: string }).letterSpacing = "14px";
    const wTxt = ctx.measureText("EN YOUTUBE").width, tamI = 2.8, wIco = 24 * tamI, sep = 18;
    const x0 = W / 2 - (wIco + sep + wTxt) / 2, yI = H * 0.46 + 78 - 8 - 12 * tamI;
    ctx.save(); ctx.translate(x0, yI); ctx.scale(tamI, tamI); ctx.globalAlpha = ay;
    ctx.shadowColor = "rgba(255,40,40,0.55)"; ctx.shadowBlur = 16; ctx.fillStyle = "#FF0000"; ctx.fill(YT_PANTALLA);
    ctx.shadowBlur = 0; ctx.fillStyle = "#FFFFFF"; ctx.fill(YT_PLAY); ctx.restore();
    ctx.textAlign = "left"; ctx.fillStyle = `rgba(255,190,120,${0.97 * ay})`; ctx.fillText("EN YOUTUBE", x0 + wIco + sep, H * 0.46 + 78);
    txt("@bnlectures", H * 0.46 + 150, 44, RGB.crema, SANS, 600, 4, a * sv((t - 0.7) / 0.6));
    if (tl > -D_LOGO) dibujarLogo(ctx as unknown as Parameters<typeof dibujarLogo>[0], W, H, tl, marca, CONTORNOS as unknown as number[][][], 1);
    const pp = postProceso(ctx.canvas, W, H, { px: 1, semilla: frame % 97, bloom: 0.36, expo: 0.92, aberr: 0.03, vineta: 0.62, grano: 0.05, scan: 0.18, curva: 0, esq: 0.03, impacto: 0, ruido: 0.5, flicker: 0, lineaY: -1, lineaA: 0, grade: 1.8, tiempo: t, halo: 0.75 });
    if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
  }, [frame, marca]);
  return <AbsoluteFill style={{ backgroundColor: "#000" }}><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
