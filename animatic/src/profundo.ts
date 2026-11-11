// Deep zooms: the teaser's colouring (fractalTeaser.ts) with perturbation, so the camera can go far past the ×10³
// where single-precision floats run out. One reference orbit is computed here in double precision; the GPU only
// follows each pixel's small difference from it (δ' = 2·Z·δ + δ² + δc), which float32 keeps accurate down to widths
// of 1e-30. When a pixel's orbit comes closer to 0 than to the reference, it rebases onto the orbit of 0 (Zhuoran's
// rebasing), so no glitches need patching. Mandelbrot (julia undefined) or the Julia set of c.
import type { Paleta } from "./fractalTeaser";

const VS = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform vec2 uRes;
uniform float uEsc;
uniform float uRot;
uniform float uEsJulia;
uniform sampler2D uRef;
uniform int uLen0;
uniform int uLen1;
uniform int uFilas;
uniform vec2 uCentro;
uniform vec2 uOff;
uniform float uBase;
uniform float uFase;
uniform vec4 uPal[8];
uniform int uNPal;
uniform float uBrillo;
uniform int uMaxIt;
uniform float uTiempo;
uniform float uInterior;
uniform float uBorde;
uniform float uAnillos;
uniform float uDivA;
uniform float uSoloBorde;
out vec4 o;
const int ANCHO = 4096;
vec2 ref(int fila, int i) { return texelFetch(uRef, ivec2(i % ANCHO, fila * uFilas + i / ANCHO), 0).xy; }
vec2 mul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec3 paleta(float u) {
  u = fract(u);
  int i = 0;
  for (int k = 0; k < 7; k++) { if (k + 1 < uNPal && uPal[k + 1].x < u) i = k + 1; }
  vec4 a = uPal[i]; vec4 b = uPal[min(i + 1, uNPal - 1)];
  float f = clamp((u - a.x) / max(b.x - a.x, 1e-5), 0.0, 1.0);
  f = f * f * (3.0 - 2.0 * f);
  return mix(a.yzw, b.yzw, f);
}
void main() {
  vec2 q = gl_FragCoord.xy - 0.5 * uRes;
  float cr0 = cos(uRot), sr0 = sin(uRot);
  q = vec2(cr0 * q.x - sr0 * q.y, sr0 * q.x + cr0 * q.y);
  vec2 off = uOff + q * uEsc;                // the pixel, relative to the reference (exact enough in float32)
  bool julia = uEsJulia > 0.5;
  vec2 dc = julia ? vec2(0.0) : off;
  vec2 dz = julia ? off : vec2(0.0);
  // row 0: the orbit of the centre (Julia) or of the centre's c (Mandelbrot); row 1: the orbit of 0
  int fila = julia ? 0 : 1;
  int len = julia ? uLen0 : uLen1;
  int m = 0;
  vec2 z = ref(fila, 0) + dz;
  vec2 dS = julia ? vec2(uEsc, 0.0) : vec2(0.0);   // dz/dc (or dz/dz0), times the pixel size, so it never overflows
  float trap = 1e9, trapP = 1e9, st = 0.0, stPrev = 0.0, r2 = 0.0;
  int n = 0;
  if (!julia && uEsc * uRes.x > 1e-4 && uMaxIt > 200) {   // (not for the few-step views, where the shortcut would show the set too early)
    vec2 c = uCentro + q * uEsc;               // the pixel itself (off is relative to the reference, not to the centre)
    float qq = (c.x - 0.25) * (c.x - 0.25) + c.y * c.y;
    if (qq * (qq + (c.x - 0.25)) <= 0.25 * c.y * c.y || (c.x + 1.0) * (c.x + 1.0) + c.y * c.y <= 0.0625) n = uMaxIt;
  }
  for (int k = 0; k < 120000; k++) {
    if (n >= uMaxIt) break;
    dS = 2.0 * mul(z, dS) + vec2(julia ? 0.0 : uEsc, 0.0);
    vec2 Zm = ref(fila, m);
    dz = 2.0 * mul(Zm, dz) + mul(dz, dz) + dc;
    m++;
    z = ref(fila, m) + dz;
    r2 = dot(z, z);
    if (r2 > 1e6) break;
    // rebase onto the orbit of 0 when the pixel comes closer to 0 than to the reference, or the reference ends
    if (r2 < dot(dz, dz) || m >= len - 1) { dz = z; m = 0; fila = 1; len = uLen1; }
    trap = min(trap, abs(r2 - (0.25 + 0.16 * sin(uTiempo * 1.9))));
    trapP = min(trapP, abs(z.x) * abs(z.y));
    stPrev = st;
    st += 0.5 + 0.5 * sin(5.0 * atan(z.y, z.x) + uTiempo * 2.4);
    n++;
  }
  vec3 col;
  if (n >= uMaxIt) {
    float k1 = exp(-trap * 7.0), k2 = exp(-sqrt(trapP) * 9.0);
    col = vec3(0.015 + 0.08 * k1 + 0.1 * k2, 0.03 + 0.15 * k1 + 0.16 * k2, 0.1 + 0.36 * k1 + 0.26 * k2) * uInterior;
  } else {
    float zl = sqrt(r2), lz = log(zl);
    float fr = 1.0 + log2(log(1e3) / lz);
    float nu = max(float(n) + fr - uBase, 0.0);   // counted from the view's own minimum, so deep views keep contrast
    float stA = n > 1 ? st / float(n) : 0.0;
    float stB = n > 2 ? stPrev / float(n - 1) : stA;
    float stripe = mix(stB, stA, clamp(fr, 0.0, 1.0));
    float dpx = (0.5 * zl * lz) / max(length(dS), 1e-30);
    // deep in, the counts are large: the colour follows the count relative to the view's own range (uFase holds it)
    vec3 pc = paleta(log(nu + 1.0) * 0.3 + sqrt(nu) * 0.11 + uFase);
    float borde = exp(-dpx * 0.4) * 0.5 * uBorde;
    float kS = clamp((nu - 4.0) / 24.0, 0.0, 1.0);
    float luzS = 1.0 + kS * (0.55 * stripe - 0.25);
    float piso = 0.22 + 0.78 * min(1.0, nu / 60.0);
    // uBorde > 1 lights the border in gold
    col = pc * luzS * piso + borde * mix(vec3(0.85, 0.9, 1.0), vec3(1.0, 0.76, 0.42), clamp(uBorde - 1.0, 0.0, 1.0));
  }
  // only the border: the exterior and the interior go dark, the border stays lit in gold
  if (uSoloBorde > 0.0) {
    vec3 oro = vec3(1.0, 0.8, 0.45);
    if (n >= uMaxIt) col *= 1.0 - uSoloBorde;
    else {
      float zl2 = sqrt(r2);
      float dpx2 = (0.5 * zl2 * log(zl2)) / max(length(dS), 1e-30);
      col = mix(col, oro * exp(-dpx2 * 0.55) * 1.4, uSoloBorde);
    }
  }
  // rings: the curves of the first steps of the rule (|zₖ| = bailout, k ≤ uAnillos), the newest in gold, the older
  // ones cooling to blue; what has not escaped yet (the set as known after uAnillos steps) glows faintly warm
  if (uAnillos >= 0.0) {
    // the step count with the bailout of the definition (|z| = 2): ring k is the curve |zₖ(c)| = 2; near a copy of
    // period p, one ring every p iterations (uDivA = p), so the copy's rings look like the whole set's
    float nuR = n >= uMaxIt ? 1e9 : max(float(n) + 1.0 - log2(log(sqrt(r2)) / log(2.0)) - uBase, 0.0) / uDivA;
    if (nuR < uAnillos) {
      float k = floor(nuR + 0.5), dk = abs(nuR - k);
      float linea = (1.0 - smoothstep(0.0, 1.4 * fwidth(nuR) + 0.002, dk)) * step(0.5, k);
      float edad = uAnillos - k;
      vec3 cl = mix(vec3(1.0, 0.82, 0.5), vec3(0.35, 0.5, 1.0), clamp(edad / 8.0, 0.0, 1.0));
      col = cl * linea * (0.3 + 0.9 * exp(-edad * 0.35)) + vec3(0.01, 0.012, 0.03);
    } else {
      float cerca = exp(-(nuR - uAnillos) * 1.5);
      col = vec3(0.025, 0.02, 0.018) + vec3(0.55, 0.38, 0.2) * cerca * step(nuR, 1e8);
    }
  }
  o = vec4(min(col * uBrillo, 1.0), 1.0);
}`;

let gl: WebGL2RenderingContext | null = null;
let lienzo: HTMLCanvasElement | null = null;
let tex: WebGLTexture | null = null;
const U: Record<string, WebGLUniformLocation | null> = {};
const ANCHO = 4096;

const compilar = (g: WebGL2RenderingContext, tipo: number, src: string) => {
  const s = g.createShader(tipo)!;
  g.shaderSource(s, src);
  g.compileShader(s);
  if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) ?? "shader");
  return s;
};

// an orbit in double precision, until it escapes (|z|² > 1e6) or maxIt
const orbita = (z0: [number, number], c: [number, number], maxIt: number) => {
  const out = new Float64Array(2 * (maxIt + 2));
  let [x, y] = z0, n = 0;
  out[0] = x; out[1] = y;
  while (n <= maxIt) {
    const nx = x * x - y * y + c[0];
    y = 2 * x * y + c[1]; x = nx; n++;
    out[2 * n] = x; out[2 * n + 1] = y;
    if (x * x + y * y > 1e6) break;
  }
  return { datos: out, len: n + 1 };
};

let cacheClave = "";

export type ParamP = { cx: number; cy: number; ancho: number; julia?: [number, number]; rot?: number; fase: number; paleta: Paleta; brillo: number; maxIt: number; tiempo?: number; interior?: number; borde?: number; anillos?: number; divA?: number; soloBorde?: number;
  // a reference computed elsewhere in high precision (the periodic orbit of a nucleus), and the view centre minus it
  // abierta: the orbit does not come back to 0 (a Misiurewicz point), so no closing 0 is appended
  ref?: { clave: string; orbita: number[]; abierta?: boolean }; off?: [number, number]; base?: number };

export const pintarProfundo = (w: number, h: number, P: ParamP) => {
  if (!lienzo) {
    lienzo = document.createElement("canvas");
    gl = lienzo.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false })!;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compilar(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compilar(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ["uRes", "uEsc", "uRot", "uEsJulia", "uRef", "uLen0", "uLen1", "uFilas", "uCentro", "uOff", "uBase", "uFase", "uPal", "uNPal", "uBrillo", "uMaxIt", "uTiempo", "uInterior", "uBorde", "uAnillos", "uDivA", "uSoloBorde"]) U[n] = gl.getUniformLocation(prog, n);
    tex = gl.createTexture();
  }
  const g = gl!;
  // the reference orbits: row 0 = the centre's own orbit, row 1 = the orbit of 0 (for c = the centre, or the Julia c)
  const c: [number, number] = P.julia ?? [P.cx, P.cy];
  const clave = P.ref ? P.ref.clave : `${P.cx},${P.cy},${c[0]},${c[1]},${P.maxIt}`;
  if (clave !== cacheClave) {
    const fija = P.ref ? (P.ref.abierta ? { datos: Float64Array.from(P.ref.orbita), len: P.ref.orbita.length / 2 } : { datos: Float64Array.from([...P.ref.orbita, 0, 0]), len: P.ref.orbita.length / 2 + 1 }) : null;
    const r0 = fija ?? (P.julia ? orbita([P.cx, P.cy], c, P.maxIt) : orbita([0, 0], c, P.maxIt));
    const r1 = fija ?? orbita([0, 0], c, P.maxIt);
    cacheClave = clave;
    const filas = Math.ceil(Math.max(r0.len, r1.len) / ANCHO);
    const datos = new Float32Array(ANCHO * filas * 2 * 2);
    for (let i = 0; i < r0.len; i++) { datos[2 * i] = r0.datos[2 * i]; datos[2 * i + 1] = r0.datos[2 * i + 1]; }
    const base = ANCHO * filas * 2;
    for (let i = 0; i < r1.len; i++) { datos[base + 2 * i] = r1.datos[2 * i]; datos[base + 2 * i + 1] = r1.datos[2 * i + 1]; }
    g.activeTexture(g.TEXTURE0);
    g.bindTexture(g.TEXTURE_2D, tex);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
    g.texImage2D(g.TEXTURE_2D, 0, g.RG32F, ANCHO, filas * 2, 0, g.RG, g.FLOAT, datos);
    g.uniform1i(U.uFilas, filas);
    g.uniform1i(U.uLen0, r0.len);
    g.uniform1i(U.uLen1, r1.len);
  }
  if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; }
  g.viewport(0, 0, w, h);
  g.uniform1i(U.uRef, 0);
  g.uniform2f(U.uRes, w, h);
  g.uniform1f(U.uEsc, P.ancho / w);
  g.uniform1f(U.uRot, P.rot ?? 0);
  g.uniform1f(U.uEsJulia, P.julia ? 1 : 0);
  g.uniform2f(U.uCentro, P.cx, P.cy);
  g.uniform1f(U.uBase, P.base ?? 0);
  g.uniform2f(U.uOff, P.ref ? P.off![0] : 0, P.ref ? P.off![1] : 0);
  g.uniform1f(U.uFase, P.fase);
  const pal = new Float32Array(32);
  P.paleta.forEach((s, i) => pal.set(s, i * 4));
  g.uniform4fv(U.uPal, pal);
  g.uniform1i(U.uNPal, P.paleta.length);
  g.uniform1f(U.uBrillo, P.brillo);
  g.uniform1i(U.uMaxIt, P.maxIt);
  g.uniform1f(U.uTiempo, P.tiempo ?? 0);
  g.uniform1f(U.uInterior, P.interior ?? 1);
  g.uniform1f(U.uBorde, P.borde ?? 1);
  g.uniform1f(U.uAnillos, P.anillos ?? -1);
  g.uniform1f(U.uDivA, P.divA ?? 1);
  g.uniform1f(U.uSoloBorde, P.soloBorde ?? 0);
  g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  return lienzo;
};

// the escape count of one point, by perturbation on a periodic reference (double precision), for the colour base
export const escapeRef = (orb: number[], dc: [number, number], maxIt: number, abierta = false) => {
  const p = orb.length / 2 - (abierta ? 1 : 0);
  let dx = 0, dy = 0, m = 0;
  for (let n = 0; n < maxIt; n++) {
    const X = orb[2 * m], Y = orb[2 * m + 1];
    const nx = 2 * (X * dx - Y * dy) + dx * dx - dy * dy + dc[0];
    const ny = 2 * (X * dy + Y * dx) + 2 * dx * dy + dc[1];
    dx = nx; dy = ny; m++;
    const Zx = m < p || abierta ? orb[2 * m] : 0, Zy = m < p || abierta ? orb[2 * m + 1] : 0;
    const zx = Zx + dx, zy = Zy + dy, r2 = zx * zx + zy * zy;
    if (r2 > 1e6) return n;
    if (r2 < dx * dx + dy * dy || m >= p) { dx = zx; dy = zy; m = 0; }
  }
  return maxIt;
};
