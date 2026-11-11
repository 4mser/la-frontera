// CAPÍTULO VII · «Del patrón a la herramienta» (fractales/GUION-capitulo-7-herramienta.md). Three tools, each with a
// problem, what the geometry brings, a result and a limit: the Sierpiński antenna (Puente et al. 1996) and its five
// bands; landscapes by midpoint displacement (Carpenter 1980; Fournier, Fussell & Carpenter 1982) and a border invented
// with the measured roughness of chapter III; a real fundus photograph turned into a number (herramientas/retina_cap7.py).
// The close: every tool works in a range; out to the cosmic web.
import K from "./cap7.json";
import { LIMPIO as SIN_TEXTO_TRAILER } from "./limpio";
import RET from "./cap7_retina.json";
import CAN from "./cap7_cancer.json";
import D5 from "./cap5_datos.json";
import FORMATO from "./formato.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { RGB, SANS, MONO, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = FORMATO.W;
export const H = FORMATO.H;
type Ctx = CanvasRenderingContext2D;
type Fotos = Record<string, HTMLImageElement>;
type P = [number, number];
const AMBAR = "255,190,120", AZUL = "150,190,255", COBRE = "232,150,90";
const KT = Math.min(1, W / 1500);
const LIMPIO = (FORMATO as { limpio?: boolean }).limpio === true;
const RETRO = { bloom: 0.36, halo: 0.75, aberr: 0.03, vineta: 0.62, grano: LIMPIO ? 0 : 0.05, scan: LIMPIO ? 0 : 0.18, ruido: LIMPIO ? 0 : 0.5, grade: 1.8 };
const V = K.voz as number[];

// ─── helpers (as in chapters III–VI) ────────────────────────────────────────────────────────────────────────────
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
const rotulo = (ctx: Ctx, nombre: string, linea: string, a: number, x = 84, y = H - 128, alin: CanvasTextAlign = "left") => {
  if (a <= 0.01) return;
  texto(ctx, nombre, x, y, 26 * KT + 6, `rgba(${RGB.crema},${0.92 * a})`, { fam: SANS, peso: 600, esp: 3, alin });
  if (linea) texto(ctx, linea, x, y + 36, 16 * KT + 4, `rgba(${AMBAR},${0.8 * a})`, { esp: 5, alin });
};
const nota = (ctx: Ctx, s: string, a: number, x = W / 2, y = H - 40) => {
  if (a > 0.01) texto(ctx, s, x, y, 13 * KT + 4, `rgba(${RGB.crema},${0.55 * a})`, { alin: "center", esp: 4 });
};
const retrato = (ctx: Ctx, img: HTMLImageElement | undefined, x: number, a: number, nombre: string, linea: string, y = H * 0.2, h = H * 0.5) => {
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
const etiqueta = (ctx: Ctx, s: string, a: number) => {
  if (a <= 0.01) return;
  ctx.font = `600 ${15 * KT + 4}px "${MONO}"`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "5px";
  const w = ctx.measureText(s).width + 36;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.8 * a})`; ctx.lineWidth = 1.4; ctx.strokeRect(W - 84 - w, 60, w, 44); ctx.restore();
  texto(ctx, s, W - 84 - w / 2, 89, 15 * KT + 4, `rgba(${AMBAR},${0.95 * a})`, { alin: "center", esp: 5, peso: 600 });
};
const titular = (ctx: Ctx, s: string, y: number, tam: number, a: number, col = RGB.crema) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)";
  texto(ctx, s, W / 2, y, tam, `rgba(${col},${0.35 * a})`, { fam: SANS, peso: 300, alin: "center", esp: 4 }); ctx.restore();
  texto(ctx, s, W / 2, y, tam, `rgba(${col},${0.96 * a})`, { fam: SANS, peso: 300, alin: "center", esp: 4 });
};
// a deterministic random, for the landscapes
const azar = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ─── the Sierpiński triangle, as copper, at a given depth ──────────────────────────────────────────────────────
const sierpinski = (ctx: Ctx, cx: number, base: number, lado: number, nivel: number, a: number, resalta = -1) => {
  if (a <= 0.01) return;
  const tri = (x: number, y: number, l: number, n: number, prof: number) => {
    if (n <= 0 || l < 3) {
      ctx.fillStyle = `rgba(255,${Math.round(150 + 40 * a)},${Math.round(90 + 30 * a)},${0.9 * a})`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y); ctx.lineTo(x + l / 2, y - (l * Math.sqrt(3)) / 2); ctx.closePath(); ctx.fill();
      return;
    }
    if (prof === resalta) {
      ctx.save(); ctx.strokeStyle = `rgba(255,240,220,${0.9 * a})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y); ctx.lineTo(x + l / 2, y - (l * Math.sqrt(3)) / 2); ctx.closePath(); ctx.stroke(); ctx.restore();
    }
    tri(x, y, l / 2, n - 1, prof + 1); tri(x + l / 2, y, l / 2, n - 1, prof + 1); tri(x + l / 4, y - (l * Math.sqrt(3)) / 4, l / 2, n - 1, prof + 1);
  };
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(10px)";
  tri(cx - lado / 2, base, lado, nivel, 0);
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  tri(cx - lado / 2, base, lado, nivel, 0);
  ctx.restore();
};

