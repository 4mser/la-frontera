// LA FRONTERA · built from DIRECCION-motion.md. One locked, front-on camera; every bar is made out of the previous one;
// hard cuts only in the race of worlds. Only the rule z -> z^2 + c. Teaser colouring and the teaser's retro finish.
import F from "./frontera.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { RGB, SANS, MONO, cl, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = 1920;
export const H = 1080;
type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const B = F.latidos;
const latido = (k: number) => B[Math.min(k, B.length - 1)];
// critically damped spring: never passes its target
const resorte = (x: number, w = 22) => (x <= 0 ? 0 : 1 - (1 + w * x) * Math.exp(-w * x));
// a move that lands on beat k (starts 0.05 s before)
const en = (t: number, k: number, w = 22) => resorte(t - latido(k) + 0.05, w);
const expIn = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, 10 * x - 10));

const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  ctx.font = `${op.peso ?? 500} ${tam}px "${op.fam ?? MONO}"`;
  ctx.fillStyle = color;
  ctx.textAlign = op.alin ?? "left";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 0}px`;
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};

// ─── painting the rule ─────────────────────────────────────────────────────────────────────────────────────────
type Vista = { cx: number; cy: number; esc: number; julia?: [number, number]; pal: number; fase: number; rot?: number };
const SS = 2;
// paints a view (esc = complex units per screen pixel) into a rectangle, computed at twice the resolution
const pinta = (ctx: Ctx, x: number, y: number, w: number, h: number, V: Vista, alfa = 1) => {
  const pw = Math.max(8, Math.round(w * SS)), ph = Math.max(8, Math.round(h * SS));
  const l = pintarFractalTeaser(pw, ph, { cx: V.cx, cy: V.cy, esc: V.esc / SS, rot: V.rot ?? 0, julia: V.julia, modo: 0, lente: 1e9, fase: V.fase, paleta: PALETAS[V.pal], brillo: 0.9, maxIt: V.julia ? 320 : Math.round(260 + 170 * Math.log10(Math.max(1, 2.8 / (V.esc * 1920)))), tiempo: 0 });
  ctx.globalAlpha = alfa;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(l, x, y, w, h);
  ctx.globalAlpha = 1;
};
const clip = (ctx: Ctx, camino: () => void, dibujo: () => void) => { ctx.save(); ctx.beginPath(); camino(); ctx.clip(); dibujo(); ctx.restore(); };
const linea = (ctx: Ctx, camino: () => void, a: number, ancho = 2.2) => {
  if (a <= 0) return;
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${a})`; ctx.lineWidth = ancho; ctx.lineJoin = "round"; ctx.beginPath(); camino(); ctx.stroke(); ctx.restore();
};
const luz = (ctx: Ctx, x: number, y: number, r: number, a: number) => {
  if (a <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${RGB.crema},${a})`); g.addColorStop(0.15, `rgba(${RGB.crema},${a * 0.45})`); g.addColorStop(1, `rgba(${RGB.crema},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
};
const hexagono = (ctx: Ctx, cx: number, cy: number, r: number) => {
  for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
  ctx.closePath();
};

// the plane of the whole set (also the plane of the orbits): the top antenna stays in frame
const PLANO = { cx: -0.55, cy: 0.2, esc: 4.2 / W };
const aPantalla = (re: number, im: number) => [W / 2 + (re - PLANO.cx) / PLANO.esc, H / 2 - (im - PLANO.cy) / PLANO.esc];
const COPIA: [number, number] = [-0.1565202, 1.0322471]; // an isolated mini-Mandelbrot (period 4) on the top antenna
const M_FIN: [number, number] = [-0.77568377, 0.13646737]; // a Misiurewicz point: spirals at every scale
const JULIAS: [number, number][] = [
  [-0.8, 0.156], [-0.123, 0.745], [-1.0, 0.0], [0.285, 0.01], [-0.39054, -0.58679], [-0.7269, 0.1889], [-0.835, -0.2321],
  [-0.4, 0.6], [0.355, 0.355], [-0.7, 0.27015], [-0.54, 0.54], [-0.162, 1.04], [0.37, 0.1],
];
const julia = (k: number, t: number): [number, number] => {
  const [a, b] = JULIAS[((k % JULIAS.length) + JULIAS.length) % JULIAS.length];
  return [a + 0.016 * Math.cos(t * 1.3 + k), b + 0.016 * Math.sin(t * 1.3 + k)];
};

// ─── bar 1 · PULSO: an electrocardiogram drawn left to right, one complex per beat ─────────────────────────────
const X0 = 150, X1 = W - 150, YB = H / 2 + 60, AMP = 170;
const ecg = (f: number) => {
  // P wave, QRS complex and T wave for one beat, f in [0, 1)
  const g = (c: number, s: number) => Math.exp(-(((f - c) / s) ** 2));
  return 0.12 * g(0.16, 0.035) - 0.12 * g(0.285, 0.008) + 1.0 * g(0.3, 0.011) - 0.28 * g(0.318, 0.01) + 0.22 * g(0.55, 0.06);
};
const xLatido = (u: number) => X0 + ((X1 - X0) * u) / 4; // u in beats since the first one
const picoR = () => [xLatido(3.3), YB - AMP];
const pulso = (ctx: Ctx, t: number) => {
  const fin = latido(4);
  if (t > fin + 0.6) return;
  // progress in beats: position inside each beat interval
  let u = 0;
  for (let k = 0; k < 4; k++) u += cl((t - latido(k)) / (latido(k + 1) - latido(k)));
  const desvanece = 1 - eSuave(pr(t, fin - 0.3, 0.3));
  ctx.save();
  ctx.strokeStyle = `rgba(${RGB.crema},${0.85 * desvanece})`;
  ctx.lineWidth = 2.6;
  ctx.lineJoin = "round";
  ctx.beginPath();
  const pasos = Math.floor(u * 220);
  for (let i = 0; i <= pasos; i++) {
    const v = i / 220;
    const x = xLatido(v), y = YB - AMP * ecg(v - Math.floor(v));
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
  if (u > 0 && t < fin) {
    const x = xLatido(u), y = YB - AMP * ecg(u - Math.floor(u));
    luz(ctx, x, y, 40, 0.8 * desvanece);
  }
};

// ─── bar 2 · REGLA: the point writes the rule; the c detaches ──────────────────────────────────────────────────
const FORMULA = "z → z² + c";
const CORTES_F = [1, 3, 6, 10]; // characters visible after each beat: z · z → · z → z² · z → z² + c
const medida = (ctx: Ctx, s: string, tam: number) => { ctx.font = `700 ${tam}px "${SANS}"`; return ctx.measureText(s).width; };
const posFormula = (ctx: Ctx) => {
  const tam = 170, total = medida(ctx, FORMULA, tam);
  const x0 = W / 2 - total / 2, y = H / 2 + 60;
  const xc = x0 + medida(ctx, FORMULA.slice(0, 9), tam) + medida(ctx, "c", tam) / 2;
  return { tam, x0, y, xc, yc: y - tam * 0.28 };
};
const regla = (ctx: Ctx, t: number) => {
  const a0 = latido(4) - 0.3, fin = latido(8);
  if (t < a0 || t > fin + 0.7) return;
  const P = posFormula(ctx);
  // the point travels from the R peak to the writing head
  let n = 0;
  CORTES_F.forEach((c, k) => { if (t >= latido(4 + k) - 0.05) n = c; });
  const ancho = medida(ctx, FORMULA.slice(0, n), P.tam);
  const [rx, ry] = picoR();
  const k0 = en(t, 4, 14);
  const hx = lerp(rx, P.x0 + ancho + 14, k0), hy = lerp(ry, P.yc, k0);
  // letters: all but the c fall away on the first beat of the next bar
  const cae = expIn(cl((t - fin + 0.05) / 0.35));
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, P.x0 + ancho + 2, H); ctx.clip();
  ctx.globalAlpha = 1 - cae;
  texto(ctx, FORMULA.slice(0, 9), P.x0, P.y + cae * 260, P.tam, `rgb(${RGB.crema})`, { fam: SANS, peso: 700 });
  ctx.globalAlpha = 1;
  // the c shrinks into a point
  const sc = 1 - en(t, 8, 18);
  if (sc > 0.02) {
    ctx.save();
    ctx.translate(P.xc, P.yc);
    ctx.scale(sc, sc);
    texto(ctx, "c", 0, P.tam * 0.28, P.tam, `rgb(${RGB.crema})`, { fam: SANS, peso: 700, alin: "center" });
    ctx.restore();
  }
  ctx.restore();
  if (t < fin) luz(ctx, hx, hy, 44, 0.8);
};

// ─── bar 3 · ÓRBITA: the point jumps by the rule; three jumps per beat ─────────────────────────────────────────
const ORBITAS: { c: [number, number]; z: number[][]; escapa: boolean }[] = [[-0.12, 0.66], [0.32, 0.55], [-1.05, 0.2], [-1.75, 0.55], [0.27, 0.0], [-0.55, -0.48]].map((c) => {
  const z: number[][] = [[0, 0]];
  let x = 0, y = 0, escapa = false;
  for (let i = 0; i < 40; i++) { const nx = x * x - y * y + c[0]; y = 2 * x * y + c[1]; x = nx; z.push([x, y]); if (x * x + y * y > 30) { escapa = true; break; } }
  return { c: c as [number, number], z, escapa };
});
const orbita = (ctx: Ctx, t: number) => {
  const a0 = latido(8), fin = latido(13);
  if (t < a0 - 0.1 || t > fin) return;
  const P = posFormula(ctx);
  const sale = 1 - eSuave(pr(t, latido(12), latido(13) - latido(12)));
  // jumps: three per beat
  let saltos = 0;
  for (let k = 8; k < 12; k++) saltos += 3 * cl((t - latido(k)) / (latido(k + 1) - latido(k)));
  ORBITAS.forEach((O, j) => {
    const [cx, cy] = aPantalla(O.c[0], O.c[1]);
    const llega = en(t, 8 + (j === 0 ? 0 : 1), 16);
    const ox = j === 0 ? lerp(P.xc, cx, llega) : cx, oy = j === 0 ? lerp(P.yc, cy, llega) : cy;
    const ac = (j === 0 ? 1 : llega) * sale;
    const rgb = O.escapa ? RGB.durazno : RGB.crema;
    const n = Math.min(O.z.length - 1, Math.floor(saltos));
    const f = resorte(saltos - n, 9);
    const pts = O.z.slice(0, n + 1).map(([x, y]) => aPantalla(x, y));
    if (n < O.z.length - 1) { const [x1, y1] = aPantalla(O.z[n + 1][0], O.z[n + 1][1]); const [x0, y0] = pts[pts.length - 1]; pts.push([lerp(x0, x1, f), lerp(y0, y1, f)]); }
    ctx.strokeStyle = `rgba(${rgb},${0.55 * ac})`; ctx.lineWidth = 1.6;
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.fillStyle = `rgba(${rgb},${ac})`;
    pts.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 3.4, 0, TAU); ctx.fill(); });
    linea(ctx, () => { ctx.moveTo(ox - 9, oy); ctx.lineTo(ox + 9, oy); ctx.moveTo(ox, oy - 9); ctx.lineTo(ox, oy + 9); }, ac, 2);
    const [hx, hy] = pts[pts.length - 1];
    luz(ctx, hx, hy, 26, 0.6 * ac);
  });
};

