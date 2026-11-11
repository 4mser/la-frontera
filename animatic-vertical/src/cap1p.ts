// CAPÍTULO I · «La regla» · preview (fractales/GUION-capitulo-1-la-regla.md, scene 1, rebuilt as cinema).
// Two heartbeats in the dark; the chapter's title hits, with the Douady rabbit alive inside its letters; the letters
// open and we are inside that plane. There the rule happens for real: a number (a point), squared (it turns to double
// its angle and its distance is squared), plus a constant (the same push every time), and again, on the beat, faster
// and faster. Then thousands of starting points take the same rule at once: the ones that escape fly out, the ones
// that stay settle, and the shape they were drawing comes into focus behind them: the set itself.
// Every motion is the true one (polar interpolation of z → z², then the straight push by c).
import K from "./cap1p.json";
import { LIMPIO as SIN_TEXTO_TRAILER } from "./limpio";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { RGB, SANS, MONO, cl, eIO, eOut, eSuave, lerp, num, pr } from "./theme";
import { dibujarExplicacion, planoVisible } from "./cap1f";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
const AZUL = "150,190,255", AMBAR = "255,190,120";
// a tall frame (9:16 reels): larger type for a phone, the plane fitted to the width, and nothing in the strips the
// apps cover with their buttons (above) and captions (below)
const V = H > W * 1.2;
const KT = V ? 1.25 : Math.min(1, W / 1500);
const SEG_A = V ? 170 : 0, SEG_B = V ? 400 : 0;
const LIMPIO = (FORMATO as { limpio?: boolean }).limpio === true;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: LIMPIO ? 0 : 0.05, scan: LIMPIO ? 0 : 0.18, ruido: LIMPIO ? 0 : 0.5, grade: 1.8 };
const [CR, CI] = K.c;
type Z = [number, number];

// ─── text ───────────────────────────────────────────────────────────────────────────────────────────────────────
const fuente = (ctx: Ctx, tam: number, fam: string, peso: number, esp: number) => {
  ctx.font = `${peso} ${tam}px "${fam}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${esp}px`;
};
const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  if (SIN_TEXTO_TRAILER && color !== "#fff") return;
  fuente(ctx, tam, op.fam ?? MONO, op.peso ?? 500, op.esp ?? 3);
  ctx.fillStyle = color;
  ctx.textAlign = op.alin ?? "left";
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};

// ─── the plane: complex numbers ↔ screen, with a slow camera ────────────────────────────────────────────────────
// s: pixels per unit; the camera pushes in slowly at the end
// A · after the reveal, the dive into a point of the border near the rabbit's right tip (K.beta): the scale grows at a steady rate (eased at both ends) to
// ×8 000, and the centre slides towards β so that β ends in the middle of the frame (centre = β + (c0 − β)·(s0/s)², so β is centred early in the dive);
// B · then the same way back, faster
const S0 = V ? W * 0.33 : H * 0.42;
const camara = (t: number) => {
  const empuje = (1 + 0.06 * eIO(pr(t, K.entra[1], K.golpes[0] - K.entra[1])) - 0.06 * eIO(pr(t, K.golpes[0], 3)));
  const za = eIO(pr(t, K.zoomA[0], K.zoomA[1] - K.zoomA[0])) * (1 - eIO(pr(t, K.fuera[0], K.fuera[1] - K.fuera[0])));
  const k = Math.exp(Math.log(K.zoomMax) * za), s = S0 * empuje * k;
  const f = Math.pow(1 / k, 2);
  // while the two points are explained, the rabbit slides left to make room for the chart; back for the sweep
  const lado = eIO(pr(t, K.vuelta + 0.4, 1.4)) * (1 - eIO(pr(t, K.muestra[0] - 0.6, 1.1)));
  return { s, cx: K.beta[0] * (1 - f) + (V ? 0 : 0.62 * lado), cy: K.beta[1] * (1 - f) - (V ? 1.1 * lado : 0) };
};
let CAM = camara(0);
const aPantalla = (z: Z): [number, number] => [W / 2 + (z[0] - CAM.cx) * CAM.s, H / 2 - (z[1] - CAM.cy) * CAM.s];
// the rule's two motions: z → z² as a turn and a stretch (angle × (1 + u), distance ^ (1 + u)), then the push by c
const cuadradoParcial = (z: Z, u: number): Z => {
  const r = Math.hypot(z[0], z[1]), th = Math.atan2(z[1], z[0]);
  const rr = Math.pow(r, 1 + u), tt = th * (1 + u);
  return [rr * Math.cos(tt), rr * Math.sin(tt)];
};
export const paso = (z: Z): Z => [z[0] * z[0] - z[1] * z[1] + CR, 2 * z[0] * z[1] + CI];
// a point during one turn of the rule, u = 0..1: 60 % turning, 40 % pushed
export const enVuelta = (z: Z, u: number): Z => {
  if (u < 0.6) return cuadradoParcial(z, eIO(u / 0.6));
  const q = cuadradoParcial(z, 1), v = eIO((u - 0.6) / 0.4);
  return [q[0] + CR * v, q[1] + CI * v];
};

// ─── the set behind: the filled Julia set of c, rendered at the camera's view, dimmed and out of focus ────────────
let capaF: HTMLCanvasElement | null = null;
const fondo = (ctx: Ctx, t: number, alfa: number, desenfoque: number, maxIt = 400, interior = 1, brillo = 0.9, fase = 0.04 * t) => {
  if (alfa <= 0.01) return;
  const l = pintarFractalTeaser(W, H, { cx: CAM.cx, cy: CAM.cy, esc: 1 / CAM.s, rot: 0, julia: [CR, CI], modo: 0, lente: 1e9, fase, paleta: PALETAS[2], brillo, maxIt, tiempo: 0.4 * t, interior });
  if (!capaF) { capaF = document.createElement("canvas"); capaF.width = W; capaF.height = H; }
  const c = capaF.getContext("2d")!;
  c.globalCompositeOperation = "copy"; c.drawImage(l, 0, 0, W, H);
  ctx.save(); ctx.globalAlpha = alfa;
  if (desenfoque > 0.3) ctx.filter = `blur(${desenfoque}px)`;
  ctx.drawImage(capaF, 0, 0);
  ctx.restore();
};

