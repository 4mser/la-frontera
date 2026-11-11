// CAPÍTULO III · «La medida de lo irregular» (fractales/GUION-capitulo-3-la-medida.md, v3). Richardson (archive: the
// 1919 watercolour of his ambulance convoy, the frontispiece of his 1922 book), the Spain–Portugal border measured
// with three dividers at once over NASA's Blue Marble, a magnifier on a meander, the 49th parallel that does not grow,
// the log-log law (slope m, D = 1 − m), Richardson's lines, the rivers, the range where the law holds, and the river
// network of the peninsula drawing itself. All borders are real data (Natural Earth 10m), measured by
// herramientas/fronteras_cap3.py; the satellite crops are reprojected to the same km by herramientas/tierra_cap3.py.
import K from "./cap3.json";
import { LIMPIO as SIN_TEXTO_TRAILER } from "./limpio";
import DAT from "./cap3_datos.json";
import TIE from "./cap3_tierra.json";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { RGB, SANS, MONO, cl, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
type P = [number, number];
type Fotos = Record<string, HTMLImageElement>;
const AZUL = "150,190,255", AMBAR = "255,190,120", AGUA = "120,180,255";
const KT = Math.min(1, W / 1500);
const LIMPIO = (FORMATO as { limpio?: boolean }).limpio === true;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: LIMPIO ? 0 : 0.05, scan: LIMPIO ? 0 : 0.18, ruido: LIMPIO ? 0 : 0.5, grade: 1.8 };
const V = K.voz;
const ES = DAT.espana_portugal, P49 = DAT.paralelo_49;

// ─── helpers (as in chapters I and II) ──────────────────────────────────────────────────────────────────────────
const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number } = {}) => {
  if (SIN_TEXTO_TRAILER && color !== "#fff") return;
  ctx.font = `${op.peso ?? 500} ${tam}px "${op.fam ?? MONO}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 3}px`;
  ctx.fillStyle = color; ctx.textAlign = op.alin ?? "left";
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
};
const ventana = (t: number, a: number, b: number, d = 0.6) => Math.min(eSuave(pr(t, a, d)), 1 - eSuave(pr(t, b - d, d)));
const luz = (ctx: Ctx, x: number, y: number, r: number, a: number, col = AMBAR) => {
  if (a <= 0 || r < 0.5) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.22, `rgba(${col},${0.6 * a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
};
const trazo = (ctx: Ctx, pts: P[], col: string, a: number, w = 2) => {
  if (a <= 0.01 || pts.length < 2) return;
  ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
  const camino = () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
  ctx.globalCompositeOperation = "lighter";
  for (const [lw, o] of [[w * 7, 0.07], [w * 2.6, 0.2]] as const) { ctx.strokeStyle = `rgba(${col},${o * a})`; ctx.lineWidth = lw; camino(); ctx.stroke(); }
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(${col},${0.95 * a})`; ctx.lineWidth = w; camino(); ctx.stroke();
  ctx.restore();
};
const banda = (ctx: Ctx, a: number) => {
  const g = ctx.createLinearGradient(0, H * 0.68, 0, H);
  g.addColorStop(0, "rgba(2,3,6,0)"); g.addColorStop(1, `rgba(2,3,6,${0.8 * a})`);
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.68, W, H * 0.32);
};
const rotulo = (ctx: Ctx, nombre: string, linea: string, a: number, x = 84, y = H - 128, alin: CanvasTextAlign = "left") => {
  if (a <= 0.01) return;
  texto(ctx, nombre, x, y, 26 * KT + 6, `rgba(${RGB.crema},${0.92 * a})`, { fam: SANS, peso: 600, esp: 3, alin });
  if (linea) texto(ctx, linea, x, y + 36, 16 * KT + 4, `rgba(${AMBAR},${0.8 * a})`, { esp: 5, alin });
};
const nota = (ctx: Ctx, s: string, a: number, x = W / 2, y = H - 40) => {
  if (a > 0.01) texto(ctx, s, x, y, 13 * KT + 4, `rgba(${RGB.crema},${0.55 * a})`, { alin: "center", esp: 4 });
};
const km = (v: number) => `${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} KM`;
const terminos = (ctx: Ctx, t: number) => {
  for (const [term, linea, t0, t1] of K.terminos as [string, string, number, number][]) {
    const a = ventana(t, t0, t1, 0.5);
    if (a <= 0.01) continue;
    const bd = ctx.createLinearGradient(0, 0, 0, H * 0.32);
    bd.addColorStop(0, `rgba(2,3,6,${0.85 * a})`); bd.addColorStop(0.7, `rgba(2,3,6,${0.55 * a})`); bd.addColorStop(1, "rgba(2,3,6,0)");
    ctx.fillStyle = bd; ctx.fillRect(0, 0, W, H * 0.32);
    const tam = (term.length > 22 ? 44 : term.length > 14 ? 54 : 80) * KT + 8, esp = lerp(36, term.length > 14 ? 10 : 22, eOut(pr(t, t0, 1.2)));
    const y = H * 0.155;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(14px)";
    texto(ctx, term, W / 2 + esp / 2, y, tam, `rgba(${RGB.crema},${0.4 * a})`, { fam: SANS, peso: 600, alin: "center", esp });
    ctx.restore();
    texto(ctx, term, W / 2 + esp / 2, y, tam, `rgba(${RGB.crema},${0.97 * a})`, { fam: SANS, peso: 600, alin: "center", esp });
    const L = eOut(pr(t, t0 + 0.2, 0.9)) * W * 0.22;
    ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.85 * a})`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(W / 2 - L, y + 30); ctx.lineTo(W / 2 + L, y + 30); ctx.stroke(); ctx.restore();
    if (linea) texto(ctx, linea, W / 2 + 3, y + 66, 18 * KT + 4, `rgba(${AMBAR},${0.85 * a * eSuave(pr(t, t0 + 0.6, 0.6))})`, { alin: "center", esp: 6 });
  }
};
const retrato = (ctx: Ctx, img: HTMLImageElement | undefined, x: number, a: number, nombre: string, anos: string, y = H * 0.2, h = H * 0.5) => {
  if (!img || a <= 0.01) return;
  const w = (h * img.width) / img.height;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(2,3,6,0.85)"; ctx.fillRect(x - w / 2 - 14, y - 14, w + 28, h + 28);
  ctx.filter = "sepia(0.35) contrast(1.05) brightness(0.95)";
  ctx.drawImage(img, x - w / 2, y, w, h);
  ctx.filter = "none";
  ctx.strokeStyle = `rgba(${RGB.crema},0.35)`; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2 - 14, y - 14, w + 28, h + 28);
  ctx.restore();
  texto(ctx, nombre, x, y + h + 62, 26 * KT + 6, `rgba(${RGB.crema},${0.92 * a})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
  texto(ctx, anos, x, y + h + 98, 16 * KT + 4, `rgba(${AMBAR},${0.85 * a})`, { alin: "center", esp: 5 });
};
// a full-frame photograph, slowly pushed in (Ken Burns), graded to the film
const foto = (ctx: Ctx, img: HTMLImageElement | undefined, a: number, z = 1, fx = 0.5, fy = 0.5, filtro = "") => {
  if (!img || a <= 0.01) return;
  const s = Math.max(W / img.width, H / img.height) * z;
  ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingQuality = "high"; if (filtro) ctx.filter = filtro;
  ctx.drawImage(img, W / 2 - fx * img.width * s, H / 2 - fy * img.height * s, img.width * s, img.height * s);
  ctx.restore();
};

