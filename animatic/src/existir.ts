// «Qué extraño es existir» · B&N Lectures · reel 9:16 (1080×1920).
// Un plano a la vez (existir.json «planos»); entre planos, un fundido de 0,3 s centrado en el corte, que cae en el
// inicio de la frase que nombra lo que se ve. Simulaciones propias en WebGL (src/existir/*) y material real con
// licencia (public/existir; procedencia en que-extrano-es-existir/material y fractales/material-prologo).
// Todo es función pura de t.
import K from "./existir.json";
import VOZ from "./existir_voz.json";
import VOZ_A from "./existir_voz_A.json";
import VOZ_B from "./existir_voz_B.json";
import VOZ_C from "./existir_voz_C.json";
import VOZ_D from "./existir_voz_D.json";
import VOZ_DPRO from "./existir_voz_Dpro.json";
import VOZ_EPRO from "./existir_voz_Epro.json";
import VOZ_FPRO from "./existir_voz_Fpro.json";
import ENERG from "./existir_energia.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { RGB, SANS, MONO, cl, eIO, eOut, eSuave, lerp, pr } from "./theme";
import { pintarGalaxia } from "./existir/galaxia";
import { pintarTierra } from "./existir/tierra";
import { pintarChladni } from "./existir/chladni";
import { pintarFractalTeaser, PALETAS } from "./fractalTeaser";
import { azar } from "./existir/gpu";
import { imagenesViaje, pintarViaje, usarOriginal } from "./existir/cosmos";
import { getInputProps } from "remotion";
usarOriginal((getInputProps() as { cosmosOriginal?: boolean }).cosmosOriginal === true);
// versión de locución: sin voz sintética; apuntador con cuenta regresiva y palabras que se encienden a su tiempo
export const LOCUCION = (getInputProps() as { locucion?: boolean }).locucion === true;
// voz grabada por Nico (3 nov): «A» o «B»; sin prop, la voz guía. Los planos siguen atados a la voz guía (palabra()).
export const VOZ_NICO = (getInputProps() as { voz?: string }).voz ?? "";
export const SIN_SUBS = (getInputProps() as { sinSubs?: boolean }).sinSubs === true;

export const W = 1080;
export const H = 1920;
type Ctx = CanvasRenderingContext2D;
export type Medios = Record<string, HTMLImageElement | undefined>;
export type Vida = { n: number; cuadros: number; tipo: number[]; pos: Uint16Array };

const PLANOS = K.planos as [string, number, number][];
const G = K.golpes as Record<string, number>;
const FUNDE = 0.15;                                     // medio fundido (0,3 s en total)
const SERIF = "'STIX Two Text', 'Times New Roman', serif";
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.028, vineta: 0.62, grano: 0.05, scan: 0.1, ruido: 0.4, grade: 1.6 };
export const VID: Record<string, number> = {};

// tiempo de una palabra de la voz: frase k (1..), palabra i (0..)
const palabra = (k: number, i: number) => K.voz[k - 1] + ((VOZ as unknown as { palabras: [string, number][] }[])[k - 1].palabras[i]?.[1] ?? 0);

// ── la canción (2 nov, v2): se agregan el disco y el prisma; todo lo que venía desde 34,4 s se corre DESPL ──────
// Los planos y golpes de existir.json siguen en el tiempo «viejo» (tv); cada plano sabe su desfase.
export const DESPL = 0.2, CORTE = 34.4;
export const VOZ_REAL = K.voz.map((v, k) => (k === 6 ? 28.45 : v >= CORTE ? v + DESPL : v));
// el cierre (v9): después del Punto azul pálido, «Y sin embargo, estamos aquí»; el título se corre DESPL2
export const DESPL2 = 34.0, CIERRE0 = 121.8;
export const TOTAL = K.total + DESPL + DESPL2;
// fusiones continuas (v6): el plano saliente dibuja la entrada del siguiente; el corte queda donde ya son iguales
const AJUSTE: Record<string, [number, number]> = { tierra: [14.2, 18.0], campo: [18.0, 22.9], alma: [22.9, 27.3], andromeda: [84.0, 89.8], girasol: [89.8, 95.6], sol: [95.6, 98.8] };
const BASE: Record<string, number> = { alma: 21.0, andromeda: 84.0, sol: 95.0 };        // instante del cuadro 0 de cada video
const REAL: [string, number, number, number][] = [];
for (const [n, a0, a1] of PLANOS) {
  const [t0, t1] = AJUSTE[n] ?? [a0, a1];
  if (n === "chladni") { REAL.push(["vinilo", 27.3, 30.3, 0], ["chladni", 30.3, CORTE + DESPL, 0]); continue; }
  if (n === "galaxia") { REAL.push([n, 0, 14.2, 0]); continue; }   // termina siendo la Tierra
  if (n === "ojo") continue;
  if (n === "titulo") { REAL.push(["cierre", CIERRE0 + DESPL, CIERRE0 + DESPL + DESPL2, DESPL], [n, t0 + DESPL + DESPL2, t1 + DESPL + DESPL2, DESPL + DESPL2]); continue; }
  REAL.push(t0 >= CORTE ? [n, t0 + DESPL, t1 + DESPL, DESPL] : [n, t0, t1, 0]);
}

// ── qué planos se ven en t (uno, o dos durante el fundido); t0/t1 en el tiempo propio del plano ────────────────
// v18: los cortes que no tienen una fusión propia pasan a ser fusiones por brillo de 0,9 s (antes 0,3 s, secos);
// los planos con fusión propia (que entran ya iguales al anterior) siguen con el fundido corto
const CORTOS = new Set(["galaxia", "tierra", "campo", "alma", "girasol", "sol", "cierre", "titulo"]);
const FUNDE_LARGO = 0.45;
const fundeDe = (i: number) => (i < REAL.length && !CORTOS.has(REAL[i][0]) ? FUNDE_LARGO : FUNDE);
export const visibles = (t: number) => {
  const out: { n: string; t0: number; t1: number; a: number; tv: number; largo: boolean }[] = [];
  REAL.forEach(([n, t0, t1, off], i) => {
    const fi = fundeDe(i), fo = fundeDe(i + 1);
    const entra = i === 0 ? 1 : eSuave(pr(t, t0 - fi, 2 * fi));
    if (t >= t0 - fi && t < t1 + fo) out.push({ n, t0: t0 - off, t1: t1 - off, a: entra, tv: t - off, largo: fi > FUNDE });
  });
  return out;
};

// ── recursos que pide cada plano en t (el componente los carga antes de dibujar) ────────────────────────────────
const cuadroVid = (n: string, t: number, t0: number) => `vid/${n}/${String(Math.max(0, Math.min((VID[n] || 1) - 1, Math.floor((t - t0 + FUNDE) * 30)))).padStart(4, "0")}`;
const FOTOS: Record<string, string[]> = {
  galaxia: ["ojo", "tierra-dia", "tierra-noche", "tierra-nubes"], tierra: ["tierra-dia", "tierra-noche", "tierra-nubes"], campo: ["campo"], flammarion: ["flammarion"],
  girasol: ["girasol"], neurona: ["neurona", "@p5/1-red.jpg"], cielo: ["cielo-a", "cielo-b"], punto: ["punto"], titulo: ["logo"],
};
const VIDEOS = ["alma", "vinilo", "pilares", "webb", "andromeda", "mitosis", "abrazo", "sol"];
export const recursos = (t: number) => {
  const r: string[] = [];
  for (const v of visibles(t)) {
    for (const f of FOTOS[v.n] ?? []) r.push(f);
    if (VIDEOS.includes(v.n) && VID[v.n]) r.push(cuadroVid(v.n, v.tv, BASE[v.n] ?? v.t0));
    // lo que el plano saliente necesita del siguiente durante la fusión
    if (v.n === "tierra" && v.tv > 16.7) r.push("campo");
    if (v.n === "cierre") r.push(...recursosCierre(v.tv - CIERRE0));
    if (v.n === "campo" && v.tv > 20.2) r.push(cuadroVid("alma", v.tv, BASE.alma));
    if (v.n === "andromeda" && v.tv > 88.5) r.push("girasol");
    if (v.n === "girasol" && v.tv > 94.3) r.push(cuadroVid("sol", v.tv, BASE.sol));
  }
  return r;
};

// ── utilidades de dibujo ───────────────────────────────────────────────────────────────────────────────────────
// imagen que cubre el cuadro, con foco (fx, fy) en el centro y un factor de escala extra
const cubrir = (ctx: Ctx, im: HTMLImageElement | undefined, fx = 0.5, fy = 0.5, s = 1) => {
  if (!im) return false;
  const k = Math.max(W / im.width, H / im.height) * s;
  const w = im.width * k, h = im.height * k;
  const x = Math.min(0, Math.max(W - w, W / 2 - fx * w)), y = Math.min(0, Math.max(H - h, H / 2 - fy * h));
  ctx.drawImage(im, x, y, w, h);
  return true;
};
const negro = (ctx: Ctx, a: number) => { if (a > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, a)})`; ctx.fillRect(0, 0, W, H); } };
const falta = (ctx: Ctx, n: string) => {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = `400 28px ${MONO}`; ctx.textAlign = "center"; ctx.fillText(`[ ${n} ]`, W / 2, H / 2);
};
const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, a: number, op: { fam?: string; peso?: number; esp?: number } = {}) => {
  if (a <= 0) return;
  ctx.save();
  ctx.font = `${op.peso ?? 400} ${tam}px ${op.fam ?? SANS}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 0}px`;
  ctx.fillStyle = `rgba(${RGB.crema},${a})`;
  ctx.fillText(s, x, y);
  ctx.restore();
};
const resplandor = (ctx: Ctx, x: number, y: number, r: number, a: number, rgb = "255,248,232") => {
  if (a <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.18, `rgba(${rgb},${a * 0.45})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
};

