// CAPÍTULO II · «Entre la nada y el algo» (fractales/GUION-capitulo-2-el-mapa.md, v5). First part: the title (a
// segment that loses its middle thirds), a copy and its opposite (Koch beside Mandelbrot), a dive of ×10⁸ into the
// seahorse valley down to another copy of the set, a cloud, the Julia sets as c moves, one piece or dust, the theorem
// of Fatou and Julia (follow 0), the map painted, a mosaic of worlds on it, the map explored bulb by bulb, Tan Lei's
// theorem (at the border, map and world look alike), and the title's meaning: inside something, outside almost
// nothing, the border between them. Every figure is computed; the camera only zooms and slides.
import K from "./cap2.json";
import { LIMPIO as SIN_TEXTO_TRAILER } from "./limpio";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS } from "./fractalTeaser";
import { escapeRef, pintarProfundo } from "./profundo";
import REF998 from "./ref998.json";
import REFMIS from "./refMis.json";
import { RGB, SANS, MONO, cl, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
type P = [number, number];
const AZUL = "150,190,255", AMBAR = "255,190,120";
const KT = Math.min(1, W / 1500);
const LIMPIO = (FORMATO as { limpio?: boolean }).limpio === true;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: LIMPIO ? 0 : 0.05, scan: LIMPIO ? 0 : 0.18, ruido: LIMPIO ? 0 : 0.5, grade: 1.8 };
const V = K.voz;

// ─── helpers (as in chapter 1) ──────────────────────────────────────────────────────────────────────────────────
const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  if (SIN_TEXTO_TRAILER && color !== "#fff") return;
  ctx.font = `${op.peso ?? 500} ${tam}px "${op.fam ?? MONO}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 3}px`;
  ctx.fillStyle = color; ctx.textAlign = op.alin ?? "left";
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};
const ventana = (t: number, a: number, b: number, d = 0.6) => Math.min(eSuave(pr(t, a, d)), 1 - eSuave(pr(t, b - d, d)));
const luz = (ctx: Ctx, x: number, y: number, r: number, a: number, col = AZUL) => {
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
  for (const [lw, o] of [[w * 7, 0.06], [w * 2.6, 0.18]] as const) { ctx.strokeStyle = `rgba(${col},${o * a})`; ctx.lineWidth = lw; camino(); ctx.stroke(); }
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(${col},${0.95 * a})`; ctx.lineWidth = w; camino(); ctx.stroke();
  ctx.restore();
};
const banda = (ctx: Ctx, a: number) => {
  const g = ctx.createLinearGradient(0, H * 0.72, 0, H);
  g.addColorStop(0, "rgba(2,3,6,0)"); g.addColorStop(1, `rgba(2,3,6,${0.7 * a})`);
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.72, W, H * 0.28);
};
const rotulo = (ctx: Ctx, nombre: string, linea: string, a: number, x = 84, y = H - 128, alin: CanvasTextAlign = "left") => {
  if (a <= 0.01) return;
  texto(ctx, nombre, x, y, 26 * KT + 6, `rgba(${RGB.crema},${0.92 * a})`, { fam: SANS, peso: 600, esp: 3, alin });
  if (linea) texto(ctx, linea, x, y + 36, 16 * KT + 4, `rgba(${AMBAR},${0.8 * a})`, { esp: 5, alin });
};
const miles = (k: number) => Math.round(k).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const aum = (ctx: Ctx, k: number, a: number, x: number, alin: CanvasTextAlign = "right") => {
  if (a <= 0.01) return;
  texto(ctx, "AUMENTO", x, 96, 16 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { esp: 6, alin });
  texto(ctx, `× ${miles(k)}`, x, 142, 44 * KT + 6, `rgba(${AMBAR},${0.9 * a})`, { fam: SANS, peso: 600, esp: 2, alin });
};
// the key terms, large at the top (an infographic layer)
const terminos = (ctx: Ctx, t: number) => {
  for (const [term, linea, t0, t1] of K.terminos as [string, string, number, number][]) {
    const a = ventana(t, t0, t1, 0.5);
    if (a <= 0.01) continue;
    const bd = ctx.createLinearGradient(0, 0, 0, H * 0.32);
    bd.addColorStop(0, `rgba(2,3,6,${0.85 * a})`); bd.addColorStop(0.7, `rgba(2,3,6,${0.55 * a})`); bd.addColorStop(1, "rgba(2,3,6,0)");
    ctx.fillStyle = bd; ctx.fillRect(0, 0, W, H * 0.32);
    const tam = (term.length > 22 ? 44 : term.length > 14 ? 54 : 80) * KT + 8, esp = lerp(36, term.length > 14 ? 10 : 22, eOut(pr(t, t0, 1.2)));
    const y = H * 0.155;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(14px)";
    texto(ctx, term, W / 2 + esp / 2, y, tam, `rgba(${RGB.crema},${0.4 * a})`, { fam: SANS, peso: 600, alin: "center", esp });
    ctx.restore();
    texto(ctx, term, W / 2 + esp / 2, y, tam, `rgba(${RGB.crema},${0.97 * a})`, { fam: SANS, peso: 600, alin: "center", esp });
    const L = eOut(pr(t, t0 + 0.2, 0.9)) * W * 0.22;
    ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.85 * a})`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(W / 2 - L, y + 30); ctx.lineTo(W / 2 + L, y + 30); ctx.stroke(); ctx.restore();
    if (linea) texto(ctx, linea, W / 2 + 3, y + 66, 18 * KT + 4, `rgba(${AMBAR},${0.85 * a * eSuave(pr(t, t0 + 0.6, 0.6))})`, { alin: "center", esp: 6 });
  }
};
// a fractal view painted into a rectangle (deep-zoom renderer): Mandelbrot (julia undefined) or Julia of c
type Vista = { cx: number; cy: number; ancho: number; julia?: [number, number]; pal?: number; maxIt?: number; interior?: number; borde?: number; ref?: { clave: string; orbita: number[] }; off?: [number, number]; base?: number; anillos?: number; divA?: number; soloBorde?: number };
const iters = (ancho: number) => Math.round(300 + 260 * Math.log10(Math.max(1, 3.2 / ancho)));
const pinta = (ctx: Ctx, x: number, y: number, w: number, h: number, v: Vista, t: number, alfa = 1) => {
  if (alfa <= 0.01) return;
  const l = pintarProfundo(Math.round(w), Math.round(h), { cx: v.cx, cy: v.cy, ancho: v.ancho, julia: v.julia, fase: 0.04 * t, paleta: PALETAS[v.pal ?? 0], brillo: 0.9, maxIt: v.maxIt ?? iters(v.ancho), tiempo: 0.4 * t, interior: v.interior ?? 1, borde: v.borde ?? 1, ref: v.ref, off: v.off, base: v.base, anillos: v.anillos, divA: v.divA, soloBorde: v.soloBorde });
  ctx.save(); ctx.globalAlpha = alfa; ctx.imageSmoothingQuality = "high"; ctx.drawImage(l, x, y, w, h); ctx.restore();
};
// plane → screen, for a view painted at (x0, 0) with width w and height H
const aPant = (v: Vista, x0: number, w: number, p: P): P => [x0 + w / 2 + (p[0] - v.cx) * (w / v.ancho), H / 2 - (p[1] - v.cy) * (w / v.ancho)];
const fmtC = (c: P) => `c = ${c[0].toFixed(3).replace(".", ",")} ${c[1] < 0 ? "−" : "+"} ${Math.abs(c[1]).toFixed(3).replace(".", ",")} i`;
const divisor = (ctx: Ctx, a: number) => {
  ctx.save(); ctx.fillStyle = `rgba(2,3,6,${a})`; ctx.fillRect(W / 2 - 2, 0, 4, H); ctx.strokeStyle = `rgba(${RGB.crema},${0.35 * a})`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.restore();
};

