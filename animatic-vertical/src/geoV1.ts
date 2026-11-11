// LA FRONTERA · «Deleite» v1 geometry (rejected as a film on its own, kept for its figures, shown in panels in part 2).
// Movement 1 · Geometry: each figure is born out of the previous one, one camera per shot, on a 100 BPM grid.
//   Cantor (cuts) → its first bar becomes a Koch curve → the snowflake closes → infinite ×3 dive into a vertex →
//   a triangle opens there: Sierpiński, ×2 dive into a corner → through its central hole: the carpet, ×3 dive →
//   through its central square: the dragon unfolds → bands: Hilbert, traced → iris: the Pythagoras tree grows (pan up)
//   → Vicsek, turning, on the last hit.
// Every infinite dive is a true loop (self-similarity): the picture after one period is the picture before it.
const D = { bpm: 100, t0: 0.4, total: 21.6, golpes: [] as number[] };
import FORMATO from "./formato.json";
import { PALETAS } from "./fractalTeaser";
import { RGB, cl, eIO, eOut, eSuave, lerp, pr } from "./theme";

const W = FORMATO.W;
const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
type P = [number, number];
const TAU = Math.PI * 2;

// the beat grid
const BEAT = 60 / D.bpm;
const B = (k: number) => D.t0 + k * BEAT;
const enBeats = (t: number) => (t - D.t0) / BEAT;
// critically damped spring: 1 − (1 + ωt)·e^(−ωt), never overshoots
const resorte = (t: number, w = 16) => (t <= 0 ? 0 : 1 - (1 + w * t) * Math.exp(-w * t));
const R = (t: number, k: number, w = 16) => resorte(t - B(k) + 0.05, w);

// palettes: [pos, r, g, b] in 0..1
const pal = (k: number, u: number, a = 1) => {
  const p = PALETAS[k];
  u = ((u % 1) + 1) % 1;
  let i = 0;
  while (i < p.length - 2 && p[i + 1][0] < u) i++;
  const [u0, r0, g0, b0] = p[i], [u1, r1, g1, b1] = p[i + 1];
  const x = cl((u - u0) / Math.max(1e-6, u1 - u0));
  return `rgba(${Math.round(255 * lerp(r0, r1, x))},${Math.round(255 * lerp(g0, g1, x))},${Math.round(255 * lerp(b0, b1, x))},${a})`;
};
// bright tones only (the palettes also hold their dark background)
const brillo = (k: number, u: number, a = 1) => pal(k, 0.42 + 0.36 * (((u % 1) + 1) % 1), a);

// ─── camera: world → screen (zoom about a world point placed at a screen point) ─────────────────────────────────
type Cam = { x: number; y: number; s: number; rot?: number; sx?: number; sy?: number };
const aPant = (c: Cam, p: P): P => {
  const r = c.rot ?? 0, dx = p[0] - c.x, dy = p[1] - c.y, co = Math.cos(r), si = Math.sin(r);
  return [(c.sx ?? W / 2) + c.s * (dx * co - dy * si), (c.sy ?? H / 2) + c.s * (dx * si + dy * co)];
};
const fuera = (a: P, b: P, m = 40) => Math.max(a[0], b[0]) < -m || Math.min(a[0], b[0]) > W + m || Math.max(a[1], b[1]) < -m || Math.min(a[1], b[1]) > H + m;

// a glowing stroke of a path already built with ctx.beginPath()
const brilla = (ctx: Ctx, col: string, glow: string, w: number) => {
  ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = glow; ctx.lineWidth = w * 6; ctx.stroke();
  ctx.lineWidth = w * 2.4; ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  ctx.restore();
};
const clipPoli = (ctx: Ctx, pts: P[]) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.clip(); };

