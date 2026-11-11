// Preview «vivo»: no cuts at all. The Mandelbrot set turns into a Julia set by rotating the slice of the
// four-dimensional object they both belong to; then c travels along the border so the world divides into islands and
// joins again like a living cell; then c drifts from place to place and the plane becomes living tissue; then it all
// folds back into the Mandelbrot set. Only the rule z -> z^2 + c, teaser colouring and the teaser's finish.
import V from "./vivo.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { MONO, RGB, cl, eIO, lerp, pr } from "./theme";

export const W = 1920;
export const H = 1080;
type Ctx = CanvasRenderingContext2D;
const SS = 2;
const B = V.latidos;
// a point of the main cardioid's border (r = 1) or just outside (r > 1): c = r e^{iθ}/2 − r² e^{2iθ}/4
const cardioide = (th: number, r: number): [number, number] => [
  (r * Math.cos(th)) / 2 - (r * r * Math.cos(2 * th)) / 4,
  (r * Math.sin(th)) / 2 - (r * r * Math.sin(2 * th)) / 4,
];
const T = { mezcla: [3.0, 6.5], viaje: [6.5, 11.0], campo: [11.0, 14.5], vuelta: [14.5, 16.5] };

export const dibujarVivo = (ctx: Ctx, t: number, frame: number) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  if (t >= B[0]) {
    const s = eIO(pr(t, T.mezcla[0], T.mezcla[1] - T.mezcla[0])) * (1 - eIO(pr(t, T.vuelta[0], T.vuelta[1] - T.vuelta[0])));
    // c travels along the border, sometimes stepping outside: the world splits into islands and joins again
    const u = pr(t, T.mezcla[0], T.campo[1] - T.mezcla[0]);
    const th = lerp(1.75, 2.75, u) + 0.25 * Math.sin(t * 0.7);
    const r = 1.025 + 0.04 * Math.sin(t * 1.9) + 0.015 * Math.sin(t * 3.3);
    const c = cardioide(th, r);
    const campo = Math.min(cl((t - T.campo[0]) / 1.5), 1 - cl((t - (T.campo[1] - 0.5)) / 1.5));
    const ancho = lerp(lerp(3.6, 3.3, cl((t - B[0]) / 2)), 3.2, s);
    const cx = lerp(-0.6, 0, s);
    const i = (() => { let k = 0; while (k + 1 < B.length && B[k + 1] <= t) k++; return k; })();
    const golpe = Math.exp(-(t - B[i]) * 5);
    const l = pintarFractalTeaser(W * SS, H * SS, {
      cx, cy: 0, esc: ancho / (W * SS), rot: 0.05 * Math.sin(t * 0.3), julia: undefined, modo: 0, lente: 1e9,
      fase: 0.05 * t, paleta: PALETAS[0], brillo: 0.88 + 0.08 * golpe, maxIt: 320, tiempo: t, mezcla: s, cMezcla: c, campo, interior: lerp(1, 0.28, s),
    });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.globalAlpha = Math.min(1, (t - B[0]) / 0.08);
    ctx.drawImage(l, 0, 0, W, H);
    ctx.globalAlpha = 1;
    const etapa = t < T.mezcla[0] ? "MANDELBROT" : t < T.viaje[0] ? "EL CORTE GIRA HACIA UN JULIA" : t < T.campo[0] ? "c RECORRE EL BORDE: SE DIVIDE Y SE JUNTA" : t < T.vuelta[0] ? "c CAMBIA DE UN LUGAR A OTRO" : "VUELTA AL MANDELBROT";
    ctx.font = `500 15px "${MONO}"`;
    ctx.fillStyle = `rgba(${RGB.crema},0.55)`;
    ctx.textAlign = "right";
    ctx.fillText(`MUESTRA · ${etapa}`, W - 72, 64);
  }
  const i = (() => { let k = 0; while (k + 1 < B.length && B[k + 1] <= t) k++; return k; })();
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: 0.36, expo: 0.86, aberr: 0.03, vineta: 0.62, grano: 0.05, scan: 0.2, curva: 0.16, esq: 0.16,
    impacto: t >= B[0] ? 0.5 * Math.exp(-(t - B[i]) * 7) : 0, ruido: 0.6, flicker: 0, lineaY: -1, lineaA: 0, grade: 1.8, tiempo: t, halo: 0.75,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
