// The B&N Lectures mark forming, as at the end of bnsolutions.cl/lectures (bn-solutions/lectures/final.js), ported
// frame by frame to the film's canvas: Fourier epicycles draw every contour of the mark (B, &, N and their holes);
// the stroke lets go into particles that turn once and land on the pixels of bn-mark.png; the two charges light up
// and write LEC, TUR, ES; the mark lights, a shine crosses it. Everything depends only on t (seconds from the release;
// the drawing starts at t = −D). The LIC field of the web page is not drawn: here the background is the film's own.
import { SANS } from "./theme";
import { pintarFractalTeaser, type Paleta } from "./fractalTeaser";

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pr = (t: number, a: number, d: number) => cl((t - a) / d);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const eIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eOut = (x: number) => 1 - Math.pow(1 - cl(x), 3);
const suave5 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (6 * x - 15) + 10));
const azar = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export const D = 3.75;
const T_ACENTO = 1.25, SEMI = 0.125, CORCHEA = 0.25;
const T_LEC = 1.7, T_TUR = 2.25, T_CONV = 2.8, DUR_CONV = 0.9, T_LLENO = T_CONV + 1.0;
const ENC = [T_LEC, T_TUR];
const DENSO = 4, NCIRC = 30, COLA = 0.16, NIV = 6, NP = 6200;

type Termino = { k: number; amp: number; fase: number };
type Curva = { centro: [number, number]; terminos: Termino[]; denso: [number, number][]; largo: number };
type Part = { o: [number, number]; v: [number, number]; kd: number; fase: number; r: number; azul: boolean; meta: [number, number]; tIni: number; tFin: number; giroTotal: number };
type Geo = { lw: number; lh: number; cx: number; cy: number; s: number; q1: [number, number]; q2: [number, number] };

const curvas = (crudos: number[][][]): Curva[] => crudos.map((crudo) => {
  let p = crudo.map(([x, y]) => [x, y] as [number, number]);
  const n = p.length;
  for (let pasada = 0; pasada < 2; pasada++) p = p.map((b, i) => { const a = p[(i - 1 + n) % n], c = p[(i + 1) % n]; return [(a[0] + 2 * b[0] + c[0]) / 4, (a[1] + 2 * b[1] + c[1]) / 4] as [number, number]; });
  const terminos: Termino[] = []; let centro: [number, number] = [0, 0];
  for (let k = -n / 2; k < n / 2; k++) {
    let re = 0, im = 0;
    for (let j = 0; j < n; j++) { const an = (-TAU * k * j) / n, c = Math.cos(an), sn = Math.sin(an); re += p[j][0] * c - p[j][1] * sn; im += p[j][0] * sn + p[j][1] * c; }
    re /= n; im /= n;
    if (k === 0) centro = [re, im]; else terminos.push({ k, amp: Math.hypot(re, im), fase: Math.atan2(im, re) });
  }
  terminos.sort((a, b) => b.amp - a.amp);
  const m = n * DENSO, denso: [number, number][] = [];
  for (let j = 0; j < m; j++) {
    const u = j / m; let x = centro[0], y = centro[1];
    for (const tr of terminos) { const an = tr.fase + TAU * tr.k * u; x += tr.amp * Math.cos(an); y += tr.amp * Math.sin(an); }
    denso.push([x, y]);
  }
  let largo = 0;
  for (let j = 0; j < m; j++) largo += Math.hypot(denso[(j + 1) % m][0] - denso[j][0], denso[(j + 1) % m][1] - denso[j][1]);
  return { centro, terminos, denso, largo };
});
const enCurva = (c: Curva, u: number): [number, number] => { const m = c.denso.length, f = (((u % 1) + 1) % 1) * m, i = Math.floor(f), r = f - i, a = c.denso[i % m], b = c.denso[(i + 1) % m]; return [a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r]; };
const plan = (i: number, n: number) => ({ a: 0.3 + i * SEMI, b: D - CORCHEA - (n - 1 - i) * SEMI });
const avance = (x: number) => { if (x <= 0) return 0; if (x >= 1) return 1; const ex = x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2; return 0.35 * x + 0.65 * ex; };
const golpe = (t: number, t0: number, caida: number) => (t < t0 ? 0 : Math.exp(-(t - t0) * caida));
const camara = (t: number) => (t < D ? lerp(1.12, 1.24, eIO(pr(t, 0, D))) : lerp(1.24, 1, eIO(pr(t - D, 0, T_CONV))));

