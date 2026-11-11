// CAPÍTULO IV · «Cómo crece una forma» (fractales/GUION-capitulo-4-como-crece.md, v2). Three mechanisms that branch,
// each one our own simulation next to its real photograph: diffusion-limited aggregation (herramientas/dla_cap4.py),
// raindrops that cut a relief into a river network (herramientas/erosion_cap4.py) and a tree that grows towards the
// places that still need it (herramientas/vasos_cap4.py); then the three measured with the same box counting
// (herramientas/cajas_cap4.py), the forms of the prologue with their mechanism, and the heartbeat that opens chapter V.
import K from "./cap4.json";
import { LIMPIO as SIN_TEXTO_TRAILER } from "./limpio";
import DLA from "./cap4_dla.json";
import ERO from "./cap4_erosion.json";
import VAS from "./cap4_vasos.json";
import CAJ from "./cap4_cajas.json";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { RGB, SANS, MONO, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
type Fotos = Record<string, HTMLImageElement>;
const AMBAR = "255,190,120", AGUA = "120,180,255", SANGRE = "255,150,130";
const KT = Math.min(1, W / 1500);
const LIMPIO = (FORMATO as { limpio?: boolean }).limpio === true;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: LIMPIO ? 0 : 0.05, scan: LIMPIO ? 0 : 0.18, ruido: LIMPIO ? 0 : 0.5, grade: 1.8 };
const V = K.voz;
const PTS = DLA.pts as number[], N = DLA.n, RMAX = DLA.rmax as number[], RVIS = DLA.rvis;
const CAM = DLA.caminatas as Record<string, number[][]>;
// the half-side of the box that holds the whole aggregate (as in herramientas/cajas_cap4.py)
let RFIN = 0;
for (let i = 0; i < N; i++) RFIN = Math.max(RFIN, Math.abs(PTS[2 * i]), Math.abs(PTS[2 * i + 1]));
RFIN *= 1.02;

