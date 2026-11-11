// «sobre una roca que gira alrededor de una estrella»: la Tierra en WebGL con la textura real de NASA (Blue Marble),
// luces nocturnas y nubes si están (Black Marble / Visible Earth), terminador suave, brillo especular del océano,
// dispersión atmosférica (azul en el limbo, naranja en el terminador) y el Sol que asoma detrás del borde.
import { VS_PANTALLA, escena, pantalla, programa, textura } from "./gpu";

const FS = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D uDia, uNoche, uNubes;
uniform float uHayNoche, uHayNubes;
uniform vec2 uRes; uniform vec3 uEsfera;      // centro (px, y hacia arriba) y radio (px)
uniform float uGiro, uInclina; uniform vec3 uSol; uniform float uAmanecer, uSolBrillo;
const float PI = 3.14159265;
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1,0,0, 0,c,s, 0,-s,c); }
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0,-s, 0,1,0, s,0,c); }
void main(){
  vec2 px = v * uRes;
  vec2 q = (px - uEsfera.xy) / uEsfera.z;
  float d2 = dot(q, q);
  vec3 L = normalize(uSol);
  vec3 col = vec3(0.0);
  // atmósfera exterior: halo que cae con la altura, más fuerte del lado del Sol
  float d = sqrt(d2);
  if (d > 1.0) {
    float h = d - 1.0;
    vec3 nB = normalize(vec3(q / d, 0.0));
    float lado = clamp(dot(nB, L) * 0.7 + 0.45, 0.0, 1.0);
    float a = exp(-h * 38.0) * 0.9 + exp(-h * 9.0) * 0.12;
    col += vec3(0.35, 0.6, 1.0) * a * lado * 1.3;
  } else {
    vec3 n = vec3(q, sqrt(1.0 - d2));
    vec3 nm = rotY(uGiro) * rotX(uInclina) * n;     // al sistema de la Tierra
    float lon = atan(nm.x, nm.z), lat = asin(clamp(nm.y, -1.0, 1.0));
    vec2 uv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
    vec3 dia = pow(texture(uDia, uv).rgb, vec3(2.2));
    float nub = uHayNubes > 0.5 ? texture(uNubes, uv + vec2(uGiro * 0.004, 0.0)).r : 0.0;
    float lam = dot(n, L);
    float luz = smoothstep(-0.08, 0.25, lam);
    // océano: lo que es azul oscuro en la textura
    float agua = smoothstep(0.06, 0.0, dia.r - dia.b * 0.55) * step(dia.g, dia.b * 1.3);
    vec3 V = vec3(0.0, 0.0, 1.0), Hh = normalize(L + V);
    float spec = pow(max(dot(n, Hh), 0.0), 600.0) * agua * (1.0 - nub) * 0.9;
    vec3 superficie = mix(dia, vec3(1.0), nub * 0.92);
    col = superficie * (0.004 + 1.25 * max(lam, 0.0)) * luz + vec3(1.0, 0.92, 0.8) * spec * luz;
    // terminador: la luz se enrojece al atravesar más aire
    float term = exp(-pow((lam - 0.02) / 0.05, 2.0));
    col += vec3(1.0, 0.45, 0.18) * term * 0.012 * (1.0 - nub * 0.5);
    // luces de las ciudades en el lado de noche
    if (uHayNoche > 0.5) { vec3 nl = texture(uNoche, uv).rgb; float ciudad = smoothstep(0.42, 0.85, max(nl.r, nl.g)); col += vec3(1.0, 0.76, 0.45) * ciudad * (1.0 - luz) * (1.0 - nub) * 1.4; }
    // dispersión en el limbo (azul) sobre el lado iluminado
    float mu = n.z;
    col += vec3(0.25, 0.5, 1.0) * pow(1.0 - mu, 3.0) * smoothstep(-0.3, 0.6, lam) * 0.9;
    col = col / (1.0 + col * 0.15);
  }
  // el Sol detrás del borde: núcleo y destello, tapado por el disco
  vec2 sp = uEsfera.xy + normalize(L.xy) * uEsfera.z * (1.0 + 0.012 - 0.03 * (1.0 - uAmanecer));
  float ds = length(px - sp) / uEsfera.z;
  float tapa = smoothstep(0.995, 1.01, d);
  float sol = (exp(-ds * 90.0) * 3.0 + exp(-ds * 16.0) * 0.3 + exp(-ds * 4.0) * 0.04) * uAmanecer * uSolBrillo;
  vec2 dd = px - sp;
  float raya = exp(-abs(dd.y) / uEsfera.z * 90.0) * exp(-abs(dd.x) / uEsfera.z * 2.0) * 0.5 * uAmanecer * uSolBrillo;
  col += vec3(1.0, 0.93, 0.82) * (sol * mix(0.25, 1.0, tapa) + raya);
  o = vec4(pow(max(col, 0.0), vec3(1.0 / 2.2)), 1.0);
}`;

let prog: ReturnType<typeof programa> | null = null;
export type ParamTierra = { x: number; y: number; r: number; giro: number; inclina: number; sol: [number, number, number]; amanecer: number; solBrillo: number };

export const pintarTierra = (w: number, h: number, im: { dia: HTMLImageElement; noche?: HTMLImageElement; nubes?: HTMLImageElement }, P: ParamTierra) => {
  const { c, g } = escena("tierra", w, h);
  if (!prog) prog = programa(g, VS_PANTALLA, FS);
  g.useProgram(prog.p);
  const u = prog.u;
  g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, textura(g, im.dia, true)); g.uniform1i(u("uDia"), 0);
  g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, im.noche ? textura(g, im.noche, true) : null); g.uniform1i(u("uNoche"), 1);
  g.activeTexture(g.TEXTURE2); g.bindTexture(g.TEXTURE_2D, im.nubes ? textura(g, im.nubes, true) : null); g.uniform1i(u("uNubes"), 2);
  g.uniform1f(u("uHayNoche"), im.noche ? 1 : 0); g.uniform1f(u("uHayNubes"), im.nubes ? 1 : 0);
  g.uniform2f(u("uRes"), w, h);
  g.uniform3f(u("uEsfera"), P.x, h - P.y, P.r);
  g.uniform1f(u("uGiro"), P.giro); g.uniform1f(u("uInclina"), P.inclina);
  g.uniform3f(u("uSol"), ...P.sol); g.uniform1f(u("uAmanecer"), P.amanecer); g.uniform1f(u("uSolBrillo"), P.solBrillo);
  pantalla(g);
  return c;
};
