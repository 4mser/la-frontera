// Cierre épico (v15): el universo en 3D, en GPU, con cámara en perspectiva.
// · galaxia3d: la Vía Láctea en volumen (~400 000 estrellas): disco exponencial con espesor, dos brazos en espiral
//   logarítmica, bulbo en barra, regiones HII, bandas de polvo que absorben, y una vecindad solar densa alrededor del Sol.
// · red3d: la red cósmica en volumen (~260 000 galaxias como puntos) sobre filamentos que unen nudos (cada nudo con sus
//   tres vecinos más cercanos), con cúmulos en los nudos.
// Cámara: lookAt + perspectiva; el tamaño del punto depende de la distancia. Función pura de los parámetros.
import { azar, escena, programa } from "./gpu";

export type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
// matriz vista·proyección (columna mayor) para WebGL
export const camara = (ojo: V3, mira: V3, arriba: V3, fov: number, asp: number, cerca = 0.0005, lejos = 100) => {
  const z = norm(sub(ojo, mira)), x = norm(cruz(arriba, z)), y = cruz(z, x);
  const V = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
    -(x[0] * ojo[0] + x[1] * ojo[1] + x[2] * ojo[2]), -(y[0] * ojo[0] + y[1] * ojo[1] + y[2] * ojo[2]), -(z[0] * ojo[0] + z[1] * ojo[1] + z[2] * ojo[2]), 1];
  const f = 1 / Math.tan(fov / 2), nf = 1 / (cerca - lejos);
  const P = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (lejos + cerca) * nf, -1, 0, 0, 2 * lejos * cerca * nf, 0];
  const M = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += P[k * 4 + r] * V[c * 4 + k]; M[c * 4 + r] = s; }
  return M;
};

const VS = `#version 300 es
layout(location=0) in vec4 a;    // posición xyz, tipo
layout(location=1) in vec4 b;    // color rgb, brillo
uniform mat4 uVP; uniform float uEsc, uA, uLejos, uVecindad;
out vec3 vC; out float vA;
void main(){
  vec4 p = uVP * vec4(a.xyz, 1.0);
  gl_Position = p;
  float d = max(p.w, 1e-4);
  float tipo = a.w;
  float vecina = tipo > 3.5 ? 1.0 : 0.0; if (vecina > 0.5) tipo = 1.0;
  float base = tipo > 2.5 ? 18.0 : (tipo > 1.5 ? 5.0 : 2.2);           // polvo, HII, estrellas
  gl_PointSize = clamp(base * uEsc / d, 1.0, tipo > 2.5 ? 60.0 : (tipo > 1.5 ? 9.0 : 5.0));
  float lejos = smoothstep(uLejos * 1.2, uLejos * 0.4, d);            // niebla de distancia
  // las estrellas cercanas no crecen: se vuelven más brillantes (puntos nítidos, como en una foto de cielo)
  float cerca = clamp(base * uEsc / d / 5.0, 0.0, 3.0);
  vC = b.rgb; vA = b.a * uA * lejos * mix(1.0, uVecindad, vecina) * (tipo > 2.5 ? 1.0 : (0.55 + 0.45 * min(cerca, 1.0)) * (1.0 + 0.6 * max(0.0, cerca - 1.0)));
}`;
const FS = `#version 300 es
precision highp float;
in vec3 vC; in float vA; out vec4 o;
void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float k = exp(-dot(q, q) * 3.0); o = vec4(vC * vA * k, vA * k); }`;

type Nube = { vao: WebGLVertexArrayObject; n: number; nPolvo: number; inicioPolvo: number };
const subir = (g: WebGL2RenderingContext, A: Float32Array, B: Float32Array) => {
  const vao = g.createVertexArray()!; g.bindVertexArray(vao);
  const ba = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, ba); g.bufferData(g.ARRAY_BUFFER, A, g.STATIC_DRAW);
  g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 4, g.FLOAT, false, 0, 0);
  const bb = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, bb); g.bufferData(g.ARRAY_BUFFER, B, g.STATIC_DRAW);
  g.enableVertexAttribArray(1); g.vertexAttribPointer(1, 4, g.FLOAT, false, 0, 0);
  g.bindVertexArray(null);
  return vao;
};
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());

