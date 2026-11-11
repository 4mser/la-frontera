import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, getInputProps, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";

// The thumbnail of the full documentary (1280 × 720): a crisp, computed seahorse valley (no retro post, no glow on the
// type), the left side dark for the words, and a lens that shows the same border a thousand times deeper.
// props: { v: "a" | "b" }  a = the title; b = a hook line above the title
const W = 1280, H = 720, SS = 2;
const INTER = "Inter";
const C: [number, number] = [-0.743643887, 0.131825904];
type Ctx = CanvasRenderingContext2D;

const fractal = (w: number, h: number, ancho: number, cx: number, cy: number, fase: number) =>
  pintarFractalTeaser(w, h, { cx, cy, esc: ancho / w, rot: 0, modo: 0, lente: 1e9, fase, paleta: PALETAS[0], brillo: 1.0, maxIt: 2500, tiempo: 1, interior: 0.6 });

const palabra = (ctx: Ctx, s: string, x: number, y: number, tam: number, col: string, peso = 800, esp = 0) => {
  ctx.save();
  ctx.font = `${peso} ${tam}px "${INTER}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${esp}px`;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  // a hard, tight shadow so the word reads at any size (no blur glow)
  ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillText(s, x + 3, y + 4);
  ctx.fillStyle = col; ctx.fillText(s, x, y);
  ctx.restore();
};

export const VideoMiniaturaDoc: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender("fuentes"));
  const ip = getInputProps() as { v?: string; cx?: number; cy?: number; ancho?: number };
  const v = (ip.v ?? "a") as "a" | "b";
  const fx = ip.cx ?? -0.7445, fy = ip.cy ?? 0.1205, fa = ip.ancho ?? 0.05;
  useLayoutEffect(() => {
    Promise.all([loadFont({ family: INTER, url: staticFile("fonts/inter-800.woff2"), weight: "800" }), loadFont({ family: INTER, url: staticFile("fonts/inter-600.woff2"), weight: "600" })]).then(() => {
      const ctx = ref.current!.getContext("2d")!;
      ctx.scale(SS, SS);
      ctx.imageSmoothingQuality = "high";
      // the valley, framed so its spirals fill the right two thirds
      const fondo = fractal(W * SS, H * SS, fa, fx, fy, 0.02);
      ctx.drawImage(fondo, 0, 0, W, H);
      // the left side goes dark for the words
      const g = ctx.createLinearGradient(0, 0, W * 0.62, 0);
      g.addColorStop(0, "rgba(2,3,8,0.94)"); g.addColorStop(0.55, "rgba(2,3,8,0.82)"); g.addColorStop(1, "rgba(2,3,8,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const gb = ctx.createLinearGradient(0, H * 0.6, 0, H);
      gb.addColorStop(0, "rgba(2,3,8,0)"); gb.addColorStop(1, "rgba(2,3,8,0.6)");
      ctx.fillStyle = gb; ctx.fillRect(0, 0, W, H);
      // the lens: the same point, ×1000
      const lx = 1040, ly = 330, lr = 185;
      const lente = fractal(lr * 2 * SS, lr * 2 * SS, 0.034 / 1000 * (2 * lr / W) * 2.2, C[0], C[1], 0.31);
      ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(lente, lx - lr, ly - lr, 2 * lr, 2 * lr); ctx.restore();
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 24;
      ctx.strokeStyle = "#FFF4DE"; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      // the lens tag
      ctx.save(); ctx.fillStyle = "#FFB45A"; ctx.beginPath(); ctx.roundRect(lx - 70, ly + lr - 26, 140, 52, 26); ctx.fill(); ctx.restore();
      ctx.save(); ctx.font = `800 30px "${INTER}"`; ctx.fillStyle = "#0B0A14"; ctx.textAlign = "center"; ctx.fillText("×1.000", lx, ly + lr + 11); ctx.restore();
      // the words
      if (v === "a") {
        palabra(ctx, "UN DOCUMENTAL SOBRE FRACTALES", 62, 196, 26, "#FFB45A", 600, 3);
        palabra(ctx, "LA", 56, 330, 132, "#FFFFFF");
        palabra(ctx, "FRONTERA", 56, 462, 132, "#FFFFFF", 800, -2);
        palabra(ctx, "La geometría del infinito", 62, 532, 40, "#FFF4DE", 600);
      } else {
        palabra(ctx, "NUNCA", 56, 250, 132, "#FFFFFF");
        palabra(ctx, "TERMINA", 56, 390, 132, "#FFFFFF", 800, -2);
        palabra(ctx, "LA FRONTERA", 62, 480, 54, "#FFB45A", 800, 2);
        palabra(ctx, "Documental sobre fractales", 62, 535, 34, "#FFF4DE", 600);
      }
      continueRender(h);
    });
  }, [h, v]);
  return <AbsoluteFill style={{ backgroundColor: "#020308" }}><canvas ref={ref} width={W * SS} height={H * SS} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
