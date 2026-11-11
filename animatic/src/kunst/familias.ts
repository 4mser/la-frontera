// «Formas del asombro» · recreaciones de las familias de las láminas de Haeckel, en GPU (campo de distancia, marcha
// de rayos y el mismo vidrio luminoso del radiolario). Un solo sombreador con un selector de familia:
//   0  Spumellaria   esferas de celosía anidadas con espinas (vértices de un icosaedro)
//   1  Cyrtoidea     casco cónico en tres cámaras (céfalo, tórax, abdomen) con celosía y tres patas curvas
//   2  Stephoidea    anillos de sílice cruzados con espinas ramificadas
//   3  Phaeodaria    concha geodésica de celosía triangular con espinas huecas y coronas en la punta
// La celosía sale de un diagrama de Voronoi 3D (solo las aristas entre celdas), como en el radiolario.
import { escena, programa, pantalla, VS_PANTALLA } from "../existir/gpu";

const FS = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform vec2 uRes; uniform float uFam, uCrece, uGiro, uIncl, uDist, uFrec, uSemilla, uA, uT;
uniform vec3 uColA, uColB;
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
vec3 h3(vec3 p){ p = vec3(dot(p, vec3(127.1,311.7,74.7)), dot(p, vec3(269.5,183.3,246.1)), dot(p, vec3(113.5,271.9,124.6))); return fract(sin(p + uSemilla) * 43758.5453); }
float arista(vec3 p){
  vec3 i = floor(p), f = fract(p); float f1 = 8., f2 = 8.;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(x, y, z), r = g + 0.5 + 0.42 * (h3(i + g) - 0.5) - f; float d = dot(r, r);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return sqrt(f2) - sqrt(f1);
}
float capsula(vec3 p, vec3 a, vec3 b, float ra, float rb){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h) - mix(ra, rb, h); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
// celosía sobre una superficie: grosor de la capa (d) y red de aristas evaluada en la dirección n
float celosia(float d, vec3 n, float frec, float ancho){ return max(abs(d) - 0.016, arista(n * frec) / frec - ancho); }
vec3 ico(int k){
  float ph = 1.618034; vec3 v[12] = vec3[12](vec3(-1,ph,0),vec3(1,ph,0),vec3(-1,-ph,0),vec3(1,-ph,0),vec3(0,-1,ph),vec3(0,1,ph),vec3(0,-1,-ph),vec3(0,1,-ph),vec3(ph,0,-1),vec3(ph,0,1),vec3(-ph,0,-1),vec3(-ph,0,1));
  return normalize(v[k]);
}
float ser(vec3 p){
  float g = uCrece, an = 0.007 * (0.5 + 0.5 * g);
  int fam = int(uFam + 0.5);
  if (fam == 0) {                                          // Spumellaria
    float r = length(p); vec3 n = p / max(r, 1e-4);
    float d = min(celosia(r - 1.0, n, uFrec, an), celosia(r - 0.55, n + 3.1, uFrec * 1.6, an));
    for (int k = 0; k < 12; k++) { vec3 e = ico(k); d = smin(d, capsula(p, e * 0.55, e * (1.0 + 0.8 * g), 0.025 * g, 0.002), 0.03); }
    return d;
  }
  if (fam == 1) {                                          // Cyrtoidea: céfalo (esfera), tórax y abdomen (conos) + 3 patas
    p.y -= 0.1;
    float rc = length(p - vec3(0., 0.75, 0.)) - 0.26;
    float yy = clamp(-p.y, -0.6, 1.4);
    float perfil = 0.28 + 0.55 * smoothstep(-0.6, 0.6, -p.y) + 0.1 * sin((-p.y) * 6.0);
    float cono = (length(p.xz) - perfil) * 0.8;
    cono = max(cono, max(p.y - 0.62, -p.y - 1.15));
    vec3 n = normalize(vec3(p.x, p.y * 0.4, p.z));
    float d = min(celosia(rc, normalize(p - vec3(0., 0.75, 0.)), uFrec * 1.3, an), celosia(cono, n, uFrec, an));
    // anillos que separan las cámaras
    d = min(d, length(vec2(length(p.xz) - (0.28 + 0.55 * smoothstep(-0.6, 0.6, 0.2)), p.y + 0.2)) - 0.012 * g);
    for (int k = 0; k < 3; k++) {                          // tres patas curvas
      float a = float(k) * 2.094 + 0.3; vec3 dir = vec3(cos(a), 0., sin(a));
      vec3 b0 = dir * 0.6 + vec3(0., -0.4, 0.), b1 = dir * (1.0 + 0.4 * g) + vec3(0., -1.0 - 0.9 * g, 0.);
      d = smin(d, capsula(p, b0, b1, 0.03 * g, 0.004), 0.05);
    }
    d = smin(d, capsula(p, vec3(0., 0.95, 0.), vec3(0., 1.35 + 0.4 * g, 0.), 0.025 * g, 0.003), 0.04);   // la espina apical
    return d;
  }
  if (fam == 2) {                                          // Stephoidea: tres anillos cruzados con espinas ramificadas
    float d = 1e9;
    for (int k = 0; k < 3; k++) {
      vec3 q = p; if (k == 1) q = q.yzx; if (k == 2) q = q.zxy;
      float ani = length(vec2(length(q.xz) - 0.85, q.y)) - (0.035 + 0.02 * g);
      d = min(d, ani);
    }
    for (int k = 0; k < 12; k++) {
      vec3 e = ico(k); float L = 0.85 + 0.55 * g;
      d = smin(d, capsula(p, e * 0.85, e * L, 0.03 * g, 0.006), 0.04);
      vec3 t1 = normalize(cross(e, vec3(0.3, 1., 0.1)));
      d = smin(d, capsula(p, e * (0.85 + 0.6 * (L - 0.85)), e * L + t1 * 0.22 * g, 0.012 * g, 0.002), 0.02);
      d = smin(d, capsula(p, e * (0.85 + 0.6 * (L - 0.85)), e * L - t1 * 0.22 * g, 0.012 * g, 0.002), 0.02);
    }
    return d;
  }
  // Phaeodaria: concha geodésica (celosía fina y densa) con espinas huecas y coronas de puntas
  float r = length(p); vec3 n = p / max(r, 1e-4);
  float d = celosia(r - 0.85, n, uFrec * 2.2, an * 0.8);
  for (int k = 0; k < 12; k++) {
    vec3 e = ico(k); float L = 0.85 + 0.75 * g;
    float tubo = abs(capsula(p, e * 0.85, e * L, 0.05 * g, 0.03 * g)) - 0.008;
    d = smin(d, tubo, 0.03);
    vec3 t1 = normalize(cross(e, vec3(0.2, 1., 0.4))), t2 = cross(e, t1);
    for (int j = 0; j < 4; j++) { float a = float(j) * 1.5708; vec3 off = (cos(a) * t1 + sin(a) * t2) * 0.12 * g; d = smin(d, capsula(p, e * L, e * (L + 0.08) + off, 0.008 * g, 0.001), 0.015); }
  }
  return d;
}
void main(){
  vec2 q = (v * 2. - 1.) * vec2(uRes.x / uRes.y, 1.);
  mat3 R = rotY(uGiro) * rotX(uIncl);
  vec3 ro = R * vec3(0., 0., uDist), rd = R * normalize(vec3(q * 0.62, -1.));
  vec3 col = vec3(0.), brillo = vec3(0.); float t = 0.; bool primero = true;
  for (int i = 0; i < 200; i++) {
    vec3 p = ro + rd * t; float d = ser(p), ad = abs(d);
    float prof = clamp(length(p) / 1.6, 0., 1.);
    brillo += mix(uColA, uColB, prof) * exp(-ad * 220.) * 0.022;
    if (primero && ad < 0.0015) {
      vec2 e = vec2(0.0015, 0.);
      vec3 nn = normalize(vec3(ser(p + e.xyy) - ser(p - e.xyy), ser(p + e.yxy) - ser(p - e.yxy), ser(p + e.yyx) - ser(p - e.yyx)));
      col += mix(uColA, vec3(1.0, 0.97, 0.92), 0.5) * (0.06 + 0.9 * pow(1. - abs(dot(nn, -rd)), 3.));
      primero = false;
    }
    t += max(ad * 0.7, 0.004);
    if (t > uDist + 3.0) break;
  }
  col = (col + brillo) * uA;
  col = col / (1. + col * 0.6);
  o = vec4(pow(col, vec3(0.8)), 1.);
}`;
let prog: ReturnType<typeof programa> | null = null;
export type ParamFamilia = { fam: number; crece: number; giro: number; incl: number; dist: number; frec: number; semilla: number; a: number; t: number; colA: [number, number, number]; colB: [number, number, number] };
export const pintarFamilia = (w: number, h: number, P: ParamFamilia) => {
  const { c, g } = escena("kunst-familias", w, h);
  if (!prog) prog = programa(g, VS_PANTALLA, FS);
  const { p, u } = prog; g.useProgram(p);
  g.uniform2f(u("uRes"), w, h);
  for (const [k, val] of [["uFam", P.fam], ["uCrece", P.crece], ["uGiro", P.giro], ["uIncl", P.incl], ["uDist", P.dist], ["uFrec", P.frec], ["uSemilla", P.semilla], ["uA", P.a], ["uT", P.t]] as const) g.uniform1f(u(k), val);
  g.uniform3f(u("uColA"), ...P.colA); g.uniform3f(u("uColB"), ...P.colB);
  pantalla(g);
  return c;
};