// ─── 1 · Cantor: the bar and its cuts ──────────────────────────────────────────────────────────────────────────
const BAR: [P, P] = [[-0.62, 0], [0.62, 0]];          // world units: the frame is 2 units tall
const camBase: Cam = { x: 0, y: 0.34, s: H * 0.62 };
const cantor = (ctx: Ctx, t: number) => {
  const sale = eIO(pr(t, B(3.6), BEAT * 0.5));
  const nace = R(t, 0, 14);
  for (let n = 0; n <= 4; n++) {
    const tn = n === 4 ? 3.5 : n;
    if (t < B(tn) - 0.05) continue;
    const e = R(t, tn, 20), y = n * 0.17;
    const yy = n === 0 ? y + (0 - y) * sale * 0 : y + 0.6 * sale;           // the cut rows sink away; the first bar stays
    const a = n === 0 ? 1 : (1 - sale) * e;
    if (a <= 0.01) continue;
    const alto = n === 0 ? lerp(0.05, 0.004, sale) : 0.05 * e;
    const segs: [number, number][] = [[0, 1]];
    for (let k = 0; k < n; k++) { const s2: [number, number][] = []; for (const [p, q] of segs) { const d = (q - p) / 3; s2.push([p, p + d], [q - d, q]); } segs.splice(0, segs.length, ...s2); }
    for (const [p, q] of segs) {
      const x0 = lerp(BAR[0][0], BAR[1][0], n === 0 ? 0.5 - 0.5 * nace : p), x1 = lerp(BAR[0][0], BAR[1][0], n === 0 ? 0.5 + 0.5 * nace : q);
      const A = aPant(camBase, [x0, yy - alto / 2]), Bq = aPant(camBase, [x1, yy + alto / 2]);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = brillo(0, 0.1 + 0.18 * n, 0.22 * a); ctx.fillRect(A[0] - 6, A[1] - 6, Bq[0] - A[0] + 12, Bq[1] - A[1] + 12);
      ctx.restore();
      ctx.fillStyle = n === 0 ? `rgba(${RGB.crema},${a})` : brillo(0, 0.1 + 0.18 * n, 0.95 * a); ctx.fillRect(A[0], A[1], Math.max(1.5, Bq[0] - A[0]), Bq[1] - A[1]);
    }
  }
};

// ─── zoom toward a fixed point P: at z = 1 the figure's centre G sits at O; P ends exactly at O (u = 1) ───────────
const zoomCam = (G: P, Pp: P, S: number, z: number, u: number, O: P): Cam => {
  const k = (1 - eSuave(u)) / z;
  return { x: Pp[0] + (G[0] - Pp[0]) * k, y: Pp[1] + (G[1] - Pp[1]) * k, s: S * z, sx: O[0], sy: O[1] };
};
// the log of the zoom along a dive: eases in, then a constant rate (hypnotic, never jerky)
const lzDive = (u: number, L: number) => { const a = 0.18, g = (x: number) => (x < a ? (x * x) / (2 * a) : x - a / 2); return (L * g(cl(u))) / g(1); };

