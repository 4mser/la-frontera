// Acto I · la galaxia que es un ojo (WebGL2, ~300 000 partículas).
// Cada partícula tiene dos vidas: estrella de una galaxia espiral (disco exponencial, dos brazos en espiral
// logarítmica, bulbo dorado, regiones HII rosadas, bandas de polvo que absorben) y fibra del estroma de un iris
// (radial, collarete ámbar, borde gris azulado, limbo oscuro). g = 1 es galaxia, g = 0 iris; el paso de una a otra
// es desenrollar la espiral: el ángulo de torsión es ln(r)/tan(paso) · g.
import { azar, escena, programa, textura } from "./gpu";

const N = 300000;
const VS = `#version 300 es
layout(location=0) in vec4 a;     // u (radio 0..1), theta (fibra), tipo, rnd
layout(location=1) in vec2 b;     // nace, rnd2
uniform float uT, uG, uFase, uPupila, uEsc, uBrillo, uMezFoto, uApaga;
uniform vec2 uRes;
uniform sampler2D uFoto; uniform vec2 uFotoC, uFotoWH; uniform float uFotoR;
out vec3 vCol; out float vA;
const float PI = 3.14159265;
float eOut(float x){ return x >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * x); }
void main(){
  float u = a.x, th = a.y, tipo = a.z, r1 = a.w, nace = b.x, r2 = b.y;
  float x = clamp((uT - nace) / 2.8, 0.0, 1.0);
  if (x <= 0.0) { gl_Position = vec4(2.0); gl_PointSize = 0.0; return; }
  float brote = eOut(x);
  float g = uG;
  // --- radio: iris (uniforme entre la pupila y el limbo) y galaxia (disco exponencial)
  float rIris = mix(uPupila, 1.0, u);
  float rGal = min(1.05, -log(1.0 - u * 0.985) * 0.24 + 0.03);
  if (tipo > 0.5 && tipo < 1.5) { rGal = abs(r1 - 0.5) * 0.22 + r2 * 0.04; rIris = mix(uPupila, uPupila + 0.12, r2); }  // bulbo
  if (tipo > 3.5) { rGal = 1.0 + (r1 - 0.5) * 0.06; rIris = 0.99 + (r1 - 0.5) * 0.05; }                                  // limbo
  float r = mix(rIris, rGal, g) * brote;
  // --- ángulo: los brazos juntan las fibras hacia dos direcciones; la espiral es logarítmica
  // las fibras se juntan hacia dos brazos (0 y π) con un desplazamiento suave, sin saltos entre brazos
  float junta = g * (tipo < 0.5 || tipo > 1.5 ? 0.62 : 0.0) * 0.5 * sin(2.0 * th);
  float paso = 0.30;                                                  // tan del ángulo de paso (~17°)
  float tors = g * (log(max(r, 0.02)) / paso) * -1.0;
  float ang = th - junta + tors + uFase * (1.25 - 0.9 * u * g) + (r2 - 0.5) * 0.02;
  // dispersión vertical del disco (la galaxia es gruesa; el iris es un plano de fibras)
  float sc = g * (0.012 + 0.03 * (1.0 - u)) * (r1 - 0.5);
  vec2 p = vec2(cos(ang), sin(ang)) * (r + sc);
  gl_Position = vec4(p * uEsc / (uRes * 0.5) * vec2(1.0, -1.0), 0.0, 1.0);
  // --- color y brillo
  vec3 cGal = mix(vec3(1.0, 0.86, 0.62), vec3(0.66, 0.78, 1.0), smoothstep(0.05, 0.4, rGal));
  float a0 = 0.55;
  if (tipo > 0.5 && tipo < 1.5) { cGal = vec3(1.0, 0.82, 0.55); a0 = 0.6; }
  if (tipo > 1.5 && tipo < 2.5) { cGal = vec3(1.0, 0.42, 0.62); a0 = 0.95; }
  float coll = exp(-pow((u - 0.3) / 0.09, 2.0));
  vec3 cIris = mix(vec3(1.0, 0.6, 0.22), vec3(0.6, 0.7, 0.8), smoothstep(0.22, 0.5, u));
  cIris = mix(cIris, vec3(1.0, 0.78, 0.45), coll * 0.5 * r2);
  if (tipo > 3.5) cIris = vec3(0.22, 0.28, 0.34);
  vCol = mix(cIris, cGal, g);
  // al final, cada fibra toma el color real de la foto en su lugar (el mismo iris, medido)
  if (uMezFoto > 0.0) {
    vec2 uv = (uFotoC + p * uFotoR) / uFotoWH;
    vec3 f = pow(textureLod(uFoto, uv, 1.5).rgb, vec3(0.9)) * 2.2;
    vCol = mix(vCol, f, uMezFoto * (1.0 - g));
  }
  // en el iris las fibras más claras son las del borde de las criptas (r1 alto)
  float aIris = (0.28 + 0.7 * pow(r1, 3.0)) * (1.0 + coll * 0.8) * (tipo > 3.5 ? 0.9 : 1.0);
  float aGal = a0 * (0.4 + 0.6 * r1);
  vA = mix(aIris, aGal, g) * smoothstep(0.0, 0.4, x) * uBrillo * (1.0 - uApaga);
  if (tipo > 1.5 && tipo < 2.5) vA *= g;                              // las HII solo existen en la galaxia
  if (tipo > 0.5 && tipo < 1.5) vA *= mix(0.15, 1.0, g);
  gl_PointSize = (tipo > 1.5 && tipo < 2.5 ? 3.6 : 1.4 + 1.6 * r2) * uEsc / 410.0;
}`;
const FS = `#version 300 es
precision highp float;
in vec3 vCol; in float vA; out vec4 o;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float k = exp(-dot(q, q) * 2.6);
  o = vec4(vCol * vA * k, 1.0);
}`;
// polvo: puntos grandes y suaves que restan luz, al borde interior de cada brazo
const VS_POLVO = `#version 300 es
layout(location=0) in vec4 a;
uniform float uT, uG, uFase, uEsc;
uniform vec2 uRes;
out float vA;
void main(){
  float u = a.x, th = a.y, r1 = a.z, r2 = a.w;
  float r = min(1.0, -log(1.0 - u * 0.97) * 0.26 + 0.06);
  float tors = -(log(r) / 0.30) * uG;
  float ang = th + tors + uFase * (1.25 - 0.9 * u * uG) - 0.32;
  vec2 p = vec2(cos(ang), sin(ang)) * r;
  gl_Position = vec4(p * uEsc / (uRes * 0.5) * vec2(1.0, -1.0), 0.0, 1.0);
  vA = uG * 0.10 * (0.5 + r1) * smoothstep(0.08, 0.2, r) * clamp((uT - 2.5) / 3.0, 0.0, 1.0);
  gl_PointSize = (10.0 + 18.0 * r2) * uEsc / 410.0;
}`;
const FS_POLVO = `#version 300 es
precision highp float;
in float vA; out vec4 o;
void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; o = vec4(0.0, 0.0, 0.0, vA * exp(-dot(q, q) * 3.0)); }`;