// ─── helpers (as in chapter III) ────────────────────────────────────────────────────────────────────────────────
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
const banda = (ctx: Ctx, a: number) => {
  const g = ctx.createLinearGradient(0, H * 0.68, 0, H);
  g.addColorStop(0, "rgba(2,3,6,0)"); g.addColorStop(1, `rgba(2,3,6,${0.8 * a})`);
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.68, W, H * 0.32);
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
// a full-frame photograph, slowly pushed in
const foto = (ctx: Ctx, img: HTMLImageElement | undefined, a: number, z = 1, fx = 0.5, fy = 0.5) => {
  if (!img || a <= 0.01) return;
  const s = Math.max(W / img.width, H / img.height) * z;
  ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingQuality = "high"; ctx.filter = "contrast(1.05) brightness(0.92)";
  ctx.drawImage(img, W / 2 - fx * img.width * s, H / 2 - fy * img.height * s, img.width * s, img.height * s);
  ctx.restore();
};
// a photograph inside a frame (cover crop), with an optional caption above
const cuadro = (ctx: Ctx, img: HTMLImageElement | undefined, x: number, y: number, w: number, h: number, a: number, titulo = "", z = 1) => {
  if (!img || a <= 0.01) return;
  const s = Math.max(w / img.width, h / img.height) * z;
  ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, x + w / 2 - (img.width * s) / 2, y + h / 2 - (img.height * s) / 2, img.width * s, img.height * s); ctx.restore();
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.4 * a})`; ctx.strokeRect(x, y, w, h); ctx.restore();
  if (titulo) texto(ctx, titulo, x + w / 2, y - 16, 15 * KT + 4, `rgba(${RGB.crema},${0.85 * a})`, { alin: "center", esp: 4 });
};
const miles = (v: number) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const coma = (v: number) => v.toFixed(2).replace(".", ",");

// ─── the three forms, drawn anywhere ────────────────────────────────────────────────────────────────────────────
const CREMA = RGB.crema.split(",").map(Number), AMB = AMBAR.split(",").map(Number);
const color = (f: number, a: number) => `rgba(${AMB.map((c, i) => Math.round(lerp(c, CREMA[i], f))).join(",")},${a})`;
// the aggregate: the first n particles, centre (cx, cy), s pixels per unit
const agregado = (ctx: Ctx, cx: number, cy: number, s: number, n: number, a: number, recientes = true) => {
  if (a <= 0.01) return;
  const tam = Math.max(1.1, 2 * s * 0.9);
  if (n <= 300) {
    for (let i = 0; i < n; i++) {
      const px = cx + PTS[2 * i] * s, py = cy + PTS[2 * i + 1] * s;
      if (n <= 40) luz(ctx, px, py, Math.max(10, s * 3), 0.6 * a);
      ctx.fillStyle = color(i / N, 0.95 * a); ctx.beginPath(); ctx.arc(px, py, Math.max(1.2, s * 0.95), 0, Math.PI * 2); ctx.fill();
    }
    return;
  }
  const LOTE = 600;
  for (let i0 = 0; i0 < n; i0 += LOTE) {
    ctx.fillStyle = color(i0 / N, 0.92 * a);
    const i1 = Math.min(n, i0 + LOTE);
    for (let i = i0; i < i1; i++) ctx.fillRect(cx + PTS[2 * i] * s - tam / 2, cy + PTS[2 * i + 1] * s - tam / 2, tam, tam);
  }
  if (recientes) {
    const rec = Math.max(1, Math.floor(n * 0.012));
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,250,235,${0.55 * a})`;
    for (let i = Math.max(0, n - rec); i < n; i++) ctx.fillRect(cx + PTS[2 * i] * s - tam, cy + PTS[2 * i + 1] * s - tam, tam * 2, tam * 2);
    ctx.restore();
  }
};
// the relief and its channels: snapshot k (fractional: a crossfade), in the rectangle x, y, w, h
const relieve = (ctx: Ctx, f: Fotos, k: number, x: number, y: number, w: number, h: number, a: number) => {
  if (a <= 0.01) return;
  const k0 = Math.max(0, Math.min(ERO.fotos - 1, Math.floor(k))), k1 = Math.min(ERO.fotos - 1, k0 + 1), u = k - k0;
  ctx.save(); ctx.imageSmoothingQuality = "high"; ctx.globalCompositeOperation = "lighter";
  const i0 = f[`ero${k0}`], i1 = f[`ero${k1}`];
  if (i0) { ctx.globalAlpha = a * (1 - u); ctx.drawImage(i0, x, y, w, h); }
  if (i1 && u > 0) { ctx.globalAlpha = a * u; ctx.drawImage(i1, x, y, w, h); }
  ctx.restore();
};
// the vessels: nodes born up to step p, centre (cx, cy), radius R of the disc; the points still waiting
const VN = VAS.nodos as number[], VP = VAS.padre as number[], VNACE = VAS.nace as number[], VANCHO = VAS.ancho as number[];
const VPT = VAS.puntos as number[], VALC = VAS.alcanzado as number[];
let T = 0;   // the time, for the breathing of the points
const arbol = (ctx: Ctx, cx: number, cy: number, R: number, p: number, a: number, puntos = 1) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.25 * a})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R * 1.03, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  // the points that still wait; those reached just now flash
  if (puntos > 0.01) {
    for (let i = 0; i < VALC.length; i++) {
      const al = VALC[i], x = cx + VPT[2 * i] * R, y = cy + VPT[2 * i + 1] * R;
      if (al < 0 || al > p) { ctx.fillStyle = `rgba(${RGB.crema},${(0.22 + 0.16 * Math.sin(T * 2.4 + i * 1.7)) * a * puntos})`; ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4); }
      else if (p - al < 3) luz(ctx, x, y, 10, a * puntos * (1 - (p - al) / 3) * 0.8, SANGRE);
    }
  }
  ctx.save(); ctx.lineCap = "round"; ctx.strokeStyle = `rgba(${SANGRE},${0.92 * a})`;
  const k = R / 480;
  for (let i = 1; i < VP.length; i++) {
    if (VNACE[i] > p || VP[i] < 0) continue;
    const j = VP[i];
    ctx.lineWidth = Math.max(0.9, VANCHO[i] * 0.35 * k * 1.6);
    ctx.beginPath(); ctx.moveTo(cx + VN[2 * j] * R, cy + VN[2 * j + 1] * R); ctx.lineTo(cx + VN[2 * i] * R, cy + VN[2 * i + 1] * R); ctx.stroke();
  }
  ctx.restore();
};
// the boxes that touch a form (64, 32 or 16 px on its 1024-px image), drawn over its panel
type Rej = { h: number; w: number; cajas: Record<string, number[]> };
const REJ = (CAJ as unknown as { rejillas: Record<string, Rej> }).rejillas;
const rejilla = (ctx: Ctx, nombre: string, x0: number, y0: number, lado: number, e: number, a: number) => {
  if (a <= 0.01) return;
  const r = REJ[nombre], k = lado / 1024, cols = Math.floor(r.w / e), filas = Math.floor(r.h / e), q = e * k;
  ctx.save();
  ctx.strokeStyle = `rgba(${RGB.crema},${0.12 * a})`; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let c = 0; c <= cols; c++) { ctx.moveTo(x0 + c * q, y0); ctx.lineTo(x0 + c * q, y0 + filas * q); }
  for (let fl = 0; fl <= filas; fl++) { ctx.moveTo(x0, y0 + fl * q); ctx.lineTo(x0 + cols * q, y0 + fl * q); }
  ctx.stroke();
  ctx.fillStyle = `rgba(${AMBAR},${0.2 * a})`; ctx.strokeStyle = `rgba(${AMBAR},${0.7 * a})`;
  for (const i of r.cajas[String(e)]) { const fl = Math.floor(i / cols), c = i % cols; ctx.fillRect(x0 + c * q, y0 + fl * q, q, q); ctx.strokeRect(x0 + c * q + 0.5, y0 + fl * q + 0.5, q - 1, q - 1); }
  ctx.restore();
};

