// CAPÍTULO VIII · «¿Hasta dónde llega la estructura?» (fractales/GUION-capitulo-8-estructura.md). The likeness of the
// opening (neurons and the cosmic web) measured (Vazza & Feletti 2020: a power spectrum alike over two decades, some
// network metrics alike and others not, broken power laws, a first exploratory work); the observed web (2dF, SDSS);
// the idea of a fractal universe with no end (Pietronero 1987); counting galaxies in spheres; the WiggleZ curve D₂(r)
// rising to 3 (Scrimgeour et al. 2012, figure 6, redrawn from its numbers); four claims kept apart; the close: out to
// an even texture. No researcher is named: none has a free portrait (fractales/FUENTES-capitulo-8.md).
import K from "./cap8.json";
import { LIMPIO as SIN_TEXTO_TRAILER } from "./limpio";
import RED from "./cap8_red.json";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { RGB, SANS, MONO, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
type Fotos = Record<string, HTMLImageElement>;
type P = [number, number];
const AMBAR = "255,190,120", AZUL = "150,190,255", ROJO = "255,120,100", VERDE = "170,230,170";
const KT = Math.min(1, W / 1500);
const LIMPIO = (FORMATO as { limpio?: boolean }).limpio === true;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: LIMPIO ? 0 : 0.05, scan: LIMPIO ? 0 : 0.18, ruido: LIMPIO ? 0 : 0.5, grade: 1.8 };
const V = K.voz as number[];

// ─── helpers (as in chapters III–VII) ───────────────────────────────────────────────────────────────────────────
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
const trazo = (ctx: Ctx, pts: P[], col: string, a: number, w = 2, guion: number[] = []) => {
  if (a <= 0.01 || pts.length < 2) return;
  ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.setLineDash(guion);
  const camino = () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
  ctx.globalCompositeOperation = "lighter";
  for (const [lw, o] of [[w * 7, 0.07], [w * 2.6, 0.2]] as const) { ctx.strokeStyle = `rgba(${col},${o * a})`; ctx.lineWidth = lw; camino(); ctx.stroke(); }
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(${col},${0.95 * a})`; ctx.lineWidth = w; camino(); ctx.stroke();
  ctx.restore();
};
const nota = (ctx: Ctx, s: string, a: number, x = W / 2, y = H - 40) => {
  if (a > 0.01) texto(ctx, s, x, y, 13 * KT + 4, `rgba(${RGB.crema},${0.55 * a})`, { alin: "center", esp: 4 });
};
const etiqueta = (ctx: Ctx, s: string, a: number) => {
  if (a <= 0.01) return;
  ctx.font = `600 ${15 * KT + 4}px "${MONO}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "5px";
  const w = ctx.measureText(s).width + 36;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.8 * a})`; ctx.lineWidth = 1.4; ctx.strokeRect(W - 84 - w, 60, w, 44); ctx.restore();
  texto(ctx, s, W - 84 - w / 2, 89, 15 * KT + 4, `rgba(${AMBAR},${0.95 * a})`, { alin: "center", esp: 5, peso: 600 });
};
const titular = (ctx: Ctx, s: string, y: number, tam: number, a: number, col = RGB.crema) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)";
  texto(ctx, s, W / 2, y, tam, `rgba(${col},${0.35 * a})`, { fam: SANS, peso: 300, alin: "center", esp: 4 }); ctx.restore();
  texto(ctx, s, W / 2, y, tam, `rgba(${col},${0.96 * a})`, { fam: SANS, peso: 300, alin: "center", esp: 4 });
};
const escala = (ctx: Ctx, pot: string, nombre: string, a: number) => {
  if (a <= 0.01) return;
  texto(ctx, pot, 84, H - 120, 30 * KT + 8, `rgba(${RGB.crema},${0.95 * a})`, { fam: SANS, peso: 300, esp: 2 });
  texto(ctx, nombre, 84, H - 84, 16 * KT + 4, `rgba(${AMBAR},${0.9 * a})`, { esp: 5 });
};
const azar = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// an image drawn to cover a box, scaled by z about its centre
const cubre = (ctx: Ctx, im: HTMLImageElement | undefined, x: number, y: number, w: number, h: number, z: number, a: number, cx = 0.5, cy = 0.5) => {
  if (!im || a <= 0.01) return;
  const sc = Math.max(w / im.width, h / im.height) * z;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalAlpha = a;
  ctx.drawImage(im, x + w / 2 - im.width * sc * cx, y + h / 2 - im.height * sc * cy, im.width * sc, im.height * sc);
  ctx.restore();
};
const marco = (ctx: Ctx, x: number, y: number, w: number, h: number, a: number) => {
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.35 * a})`; ctx.lineWidth = 1.2; ctx.strokeRect(x, y, w, h); ctx.restore();
};

// ─── 0 · title: the web of the close of chapter VII; 1 · the opening journey, and the question ───────────────────
const titulo = (ctx: Ctx, t: number, f: Fotos) => {
  if (t > V[0] + 1) return;
  const a = eSuave(pr(t, 0.2, 1.0)) * (1 - eSuave(pr(t, V[0] - 0.5, 0.8)));
  if (f.vid_titulo) { ctx.save(); ctx.globalAlpha = a; ctx.drawImage(f.vid_titulo, 0, 0, W, H); ctx.restore(); }
  const ut = t - K.titulo;
  if (ut >= 0) {
    const at = eSuave(pr(ut, 0, 0.5)) * a;
    ctx.fillStyle = `rgba(2,3,6,${0.45 * at})`; ctx.fillRect(0, 0, W, H);
    const tam = 62 * KT, esp = lerp(30, 14, eOut(pr(ut, 0, 4)));
    const s = "¿HASTA DÓNDE LLEGA LA ESTRUCTURA?";
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(14px)";
    texto(ctx, s, W / 2 + esp / 2, H * 0.5, tam, `rgba(${RGB.crema},${0.35 * at})`, { fam: SANS, peso: 300, alin: "center", esp });
    ctx.restore();
    texto(ctx, s, W / 2 + esp / 2, H * 0.5, tam, `rgba(${RGB.crema},${0.96 * at})`, { fam: SANS, peso: 300, alin: "center", esp });
    texto(ctx, "CAPÍTULO VIII", W / 2 + 8, H * 0.5 - tam * 1.15, 24 * KT + 6, `rgba(${AMBAR},${0.9 * at * eSuave(pr(ut, 0.35, 0.8))})`, { alin: "center", esp: 16 });
  }
};

