// Mandelbrot set on the GPU (WebGL2): smooth escape time, creamy palette that can cycle in time, and a soft glow on
// the border. Pure function of its uniforms; drawn on its own canvas and composed over the 2D canvas.
const VS = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec2 uCentro;
uniform float uAncho;
uniform float uFase;
uniform float uRespira;
uniform int uIter;
uniform float uRot;
uniform vec2 uJulia;
uniform float uModo;
uniform float uBrillo;
uniform float uRelieve;
uniform float uLuz;
out vec4 o;
vec3 paleta(float t) {
  // deep violet -> magenta -> peach -> cream -> cyan -> deep blue -> violet
  vec3 c[7];
  c[0] = vec3(0.047, 0.031, 0.110); c[1] = vec3(0.275, 0.094, 0.361); c[2] = vec3(0.690, 0.251, 0.502);
  c[3] = vec3(0.933, 0.549, 0.471); c[4] = vec3(1.000, 0.957, 0.871); c[5] = vec3(0.588, 0.871, 0.886);
  c[6] = vec3(0.204, 0.431, 0.627);
  t = fract(t) * 7.0;
  int i = int(floor(t));
  float f = fract(t); f = f * f * (3.0 - 2.0 * f);
  vec3 a = c[i]; vec3 b = c[(i + 1) % 7];
  return mix(a, b, f);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.x;
  float cr = cos(uRot), sr = sin(uRot);
  uv = vec2(cr * uv.x - sr * uv.y, sr * uv.x + cr * uv.y);
  vec2 p = uCentro + uv * uAncho;
  vec2 c = uModo > 0.5 ? uJulia : p;
  vec2 z = uModo > 0.5 ? p : vec2(0.0);
  float trampa = 1e9;
  vec2 dz = uModo > 0.5 ? vec2(1.0, 0.0) : vec2(0.0);
  float n = 0.0;
  float esc = 0.0;
  for (int i = 0; i < 4000; i++) {
    if (i >= uIter) break;
    dz = 2.0 * vec2(z.x * dz.x - z.y * dz.y, z.x * dz.y + z.y * dz.x) + (uModo > 0.5 ? vec2(0.0) : vec2(1.0, 0.0));
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    trampa = min(trampa, abs(length(z) - 0.5));
    if (dot(z, z) > 1e6) { esc = 1.0; break; }
    n += 1.0;
  }
  if (esc < 0.5) {
    // interior: a faint glow from an orbit trap, only for the Julia worlds
    vec3 ins = paleta(trampa * 1.4 + uFase + 0.35) * exp(-trampa * 11.0) * 0.22 * uModo;
    o = vec4(ins, 1.0); return;
  }
  float nu = n + 1.0 - log2(log(length(z)));
  float t = log(nu + 1.0) * 0.42 + uFase;
  vec3 col = paleta(t);
  // far from the set it fades into the dark; near the border it glows
  float cerca = clamp(nu / (14.0 - 7.0 * uRespira), 0.0, 1.0);
  col *= pow(cerca, 1.6) * uBrillo;
  // relief: light the slope of the potential so the set reads as a creamy sculpture
  if (uRelieve > 0.0) {
    vec2 zd = vec2(z.x * dz.x + z.y * dz.y, z.y * dz.x - z.x * dz.y) / dot(dz, dz);
    vec2 n = normalize(vec2(zd.x * cos(uRot) + zd.y * sin(uRot), -zd.x * sin(uRot) + zd.y * cos(uRot)));
    vec2 L = vec2(cos(uLuz), sin(uLuz));
    float h = 1.6;
    float lam = clamp((dot(n, L) + h) / (1.0 + h), 0.0, 1.0);
    float spec = pow(lam, 18.0);
    vec3 lit = col * (0.42 + 0.78 * lam) + vec3(1.0, 0.96, 0.9) * spec * 0.55 * cerca;
    col = mix(col, lit, uRelieve);
  }
  o = vec4(col, 1.0);
}`;

let gl: WebGL2RenderingContext | null = null;
let lienzo: HTMLCanvasElement | null = null;
let prog: WebGLProgram | null = null;
const U: Record<string, WebGLUniformLocation | null> = {};

const compilar = (g: WebGL2RenderingContext, tipo: number, src: string) => {
  const s = g.createShader(tipo)!;
  g.shaderSource(s, src);
  g.compileShader(s);
  if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) ?? "shader");
  return s;
};

const preparar = (w: number, h: number) => {
  if (!lienzo) {
    lienzo = document.createElement("canvas");
    gl = lienzo.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
    if (!gl) throw new Error("WebGL2 no disponible");
    prog = gl.createProgram()!;
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
    for (const n of ["uRes", "uCentro", "uAncho", "uFase", "uRespira", "uIter", "uRot", "uJulia", "uModo", "uBrillo", "uRelieve", "uLuz"]) U[n] = gl.getUniformLocation(prog, n);
  }
  if (lienzo.width !== w || lienzo.height !== h) {
    lienzo.width = w;
    lienzo.height = h;
  }
  return { g: gl!, lienzo };
};

export type ParamMandel = { cx: number; cy: number; ancho: number; fase: number; respira: number; iter: number; rot?: number; julia?: [number, number]; brillo?: number; relieve?: number; luz?: number };

export const pintarMandel = (w: number, h: number, P: ParamMandel) => {
  const { g, lienzo: l } = preparar(w, h);
  g.viewport(0, 0, w, h);
  g.uniform2f(U.uRes, w, h);
  g.uniform2f(U.uCentro, P.cx, P.cy);
  g.uniform1f(U.uAncho, P.ancho);
  g.uniform1f(U.uFase, P.fase);
  g.uniform1f(U.uRespira, P.respira);
  g.uniform1i(U.uIter, P.iter);
  g.uniform1f(U.uRot, P.rot ?? 0);
  g.uniform2f(U.uJulia, P.julia?.[0] ?? 0, P.julia?.[1] ?? 0);
  g.uniform1f(U.uModo, P.julia ? 1 : 0);
  g.uniform1f(U.uBrillo, P.brillo ?? 1);
  g.uniform1f(U.uRelieve, P.relieve ?? 0);
  g.uniform1f(U.uLuz, P.luz ?? 0.8);
  g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  return l;
};
