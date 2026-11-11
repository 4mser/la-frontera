import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { MONO, RGB } from "./theme";

// LinkedIn cover for B&N Lectures (1584×396, drawn at 2×): one fractal view with the teaser colouring and retro finish,
// and the small B&N Lectures mark in the quiet part of the frame.
export const W = 3168;
export const H = 792;
const SS = 2;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: 0.05, scan: 0.18, ruido: 0.5, grade: 1.8 };

type Vista = { cx: number; cy: number; ancho: number; julia?: [number, number]; pal: number; fase: number; rot?: number; marca: [number, number]; mw: number };
const VISTAS: Record<string, Vista> = {
  // Misiurewicz point of the closing act: spirals inside spirals
  m: { cx: -0.77568377 + 0.0009, cy: 0.13646737, ancho: 0.0042, pal: 2, fase: 0.4, marca: [0.86, 0.5], mw: 360 },
  // a second approved Julia, in the fire palette
  s: { cx: 0.42, cy: 0, ancho: 4.4, julia: [-0.7269, 0.1889], pal: 2, fase: 0.4, marca: [0.87, 0.5], mw: 360 },
  // the opening Julia set, laid along the width
  j: { cx: 0.5, cy: 0, ancho: 5.0, julia: [-0.8, 0.156], pal: 1, fase: 0.3, marca: [0.87, 0.5], mw: 360 },
};

// The fractal opens around the mark: a point at source radius rs (in units of the ellipse) is shown at r = sqrt(rs² + 1),
// so the whole plane slides out of the ellipse and the filaments crowd around its rim. Inside, night with a soft glow.
const abrir = (fuente: HTMLCanvasElement, w: number, h: number, cx: number, cy: number, a: number, b: number) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("webgl2", { preserveDrawingBuffer: true })!;
  const sh = (t: number, src: string) => { const x = g.createShader(t)!; g.shaderSource(x, src); g.compileShader(x); return x; };
  const pr = g.createProgram()!;
  g.attachShader(pr, sh(g.VERTEX_SHADER, `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0, 1); }`));
  g.attachShader(pr, sh(g.FRAGMENT_SHADER, `#version 300 es
precision highp float; out vec4 o; uniform sampler2D t; uniform vec2 res, L, ab;
void main(){
  vec2 p = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y);
  vec2 d = (p - L) / ab; float r = length(d);
  float rs = sqrt(max(r * r - 1.0, 0.0));
  vec2 q = L + (r > 0.0 ? d / r * rs : vec2(0)) * ab;
  vec3 c = texture(t, vec2(q.x, q.y) / res).rgb;
  // soft opening: the fractal thins out toward the hole instead of ending at a hard rim
  float borde = smoothstep(0.55, 1.25, r);
  vec3 noche = c * 0.35;
  o = vec4(mix(noche, c, borde * borde * (3.0 - 2.0 * borde)), 1.0);
}`));
  g.linkProgram(pr); g.useProgram(pr);
  g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer()); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
  const lp = g.getAttribLocation(pr, "p"); g.enableVertexAttribArray(lp); g.vertexAttribPointer(lp, 2, g.FLOAT, false, 0, 0);
  const tx = g.createTexture(); g.bindTexture(g.TEXTURE_2D, tx);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
  g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, fuente);
  g.uniform2f(g.getUniformLocation(pr, "res"), w, h); g.uniform2f(g.getUniformLocation(pr, "L"), cx, cy); g.uniform2f(g.getUniformLocation(pr, "ab"), a, b);
  g.viewport(0, 0, w, h); g.drawArrays(g.TRIANGLES, 0, 3); g.finish();
  return c;
};

