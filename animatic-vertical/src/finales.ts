// Two directions for the end of chapter 2 part 1 (short silent previews, 12 s each).
// A · «Basta con uno»: from the point, the plane; the rule applied from 0 carves the set step by step: the curves
//     |zₙ(c)| = 2 close in, one per step, and converge on the border of Mandelbrot (Leibniz: «omnibus ex nihilo
//     ducendis sufficit unum»).
// B · «La forma que se sostiene sola»: the rabbit as 200.000 points of light; every beat the rule moves every point
//     (angle doubled, distance squared, plus c) and they all land back on the same figure.
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS } from "./fractalTeaser";
import { pintarProfundo } from "./profundo";
import { RGB, SANS, MONO, cl, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
const AMBAR = "255,190,120";
const KT = Math.min(1, W / 1500);
const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  ctx.font = `${op.peso ?? 500} ${tam}px "${op.fam ?? MONO}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 3}px`;
  ctx.fillStyle = color; ctx.textAlign = op.alin ?? "left";
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};
const luz = (ctx: Ctx, x: number, y: number, r: number, a: number, col = AMBAR) => {
  if (a <= 0 || r < 0.5) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.22, `rgba(${col},${0.6 * a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
};
const post = (ctx: Ctx, t: number, frame: number, golpe = 0) => {
  const pp = postProceso(ctx.canvas, W, H, { px: 1, semilla: frame % 97, bloom: 0.36, expo: 0.92, aberr: 0.03, vineta: 0.62, grano: 0.05, scan: 0.18, curva: 0, esq: 0.03, impacto: golpe, ruido: 0.5, flicker: 0, lineaY: -1, lineaA: 0, grade: 1.8, tiempo: t, halo: 0.75 });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};

// ─── A ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const VA = { cx: -0.6, cy: 0, ancho: 4.4 };
export const dibujarFinA = (ctx: Ctx, t: number, frame: number) => {
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  // the step count: slow at first (each curve can be seen), then faster, converging
  const u = pr(t, 2.2, 8.0), n = u <= 0 ? 0 : 1 + 59 * Math.pow(u, 2.2);
  const a = eSuave(pr(t, 1.6, 0.8));
  if (n >= 1) {
    const l = pintarProfundo(W, H, { ...VA, fase: 0.02 * t, paleta: PALETAS[0], brillo: 0.9, maxIt: Math.max(1, Math.floor(n)), tiempo: 0.4 * t, interior: 2.2, borde: 1.6 });
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(l, 0, 0); ctx.restore();
  }
  // the zero: where everything starts
  const o: [number, number] = [W / 2 + (0 - VA.cx) * (W / VA.ancho), H / 2];
  luz(ctx, o[0], o[1], (18 + 50 * Math.exp(-t * 0.8)) * KT, 1 - 0.6 * eSuave(pr(t, 3, 2)));
  texto(ctx, "0", o[0] + 14, o[1] - 14, 22 * KT + 6, `rgba(${AMBAR},${0.9})`, { fam: SANS, peso: 600 });
  if (n >= 1) {
    texto(ctx, `PASO ${Math.floor(n)}`, W - 84, 96, 16 * KT + 4, `rgba(${RGB.crema},0.7)`, { alin: "right", esp: 6 });
    texto(ctx, "|zₙ| ≤ 2", W - 84, 142, 40 * KT + 6, `rgba(${AMBAR},0.9)`, { fam: SANS, peso: 600, alin: "right", esp: 2 });
  }
  const aq = eSuave(pr(t, 9.5, 1.0));
  texto(ctx, "«PARA SACAR TODO DE LA NADA, BASTA CON UNO»", W / 2, H - 150, 26 * KT + 6, `rgba(${RGB.crema},${0.92 * aq})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
  texto(ctx, "LEIBNIZ, 1697", W / 2, H - 110, 16 * KT + 4, `rgba(${AMBAR},${0.85 * aq})`, { alin: "center", esp: 6 });
  post(ctx, t, frame);
};