// ─── 1 · title: a segment loses its middle thirds, beat by beat, until it is dust ───────────────────────────────
const cantorTramos = (n: number, u: number): [number, number][] => {
  let tr: [number, number][] = [[0, 1]];
  for (let k = 0; k < n; k++) tr = tr.flatMap(([a, b]) => { const d = (b - a) / 3; return [[a, a + d], [b - d, b]] as [number, number][]; });
  if (u > 0) tr = tr.flatMap(([a, b]) => { const d = (b - a) / 3, m = (a + b) / 2, g = (d / 2) * u; return [[a, m - g], [m + g, b]] as [number, number][]; });
  return tr;
};
const titulo = (ctx: Ctx, t: number) => {
  if (t > K.split + 0.5) return;
  const a = 1 - eSuave(pr(t, K.split - 1.2, 1.0));
  if (t < K.segmento[0]) return;
  const x0 = W * 0.16, x1 = W * 0.84, y = H * 0.62;
  const L = eOut(pr(t, K.segmento[0], K.segmento[1] - K.segmento[0]));
  let n = 0;
  for (const g of K.cantor) if (t >= g) n++;
  const u = n > 0 ? eIO(cl((t - K.cantor[n - 1]) / 0.35)) : 0;
  const tr = cantorTramos(Math.max(0, n - 1), n > 0 ? u : 0);
  for (const [p, q] of tr) {
    const xa = lerp(x0, x1, p), xb = lerp(x0, x1, Math.min(q, L));
    if (xa > lerp(x0, x1, L)) continue;
    if (xb - xa < 2) luz(ctx, (xa + xb) / 2, y, 5 * KT + 2, 0.55 * a, AMBAR);
    else trazo(ctx, [[xa, y], [xb, y]], RGB.crema, a, 2.4);
  }
  const ut = t - K.titulo;
  if (ut < 0) return;
  const at = eSuave(pr(ut, 0, 0.5)) * a;
  const tam = 96 * KT, esp = lerp(48, 26, eOut(pr(ut, 0, 4)));
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(14px)";
  texto(ctx, "ENTRE LA NADA Y EL ALGO", W / 2 + esp / 2, H * 0.44, tam, `rgba(${RGB.crema},${0.35 * at})`, { fam: SANS, peso: 300, alin: "center", esp });
  ctx.restore();
  texto(ctx, "ENTRE LA NADA Y EL ALGO", W / 2 + esp / 2, H * 0.44, tam, `rgba(${RGB.crema},${0.96 * at})`, { fam: SANS, peso: 300, alin: "center", esp });
  texto(ctx, "CAPÍTULO II", W / 2 + 8, H * 0.44 - tam * 1.15, 24 * KT + 6, `rgba(${AMBAR},${0.9 * at * eSuave(pr(ut, 0.35, 0.8))})`, { alin: "center", esp: 16 });
  texto(ctx, "LO QUE NO SE REPITE, LO QUE CASI NO ES, LO QUE NO TERMINA", W / 2 + 4, H * 0.75, 18 * KT + 4, `rgba(${RGB.crema},${0.7 * at * eSuave(pr(ut, 1.6, 1.0))})`, { alin: "center", esp: 6 });
};

// ─── 2 · a copy, and its opposite: Koch (left) and Mandelbrot (right), the same magnification, to ×3⁷ ────────────
const kochSeg = (p: P, q: P, map: (w: P) => P, xmin: number, xmax: number): P[][] => {
  const runs: P[][] = [];
  let actual: P[] | null = null;
  const va = (p: P, q: P, n: number) => {
    const A = map(p), B = map(q), r = Math.hypot(B[0] - A[0], B[1] - A[1]) * 0.6 + 4;
    if (Math.max(A[0], B[0]) < xmin - r || Math.min(A[0], B[0]) > xmax + r || Math.max(A[1], B[1]) < -r || Math.min(A[1], B[1]) > H + r) { actual = null; return; }
    if (n >= 16 || Math.hypot(B[0] - A[0], B[1] - A[1]) < 2.5) {
      if (!actual) { actual = [A]; runs.push(actual); }
      actual.push(B);
      return;
    }
    const dx = (q[0] - p[0]) / 3, dy = (q[1] - p[1]) / 3;
    const a: P = [p[0] + dx, p[1] + dy], b: P = [p[0] + 2 * dx, p[1] + 2 * dy];
    const m: P = [(a[0] + b[0]) / 2 + (dy * Math.sqrt(3)) / 2, (a[1] + b[1]) / 2 - (dx * Math.sqrt(3)) / 2];
    va(p, a, n + 1); va(a, m, n + 1); va(m, b, n + 1); va(b, q, n + 1);
  };
  va(p, q, 0);
  return runs;
};
const P3: P = [-1.7548776662466927, 0];       // the period-3 copy of the set on the real axis
const P9: P = [-1.7858656464106737, 0];       // and the period-9 copy, on that copy's own antenna
const dividido = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.split, K.splitFin + 0.6, 0.8);
  if (a <= 0.01) return;
  const u = eIO(pr(t, K.split + 1.5, K.splitFin - K.split - 2.1)), L3 = 7 * u, zz = Math.pow(3, L3);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
  const S = W * 0.4 * zz, ancla: P = [W * 0.05, H * 0.66];
  for (const r of kochSeg([0, 0], [1, 0], ([x, y]) => [ancla[0] + x * S, ancla[1] + y * S], 0, W / 2)) trazo(ctx, r, RGB.crema, a, 2);
  ctx.restore();
  // right: the camera passes the period-3 copy (×27) and goes on to the copy on its antenna (×2187)
  const cx = L3 < 3 ? lerp(-0.6, P3[0], eSuave(L3 / 3)) : lerp(P3[0], P9[0], eSuave(cl((L3 - 3) / 3)));
  pinta(ctx, W / 2, 0, W / 2, H, { cx, cy: 0, ancho: 3.2 / zz }, t, a);
  divisor(ctx, a);
  banda(ctx, a);
  rotulo(ctx, "CURVA DE KOCH", "CADA AUMENTO: LA MISMA FORMA", a, 60, H - 110);
  rotulo(ctx, "CONJUNTO DE MANDELBROT", "COPIAS PEQUEÑAS, CON OTRO ENTORNO", a, W / 2 + 60, H - 110);
  aum(ctx, zz, a * eSuave(pr(t, K.split + 1.5, 0.5)), W - 60);
};

// the colour base of a deep zoom about a reference: the lowest escape count on the view's edge, sampled once along
// the whole zoom, made non-decreasing and smoothed, so the colours never jump from one frame to the next
const tablaBase = (orb: number[], abierta: boolean, dref: P, w0: number, lzMax: number, itDe: (z: number) => number) => {
  const n = 240, crudo: number[] = [];
  for (let i = 0; i <= n; i++) {
    const z = Math.exp((lzMax * i) / n), w = w0 / z, off: P = [dref[0] / z, dref[1] / z], it = itDe(z);
    let b = it;
    for (const [a, c] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) b = Math.min(b, escapeRef(orb, [off[0] + (a * w) / 2, off[1] + (c * w * H) / (2 * W)], it, abierta));
    crudo.push(b >= it ? (crudo.length ? crudo[crudo.length - 1] : 0) : b);
  }
  for (let i = 1; i <= n; i++) crudo[i] = Math.max(crudo[i], crudo[i - 1]);
  const suave = crudo.map((_, i) => { let s2 = 0, k = 0; for (let j = Math.max(0, i - 12); j <= Math.min(n, i + 12); j++) { s2 += crudo[j]; k++; } return s2 / k; });
  return (lz: number) => { const x = cl(lz / lzMax) * n, i = Math.min(n - 1, Math.floor(x)); return Math.max(0, lerp(suave[i], suave[i + 1], x - i) - 4); };
};

// ─── the dive: ×10¹⁵ into the seahorse valley, down to an isolated copy of the set, of period 998 ─────────────────
// Its nucleus and orbit were computed with 60 digits (src/ref998.json); the camera centre is kept relative to it.
const C0: P = [-0.6, 0];
const MINI: P = [Number(REF998.c[0]), Number(REF998.c[1])];
const DREF: P = [C0[0] - MINI[0], C0[1] - MINI[1]];
const RREF = { clave: "mini998", orbita: REF998.orbita };
const W0 = 3.2, W1 = 2.6e-15;
const itBuceo = (z: number) => Math.round(800 + 5000 * Math.log10(z));
let BASE_B: ((lz: number) => number) | null = null;
const buceo = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.buceo[0] - 0.2, K.nube + 0.6, 0.6);
  if (a <= 0.01) return;
  const u = eSuave(pr(t, K.buceo[0], K.buceo[1] - K.buceo[0]));
  // after arriving, the camera keeps closing in, very slowly
  const lw = lerp(Math.log(W0), Math.log(W1), u) - 0.25 * pr(t, K.buceo[1], K.nube - K.buceo[1]);
  const w = Math.exp(lw), f = w / W0, z = W0 / w;
  // a zoom about the copy: it keeps its place on screen while everything around it grows
  const off: P = [DREF[0] * f, DREF[1] * f], maxIt = itBuceo(z);
  BASE_B = BASE_B ?? tablaBase(RREF.orbita, false, DREF, W0, Math.log(W0 / W1) + 0.3, itBuceo);
  pinta(ctx, 0, 0, W, H, { cx: MINI[0] + off[0], cy: MINI[1] + off[1], ancho: w, ref: RREF, off, maxIt, interior: 0.3, borde: 0.45, base: BASE_B(Math.log(z)) }, t, a);
  banda(ctx, a);
  const lugares: [string, string, number, number][] = [
    ["VALLE DE LOS CABALLITOS DE MAR", "ENTRE EL CUERPO Y EL PRIMER BULBO", 30, 3000],
    ["ESPIRALES DENTRO DE ESPIRALES", "NINGUNA ES COPIA DE LA ANTERIOR", 1e4, 1e9],
    ["BILLONES DE AUMENTOS", "Y EL BORDE SIGUE SIN REPETIRSE", 1e12, 4e14],
    ["UNA COPIA DEL CONJUNTO", "CON UN PAISAJE QUE NO SE PARECE A NADA DE LO ANTERIOR", 6e14, 1e20],
  ];
  for (const [n, l, z0, z1] of lugares) rotulo(ctx, n, l, a * Math.min(eSuave(cl(Math.log(z / z0) / 1.2)), 1 - eSuave(cl(Math.log(z / z1) / 1.2))));
  aum(ctx, z, a, W - 84);
};