// ─── 2 · Koch: the bar grows bumps; the snowflake closes; a dive into its bottom vertex ─────────────────────────
// one Koch side from a to b (bumps to the left of a→b), level n, the last level's bumps at height h; culled to the screen
const kochLado = (out: P[], a: P, b: P, n: number, h: number, cam: Cam) => {
  const A = aPant(cam, a), Bp = aPant(cam, b);
  const len = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]);
  if (n <= 0 || len < 1.6 || fuera(A, Bp, len * 0.35)) { out.push(Bp); return; }
  const dx = (b[0] - a[0]) / 3, dy = (b[1] - a[1]) / 3;
  const p1: P = [a[0] + dx, a[1] + dy], p3: P = [a[0] + 2 * dx, a[1] + 2 * dy];
  const k = n === 1 ? h : 1;
  const p2: P = [a[0] + 1.5 * dx + (k * dy * Math.sqrt(3)) / 2, a[1] + 1.5 * dy - (k * dx * Math.sqrt(3)) / 2];
  kochLado(out, a, p1, n - 1, h, cam); kochLado(out, p1, p2, n - 1, h, cam); kochLado(out, p2, p3, n - 1, h, cam); kochLado(out, p3, b, n - 1, h, cam);
};
const rota = (p: P, c: P, a: number): P => { const co = Math.cos(a), si = Math.sin(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * si, c[1] + x * si + y * co]; };
// the snowflake under the bar: L0 (left), R0 (right), V0 (below)
const L0 = BAR[0], R0 = BAR[1], LADO = R0[0] - L0[0];
const V0: P = [0, (LADO * Math.sqrt(3)) / 2];
const CENTRO: P = [0, V0[1] / 3];
const kochCam = (t: number): Cam => {
  const rc = R(t, 8, 9);
  const s1 = H * 0.55;
  const base: Cam = { x: lerp(camBase.x, CENTRO[0], rc), y: lerp(camBase.y, CENTRO[1], rc), s: lerp(camBase.s, s1, rc) };
  const kb = enBeats(t);
  if (kb < 8.6) return base;
  const u = cl((kb - 8.6) / 2.0);
  return zoomCam([base.x, base.y], V0, base.s, Math.exp(lzDive(u, Math.log(30))), Math.min(1, u * 1.4), [W / 2, H / 2]);
};
const koch = (ctx: Ctx, t: number, cam: Cam) => {
  const kb = enBeats(t);
  const nivel = Math.min(5, Math.max(0, Math.floor(kb - 4 + 0.05) + 1));
  const h = nivel === 0 ? 0 : resorte(t - B(3 + nivel) + 0.05, 18);
  const cierra = R(t, 8, 14);
  const prof = Math.min(14, 5 + Math.max(0, Math.ceil(Math.log(cam.s / (H * 0.55)) / Math.log(3))) + 2);
  const n = cierra > 0 ? prof : nivel, hh = cierra > 0 ? 1 : h;
  // the other two sides swing down about the ends of the bar
  const v2 = rota(L0, R0, (-Math.PI / 3) * cierra), v3 = rota(R0, L0, (Math.PI / 3) * cierra);
  const lado = (a: P, b: P) => { const pts: P[] = [aPant(cam, a)]; kochLado(pts, a, b, n, hh, cam); return pts; };
  const s1 = lado(L0, R0);
  const linea = (pts: P[], al: number) => {
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    brilla(ctx, `rgba(${RGB.crema},${0.95 * al})`, pal(0, 0.66, 0.1 * al), 2.2);
  };
  if (cierra <= 0.001) { linea(s1, 1); return; }
  const s2 = lado(R0, v2), s3 = lado(v3, L0);
  const rell = R(t, 8.3, 10);
  if (rell > 0.01) {
    ctx.save(); ctx.beginPath(); [...s1, ...s2, ...s3].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    const c = aPant(cam, CENTRO), r = cam.s * LADO * 0.62;
    const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], Math.max(10, r));
    g.addColorStop(0, pal(0, 0.16, 0.6 * rell)); g.addColorStop(0.75, pal(0, 0.3, 0.7 * rell)); g.addColorStop(1, pal(0, 0.55, 0.8 * rell));
    ctx.fillStyle = g; ctx.fill(); ctx.restore();
  }
  linea(s1, 1); linea(s2, eSuave(cl(cierra * 3))); linea(s3, eSuave(cl(cierra * 3)));
};

