// CAPÍTULO V · «Un corazón no es un metrónomo» (fractales/GUION-capitulo-5-corazon.md, v3). The heart of the
// prologue becomes a line of intervals; 24 hours of it; the detrended fluctuation analysis (DFA) drawn like
// Richardson's law; a heart with failure beside it; then 83 people as two overlapping clouds (our own audit of
// PhysioNet nsr2db and chf2db, herramientas/auditoria_corazon.py); and the healthy line that beats again. v3: a
// bridge (one form of the film per beat), the infinite zoom into the heartbeat beside the border of chapter III, and a
// close where every beat opens a fractal of the film, faster and faster, until a silence.
import K from "./cap5.json";
import { LIMPIO as SIN_TEXTO_TRAILER } from "./limpio";
import DAT from "./cap5_datos.json";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS } from "./fractalTeaser";
import { pintarProfundo } from "./profundo";
import DLA from "./cap4_dla.json";
import VAS from "./cap4_vasos.json";
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
const V = K.voz;
type Serie = { n: number; horas: number; latidos: number[]; dia: { min: number[]; med: number[]; max: number[] }; hora: { min: number[]; med: number[]; max: number[] }; hora_en: number[]; minutos: number[]; dfa: { lx: number[]; ly: number[] }; a1: number; a2: number };
const SANO = DAT.sano as Serie, IC = DAT.ic as Serie;
const GR = DAT.grupos as Record<string, number[][]>;
// the beat times of the healthy record (from 0.8 s), for the title, the line and the close
const TL: number[] = [0.8];
for (const r of SANO.latidos) TL.push(TL[TL.length - 1] + r);
const TIC: number[] = [0];
for (const r of IC.latidos) TIC.push(TIC[TIC.length - 1] + r);

// ─── helpers (as in chapters III and IV) ────────────────────────────────────────────────────────────────────────
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

// a strip of beats: the intervals as points joined by a line, from x0 to x1, centred on y (0,15 s = h)
const tira = (ctx: Ctx, rr: number[], x0: number, x1: number, y: number, h: number, col: string, a: number, desde = 0, hasta = rr.length, puntos = true) => {
  if (a <= 0.01 || hasta - desde < 2) return;
  const m = rr.reduce((s, v) => s + v, 0) / rr.length, n = hasta - desde;
  const pts: P[] = [];
  for (let i = desde; i < hasta; i++) pts.push([lerp(x0, x1, (i - desde) / Math.max(1, n - 1)), y - ((rr[i] - m) / 0.15) * h]);
  trazo(ctx, pts, col, a * 0.75, 1.6);
  if (puntos) { ctx.fillStyle = `rgba(${col},${a})`; for (const [x, yy] of pts) { ctx.beginPath(); ctx.arc(x, yy, 3, 0, Math.PI * 2); ctx.fill(); } }
};
// a band of bins (min..max as a faint column, the mean as a line)
const banda = (ctx: Ctx, b: { min: number[]; med: number[]; max: number[] }, x0: number, x1: number, y: number, h: number, col: string, a: number, u = 1, m = 0.78) => {
  if (a <= 0.01) return;
  const n = Math.max(2, Math.floor(b.med.length * u)), dx = (x1 - x0) / b.med.length;
  const Y = (v: number) => y - ((v - m) / 0.3) * h;
  ctx.save(); ctx.strokeStyle = `rgba(${col},${0.22 * a})`; ctx.lineWidth = Math.max(1, dx);
  ctx.beginPath();
  for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * dx; ctx.moveTo(x, Y(b.min[i])); ctx.lineTo(x, Y(b.max[i])); }
  ctx.stroke(); ctx.restore();
  trazo(ctx, b.med.slice(0, n).map((v, i) => [x0 + (i + 0.5) * dx, Y(v)] as P), col, a * 0.9, 1.6);
};

// ─── 0 · title: the beats of the prologue, each one leaves a point ─────────────────────────────────────────────
const latidoLuz = (ctx: Ctx, t: number, x: number, y: number, a: number, tiempos: number[]) => {
  for (const tl of tiempos) {
    const e = pr(t, tl, 0.7);
    if (e > 0 && e < 1) luz(ctx, x, y, 30 + 110 * eOut(e), (1 - e) * 0.9 * a, AZUL);
  }
  luz(ctx, x, y, 16, a * 0.7, AZUL);
};
const titulo = (ctx: Ctx, t: number) => {
  if (t > K.puente + 0.4) return;
  const a = eSuave(pr(t, 0.3, 0.6)) * (1 - eSuave(pr(t, K.puente - 0.1, 0.4)));
  latidoLuz(ctx, t, W / 2, H * 0.5, a, TL.slice(0, 30));
  // the points: each beat leaves one that drifts to the left, at the height of its interval
  const VEL = 120;
  for (let k = 0; k < 30; k++) {
    if (t < TL[k]) break;
    const x = W / 2 - (t - TL[k]) * VEL, y = H * 0.5 - ((SANO.latidos[k] - 0.78) / 0.15) * H * 0.08 + H * 0.16;
    if (x < 40) continue;
    ctx.fillStyle = `rgba(${AZUL},${0.9 * a})`; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  }
  // the metronome of the question: a pendulum of light that ticks the mean interval, always the same
  const amt = a * ventana(t, V[0] - 0.3, K.puente, 0.6);
  if (amt > 0.01) {
    const px = W * 0.78, py = H * 0.82, L = H * 0.32, ang = 0.42 * Math.sin((Math.PI * (t - V[0])) / 0.78);
    const tx = px + L * Math.sin(ang), ty = py - L * Math.cos(ang);
    trazo(ctx, [[px, py], [tx, ty]], RGB.crema, amt * 0.8, 2);
    luz(ctx, tx, ty, 22, amt * 0.8, RGB.crema);
    texto(ctx, "METRÓNOMO", px, py + 40, 14 * KT + 4, `rgba(${RGB.crema},${0.7 * amt})`, { alin: "center", esp: 5 });
  }
  const ut = t - K.titulo;
  if (ut < 0) return;
  const palabras = ["UN", "CORAZÓN", "NO", "ES", "UN", "METRÓNOMO"], tam = 60 * KT + 4, esp = 18;
  ctx.font = `300 ${tam}px "${SANS}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${esp}px`;
  const anchos = palabras.map((p) => ctx.measureText(p).width), hueco = tam * 0.45;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  let x = W / 2 - (anchos.reduce((q, w) => q + w, 0) + hueco * (palabras.length - 1)) / 2;
  const yT = H * 0.3;
  palabras.forEach((p, i) => {
    const ap = eSuave(pr(t, TL[8 + i] - 0.05, 0.3)) * a;
    if (ap > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)";
      texto(ctx, p, x + esp / 2, yT, tam, `rgba(${RGB.crema},${0.35 * ap})`, { fam: SANS, peso: 300, esp });
      ctx.restore();
      texto(ctx, p, x + esp / 2, yT, tam, `rgba(${RGB.crema},${0.96 * ap})`, { fam: SANS, peso: 300, esp });
    }
    x += anchos[i] + hueco;
  });
  texto(ctx, "CAPÍTULO V", W / 2 + 8, yT - tam * 1.3, 24 * KT + 6, `rgba(${AMBAR},${0.9 * a * eSuave(pr(t, TL[14], 0.8))})`, { alin: "center", esp: 16 });
};

