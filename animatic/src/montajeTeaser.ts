// Pulse montage in the language of the approved teaser: only the rule z -> z^2 + c, with the teaser's colouring,
// its cut logic (on every pulse the zoom jumps one step over a continuous advance and the image mode changes: full
// colour, lens or cream negative) and the teaser's retro post-process (imported unchanged from teaser-v1b).
import MONT from "./montaje.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { RGB, SANS, MONO, cl, eOut, eSuave, lerp, pr } from "./theme";

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

const L = MONT.latidos;
const LENTE = H * 0.42;
// Every shot shows a whole form. Mandelbrot: the full set, then twelve isolated mini-Mandelbrots found with Newton's
// method (herramientas/minibrots_aislados.py), each smaller than the one before: every beat goes one level deeper.
// Julia: thirteen whole sets, each a different world of the same rule.
const MINIS: [number, number, number][] = [
  [-1.7548777, 0.0, 0.019], [-0.1565202, 1.0322471, 0.00848], [-1.4760146, 0.0, 0.00517], [0.3592592, 0.6425137, 0.00481],
  [-1.6254137, 0.0, 0.00406], [-0.0442124, 0.986581, 0.00348], [0.4433256, 0.3729624, 0.003], [-1.2563679, 0.380321, 0.00288],
  [-1.1856112, 0.3030409, 0.00278], [-0.1054699, 0.9239995, 0.00237], [-0.1275, 0.9874609, 0.00195], [-1.0075479, 0.3107538, 0.00183],
];
const JULIAS: [number, number][] = [
  [-0.8, 0.156], [-0.123, 0.745], [-1.0, 0.0], [0.285, 0.01], [-0.39054, -0.58679], [-0.7269, 0.1889], [-0.835, -0.2321],
  [-0.4, 0.6], [0.355, 0.355], [-0.7, 0.27015], [-0.54, 0.54], [-0.162, 1.04], [0.37, 0.1],
];
// [mode, palette] per cut: full colour almost always, the cream negative only twice
const CORTES: [number, number][] = [[0, 0], [0, 1], [0, 2], [0, 0], [0, 1], [2, 0], [0, 2], [0, 0], [0, 1], [0, 2], [0, 1], [0, 0], [2, 1], [0, 2]];

const indice = (t: number) => {
  let i = 0;
  while (i + 1 < L.length && L[i + 1] <= t) i++;
  return i;
};
const golpe = (t: number) => {
  const i = indice(t);
  return t >= L[0] ? Math.exp(-(t - L[i]) * 6) : 0;
};

const plano = (t: number) => {
  const i = indice(t);
  const e = t - L[i];
  const dur = (i + 1 < L.length ? L[i + 1] : MONT.corte) - L[i];
  const p = cl(e / dur);
  const [modo, pal] = CORTES[i % CORTES.length];
  const fase = 0.11 * (t - L[0]) + 0.13 * i;
  const brillo = 0.86 + 0.1 * golpe(t);
  const empuje = 1.12 - 0.12 * eOut(p);
  if (i % 2 === 1) {
    const [jr, ji] = JULIAS[((i - 1) / 2) % JULIAS.length];
    // the world transforms live: c travels a small circle, so the shape twists and breathes while staying whole
    const julia: [number, number] = [jr + 0.035 * Math.cos(e * 2.6 + i), ji + 0.035 * Math.sin(e * 2.6 + i)];
    return { cx: 0, cy: 0, esc: (3.7 * empuje) / W, rot: 0.04 * e, julia, modo, pal, fase, brillo, maxIt: 300, nombre: "CONJUNTO DE JULIA · z → z² + c" };
  }
  if (i === 0) return { cx: -0.62, cy: 0, esc: (3.5 * empuje) / W, rot: 0, julia: undefined, modo, pal, fase, brillo, maxIt: 300, nombre: "CONJUNTO DE MANDELBROT · z → z² + c" };
  const [cx, cy, r] = MINIS[(i / 2 - 1) % MINIS.length];
  const ancho = r * 7.5 * empuje;
  return { cx, cy, esc: ancho / W, rot: 0, julia: undefined, modo, pal, fase, brillo, maxIt: Math.round(250 + 160 * Math.log10(2.8 / ancho)), nombre: `COPIA DEL CONJUNTO, ${Math.round(3.5 / ancho)} VECES MÁS PEQUEÑA` };
};