// ══ I · la galaxia que es un ojo, y el ojo real (un solo plano, sin corte) ════════════════════════════════════════
const R_IRIS = 410;
// foto del ojo (Matt Ming), medida sobre la imagen: centro del iris, radio de la pupila y del iris, y su reflejo
const OJO = { cx: 1608, cy: 1120, rp: 444, ri: 1010, refl: [0.9, -0.57] as [number, number] };
const giro = (t: number) => 1 - eIO(pr(t, K.detente, 2.6));
const fase = (t: number) => {
  const v = 0.12, n = 48;
  if (t <= K.detente) return v * t;
  let acc = v * K.detente; const d = (t - K.detente) / n;
  for (let i = 0; i < n; i++) acc += v * giro(K.detente + (i + 0.5) * d) * d;
  return acc;
};
const pupila = (t: number) => {
  const x = Math.max(0, t - G.aqui);
  const resorte = 1 - Math.exp(-x * 5.5) * (Math.cos(x * 9) + 0.6 * Math.sin(x * 9));
  return lerp(0.52, OJO.rp / OJO.ri, cl(resorte, 0, 1.12));
};
// una sola curva de cámara para todo el plano: empuja hasta 10,2 s, se queda, y desde 10,9 s se aleja (sin saltos de velocidad)
// v12: el ojo no se achica; sigue con un empuje suave hasta volverse la Tierra, que continúa el zoom (una sola dirección)
const radioIris = (t: number) => R_IRIS * lerp(0.9, 1.0, eSuave(pr(t, 0, 9.6))) * lerp(1, 1.08, eSuave(pr(t, 9.6, 3.6)));
// un solo proceso desde «Detente»: mientras la espiral se desenrolla, sus colores van a los de la foto, la foto entra
// debajo, las fibras se apagan y la foto se abre hacia afuera; todo solapado, sin etapas
const FOTO_COLOR = (t: number) => eSuave(pr(t, 6.3, 3.6));
const FOTO_ENTRA = (t: number) => eSuave(pr(t, 7.4, 3.4));          // a medio camino en «consciente» (9,9 s)
const FIBRAS_SE_VAN = (t: number) => eSuave(pr(t, 8.0, 3.0));
// máscara en forma de ojo (almendra): se abre a lo ancho hasta las comisuras; nunca llega a los bordes de la foto
const ABRE = (t: number): [number, number] => {
  const x = eIO(pr(t, 9.6, 2.6)), c = eSuave(pr(t, 11.6, 1.2));          // se abre y, al volverse Tierra, se cierra al círculo del iris
  void x; void c;
  return [1.04, 1.04];                                                // v19: solo el iris, una esfera, sin la esclera blanca
};
// el ojo se vuelve la Tierra: mismo centro, el borde del iris es el borde del planeta
const MORFO = (t: number) => eSuave(pr(t, 11.8, 1.3));
const EMPUJE = (t: number) => eIO(pr(t, 12.6, 1.6));                 // del globo entero al horizonte, llega en «roca»

let capaOjo: HTMLCanvasElement | null = null;
const galaxia = (ctx: Ctx, t: number, m: Medios) => {
  const esc = radioIris(t);
  const g = giro(t), rp = pupila(t);
  const brillo = eSuave(pr(t, K.punto, 1.2));
  const A = m.ojo ? FOTO_ENTRA(t) : 0;
  // 1 · la foto, alineada al píxel con el iris simulado, con su máscara radial suave
  if (A > 0 && m.ojo) {
    if (!capaOjo) { capaOjo = document.createElement("canvas"); capaOjo.width = W; capaOjo.height = H; }
    const c = capaOjo.getContext("2d")!;
    c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, W, H);
    const k = esc / OJO.ri;
    c.drawImage(m.ojo, W / 2 - OJO.cx * k, H / 2 - OJO.cy * k, m.ojo.width * k, m.ojo.height * k);
    const [ax, ay] = ABRE(t);
    c.save(); c.translate(W / 2, H / 2); c.scale(ax, ay);
    const gm = c.createRadialGradient(0, 0, esc * 0.8, 0, 0, esc);
    gm.addColorStop(0, "rgba(0,0,0,1)"); gm.addColorStop(1, "rgba(0,0,0,0)");
    c.globalCompositeOperation = "destination-in"; c.fillStyle = gm; c.fillRect(-W / ax, -H / ay, (2 * W) / ax, (2 * H) / ay);
    c.restore();
    ctx.save(); ctx.globalAlpha = A; ctx.drawImage(capaOjo, 0, 0); ctx.restore();
  }
  // 2 · las fibras (luz que se suma); al final con el color real de la foto, y se apagan
  const ap = FIBRAS_SE_VAN(t);
  if (ap < 1) {
    const lienzo = pintarGalaxia(W, H, { t, g, fase: fase(t), pupila: rp, esc, brillo: 0.55, apaga: ap,
      foto: m.ojo ? { im: m.ojo, cx: OJO.cx, cy: OJO.cy, r: OJO.ri, mez: FOTO_COLOR(t) } : undefined });
    ctx.save(); ctx.globalCompositeOperation = A > 0 ? "lighter" : "source-over"; ctx.drawImage(lienzo, 0, 0); ctx.restore();
  }
  ctx.save(); ctx.translate(W / 2, H / 2);
  // bulbo / punto de luz: nace en el pulso, respira, crece con el brote y se apaga en el freno
  const oscuro = eSuave(pr(t, K.detente + 0.5, 2.4));
  const respira = 0.85 + 0.15 * Math.sin((t - K.punto) * 2 * Math.PI * 0.27);
  const crece = eSuave(pr(t, 1.4, 4.2));
  resplandor(ctx, 0, 0, lerp(16, 190, crece), 0.95 * brillo * respira * (1 - oscuro));
  resplandor(ctx, 0, 0, lerp(5, 30, crece), 0.9 * brillo * (1 - oscuro));
  // pupila negra de la simulación; la de la foto la reemplaza
  if (oscuro > 0 && A < 1) {
    const r0 = rp * esc;
    const gp = ctx.createRadialGradient(0, 0, r0 * 0.82, 0, 0, r0 * 1.04);
    gp.addColorStop(0, `rgba(0,0,0,${0.98 * oscuro * (1 - A)})`); gp.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(0, 0, r0 * 1.04, 0, Math.PI * 2); ctx.fill();
  }
  // el mismo punto de luz queda como reflejo en la córnea, justo donde la foto tiene el suyo, y se funde con él
  const refl = eOut(pr(t, G.aqui - 0.15, 0.9)) * (1 - 0.85 * eSuave(pr(t, 9.6, 1.4)));
  resplandor(ctx, rp * esc * OJO.refl[0], rp * esc * OJO.refl[1], 0.09 * esc, 0.9 * refl, "226,238,255");
  ctx.restore();
  // el ojo se vuelve la Tierra y la cámara viaja a su horizonte, hasta el plano de la Tierra
  const mo = MORFO(t);
  if (mo > 0 && m["tierra-dia"]) {
    const e = EMPUJE(t);
    const r = lerp(esc, 1250, e), y = lerp(H / 2, H / 2 + 0.62 * 1250, e);
    const L = [lerp(0.3, 0.22, e), lerp(0.42, 0.93, e), lerp(0.86, -0.3, e)];
    const n = Math.hypot(L[0], L[1], L[2]);
    ctx.save(); ctx.globalAlpha = mo;
    ctx.drawImage(pintarTierra(W, H, { dia: m["tierra-dia"]!, noche: m["tierra-noche"], nubes: m["tierra-nubes"] }, {
      x: W * 0.5, y, r, giro: 1.9 + t * 0.045, inclina: 0.38, sol: [L[0] / n, L[1] / n, L[2] / n], amanecer: 0, solBrillo: 1.0,
    }), 0, 0);
    ctx.restore();
  }
};