let CACHE: { geo: Geo; C: Curva[]; ps: Part[]; marca: HTMLImageElement } | null = null;
const prepara = (W: number, H: number, marca: HTMLImageElement, crudos: number[][][]) => {
  if (CACHE && CACHE.marca === marca) return CACHE;
  const lw = Math.min(W * 0.42, 800), lh = (lw * 186) / 609, cx = W / 2, cy = H * 0.46;
  const geo: Geo = { lw, lh, cx, cy, s: lw / 609, q1: [cx - 0.657 * lw, cy], q2: [cx + 0.657 * lw, cy] };
  const C = curvas(crudos);
  // targets: the pixels of the mark
  const w = Math.round(lw), h = Math.round(lh);
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const x = cv.getContext("2d", { willReadFrequently: true })!;
  x.drawImage(marca, 0, 0, w, h);
  const dat = x.getImageData(0, 0, w, h).data, metas: [number, number][] = [];
  const x0 = cx - lw / 2, y0 = cy - lh / 2;
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (dat[(yy * w + xx) * 4 + 3] > 150) metas.push([x0 + xx + 0.5, y0 + yy + 0.5]);
  const M = mapaMarca(geo), total = C.reduce((a, c) => a + c.largo, 0), ps: Part[] = [];
  for (let i = 0; i < NP; i++) {
    let resto = ((i + azar(i * 7.1)) / NP) * total, ci = 0;
    while (ci < C.length - 1 && resto > C[ci].largo) resto -= C[ci++].largo;
    const c = C[ci], u = resto / c.largo, pa = enCurva(c, u), pb = enCurva(c, u + 0.002);
    const o: [number, number] = [M.cx + pa[0] * M.w, M.cy + pa[1] * M.w];
    let nx = -(pb[1] - pa[1]), ny = pb[0] - pa[0]; const nn = Math.hypot(nx, ny) || 1; nx /= nn; ny /= nn;
    const rx = o[0] - cx, ry = o[1] - cy, rr = Math.hypot(rx, ry) || 1;
    if (nx * rx + ny * ry < 0) { nx = -nx; ny = -ny; }
    const sg = azar(i * 12.7) < 0.42 ? -1 : 1;
    const a = Math.atan2((ry / rr) * 0.35 + sg * ny * 0.65, (rx / rr) * 0.35 + sg * nx * 0.65) + (azar(i * 2.9) - 0.5) * 0.9;
    const rap = lerp(10, 75, Math.pow(azar(i * 5.3), 1.8)) * geo.s;
    ps.push({ o, v: [Math.cos(a) * rap, Math.sin(a) * rap], kd: lerp(1.6, 2.8, azar(i * 6.1)), fase: azar(i * 9.7) * TAU, r: lerp(0.65, 1.45, Math.pow(azar(i * 10.9), 2)), azul: azar(i * 11.3) < 0.35, meta: o, tIni: 0, tFin: 0, giroTotal: 0 });
  }
  const ms = ps.map((_, i) => metas[Math.floor(azar(i * 7.7 + 3) * metas.length)]);
  const clave = (q: [number, number], i: number) => q[0] + (azar(i * 1.91) - 0.5) * 6 * geo.s;
  const ordM = ms.map((_, i) => i).sort((p, q) => clave(ms[p], p) - clave(ms[q], q));
  ps.map((_, i) => i).sort((p, q) => clave(ps[p].o, p + 7) - clave(ps[q].o, q + 7)).forEach((pi, j) => (ps[pi].meta = ms[ordM[j]]));
  ps.forEach((p) => {
    const dist = Math.hypot(p.o[0] - p.meta[0], p.o[1] - p.meta[1]) + Math.hypot(p.v[0], p.v[1]) / p.kd;
    p.tIni = T_CONV + 0.3 * cl(dist / (520 * geo.s)); p.tFin = p.tIni + DUR_CONV;
  });
  CACHE = { geo, C, ps, marca };
  return CACHE;
};
const mapaMarca = (g: Geo) => ({ cx: g.cx - 0.5 * g.s, cy: g.cy + 0.25 * g.s, w: 597 * g.s });

