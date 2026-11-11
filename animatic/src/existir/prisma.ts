// «…algo que ni siquiera sabes explicar»: un haz de luz blanca atraviesa un prisma de vidrio y se abre en su espectro.
// Física real en 2D: prisma equilátero de BK7, índice de Cauchy n(λ) = 1,5046 + 4200/λ² (λ en nm), ley de Snell
// vectorial en cada cara; cada longitud de onda sale con su propio ángulo. El haz entra en el plano y la luz avanza.
type Ctx = CanvasRenderingContext2D;
type V = [number, number];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1];
const norm = (a: V): V => mul(a, 1 / Math.hypot(a[0], a[1]));
const n = (nm: number) => 1.5046 + 4200 / (nm * nm);

// refracción de d (unitario) en una cara de normal nrm (unitaria, contra d), de n1 a n2; null si hay reflexión total
const refracta = (d: V, nrm: V, n1: number, n2: number): V | null => {
  const r = n1 / n2, c = -dot(nrm, d), k = 1 - r * r * (1 - c * c);
  if (k < 0) return null;
  return norm(add(mul(d, r), mul(nrm, r * c - Math.sqrt(k))));
};
// intersección de rayo p + s·d con el segmento a–b
const corta = (p: V, d: V, a: V, b: V): { s: number; q: V } | null => {
  const e = sub(b, a), den = d[0] * e[1] - d[1] * e[0];
  if (Math.abs(den) < 1e-9) return null;
  const w = sub(a, p), s = (w[0] * e[1] - w[1] * e[0]) / den, u = (w[0] * d[1] - w[1] * d[0]) / den;
  return s > 1e-6 && u >= 0 && u <= 1 ? { s, q: add(p, mul(d, s)) } : null;
};
export const colorNm = (nm: number, a: number) => {
  // aproximación de Bruton, suavizada en los bordes
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else r = 1;
  const f = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 680 ? 0.3 + 0.7 * (720 - nm) / 40 : 1;
  return `rgba(${Math.round(255 * Math.pow(r * f, 0.8))},${Math.round(255 * Math.pow(g * f, 0.8))},${Math.round(255 * Math.pow(b * f, 0.8))},${a})`;
};

export const pintarPrisma = (ctx: Ctx, W: number, H: number, P: { avance: number; abre: number; giro: number; brillo: number }) => {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const c: V = [W * 0.36, H * 0.5], L = 460;
  const vert: V[] = [0, 1, 2].map((k) => {
    const a = -Math.PI / 2 + P.giro + (k * 2 * Math.PI) / 3;
    return [c[0] + (Math.cos(a) * L) / Math.sqrt(3), c[1] + (Math.sin(a) * L) / Math.sqrt(3)] as V;
  });
  const caras: [V, V][] = [[vert[0], vert[1]], [vert[1], vert[2]], [vert[2], vert[0]]];
  const normalFuera = (a: V, b: V): V => { const e = sub(b, a); const nn = norm([e[1], -e[0]]); return dot(nn, sub(a, c)) > 0 ? nn : mul(nn, -1); };
  // haz de entrada: desde la izquierda, subiendo un poco, apuntado a la cara izquierda
  const o: V = [-40, H * 0.66], d0 = norm(sub(add(vert[0], mul(sub(vert[2], vert[0]), 0.55)), o));
  const ent = caras.map(([a, b]) => corta(o, d0, a, b)).filter(Boolean).sort((x, y) => x!.s - y!.s)[0]!;
  const largoEnt = ent.s;
  const largoTotal = largoEnt + 520 + 1400;
  const cab = P.avance * largoTotal;                           // dónde va la cabeza de la luz
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
  const linea = (a: V, b: V, col: string, w: number) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
  // el haz blanco hasta el prisma
  const hasta = add(o, mul(d0, Math.min(cab, largoEnt)));
  for (const [w, a] of [[26, 0.04], [9, 0.12], [3, 0.85]] as [number, number][]) linea(o, hasta, `rgba(255,250,240,${a * P.brillo})`, w);
  // por longitud de onda: dentro del vidrio y la salida
  if (cab > largoEnt) {
    const nEnt = normalFuera(...caras.find(([a, b]) => corta(o, d0, a, b) && Math.abs(corta(o, d0, a, b)!.s - largoEnt) < 1e-3)!);
    let ref550: number | null = null;
    // primero 550 nm (el centro del abanico), después el resto
    const orden = [550, ...Array.from({ length: 101 }, (_, i) => 400 + i * 3)];
    for (const nm of orden) {
      const d1 = refracta(d0, nEnt, 1, n(nm)); if (!d1) continue;
      const sal = caras.map(([a, b]) => ({ h: corta(ent.q, d1, a, b), a, b })).filter((x) => x.h && x.h.s > 1).sort((x, y) => x.h!.s - y.h!.s)[0];
      if (!sal) continue;
      const enVidrio = Math.min(cab - largoEnt, sal.h!.s);
      const fin1 = add(ent.q, mul(d1, enVidrio));
      linea(ent.q, fin1, colorNm(nm, 0.05 * P.brillo), 6);
      if (cab - largoEnt > sal.h!.s) {
        const nS = normalFuera(sal.a, sal.b);
        const d2 = refracta(d1, mul(nS, -1), n(nm), 1); if (!d2) continue;
        // el abanico se abre algo más que lo físico para que se lea en el cuadro (abre ≥ 1)
        const ang = Math.atan2(d2[1], d2[0]);
        if (ref550 === null && nm >= 550) ref550 = ang;
        const a0 = ref550 ?? ang;
        const ab = a0 + (ang - a0) * (1 + 11 * P.abre);
        const base: V = [Math.cos(ab), Math.sin(ab)];
        const fuera = cab - largoEnt - sal.h!.s;
        const p2 = add(sal.h!.q, mul(base, Math.min(fuera, 1600)));
        const a = 0.3 * P.brillo * (0.25 + 0.75 * P.abre);
        linea(sal.h!.q, p2, colorNm(nm, a * 0.35), 20);
        linea(sal.h!.q, p2, colorNm(nm, a), 6);
      }
    }
  }
  ctx.restore();
  // el vidrio: caras con brillo y un leve relleno
  ctx.save();
  ctx.beginPath(); ctx.moveTo(...vert[0]); ctx.lineTo(...vert[1]); ctx.lineTo(...vert[2]); ctx.closePath();
  const gr = ctx.createLinearGradient(vert[0][0], vert[0][1], c[0], vert[1][1]);
  gr.addColorStop(0, "rgba(180,200,230,0.07)"); gr.addColorStop(1, "rgba(120,140,180,0.03)");
  ctx.fillStyle = gr; ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  for (const [w, a] of [[10, 0.04], [3, 0.12], [1.2, 0.55]] as [number, number][]) { ctx.strokeStyle = `rgba(220,232,255,${a * P.brillo})`; ctx.lineWidth = w; ctx.stroke(); }
  ctx.restore();
};