let capaFusion: HTMLCanvasElement | null = null;
// fusión por brillo: primero lo claro del plano que entra se suma a lo claro del que sale (lighten), luego lo cubre
const fusion = (ctx: Ctx, t: number, a: number, b: number, dibuja: (c: Ctx) => void) => {
  const x1 = eSuave(pr(t, a, b - a)), x2 = eSuave(pr(t, b, (b - a) * 0.9));
  if (x1 <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = x2 > 0 ? "source-over" : "lighten"; ctx.globalAlpha = x2 > 0 ? x2 : x1; dibuja(ctx); ctx.restore();
  if (x2 > 0 && x2 < 1) { ctx.save(); ctx.globalCompositeOperation = "lighten"; ctx.globalAlpha = 1 - x2; dibuja(ctx); ctx.restore(); }
};

// ══ «sobre una roca que gira alrededor de una estrella» ══════════════════════════════════════════════════════
const tierra = (ctx: Ctx, t: number, m: Medios) => {
  if (!m["tierra-dia"]) return falta(ctx, "tierra");
  const x = pr(t, 14.2, 3.2);
  // «en medio de miles de millones de galaxias»: la cámara se aleja hasta que la Tierra es un punto entre ellas
  const z = eIO(pr(t, 16.5, 1.6));
  void x;
  const r = 1250 * Math.pow(0.0032, z);                              // v19: el tamaño de 0:14 se mantiene hasta que se va
  const fondo = eSuave(pr(t, 16.9, 1.0));
  if (fondo > 0) { ctx.save(); ctx.globalAlpha = fondo; campo(ctx, t, m); ctx.restore(); }
  ctx.save(); ctx.globalCompositeOperation = fondo > 0 ? "lighter" : "source-over";
  ctx.drawImage(pintarTierra(W, H, { dia: m["tierra-dia"]!, noche: m["tierra-noche"], nubes: m["tierra-nubes"] }, {
    x: W * 0.5, y: H * 0.5 + r * 0.62, r: Math.max(r, 1.5), giro: 1.9 + t * 0.045, inclina: 0.38,
    sol: [0.22, 0.93, -0.3], amanecer: eSuave(pr(t, G.estrella - 0.5, 1.0)) * (1 - z), solBrillo: 1.0,
  }), 0, 0);
  ctx.restore();
};

// ══ «en medio de miles de millones de galaxias» · Hubble Ultra Deep Field ══════════════════════════════════════
const campo = (ctx: Ctx, t: number, m: Medios) => {
  if (!cubrir(ctx, m.campo, 0.5, 0.5, lerp(1.0, 1.22, eSuave(pr(t, 17.0, 4.2))))) return falta(ctx, "campo");
  // «Y puedes darte cuenta»: las galaxias se funden con las estrellas del cielo de ALMA
  // v19: la cámara baja la vista del cielo profundo al horizonte de ALMA. Las dos imágenes suben juntas (como una
  // panorámica), las estrellas de ALMA se suman primero a las galaxias y el cielo entra desde abajo con borde suave
  if (t > 19.8) {
    const im = m[cuadroVid("alma", t, BASE.alma)];
    const baja = eIO(pr(t, 19.8, 3.0));                       // 0 → 1: cuánto bajó la vista
    const sube = 760 * baja;
    // las galaxias suben y se apagan
    ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.globalAlpha = 1; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalAlpha = 1 - eSuave(pr(t, 20.6, 2.0));
    ctx.translate(0, -sube); cubrir(ctx, m.campo, 0.5, 0.5, lerp(1.0, 1.22, eSuave(pr(t, 17.0, 4.2)))); ctx.restore();
    if (im) {
      if (!capaFusion) { capaFusion = document.createElement("canvas"); capaFusion.width = W; capaFusion.height = H; }
      const c = capaFusion.getContext("2d")!;
      c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, W, H);
      c.save(); c.translate(0, 760 - sube); cubrir(c, im, 0.5, 0.5, lerp(1.0, 1.06, pr(t, 21.0, 7))); c.restore();
      // el borde superior del cielo de ALMA, muy difuminado
      const yTop = 760 - sube, gm = c.createLinearGradient(0, yTop - 100, 0, yTop + 700);
      gm.addColorStop(0, "rgba(0,0,0,0)"); gm.addColorStop(1, "rgba(0,0,0,1)");
      c.globalCompositeOperation = "destination-in"; c.fillStyle = gm; c.fillRect(0, 0, W, H);
      const entra = eSuave(pr(t, 19.9, 1.6));
      ctx.save(); ctx.globalCompositeOperation = "lighten"; ctx.globalAlpha = entra; ctx.drawImage(capaFusion, 0, 0); ctx.restore();
      ctx.save(); ctx.globalAlpha = eSuave(pr(t, 20.8, 1.8)); ctx.drawImage(capaFusion, 0, 0); ctx.restore();
    }
  }
};

const video = (ctx: Ctx, n: string, t: number, t0: number, m: Medios, s0 = 1, s1 = 1) => {
  const im = m[cuadroVid(n, t, t0)];
  if (!cubrir(ctx, im, 0.5, 0.5, lerp(s0, s1, pr(t, t0, 7)))) falta(ctx, n);
};

// ══ «Puedes escuchar una canción…» · Chladni ════════════════════════════════════════════════════════════════
export const NOTAS_CHLADNI: [number, number, number][] = [[30.3, 1, 3], [31.5, 2, 3], [32.7, 2, 5]];
// Chladni como en el teaser de B&N Lectures: placa de malla en perspectiva que ondula con el modo y brilla en los
// vientres, arena blanca con un tinte frío por modo, cámara que orbita despacio; cada nota cambia el modo
const TINTES_CHL: [number, number, number][] = [[0.93, 0.95, 1.0], [1.0, 0.92, 0.82], [0.85, 0.93, 1.0]];
const ENERGIA = ENERG as number[];
const fChl = (n: number, m: number, x: number, y: number) => Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
const chladni = (ctx: Ctx, t: number, frame: number) => {
  const etapas: [number, number, number][] = [];
  let golpe = 0, k = 0, tk = NOTAS_CHLADNI[0][0];
  NOTAS_CHLADNI.forEach(([t0, n, mm], i) => {
    if (t < t0) return;
    etapas.push([n, mm, Math.round(90 * eOut(pr(t, t0, 1.6)))]);
    golpe = Math.max(golpe, Math.exp(-(t - t0) * 3.2));
    k = i; tk = t0;
  });
  const energia = ENERGIA[Math.min(ENERGIA.length - 1, Math.max(0, Math.round(t * 30)))] ?? 0.3;
  const tau = t - 30.3;
  const giro = 0.5 + 0.32 * tau, inclina = 0.62 + 0.08 * Math.sin(tau * 0.9);
  const lado = lerp(760, 830, eIO(pr(t, 30.3, 4.3)));
  const cx = W / 2, cy = H / 2;
  ctx.drawImage(pintarChladni(W, H, {
    etapas, lado, cx, cy, temblor: frame, salto: 0.3 + 0.7 * golpe, giro, inclina, t, energia, golpe,
    color: TINTES_CHL[k % TINTES_CHL.length], fondo: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
  }), 0, 0);
  // la placa: malla que ondula con el modo (z = A·f·sen) y brilla en los vientres; misma proyección que la arena
  const [n, mm] = NOTAS_CHLADNI[k].slice(1) as [number, number];
  const A = 0.035 + 0.11 * Math.exp(-(t - tk) * 3.2);
  const fase = Math.sin(t * 2 * Math.PI * 6.5);
  const P3 = (x: number, y: number): [number, number] => {
    const z = A * fChl(n, mm, x, y) * fase;
    let X = x * lado * 0.5, Y = y * lado * 0.5; const Z = z * lado * 0.5;
    const c = Math.cos(giro), s2 = Math.sin(giro); [X, Y] = [c * X + s2 * Y, -s2 * X + c * Y];   // igual que mat2(c,−s,s,c) del shader
    const ci = Math.cos(inclina), si = Math.sin(inclina);
    const Y2 = ci * Y - si * Z, Z2 = si * Y + ci * Z;
    const f = 1800 / (1800 + Z2);
    return [cx + X * f, cy + Y2 * f];
  };
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
  const NG = 30, NS = 40, vp = eSuave(pr(t, 30.3 - FUNDE, 0.5));
  for (let dir = 0; dir < 2; dir++) for (let a = 0; a <= NG; a++) {
    const sA = (a / NG) * 2 - 1, borde = a === 0 || a === NG;
    let q0: [number, number] | null = null;
    for (let b = 0; b <= NS; b++) {
      const r = (b / NS) * 2 - 1;
      const x = dir ? sA : r, y = dir ? r : sA;
      const q = P3(x, y);
      if (q0) {
        const fa = Math.abs(fChl(n, mm, x, y)) / 2;
        const al = vp * (0.05 + 0.28 * fa * (A / 0.146) + (borde ? 0.4 : 0));
        ctx.strokeStyle = fa > 0.5 ? `rgba(220,236,255,${al})` : `rgba(120,160,230,${al})`;
        ctx.lineWidth = borde ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      }
      q0 = q;
    }
  }
  // puntos de luz en las esquinas de la placa
  for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const q = P3(x, y); resplandor(ctx, q[0], q[1], 26, 0.55 * vp * (0.6 + 0.4 * golpe)); }
  ctx.restore();
};

// ══ «Durante siglos hemos buscado un propósito» · Flammarion ══════════════════════════════════════════════════
const flammarion = (ctx: Ctx, t: number, m: Medios) => {
  const im = m.flammarion; if (!im) return falta(ctx, "flammarion");
  ctx.save();
  ctx.filter = "sepia(0.5) contrast(1.15) brightness(0.92)";
  cubrir(ctx, im, 0.55, 0.45, lerp(1.08, 1.0, eSuave(pr(t, 34.4, 3.8))));
  ctx.restore();
};