// ─── bar 4 · CONJUNTO: trapped points multiply beat by beat until the set appears ──────────────────────────────
const NP = 90000;
let PUNTOS: { x: Float32Array; y: Float32Array; dentro: Uint8Array; orden: Float32Array } | null = null;
let capaP: { c: HTMLCanvasElement; img: ImageData } | null = null;
const puntos = () => {
  if (PUNTOS) return PUNTOS;
  let s = 7;
  const az = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const x = new Float32Array(NP), y = new Float32Array(NP), dentro = new Uint8Array(NP), orden = new Float32Array(NP);
  for (let i = 0; i < NP; i++) {
    const px = az() * W, py = az() * H;
    const cr = PLANO.cx + (px - W / 2) * PLANO.esc, ci = PLANO.cy - (py - H / 2) * PLANO.esc;
    let zr = 0, zi = 0, k = 0;
    for (; k < 160; k++) { const tr = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = tr; if (zr * zr + zi * zi > 4) break; }
    x[i] = px; y[i] = py; dentro[i] = k >= 160 ? 1 : 0; orden[i] = az();
  }
  PUNTOS = { x, y, dentro, orden };
  return PUNTOS;
};
const conjuntoPuntos = (ctx: Ctx, t: number) => {
  const a0 = latido(12) - 0.05;
  if (t < a0 || t > latido(16) + 0.5) return;
  const P = puntos();
  if (!capaP) { const c = document.createElement("canvas"); c.width = W; c.height = H; capaP = { c, img: c.getContext("2d")!.createImageData(W, H) }; }
  const d = capaP.img.data;
  d.fill(0);
  let vis = 0;
  for (let k = 0; k < 4; k++) vis += 0.25 * en(t, 12 + k, 18);
  for (let i = 0; i < NP; i++) {
    if (!P.dentro[i] || P.orden[i] > vis) continue;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const j = (((P.y[i] | 0) + dy) * W + (P.x[i] | 0) + dx) * 4;
      if (j >= 0 && j < d.length) { d[j] = 255; d[j + 1] = 244; d[j + 2] = 222; d[j + 3] = 255; }
    }
  }
  capaP.c.getContext("2d")!.putImageData(capaP.img, 0, 0);
  ctx.globalAlpha = 1 - eSuave(pr(t, latido(15), 0.5));
  ctx.drawImage(capaP.c, 0, 0);
  ctx.globalAlpha = 1;
};
const conjunto = (ctx: Ctx, t: number, alfa = 1) => {
  pinta(ctx, 0, 0, W, H, { ...PLANO, pal: 0, fase: 0.04 * t }, alfa);
};