let listo: null | { p: ReturnType<typeof programa>; pp: ReturnType<typeof programa>; vao: WebGLVertexArrayObject; vaoP: WebGLVertexArrayObject; nP: number } = null;

const preparar = (g: WebGL2RenderingContext) => {
  const rnd = azar(11);
  const A = new Float32Array(N * 4), B = new Float32Array(N * 2);
  // criptas del iris: direcciones y radios donde faltan fibras
  const criptas = Array.from({ length: 46 }, () => ({ th: rnd() * Math.PI * 2, r: 0.35 + rnd() * 0.55, w: 0.03 + rnd() * 0.08, h: 0.04 + rnd() * 0.12 }));
  let i = 0;
  while (i < N) {
    const tipo = i < N * 0.06 ? 1 : i < N * 0.068 ? 2 : i < N * 0.09 ? 4 : 0;
    const FIB = 900;
    const th = tipo === 2 ? (Math.floor(rnd() * 2) * Math.PI + (rnd() - 0.5) * 0.25) : (Math.floor(rnd() * FIB) / FIB) * Math.PI * 2 + (rnd() - 0.5) * 0.004;
    const u = tipo === 2 ? 0.25 + rnd() * 0.6 : Math.pow(rnd(), 0.9);
    if (tipo === 0) {
      let d = 1;
      for (const c of criptas) { const dt = Math.atan2(Math.sin(th - c.th), Math.cos(th - c.th)); d *= 1 - 0.9 * Math.exp(-((dt / c.w) ** 2) - ((u - c.r) / c.h) ** 2); }
      if (rnd() > d) continue;
    }
    const r1 = rnd(), r2 = rnd();
    A.set([u, th, tipo, r1], i * 4);
    B.set([tipo === 1 ? 0.9 + rnd() * 1.5 : 1.35 + rnd() * 3.4 + u * 0.9, r2], i * 2);
    i++;
  }
  const vao = g.createVertexArray()!; g.bindVertexArray(vao);
  const ba = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, ba); g.bufferData(g.ARRAY_BUFFER, A, g.STATIC_DRAW);
  g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 4, g.FLOAT, false, 0, 0);
  const bb = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, bb); g.bufferData(g.ARRAY_BUFFER, B, g.STATIC_DRAW);
  g.enableVertexAttribArray(1); g.vertexAttribPointer(1, 2, g.FLOAT, false, 0, 0);
  // polvo
  const nP = 9000, P = new Float32Array(nP * 4);
  for (let k = 0; k < nP; k++) P.set([Math.pow(rnd(), 0.8), Math.floor(rnd() * 2) * Math.PI + (rnd() - 0.5) * 0.35, rnd(), rnd()], k * 4);
  const vaoP = g.createVertexArray()!; g.bindVertexArray(vaoP);
  const bp = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, bp); g.bufferData(g.ARRAY_BUFFER, P, g.STATIC_DRAW);
  g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 4, g.FLOAT, false, 0, 0);
  g.bindVertexArray(null);
  listo = { p: programa(g, VS, FS), pp: programa(g, VS_POLVO, FS_POLVO), vao, vaoP, nP };
};

