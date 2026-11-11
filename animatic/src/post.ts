// Film finish on the GPU, applied to every frame: bright pass, bloom, anamorphic streaks, halation, chromatic
// aberration, slight barrel distortion, ACES tonemapping with a warm/cool grade, luminance-weighted grain and vignette.
const VS = `#version 300 es
in vec2 p;
out vec2 v;
void main() { v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const BRILLO = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D uTex; uniform float uUmbral;
void main() {
  vec3 c = texture(uTex, v).rgb;
  float l = max(c.r, max(c.g, c.b));
  o = vec4(c * smoothstep(uUmbral, uUmbral + 0.25, l), 1.0);
}`;

const DESENFOQUE = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D uTex; uniform vec2 uDir; uniform float uRadio;
void main() {
  vec3 s = vec3(0.0); float w = 0.0;
  for (int i = -24; i <= 24; i++) {
    float k = float(i) / 24.0;
    float g = exp(-k * k * 3.0);
    s += texture(uTex, v + uDir * k * uRadio).rgb * g; w += g;
  }
  o = vec4(s / w, 1.0);
}`;

const FINAL = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D uTex; uniform sampler2D uBloom; uniform sampler2D uRaya;
uniform vec2 uRes; uniform float uTiempo; uniform float uExpo; uniform float uFuerza;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec2 c = v - 0.5;
  float r2 = dot(c * vec2(uRes.x / uRes.y, 1.0), c * vec2(uRes.x / uRes.y, 1.0));
  // slight barrel distortion and radial chromatic aberration
  vec2 uv = 0.5 + c * (1.0 - 0.018 * r2 * uFuerza);
  vec2 ab = c * 0.0035 * r2 * uFuerza * 2.0;
  vec3 col = vec3(texture(uTex, uv + ab).r, texture(uTex, uv).g, texture(uTex, uv - ab).b);
  vec3 bloom = texture(uBloom, uv).rgb;
  vec3 raya = texture(uRaya, uv).rgb;
  // halation: the red glow film leaves around bright light
  vec3 halo = bloom * vec3(1.0, 0.45, 0.32);
  col += (bloom * 0.32 + raya * vec3(0.55, 0.75, 1.0) * 0.3 + halo * 0.22) * uFuerza;
  col *= uExpo;
  col = aces(col * 1.15);
  // grade: cool shadows, warm highlights
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col += mix(vec3(-0.012, 0.0, 0.03), vec3(0.025, 0.01, -0.02), smoothstep(0.1, 0.8, l)) * uFuerza;
  // grain, stronger in the mid tones, new every frame
  float g = hash(gl_FragCoord.xy + fract(uTiempo * 7.13) * 431.0) - 0.5;
  col += g * 0.06 * (1.0 - abs(l - 0.45) * 1.4) * uFuerza;
  col *= 1.0 - 0.32 * smoothstep(0.15, 1.1, r2) * uFuerza;
  o = vec4(pow(max(col, 0.0), vec3(1.0 / 1.05)), 1.0);
}`;

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };
let gl: WebGL2RenderingContext | null = null;
let lienzo: HTMLCanvasElement | null = null;
let P: Record<string, Prog> = {};
let fuente: WebGLTexture | null = null;
const fbos: { tx: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number }[] = [];

const compilar = (g: WebGL2RenderingContext, tipo: number, src: string) => {
  const s = g.createShader(tipo)!;
  g.shaderSource(s, src);
  g.compileShader(s);
  if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) ?? "shader");
  return s;
};
const programa = (g: WebGL2RenderingContext, fs: string, nombres: string[]): Prog => {
  const p = g.createProgram()!;
  g.attachShader(p, compilar(g, g.VERTEX_SHADER, VS));
  g.attachShader(p, compilar(g, g.FRAGMENT_SHADER, fs));
  g.bindAttribLocation(p, 0, "p");
  g.linkProgram(p);
  const u: Record<string, WebGLUniformLocation | null> = {};
  for (const n of nombres) u[n] = g.getUniformLocation(p, n);
  return { p, u };
};
const textura = (g: WebGL2RenderingContext, w: number, h: number) => {
  const tx = g.createTexture()!;
  g.bindTexture(g.TEXTURE_2D, tx);
  g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, w, h, 0, g.RGBA, g.UNSIGNED_BYTE, null);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
  return tx;
};

