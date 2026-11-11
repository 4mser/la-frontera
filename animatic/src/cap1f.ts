// CAPÍTULO I · what a fractal is (the scenes between «se le llama fractal» and the two fates; times in cap1p.json).
// 1 · a circle, zoomed into its edge, turns into a line (the rabbit's border, zoomed, never does: cap1p.ts)
// 2 · the Koch curve, built by repeating one rule, closing into the snowflake (Helge von Koch, 1904)
// 3 · self-similarity: a quarter of the curve, enlarged three times, is the whole curve; Sierpiński's triangle; the
//     fern of four rules (Barnsley); a real fern, whose branches look like the whole frond
// 4 · the snowflake's border grows by a third at every step, to infinity, around an area that tends to 8/5
// 5 · dimension by counting copies: a line ×2 → 2, a square ×2 → 4, Koch ×3 → 4: 4 = 3^D, D = log 4 / log 3 ≈ 1.26
// Every figure is computed, not drawn by hand.
import K from "./cap1p.json";
import { LIMPIO as SIN_TEXTO_TRAILER } from "./limpio";
import COSTA from "./costa.json";
import FORMATO from "./formato.json";
import { RGB, SANS, MONO, eIO, eOut, eSuave, lerp, pr } from "./theme";

const W = FORMATO.W, H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
type P = [number, number];
const AZUL = "150,190,255", AMBAR = "255,190,120", VERDE = "190,235,150";
const KT = Math.min(1, W / 1500);

const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  if (SIN_TEXTO_TRAILER && color !== "#fff") return;
  ctx.font = `${op.peso ?? 500} ${tam}px "${op.fam ?? MONO}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 3}px`;
  ctx.fillStyle = color; ctx.textAlign = op.alin ?? "left";
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};
// a caption at the bottom left, in the opening's style: a name and a line
const rotulo = (ctx: Ctx, nombre: string, linea: string, a: number, arriba = false) => {
  if (a <= 0.01) return;
  const y = arriba ? 120 : H - 128;
  texto(ctx, nombre, 84, y, 26 * KT + 6, `rgba(${RGB.crema},${0.9 * a})`, { fam: SANS, peso: 600, esp: 3 });
  if (linea) texto(ctx, linea, 84, y + 36, 16 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { esp: 5 });
};
// a glowing polyline: a wide soft pass, a medium one, a fine bright core
const trazo = (ctx: Ctx, pts: P[], col: string, a: number, w = 2, cerrar = false) => {
  if (a <= 0.01 || pts.length < 2) return;
  ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
  const camino = () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (cerrar) ctx.closePath(); };
  ctx.globalCompositeOperation = "lighter";
  for (const [lw, o] of [[w * 7, 0.06], [w * 2.6, 0.18]] as const) { ctx.strokeStyle = `rgba(${col},${o * a})`; ctx.lineWidth = lw; camino(); ctx.stroke(); }
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(${col},${0.95 * a})`; ctx.lineWidth = w; camino(); ctx.stroke();
  ctx.restore();
};
const luz = (ctx: Ctx, x: number, y: number, r: number, a: number, col = AMBAR) => {
  if (a <= 0 || r < 0.5) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.22, `rgba(${col},${0.6 * a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
};
// a scene's visibility: in over 0.6 s from a, out over 0.6 s before b
const ventana = (t: number, a: number, b: number, d = 0.6) => Math.min(eSuave(pr(t, a, d)), 1 - eSuave(pr(t, b - d, d)));
const aum = (ctx: Ctx, k: number, a: number, derecha = false, arriba = false) => {
  if (a <= 0.01) return;
  const x = derecha ? W - 84 : 84, al: CanvasTextAlign = derecha ? "right" : "left", y = arriba ? 96 : H - 150;
  texto(ctx, "AUMENTO", x, y, 16 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { esp: 6, alin: al });
  texto(ctx, `× ${Math.round(k).toLocaleString("es-CL")}`, x, y + 46, 44 * KT + 6, `rgba(${AMBAR},${0.9 * a})`, { fam: SANS, peso: 600, esp: 2, alin: al });
};
// Koch for any zoom: only the pieces that are on screen are subdivided, and only until they are 2 px long, so the
// curve has full detail at any magnification; returns the visible runs as polylines
const kochVista = (p: P, q: P, map: (w: P) => P, maxN = 14): P[][] => {
  const runs: P[][] = [];
  let actual: P[] | null = null;
  const fuera = (a: P, b: P) => {
    const A = map(a), B = map(b), r = Math.hypot(B[0] - A[0], B[1] - A[1]) * 0.6 + 4;
    return Math.max(A[0], B[0]) < -r || Math.min(A[0], B[0]) > W + r || Math.max(A[1], B[1]) < -r || Math.min(A[1], B[1]) > H + r;
  };
  const va = (p: P, q: P, n: number) => {
    const A = map(p), B = map(q);
    if (fuera(p, q)) { actual = null; return; }
    if (n >= maxN || Math.hypot(B[0] - A[0], B[1] - A[1]) < 2.5) {
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

// ─── 1 · the circle ─────────────────────────────────────────────────────────────────────────────────────────────
// the camera dives at the circle's rightmost point; the point slides to the centre as it grows (as in the rabbit's dive)
const circulo = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.circulo[0], K.zoomA[0] + 0.3);
  if (a <= 0.01) return;
  const R = H * 0.3, C0: P = [W / 2, H / 2], Pt: P = [W / 2 + R, H / 2];
  const k = Math.exp(Math.log(900) * eIO(pr(t, K.zoomC[0], K.zoomC[1] - K.zoomC[0])));
  const f = 1 / (k * k);
  const foco: P = [lerp(Pt[0], C0[0], f), lerp(Pt[1], C0[1], f)];
  const map = (p: P): P => [W / 2 + (p[0] - foco[0]) * k, H / 2 + (p[1] - foco[1]) * k];
  // only the visible stretch of the circle, sampled finely
  const span = Math.min(Math.PI, (1.4 * W) / (R * k));
  const pts: P[] = [];
  for (let i = 0; i <= 600; i++) { const th = -span + (2 * span * i) / 600; pts.push(map([C0[0] + R * Math.cos(th), C0[1] + R * Math.sin(th)])); }
  trazo(ctx, pts, RGB.crema, a, 2.4, span >= Math.PI);
  rotulo(ctx, "UN CÍRCULO", "", a * (1 - eSuave(pr(t, K.zoomC[0] + 1.5, 0.6))));
  aum(ctx, k, a * eSuave(pr(t, K.zoomC[0] + 0.3, 0.5)));
};

// ─── 2 · Koch ───────────────────────────────────────────────────────────────────────────────────────────────────
// level n of the curve between p and q; the newest level's bumps rise with u (0 = flat, 1 = full)
const koch = (p: P, q: P, n: number, u = 1): P[] => {
  const out: P[] = [p];
  // appends the points after p, up to and including q
  const va = (p: P, q: P, n: number) => {
    if (n === 0) { out.push(q); return; }
    const dx = (q[0] - p[0]) / 3, dy = (q[1] - p[1]) / 3;
    const a: P = [p[0] + dx, p[1] + dy], b: P = [p[0] + 2 * dx, p[1] + 2 * dy];
    // the peak: the middle third turned by −60° (up, on screen, for a left-to-right segment)
    const h = n === 1 ? u : 1;
    const m: P = [(a[0] + b[0]) / 2 + (dy * Math.sqrt(3)) / 2 * h, (a[1] + b[1]) / 2 - (dx * Math.sqrt(3)) / 2 * h];
    va(p, a, n - 1); va(a, m, n - 1); va(m, b, n - 1); va(b, q, n - 1);
  };
  va(p, q, n);
  return out;
};
// how far the construction is at time t: level and the rise of its newest bumps
const nivelKoch = (t: number) => {
  const L = K.nivelesK;
  let n = 0;
  for (const g of L) if (t >= g) n++;
  return { n, u: n === 0 ? 0 : eIO(pr(t, L[n - 1], 0.9)) };
};
// the snowflake: the built side stays where it is, the camera pulls back and the other two sides grow in
const SIDE = 0.7;   // the side, as a fraction of W, before the pull-back
const kochEscena = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.koch, K.sier + 0.2);
  if (a <= 0.01) return;
  // the camera: after the snowflake closes it pulls back; during «mira una de sus partes» it dives into a quarter
  const atras = eIO(pr(t, K.copo, 2.0));
  const esc = lerp(1, 0.46, atras);
  const lado = W * SIDE;
  // world: the side from (−½, 0) to (½, 0) in units of «lado»; the snowflake's centre is below it
  const cyMundo = lerp(0, Math.sqrt(3) / 6, atras);
  // the dive: toward the snowflake's corner A, where the curve is exactly the same at ×3, ×9, ×27…; A slides to a
  // point on the left of the frame while the magnification grows to 3⁸
  const up = eIO(pr(t, K.parte[0], K.parte[1] - K.parte[0] - 0.4));
  const zp = Math.pow(3, 8 * up);
  const S1 = lado * esc, yBase = H * 0.62 - lerp(0, H * 0.12, atras);
  const A0: P = [W / 2 + (-0.5 - 0) * S1, yBase + (0 - cyMundo) * S1], ancla: P = [lerp(A0[0], W * 0.12, 1 - 1 / zp), lerp(A0[1], H * 0.9, 1 - 1 / zp)];
  const S = S1 * zp;
  const map = ([x, y]: P): P => [ancla[0] + (x + 0.5) * S, ancla[1] + y * S];
  const { n, u } = nivelKoch(t);
  // the line, drawn on «Toma una línea»
  const crece = eOut(pr(t, K.lineaK, 1.0));
  const A: P = [-0.5, 0], B: P = [0.5, 0];
  const nivel = Math.min(6, n);
  const lados: P[][] = [];
  const top = koch(A, B, Math.max(0, nivel), n <= 6 ? u : 1).map(map);
  if (crece < 1) lados.push(top.slice(0, Math.max(2, Math.round(top.length * crece))));
  else lados.push(top);
  // the other two sides of the snowflake (bumps outward), after the curve is complete
  const cierra = eIO(pr(t, K.copo + 0.6, 1.6));
  if (cierra > 0) {
    const C: P = [0, Math.sqrt(3) / 2];
    for (const [p, q] of [[B, C], [C, A]] as [P, P][]) {
      const s2 = koch(p, q, Math.max(0, nivel), 1).map(map);
      lados.push(s2.slice(0, Math.max(2, Math.round(s2.length * cierra))));
    }
  }
  if (up > 0) {
    const C: P = [0, Math.sqrt(3) / 2];
    for (const [p, q] of [[A, B], [B, C], [C, A]] as [P, P][]) for (const r of kochVista(p, q, map)) trazo(ctx, r, RGB.crema, a, 2.2);
  } else lados.forEach((l) => trazo(ctx, l, RGB.crema, a, 2.2));
  // the corner the camera dives into
  const am = ventana(t, K.parte[0] - 0.6, K.parte[0] + 1.2, 0.4);
  if (am > 0.01) { const pa = map(A); luz(ctx, pa[0], pa[1], 30 * KT + 8, 0.8 * am); }
  // the thirds, on «Divídela en tres»
  const at = ventana(t, K.tercios - 0.1, K.nivelesK[0] + 0.6, 0.3);
  if (at > 0.01 && crece >= 1) {
    for (const x of [-1 / 6, 1 / 6]) {
      const p = map([x, 0]);
      ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.9 * at})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p[0], p[1] - 16); ctx.lineTo(p[0], p[1] + 16); ctx.stroke(); ctx.restore();
    }
    const m1 = map([-1 / 6, 0]), m2 = map([1 / 6, 0]);
    trazo(ctx, [m1, m2], AMBAR, at * 0.8, 3);
  }
  rotulo(ctx, "CURVA DE KOCH", "HELGE VON KOCH · 1904", a * ventana(t, K.nivelesK[1], K.parte[0] - 0.2, 0.8));
  if (up > 0.02) aum(ctx, zp, a * eSuave(pr(up, 0.02, 0.06)), true, true);
};

