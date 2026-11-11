// Cinematic camera over a computed image: the image is a plane in 3D seen by a tilted camera (real perspective),
// with depth of field from mipmaps, and an optional growth map that reveals the structure as it grows, with a
// bright tip at the growth front. Pure function of its uniforms.
const VS = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform sampler2D uCrec;
uniform sampler2D uFondo;
uniform float uUsaFondo;
uniform vec2 uRes;
uniform float uAspImg;
uniform vec2 uCentro;
uniform float uZoom;
uniform float uRot;
uniform float uInclina;
uniform float uFoco;
uniform float uCrece;
uniform float uUsaCrec;
uniform float uBrillo;
out vec4 o;
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * uRes.y);
  // camera at distance 1 from the focus point, pitched by uInclina
  vec3 cam = vec3(0.0, -sin(uInclina), cos(uInclina));
  vec3 f = normalize(-cam);
  vec3 r = vec3(1.0, 0.0, 0.0);
  vec3 u = normalize(cross(r, f)) * -1.0;
  vec3 rd = normalize(f + uZoom * (p.x * r + p.y * u));
  if (rd.z >= -1e-4) { o = vec4(0.0, 0.0, 0.0, 1.0); return; }
  float t = -cam.z / rd.z;
  vec2 X = (cam + rd * t).xy;
  float cr = cos(uRot), sr = sin(uRot);
  X = vec2(cr * X.x - sr * X.y, sr * X.x + cr * X.y);
  vec2 uv = uCentro + vec2(X.x / uAspImg, X.y);
  // depth of field: sharp at the focus distance (1), softer nearer and farther
  float lod = uFoco * abs(log(t)) * 5.0;
  vec3 col = textureLod(uTex, uv, lod).rgb;
  if (uUsaCrec > 0.5) {
    float g = textureLod(uCrec, uv, 0.0).r;
    if (g > 0.003) {
      float vis = 1.0 - smoothstep(uCrece - 0.03, uCrece + 0.006, g);
      float linea = smoothstep(0.45, 0.85, max(col.r, max(col.g, col.b)));
      float punta = exp(-abs(g - uCrece) * 70.0) * step(g, uCrece + 0.01) * linea;
      vec3 base = uUsaFondo > 0.5 ? textureLod(uFondo, uv, lod).rgb : vec3(0.0);
      col = mix(base, col, vis) + vec3(1.0, 0.96, 0.9) * punta * 0.9 * step(0.02, uCrece) * step(uCrece, 1.0);
    }
  }
  // fade outside the image and towards the horizon
  vec2 dentro = smoothstep(vec2(0.0), vec2(0.03), uv) * smoothstep(vec2(0.0), vec2(0.03), 1.0 - uv);
  col *= dentro.x * dentro.y * uBrillo * exp(-max(t - 1.0, 0.0) * 0.35);
  o = vec4(col, 1.0);
}`;

let gl: WebGL2RenderingContext | null = null;
let lienzo: HTMLCanvasElement | null = null;
const U: Record<string, WebGLUniformLocation | null> = {};
const texturas = new Map<string, WebGLTexture>();

const compilar = (g: WebGL2RenderingContext, tipo: number, src: string) => {
  const s = g.createShader(tipo)!;
  g.shaderSource(s, src);
  g.compileShader(s);
  if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) ?? "shader");
  return s;
};

const preparar = () => {
  if (gl) return gl;
  lienzo = document.createElement("canvas");
  gl = lienzo.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false })!;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compilar(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compilar(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  for (const n of ["uTex", "uCrec", "uRes", "uAspImg", "uCentro", "uZoom", "uRot", "uInclina", "uFoco", "uCrece", "uUsaCrec", "uBrillo", "uFondo", "uUsaFondo"]) U[n] = gl.getUniformLocation(prog, n);
  gl.uniform1i(U.uTex, 0);
  gl.uniform1i(U.uCrec, 1);
  gl.uniform1i(U.uFondo, 2);
  return gl;
};

// Uploads an image once (with mipmaps for the depth of field).
export const subirTextura = (clave: string, img: HTMLImageElement) => {
  const g = preparar();
  if (texturas.has(clave)) return;
  const tx = g.createTexture()!;
  g.bindTexture(g.TEXTURE_2D, tx);
  g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img);
  g.generateMipmap(g.TEXTURE_2D);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
  texturas.set(clave, tx);
};

export type ParamPlano = { img: string; crec?: string; fondo?: string; aspImg: number; centro: [number, number]; zoom: number; rot: number; inclina: number; foco: number; crece: number; brillo: number };

export const pintarPlano = (w: number, h: number, P: ParamPlano) => {
  const g = preparar();
  if (lienzo!.width !== w || lienzo!.height !== h) { lienzo!.width = w; lienzo!.height = h; }
  g.viewport(0, 0, w, h);
  g.activeTexture(g.TEXTURE0);
  g.bindTexture(g.TEXTURE_2D, texturas.get(P.img)!);
  const conCrec = !!(P.crec && texturas.has(P.crec));
  g.activeTexture(g.TEXTURE1);
  g.bindTexture(g.TEXTURE_2D, conCrec ? texturas.get(P.crec!)! : texturas.get(P.img)!);
  const conFondo = !!(P.fondo && texturas.has(P.fondo));
  g.activeTexture(g.TEXTURE2);
  g.bindTexture(g.TEXTURE_2D, conFondo ? texturas.get(P.fondo!)! : texturas.get(P.img)!);
  g.uniform1f(U.uUsaFondo, conFondo ? 1 : 0);
  g.uniform2f(U.uRes, w, h);
  g.uniform1f(U.uAspImg, P.aspImg);
  g.uniform2f(U.uCentro, P.centro[0], P.centro[1]);
  g.uniform1f(U.uZoom, P.zoom);
  g.uniform1f(U.uRot, P.rot);
  g.uniform1f(U.uInclina, P.inclina);
  g.uniform1f(U.uFoco, P.foco);
  g.uniform1f(U.uCrece, P.crece);
  g.uniform1f(U.uUsaCrec, conCrec ? 1 : 0);
  g.uniform1f(U.uBrillo, P.brillo);
  g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  return lienzo!;
};
