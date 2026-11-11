// The trailer's opening: the film's own cosmic zoom (src/montajeMG.ts, «the zoom of the film's ending») taken on, past
// the neurons, down to the smallest thing there is. The same engine: every image lives in one world, nested in the
// last (the region a stage leaves by is the region the next one enters by), one camera whose aim glides from region to
// region with no change of direction at the joins, a zoom rate that eases in, each frame the average of six exposures
// across the shutter, and every new world resolving from the aim outwards (or, if it is light on black, shining in).
//
// web → cluster → galaxy → star → Earth → hurricane → its eye → an eye → its retina → neurons → a drop of dew on a
// leaf → radiolarians → a diatom → atoms → (on the GPU, src/simsCuanticas.ts) an electron's cloud → a nucleus → the
// inside of a proton → the foam of space-time. At the end the foam flares into light.
import COS from "./cosmos.json";
import { pintarSim } from "./simsCuanticas";
import { cl, eSuave } from "./theme";

type Ctx = CanvasRenderingContext2D;
type Etapa = { src: string; w: number; h: number; entra: number[]; sale: number[]; modo?: "luz" | "recorte"; pre?: number; post?: number; apaga?: number[]; dur: number; velo?: string };
const W = 1920, H = 1080;
// the worlds (src/apertura_etapas.json, shared with the score): each one is entered and left at the same point, so the
// camera goes straight to its focus and never turns (the entry region only says how wide the world opens)
import LISTA from "./apertura_etapas.json";
const ETAPAS = LISTA as unknown as Etapa[];
export const RUTAS_APERTURA = [...new Set([...ETAPAS.map((e) => e.src).filter((s) => !s.startsWith("sim:")), "trailer/copia.jpg"])];

