// Pulse montage: the fractals of life (computed) and of the rule z -> z^2 + c, cut on an accelerating heartbeat,
// with a cinematic camera: tilted planes in perspective, depth of field, growth on screen and floating light.
import MONT from "./montaje.json";
import { acabadoCine } from "./post";
import type { Datos } from "./escena";
import { pintarMandel } from "./mandel";
import { pintarPlano } from "./plano";
import { RGB, SANS, MONO, cl, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = 1920;
export const H = 1080;
type Ctx = CanvasRenderingContext2D;

const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  ctx.font = `${op.peso ?? 400} ${tam}px "${op.fam ?? MONO}"`;
  ctx.fillStyle = color;
  ctx.textAlign = op.alin ?? "left";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 0}px`;
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};

type Cam = { c0: [number, number]; c1: [number, number]; z0: number; z1: number; i0: number; i1: number; r0: number; r1: number };
type Toma =
  | { tipo: "plano"; img: string; crece: boolean; cam: Cam; rotulo: string; flash?: boolean }
  | { tipo: "mandel"; cx: number; cy: number; ancho: number; rot: number; fase: number; julia?: [number, number]; rotulo: string }
  | { tipo: "latido"; rotulo: string };

export const IMAGENES = ["relampago", "venas", "neuronas", "pulmon", "romanesco", "rio", "cosmos", "mariposa", "arbol", "costa"];
export const CRECEN = ["relampago", "venas", "neuronas", "pulmon", "romanesco", "rio", "arbol", "costa"];
export const CON_FONDO = ["relampago", "venas", "neuronas", "pulmon", "rio"];

const ROT = {
  venas: "RETINA · VASOS QUE SE DIVIDEN CON LA LEY DE MURRAY · SIMULADO",
  neuronas: "NEURONAS · COMO EN MICROSCOPÍA DE FLUORESCENCIA · SIMULADO",
  romanesco: "FILOTAXIS · ÁNGULO DE ORO, 137,5°",
  cosmos: "RED CÓSMICA · APROXIMACIÓN DE ZEL'DOVICH",
  relampago: "RAYO · MODELO DE RUPTURA DIELÉCTRICA (NIEMEYER, 1984)",
  pulmon: "ÁRBOL BRONQUIAL · 11 GENERACIONES · SIMULADO",
  rio: "RED DE RÍOS VISTA DESDE ARRIBA · SIMULADA",
};
// Version A: the original C language with more variety. Version B: the depth comes from the cuts (each return of the
// Mandelbrot is four times deeper into the same point). No shot is repeated in either.
const TOMAS_A: Toma[] = [
  { tipo: "mandel", cx: -0.62, cy: 0, ancho: 3.6, rot: 0, fase: 0.62, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "plano", img: "relampago", crece: true, flash: true, rotulo: ROT.relampago, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.5, z1: 0.5, i0: 0, i1: 0, r0: 0, r1: 0 } },
  { tipo: "plano", img: "pulmon", crece: true, rotulo: ROT.pulmon, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.5, z1: 0.5, i0: 0, i1: 0, r0: 0, r1: 0 } },
  { tipo: "plano", img: "rio", crece: true, rotulo: ROT.rio, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.5, z1: 0.5, i0: 0, i1: 0, r0: 3.14159, r1: 3.14159 } },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 3.1, rot: 0.2, fase: 0.1, julia: [-0.8, 0.156], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: -0.7453, cy: 0.1127, ancho: 0.012, rot: -0.4, fase: 0.3, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.9, rot: -0.3, fase: 0.5, julia: [-0.123, 0.745], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "plano", img: "venas", crece: true, rotulo: ROT.venas, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.34, z1: 0.34, i0: 0, i1: 0, r0: 0, r1: 0 } },
  { tipo: "mandel", cx: -0.1011, cy: 0.9563, ancho: 0.01, rot: 0.3, fase: 0.4, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.6, rot: 0.9, fase: 0.2, julia: [0.285, 0.01], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: -0.7436439, cy: 0.1318259, ancho: 0.004, rot: -0.9, fase: 0.55, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "plano", img: "neuronas", crece: true, rotulo: ROT.neuronas, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.36, z1: 0.36, i0: 0, i1: 0, r0: 0, r1: 0 } },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.7, rot: -0.6, fase: 0.7, julia: [-0.7269, 0.1889], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: 0.3245, cy: 0.04855, ancho: 0.006, rot: 0.5, fase: 0.62, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.8, rot: 0.4, fase: 0.9, julia: [-0.39054, -0.58679], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "plano", img: "romanesco", crece: true, rotulo: ROT.romanesco, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.34, z1: 0.34, i0: 0, i1: 0, r0: 0, r1: 0 } },
  { tipo: "mandel", cx: -0.761574, cy: -0.0847596, ancho: 0.008, rot: 0.2, fase: 0.15, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 3.2, rot: 0, fase: 0.35, julia: [-1.0, 0.0], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: 0.42884, cy: -0.231345, ancho: 0.008, rot: 0.9, fase: 0.35, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "plano", img: "cosmos", crece: false, rotulo: ROT.cosmos, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.36, z1: 0.36, i0: 0, i1: 0, r0: 0, r1: 0 } },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.6, rot: 0.7, fase: 0.05, julia: [0.355, 0.355], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: -0.235125, cy: 0.827215, ancho: 0.008, rot: 0.3, fase: 0.9, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.8, rot: -0.2, fase: 0.45, julia: [-0.835, -0.2321], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: 0.00164372, cy: -0.82246763, ancho: 0.01, rot: -0.4, fase: 0.2, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.8, rot: -0.5, fase: 0.25, julia: [-0.7, 0.27015], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: -0.55, cy: 0.63, ancho: 0.02, rot: 0.2, fase: 0.1, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
];
const TOMAS_B: Toma[] = [
  { tipo: "mandel", cx: -0.62, cy: 0, ancho: 3.6, rot: 0, fase: 0.62, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "plano", img: "relampago", crece: true, flash: true, rotulo: ROT.relampago, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.5, z1: 0.5, i0: 0, i1: 0, r0: 0, r1: 0 } },
  { tipo: "plano", img: "pulmon", crece: true, rotulo: ROT.pulmon, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.5, z1: 0.5, i0: 0, i1: 0, r0: 0, r1: 0 } },
  { tipo: "plano", img: "rio", crece: true, rotulo: ROT.rio, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.5, z1: 0.5, i0: 0, i1: 0, r0: 3.14159, r1: 3.14159 } },
  { tipo: "mandel", cx: -0.735, cy: 0.12, ancho: 0.9, rot: -0.2, fase: 0.69, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 3.1, rot: -0.6, fase: 0.1, julia: [-0.8, 0.156], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: -0.743643887, cy: 0.131825904, ancho: 0.22, rot: -0.4, fase: 0.76, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "plano", img: "venas", crece: true, rotulo: ROT.venas, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.46, z1: 0.46, i0: 0, i1: 0, r0: 0, r1: 0 } },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.9, rot: -0.3, fase: 0.23, julia: [-0.123, 0.745], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: -0.743643887, cy: 0.131825904, ancho: 0.055, rot: -0.6000000000000001, fase: 0.8300000000000001, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.6, rot: 0.0, fase: 0.36, julia: [0.285, 0.01], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "plano", img: "neuronas", crece: true, rotulo: ROT.neuronas, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.34, z1: 0.34, i0: 0, i1: 0, r0: 0, r1: 0 } },
  { tipo: "mandel", cx: -0.743643887, cy: 0.131825904, ancho: 0.014, rot: -0.8, fase: 0.9, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.7, rot: 0.3, fase: 0.49, julia: [-0.7269, 0.1889], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: -0.743643887, cy: 0.131825904, ancho: 0.0035, rot: -1.0, fase: 0.97, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "plano", img: "romanesco", crece: true, rotulo: ROT.romanesco, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.34, z1: 0.34, i0: 0, i1: 0, r0: 0, r1: 0 } },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.8, rot: 0.6, fase: 0.62, julia: [-0.39054, -0.58679], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: -0.743643887, cy: 0.131825904, ancho: 0.0012, rot: -1.2000000000000002, fase: 1.04, rotulo: "CONJUNTO DE MANDELBROT · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 3.2, rot: -0.6, fase: 0.75, julia: [-1.0, 0.0], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "plano", img: "cosmos", crece: false, rotulo: ROT.cosmos, cam: { c0: [0.5, 0.5], c1: [0.5, 0.5], z0: 0.36, z1: 0.36, i0: 0, i1: 0, r0: 0, r1: 0 } },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.6, rot: -0.3, fase: 0.88, julia: [0.355, 0.355], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.8, rot: 0.0, fase: 1.01, julia: [-0.835, -0.2321], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.8, rot: 0.3, fase: 1.1400000000000001, julia: [-0.4, 0.6], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.8, rot: 0.6, fase: 1.27, julia: [-0.7, 0.27015], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.8, rot: 0.6, fase: 0.8, julia: [0.37, 0.1], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
  { tipo: "mandel", cx: 0, cy: 0, ancho: 2.7, rot: -0.4, fase: 0.95, julia: [-0.54, 0.54], rotulo: "CONJUNTO DE JULIA · z → z² + c" },
];

// ─── the heartbeat landscape (real data), compact version of direction B ───────────────────────────────────────
let filas: Float32Array[] | null = null;
const prepararFilas = (D: Datos) => {
  if (filas) return filas;
  const S = D.sano, fin = S.t[S.t.length - 1], N = 220, MIN = 8;
  const media = S.rr.reduce((a, b) => a + b, 0) / S.rr.length;
  filas = [];
  let j = 0;
  for (let f = 0; f < Math.floor(fin / (MIN * 60)); f++) {
    const fila = new Float32Array(N);
    for (let k = 0; k < N; k++) {
      const tt = (f * MIN + (MIN * k) / (N - 1)) * 60;
      while (j < S.t.length - 1 && S.t[j + 1] < tt) j++;
      fila[k] = S.rr[j] - media;
      if (k > 1) fila[k - 1] = (fila[k - 2] + 2 * fila[k - 1] + fila[k]) / 4;
    }
    filas.push(fila);
  }
  return filas;
};
const paisaje = (ctx: Ctx, D: Datos, avance: number, latido: number) => {
  const F = prepararFilas(D);
  const DZ = 0.22, camZ = lerp(18, 26, avance), camY = 1.15, inclina = 0.22, foco = 1150;
  ctx.save();
  ctx.translate(W / 2, H / 2 - 40);
  ctx.rotate(Math.sin(avance * 2) * 0.03);
  const primera = Math.floor(camZ / DZ);
  for (let f = Math.min(F.length - 1, primera + 110); f >= primera; f--) {
    const z = f * DZ - camZ + 0.6;
    if (z <= 1.1) continue;
    const prof = cl(1 - z / (110 * DZ));
    ctx.beginPath();
    let ok = false;
    for (let k = 0; k < F[f].length; k++) {
      const X = lerp(-3.2, 3.2, k / (F[f].length - 1));
      const Y = F[f][k] * 2.3 * Math.exp(-(X * X) / 3.2) * (1 + 0.4 * latido * Math.exp(-((z - 2.2) ** 2) / 2));
      const yC = (Y - camY) * Math.cos(inclina) + z * Math.sin(inclina);
      const zC = z * Math.cos(inclina) - (Y - camY) * Math.sin(inclina);
      if (zC <= 0.08) continue;
      const sx = (X * foco) / zC, sy = (-yC * foco) / zC;
      if (!ok) { ctx.moveTo(sx, sy); ok = true; } else ctx.lineTo(sx, sy);
    }
    if (!ok) continue;
    ctx.save();
    ctx.lineTo(W, H * 2); ctx.lineTo(-W, H * 2); ctx.closePath();
    ctx.fillStyle = "#06050d"; ctx.fill();
    ctx.restore();
    const cerca = Math.pow(prof, 1.4);
    const col = cerca > 0.6 ? RGB.crema : cerca > 0.3 ? RGB.durazno : RGB.magenta;
    ctx.strokeStyle = `rgba(${col},${eSuave(cl((z - 1.1) / 1.2)) * (0.12 + 0.88 * cerca)})`;
    ctx.lineWidth = 0.7 + 2.0 * cerca;
    ctx.stroke();
  }
  ctx.restore();
};

const titulo = (ctx: Ctx, t: number, t0: number, fin: number) => {
  const a = Math.min(eSuave(pr(t, t0, 0.25)), 1 - eSuave(pr(t, fin - 0.6, 0.6)));
  if (a <= 0) return;
  const esc = lerp(1.06, 1.0, eOut(pr(t, t0, 1.6)));
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(esc, esc);
  texto(ctx, "LA FRONTERA", 13, 44, 128, `rgba(${RGB.crema},${a})`, { fam: SANS, peso: 600, alin: "center", esp: 26 });
  ctx.restore();
};

export const dibujarMontaje = (ctx: Ctx, D: Datos, t: number, frame: number, variante: "A" | "B" = "A") => {
  const TOMAS = variante === "A" ? TOMAS_A : TOMAS_B;
  ctx.fillStyle = "#050409";
  ctx.fillRect(0, 0, W, H);
  const L = MONT.latidos;
  let rotulo = "";
  if (t >= L[0] && t < MONT.corte) {
    let i = 0;
    while (i + 1 < L.length && L[i + 1] <= t) i++;
    const T = TOMAS[i % TOMAS.length];
    const primera = i < TOMAS.length;
    const e = t - L[i];
    const dur = (i + 1 < L.length ? L[i + 1] : MONT.corte) - L[i];
    const p = cl(e / dur);
    const flash = Math.exp(-e * 9);
    const golpe = 1;
    let lienzo: HTMLCanvasElement | null = null;
    if (T.tipo === "plano") {
      const C = T.cam;
      // lightning: the leader advances dimly, step by step, and the whole channel flashes when it touches the ground
      const crece = T.crece && primera ? (T.flash ? lerp(0.02, 1.08, cl(e / (dur * 0.62))) : lerp(0.02, 1.08, eOut(cl(e / Math.max(0.35, dur * 0.9))))) : 1.2;
      const golpeRayo = dur * 0.62;
      const rayo = T.flash ? (e < golpeRayo ? 0.55 : 1 + 1.8 * Math.exp(-(e - golpeRayo) * 4)) : 1;
      // same language as the first montage: frontal, a slow push in, an almost still rotation, a flash on the beat
      lienzo = pintarPlano(W, H, {
        img: T.img, crec: T.crece ? `${T.img}-g` : undefined, fondo: CON_FONDO.includes(T.img) ? `${T.img}-f` : undefined, aspImg: 16 / 9,
        centro: [C.c0[0], C.c0[1]], zoom: C.z0 * Math.exp(-0.35 * p), rot: C.r0 + e * 0.04, inclina: 0,
        foco: 0, crece, brillo: (1 + 0.6 * flash) * rayo,
      });
    } else if (T.tipo === "mandel") {
      const empujeZ = Math.exp(-0.35 * p);
      const julia: [number, number] | undefined = T.julia ? [T.julia[0] + 0.02 * Math.sin(t * 1.7), T.julia[1] + 0.02 * Math.cos(t * 1.3)] : undefined;
      const [cx, cy] = [T.cx, T.cy];
      lienzo = pintarMandel(W, H, { cx, cy, ancho: T.ancho * empujeZ, fase: T.fase + t * 0.05, respira: 1, iter: 700, rot: T.rot + e * 0.12, julia, brillo: 1 + 0.9 * flash });
    } else {
      paisaje(ctx, D, p, flash);
    }
    if (lienzo) {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(golpe, golpe);
      ctx.drawImage(lienzo, -W / 2, -H / 2, W, H);
      ctx.restore();
    }
    rotulo = T.rotulo;
  }
  // silence, one heartbeat, then the whole set and the line; the rule; the title
  if (t >= MONT.calma) {
    const a = Math.min(eSuave(pr(t, MONT.calma, 2.4)), 1 - eSuave(pr(t, MONT.titulo - 0.4, 0.4)));
    const lienzo = pintarMandel(W, H, { cx: -0.62, cy: 0, ancho: lerp(4.1, 3.4, eOut(pr(t, MONT.calma, 12))), fase: 0.62 + (t - MONT.calma) * 0.02, respira: 1, iter: 400, rot: lerp(-0.06, 0.02, eIO(pr(t, MONT.calma, 14))) });
    ctx.globalAlpha = a;
    ctx.drawImage(lienzo, 0, 0, W, H);
    ctx.globalAlpha = 1;
    const ar = Math.min(eSuave(pr(t, MONT.regla, 0.8)), 1 - eSuave(pr(t, MONT.titulo - 0.4, 0.4)));
    if (ar > 0) texto(ctx, "z → z² + c", W / 2, H - 120, 54, `rgba(${RGB.crema},${ar})`, { fam: SANS, peso: 300, alin: "center" });
  }
  titulo(ctx, t, MONT.titulo, MONT.total);
  // film finish on the GPU, then the small labels stay crisp on top
  ctx.drawImage(acabadoCine(ctx.canvas, t + frame * 0.0001), 0, 0, W, H);
  texto(ctx, variante === "A" ? "VERSIÓN A" : "VERSIÓN B3 · ACABADO DE CINE", 64, 56, 14, `rgba(${RGB.crema},0.4)`, { esp: 3 });
  if (rotulo) texto(ctx, rotulo, W - 64, 56, 14, `rgba(${RGB.crema},0.55)`, { alin: "right", esp: 2 });
};