// ─── maps: km in a local projection → pixels; the satellite under them ──────────────────────────────────────────
type Vista = { cx: number; cy: number; s: number };   // centre (km) and pixels per km
const px = (v: Vista, p: number[]): P => [W / 2 + (p[0] - v.cx) * v.s, H / 2 - (p[1] - v.cy) * v.s];
const lerpV = (a: Vista, b: Vista, u: number): Vista => ({ cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), u)) });
// the Blue Marble crop of a region, placed by its km bounds; graded dark, so the light of the borders leads
const tierra = (ctx: Ctx, img: HTMLImageElement | undefined, region: keyof typeof TIE, v: Vista, a: number, brillo = 0.55) => {
  if (!img || a <= 0.01) return;
  const b = TIE[region], p0 = px(v, [b.x0, b.y1]), p1 = px(v, [b.x1, b.y0]);
  ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingQuality = "high";
  ctx.filter = `saturate(0.7) brightness(${brillo}) contrast(1.15)`;
  ctx.drawImage(img, p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]);
  ctx.restore();
};
// a graticule: meridians and parallels every degree, faint, with small labels at the edges
const reticula = (ctx: Ctx, v: Vista, origen: number[], a: number, paso = 1) => {
  if (a <= 0.01) return;
  const [lon0, lat0] = origen, R = 6371, k = Math.cos((lat0 * Math.PI) / 180);
  const kmLon = (R * Math.PI) / 180 * k, kmLat = (R * Math.PI) / 180;
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.09 * a})`; ctx.lineWidth = 1;
  for (let lon = Math.floor(lon0 - 40); lon <= lon0 + 40; lon += paso) {
    const x = px(v, [(lon - lon0) * kmLon, 0])[0];
    if (x < -10 || x > W + 10) continue;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    if (lon % (paso * 2) === 0) texto(ctx, `${Math.abs(lon)}°${lon < 0 ? "O" : "E"}`, x + 5, 22, 11 * KT + 3, `rgba(${RGB.crema},${0.35 * a})`, { esp: 2 });
  }
  for (let lat = Math.floor(lat0 - 30); lat <= lat0 + 30; lat += paso) {
    const y = px(v, [0, (lat - lat0) * kmLat])[1];
    if (y < -10 || y > H + 10) continue;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    if (lat % (paso * 2) === 0) texto(ctx, `${lat}°N`, 8, y - 5, 11 * KT + 3, `rgba(${RGB.crema},${0.35 * a})`, { esp: 2 });
  }
  ctx.restore();
};
const linea = (ctx: Ctx, v: Vista, pts: number[][], a: number, col = RGB.crema, w = 2.2, hasta = 1) => {
  if (a <= 0.01 || hasta <= 0) return;
  const q = pts.map((p) => px(v, p));
  const n = Math.max(2, Math.ceil(q.length * hasta));
  trazo(ctx, q.slice(0, n), col, a, w);
};

// a measured walk drawing itself: every step is a straight segment that grows from the last point to the next, and
// every point lights up with a ring when the step lands. f in [0, 1] is the fraction of all the steps.
type Caminata = number[][][];
const camina = (ctx: Ctx, v: Vista, cam: Caminata, f: number, col: string, a: number, _L = 0, w = 2, anillos = true): P | null => {
  const tramos = cam.map((piece) => piece.length - 1), total = tramos.reduce((s2, n) => s2 + n, 0);
  let k = f * total, punta: P | null = null;
  for (let j = 0; j < cam.length; j++) {
    const n = tramos[j], hechos = Math.min(n, Math.max(0, k)), q = cam[j].map((p) => px(v, p));
    const ent = Math.floor(hechos), u = hechos - ent;
    const pts = q.slice(0, ent + 1);
    if (u > 0 && ent < n) {
      const A = q[ent], B = q[ent + 1], T: P = [lerp(A[0], B[0], eOut(u)), lerp(A[1], B[1], eOut(u))];
      pts.push(T); punta = T;
    }
    if (pts.length >= 2) trazo(ctx, pts, col, a * 0.92, w);
    for (let i = 0; i <= ent; i++) {
      const p = q[i], edad = hechos - i;          // in steps since this point landed
      ctx.fillStyle = `rgba(${col},${0.95 * a})`; ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, Math.PI * 2); ctx.fill();
      if (anillos && edad < 1.2 && i > 0) {
        const e = edad / 1.2;
        ctx.save(); ctx.strokeStyle = `rgba(${col},${0.8 * a * (1 - e)})`; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(p[0], p[1], 4 + 16 * e, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        luz(ctx, p[0], p[1], 14, a * (1 - e), col);
      }
    }
    k -= n;
  }
  return punta;
};

// ─── 0 · title: the dividers walk the real border over the Earth; the camera pulls back; the title ──────────────
const VIB: Vista = { cx: -40, cy: 20, s: (H * 0.82) / 1000 };
const VESB: Vista = (() => {
  const all = ES.piezas.flat() as number[][];
  const ys = all.map((p) => p[1]), xs = all.map((p) => p[0]);
  return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2, s: (H * 0.86) / (Math.max(...ys) - Math.min(...ys)) };
})();
const CAM10 = ES.medidas["10"].caminatas[1] as number[][];
const titulo = (ctx: Ctx, t: number, f: Fotos) => {
  if (t > K.retrato + 0.5) return;
  const a = 1 - eSuave(pr(t, K.retrato - 1.6, 1.4));
  // the camera: close on the first steps (a 10 km step ~ 260 px), following the dividers, then pulling back to the
  // whole border, and further, to the peninsula
  let n = 0;
  for (const g of K.pasosTitulo) if (t >= g) n++;
  const u = n > 0 ? eIO(cl((t - K.pasosTitulo[n - 1]) / 0.55)) : 0;
  const fpaso = n === 0 ? 0 : Math.min(4, n - 1 + u);
  const sig = (i: number) => CAM10[Math.min(CAM10.length - 1, i)];
  const foc = [lerp(sig(Math.floor(fpaso))[0], sig(Math.floor(fpaso) + 1)[0], fpaso % 1), lerp(sig(Math.floor(fpaso))[1], sig(Math.floor(fpaso) + 1)[1], fpaso % 1)];
  const cerca: Vista = { cx: foc[0] + 4, cy: foc[1] - 2, s: 26 * KT };
  const atras = eIO(pr(t, K.pasosTitulo[3] + 1.0, K.titulo - K.pasosTitulo[3] + 1.2));
  const v = lerpV(cerca, { ...VIB, s: VIB.s * 0.9 }, atras);
  const ai = a * eSuave(pr(t, 0.2, 1.6));
  tierra(ctx, f.iberia, "iberia", v, ai, lerp(0.5, 0.42, atras));
  reticula(ctx, v, ES.origen, ai * atras);
  // the border draws itself from the north, then stays as a line of light
  for (const p of ES.piezas) linea(ctx, v, p as number[][], ai, RGB.crema, lerp(2.4, 2.0, atras), eOut(pr(t, 0.6, 3.0 + 4 * atras)));
  // four steps of the dividers (10 km), the polygon left behind in amber
  camina(ctx, v, [CAM10.slice(0, 6)], fpaso / 5, AMBAR, ai * (1 - eSuave(pr(atras, 0.4, 0.4))), 250 * KT, 2.4);
  // the title, over the peninsula, one word per tick
  const ut = t - K.titulo;
  if (ut < 0) return;
  ctx.fillStyle = `rgba(2,3,6,${0.45 * a * eSuave(pr(ut, 0, 1.2))})`; ctx.fillRect(0, 0, W, H);
  const palabras = ["LA", "MEDIDA", "DE", "LO", "IRREGULAR"], tam = 76 * KT + 4, esp = 22;
  ctx.font = `300 ${tam}px "${SANS}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${esp}px`;
  const anchos = palabras.map((p) => ctx.measureText(p).width), hueco = tam * 0.5;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  let x = W / 2 - (anchos.reduce((s, w) => s + w, 0) + hueco * (palabras.length - 1)) / 2;
  palabras.forEach((p, i) => {
    const ap = eSuave(pr(ut, i * 0.3, 0.3)) * a;
    if (ap > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)";
      texto(ctx, p, x + esp / 2, H * 0.5, tam, `rgba(${RGB.crema},${0.35 * ap})`, { fam: SANS, peso: 300, esp });
      ctx.restore();
      texto(ctx, p, x + esp / 2, H * 0.5, tam, `rgba(${RGB.crema},${0.96 * ap})`, { fam: SANS, peso: 300, esp });
      ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.85 * ap})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, H * 0.5 + 24); ctx.lineTo(x, H * 0.5 + 40); ctx.stroke(); ctx.restore();
    }
    x += anchos[i] + hueco;
  });
  texto(ctx, "CAPÍTULO III", W / 2 + 8, H * 0.5 - tam * 1.2, 24 * KT + 6, `rgba(${AMBAR},${0.9 * a * eSuave(pr(ut, 1.6, 0.8))})`, { alin: "center", esp: 16 });
};