// ─── the cloud: what stays when you come closer is its roughness; the shape changes ─────────────────────────────
const nubeEscena = (ctx: Ctx, t: number, foto: HTMLImageElement | null) => {
  const a = ventana(t, K.nube, K.nubeFin + 0.4, 0.8);
  if (a <= 0.01 || !foto) return;
  const u = eIO(pr(t, V[6] + 1.0, K.nubeFin - V[6] - 1.6));
  const z = Math.exp(Math.log(4) * u), s = Math.max(W / foto.width, H / foto.height) * z;
  const fx = lerp(0.5, 0.62, u), fy = lerp(0.5, 0.42, u);
  ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(foto, W / 2 - fx * foto.width * s, H / 2 - fy * foto.height * s, foto.width * s, foto.height * s);
  ctx.restore();
  banda(ctx, a);
  rotulo(ctx, "CÚMULOS", "AL ACERCARSE, OTRA FORMA, LA MISMA RUGOSIDAD", a * eSuave(pr(t, K.nube + 0.8, 0.6)));
  aum(ctx, z, a * eSuave(pr(u, 0.02, 0.06)), W - 84);
};

// ─── 3 · a constant, a world: the Julia set as c moves ──────────────────────────────────────────────────────────
const CONEJO: P = [-0.123, 0.745];
const PARADAS: { c: P; nombre: string }[] = [
  { c: CONEJO, nombre: "EL CONEJO DE DOUADY" },
  { c: [0, 0], nombre: "EL CÍRCULO" },
  { c: [-1, 0], nombre: "LA BASÍLICA" },
  { c: [0, 1], nombre: "LA DENDRITA" },
  { c: [-0.390541, -0.586788], nombre: "DISCO DE SIEGEL" },
  { c: [-1.7549, 0], nombre: "EL AVIÓN" },
];
// far enough from the set that the dust is visibly dust (0 escapes after 7 steps)
const POLVO: P = [-0.7, 0.5];
const FIJO: P = [1.5058691584, -0.2485412719];  // repelling fixed point of z² + POLVO, multiplier |2z| ≈ 3,05
const cDe = (t: number): P => {
  const T = K.paradas;
  if (t <= T[0]) return PARADAS[0].c;
  for (let i = 0; i < T.length - 1; i++) {
    if (t < T[i + 1]) {
      const u = eIO(cl((t - T[i] - 1.4) / 1.1));
      return [lerp(PARADAS[i].c[0], PARADAS[i + 1].c[0], u), lerp(PARADAS[i].c[1], PARADAS[i + 1].c[1], u)];
    }
  }
  const u = eIO(cl((t - K.polvo + 0.6) / 1.4)), last = PARADAS[PARADAS.length - 1].c;
  return [lerp(last[0], POLVO[0], u), lerp(last[1], POLVO[1], u)];
};
// a small plane with the constant's point, top right
const recuadroC = (ctx: Ctx, c: P, a: number, x0 = W - 300, y0 = 70) => {
  const s = 70;
  ctx.save(); ctx.fillStyle = `rgba(2,3,6,${0.7 * a})`; ctx.fillRect(x0 - 20, y0 - 20, 280, 220);
  ctx.strokeStyle = `rgba(${RGB.crema},${0.35 * a})`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, y0 + 90); ctx.lineTo(x0 + 240, y0 + 90); ctx.moveTo(x0 + 150, y0); ctx.lineTo(x0 + 150, y0 + 180); ctx.stroke(); ctx.restore();
  luz(ctx, x0 + 150 + c[0] * s, y0 + 90 - c[1] * s, 16, a, AMBAR);
  texto(ctx, fmtC(c), x0 + 120, y0 + 186, 16 * KT + 4, `rgba(${AMBAR},${0.9 * a})`, { alin: "center", esp: 1 });
};
const juliaEscena = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.julia, K.lados + 0.6, 0.8);
  if (a <= 0.01) return;
  const c = cDe(t);
  // the dust: the camera closes in on its repelling fixed point, where it breaks the same way at every step
  const uz = eIO(pr(t, K.polvo + 1.6, K.lados - K.polvo - 2.0)), zz = Math.pow(3.0525, 4 * uz);
  pinta(ctx, 0, 0, W, H, { cx: lerp(0, FIJO[0], 1 - 1 / zz), cy: lerp(0, FIJO[1], 1 - 1 / zz), ancho: 3.6 / zz, julia: c, pal: 2, maxIt: 500 }, t, a);
  banda(ctx, a);
  recuadroC(ctx, c, a);
  PARADAS.forEach((p, i) => rotulo(ctx, p.nombre, "", a * ventana(t, K.paradas[i] - 0.2, K.paradas[i] + 1.6, 0.4)));
  rotulo(ctx, "POLVO", "ISLAS QUE SE PARTEN EN MÁS ISLAS", a * ventana(t, K.polvo + 0.4, K.lados, 0.5));
  if (zz > 1.05) aum(ctx, zz, a, W - 340);
};

// ─── one piece or dust, and the orbit of 0 that decides it (Fatou, Julia) ───────────────────────────────────────
const VJ = { cx: 0, cy: 0, ancho: 3.3 };
const orbita0 = (c: P, n: number): P[] => {
  const out: P[] = [[0, 0]];
  let [x, y] = [0, 0];
  for (let k = 0; k < n; k++) { const nx = x * x - y * y + c[0]; y = 2 * x * y + c[1]; x = nx; out.push([x, y]); if (x * x + y * y > 1e4) break; }
  return out;
};
// the orbit drawn one jump at a time; the lines fade, the points stay a while
const dibujaOrbita = (ctx: Ctx, orb: P[], x0: number, t: number, t0: number, paso: number, col: string, a: number) => {
  const k = (t - t0) / paso;
  if (k < 0 || a <= 0.01) return;
  for (let i = 0; i < orb.length && i <= k + 1; i++) {
    const p = aPant(VJ, x0, W / 2, orb[i]), e = k - i + 1;
    if (e < 0) continue;
    if (i > 0) {
      const q = aPant(VJ, x0, W / 2, orb[i - 1]), u = eOut(cl(e / 0.7));
      trazo(ctx, [q, [lerp(q[0], p[0], u), lerp(q[1], p[1], u)]], col, a * 0.8 * Math.exp(-Math.max(0, e - 1) * 0.5), 1.6);
    }
    if (e > 0.7 || i === 0) luz(ctx, p[0], p[1], 14 * KT + 6, a * (0.4 + 0.6 * Math.exp(-Math.max(0, e - 0.7) * 0.25)), col);
  }
};
const lados = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.lados - 0.2, K.mapa + 0.4, 0.8);
  if (a <= 0.01) return;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
  pinta(ctx, 0, 0, W / 2, H, { ...VJ, julia: CONEJO, pal: 2, maxIt: 500 }, t, a);
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
  const ud = Math.min(eIO(pr(t, V[10] + 4.4, 2.6)), 1 - eIO(pr(t, K.orbitas - 2.6, 2.2))), zd = Math.pow(3.0525, 2.2 * ud);
  pinta(ctx, W / 2, 0, W / 2, H, { cx: lerp(0, FIJO[0], 1 - 1 / zd), cy: lerp(0, FIJO[1], 1 - 1 / zd), ancho: VJ.ancho / zd, julia: POLVO, pal: 2, maxIt: 500, borde: 0.6 }, t, a);
  ctx.restore();
  // while the orbits play, the worlds step back a little
  const ao = ventana(t, K.orbitas, K.mapa + 0.4, 0.6);
  if (ao > 0.01) { ctx.fillStyle = `rgba(2,3,6,${0.45 * ao})`; ctx.fillRect(0, 0, W, H); }
  divisor(ctx, a);
  banda(ctx, a);
  rotulo(ctx, "ALGO", "UN MUNDO DE UNA SOLA PIEZA", a * eSuave(pr(t, V[10] + 0.4, 0.6)), 60, H - 110);
  rotulo(ctx, "CASI NADA", ud > 0.5 ? "NINGÚN PEDAZO TOCA A OTRO" : "UN POLVO DE PUNTOS SUELTOS", a * eSuave(pr(t, V[10] + 4.6, 0.6)) * (ud > 0.3 && ud < 0.7 ? Math.abs(ud - 0.5) / 0.2 : 1), W / 2 + 60, H - 110);
  if (ud > 0.05) aum(ctx, zd, a * ud, W - 60);
  // 0 lights up on both sides; then its orbit, inside (it stays) and outside (it escapes)
  for (const x0 of [0, W / 2]) {
    const p = aPant(VJ, x0, W / 2, [0, 0]), e = t - K.orbitas;
    if (e > 0) luz(ctx, p[0], p[1], (20 + 60 * Math.exp(-e * 2)) * KT, a * 0.9, AMBAR);
    if (e > 0) texto(ctx, "0", p[0] + 16, p[1] - 14, 22 * KT + 6, `rgba(${AMBAR},${0.9 * a * eSuave(cl(e / 0.5))})`, { fam: SANS, peso: 600 });
  }
  dibujaOrbita(ctx, orbita0(CONEJO, 40), 0, t, K.quedan, 0.32, AZUL, a);
  dibujaOrbita(ctx, orbita0(POLVO, 40), W / 2, t, K.escapa - 1.2, 0.3, AMBAR, a);
  rotulo(ctx, "LA ÓRBITA DEL 0 SE QUEDA CERCA", "", a * ventana(t, K.quedan + 1.0, K.mapa, 0.5), 60, H - 210);
  rotulo(ctx, "LA ÓRBITA DEL 0 ESCAPA", "", a * ventana(t, K.escapa + 0.6, K.mapa, 0.5), W / 2 + 60, H - 210);
};

