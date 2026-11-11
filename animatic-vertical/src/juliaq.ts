// Quaternion Julia sets: the same rule z -> z^2 + c, with z and c quaternions (four dimensions), sliced in 3D and
// raymarched on the GPU. Creamy shading: soft wrap lighting, orbit-trap colour, ambient occlusion, rim light, fog
// and a halo from the closest approach of each ray. Pure function of its uniforms.
const VS = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec3 uCam;
uniform vec3 uMira;
uniform vec4 uC;
uniform float uFov;
uniform float uFase;
uniform float uCorte;
uniform float uBrillo;
out vec4 o;
vec3 paleta(float t) {
  vec3 c[7];
  c[0] = vec3(0.047, 0.031, 0.110); c[1] = vec3(0.275, 0.094, 0.361); c[2] = vec3(0.690, 0.251, 0.502);
  c[3] = vec3(0.933, 0.549, 0.471); c[4] = vec3(1.000, 0.957, 0.871); c[5] = vec3(0.588, 0.871, 0.886);
  c[6] = vec3(0.204, 0.431, 0.627);
  t = fract(t) * 7.0;
  int i = int(floor(t));
  float f = fract(t); f = f * f * (3.0 - 2.0 * f);
  return mix(c[i], c[(i + 1) % 7], f);
}
vec4 qsq(vec4 a) { return vec4(a.x * a.x - dot(a.yzw, a.yzw), 2.0 * a.x * a.yzw); }
vec4 qmul(vec4 a, vec4 b) { return vec4(a.x * b.x - dot(a.yzw, b.yzw), a.x * b.yzw + b.x * a.yzw + cross(a.yzw, b.yzw)); }
float trampa;
float de(vec3 p) {
  vec4 z = vec4(p, uCorte);
  vec4 dz = vec4(1.0, 0.0, 0.0, 0.0);
  float m2 = 0.0;
  trampa = 1e9;
  for (int i = 0; i < 11; i++) {
    dz = 2.0 * qmul(z, dz);
    z = qsq(z) + uC;
    m2 = dot(z, z);
    trampa = min(trampa, length(z.xyz - vec3(0.2, 0.0, 0.0)));
    if (m2 > 256.0) break;
  }
  return 0.25 * sqrt(m2 / dot(dz, dz)) * log(m2);
}
vec3 normal(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(de(p + e.xyy) - de(p - e.xyy), de(p + e.yxy) - de(p - e.yxy), de(p + e.yyx) - de(p - e.yyx)));
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 f = normalize(uMira - uCam);
  vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
  vec3 u = cross(f, r);
  vec3 rd = normalize(f + uFov * (uv.x * r + uv.y * u));
  vec3 fondo = mix(vec3(0.03, 0.02, 0.07), vec3(0.16, 0.06, 0.18), smoothstep(-0.6, 0.9, uv.y + 0.3)) * (1.0 - 0.35 * length(uv));
  float t = 0.0;
  float cercano = 1e9;
  bool golpe = false;
  int pasos = 0;
  // bounding sphere of radius 2
  float b = dot(uCam, rd); float c = dot(uCam, uCam) - 4.0; float h = b * b - c;
  if (h > 0.0) {
    t = max(0.0, -b - sqrt(h));
    float tFin = -b + sqrt(h);
    for (int i = 0; i < 220; i++) {
      vec3 p = uCam + rd * t;
      float d = de(p);
      cercano = min(cercano, d / max(t, 0.001));
      if (d < 0.0006 * t) { golpe = true; pasos = i; break; }
      t += d * 0.9;
      if (t > tFin) break;
      pasos = i;
    }
  }
  vec3 col = fondo;
  if (golpe) {
    vec3 p = uCam + rd * t;
    de(p);
    float tr = trampa;
    vec3 n = normal(p);
    vec3 base = paleta(tr * 0.55 + uFase);
    base = mix(base, vec3(1.0, 0.95, 0.86), 0.38);
    vec3 L = normalize(vec3(0.6, 0.8, -0.4));
    float wrap = clamp((dot(n, L) + 0.45) / 1.45, 0.0, 1.0);
    float ao = clamp(1.0 - float(pasos) / 140.0, 0.25, 1.0);
    vec3 H = normalize(L - rd);
    float spec = pow(max(dot(n, H), 0.0), 40.0);
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    col = base * (0.18 + 0.95 * wrap) * ao;
    col += vec3(1.0, 0.95, 0.88) * spec * 0.45 * ao;
    col += vec3(0.59, 0.87, 0.89) * rim * 0.55;
    col = mix(col, fondo, smoothstep(2.5, 6.0, t) * 0.6);
  } else {
    // creamy halo around the set from the closest approach of the ray
    float halo = exp(-cercano * 40.0);
    col += paleta(uFase + 0.55) * halo * 0.55;
  }
  col *= uBrillo;
  col = col / (1.0 + col * 0.35);
  o = vec4(pow(col, vec3(0.92)), 1.0);
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

export type ParamJuliaQ = { cam: [number, number, number]; mira: [number, number, number]; c: [number, number, number, number]; fov: number; fase: number; corte: number; brillo: number };

export const pintarJuliaQ = (w: number, h: number, P: ParamJuliaQ) => {
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
    for (const n of ["uRes", "uCam", "uMira", "uC", "uFov", "uFase", "uCorte", "uBrillo"]) U[n] = gl.getUniformLocation(prog, n);
  }
  const g = gl!;
  if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; }
  g.viewport(0, 0, w, h);
  g.uniform2f(U.uRes, w, h);
  g.uniform3f(U.uCam, ...P.cam);
  g.uniform3f(U.uMira, ...P.mira);
  g.uniform4f(U.uC, ...P.c);
  g.uniform1f(U.uFov, P.fov);
  g.uniform1f(U.uFase, P.fase);
  g.uniform1f(U.uCorte, P.corte);
  g.uniform1f(U.uBrillo, P.brillo);
  g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  return lienzo;
};