// ─── bars 5-6 · LUPA: a magnifier on the antenna, one level deeper per beat; it grows to fill the frame ────────
const LUPA = { x: W * 0.64, y: H * 0.54, r: 290 };
const ESC_FIN = 0.1 / W; // at the end the lens shows the copy region across the whole frame
const escLupa = (t: number) => {
  // from 1x to the final scale in five steps, one per beat (17-21), each landing with a spring
  const total = Math.log(PLANO.esc / ESC_FIN);
  let k = 0;
  for (let b = 17; b <= 21; b++) k += en(t, b, 20);
  return PLANO.esc * Math.exp((-total * k) / 5);
};
const lupa = (ctx: Ctx, t: number) => {
  const crece = en(t, 22, 10);
  const R = lerp(LUPA.r, Math.hypot(W, H), crece);
  const cx = lerp(LUPA.x, W / 2, crece), cy = lerp(LUPA.y, H / 2, crece);
  const [tx, ty] = aPantalla(COPIA[0], COPIA[1]);
  const dibuja = en(t, 16, 14);
  // marker on the antenna and the leader line to the lens
  const am = 1 - crece;
  linea(ctx, () => ctx.arc(tx, ty, 16, 0, TAU), 0.85 * dibuja * am);
  linea(ctx, () => { ctx.moveTo(tx + 12, ty + 12); ctx.lineTo(lerp(tx, cx - R * 0.7, dibuja), lerp(ty, cy - R * 0.7, dibuja)); }, 0.6 * dibuja * am, 1.4);
  const rr = R * dibuja;
  if (rr < 2) return;
  const esc = escLupa(t);
  // render the visible frame with the copy at the lens centre, then clip the circle (no oversized canvas)
  clip(ctx, () => ctx.arc(cx, cy, rr, 0, TAU), () => pinta(ctx, 0, 0, W, H, { cx: COPIA[0] + (W / 2 - cx) * esc, cy: COPIA[1] - (H / 2 - cy) * esc, esc, pal: 1, fase: 0.04 * t }));
  linea(ctx, () => ctx.arc(cx, cy, rr, -Math.PI / 2, -Math.PI / 2 + TAU * dibuja), 0.85 * am, 2.6);
  const mag = Math.round(PLANO.esc / esc);
  if (mag > 1 && am > 0.05) texto(ctx, `×${mag}`, cx + rr * 0.72, cy + rr * 0.86, 26, `rgba(${RGB.crema},${0.85 * am})`, { esp: 4 });
};