// ─── Fatou and Julia: their portraits while they are named ──────────────────────────────────────────────────────
const retrato = (ctx: Ctx, img: HTMLImageElement | undefined, x: number, a: number, nombre: string, anos: string) => {
  if (!img || a <= 0.01) return;
  const h = H * 0.5, w = (h * img.width) / img.height, y = H * 0.2;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(2,3,6,0.85)"; ctx.fillRect(x - w / 2 - 14, y - 14, w + 28, h + 28);
  ctx.filter = "sepia(0.35) contrast(1.05) brightness(0.95)";
  ctx.drawImage(img, x - w / 2, y, w, h);
  ctx.filter = "none";
  ctx.strokeStyle = `rgba(${RGB.crema},0.35)`; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2 - 14, y - 14, w + 28, h + 28);
  ctx.restore();
  texto(ctx, nombre, x, y + h + 62, 26 * KT + 6, `rgba(${RGB.crema},${0.92 * a})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
  texto(ctx, anos, x, y + h + 98, 16 * KT + 4, `rgba(${AMBAR},${0.85 * a})`, { alin: "center", esp: 5 });
};
const retratos = (ctx: Ctx, t: number, fotos: Record<string, HTMLImageElement>) => {
  const fin = K.orbitas - 0.3;
  const a1 = ventana(t, K.fatou - 0.3, fin, 0.6), a2 = ventana(t, K.juliaNombre - 0.3, fin, 0.6);
  if (a1 <= 0.01 && a2 <= 0.01) return;
  ctx.fillStyle = `rgba(2,3,6,${0.6 * Math.max(a1, a2)})`; ctx.fillRect(0, 0, W, H);
  retrato(ctx, fotos.fatou, W * 0.36, a1, "PIERRE FATOU", "1878 – 1929");
  retrato(ctx, fotos.julia, W * 0.64, a2, "GASTON JULIA", "1893 – 1978");
};

// ─── the map: every constant painted by the fate of its 0 ───────────────────────────────────────────────────────
const VM = { cx: -0.65, cy: 0, ancho: 4.6 };
const MUESTRA = (() => {
  const out: { c: P; dentro: boolean; orden: number }[] = [];
  let sem = 7;
  const azar = () => { sem = (Math.imul(sem, 1103515245) + 12345) | 0; return ((sem >>> 16) & 0x7fff) / 32768; };
  for (let i = 0; i < 34; i++) for (let j = 0; j < 19; j++) {
    const c: P = [VM.cx - VM.ancho / 2 + (VM.ancho * (i + 0.5)) / 34, ((j + 0.5) / 19 - 0.5) * VM.ancho * (H / W)];
    let x = 0, y = 0, n = 0;
    for (; n < 300 && x * x + y * y <= 4; n++) { const nx = x * x - y * y + c[0]; y = 2 * x * y + c[1]; x = nx; }
    out.push({ c, dentro: n >= 300, orden: azar() });
  }
  return out;
})();
// the mosaic: a small Julia set drawn at the place of its constant (made once)
let MOSAICO: HTMLCanvasElement | null = null;
const mosaicoLienzo = () => {
  if (MOSAICO) return MOSAICO;
  MOSAICO = document.createElement("canvas"); MOSAICO.width = W; MOSAICO.height = H;
  const m = MOSAICO.getContext("2d")!;
  const nx = 15, paso = W / nx, ny = Math.ceil(H / paso), lado = Math.round(paso * 0.9);
  const celda = document.createElement("canvas"); celda.width = celda.height = lado;
  const cc = celda.getContext("2d")!;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const x = (i + 0.5) * paso, y = H / 2 + (j - (ny - 1) / 2) * paso;
    const c: P = [VM.cx + (x - W / 2) * (VM.ancho / W), VM.cy - (y - H / 2) * (VM.ancho / W)];
    let zx = 0, zy = 0, n = 0;
    for (; n < 300 && zx * zx + zy * zy <= 4; n++) { const t2 = zx * zx - zy * zy + c[0]; zy = 2 * zx * zy + c[1]; zx = t2; }
    const l = pintarProfundo(lado, lado, { cx: 0, cy: 0, ancho: 3.4, julia: c, fase: 0, paleta: PALETAS[2], brillo: 0.9, maxIt: 250, interior: 3 });
    cc.globalCompositeOperation = "copy"; cc.drawImage(l, 0, 0);
    cc.globalCompositeOperation = "destination-in";
    const g = cc.createRadialGradient(lado / 2, lado / 2, lado * 0.2, lado / 2, lado / 2, lado / 2);
    g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
    cc.fillStyle = g; cc.fillRect(0, 0, lado, lado);
    m.globalAlpha = n >= 300 ? 1 : 0.45;
    m.drawImage(celda, x - lado / 2, y - lado / 2);
  }
  m.globalAlpha = 1;
  return MOSAICO;
};
const mapa = (ctx: Ctx, t: number) => {
  if (t < K.mapa - 0.4 || t > K.explora + 1.0) return;
  const a = eSuave(pr(t, K.mapa - 0.4, 0.8)) * (1 - eSuave(pr(t, K.explora - 0.4, 1.0)));
  const vacio = 1 - eSuave(pr(t, K.barrido[0], 2.0));
  if (vacio > 0.01) {
    ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.07 * a * vacio})`; ctx.lineWidth = 1;
    for (let k = -8; k <= 8; k++) { const p = aPant(VM, 0, W, [k / 2, k / 2]); ctx.beginPath(); ctx.moveTo(p[0], 0); ctx.lineTo(p[0], H); ctx.moveTo(0, p[1]); ctx.lineTo(W, p[1]); ctx.stroke(); }
    const o = aPant(VM, 0, W, [0, 0]);
    ctx.strokeStyle = `rgba(${RGB.crema},${0.3 * a * vacio})`; ctx.beginPath(); ctx.moveTo(0, o[1]); ctx.lineTo(W, o[1]); ctx.moveTo(o[0], 0); ctx.lineTo(o[0], H); ctx.stroke();
    ctx.restore();
  }
  // the sweep: row by row, under a line of light
  if (t >= K.barrido[0]) {
    const y = H * eIO(pr(t, K.barrido[0], K.barrido[1] - K.barrido[0]));
    const am = 1 - 0.75 * ventana(t, K.mosaico, K.explora + 1, 1.0);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, y); ctx.clip(); pinta(ctx, 0, 0, W, H, { ...VM, maxIt: 600 }, t, a * am); ctx.restore();
    if (y < H - 1) {
      const g = ctx.createLinearGradient(0, y - 40, 0, y + 6);
      g.addColorStop(0, `rgba(${AMBAR},0)`); g.addColorStop(0.85, `rgba(${AMBAR},0.55)`); g.addColorStop(1, `rgba(255,250,235,0.95)`);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(0, y - 40, W, 46); ctx.restore();
    }
  }
  // first a sample of constants, each painted by the fate of its 0
  const am = a * (1 - eSuave(pr(t, K.barrido[0] + 1.0, 1.4)));
  const u = pr(t, V[14] + 0.6, K.barrido[0] - V[14] - 0.4);
  if (am > 0.01 && u > 0) for (const q of MUESTRA) {
    const tq = Math.pow(q.orden, 0.7);
    if (u < tq) continue;
    const p = aPant(VM, 0, W, q.c);
    ctx.save(); ctx.fillStyle = `rgba(${q.dentro ? AZUL : AMBAR},${(q.dentro ? 0.9 : 0.6) * am * eSuave(cl((u - tq) * 12))})`;
    ctx.beginPath(); ctx.arc(p[0], p[1], 9 * KT + 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  if (am > 0.01) {
    texto(ctx, "● EL 0 SE QUEDA CERCA", 84, H - 120, 16 * KT + 4, `rgba(${AZUL},${0.9 * am * eSuave(u * 4)})`, { esp: 4 });
    texto(ctx, "● EL 0 ESCAPA", 84, H - 86, 16 * KT + 4, `rgba(${AMBAR},${0.9 * am * eSuave(u * 4)})`, { esp: 4 });
  }
  // the mosaic: on every constant, its world
  const amo = ventana(t, K.mosaico, K.explora + 0.4, 1.4);
  if (amo > 0.01) { ctx.save(); ctx.globalAlpha = amo; ctx.globalCompositeOperation = "lighter"; ctx.drawImage(mosaicoLienzo(), 0, 0); ctx.restore(); }
  rotulo(ctx, "CADA PUNTO, UNA CONSTANTE", "Y SOBRE CADA CONSTANTE, SU MUNDO", amo * eSuave(pr(t, V[16] + 1.0, 0.6)));
};

// ─── the map, explored: a cursor on the map (left), its world (right) ───────────────────────────────────────────
const MIS13: P = [-0.10109636384562216, 0.9562865108091415];   // where the three arms of the rabbit's bulb meet
const P5: P = [0.3795135880159237, 0.3349323055974976];        // the centre of the bulb of period 5
const VE = { cx: -0.55, cy: 0.05, ancho: 3.1 };
const TOUR: { t: number; c: P; nombre: string; linea: string }[] = [
  { t: V[17] - 0.8, c: [-0.18, 0.22], nombre: "CUERPO PRINCIPAL", linea: "UN CÍRCULO DEFORMADO" },
  { t: V[18] - 0.8, c: [-1.02, 0.06], nombre: "BULBO DE PERÍODO 2", linea: "LA BASÍLICA" },
  { t: V[19] - 0.8, c: CONEJO, nombre: "BULBO DE PERÍODO 3", linea: "EL CONEJO: TRES OREJAS" },
  { t: V[20] - 0.8, c: P5, nombre: "BULBO DE PERÍODO 5", linea: "CINCO BRAZOS" },
  { t: V[21] - 0.8, c: [0.45, 0.42], nombre: "FUERA DEL MAPA", linea: "POLVO" },
];
const cTour = (t: number): P => {
  if (t <= TOUR[0].t) return TOUR[0].c;
  for (let i = 0; i < TOUR.length - 1; i++) if (t < TOUR[i + 1].t) {
    const u = eIO(pr(t, TOUR[i + 1].t - 2.0, 1.9));
    return [lerp(TOUR[i].c[0], TOUR[i + 1].c[0], u), lerp(TOUR[i].c[1], TOUR[i + 1].c[1], u)];
  }
  return TOUR[TOUR.length - 1].c;
};
const explora = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.explora - 0.6, K.tanLei + 0.6, 1.0);
  if (a <= 0.01) return;
  const c = cTour(t);
  // the map closes in on the rabbit bulb's antenna while it is named, then opens again
  const ua = Math.min(eIO(pr(t, K.antena - 0.6, 2.2)), 1 - eIO(pr(t, V[20] - 2.6, 2.0)));
  const za = Math.pow(30, ua);
  const v = { cx: lerp(VE.cx, MIS13[0], 1 - 1 / za), cy: lerp(VE.cy, MIS13[1], 1 - 1 / za), ancho: VE.ancho / za };
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
  pinta(ctx, 0, 0, W / 2, H, v, t, a);
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
  pinta(ctx, W / 2, 0, W / 2, H, { ...VJ, julia: c, pal: 2, maxIt: 500 }, t, a);
  ctx.restore();
  // the cursor
  const p = aPant(v, 0, W / 2, c);
  if (p[0] < W / 2) {
    luz(ctx, p[0], p[1], 26 * KT + 8, a, AMBAR);
    ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.9 * a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], 18 * KT + 6, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  divisor(ctx, a);
  banda(ctx, a);
  if (ua > 0.3) rotulo(ctx, "LA ANTENA DEL BULBO", "TAMBIÉN TRES BRAZOS", a * eSuave((ua - 0.3) / 0.3), 60, H - 110);
  texto(ctx, "EL MAPA", 60, 70, 16 * KT + 4, `rgba(${RGB.crema},${0.7 * a})`, { esp: 8 });
  texto(ctx, "SU MUNDO", W / 2 + 60, 70, 16 * KT + 4, `rgba(${RGB.crema},${0.7 * a})`, { esp: 8 });
  texto(ctx, fmtC(c), W / 2 + 60, 104, 16 * KT + 4, `rgba(${AMBAR},${0.9 * a})`, { esp: 1 });
  TOUR.forEach((s, i) => rotulo(ctx, s.nombre, s.linea, a * ventana(t, s.t + 0.6, (TOUR[i + 1]?.t ?? K.tanLei) - 1.6, 0.5), W / 2 + 60, H - 110));
};