export type ParamGalaxia = { t: number; g: number; fase: number; pupila: number; esc: number; brillo: number; foto?: { im: HTMLImageElement; cx: number; cy: number; r: number; mez: number }; apaga?: number };

export const pintarGalaxia = (w: number, h: number, P: ParamGalaxia) => {
  const { c, g } = escena("galaxia", w, h);
  if (!listo) preparar(g);
  const L = listo!;
  g.clearColor(0, 0, 0, 1); g.clear(g.COLOR_BUFFER_BIT);
  g.enable(g.BLEND);
  // estrellas: suma de luz
  g.blendFunc(g.ONE, g.ONE);
  g.useProgram(L.p.p);
  g.uniform1f(L.p.u("uT"), P.t); g.uniform1f(L.p.u("uG"), P.g); g.uniform1f(L.p.u("uFase"), P.fase);
  g.uniform1f(L.p.u("uPupila"), P.pupila); g.uniform1f(L.p.u("uEsc"), P.esc); g.uniform1f(L.p.u("uBrillo"), P.brillo);
  g.uniform2f(L.p.u("uRes"), w, h);
  g.uniform1f(L.p.u("uApaga"), P.apaga ?? 0);
  g.uniform1f(L.p.u("uMezFoto"), P.foto ? P.foto.mez : 0);
  if (P.foto) {
    g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, textura(g, P.foto.im)); g.uniform1i(L.p.u("uFoto"), 0);
    g.uniform2f(L.p.u("uFotoC"), P.foto.cx, P.foto.cy); g.uniform2f(L.p.u("uFotoWH"), P.foto.im.width, P.foto.im.height); g.uniform1f(L.p.u("uFotoR"), P.foto.r);
  }
  g.bindVertexArray(L.vao); g.drawArrays(g.POINTS, 0, N);
  // polvo: resta luz
  if (P.g > 0.01) {
    g.blendFunc(g.ZERO, g.ONE_MINUS_SRC_ALPHA);
    g.useProgram(L.pp.p);
    g.uniform1f(L.pp.u("uT"), P.t); g.uniform1f(L.pp.u("uG"), P.g); g.uniform1f(L.pp.u("uFase"), P.fase);
    g.uniform1f(L.pp.u("uEsc"), P.esc); g.uniform2f(L.pp.u("uRes"), w, h);
    g.bindVertexArray(L.vaoP); g.drawArrays(g.POINTS, 0, L.nP);
  }
  g.disable(g.BLEND);
  return c;
};
