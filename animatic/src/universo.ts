// A universe out of a point: the Zel'dovich approximation in 2D. Particles start on a uniform grid; a Gaussian random
// field of tiny differences gives each one a displacement s(q) = −∇ψ(q), and gravity makes it grow: x = q + D·s(q).
// As D grows the particles crowd into sheets and filaments around empty voids (an illustration of how structure
// grows from small fluctuations, not a cosmological simulation). The field is made once, with a fixed seed.

const N = 256;                 // field grid (FFT size)
const NP = 720;                // particles per side
const RED = 3;                 // the density is made at 1/3 of the size and scaled up smoothly

// in-place radix-2 FFT on (re, im), length n, stride 1
const fft = (re: Float64Array, im: Float64Array, inv: boolean) => {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inv ? 2 : -2) * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
};
const fft2 = (re: Float64Array, im: Float64Array, inv: boolean) => {
  const r = new Float64Array(N), i = new Float64Array(N);
  for (let y = 0; y < N; y++) { for (let x = 0; x < N; x++) { r[x] = re[y * N + x]; i[x] = im[y * N + x]; } fft(r, i, inv); for (let x = 0; x < N; x++) { re[y * N + x] = r[x]; im[y * N + x] = i[x]; } }
  for (let x = 0; x < N; x++) { for (let y = 0; y < N; y++) { r[y] = re[y * N + x]; i[y] = im[y * N + x]; } fft(r, i, inv); for (let y = 0; y < N; y++) { re[y * N + x] = r[y]; im[y * N + x] = i[y]; } }
};

let CAMPO: { sx: Float32Array; sy: Float32Array; jx: Float32Array; jy: Float32Array } | null = null;
// the displacement of every particle (in units of the box), normalised so shell crossing starts near D = 0.35
const campo = () => {
  if (CAMPO) return CAMPO;
  let sem = 20261023;
  const azar = () => { sem = (Math.imul(sem, 1664525) + 1013904223) | 0; return ((sem >>> 0) + 0.5) / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(azar())) * Math.cos(2 * Math.PI * azar());
  const xr = new Float64Array(N * N), xi = new Float64Array(N * N), yr = new Float64Array(N * N), yi = new Float64Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const kx = i <= N / 2 ? i : i - N, ky = j <= N / 2 ? j : j - N, k2 = kx * kx + ky * ky;
    if (k2 === 0) continue;
    const k = Math.sqrt(k2);
    // a power spectrum P(k) ∝ k^−1.5 with a soft cut at small scales: structure on every scale, like a web
    const amp = Math.pow(k, -0.75) * Math.exp(-k2 / (2 * 38 * 38));
    const dr = gauss() * amp, di = gauss() * amp;
    // s_k = i·k/k²·δ_k
    xr[j * N + i] = (-kx / k2) * di; xi[j * N + i] = (kx / k2) * dr;
    yr[j * N + i] = (-ky / k2) * di; yi[j * N + i] = (ky / k2) * dr;
  }
  fft2(xr, xi, true); fft2(yr, yi, true);
  // normalise by the largest compression, so the first caustics appear at D ≈ 0.35
  let maxDiv = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const d = -(xr[j * N + ((i + 1) % N)] - xr[j * N + i] + yr[((j + 1) % N) * N + i] - yr[j * N + i]) * N;
    maxDiv = Math.max(maxDiv, d);
  }
  const esc = 1 / (0.35 * maxDiv * 0.5);
  const sx = new Float32Array(NP * NP), sy = new Float32Array(NP * NP), jx = new Float32Array(NP * NP), jy = new Float32Array(NP * NP);
  for (let b = 0; b < NP; b++) for (let a = 0; a < NP; a++) {
    // bilinear sample of the field at the particle's grid place
    const u = (a / NP) * N, v = (b / NP) * N, i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0;
    const at = (f: Float64Array, i: number, j: number) => f[(j % N) * N + (i % N)];
    const bil = (f: Float64Array) => (1 - fv) * ((1 - fu) * at(f, i0, j0) + fu * at(f, i0 + 1, j0)) + fv * ((1 - fu) * at(f, i0, j0 + 1) + fu * at(f, i0 + 1, j0 + 1));
    sx[b * NP + a] = bil(xr) * esc; sy[b * NP + a] = bil(yr) * esc;
    // each particle starts a little off its grid place, so no lattice shows
    jx[b * NP + a] = (azar() - 0.5) / NP; jy[b * NP + a] = (azar() - 0.5) / NP;
  }
  CAMPO = { sx, sy, jx, jy };
  return CAMPO;
};