// ─── 3 · Sierpiński triangle: grows out of the vertex, dives toward a hole three levels down the left corner ──────
const ST_A: P = [0, 0], ST_B: P = [1, 0], ST_C: P = [0.5, -Math.sqrt(3) / 2];
const ST_G: P = [0.5, -Math.sqrt(3) / 6];
const sierp = (ctx: Ctx, a: P, b: P, c: P, n: number, cam: Cam, fase: number) => {
  const A = aPant(cam, a), Bp = aPant(cam, b), Cp = aPant(cam, c);
  const xs = [A[0], Bp[0], Cp[0]], ys = [A[1], Bp[1], Cp[1]];
  if (Math.max(...xs) < 0 || Math.min(...xs) > W || Math.max(...ys) < 0 || Math.min(...ys) > H) return;
  const tam = Math.max(...xs) - Math.min(...xs);
  if (tam < 9 || n > 18) {
    ctx.fillStyle = brillo(0, fase + n * 0.06, 1);
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(Bp[0], Bp[1]); ctx.lineTo(Cp[0], Cp[1]); ctx.closePath(); ctx.fill();
    return;
  }
  const ab: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], bc: P = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2], ca: P = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
  sierp(ctx, a, ab, ca, n + 1, cam, fase); sierp(ctx, ab, b, bc, n + 1, cam, fase); sierp(ctx, ca, bc, c, n + 1, cam, fase);
};
// the hole the camera dives through: the central hole of the corner triangle three levels down (side 1/8)
const PROF_T = 1 / 8;
const HUECO: P[] = [[0.25 * PROF_T, (-Math.sqrt(3) / 4) * PROF_T], [0.75 * PROF_T, (-Math.sqrt(3) / 4) * PROF_T], [0.5 * PROF_T, 0]];
const HUECO_C: P = [0.5 * PROF_T, (-Math.sqrt(3) / 6) * PROF_T];
const S_T = H * 1.05, LZ_T = Math.log(64);
const sierpCam = (t: number): Cam => {
  const kb = enBeats(t);
  const crece = 0.12 + 0.88 * eOut(cl((kb - 10) / 0.9));
  const u = cl((kb - 10.5) / 4.5);
  return zoomCam(ST_G, HUECO_C, S_T * crece, Math.exp(lzDive(u, LZ_T)), u, [W / 2, H / 2]);
};
const triangulo = (ctx: Ctx, t: number, cam: Cam) => {
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  sierp(ctx, ST_A, ST_B, ST_C, 0, cam, 0.05 * t);
};

// ─── 4 · Sierpiński carpet: born inside the triangle's hole, dives toward a hole two levels down its corner ───────
const alfombra = (ctx: Ctx, x: number, y: number, l: number, n: number, cam: Cam, fase: number) => {
  const A = aPant(cam, [x, y]), Bp = aPant(cam, [x + l, y + l]);
  if (Bp[0] < 0 || A[0] > W || Bp[1] < 0 || A[1] > H) return;
  const tam = Bp[0] - A[0];
  const h0 = aPant(cam, [x + l / 3, y + l / 3]), h1 = aPant(cam, [x + (2 * l) / 3, y + (2 * l) / 3]);
  ctx.fillStyle = "#020306"; ctx.fillRect(h0[0], h0[1], h1[0] - h0[0], h1[1] - h0[1]);
  ctx.strokeStyle = brillo(2, fase + n * 0.09, 0.9); ctx.lineWidth = Math.max(1, Math.min(2.5, tam / 120));
  ctx.strokeRect(h0[0], h0[1], h1[0] - h0[0], h1[1] - h0[1]);
  if (tam < 14 || n > 12) return;
  const d = l / 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== 1 || j !== 1) alfombra(ctx, x + i * d, y + j * d, d, n + 1, cam, fase);
};
const AC_G: P = [0.5, 0.5], AC_P: P = [1 / 18, 1 / 18], AC_H = 1 / 27;
// the carpet's scale at beat 15: it fits in the triangle's hole (0,3 of the hole's side)
const holeLado = (t: number) => sierpCam(t).s * 0.5 * PROF_T;
const S_C = 0.3 * holeLado(B(15)), LZ_C = Math.log((W * 1.12) / (AC_H * S_C));
const alfCam = (t: number): Cam => {
  const kb = enBeats(t);
  if (kb < 15) { const tc = sierpCam(t), c = aPant(tc, HUECO_C); return { x: 0.5, y: 0.5, s: 0.3 * holeLado(t), sx: c[0], sy: c[1] }; }
  const u = cl((kb - 15.2) / 4.3);
  return zoomCam(AC_G, AC_P, S_C, Math.exp(lzDive(u, LZ_C)), u, [W / 2, H / 2]);
};
const carpeta = (ctx: Ctx, t: number, cam: Cam) => {
  const A = aPant(cam, [0, 0]), Bp = aPant(cam, [1, 1]);
  const g = ctx.createLinearGradient(A[0], A[1], Bp[0], Bp[1]);
  g.addColorStop(0, pal(2, 0.5, 1)); g.addColorStop(0.5, pal(2, 0.62, 1)); g.addColorStop(1, pal(2, 0.4, 1));
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = g; ctx.fillRect(A[0], A[1], Bp[0] - A[0], Bp[1] - A[1]);
  alfombra(ctx, 0, 0, 1, 0, cam, 0.04 * t);
};