const posicion = (g: Geo, p: Part, t: number): [number, number] => {
  const { cx, cy, s } = g;
  const tau = Math.max(0, t), u = cl(tau / p.tFin);
  const th = p.giroTotal * (1 - Math.pow(1 - u, 2.5));
  const h = suave5((t - p.tIni) / (p.tFin - p.tIni));
  const cT = Math.cos(-p.giroTotal), sT = Math.sin(-p.giroTotal);
  const mx = p.meta[0] - cx, my = p.meta[1] - cy;
  const ax = lerp(p.o[0] - cx, mx * cT - my * sT, h), ay = lerp(p.o[1] - cy, mx * sT + my * cT, h);
  const f = ((1 - Math.exp(-p.kd * tau)) / p.kd) * (1 - h);
  const vai = 5 * s * Math.pow(1 - Math.exp(-2 * tau), 2) * (1 - h);
  const qx = ax + p.v[0] * f + vai * Math.sin(tau * 1.9 + p.fase), qy = ay + p.v[1] * f + vai * Math.cos(tau * 1.6 + p.fase * 1.3);
  const c = Math.cos(th), sn = Math.sin(th);
  return [cx + qx * c - qy * sn, cy + qx * sn + qy * c];
};

const brillo = (g: Ctx, x: number, y: number, r: number, rgb: string, a: number) => {
  if (a <= 0.004 || r <= 0) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
};
const estallido = (g: Ctx, x: number, y: number, s: number, a: number, semilla: number, t: number) => {
  if (a <= 0.01) return;
  brillo(g, x, y, 300 * s, "30,70,240", 0.2 * a);
  brillo(g, x, y, 150 * s, "90,140,255", 0.62 * a);
  g.lineWidth = 1;
  const giro = t * 0.045 * (semilla ? -1 : 1);
  for (let i = 0; i < 120; i++) {
    const an = azar(i * 1.7 + semilla) * TAU + giro;
    const tit = 0.55 + 0.45 * Math.sin(t * (1.3 + 2.2 * azar(i * 2.3 + semilla)) + azar(i * 4.1 + semilla) * TAU);
    const L = s * (25 + 150 * Math.pow(azar(i * 3.1 + semilla), 2.2)) * (0.85 + 0.15 * tit);
    const ex = x + Math.cos(an) * L, ey = y + Math.sin(an) * L;
    const gr = g.createLinearGradient(x, y, ex, ey);
    gr.addColorStop(0, `rgba(220,232,255,${(0.2 + 0.42 * azar(i + semilla)) * tit * a})`); gr.addColorStop(1, "rgba(90,140,255,0)");
    g.strokeStyle = gr; g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.stroke();
  }
  brillo(g, x, y, 70 * s, "170,200,255", 0.75 * a);
  brillo(g, x, y, 30 * s, "240,246,255", a);
  g.fillStyle = `rgba(252,253,255,${a})`; g.beginPath(); g.arc(x, y, 8 * s, 0, TAU); g.fill();
};
// the trailer's version: in place of each charge, a small Julia set that lives (its constant drifts on a slow circle,
// it turns), as large as the charge's glow, with no pulse
let CARGAS_FRACTALES = false;
export const ponCargasFractales = (b: boolean) => { CARGAS_FRACTALES = b; };
const AZULES: Paleta = [[0.0, 0.01, 0.02, 0.08], [0.22, 0.04, 0.1, 0.42], [0.45, 0.25, 0.45, 1.0], [0.62, 0.8, 0.9, 1.0], [0.78, 0.45, 0.62, 1.0], [0.9, 0.1, 0.2, 0.6], [1.0, 0.01, 0.02, 0.08]];
let capaF: HTMLCanvasElement | null = null;
const cargaFractal = (g: Ctx, x: number, y: number, s: number, a: number, i: number, t: number) => {
  if (a <= 0.01) return;
  const R = Math.round(118 * s), D = 2 * R;
  if (!capaF) capaF = document.createElement("canvas");
  if (capaF.width !== D) { capaF.width = D; capaF.height = D; }
  const c0: [number, number] = i ? [0.285, 0.011] : [0.285, -0.011];
  const c: [number, number] = [c0[0] + 0.012 * Math.cos(0.35 * t + i), c0[1] + 0.012 * Math.sin(0.29 * t + 2 * i)];
  const l = pintarFractalTeaser(D, D, { cx: 0, cy: 0, esc: 3.0 / D, rot: (i ? -1 : 1) * 0.08 * t, julia: c, modo: 0, lente: 1e9, fase: 0.03 * t + i * 0.3, paleta: AZULES, brillo: 0.82, maxIt: 360, tiempo: t });
  const d = capaF.getContext("2d")!;
  d.globalCompositeOperation = "source-over"; d.clearRect(0, 0, D, D); d.drawImage(l, 0, 0, D, D);
  const gr = d.createRadialGradient(R, R, 0, R, R, R);
  gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.62, "rgba(0,0,0,0.9)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  d.globalCompositeOperation = "destination-in"; d.fillStyle = gr; d.fillRect(0, 0, D, D);
  brillo(g, x, y, 1.15 * R, "40,80,240", 0.16 * a);
  g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = a; g.drawImage(capaF, x - R, y - R); g.restore();
};
const frente = (g: Geo, t: number, i: number): [number, number] => {
  const ev = [ENC[i], T_CONV];
  for (let x = T_CONV + 1.1; x < t + 1; x += 1.1) ev.push(x);
  let ult = -1; for (const x of ev) if (x <= t) ult = x;
  if (ult < 0) return [0, 0];
  const tau = t - ult, fuerte = ult <= T_CONV + 0.01 ? 1 : 0.5;
  return [40 * g.s + tau * 640 * g.s, Math.exp(-tau * 2.2) * fuerte];
};

