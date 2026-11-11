// CAPÍTULO IX · «El lenguaje y sus rangos» (fractales/GUION-capitulo-9-lenguaje.md). Galileo's book written in the
// language of mathematics (Il Saggiatore, 1623); what this film described with a few rules; Wigner (1960): a gift we
// neither understand nor deserve, and laws of «strictly limited scope»; three ways of answering, left open; two faces:
// the Mandelbrot set nobody chose, and a border whose length depends on the ruler; the bands where each law of the film
// has evidence, on one scale of metres and one of seconds; only mathematics has detail without end.
import K from "./cap9.json";
import { LIMPIO as SIN_TEXTO_TRAILER } from "./limpio";
import D3 from "./cap3_datos.json";
import D5 from "./cap5_datos.json";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { RGB, SANS, MONO, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
type Fotos = Record<string, HTMLImageElement>;
type P = [number, number];
const AMBAR = "255,190,120", AZUL = "150,190,255", ROJO = "255,130,110", COBRE = "232,150,90";
const KT = Math.min(1, W / 1500);
const LIMPIO = (FORMATO as { limpio?: boolean }).limpio === true;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: LIMPIO ? 0 : 0.05, scan: LIMPIO ? 0 : 0.18, ruido: LIMPIO ? 0 : 0.5, grade: 1.8 };
const V = K.voz as number[];

// ─── helpers (as in chapters III–VIII) ──────────────────────────────────────────────────────────────────────────
const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, color: string, op: { fam?: string; peso?: number; alin?: CanvasTextAlign; esp?: number; it?: boolean } = {}) => {
  if (SIN_TEXTO_TRAILER && color !== "#fff") return;
  ctx.font = `${op.it ? "italic " : ""}${op.peso ?? 500} ${tam}px "${op.fam ?? MONO}"`;
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
const nota = (ctx: Ctx, s: string, a: number, x = W / 2, y = H - 40) => {
  if (a > 0.01) texto(ctx, s, x, y, 13 * KT + 4, `rgba(${RGB.crema},${0.55 * a})`, { alin: "center", esp: 4 });
};
const titular = (ctx: Ctx, s: string, y: number, tam: number, a: number, col = RGB.crema) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)";
  texto(ctx, s, W / 2, y, tam, `rgba(${col},${0.35 * a})`, { fam: SANS, peso: 300, alin: "center", esp: 4 }); ctx.restore();
  texto(ctx, s, W / 2, y, tam, `rgba(${col},${0.96 * a})`, { fam: SANS, peso: 300, alin: "center", esp: 4 });
};
const retrato = (ctx: Ctx, img: HTMLImageElement | undefined, x: number, a: number, nombre: string, linea: string, y = H * 0.16, h = H * 0.56) => {
  if (!img || a <= 0.01) return;
  const w = (h * img.width) / img.height;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(2,3,6,0.85)"; ctx.fillRect(x - w / 2 - 14, y - 14, w + 28, h + 28);
  ctx.filter = "sepia(0.35) contrast(1.05) brightness(0.95)";
  ctx.drawImage(img, x - w / 2, y, w, h);
  ctx.filter = "none";
  ctx.strokeStyle = `rgba(${RGB.crema},0.35)`; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2 - 14, y - 14, w + 28, h + 28);
  ctx.restore();
  texto(ctx, nombre, x, y + h + 56, 24 * KT + 6, `rgba(${RGB.crema},${0.92 * a})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
  if (linea) texto(ctx, linea, x, y + h + 90, 15 * KT + 4, `rgba(${AMBAR},${0.85 * a})`, { alin: "center", esp: 5 });
};
const cubre = (ctx: Ctx, im: HTMLImageElement | undefined, x: number, y: number, w: number, h: number, z: number, a: number) => {
  if (!im || a <= 0.01) return;
  const sc = Math.max(w / im.width, h / im.height) * z;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalAlpha = a;
  ctx.drawImage(im, x + w / 2 - (im.width * sc) / 2, y + h / 2 - (im.height * sc) / 2, im.width * sc, im.height * sc);
  ctx.restore();
};
const marco = (ctx: Ctx, x: number, y: number, w: number, h: number, a: number) => {
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.35 * a})`; ctx.lineWidth = 1.2; ctx.strokeRect(x, y, w, h); ctx.restore();
};
const azar = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const sup = (n: number) => String(n).split("").map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c] ?? "⁻").join("");

