// «Formas del asombro» (B&N Lectures) · Ernst Haeckel y Kunstformen der Natur (1904).
// Todo es función pura de t. Seres creados por simulación (radiolarios de vidrio y medusa, en 3D; diatomea, espuma,
// coral de Gray-Scott y Physarum, en 2D) junto a las láminas originales de 1904 (dominio público).
import { getInputProps } from "remotion";
import K from "./kunst.json";
import VOZ from "./kunst_voz.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { RGB, SANS, MONO, cl, eIO, eOut, eSuave, lerp, pr } from "./theme";
import { pintarRadiolario } from "./kunst/radiolario";
import { pintarFamilia } from "./kunst/familias";

export const W = 1080, H = 1920;
type Ctx = CanvasRenderingContext2D;
export type Medios = Record<string, HTMLImageElement | undefined>;
const ORO = "236,190,112", CIAN = "150,222,236";
const RETRO = { bloom: 0.4, halo: 0.85, aberr: 0.034, vineta: 0.66, grano: 0.065, scan: 0.15, ruido: 0.45, grade: 1.75 };
const V = VOZ as unknown as { texto: string; fin: number; palabras: [string, number][] }[];
const v = K.voz;
export const LOCUCION = (getInputProps() as { locucion?: boolean }).locucion === true;
export const VOZ_T = v;

// ── utilidades ─────────────────────────────────────────────────────────────────────────────────────────────────
const txt = (ctx: Ctx, s: string, x: number, y: number, tam: number, a: number, op: { fam?: string; peso?: number; esp?: number; rgb?: string; al?: CanvasTextAlign } = {}) => {
  if (a <= 0) return;
  ctx.save(); ctx.font = `${op.peso ?? 400} ${tam}px ${op.fam ?? MONO}`; ctx.textAlign = op.al ?? "center"; ctx.textBaseline = "middle";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 0}px`;
  ctx.shadowColor = `rgba(0,0,0,${0.85 * Math.min(1, a)})`; ctx.shadowBlur = 14;
  ctx.fillStyle = `rgba(${op.rgb ?? RGB.crema},${a})`; ctx.fillText(s, x, y); ctx.restore();
};
const brillo = (ctx: Ctx, x: number, y: number, r: number, a: number, rgb = "255,236,200") => {
  if (a <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.18, `rgba(${rgb},${a * 0.45})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
};
const ventana = (t: number, a: number, b: number, fi = 1.2, fo = 1.2) => eSuave(pr(t, a, fi)) * (1 - eSuave(pr(t, b - fo, fo)));
const PART = (() => { let q = 99; const r = () => { q = (q * 16807) % 2147483647; return q / 2147483647; };
  return Array.from({ length: 4000 }, () => ({ x: r(), y: r(), a: r(), b: r(), c: r() })); })();
