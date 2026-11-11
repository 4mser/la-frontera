// Pulse montage as motion graphics, in the teaser's language: the camera never moves; every beat presents the rule
// z -> z^2 + c through a different device (nested magnifiers, triptych, 3x3 mosaic, diagonal split, kaleidoscope,
// sliding bands, honeycomb, type as a mask). The Mandelbrot is one continuous dive that keeps going every time it
// returns. Teaser colouring and the teaser's retro post-process.
import MONT from "./montaje.json";
import COS from "./cosmos.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { RGB, SANS, MONO, cl, eIO, eOut, eSuave, lerp, num, pr } from "./theme";

// the frame size comes from formato.json (16:9, 9:16 for TikTok, 4:5 for posts): one bundle per format
import FORMATO from "./formato.json";
export const W = FORMATO.W;
export const H = FORMATO.H;
// tall frames stack the triptychs, scale the large type and keep the HUD clear of the app's buttons
const VERTICAL = H > W * 1.2;
const K_TEXTO = Math.min(1, W / 1500);
// in a 9:16 frame, the space the apps cover with their buttons (above) and captions (below)
const SEGURO_ABAJO = H / W > 1.5 ? 380 : 0, SEGURO_ARRIBA = H / W > 1.5 ? 160 : 0;
// the k-th panel of a triptych: three columns, or three rows in a tall frame
const panelRect = (k: number, g: number): [number, number, number, number] => {
  if (VERTICAL) { const ph = (H - 4 * g) / 3; return [g, g + k * (ph + g), W - 2 * g, ph]; }
  const pw = (W - 4 * g) / 3;
  return [g + k * (pw + g), g, pw, H - 2 * g];
};
type Ctx = CanvasRenderingContext2D;
const L = MONT.latidos;
const TAU = Math.PI * 2;