// ─── 1 · the man who measured to understand war ─────────────────────────────────────────────────────────────────
const EU = DAT.europa;
const VEU: Vista = { cx: -60, cy: 40, s: (H * 0.95) / 2600 };
const hombre = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.retrato - 0.6 || t > K.iberia + 1) return;
  const a = eSuave(pr(t, K.retrato - 0.6, 1.2)) * (1 - eSuave(pr(t, K.iberia - 0.6, 1.0)));
  // the 1919 watercolour of his convoy, full frame, slowly pushed in; then his portrait over it
  const ac = a * (1 - eSuave(pr(t, K.cuadricula - 0.8, 1.2)));
  if (ac > 0.01) {
    foto(ctx, f.ssa13, ac, 1.05 + 0.05 * pr(t, K.retrato, 18), 0.55, 0.55, `sepia(0.25) brightness(${lerp(0.85, 0.4, eSuave(pr(t, V[1] - 0.6, 1.0)))}) contrast(1.05)`);
    banda(ctx, ac);
    rotulo(ctx, "SECTION SANITAIRE ANGLAISE 13 · 1918", "LA UNIDAD DE AMBULANCIAS DE RICHARDSON · ACUARELA DE ARTHUR COTTERELL", ac * ventana(t, K.retrato + 0.6, V[1] - 0.2, 0.6));
    retrato(ctx, f.richardson, W / 2, ac * eSuave(pr(t, V[1] - 0.4, 0.8)), "LEWIS FRY RICHARDSON", "1881 – 1953", H * 0.14, H * 0.52);
  }
  // the frontispiece of his 1922 book: his own grid over Europe, slowly explored
  const ag = a * ventana(t, K.cuadricula - 0.8, K.renuncia + 0.6, 1.0);
  if (ag > 0.01 && f.cuadricula) {
    const u = pr(t, K.cuadricula, K.renuncia - K.cuadricula);
    const img = f.cuadricula, h = H * lerp(1.15, 1.75, eIO(u)), w = (h * img.width) / img.height;
    const cx = lerp(W * 0.5, W * 0.55, u), cy = lerp(H * 0.52, H * 0.62, u);
    ctx.save(); ctx.globalAlpha = ag; ctx.filter = "sepia(0.45) contrast(1.2) brightness(0.72)";
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h); ctx.restore();
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, "rgba(2,3,6,0)"); vg.addColorStop(1, `rgba(2,3,6,${0.85 * ag})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    banda(ctx, ag);
    rotulo(ctx, "«WEATHER PREDICTION BY NUMERICAL PROCESS» · 1922", "FRONTISPICIO ORIGINAL: SU CUADRÍCULA SOBRE EUROPA", ag * eSuave(pr(t, K.cuadricula + 1.0, 0.8)));
  }
  // 1920: Europe from space, dark; the date
  const ar = a * ventana(t, K.renuncia - 0.4, K.iberia + 0.4, 1.0);
  if (ar > 0.01) {
    const v = { ...VEU, s: VEU.s * (1 + 0.05 * pr(t, K.renuncia, 25)) };
    tierra(ctx, f.europa, "europa", v, ar, 0.42);
    reticula(ctx, v, EU.origen, ar, 5);
    // every land border lights up, one after another
    const ub = pr(t, K.fichas + 0.6, V[6] - K.fichas);
    (EU.fronteras as number[][][]).forEach((q, i) => {
      const ti = (i * 7919 % 1201) / 1201;
      if (ub < ti) return;
      linea(ctx, v, q, ar * eSuave(cl((ub - ti) * 8)), AMBAR, 1.4);
    });
    rotulo(ctx, "1920 · LA OFICINA METEOROLÓGICA PASA AL MINISTERIO DEL AIRE", "RICHARDSON RENUNCIA", ar * ventana(t, K.renuncia + 0.6, K.fichas, 0.6));
    rotulo(ctx, "¿PELEAN MÁS LOS PAÍSES CON MÁS FRONTERA COMÚN?", "", ar * eSuave(pr(t, V[5] + 3.0, 0.6)));
  }
};

// ─── 2 · two figures for one line ───────────────────────────────────────────────────────────────────────────────
const cifra = (ctx: Ctx, s: string, x: number, y: number, a: number, tam = 72) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)";
  texto(ctx, s, x, y, tam * KT + 8, `rgba(${AMBAR},${0.4 * a})`, { fam: SANS, peso: 600, alin: "center", esp: 2 });
  ctx.restore();
  texto(ctx, s, x, y, tam * KT + 8, `rgba(${AMBAR},${0.97 * a})`, { fam: SANS, peso: 600, alin: "center", esp: 2 });
};
const dosCifras = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.iberia - 0.8 || t > K.compases + 1) return;
  const a = eSuave(pr(t, K.iberia - 0.8, 1.2)) * (1 - eSuave(pr(t, K.compases - 0.6, 1.0)));
  const ab = ventana(t, K.benelux - 0.2, K.hoy + 0.4, 0.6), ai = a * (1 - ab);
  if (ai > 0.01) {
    const v = { ...VIB, s: VIB.s * (1 + 0.06 * pr(t, K.iberia, 30)) };
    tierra(ctx, f.iberia, "iberia", v, ai);
    reticula(ctx, v, ES.origen, ai);
    const enc = eIO(pr(t, K.iberia, 2.2));
    for (const p of ES.piezas) linea(ctx, v, p as number[][], ai, RGB.crema, 2.8, enc);
    const fuera = 1 - eSuave(pr(t, K.hoy, 0.6));
    cifra(ctx, "987 KM", W * 0.16, H * 0.52, ai * eSuave(pr(t, K.cifrasES[0] - 0.2, 0.5)) * fuera);
    cifra(ctx, "1.214 KM", W * 0.84, H * 0.52, ai * eSuave(pr(t, K.cifrasES[1] - 0.2, 0.5)) * fuera);
    const ah = ai * eSuave(pr(t, K.hoy + 0.8, 0.6));
    ["1.214 KM", "1.234 KM", "~1.250 KM"].forEach((s, i) => cifra(ctx, s, W * 0.83, H * 0.36 + i * 92, ah * eSuave(pr(t, K.hoy + 1.0 + i * 0.5, 0.4)), 54));
    nota(ctx, ah > 0.01 ? "CIFRAS ACTUALES DE DISTINTAS FUENTES" : "ESTIMACIONES PUBLICADAS · MÉTODOS Y FUENTES DISTINTOS", ai * eSuave(pr(t, K.cifrasES[0], 0.6)));
  }
  if (ab > 0.01) {
    const v: Vista = { cx: 0, cy: 20, s: ((H * 0.9) / 400) * (1 + 0.05 * pr(t, K.benelux, 10)) };
    tierra(ctx, f.benelux, "benelux", v, ab * a);
    reticula(ctx, v, DAT.belgica_paises_bajos.origen, ab * a);
    for (const p of DAT.belgica_paises_bajos.piezas) linea(ctx, v, p as number[][], ab * a, RGB.crema, 2.6, eIO(pr(t, K.benelux, 1.6)));
    cifra(ctx, "380 KM", W * 0.16, H * 0.52, ab * a * eSuave(pr(t, K.cifrasBN[0] - 0.2, 0.5)));
    cifra(ctx, "449 KM", W * 0.84, H * 0.52, ab * a * eSuave(pr(t, K.cifrasBN[1] - 0.2, 0.5)));
    rotulo(ctx, "BÉLGICA · PAÍSES BAJOS", "", ab * a * eSuave(pr(t, K.benelux + 0.6, 0.6)));
    nota(ctx, "ESTIMACIONES PUBLICADAS · MÉTODOS Y FUENTES DISTINTOS", ab * a);
  }
};

// ─── 3 · the same border, three steps at once, and a magnifier on a meander ─────────────────────────────────────
const PASOS: { r: string; col: string; nombre: string; L: number }[] = [
  { r: "80", col: AZUL, nombre: "PASO 80 KM", L: 0 },
  { r: "20", col: RGB.crema, nombre: "PASO 20 KM", L: 0 },
  { r: "5", col: AMBAR, nombre: "PASO 5 KM", L: 0 },
];
const contadores = (ctx: Ctx, vals: { col: string; nombre: string; v: number }[], a: number, x0 = W * 0.64, y0 = H * 0.3) => {
  vals.forEach((c, i) => {
    const y = y0 + i * 118;
    texto(ctx, c.nombre, x0, y, 18 * KT + 4, `rgba(${c.col},${0.85 * a})`, { esp: 6 });
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(10px)";
    texto(ctx, km(c.v), x0, y + 56, 56 * KT + 8, `rgba(${c.col},${0.35 * a})`, { fam: SANS, peso: 600, esp: 2 }); ctx.restore();
    texto(ctx, km(c.v), x0, y + 56, 56 * KT + 8, `rgba(${c.col},${0.95 * a})`, { fam: SANS, peso: 600, esp: 2 });
  });
};
const lupa = (ctx: Ctx, f: Fotos, v: Vista, centro: number[], a: number, pinta: (vz: Vista) => void, x: number, y: number, r: number, z: number) => {
  if (a <= 0.01) return;
  const vz: Vista = { cx: centro[0] + (W / 2 - x) / (v.s * z), cy: centro[1] - (H / 2 - y) / (v.s * z), s: v.s * z };
  ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = "#020306"; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  tierra(ctx, f.iberia, "iberia", vz, 1, 0.6);
  pinta(vz);
  ctx.restore();
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.8 * a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  texto(ctx, `AMPLIACIÓN ×${z}`, x, y + r + 32, 14 * KT + 4, `rgba(${RGB.crema},${0.75 * a})`, { alin: "center", esp: 4 });
};
const tresPasos = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.compases - 0.8 || t > K.paralelo + 1) return;
  const a = eSuave(pr(t, K.compases - 0.8, 1.2)) * (1 - eSuave(pr(t, K.paralelo - 0.6, 1.0)));
  const v = { ...VESB, cx: VESB.cx + 240, s: VESB.s * (1 + 0.04 * pr(t, K.compases, 25)) };
  tierra(ctx, f.iberia, "iberia", v, a, 0.5);
  reticula(ctx, v, ES.origen, a * 0.8);
  for (const p of ES.piezas) linea(ctx, v, p as number[][], a * 0.6, RGB.crema, 1.4);
  const fr = PASOS.map((c, i) => eSuave(pr(t, K.compases + 0.6, K.llegadas[i] - K.compases - 0.6)));
  const vals = PASOS.map((c, i) => {
    const med = ES.medidas[c.r as keyof typeof ES.medidas];
    const L = Math.max(40, Number(c.r) * v.s * 0.85);
    camina(ctx, v, med.caminatas as number[][][], fr[i], c.col, a, L, i === 2 ? 1.8 : 2.4);
    return { col: c.col, nombre: c.nombre, v: med.largo * fr[i] };
  });
  contadores(ctx, vals, a);
  // the magnifier: a meander of the Minho, where the 5 km step enters every bend that the 80 km step cuts
  const al = a * ventana(t, K.llegadas[1] + 0.4, V[13] + V.length * 0 + 6.0, 0.8);
  const meandro = [-46.8, 218.8];   // the most winding 25 km of the border (path ≈ 2,2 × chord), on the Minho
  lupa(ctx, f, v, meandro, al, (vz) => {
    for (const p of ES.piezas) linea(ctx, vz, p as number[][], 1, RGB.crema, 2);
    PASOS.forEach((c, i) => camina(ctx, vz, ES.medidas[c.r as keyof typeof ES.medidas].caminatas as number[][][], fr[i], c.col, 1, 60, 2.6, false));
  }, W * 0.84, H * 0.69, H * 0.14, 4);
  nota(ctx, "MEDICIÓN PROPIA · NATURAL EARTH 10m · MÉTODO DE COMPÁS · IMAGEN: NASA BLUE MARBLE", a);
};

// ─── 3b · a border that does not grow ───────────────────────────────────────────────────────────────────────────
const paralelo = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.paralelo - 0.8 || t > K.grafico + 1) return;
  const a = eSuave(pr(t, K.paralelo - 0.8, 1.2)) * (1 - eSuave(pr(t, K.grafico - 0.6, 1.0)));
  const u = eIO(pr(t, K.paralelo - 0.8, 3.0));
  const v = lerpV({ cx: 400, cy: -300, s: (W * 0.9) / 7000 }, { cx: 0, cy: 80, s: (W * 0.74) / 2022 }, u);
  tierra(ctx, f.norteamerica, "norteamerica", v, a, 0.5);
  reticula(ctx, v, P49.origen, a, 5);
  for (const p of P49.piezas) linea(ctx, v, p as number[][], a, RGB.crema, 2.6, eIO(pr(t, K.paralelo + 0.6, 1.6)));
  const fr = eSuave(pr(t, V[14] + 1.0, K.llegaP - V[14] - 1.0));
  const vals = PASOS.map((c) => {
    const med = P49.medidas[c.r as keyof typeof P49.medidas];
    camina(ctx, v, med.caminatas as number[][][], fr, c.col, a, Math.max(40, Number(c.r) * v.s * 0.85), 2.2);
    return { col: c.col, nombre: c.nombre, v: med.largo * fr };
  });
  contadores(ctx, vals, a, W * 0.08, H * 0.6);
  rotulo(ctx, "PARALELO 49 · ESTADOS UNIDOS Y CANADÁ", "CONVENIO DE 1818 · TRATADO DE OREGÓN, 1846", a * eSuave(pr(t, K.paralelo + 1.4, 0.6)), W - 84, H * 0.32, "right");
  nota(ctx, "MEDICIÓN PROPIA · NATURAL EARTH 10m · ENTRE 123° Y 95° OESTE", a);
};

// ─── 4 · the law: log(length) against log(step), large ──────────────────────────────────────────────────────────
// one decade has the same size on both axes, so a slope looks like what it is
const G0 = { x0: W * 0.16, x1: W * 0.84, y1: H * 0.86 };
const DEC = (G0.x1 - G0.x0) / 2;
const gx = (r: number) => G0.x0 + Math.log10(r) * DEC;
const gy = (L: number) => G0.y1 - (Math.log10(L) - Math.log10(600)) * DEC;
const ejes = (ctx: Ctx, a: number) => {
  // a faint log grid
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.07 * a})`; ctx.lineWidth = 1;
  for (const r of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) { const x = gx(r); ctx.beginPath(); ctx.moveTo(x, gy(2700)); ctx.lineTo(x, G0.y1); ctx.stroke(); }
  for (const L of [600, 700, 800, 900, 1000, 2000]) { const y = gy(L); ctx.beginPath(); ctx.moveTo(G0.x0, y); ctx.lineTo(G0.x1, y); ctx.stroke(); }
  ctx.strokeStyle = `rgba(${RGB.crema},${0.55 * a})`; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(G0.x0, gy(2700)); ctx.lineTo(G0.x0, G0.y1); ctx.lineTo(G0.x1, G0.y1); ctx.stroke();
  ctx.restore();
  for (const r of [1, 2, 5, 10, 20, 50, 100]) texto(ctx, String(r), gx(r), G0.y1 + 30, 15 * KT + 4, `rgba(${RGB.crema},${0.7 * a})`, { alin: "center", esp: 1 });
  for (const L of [600, 1000, 2000]) texto(ctx, km(L), G0.x0 - 14, gy(L) + 5, 14 * KT + 4, `rgba(${RGB.crema},${0.7 * a})`, { alin: "right", esp: 1 });
  texto(ctx, "TAMAÑO DEL PASO (KM) · ESCALA LOGARÍTMICA", (G0.x0 + G0.x1) / 2, G0.y1 + 62, 15 * KT + 4, `rgba(${RGB.crema},${0.75 * a})`, { alin: "center", esp: 5 });
  ctx.save(); ctx.translate(G0.x0 - 150, gy(1250)); ctx.rotate(-Math.PI / 2);
  texto(ctx, "LARGO MEDIDO", 0, 0, 15 * KT + 4, `rgba(${RGB.crema},${0.75 * a})`, { alin: "center", esp: 5 }); ctx.restore();
};
const PES = [80, 40, 20, 10, 5].map((r) => [r, ES.medidas[String(r) as keyof typeof ES.medidas].largo] as [number, number]);
const PUS = [80, 40, 20, 10, 5].map((r) => [r, P49.medidas[String(r) as keyof typeof P49.medidas].largo] as [number, number]);
const ajuste = (pares: [number, number][], m: number) => {
  const mx = pares.reduce((s, p) => s + Math.log10(p[0]), 0) / pares.length, my = pares.reduce((s, p) => s + Math.log10(p[1]), 0) / pares.length;
  return (r: number) => Math.pow(10, my + m * (Math.log10(r) - mx));
};
const LE = ajuste(PES, ES.pendiente_80_5);
const punto = (ctx: Ctx, x: number, y: number, a: number, col: string, e: number) => {
  luz(ctx, x, y, 16, a, col);
  if (e < 1) { ctx.save(); ctx.strokeStyle = `rgba(${col},${a * (1 - e)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 8 + 40 * e, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
};
const RICH: [string, number][] = [["SUDÁFRICA (COSTA)", 1.02], ["AUSTRALIA (COSTA)", 1.13], ["ESPAÑA–PORTUGAL", 1.14], ["ALEMANIA, 1899", 1.15], ["GRAN BRETAÑA (OESTE)", 1.25]];
const ley = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.grafico - 0.6 || t > K.rios + 1) return;
  const a = eSuave(pr(t, K.grafico - 0.6, 1.0)) * (1 - eSuave(pr(t, K.rios - 0.6, 1.0)));
  const ar = ventana(t, K.retratos - 0.3, K.comparacion + 0.2, 0.8);
  const aa = eSuave(pr(t, K.abanico, 1.0)) * (1 - eSuave(pr(t, K.retratos - 0.6, 0.6)));
  const ag = a * (1 - ventana(t, K.abanico, K.comparacion + 0.2, 0.8));
  if (ag > 0.01) {
    ejes(ctx, ag);
    PES.forEach((p, i) => { const e = pr(t, K.grafico + 0.3 + i * 0.25, 0.6); if (e > 0) punto(ctx, gx(p[0]), gy(p[1]), ag, AMBAR, e); });
    PUS.forEach((p, i) => { const e = pr(t, K.grafico + 1.8 + i * 0.25, 0.6); if (e > 0) punto(ctx, gx(p[0]), gy(p[1]), ag, AZUL, e); });
    const al = ag * eSuave(pr(t, K.grafico + 3.4, 0.8)), dib = eOut(pr(t, K.grafico + 3.4, 1.4));
    trazo(ctx, [[gx(3), gy(LE(3))], [gx(lerp(3, 100, dib)), gy(LE(lerp(3, 100, dib)))]], AMBAR, al, 2.4);
    trazo(ctx, [[gx(3), gy(2022)], [gx(lerp(3, 100, dib)), gy(2022)]], AZUL, al, 2.4);
    texto(ctx, "ESPAÑA–PORTUGAL", gx(100) + 16, gy(LE(100)) + 6, 16 * KT + 4, `rgba(${AMBAR},${0.95 * al})`, { esp: 3 });
    texto(ctx, "EE. UU.–CANADÁ", gx(100) + 16, gy(2022) + 6, 16 * KT + 4, `rgba(${AZUL},${0.95 * al})`, { esp: 3 });
    // slope triangles over one decade (10 → 100 km)
    const at = ag * eSuave(pr(t, K.pendiente, 0.8));
    if (at > 0.01) {
      const x0 = gx(10), x1 = gx(100), y0 = gy(LE(10)), y1 = gy(LE(100));
      ctx.save(); ctx.setLineDash([6, 7]); ctx.strokeStyle = `rgba(${AMBAR},${0.75 * at})`; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
      texto(ctx, "PENDIENTE m = −0,12", (x0 + x1) / 2, y0 - 18, 20 * KT + 4, `rgba(${AMBAR},${0.97 * at})`, { alin: "center", esp: 2 });
      texto(ctx, "PENDIENTE m = 0", (x0 + x1) / 2, gy(2022) - 18, 20 * KT + 4, `rgba(${AZUL},${0.97 * at})`, { alin: "center", esp: 2 });
    }
    // the panel, at the top of the frame
    const ap = ag * eSuave(pr(t, K.panel, 0.8)) * (1 - eSuave(pr(t, K.abanico - 0.6, 0.6)));
    if (ap > 0.01) {
      const x = W * 0.2, y = H * 0.05, w = W * 0.6, h = H * 0.3;
      ctx.save(); ctx.fillStyle = `rgba(2,3,6,${0.88 * ap})`; ctx.fillRect(x, y, w, h); ctx.strokeStyle = `rgba(${RGB.crema},${0.3 * ap})`; ctx.strokeRect(x, y, w, h); ctx.restore();
      texto(ctx, "L(ε) = M · ε^(1 − D)", x + w / 2, y + 66, 38 * KT + 8, `rgba(${RGB.crema},${0.97 * ap})`, { alin: "center", esp: 1 });
      texto(ctx, "ε = TAMAÑO DEL PASO · D = DIMENSIÓN", x + w / 2, y + 104, 14 * KT + 4, `rgba(${RGB.crema},${0.6 * ap})`, { alin: "center", esp: 4 });
      const a2 = ap * eSuave(pr(t, K.panel + 1.6, 0.6)), a3 = ap * eSuave(pr(t, K.panel + 3.2, 0.6)), a4 = ap * eSuave(pr(t, K.panel + 4.6, 0.6));
      texto(ctx, "PENDIENTE  m = 1 − D", x + w * 0.27, y + 172, 26 * KT + 6, `rgba(${AMBAR},${0.97 * a2})`, { alin: "center", esp: 2 });
      texto(ctx, "D = 1 − m", x + w * 0.27, y + 230, 26 * KT + 6, `rgba(${AMBAR},${0.97 * a3})`, { alin: "center", esp: 2 });
      texto(ctx, "1 − (−0,12) = 1,12", x + w * 0.73, y + 172, 24 * KT + 6, `rgba(${AMBAR},${0.97 * a4})`, { alin: "center", esp: 1 });
      texto(ctx, "1 − 0 = 1", x + w * 0.73, y + 230, 24 * KT + 6, `rgba(${AZUL},${0.97 * a4})`, { alin: "center", esp: 1 });
    }
    // the two values side by side
    const ac = ag * eSuave(pr(t, K.comparacion + 0.4, 0.8));
    if (ac > 0.01) {
      // in the free band between the term above and the chart below (the chart starts at ~0,46 H)
      texto(ctx, "RICHARDSON · D = 1,14", W * 0.3, H * 0.385, 34 * KT + 6, `rgba(${RGB.crema},${0.97 * ac})`, { fam: SANS, peso: 600, alin: "center", esp: 2 });
      texto(ctx, "NUESTRA MEDIDA · D = 1,12", W * 0.7, H * 0.385, 34 * KT + 6, `rgba(${AMBAR},${0.97 * ac})`, { fam: SANS, peso: 600, alin: "center", esp: 2 });
      texto(ctx, "OTROS MAPAS · OTROS PASOS · OTRO AJUSTE", W / 2, H * 0.43, 15 * KT + 4, `rgba(${RGB.crema},${0.65 * ac})`, { alin: "center", esp: 4 });
    }
  }
  // Richardson's lines: their slopes (m = 1 − D), from a common origin, as a fan across the frame
  if (a * aa > 0.01) {
    const ox = W * 0.14, oy = H * 0.3, largo = W * 0.52, AMP = 2;
    let yPrev = -1e9;
    const lineas: [string, number][] = [["CÍRCULO (REFERENCIA)", 1.0], ...RICH];
    lineas.forEach(([n, D], i) => {
      const m = 1 - D, ai2 = a * aa * eSuave(pr(t, K.abanico + 0.3 + i * 0.4, 0.5)), d2 = eOut(pr(t, K.abanico + 0.3 + i * 0.4, 1.0));
      const x1 = ox + largo * d2, y1 = oy - m * largo * AMP * d2;
      trazo(ctx, [[ox, oy], [x1, y1]], i === 0 ? RGB.crema : i === 3 ? AMBAR : AZUL, ai2 * (i === 0 ? 0.55 : 1), 2.2);
      const yt = Math.max(oy - m * largo * AMP + 6, yPrev + 34); yPrev = yt;
      texto(ctx, `${n} · D = ${D.toFixed(2).replace(".", ",")}`, x1 + 16, lerp(oy + 6, yt, d2), 16 * KT + 4, `rgba(${RGB.crema},${0.9 * ai2})`, { esp: 2 });
    });
    luz(ctx, ox, oy, 18, a * aa);
    nota(ctx, "RECTAS REDIBUJADAS A PARTIR DE LAS DIMENSIONES DE RICHARDSON (1961), SEGÚN MANDELBROT (1967) · INCLINACIÓN AMPLIADA ×2", a * aa);
  }
  if (ar > 0.01) {
    retrato(ctx, f.richardson, W * 0.3, ar * a, "LEWIS FRY RICHARDSON", "1881 – 1953", H * 0.14, H * 0.48);
    retrato(ctx, f.mandelbrot, W * 0.7, ar * a * eSuave(pr(t, V[20] - 0.4, 0.8)), "BENOIT MANDELBROT", "1924 – 2010", H * 0.14, H * 0.48);
    const yl = H * 0.91, al = ar * a, dib = eOut(pr(t, K.retratos, 2.0));
    ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.45 * al})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(W * 0.2, yl); ctx.lineTo(lerp(W * 0.2, W * 0.8, dib), yl); ctx.stroke(); ctx.restore();
    [["1953 · MUERE", 0.25, V[19] + 1.0], ["1961 · SE PUBLICA", 0.45, V[19] + 4.0], ["1967 · MANDELBROT", 0.75, V[20] + 0.6]].forEach(([s, f2, t0]) => {
      const e = al * eSuave(pr(t, t0 as number, 0.5)), x = W * (f2 as number);
      luz(ctx, x, yl, 12, e); texto(ctx, s as string, x, yl - 20, 15 * KT + 4, `rgba(${AMBAR},${0.92 * e})`, { alin: "center", esp: 3 });
    });
  }
};

// ─── 5 · who drew each line: the rivers, with water flowing in them ─────────────────────────────────────────────
const rios = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.rios - 0.6 || t > K.rango + 1) return;
  const a = eSuave(pr(t, K.rios - 0.6, 1.0)) * (1 - eSuave(pr(t, K.rango - 0.6, 1.0)));
  const lado = eIO(pr(t, K.agua - 3.0, 1.6));
  const v = { ...VIB, cx: VIB.cx - 220 * lado, s: VIB.s * (1.05 + 0.05 * pr(t, K.rios, 18)) };
  tierra(ctx, f.iberia, "iberia", v, a);
  reticula(ctx, v, ES.origen, a);
  const ar = a * eSuave(pr(t, K.rios + 0.4, 1.4));
  Object.entries(DAT.rios).forEach(([n, lista], k) => {
    let mejor: number[] = [0, 0], my = -1e9;
    for (const q of lista as number[][][]) {
      const pts = q.map((p) => px(v, p));
      trazo(ctx, pts, AGUA, ar * 0.85, 1.8);
      // light running down the river
      for (let j = 0; j < 3; j++) { const fase = (t * 0.12 + j / 3 + k * 0.17) % 1, i = Math.floor(fase * (pts.length - 1)); luz(ctx, pts[i][0], pts[i][1], 12, ar * 0.7, AGUA); }
      for (const p of q) if (p[0] > my) { my = p[0]; mejor = p; }
    }
    const e = px(v, mejor);
    texto(ctx, n, e[0] + 16, e[1] + 6, 17 * KT + 4, `rgba(${AGUA},${0.95 * ar})`, { esp: 4 });
  });
  const af = a * eSuave(pr(t, V[22] + 4.0, 1.2));
  ES.piezas.forEach((pz, j) => {
    const q = (pz as number[][]).map((p) => px(v, p)), mk = ES.tramo_fluvial[j] as boolean[];
    trazo(ctx, q, RGB.crema, a * 0.85, 2.2);
    for (let i = 0; i < q.length - 1; i++) if (mk[i]) trazo(ctx, [q[i], q[i + 1]], AGUA, af, 3.4);
  });
  const ap = a * lado;
  if (ap > 0.01) {
    ctx.save(); ctx.fillStyle = `rgba(2,3,6,${0.85 * ap})`; ctx.fillRect(0, 0, W * 0.38, H); ctx.restore();
    const vp: Vista = { cx: 0, cy: 0, s: (W * 0.3) / 2100 };
    ctx.save(); ctx.translate(-W * 0.31, 0);
    for (const p of P49.piezas) linea(ctx, vp, p as number[][], ap, AZUL, 2.6);
    ctx.restore();
    texto(ctx, "LA TRAZÓ UN TRATADO", W * 0.19, H * 0.58, 24 * KT + 6, `rgba(${AZUL},${0.95 * ap})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
    texto(ctx, "PARALELO 49", W * 0.19, H * 0.42, 15 * KT + 4, `rgba(${RGB.crema},${0.7 * ap})`, { alin: "center", esp: 5 });
    texto(ctx, "LA DIBUJÓ EL AGUA", W * 0.7, H * 0.93, 24 * KT + 6, `rgba(${AGUA},${0.95 * ap})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
  }
};

// ─── 6 · how far it holds ───────────────────────────────────────────────────────────────────────────────────────
const kochSeg = (p: P, q: P, map: (w: P) => P, xmin: number, xmax: number): P[][] => {
  const runs: P[][] = [];
  let actual: P[] | null = null;
  const va = (p: P, q: P, n: number) => {
    const A = map(p), B = map(q), r = Math.hypot(B[0] - A[0], B[1] - A[1]) * 0.6 + 4;
    if (Math.max(A[0], B[0]) < xmin - r || Math.min(A[0], B[0]) > xmax + r || Math.max(A[1], B[1]) < -r || Math.min(A[1], B[1]) > H + r) { actual = null; return; }
    if (n >= 16 || Math.hypot(B[0] - A[0], B[1] - A[1]) < 2.5) {
      if (!actual) { actual = [A]; runs.push(actual); }
      actual.push(B);
      return;
    }
    const dx = (q[0] - p[0]) / 3, dy = (q[1] - p[1]) / 3;
    const a: P = [p[0] + dx, p[1] + dy], b: P = [p[0] + 2 * dx, p[1] + 2 * dy];
    const m: P = [(a[0] + b[0]) / 2 + (dy * Math.sqrt(3)) / 2, (a[1] + b[1]) / 2 - (dx * Math.sqrt(3)) / 2];
    va(p, a, n + 1); va(a, m, n + 1); va(m, b, n + 1); va(b, q, n + 1);
  };
  va(p, q, 0);
  return runs;
};
const rango = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.rango - 0.6 || t > K.cierre + 1) return;
  const a = eSuave(pr(t, K.rango - 0.6, 1.0)) * (1 - eSuave(pr(t, K.cierre - 0.6, 1.0)));
  const af = ventana(t, K.escalas - 0.2, K.koch + 0.4, 0.8), ak = eSuave(pr(t, K.koch, 1.0));
  const ach = a * (1 - af);
  if (ach > 0.01) {
    ctx.save();
    if (ak > 0.01) { ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip(); ctx.translate(W * 0.5, H * 0.05); ctx.scale(0.5, 0.5); ctx.translate(0, H * 0.5); }
    ejes(ctx, ach);
    const todos = [80, 40, 20, 10, 5, 2.5, 1.25].map((r) => [r, ES.medidas[String(r) as keyof typeof ES.medidas].largo] as [number, number]);
    const ext = eSuave(pr(t, K.rango + 0.6, 1.4));
    todos.forEach((p, i) => { if (i < 5 || ext > 0) punto(ctx, gx(p[0]), gy(p[1]), ach * (i < 5 ? 1 : ext), AMBAR, i < 5 ? 1 : pr(t, K.rango + 0.6 + (i - 5) * 0.5, 0.6)); });
    const curva = todos.slice(0, 5 + (ext > 0.5 ? 2 : 0)).map((p) => [gx(p[0]), gy(p[1])] as P).reverse();
    trazo(ctx, curva, AMBAR, ach, 2.4);
    const ab = ach * eSuave(pr(t, K.rango + 2.0, 1.0));
    ctx.fillStyle = `rgba(${AZUL},${0.1 * ab})`; ctx.fillRect(gx(1), gy(2700), gx(1.6) - gx(1), G0.y1 - gy(2700));
    texto(ctx, "EL MAPA YA NO TIENE MÁS DETALLE (~1 KM)", gx(1) + 12, gy(2500), 15 * KT + 4, `rgba(${AZUL},${0.95 * ab})`, { esp: 3 });
    const av = ach * eSuave(pr(t, K.koch - 1.5, 1.0));
    if (av > 0.01) {
      ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.75 * av})`; ctx.setLineDash([5, 7]); ctx.lineWidth = 1.4;
      for (const r of [5, 80]) { ctx.beginPath(); ctx.moveTo(gx(r), gy(2600)); ctx.lineTo(gx(r), G0.y1); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = `rgba(${AMBAR},${0.06 * av})`; ctx.fillRect(gx(5), gy(2600), gx(80) - gx(5), G0.y1 - gy(2600));
      texto(ctx, "AQUÍ VALE LA RELACIÓN", (gx(5) + gx(80)) / 2, gy(2400), 18 * KT + 4, `rgba(${RGB.crema},${0.95 * av})`, { alin: "center", esp: 4 });
    }
    ctx.restore();
  }
  // the journey down in scale: the border river, a border stone, stones; the same dividers on screen
  if (af > 0.01) {
    const ua = pr(t, K.escalas, V[25] - K.escalas);
    const f1 = 1 - eSuave(pr(ua, 0.38, 0.12)), f3 = eSuave(pr(ua, 0.62, 0.12)), f2 = 1 - f1 - f3;
    foto(ctx, f.ribera, a * af * f1, 1.05 + 0.12 * ua, 0.5, 0.55, "contrast(1.05) brightness(0.9)");
    foto(ctx, f.hito, a * af * f2, 1.0 + 0.12 * ua, 0.5, 0.45, "contrast(1.05) brightness(0.9)");
    foto(ctx, f.piedras, a * af * f3, 1.05 + 0.18 * ua, 0.5, 0.7, "contrast(1.05) brightness(0.9)");
    banda(ctx, a * af);
    const cual = f3 > 0.4 ? 2 : f2 > 0.4 ? 1 : 0;   // the photo on top leads as soon as it is clearly visible
    rotulo(ctx, ["EL MIÑO EN TUI, FRONTERA ENTRE ESPAÑA Y PORTUGAL", "HITO FRONTERIZO 693", "PIEDRAS DE UN LECHO DE RÍO"][cual], cual === 1 ? "LA FRONTERA: ACUERDOS, COORDENADAS Y ACCIDENTES GEOGRÁFICOS" : "", a * af);
  }
  if (ak > 0.01 && a > 0.01) {
    const zz = Math.pow(3, 3 * eIO(pr(t, K.koch + 0.6, K.cierre - K.koch - 1.6)));
    ctx.save(); ctx.beginPath(); ctx.rect(0, H * 0.26, W / 2, H * 0.74); ctx.clip();
    const S = W * 0.4 * zz, ancla: P = [W * 0.05, H * 0.66];
    for (const r of kochSeg([0, 0], [1, 0], ([x, y]) => [ancla[0] + x * S, ancla[1] + y * S], 0, W / 2)) trazo(ctx, r, RGB.crema, a * ak, 2);
    ctx.restore();
    ctx.save(); ctx.fillStyle = `rgba(2,3,6,${a * ak})`; ctx.fillRect(W / 2 - 2, 0, 4, H); ctx.strokeStyle = `rgba(${RGB.crema},${0.35 * a * ak})`; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.restore();
    banda(ctx, a * ak);
    rotulo(ctx, "MATEMÁTICA", "DETALLE SIN FIN", a * ak, 60, H - 110);
    rotulo(ctx, "DATOS REALES", "UN RANGO", a * ak, W / 2 + 60, H - 110);
  }
};

// ─── 7 · close: the border alone; the river network of the peninsula draws itself; three forms ─────────────────
const cierre = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.cierre + 0.4) return;
  const a = eSuave(pr(t, K.cierre + 0.4, 1.2)) * (1 - eSuave(pr(t, K.total - 2.2, 2.0)));
  const ar = eSuave(pr(t, K.rio, 1.6));
  const v = { ...VIB, s: VIB.s * (1 + 0.06 * pr(t, K.cierre, 40)) };
  tierra(ctx, f.iberia, "iberia", v, a * (0.5 + 0.5 * ar), 0.38);
  for (const p of ES.piezas) linea(ctx, v, p as number[][], a * (1 - 0.75 * ar), RGB.crema, 2.6);
  // while the border is alone, a light runs slowly down it, north to south
  const pz = ES.piezas[1] as number[][], fl = ((t - K.cierre) / 16) % 1;
  if (t > K.cierre) { const q = px(v, pz[Math.floor(fl * (pz.length - 1))]); luz(ctx, q[0], q[1], 16, a * (1 - ar) * 0.9 * Math.sin(Math.PI * fl)); }
  if (ar > 0.01) {
    // all the rivers: the big ones first, then the smaller ones, each drawn from end to end; light running in them
    const red = DAT.red_iberia as { r: number; p: number[][] }[];
    red.forEach((rio, i) => {
      const t0 = K.rio + 0.3 + (i / red.length) * 9.0, d = eOut(pr(t, t0, 2.4));
      if (d <= 0) return;
      const pts = rio.p.map((p) => px(v, p)), n = Math.max(2, Math.ceil(pts.length * d));
      trazo(ctx, pts.slice(0, n), AGUA, a * ar * (rio.r <= 6 ? 0.95 : 0.7), rio.r <= 6 ? 2.2 : 1.4);
      const fase = ((t * 0.14 + i * 0.13) % 1), j = Math.floor(fase * (n - 1));
      if (rio.r <= 7) luz(ctx, pts[j][0], pts[j][1], 12, a * ar * 0.7, AGUA);
    });
  }
  // three forms the prologue already showed, in a row: a mineral dendrite, retinal vessels, a drainage net
  const ai = a * eSuave(pr(t, V[28] + 3.0, 1.2));
  if (ai > 0.01) {
    ctx.fillStyle = `rgba(2,3,6,${0.5 * ai})`; ctx.fillRect(0, H * 0.62, W, H * 0.38);
    [[f.pirolusita, "DENDRITA MINERAL"], [f.retina, "VASOS DE LA RETINA"], [f.drenaje, "RED DE DRENAJE"]].forEach(([img, n], i) => {
      const im = img as HTMLImageElement | undefined;
      if (!im) return;
      const w = W * 0.22, h = w * 0.62, x = W * 0.13 + i * (w + W * 0.04), y = H * 0.66;
      const ii = ai * eSuave(pr(t, V[28] + 3.0 + i * 1.6, 0.8));
      const s = Math.max(w / im.width, h / im.height) * (1.05 + 0.05 * pr(t, V[28], 12));
      ctx.save(); ctx.globalAlpha = ii; ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.drawImage(im, x + w / 2 - (im.width * s) / 2, y + h / 2 - (im.height * s) / 2, im.width * s, im.height * s); ctx.restore();
      ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.4 * ii})`; ctx.strokeRect(x, y, w, h); ctx.restore();
      texto(ctx, n as string, x + w / 2, y - 14, 14 * KT + 4, `rgba(${RGB.crema},${0.85 * ii})`, { alin: "center", esp: 4 });
    });
  }
  rotulo(ctx, "PARECERSE NO SIGNIFICA TENER EL MISMO ORIGEN", "", a * eSuave(pr(t, V[29], 0.8)), W / 2, H * 0.2, "center");
};

export const dibujarCap3 = (ctx: Ctx, t: number, frame: number, fotos: Fotos) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  titulo(ctx, t, fotos);
  hombre(ctx, t, fotos);
  dosCifras(ctx, t, fotos);
  tresPasos(ctx, t, fotos);
  paralelo(ctx, t, fotos);
  ley(ctx, t, fotos);
  rios(ctx, t, fotos);
  rango(ctx, t, fotos);
  cierre(ctx, t, fotos);
  terminos(ctx, t);
  let golpe = 0;
  for (const g of [K.titulo, K.compases, K.panel, K.agua]) if (t >= g && t - g < 1.5) golpe = Math.max(golpe, 0.9 * Math.exp(-(t - g) * 3));
  const fin = eSuave(pr(t, K.total - 1.2, 1.2));
  if (fin > 0) { ctx.fillStyle = `rgba(2,3,6,${fin})`; ctx.fillRect(0, 0, W, H); }
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.92, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: golpe * 0.4, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