// ══ «Una razón. Una respuesta» → «¿y si no hubiera ninguna?» · los sólidos de Kepler (1596) ══════════════════════
type V3 = [number, number, number];
type Solido = { vs: V3[]; e: [number, number][] };
const PHI = (1 + Math.sqrt(5)) / 2;
const aristas = (vs: V3[]): Solido => {
  const d = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  let dmin = Infinity;
  for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) dmin = Math.min(dmin, d(vs[i], vs[j]));
  const e: [number, number][] = [];
  for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) if (Math.abs(d(vs[i], vs[j]) - dmin) < 1e-6) e.push([i, j]);
  const rc = Math.hypot(...vs[0]);
  return { vs: vs.map((v) => v.map((c) => c / rc) as V3), e };
};
const cubo = aristas([-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z] as V3))));
const tetra = aristas([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]);
const octa = aristas([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);
const icosa = aristas([[-1, 1], [1, 1], [-1, -1], [1, -1]].flatMap(([a, b]) => [[0, a, b * PHI], [a, b * PHI, 0], [b * PHI, 0, a]] as V3[]));
const dodeca = aristas([
  ...[-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z] as V3))),
  ...[-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [[0, a / PHI, b * PHI], [a / PHI, b * PHI, 0], [b * PHI, 0, a / PHI]] as V3[])),
]);
// Kepler: Saturno ⊃ cubo ⊃ Júpiter ⊃ tetraedro ⊃ Marte ⊃ dodecaedro ⊃ Tierra ⊃ icosaedro ⊃ Venus ⊃ octaedro ⊃ Mercurio
const KEPLER = (() => {
  let r = 1;
  const capas: { s: Solido; r: number; t0: number; esfera: number }[] = [];
  const orden: [Solido, number, number][] = [[cubo, 1 / Math.sqrt(3), 38.1], [tetra, 1 / 3, 39.55], [dodeca, 0.7947, 40.5], [icosa, 0.7947, 41.4], [octa, 1 / Math.sqrt(3), 42.2]];
  for (const [s, k, t0] of orden) { capas.push({ s, r, t0, esfera: r * k }); r *= k; }
  return capas;
})();
const ROMPE = palabra(11, 5);                              // «ninguna»
const POLVO = (() => {
  const rnd = azar(3); const out: { c: number; e: number; u: number; dx: number; dy: number; v: number }[] = [];
  KEPLER.forEach((c, ci) => c.s.e.forEach((_, ei) => { for (let k = 0; k < 70; k++) out.push({ c: ci, e: ei, u: rnd(), dx: rnd() - 0.5, dy: rnd() - 0.5, v: 0.4 + rnd() }); }));
  return out;
})();
const kepler = (ctx: Ctx, t: number) => {
  const R0 = 470;
  const ay = 0.55 + (t - 38) * 0.16, ax = 0.42;
  const proy = (p: V3, r: number): [number, number, number] => {
    let [x, y, z] = p; x *= r; y *= r; z *= r;
    const c = Math.cos(ay), s = Math.sin(ay); [x, z] = [c * x + s * z, -s * x + c * z];
    const c2 = Math.cos(ax), s2 = Math.sin(ax); [y, z] = [c2 * y - s2 * z, s2 * y + c2 * z];
    const f = 2400 / (2400 + z * R0);
    return [W / 2 + x * R0 * f, H / 2 + y * R0 * f, z];
  };
  const roto = pr(t, ROMPE, 2.6);
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
  if (roto <= 0) {
    KEPLER.forEach((c) => {
      const a = eSuave(pr(t, c.t0 + 0.5, 1.0)) * 0.22;
      if (a <= 0) return;
      ctx.strokeStyle = `rgba(${RGB.cian},${a})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(W / 2, H / 2, c.esfera * R0, 0, Math.PI * 2); ctx.stroke();
    });
    KEPLER.forEach((c, ci) => {
      const x = pr(t, c.t0, 0.9);
      if (x <= 0) return;
      const n = c.s.e.length;
      c.s.e.forEach(([i, j], k) => {
        const u = cl(x * n * 0.6 + 1 - k * 0.6, 0, 1); if (u <= 0) return;
        const a = proy(c.s.vs[i], c.r), b = proy(c.s.vs[j], c.r);
        const bx = lerp(a[0], b[0], eOut(u)), by = lerp(a[1], b[1], eOut(u));
        const prof = 0.55 + 0.45 * cl(1 - (a[2] + b[2]) / 4, 0, 1);
        for (const [lw, al] of [[9, 0.05], [3.5, 0.18], [1.3, 0.9]]) {
          ctx.strokeStyle = ci % 2 ? `rgba(255,214,160,${al * prof})` : `rgba(${RGB.durazno},${al * prof})`;
          ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(bx, by); ctx.stroke();
        }
      });
    });
  } else {
    // «¿y si no hubiera ninguna?»: la estructura se deshace en polvo que se va
    const f = eOut(roto);
    const al = (1 - pr(t, ROMPE + 0.2, 2.2)) * 0.8;
    if (al > 0) for (const p of POLVO) {
      const c = KEPLER[p.c]; const [i, j] = c.s.e[p.e];
      const a = proy(c.s.vs[i], c.r), b = proy(c.s.vs[j], c.r);
      const x = lerp(a[0], b[0], p.u) + p.dx * 900 * f * p.v, y = lerp(a[1], b[1], p.u) + (p.dy * 900 - 160) * f * p.v;
      ctx.fillStyle = `rgba(255,214,160,${al})`; ctx.fillRect(x, y, 2, 2);
    }
  }
  ctx.restore();
};

// ══ «¿Y si el universo no estuviera hecho para nosotros?» · descenso continuo al borde del Mandelbrot ═══════════
const fractal = (ctx: Ctx, t: number) => {
  const x = t - 48.2;
  const esc = (3.2 / W) * Math.pow(10, -0.62 * x);
  const l = pintarFractalTeaser(W, H, { cx: -0.77568377, cy: 0.13646737, esc, rot: 0.25 + 0.02 * x, modo: 0, lente: 1e9, fase: 0.05 * x, paleta: PALETAS[1], brillo: 0.92, maxIt: Math.round(300 + 170 * Math.log10(Math.max(1, 3.2 / (esc * W)))), tiempo: 0 });
  ctx.drawImage(l, 0, 0, W, H);
};

// ══ «¿Y si no hubiera un significado escrito…?» · partículas que se organizan solas ══════════════════════════════
const COL_VIDA = ["255,214,170", "150,222,226", "238,140,120", "205,140,220", "255,244,222"];
const SPR: Record<string, HTMLCanvasElement> = {};
const sprite = (rgb: string) => {
  if (SPR[rgb]) return SPR[rgb];
  const c = document.createElement("canvas"); c.width = c.height = 24;
  const x = c.getContext("2d")!; const g = x.createRadialGradient(12, 12, 0, 12, 12, 12);
  g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(0.25, `rgba(${rgb},0.5)`); g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.fillRect(0, 0, 24, 24);
  return (SPR[rgb] = c);
};
const vida = (ctx: Ctx, t: number, V: Vida | null) => {
  if (!V) return falta(ctx, "vida");
  const f = Math.min(V.cuadros - 1, Math.max(0, Math.floor((t - 52.4 + FUNDE) * 30)));
  const base = f * V.n * 2;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const esc = lerp(1.0, 1.08, eSuave(pr(t, 52.4, 5.4)));
  ctx.translate(W / 2, H / 2); ctx.scale(esc, esc); ctx.translate(-W / 2, -H / 2);
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < V.n; i++) {
    const x = (V.pos[base + 2 * i] / 65535) * W, y = (V.pos[base + 2 * i + 1] / 65535) * H;
    ctx.drawImage(sprite(COL_VIDA[V.tipo[i]]), x - 7, y - 7, 14, 14);
  }
  ctx.restore();
};

// ══ «Somos parte de ese universo intentando comprenderse» · neuronas → red cósmica ════════════════════════════════
const neurona = (ctx: Ctx, t: number, m: Medios) => {
  // v19 · fusión anidada, como en La frontera: la región de las neuronas por donde se sale (centro 0,58·0,50, radio
  // 0,25 del ancho) es la misma, en el mismo lugar y tamaño, que la región de la red cósmica por donde se entra
  // (0,50·0,50, radio 0,44). La cámara se aleja sin parar; la red aparece por suma de luz y las fibras se apagan dentro.
  const t0 = 79.0, tu = palabra(17, 4);                       // «universo»
  const N = m.neurona, R = m["@p5/1-red.jpg"];
  if (!N) return falta(ctx, "neurona");
  const kN = 1.9 * Math.exp(-0.16 * (t - t0));
  const kW = kN * (0.25 * 4096) / (0.44 * 1837);
  const pon = (im: HTMLImageElement, k: number, fx: number, fy: number) => ctx.drawImage(im, W / 2 - fx * im.width * k, H / 2 - fy * im.height * k, im.width * k, im.height * k);
  const sale = eSuave(pr(t, tu + 0.5, 1.8)), entra = eSuave(pr(t, tu - 0.7, 1.6));
  ctx.save(); ctx.globalAlpha = 1 - sale; pon(N, kN, 0.58, 0.5); ctx.restore();
  if (R && entra > 0) {
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = entra * (1 - sale); pon(R, kW, 0.5, 0.5); ctx.restore();
    if (sale > 0) { ctx.save(); ctx.globalAlpha = sale; pon(R, kW, 0.5, 0.5); ctx.restore(); }
  }
};

// ══ «Descubrir que una flor sigue reglas matemáticas no la hace menos hermosa» · girasol + filotaxis ═══════════════
const GIRASOL = { fx: 0.55, fy: 0.487, rd: 0.256 };       // centro y radio del disco (fracción del ancho de la foto)
const OURO = Math.PI * (3 - Math.sqrt(5));                 // ángulo áureo
// escala del girasol: entra muy cerca (flósculos como estrellas) y se aleja hasta la flor entera
const escGirasol = (t: number) => lerp(1.08, 1.3, eSuave(pr(t, 88.2, 7.2)));   // v20: se acerca, como Andrómeda; ≥ 1,08 cubre el cuadro
const R_GIRASOL = (t: number) => GIRASOL.rd * 4000 * Math.max(W / 4000, H / 2776) * escGirasol(t);
const R_SOL = 445;                                          // radio del disco solar en el cuadro del video (medido)
const escSol = (t: number) => lerp(R_GIRASOL(95.0) / R_SOL, 1.08, eIO(pr(t, 95.0, 3.2)));
const girasolFoto = (ctx: Ctx, t: number, m: Medios) => {
  const im = m.girasol; if (!im) return;
  const s = escGirasol(t), k = Math.max(W / im.width, H / im.height) * s;
  ctx.drawImage(im, W / 2 - GIRASOL.fx * im.width * k, H / 2 - GIRASOL.fy * im.height * k, im.width * k, im.height * k);
};
const girasol = (ctx: Ctx, t: number, m: Medios) => {
  const im = m.girasol; if (!im) return falta(ctx, "girasol");
  const s = escGirasol(t);
  const k = Math.max(W / im.width, H / im.height) * s;
  const w = im.width * k, h = im.height * k;
  const ox = W / 2 - GIRASOL.fx * w, oy = H / 2 - GIRASOL.fy * h;
  ctx.drawImage(im, ox, oy, w, h);
  const R = GIRASOL.rd * w;
  const tReg = palabra(19, 5), tHerm = palabra(19, 8);       // «reglas» · «no la hace…»
  const n = Math.floor(1600 * eIO(pr(t, tReg - 0.3, 1.9)));
  const fuera = 1 - eSuave(pr(t, tHerm + 0.2, 1.4));
  // la foto se oscurece un poco para que se lea la regla (independiente de los puntos: antes entraba de golpe)
  negro(ctx, 0.45 * fuera * eSuave(pr(t, tReg - 0.4, 0.6)));
  if (n <= 0 || fuera <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 1; i <= n; i++) {
    const r = R * Math.sqrt(i / 1600), a = i * OURO;
    const x = W / 2 + Math.cos(a) * r, y = H / 2 + Math.sin(a) * r;
    const nuevo = cl((n - i) / 60, 0, 1);
    ctx.fillStyle = `rgba(255,236,190,${(0.35 + 0.65 * (1 - nuevo)) * fuera})`;
    ctx.beginPath(); ctx.arc(x, y, 2.2 + 3.2 * Math.sqrt(i / 1600), 0, Math.PI * 2); ctx.fill();
  }
  // las espirales de Fibonacci: 21 en un sentido y 34 en el otro
  const sp = eIO(pr(t, tReg + 1.0, 1.2)) * fuera;
  if (sp > 0) {
    for (const [fam, col] of [[21, RGB.durazno], [34, RGB.cian]] as [number, string][]) {
      ctx.strokeStyle = `rgba(${col},${0.55 * sp})`; ctx.lineWidth = 1.6;
      for (let j = 1; j <= fam; j++) {
        ctx.beginPath();
        for (let i = j; i <= 1600; i += fam) {
          const r = R * Math.sqrt(i / 1600), a = i * OURO;
          const x = W / 2 + Math.cos(a) * r, y = H / 2 + Math.sin(a) * r;
          if (i === j) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }
  ctx.restore();
  texto(ctx, "137,5°", W / 2, H * 0.88, 44, 0.85 * eSuave(pr(t, tReg, 0.6)) * fuera, { fam: MONO, esp: 4 });
};
// «Entender las estrellas»: el disco del girasol se vuelve el disco del Sol (mismo centro, mismo radio)
const girasolAlSol = (ctx: Ctx, t: number, m: Medios) => {
  girasol(ctx, t, m);
  if (t > 94.4) fusion(ctx, t, 94.4, 95.0, (c) => cubrir(c, m[cuadroVid("sol", t, BASE.sol)], 0.5, 0.5, escSol(t)));
};

// ══ «Entender las estrellas no apaga su luz» · el Sol y su espectro ════════════════════════════════════════════
const LINEAS: [number, string, number][] = [[393.4, "Ca", 1], [396.8, "", 1], [430.8, "Fe", 0.6], [486.1, "H", 0.9], [517.3, "Mg", 0.7], [527.0, "Fe", 0.5], [589.0, "Na", 1], [589.6, "", 1], [656.3, "H", 1]];
const colorNm = (nm: number) => `hsl(${(1 - (nm - 390) / 310) * 270},100%,${55 - 12 * Math.max(0, (nm - 640) / 60)}%)`;
const sol = (ctx: Ctx, t: number, m: Medios) => {
  const im = VID.sol ? m[cuadroVid("sol", t, BASE.sol)] : undefined;
  if (!cubrir(ctx, im, 0.5, 0.5, escSol(t))) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    resplandor(ctx, W / 2, H * 0.4, 900, 0.6, "255,190,110"); resplandor(ctx, W / 2, H * 0.4, 380, 1, "255,236,200");
  }
  const t1 = palabra(20, 1);                                  // «las estrellas»
  const x = eIO(pr(t, t1, 1.2));
  if (x <= 0) return;
  const y0 = H * 0.82, alto = 100, x0 = 60, x1 = W - 60;
  ctx.save();
  ctx.globalAlpha = x;
  ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(x0 - 20, y0 - 60, x1 - x0 + 40, alto + 140);
  const ancho = (x1 - x0) * x;
  for (let px = 0; px < ancho; px++) { ctx.fillStyle = colorNm(390 + (px / (x1 - x0)) * 310); ctx.fillRect(x0 + px, y0, 1.2, alto); }
  for (const [nm, el, a] of LINEAS) {
    const px = x0 + ((nm - 390) / 310) * (x1 - x0);
    if (px > x0 + ancho) continue;
    ctx.fillStyle = `rgba(0,0,0,${0.85 * a})`; ctx.fillRect(px - 1.5, y0, 3, alto);
    if (el) texto(ctx, el, px, y0 + alto + 34, 26, eSuave(pr(t, t1 + 0.5 + (nm - 390) / 600, 0.4)), { fam: MONO });
  }
  ctx.restore();
};

// ══ «Encontrar una explicación no destruye el misterio» · la regla y su fractal ═════════════════════════════════
const formula = (ctx: Ctx, t: number) => {
  const tNo = palabra(21, 3) - 0.2;                           // «no destruye»
  const abre = eIO(pr(t, tNo, 1.8));
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  if (abre > 0) {
    const esc = lerp(3.3 / H, 2.9 / H, eSuave(pr(t, 98.8, 4.2)));
    ctx.save(); ctx.globalAlpha = abre;
    ctx.drawImage(pintarFractalTeaser(W, H, { cx: -0.6, cy: 0, esc, rot: -Math.PI / 2, modo: 0, lente: 1e9, fase: 0.03 * (t - 98.8), paleta: PALETAS[0], brillo: 0.9, maxIt: 320, tiempo: 0 }), 0, 0, W, H);
    ctx.restore();
  }
  const a = eSuave(pr(t, 98.85, 0.7));
  const y = lerp(H * 0.5, H * 0.365, eIO(pr(t, tNo, 1.4)));             // v19: en el centro del vacío del cardioide
  const tam = lerp(150, 104, eIO(pr(t, tNo, 1.4)));
  ctx.save(); ctx.font = `italic 400 ${tam}px ${SERIF}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = `rgba(${RGB.crema},0.6)`; ctx.shadowBlur = 24;
  ctx.fillStyle = `rgba(${RGB.crema},${a})`;
  ctx.fillText("z  →  z² + c", W / 2, y);
  ctx.restore();
};

// ══ «A veces, lo multiplica» · la grilla que se subdivide en cada golpe ═════════════════════════════════════════
const JULIAS: [number, number][] = (() => {
  const rnd = azar(9); const out: [number, number][] = [];
  const base: [number, number][] = [[-0.8, 0.156], [-0.7269, 0.1889], [0.285, 0.01], [-0.4, 0.6], [-0.835, -0.2321], [0.355, 0.355], [-0.70176, -0.3842], [-0.162, 1.04], [0.37, 0.1], [-0.54, 0.54], [-0.12, -0.77], [0.28, 0.008]];
  for (let i = 0; i < 256; i++) { const b = base[i % base.length]; out.push([b[0] + (rnd() - 0.5) * 0.02, b[1] + (rnd() - 0.5) * 0.02]); }
  return out;
})();
export const NIVELES = [103.0, 103.75, 104.4, 105.15, 105.9];   // 1, 2, 4, 8, 16 columnas
const multiplica = (ctx: Ctx, t: number) => {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  let nv = 0; for (let i = 0; i < NIVELES.length; i++) if (t >= NIVELES[i]) nv = i;
  const cols = 1 << nv, filas = Math.max(1, Math.round(cols * (H / W)));
  const cw = W / cols, ch = H / filas;
  const golpe = Math.exp(-(t - NIVELES[nv]) * 4);
  const fin = eSuave(pr(t, 106.6, 0.9));
  const tw = Math.ceil(cw), th = Math.ceil(ch);
  for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) {
    const k = (f * 31 + c * 17 + nv * 7) % JULIAS.length;
    const l = pintarFractalTeaser(tw, th, { cx: 0, cy: 0, esc: 3.3 / Math.min(tw, th), rot: 0.3 * k + 0.05 * t, julia: JULIAS[k], modo: 0, lente: 1e9, fase: 0.1 * k + 0.04 * t, paleta: PALETAS[k % 4], brillo: 0.85 + 0.35 * golpe, maxIt: cols > 8 ? 140 : 260, tiempo: 0 });
    const enc = lerp(1, 0.04, fin);
    const x = c * cw + (cw * (1 - enc)) / 2, y = f * ch + (ch * (1 - enc)) / 2;
    ctx.drawImage(l, 0, 0, tw, th, x + 1, y + 1, Math.max(1, cw * enc - 2), Math.max(1, ch * enc - 2));
  }
  if (fin > 0) for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) resplandor(ctx, (c + 0.5) * cw, (f + 0.5) * ch, 10, 0.7 * fin * (0.5 + (0.5 * ((f * 7 + c * 13) % 5)) / 4));
  const g = NIVELES[2];
  if (t >= g && t < g + 0.6) { ctx.fillStyle = `rgba(${RGB.crema},${0.35 * Math.exp(-(t - g) * 7)})`; ctx.fillRect(0, 0, W, H); }
};

// ══ «Quizás no estamos aquí para cumplir un propósito…» · alguien mira el cielo ═════════════════════════════════
const cielo = (ctx: Ctx, t: number, m: Medios) => {
  const b = palabra(24, 0);                                    // segunda «Quizás»: cambia el plano
  const A = m["cielo-a"], B = m["cielo-b"] ?? m["cielo-a"];
  if (!A) return falta(ctx, "cielo");
  if (t < b + FUNDE) cubrir(ctx, A, 0.5, 0.5, lerp(1.0, 1.06, eSuave(pr(t, 107.5, b - 107.5))));
  if (t > b - FUNDE) {
    ctx.save(); ctx.globalAlpha = eSuave(pr(t, b - FUNDE, 2 * FUNDE));
    cubrir(ctx, B, 0.5, 0.5, lerp(1.0, 1.05, eSuave(pr(t, b, 115.6 - b)))); ctx.restore();
  }
};

// ══ «Y, sinceramente… ¿No te parece extraordinario?» · el Punto azul pálido ═════════════════════════════════════
export const PUNTO = { fx: 0.594, fy: 0.519 };                    // posición de la Tierra en la foto
const punto = (ctx: Ctx, t: number, m: Medios) => {
  const tE = G.extraordinario;
  const s = lerp(1.12, 1.45, eSuave(pr(t, 115.6, 6)));                 // v20: ≥ 1,12, sin tocar el borde: solo zoom
  if (!cubrir(ctx, m.punto, PUNTO.fx, PUNTO.fy, s)) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); }
  // todo lo demás se apaga; queda el punto, el mismo del comienzo, y se apaga
  negro(ctx, 0.97 * eSuave(pr(t, tE - 0.3, 1.4)));
  const a = eSuave(pr(t, tE - 0.3, 1.0)) * (1 - eSuave(pr(t, 121.75, 0.3)));
  resplandor(ctx, W / 2, H / 2, 60, 0.8 * a, "200,225,255");
  resplandor(ctx, W / 2, H / 2, 10, a, "240,248,255");
};