const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  ctx.font = `${op.peso ?? 400} ${tam}px "${op.fam ?? MONO}"`;
  ctx.fillStyle = color;
  ctx.textAlign = op.alin ?? "left";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 0}px`;
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};

// ─── what to paint ─────────────────────────────────────────────────────────────────────────────────────────────
type Planeta = { x: number; y: number; r: number; giro: number; inclina: number };
type Vista = { onda?: number; maxIt?: number; cx: number; cy: number; ancho: number; julia?: [number, number]; pal: number; fase: number; rot?: number; modo?: number; regla?: number; planeta?: Planeta; mezcla?: number; cMezcla?: [number, number]; campo?: number; interior?: number; tiempo?: number };
// one continuous dive into the seahorse valley, at a constant rate (hypnotic, never jerky)
const C_ZOOM: [number, number] = [-0.743643887, 0.131825904];
const T0 = L[0], T1 = MONT.corte;
// each time a magnifier opens to fill the screen, the dive jumps six times deeper (see SALTOS)
const SALTOS: number[] = [];
const extra = (t: number) => SALTOS.reduce((a, s) => (t >= s ? a * 6 : a), 1);
const buceo = (t: number, factor = 1): Vista => {
  const u = cl((t - T0) / (T1 - T0));
  const ancho = 3.2 * Math.exp(-Math.log(3.2 / 0.032) * u) / factor / extra(t);
  const lleva = eIO(cl(u * 5));
  return { cx: lerp(-0.6, C_ZOOM[0], lleva), cy: lerp(0, C_ZOOM[1], lleva), ancho, pal: 0, fase: 0.05 * t };
};
// the thirteen Julia worlds chosen in the previous versions; each one transforms live (c on a small circle)
const JULIAS: [number, number][] = [
  [-0.8, 0.156], [-0.123, 0.745], [-1.0, 0.0], [0.285, 0.01], [-0.39054, -0.58679], [-0.7269, 0.1889], [-0.835, -0.2321],
  [-0.4, 0.6], [0.355, 0.355], [-0.7, 0.27015], [-0.54, 0.54], [-0.162, 1.04], [0.37, 0.1], [-0.75, 0.11],
  [-1.31, 0.0], [-0.70176, -0.3842], [0.26, 0.0015], [-0.12, 0.76], [-0.745, 0.113], [0.32, 0.043],
];
const mundo = (k: number, t: number, pal: number, ancho = 3.3): Vista => {
  const [jr, ji] = JULIAS[((Math.round(k) % JULIAS.length) + JULIAS.length) % JULIAS.length];
  return { cx: 0, cy: 0, ancho, julia: [jr + 0.016 * Math.cos(t * 0.7 + k), ji + 0.016 * Math.sin(t * 0.7 + k)], pal, fase: 0.08 * t + k * 0.3 };
};

// paints a view into a rectangle of the canvas
// every fractal is computed at twice the resolution and reduced: fine borders stop shimmering between frames
const SS = 2;
const pinta = (ctx: Ctx, x: number, y: number, w: number, h: number, V0: Vista, alfa = 1) => {
  const pw = Math.max(8, Math.round(w * SS)), ph = Math.max(8, Math.round(h * SS));
  const V = V0.planeta ? { ...V0, planeta: { ...V0.planeta, x: V0.planeta.x * SS, y: V0.planeta.y * SS, r: V0.planeta.r * SS } } : V0;
  // ancho: the width a 16:9 frame would show; narrow or square rectangles keep that scale across their short side
  const l = pintarFractalTeaser(pw, ph, { cx: V.cx, cy: V.cy, esc: V.ancho / Math.min(pw, (ph * 16) / 9), rot: V.rot ?? 0, julia: V.julia, modo: V.modo ?? 0, lente: 1e9, fase: V.fase, paleta: PALETAS[V.pal], brillo: 0.9, maxIt: V.maxIt ?? (V.julia || V.planeta ? 300 : Math.round(250 + 160 * Math.log10(2.8 / V.ancho))), tiempo: V.tiempo ?? 0, regla: V.regla, planeta: V.planeta, mezcla: V.mezcla, cMezcla: V.cMezcla, campo: V.campo, interior: V.interior, onda: V.onda });
  ctx.globalAlpha = alfa;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(l, x, y, w, h);
  ctx.globalAlpha = 1;
};
const recortar = (ctx: Ctx, camino: () => void, dibujo: () => void) => {
  ctx.save();
  ctx.beginPath();
  camino();
  ctx.clip();
  dibujo();
  ctx.restore();
};
const trazo = (ctx: Ctx, camino: () => void, a = 0.7, ancho = 2) => {
  ctx.save();
  ctx.strokeStyle = `rgba(${RGB.crema},${a})`;
  ctx.lineWidth = ancho;
  ctx.beginPath();
  camino();
  ctx.stroke();
  ctx.restore();
};

// ─── the devices ───────────────────────────────────────────────────────────────────────────────────────────────
type Res = { rotulo: string; hud: string[] };
type Disp = (ctx: Ctx, t: number, e: number, i: number, dur: number) => Res;
// HUD readouts
const aumento = (V: Vista) => `AUMENTO ×${Math.round(3.2 / V.ancho).toLocaleString("es-CL")}`;
const cTexto = (c: [number, number]) => `c = ${num(c[0], 4)} ${c[1] < 0 ? "−" : "+"} ${num(Math.abs(c[1]), 4)}i`;
const hudBuceo = (V: Vista) => [aumento(V), `CENTRO ${num(V.cx, 5)} + ${num(V.cy, 5)}i`];
const hudJulia = (V: Vista) => [cTexto(V.julia!), "CONJUNTO DE JULIA · SE TRANSFORMA EN VIVO"];

const pleno: Disp = (ctx, t) => {
  const V = buceo(t);
  pinta(ctx, 0, 0, W, H, V);
  return { rotulo: "CONJUNTO DE MANDELBROT · z → z² + c", hud: hudBuceo(V) };
};
const plenoJulia: Disp = (ctx, t, e, i) => {
  // after a triptych or a mosaic, it continues the world that opened to fill the screen
  const previo = SEQ[i - 1]?.[0];
  const V = previo === triptico ? mundo(i - 1 + 4, t, 1, 3.1) : previo === mosaico ? mundo(4 + i - 1, t, 1, 3.3) : mundo(i, t, i % 3, 4.3);
  pinta(ctx, 0, 0, W, H, V);
  return { rotulo: "CONJUNTO DE JULIA · z → z² + c", hud: hudJulia(V) };
};
// nested magnifiers: the same point, 6 and 36 times deeper, all diving together
const lupas: Disp = (ctx, t, e, i, dur) => {
  pinta(ctx, 0, 0, W, H, buceo(t));
  const radios = [H * 0.36, H * 0.17];
  // exit: the outer lens grows until it covers the screen; the next shot is six times deeper
  const sale = eIO(cl((e - dur * 0.7) / (dur * 0.3)));
  radios.forEach((R, k) => {
    const r = R * eOut(cl((e - 0.25 * k) / 0.7)) * (k === 0 ? lerp(1, Math.hypot(W, H) / 2 / R, sale) : 1);
    if (r < 2) return;
    const V = { ...buceo(t, Math.pow(6, k + 1)), pal: (k + 1) % 3 };
    // inside the circle the scale is 6^(k+1) finer around the same centre: a true magnifier
    recortar(ctx, () => ctx.arc(W / 2, H / 2, r, 0, TAU), () => pinta(ctx, W / 2 - r, H / 2 - r, 2 * r, 2 * r, { ...V, ancho: (V.ancho * 2 * r) / W }));
    trazo(ctx, () => ctx.arc(W / 2, H / 2, r, 0, TAU), 0.75 * (1 - sale * (k === 0 ? 1 : 0)), 2.4);
  });
  return { rotulo: "LA MISMA REGIÓN, 6 Y 36 VECES MÁS ADENTRO", hud: [aumento(buceo(t)), `LUPAS ×6 · ×36`] };
};
// three vertical panels sliding in, each a Julia world transforming
const triptico: Disp = (ctx, t, e, i, dur) => {
  const g = 14, pw = (W - 4 * g) / 3;
  const sale = eIO(cl((e - dur * 0.68) / (dur * 0.32)));
  for (const k of [0, 2, 1]) {
    // panels start already in view and settle, so the frame is never empty
    const p = 0.55 + 0.45 * eOut(cl((e - 0.06 * k) / Math.min(0.4, dur * 0.4)));
    let x = g + k * (pw + g), y = g + (1 - p) * H * 0.6, w = pw, h = H - 2 * g;
    if (k === 1) { x = lerp(x, 0, sale); y = lerp(y, 0, sale); w = lerp(w, W, sale); h = lerp(h, H, sale); }
    const V = mundo(i + k * 4, t, k, 3.1);
    recortar(ctx, () => ctx.rect(x, y, w, h), () => pinta(ctx, x, y, w, h, { ...V, ancho: V.ancho * (k === 1 ? lerp(1, 1, sale) : 1) }));
  }
  return { rotulo: "TRES MUNDOS DE LA MISMA REGLA", hud: [cTexto(mundo(i + 4, t, 1).julia!), "TRES VALORES DE c"] };
};
// 3x3 mosaic: nine Julia worlds from neighbouring points of the border, popping in as a cascade
const mosaico: Disp = (ctx, t, e, i, dur) => {
  const g = 10, cw = (W - 4 * g) / 3, ch = (H - 4 * g) / 3;
  const sale = eIO(cl((e - dur * 0.68) / (dur * 0.32)));
  for (const k of [0, 1, 2, 3, 5, 6, 7, 8, 4]) {
    const f = Math.floor(k / 3), c = k % 3;
    const p = 0.65 + 0.35 * eOut(cl((e - 0.03 * k) / 0.25));
    let x = g + c * (cw + g), y = g + f * (ch + g), w0 = cw, h0 = ch;
    if (k === 4) { x = lerp(x, 0, sale); y = lerp(y, 0, sale); w0 = lerp(cw, W, sale); h0 = lerp(ch, H, sale); }
    const s = lerp(0.6, 1, p);
    const w = w0 * s, h = h0 * s;
    recortar(ctx, () => ctx.rect(x + (w0 - w) / 2, y + (h0 - h) / 2, w, h), () => pinta(ctx, x, y, w0, h0, mundo(k + i, t, k === 4 ? 1 : k % 3, 3.3), p));
  }
  return { rotulo: "NUEVE PUNTOS VECINOS DEL BORDE, NUEVE MUNDOS", hud: [cTexto(mundo(4 + i, t, 1).julia!), "NUEVE VALORES DE c"] };
};
// diagonal split sweeping across: two worlds
const diagonal: Disp = (ctx, t, e, i, dur) => {
  pinta(ctx, 0, 0, W, H, mundo(i + 2, t, 1, 3.5));
  const p = eIO(cl(e / (dur * 0.8)));
  const x0 = lerp(-W * 0.3, W * 0.38, p), x1 = x0 + W * 0.42;
  const camino = () => { ctx.moveTo(x0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(x1 - W * 0.24, H); ctx.closePath(); };
  recortar(ctx, camino, () => pinta(ctx, 0, 0, W, H, mundo(i + 9, t, 2, 3.5)));
  trazo(ctx, () => { ctx.moveTo(x0, 0); ctx.lineTo(x1 - W * 0.24, H); }, 0.85, 2.4);
  return { rotulo: "DOS MUNDOS DE LA MISMA REGLA", hud: [cTexto(mundo(i + 2, t, 1).julia!), cTexto(mundo(i + 9, t, 2).julia!)] };
};
// kaleidoscope: one Julia mirrored in six wedges, turning
let cuna: HTMLCanvasElement | null = null;
const caleido: Disp = (ctx, t, e, i, dur) => {
  const R = Math.hypot(W, H) / 2;
  const n = 6, a = TAU / n;
  if (!cuna) { cuna = document.createElement("canvas"); cuna.width = 1100; cuna.height = 1100; }
  const cc = cuna.getContext("2d")!;
  cc.clearRect(0, 0, 1100, 1100);
  pinta(cc, 0, 0, 1100, 1100, mundo(i + 5, t, 2, 1.7));
  let giro = 0;
  for (let j = 0; j < SEQ[i][1]; j++) giro += (Math.PI / 6) * enGolpe(t, i, j, 16);
  for (let k = 0; k < n; k++) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(giro + k * a);
    if (k % 2) ctx.scale(1, -1);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.arc(0, 0, R, -a / 2 - 0.004, a / 2 + 0.004); ctx.closePath();
    ctx.clip();
    ctx.drawImage(cuna, 0, -550, 1100, 1100);
    ctx.restore();
  }
  // entrance: an iris opens from the centre
  const ab = 0.25 + 0.75 * enGolpe(t, i, 0, 18);
  if (ab < 1) { ctx.fillStyle = "#020306"; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, R * ab, 0, TAU, true); ctx.fill("evenodd"); }
  return { rotulo: "UN MUNDO DE JULIA EN SEIS ESPEJOS", hud: [cTexto(mundo(i + 5, t, 2).julia!), "SIMETRÍA DE SEIS ESPEJOS"] };
};
let capasPanal: HTMLCanvasElement[] | null = null;
// honeycomb: hexagons light up in a wave, alternating the dive and a world
const panal: Disp = (ctx, t, e, i) => {
  const r = 150, hw = Math.sqrt(3) * r;
  const [lx, ly, la] = LUGARES[11];
  const V1: Vista = { cx: lx, cy: ly, ancho: la, pal: 1, fase: 0.05 * t }, V2 = mundo(i + 9, t, 0, 3.5);
  if (!capasPanal) capasPanal = [0, 1].map(() => { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; });
  const [capa1, capa2] = capasPanal;
  pinta(capa1.getContext("2d")!, 0, 0, W, H, V1);
  pinta(capa2.getContext("2d")!, 0, 0, W, H, V2);
  for (let fila = -1; fila < H / (1.5 * r) + 1; fila++) for (let col = -1; col < W / hw + 1; col++) {
    const cx = col * hw + (fila % 2 ? hw / 2 : 0), cy = fila * 1.5 * r;
    const d = Math.hypot(cx - W / 2, cy - H / 2) / 1100;
    const p = eOut(cl((e - d * 0.14) / 0.16 + 0.35));
    if (p <= 0) continue;
    const rr = (r - 4) * p;
    const hexa = () => { for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; const px = cx + rr * Math.cos(a), py = cy + rr * Math.sin(a); if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); };
    recortar(ctx, hexa, () => ctx.drawImage((fila + col) % 2 ? capa2 : capa1, 0, 0));
  }
  return { rotulo: "LA REGLA, CELDA POR CELDA", hud: hudBuceo(V1) };
};

// ─── living moments: the same rule, without cuts inside the shot ─────────────────────────────────────────────
// a point of the main cardioid's border (r = 1) or just outside it (r > 1)
const cardioide = (th: number, r: number): [number, number] => [
  (r * Math.cos(th)) / 2 - (r * r * Math.cos(2 * th)) / 4,
  (r * Math.sin(th)) / 2 - (r * r * Math.sin(2 * th)) / 4,
];
// the slice of the four-dimensional object turns: the Mandelbrot set melts into a Julia set. The camera stays on one
// point of the border, where the Mandelbrot set and the Julia set of that same point look alike (Tan Lei), so the
// turn never crosses a large flat interior
const transformacion: Disp = (ctx, t, e, i, dur) => {
  const c: [number, number] = [-0.7453, 0.1127];
  // still camera: only the slice turns, slowly, over the whole shot
  const s = eIO(cl((e - dur * 0.1) / (dur * 0.8)));
  pinta(ctx, 0, 0, W, H, { cx: c[0], cy: c[1], ancho: 0.05, pal: 0, fase: 0.05 * t, mezcla: s, cMezcla: c, interior: 0.3, tiempo: t });
  return { rotulo: "EL MANDELBROT SE VUELVE UN JULIA", hud: [cTexto(c), "EL MISMO PUNTO, OTRO CORTE"] };
};
// c steps in and out of the set: the world splits into islands and joins again, like a living cell. Everything
// living moves with the global time, so a world keeps its exact state when it passes from one shot to the next
const celula = (k: number, t: number): [number, number] => cardioide(1.6 + k * 0.9 + 0.04 * t, 1.045 + 0.02 * Math.sin(t * 0.6 + k));
const vivoVista = (k: number, t: number, ancho: number, desfase = 0): Vista => ({ cx: 0, cy: 0, ancho, pal: k % 3, fase: 0.05 * t + k, mezcla: 1, cMezcla: celula(k, ritmo(t) + desfase), interior: 0.3, tiempo: 0.5 * t, rot: k });
// the same scale on screen for any rectangle (see pinta: ancho is measured on the 16:9 side that limits)
const escala = (A: number, w: number, h: number) => (A * Math.min(w, (h * 16) / 9)) / W;
const lerpRect = (a: number[], b: number[], u: number) => a.map((v, k) => lerp(v, b[k], u));
// a rectangle that crops a full-screen view without moving or rescaling it: the panel edge moves, the image does not
const fijo = (V: Vista, x: number, y: number, w: number, h: number): Vista => ({ ...V, ancho: escala(V.ancho, w, h), cx: V.cx + ((x + w / 2 - W / 2) * V.ancho) / W, cy: V.cy - ((y + h / 2 - H / 2) * V.ancho) / W });

// ─── everything on the beat ────────────────────────────────────────────────────────────────────────────────────
// a critically damped spring: it starts moving exactly on its hit and settles without overshooting
const resorte = (x: number, w: number) => (x <= 0 ? 0 : 1 - (1 + w * x) * Math.exp(-w * x));
// the time of the j-th beat of shot i, and a gesture that starts on it
const latido = (i: number, j: number) => L[Math.min(L.length - 1, INICIO[i] + j)];
const enGolpe = (t: number, i: number, j: number, w = 22) => resorte(t - latido(i, j), w);
// a clock that only advances on the hits: whole beats passed, each arriving with a spring right after its hit, so
// living shapes change on the music and rest between hits
const reloj = (t: number) => {
  if (t < L[0]) return 0;
  let i = 0;
  while (i + 1 < L.length && L[i + 1] <= t) i++;
  return i + resorte(t - L[i], 18);
};
const ritmo = (t: number) => 0.7 * reloj(t);

// ─── the photographed opening (DIRECCION-fotografia.md) ─────────────────────────────────────────────────────────
// one point of the border, where the Mandelbrot set and the Julia set of that point look alike (Tan Lei)
const PUNTO: [number, number] = [-0.7453, 0.1127];
const A_PUNTO = 0.05;
// the centre of the large spiral of that Julia set (measured on the frame): the visual subject of shots 1–3
const FOCO: [number, number] = [-0.74556, 0.11166];
const focoPantalla = (A: number): [number, number] => [W / 2 + ((FOCO[0] - PUNTO[0]) * W) / A, H / 2 - ((FOCO[1] - PUNTO[1]) * W) / A];
const juliaPunto = (t: number, A: number): Vista => ({ cx: PUNTO[0], cy: PUNTO[1], ancho: A, pal: 0, fase: 0.05 * t, mezcla: 1, cMezcla: PUNTO, interior: 0.3, tiempo: 0.5 * t });
// shot 1, one continuous take: the border, a slow push, and the slice turns into the Julia set of the same point
const apertura: Disp = (ctx, t, e, i, dur) => {
  const modo = (MONT as unknown as { apertura?: string }).apertura ?? "gesto";
  const A = A_PUNTO * Math.pow(1.2, 1 - (enGolpe(t, i, 0, 12) + enGolpe(t, i, 1, 12) + enGolpe(t, i, 2, 12)) / 3);
  const julia: Res = { rotulo: "EL MISMO PUNTO, OTRO CORTE: SU CONJUNTO DE JULIA", hud: [cTexto(PUNTO), "MANDELBROT Y JULIA SE PARECEN AQUÍ"] };
  const borde: Res = { rotulo: "CONJUNTO DE MANDELBROT · EL BORDE", hud: [`CENTRO ${num(PUNTO[0], 4)} + ${num(PUNTO[1], 4)}i`, "UN SOLO PUNTO"] };
  if (modo === "julia") {
    pinta(ctx, 0, 0, W, H, juliaPunto(t, A));
    return julia;
  }
  if (modo === "corte") {
    // the border, framed with the outside of the set on the right, then a soft cut on the second beat to its Julia
    const f = eSuave(cl((e - (L[1] - L[0])) / 0.5));
    if (f < 1) pinta(ctx, 0, 0, W, H, { ...juliaPunto(t, A), cx: PUNTO[0] - 0.4 * A, mezcla: 0 });
    if (f > 0) pinta(ctx, 0, 0, W, H, juliaPunto(t, A), f);
    return f < 0.5 ? borde : julia;
  }
  const s = modo === "suave" ? eSuave(cl((e - 0.3) / (dur - 0.5))) : eIO(cl((e - (L[1] - L[0] - 0.45)) / 1.0));
  pinta(ctx, 0, 0, W, H, { ...juliaPunto(t, A), mezcla: s });
  return s < 0.5 ? borde : julia;
};
// shot 2: the frame narrows around the same image into the centre panel; two worlds slide in beside it, then it opens
const tripticoPunto: Disp = (ctx, t, e, i) => {
  const g = 14;
  const u = enGolpe(t, i, 0, 22);
  for (const k of [0, 2]) {
    const [px, py, pw, ph] = panelRect(k, g);
    // the side panels slide in from outside the frame (from the sides, or from above and below in a tall frame)
    const x = VERTICAL ? px : lerp(k === 0 ? -pw - g : W + g, px, u), y = VERTICAL ? lerp(k === 0 ? -ph - g : H + g, py, u) : py;
    recortar(ctx, () => ctx.rect(x, y, pw, ph), () => pinta(ctx, x, y, pw, ph, mundo(i + k * 4, t, k, 3.1), 0.8));
  }
  const [x, y, w, h] = lerpRect([0, 0, W, H], panelRect(1, g), u);
  recortar(ctx, () => ctx.rect(x, y, w, h), () => pinta(ctx, x, y, w, h, { ...juliaPunto(t, escala(A_PUNTO, w, h)), cx: PUNTO[0], cy: PUNTO[1] }));
  return { rotulo: "TRES MUNDOS DE LA MISMA REGLA", hud: [cTexto(PUNTO), "TRES VALORES DE c"] };
};
// shot 3, one continuous take: two magnifiers open calmly on the same point (x6, x36); the outer one grows into the
// frame without a flash, and the camera keeps going down
const descenso: Disp = (ctx, t, e, i, dur) => {
  // the outer lens grows and becomes a window: behind it, the organism of the next shot is already living
  const crece = enGolpe(t, i, 2, 10);
  const Ab = A_PUNTO;
  if (crece < 1) pinta(ctx, 0, 0, W, H, juliaPunto(t, Ab));
  // the magnifiers sit on the spiral and magnify around its centre
  const [lx, ly] = focoPantalla(Ab);
  [Math.min(W, H) * 0.36, Math.min(W, H) * 0.17].forEach((R, k) => {
    const abre = enGolpe(t, i, k, 16);
    const r = R * abre * (k === 0 ? lerp(1, (Math.hypot(W, H) / 2 + 80) / R, crece) : 1);
    if (r < 2) return;
    if (k === 1) {
      // the inner lens closes as the window opens
      const a = 1 - eSuave(cl(crece * 2.5));
      if (a <= 0) return;
      recortar(ctx, () => ctx.arc(lx, ly, r, 0, TAU), () => pinta(ctx, lx - r, ly - r, 2 * r, 2 * r, { ...juliaPunto(t, ((Ab / 36) * 2 * r) / W), cx: FOCO[0], cy: FOCO[1], pal: 2 }, a));
      trazo(ctx, () => ctx.arc(lx, ly, r, 0, TAU), 0.7 * a, 2);
      return;
    }
    const ventana = eSuave(cl(crece * 1.6));
    recortar(ctx, () => ctx.arc(lx, ly, r, 0, TAU), () => {
      if (ventana < 1) pinta(ctx, lx - r, ly - r, 2 * r, 2 * r, { ...juliaPunto(t, ((Ab / 6) * 2 * r) / W), cx: FOCO[0], cy: FOCO[1], pal: 1 });
      if (ventana > 0) pinta(ctx, 0, 0, W, H, vivoVista(0, t, 2.3), ventana);
    });
    trazo(ctx, () => ctx.arc(lx, ly, r, 0, TAU), 0.7 * (1 - crece), 2);
  });
  return crece < 0.5
    ? { rotulo: "EL MISMO PUNTO, 6 Y 36 VECES MÁS ADENTRO", hud: ["LUPAS ×6 · ×36", cTexto(PUNTO)] }
    : { rotulo: "SE DIVIDE Y SE JUNTA", hud: [cTexto(celula(0, t)), "c ENTRA Y SALE DEL CONJUNTO"] };
};
// shot 4: the organism, still camera; at the end it contracts into the size of the mosaic's centre cell
const CELDA = (() => { const g = 10, cw = (W - 4 * g) / 3, ch = (H - 4 * g) / 3; return [2 * g + cw, 2 * g + ch, cw, ch]; })();
const organismo = (k: number): Disp => (ctx, t, e, i, dur) => {
  const c = enGolpe(t, i, 1, 16);
  const [x, y, w, h] = lerpRect([0, 0, W, H], CELDA, c);
  pinta(ctx, x, y, w, h, vivoVista(k, t, 2.3));
  return { rotulo: "SE DIVIDE Y SE JUNTA", hud: [cTexto(celula(k, ritmo(t))), "c ENTRA Y SALE DEL CONJUNTO"] };
};
// shot 5: the organism stays in the centre cell; its eight neighbours fade in as a soft cascade; then it opens
const mosaicoVivo: Disp = (ctx, t, e, i, dur) => {
  const g = 10, cw = (W - 4 * g) / 3, ch = (H - 4 * g) / 3;
  const sale = enGolpe(t, i, 1, 14);
  for (const k of [0, 1, 2, 3, 5, 6, 7, 8]) {
    const f = Math.floor(k / 3), col = k % 3;
    const a = resorte(t - latido(i, 0) - 0.03 * k, 22) * (1 - sale);
    if (a <= 0) continue;
    pinta(ctx, g + col * (cw + g), g + f * (ch + g), cw, ch, mundo(k + i, t, k % 3, 3.3), 0.8 * a);
  }
  const [x, y, w, h] = lerpRect(CELDA, [0, 0, W, H], sale);
  pinta(ctx, x, y, w, h, vivoVista(0, t, 2.3));
  return { rotulo: "NUEVE PUNTOS VECINOS DEL BORDE, NUEVE MUNDOS", hud: [cTexto(celula(0, t)), "NUEVE VALORES DE c"] };
};
// shot 6: a second organism enters on a diagonal, holds the two worlds side by side, then takes the frame
const diagonalVivo: Disp = (ctx, t, e, i, dur) => {
  pinta(ctx, 0, 0, W, H, vivoVista(0, t, 2.3));
  const p = 0.55 * enGolpe(t, i, 0, 16) + 0.45 * enGolpe(t, i, 1, 16);
  const x0 = lerp(W * 1.02, -W * 0.2, p), x1 = x0 + W * 0.18;
  const camino = () => { ctx.moveTo(x0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(x1, H); ctx.closePath(); };
  recortar(ctx, camino, () => pinta(ctx, 0, 0, W, H, vivoVista(1, t, 2.3)));
  trazo(ctx, () => { ctx.moveTo(x0, 0); ctx.lineTo(x1, H); }, 0.75, 2);
  return { rotulo: "DOS MUNDOS DE LA MISMA REGLA", hud: [cTexto(celula(0, t)), cTexto(celula(1, t))] };
};
// c drifts from one place of the plane to another: living tissue
const tejido = (k: number): Disp => (ctx, t) => {
  // the tissue changes shape on every hit and rests between them
  const c = cardioide(2.4 + k * 0.7 + 0.08 * reloj(t), 1.0);
  pinta(ctx, 0, 0, W, H, { cx: 0, cy: 0, ancho: 1.5, pal: (k + 1) % 3, fase: 0.05 * t + k, mezcla: 1, cMezcla: c, campo: 0.3, interior: 0.3, tiempo: 1.4 * reloj(t) + 26 + k * 7 });
  return { rotulo: "TEJIDO VIVO · c CAMBIA DE UN LUGAR A OTRO", hud: [cTexto(c), "LA MISMA REGLA EN CADA PUNTO"] };
};
// shot 7: the frame divides with the organism: one camera becomes two, then four
const division: Disp = (ctx, t, e, i, dur) => {
  const g = 12;
  const a = enGolpe(t, i, 1, 18), b = enGolpe(t, i, 2, 18);
  for (let k = 0; k < 4; k++) {
    const col = k % 2, fila = Math.floor(k / 2);
    // first a vertical split, then a horizontal one
    const x = col ? lerp(W, W / 2 + g / 2, a) : 0, w = col ? W - x : lerp(W, W / 2 - g / 2, a);
    const y = fila ? lerp(H, H / 2 + g / 2, b) : 0, h = fila ? H - y : lerp(H, H / 2 - g / 2, b);
    if (w < 2 || h < 2) continue;
    recortar(ctx, () => ctx.rect(x, y, w, h), () => pinta(ctx, x, y, w, h, fijo(vivoVista(k * 2 + 1, t, 2.3), x, y, w, h)));
  }
  return { rotulo: "UNA CÉLULA, DOS, CUATRO", hud: [cTexto(celula(1, t)), "CUATRO VALORES DE c"] };
};
// three cameras, three organisms splitting and joining out of phase
const tripticoVivo: Disp = (ctx, t, e, i) => {
  const g = 14;
  // one panel arrives on each hit: the centre, then the left (top), then the right (bottom)
  [1, 0, 2].forEach((k, j) => {
    const p = enGolpe(t, i, j, 22);
    if (p <= 0) return;
    const [px, py, pw, ph] = panelRect(k, g);
    const x = px, y = py + (1 - p) * Math.min(W, H) * 0.12;
    recortar(ctx, () => ctx.rect(x, y, pw, ph), () => pinta(ctx, x, y, pw, ph, vivoVista(k + 3, t, 1.6, k * 1.1), p));
  });
  return { rotulo: "TRES ORGANISMOS DE LA MISMA REGLA", hud: [cTexto(celula(4, t)), "TRES VALORES DE c"] };
};

// places of the border chosen for their shape (spirals, seahorses, stars, dendrites), each shown once
const LUGARES: [number, number, number][] = [
  [-0.7453, 0.1127, 0.006], [0.3245, 0.04855, 0.006], [-0.1011, 0.9563, 0.008], [0.42884, -0.231345, 0.008], [-0.761574, -0.0847596, 0.008],
  [-0.55, 0.63, 0.03], [0.00164372, -0.82246763, 0.01], [-0.7269, 0.1889, 0.02], [0.2925, 0.0149, 0.006], [-0.77568377, 0.13646737, 0.006],
  [-0.7436439, 0.1318259, 0.006], [-0.088, 0.654, 0.03],
];
const lugar = (k: number): Disp => (ctx, t, e) => {
  const [cx, cy, a] = LUGARES[k % LUGARES.length];
  const V: Vista = { cx, cy, ancho: a * (1.15 - 0.15 * eOut(cl(e / 1.2))), pal: k % 3, fase: 0.05 * t + k, rot: 0.04 * e };
  pinta(ctx, 0, 0, W, H, V);
  return { rotulo: "CONJUNTO DE MANDELBROT · EL BORDE", hud: [aumento(V), `CENTRO ${num(cx, 5)} + ${num(cy, 5)}i`] };
};

// order of devices over the 26 beats: rich layouts while the heart is slow, quick full shots when it races
// [device, beats]: rich devices last two beats so they can be enjoyed; one-beat cuts only when the heart races
// the order of the v2 that worked: one device per beat
// the sequence lives in montaje.json, shared with the sound so every visual move has its sound
const DISPOSITIVOS: Record<string, Disp> = { pleno, triptico, plenoJulia, lupas, mosaico, diagonal, caleido, panal, transformacion, division, tripticoVivo, apertura, tripticoPunto, descenso, mosaicoVivo, diagonalVivo };
const SEQ: [Disp, number][] = (MONT as unknown as { seq: string[] }).seq.map((entrada) => {
  // "name*2" lasts two beats
  const [n, latidos] = entrada.split("*");
  const d = n.startsWith("lugar") ? lugar(Number(n.slice(5))) : n.startsWith("organismo") ? organismo(Number(n.slice(9))) : n.startsWith("tejido") ? tejido(Number(n.slice(6))) : DISPOSITIVOS[n];
  return [d, Number(latidos ?? 1)];
});
// start beat of every shot
const INICIO: number[] = [];
SEQ.reduce((b, [, n]) => (INICIO.push(b), b + n), 0);
// the dive jumps where each magnifier ends
SEQ.forEach(([d], s) => { if (d === lupas && s + 1 < SEQ.length) SALTOS.push(L[INICIO[s + 1]]); });
const toma = (t: number) => {
  let s = 0;
  while (s + 1 < SEQ.length && L[INICIO[s + 1]] <= t) s++;
  return s;
};

const indice = (t: number) => {
  let i = 0;
  while (i + 1 < L.length && L[i + 1] <= t) i++;
  return i;
};

// type as a mask: the letters filled with living fractal
let capaTexto: HTMLCanvasElement | null = null;
const textoFractal = (ctx: Ctx, s: string, y: number, tam: number, a: number, t: number, peso = 600, esp = 0) => {
  if (a <= 0) return;
  if (!capaTexto) { capaTexto = document.createElement("canvas"); capaTexto.width = W; capaTexto.height = H; }
  const c = capaTexto.getContext("2d")!;
  c.globalCompositeOperation = "source-over";
  c.clearRect(0, 0, W, H);
  // the brightest, most colourful band of the dive fills the letters
  pinta(c, 0, 0, W, H, { cx: -0.7453, cy: 0.1127, ancho: 0.06 * Math.exp(-0.08 * (t - MONT.calma)), pal: 2, fase: 0.06 * t + 0.4 });
  c.globalCompositeOperation = "destination-in";
  texto(c, s, W / 2, y, tam, "#fff", { fam: SANS, peso, alin: "center", esp });
  // lift the fill so the letters always read against the image
  c.globalCompositeOperation = "source-atop";
  c.fillStyle = "rgba(255,244,222,0.38)";
  c.fillRect(0, 0, W, H);
  // a soft shadow behind the letters
  ctx.save();
  const sombra = ctx.createRadialGradient(W / 2, y - tam * 0.35, 0, W / 2, y - tam * 0.35, W * 0.42);
  sombra.addColorStop(0, `rgba(2,3,6,${0.55 * a})`);
  sombra.addColorStop(1, "rgba(2,3,6,0)");
  ctx.fillStyle = sombra;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.globalAlpha = a;
  ctx.drawImage(capaTexto, 0, 0);
  // a thin edge of light around the letters
  ctx.save();
  ctx.font = `${peso} ${tam}px "${SANS}"`;
  ctx.textAlign = "center";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${esp}px`;
  ctx.strokeStyle = `rgba(${RGB.crema},${0.55 * a})`;
  ctx.lineWidth = 1.6;
  ctx.strokeText(s, W / 2, y);
  ctx.restore();
  ctx.globalAlpha = 1;
};

