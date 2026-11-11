// La frontera · animatic (prologue and chapter I of script v7). Every frame is a pure function of t.
import LINEA from "./linea.json";
import { pintarMandel } from "./mandel";
import { C, MONO, RGB, SANS, cl, eIO, eOut, eSuave, lerp, num, pr, ventana } from "./theme";

export const W = 1920;
export const H = 1080;
const T = LINEA.t;
type Ctx = CanvasRenderingContext2D;

export type Serie = { id: string; edad: number; sexo: string; t: number[]; rr: number[] };
export type Datos = {
  sano: Serie;
  chf: Serie;
  dfa: { escalas: number[]; sano: number[]; chf: number[]; a1s: number; a1c: number; a2s: number; a2c: number };
  grupo: Record<string, { n: number; a1: number; sd: number }>;
  latidosAudio: number[];
};

// ─── utilities ──────────────────────────────────────────────────────────────────────────────────────────────────
const buscar = (a: number[], x: number) => {
  let lo = 0, hi = a.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < x) lo = m + 1; else hi = m; }
  return lo;
};
const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  ctx.font = `${op.peso ?? 400} ${tam}px "${op.fam ?? MONO}"`;
  ctx.fillStyle = color;
  ctx.textAlign = op.alin ?? "left";
  ctx.textBaseline = "alphabetic";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 0}px`;
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};
const luz = (ctx: Ctx, x: number, y: number, r: number, a: number, rgb = RGB.crema) => {
  if (a <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(0.18, `rgba(${rgb},${a * 0.5})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.fillStyle = `rgba(255,250,240,${Math.min(1, a * 1.4)})`;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(2, r * 0.045), 0, Math.PI * 2);
  ctx.fill();
};
// creamy palette shared with the shader
const PAL = [[12, 8, 28], [70, 24, 92], [176, 64, 128], [238, 140, 120], [255, 244, 222], [150, 222, 226], [52, 110, 160]];
const paleta = (t: number) => {
  const x = ((t % 1) + 1) % 1 * 7;
  const i = Math.floor(x), f = eSuave(x - i);
  const a = PAL[i], b = PAL[(i + 1) % 7];
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
};

// ─── prologue · heart data ──────────────────────────────────────────────────────────────────────────────────────
const H0 = 14 * 3600; // the hour we zoom into (afternoon, awake)
const VENTANAS = { d24: [0, 24 * 3600], h1: [H0, H0 + 3600], m5: [H0 + 1500, H0 + 1800] };
const ventanaTiempo = (t: number, fin: number) => {
  const interp = (a: number[], b: number[], p: number) => {
    const wa = a[1] - a[0], wb = b[1] - b[0];
    const w = Math.exp(lerp(Math.log(wa), Math.log(wb), p));
    const c = lerp((a[0] + a[1]) / 2, (b[0] + b[1]) / 2, p);
    return [c - w / 2, c + w / 2];
  };
  const d24 = [0, fin];
  if (t < T.zoom1h) return d24;
  if (t < T.zoom5m) return interp(d24, VENTANAS.h1, eIO(pr(t, T.zoom1h, 3.2)));
  return interp(VENTANAS.h1, VENTANAS.m5, eIO(pr(t, T.zoom5m, 3.2)));
};
const etiquetaEscala = (t: number) => (t < T.zoom1h + 1.6 ? "24 HORAS" : t < T.zoom5m + 1.6 ? "1 HORA" : "5 MINUTOS");