// the hook (GANCHO s): the copy at ×10⁵⁶ bursts in, holds, and recedes to a point of light, the brightest node of
// the cosmic web, where the dive begins
export const GANCHO = 2.7;
// after the arrival the foam goes on (COLA s, the first intertitle lies over it); no flare
export const COLA = 2.6;
export const AP = { inicio: GANCHO + 0.25, llega: GANCHO + 17.0, fin: GANCHO + 17.3 + COLA, destello: 1e9 };
const LZ = ETAPAS.reduce((a, e) => [...a, a[a.length - 1] + Math.log(e.entra[2] / e.sale[2])], [0]);
const LFIN = LZ[LZ.length - 1];
export const LLEGADAS = LZ.slice(1, -1);
// every position is kept in the pixels of one stage (world scales span e⁴⁵: no float can hold them all together);
// stage j's exit region and stage j+1's entry region are the same place, which links neighbours
const WH = (i: number) => [ETAPAS[i].w, ETAPAS[i].h];
const sube = (p: number[], j: number) => {           // stage j pixels → stage j+1 pixels
  const e = ETAPAS[j], f = ETAPAS[j + 1], r = (f.entra[2] * f.w) / (e.sale[2] * e.w);
  return [f.entra[0] * f.w + (p[0] - e.sale[0] * e.w) * r, f.entra[1] * f.h + (p[1] - e.sale[1] * e.h) * r];
};
const baja = (p: number[], j: number) => {           // stage j pixels → stage j−1 pixels
  const e = ETAPAS[j - 1], f = ETAPAS[j], r = (e.sale[2] * e.w) / (f.entra[2] * f.w);
  return [e.sale[0] * e.w + (p[0] - f.entra[0] * f.w) * r, e.sale[1] * e.h + (p[1] - f.entra[1] * f.h) * r];
};
const pasa = (p: number[], de: number, a: number) => { let q = p; for (let k = de; k < a; k++) q = sube(q, k); for (let k = de; k > a; k--) q = baja(q, k); return q; };
// segment j of the camera: from stage j's entry region to its exit region, zooming about the one fixed point
const tramoCam = (j: number, L: number) => {
  const e = ETAPAS[j], [w, h] = WH(j);
  const A = [e.entra[0] * w, e.entra[1] * h], B = [e.sale[0] * w, e.sale[1] * h];
  const r = Math.exp(LZ[j + 1] - LZ[j]), f = Math.exp(LZ[j] - L);
  const px = (A[0] - B[0] * r) / (1 - r), py = (A[1] - B[1] * r) / (1 - r);
  return [px + (A[0] - px) * f, py + (A[1] - py) * f];
};
// the camera's centre, in stage i's pixels; around each join it blends from one segment's path to the next
const centroEn = (i: number, L: number) => {
  const n = ETAPAS.length;
  let j = 0;
  while (j < n - 1 && L > LZ[j + 1]) j++;
  let c = tramoCam(j, L);
  for (const k of [j, j + 1]) {
    if (k < 1 || k > n - 1) continue;
    const d = 0.45 * Math.min(LZ[k] - LZ[k - 1], LZ[k + 1] - LZ[k]);
    const b = eSuave(cl((L - LZ[k] + d) / (2 * d)));
    if (b > 0 && b < 1) { const a0 = pasa(tramoCam(k - 1, L), k - 1, j), a1 = pasa(tramoCam(k, L), k, j); c = [a0[0] + (a1[0] - a0[0]) * b, a0[1] + (a1[1] - a0[1]) * b]; }
  }
  return pasa(c, j, i);
};
// the zoom rate: each world gets its own time on screen (DUR, relative), the rate within it is its depth over its
// time, and the rate glides from one world's to the next (it never jumps); it eases in out of the dark
const DUR = ETAPAS.map((e) => e.dur);
const MED = ETAPAS.map((_, i) => (LZ[i] + LZ[i + 1]) / 2);
const TASA = ETAPAS.map((_, i) => (LZ[i + 1] - LZ[i]) / DUR[i]);
const RITMO = (L: number) => {
  let r = TASA[0];
  if (L >= MED[MED.length - 1]) r = TASA[TASA.length - 1];
  else for (let i = 0; i + 1 < MED.length; i++) if (L >= MED[i] && L < MED[i + 1]) { const u = eSuave((L - MED[i]) / (MED[i + 1] - MED[i])); r = TASA[i] * Math.pow(TASA[i + 1] / TASA[i], u); }
  return r * (0.3 + 0.7 * eSuave(cl(L / 1.0)));
};
const TABLA = (() => {
  const n = 6000, t = [0];
  for (let i = 1; i <= n; i++) { const L = (LFIN * (i - 0.5)) / n; t.push(t[i - 1] + LFIN / n / RITMO(L)); }
  const v = t[n] / (AP.llega - AP.inicio);
  return { n, t: t.map((x) => AP.inicio + x / v), v };
})();
export const nivelZoom = (t: number) => {
  const { n, t: T, v } = TABLA;
  if (t <= T[0]) return (t - T[0]) * v * RITMO(0);
  if (t >= T[n]) return LFIN + (t - T[n]) * v * RITMO(LFIN);
  let a = 0, b = n;
  while (b - a > 1) { const m = (a + b) >> 1; if (T[m] <= t) a = m; else b = m; }
  return (LFIN * (a + (t - T[a]) / (T[b] - T[a]))) / n;
};
/** when each world arrives (s), for the score */
export const tiemposLlegada = () => LLEGADAS.map((L) => {
  let a = 0, b = TABLA.n; const T = TABLA.t;
  while (b - a > 1) { const m = (a + b) >> 1; if ((LFIN * m) / TABLA.n <= L) a = m; else b = m; }
  return T[a];
});
const alfaEntra = (i: number, L: number) => {
  const e = ETAPAS[i], pre = e.pre ?? 0.35, post = e.post ?? 0.35;
  return i === 0 ? 1 : eSuave(cl((L - (LZ[i] - pre)) / (pre + post)));
};
const alfaEtapa = (i: number, L: number) => {
  const e = ETAPAS[i], ap = e.apaga;
  return alfaEntra(i, L) * (ap && i + 1 < ETAPAS.length ? 1 - eSuave(cl((L - (LZ[i + 1] + ap[0])) / (ap[1] - ap[0]))) : 1);
};
// screen mapping of stage i at log-zoom L: X = X0 + px·sk; at the stage's start its entry region is R px in radius
const mapa = (i: number, L: number) => {
  const e = ETAPAS[i];
  const sk = (COS.R / (e.entra[2] * e.w)) * Math.exp(L - LZ[i]);
  const [px, py] = centroEn(i, L);
  return { X0: W / 2 - px * sk, Y0: H / 2 - py * sk, sk, aimX: W / 2 + (e.entra[0] * e.w - px) * sk, aimY: H / 2 + (e.entra[1] * e.h - py) * sk };
};
const cubreTodo = (i: number, L: number) => {
  const e = ETAPAS[i], { X0, Y0, sk } = mapa(i, L);
  return X0 <= 0 && Y0 <= 0 && X0 + e.w * sk >= W && Y0 + e.h * sk >= H;
};
const visibles = (L: number) => ETAPAS.map((_, i) => i).filter((i) => {
  if (alfaEtapa(i, L) <= 0.002) return false;
  const sig = ETAPAS[i + 1];
  return !(sig && !sig.modo && alfaEntra(i + 1, L) >= 0.999 && cubreTodo(i + 1, L));
});

