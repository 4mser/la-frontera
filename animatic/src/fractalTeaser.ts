// The teaser's fractal colouring (teaser-v1b/src/escenas.ts, pintaFractal) ported to the GPU: smooth count through
// a rich palette, stripe average for fine detail, border glow from the distance estimate, orbit-trap interior, and
// the three cut modes of the teaser: full colour, lens (only inside a circle) and cream duotone (negative).
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
uniform int uModo;
uniform float uLente;
uniform float uFase;
uniform vec4 uPal[8];
uniform int uNPal;
uniform float uBrillo;
uniform int uMaxIt;
uniform float uTiempo;
uniform float uOnda;
uniform int uRegla;
uniform float uPlaneta;
uniform vec3 uEsfera;
uniform float uGiro;
uniform float uInclina;
uniform float uMezcla;
uniform float uCampo;
uniform float uInterior;
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
void main() {
  vec2 q = gl_FragCoord.xy - 0.5 * uRes;
  if (uModo == 1 && length(q) > uLente) { o = vec4(0.0, 0.0, 0.0, 1.0); return; }
  float cr0 = cos(uRot), sr0 = sin(uRot);
  q = vec2(cr0 * q.x - sr0 * q.y, sr0 * q.x + cr0 * q.y);
  vec2 p = uCentro + q * uEsc;
  // planet: the fractal wrapped on a lit, turning sphere
  vec3 nrm = vec3(0.0, 0.0, 1.0);
  float esfA = 1.0;
  if (uPlaneta > 0.5) {
    vec2 s = (gl_FragCoord.xy - uEsfera.xy) / uEsfera.z;
    float d2 = dot(s, s);
    if (d2 > 1.0) {
      float atm = exp(-(sqrt(d2) - 1.0) * 14.0) * 0.55;
      o = vec4(vec3(0.55, 0.7, 1.0) * atm, atm); return;
    }
    nrm = vec3(s, sqrt(1.0 - d2));
    vec3 v = nrm;
    float ci = cos(uInclina), si = sin(uInclina);
    v = vec3(v.x, ci * v.y - si * v.z, si * v.y + ci * v.z);
    float lon = mod(atan(v.x, v.z) + uGiro + 3.14159265, 6.2831853) - 3.14159265, lat = asin(clamp(v.y, -1.0, 1.0));
    p = uCentro + vec2(lon, lat) * uEsc;
  }
  bool julia = uEsJulia > 0.5;
  // the Mandelbrot set and the Julia sets are two slices of one four-dimensional object: uMezcla turns the slice
  // (0 = Mandelbrot, 1 = Julia of uJulia); uCampo lets c drift slowly from one place of the plane to another
  float s = julia ? 1.0 : uMezcla;
  vec2 cJ = uJulia + uCampo * 0.16 * vec2(sin(p.y * 1.7 + uTiempo * 0.6) + 0.5 * sin(p.x * 3.1 - uTiempo * 0.9), cos(p.x * 1.3 - uTiempo * 0.5) + 0.5 * cos(p.y * 2.7 + uTiempo * 0.7));
  vec2 z = s * p;
  vec2 c = mix(p, cJ, s);
  vec2 d = vec2(s, 0.0);
  float trap = 1e9, trapP = 1e9, st = 0.0, stPrev = 0.0, r2 = 0.0;
  int n = 0;
  if (s < 0.001 && uRegla == 0) {
    float qq = (c.x - 0.25) * (c.x - 0.25) + c.y * c.y;
    if (qq * (qq + (c.x - 0.25)) <= 0.25 * c.y * c.y || (c.x + 1.0) * (c.x + 1.0) + c.y * c.y <= 0.0625) n = uMaxIt;
  }
  for (int k = 0; k < 3000; k++) {
    if (n >= uMaxIt) break;
    d = 2.0 * vec2(z.x * d.x - z.y * d.y, z.x * d.y + z.y * d.x) + vec2(1.0 - s, 0.0);
    vec2 zz = uRegla == 1 ? abs(z) : (uRegla == 2 ? vec2(z.x, -z.y) : z);
    z = vec2(zz.x * zz.x - zz.y * zz.y, 2.0 * zz.x * zz.y) + c;
    r2 = dot(z, z);
    if (r2 > 1e6) break;
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
    float nu = float(n) + fr;
    float stA = n > 1 ? st / float(n) : 0.0;
    float stB = n > 2 ? stPrev / float(n - 1) : stA;
    float stripe = mix(stB, stA, clamp(fr, 0.0, 1.0));
    float dpx = (0.5 * zl * lz) / max(length(d), 1e-20) / uEsc;
    vec3 pc = paleta(log(nu + 1.0) * 0.3 + sqrt(nu) * 0.11 + uFase);
    float borde = exp(-dpx * 0.4) * 0.5;
    float kS = clamp((nu - 4.0) / 24.0, 0.0, 1.0);
    float luzS = 1.0 + kS * (0.55 * stripe - 0.25);
    float piso = 0.22 + 0.78 * min(1.0, nu / 60.0);
    col = pc * luzS * piso + borde * vec3(0.85, 0.9, 1.0);
    // a wave of light leaves the border on every beat and travels outwards through the bands
    float frente = 4.6 - uOnda * 5.5;
    float onda = exp(-pow((log(nu + 1.0) - frente) * 5.0, 2.0)) * exp(-uOnda * 1.6) * step(0.0, uOnda);
    col += onda * vec3(1.0, 0.95, 0.88) * 0.55;
  }
  if (uModo == 2) {
    float l = min(1.0, 0.3 * col.r + 0.55 * col.g + 0.15 * col.b);
    col = mix(vec3(0.97, 0.93, 0.85), vec3(0.12, 0.1, 0.3), l);
  }
  if (uPlaneta > 0.5) {
    vec3 luz = normalize(vec3(0.55, 0.45, 0.7));
    float lam = clamp(dot(nrm, luz), 0.0, 1.0);
    float rim = pow(1.0 - nrm.z, 3.0);
    col = col * (0.06 + 1.05 * lam) + vec3(0.55, 0.7, 1.0) * rim * 0.45;
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

export type Paleta = [number, number, number, number][];
// the three palettes of the teaser
export const AVO: Paleta = [[0.0, 0.03, 0.02, 0.1], [0.16, 0.2, 0.1, 0.42], [0.34, 0.36, 0.26, 0.82], [0.5, 0.3, 0.5, 0.95], [0.64, 0.95, 0.8, 0.5], [0.74, 1.0, 0.95, 0.84], [0.86, 0.42, 0.24, 0.58], [1.0, 0.03, 0.02, 0.1]];
export const TMC: Paleta = [[0.0, 0.01, 0.05, 0.07], [0.18, 0.04, 0.32, 0.38], [0.36, 0.3, 0.78, 0.74], [0.52, 0.97, 0.93, 0.83], [0.68, 0.82, 0.32, 0.6], [0.84, 0.3, 0.07, 0.3], [1.0, 0.01, 0.05, 0.07]];
export const FUEGO: Paleta = [[0.0, 0.04, 0.03, 0.16], [0.2, 0.18, 0.12, 0.44], [0.38, 0.62, 0.24, 0.16], [0.54, 0.97, 0.62, 0.26], [0.66, 1.0, 0.92, 0.74], [0.8, 0.5, 0.22, 0.32], [1.0, 0.04, 0.03, 0.16]];
// organic: deep maroon, crimson, flesh and cream (for the beating world)
export const CARNE: Paleta = [[0.0, 0.05, 0.01, 0.03], [0.2, 0.32, 0.03, 0.08], [0.4, 0.75, 0.16, 0.2], [0.58, 0.98, 0.55, 0.45], [0.72, 1.0, 0.9, 0.78], [0.86, 0.55, 0.12, 0.25], [1.0, 0.05, 0.01, 0.03]];
export const PALETAS = [AVO, TMC, FUEGO, CARNE];

export type ParamFT = { cx: number; cy: number; esc: number; rot: number; julia?: [number, number]; modo: number; lente: number; fase: number; paleta: Paleta; brillo: number; maxIt: number; tiempo?: number; onda?: number; regla?: number; mezcla?: number; cMezcla?: [number, number]; campo?: number; interior?: number; planeta?: { x: number; y: number; r: number; giro: number; inclina: number } };

export const pintarFractalTeaser = (w: number, h: number, P: ParamFT) => {
  if (!lienzo) {
    lienzo = document.createElement("canvas");
    gl = lienzo.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false })!;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compilar(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compilar(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ["uRes", "uCentro", "uEsc", "uRot", "uJulia", "uEsJulia", "uModo", "uLente", "uFase", "uPal", "uNPal", "uBrillo", "uMaxIt", "uTiempo", "uOnda", "uRegla", "uPlaneta", "uEsfera", "uGiro", "uInclina", "uMezcla", "uCampo", "uInterior"]) U[n] = gl.getUniformLocation(prog, n);
  }
  const g = gl!;
  if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; }
  g.viewport(0, 0, w, h);
  g.uniform2f(U.uRes, w, h);
  g.uniform2f(U.uCentro, P.cx, P.cy);
  g.uniform1f(U.uEsc, P.esc);
  g.uniform1f(U.uRot, P.rot);
  const cj = P.julia ?? P.cMezcla;
  g.uniform2f(U.uJulia, cj?.[0] ?? 0, cj?.[1] ?? 0);
  g.uniform1f(U.uEsJulia, P.julia ? 1 : 0);
  g.uniform1i(U.uModo, P.modo);
  g.uniform1f(U.uLente, P.lente);
  g.uniform1f(U.uFase, P.fase);
  const pal = new Float32Array(32);
  P.paleta.forEach((s, i) => pal.set(s, i * 4));
  g.uniform4fv(U.uPal, pal);
  g.uniform1i(U.uNPal, P.paleta.length);
  g.uniform1f(U.uBrillo, P.brillo);
  g.uniform1i(U.uMaxIt, P.maxIt);
  g.uniform1f(U.uTiempo, P.tiempo ?? 0);
  g.uniform1f(U.uOnda, P.onda ?? -1);
  g.uniform1i(U.uRegla, P.regla ?? 0);
  g.uniform1f(U.uPlaneta, P.planeta ? 1 : 0);
  // the sphere centre comes in canvas pixels (y down); the shader works with y up
  if (P.planeta) g.uniform3f(U.uEsfera, P.planeta.x, h - P.planeta.y, P.planeta.r);
  g.uniform1f(U.uGiro, P.planeta?.giro ?? 0);
  g.uniform1f(U.uMezcla, P.mezcla ?? 0);
  g.uniform1f(U.uCampo, P.campo ?? 0);
  g.uniform1f(U.uInterior, P.interior ?? 1);
  g.uniform1f(U.uInclina, P.planeta?.inclina ?? 0);
  g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  return lienzo;
};