// ─── 3b · Sierpiński: a triangle whose centre is taken out, again and again ─────────────────────────────────────
const sierpinski = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.sier, K.helecho + 0.3);
  if (a <= 0.01) return;
  const L = K.nivelesS;
  let n = 0;
  for (const g of L) if (t >= g) n++;
  const u = n === 0 ? 1 : eIO(pr(t, L[n - 1], 0.5));
  // the dive: toward the bottom-left corner, where the triangle is exactly the same at ×2, ×4, ×8…; the corner slides
  // to the lower left of the frame while the magnification grows to 2⁹
  const uz = eIO(pr(t, K.sierZoom[0], K.sierZoom[1] - K.sierZoom[0]));
  const zz = Math.pow(2, 9 * uz);
  const lado0 = H * 0.82, A0: P = [W / 2 - lado0 / 2, H * 0.86];
  const ancla: P = [lerp(A0[0], W * 0.1, 1 - 1 / zz), lerp(A0[1], H * 0.92, 1 - 1 / zz)];
  const lado = lado0 * zz, A: P = ancla, B: P = [ancla[0] + lado, ancla[1]], C: P = [ancla[0] + lado / 2, ancla[1] - lado * Math.sqrt(3) / 2];
  ctx.save();
  // the triangles left at level n (the newest holes open with u); during the dive, as many levels as the screen shows
  const fueraT = (p: P, q: P, r: P) => Math.max(p[0], q[0], r[0]) < 0 || Math.min(p[0], q[0], r[0]) > W || Math.max(p[1], q[1], r[1]) < 0 || Math.min(p[1], q[1], r[1]) > H;
  // during the dive the smallest triangles are kept the size the last level had on screen (th): a triangle between th
  // and 2·th is drawn whole with its hole opening as it grows (log₂ of its size over th), so no level ever pops in
  const th = lado0 / 64;
  const hueco = (p: P, q: P, r: P, f: number) => {
    if (f <= 0.001) return;
    const pq: P = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], qr: P = [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2], rp: P = [(r[0] + p[0]) / 2, (r[1] + p[1]) / 2];
    const c: P = [(p[0] + q[0] + r[0]) / 3, (p[1] + q[1] + r[1]) / 3];
    const sc = (v: P): P => [c[0] + (v[0] - c[0]) * f, c[1] + (v[1] - c[1]) * f];
    const [x1, x2, x3] = [sc(pq), sc(qr), sc(rp)];
    const prev = ctx.fillStyle;
    ctx.fillStyle = "#020306"; ctx.beginPath(); ctx.moveTo(x1[0], x1[1]); ctx.lineTo(x2[0], x2[1]); ctx.lineTo(x3[0], x3[1]); ctx.closePath(); ctx.fill();
    ctx.fillStyle = prev;
  };
  const tri = (p: P, q: P, r: P, d: number) => {
    if (fueraT(p, q, r)) return;
    const lad = Math.abs(q[0] - p[0]);
    if (d === 0 || (uz > 0 && lad < 2 * th * 0.9999)) {
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.lineTo(r[0], r[1]); ctx.closePath(); ctx.fill();
      if (uz > 0) hueco(p, q, r, eIO(Math.min(1, Math.max(0, Math.log2(lad / th)))));
      return;
    }
    const pq: P = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], qr: P = [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2], rp: P = [(r[0] + p[0]) / 2, (r[1] + p[1]) / 2];
    tri(p, pq, rp, d - 1); tri(pq, q, qr, d - 1); tri(rp, qr, r, d - 1);
  };
  const g = ctx.createLinearGradient(0, H * 0.86 - lado0 * Math.sqrt(3) / 2, 0, H * 0.86);
  g.addColorStop(0, `rgba(255,236,205,${0.95 * a})`); g.addColorStop(1, `rgba(${AMBAR},${0.85 * a})`);
  ctx.fillStyle = g;
  ctx.globalAlpha = 1;
  // a level whose holes are fully open is the next level's triangles; while they open, black triangles grow out of
  // each centre
  tri(A, B, C, uz > 0 ? 40 : u >= 1 ? n : Math.max(0, n - 1));
  if (n > 0 && u < 1 && uz === 0) {
    ctx.fillStyle = "#020306";
    const huecos = (p: P, q: P, r: P, d: number) => {
      const pq: P = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], qr: P = [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2], rp: P = [(r[0] + p[0]) / 2, (r[1] + p[1]) / 2];
      if (d === 0) {
        const c: P = [(p[0] + q[0] + r[0]) / 3, (p[1] + q[1] + r[1]) / 3];
        const sc = (v: P): P => [c[0] + (v[0] - c[0]) * u, c[1] + (v[1] - c[1]) * u];
        const [x1, x2, x3] = [sc(pq), sc(qr), sc(rp)];
        ctx.beginPath(); ctx.moveTo(x1[0], x1[1]); ctx.lineTo(x2[0], x2[1]); ctx.lineTo(x3[0], x3[1]); ctx.closePath(); ctx.fill();
        return;
      }
      huecos(p, pq, rp, d - 1); huecos(pq, q, qr, d - 1); huecos(rp, qr, r, d - 1);
    };
    huecos(A, B, C, n - 1);
  }
  ctx.restore();
  // a glow over the whole figure
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.25 * a; ctx.filter = "blur(18px)"; ctx.drawImage(ctx.canvas, 0, 0); ctx.restore();
  rotulo(ctx, "TRIÁNGULO DE SIERPIŃSKI", "WACŁAW SIERPIŃSKI · 1915", a * eSuave(pr(t, K.sier + 0.8, 0.6)) * (1 - eSuave(pr(t, K.sierZoom[0], 0.6))), true);
  if (uz > 0.01) aum(ctx, zz, a * eSuave(pr(uz, 0.01, 0.05)), true, true);
};