// ─── 1 · the beat becomes a line ────────────────────────────────────────────────────────────────────────────────
const X0 = W * 0.08, X1 = W * 0.92;
const linea = (ctx: Ctx, t: number) => {
  if (t < K.linea - 0.8 || t > K.dia + 1.0) return;
  const a = eSuave(pr(t, K.linea - 0.8, 1.2)) * (1 - eSuave(pr(t, K.dia - 0.2, 1.0)));
  // the beats keep coming at their real times: the newest on the right, beside the beating light
  let n = 0;
  while (n < TL.length - 1 && TL[n] <= t) n++;
  const VEL = 75, xr = X1 - 40;
  const pts: P[] = [];
  for (let k = Math.max(0, n - 30); k < n; k++) pts.push([xr - (t - TL[k]) * VEL, H * 0.42 - ((SANO.latidos[k] - 0.78) / 0.15) * H * 0.14]);
  const vis = pts.filter(([x]) => x > X0);
  trazo(ctx, vis, AZUL, a * 0.7, 1.8);
  for (const [x, y] of vis) { ctx.fillStyle = `rgba(${AZUL},${a})`; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
  latidoLuz(ctx, t, xr + 30, H * 0.42, a, TL);
  texto(ctx, "CORAZÓN SANO · PHYSIONET, NSR018", X0, H * 0.24, 16 * KT + 4, `rgba(${AZUL},${0.9 * a * eSuave(pr(t, V[3] + 1.0, 0.8))})`, { esp: 4 });
  texto(ctx, "DURACIÓN DE CADA INTERVALO ENTRE LATIDOS", X0, H * 0.24 + 28, 13 * KT + 4, `rgba(${RGB.crema},${0.55 * a * eSuave(pr(t, V[3] + 1.0, 0.8))})`, { esp: 4 });
  // the metronome: the same mean interval, always
  const am = a * eSuave(pr(t, K.metronomo, 1.0));
  if (am > 0.01) {
    const pm: P[] = [];
    for (let k = 0; k < 30; k++) { const x = xr - ((t - K.metronomo) % 0.78) * VEL - k * 0.78 * VEL; if (x > X0) pm.push([x, H * 0.72]); }
    trazo(ctx, pm, RGB.crema, am * 0.35, 1.2);
    for (const [x, y] of pm) { ctx.fillStyle = `rgba(${RGB.crema},${0.5 * am})`; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); }
    texto(ctx, "METRÓNOMO", X0, H * 0.66, 16 * KT + 4, `rgba(${RGB.crema},${0.7 * am})`, { esp: 4 });
  }
};

// ─── 2 · twenty-four hours ──────────────────────────────────────────────────────────────────────────────────────
const dia = (ctx: Ctx, t: number) => {
  if (t < K.dia - 0.6 || t > K.zoom + 0.6) return;
  const a = eSuave(pr(t, K.dia - 0.6, 1.0)) * (1 - eSuave(pr(t, K.zoom - 0.4, 0.8)));
  const u = eIO(pr(t, K.dia + 0.4, 10.0));
  const yD = H * 0.45, hD = H * 0.2;
  banda(ctx, SANO.dia, X0, X1, yD, hD, AZUL, a, u);
  const horas = Math.min(SANO.horas, u * SANO.horas);
  texto(ctx, "HORAS", X1, yD + hD * 1.9, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "right", esp: 5 });
  texto(ctx, `${coma(horas, 1)} H`, X1, yD + hD * 1.9 + 40, 30 * KT + 6, `rgba(${AZUL},${0.95 * a})`, { fam: SANS, peso: 600, alin: "right", esp: 2 });
  texto(ctx, `${Math.round(u * SANO.n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} LATIDOS`, X0, yD + hD * 1.9 + 40, 18 * KT + 4, `rgba(${RGB.crema},${0.8 * a})`, { esp: 4 });
};

