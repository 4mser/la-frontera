// «Puedes escuchar una canción y sentir algo…»: figuras de Chladni en 3D, sin placa, sobre un fondo que es la música
// vista con colores (sinestesia).
// · Arena: cada grano baja por el gradiente de |u| hacia las líneas nodales del modo (n, m) de una placa cuadrada,
//   u = cos(nπx)cos(mπy) − cos(mπx)cos(nπy), con un temblor proporcional a |u|. Es función pura de t (el vertex shader
//   repite los pasos desde la posición inicial). Los granos que siguen en los vientres saltan sobre el plano.
// · El plano flota y gira en perspectiva.
// · Fondo: un campo de gradientes abstractos (ruido deformado) cuyo brillo sigue la energía del audio real de la mezcla
//   y cuyo color es el de cada nota según Scriabin (re amarillo, fa# azul violáceo, la verde).
import { azar, escena, programa, VS_PANTALLA, pantalla } from "./gpu";

const N = 240000;
const VS = `#version 300 es
layout(location=0) in vec4 a;    // x0, y0, rnd, rnd2
uniform vec3 uModos[4];          // (n, m, pasos hechos) por etapa
uniform int uEtapas;
uniform float uLado, uTemblor, uSalto, uGiro, uInclina, uFoco;
uniform vec2 uRes, uCentro;
uniform vec3 uColor;
out vec3 vCol; out float vA;
const float PI = 3.14159265;
float hash(float n){ return fract(sin(n) * 43758.5453); }
float modo(vec2 p, float n, float m){ return cos(n*PI*p.x)*cos(m*PI*p.y) - cos(m*PI*p.x)*cos(n*PI*p.y); }
vec2 grad(vec2 p, float n, float m){
  float gx = -n*PI*sin(n*PI*p.x)*cos(m*PI*p.y) + m*PI*sin(m*PI*p.x)*cos(n*PI*p.y);
  float gy = -m*PI*cos(n*PI*p.x)*sin(m*PI*p.y) + n*PI*cos(m*PI*p.x)*sin(n*PI*p.y);
  return vec2(gx, gy);
}
void main(){
  vec2 p = a.xy;
  float semilla = a.z * 1000.0;
  float uFin = 0.0;
  for (int e = 0; e < 4; e++) {
    if (e >= uEtapas) break;
    vec3 M = uModos[e];
    int pasos = int(M.z);
    for (int k = 0; k < 90; k++) {
      if (k >= pasos) break;
      float u = modo(p, M.x, M.y);
      vec2 gr = grad(p, M.x, M.y);
      p -= 0.0016 * sign(u) * gr / (length(gr) + 1.5);
      float s = semilla + float(k) * 7.31 + float(e) * 131.7;
      p += (vec2(hash(s), hash(s + 3.7)) - 0.5) * 0.03 * min(abs(u), 1.0);
      p = clamp(p, -0.985, 0.985);
    }
    uFin = modo(p, M.x, M.y);
  }
  // los granos de los vientres saltan sobre el plano (más cuanto más vibra)
  float vib = min(abs(uFin), 1.0);
  float z = uSalto * vib * hash(semilla + uTemblor * 13.1) * 0.10;
  vec3 P = vec3(p * uLado * 0.5, z * uLado * 0.5);
  // giro en el plano y luego inclinación hacia el espectador
  float c = cos(uGiro), s = sin(uGiro);
  P.xy = mat2(c, -s, s, c) * P.xy;
  float ci = cos(uInclina), si = sin(uInclina);
  P = vec3(P.x, ci * P.y - si * P.z, si * P.y + ci * P.z);
  float f = uFoco / (uFoco + P.z);
  vec2 px = uCentro + P.xy * f;
  gl_Position = vec4((px / uRes) * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y *= -1.0;
  // color: arena clara teñida por la nota; los granos que saltan brillan más
  vCol = mix(vec3(1.0), uColor, 0.35 + 0.3 * a.w) * (0.75 + 0.6 * vib * uSalto);
  vA = (0.3 + 0.25 * a.w) * f;
  gl_PointSize = (1.3 + 1.2 * a.w) * f;
}`;
const FS = `#version 300 es
precision highp float;
in vec3 vCol; in float vA; out vec4 o;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float d = dot(q, q);
  if (d > 1.0) discard;
  o = vec4(vCol * vA * exp(-d * 2.2), 1.0);
}`;
// fondo: gradientes que fluyen (ruido con deformación de dominio), color de la nota, brillo de la música
const FS_FONDO = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform vec2 uRes; uniform float uT, uEnerg, uGolpe;
uniform vec3 uC1, uC2, uC3;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float ruido(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * ruido(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
void main(){
  vec2 p = (v - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.2;
  float t = uT * 0.18;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + 0.6 * t + uGolpe * 0.4), fbm(p + 3.0 * q + vec2(8.3, 2.8) - 0.4 * t));
  float k = fbm(p + 2.6 * r);
  vec3 col = mix(uC1, uC2, smoothstep(0.25, 0.75, k));
  col = mix(col, uC3, smoothstep(0.45, 0.95, length(r) * 0.7));
  // la música enciende el campo: más energía, más luz; en cada nota, un pulso
  // como en el teaser: azul noche casi liso; solo una leve respiración con la música
  col = vec3(0.024, 0.035, 0.07) * (1.0 + 0.25 * uEnerg + 0.2 * uGolpe) + col * 0.0;
  // viñeta suave para que la arena quede al centro
  col *= 1.0 - 0.55 * smoothstep(0.35, 1.25, length((v - 0.5) * vec2(1.0, 1.4)));
  o = vec4(col, 1.0);
}`;

let L: null | { p: ReturnType<typeof programa>; fo: ReturnType<typeof programa>; vao: WebGLVertexArrayObject } = null;

export type ParamChladni = {
  etapas: [number, number, number][]; lado: number; cx: number; cy: number; temblor: number; salto: number;
  giro: number; inclina: number; t: number; energia: number; golpe: number; color: [number, number, number];
  fondo: [[number, number, number], [number, number, number], [number, number, number]];
};

export const pintarChladni = (w: number, h: number, P: ParamChladni) => {
  const { c, g } = escena("chladni", w, h);
  if (!L) {
    const rnd = azar(5);
    const A = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) A.set([rnd() * 1.96 - 0.98, rnd() * 1.96 - 0.98, rnd(), rnd()], i * 4);
    const vao = g.createVertexArray()!; g.bindVertexArray(vao);
    const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, A, g.STATIC_DRAW);
    g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 4, g.FLOAT, false, 0, 0);
    g.bindVertexArray(null);
    L = { p: programa(g, VS, FS), fo: programa(g, VS_PANTALLA, FS_FONDO), vao };
  }
  g.disable(g.BLEND);
  g.useProgram(L.fo.p);
  g.uniform2f(L.fo.u("uRes"), w, h); g.uniform1f(L.fo.u("uT"), P.t); g.uniform1f(L.fo.u("uEnerg"), P.energia); g.uniform1f(L.fo.u("uGolpe"), P.golpe);
  g.uniform3f(L.fo.u("uC1"), ...P.fondo[0]); g.uniform3f(L.fo.u("uC2"), ...P.fondo[1]); g.uniform3f(L.fo.u("uC3"), ...P.fondo[2]);
  pantalla(g);
  g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE);
  g.useProgram(L.p.p);
  const M = new Float32Array(12);
  P.etapas.slice(0, 4).forEach((e, i) => M.set(e, i * 3));
  g.uniform3fv(L.p.u("uModos"), M); g.uniform1i(L.p.u("uEtapas"), Math.min(4, P.etapas.length));
  g.uniform1f(L.p.u("uLado"), P.lado); g.uniform1f(L.p.u("uTemblor"), P.temblor); g.uniform1f(L.p.u("uSalto"), P.salto);
  g.uniform1f(L.p.u("uGiro"), P.giro); g.uniform1f(L.p.u("uInclina"), P.inclina); g.uniform1f(L.p.u("uFoco"), 1800);
  g.uniform2f(L.p.u("uRes"), w, h); g.uniform2f(L.p.u("uCentro"), P.cx, P.cy); g.uniform3f(L.p.u("uColor"), ...P.color);
  g.bindVertexArray(L.vao); g.drawArrays(g.POINTS, 0, N);
  g.disable(g.BLEND);
  return c;
};
