// CAPÍTULO X · «La frontera» (fractales/GUION-capitulo-10-frontera.md). The end of the film. In the dark, a heartbeat
// and the promise of the opening (three frontiers); four returns, each with a new meaning (the heart, the coast,
// Richardson, the cosmic web); the title; then one shot with no cut: the cosmic web, a galaxy, the Earth, the fjords
// of Chile, a drop, a living microcosm (a recreation after Haeckel), a Julia set, and the Mandelbrot set down to
// ×10⁶⁰, past every measurement, to a whole copy; the turn: that dark is a pupil, someone is looking; the last line.
import K from "./cap10.json";
import EPI from "./epilogo.json";
import WZ from "../public/p8/wigglez_d2.json";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { dibujarLogo, ponCargasFractales } from "./logoFinal";
import CONTORNOS from "../public/p10/logo/marca-contornos.json";
import VOZ from "./cap10_voz.json";
import D3 from "./cap3_datos.json";
import D5 from "./cap5_datos.json";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { RGB, SANS, MONO, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
type Fotos = Record<string, HTMLImageElement>;
type P = [number, number];
const AMBAR = "255,190,120", AZUL = "150,190,255", ROJO = "255,130,110";
const KT = Math.min(1, W / 1500);
const LIMPIO = (FORMATO as { limpio?: boolean }).limpio === true;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: LIMPIO ? 0 : 0.05, scan: LIMPIO ? 0 : 0.18, ruido: LIMPIO ? 0 : 0.5, grade: 1.8 };
const V = K.voz as number[];
const PAL = (VOZ as unknown as { palabras: [string, number][] }[]).map((l) => l.palabras);
const palabra = (k: number, w: string, n = 0) => V[k] + (PAL[k].filter(([p]) => p.toLowerCase() === w)[n]?.[1] ?? 0);