let capaZ: HTMLCanvasElement | null = null, capaE: HTMLCanvasElement | null = null, capaV: HTMLCanvasElement | null = null;
const lienzo = (c: HTMLCanvasElement | null) => { if (c) return c; const n = document.createElement("canvas"); n.width = W; n.height = H; return n; };

const exposicion = (c: Ctx, L: number, t: number, fotos: Map<string, HTMLImageElement>) => {
  c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
  c.fillStyle = "#020306"; c.fillRect(0, 0, W, H);
  for (const i of visibles(L)) {
    const e = ETAPAS[i], { X0, Y0, sk, aimX, aimY } = mapa(i, L);
    const a = alfaEtapa(i, L);
    let dibuja: (d: Ctx) => void;
    if (e.src.startsWith("sim:")) {
      const lz = pintarSim(e.src.slice(4), W, H, X0, Y0, sk, t, (L - LZ[i]) / Math.LN2);
      dibuja = (d) => d.drawImage(lz, 0, 0, W, H);
    } else {
      const im = fotos.get(e.src);
      if (!im) continue;
      const ks = sk * (e.w / im.width);                       // the image may be loaded at another size
      const sx0 = Math.max(0, -X0 / ks), sy0 = Math.max(0, -Y0 / ks);
      const sx1 = Math.min(im.width, (W - X0) / ks), sy1 = Math.min(im.height, (H - Y0) / ks);
      if (sx1 <= sx0 || sy1 <= sy0) continue;
      dibuja = (d) => d.drawImage(im, sx0, sy0, sx1 - sx0, sy1 - sy0, X0 + sx0 * ks, Y0 + sy0 * ks, (sx1 - sx0) * ks, (sy1 - sy0) * ks);
    }
    c.save(); c.imageSmoothingQuality = "high";
    if (e.modo === "luz") { c.globalCompositeOperation = "screen"; c.globalAlpha = a; dibuja(c); }
    else if (a >= 0.999 || i === 0) { c.globalAlpha = a; dibuja(c); }
    else {
      // a new world resolves from the aim outwards: the centre comes in first, the edges follow
      capaV = lienzo(capaV);
      const d = capaV.getContext("2d")!;
      d.globalCompositeOperation = "source-over"; d.globalAlpha = 1; d.clearRect(0, 0, W, H);
      d.imageSmoothingQuality = "high";
      dibuja(d);
      const p = alfaEntra(i, L), q = e.apaga ? alfaEtapa(i, L) / Math.max(1e-3, p) : 1;
      const g = d.createRadialGradient(aimX, aimY, 0, aimX, aimY, Math.hypot(W, H) * 0.6);
      g.addColorStop(0, `rgba(0,0,0,${q * eSuave(cl(p * 1.6))})`);
      g.addColorStop(1, `rgba(0,0,0,${q * eSuave(cl(p * 1.6 - 0.6))})`);
      d.globalCompositeOperation = "destination-in"; d.fillStyle = g; d.fillRect(0, 0, W, H);
      c.drawImage(capaV, 0, 0);
    }
    c.restore();
  }
};