// ─── 5 · the dragon: every level folds a copy of the curve 90° about its end ───────────────────────────────────
const DRAGON: P[][] = (() => {
  const niveles: P[][] = [[[0, 0], [1, 0]]];
  for (let n = 1; n <= 13; n++) {
    const prev = niveles[n - 1], fin = prev[prev.length - 1];
    const copia = prev.slice(0, -1).reverse().map((p) => rota(p, fin, Math.PI / 2));
    niveles.push([...prev, ...copia]);
  }
  return niveles;
})();
const dragon = (ctx: Ctx, t: number, marco: { x: number; y: number; w: number; h: number } | null) => {
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  const kb = enBeats(t) - 18.5;
  const f = cl(kb / 5.0) * 12;                             // levels 0 → 12 in four beats
  const n = Math.min(12, Math.floor(f)), fr = n >= 12 ? 1 : resorte((f - n) * BEAT * 4 / 3 * 1, 22);
  const prev = DRAGON[n], fin = prev[prev.length - 1];
  const ang = (Math.PI / 2) * fr;
  const copia = n < 12 ? prev.slice(0, -1).reverse().map((p) => rota(p, fin, ang)) : [];
  const pts = [...prev, ...copia];
  // the frame follows the bounding box of the final shape of this level (eased), and turns slowly
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of DRAGON[Math.min(13, n + 1)]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const s = Math.min((W * 0.86) / (x1 - x0), (H * 0.86) / (y1 - y0));
  const cam: Cam = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, s, rot: 0.02 * (t - B(18.5)) };
  if (marco) { cam.s *= marco.w / W; cam.sx = marco.x; cam.sy = marco.y; }
  // drawn in runs, the colour running along the curve
  const corridas = 24, m = pts.length;
  for (let k = 0; k < corridas; k++) {
    const a = Math.floor((k * (m - 1)) / corridas), b = Math.floor(((k + 1) * (m - 1)) / corridas);
    ctx.beginPath();
    for (let i = a; i <= b; i++) { const q = aPant(cam, pts[i]); if (i === a) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); }
    brilla(ctx, brillo(1, k / corridas + 0.03 * t, 0.95), brillo(1, k / corridas, 0.07), Math.max(1.6, Math.min(7, cam.s * 0.45)));
  }
};

// ─── 6 · Hilbert: the curve, order by order, traced by a point of light; a slow pan ─────────────────────────────
const hilbert = (orden: number): P[] => {
  const n = 1 << orden, out: P[] = [];
  for (let d = 0; d < n * n; d++) {
    let x = 0, y = 0, tt = d;
    for (let s = 1; s < n; s *= 2) {
      const rx = 1 & (tt / 2), ry = 1 & (tt ^ rx);
      if (ry === 0) { if (rx === 1) { x = s - 1 - x; y = s - 1 - y; } const tmp = x; x = y; y = tmp; }
      x += s * rx; y += s * ry; tt = Math.floor(tt / 4);
    }
    out.push([(x + 0.5) / n, (y + 0.5) / n]);
  }
  return out;
};
const HIL = [1, 2, 3, 4, 5, 6].map(hilbert);
const hilbertEsc = (ctx: Ctx, t: number) => {
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  const kb = enBeats(t) - 25;
  const lado = H * 0.82, panX = lerp(W * 0.56, W * 0.44, eIO(cl(kb / 3))), y0 = (H - lado) / 2;
  // orders 1..6, one per half beat; the newest is traced, the previous one dims away under it
  const f = cl(kb / 3) * 6;
  const o = Math.min(5, Math.floor(f)), traza = eOut(cl((f - o) * 1.6));
  for (const [k, a] of [[o - 1, 1 - traza], [o, 1]] as [number, number][]) {
    if (k < 0 || a <= 0.01) continue;
    const pts = HIL[k], m = Math.max(2, Math.round(pts.length * (k === o ? traza : 1)));
    ctx.beginPath();
    for (let i = 0; i < m; i++) { const x = panX - lado / 2 + pts[i][0] * lado, y = y0 + pts[i][1] * lado; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    brilla(ctx, brillo(0, 0.2 + 0.1 * k + 0.02 * t, 0.95 * a), brillo(0, 0.3, 0.08 * a), Math.max(1.0, Math.min(6, (lado / (1 << (k + 1))) * 0.22)));
    if (k === o && traza < 1) { const q = pts[m - 1]; luzP(ctx, panX - lado / 2 + q[0] * lado, y0 + q[1] * lado, 26, 0.9); }
  }
};
const luzP = (ctx: Ctx, x: number, y: number, r: number, a: number) => {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.3, `rgba(255,214,150,${0.5 * a})`); g.addColorStop(1, "rgba(255,190,120,0)");
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
};

