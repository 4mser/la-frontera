// «Deleite»: point fractals and fractal life, drawn on the CPU.
// - densidad(): millions of orbit points accumulated into a log-density image, coloured with a teaser palette
//   (strange attractors of Clifford and De Jong, Barnsley's fern).
// - milpies(): a bioluminescent creature in the spirit of «Life» (Chirag Dudhat): a body that glides along a curve,
//   legs that move in a travelling wave, each leg ending in a small branching fractal.
// - medusa(): a jellyfish whose bell pulses and whose tentacles are recursive waving curves.
// Everything is a pure function of t (seeded randomness only).
import type { Paleta } from "./fractalTeaser";

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const azar = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

const colorDe = (p: Paleta, u: number): [number, number, number] => {
  u = Math.min(0.999, Math.max(0, u));
  let i = 0;
  while (i < p.length - 2 && p[i + 1][0] < u) i++;
  const [u0, r0, g0, b0] = p[i], [u1, r1, g1, b1] = p[i + 1];
  const x = Math.min(1, Math.max(0, (u - u0) / Math.max(1e-6, u1 - u0)));
  return [255 * (r0 + (r1 - r0) * x), 255 * (g0 + (g1 - g0) * x), 255 * (b0 + (b1 - b0) * x)];
};

// ─── density images ────────────────────────────────────────────────────────────────────────────────────────────
let lienzoD: HTMLCanvasElement | null = null;
let hist: Float32Array | null = null;
const densidad = (w: number, h: number, puntos: number, paso: (k: number) => [number, number] | null, pal: Paleta, ganancia = 1, fase = 0) => {
  if (!lienzoD) lienzoD = document.createElement("canvas");
  if (lienzoD.width !== w || lienzoD.height !== h) { lienzoD.width = w; lienzoD.height = h; hist = null; }
  if (!hist || hist.length !== w * h) hist = new Float32Array(w * h);
  hist.fill(0);
  let mx = 0;
  for (let k = 0; k < puntos; k++) {
    const q = paso(k);
    if (!q) continue;
    const x = q[0] | 0, y = q[1] | 0;
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const v = ++hist[y * w + x];
    if (v > mx) mx = v;
  }
  const ctx = lienzoD.getContext("2d")!;
  const img = ctx.createImageData(w, h), d = img.data;
  const lm = Math.log(1 + mx);
  // a look-up table for the palette
  const LUT: [number, number, number][] = Array.from({ length: 256 }, (_, i) => colorDe(pal, (0.18 + 0.7 * (i / 255) + fase) % 1));
  for (let i = 0; i < w * h; i++) {
    const v = hist[i];
    if (v <= 0) { d[4 * i + 3] = 255; continue; }
    const u = Math.min(1, (Math.log(1 + v) / lm) * ganancia);
    const [r, g, b] = LUT[Math.min(255, (u * 255) | 0)];
    const l = Math.pow(u, 0.6) * 1.15, blanco = Math.max(0, u - 0.75) * 2.4;
    d[4 * i] = Math.min(255, r * l + 255 * blanco); d[4 * i + 1] = Math.min(255, g * l + 255 * blanco); d[4 * i + 2] = Math.min(255, b * l + 255 * blanco); d[4 * i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return lienzoD;
};

// Clifford: x' = sin(a y) + c cos(a x), y' = sin(b x) + d cos(b y)
export const clifford = (w: number, h: number, a: number, b: number, c: number, dd: number, pal: Paleta, puntos = 900000, zoom = 1, fase = 0) => {
  let x = 0.1, y = 0.1;
  const s = (Math.min(w, h) / 4.6) * zoom;
  return densidad(w, h, puntos, (k) => {
    const nx = Math.sin(a * y) + c * Math.cos(a * x), ny = Math.sin(b * x) + dd * Math.cos(b * y);
    x = nx; y = ny;
    return k < 20 ? null : [w / 2 + x * s, h / 2 + y * s];
  }, pal, 1.6, fase);
};
// De Jong: x' = sin(a y) − cos(b x), y' = sin(c x) − cos(d y)
export const dejong = (w: number, h: number, a: number, b: number, c: number, dd: number, pal: Paleta, puntos = 900000, zoom = 1, fase = 0) => {
  let x = 0.1, y = 0.1;
  const s = (Math.min(w, h) / 4.4) * zoom;
  return densidad(w, h, puntos, (k) => {
    const nx = Math.sin(a * y) - Math.cos(b * x), ny = Math.sin(c * x) - Math.cos(dd * y);
    x = nx; y = ny;
    return k < 20 ? null : [w / 2 + x * s, h / 2 + y * s];
  }, pal, 1.6, fase);
};
// Barnsley's fern; «viento» bends the fronds
export const helecho = (w: number, h: number, pal: Paleta, viento = 0, puntos = 700000, fase = 0) => {
  let x = 0, y = 0;
  const s = h / 10.6;
  let semilla = 7;
  const r = () => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla / 0x7fffffff; };
  return densidad(w, h, puntos, () => {
    const q = r();
    let nx, ny;
    if (q < 0.01) { nx = 0; ny = 0.16 * y; }
    else if (q < 0.86) { nx = 0.85 * x + (0.04 + viento) * y; ny = -0.04 * x + 0.85 * y + 1.6; }
    else if (q < 0.93) { nx = 0.2 * x - 0.26 * y; ny = 0.23 * x + 0.22 * y + 1.6; }
    else { nx = -0.15 * x + 0.28 * y; ny = 0.26 * x + 0.24 * y + 0.44; }
    x = nx; y = ny;
    return [w / 2 + x * s, h - 0.03 * h - y * s];
  }, pal, 1.1, fase);
};

// ─── fractal life ───────────────────────────────────────────────────────────────────────────────────────────────
const brilla = (ctx: Ctx, col: string, w: number, a: number) => {
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(${col},${0.07 * a})`; ctx.lineWidth = w * 7; ctx.stroke();
  ctx.strokeStyle = `rgba(${col},${0.22 * a})`; ctx.lineWidth = w * 2.6; ctx.stroke();
  ctx.strokeStyle = `rgba(235,255,250,${0.85 * a})`; ctx.lineWidth = w; ctx.stroke();
  ctx.restore();
};
// a branching tip: two smaller branches, «n» levels
const rama = (ctx: Ctx, x: number, y: number, ang: number, l: number, n: number, abre: number) => {
  if (n === 0 || l < 1.2) return;
  const x2 = x + Math.cos(ang) * l, y2 = y + Math.sin(ang) * l;
  ctx.moveTo(x, y); ctx.lineTo(x2, y2);
  rama(ctx, x2, y2, ang - abre, l * 0.62, n - 1, abre * 0.95);
  rama(ctx, x2, y2, ang + abre, l * 0.62, n - 1, abre * 0.95);
};
// the millipede glides along a curve: camino(s) gives a point of the path for s (0..1 across the frame)
export const milpies = (ctx: Ctx, t: number, camino: (s: number) => [number, number], cabeza: number, escala: number, a: number, col = "120,255,220") => {
  if (a <= 0.01) return;
  const N = 46, paso = 0.0105;
  const P: [number, number][] = [], Tg: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const s = cabeza - i * paso;
    const p0 = camino(s), p1 = camino(s - 0.001);
    const dx = p0[0] - p1[0], dy = p0[1] - p1[1], l = Math.hypot(dx, dy) || 1;
    P.push(p0); Tg.push([dx / l, dy / l]);
  }
  // the spine and its segments
  ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  brilla(ctx, col, 3.2 * escala, a);
  for (let i = 0; i < N; i++) {
    const [x, y] = P[i], [tx, ty] = Tg[i], nx = -ty, ny = tx;
    const r = escala * (10 - 6 * Math.pow(i / N, 1.5));
    ctx.beginPath(); ctx.ellipse(x, y, r * 1.25, r * 0.8, Math.atan2(ty, tx), 0, TAU);
    brilla(ctx, col, 1.3 * escala, a * 0.8);
    // two legs per segment: a travelling wave (each leg a little later than the one before)
    for (const lado of [-1, 1]) {
      const fase = t * 7.5 - i * 0.55 + (lado > 0 ? Math.PI : 0);
      const levanta = Math.sin(fase), adelante = Math.cos(fase);
      const l1 = escala * (34 - 14 * (i / N)), l2 = l1 * 0.9;
      const a1 = Math.atan2(lado * ny, lado * nx) + 0.45 * adelante * -1 + (lado > 0 ? -0.15 : 0.15);
      const kx = x + Math.cos(a1) * l1, ky = y + Math.sin(a1) * l1;
      const a2 = a1 + lado * (0.9 + 0.35 * levanta);
      const fx = kx + Math.cos(a2) * l2, fy = ky + Math.sin(a2) * l2;
      ctx.beginPath(); ctx.moveTo(x + nx * lado * r * 0.6, y + ny * lado * r * 0.6); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy);
      rama(ctx, fx, fy, a2, l2 * 0.5, 3, 0.55 + 0.15 * levanta);
      brilla(ctx, col, 1.1 * escala, a * (0.7 + 0.3 * (1 - i / N)));
    }
  }
  // the head: antennae that are fractal branches
  const [hx, hy] = P[0], [tx, ty] = Tg[0], ang = Math.atan2(ty, tx);
  ctx.beginPath();
  for (const lado of [-1, 1]) rama(ctx, hx, hy, ang + lado * (0.5 + 0.08 * Math.sin(t * 3)), escala * 30, 5, 0.42);
  brilla(ctx, col, 1.2 * escala, a);
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, escala * 40);
  g.addColorStop(0, `rgba(255,255,255,${0.8 * a})`); g.addColorStop(0.25, `rgba(${col},${0.35 * a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(hx - escala * 40, hy - escala * 40, escala * 80, escala * 80); ctx.restore();
};
// a tentacle: a waving curve that splits into two smaller tentacles, «n» levels
const tentaculo = (ctx: Ctx, x: number, y: number, ang: number, l: number, n: number, t: number, sem: number) => {
  let px = x, py = y, a = ang;
  const pasos = 14;
  ctx.moveTo(px, py);
  for (let k = 1; k <= pasos; k++) {
    a += 0.11 * Math.sin(t * 2.2 - k * 0.5 + sem * 6.3) + 0.02 * (azar(sem * 31 + k) - 0.5);
    px += Math.cos(a) * (l / pasos); py += Math.sin(a) * (l / pasos);
    ctx.lineTo(px, py);
  }
  if (n > 0) {
    tentaculo(ctx, px, py, a - 0.35, l * 0.6, n - 1, t + 0.3, sem * 1.7 + 0.1);
    tentaculo(ctx, px, py, a + 0.35, l * 0.6, n - 1, t + 0.5, sem * 2.3 + 0.2);
    ctx.moveTo(px, py);
  }
};
export const medusa = (ctx: Ctx, t: number, cx: number, cy: number, R: number, a: number, col = "255,150,220") => {
  if (a <= 0.01) return;
  const pulso = 0.5 + 0.5 * Math.sin(t * 2.6);
  const ancho = R * (1 + 0.14 * pulso), alto = R * (0.78 - 0.12 * pulso);
  // the bell: nested arcs
  for (let k = 0; k < 7; k++) {
    const f = 1 - k * 0.12;
    ctx.beginPath(); ctx.ellipse(cx, cy, ancho * f, alto * f, 0, Math.PI, TAU);
    ctx.ellipse(cx, cy, ancho * f, alto * 0.18 * f, 0, 0, Math.PI);
    brilla(ctx, col, k === 0 ? 2.2 : 1, a * (k === 0 ? 1 : 0.5));
  }
  // the fringe and the tentacles hanging from the rim
  ctx.beginPath();
  const n = 18;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), x = cx - ancho + 2 * ancho * u, y = cy + alto * 0.18 * Math.sin(Math.PI * u);
    tentaculo(ctx, x, y, Math.PI / 2 + (u - 0.5) * 0.5, R * (1.1 + 0.5 * azar(i)), 2, t + i * 0.2, i + 1);
  }
  brilla(ctx, col, 1.1, a * 0.85);
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(cx, cy - alto * 0.4, 0, cx, cy - alto * 0.4, R * 1.4);
  g.addColorStop(0, `rgba(${col},${0.32 * a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(cx - R * 1.5, cy - R * 1.8, R * 3, R * 3.2); ctx.restore();
};