export const imagenesApertura = () => RUTAS_APERTURA;
const EXPOS = 6, OBTURADOR = 0.5 / 30;
export const dibujarApertura = (ctx: Ctx, t: number, fotos: Map<string, HTMLImageElement>) => {
  capaZ = lienzo(capaZ); capaE = lienzo(capaE);
  const z = capaZ.getContext("2d")!, ce = capaE.getContext("2d")!;
  z.globalCompositeOperation = "source-over"; z.globalAlpha = 1; z.fillStyle = "#000"; z.fillRect(0, 0, W, H);
  for (let s = 0; s < EXPOS; s++) {
    const ts = t + ((s + 0.5) / EXPOS - 0.5) * OBTURADOR;
    exposicion(ce, nivelZoom(ts), ts, fotos);
    z.globalCompositeOperation = "lighter"; z.globalAlpha = 1 / EXPOS; z.drawImage(capaE, 0, 0);
  }
  ctx.save();
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = eSuave(cl((t - (GANCHO - 1.0)) / 0.9)); ctx.drawImage(capaZ, 0, 0);
  ctx.restore();
  // at first the web opens from the centre (its edges, and the corner of its source, stay in the dark)
  const ab = 1 - eSuave(cl((t - (GANCHO - 0.4)) / 1.8));
  if (ab > 0) {
    ctx.save(); const R0 = 140 + 1500 * (1 - ab);
    const g = ctx.createRadialGradient(W / 2, H / 2, R0 * 0.2, W / 2, H / 2, R0);
    g.addColorStop(0, "rgba(2,3,6,0)"); g.addColorStop(1, `rgba(2,3,6,${ab})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  // the hook: the copy, full frame, pushing in slowly; it fills with light from its centre, and out of that light
  // the cosmic web is born (no shape is cut, nothing shrinks: one picture becomes light, the light becomes the next)
  const cp = fotos.get("trailer/copia.jpg");
  if (cp && t < GANCHO + 0.6) {
    const z = 1.0 + 0.1 * eSuave(cl(t / (GANCHO + 0.6)));
    const a = eSuave(cl((t - 0.2) / 0.08)) * (1 - eSuave(cl((t - (GANCHO - 0.9)) / 1.3)));
    ctx.save(); ctx.globalAlpha = a;
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.drawImage(cp, -W / 2, -H / 2, W, H); ctx.restore();
  }
  const luz = eSuave(cl((t - 1.3) / 1.0)) * (1 - eSuave(cl((t - (GANCHO - 0.3)) / 1.1)));
  if (luz > 0) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 300 + 900 * luz);
    g.addColorStop(0, `rgba(255,244,226,${0.95 * luz})`); g.addColorStop(0.35, `rgba(255,232,205,${0.5 * luz})`); g.addColorStop(1, "rgba(255,225,195,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  // its flash as it bursts in
  const fl = cl(1 - Math.abs(t - 0.25) / 0.3);
  if (fl > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,244,226,${0.85 * fl * fl})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // the veils between worlds (as in the film's journey): a point of light that swells and is the next world, or the
  // cloud deck the camera goes through
  const L = nivelZoom(t);
  ETAPAS.forEach((e, i) => {
    if (!e.velo || i + 1 >= ETAPAS.length) return;
    const k = Math.exp(-(((L - LZ[i + 1]) / 0.45) ** 2));
    if (k < 0.01) return;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    if (e.velo === "destello") {
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 60 + 520 * k);
      g.addColorStop(0, `rgba(255,248,235,${0.95 * k})`); g.addColorStop(0.25, `rgba(255,236,210,${0.45 * k})`); g.addColorStop(1, "rgba(255,230,200,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } else {
      ctx.globalCompositeOperation = "source-over"; ctx.filter = `blur(${(10 + 30 * k).toFixed(1)}px)`; ctx.globalAlpha = 0.85 * k; ctx.drawImage(ctx.canvas, 0, 0); ctx.filter = "none";
      ctx.fillStyle = `rgba(220,228,238,${0.55 * k})`; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  });
  // the end: the foam flares into light (the next shot comes out of it)
  const f = AP.destello < AP.fin ? eSuave(cl((t - AP.destello) / (AP.fin - AP.destello))) : 0;
  if (f > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,240,220,${f})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
};