// ─── 0 · title ──────────────────────────────────────────────────────────────────────────────────────────────────
const titulo = (ctx: Ctx, t: number) => {
  if (t > K.formas + 0.2) return;
  const a = 1 - eSuave(pr(t, K.formas - 1.4, 1.2));
  // a small aggregate grows from the seed: 3.000 particles in five seconds
  const u = pr(t, K.semilla + 0.4, K.titulo - K.semilla - 0.6), n = u <= 0 ? 1 : Math.round(Math.pow(3000, u));
  const rc = RMAX[Math.min(RMAX.length - 1, Math.floor((n - 1) / 50))];
  const s = ((H * 0.3) / Math.max(30, rc * 1.06)) * (1 + 0.03 * pr(t, K.titulo, 6));
  agregado(ctx, W / 2, H / 2, s, n, a * eSuave(pr(t, K.semilla, 0.8)));
  luz(ctx, W / 2, H / 2, 26, a * eSuave(pr(t, K.semilla, 0.8)) * 0.7);
  const ut = t - K.titulo;
  if (ut < 0) return;
  ctx.fillStyle = `rgba(2,3,6,${0.55 * a * eSuave(pr(ut, 0, 1.0))})`; ctx.fillRect(0, 0, W, H);
  const palabras = ["CÓMO", "CRECE", "UNA", "FORMA"], tam = 76 * KT + 4, esp = 22;
  ctx.font = `300 ${tam}px "${SANS}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${esp}px`;
  const anchos = palabras.map((p) => ctx.measureText(p).width), hueco = tam * 0.5;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  let x = W / 2 - (anchos.reduce((q, w) => q + w, 0) + hueco * (palabras.length - 1)) / 2;
  palabras.forEach((p, i) => {
    const ap = eSuave(pr(ut, i * 0.3, 0.3)) * a;
    if (ap > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)";
      texto(ctx, p, x + esp / 2, H * 0.5, tam, `rgba(${RGB.crema},${0.35 * ap})`, { fam: SANS, peso: 300, esp });
      ctx.restore();
      texto(ctx, p, x + esp / 2, H * 0.5, tam, `rgba(${RGB.crema},${0.96 * ap})`, { fam: SANS, peso: 300, esp });
    }
    x += anchos[i] + hueco;
  });
  texto(ctx, "CAPÍTULO IV", W / 2 + 8, H * 0.5 - tam * 1.2, 24 * KT + 6, `rgba(${AMBAR},${0.9 * a * eSuave(pr(ut, 1.4, 0.8))})`, { alin: "center", esp: 16 });
};

// ─── 1 · three forms, one question ──────────────────────────────────────────────────────────────────────────────
const tresFormas = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.formas - 0.8 || t > K.difusion + 0.4) return;
  const a = eSuave(pr(t, K.formas - 0.8, 1.0)) * (1 - eSuave(pr(t, K.difusion - 0.9, 0.9)));
  const im = [f.pirolusita, f.retina, f.drenaje], nom = ["DENDRITA MINERAL", "VASOS DE LA RETINA", "RED DE DRENAJE"];
  // then each one fills the frame, one after another, under «se parecen tanto…»
  const t0 = V[1], t1 = K.difusion - 0.6, seg = (t1 - t0) / 3;
  const afila = 1 - eSuave(pr(t, t0 - 0.2, 0.8));
  for (let i = 0; i < 3; i++) {
    const w = W * 0.25, h = w * 0.66, x = W * 0.105 + i * (w + W * 0.02), y = H * 0.36;
    const ai = lerp(0.3 * eSuave(pr(t, V[0] - 0.4, 1.0)), 1, eSuave(pr(t, K.fotos3[i] - 0.3, 0.7)));
    cuadro(ctx, im[i], x, y, w, h, a * afila * ai, nom[i], 1.05 + 0.04 * pr(t, K.formas, 14));
  }
  for (let i = 0; i < 3; i++) {
    const ai = a * ventana(t, t0 + i * seg - 0.3, t0 + (i + 1) * seg + 0.3, 0.6);
    foto(ctx, im[i], ai, 1.05 + 0.08 * pr(t, t0 + i * seg, seg + 0.6));
  }
};

