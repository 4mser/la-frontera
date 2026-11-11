// CAPÍTULO 1 · «La regla» (fractales/GUION-capitulo-1-la-regla.md). Animatic: the whole voice on its timeline;
// scenes 1 and 2 drawn as in the script (the rule written by the point of light; the two orbits on a number line);
// scenes 3–8 as placeholder cards with the line being spoken, until they are built. Same finish as the opening.
import K from "./cap1.json";
import { LIMPIO as SIN_TEXTO_TRAILER } from "./limpio";
import V from "./cap1_voz.json";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { RGB, SANS, MONO, eIO, eSuave, lerp, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
const AZUL = "150,190,255", AMBAR = "255,190,120";
const KT = Math.min(1, W / 1500);
const LIMPIO = (FORMATO as { limpio?: boolean }).limpio === true;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: LIMPIO ? 0 : 0.05, scan: LIMPIO ? 0 : 0.18, ruido: LIMPIO ? 0 : 0.5, grade: 1.8 };

const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  if (SIN_TEXTO_TRAILER && color !== "#fff") return;
  ctx.font = `${op.peso ?? 500} ${tam}px "${op.fam ?? MONO}"`;
  ctx.fillStyle = color;
  ctx.textAlign = op.alin ?? "left";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 3}px`;
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};
const ancho = (ctx: Ctx, s: string, tam: number, fam = SANS, peso = 600, esp = 0) => {
  ctx.font = `${peso} ${tam}px "${fam}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${esp}px`;
  const w = ctx.measureText(s).width;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  return w;
};
// a soft point of light
const luz = (ctx: Ctx, x: number, y: number, r: number, a: number, col = AZUL) => {
  if (a <= 0 || r < 0.5) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.25, `rgba(${col},${0.55 * a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
};
const escenaDe = (t: number) => { let k = 0; while (k < K.escenas.length - 1 && t >= K.escenas[k + 1][0]) k++; return k; };
const fundido = (t: number, k: number) => Math.min(eSuave(pr(t, K.escenas[k][0], 0.8)), 1 - eSuave(pr(t, K.escenas[k][1] - 0.8, 0.8)));

// ─── 1 · the rule, written again by the point of light, at the top of the frame ───────────────────────────────────
// its three parts light up as the voice names them; on «vuelve a empezar» an arrow loops from the result back to z
const PARTES = ["z", " → ", "z²", " + c"];
const reglaArriba = (ctx: Ctx, t: number, a: number, apaga = 0) => {
  const R = K.regla, tam = 92 * KT, y = H * 0.2;
  const ws = PARTES.map((p) => ancho(ctx, p, tam));
  const total = ws.reduce((s, w) => s + w, 0);
  let x = W / 2 - total / 2;
  const escrito = eIO(pr(t, R.escribe[0], R.escribe[1] - R.escribe[0]));
  ctx.save();
  ctx.beginPath(); ctx.rect(x - 20, 0, (total + 40) * escrito, H); ctx.clip();
  const brillo = [R.z, -1, R.z2, R.c];
  PARTES.forEach((p, i) => {
    const b = brillo[i] > 0 ? Math.exp(-Math.max(0, t - brillo[i]) * 1.4) * (t >= brillo[i] ? 1 : 0) : 0;
    texto(ctx, p, x, y, tam, `rgba(${RGB.crema},${(0.72 + 0.28 * b) * a * (1 - apaga)})`, { fam: SANS, peso: 600, esp: 0 });
    if (b > 0.02) {
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(10px)";
      texto(ctx, p, x, y, tam, `rgba(${AMBAR},${0.9 * b * a})`, { fam: SANS, peso: 600, esp: 0 });
      ctx.restore();
      texto(ctx, p, x, y, tam, `rgba(${AMBAR},${0.85 * b * a})`, { fam: SANS, peso: 600, esp: 0 });
    }
    x += ws[i];
  });
  ctx.restore();
  // the loop: from the end of the rule, under it, back to the first z
  const u = eIO(pr(t, R.vuelve, 1.4)) * a * (1 - apaga);
  if (u > 0) {
    const x0 = W / 2 - total / 2 + ws[0] * 0.5, x1 = W / 2 + total / 2 - ws[3] * 0.4, yb = y + 34 * KT;
    ctx.save();
    ctx.strokeStyle = `rgba(${AMBAR},${0.8 * a})`; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath();
    const n = 60;
    for (let i = 0; i <= n * u; i++) {
      const s = i / n, xx = lerp(x1, x0, s), yy = yb + Math.sin(Math.PI * s) * 46 * KT;
      if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
    }
    ctx.stroke();
    if (u > 0.97) {
      ctx.beginPath(); ctx.moveTo(x0, yb); ctx.lineTo(x0 + 12, yb + 14); ctx.moveTo(x0, yb); ctx.lineTo(x0 - 12, yb + 14); ctx.stroke();
    }
    ctx.restore();
  }
};

// ─── 2 · two fates on a number line ───────────────────────────────────────────────────────────────────────────────
// the line is centred; its range widens smoothly so the orbit stays in frame, until 677 leaves it
const recta = (ctx: Ctx, t: number, a: number) => {
  const c1 = K.c1, cm = K.cm1;
  const fase2 = t >= cm.inicio - 0.6;
  const yL = H * 0.56, x0 = W * 0.5;
  // which value the point is at, and the range shown
  let valor = 0, desde = 0, u = 1;
  if (!fase2) {
    let k = -1;
    for (let j = 0; j < c1.saltos.length; j++) if (t >= c1.saltos[j]) k = j;
    valor = k >= 0 ? c1.valores[k] : 0; desde = k > 0 ? c1.valores[k - 1] : 0;
    u = k >= 0 ? eIO(pr(t, c1.saltos[k], 0.45)) : 1;
  } else {
    let k = -1;
    for (let j = 0; j < cm.saltos.length; j++) if (t >= cm.saltos[j]) k = j;
    valor = k >= 0 ? (k % 2 === 0 ? -1 : 0) : 0; desde = k >= 0 ? (k % 2 === 0 ? 0 : -1) : 0;
    u = k >= 0 ? eIO(pr(t, cm.saltos[k], 0.5)) : 1;
  }
  const pos = lerp(desde, valor, u);
  // the range: ±2.6, opening up to ±32 for 26 (677 leaves the frame); back to ±2.6 for c = −1
  const objetivo = fase2 ? 2.6 : Math.min(32, Math.max(2.6, Math.abs(pos) * 1.25));
  const rango = fase2 ? lerp(32, 2.6, eIO(pr(t, cm.inicio - 2.2, 1.6))) : objetivo;
  const px = (v: number) => x0 + (v / rango) * W * 0.42;
  // the line and its ticks
  ctx.save();
  ctx.strokeStyle = `rgba(${RGB.crema},${0.55 * a})`; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W * 0.04, yL); ctx.lineTo(W * 0.96, yL); ctx.stroke();
  const paso = rango > 12 ? 5 : 1;
  for (let v = -Math.floor(rango / paso) * paso; v <= rango; v += paso) {
    const x = px(v);
    if (x < W * 0.04 || x > W * 0.96) continue;
    ctx.beginPath(); ctx.moveTo(x, yL - 10); ctx.lineTo(x, yL + 10); ctx.stroke();
    texto(ctx, `${v < 0 ? "−" : ""}${Math.abs(v)}`, x, yL + 42, 20 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "center", esp: 1 });
  }
  ctx.restore();
  // the constant
  const etiqueta = fase2 ? "c = −1" : "c = 1";
  texto(ctx, etiqueta, W * 0.06, H * 0.36, 34 * KT + 6, `rgba(${AMBAR},${0.9 * a})`, { fam: SANS, peso: 600, esp: 2 });
  // the point: a jump arcs over the line
  const x = px(pos), y = yL - Math.sin(Math.PI * u) * 70 * KT * (u < 1 ? 1 : 0);
  luz(ctx, x, y, 34 * KT + 6, a, AMBAR);
  // the orbit written below: 0 → 1 → 2 → 5 → 26 → 677…
  const serie = fase2 ? ["0", "−1", "0", "−1", "0", "−1", "0", "−1", "0", "−1", "0"] : ["0", "1", "2", "5", "26", "677…"];
  const pasos = fase2 ? cm.saltos : c1.saltos;
  let n = 1;
  for (const s of pasos) if (t >= s) n++;
  const visibles = serie.slice(0, Math.min(serie.length, n));
  const linea = visibles.join("  →  ");
  texto(ctx, linea, W / 2, H * 0.76, 40 * KT + 4, `rgba(${RGB.crema},${0.9 * a})`, { fam: SANS, peso: 500, alin: "center", esp: 1 });
};
// the two fates, side by side, on «Escapar, o quedarse»
const destinos = (ctx: Ctx, t: number, a: number) => {
  const tam = 40 * KT + 4;
  texto(ctx, "c = 1", W * 0.12, H * 0.4, tam, `rgba(${AMBAR},${0.9 * a})`, { fam: SANS, peso: 600, esp: 2 });
  texto(ctx, "0  →  1  →  2  →  5  →  26  →  677  →  …", W * 0.3, H * 0.4, tam, `rgba(${RGB.crema},${0.9 * a})`, { fam: SANS, peso: 500, esp: 1 });
  texto(ctx, "ESCAPA", W * 0.88, H * 0.4, 22 * KT + 4, `rgba(${AMBAR},${0.75 * a})`, { alin: "right", esp: 6 });
  texto(ctx, "c = −1", W * 0.12, H * 0.6, tam, `rgba(${AZUL},${0.9 * a})`, { fam: SANS, peso: 600, esp: 2 });
  texto(ctx, "0  →  −1  →  0  →  −1  →  0  →  …", W * 0.3, H * 0.6, tam, `rgba(${RGB.crema},${0.9 * a})`, { fam: SANS, peso: 500, esp: 1 });
  texto(ctx, "SE QUEDA", W * 0.88, H * 0.6, 22 * KT + 4, `rgba(${AZUL},${0.75 * a})`, { alin: "right", esp: 6 });
};

// ─── 3–8 · placeholder cards: the scene's name, and the line being spoken ─────────────────────────────────────────
const fraseActual = (k: number, t: number) => {
  const fr = V[k].frases as [string, number, number][];
  const tl = t - K.voz[k];
  let actual: [string, number, number] | null = null;
  for (const f of fr) if (tl >= f[1] - 0.2 && tl < f[2] + 0.8) actual = f;
  return actual;
};
const tarjeta = (ctx: Ctx, t: number, k: number, a: number) => {
  texto(ctx, `${k + 1} · ${K.nombres[k].toUpperCase()}`, W / 2, H * 0.3, 30 * KT + 6, `rgba(${AMBAR},${0.85 * a})`, { alin: "center", esp: 8 });
  texto(ctx, "ESCENA POR CONSTRUIR", W / 2, H * 0.3 + 44, 16 * KT + 4, `rgba(${RGB.crema},${0.4 * a})`, { alin: "center", esp: 6 });
  const f = fraseActual(k, t);
  if (!f) return;
  const af = a * Math.min(eSuave(pr(t - K.voz[k], f[1] - 0.2, 0.3)), 1 - eSuave(pr(t - K.voz[k], f[2] + 0.4, 0.4)));
  // the line, wrapped to the frame
  const tam = 34 * KT + 6, max = W * 0.8, palabras = f[0].split(" "), lineas: string[] = [];
  let l = "";
  for (const p of palabras) { const s = l ? `${l} ${p}` : p; if (ancho(ctx, s, tam, SANS, 400) > max) { lineas.push(l); l = p; } else l = s; }
  if (l) lineas.push(l);
  lineas.forEach((s, i) => texto(ctx, s, W / 2, H * 0.58 + (i - (lineas.length - 1) / 2) * tam * 1.4, tam, `rgba(${RGB.crema},${0.92 * af})`, { fam: SANS, peso: 400, alin: "center", esp: 0 }));
};

export const dibujarCap1 = (ctx: Ctx, t: number, frame: number) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  const k = escenaDe(t), a = fundido(t, k);
  let golpe = 0;
  if (k === 0) {
    // the point beats once in the centre, rises and writes the rule
    const lat = Math.exp(-Math.max(0, t - 0.3) * 4) * (t >= 0.3 ? 1 : 0);
    const sube = eIO(pr(t, 0.7, 0.5));
    if (t < K.regla.escribe[1]) luz(ctx, W / 2, lerp(H / 2, H * 0.2, sube), (22 + 90 * lat) * KT, eSuave(pr(t, 0.05, 0.25)) * (1 - pr(t, K.regla.escribe[1] - 0.3, 0.3)));
    reglaArriba(ctx, t, a);
    golpe = lat;
  } else if (k === 1) {
    reglaArriba(ctx, Math.max(t, K.regla.vuelve + 2), a * 0.55);
    const lado = K.cm1.lado[0] - 0.3;
    const ar = 1 - eSuave(pr(t, lado, 0.6)), ad = eSuave(pr(t, lado + 0.2, 0.8));
    if (ar > 0) recta(ctx, t, a * ar);
    if (ad > 0) destinos(ctx, t, a * ad);
    for (const s of [...K.c1.saltos, ...K.cm1.saltos]) if (t >= s && t - s < 0.6) golpe = Math.max(golpe, Math.exp(-(t - s) * 8));
  } else {
    tarjeta(ctx, t, k, a);
  }
  texto(ctx, "ANIMATIC · CAPÍTULO 1 · LA REGLA", W - 60, 60, 14, `rgba(${RGB.crema},0.35)`, { alin: "right", esp: 4 });
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.92, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: golpe * 0.12, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