// ─── Tan Lei: at a point of the border, the map and the world look alike ────────────────────────────────────────
// the world is turned by −23°: near c, Tan Lei's similarity is a scaling and a turn (measured on the arms' angles)
const GIRO_J = -0.4;
const tanLei = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.tanLei - 0.4, K.final + 0.6, 1.0);
  if (a <= 0.01) return;
  const u = eIO(pr(t, K.tanZoom[0], K.tanZoom[1] - K.tanZoom[0])), z = Math.pow(10, 2.8 * u) * Math.exp(0.15 * pr(t, K.tanZoom[1], K.final - K.tanZoom[1]));
  const vM = { cx: MIS13[0], cy: MIS13[1], ancho: 3.1 / z }, vJ = { cx: MIS13[0], cy: MIS13[1], ancho: 3.3 / z };
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
  pinta(ctx, 0, 0, W / 2, H, vM, t, a);
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
  const l = pintarProfundo(Math.round(W / 2), H, { ...vJ, julia: MIS13, rot: GIRO_J * eSuave(pr(t, K.tanZoom[0], 2.0)), fase: 0.04 * t, paleta: PALETAS[2], brillo: 0.9, maxIt: 900, tiempo: 0.4 * t });
  ctx.globalAlpha = a; ctx.drawImage(l, W / 2, 0, W / 2, H);
  ctx.restore();
  // the point c, on both
  const ap = a * (1 - eSuave(pr(t, K.tanZoom[0] + 1.5, 1.5)));
  luz(ctx, W / 4, H / 2, 22 * KT + 8, ap, AMBAR);
  luz(ctx, (3 * W) / 4, H / 2, 22 * KT + 8, ap, AMBAR);
  divisor(ctx, a);
  banda(ctx, a);
  texto(ctx, "EL MAPA, CERCA DE c", 60, 70, 16 * KT + 4, `rgba(${RGB.crema},${0.7 * a})`, { esp: 8 });
  texto(ctx, "SU MUNDO, CERCA DE c", W / 2 + 60, 70, 16 * KT + 4, `rgba(${RGB.crema},${0.7 * a})`, { esp: 8 });
  aum(ctx, z, a * eSuave(pr(t, K.tanZoom[0], 0.6)), W - 60);
  rotulo(ctx, "LA MISMA FORMA", "c = −0,101 + 0,956 i", a * eSuave(pr(t, V[23], 0.6)), W / 2 - 220, H - 110);
};