// ══ la Vía Láctea ═════════════════════════════════════════════════════════════════════════════════════════════
export const SOL: V3 = [0.55 * Math.cos(-1.9), 0.55 * Math.sin(-1.9), 0.0];
let galaxia: { prog: ReturnType<typeof programa>; nube: Nube } | null = null;
const hacerGalaxia = (g: WebGL2RenderingContext) => {
  const r = azar(77);
  const N = 420000, NV = 9000, NP = 16000;
  const tot = N + NV + NP;
  const A = new Float32Array(tot * 4), B = new Float32Array(tot * 4);
  let i = 0;
  const pone = (x: number, y: number, z: number, tipo: number, c: V3, al: number) => { A.set([x, y, z, tipo], i * 4); B.set([c[0], c[1], c[2], al], i * 4); i++; };
  for (let k = 0; k < N; k++) {
    const u = r();
    if (u < 0.12) {                                           // bulbo en barra
      const x = gauss(r) * 0.11, y = gauss(r) * 0.05, z = gauss(r) * 0.04, ang = 0.45;
      pone(x * Math.cos(ang) - y * Math.sin(ang), x * Math.sin(ang) + y * Math.cos(ang), z, 1, [1.0, 0.82, 0.58], 0.55);
      continue;
    }
    // disco: radio exponencial; los brazos juntan estrellas alrededor de la espiral logarítmica θ = ln(r)/tan(paso)
    const rr = Math.min(1.05, -Math.log(1 - r() * 0.985) * 0.27 + 0.04);
    const brazo = Math.floor(r() * 2) * Math.PI;
    const enBrazo = r() < 0.62;
    const ancho = enBrazo ? 0.18 + 0.12 * r() : Math.PI;
    const th = brazo + Math.log(rr) / 0.27 + gauss(r) * ancho * (enBrazo ? 0.5 : 1);
    const z = gauss(r) * (enBrazo ? 0.008 : 0.018) * (1 + 1.5 * (1 - rr));
    const joven = enBrazo && r() < 0.5;
    const hii = enBrazo && r() < 0.012;
    const col: V3 = hii ? [1.0, 0.45, 0.62] : joven ? [0.68, 0.8, 1.0] : [1.0, 0.9, 0.75];
    pone(rr * Math.cos(th), rr * Math.sin(th), z, hii ? 2 : 1, col, hii ? 0.9 : joven ? 0.55 : 0.35);
  }
  // vecindad solar: estrellas cercanas al Sol, para que el comienzo tenga profundidad
  for (let k = 0; k < NV; k++) {
    const d = 0.004 + Math.pow(r(), 0.6) * 0.04;
    const a1 = r() * Math.PI * 2, a2 = Math.acos(2 * r() - 1);
    const c: V3 = r() < 0.2 ? [1.0, 0.8, 0.6] : r() < 0.5 ? [0.8, 0.88, 1.0] : [1.0, 0.95, 0.88];
    pone(SOL[0] + d * Math.sin(a2) * Math.cos(a1), SOL[1] + d * Math.sin(a2) * Math.sin(a1), SOL[2] + d * Math.cos(a2) * 0.35, 4, c, 0.6 + 0.4 * r());
  }
  const inicioPolvo = i;
  // polvo: nubes oscuras al borde interior de los brazos (restan luz)
  for (let k = 0; k < NP; k++) {
    const rr = 0.12 + Math.pow(r(), 0.8) * 0.85;
    const th = Math.floor(r() * 2) * Math.PI + Math.log(rr) / 0.27 - 0.22 + gauss(r) * 0.07;
    pone(rr * Math.cos(th), rr * Math.sin(th), gauss(r) * 0.004, 3, [0, 0, 0], 0.07 + 0.08 * r());
  }
  return { vao: subir(g, A, B), n: inicioPolvo, nPolvo: tot - inicioPolvo, inicioPolvo };
};