const viaje = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < V[0] - 0.6 || t > K.medir + 0.4) return;
  const a = eSuave(pr(t, V[0] - 0.6, 0.8)) * (1 - eSuave(pr(t, K.medir - 0.6, 0.6)));
  const sp = eIO(pr(t, K.parecen - 0.2, 1.2));               // 0: one image full frame · 1: side by side
  // «una red de neuronas se abrió y se convirtió en la red del cosmos»: the neurons open, and are the web
  const ab = eIO(pr(t, K.abre, 2.2));
  const zN = lerp(1.25, 3.2, ab), zR = lerp(3.0, 1.08, eOut(pr(t, K.abre + 0.6, 2.6)));
  if (sp < 0.999) {
    const af = a * (1 - sp);
    cubre(ctx, f.neuronas, 0, 0, W, H, zN + 0.05 * pr(t, V[0], 4), af * (1 - eSuave(pr(t, K.abre + 0.5, 1.2))));
    ctx.save(); ctx.globalCompositeOperation = "lighter"; cubre(ctx, f.red, 0, 0, W, H, zR, af * eSuave(pr(t, K.abre + 0.4, 1.2))); ctx.restore();
    escala(ctx, "10⁻⁴ m", "NEURONAS", af * ventana(t, K.neuronas - 0.3, K.abre + 1.0, 0.4));
    escala(ctx, "10²⁵ m", "LA RED CÓSMICA", af * eSuave(pr(t, K.abre + 1.0, 0.5)));
  }
  // «Se parecían tanto…»: side by side, with what each is
  if (sp > 0.001) {
    const pw = lerp(W, W * 0.4, sp), ph = lerp(H, H * 0.56, sp), y = lerp(0, H * 0.24, sp);
    const xL = lerp(0, W * 0.07, sp), xR = lerp(0, W * 0.53, sp);
    cubre(ctx, f.neuronas, xL, y, pw, ph, 1.6, a * sp);
    cubre(ctx, f.red, xR, y, pw, ph, 1.15, a);
    marco(ctx, xL, y, pw, ph, a * sp); marco(ctx, xR, y, pw, ph, a * sp);
    const as = a * eSuave(pr(t, K.parecen + 0.8, 0.5));
    texto(ctx, "NEURONAS · 10⁻⁴ M", xL + pw / 2, y + ph + 46, 18 * KT + 4, `rgba(${RGB.crema},${0.9 * as})`, { alin: "center", esp: 4 });
    texto(ctx, "RED CÓSMICA · 10²⁵ M", xR + pw / 2, y + ph + 46, 18 * KT + 4, `rgba(${RGB.crema},${0.9 * as})`, { alin: "center", esp: 4 });
    // ≈ while they look alike; «parecerse no es lo mismo que ser igual»: the sign doubts
    const duda = eSuave(pr(t, V[1] + 0.9, 0.6));
    texto(ctx, duda > 0.5 ? "≈ ?" : "≈", W / 2, y + ph / 2 + 22, 60 * KT, `rgba(${AMBAR},${0.95 * as})`, { fam: SANS, peso: 300, alin: "center", esp: 2 });
    titular(ctx, "¿LA ESTRUCTURA DEL COSMOS SIGUE LA MISMA LEY A TODAS LAS ESCALAS?", H * 0.13, 26 * KT + 6, a * eSuave(pr(t, K.pregunta - 0.2, 0.8)));
  }
  nota(ctx, "NEURONAS: MIKEROSCOPY, CC BY 4.0 · RED CÓSMICA: SIMULACIÓN ILLUSTRISTNG", a * 0.8);
};

// ─── 2 · measuring the likeness ─────────────────────────────────────────────────────────────────────────────────
const escalas = (ctx: Ctx, t: number) => {
  if (t < V[3] - 0.6 || t > K.espectro + 0.4) return;
  const a = eSuave(pr(t, V[3] - 0.4, 0.6)) * (1 - eSuave(pr(t, K.espectro - 0.6, 0.6)));
  etiqueta(ctx, "UN PRIMER ESTUDIO EXPLORATORIO", a);
  // two clouds and two numbers
  const nN = 86e9 * eOut(pr(t, V[3] + 0.3, 3.0)), nG = 2.6e12 * eOut(pr(t, K.galaxias + 0.3, 3.0));
  const sube = eIO(pr(t, K.ordenes - 0.3, 1.0));
  const yc = lerp(H * 0.42, H * 0.27, sube);
  for (const [i, x, n, col, ap] of [[0, W * 0.28, nN, ROJO, a], [1, W * 0.72, nG, AZUL, a * eSuave(pr(t, K.galaxias - 0.2, 0.5))]] as [number, number, number, string, number][]) {
    if (ap <= 0.01) continue;
    const m = Math.floor(600 * Math.min(1, n / (i ? 2.6e12 : 86e9)));
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < m; k++) {
      // clustered dots: a few centres, each with its swarm
      const c = Math.floor(azar(k * 3 + i) * 9), cx = x + (azar(c * 7 + i) - 0.5) * W * 0.22, cy = yc + (azar(c * 13 + i) - 0.5) * H * 0.18;
      const rr = Math.pow(azar(k + 11 * i), 2) * H * 0.06, th = azar(k * 5 + i) * 6.283;
      ctx.fillStyle = `rgba(${col},${0.55 * ap})`; ctx.fillRect(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr, 2.2, 2.2);
    }
    ctx.restore();
    const cifra = i ? `${(n / 1e12).toFixed(1).replace(".", ",")} BILLONES` : `${Math.round(n / 1e9).toLocaleString("es-CL")}.000 MILLONES`;
    texto(ctx, cifra, x, yc + H * 0.17, 30 * KT + 8, `rgba(${RGB.crema},${0.95 * ap})`, { fam: SANS, peso: 300, alin: "center", esp: 2 });
    texto(ctx, i ? "DE GALAXIAS EN EL UNIVERSO OBSERVABLE" : "DE NEURONAS EN UN CEREBRO HUMANO", x, yc + H * 0.17 + 36, 14 * KT + 4, `rgba(${AMBAR},${0.9 * ap})`, { alin: "center", esp: 4 });
  }
  // «un salto de veintisiete órdenes de magnitud»: the ruler of powers of ten, and the jump
  const ar = a * sube;
  if (ar > 0.01) {
    const x0 = W * 0.08, x1 = W * 0.92, y = H * 0.74, p0 = -6, p1 = 27;
    const X = (p: number) => lerp(x0, x1, (p - p0) / (p1 - p0));
    trazo(ctx, [[x0, y], [x1, y]], RGB.crema, ar * 0.6, 1.4);
    for (let p = p0; p <= p1; p++) {
      const big = p % 3 === 0;
      trazo(ctx, [[X(p), y - (big ? 12 : 6)], [X(p), y + (big ? 12 : 6)]], RGB.crema, ar * 0.5, 1);
      if (big) texto(ctx, `10${String(p).split("").map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c] ?? "⁻").join("")}`, X(p), y + 44, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * ar})`, { alin: "center", esp: 1 });
    }
    texto(ctx, "METROS", x1, y - 26, 12 * KT + 4, `rgba(${RGB.crema},${0.5 * ar})`, { alin: "right", esp: 4 });
    const pa = Math.log10(1.6e-3), pb = Math.log10(3.086e24);
    luz(ctx, X(pa), y, 26, ar, ROJO); luz(ctx, X(pb), y, 26, ar, AZUL);
    texto(ctx, "1,6 MM DE CEREBELO", X(pa), y - 40, 14 * KT + 4, `rgba(${ROJO},${0.95 * ar})`, { alin: "center", esp: 3 });
    texto(ctx, "100 MEGAPÁRSECS", X(pb), y - 40, 14 * KT + 4, `rgba(${AZUL},${0.95 * ar})`, { alin: "center", esp: 3 });
    // the jump, order by order
    const k = eIO(pr(t, K.ordenes + 0.4, 2.2)), pk = lerp(pa, pb, k);
    const arco: P[] = []; for (let s = 0; s <= 1.0001 * k; s += 0.01) { const pp = lerp(pa, pb, s); arco.push([X(pp), y - Math.sin(Math.PI * s) * H * 0.16]); }
    trazo(ctx, arco, AMBAR, ar, 2.2);
    texto(ctx, `${Math.round(pk - pa)} ÓRDENES DE MAGNITUD`, W / 2, y - H * 0.19, 22 * KT + 6, `rgba(${AMBAR},${0.95 * ar * eSuave(pr(t, K.ordenes + 0.4, 0.4))})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
  }
};