// ─── the meaning of the title: inside something, outside almost nothing, the border between them ───────────────
const VF = { cx: -0.65, cy: 0, ancho: 3.9 };
// then the camera sinks into one point of the border, a Misiurewicz point in the seahorse valley (computed with 70
// digits, src/refMis.json): its spiral turns forever, each turn like the last; ×10¹³, then it closes into a point
const MIS: P = [Number(REFMIS.c[0]), Number(REFMIS.c[1])];
const RMIS = { clave: "mis24", abierta: true, orbita: (() => { const o = [...REFMIS.orbita], fx = o[o.length - 2], fy = o[o.length - 1]; while (o.length < 2 * 60000) o.push(fx, fy); return o; })() };
const DMIS: P = [VF.cx - MIS[0], VF.cy - MIS[1]];
const ZMAX = 1e13;
const itMis = (z: number) => Math.round(500 + 2200 * Math.log10(Math.max(1, z)));
const lzMis = (t: number) => {
  const A0 = K.asintota[0], A1 = K.asintota[1], L = Math.log(ZMAX), a = 0.2, g = (u: number) => (u < a ? (u * u) / (2 * a) : u - a / 2);
  if (t <= A1) return (L * g(pr(t, A0, A1 - A0))) / g(1);
  const v = L / (g(1) * (A1 - A0)), tau = 3.0;
  return L + v * tau * (1 - Math.exp(-(t - A1) / tau));
};
let BASE_M: ((lz: number) => number) | null = null;
const final = (ctx: Ctx, t: number) => {
  if (t < K.final - 0.6 || t > K.vacio + 1.2) return;
  const a = Math.max(ventana(t, K.final - 0.6, K.cantor0 + 0.8, 1.0), ventana(t, V[26] - 1.0, K.escape0 + 0.8, 1.0), eSuave(pr(t, K.dimFin - 0.4, 1.2)));
  if (a <= 0.01) return;
  const gIn = ventana(t, K.dentro, K.cantor0, 0.8), gB = Math.max(ventana(t, K.frontera, K.escape0 + 0.6, 1.0), ventana(t, K.dimFin - 0.4, K.asintota[0] + 5.0, 3.0));
  // the zoom: it speeds up smoothly (no kink: the speed is continuous), keeps a steady pace through the spiral, and
  // after ×10¹³ slows down smoothly while the point closes
  const lz = lzMis(t);
  // the point itself slides to the centre of the screen during the first ×1000, so the light is born exactly there
  const z = Math.exp(lz), cen = 1 - eSuave(cl(lz / Math.log(1000))), off: P = [(DMIS[0] / z) * cen, (DMIS[1] / z) * cen], w = VF.ancho / z;
  BASE_M = BASE_M ?? tablaBase(RMIS.orbita, true, DMIS, VF.ancho, Math.log(ZMAX) + 4.0, itMis);
  // the fractal fades into its own point while the spiral closes
  const cierra = eSuave(pr(t, K.asintota[1], K.punto - K.asintota[1]));
  // the border dims and the colour base sets in gradually between ×2 and ×12 (it used to switch on one frame at ×3)
  const hondo = eSuave(cl((lz - Math.log(2)) / Math.log(6)));
  pinta(ctx, 0, 0, W, H, { cx: MIS[0] + off[0], cy: MIS[1] + off[1], ancho: w, ref: RMIS, off, maxIt: itMis(z), interior: 1 + 1.2 * gIn, borde: (1 + 1.6 * gB) * (1 - 0.45 * hondo), base: z > 2 ? BASE_M(lz) * hondo : 0 }, t, a * (1 - cierra));
  // outside: the dust of the worlds, faintly
  const af = ventana(t, K.fuera, K.cantor0 + 0.4, 0.8);
  if (af > 0.01) { ctx.save(); ctx.globalAlpha = af * 0.6; ctx.globalCompositeOperation = "lighter"; ctx.drawImage(mosaicoLienzo(), 0, 0); ctx.restore(); }
  // the point: what is left at the end of the asymptote, beating once, then waiting in the dark for the question
  if (t > K.asintota[1]) {
    const ap = eSuave(pr(t, K.asintota[1] + 1.0, K.punto - K.asintota[1] - 1.0));
    const lat = 1 + 0.25 * Math.exp(-((t - K.punto) % 1.6 + 1.6) % 1.6 * 4);
    const sale = 1 - eSuave(pr(t, K.vacio, 1.0));
    luz(ctx, W / 2, H / 2, (18 + 60 * (1 - ap)) * KT * lat, Math.max(ap, 0.3) * a * sale, AMBAR);
    luz(ctx, W / 2, H / 2, 6 * KT * lat, ap * a * sale);
  }
  banda(ctx, a * (1 - cierra));
  rotulo(ctx, "DENTRO: ALGO", "CADA MUNDO, DE UNA SOLA PIEZA", a * ventana(t, K.dentro + 0.3, K.cantor0, 0.5));
  rotulo(ctx, "FUERA: CASI NADA", "CADA MUNDO, POLVO", a * ventana(t, K.fuera + 0.3, K.cantor0, 0.5), W - 84, H - 128, "right");
  rotulo(ctx, "LA FRONTERA", "DONDE EL ALGO SE ROMPE EN NADA", a * ventana(t, K.frontera + 0.3, K.escape0, 0.5));
  rotulo(ctx, "UN SOLO PUNTO DE LA FRONTERA", "c = −0,7756837680 + 0,1364673683 i", a * ventana(t, V[28] + 0.5, V[29] + 4.0, 0.6));
  rotulo(ctx, "SIN LARGO, SIN ÁREA, SIN FORMA", "Y AUN ASÍ, PERTENECE AL CONJUNTO", a * ventana(t, V[31] + 2.0, K.leibniz + 0.3, 0.6));
  if (z > 3) aum(ctx, z, a * (1 - cierra) * eSuave(pr(t, K.asintota[0] + 2, 1.0)), W - 84);
};

// ─── Leibniz's medal: one and zero, around the point ───────────────────────────────────────────────────────────
const medalla = (ctx: Ctx, t: number) => {
  // the digits and the caption leave with «Volvamos al cero»; the medal's ring stays, follows the point to its place
  // as the zero of the plane and opens to the size of the first curve, which takes its place on «una sola vez»
  const a = ventana(t, K.medalla - 0.2, K.vacio + 0.6, 0.8);
  const aa = eSuave(pr(t, K.medalla - 0.2, 0.8)) * (1 - eSuave(pr(t, K.anillo1 + 0.05, 0.8)));
  if (aa <= 0.01) return;
  const vv0: Vista = { cx: -0.25, cy: 0, ancho: 7.6 }, o = aPant(vv0, 0, W, [0, 0]);
  const g = eIO(pr(t, K.vacio, 1.6)), cx = lerp(W / 2, o[0], g), cy = lerp(H / 2, o[1], g);
  const r0 = H * 0.24 * (0.92 + 0.08 * eOut(pr(t, K.medalla, 2.0))), r1 = 2 * (W / vv0.ancho);
  const r = lerp(r0, r1, eIO(pr(t, K.vacio + 0.8, K.anillo1 - K.vacio - 0.8)));
  ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.75 * aa})`; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = `rgba(${AMBAR},${0.35 * a})`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  if (a <= 0.01) return;
  // the digits 1 and 0, in a ring, turning slowly
  const cifras = "1 0 0 1 1 0 1 0 1 1 1 0 0 1 0 1 ".split(" ").filter(Boolean);
  cifras.forEach((d, i) => {
    const th = (i / cifras.length) * Math.PI * 2 + 0.05 * t, x = cx + Math.cos(th) * r * 0.78, y = cy + Math.sin(th) * r * 0.78 + 8;
    texto(ctx, d, x, y, 22 * KT + 6, `rgba(${RGB.crema},${0.75 * a})`, { fam: SANS, peso: 600, alin: "center", esp: 0 });
  });
  rotulo(ctx, "LA MEDALLA DE LEIBNIZ", "1697 · TODO, CON EL UNO Y EL CERO", a);
};

// ─── from the zero: the rule, step by step, carves a border that converges on the set ───────────────────────────
const VA = { cx: -0.6, cy: 0, ancho: 4.4 };
const pasosDe = (t: number) => {
  const [p1, p10, pInf] = K.pasos;
  if (t < K.anillo1) return 0;
  if (t < p1 + 0.8) return 1;
  if (t < p10) return lerp(1, 10, eIO(pr(t, p1 + 0.8, p10 - p1 - 0.8)));
  if (t < pInf) return 10 + 2 * pr(t, p10, pInf - p10);
  return 12 + 400 * Math.pow(pr(t, pInf, K.revela2 - pInf + 0.4), 2.4);
};
const vacioEscena = (ctx: Ctx, t: number) => {
  if (t < K.vacio - 0.4 || t > K.buceo2[0] + 1.0) return;
  const a = eSuave(pr(t, K.vacio - 0.4, 1.2)) * (1 - eSuave(pr(t, K.buceo2[0], 0.8)));
  const n = pasosDe(t);
  // the camera starts wide enough for the first curve (the circle of radius 2) and closes in as the curves shrink
  const vv = { cx: lerp(-0.25, VA.cx, eIO(cl((n - 1) / 12))), cy: 0, ancho: lerp(7.6, VA.ancho, eIO(cl((n - 1) / 12))) };
  const o = aPant(vv, 0, W, [0, 0]);
  // the empty plane
  const ag = a * (1 - eSuave(pr(t, K.pasos[1], 3.0)));
  if (ag > 0.01) {
    ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.06 * ag})`; ctx.lineWidth = 1;
    for (let k = -12; k <= 12; k++) { const p = aPant(vv, 0, W, [k / 2, k / 2]); ctx.beginPath(); ctx.moveTo(p[0], 0); ctx.lineTo(p[0], H); ctx.moveTo(0, p[1]); ctx.lineTo(W, p[1]); ctx.stroke(); }
    ctx.restore();
  }
  // the rings, then (once they have converged) the set in full colour
  if (n > 0) pinta(ctx, 0, 0, W, H, { ...vv, maxIt: 900, anillos: n, borde: 1 }, t, a);
  const ar = a * eSuave(pr(t, K.revela2 - 0.2, 1.4));
  if (ar > 0.01) pinta(ctx, 0, 0, W, H, { ...VA, maxIt: 900, borde: 1.6 }, t, ar);
  // the zero: the point glides to its place in the plane and pulses with every step
  const g = eIO(pr(t, K.vacio, 1.6)), px = lerp(W / 2, o[0], g), py = lerp(H / 2, o[1], g);
  const pulso = n > 0 && n < 14 ? Math.exp(-((n % 1) * 6)) : 0;
  luz(ctx, px, py, (16 + 30 * pulso) * KT, a * (1 - 0.7 * ar), AMBAR);
  texto(ctx, "0", px + 16, py - 14, 22 * KT + 6, `rgba(${AMBAR},${0.9 * a * g * (1 - ar)})`, { fam: SANS, peso: 600 });
  if (n >= 1) {
    const ac = a * (1 - ar);
    texto(ctx, "PASOS", W - 84, 96, 16 * KT + 4, `rgba(${RGB.crema},${0.6 * ac})`, { alin: "right", esp: 6 });
    texto(ctx, n > 300 ? "∞" : `${Math.floor(n)}`, W - 84, 142, 44 * KT + 6, `rgba(${AMBAR},${0.9 * ac})`, { fam: SANS, peso: 600, alin: "right", esp: 2 });
    texto(ctx, "zₙ₊₁ = zₙ² + c   ·   z₀ = 0", 84, H - 90, 22 * KT + 6, `rgba(${RGB.crema},${0.8 * ac})`, { esp: 1 });
  }
};