// ─── 7 · the Pythagoras tree: it grows a level every third of a beat; the camera pans up with it ─────────────────
const arbol = (ctx: Ctx, t: number) => {
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  const kb = enBeats(t) - 28;
  const f = cl(kb / 3) * 12;
  const sube = eIO(cl(kb / 3.2));
  const lado = H * 0.155, base: P = [W / 2 - lado / 2, H * 0.97];
  // a slow push-in about the root as the crown fills the frame
  const zoom = 1 + 0.12 * sube;
  ctx.save(); ctx.translate(W / 2, H * 0.97); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H * 0.97);
  const viento = 0.07 * Math.sin(0.9 * (t - B(28)));
  const rama = (p: P, v: P, n: number) => {
    // p: bottom-left corner, v: bottom edge vector
    const g = cl(f - n);
    if (g <= 0) return;
    const nv: P = [v[1], -v[0]];
    const q1: P = [p[0] + v[0], p[1] + v[1]], q2: P = [q1[0] + nv[0] * g, q1[1] + nv[1] * g], q3: P = [p[0] + nv[0] * g, p[1] + nv[1] * g];
    if (Math.max(p[1], q1[1], q2[1], q3[1]) < -40 && n > 3) return;
    ctx.fillStyle = brillo(2, 0.1 + n * 0.055 + 0.02 * t, 0.9 * eSuave(g));
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.lineTo(q3[0], q3[1]); ctx.closePath(); ctx.fill();
    if (g < 1 || n >= 12) return;
    const a = Math.PI / 4 + viento * (n % 2 ? 1 : -1), co = Math.cos(a), si = Math.sin(a);
    const vl: P = [(v[0] * co + nv[0] * si) * Math.SQRT1_2, (v[1] * co + nv[1] * si) * Math.SQRT1_2];
    const tip: P = [q3[0] + vl[0], q3[1] + vl[1]];
    rama(q3, vl, n + 1);
    rama(tip, [q2[0] - tip[0], q2[1] - tip[1]], n + 1);
  };
  rama(base, [lado, 0], 0);
  ctx.restore();
  // the trunk's square points up: the edge vector (lado, 0) with the normal (0, −lado)
};

// ─── 8 · Vicsek: a cross of crosses, turning on the last hit ───────────────────────────────────────────────────
const vicsek = (ctx: Ctx, t: number) => {
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  const kb = enBeats(t) - 31;
  const f = cl(kb / 1.5) * 5, giro = (Math.PI / 4) * eIO(cl(kb / 2.5));
  const l = H * 0.86 * (0.92 + 0.08 * R(t, 31, 10));
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(giro);
  const cruz = (x: number, y: number, s: number, n: number) => {
    const g = cl(f - n);
    if (n >= 5 || s < 3 || g < 1) {
      ctx.fillStyle = brillo(1, 0.15 + n * 0.12 + 0.02 * t, 0.95);
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      return;
    }
    const d = s / 3;
    for (const [i, j] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) cruz(x + i * d, y + j * d, d, n + 1);
  };
  cruz(0, 0, l, 0);
  ctx.restore();
};

