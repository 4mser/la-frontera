// «Formas del asombro» · un radiolario creado por simulación (WebGL2, campo de distancia y marcha de rayos).
// Forma: dos esferas de celosía anidadas (la red sale del diagrama de Voronoi 3D sobre la superficie: solo quedan las
// aristas entre celdas, como los esqueletos de sílice), unidas por barras radiales, con espinas que salen por los
// vértices de un icosaedro. Aspecto de vidrio luminoso: el rayo atraviesa todo el ser y acumula brillo cerca de cada
// superficie (se ve el interior, como en las láminas de Haeckel), y el primer impacto suma reflejo de borde (Fresnel).
// Parámetros: crecimiento (la sílice se deposita: las aristas engrosan, las espinas se alargan), forma, cámara.
import { escena, programa, pantalla, VS_PANTALLA } from "../existir/gpu";

const FS = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform vec2 uRes; uniform float uT, uCrece, uGiro, uIncl, uDist, uFrecA, uFrecB, uEsp, uSemilla, uA;
uniform vec3 uColA, uColB;
const float PI = 3.14159265;
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
vec3 h3(vec3 p){ p = vec3(dot(p, vec3(127.1,311.7,74.7)), dot(p, vec3(269.5,183.3,246.1)), dot(p, vec3(113.5,271.9,124.6))); return fract(sin(p + uSemilla) * 43758.5453); }
// Voronoi 3D: devuelve F2 − F1 (cero en las aristas entre celdas)
float arista(vec3 p){
  vec3 i = floor(p), f = fract(p); float f1 = 8., f2 = 8.;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(x, y, z), r = g + 0.5 + 0.42 * (h3(i + g) - 0.5) - f; float d = dot(r, r);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return sqrt(f2) - sqrt(f1);
}
float capsula(vec3 p, vec3 a, vec3 b, float ra, float rb){
  vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
  return length(pa - ba * h) - mix(ra, rb, h);
}
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
vec3 ICO[12];
float ser(vec3 p){
  float g = uCrece;
  // celosía exterior
  float r = length(p);
  vec3 n = p / max(r, 1e-4);
  float capaA = abs(r - 1.0) - 0.02 * (0.5 + 0.5 * g);
  float redA = arista(n * uFrecA) / uFrecA * 1.0 - 0.009 * (0.5 + 0.5 * g);
  float dA = max(capaA, redA);
  // celosía interior (más fina y densa)
  float capaB = abs(r - 0.56) - 0.02 * g;
  float redB = arista(n * uFrecB + 7.3) / uFrecB - 0.006 * (0.5 + 0.5 * g);
  float dB = max(capaB, redB);
  float d = min(dA, dB);
  // barras radiales y espinas (vértices del icosaedro)
  for (int k = 0; k < 12; k++) {
    vec3 e = ICO[k];
    d = smin(d, capsula(p, e * 0.56, e * 1.0, 0.016 * g, 0.012 * g), 0.03);
    d = smin(d, capsula(p, e * 1.0, e * (1.0 + uEsp * g), 0.03 * g, 0.002), 0.04);
  }
  // núcleo (la cápsula central)
  d = smin(d, length(p) - 0.18 * g, 0.05);
  return d;
}
void main(){
  float ph = (1. + sqrt(5.)) / 2.;
  ICO[0] = normalize(vec3(-1., ph, 0.)); ICO[1] = normalize(vec3(1., ph, 0.)); ICO[2] = normalize(vec3(-1., -ph, 0.)); ICO[3] = normalize(vec3(1., -ph, 0.));
  ICO[4] = normalize(vec3(0., -1., ph)); ICO[5] = normalize(vec3(0., 1., ph)); ICO[6] = normalize(vec3(0., -1., -ph)); ICO[7] = normalize(vec3(0., 1., -ph));
  ICO[8] = normalize(vec3(ph, 0., -1.)); ICO[9] = normalize(vec3(ph, 0., 1.)); ICO[10] = normalize(vec3(-ph, 0., -1.)); ICO[11] = normalize(vec3(-ph, 0., 1.));
  vec2 q = (v * 2. - 1.) * vec2(uRes.x / uRes.y, 1.);
  mat3 R = rotY(uGiro) * rotX(uIncl);
  vec3 ro = R * vec3(0., 0., uDist), rd = R * normalize(vec3(q * 0.62, -1.));
  vec3 col = vec3(0.); float t = 0.; bool primero = true; vec3 brillo = vec3(0.);
  for (int i = 0; i < 220; i++) {
    vec3 p = ro + rd * t;
    float d = ser(p);
    float ad = abs(d);
    // brillo acumulado cerca de cada superficie: el ser se ve por dentro, como vidrio iluminado
    float prof = clamp(length(p) / 1.6, 0., 1.);
    brillo += mix(uColA, uColB, prof) * exp(-ad * 220.) * 0.022;
    if (primero && ad < 0.0015) {
      vec2 e = vec2(0.0015, 0.);
      vec3 nn = normalize(vec3(ser(p + e.xyy) - ser(p - e.xyy), ser(p + e.yxy) - ser(p - e.yxy), ser(p + e.yyx) - ser(p - e.yyx)));
      float fr = pow(1. - abs(dot(nn, -rd)), 3.);
      col += mix(uColA, vec3(1.0, 0.97, 0.92), 0.5) * (0.06 + 0.9 * fr);
      primero = false;
    }
    t += max(ad * 0.7, 0.004);
    if (t > uDist + 3.0) break;
  }
  col += brillo;
  col *= uA;
  col = col / (1. + col * 0.6);
  o = vec4(pow(col, vec3(0.8)), 1.);
}`;
let prog: ReturnType<typeof programa> | null = null;
export type ParamRadiolario = { crece: number; giro: number; incl: number; dist: number; frecA: number; frecB: number; esp: number; semilla: number; a: number; colA: [number, number, number]; colB: [number, number, number] };
export const pintarRadiolario = (w: number, h: number, P: ParamRadiolario) => {
  const { c, g } = escena("kunst-radiolario", w, h);
  if (!prog) prog = programa(g, VS_PANTALLA, FS);
  const { p, u } = prog; g.useProgram(p);
  g.uniform2f(u("uRes"), w, h);
  g.uniform1f(u("uCrece"), P.crece); g.uniform1f(u("uGiro"), P.giro); g.uniform1f(u("uIncl"), P.incl); g.uniform1f(u("uDist"), P.dist);
  g.uniform1f(u("uFrecA"), P.frecA); g.uniform1f(u("uFrecB"), P.frecB); g.uniform1f(u("uEsp"), P.esp); g.uniform1f(u("uSemilla"), P.semilla); g.uniform1f(u("uA"), P.a);
  g.uniform3f(u("uColA"), ...P.colA); g.uniform3f(u("uColB"), ...P.colB);
  pantalla(g);
  return c;
};