const preparar = (w: number, h: number) => {
  if (gl) return gl;
  lienzo = document.createElement("canvas");
  lienzo.width = w; lienzo.height = h;
  gl = lienzo.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false })!;
  const g = gl;
  const buf = g.createBuffer();
  g.bindBuffer(g.ARRAY_BUFFER, buf);
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  g.enableVertexAttribArray(0);
  g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
  P = {
    brillo: programa(g, BRILLO, ["uTex", "uUmbral"]),
    blur: programa(g, DESENFOQUE, ["uTex", "uDir", "uRadio"]),
    final: programa(g, FINAL, ["uTex", "uBloom", "uRaya", "uRes", "uTiempo", "uExpo", "uFuerza"]),
  };
  fuente = textura(g, w, h);
  // 0: bright pass, 1-2: bloom ping-pong, 3: streak (all at a quarter of the size)
  for (let i = 0; i < 4; i++) {
    const tw = Math.round(w / 4), th = Math.round(h / 4);
    const tx = textura(g, tw, th);
    const fb = g.createFramebuffer()!;
    g.bindFramebuffer(g.FRAMEBUFFER, fb);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, tx, 0);
    fbos.push({ tx, fb, w: tw, h: th });
  }
  g.bindFramebuffer(g.FRAMEBUFFER, null);
  return g;
};

const pasada = (g: WebGL2RenderingContext, prog: Prog, destino: number | null, entrada: WebGLTexture, extra: (u: Prog["u"]) => void, w: number, h: number) => {
  g.useProgram(prog.p);
  g.bindFramebuffer(g.FRAMEBUFFER, destino === null ? null : fbos[destino].fb);
  g.viewport(0, 0, destino === null ? w : fbos[destino].w, destino === null ? h : fbos[destino].h);
  g.activeTexture(g.TEXTURE0);
  g.bindTexture(g.TEXTURE_2D, entrada);
  g.uniform1i(prog.u.uTex, 0);
  extra(prog.u);
  g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
};

// Takes the composed 2D canvas and returns a canvas with the film finish.
export const acabadoCine = (origen: HTMLCanvasElement, tiempo: number, op: { expo?: number; fuerza?: number } = {}) => {
  const w = origen.width, h = origen.height;
  const g = preparar(w, h);
  g.bindTexture(g.TEXTURE_2D, fuente);
  g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
  g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, origen);
  pasada(g, P.brillo, 0, fuente!, (u) => g.uniform1f(u.uUmbral, 0.66), w, h);
  const px = 1 / fbos[0].w, py = 1 / fbos[0].h;
  pasada(g, P.blur, 1, fbos[0].tx, (u) => { g.uniform2f(u.uDir, px, 0); g.uniform1f(u.uRadio, 14); }, w, h);
  pasada(g, P.blur, 2, fbos[1].tx, (u) => { g.uniform2f(u.uDir, 0, py); g.uniform1f(u.uRadio, 14); }, w, h);
  pasada(g, P.blur, 3, fbos[0].tx, (u) => { g.uniform2f(u.uDir, px, 0); g.uniform1f(u.uRadio, 48); }, w, h);
  pasada(g, P.final, null, fuente!, (u) => {
    g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, fbos[2].tx); g.uniform1i(u.uBloom, 1);
    g.activeTexture(g.TEXTURE2); g.bindTexture(g.TEXTURE_2D, fbos[3].tx); g.uniform1i(u.uRaya, 2);
    g.uniform2f(u.uRes, w, h);
    g.uniform1f(u.uTiempo, tiempo);
    g.uniform1f(u.uExpo, op.expo ?? 1);
    g.uniform1f(u.uFuerza, op.fuerza ?? 1);
  }, w, h);
  return lienzo!;
};