// ─── 3c · Barnsley's fern: four affine rules chosen at random, a point at a time ────────────────────────────────
const HELECHO = (() => {
  const n = 400000, out = new Float32Array(2 * n);
  let sem = 777;
  const azar = () => { sem = (Math.imul(sem, 1103515245) + 12345) | 0; return ((sem >>> 16) & 0x7fff) / 32768; };
  let x = 0, y = 0;
  for (let i = -20; i < n; i++) {
    const r = azar();
    let nx: number, ny: number;
    if (r < 0.01) { nx = 0; ny = 0.16 * y; }
    else if (r < 0.86) { nx = 0.85 * x + 0.04 * y; ny = -0.04 * x + 0.85 * y + 1.6; }
    else if (r < 0.93) { nx = 0.2 * x - 0.26 * y; ny = 0.23 * x + 0.22 * y + 1.6; }
    else { nx = -0.15 * x + 0.28 * y; ny = 0.26 * x + 0.24 * y + 0.44; }
    x = nx; y = ny;
    if (i >= 0) { out[2 * i] = x; out[2 * i + 1] = y; }
  }
  return out;
})();
let capaH: HTMLCanvasElement | null = null, dens: Float32Array | null = null, imgH: ImageData | null = null;
// a high-resolution texture of the fern, for the dive: 300 px per unit, 4 million points, toned like the drawing;
// two versions: whole, and without its first left leaf (the points the third rule made last)
const TEX = { s: 300, x0: 2.3 * 300, y0: 10.1 * 300, w: 1500, h: 3060 };
// the photo's frond, mirrored, in the frame (the photo at full height, centred): base and tip, as fractions of the
// photo (public/p2/fotos/helecho.jpg, before mirroring: tip (0.111, 0.108), base (0.689, 0.919))
const FOTO = { ancho: 2488 / 3069, punta: [1 - 0.111, 0.108], base: [1 - 0.689, 0.919] };
const enFoto = (f: number[]): P => [W / 2 + (f[0] - 0.5) * FOTO.ancho * H, f[1] * H];
// the fern camera: screen = p + λ·(F w − F P), λ complex (zoom and turn), F = diag(1, −1); from (λ = s, p = P on screen)
// to the view that sets the 4th leaf's base and tip on the photo's; log|λ|, arg λ and p move together, eased
const camaraHelecho = (u: number, ox: number, oy: number, s: number) => {
  const Px = -0.60836502, Py = 1.87189237;
  const p0: P = [ox + Px * s, oy - Py * s];
  const M4 = potenciaM(4);
  const ap = (x: number, y: number): P => [Px + M4[0] * (x - Px) + M4[1] * (y - Py), Py + M4[2] * (x - Px) + M4[3] * (y - Py)];
  const B4 = ap(0, 0), T4 = ap(2.656, 9.998);
  // in flipped coordinates (y → −y): vectors from P
  const b: P = [B4[0] - Px, -(B4[1] - Py)], tt: P = [T4[0] - Px, -(T4[1] - Py)];
  const b1 = enFoto(FOTO.base), t1 = enFoto(FOTO.punta);
  // λ_E = (t1 − b1) / (T − B), complex division
  const dx = tt[0] - b[0], dy = tt[1] - b[1], ex = t1[0] - b1[0], ey = t1[1] - b1[1], dd = dx * dx + dy * dy;
  const lE: P = [(ex * dx + ey * dy) / dd, (ey * dx - ex * dy) / dd];
  const pE: P = [b1[0] - (lE[0] * b[0] - lE[1] * b[1]), b1[1] - (lE[0] * b[1] + lE[1] * b[0])];
  // the turn: the principal angle, unwrapped towards the turn the nested leaves make on their own (the camera turns the other way)
  let ang = Math.atan2(lE[1], lE[0]);
  const natural = 3.4643;   // measured: the 4th leaf's axis turns −3.46 rad (flipped) from the fern's
  while (ang - natural > Math.PI) ang -= 2 * Math.PI;
  while (natural - ang > Math.PI) ang += 2 * Math.PI;
  const v = eIO(u), mod = Math.exp(lerp(Math.log(s), Math.log(Math.hypot(lE[0], lE[1])), v)), th = ang * v;
  return { l: [mod * Math.cos(th), mod * Math.sin(th)], p: [lerp(p0[0], pE[0], v), lerp(p0[1], pE[1], v)] as P, aumento: mod / s };
};
// M^τ for the fern's third rule, M = [[0.2, −0.26], [0.23, 0.22]], τ real: M = Q·r·Rot(φ)·Q⁻¹ (complex eigenvalues),
// with Q = [u w] from the eigenvector u + i·w of λ = r·e^(iφ); returns [m00, m01, m10, m11]
const potenciaM = (tau: number): number[] => {
  const a = 0.21, b = Math.sqrt(0.0597);                     // λ = a ± i b  (trace 0.42, det 0.1038)
  const r = Math.hypot(a, b), phi = Math.atan2(b, a);
  // eigenvector of λ = a − i b, so that M·Q = Q·[[a, −b], [b, a]] (a rotation by +φ scaled by r) with Q = [u w]
  const u = [0.26, 0.2 - a], w = [0, -b];
  const det = u[0] * w[1] - w[0] * u[1];
  const Qi = [w[1] / det, -w[0] / det, -u[1] / det, u[0] / det];
  const rt = Math.pow(r, tau), c = Math.cos(tau * phi) * rt, sn = -Math.sin(tau * phi) * rt;
  // R = [[c, −sn], [sn, c]]; Q·R
  const QR = [u[0] * c + w[0] * sn, -u[0] * sn + w[0] * c, u[1] * c + w[1] * sn, -u[1] * sn + w[1] * c];
  return [QR[0] * Qi[0] + QR[1] * Qi[2], QR[0] * Qi[1] + QR[1] * Qi[3], QR[2] * Qi[0] + QR[3] * Qi[2], QR[2] * Qi[1] + QR[3] * Qi[3]];
};
let texH: { entero: HTMLCanvasElement; sinHoja: HTMLCanvasElement } | null = null;
const texturaHelecho = () => {
  if (texH) return texH;
  const n = 4_000_000, dE = new Float32Array(TEX.w * TEX.h), dS = new Float32Array(TEX.w * TEX.h);
  let sem = 4242, x = 0, y = 0;
  const azar = () => { sem = (Math.imul(sem, 1103515245) + 12345) | 0; return ((sem >>> 16) & 0x7fff) / 32768; };
  for (let i = -20; i < n; i++) {
    const r = azar();
    let nx: number, ny: number;
    if (r < 0.01) { nx = 0; ny = 0.16 * y; }
    else if (r < 0.86) { nx = 0.85 * x + 0.04 * y; ny = -0.04 * x + 0.85 * y + 1.6; }
    else if (r < 0.93) { nx = 0.2 * x - 0.26 * y; ny = 0.23 * x + 0.22 * y + 1.6; }
    else { nx = -0.15 * x + 0.28 * y; ny = 0.26 * x + 0.24 * y + 0.44; }
    x = nx; y = ny;
    if (i < 0) continue;
    const px = Math.round(TEX.x0 + x * TEX.s), py = Math.round(TEX.y0 - y * TEX.s);
    if (px < 0 || px >= TEX.w || py < 0 || py >= TEX.h) continue;
    dE[py * TEX.w + px] += 1;
    if (!(r >= 0.86 && r < 0.93)) dS[py * TEX.w + px] += 1;
  }
  const lienzo = (d: Float32Array) => {
    const c = document.createElement("canvas"); c.width = TEX.w; c.height = TEX.h;
    const g = c.getContext("2d")!, im = g.createImageData(TEX.w, TEX.h), p = im.data, ref = Math.log1p(6);
    for (let k = 0, j = 0; k < d.length; k++, j += 4) {
      const v = d[k] > 0 ? Math.min(1, 0.7 + Math.log1p(d[k]) / ref) : 0;
      p[j] = 190 * v; p[j + 1] = 235 * Math.pow(v, 0.8); p[j + 2] = 150 * v; p[j + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return c;
  };
  texH = { entero: lienzo(dE), sinHoja: lienzo(dS) };
  return texH;
};
const helechoEscena = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.helecho, K.foto + 0.4);
  if (a <= 0.01) return;
  const u = pr(t, K.helecho + 0.3, K.helechoZoom[0] - K.helecho - 0.6);
  const cuantos = Math.min(400000, Math.floor(Math.exp(Math.log(400000) * Math.pow(u, 1.4))));
  // the dive: toward the base of the first left leaf, the fixed point of the third rule (a turn of 49° and ×0.322);
  // the camera turns with it, so every level shows the same fern; each level is drawn with all its points
  const uz = pr(t, K.helechoZoom[0], K.helechoZoom[1] - K.helechoZoom[0]);   // (the camera eases it)
  if (!capaH) { capaH = document.createElement("canvas"); capaH.width = W; capaH.height = H; dens = new Float32Array(W * H); imgH = capaH.getContext("2d")!.createImageData(W, H); }
  const d = dens!, img = imgH!.data;
  d.fill(0);
  // the fern spans x ∈ [−2.2, 2.7], y ∈ [0, 10]: fit it to the frame's height
  const s = H * 0.086, ox = W / 2 - 0.25 * s, oy = H * 0.95;
  for (let i = 0; i < cuantos; i++) {
    const px = Math.round(ox + HELECHO[2 * i] * s), py = Math.round(oy - HELECHO[2 * i + 1] * s);
    if (px >= 0 && px < W && py >= 0 && py < H) d[py * W + px] += 1;
  }
  const ref = Math.log1p(2 + cuantos / 100000);
  for (let k = 0, j = 0; k < d.length; k++, j += 4) {
    const v = d[k] > 0 ? Math.min(1, 0.7 * Math.min(1, d[k] * 4) + Math.log1p(d[k]) / ref) : 0;
    img[j] = 190 * v; img[j + 1] = 235 * Math.pow(v, 0.8); img[j + 2] = 150 * v; img[j + 3] = 255;
  }
  const ch = capaH.getContext("2d")!;
  ch.putImageData(imgH!, 0, 0);
  // the dive: toward the base of the first left leaf, the fixed point of the third rule (a turn of 49° and ×0.322);
  // the camera turns with it, so every level shows the same fern. Each copy is the same high-resolution texture of the
  // fern (its first left leaf left out: the next copy goes there), so every level has the same light and density
  // the hand-over from the growing drawing to the dive's texture happens while the fern is still, slowly, before the
  // camera moves (a fast swap showed as a flash of light)
  const k = eSuave(pr(t, K.helechoZoom[0] - 1.6, 1.5));
  if (k > 0) {
    const tex = texturaHelecho();
    // the dive is a camera only: the fern never changes. Its first left leaf is the whole fern under the third rule
    // (z → P + M (z − P), M = [[0.2, −0.26], [0.23, 0.22]]), so the drawing is the fern with its nested leaves, copy j
    // drawn with the exact map M^j. The camera is a similarity (zoom, turn, slide) that goes, in one eased movement,
    // from the starting view to the one that sets the 4th nested leaf on the real frond of the photo, base on base,
    // tip on tip; then the drawing dissolves into the photo
    const Px = -0.60836502, Py = 1.87189237;
    const cam = camaraHelecho(uz, ox, oy, s);
    const tau = 4 * uz, k0 = Math.floor(tau), jMax = Math.min(6, k0 + 2);
    // (putImageData ignores alpha: the growing drawing, already in the layer, is faded to 1 − k by scaling its alpha)
    if (k < 1) { ch.globalCompositeOperation = "destination-in"; ch.fillStyle = `rgba(0,0,0,${1 - k})`; ch.fillRect(0, 0, W, H); }
    else ch.clearRect(0, 0, W, H);
    ch.globalCompositeOperation = "lighter";
    for (let j = Math.max(0, k0 - 1); j <= jMax; j++) {
      const Mj = potenciaM(j);
      // screen = cam.p + Λ·F·M^j·(v − P), Λ = the camera's complex factor as a matrix, F = diag(1, −1)
      const [lr, li] = cam.l;
      const FM = [Mj[0], Mj[1], -Mj[2], -Mj[3]];
      const L = [lr * FM[0] - li * FM[2], lr * FM[1] - li * FM[3], li * FM[0] + lr * FM[2], li * FM[1] + lr * FM[3]];
      if (Math.abs(L[0] * L[3] - L[1] * L[2]) < 4) continue;
      const tbx = -TEX.x0 / TEX.s - Px, tby = TEX.y0 / TEX.s - Py;
      ch.setTransform(L[0] / TEX.s, L[2] / TEX.s, -L[1] / TEX.s, -L[3] / TEX.s, cam.p[0] + L[0] * tbx + L[1] * tby, cam.p[1] + L[2] * tbx + L[3] * tby);
      // at the end only the frond that becomes the photo stays; the larger fronds around it go out
      ch.globalAlpha = k * (j < 4 ? 1 - eSuave(pr(t, K.helechoZoom[1] - 1.2, 1.0)) : 1);
      ch.drawImage(j < jMax ? tex.sinHoja : tex.entero, 0, 0);
    }
    ch.setTransform(1, 0, 0, 1, 0, 0); ch.globalAlpha = 1; ch.globalCompositeOperation = "source-over";
  }
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a;
  ctx.drawImage(capaH, 0, 0);
  ctx.filter = "blur(6px)"; ctx.globalAlpha = a * lerp(1.6, 0.7, Math.min(1, Math.max(0, (u - 0.6) / 0.4))); ctx.drawImage(capaH, 0, 0);
  ctx.restore();
  // while few, each point is a small light
  // while few, each point is a small light; they fade out gradually as the fern fills in (no sudden switch)
  const pocos = 1 - eSuave(Math.min(1, Math.max(0, (u - 0.6) / 0.3)));   // by time: the count grows exponentially
  if (pocos > 0.01) for (let i = 0; i < Math.min(cuantos, 3200); i++) luz(ctx, ox + HELECHO[2 * i] * s, oy - HELECHO[2 * i + 1] * s, (cuantos < 150 ? 10 : 7) * KT + 3, (cuantos < 150 ? 0.6 : 0.4) * a * pocos, VERDE);
  rotulo(ctx, "HELECHO DE BARNSLEY", "CUATRO REGLAS · MICHAEL BARNSLEY · 1988", a * eSuave(pr(t, K.helecho + 1.0, 0.6)) * (1 - eSuave(pr(t, K.helechoZoom[0], 0.6))));
  if (uz > 0.01) aum(ctx, camaraHelecho(uz, ox, oy, s).aumento, a * eSuave(pr(uz, 0.01, 0.05)) * (1 - eSuave(pr(t, K.foto - 0.6, 0.5))), true, true);
};

