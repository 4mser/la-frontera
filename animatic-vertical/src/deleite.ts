// LA FRONTERA · «Deleite»: the musical finale before the title. No voice, the desert-epic score, the teaser's look and
// the opening's language: full-screen living fractals, several scenes at once through clipping masks (lenses, a
// diagonal split, a triptych, a kaleidoscope, a hexagon, a mosaic), each with its own camera, and fractal life.
// Part 1 (60 beats at 100 BPM):
//   1 · LENSES     Multibrot breathing z²→z⁶; a lens opens on the Burning Ship, a lens inside it on Lyapunov;
//                  the lens grows into the frame.
//   2 · DIAGONAL   the Burning Ship dives; a glowing diagonal cuts in the Celtic set, turning; it takes the frame.
//   3 · TRIPTYCH   Newton (turning) · Phoenix (transforming) · Magnet (diving); the middle panel opens.
//   4 · LIFE       over a dimmed Julia, a fractal millipede glides across.
//   5 · KALEIDO    six mirrors of the Spider; a hexagon at the centre holds a Clifford attractor that morphs and
//                  takes the frame, turning into De Jong.
//   6 · MOSAIC     nine worlds light up from the centre out; the grid closes on the centre; the last hit.
import D from "./deleite.json";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS } from "./fractalTeaser";
import { pintarMulti } from "./multiFractal";
import { clifford, dejong, milpies } from "./vida";
import { B1, dibujarGeo } from "./geoV1";
import { filotaxis, foto, planta } from "./naturaleza";
import { bifurcacion, celdaHija, henon, lorenz, telarana } from "./caos";
import { dibujarLoco } from "./loco";
import { RGB, MONO, cl, eIO, eOut, eSuave, lerp, num, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
type P = [number, number];
const TAU = Math.PI * 2;
const SS = 2;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.032, vineta: 0.62, grano: 0.05, scan: 0.2, ruido: 0.6, grade: 1.8 };

const BEAT = 60 / D.bpm;
export const B = (k: number) => D.t0 + k * BEAT;
const kb = (t: number) => (t - D.t0) / BEAT;
const resorte = (x: number, w = 16) => (x <= 0 ? 0 : 1 - (1 + w * x) * Math.exp(-w * x));
const R = (t: number, k: number, w = 16) => resorte(t - B(k) + 0.05, w);