const epiciclos = (g: Ctx, G: Geo, C: Curva[], t: number) => {
  const k = camara(t), px = 1 / k, M = mapaMarca(G), cx = M.cx, cy = M.cy, w = M.w;
  const late = golpe(t, T_ACENTO, 3.2);
  g.save(); g.setTransform(k, 0, 0, k, G.cx * (1 - k), G.cy * (1 - k));
  g.lineCap = "round"; g.lineJoin = "round";
  brillo(g, G.cx, G.cy, (1920 * 0.42) / k, "30,60,200", 0.06 * pr(t, 0, D));
  const n = C.length;
  C.forEach((c, ci) => {
    const { a: ta, b: tb } = plan(ci, n);
    const crece = eOut(pr(t, ta - 0.55, 0.75)), apaga = eIO(pr(t, tb, 0.42)), vis = crece * (1 - apaga);
    const u = avance(pr(t, ta, tb - ta));
    if (vis > 0.01) {
      let x = cx + c.centro[0] * w, y = cy + c.centro[1] * w;
      const centros: [number, number][] = [[x, y]];
      c.terminos.slice(0, NCIRC).forEach((tr) => { const r = tr.amp * w * crece, an = tr.fase + TAU * tr.k * u; x += r * Math.cos(an); y += r * Math.sin(an); centros.push([x, y]); });
      for (let j = 0; j < NCIRC; j++) {
        const r = c.terminos[j].amp * w * crece;
        if (r * k < 0.8) continue;
        const f = 1 - j / NCIRC;
        g.strokeStyle = `rgba(125,162,255,${vis * (0.1 + 0.32 * Math.pow(f, 1.3)) * (1 + 0.5 * late)})`;
        g.lineWidth = (j < 3 ? 1.3 : 0.9) * px;
        g.beginPath(); g.arc(centros[j][0], centros[j][1], r, 0, TAU); g.stroke();
      }
      g.strokeStyle = `rgba(205,218,255,${vis * 0.42 * (1 + 0.4 * late)})`;
      g.lineWidth = 1 * px;
      g.beginPath(); centros.forEach(([X, Y], j) => (j ? g.lineTo(X, Y) : g.moveTo(X, Y)));
      const pu = enCurva(c, u); g.lineTo(cx + pu[0] * w, cy + pu[1] * w); g.stroke();
      g.fillStyle = `rgba(225,232,255,${vis * 0.55})`;
      for (let j = 0; j < 6; j++) { g.beginPath(); g.arc(centros[j][0], centros[j][1], 1.6 * px, 0, TAU); g.fill(); }
    }
    if (t < ta) return;
    const m = c.denso.length, fin = u * m;
    const ruta = (desde: number, hasta: number) => {
      g.beginPath();
      const p0 = enCurva(c, desde / m); g.moveTo(cx + p0[0] * w, cy + p0[1] * w);
      for (let j = Math.max(0, Math.floor(desde)) + 1; j < hasta; j++) g.lineTo(cx + c.denso[j % m][0] * w, cy + c.denso[j % m][1] * w);
      const p1 = enCurva(c, hasta / m); g.lineTo(cx + p1[0] * w, cy + p1[1] * w);
      if (hasta >= m) g.closePath();
    };
    const cerrado = pr(t, tb, 0.5);
    g.lineCap = "round";
    ruta(0, fin);
    g.strokeStyle = `rgba(70,120,255,${0.22 + 0.12 * cerrado + 0.12 * late})`; g.lineWidth = 11 * px; g.stroke();
    g.strokeStyle = `rgba(70,120,255,${0.45 + 0.25 * cerrado + 0.25 * late})`; g.lineWidth = 4.2 * px; g.stroke();
    g.strokeStyle = `rgba(226,234,255,${0.62 + 0.25 * cerrado + 0.2 * late})`; g.lineWidth = 2 * px; g.stroke();
    if (u < 1) {
      const L = COLA * m, tramos = 14;
      g.lineCap = "butt";
      for (let q = 0; q < tramos; q++) {
        const d0 = fin - L * (1 - q / tramos), d1 = fin - L * (1 - (q + 1) / tramos);
        if (d1 <= 0) continue;
        const f = (q + 1) / tramos;
        ruta(Math.max(0, d0), d1);
        g.strokeStyle = `rgba(110,155,255,${0.45 * f * f})`; g.lineWidth = lerp(3.5, 8.5, f) * px; g.stroke();
        g.strokeStyle = `rgba(246,249,255,${0.75 * f * f})`; g.lineWidth = lerp(2, 3.4, f * f) * px; g.stroke();
      }
      const p = enCurva(c, u), X = cx + p[0] * w, Y = cy + p[1] * w;
      brillo(g, X, Y, 11 * px, "150,185,255", 0.9);
      g.fillStyle = "#fff"; g.beginPath(); g.arc(X, Y, 2.6 * px, 0, TAU); g.fill();
    }
    const gb = golpe(t, tb, 6);
    if (gb > 0.02) { const p = enCurva(c, 0); brillo(g, cx + p[0] * w, cy + p[1] * w, 56 * px, "160,195,255", 0.9 * gb); }
  });
  g.restore();
};