// ─── 3d · a real fern: one branch, enlarged, looks like the whole frond ─────────────────────────────────────────
// the photo (public/p2/fotos/helecho.jpg): a branch on the right, around (0.79, 0.62) of the image
const fotoEscena = (ctx: Ctx, t: number, foto: HTMLImageElement | null) => {
  const a = ventana(t, K.foto - 0.5, K.copo2 + 0.3, 0.9);
  if (a <= 0.01 || !foto) return;
  const z = Math.exp(Math.log(2.6) * eIO(pr(t, K.voz[21] + 2.5, 3.6)));
  const s0 = H / foto.height, s = s0 * z;
  // (mirrored, so its frond leans like the drawn fern it comes from)
  const fx = lerp(0.5, 0.2, eIO(pr(t, K.voz[21] + 2.5, 3.6))), fy = lerp(0.5, 0.64, eIO(pr(t, K.voz[21] + 2.5, 3.6)));
  const wI = foto.width * s, hI = foto.height * s, x0 = W / 2 - fx * wI, y0 = H / 2 - fy * hI;
  ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingQuality = "high";
  ctx.translate(x0 + wI, y0); ctx.scale(-1, 1); ctx.drawImage(foto, 0, 0, wI, hI);
  ctx.restore();
  // the branch, marked before the push
  const ab = ventana(t, K.voz[21] + 0.8, K.voz[21] + 3.0, 0.4);
  if (ab > 0.01) {
    const p0: P = [W / 2 - (0.5 - 0.02) * foto.width * s0, H / 2 - (0.5 - 0.55) * foto.height * s0];
    ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.9 * ab})`; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
    ctx.strokeRect(p0[0], p0[1], 0.36 * foto.width * s0, 0.2 * foto.height * s0); ctx.restore();
  }
  rotulo(ctx, "UN HELECHO REAL", "CADA RAMA SE PARECE AL HELECHO COMPLETO", a * eSuave(pr(t, K.foto + 0.6, 0.6)));
};

// ─── 4 · infinite border, finite area ───────────────────────────────────────────────────────────────────────────
const copoLargo = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.copo2, K.costa + 0.3);
  if (a <= 0.01) return;
  const L = K.nivelesL;
  let n = 0;
  for (const g of L) if (t >= g) n++;
  const nivel = Math.max(0, n - 1), u = n === 0 ? 1 : eIO(pr(t, L[n - 1], 0.45));
  const lado = H * 0.6, cx = W * 0.36, cy = H * 0.53;
  const A: P = [cx - lado / 2, cy - lado * Math.sqrt(3) / 6], B: P = [cx + lado / 2, cy - lado * Math.sqrt(3) / 6], C: P = [cx, cy + lado * Math.sqrt(3) / 3];
  const pts: P[] = [];
  for (const [p, q] of [[A, B], [B, C], [C, A]] as [P, P][]) { const s = koch(p, q, nivel, u); pts.push(...s.slice(0, -1)); }
  // the area, filled softly
  ctx.save(); ctx.globalAlpha = 0.16 * a; ctx.fillStyle = `rgb(${AZUL})`;
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.restore();
  trazo(ctx, pts, RGB.crema, a, 2, true);
  // the readouts: border and area at each step, side = 1 (area relative to the first triangle)
  const pasoN = Math.max(0, n - 1);
  const borde = 3 * Math.pow(4 / 3, pasoN), area = 1.6 - 0.6 * Math.pow(4 / 9, pasoN);
  const inf = eSuave(pr(t, K.infinito - 0.2, 0.6));
  const x = W * 0.66;
  texto(ctx, "PASO", x, H * 0.3, 18 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { esp: 6 });
  texto(ctx, inf > 0.5 ? "∞" : String(pasoN), x, H * 0.3 + 54, 50 * KT + 6, `rgba(${RGB.crema},${0.9 * a})`, { fam: SANS, peso: 600 });
  texto(ctx, "BORDE", x, H * 0.48, 18 * KT + 4, `rgba(${AMBAR},${0.7 * a})`, { esp: 6 });
  texto(ctx, inf > 0.5 ? "∞" : borde.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), x, H * 0.48 + 54, 50 * KT + 6, `rgba(${AMBAR},${0.95 * a})`, { fam: SANS, peso: 600 });
  texto(ctx, "ÁREA", x, H * 0.66, 18 * KT + 4, `rgba(${AZUL},${0.7 * a})`, { esp: 6 });
  texto(ctx, inf > 0.5 ? "8/5 = 1,60" : area.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), x, H * 0.66 + 54, 50 * KT + 6, `rgba(${AZUL},${0.95 * a})`, { fam: SANS, peso: 600 });
  texto(ctx, "× 4/3 EN CADA PASO", x + 320 * KT, H * 0.48 + 54, 16 * KT + 4, `rgba(${AMBAR},${0.55 * a * eSuave(pr(t, L[1], 0.6))})`, { esp: 4 });
};
// «Es la misma paradoja de la costa»: the coast of the opening, for a moment
const costaEscena = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.costa, K.dim + 0.2);
  if (a <= 0.01) return;
  const C = COSTA.costa as number[][];
  const xs = C.map((p) => p[1]), ys = C.map((p) => p[0]);
  const ex = [Math.min(...xs), Math.max(...xs)], ey = [Math.min(...ys), Math.max(...ys)];
  const s = Math.min((W * 0.8) / (ex[1] - ex[0]), (H * 0.6) / (ey[1] - ey[0]));
  const pts: P[] = C.map((p) => [W / 2 + (p[1] - (ex[0] + ex[1]) / 2) * s, H * 0.5 + (p[0] - (ey[0] + ey[1]) / 2) * s]);
  trazo(ctx, pts.slice(0, Math.max(2, Math.round(pts.length * eOut(pr(t, K.costa, 1.6))))), RGB.crema, a, 1.6);
  rotulo(ctx, "FIORDOS DE AYSÉN, CHILE", "LA MISMA COSTA DEL COMIENZO", a);
};

// ─── 5 · dimension, by counting copies ──────────────────────────────────────────────────────────────────────────
const dimension = (ctx: Ctx, t: number) => {
  const a = ventana(t, K.dim, K.vuelta + 0.3);
  if (a <= 0.01) return;
  const fin = 1 - eSuave(pr(t, K.regla2 - 0.2, 0.8));       // the four panels give way to the ruler
  // four panels: line ×2, square ×2, cube ×2, Koch ×3. In each, the original (small, on top); below, the enlarged
  // shape as a faint outline; copies of the original, the same size, fly into it one by one and the count goes up;
  // then the equation, copies = magnification ^ dimension, with the exponent lit
  const cols = [W * 0.14, W * 0.38, W * 0.62, W * 0.86];
  const titulos = ["LÍNEA", "CUADRADO", "CUBO", "CURVA DE KOCH"];
  // every shape is enlarged three times, the same for all: what changes is how many copies it takes
  const copiasN = [3, 9, 27, 4], aumN = [3, 3, 3, 3];
  const yT = H * 0.36, yO = H * 0.45, yE = H * 0.66, yEq = H * 0.86;
  for (let i = 0; i < 4; i++) {
    const t0 = K.panel[i];
    const ap = a * fin * eSuave(pr(t, t0 - 0.3, 0.6));
    if (ap <= 0.01) continue;
    const cx = cols[i], N = copiasN[i], f = aumN[i];
    const paso = [0.5, 0.3, 0.1, 0.5][i];
    const ac = (k: number) => eSuave(pr(t, t0 + 1.4 + paso * k, 0.4));
    const vuela = (k: number) => eIO(pr(t, t0 + 1.4 + paso * k - 0.45, 0.45));
    const ag = eSuave(pr(t, t0 + 0.7, 0.6));
    texto(ctx, titulos[i], cx, yT, 22 * KT + 6, `rgba(${RGB.crema},${0.9 * ap})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
    texto(ctx, `↓ × ${f}`, cx - W * 0.085, (yO + yE) / 2 + 6, 20 * KT + 4, `rgba(${AMBAR},${0.9 * ap * ag})`, { fam: SANS, peso: 600, alin: "center", esp: 2 });
    ctx.save();
    if (i === 0) {
      const lo = W * 0.045;
      trazo(ctx, [[cx - lo / 2, yO], [cx + lo / 2, yO]], RGB.crema, ap, 3);
      trazo(ctx, [[cx - 1.5 * lo, yE], [cx + 1.5 * lo, yE]], RGB.crema, ap * ag * 0.25, 3);
      for (let k = 0; k < 3; k++) {
        const v = vuela(k);
        if (v <= 0) continue;
        const x0 = lerp(cx - lo / 2, cx - 1.5 * lo + k * lo, v), y0 = lerp(yO, yE, v);
        trazo(ctx, [[x0 + 3, y0], [x0 + lo - 3, y0]], AMBAR, ap, 3);
      }
    } else if (i === 1) {
      const so = W * 0.03;
      ctx.strokeStyle = `rgba(${RGB.crema},${0.9 * ap})`; ctx.lineWidth = 2.2; ctx.strokeRect(cx - so / 2, yO - so / 2, so, so);
      ctx.strokeStyle = `rgba(${RGB.crema},${0.25 * ap * ag})`; ctx.strokeRect(cx - 1.5 * so, yE - 1.5 * so, 3 * so, 3 * so);
      for (let k = 0; k < 9; k++) {
        const v = vuela(k);
        if (v <= 0) continue;
        const tx = cx - 1.5 * so + (k % 3) * so, ty = yE - 1.5 * so + Math.floor(k / 3) * so;
        const x0 = lerp(cx - so / 2, tx, v), y0 = lerp(yO - so / 2, ty, v);
        ctx.fillStyle = `rgba(${AMBAR},${0.25 * ap})`; ctx.fillRect(x0 + 3, y0 + 3, so - 6, so - 6);
        ctx.strokeStyle = `rgba(${AMBAR},${0.95 * ap})`; ctx.strokeRect(x0 + 3, y0 + 3, so - 6, so - 6);
      }
    } else if (i === 2) {
      // a cube in isometric view, wireframe
      const e = W * 0.02;
      const iso = (x: number, y: number, z: number, ox: number, oy: number, s: number): P => [ox + (x - z) * 0.866 * s, oy + (x + z) * 0.5 * s - y * s];
      const cubo = (ox: number, oy: number, s: number, col: string, al: number, relleno = false) => {
        const v = (x: number, y: number, z: number) => iso(x, y, z, ox, oy, s);
        const caras: P[][] = [[v(0, 1, 0), v(1, 1, 0), v(1, 1, 1), v(0, 1, 1)], [v(1, 0, 0), v(1, 1, 0), v(1, 1, 1), v(1, 0, 1)], [v(0, 0, 1), v(1, 0, 1), v(1, 1, 1), v(0, 1, 1)]];
        if (relleno) for (const [cf, o2] of caras.map((c, j) => [c, [0.32, 0.2, 0.12][j]] as [P[], number])) {
          ctx.fillStyle = `rgba(${col},${o2 * al})`; ctx.beginPath(); cf.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
        }
        ctx.strokeStyle = `rgba(${col},${0.9 * al})`; ctx.lineWidth = 1.6;
        for (const cf of caras) { ctx.beginPath(); cf.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke(); }
      };
      const oyE = yE - e * 0.4;
      cubo(cx, yO - e * 0.2, e, RGB.crema, ap);
      cubo(cx, oyE, 3 * e, RGB.crema, ap * ag * 0.25);
      // the 27 copies, back to front so the nearer ones are drawn last
      const orden: [number, number, number][] = [];
      for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) orden.push([x, y, z]);
      orden.sort((p, q) => p[0] + p[1] + p[2] - (q[0] + q[1] + q[2]) || p[1] - q[1]);
      orden.forEach(([x, y, z], k) => {
        const v = vuela(k);
        if (v <= 0) return;
        const destino = iso(x, y, z, cx, oyE, e), origen: P = [cx, yO - e * 0.2];
        cubo(lerp(origen[0], destino[0], v), lerp(origen[1], destino[1], v), e * 0.96, AMBAR, ap, true);
      });
    } else {
      const lo = W * 0.045;
      const base = koch([-lo / 2, 0], [lo / 2, 0], 4);
      const pone = (dx: number, dy: number, ang: number): P[] => base.map(([x, y]) => [dx + x * Math.cos(ang) - y * Math.sin(ang), dy + x * Math.sin(ang) + y * Math.cos(ang)]);
      trazo(ctx, pone(cx, yO, 0), RGB.crema, ap, 2);
      const E0: P = [cx - 1.5 * lo, yE + 0.05 * H];
      const seg: [P, number][] = [];
      let p: P = E0;
      for (const ang of [0, -Math.PI / 3, Math.PI / 3, 0]) {
        const q: P = [p[0] + lo * Math.cos(ang), p[1] + lo * Math.sin(ang)];
        seg.push([[(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], ang]);
        p = q;
      }
      trazo(ctx, koch(E0, [cx + 1.5 * lo, E0[1]], 5), RGB.crema, ap * ag * 0.2, 2);
      for (let k = 0; k < 4; k++) {
        const v = vuela(k);
        if (v <= 0) continue;
        const [m, ang] = seg[k];
        trazo(ctx, pone(lerp(cx, m[0], v), lerp(yO, m[1], v), lerp(0, ang, v)), AMBAR, ap, 2.2);
      }
    }
    ctx.restore();
    // the count
    let cuenta = 0;
    for (let k = 0; k < N; k++) if (ac(k) > 0.5) cuenta = k + 1;
    if (cuenta > 0) texto(ctx, `${cuenta} ${cuenta === 1 ? "COPIA" : "COPIAS"}`, cx, H * 0.79, 20 * KT + 6, `rgba(${AMBAR},${0.95 * ap})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
    // the equation: copies = magnification ^ dimension, the exponent lit; for Koch, ? until the voice says 1,26
    const aeq = ap * eSuave(pr(t, t0 + 1.4 + paso * N + 0.2, 0.5));
    if (aeq > 0.01) {
      const exp = i < 3 ? String(i + 1) : t >= K.d126 ? "1,26" : "?";
      // N = 3^exp
      const tam = 34 * KT + 6;
      ctx.font = `600 ${tam}px "${SANS}"`;
      const base = `${N} = ${f}`, wb = ctx.measureText(base).width;
      ctx.font = `600 ${tam * 0.62}px "${SANS}"`;
      const we = ctx.measureText(exp).width, x0 = cx - (wb + we) / 2;
      texto(ctx, base, x0, yEq, tam, `rgba(${RGB.crema},${0.95 * aeq})`, { fam: SANS, peso: 600, esp: 0 });
      const brilla = i < 3 ? 1 : eSuave(pr(t, K.d126, 0.4));
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(8px)";
      texto(ctx, exp, x0 + wb + 2, yEq - tam * 0.42, tam * 0.62, `rgba(${AMBAR},${0.7 * aeq * brilla})`, { fam: SANS, peso: 600, esp: 0 });
      ctx.restore();
      texto(ctx, exp, x0 + wb + 2, yEq - tam * 0.42, tam * 0.62, `rgba(${AMBAR},${aeq})`, { fam: SANS, peso: 600, esp: 0 });
      const dl = i < 3 ? `DIMENSIÓN ${i + 1}` : t >= K.d126 ? "DIMENSIÓN 1,26" : "DIMENSIÓN ?";
      texto(ctx, dl, cx, yEq + 42, 15 * KT + 4, `rgba(${AMBAR},${0.8 * aeq})`, { alin: "center", esp: 5 });
    }
  }
  // the rule, in words, between the cube and Koch
  const ar0 = a * fin * ventana(t, K.regla - 0.2, K.panel[3] + 0.8, 0.5);
  if (ar0 > 0.01) {
    ctx.save(); ctx.fillStyle = `rgba(2,3,6,${0.8 * ar0})`; ctx.fillRect(0, H * 0.93 - 40, W, 64); ctx.restore();
    texto(ctx, "COPIAS  =  AUMENTO ^ DIMENSIÓN", W / 2, H * 0.95, 26 * KT + 6, `rgba(${RGB.crema},${0.95 * ar0})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
  }
  // the ruler of the chapter's title, back: 1 the line, 2 the plane, and Koch in between
  const ar = a * eSuave(pr(t, K.regla2, 0.8));
  if (ar > 0.01) {
    const y = H * 0.56, x0 = W * 0.1, x1 = W * 0.9, X = (v: number) => lerp(x0, x1, (v - 0.8) / 1.4);
    const L = eOut(pr(t, K.regla2, 1.0));
    trazo(ctx, [[x0, y], [lerp(x0, x1, L), y]], RGB.crema, ar, 1.6);
    for (let k = 8; k <= 22; k++) {
      const v = k / 10, x = X(v);
      if (x > lerp(x0, x1, L)) continue;
      const h = k % 10 === 0 ? 26 : k % 5 === 0 ? 15 : 8;
      ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${(k % 10 === 0 ? 0.9 : 0.5) * ar})`; ctx.lineWidth = k % 10 === 0 ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x, y + h / 2); ctx.stroke(); ctx.restore();
      if (k % 10 === 0) texto(ctx, String(v), x, y + 46, 20 * KT + 4, `rgba(${RGB.crema},${0.7 * ar})`, { alin: "center", esp: 0 });
    }
    const marcas: [number, string, string, number][] = [[1, "UNA LÍNEA", RGB.crema, K.voz[34]], [2, "UN PLANO", RGB.crema, K.voz[34] + 1.2], [Math.log(4) / Math.log(3), "KOCH · 1,26", AMBAR, K.voz[35] - 0.6]];
    for (const [v, s, col, tm] of marcas) {
      const am = ar * eSuave(pr(t, tm, 0.6));
      if (am <= 0.01) continue;
      luz(ctx, X(v), y, 26 * KT + 6, am, col === AMBAR ? AMBAR : AZUL);
      texto(ctx, s, X(v), y - 40, 20 * KT + 4, `rgba(${col},${0.9 * am})`, { alin: "center", esp: 4 });
    }
  }
};

// the key terms, written large at the top when the voice says them, on a dark band so nothing crosses them
const terminos = (ctx: Ctx, t: number) => {
  for (const [term, linea, t0, t1] of K.terminos as [string, string, number, number][]) {
    const a = ventana(t, t0, t1, 0.5);
    if (a <= 0.01) continue;
    const banda = ctx.createLinearGradient(0, 0, 0, H * 0.32);
    banda.addColorStop(0, `rgba(2,3,6,${0.85 * a})`); banda.addColorStop(0.7, `rgba(2,3,6,${0.55 * a})`); banda.addColorStop(1, "rgba(2,3,6,0)");
    ctx.fillStyle = banda; ctx.fillRect(0, 0, W, H * 0.32);
    const tam = (term.length > 14 ? 52 : 82) * KT + 8, esp = lerp(40, term.length > 14 ? 12 : 24, eOut(pr(t, t0, 1.2)));
    const y = H * 0.155;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(14px)";
    texto(ctx, term, W / 2 + esp / 2, y, tam, `rgba(${RGB.crema},${0.4 * a})`, { fam: SANS, peso: 600, alin: "center", esp });
    ctx.restore();
    texto(ctx, term, W / 2 + esp / 2, y, tam, `rgba(${RGB.crema},${0.97 * a})`, { fam: SANS, peso: 600, alin: "center", esp });
    // a thin rule that draws itself under the term, and the line under it
    const L = eOut(pr(t, t0 + 0.2, 0.9)) * W * 0.22;
    ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.85 * a})`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(W / 2 - L, y + 30); ctx.lineTo(W / 2 + L, y + 30); ctx.stroke(); ctx.restore();
    if (linea) texto(ctx, linea, W / 2 + 3, y + 66, 18 * KT + 4, `rgba(${AMBAR},${0.85 * a * eSuave(pr(t, t0 + 0.6, 0.6))})`, { alin: "center", esp: 6 });
  }
};