// the immersion: [target, start width, end width, palette]; the first starts from the whole set
const LUGARES_FIN: [number, number, number, number, number][] = [
  [-0.77568377, 0.13646737, 3.3, 0.0012, 0],
  [0.292876620406, 0.013538370119, 0.4, 0.0015, 1],
  // the spirals: on screen at the word «universo», where they become the spiral galaxy (film version)
  [-0.743643887, 0.131825904, 0.006, 0.0006, 2],
  [-0.101096363846, 0.956286510809, 0.4, 0.0015, 0],
  // the last one ends on a hidden copy of the set, with its filaments like a neuron
  [-1.2563679, 0.380321, 0.6, 0.026, 2],
];
// after the last hit the colours sweep fast through the palette and settle on a new tone
const faseFinal = (t: number) => 0.5 * MONT.corte + 0.12 * (t - MONT.corte) + 2.0 * eOut(cl((t - MONT.corte) / 1.4));
const tramos = () => {
  const t0 = MONT.voz + MONT.dibuja, t1 = MONT.finInmersion, n = LUGARES_FIN.length;
  const primero = (t1 - t0) * 0.25, resto = (t1 - t0 - primero) / (n - 1);
  return LUGARES_FIN.map((_, k) => (k === 0 ? [t0, t0 + primero] : [t0 + primero + (k - 1) * resto, t0 + primero + k * resto]));
};
const vistaTramo = (k: number, t: number): Vista => {
  const [cx, cy, a0, a1, pal] = LUGARES_FIN[k];
  const [ta, tb] = tramos()[k];
  // the first dive eases in from the still set; the others are already falling when they appear
  const u0 = (t - ta) / (tb - ta);
  const u = k === 0 ? (u0 < 0.25 ? (2 * u0 * u0) : u0 - 0.125) / 0.875 : u0;
  // the first dive starts exactly from the still set as it is framed in this format (no jump)
  const a0f = k === 0 ? V_M.ancho : a0;
  const ancho = a0f * Math.pow(a1 / a0f, u);
  const desde = k === 0 ? [V_M.cx, V_M.cy] : [cx, cy];
  const k0 = ancho / a0f;
  return { cx: cx + (desde[0] - cx) * k0, cy: cy + (desde[1] - cy) * k0, ancho, pal, fase: faseFinal(t) };
};
// deep down, the place becomes the Julia set of its own point (around that point both look alike, Tan Lei), and
// the Julia set mutates live: its c circles around the point, so the shapes keep reorganising as we fall
const juliaTramo = (k: number, t: number): Vista => {
  const V = vistaTramo(k, t);
  const [cx, cy] = LUGARES_FIN[k];
  // deep Julia sets near slow-escaping places (the elephants, next to the cusp) need many more iterations
  return { ...V, cx, cy, maxIt: 1600, julia: [cx + 0.06 * V.ancho * Math.cos(2.4 * t), cy + 0.06 * V.ancho * Math.sin(2.4 * t)] };
};
// the Julia stage is off: at these depths its filaments are too thin to read (kept for a later test)
const MUTA_JULIA = false;
const muta = (k: number, t: number) => {
  if (!MUTA_JULIA || k === LUGARES_FIN.length - 1) return 0;
  const [ta, tb] = tramos()[k];
  return eSuave(cl(((t - ta) / (tb - ta) - 0.4) / 0.3));
};
const pintaTramo = (ctx: Ctx, k: number, t: number, a = 1) => {
  const m = muta(k, t);
  if (m < 1) pinta(ctx, 0, 0, W, H, vistaTramo(k, t), a);
  if (m > 0) pinta(ctx, 0, 0, W, H, juliaTramo(k, t), a * m);
};
// which places are on screen at t, with their opacity (the next one fades in over 0.7 s while both dive)
const inmersion = (t: number): Vista => {
  const T = tramos();
  if (t < T[0][0]) return { ...V_M, pal: 0, fase: faseFinal(t) };
  let k = 0;
  while (k + 1 < T.length && T[k + 1][0] <= t) k++;
  return vistaTramo(k, t);
};
const pintaInmersion = (ctx: Ctx, t: number) => {
  const T = tramos();
  if (t < T[0][0]) { pinta(ctx, 0, 0, W, H, inmersion(t)); return; }
  let k = 0;
  while (k + 1 < T.length && T[k + 1][0] <= t) k++;
  pintaTramo(ctx, k, t);
  // the next place fades in over the current one, both still diving
  if (k + 1 < T.length) {
    const f = eSuave(cl((t - (T[k + 1][0] - 0.7)) / 0.7));
    if (f > 0) pintaTramo(ctx, k + 1, t, f);
  }
};
// the title, as a classic trailer: the breath, then a hard cut to black on the largest hit; LA FRONTERA appears
// clean, in cream, with the fractal alive only inside its letters, and it comes closer very slowly
let capaTitulo: HTMLCanvasElement | null = null, c0: CanvasRenderingContext2D | null = null;
const tituloEpico = (ctx: Ctx, t: number, pelicula = false) => {
  const u = t - MONT.titulo;
  if (u < -0.5) return;
  if (u < 0) { ctx.fillStyle = `rgba(2,3,6,${0.4 * eSuave(cl((u + 0.5) / 0.5))})`; ctx.fillRect(0, 0, W, H); return; }
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  const larga = MONT.total - MONT.titulo, y = H / 2 + 55;
  // the title's size: at its largest (the film grows it to 1.14) it still fits in 88 % of the width
  c0 = c0 ?? document.createElement("canvas").getContext("2d")!;
  c0.font = `700 ${170 * K_TEXTO}px "${SANS}"`; (c0 as unknown as { letterSpacing: string }).letterSpacing = "18px";
  const tam = 170 * K_TEXTO * Math.min(1, (0.88 * W) / (c0.measureText("LA FRONTERA").width * (pelicula ? 1.14 : 1.07)));
  // in the film the title keeps growing the whole time it holds; in the teaser it only comes a little closer
  const z = pelicula ? 0.94 + 0.2 * (u / larga) : 1 + 0.07 * (u / larga);
  const a = eSuave(cl(u / 0.12));
  if (!capaTitulo) { capaTitulo = document.createElement("canvas"); capaTitulo.width = W; capaTitulo.height = H; }
  const c = capaTitulo.getContext("2d")!;
  c.globalCompositeOperation = "source-over";
  c.clearRect(0, 0, W, H);
  if (pelicula) {
    // the film: inside the letters, the seahorse valley's spirals, diving and flowing the whole time the title holds
    pinta(c, 0, 0, W, H, { cx: -0.743643887, cy: 0.131825904, ancho: 0.0022 * Math.exp(-0.3 * u), pal: 2, fase: 0.05 + 0.09 * u, interior: 0.3, tiempo: 0.8 * t });
    c.fillStyle = "rgba(0,0,0,0.28)";
    c.fillRect(0, 0, W, H);
    // a faint floor of light, so no letter goes dark when the dive passes the set's black
    c.globalCompositeOperation = "lighter";
    c.fillStyle = "rgba(120,100,140,0.16)";
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = "source-over";
    c.fillStyle = "rgba(0,0,0,0)";
  } else {
    // inside the letters: the hidden copy the immersion arrived at, still alive
    pinta(c, 0, 0, W, H, { ...vistaTramo(LUGARES_FIN.length - 1, MONT.titulo), fase: 0.3 * t, tiempo: t });
    c.fillStyle = "rgba(255,244,222,0.55)";
  }
  c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = "destination-in";
  c.save();
  c.translate(W / 2, y); c.scale(z, z); c.translate(-W / 2, -y);
  texto(c, "LA FRONTERA", W / 2, y, tam, "#fff", { fam: SANS, peso: 700, alin: "center", esp: 18 });
  c.restore();
  ctx.save();
  ctx.globalAlpha = a;
  ctx.drawImage(capaTitulo, 0, 0);
  // a soft glow of the letters
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = a * 0.35;
  ctx.filter = "blur(14px)";
  ctx.drawImage(capaTitulo, 0, 0);
  ctx.restore();
  if (pelicula) {
    // the subtitle, still and small under the growing title; it comes in after the title and before the logo
    const as = eSuave(cl((u - 1.4) / 1.0)) * (1 - eSuave(cl((t - (MONT.total - 0.8)) / 0.8)));
    if (as > 0) {
      const sub = "FRACTALES: LA GEOMETRÍA DEL INFINITO";
      c0!.font = `500 ${30 * K_TEXTO}px "${SANS}"`; (c0 as unknown as { letterSpacing: string }).letterSpacing = "10px";
      const ts = 30 * K_TEXTO * Math.min(1, (0.86 * W) / c0!.measureText(sub).width);
      texto(ctx, sub, W / 2 + 5, y + 80 * K_TEXTO + 20, ts, `rgba(${RGB.crema},${0.85 * as})`, { fam: SANS, peso: 500, alin: "center", esp: 10 });
    }
  }
};

