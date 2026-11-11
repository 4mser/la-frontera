// «Deleite» part 2b: spider webs and chaos. Everything is a pure function of its arguments (seeded randomness).
//   telarana()      an orb web: irregular radials, then the capture spiral laid by a point of light, dew on the threads;
//                   a smaller web woven inside one of its cells, and another inside that one
//   lorenz()        three trajectories of the Lorenz system that start 10⁻⁵ apart and drift into different lives
//   bifurcacion()   the logistic map's bifurcation diagram, with a camera that dives into the period-3 window
//   henon()         the Hénon attractor as a density image, with a camera that dives into its layered bands
type Ctx = CanvasRenderingContext2D;
type P = [number, number];
const TAU = Math.PI * 2;
const azar = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

const brillo = (ctx: Ctx, col: string, w: number, a: number) => {
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(${col},${0.08 * a})`; ctx.lineWidth = w * 6; ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(${col},${0.85 * a})`; ctx.lineWidth = w; ctx.stroke();
  ctx.restore();
};
const luz = (ctx: Ctx, x: number, y: number, r: number, a: number, col = "255,240,220") => {
  if (a <= 0.01 || r < 0.5) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.3, `rgba(${col},${0.5 * a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
};

// ─── the web ─────────────────────────────────────────────────────────────────────────────────────────────────────
// one web of radius R at (cx, cy): «radios» 0..1 lays the radials, «espiral» 0..1 the capture spiral; «sem» varies it
export const NR = 26;
const webGeo = (sem: number) => {
  const ang: number[] = [], largo: number[] = [];
  for (let i = 0; i < NR; i++) { ang.push((i / NR) * TAU + 0.09 * (azar(sem * 13 + i) - 0.5)); largo.push(0.82 + 0.18 * azar(sem * 7 + i * 3)); }
  return { ang, largo };
};
// the spiral point at radial i, turn j (from the outside in), for a web of radius 1
const VUELTAS = 15;
const espiralR = (j: number, i: number, largo: number[]) => { const u = (j + i / NR) / VUELTAS; return Math.min(largo[i], 1) * (0.95 - 0.8 * u); };
export const telarana = (ctx: Ctx, cx: number, cy: number, R: number, radios: number, espiral: number, t: number, sem: number, a: number) => {
  if (a <= 0.01 || R < 2) return;
  const { ang, largo } = webGeo(sem);
  const col = "225,232,245";
  // the frame threads, then the radials one after another
  ctx.beginPath();
  const nr = radios * NR;
  for (let i = 0; i < NR; i++) {
    const u = Math.min(1, Math.max(0, nr - i));
    if (u <= 0) continue;
    const L = R * largo[i] * 1.12 * u;
    ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang[i]) * L, cy + Math.sin(ang[i]) * L);
  }
  brillo(ctx, col, Math.min(1.6, Math.max(0.6, R / 700)), a * 0.8);
  // the capture spiral, laid from the outside in by a point of light
  const total = VUELTAS * NR, n = Math.floor(espiral * total);
  if (n > 1) {
    ctx.beginPath();
    let px = 0, py = 0;
    for (let s = 0; s <= n; s++) {
      const j = Math.floor(s / NR), i = s % NR;
      const r = R * espiralR(j, i, largo);
      // the thread sags a little between radials (a catenary hint)
      px = cx + Math.cos(ang[i]) * r; py = cy + Math.sin(ang[i]) * r;
      if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    brillo(ctx, col, Math.min(1.4, Math.max(0.5, R / 900)), a);
    // dew: drops that catch the light, one every few crossings, twinkling slowly
    for (let s = 3; s < n; s += 5) {
      const j = Math.floor(s / NR), i = s % NR, r = R * espiralR(j, i, largo);
      const tw = 0.5 + 0.5 * Math.sin(t * 2.2 + s * 1.7);
      luz(ctx, cx + Math.cos(ang[i] + 0.06) * r, cy + Math.sin(ang[i] + 0.06) * r, Math.min(9, Math.max(1.5, R / 160)) * (0.7 + 0.6 * tw), a * (0.35 + 0.5 * tw));
    }
    if (espiral < 1) luz(ctx, px, py, Math.min(40, Math.max(6, R / 30)), a);
  }
};
// the cell of a web where its child web lives (between two radials, a third of the way in), in units of R
export const celdaHija = (sem: number): P => {
  const { ang } = webGeo(sem);
  const i = 5, r = 0.55;
  const am = (ang[i] + ang[i + 1]) / 2;
  return [Math.cos(am) * r, Math.sin(am) * r];
};

// ─── Lorenz ─────────────────────────────────────────────────────────────────────────────────────────────────────
const lorenzTray = (() => {
  const cache = new Map<number, number[]>();
  return (k: number) => {
    if (cache.has(k)) return cache.get(k)!;
    let x = 1 + k * 1e-5, y = 1, z = 1;
    const h = 0.004, out: number[] = [];
    const f = (x: number, y: number, z: number): [number, number, number] => [10 * (y - x), x * (28 - z) - y, x * y - (8 / 3) * z];
    for (let n = 0; n < 9000; n++) {
      const [a1, b1, c1] = f(x, y, z), [a2, b2, c2] = f(x + (h / 2) * a1, y + (h / 2) * b1, z + (h / 2) * c1);
      const [a3, b3, c3] = f(x + (h / 2) * a2, y + (h / 2) * b2, z + (h / 2) * c2), [a4, b4, c4] = f(x + h * a3, y + h * b3, z + h * c3);
      x += (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4); y += (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4); z += (h / 6) * (c1 + 2 * c2 + 2 * c3 + c4);
      out.push(x, z);
    }
    cache.set(k, out);
    return out;
  };
})();
export const lorenz = (ctx: Ctx, W: number, H: number, u: number, a: number) => {
  const cols = ["255,236,210", "255,120,200", "120,220,255"];
  const s = H / 58, ox = W / 2, oy = H * 0.94;
  const n = Math.floor(u * 9000);
  for (let k = 0; k < 3; k++) {
    const tr = lorenzTray(k);
    ctx.beginPath();
    const ini = Math.max(0, n - 2600);
    for (let i = ini; i < n; i++) { const x = ox + tr[2 * i] * s * 1.6, y = oy - tr[2 * i + 1] * s; if (i === ini) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    brillo(ctx, cols[k], 1.6, a * 0.9);
    if (n > 0) luz(ctx, ox + tr[2 * (n - 1)] * s * 1.6, oy - tr[2 * (n - 1) + 1] * s, 18, a, cols[k]);
  }
};

// ─── density images (bifurcation, Hénon) ───────────────────────────────────────────────────────────────────────
let lienzo: HTMLCanvasElement | null = null;
let hist: Float32Array | null = null;
const imagen = (w: number, h: number, llena: (sumar: (x: number, y: number) => void) => void, col: [number, number, number], gan = 1) => {
  if (!lienzo) lienzo = document.createElement("canvas");
  if (lienzo.width !== w || lienzo.height !== h) { lienzo.width = w; lienzo.height = h; }
  if (!hist || hist.length !== w * h) hist = new Float32Array(w * h);
  hist.fill(0);
  let mx = 1;
  llena((x, y) => { const xi = x | 0, yi = y | 0; if (xi < 0 || yi < 0 || xi >= w || yi >= h) return; const v = ++hist![yi * w + xi]; if (v > mx) mx = v; });
  const c = lienzo.getContext("2d")!, img = c.createImageData(w, h), d = img.data, lm = Math.log(1 + mx);
  for (let i = 0; i < w * h; i++) {
    const v = hist[i]; d[4 * i + 3] = 255;
    if (v <= 0) continue;
    const q = Math.min(1, (Math.log(1 + v) / lm) * gan), l = Math.pow(q, 0.55), b = Math.max(0, q - 0.7) * 2.5;
    d[4 * i] = Math.min(255, col[0] * l + 255 * b); d[4 * i + 1] = Math.min(255, col[1] * l + 255 * b); d[4 * i + 2] = Math.min(255, col[2] * l + 255 * b);
  }
  c.putImageData(img, 0, 0);
  return lienzo;
};
// r from r0 to r1 across the width, x from x0 to x1 up the height; «barre» 0..1 reveals the columns left to right
export const bifurcacion = (w: number, h: number, r0: number, r1: number, x0: number, x1: number, barre: number) =>
  imagen(w, h, (sumar) => {
    const cols = Math.floor(w * barre);
    for (let c = 0; c < cols; c++) {
      const r = r0 + ((r1 - r0) * (c + 0.5)) / w;
      let x = 0.5;
      for (let i = 0; i < 400; i++) x = r * x * (1 - x);
      for (let i = 0; i < 700; i++) { x = r * x * (1 - x); sumar(c, h - ((x - x0) / (x1 - x0)) * h); }
    }
  }, [255, 214, 160], 1.7);
// the Hénon map x' = 1 − a x² + y, y' = b x, framed on [cx ± ancho/2] × [cy ± alto/2]
export const henon = (w: number, h: number, cx: number, cy: number, ancho: number, puntos: number) =>
  imagen(w, h, (sumar) => {
    let x = 0.1, y = 0.1;
    const alto = (ancho * h) / w;
    for (let i = 0; i < puntos; i++) {
      const nx = 1 - 1.4 * x * x + y; y = 0.3 * x; x = nx;
      if (i > 50) sumar(((x - cx) / ancho + 0.5) * w, (0.5 - (y - cy) / alto) * h);
    }
  }, [150, 200, 255], 1.9);