// ─── 0 · title; 1 · the question ────────────────────────────────────────────────────────────────────────────────
const titulo = (ctx: Ctx, t: number, f: Fotos) => {
  if (t > K.antena + 0.4) return;
  const a = eSuave(pr(t, 0.3, 1.0)) * (1 - eSuave(pr(t, K.pregunta - 0.6, 1.0)));
  const nivel = Math.min(6, Math.floor(pr(t, 0.6, 4.0) * 7));
  sierpinski(ctx, W / 2, H * 0.86, H * 0.78, nivel, a * 0.9);
  for (const [x, y] of [[W / 2, H * 0.86 - H * 0.78 * 0.866], [W / 2 - H * 0.39, H * 0.86], [W / 2 + H * 0.39, H * 0.86]] as P[]) luz(ctx, x, y, 40, a * 0.5, COBRE);
  const ut = t - K.titulo;
  if (ut >= 0) {
    const at = eSuave(pr(ut, 0, 0.5)) * a;
    ctx.fillStyle = `rgba(2,3,6,${0.5 * at})`; ctx.fillRect(0, 0, W, H);
    const tam = 66 * KT, esp = lerp(30, 16, eOut(pr(ut, 0, 4)));
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(14px)";
    texto(ctx, "DEL PATRÓN A LA HERRAMIENTA", W / 2 + esp / 2, H * 0.5, tam, `rgba(${RGB.crema},${0.35 * at})`, { fam: SANS, peso: 300, alin: "center", esp });
    ctx.restore();
    texto(ctx, "DEL PATRÓN A LA HERRAMIENTA", W / 2 + esp / 2, H * 0.5, tam, `rgba(${RGB.crema},${0.96 * at})`, { fam: SANS, peso: 300, alin: "center", esp });
    texto(ctx, "CAPÍTULO VII", W / 2 + 8, H * 0.5 - tam * 1.15, 24 * KT + 6, `rgba(${AMBAR},${0.9 * at * eSuave(pr(ut, 0.35, 0.8))})`, { alin: "center", esp: 16 });
  }
  // the question, then three cards
  const aq = ventana(t, K.pregunta, K.antena + 0.2, 0.8);
  if (aq > 0.01) {
    // what we have looked at so far: each word with its image, kept until the voice asks the question
    const [rM, rN, rR] = K.repaso as number[];
    const pw = W * 0.26, ph = H * 0.44, py = H * 0.3;
    ([["LA MATEMÁTICA", rM], ["LA NATURALEZA", rN], ["EL RITMO DE UN CORAZÓN", rR]] as [string, number][]).forEach(([s, tw], i) => {
      const ai = aq * eSuave(pr(t, tw - 0.2, 0.5)) * (1 - eSuave(pr(t, K.tarjetas - 0.8, 0.7)));
      if (ai <= 0.01) return;
      const x = W * (0.2 + 0.3 * i), x0 = x - pw / 2;
      texto(ctx, s, x, H * 0.24, 24 * KT + 6, `rgba(${RGB.crema},${0.95 * ai})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
      ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.35 * ai})`; ctx.strokeRect(x0, py, pw, ph); ctx.restore();
      if (i === 0) {
        // a Koch snowflake that grows one level per half second
        const lv = Math.min(5, Math.floor(pr(t, tw, 3.0) * 6)), R = ph * 0.36, cy = py + ph * 0.52;
        const v: P[] = [0, 1, 2].map((k) => [x + R * Math.cos(-Math.PI / 2 + (k * 2 * Math.PI) / 3), cy + R * Math.sin(-Math.PI / 2 + (k * 2 * Math.PI) / 3)]);
        let pts: P[] = [v[0], v[1], v[2], v[0]];
        for (let n = 0; n < lv; n++) {
          const q: P[] = [];
          for (let j = 0; j < pts.length - 1; j++) {
            const [ax, ay] = pts[j], [bx, by] = pts[j + 1], dx = (bx - ax) / 3, dy = (by - ay) / 3;
            const p1: P = [ax + dx, ay + dy], p2: P = [ax + 2 * dx, ay + 2 * dy];
            q.push([ax, ay], p1, [p1[0] + dx * 0.5 + (dy * Math.sqrt(3)) / 2, p1[1] + dy * 0.5 - (dx * Math.sqrt(3)) / 2], p2);
          }
          q.push(pts[pts.length - 1]); pts = q;
        }
        trazo(ctx, pts, RGB.crema, ai, 1.6);
      } else if (i === 1 && f.helecho) {
        const im = f.helecho, sc = Math.max(pw / im.width, ph / im.height) * (1.05 + 0.06 * pr(t, tw, 6));
        ctx.save(); ctx.globalAlpha = ai; ctx.beginPath(); ctx.rect(x0, py, pw, ph); ctx.clip();
        ctx.drawImage(im, x - (im.width * sc) / 2, py + ph / 2 - (im.height * sc) / 2, im.width * sc, im.height * sc); ctx.restore();
        texto(ctx, "FOTO: GEOFF MCKAY · CC BY 2.0", x, py + ph + 26, 12 * KT + 4, `rgba(${RGB.crema},${0.55 * ai})`, { alin: "center", esp: 3 });
      } else if (i === 2) {
        // the real heartbeat of chapter V, scrolling, one point per beat
        const RR = D5.sano.latidos as number[];
        let tb = tw - 10, k = 0;   // already beating: ten seconds of beats before it appears
        const tiempos: number[] = [];
        while (tb < t && k < RR.length) { tiempos.push(tb); tb += RR[k++]; }
        const n = tiempos.length, vel = pw / 14;
        const pts: P[] = [];
        for (let j = Math.max(0, n - 20); j < n; j++) pts.push([x0 + pw - 30 - (t - tiempos[j]) * vel, py + ph * 0.55 - ((RR[j] - 0.78) / 0.15) * ph * 0.16]);
        const vis = pts.filter(([px]) => px > x0 + 8);
        trazo(ctx, vis, AZUL, ai, 1.8);
        for (const [px, pyy] of vis) { ctx.fillStyle = `rgba(${AZUL},${ai})`; ctx.beginPath(); ctx.arc(px, pyy, 3.5, 0, Math.PI * 2); ctx.fill(); }
        const e = n ? pr(t, tiempos[n - 1], 0.6) : 1;
        luz(ctx, x0 + pw - 30, py + ph * 0.55, 18 + 40 * (1 - e), ai * (0.5 + 0.5 * (1 - e)), AZUL);
      }
    });
    const aqq = eSuave(pr(t, K.repaso[3] + 0.3, 0.7));
    titular(ctx, "¿QUÉ PASA CUANDO DEJAMOS DE MIRARLOS", H * 0.08, 34 * KT + 8, aq * aqq);
    titular(ctx, "Y EMPEZAMOS A USARLOS?", H * 0.08 + 54, 36 * KT + 8, aq * eSuave(pr(t, K.repaso[3] + 2.2, 0.8)), AMBAR);
    (["DISEÑAR · UNA ANTENA", "REPRESENTAR · UN PAISAJE", "MEDIR · UNA RETINA"] as const).forEach((s, i) => {
      const ai = aq * eSuave(pr(t, K.tarjetas + i * 0.9, 0.6)), x = W * (0.2 + 0.3 * i), y = H * 0.55;
      if (ai <= 0.01) return;
      ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.45 * ai})`; ctx.strokeRect(x - W * 0.12, y, W * 0.24, H * 0.26); ctx.restore();
      if (i === 0) sierpinski(ctx, x, y + H * 0.21, H * 0.18, 4, ai);
      if (i === 1) { const pts: P[] = []; for (let k = 0; k <= 64; k++) pts.push([x - W * 0.1 + (k / 64) * W * 0.2, y + H * 0.19 - Math.abs(Math.sin(k * 0.21)) * H * 0.07 - azar(k) * H * 0.04]); trazo(ctx, pts, RGB.crema, ai, 1.6); }
      if (i === 2) { ctx.save(); ctx.strokeStyle = `rgba(255,150,130,${0.8 * ai})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y + H * 0.13, H * 0.09, 0, Math.PI * 2); ctx.stroke(); for (let k = 0; k < 6; k++) { const th = k * 1.05; ctx.beginPath(); ctx.moveTo(x + H * 0.03, y + H * 0.13); ctx.quadraticCurveTo(x + Math.cos(th) * H * 0.05, y + H * 0.13 + Math.sin(th) * H * 0.07, x + Math.cos(th) * H * 0.085, y + H * 0.13 + Math.sin(th) * H * 0.085); ctx.stroke(); } ctx.restore(); }
      texto(ctx, s, x, y + H * 0.26 + 40, 17 * KT + 4, `rgba(${RGB.crema},${0.9 * ai})`, { alin: "center", esp: 4, peso: 600 });
    });
  }
};

