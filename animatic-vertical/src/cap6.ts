// CAPÍTULO VI · «La misma regla, en el tiempo» (fractales/GUION-capitulo-6-la-misma-regla.md). Richardson's dream;
// Lorenz's rounded number and the two wings of his 1963 system (herramientas/lorenz_cap6.py); the logistic rule of
// chapter V, exact and still unpredictable; the moment: its bifurcation diagram deformed with c = r/2 − r²/4 and
// z = r(½ − x) until it sits under the real axis of the Mandelbrot set; Feigenbaum's 4,669; and a cloud of
// uncertainty spreading over Lorenz's wings.
import K from "./cap6.json";
import { LIMPIO as SIN_TEXTO_TRAILER } from "./limpio";
import LZ from "./cap6_lorenz.json";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS } from "./fractalTeaser";
import { pintarProfundo } from "./profundo";
import { RGB, SANS, MONO, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
type Fotos = Record<string, HTMLImageElement>;
type P = [number, number];
const AMBAR = "255,190,120", AZUL = "150,190,255";
const KT = Math.min(1, W / 1500);
const LIMPIO = (FORMATO as { limpio?: boolean }).limpio === true;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: LIMPIO ? 0 : 0.05, scan: LIMPIO ? 0 : 0.18, ruido: LIMPIO ? 0 : 0.5, grade: 1.8 };
const V = K.voz as number[];

// ─── helpers (as in chapters III–V) ─────────────────────────────────────────────────────────────────────────────
const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  if (SIN_TEXTO_TRAILER && color !== "#fff") return;
  ctx.font = `${op.peso ?? 500} ${tam}px "${op.fam ?? MONO}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 3}px`;
  ctx.fillStyle = color; ctx.textAlign = op.alin ?? "left";
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};
const ventana = (t: number, a: number, b: number, d = 0.6) => Math.min(eSuave(pr(t, a, d)), 1 - eSuave(pr(t, b - d, d)));
const luz = (ctx: Ctx, x: number, y: number, r: number, a: number, col = AMBAR) => {
  if (a <= 0 || r < 0.5) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.22, `rgba(${col},${0.6 * a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
};
const trazo = (ctx: Ctx, pts: P[], col: string, a: number, w = 2) => {
  if (a <= 0.01 || pts.length < 2) return;
  ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
  const camino = () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
  ctx.globalCompositeOperation = "lighter";
  for (const [lw, o] of [[w * 7, 0.07], [w * 2.6, 0.2]] as const) { ctx.strokeStyle = `rgba(${col},${o * a})`; ctx.lineWidth = lw; camino(); ctx.stroke(); }
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(${col},${0.95 * a})`; ctx.lineWidth = w; camino(); ctx.stroke();
  ctx.restore();
};
const rotulo = (ctx: Ctx, nombre: string, linea: string, a: number, x = 84, y = H - 128, alin: CanvasTextAlign = "left") => {
  if (a <= 0.01) return;
  texto(ctx, nombre, x, y, 26 * KT + 6, `rgba(${RGB.crema},${0.92 * a})`, { fam: SANS, peso: 600, esp: 3, alin });
  if (linea) texto(ctx, linea, x, y + 36, 16 * KT + 4, `rgba(${AMBAR},${0.8 * a})`, { esp: 5, alin });
};
const nota = (ctx: Ctx, s: string, a: number, x = W / 2, y = H - 40) => {
  if (a > 0.01) texto(ctx, s, x, y, 13 * KT + 4, `rgba(${RGB.crema},${0.55 * a})`, { alin: "center", esp: 4 });
};
const retrato = (ctx: Ctx, img: HTMLImageElement | undefined, x: number, a: number, nombre: string, linea: string, y = H * 0.2, h = H * 0.5) => {
  if (!img || a <= 0.01) return;
  const w = (h * img.width) / img.height;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(2,3,6,0.85)"; ctx.fillRect(x - w / 2 - 14, y - 14, w + 28, h + 28);
  ctx.filter = "sepia(0.35) contrast(1.05) brightness(0.95)";
  ctx.drawImage(img, x - w / 2, y, w, h);
  ctx.filter = "none";
  ctx.strokeStyle = `rgba(${RGB.crema},0.35)`; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2 - 14, y - 14, w + 28, h + 28);
  ctx.restore();
  texto(ctx, nombre, x, y + h + 56, 24 * KT + 6, `rgba(${RGB.crema},${0.92 * a})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
  if (linea) texto(ctx, linea, x, y + h + 90, 15 * KT + 4, `rgba(${AMBAR},${0.85 * a})`, { alin: "center", esp: 5 });
};
const coma = (v: number, d = 2) => v.toFixed(d).replace(".", ",");
const titular = (ctx: Ctx, s: string, y: number, tam: number, a: number, col = RGB.crema) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)";
  texto(ctx, s, W / 2, y, tam, `rgba(${col},${0.35 * a})`, { fam: SANS, peso: 300, alin: "center", esp: 4 }); ctx.restore();
  texto(ctx, s, W / 2, y, tam, `rgba(${col},${0.96 * a})`, { fam: SANS, peso: 300, alin: "center", esp: 4 });
};

// ─── the logistic rule and its diagram (r from 1 to 4), computed once ──────────────────────────────────────────
const RA = 1.0, RB = 4.0, NC = 1100;
const BIF = Array.from({ length: NC }, (_, c) => {
  const r = RA + ((RB - RA) * c) / (NC - 1); let x = 0.5; const o: number[] = [];
  for (let i = 0; i < 700; i++) { x = r * x * (1 - x); if (i >= 600) o.push(x); }
  return { r, xs: o };
});

// ─── 0 · title: the diagram where chapter V ended, one orbit jumping on it ────────────────────────────────────
const titulo = (ctx: Ctx, t: number) => {
  if (t > K.richardson + 0.6) return;
  const a = eSuave(pr(t, 0.3, 1.0)) * (1 - eSuave(pr(t, K.richardson - 0.8, 1.2)));
  const bx0 = W * 0.1, bx1 = W * 0.9, by0 = H * 0.2, by1 = H * 0.86;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,200,150,${0.28 * a})`;
  for (let c = Math.floor(NC * 0.6); c < NC; c++) { const { r, xs } = BIF[c]; const x = lerp(bx0, bx1, (r - 2.8) / 1.2); for (const v of xs) ctx.fillRect(x, lerp(by1, by0, v), 1.4, 1.4); }
  ctx.restore();
  // one orbit at r = 3,9, a jump per 0,18 s
  let x = 0.3; const n = Math.floor(Math.max(0, t - 0.5) / 0.18);
  for (let i = 0; i < n; i++) x = 3.9 * x * (1 - x);
  luz(ctx, lerp(bx0, bx1, (3.9 - 2.8) / 1.2), lerp(by1, by0, x), 26, a);
  const ut = t - K.titulo;
  if (ut < 0) return;
  ctx.fillStyle = `rgba(2,3,6,${0.55 * a * eSuave(pr(ut, 0, 1.0))})`; ctx.fillRect(0, 0, W, H);
  // the whole title on the hit, its letters drawing together, as in chapter II
  const at = eSuave(pr(ut, 0, 0.5)) * a;
  const tam = 66 * KT, esp = lerp(30, 16, eOut(pr(ut, 0, 4)));
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(14px)";
  texto(ctx, "LA MISMA REGLA, EN EL TIEMPO", W / 2 + esp / 2, H * 0.5, tam, `rgba(${RGB.crema},${0.35 * at})`, { fam: SANS, peso: 300, alin: "center", esp });
  ctx.restore();
  texto(ctx, "LA MISMA REGLA, EN EL TIEMPO", W / 2 + esp / 2, H * 0.5, tam, `rgba(${RGB.crema},${0.96 * at})`, { fam: SANS, peso: 300, alin: "center", esp });
  texto(ctx, "CAPÍTULO VI", W / 2 + 8, H * 0.5 - tam * 1.15, 24 * KT + 6, `rgba(${AMBAR},${0.9 * at * eSuave(pr(ut, 0.35, 0.8))})`, { alin: "center", esp: 16 });
};