// ─── 2b · the infinite zoom: the border in space, the heart in time; one push per beat ─────────────────────────
const TODO = DAT.todo as number[], FR = DAT.frontera as number[][];
const NT = TODO.length, CENTRO = Math.floor(NT * 0.355);
// the Koch curve at level 7, from (0, 0) to (1, 0)
const KOCH7 = (() => {
  let p: P[] = [[0, 0], [1, 0]];
  for (let n = 0; n < 7; n++) {
    const q: P[] = [];
    for (let i = 0; i < p.length - 1; i++) {
      const [x0, y0] = p[i], [x1, y1] = p[i + 1], dx = (x1 - x0) / 3, dy = (y1 - y0) / 3;
      const a: P = [x0 + dx, y0 + dy], b: P = [x0 + 2 * dx, y0 + 2 * dy];
      q.push([x0, y0], a, [a[0] + dx * 0.5 - (dy * Math.sqrt(3)) / 2, a[1] + dy * 0.5 + (dx * Math.sqrt(3)) / 2], b);
    }
    q.push(p[p.length - 1]); p = q;
  }
  return p;
})();
// how far the zoom has gone: one eased push per beat
const avance = (t: number) => {
  const zl = K.zoomLat as number[];
  let k = 0;
  while (k < zl.length && zl[k] <= t) k++;
  if (k === 0) return 0;
  const frac = k < zl.length ? pr(t, zl[k - 1], Math.min(0.5, zl[k] - zl[k - 1])) : 1;
  return Math.min(1, (k - 1 + eOut(frac)) / (zl.length - 1));
};
const duracion = (seg: number) => seg >= 3600 ? `${coma(seg / 3600, 1)} H` : seg >= 60 ? `${Math.round(seg / 60)} MIN` : `${Math.round(seg)} S`;
const zoom = (ctx: Ctx, t: number) => {
  if (t < K.zoom - 0.6 || t > K.dfa + 0.4) return;
  const a = eSuave(pr(t, K.zoom - 0.6, 1.0)) * (1 - eSuave(pr(t, K.dfa - 0.9, 1.0)));
  const u = avance(t);
  // the heart (right half): the window shrinks from the whole day to 24 beats; its vertical scale follows the window
  const w = Math.max(24, NT * Math.pow(24 / NT, u));
  const i0 = Math.max(0, Math.min(NT - w, CENTRO - w / 2)), i1 = i0 + w;
  const xa = W * 0.54, xb = W * 0.96, yc = H * 0.5, hh = H * 0.22;
  let lo = 9, hi = 0;
  const C = Math.min(700, Math.floor(w));
  const cols: number[][] = [];
  for (let c = 0; c < C; c++) {
    const j0 = Math.floor(i0 + (c / C) * w), j1 = Math.max(j0 + 1, Math.floor(i0 + ((c + 1) / C) * w));
    let mn = 9, mx = 0, s = 0;
    for (let j = j0; j < j1; j++) { const v = TODO[j]; if (v < mn) mn = v; if (v > mx) mx = v; s += v; }
    cols.push([mn, mx, s / (j1 - j0)]);
    lo = Math.min(lo, mn); hi = Math.max(hi, mx);
  }
  const Y = (v: number) => yc + hh - ((v - lo) / Math.max(1e-3, hi - lo)) * 2 * hh;
  const X = (c: number) => lerp(xa, xb, (c + 0.5) / C);
  if (w > 700) {
    ctx.save(); ctx.strokeStyle = `rgba(${AZUL},${0.25 * a})`; ctx.lineWidth = Math.max(1, (xb - xa) / C);
    ctx.beginPath(); cols.forEach(([mn, mx], c) => { ctx.moveTo(X(c), Y(mn)); ctx.lineTo(X(c), Y(mx)); }); ctx.stroke(); ctx.restore();
  }
  trazo(ctx, cols.map(([, , m], c) => [X(c), Y(m)] as P), AZUL, a, 1.8);
  if (w < 140) for (let c = 0; c < C; c++) { ctx.fillStyle = `rgba(${AZUL},${a})`; ctx.beginPath(); ctx.arc(X(c), Y(cols[c][2]), 4, 0, Math.PI * 2); ctx.fill(); }
  let seg = 0;
  for (let j = Math.floor(i0); j < Math.floor(i1); j++) seg += TODO[j];
  texto(ctx, "TIEMPO · CORAZÓN SANO", xa, H * 0.16, 18 * KT + 4, `rgba(${AZUL},${0.95 * a})`, { fam: SANS, peso: 600, esp: 4 });
  texto(ctx, `VENTANA DE ${duracion(seg)}`, xb, H * 0.82, 24 * KT + 6, `rgba(${AZUL},${0.95 * a})`, { fam: SANS, peso: 600, alin: "right", esp: 2 });
  texto(ctx, `${Math.round(w).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} LATIDOS`, xb, H * 0.82 + 30, 13 * KT + 4, `rgba(${RGB.crema},${0.7 * a})`, { alin: "right", esp: 4 });
  const af = a * eSuave(pr(t, K.zoomFin - 0.2, 0.8));
  if (af > 0.01) {
    texto(ctx, "AQUÍ SE ACABA EL RANGO", (xa + xb) / 2, H * 0.24, 22 * KT + 6, `rgba(${AMBAR},${0.97 * af})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
    texto(ctx, "CADA PUNTO ES UN LATIDO", (xa + xb) / 2, H * 0.24 + 30, 13 * KT + 4, `rgba(${RGB.crema},${0.75 * af})`, { alin: "center", esp: 4 });
  }
  // Koch (left half): self-similar about its vertex, so the same push zooms forever (one ×3 is one period)
  const L = Math.log(4400) / Math.log(3), z = u * L, fz = z - Math.floor(z);
  const fa = W * 0.04, fb = W * 0.46, vista = 1.1 / Math.pow(3, fz), s = (fb - fa) / vista;
  const ox = (fa + fb) / 2, oy = H * 0.62;
  ctx.save(); ctx.beginPath(); ctx.rect(fa, H * 0.12, fb - fa, H * 0.74); ctx.clip();
  for (const lado of [1, -1]) {
    const pts: P[] = [];
    for (const [x, y] of KOCH7) if (x < vista * 0.75) pts.push([ox + lado * x * s, oy - y * s]);
    trazo(ctx, pts, RGB.crema, a, 1.8);
  }
  luz(ctx, ox, oy, 14, a * 0.6, RGB.crema);
  ctx.restore();
  texto(ctx, "MATEMÁTICA · CURVA DE KOCH", fa, H * 0.16, 18 * KT + 4, `rgba(${RGB.crema},${0.95 * a})`, { fam: SANS, peso: 600, esp: 4 });
  texto(ctx, `AMPLIACIÓN ×${Math.round(Math.pow(3, z)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`, fb, H * 0.82, 24 * KT + 6, `rgba(${RGB.crema},${0.95 * a})`, { fam: SANS, peso: 600, alin: "right", esp: 2 });
  const am = a * eSuave(pr(t, K.zoomFin - 0.2, 0.8));
  if (am > 0.01) {
    texto(ctx, "SIGUE SIN FIN", (fa + fb) / 2, H * 0.24, 22 * KT + 6, `rgba(${AMBAR},${0.97 * am})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
    texto(ctx, "CADA PARTE REPITE EL TODO", (fa + fb) / 2, H * 0.24 + 30, 13 * KT + 4, `rgba(${RGB.crema},${0.75 * am})`, { alin: "center", esp: 4 });
  }
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.25 * a})`; ctx.beginPath(); ctx.moveTo(W / 2, H * 0.12); ctx.lineTo(W / 2, H * 0.86); ctx.stroke(); ctx.restore();
  nota(ctx, "ESCALA VERTICAL DEL CORAZÓN AJUSTADA EN CADA ACERCAMIENTO · DATOS: PHYSIONET NSR018", a);
};

// ─── 3 · the DFA, as a tool; the same chart as Richardson's ─────────────────────────────────────────────────────
// the chart: log n from 4 to 1.000 beats, log F
const G = { x0: W * 0.56, x1: W * 0.93, y0: H * 0.16, y1: H * 0.74 };
const LXa = Math.log10(4), LXb = Math.log10(1000);
const LYa = Math.min(...SANO.dfa.ly, ...IC.dfa.ly) - 0.1, LYb = Math.max(...SANO.dfa.ly, ...IC.dfa.ly) + 0.1;
const gx = (lx: number) => lerp(G.x0, G.x1, (lx - LXa) / (LXb - LXa));
const gy = (ly: number) => lerp(G.y1, G.y0, (ly - LYa) / (LYb - LYa));
const ejes = (ctx: Ctx, a: number) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.35 * a})`; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(G.x0, G.y0); ctx.lineTo(G.x0, G.y1); ctx.lineTo(G.x1, G.y1); ctx.stroke(); ctx.restore();
  for (const n of [4, 16, 64, 256, 1000]) {
    const x = gx(Math.log10(n));
    ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.08 * a})`; ctx.beginPath(); ctx.moveTo(x, G.y0); ctx.lineTo(x, G.y1); ctx.stroke(); ctx.restore();
    texto(ctx, String(n), x, G.y1 + 26, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "center", esp: 2 });
  }
  texto(ctx, "TAMAÑO DE LA VENTANA (LATIDOS) · ESCALA LOGARÍTMICA", (G.x0 + G.x1) / 2, G.y1 + 58, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "center", esp: 4 });
  ctx.save(); ctx.translate(G.x0 - 30, (G.y0 + G.y1) / 2); ctx.rotate(-Math.PI / 2);
  texto(ctx, "FLUCTUACIÓN", 0, 0, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "center", esp: 4 }); ctx.restore();
};
// the fitted segment between two window sizes, from the curve's own points
// the segment between the curve's own points nearest to n0 and n1 (so it starts and ends on visible points)
const ajuste = (s: Serie, n0: number, n1: number, _alfa: number): [P, P] => {
  const xs = s.dfa.lx, cerca = (n: number) => xs.reduce((b, x, i) => (Math.abs(x - Math.log10(n)) < Math.abs(xs[b] - Math.log10(n)) ? i : b), 0);
  const i0 = cerca(n0), i1 = cerca(n1);
  return [[gx(xs[i0]), gy(s.dfa.ly[i0])], [gx(xs[i1]), gy(s.dfa.ly[i1])]];
};
const curva = (ctx: Ctx, s: Serie, col: string, a: number, u: number) => {
  const n = Math.floor(s.dfa.lx.length * u);
  if (n > 1) { ctx.save(); ctx.strokeStyle = `rgba(${col},${0.35 * a})`; ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i < n; i++) (i ? ctx.lineTo(gx(s.dfa.lx[i]), gy(s.dfa.ly[i])) : ctx.moveTo(gx(s.dfa.lx[i]), gy(s.dfa.ly[i]))); ctx.stroke(); ctx.restore(); }
  for (let i = 0; i < n; i++) {
    const x = gx(s.dfa.lx[i]), y = gy(s.dfa.ly[i]);
    luz(ctx, x, y, 12, a * 0.5, col); ctx.fillStyle = `rgba(${col},${a})`; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  }
};
// the demonstration on 64 healthy beats: their profile (the running sum), cut into windows of n, each with its trend
const TRAMO = DAT.tramo as number[];
const PERFIL = (() => { const m = TRAMO.reduce((q, v) => q + v, 0) / TRAMO.length; let s = 0; return TRAMO.map((v) => (s += v - m)); })();
const demo = (ctx: Ctx, n: number, a: number, aTend: number, aRes: number) => {
  if (a <= 0.01) return;
  const x0 = W * 0.07, x1 = W * 0.47, yc = H * 0.45, hh = H * 0.22;
  const lo = Math.min(...PERFIL), hi = Math.max(...PERFIL);
  const X = (i: number) => lerp(x0, x1, i / (PERFIL.length - 1)), Y = (v: number) => yc + hh - ((v - lo) / (hi - lo)) * 2 * hh;
  trazo(ctx, PERFIL.map((v, i) => [X(i), Y(v)] as P), AZUL, a, 2);
  texto(ctx, "64 LATIDOS · LA SERIE ACUMULADA", x0, yc - hh - 30, 14 * KT + 4, `rgba(${RGB.crema},${0.7 * a})`, { esp: 4 });
  const m = Math.floor(PERFIL.length / n);
  for (let w = 0; w < m; w++) {
    const i0 = w * n, i1 = i0 + n - 1;
    ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.3 * a})`; ctx.setLineDash([3, 6]);
    ctx.beginPath(); ctx.moveTo(X(i0), yc - hh - 10); ctx.lineTo(X(i0), yc + hh + 10); ctx.stroke(); ctx.restore();
    // the least-squares line of the window
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let i = i0; i <= i1; i++) { sx += i; sy += PERFIL[i]; sxx += i * i; sxy += i * PERFIL[i]; }
    const k = i1 - i0 + 1, b1 = (k * sxy - sx * sy) / Math.max(1e-9, k * sxx - sx * sx), b0 = (sy - b1 * sx) / k;
    if (aTend > 0.01) trazo(ctx, [[X(i0), Y(b0 + b1 * i0)], [X(i1), Y(b0 + b1 * i1)]], AMBAR, a * aTend, 1.8);
    if (aRes > 0.01) {
      ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.45 * a * aRes})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); for (let i = i0; i <= i1; i++) { ctx.moveTo(X(i), Y(PERFIL[i])); ctx.lineTo(X(i), Y(b0 + b1 * i)); } ctx.stroke(); ctx.restore();
    }
  }
  texto(ctx, `VENTANAS DE ${n} LATIDOS`, x1, yc + hh + 46, 16 * KT + 4, `rgba(${AMBAR},${0.9 * a})`, { alin: "right", esp: 4 });
};
const dfa = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.dfa - 0.6 || t > K.nubes + 0.4) return;
  const a = eSuave(pr(t, K.dfa - 0.6, 1.0)) * (1 - eSuave(pr(t, K.nubes - 0.8, 1.0)));
  // Peng, on the name of the method
  const ap = a * ventana(t, K.dfa + 0.2, V[11] - 0.2, 0.7);
  if (ap > 0.01) {
    retrato(ctx, f.peng, W / 2, ap, "CHUNG-KANG PENG", "", H * 0.14, H * 0.46);
    nota(ctx, "FOTO: DBIOM, WIKIMEDIA COMMONS · CC BY-SA 4.0", ap);
  }
  rotulo(ctx, "ANÁLISIS DE FLUCTUACIONES SIN TENDENCIA", "PENG, HAVLIN, STANLEY Y GOLDBERGER · 1995", a * ventana(t, K.dfa + 0.2, K.otro - 0.4, 0.8));
  // the demonstration: windows of 4, then 16, then 64 (the left half), until the other heart arrives
  const ad = a * ventana(t, V[11] - 0.2, K.otro + 0.6, 0.7);
  const nW = t < K.crecen[0] + 1.8 ? 4 : t < K.crecen[0] + 3.6 ? 16 : 64;
  demo(ctx, nW, ad, eSuave(pr(t, K.ventanas[1] - 0.3, 0.6)), eSuave(pr(t, K.ventanas[2] - 0.3, 0.6)));
  // the chart (right half): the curve of the whole day, point by point as the windows grow
  const ag = a * eSuave(pr(t, K.crecen[0] - 0.4, 0.8));
  ejes(ctx, ag);
  curva(ctx, SANO, AZUL, ag, eIO(pr(t, K.crecen[0], K.crecen[1] - K.crecen[0] + 4.0)));
  const a1 = ag * eSuave(pr(t, K.alfas[0] - 0.3, 0.6)), a2 = ag * eSuave(pr(t, K.alfas[1] - 0.3, 0.6));
  if (a1 > 0.01) { const [p, q] = ajuste(SANO, 4, 16, SANO.a1); trazo(ctx, [p, q], AZUL, a1, 2.6); texto(ctx, `α₁ = ${coma(SANO.a1)}`, q[0] - 10, q[1] - 26, 22 * KT + 6, `rgba(${AZUL},${0.97 * a1})`, { fam: SANS, peso: 600, alin: "right", esp: 2 }); }
  if (a2 > 0.01) { const [p, q] = ajuste(SANO, 16, 64, SANO.a2); trazo(ctx, [p, q], AZUL, a2, 2.6); texto(ctx, `α₂ = ${coma(SANO.a2)}`, q[0] + 14, q[1] + 40, 22 * KT + 6, `rgba(${AZUL},${0.97 * a2})`, { fam: SANS, peso: 600, esp: 2 }); }
  // the reference slopes, thin, from the first point
  const x0 = SANO.dfa.lx[0], y0 = SANO.dfa.ly[0];
  ([[0.5, "0,5 · AL AZAR"], [1.0, "1 · RUIDO 1/f"], [1.5, "1,5 · RUIDO BROWNIANO"]] as [number, string][]).forEach(([s, n], i) => {
    const ar = ag * ventana(t, K.refs[i] - 0.3, K.otro - 0.2, 0.6);
    if (ar <= 0.01) return;
    const lx1 = Math.min(LXb, x0 + (LYb - 0.05 - y0) / s);
    trazo(ctx, [[gx(x0), gy(y0)], [gx(lx1), gy(y0 + s * (lx1 - x0))]], RGB.crema, ar * 0.5, 1);
    texto(ctx, n, gx(lx1) - 6, gy(y0 + s * (lx1 - x0)) + (s < 1.2 ? 22 : -12), 13 * KT + 4, `rgba(${RGB.crema},${0.75 * ar})`, { esp: 3, alin: "right" });
  });
  // 4 · the other heart: its line under the healthy one, its curve in amber
  const ao = a * eSuave(pr(t, K.otro, 1.0));
  if (ao > 0.01) {
    const u = pr(t, K.otro, 14);
    const n0 = Math.floor(u * 200);
    tira(ctx, SANO.latidos, W * 0.06, W * 0.48, H * 0.28, H * 0.06, AZUL, ao, n0, n0 + 60, false);
    tira(ctx, IC.latidos, W * 0.06, W * 0.48, H * 0.58, H * 0.06, AMBAR, ao, n0, n0 + 60, false);
    texto(ctx, "CORAZÓN SANO · NSR018", W * 0.06, H * 0.17, 14 * KT + 4, `rgba(${AZUL},${0.9 * ao})`, { esp: 4 });
    texto(ctx, "INSUFICIENCIA CARDÍACA · CHF223 · CLASE NYHA III", W * 0.06, H * 0.47, 14 * KT + 4, `rgba(${AMBAR},${0.9 * ao})`, { esp: 4 });
    curva(ctx, IC, AMBAR, ao, eIO(pr(t, V[17], 3.0)));
    const b1 = ao * eSuave(pr(t, K.alfasIC[0] - 0.3, 0.6)), b2 = ao * eSuave(pr(t, K.alfasIC[1] - 0.3, 0.6));
    if (b1 > 0.01) { const [p, q] = ajuste(IC, 4, 16, IC.a1); trazo(ctx, [p, q], AMBAR, b1, 2.6); texto(ctx, `α₁ = ${coma(IC.a1)}`, q[0] + 10, q[1] + 34, 22 * KT + 6, `rgba(${AMBAR},${0.97 * b1})`, { fam: SANS, peso: 600, esp: 2 }); }
    if (b2 > 0.01) { const [p, q] = ajuste(IC, 16, 64, IC.a2); trazo(ctx, [p, q], AMBAR, b2, 2.6); texto(ctx, `α₂ = ${coma(IC.a2)}`, q[0] + 14, q[1] + 36, 22 * KT + 6, `rgba(${AMBAR},${0.97 * b2})`, { fam: SANS, peso: 600, esp: 2 }); }
  }
};

