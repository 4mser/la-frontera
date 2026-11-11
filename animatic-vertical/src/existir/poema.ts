// Cierre sin voz: las frases son parte de la imagen (motion graphics), cada una con un gesto propio de su plano.
// · luces:   las letras se forman con puntos de luz que suben desde las ciudades y siguen la curva del horizonte
// · aurora:  las palabras se encienden como cortinas de aurora (rayos verticales verdes que ondulan) y quedan crema
// · contraluz: la palabra queda recortada contra el sol, con rayos que salen del sol a través de las letras
// · barrido: la luz del amanecer avanza desde el sol y va revelando las palabras, con un borde brillante
// Todo es función pura del tiempo local de cada frase.
type Ctx = CanvasRenderingContext2D;
const SERIF = "'STIX Two Text', 'Times New Roman', serif";
const CREMA = "255,244,222";

const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pr = (t: number, a: number, d: number) => cl((t - a) / d);
const eS = (x: number) => x * x * (3 - 2 * x);
const eIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const hash = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

export type Frase = { texto: string; tam: number; y: number; ancho?: number; arco?: number };

// ── la frase rasterizada (una vez): líneas centradas, opcionalmente sobre un arco ────────────────────────────────
const cache = new Map<string, { c: HTMLCanvasElement; lineas: { y: number; x0: number; x1: number }[] }>();
const mascara = (W: number, H: number, F: Frase) => {
  const k = `${F.texto}|${F.tam}|${F.y}|${F.arco ?? 0}`;
  const hit = cache.get(k); if (hit) return hit;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d")!;
  x.font = `italic 400 ${F.tam}px ${SERIF}`; x.textBaseline = "middle"; x.fillStyle = "#fff";
  const lin: string[] = [""];
  for (const p of F.texto.split(" ")) { const s = lin[lin.length - 1] ? lin[lin.length - 1] + " " + p : p; if (x.measureText(s).width > (F.ancho ?? 860) && lin[lin.length - 1]) lin.push(p); else lin[lin.length - 1] = s; }
  const paso = F.tam * 1.42, y0 = F.y - ((lin.length - 1) * paso) / 2;
  const lineas: { y: number; x0: number; x1: number }[] = [];
  lin.forEach((ln, i) => {
    const y = y0 + i * paso, w = x.measureText(ln).width;
    lineas.push({ y, x0: W / 2 - w / 2, x1: W / 2 + w / 2 });
    if (!F.arco) { x.textAlign = "center"; x.fillText(ln, W / 2, y); return; }
    // sobre un arco de radio F.arco con centro abajo: cada letra rota con la curva del horizonte
    x.textAlign = "left";
    let s = -w / 2;
    for (const ch of ln) {
      const cw = x.measureText(ch).width, a = (s + cw / 2) / F.arco;
      x.save(); x.translate(W / 2 + Math.sin(a) * F.arco, y + F.arco - Math.cos(a) * F.arco); x.rotate(a);
      x.fillText(ch, -cw / 2, 0); x.restore();
      s += cw;
    }
  });
  const r = { c, lineas };
  cache.set(k, r);
  return r;
};

// texto teñido: la máscara rellena de un color, con resplandor
const tenido = (W: number, H: number, m: HTMLCanvasElement, rgb: string, cap: HTMLCanvasElement) => {
  const x = cap.getContext("2d")!;
  x.globalCompositeOperation = "source-over"; x.clearRect(0, 0, W, H);
  x.drawImage(m, 0, 0);
  x.globalCompositeOperation = "source-in"; x.fillStyle = `rgb(${rgb})`; x.fillRect(0, 0, W, H);
  return cap;
};
let capA: HTMLCanvasElement | null = null, capB: HTMLCanvasElement | null = null;
const capas = (W: number, H: number) => {
  if (!capA) { capA = document.createElement("canvas"); capA.width = W; capA.height = H; capB = document.createElement("canvas"); capB.width = W; capB.height = H; }
  return [capA, capB!] as const;
};