const nube = (g: Ctx, G: Geo, ps: Part[], t: number) => {
  const desv = eIO(pr(t, T_LLENO - 0.1, 0.45));
  if (desv >= 1 || !ps.length || t < 0) return;
  const aterriza = eIO(pr(t, T_CONV + 0.45, 0.85));
  const base = lerp(1, 0.8, eOut(pr(t, 0, 1.2))) + 0.3 * eIO(pr(t, T_CONV, 0.5)) + 0.35 * aterriza;
  const vis = 1 - desv, k = camara(t + D);
  g.save(); g.setTransform(k, 0, 0, k, G.cx * (1 - k), G.cy * (1 - k));
  const caminos = Array.from({ length: 2 * 2 * NIV }, () => new Path2D());
  const dt = 1 / 60, tope = 9 / k;
  const piso = G.cy + G.lh / 2 + 2 * G.s, despeje = eIO(pr(t, T_LEC - 0.45, 0.35));
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i], q = posicion(G, p, t), q0 = posicion(G, p, t - dt);
    const tw = 0.75 + 0.25 * Math.sin(t * 3.1 + p.fase * 5);
    const bajo = cl((q[1] - piso) / (14 * G.s));
    const al = cl(base * tw * (0.55 + 0.45 * azar(i * 1.37))) * (1 - despeje * bajo);
    const c = caminos[((p.azul ? 1 : 0) * 2 + (p.r > 1.05 ? 1 : 0)) * NIV + Math.min(NIV - 1, Math.floor(al * NIV))];
    let ex = q0[0] - q[0], ey = q0[1] - q[1]; const el = Math.hypot(ex, ey);
    if (el > tope) { ex *= tope / el; ey *= tope / el; }
    c.moveTo(q[0] + ex, q[1] + ey); c.lineTo(q[0] + 0.01, q[1]);
  }
  g.lineCap = "round";
  caminos.forEach((c, j) => {
    const nivel = j % NIV, grande = Math.floor(j / NIV) % 2, azul = Math.floor(j / NIV / 2);
    const al = ((nivel + 0.5) / NIV) * vis;
    g.strokeStyle = `rgba(80,128,255,${al * 0.32 * (1 - 0.75 * aterriza)})`;
    g.lineWidth = ((grande ? 6 : 4.2) * lerp(1, 0.5, aterriza)) / k; g.stroke(c);
    g.strokeStyle = azul ? `rgba(150,182,255,${al})` : `rgba(236,242,255,${al})`;
    g.lineWidth = ((grande ? 2.5 : 1.6) * lerp(1, 0.55, aterriza)) / k; g.stroke(c);
  });
  g.restore();
  const su = golpe(t, 0, 5);
  if (su > 0.02) brillo(g, G.cx, G.cy, 520 * G.s, "120,160,255", 0.16 * su);
};