// ─── bar 7 · COPIA: the dive settles on a whole mini-Mandelbrot; its outline closes into a hexagon ─────────────
const ESC_COPIA = (0.0085 * 7.5) / W;
const escCopia = (t: number) => Math.exp(lerp(Math.log(ESC_FIN), Math.log(ESC_COPIA), en(t, 24, 8)));
const RH = 300;
const radioHex = (t: number) => lerp(1300, RH, en(t, 26, 12));
const copia = (ctx: Ctx, t: number) => {
  const r = radioHex(t);
  const V: Vista = { cx: COPIA[0], cy: COPIA[1], esc: escCopia(t), pal: 1, fase: 0.04 * t };
  clip(ctx, () => hexagono(ctx, W / 2, H / 2, r), () => pinta(ctx, 0, 0, W, H, V));
  linea(ctx, () => hexagono(ctx, W / 2, H / 2, r), 0.85 * en(t, 26, 12), 2.6);
};

// ─── bar 8 · PANAL: the hexagon shrinks; six, then twelve cells of Julia worlds slide out ─────────────────────
const RC = 112;
const celdas = (() => {
  const hw = Math.sqrt(3) * RC;
  const out: { x: number; y: number; anillo: number }[] = [];
  for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) {
    const s = -q - r;
    const d = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
    if (d === 0 || d > 2) continue;
    out.push({ x: W / 2 + hw * (q + r / 2), y: H / 2 + 1.5 * RC * r, anillo: d });
  }
  return out;
})();
const ELEGIDA = 0; // the cell that later opens into a world
const panal = (ctx: Ctx, t: number, sinCentro = false) => {
  const rc = lerp(RH, RC - 4, en(t, 28, 14));
  if (!sinCentro) {
    const V: Vista = { cx: COPIA[0], cy: COPIA[1], esc: ESC_COPIA * (RH / rc), pal: 1, fase: 0.04 * t };
    clip(ctx, () => hexagono(ctx, W / 2, H / 2, rc), () => pinta(ctx, W / 2 - rc, H / 2 - rc, 2 * rc, 2 * rc, { ...V, esc: V.esc }));
    linea(ctx, () => hexagono(ctx, W / 2, H / 2, rc), 0.8);
  }
  celdas.forEach((c, k) => {
    const p = en(t, c.anillo === 1 ? 29 : 30, 16);
    if (p <= 0.01) return;
    const x = lerp(W / 2, c.x, p), y = lerp(H / 2, c.y, p), r = (RC - 4) * p;
    clip(ctx, () => hexagono(ctx, x, y, r), () => pinta(ctx, x - r, y - r, 2 * r, 2 * r, { cx: 0, cy: 0, esc: 3.3 / (2 * RC), julia: julia(k, t), pal: k % 3, fase: 0.05 * t + k }));
    linea(ctx, () => hexagono(ctx, x, y, r), 0.6 * p, 1.6);
  });
};

