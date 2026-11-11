// Three opening directions for La frontera after the first animatic was rejected (too flat, not cinematic).
// A · cold open (deep dive first), B · the heartbeat as a night landscape, C · montage cut on the pulse.
import DIR from "./direcciones.json";
import { pintarMandel } from "./mandel";
import { pintarJuliaQ } from "./juliaq";
import type { Datos } from "./escena";
import { RGB, SANS, MONO, cl, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = 1920;
export const H = 1080;
type Ctx = CanvasRenderingContext2D;
const BARRA = Math.round((H - W / 2.39) / 2); // cinemascope bars

const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  ctx.font = `${op.peso ?? 400} ${tam}px "${op.fam ?? MONO}"`;
  ctx.fillStyle = color;
  ctx.textAlign = op.alin ?? "left";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 0}px`;
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};

const fractal = (ctx: Ctx, P: Parameters<typeof pintarMandel>[2], alfa = 1) => {
  const l = pintarMandel(W, H, P);
  ctx.globalAlpha = alfa;
  ctx.drawImage(l, 0, 0, W, H);
  ctx.globalAlpha = 1;
};

// heartbeat envelope from a list of beat times
const pulso = (t: number, latidos: number[], k = 7) => {
  let v = 0;
  for (const b of latidos) if (t >= b && t - b < 1.5) v = Math.max(v, Math.exp(-(t - b) * k));
  return v;
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

// ─── A · cold open ─────────────────────────────────────────────────────────────────────────────────────────────
const A = DIR.A;
const destinoA = { cx: -0.743643887, cy: 0.131825904 };
const dirA = (ctx: Ctx, t: number) => {
  if (t >= A.inmersion && t < A.corte) {
    const p = (t - A.inmersion) / (A.corte - A.inmersion);
    const ancho = Math.exp(lerp(Math.log(1.2), Math.log(0.0016), Math.pow(p, 1.25)));
    const acerca = eIO(cl(p * 1.6));
    const cx = lerp(-0.70, destinoA.cx, acerca), cy = lerp(0.22, destinoA.cy, acerca);
    const latido = pulso(t, A.latidos, 5);
    fractal(ctx, { cx, cy, ancho, fase: 0.3 + t * 0.07, respira: 1, iter: Math.round(lerp(300, 1500, p)), rot: -0.25 + p * 1.35, brillo: 1 + 0.25 * latido });
  }
  // after the cut: black, one heartbeat and the line over black, then the title
  titulo(ctx, t, A.titulo, A.total);
};

// ─── B · the heartbeat as a night landscape ────────────────────────────────────────────────────────────────────
const B = DIR.B;
type Filas = { y: Float32Array[]; n: number };
let filasB: Filas | null = null;
const MIN_FILA = 8; // minutes of heartbeat per ridge
const PUNTOS_FILA = 220;
const prepararFilas = (D: Datos): Filas => {
  if (filasB) return filasB;
  const S = D.sano;
  const fin = S.t[S.t.length - 1];
  const nFilas = Math.floor(fin / (MIN_FILA * 60));
  const media = S.rr.reduce((a, b) => a + b, 0) / S.rr.length;
  const y: Float32Array[] = [];
  let j = 0;
  for (let f = 0; f < nFilas; f++) {
    const t0 = f * MIN_FILA * 60, t1 = t0 + MIN_FILA * 60;
    const fila = new Float32Array(PUNTOS_FILA);
    for (let k = 0; k < PUNTOS_FILA; k++) {
      const tt = lerp(t0, t1, k / (PUNTOS_FILA - 1));
      while (j < S.t.length - 1 && S.t[j + 1] < tt) j++;
      fila[k] = S.rr[j] - media;
      if (k > 1) fila[k - 1] = (fila[k - 2] + 2 * fila[k - 1] + fila[k]) / 4;
    }
    if (f % 1 === 0) j = Math.max(0, j - 2);
    y.push(fila);
  }
  filasB = { y, n: nFilas };
  return filasB;
};
const dirB = (ctx: Ctx, t: number, D: Datos) => {
  const F = prepararFilas(D);
  const a = Math.min(eSuave(pr(t, B.paisaje, 2.2)), 1 - eSuave(pr(t, B.corte - 0.15, 0.15)));
  if (a <= 0) return;
  const p = pr(t, B.paisaje, B.corte - B.paisaje);
  // camera glides forward over the day, then rises and looks down on the whole landscape
  const DZ = 0.22;
  const camZ = lerp(0, 46 * DZ * 2.2, eIO(p));
  const sube = eIO(pr(t, B.sube, B.corte - B.sube));
  const camY = lerp(1.15, 3.0, sube);
  const inclina = lerp(0.2, 0.62, sube);
  const banco = Math.sin(t * 0.3) * 0.035;
  const foco = 1150;
  const latido = pulso(t, B.latidos, 6);
  ctx.save();
  ctx.translate(W / 2, H / 2 - 40);
  ctx.rotate(banco);
  const primera = Math.max(0, Math.floor(camZ / DZ));
  for (let f = Math.min(F.n - 1, primera + 110); f >= primera; f--) {
    const z = f * DZ - camZ + 0.6;
    if (z <= 1.1) continue;
    const prof = cl(1 - z / (110 * DZ));
    const fila = F.y[f];
    ctx.beginPath();
    let ok = false;
    for (let k = 0; k < PUNTOS_FILA; k++) {
      const X = lerp(-3.2, 3.2, k / (PUNTOS_FILA - 1));
      const centro = Math.exp(-(X * X) / 3.2);
      const Y = fila[k] * 2.3 * centro * (1 + 0.35 * latido * Math.exp(-((z - 2.2) ** 2) / 2));
      const yC = (Y - camY) * Math.cos(inclina) + z * Math.sin(inclina);
      const zC = z * Math.cos(inclina) - (Y - camY) * Math.sin(inclina);
      if (zC <= 0.08) continue;
      const sx = (X * foco) / zC, sy = (-yC * foco) / zC;
      if (!ok) { ctx.moveTo(sx, sy); ok = true; } else ctx.lineTo(sx, sy);
    }
    if (!ok) continue;
    ctx.save();
    ctx.lineTo(W, H * 2); ctx.lineTo(-W, H * 2); ctx.closePath();
    ctx.fillStyle = "#06050d";
    ctx.fill();
    ctx.restore();
    const cerca = Math.pow(prof, 1.4);
    const col = cerca > 0.6 ? RGB.crema : cerca > 0.3 ? RGB.durazno : RGB.magenta;
    const borde = eSuave(cl((z - 1.1) / 1.2));
    ctx.strokeStyle = `rgba(${col},${a * borde * (0.12 + 0.88 * cerca)})`;
    ctx.lineWidth = 0.7 + 2.0 * cerca;
    ctx.stroke();
  }
  ctx.restore();
  const hora = Math.min(23, Math.floor((camZ / DZ) * MIN_FILA / 60) + 1);
  const ar = a * Math.min(eSuave(pr(t, B.paisaje + 2.5, 1)), 1 - eSuave(pr(t, B.sube, 1)));
  texto(ctx, `HORA ${String(hora).padStart(2, "0")} DE 23 · CADA LÍNEA, OCHO MINUTOS DE LATIDOS`, 96, H - BARRA - 40, 16, `rgba(${RGB.crema},${0.6 * ar})`, { esp: 3 });
  texto(ctx, `DATOS REALES · PhysioNet · ${D.sano.id} · HOMBRE SANO, ${D.sano.edad} AÑOS`, W - 96, H - BARRA - 40, 16, `rgba(${RGB.crema},${0.45 * ar})`, { alin: "right", esp: 2 });
};
const dirBfinal = (ctx: Ctx, t: number) => titulo(ctx, t, B.titulo, B.total);

// ─── C · montage cut on the pulse ──────────────────────────────────────────────────────────────────────────────
// Every shot uses the same rule z -> z^2 + c: flat sets lit as relief, and quaternion Julia sets in 3D.
const C2 = DIR.C;
type Plano2 = { tipo: "2d"; julia?: [number, number]; cx: number; cy: number; ancho: number; rot: number; fase: number; luz: number };
type Plano3 = { tipo: "3d"; c: [number, number, number, number]; dist: number; az: number; elev: number; fase: number };
const PLANOS: (Plano2 | Plano3)[] = [
  { tipo: "2d", cx: -0.7453, cy: 0.1127, ancho: 0.02, rot: -0.3, fase: 0.3, luz: 0.8 },
  { tipo: "3d", c: [-0.2, 0.6, 0.2, 0.2], dist: 2.7, az: 0.4, elev: 0.25, fase: 0.15 },
  { tipo: "2d", julia: [-0.8, 0.156], cx: 0, cy: 0, ancho: 2.9, rot: 0.2, fase: 0.1, luz: 2.2 },
  { tipo: "3d", c: [-0.291, -0.399, 0.339, 0.437], dist: 2.4, az: 1.9, elev: 0.4, fase: 0.55 },
  { tipo: "2d", cx: -1.7685, cy: 0.0017, ancho: 0.006, rot: 0.6, fase: 0.8, luz: 1.2 },
  { tipo: "3d", c: [-0.2, 0.4, -0.4, -0.4], dist: 2.5, az: 3.0, elev: -0.2, fase: 0.35 },
  { tipo: "2d", julia: [-0.123, 0.745], cx: 0, cy: 0, ancho: 2.7, rot: -0.3, fase: 0.5, luz: 0.3 },
  { tipo: "3d", c: [-0.445, 0.339, -0.0889, -0.562], dist: 2.6, az: 4.2, elev: 0.5, fase: 0.75 },
  { tipo: "2d", cx: -0.1011, cy: 0.9563, ancho: 0.012, rot: 0.3, fase: 0.4, luz: 2.8 },
  { tipo: "3d", c: [-0.137, -0.63, -0.475, -0.046], dist: 2.3, az: 5.3, elev: 0.15, fase: 0.05 },
  { tipo: "2d", julia: [-0.7269, 0.1889], cx: 0, cy: 0, ancho: 2.6, rot: -0.6, fase: 0.7, luz: 1.6 },
  { tipo: "3d", c: [-0.218, -0.113, -0.181, -0.496], dist: 2.5, az: 0.9, elev: -0.35, fase: 0.45 },
  { tipo: "2d", cx: -0.7436439, cy: 0.1318259, ancho: 0.004, rot: -0.9, fase: 0.55, luz: 0.5 },
  { tipo: "3d", c: [-0.125, -0.256, 0.847, 0.0895], dist: 2.6, az: 2.4, elev: 0.3, fase: 0.25 },
];
const dirC = (ctx: Ctx, t: number) => {
  const L = C2.latidos;
  let es3d = false;
  if (t >= L[0] && t < C2.corte) {
    let i = 0;
    while (i + 1 < L.length && L[i + 1] <= t) i++;
    const P = PLANOS[i % PLANOS.length];
    const e = t - L[i];
    const dur = (i + 1 < L.length ? L[i + 1] : C2.corte) - L[i];
    const flash = Math.exp(-e * 9);
    // a punch at every cut: the image lands slightly large and settles
    const golpe = 1 + 0.07 * Math.exp(-e * 10);
    let lienzo: HTMLCanvasElement;
    if (P.tipo === "2d") {
      const empuje = Math.exp(-0.45 * (e / Math.max(0.3, dur)));
      const julia: [number, number] | undefined = P.julia ? [P.julia[0] + 0.02 * Math.sin(t * 1.7), P.julia[1] + 0.02 * Math.cos(t * 1.3)] : undefined;
      lienzo = pintarMandel(W, H, { cx: P.cx, cy: P.cy, ancho: P.ancho * empuje, fase: P.fase + t * 0.05, respira: 1, iter: 700, rot: P.rot + e * 0.12, julia, brillo: 1 + 0.8 * flash, relieve: 1, luz: P.luz + t * 0.3 });
    } else {
      es3d = true;
      const az = P.az + t * 0.35 + e * 0.5;
      const dist = P.dist * (1 - 0.1 * eOut(cl(e / Math.max(0.3, dur))));
      const cam: [number, number, number] = [dist * Math.cos(P.elev) * Math.sin(az), dist * Math.sin(P.elev), dist * Math.cos(P.elev) * Math.cos(az)];
      // c moves on the family of connected quaternion Julia sets (0.45 cos(...) - 0.3), so each shot is a solid shape
      const k = i * 1.37 + t * 0.22;
      const c: [number, number, number, number] = [0.45 * Math.cos(0.5 + k * 1.2) - 0.3, 0.45 * Math.cos(3.9 + k * 1.7), 0.45 * Math.cos(1.4 + k * 1.3), 0.45 * Math.cos(1.1 + k * 2.5)];
      lienzo = pintarJuliaQ(W, H, { cam, mira: [0, 0, 0], c, fov: 1.25, fase: P.fase + t * 0.03, corte: 0.0, brillo: 1.05 + 0.6 * flash });
    }
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(golpe, golpe);
    ctx.drawImage(lienzo, -W / 2, -H / 2, W, H);
    ctx.restore();
  }
  if (es3d) texto(ctx, "LA MISMA REGLA CON CUATERNIONES · z → z² + c EN CUATRO DIMENSIONES", W - 64, BARRA - 40, 14, `rgba(${RGB.crema},0.45)`, { alin: "right", esp: 2 });
  // silence, then the whole set appears slowly as a creamy relief; the rule; the title
  if (t >= C2.calma) {
    const a = Math.min(eSuave(pr(t, C2.calma, 2.2)), 1 - eSuave(pr(t, C2.titulo - 0.4, 0.4)));
    fractal(ctx, { cx: -0.62, cy: 0, ancho: lerp(4.0, 3.5, eOut(pr(t, C2.calma, 6))), fase: 0.62 + (t - C2.calma) * 0.02, respira: 1, iter: 400, brillo: 1, relieve: 1, luz: 0.9 + (t - C2.calma) * 0.25 }, a);
    const ar = Math.min(eSuave(pr(t, C2.regla, 0.8)), 1 - eSuave(pr(t, C2.titulo - 0.4, 0.4)));
    if (ar > 0) texto(ctx, "z → z² + c", W / 2, H - BARRA - 70, 54, `rgba(${RGB.crema},${ar})`, { fam: SANS, peso: 300, alin: "center" });
  }
  titulo(ctx, t, C2.titulo, C2.total);
};

// ─── cinematic finish shared by the three ──────────────────────────────────────────────────────────────────────
let bloomC: HTMLCanvasElement | null = null;
let ruido: HTMLCanvasElement[] = [];
export const acabado = (ctx: Ctx, frame: number, nombre: string, barras = true) => {
  if (!bloomC) { bloomC = document.createElement("canvas"); bloomC.width = W / 4; bloomC.height = H / 4; }
  const b = bloomC.getContext("2d")!;
  b.clearRect(0, 0, W / 4, H / 4);
  b.filter = "blur(8px)";
  b.drawImage(ctx.canvas, 0, 0, W / 4, H / 4);
  b.filter = "none";
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.55;
  ctx.drawImage(bloomC, 0, 0, W, H);
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 1.0);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, `rgba(0,0,0,${barras ? 0.62 : 0.32})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  if (!ruido.length) {
    ruido = [0, 1, 2, 3].map((k) => {
      const c = document.createElement("canvas");
      c.width = 384; c.height = 384;
      const g = c.getContext("2d")!;
      const img = g.createImageData(384, 384);
      let s = 99 + k * 7919;
      for (let i = 0; i < img.data.length; i += 4) {
        s = (s * 1664525 + 1013904223) >>> 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = s >>> 24; img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      return c;
    });
  }
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = ctx.createPattern(ruido[frame % 4], "repeat")!;
  ctx.translate((frame * 37) % 384, (frame * 53) % 384);
  ctx.fillRect(-384, -384, W + 384, H + 384);
  ctx.restore();
  if (barras) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, BARRA);
    ctx.fillRect(0, H - BARRA, W, BARRA);
  }
  texto(ctx, nombre, 64, barras ? BARRA - 40 : 56, 14, `rgba(${RGB.crema},0.4)`, { esp: 3 });
};

export const NOMBRES = { A: "DIRECCIÓN A · GOLPE DE ENTRADA", B: "DIRECCIÓN B · EL PAISAJE DEL LATIDO", C: "DIRECCIÓN C · MONTAJE AL PULSO" } as const;
export type Dir = keyof typeof NOMBRES;

export const dibujarDireccion = (ctx: Ctx, dir: Dir, D: Datos, t: number, frame: number) => {
  ctx.fillStyle = "#050409";
  ctx.fillRect(0, 0, W, H);
  if (dir === "A") dirA(ctx, t);
  if (dir === "B") { dirB(ctx, t, D); dirBfinal(ctx, t); }
  if (dir === "C") dirC(ctx, t);
  acabado(ctx, frame, NOMBRES[dir]);
};
