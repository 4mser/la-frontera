// «Deleite» part 2: nature. L-system plants that grow and sway, Vogel's phyllotaxis (the sunflower's golden angle),
// and real photographs (the film's licensed nature photos) with a slow push.
type Ctx = CanvasRenderingContext2D;

// ─── L-systems ──────────────────────────────────────────────────────────────────────────────────────────────────
type Planta = { axioma: string; reglas: Record<string, string>; ang: number; its: number };
export const PLANTAS: Planta[] = [
  { axioma: "X", reglas: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" }, ang: 25, its: 6 },          // the fractal plant
  { axioma: "F", reglas: { F: "FF-[-F+F+F]+[+F-F-F]" }, ang: 22.5, its: 4 },                // a bush
  { axioma: "F", reglas: { F: "F[+F]F[-F][F]" }, ang: 20, its: 5 },                          // a weed
  { axioma: "X", reglas: { X: "F[+X][-X]FX", F: "FF" }, ang: 25.7, its: 7 },                // a tall tree
];
type Prep = { s: string; maxD: number; caja: [number, number, number, number] };
const cache = new Map<number, Prep>();
const preparar = (k: number): Prep => {
  if (cache.has(k)) return cache.get(k)!;
  const p = PLANTAS[k];
  let s = p.axioma;
  for (let i = 0; i < p.its; i++) s = s.split("").map((c) => p.reglas[c] ?? c).join("");
  // one pass at rest: the longest distance from the root and the bounding box (step 1, root at 0,0, growing up)
  let x = 0, y = 0, a = -Math.PI / 2, d = 0, maxD = 0;
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
  const pila: [number, number, number, number][] = [];
  const da = (p.ang * Math.PI) / 180;
  for (const c of s) {
    if (c === "F") { x += Math.cos(a); y += Math.sin(a); d++; if (d > maxD) maxD = d; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    else if (c === "+") a += da; else if (c === "-") a -= da;
    else if (c === "[") pila.push([x, y, a, d]); else if (c === "]") [x, y, a, d] = pila.pop()!;
  }
  const r = { s, maxD, caja: [x0, x1, y0, y1] as [number, number, number, number] };
  cache.set(k, r);
  return r;
};
// draws plant k with its root at (rx, ry), «alto» pixels tall at full growth; «crece» 0..1; the wind bends every
// branch a little more the further it is from the root
export const planta = (ctx: Ctx, k: number, rx: number, ry: number, alto: number, crece: number, t: number, col: string, a: number, fase = 0) => {
  if (a <= 0.01 || crece <= 0) return;
  const p = PLANTAS[k], pr = preparar(k);
  const esc = alto / (pr.caja[3] - pr.caja[2]);
  const da = (p.ang * Math.PI) / 180;
  const lim = crece * pr.maxD;
  let x = rx, y = ry, ang = -Math.PI / 2, d = 0, prof = 0;
  const pila: [number, number, number, number, number][] = [];
  const caminos: Path2D[] = [new Path2D(), new Path2D(), new Path2D()];
  for (const c of pr.s) {
    if (c === "F") {
      // the wind: a small turn at every step, so the bend accumulates toward the tips
      ang += (0.0011 * Math.sin(t * 1.3 + fase + d * 0.015) + 0.0005 * Math.sin(t * 2.9 + fase * 2)) * (1 + prof * 0.35);
      const aa = ang;
      if (d < lim) {
        const u = Math.min(1, lim - d);
        const nx = x + Math.cos(aa) * esc * u, ny = y + Math.sin(aa) * esc * u;
        const cam = caminos[prof < 2 ? 0 : prof < 4 ? 1 : 2];
        cam.moveTo(x, y); cam.lineTo(nx, ny);
      }
      x += Math.cos(aa) * esc; y += Math.sin(aa) * esc; d++;
    } else if (c === "+") ang += da; else if (c === "-") ang -= da;
    else if (c === "[") { pila.push([x, y, ang, d, prof]); prof++; } else if (c === "]") [x, y, ang, d, prof] = pila.pop()!;
  }
  ctx.save(); ctx.lineCap = "round";
  const anchos = [3.2, 1.8, 1.0];
  caminos.forEach((cam, i) => {
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(${col},${0.08 * a})`; ctx.lineWidth = anchos[i] * 5; ctx.stroke(cam);
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = `rgba(${col},${0.9 * a})`; ctx.lineWidth = anchos[i]; ctx.stroke(cam);
  });
  ctx.restore();
};

// ─── phyllotaxis (Vogel, 1979): point n at radius c√n and angle n·137,508° ──────────────────────────────────────
const AUREO = (137.50776 * Math.PI) / 180;
export const filotaxis = (ctx: Ctx, cx: number, cy: number, R: number, n: number, giro: number, t: number, colorDe: (u: number, a: number) => string) => {
  const N = Math.floor(n), c = R / Math.sqrt(Math.max(N, 1));
  for (let i = N; i >= 1; i--) {
    const r = c * Math.sqrt(i), th = i * AUREO + giro;
    const x = cx + r * Math.cos(th), y = cy + r * Math.sin(th);
    const nace = Math.min(1, (n - i) / 30);
    const rad = c * 0.48 * (0.4 + 0.6 * nace);
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = colorDe(((i * 0.618034) % 1) * 0.25 + 0.5 * Math.sqrt(i / N) + 0.03 * t, 0.92 * nace);
    ctx.fill();
  }
};

// ─── photographs: cover the rectangle, slow push toward a point ────────────────────────────────────────────────
export const foto = (ctx: Ctx, img: HTMLImageElement | undefined, x: number, y: number, w: number, h: number, zoom: number, fx = 0.5, fy = 0.5, a = 1) => {
  if (!img || a <= 0.01) return;
  const s = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * s, dh = img.height * s;
  const ox = x + (w - dw) * fx, oy = y + (h - dh) * fy;
  ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.imageSmoothingQuality = "high"; ctx.filter = "contrast(1.05) saturate(0.92) brightness(0.92)";
  ctx.drawImage(img, ox, oy, dw, dh); ctx.restore();
};