// imagen que cubre el cuadro con un empuje lento; foco (fx, fy) y escala extra
const cubre = (ctx: Ctx, im: HTMLImageElement | undefined, a: number, s = 1, fx = 0.5, fy = 0.5, filtro = "") => {
  if (!im || a <= 0) return;
  const k = Math.max(W / im.width, H / im.height) * s, w = im.width * k, h = im.height * k;
  ctx.save(); ctx.globalAlpha = a; if (filtro) (ctx as unknown as { filter: string }).filter = filtro;
  ctx.drawImage(im, W / 2 - fx * w, H / 2 - fy * h, w, h); ctx.restore();
};
// imagen contenida (toda visible), centrada en (x, y) con ancho w
const contiene = (ctx: Ctx, im: HTMLImageElement | undefined, a: number, x: number, y: number, w: number, filtro = "") => {
  if (!im || a <= 0) return;
  const h = (im.height / im.width) * w;
  ctx.save(); ctx.globalAlpha = a; if (filtro) (ctx as unknown as { filter: string }).filter = filtro;
  ctx.drawImage(im, x - w / 2, y - h / 2, w, h); ctx.restore();
};
const agua = (ctx: Ctx, t: number, a: number, luz = 1) => {
  // agua profunda: azul casi negro, rayos de luz que bajan y nieve marina que sube (la cámara desciende)
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `rgba(10,34,52,${a})`); g.addColorStop(0.5, `rgba(4,12,22,${a})`); g.addColorStop(1, `rgba(1,3,6,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 6; i++) {
    const x = W * (0.15 + 0.14 * i) + 60 * Math.sin(t * 0.13 + i), an = 0.12 * Math.sin(t * 0.07 + i * 1.7);
    const rg = ctx.createLinearGradient(0, 0, 0, H * 0.8);
    rg.addColorStop(0, `rgba(160,210,230,${0.05 * a * luz})`); rg.addColorStop(1, "rgba(160,210,230,0)");
    ctx.save(); ctx.translate(x, -50); ctx.rotate(an); ctx.fillStyle = rg; ctx.fillRect(-40 - 20 * (i % 3), 0, 80 + 40 * (i % 3), H); ctx.restore();
  }
  for (let i = 0; i < 420; i++) {
    const p = PART[i], y = ((p.y - t * (0.012 + 0.02 * p.a)) % 1 + 1) % 1 * H, x = (p.x + 0.01 * Math.sin(t * 0.5 + i)) * W;
    ctx.fillStyle = `rgba(200,230,240,${a * (0.08 + 0.35 * p.c * p.c)})`; const r = 0.8 + 2.2 * p.b * p.b; ctx.fillRect(x, y, r, r);
  }
  ctx.restore();
};

// ══ cámara sobre el papel: un plano macro de una lámina (foco y zoom de inicio a fin, con un empuje continuo),
// cambio de foco al entrar, luz de lámpara que barre el papel y viñeta. foco = punto de la imagen (0..1);
// z = cuántas veces el ancho de la pantalla mide la imagen (z alto = macro) ═══════════════════════════════════
export type Plano = { im: string; t0: number; t1: number; de: [number, number, number]; a: [number, number, number]; luz?: number };
const plano = (ctx: Ctx, t: number, m: Medios, P: Plano, fi = 0.7, fo = 0.7) => {
  const im = m[P.im], al = ventana(t, P.t0, P.t1, fi, fo);
  if (!im || al <= 0) return;
  const u = eIO(pr(t, P.t0 - fi * 0.5, P.t1 - P.t0 + fi * 0.5));
  const fx = lerp(P.de[0], P.a[0], u), fy = lerp(P.de[1], P.a[1], u), z = Math.exp(lerp(Math.log(P.de[2]), Math.log(P.a[2]), u));
  const w = W * z, h = (im.height / im.width) * w;
  const foco = Math.max(0, 6 * (1 - eOut(pr(t, P.t0 - fi * 0.3, 0.9))));
  ctx.save(); ctx.globalAlpha = al;
  (ctx as unknown as { filter: string }).filter = `sepia(0.3) contrast(1.12) brightness(0.74)${foco > 0.2 ? ` blur(${foco.toFixed(1)}px)` : ""}`;
  ctx.drawImage(im, W / 2 - fx * w, H / 2 - fy * h, w, h); ctx.restore();
  // la luz de una lámpara que cruza el papel en diagonal, cálida y tenue
  const lz = (P.luz ?? 1) * al, lx = lerp(-300, W + 300, pr(t, P.t0 - 0.5, P.t1 - P.t0 + 1)), ly = lerp(200, H - 200, pr(t, P.t0 - 0.5, P.t1 - P.t0 + 1));
  const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 900);
  g.addColorStop(0, `rgba(255,214,160,${0.14 * lz})`); g.addColorStop(1, "rgba(255,214,160,0)");
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, `rgba(0,0,0,${0.55 * al})`);
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
};
const planos = (ctx: Ctx, t: number, m: Medios, lista: Plano[]) => { for (const P of lista) if (t > P.t0 - 1 && t < P.t1 + 1) plano(ctx, t, m, P); };

// ══ 1 · 1864: la foto de Haeckel, la fecha ═══════════════════════════════════════════════════════════════════════
const apertura = (ctx: Ctx, t: number, m: Medios) => {
  const a = ventana(t, 0, v[1] + 0.8, 1.4, 1.6);
  if (a <= 0) return;
  agua(ctx, t, a * eSuave(pr(t, v[1] - 1.2, 2.0)), 0.6);
  // la foto, como una tarjeta antigua al centro, que se oscurece cuando la voz dice «perdió a su esposa»
  const aFoto = a * (1 - eSuave(pr(t, v[1] - 0.4, 1.4)));
  const s = lerp(1.0, 1.06, pr(t, 0, 9));
  const pierde = v[0] + (V[0].palabras.find((p) => p[0].startsWith("esposa"))?.[1] ?? 3);
  const filtro = `sepia(0.55) contrast(1.05) brightness(${lerp(0.95, 0.7, eSuave(pr(t, pierde, 2.0)))})`;
  contiene(ctx, m.haeckel, aFoto, W / 2, 820, 620 * s, filtro);
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.25 * aFoto})`; ctx.lineWidth = 1.2; ctx.strokeRect(W / 2 - 330 * s, 820 - 440 * s, 660 * s, 880 * s); ctx.restore();
  txt(ctx, "ERNST HAECKEL", W / 2, 1330, 30, 0.8 * aFoto * eSuave(pr(t, 1.6, 1.0)), { esp: 8 });
  txt(ctx, "16 · II · 1864", W / 2, 1380, 24, 0.6 * aFoto * eSuave(pr(t, pierde, 1.2)), { esp: 4, rgb: ORO });
  txt(ctx, "1864", W / 2, 300, 44, 0.75 * aFoto * eSuave(pr(t, 0.4, 1.4)), { esp: 10, peso: 500 });
};

// ══ 2 · el océano: descenso, nieve marina, rayos de luz ════════════════════════════════════════════════════════════
const oceano = (ctx: Ctx, t: number) => {
  const a = ventana(t, v[2] - 0.8, v[2] + 1.6, 1.2, 1.6);
  if (a <= 0) return;
  agua(ctx, t, a, 1);
  // a lo lejos, puntos de plancton que se encienden y apagan (lo que Haeckel fue a buscar)
  for (let i = 0; i < 40; i++) {
    const p = PART[i + 600], x = p.x * W, y = 300 + p.y * 1300 - (t - v[1]) * 20 * p.a;
    brillo(ctx, x, y, 10 + 30 * p.c, a * 0.5 * (0.5 + 0.5 * Math.sin(t * (0.6 + p.b) + i)), i % 2 ? "190,240,255" : "255,230,200");
  }
};

// ══ radiolarios (3D en GPU) ═════════════════════════════════════════════════════════════════════════════════════
const radiolario = (ctx: Ctx, t: number, t0: number, t1: number, especie: 0 | 1, y = 900, escala = 1) => {
  const a = ventana(t, t0, t1, 1.4, 1.4);
  if (a <= 0) return;
  const P = especie === 0
    ? { frecA: 7.0, frecB: 11.0, esp: 0.75, semilla: 3.1, colA: [1.0, 0.82, 0.55] as [number, number, number], colB: [0.55, 0.85, 1.0] as [number, number, number] }
    : { frecA: 5.0, frecB: 9.0, esp: 1.15, semilla: 7.7, colA: [0.6, 0.95, 1.0] as [number, number, number], colB: [1.0, 0.75, 0.95] as [number, number, number] };
  const im = pintarRadiolario(W, H, {
    crece: eIO(pr(t, t0 + 0.3, 4.2)), giro: t * 0.25 + especie, incl: 0.35 + 0.15 * Math.sin(t * 0.3), dist: lerp(4.4, 3.4, eSuave(pr(t, t0, t1 - t0))) / escala,
    a, ...P,
  });
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.drawImage(im, 0, y - H / 2, W, H); ctx.restore();
};