// ─── the drawing: the border itself, traced by points of light ──────────────────────────────────────────────────
// The rule run backwards (z → ±√(z − c), the sign at random) lands exactly on the set's border, the Julia set,
// point after point (inverse iteration, a classic exact method). Two million landings, in order; at time t the first
// «cuantos» are drawn as light: one by one at first, then by the thousand, until the whole filigree is there.
const TRAZO = (() => {
  const n = 2_000_000, out = new Float32Array(2 * n);
  let sem = 12345;
  const azar = () => { sem = (Math.imul(sem, 1103515245) + 12345) | 0; return ((sem >>> 16) & 0x7fff) / 32768; };
  // it starts exactly where the explained turn left the point: z0² + c
  let x = K.z0[0] * K.z0[0] - K.z0[1] * K.z0[1] + CR, y = 2 * K.z0[0] * K.z0[1] + CI;
  out[0] = x; out[1] = y;
  for (let i = 1; i < n; i++) {
    const a = x - CR, b = y - CI, r = Math.hypot(a, b);
    let u = Math.sqrt((r + a) / 2), v = Math.sqrt(Math.max(0, (r - a) / 2)) * (b < 0 ? -1 : 1);
    if (azar() < 0.5) { u = -u; v = -v; }
    x = u; y = v;
    out[2 * i] = x; out[2 * i + 1] = y;
  }
  return out;
})();
let capaD: HTMLCanvasElement | null = null, densidad: Float32Array | null = null, imagenD: ImageData | null = null;
const dibujoDeLuz = (ctx: Ctx, t: number, cuantos: number, a: number) => {
  if (a <= 0.01 || cuantos < 1) return;
  if (!capaD) { capaD = document.createElement("canvas"); capaD.width = W; capaD.height = H; densidad = new Float32Array(W * H); imagenD = capaD.getContext("2d")!.createImageData(W, H); }
  const d = densidad!, img = imagenD!.data;
  d.fill(0);
  const vuelo = vueloDe(t), lento = t < K.nube[0];
  const n = Math.min(lento && vuelo.u < 1 ? cuantos - 1 : cuantos, TRAZO.length / 2);
  for (let i = 0; i < n; i++) {
    const px = Math.round(W / 2 + (TRAZO[2 * i] - CAM.cx) * CAM.s), py = Math.round(H / 2 - (TRAZO[2 * i + 1] - CAM.cy) * CAM.s);
    if (px >= 0 && px < W && py >= 0 && py < H) d[py * W + px] += 1;
  }
  // tone: a single landing already glows; many saturate to a warm white
  const ref = Math.log1p(3 + n / 300000);
  for (let k = 0, j = 0; k < d.length; k++, j += 4) {
    const v = d[k] > 0 ? Math.min(1, 0.35 + Math.log1p(d[k]) / ref) : 0;
    img[j] = 255 * Math.pow(v, 0.55); img[j + 1] = 222 * Math.pow(v, 0.7); img[j + 2] = 170 * v; img[j + 3] = 255;
  }
  capaD.getContext("2d")!.putImageData(imagenD!, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a;
  ctx.drawImage(capaD, 0, 0);
  ctx.filter = "blur(5px)"; ctx.globalAlpha = a * 0.9; ctx.drawImage(capaD, 0, 0);
  ctx.filter = "blur(20px)"; ctx.globalAlpha = a * 0.6; ctx.drawImage(capaD, 0, 0);
  ctx.restore();
  // while they are few, every landing is a small light, so each one is seen to arrive
  const pocos = 1 - eSuave(cl((n - 200) / 2500));
  if (pocos > 0.01) for (let i = 0; i < Math.min(n, 2700); i++) {
    const p = aPantalla([TRAZO[2 * i], TRAZO[2 * i + 1]]);
    luz(ctx, p[0], p[1], (n < 120 ? 11 : 7) * KT + 3, (n < 120 ? 0.6 : 0.45) * a * pocos, AMBAR);
  }
  // the pen: the latest landings, as sparks, brighter on the newest
  if (!lento) for (let i = Math.max(0, n - 10); i < n; i++) {
    const p = aPantalla([TRAZO[2 * i], TRAZO[2 * i + 1]]);
    luz(ctx, p[0], p[1], (22 + 18 * ((i - n + 10) / 10)) * KT + 4, 0.7 * a * ((i - n + 11) / 11), AMBAR);
  }
  // the lines that join the landings never stay: each one goes out a moment after its point lands, so the fractal is
  // what remains. While slow, the last jumps fade behind the point; when fast, a short trail follows the pen, and it
  // too goes out before the reveal
  {
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    const G = K.golpes, linea = (i: number, al: number) => {
      if (i < 1 || al <= 0.01) return;
      const p0 = aPantalla([TRAZO[2 * i - 2], TRAZO[2 * i - 1]]), p1 = aPantalla([TRAZO[2 * i], TRAZO[2 * i + 1]]);
      ctx.strokeStyle = `rgba(${AMBAR},${al})`; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
    };
    if (lento) {
      for (let i = Math.max(1, vuelo.k - 3); i < vuelo.k; i++) {
        const aterriza = G[i - 1] + (G[i] - G[i - 1]) * 0.7;
        linea(i, 0.7 * a * Math.exp(-Math.max(0, t - aterriza) * 3));
      }
    } else {
      const L = Math.min(n - 1, 40), sale = 1 - eSuave(pr(t, K.revela - 1.0, 0.8));
      for (let j = 0; j < L; j++) linea(n - 1 - j, 0.6 * a * sale * Math.pow(1 - j / L, 2));
    }
    ctx.restore();
  }
  // while slow, the point itself is in flight: a thin line from where it was to where it lands
  if (lento && vuelo.k > 0) {
    const i = vuelo.k, z0: Z = [TRAZO[2 * i - 2], TRAZO[2 * i - 1]], z1: Z = [TRAZO[2 * i], TRAZO[2 * i + 1]];
    const v = eIO(vuelo.u), p0 = aPantalla(z0), p1 = aPantalla([lerp(z0[0], z1[0], v), lerp(z0[1], z1[1], v)]);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(${AMBAR},${0.7 * a})`; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
    ctx.restore();
    const golpe = Math.exp(-Math.max(0, t - K.golpes[i - 1]) * 6);
    luz(ctx, p1[0], p1[1], (30 + 26 * golpe) * KT + 8, a, AMBAR);
  }
  // the honest caption: the drawing uses the same rule, run backwards
  const ac = eSuave(pr(t, K.nube[0] + 0.6, 0.8)) * (1 - eSuave(pr(t, K.revela + 0.4, 1.0)));
  if (ac > 0.01) {
    const ls = V ? ["LA MISMA REGLA, AL REVÉS", "CADA SALTO CAE EN LA FRONTERA"] : ["LA MISMA REGLA, AL REVÉS · CADA SALTO CAE EN LA FRONTERA"];
    ls.forEach((l, k) => texto(ctx, l, 80, H - 150 - SEG_B - (ls.length - 1 - k) * 34, 16 * KT + 4, `rgba(${RGB.crema},${0.6 * ac})`, { esp: 4 }));
  }
};
// how many points have landed at time t: one by one at first, then faster and faster, to two million at the reveal
const cuantosDe = (t: number) => {
  const G = K.golpes, N = K.nube;
  if (t < G[0]) return 0;
  let k = 0;
  for (const g of G) if (t >= g) k++;
  if (t < N[0]) return 1 + k;
  const u = pr(t, N[0], K.revela - N[0]);
  return Math.min(2_000_000, Math.floor((1 + G.length) * Math.exp(Math.log(2_000_000 / (1 + G.length)) * Math.pow(u, 1.5))));
};
// the jump in flight during the slow beats: from landing k − 1 to landing k, 0..1
const vueloDe = (t: number) => {
  const G = K.golpes;
  let k = 0;
  for (const g of G) if (t >= g) k++;
  if (k === 0) return { k: 0, u: 1 };
  const dur = k < G.length ? G[k] - G[k - 1] : 0.4;
  return { k, u: cl((t - G[k - 1]) / (dur * 0.7)) };
};

// ─── B · two neighbours, two fates ──────────────────────────────────────────────────────────────────────────────
const orbitaDe = (z: Z, n: number): Z[] => { const o: Z[] = [z]; for (let i = 0; i < n; i++) { const p = o[o.length - 1]; o.push(Math.hypot(p[0], p[1]) > 40 ? p : [p[0] * p[0] - p[1] * p[1] + CR, 2 * p[0] * p[1] + CI]); } return o; };
const DENTRO = orbitaDe([K.dentro[0], K.dentro[1]], 20), AFUERA = orbitaDe([K.afuera[0], K.afuera[1]], 20);
const ROJO = "255,120,95";
// one point, the rule applied again and again: the jumps (lines that fade), and where it started, painted by its fate
const unPunto = (ctx: Ctx, t: number, o: Z[], S: number[], col: string, pinta: number, etq: string) => {
  if (t < S[0] - 0.8 || t > K.total) return;
  const a = eSuave(pr(t, S[0] - 0.8, 0.6)) * (1 - eSuave(pr(t, K.barrido[0] + 1.0, 1.2)));
  if (a <= 0.01) return;
  let k = 0;
  for (const g of S) if (t >= g) k++;
  const dur = k > 0 && k < S.length ? S[k] - S[k - 1] : 0.5, u = k > 0 ? eIO(cl((t - S[k - 1]) / (dur * 0.7))) : 0;
  const pos = (j: number, v: number): Z => [lerp(o[j][0], o[j + 1][0], v), lerp(o[j][1], o[j + 1][1], v)];
  const cur = k === 0 ? o[0] : pos(k - 1, u);
  const corre = 1 - eSuave(pr(t, pinta - 0.4, 0.6));            // the jumps go out when the start is painted
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
  for (let j = Math.max(0, k - 4); j < k; j++) {
    const p0 = aPantalla(o[j]), p1 = aPantalla(j === k - 1 ? cur : o[j + 1]);
    const edad = j === k - 1 ? 0 : t - S[j + 1];
    ctx.strokeStyle = `rgba(${col},${0.75 * a * corre * Math.exp(-Math.max(0, edad) * 2.2)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
  }
  ctx.restore();
  for (let j = 1; j < k; j++) { const p = aPantalla(o[j]); luz(ctx, p[0], p[1], 9 * KT + 3, 0.45 * a * corre * Math.exp(-(t - S[j - 1]) * 0.5), col); }
  const p = aPantalla(cur);
  if (p[0] > -60 && p[0] < W + 60 && p[1] > -60 && p[1] < H + 60) luz(ctx, p[0], p[1], 28 * KT + 8, a * corre, col);
  // the start, painted
  const ap = a * eSuave(pr(t, pinta, 0.5));
  if (ap > 0.01) {
    const p0 = aPantalla(o[0]), r = 22 * KT + 6;
    ctx.save(); ctx.fillStyle = `rgba(${col},${0.85 * ap})`; ctx.beginPath(); ctx.arc(p0[0], p0[1], r * (1 + 0.3 * Math.exp(-(t - pinta) * 5)), 0, Math.PI * 2); ctx.fill(); ctx.restore();
    luz(ctx, p0[0], p0[1], r * 3, 0.5 * ap, col);
    texto(ctx, etq, p0[0], p0[1] + r + 38, 20 * KT + 4, `rgba(${col},${0.95 * ap})`, { esp: 6, alin: "center" });
  } else {
    // before it is painted, a small ring marks where it started
    const p0 = aPantalla(o[0]);
    ctx.save(); ctx.strokeStyle = `rgba(${col},${0.7 * a})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(p0[0], p0[1], 16 * KT + 4, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
};
// the chart: how far from the centre the point is, turn after turn, with the line at 2 that no one crosses and
// comes back; the one that stays wanders under it, the one that escapes shoots through it and off the chart
const grafico = (ctx: Ctx, t: number) => {
  const a = eSuave(pr(t, K.voz[37] + 1.0, 0.8)) * (1 - eSuave(pr(t, K.muestra[0] - 0.8, 0.8)));
  if (a <= 0.01) return;
  const x0 = V ? W * 0.16 : W * 0.6, x1 = V ? W * 0.9 : W * 0.93, y0 = V ? H - SEG_B - 90 : H * 0.78, y1 = V ? H - SEG_B - 90 - H * 0.21 : H * 0.26, VMAX = 2.6, N = 10;
  const X = (k: number) => lerp(x0, x1, k / N), Y = (v: number) => lerp(y0, y1, v / VMAX);
  texto(ctx, "DISTANCIA AL CENTRO", x0, y1 - 46, 20 * KT + 4, `rgba(${RGB.crema},${0.85 * a})`, { esp: 5 });
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.5 * a})`; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
  for (const v of [0, 1, 2]) texto(ctx, String(v), x0 - 16, Y(v) + 6, 16 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "right", esp: 0 });
  texto(ctx, "VUELTAS →", x1, y0 + 34, 14 * KT + 4, `rgba(${RGB.crema},${0.5 * a})`, { alin: "right", esp: 4 });
  // the line at 2
  ctx.setLineDash([8, 7]); ctx.strokeStyle = `rgba(${ROJO},${0.8 * a})`; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x0, Y(2)); ctx.lineTo(x1, Y(2)); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  texto(ctx, "QUIEN CRUZA ESTA LÍNEA, NO VUELVE", x1, Y(2) - 12, 14 * KT + 4, `rgba(${ROJO},${0.85 * a})`, { alin: "right", esp: 3 });
  // a curve per point, drawn jump by jump
  for (const [o, S, col] of [[DENTRO, K.saltosIn, AZUL], [AFUERA, K.saltosOut, ROJO]] as const) {
    let k = 0;
    for (const g of S) if (t >= g) k++;
    if (t < S[0] - 0.6) continue;
    const dur = k > 0 && k < S.length ? S[k] - S[k - 1] : 0.5, u = k > 0 ? eIO(cl((t - S[k - 1]) / (dur * 0.7))) : 0;
    const pts: [number, number][] = [];
    for (let j = 0; j <= k; j++) {
      const v = Math.hypot(o[j][0], o[j][1]);
      if (j < k) pts.push([X(j), Y(v)]);
      else { const v0 = Math.hypot(o[j - 1 >= 0 ? j - 1 : 0][0], o[j - 1 >= 0 ? j - 1 : 0][1]); pts.push([X(j - 1 + u), Y(lerp(v0, v, u))]); }
      if (j === 0) { pts.length = 0; pts.push([X(0), Y(v)]); }
    }
    ctx.save(); ctx.beginPath(); ctx.rect(x0 - 10, y1 - 60, x1 - x0 + 20, y0 - y1 + 70); ctx.clip();
    ctx.globalCompositeOperation = "lighter"; ctx.lineJoin = "round";
    for (const [lw, o2] of [[8, 0.12], [2.6, 0.95]] as const) {
      ctx.strokeStyle = `rgba(${col},${o2 * a})`; ctx.lineWidth = lw;
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    }
    ctx.restore();
    pts.forEach(([x, y]) => { if (y > y1 - 60) luz(ctx, x, y, 9 * KT + 3, 0.7 * a, col); });
    // the one that escapes: off the top, with ∞
    const ultimo = pts[pts.length - 1];
    if (col === ROJO && ultimo && ultimo[1] < y1) texto(ctx, "∞", lerp(x0, x1, 0.82), y1 - 70, 44 * KT + 6, `rgba(${ROJO},${0.95 * a})`, { fam: SANS, peso: 600, alin: "center" });
  }
};
// «haz lo mismo con cada punto»: a sample of points over the plane, each painted by its fate, one after another
const MUESTRA = (() => {
  const out: { z: Z; fuga: number; orden: number }[] = [];
  let sem = 99;
  const azar = () => { sem = (Math.imul(sem, 1103515245) + 12345) | 0; return ((sem >>> 16) & 0x7fff) / 32768; };
  for (let i = 0; i < 26; i++) for (let j = 0; j < 17; j++) {
    const z: Z = [-1.55 + (3.1 * (i + 0.5)) / 26, -1.1 + (2.2 * (j + 0.5)) / 17];
    let p = z, n = 0;
    for (; n < 200 && Math.hypot(p[0], p[1]) <= 2; n++) p = [p[0] * p[0] - p[1] * p[1] + CR, 2 * p[0] * p[1] + CI];
    out.push({ z, fuga: n >= 200 ? -1 : n, orden: azar() });
  }
  return out;
})();
const muestra = (ctx: Ctx, t: number) => {
  const [m0, m1] = K.muestra;
  if (t < m0) return;
  const a = 1 - eSuave(pr(t, K.barrido[0] + 1.0, 1.4));
  if (a <= 0.01) return;
  const u = pr(t, m0 + 1.0, m1 - m0 - 0.5);
  for (const q of MUESTRA) {
    // one after another, faster and faster
    const tq = Math.pow(q.orden, 0.7);
    if (u < tq) continue;
    const ap = a * eSuave(cl((u - tq) * 12));
    const p = aPantalla(q.z), r = 9 * KT + 3;
    const col = q.fuga < 0 ? AZUL : AMBAR, al = q.fuga < 0 ? 0.9 : lerp(0.35, 0.95, cl(q.fuga / 12));
    ctx.save(); ctx.fillStyle = `rgba(${col},${al * ap})`; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
};
const destinos = (ctx: Ctx, t: number) => {
  grafico(ctx, t);
  muestra(ctx, t);
  unPunto(ctx, t, DENTRO, K.saltosIn, AZUL, K.pintaIn, "SE QUEDA");
  unPunto(ctx, t, AFUERA, K.saltosOut, ROJO, K.pintaOut, "ESCAPA");
};

// a faint grid of the plane, every half unit, so the empty plane reads as a space
const rejilla = (ctx: Ctx, a: number) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.07 * a})`; ctx.lineWidth = 1;
  for (let k = -8; k <= 8; k++) {
    const v = k / 2, x = aPantalla([v, 0])[0], y = aPantalla([0, v])[1];
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();
};

// ─── drawing helpers ────────────────────────────────────────────────────────────────────────────────────────────
const luz = (ctx: Ctx, x: number, y: number, r: number, a: number, col = AZUL) => {
  if (a <= 0 || r < 0.5) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.22, `rgba(${col},${0.6 * a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
};
// an arrow drawn as a drawing, not a glyph: a glowing shaft that stops at a sharp head
const flecha = (ctx: Ctx, a0: [number, number], a1: [number, number], col: string, a: number, w = 2.4, hasta = 1) => {
  if (a <= 0.01) return;
  const dx = a1[0] - a0[0], dy = a1[1] - a0[1], L = Math.hypot(dx, dy) * hasta;
  if (L < 4) return;
  const ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy);
  const cab = Math.min(26 * KT + 6, L * 0.4), anch = cab * 0.42;
  const fx = a0[0] + ux * L, fy = a0[1] + uy * L, bx = fx - ux * cab, by = fy - uy * cab;
  ctx.save(); ctx.lineCap = "round";
  ctx.globalCompositeOperation = "lighter";
  for (const [lw, o] of [[w * 6, 0.07], [w * 2.5, 0.18]] as const) {
    ctx.strokeStyle = `rgba(${col},${o * a})`; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(bx, by); ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(${col},${0.95 * a})`; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(bx + ux * 2, by + uy * 2); ctx.stroke();
  ctx.fillStyle = `rgba(${col},${0.95 * a})`;
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(bx - uy * anch, by + ux * anch);
  ctx.quadraticCurveTo(bx + ux * cab * 0.25, by + uy * cab * 0.25, bx + uy * anch, by - ux * anch);
  ctx.closePath(); ctx.fill();
  ctx.restore();
};
// a formula written piece by piece, with a real superscript (the type has no ² of its own): [text, superscript?]
type Seg = [string, boolean];
const anchoSeg = (ctx: Ctx, g: Seg, tam: number) => { fuente(ctx, g[1] ? tam * 0.6 : tam, SANS, 600, 0); return ctx.measureText(g[0]).width + (g[1] ? tam * 0.04 : 0); };
const formula = (ctx: Ctx, segs: Seg[], x: number, y: number, tam: number, color: (i: number) => string, alin: "left" | "center" = "left", glow = 0) => {
  const ws = segs.map((g) => anchoSeg(ctx, g, tam));
  let xx = alin === "center" ? x - ws.reduce((a, b) => a + b, 0) / 2 : x;
  segs.forEach((g, i) => {
    const tt = g[1] ? tam * 0.6 : tam, yy = g[1] ? y - tam * 0.42 : y;
    if (glow > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(8px)"; ctx.globalAlpha = glow;
      texto(ctx, g[0], xx, yy, tt, color(i), { fam: SANS, peso: 600, esp: 0 });
      ctx.restore();
    }
    texto(ctx, g[0], xx, yy, tt, color(i), { fam: SANS, peso: 600, esp: 0 });
    xx += ws[i];
  });
};
const ETQ: Record<string, Seg[]> = { z: [["z", false]], z2: [["z", false], ["2", true]], z2c: [["z", false], ["2", true], [" + c", false]], c: [["c", false]] };
// a label that rides next to a point, pushed out from the centre along the point's own direction, so it never sits
// on the arrow
const rotuloPunto = (ctx: Ctx, k: string, p: [number, number], a: number, col = RGB.crema, lejos = 62) => {
  if (a <= 0.01) return;
  const o = aPantalla([0, 0]), dx = p[0] - o[0], dy = p[1] - o[1], d = Math.max(1, Math.hypot(dx, dy));
  const tam = 40 * KT + 6;
  // kept inside the frame (away from the readouts at the top)
  const lx = cl(p[0] + (dx / d) * lejos, 140, W - 140), ly = cl(p[1] + (dy / d) * lejos + tam * 0.35, 190 + SEG_A, H - 200 - SEG_B);
  formula(ctx, ETQ[k], lx, ly, tam, () => `rgba(${col},${0.95 * a})`, "center", 0.5);
};
// the plane's axes: the horizontal one is the title's ruler (see regla); here, the vertical one grows out of zero,
// with its ticks at ±i, and the unit circle when the square is explained
const ejes = (ctx: Ctx, a: number, crece: number, circulo: number) => {
  if (a <= 0.01) return;
  const o = aPantalla([0, 0]), L = crece * H;
  ctx.save();
  ctx.strokeStyle = `rgba(${RGB.crema},${0.32 * a})`; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(o[0], o[1] - L); ctx.lineTo(o[0], o[1] + L); ctx.stroke();
  for (const [z, s] of [[[0, 1], "i"], [[0, -1], "−i"]] as const) {
    const p = aPantalla(z as unknown as Z);
    if (Math.abs(p[1] - o[1]) > L) continue;
    ctx.beginPath(); ctx.moveTo(p[0] - 10, p[1]); ctx.lineTo(p[0] + 10, p[1]); ctx.stroke();
    texto(ctx, s, p[0] + 18, p[1] + 7, 22 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { fam: SANS, peso: 500, esp: 0 });
  }
  if (circulo > 0.01) {
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = `rgba(${RGB.crema},${0.35 * circulo})`;
    ctx.beginPath(); ctx.arc(o[0], o[1], CAM.s, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
};

// ─── the chapter's title: a ruler ───────────────────────────────────────────────────────────────────────────────
// «regla» is both the rule and the ruler. On the second heartbeat the point of light stretches into a graduated
// line that marks itself out from zero; on the hit, LA REGLA appears over it in a thin, wide type (nothing like the
// film's title), CAPÍTULO I above, what the chapter is about below. When the title goes, the ruler stays: it is the
// real axis of the plane where the chapter happens.
const regla = (ctx: Ctx, t: number) => {
  const t0 = K.latidos[1];
  if (t < t0) return;
  const o = aPantalla([0, 0]);
  const L = eOut(pr(t, t0, 1.0)) * W * (V ? 0.46 : 0.55);
  const queda = 1 - eSuave(pr(t, K.entra[0], 1.2));           // the ruler's own look gives way to the plain axis
  const golpe = t >= K.titulo ? Math.exp(-(t - K.titulo) * 2.5) : 0;
  const finAll = 1 - eSuave(pr(t, K.revela - 0.4, 1.6));
  ctx.save();
  // the line, with a glow on the hit
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(${RGB.crema},${(0.12 + 0.3 * golpe) * queda * finAll})`; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(o[0] - L, o[1]); ctx.lineTo(o[0] + L, o[1]); ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(${RGB.crema},${lerp(0.32, 0.85, queda) * finAll})`; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(o[0] - L, o[1]); ctx.lineTo(o[0] + L, o[1]); ctx.stroke();
  // the graduation: tenths, halves and units, each tick appearing as the line reaches it; tenths and halves go with
  // the title, the units stay as the axis' ticks
  for (let k = -30; k <= 30; k++) {
    const x = k / 10, px = o[0] + x * CAM.s, d = Math.abs(px - o[0]);
    if (d > L || px < -10 || px > W + 10) continue;
    const ap = eSuave(cl((L - d) / 60));
    const unidad = k % 10 === 0, media = k % 5 === 0;
    const h = unidad ? 26 : media ? 15 : 8;
    const al = (unidad ? lerp(0.32, 0.9, queda) : (media ? 0.7 : 0.45) * queda) * ap * finAll;
    if (al < 0.01) continue;
    ctx.strokeStyle = `rgba(${RGB.crema},${al})`; ctx.lineWidth = unidad ? 1.6 : 1;
    ctx.beginPath(); ctx.moveTo(px, o[1] - h / 2); ctx.lineTo(px, o[1] + h / 2); ctx.stroke();
    if (unidad) texto(ctx, `${x < 0 ? "−" : ""}${Math.abs(x)}`, px, o[1] + 44, 20 * KT + 4, `rgba(${RGB.crema},${lerp(0.55, 0.75, queda) * ap * finAll})`, { fam: MONO, peso: 400, alin: "center", esp: 0 });
  }
  ctx.restore();
  // the words
  const u = t - K.titulo;
  if (u < -0.05 || t > K.entra[1]) return;
  const va = 1 - eSuave(pr(t, K.entra[0], 0.9));
  const a = eSuave(pr(u, 0, 0.5)) * va;
  const tam = V ? 128 : 150 * KT, esp = V ? lerp(34, 20, eOut(pr(u, 0, 3.5))) : lerp(64, 44, eOut(pr(u, 0, 3.5)));
  const yT = o[1] - 92 * KT;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(14px)";
  texto(ctx, "LA REGLA", W / 2 + esp / 2, yT, tam, `rgba(${RGB.crema},${0.35 * a})`, { fam: SANS, peso: 300, alin: "center", esp });
  ctx.restore();
  texto(ctx, "LA REGLA", W / 2 + esp / 2, yT, tam, `rgba(${RGB.crema},${0.96 * a})`, { fam: SANS, peso: 300, alin: "center", esp });
  const ac = eSuave(pr(u, 0.35, 0.8)) * va;
  texto(ctx, "CAPÍTULO I", W / 2 + 8, yT - tam * 1.02, 24 * KT + 6, `rgba(${AMBAR},${0.9 * ac})`, { fam: MONO, peso: 500, alin: "center", esp: 16 });
  const al = eSuave(pr(u, 1.9, 1.0)) * va;
  const sub = V ? ["CÓMO UNA REGLA QUE CABE", "EN UNA LÍNEA DIBUJA", "UNA FORMA SIN FIN"] : ["CÓMO UNA REGLA QUE CABE EN UNA LÍNEA DIBUJA UNA FORMA SIN FIN"];
  sub.forEach((l, k) => texto(ctx, l, W / 2 + 4, o[1] + 120 * KT + k * 40, 18 * KT + 4, `rgba(${RGB.crema},${0.7 * al})`, { fam: MONO, peso: 400, alin: "center", esp: V ? 5 : 7 }));
};

// ─── the explained turn of the rule, then the loop ──────────────────────────────────────────────────────────────
const Z0: Z = [K.z0[0], K.z0[1]];
// the orbit of z0, and the path its point travels (true motion), sampled for the trail
const explicado = (ctx: Ctx, t: number) => {
  const P = K.paso;
  if (t < P.z - 0.4 || t > K.nube[0] + 1.5) return;
  const o = aPantalla([0, 0]);
  const fuera = 1 - eSuave(pr(t, K.nube[0] - 0.2, 1.2));
  // 1 · the number: a point, and its arrow from the centre
  const aZ = eSuave(pr(t, P.z - 0.3, 0.5)) * fuera;
  // 2 · its square: turn and stretch, with the angle shown
  const uq = eIO(pr(t, P.cuadrado[0], P.cuadrado[1] - P.cuadrado[0]));
  // 3 · plus c: the arrow c from the centre, then the same arrow carried to the point, which slides along it
  const ac = eSuave(pr(t, P.c - 0.2, 0.5));
  const uc = eIO(pr(t, P.c + 0.9, 1.1));
  const enBucle = t >= K.golpes[0];
  let actual: Z;
  if (!enBucle) {
    const q = cuadradoParcial(Z0, uq);
    actual = [q[0] + CR * uc, q[1] + CI * uc];
    const pz = aPantalla(Z0), pq = aPantalla(cuadradoParcial(Z0, 1)), pa = aPantalla(actual);
    // the arrow of z (it stays as a ghost once it turns)
    flecha(ctx, o, pz, RGB.crema, aZ * (uq > 0 ? 0.35 : 1), 2.2, eOut(pr(t, P.z - 0.3, 0.6)));
    if (uq > 0) {
      // the angles: θ in cream, the growing one in amber; the turning arrow
      const th = Math.atan2(Z0[1], Z0[0]), r1 = 0.12 * CAM.s;
      ctx.save(); ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(${RGB.crema},${0.6 * fuera * (1 - uc)})`;
      ctx.beginPath(); ctx.arc(o[0], o[1], r1, 0, -th, true); ctx.stroke();
      ctx.strokeStyle = `rgba(${AMBAR},${0.9 * fuera * (1 - uc)})`;
      ctx.beginPath(); ctx.arc(o[0], o[1], r1 + 14, 0, -th * (1 + uq), true); ctx.stroke();
      ctx.restore();
      if (uq > 0.95) {
        const m = th * 0.5, lp = [o[0] + Math.cos(m) * (r1 + 70), o[1] - Math.sin(m) * (r1 + 70) + 10];
        texto(ctx, "ÁNGULO × 2", lp[0] + 40, lp[1], 20 * KT + 4, `rgba(${AMBAR},${0.9 * eSuave(pr(t, P.cuadrado[1] - 0.1, 0.4)) * (1 - uc)})`, { fam: SANS, peso: 600, alin: "center", esp: 1 });
      }
      flecha(ctx, o, aPantalla(cuadradoParcial(Z0, uq)), AMBAR, fuera * (1 - 0.65 * uc), 2.4);
    }
    // c: from the centre, then carried to the tip of z²
    if (ac > 0) {
      const pcO = aPantalla([CR, CI]);
      flecha(ctx, o, pcO, AZUL, ac * fuera * (1 - eSuave(pr(t, P.c + 2.2, 0.8))), 2.4, eOut(pr(t, P.c - 0.2, 0.7)));
      if (uc > 0) flecha(ctx, pq, [pq[0] + (pcO[0] - o[0]) * uc, pq[1] + (pcO[1] - o[1]) * uc], AZUL, fuera, 2.4);
      rotuloPunto(ctx, "c", pcO, ac * fuera * (1 - eSuave(pr(t, P.c + 2.2, 0.8))), AZUL, 40);
    }
    luz(ctx, pa[0], pa[1], 30 * KT + 8, aZ, uq > 0 ? AMBAR : AZUL);
    const etq = uc > 0.5 ? "z2c" : uq > 0.5 ? "z2" : "z";
    rotuloPunto(ctx, etq, pa, aZ, uc > 0.5 ? RGB.crema : uq > 0.5 ? AMBAR : RGB.crema, uc > 0.5 ? 92 : 58);
  } else {
    // the loop: the point keeps jumping (drawn by dibujoDeLuz); here only its position, for the readout
    const v = vueloDe(t), i = Math.max(1, v.k), z0: Z = [TRAZO[2 * i - 2], TRAZO[2 * i - 1]], z1: Z = [TRAZO[2 * i], TRAZO[2 * i + 1]];
    actual = [lerp(z0[0], z1[0], eIO(v.u)), lerp(z0[1], z1[1], eIO(v.u))];
  }
  // the readouts, small, like the opening's instruments
  const ah = eSuave(pr(t, P.z, 0.6)) * fuera;
  if (ah > 0.01) {
    ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.6 * ah})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(64, 58 + SEG_A); ctx.lineTo(64, 136 + SEG_A + (V ? 20 : 0)); ctx.stroke(); ctx.restore();
    texto(ctx, `z = ${num(actual[0], 3)} ${actual[1] < 0 ? "−" : "+"} ${num(Math.abs(actual[1]), 3)}i`, 84, 86 + SEG_A, 24 * KT + 4, `rgba(${RGB.crema},${0.9 * ah})`, { esp: 1 });
    texto(ctx, `c = ${num(CR, 3)} + ${num(CI, 3)}i`, 84, 126 + SEG_A + (V ? 14 : 0), 24 * KT + 4, `rgba(${AZUL},${0.9 * ah * ac})`, { esp: 1 });
    const vueltas = t >= K.golpes[0] ? cuantosDe(t) : t >= P.c + 2.0 ? 1 : 0;
    texto(ctx, "SALTOS", W - 84, 86 + SEG_A, 16 * KT + 4, `rgba(${RGB.crema},${0.6 * ah})`, { alin: "right", esp: 6 });
    texto(ctx, vueltas.toLocaleString("es-CL"), W - 84, 140 + SEG_A, 44 * KT + 6, `rgba(${AMBAR},${0.9 * ah})`, { fam: SANS, peso: 600, alin: "right", esp: 2 });
  }
};