// ─── 1 · Richardson's dream ─────────────────────────────────────────────────────────────────────────────────────
const richardson = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.richardson - 0.6 || t > K.lorenz + 0.4) return;
  const a = eSuave(pr(t, K.richardson - 0.6, 1.0)) * (1 - eSuave(pr(t, K.lorenz - 0.8, 1.0)));
  const im = f.cuadricula;
  if (im) {
    const s = Math.max(W / im.width, H / im.height) * (1.05 + 0.05 * pr(t, K.richardson, 20));
    ctx.save(); ctx.globalAlpha = a * 0.35; ctx.filter = "sepia(0.5) brightness(0.6)";
    ctx.drawImage(im, W / 2 - (im.width * s) / 2, H / 2 - (im.height * s) / 2, im.width * s, im.height * s); ctx.restore();
  }
  titular(ctx, "¿CÓMO PUEDE ALGO OBEDECER LEYES EXACTAS", H * 0.42, 40 * KT + 8, a * ventana(t, V[0] - 0.2, V[1] - 0.2, 0.6));
  titular(ctx, "Y AUN ASÍ SER IMPREDECIBLE?", H * 0.42 + 64, 40 * KT + 8, a * ventana(t, V[0] + 1.2, V[1] - 0.2, 0.6));
  retrato(ctx, f.richardson, W * 0.5, a * eSuave(pr(t, V[1] - 0.2, 0.8)), "LEWIS FRY RICHARDSON", "SOÑABA CON CALCULAR EL TIEMPO · 1922", H * 0.14, H * 0.5);
};

