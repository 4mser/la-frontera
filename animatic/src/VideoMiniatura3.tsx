import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, getInputProps, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { pintarMulti } from "./multiFractal";
import { celdaHija, telarana } from "./caos";
import { milpies } from "./vida";
import { filotaxis, foto } from "./naturaleza";

// Thumbnails made of what only this film has. props.v: ojo | poster | vida | naturaleza
// props.px, py, pr: the pupil of the eye photo (fractions of the photo's width/height), to place the set inside it
const W = 1280, H = 720, SS = 2;
const INTER = "Inter", GROT = "Space Grotesk";
type Ctx = CanvasRenderingContext2D;
const FOTOS: Record<string, string> = { ojo: "p5/5-ojo.jpg", romanesco: "p2/destellos/02-romanesco.jpg" };

const palabra = (ctx: Ctx, s: string, x: number, y: number, tam: number, col: string, alin: CanvasTextAlign = "left", fam = INTER, peso = 800, esp = -0.02, trazo = 0.1) => {
  ctx.save();
  ctx.font = `${peso} ${tam}px "${fam}"`; ctx.textAlign = alin; ctx.lineJoin = "round";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${tam * esp}px`;
  if (trazo > 0) { ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillText(s, x + tam * 0.03, y + tam * 0.05); ctx.strokeStyle = "#05040A"; ctx.lineWidth = tam * trazo; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
  ctx.restore();
};
const chip = (ctx: Ctx, s: string, x: number, y: number, tam: number, fondo: string, col: string) => {
  ctx.save(); ctx.font = `800 ${tam}px "${INTER}"`;
  const w = ctx.measureText(s).width + tam * 1.1, h = tam * 1.5;
  ctx.fillStyle = fondo; ctx.beginPath(); ctx.roundRect(x, y - h * 0.72, w, h, h / 2); ctx.fill();
  ctx.fillStyle = col; ctx.textAlign = "left"; ctx.fillText(s, x + tam * 0.55, y + tam * 0.05); ctx.restore();
};
const cargar = (src: string) => new Promise<HTMLImageElement>((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = staticFile(src); });

const dibuja = (ctx: Ctx, v: string, img: Record<string, HTMLImageElement>, ip: { px?: number; py?: number; pr?: number }) => {
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  if (v === "ojo") {
    // the eye, the pupil holds the whole set, glowing; the words on the dark left
    const im = img.ojo, s = (H / im.height) * 1.5, dw = im.width * s, dh = im.height * s;
    // the pupil lands at two thirds of the width, centred in height
    const ox = W * 0.68 - (ip.px ?? 0.392) * dw, oy = H * 0.5 - (ip.py ?? 0.52) * dh;
    ctx.drawImage(im, ox, oy, dw, dh);
    const px = ox + (ip.px ?? 0.392) * dw, py = oy + (ip.py ?? 0.52) * dh, pr = (ip.pr ?? 0.112) * dw;
    // the set, glowing, on the pupil's black: drawn on its own layer, its edge melted into the iris
    const lado = Math.round(pr * 2 * SS);
    const m = pintarFractalTeaser(lado, lado, { cx: -0.65, cy: 0, esc: 2.75 / lado, rot: 0, modo: 0, lente: 1e9, fase: 0.2, paleta: PALETAS[0], brillo: 1.4, maxIt: 900, tiempo: 1, interior: 0.05 });
    const capa = document.createElement("canvas"); capa.width = lado; capa.height = lado;
    const c = capa.getContext("2d")!;
    c.fillStyle = "#000"; c.fillRect(0, 0, lado, lado);
    c.globalCompositeOperation = "lighter"; c.drawImage(m, 0, 0);
    // keep only the bright border: crush the dim exterior toward black
    c.globalCompositeOperation = "multiply"; c.drawImage(m, 0, 0);
    c.globalCompositeOperation = "destination-in";
    const mk = c.createRadialGradient(lado / 2, lado / 2, lado * 0.36, lado / 2, lado / 2, lado * 0.5);
    mk.addColorStop(0, "rgba(0,0,0,1)"); mk.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = mk; c.fillRect(0, 0, lado, lado);
    ctx.save(); ctx.globalCompositeOperation = "source-over";
    // first darken the real pupil, then light the set on top
    const pg = ctx.createRadialGradient(px, py, pr * 0.6, px, py, pr * 1.02);
    pg.addColorStop(0, "rgba(0,0,0,0.95)"); pg.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = pg; ctx.fillRect(px - pr * 1.1, py - pr * 1.1, pr * 2.2, pr * 2.2);
    ctx.globalCompositeOperation = "lighter"; ctx.drawImage(capa, px - pr, py - pr, 2 * pr, 2 * pr);
    ctx.globalCompositeOperation = "source-over";
    const hl = ctx.createRadialGradient(px - pr * 0.38, py - pr * 0.42, 0, px - pr * 0.38, py - pr * 0.42, pr * 0.3);
    hl.addColorStop(0, "rgba(255,255,255,0.4)"); hl.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = hl; ctx.fillRect(px - pr, py - pr, 2 * pr, 2 * pr);
    ctx.restore();
    const g = ctx.createLinearGradient(0, 0, W * 0.5, 0);
    g.addColorStop(0, "rgba(2,3,6,0.95)"); g.addColorStop(0.6, "rgba(2,3,6,0.75)"); g.addColorStop(1, "rgba(2,3,6,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    palabra(ctx, "NO TIENE", 48, 290, 112, "#FFFFFF");
    palabra(ctx, "FONDO", 48, 405, 132, "#FFB45A");
    chip(ctx, "DOCUMENTAL · LA FRONTERA", 52, 500, 26, "#FFF4DE", "#120C04");
  } else if (v === "poster") {
    // the film's spider web, silver on black, with the web inside one of its cells; a small, spaced title
    const R = H * 0.62, cx = W * 0.68, cy = H * 0.5;
    const g = ctx.createRadialGradient(cx, cy * 0.8, 0, cx, cy, W * 0.6);
    g.addColorStop(0, "rgba(70,90,140,0.32)"); g.addColorStop(1, "rgba(70,90,140,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    telarana(ctx, cx, cy, R, 1, 1, 3.1, 1, 1);
    const ph = celdaHija(1);
    telarana(ctx, cx + ph[0] * R, cy + ph[1] * R, R * 0.11, 1, 1, 3.4, 2, 1);
    palabra(ctx, "LA FRONTERA", 70, 340, 74, "#FFF4DE", "left", GROT, 700, 0.08, 0);
    palabra(ctx, "FRACTALES: LA GEOMETRÍA DEL INFINITO", 74, 392, 21, "#FFB45A", "left", GROT, 600, 0.2, 0);
    palabra(ctx, "UN DOCUMENTAL DE B&N LECTURES", 74, 640, 16, "rgba(255,244,222,0.7)", "left", GROT, 500, 0.3, 0);
  } else if (v === "vida") {
    // the bioluminescent millipede, alone, crossing a dim Julia; no words
    const j = pintarMulti(W * SS, H * SS, { cx: 0, cy: 0, esc: 2.6 / (W * SS), regla: 0, julia: [-0.7269, 0.1889], paleta: PALETAS[1], brillo: 0.9, maxIt: 600, fondo: 0.3, fase: 0.1, tiempo: 1 });
    ctx.drawImage(j, 0, 0, W, H);
    ctx.fillStyle = "rgba(2,3,6,0.55)"; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.scale(1.25, 1.25); ctx.translate(-W * 0.1, -H * 0.12);
    milpies(ctx, 2.3, (u) => [-W * 0.1 + u * W * 1.2, H * 0.6 + H * 0.12 * Math.sin(u * 5.5 + 0.6)], 0.82, 1.45, 1);
    ctx.restore();
  } else {
    // the romanesco, and the golden angle that grows it, side by side
    foto(ctx, img.romanesco, 0, 0, W / 2, H, 1.15, 0.5, 0.5);
    ctx.fillStyle = "#020306"; ctx.fillRect(W / 2, 0, W / 2, H);
    filotaxis(ctx, W * 0.75, H * 0.5, H * 0.44, 1600, 0.2, 2, (u, a) => {
      const p = PALETAS[2]; u = ((u % 1) + 1) % 1; let i = 0; while (i < p.length - 2 && p[i + 1][0] < u) i++;
      const [u0, r0, g0, b0] = p[i], [u1, r1, g1, b1] = p[i + 1], x = Math.min(1, Math.max(0, (u - u0) / Math.max(1e-6, u1 - u0)));
      return `rgba(${Math.round(255 * (r0 + (r1 - r0) * x))},${Math.round(255 * (g0 + (g1 - g0) * x))},${Math.round(255 * (b0 + (b1 - b0) * x))},${a})`;
    });
    ctx.fillStyle = "#FFF4DE"; ctx.fillRect(W / 2 - 2, 0, 4, H);
    palabra(ctx, "LA NATURALEZA", W * 0.25, 78, 40, "#FFFFFF", "center");
    palabra(ctx, "LA REGLA", W * 0.75, 78, 40, "#FFB45A", "center");
    palabra(ctx, "MISMA FORMA", W / 2, H - 50, 92, "#FFFFFF", "center");
  }
};

export const VideoMiniatura3: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender("recursos"));
  const ip = getInputProps() as { v?: string; px?: number; py?: number; pr?: number };
  const v = ip.v ?? "ojo";
  useLayoutEffect(() => {
    Promise.all([
      loadFont({ family: INTER, url: staticFile("fonts/inter-800.woff2"), weight: "800" }),
      ...[500, 600, 700].map((w) => loadFont({ family: GROT, url: staticFile(`fonts/grotesk-${w}.woff2`), weight: String(w) })),
      ...Object.entries(FOTOS).map(([k, s]) => cargar(s).then((i) => [k, i] as const)),
    ]).then((r) => {
      const img: Record<string, HTMLImageElement> = {};
      for (const x of r) if (Array.isArray(x)) img[x[0]] = x[1];
      const ctx = ref.current!.getContext("2d")!;
      ctx.setTransform(SS, 0, 0, SS, 0, 0);
      ctx.imageSmoothingQuality = "high";
      dibuja(ctx, v, img, ip);
      continueRender(h);
    });
  }, [h, v]);
  return <AbsoluteFill style={{ backgroundColor: "#020306" }}><canvas ref={ref} width={W * SS} height={H * SS} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