// ─── 0 · title: the rules of the film, written in light ─────────────────────────────────────────────────────────
const REGLAS = ["z → z² + c", "x → r · x · (1 − x)", "dx/dt = σ (y − x)", "N ∝ r^D", "F(n) ∝ n^α", "L(ε) ∝ ε^(1−D)"];
const titulo = (ctx: Ctx, t: number) => {
  if (t > K.galileo + 0.6) return;
  const a = eSuave(pr(t, 0.2, 1.0)) * (1 - eSuave(pr(t, K.galileo - 0.6, 0.8)));
  const orden = eIO(pr(t, 2.6, 2.2));
  REGLAS.forEach((s, i) => {
    const ai = a * eSuave(pr(t, 0.3 + i * 0.35, 0.8));
    const x0 = W * (0.15 + 0.7 * azar(i * 3 + 1)), y0 = H * (0.15 + 0.7 * azar(i * 5 + 2));
    const x1 = W * (0.12 + (0.76 * i) / (REGLAS.length - 1)), y1 = H * 0.78;
    const x = lerp(x0, x1, orden) + Math.sin(t * 0.6 + i) * 12 * (1 - orden), y = lerp(y0, y1, orden) + Math.cos(t * 0.5 + i * 2) * 10 * (1 - orden);
    const tam = lerp(30, 18, orden) * KT + 6;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(8px)";
    texto(ctx, s, x, y, tam, `rgba(${AMBAR},${0.5 * ai})`, { fam: SANS, peso: 300, alin: "center", esp: 2, it: true }); ctx.restore();
    texto(ctx, s, x, y, tam, `rgba(${RGB.crema},${0.9 * ai})`, { fam: SANS, peso: 300, alin: "center", esp: 2, it: true });
  });
  const ut = t - K.titulo;
  if (ut >= 0) {
    const at = eSuave(pr(ut, 0, 0.5)) * a, tam = 66 * KT, esp = lerp(30, 16, eOut(pr(ut, 0, 4)));
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(14px)";
    texto(ctx, "EL LENGUAJE Y SUS RANGOS", W / 2 + esp / 2, H * 0.46, tam, `rgba(${RGB.crema},${0.35 * at})`, { fam: SANS, peso: 300, alin: "center", esp });
    ctx.restore();
    texto(ctx, "EL LENGUAJE Y SUS RANGOS", W / 2 + esp / 2, H * 0.46, tam, `rgba(${RGB.crema},${0.96 * at})`, { fam: SANS, peso: 300, alin: "center", esp });
    texto(ctx, "CAPÍTULO IX", W / 2 + 8, H * 0.46 - tam * 1.15, 24 * KT + 6, `rgba(${AMBAR},${0.9 * at * eSuave(pr(ut, 0.35, 0.8))})`, { alin: "center", esp: 16 });
  }
};

