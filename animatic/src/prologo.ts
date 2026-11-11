// PRÓLOGO · EL LATIDO (guion v7): black and silence; then a real heart, and every beat leaves a point of light at the
// height of its interval. The camera pulls back from a few beats to 24 hours of the same healthy person (PhysioNet
// nsr2db), the record of a failing heart appears under it (chf2db), the fluctuation analysis is computed live, and
// at the end the healthy line winds itself into a point of light that writes the title.
import P from "./prologo.json";
import LAT from "./latido.json";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { RGB, MONO, cl, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
const SANO: number[] = LAT.sano.rr, IC: number[] = LAT.ic.rr;
const BEATS: number[] = P.latidos;
const AZUL = "150,190,255", AMBAR = "255,176,96";

const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  ctx.font = `${op.peso ?? 500} ${tam}px "${op.fam ?? MONO}"`;
  ctx.fillStyle = color;
  ctx.textAlign = op.alin ?? "left";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 0}px`;
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};
// how many beats have sounded by t, and the time of the last one
const sonados = (t: number) => { let k = 0; while (k < BEATS.length && BEATS[k] <= t) k++; return k; };
const ultimoGolpe = (t: number): number => {
  let u = -1;
  for (const b of BEATS) if (b <= t) u = b;
  for (const b of P.lentos) if (b <= t) u = b;
  return u;
};

// ─── a heart line: points (one per beat) or, when there are too many, one column of light per pixel ─────────────
type Banda = { x0: number; x1: number; y0: number; y1: number };
const span = (rr: number[], a: number, n: number) => { let s = 0; for (let k = Math.max(0, Math.floor(a)); k < a + n && k < rr.length; k++) s += rr[k]; return s; };
const escala = (seg: number) => (seg < 90 ? `${Math.round(seg)} SEGUNDOS` : seg < 5400 ? `${Math.round(seg / 60)} MINUTOS` : `${Math.round(seg / 3600)} HORAS`);
// The camera is a window [a, a + n) over the beats, with a and n continuous (never rounded), so the image slides
// smoothly. Close up, the line goes through every beat; far away, each pixel column alternates the shortest and the
// longest interval inside it. Both are drawn with the same passes of light and cross-fade, so there is no switch.
const PASADAS = [[9, 0.08], [3.5, 0.22], [1.6, 0.9]] as const;
const trazar = (ctx: Ctx, pts: number[], col: string, alfa: number) => {
  if (alfa <= 0 || pts.length < 4) return;
  ctx.lineJoin = ctx.lineCap = "round";
  for (const [lw, op] of PASADAS) {
    ctx.strokeStyle = `rgba(${col},${op * alfa})`; ctx.lineWidth = lw;
    ctx.beginPath();
    for (let j = 0; j < pts.length; j += 2) { if (j) ctx.lineTo(pts[j], pts[j + 1]); else ctx.moveTo(pts[j], pts[j + 1]); }
    ctx.stroke();
  }
};
export const linea = (ctx: Ctx, rr: number[], a: number, n: number, B: Banda, lo: number, hi: number, col: string, alfa: number, kmax: number, revela = 1) => {
  const y = (v: number) => B.y1 - ((v - lo) / (hi - lo)) * (B.y1 - B.y0);
  const ancho = B.x1 - B.x0;
  const x = (k: number) => B.x0 + ((k - a) / Math.max(1, n - 1)) * ancho;
  const ppx = n / ancho;
  // 0: every beat · 1: pixel columns
  const mezcla = Math.min(1, Math.max(0, (ppx - 0.7) / 1.3));
  ctx.save();
  ctx.beginPath(); ctx.rect(B.x0 - 30, 0, (ancho + 60) * revela, H); ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  if (mezcla < 1) {
    // one beat beyond each edge, so new beats slide in from outside instead of popping at the edge
    // kmax is an absolute beat index: the last beat that may be drawn (one beat past each edge, so beats slide in)
    const k0 = Math.max(0, Math.ceil(a - 0.7)), k1 = Math.min(rr.length - 1, Math.ceil(a + n) + 1, kmax);
    const pts: number[] = [];
    for (let k = k0; k <= k1; k++) pts.push(x(k), y(rr[k]));
    trazar(ctx, pts, col, alfa * (1 - mezcla));
    // the points, while they can still be told apart
    const r = Math.min(1, Math.max(0, (ancho / Math.max(1, n) - 16) / 50));
    if (r > 0) for (let k = k0; k <= k1; k++) {
      const X = x(k), Y = y(rr[k]);
      const g = ctx.createRadialGradient(X, Y, 0, X, Y, 22);
      g.addColorStop(0, `rgba(255,255,255,${r * alfa})`); g.addColorStop(0.2, `rgba(${col},${0.7 * r * alfa})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.fillRect(X - 22, Y - 22, 44, 44);
    }
  }
  if (mezcla > 0) {
    const cols = Math.round(ancho), pts: number[] = [];
    for (let c = 0; c < cols; c++) {
      const k0 = Math.max(0, Math.floor(a + c * ppx)), k1 = Math.min(rr.length, Math.floor(a + (c + 1) * ppx) + 1);
      let mn = Infinity, mx = -Infinity;
      for (let k = k0; k < k1; k++) { const v = rr[k]; if (v < mn) mn = v; if (v > mx) mx = v; }
      if (mn === Infinity) continue;
      pts.push(B.x0 + c, y(c % 2 ? mx : mn));
    }
    trazar(ctx, pts, col, alfa * mezcla);
  }
  ctx.restore();
};