// ─── the equations of each fractal, in a panel on the right ─────────────────────────────────────────────────────
// [title, lines] — a line starting with «·» is a note; the panel sits on a dark box so the figures never cross it
type Panel = { t0: number; t1: number; titulo: string; lineas: string[] };
const PANELES: Panel[] = [
  { t0: K.copo + 0.4, t1: K.copo + 7.4, titulo: "CURVA DE KOCH", lineas: [
    "REGLA: CADA TRAMO SE REEMPLAZA", "POR 4 TRAMOS DE 1/3 DE SU LARGO", "",
    "PASO n:  4ⁿ TRAMOS DE LARGO (1/3)ⁿ", "LARGO:   (4/3)ⁿ  →  ∞", "",
    "D = log 4 / log 3 ≈ 1,262"] },
  { t0: K.sier + 0.6, t1: K.sier + 7.6, titulo: "TRIÁNGULO DE SIERPIŃSKI", lineas: [
    "TRES REGLAS, CADA UNA A LA MITAD:", "",
    "f₁(p) = p / 2", "f₂(p) = p / 2 + (½, 0)", "f₃(p) = p / 2 + (¼, √3/4)", "",
    "PASO n:  3ⁿ TRIÁNGULOS", "D = log 3 / log 2 ≈ 1,585"] },
  { t0: K.helecho + 0.6, t1: K.helecho + 8.6, titulo: "HELECHO DE BARNSLEY", lineas: [
    "CUATRO REGLAS, ELEGIDAS AL AZAR:", "",
    "f₁: x' = 0          y' = 0,16 y          1 %",
    "f₂: x' = 0,85x+0,04y   y' = −0,04x+0,85y+1,6   85 %",
    "f₃: x' = 0,20x−0,26y   y' = 0,23x+0,22y+1,6    7 %",
    "f₄: x' = −0,15x+0,28y  y' = 0,26x+0,24y+0,44   7 %", "",
    "· f₃ ES LA PRIMERA HOJA: EL HELECHO ENTERO"] },
];
const panelEcuaciones = (ctx: Ctx, t: number) => {
  for (const pnl of PANELES) {
    const a = ventana(t, pnl.t0, pnl.t1, 0.6);
    if (a <= 0.01) continue;
    const tam = 15 * KT + 4, alto = 46 + pnl.lineas.length * (tam + 9) + 18;
    ctx.font = `500 ${tam}px "${MONO}"`;
    const ancho = Math.max(...pnl.lineas.map((l) => ctx.measureText(l).width + l.length * 1)) + 64;
    const x1 = W - 60, x0 = x1 - ancho, y0 = H * 0.24;
    ctx.save(); ctx.fillStyle = `rgba(2,3,6,${0.78 * a})`; ctx.fillRect(x0, y0, ancho, alto);
    ctx.strokeStyle = `rgba(${AMBAR},${0.35 * a})`; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, ancho - 1, alto - 1); ctx.restore();
    texto(ctx, pnl.titulo, x0 + 28, y0 + 34, 17 * KT + 4, `rgba(${AMBAR},${0.95 * a})`, { fam: SANS, peso: 600, esp: 3 });
    pnl.lineas.forEach((l, i) => {
      const nota = l.startsWith("·");
      texto(ctx, l, x0 + 28, y0 + 64 + i * (tam + 9), tam, `rgba(${nota ? AMBAR : RGB.crema},${(nota ? 0.8 : 0.88) * a})`, { esp: 1 });
    });
  }
};

