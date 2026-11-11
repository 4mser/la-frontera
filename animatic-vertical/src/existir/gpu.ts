// Ayudas WebGL2 para las escenas de «Qué extraño es existir»: cada escena tiene su propio lienzo fuera de pantalla
// (contexto aparte), compila sus programas una vez y devuelve el lienzo para dibujarlo en el 2D principal.
export type Escena = { c: HTMLCanvasElement; g: WebGL2RenderingContext };

const escenas: Record<string, Escena> = {};

export const escena = (nombre: string, w: number, h: number): Escena => {
  let e = escenas[nombre];
  if (!e) {
    const c = document.createElement("canvas");
    const g = c.getContext("webgl2", { preserveDrawingBuffer: true, antialias: true, premultipliedAlpha: false, alpha: false })!;
    g.getExtension("EXT_color_buffer_float");
    e = escenas[nombre] = { c, g };
  }
  if (e.c.width !== w || e.c.height !== h) { e.c.width = w; e.c.height = h; }
  e.g.viewport(0, 0, w, h);
  return e;
};

export const programa = (g: WebGL2RenderingContext, vs: string, fs: string) => {
  const sh = (tipo: number, src: string) => {
    const s = g.createShader(tipo)!;
    g.shaderSource(s, src); g.compileShader(s);
    if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error((g.getShaderInfoLog(s) ?? "shader") + "\n" + src.slice(0, 400));
    return s;
  };
  const p = g.createProgram()!;
  g.attachShader(p, sh(g.VERTEX_SHADER, vs)); g.attachShader(p, sh(g.FRAGMENT_SHADER, fs));
  g.linkProgram(p);
  if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p) ?? "link");
  const U: Record<string, WebGLUniformLocation | null> = {};
  const u = (n: string) => (n in U ? U[n] : (U[n] = g.getUniformLocation(p, n)));
  return { p, u };
};

// Un rectángulo de pantalla completa (para escenas de fragmento)
const vaos = new WeakMap<WebGL2RenderingContext, WebGLVertexArrayObject>();
export const pantalla = (g: WebGL2RenderingContext) => {
  let v = vaos.get(g);
  if (!v) {
    v = g.createVertexArray()!; g.bindVertexArray(v);
    const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
    vaos.set(g, v);
  }
  g.bindVertexArray(v);
  g.drawArrays(g.TRIANGLES, 0, 3);
};
export const VS_PANTALLA = `#version 300 es
layout(location=0) in vec2 p; out vec2 v;
void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

// Textura desde una imagen (una vez por imagen)
const texs = new WeakMap<WebGL2RenderingContext, Map<HTMLImageElement | HTMLCanvasElement, WebGLTexture>>();
export const textura = (g: WebGL2RenderingContext, im: HTMLImageElement | HTMLCanvasElement, repetir = false) => {
  let m = texs.get(g); if (!m) { m = new Map(); texs.set(g, m); }
  let t = m.get(im);
  if (!t) {
    t = g.createTexture()!; g.bindTexture(g.TEXTURE_2D, t);
    g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, im);
    g.generateMipmap(g.TEXTURE_2D);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, repetir ? g.REPEAT : g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    m.set(im, t);
  }
  return t;
};

// PRNG determinista
export const azar = (s: number) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