export const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  ctx.font = `${op.peso ?? 400} ${tam}px "${op.fam ?? MONO}"`;
  ctx.fillStyle = color;
  ctx.textAlign = op.alin ?? "left";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 0}px`;
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};

// ─── views: a fractal and its camera as a function of t ────────────────────────────────────────────────────────
export type Vista = { regla: number; cx: number; cy: number; ancho: number; rot?: number; julia?: [number, number]; pot?: number; pal: number; fase?: number; maxIt?: number; fondo?: number; brillo?: number };
export const pinta = (ctx: Ctx, x: number, y: number, w: number, h: number, V: Vista, alfa = 1, t = 0) => {
  if (w < 2 || h < 2 || alfa <= 0.005) return;
  const pw = Math.max(8, Math.round(w * SS)), ph = Math.max(8, Math.round(h * SS));
  const l = pintarMulti(pw, ph, { cx: V.cx, cy: V.cy, esc: V.ancho / Math.min(pw, (ph * 16) / 9), rot: V.rot ?? 0, julia: V.julia, regla: V.regla, pot: V.pot, fase: V.fase ?? 0.04 * t, paleta: PALETAS[V.pal], maxIt: V.maxIt ?? 400, tiempo: t, fondo: V.fondo ?? 0.38, brillo: V.brillo });
  ctx.save(); ctx.globalAlpha = alfa; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(l, x, y, w, h); ctx.restore();
};
// a dive toward a point: the log-zoom eases in, then runs steadily
const buceo = (t: number, k0: number, k1: number, z: number) => { const u = cl((kb(t) - k0) / (k1 - k0)); return Math.exp(Math.log(z) * (0.25 * eIO(u) + 0.75 * u)); };
const V = {
  multibrot: (t: number): Vista => ({ regla: 3, pot: 2 + 4 * eIO(cl(kb(t) / 10)), cx: 0, cy: 0, ancho: lerp(3.6, 2.9, cl(kb(t) / 10)), rot: 0.05 * (t - B(0)), pal: 0, maxIt: 260 }),
  barco: (t: number): Vista => ({ regla: 1, cx: -1.7621, cy: -0.028, ancho: 0.16 / buceo(t, 2, 18, 9), pal: 2, maxIt: 500 }),
  lyapunov: (t: number): Vista => ({ regla: 13, cx: 3.42, cy: 3.05, ancho: 0.55 / (1 + 0.15 * Math.max(0, kb(t) - 6)), pal: 1 }),
  celtic: (t: number): Vista => ({ regla: 4, cx: -1.45, cy: 0.28, ancho: 0.9 / buceo(t, 10, 28, 1.6), rot: -0.06 * (t - B(10)), pal: 1, maxIt: 400 }),
  newton: (t: number): Vista => ({ regla: 8, cx: 0, cy: 0, ancho: 2.6, rot: 0.12 * (t - B(18)), pal: 2 }),
  phoenix: (t: number): Vista => ({ regla: 7, cx: 0, cy: 0, ancho: 1.7, rot: Math.PI / 2, julia: [0.5667 + 0.03 * Math.sin(0.5 * (t - B(18))), -0.5 + 0.02 * Math.cos(0.4 * (t - B(18)))], pal: 1, maxIt: 400 }),
  magnet: (t: number): Vista => ({ regla: 10, cx: 1.4, cy: 0.0, ancho: 3.6 / buceo(t, 18, 28, 2.4), pal: 0, maxIt: 300 }),
  seno: (t: number): Vista => ({ regla: 12, cx: 0.4, cy: 0.2, ancho: 4.2 / (1 + 0.05 * Math.max(0, kb(t) - 40)), julia: [1, 0.3 + 0.02 * Math.sin(0.5 * (t - B(40)))], pal: 0, maxIt: 300 }),
  julia: (t: number): Vista => ({ regla: 0, cx: 0, cy: 0, ancho: 2.7 / (1 + 0.04 * Math.max(0, kb(t) - 28)), julia: [-0.7269 + 0.01 * Math.sin(0.3 * (t - B(28))), 0.1889], rot: 0.03 * (t - B(28)), pal: 1, maxIt: 500 }),
};
// the nine worlds of the mosaic (index 4, the centre, is the Mandelbrot set with Pickover stalks)
const MOSAICO: ((t: number) => Vista)[] = [
  (t) => ({ regla: 11, cx: 1, cy: 0, ancho: 4.5, rot: 0.05 * t, pal: 0 }),
  (t) => ({ regla: 14, cx: -0.45, cy: 0, ancho: 3.2, rot: 0.04 * t, pal: 1 }),
  (t) => ({ regla: 2, cx: -0.2, cy: 0, ancho: 4, rot: -0.04 * t, pal: 2 }),
  (t) => ({ regla: 5, cx: -0.5, cy: -0.4, ancho: 3.4, pal: 1 }),
  (t) => ({ regla: 15, cx: -0.7454, cy: 0.113, ancho: 0.02 / (1 + 0.4 * cl(kb(t) - 50)), pal: 0, maxIt: 700 }),
  (t) => ({ regla: 6, cx: -0.5, cy: 0, ancho: 3.4, pal: 2 }),
  (t) => ({ regla: 9, cx: -0.3, cy: 0, ancho: 2.2, pal: 0 }),
  (t) => ({ regla: 0, cx: 0, cy: 0, ancho: 3.1, julia: [-0.8 + 0.04 * Math.cos(t), 0.156], pal: 1 }),
  (t) => ({ regla: 3, pot: 3, cx: 0, cy: 0, ancho: 2.8, rot: 0.1 * t, pal: 2 }),
];
const NOMBRES_MOSAICO = ["LAMBDA", "ARAÑA", "TRICORNIO", "BÚFALO", "TALLOS DE PICKOVER", "PERPENDICULAR", "NOVA", "JULIA", "z³ + c"];

// ─── drawing helpers ──────────────────────────────────────────────────────────────────────────────────────────────
export const anillo = (ctx: Ctx, camino: () => void, a: number, w = 2.4) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(255,226,190,${0.12 * a})`; ctx.lineWidth = w * 6; ctx.beginPath(); camino(); ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(${RGB.crema},${0.85 * a})`; ctx.lineWidth = w; ctx.beginPath(); camino(); ctx.stroke(); ctx.restore();
};
export const recorta = (ctx: Ctx, camino: () => void, dibujo: () => void) => { ctx.save(); ctx.beginPath(); camino(); ctx.clip(); dibujo(); ctx.restore(); };
const etiqueta = (ctx: Ctx, s: string, x: number, y: number, a: number, alin: CanvasTextAlign = "left") => {
  if (a > 0.01) texto(ctx, s, x, y, 15, `rgba(${RGB.crema},${0.8 * a})`, { alin, esp: 3 });
};
const oscurece = (ctx: Ctx, a: number) => { if (a > 0.005) { ctx.fillStyle = `rgba(2,3,6,${Math.min(1, a)})`; ctx.fillRect(0, 0, W, H); } };
const hexagono = (ctx: Ctx, cx: number, cy: number, r: number, rot = 0) => { for (let i = 0; i < 6; i++) { const a = rot + (i * TAU) / 6; if (i) ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); else ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); } ctx.closePath(); };

type Res = { rotulo: string; formula: string; hud: string[] };

// ─── 1 · lenses ───────────────────────────────────────────────────────────────────────────────────────────────────
const lentes = (ctx: Ctx, t: number): Res => {
  const k = kb(t);
  const vm = V.multibrot(t);
  pinta(ctx, 0, 0, W, H, vm, 1, t);
  // lens 1 opens on beat 3 (the Burning Ship); from beat 8.4 it grows to cover the frame
  const crece = eIO(cl((k - 8.4) / 1.6));
  const r1 = H * 0.27 * R(t, 3, 12) * lerp(1, Math.hypot(W, H) / (H * 0.54) + 0.1, crece);
  const c1: P = [lerp(W * 0.64, W / 2, crece), lerp(H * 0.46, H / 2, crece)];
  if (r1 > 2) {
    recorta(ctx, () => ctx.arc(c1[0], c1[1], r1, 0, TAU), () => pinta(ctx, 0, 0, W, H, V.barco(t), 1, t));
    // lens 2, inside lens 1: Lyapunov
    const r2 = H * 0.14 * R(t, 6, 14) * (1 - eIO(cl((k - 8.2) / 0.8)));
    const c2: P = [c1[0] + r1 * 0.42, c1[1] - r1 * 0.38];
    if (r2 > 2) {
      recorta(ctx, () => ctx.arc(c2[0], c2[1], r2, 0, TAU), () => pinta(ctx, c2[0] - r2, c2[1] - r2, 2 * r2, 2 * r2, V.lyapunov(t), 1, t));
      anillo(ctx, () => ctx.arc(c2[0], c2[1], r2, 0, TAU), 1, 1.6);
    }
    anillo(ctx, () => ctx.arc(c1[0], c1[1], r1, 0, TAU), 1 - crece);
  }
  const p = vm.pot ?? 2;
  if (k < 3) return { rotulo: "MULTIBROT · LA POTENCIA CRECE", formula: `z → z^${num(p, 2)} + c`, hud: [`POTENCIA ${num(p, 2)}`, "CENTRO 0 + 0i"] };
  if (k < 6) return { rotulo: "UNA LUPA SOBRE OTRA REGLA", formula: "z → (|x| + i|y|)² + c", hud: ["BURNING SHIP · LA ARMADA", `POTENCIA DEL FONDO ${num(p, 2)}`] };
  return { rotulo: "DENTRO DE LA LUPA, OTRA LUPA", formula: "xₙ₊₁ = r xₙ (1 − xₙ) · r = A A B A B", hud: ["EXPONENTE DE LYAPUNOV", "BURNING SHIP · LA ARMADA"] };
};

// ─── 2 · the diagonal ─────────────────────────────────────────────────────────────────────────────────────────────
const diagonal = (ctx: Ctx, t: number): Res => {
  const k = kb(t);
  pinta(ctx, 0, 0, W, H, V.barco(t), 1, t);
  // the line enters from the right on beat 11, rests past the middle, and sweeps across from beat 16.4
  const pos = lerp(W * 1.25, W * 0.62, R(t, 11, 9)) - W * 1.0 * eIO(cl((k - 16.4) / 1.6));
  const incl = H * 0.42;
  const camino = () => { ctx.moveTo(pos + incl, -10); ctx.lineTo(W * 2, -10); ctx.lineTo(W * 2, H + 10); ctx.lineTo(pos - incl, H + 10); ctx.closePath(); };
  if (pos - incl < W) {
    recorta(ctx, camino, () => pinta(ctx, 0, 0, W, H, V.celtic(t), 1, t));
    anillo(ctx, () => { ctx.moveTo(pos + incl, -10); ctx.lineTo(pos - incl, H + 10); }, 1, 2.2);
  }
  const a = R(t, 11, 9) * (1 - eSuave(cl((k - 16.4) / 1.2)));
  etiqueta(ctx, "BURNING SHIP", 72, H / 2, a);
  etiqueta(ctx, "CÉLTICO", W - 72, H / 2, a, "right");
  const z = 0.16 / V.barco(t).ancho;
  return { rotulo: "DOS REGLAS, UN CORTE", formula: "z → |Re z²| + i Im z² + c", hud: [`AUMENTO ×${Math.round(z * 20).toLocaleString("es-CL")}`, "BURNING SHIP / CÉLTICO"] };
};

// ─── 3 · the triptych ─────────────────────────────────────────────────────────────────────────────────────────────
const triptico = (ctx: Ctx, t: number): Res => {
  const k = kb(t);
  pinta(ctx, 0, 0, W, H, V.celtic(t), 1, t);
  oscurece(ctx, 0.55 * R(t, 18, 10));
  const g = 16, pw = (W - 4 * g) / 3;
  const abre = eIO(cl((k - 26) / 2));                          // the middle panel opens into the frame
  const vistas = [V.newton, V.phoenix, V.magnet], nombres = ["NEWTON · z³ − 1", "FÉNIX", "IMÁN I"];
  for (const i of [0, 2, 1]) {
    const e = R(t, 18 + 0.1 * i, 11);
    if (e <= 0.001) continue;
    let x = g + i * (pw + g), y = g, w = pw, h = H - 2 * g;
    const dy = (1 - e) * H * (i % 2 ? -1 : 1);
    if (i === 1) { x = lerp(x, 0, abre); y = lerp(y, 0, abre); w = lerp(w, W, abre); h = lerp(h, H, abre); }
    const vv = vistas[i](t);
    recorta(ctx, () => ctx.rect(x, y + dy, w, h), () => pinta(ctx, x, y + dy, w, h, { ...vv, ancho: vv.ancho * Math.max(w / W, h / H * 0.5625) * 2.2 }, i === 1 ? 1 : 1 - abre, t));
    anillo(ctx, () => ctx.rect(x, y + dy, w, h), (1 - abre) * e, 1.4);
    etiqueta(ctx, nombres[i], x + w / 2, y + dy + h - 30, e * (1 - abre), "center");
  }
  return { rotulo: "TRES REGLAS, TRES CÁMARAS", formula: "z → z − (z³ − 1) / 3z²", hud: ["NEWTON GIRA · FÉNIX MUTA · IMÁN SE HUNDE", "TRES MUNDOS A LA VEZ"] };
};

// ─── 4 · fractal life ─────────────────────────────────────────────────────────────────────────────────────────────
const vida = (ctx: Ctx, t: number): Res => {
  const k = kb(t);
  // the Phoenix (as the triptych left it) dissolves into a slow Julia, dimmed, for the creatures to swim over
  const vp = V.phoenix(t), cambio = eSuave(cl((k - 28.6) / 1.2));
  pinta(ctx, 0, 0, W, H, { ...vp, ancho: vp.ancho * 2.2 * 0.4545 }, 1 - cambio, t);
  pinta(ctx, 0, 0, W, H, V.julia(t), cambio, t);
  oscurece(ctx, 0.45 * eSuave(cl((k - 28.5) / 1.5)));
  // the millipede crosses from left to right along a slow wave
  const s = lerp(-0.05, 1.25, cl((k - 29) / 11));
  milpies(ctx, t, (u) => [lerp(-W * 0.15, W * 1.15, u), H * 0.58 + H * 0.12 * Math.sin(u * 5.5 + 0.6) + H * 0.04 * Math.sin(u * 13)], s, 1.25, eSuave(cl((k - 29) / 1.2)));
  return { rotulo: "VIDA FRACTAL", formula: "PATAS: UNA ONDA QUE VIAJA · CADA PIE SE RAMIFICA", hud: ["CRIATURAS HECHAS DE ECUACIONES", "FONDO: JULIA, c = −0,7269 + 0,1889i"] };
};

// ─── 5 · kaleidoscope and attractor ───────────────────────────────────────────────────────────────────────────────
let cuna: HTMLCanvasElement | null = null;
const caleido = (ctx: Ctx, t: number): Res => {
  const k = kb(t);
  // one wedge of the Spider, mirrored twelve times around the centre, turning
  const r = Math.hypot(W, H) / 2 + 4, ang = TAU / 12;
  if (!cuna) cuna = document.createElement("canvas");
  const cw = Math.round(r), ch = Math.round(r * Math.sin(ang) * 2.0);
  if (cuna.width !== cw || cuna.height !== ch) { cuna.width = cw; cuna.height = ch; }
  const c2 = cuna.getContext("2d")!;
  c2.clearRect(0, 0, cw, ch);
  const va = V.seno(t);
  pinta(c2, 0, 0, cw, ch, { ...va, ancho: va.ancho * 0.5 }, 1, t);
  const giro = 0.09 * (t - B(40));
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(giro);
  for (let i = 0; i < 12; i++) {
    ctx.save(); if (i % 2) { ctx.rotate((i + 1) * ang); ctx.scale(1, -1); } else ctx.rotate(i * ang);
    ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(r, -1); ctx.lineTo(r * Math.cos(ang) + 2, r * Math.sin(ang) + 2); ctx.closePath(); ctx.clip();
    ctx.drawImage(cuna, 0, -ch / 2);
    ctx.restore();
  }
  ctx.restore();
  // the hexagon at the centre: Clifford, morphing; from beat 46.5 it grows to fill the frame and becomes De Jong
  const crece = eIO(cl((k - 46.5) / 2));
  const rh = H * 0.3 * R(t, 41, 12) * lerp(1, 2.4, crece);
  if (rh > 2) {
    const u = (t - B(41)) * 0.05;   // paths checked to stay chaotic (no periodic windows)
    const img = k < 48 ? clifford(Math.round(W / 2), Math.round(H / 2), 1.7 + 0.1 * Math.sin(u * 3), 1.7, 0.6 + 0.1 * Math.cos(u * 2), 1.2 + 0.1 * Math.sin(u * 1.4), PALETAS[0], 1200000, 1.6 * lerp(0.62, 1, crece), 0.02 * t)
      : dejong(Math.round(W / 2), Math.round(H / 2), 1.4 + 0.1 * Math.sin(u * 2), -2.3, 2.4 + 0.1 * Math.cos(u * 3), -2.1, PALETAS[1], 1200000, 1.0, 0.02 * t);
    recorta(ctx, () => hexagono(ctx, W / 2, H / 2, rh, giro), () => { ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H); ctx.imageSmoothingEnabled = true; ctx.drawImage(img, 0, 0, W, H); });
    anillo(ctx, () => hexagono(ctx, W / 2, H / 2, rh, giro), 1 - crece, 2);
  }
  return k < 48
    ? { rotulo: "SEIS ESPEJOS · UN ATRACTOR", formula: "xₙ₊₁ = sen(a yₙ) + c cos(a xₙ)", hud: ["ATRACTOR DE CLIFFORD", "ESPEJOS: z → c · sen z"] }
    : { rotulo: "UN ATRACTOR EXTRAÑO", formula: "xₙ₊₁ = sen(a yₙ) − cos(b xₙ)", hud: ["ATRACTOR DE DE JONG", "1 200 000 PUNTOS POR CUADRO"] };
};

// ─── 6 · the mosaic ───────────────────────────────────────────────────────────────────────────────────────────────
const ORDEN = [4, 1, 3, 5, 7, 0, 2, 6, 8];
const mosaico = (ctx: Ctx, t: number): Res => {
  const k = kb(t);
  oscurece(ctx, 1);
  const cierra = eIO(cl((k - 56.5) / 2.2));                      // the centre cell grows into the frame
  const g = lerp(14, 0, cierra);
  const cw = (W - 4 * g) / 3, chh = (H - 4 * g) / 3;
  for (let n = 0; n < 9; n++) {
    const i = ORDEN[n];
    const e = R(t, 50 + n * 0.5, 13);
    if (e <= 0.001) continue;
    const col = i % 3, fil = Math.floor(i / 3);
    let x = g + col * (cw + g), y = g + fil * (chh + g), w = cw, h = chh;
    if (i === 4) { x = lerp(x, 0, cierra); y = lerp(y, 0, cierra); w = lerp(w, W, cierra); h = lerp(h, H, cierra); }
    else { const f = 1 + cierra * 2.2; x = W / 2 + (x + w / 2 - W / 2) * f - w / 2; y = H / 2 + (y + h / 2 - H / 2) * f - h / 2; }
    const s = 0.86 + 0.14 * e;
    const xx = x + (w * (1 - s)) / 2, yy = y + (h * (1 - s)) / 2, ww = w * s, hh = h * s;
    const vv = MOSAICO[i](t);
    recorta(ctx, () => ctx.rect(xx, yy, ww, hh), () => pinta(ctx, xx, yy, ww, hh, { ...vv, ancho: vv.ancho * (ww / W) * 3 * (i === 4 ? lerp(1, 1 / 3, cierra) : 1) }, e, t));
    anillo(ctx, () => ctx.rect(xx, yy, ww, hh), e * (1 - cierra), 1.2);
    etiqueta(ctx, NOMBRES_MOSAICO[i], xx + ww / 2, yy + hh - 18, e * (1 - cierra), "center");
  }
  return { rotulo: "NUEVE REGLAS", formula: "z → z² + c", hud: ["TALLOS DE PICKOVER AL CENTRO", `${Math.min(9, Math.max(0, Math.floor((k - 50) * 2) + 1))} / 9 MUNDOS`] };
};

// ═══ PART 2 ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// the licensed nature photos of the film (credited in the description)
export const FOTOS: Record<string, string> = {
  copo: "p2/destellos/01-copo-de-nieve.jpg", romanesco: "p2/destellos/02-romanesco.jpg", drenaje: "p2/destellos/03-drenaje-himalaya.jpg",
  arbol: "p2/destellos/05-arbol.jpg", micelio: "p2/destellos/07-micelio.jpg", helecho: "p2/destellos/08-helecho.jpg",
  lichtenberg: "p2/destellos/10-lichtenberg.jpg", coral: "p2/destellos/11-coral.jpg", nervaduras: "p2/destellos/13-nervaduras.jpg",
  nubes: "p2/destellos/14-nubes.jpg", meandros: "p2/destellos/15-meandros.jpg", girasol: "p2/destellos/17-girasol.jpg",
  escarcha: "p2/destellos/18-escarcha.jpg", liquen: "p2/destellos/19-liquen.jpg", dendritas: "p2/destellos/21-dendritas-plomo.jpg",
  aloe: "p2/destellos/22-aloe-espiral.jpg",
};
let F: Map<string, HTMLImageElement> = new Map();
const palRGBA = (k: number, u: number, a: number) => {
  const p = PALETAS[k]; u = ((u % 1) + 1) % 1;
  let i = 0; while (i < p.length - 2 && p[i + 1][0] < u) i++;
  const [u0, r0, g0, b0] = p[i], [u1, r1, g1, b1] = p[i + 1], x = cl((u - u0) / Math.max(1e-6, u1 - u0));
  return `rgba(${Math.round(255 * lerp(r0, r1, x))},${Math.round(255 * lerp(g0, g1, x))},${Math.round(255 * lerp(b0, b1, x))},${a})`;
};

// ─── 7 · GEOMETRY: the v1 figures, four at once, each at its own pace; then Hilbert | Pythagoras, then Vicsek ──────
const lienzosGeo: HTMLCanvasElement[] = [];
const geo = (i: number, v1beat: number) => {
  if (!lienzosGeo[i]) { lienzosGeo[i] = document.createElement("canvas"); lienzosGeo[i].width = W; lienzosGeo[i].height = H; }
  dibujarGeo(lienzosGeo[i].getContext("2d")!, B1(v1beat));
  return lienzosGeo[i];
};
const hilbertArbol = (ctx: Ctx, t: number) => {
  const k = kb(t);
  // Hilbert on the left, the Pythagoras tree on the right, a vertical seam; then Vicsek opens from the centre
  const div = W / 2;
  const lh = geo(0, lerp(25.0, 27.4, cl((k - 73) / 8))), la = geo(1, lerp(28.0, 31.2, cl((k - 74) / 8)));
  recorta(ctx, () => ctx.rect(0, 0, div, H), () => ctx.drawImage(lh, -W / 4, 0, W, H));
  recorta(ctx, () => ctx.rect(div, 0, W - div, H), () => ctx.drawImage(la, W / 4, 0, W, H));
  anillo(ctx, () => { ctx.moveTo(div, 0); ctx.lineTo(div, H); }, 1 - eIO(cl((k - 81) / 1)), 1.6);
  if (k >= 81) {
    const lv = geo(2, lerp(31.7, 33.4, cl((k - 81) / 4)));
    const r = Math.max(1, Math.hypot(W, H) * 0.75 * eIO(cl((k - 81) / 1.2)));
    recorta(ctx, () => { ctx.moveTo(W / 2, H / 2 - r); ctx.lineTo(W / 2 + r, H / 2); ctx.lineTo(W / 2, H / 2 + r); ctx.lineTo(W / 2 - r, H / 2); ctx.closePath(); }, () => ctx.drawImage(lv, 0, 0, W, H));
  }
};
const TRAMOS_GEO: [number, number, string][] = [[3.6, 10, "COPO DE KOCH"], [10, 14.9, "TRIÁNGULO DE SIERPIŃSKI"], [15.1, 19.4, "ALFOMBRA DE SIERPIŃSKI"], [19.6, 24.6, "CURVA DEL DRAGÓN"]];
const geometria = (ctx: Ctx, t: number): Res => {
  const k = kb(t);
  // under it, the mosaic's last world fades out
  if (k < 62.5) { mosaico(ctx, t); oscurece(ctx, 0.35 + 0.65 * eSuave(cl((k - 61) / 1.5))); }
  if (k >= 72.6) hilbertArbol(ctx, t);
  if (k < 73.6) {
    const g = 14, pw = (W - 3 * g) / 2, ph = (H - 3 * g) / 2;
    const sale = eIO(cl((k - 72.6) / 1.0));
    TRAMOS_GEO.forEach(([a, b, nom], i) => {
      const e = R(t, 61 + 0.25 * i, 12);
      if (e <= 0.001) return;
      const u = cl((k - (61 + 0.25 * i)) / 11.4);
      const lz = geo(i, lerp(a, b, u));
      const col = i % 2, fil = Math.floor(i / 2);
      const sx = (col ? 1 : -1) * (1 - e + sale) * W * 0.6, sy = (fil ? 1 : -1) * (1 - e + sale) * H * 0.6;
      const x = g + col * (pw + g) + sx, y = g + fil * (ph + g) + sy;
      ctx.drawImage(lz, x, y, pw, ph);
      anillo(ctx, () => ctx.rect(x, y, pw, ph), 0.8, 1.2);
      etiqueta(ctx, nom, x + pw / 2, y + ph - 20, e * (1 - sale), "center");
    });
    if (k < 72.6) return { rotulo: "GEOMETRÍA · CUATRO A LA VEZ", formula: "CADA PARTE, UNA COPIA DEL TODO", hud: ["KOCH · SIERPIŃSKI · ALFOMBRA · DRAGÓN", "AUTOSEMEJANZA EXACTA"] };
  }
  return k < 81
    ? { rotulo: "UNA LÍNEA QUE LLENA EL PLANO · UN ÁRBOL DE CUADRADOS", formula: "HILBERT | PITÁGORAS", hud: ["CURVA DE HILBERT · ORDEN 1 → 6", "ÁRBOL DE PITÁGORAS · 12 NIVELES"] }
    : { rotulo: "UNA CRUZ DE CRUCES", formula: "FRACTAL DE VICSEK", hud: ["DIMENSIÓN log 5 / log 3 ≈ 1,46", "GIRA 45°"] };
};

// ─── 8 · TREES: an L-system forest grows in the wind; a real tree slides in ───────────────────────────────────────
const BOSQUE: [number, number, number, string, number][] = [[0.17, 0.62, 3, "255,236,210", 0], [0.4, 0.4, 1, "214,232,190", 1.3], [0.62, 0.5, 2, "255,214,160", 2.1], [0.85, 0.66, 0, "232,240,255", 3.4]];
const arboles = (ctx: Ctx, t: number): Res => {
  const k = kb(t);
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  const suelo = H * 0.9;
  const gl = ctx.createLinearGradient(0, suelo - H * 0.5, 0, suelo + 10);
  gl.addColorStop(0, "rgba(255,190,120,0)"); gl.addColorStop(1, `rgba(255,190,120,${0.14 * R(t, 85, 6)})`);
  ctx.fillStyle = gl; ctx.fillRect(0, suelo - H * 0.5, W, H * 0.5 + 10);
  const pan = lerp(40, -40, cl((k - 85) / 16));
  anillo(ctx, () => { ctx.moveTo(0, suelo); ctx.lineTo(W, suelo); }, 0.5 * R(t, 85, 8), 1.2);
  BOSQUE.forEach(([x, alto, tipo, col, fase], i) => {
    const crece = eOut(cl((k - 85 - i * 1.25) / 6));
    planta(ctx, tipo, W * x + pan * (0.6 + 0.3 * i), suelo, H * alto, crece, t, col, 1, fase);
  });
  // the real tree, from the right, on beat 95; it takes the frame from beat 99
  const pos = lerp(W * 1.3, W * 0.64, R(t, 95, 8)) - W * 0.8 * eIO(cl((k - 99) / 2));
  const incl = H * 0.3;
  if (pos - incl < W) {
    recorta(ctx, () => { ctx.moveTo(pos + incl, -10); ctx.lineTo(W * 2, -10); ctx.lineTo(W * 2, H + 10); ctx.lineTo(pos - incl, H + 10); ctx.closePath(); }, () => foto(ctx, F.get("arbol"), 0, 0, W, H, 1.05 + 0.04 * cl((k - 95) / 6)));
    anillo(ctx, () => { ctx.moveTo(pos + incl, -10); ctx.lineTo(pos - incl, H + 10); }, 1, 2);
  }
  return k < 95
    ? { rotulo: "SISTEMAS L · LINDENMAYER, 1968", formula: "X → F+[[X]−X]−F[−FX]+X", hud: ["CUATRO GRAMÁTICAS, CUATRO PLANTAS", "EL VIENTO SE SUMA EN CADA RAMA"] }
    : { rotulo: "Y UNO DE VERDAD", formula: "RAMAS DENTRO DE RAMAS", hud: ["FOTO: WILFREDOR · CC0", "SISTEMAS L | UN ÁRBOL REAL"] };
};

// ─── 9 · NATURE: a mosaic of real forms; the romanesco opens on the golden angle; the sunflower ──────────────────
const MOS_N: [string, string, number, number][] = [
  ["copo", "COPO DE NIEVE", 0.5, 0.5], ["lichtenberg", "FIGURA DE LICHTENBERG", 0.5, 0.5], ["helecho", "HELECHO", 0.45, 0.4], ["coral", "CORAL", 0.5, 0.5],
  ["drenaje", "RÍOS DEL HIMALAYA", 0.5, 0.5], ["romanesco", "ROMANESCO", 0.5, 0.5], ["nervaduras", "NERVADURAS", 0.5, 0.5], ["micelio", "MICELIO", 0.5, 0.5],
  ["escarcha", "ESCARCHA", 0.5, 0.5], ["meandros", "MEANDROS", 0.5, 0.5], ["dendritas", "DENDRITAS DE PLOMO", 0.5, 0.5], ["liquen", "LIQUEN", 0.5, 0.5],
];
const ORDEN_N = [5, 0, 10, 3, 8, 1, 6, 11, 2, 9, 4, 7];
const naturaleza = (ctx: Ctx, t: number): Res => {
  const k = kb(t);
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  if (k < 111) {
    if (k < 104.5) { foto(ctx, F.get("arbol"), 0, 0, W, H, 1.09); oscurece(ctx, eSuave(cl((k - 101) / 3.2))); }
    const abre = eIO(cl((k - 109) / 2));                     // the romanesco cell takes the frame
    const g = lerp(12, 0, abre), cw = (W - 5 * g) / 4, ch = (H - 4 * g) / 3;
    ORDEN_N.forEach((i, n) => {
      const e = R(t, 101 + n * 0.33, 13);
      if (e <= 0.001) return;
      const col = i % 4, fil = Math.floor(i / 4);
      let x = g + col * (cw + g), y = g + fil * (ch + g), w = cw, h = ch;
      if (i === 5) { x = lerp(x, 0, abre); y = lerp(y, 0, abre); w = lerp(w, W, abre); h = lerp(h, H, abre); }
      else { const f = 1 + abre * 2.4; x = W / 2 + (x + w / 2 - W / 2) * f - w / 2; y = H / 2 + (y + h / 2 - H / 2) * f - h / 2; }
      const s = 0.84 + 0.16 * e, xx = x + (w * (1 - s)) / 2, yy = y + (h * (1 - s)) / 2, ww = w * s, hh = h * s;
      const [clave, nom, fx, fy] = MOS_N[i];
      foto(ctx, F.get(clave), xx, yy, ww, hh, 1.06 + 0.1 * cl((k - 101) / 10), fx, fy, e);
      anillo(ctx, () => ctx.rect(xx, yy, ww, hh), e * (1 - abre), 1.1);
      etiqueta(ctx, nom, xx + ww / 2, yy + hh - 16, e * (1 - abre), "center");
    });
    return { rotulo: "LA NATURALEZA TAMBIÉN ITERA", formula: "DOCE FORMAS REALES", hud: ["FOTOS CON LICENCIA LIBRE · VER DESCRIPCIÓN", `${Math.min(12, Math.max(0, Math.floor((k - 101) * 3) + 1))} / 12`] };
  }
  const dorado = (u: number, a: number) => palRGBA(2, u, a);
  if (k < 117) {
    foto(ctx, F.get("romanesco"), 0, 0, W, H, 1.16 + 0.06 * cl((k - 111) / 6));   // continues the cell's own zoom (1,16 at beat 111)
    const crece = eIO(cl((k - 116) / 1.2));
    const r = H * 0.33 * R(t, 111.5, 11) * lerp(1, Math.hypot(W, H) / (H * 0.66) + 0.05, crece);
    if (r > 2) {
      recorta(ctx, () => ctx.arc(W / 2, H / 2, r, 0, TAU), () => { ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H); filotaxis(ctx, W / 2, H / 2, H * 0.42, 1400 * eOut(cl((k - 111.5) / 5)), 0.05 * (t - B(111)), t, dorado); });
      anillo(ctx, () => ctx.arc(W / 2, H / 2, r, 0, TAU), 1 - crece);
    }
    return { rotulo: "EL ÁNGULO DE ORO", formula: "θₙ = n · 137,508° · rₙ = c √n", hud: ["FILOTAXIS · VOGEL, 1979", "ROMANESCO: FOTO DE IVAR LEIDUS · CC BY-SA 4.0"] };
  }
  if (k < 121) {
    ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
    filotaxis(ctx, W / 2, H / 2, H * 0.42, 1400 + 600 * cl((k - 117) / 4), 0.05 * (t - B(111)), t, dorado);
    const r = H * 0.46 * eIO(cl((k - 118) / 2.2));
    if (r > 2) {
      recorta(ctx, () => ctx.arc(W / 2, H / 2, r, 0, TAU), () => foto(ctx, F.get("girasol"), 0, 0, W, H, 1.35, 0.5, 0.52));
      anillo(ctx, () => ctx.arc(W / 2, H / 2, r, 0, TAU), 0.7, 1.4);
    }
    return { rotulo: "EL MISMO ÁNGULO EN UN GIRASOL", formula: "θₙ = n · 137,508°", hud: ["2 000 SEMILLAS CALCULADAS", "GIRASOL: FOTO DE JAMESWASSWA · CC BY-SA 4.0"] };
  }
  // a triptych of three real forms, each pushing in
  const gg = 16, pw = (W - 4 * gg) / 3;
  const trio: [string, string][] = [["escarcha", "ESCARCHA"], ["helecho", "HELECHO QUE SE DESENROLLA"], ["aloe", "ALOE EN ESPIRAL"]];
  trio.forEach(([clave, nom], i) => {
    const e = R(t, 121 + 0.12 * i, 11);
    const x = gg + i * (pw + gg), dy = (1 - e) * H * (i % 2 ? -1 : 1);
    foto(ctx, F.get(clave), x, gg + dy, pw, H - 2 * gg, 1.08 + 0.12 * cl((k - 121) / 4), 0.5, 0.5, e);
    anillo(ctx, () => ctx.rect(x, gg + dy, pw, H - 2 * gg), e, 1.2);
    etiqueta(ctx, nom, x + pw / 2, H - gg - 26 + dy, e, "center");
  });
  return { rotulo: "CRECER COPIANDO", formula: "LA MISMA FORMA, A OTRA ESCALA", hud: ["ESCARCHA · HELECHO · ALOE", "FOTOS CON LICENCIA LIBRE"] };
};

// ─── 10 · WEBS: an orb web laid by a point of light; inside one of its cells, another; inside that, another ──────
const RW = 0.11;                                              // a child web's radius, in units of its parent's
const PH = celdaHija(1), PH2 = celdaHija(2);
const telaranas = (ctx: Ctx, t: number): Res => {
  const k = kb(t);
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  if (k < 126) { naturaleza(ctx, t); oscurece(ctx, eSuave(cl((k - 125) / 1))); }
  const g = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.7);
  g.addColorStop(0, `rgba(60,80,120,${0.16 * R(t, 125, 4)})`); g.addColorStop(1, "rgba(60,80,120,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const R0 = H * 0.46;
  // the dive: from the whole web to its grandchild (×82), toward a fixed point that ends at the centre
  const u = cl((k - 133.5) / 7.5);
  const z = Math.exp(Math.log(1 / (RW * RW)) * (u < 0.15 ? (u * u) / 0.3 : u - 0.075) / 0.925);
  const foco: P = [(PH[0] + RW * PH2[0]) * R0, (PH[1] + RW * PH2[1]) * R0];
  const kk = (1 - eSuave(u)) / z;
  const cam = (p: P): P => [W / 2 + z * (p[0] - (foco[0] + (0 - foco[0]) * kk)), H / 2 + z * (p[1] - (foco[1] + (0 - foco[1]) * kk))];
  const c0 = cam([0, 0]);
  telarana(ctx, c0[0], c0[1], R0 * z, eOut(cl((k - 125.5) / 2.5)), eIO(cl((k - 128) / 5.5)), t, 1, 1 - 0.75 * eSuave(cl(u * 1.6)));
  const p1: P = [PH[0] * R0, PH[1] * R0], c1 = cam(p1);
  telarana(ctx, c1[0], c1[1], R0 * RW * z, eOut(cl((k - 133.5) / 1.0)), eIO(cl((k - 134.5) / 2.0)), t, 2, 1 - 0.7 * eSuave(cl((u - 0.5) * 2.5)));
  const c2 = cam([p1[0] + PH2[0] * R0 * RW, p1[1] + PH2[1] * R0 * RW]);
  telarana(ctx, c2[0], c2[1], R0 * RW * RW * z, eOut(cl((k - 137) / 0.8)), eIO(cl((k - 137.8) / 2.0)), t, 3, 1);
  return k < 133.5
    ? { rotulo: "UNA TELARAÑA", formula: "RADIOS · UNA ESPIRAL QUE LOS CRUZA", hud: ["26 RADIOS · 15 VUELTAS", "ROCÍO EN LOS HILOS"] }
    : { rotulo: "DENTRO DE UNA CELDA, OTRA TELARAÑA", formula: "Y DENTRO DE ESA, OTRA", hud: [`AUMENTO ×${Math.round(z)}`, "TELARAÑAS DENTRO DE TELARAÑAS"] };
};

// ─── 11 · CHAOS: Lorenz's butterfly; the logistic map and its window; Hénon's bands; then it all closes ────────────
const caosEsc = (ctx: Ctx, t: number): Res => {
  const k = kb(t);
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  if (k < 149) {
    lorenz(ctx, W, H, eSuave(cl((k - 141) / 8)) * 0.98 + 0.02, 1 - eSuave(cl((k - 148.4) / 0.6)));
    return { rotulo: "EL EFECTO MARIPOSA", formula: "ẋ = 10(y − x) · ẏ = x(28 − z) − y · ż = xy − 8z/3", hud: ["TRES ÓRBITAS QUE NACEN A 0,00001", "LORENZ, 1963"] };
  }
  if (k < 157) {
    const u = eIO(cl((k - 152) / 5));
    const lw = (a: number, b: number) => Math.exp(lerp(Math.log(a), Math.log(b), u));
    const wr = lw(1.2, 0.034), wx = lw(1.0, 0.13);
    const cr = lerp(3.4, 3.842, u), cx = lerp(0.5, 0.505, u);
    const img = bifurcacion(W, H, cr - wr / 2, cr + wr / 2, cx - wx / 2, cx + wx / 2, eOut(cl((k - 149) / 2.6)));
    ctx.drawImage(img, 0, 0);
    return { rotulo: "DEL ORDEN AL CAOS, Y DE VUELTA", formula: "xₙ₊₁ = r xₙ (1 − xₙ)", hud: [`r = ${num(cr - wr / 2, 4)} … ${num(cr + wr / 2, 4)}`, u > 0.6 ? "DENTRO DEL CAOS, EL DIAGRAMA ENTERO OTRA VEZ" : "BIFURCACIONES · 2, 4, 8, CAOS"] };
  }
  const u = eIO(cl((k - 157) / 7));
  const ancho = Math.exp(lerp(Math.log(3.0), Math.log(0.3), u));
  const img = henon(W, H, lerp(0, 0.6314, u), lerp(0, 0.1894, u), ancho, 3500000);
  const cierra = eIO(cl((k - 164) / 1));
  const r = Math.hypot(W, H) * 0.6 * (1 - cierra);
  if (r > 1) recorta(ctx, () => ctx.arc(W / 2, H / 2, r, 0, TAU), () => ctx.drawImage(img, 0, 0));
  return { rotulo: "UN ATRACTOR CON CAPAS", formula: "xₙ₊₁ = 1 − 1,4 xₙ² + yₙ · yₙ₊₁ = 0,3 xₙ", hud: [`AUMENTO ×${Math.round(3 / ancho)}`, "HÉNON, 1976"] };
};
// the wild section starts on beat 165 of the 100 BPM grid
export const T_LOCO = D.t0 + 165 * (60 / D.bpm);

// ─── the shot list ────────────────────────────────────────────────────────────────────────────────────────────────
const PLANOS: [number, number, (ctx: Ctx, t: number) => Res][] = [[-1, 10, lentes], [10, 18, diagonal], [18, 28, triptico], [28, 40, vida], [40, 50, caleido], [50, 61, mosaico], [61, 85, geometria], [85, 101, arboles], [101, 125, naturaleza], [125, 141, telaranas], [141, 999, caosEsc]];

export const dibujarDeleite = (ctx: Ctx, t: number, frame: number, fotos?: Map<string, HTMLImageElement>) => {
  if (fotos) F = fotos;
  if (t >= T_LOCO) { dibujarLoco(ctx, t - T_LOCO, frame, F); return; }
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  const k = kb(t);
  let res: Res = { rotulo: "", formula: "", hud: [] };
  for (const [a, b, f] of PLANOS) if (k >= a && k < b) res = f(ctx, t);
  // the HUD of the opening: corner brackets, the rule, live readouts, the pulse
  const ah = eSuave(pr(t, B(0) + 0.3, 0.6)) * (1 - eSuave(pr(t, D.total - 1.6, 0.8)));
  if (ah > 0.01) {
    const m = 40, bb = 26;
    ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.5 * ah})`; ctx.lineWidth = 1.5; ctx.beginPath();
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { ctx.moveTo(x, y + sy * bb); ctx.lineTo(x, y); ctx.lineTo(x + sx * bb, y); }
    ctx.stroke(); ctx.restore();
    texto(ctx, res.formula, 72, 64, 15, `rgba(${RGB.crema},${0.6 * ah})`, { esp: 2 });
    texto(ctx, res.rotulo, W - 72, 64, 15, `rgba(${RGB.crema},${0.6 * ah})`, { alin: "right", esp: 2 });
    res.hud.forEach((s, i) => texto(ctx, s, 72, H - 64 - (res.hud.length - 1 - i) * 24, 15, `rgba(${RGB.crema},${(i === 0 ? 0.75 : 0.5) * ah})`, { esp: 2 }));
    const pulso = Math.max(0, Math.floor(k) + 1);
    texto(ctx, `PULSO ${String(pulso).padStart(2, "0")} · ${D.bpm} LPM`, W - 72, H - 64, 15, `rgba(${RGB.crema},${0.75 * ah})`, { alin: "right", esp: 2 });
  }
  oscurece(ctx, Math.max(1 - eSuave(pr(t, 0, 0.3)), eSuave(pr(t, D.total - 1.4, 1.2))));
  let golpe = 0;
  for (const g of D.golpes) { const tg = B(g); if (t >= tg && t - tg < 1.2) golpe = Math.max(golpe, Math.exp(-(t - tg) * 4)); }
  const imp = k >= 0 ? 0.18 * Math.exp(-(k - Math.floor(k)) * BEAT * 7) : 0;
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.88, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: Math.max(imp, golpe * 0.45), ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
