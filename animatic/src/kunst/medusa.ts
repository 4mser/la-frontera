// «Formas del asombro» · la campana de la medusa en GPU (campo de distancia, vidrio luminoso), inspirada en la
// Desmonema de la lámina 8: campana translúcida azul violácea, borde festoneado de 16 lóbulos en oro, canales radiales
// que brillan, gónadas cálidas. La campana pulsa: se aplana y se ensancha al contraerse. Los brazos y tentáculos se
// dibujan encima con la misma cámara (proyectar), para que todo quede en el mismo espacio.
import { escena, programa, pantalla, VS_PANTALLA } from "../existir/gpu";

const FS = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform vec2 uRes; uniform float uPulso, uGiro, uIncl, uDist, uA, uT;
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
// campana: casquete de elipsoide (solo la mitad de arriba), grosor fino, borde con 16 lóbulos
float campana(vec3 p, out float canal, out float borde){
  float pul = uPulso;
  float a = 1.0 * (1.0 - 0.12 * pul), b = 0.72 * (1.0 + 0.14 * pul);
  float th = atan(p.z, p.x);
  float lob = 1.0 + 0.05 * pow(abs(cos(th * 8.0)), 2.0) * smoothstep(-0.05, -0.2, p.y + 0.2);
  vec3 q = vec3(p.x / (a * lob), p.y / b, p.z / (a * lob));
  float d = (length(q) - 1.0) * min(a, b);
  float capa = abs(d) - 0.02;
  float corte = -(p.y + 0.18);                 // se corta la mitad de abajo (abierta)
  canal = pow(abs(cos(th * 8.0 + 0.0)), 40.0);
  borde = smoothstep(-0.05, -0.18, p.y);
  return max(capa, corte);
}
void main(){
  vec2 q = (v * 2. - 1.) * vec2(uRes.x / uRes.y, 1.);
  mat3 R = rotY(uGiro) * rotX(uIncl);
  vec3 ro = R * vec3(0., 0., uDist), rd = R * normalize(vec3(q * 0.62, -1.));
  vec3 col = vec3(0.); float t = 0.;
  for (int i = 0; i < 160; i++) {
    vec3 p = ro + rd * t; float canal, borde;
    float d = campana(p, canal, borde), ad = abs(d);
    float cerca = exp(-ad * 260.);
    // vidrio azul violáceo; canales radiales más brillantes; borde dorado; gónadas cálidas arriba adentro
    vec3 c = mix(vec3(0.35, 0.55, 1.0), vec3(0.75, 0.6, 1.0), clamp(p.y + 0.5, 0., 1.));
    c += vec3(0.7, 0.9, 1.0) * canal * 0.8;
    c = mix(c, vec3(1.0, 0.72, 0.35), borde * 0.85);
    float gon = exp(-pow(length(vec2(length(p.xz) - 0.38, p.y - 0.25)) / 0.09, 2.0));
    col += c * cerca * 0.016 + vec3(1.0, 0.55, 0.35) * gon * 0.01;
    t += max(ad * 0.6, 0.004);
    if (t > uDist + 2.5) break;
  }
  col *= uA;
  col = col / (1. + col * 0.5);
  o = vec4(pow(col, vec3(0.85)), 1.);
}`;
let prog: ReturnType<typeof programa> | null = null;
export type Cam = { giro: number; incl: number; dist: number };
export const pintarCampana = (w: number, h: number, P: Cam & { pulso: number; a: number; t: number }) => {
  const { c, g } = escena("kunst-medusa", w, h);
  if (!prog) prog = programa(g, VS_PANTALLA, FS);
  const { p, u } = prog; g.useProgram(p);
  g.uniform2f(u("uRes"), w, h); g.uniform1f(u("uPulso"), P.pulso); g.uniform1f(u("uGiro"), P.giro); g.uniform1f(u("uIncl"), P.incl);
  g.uniform1f(u("uDist"), P.dist); g.uniform1f(u("uA"), P.a); g.uniform1f(u("uT"), P.t);
  pantalla(g);
  return c;
};
// la misma cámara del sombreador, para dibujar brazos y tentáculos encima: devuelve pixeles (centro del cuadro = 0,0)
export const proyectar = (x: number, y: number, z: number, cam: Cam, h: number): [number, number, number] => {
  // mismas matrices que el sombreador: R = rotY(giro)·rotX(incl); la cámara está en ro = R·(0,0,dist)
  const rx = (vx: number, vy: number, vz: number, a: number): [number, number, number] => { const c = Math.cos(a), s = Math.sin(a); return [vx, c * vy - s * vz, s * vy + c * vz]; };
  const ry = (vx: number, vy: number, vz: number, a: number): [number, number, number] => { const c = Math.cos(a), s = Math.sin(a); return [c * vx + s * vz, vy, -s * vx + c * vz]; };
  const [ox, oy, oz] = ry(...rx(0, 0, cam.dist, cam.incl), cam.giro);
  const [dx, dy, dz] = rx(...ry(x - ox, y - oy, z - oz, -cam.giro), -cam.incl);   // al marco de la cámara: Rᵀ·(P − ro)
  const f = 1 / 0.62, zz = -dz;
  return [(dx / zz) * f * (h / 2), -(dy / zz) * f * (h / 2), zz];
};