// the radio amateur's story (Cohen, 1995), drawn: s is the time in his sentence (voz 2), anchored to its words
const pulso = (s: number, ts: number[]) => ts.reduce((m, x) => Math.max(m, s >= x ? Math.exp(-(s - x) * 3) : 0), 0);
const W2 = (Object.fromEntries(((K.vozPal as [string, number][][])[2] ?? []).map(([w, s], i) => [`${w}${i}`, s])) as Record<string, number>);
const vicsek = (ctx: Ctx, x: number, y: number, l: number, n: number, a: number, brillo = 1) => {
  const cuadro = (x: number, y: number, l: number, n: number) => {
    if (n === 0) { ctx.fillRect(x - l / 2, y - l / 2, l, l); return; }
    const s = l / 3;
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) cuadro(x + dx * s, y + dy * s, s, n - 1);
  };
  ctx.save(); ctx.globalAlpha = a;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = `blur(${Math.max(4, l * 0.03)}px)`; ctx.fillStyle = `rgba(200,215,240,${0.22 * brillo})`; cuadro(x, y, l, n); ctx.restore();
  const g = ctx.createLinearGradient(x - l / 2, y - l / 2, x + l / 2, y + l / 2);
  g.addColorStop(0, "rgb(200,204,214)"); g.addColorStop(0.35, "rgb(120,126,142)"); g.addColorStop(0.6, "rgb(190,195,208)"); g.addColorStop(1, "rgb(110,116,132)");
  ctx.fillStyle = g; cuadro(x, y, l, n);
  ctx.restore();
};
const historia = (ctx: Ctx, s: number, a: number) => {
  const P = (w: string) => W2[w] ?? 0;
  const sRadio = P("radioaficionado7"), sNo = P("no10"), sAnt = P("antenas13"), sAsi = P("Así17"), sPapel = P("papel23"), sFractal = P("fractal28");
  const sPego = P("pegó31"), sFunc = P("Funcionó35"), sDueno = P("dueño39"), sCorto = P("cortó43");
  // beat 1-2: the city at night, the camera pushing in to the 27th-floor window
  const aCiudad = a * (1 - eSuave(pr(s, sNo, 0.3)));
  const aBalcon = a * eSuave(pr(s, sPego - 0.1, 0.3));
  if (aCiudad > 0.01 || aBalcon > 0.01) {
    const zoom = 1 + 11 * eIO(pr(s, sRadio - 0.2, 1.8));
    const tx = W * 0.5, bw0 = W * 0.12, ph0 = (H - H * 0.06) / 30;
    const fx = tx - bw0 / 2 + bw0 * 0.385, fy = H * 0.06 + 3 * ph0 + ph0 * 0.5;   // the 27th-floor window, where the push ends
    const ez = (zoom - 1) / 11;
    ctx.save(); ctx.globalAlpha = Math.max(aCiudad, 0);
    ctx.translate(lerp(fx, W / 2, ez), lerp(fy, H * 0.45, ez)); ctx.scale(zoom, zoom); ctx.translate(-fx, -fy);
    // sky, moon, a far skyline, then the buildings
    luz(ctx, W * 0.82, H * 0.16, 60, 0.7, RGB.crema);
    for (let k = 0; k < 60; k++) luz(ctx, azar(k) * W, azar(k + 99) * H * 0.4, 2 + azar(k + 7) * 2, 0.5 * azar(k + 3), RGB.crema);
    for (let capa = 0; capa < 2; capa++) for (let k = 0; k < 18; k++) {
      const bw = W * (0.04 + azar(k + capa * 40) * 0.05), bx = (k / 18) * W * 1.1 - W * 0.05, bh = H * (0.2 + azar(k * 3 + capa) * (capa ? 0.35 : 0.2));
      if (capa === 1 && Math.abs(bx + bw / 2 - tx) < W * 0.08) continue;
      ctx.fillStyle = capa ? "rgb(18,22,34)" : "rgb(12,15,26)"; ctx.fillRect(bx, H - bh - (capa ? 0 : H * 0.04), bw, bh);
      if (capa) for (let p = 0; p < 14; p++) for (let v = 0; v < 3; v++) if (azar(k * 31 + p * 7 + v) > 0.62) { ctx.fillStyle = `rgba(255,214,150,${0.25 + 0.3 * azar(p + v + k)})`; ctx.fillRect(bx + bw * (0.15 + v * 0.27), H - bh + p * (bh / 14) + 6, bw * 0.14, bh / 14 * 0.45); }
    }
    // his building: 30 floors, the 27th with its window
    const bw = W * 0.12, pisos = 30, top = H * 0.06, ph = (H - top) / pisos, bx = tx - bw / 2;
    ctx.fillStyle = "rgb(24,28,42)"; ctx.fillRect(bx, top, bw, H - top);
    for (let p = 0; p < pisos; p++) for (let v = 0; v < 4; v++) if (p !== 3 || v !== 1) if (azar(p * 11 + v) > 0.5) { ctx.fillStyle = `rgba(255,214,150,${0.2 + 0.25 * azar(p * 3 + v)})`; ctx.fillRect(bx + bw * (0.08 + v * 0.23), top + p * ph + ph * 0.25, bw * 0.15, ph * 0.5); }
    const wx = bx + bw * (0.08 + 0.23), wy = top + 3 * ph + ph * 0.25, ww = bw * 0.15, wh = ph * 0.5;
    const enc = eSuave(pr(s, sRadio, 0.4));
    ctx.fillStyle = `rgba(255,190,110,${0.15 + 0.85 * enc})`; ctx.fillRect(wx, wy, ww, wh);
    // inside the window: a man at his radio, headphones on, a glowing dial
    if (enc > 0.01) {
      ctx.save(); ctx.globalAlpha *= enc; ctx.fillStyle = "rgb(40,26,18)";
      const hx = wx + ww * 0.35, hy = wy + wh * 0.42, r = wh * 0.13;
      ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx, hy + r * 2.6, r * 1.5, r * 1.6, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = "rgb(40,26,18)"; ctx.lineWidth = r * 0.3; ctx.beginPath(); ctx.arc(hx, hy, r * 1.25, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.fillRect(wx + ww * 0.55, wy + wh * 0.55, ww * 0.38, wh * 0.25);
      ctx.restore();
      luz(ctx, wx + ww * 0.7, wy + wh * 0.66, wh * 0.08, enc, "120,255,170");
    }
    ctx.restore();
    // words, outside the zoom
    titular(ctx, "FINES DE LOS AÑOS 80 · BOSTON", H * 0.12, 26 * KT + 6, aCiudad * eSuave(pr(s, P("ochenta5") - 0.3, 0.4)));
    texto(ctx, "UN RADIOAFICIONADO · PISO 27", W / 2, H * 0.82, 20 * KT + 6, `rgba(${AMBAR},${0.95 * aCiudad * eSuave(pr(s, sRadio + 0.6, 0.4))})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
  }
  // beat 3: the lease, and the clause
  const aCont = a * ventana(s, sNo - 0.1, sAsi + 0.1, 0.3);
  if (aCont > 0.01) {
    const sube = eIO(pr(s, sNo - 0.1, 0.5)), cx = W / 2, cw = H * 0.6, ch = H * 0.8, cy = H * 0.1 + (1 - sube) * H * 0.5;
    ctx.save(); ctx.globalAlpha = aCont; ctx.translate(cx, cy + ch / 2); ctx.rotate(-0.03); ctx.translate(-cx, -(cy + ch / 2));
    ctx.fillStyle = "rgb(178,170,152)"; ctx.fillRect(cx - cw / 2, cy, cw, ch);
    texto(ctx, "CONTRATO DE ARRIENDO", cx, cy + 56, 18 * KT + 6, "rgba(40,36,30,0.9)", { fam: SANS, peso: 700, alin: "center", esp: 4 });
    for (let k = 0; k < 14; k++) if (k !== 7) { ctx.fillStyle = "rgba(60,54,46,0.35)"; ctx.fillRect(cx - cw * 0.4, cy + 100 + k * ch * 0.045, cw * (0.55 + 0.25 * azar(k)), 5); }
    const yc = cy + 100 + 7 * ch * 0.045, mk = eSuave(pr(s, sAnt - 0.2, 0.4));
    ctx.fillStyle = `rgba(255,200,60,${0.55 * mk})`; ctx.fillRect(cx - cw * 0.42, yc - 18, cw * 0.84 * mk, 30);
    texto(ctx, "CLÁUSULA 7 · NO SE PERMITEN ANTENAS", cx - cw * 0.4, yc + 4, 15 * KT + 4, "rgba(40,30,20,0.95)", { fam: SANS, peso: 700, esp: 2 });
    const st = eSuave(pr(s, sAnt + 0.3, 0.25));
    if (st > 0.01) {
      ctx.translate(cx + cw * 0.18, cy + ch * 0.72); ctx.rotate(-0.25); ctx.scale(1 + (1 - st) * 0.8, 1 + (1 - st) * 0.8);
      ctx.strokeStyle = `rgba(200,40,40,${0.9 * st})`; ctx.lineWidth = 6; ctx.strokeRect(-cw * 0.25, -38, cw * 0.5, 76);
      texto(ctx, "PROHIBIDO", 0, 14, 34 * KT + 8, `rgba(200,40,40,${0.9 * st})`, { fam: SANS, peso: 800, alin: "center", esp: 6 });
    }
    ctx.restore();
  }
  // beat 4: he cuts a fractal out of aluminium foil, one level at a time
  const aFoil = a * ventana(s, sAsi - 0.1, sPego + 0.3, 0.3);
  if (aFoil > 0.01) {
    const n = s < sPapel ? 0 : s < P("aluminio25") ? 1 : s < sFractal ? 2 : 3;
    const l = H * 0.6, cx = W / 2, cy = H * 0.5;
    // the sheet of foil, then the shape cut from it
    const hoja = 1 - eSuave(pr(s, sPapel - 0.2, 0.4));
    if (hoja > 0.01) vicsek(ctx, cx, cy, l, 0, aFoil * Math.max(hoja, 0.3));
    if (n > 0) { vicsek(ctx, cx, cy, l, n, aFoil); luz(ctx, cx, cy, l * 0.3, aFoil * 0.25 * pulso(s, [sPapel, P("aluminio25"), sFractal]), RGB.crema); }
    titular(ctx, "UNA ANTENA DE PAPEL DE ALUMINIO", H * 0.1, 24 * KT + 6, aFoil * eSuave(pr(s, sPapel - 0.2, 0.4)));
    texto(ctx, "CON FORMA FRACTAL: CADA BRAZO REPITE LA CRUZ, TRES VECES MÁS PEQUEÑA", W / 2, H * 0.9, 15 * KT + 4, `rgba(${AMBAR},${0.95 * aFoil * eSuave(pr(s, sFractal, 0.4))})`, { alin: "center", esp: 3 });
  }
  // beat 5: on the balcony railing; it works; the landlord cuts it down
  if (aBalcon > 0.01) {
    const cx = W * 0.5, yr = H * 0.62, l = H * 0.34;
    // the window behind, warm, and the railing
    ctx.save(); ctx.globalAlpha = aBalcon;
    ctx.fillStyle = "rgb(16,20,32)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,190,110,0.85)"; ctx.fillRect(W * 0.12, H * 0.12, W * 0.24, H * 0.5);
    ctx.fillStyle = "rgb(40,26,18)"; ctx.beginPath(); ctx.arc(W * 0.22, H * 0.36, H * 0.05, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(W * 0.22, H * 0.5, H * 0.08, H * 0.09, 0, Math.PI, 0); ctx.fill();
    ctx.restore();
    luz(ctx, W * 0.31, H * 0.5, 14, aBalcon * (0.5 + 0.5 * eSuave(pr(s, sFunc, 0.3))), "120,255,170");
    trazo(ctx, [[0, yr], [W, yr]], "200,205,215", aBalcon, 6);
    for (let k = 0; k <= 24; k++) trazo(ctx, [[(k / 24) * W, yr], [(k / 24) * W, H]], "200,205,215", aBalcon * 0.6, 3);
    // the antenna: flies from the centre to the railing, taped; falls after the cut
    const llega = eIO(pr(s, sPego - 0.1, 0.7));
    const corte = pr(s, sCorto, 1.2), cae = eIO(corte);
    const ax = lerp(W / 2, cx + W * 0.12, llega), ay = lerp(H * 0.5, yr - l * 0.55, llega), al = lerp(H * 0.6, l, llega);
    for (const lado of [-1, 1]) {
      ctx.save(); ctx.beginPath();
      if (lado < 0) ctx.rect(0, 0, ax, H); else ctx.rect(ax, 0, W, H);
      ctx.clip(); ctx.translate(ax + lado * cae * W * 0.04, ay + cae * H * 0.7); ctx.rotate(lado * cae * 0.6);
      vicsek(ctx, 0, 0, al, 3, aBalcon * (1 - eSuave(pr(corte, 0.6, 0.4))));
      ctx.restore();
    }
    if (cae < 0.05) for (const dx of [-0.3, 0.3]) { ctx.fillStyle = `rgba(230,220,180,${0.8 * aBalcon})`; ctx.fillRect(ax + dx * al - 14, yr - 10, 28, 20); }
    // «Funcionó»: the signal leaving it, out over the city
    const af = aBalcon * eSuave(pr(s, sFunc - 0.2, 0.3)) * (1 - eSuave(pr(s, sCorto, 0.2)));
    for (let k = 0; k < 5; k++) {
      const e = ((s * 0.8 + k / 5) % 1);
      ctx.save(); ctx.strokeStyle = `rgba(${AZUL},${0.7 * af * (1 - e)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ax, ay, al * (0.6 + e * 1.6), -1.0, 0.6); ctx.stroke(); ctx.restore();
    }
    texto(ctx, "FUNCIONÓ", W * 0.82, H * 0.2, 30 * KT + 8, `rgba(${AZUL},${0.95 * aBalcon * eSuave(pr(s, sFunc, 0.3))})`, { fam: SANS, peso: 700, alin: "center", esp: 5 });
    // the landlord's scissors
    const tij = eIO(pr(s, sDueno, 1.2));
    if (tij > 0.01 && corte < 0.5) {
      const sx = lerp(W * 1.1, ax, tij), sy = ay - al * 0.1, abre = s < sCorto ? 0.35 + 0.15 * Math.sin(s * 9) : 0.02;
      ctx.save(); ctx.translate(sx + W * 0.11 * (1 - tij * 0.0), sy); ctx.globalAlpha = aBalcon; luz(ctx, 0, 0, 6, 1, RGB.crema);
      for (const g of [-1, 1]) {
        ctx.save(); ctx.rotate(g * abre);
        // a blade pointing at the antenna, and its handle behind the pivot
        ctx.fillStyle = "rgb(190,194,206)"; ctx.beginPath(); ctx.moveTo(W * 0.012, 0); ctx.lineTo(-W * 0.11, g * 3); ctx.lineTo(-W * 0.02, g * 14); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgb(190,60,50)"; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(W * 0.05, g * 26, 30, 20, g * 0.4, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
    if (corte > 0 && corte < 0.3) luz(ctx, ax, ay, 90, aBalcon * (1 - corte / 0.3), RGB.crema);
    texto(ctx, "HASTA QUE EL DUEÑO LA CORTÓ", W * 0.82, H * 0.2 + 46, 16 * KT + 4, `rgba(${AMBAR},${0.95 * aBalcon * eSuave(pr(s, sDueno, 0.4))})`, { alin: "center", esp: 3 });
    nota(ctx, "ILUSTRACIÓN · SEGÚN SU RELATO (COHEN, 1995): UNA ANTENA FRACTAL DE PAPEL DE ALUMINIO EN LA BARANDA, PISO 27", aBalcon);
  }
};

// ─── 2 · design: an antenna ─────────────────────────────────────────────────────────────────────────────────────
const BANDAS = [12.6, 6.4, 3.3, 1.62, 0.64], ESPERADA5 = 0.81;
const antena = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.antena - 0.6 || t > K.paisaje + 0.4) return;
  const a = eSuave(pr(t, K.antena - 0.6, 1.0)) * (1 - eSuave(pr(t, K.paisaje - 0.8, 1.0)));
  etiqueta(ctx, "APLICACIÓN COMERCIAL", a);
  // the wave and the rod: it resonates with the wave of its size
  const aw = a * ventana(t, K.antena, K.edificio + 0.2, 0.7);
  if (aw > 0.01) {
    for (const [k, y, l] of [[0, H * 0.32, W * 0.06], [1, H * 0.52, W * 0.12], [2, H * 0.72, W * 0.24]] as [number, number, number][]) {
      const pts: P[] = [];
      for (let i = 0; i <= 200; i++) { const x = lerp(W * 0.1, W * 0.6, i / 200); pts.push([x, y - Math.sin((x / (l * 2)) * Math.PI * 2 - t * 4) * H * 0.04]); }
      trazo(ctx, pts, AZUL, aw * 0.8, 1.6);
      const vib = k === 1 ? 1 : 0.2;
      trazo(ctx, [[W * 0.7, y], [W * 0.7 + W * 0.12, y + Math.sin(t * 12) * H * 0.008 * vib]], COBRE, aw, 4);
      texto(ctx, k === 1 ? "RESUENA" : "", W * 0.84, y + 6, 15 * KT + 4, `rgba(${AMBAR},${0.9 * aw})`, { esp: 4 });
    }
    texto(ctx, "UNA ANTENA RESUENA CON LAS ONDAS DE SU TAMAÑO", W / 2, H * 0.14, 18 * KT + 4, `rgba(${RGB.crema},${0.85 * aw})`, { alin: "center", esp: 4 });
  }
  // the story, as motion graphics, beat by beat on the voice: the city → his window → the contract → the foil fractal → the balcony → the cut
  const ae = a * ventana(t, K.edificio, K.puente + 0.2, 0.6);
  if (ae > 0.01) historia(ctx, t - V[2], ae);
  // Puente's antenna: the triangle at five scales, and its five bands
  const ap = a * eSuave(pr(t, K.puente, 0.8));
  if (ap > 0.01) {
    const ar = ap * (1 - eSuave(pr(t, V[3] + 3.0, 0.8)));
    retrato(ctx, f.puente, W / 2, ar, "CARLES PUENTE", "UNIVERSIDAD POLITÉCNICA DE CATALUÑA · 1996", H * 0.12, H * 0.5);
    if (ar > 0.01) nota(ctx, "FOTO: EETAC · UNIVERSIDAD POLITÉCNICA DE CATALUÑA", ar);
    const as = ap * eSuave(pr(t, V[3] + 3.0, 0.8));
    if (as > 0.01) {
      // which scale is lit: one by one from «cinco escalas», then with each band
      const kEsc = t < K.escalas ? -1 : Math.min(4, Math.floor((t - K.escalas) / 0.7));
      const kBan = t < K.sintoniza - 2.5 ? -1 : Math.min(4, Math.floor((t - K.sintoniza + 2.5) / 0.6));
      const kk = kBan >= 0 ? kBan : kEsc;
      // the board: a substrate, the copper triangle growing one level at a time from «construyeron», and the feed
      const nv = Math.min(6, Math.floor(pr(t, K.construyeron, 3.6) * 7));
      ctx.save(); ctx.fillStyle = `rgba(20,52,44,${0.85 * as})`; ctx.fillRect(W * 0.27 - H * 0.36, H * 0.2 - 10, H * 0.72, H * 0.66); ctx.strokeStyle = `rgba(120,170,150,${0.5 * as})`; ctx.strokeRect(W * 0.27 - H * 0.36, H * 0.2 - 10, H * 0.72, H * 0.66); ctx.restore();
      sierpinski(ctx, W * 0.27, H * 0.82, H * 0.62, nv, as, kk);
      trazo(ctx, [[W * 0.27, H * 0.82], [W * 0.27, H * 0.86 + 10]], "200,200,210", as, 4);
      luz(ctx, W * 0.27, H * 0.82, 16, as, COBRE);
      texto(ctx, "ALIMENTACIÓN", W * 0.27 + 14, H * 0.86, 12 * KT + 4, `rgba(${RGB.crema},${0.7 * as})`, { esp: 3 });
      texto(ctx, "10,9 · 5,45 · 2,72 · 1,36 · 0,68 CM", W * 0.27, H * 0.9, 15 * KT + 4, `rgba(${COBRE},${0.9 * as * eSuave(pr(t, K.escalas, 0.6))})`, { alin: "center", esp: 4 });
      // the bands: a response curve with five dips, one under each scale (redrawn from the published bands)
      const gx0 = W * 0.52, gx1 = W * 0.94, gy0 = H * 0.24, gy1 = H * 0.72;
      const fx = (g: number) => lerp(gx0, gx1, (Math.log10(g) - Math.log10(0.4)) / (Math.log10(20) - Math.log10(0.4)));
      const ab = as * eSuave(pr(t, K.bandas, 0.8));
      if (ab > 0.01) {
        ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.35 * ab})`; ctx.beginPath(); ctx.moveTo(gx0, gy0); ctx.lineTo(gx0, gy1); ctx.lineTo(gx1, gy1); ctx.stroke(); ctx.restore();
        const pts: P[] = [];
        for (let i = 0; i <= 400; i++) {
          const lg = lerp(Math.log10(0.4), Math.log10(20), i / 400), g = Math.pow(10, lg);
          let v = 0; for (const b of BANDAS) v = Math.max(v, Math.exp(-(((Math.log10(g) - Math.log10(b)) / 0.035) ** 2)));
          pts.push([fx(g), lerp(gy0 + 20, gy1 - 10, v)]);
        }
        trazo(ctx, pts, AZUL, ab * 0.9, 1.8);
        BANDAS.forEach((b, i) => {
          const ai = ab * eSuave(pr(t, K.sintoniza - 2.5 + i * 0.6, 0.4));
          luz(ctx, fx(b), gy1 - 10, 22, ai * (kk === i ? 1 : 0.4), COBRE);
          texto(ctx, coma(b), fx(b), gy1 + 30, 15 * KT + 4, `rgba(${COBRE},${0.95 * ai})`, { alin: "center", esp: 2 });
        });
        texto(ctx, "FRECUENCIA (GHZ) · ESCALA LOGARÍTMICA", (gx0 + gx1) / 2, gy1 + 62, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * ab})`, { alin: "center", esp: 4 });
        texto(ctx, "DONDE LA ANTENA FUNCIONA", gx0, gy0 - 16, 14 * KT + 4, `rgba(${RGB.crema},${0.7 * ab})`, { esp: 4 });
        // the fifth band: where it should be, and where it fell
        const aq = ab * eSuave(pr(t, K.quinta, 0.6));
        if (aq > 0.01) {
          ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.8 * aq})`; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(fx(ESPERADA5), gy0); ctx.lineTo(fx(ESPERADA5), gy1); ctx.stroke(); ctx.restore();
          texto(ctx, "ESPERADA 0,81", fx(ESPERADA5) + 8, gy0 + 20, 13 * KT + 4, `rgba(${AMBAR},${0.9 * aq})`, { esp: 3 });
          texto(ctx, "EL TRIÁNGULO REAL TERMINA: 5 ESCALAS, NO INFINITAS", (gx0 + gx1) / 2, H * 0.14, 18 * KT + 4, `rgba(${AMBAR},${0.95 * aq})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
        }
        nota(ctx, "BANDAS PUBLICADAS POR PUENTE Y OTROS, ELECTRONICS LETTERS, 1996 · CURVA REDIBUJADA", ab);
      }
      const at2 = as * ventana(t, V[5] - 0.2, K.quinta, 0.6);
      if (at2 > 0.01) texto(ctx, "DURANTE AÑOS, LAS MÁS COMUNES EN LOS TELÉFONOS INTELIGENTES · IEEE SPECTRUM, 2017", W / 2, H * 0.14, 15 * KT + 4, `rgba(${RGB.crema},${0.9 * at2})`, { alin: "center", esp: 3 });
    }
  }
};
const coma = (v: number, d = 2) => (Number.isInteger(v * 10) ? v.toFixed(Math.max(1, d - 1)) : v.toFixed(d)).replace(".", ",");

