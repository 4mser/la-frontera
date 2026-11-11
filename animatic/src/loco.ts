// «Deleite» · the wild section: 128 BPM, almost electronic. Every beat punches the frame. t is local (0 = the drop).
//   A  0–8    a hard cut on every beat to another rule, each one diving
//   B  8–16   a grid that subdivides on the beat: 2×2 → 3×3 → 4×4 → 6×6
//   C  16–24  sixteen mirrors that jump a turn on every beat; a hexagon with an attractor that pulses with the kick
//   E  24–32  a diagonal that flips on every beat: a real photograph on one side, a fractal on the other
//   F  32–40  the break: the millipede crosses with no kick; then a build into the drop
//   D  40–48  a tunnel of lenses: each beat every ring moves outward and a new world opens at the centre
//   G  48–56  an 8 × 8 wall of worlds; a wave runs across it on every beat and changes what it touches
//   H  56–64  everything, one device per beat; on beat 62 it all closes into a point; a pulse of colour; silence
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS } from "./fractalTeaser";
import { anillo, pinta, recorta, texto, type Vista } from "./deleite";
import { foto } from "./naturaleza";
import { clifford, milpies } from "./vida";
import { RGB, cl, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
export const LOCO = { bpm: 128, beats: 64 };
const BEAT = 60 / LOCO.bpm;
export const LOCO_TOTAL = 66 * BEAT;

const POOL: ((u: number) => Vista)[] = [
  (u) => ({ regla: 0, cx: -0.74364, cy: 0.13183, ancho: 0.012 / (1 + 0.7 * u), pal: 0, maxIt: 700 }),
  (u) => ({ regla: 1, cx: -1.7621, cy: -0.028, ancho: 0.05 / (1 + 0.7 * u), pal: 2, maxIt: 500 }),
  (u) => ({ regla: 0, cx: 0.3, cy: 0.1, ancho: 1.2 / (1 + 0.5 * u), julia: [-0.8, 0.156], rot: 0.3 * u, pal: 1 }),
  (u) => ({ regla: 4, cx: -1.45, cy: 0.28, ancho: 0.6 / (1 + 0.6 * u), pal: 1 }),
  (u) => ({ regla: 3, pot: 5, cx: 0, cy: 0, ancho: 2.5 / (1 + 0.4 * u), rot: 0.4 * u, pal: 2 }),
  (u) => ({ regla: 8, cx: 0, cy: 0, ancho: 1.0 / (1 + 0.6 * u), rot: 0.5 * u, pal: 0 }),
  (u) => ({ regla: 12, cx: 0.4, cy: 0.2, ancho: 3 / (1 + 0.5 * u), julia: [1, 0.3], pal: 0 }),
  (u) => ({ regla: 10, cx: 1.4, cy: 0, ancho: 1.5 / (1 + 0.6 * u), pal: 2 }),
  (u) => ({ regla: 13, cx: 3.42, cy: 3.05, ancho: 0.4 / (1 + 0.4 * u), pal: 1 }),
  (u) => ({ regla: 15, cx: -0.7454, cy: 0.113, ancho: 0.01 / (1 + 0.7 * u), pal: 0, maxIt: 700 }),
  (u) => ({ regla: 7, cx: 0, cy: 0, ancho: 1.3 / (1 + 0.5 * u), rot: Math.PI / 2, julia: [0.5667, -0.5], pal: 1 }),
  (u) => ({ regla: 14, cx: -0.45, cy: 0, ancho: 2.2 / (1 + 0.5 * u), pal: 2 }),
  (u) => ({ regla: 9, cx: -0.3, cy: 0, ancho: 1.2 / (1 + 0.5 * u), pal: 0 }),
  (u) => ({ regla: 11, cx: 1, cy: 0, ancho: 3 / (1 + 0.5 * u), pal: 1 }),
  (u) => ({ regla: 6, cx: -0.5, cy: 0, ancho: 2.5 / (1 + 0.5 * u), pal: 2 }),
  (u) => ({ regla: 2, cx: -0.2, cy: 0, ancho: 3 / (1 + 0.5 * u), rot: -0.3 * u, pal: 1 }),
  (u) => ({ regla: 0, cx: -0.1011, cy: 0.9563, ancho: 0.03 / (1 + 0.7 * u), pal: 2, maxIt: 600 }),
  (u) => ({ regla: 0, cx: 0, cy: 0, ancho: 1.6 / (1 + 0.5 * u), julia: [-0.123, 0.745], rot: -0.4 * u, pal: 0 }),
];
const NOMBRES = ["MANDELBROT", "BURNING SHIP", "JULIA", "CÉLTICO", "z⁵ + c", "NEWTON", "c · SEN z", "IMÁN", "LYAPUNOV", "PICKOVER", "FÉNIX", "ARAÑA", "NOVA", "LAMBDA", "PERPENDICULAR", "TRICORNIO", "MANDELBROT · ANTENA", "JULIA · CONEJO"];
const NP = POOL.length;
const mundo = (i: number, u: number, pal?: number): Vista => { const v = POOL[((i % NP) + NP) % NP](u); return pal === undefined ? v : { ...v, pal: ((pal % 3) + 3) % 3 }; };
const FOTOS_L = ["copo", "romanesco", "lichtenberg", "helecho", "coral", "drenaje", "nervaduras", "micelio", "escarcha", "meandros", "dendritas", "liquen", "aloe", "girasol", "arbol"];
const BUENOS = [2, 6, 0, 3, 17, 16, 1, 9];                    // worlds that stay rich when mirrored

let cuna: HTMLCanvasElement | null = null;
const espejos = (ctx: Ctx, t: number, v: Vista, n: number, giro: number) => {
  const r = Math.hypot(W, H) / 2 + 4, ang = TAU / n;
  if (!cuna) cuna = document.createElement("canvas");
  const cw = Math.round(r), ch = Math.round(r * Math.sin(ang) * 2.2);
  if (cuna.width !== cw || cuna.height !== ch) { cuna.width = cw; cuna.height = ch; }
  pinta(cuna.getContext("2d")!, 0, 0, cw, ch, { ...v, ancho: v.ancho * 0.6 }, 1, t);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(giro);
  for (let i = 0; i < n; i++) {
    ctx.save(); if (i % 2) { ctx.rotate((i + 1) * ang); ctx.scale(1, -1); } else ctx.rotate(i * ang);
    ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(r, -1); ctx.lineTo(r * Math.cos(ang) + 2, r * Math.sin(ang) + 2); ctx.closePath(); ctx.clip();
    ctx.drawImage(cuna, 0, -ch / 2); ctx.restore();
  }
  ctx.restore();
};
const tunel = (ctx: Ctx, t: number, paso: number, desf = 40) => {
  const base = Math.hypot(W, H) / 2;
  pinta(ctx, 0, 0, W, H, mundo(Math.floor(paso) + desf, paso * 0.3), 1, t);
  for (let j = 1; j <= 6; j++) {
    const lvl = Math.floor(paso) + j, f = paso - Math.floor(paso);
    const r = base * Math.pow(0.6, j - f);
    if (r < 3) continue;
    const v = mundo(lvl + desf, paso * 0.3, lvl % 3);
    recorta(ctx, () => ctx.arc(W / 2, H / 2, r, 0, TAU), () => pinta(ctx, W / 2 - r, H / 2 - r, 2 * r, 2 * r, { ...v, ancho: v.ancho * ((2 * r) / W) * 1.6 }, 1, t));
    anillo(ctx, () => ctx.arc(W / 2, H / 2, r, 0, TAU), 0.8, 1.6);
  }
};
const grilla = (ctx: Ctx, t: number, n: number, lt: number, sem: number, ola = -1) => {
  const g = n > 6 ? 4 : 6, cw = (W - (n + 1) * g) / n, ch = (H - (n + 1) * g) / n;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const idx = r * n + c, x = g + c * (cw + g), y = g + r * (ch + g);
    // a wave that runs diagonally across the wall: cells it has passed show the next world
    const pasa = ola >= 0 && (c + r) / (2 * n - 2) < ola ? 1 : 0;
    const e = eOut(cl((lt - (0.2 * idx) / (n * n)) / 0.1));
    const s = 0.8 + 0.2 * e;
    const v = mundo(idx * 7 + sem + pasa * 3, lt * 0.5 + 0.5);
    recorta(ctx, () => ctx.rect(x + (cw * (1 - s)) / 2, y + (ch * (1 - s)) / 2, cw * s, ch * s), () => pinta(ctx, x, y, cw, ch, { ...v, ancho: v.ancho * 1.4 }, e, t));
  }
};

