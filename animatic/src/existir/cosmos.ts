// «Qué extraño es existir» · cierre (v16): el viaje continuo de La frontera (montajeMG.ts, aprobado), al revés: de lo
// micro a lo macro. Neuronas → retina → ojo → ojo del huracán → huracán → Tierra → estrella → galaxia → cúmulo → red
// cósmica. Mismo mundo anidado (src/cosmos.json), misma cámara con ritmo propio y desenfoque de movimiento real; aquí
// el tiempo corre hacia atrás. Copiado de montajeMG.ts (líneas 830–1021) con W×H del reel.
import COS from "../cosmos.json";
import { RGB, SANS, cl, eSuave } from "../theme";

type Ctx = CanvasRenderingContext2D;
// modo ORIGINAL: el viaje de La frontera sin ningún cambio (sólo recorrido al revés), para comparar
let ORIGINAL = false;
export const usarOriginal = (v: boolean) => { ORIGINAL = v; };
const MEZCLA_BASE = 1.5, MEZCLA_OJO = 1.3;              // el paso ojo → ojo del huracán, más largo                                          // fusiones 1,5 veces más largas que en La frontera
const W = 1080, H = 1920;
const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; esp?: number } = {}) => {
  ctx.save(); ctx.font = `${op.peso ?? 400} ${tam}px ${op.fam ?? SANS}`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 0}px`;
  ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
};
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
// v20: en el cierre la cámara no apunta de una región a otra (eso la movía hacia los lados): queda fija en el punto
// más profundo del viaje y solo retrocede; cada imagen se encoge hacia el centro
const centroCamOriginal = (L: number) => {
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
let P_FIJO: number[] | null = null;
const centroCam = (L: number) => { if (ORIGINAL) return centroCamOriginal(L); if (!P_FIJO) P_FIJO = centroCamOriginal(LZ[9] + 0.92 * (LZ[10] - LZ[9])); return P_FIJO; };
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
  const e = ETAPAS[i], pre = (e.pre ?? 0.35) * (ORIGINAL ? 1 : MEZCLA_BASE), post = (e.post ?? 0.35) * (ORIGINAL ? 1 : MEZCLA_BASE);
  return i === 0 ? 1 : eSuave(cl((L - (LZ[i] - pre)) / (pre + post)));
};
const alfaEtapaOriginal = (i: number, L: number) => {
  const e = ETAPAS[i], ap = e.apaga;
  return alfaEntra(i, L) * (ap ? 1 - eSuave(cl((L - (LZ[i + 1] + ap[0])) / (ap[1] - ap[0]))) : 1);
};
// v20: la retina se encoge y se oscurece hasta el negro de la pupila; recién ahí aparece el ojo alrededor
const alfaEtapa = (i: number, L: number) => {
  if (ORIGINAL) return alfaEtapaOriginal(i, L);
  // v21: la retina se oscurece mientras todavía llena la pantalla (que es la pupila): al retroceder, el iris se
  // descubre solo alrededor del negro, sin fundidos
  if (i === 8) return eSuave(cl((L - (LZ[8] + 0.05)) / 0.7));
  // el ojo (solo su iris) se disuelve en el centro del ojo del huracán
  if (i === 7) return eSuave(cl((L - (LZ[7] - 0.25)) / MEZCLA_OJO));   // sin el apagado del original (que lo volvía transparente aquí)
  return alfaEtapaOriginal(i, L);
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
    return !(sig && !sig.modo && alfaEtapa(i + 1, L) >= 0.999 && cubreTodo(i + 1, L));   // v20: con la visibilidad real
  });
// exposures per frame, and the shutter (half a frame)
const EXPOS = 6, OBTURADOR = 0.5 / 30;
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
    if (i === 7 && !ORIGINAL) {
      // v21: el ojo es solo el iris (una esfera), recortado en su región de entrada, que calza con el ojo del huracán
      capaV = lienzo(capaV);
      const d = capaV.getContext("2d")!;
      d.globalCompositeOperation = "source-over"; d.globalAlpha = 1; d.clearRect(0, 0, W, H); dibuja(d);
      const ex = X0 + e.entra[0] * e.w * sk, ey = Y0 + e.entra[1] * e.h * sk, rr = e.entra[2] * e.w * sk;
      const g = d.createRadialGradient(ex, ey, rr * 0.94, ex, ey, rr * 1.04);
      g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
      d.globalCompositeOperation = "destination-in"; d.fillStyle = g; d.fillRect(0, 0, W, H);
      c.globalAlpha = a; c.drawImage(capaV, 0, 0);
      c.restore();
      continue;
    }
    if (e.modo === "luz") {
      c.globalCompositeOperation = "screen"; c.globalAlpha = a; dibuja(c);
    } else if (((a >= 0.999 || i === 0) && W > H) || (i === 8 && !ORIGINAL)) {   // v20: la retina se apaga entera (sin máscara que cambie)
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
export const zoomCosmico = (ctx: Ctx, t: number, cosmos: Map<string, HTMLImageElement>) => {
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

// ── al revés ──────────────────────────────────────────────────────────────────────────────────────────────────
// el instante (en el tiempo del viaje original) en que la cámara llega a las neuronas, y el del inicio
const T_NEURONAS = (() => { const { n, t } = TABLA; const L9 = LZ[ETAPAS.length - 2] + 0.25; return t[Math.round((L9 / LFIN) * n)]; })();
export const nivelAlReves = (u: number) => nivelZoom(T_NEURONAS - u * (T_NEURONAS - COS.corte));   // u: 0 → 1
export const imagenesViaje = () => ETAPAS.map((e) => e.src);
// el nivel de zoom en el tiempo local l del cierre (v18): una curva de cámara propia, no la del original al revés.
// Cada etapa recibe un tiempo según lo que hay que ver en ella; la velocidad (en log-zoom por segundo) pasa de una
// etapa a la otra sin saltos (interpolada entre los centros de las etapas), arranca desde la quietud y, al llegar a
// la red, sigue alejándose y se acerca suave a un tope que aún cubre el cuadro. Tabla precalculada (función pura).
// velocidad del zoom (log-zoom por segundo) en cada etapa: casi constante, para que la cámara sea un solo movimiento;
// frena con suavidad donde hay que mirar (el ojo, el ojo del huracán) y al llegar a la red
const V = [0.45, 0.6, 0.8, 0.8, 0.8, 0.6, 0.36, 0.3, 0.5, 0.55];   // red, cúmulo, galaxia, estrella, Tierra, huracán, ojo del huracán, ojo, retina, neuronas
const L_INICIO = LZ[9] + 0.92 * (LZ[10] - LZ[9]);
const velocidad = (L: number) => {
  const centros = V.map((_, i) => (LZ[i] + LZ[i + 1]) / 2);
  if (L <= centros[0]) return V[0];
  if (L >= centros[9]) return V[9];
  let j = 0; while (j < 8 && L > centros[j + 1]) j++;
  return V[j] + (V[j + 1] - V[j]) * eSuave((L - centros[j]) / (centros[j + 1] - centros[j]));
};
const tablas = new Map<string, Float32Array>();
const PASO = 1 / 240;
const tablaCierre = (l0: number, l1: number) => {
  const k0 = `${l0}|${l1}`; const hit = tablas.get(k0); if (hit) return hit;
  const ARR = 1.6;                                            // segundos de arranque desde la quietud
  const recorre = (k: number) => {                            // integra L(t) con factor k; devuelve el L en l1 y la tabla
    const n = Math.ceil((l1 - l0 + 6) / PASO), T = new Float32Array(n); let L = L_INICIO;
    for (let i = 0; i < n; i++) {
      const t = i * PASO; T[i] = L;
      const arr = eSuave(Math.min(1, t / ARR));
      L -= velocidad(Math.max(L, 0)) * k * arr * PASO;
    }
    return T;
  };
  let a = 0.3, b = 3;
  for (let it = 0; it < 40; it++) { const m = (a + b) / 2, T = recorre(m), Lf = T[Math.round((l1 - l0) / PASO)]; if (Lf > 0) a = m; else b = m; }
  const T = recorre((a + b) / 2);
  tablas.set(k0, T); return T;
};
export const nivelCierre = (l: number, l0: number, l1: number) => {
  if (ORIGINAL) {
    // el ritmo del original, al revés, desde las neuronas; al final sigue alejándose suave
    const u = (l - l0) / (l1 - l0);
    if (u <= 1) return nivelAlReves(Math.max(0, u));
    const fin = nivelAlReves(1), antes = nivelAlReves(1 - 0.2 / (l1 - l0)), v = Math.min((fin - antes) / 0.2, -0.08);
    return fin - 0.22 * (1 - Math.exp((v / 0.22) * (l - l1)));
  }
  const T = tablaCierre(l0, l1);
  if (l <= l0) return L_INICIO;
  const iFin = Math.round((l1 - l0) / PASO);
  if (l <= l1) { const x = (l - l0) / PASO, i = Math.floor(x); return T[i] + (T[i + 1] - T[i]) * (x - i); }
  // después de la red: misma velocidad de llegada, acercándose suave a un tope que aún cubre el cuadro
  const v = (T[iFin] - T[iFin - 24]) / (24 * PASO), tope = 0.22;
  return T[iFin] - tope * (1 - Math.exp((v / tope) * (l - l1)));
};
export const pintarViaje = (ctx: Ctx, l: number, l0: number, l1: number, cosmos: Map<string, HTMLImageElement>, rotulos: number) => {
  capaZ = lienzo(capaZ); capaE = lienzo(capaE);
  const z = capaZ.getContext("2d")!, ce = capaE.getContext("2d")!;
  z.globalCompositeOperation = "source-over"; z.globalAlpha = 1; z.fillStyle = "#000"; z.fillRect(0, 0, W, H);
  for (let s = 0; s < EXPOS; s++) {
    exposicion(ce, nivelCierre(l + ((s + 0.5) / EXPOS - 0.5) * OBTURADOR, l0, l1), cosmos);
    z.globalCompositeOperation = "lighter"; z.globalAlpha = 1 / EXPOS; z.drawImage(capaE, 0, 0);
  }
  ctx.drawImage(capaZ, 0, 0);
  // la escala de lo que vemos, abajo a la izquierda, mientras su etapa está en pantalla
  const L = nivelCierre(l, l0, l1);
  ETAPAS.forEach((e, i) => {
    if (!e.escala || i === ETAPAS.length - 1) return;
    const fin = i + 1 < ETAPAS.length ? LZ[i + 1] : LZ[i] + 99;
    const a = rotulos * eSuave(cl((L - LZ[i] + 0.05) / 0.3)) * (1 - eSuave(cl((L - fin + 0.35) / 0.3)));
    if (a < 0.02) return;
    texto(ctx, e.escala, 80, 1600, 40, `rgba(${RGB.crema},${0.92 * a})`, { fam: SANS, peso: 600, esp: 2 });
    texto(ctx, e.nombre ?? "", 80, 1642, 18, `rgba(${RGB.crema},${0.65 * a})`, { esp: 5 });
  });
};