// ─── 2 · Lorenz: the rounded number; two forecasts that part; the two wings ────────────────────────────────────
const SA = LZ.a as number[], SB = LZ.b as number[], AT = LZ.atractor as number[];
const DA = LZ.dosA as number[], DB = LZ.dosB as number[];
const ala = (x: number, z: number, cx: number, cy: number, s: number): P => [cx + x * s, cy - (z - 25) * s];
const lorenz = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.lorenz - 0.6 || t > K.logistica + 0.4) return;
  const a = eSuave(pr(t, K.lorenz - 0.6, 1.0)) * (1 - eSuave(pr(t, K.logistica - 0.8, 1.0)));
  // the portrait, then aside
  const ar = a * (1 - eSuave(pr(t, K.anecdota - 0.4, 0.8)));
  retrato(ctx, f.lorenz, W * 0.5, ar, "EDWARD N. LORENZ", "MIT · 1961", H * 0.14, H * 0.5);
  if (ar > 0.01 && f.lorenz) nota(ctx, K.creditoLorenz as string, ar);
  // the two forecasts: the same line, until the cut decimals grow
  const af = a * ventana(t, K.anecdota, K.alas + 0.4, 0.7);
  if (af > 0.01) {
    const x0 = W * 0.08, x1 = W * 0.92, yc = H * 0.5, hh = H * 0.018;
    const u = pr(t, K.separa[0], K.separa[1] - K.separa[0]), n = Math.max(2, Math.floor(SA.length * u));
    trazo(ctx, SA.slice(0, n).map((v, i) => [lerp(x0, x1, i / (SA.length - 1)), yc - v * hh] as P), AZUL, af, 2.2);
    trazo(ctx, SB.slice(0, n).map((v, i) => [lerp(x0, x1, i / (SB.length - 1)), yc - v * hh] as P), AMBAR, af * 0.9, 1.6);
    texto(ctx, "0,506127", x0, H * 0.2, 34 * KT + 6, `rgba(${AZUL},${0.95 * af})`, { fam: SANS, peso: 600, esp: 3 });
    texto(ctx, "0,506", x0, H * 0.2 + 46, 34 * KT + 6, `rgba(${AMBAR},${0.95 * af})`, { fam: SANS, peso: 600, esp: 3 });
    texto(ctx, "EL MISMO CÁLCULO, CON EL NÚMERO RECORTADO DE LA IMPRESIÓN", x0, H * 0.2 + 82, 14 * KT + 4, `rgba(${RGB.crema},${0.7 * af})`, { esp: 4 });
    texto(ctx, "TIEMPO →", x1, H * 0.82, 14 * KT + 4, `rgba(${RGB.crema},${0.6 * af})`, { alin: "right", esp: 4 });
    nota(ctx, "ILUSTRACIÓN CON EL SISTEMA DE LORENZ DE 1963 · CÁLCULO PROPIO", af);
  }
  // the wings: the attractor, and two points that start 0,00001 apart
  const aw = a * eSuave(pr(t, K.alas, 1.0));
  if (aw > 0.01) {
    const cx = W * 0.38, cy = H * 0.5, s = H * 0.016;
    const n = Math.floor((AT.length / 2) * eIO(pr(t, K.alas, 4.0)));
    const pts: P[] = [];
    for (let i = 0; i < n; i++) pts.push(ala(AT[2 * i], AT[2 * i + 1], cx, cy, s));
    trazo(ctx, pts, RGB.crema, aw * 0.28, 0.8);
    const kf = Math.min(DA.length / 2 - 2, pr(t, K.alas + 2.0, K.logistica - K.alas - 2.6) * 0.45 * (DA.length / 2 - 1)), k = Math.floor(kf), fr = kf - k;
    for (const [D, col] of [[DA, AZUL], [DB, AMBAR]] as [number[], string][]) {
      const cola: P[] = [];
      for (let i = Math.max(0, k - 300); i <= k; i++) cola.push(ala(D[2 * i], D[2 * i + 1], cx, cy, s));
      const q = ala(lerp(D[2 * k], D[2 * k + 2], fr), lerp(D[2 * k + 1], D[2 * k + 3], fr), cx, cy, s);
      cola.push(q);
      trazo(ctx, cola, col, aw, 2);
      luz(ctx, q[0], q[1], 22, aw, col);
    }
    rotulo(ctx, "EL SISTEMA DE LORENZ · 1963", "TRES ECUACIONES · DOS PUNTOS QUE EMPIEZAN A 0,00001", aw);
    // the three equations, one by one, on the words «tres ecuaciones»
    const ex = W * 0.64, ey = H * 0.3;
    (["dx/dt = σ (y − x)", "dy/dt = x (ρ − z) − y", "dz/dt = x y − β z"] as const).forEach((e, i) => {
      const ae = aw * eSuave(pr(t, K.ecuaciones + i * 0.5, 0.6));
      if (ae <= 0.01) return;
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(10px)";
      texto(ctx, e, ex, ey + i * 72, 38 * KT + 8, `rgba(${RGB.crema},${0.35 * ae})`, { fam: SANS, peso: 300, esp: 3 }); ctx.restore();
      texto(ctx, e, ex, ey + i * 72, 38 * KT + 8, `rgba(${RGB.crema},${0.96 * ae})`, { fam: SANS, peso: 300, esp: 3 });
    });
    texto(ctx, "σ = 10 · ρ = 28 · β = 8/3", ex, ey + 3 * 72 + 6, 18 * KT + 4, `rgba(${AMBAR},${0.9 * aw * eSuave(pr(t, K.ecuaciones + 1.6, 0.6))})`, { esp: 4 });
    texto(ctx, "x, y, z: EL ESTADO DEL FLUIDO", ex, ey + 3 * 72 + 40, 13 * KT + 4, `rgba(${RGB.crema},${0.7 * aw * eSuave(pr(t, K.ecuaciones + 2.2, 0.6))})`, { esp: 4 });
  }
};