// all of it: the scenes overlap only in their fades
export const dibujarExplicacion = (ctx: Ctx, t: number, foto: HTMLImageElement | null) => {
  terminos(ctx, t);
  panelEcuaciones(ctx, t);
  // its name, when the rabbit first appears whole
  rotulo(ctx, "EL CONEJO DE DOUADY", "UN FRACTAL · UN CONJUNTO DE JULIA", ventana(t, K.revela + 1.6, K.revela + 6.5, 0.6));
  // the rabbit's own equation, at the end
  const ac = ventana(t, K.barrido[1] - 0.5, K.barrido[1] + 6.0, 0.6);
  if (ac > 0.01) {
    const x = 84, y = H * 0.8;
    texto(ctx, "z → z² + c", x, y, 40 * KT + 6, `rgba(${RGB.crema},${0.95 * ac})`, { fam: MONO, peso: 500, esp: 2 });
    texto(ctx, "c = −0,123 + 0,745 i", x, y + 44, 18 * KT + 4, `rgba(${AMBAR},${0.9 * ac})`, { esp: 3 });
    texto(ctx, "SE QUEDA: AZUL  ·  ESCAPA: COLOR CÁLIDO", x, y + 80, 14 * KT + 4, `rgba(${RGB.crema},${0.65 * ac})`, { esp: 3 });
  }
  if (t < K.circulo[0] - 0.1 || t > K.vuelta + 0.5) return;
  circulo(ctx, t);
  kochEscena(ctx, t);
  sierpinski(ctx, t);
  helechoEscena(ctx, t);
  fotoEscena(ctx, t, foto);
  copoLargo(ctx, t);
  costaEscena(ctx, t);
  dimension(ctx, t);
};
// how visible the rabbit's plane is (it leaves for the circle and for the explanation, and comes back)
export const planoVisible = (t: number) => {
  if (t < K.circulo[0] + 0.6) return 1 - eSuave(pr(t, K.circulo[0] - 0.2, 0.7));
  if (t < K.zoomA[1] + 0.5) return Math.min(eSuave(pr(t, K.zoomA[0] - 0.3, 0.6)), 1 - eSuave(pr(t, K.zoomA[1], 0.5)));
  return eSuave(pr(t, K.vuelta, 0.9));
};