// the power spectrum, as a scheme after the article's figure 2: alike over two decades, apart outside, broken laws
const espectro = (ctx: Ctx, t: number) => {
  if (t < K.espectro - 0.6 || t > K.redes + 0.4) return;
  const a = eSuave(pr(t, K.espectro - 0.4, 0.6)) * (1 - eSuave(pr(t, K.redes - 0.6, 0.5)));
  etiqueta(ctx, "UN PRIMER ESTUDIO EXPLORATORIO", a);
  const gx0 = W * 0.14, gx1 = W * 0.86, gy0 = H * 0.22, gy1 = H * 0.78;
  const X = (u: number) => lerp(gx0, gx1, u), Y = (v: number) => lerp(gy1, gy0, v);
  trazo(ctx, [[gx0, gy0], [gx0, gy1], [gx1, gy1]], RGB.crema, a * 0.6, 1.4);
  texto(ctx, "ESCALAS MÁS GRANDES  ←", gx0, gy1 + 42, 14 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { esp: 4 });
  texto(ctx, "→  ESCALAS MÁS PEQUEÑAS", gx1, gy1 + 42, 14 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "right", esp: 4 });
  ctx.save(); ctx.translate(gx0 - 30, (gy0 + gy1) / 2); ctx.rotate(-Math.PI / 2);
  texto(ctx, "CUÁNTA ESTRUCTURA HAY A CADA ESCALA", 0, 0, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "center", esp: 4 }); ctx.restore();
  // the band where they are alike (two decades)
  const ub0 = 0.3, ub1 = 0.62, ab = a * eSuave(pr(t, K.banda - 0.2, 0.6));
  if (ab > 0.01) {
    ctx.fillStyle = `rgba(${AMBAR},${0.1 * ab})`; ctx.fillRect(X(ub0), gy0, X(ub1) - X(ub0), gy1 - gy0);
    texto(ctx, "AQUÍ SE PARECEN · DOS DÉCADAS DE ESCALA", (X(ub0) + X(ub1)) / 2, gy0 - 18, 14 * KT + 4, `rgba(${AMBAR},${0.95 * ab})`, { alin: "center", esp: 3 });
    texto(ctx, "CEREBELO 0,01 – 1,6 MM", (X(ub0) + X(ub1)) / 2, gy1 - 46, 13 * KT + 4, `rgba(${ROJO},${0.95 * ab})`, { alin: "center", esp: 3 });
    texto(ctx, "RED CÓSMICA 1 – 100 MPC", (X(ub0) + X(ub1)) / 2, gy1 - 20, 13 * KT + 4, `rgba(${AZUL},${0.95 * ab})`, { alin: "center", esp: 3 });
  }
  // the two curves: one shape inside the band, apart outside; each bends (a broken law)
  const cosm = (u: number) => 0.88 - 0.62 * u - (u > 0.62 ? 1.6 * (u - 0.62) ** 1.4 : 0) + (u < 0.3 ? 0.18 * (0.3 - u) : 0);
  const cere = (u: number) => 0.88 - 0.62 * u - (u > 0.62 ? 0.5 * (u - 0.62) : 0) - (u < 0.3 ? 0.55 * (0.3 - u) : 0) + 0.012 * Math.sin(u * 40);
  const crece = eOut(pr(t, K.espectro + 0.6, 3.0));
  for (const [fn, col, nom, yy] of [[cosm, AZUL, "RED CÓSMICA", 0], [cere, ROJO, "CEREBELO", 1]] as [(u: number) => number, string, string, number][]) {
    const pts: P[] = []; for (let u = 0; u <= crece + 1e-6; u += 0.005) pts.push([X(u), Y(fn(u))]);
    trazo(ctx, pts, col, a, 2.4);
    texto(ctx, nom, gx1 - 10, gy0 + 30 + yy * 30, 15 * KT + 4, `rgba(${col},${0.95 * a})`, { alin: "right", esp: 4 });
  }
  // «Fuera de ese tramo, las curvas se separan»
  const as = a * ventana(t, V[5], K.quiebran, 0.5);
  if (as > 0.01) for (const u of [0.12, 0.85]) { trazo(ctx, [[X(u), Y(cosm(u))], [X(u), Y(cere(u))]], AMBAR, as, 1.6, [4, 6]); texto(ctx, "SE SEPARAN", X(u), Math.min(Y(cosm(u)), Y(cere(u))) - 16, 13 * KT + 4, `rgba(${AMBAR},${0.95 * as})`, { alin: "center", esp: 3 }); }
  // «ninguna de las dos sigue una ley simple, como la de un fractal»: a single straight line, and the bends
  const aq = a * eSuave(pr(t, K.quiebran, 0.6));
  if (aq > 0.01) {
    trazo(ctx, [[X(0), Y(1.0)], [X(1), Y(1.0 - 0.95)]], RGB.crema, aq * 0.7, 1.4, [8, 8]);
    // the legend of the line goes under the two curve names (it used to sit on the band's title)
    trazo(ctx, [[gx1 - 10 - 64, gy0 + 84], [gx1 - 10, gy0 + 84]], RGB.crema, aq * 0.7, 1.4, [8, 8]);
    texto(ctx, "UN FRACTAL SIMPLE: UNA SOLA RECTA", gx1 - 10, gy0 + 114, 13 * KT + 4, `rgba(${RGB.crema},${0.8 * aq})`, { alin: "right", esp: 3 });
    for (const [u, fn, col] of [[0.3, cere, ROJO], [0.62, cosm, AZUL], [0.62, cere, ROJO], [0.3, cosm, AZUL]] as [number, (u: number) => number, string][]) luz(ctx, X(u), Y(fn(u)), 22, aq * eSuave(pr(t, K.quiebran + 4.6, 0.4)), col);
    texto(ctx, "LEYES QUE SE QUIEBRAN", W / 2, H * 0.9, 22 * KT + 6, `rgba(${AMBAR},${0.95 * a * eSuave(pr(t, K.quiebran + 4.6, 0.4))})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
  }
  const amp = a * ventana(t, K.megaparsec, V[5] + 1.0, 0.4);
  if (amp > 0.01) { ctx.fillStyle = `rgba(2,3,6,${0.85 * amp})`; ctx.fillRect(W / 2 - W * 0.24, H * 0.86, W * 0.48, 56); texto(ctx, "1 MEGAPÁRSEC ≈ 3,26 MILLONES DE AÑOS LUZ", W / 2, H * 0.86 + 36, 17 * KT + 4, `rgba(${RGB.crema},${0.95 * amp})`, { alin: "center", esp: 3 }); }
  nota(ctx, "ESQUEMA SEGÚN LA FIGURA 2 DE F. VAZZA Y A. FELETTI, FRONTIERS IN PHYSICS (2020)", a);
};

// the network metrics: one alike, one not
const metricas = (ctx: Ctx, t: number) => {
  if (t < K.metricas - 0.6 || t > V[7] + 0.4) return;
  const a = eSuave(pr(t, K.metricas - 0.4, 0.6)) * (1 - eSuave(pr(t, V[7] - 0.4, 0.5)));
  etiqueta(ctx, "UN PRIMER ESTUDIO EXPLORATORIO", a);
  const x0 = W * 0.3, x1 = W * 0.86;
  const fila = (y: number, titulo: string, verd: string, colV: string, barras: [string, string, number, number][], mn: number, mx: number, ap: number) => {
    if (ap <= 0.01) return;
    texto(ctx, titulo, W * 0.08, y, 22 * KT + 6, `rgba(${RGB.crema},${0.95 * ap})`, { fam: SANS, peso: 600, esp: 3 });
    texto(ctx, verd, W * 0.08, y + 40, 18 * KT + 4, `rgba(${colV},${0.95 * ap * eSuave(pr(t, 0, 1))})`, { fam: SANS, peso: 700, esp: 4 });
    trazo(ctx, [[x0, y + 70], [x1, y + 70]], RGB.crema, ap * 0.4, 1);
    for (const v of [mn, (mn + mx) / 2, mx]) texto(ctx, String(v).replace(".", ","), lerp(x0, x1, (v - mn) / (mx - mn)), y + 98, 12 * KT + 4, `rgba(${RGB.crema},${0.5 * ap})`, { alin: "center", esp: 2 });
    barras.forEach(([nom, col, v0, v1], i) => {
      const yy = y - 20 + i * 26, k = eOut(pr(ap, 0.2, 0.8));
      const bx0 = lerp(x0, x1, (v0 - mn) / (mx - mn)), bx1 = lerp(x0, x1, (lerp(v0, v1, k) - mn) / (mx - mn));
      ctx.fillStyle = `rgba(${col},${0.75 * ap})`; ctx.fillRect(bx0, yy - 10, Math.max(2, bx1 - bx0), 16);
      texto(ctx, nom, x1 + 16, yy + 4, 13 * KT + 4, `rgba(${col},${0.95 * ap})`, { esp: 3 });
    });
  };
  fila(H * 0.3, "AGRUPAMIENTO", "COINCIDE", VERDE, [["RED CÓSMICA", AZUL, 0.1, 0.4], ["CEREBELO", ROJO, 0.1, 0.4], ["CORTEZA", AMBAR, 0.1, 0.4]], 0, 0.5, a);
  fila(H * 0.62, "VECINOS POR NODO", "NO COINCIDE", ROJO, [["RED CÓSMICA", AZUL, 3.8, 4.1], ["CEREBELO", ROJO, 1.9, 3.7], ["CORTEZA", AMBAR, 4.6, 5.4]], 1, 6, a * eSuave(pr(t, K.otras - 0.2, 0.5)));
  nota(ctx, "AGRUPAMIENTO: PICOS ENTRE 0,1 Y 0,4 · VECINOS POR NODO: GRADO MEDIO · F. VAZZA Y A. FELETTI (2020)", a);
};

// «un primer trabajo exploratorio»: the two images laid over each other; the limits; and they come apart
const limites = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < V[7] - 0.6 || t > K.observa + 0.4) return;
  const a = eSuave(pr(t, V[7] - 0.4, 0.6)) * (1 - eSuave(pr(t, K.observa - 0.7, 0.6)));
  const sep = eIO(pr(t, K.deshace, 2.0));
  const w = W * 0.4, h = H * 0.48, y = H * 0.19;
  const xL = lerp(W / 2 - w / 2, W * 0.04, sep), xR = lerp(W / 2 - w / 2, W * 0.52, sep);
  cubre(ctx, f.neuronas, xL, y, w, h, 1.5, a * lerp(0.6, 1, sep));
  ctx.save(); ctx.globalCompositeOperation = "lighter"; cubre(ctx, f.red, xR, y, w, h, 1.15, a * lerp(0.75, 1, sep)); ctx.restore();
  marco(ctx, xL, y, w, h, a); if (sep > 0.05) marco(ctx, xR, y, w, h, a * sep);
  texto(ctx, "UN PRIMER TRABAJO EXPLORATORIO", W / 2, H * 0.12, 22 * KT + 6, `rgba(${RGB.crema},${0.95 * a * (1 - sep)})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
  const items: [number, string][] = [[K.limites, "CONEXIONES POR CERCANÍA, CON UNA DISTANCIA ELEGIDA A MANO"], [K.corte, "UN CORTE DE TEJIDO ES UNA PARTE MÍNIMA DEL CEREBRO"]];
  items.forEach(([tw, s], i) => {
    const ai = a * eSuave(pr(t, tw - 0.1, 0.5)) * (1 - sep);
    if (ai <= 0.01) return;
    ctx.fillStyle = `rgba(2,3,6,${0.8 * ai})`; ctx.fillRect(W / 2 - W * 0.33, H * 0.72 + i * 64, W * 0.66, 50);
    texto(ctx, s, W / 2, H * 0.72 + i * 64 + 33, 16 * KT + 4, `rgba(${AMBAR},${0.95 * ai})`, { alin: "center", esp: 3 });
  });
  titular(ctx, "UNA SEMEJANZA MEDIDA · NO UN MECANISMO COMÚN", H * 0.12, 28 * KT + 6, a * eSuave(pr(t, K.deshace + 1.4, 0.8)));
};

// ─── 3 · what is observed ───────────────────────────────────────────────────────────────────────────────────────
// «por cuánto se corre hacia el rojo»: three galaxies, their spectra, the same lines shifted more the farther they are
const corrimiento = (ctx: Ctx, t: number) => {
  if (t < K.telescopios - 0.6 || t > K.mapas + 0.4) return;
  const a = eSuave(pr(t, K.telescopios - 0.4, 0.5)) * (1 - eSuave(pr(t, K.mapas - 0.6, 0.5)));
  etiqueta(ctx, "OBSERVACIÓN", a);
  const sx0 = W * 0.3, sx1 = W * 0.9;
  const lineas = [0.18, 0.31, 0.55, 0.62];
  [0, 0.06, 0.14].forEach((z, i) => {
    const y = H * (0.28 + i * 0.2), ai = a * eSuave(pr(t, K.telescopios + 0.3 + i * 0.6, 0.5));
    if (ai <= 0.01) return;
    luz(ctx, W * 0.12, y + 22, 34 - i * 8, ai, AMBAR);
    texto(ctx, ["CERCA", "MÁS LEJOS", "MUCHO MÁS LEJOS"][i], W * 0.12, y + 76, 13 * KT + 4, `rgba(${RGB.crema},${0.7 * ai})`, { alin: "center", esp: 3 });
    const g = ctx.createLinearGradient(sx0, 0, sx1, 0);
    ["#5a3cff", "#3c8cff", "#3cffb4", "#d2ff3c", "#ffb43c", "#ff3c3c"].forEach((c, k) => g.addColorStop(k / 5, c));
    ctx.save(); ctx.globalAlpha = 0.75 * ai; ctx.fillStyle = g; ctx.fillRect(sx0, y, sx1 - sx0, 44); ctx.restore();
    const corre = z * eIO(pr(t, K.telescopios + 2.4, 2.0));
    for (const l of lineas) { const x = lerp(sx0, sx1, l + corre * (1 + l)); ctx.fillStyle = `rgba(0,0,0,${0.95 * ai})`; ctx.fillRect(x - 5, y - 4, 10, 52); }
    if (i > 0) texto(ctx, "→ ROJO", sx1 + 14, y + 28, 13 * KT + 4, `rgba(${ROJO},${0.9 * ai * eSuave(pr(t, K.telescopios + 3.2, 0.5))})`, { esp: 3 });
  });
  texto(ctx, "CUANTO MÁS LEJOS ESTÁ UNA GALAXIA, MÁS SE CORRE SU LUZ HACIA EL ROJO", W / 2, H * 0.9, 17 * KT + 4, `rgba(${AMBAR},${0.95 * a * eSuave(pr(t, K.telescopios + 4.2, 0.6))})`, { alin: "center", esp: 3 });
};

// «un fractal sin fin»: clusters inside clusters (a Soneira–Peebles hierarchy), seen from ever farther away
const SP: number[] = [];
let SPc: P = [0, 0];
{
  const eta = 4, lam = 2.6, prof = 9;
  let semilla = 1;
  const rnd = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
  const baja = (x: number, y: number, r: number, n: number, primero: boolean) => {
    if (n === 0) { SP.push(x, y); return; }
    for (let k = 0; k < eta; k++) {
      const rr = Math.sqrt(rnd()) * r * (1 - 1 / lam), th = rnd() * Math.PI * 2;
      const nx = x + Math.cos(th) * rr, ny = y + Math.sin(th) * rr;
      if (primero && k === 0 && n === 1) SPc = [nx, ny];
      baja(nx, ny, r / lam, n - 1, primero && k === 0);
    }
  };
  baja(0, 0, 1, prof, true);
}
const fractal = (ctx: Ctx, t: number) => {
  if (t < K.fractal - 0.6 || t > K.esferas + 0.4) return;
  const a = eSuave(pr(t, K.fractal - 0.4, 0.6)) * (1 - eSuave(pr(t, K.esferas - 0.7, 0.6)));
  const k = eIO(pr(t, K.fractal + 0.4, K.esferas - K.fractal - 3.0));
  const R = Math.exp(lerp(Math.log(0.012), Math.log(0.7), k));          // half the height of the view, in units of the whole
  const cx = SPc[0] * (1 - k), cy = SPc[1] * (1 - k), s = (H * 0.5) / R;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const tam = Math.max(1.8, Math.min(3.5, (0.012 / R) * 3.5));
  for (let i = 0; i < SP.length; i += 2) {
    const x = W / 2 + (SP[i] - cx) * s, y = H / 2 + (SP[i + 1] - cy) * s;
    if (x < 0 || x > W || y < 0 || y > H) continue;
    const c = azar(i) > 0.85 ? AMBAR : AZUL;
    ctx.fillStyle = `rgba(${c},${0.75 * a})`; ctx.fillRect(x, y, tam, tam);
  }
  ctx.restore();
  // the average density inside the view: in a fractal it keeps falling as the view grows
  const ad = a * eSuave(pr(t, V[11] - 0.2, 0.6));
  if (ad > 0.01) {
    let n = 0; const R2 = R * R;
    for (let i = 0; i < SP.length; i += 2) { const dx = SP[i] - cx, dy = SP[i + 1] - cy; if (dx * dx + dy * dy < R2) n++; }
    const dens = n / (Math.PI * R2), d0 = 4 ** 9 / Math.PI;
    const v = Math.max(0, Math.min(1, (Math.log10(dens / d0) + 0.2) / 3.2));
    const bx = W * 0.82, by0 = H * 0.24, by1 = H * 0.76;
    ctx.fillStyle = `rgba(2,3,6,${0.7 * ad})`; ctx.fillRect(bx - 70, by0 - 60, 220, by1 - by0 + 120);
    ctx.fillStyle = `rgba(${AMBAR},${0.8 * ad})`; ctx.fillRect(bx, lerp(by1, by0, v), 40, by1 - lerp(by1, by0, v));
    ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.4 * ad})`; ctx.strokeRect(bx, by0, 40, by1 - by0); ctx.restore();
    texto(ctx, "DENSIDAD", bx + 20, by0 - 30, 14 * KT + 4, `rgba(${RGB.crema},${0.9 * ad})`, { alin: "center", esp: 3 });
    texto(ctx, "PROMEDIO", bx + 20, by0 - 10, 14 * KT + 4, `rgba(${RGB.crema},${0.9 * ad})`, { alin: "center", esp: 3 });
    texto(ctx, "SIGUE BAJANDO", bx + 20, by1 + 36, 13 * KT + 4, `rgba(${AMBAR},${0.9 * ad})`, { alin: "center", esp: 3 });
  }
  texto(ctx, "CÚMULOS DENTRO DE CÚMULOS, SIN FIN", W / 2, H * 0.12, 22 * KT + 6, `rgba(${RGB.crema},${0.95 * a * eSuave(pr(t, K.fractal + 6.5, 0.6))})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
  nota(ctx, "LA IDEA DE UN UNIVERSO FRACTAL · PHYSICA A, 1987 · ILUSTRACIÓN CON UN MODELO DE CÚMULOS JERÁRQUICOS", a);
};