// ─── 3 · determinism is not prediction: two populations, in order and in chaos ─────────────────────────────────
const serie = (r: number, x0: number, n: number) => { const o = [x0]; let x = x0; for (let i = 1; i < n; i++) { x = r * x * (1 - x); o.push(x); } return o; };
const L32a = serie(3.2, 0.4, 40), L32b = serie(3.2, 0.400001, 40), L39a = serie(3.9, 0.4, 40), L39b = serie(3.9, 0.400001, 40);
const logistica = (ctx: Ctx, t: number) => {
  if (t < K.logistica - 0.6 || t > K.revela + 0.4) return;
  const a = eSuave(pr(t, K.logistica - 0.6, 1.0)) * (1 - eSuave(pr(t, K.revela - 0.8, 1.0)));
  titular(ctx, "xₙ₊₁ = r · xₙ · (1 − xₙ)", H * 0.1, 34 * KT + 8, a);
  const panel = (pa: number[], pb: number[], y0: number, rot: string, a2: number, n: number) => {
    if (a2 <= 0.01) return;
    const x0 = W * 0.1, x1 = W * 0.9, h = H * 0.24;
    const X = (i: number) => lerp(x0, x1, i / 39), Y = (v: number) => y0 + h - v * h;
    trazo(ctx, pa.slice(0, n).map((v, i) => [X(i), Y(v)] as P), AZUL, a2, 2);
    trazo(ctx, pb.slice(0, n).map((v, i) => [X(i), Y(v)] as P), AMBAR, a2 * 0.9, 1.4);
    for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(${AZUL},${a2})`; ctx.beginPath(); ctx.arc(X(i), Y(pa[i]), 3.5, 0, Math.PI * 2); ctx.fill(); }
    texto(ctx, rot, x0, y0 - 14, 16 * KT + 4, `rgba(${RGB.crema},${0.9 * a2})`, { fam: SANS, peso: 600, esp: 3 });
  };
  const n1 = Math.max(2, Math.floor(40 * eIO(pr(t, V[7] + 2.0, 6.0)))), n2 = Math.max(2, Math.floor(40 * eIO(pr(t, V[8] + 0.6, 6.0))));
  panel(L32a, L32b, H * 0.2, "r = 3,2 · ORDEN · LAS DOS POBLACIONES SIGUEN JUNTAS", a * eSuave(pr(t, V[7] + 1.4, 0.8)), n1);
  panel(L39a, L39b, H * 0.58, "r = 3,9 · CAOS · SE SEPARAN", a * eSuave(pr(t, V[8], 0.8)), n2);
  texto(ctx, "0,400000 Y 0,400001", W * 0.9, H * 0.15, 16 * KT + 4, `rgba(${AMBAR},${0.9 * a * eSuave(pr(t, V[7] + 2.0, 0.8))})`, { alin: "right", esp: 4 });
  texto(ctx, "AÑOS →", W * 0.9, H * 0.9, 14 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "right", esp: 4 });
};

// ─── 4 · the same rule: the diagram slides under the real axis of the Mandelbrot set ───────────────────────────
// the Mandelbrot view: the real axis from c = −2,1 to 0,45 across 84 % of the frame, in the upper half
const MC0 = -2.12, MC1 = 0.46, MX0 = W * 0.08, MX1 = W * 0.92, MY = H * 0.3;
const cx = (c: number) => lerp(MX0, MX1, (c - MC0) / (MC1 - MC0));
const revela = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.revela - 0.6 || t > K.feigen + 0.4) return;
  void f;
  const a = eSuave(pr(t, K.revela - 0.6, 1.0)) * (1 - eSuave(pr(t, K.feigen - 0.8, 1.0)));
  // the Mandelbrot set, upper half, still
  const am = a * eSuave(pr(t, K.mandel, 1.2));
  if (am > 0.01) {
    const ancho = MC1 - MC0;
    const w = Math.round((MX1 - MX0) / 2), h = Math.round((H * 0.56) / 2);
    const l = pintarProfundo(w, h, { cx: (MC0 + MC1) / 2, cy: 0, ancho, fase: 0.03 * t, paleta: PALETAS[1], brillo: 0.85, maxIt: 400, tiempo: 0.3 * t });
    ctx.save(); ctx.globalAlpha = am; ctx.drawImage(l, MX0, MY - H * 0.28, MX1 - MX0, H * 0.56); ctx.restore();
    ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.5 * am})`; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(MX0, MY); ctx.lineTo(MX1, MY); ctx.stroke(); ctx.restore();
    texto(ctx, "EJE REAL DEL CONJUNTO DE MANDELBROT · c", MX0, MY - H * 0.28 + 24, 13 * KT + 4, `rgba(${RGB.crema},${0.7 * am})`, { esp: 4 });
  }
  // the diagram: first in (r, x), lower half; then deformed: horizontal c = r/2 − r²/4, vertical z = r(½ − x)
  const u = eIO(pr(t, K.transforma[0], K.transforma[1] - K.transforma[0]));
  const ub = eIO(pr(t, K.transforma[0] + 0.4 * (K.transforma[1] - K.transforma[0]), 0.6 * (K.transforma[1] - K.transforma[0])));
  const dy0 = H * 0.62, dy1 = H * 0.96;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let c = 0; c < NC; c += 1) {
    const { r, xs } = BIF[c];
    const xLin = lerp(W * 0.9, W * 0.1, (r - RA) / (RB - RA)), xC = cx(r / 2 - (r * r) / 4);   // r grows to the left, as c decreases
    const X = lerp(xLin, xC, u);
    const f2 = (r - RA) / (RB - RA);
    ctx.fillStyle = `rgba(${Math.round(lerp(255, 245, f2))},${Math.round(lerp(175, 230, f2))},${Math.round(lerp(110, 215, f2))},${0.5 * a})`;
    for (const v of xs) {
      const yX = lerp(dy1, dy0, v), z = r * (0.5 - v), yZ = (dy0 + dy1) / 2 - (z / 2.1) * ((dy1 - dy0) / 2);
      ctx.fillRect(X, lerp(yX, yZ, ub), 1.5, 1.5);
    }
  }
  ctx.restore();
  texto(ctx, u < 0.5 ? "← r CRECE HACIA LA IZQUIERDA" : "c →", u < 0.5 ? W * 0.1 : W * 0.92, dy0 - 10, 15 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: u < 0.5 ? "left" : "right", esp: 3 });
  const af = a * ventana(t, K.formula, K.feigen, 0.6);
  if (af > 0.01) {
    texto(ctx, "c = r/2 − r²/4", W * 0.5 - 40, H * 0.06, 24 * KT + 6, `rgba(${AMBAR},${0.95 * af})`, { fam: SANS, peso: 600, alin: "right", esp: 2 });
    texto(ctx, "z = r · (½ − x)", W * 0.5 + 40, H * 0.06, 24 * KT + 6, `rgba(${AMBAR},${0.95 * af})`, { fam: SANS, peso: 600, esp: 2 });
  }
  // the links: each change of the rule under its bulb of the set
  const al = a * eSuave(pr(t, K.enlaces, 0.8));
  if (al > 0.01) {
    const marcas: [number, string][] = [[-0.75, "1 → 2"], [-1.25, "2 → 4"], [-1.40116, "CAOS"], [-1.75, "PERÍODO 3"]];
    marcas.forEach(([c, s], i) => {
      const ai = al * eSuave(pr(t, K.enlaces + i * 0.8, 0.6)), x = cx(c);
      ctx.save(); ctx.strokeStyle = `rgba(${i === 3 ? AMBAR : RGB.crema},${0.7 * ai})`; ctx.setLineDash([3, 6]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, MY); ctx.lineTo(x, dy1); ctx.stroke(); ctx.restore();
      luz(ctx, x, MY, 16, ai, i === 3 ? AMBAR : RGB.crema);
      texto(ctx, s, x, H * 0.585, 14 * KT + 4, `rgba(${i === 3 ? AMBAR : RGB.crema},${0.95 * ai})`, { alin: "center", esp: 3 });
    });
    nota(ctx, "ARRIBA: EL MAPA DE LAS CONSTANTES c · ABAJO: DÓNDE VIVE LA ÓRBITA DE CADA c", al, W / 2, H * 0.993 - 6);
  }
  // the two copies: the miniature in the chaos and the little Mandelbrot at −1,75, side by side
  const ac = a * ventana(t, K.copia, K.feigen - 0.2, 0.8);
  if (ac > 0.01) {
    ctx.fillStyle = `rgba(2,3,6,${0.8 * ac})`; ctx.fillRect(0, 0, W, H);
    const lado = H * 0.44, y = H * 0.2;
    const l = pintarProfundo(Math.round(lado), Math.round(lado), { cx: -1.7549, cy: 0, ancho: 0.05, fase: 0.03 * t, paleta: PALETAS[1], brillo: 0.85, maxIt: 900, tiempo: 0.3 * t });
    ctx.save(); ctx.globalAlpha = ac; ctx.drawImage(l, W * 0.62 - lado / 2, y, lado, lado); ctx.restore();
    ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.4 * ac})`; ctx.strokeRect(W * 0.62 - lado / 2, y, lado, lado); ctx.strokeRect(W * 0.3 - lado / 2, y, lado, lado); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(W * 0.3 - lado / 2, y, lado, lado); ctx.clip(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,220,180,${0.45 * ac})`;
    for (let c = 0; c < 420; c++) {
      const r = lerp(3.841, 3.857, c / 419); let x = 0.5;
      for (let i = 0; i < 1300; i++) { x = r * x * (1 - x); if (i >= 500 && x >= 0.44 && x <= 0.56) ctx.fillRect(W * 0.3 - lado / 2 + (c / 419) * lado, y + lado - ((x - 0.44) / 0.12) * lado, 1.4, 1.4); }
    }
    ctx.restore();
    texto(ctx, "LA COPIA DENTRO DEL CAOS", W * 0.3, y + lado + 48, 18 * KT + 6, `rgba(${AMBAR},${0.95 * ac})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
    texto(ctx, "DIAGRAMA · r ENTRE 3,841 Y 3,857", W * 0.3, y + lado + 78, 13 * KT + 4, `rgba(${RGB.crema},${0.7 * ac})`, { alin: "center", esp: 4 });
    texto(ctx, "LA COPIA DEL MANDELBROT", W * 0.62, y + lado + 48, 18 * KT + 6, `rgba(${AMBAR},${0.95 * ac})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
    texto(ctx, "CONJUNTO · CERCA DE c = −1,75", W * 0.62, y + lado + 78, 13 * KT + 4, `rgba(${RGB.crema},${0.7 * ac})`, { alin: "center", esp: 4 });
    texto(ctx, "=", W * 0.46, y + lado / 2 + 20, 60 * KT + 8, `rgba(${RGB.crema},${0.9 * ac})`, { fam: SANS, peso: 300, alin: "center" });
  }
};