// the teaser's retro look, toned down so the fractal detail reads
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.032, vineta: 0.62, grano: 0.06, scan: 0.2, curva: 0.16, ruido: 1.2, flicker: 0.025, grade: 1.8, imp: 0.8, lineaA: 0.8 };

export const dibujarMontajeTeaser = (ctx: Ctx, t: number, frame: number) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  let rotulo = "";
  if (t >= L[0] && t < MONT.corte) {
    const P = plano(t);
    const l = pintarFractalTeaser(W, H, { cx: P.cx, cy: P.cy, esc: P.esc, rot: P.rot, julia: P.julia, modo: P.modo, lente: LENTE, fase: P.fase, paleta: PALETAS[P.pal], brillo: P.brillo, maxIt: P.maxIt, tiempo: t, onda: t - L[indice(t)] });
    ctx.drawImage(l, 0, 0, W, H);
    rotulo = P.nombre;
  }
  // silence, one heartbeat, then the whole set and the line; the rule; the title
  if (t >= MONT.calma) {
    const a = Math.min(eSuave(pr(t, MONT.calma, 2.4)), 1 - eSuave(pr(t, MONT.titulo - 0.4, 0.4)));
    const ancho = lerp(4.0, 3.4, eOut(pr(t, MONT.calma, 12)));
    const l = pintarFractalTeaser(W, H, { cx: -0.62, cy: 0, esc: ancho / W, rot: 0, modo: 0, lente: LENTE, fase: 0.04 * (t - MONT.calma), paleta: PALETAS[0], brillo: 0.9, maxIt: 300, tiempo: t * 0.5 });
    ctx.globalAlpha = a;
    ctx.drawImage(l, 0, 0, W, H);
    ctx.globalAlpha = 1;
    const ar = Math.min(eSuave(pr(t, MONT.regla, 0.8)), 1 - eSuave(pr(t, MONT.titulo - 0.4, 0.4)));
    if (ar > 0) texto(ctx, "z → z² + c", W / 2, H - 140, 56, `rgba(${RGB.crema},${ar})`, { fam: SANS, peso: 300, alin: "center" });
  }
  {
    const a = Math.min(eSuave(pr(t, MONT.titulo, 0.25)), 1 - eSuave(pr(t, MONT.total - 0.6, 0.6)));
    if (a > 0) {
      const esc = lerp(1.06, 1.0, eOut(pr(t, MONT.titulo, 1.6)));
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(esc, esc);
      texto(ctx, "LA FRONTERA", 13, 44, 128, `rgba(${RGB.crema},${a})`, { fam: SANS, peso: 600, alin: "center", esp: 26 });
      ctx.restore();
    }
  }
  if (rotulo) texto(ctx, rotulo, W - 72, 64, 15, `rgba(${RGB.crema},0.5)`, { alin: "right", esp: 2 });
  // the teaser's retro look, reacting to every pulse
  const imp = golpe(t) * (t < MONT.corte ? 1 : 0);
  const ib = indice(t);
  const linea = t >= L[0] && t < MONT.corte && ib % 4 === 0 && t - L[ib] < 0.4;
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.86, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: RETRO.curva, esq: RETRO.curva, impacto: imp * RETRO.imp, ruido: RETRO.ruido, flicker: RETRO.flicker,
    lineaY: linea ? (t - L[ib]) / 0.4 : -1, lineaA: linea ? RETRO.lineaA * Math.sin((Math.PI * (t - L[ib])) / 0.4) : 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) {
    ctx.save();
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(pp, 0, 0, W, H);
    ctx.restore();
  }
};