// ─── 5 · eighty-three people: two clouds that overlap ───────────────────────────────────────────────────────────
const N1 = { x0: W * 0.12, x1: W * 0.62, y0: H * 0.12, y1: H * 0.8 };
const A1a = 0.55, A1b = 1.75, A2a = 0.85, A2b = 1.45;
const nx = (v: number) => lerp(N1.x0, N1.x1, (v - A1a) / (A1b - A1a)), ny = (v: number) => lerp(N1.y1, N1.y0, (v - A2a) / (A2b - A2a));
const casco = (pts: P[]): P[] => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P[] = [], up: P[] = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...p].reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
const poligono = (ctx: Ctx, pts: P[]) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
const mediana = (v: number[]) => { const s = [...v].sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const nubes = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.nubes - 0.6 || t > K.cierre + 0.6) return;
  const a = eSuave(pr(t, K.nubes - 0.6, 1.0)) * (1 - eSuave(pr(t, K.cierre - 0.4, 1.2)));
  // axes
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.35 * a})`; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(N1.x0, N1.y0); ctx.lineTo(N1.x0, N1.y1); ctx.lineTo(N1.x1, N1.y1); ctx.stroke(); ctx.restore();
  for (const v of [0.75, 1.0, 1.25, 1.5]) texto(ctx, coma(v), nx(v), N1.y1 + 26, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "center", esp: 2 });
  for (const v of [0.9, 1.1, 1.3]) texto(ctx, coma(v, 1), N1.x0 - 14, ny(v) + 5, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "right", esp: 2 });
  texto(ctx, "α₁ · VENTANAS DE 4 A 16 LATIDOS", (N1.x0 + N1.x1) / 2, N1.y1 + 58, 14 * KT + 4, `rgba(${RGB.crema},${0.7 * a})`, { alin: "center", esp: 4 });
  ctx.save(); ctx.translate(N1.x0 - 70, (N1.y0 + N1.y1) / 2); ctx.rotate(-Math.PI / 2);
  texto(ctx, "α₂ · VENTANAS DE 16 A 64 LATIDOS", 0, 0, 14 * KT + 4, `rgba(${RGB.crema},${0.7 * a})`, { alin: "center", esp: 4 }); ctx.restore();
  const grupos: [string, string, number, string][] = [["nsr2db", AZUL, K.llegan[0], "SANOS · 54"], ["chf2db", AMBAR, K.llegan[1], "INSUFICIENCIA · 29"]];
  const cascos: P[][] = [];
  grupos.forEach(([g, col, t0, nom], gi) => {
    const pts = GR[g];
    const dur = gi === 0 ? 6.0 : 4.5;
    pts.forEach(([x, y], i) => {
      const e = pr(t, t0 + (i / pts.length) * dur, 0.5);
      if (e <= 0) return;
      const X = nx(x), Y = ny(y);
      if (e < 1) luz(ctx, X, Y, 26 * (1 - e) + 8, (1 - e) * a, col);
      ctx.fillStyle = `rgba(${col},${0.9 * a})`; ctx.beginPath(); ctx.arc(X, Y, 6, 0, Math.PI * 2); ctx.fill();
    });
    cascos.push(casco(pts.map(([x, y]) => [nx(x), ny(y)] as P)));
    const al = a * eSuave(pr(t, t0, 0.8));
    texto(ctx, nom, N1.x1 + 40, N1.y0 + 40 + gi * 40, 20 * KT + 6, `rgba(${col},${0.95 * al})`, { fam: SANS, peso: 600, esp: 3 });
    // the median of the group, as a cross
    const am = a * eSuave(pr(t, V[19] + 1.0 + gi * 0.8, 0.6));
    if (am > 0.01) {
      const mx = nx(mediana(pts.map((p) => p[0]))), my = ny(mediana(pts.map((p) => p[1])));
      ctx.save(); ctx.strokeStyle = `rgba(${col},${am})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(mx - 18, my); ctx.lineTo(mx + 18, my); ctx.moveTo(mx, my - 18); ctx.lineTo(mx, my + 18); ctx.stroke(); ctx.restore();
      luz(ctx, mx, my, 30, am * 0.6, col);
    }
  });
  // the two people of the chapter, ringed
  [[SANO, AZUL], [IC, AMBAR]].forEach(([s, col]) => {
    const ss = s as Serie, ar = a * ventana(t, K.nubes + 0.4, K.llegan[0] + 3.0, 0.6);
    if (ar > 0.01) { ctx.save(); ctx.strokeStyle = `rgba(${col},${ar})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(nx(ss.a1), ny(ss.a2), 16, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    const ap = a * eSuave(pr(t, K.nubes + 0.4, 0.8));
    if (ap > 0.01) {
      luz(ctx, nx(ss.a1), ny(ss.a2), 24, ap * 0.7, col as string); ctx.fillStyle = `rgba(${col},${0.95 * ap})`; ctx.beginPath(); ctx.arc(nx(ss.a1), ny(ss.a2), 6, 0, Math.PI * 2); ctx.fill();
      texto(ctx, ss === SANO ? "NSR018" : "CHF223", nx(ss.a1) + 24, ny(ss.a2) + 5, 13 * KT + 4, `rgba(${col},${0.85 * ar})`, { esp: 3 });
    }
  });
  // where the clouds touch: the intersection of their outlines lights up
  const ao = a * eSuave(pr(t, K.solapa - 0.2, 0.8));
  if (ao > 0.01 && cascos.length === 2) {
    cascos.forEach((c, i) => { ctx.save(); ctx.strokeStyle = `rgba(${i ? AMBAR : AZUL},${0.5 * ao})`; ctx.lineWidth = 1.4; ctx.setLineDash([5, 6]); poligono(ctx, c); ctx.stroke(); ctx.restore(); });
    ctx.save(); poligono(ctx, cascos[0]); ctx.clip(); poligono(ctx, cascos[1]); ctx.fillStyle = `rgba(255,245,230,${0.16 * ao})`; ctx.fill(); ctx.restore();
    texto(ctx, "ZONA COMÚN", N1.x1 + 40, N1.y0 + 150, 18 * KT + 6, `rgba(${RGB.crema},${0.95 * ao})`, { fam: SANS, peso: 600, esp: 3 });
    texto(ctx, "DIFERENCIA ENTRE GRUPOS", N1.x1 + 40, N1.y0 + 184, 14 * KT + 4, `rgba(${RGB.crema},${0.75 * ao})`, { esp: 4 });
    texto(ctx, "NO SIRVE PARA DIAGNOSTICAR", N1.x1 + 40, N1.y0 + 210, 14 * KT + 4, `rgba(${RGB.crema},${0.75 * ao})`, { esp: 4 });
  }
  // what we did not control
  const ac = a * eSuave(pr(t, V[21] + 0.4, 0.8));
  if (ac > 0.01) {
    texto(ctx, "LO QUE NO CONTROLAMOS", N1.x1 + 40, N1.y0 + 300, 18 * KT + 6, `rgba(${AMBAR},${0.95 * ac})`, { fam: SANS, peso: 600, esp: 3 });
    ["MEDICACIÓN", "CRITERIOS DE SELECCIÓN DE CADA BASE", "CALIDAD DE LA SEÑAL, SALVO LA FRACCIÓN DE LATIDOS NORMALES"].forEach((s, i) =>
      texto(ctx, `· ${s}`, N1.x1 + 40, N1.y0 + 334 + i * 26, 13 * KT + 4, `rgba(${RGB.crema},${0.75 * ac * eSuave(pr(t, V[21] + 1.0 + i * 1.2, 0.6))})`, { esp: 3 }));
  }
  nota(ctx, "ANÁLISIS PROPIO · PHYSIONET NSR2DB Y CHF2DB · MANN–WHITNEY, p ≈ 2·10⁻⁶ (α₁) Y 1·10⁻⁶ (α₂) · SE MANTIENE ENTRE 50 Y 75 AÑOS", a * eSuave(pr(t, V[19], 0.8)) * (1 - eSuave(pr(t, K.ivanov, 0.6))));
  // Ivanov
  const ai = a * ventana(t, K.ivanov + 0.2, K.cierre - 0.4, 0.7);
  if (ai > 0.01) {
    ctx.fillStyle = `rgba(2,3,6,${0.8 * ai})`; ctx.fillRect(0, 0, W, H);
    retrato(ctx, f.ivanov, W / 2, ai, "PLAMEN CH. IVANOV", "", H * 0.2, H * 0.34);
    nota(ctx, "FOTO: UNIVERSIDAD DE BOSTON", ai);
    rotulo(ctx, "MULTIFRACTALIDAD DEL LATIDO", "IVANOV Y OTROS · NATURE, 1999", ai);
  }
};

// ─── forms of the film, full frame: fractals of the rule, the border, the aggregate, the rivers, the vessels ────
const DPTS = DLA.pts as number[];
const kochPts = (() => {
  let p: P[] = [[0, 0], [1, 0]];
  for (let n = 0; n < 5; n++) {
    const q: P[] = [];
    for (let i = 0; i < p.length - 1; i++) {
      const [x0, y0] = p[i], [x1, y1] = p[i + 1], dx = (x1 - x0) / 3, dy = (y1 - y0) / 3;
      const a: P = [x0 + dx, y0 + dy], b: P = [x0 + 2 * dx, y0 + 2 * dy];
      const c: P = [a[0] + dx * 0.5 - dy * Math.sqrt(3) / 2, a[1] + dy * 0.5 + dx * Math.sqrt(3) / 2];
      q.push([x0, y0], a, c, b);
    }
    q.push(p[p.length - 1]); p = q;
  }
  return p;
})();
type Fr = { cx: number; cy: number; ancho: number; julia?: [number, number]; pal: number; it: number };
const FRACT: Record<string, Fr> = {
  mandel: { cx: -0.6, cy: 0, ancho: 3.6, pal: 0, it: 300 }, julia1: { cx: 0, cy: 0, ancho: 3.4, julia: [-0.8, 0.156], pal: 2, it: 400 },
  caballitos: { cx: -0.743643887, cy: 0.131825904, ancho: 0.004, pal: 1, it: 1500 }, basilica: { cx: 0, cy: 0, ancho: 3.4, julia: [-1, 0], pal: 3, it: 300 },
  dendrita: { cx: 0, cy: 0, ancho: 3.2, julia: [0, 1], pal: 2, it: 400 }, elefantes: { cx: 0.275, cy: 0.006, ancho: 0.03, pal: 0, it: 900 },
  conejo: { cx: 0, cy: 0, ancho: 3.2, julia: [-0.123, 0.745], pal: 1, it: 400 }, espiral: { cx: -0.7453, cy: 0.1127, ancho: 0.004, pal: 2, it: 1500 },
  julia2: { cx: 0, cy: 0, ancho: 3.0, julia: [0.285, 0.01], pal: 3, it: 500 },
};
const forma = (ctx: Ctx, f: Fotos, nombre: string, t: number, a: number, z = 1) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = a;
  const fr = FRACT[nombre];
  if (fr) {
    const l = pintarProfundo(Math.round(W / 2), Math.round(H / 2), { cx: fr.cx, cy: fr.cy, ancho: fr.ancho / z, julia: fr.julia, fase: 0.04 * t, paleta: PALETAS[fr.pal], brillo: 0.9, maxIt: fr.it, tiempo: 0.4 * t });
    ctx.imageSmoothingQuality = "high"; ctx.drawImage(l, 0, 0, W, H);
  } else if (nombre === "frontera") {
    const s = (H * 0.86) / 340;
    trazo(ctx, FR.map(([x, y]) => [W / 2 + (x - 2) * s * z, H / 2 - (y - 70) * s * z] as P), RGB.crema, 1, 2.4);
  } else if (nombre === "agregado") {
    const s = ((H * 0.46) / 1130) * z;
    ctx.fillStyle = `rgba(${AMBAR},0.9)`;
    for (let i = 0; i < DPTS.length / 2; i += 1) ctx.fillRect(W / 2 + DPTS[2 * i] * s - 0.7, H / 2 + DPTS[2 * i + 1] * s - 0.7, 1.4, 1.4);
  } else if (nombre === "rios") {
    const im = f.ero;
    if (im) { ctx.globalCompositeOperation = "lighter"; ctx.drawImage(im, W / 2 - (W * z) / 2, H / 2 - (H * z) / 2, W * z, H * z); }
  } else if (nombre === "vasos") {
    const VN = VAS.nodos as number[], VP = VAS.padre as number[], VA = VAS.ancho as number[], R = H * 0.46 * z;
    ctx.strokeStyle = "rgba(255,150,130,0.92)"; ctx.lineCap = "round";
    for (let i = 1; i < VP.length; i++) { const j = VP[i]; if (j < 0) continue; ctx.lineWidth = Math.max(0.9, VA[i] * 0.35 * (R / 480) * 1.6); ctx.beginPath(); ctx.moveTo(W / 2 + VN[2 * j] * R, H / 2 + VN[2 * j + 1] * R); ctx.lineTo(W / 2 + VN[2 * i] * R, H / 2 + VN[2 * i + 1] * R); ctx.stroke(); }
  } else if (nombre === "koch") {
    const s = W * 0.8 * z;
    trazo(ctx, kochPts.map(([x, y]) => [W / 2 + (x - 0.5) * s, H * 0.62 - y * s] as P), RGB.crema, 1, 2);
  }
  ctx.restore();
};
// one form per beat: the cut lands on the beat with a flash; a slow push in while it lasts
const cortes = (ctx: Ctx, f: Fotos, t: number, tiempos: number[], nombres: string[], a: number, hasta: number) => {
  let k = -1;
  for (let i = 0; i < tiempos.length; i++) if (t >= tiempos[i]) k = i;
  if (k < 0 || t > hasta) return;
  const t0 = tiempos[k], t1 = k + 1 < tiempos.length ? tiempos[k + 1] : hasta;
  forma(ctx, f, nombres[k % nombres.length], t, a, 1 + 0.06 * pr(t, t0, Math.max(0.3, t1 - t0)));
  const e = pr(t, t0, 0.22);
  if (e < 1) { ctx.fillStyle = `rgba(255,248,235,${0.16 * (1 - e) * (1 - e) * a})`; ctx.fillRect(0, 0, W, H); }
};

// ─── 1a · the bridge: the beat, and a form of the film on each of six beats ─────────────────────────────────────
const PUENTE = ["frontera", "agregado", "rios", "vasos", "koch"];
const puente = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.puente - 0.2 || t > K.linea + 0.4) return;
  const tl = TL.slice(K.pk, K.pk + 5), fin = TL[K.pk + 5];
  cortes(ctx, f, t, tl, PUENTE, 0.9 * (1 - eSuave(pr(t, fin - 0.4, 0.5))), fin);
  // then only the beat, until the line
  latidoLuz(ctx, t, W / 2, H * 0.5, eSuave(pr(t, fin - 0.2, 0.6)) * (1 - eSuave(pr(t, K.linea - 0.4, 0.8))), TL.slice(K.pk + 5, K.pk + 60));
};

// ─── 6 · close: the healthy line beats again; then the heartbeat becomes a fractal ─────────────────────────────
// The 24 hours of nsr018 wound into a spiral of light, one turn per hour; zooming in, one hour is itself a spiral of
// minutes, and one minute a spiral of beats. The camera pushes on each beat of the montage, faster and faster.
const HORAS: number[] = (() => { let s = 0; return TODO.map((r) => (s += r) / 3600); })();
const MU = TODO.reduce((q, v) => q + v, 0) / NT;
const SD = Math.sqrt(TODO.reduce((q, v) => q + (v - MU) ** 2, 0) / NT);
const ZD = TODO.map((r) => Math.max(-3, Math.min(3, (r - MU) / SD)));
const HSEL = 9, MSEL = 31;
const IH = HORAS.map((h, i) => (h >= HSEL && h < HSEL + 1 ? i : -1)).filter((i) => i >= 0);
const IM = IH.filter((i) => (HORAS[i] - HSEL) * 60 >= MSEL && (HORAS[i] - HSEL) * 60 < MSEL + 1);
type Esp = { t0: number; vueltas: number; r0: number; r1: number; amp: number };
// a point of a spiral: u in turns from its start, z the beat's deviation
const punto = (e: Esp, u: number, z: number): P => {
  const r = e.r0 + ((e.r1 - e.r0) * u) / e.vueltas + e.amp * z, th = 2 * Math.PI * u - Math.PI / 2;
  return [r * Math.cos(th), r * Math.sin(th)];
};
const E0: Esp = { t0: 0, vueltas: 23, r0: 0.07, r1: 0.45, amp: 0.0055 };
const E1: Esp = { t0: 0, vueltas: 60, r0: 0.06, r1: 0.44, amp: 0.0021 };
const E2: Esp = { t0: 0, vueltas: 6, r0: 0.09, r1: 0.42, amp: 0.02 };
const P0 = HORAS.map((h, i) => punto(E0, h, ZD[i]));
const P1 = IH.map((i) => punto(E1, (HORAS[i] - HSEL) * 60, ZD[i]));
const P2 = IM.map((i) => punto(E2, ((HORAS[i] - HSEL) * 60 - MSEL) * 6, ZD[i]));
// draw a wound series: points (in units of H) through a camera (centre, scale), revealed up to fraction p
const espiral = (ctx: Ctx, pts: P[], cam: { x: number; y: number; s: number }, a: number, p: number, paso: number, ancho: number, puntos = false) => {
  if (a <= 0.01 || p <= 0) return;
  const n = Math.max(2, Math.floor(pts.length * Math.min(1, p)));
  const X = (q: P) => W / 2 + (q[0] - cam.x) * H * cam.s, Y = (q: P) => H / 2 + (q[1] - cam.y) * H * cam.s;
  const tramos = 24, por = Math.ceil(n / tramos);
  for (let k = 0; k < tramos; k++) {
    const i0 = k * por, i1 = Math.min(n - 1, (k + 1) * por);
    if (i1 <= i0) break;
    const f = k / tramos, col = `${Math.round(lerp(255, 245, f))},${Math.round(lerp(170, 236, f))},${Math.round(lerp(95, 215, f))}`;
    const seg: P[] = [];
    for (let i = i0; i <= i1; i += paso) seg.push([X(pts[i]), Y(pts[i])]);
    seg.push([X(pts[i1]), Y(pts[i1])]);
    trazo(ctx, seg, col, a, ancho);
  }
  if (puntos) for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(255,240,225,${a})`; ctx.beginPath(); ctx.arc(X(pts[i]), Y(pts[i]), 5, 0, Math.PI * 2); ctx.fill(); }
  if (p < 1) luz(ctx, X(pts[n - 1]), Y(pts[n - 1]), 34, a);
};
// the heart with failure and a metronome, wound the same way (deviations measured with the healthy spread)
const TIC_ = DAT.todoIC as number[];
const HIC: number[] = (() => { let s = 0; return TIC_.map((r) => (s += r) / 3600); })();
const MUIC = TIC_.reduce((q, v) => q + v, 0) / TIC_.length;
const PIC = HIC.map((h, i) => punto(E0, h, Math.max(-3, Math.min(3, (TIC_[i] - MUIC) / SD))));
const PMET = Array.from({ length: 3000 }, (_, i) => punto(E0, (i / 2999) * 23, 0));
// the logistic map: a series at r = 3.9, and the bifurcation diagram for r from 2.8 to 4.0
const SERIE = (() => { let x = 0.3; const o: number[] = []; for (let i = 0; i < 300; i++) { x = 3.9 * x * (1 - x); if (i >= 100) o.push(x); } return o; })();
const RA = 2.8, RB = 4.0, NC = 900;
const BIF = Array.from({ length: NC }, (_, c) => {
  const r = RA + ((RB - RA) * c) / (NC - 1); let x = 0.5; const o: number[] = [];
  for (let i = 0; i < 600; i++) { x = r * x * (1 - x); if (i >= 480) o.push(x); }
  return o;
});
const cierre = (ctx: Ctx, t: number, f: Fotos) => {
  void f;
  if (t < K.cierre - 0.4) return;
  const fm = K.montaje as number[], m0 = fm[0];
  let golpe = 0;
  for (const g of fm) if (t >= g && t - g < 0.6) golpe = Math.max(golpe, Math.exp(-(t - g) * 7));
  const silencio = 1 - ventana(t, K.quieto - 0.9, K.quieto + 0.05, 0.25);
  const am = silencio * eSuave(pr(t, m0 - 0.4, 0.4));
  if (t < K.quieto - 0.6) {
    // the dive: the day winds itself, then one hour, then one minute; one push per beat, faster and faster
    const z1 = eIO(pr(t, m0 + 2.6, 1.8)), z2 = eIO(pr(t, m0 + 5.4, 1.4));
    const fh = P0[IH[Math.floor(IH.length / 2)]];
    const cam0 = { x: lerp(0, fh[0], z1), y: lerp(0, fh[1], z1), s: Math.exp(lerp(0, Math.log(14), z1)) * (1 + 0.015 * golpe) };
    espiral(ctx, P0, cam0, am * (1 - eSuave(pr(t, m0 + 3.5, 0.9))), eIO(pr(t, m0, 2.4)), 3, 1.4);
    const a1 = am * eSuave(pr(t, m0 + 3.4, 0.8)) * (1 - eSuave(pr(t, m0 + 6.3, 0.7)));
    const fmn = P1[IM.length ? IH.indexOf(IM[Math.floor(IM.length / 2)]) : 0];
    const cam1 = { x: lerp(0, fmn[0], z2), y: lerp(0, fmn[1], z2), s: lerp(0.25, 1, eOut(pr(t, m0 + 3.4, 1.2))) * Math.exp(lerp(0, Math.log(14), z2)) * (1 + 0.015 * golpe) };
    espiral(ctx, P1, cam1, a1, eIO(pr(t, m0 + 3.6, 1.6)), 1, 1.3);
    const a2 = am * eSuave(pr(t, m0 + 6.2, 0.8));
    const nb = fm.filter((g) => g <= t).length;
    const p2 = Math.min(1, eIO(pr(t, m0 + 6.2, 1.0)) * 0.5 + (nb / fm.length) * 0.5);
    espiral(ctx, P2, { x: 0, y: 0, s: lerp(0.3, 1, eOut(pr(t, m0 + 6.2, 1.0))) * (1 + 0.03 * golpe) }, a2, p2, 1, 2.2, true);
    rotulo(ctx, "UN DÍA DE ESTE CORAZÓN", "UNA VUELTA POR HORA · 106.271 LATIDOS", am * ventana(t, m0 + 0.2, m0 + 3.4, 0.4));
    rotulo(ctx, "UNA HORA", "UNA VUELTA POR MINUTO", am * ventana(t, m0 + 3.6, m0 + 6.3, 0.4));
    rotulo(ctx, "UN MINUTO", "CADA PUNTO ES UN LATIDO", am * ventana(t, m0 + 6.4, K.quieto - 0.9, 0.4));
    return;
  }
  // three days side by side: the healthy heart, the heart with failure, a metronome
  const at = eSuave(pr(t, K.tres, 0.6)) * (1 - eSuave(pr(t, K.logistica - 0.5, 0.9)));
  if (at > 0.01) {
    const solo = eIO(pr(t, V[26] - 0.4, 2.2));        // under «Estructura dentro de estructura…», the healthy one alone, large
    const xs = [lerp(0.2, 0.5, solo), 0.5, 0.8].map((x) => x * W);
    const sc = [lerp(0.6, 1.02, solo), 0.6, 0.6];
    const datos: [P[], string, string, number][] = [[P0, "CORAZÓN SANO", "NSR018 · 24 H", 0], [PIC, "INSUFICIENCIA CARDÍACA", "CHF223 · 20 H", 1], [PMET, "METRÓNOMO", "SIEMPRE EL MISMO INTERVALO", 2]];
    datos.forEach(([pts, nom, sub, i]) => {
      const ap = at * (i === 0 ? 1 : 1 - solo) * (i === 0 ? 1 : lerp(1, 0.55, eSuave(pr(t, V[24], 1.0))));
      const p = eIO(pr(t, K.tres + i * 0.5, 2.6));
      ctx.save(); ctx.translate(xs[i], H / 2); ctx.translate(-W / 2, -H / 2);
      espiral(ctx, pts, { x: 0, y: 0, s: sc[i] }, ap, p, i === 2 ? 1 : 4, i === 2 ? 1.2 : 1.1);
      ctx.restore();
      const al = ap * eSuave(pr(t, K.tres + 0.8 + i * 0.5, 0.6)) * (i === 0 ? 1 - solo : 1);
      texto(ctx, nom, xs[i], H * 0.86, 20 * KT + 6, `rgba(${i === 0 ? AZUL : i === 1 ? AMBAR : RGB.crema},${0.95 * al})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
      texto(ctx, sub, xs[i], H * 0.86 + 30, 13 * KT + 4, `rgba(${RGB.crema},${0.65 * al})`, { alin: "center", esp: 4 });
    });
    // the clinical finding, under «Y eso importa…»; «demasiado parejo» on the metronome
    const ak = at * ventana(t, V[24] + 1.0, V[25] + 1.0, 0.6);
    if (ak > 0.01) {
      texto(ctx, "ESTUDIO CLÍNICO · 1987 · 808 PERSONAS QUE SOBREVIVIERON A UN INFARTO", W / 2, H * 0.08, 16 * KT + 4, `rgba(${RGB.crema},${0.9 * ak})`, { alin: "center", esp: 4 });
      texto(ctx, "CON EL RITMO MENOS VARIABLE, EL RIESGO FUE 5,3 VECES MAYOR", W / 2, H * 0.08 + 36, 24 * KT + 6, `rgba(${AMBAR},${0.97 * ak})`, { fam: SANS, peso: 600, alin: "center", esp: 2 });
    }
    const ad = at * ventana(t, V[25] + 0.6, V[26] - 0.2, 0.6);
    if (ad > 0.01) texto(ctx, "DEMASIADO PAREJO", W * 0.8, H * 0.12, 22 * KT + 6, `rgba(${AMBAR},${0.97 * ad})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
  }
  // the bridge to chapter VI: a line of beats becomes the line of one rule; then its bifurcation diagram, explained
  const B = K.bif as { t0: number; t30: number; t357: number; t4: number; zoom: number[] };
  const al = ventana(t, K.logistica + 0.3, B.t0 + 0.8, 0.8);
  if (al > 0.01) {
    const x0 = W * 0.1, x1 = W * 0.9, yc = H * 0.6, hh = H * 0.14;
    const mez = eIO(pr(t, K.logistica + 1.4, 1.6));
    const n = 80, pts: P[] = [];
    for (let i = 0; i < n; i++) {
      const vSano = (SANO.latidos[i + 100] - 0.78) / 0.15, vLog = (SERIE[i] - 0.5) * 2.4;
      pts.push([lerp(x0, x1, i / (n - 1)), yc - lerp(vSano, vLog, mez) * hh]);
    }
    trazo(ctx, pts, mez > 0.5 ? AMBAR : AZUL, al * 0.8, 1.6);
    for (const [x, y] of pts) { ctx.fillStyle = `rgba(255,240,225,${al})`; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); }
    texto(ctx, mez < 0.5 ? "EL LATIDO" : "UNA SOLA REGLA, REPETIDA", W / 2, yc + hh * 1.6 + 30, 15 * KT + 4, `rgba(${RGB.crema},${0.7 * al})`, { alin: "center", esp: 5 });
  }
  // the equation: large under «Esta regla se usó…», then small at the top while the diagram draws
  const aeq = eSuave(pr(t, K.ecuacion - 0.2, 0.8)) * (1 - eSuave(pr(t, K.total - 1.4, 1.4)));
  if (aeq > 0.01) {
    const arriba = eIO(pr(t, B.t0 - 0.6, 1.2));
    const ye = lerp(H * 0.3, H * 0.08, arriba), te = lerp(64, 30, arriba) * KT + 8;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)";
    texto(ctx, "xₙ₊₁ = r · xₙ · (1 − xₙ)", W / 2, ye, te, `rgba(${RGB.crema},${0.35 * aeq})`, { fam: SANS, peso: 300, alin: "center", esp: 4 }); ctx.restore();
    texto(ctx, "xₙ₊₁ = r · xₙ · (1 − xₙ)", W / 2, ye, te, `rgba(${RGB.crema},${0.96 * aeq})`, { fam: SANS, peso: 300, alin: "center", esp: 4 });
    const ap2 = aeq * (1 - arriba);
    if (ap2 > 0.01) {
      texto(ctx, "x · LA POBLACIÓN, COMO FRACCIÓN DE SU MÁXIMO", W / 2, ye + 56, 15 * KT + 4, `rgba(${RGB.crema},${0.75 * ap2 * eSuave(pr(t, V[28] + 2.0, 0.6))})`, { alin: "center", esp: 4 });
      texto(ctx, "r · CUÁN RÁPIDO SE REPRODUCE", W / 2, ye + 86, 15 * KT + 4, `rgba(${AMBAR},${0.85 * ap2 * eSuave(pr(t, V[28] + 5.4, 0.6))})`, { alin: "center", esp: 4 });
    }
  }
  const ab = eSuave(pr(t, B.t0, 1.0)) * (1 - eSuave(pr(t, K.total - 1.4, 1.4)));
  if (ab > 0.01) {
    // how far the diagram has been drawn, in r: order until 3 (with «Con r pequeño…»), doublings until 3,57, chaos until 4
    const rNow = t < B.t30 ? lerp(RA, 3.0, eIO(pr(t, B.t0 + 0.3, B.t30 - B.t0 - 0.3))) : t < B.t357 ? lerp(3.0, 3.57, eIO(pr(t, B.t30, B.t357 - B.t30))) : lerp(3.57, RB, eIO(pr(t, B.t357, B.t4 - B.t357)));
    // the view: the whole diagram, or the miniature copy inside the period-3 window
    const [zi0, zi1, zo0, zo1] = B.zoom;
    const z = eIO(pr(t, zi0, zi1 - zi0)) * (1 - eIO(pr(t, zo0, zo1 - zo0)));
    const vr0 = Math.exp(lerp(Math.log(RA), Math.log(3.841), z)), vr1 = Math.exp(lerp(Math.log(RB), Math.log(3.857), z));
    const vw = Math.exp(lerp(Math.log(1), Math.log(0.12), z)), vx0 = lerp(0, 0.44, z), vx1 = vx0 + vw;
    const bx0 = W * 0.1, bx1 = W * 0.9, by0 = H * 0.16, by1 = H * 0.82;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    if (z < 0.002) {
      const nc = Math.floor(((rNow - RA) / (RB - RA)) * (NC - 1));
      for (let cI = 0; cI <= nc; cI++) {
        const x = lerp(bx0, bx1, cI / (NC - 1)), f2 = cI / NC;
        ctx.fillStyle = `rgba(${Math.round(lerp(255, 245, f2))},${Math.round(lerp(175, 230, f2))},${Math.round(lerp(110, 215, f2))},${0.5 * ab})`;
        for (const v of BIF[cI]) ctx.fillRect(x, lerp(by1, by0, v), 1.6, 1.6);
      }
      if (rNow < RB - 0.001) luz(ctx, lerp(bx0, bx1, (rNow - RA) / (RB - RA)), H * 0.5, 40, ab * 0.6);
    } else {
      // computed live for the current view: more iterations the deeper we look
      const cols = 640, keep = Math.round(lerp(120, 900, z));
      for (let cI = 0; cI < cols; cI++) {
        const r = lerp(vr0, vr1, cI / (cols - 1)), x = lerp(bx0, bx1, cI / (cols - 1)), f2 = (r - RA) / (RB - RA);
        ctx.fillStyle = `rgba(${Math.round(lerp(255, 245, f2))},${Math.round(lerp(175, 230, f2))},${Math.round(lerp(110, 215, f2))},${lerp(0.5, 0.35, z) * ab})`;
        let v = 0.5;
        for (let i = 0; i < 400 + keep; i++) {
          v = r * v * (1 - v);
          if (i >= 400 && v >= vx0 && v <= vx1) ctx.fillRect(x, lerp(by1, by0, (v - vx0) / vw), 1.6, 1.6);
        }
      }
    }
    ctx.restore();
    // the zones, as they are drawn; the copy, as it appears
    const zonas: [number, string][] = [[2.9, "ORDEN"], [3.3, "DUPLICACIONES"], [3.8, "CAOS"]];
    zonas.forEach(([r, s], i) => {
      const ai = ab * (1 - z) * eSuave(pr(rNow, r - 0.02, 0.06));
      texto(ctx, s, lerp(bx0, bx1, (r - RA) / (RB - RA)), by1 + 44, 18 * KT + 6, `rgba(${i === 2 ? AMBAR : RGB.crema},${0.9 * ai})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
    });
    texto(ctx, "r →", bx1, by1 + 84, 15 * KT + 4, `rgba(${RGB.crema},${0.6 * ab * (1 - z)})`, { alin: "right", esp: 3 });
    const ac = ab * eSuave(pr(z, 0.85, 0.15));
    if (ac > 0.01) {
      texto(ctx, "UNA COPIA EN MINIATURA DEL DIAGRAMA", W / 2, by1 + 44, 20 * KT + 6, `rgba(${AMBAR},${0.95 * ac})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
      texto(ctx, "DENTRO DEL CAOS · r ENTRE 3,841 Y 3,857 · AMPLIADO ×75", W / 2, by1 + 76, 13 * KT + 4, `rgba(${RGB.crema},${0.7 * ac})`, { alin: "center", esp: 4 });
    }
    nota(ctx, "CÁLCULO PROPIO · ECUACIÓN LOGÍSTICA", ab * (1 - z));
  }
};

export const dibujarCap5 = (ctx: Ctx, t: number, frame: number, fotos: Fotos) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  titulo(ctx, t);
  puente(ctx, t, fotos);
  linea(ctx, t);
  dia(ctx, t);
  zoom(ctx, t);
  dfa(ctx, t, fotos);
  nubes(ctx, t, fotos);
  cierre(ctx, t, fotos);
  const fin = eSuave(pr(t, K.total - 1.2, 1.2)), ini = 1 - eSuave(pr(t, 0, 0.6));
  if (fin + ini > 0) { ctx.fillStyle = `rgba(2,3,6,${Math.min(1, fin + ini)})`; ctx.fillRect(0, 0, W, H); }
  let golpe = 0;
  for (const g of [K.titulo, ...TL.slice(K.pk, K.pk + 5), ...(K.montaje as number[]), ...(K.calma as number[]).filter((x) => x < K.logistica)]) if (t >= g && t - g < 1.5) golpe = Math.max(golpe, 0.9 * Math.exp(-(t - g) * 3));
  for (const g of K.zoomLat as number[]) if (t >= g && t - g < 1.0) golpe = Math.max(golpe, 0.35 * Math.exp(-(t - g) * 4));
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.92, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: golpe * 0.4, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