// ─── 5 · Feigenbaum: the doublings come closer by 4,669 ────────────────────────────────────────────────────────
const RN = [3, 3.449490, 3.544090, 3.564407, 3.568759, 3.569692];
const feigen = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.feigen - 0.6 || t > K.cierre + 0.4) return;
  const a = eSuave(pr(t, K.feigen - 0.6, 1.0)) * (1 - eSuave(pr(t, K.cierre - 0.8, 1.0)));
  const ar = a * ventana(t, K.feigen, V[K.iFeig] + 3.0, 0.7);
  retrato(ctx, f.feigenbaum, W * 0.5, ar, "MITCHELL FEIGENBAUM", "1978", H * 0.14, H * 0.5);
  if (ar > 0.01) nota(ctx, K.creditoFeigenbaum as string, ar);
  const ad = a * eSuave(pr(t, V[K.iFeig] + 2.6, 0.8)) * (1 - eSuave(pr(t, K.libchaber - 0.4, 0.8)));
  if (ad > 0.01) {
    // the view: r from 2,95 to 3,575 at first; under «Y descubrió…» it dives toward the end of the cascade, ×4,669 in r and
    // ×2,503 in x per step, and the same figure comes back (turned over each time)
    const RINF = 3.5699456, s = 3.2 * eIO(pr(t, V[K.iFeig + 1] - 0.3, K.libchaber - V[K.iFeig + 1] - 0.2));
    const zr = Math.pow(4.6692, s), zx = Math.pow(2.5029, s);
    const r0 = RINF - (RINF - 2.95) / zr, r1 = RINF + (3.575 - RINF) / zr;
    const xm = 0.5, xh = 0.5 / zx;
    const gx0 = W * 0.08, gx1 = W * 0.66, gy0 = H * 0.18, gy1 = H * 0.82;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,210,170,${0.5 * ad})`;
    for (let cI = 0; cI < 560; cI++) {
      const r = lerp(r0, r1, cI / 559); let x = 0.5;
      const keep = 160 + Math.round(60 * s);
      for (let i = 0; i < 1400 + keep; i++) { x = r * x * (1 - x); if (i >= 1400 && Math.abs(x - xm) <= xh) ctx.fillRect(lerp(gx0, gx1, cI / 559), lerp(gy1, gy0, (x - xm + xh) / (2 * xh)), 1.6, 1.6); }
    }
    ctx.restore();
    // the doublings, marked while the view is still wide
    const aw = ad * (1 - eSuave(pr(s, 0.05, 0.3)));
    RN.forEach((r, i) => {
      const ai = aw * eSuave(pr(t, V[K.iFeig] + 3.0 + i * 0.6, 0.5)), x = lerp(gx0, gx1, (r - r0) / (r1 - r0));
      ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.8 * ai})`; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.moveTo(x, gy0); ctx.lineTo(x, gy1); ctx.stroke(); ctx.restore();
    });
    // the ratios, as a list on the right
    const lx = W * 0.71;
    texto(ctx, "CADA TRAMO / EL SIGUIENTE", lx, H * 0.26, 16 * KT + 4, `rgba(${RGB.crema},${0.85 * ad})`, { esp: 4 });
    for (let i = 1; i < RN.length - 1; i++) {
      const ratio = (RN[i] - RN[i - 1]) / (RN[i + 1] - RN[i]);
      texto(ctx, coma(ratio, 3), lx, H * 0.26 + 46 * i, 30 * KT + 6, `rgba(${AMBAR},${0.95 * ad * eSuave(pr(t, V[K.iFeig] + 4.0 + i * 0.8, 0.5))})`, { fam: SANS, peso: 600, esp: 2 });
    }
    texto(ctx, "→ 4,6692…", lx, H * 0.26 + 46 * 5 + 10, 38 * KT + 8, `rgba(${RGB.crema},${0.97 * ad * eSuave(pr(t, V[K.iFeig] + 7.6, 0.8))})`, { fam: SANS, peso: 600, esp: 2 });
    const az = ad * eSuave(pr(s, 0.3, 0.4));
    if (az > 0.01) {
      texto(ctx, `AMPLIACIÓN ×${Math.round(zr).toLocaleString("es-CL")} EN r`, lx, H * 0.7, 18 * KT + 6, `rgba(${RGB.crema},${0.95 * az})`, { fam: SANS, peso: 600, esp: 2 });
      texto(ctx, "LA MISMA FIGURA VUELVE, DADA VUELTA", lx, H * 0.7 + 32, 13 * KT + 4, `rgba(${AMBAR},${0.85 * az})`, { esp: 4 });
    }
    nota(ctx, "CÁLCULO PROPIO · LAS DUPLICACIONES DE LA ECUACIÓN LOGÍSTICA", ad);
  }
  // Libchaber and the experiment
  const al = a * eSuave(pr(t, K.libchaber, 0.8));
  if (al > 0.01) {
    // a convection cell, schematic: a small box of mercury, heated from below, four rolls turning as streamlines
    const x0 = W * 0.2, x1 = W * 0.8, y0 = H * 0.26, y1 = H * 0.6;
    const gr = ctx.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, `rgba(80,120,200,${0.18 * al})`); gr.addColorStop(1, `rgba(255,110,60,${0.28 * al})`);
    ctx.fillStyle = gr; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.6 * al})`; ctx.lineWidth = 1.5; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); ctx.restore();
    for (const k of [0, 1, 2, 3]) {
      const ccx = lerp(x0, x1, 0.125 + 0.25 * k), ccy = (y0 + y1) / 2, sentido = k % 2 ? -1 : 1;
      for (const q of [0.3, 0.55, 0.8]) {
        const rx = ((x1 - x0) / 8) * q, ry = ((y1 - y0) / 2) * q * 0.9;
        const pts: P[] = [];
        for (let j = 0; j <= 48; j++) { const th = (j / 48) * Math.PI * 2; pts.push([ccx + Math.cos(th) * rx, ccy + Math.sin(th) * ry]); }
        trazo(ctx, pts, q > 0.7 ? AMBAR : AZUL, al * 0.35, 1);
        for (let j = 0; j < 3; j++) {
          const th = sentido * t * 1.4 / q + (j * Math.PI * 2) / 3;
          luz(ctx, ccx + Math.cos(th) * rx, ccy + Math.sin(th) * ry, 10, al * 0.8, q > 0.7 ? AMBAR : AZUL);
        }
      }
    }
    texto(ctx, "CALOR", (x0 + x1) / 2, y1 + 30, 13 * KT + 4, `rgba(255,150,100,${0.8 * al})`, { alin: "center", esp: 5 });
    texto(ctx, K.libchaberValor as string, (x0 + x1) / 2, y1 + 92, 30 * KT + 6, `rgba(${AMBAR},${0.97 * al * eSuave(pr(t, K.libchaber + 3.0, 0.8))})`, { fam: SANS, peso: 600, alin: "center", esp: 2 });
    texto(ctx, "ESQUEMA: UNA PEQUEÑA CAJA DE MERCURIO CON CUATRO ROLLOS · REDIBUJADO", (x0 + x1) / 2, y0 - 16, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * al})`, { alin: "center", esp: 4 });
  }
};