// ─── 2 · a wandering particle ───────────────────────────────────────────────────────────────────────────────────
const cuantas = (t: number) => {
  const [c1, c2, c3] = K.cam;
  if (t < c1[1]) return 1;
  if (t < c2[1]) return 2;
  if (t < c3[1]) return 3;
  const u = pr(t, K.crece[0], K.crece[1] - K.crece[0]);
  return Math.min(N, Math.round(4 * Math.pow(N / 4, u)));
};
const radio = (n: number) => RMAX[Math.min(RMAX.length - 1, Math.floor((n - 1) / 50))];
// the ten late walkers: only the end of their walk, near the aggregate
const TARDIAS = Array.from({ length: 10 }, (_, j) => {
  const w = CAM[String(N + j)] ?? [];
  const lim = RMAX[RMAX.length - 1] * 1.35;
  let i0 = w.length - 1;
  while (i0 > 0 && Math.hypot(w[i0 - 1][0], w[i0 - 1][1]) < lim) i0--;
  return w.slice(i0);
});
const caminata = (ctx: Ctx, w: number[][], u: number, X: (x: number) => number, Y: (y: number) => number, af: number, col = RGB.crema) => {
  if (w.length < 2 || af <= 0.01) return;
  const j = Math.max(1, Math.floor(Math.min(1, u) * (w.length - 1)));
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.strokeStyle = `rgba(${col},${0.3 * af})`; ctx.lineWidth = 1.5;
  ctx.beginPath(); for (let k = 0; k <= j; k++) (k ? ctx.lineTo(X(w[k][0]), Y(w[k][1])) : ctx.moveTo(X(w[k][0]), Y(w[k][1]))); ctx.stroke();
  const k0 = Math.max(0, j - 140);
  ctx.strokeStyle = `rgba(${col},${0.85 * af})`; ctx.lineWidth = 2.4;
  ctx.beginPath(); for (let k = k0; k <= j; k++) (k > k0 ? ctx.lineTo(X(w[k][0]), Y(w[k][1])) : ctx.moveTo(X(w[k][0]), Y(w[k][1]))); ctx.stroke();
  ctx.restore();
  if (u < 1) luz(ctx, X(w[j][0]), Y(w[j][1]), 22, 0.9 * af, col);
};
const contacto = (ctx: Ctx, px: number, py: number, e: number) => {
  if (e <= 0 || e >= 1) return;
  luz(ctx, px, py, 60 * (1 - e) + 10, 1 - e);
  ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.7 * (1 - e)})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(px, py, 6 + 60 * eOut(e), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
};
const difusion = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.difusion - 0.6 || t > K.erosion + 0.2) return;
  const a = eSuave(pr(t, K.difusion - 0.6, 1.0)) * (1 - eSuave(pr(t, K.erosion - 1.0, 1.0)));
  const extra = TARDIAS.filter((_, j) => t >= K.pantalla + j * 0.55 + 1.6).length;
  const n = cuantas(t) + extra, rc = radio(Math.min(n, N));
  // the camera: the launch circle while the walkers come in; in on the seed; back with the growth; to the left
  // for the comparison with the mineral
  const cerca = eIO(pr(t, K.cam[2][1] + 0.4, K.crece[0] + 1.2 - K.cam[2][1] - 0.4));
  const lado = eIO(pr(t, K.manganeso, 1.6));
  const s = ((H * 0.42) / Math.max(lerp(RVIS * 1.12, 40, cerca), rc * 1.06)) * lerp(1, 0.86, lado);
  const cx = lerp(W / 2, W * 0.29, lado), cy = H / 2;
  const X = (x: number) => cx + x * s, Y = (y: number) => cy + y * s;
  const ac = a * (1 - eSuave(pr(t, K.crece[0], 2.0))) * eSuave(pr(t, K.cam[0][0] - 0.8, 0.8));
  if (ac > 0.01) {
    ctx.save(); ctx.setLineDash([3, 9]); ctx.strokeStyle = `rgba(${RGB.crema},${0.45 * ac})`; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(cx, cy, RVIS * s, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  K.cam.forEach(([t0, t1], i) => {
    if (t < t0 - 0.1 || t > t1 + 1.2) return;
    caminata(ctx, CAM[String(i + 1)], pr(t, t0, t1 - t0), X, Y, a * (1 - eSuave(pr(t, t1 + 0.1, 1.0))));
    contacto(ctx, X(PTS[2 * (i + 1)]), Y(PTS[2 * (i + 1) + 1]), pr(t, t1, 0.9));
  });
  // the late walkers: almost all of them end on a tip
  TARDIAS.forEach((w, j) => {
    const t0 = K.pantalla + j * 0.55, t1 = t0 + 1.6;
    if (t < t0 || t > t1 + 1.2) return;
    caminata(ctx, w, pr(t, t0, t1 - t0), X, Y, a * (1 - eSuave(pr(t, t1 + 0.1, 1.0))), AGUA);
    contacto(ctx, X(PTS[2 * (N + j)]), Y(PTS[2 * (N + j) + 1]), pr(t, t1, 0.9));
  });
  agregado(ctx, cx, cy, s, n, a, t < K.crece[1] + 0.5);
  luz(ctx, cx, cy, 30 + 6 * Math.sin(t * 2.2), a * eSuave(pr(t, K.difusion, 1.0)) * (n > 40 ? 0.35 : 0.9));
  // Witten and Sander, each on the name the voice says
  const ar = a * (1 - eSuave(pr(t, K.cam[0][0] - 1.4, 0.9)));
  if (ar > 0.01) {
    ctx.fillStyle = `rgba(2,3,6,${0.5 * ar * eSuave(pr(t, K.retratosWS[0] - 0.3, 0.6))})`; ctx.fillRect(0, 0, W, H);
    retrato(ctx, f.witten, W * 0.3, ar * eSuave(pr(t, K.retratosWS[0] - 0.2, 0.7)), "THOMAS A. WITTEN", "", H * 0.14, H * 0.5);
    retrato(ctx, f.sander, W * 0.7, ar * eSuave(pr(t, K.retratosWS[1] - 0.2, 0.7)), "LEONARD M. SANDER", "", H * 0.14, H * 0.5);
    nota(ctx, "FOTOS: UNIVERSIDAD DE CHICAGO · UNIVERSIDAD DE MÍCHIGAN", ar * eSuave(pr(t, K.retratosWS[1] - 0.2, 0.7)));
  }
  rotulo(ctx, "AGREGACIÓN LIMITADA POR DIFUSIÓN", "WITTEN Y SANDER · 1981", a * ventana(t, K.retratosWS[0] - 0.4, K.cam[0][0] - 0.4, 0.8));
  const an = a * eSuave(pr(t, K.crece[0] + 0.5, 0.8)) * (1 - eSuave(pr(t, K.manganeso - 0.4, 0.8)));
  if (an > 0.01) {
    texto(ctx, "PARTÍCULAS", W - 84, H - 128, 14 * KT + 4, `rgba(${RGB.crema},${0.6 * an})`, { alin: "right", esp: 5 });
    texto(ctx, miles(n), W - 84, H - 84, 34 * KT + 6, `rgba(${RGB.crema},${0.95 * an})`, { fam: SANS, peso: 600, alin: "right", esp: 2 });
  }
  // the mineral, beside the simulation
  const am = a * eSuave(pr(t, K.manganeso + 0.6, 1.0));
  if (am > 0.01) {
    cuadro(ctx, f.pirolusita, W * 0.55, H * 0.16, W * 0.38, H * 0.6, am, "", 1.05 + 0.05 * pr(t, K.manganeso, 14));
    banda(ctx, am);
    rotulo(ctx, "DENDRITAS DE MANGANESO", "MODELO DE REACCIÓN Y DIFUSIÓN · 1991", am, W * 0.55, H - 128);
    rotulo(ctx, "SIMULACIÓN PROPIA", "60.000 PARTÍCULAS", am, 84, H - 128);
  }
};

// ─── 3 · rain on a relief ───────────────────────────────────────────────────────────────────────────────────────
// the drops that fall while it rains: positions from a fixed sequence
const gota = (i: number) => { const s = Math.sin(i * 12.9898) * 43758.5453, v = Math.sin(i * 78.233) * 12543.21; return [s - Math.floor(s), v - Math.floor(v)]; };
const erosion = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.erosion - 0.6 || t > K.vasos + 0.2) return;
  const a = eSuave(pr(t, K.erosion - 0.6, 1.0)) * (1 - eSuave(pr(t, K.vasos - 1.0, 1.0)));
  // the snapshot: the first ones go slowly (the network is born), the last ones faster
  const u = pr(t, K.cauces[0], K.cauces[1] - K.cauces[0]), k = (ERO.fotos - 1) * Math.pow(u, 0.75);
  const lado = eIO(pr(t, K.optimas, 1.6));
  const x = lerp(0, W * 0.03, lado), w = lerp(W, W * 0.5, lado), h = (w * 9) / 16, y = lerp(0, (H - h) / 2 - H * 0.05, lado);
  relieve(ctx, f, k, x, y, w, h, a);
  const extra = a * (1 - Math.min(1, k / 3));   // the bare relief, before the channels: its contours lit twice
  if (extra > 0.01) relieve(ctx, f, k, x, y, w, h, extra * 1.4);
  if (lado > 0.01) { ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.35 * a * lado})`; ctx.strokeRect(x, y, w, h); ctx.restore(); }
  // the rain: drops of light that fall evenly on the whole relief
  const al = a * ventana(t, K.lluvia - 1.2, K.cauces[0] + 8, 1.2) * (1 - lado);
  if (al > 0.01) {
    const n = 140, fase = t * 3.2;
    for (let i = 0; i < n; i++) {
      const [gx, gy] = gota(i + Math.floor(fase + i / n) * n), e = (fase + i / n) % 1;
      luz(ctx, x + gx * w, y + gy * h, 9, al * 0.7 * (1 - e) * (e < 0.1 ? e * 10 : 1), AGUA);
    }
  }
  const ac = a * ventana(t, K.cauces[0] + 0.5, K.optimas + 0.4, 0.8);
  if (ac > 0.01) {
    banda(ctx, ac);
    const kk = Math.min(ERO.gotas.length - 1, Math.floor(k)), g = lerp(ERO.gotas[kk], ERO.gotas[Math.min(ERO.gotas.length - 1, kk + 1)], k - kk);
    texto(ctx, "GOTAS DE LLUVIA", W - 84, H - 128, 14 * KT + 4, `rgba(${RGB.crema},${0.6 * ac})`, { alin: "right", esp: 5 });
    texto(ctx, miles(g), W - 84, H - 84, 34 * KT + 6, `rgba(${AGUA},${0.95 * ac})`, { fam: SANS, peso: 600, alin: "right", esp: 2 });
    rotulo(ctx, "SIMULACIÓN PROPIA", "GOTAS QUE EXCAVAN Y DEPOSITAN", ac);
  }
  // the optimal networks: Rodríguez-Iturbe and Rinaldo, then a real network from space
  const ap = a * ventana(t, K.optimas + 1.5, V[12] + 2.0, 0.7);
  if (ap > 0.01) {
    retrato(ctx, f.iturbe, W * 0.625, ap, "IGNACIO RODRÍGUEZ-ITURBE", "", H * 0.18, H * 0.38);
    retrato(ctx, f.rinaldo, W * 0.875, ap, "ANDREA RINALDO", "", H * 0.18, H * 0.38);
    nota(ctx, "FOTOS: TEXAS A&M ENGINEERING · EPFL-MEDIACOM, CC BY 4.0", ap);
  }
  const ad = a * eSuave(pr(t, V[12] + 1.6, 1.0));
  cuadro(ctx, f.drenaje, W * 0.56, y, W * 0.41, h, ad, "", 1.05 + 0.05 * pr(t, V[12], 12));
  const ar = a * eSuave(pr(t, K.optimas + 0.6, 0.8));
  if (ar > 0.01) {
    texto(ctx, "SIMULACIÓN", x + w / 2, y - 18, 15 * KT + 4, `rgba(${RGB.crema},${0.8 * ar})`, { alin: "center", esp: 4 });
    texto(ctx, "RED DE DRENAJE REAL, VISTA DESDE EL ESPACIO", W * 0.765, y - 18, 15 * KT + 4, `rgba(${RGB.crema},${0.8 * ad})`, { alin: "center", esp: 4 });
    rotulo(ctx, "REDES DE CANALES ÓPTIMAS", "RODRÍGUEZ-ITURBE, RINALDO Y OTROS · 1992", ar, 84, H - 128);
  }
};

// ─── 4 · a tree that seeks what it lacks ────────────────────────────────────────────────────────────────────────
const vasos = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.vasos - 0.6 || t > K.cajas + 0.2) return;
  const a = eSuave(pr(t, K.vasos - 0.6, 1.0)) * (1 - eSuave(pr(t, K.cajas - 1.0, 1.0)));
  const lado = eIO(pr(t, K.colonia - 0.4, 1.6));
  const cx = lerp(W / 2, W * 0.3, lado), cy = H * 0.47, R = lerp(H * 0.4, H * 0.36, lado);
  const p = VAS.pasos * eIO(pr(t, K.arbol[0], K.arbol[1] - K.arbol[0]));
  arbol(ctx, cx, cy, R, p, a, eSuave(pr(t, K.vasos + 0.4, 2.5)));
  luz(ctx, cx + VAS.od[0] * R, cy + VAS.od[1] * R, 26, a * 0.6);
  // Runions and Prusinkiewicz, on the right
  const ap = a * ventana(t, K.colonia + 1.4, V[15] + 4.0, 0.7);
  if (ap > 0.01) {
    retrato(ctx, f.runions, W * 0.64, ap, "ADAM RUNIONS", "", H * 0.18, H * 0.38);
    retrato(ctx, f.prusinkiewicz, W * 0.86, ap, "PRZEMYSŁAW PRUSINKIEWICZ", "", H * 0.18, H * 0.38);
    nota(ctx, "FOTOS: UNIVERSIDAD DE CALGARY · P2IRC, UNIVERSIDAD DE SASKATCHEWAN", ap);
  }
  rotulo(ctx, "COLONIZACIÓN DEL ESPACIO", "RUNIONS, PRUSINKIEWICZ Y OTROS · 2005 – 2007", a * eSuave(pr(t, K.colonia + 0.4, 0.8)));
  // the real retina
  const at = a * eSuave(pr(t, K.retina, 1.0));
  if (at > 0.01) {
    const lr = H * 0.72;
    cuadro(ctx, f.retina, W * 0.76 - lr / 2, cy - lr / 2, lr, lr, at, "VASOS DE LA RETINA", 1.02 + 0.04 * pr(t, K.retina, 10));
    texto(ctx, "SIMULACIÓN", cx, cy - R * 1.03 - 18, 15 * KT + 4, `rgba(${RGB.crema},${0.8 * at})`, { alin: "center", esp: 4 });
  }
};

// ─── 5 · counting boxes; the three forms side by side (also for the close) ─────────────────────────────────────
const LADO = W * 0.26;
const panel = (ctx: Ctx, f: Fotos, i: number, cx: number, cy: number, a: number) => {
  if (i === 0) agregado(ctx, cx, cy, LADO / (2 * RFIN), N, a, false);
  else if (i === 1) relieve(ctx, f, ERO.fotos - 1, cx - LADO / 2, cy - (LADO * 9) / 32, LADO, (LADO * 9) / 16, a);
  else arbol(ctx, cx, cy, LADO / 2.05, VAS.pasos, a, 0);
};
const NOMBRES = ["difusion", "erosion", "vasos"], MECANISMO = ["PARTÍCULAS QUE SE PEGAN", "AGUA QUE EXCAVA", "TEJIDOS QUE PIDEN OXÍGENO"];
const cajas = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.cajas - 0.6 || t > K.mosaico + 0.2) return;
  const a = eSuave(pr(t, K.cajas - 0.6, 1.0)) * (1 - eSuave(pr(t, K.mosaico - 1.0, 1.0)));
  const cy = H * 0.47, xs = [W * 0.19, W * 0.5, W * 0.81];
  const [r0, r1] = K.rejilla, seg = (r1 - r0) / 3;
  for (let i = 0; i < 3; i++) {
    const ai = a * eSuave(pr(t, K.cajas + i * 0.5, 0.8));
    panel(ctx, f, i, xs[i], cy, ai);
    texto(ctx, ["DIFUSIÓN", "EROSIÓN", "TRANSPORTE"][i], xs[i], cy - LADO / 2 - 44, 24 * KT + 6, `rgba(${RGB.crema},${0.92 * ai})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
    texto(ctx, MECANISMO[i], xs[i], cy - LADO / 2 - 14, 14 * KT + 4, `rgba(${AMBAR},${0.85 * ai * eSuave(pr(t, V[17] + 2.2 + i * 1.6, 0.6))})`, { alin: "center", esp: 4 });
    // the boxes: 64 px, then 32, then 16
    const r = REJ[NOMBRES[i]], k = LADO / 1024, y0 = cy - (r.h * k) / 2, x0 = xs[i] - LADO / 2;
    [64, 32, 16].forEach((e, j) => rejilla(ctx, NOMBRES[i], x0, y0, LADO, e, a * ventana(t, r0 + j * seg, r0 + (j + 1) * seg + (j === 2 ? 1.0 : 0.2), 0.4)));
    const D = (CAJ as unknown as Record<string, [number, number[]]>)[NOMBRES[i]][0];
    const ad = a * eSuave(pr(t, r1 - 0.2 + i * 0.4, 0.6));
    if (ad > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(10px)";
      texto(ctx, `D ≈ ${coma(D)}`, xs[i], cy + LADO / 2 + 74, 44 * KT + 8, `rgba(${AMBAR},${0.35 * ad})`, { fam: SANS, peso: 600, alin: "center", esp: 2 }); ctx.restore();
      texto(ctx, `D ≈ ${coma(D)}`, xs[i], cy + LADO / 2 + 74, 44 * KT + 8, `rgba(${AMBAR},${0.97 * ad})`, { fam: SANS, peso: 600, alin: "center", esp: 2 });
    }
  }
  nota(ctx, "MEDICIÓN PROPIA · CONTEO DE CAJAS DE 4 A 64 PX SOBRE IMÁGENES DE 1024 PX · COMPARABLES ENTRE SÍ", a * eSuave(pr(t, r0, 0.8)));
};