export type ParamCam = { ojo: V3; mira: V3; arriba: V3; fov: number; brillo: number; vecindad?: number };
export const pintarGalaxia3d = (W: number, H: number, P: ParamCam) => {
  const { c, g } = escena("galaxia3d", W, H);
  if (!galaxia) galaxia = { prog: programa(g, VS, FS), nube: hacerGalaxia(g) };
  const { prog, nube } = galaxia;
  g.clearColor(0, 0, 0, 1); g.clear(g.COLOR_BUFFER_BIT);
  g.useProgram(prog.p);
  g.uniformMatrix4fv(prog.u("uVP"), false, camara(P.ojo, P.mira, P.arriba, P.fov, W / H));
  g.uniform1f(prog.u("uEsc"), (H / 2) / Math.tan(P.fov / 2) * 0.0016); g.uniform1f(prog.u("uA"), P.brillo); g.uniform1f(prog.u("uLejos"), 60); g.uniform1f(prog.u("uVecindad"), P.vecindad ?? 1);
  g.enable(g.BLEND);
  g.bindVertexArray(nube.vao);
  g.blendFunc(g.ONE, g.ONE); g.drawArrays(g.POINTS, 0, nube.n);                       // estrellas: suman luz
  g.blendFunc(g.ZERO, g.ONE_MINUS_SRC_ALPHA); g.drawArrays(g.POINTS, nube.inicioPolvo, nube.nPolvo);   // polvo: resta
  g.disable(g.BLEND);
  return c;
};

// ══ la red cósmica ═══════════════════════════════════════════════════════════════════════════════════════════
let red: { prog: ReturnType<typeof programa>; nube: Nube } | null = null;
const hacerRed = (g: WebGL2RenderingContext) => {
  const r = azar(5150);
  const NN = 320, nodos: V3[] = Array.from({ length: NN }, () => [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1] as V3);
  const masa = nodos.map(() => Math.pow(r(), 2.5));
  const aristas: [number, number][] = [];
  nodos.forEach((p, i) => {
    const d = nodos.map((q, j) => [Math.hypot(...sub(p, q)), j] as [number, number]).sort((a, b) => a[0] - b[0]);
    for (let k = 1; k <= 3; k++) { const j = d[k][1]; if (i < j) aristas.push([i, j]); else if (!aristas.some(([a, b]) => a === j && b === i)) aristas.push([j, i]); }
  });
  const N = 270000;
  const A = new Float32Array(N * 4), B = new Float32Array(N * 4);
  for (let k = 0; k < N; k++) {
    let p: V3;
    if (r() < 0.3) {                                          // cúmulos en los nudos
      const j = Math.floor(Math.pow(r(), 0.7) * NN), s = 0.01 + 0.04 * masa[j];
      p = [nodos[j][0] + gauss(r) * s, nodos[j][1] + gauss(r) * s, nodos[j][2] + gauss(r) * s];
    } else {                                                  // filamentos
      const [a, b] = aristas[Math.floor(r() * aristas.length)];
      const u = r(), s = 0.006 + 0.012 * Math.sin(Math.PI * u) * (0.5 + masa[a] + masa[b]);
      p = [nodos[a][0] + (nodos[b][0] - nodos[a][0]) * u + gauss(r) * s, nodos[a][1] + (nodos[b][1] - nodos[a][1]) * u + gauss(r) * s, nodos[a][2] + (nodos[b][2] - nodos[a][2]) * u + gauss(r) * s];
    }
    const t = r();
    const col: V3 = t < 0.25 ? [1.0, 0.78, 0.5] : t < 0.6 ? [0.72, 0.6, 1.0] : [0.6, 0.72, 1.0];
    A.set([p[0], p[1], p[2], 1], k * 4); B.set([col[0], col[1], col[2], 0.55 + 0.45 * r()], k * 4);
  }
  return { vao: subir(g, A, B), n: N, nPolvo: 0, inicioPolvo: N };
};
export const pintarRed3d = (W: number, H: number, P: ParamCam) => {
  const { c, g } = escena("red3d", W, H);
  if (!red) red = { prog: programa(g, VS, FS), nube: hacerRed(g) };
  const { prog, nube } = red;
  g.clearColor(0, 0, 0, 1); g.clear(g.COLOR_BUFFER_BIT);
  g.useProgram(prog.p);
  g.uniformMatrix4fv(prog.u("uVP"), false, camara(P.ojo, P.mira, P.arriba, P.fov, W / H, 0.001, 50));
  g.uniform1f(prog.u("uEsc"), (H / 2) / Math.tan(P.fov / 2) * 0.0011); g.uniform1f(prog.u("uA"), P.brillo); g.uniform1f(prog.u("uLejos"), 6); g.uniform1f(prog.u("uVecindad"), 1);
  g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE);
  g.bindVertexArray(nube.vao); g.drawArrays(g.POINTS, 0, nube.n);
  g.disable(g.BLEND);
  return c;
};