// ══ título ══════════════════════════════════════════════════════════════════════════════════════════════════
// ══ cierre (v14, 2 nov): alejarse al universo con el texto original de Nico, sobrio ════════════════════════════════
// Desde el Punto azul pálido: Tierra → Sol y órbitas → vecindad solar → Vía Láctea → campo profundo del Webb → red
// cósmica (src/existir/escalas.ts). Sin voz. Título arriba; las frases abajo, una a la vez, al ritmo de lectura.
export const VOZ_CIERRE: number[] = [];
export const recursosCierre = (_l: number) => imagenesViaje().map((x) => "@" + x);
// v28 · lectura del cierre (Nico: «aparece el texto justo en partes blancas y casi ni se alcanza a leer»)
// luminancia media (0..1, codificada) de una región del lienzo, muestreada cada «paso» píxeles
const lumRegion = (ctx: Ctx, x: number, y: number, w: number, h: number, paso = 12) => {
  x = Math.max(0, Math.round(x)); y = Math.max(0, Math.round(y));
  w = Math.min(W - x, Math.round(w)); h = Math.min(H - y, Math.round(h));
  if (w <= 0 || h <= 0) return 0;
  const d = ctx.getImageData(x, y, w, h).data; let s = 0, n = 0;
  for (let j = 0; j < h; j += paso) for (let i = 0; i < w; i += paso) {
    const k = (j * w + i) * 4; s += 0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2]; n++;
  }
  return n ? s / n / 255 : 0;
};
// exposición automática: si el cuadro pasa de «meta», se multiplica hacia abajo con suavidad (las sombras no cambian
// de tono porque multiply conserva el negro); nunca sube la imagen
const exposicion = (ctx: Ctx, meta = 0.3) => {
  const m = lumRegion(ctx, 0, 0, W, H, 24);
  if (m <= meta) return;
  const f = lerp(1, meta / m, 0.8);
  ctx.save(); ctx.globalCompositeOperation = "multiply"; const c = Math.round(255 * f);
  ctx.fillStyle = `rgb(${c},${c},${c})`; ctx.fillRect(0, 0, W, H); ctx.restore();
};
// velo adaptativo: óvalo negro muy difuso (sin bordes) detrás de un bloque de texto, solo si el fondo es claro y en
// proporción a cuán claro es; sobre el espacio oscuro no aparece
const velo = (ctx: Ctx, cx: number, cy: number, w: number, h: number, a: number) => {
  if (a <= 0) return;
  const L = lumRegion(ctx, cx - w / 2, cy - h / 2, w, h, 10);
  const k = cl((L - 0.22) / 0.4) * 0.62 * a;
  if (k <= 0.005) return;
  ctx.save(); ctx.translate(cx, cy); ctx.scale((w * 0.95) / (h * 1.9), 1);
  const R = h * 1.9;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, `rgba(0,0,0,${k})`); g.addColorStop(0.45, `rgba(0,0,0,${k * 0.75})`); g.addColorStop(0.75, `rgba(0,0,0,${k * 0.3})`); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(-R, -R, 2 * R, 2 * R); ctx.restore();
};
const CIERRE_TEXTOS: { s: string; t0: number; t1: number; y: number }[] = [
  { s: "Somos parte de aquello que intentamos comprender.", t0: 4.0, t1: 15.4, y: 1330 },
  { s: "Materia nacida de las estrellas, que aprendió a sentir, a preguntarse y a contemplar la inmensidad de la que proviene.", t0: 7.6, t1: 15.4, y: 1470 },
  { s: "Y quizás eso sea lo más extraordinario:", t0: 16.6, t1: 32.0, y: 1330 },
  { s: "que el universo, por un instante, pueda mirarse a sí mismo a través de nosotros.", t0: 19.8, t1: 32.0, y: 1450 },
];
const parrafo = (ctx: Ctx, s: string, y: number, a: number, tam = 40, ancho = 900) => {
  if (a <= 0) return;
  ctx.save();
  ctx.font = `300 ${tam}px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = 22;
  const lin: string[] = [""];
  for (const p of s.split(" ")) { const pr2 = lin[lin.length - 1] ? lin[lin.length - 1] + " " + p : p; if (ctx.measureText(pr2).width > ancho && lin[lin.length - 1]) lin.push(p); else lin[lin.length - 1] = pr2; }
  const a2 = 1 - Math.sqrt(1 - Math.min(1, a));
  ctx.fillStyle = `rgba(${RGB.crema},${a2})`;
  lin.forEach((l, i) => {
    ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = 6; ctx.fillText(l, W / 2, y + i * tam * 1.45);
    ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 24; ctx.fillText(l, W / 2, y + i * tam * 1.45);
  });
  ctx.restore();
};
const lineasParrafo = (ctx: Ctx, s: string, tam = 40, ancho = 900) => {
  ctx.save(); ctx.font = `300 ${tam}px ${SANS}`; let n = 1, cur = "";
  for (const p of s.split(" ")) { const pr2 = cur ? cur + " " + p : p; if (ctx.measureText(pr2).width > ancho && cur) { n++; cur = p; } else cur = pr2; }
  ctx.restore(); return n;
};
// v16 · el viaje continuo de La frontera, al revés (src/existir/cosmos.ts): de las neuronas a la red cósmica
const VIAJE0 = 0.6, VIAJE1 = 29.4;                         // y después la cámara sigue alejándose hasta el negro
const cierre = (ctx: Ctx, tv: number, m: Medios) => {
  const l = tv - CIERRE0;
  const mapa = new Map<string, HTMLImageElement>();
  for (const src of imagenesViaje()) { const im = m["@" + src]; if (im) mapa.set(src, im); }
  pintarViaje(ctx, l, VIAJE0, VIAJE1, mapa, 0);                       // v19: sin los rótulos de escala
  // la entrada: el punto de luz del Punto azul pálido se abre en las neuronas, desde el centro hacia afuera
  const abre = eIO(pr(l, 0.0, 2.0));
  if (abre < 1) {
    const R = lerp(0, Math.hypot(W, H) * 0.62, abre);
    const g = ctx.createRadialGradient(W / 2, H / 2, R * 0.4, W / 2, H / 2, Math.max(1, R));
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = abre <= 0 ? "#000" : g; ctx.fillRect(0, 0, W, H);
  }
  exposicion(ctx, 0.3);
  const punto0 = 1 - eSuave(pr(l, 0.4, 1.4));
  resplandor(ctx, W / 2, H / 2, 60, 0.8 * punto0, "200,225,255"); resplandor(ctx, W / 2, H / 2, 10, punto0, "240,248,255");
  // al final la oscuridad se cierra desde los bordes hacia el centro: el universo queda como un punto de luz (el del
  // comienzo del video) que se apaga
  const cierra = eIO(pr(l, 29.0, 3.4));
  if (cierra > 0) {
    const R = lerp(Math.hypot(W, H) * 0.8, 0, cierra);
    const g = ctx.createRadialGradient(W / 2, H / 2, R * 0.35, W / 2, H / 2, Math.max(1, R));
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,1)");
    // entra de a poco (antes arrancaba de golpe: un salto de luz en 2:31)
    ctx.save(); ctx.globalAlpha = eSuave(cl(cierra * 3)); ctx.fillStyle = cierra >= 1 ? "#000" : g; ctx.fillRect(0, 0, W, H); ctx.restore();
    resplandor(ctx, W / 2, H / 2, lerp(10, 60, eSuave(pr(l, 31.0, 1.2))), 0.9 * eSuave(pr(l, 30.6, 1.0)) * (1 - eSuave(pr(l, 32.6, 0.8))), "255,244,222");
    resplandor(ctx, W / 2, H / 2, 8, eSuave(pr(l, 30.6, 1.0)) * (1 - eSuave(pr(l, 32.6, 0.8))), "255,250,240");
  }
  negro(ctx, eSuave(pr(l, 32.4, 1.4)));
  const fin = 1 - eSuave(pr(l, 31.8, 1.0));
  // velos solo donde hay texto y el fondo es claro
  velo(ctx, W / 2, 404, 760, 210, Math.max(eSuave(pr(l, 1.0, 1.2)), 0) * fin);
  for (const c of CIERRE_TEXTOS) {
    const ac = eSuave(pr(l, c.t0, 0.9)) * (1 - eSuave(pr(l, c.t1, 0.8)));
    const n = lineasParrafo(ctx, c.s); const alto = n * 40 * 1.45;
    velo(ctx, W / 2, c.y + alto / 2 - 20, 980, alto + 60, ac);
  }
  // v21: sin bandas; solo una sombra suave pegada a cada letra
  const esp = lerp(22, 12, eOut(pr(l, 1.0, 4)));
  for (const [sc, sb] of [["rgba(0,0,0,0.95)", 7], ["rgba(0,0,0,0.85)", 26]] as const) {
    ctx.save(); ctx.shadowColor = sc; ctx.shadowBlur = sb;
    const k = (x: number) => 1 - Math.sqrt(1 - Math.min(1, x));
    texto(ctx, "Y SIN EMBARGO,", W / 2, 360, 70, k(eSuave(pr(l, 1.0, 1.2)) * fin), { peso: 300, esp });
    texto(ctx, "ESTAMOS AQUÍ", W / 2, 360 + 88, 70, k(eSuave(pr(l, 1.8, 1.2)) * fin), { peso: 400, esp });
    ctx.restore();
  }
  for (const c of CIERRE_TEXTOS) parrafo(ctx, c.s, c.y + (1 - eOut(pr(l, c.t0, 1.2))) * 10, eSuave(pr(l, c.t0, 0.9)) * (1 - eSuave(pr(l, c.t1, 0.8))) * 0.95);
};

const titulo = (ctx: Ctx, t: number, m: Medios) => {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  // solo la firma (2 nov: Nico no quiere el título «Qué extraño es existir» al final); entra con el último pulso
  const a3 = eSuave(pr(t, G.titulo, 1.2)) * (1 - eSuave(pr(t, K.total - 1.0, 1.0)));
  if (m.logo && a3 > 0) {
    const w = 520, h = (m.logo.height / m.logo.width) * w;
    ctx.save(); ctx.globalAlpha = a3; ctx.drawImage(m.logo, W / 2 - w / 2, H / 2 - h / 2, w, h); ctx.restore();
    const a4 = eSuave(pr(t, G.titulo + 1.9, 1.3)) * (1 - eSuave(pr(t, K.total - 1.0, 1.0)));   // entra después del logo
    texto(ctx, "UNA REFLEXIÓN SOBRE LA EXISTENCIA", W / 2, H / 2 + h / 2 + 70, 22, a4 * 0.7, { fam: MONO, esp: 6 });
    // 4 nov: redes y enlaces de B&N Lectures + Instagram de Nico, entran con la firma
    const a5 = eSuave(pr(t, G.titulo + 2.4, 1.0)) * (1 - eSuave(pr(t, K.total - 1.0, 1.0)));
    if (a5 > 0) {
      const y0 = H / 2 + h / 2 + 170;
      ctx.save(); ctx.fillStyle = `rgba(${RGB.crema},${0.25 * a5})`; ctx.fillRect(W / 2 - 60, y0 - 34, 120, 1.5); ctx.restore();
      texto(ctx, "lectures.bnsolutions.cl", W / 2, y0 + 10, 32, a5 * 0.92, { peso: 400, esp: 1 });
      const redes = ["YOUTUBE   @bnlectures", "INSTAGRAM   @bnsolutions.cl", "LINKEDIN   B&N Solutions"];
      redes.forEach((r, i) => texto(ctx, r, W / 2, y0 + 72 + i * 44, 22, a5 * 0.62, { fam: MONO, esp: 3 }));
      texto(ctx, "CREADO POR   @4mser", W / 2, y0 + 72 + 3 * 44 + 44, 22, a5 * 0.62, { fam: MONO, esp: 3 });
    }
  }
};

// ══ cuadro completo ════════════════════════════════════════════════════════════════════════════════════════
let capa: HTMLCanvasElement | null = null;
export const dibujarExistir = (ctx: Ctx, t: number, frame: number, m: Medios, V: Vida | null, post = true) => {
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  for (const v of visibles(t)) {
    let c: Ctx = ctx;
    if (v.a < 1) {
      if (!capa) { capa = document.createElement("canvas"); capa.width = W; capa.height = H; }
      c = capa.getContext("2d")!; c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.fillStyle = "#000"; c.fillRect(0, 0, W, H);
    }
    const T = v.tv;
    switch (v.n) {
      case "vinilo": video(c, "vinilo", T, v.t0, m, 1.0, 1.05); break;
      case "galaxia": galaxia(c, T, m); break;
      case "tierra": tierra(c, T, m); break;
      case "campo": campo(c, T, m); break;
      case "alma": video(c, "alma", T, BASE.alma, m, 1.0, 1.06); break;   // (desde 22,9 ya sin desplazamiento)
      case "chladni": chladni(c, T, frame); break;
      case "flammarion": flammarion(c, T, m); break;
      case "kepler": kepler(c, T); break;
      case "fractal": fractal(c, T); break;
      case "vida": vida(c, T, V); break;
      case "pilares": video(c, "pilares", T, v.t0, m, 1.0, 1.04); break;
      case "webb": video(c, "webb", T, v.t0, m); break;
      case "mitosis": video(c, "mitosis", T, v.t0, m, 1.0, 1.05); break;
      case "abrazo": video(c, "abrazo", T, v.t0, m); break;
      case "neurona": neurona(c, T, m); break;
      case "andromeda":
        video(c, "andromeda", T, BASE.andromeda, m);
        // «Descubrir que una flor…»: las estrellas de Andrómeda se funden con los flósculos del girasol
        // v20: el girasol aparece desde su centro hacia afuera, mientras las dos cámaras siguen acercándose
        if (T > 88.4) {
          if (!capaFusion) { capaFusion = document.createElement("canvas"); capaFusion.width = W; capaFusion.height = H; }
          const cf = capaFusion.getContext("2d")!;
          cf.globalCompositeOperation = "source-over"; cf.clearRect(0, 0, W, H); girasolFoto(cf, T, m);
          const x = eIO(pr(T, 88.4, 1.6)), R = lerp(0, 1500, x);
          const g = cf.createRadialGradient(W / 2, H / 2, R * 0.55, W / 2, H / 2, Math.max(1, R));
          g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
          cf.globalCompositeOperation = "destination-in"; cf.fillStyle = g; cf.fillRect(0, 0, W, H);
          c.save(); c.globalCompositeOperation = "screen"; c.globalAlpha = 0.35 * eSuave(pr(T, 88.4, 0.6)) * (1 - x); girasolFoto(c, T, m); c.restore();
          c.drawImage(capaFusion, 0, 0);
        }
        break;
      case "girasol": girasolAlSol(c, T, m); break;
      case "sol": sol(c, T, m); break;
      case "formula": formula(c, T); break;
      case "multiplica": multiplica(c, T); break;
      case "cielo": cielo(c, T, m); break;
      case "punto": punto(c, T, m); break;
      case "cierre": cierre(c, T, m); break;
      case "titulo": titulo(c, T, m); break;
    }
    if (c !== ctx) {
      if (v.largo) {
        // fundido cruzado largo (0,9 s) con entrada y salida suaves: parejo con cualquier par de imágenes
        ctx.save(); ctx.globalAlpha = eIO(v.a); ctx.drawImage(capa!, 0, 0); ctx.restore();
      } else { ctx.save(); ctx.globalAlpha = v.a; ctx.drawImage(capa!, 0, 0); ctx.restore(); }
    }
  }
  negro(ctx, 1 - eSuave(pr(t, 0, 0.5)));
  if (!post) return;
  let golpe = 0;
  for (const k of ["aqui", "roca", "contrario", "multiplica", "titulo"]) { const g0 = (G[k] >= CORTE ? G[k] + DESPL : G[k]) + (k === "titulo" ? DESPL2 : 0); if (t >= g0 && t - g0 < 1.5) golpe = Math.max(golpe, 0.8 * Math.exp(-(t - g0) * 3)); }
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.95, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: golpe * 0.35, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
  if (LOCUCION) apuntador(ctx, t); else if (!SIN_SUBS) subtitulos(ctx, t);
};

// ══ subtítulos: cada palabra aparece cuando la voz la dice; la frase se va al terminar ════════════════════════════
const SUB_Y = 1470, SUB_ANCHO = 920, SUB_TAM = 50;
const lineas = (ctx: Ctx, pal: string[]) => {
  const out: number[][] = [[]]; let ancho = 0;
  const esp = ctx.measureText(" ").width;
  pal.forEach((p, i) => {
    const w = ctx.measureText(p).width;
    if (ancho > 0 && ancho + esp + w > SUB_ANCHO) { out.push([]); ancho = 0; }
    out[out.length - 1].push(i); ancho += (ancho > 0 ? esp : 0) + w;
  });
  // equilibrar dos líneas: que la de abajo no quede con una palabra sola
  if (out.length === 2 && out[1].length === 1 && out[0].length > 2) out[1].unshift(out[0].pop()!);
  return out;
};
const V_TODAS = [...((VOZ_NICO === "A" ? VOZ_A : VOZ_NICO === "B" ? VOZ_B : VOZ_NICO === "C" ? VOZ_C : VOZ_NICO === "D" ? VOZ_D : VOZ_NICO === "Dpro" ? VOZ_DPRO : VOZ_NICO === "Epro" ? VOZ_EPRO : VOZ_NICO === "Fpro" ? VOZ_FPRO : VOZ) as unknown as { texto: string; fin: number; palabras: [string, number][] }[])];
export const VOZ_TODAS = [...VOZ_REAL];   // v13: el cierre va sin voz, como texto poético (ver cierre)
const subtitulos = (ctx: Ctx, t: number) => {
  const V = V_TODAS;
  for (let k = 0; k < V.length; k++) {
    const t0 = VOZ_TODAS[k], t1 = t0 + V[k].fin;
    const sig = k + 1 < V.length ? VOZ_TODAS[k + 1] : Infinity;
    const sale = Math.min(t1 + 0.7, sig - 0.05);
    if (t < t0 - 0.05 || t > sale) continue;
    const salida = 1 - eSuave(pr(t, sale - 0.35, 0.35));
    const pal = V[k].texto.split(/\s+/);
    ctx.save();
    ctx.font = `400 ${SUB_TAM}px ${SANS}`; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.5px";
    ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 18;
    const L0 = lineas(ctx, pal);
    // frases muy largas (versión chiste): de a 3 líneas, la página de la última palabra dicha
    let L = L0;
    if (L0.length > 5) {
      let ult = 0;
      L0.forEach((ids, li) => { if (ids.some((i) => t >= t0 + (V[k].palabras[i]?.[1] ?? 0) - 0.06)) ult = li; });
      const pag = Math.floor(ult / 3);
      L = L0.slice(pag * 3, pag * 3 + 3);
    }
    const esp = ctx.measureText(" ").width;
    // v23: sin banda detrás; la sombra va pegada a cada letra (una cerca y otra amplia)
    L.forEach((ids, li) => {
      const ancho = ids.reduce((a, i, j) => a + ctx.measureText(pal[i]).width + (j ? esp : 0), 0);
      let x = W / 2 - ancho / 2;
      const y = SUB_Y + (li - (L.length - 1) / 2) * SUB_TAM * 1.32;
      for (const i of ids) {
        const tp = t0 + (V[k].palabras[i]?.[1] ?? 0) - 0.06;
        const a = eSuave(pr(t, tp, 0.28)) * salida;
        if (a > 0) {
          const yy = y + (1 - eOut(pr(t, tp, 0.5))) * 8;
          const a2 = 1 - Math.sqrt(1 - Math.min(1, a));            // dos pasadas que suman la misma opacidad
          ctx.fillStyle = `rgba(${RGB.crema},${a2})`;
          ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 7; ctx.fillText(pal[i], x, yy);
          ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 20; ctx.fillText(pal[i], x, yy);
        }
        x += ctx.measureText(pal[i]).width + esp;
      }
    });
    ctx.restore();
  }
};

// ══ apuntador para grabar la voz: la frase aparece 2,5 s antes en gris, cuenta 3‑2‑1 y cada palabra se enciende
// cuando debe decirse; abajo, en pequeño, la frase que viene; arriba, el tiempo ═════════════════════════════════════
const apuntador = (ctx: Ctx, t: number) => {
  const V = V_TODAS, ANT = 2.5;
  ctx.save();
  ctx.textBaseline = "middle";
  // tiempo arriba a la izquierda
  const mm = Math.floor(t / 60), ss = t - mm * 60;
  ctx.font = `500 34px ${SANS}`; ctx.textAlign = "left"; ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 10;
  ctx.fillStyle = `rgba(${RGB.crema},0.85)`; ctx.fillText(`${mm}:${ss.toFixed(1).padStart(4, "0")}`, 48, 70);
  // aviso previo según el hueco con la frase anterior (máx. 2,5 s): la frase k se muestra desde su aviso hasta que
  // entra el aviso de la siguiente o termina
  const aviso = (i: number) => i === 0 ? ANT : Math.max(0.4, Math.min(ANT, VOZ_TODAS[i] - (VOZ_TODAS[i - 1] + V[i - 1].fin) - 0.15));
  let k = -1;
  for (let i = 0; i < V.length; i++) if (t >= VOZ_TODAS[i] - aviso(i)) k = i;
  if (k >= 0 && t > VOZ_TODAS[k] + V[k].fin + 1.2) k = -1;
  // panel oscuro solo en esta versión de trabajo, para leer sobre cualquier imagen
  ctx.fillStyle = "rgba(0,0,0,0.62)"; ctx.beginPath(); ctx.roundRect(40, SUB_Y - 230, W - 80, 430, 28); ctx.fill();
  if (k >= 0) {
    const t0 = VOZ_TODAS[k], pal = V[k].texto.split(/\s+/);
    ctx.font = `500 ${SUB_TAM + 6}px ${SANS}`;
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.5px";
    const L = lineas(ctx, pal), esp = ctx.measureText(" ").width;
    L.forEach((ids, li) => {
      const ancho = ids.reduce((a, i, j) => a + ctx.measureText(pal[i]).width + (j ? esp : 0), 0);
      let x = W / 2 - ancho / 2;
      const y = SUB_Y + (li - (L.length - 1) / 2) * SUB_TAM * 1.4;
      for (const i of ids) {
        const tp = t0 + (V[k].palabras[i]?.[1] ?? 0);
        const dicha = t >= tp - 0.04;
        ctx.textAlign = "left";
        ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = 12;
        ctx.fillStyle = dicha ? "rgba(255,214,120,1)" : `rgba(${RGB.crema},0.6)`;
        ctx.fillText(pal[i], x, y);
        x += ctx.measureText(pal[i]).width + esp;
      }
    });
    // cuenta regresiva: tres puntos que se apagan uno por segundo; al llegar a cero, «▶ AHORA»
    const falta = t0 - t;
    const yc = SUB_Y - 170;
    ctx.textAlign = "center"; ctx.shadowBlur = 10;
    if (falta > 0) {
      const n = Math.ceil(falta);
      ctx.font = `600 40px ${SANS}`; ctx.fillStyle = `rgba(${RGB.crema},0.9)`;
      ctx.fillText(n <= 3 ? String(n) : "·", W / 2, yc);
      ctx.fillStyle = "rgba(255,214,120,0.9)"; ctx.fillRect(W / 2 - 160, yc + 34, 320 * cl(1 - falta / aviso(k)), 5);
    } else if (falta > -0.7) {
      ctx.font = `700 36px ${SANS}`; ctx.fillStyle = "rgba(255,214,120,1)"; ctx.fillText("▶  AHORA", W / 2, yc);
    }
    // la que viene
    if (k + 1 < V.length) {
      ctx.font = `400 30px ${SANS}`; ctx.fillStyle = `rgba(${RGB.crema},0.45)`; ctx.textAlign = "center";
      const sigTxt = V[k + 1].texto, corto = sigTxt.length > 60 ? sigTxt.slice(0, 57) + "…" : sigTxt;
      const ySig = SUB_Y + 160;
      ctx.fillText(`luego (${(VOZ_TODAS[k + 1] / 60 | 0)}:${(VOZ_TODAS[k + 1] % 60).toFixed(1).padStart(4, "0")}): ${corto}`, W / 2, ySig);
    }
  }
  ctx.restore();
};
