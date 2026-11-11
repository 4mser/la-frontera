// Cierre · alejarse al universo: desde el Punto azul pálido, un solo alejamiento continuo que atraviesa escalas.
// Tierra → Sol y órbitas (simulación) → el Sol es una estrella de la vecindad → la Vía Láctea (NASA/JPL-Caltech,
// R. Hurt) → una galaxia más entre las del campo profundo del Webb → la red cósmica (simulación en GPU).
// Cada capa entra cuando la anterior ya es un punto en el lugar que le corresponde. Función pura del tiempo local l.
import { VS_PANTALLA, azar, escena, pantalla, programa } from "./gpu";

type Ctx = CanvasRenderingContext2D;
const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pr = (t: number, a: number, d: number) => cl((t - a) / d);
const eS = (x: number) => x * x * (3 - 2 * x);
const eIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
const logLerp = (a: number, b: number, x: number) => Math.exp(lerp(Math.log(a), Math.log(b), x));

const brillo = (ctx: Ctx, x: number, y: number, r: number, a: number, rgb: string) => {
  if (a <= 0 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.2, `rgba(${rgb},${a * 0.4})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
};

// ── capa 1 · el sistema solar (órbitas reales en UA, planetas girando muy lento) ─────────────────────────────────
const PLANETAS: [number, number, string, number][] = [   // a (UA), fase, color, tamaño
  [0.39, 1.2, "200,190,180", 1.6], [0.72, 2.6, "240,220,190", 2.2], [1.0, 0, "120,170,255", 2.4], [1.52, 4.0, "230,140,110", 2.0],
  [5.2, 0.8, "230,200,160", 3.6], [9.5, 3.4, "235,215,170", 3.2], [19.2, 5.1, "170,220,230", 2.6], [30.1, 2.2, "130,160,240", 2.6],
];
const sistemaSolar = (ctx: Ctx, cx: number, cy: number, au: number, l: number, a: number) => {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (const [r, f, col, tam] of PLANETAS) {
    const R = r * au;
    if (R < 2 || R > 6000) continue;
    ctx.strokeStyle = `rgba(170,200,240,${0.3 * a})`; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    const ang = f - l * 0.04 / Math.pow(r, 1.5);
    const px = cx + Math.cos(ang) * R, py = cy + Math.sin(ang) * R;
    const esTierra = r === 1.0;
    brillo(ctx, px, py, esTierra ? 14 : tam * 3, (esTierra ? 0.9 : 0.6) * a, col);
    ctx.fillStyle = `rgba(${col},${a})`; ctx.beginPath(); ctx.arc(px, py, esTierra ? 2.6 : tam * 0.7, 0, Math.PI * 2); ctx.fill();
  }
  // el Sol
  brillo(ctx, cx, cy, Math.min(160, Math.max(24, au * 0.25)), 0.85 * a, "255,228,180");
  brillo(ctx, cx, cy, 10, a, "255,250,235");
  ctx.restore();
};
// posición de la Tierra en el instante l (para centrar la cámara en ella al comienzo)
const tierraEn = (l: number) => { const ang = -l * 0.04; return [Math.cos(ang), Math.sin(ang)] as const; };

// ── estrellas de la vecindad (aparecen cuando el Sol se vuelve un punto) ──────────────────────────────────────────
const ESTRELLAS = (() => { const r = azar(31); return Array.from({ length: 900 }, () => ({ x: r() * 2 - 1, y: r() * 2 - 1, b: r(), c: r() })); })();

// ── capa 4 · la red cósmica: filamentos de un Voronoi con varias escalas, nodos dorados, galaxias en los filamentos ──
const FS_RED = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform vec2 uRes; uniform float uEsc, uT, uA;
float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 h2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
float ruido(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * ruido(p); p = p * 2.1 + 3.3; a *= 0.5; } return s; }
vec2 voro(vec2 x){
  vec2 n = floor(x), f = fract(x); float d1 = 8.0, d2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(i, j); vec2 r = g + h2(n + g) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return vec2(sqrt(d1), sqrt(d2));
}
// densidad de la red: filamentos irregulares (Voronoi deformado, grosor variable) y nudos en los cruces
float red(vec2 p){
  p += 0.35 * vec2(fbm(p * 1.4), fbm(p * 1.4 + 7.7)) - 0.17;
  vec2 a = voro(p * 2.6), b = voro(p * 6.1 + 2.3);
  float w = 0.03 + 0.05 * fbm(p * 3.0);
  float fil = exp(-pow((a.y - a.x) / w, 2.0)) + 0.45 * exp(-pow((b.y - b.x) / (w * 0.7), 2.0));
  float nudo = exp(-a.x * a.x / 0.006);
  return fil * (0.35 + 0.65 * fbm(p * 5.0)) + 1.6 * nudo;
}
void main(){
  vec2 p = (v - 0.5) * vec2(uRes.x / uRes.y, 1.0) * uEsc;
  float d = red(p);
  // galaxias: puntos diminutos cuya probabilidad sigue la densidad (como las partículas de una simulación)
  vec3 col = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float esc = k == 0 ? 260.0 : 520.0;
    vec2 q = p * esc / uEsc * 1.0, c = floor(q), f = fract(q) - 0.5;
    vec2 off = h2(c) - 0.5;
    float prob = clamp(d * (k == 0 ? 0.32 : 0.55), 0.0, 0.95);
    float hay = step(1.0 - prob, h1(c + 11.0));
    float pt = exp(-dot(f - off * 0.6, f - off * 0.6) * 60.0) * hay;
    vec3 tono = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.78, 0.5), h1(c + 3.0));
    col += tono * pt * (k == 0 ? 1.0 : 0.6);
  }
  // el gas: un resplandor tenue violeta en los filamentos, dorado en los nudos
  col += vec3(0.28, 0.16, 0.55) * pow(clamp(d, 0.0, 2.0), 1.3) * 0.22 + vec3(1.0, 0.75, 0.45) * exp(-pow(max(0.0, 2.2 - d), 2.0)) * 0.12;
  o = vec4(col * uA * 2.3, 1.0);
}`;
let progRed: ReturnType<typeof programa> | null = null;
const redCosmica = (W: number, H: number, esc: number, l: number, a: number) => {
  const { c, g } = escena("red", W, H);
  if (!progRed) progRed = programa(g, VS_PANTALLA, FS_RED);
  g.useProgram(progRed.p);
  g.uniform2f(progRed.u("uRes"), W, H); g.uniform1f(progRed.u("uEsc"), esc); g.uniform1f(progRed.u("uT"), l); g.uniform1f(progRed.u("uA"), a);
  pantalla(g);
  return c;
};

// ══ el viaje completo ════════════════════════════════════════════════════════════════════════════════════════
const SOL_EN_VIA = [0.5, 0.755];                            // la vecindad solar en la ilustración de la Vía Láctea
export const pintarEscalas = (ctx: Ctx, W: number, H: number, l: number, im: { via?: HTMLImageElement; webb?: HTMLImageElement }) => {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  // 1 · sistema solar: de la Tierra (centro) al Sol, y las órbitas encogiéndose hasta que el Sol es un punto
  const au = logLerp(2600, 5, eIO(pr(l, 0.6, 7.4)));
  const [ex, ey] = tierraEn(l);
  const centrar = eIO(pr(l, 0.6, 2.8));                       // la cámara pasa de la Tierra al Sol
  const sx = W / 2 - ex * au * (1 - centrar), sy = H / 2 - ey * au * (1 - centrar);
  const aSol = eS(pr(l, 0.2, 1.0)) * (1 - eS(pr(l, 8.4, 1.4)));
  sistemaSolar(ctx, sx, sy, au, l, aSol);
  // 2 · estrellas de la vecindad y la Vía Láctea, que entra con el Sol en su lugar (abajo del centro)
  const viaAncho = logLerp(7000, 46, eIO(pr(l, 7.0, 8.8)));
  const centrarVia = eIO(pr(l, 9.0, 4.0));
  const vx = W / 2 - (SOL_EN_VIA[0] - 0.5) * viaAncho * (1 - centrarVia), vy = H / 2 - (SOL_EN_VIA[1] - 0.5) * viaAncho * (1 - centrarVia);
  const aVia = eS(pr(l, 7.2, 2.2)) * (1 - eS(pr(l, 15.4, 1.6)));
  const aEst = eS(pr(l, 5.8, 1.5)) * (1 - eS(pr(l, 9.0, 2.0)));
  if (aEst > 0) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const esc = logLerp(1.0, 0.25, eIO(pr(l, 5.8, 4.0)));
    for (const s of ESTRELLAS) {
      const x = W / 2 + s.x * W * esc * 1.4, y = H / 2 + s.y * H * esc * 1.4;
      ctx.fillStyle = s.c > 0.7 ? `rgba(255,220,180,${aEst * (0.3 + 0.7 * s.b)})` : `rgba(210,225,255,${aEst * (0.3 + 0.7 * s.b)})`;
      ctx.fillRect(x, y, 1.6, 1.6);
    }
    ctx.restore();
  }
  // 3 · el campo profundo del Webb detrás, cuando la Vía Láctea ya es una galaxia entre muchas
  const aWebb = eS(pr(l, 12.2, 2.6)) * (1 - eS(pr(l, 17.8, 2.2)));
  if (im.webb && aWebb > 0) {
    const s = logLerp(2.6, 0.95, eIO(pr(l, 11.6, 8.0)));
    const k = Math.max(W / im.webb.width, H / im.webb.height) * s, w = im.webb.width * k, h = im.webb.height * k;
    ctx.save(); ctx.globalAlpha = aWebb; ctx.drawImage(im.webb, W / 2 - w / 2, H / 2 - h / 2, w, h); ctx.restore();
  }
  if (im.via && aVia > 0) {
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = aVia;
    ctx.drawImage(im.via, vx - viaAncho / 2, vy - viaAncho / 2, viaAncho, viaAncho);
    ctx.restore();
  }
  // 4 · la red cósmica: todo se vuelve un nodo de la red, que sigue alejándose
  const aRed = eS(pr(l, 16.6, 2.6)) * (1 - eS(pr(l, 22.6, 1.2)));
  if (aRed > 0) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(redCosmica(W, H, logLerp(0.5, 1.4, eIO(pr(l, 16.2, 7.6))), l, aRed), 0, 0);
    ctx.restore();
  }
};