// the mark and LECTURES (in the web page they are HTML with CSS transitions; here the same timings, drawn)
const marcaYLetras = (g: Ctx, G: Geo, marca: HTMLImageElement, t: number, alfa: number) => {
  const lleno = eOut(pr(t, T_LLENO - 0.55, 0.5)), nitida = eOut(pr(t, T_LLENO - 0.55, 0.9));
  const x0 = G.cx - G.lw / 2, y0 = G.cy - G.lh / 2;
  if (lleno > 0.01) {
    g.save(); g.globalAlpha = lleno * alfa;
    g.filter = `blur(${(8 * (1 - nitida)).toFixed(2)}px) brightness(${(1 + (1 - nitida)).toFixed(2)})`;
    g.drawImage(marca, x0, y0, G.lw, G.lh);
    g.filter = "none";
    g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.55 * nitida * alfa; g.filter = "blur(14px)"; g.drawImage(marca, x0, y0, G.lw, G.lh);
    g.restore();
    // the shine that crosses the mark (CSS «barrido», 0.85 s)
    const b = pr(t, T_LLENO + 0.05, 0.85);
    if (b > 0 && b < 1) {
      const cv = document.createElement("canvas"); cv.width = Math.round(G.lw); cv.height = Math.round(G.lh);
      const c2 = cv.getContext("2d")!;
      const pos = lerp(1.5, -0.6, b) * G.lw * 2.6 / 2.6;
      const gr = c2.createLinearGradient(pos - G.lw * 0.3, 0, pos + G.lw * 0.3, G.lh * 0.25);
      gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, "rgba(255,255,255,0.95)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      c2.fillStyle = gr; c2.fillRect(0, 0, cv.width, cv.height);
      c2.globalCompositeOperation = "destination-in"; c2.drawImage(marca, 0, 0, cv.width, cv.height);
      g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = alfa * (b < 0.88 ? 1 : (1 - b) / 0.12); g.drawImage(cv, x0, y0); g.restore();
    }
  }
  // LECTURES, letter by letter, in three groups (LEC on the left charge, TUR on the right, ES with both)
  const letras = "LECTURES", grupo = [1, 1, 1, 2, 2, 2, 3, 3], kk = [0, 1, 2, 0, 1, 2, 0, 1], tg = [T_LEC, T_TUR, T_CONV];
  const tam = 0.0854 * G.lw, ly = y0 + G.lh + 0.041 * G.lw + tam * 0.95;
  for (let i = 0; i < 8; i++) {
    const t0 = tg[grupo[i] - 1] + kk[i] * 0.07, a = eOut(pr(t, t0, 0.45)), f = eOut(pr(t, t0, 0.5));
    if (a <= 0.01) continue;
    const x = x0 + 0.0049 * G.lw + (i / 7) * (0.9704 - 0.0529) * G.lw;
    g.save(); g.globalAlpha = a * alfa;
    g.font = `300 ${tam}px "${SANS}"`; g.textAlign = "left";
    g.filter = `blur(${(5 * (1 - f)).toFixed(2)}px)`;
    g.shadowColor = `rgba(91,134,255,${0.75 * f})`; g.shadowBlur = 14;
    g.fillStyle = "#F4F5F8"; g.fillText(letras[i], x, ly + 0.14 * tam * (1 - f));
    g.restore();
  }
};