// ─── 3 · represent: a landscape ─────────────────────────────────────────────────────────────────────────────────
// midpoint displacement: n levels of a profile between two heights; the roughness h sets how fast the kicks shrink
const perfil = (sem: number, n: number, h: number, amp: number) => {
  let pts = [0, 0];
  let d = amp;
  for (let l = 0; l < n; l++) {
    const q: number[] = [];
    for (let i = 0; i < pts.length - 1; i++) q.push(pts[i], (pts[i] + pts[i + 1]) / 2 + (azar(sem * 1000 + l * 97 + i) - 0.5) * 2 * d);
    q.push(pts[pts.length - 1]); pts = q; d *= Math.pow(2, -h);
  }
  return pts;
};
const DFR = D5.frontera as number[][];
const paisaje = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.paisaje - 0.6 || t > K.retina + 0.4) return;
  const a = eSuave(pr(t, K.paisaje - 0.6, 1.0)) * (1 - eSuave(pr(t, K.retina - 0.8, 1.0)));
  etiqueta(ctx, "APLICACIÓN COMERCIAL", a);
  // «punto por punto»: a ridge that a hand would have to place one point at a time
  const ad = a * ventana(t, K.paisaje, K.carpenter - 0.2, 0.6);
  if (ad > 0.01) {
    const pts = perfil(7, 9, 0.8, 0.28), n = Math.floor(pts.length * Math.min(1, pr(t, K.paisaje + 0.4, 8) * 0.35));
    for (let i = 0; i < n; i++) luz(ctx, lerp(W * 0.05, W * 0.95, i / (pts.length - 1)), H * 0.62 - pts[i] * H * 0.9, 7, ad * 0.8, RGB.crema);
    texto(ctx, `${n} PUNTOS, UNO A UNO`, W - 84, H * 0.88, 18 * KT + 6, `rgba(${RGB.crema},${0.8 * ad})`, { fam: SANS, peso: 600, alin: "right", esp: 2 });
  }
  retrato(ctx, f.carpenter, W / 2, a * ventana(t, K.carpenter - 0.3, K.regla, 0.6), "LOREN CARPENTER", "VOL LIBRE · SIGGRAPH 1980", H * 0.14, H * 0.42);
  if (f.carpenter) nota(ctx, "FOTO: TONYMARK26 · CC BY-SA 4.0", a * ventana(t, K.carpenter - 0.3, K.regla, 0.6));
  // the rule, live: one level per beat of 0,9 s; then the ranges behind, in the fog
  const am = a * ventana(t, K.regla, K.frontera + 0.2, 0.7);
  if (am > 0.01) {
    const nivel = Math.min(10, Math.floor(pr(t, V[8] + 0.6, 9.0) * 11));
    const capas = eSuave(pr(t, V[8] + 8.0, 2.0));
    for (let c = 3; c >= 0; c--) {
      const ac = c === 0 ? 1 : capas;
      if (ac <= 0.01) continue;
      const pts = perfil(c + 1, c === 0 ? nivel : 10, 0.8, 0.28), y0 = H * (0.68 - c * 0.07);
      const P2: P[] = pts.map((v, i) => [lerp(W * 0.05, W * 0.95, i / (pts.length - 1)), y0 - v * H * 0.9]);
      if (c > 0 || nivel >= 8) {
        ctx.save(); ctx.beginPath(); P2.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineTo(W * 0.95, H); ctx.lineTo(W * 0.05, H); ctx.closePath();
        ctx.fillStyle = `rgba(${Math.round(lerp(10, 30, c / 3))},${Math.round(lerp(12, 34, c / 3))},${Math.round(lerp(18, 52, c / 3))},${0.9 * am * ac})`; ctx.fill(); ctx.restore();
      }
      trazo(ctx, P2, c === 0 ? RGB.crema : AZUL, am * ac * (1 - c * 0.22), c === 0 ? 1.8 : 1.2);
      if (c === 0 && nivel < 5) P2.forEach(([x, y]) => luz(ctx, x, y, 10, am * 0.7));
    }
    texto(ctx, `PASO ${nivel}`, W - 84, H * 0.88, 22 * KT + 6, `rgba(${RGB.crema},${0.85 * am * (1 - capas)})`, { fam: SANS, peso: 600, alin: "right", esp: 2 });
    const ag = am * ventana(t, K.genesis, K.frontera, 0.6);
    if (ag > 0.01) { titular(ctx, "STAR TREK II · 1982 · LA SECUENCIA GÉNESIS", H * 0.14, 26 * KT + 6, ag); texto(ctx, "MONTAÑAS FRACTALES DE CARPENTER EN LUCASFILM", W / 2, H * 0.14 + 36, 14 * KT + 4, `rgba(${AMBAR},${0.85 * ag})`, { alin: "center", esp: 4 }); }
    rotulo(ctx, "DESPLAZAMIENTO DEL PUNTO MEDIO", "CADA PASO MUEVE LOS PUNTOS MEDIOS UN POCO MENOS", am * (1 - ag));
  }
  // a border invented with the roughness we measured (D ≈ 1,12 → h = 2 − D)
  const af = a * eSuave(pr(t, K.frontera, 0.8));
  if (af > 0.01) {
    const zoom = eIO(pr(t, K.pixel + 0.5, 5.0));
    const xs = DFR.map((p) => p[0]), ys = DFR.map((p) => p[1]);
    const minY = Math.min(...ys), maxY = Math.max(...ys), sx = (H * 0.66) / (maxY - minY), mx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const real: P[] = DFR.map(([x, y]) => [W * 0.28 + (x - mx) * sx, H * 0.84 - (y - minY) * sx]);
    trazo(ctx, real, RGB.crema, af * (1 - zoom), 1.8);
    texto(ctx, "LA REAL · MEDIDA, D ≈ 1,12", W * 0.28, H * 0.12, 16 * KT + 4, `rgba(${RGB.crema},${0.9 * af * (1 - zoom)})`, { alin: "center", esp: 4 });
    // the invented one: midpoint displacement between the same two ends, sideways kicks
    const n = 11, h = 2 - 1.12;
    const pz = perfil(9, n, h, 0.12);
    const inv: P[] = pz.map((v, i) => [W * 0.72 + v * H * 0.9, H * 0.84 - (i / (pz.length - 1)) * H * 0.66]);
    // the zoom toward the pixel: around the middle of the invented line
    const s = Math.exp(lerp(0, Math.log(120), zoom)), q = inv[Math.floor(inv.length * 0.53)];
    const invZ: P[] = inv.map(([x, y]) => [lerp(x, W / 2 + (x - q[0]) * s, zoom), lerp(y, H / 2 + (y - q[1]) * s, zoom)]);
    trazo(ctx, invZ, AMBAR, af, 1.8);
    if (zoom > 0.6) invZ.forEach(([x, y], i) => { if (i % 1 === 0 && x > 0 && x < W && y > 0 && y < H) luz(ctx, x, y, 9, af * 0.6 * eSuave(pr(zoom, 0.6, 0.3))); });
    texto(ctx, "INVENTADA · LA MISMA RUGOSIDAD", lerp(W * 0.72, W / 2, zoom), H * 0.12, 16 * KT + 4, `rgba(${AMBAR},${0.9 * af})`, { alin: "center", esp: 4 });
    const ap2 = af * eSuave(pr(zoom, 0.75, 0.2));
    if (ap2 > 0.01) titular(ctx, "AQUÍ SE ACABA EL DETALLE: EL PÍXEL", H * 0.88, 26 * KT + 6, ap2, AMBAR);
  }
};