// ─── the cut list: masks between shots ─────────────────────────────────────────────────────────────────────────
const poligonoReg = (cx: number, cy: number, r: number, n: number, rot: number): P[] => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(rot + (i * TAU) / n), cy + r * Math.sin(rot + (i * TAU) / n)] as P);

// the v1 geometry film, without post: «Deleite» part 2 shows its moments inside panels (src/deleite.ts)
export const B1 = (k: number) => D.t0 + k * BEAT;
export const dibujarGeo = (ctx: Ctx, t: number) => {
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  const kb = enBeats(t);
  if (kb < 10.8) {
    // Cantor → Koch → the snowflake and its dive
    const cam = kb < 8 ? camBase : kochCam(t);
    if (kb < 4.3) cantor(ctx, t);
    if (kb >= 3.9) koch(ctx, t, cam);
  }
  if (kb >= 10 && kb < 15) {
    // the triangle opens out of the vertex: an upward triangle mask grows from the centre
    const r = kb < 10.7 ? Math.max(1, W * 1.3 * eIO(cl((kb - 10) / 0.7))) : 1e5;
    ctx.save();
    if (r < 1e5) clipPoli(ctx, poligonoReg(W / 2, H / 2, r, 3, -Math.PI / 2));
    const cam = sierpCam(t);
    triangulo(ctx, t, cam);
    ctx.restore();
    // through the hole: the carpet waits inside it
    if (kb >= 13.2) {
      ctx.save(); clipPoli(ctx, HUECO.map((p) => aPant(cam, p)));
      carpeta(ctx, t, alfCam(t));
      ctx.restore();
    }
  }
  if (kb >= 15 && kb < 19.5) {
    const cam = alfCam(t);
    carpeta(ctx, t, cam);
    // through the central square of the corner cell: the dragon, already unfolding
    if (kb >= 17.6) {
      const h0 = aPant(cam, [AC_P[0] - AC_H / 2, AC_P[1] - AC_H / 2]), h1 = aPant(cam, [AC_P[0] + AC_H / 2, AC_P[1] + AC_H / 2]);
      ctx.save(); ctx.beginPath(); ctx.rect(h0[0], h0[1], h1[0] - h0[0], h1[1] - h0[1]); ctx.clip();
      dragon(ctx, t, { x: (h0[0] + h1[0]) / 2, y: (h0[1] + h1[1]) / 2, w: Math.min(W, h1[0] - h0[0]), h: 0 });
      ctx.restore();
    }
  }
  if (kb >= 19.5 && kb < 25.4) dragon(ctx, t, null);
  if (kb >= 25 && kb < 28.6) {
    // five bands slide in, 60 ms apart
    ctx.save();
    if (kb < 25.7) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) { const e = eOut(cl((t - B(25) - 0.06 * i) / 0.32)); const bw = W / 5; ctx.rect(i * bw, i % 2 ? H * (1 - e) : 0, bw + 1, H * e); }
      ctx.clip();
    }
    hilbertEsc(ctx, t);
    ctx.restore();
  }
  if (kb >= 28 && kb < 31.4) {
    // an iris from the root of the tree
    ctx.save();
    if (kb < 28.7) { ctx.beginPath(); ctx.arc(W / 2, H * 0.98, Math.max(1, W * 1.25 * eIO(cl((kb - 28) / 0.7))), 0, TAU); ctx.clip(); }
    arbol(ctx, t);
    ctx.restore();
  }
  if (kb >= 31) {
    // a square opens from the centre, turning
    ctx.save();
    if (kb < 31.5) clipPoli(ctx, poligonoReg(W / 2, H / 2, Math.max(1, W * 0.9 * eOut(cl((kb - 31) / 0.45))), 4, Math.PI / 4));
    vicsek(ctx, t);
    ctx.restore();
  }
};