// ─── 1 · Galileo: the portrait, the title page, the page with the sentence ──────────────────────────────────────
const galileo = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.galileo - 0.6 || t > K.repaso + 0.4) return;
  const a = eSuave(pr(t, K.galileo - 0.5, 0.6)) * (1 - eSuave(pr(t, K.repaso - 0.6, 0.6)));
  // the portrait (to «que el universo…»)
  const ar = a * (1 - eSuave(pr(t, K.portada - 0.3, 0.3)));
  retrato(ctx, f.galileo, W / 2, ar, "GALILEO GALILEI", "1564 – 1642", H * 0.12, H * 0.6);
  if (ar > 0.01) nota(ctx, "RETRATO: JUSTUS SUSTERMANS, 1636 · DOMINIO PÚBLICO", ar);
  // the title page (to «y que está escrito en lengua matemática»)
  const ap = a * ventana(t, K.portada - 0.3, K.pagina + 0.15, 0.3);
  if (ap > 0.01 && f.portada) {
    const im = f.portada, h = H * 0.84 * (1 + 0.03 * pr(t, K.portada, 4)), w = (h * im.width) / im.height;
    ctx.save(); ctx.globalAlpha = ap; ctx.filter = "sepia(0.25) brightness(0.92)"; ctx.drawImage(im, W * 0.34 - w / 2, H * 0.08, w, h); ctx.restore();
    texto(ctx, "IL SAGGIATORE", W * 0.72, H * 0.42, 34 * KT + 8, `rgba(${RGB.crema},${0.95 * ap})`, { fam: SANS, peso: 300, alin: "center", esp: 6 });
    texto(ctx, "ROMA, 1623", W * 0.72, H * 0.42 + 42, 16 * KT + 4, `rgba(${AMBAR},${0.9 * ap})`, { alin: "center", esp: 6 });
    texto(ctx, "EN LA PORTADA: «FILOSOFIA NATURALE» Y «MATEMATICA»", W * 0.72, H * 0.42 + 84, 13 * KT + 4, `rgba(${RGB.crema},${0.7 * ap})`, { alin: "center", esp: 3 });
    nota(ctx, "PORTADA DE IL SAGGIATORE (1623) · DOMINIO PÚBLICO", ap);
  }
  // the page, with the sentence lighting up as the voice says it
  const ag = a * eSuave(pr(t, K.pagina - 0.15, 0.3));
  if (ag > 0.01 && f.pagina) {
    const im = f.pagina, k = pr(t, K.pagina, K.repaso - K.pagina);
    const z = lerp(1.25, 1.35, k), w = W * 0.62 * z, h = w * (im.height / im.width);
    const fy = lerp(0.3, 0.42, eIO(pr(t, K.pagina, 14))), x0 = W / 2 - w * 0.6, y0 = H * 0.5 - h * fy;
    ctx.save(); ctx.globalAlpha = ag; ctx.filter = "invert(1) sepia(0.6) hue-rotate(180deg) brightness(0.85)"; ctx.drawImage(im, x0, y0, w, h); ctx.restore();
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(2,3,6,${0.9 * ag})`); g.addColorStop(0.25, "rgba(2,3,6,0)"); g.addColorStop(0.75, "rgba(2,3,6,0)"); g.addColorStop(1, `rgba(2,3,6,${0.9 * ag})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // the sentence itself, set large over the page, in Italian and then in Spanish, as the voice says each part
    ctx.fillStyle = `rgba(2,3,6,${0.55 * ag})`; ctx.fillRect(0, 0, W, H);
    const frases: [number, string, string][] = [
      [K.pagina, "«Egli è scritto in lingua matematica»", "ESTÁ ESCRITO EN LENGUA MATEMÁTICA"],
      [K.letras, "«e i caratteri son triangoli, cerchi, ed altre figure geometriche»", "SUS LETRAS SON TRIÁNGULOS, CÍRCULOS Y OTRAS FIGURAS GEOMÉTRICAS"],
      [K.laberinto, "«un aggirarsi vanamente per un oscuro laberinto»", "UNO DA VUELTAS EN VANO POR UN OSCURO LABERINTO"],
    ];
    frases.forEach(([tw, it, es], i) => {
      const af = ag * ventana(t, tw - 0.1, (frases[i + 1]?.[0] ?? K.repaso) + 0.2, 0.5);
      if (af <= 0.01) return;
      ctx.fillStyle = `rgba(2,3,6,${0.75 * af})`; ctx.fillRect(W * 0.08, H * 0.38, W * 0.84, H * 0.24);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(10px)";
      texto(ctx, it, W / 2, H * 0.49, 34 * KT + 6, `rgba(${AMBAR},${0.4 * af})`, { fam: "Georgia", peso: 400, alin: "center", esp: 1, it: true }); ctx.restore();
      texto(ctx, it, W / 2, H * 0.49, 34 * KT + 6, `rgba(255,236,205,${0.97 * af})`, { fam: "Georgia", peso: 400, alin: "center", esp: 1, it: true });
      texto(ctx, es, W / 2, H * 0.49 + 54, 16 * KT + 4, `rgba(${AMBAR},${0.9 * af})`, { alin: "center", esp: 4 });
    });
    nota(ctx, "IL SAGGIATORE · EDICIÓN NACIONAL, VOL. VI (1896), P. 232 · DOMINIO PÚBLICO", ag);
  }
};