// ─── the dive, fast: ×10¹⁵ down to the copy; then the rings converge again on it ────────────────────────────────
const DREF2: P = [VA.cx - MINI[0], VA.cy - MINI[1]];
// the copy's own middle (the nucleus sits in its cardioid, off the middle of the whole copy), and a view that holds
// the copy whole
const OM: P = [-0.4e-16, 1.5e-16];               // (measured on screen)
const W2 = 3.0e-15;
let BASE_B2: ((lz: number) => number) | null = null;
const otraVez = (ctx: Ctx, t: number) => {
  if (t < K.buceo2[0] - 0.2) return;
  const a = eSuave(pr(t, K.buceo2[0] - 0.2, 0.8)) * (1 - eSuave(pr(t, K.total - 2.2, 2.0)));
  const u = eIO(pr(t, K.buceo2[0], K.buceo2[1] - K.buceo2[0]));
  const lw = lerp(Math.log(VA.ancho), Math.log(W2), u) - 0.05 * pr(t, K.buceo2[1], K.total - K.buceo2[1]);
  // the copy slides to the middle of the screen during the first ×1000, so it ends centred and whole
  const w = Math.exp(lw), z = VA.ancho / w, cen = 1 - eSuave(cl(Math.log(z) / Math.log(1000)));
  const off: P = [(DREF2[0] / z) * cen + OM[0] * (1 - cen), (DREF2[1] / z) * cen + OM[1] * (1 - cen)];
  BASE_B2 = BASE_B2 ?? tablaBase(RREF.orbita, false, DREF2, VA.ancho, Math.log(VA.ancho / W2) + 0.4, itBuceo);
  const kz = eSuave(cl(Math.log10(z) / 3));
  const base = BASE_B2(Math.log(z)) * kz, v: Vista = { cx: MINI[0] + off[0], cy: MINI[1] + off[1], ancho: w, ref: RREF, off, maxIt: Math.max(900, itBuceo(z)), interior: lerp(1, 0.3, kz), borde: lerp(1.6, 0.45, kz), base };
  // on the copy, the rings again: the same convergence, a thousand billion times smaller
  const nm = t < K.anillosMini[0] ? -1 : 0.5 + 45 * Math.pow(pr(t, K.anillosMini[0], K.anillosMini[1] - K.anillosMini[0]), 1.8);
  const am = ventana(t, K.anillosMini[0], K.anillosMini[1] + 1.2, 0.8);
  pinta(ctx, 0, 0, W, H, v, t, a * (1 - am));
  if (am > 0.01) pinta(ctx, 0, 0, W, H, { ...v, anillos: nm, divA: 998 }, t, a * am);
  banda(ctx, a);
  aum(ctx, z, a * (1 - eSuave(pr(t, K.total - 4, 1))), W - 84);
  rotulo(ctx, "CERCA DE CUALQUIER PUNTO DE LA FRONTERA", "EL CONJUNTO ENTERO, OTRA VEZ", a * ventana(t, K.buceo2[1] - 0.8, K.anillosMini[0] + 0.8, 0.6));
  rotulo(ctx, "Y OTRA VEZ, DESDE EL VACÍO", "Y ASÍ, SIN FIN", a * ventana(t, K.anillosMini[0] + 0.6, V[38], 0.6));
};

// ─── 4 · almost nothing: the Cantor set ─────────────────────────────────────────────────────────────────────────
// bars of a «barcode»: every cut removes the middle third of every piece. Then the camera dives about 1/4, a point of
// the set where ×9 shows exactly the same (1/4 = 0,020202… in base 3)
const cantorEscena = (ctx: Ctx, t: number, fotos: Record<string, HTMLImageElement>) => {
  const a = ventana(t, K.cantor0, K.cantorFin + 0.6, 1.0);
  if (a <= 0.01) return;
  void fotos;
  let n = 0;
  for (const c of K.cortes) if (t >= c) n++;
  const u = n > 0 && n <= K.cortes.length ? eIO(cl((t - K.cortes[n - 1]) / 0.4)) : 0;
  const z = Math.pow(9, 3.2 * eIO(pr(t, K.cantorZoom[0], K.cantorZoom[1] - K.cantorZoom[0])));
  const v0 = 0.25 - 0.25 / z, v1 = 0.25 + 0.75 / z;
  const X0 = W * 0.1, X1 = W * 0.9, y = H * 0.5, alto = H * 0.2 * eOut(pr(t, K.cantor0 + 0.4, 1.0));
  const aCantor = a * (1 - eSuave(pr(t, K.polvoJ, 1.6)));
  const barra = (p: number, q: number) => {
    const xa = X0 + ((p - v0) / (v1 - v0)) * (X1 - X0), xb = X0 + ((q - v0) / (v1 - v0)) * (X1 - X0);
    if (xb < 0 || xa > W) return;
    const w = Math.max(1.2, xb - xa);
    ctx.fillStyle = `rgba(${RGB.crema},${0.92 * aCantor})`; ctx.fillRect(xa, y - alto / 2, w, alto);
  };
  // the pieces: the cut level so far (n), and when the camera dives, as deep as the pixels need
  const prof = z > 1.01 ? 40 : n;
  const va = (p: number, q: number, k: number) => {
    const ancho = ((q - p) / (v1 - v0)) * (X1 - X0);
    if (q < v0 || p > v1) return;
    if (k >= prof || ancho < 1.5) { barra(p, q); return; }
    const d = (q - p) / 3;
    if (k === prof - 1 && z <= 1.01 && u < 1) {
      // the cut that is happening: the middle third opens from its centre
      const m = (p + q) / 2, g = (d / 2) * u;
      barra(p, m - g); barra(m + g, q); return;
    }
    va(p, p + d, k + 1); va(q - d, q, k + 1);
  };
  if (aCantor > 0.01) {
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(10px)"; ctx.globalAlpha = 0.5;
    va(0, 1, 0); ctx.restore();
    va(0, 1, 0);
  }
  // the length that is left, word by word
  const fr = ["1", "2/3", "4/9", "8/27", "0"];
  let kL = 0;
  for (const tl of K.largos) if (t >= tl - 0.1) kL++;
  const aL = aCantor * ventana(t, K.cortes[0] - 0.4, K.cantorZoom[0] + 0.6, 0.5);
  if (aL > 0.01) {
    texto(ctx, "LARGO TOTAL", W / 2, H * 0.24, 16 * KT + 4, `rgba(${RGB.crema},${0.6 * aL})`, { alin: "center", esp: 6 });
    texto(ctx, fr[Math.min(kL, 4)], W / 2, H * 0.24 + 56, 52 * KT + 8, `rgba(${AMBAR},${0.95 * aL})`, { fam: SANS, peso: 600, alin: "center", esp: 2 });
  }
  if (z > 1.05) aum(ctx, z, aCantor, W - 84);
  rotulo(ctx, "SIEMPRE HAY MÁS PUNTOS", "AL ACERCARSE, NUNCA SE VACÍA", aCantor * ventana(t, K.cantorZoom[0] + 2.0, K.cantorZoom[1], 0.6));
  // the dust of a broken world: the same structure, another shape
  const aj = a * eSuave(pr(t, K.polvoJ, 1.6));
  if (aj > 0.01) pinta(ctx, 0, 0, W, H, { ...VJ, ancho: 3.6, julia: POLVO, pal: 2, maxIt: 500, borde: 0.6 }, t, aj);
  if (aj > 0.01) rotulo(ctx, "EL POLVO DE UN MUNDO ROTO", "CASI NADA, Y A LA VEZ, INFINITO", aj * eSuave(pr(t, V[44] + 4.0, 0.8)));
};