// ══ 1 · luces de las ciudades que suben y forman la frase sobre la curva del horizonte ════════════════════════════
const puntos = new Map<string, Float32Array>();
const muestras = (W: number, H: number, F: Frase) => {
  const k = F.texto; const hit = puntos.get(k); if (hit) return hit;
  const { c } = mascara(W, H, F);
  const d = c.getContext("2d")!.getImageData(0, 0, W, H).data;
  const out: number[] = [];
  for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (d[(y * W + x) * 4 + 3] > 140) out.push(x, y);
  const a = new Float32Array(out); puntos.set(k, a); return a;
};
export const fraseLuces = (ctx: Ctx, W: number, H: number, F: Frase, l: number, sale: number) => {
  const P = muestras(W, H, F);
  const n = P.length / 2;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) {
    const tx = P[2 * i], ty = P[2 * i + 1];
    // cada luz nace en la mitad de abajo (las ciudades) y sube con su propio retraso
    const ox = W * (0.05 + 0.9 * hash(i * 1.7)), oy = H * (0.62 + 0.33 * hash(i * 3.1));
    const x = eIO(pr(l, 0.1 + 0.9 * hash(i * 5.3) + ((tx - W / 2) / W) * 0.4, 1.4));
    if (x <= 0) continue;
    const px = ox + (tx - ox) * x, py = oy + (ty - oy) * x - Math.sin(x * Math.PI) * 60 * hash(i * 7.9);
    const a = (0.35 + 0.5 * x) * sale * (1 - 0.6 * eS(pr(l, 2.0, 0.8)));
    ctx.fillStyle = `rgba(255,${200 + Math.round(40 * x)},${140 + Math.round(80 * x)},${a})`;
    const s = 2.6 - 0.8 * x;
    ctx.fillRect(px - s / 2, py - s / 2, s, s);
  }
  ctx.restore();
  // al llegar, las luces se vuelven letra nítida con un resplandor cálido
  const nit = eS(pr(l, 1.6, 0.9)) * sale;
  if (nit > 0) {
    const [a] = capas(W, H);
    const m = tenido(W, H, mascara(W, H, F).c, CREMA, a);
    ctx.save(); ctx.globalAlpha = nit; ctx.shadowColor = "rgba(255,200,140,0.8)"; ctx.shadowBlur = 22; ctx.drawImage(m, 0, 0); ctx.restore();
  }
};

// ══ 2 · cortinas de aurora: rayos verticales que se encienden y ondulan hasta volverse texto ══════════════════════
export const fraseAurora = (ctx: Ctx, W: number, H: number, F: Frase, l: number, sale: number) => {
  const M = mascara(W, H, F);
  const [a, b] = capas(W, H);
  // la cortina: franjas verticales cuya luz sube con el tiempo, cada línea de texto un poco después que la anterior
  const cx = b.getContext("2d")!;
  cx.globalCompositeOperation = "source-over"; cx.clearRect(0, 0, W, H);
  M.lineas.forEach((ln, i) => {
    const t0 = 0.2 + i * 0.9;
    for (let x = Math.floor(ln.x0) - 10; x < ln.x1 + 10; x += 3) {
      const r = hash(x * 0.37 + i * 11), onda = Math.sin(x * 0.021 + l * 1.7 + i) * 0.5 + 0.5;
      const v = eS(pr(l, t0 + r * 0.9 + onda * 0.3, 0.9));
      if (v <= 0) continue;
      const g = cx.createLinearGradient(0, ln.y - F.tam, 0, ln.y + F.tam * 0.7);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.45, `rgba(255,255,255,${v})`); g.addColorStop(1, `rgba(255,255,255,${v * 0.9})`);
      cx.fillStyle = g; cx.fillRect(x, ln.y - F.tam, 3, F.tam * 1.7);
    }
  });
  cx.globalCompositeOperation = "destination-in"; cx.drawImage(M.c, 0, 0);
  // color: verde aurora al encenderse, crema al asentarse
  const asienta = eS(pr(l, 2.6, 1.6));
  const verde = tenido(W, H, b, "150,255,190", a);
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = (1 - asienta) * sale; ctx.shadowColor = "rgba(90,255,160,0.9)"; ctx.shadowBlur = 26; ctx.drawImage(verde, 0, 0); ctx.restore();
  const crema = tenido(W, H, b, CREMA, a);
  ctx.save(); ctx.globalAlpha = asienta * sale; ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = 18; ctx.drawImage(crema, 0, 0); ctx.restore();
  // los rayos que suben más allá de las letras (la cortina), muy tenues
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  M.lineas.forEach((ln, i) => {
    for (let x = Math.floor(ln.x0); x < ln.x1; x += 9) {
      const r = hash(x * 0.91 + i * 3), v = eS(pr(l, 0.2 + i * 0.9 + r * 0.9, 0.9)) * (1 - eS(pr(l, 2.4 + i * 0.6, 1.4)));
      if (v <= 0) continue;
      const g = ctx.createLinearGradient(0, ln.y - F.tam * 3.2, 0, ln.y);
      g.addColorStop(0, "rgba(120,255,170,0)"); g.addColorStop(1, `rgba(120,255,170,${0.16 * v * sale})`);
      ctx.fillStyle = g; ctx.fillRect(x, ln.y - F.tam * 3.2, 2, F.tam * 3.2);
    }
  });
  ctx.restore();
};