// ─── 6 · close: 4.000 points born together; they spread and draw the wings; the conclusion ─────────────────────
// the cloud comes from public/p6/nube.bin (frames × points × (x, z), int16 ×300), loaded by VideoCap6
let NUBE: Int16Array | null = null;
export const ponNube = (a: Int16Array) => { NUBE = a; };
const NN = LZ.nubeN, NF = LZ.nubeF, NE = LZ.nubeEscala;
const COLN = Array.from({ length: NN }, (_, i) => { const f = (i * 0.618034) % 1; return f < 0.5 ? `255,${Math.round(lerp(170, 235, f * 2))},${Math.round(lerp(100, 210, f * 2))}` : `${Math.round(lerp(235, 150, (f - 0.5) * 2))},${Math.round(lerp(225, 195, (f - 0.5) * 2))},255`; });
const cierre = (ctx: Ctx, t: number) => {
  if (t < K.cierre - 0.6 || !NUBE) return;
  const a = eSuave(pr(t, K.cierre - 0.6, 1.0)) * (1 - eSuave(pr(t, K.total - 1.6, 1.4)));
  const ff = Math.min(NF - 1, Math.max(0, (t - K.nube) * 30)), fr = Math.floor(ff);
  // the camera: close on the newborn ball, following it; then back to the whole attractor, slowly further
  let mx = 0, mz = 0;
  for (let i = 0; i < NN; i++) { mx += NUBE[(fr * NN + i) * 2]; mz += NUBE[(fr * NN + i) * 2 + 1]; }
  mx /= NN * NE; mz /= NN * NE;
  const atras = eIO(pr(t, K.nube + 3.0, 12.0));
  const ccx = lerp(mx, 0, atras), ccz = lerp(mz, 25, atras);
  const s = Math.exp(lerp(Math.log(H * 0.06), Math.log(H * 0.017), atras)) * (1 - 0.06 * pr(t, K.nube + 15, K.total - K.nube - 15));
  const X = (x: number) => W / 2 + (x - ccx) * s, Y = (z: number) => H * 0.52 - (z - ccz) * s;
  // each point with a short trail (its last three frames); additive, so where they gather the form glows
  const brillo = lerp(0.1, 0.2, eSuave(pr(t, K.conclusion - 4, 6)));
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineWidth = 1;
  const f0 = Math.max(0, fr - 3);
  for (let i = 0; i < NN; i++) {
    const k1 = (fr * NN + i) * 2, k0 = (f0 * NN + i) * 2;
    const x1 = X(NUBE[k1] / NE), y1 = Y(NUBE[k1 + 1] / NE), x0 = X(NUBE[k0] / NE), y0 = Y(NUBE[k0 + 1] / NE);
    ctx.strokeStyle = `rgba(${COLN[i]},${brillo * a})`;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.fillStyle = `rgba(255,248,240,${(brillo + 0.12) * a})`; ctx.fillRect(x1 - 0.8, y1 - 0.8, 1.6, 1.6);
  }
  ctx.restore();
  if (ff < 40) luz(ctx, X(mx), Y(mz), 40, a * (1 - ff / 40));
  titular(ctx, "SABER LA REGLA NO ES SABER EL RESULTADO", H * 0.1, 30 * KT + 8, a * ventana(t, V[K.iCierre] - 0.2, K.total, 1.0));
  titular(ctx, "PERO EL CAOS TIENE FORMA", H * 0.1 + 52, 30 * KT + 8, a * eSuave(pr(t, V[K.iCierre + 1] + 4.0, 1.2)), AMBAR);
  rotulo(ctx, "4.000 PUNTOS QUE EMPIEZAN A UNA MILÉSIMA", "NINGUNO SE REPITE · TODOS DIBUJAN LA MISMA FORMA", a * ventana(t, K.nube + 1.5, K.conclusion, 0.8));
  nota(ctx, "SISTEMA DE LORENZ DE 1963 · CÁLCULO PROPIO", a * ventana(t, K.nube + 1.5, K.conclusion, 0.8));
};

export const dibujarCap6 = (ctx: Ctx, t: number, frame: number, fotos: Fotos) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  titulo(ctx, t);
  richardson(ctx, t, fotos);
  lorenz(ctx, t, fotos);
  logistica(ctx, t);
  revela(ctx, t, fotos);
  feigen(ctx, t, fotos);
  cierre(ctx, t);
  const fin = eSuave(pr(t, K.total - 1.2, 1.2)), ini = 1 - eSuave(pr(t, 0, 0.6));
  if (fin + ini > 0) { ctx.fillStyle = `rgba(2,3,6,${Math.min(1, fin + ini)})`; ctx.fillRect(0, 0, W, H); }
  let golpe = 0;
  for (const g of [K.titulo, K.transforma[1], K.copia]) if (t >= g && t - g < 1.5) golpe = Math.max(golpe, 0.9 * Math.exp(-(t - g) * 3));
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.92, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: golpe * 0.4, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
