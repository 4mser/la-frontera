// The four worlds below the atoms, for the trailer's opening dive, on the GPU (WebGL2, one fragment shader each).
// Every one is drawn like a photograph of the dive: it has a size in «pixels» (1000 × 1000) and the camera passes
// where that image sits on screen (X0, Y0: its top-left corner; sk: screen pixels per image pixel).
//
//  orbital  an atom: the electron's cloud |ψ|² of hydrogen in a superposition of 4f (m=0) and 3d (xz), which beats in
//           time (the cross term oscillates at the difference of the two energies); seen through its volume, coloured by
//           the sign of ψ, with the positions a measurement would find sparkling over it; the nucleus a point of light
//  nucleo   a nucleus: twenty nucleons (protons amber, neutrons blue-white) packed and turning, lit, with a halo of the
//           strong force between them and the colour of the quarks glowing under their surface
//  quarks   inside a proton: three valence quarks (the three colour charges) joined by flux tubes in a Y, inside the
//           lumpy vacuum of QCD (action density, as in lattice pictures), with sea pairs appearing and vanishing
//  espuma   space-time at the Planck scale: a foam of bubbles that never settles and looks the same at every depth
//           (octaves sliding through a window in log-scale, so the zoom has no end)

const VS = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const COMUN = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec3 uMapa;     // X0, Y0, sk  (screen = X0 + px * sk, y down)
uniform float uT;
uniform float uNivel;   // log2 of the zoom since the stage began
uniform vec4 uN[20];
out vec4 o;
// image pixel (0..1000) of this fragment, y down
vec2 imagen() { vec2 f = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y); return (f - uMapa.xy) / uMapa.z; }
float h13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float h12(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float ruido(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1, 0, 0)), f.x), mix(h13(i + vec3(0, 1, 0)), h13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h13(i + vec3(0, 0, 1)), h13(i + vec3(1, 0, 1)), f.x), mix(h13(i + vec3(0, 1, 1)), h13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
const mat3 ROT = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
float fbm(vec3 x) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * ruido(x); x = ROT * x * 2.03 + 17.1; a *= 0.5; } return s; }
mat3 giro(float a, float b) { float ca = cos(a), sa = sin(a), cb = cos(b), sb = sin(b);
  return mat3(ca, 0.0, -sa, 0.0, 1.0, 0.0, sa, 0.0, ca) * mat3(1.0, 0.0, 0.0, 0.0, cb, sb, 0.0, -sb, cb); }
