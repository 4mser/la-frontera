// Many escape-time fractals on the GPU, coloured like the teaser (src/fractalTeaser.ts): smooth count through the
// teaser palettes, stripe average, a border glow and orbit-trap interiors. Used by «Deleite» (src/deleite.ts).
// Rules (uRegla):
//   0 Mandelbrot / Julia z² + c        1 Burning Ship (|x|+i|y|)² + c      2 Tricorn conj(z)² + c
//   3 Multibrot zᵖ + c (p real, morphs) 4 Celtic |Re z²| + i Im z² + c      5 Buffalo |Re z²| − i|Im z²| + c
//   6 Perpendicular (x − i|y|)² + c     7 Phoenix z² + Re c + Im c · zₙ₋₁   8 Newton z³ − 1 (basins)
//   9 Nova z − R(z³−1)/(3z²) + c        10 Magnet I ((z²+c−1)/(2z+c−2))²     11 Lambda c·z(1−z)
//   12 c·sin z                          13 Lyapunov (Markus), sequence AABAB  14 Spider (c ← c/2 + z)
//   15 Mandelbrot with Pickover stalks (orbit trap on the axes)
import type { Paleta } from "./fractalTeaser";

const VS = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec2 uCentro;
uniform float uEsc;
uniform float uRot;
uniform vec2 uJulia;
uniform float uEsJulia;
uniform vec4 uPal[8];
uniform int uNPal;
uniform float uFase;
uniform float uBrillo;
uniform int uMaxIt;
uniform float uTiempo;
uniform int uRegla;
uniform float uPot;
uniform float uFondo;
out vec4 o;
vec3 paleta(float u) {
  u = fract(u);
  int i = 0;
  for (int k = 0; k < 7; k++) { if (k + 1 < uNPal && uPal[k + 1].x < u) i = k + 1; }
  vec4 a = uPal[i]; vec4 b = uPal[min(i + 1, uNPal - 1)];
  float f = clamp((u - a.x) / max(b.x - a.x, 1e-5), 0.0, 1.0);
  f = f * f * (3.0 - 2.0 * f);
  return mix(a.yzw, b.yzw, f);
}
vec2 mul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec2 dvd(vec2 a, vec2 b) { float d = dot(b, b) + 1e-30; return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / d; }
vec2 cpow(vec2 z, float p) { float r = length(z); if (r < 1e-30) return vec2(0.0); float a = atan(z.y, z.x) * p; return pow(r, p) * vec2(cos(a), sin(a)); }
vec2 csin(vec2 z) { return vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y)); }
vec2 ccos(vec2 z) { return vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y)); }
void main() {
  vec2 q = gl_FragCoord.xy - 0.5 * uRes;
  q.y = -q.y;
  float cr0 = cos(uRot), sr0 = sin(uRot);
  q = vec2(cr0 * q.x - sr0 * q.y, sr0 * q.x + cr0 * q.y);
  vec2 p = uCentro + q * uEsc;
  bool julia = uEsJulia > 0.5;
  vec3 col;
  // ── Lyapunov (Markus): r alternates between a and b in the sequence AABAB ──
  if (uRegla == 13) {
    float a = p.x, b = p.y, x = 0.5, lam = 0.0;
    int seq[5] = int[5](0, 0, 1, 0, 1);
    for (int k = 0; k < 600; k++) {
      float r = seq[k % 5] == 0 ? a : b;
      x = r * x * (1.0 - x);
      if (k >= 100) lam += log(max(abs(r * (1.0 - 2.0 * x)), 1e-9));
    }
    lam /= 500.0;
    if (lam < 0.0) col = paleta(0.32 + 0.22 * clamp(-lam, 0.0, 2.0) + uFase) * (0.35 + 0.65 * clamp(-lam * 1.5, 0.0, 1.0));
    else col = paleta(0.62 + uFase) * 0.12 * (1.0 - clamp(lam, 0.0, 1.0)) + vec3(0.01, 0.015, 0.04);
    o = vec4(min(col * uBrillo, 1.0), 1.0); return;
  }
  // ── Newton z³ − 1: basins of the three roots ──
  if (uRegla == 8) {
    vec2 z = julia ? p : p;
    int n = 0; int raiz = -1;
    vec2 R0 = vec2(1.0, 0.0), R1 = vec2(-0.5, 0.8660254), R2 = vec2(-0.5, -0.8660254);
    float relaj = 1.0 + 0.0 * uPot;
    for (int k = 0; k < 120; k++) {
      vec2 z2 = mul(z, z);
      z = z - relaj * dvd(mul(z2, z) - vec2(1.0, 0.0), 3.0 * z2);
      if (distance(z, R0) < 1e-3) { raiz = 0; break; }
      if (distance(z, R1) < 1e-3) { raiz = 1; break; }
      if (distance(z, R2) < 1e-3) { raiz = 2; break; }
      n++;
    }
    float sh = exp(-float(n) * 0.09);
    col = paleta(0.12 + 0.27 * float(raiz) + 0.015 * float(n) + uFase) * (0.25 + 0.95 * sh);
    float bd = clamp(fwidth(float(n)) * 0.18, 0.0, 1.0);
    col += bd * vec3(0.9, 0.92, 1.0) * 0.6;
    o = vec4(min(col * uBrillo, 1.0), 1.0); return;
  }
  vec2 z, c, zPrev = vec2(0.0);
  if (julia) { z = p; c = uJulia; } else { c = p; z = vec2(0.0); }
  if (uRegla == 9 && !julia) z = vec2(1.0, 0.0);                       // Nova starts at the root
  if (uRegla == 11 && !julia) z = vec2(0.5, 0.0);                      // Lambda: the critical point
  if (uRegla == 12 && !julia) z = vec2(1.5707963, 0.0);                // c·sin z: the critical point π/2
  if (uRegla == 10 && !julia) z = vec2(0.0);
  float trap = 1e9, trapP = 1e9, st = 0.0, stPrev = 0.0, r2 = 0.0;
  float esc = uRegla == 12 ? 2500.0 : (uRegla == 10 ? 1e4 : 1e6);
  int n = 0;
  bool conv = false;
  for (int k = 0; k < 2000; k++) {
    if (n >= uMaxIt) break;
    vec2 zn;
    if (uRegla == 1) { vec2 a = abs(z); zn = vec2(a.x * a.x - a.y * a.y, 2.0 * a.x * a.y) + c; }
    else if (uRegla == 2) { zn = vec2(z.x * z.x - z.y * z.y, -2.0 * z.x * z.y) + c; }
    else if (uRegla == 3) { zn = cpow(z, uPot) + c; }
    else if (uRegla == 4) { zn = vec2(abs(z.x * z.x - z.y * z.y), 2.0 * z.x * z.y) + c; }
    else if (uRegla == 5) { zn = vec2(abs(z.x * z.x - z.y * z.y), -abs(2.0 * z.x * z.y)) + c; }
    else if (uRegla == 6) { zn = vec2(z.x * z.x - z.y * z.y, -2.0 * abs(z.y) * z.x) + c; }
    else if (uRegla == 7) { zn = mul(z, z) + vec2(c.x, 0.0) + c.y * zPrev; }
    else if (uRegla == 9) { vec2 z2 = mul(z, z); zn = z - dvd(mul(z2, z) - vec2(1.0, 0.0), 3.0 * z2) + c; }
    else if (uRegla == 10) { vec2 a = dvd(mul(z, z) + c - vec2(1.0, 0.0), 2.0 * z + c - vec2(2.0, 0.0)); zn = mul(a, a); }
    else if (uRegla == 11) { zn = mul(c, mul(z, vec2(1.0, 0.0) - z)); }
    else if (uRegla == 12) { zn = mul(c, csin(z)); }
    else if (uRegla == 14) { zn = mul(z, z) + c; c = 0.5 * c + zn; }
    else { zn = mul(z, z) + c; }
    zPrev = z; z = zn;
    r2 = uRegla == 12 ? z.y * z.y : dot(z, z);
    if (uRegla == 9 || uRegla == 10) { if (dot(z - zPrev, z - zPrev) < 1e-10) { conv = true; break; } }
    if (r2 > esc) break;
    trap = min(trap, abs(dot(z, z) - (0.25 + 0.16 * sin(uTiempo * 1.9))));
    trapP = min(trapP, uRegla == 15 ? min(abs(z.x), abs(z.y)) : abs(z.x) * abs(z.y));
    stPrev = st;
    st += 0.5 + 0.5 * sin(5.0 * atan(z.y, z.x) + uTiempo * 2.4);
    n++;
  }
  if (conv) {
    // convergent rules (Nova, Magnet): coloured by how long they take to settle
    float sh = exp(-float(n) * 0.035);
    col = paleta(0.1 + 0.022 * float(n) + uFase) * (0.3 + 0.9 * sh);
    col += clamp(fwidth(float(n)) * 0.12, 0.0, 1.0) * vec3(0.9, 0.92, 1.0) * 0.5;
  } else if (n >= uMaxIt) {
    float k1 = exp(-trap * 7.0), k2 = exp(-sqrt(trapP) * 9.0);
    col = vec3(0.015 + 0.08 * k1 + 0.1 * k2, 0.03 + 0.15 * k1 + 0.16 * k2, 0.1 + 0.36 * k1 + 0.26 * k2) * uFondo;
    if (uRegla == 9 || uRegla == 10) col = paleta(0.08 + 0.3 * exp(-trap) + uFase) * 0.35 * uFondo;
  } else {
    float zl = sqrt(max(r2, 1.0001)), lz = log(zl);
    float pw = uRegla == 3 ? max(uPot, 1.05) : 2.0;
    float fr = 1.0 + log(log(esc) / (2.0 * lz)) / log(pw);
    if (uRegla == 9 || uRegla == 10 || uRegla == 11 || uRegla == 12) fr = 0.5;
    float nu = float(n) + clamp(fr, 0.0, 1.0);
    float stA = n > 1 ? st / float(n) : 0.0;
    float stB = n > 2 ? stPrev / float(n - 1) : stA;
    float stripe = mix(stB, stA, clamp(fr, 0.0, 1.0));
    vec3 pc = paleta(log(nu + 1.0) * 0.3 + sqrt(nu) * 0.11 + uFase);
    float kS = clamp((nu - 4.0) / 24.0, 0.0, 1.0);
    float luzS = 1.0 + kS * (0.55 * stripe - 0.25);
    float piso = 0.22 + 0.78 * min(1.0, nu / 60.0);
    // the border glow: where the count changes fast on screen
    float borde = clamp(fwidth(nu) * 0.09, 0.0, 1.0) * 0.55 * min(1.0, nu / 12.0);
    float stalk = uRegla == 15 ? exp(-sqrt(trapP) * 40.0) * 1.6 : 0.0;
    col = pc * luzS * piso + borde * vec3(0.85, 0.9, 1.0) + stalk * vec3(1.0, 0.86, 0.6) * 0.9;
  }
  o = vec4(min(col * uBrillo, 1.0), 1.0);
}`;

let gl: WebGL2RenderingContext | null = null;
let lienzo: HTMLCanvasElement | null = null;
const U: Record<string, WebGLUniformLocation | null> = {};
const compilar = (g: WebGL2RenderingContext, tipo: number, src: string) => {
  const s = g.createShader(tipo)!;
  g.shaderSource(s, src);
  g.compileShader(s);
  if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) ?? "shader");
  return s;
};

export type ParamMF = { cx: number; cy: number; esc: number; rot?: number; julia?: [number, number]; regla: number; pot?: number; fase?: number; paleta: Paleta; brillo?: number; maxIt?: number; tiempo?: number; fondo?: number };

export const pintarMulti = (w: number, h: number, P: ParamMF) => {
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
    for (const n of ["uRes", "uCentro", "uEsc", "uRot", "uJulia", "uEsJulia", "uPal", "uNPal", "uFase", "uBrillo", "uMaxIt", "uTiempo", "uRegla", "uPot", "uFondo"]) U[n] = gl.getUniformLocation(prog, n);
  }
  const g = gl!;
  if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; }
  g.viewport(0, 0, w, h);
  g.uniform2f(U.uRes, w, h);
  g.uniform2f(U.uCentro, P.cx, P.cy);
  g.uniform1f(U.uEsc, P.esc);
  g.uniform1f(U.uRot, P.rot ?? 0);
  g.uniform2f(U.uJulia, P.julia?.[0] ?? 0, P.julia?.[1] ?? 0);
  g.uniform1f(U.uEsJulia, P.julia ? 1 : 0);
  const pal = P.paleta.slice(0, 8);
  g.uniform4fv(U.uPal, new Float32Array(pal.flat().concat(new Array((8 - pal.length) * 4).fill(0))));
  g.uniform1i(U.uNPal, pal.length);
  g.uniform1f(U.uFase, P.fase ?? 0);
  g.uniform1f(U.uBrillo, P.brillo ?? 0.92);
  g.uniform1i(U.uMaxIt, P.maxIt ?? 300);
  g.uniform1f(U.uTiempo, P.tiempo ?? 0);
  g.uniform1i(U.uRegla, P.regla);
  g.uniform1f(U.uPot, P.pot ?? 2);
  g.uniform1f(U.uFondo, P.fondo ?? 1);
  g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  return lienzo;
};