// ─── the frame ──────────────────────────────────────────────────────────────────────────────────────────────────
export const dibujarCap1p = (ctx: Ctx, t: number, frame: number, foto: HTMLImageElement | null = null) => {
  CAM = camara(t);
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  let golpe = 0;
  // the two heartbeats: a point of light breathes in the dark
  if (t < K.titulo + 0.3) {
    for (const b of K.latidos) {
      const e = t - b;
      if (e < 0 || e > 1.5) continue;
      luz(ctx, W / 2, H / 2, (40 + 220 * eOut(cl(e / 0.5))) * KT, Math.exp(-e * 3.2) * 0.8);
      golpe = Math.max(golpe, Math.exp(-e * 7) * 0.5);
    }
    luz(ctx, W / 2, H / 2, 16 * KT, eSuave(pr(t, 0.5, 0.3)) * (1 - pr(t, K.latidos[1] + 0.2, 0.5)));
  }
  // the plane: dark and out of focus while the rule is explained; sharp and whole when the orbits have drawn it
  const entra = eSuave(pr(t, K.entra[0] + 0.6, 1.4));
  const revela = eSuave(pr(t, K.revela - 0.6, 2.4));
  rejilla(ctx, entra * (1 - eSuave(pr(t, K.nube[0], 2.0))));
  // at the reveal the colour fills in under the drawing: outside, how fast each point escapes; inside, the ones that stay
  const pv = planoVisible(t);
  if (t < K.vuelta) {
    if (t >= K.revela - 0.3 && pv > 0.01) fondo(ctx, t, eSuave(pr(t, K.revela - 0.3, 1.8)) * pv, 0, 700);
  } else if (t >= K.barrido[0]) {
    // every point painted by its fate, row by row, under a line of light
    const y = H * eIO(pr(t, K.barrido[0], K.barrido[1] - K.barrido[0]));
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, y); ctx.clip(); fondo(ctx, t, 1, 0, 700); ctx.restore();
    if (y < H - 1) {
      const g = ctx.createLinearGradient(0, y - 40, 0, y + 6);
      g.addColorStop(0, `rgba(${AMBAR},0)`); g.addColorStop(0.85, `rgba(${AMBAR},0.55)`); g.addColorStop(1, `rgba(255,250,235,0.95)`);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(0, y - 40, W, 46); ctx.restore();
    }
  }
  // the golden drawing: it gives way to the colour, leaves for the dive, and comes back as «the border between the two»
  const aDib = t < K.vuelta ? (1 - 0.55 * eSuave(pr(t, K.revela + 0.6, 2.5))) * (1 - eSuave(pr(t, K.zoomA[0] - 0.4, 0.9)))
    : 0.3 * eSuave(pr(t, K.vuelta, 1.0)) + 0.65 * eSuave(pr(t, K.frontera, 1.4));
  dibujoDeLuz(ctx, t, cuantosDe(t), aDib * pv * (1 - eSuave(pr(t, K.total - 1.4, 1.2))));
  dibujarExplicacion(ctx, t, foto);
  destinos(ctx, t);
  // the magnification, while diving
  const aum = CAM.s / S0, am = eSuave(pr(t, K.zoomA[0] + 0.3, 0.6)) * (1 - eSuave(pr(t, K.zoomA[1] - 0.2, 0.5)));
  if (am > 0.01) {
    texto(ctx, "AUMENTO", 84, H - 150 - SEG_B, 16 * KT + 4, `rgba(${RGB.crema},${0.6 * am})`, { esp: 6 });
    texto(ctx, `× ${Math.round(aum).toLocaleString("es-CL")}`, 84, H - 98 - SEG_B, 44 * KT + 6, `rgba(${AMBAR},${0.9 * am})`, { fam: SANS, peso: 600, esp: 2 });
  }
  ejes(ctx, entra * (1 - revela), eIO(pr(t, K.entra[0] + 0.3, 1.4)), eSuave(pr(t, K.paso.cuadrado[0] - 0.6, 0.6)) * (1 - eSuave(pr(t, K.paso.c + 0.5, 0.8))));
  regla(ctx, t);
  explicado(ctx, t);
  // the rule at the bottom, on a dark band so nothing crosses it; its parts light up with the voice and beat on every
  // turn; it leaves before the reveal so the set is seen whole
  const ar = eSuave(pr(t, K.voz[0] - 0.4, 0.6)) * (1 - eSuave(pr(t, K.revela - 1.4, 0.9)));
  if (ar > 0.01) {
    const yB = H - SEG_B;
    const banda = ctx.createLinearGradient(0, yB - 190, 0, yB);
    banda.addColorStop(0, "rgba(2,3,6,0)"); banda.addColorStop(0.55, `rgba(2,3,6,${0.78 * ar})`); banda.addColorStop(1, `rgba(2,3,6,${0.9 * ar})`);
    ctx.fillStyle = banda; ctx.fillRect(0, yB - 190, W, 190);
    const segs: Seg[] = [["z", false], ["  →  ", false], ["z", false], ["2", true], ["  +  c", false]];
    const cuando = [K.paso.z, -1, K.paso.cuadrado[0], K.paso.cuadrado[0], K.paso.c];
    const bucle = K.golpes.reduce((m, g) => Math.max(m, t >= g ? Math.exp(-(t - g) * 8) : 0), 0);
    formula(ctx, segs, W / 2, yB - 70, 44 * KT + 6, (i) => {
      const b = cuando[i] > 0 && t >= cuando[i] ? Math.exp(-(t - cuando[i]) * 1.2) : 0;
      return `rgba(${b > 0.05 ? AMBAR : RGB.crema},${(0.7 + 0.3 * Math.max(b, bucle * 0.6)) * ar})`;
    }, "center", 0.35 + 0.4 * bucle);
  }
  for (const g of [...K.golpes, ...K.nube]) if (t >= g && t - g < 0.6) golpe = Math.max(golpe, Math.exp(-(t - g) * 9) * 0.6);
  if (t >= K.titulo && t - K.titulo < 1.5) golpe = Math.max(golpe, 1.4 * Math.exp(-(t - K.titulo) * 3));
  if (t >= K.revela && t - K.revela < 1.5) golpe = Math.max(golpe, 0.9 * Math.exp(-(t - K.revela) * 3));
  // fade out at the end
  const fin = eSuave(pr(t, K.total - 1.2, 1.2));
  if (fin > 0) { ctx.fillStyle = `rgba(2,3,6,${fin})`; ctx.fillRect(0, 0, W, H); }
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.92, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: golpe * 0.5, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