/** the whole mark, at t seconds from the release (the drawing runs from −D to 0); alfa fades it all */
export const dibujarLogo = (g: Ctx, W: number, H: number, t: number, marca: HTMLImageElement | undefined, crudos: number[][][], alfa = 1) => {
  if (!marca || alfa <= 0.01) return;
  const { geo: G, C, ps } = prepara(W, H, marca, crudos);
  g.save(); g.globalAlpha = alfa; g.globalCompositeOperation = "lighter";
  if (t < 0) { epiciclos(g, G, C, t + D); g.restore(); return; }
  const pico = t > T_CONV ? Math.exp(-(t - T_CONV) * 3) : 0;
  const respira = 1 + 0.035 * Math.sin((TAU * t) / 2.2);
  [G.q1, G.q2].forEach(([x, y], i) => {
    const enc = eOut(pr(t, ENC[i], 0.18)), pi = t > ENC[i] ? Math.exp(-(t - ENC[i]) * 3) : 0;
    if (CARGAS_FRACTALES) cargaFractal(g, x, y, (i ? 1.12 : 0.95) * G.s, enc, i, t);
    else estallido(g, x, y, (i ? 1.12 : 0.95) * (1 + 0.55 * Math.max(pico, pi)) * respira * G.s, enc, i * 13, t);
    const [r, a] = frente(G, t, i);
    if (a > 0.02 && !CARGAS_FRACTALES) { g.strokeStyle = `rgba(150,185,255,${0.55 * a})`; g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.strokeStyle = `rgba(70,120,255,${0.18 * a})`; g.lineWidth = 7; g.stroke(); }
  });
  if (pico > 0.02) brillo(g, W / 2, G.cy, W * 0.55, "90,130,255", 0.1 * pico);
  nube(g, G, ps, t);
  g.restore();
  g.save(); g.globalAlpha = 1; marcaYLetras(g, G, marca, t, alfa); g.restore();
};
