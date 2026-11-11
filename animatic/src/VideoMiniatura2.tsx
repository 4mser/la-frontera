import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, getInputProps, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { pintarMulti } from "./multiFractal";

// Thumbnails for the full documentary, made from the film's own fractals rendered crisp (no retro post).
// props.v:  zoom | mandala | armada | fuego
const W = 1280, H = 720, SS = 2;
const F = "Inter";
type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

const mandel = (w: number, h: number, cx: number, cy: number, ancho: number, pal: number, fase = 0, interior = 0.5) =>
  pintarFractalTeaser(w, h, { cx, cy, esc: ancho / w, rot: 0, modo: 0, lente: 1e9, fase, paleta: PALETAS[pal], brillo: 1.08, maxIt: 3000, tiempo: 1, interior });
const multi = (w: number, h: number, regla: number, cx: number, cy: number, ancho: number, pal: number, julia?: [number, number], fase = 0) =>
  pintarMulti(w, h, { cx, cy, esc: ancho / w, regla, julia, paleta: PALETAS[pal], brillo: 1.05, maxIt: 900, fondo: 0.25, fase, tiempo: 1 });

// a word with a heavy outline and a hard shadow: readable on anything, at any size
const palabra = (ctx: Ctx, s: string, x: number, y: number, tam: number, col: string, alin: CanvasTextAlign = "left", trazo = 0.11) => {
  ctx.save();
  ctx.font = `800 ${tam}px "${F}"`; ctx.textAlign = alin; ctx.textBaseline = "alphabetic"; ctx.lineJoin = "round";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${-tam * 0.02}px`;
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillText(s, x + tam * 0.03, y + tam * 0.05);
  ctx.strokeStyle = "#05040A"; ctx.lineWidth = tam * trazo; ctx.strokeText(s, x, y);
  ctx.fillStyle = col; ctx.fillText(s, x, y);
  ctx.restore();
};
const chip = (ctx: Ctx, s: string, x: number, y: number, tam: number, fondo: string, col: string) => {
  ctx.save(); ctx.font = `800 ${tam}px "${F}"`;
  const w = ctx.measureText(s).width + tam * 1.1, h = tam * 1.5;
  ctx.fillStyle = fondo; ctx.beginPath(); ctx.roundRect(x, y - h * 0.72, w, h, h / 2); ctx.fill();
  ctx.fillStyle = col; ctx.textAlign = "left"; ctx.fillText(s, x + tam * 0.55, y + tam * 0.05); ctx.restore();
};
const oscuro = (ctx: Ctx, x0: number, x1: number, a0: number, a1: number) => {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, `rgba(3,2,8,${a0})`); g.addColorStop(1, `rgba(3,2,8,${a1})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
};
const anillo = (ctx: Ctx, camino: () => void, w = 6, col = "#FFF4DE") => {
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 20; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); camino(); ctx.stroke(); ctx.restore();
};