// «…describieron fronteras, ríos, corazones, antenas y galaxias»: five panels, one shot, each on its word
const RR = (D5.todo as number[]).slice(2000, 2600);
const repaso = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.repaso - 0.6 || t > K.wigner + 0.4) return;
  const a = eSuave(pr(t, K.repaso - 0.4, 0.6)) * (1 - eSuave(pr(t, K.wigner - 0.6, 0.6)));
  const nombres = ["FRONTERAS", "RÍOS", "CORAZONES", "ANTENAS", "GALAXIAS"], fotos = [f.ribera, f.rio, undefined, f.antena, f.galaxias];
  const sube = eIO(pr(t, K.pregunta - 0.3, 0.9));
  const pw = W * 0.17, ph = H * 0.42, y = lerp(H * 0.26, H * 0.36, sube);
  const reglas = a * eSuave(pr(t, K.repaso + 1.4, 0.8));
  texto(ctx, "UNAS POCAS REGLAS, ESCRITAS CON SÍMBOLOS", W / 2, H * 0.14, 20 * KT + 6, `rgba(${RGB.crema},${0.9 * reglas * (1 - sube)})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
  (K.paneles as number[]).forEach((tw, i) => {
    const ai = a * eSuave(pr(t, tw - 0.15, 0.4));
    if (ai <= 0.01) return;
    const x = W * 0.055 + i * (pw + W * 0.02);
    if (i === 2) {
      ctx.fillStyle = `rgba(6,8,14,${ai})`; ctx.fillRect(x, y, pw, ph);
      const pts: P[] = RR.map((v, k) => [x + (k / (RR.length - 1)) * pw, y + ph * 0.5 + (0.8 - v) * ph * 1.6] as P);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, pw, ph); ctx.clip(); trazo(ctx, pts, ROJO, ai, 1.4); ctx.restore();
    } else { if (i === 3) { ctx.save(); ctx.filter = "invert(1) sepia(0.5) brightness(0.85)"; } cubre(ctx, fotos[i], x, y, pw, ph, 1.05 + 0.05 * pr(t, tw, 6), ai); if (i === 3) ctx.restore(); }
    marco(ctx, x, y, pw, ph, ai);
    texto(ctx, nombres[i], x + pw / 2, y + ph + 40, 16 * KT + 4, `rgba(${RGB.crema},${0.9 * ai})`, { alin: "center", esp: 4, peso: 600 });
  });
  titular(ctx, "¿POR QUÉ FUNCIONA DESCRIBIR EL MUNDO CON MATEMÁTICA?", H * 0.14, 26 * KT + 6, a * sube);
  titular(ctx, "¿Y DÓNDE DEJA DE FUNCIONAR?", H * 0.21, 26 * KT + 6, a * eSuave(pr(t, V[2] + 14.2, 0.6)), AMBAR);
  nota(ctx, "EL MIÑO: IGPINNATO, CC BY-SA 3.0 · RÍO NEGRO: NASA · PATENTE US 6.452.553 · CAMPO PROFUNDO: NASA/STSCI", a * eSuave(pr(t, K.paneles[4], 0.5)));
};

// ─── 2 · Wigner ─────────────────────────────────────────────────────────────────────────────────────────────────
const wigner = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.wigner - 0.6 || t > K.posturas + 0.4) return;
  const a = eSuave(pr(t, K.wigner - 0.4, 0.6)) * (1 - eSuave(pr(t, K.posturas - 0.6, 0.6)));
  const lado = eIO(pr(t, K.misterio - 0.3, 1.0));
  retrato(ctx, f.wigner, lerp(W / 2, W * 0.22, lado), a, "EUGENE WIGNER", "1902 – 1995 · NOBEL DE FÍSICA 1963", H * 0.22, H * 0.5);
  texto(ctx, "«THE UNREASONABLE EFFECTIVENESS OF MATHEMATICS", lerp(W / 2, W * 0.64, lado), H * 0.1 + (1 - lado) * H * 0.0, 15 * KT + 4, `rgba(${AMBAR},${0.9 * a * (1 - lado)})`, { alin: "center", esp: 3 });
  texto(ctx, "IN THE NATURAL SCIENCES» · 1960", lerp(W / 2, W * 0.64, lado), H * 0.1 + 26, 15 * KT + 4, `rgba(${AMBAR},${0.9 * a * (1 - lado)})`, { alin: "center", esp: 3 });
  const citas: [number, number, string, string][] = [
    [K.misterio, V[4] - 0.1, "«SOMETHING BORDERING ON THE MYSTERIOUS»", "ROZA LO MISTERIOSO · P. 2"],
    [V[4], K.alcance - 0.1, "«A WONDERFUL GIFT WHICH WE NEITHER UNDERSTAND NOR DESERVE»", "UN REGALO MARAVILLOSO, QUE NO ENTENDEMOS NI MERECEMOS · P. 14"],
    [K.alcance + 2.6, K.posturas + 0.2, "«OF ALMOST FANTASTIC ACCURACY", "PRECISIÓN CASI FANTÁSTICA · P. 10"],
  ];
  citas.forEach(([t0, t1, en, es], i) => {
    const ac = a * lado * ventana(t, t0, t1, 0.5);
    if (ac <= 0.01) return;
    const x = W * 0.64, y = H * 0.4;
    const partes = en.length > 34 ? [en.slice(0, en.lastIndexOf(" ", 34)), en.slice(en.lastIndexOf(" ", 34) + 1)] : [en];
    partes.forEach((p, j) => texto(ctx, p, x, y + j * 46, 30 * KT + 6, `rgba(${RGB.crema},${0.96 * ac})`, { fam: SANS, peso: 300, alin: "center", esp: 2, it: true }));
    texto(ctx, es, x, y + partes.length * 46 + 30, 14 * KT + 4, `rgba(${AMBAR},${0.9 * ac})`, { alin: "center", esp: 3 });
    if (i === 2) {
      const al = a * lado * eSuave(pr(t, K.limitado + 0.6, 0.6)) * ventana(t, t0, t1, 0.5);
      texto(ctx, "BUT OF STRICTLY LIMITED SCOPE»", x, y + 46 * 2 + 70, 30 * KT + 6, `rgba(${AMBAR},${0.96 * al})`, { fam: SANS, peso: 600, alin: "center", esp: 2, it: true });
      texto(ctx, "PERO DE UN ALCANCE ESTRICTAMENTE LIMITADO", x, y + 46 * 2 + 106, 14 * KT + 4, `rgba(${AMBAR},${0.9 * al})`, { alin: "center", esp: 3 });
    }
  });
  nota(ctx, "COMMUNICATIONS ON PURE AND APPLIED MATHEMATICS 13: 1 (1960) · FOTO: DEPARTAMENTO DE ENERGÍA DE EE. UU., DOMINIO PÚBLICO", a);
};

// ─── 3 · three ways of answering ────────────────────────────────────────────────────────────────────────────────
const MAND: { w: number; h: number; it: Uint16Array } = (() => {
  const w = 480, h = 270, it = new Uint16Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const cr = -0.65 + (i / w - 0.5) * 3.2, ci = (j / h - 0.5) * 1.8;
    let x = 0, y = 0, n = 0;
    while (n < 400 && x * x + y * y < 4) { const xt = x * x - y * y + cr; y = 2 * x * y + ci; x = xt; n++; }
    it[j * w + i] = n;
  }
  return { w, h, it };
})();
let lienzo: HTMLCanvasElement | null = null;
const mandel = (ctx: Ctx, n: number, x: number, y: number, w: number, h: number, a: number) => {
  if (a <= 0.01) return;
  if (!lienzo) { lienzo = document.createElement("canvas"); lienzo.width = MAND.w; lienzo.height = MAND.h; }
  const c = lienzo.getContext("2d")!, img = c.createImageData(MAND.w, MAND.h);
  for (let k = 0; k < MAND.it.length; k++) {
    const v = MAND.it[k], dentro = v >= n;
    const borde = !dentro ? Math.min(1, v / n) ** 3 : 0;
    img.data[k * 4] = dentro ? 255 : 120 * borde + 20; img.data[k * 4 + 1] = dentro ? 196 : 150 * borde + 24; img.data[k * 4 + 2] = dentro ? 130 : 255 * borde + 40; img.data[k * 4 + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingQuality = "high"; ctx.drawImage(lienzo, x, y, w, h); ctx.restore();
};
const posturas = (ctx: Ctx, t: number) => {
  if (t < K.posturas - 0.6 || t > K.mandel + 0.4) return;
  const a = eSuave(pr(t, K.posturas - 0.4, 0.6)) * (1 - eSuave(pr(t, K.mandel - 0.6, 0.6)));
  titular(ctx, "TRES MANERAS DE RESPONDER", H * 0.14, 28 * KT + 6, a);
  const cards: [string, string][] = [["DESCUBRIMOS", "ESTRUCTURAS QUE EXISTEN SIN NOSOTROS"], ["INVENTAMOS", "UN LENGUAJE, UN JUEGO DE REGLAS"], ["RELACIONAMOS", "RELACIONES, SIN IMPORTAR DE QUÉ ESTÁN HECHAS LAS COSAS"]];
  (K.tarjetas as number[]).forEach((tw, i) => {
    const ai = a * eSuave(pr(t, tw - 0.2, 0.5));
    if (ai <= 0.01) return;
    const x = W * (0.2 + 0.3 * i), y = H * 0.26, w = W * 0.25, h = H * 0.44;
    ctx.fillStyle = `rgba(10,12,20,${0.85 * ai})`; ctx.fillRect(x - w / 2, y, w, h); marco(ctx, x - w / 2, y, w, h, ai);
    const cy = y + h * 0.42, k = pr(t, tw, 4);
    if (i === 0) {
      // a lamp sweeping a dark field, revealing a shape that was already there
      ctx.save(); ctx.beginPath(); ctx.arc(x + Math.cos(k * 4) * w * 0.15, cy + Math.sin(k * 3) * h * 0.08, h * 0.24, 0, Math.PI * 2); ctx.clip();
      mandel(ctx, 60, x - w * 0.42, cy - h * 0.3, w * 0.84, h * 0.6, ai); ctx.restore();
    }
    if (i === 1) {
      const s = "∑ ∫ ∂ ∞ ≈ → √ π";
      texto(ctx, s.slice(0, Math.floor(s.length * Math.min(1, k * 1.6))), x, cy + 14, 36 * KT + 6, `rgba(${RGB.crema},${0.95 * ai})`, { fam: SANS, peso: 300, alin: "center", esp: 6 });
    }
    if (i === 2) {
      const nodos: P[] = Array.from({ length: 7 }, (_, j) => [x + Math.cos(j * 0.9 + k) * w * 0.28, cy + Math.sin(j * 1.7 + k * 0.7) * h * 0.2] as P);
      nodos.forEach((p, j) => nodos.forEach((q, m) => { if (m > j && (j + m) % 3 === 0) trazo(ctx, [p, q], AZUL, ai * 0.7, 1.2); }));
      nodos.forEach(([px, py]) => luz(ctx, px, py, 14, ai, AZUL));
    }
    texto(ctx, cards[i][0], x, y + h * 0.78, 24 * KT + 6, `rgba(${RGB.crema},${0.95 * ai})`, { fam: SANS, peso: 600, alin: "center", esp: 5 });
    const l = cards[i][1], corte = l.length > 30 ? l.lastIndexOf(" ", 30) : -1;
    (corte > 0 ? [l.slice(0, corte), l.slice(corte + 1)] : [l]).forEach((p, j) => texto(ctx, p, x, y + h * 0.78 + 34 + j * 24, 13 * KT + 4, `rgba(${AMBAR},${0.9 * ai})`, { alin: "center", esp: 2 }));
  });
  const ad = a * eSuave(pr(t, V[7], 0.6));
  texto(ctx, "EL DEBATE SIGUE ABIERTO", W / 2, H * 0.86, 20 * KT + 6, `rgba(${RGB.crema},${0.9 * ad})`, { fam: SANS, peso: 600, alin: "center", esp: 5 });
  nota(ctx, "PLATONISMO · FORMALISMO Y FICCIONALISMO · ESTRUCTURALISMO · STANFORD ENCYCLOPEDIA OF PHILOSOPHY", a);
};

// ─── 4 · two faces: a shape nobody chose; a length that depends on the ruler ────────────────────────────────────
const EP = D3.espana_portugal as unknown as { piezas: number[][][]; medidas: Record<string, { largo: number; caminatas: number[][][] }> };
const caras = (ctx: Ctx, t: number) => {
  if (t < K.mandel - 0.6 || t > K.bandas + 0.4) return;
  const a = eSuave(pr(t, K.mandel - 0.4, 0.6)) * (1 - eSuave(pr(t, K.bandas - 0.6, 0.6)));
  const am = a * (1 - eSuave(pr(t, K.frontera - 0.3, 0.6)));
  if (am > 0.01) {
    const n = Math.round(lerp(1, 160, eIO(pr(t, K.mandel + 0.3, 6.5))));
    mandel(ctx, n, W * 0.1, H * 0.12, W * 0.8, H * 0.72, am);
    texto(ctx, `REGLA REPETIDA ${n} VECES`, W - 84, H * 0.9, 15 * KT + 4, `rgba(${RGB.crema},${0.7 * am})`, { alin: "right", esp: 3 });
    titular(ctx, "NADIE ELIGIÓ ESTA FORMA", H * 0.1, 28 * KT + 6, am * eSuave(pr(t, K.mandel + 3.9, 0.6)));
  }
  const af = a * eSuave(pr(t, K.frontera - 0.3, 0.6));
  if (af > 0.01) {
    // the border, fitted to the frame, and the three compass walks of chapter III
    const todos = EP.piezas.flat();
    const xs = todos.map((p) => p[0]), ys = todos.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min((W * 0.36) / (x1 - x0), (H * 0.74) / (y1 - y0)), ox = W * 0.3 - ((x0 + x1) / 2) * s, oy = H * 0.5 - ((y0 + y1) / 2) * s;
    const M = (p: number[]): P => [ox + p[0] * s, oy + p[1] * s];
    EP.piezas.forEach((pz) => trazo(ctx, pz.map(M), RGB.crema, af * 0.55, 1.2));
    ([["80", AZUL, 0], ["20", RGB.crema, 1], ["5", AMBAR, 2]] as [string, string, number][]).forEach(([k, col, i]) => {
      const ai = af * eSuave(pr(t, K.frontera + 1.2 + i * 0.9, 0.5));
      if (ai <= 0.01) return;
      EP.medidas[k].caminatas.forEach((c) => trazo(ctx, c.map(M), col, ai * 0.85, 1.8));
      texto(ctx, `PASO ${k} KM`, W * 0.62, H * (0.36 + i * 0.12), 18 * KT + 4, `rgba(${col},${0.95 * ai})`, { esp: 3 });
      texto(ctx, `${Math.round(EP.medidas[k].largo).toLocaleString("es-CL")} KM`, W * 0.86, H * (0.36 + i * 0.12), 26 * KT + 6, `rgba(${col},${0.95 * ai})`, { fam: SANS, peso: 600, alin: "right", esp: 2 });
    });
    titular(ctx, "EL LARGO DEPENDE DE LA REGLA", H * 0.1, 28 * KT + 6, af * eSuave(pr(t, K.frontera + 2.7, 0.6)));
    const ae = af * eSuave(pr(t, K.encontramos, 0.6));
    texto(ctx, "UNA PARTE LA ENCONTRAMOS · OTRA PARTE LA PONEMOS NOSOTROS", W / 2, H * 0.9, 17 * KT + 4, `rgba(${AMBAR},${0.95 * ae})`, { alin: "center", esp: 3 });
    nota(ctx, "LA FRONTERA ESPAÑA–PORTUGAL, MEDIDA EN EL CAPÍTULO III · NATURAL EARTH", af);
  }
};

// ─── 5 · the bands: where each law of the film has evidence ─────────────────────────────────────────────────────
const bandas = (ctx: Ctx, t: number) => {
  if (t < K.bandas - 0.6 || t > K.total) return;
  const a = eSuave(pr(t, K.bandas - 0.4, 0.8)) * (1 - eSuave(pr(t, K.total - 2.2, 1.8)));
  const x0 = W * 0.08, x1 = W * 0.92, p0 = -6, p1 = 26;
  const X = (lg: number) => lerp(x0, x1, (lg - p0) / (p1 - p0));
  const yM = H * 0.62;
  // the ruler of metres
  trazo(ctx, [[x0, yM], [x1, yM]], RGB.crema, a * 0.6, 1.4);
  for (let p = p0; p <= p1; p++) { const big = p % 3 === 0; trazo(ctx, [[X(p), yM - (big ? 10 : 5)], [X(p), yM + (big ? 10 : 5)]], RGB.crema, a * 0.45, 1); if (big) texto(ctx, `10${sup(p)}`, X(p), yM + 36, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "center", esp: 1 }); }
  texto(ctx, "METROS", x1 + 18, yM + 5, 12 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { alin: "left", esp: 3 });
  // the bands (log10 of metres); each on its word
  const MPC = 3.086e22;
  const lista: [number, number, number, string, string, string][] = [
    [K.b_antena, Math.log10(0.0068), Math.log10(0.109), "LA ANTENA · 5 ESCALAS", "0,68 – 10,9 CM", COBRE],
    [K.b_frontera, Math.log10(5e3), Math.log10(8e4), "LA FRONTERA · D ≈ 1,12", "PASOS DE 5 A 80 KM", AMBAR],
    [K.b_galaxias, Math.log10(12.6 / 0.7 * MPC), Math.log10(70 / 0.7 * MPC), "LAS GALAXIAS, AGRUPADAS", "HASTA ~70 H⁻¹ MPC", AZUL],
    [K.b_galaxias + 1.6, Math.log10(1e-5), Math.log10(1.6e-3), "NEURONAS ≈", "0,01 – 1,6 MM", ROJO],
    [K.b_galaxias + 1.6, Math.log10(MPC), Math.log10(100 * MPC), "≈ RED CÓSMICA", "1 – 100 MPC", ROJO],
  ];
  lista.forEach(([tw, l0, l1, nom, ran, col], i) => {
    const ai = a * eSuave(pr(t, tw - 0.1, 0.5)), k = eOut(pr(t, tw - 0.1, 0.9));
    if (ai <= 0.01) return;
    const y = i >= 3 ? yM + 54 : yM - 30 - i * 14, bx0 = X(l0), bx1 = lerp(bx0, X(l1), k);
    ctx.fillStyle = `rgba(${col},${0.7 * ai})`; ctx.fillRect(bx0, y - 7, Math.max(3, bx1 - bx0), 14);
    luz(ctx, bx0, y, 16, ai * 0.8, col); luz(ctx, bx1, y, 16, ai * 0.8, col);
    const ly = i >= 3 ? yM + 92 : H * 0.24 + i * 46;
    if (nom) texto(ctx, nom, (bx0 + bx1) / 2, ly, 15 * KT + 4, `rgba(${col},${0.95 * ai})`, { alin: "center", esp: 3, peso: 600 });
    texto(ctx, ran, (bx0 + bx1) / 2, ly + 22 + (i === 4 ? 0 : 0), 12 * KT + 4, `rgba(${col},${0.85 * ai})`, { alin: "center", esp: 2 });
    if (i < 3) trazo(ctx, [[(bx0 + bx1) / 2, ly + 30], [(bx0 + bx1) / 2, y - 10]], col, ai * 0.35, 1);
  });
  // the ruler of time, for the heart
  const ac = a * eSuave(pr(t, K.corazon - 0.2, 0.6)), yT = H * 0.8;
  if (ac > 0.01) {
    const T = (lg: number) => lerp(W * 0.3, W * 0.92, (lg + 1) / 6);
    trazo(ctx, [[W * 0.3, yT], [W * 0.92, yT]], RGB.crema, ac * 0.6, 1.4);
    for (let p = -1; p <= 5; p++) { trazo(ctx, [[T(p), yT - 8], [T(p), yT + 8]], RGB.crema, ac * 0.45, 1); texto(ctx, `10${sup(p)}`, T(p), yT + 34, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * ac})`, { alin: "center", esp: 1 }); }
    texto(ctx, "SEGUNDOS", W * 0.92 + 18, yT + 5, 12 * KT + 4, `rgba(${RGB.crema},${0.6 * ac})`, { alin: "left", esp: 3 });
    const k = eOut(pr(t, K.corazon + 3.8, 1.0)), b0 = T(Math.log10(80)), b1 = lerp(b0, T(Math.log10(8000)), k);
    ctx.fillStyle = `rgba(${ROJO},${0.7 * ac})`; ctx.fillRect(b0, yT - 27, Math.max(3, b1 - b0), 14);
    texto(ctx, "EL CORAZÓN · α ≈ 1 · DE 10² A 10⁴ LATIDOS", (b0 + T(Math.log10(8000))) / 2, yT - 42, 14 * KT + 4, `rgba(${ROJO},${0.95 * ac})`, { alin: "center", esp: 3, peso: 600 });
    texto(ctx, "EN EL TIEMPO", W * 0.2, yT + 6, 15 * KT + 4, `rgba(${RGB.crema},${0.8 * ac})`, { alin: "center", esp: 4 });
  }
  // only mathematics: a band with no edges
  const ai = a * eSuave(pr(t, K.infinito - 0.2, 0.8));
  if (ai > 0.01) {
    const y = H * 0.12, g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, `rgba(${AMBAR},0)`); g.addColorStop(0.15, `rgba(${AMBAR},${0.55 * ai})`); g.addColorStop(0.85, `rgba(${AMBAR},${0.55 * ai})`); g.addColorStop(1, `rgba(${AMBAR},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, y - 7, W, 14);
    texto(ctx, "LA MATEMÁTICA · EL DETALLE SIGUE SIN FIN", W / 2, y - 18, 16 * KT + 4, `rgba(${AMBAR},${0.95 * ai})`, { alin: "center", esp: 4, peso: 600 });
  }
  // not limits of nature: the ranges the evidence supports; past the edges, questions
  const ae = a * ventana(t, K.evidencia, K.puente + 0.4, 0.6);
  if (ae > 0.01) { ctx.fillStyle = `rgba(2,3,6,${0.85 * ae})`; ctx.fillRect(W / 2 - W * 0.36, H * 0.885, W * 0.72, 56); texto(ctx, "NO SON LÍMITES DE LA NATURALEZA · SON LOS RANGOS QUE LA EVIDENCIA RESPALDA", W / 2, H * 0.885 + 36, 16 * KT + 4, `rgba(${RGB.crema},${0.95 * ae})`, { alin: "center", esp: 3 }); }
  // «Más allá de sus bordes…» and the bridge: every edge glows
  const ab = a * eSuave(pr(t, K.bordes, 0.8));
  if (ab > 0.01) lista.forEach(([, l0, l1, , , col], i) => { const y = i >= 3 ? yM + 54 : yM - 30 - i * 14, pulso = 0.6 + 0.4 * Math.sin(t * 3 + i); luz(ctx, X(l0), y, 34, ab * pulso, col); luz(ctx, X(l1), y, 34, ab * pulso, col); });
};

export const dibujarCap9 = (ctx: Ctx, t: number, frame: number, fotos: Fotos) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  titulo(ctx, t);
  galileo(ctx, t, fotos);
  repaso(ctx, t, fotos);
  wigner(ctx, t, fotos);
  posturas(ctx, t);
  caras(ctx, t);
  bandas(ctx, t);
  const fin = eSuave(pr(t, K.total - 1.2, 1.2)), ini = 1 - eSuave(pr(t, 0, 0.6));
  if (fin + ini > 0) { ctx.fillStyle = `rgba(2,3,6,${Math.min(1, fin + ini)})`; ctx.fillRect(0, 0, W, H); }
  let golpe = 0;
  for (const g of [K.titulo]) if (t >= g && t - g < 1.5) golpe = Math.max(golpe, 0.9 * Math.exp(-(t - g) * 3));
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.92, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: golpe * 0.4, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