// the clean finish (formato.json «limpio»): no grain, scanlines or noise, for the small WhatsApp files, where the
// grain would eat the whole bitrate
const LIMPIO = (FORMATO as { limpio?: boolean }).limpio === true;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.032, vineta: 0.62, grano: LIMPIO ? 0 : 0.05, scan: LIMPIO ? 0 : 0.2, curva: 0.16, ruido: LIMPIO ? 0 : 0.6, flicker: 0.025, grade: 1.8, imp: 0.6, lineaA: 0.8 };

// ─── the climax: everything turns into chaos, then one white burst ───────────────────────────────────────────
const SUBS: number[] = (MONT as unknown as { subs: number[] }).subs;
// ─── climax ──────────────────────────────────────────────────────────────────────────────────────────────────
// the forms of Teaser 2 that worked: isolated mini-Mandelbrots whose filaments spread like a neuron's dendrites
// (0:14, 0:16), the dendrite Julia set (0:17) and the snowflake (0:14)
const NEURONAS: [number, number, number][] = [[-1.2563679, 0.380321, 0.00288], [-0.1275, 0.9874609, 0.00195], [0.4433256, 0.3729624, 0.003], [-0.1054699, 0.9239995, 0.00237]];
const FORMAS_JULIA: [number, number][] = [[-0.162, 1.04], [-0.4, 0.6], [0.37, 0.1], [-0.123, 0.745]];
const neurona = (k: number, t: number, e: number, pal: number, ancho = 7.5): Vista => {
  const [cx, cy, r] = NEURONAS[k % NEURONAS.length];
  return { cx, cy, ancho: r * ancho * (1.12 - 0.12 * eOut(cl(e / 0.5))), pal, fase: 0.3 * t + k };
};
const formaJulia = (k: number, t: number, e: number, pal: number, ancho = 3.7): Vista => {
  const [jr, ji] = FORMAS_JULIA[k % FORMAS_JULIA.length];
  return { cx: 0, cy: 0, ancho: ancho * (1.12 - 0.12 * eOut(cl(e / 0.5))), julia: [jr + 0.03 * Math.cos(t * 2.6 + k), ji + 0.03 * Math.sin(t * 2.6 + k)], pal, fase: 0.3 * t + k, rot: 0.04 * e };
};
// the climax, as in "La frontera climax": first a burst of cuts (neurons and whole Julia sets), then the grid of
// whole worlds that appears level by level, 2 x 2, 3 x 3... up to 24 x 24. When the music settles on its steady
// hits, the screens outside the Mandelbrot set go out one by one, so the ones that remain draw the set; they melt
// into the real set, and it bursts on the last hit
const hash2 = (i: number, j: number) => { let x = Math.imul(i * 73856093 ^ j * 19349663 ^ 0x5bd1e995, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const subIndice = (t: number) => { let k = 0; while (k + 1 < SUBS.length && SUBS[k + 1] <= t) k++; return k; };
// the shot that is arriving: it switches a little before its hit, so the dissolve ends on the hit
const subLlegando = (t: number, antes: number) => subIndice(t + antes);
// 96 different worlds: Julia sets from points spread over the whole border (golden angle), inside, on and outside
// it, and the twelve isolated mini-Mandelbrots (neurons) of the teaser
const MINIS: [number, number, number][] = [
  [-1.7548777, 0.0, 0.019], [-0.1565202, 1.0322471, 0.00848], [-1.4760146, 0.0, 0.00517], [0.3592592, 0.6425137, 0.00481],
  [-1.6254137, 0.0, 0.00406], [-0.0442124, 0.986581, 0.00348], [0.4433256, 0.3729624, 0.003], [-1.2563679, 0.380321, 0.00288],
  [-1.1856112, 0.3030409, 0.00278], [-0.1054699, 0.9239995, 0.00237], [-0.1275, 0.9874609, 0.00195], [-1.0075479, 0.3107538, 0.00183],
];
// every screen of the grid has the frame's proportions (n x n cells), so the atlas worlds are computed with them too:
// never stretched in tall frames
const N_ATLAS = 96, AC = 12, AW = 256, AH = VERTICAL ? 256 : Math.round((256 * H) / W);
// rows of the grid for n columns: n x n in a wide frame; in a tall one, more rows so every screen is about square
const filas = (n: number) => (VERTICAL ? Math.max(1, Math.round((n * H) / W)) : n);
const mundoUnico = (a: number, t: number, vel: number): Vista => {
  const pal = a % 3;
  if (a % 4 === 0) {
    const [cx, cy, r] = MINIS[(a / 4) % MINIS.length];
    return { cx, cy, ancho: r * 8, pal, fase: 0.4 * t + a, rot: a * 0.7 };
  }
  const th = (a * 2.399963) % TAU;
  // the period-2 bulb for some, the main cardioid for the rest; just inside, on, or just outside the border
  const r = [0.995, 1.0, 1.03][a % 3];
  const c0: [number, number] = a % 5 === 1 ? [-1 + 0.25 * r * Math.cos(th), 0.25 * r * Math.sin(th)] : cardioide(th, r);
  return { cx: 0, cy: 0, ancho: 3.4, julia: [c0[0] + 0.02 * Math.cos(t * vel + a), c0[1] + 0.02 * Math.sin(t * vel + a)], pal, fase: 0.4 * t + a, rot: a * 0.5 };
};
let atlas: HTMLCanvasElement | null = null;
// one level on every hit
const NIVELES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48];
// the whole set: a little closer in tall frames, where it spans the width
const V_M = { cx: -0.62, cy: 0, ancho: H > W * 1.5 ? 2.8 : VERTICAL ? 3.0 : 3.3 };
let capaM: HTMLCanvasElement | null = null, muestraM: HTMLCanvasElement | null = null;
let capaG: HTMLCanvasElement | null = null;
// the screens emit light: a soft glow spreads from the brightest ones, as real screens in the dark
let capaR: HTMLCanvasElement | null = null;
const resplandor = (ctx: Ctx, a: number) => {
  if (!capaR) { capaR = document.createElement("canvas"); capaR.width = W / 8; capaR.height = H / 8; }
  const cr = capaR.getContext("2d")!;
  cr.imageSmoothingEnabled = true;
  cr.imageSmoothingQuality = "high";
  cr.drawImage(ctx.canvas, 0, 0, W / 8, H / 8);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = a;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.filter = "blur(6px)";
  ctx.drawImage(capaR, 0, 0, W, H);
  ctx.restore();
};
const NFORM = 80;
const nivel = (k: number) => (k - 6 >= NIVELES.length ? NFORM : NIVELES[Math.max(0, k - 6)]);
// one level of the grid: every screen keeps its world from level to level (it depends only on its place)
const grilla = (ctx: Ctx, n: number, t: number, vel: number, brilla: number, funde: number, px: Uint8ClampedArray | null, pulso = 0) => {
  const m = filas(n);
  const g = Math.max(0.6, Math.min(4, 40 / n)) * (1 - funde), cw = (W - (n + 1) * g) / n, ch = (H - (m + 1) * g) / m;
  // no two neighbours show the same world
  const fila: number[] = [], previa: number[] = [];
  for (let f = 0; f < m; f++) {
    for (let c = 0; c < n; c++) {
      let a = Math.floor(hash2(c * 131, f * 71) * N_ATLAS);
      while (a === fila[c - 1] || a === previa[c]) a = (a + 1) % N_ATLAS;
      fila[c] = a;
      const x = g + c * (cw + g), y = g + f * (ch + g);
      if (cw >= 420) pinta(ctx, x, y, cw, ch, mundoUnico(a, t, vel));
      else {
        // as the screen lights up with its colour of the set, its own world fades to a faint texture
        ctx.globalAlpha = 1 - 0.8 * brilla;
        ctx.drawImage(atlas!, (a % AC) * AW, Math.floor(a / AC) * AH, AW, AH, x, y, cw, ch);
        ctx.globalAlpha = 1;
      }
      if (px && brilla > 0) {
        // each screen lights up a moment after its neighbours, from the border of the set outwards
        const q = (f * NFORM + c) * 4, lum = (0.3 * px[q] + 0.6 * px[q + 1] + 0.1 * px[q + 2]) / 255;
        // and on every steady hit the bright screens of the border beat with light
        const b = Math.min(1, eSuave(cl(brilla * 1.6 - 0.6 * (1 - lum) * hash2(c, f + 5))) * (1 + 0.8 * pulso * lum));
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = `rgba(${px[q]},${px[q + 1]},${px[q + 2]},${b})`;
        ctx.fillRect(x, y, cw, ch);
        ctx.globalCompositeOperation = "source-over";
      }
    }
    previa.splice(0, previa.length, ...fila);
  }
  if (funde > 0 && capaM) {
    ctx.globalAlpha = funde; ctx.drawImage(capaM, 0, 0);
    // the real set keeps beating on the hits
    if (pulso > 0) { ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.45 * pulso * funde; ctx.drawImage(capaM, 0, 0); ctx.globalCompositeOperation = "source-over"; }
    ctx.globalAlpha = 1;
  }
};
const climax = (ctx: Ctx, t: number) => {
  const k = subIndice(t);
  const e = t - SUBS[k];
  const c0 = MONT.corte;
  let nombre: string;
  if (k < 6) {
    // burst: a cut on every hit, neurons and whole Julia sets in turn, each pushing in like in the teaser
    pinta(ctx, 0, 0, W, H, k % 2 === 0 ? neurona(k / 2, t, e, k % 3) : formaJulia((k - 1) / 2, t, e, k % 3));
    nombre = "RÁFAGA";
  } else {
    // when the music settles on its steady hits, the grid becomes 48 x 48 and the screens light up as the pixels of
    // the Mandelbrot set: each takes the exact colour and brightness of the set at its place
    const forma = subLlegando(t, 0.08) - 6 >= NIVELES.length;
    const kl = k >= 6 ? Math.max(6, subLlegando(t, 0.08)) : k;
    const n = nivel(kl);
    const brilla = forma ? eSuave(cl((t - SUBS[26]) / 1.0)) : 0;
    // then the screens dissolve into the real set: the gaps close and the detail inside each screen appears
    const funde = forma ? eSuave(cl((t - (SUBS[26] + 0.85)) / (c0 - SUBS[26] - 0.85))) : 0;
    const vel = 3 + Math.log2(n);
    const pulso = k >= 26 ? Math.exp(-(t - SUBS[k]) * 6) : 0;
    if (!atlas) { atlas = document.createElement("canvas"); atlas.width = AW * AC; atlas.height = AH * Math.ceil(N_ATLAS / AC); }
    if (n > 3 || nivel(k - 1) > 3) {
      const ac = atlas.getContext("2d")!;
      for (let a = 0; a < N_ATLAS; a++) pinta(ac, (a % AC) * AW, Math.floor(a / AC) * AH, AW, AH, mundoUnico(a, t, vel));
    }
    let px: Uint8ClampedArray | null = null;
    if (forma) {
      if (!capaM) { capaM = document.createElement("canvas"); capaM.width = W; capaM.height = H; muestraM = document.createElement("canvas"); muestraM.width = NFORM; muestraM.height = filas(NFORM); }
      pinta(capaM.getContext("2d")!, 0, 0, W, H, { ...V_M, pal: 0, fase: 0.5 * t });
      // the colour of the set averaged over every screen
      const mm = muestraM!.getContext("2d", { willReadFrequently: true })!;
      mm.imageSmoothingEnabled = true;
      mm.imageSmoothingQuality = "high";
      mm.drawImage(capaM, 0, 0, NFORM, filas(NFORM));
      px = mm.getImageData(0, 0, NFORM, filas(NFORM)).data;
    }
    // a new level never cuts: it dissolves over the previous one on its hit (shorter as the hits speed up)
    let ks = kl;
    while (ks > 6 && nivel(ks - 1) === n) ks--;
    const dis = ks >= 26 ? 0.3 : ks < 18 ? 0.2 : 0.1;
    // the first grid dissolves over the last shot of the burst
    const u = eSuave(cl((t - SUBS[ks] + (ks === 6 ? 0.2 : dis) * 0.8) / (ks === 6 ? 0.25 : dis)));
    if (u < 1) {
      if (ks === 6) pinta(ctx, 0, 0, W, H, formaJulia(2, t, t - SUBS[5], 5 % 3));
      else grilla(ctx, nivel(ks - 1), t, vel, 0, 0, null);
      if (!capaG) { capaG = document.createElement("canvas"); capaG.width = W; capaG.height = H; }
      const cg = capaG.getContext("2d")!;
      cg.fillStyle = "#020306"; cg.fillRect(0, 0, W, H);
      grilla(cg, n, t, vel, brilla, funde, px, pulso);
      ctx.globalAlpha = u; ctx.drawImage(capaG, 0, 0); ctx.globalAlpha = 1;
    } else grilla(ctx, n, t, vel, brilla, funde, px, pulso);
    resplandor(ctx, 0.4);
    nombre = forma ? "LAS PANTALLAS FORMAN EL CONJUNTO DE MANDELBROT" : `MULTIPLICACIÓN · ${(n * n).toLocaleString("es-CL")} MUNDOS`;
  }
  // the breath before the last hit: the light draws back, so the set flares on the impact
  const recoge = eSuave(cl((t - (c0 - 0.3)) / 0.3));
  if (recoge > 0 && t < c0) { ctx.fillStyle = `rgba(2,3,6,${0.45 * recoge})`; ctx.fillRect(0, 0, W, H); }
  // every hit flashes softly
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(255,244,222,${0.1 * Math.exp(-e * 14)})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  return nombre;
};

// exposure: a fixed grade per shot (montaje.json "grado", measured on the ungraded render), as a colourist would;
// a per-frame correction would fight the match cuts
let medidor: HTMLCanvasElement | null = null, copia: HTMLCanvasElement | null = null;
const exponer = (ctx: Ctx, g: number) => {
  if (!medidor) { medidor = document.createElement("canvas"); medidor.width = 64; medidor.height = 36; copia = document.createElement("canvas"); copia.width = W; copia.height = H; }
  if (Math.abs(g - 1) < 0.02) return;
  const cc = copia!.getContext("2d")!;
  cc.globalCompositeOperation = "copy";
  cc.drawImage(ctx.canvas, 0, 0);
  // a graded curve, not a linear gain: lifting uses "screen" (mid-tones rise, highlights never clip), lowering uses
  // "multiply" (shadows keep their depth)
  ctx.save();
  ctx.globalCompositeOperation = g > 1 ? "screen" : "multiply";
  ctx.globalAlpha = g > 1 ? Math.min(1, (g - 1) / 0.6) : Math.min(1, (1 - g) / 0.3);
  ctx.drawImage(copia!, 0, 0);
  ctx.restore();
};
let capaCorte: HTMLCanvasElement | null = null;
// pelicula: the film's version of the intro, without the equation (the prologue writes it), the logo or «próximamente»
// cosmos: in the film, the loaded images of the zoom from the edge of the universe to the atoms (src/cosmos.json)
// ─── the zoom of the film's ending: from the cosmic web down to the neurons, which open into the cosmic web again ────
// Every image lives in one world, nested inside the previous one: each stage has a region it enters by and a region it
// leaves by (x, y as fractions of the image, radius as a fraction of its width), and the region a stage leaves by is
// the same shape, at the same place and size, as the region the next one enters by (the web's node holds a group of
// galaxies, one of them holds the spiral, a star holds the Earth, the Earth is the iris, the pupil holds the retina,
// the neurons are the web). One camera moves through that world: its zoom grows at a constant rate (it eases in and
// settles at the end), and its aim glides from one region to the next with no change of direction at the joins. Each
// frame is the average of several exposures across the shutter, so the zoom has real motion blur.
type Etapa = { src: string; w: number; h: number; entra: number[]; sale: number[]; modo?: "luz" | "recorte"; pre?: number; post?: number; apaga?: number[]; escala?: string; nombre?: string };
const ETAPAS = COS.etapas as Etapa[];
// log-zoom at the start of every stage, and at the end of the last one
const LZ = ETAPAS.reduce((a, e) => [...a, a[a.length - 1] + Math.log(e.entra[2] / e.sale[2])], [0]);
const LFIN = LZ[LZ.length - 1];
// where each image sits in the world: world = origin + pixel * scale (the first image is the unit)
const MUNDO = ETAPAS.reduce<{ s: number; ox: number; oy: number }[]>((a, e, i) => {
  if (i === 0) return [{ s: 1, ox: 0, oy: 0 }];
  const p = ETAPAS[i - 1], q = a[i - 1];
  const s = (q.s * p.sale[2] * p.w) / (e.entra[2] * e.w);
  const bx = q.ox + p.sale[0] * p.w * q.s, by = q.oy + p.sale[1] * p.h * q.s;
  return [...a, { s, ox: bx - e.entra[0] * e.w * s, oy: by - e.entra[1] * e.h * s }];
}, []);
// the camera's aim at the start of every stage, and at the end of the last one; its scale (screen px per world unit)
const AIM = [
  ...ETAPAS.map((e, i) => [MUNDO[i].ox + e.entra[0] * e.w * MUNDO[i].s, MUNDO[i].oy + e.entra[1] * e.h * MUNDO[i].s]),
  (() => { const n = ETAPAS.length - 1, e = ETAPAS[n], m = MUNDO[n]; return [m.ox + e.sale[0] * e.w * m.s, m.oy + e.sale[1] * e.h * m.s]; })(),
];
// in a tall frame the regions are shown as large as the whole Earth allows (its disc, 620 px at COS.R, must fit the
// width); an image that then does not cover the height fades out at its top and bottom edges
const R_COS = W > H ? COS.R : Math.min(COS.R * (H / 1080), (0.47 * W * COS.R) / 620);
const K0 = R_COS / (ETAPAS[0].entra[2] * ETAPAS[0].w * MUNDO[0].s);
const escalaCam = (L: number) => K0 * Math.exp(L);
// between two aims the camera zooms about the one fixed point that takes the first aim to the second; around each
// join it blends from one segment's path to the next, so the direction of the flow never jumps
const tramoCam = (j: number, L: number) => {
  const ka = escalaCam(LZ[j]), kb = escalaCam(LZ[j + 1]), A = AIM[j], B = AIM[j + 1];
  const px = (A[0] * ka - B[0] * kb) / (ka - kb), py = (A[1] * ka - B[1] * kb) / (ka - kb), f = ka / escalaCam(L);
  return [px + (A[0] - px) * f, py + (A[1] - py) * f];
};
const centroCam = (L: number) => {
  const n = ETAPAS.length;
  let j = 0;
  while (j < n - 1 && L > LZ[j + 1]) j++;
  let c = tramoCam(j, L);
  for (const k of [j, j + 1]) {
    // the join at LZ[k], between segment k - 1 and segment k
    if (k < 1 || k > n - 1) continue;
    const d = 0.45 * Math.min(LZ[k] - LZ[k - 1], LZ[k + 1] - LZ[k]);
    const b = eSuave(cl((L - LZ[k] + d) / (2 * d)));
    if (b > 0 && b < 1) {
      const a0 = tramoCam(k - 1, L), a1 = tramoCam(k, L);
      c = [a0[0] + (a1[0] - a0[0]) * b, a0[1] + (a1[1] - a0[1]) * b];
    }
  }
  return c;
};
// time → log-zoom: a constant speed that eases in from the cut and settles on arrival; then a slow drift
// it travels faster through space and slows down as it reaches the Earth, so the body has time to be seen
const LFRENA = LZ[COS.frena];
const RITMO = (L: number) =>
  (0.3 + 0.7 * eSuave(cl(L / 1.0))) * (0.12 + 0.88 * (1 - eSuave(cl((L - (LFIN - 0.9)) / 0.9)))) *
  (0.62 + 0.6 * (1 - eSuave(cl((L - (LFRENA - 1.6)) / 1.4)))) *
  // and it crosses one stage a little faster (the Earth, on its way to the hurricane)
  (1 + COS.acelera.cuanto * eSuave(cl((L - LZ[COS.acelera.etapa] - 0.3) / 0.6)) * (1 - eSuave(cl((L - (LZ[COS.acelera.etapa + 1] - 0.8)) / 0.6))));
const TABLA = (() => {
  const n = 4000, t = [0];
  for (let i = 1; i <= n; i++) {
    const L = (LFIN * (i - 0.5)) / n;
    t.push(t[i - 1] + LFIN / n / RITMO(L));
  }
  const v = t[n] / (COS.llega - COS.corte);
  return { n, t: t.map((x) => COS.corte + x / v), v };
})();
const nivelZoom = (t: number) => {
  const { n, t: T, v } = TABLA;
  if (t <= T[0]) return (t - T[0]) * v * RITMO(0);
  if (t >= T[n]) return LFIN + (t - T[n]) * v * RITMO(LFIN);
  let a = 0, b = n;
  while (b - a > 1) { const m = (a + b) >> 1; if (T[m] <= t) a = m; else b = m; }
  return (LFIN * (a + (t - T[a]) / (T[b] - T[a]))) / n;
};
// how much of stage i shows at log-zoom L: it fades in around its start (pre before, post after); a stage that the next
// one does not cover (light on black, or a cut-out) fades out by itself over apaga, relative to its end
const alfaEntra = (i: number, L: number) => {
  const e = ETAPAS[i], pre = e.pre ?? 0.35, post = e.post ?? 0.35;
  return i === 0 ? 1 : eSuave(cl((L - (LZ[i] - pre)) / (pre + post)));
};
const alfaEtapa = (i: number, L: number) => {
  const e = ETAPAS[i], ap = e.apaga;
  return alfaEntra(i, L) * (ap ? 1 - eSuave(cl((L - (LZ[i + 1] + ap[0])) / (ap[1] - ap[0]))) : 1);
};
// does stage i's image cover the whole frame at log-zoom L? (in a tall frame its feathered top and bottom must be
// outside the frame too)
const cubreTodo = (i: number, L: number) => {
  const e = ETAPAS[i], m = MUNDO[i], k = escalaCam(L), [cx, cy] = centroCam(L);
  const X0 = W / 2 + (m.ox - cx) * k, Y0 = H / 2 + (m.oy - cy) * k, w = e.w * m.s * k, h = e.h * m.s * k;
  const f = H > W ? 0.1 * h : 0;
  return X0 <= 0 && Y0 + f <= 0 && X0 + w >= W && Y0 + h - f >= H;
};
const visibles = (L: number) =>
  ETAPAS.map((_, i) => i).filter((i) => {
    if (alfaEtapa(i, L) <= 0.002) return false;
    // hidden only once the next stage is fully in and covers the whole frame (one that is light on black, or a
    // cut-out, never does)
    const sig = ETAPAS[i + 1];
    return !(sig && !sig.modo && alfaEntra(i + 1, L) >= 0.999 && cubreTodo(i + 1, L));
  });
// exposures per frame, and the shutter (half a frame)
const EXPOS = 6, OBTURADOR = 0.5 / MONT.fps;
export const imagenesCosmos = (t: number) => {
  if (t < COS.corte - 0.7 || t >= COS.fin + 0.6) return [];
  const L0 = nivelZoom(t - OBTURADOR / 2), L1 = nivelZoom(t + OBTURADOR / 2);
  return [...new Set([...visibles(L0), ...visibles(L1)].map((i) => ETAPAS[i].src))];
};
let capaZ: HTMLCanvasElement | null = null, capaE: HTMLCanvasElement | null = null, capaV: HTMLCanvasElement | null = null;
const lienzo = (c: HTMLCanvasElement | null) => {
  if (c) return c;
  const n = document.createElement("canvas");
  n.width = W; n.height = H;
  return n;
};
// one exposure of the camera at log-zoom L
const exposicion = (c: Ctx, L: number, cosmos: Map<string, HTMLImageElement>) => {
  c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
  c.fillStyle = "#020306"; c.fillRect(0, 0, W, H);
  const k = escalaCam(L), [cx, cy] = centroCam(L);
  for (const i of visibles(L)) {
    const e = ETAPAS[i], im = cosmos.get(e.src), m = MUNDO[i];
    if (!im) continue;
    // image pixel → screen: X = W/2 + (ox + px * s - cx) * k; only the visible part of the image is drawn
    const sk = m.s * k, X0 = W / 2 + (m.ox - cx) * k, Y0 = H / 2 + (m.oy - cy) * k;
    const sx0 = Math.max(0, -X0 / sk), sy0 = Math.max(0, -Y0 / sk);
    const sx1 = Math.min(im.width, (W - X0) / sk), sy1 = Math.min(im.height, (H - Y0) / sk);
    if (sx1 <= sx0 || sy1 <= sy0) continue;
    const a = alfaEtapa(i, L), dibuja = (d: Ctx) =>
      d.drawImage(im, sx0, sy0, sx1 - sx0, sy1 - sy0, X0 + sx0 * sk, Y0 + sy0 * sk, (sx1 - sx0) * sk, (sy1 - sy0) * sk);
    c.save();
    c.imageSmoothingQuality = "high";
    if (e.modo === "luz") {
      c.globalCompositeOperation = "screen"; c.globalAlpha = a; dibuja(c);
    } else if ((a >= 0.999 || i === 0) && W > H) {
      c.globalAlpha = a; dibuja(c);
    } else {
      // a new world resolves from the aim outwards: the centre comes in first, the edges follow
      capaV = lienzo(capaV);
      const d = capaV.getContext("2d")!;
      d.globalCompositeOperation = "source-over"; d.globalAlpha = 1; d.clearRect(0, 0, W, H);
      d.imageSmoothingQuality = "high";
      dibuja(d);
      const p = alfaEntra(i, L), q = e.apaga ? alfaEtapa(i, L) / Math.max(1e-3, p) : 1;
      const ex = W / 2 + (AIM[i][0] - cx) * k, ey = H / 2 + (AIM[i][1] - cy) * k;
      const g = d.createRadialGradient(ex, ey, 0, ex, ey, Math.hypot(W, H) * 0.6);
      g.addColorStop(0, `rgba(0,0,0,${q * eSuave(cl(p * 1.6))})`);
      g.addColorStop(1, `rgba(0,0,0,${q * eSuave(cl(p * 1.6 - 0.6))})`);
      d.globalCompositeOperation = "destination-in"; d.fillStyle = g; d.fillRect(0, 0, W, H);
      if (H > W) {
        // a tall frame: the image's top and bottom edges fade to black
        const yT = Y0, yB = Y0 + im.height * sk, f = 0.1 * (yB - yT);
        if (yT > -f || yB < H + f) {
          const gb = d.createLinearGradient(0, yT, 0, yB);
          gb.addColorStop(0, "rgba(0,0,0,0)"); gb.addColorStop(0.1, "rgba(0,0,0,1)"); gb.addColorStop(0.9, "rgba(0,0,0,1)"); gb.addColorStop(1, "rgba(0,0,0,0)");
          d.fillStyle = gb; d.fillRect(0, 0, W, H);
        }
      }
      c.drawImage(capaV, 0, 0);
    }
    c.restore();
  }
};
const zoomCosmico = (ctx: Ctx, t: number, cosmos: Map<string, HTMLImageElement>) => {
  if (t >= COS.fin + 0.6) return;
  capaZ = lienzo(capaZ); capaE = lienzo(capaE);
  const z = capaZ.getContext("2d")!, ce = capaE.getContext("2d")!;
  z.globalCompositeOperation = "source-over"; z.globalAlpha = 1;
  z.fillStyle = "#000"; z.fillRect(0, 0, W, H);
  // the frame is the average of the exposures across the shutter
  for (let s = 0; s < EXPOS; s++) {
    exposicion(ce, nivelZoom(t + ((s + 0.5) / EXPOS - 0.5) * OBTURADOR), cosmos);
    z.globalCompositeOperation = "lighter"; z.globalAlpha = 1 / EXPOS;
    z.drawImage(capaE, 0, 0);
  }
  z.globalCompositeOperation = "source-over"; z.globalAlpha = 1;
  const L = nivelZoom(t);
  // in: a cross-dissolve from the fractal's spiral, with a breath of light on the word; out: to black before the title
  const entra = eSuave(cl((t - (COS.corte - 0.6)) / 1.2)), sale = 1 - eSuave(cl((t - COS.fin) / 0.6));
  ctx.save(); ctx.globalAlpha = entra * sale; ctx.drawImage(capaZ, 0, 0); ctx.restore();
  const luz = 0.3 * Math.exp(-Math.abs(t - COS.corte) * 5);
  if (luz > 0.01) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,236,210,${luz})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (t > COS.fin) { ctx.fillStyle = `rgba(2,3,6,${1 - sale})`; ctx.fillRect(0, 0, W, H); }
  // the scale of what we are looking at, in a corner, while its stage is the one on screen
  ETAPAS.forEach((e, i) => {
    if (!e.escala) return;
    const fin = i + 1 < ETAPAS.length ? LZ[i + 1] : LZ[i] + 99;
    const a = entra * sale * eSuave(cl((L - LZ[i] + 0.05) / 0.3)) * (1 - eSuave(cl((L - fin + 0.35) / 0.3)));
    if (a < 0.02) return;
    // in a 9:16 frame, above the space the apps cover with their buttons and captions
    const yb = H - (H / W > 1.5 ? 420 : 0);
    texto(ctx, e.escala, 80, yb - 120, 40, `rgba(${RGB.crema},${0.92 * a})`, { fam: SANS, peso: 600, esp: 2 });
    texto(ctx, e.nombre ?? "", 80, yb - 78, 18, `rgba(${RGB.crema},${0.65 * a})`, { esp: 5 });
  });
};