const dibuja = (ctx: Ctx, v: string) => {
  ctx.fillStyle = "#03020A"; ctx.fillRect(0, 0, W, H);
  if (v === "zoom") {
    // the deep panel fills the right; on the left, the whole set; nested boxes lead the eye from one to the other
    const deep: [number, number] = [-0.7436438870371587, 0.1318259042053119];
    // the GPU renderer is single precision: ×10 000 is as deep as it stays sharp, and that is what the words say
    ctx.drawImage(mandel(W * SS, H * SS, deep[0], deep[1], 3.1e-4, 2, 0.12, 0.4), 0, 0, W, H);
    oscuro(ctx, 0, W * 0.55, 0.92, 0);
    // the whole set, small, top left
    const bx = 40, by = 40, bw = 360, bh = 230;
    ctx.save(); ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 14); ctx.clip();
    ctx.drawImage(mandel(bw * SS, bh * SS, -0.6, 0, 3.1, 0, 0, 0.5), bx, by, bw, bh); ctx.restore();
    anillo(ctx, () => ctx.roundRect(bx, by, bw, bh, 14), 4);
    // the zoom path: three boxes, each inside the previous, ending at the frame
    const px = bx + ((deep[0] + 0.6) / 3.1 + 0.5) * bw, py = by + (0.5 - (deep[1]) / (3.1 * bh / bw)) * bh;
    ctx.save(); ctx.strokeStyle = "#FFB45A"; ctx.lineWidth = 3.5; ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 10;
    ctx.strokeRect(px - 14, py - 10, 28, 20);
    ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(px + 14, py - 10); ctx.lineTo(W - 4, 4); ctx.moveTo(px + 14, py + 10); ctx.lineTo(W - 4, H - 4); ctx.stroke();
    ctx.restore();
    palabra(ctx, "×10.000", 48, 470, 140, "#FFFFFF");
    palabra(ctx, "Y NO TERMINA", 52, 565, 66, "#FFB45A");
    chip(ctx, "DOCUMENTAL · LA FRONTERA", 56, 660, 26, "#FFB45A", "#120C04");
  } else if (v === "mandala") {
    // twelve mirrors of c·sin z, vivid, full frame; the words in a dark band at the bottom
    const r = Math.hypot(W, H) / 2 + 4, ang = TAU / 12;
    const cw = Math.round(r * SS), ch = Math.round(r * Math.sin(ang) * 2.2 * SS);
    const cuna = multi(cw, ch, 12, 0.55, 0.25, 2.4, 0, [1, 0.3], 0.1);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(0.13);
    for (let i = 0; i < 12; i++) {
      ctx.save(); if (i % 2) { ctx.rotate((i + 1) * ang); ctx.scale(1, -1); } else ctx.rotate(i * ang);
      ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(r, -1); ctx.lineTo(r * Math.cos(ang) + 2, r * Math.sin(ang) + 2); ctx.closePath(); ctx.clip();
      ctx.drawImage(cuna, 0, -ch / SS / 2, cw / SS, ch / SS); ctx.restore();
    }
    ctx.restore();
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 260);
    g.addColorStop(0, "rgba(3,2,10,0.9)"); g.addColorStop(1, "rgba(3,2,10,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    palabra(ctx, "INFINITO", W / 2, H / 2 + 58, 168, "#FFFFFF", "center", 0.12);
    chip(ctx, "DOCUMENTAL · LA FRONTERA", W / 2 - 205, H - 52, 26, "#FFB45A", "#120C04");
  } else if (v === "armada") {
    // the Burning Ship's armada, like a cathedral on fire
    ctx.drawImage(multi(W * SS, H * SS, 1, -1.7605, -0.0335, 0.105, 2, undefined, 0.08), 0, 0, W, H);
    const gb = ctx.createLinearGradient(0, H * 0.45, 0, H);
    gb.addColorStop(0, "rgba(3,2,8,0)"); gb.addColorStop(1, "rgba(3,2,8,0.92)");
    ctx.fillStyle = gb; ctx.fillRect(0, 0, W, H);
    palabra(ctx, "UNA SOLA REGLA", W / 2, H - 150, 112, "#FFFFFF", "center");
    palabra(ctx, "z → z² + c", W / 2, H - 70, 60, "#FFB45A", "center");
    chip(ctx, "DOCUMENTAL", 40, 70, 26, "#FFB45A", "#120C04");
  } else {
    // the seahorse valley in the fire palette, with the lens ×1000
    ctx.drawImage(mandel(W * SS, H * SS, -0.7453, 0.1127, 0.0065, 2, 0.06, 0.4), 0, 0, W, H);
    oscuro(ctx, 0, W * 0.6, 0.9, 0);
    const lx = 1020, ly = 340, lr = 215;
    ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, lr, 0, TAU); ctx.clip();
    ctx.drawImage(mandel(lr * 2 * SS, lr * 2 * SS, -0.743643887, 0.131825904, 0.0065 / 100 * 0.75, 1, 0.3, 0.4), lx - lr, ly - lr, 2 * lr, 2 * lr); ctx.restore();
    anillo(ctx, () => ctx.arc(lx, ly, lr, 0, TAU), 8);
    chip(ctx, "×100", lx - 48, ly + lr + 10, 30, "#FFF4DE", "#120C04");
    palabra(ctx, "NUNCA", 50, 300, 150, "#FFFFFF");
    palabra(ctx, "TERMINA", 50, 450, 150, "#FFFFFF");
    chip(ctx, "DOCUMENTAL · LA FRONTERA", 56, 545, 26, "#FFB45A", "#120C04");
  }
};

export const VideoMiniatura2: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender("fuentes"));
  const v = ((getInputProps() as { v?: string }).v ?? "zoom");
  useLayoutEffect(() => {
    loadFont({ family: F, url: staticFile("fonts/inter-800.woff2"), weight: "800" }).then(() => {
      const ctx = ref.current!.getContext("2d")!;
      ctx.setTransform(SS, 0, 0, SS, 0, 0);
      ctx.imageSmoothingQuality = "high";
      dibuja(ctx, v);
      continueRender(h);
    });
  }, [h, v]);
  return <AbsoluteFill style={{ backgroundColor: "#03020A" }}><canvas ref={ref} width={W * SS} height={H * SS} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
