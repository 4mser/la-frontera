// PRÓLOGO v2 · «El borde de todo» (fractales/GUION-prologo.md). A real heart in the dark; its day becomes a landscape
// that dissolves into a coast seen from space, a delta, a lightning bolt, a neuron and the cosmic web (real material
// and a labelled simulation); a real Chilean coast measured with ever shorter rulers; the Mandelbrot set discovered
// as a silhouette and then entered; a point of light that beats, and the last beat writes the rule.
// Every frame goes through the teaser's finish, so the stock and our simulations read as one film.
import P from "./prologo2.json";
import COSTA from "./costa.json";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { PALETAS, pintarFractalTeaser } from "./fractalTeaser";
import { RGB, SANS, MONO, cl, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
const AZUL = "150,190,255", AMBAR = "255,190,120";

// «sin texto»: the same picture with no lettering at all (for the trailer: --props='{"limpio":true}')
let SIN_TEXTO = false;
export const ponLimpio = (b: boolean) => { SIN_TEXTO = b; };
const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  if (SIN_TEXTO) return;
  ctx.font = `${op.peso ?? 500} ${tam}px "${op.fam ?? MONO}"`;
  ctx.fillStyle = color;
  ctx.textAlign = op.alin ?? "left";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 3}px`;
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};

// ─── the glimpses: forms of the world (destellos.json) and, every fourth one, a fractal computed here ─────────────
import DEST from "../public/p2/destellos.json";
// centro: a glimpse whose subject must sit in the middle of its circle (the snowflake), as a point of the image
type Destello = { tipo: "foto"; src: string; centro?: number[] } | { tipo: "fractal"; k: number; centro?: number[] };
const FRACTALES: { cx: number; cy: number; ancho: number; julia?: [number, number]; regla?: number; pal: number }[] = [
  { cx: 0, cy: 0, ancho: 3.2, julia: [-0.8, 0.156], pal: 0 },
  { cx: -1.2563679, cy: 0.380321, ancho: 0.024, pal: 2 },
  { cx: 0, cy: 0, ancho: 3.4, julia: [-0.162, 1.04], pal: 1 },
  { cx: -1.7615, cy: -0.0285, ancho: 0.06, regla: 1, pal: 2 },
  { cx: -0.7453, cy: 0.1127, ancho: 0.012, pal: 0 },
  { cx: 0, cy: 0, ancho: 3.0, julia: [0.285, 0.01], pal: 1 },
  { cx: 0, cy: 0, ancho: 3.3, julia: [-0.39054, -0.58679], pal: 2 },
];
const LISTA: Destello[] = (() => {
  const out: Destello[] = [];
  let f = 0, n = 0;
  const fotos = (DEST as { archivo: string; centro?: number[] }[]).map((d) => ({ src: `p2/destellos/${d.archivo}`, centro: d.centro }));
  while (out.length < P.destellos.length && (n < fotos.length || f < FRACTALES.length)) {
    if ((out.length % 4 === 3 && f < FRACTALES.length) || n >= fotos.length) out.push({ tipo: "fractal", k: f++ });
    else { const fo = fotos[n++]; out.push({ tipo: "foto", src: fo.src, centro: fo.centro }); }
  }
  return out;
})();
const capasF = new Map<number, HTMLCanvasElement>();
const fractal = (k: number) => {
  let c = capasF.get(k);
  if (c) return c;
  const F = FRACTALES[k];
  const l = pintarFractalTeaser(W, H, { cx: F.cx, cy: F.cy, esc: F.ancho / W, rot: 0, julia: F.julia, modo: 0, lente: 1e9, fase: 0.1 * k, paleta: PALETAS[F.pal], brillo: 0.95, maxIt: F.julia ? 400 : Math.round(250 + 160 * Math.log10(2.8 / F.ancho)), tiempo: 0, regla: F.regla });
  c = document.createElement("canvas"); c.width = W; c.height = H;
  c.getContext("2d")!.drawImage(l, 0, 0, W, H);
  capasF.set(k, c);
  return c;
};

// ─── the images each moment needs (the component loads them before drawing) ──────────────────────────────────────
const SEQ = { delta: 165, rayo: 138, nervios: 66, cosmos: 240 } as const;
// frames per second of each sequence (the tractography is a slow turn: 66 frames over 9 s, shown a little faster)
const FPS_SEQ: Record<Plano, number> = { delta: 30, rayo: 30, nervios: 14, cosmos: 30 };
type Plano = keyof typeof SEQ;
const cuadroDe = (plano: Plano, t: number) => {
  const [a] = P[plano] as number[];
  return Math.min(SEQ[plano], Math.max(1, Math.floor((t - a) * FPS_SEQ[plano]) + 1));
};
const ruta = (plano: Plano, k: number) => `p2/${plano}/${String(k).padStart(4, "0")}.jpg`;
const activo = (rango2: number[], t: number) => t >= rango2[0] && t < rango2[1];
export const imagenes = (t: number): string[] => {
  const out: string[] = [];
  if (activo(P.foto, t) || t < P.foto[0]) out.push("p2/fotos/moraleda.jpg");
  P.destellos.forEach(([b], k) => { const d = LISTA[k]; if (d && d.tipo === "foto" && t >= (b as number) - 0.1 && t < (b as number) + 1.4) out.push(d.src); });
  for (const f of ["arboles", "manos", "neurona", "retrato"] as const) if (activo(P[f], t)) out.push(`p2/fotos/${f === "retrato" ? "mandelbrot" : f}.jpg`);
  if (activo(P.nervios, t)) for (let j = 1; j <= 3; j++) out.push(`p2/fotos/nervios-${j}.jpg`);
  for (const pl of ["delta", "rayo", "cosmos"] as Plano[]) if (activo(P[pl], t)) out.push(ruta(pl, cuadroDe(pl, t)));
  return out;
};
export type Cache = Map<string, HTMLImageElement>;

// a dissolve weight for a shot: fades in over its first second and out over the next shot's first second
const peso = (r: number[], t: number, entra = 1.0, sale = 1.0) => Math.min(eSuave(cl((t - r[0]) / entra)), 1 - eSuave(cl((t - (r[1] - sale)) / sale)));
// an image covering the frame, with a slow push towards a point (u = 0..1 across the shot)
const cubre = (ctx: Ctx, img: HTMLImageElement | undefined, alfa: number, u: number, z0 = 1.0, z1 = 1.1, fx = 0.5, fy = 0.5) => {
  if (!img || alfa <= 0) return;
  const s = Math.max(W / img.width, H / img.height) * lerp(z0, z1, u);
  const w = img.width * s, h = img.height * s;
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.imageSmoothingQuality = "high";
  // the focus point never pulls an edge of the image into the frame
  ctx.drawImage(img, Math.min(0, Math.max(W - w, W / 2 - w * fx)), Math.min(0, Math.max(H - h, H / 2 - h * fy)), w, h);
  ctx.restore();
};
// an image seen through a soft circle of light centred at (x, y), radius r; the rim glows
let capaR: HTMLCanvasElement | null = null;
const revela = (ctx: Ctx, im: HTMLImageElement | HTMLCanvasElement | undefined, x: number, y: number, r: number, a: number, zoom = 1.1, fy = 0.5, centro?: number[]) => {
  if (!im || a <= 0 || r < 1) return;
  if (!capaR) { capaR = document.createElement("canvas"); capaR.width = W; capaR.height = H; }
  const c = capaR.getContext("2d")!;
  c.globalCompositeOperation = "source-over";
  c.clearRect(0, 0, W, H);
  const s = Math.max(W / im.width, H / im.height) * zoom, w = im.width * s, h = im.height * s;
  if (centro) {
    // the subject's point sits on the circle's centre, and the whole subject fits the circle: the image's height is
    // the circle's diameter, so it grows with the circle
    const hc = 2.05 * r, wc = (hc * im.width) / im.height;
    c.drawImage(im, x - wc * centro[0], y - hc * centro[1], wc, hc);
  } else c.drawImage(im, W / 2 - w / 2, Math.min(0, Math.max(H - h, H / 2 - h * fy)), w, h);
  c.globalCompositeOperation = "destination-in";
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.62, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = a; ctx.drawImage(capaR, 0, 0);
  // the rim of light
  ctx.globalCompositeOperation = "lighter";
  const g2 = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * 1.02);
  g2.addColorStop(0, `rgba(${AZUL},0)`); g2.addColorStop(0.85, `rgba(${AZUL},${0.25 * a})`); g2.addColorStop(1, `rgba(${AZUL},0)`);
  ctx.globalAlpha = 1; ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
  ctx.restore();
};
// in a 9:16 frame, the space the apps cover with their buttons (above) and captions (below)
const SEGURO_ARRIBA = H / W > 1.5 ? 160 : 0, SEGURO_ABAJO = H / W > 1.5 ? 380 : 0;
const etiqueta = (ctx: Ctx, s: string, a: number) => {
  if (a <= 0) return;
  // in a narrow frame each part of the caption goes on its own line, the last one at the bottom
  const lineas = W < 1500 ? s.split(" · ") : [s];
  lineas.forEach((l, k) => texto(ctx, l, 80, H - 80 - SEGURO_ABAJO - (lineas.length - 1 - k) * 28, 16, `rgba(${RGB.crema},${0.6 * a})`, { esp: 4 }));
};

// ─── the Mandelbrot set, computed (the teaser's colouring) ─────────────────────────────────────────────────────────
const M_FIN: [number, number] = [-0.77568377, 0.13646737];
const pintaM = (ctx: Ctx, cx: number, cy: number, ancho: number, t: number, alfa = 1) => {
  const SS = 2, pw = W * SS, ph = H * SS;
  const l = pintarFractalTeaser(pw, ph, { cx, cy, esc: ancho / pw, rot: 0, modo: 0, lente: 1e9, fase: 0.04 * t, paleta: PALETAS[0], brillo: 0.9, maxIt: Math.round(250 + 160 * Math.log10(2.8 / ancho)), tiempo: 0 });
  ctx.save(); ctx.globalAlpha = alfa; ctx.imageSmoothingQuality = "high"; ctx.drawImage(l, 0, 0, W, H); ctx.restore();
};

// ─── the coast, measured ──────────────────────────────────────────────────────────────────────────────────────────
// the stretch is tall (north–south): it is turned a quarter so it fills the frame, north to the left
const C: number[][] = COSTA.costa;
const cxs = C.map((p) => p[1]), cys = C.map((p) => p[0]);
const ex = [Math.min(...cxs), Math.max(...cxs)], ey = [Math.min(...cys), Math.max(...cys)];
const escC = Math.min((W * 0.84) / (ex[1] - ex[0]), (H * 0.62) / (ey[1] - ey[0]));
const enMapa = (p: number[]): [number, number] => [W / 2 + (p[1] - (ex[0] + ex[1]) / 2) * escC, H * 0.48 + (p[0] - (ey[0] + ey[1]) / 2) * escC];
// the camera of the coast's last stretch: it zooms z times about one point of the coast (F, where it sits on the map)
// while sliding that point to the centre of the frame (g = 0..1)
const FOCO = COSTA.costa[540];
const cam = { z: 1, g: 0 };
const enPantalla = (p: number[]): [number, number] => {
  const [x, y] = enMapa(p);
  if (cam.z === 1 && cam.g === 0) return [x, y];
  const [fx, fy] = enMapa(FOCO);
  return [fx + (W / 2 - fx) * cam.g + (x - fx) * cam.z, fy + (H / 2 - fy) * cam.g + (y - fy) * cam.z];
};
// past the data's resolution, every segment on screen splits again with the same roughness: its midpoint moves
// sideways by a fixed share of its length (a deterministic hash of its ends), and the new wiggle grows in smoothly as
// the segment gets long enough on screen to show it
const azar = (a: number[], b: number[]) => {
  const v = Math.sin(a[0] * 12.9898 + a[1] * 78.233 + b[0] * 37.719 + b[1] * 4.581) * 43758.5453;
  return 2 * (v - Math.floor(v)) - 1;
};
const refina = (pts: number[][]) => {
  const out: [number, number][] = [enPantalla(pts[0])];
  const sub = (a: number[], b: number[], A: [number, number], B: [number, number], d: number) => {
    const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const fuera = Math.max(A[0], B[0]) < -len || Math.min(A[0], B[0]) > W + len || Math.max(A[1], B[1]) < -len || Math.min(A[1], B[1]) > H + len;
    if (len < 5 || d > 22 || fuera) { out.push(B); return; }
    const k = 0.3 * azar(a, b) * eSuave(cl((len - 5) / 18));
    const m = [(a[0] + b[0]) / 2 - (b[1] - a[1]) * k, (a[1] + b[1]) / 2 + (b[0] - a[0]) * k];
    const M = enPantalla(m);
    sub(a, m, A, M, d + 1); sub(m, b, M, B, d + 1);
  };
  for (let i = 1; i < pts.length; i++) sub(pts[i - 1], pts[i], out[out.length - 1], enPantalla(pts[i]), 0);
  return out;
};
const trazaPantalla = (ctx: Ctx, pts: [number, number][], col: string, a: number, lw: number) => {
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineJoin = ctx.lineCap = "round";
  for (const [w, o] of [[lw * 5, 0.08], [lw * 2, 0.22], [lw, 0.9]] as const) {
    ctx.strokeStyle = `rgba(${col},${o * a})`; ctx.lineWidth = w; ctx.beginPath();
    pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  ctx.restore();
};
// a length in metres, as a ruler's label: km, m, cm, mm
const medida = (km: number) => (km >= 1 ? `${km.toLocaleString("es-CL", { maximumFractionDigits: 1 })} KM` : km >= 0.001 ? `${(km * 1000).toLocaleString("es-CL", { maximumFractionDigits: 1 })} M` : km >= 0.00001 ? `${(km * 1e5).toLocaleString("es-CL", { maximumFractionDigits: 1 })} CM` : `${(km * 1e6).toLocaleString("es-CL", { maximumFractionDigits: 1 })} MM`);
const traza = (ctx: Ctx, pts: number[][], col: string, a: number, lw: number, hasta = 1) => {
  const n = Math.max(2, Math.floor(pts.length * hasta));
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineJoin = ctx.lineCap = "round";
  for (const [w, o] of [[lw * 5, 0.08], [lw * 2, 0.22], [lw, 0.9]] as const) {
    ctx.strokeStyle = `rgba(${col},${o * a})`; ctx.lineWidth = w; ctx.beginPath();
    for (let k = 0; k < n; k++) { const [x, y] = enPantalla(pts[k]); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
  }
  ctx.restore();
};

// the clean finish (formato.json «limpio»): no grain, scanlines or noise, for the small WhatsApp files, where the
// grain would eat the whole bitrate
const LIMPIO = (FORMATO as { limpio?: boolean }).limpio === true;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: LIMPIO ? 0 : 0.05, scan: LIMPIO ? 0 : 0.18, curva: 0.16, ruido: LIMPIO ? 0 : 0.5, grade: 1.8, imp: 0.5 };
const golpes = [...P.latidos, ...P.lentos];
const ultimoGolpe = (t: number) => { let u = -99; for (const b of golpes) if (b <= t) u = b; return u; };

export const dibujarPrologo2 = (ctx: Ctx, t: number, frame: number, cache: Cache) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  const eg = t - ultimoGolpe(t);
  const img = (s: string) => cache.get(s);

  // ── 1 · the heart as light: each beat is a pulse of light; from the fourth on, each pulse opens a circle onto a
  // glimpse of the world (coast, delta, lightning, neuron, cosmos), wider and longer as the heart goes on ──
  if (t < P.foto[0] + 1.5) {
    // the pure pulses of the first beats: a glow that breathes out from the centre
    for (const b of P.latidos) {
      const e = t - b;
      if (b > 6.0 || e < 0 || e > 1.4) continue;
      const k = P.latidos.indexOf(b), r = (120 + 160 * k) * eOut(cl(e / 0.5)), a = Math.exp(-e * 3.5) * (0.5 + 0.25 * k);
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(1, r));
      g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.15, `rgba(${AZUL},${0.5 * a})`); g.addColorStop(1, `rgba(${AZUL},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    // the glimpses: never the same twice; on a beat a wider circle with its rim of light, between beats quicker ones
    P.destellos.forEach(([b, golpe], k) => {
      const e = t - (b as number);
      const d = LISTA[k];
      if (!d) return;
      const u = k / Math.max(1, P.destellos.length - 1);
      const vida = golpe ? 0.6 : 0.32;
      if (e < 0 || e > vida + 0.6) return;
      const im = d.tipo === "foto" ? img(d.src) : fractal(d.k);
      if (!im) return;
      const R = Math.hypot(W, H) * (golpe ? 0.3 + 0.25 * u : 0.24 + 0.3 * u) * eOut(cl(e / (golpe ? 0.35 : 0.2)));
      const a = Math.min(1, e / 0.05) * Math.exp(-Math.max(0, e - (golpe ? 0.18 : 0.08)) * (golpe ? 3.0 : 5.0));
      const x = W / 2 + (((k * 0.37) % 1) - 0.5) * W * 0.3 * (1 - u * 0.5), y = H / 2 + (((k * 0.61) % 1) - 0.5) * H * 0.22 * (1 - u * 0.5);
      revela(ctx, im, x, y, R, a, 1.08 + 0.1 * e, 0.5, d.centro);
    });
  }
  // the coast that stays: the beat at its start opens the circle all the way
  const abreFoto = eOut(cl((t - P.foto[0]) / 0.9));

  // ── 2 · the same wrinkle: coast from space, delta, lightning, neuron, cosmic web ──
  const ap = (r: number[]) => peso(r, t, 1.2, 1.0);
  if (activo(P.foto, t)) {
    if (abreFoto < 1) revela(ctx, img("p2/fotos/moraleda.jpg"), W / 2, H / 2, Math.hypot(W, H) * 0.75 * abreFoto, 1, 1.0 + 0.12 * pr(t, P.foto[0], P.foto[1] - P.foto[0]), 0.42);
    else cubre(ctx, img("p2/fotos/moraleda.jpg"), 1 - eSuave(cl((t - (P.foto[1] - 1.0)) / 1.0)), pr(t, P.foto[0], P.foto[1] - P.foto[0]), 1.0, 1.12, 0.5, 0.42);
  }
  // the list «en un río, en un rayo, en árboles y plantas, en tus manos, en tu sistema nervioso, en una neurona»: each
  // shot comes in on its word with a short dissolve and pushes in slowly
  const lista = (r: number[]) => peso(r, t, P.funde, P.funde);
  // in a tall frame the lightning, on the left of the shot, stays in the crop
  for (const pl of ["delta", "rayo"] as Plano[]) if (activo(P[pl], t)) cubre(ctx, img(ruta(pl, cuadroDe(pl, t))), lista(P[pl]), pr(t, P[pl][0], P[pl][1] - P[pl][0]), 1.02, 1.08, pl === "rayo" && H > W ? 0.3 : 0.5);
  const fotoLista = (f: "arboles" | "manos" | "neurona", z0: number, z1: number, fx: number, fy: number) => {
    if (activo(P[f], t)) cubre(ctx, img(`p2/fotos/${f}.jpg`), lista(P[f]), pr(t, P[f][0], P[f][1] - P[f][0]), z0, z1, fx, fy);
  };
  fotoLista("arboles", 1.0, 1.1, 0.5, 0.5);
  fotoLista("manos", 1.0, 1.12, 0.5, 0.55);
  fotoLista("neurona", 1.15, 1.45, 0.55, 0.45);
  // the nervous system: three real views in a row (the whole system, a dissection, the brain with its nerves), each a
  // third of the shot with a short dissolve, pushing in
  if (activo(P.nervios, t)) {
    const [a0, a1] = P.nervios, d = (a1 - a0) / 3;
    for (let j = 0; j < 3; j++) {
      const r = [a0 + j * d - (j ? P.funde / 2 : 0), a0 + (j + 1) * d + (j < 2 ? P.funde / 2 : 0)];
      if (!activo(r, t)) continue;
      const al = j === 0 ? Math.min(lista(P.nervios), 1 - eSuave(cl((t - (r[1] - P.funde)) / P.funde))) : j === 2 ? Math.min(eSuave(cl((t - r[0]) / P.funde)), lista(P.nervios)) : peso(r, t, P.funde, P.funde);
      cubre(ctx, img(`p2/fotos/nervios-${j + 1}.jpg`), al, pr(t, r[0], r[1] - r[0]), 1.0, 1.08, 0.5, j === 2 ? 0.5 : 0.35);
    }
  }
  if (activo(P.cosmos, t)) cubre(ctx, img(ruta("cosmos", cuadroDe("cosmos", t))), ap(P.cosmos), pr(t, P.cosmos[0], P.cosmos[1] - P.cosmos[0]), 1.0, 1.06);
  for (const pl of ["foto", "cosmos"] as const) {
    const r = P[pl] as number[];
    if (activo(r, t)) etiqueta(ctx, (P.etiquetas as Record<string, string>)[pl], Math.min(eSuave(pr(t, r[0] + 0.8, 0.8)), 1 - eSuave(pr(t, r[1] - 1.4, 0.6))));
  }

  // ── 3 · a real coast, measured with ever shorter rulers ──
  if (activo(P.costa, t)) {
    const a = peso(P.costa, t, 1.4, 1.2);
    // the last stretch: the camera dives into one point of the coast, faster and faster
    const uz = pr(t, P.zoomCosta[0], P.zoomCosta[1] - P.zoomCosta[0]);
    cam.z = Math.pow(10, 4.5 * Math.pow(uz, 1.6)); cam.g = eSuave(cl(uz / 0.35));
    // while Mandelbrot is on screen, the coast steps back
    const ar = peso(P.retrato, t, 0.8, 0.8), ac = a * (1 - 0.85 * (activo(P.retrato, t) ? ar : 0));
    if (uz > 0) trazaPantalla(ctx, refina(C), RGB.crema, ac * 0.8, 1.3);
    else traza(ctx, C, RGB.crema, ac * 0.75, 1.2, eOut(pr(t, P.costa[0], 2.4)));
    // the ruler in use: its walk draws itself step by step on the coast
    let k = -1;
    for (let j = 0; j < P.reglas.length; j++) if (t >= P.reglas[j]) k = j;
    if (k >= 0 && uz < 0.12) {
      // (the measured rulers fade out as the dive begins)
      const a = ac * (1 - eSuave(cl(uz / 0.12)));
      const M = COSTA.medidas[k], prev = k > 0 ? COSTA.medidas[k - 1] : null;
      // every ruler walks the coast at the same pace (the last one too), without slowing down at the end
      const u = pr(t, P.reglas[k], 1.25);
      if (prev) traza(ctx, prev.puntos, AMBAR, a * 0.25 * (1 - u), 1.4);
      traza(ctx, M.puntos, AMBAR, a, 1.8, u);
      // the compass points
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(${AMBAR},${0.9 * a})`;
      const n = Math.floor(M.puntos.length * u);
      if (M.puntos.length < 120) for (let j = 0; j < n; j++) { const [x, y] = enPantalla(M.puntos[j]); ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      const largo = Math.round(lerp(prev ? prev.largo : 0, M.largo, u));
      texto(ctx, `REGLA ${M.regla} KM`, 80, 110 + SEGURO_ARRIBA, 22, `rgba(${AMBAR},${0.95 * a})`, { esp: 4 });
      texto(ctx, `LARGO MEDIDO ${largo.toLocaleString("es-CL")} KM`, 80, 148 + SEGURO_ARRIBA, 22, `rgba(${RGB.crema},${0.95 * a})`, { esp: 4 });
    }
    if (uz > 0) {
      // the dive: a ruler of the same size on screen walks the coast both ways from the centre; in kilometres it keeps
      // shrinking, and the measured length keeps growing with the roughness the six real rulers showed (D ≈ 1.3)
      const ad = a * eSuave(cl((uz - 0.04) / 0.1));
      const pts = refina(C), PASO = 64;
      let i0 = 0, dmin = Infinity;
      pts.forEach(([x, y], i) => { const d = Math.hypot(x - W / 2, y - H / 2); if (d < dmin) { dmin = d; i0 = i; } });
      const camina = (dir: number) => {
        const out: [number, number][] = [pts[i0]];
        let i = i0;
        while (out.length < 40) {
          const [px, py] = out[out.length - 1];
          while (i + dir >= 0 && i + dir < pts.length && Math.hypot(pts[i][0] - px, pts[i][1] - py) < PASO) i += dir;
          if (i + dir < 0 || i + dir >= pts.length) break;
          out.push(pts[i]);
          if (pts[i][0] < -200 || pts[i][0] > W + 200 || pts[i][1] < -200 || pts[i][1] > H + 200) break;
        }
        return out;
      };
      const paso = [...camina(-1).reverse(), ...camina(1).slice(1)];
      trazaPantalla(ctx, paso, AMBAR, ad, 1.8);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(${AMBAR},${0.9 * ad})`;
      for (const [x, y] of paso) { ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      const regla = PASO / (escC * cam.z), largo = COSTA.medidas[COSTA.medidas.length - 1].largo * Math.pow(5 / regla, 0.3);
      const inf = eSuave(cl((uz - 0.82) / 0.1));
      texto(ctx, `REGLA ${medida(regla)}`, 80, 110 + SEGURO_ARRIBA, 22, `rgba(${AMBAR},${0.95 * ad})`, { esp: 4 });
      texto(ctx, `LARGO MEDIDO ${Math.round(largo).toLocaleString("es-CL")} KM`, 80, 148 + SEGURO_ARRIBA, 22, `rgba(${RGB.crema},${0.95 * ad * (1 - inf)})`, { esp: 4 });
      if (inf > 0) texto(ctx, "LARGO MEDIDO ∞", 80, 148 + SEGURO_ARRIBA, 22, `rgba(${RGB.crema},${0.95 * ad * inf})`, { esp: 4 });
      etiqueta(ctx, "MÁS ALLÁ DE LOS DATOS · AMPLIACIÓN ILUSTRATIVA CON LA MISMA RUGOSIDAD (D ≈ 1,3)", ad);
    }
    cam.z = 1; cam.g = 0;
    const ab = Math.min(eSuave(pr(t, P.costa[0] + 1.6, 1.0)), 1 - eSuave(pr(t, P.zoomCosta[0], 0.6)), 1 - (activo(P.retrato, t) ? ar : 0));
    etiqueta(ctx, "FIORDOS DE AYSÉN, CHILE · NATURAL EARTH · LA MISMA COSTA, DISTINTAS REGLAS", ab);
    // the question, written over the coast as it is spoken
    if (activo(P.pregunta, t)) {
      const aq = peso(P.pregunta, t, 0.5, 0.6), q = "¿CUÁNTO MIDE UNA COSTA?";
      ctx.font = `600 ${56 * Math.min(1, W / 1500)}px "${SANS}"`;
      (ctx as unknown as { letterSpacing: string }).letterSpacing = "8px";
      const tq = 56 * Math.min(1, W / 1500) * Math.min(1, (0.86 * W) / ctx.measureText(q).width);
      (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
      texto(ctx, q, W / 2 + 4, H * 0.2 + SEGURO_ARRIBA, tq, `rgba(${RGB.crema},${0.95 * aq})`, { fam: SANS, peso: 600, alin: "center", esp: 8 });
    }
    // Mandelbrot asks the question
    if (activo(P.retrato, t)) {
      cubre(ctx, img("p2/fotos/mandelbrot.jpg"), ar, pr(t, P.retrato[0], P.retrato[1] - P.retrato[0]), 1.0, 1.06, H > W ? 0.62 : 0.5, H > W ? 0.4 : 0.33);
      etiqueta(ctx, "BENOIT MANDELBROT · «HOW LONG IS THE COAST OF BRITAIN?» · SCIENCE, 1967", ar);
    }
  }

  // ── 4 · the suspicion: the Mandelbrot set as a silhouette, then entered ──
  if (activo(P.mandel, t)) {
    const a = Math.min(eSuave(pr(t, P.mandel[0], 2.0)), 1 - eSuave(pr(t, P.corte + 0.2, 2.6)));
    const zM = eIO(pr(t, P.zoomM[0], P.zoomM[1] - P.zoomM[0]));
    // constant zoom speed in scale, ease at both ends; the camera slides so the target stays fixed on screen
    // the intro already dove into it: here it is only recognised, with a gentle push towards the seahorse valley
    const A0 = 3.3, A1 = 1.4;
    const ancho = A0 * Math.pow(A1 / A0, zM);
    const k0 = ancho / A0, c0: [number, number] = [-0.62, 0];
    const cx = M_FIN[0] + (c0[0] - M_FIN[0]) * k0, cy = M_FIN[1] + (c0[1] - M_FIN[1]) * k0;
    // recognition: a pale silhouette; as we enter, the colour arrives
    const color = eSuave(pr(t, P.zoomM[0] + 1.0, 5.0));
    const capa = ctx.canvas;
    pintaM(ctx, cx, cy, ancho, t, a);
    if (color < 1) {
      ctx.save();
      ctx.globalCompositeOperation = "saturation";
      ctx.fillStyle = `rgba(128,128,128,${(1 - color) * a})`;
      ctx.fillRect(0, 0, capa.width, capa.height);
      ctx.restore();
    }
  }

  // ── 5 · the beginning: a point of light that beats; the last beat writes the rule ──
  if (activo(P.punto, t)) {
    const a = eSuave(pr(t, P.punto[0], 1.6));
    const lat = eg < 1.2 ? Math.exp(-eg * 4) : 0;
    const r = (14 + 80 * lat) * a;
    // the point beats before it writes the rule, and again once the rule has gone out in the silence
    if (t < P.ecuacion[0] + 0.3) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(1, r));
      g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.3, `rgba(${AZUL},${0.55 * a})`); g.addColorStop(1, `rgba(${AZUL},0)`);
      ctx.fillStyle = g; ctx.fillRect(W / 2 - r, H / 2 - r, 2 * r, 2 * r);
      ctx.restore();
    }
  }
  if (t >= P.ecuacion[0] && t < P.corte + 1.2) {
    const u = eIO(pr(t, P.ecuacion[0], P.ecuacion[1] - P.ecuacion[0]));
    // it grows a little with the music towards the question, and goes out in the silence
    const crece = 1 + 0.12 * eIO(pr(t, P.ecuacion[1], P.corte - P.ecuacion[1])), apaga = 1 - eSuave(pr(t, P.corte, 1.0));
    const tam = Math.round(190 * Math.min(1, W / 1500));
    ctx.font = `600 ${tam}px "${SANS}"`;
    const s = "z → z² + c", w = ctx.measureText(s).width, x0 = W / 2 - w / 2, y = H / 2 + tam * 0.35;
    ctx.save();
    // a continuous scale around the centre (a font size would jump from pixel to pixel)
    ctx.translate(W / 2, H / 2); ctx.scale(crece, crece); ctx.translate(-W / 2, -H / 2);
    ctx.beginPath(); ctx.rect(x0 - 10, 0, (w + 20) * u, H); ctx.clip();
    texto(ctx, s, x0, y, tam, `rgba(${RGB.crema},${0.95 * apaga})`, { fam: SANS, peso: 600, esp: 0 });
    // every beat makes the rule glow
    const brillo = eg < 1 ? Math.exp(-eg * 4) * 0.35 * apaga : 0;
    if (brillo > 0.01) { ctx.globalCompositeOperation = "lighter"; texto(ctx, s, x0, y, tam, `rgba(${AZUL},${brillo})`, { fam: SANS, peso: 600, esp: 0 }); ctx.globalCompositeOperation = "source-over"; }
    ctx.restore();
    // the pen: the point of light, travelling along the writing
    const px = x0 + w * u, a = 1 - eSuave(pr(t, P.ecuacion[1] - 0.2, 0.6));
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(px, y - tam * 0.3, 0, px, y - tam * 0.3, 40);
    g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, `rgba(${AZUL},0)`);
    ctx.fillStyle = g; ctx.fillRect(px - 40, y - tam * 0.3 - 40, 80, 80);
    ctx.restore();
  }

  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.92, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: (eg < 1 ? Math.exp(-eg * 7) : 0) * 0.15, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
