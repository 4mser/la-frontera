// «Un parpadeo» · el cesio en GPU: la nube del electrón de valencia del cesio (6s) como ~240 000 partículas.
// La densidad radial es la de un orbital s con n = 6 (modelo hidrogenoide: R ∝ e^(−r/n) · L₅¹(2r/n)), que tiene cinco
// nodos radiales: la nube se ve como capas concéntricas, una forma real del átomo y no un dibujo de «bolitas».
// Sobre la nube corre la radiación de la transición hiperfina como un frente de onda radial cos(k·r − ω·t) que sale
// hacia afuera; k y ω crecen con la frecuencia mostrada. Cámara en perspectiva que orbita y se acerca.
import { escena, programa } from "../existir/gpu";

const N = 240000;
let datos: Float32Array | null = null;
const laguerre = (n: number, a: number, x: number) => {           // L_n^a(x) por recurrencia
  if (n === 0) return 1;
  let l0 = 1, l1 = 1 + a - x;
  for (let k = 1; k < n; k++) { const l2 = ((2 * k + 1 + a - x) * l1 - (k + a) * l0) / (k + 1); l0 = l1; l1 = l2; }
  return l1;
};
const preparar = () => {
  if (datos) return datos;
  // distribución radial P(r) = r² R(r)², n = 6, l = 0; r en radios de Bohr
  const M = 4000, RMAX = 90, cdf = new Float64Array(M + 1);
  for (let i = 1; i <= M; i++) {
    const r = (i / M) * RMAX, R = Math.exp(-r / 6) * laguerre(5, 1, r / 3);
    cdf[i] = cdf[i - 1] + r * R * R;                           // densidad radial r·|R|² (realza las capas internas)
  }
  for (let i = 0; i <= M; i++) cdf[i] /= cdf[M];
  let q = 12345; const rnd = () => { q = (q * 16807) % 2147483647; return q / 2147483647; };
  datos = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const u = rnd(); let lo = 0, hi = M;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cdf[m] < u) lo = m; else hi = m; }
    const r = ((lo + rnd()) / M) * RMAX;
    const z = rnd() * 2 - 1, f = rnd() * Math.PI * 2, s = Math.sqrt(1 - z * z);
    datos.set([(r / 80) * s * Math.cos(f), (r / 80) * z, (r / 80) * s * Math.sin(f), rnd()], i * 4);
  }
  return datos;
};

const VS = `#version 300 es
layout(location=0) in vec4 a;
uniform mat3 uRot; uniform float uDist, uK, uAsp, uTam, uOnda, uKw, uFase, uAbre;
out float vB; out float vR; out float vS;
void main(){
  vec3 p = uRot * (a.xyz * uAbre);
  float z = uDist - p.z;
  gl_Position = vec4(p.x * uK / (z * uAsp), p.y * uK / z, 0.0, 1.0);
  float r = length(a.xyz);
  // frente de onda radial: brillo extra donde cos(k r − ω t) es máximo
  float w = 0.5 + 0.5 * cos(uKw * r - uFase);
  // las capas de mayor densidad quedan nítidas; el frente de onda las enciende al pasar; lo de adelante, más brillante
  vB = (0.35 + uOnda * 2.4 * pow(w, 8.0)) * (0.55 + 0.45 * smoothstep(-1.2, 1.2, p.z));
  vR = r; vS = a.w;
  gl_PointSize = uTam / z;
}`;
const FS = `#version 300 es
precision highp float;
in float vB; in float vR; in float vS; out vec4 o;
uniform float uA;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0; float d = dot(q, q);
  if (d > 1.0) discard;
  float g = exp(-d * 4.5);
  // capas internas doradas, externas crema con un poco de violeta
  vec3 c = mix(vec3(1.0, 0.78, 0.42), vec3(1.0, 0.93, 0.82), smoothstep(0.2, 1.1, vR));
  c = mix(c, vec3(0.75, 0.62, 1.0), 0.18 * step(0.8, vS) * smoothstep(0.6, 1.3, vR));
  o = vec4(c * g * vB * uA, 1.0);
}`;
let prog: ReturnType<typeof programa> | null = null;
let vao: WebGLVertexArrayObject | null = null;
export const pintarAtomo = (w: number, h: number, P: { giro: number; incl: number; dist: number; fov: number; onda: number; kw: number; fase: number; abre: number; a: number }) => {
  const { c, g } = escena("parpadeo-atomo", w, h);
  if (!prog) {
    prog = programa(g, VS, FS);
    vao = g.createVertexArray(); g.bindVertexArray(vao);
    const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, preparar(), g.STATIC_DRAW);
    g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 4, g.FLOAT, false, 0, 0);
  }
  g.clearColor(0, 0, 0, 1); g.clear(g.COLOR_BUFFER_BIT);
  g.useProgram(prog.p); g.bindVertexArray(vao);
  g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE);
  const cy = Math.cos(P.giro), sy = Math.sin(P.giro), cx = Math.cos(P.incl), sx = Math.sin(P.incl);
  // rotación: giro alrededor de y y luego inclinación alrededor de x (columnas para mat3 de GLSL)
  const m = [cy, sx * sy, -cx * sy, 0, cx, sx, sy, -sx * cy, cx * cy];
  const u = prog.u;
  g.uniformMatrix3fv(u("uRot"), false, m);
  g.uniform1f(u("uDist"), P.dist); g.uniform1f(u("uK"), 1 / Math.tan(P.fov / 2)); g.uniform1f(u("uAsp"), w / h);
  g.uniform1f(u("uTam"), 5.0 * (h / 1920)); g.uniform1f(u("uOnda"), P.onda); g.uniform1f(u("uKw"), P.kw); g.uniform1f(u("uFase"), P.fase);
  g.uniform1f(u("uAbre"), P.abre); g.uniform1f(u("uA"), 1.6 * P.a);
  g.drawArrays(g.POINTS, 0, N);
  g.disable(g.BLEND);
  return c;
};