// ─── 4 · measure: a retina ──────────────────────────────────────────────────────────────────────────────────────
const retina = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.retina - 0.6 || t > K.cancer + 0.4) return;
  const a = eSuave(pr(t, K.retina - 0.6, 1.0)) * (1 - eSuave(pr(t, K.cancer - 0.8, 1.0)));
  etiqueta(ctx, "HERRAMIENTA DE INVESTIGACIÓN", a);
  const L = H * 0.74, x0 = W * 0.3 - L / 2, y0 = H * 0.13;
  const pasos: [string, string][] = [["color", "LA FOTOGRAFÍA DEL FONDO DEL OJO"], ["verde", "1 · EL CANAL VERDE: LOS VASOS CONTRASTAN MÁS"], ["realce", "2 · LO QUE ES MÁS OSCURO QUE SU ENTORNO"], ["vasos", "3 · EL MAPA DE LOS VASOS"]];
  const tp = [K.retina, K.pasos + 0.4, K.pasos + 2.4, K.pasos + 4.4];
  pasos.forEach(([k, s], i) => {
    const ai = a * eSuave(pr(t, tp[i], 0.7)) * (i < 3 ? 1 - eSuave(pr(t, tp[i + 1], 0.7)) : 1);
    const im = f[`ret_${k}`];
    if (!im || ai <= 0.01) return;
    ctx.save(); ctx.globalAlpha = ai; ctx.beginPath(); ctx.arc(x0 + L / 2, y0 + L / 2, L / 2, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(im, x0, y0, L, L); ctx.restore();
    texto(ctx, s, x0 + L / 2, y0 + L + 44, 16 * KT + 4, `rgba(${RGB.crema},${0.9 * ai})`, { alin: "center", esp: 4 });
  });
  nota(ctx, "FOTO: OPTOMETRUSPRIME · CC BY-SA 2.0 · PROCESO PROPIO", a * (1 - eSuave(pr(t, K.revision - 0.4, 0.8))));
  // the boxes, 64 → 32 → 16 px, then the number
  const r0 = K.pasos + 6.4, seg = 1.2;
  [64, 32, 16].forEach((e, j) => {
    const ab = a * ventana(t, r0 + j * seg, r0 + (j + 1) * seg + (j === 2 ? 0.8 : 0.1), 0.3) * (1 - eSuave(pr(t, K.revision - 0.4, 0.8)));
    if (ab <= 0.01) return;
    const k = L / RET.L, q = e * k, cols = RET.L / e;
    ctx.save(); ctx.fillStyle = `rgba(${AMBAR},${0.22 * ab})`; ctx.strokeStyle = `rgba(${AMBAR},${0.7 * ab})`;
    for (const i of (RET.cajas as Record<string, number[]>)[String(e)]) { const fl = Math.floor(i / cols), c = i % cols; ctx.fillRect(x0 + c * q, y0 + fl * q, q, q); ctx.strokeRect(x0 + c * q + 0.5, y0 + fl * q + 0.5, q - 1, q - 1); }
    ctx.restore();
    texto(ctx, `4 · CAJAS DE ${e} PÍXELES`, x0 + L / 2, y0 + L + 80, 15 * KT + 4, `rgba(${AMBAR},${0.9 * ab})`, { alin: "center", esp: 4 });
  });
  const an = a * eSuave(pr(t, K.numero, 0.8));
  if (an > 0.01) {
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(12px)";
    texto(ctx, `D ≈ ${String(RET.D).replace(".", ",")}`, W * 0.72, H * 0.42, 86 * KT + 10, `rgba(${AMBAR},${0.35 * an})`, { fam: SANS, peso: 600, alin: "center", esp: 4 }); ctx.restore();
    texto(ctx, `D ≈ ${String(RET.D).replace(".", ",")}`, W * 0.72, H * 0.42, 86 * KT + 10, `rgba(${AMBAR},${0.97 * an})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
    texto(ctx, "LA DIMENSIÓN DE ESTOS VASOS · MÉTODO PROPIO SIMPLE", W * 0.72, H * 0.42 + 46, 14 * KT + 4, `rgba(${RGB.crema},${0.75 * an})`, { alin: "center", esp: 4 });
  }
  // the review, and its limits
  const ar = a * eSuave(pr(t, K.revision, 0.8));
  if (ar > 0.01) {
    const lx = W * 0.56, ly = H * 0.58;
    texto(ctx, "REVISIÓN DE 14 ESTUDIOS · 2025", lx, ly, 18 * KT + 6, `rgba(${RGB.crema},${0.95 * ar})`, { fam: SANS, peso: 600, esp: 3 });
    texto(ctx, "DIMENSIÓN MÁS BAJA → MÁS RIESGO CARDIOVASCULAR", lx, ly + 36, 15 * KT + 4, `rgba(${AMBAR},${0.95 * ar})`, { esp: 3 });
    texto(ctx, "SOBRE TODO EN LAS ARTERIAS PEQUEÑAS · EN GRUPOS", lx, ly + 62, 13 * KT + 4, `rgba(${RGB.crema},${0.75 * ar})`, { esp: 3 });
    ["CUATRO SISTEMAS DE MEDICIÓN DISTINTOS", "EL NÚMERO CAMBIA CON EL MÉTODO", "ASOCIACIÓN, NO CAUSA NI DIAGNÓSTICO"].forEach((s, i) =>
      texto(ctx, `· ${s}`, lx, ly + 104 + i * 28, 14 * KT + 4, `rgba(${RGB.crema},${0.85 * ar * eSuave(pr(t, V[15] + 1.0 + i * 1.6, 0.6))})`, { esp: 3 }));
    nota(ctx, "REVISIÓN SISTEMÁTICA · BMC OPHTHALMOLOGY, 2025", ar);
  }
};


// ─── 4b · measure: cancer (added 7 nov). An illustrative simulation (herramientas/cancer_cap7.py): healthy vessels
// beside a tumour's, boxes on the tumour, the published values; then cell contours, smooth and ragged ──────────────
type Seg = [number, number, number, number, number, number];
const ROJO = "235,120,105";
const red = (ctx: Ctx, segs: Seg[], cx: number, cy: number, R: number, g: number, col: string, a: number) => {
  if (a <= 0.01 || g <= 0) return;
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  const camino = (k: number) => {
    ctx.beginPath();
    for (const [x0, y0, x1, y1, n, w] of segs) {
      if (n > g || (k === 0 ? w < 2.5 : k === 1 ? w < 1.4 || w >= 2.5 : w >= 1.4)) continue;
      const u = Math.min(1, (g - n) / 0.04);
      ctx.moveTo(cx + x0 * R, cy + y0 * R); ctx.lineTo(cx + (x0 + (x1 - x0) * u) * R, cy + (y0 + (y1 - y0) * u) * R);
    }
  };
  for (const [k, lw] of [[0, 4.2], [1, 2.4], [2, 1.3]] as const) {
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(${col},${0.12 * a})`; ctx.lineWidth = lw * 4; camino(k); ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = `rgba(${col},${0.9 * a})`; ctx.lineWidth = lw; camino(k); ctx.stroke();
  }
  ctx.restore();
};
const contornos = (ctx: Ctx, polis: number[][][], cx: number, cy: number, R: number, col: string, a: number) => {
  if (a <= 0.01) return;
  ctx.save();
  for (const pol of polis) {
    ctx.beginPath(); pol.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x * R, cy + y * R) : ctx.moveTo(cx + x * R, cy + y * R))); ctx.closePath();
    ctx.fillStyle = `rgba(${col},${0.07 * a})`; ctx.fill();
    ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = `rgba(${col},${0.14 * a})`; ctx.lineWidth = 6; ctx.stroke();
    ctx.globalCompositeOperation = "source-over"; ctx.strokeStyle = `rgba(${col},${0.92 * a})`; ctx.lineWidth = 1.6; ctx.stroke();
  }
  ctx.restore();
  for (const [x, y] of CAN.centros as number[][]) luz(ctx, cx + x * R, cy + y * R, 10, 0.35 * a, col);
};
const cancer = (ctx: Ctx, t: number) => {
  if (t < K.cancer - 0.6 || t > K.cierre + 0.4) return;
  const a = eSuave(pr(t, K.cancer - 0.6, 1.0)) * (1 - eSuave(pr(t, K.cierre - 0.8, 1.0)));
  etiqueta(ctx, "HERRAMIENTA DE INVESTIGACIÓN", a);
  const R = H * 0.27, cy = H * 0.43, xs = W * 0.29, xt = W * 0.71, yl = cy + R + 46;
  // the vessels: the healthy tree grows first, then the tumour's network from the same root
  const av = a * (1 - eSuave(pr(t, K.celulas - 0.4, 1.0)));
  red(ctx, CAN.sano as Seg[], xs, cy, R, eIO(pr(t, K.cancer, 4.0)), AZUL, av);
  red(ctx, CAN.tumor as Seg[], xt, cy, R, eOut(pr(t, K.tumor, 7.0)), ROJO, av);
  const ls = av * eSuave(pr(t, K.cancer + 0.8, 0.8)), lt = av * eSuave(pr(t, K.tumor + 0.6, 0.8));
  texto(ctx, "ARTERIAS Y VENAS SANAS", xs, yl, 17 * KT + 5, `rgba(${AZUL},${0.95 * ls})`, { alin: "center", esp: 4, peso: 600 });
  texto(ctx, "VASOS DE UN TUMOR", xt, yl, 17 * KT + 5, `rgba(${ROJO},${0.95 * lt})`, { alin: "center", esp: 4, peso: 600 });
  // the boxes on the tumour, 8 → 16 → 32 per side, then the published values
  const seg = 1.2;
  [8, 16, 32].forEach((n, j) => {
    const ab = av * ventana(t, K.cajas + j * seg, K.cajas + (j + 1) * seg + (j === 2 ? 0.8 : 0.1), 0.3);
    if (ab <= 0.01) return;
    const q = (2 * R) / n, x0 = xt - R, y0 = cy - R;
    ctx.save(); ctx.fillStyle = `rgba(${AMBAR},${0.2 * ab})`; ctx.strokeStyle = `rgba(${AMBAR},${0.65 * ab})`;
    for (const i of (CAN.cajas as Record<string, number[]>)[String(n)]) { const f = Math.floor(i / n), c = i % n; ctx.fillRect(x0 + c * q, y0 + f * q, q, q); ctx.strokeRect(x0 + c * q + 0.5, y0 + f * q + 0.5, q - 1, q - 1); }
    ctx.restore();
  });
  const ad = av * eSuave(pr(t, K.cajas + 2.6, 0.8));
  texto(ctx, "D ≈ 1,7", xs, yl + 44, 30 * KT + 8, `rgba(${AZUL},${0.97 * ad})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
  texto(ctx, "D ≈ 1,9", xt, yl + 44, 30 * KT + 8, `rgba(${ROJO},${0.97 * ad})`, { fam: SANS, peso: 600, alin: "center", esp: 4 });
  nota(ctx, "SIMULACIÓN ILUSTRATIVA · VALORES MEDIDOS EN RATONES: BAISH Y JAIN, CANCER RESEARCH (2000)", av * eSuave(pr(t, K.cancer + 0.8, 0.8)));
  // the cells: the same cells, with a smooth contour and with a ragged one
  const ac = a * eSuave(pr(t, K.celulas - 0.2, 1.0));
  contornos(ctx, CAN.lisas as number[][][], xs, cy, R, AZUL, ac);
  contornos(ctx, CAN.rugosas as number[][][], xt, cy, R, ROJO, ac * eSuave(pr(t, K.celulas + 0.6, 1.0)));
  // the labels wait until the vessels' labels have gone, so two texts never share a place
  const al = a * eSuave(pr(t, K.celulas + 0.7, 0.6));
  texto(ctx, "CONTORNO LISO", xs, yl, 17 * KT + 5, `rgba(${AZUL},${0.95 * al})`, { alin: "center", esp: 4, peso: 600 });
  texto(ctx, "CONTORNO IRREGULAR · DIMENSIÓN MÁS ALTA", xt, yl, 17 * KT + 5, `rgba(${ROJO},${0.95 * al})`, { alin: "center", esp: 4, peso: 600 });
  const ae = a * eSuave(pr(t, V[21] + 0.4, 0.8));
  texto(ctx, "EN ESTUDIO · DIAGNÓSTICO TEMPRANO Y PRONÓSTICO", W / 2, yl + 70, 15 * KT + 4, `rgba(${AMBAR},${0.95 * ae})`, { alin: "center", esp: 4 });
  nota(ctx, "SIMULACIÓN ILUSTRATIVA · CONTORNOS DE CÉLULAS EN UNA BIOPSIA", al);
};

// ─── 5 · close: three tools, three ranges; out to the cosmic web ───────────────────────────────────────────────
const cierre = (ctx: Ctx, t: number, f: Fotos) => {
  if (t < K.cierre - 0.6) return;
  const a = eSuave(pr(t, K.cierre - 0.6, 1.0)) * (1 - eSuave(pr(t, K.total - 1.6, 1.4)));
  const sale = eIO(pr(t, K.universo, 3.0));
  const at = a * (1 - sale);
  if (at > 0.01) {
    const items: [string, string][] = [["LA ANTENA", "5 BANDAS · 5 ESCALAS"], ["EL PAISAJE", "HASTA EL PÍXEL"], ["LA RETINA", "HASTA LA RESOLUCIÓN DE LA FOTO"]];
    items.forEach(([n, r], i) => {
      const x = W * (0.2 + 0.3 * i), ai = at * eSuave(pr(t, K.cierre + i * 0.7, 0.6));
      if (i === 0) sierpinski(ctx, x, H * 0.5, H * 0.26, 5, ai);
      if (i === 1) { const pts = perfil(1, 9, 0.8, 0.28); trazo(ctx, pts.map((v, k) => [x - W * 0.11 + (k / (pts.length - 1)) * W * 0.22, H * 0.45 - v * H * 0.5] as P), RGB.crema, ai, 1.4); }
      if (i === 2 && f.ret_vasos) { ctx.save(); ctx.globalAlpha = ai; ctx.globalCompositeOperation = "lighter"; ctx.drawImage(f.ret_vasos, x - H * 0.13, H * 0.24, H * 0.26, H * 0.26); ctx.restore(); }
      texto(ctx, n, x, H * 0.62, 22 * KT + 6, `rgba(${RGB.crema},${0.95 * ai})`, { fam: SANS, peso: 600, alin: "center", esp: 3 });
      // the range bar: solid where the tool works, cut at both ends
      const bx0 = x - W * 0.11, bx1 = x + W * 0.11, by = H * 0.7;
      ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.25 * ai})`; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.moveTo(bx0 - 40, by); ctx.lineTo(bx1 + 40, by); ctx.stroke(); ctx.restore();
      trazo(ctx, [[bx0, by], [bx1, by]], AMBAR, ai, 3);
      for (const xx of [bx0, bx1]) trazo(ctx, [[xx, by - 12], [xx, by + 12]], AMBAR, ai, 2);
      texto(ctx, r, x, by + 44, 14 * KT + 4, `rgba(${AMBAR},${0.9 * ai})`, { alin: "center", esp: 3 });
    });
    titular(ctx, "CADA HERRAMIENTA FUNCIONA EN UN RANGO", H * 0.14, 30 * KT + 8, at * eSuave(pr(t, V[17] - 0.4, 0.8)));
  }
  // out through the cosmic web; time runs backwards to one point; the Big Bang, and the web forms again
  const af = a * eSuave(pr(t, K.final, 0.8));
  if (af > 0.01 && f.vid_final) {
    // the plasma and the oldest light are near white: held down here so the bloom of the grade does not burn them
    const baja = ventana(t, K.bang + 0.25, K.bang + 7.8, 0.4);
    ctx.save(); ctx.globalAlpha = af; ctx.filter = `brightness(${1 - 0.42 * baja}) saturate(${1 + 0.25 * baja})`; ctx.drawImage(f.vid_final, 0, 0, W, H); ctx.restore();
    const g = ctx.createLinearGradient(0, H * 0.7, 0, H);
    g.addColorStop(0, "rgba(2,3,6,0)"); g.addColorStop(1, `rgba(2,3,6,${0.8 * af * pr(t, K.bang, 0.5)})`);
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.7, W, H * 0.3);
  }
  titular(ctx, "¿HASTA DÓNDE LLEGA LA ESTRUCTURA DEL UNIVERSO?", H * 0.86, 30 * KT + 8, a * ventana(t, V[18] + 2.6, K.final + 8.8, 0.8));
  nota(ctx, "ILUSTRACIÓN · EL BIG BANG NO FUE UNA EXPLOSIÓN EN UN PUNTO DEL ESPACIO: FUE EL ESPACIO MISMO EXPANDIÉNDOSE", a * ventana(t, K.bang + 0.8, K.bang + 16.6, 0.8));
  // what each stage is, in a few words
  const etapas: [number, number, string, string][] = [
    [0.5, 3.4, "LOS PRIMEROS INSTANTES", "TODO ES UN PLASMA CALIENTE Y DENSO QUE SE EXPANDE Y SE ENFRÍA"],
    [4.0, 7.4, "380.000 AÑOS DESPUÉS · LA LUZ MÁS ANTIGUA", "DIFERENCIAS DE DENSIDAD DE UNA PARTE EN CIEN MIL"],
    [8.4, 11.8, "LA GRAVEDAD JUNTA LA MATERIA", "DONDE HABÍA UN POCO MÁS, SE ENCIENDEN LAS PRIMERAS ESTRELLAS"],
    [12.4, 16.6, "MILES DE MILLONES DE AÑOS DESPUÉS", "LA RED CÓSMICA, Y MÁS ALLÁ, MÁS RED"],
  ];
  for (const [x0, x1, l1, l2] of etapas) {
    const ae = a * ventana(t, K.bang + x0, K.bang + x1, 0.5);
    if (ae < 0.01) continue;
    texto(ctx, l1, 84, H - 110, 20 * KT + 6, `rgba(${RGB.crema},${0.95 * ae})`, { fam: SANS, peso: 600, esp: 3 });
    texto(ctx, l2, 84, H - 76, 14 * KT + 4, `rgba(${AMBAR},${0.9 * ae})`, { esp: 3 });
  }
};