export const dibujarLoco = (ctx: Ctx, t: number, frame: number, fotos?: Map<string, HTMLImageElement>) => {
  ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
  const k = t / BEAT, b = Math.floor(k), fr = k - b;
  const pausa = k >= 32 && k < 36;                              // the break has no kick
  const punch = k < 62 && !pausa ? 0.045 * Math.exp(-fr * BEAT * 9) : 0;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + punch, 1 + punch); ctx.translate(-W / 2, -H / 2);
  let rot = "", hud: string[] = [];
  if (k < 8) {
    const i = b * 5 + 1;
    pinta(ctx, 0, 0, W, H, mundo(i, fr + 0.3, b + (fr > 0.5 ? 1 : 0)), 1, t);
    rot = "UN MUNDO POR GOLPE"; hud = [NOMBRES[i % NP], `GOLPE ${b + 1}`];
  } else if (k < 16) {
    const n = [2, 2, 3, 3, 4, 4, 6, 6][b - 8], b0 = 8 + 2 * Math.floor((b - 8) / 2);
    grilla(ctx, t, n, (k - b0) * BEAT, b);
    rot = "LA GRILLA SE PARTE EN CADA GOLPE"; hud = [`${n} × ${n} = ${n * n} MUNDOS`, `GOLPE ${b + 1}`];
  } else if (k < 24) {
    const giro = (Math.floor(k - 16) + eOut(cl((fr * BEAT) / 0.15))) * (Math.PI / 8);
    espejos(ctx, t, mundo(BUENOS[Math.floor((b - 16) / 2) % 4], (k - 16) * 0.25, b), 16, giro);
    const rh = H * (0.2 + 0.06 * Math.exp(-fr * BEAT * 7)) * eOut(cl(k - 16));
    const img = clifford(Math.round(W / 2), Math.round(H / 2), 1.7 + 0.1 * Math.sin(k * 0.3), 1.7, 0.6 + 0.1 * Math.cos(k * 0.2), 1.2, PALETAS[(b + 1) % 3], 500000, 1.5, 0.05 * k);
    const hex = () => { for (let i = 0; i < 6; i++) { const a = -giro * 1.5 + (i * TAU) / 6; if (i) ctx.lineTo(W / 2 + rh * Math.cos(a), H / 2 + rh * Math.sin(a)); else ctx.moveTo(W / 2 + rh * Math.cos(a), H / 2 + rh * Math.sin(a)); } ctx.closePath(); };
    recorta(ctx, hex, () => { ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H); ctx.drawImage(img, 0, 0, W, H); });
    anillo(ctx, hex, 1, 2);
    rot = "DIECISÉIS ESPEJOS"; hud = ["UN GIRO DE 22,5° POR GOLPE", "ATRACTOR DE CLIFFORD"];
  } else if (k < 32) {
    // a photograph | a fractal; the diagonal flips direction on every beat
    const lado = b % 2 ? 1 : -1, pos = W / 2 + lado * W * 0.06 * Math.exp(-fr * BEAT * 6), incl = H * 0.38 * lado;
    const clave = FOTOS_L[(b - 24) % FOTOS_L.length];
    foto(ctx, fotos?.get(clave), 0, 0, W, H, 1.1 + 0.06 * fr);
    recorta(ctx, () => { ctx.moveTo(pos + incl, -10); ctx.lineTo(W + 10, -10); ctx.lineTo(W + 10, H + 10); ctx.lineTo(pos - incl, H + 10); ctx.closePath(); }, () => pinta(ctx, 0, 0, W, H, mundo(b * 3 + 2, fr + 0.4, b), 1, t));
    anillo(ctx, () => { ctx.moveTo(pos + incl, -10); ctx.lineTo(pos - incl, H + 10); }, 1, 2.4);
    rot = "LA NATURALEZA | LA REGLA"; hud = [clave.toUpperCase(), `GOLPE ${b + 1}`];
  } else if (k < 40) {
    // the break: a slow world, dimmed; the millipede crosses; from beat 36 a build: a dive that speeds up
    const sube = eIO(cl((k - 36) / 4));
    const v = k < 36 ? mundo(17, (k - 32) * 0.2, 0) : mundo(0, 0, 1);
    pinta(ctx, 0, 0, W, H, k < 36 ? v : { ...v, ancho: 0.05 / (1 + 80 * sube * sube), rot: 1.5 * sube * sube }, 1, t);
    ctx.fillStyle = `rgba(2,3,6,${0.55 * (1 - sube)})`; ctx.fillRect(0, 0, W, H);
    const s = lerp(-0.05, 1.3, cl((k - 32) / 5));
    if (k < 37.5) milpies(ctx, t, (u) => [lerp(-W * 0.15, W * 1.15, u), H * 0.55 + H * 0.1 * Math.sin(u * 6)], s, 1.2, 1 - eSuave(cl((k - 36.5) / 1)));
    rot = k < 36 ? "UNA PAUSA" : "VUELVE"; hud = k < 36 ? ["VIDA FRACTAL", "SIN BOMBO"] : ["MANDELBROT · VALLE DEL CABALLITO DE MAR", "EL BUCEO SE ACELERA"];
  } else if (k < 48) {
    tunel(ctx, t, (k - 40) + eOut(cl((fr * BEAT) / 0.18)) - fr);
    rot = "UN TÚNEL DE MUNDOS"; hud = ["SEIS LUPAS, UNA DENTRO DE OTRA", `GOLPE ${b + 1}`];
  } else if (k < 56) {
    grilla(ctx, t, 8, (k - 48) * BEAT + 1, b, eOut(cl((fr * BEAT) / 0.3)));
    rot = "SESENTA Y CUATRO MUNDOS"; hud = ["UNA OLA CAMBIA LA PARED EN CADA GOLPE", `GOLPE ${b + 1}`];
  } else if (k < 64) {
    // everything: one device per beat; from beat 62 it all closes into a point
    const d = (b - 56) % 4;
    if (d === 0) tunel(ctx, t, (k - 40) + eOut(cl((fr * BEAT) / 0.18)) - fr, 20);
    else if (d === 1) espejos(ctx, t, mundo(BUENOS[b % 8], fr, b), 12, b * 0.4 + fr * 0.3);
    else if (d === 2) grilla(ctx, t, 6, fr * BEAT + 1, b * 5);
    else pinta(ctx, 0, 0, W, H, mundo(b * 7, fr + 0.5, b), 1, t);
    if (k >= 62) {
      // the point: everything outside a shrinking circle goes dark
      const cierra = eIO(cl((k - 62) / 0.9));
      const r = Math.max(0.5, Math.hypot(W, H) * 0.55 * (1 - cierra));
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, r, 0, TAU, true); ctx.fillStyle = "#020306"; ctx.fill("evenodd"); ctx.restore();
    }
    rot = "TODO A LA VEZ"; hud = ["CADA GOLPE, OTRO DISPOSITIVO", `GOLPE ${Math.min(64, b + 1)} / 64`];
  }
  ctx.restore();
  // the last hit (beat 63): a pulse of colour, a ring of magenta and cream that runs outward, then the dark
  if (k >= 63) {
    const u = (k - 63) * BEAT;
    const r = u * W * 1.1, a = Math.exp(-u * 1.6) * (1 - eSuave(cl((k - 64.5) / 1)));
    if (a > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (const [col, dr, w] of [["255,90,190", 0, 60], ["255,236,210", -40, 18]] as [string, number, number][]) {
        ctx.strokeStyle = `rgba(${col},${0.7 * a})`; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(W / 2, H / 2, Math.max(1, r + dr), 0, TAU); ctx.stroke();
      }
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 60 + r * 0.3);
      g.addColorStop(0, `rgba(255,236,210,${0.9 * a})`); g.addColorStop(1, "rgba(255,90,190,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  }
  const ah = 1 - eSuave(pr(k, 62, 1));
  if (ah > 0.01) {
    const m = 40, bb = 26;
    ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.5 * ah})`; ctx.lineWidth = 1.5; ctx.beginPath();
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { ctx.moveTo(x, y + sy * bb); ctx.lineTo(x, y); ctx.lineTo(x + sx * bb, y); }
    ctx.stroke(); ctx.restore();
    texto(ctx, "TODO A LA VEZ", 72, 64, 15, `rgba(${RGB.crema},${0.6 * ah})`, { esp: 2 });
    texto(ctx, rot, W - 72, 64, 15, `rgba(${RGB.crema},${0.6 * ah})`, { alin: "right", esp: 2 });
    hud.forEach((s, i) => texto(ctx, s, 72, H - 64 - (hud.length - 1 - i) * 24, 15, `rgba(${RGB.crema},${(i === 0 ? 0.75 : 0.5) * ah})`, { esp: 2 }));
    texto(ctx, `${LOCO.bpm} LPM`, W - 72, H - 64, 15, `rgba(${RGB.crema},${0.75 * ah})`, { alin: "right", esp: 2 });
  }
  const imp = k < 62 && !pausa ? 0.55 * Math.exp(-fr * BEAT * 8) : k >= 63 && k < 65 ? 1.2 * Math.exp(-(k - 63) * BEAT * 3) : 0;
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: 0.42, expo: 0.9, aberr: 0.032 + 0.03 * imp, vineta: 0.62, grano: 0.05, scan: 0.2,
    curva: 0, esq: 0.03, impacto: imp, ruido: 0.6, flicker: 0, lineaY: -1, lineaA: 0, grade: 1.8, tiempo: t, halo: 0.8,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