// ─── 4 · the test: spheres around a galaxy ─────────────────────────────────────────────────────────────────────
const PR = RED.red as number[][];
// even matter: a jittered grid (random, but with no clumps), so the counts follow the volume
const PU: number[][] = Array.from({ length: 14 ** 3 }, (_, i) => [((i % 14) + 0.2 + 0.6 * azar(i * 3 + 72001)) / 7 - 1, ((Math.floor(i / 14) % 14) + 0.2 + 0.6 * azar(i * 3 + 72002)) / 7 - 1, (Math.floor(i / 196) + 0.2 + 0.6 * azar(i * 3 + 72003)) / 7 - 1]);
const cuenta = (pts: number[][], r: number) => pts.reduce((n, [x, y, z]) => n + (x * x + y * y + z * z < r * r ? 1 : 0), 0);
const RADIOS = [0.2, 0.4, 0.8];
const CR = RADIOS.map((r) => cuenta(PR, r)), CU = RADIOS.map((r) => cuenta(PU, r));
const panel = (ctx: Ctx, pts: number[][], cxs: number, sc: number, ang: number, radio: number, a: number, col: string) => {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const c = Math.cos(ang), s = Math.sin(ang);
  for (const [x, y, z] of pts) {
    const X = x * c - z * s, Z = x * s + z * c, d = 3.2 + Z, f = (sc * 3.2) / d;
    const px = cxs + X * f, py = H * 0.5 + y * f;
    if (px < cxs - sc * 1.4 || px > cxs + sc * 1.4) continue;
    const dentro = x * x + y * y + z * z < radio * radio;
    ctx.fillStyle = dentro ? `rgba(255,220,160,${0.95 * a})` : `rgba(${col},${0.45 * a})`;
    const tm = dentro ? 3.2 : 2.2; ctx.fillRect(px - tm / 2, py - tm / 2, tm, tm);
  }
  ctx.restore();
  if (radio > 0) {
    const rp = radio * sc;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const [lw, o] of [[14, 0.06], [5, 0.18], [1.6, 0.9]] as const) { ctx.strokeStyle = `rgba(${AMBAR},${o * a})`; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(cxs, H * 0.5, rp, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = `rgba(${AMBAR},${0.35 * a})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cxs, H * 0.5, rp, rp * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    luz(ctx, cxs, H * 0.5, 14, a, RGB.crema);
  }
};
const esferas = (ctx: Ctx, t: number) => {
  if (t < K.esferas - 0.6 || t > K.censo + 0.4) return;
  const a = eSuave(pr(t, K.esferas - 0.4, 0.6)) * (1 - eSuave(pr(t, K.censo - 0.7, 0.6)));
  etiqueta(ctx, "OBSERVACIÓN · EL MÉTODO", a);
  const ang = 0.25 * t, dos = eIO(pr(t, K.pareja - 0.2, 1.0)), graf = eIO(pr(t, K.ritmo - 0.3, 1.0));
  // the step of the sphere: before the split, on «esfera», «agranda», «otra vez»; after it, again for both, from «duplicar»
  const paso = (t0s: number[]) => t0s.reduce((n, x) => n + (t >= x ? 1 : 0), 0) - 1;
  const p1 = paso([K.esfera1, K.agranda + 0.6, K.otravez + 0.5]), p2 = paso([K.pareja + 0.3, K.duplicar, K.duplicar + 1.4]);
  const p = dos > 0.5 ? p2 : p1;
  const sc = lerp(H * 0.44, H * 0.3, dos) * (1 - 0.35 * graf);
  const xRed = lerp(W / 2, W * 0.27, dos) - graf * W * 0.12, xPar = W * 0.73 - graf * W * 0.34;
  const r = p >= 0 ? RADIOS[p] : 0;
  panel(ctx, PR, xRed, sc, ang, r, a, AZUL);
  const rotu = (x: number, nom: string, cs: number[], ap: number) => {
    if (ap <= 0.01) return;
    texto(ctx, nom, x, H * 0.5 - sc * 1.25, 18 * KT + 4, `rgba(${RGB.crema},${0.9 * ap})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
    if (p >= 0) texto(ctx, `${cs[p]} GALAXIAS`, x, H * 0.5 + sc * 1.25, 22 * KT + 6, `rgba(${AMBAR},${0.95 * ap})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
    if (p >= 1) texto(ctx, `× ${(cs[p] / cs[p - 1]).toFixed(1).replace(".", ",")} AL DUPLICAR EL RADIO`, x, H * 0.5 + sc * 1.25 + 34, 14 * KT + 4, `rgba(${RGB.crema},${0.8 * ap})`, { alin: "center", esp: 3 });
  };
  rotu(xRed, dos > 0.01 ? "LA RED" : "", CR, a);
  if (dos > 0.01) { panel(ctx, PU, xPar, sc, ang, r, a * dos, AMBAR); rotu(xPar, "MATERIA PAREJA", CU, a * dos); }
  // «Ese ritmo de crecimiento es una dimensión»: log N against log r, the slope is D₂
  if (graf > 0.01) {
    const gx0 = W * 0.6, gx1 = W * 0.8, gy0 = H * 0.26, gy1 = H * 0.72;
    const X = (r: number) => lerp(gx0, gx1, (Math.log2(r) - Math.log2(0.2)) / 2), Y = (n: number) => lerp(gy1, gy0, Math.log2(n) / 10);
    trazo(ctx, [[gx0, gy0], [gx0, gy1], [gx1, gy1]], RGB.crema, a * graf * 0.6, 1.2);
    texto(ctx, "RADIO", (gx0 + gx1) / 2, gy1 + 30, 12 * KT + 4, `rgba(${RGB.crema},${0.6 * a * graf})`, { alin: "center", esp: 4 });
    texto(ctx, "GALAXIAS", gx0 - 12, gy0 - 12, 12 * KT + 4, `rgba(${RGB.crema},${0.6 * a * graf})`, { alin: "left", esp: 4 });
    trazo(ctx, RADIOS.map((r, i) => [X(r), Y(CU[i])] as P), AMBAR, a * graf, 2.2);
    trazo(ctx, RADIOS.map((r, i) => [X(r), Y(CR[i])] as P), AZUL, a * graf, 2.2);
    const at = a * eSuave(pr(t, K.tres - 0.2, 0.5));
    texto(ctx, "D₂ = 3 · PAREJA", gx1 + 10, Y(CU[2]) + 6, 15 * KT + 4, `rgba(${AMBAR},${0.95 * at})`, { esp: 3 });
    texto(ctx, "D₂ < 3 · AGRUPADA", gx1 + 10, Y(CR[2]) + 26, 15 * KT + 4, `rgba(${AZUL},${0.95 * at})`, { esp: 3 });
    texto(ctx, "LA PENDIENTE ES LA DIMENSIÓN", (gx0 + gx1) / 2, gy0 - 40, 17 * KT + 4, `rgba(${RGB.crema},${0.95 * a * graf})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
  }
  if (dos < 0.5) nota(ctx, "ILUSTRACIÓN: GALAXIAS DE UNA RED COMO LA DEL CAPÍTULO ANTERIOR · CONTEO REAL DENTRO DE CADA ESFERA", a);
};

// after the telescope photos: the survey, as a cone of points out to great distances
const censo = (ctx: Ctx, t: number) => {
  if (t < K.lejos - 0.6 || t > K.grafica + 0.4) return;
  const a = eSuave(pr(t, K.lejos - 0.4, 0.5)) * (1 - eSuave(pr(t, K.grafica - 0.5, 0.5)));
  etiqueta(ctx, "OBSERVACIÓN", a);
  const k = eOut(pr(t, K.lejos - 0.2, 3.4)), ox = W * 0.1, oy = H * 0.55;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 2600; i++) {
    const d = Math.pow(azar(i), 0.6), th = (azar(i + 7000) - 0.5) * 0.55 + 0.04 * Math.sin(azar(i + 99) * 40 + d * 30);
    if (d > k) continue;
    const x = ox + Math.cos(th) * d * W * 0.8, y = oy + Math.sin(th) * d * W * 0.8;
    ctx.fillStyle = `rgba(${azar(i + 5) > 0.8 ? AMBAR : AZUL},${0.7 * a})`; ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
  luz(ctx, ox, oy, 18, a, RGB.crema);
  texto(ctx, "179.599 GALAXIAS", W / 2, H * 0.14, 34 * KT + 8, `rgba(${RGB.crema},${0.95 * a})`, { fam: SANS, peso: 300, alin: "center", esp: 3 });
  texto(ctx, "HASTA MILES DE MILLONES DE AÑOS LUZ", W / 2, H * 0.14 + 40, 15 * KT + 4, `rgba(${AMBAR},${0.9 * a})`, { alin: "center", esp: 4 });
  nota(ctx, "CENSO WIGGLEZ · MNRAS 425 (2012) · ILUSTRACIÓN DEL VOLUMEN, NO SU MAPA", a);
};

// the curve D₂(r), redrawn from the numbers of the article's figure 6 (z ≈ 0,2), with its error band
const DR = (K as unknown as { d2: { r: number[]; d2: number[]; err: number[] } }).d2;
const grafica = (ctx: Ctx, t: number) => {
  if (t < K.grafica - 0.6 || t > K.cuatro + 0.4) return;
  const a = eSuave(pr(t, K.grafica - 0.4, 0.6)) * (1 - eSuave(pr(t, K.cuatro - 0.7, 0.6)));
  etiqueta(ctx, "OBSERVACIÓN", a);
  const gx0 = W * 0.14, gx1 = W * 0.86, gy0 = H * 0.2, gy1 = H * 0.76;
  const lr0 = Math.log10(10), lr1 = Math.log10(320), d0 = 2.55, d1 = 3.05;
  const X = (r: number) => lerp(gx0, gx1, (Math.log10(r) - lr0) / (lr1 - lr0)), Y = (d: number) => lerp(gy1, gy0, (d - d0) / (d1 - d0));
  trazo(ctx, [[gx0, gy0], [gx0, gy1], [gx1, gy1]], RGB.crema, a * 0.6, 1.4);
  for (const r of [10, 20, 50, 100, 200, 300]) { trazo(ctx, [[X(r), gy1], [X(r), gy1 + 8]], RGB.crema, a * 0.5, 1); texto(ctx, String(r), X(r), gy1 + 34, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "center", esp: 2 }); }
  for (const d of [2.6, 2.7, 2.8, 2.9, 3.0]) texto(ctx, d.toFixed(1).replace(".", ","), gx0 - 14, Y(d) + 5, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "right", esp: 2 });
  texto(ctx, "TAMAÑO DE LA ESFERA · H⁻¹ MPC", (gx0 + gx1) / 2, gy1 + 66, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "center", esp: 4 });
  texto(ctx, "D₂", gx0 - 50, gy0 - 10, 18 * KT + 4, `rgba(${RGB.crema},${0.8 * a})`, { fam: SANS, peso: 600, esp: 2 });
  // D₂ = 3
  const a3 = a * eSuave(pr(t, K.grafica + 1.2, 0.6));
  trazo(ctx, [[gx0, Y(3)], [gx1, Y(3)]], AMBAR, a3 * 0.8, 1.4, [8, 8]);
  texto(ctx, "D₂ = 3: DISTRIBUCIÓN HOMOGÉNEA", gx1, Y(3) - 14, 15 * KT + 4, `rgba(${AMBAR},${0.95 * a3})`, { alin: "right", esp: 3 });
  // the points, small scales first, then rising with the sphere
  const n = DR.r.length, k = pr(t, K.grafica + 1.6, K.setenta - K.grafica - 1.6) * n;
  const banda: P[] = [], arriba: P[] = [], linea: P[] = [];
  for (let i = 0; i < n && i < k; i++) { banda.push([X(DR.r[i]), Y(DR.d2[i] - 2 * DR.err[i])]); arriba.push([X(DR.r[i]), Y(DR.d2[i] + 2 * DR.err[i])]); linea.push([X(DR.r[i]), Y(DR.d2[i])]); }
  if (linea.length > 1) {
    ctx.save(); ctx.beginPath(); [...arriba, ...banda.reverse()].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    ctx.fillStyle = `rgba(${AZUL},${0.22 * a})`; ctx.fill(); ctx.restore();
    trazo(ctx, linea, AZUL, a, 2.4);
  }
  linea.forEach(([x, y]) => luz(ctx, x, y, 12, a * 0.8, AZUL));
  texto(ctx, "AGRUPADAS", X(15), Y(2.6) + 40, 15 * KT + 4, `rgba(${AZUL},${0.9 * a * eSuave(pr(t, V[15] + 4.0, 0.5))})`, { alin: "center", esp: 3 });
  // the homogeneity scale
  const ah = a * eSuave(pr(t, K.setenta - 0.2, 0.6));
  if (ah > 0.01) { trazo(ctx, [[X(70), gy0], [X(70), gy1]], AMBAR, ah, 1.6); luz(ctx, X(70), Y(2.97), 26, ah, AMBAR); texto(ctx, "≈ 70 H⁻¹ MPC", X(70), gy0 - 14, 15 * KT + 4, `rgba(${AMBAR},${0.95 * ah})`, { alin: "center", esp: 3 }); texto(ctx, "DESDE AQUÍ, NO SE DISTINGUE DE 3", X(70) + 14, Y(2.75), 14 * KT + 4, `rgba(${AMBAR},${0.9 * ah})`, { esp: 3 }); }
  // the fractal ruled out, 80 to 300
  const ax = a * eSuave(pr(t, K.descarta - 0.2, 0.6));
  if (ax > 0.01) {
    ctx.fillStyle = `rgba(${ROJO},${0.14 * ax})`; ctx.fillRect(X(80), Y(2.97), X(300) - X(80), gy1 - Y(2.97));
    trazo(ctx, [[X(80), Y(2.97)], [X(300), Y(2.97)]], ROJO, ax, 1.6);
    texto(ctx, "DESCARTADO: UN FRACTAL CON D₂ < 2,97", (X(80) + X(300)) / 2, Y(2.8), 16 * KT + 4, `rgba(${ROJO},${0.95 * ax})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
    texto(ctx, "ENTRE 80 Y 300 H⁻¹ MPC · CONFIANZA 99,99 %", (X(80) + X(300)) / 2, Y(2.8) + 30, 13 * KT + 4, `rgba(${ROJO},${0.9 * ax * eSuave(pr(t, K.descarta + 7.8, 0.5))})`, { alin: "center", esp: 3 });
  }
  nota(ctx, "DATOS: CENSO WIGGLEZ, MNRAS 425 (2012), FIGURA 6 · TRAMO z ≈ 0,2 · BANDA: DOS VECES EL ERROR · H⁻¹ MPC ≈ 1,4 MPC", a);
};

// ─── 5 · four claims ────────────────────────────────────────────────────────────────────────────────────────────
const cuatro = (ctx: Ctx, t: number) => {
  if (t < K.cuatro - 0.6 || t > K.cierre + 0.4) return;
  const a = eSuave(pr(t, K.cuatro - 0.4, 0.6)) * (1 - eSuave(pr(t, K.cierre - 0.7, 0.6)));
  titular(ctx, "CUATRO AFIRMACIONES QUE SUELEN CONFUNDIRSE", H * 0.14, 28 * KT + 6, a);
  const cards: [string, string, string][] = [["AGRUPADO", "SÍ", VERDE], ["CON RELACIONES DE ESCALA, EN UN TRAMO", "SÍ", VERDE], ["FRACTAL A TODA ESCALA", "DESCARTADO", ROJO], ["HOMOGÉNEO A GRAN ESCALA", "COMPATIBLE", AZUL]];
  const tw = K.tarjetas as number[];
  cards.forEach(([s, v, col], i) => {
    const ai = a * eSuave(pr(t, tw[i] - 0.2, 0.5));
    if (ai <= 0.01) return;
    const x = W * (0.14 + 0.24 * i), y = H * 0.3, w = W * 0.2, h = H * 0.46;
    ctx.fillStyle = `rgba(10,12,20,${0.85 * ai})`; ctx.fillRect(x - w / 2, y, w, h); marco(ctx, x - w / 2, y, w, h, ai);
    // each card's little picture
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < 160; k++) {
      let px = 0, py = 0;
      if (i === 0) { const c = Math.floor(azar(k) * 4); px = (azar(c * 9) - 0.5) * 0.7 + (azar(k * 3) - 0.5) * 0.16; py = (azar(c * 5 + 1) - 0.5) * 0.7 + (azar(k * 7) - 0.5) * 0.16; }
      if (i === 1) { const u = k / 160; px = u - 0.5; py = 0.35 - u * 0.7 + (u > 0.65 ? (u - 0.65) * 0.9 : 0) + (azar(k) - 0.5) * 0.04; }
      if (i === 2) { const lv = Math.floor(azar(k) * 3), c = Math.floor(azar(k * 2) * 3); px = (azar(c + lv * 7) - 0.5) * 0.8 / (lv + 1) + (azar(k * 5) - 0.5) * 0.05; py = (azar(c * 3 + lv) - 0.5) * 0.8 / (lv + 1) + (azar(k * 11) - 0.5) * 0.05; }
      if (i === 3) { px = azar(k * 13) - 0.5; py = azar(k * 17) - 0.5; }
      ctx.fillStyle = `rgba(${col},${0.7 * ai})`; ctx.fillRect(x + px * w * 0.8, y + h * 0.36 + py * h * 0.5, 3, 3);
    }
    ctx.restore();
    if (i === 2) trazo(ctx, [[x - w * 0.35, y + h * 0.12], [x + w * 0.35, y + h * 0.6]], ROJO, ai * 0.8, 3);
    const lineas = s.length > 24 ? [s.slice(0, s.lastIndexOf(" ", 24)), s.slice(s.lastIndexOf(" ", 24) + 1)] : [s];
    lineas.forEach((l, j) => texto(ctx, l, x, y + h * 0.76 + j * 26, 14 * KT + 4, `rgba(${RGB.crema},${0.95 * ai})`, { alin: "center", esp: 2, peso: 600 }));
    texto(ctx, v, x, y + h + 50, 22 * KT + 6, `rgba(${col},${0.95 * ai})`, { fam: SANS, peso: 700, alin: "center", esp: 5 });
  });
};

// ─── 6 · close: out until the web is an even texture ───────────────────────────────────────────────────────────
const cierre = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.cierre - 0.6) return;
  const a = eSuave(pr(t, K.cierre - 0.4, 0.8)) * (1 - eSuave(pr(t, K.total - 2.0, 1.8)));
  if (f.vid_homogeneo) { ctx.save(); ctx.globalAlpha = a; ctx.drawImage(f.vid_homogeneo, 0, 0, W, H); ctx.restore(); }
  const g = ctx.createLinearGradient(0, H * 0.62, 0, H);
  g.addColorStop(0, "rgba(2,3,6,0)"); g.addColorStop(1, `rgba(2,3,6,${0.8 * a})`);
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.62, W, H * 0.38);
  const ar = a * ventana(t, V[19] + 0.4, K.puente + 4.0, 0.8);
  titular(ctx, "LA ESTRUCTURA LLEGA HASTA UNA ESCALA", H * 0.8, 30 * KT + 8, ar);
  texto(ctx, "DESPUÉS, EL UNIVERSO SE VUELVE PAREJO", W / 2, H * 0.8 + 44, 17 * KT + 4, `rgba(${AMBAR},${0.95 * ar})`, { alin: "center", esp: 5 });
  nota(ctx, "ILUSTRACIÓN · LA MISMA RED, REPETIDA Y VISTA DESDE CADA VEZ MÁS LEJOS", a * ventana(t, K.cierre + 1, V[19], 0.6));
};

// ─── real material, full frame between the scenes: a slow push, its caption and its credit ─────────────────────
const INS = K.inserciones as [string, string, number, number, string, string][];
const cobertura = (t: number) => INS.reduce((m, [, , t0, t1]) => Math.max(m, ventana(t, t0 - 0.15, t1 + 0.15, 0.3)), 0);
const CONTIENE = new Set(["fig1", "fig3", "mapa2df", "sdss"]);        // figures and maps are shown whole
const inserciones = (ctx: Ctx, t: number, f: Fotos) => {
  for (const [tipo, clave, t0, t1, rot, cred] of INS) {
    if (t < t0 - 0.2 || t > t1 + 0.2) continue;
    const a = ventana(t, t0 - 0.15, t1 + 0.15, 0.3);
    const im = tipo === "video" ? f[`vid_${clave}`] : f[clave];
    if (!im || a <= 0.01) continue;
    const entero = CONTIENE.has(clave);
    const z = (entero ? 1.0 : 1.04) + (entero ? 0.03 : 0.08) * pr(t, t0, t1 - t0);
    const sc = (entero ? Math.min((W * 0.92) / im.width, (H * 0.76) / im.height) : Math.max(W / im.width, H / im.height)) * z;
    ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingQuality = "high";
    ctx.filter = entero ? (clave === "fig1" || clave === "fig3" ? "invert(1) hue-rotate(180deg) brightness(0.92) contrast(1.05)" : "brightness(0.95)") : "contrast(1.04) brightness(0.9) saturate(0.92)";
    ctx.drawImage(im, W / 2 - (im.width * sc) / 2, (entero ? H * 0.44 : H / 2) - (im.height * sc) / 2, im.width * sc, im.height * sc); ctx.restore();
    const g = ctx.createLinearGradient(0, H * 0.7, 0, H);
    g.addColorStop(0, "rgba(2,3,6,0)"); g.addColorStop(1, `rgba(2,3,6,${0.75 * a})`);
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.7, W, H * 0.3);
    texto(ctx, rot, 84, H - 92, 20 * KT + 6, `rgba(${RGB.crema},${0.95 * a})`, { fam: SANS, peso: 600, esp: 3 });
    texto(ctx, cred, 84, H - 58, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { esp: 4 });
  }
};

export const dibujarCap8 = (ctx: Ctx, t: number, frame: number, fotos: Fotos) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  // one shot at a time: while a real photograph, figure or clip fills the frame, the scenes underneath are not drawn
  const cub = cobertura(t);
  if (cub < 0.999) {
    titulo(ctx, t, fotos);
    viaje(ctx, t, fotos);
    escalas(ctx, t);
    espectro(ctx, t);
    metricas(ctx, t);
    limites(ctx, t, fotos);
    corrimiento(ctx, t);
    fractal(ctx, t);
    esferas(ctx, t);
    censo(ctx, t);
    grafica(ctx, t);
    cuatro(ctx, t);
    cierre(ctx, t, fotos);
  }
  if (cub > 0.001) { ctx.fillStyle = `rgba(2,3,6,${cub})`; ctx.fillRect(0, 0, W, H); }
  inserciones(ctx, t, fotos);
  const fin = eSuave(pr(t, K.total - 1.2, 1.2)), ini = 1 - eSuave(pr(t, 0, 0.6));
  if (fin + ini > 0) { ctx.fillStyle = `rgba(2,3,6,${Math.min(1, fin + ini)})`; ctx.fillRect(0, 0, W, H); }
  let golpe = 0;
  for (const g of [K.titulo, K.descarta]) if (t >= g && t - g < 1.5) golpe = Math.max(golpe, 0.9 * Math.exp(-(t - g) * 3));
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.92, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: golpe * 0.4, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