// a colour map from density: deep violet, blue, cream, a little gold where it is densest
const COL: [number, number, number, number][] = [[0, 2, 3, 8], [0.18, 40, 22, 90], [0.4, 70, 110, 220], [0.65, 210, 220, 255], [0.85, 255, 236, 200], [1, 255, 196, 120]];
const colorDe = (u: number): [number, number, number] => {
  for (let i = 0; i < COL.length - 1; i++) if (u <= COL[i + 1][0]) {
    const f = (u - COL[i][0]) / (COL[i + 1][0] - COL[i][0]);
    return [COL[i][1] + f * (COL[i + 1][1] - COL[i][1]), COL[i][2] + f * (COL[i + 1][2] - COL[i][2]), COL[i][3] + f * (COL[i + 1][3] - COL[i][3])];
  }
  return [COL[COL.length - 1][1], COL[COL.length - 1][2], COL[COL.length - 1][3]];
};

let lienzo: HTMLCanvasElement | null = null;
let dens: Float32Array | null = null;
let grande: HTMLCanvasElement | null = null;
// the particles at growth D, the whole box scaled to «lado» px around (cx, cy); alfa fades it in
// calor: > 0 right after the point opens (hot, bright), 0 once it has cooled
export const pintarUniverso = (w: number, h: number, D: number, lado: number, alfa: number, calor = 0) => {
  const { sx, sy, jx, jy } = campo();
  const W0 = w, H0 = h;
  w = Math.round(w / RED); h = Math.round(h / RED); lado /= RED;
  if (!lienzo || lienzo.width !== w || lienzo.height !== h) { lienzo = document.createElement("canvas"); lienzo.width = w; lienzo.height = h; dens = new Float32Array(w * h); }
  const d = dens!;
  d.fill(0);
  const cx = w / 2, cy = h / 2;
  // each particle is splatted on its four nearest pixels
  for (let b = 0; b < NP; b++) for (let a = 0; a < NP; a++) {
    const k = b * NP + a;
    let qx = a / NP + jx[k] + D * sx[k], qy = b / NP + jy[k] + D * sy[k];
    qx -= Math.floor(qx); qy -= Math.floor(qy);
    const x = cx + (qx - 0.5) * lado, y = cy + (qy - 0.5) * lado;
    if (x < 0 || y < 0 || x >= w - 1 || y >= h - 1) continue;
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, p = j * w + i;
    d[p] += (1 - fx) * (1 - fy); d[p + 1] += fx * (1 - fy); d[p + w] += (1 - fx) * fy; d[p + w + 1] += fx * fy;
  }
  // a light blur (two box passes), so the density reads as matter, not as dots
  const tmp = new Float32Array(w * h);
  for (let pase = 0; pase < 1; pase++) {
    for (let y = 0; y < h; y++) for (let x = 1; x < w - 1; x++) { const p = y * w + x; tmp[p] = (d[p - 1] + d[p] + d[p + 1]) / 3; }
    for (let y = 1; y < h - 1; y++) for (let x = 0; x < w; x++) { const p = y * w + x; d[p] = (tmp[p - w] + tmp[p] + tmp[p + w]) / 3; }
  }
  // mean particles per pixel, so the colour means «denser than average» at any size
  const media = (NP * NP) / (lado * lado);
  const ctx = lienzo.getContext("2d")!;
  const img = ctx.createImageData(w, h), px = img.data;
  // the universe is round while it is small: a soft circular edge at half the box
  const R = 0.5 * lado, borde = 0.18 * lado;
  for (let p = 0; p < w * h; p++) {
    const x = (p % w) - cx, y = Math.floor(p / w) - cy;
    const f = alfa * Math.min(1, Math.max(0, (R - Math.hypot(x, y)) / borde));
    const u = Math.min(1, (Math.log1p(d[p] / media) / Math.log1p(24)) * (1 + calor) + 0.5 * calor);
    const [r, g, bb] = colorDe(u);
    px[4 * p] = r * f; px[4 * p + 1] = g * f; px[4 * p + 2] = bb * f; px[4 * p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  if (!grande || grande.width !== W0) { grande = document.createElement("canvas"); grande.width = W0; grande.height = H0; }
  const g = grande.getContext("2d")!;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.drawImage(lienzo, 0, 0, W0, H0);
  return grande;
};