type Caja = { x: number; y: number; w: number; h: number };
const RRMIN = 0.35, RRMAX = 1.45;
// draws the series inside the box; returns the vertices it used (pixels) for the coil animation
const dibujarSerie = (ctx: Ctx, S: Serie, caja: Caja, ta: number, tb: number, revela: number, alfa: number, rgb: string) => {
  if (alfa <= 0) return [] as number[][];
  const i0 = Math.max(0, buscar(S.t, ta) - 1);
  const tFin = ta + (tb - ta) * revela;
  const i1 = Math.min(S.t.length, buscar(S.t, tFin) + 1);
  const X = (tt: number) => caja.x + ((tt - ta) / (tb - ta)) * caja.w;
  const Y = (rr: number) => caja.y + caja.h - ((rr - RRMIN) / (RRMAX - RRMIN)) * caja.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(caja.x, caja.y - 20, caja.w, caja.h + 40);
  ctx.clip();
  ctx.strokeStyle = `rgba(${rgb},${alfa})`;
  ctx.lineWidth = 1.6;
  ctx.lineJoin = "round";
  const n = i1 - i0;
  const vertices: number[][] = [];
  ctx.beginPath();
  if (n > caja.w * 1.5) {
    // dense: min-max per pixel column
    let col = -1, mn = 0, mx = 0;
    for (let i = i0; i < i1; i++) {
      const c = Math.floor(X(S.t[i]));
      const y = Y(S.rr[i]);
      if (c !== col) {
        if (col >= 0) { ctx.moveTo(col + 0.5, mn); ctx.lineTo(col + 0.5, mx + 0.6); }
        col = c; mn = y; mx = y;
      } else { mn = Math.min(mn, y); mx = Math.max(mx, y); }
    }
    if (col >= 0) { ctx.moveTo(col + 0.5, mn); ctx.lineTo(col + 0.5, mx + 0.6); }
    ctx.globalAlpha = 0.85;
  } else {
    for (let i = i0; i < i1; i++) {
      const x = X(S.t[i]), y = Y(S.rr[i]);
      if (i === i0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      vertices.push([x, y]);
    }
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  // beat dots when the window is short
  if (n < 520) {
    ctx.fillStyle = `rgba(${rgb},${alfa * cl((520 - n) / 200)})`;
    for (const [x, y] of vertices) { ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
  return vertices;
};
const marcoSerie = (ctx: Ctx, caja: Caja, titulo: string, escala: string, alfa: number, rgb: string) => {
  if (alfa <= 0) return;
  ctx.strokeStyle = `rgba(${RGB.crema},${0.1 * alfa})`;
  ctx.lineWidth = 1;
  for (const rr of [0.6, 1.0, 1.4]) {
    const y = caja.y + caja.h - ((rr - RRMIN) / (RRMAX - RRMIN)) * caja.h;
    ctx.beginPath(); ctx.moveTo(caja.x, y); ctx.lineTo(caja.x + caja.w, y); ctx.stroke();
    texto(ctx, `${num(rr, 1)} s`, caja.x - 14, y + 6, 15, `rgba(${RGB.crema},${0.4 * alfa})`, { alin: "right" });
  }
  texto(ctx, titulo, caja.x, caja.y - 24, 17, `rgba(${rgb},${0.9 * alfa})`, { esp: 3 });
  texto(ctx, escala, caja.x + caja.w, caja.y - 24, 17, `rgba(${RGB.crema},${0.55 * alfa})`, { alin: "right", esp: 3 });
};

const cajaSano = (t: number): Caja => {
  const pC = eIO(pr(t, T.chf, 1.6));
  const pD = eIO(pr(t, T.dfa, 1.6));
  const pV = eIO(pr(t, T.silencio1 + 1.2, 1.8)); // returns to the centre after the DFA
  const base = { x: 240, y: 380, w: 1440, h: 300 };
  const conChf = { x: 240, y: 230, w: 1440, h: 240 };
  const conDfa = { x: 150, y: 230, w: 800, h: 240 };
  const mix = (a: Caja, b: Caja, p: number): Caja => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
  return mix(mix(mix(base, conChf, pC), conDfa, pD), base, pV);
};
const cajaChf = (t: number): Caja => {
  const pD = eIO(pr(t, T.dfa, 1.6));
  return { x: lerp(240, 150, pD), y: 620, w: lerp(1440, 800, pD), h: 240 };
};

const panelDfa = (ctx: Ctx, D: Datos, t: number) => {
  const a = ventana(t, T.dfa + 0.6, T.silencio1 + 1.0, 0.8, 1.0);
  if (a <= 0) return;
  const x0 = 1100, y0 = 210, w = 680, h = 650;
  const E = D.dfa.escalas;
  const lx = (n: number) => x0 + ((Math.log10(n) - Math.log10(3)) / (Math.log10(2500) - Math.log10(3))) * w;
  const todos = [...D.dfa.sano, ...D.dfa.chf];
  const fmin = Math.min(...todos) * 0.8, fmax = Math.max(...todos) * 1.25;
  const ly = (F: number) => y0 + h - ((Math.log10(F) - Math.log10(fmin)) / (Math.log10(fmax) - Math.log10(fmin))) * h;
  texto(ctx, "CÓMO CRECE LA FLUCTUACIÓN CON LA ESCALA", x0, y0 - 24, 17, `rgba(${RGB.crema},${0.85 * a})`, { esp: 3 });
  ctx.strokeStyle = `rgba(${RGB.crema},${0.14 * a})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, w, h);
  for (const n of [4, 16, 64, 256, 1024]) {
    const x = lx(n);
    ctx.beginPath(); ctx.moveTo(x, y0 + h); ctx.lineTo(x, y0 + h + 8); ctx.stroke();
    texto(ctx, `${n}`, x, y0 + h + 30, 15, `rgba(${RGB.crema},${0.5 * a})`, { alin: "center" });
  }
  texto(ctx, "ESCALA (LATIDOS) →", x0 + w, y0 + h + 58, 14, `rgba(${RGB.crema},${0.45 * a})`, { alin: "right", esp: 2 });
  texto(ctx, "FLUCTUACIÓN ↑", x0 + 12, y0 + 28, 14, `rgba(${RGB.crema},${0.45 * a})`, { esp: 2 });
  // short-scale band (4-16 beats), where alpha_1 is measured
  const bandaA = a * eSuave(pr(t, T.dfaFin - 1.0, 1.0));
  ctx.fillStyle = `rgba(${RGB.crema},${0.05 * bandaA})`;
  ctx.fillRect(lx(4), y0, lx(16) - lx(4), h);
  const progreso = eOut(pr(t, T.dfa + 1.2, 4.2));
  const series: [number[], string, number, string][] = [
    [D.dfa.sano, RGB.cian, D.dfa.a1s, "SANO"],
    [D.dfa.chf, RGB.durazno, D.dfa.a1c, "INSUFICIENCIA"],
  ];
  series.forEach(([F, rgb, a1, nombre], k) => {
    const visibles = Math.floor(progreso * E.length);
    ctx.fillStyle = `rgba(${rgb},${0.95 * a})`;
    ctx.strokeStyle = `rgba(${rgb},${0.55 * a})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < visibles; i++) {
      const x = lx(E[i]), y = ly(F[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < visibles; i++) { ctx.beginPath(); ctx.arc(lx(E[i]), ly(F[i]), 4, 0, Math.PI * 2); ctx.fill(); }
    // alpha_1 label
    const la = a * eSuave(pr(t, T.dfaFin - 0.4 + k * 0.5, 0.8));
    if (la > 0) {
      texto(ctx, `${nombre}   α₁ = ${num(a1, 2)}`, x0 + w - 24, y0 + h - 70 + k * 34, 20, `rgba(${rgb},${la})`, { alin: "right", esp: 1 });
    }
  });
  // the two records are one example; the group means give the context
  const ga = a * eSuave(pr(t, T.dfaFin + 0.8, 0.8));
  if (ga > 0) {
    const gs = D.grupo.nsr2db, gc = D.grupo.chf2db;
    texto(ctx, `PROMEDIO DE CADA BASE · SANOS ${num(gs.a1)} ± ${num(gs.sd)} (${gs.n}) · INSUFICIENCIA ${num(gc.a1)} ± ${num(gc.sd)} (${gc.n})`, x0, y0 + h + 96, 14, `rgba(${RGB.crema},${0.5 * ga})`, { esp: 1 });
  }
};

// ─── title and formula ─────────────────────────────────────────────────────────────────────────────────────────
const latidoLuz = (D: Datos, t: number) => {
  // glow follows the beats of the heart recording that is playing
  const i = buscar(D.latidosAudio, t) - 1;
  if (i < 0) return 0;
  return Math.exp(-(t - D.latidosAudio[i]) * 6);
};

const tituloFrontera = (ctx: Ctx, t: number) => {
  const a = ventana(t, T.titulo, T.tituloFin, 0.3, 0.9);
  if (a <= 0) return null;
  ctx.font = `600 132px "${SANS}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "26px";
  const s = "LA FRONTERA";
  const ancho = ctx.measureText(s).width;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  const x0 = W / 2 - ancho / 2 + 13, y = H / 2 + 46;
  const p = eIO(pr(t, T.titulo + 0.4, 3.0));
  const xp = x0 + ancho * p;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, xp, H); ctx.clip();
  texto(ctx, s, x0, y, 132, `rgba(${RGB.crema},${a})`, { fam: SANS, peso: 600, esp: 26 });
  ctx.restore();
  return { x: xp, y: y - 46, a: a * (1 - eSuave(pr(t, T.titulo + 3.4, 1.0))) };
};

const FORMULA = "z → z² + c";
const pasosFormula = () => {
  // reveal boundaries: after each visible glyph (spaces are skipped)
  const pasos: number[] = [];
  for (let i = 0; i < FORMULA.length; i++) if (FORMULA[i] !== " ") pasos.push(i + 1);
  return pasos;
};
const formula = (ctx: Ctx, t: number) => {
  if (t < T.formula - 0.5 || t > T.corte + 0.2) return null;
  const mover = eIO(pr(t, T.orbitas - 0.8, 1.4));
  const tam = lerp(124, 58, mover);
  const y = lerp(H / 2 + 42, 132, mover);
  const a = 1 - eSuave(pr(t, T.corte - 0.1, 0.2));
  ctx.font = `300 ${tam}px "${SANS}"`;
  const total = ctx.measureText(FORMULA).width;
  const x0 = W / 2 - total / 2;
  const pasos = pasosFormula();
  let k = -1;
  let flash = 0;
  pasos.forEach((_, i) => {
    const ti = T.formula + 0.25 + i * 0.6;
    if (t >= ti) { k = i; flash = Math.exp(-(t - ti) * 5); }
  });
  const hasta = k < 0 ? 0 : ctx.measureText(FORMULA.slice(0, pasos[k])).width;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, x0 + hasta + 2, H); ctx.clip();
  texto(ctx, FORMULA, x0, y, tam, `rgba(${RGB.crema},${a})`, { fam: SANS, peso: 300 });
  ctx.restore();
  return { x: x0 + hasta + 10, y: y - tam * 0.32, flash, completa: k === pasos.length - 1, a };
};

// ─── chapter I · the complex plane, orbits, points, set ───────────────────────────────────────────────────────
// Same mapping as the shader: centre and width of the visible plane.
const PLANO = { cx: -0.62, cy: 0.0, ancho: 4.6 };
const aPantalla = (re: number, im: number, V = PLANO) => [W / 2 + ((re - V.cx) / V.ancho) * W, H / 2 - ((im - V.cy) / V.ancho) * W];

type Orbita = { c: [number, number]; z: number[][]; escapa: boolean; t0: number };
const ORBITAS: Orbita[] = ([
  [[-0.38, 0.56], T.orbitas + 0.4],
  [[0.36, 0.52], T.orbitas + 2.0],
  [[-1.02, 0.18], LINEA.voz[5] + 0.6],
  [[-1.72, 0.62], LINEA.voz[5] + 1.6],
  [[0.26, 0.02], LINEA.voz[5] + 3.6],
  [[-0.12, 0.92], LINEA.voz[5] + 4.4],
] as [[number, number], number][]).map(([c, t0]) => {
  const z: number[][] = [[0, 0]];
  let x = 0, y = 0, escapa = false;
  for (let i = 0; i < 80; i++) {
    const nx = x * x - y * y + c[0];
    y = 2 * x * y + c[1];
    x = nx;
    z.push([x, y]);
    if (x * x + y * y > 40) { escapa = true; break; }
  }
  return { c, z, escapa, t0 };
});
const PASO = 0.3;
const orbitas = (ctx: Ctx, t: number) => {
  const a = ventana(t, T.orbitas, T.corte, 0.8, 0.05);
  if (a <= 0) return;
  // faint plane: real and imaginary axes, circle of radius 2
  const [ox, oy] = aPantalla(0, 0);
  ctx.strokeStyle = `rgba(${RGB.crema},${0.1 * a})`;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();
  ctx.setLineDash([4, 8]);
  ctx.beginPath(); ctx.arc(ox, oy, (2 / PLANO.ancho) * W, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  texto(ctx, "0", ox + 10, oy + 24, 15, `rgba(${RGB.crema},${0.4 * a})`);
  for (const O of ORBITAS) {
    const e = t - O.t0;
    if (e < 0) continue;
    const rgb = O.escapa ? RGB.durazno : RGB.cian;
    const pasos = e / PASO;
    const n = Math.min(O.z.length - 1, Math.floor(pasos));
    const f = eOut(cl(pasos - n));
    const [cx, cy] = aPantalla(O.c[0], O.c[1]);
    const ac = a * eSuave(pr(e, 0, 0.4));
    // the constant c
    ctx.strokeStyle = `rgba(${rgb},${ac})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 9, cy); ctx.lineTo(cx + 9, cy); ctx.moveTo(cx, cy - 9); ctx.lineTo(cx, cy + 9); ctx.stroke();
    texto(ctx, "c", cx + 12, cy - 10, 20, `rgba(${rgb},${ac})`, { fam: SANS, peso: 400 });
    // path and points; the trail fades with age
    const pts = O.z.slice(0, n + 1).map(([x, y]) => aPantalla(x, y));
    if (n < O.z.length - 1) {
      const [x1, y1] = aPantalla(O.z[n + 1][0], O.z[n + 1][1]);
      const [x0, y0] = pts[pts.length - 1];
      pts.push([lerp(x0, x1, f), lerp(y0, y1, f)]);
    }
    const termina = O.escapa ? 1 - eSuave(pr(pasos, O.z.length - 1, 3)) : 1;
    for (let i = Math.max(1, pts.length - 16); i < pts.length; i++) {
      const edad = (pts.length - 1 - i) * PASO;
      const al = ac * termina * Math.max(0.12, Math.exp(-edad * 0.35));
      ctx.strokeStyle = `rgba(${rgb},${al * 0.6})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
      ctx.fillStyle = `rgba(${rgb},${al})`;
      ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], i === pts.length - 1 ? 5 : 3, 0, Math.PI * 2); ctx.fill();
    }
    const [hx, hy] = pts[pts.length - 1];
    luz(ctx, hx, hy, 40, 0.5 * ac * termina, rgb);
  }
};

// 100 000 values of c, each iterated up to 200 times
const NPUNTOS = 100000;
let PUNTOS: { x: Float32Array; y: Float32Array; n: Uint16Array; orden: Float32Array } | null = null;
const puntosC = () => {
  if (PUNTOS) return PUNTOS;
  let s = 12345;
  const azar = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const x = new Float32Array(NPUNTOS), y = new Float32Array(NPUNTOS), n = new Uint16Array(NPUNTOS), orden = new Float32Array(NPUNTOS);
  const altoPlano = (PLANO.ancho * H) / W;
  for (let i = 0; i < NPUNTOS; i++) {
    const cr = PLANO.cx + (azar() - 0.5) * PLANO.ancho, ci = PLANO.cy + (azar() - 0.5) * altoPlano;
    let zr = 0, zi = 0, k = 0;
    for (; k < 200; k++) {
      const t = zr * zr - zi * zi + cr;
      zi = 2 * zr * zi + ci; zr = t;
      if (zr * zr + zi * zi > 4) break;
    }
    const [px, py] = aPantalla(cr, ci);
    x[i] = px; y[i] = py; n[i] = k; orden[i] = azar();
  }
  PUNTOS = { x, y, n, orden };
  return PUNTOS;
};
let capaPuntos: { c: HTMLCanvasElement; img: ImageData } | null = null;
const puntos = (ctx: Ctx, t: number) => {
  const a = ventana(t, T.puntos, T.conjunto + 0.9, 0.01, 0.9);
  if (a <= 0) return;
  const P = puntosC();
  if (!capaPuntos) {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    capaPuntos = { c, img: c.getContext("2d")!.createImageData(W, H) };
  }
  const d = capaPuntos.img.data;
  d.fill(0);
  const visibles = Math.pow(eSuave(pr(t, T.puntos, T.conjunto - T.puntos - 0.2)), 0.8);
  for (let i = 0; i < NPUNTOS; i++) {
    if (P.orden[i] > visibles) continue;
    const px = P.x[i] | 0, py = P.y[i] | 0;
    let r: number, g: number, b: number;
    if (P.n[i] >= 200) { r = 255; g = 244; b = 222; } else {
      const col = paleta(Math.log(P.n[i] + 2) * 0.42);
      const k = Math.min(1, P.n[i] / 14) ** 1.2;
      r = col[0] * k; g = col[1] * k; b = col[2] * k;
    }
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const j = ((py + dy) * W + px + dx) * 4;
      if (j < 0 || j >= d.length) continue;
      d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255;
    }
  }
  const cc = capaPuntos.c.getContext("2d")!;
  cc.putImageData(capaPuntos.img, 0, 0);
  ctx.globalAlpha = a;
  ctx.drawImage(capaPuntos.c, 0, 0);
  ctx.globalAlpha = 1;
};

// camera over the set: drift towards the seahorse valley, then the approach to the border
const DESTINO = { cx: -0.743643887, cy: 0.131825904 };
const vistaMandel = (t: number) => {
  const p1 = eIO(pr(t, T.deriva, T.borde - T.deriva));
  const p2 = eIO(pr(t, T.borde, T.fin - T.borde + 2.4));
  const medio = { cx: lerp(PLANO.cx, -0.735, p1), cy: lerp(PLANO.cy, 0.12, p1), ancho: Math.exp(lerp(Math.log(PLANO.ancho), Math.log(1.1), p1)) };
  return {
    cx: lerp(medio.cx, DESTINO.cx, eIO(pr(t, T.borde, 6))),
    cy: lerp(medio.cy, DESTINO.cy, eIO(pr(t, T.borde, 6))),
    ancho: Math.exp(lerp(Math.log(medio.ancho), Math.log(0.0022), p2)),
  };
};
const conjunto = (ctx: Ctx, t: number) => {
  const a = Math.min(eSuave(pr(t, T.conjunto, 0.7)), 1 - eSuave(pr(t, T.fin + 0.8, 1.8)));
  if (a <= 0) return;
  const V = vistaMandel(t);
  const respira = eSuave(pr(t, T.respira, 6));
  const fase = 0.62 + Math.max(0, t - T.respira) * 0.012 * respira;
  const iter = Math.round(lerp(250, 1400, pr(Math.log(PLANO.ancho / V.ancho), 0, Math.log(PLANO.ancho / 0.0022))));
  const lienzo = pintarMandel(W, H, { cx: V.cx, cy: V.cy, ancho: V.ancho, fase, respira, iter });
  ctx.globalAlpha = a;
  ctx.drawImage(lienzo, 0, 0, W, H);
  ctx.globalAlpha = 1;
};

// ─── captions and post ─────────────────────────────────────────────────────────────────────────────────────────
const rotulo = (ctx: Ctx, s: string, a: number) => {
  if (a <= 0) return;
  texto(ctx, s, 72, H - 56, 17, `rgba(${RGB.crema},${0.62 * a})`, { esp: 1.5 });
};
let ruido: HTMLCanvasElement[] = [];
const grano = (ctx: Ctx, frame: number) => {
  if (!ruido.length) {
    ruido = [0, 1, 2, 3].map((k) => {
      const c = document.createElement("canvas");
      c.width = 384; c.height = 384;
      const g = c.getContext("2d")!;
      const img = g.createImageData(384, 384);
      let s = 99 + k * 7919;
      for (let i = 0; i < img.data.length; i += 4) {
        s = (s * 1664525 + 1013904223) >>> 0;
        const v = (s >>> 24);
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      return c;
    });
  }
  const pat = ctx.createPattern(ruido[frame % 4], "repeat")!;
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = pat;
  ctx.translate((frame * 37) % 384, (frame * 53) % 384);
  ctx.fillRect(-384, -384, W + 384, H + 384);
  ctx.restore();
};
let bloomC: HTMLCanvasElement | null = null;
const post = (ctx: Ctx, frame: number) => {
  if (!bloomC) { bloomC = document.createElement("canvas"); bloomC.width = W / 4; bloomC.height = H / 4; }
  const b = bloomC.getContext("2d")!;
  b.clearRect(0, 0, W / 4, H / 4);
  b.filter = "blur(6px)";
  b.drawImage(ctx.canvas, 0, 0, W / 4, H / 4);
  b.filter = "none";
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.42;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bloomC, 0, 0, W, H);
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  grano(ctx, frame);
  texto(ctx, "ANIMATIC · VOZ Y MÚSICA PROVISORIAS", W - 64, 58, 14, `rgba(${RGB.crema},0.32)`, { alin: "right", esp: 3 });
};

// ─── the frame ─────────────────────────────────────────────────────────────────────────────────────────────────
export const dibujar = (ctx: Ctx, D: Datos, t: number, frame: number) => {
  ctx.fillStyle = C.fondo;
  ctx.fillRect(0, 0, W, H);

  // PROLOGUE
  if (t < T.punto + 1) {
    const finS = D.sano.t[D.sano.t.length - 1];
    const [ta, tb] = ventanaTiempo(t, finS);
    const aS = ventana(t, T.taco24, T.enrollar + 0.2, 0.8, 0.3);
    const cS = cajaSano(t);
    const revela = eIO(pr(t, T.taco24, 5.0));
    marcoSerie(ctx, cS, `CORAZÓN SANO · ${D.sano.sexo === "M" ? "HOMBRE" : "MUJER"}, ${D.sano.edad} AÑOS`, etiquetaEscala(t), aS * (1 - eSuave(pr(t, T.silencio1 + 1.2, 1.2))), RGB.cian);
    const verts = dibujarSerie(ctx, D.sano, cS, ta, tb, revela, Math.max(aS, 0.0001), RGB.cian);
    const aC = ventana(t, T.chf, T.silencio1 + 0.8, 0.8, 1.2);
    const cC = cajaChf(t);
    marcoSerie(ctx, cC, `INSUFICIENCIA CARDÍACA · ${D.chf.sexo === "M" ? "HOMBRE" : "MUJER"}, ${D.chf.edad} AÑOS`, etiquetaEscala(t), aC, RGB.durazno);
    dibujarSerie(ctx, D.chf, cC, ta, tb, eIO(pr(t, T.chf, 3.0)), aC, RGB.durazno);
    panelDfa(ctx, D, t);
    rotulo(ctx, `DATOS REALES · PhysioNet · registros ${D.sano.id} y ${D.chf.id} · intervalos entre latidos normales`, ventana(t, T.taco24 + 1, T.silencio1, 1, 1));
    // the healthy line coils into a point of light
    const pE = eIO(pr(t, T.enrollar, T.punto - T.enrollar));
    if (t >= T.enrollar - 0.2 && t < T.punto + 1) {
      const fuente = verts.length ? verts : [];
      const N = fuente.length;
      ctx.strokeStyle = `rgba(${RGB.cian},${0.85 * (1 - pE * 0.4)})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const u = i / Math.max(1, N - 1);
        const ang = u * Math.PI * 14 + t * 0.6;
        const rad = 380 * (1 - u) * (1 - pE);
        const sx = W / 2 + Math.cos(ang) * rad, sy = H / 2 + Math.sin(ang) * rad * 0.62;
        const x = lerp(fuente[i][0], sx, eIO(cl(pE * 1.6))), y = lerp(fuente[i][1], sy, eIO(cl(pE * 1.6)));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      if (t >= T.enrollar) ctx.stroke();
    }
  }
  // the point of light, beating with the recording, from the end of the coil until the formula
  const aP = Math.min(eSuave(pr(t, T.punto - 1.0, 1.4)), 1 - eSuave(pr(t, T.orbitas - 0.6, 0.8)));
  const tit = tituloFrontera(ctx, t);
  const form = formula(ctx, t);
  if (aP > 0) {
    let x = W / 2, y = H / 2;
    let brillo = 0.55 + 0.45 * latidoLuz(D, t);
    if (tit) { x = lerp(W / 2, tit.x, eIO(pr(t, T.titulo, 0.5))); y = tit.y; }
    if (t > T.tituloFin - 0.3 && t < T.formula + 0.3) { x = W / 2; y = H / 2; }
    if (form && t >= T.formula) { x = form.x; y = form.y; brillo = 0.55 + 0.6 * form.flash; }
    luz(ctx, x, y, 90 + 50 * brillo, aP * brillo);
  }

  // CHAPTER I
  orbitas(ctx, t);
  puntos(ctx, t);
  conjunto(ctx, t);
  rotulo(ctx, "ÓRBITAS CALCULADAS DE z → z² + c · CIAN: SE QUEDAN · DURAZNO: SE VAN AL INFINITO", ventana(t, T.orbitas + 1, T.corte, 1, 0.1));
  rotulo(ctx, "100 000 VALORES DE c, CADA UNO ITERADO HASTA 200 VECES", ventana(t, T.puntos + 0.3, T.conjunto + 0.6, 0.4, 0.6));
  rotulo(ctx, "CONJUNTO DE MANDELBROT · CALCULADO CUADRO A CUADRO", ventana(t, T.respira + 1, T.fin, 1, 1.2));

  post(ctx, frame);
};