// ─── bar 9 · MUNDO: one cell grows to the whole frame with a hard edge ─────────────────────────────────────────
const mundo = (ctx: Ctx, t: number) => {
  const c = celdas[ELEGIDA];
  const g = en(t, 32, 9);
  const r = lerp(RC - 4, 1300, g);
  const x = lerp(c.x, W / 2, g), y = lerp(c.y, H / 2, g);
  // the world keeps its size on screen until the edge passes the frame, then settles to fit
  const esc = Math.max(3.6 / W, 3.3 / (2 * r));
  clip(ctx, () => hexagono(ctx, x, y, r), () => pinta(ctx, 0, 0, W, H, { cx: (W / 2 - x) * esc, cy: -(H / 2 - y) * esc, esc, julia: julia(ELEGIDA, t), pal: ELEGIDA % 3, fase: 0.05 * t + ELEGIDA }));
  linea(ctx, () => hexagono(ctx, x, y, r), 0.8 * (1 - g));
};

// ─── bars 10-11 · CARRERA: the heart at 120; hard cut to a new world on every beat ─────────────────────────────
const carrera = (ctx: Ctx, t: number, k: number) => {
  const n = k - 36 + 1;
  pinta(ctx, 0, 0, W, H, { cx: 0, cy: 0, esc: (3.6 - 0.25 * eOut(cl((t - latido(k)) / 0.5))) / W, julia: julia(n, t), pal: n % 3, fase: 0.06 * t + n });
};