// ─── 6 · the prologue list returns, each form with how it grows ─────────────────────────────────────────────────
const MOSAICO: [string, string, string][] = [
  ["copo", "COPO DE NIEVE", "DIFUSIÓN, CON LA SIMETRÍA DEL CRISTAL"], ["escarcha", "ESCARCHA", "DIFUSIÓN, CON LA SIMETRÍA DEL CRISTAL"],
  ["pirolusita", "DENDRITA DE MANGANESO", "REACCIÓN Y DIFUSIÓN"], ["drenaje", "RED DE DRENAJE", "EROSIÓN"],
  ["retina", "VASOS DE LA RETINA", "TRANSPORTE DE OXÍGENO"], ["romanesco", "ROMANESCO", "EL CRECIMIENTO DE LA PLANTA"]];
const mosaico = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.mosaico - 0.6 || t > K.cierre + 0.2) return;
  const a = eSuave(pr(t, K.mosaico - 0.6, 1.0)) * (1 - eSuave(pr(t, K.cierre - 1.0, 1.0)));
  const w = W * 0.27, h = H * 0.3, gx = W * 0.035, x0 = (W - 3 * w - 2 * gx) / 2;
  MOSAICO.forEach(([k, n, m], i) => {
    const c = i % 3, r = Math.floor(i / 3), x = x0 + c * (w + gx), y = H * 0.1 + r * (h + H * 0.16);
    const ai = a * eSuave(pr(t, K.mosaico + i * 0.45, 0.8));
    cuadro(ctx, f[k], x, y, w, h, ai, "", 1.04 + 0.04 * pr(t, K.mosaico, 16));
    texto(ctx, n, x + w / 2, y + h + 36, 18 * KT + 4, `rgba(${RGB.crema},${0.9 * ai})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
    texto(ctx, m, x + w / 2, y + h + 64, 13 * KT + 4, `rgba(${AMBAR},${0.85 * ai * eSuave(pr(t, V[20] + 1.0 + i * 0.6, 0.6))})`, { alin: "center", esp: 4 });
  });
};

// ─── 7 · close: the three forms meet and almost coincide, then part; a heartbeat ────────────────────────────────
const cierre = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.cierre - 0.6) return;
  const a = eSuave(pr(t, K.cierre - 0.6, 1.0)) * (1 - eSuave(pr(t, K.oscuro - 0.6, 1.4)));
  const junta = eIO(pr(t, K.cierre + 0.2, 1.8)) * (1 - eIO(pr(t, V[21] + 2.6, 2.2)));
  const xs = [W * 0.19, W * 0.5, W * 0.81].map((x) => lerp(x, W / 2, junta));
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) panel(ctx, f, i, xs[i], H * 0.5, a * lerp(1, 0.62, junta));
  ctx.restore();
  // after «Pero hay formas…»: one point of light that beats with the heart
  for (const tl of K.latidos) {
    const e = pr(t, tl, 0.9);
    if (e > 0 && e < 1) luz(ctx, W / 2, H / 2, 40 + 120 * eOut(e), (1 - e) * 0.9);
  }
  luz(ctx, W / 2, H / 2, 18, ventana(t, K.oscuro + 0.6, K.total - 0.8, 1.0) * 0.6);
};

export const dibujarCap4 = (ctx: Ctx, t: number, frame: number, fotos: Fotos) => {
  T = t;
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  titulo(ctx, t);
  tresFormas(ctx, t, fotos);
  difusion(ctx, t, fotos);
  erosion(ctx, t, fotos);
  vasos(ctx, t, fotos);
  cajas(ctx, t, fotos);
  mosaico(ctx, t, fotos);
  cierre(ctx, t, fotos);
  const fin = eSuave(pr(t, K.total - 1.2, 1.2)), ini = 1 - eSuave(pr(t, 0, 0.6));
  if (fin + ini > 0) { ctx.fillStyle = `rgba(2,3,6,${Math.min(1, fin + ini)})`; ctx.fillRect(0, 0, W, H); }
  let golpe = 0;
  for (const g of [K.titulo, K.crece[1], ...K.latidos]) if (t >= g && t - g < 1.5) golpe = Math.max(golpe, 0.9 * Math.exp(-(t - g) * 3));
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.92, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: golpe * 0.4, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