// ══ láminas: una lámina aparece como si se dibujara (máscara que avanza desde el centro) ══════════════════════════
let capaLam: HTMLCanvasElement | null = null;
const lamina = (ctx: Ctx, t: number, im: HTMLImageElement | undefined, t0: number, t1: number, op: { dibuja?: boolean; s0?: number; s1?: number; fx?: number; fy?: number } = {}) => {
  const a = ventana(t, t0, t1, 1.2, 1.2);
  if (!im || a <= 0) return;
  const s = lerp(op.s0 ?? 1.0, op.s1 ?? 1.08, eIO(pr(t, t0, t1 - t0)));
  if (!op.dibuja) { cubre(ctx, im, a, s, op.fx ?? 0.5, op.fy ?? 0.5, "sepia(0.3) contrast(1.12) brightness(0.72)"); return; }
  if (!capaLam) { capaLam = document.createElement("canvas"); capaLam.width = W; capaLam.height = H; }
  const c2 = capaLam.getContext("2d")!; c2.globalCompositeOperation = "source-over"; c2.clearRect(0, 0, W, H);
  cubre(c2, im, 1, s, op.fx ?? 0.5, op.fy ?? 0.5, "sepia(0.3) contrast(1.12) brightness(0.72)");
  const u = eIO(pr(t, t0, 3.4)), R = lerp(0, 1300, u);
  const mg = c2.createRadialGradient(W / 2, H / 2, Math.max(0, R - 260), W / 2, H / 2, Math.max(1, R));
  mg.addColorStop(0, "rgba(0,0,0,1)"); mg.addColorStop(1, "rgba(0,0,0,0)");
  c2.globalCompositeOperation = "destination-in"; c2.fillStyle = mg; c2.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = a; ctx.drawImage(capaLam, 0, 0); ctx.restore();
  // el borde que avanza: una línea de tinta luminosa
  if (u > 0 && u < 1) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = `rgba(${ORO},${0.25 * a * (1 - u)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, H / 2, Math.max(1, R - 130), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
};

const COLS: [number, number, number][][] = [[[1, 0.82, 0.55], [0.55, 0.85, 1]], [[0.6, 0.95, 1], [1, 0.75, 0.95]], [[1, 0.9, 0.7], [0.7, 0.8, 1]], [[0.75, 1, 0.85], [1, 0.8, 0.6]]];
// la recreación simulada de la figura de una lámina, a pantalla completa, que nace sobre el papel y gira
const cobraVida = (ctx: Ctx, t: number, t0: number, t1: number, fam: number, var_: number) => {
  const a = ventana(t, t0, t1, 1.0, 1.0);
  if (a <= 0) return;
  const im = pintarFamilia(W, H, { fam, crece: eIO(pr(t, t0, 1.6)) * 0.6 + 0.4, giro: (t - t0) * 0.45 + var_, incl: 0.35, dist: lerp(3.6, 3.1, pr(t, t0, t1 - t0)), frec: 6 + 2 * var_, semilla: 3 + var_ * 2.3 + fam, a, t, colA: COLS[(fam + var_) % 4][0], colB: COLS[(fam + var_) % 4][1] });
  // la lámina se oscurece debajo para que el ser de vidrio se lea
  ctx.save(); ctx.fillStyle = `rgba(2,6,12,${0.6 * a})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.drawImage(im, 0, 0, W, H); ctx.restore();
};