// zoom progress: a trapezoid of speed (ease in 20 %, constant, ease out 20 %)
export const zoom = (u: number) => {
  const e = 0.2, v = 1 / (1 - e);
  if (u <= 0) return 0; if (u >= 1) return 1;
  if (u < e) return (v * u * u) / (2 * e);
  if (u > 1 - e) return 1 - (v * (1 - u) * (1 - u)) / (2 * e);
  return v * (u - e / 2);
};
// the vertical range for every zoom level: robust extremes of the beats in view, smoothed and only ever opening
const RANGOS: [number, number][] = (() => {
  const rr = LAT.sano.rr as number[], N0 = 15, N = rr.length, M = 120, out: [number, number][] = [];
  for (let L = 0; L <= M; L++) {
    const n = Math.exp(lerp(Math.log(N0), Math.log(N), L / M)), a = Math.floor(P.inicio * (1 - (n - N0) / (N - N0)));
    const v = rr.slice(a, Math.min(N, a + Math.ceil(n))).sort((p, q) => p - q);
    const q = (f: number) => v[Math.min(v.length - 1, Math.floor(f * (v.length - 1)))];
    const lo = v.length > 200 ? q(0.002) : v[0], hi = v.length > 200 ? q(0.998) : v[v.length - 1], m = Math.max(0.06, (hi - lo) * 0.18);
    out.push([lo - m, hi + m]);
  }
  for (let L = 1; L <= M; L++) out[L] = [Math.min(out[L][0], out[L - 1][0]), Math.max(out[L][1], out[L - 1][1])];
  const s = out.map((_, L) => { let a = 0, b = 0, c = 0; for (let d = -6; d <= 6; d++) { const k = Math.min(M, Math.max(0, L + d)); a += out[k][0]; b += out[k][1]; c++; } return [a / c, b / c] as [number, number]; });
  return s;
})();
export const rango = (z: number): [number, number] => {
  const f = z * (RANGOS.length - 1), k = Math.min(RANGOS.length - 2, Math.floor(f)), u = f - k;
  return [lerp(RANGOS[k][0], RANGOS[k + 1][0], u), lerp(RANGOS[k][1], RANGOS[k + 1][1], u)];
};