// ─── the time that does not end: c = −0,75 + ε·i, closer and closer to the border; the turns, computed ──────────
const EPS = [0.1, 0.03, 0.01, 0.003, 0.001, 0.0003];
const VUELTAS = [33, 105, 315, 1048, 3143, 10473];        // |zₙ| > 2 first at these n (computed in double precision)
const escapeEscena = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.escape0 - 0.6, K.dim0 + 0.6, 1.0);
  if (a <= 0.01) return;
  let k = -1;
  for (let i = 0; i < K.marcas.length; i++) if (t >= K.marcas[i]) k = i;
  // the camera keeps the newest constant in view: width ≈ 6 ε, centred between it and the border
  const eps = (i: number) => (i < 0 ? 0.3 : EPS[i]);
  const fk = k < 0 ? 0 : Math.min(1, (t - K.marcas[k]) / 0.6), le = lerp(Math.log(eps(k - 1)), Math.log(eps(k)), eIO(fk));
  const tn = t >= K.nunca ? eIO(pr(t, K.nunca, 2.0)) : 0;
  // (no narrower than 0,03: closer in, the path runs through a gap thinner than a pixel between two parts of the set)
  const ancho = Math.max(Math.exp(le) * 7, 0.03) * (1 - 0.3 * tn), cy = Math.min(Math.exp(le) * 0.45, 0.004) * (1 - tn);
  const v = { cx: -0.75, cy, ancho };
  pinta(ctx, 0, 0, W, H, { ...v, maxIt: 14000, interior: 1.2, borde: 1.6 }, t, a);
  // the path, and the constants already tried
  const top = aPant(v, 0, W, [-0.75, 0.3]), bot = aPant(v, 0, W, [-0.75, 0]);
  ctx.save(); ctx.setLineDash([6, 8]); ctx.strokeStyle = `rgba(${AMBAR},${0.5 * a})`; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(top[0], Math.max(-10, top[1])); ctx.lineTo(bot[0], bot[1]); ctx.stroke(); ctx.restore();
  for (let i = 0; i <= k; i++) {
    const p = aPant(v, 0, W, [-0.75, EPS[i]]);
    if (p[1] < -40) continue;
    luz(ctx, p[0], p[1], (i === k ? 22 : 12) * KT + 4, a * (i === k ? 1 : 0.5), AMBAR);
    texto(ctx, miles(VUELTAS[i]), p[0] + 24, p[1] + 8, (i === k ? 22 : 15) * KT + 5, `rgba(${RGB.crema},${(i === k ? 0.95 : 0.55) * a})`, { esp: 1 });
  }
  // the counter: turns before escaping, for the newest constant (it runs up to its value)
  const ac = a * eSuave(pr(t, K.marcas[0] - 0.4, 0.6));
  const val = k < 0 ? 0 : Math.round(VUELTAS[k] * eOut(cl((t - K.marcas[k]) / 0.5)));
  texto(ctx, "VUELTAS ANTES DE ESCAPAR", W - 84, 96, 16 * KT + 4, `rgba(${RGB.crema},${0.6 * ac})`, { alin: "right", esp: 6 });
  texto(ctx, tn > 0.3 ? "∞" : miles(val), W - 84, 150, 54 * KT + 8, `rgba(${AMBAR},${0.95 * ac})`, { fam: SANS, peso: 600, alin: "right", esp: 2 });
  if (k >= 0 && tn <= 0.3) texto(ctx, `c = −0,75 + ${String(EPS[k]).replace(".", ",")} i`, W - 84, 190, 16 * KT + 4, `rgba(${RGB.crema},${0.7 * ac})`, { alin: "right", esp: 2 });
  if (tn > 0.3) texto(ctx, "c = −0,75: NUNCA ESCAPA", W - 84, 190, 16 * KT + 4, `rgba(${RGB.crema},${0.8 * ac})`, { alin: "right", esp: 2 });
  banda(ctx, a);
  rotulo(ctx, "UN CAMINO HACIA EL BORDE", "c = −0,75 + ε i, CON ε CADA VEZ MÁS PEQUEÑO", a * ventana(t, K.escape0 + 0.4, K.marcas[1] - 0.4, 0.6));
  rotulo(ctx, "DATO: VUELTAS × ε → 3,1415…", "EN ESTE CAMINO APARECE π (BOLL, 1991)", a * ventana(t, V[48] + 0.4, K.dim0, 0.6));
};

// ─── dimension and area: the border has dimension 2; whether it has area, nobody can prove yet ──────────────────
const dimEscena = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.dim0 - 0.4, K.dimFin + 0.8, 1.0);
  if (a <= 0.01) return;
  const z = Math.exp(0.25 * pr(t, K.dim0, K.dimFin - K.dim0));
  const v = { cx: VF.cx, cy: VF.cy, ancho: VF.ancho / z };
  const gArea = ventana(t, K.areaIn, K.soloBorde + 0.4, 0.6), gSolo = eSuave(pr(t, K.soloBorde, 1.4));
  pinta(ctx, 0, 0, W, H, { ...v, maxIt: 900, interior: 1 + 4 * gArea, borde: 1 + 1.6 * (1 - gArea), soloBorde: Math.max(0.65 * eSuave(pr(t, K.dim0, 1.5)) * (1 - gArea), gSolo) }, t, a);
  banda(ctx, a);
  rotulo(ctx, "LA FRONTERA", "TAN ARRUGADA QUE LLENA COMO UN PLANO", a * ventana(t, V[49] + 3.0, V[50] + 0.4, 0.6));
  rotulo(ctx, "DIMENSIÓN NO ES ÁREA", "UNA FRONTERA PUEDE TENER DIMENSIÓN 2 Y ÁREA CERO", a * ventana(t, V[50] + 0.6, K.areaIn, 0.6));
  rotulo(ctx, "EL CONJUNTO: ÁREA ≈ 1,5066", "CONTEO DE PÍXELES (FÖRSTEMANN, 2012)", a * ventana(t, K.areaIn + 0.2, K.soloBorde, 0.5));
  rotulo(ctx, "LA FRONTERA SOLA", "¿ÁREA?", a * ventana(t, K.soloBorde + 0.6, K.dimFin, 0.6));
};


export const dibujarCap2 = (ctx: Ctx, t: number, frame: number, fotos: Record<string, HTMLImageElement>) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  titulo(ctx, t);
  dividido(ctx, t);
  buceo(ctx, t);
  nubeEscena(ctx, t, fotos.nube ?? null);
  juliaEscena(ctx, t);
  lados(ctx, t);
  retratos(ctx, t, fotos);
  mapa(ctx, t);
  explora(ctx, t);
  tanLei(ctx, t);
  cantorEscena(ctx, t, fotos);
  escapeEscena(ctx, t);
  dimEscena(ctx, t);
  final(ctx, t);
  retrato(ctx, fotos.leibniz, W * 0.2, ventana(t, K.leibniz, K.medalla + 0.4, 0.8), "GOTTFRIED W. LEIBNIZ", "1646 – 1716");
  medalla(ctx, t);
  vacioEscena(ctx, t);
  otraVez(ctx, t);
  terminos(ctx, t);
  let golpe = 0;
  for (const g of K.cantor) if (t >= g && t - g < 0.6) golpe = Math.max(golpe, Math.exp(-(t - g) * 8) * 0.5);
  for (const g of [K.titulo, K.revela, K.frontera, K.revela2, K.buceo2[1]]) if (t >= g && t - g < 1.5) golpe = Math.max(golpe, 1.2 * Math.exp(-(t - g) * 3));
  const fin = eSuave(pr(t, K.total - 1.2, 1.2));
  if (fin > 0) { ctx.fillStyle = `rgba(2,3,6,${fin})`; ctx.fillRect(0, 0, W, H); }
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.92, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: golpe * 0.5, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
