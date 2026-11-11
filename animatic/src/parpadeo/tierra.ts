// «Un parpadeo» · acto I: la Tierra de noche en GPU (WebGL2, trazado de rayos de una esfera), distinta de la de Existir:
// casi todo es lado nocturno con luces de ciudades (NASA Black Marble), un creciente fino de día, nubes iluminadas
// por la luna, la atmósfera como un anillo de luz con el Sol oculto detrás del borde, y estrellas procedurales que
// se mueven con la cámara (paralaje real). La cámara es una cámara de verdad (posición, mira, campo de visión): la
// misma proyección se usa en el 2D para dibujar el pulso de luz encima.
import { escena, programa, pantalla, VS_PANTALLA, textura } from "../existir/gpu";

export type V3 = [number, number, number];
export type Cam = { pos: V3; mira: V3; fov: number };
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const base = (c: Cam) => {
  const f = norm(sub(c.mira, c.pos)), r = norm(cruz(f, [0, 1, 0])), u = cruz(r, f);
  return { f, r, u };
};
// proyección a pixeles; z > 0 delante de la cámara; oculto = la esfera de radio 1 tapa el punto
export const proyectar = (p: V3, c: Cam, w: number, h: number) => {
  const { f, r, u } = base(c), d = sub(p, c.pos), z = dot(d, f);
  const k = 1 / Math.tan(c.fov / 2);
  const x = w / 2 + (dot(d, r) / z) * k * (h / 2), y = h / 2 - (dot(d, u) / z) * k * (h / 2);
  // ¿la Tierra se interpone? rayo cámara → punto contra la esfera unitaria
  const L = Math.hypot(...d), rd: V3 = [d[0] / L, d[1] / L, d[2] / L];
  const b = dot(c.pos, rd), cc = dot(c.pos, c.pos) - 1, disc = b * b - cc;
  let oculto = false;
  if (disc > 0) { const t0 = -b - Math.sqrt(disc); if (t0 > 0 && t0 < L - 1e-4) oculto = true; }
  return { x, y, z, oculto };
};

const FS = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D uNoche, uDia, uNubes;
uniform vec3 uC, uF, uR, uU, uSol;
uniform float uK, uAsp, uRot, uLuces, uExpo, uEstrellas;
const float PI = 3.14159265;
float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
vec3 estrellas(vec3 rd){
  vec3 q = rd * 260.0; vec3 id = floor(q); float h = hash(id);
  if (h < 0.9965) return vec3(0.0);
  vec3 c = id + 0.5 + 0.3 * (vec3(hash(id + 1.3), hash(id + 2.1), hash(id + 3.7)) - 0.5);
  float d = length(q - c);
  float m = pow((h - 0.9965) / 0.0035, 2.0);
  vec3 col = mix(vec3(1.0, 0.86, 0.7), vec3(0.75, 0.85, 1.0), hash(id + 5.0));
  return col * exp(-d * d * 18.0) * (0.25 + 1.6 * m);
}
void main(){
  vec2 p = v * 2.0 - 1.0;
  vec3 rd = normalize(uF * uK + p.x * uAsp * uR + p.y * uU);
  vec3 col = estrellas(rd) * uEstrellas;
  float b = dot(uC, rd), c = dot(uC, uC) - 1.0, disc = b * b - c;
  // distancia mínima del rayo al centro (para la atmósfera fuera del disco)
  float tm = max(0.0, -b); vec3 pc = uC + rd * tm; float dmin = length(pc);
  vec3 sol = normalize(uSol);
  if (disc > 0.0 && -b - sqrt(disc) > 0.0) {
    float t = -b - sqrt(disc); vec3 n = normalize(uC + rd * t);
    float lon = atan(n.z, n.x) + uRot, lat = asin(clamp(n.y, -1.0, 1.0));
    vec2 uv = vec2(fract(0.5 + lon / (2.0 * PI)), 0.5 - lat / PI);
    float ndl = dot(n, sol);
    float noche = smoothstep(0.08, -0.12, ndl);
    float nub = pow(texture(uNubes, uv).r, 2.2);
    vec3 luces = pow(texture(uNoche, uv).rgb, vec3(2.6)) * vec3(1.0, 0.72, 0.42) * 6.0 * uLuces * noche * (1.0 - 0.55 * nub);
    vec3 dia = pow(texture(uDia, uv).rgb, vec3(2.2)) * 1.2;
    vec3 suelo = mix(dia, vec3(1.0), nub * 0.85) * max(ndl, 0.0) * 1.3;
    vec3 luna = (vec3(0.004, 0.006, 0.012) + vec3(0.03, 0.035, 0.05) * nub) * noche;    // la luna apenas marca las nubes
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    vec3 aire = vec3(0.25, 0.45, 1.0) * fres * (0.06 + 1.4 * max(ndl + 0.25, 0.0)) + vec3(1.0, 0.55, 0.25) * fres * exp(-abs(ndl) * 8.0) * 0.8;
    col = luces + suelo + luna + aire;
  } else {
    // anillo de atmósfera: fuera del disco, cae rápido con la altura; más brillante del lado del Sol
    float h = max(0.0, dmin - 1.0);
    vec3 dirp = normalize(pc);
    float lado = max(dot(dirp, sol) + 0.35, 0.0);
    col += (vec3(0.3, 0.55, 1.0) * exp(-h * 70.0) * 1.2 + vec3(0.55, 0.75, 1.0) * exp(-h * 14.0) * 0.18) * (0.15 + 1.6 * lado);
    // el Sol oculto: un amanecer en el borde (corona que asoma)
    float s = max(dot(rd, sol), 0.0);
    col += vec3(1.0, 0.82, 0.6) * pow(s, 90.0) * exp(-h * 6.0) * 2.2 + vec3(1.0, 0.7, 0.45) * pow(s, 12.0) * exp(-h * 3.0) * 0.25;
  }
  col *= uExpo;
  col = col / (1.0 + col * 0.35);                                                  // compresión suave de altas luces
  o = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

let prog: ReturnType<typeof programa> | null = null;
export const pintarTierraNoche = (w: number, h: number, im: { noche: HTMLImageElement; dia: HTMLImageElement; nubes: HTMLImageElement },
  c: Cam, P: { rot: number; sol: V3; luces: number; expo: number; estrellas: number }) => {
  const { c: lienzo, g } = escena("parpadeo-tierra", w, h);
  if (!prog) prog = programa(g, VS_PANTALLA, FS);
  const { p, u } = prog; g.useProgram(p);
  g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, textura(g, im.noche, true)); g.uniform1i(u("uNoche"), 0);
  g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, textura(g, im.dia, true)); g.uniform1i(u("uDia"), 1);
  g.activeTexture(g.TEXTURE2); g.bindTexture(g.TEXTURE_2D, textura(g, im.nubes, true)); g.uniform1i(u("uNubes"), 2);
  const { f, r, u: up } = base(c);
  g.uniform3f(u("uC"), ...c.pos); g.uniform3f(u("uF"), ...f); g.uniform3f(u("uR"), ...r); g.uniform3f(u("uU"), ...up);
  g.uniform3f(u("uSol"), ...P.sol);
  g.uniform1f(u("uK"), 1 / Math.tan(c.fov / 2)); g.uniform1f(u("uAsp"), w / h);
  g.uniform1f(u("uRot"), P.rot); g.uniform1f(u("uLuces"), P.luces); g.uniform1f(u("uExpo"), P.expo); g.uniform1f(u("uEstrellas"), P.estrellas);
  pantalla(g);
  return lienzo;
};