// ─── B ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const CB: [number, number] = [-0.123, 0.745];
const NB = 200000;
let PUNTOS: Float32Array | null = null;
// points of the rabbit's Julia set, by inverse iteration (z → ±√(z − c)), after a warm-up
const puntos = () => {
  if (PUNTOS) return PUNTOS;
  PUNTOS = new Float32Array(2 * NB);
  let sem = 11, x = 1, y = 0;
  const azar = () => { sem = (Math.imul(sem, 1664525) + 1013904223) | 0; return (sem >>> 0) / 4294967296; };
  for (let k = -200; k < NB; k++) {
    const ax = x - CB[0], ay = y - CB[1], r = Math.sqrt(Math.hypot(ax, ay)), th = Math.atan2(ay, ax) / 2;
    const sg = azar() < 0.5 ? 1 : -1;
    x = sg * r * Math.cos(th); y = sg * r * Math.sin(th);
    if (k >= 0) { PUNTOS[2 * k] = x; PUNTOS[2 * k + 1] = y; }
  }
  return PUNTOS;
};
const VB = { cx: 0, cy: 0, ancho: 4.2 };
let lienzoB: HTMLCanvasElement | null = null;
export const dibujarFinB = (ctx: Ctx, t: number, frame: number) => {
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  const P = puntos();
  if (!lienzoB) { lienzoB = document.createElement("canvas"); lienzoB.width = W; lienzoB.height = H; }
  const lc = lienzoB.getContext("2d")!;
  const img = lc.createImageData(W, H), px = img.data;
  // every 2.4 s the rule moves every point: s goes 0 → 1 along the way z → z²+c (turn, stretch, then add c)
  const ciclo = 2.4, k = Math.floor(Math.max(0, t - 2) / ciclo), s = t < 2 ? 0 : eIO(cl(((t - 2) % ciclo) / 1.6));
  const esc = W / VB.ancho, a = eSuave(pr(t, 0.2, 1.2));
  for (let i = 0; i < NB; i++) {
    let x = P[2 * i], y = P[2 * i + 1];
    // the point has already been moved k times (the set is invariant: moving it keeps it on the set)
    for (let j = 0; j < (k % 3); j++) { const nx = x * x - y * y + CB[0]; y = 2 * x * y + CB[1]; x = nx; }
    if (s > 0) {
      const r = Math.hypot(x, y), th = Math.atan2(y, x), u = Math.min(1, s * 1.4), v = eSuave(cl((s - 0.55) / 0.45));
      const rr = Math.pow(r, 1 + u), tt = th * (1 + u);
      x = rr * Math.cos(tt) + v * CB[0]; y = rr * Math.sin(tt) + v * CB[1];
    }
    const X = Math.round(W / 2 + (x - VB.cx) * esc), Y = Math.round(H / 2 - (y - VB.cy) * esc);
    if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
    const calor = s > 0 && s < 1 ? 1 : 0;
    for (const [dx, dy, f] of [[0, 0, 1], [1, 0, 0.5], [0, 1, 0.5], [-1, 0, 0.5], [0, -1, 0.5]] as const) {
      const XX = X + dx, YY = Y + dy;
      if (XX < 0 || YY < 0 || XX >= W || YY >= H) continue;
      const p = 4 * (YY * W + XX), g = f * a * 1.4;
      px[p] = Math.min(255, px[p] + (150 + 100 * calor) * g); px[p + 1] = Math.min(255, px[p + 1] + (185 + 15 * calor) * g); px[p + 2] = Math.min(255, px[p + 2] + (255 - 110 * calor) * g); px[p + 3] = 255;
    }
  }
  lc.putImageData(img, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.drawImage(lienzoB, 0, 0); ctx.filter = "blur(6px)"; ctx.globalAlpha = 0.6; ctx.drawImage(lienzoB, 0, 0); ctx.restore();
  const al = eSuave(pr(t, 3.0, 1.0));
  texto(ctx, "CADA PUNTO SE MUEVE", W / 2, H - 150, 26 * KT + 6, `rgba(${RGB.crema},${0.92 * al})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
  texto(ctx, "Y LA FORMA SE QUEDA: SE SOSTIENE SOLA", W / 2, H - 110, 16 * KT + 4, `rgba(${AMBAR},${0.85 * al})`, { alin: "center", esp: 6 });
  post(ctx, t, frame);
};
export { lerp, eOut };