// ─── real material, full frame between the simulations: a slow push, its caption and its credit ───────────────
const INS = K.inserciones as [string, string, number, number, string, string][];
// how much of the frame the real material covers now (1 = a full shot; between 0 and 1 only in a 0,3 s dissolve)
const cobertura = (t: number) => INS.reduce((m, [, , t0, t1]) => Math.max(m, ventana(t, t0 - 0.15, t1 + 0.15, 0.3)), 0);
const inserciones = (ctx: Ctx, t: number, f: Fotos) => {
  for (const [tipo, clave, t0, t1, rot, cred] of INS) {
    if (t < t0 - 0.2 || t > t1 + 0.2) continue;
    const a = ventana(t, t0 - 0.15, t1 + 0.15, 0.3);
    const im = tipo === "video" ? f[`vid_${clave}`] : f[clave];
    if (!im || a <= 0.01) continue;
    const z = 1.04 + 0.08 * pr(t, t0, t1 - t0), sc = Math.max(W / im.width, H / im.height) * z;
    ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingQuality = "high"; ctx.filter = "contrast(1.04) brightness(0.9) saturate(0.92)";
    ctx.drawImage(im, W / 2 - (im.width * sc) / 2, H / 2 - (im.height * sc) / 2, im.width * sc, im.height * sc); ctx.restore();
    const g = ctx.createLinearGradient(0, H * 0.7, 0, H);
    g.addColorStop(0, "rgba(2,3,6,0)"); g.addColorStop(1, `rgba(2,3,6,${0.75 * a})`);
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.7, W, H * 0.3);
    texto(ctx, rot, 84, H - 92, 20 * KT + 6, `rgba(${RGB.crema},${0.95 * a})`, { fam: SANS, peso: 600, esp: 3 });
    texto(ctx, cred, 84, H - 58, 13 * KT + 4, `rgba(${RGB.crema},${0.6 * a})`, { esp: 4 });
  }
};