vec3 tono(vec3 c) { return 1.0 - exp(-c); }
`;

const ORBITAL = COMUN + `
// p in Bohr radii
void psi(vec3 p, out float a, out float b) {
  float r = length(p) + 1e-4, c = p.z / r;
  a = r * r * r * exp(-r / 4.0) * (5.0 * c * c * c - 3.0 * c) / 172.0;      // 4f, m = 0
  b = r * r * exp(-r / 3.0) * (p.x * p.z / (r * r)) / 2.45;                // 3d xz
}
void main() {
  vec2 q = imagen() / 1000.0 - 0.5;                 // -0.5..0.5 → ±50 a0
  vec2 xy = q * 100.0;
  mat3 R = giro(0.22 * uT, 0.55 + 0.12 * sin(0.3 * uT));
  float fase = 1.7 * uT;                            // the beat of the superposition
  vec3 acc = vec3(0.0); float Tr = 1.0, D = 0.0;
  const int N = 72;
  for (int i = 0; i < N; i++) {
    float z = -42.0 + 84.0 * (float(i) + 0.5) / float(N);
    vec3 p = R * vec3(xy, z);
    float a, b; psi(p, a, b);
    float re = 0.78 * a + 0.62 * b * cos(fase), im = 0.62 * b * sin(fase);
    float rho = re * re + im * im;
    // never smooth: the cloud is broken into grains and filaments, with new detail at every depth of the zoom
    float f0 = exp2(uNivel) * 0.35;
    float gr = 0.0, aw = 0.5;
    for (int o = 0; o < 4; o++) { gr += aw * ruido(p * f0 * exp2(float(o)) + vec3(0.0, 0.0, uT * 0.6)); aw *= 0.5; }
    rho *= 0.08 + 2.6 * pow(gr, 3.0);
    vec3 col = re >= 0.0 ? vec3(1.0, 0.66, 0.32) : vec3(0.34, 0.58, 1.0);
    float k = rho * 1.15;
    float borde = exp(-pow((rho - 0.22) / 0.05, 2.0));          // the cloud's shape: a bright skin where |ψ|² crosses a level
    acc += Tr * (k * 0.35 + borde * 0.6) * col * (84.0 / float(N)) * 0.16;
    Tr *= exp(-k * 0.05 * (84.0 / float(N)));
    D += rho;
  }
  vec3 c = tono(acc * 1.1);
  // where a measurement would find the electron: points that come and go, as dense as the cloud
  vec2 pix = floor(gl_FragCoord.xy / 2.0);
  float hb = h12(pix + floor(uT * 24.0) * vec2(17.13, 3.71));
  c += vec3(1.0, 0.93, 0.82) * step(hb, D * 0.03) * 1.0;
  float hc = h12(floor(gl_FragCoord.xy / 4.0) + floor(uT * 12.0) * vec2(3.1, 7.7));
  c += vec3(1.0, 0.8, 0.55) * step(hc, D * 0.02) * 0.6;
  // the nucleus: a point of light at the centre, ten thousand times smaller than the cloud
  vec2 nc = vec2(uMapa.x + 500.0 * uMapa.z, uRes.y - (uMapa.y + 500.0 * uMapa.z));
  float rpx = length(gl_FragCoord.xy - nc);
  float rw = length(xy);
  c += vec3(1.0, 0.94, 0.85) * (exp(-rw / 0.06) * 1.4 + exp(-rpx / 4.0) * 0.9 + exp(-rpx / 22.0) * 0.18);
  o = vec4(min(c, 1.0), 1.0);
}`;

const NUCLEO = COMUN + `
// uN[i] = (x, y, z, kind) in fm; uN[0] is the nucleon in front, at the centre (it does not turn)
float sdf(vec3 p, out int cual) {
  float d = 1e9; cual = 0;
  for (int i = 0; i < 20; i++) {
    float di = length(p - uN[i].xyz) - 0.85;
    if (di < d) { d = di; cual = i; }
  }
  return d;
}
vec3 pos(int i, mat3 R) { return i == 0 ? uN[0].xyz : R * uN[i].xyz; }
void main() {
  vec2 q = imagen() / 1000.0 - 0.5;                 // ±6 fm
  vec2 xy = q * 12.0;
  mat3 R = giro(0.32 * uT, 0.4);
  vec3 ro = vec3(xy, 9.0), rd = vec3(0.0, 0.0, -1.0);
  float t = 0.0, glow = 0.0; int cual = -1; bool tocado = false;
  for (int s = 0; s < 80; s++) {
    vec3 p = ro + rd * t;
    float d = 1e9; int c = 0;
    for (int i = 0; i < 20; i++) { float di = length(p - pos(i, R)) - 0.85; if (di < d) { d = di; c = i; } }
    if (d < 0.3) {                                  // near a nucleon: its surface is rough and boils (quarks and gluons under it)
      vec3 lq = p - pos(c, R);
      d += 0.16 * (fbm(lq * 5.0 + vec3(float(c) * 3.1, 0.0, uT * 0.9)) - 0.5) + 0.05 * (ruido(lq * 22.0 + uT * 2.0) - 0.5);
    }
    glow += exp(-max(d, 0.0) * 3.0) * 0.022;
    if (d < 0.002) { tocado = true; cual = c; break; }
    t += max(d * 0.6, 0.006);
    if (t > 18.0) break;
  }
  vec3 col = vec3(0.0);
  vec3 L = normalize(vec3(-0.5, 0.55, 0.75));
  if (tocado) {
    vec3 p = ro + rd * t, ce = pos(cual, R);
    vec2 ep = vec2(0.01, 0.0);
    // the normal of the rough surface, by differences of its displacement
    vec3 lq = p - ce;
    float h0 = fbm(lq * 5.0 + vec3(float(cual) * 3.1, 0.0, uT * 0.9));
    vec3 gq = vec3(fbm((lq + ep.xyy) * 5.0 + vec3(float(cual) * 3.1, 0.0, uT * 0.9)), fbm((lq + ep.yxy) * 5.0 + vec3(float(cual) * 3.1, 0.0, uT * 0.9)), fbm((lq + ep.yyx) * 5.0 + vec3(float(cual) * 3.1, 0.0, uT * 0.9))) - h0;
    vec3 n = normalize(normalize(lq) + gq / 0.01 * 0.16);
    float kind = uN[cual].w;
    vec3 base = kind < 0.5 ? vec3(1.0, 0.56, 0.26) : vec3(0.58, 0.74, 1.0);
    float dif = max(dot(n, L), 0.0), wrap = max(dot(n, L) * 0.5 + 0.5, 0.0);
    float spec = pow(max(dot(reflect(-L, n), -rd), 0.0), 36.0);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    // the quarks under the surface: three soft spots of colour that wander
    vec3 sub = vec3(0.0);
    for (int k = 0; k < 3; k++) {
      float a = uT * (0.9 + 0.13 * float(cual % 5)) + float(k) * 2.094 + float(cual) * 1.3;
      vec3 dq = normalize(vec3(cos(a), sin(a * 0.7 + float(k)), 0.6 * sin(a)));
      vec3 qc = k == 0 ? vec3(1.0, 0.3, 0.25) : k == 1 ? vec3(0.3, 1.0, 0.45) : vec3(0.3, 0.5, 1.0);
      sub += qc * pow(max(dot(n, dq), 0.0), 6.0) * 0.35;
    }
    col = base * (0.1 + 0.55 * wrap + 0.45 * dif) + sub + vec3(1.0) * spec * 0.55 + base * fres * 0.6;
    col *= 0.6 + 0.8 * fbm(lq * 9.0 + uT * 0.7);
  }
  col += vec3(1.0, 0.78, 0.55) * glow * 0.9;
  col += vec3(1.0, 0.82, 0.6) * exp(-length(xy) / 3.2) * 0.12;
  o = vec4(min(tono(col * 1.4), 1.0), 1.0);
}`;

const QUARKS = COMUN + `
vec3 quark(int k) {
  float a = 0.75 * uT + float(k) * 2.094;
  float b = 0.5 * sin(0.6 * uT + float(k) * 1.7);
  return 0.46 * vec3(cos(a) * cos(b), sin(a) * cos(b), sin(b));
}
float segmento(vec3 p, vec3 a, vec3 b) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
void main() {
  vec2 q = imagen() / 1000.0 - 0.5;                 // ±1.1 fm (the proton 0.85 fm in radius)
  vec2 xy = q * 2.2;
  vec3 Q[3]; Q[0] = quark(0); Q[1] = quark(1); Q[2] = quark(2);
  vec3 J = (Q[0] + Q[1] + Q[2]) / 3.0;
  vec3 QC[3]; QC[0] = vec3(1.0, 0.28, 0.22); QC[1] = vec3(0.3, 1.0, 0.45); QC[2] = vec3(0.32, 0.5, 1.0);
  vec3 acc = vec3(0.0); float Tr = 1.0;
  const int N = 64;
  for (int i = 0; i < N; i++) {
    float z = -1.05 + 2.1 * (float(i) + 0.5) / float(N);
    vec3 p = vec3(xy, z);
    float r = length(p);
    float dentro = smoothstep(0.95, 0.75, r);
    // the vacuum: lumps of action density that boil
    float fz = exp2(uNivel);                        // new detail at every depth of the zoom
    float v = fbm(p * 3.2 + vec3(0.0, 0.0, uT * 0.55));
    float vf = fbm(p * 3.2 * fz * 2.0 + vec3(5.1, 2.3, uT * 1.3));
    float lump = smoothstep(0.62, 0.86, v * 0.6 + vf * 0.5) * dentro;
    vec3 c = vec3(1.0, 0.32, 0.1) * lump * lump * 3.6 + vec3(1.0, 0.75, 0.3) * pow(lump, 4.0) * 3.0;
    // the flux tubes, quark → junction, wobbling with the field; tinted by the charge they carry
    for (int k = 0; k < 3; k++) {
      float d = segmento(p, Q[k], J) + 0.035 * (ruido(p * 9.0 + uT * 2.0) - 0.5) + 0.02 / fz * (ruido(p * 40.0 * fz + uT * 3.0) - 0.5);
      float hilo = pow(fbm(p * 26.0 * fz + vec3(float(k) * 4.0, 0.0, uT * 2.5)), 2.0) * 5.0;   // the tube is made of threads
      float tubo = exp(-d * d / 0.0032) * hilo;
      c += mix(vec3(0.95, 0.9, 1.0), QC[k], 0.55) * tubo * 9.0;
      float dq = length(p - Q[k]);
      c += QC[k] * (exp(-dq * dq / 0.0006) * 60.0 + exp(-dq / 0.08) * 1.6 * (0.5 + fbm(p * 30.0 * fz + uT)));
    }
    // sea pairs: in little cells of space and time, a pair blinks
    vec3 cel = floor(p * 16.0);
    float h = h13(cel + floor(uT * 7.0) * 13.7);
    if (h > 0.988) { vec3 cc = (cel + vec3(h13(cel + 1.7), h13(cel + 5.3), h13(cel + 9.1))) / 16.0; float dd = length(p - cc); c += vec3(1.0, 0.95, 0.85) * exp(-dd * dd / 0.00006) * 30.0 * dentro * sin(3.14159 * fract(uT * 7.0)); }
    float k = (lump * 0.9 + 0.05) * dentro;
    acc += Tr * c * (2.1 / float(N)) * 0.5;
    Tr *= exp(-k * 2.1 / float(N) * 0.8);
  }
  float r2 = length(xy);
  acc += vec3(1.0, 0.85, 0.7) * exp(-pow((r2 - 0.85) / 0.04, 2.0)) * 0.25;     // the proton's own edge, faint
  o = vec4(min(tono(acc * 1.8), 1.0), 1.0);
}`;

const ESPUMA = COMUN + `
// cells of a 3D lattice (F2 − F1 of the distance to random points): the walls of the bubbles
float paredes(vec3 x) {
  vec3 i = floor(x), f = fract(x); float d1 = 9.0, d2 = 9.0;
  for (int a = -1; a <= 1; a++) for (int b = -1; b <= 1; b++) for (int c = -1; c <= 1; c++) {
    vec3 g = vec3(a, b, c), o = vec3(h13(i + g), h13(i + g + 7.1), h13(i + g + 3.3));
    o = 0.5 + 0.45 * sin(uT * 1.3 + 6.2831 * o);
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return d2 - d1;
}
void main() {
  vec2 q = imagen() / 1000.0 - 0.5;
  float N = uNivel;
  vec3 col = vec3(0.0);
  float tot = 0.0;
  for (int k = 0; k < 6; k++) {
    float o = floor(N) + float(k) - 2.0;
    float w = exp(-0.5 * pow((o - N - 0.6) / 1.25, 2.0));
    float f = exp2(o) * 3.0;
    vec3 x = vec3(q * f, uT * 0.35 + o * 3.7);
    x += 0.6 * vec3(fbm(x * 0.7 + 1.3), fbm(x * 0.7 + 7.9), 0.0);         // the foam bends itself
    float pw = paredes(x);
    float pared = exp(-pw * pw / 0.006);
    float burb = smoothstep(0.35, 0.0, pw);
    vec3 c = vec3(1.0, 0.86, 0.62) * pared * 1.2 + vec3(0.42, 0.5, 1.0) * burb * 0.18 + vec3(0.9, 0.5, 1.0) * pow(pared, 6.0) * 0.6;
    col += w * c; tot += w;
  }
  col /= tot;
  // virtual pairs: points that appear and vanish everywhere
  vec2 pix = floor(gl_FragCoord.xy / 3.0);
  float hb = h12(pix + floor(uT * 12.0) * vec2(5.7, 9.1));
  col += vec3(1.0, 0.95, 0.88) * step(0.9985, hb) * 0.8;
  o = vec4(min(tono(col * 1.6), 1.0), 1.0);
}`;

const MOLECULAS = COMUN + `
// liquid water, ±2 nm: molecules on a jittered lattice of 0.31 nm, each one an oxygen and two hydrogens that tumble and
// shake; every atom a cloud of grains (never smooth); hydrogen bonds as faint threads; the molecule at the centre
// holds its oxygen exactly there (the camera dives into it)
void main() {
  vec2 q = imagen() / 1000.0 - 0.5;
  vec2 x = q * 4.0;
  float cel = 0.31;
  vec2 ci = floor(x / cel + 0.5);
  vec3 col = vec3(0.0);
  for (int a = -1; a <= 1; a++) for (int b = -1; b <= 1; b++) {
    vec2 id = ci + vec2(a, b);
    bool centro = id.x == 0.0 && id.y == 0.0;
    float h1 = h12(id), h2 = h12(id + 7.3), h3 = h12(id + 3.1);
    vec2 o = id * cel + (centro ? vec2(0.0) : (vec2(h1, h2) - 0.5) * 0.16 + 0.025 * vec2(sin(uT * 3.1 + h1 * 40.0), cos(uT * 2.7 + h2 * 40.0)));
    float ang = h3 * 6.2831 + uT * (0.8 + h1) * (h2 > 0.5 ? 1.0 : -1.0);
    vec2 u = vec2(cos(ang), sin(ang)), v = vec2(-u.y, u.x);
    vec2 pH1 = o + 0.096 * (u * cos(0.912) + v * sin(0.912)), pH2 = o + 0.096 * (u * cos(0.912) - v * sin(0.912));
    float dO = length(x - o), d1 = length(x - pH1), d2 = length(x - pH2);
    float gO = exp(-dO * dO / 0.0042), gH = exp(-d1 * d1 / 0.0016) + exp(-d2 * d2 / 0.0016);
    float gr = ruido(vec3(x * 160.0 * exp2(uNivel * 0.8), uT * 4.0)) * 0.6 + ruido(vec3(x * 420.0 * exp2(uNivel * 0.8), uT * 6.0)) * 0.4;
    float rug = 0.25 + 1.6 * pow(gr, 2.2);
    col += (vec3(1.0, 0.52, 0.32) * gO * 1.4 + vec3(0.62, 0.78, 1.0) * gH * 0.9) * rug;
    vec2 n = (id + vec2(1.0, 0.0)) * cel + (vec2(h12(id + vec2(1.0, 0.0)), h12(id + vec2(1.0, 0.0) + 7.3)) - 0.5) * 0.16;
    vec2 pa = x - pH1, ba = n - pH1; float hh = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); float db = length(pa - ba * hh);
    col += vec3(0.7, 0.8, 1.0) * exp(-db * db / 0.00004) * step(0.5, fract(hh * 9.0 - uT * 2.0)) * 0.25 * (0.5 + 0.5 * sin(uT * 5.0 + h1 * 30.0));
  }
  vec2 pix = floor(gl_FragCoord.xy / 2.0);
  col += vec3(1.0, 0.92, 0.8) * step(0.9975, h12(pix + floor(uT * 20.0) * vec2(9.1, 4.3))) * 0.5;
  o = vec4(min(tono(col * 1.3), 1.0), 1.0);
}`;

const FUENTES: Record<string, string> = { moleculas: MOLECULAS, orbital: ORBITAL, nucleo: NUCLEO, quarks: QUARKS, espuma: ESPUMA };
export const SIMS = Object.keys(FUENTES);

let gl: WebGL2RenderingContext | null = null;
let lienzo: HTMLCanvasElement | null = null;
const PROG: Record<string, { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }> = {};

const compilar = (g: WebGL2RenderingContext, tipo: number, src: string) => {
  const s = g.createShader(tipo)!;
  g.shaderSource(s, src); g.compileShader(s);
  if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) ?? "shader");
  return s;
};

// the nucleons, packed: a fixed random packing (protons and neutrons alternate), the first one in front
const NUC = (() => {
  let s = 7;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const out: number[][] = [[0, 0, 2.6, 0]];
  let n = 0;
  while (out.length < 20 && n < 20000) {
    n++;
    const u = r() * 2 - 1, th = r() * Math.PI * 2, rr = 2.2 * Math.cbrt(r());
    const p = [rr * Math.sqrt(1 - u * u) * Math.cos(th), rr * Math.sqrt(1 - u * u) * Math.sin(th), rr * u];
    if (out.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) > 1.45) && Math.hypot(p[0], p[1], p[2] - 2.6) > 1.6) out.push([...p, out.length % 2]);
  }
  return new Float32Array(out.flat());
})();

export const pintarSim = (nombre: string, w: number, h: number, X0: number, Y0: number, sk: number, t: number, nivel: number) => {
  if (!lienzo) {
    lienzo = document.createElement("canvas");
    gl = lienzo.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false })!;
  }
  const g = gl!;
  if (!PROG[nombre]) {
    const p = g.createProgram()!;
    g.attachShader(p, compilar(g, g.VERTEX_SHADER, VS));
    g.attachShader(p, compilar(g, g.FRAGMENT_SHADER, FUENTES[nombre]));
    g.linkProgram(p);
    if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p) ?? "link");
    g.useProgram(p);
    const buf = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, buf);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
    const loc = g.getAttribLocation(p, "p");
    g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    const u: Record<string, WebGLUniformLocation | null> = {};
    for (const n of ["uRes", "uMapa", "uT", "uNivel", "uN"]) u[n] = g.getUniformLocation(p, n);
    PROG[nombre] = { p, u };
  }
  const { p, u } = PROG[nombre];
  g.useProgram(p);
  const buf = g.createBuffer();
  g.bindBuffer(g.ARRAY_BUFFER, buf);
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  const loc = g.getAttribLocation(p, "p");
  g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
  if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; }
  g.viewport(0, 0, w, h);
  g.uniform2f(u.uRes, w, h);
  g.uniform3f(u.uMapa, X0, Y0, sk);
  g.uniform1f(u.uT, t);
  g.uniform1f(u.uNivel, nivel);
  if (u.uN) g.uniform4fv(u.uN, NUC);
  g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  g.deleteBuffer(buf);
  return lienzo;
};