// ─── the fluctuation analysis panel (log n against log F(n)) ─────────────────────────────────────────────────────
const panelDFA = (ctx: Ctx, t: number, B: Banda, a: number) => {
  if (a <= 0) return;
  const S = LAT.sano.dfa, I = LAT.ic.dfa;
  const xs = [...S.logn], ys = [...S.logF, ...I.logF];
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys) - 0.1, y1 = Math.max(...ys) + 0.1;
  const X = (v: number) => B.x0 + ((v - x0) / (x1 - x0)) * (B.x1 - B.x0), Y = (v: number) => B.y1 - ((v - y0) / (y1 - y0)) * (B.y1 - B.y0);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = `rgba(${RGB.crema},0.35)`; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(B.x0, B.y0); ctx.lineTo(B.x0, B.y1); ctx.lineTo(B.x1, B.y1); ctx.stroke();
  texto(ctx, "FLUCTUACIÓN", B.x0, B.y0 - 26, 18, `rgba(${RGB.crema},0.6)`, { esp: 3 });
  texto(ctx, "ESCALA DE TIEMPO →", B.x1, B.y1 + 38, 18, `rgba(${RGB.crema},0.6)`, { alin: "right", esp: 3 });
  // one point per scale, appearing on the beats
  const n = Math.max(0, sonados(t) - sonados(P.dfa[0]));
  const m = Math.min(xs.length, Math.round(n * 2.2));
  for (const [D, col] of [[S, AZUL], [I, AMBAR]] as const) {
    ctx.strokeStyle = `rgba(${col},0.85)`; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < m; k++) { const px = X(D.logn[k]), py = Y(D.logF[k]); if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
    ctx.fillStyle = `rgba(${col},1)`;
    for (let k = 0; k < m; k++) { ctx.beginPath(); ctx.arc(X(D.logn[k]), Y(D.logF[k]), 3.2, 0, Math.PI * 2); ctx.fill(); }
  }
  const fin = cl((t - P.dfa[1] + 2) / 1.2);
  if (fin > 0) {
    // the short-range slope (4 to 16 beats), where the failing heart loses its pattern
    for (const D of [S, I]) {
      const ks = D.logn.map((v: number, k: number) => k).filter((k: number) => D.logn[k] <= Math.log10(16));
      const ka = ks[0], kb = ks[ks.length - 1];
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * fin})`; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]);
      const dx = (D.logn[kb] - D.logn[ka]) * 1.6;
      ctx.beginPath(); ctx.moveTo(X(D.logn[ka]), Y(D.logF[ka])); ctx.lineTo(X(D.logn[ka] + dx), Y(D.logF[ka] + D.alfa1 * dx)); ctx.stroke();
      ctx.setLineDash([]);
    }
    texto(ctx, `SANO · PENDIENTE ${S.alfa1.toFixed(2).replace(".", ",")}`, B.x0 + 24, B.y0 + 20, 18, `rgba(${AZUL},${fin})`, { esp: 2 });
    texto(ctx, `INSUFICIENCIA · PENDIENTE ${I.alfa1.toFixed(2).replace(".", ",")}`, B.x0 + 24, B.y0 + 50, 18, `rgba(${AMBAR},${fin})`, { esp: 2 });
  }
  ctx.restore();
};

const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: 0.05, scan: 0.2, curva: 0.16, ruido: 0.6, grade: 1.8, imp: 0.5 };

// the last beat drawn: the beats heard so far, and then the beats the window's right edge has reached; a beat
// enters when the edge is a third of a step past it, inside the soft edge, so nothing pops
const ultimo = (a: number, n: number, vistos: number, z: number) => (z > 0 ? Math.max(P.inicio + vistos - 1, Math.floor(a + n - 1 + 0.3)) : P.inicio + vistos - 1);
let capaLinea: HTMLCanvasElement | null = null, capaSub: HTMLCanvasElement | null = null;
export const dibujarPrologo = (ctx: Ctx, t: number, frame: number) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  const mx = W * 0.09;
  const golpe = ultimoGolpe(t), eg = golpe >= 0 ? t - golpe : 99;
  const sale = eSuave(pr(t, P.enrolla[0], 0.6));
  // ── the healthy line: first point by point, then pulling back to 24 hours ──
  // the pull-back: a constant zoom speed (in scale), easing in and out at its ends
  const z = zoom(pr(t, P.zoom[0], P.zoom[1] - P.zoom[0]));
  const N0 = 15, N = SANO.length;
  const n = Math.exp(lerp(Math.log(N0), Math.log(N), z));
  const a = P.inicio * (1 - (n - N0) / (N - N0));
  const vistos = Math.min(N0, sonados(t));
  // the vertical range follows what is in view, smoothly
  const [lo, hi] = rango(z);
  const baja = eIO(pr(t, P.ic - 0.6, 1.6)), dfa = eIO(pr(t, P.dfa[0] - 1.2, 1.6));
  const xd = lerp(W - mx, W * 0.6, dfa);
  const Bs: Banda = { x0: mx, x1: xd, y0: lerp(H * 0.3, H * 0.16, baja), y1: lerp(H * 0.7, H * 0.46, baja) };
  // every beat pushes the image a little closer, and it settles before the next one
  const golpeImg = t < P.zoom[0] && eg < 1 ? Math.exp(-eg * 6) : 0;
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(1 + 0.018 * golpeImg, 1 + 0.018 * golpeImg); ctx.translate(-W / 2, -H / 2);
  if (t >= P.silencio && t < P.enrolla[1]) {
    // the day line fades out while the spiral takes over, so the change of drawing never jumps
    const alfa = 1 - eSuave(pr(t, P.enrolla[0], 0.9));
    // the line is drawn once at full size and the layer is moved and scaled into its place: when the other heart
    // and the panel arrive, the line shifts as one image instead of being redrawn at a new width (no shimmer)
    if (alfa > 0) {
      if (!capaLinea) { capaLinea = document.createElement("canvas"); capaLinea.width = W; capaLinea.height = H; }
      const cl2 = capaLinea.getContext("2d")!;
      cl2.clearRect(0, 0, W, H);
      const Bf: Banda = { x0: mx, x1: W - mx, y0: H * 0.3, y1: H * 0.7 };
      // motion blur while the camera pulls back: the line is drawn at several instants inside the frame's exposure
      // and averaged, like a film camera's shutter; a thin line moving fast would otherwise strobe
      const K = z > 0 && z < 1 ? 8 : 1;
      // once the camera moves there is no limit on the points (a limit tied to the moving window made the last
      // points blink in and out)
      if (K === 1) linea(cl2, SANO, a, n, Bf, lo, hi, AZUL, alfa, ultimo(a, n, vistos, z));
      else {
        if (!capaSub) { capaSub = document.createElement("canvas"); capaSub.width = W; capaSub.height = H; }
        const cs = capaSub.getContext("2d")!;
        for (let j = 0; j < K; j++) {
          const ts = t - (j / K) * (1 / P.fps) * 0.9;
          const zs = zoom(pr(ts, P.zoom[0], P.zoom[1] - P.zoom[0]));
          const ns = Math.exp(lerp(Math.log(N0), Math.log(N), zs)), as = P.inicio * (1 - (ns - N0) / (N - N0));
          const [los, his] = rango(zs);
          cs.clearRect(0, 0, W, H);
          linea(cs, SANO, as, ns, Bf, los, his, AZUL, alfa, ultimo(as, ns, vistos, zs));
          cl2.globalCompositeOperation = "lighter"; cl2.globalAlpha = 1 / K;
          cl2.drawImage(capaSub, 0, 0);
        }
        cl2.globalAlpha = 1; cl2.globalCompositeOperation = "source-over";
      }
      // soft edges: what enters or leaves the view fades in over 90 px instead of appearing at a hard border
      // (always on, so nothing appears when the camera starts: still, the fade covers only what lies beyond the
      // edge; moving, it grows to 90 px inside)
      {
        const k = Math.min(1, z * 25), ext = 34, f = (10 + 114 * k) / (Bf.x1 - Bf.x0 + 2 * ext);
        const fe = cl2.createLinearGradient(Bf.x0 - ext, 0, Bf.x1 + ext, 0);
        fe.addColorStop(0, "rgba(0,0,0,0)"); fe.addColorStop(f, "rgba(0,0,0,1)"); fe.addColorStop(1 - f, "rgba(0,0,0,1)"); fe.addColorStop(1, "rgba(0,0,0,0)");
        cl2.save(); cl2.globalCompositeOperation = "destination-in"; cl2.fillStyle = fe; cl2.fillRect(0, 0, W, H); cl2.restore();
      }
      const sx = (Bs.x1 - Bs.x0) / (Bf.x1 - Bf.x0), sy = (Bs.y1 - Bs.y0) / (Bf.y1 - Bf.y0);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.transform(sx, 0, 0, sy, Bs.x0 - Bf.x0 * sx, Bs.y0 - Bf.y0 * sy);
      ctx.drawImage(capaLinea, 0, 0);
      ctx.restore();
    }
    // every new beat lights its point once
    if (z === 0 && eg < 0.6 && vistos > 0) {
      const X = Bs.x0 + ((vistos - 1) / (N0 - 1)) * (Bs.x1 - Bs.x0), Y = Bs.y1 - ((SANO[P.inicio + vistos - 1] - lo) / (hi - lo)) * (Bs.y1 - Bs.y0);
      const r = 18 + 70 * eOut(cl(eg / 0.6)), al = 0.5 * (1 - eg / 0.6);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(X, Y, 0, X, Y, r);
      g.addColorStop(0, `rgba(255,255,255,${al})`); g.addColorStop(1, `rgba(${AZUL},0)`);
      ctx.fillStyle = g; ctx.fillRect(X - r, Y - r, 2 * r, 2 * r); ctx.restore();
    }
  }
  ctx.restore();
  // ── three windows on the same day: seconds, minutes and hours, each opened below at the same width, so the
  // eye can compare their texture; they light up on the words of the voice ──
  if (t >= P.ventanas[0] - 0.2 && t < P.ventanasFin + 1.0) {
    const fuera = 1 - eSuave(pr(t, P.ventanasFin, 1.0));
    const cK = Math.floor(N * 0.6), anchos = [20, 390, 14000], nombres = ["SEGUNDOS", "MINUTOS", "HORAS"];
    const g = 28, iw = (W - 2 * mx - 2 * g) / 3, iy0 = H * 0.74, iy1 = H * 0.86;
    for (let j = 0; j < 3; j++) {
      const ap = Math.min(1, Math.max(0, (t - P.ventanas[j]) / 0.5));
      const al = eOut(ap) * fuera;
      if (al <= 0) continue;
      const nb = anchos[j], k0 = cK - Math.floor(nb / 2);
      // where the window sits on the day line (the line is the healthy one, drawn into Bs)
      const fx = (k: number) => Bs.x0 + ((k - a) / Math.max(1, n - 1)) * (Bs.x1 - Bs.x0);
      const wx0 = fx(k0), wx1 = Math.max(fx(k0 + nb), wx0 + 3);
      const ix0 = mx + j * (iw + g), ix1 = ix0 + iw;
      ctx.save();
      ctx.strokeStyle = `rgba(${RGB.crema},${0.55 * al})`; ctx.lineWidth = 1.2;
      ctx.strokeRect(wx0, Bs.y0 - 6, wx1 - wx0, Bs.y1 - Bs.y0 + 12);
      // the thread from the window to its inset
      ctx.strokeStyle = `rgba(${RGB.crema},${0.22 * al})`;
      ctx.beginPath(); ctx.moveTo(wx0, Bs.y1 + 6); ctx.lineTo(ix0, iy0 - 8); ctx.moveTo(wx1, Bs.y1 + 6); ctx.lineTo(ix1, iy0 - 8); ctx.stroke();
      ctx.strokeStyle = `rgba(${RGB.crema},${0.35 * al})`;
      ctx.strokeRect(ix0, iy0 - 8, iw, iy1 - iy0 + 16);
      ctx.restore();
      const seg = SANO.slice(k0, k0 + nb), mn = Math.min(...seg), mxv = Math.max(...seg), pad = (mxv - mn) * 0.15 + 0.005;
      linea(ctx, SANO, k0, nb, { x0: ix0 + 10, x1: ix1 - 10, y0: iy0, y1: iy1 }, mn - pad, mxv + pad, AZUL, al, Infinity, eOut(ap));
      texto(ctx, nombres[j], ix0, iy1 + 36, 17, `rgba(${RGB.crema},${0.75 * al})`, { esp: 4 });
    }
  }
  // ── the failing heart, under it ──
  if (t >= P.ic && t < P.enrolla[0] + 0.7) {
    const Bi: Banda = { x0: mx, x1: xd, y0: H * 0.56, y1: H * 0.86 };
    ctx.save(); ctx.globalAlpha = 1 - sale;
    linea(ctx, IC, 0, IC.length, Bi, 0.42, 1.42, AMBAR, 1, IC.length, eIO(pr(t, P.ic, 2.4)));
    ctx.restore();
  }
  // ── labels ──
  const et = Math.min(eSuave(pr(t, 8.6, 1.2)), 1 - sale);
  if (et > 0) {
    const seg = span(SANO, a, n);
    texto(ctx, "INTERVALO ENTRE LATIDOS", mx, Bs.y0 - 30, 20, `rgba(${RGB.crema},${0.7 * et})`, { esp: 3 });
    texto(ctx, `ESCALA · ${escala(seg)}`, xd, Bs.y0 - 30, 20, `rgba(${RGB.crema},${0.9 * et})`, { alin: "right", esp: 3 });
    const ab = Math.min(et, eSuave(pr(t, P.ic, 1.2)));
    texto(ctx, "CORAZÓN SANO", mx, Bs.y1 + 34, 20, `rgba(${AZUL},${ab})`, { esp: 3 });
    texto(ctx, "INSUFICIENCIA CARDÍACA", mx, H * 0.86 + 34, 20, `rgba(${AMBAR},${ab})`, { esp: 3 });
  }
  panelDFA(ctx, t, { x0: W * 0.66, x1: W - mx, y0: H * 0.26, y1: H * 0.74 }, dfa * (1 - sale));
  // ── the healthy line winds itself into a point of light ──
  const en = pr(t, P.enrolla[0], P.enrolla[1] - P.enrolla[0]);
  const cx = W / 2, cy = H / 2;
  if (t >= P.enrolla[0]) {
    // the spiral starts as the very same day line: one column per pixel, alternating its shortest and longest
    // interval, with the same three passes of light; then every column travels into the tightening spiral
    const M = Math.round((Bs.x1 - Bs.x0) * 2), u = eIO(en);
    const pts: number[] = [];
    for (let j = 0; j < M; j++) {
      const q = j / (M - 1);
      const k0 = Math.floor(q * (N - 1)), k1 = Math.min(N, k0 + Math.ceil(N / M) + 1);
      let mn = Infinity, mx = -Infinity;
      for (let k = k0; k < k1; k++) { const v = SANO[k]; if (v < mn) mn = v; if (v > mx) mx = v; }
      const v = j % 2 ? mx : mn;
      const x0 = Bs.x0 + q * (Bs.x1 - Bs.x0), y0 = Bs.y1 - ((v - 0.42) / 1.0) * (Bs.y1 - Bs.y0);
      const ang = q * Math.PI * 7 + u * 4, rad = (1 - q) * Math.min(W, H) * 0.32 * (1 - u) + 0.5;
      pts.push(lerp(x0, cx + rad * Math.cos(ang), u), lerp(y0, cy + rad * Math.sin(ang), u));
    }
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineJoin = ctx.lineCap = "round";
    const al = Math.min(eSuave(pr(t, P.enrolla[0], 0.9)), 1 - eSuave(pr(t, P.enrolla[1] - 0.8, 0.8)));
    for (const [lw, op] of [[3, 0.22], [1.3, 0.9]] as const) {
      ctx.strokeStyle = `rgba(${AZUL},${op * al})`; ctx.lineWidth = lw;
      ctx.beginPath();
      for (let j = 0; j < pts.length; j += 2) { if (j) ctx.lineTo(pts[j], pts[j + 1]); else ctx.moveTo(pts[j], pts[j + 1]); }
      ctx.stroke();
    }
    ctx.restore();
  }
  // the point of light, alive with the slowing heart, then writing the title
  if (t >= P.enrolla[1] - 0.8) {
    const lat = eg < 1.2 ? Math.exp(-eg * 4) : 0;
    const r = 12 + 80 * lat;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, `rgba(${AZUL},0.55)`); g.addColorStop(1, `rgba(${AZUL},0)`);
    ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    ctx.restore();
  }
  // the source, small, while the data are on screen
  // (it steps aside while the three windows are open)
  const fu = Math.min(eSuave(pr(t, 10, 1.5)), 1 - sale, 1 - Math.min(eSuave(pr(t, P.ventanas[0] - 0.8, 0.6)), 1 - eSuave(pr(t, P.ventanasFin + 0.2, 0.8))));
  if (fu > 0) texto(ctx, "REGISTROS REALES · PHYSIONET · NSR2DB Y CHF2DB", mx, H - 60, 16, `rgba(${RGB.crema},${0.5 * fu})`, { esp: 3 });
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.9, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: RETRO.curva, esq: RETRO.curva, impacto: (eg < 1 ? Math.exp(-eg * 7) : 0) * 0.25 * RETRO.imp, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