export const dibujarCap7 = (ctx: Ctx, t: number, frame: number, fotos: Fotos) => {
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, W, H);
  // one shot at a time: while a real photograph or clip fills the frame, the scenes underneath are not drawn
  const cub = cobertura(t);
  if (cub < 0.999) {
    titulo(ctx, t, fotos);
    antena(ctx, t, fotos);
    paisaje(ctx, t, fotos);
    retina(ctx, t, fotos);
    cancer(ctx, t);
    cierre(ctx, t, fotos);
  }
  if (cub > 0.001) { ctx.fillStyle = `rgba(2,3,6,${cub})`; ctx.fillRect(0, 0, W, H); }
  inserciones(ctx, t, fotos);
  const fin = eSuave(pr(t, K.total - 1.2, 1.2)), ini = 1 - eSuave(pr(t, 0, 0.6));
  if (fin + ini > 0) { ctx.fillStyle = `rgba(2,3,6,${Math.min(1, fin + ini)})`; ctx.fillRect(0, 0, W, H); }
  let golpe = 0;
  for (const g of [K.titulo, K.corte, K.numero, K.bang]) if (t >= g && t - g < 1.5) golpe = Math.max(golpe, 0.9 * Math.exp(-(t - g) * 3));
  const pp = postProceso(ctx.canvas, W, H, {
    px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.92, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
    curva: 0, esq: 0.03, impacto: golpe * 0.4, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
  });
  if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
};