// ─── bar 12 · ESPEJO: the world folds into six mirrors and turns; bar 13 · COLAPSO: the wedges close ───────────
let cuna: HTMLCanvasElement | null = null;
const espejo = (ctx: Ctx, t: number) => {
  const n = 9;
  if (!cuna) { cuna = document.createElement("canvas"); cuna.width = 1100; cuna.height = 1100; }
  const cc = cuna.getContext("2d")!;
  cc.clearRect(0, 0, 1100, 1100);
  pinta(cc, 0, 0, 1100, 1100, { cx: 0.3, cy: 0.1, esc: 1.2 / 1100, julia: julia(5, t), pal: 2, fase: 0.06 * t + n });
  const espejos = Math.round(lerp(2, 6, en(t, 45, 12)));
  const a = TAU / espejos;
  const R = Math.hypot(W, H) / 2 * (1 - expIn(cl((t - latido(48) + 0.05) / (F.colapso - latido(48) + 0.05))));
  for (let k = 0; k < espejos; k++) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(0.6 * (t - latido(44)) + k * a);
    if (k % 2) ctx.scale(1, -1);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, -a / 2 - 0.004, a / 2 + 0.004); ctx.closePath(); ctx.clip();
    ctx.drawImage(cuna, 0, -550, 1100, 1100);
    ctx.restore();
  }
};