// ══ 6 · diatomea 2D: una roseta de simetría 16 que se traza sola ═════════════════════════════════════════════════
const diatomea = (ctx: Ctx, t: number, t0: number, t1: number) => {
  const a = ventana(t, t0, t1, 1.4, 1.4);
  if (a <= 0) return;
  const cx = W / 2, cy = 900, R = 400, n = 16, u = eIO(pr(t, t0 + 0.3, 5.5)), giro = t * 0.06;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(giro); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
  // contorno y anillos
  for (let k = 0; k < 4; k++) {
    const r = R * (1 - k * 0.24), w = cl(u * 4 - k);
    ctx.strokeStyle = `rgba(${RGB.crema},${0.55 * a * w})`; ctx.lineWidth = k === 0 ? 2.4 : 1.4;
    ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * w); ctx.stroke();
  }
  // costillas radiales (16) y poros en filas entre ellas
  for (let i = 0; i < n; i++) {
    const an = (i / n) * Math.PI * 2, w = cl(u * 2.2 - 0.6 - i / n * 0.6);
    ctx.strokeStyle = `rgba(${ORO},${0.7 * a * w})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(Math.cos(an) * R * 0.18, Math.sin(an) * R * 0.18); ctx.lineTo(Math.cos(an) * R * lerp(0.18, 1, w), Math.sin(an) * R * lerp(0.18, 1, w)); ctx.stroke();
    for (let f = 0; f < 9; f++) {
      const rr = R * (0.26 + f * 0.085), cnt = 2 + Math.floor(f / 2), wp = cl(u * 2.6 - 1.0 - f * 0.08);
      for (let j = 1; j <= cnt; j++) {
        const aj = an + ((j / (cnt + 1)) * (Math.PI * 2)) / n;
        ctx.fillStyle = `rgba(${CIAN},${0.5 * a * wp})`;
        ctx.beginPath(); ctx.arc(Math.cos(aj) * rr, Math.sin(aj) * rr, 2.2 + f * 0.55, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.restore();
  brillo(ctx, cx, cy, 140, 0.5 * a * u, "255,240,215");
  txt(ctx, "SIMETRÍA DE ORDEN 16", cx, cy + R + 110, 22, 0.55 * a * eSuave(pr(t, t0 + 2.5, 1.2)), { esp: 6 });
};

// ══ simulaciones 2D precalculadas (espuma, coral, physarum): cuadros a 30 fps ═════════════════════════════════════
export const SIMS: Record<string, { t0: number; t1: number; n: number; vel: number }> = {
  espuma: { t0: v[7] - 0.9, t1: v[8] + 0.2, n: 200, vel: 1.0 },
  coral: { t0: v[8] - 0.4, t1: v[9] + 0.4, n: 240, vel: 1.15 },
  physarum: { t0: v[9] - 0.4, t1: K.trip[0] + 0.8, n: 240, vel: 1.0 },
};
export const cuadrosSim = (t: number) => {
  const out: Record<string, string> = {};
  for (const [n, s] of Object.entries(SIMS)) {
    if (t < s.t0 - 0.1 || t > s.t1 + 0.1) continue;
    const i = Math.max(0, Math.min(s.n - 1, Math.floor((t - s.t0) * 30 * s.vel)));
    out[n] = `kunst/sim/${n}/${String(i + 1).padStart(4, "0")}.jpg`;
  }
  return out;
};
const sim = (ctx: Ctx, t: number, m: Medios, n: string) => {
  const s = SIMS[n], a = ventana(t, s.t0, s.t1, 1.2, 1.2), im = m[`sim-${n}`];
  if (!im || a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a;
  const k = lerp(1.0, 1.06, pr(t, s.t0, s.t1 - s.t0));
  ctx.drawImage(im, W / 2 - (W * k) / 2, H / 2 - (H * k) / 2, W * k, H * k); ctx.restore();
};

// ══ el microcosmos vivo: el mismo motor del capítulo final de «La frontera» (campo oscuro, organismos procedurales
// inspirados en Haeckel, profundidad de campo real), rendido en vertical para este reel. Nace de un grabado de
// radiolarios de 1862 (que se apaga debajo, con mezcla aditiva) y se funde hacia la lámina del Challenger ══════════
export const MICRO = { a0: K.trip[0] - 1.4, a1: K.trip[1] + 1.4, f0: 100, n: 521 };
export const cuadroMicro = (t: number) => {
  if (t < MICRO.a0 - 0.1 || t > MICRO.a1 + 0.1) return null;
  const i = Math.max(0, Math.min(MICRO.n - 1, Math.floor((t - MICRO.a0) * 30 * 0.92)));
  return `kunst/sim/micro/${String(MICRO.f0 + i).padStart(4, "0")}.jpg`;
};
const microcosmos = (ctx: Ctx, t: number, m: Medios) => {
  const { a0, a1 } = MICRO;
  if (t < a0 || t > a1) return;
  const a = ventana(t, a0, a1, 1.4, 1.6);
  // el grabado de 1862, con la cámara entrando: los organismos aparecen sobre él y lo reemplazan
  plano(ctx, t, m, { im: "lamina-spumellaria-neg", t0: a0, t1: a0 + 3.4, de: [0.5, 0.42, 1.4], a: [0.5, 0.42, 2.1], luz: 0.3 }, 1.2, 2.0);
  const im = m.micro;
  if (im) {
    const k = lerp(1.0, 1.06, pr(t, a0, a1 - a0));
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = a * eSuave(pr(t, a0 + 0.8, 2.8));
    ctx.drawImage(im, W / 2 - (W * k) / 2, H / 2 - (H * k) / 2, W * k, H * k); ctx.restore();
  }
  txt(ctx, "RECREACIÓN  ·  MICROCOSMOS DE CAMPO OSCURO INSPIRADO EN SUS LÁMINAS", W / 2, 230, 18, 0.5 * ventana(t, a0 + 3.0, a1 - 1.4, 1.0, 1.0), { esp: 3 });
};

// ══ 13 · la medusa (Desmonema, como en la lámina 8): campana de vidrio en GPU; brazos orales dorados con volantes y
// tentáculos largos que flotan, proyectados con la misma cámara; los de atrás, desenfocados (profundidad de campo) ═══
import { pintarCampana, proyectar } from "./kunst/medusa";
const medusa = (ctx: Ctx, t: number, t0: number, t1: number) => {
  const a = ventana(t, t0, t1, 2.2, 2.4);
  if (a <= 0) return;
  const u = pr(t, t0, t1 - t0), tt = t - t0;
  const fase = (tt / 2.6) * Math.PI * 2, pulso = Math.pow(0.5 + 0.5 * Math.sin(fase), 1.6);
  const cam = { giro: 0.4 + tt * 0.08, incl: 0.32 - 0.12 * eIO(u), dist: lerp(5.6, 4.4, eIO(u)) };
  const cx = W / 2 + 20 * Math.sin(t * 0.2), cy = lerp(700, 560, eIO(u)) - 40 * pulso;
  const P = (x: number, y: number, z: number) => { const q = proyectar(x, y, z, cam, H); return [cx + q[0], cy + q[1], q[2]] as const; };
  const zc = proyectar(0, 0, 0, cam, H)[2];
  const k = 1 / 0.62 * (H / 2);                                                   // pixeles por unidad a distancia 1
  const ancho = (1 - 0.12 * pulso);
  type Linea = { pts: (readonly [number, number, number])[]; w: number[]; col: string; al: number; atras: boolean; cinta: boolean };
  const lineas: Linea[] = [];
  // tentáculos: 72 hilos desde el borde; ondas que bajan, giro helicoidal lento, deriva con el agua
  for (let i = 0; i < 72; i++) {
    const p0 = PART[i + 50], th = (i / 72) * Math.PI * 2, L = 2.6 + 1.6 * p0.a;
    const pts: (readonly [number, number, number])[] = [], w: number[] = [];
    for (let j = 0; j <= 40; j++) {
      const s = j / 40, ola = (Math.sin(s * 5 - tt * 1.5 + p0.b * 6) * (0.08 + 0.35 * s) + Math.sin(s * 14 - tt * 2.6 + p0.c * 9) * 0.05 * s);
      const hel = s * 2.0 + tt * 0.4 + p0.c * 6, r = ancho * (0.98 - 0.25 * s);
      const x = Math.cos(th) * r + Math.cos(th + hel) * ola + 0.25 * s * s * Math.sin(tt * 0.3 + p0.a * 6);
      const z = Math.sin(th) * r + Math.sin(th + hel) * ola;
      const y = -0.18 - s * L + 0.35 * pulso * s * s;
      pts.push(P(x, y, z)); w.push(1);
    }
    lineas.push({ pts, w, col: i % 5 === 0 ? "255,214,150" : i % 3 === 0 ? "255,170,190" : "200,225,255", al: 0.32, atras: Math.sin(th - cam.giro) > 0, cinta: false });
  }
  // brazos orales: cuatro cintas largas con volantes (el ancho ondula rápido), doradas
  for (let j = 0; j < 4; j++) {
    const th = j * Math.PI / 2 + 0.6, pts: (readonly [number, number, number])[] = [], w: number[] = [];
    for (let i = 0; i <= 60; i++) {
      const s = i / 60, ola = Math.sin(s * 6 - tt * 1.2 + j) * 0.18 * s + Math.sin(s * 2.5 - tt * 0.6 + j * 2) * 0.12 * s;
      const x = Math.cos(th) * (0.28 + ola + 0.25 * s), z = Math.sin(th) * (0.28 + ola + 0.25 * s) + 0.08 * Math.sin(tt * 0.5 + j);
      const y = -0.1 - s * 3.6 + 0.3 * pulso * s;
      pts.push(P(x, y, z));
      w.push((0.16 * (1 - 0.55 * s)) * (1 + 0.4 * Math.sin(s * 53 - tt * 2.6 + j) + 0.25 * Math.sin(s * 121 - tt * 4.1 + j * 2.3)));   // volantes
    }
    lineas.push({ pts, w, col: "255,196,120", al: 0.5, atras: Math.sin(th - cam.giro) > 0, cinta: true });
  }
  const dibujaLinea = (L0: Linea) => {
    if (L0.cinta) {
      // cinta: polígono entre los dos bordes (normal en pantalla), relleno translúcido y borde brillante
      const izq: [number, number][] = [], der: [number, number][] = [];
      for (let i = 0; i < L0.pts.length; i++) {
        const [x, y, zz] = L0.pts[i], [x2, y2] = L0.pts[Math.min(L0.pts.length - 1, i + 1)], [x1, y1] = L0.pts[Math.max(0, i - 1)];
        const dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy) || 1, wpx = (L0.w[i] * k) / zz;
        izq.push([x - (dy / n) * wpx, y + (dx / n) * wpx]); der.push([x + (dy / n) * wpx, y - (dx / n) * wpx]);
      }
      ctx.beginPath(); izq.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); for (let i = der.length - 1; i >= 0; i--) ctx.lineTo(der[i][0], der[i][1]); ctx.closePath();
      ctx.fillStyle = `rgba(${L0.col},${0.22 * a * L0.al})`; ctx.fill();
      ctx.strokeStyle = `rgba(255,230,190,${0.5 * a * L0.al})`; ctx.lineWidth = 1.2; ctx.stroke();
    } else {
      ctx.beginPath(); L0.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = `rgba(${L0.col},${L0.al * a})`; ctx.lineWidth = 1.3; ctx.stroke();
    }
  };
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineJoin = "round";
  // primero lo de atrás, desenfocado; después la campana; después lo de adelante, nítido
  (ctx as unknown as { filter: string }).filter = "blur(2.5px)";
  lineas.filter((l) => l.atras).forEach(dibujaLinea);
  (ctx as unknown as { filter: string }).filter = "none";
  const im = pintarCampana(W, H, { ...cam, pulso, a, t });
  ctx.drawImage(im, cx - W / 2, cy - H / 2, W, H);
  lineas.filter((l) => !l.atras).forEach(dibujaLinea);
  ctx.restore();
  void zc;
  // puntos de luz del borde que se encienden en ola con el pulso
  for (let i = 0; i < 32; i++) {
    const th = (i / 32) * Math.PI * 2, q = P(Math.cos(th) * ancho, -0.18, Math.sin(th) * ancho), on = 0.5 + 0.5 * Math.sin(fase - th * 2);
    brillo(ctx, q[0], q[1], 14, 0.6 * a * on, i % 2 ? "255,220,160" : "190,230,255");
  }
};

// ══ cierre: los seres alrededor, la medusa sube a la luz ═══════════════════════════════════════════════════════════
const constelacion = (ctx: Ctx, t: number) => {
  const a = ventana(t, v[13] - 0.6, RECAP.simetria + 0.8, 2.0, 1.6);
  if (a <= 0) return;
  const g = ctx.createRadialGradient(W / 2, 300, 0, W / 2, 300, 1100);
  g.addColorStop(0, `rgba(120,190,215,${0.18 * a})`); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
};

// ══ título y firma (como en los otros reels: logo; después título y reflexión) ═══════════════════════════════════
const titulo = (ctx: Ctx, t: number, m: Medios) => {
  if (t < K.logo - 1.4) return;
  ctx.fillStyle = `rgba(0,0,0,${eSuave(pr(t, K.logo - 1.4, 1.4))})`; ctx.fillRect(0, 0, W, H);   // la acuarela se funde a negro
  const fin = 1 - eSuave(pr(t, K.total - 1.4, 1.3));
  if (m.logo) {
    const a = eSuave(pr(t, K.logo + 0.2, 1.6)) * fin, w = 520, h = (m.logo.height / m.logo.width) * w, y = H / 2;
    brillo(ctx, W / 2, y, 420, 0.1 * a, ORO);
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(m.logo, W / 2 - w / 2, y - h / 2, w, h); ctx.restore();
  }
};

// ══ subtítulos ═════════════════════════════════════════════════════════════════════════════════════════════════════
const SUB_Y = 1600, SUB_ANCHO = 920, SUB_TAM = 50;
const lineas = (ctx: Ctx, pal: string[]) => {
  const out: number[][] = [[]]; let ancho = 0; const esp = ctx.measureText(" ").width;
  pal.forEach((p, i) => { const w = ctx.measureText(p).width; if (ancho > 0 && ancho + esp + w > SUB_ANCHO) { out.push([]); ancho = 0; } out[out.length - 1].push(i); ancho += (ancho > 0 ? esp : 0) + w; });
  if (out.length === 2 && out[1].length === 1 && out[0].length > 2) out[1].unshift(out[0].pop()!);
  return out;
};
// ══ apuntador para grabar la voz (versión de trabajo, como en Existir): la frase aparece antes en gris, cuenta 3‑2‑1
// y cada palabra se enciende cuando debe decirse; abajo, en pequeño, la frase que viene; arriba, el tiempo ══════════
const apuntador = (ctx: Ctx, t: number) => {
  const ANT = 2.5, Y = 1560;
  ctx.save(); ctx.textBaseline = "middle";
  const mm = Math.floor(t / 60), ss = t - mm * 60;
  ctx.font = `500 34px ${SANS}`; ctx.textAlign = "left"; ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 10;
  ctx.fillStyle = `rgba(${RGB.crema},0.85)`; ctx.fillText(`${mm}:${ss.toFixed(1).padStart(4, "0")}`, 48, 70);
  const aviso = (i: number) => i === 0 ? Math.min(ANT, v[0]) : Math.max(0.4, Math.min(ANT, v[i] - (v[i - 1] + V[i - 1].fin) - 0.15));
  let k = -1;
  for (let i = 0; i < V.length; i++) if (t >= v[i] - aviso(i)) k = i;
  if (k >= 0 && t > v[k] + V[k].fin + 1.2) k = -1;
  ctx.fillStyle = "rgba(0,0,0,0.66)"; ctx.beginPath(); ctx.roundRect(36, Y - 250, W - 72, 560, 28); ctx.fill();
  if (k >= 0) {
    const t0 = v[k], pal = V[k].texto.split(/\s+/), tam = 50;
    ctx.font = `500 ${tam}px ${SANS}`; (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.5px";
    const L = lineas(ctx, pal), esp = ctx.measureText(" ").width;
    L.forEach((ids, li) => {
      const ancho = ids.reduce((a, i, j) => a + ctx.measureText(pal[i]).width + (j ? esp : 0), 0);
      let x = W / 2 - ancho / 2; const y = Y + 20 + (li - (L.length - 1) / 2) * tam * 1.36;
      for (const i of ids) {
        const dicha = t >= t0 + (V[k].palabras[i]?.[1] ?? 0) - 0.04;
        ctx.textAlign = "left"; ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = 12;
        ctx.fillStyle = dicha ? "rgba(255,214,120,1)" : `rgba(${RGB.crema},0.6)`; ctx.fillText(pal[i], x, y);
        x += ctx.measureText(pal[i]).width + esp;
      }
    });
    const falta = t0 - t, yc = Y - 200; ctx.textAlign = "center"; ctx.shadowBlur = 10;
    if (falta > 0) {
      ctx.font = `600 40px ${SANS}`; ctx.fillStyle = `rgba(${RGB.crema},0.9)`; ctx.fillText(Math.ceil(falta) <= 3 ? String(Math.ceil(falta)) : "·", W / 2, yc);
      ctx.fillStyle = "rgba(255,214,120,0.9)"; ctx.fillRect(W / 2 - 160, yc + 34, 320 * cl(1 - falta / aviso(k)), 5);
    } else if (falta > -0.7) { ctx.font = `700 36px ${SANS}`; ctx.fillStyle = "rgba(255,214,120,1)"; ctx.fillText("▶  AHORA", W / 2, yc); }
    if (k + 1 < V.length) {
      const sig = V[k + 1].texto, corto = sig.length > 52 ? sig.slice(0, 49) + "…" : sig;
      ctx.font = `400 28px ${SANS}`; ctx.fillStyle = `rgba(${RGB.crema},0.45)`; ctx.textAlign = "center";
      ctx.fillText(`luego (${(v[k + 1] / 60) | 0}:${(v[k + 1] % 60).toFixed(1).padStart(4, "0")}): ${corto}`, W / 2, Y + 270);
    }
  }
  ctx.restore();
};

const subtitulos = (ctx: Ctx, t: number) => {
  for (let k = 0; k < V.length; k++) {
    const t0 = v[k], t1 = t0 + V[k].fin, sig = k + 1 < V.length ? v[k + 1] : Infinity, sale = Math.min(t1 + 0.7, sig - 0.05);
    if (t < t0 - 0.05 || t > sale) continue;
    const salida = 1 - eSuave(pr(t, sale - 0.35, 0.35)), pal = V[k].texto.split(/\s+/);
    ctx.save(); ctx.font = `400 ${SUB_TAM}px ${SANS}`; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.5px";
    const L = lineas(ctx, pal), esp = ctx.measureText(" ").width;
    L.forEach((ids, li) => {
      const ancho = ids.reduce((acc, i, j) => acc + ctx.measureText(pal[i]).width + (j ? esp : 0), 0);
      let x = W / 2 - ancho / 2; const y = SUB_Y + (li - (L.length - 1) / 2) * SUB_TAM * 1.32;
      for (const i of ids) {
        const tp = t0 + (V[k].palabras[i]?.[1] ?? 0) - 0.06, a = eSuave(pr(t, tp, 0.28)) * salida;
        if (a > 0) {
          const yy = y + (1 - eOut(pr(t, tp, 0.5))) * 8, a2 = 1 - Math.sqrt(1 - Math.min(1, a));
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

// velo oscuro arriba para que los rótulos se lean sobre el papel claro de las láminas
const velo = (ctx: Ctx, a: number) => { if (a <= 0) return; const g = ctx.createLinearGradient(0, 0, 0, 480); g.addColorStop(0, `rgba(0,0,0,${0.7 * a})`); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 480); };

// ══ los planos de la obra original (cámara macro sobre el papel) ═════════════════════════════════════════════════
const PLANOS: Plano[] = [
  // «Se llamaba Ernst Haeckel…»: en su escritorio (1914); «…los seres más pequeños del océano»: Die Radiolarien (1862)
  { im: "foto-haeckel-1914", t0: v[1] - 0.6, t1: v[1] + 3.6, de: [0.66, 0.45, 2.9], a: [0.6, 0.42, 3.4], luz: 0.6 },
  { im: "radiolarien-1", t0: v[1] + 3.0, t1: v[2] + 0.6, de: [0.5, 0.42, 1.4], a: [0.5, 0.4, 3.2] },
  // «Los dibujó durante décadas, con una paciencia casi imposible»: macro extremo sobre cinco láminas
  { im: "radiolarien-2", t0: v[3] - 0.5, t1: v[3] + 1.3, de: [0.5, 0.44, 3.4], a: [0.52, 0.44, 4.4] },
  { im: "challenger-4", t0: v[3] + 0.9, t1: v[3] + 2.4, de: [0.48, 0.4, 3.0], a: [0.5, 0.42, 3.9] },
  { im: "kdn-acanthometra", t0: v[3] + 2.0, t1: v[3] + 3.4, de: [0.46, 0.44, 2.6], a: [0.52, 0.46, 3.4] },
  { im: "kdn-spyroidea", t0: v[3] + 3.0, t1: v[3] + 4.4, de: [0.5, 0.22, 3.2], a: [0.5, 0.28, 3.9] },
  { im: "kdn-hexactinellae", t0: v[3] + 4.0, t1: v[4] + 0.2, de: [0.42, 0.3, 2.8], a: [0.46, 0.3, 3.6] },
  // «Medusas, diatomeas y corales…»
  { im: "kdn-cubomedusae", t0: v[5] - 0.6, t1: v[5] + 1.4, de: [0.5, 0.26, 2.2], a: [0.5, 0.3, 2.8] },
  { im: "kdn-leptomedusae", t0: v[5] + 1.0, t1: v[5] + 2.6, de: [0.62, 0.34, 2.4], a: [0.58, 0.36, 3.0] },
  { im: "kdn-desmidiea", t0: v[5] + 2.2, t1: v[5] + 3.8, de: [0.5, 0.5, 2.4], a: [0.5, 0.5, 3.2] },
  { im: "kdn-actiniae", t0: v[5] + 3.4, t1: v[5] + 5.0, de: [0.45, 0.5, 1.8], a: [0.5, 0.48, 2.4] },
  // «Pero en una de sus láminas hay una medusa con nombre de mujer» / «No era la primera…»
  { im: "kdn-discomedusae-88", t0: v[12] - 0.4, t1: v[12] + 3.2, de: [0.5, 0.45, 2.0], a: [0.5, 0.45, 2.7] },
  { im: "kdn-leptomedusae", t0: v[12] + 2.8, t1: v[12] + 6.4, de: [0.62, 0.3, 2.4], a: [0.6, 0.36, 3.0] },
  // el final: «Am Ende der Welt» (En el fin del mundo), acuarela suya de Ceilán
  { im: "acuarela-3", t0: v[14] - 0.6, t1: K.logo + 0.4, de: [0.5, 0.55, 1.25], a: [0.5, 0.45, 1.5], luz: 0.4 },
];

// ══ «…leyes simples: simetría, crecimiento y economía de materia»: cada palabra con la simulación que la mostró ════
const palabraEn = (k: number, inicio: string) => v[k] + (V[k].palabras.find((p) => p[0].toLowerCase().startsWith(inicio))?.[1] ?? 0);
export const RECAP = { simetria: palabraEn(13, "simetr"), crecimiento: palabraEn(13, "crecim"), economia: palabraEn(13, "econom") };
const recapitulacion = (ctx: Ctx, t: number, m: Medios) => {
  const { simetria, crecimiento, economia } = RECAP;
  diatomea(ctx, t, simetria - 0.6, crecimiento + 0.6);
  for (const [n, a0, a1] of [["coral", crecimiento - 0.5, economia + 0.6], ["espuma", economia - 0.5, v[14] + 0.2]] as const) {
    const im = m[`fija-${n}`], a = ventana(t, a0 - 0.4, a1, 1.4, 1.0);
    if (!im || a <= 0) continue;
    const k = lerp(1.0, 1.1, pr(t, a0, a1 - a0));
    // sin quemar: más tenue y con mezcla normal (el acabado ya le suma brillo)
    ctx.save(); ctx.globalAlpha = a * 0.85; (ctx as unknown as { filter: string }).filter = "brightness(0.62)";
    ctx.drawImage(im, W / 2 - (W * k) / 2, H / 2 - (H * k) / 2, W * k, H * k); ctx.restore();
  }
  for (const [txt0, a0, a1] of [["SIMETRÍA", simetria - 0.3, crecimiento], ["CRECIMIENTO", crecimiento - 0.3, economia], ["ECONOMÍA DE MATERIA", economia - 0.3, v[14]]] as const)
    txt(ctx, txt0, W / 2, 300, 30, 0.8 * ventana(t, a0, a1, 0.5, 0.5), { esp: 10, rgb: ORO });
};

// ══ cuadro completo ════════════════════════════════════════════════════════════════════════════════════════════════
export const dibujarKunst = (ctx: Ctx, t: number, frame: number, m: Medios, post = true, subs = true) => {
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  apertura(ctx, t, m);
  oceano(ctx, t);
  planos(ctx, t, m, PLANOS);
  radiolario(ctx, t, v[2] - 0.6, v[3] + 0.9, 0);                                                     // seres de vidrio
  ([["lamina-stephoidea", 2], ["lamina-cyrtoidea", 1], ["lamina-phaeodaria", 3]] as const).forEach(([n, fam], i) => {
    const a0 = v[4] - 0.3 + i * 3.3;
    lamina(ctx, t, m[n], a0, a0 + 2.6, { s0: 1.0, s1: 1.18, fy: 0.45 });
    cobraVida(ctx, t, a0 + 1.4, a0 + 3.9, fam, i);
  });
  { const aL = ventana(t, v[4] + 1.0, v[5] - 0.4, 1.0, 1.0); velo(ctx, aL); txt(ctx, "KUNSTFORMEN DER NATUR", W / 2, 230, 34, 0.9 * aL, { fam: SANS, peso: 400, esp: 8 }); txt(ctx, "1899 – 1904  ·  100 LÁMINAS", W / 2, 285, 22, 0.7 * aL, { esp: 5, rgb: ORO }); }
  lamina(ctx, t, m["lamina-diatomea"], v[5] + 4.4, v[5] + 7.8, { s0: 1.0, s1: 1.25 });               // simetría
  diatomea(ctx, t, v[5] + 6.4, v[7] - 0.2);                                                           // … y reglas simples
  sim(ctx, t, m, "espuma");                                                                           // espuma → esqueleto
  radiolario(ctx, t, v[8] - 1.6, v[8] + 0.6, 1);
  sim(ctx, t, m, "coral");                                                                            // Gray-Scott
  sim(ctx, t, m, "physarum");                                                                         // algo que parece vivo
  microcosmos(ctx, t, m);                                                                             // el microcosmos vivo (motor del documental)
  lamina(ctx, t, m.clathrocanium, K.trip[1] - 0.9, v[10] + 3.6, { s0: 1.0, s1: 1.1 });               // de la lámina…
  lamina(ctx, t, m.binet, v[10] + 2.4, v[11] - 0.2, { s0: 1.0, s1: 1.18, fx: 0.48, fy: 0.5 });        // … a la puerta de París
  { const aB = ventana(t, v[10] + 3.4, v[11] - 0.4, 1.0, 1.0); velo(ctx, aB); txt(ctx, "PORTE MONUMENTALE  ·  PARÍS 1900", W / 2, 230, 26, 0.85 * aB, { esp: 6 }); txt(ctx, "RENÉ BINET, INSPIRADA EN UN RADIOLARIO", W / 2, 278, 20, 0.6 * aB, { esp: 3, rgb: ORO }); }
  lamina(ctx, t, m["lamina-discomedusae"], v[11] - 0.6, v[12] + 1.6, { s0: 1.0, s1: 1.3, fy: 0.42 }); // la medusa con nombre de mujer
  { const aD = ventana(t, v[11] + 2.0, v[12] + 0.8, 1.0, 1.0); velo(ctx, aD); txt(ctx, "DESMONEMA ANNASETHE", W / 2, 230, 28, 0.9 * aD, { fam: SANS, peso: 300, esp: 6 }); txt(ctx, "LÁMINA 8  ·  DISCOMEDUSAE", W / 2, 278, 20, 0.6 * aD, { esp: 4, rgb: ORO }); }
  { const aA = ventana(t, v[12] + 5.2, RECAP.simetria + 0.8, 2.0, 1.8); if (aA > 0) agua(ctx, t, aA * 0.9, 0.8); }
  constelacion(ctx, t);
  medusa(ctx, t, v[12] + 5.6, RECAP.simetria + 0.8);
  recapitulacion(ctx, t, m);
  titulo(ctx, t, m);
  if (post) {
    const pp = postProceso(ctx.canvas, W, H, {
      px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.95, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
      curva: 0, esq: 0.03, impacto: 0, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
    });
    if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
  }
  if (LOCUCION) apuntador(ctx, t); else if (subs) subtitulos(ctx, t);
};