export const PortadaLinkedIn: React.FC<{ v: string; post?: boolean | number; ss?: number; jx?: number; jy?: number; pal?: number; cx?: number; ancho?: number; rot?: number; fase?: number; abre?: number; mw?: number; mx?: number; url?: string }> = ({ v, post = true, ss = SS, ...o }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [marca, setMarca] = useState<HTMLImageElement | null>(null);
  const [handle] = useState(() => delayRender("marca"));
  useLayoutEffect(() => {
    const i = new Image();
    i.onload = () => { document.fonts.load(`400 24px "${MONO}"`).then(() => setMarca(i)); };
    i.src = staticFile("lectures-logo.png");
  }, []);
  useLayoutEffect(() => {
    if (!ref.current || !marca) return;
    const V0 = VISTAS[v] ?? VISTAS.m;
    // free variant: any approved Julia and palette, passed as props
    const V: Vista = o.jx !== undefined ? { ...VISTAS.j, julia: [o.jx, o.jy ?? 0], pal: o.pal ?? 1, cx: o.cx ?? 0.55, ancho: o.ancho ?? 4.4, rot: o.rot ?? 0, fase: o.fase ?? 0.3 } : V0;
    const ctx = ref.current.getContext("2d")!;
    const pw = W * ss, ph = H * ss;
    const esc = V.ancho / pw;
    const l = pintarFractalTeaser(pw, ph, {
      cx: V.cx, cy: V.cy, esc, rot: V.rot ?? 0, julia: V.julia, modo: 0, lente: 1e9, fase: V.fase, paleta: PALETAS[V.pal], brillo: 0.9,
      maxIt: V.julia ? 420 : Math.round(260 + 170 * Math.log10(Math.max(1, 2.8 / (esc * ss * 1920)))), tiempo: 0,
    });
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    const mw = o.mw ?? V.mw;
    const [mx, my] = [(o.mx ?? V.marca[0]) * W, V.marca[1] * H];
    const mh = (mw * marca.height) / marca.width;
    if (o.abre) {
      const k = o.abre;
      ctx.drawImage(abrir(l, pw, ph, mx * ss, my * ss, mw * 0.5 * k * ss, mh * 0.62 * k * ss), 0, 0, W, H);
    } else ctx.drawImage(l, 0, 0, W, H);
    // quiet pool for the mark: the fractal sinks into night around it
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, mw * (o.abre ? 0.85 : 1.25));
    g.addColorStop(0, `rgba(2,3,8,${o.abre ? 0.55 : 0.86})`); g.addColorStop(0.55, `rgba(2,3,8,${o.abre ? 0.3 : 0.6})`); g.addColorStop(1, "rgba(2,3,8,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (o.abre) {
      // a dark shadow hugging the letters, so the fractal parts around the mark itself
      ctx.save(); ctx.shadowColor = "rgba(1,2,6,0.95)";
      for (const bl of [70, 36, 16]) { ctx.shadowBlur = bl; ctx.drawImage(marca, mx - mw / 2, my - mh / 2, mw, mh); }
      ctx.restore();
    }
    ctx.drawImage(marca, mx - mw / 2, my - mh / 2, mw, mh);
    if (o.url) {
      // the site, small and spaced under the mark
      ctx.save();
      ctx.font = `400 ${(mw * 0.047).toFixed(1)}px "${MONO}"`; ctx.textAlign = "center"; ctx.textBaseline = "top";
      (ctx as unknown as { letterSpacing: string }).letterSpacing = `${(mw * 0.0122).toFixed(2)}px`;
      ctx.fillStyle = `rgba(${RGB.crema},0.62)`;
      ctx.fillText(o.url.toUpperCase(), mx + mw * 0.006, my + mh / 2 + mw * 0.083);
      ctx.restore();
    }
    if (post) {
      // Retro finish in 2D (the teaser's GL post returns black outside its own pipeline): bloom, halo, vignette, scanlines, grain
      const base = document.createElement("canvas"); base.width = W; base.height = H;
      base.getContext("2d")!.drawImage(ctx.canvas, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.filter = "blur(10px) brightness(1.1)"; ctx.globalAlpha = 0.36; ctx.drawImage(base, 0, 0);
      ctx.filter = "blur(48px) saturate(1.3)"; ctx.globalAlpha = 0.42; ctx.drawImage(base, 0, 0);
      ctx.filter = "none"; ctx.globalAlpha = 1;
      // slight chromatic fringe: a red copy nudged right, a blue copy nudged left
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.07;
      ctx.filter = "sepia(1) saturate(6) hue-rotate(-50deg)"; ctx.drawImage(base, 3, 0);
      ctx.filter = "sepia(1) saturate(6) hue-rotate(170deg)"; ctx.drawImage(base, -3, 0);
      ctx.filter = "none"; ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      const vi = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.62);
      vi.addColorStop(0, "rgba(0,0,0,0)"); vi.addColorStop(1, "rgba(0,0,0,0.62)");
      ctx.fillStyle = vi; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1.4);
      const gr = ctx.createImageData(W, H); let sem = 7;
      for (let k = 0; k < gr.data.length; k += 4) { sem = (sem * 1103515245 + 12345) >>> 0; const n = (sem >>> 24); gr.data[k] = gr.data[k + 1] = gr.data[k + 2] = n; gr.data[k + 3] = 255; }
      const gc = document.createElement("canvas"); gc.width = W; gc.height = H; gc.getContext("2d")!.putImageData(gr, 0, 0);
      ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = 0.06; ctx.drawImage(gc, 0, 0);
      ctx.restore();
    }
    continueRender(handle);
  }, [marca, v, handle, post, ss, JSON.stringify(o)]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <canvas ref={ref} width={W} height={H} />
    </AbsoluteFill>
  );
};