// ─── the rule: after the silence the point opens into the set; slow dive with the voice; title; return ────────
let capaT: HTMLCanvasElement | null = null;
const textoFractal = (ctx: Ctx, s: string, y: number, tam: number, a: number, t: number, peso = 700, esp = 0) => {
  if (a <= 0) return;
  if (!capaT) { capaT = document.createElement("canvas"); capaT.width = W; capaT.height = H; }
  const c = capaT.getContext("2d")!;
  c.globalCompositeOperation = "source-over";
  c.clearRect(0, 0, W, H);
  pinta(c, 0, 0, W, H, { cx: -0.7453, cy: 0.1127, esc: (0.06 * Math.exp(-0.08 * (t - F.florece))) / W, pal: 2, fase: 0.06 * t + 0.4 });
  c.globalCompositeOperation = "destination-in";
  texto(c, s, W / 2, y, tam, "#fff", { fam: SANS, peso, alin: "center", esp });
  c.globalCompositeOperation = "source-atop";
  c.fillStyle = "rgba(255,244,222,0.38)";
  c.fillRect(0, 0, W, H);
  ctx.save();
  const sombra = ctx.createRadialGradient(W / 2, y - tam * 0.35, 0, W / 2, y - tam * 0.35, W * 0.42);
  sombra.addColorStop(0, `rgba(2,3,6,${0.55 * a})`); sombra.addColorStop(1, "rgba(2,3,6,0)");
  ctx.fillStyle = sombra; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.globalAlpha = a;
  ctx.drawImage(capaT, 0, 0);
  ctx.save();
  ctx.font = `${peso} ${tam}px "${SANS}"`; ctx.textAlign = "center";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${esp}px`;
  ctx.strokeStyle = `rgba(${RGB.crema},${0.55 * a})`; ctx.lineWidth = 1.6; ctx.strokeText(s, W / 2, y);
  ctx.restore();
  ctx.globalAlpha = 1;
};
const laRegla = (ctx: Ctx, t: number, marca: HTMLImageElement | null) => {
  // the point opens into the whole set with a hard circular edge
  const abre = resorte(t - F.florece, 7);
  const cierra = expIn(cl((t - F.vuelta) / (F.total - F.vuelta - 0.6)));
  const R = Math.hypot(W, H) / 2 * abre * (1 - cierra);
  const u = cl((t - F.florece) / (F.titulo - F.florece));
  const esc = (3.6 * Math.exp(-Math.log(3.6 / 0.0016) * Math.pow(u, 0.72))) / W;
  const lleva = eIO(cl(u * 6));
  const a = 1 - eSuave(pr(t, F.titulo - 0.8, 0.8));
  if (R > 1 && a > 0) clip(ctx, () => ctx.arc(W / 2, H / 2, R, 0, TAU), () => pinta(ctx, 0, 0, W, H, { cx: lerp(-0.6, M_FIN[0], lleva), cy: lerp(0, M_FIN[1], lleva), esc, pal: 0, fase: 0.04 * t }, a));
  const ar = Math.min(eSuave(pr(t, F.regla, 0.8)), 1 - eSuave(pr(t, F.reglaFin, 0.8)));
  textoFractal(ctx, "z → z² + c", H / 2 + 110, 300, ar, t, 400);
  const at = Math.min(eSuave(pr(t, F.titulo, 0.4)), 1 - eSuave(pr(t, F.vuelta, 0.8)));
  textoFractal(ctx, "LA FRONTERA", H / 2 + 70, 200, at, t, 700, 18);
  const am = Math.min(eSuave(pr(t, F.titulo + 1.2, 0.9)), 1 - eSuave(pr(t, F.vuelta, 0.8)));
  if (am > 0 && marca) {
    const mw = 230, mh = (mw * marca.height) / marca.width;
    ctx.globalAlpha = am; ctx.drawImage(marca, W / 2 - mw / 2, H / 2 + 190, mw, mh); ctx.globalAlpha = 1;
  }
  // return: everything gathers into the point, which fades into the first (black) frame
  const ap = Math.min(eSuave(pr(t, F.vuelta + 0.6, 0.6)), 1 - eSuave(pr(t, F.total - 0.7, 0.6)));
  luz(ctx, W / 2, H / 2, 46, 0.85 * ap);
};

// ─── labels, timeline and the frame ────────────────────────────────────────────────────────────────────────────
const NOMBRES = ["PULSO", "REGLA", "ÓRBITA", "CONJUNTO", "LUPA", "LUPA", "COPIA", "PANAL", "MUNDO", "CARRERA", "CARRERA", "ESPEJO", "COLAPSO"];
const N_PULSOS = 49;
const indice = (t: number) => { let k = 0; while (k + 1 < B.length && B[k + 1] <= t) k++; return k; };
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: 0.05, scan: 0.2, curva: 0.16, ruido: 0.6, grade: 1.8 };

export const dibujarFrontera = (ctx: Ctx, t: number, frame: number, marca: HTMLImageElement | null) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  const k = indice(t);
  const bar = t < B[0] ? 0 : Math.floor(k / 4);
  if (t < F.colapso) {
    if (bar <= 1) { pulso(ctx, t); regla(ctx, t); }
    else if (bar === 2) { regla(ctx, t); orbita(ctx, t); }
    else if (bar === 3) { orbita(ctx, t); conjunto(ctx, t, eSuave(pr(t, latido(15), 0.5))); conjuntoPuntos(ctx, t); }
    else if (bar <= 5) { conjunto(ctx, t, 1); lupa(ctx, t); }
    else if (bar === 6) copia(ctx, t);
    else if (bar === 7) panal(ctx, t);
    else if (bar === 8) { panal(ctx, t); mundo(ctx, t); }
    else if (bar <= 10) carrera(ctx, t, k);
    else espejo(ctx, t);
  } else {
    // silence: the single heartbeat lights the point once
    const p = Math.exp(-Math.max(0, t - F.latidoSolo) * 5) * (t > F.latidoSolo ? 1 : 0);
    if (t < F.florece + 0.3) luz(ctx, W / 2, H / 2, 30 + 50 * p, 0.55 + 0.4 * p);
    laRegla(ctx, t, marca);
  }
  // the two corner labels
  if (t >= B[0] - 0.2 && t < F.colapso) {
    const nombre = NOMBRES[Math.min(bar, NOMBRES.length - 1)];
    texto(ctx, `FIG. ${String(bar + 1).padStart(2, "0")} — ${nombre}`, 150, 90, 24, `rgba(${RGB.crema},0.7)`, { esp: 4 });
    texto(ctx, `LATIDO ${String(Math.min(k + 1, N_PULSOS)).padStart(2, "0")} / ${N_PULSOS}`, W - 150, H - 70, 24, `rgba(${RGB.crema},0.7)`, { alin: "right", esp: 4 });
  } else if (t >= F.florece && t < F.vuelta + 0.6) {
    const nombre = t < F.titulo ? "LA REGLA" : "LA FRONTERA";
    texto(ctx, `FIG. 14 — ${nombre}`, 150, 90, 24, `rgba(${RGB.crema},${0.7 * eSuave(pr(t, F.florece, 1))})`, { esp: 4 });
  }
  const imp = bar >= 9 && bar <= 10 && t < F.colapso ? Math.exp(-(t - latido(k)) * 9) : 0;
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.86, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: RETRO.curva, esq: RETRO.curva, impacto: imp * 0.6, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