export const dibujarMontajeMG = (ctx: Ctx, t: number, frame: number, marca?: HTMLImageElement | null, pelicula = false, cosmos?: Map<string, HTMLImageElement>) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  let rotulo = "";
  let hud: string[] = [];
  if (t >= MONT.climax && t < MONT.corte) {
    const r = climax(ctx, t);
    if (t < MONT.corte) rotulo = `CLÍMAX · ${r}`;
  } else if (t >= L[0] && t < MONT.corte) {
    const sh = toma(t);
    const t0 = L[INICIO[sh]];
    const fin = sh + 1 < SEQ.length ? L[INICIO[sh + 1]] : MONT.climax;
    const dur = fin - t0;
    // soft, elegant cut on the hit: the new shot dissolves over the previous one in a quarter of a second
    const fundido = sh > 0 ? eSuave(cl((t - t0) / 0.15)) : 1;
    if (fundido < 1) {
      const p0 = L[INICIO[sh - 1]];
      SEQ[sh - 1][0](ctx, t, t - p0, sh - 1, t0 - p0);
      if (!capaCorte) { capaCorte = document.createElement("canvas"); capaCorte.width = W; capaCorte.height = H; }
      const cc = capaCorte.getContext("2d")!;
      cc.globalAlpha = 1;
      cc.fillStyle = "#020306";
      cc.fillRect(0, 0, W, H);
      const r = SEQ[sh][0](cc, t, t - t0, sh, dur);
      rotulo = r.rotulo; hud = r.hud;
      ctx.globalAlpha = fundido;
      ctx.drawImage(capaCorte, 0, 0);
      ctx.globalAlpha = 1;
    } else {
      const r = SEQ[sh][0](ctx, t, t - t0, sh, dur);
      rotulo = r.rotulo; hud = r.hud;
    }
    // every hit: the image breathes with a light that fades by itself
    const golpe = Math.exp(-(t - t0) * 5);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255,244,222,${(sh === 0 ? 0 : 0.03) * golpe})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  // even exposure before the climax: every shot is graded towards the same mean brightness
  if (t >= L[0] && t < MONT.climax) {
    const sh = toma(t), gr = (MONT as unknown as { grado?: Record<string, number | number[]> }).grado ?? {};
    const nombre = (k: number) => (MONT as unknown as { seq: string[] }).seq[k].split("*")[0];
    // a grade is a number, or [start, end] when the shot changes subject inside (it moves over the last 40 %)
    const grado = (k: number, u: number) => { const v = (gr as Record<string, number | number[]>)[nombre(k)] ?? 1; return Array.isArray(v) ? lerp(v[0], v[1], eSuave(cl((u - 0.7) / 0.3))) : v; };
    const t0 = L[INICIO[sh]], t1 = sh + 1 < SEQ.length ? L[INICIO[sh + 1]] : MONT.climax;
    const g1 = grado(sh, (t - t0) / (t1 - t0)), g0 = sh > 0 ? grado(sh - 1, 1) : g1;
    exponer(ctx, lerp(g0, g1, eSuave(cl((t - t0) / 0.4))));
  }
  // the first beat opens from black, without a flash
  if (t < L[0] + 0.8) { ctx.fillStyle = `rgba(2,3,6,${1 - eSuave(cl((t - L[0]) / 0.8))})`; ctx.fillRect(0, 0, W, H); }
  // no white burst: the wall goes out screen by screen and its centre becomes the ending
  // after the silence: one slow continuous dive towards the border while the voice speaks
  if (t >= MONT.corte) {
    // the set the screens formed stays where it is, whole and still; when the voice says "draws a border that never
    // ends", a fast immersion starts: five places of the border, each one diving deep while its shape mutates live
    // (the slice of the four-dimensional object turns towards the Julia set of the place, and c circles around it);
    // the next place fades in while both are diving, so the fall never stops
    const V = inmersion(t);
    pintaInmersion(ctx, t);
    // the last hit is a pulse of colour: a wave of light leaves the border and runs out through every band of the
    // set while the palette sweeps, with a short flash; it settles in a second, into the silence
    const u = t - MONT.corte;
    const luz = Math.exp(-u * 1.5);
    if (luz > 0.01) { ctx.save(); ctx.globalCompositeOperation = "screen"; pinta(ctx, 0, 0, W, H, { ...V, pal: 2, onda: u * 0.8 }, luz); ctx.restore(); }
    // a shock wave: a ring of amber and magenta light leaves the heart of the set and crosses the whole frame
    if (u < 1.2) {
      const ox = W / 2 + ((-0.2 - V_M.cx) / V_M.ancho) * W, oy = H / 2;
      const x = cl(u / 1.1), r = 60 + (1 - (1 - x) * (1 - x)) * W * 1.1, ancho = 160 + 320 * x, a = 1 - eSuave(cl((u - 0.1) / 1.1));
      const gr = ctx.createRadialGradient(ox, oy, Math.max(0, r - ancho), ox, oy, r + ancho * 0.4);
      gr.addColorStop(0, "rgba(255,70,150,0)");
      gr.addColorStop(0.55, `rgba(255,90,170,${0.55 * a})`);
      gr.addColorStop(0.8, `rgba(255,190,110,${a})`);
      gr.addColorStop(1, "rgba(255,190,110,0)");
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    const destello = 0.25 * Math.exp(-u * 12);
    if (destello > 0.01) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,226,190,${destello})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (pelicula && cosmos && t >= COS.corte - 0.6) zoomCosmico(ctx, t, cosmos);
    const ar = Math.min(eSuave(pr(t, MONT.regla, 0.8)), 1 - eSuave(pr(t, MONT.reglaFin, 0.8)));
    if (!pelicula) textoFractal(ctx, "z → z² + c", H / 2 + 110 * K_TEXTO, 300 * K_TEXTO, ar, t, 400);
    tituloEpico(ctx, t, pelicula);
  }
  // in the film the logo comes later and smaller, so the title holds the frame on its own first
  const am = Math.min(eSuave(pr(t, MONT.titulo + (pelicula ? 4.4 : 1.2), pelicula ? 1.2 : 0.9)), 1 - eSuave(pr(t, MONT.total - 0.8, 0.8)));
  if (am > 0 && marca) {
    const mw = pelicula ? 140 : 230, mh = (mw * marca.height) / marca.width;
    ctx.globalAlpha = am;
    ctx.drawImage(marca, W / 2 - mw / 2, H / 2 + (pelicula ? Math.min(330, H / 2 - 150) : 190), mw, mh);
    ctx.globalAlpha = 1;
  }
  if (am > 0 && marca && !pelicula) {
    const mh = (230 * marca.height) / marca.width;
    // and, a moment later, what comes next
    const ap = Math.min(eSuave(pr(t, MONT.titulo + 2.1, 0.9)), 1 - eSuave(pr(t, MONT.total - 0.8, 0.8)));
    if (ap > 0) texto(ctx, "PRÓXIMAMENTE", W / 2 + 4, H / 2 + 190 + mh + 70, 24, `rgba(${RGB.crema},${0.8 * ap})`, { alin: "center", esp: 8 });
  }
  const fin = eSuave(pr(t, MONT.total - 0.8, 0.8));
  if (fin > 0) { ctx.fillStyle = `rgba(2,3,6,${fin})`; ctx.fillRect(0, 0, W, H); }
  if (rotulo) texto(ctx, rotulo, W - 72, 64 + SEGURO_ARRIBA, 15, `rgba(${RGB.crema},0.55)`, { alin: "right", esp: 2 });
  if (t >= L[0] && t < MONT.corte) {
    // instrument HUD: corner brackets, live readouts and the racing heart
    const m = 40, b = 26;
    ctx.save();
    ctx.strokeStyle = `rgba(${RGB.crema},0.5)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
      ctx.moveTo(x, y + sy * b); ctx.lineTo(x, y); ctx.lineTo(x + sx * b, y);
    }
    ctx.stroke();
    ctx.restore();
    texto(ctx, "z → z² + c", 72, 64 + SEGURO_ARRIBA, 15, `rgba(${RGB.crema},0.55)`, { esp: 2 });
    hud.forEach((s, k) => texto(ctx, s, 72, H - 64 - SEGURO_ABAJO - (hud.length - 1 - k) * 24, 15, `rgba(${RGB.crema},${k === 0 ? 0.75 : 0.5})`, { esp: 2 }));
    const i = indice(t);
    const lpm = Math.round(60 / ((i + 1 < L.length ? L[i + 1] : MONT.corte) - L[i]));
    texto(ctx, `LATIDO ${String(i + 1).padStart(2, "0")} · ${lpm} LPM`, W - 72, H - 64 - SEGURO_ABAJO, 15, `rgba(${RGB.crema},0.75)`, { alin: "right", esp: 2 });
  }
  const i = indice(t);
  // the beat's impact in the post: strong in the climax, a breath before it
  // the image's impact: a breath on the beats, strong in the climax, and the largest on the last hit
  const imp = t >= L[0] && t < MONT.corte ? Math.exp(-(t - L[i]) * 7) * (t < MONT.climax ? 0.2 : 0.8) : t >= MONT.corte && t < MONT.corte + 2 ? 1.5 * Math.exp(-(t - MONT.corte) * 3.5) : 0;
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.86, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: pelicula ? 0 : RETRO.curva, esq: pelicula ? 0.03 : RETRO.curva, impacto: imp * RETRO.imp, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) {
    ctx.save();
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(pp, 0, 0, W, H);
    ctx.restore();
  }
};

// preview of one living shot on its own (composition PlanoVivo), with the same HUD and finish as the montage
export const dibujarPlanoVivo = (ctx: Ctx, t: number, frame: number, nombre: string, dur: number) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  const d = DISPOSITIVOS[nombre] ?? (nombre.startsWith("organismo") ? organismo(Number(nombre.slice(9))) : tejido(Number(nombre.slice(6))));
  const r = d(ctx, t, t, 0, dur);
  texto(ctx, r.rotulo, W - 72, 64, 15, `rgba(${RGB.crema},0.55)`, { alin: "right", esp: 2 });
  texto(ctx, "z → z² + c", 72, 64, 15, `rgba(${RGB.crema},0.55)`, { esp: 2 });
  r.hud.forEach((s, k) => texto(ctx, s, 72, H - 64 - (r.hud.length - 1 - k) * 24, 15, `rgba(${RGB.crema},${k === 0 ? 0.75 : 0.5})`, { esp: 2 }));
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.86, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: RETRO.curva, esq: RETRO.curva, impacto: 0, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) {
    ctx.save();
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(pp, 0, 0, W, H);
    ctx.restore();
  }
};