// ══ 3 · a contraluz: la palabra recortada contra el sol, con rayos que salen del sol a través de ella ═══════════════
export const fraseContraluz = (ctx: Ctx, W: number, H: number, F: Frase, l: number, sale: number, sol: [number, number]) => {
  const M = mascara(W, H, F);
  const [a] = capas(W, H);
  const x = eS(pr(l, 0.1, 1.0)) * sale;
  if (x <= 0) return;
  // rayos: copias de la palabra cada vez más grandes desde el sol (desenfoque radial), cálidas, que suman luz
  const luz = tenido(W, H, M.c, "255,214,150", a);
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 1; i <= 16; i++) {
    const s = 1 + i * 0.035 * (0.6 + 0.4 * eS(pr(l, 0.3, 1.6)));
    ctx.globalAlpha = 0.11 * x * (1 - i / 17);
    ctx.setTransform(s, 0, 0, s, sol[0] * (1 - s), sol[1] * (1 - s));
    ctx.drawImage(luz, 0, 0);
  }
  ctx.restore();
  // la palabra encendida por el sol: crema cálida con resplandor dorado
  const crema = tenido(W, H, M.c, "255,236,205", a);
  ctx.save(); ctx.globalAlpha = x; ctx.shadowColor = "rgba(255,180,100,0.95)"; ctx.shadowBlur = 30; ctx.drawImage(crema, 0, 0); ctx.restore();
};

// ══ 4 · barrido del amanecer: la luz avanza desde el sol y revela las palabras, con un borde brillante ═══════════════
export const fraseBarrido = (ctx: Ctx, W: number, H: number, F: Frase, l: number, sale: number, sol: [number, number]) => {
  const M = mascara(W, H, F);
  const [a, b] = capas(W, H);
  const R = 40 + 1100 * eIO(pr(l, 0.2, 4.2));
  // máscara radial desde el sol
  const cb = b.getContext("2d")!;
  cb.globalCompositeOperation = "source-over"; cb.clearRect(0, 0, W, H);
  const g = cb.createRadialGradient(sol[0], sol[1], Math.max(1, R - 120), sol[0], sol[1], R);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(1, "rgba(255,255,255,0)");
  cb.fillStyle = g; cb.fillRect(0, 0, W, H);
  cb.globalCompositeOperation = "destination-in"; cb.drawImage(M.c, 0, 0);
  const crema = tenido(W, H, b, CREMA, a);
  ctx.save(); ctx.globalAlpha = sale; ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 18; ctx.drawImage(crema, 0, 0); ctx.restore();
  // el borde de la luz: un anillo dorado que enciende las letras al pasar
  cb.globalCompositeOperation = "source-over"; cb.clearRect(0, 0, W, H);
  const g2 = cb.createRadialGradient(sol[0], sol[1], Math.max(1, R - 150), sol[0], sol[1], R);
  g2.addColorStop(0, "rgba(255,255,255,0)"); g2.addColorStop(0.75, "rgba(255,255,255,1)"); g2.addColorStop(1, "rgba(255,255,255,0)");
  cb.fillStyle = g2; cb.fillRect(0, 0, W, H);
  cb.globalCompositeOperation = "destination-in"; cb.drawImage(M.c, 0, 0);
  const oro = tenido(W, H, b, "255,206,130", a);
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = sale * (1 - eS(pr(l, 4.0, 1.0))); ctx.shadowColor = "rgba(255,190,110,1)"; ctx.shadowBlur = 24; ctx.drawImage(oro, 0, 0); ctx.restore();
};