// ─── helpers (as in chapters III–IX) ────────────────────────────────────────────────────────────────────────────
// «sin texto»: the same picture with no lettering at all (for the trailer: --props='{"limpio":true}')
let SIN_TEXTO = false, DEJA_TEXTO = false;
export const ponLimpio = (b: boolean) => { SIN_TEXTO = b; };
const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  if (SIN_TEXTO && color !== "#fff" && !DEJA_TEXTO) return;            // the title's masks (drawn in #fff) still work
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
const trazo = (ctx: Ctx, pts: P[], col: string, a: number, w = 2) => {
  if (a <= 0.01 || pts.length < 2) return;
  ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
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
const titular = (ctx: Ctx, s: string, y: number, tam: number, a: number, col = RGB.crema) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)";
  texto(ctx, s, W / 2, y, tam, `rgba(${col},${0.35 * a})`, { fam: SANS, peso: 300, alin: "center", esp: 4 }); ctx.restore();
  texto(ctx, s, W / 2, y, tam, `rgba(${col},${0.96 * a})`, { fam: SANS, peso: 300, alin: "center", esp: 4 });
};
const retrato = (ctx: Ctx, img: HTMLImageElement | undefined, x: number, a: number, nombre: string, linea: string, y = H * 0.16, h = H * 0.5) => {
  if (!img || a <= 0.01) return;
  const w = (h * img.width) / img.height;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(2,3,6,0.85)"; ctx.fillRect(x - w / 2 - 14, y - 14, w + 28, h + 28);
  ctx.filter = "sepia(0.35) contrast(1.05) brightness(0.95)";
  ctx.drawImage(img, x - w / 2, y, w, h);
  ctx.filter = "none";
  ctx.strokeStyle = `rgba(${RGB.crema},0.35)`; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2 - 14, y - 14, w + 28, h + 28);
  ctx.restore();
  texto(ctx, nombre, x, y + h + 52, 22 * KT + 6, `rgba(${RGB.crema},${0.92 * a})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
  if (linea) texto(ctx, linea, x, y + h + 84, 14 * KT + 4, `rgba(${AMBAR},${0.85 * a})`, { alin: "center", esp: 4 });
};
const sup = (n: number) => String(n).split("").map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c] ?? "⁻").join("");
// a scale label, lower left, as in the journey of the opening
const escala = (ctx: Ctx, pot: string, nombre: string, a: number) => {
  if (a <= 0.01) return;
  texto(ctx, pot, 84, H - 120, 34 * KT + 8, `rgba(${RGB.crema},${0.95 * a})`, { fam: SANS, peso: 300, esp: 2 });
  if (nombre) texto(ctx, nombre, 84, H - 82, 16 * KT + 4, `rgba(${AMBAR},${0.9 * a})`, { esp: 5 });
};
const clip = (ctx: Ctx, im: HTMLImageElement | undefined, a: number) => {
  if (!im || a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = a; ctx.drawImage(im, 0, 0, W, H); ctx.restore();
};
const LATIDOS = (t0: number, n: number) => Array.from({ length: n }, (_, i) => t0 + i * 1.05);
const pulso = (t: number, ts: number[]) => ts.reduce((m, x) => Math.max(m, t >= x ? Math.exp(-(t - x) * 4) : 0), 0);

// ─── 0 · in the dark: a heartbeat, a point; the three frontiers ────────────────────────────────────────────────
const oscuro = (ctx: Ctx, t: number) => {
  if (t > K.corazon + 0.4) return;
  const a = eSuave(pr(t, 0.3, 0.8)) * (1 - eSuave(pr(t, K.corazon - 0.8, 0.8)));
  const p = pulso(t, LATIDOS(0.8, 7));
  luz(ctx, W / 2, H * 0.42, 10 + 60 * p, a * (0.5 + 0.5 * p), RGB.crema);
  const tres: [string, number][] = [["LAS QUE DIBUJAN LAS FORMAS", palabra(0, "las")], ["LAS QUE NOS SEPARAN", palabra(0, "las", 2)], ["LAS QUE LIMITAN LO QUE CREEMOS CONOCER", palabra(0, "las", 3)]];
  tres.forEach(([s, tw], i) => texto(ctx, s, W / 2, H * 0.62 + i * 46, 18 * KT + 6, `rgba(${i === 2 ? AMBAR : RGB.crema},${0.92 * a * eSuave(pr(t, tw - 0.1, 0.6))})`, { alin: "center", esp: 6 }));
};

// ─── 1 · the returns ────────────────────────────────────────────────────────────────────────────────────────────
const RR = (D5.todo as number[]).slice(30000, 31400);
const EP = D3.espana_portugal as unknown as { piezas: number[][][]; medidas: Record<string, { largo: number; caminatas: number[][][] }> };
const regresos = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.corazon - 0.8 || t > K.titulo + 0.4) return;
  // the heart: a rhythm between order and disorder
  const ac = ventana(t, K.corazon - 0.6, K.costa + 0.2, 0.6);
  if (ac > 0.01) {
    const off = Math.floor((t - K.corazon) * 30), n = 420, pts: P[] = [];
    for (let i = 0; i < n; i++) { const v = RR[(i + off) % RR.length]; pts.push([lerp(W * 0.06, W * 0.94, i / (n - 1)), H * 0.5 + (0.78 - v) * H * 1.3]); }
    trazo(ctx, pts, ROJO, ac, 1.8);
    luz(ctx, W * 0.94, pts[n - 1][1], 30, ac, ROJO);
    texto(ctx, "UN RITMO ENTRE EL ORDEN Y EL DESORDEN", W / 2, H * 0.84, 20 * KT + 6, `rgba(${RGB.crema},${0.95 * ac * eSuave(pr(t, K.corazon + 3.4, 0.6))})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
    texto(ctx, "CAPÍTULO V", W / 2, H * 0.14, 14 * KT + 4, `rgba(${AMBAR},${0.8 * ac})`, { alin: "center", esp: 8 });
  }
  // the coast: one length per ruler
  const ak = ventana(t, K.costa - 0.4, K.richardson + 0.2, 0.6);
  if (ak > 0.01) {
    const todos = EP.piezas.flat(), xs = todos.map((p) => p[0]), ys = todos.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min((W * 0.34) / (x1 - x0), (H * 0.66) / (y1 - y0)), ox = W * 0.32 - ((x0 + x1) / 2) * s, oy = H * 0.5 - ((y0 + y1) / 2) * s;
    const M = (p: number[]): P => [ox + p[0] * s, oy + p[1] * s];
    EP.piezas.forEach((pz) => trazo(ctx, pz.map(M), RGB.crema, ak * 0.5, 1.2));
    ([["80", AZUL, 0], ["20", RGB.crema, 1], ["5", AMBAR, 2]] as [string, string, number][]).forEach(([k, col, i]) => {
      const ai = ak * eSuave(pr(t, K.costa + 0.6 + i * 0.8, 0.5));
      EP.medidas[k].caminatas.forEach((c) => trazo(ctx, c.map(M), col, ai * 0.85, 1.8));
      texto(ctx, `${Math.round(EP.medidas[k].largo).toLocaleString("es-CL")} KM`, W * 0.74, H * (0.36 + i * 0.12), 28 * KT + 6, `rgba(${col},${0.95 * ai})`, { fam: SANS, peso: 600, alin: "center", esp: 2 });
    });
    texto(ctx, "MEDIR TAMBIÉN ES DECIDIR DESDE QUÉ ESCALA MIRAMOS", W / 2, H * 0.9, 18 * KT + 4, `rgba(${RGB.crema},${0.95 * ak * eSuave(pr(t, V[2] + 5.0, 0.6))})`, { alin: "center", esp: 3 });
    texto(ctx, "CAPÍTULO III", W / 2, H * 0.14, 14 * KT + 4, `rgba(${AMBAR},${0.8 * ak})`, { alin: "center", esp: 8 });
  }
  // Richardson: he measured borders to understand war
  const ar = ventana(t, K.richardson - 0.4, K.red + 0.2, 0.6);
  if (ar > 0.01) {
    retrato(ctx, f.richardson, W * 0.3, ar, "LEWIS FRY RICHARDSON", "1881 – 1953", H * 0.16, H * 0.54);
    texto(ctx, "¿PELEAN MÁS ENTRE SÍ", W * 0.68, H * 0.42, 26 * KT + 6, `rgba(${RGB.crema},${0.95 * ar * eSuave(pr(t, K.richardson + 2.2, 0.6))})`, { fam: SANS, peso: 300, alin: "center", esp: 3 });
    texto(ctx, "LOS PAÍSES QUE COMPARTEN", W * 0.68, H * 0.42 + 40, 26 * KT + 6, `rgba(${RGB.crema},${0.95 * ar * eSuave(pr(t, K.richardson + 2.2, 0.6))})`, { fam: SANS, peso: 300, alin: "center", esp: 3 });
    texto(ctx, "MÁS FRONTERA?", W * 0.68, H * 0.42 + 80, 26 * KT + 6, `rgba(${AMBAR},${0.95 * ar * eSuave(pr(t, K.richardson + 2.2, 0.6))})`, { fam: SANS, peso: 300, alin: "center", esp: 3 });
    texto(ctx, "NI SIQUIERA SU LARGO ERA UNA PREGUNTA SENCILLA", W * 0.68, H * 0.42 + 140, 14 * KT + 4, `rgba(${AMBAR},${0.9 * ar * eSuave(pr(t, K.richardson + 6.2, 0.6))})`, { alin: "center", esp: 3 });
    texto(ctx, "CAPÍTULO III", W / 2, H * 0.1, 14 * KT + 4, `rgba(${AMBAR},${0.8 * ar})`, { alin: "center", esp: 8 });
    nota(ctx, "RETRATO: NOAA · DOMINIO PÚBLICO", ar);
  }
  // the cosmic web: even at large scale; we know it by measuring
  const aw = ventana(t, K.red - 0.4, K.titulo + 0.3, 0.6);
  if (aw > 0.01) {
    clip(ctx, f.vid_homogeneo, aw);
    texto(ctx, "A GRAN ESCALA, EL UNIVERSO SE VUELVE PAREJO", W / 2, H * 0.88, 18 * KT + 6, `rgba(${RGB.crema},${0.95 * aw * eSuave(pr(t, K.red + 2.5, 0.6))})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
    texto(ctx, "NO POR INTUICIÓN: MIDIENDO", W / 2, H * 0.88 + 34, 14 * KT + 4, `rgba(${AMBAR},${0.9 * aw * eSuave(pr(t, K.red + 6.4, 0.6))})`, { alin: "center", esp: 4 });
    texto(ctx, "CAPÍTULO VIII", W / 2, H * 0.1, 14 * KT + 4, `rgba(${AMBAR},${0.8 * aw})`, { alin: "center", esp: 8 });
  }
};

// ─── the title of the film; the question ───────────────────────────────────────────────────────────────────────
const titulo = (ctx: Ctx, t: number) => {
  if (t < K.titulo - 0.2 || t > K.viaje + 0.4) return;
  const a = eSuave(pr(t, K.titulo, 0.4)) * (1 - eSuave(pr(t, K.viaje - 0.8, 0.8)));
  const ut = t - K.titulo, tam = 92 * KT, esp = lerp(48, 26, eOut(pr(ut, 0, 5)));
  const at = a * (1 - eSuave(pr(t, V[5] - 0.4, 0.8)));
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(18px)";
  texto(ctx, "LA FRONTERA", W / 2 + esp / 2, H * 0.52, tam, `rgba(${RGB.crema},${0.4 * at})`, { fam: SANS, peso: 300, alin: "center", esp });
  ctx.restore();
  texto(ctx, "LA FRONTERA", W / 2 + esp / 2, H * 0.52, tam, `rgba(${RGB.crema},${0.97 * at})`, { fam: SANS, peso: 300, alin: "center", esp });
  texto(ctx, "CAPÍTULO X", W / 2 + 8, H * 0.52 - tam * 1.1, 24 * KT + 6, `rgba(${AMBAR},${0.9 * at * eSuave(pr(ut, 0.4, 0.8))})`, { alin: "center", esp: 16 });
  // a thin border of light along the title, as if the word were a frontier
  luz(ctx, W / 2, H * 0.52 + 30, 400 * eOut(pr(ut, 0, 1.5)), at * 0.25, AMBAR);
  titular(ctx, "¿QUÉ SIGNIFICA CONOCER DESDE UNA FRONTERA?", H * 0.46, 34 * KT + 8, a * ventana(t, V[5] + 1.2, palabra(5, "para") + 0.6, 0.6));
  const av = a * eSuave(pr(t, palabra(5, "hagamos") - 0.2, 0.6));
  texto(ctx, "UN ÚLTIMO VIAJE", W / 2, H * 0.48, 30 * KT + 8, `rgba(${RGB.crema},${0.95 * av})`, { fam: SANS, peso: 300, alin: "center", esp: 10 });
  texto(ctx, "SIN CORTES", W / 2, H * 0.48 + 44, 16 * KT + 4, `rgba(${AMBAR},${0.9 * av * eSuave(pr(t, palabra(5, "sin") - 0.1, 0.4))})`, { alin: "center", esp: 10 });
};

// ─── 2 · the shot with no cut ──────────────────────────────────────────────────────────────────────────────────
// the counter of the physical part: log10 of the width of the frame in metres, against seconds into the shot
const METROS: [number, number, string][] = [
  [0, 26.0, "EL UNIVERSO OBSERVABLE"], [8.6, 23.0, "UN CÚMULO DE GALAXIAS"], [10.0, 21.0, "UNA GALAXIA"], [15.5, 18.0, "UNA ESTRELLA"],
  [17.5, 7.2, "LA TIERRA"], [23.0, 6.3, "SUDAMÉRICA"], [26.0, 5.3, "LA COSTA DE CHILE · FIORDOS"], [37.0, 3.6, "EL AGUA"], [40.0, -2.0, "UNA GOTA DE AGUA"],
  [45.0, -3.0, "UNA GOTA DE AGUA"], [56.0, -3.6, "ORGANISMOS DE UNA SOLA CÉLULA"], [75.0, -4.0, "UNA DIATOMEA, UN RADIOLARIO"], [84.0, -4.6, "SU MEMBRANA"], [90.0, -5.0, "SU MEMBRANA"],
];
const metros = (s: number) => {
  for (let i = 0; i < METROS.length - 1; i++) if (s <= METROS[i + 1][0]) { const [a, la, n] = METROS[i], [b, lb] = METROS[i + 1]; return { lg: lerp(la, lb, eIO((s - a) / (b - a))), n }; }
  return { lg: METROS[METROS.length - 1][1], n: METROS[METROS.length - 1][2] };
};
const viaje = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.viaje - 0.2 || t > K.giro + 0.4) return;
  if (t < K.micro) clip(ctx, f.vid_viaje, eSuave(pr(t, K.viaje - 0.2, 0.6)));
  else if (t < K.mandel) clip(ctx, f.vid_micro, 1);
  else clip(ctx, f.vid_mandel, 1);
  // the hand-offs never cut: the last image of each part dissolves into the next, which is already moving
  if (t >= K.micro && t < K.micro + 0.8) clip(ctx, f.viajeFin, 1 - eSuave(pr(t, K.micro, 0.8)));
  if (t >= K.mandel && t < K.mandel + 1.6) { ctx.save(); ctx.globalCompositeOperation = "lighter"; clip(ctx, f.microFin, 1 - eSuave(pr(t, K.mandel, 1.6))); ctx.restore(); }
  const s = t - K.viaje;
  // physical scale, until the membrane
  if (t < K.mandel + 0.8) {
    const { lg, n } = metros(s), ae = 1 - eSuave(pr(t, K.mandel - 0.4, 1.0));
    escala(ctx, `10${sup(Math.round(lg))} m`, n, ae * eSuave(pr(s, 0.4, 0.8)));
  }
  // Haeckel, small, while the voice names him (the shot never cuts)
  const ah = ventana(t, palabra(8, "ernst") - 0.3, V[9] - 0.2, 0.5);
  if (ah > 0.01) {
    retrato(ctx, f.haeckel, W - 200, ah, "ERNST HAECKEL", "1834 – 1919", H * 0.1, H * 0.3);
    if (f.lamina) { const h = H * 0.42, w = (h * f.lamina.width) / f.lamina.height; ctx.save(); ctx.globalAlpha = ah * eSuave(pr(t, palabra(8, "dibujó") - 0.2, 0.5)); ctx.filter = "sepia(0.2)"; ctx.drawImage(f.lamina, W - 200 - 140 - w - 20, H * 0.1, w, h); ctx.restore(); }
    nota(ctx, "RETRATO Y LÁMINA (KUNSTFORMEN DER NATUR, 1904): DOMINIO PÚBLICO", ah);
  }
  const ar = ventana(t, K.micro + 2.0, K.micro + 40, 0.8);
  if (ar > 0.01 && ah < 0.01) nota(ctx, "RECREACIÓN · INSPIRADA EN RADIOLARIOS Y DIATOMEAS REALES Y EN LAS LÁMINAS DE HAECKEL", ar);
  // the facts the voice gives, written small
  const ach = ventana(t, V[7] + 0.4, V[7] + 12.6, 0.5);
  if (ach > 0.01) {
    texto(ctx, "4.300 KM EN LÍNEA RECTA", W - 84, H - 120, 22 * KT + 6, `rgba(${RGB.crema},${0.95 * ach})`, { fam: SANS, peso: 600, alin: "right", esp: 3 });
    texto(ctx, "MÁS DE 80.000 KM SIGUIENDO CADA FIORDO E ISLA", W - 84, H - 84, 15 * KT + 4, `rgba(${AMBAR},${0.95 * ach * eSuave(pr(t, V[7] + 5.6, 0.5))})`, { alin: "right", esp: 3 });
  }
  const a46 = ventana(t, V[6] + 0.4, V[6] + 9.0, 0.5);
  texto(ctx, "~46 ÓRDENES DE MAGNITUD ENTRE LO MÁS GRANDE OBSERVADO Y LO MÁS PEQUEÑO MEDIDO", W / 2, H * 0.1, 15 * KT + 4, `rgba(${RGB.crema},${0.9 * a46})`, { alin: "center", esp: 3 });
  // the rule alone: magnification, and what the frame would be if it measured ten micrometres
  if (t >= K.mandel - 0.4) {
    const z = t - K.mandel, n = Math.min(56, Math.max(0, 0.96 * (z - 0.5)));   // the zoom: width 3.2·2^-k, k ≈ 3.19 per second
    const am = eSuave(pr(z, 0.6, 1.0)) * (1 - eSuave(pr(t, K.giro - 1.0, 0.8)));
    escala(ctx, `× 10${sup(Math.round(n))}`, "AUMENTO", am);
    const hitos: [number, number, string][] = [[0.8, 5.7, "SI ESTA IMAGEN MIDIERA 10 MICRÓMETROS…"], [5.7, 11.0, "…AHORA SERÍA DEL TAMAÑO DE UN ÁTOMO"], [11.0, 15.0, "…DEL TAMAÑO DE UN NÚCLEO"], [15.0, 24.0, "…MÁS PEQUEÑA QUE LO MÁS PEQUEÑO QUE SE HA MEDIDO (~10⁻¹⁹ M)"], [26.0, 58.0, "NINGUNA MEDICIÓN LLEGA AQUÍ · SOLO QUEDA LA REGLA"]];
    hitos.forEach(([a0, a1, s0], i) => { const ai = am * ventana(z, a0, a1, 0.6); if (ai > 0.01) texto(ctx, s0, W - 84, H - 84, (i === 4 ? 17 : 15) * KT + 4, `rgba(${i === 4 ? AMBAR : RGB.crema},${0.95 * ai})`, { alin: "right", esp: 3 }); });
    const ac = ventana(t, K.copia, K.giro - 0.2, 0.6);
    titular(ctx, "×10⁵⁶ · LA MISMA FORMA, COMPLETA", H * 0.12, 26 * KT + 6, ac);
  }
};

// ─── 3 · the turn ──────────────────────────────────────────────────────────────────────────────────────────────
const giro = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.giro - 0.4 || t > K.final + 0.6) return;
  // the copy's dark becomes the pupil: the clip starts in black and the eye opens out of it
  clip(ctx, f.vid_giro, eSuave(pr(t, K.giro - 0.4, 0.8)));
  if (t < K.giro + 1.2) clip(ctx, f.mandelFin, 1 - eSuave(pr(t, K.giro - 0.2, 1.4)));
  const s = t - K.giro;
  escala(ctx, "10⁻² m", "UN OJO", ventana(s, 6.0, 11.0, 0.6));
  escala(ctx, "10⁻³ m", "LA RETINA", ventana(s, 15.5, 20.0, 0.6));
  escala(ctx, "10⁻⁴ m", "NEURONAS", ventana(s, 20.5, 24.5, 0.6));
  escala(ctx, "10²⁵ m", "LA RED CÓSMICA", ventana(s, 25.0, 30.0, 0.6));
  titular(ctx, "ALGUIEN MIRA", H * 0.12, 26 * KT + 6, ventana(t, V[13] + 1.0, V[13] + 7.0, 0.8));
  const ax = ventana(t, V[14], K.final + 0.4, 0.6);
  if (ax > 0.01) { const g = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.6); g.addColorStop(0, "rgba(2,3,6,0)"); g.addColorStop(0.5, `rgba(2,3,6,${0.7 * ax})`); g.addColorStop(1, "rgba(2,3,6,0)"); ctx.fillStyle = g; ctx.fillRect(0, H * 0.3, W, H * 0.3); }
  titular(ctx, "LA FRONTERA NO ESTÁ SOLO EN LAS COSAS", H * 0.44, 30 * KT + 8, ax);
  texto(ctx, "TAMBIÉN EN CÓMO LAS MIRAMOS", W / 2, H * 0.44 + 50, 18 * KT + 4, `rgba(${AMBAR},${0.95 * ax * eSuave(pr(t, palabra(14, "también") - 0.1, 0.5))})`, { alin: "center", esp: 6 });
  if (s > 24) nota(ctx, "OJO: MATT MING, CC BY 2.0 · RETINA: OPTOMETRUSPRIME, CC BY-SA 2.0 · NEURONAS: MIKEROSCOPY, CC BY 4.0 · ILLUSTRISTNG", ventana(s, 24.5, 30, 0.6));
};

// ─── 4 · the end: a heartbeat, a point, a border that widens with no last level ─────────────────────────────────
// a Koch curve seen ever closer: every third of a segment is the whole again, so the zoom loops with no end
const koch = (n: number): P[] => {
  let pts: P[] = [[0, 0], [1, 0]];
  for (let k = 0; k < n; k++) {
    const nv: P[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], dx = (x1 - x0) / 3, dy = (y1 - y0) / 3;
      const a: P = [x0 + dx, y0 + dy], b: P = [x0 + 2 * dx, y0 + 2 * dy];
      const c: P = [a[0] + dx * 0.5 - dy * 0.866, a[1] + dy * 0.5 + dx * 0.866];
      nv.push([x0, y0], a, c, b);
    }
    nv.push(pts[pts.length - 1]); pts = nv;
  }
  return pts;
};
const KOCH = koch(7);
const final = (ctx: Ctx, t: number) => {
  if (t < K.final - 0.4) return;
  const a = eSuave(pr(t, K.final, 1.0)) * (1 - eSuave(pr(t, K.total - 2.5, 2.3)));
  const lat = LATIDOS(K.final + 0.6, 6), p = pulso(t, lat);
  // the border: zoom toward the left end; each factor 3 the curve is the same, so the loop never shows
  const z = ((t - K.final) * 0.32) % 1, esc = W * 1.6 * Math.pow(3, z), ox = W * 0.08, oy = H * 0.62;
  const ab = a * eSuave(pr(t, K.final + 1.5, 2.0));
  const pts = KOCH.map(([x, y]) => [ox + x * esc, oy - y * esc] as P).filter(([x]) => x < W * 1.2);
  trazo(ctx, pts, AMBAR, ab * (0.75 + 0.25 * p), 1.6);
  luz(ctx, ox, oy, 20 + 50 * p, a * (0.5 + 0.5 * p), RGB.crema);
  const al = a * ventana(t, V[15] - 0.2, K.nombre - 0.2, 0.8);
  titular(ctx, "UNA FRONTERA PUEDE MARCAR EL LÍMITE DE UNA EXPLICACIÓN", H * 0.22, 26 * KT + 6, al);
  titular(ctx, "Y TAMBIÉN EL COMIENZO DE OTRA PREGUNTA", H * 0.22 + 48, 26 * KT + 6, al * eSuave(pr(t, palabra(15, "y") - 0.1, 0.6)), AMBAR);
  // the name
  const an = a * eSuave(pr(t, K.nombre, 1.2));
  if (an > 0.01) {
    ctx.fillStyle = `rgba(2,3,6,${0.85 * an})`; ctx.fillRect(0, 0, W, H);
    const esp = lerp(40, 28, eOut(pr(t, K.nombre, 6)));
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(16px)";
    texto(ctx, "LA FRONTERA", W / 2 + esp / 2, H * 0.52, 80 * KT, `rgba(${RGB.crema},${0.35 * an})`, { fam: SANS, peso: 300, alin: "center", esp }); ctx.restore();
    texto(ctx, "LA FRONTERA", W / 2 + esp / 2, H * 0.52, 80 * KT, `rgba(${RGB.crema},${0.97 * an})`, { fam: SANS, peso: 300, alin: "center", esp });
  }
};

// ─── epilogue (fractales/GUION-capitulo-10-epilogo.md) ───────────────────────────────────────────────────────────
// The pictures are clips (herramientas/ojo_epilogo.py, epilogo_b.py, epilogo_c.py, epilogo_d.py); drawn here only
// the scale chart of act C (as in chapter IX) and the end: the first point of light of the film, the last heartbeat,
// five seconds of silence and the name. e = seconds of the epilogue.
const COBRE = "214,140,90";
const epiCurva = (ctx: Ctx, e: number) => {
  const a = ventana(e, 87.6, 99.6, 0.8);
  if (a <= 0.01) return;
  const r = (WZ as unknown as { r: number[] }).r, d2 = (WZ as unknown as { d2: number[] }).d2;
  const x0 = W * 0.2, x1 = W * 0.8, yb = H * 0.74, yt = H * 0.26;
  const lx = (v: number) => lerp(x0, x1, (Math.log10(v) - Math.log10(r[0])) / (Math.log10(r[r.length - 1]) - Math.log10(r[0])));
  const ly = (v: number) => lerp(yb, yt, (v - 2.6) / 0.5);
  trazo(ctx, [[x0, yb], [x1, yb]], RGB.crema, a * 0.5, 1.2); trazo(ctx, [[x0, yb], [x0, yt]], RGB.crema, a * 0.5, 1.2);
  ctx.save(); ctx.setLineDash([8, 10]); trazo(ctx, [[x0, ly(3)], [x1, ly(3)]], RGB.crema, a * 0.45, 1); ctx.restore();
  texto(ctx, "3 · MATERIA PAREJA", x1 + 16, ly(3) + 5, 13 * KT + 4, `rgba(${RGB.crema},${0.8 * a})`, { esp: 3 });
  const k = eOut(pr(e, 88.4, 4.5)), n = Math.max(2, Math.round(k * r.length));
  const pts = r.slice(0, n).map((v, i) => [lx(v), ly(d2[i])] as P);
  trazo(ctx, pts, AZUL, a, 2);
  pts.forEach(([x, y]) => luz(ctx, x, y, 12, a * 0.7, AZUL));
  texto(ctx, "DIMENSIÓN DE LA DISTRIBUCIÓN DE GALAXIAS", W / 2, yt - 30, 15 * KT + 4, `rgba(${AZUL},${0.9 * a})`, { alin: "center", esp: 4, peso: 600 });
  texto(ctx, "TAMAÑO DE LA ESFERA · MEGAPÁRSECS", W / 2, yb + 44, 12 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "center", esp: 3 });
  nota(ctx, "DATOS: SCRIMGEOUR ET AL. 2012 · WIGGLEZ", a);
};
const epiBandas = (ctx: Ctx, e: number) => {
  const a = eSuave(pr(e, 98.4, 1.0)) * (1 - eSuave(pr(e, 126.4, 1.6)));               // gone before the set is born (128)
  if (a <= 0.01) return;
  const x0 = W * 0.08, x1 = W * 0.92, p0 = -6, p1 = 26, X = (lg: number) => lerp(x0, x1, (lg - p0) / (p1 - p0)), yM = H * 0.6;
  trazo(ctx, [[x0, yM], [x1, yM]], RGB.crema, a * 0.6, 1.4);
  for (let q = p0; q <= p1; q++) { const big = q % 3 === 0; trazo(ctx, [[X(q), yM - (big ? 10 : 5)], [X(q), yM + (big ? 10 : 5)]], RGB.crema, a * 0.45, 1); if (big) texto(ctx, `10${sup(q)}`, X(q), yM + 36, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "center", esp: 1 }); }
  texto(ctx, "METROS", x1 + 18, yM + 5, 12 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { esp: 3 });
  const MPC = 3.086e22;
  const lista: [number, number, number, string, string, string][] = [
    [98.8, Math.log10(0.0068), Math.log10(0.109), "LA ANTENA", "0,68 – 10,9 CM", COBRE],
    [99.4, Math.log10(5e3), Math.log10(8e4), "LA COSTA, LA FRONTERA", "DE 5 A 80 KM", AMBAR],
    [107.5, Math.log10(12.6 / 0.7 * MPC), Math.log10(70 / 0.7 * MPC), "LAS GALAXIAS, AGRUPADAS", "HASTA ~100 MPC", AZUL],
  ];
  const brillo = eSuave(pr(e, 116.0, 1.0));
  lista.forEach(([tw, l0, l1, nom, ran, col], i) => {
    const ai = a * eSuave(pr(e, tw - 0.1, 0.5)), k = eOut(pr(e, tw - 0.1, 0.9));
    if (ai <= 0.01) return;
    const y = yM - 30 - i * 14, bx0 = X(l0), bx1 = lerp(bx0, X(l1), k);
    ctx.fillStyle = `rgba(${col},${0.7 * ai})`; ctx.fillRect(bx0, y - 7, Math.max(3, bx1 - bx0), 14);
    const pul = 0.6 + 0.4 * Math.sin(e * 3 + i);
    luz(ctx, bx0, y, 16 + 18 * brillo, ai * (0.8 + 0.4 * brillo * pul), col); luz(ctx, bx1, y, 16 + 18 * brillo, ai * (0.8 + 0.4 * brillo * pul), col);
    const lyy = H * 0.24 + i * 46;
    texto(ctx, nom, (bx0 + bx1) / 2, lyy, 15 * KT + 4, `rgba(${col},${0.95 * ai})`, { alin: "center", esp: 3, peso: 600 });
    texto(ctx, ran, (bx0 + bx1) / 2, lyy + 22, 12 * KT + 4, `rgba(${col},${0.85 * ai})`, { alin: "center", esp: 2 });
    trazo(ctx, [[(bx0 + bx1) / 2, lyy + 30], [(bx0 + bx1) / 2, y - 10]], col, ai * 0.35, 1);
  });
  // the heart, on its own ruler: time
  const ac = a * eSuave(pr(e, 102.8, 0.6)), yT = H * 0.8;
  if (ac > 0.01) {
    const T = (lg: number) => lerp(W * 0.3, W * 0.92, (lg + 1) / 6);
    trazo(ctx, [[W * 0.3, yT], [W * 0.92, yT]], RGB.crema, ac * 0.6, 1.4);
    for (let q = -1; q <= 5; q++) { trazo(ctx, [[T(q), yT - 8], [T(q), yT + 8]], RGB.crema, ac * 0.45, 1); texto(ctx, `10${sup(q)}`, T(q), yT + 34, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * ac})`, { alin: "center", esp: 1 }); }
    texto(ctx, "SEGUNDOS", W * 0.92 + 18, yT + 5, 12 * KT + 4, `rgba(${RGB.crema},${0.6 * ac})`, { esp: 3 });
    const k = eOut(pr(e, 103.0, 1.0)), b0 = T(Math.log10(80)), b1 = lerp(b0, T(Math.log10(8000)), k);
    ctx.fillStyle = `rgba(${ROJO},${0.7 * ac})`; ctx.fillRect(b0, yT - 27, Math.max(3, b1 - b0), 14);
    luz(ctx, b0, yT - 20, 16 + 18 * brillo, ac * 0.8, ROJO); luz(ctx, b1, yT - 20, 16 + 18 * brillo, ac * 0.8, ROJO);
    texto(ctx, "EL CORAZÓN · DE MINUTOS A HORAS", (b0 + T(Math.log10(8000))) / 2, yT - 42, 14 * KT + 4, `rgba(${ROJO},${0.95 * ac})`, { alin: "center", esp: 3, peso: 600 });
    texto(ctx, "EN EL TIEMPO", W * 0.2, yT + 6, 15 * KT + 4, `rgba(${RGB.crema},${0.8 * ac})`, { alin: "center", esp: 4 });
  }
  // mathematics: a band with no edges, on «La matemática, en cambio…»
  const am = a * eSuave(pr(e, 124.2, 1.0));
  if (am > 0.01) {
    const y = H * 0.12, g = ctx.createLinearGradient(0, 0, W, 0), ext = eOut(pr(e, 124.2, 2.5));
    g.addColorStop(0, `rgba(${AMBAR},0)`); g.addColorStop(0.5 - 0.42 * ext, `rgba(${AMBAR},${0.55 * am})`); g.addColorStop(0.5 + 0.42 * ext, `rgba(${AMBAR},${0.55 * am})`); g.addColorStop(1, `rgba(${AMBAR},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, y - 7, W, 14);
    texto(ctx, "LA MATEMÁTICA · SIN BORDES", W / 2, y - 18, 16 * KT + 4, `rgba(${AMBAR},${0.95 * am})`, { alin: "center", esp: 4, peso: 600 });
  }
};
// a live fractal into a rectangle (the teaser's renderer): Mandelbrot, or Julia when j is given
type VF = { cx: number; cy: number; ancho: number; j?: [number, number]; pal: number; fase: number; tiempo?: number; maxIt?: number; interior?: number };
const frac = (ctx: Ctx, x: number, y: number, w: number, h: number, V: VF, alfa = 1) => {
  const pw = Math.max(8, Math.round(w)), ph = Math.max(8, Math.round(h));
  const l = pintarFractalTeaser(pw, ph, { cx: V.cx, cy: V.cy, esc: V.ancho / Math.min(pw, (ph * 16) / 9), rot: 0, julia: V.j, modo: 0, lente: 1e9, fase: V.fase, paleta: PALETAS[V.pal], brillo: 0.95, maxIt: V.maxIt ?? (V.j ? 300 : Math.round(250 + 160 * Math.log10(2.8 / V.ancho))), tiempo: V.tiempo ?? 0, interior: V.interior });
  ctx.save(); ctx.globalAlpha = alfa; ctx.imageSmoothingEnabled = true; ctx.drawImage(l, x, y, w, h); ctx.restore();
};
// F · the flower becomes a fractal, the title, the credits ─────────────────────────────────────────────────────────
const T_TIT = 336.0, T_CRED = 344.5, T_ROLL = 402.0, T_REDES = 401.2, T_SUELTA = 413.75, T_FIN = 437.0;
// the flower's place in the set: a Julia set walks along the border while it opens (c moves; the world changes)
const juliaC = (e: number): [number, number] => { const u = (e - 329.0) * 0.18; return [-0.75 + 0.36 * Math.cos(u * 2.4 + 1.9) * 0.6 - 0.05, 0.12 + 0.5 * Math.sin(u * 1.7 + 0.4) * 0.6]; };
const epiFlor = (ctx: Ctx, e: number) => {
  if (e < 329.0 || e > T_TIT + 0.6) return;
  const a = eSuave(pr(e, 329.0, 4.0)) * (1 - eSuave(pr(e, T_TIT - 0.25, 0.4)));
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  frac(ctx, 0, 0, W, H, { cx: 0, cy: 0, ancho: lerp(5.5, 3.1, eOut(pr(e, 329.0, 7.0))), j: juliaC(e), pal: 2, fase: 0.08 * e, tiempo: e }, a * 0.85);
  ctx.restore();
  const fl = eSuave(pr(e, T_TIT - 0.5, 0.5)) * (1 - eSuave(pr(e, T_TIT, 0.5)));          // the flash of the hit
  if (fl > 0.01) { ctx.fillStyle = `rgba(255,244,222,${(TRAILER ? 0.4 : 0.9) * fl})`; ctx.fillRect(0, 0, W, H); }
};
let capaT: HTMLCanvasElement | null = null, capaL: HTMLCanvasElement | null = null;
// each letter, its own place on the border of the set (seahorse, elephant, a dendrite, a spiral, Feigenbaum's point…)
const LETRA_V: [number, number, number][] = [[-0.7436447860, 0.1318252536, 0.006], [0.2925, 0.0149, 0.03], [-0.10109636, 0.95628651, 0.05], [-0.77568377, 0.13646737, 0.004],
  [-1.40115519, 0.0, 0.004], [-1.7687, 0.0017, 0.01], [-0.16070135, 1.0375665, 0.02], [-1.25066, 0.02012, 0.006], [-0.7473, 0.1102, 0.03], [0.3245, 0.0425, 0.02]];
const epiTitulo = (ctx: Ctx, e: number) => {
  if (e < T_TIT - 0.2 || e > T_CRED + 1.5) return;
  const a = eSuave(pr(e, T_TIT, 0.25)) * (1 - eSuave(pr(e, T_CRED - 0.5, 1.6)));
  if (a <= 0.01) return;
  const u = e - T_TIT, z = 1.0 + 0.04 * u, y = H * 0.5;
  if (!capaT) { capaT = document.createElement("canvas"); capaT.width = W; capaT.height = H; capaL = document.createElement("canvas"); capaL.width = W; capaL.height = H; }
  const c = capaT.getContext("2d")!, cl_ = capaL!.getContext("2d")!;
  c.clearRect(0, 0, W, H);
  const tam = 118 * KT, esp = 16;
  c.font = `700 ${tam}px "${SANS}"`; (c as unknown as { letterSpacing: string }).letterSpacing = "0px";
  const txt = "LA FRONTERA", anchos = [...txt].map((ch) => c.measureText(ch).width);
  const total = anchos.reduce((s1, w0) => s1 + w0, 0) + esp * (txt.length - 1);
  let x = W / 2 - total / 2;                                                                 // centred, and it stays still
  // every letter its own world: a Julia set that keeps changing, inside the glyph
  [...txt].forEach((ch, i) => {
    const wch = anchos[i] + esp;
    if (ch !== " ") {
      cl_.clearRect(0, 0, W, H); cl_.globalCompositeOperation = "source-over";
      const [vx, vy, va] = LETRA_V[i % LETRA_V.length];
      frac(cl_, x - 20, y - tam, wch + 40, tam * 1.3, { cx: vx, cy: vy, ancho: 7 * va * Math.exp(-0.18 * u), pal: i % 4, fase: 0.12 * e + i * 0.37, tiempo: e });
      cl_.globalCompositeOperation = "lighter";
      cl_.fillStyle = "rgba(160,140,180,0.3)"; cl_.fillRect(x - 20, y - tam, wch + 40, tam * 1.3);          // a faint floor: no letter goes dark
      cl_.globalCompositeOperation = "source-over";
      cl_.globalCompositeOperation = "destination-in";
      texto(cl_, ch, x, y, tam, "#fff", { fam: SANS, peso: 700, alin: "left", esp: 0 });
      c.drawImage(capaL!, 0, 0);
    }
    x += wch;
  });
  // the subtitle, filled with the set itself diving
  const as = eSuave(pr(u, 1.2, 1.2));
  if (as > 0.01) {
    cl_.clearRect(0, 0, W, H); cl_.globalCompositeOperation = "source-over";
    frac(cl_, 0, y + 30, W, 90, { cx: -0.10109636, cy: 0.95628651, ancho: 0.06 * Math.exp(-0.25 * u), pal: 2, fase: 0.06 * e, tiempo: e });
    cl_.globalCompositeOperation = "lighter";
    cl_.fillStyle = "rgba(150,130,170,0.2)"; cl_.fillRect(0, y + 30, W, 90);
    cl_.globalCompositeOperation = "source-over";
    cl_.globalCompositeOperation = "destination-in";
    texto(cl_, "FRACTALES: LA GEOMETRÍA DEL INFINITO", W / 2 + 6, y + 90, 34 * KT + 8, "#fff", { fam: SANS, peso: 700, alin: "center", esp: 10 });
    ctx.save(); ctx.globalAlpha = a * as; c.globalAlpha = 1; ctx.drawImage(capaL!, 0, 0); ctx.restore();
  }
  ctx.save(); ctx.translate(W / 2, y); ctx.scale(z, z); ctx.translate(-W / 2, -y);              // the whole title comes slowly closer
  ctx.globalAlpha = a; ctx.drawImage(capaT, 0, 0);
  ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a * 0.3; ctx.filter = "blur(14px)"; ctx.drawImage(capaT, 0, 0); ctx.restore();
  const ab = eSuave(pr(u, 2.6, 1.2));
  DEJA_TEXTO = TRAILER;
  if (ab > 0.01) texto(ctx, "UN DOCUMENTAL DE B&N LECTURES", W / 2 + 6, H * 0.78, 16 * KT + 4, `rgba(${AMBAR},${0.9 * a * ab})`, { alin: "center", esp: 10 });
  DEJA_TEXTO = false;
};
// the credits: [kind, text] · h heading, n name, p work, b gap
const CREDITOS: [string, string][] = [
  ["h", "UN DOCUMENTAL DE"], ["n", "B&N LECTURES"], ["b", ""],
  ["h", "IDEA, GUION Y DIRECCIÓN"], ["n", "NICOLÁS MORENO"], ["h", "ANIMACIÓN Y SIMULACIONES"], ["n", "NICOLÁS MORENO"], ["h", "MÚSICA ORIGINAL"], ["n", "NICOLÁS MORENO"], ["h", "NARRACIÓN"], ["p", "VOZ SINTÉTICA"], ["b", ""],
  ["h", "AGRADECIMIENTOS"], ["n", "BENJAMÍN CAMPOS"], ["n", "NICOLÁS RICHARDSON"], ["p", "POR SU APOYO EN TODO EL DESARROLLO DEL DOCUMENTAL"], ["b", ""],
  ["h", "FRACTALES CALCULADOS"], ["p", "CONJUNTOS DE MANDELBROT Y DE JULIA · CURVA DE KOCH · TRIÁNGULO DE SIERPIŃSKI"], ["p", "HELECHO DE BARNSLEY · CONJUNTO DE CANTOR · MAPA LOGÍSTICO · SISTEMA DE LORENZ"], ["b", ""],
  ["h", "SIMULACIONES PROPIAS"], ["p", "AGREGACIÓN LIMITADA POR DIFUSIÓN · EROSIÓN · COLONIZACIÓN DEL ESPACIO"], ["p", "RED CÓSMICA · MICROCOSMOS INSPIRADO EN HAECKEL · CÁMARA DE BURBUJAS · LA TIERRA"], ["b", ""],
  ["h", "DATOS"], ["p", "PHYSIONET · GOLDBERGER Y OTROS, 2000 · NSR2DB, CHF2DB, CINC CHALLENGE 2016"], ["p", "NATURAL EARTH · WIGGLEZ DARK ENERGY SURVEY · ILLUSTRISTNG COLLABORATION"], ["b", ""],
  ["h", "LA MATEMÁTICA"], ["p", "PIERRE FATOU · GASTON JULIA · BENOIT MANDELBROT · ADRIEN DOUADY · JOHN H. HUBBARD"], ["p", "TAN LEI · MITSUHIRO SHISHIKURA · HELGE VON KOCH · WACŁAW SIERPIŃSKI · MICHAEL BARNSLEY"], ["b", ""],
  ["h", "LA MEDIDA"], ["p", "LEWIS FRY RICHARDSON, 1961 · BENOIT MANDELBROT, 1967"], ["b", ""],
  ["h", "CÓMO CRECE UNA FORMA"], ["p", "WITTEN Y SANDER, 1981 · CHOPARD, HERRMANN Y VICSEK, 1991 · RODRÍGUEZ-ITURBE Y RINALDO"], ["p", "RUNIONS, LANE Y PRUSINKIEWICZ, 2005 Y 2007 · LIBBRECHT, 2005"], ["b", ""],
  ["h", "EL CORAZÓN"], ["p", "PENG Y OTROS, 1995 · IVANOV Y OTROS, 1999 · KLEIGER Y OTROS, 1987 · LIPSITZ Y GOLDBERGER, 1992"], ["b", ""],
  ["h", "EL CAOS"], ["p", "EDWARD LORENZ, 1963 · ROBERT MAY, 1976 · MITCHELL FEIGENBAUM, 1978 · LIBCHABER, LAROCHE Y FAUVE, 1982"], ["b", ""],
  ["h", "LAS HERRAMIENTAS"], ["p", "NATHAN COHEN · CARLES PUENTE Y OTROS, 1996 · FOURNIER, FUSSELL Y CARPENTER, 1982"], ["b", ""],
  ["h", "LA ESTRUCTURA"], ["p", "VAZZA Y FELETTI, 2020 · SCRIMGEOUR Y OTROS, 2012 · COLLESS Y OTROS, 2003 · PIETRONERO, 1987"], ["b", ""],
  ["h", "EL LENGUAJE"], ["p", "GALILEO GALILEI, 1623 · EUGENE WIGNER, 1960 · GOTTFRIED W. LEIBNIZ, 1714"], ["b", ""],
  ["h", "IMÁGENES DE ARCHIVO"], ["p", "NASA · ESA/HUBBLE · ESA/WEBB · ESA Y LA COLABORACIÓN PLANCK · ESO · NOAA · NASA/JPL-CALTECH"], ["p", "NASA EARTH OBSERVATORY · ISS CREW EARTH OBSERVATIONS · ILLUSTRISTNG · WIKIMEDIA COMMONS"], ["p", "OPTOMETRUSPRIME · OSMO LUNDELL · MATT MING · MIKEROSCOPY · BRANDON SEAH · ROHITJAHNAVI"], ["p", "ERNST HAECKEL, KUNSTFORMEN DER NATUR, 1904"], ["b", ""],
  ["h", "VIDEOS DE ARCHIVO"], ["p", "PEXELS · ESO/J. COLOSIMO · NASA SCIENTIFIC VISUALIZATION STUDIO"], ["b", ""], ["b", ""],
  ["h", "LA FRONTERA"], ["p", "FRACTALES: LA GEOMETRÍA DEL INFINITO"], ["p", "LECTURES.BNSOLUTIONS.CL · 2026"],
];
const ALTO: Record<string, number> = { h: 46, n: 64, p: 40, b: 56 };
const ALTO_TOTAL = CREDITOS.reduce((s0, [k]) => s0 + ALTO[k], 0);
// the credits' background: one Julia set, zoomed into slowly while its constant walks along the border of the
// Mandelbrot set, so its shape keeps changing, and its colours drift (as the Julia sets of the opening); no flashes
// v5: a constant in the seahorse valley, so the Julia set is spirals everywhere; it walks a small slow circle
const juliaCred = (e: number): [number, number] => {
  const a = 0.6 + (e - T_CRED) * 0.06;                                                    // v6: a wider, livelier walk
  return [-0.8 + 0.022 * Math.cos(a), 0.156 + 0.022 * Math.sin(a)];             // spirals with no interior: filaments everywhere
};
// its repelling fixed point β = (1 + √(1 − 4c)) / 2 lies on the Julia set for every c: zooming there never runs out
const betaJ = ([cr, ci]: [number, number]): [number, number] => {
  const ar = 1 - 4 * cr, ai = -4 * ci, m = Math.hypot(ar, ai), sr = Math.sqrt((m + ar) / 2), si = Math.sign(ai || 1) * Math.sqrt((m - ar) / 2);
  return [(1 + sr) / 2, si / 2];
};
// the other fixed point, α = (1 − √(1 − 4c)) / 2: where the spirals of this set meet; zooming there turns forever
const alfaJ = ([cr, ci]: [number, number]): [number, number] => { const [br, bi] = betaJ([cr, ci]); return [1 - br, -bi]; };
// the trailer's ending (--props '{"trailer":true}'): after the title, over the same background, the card
// «ESTRENO · 7 DE NOVIEMBRE · EN YOUTUBE · @bnlectures» instead of the credits, and then the mark (its charges are small Julia sets)
let TRAILER = false;
export const ponTrailer = (b: boolean) => { TRAILER = b; ponCargasFractales(b); };
const T_CARTEL = 5.6;                                                                       // the card's length
const C0 = T_CRED + 1.3;                                                                    // the card waits for the title to be gone
const sueltaE = () => (TRAILER ? C0 + T_CARTEL + 3.8 : T_SUELTA);
const finE = () => (TRAILER ? sueltaE() + 11.0 : T_FIN);
const YT_PANTALLA = typeof Path2D !== "undefined" ? new Path2D("M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17") : null;
const YT_PLAY = typeof Path2D !== "undefined" ? new Path2D("m10 15 5-3-5-3z") : null;
const cartel = (ctx: Ctx, e: number) => {
  const a = eSuave(pr(e, C0, 0.7)) * (1 - eSuave(pr(e, C0 + T_CARTEL - 0.7, 0.7)));
  if (a <= 0.01) return;
  const linea = (s: string, y: number, tam: number, col: string, fam: string, peso: number, esp: number, al: number, x = W / 2, alin: CanvasTextAlign = "center") => {
    ctx.save(); ctx.font = `${peso} ${tam}px "${fam}"`; (ctx as unknown as { letterSpacing: string }).letterSpacing = `${esp}px`; ctx.textAlign = alin;
    ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(14px)"; ctx.fillStyle = `rgba(${col},${0.35 * al})`; ctx.fillText(s, x + (alin === "center" ? esp / 2 : 0), y);
    ctx.globalCompositeOperation = "source-over"; ctx.filter = "none"; ctx.fillStyle = `rgba(${col},${0.97 * al})`; ctx.fillText(s, x + (alin === "center" ? esp / 2 : 0), y); ctx.restore();
  };
  const y0 = H * 0.46;
  linea("ESTRENO", y0 - 110, 22, AMBAR, MONO, 500, 14, a);
  linea("7 DE NOVIEMBRE", y0, 84, RGB.crema, SANS, 300, 22, a);
  const ay = a * eSuave(pr(e, C0 + 0.4, 0.6));
  ctx.save(); ctx.font = `500 24px "${MONO}"`; (ctx as unknown as { letterSpacing: string }).letterSpacing = "14px";
  const wTxt = ctx.measureText("EN YOUTUBE").width; ctx.restore();
  const tamI = 2.8, wIco = 24 * tamI, sep = 18, x0 = W / 2 - (wIco + sep + wTxt) / 2;
  if (YT_PANTALLA && YT_PLAY) {
    ctx.save(); ctx.translate(x0, y0 + 70 - 12 * tamI); ctx.scale(tamI, tamI); ctx.globalAlpha = ay;
    ctx.shadowColor = "rgba(255,40,40,0.55)"; ctx.shadowBlur = 16; ctx.fillStyle = "#FF0000"; ctx.fill(YT_PANTALLA);
    ctx.shadowBlur = 0; ctx.fillStyle = "#FFFFFF"; ctx.fill(YT_PLAY); ctx.restore();
  }
  linea("EN YOUTUBE", y0 + 78, 24, AMBAR, MONO, 500, 14, ay, x0 + wIco + sep, "left");
  linea("@bnlectures", y0 + 150, 44, RGB.crema, SANS, 600, 4, a * eSuave(pr(e, C0 + 0.7, 0.6)));
};
const epiCreditos = (ctx: Ctx, e: number, f: Fotos) => {
  if (e < T_CRED - 1.5) return;
  const a = eSuave(pr(e, T_CRED - 1.0, 1.6));
  const T_SUELTA = sueltaE(), T_FIN = finE();
  const af = a * (1 - (TRAILER ? 0.55 : 1) * eSuave(pr(e, T_SUELTA - 5.0, 8.0)));                                  // the fractals go out under the mark
  if (af > 0.01) {
    const s0 = Math.max(0, e - T_CRED);
    // the zoom: toward the repelling fixed point β, where the set repeats itself at every scale; ~2·10⁴ × over the roll
    const c0 = juliaCred(e), b = alfaJ(c0), u0 = 1, anc = 1.5 * Math.exp(-0.17 * s0);           // centred from the first frame
    frac(ctx, 0, 0, W, H, { cx: b[0] * u0, cy: b[1] * u0, ancho: anc, j: c0, pal: 2, fase: 0.018 * s0, tiempo: e, maxIt: Math.round(320 + 140 * Math.log10(3.2 / anc)) }, af * 0.5);
    ctx.fillStyle = `rgba(2,3,6,${0.38 * af})`; ctx.fillRect(0, 0, W, H);
  }
  if (TRAILER) cartel(ctx, e);
  // the roll: constant speed, every line goes out at the top
  const desp = (H + 80 + ALTO_TOTAL) * pr(e, T_CRED, T_ROLL - T_CRED);
  let y = H + 40 - desp;
  for (const [k, txt] of TRAILER ? [] : CREDITOS) {
    if (y > -60 && y < H + 60 && txt) {
      const ay = a * Math.min(1, Math.min(y, H - y) / 140);
      if (k === "h") texto(ctx, txt, W / 2, y, 15 * KT + 4, `rgba(${AMBAR},${0.95 * ay})`, { alin: "center", esp: 6 });
      else if (k === "n") { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(10px)"; texto(ctx, txt, W / 2, y, 34 * KT + 8, `rgba(${RGB.crema},${0.35 * ay})`, { fam: SANS, peso: 600, alin: "center", esp: 6 }); ctx.restore(); texto(ctx, txt, W / 2, y, 34 * KT + 8, `rgba(${RGB.crema},${0.97 * ay})`, { fam: SANS, peso: 600, alin: "center", esp: 6 }); }
      else texto(ctx, txt, W / 2, y, 16 * KT + 5, `rgba(${RGB.crema},${0.9 * ay})`, { alin: "center", esp: 3 });
    }
    y += ALTO[k];
  }
  // where to find us: B&N Lectures, its links, and the author (after the roll, before the mark)
  const ar = TRAILER ? 0 : eSuave(pr(e, T_REDES, 1.2)) * (1 - eSuave(pr(e, T_SUELTA - 4.6, 1.0)));
  if (ar > 0.01) {
    const yr = H * 0.2 + 18 * (1 - eOut(pr(e, T_REDES, 1.6)));
    texto(ctx, "SIGUE A B&N LECTURES", W / 2, yr, 15 * KT + 4, `rgba(${AMBAR},${0.95 * ar})`, { alin: "center", esp: 8 });
    const redes: [string, string][] = [["YOUTUBE", "@bnlectures"], ["INSTAGRAM", "@bnsolutions.cl"], ["FACEBOOK", "bnsolutions.cl"], ["LINKEDIN", "B&N Solutions"]];
    redes.forEach(([red, cuenta], i) => {
      const ai = ar * eSuave(pr(e, T_REDES + 0.25 + i * 0.18, 0.8)), yy = yr + 70 + i * 54;
      texto(ctx, red, W / 2 - 24, yy, 15 * KT + 4, `rgba(${RGB.crema},${0.6 * ai})`, { alin: "right", esp: 6 });
      texto(ctx, cuenta, W / 2 + 24, yy, 26 * KT + 6, `rgba(${RGB.crema},${0.97 * ai})`, { fam: SANS, peso: 600, alin: "left", esp: 2 });
    });
    const aw = ar * eSuave(pr(e, T_REDES + 1.2, 0.8));
    texto(ctx, "LECTURES.BNSOLUTIONS.CL  ·  BNSOLUTIONS.CL/LECTURES", W / 2, yr + 330, 17 * KT + 5, `rgba(${AMBAR},${0.9 * aw})`, { alin: "center", esp: 5 });
    const an = ar * eSuave(pr(e, T_REDES + 1.8, 0.9));
    texto(ctx, "NICOLÁS MORENO", W / 2, yr + 440, 15 * KT + 4, `rgba(${RGB.crema},${0.6 * an})`, { alin: "center", esp: 8 });
    texto(ctx, "INSTAGRAM  @4mser", W / 2, yr + 484, 24 * KT + 6, `rgba(${RGB.crema},${0.95 * an})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
  }
  // the mark forms, as at the end of bnsolutions.cl/lectures
  if (e > T_SUELTA - 3.8) dibujarLogo(ctx, W, H, e - T_SUELTA, f.marca, CONTORNOS as unknown as number[][][], 1 - eSuave(pr(e, T_FIN - 3.5, 3.0)));
};
const epilogo = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < EPI.inicio) return;
  // v3: the retina was shortened; everything after it plays EPI.salto seconds earlier (e = the script's time)
  const e0 = t - EPI.inicio, e = e0 < EPI.corte ? e0 : e0 + EPI.salto;
  clip(ctx, f.vid_ojo ?? f.vid_epiB ?? f.vid_epiD ?? f.vid_epiC, e < 331.0 ? 1 : 0);
  epiCurva(ctx, e);
  epiBandas(ctx, e);
  epiFlor(ctx, e);
  epiTitulo(ctx, e);
  epiCreditos(ctx, e, f);
  // credits of the archive, as in the rest of the film (fractales/material-prologo/PROCEDENCIA.md, FUENTES-capitulo-8.md)
  const CRED: [number, number, string][] = [
    [4.0, 13.5, "IRIS: OSMO LUNDELL, CC BY-SA"], [16.5, 33.5, "RETINA: OPTOMETRUSPRIME, CC BY-SA 2.0"],
    [41.6, 45.3, "SIMULACIÓN PROPIA DE EROSIÓN (CAPÍTULO IV)"], [69.8, 71.4, "SIMULACIÓN PROPIA: VASOS QUE CRECEN HACIA EL OXÍGENO (CAPÍTULO IV)"],
    [74.8, 78.4, "M101: EUROPEAN SPACE AGENCY & NASA · CC BY 4.0"],
    [175.6, 181.0, "PARANAL: ESO/J. COLOSIMO · CC BY 4.0"], [181.3, 189.3, "PRIMER CAMPO PROFUNDO DEL WEBB: NASA, ESA, CSA Y STSCI"],
    [192.9, 195.2, "SIMULACIÓN PROPIA: PARTÍCULAS EN UN CAMPO MAGNÉTICO"], [200.7, 206.5, "PALE BLUE DOT REVISITED: NASA/JPL-CALTECH"],
    [215.1, 224.5, "NEBULOSA DEL CANGREJO: NASA, ESA, J. HESTER Y A. LOLL · CC BY 4.0"], [251.5, 258.3, "LA LUZ MÁS ANTIGUA: ESA Y LA COLABORACIÓN PLANCK"],
    [258.7, 268.0, "RECREACIÓN CON MAPAS DE NASA: BLUE MARBLE Y BLACK MARBLE 2016"], [272.4, 276.6, "LATIDOS REALES DE UN CORAZÓN SANO · PHYSIONET"],
    [276.9, 284.3, "M74: NASA, ESA, ROBERT GENDLER Y DIGITIZED SKY SURVEY 2 · CC BY 4.0"], [284.7, 290.5, "CAMPO ULTRA PROFUNDO DEL HUBBLE: NASA, ESA, H. TEPLITZ Y M. RAFELSKI · CC BY 4.0"],
  ];
  for (const [a0, a1, txt] of CRED) { const av = ventana(e, a0, a1, 0.5); if (av > 0.01) nota(ctx, txt, av); }
};

export const dibujarCap10 = (ctx: Ctx, t: number, frame: number, fotos: Fotos) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  oscuro(ctx, t);
  regresos(ctx, t, fotos);
  titulo(ctx, t);
  viaje(ctx, t, fotos);
  if (EPI.activo) epilogo(ctx, t, fotos);                   // the definitive epilogue replaces the turn and the end of v1
  else { giro(ctx, t, fotos); final(ctx, t); }
  const TOTAL = EPI.activo ? EPI.fin : K.total;
  const fin = eSuave(pr(t, TOTAL - 1.2, 1.2)), ini = 1 - eSuave(pr(t, 0, 0.6));
  if (fin + ini > 0) { ctx.fillStyle = `rgba(2,3,6,${Math.min(1, fin + ini)})`; ctx.fillRect(0, 0, W, H); }
  let golpe = 0;
  for (const g of [K.titulo, K.mandel, K.nombre]) if (t >= g && t - g < 1.5) golpe = Math.max(golpe, 0.9 * Math.exp(-(t - g) * 3));
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.92, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: golpe * 0.4, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
