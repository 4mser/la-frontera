// «Un parpadeo» (B&N Lectures, reel 9:16). Guion: un-parpadeo/GUION-DEFINITIVO.md.
// Todo es función pura de t. Lenguaje visual del acto I: instrumento científico dibujado con líneas finas crema y oro
// sobre negro, cifras en Plex Mono como lecturas del instrumento; nada fotográfico.
import K from "./parpadeo.json";
import VOZ from "./parpadeo_voz.json";
import { postProceso } from "../../../teaser-v1b/src/gl";
import { RGB, SANS, MONO, cl, eIO, eOut, eSuave, lerp, pr } from "./theme";

export const W = 1080, H = 1920;
type Ctx = CanvasRenderingContext2D;
const ORO = "236,190,112";
const RETRO = { bloom: 0.4, halo: 0.85, aberr: 0.034, vineta: 0.66, grano: 0.065, scan: 0.15, ruido: 0.45, grade: 1.75 };
const V = VOZ as unknown as { texto: string; fin: number; palabras: [string, number][] }[];
export const VOZ_T = K.voz;

// ── utilidades ────────────────────────────────────────────────────────────────────────────────────────────────
const txt = (ctx: Ctx, s: string, x: number, y: number, tam: number, a: number, op: { fam?: string; peso?: number; esp?: number; rgb?: string; al?: CanvasTextAlign } = {}) => {
  if (a <= 0) return;
  ctx.save();
  ctx.font = `${op.peso ?? 400} ${tam}px ${op.fam ?? MONO}`;
  ctx.textAlign = op.al ?? "center"; ctx.textBaseline = "middle";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${op.esp ?? 0}px`;
  ctx.shadowColor = `rgba(0,0,0,${0.85 * Math.min(1, a)})`; ctx.shadowBlur = 14;
  ctx.fillStyle = `rgba(${op.rgb ?? RGB.crema},${a})`;
  ctx.fillText(s, x, y);
  ctx.restore();
};
const brillo = (ctx: Ctx, x: number, y: number, r: number, a: number, rgb = "255,236,200") => {
  if (a <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.15, `rgba(${rgb},${a * 0.5})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
};
// miles con espacio fino, como en una lectura de instrumento: 9 192 631 770
const miles = (n: number) => Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const coma = (v: number, d: number) => v.toFixed(d).replace(".", ",");

// fondo de estrellas determinista (lento paralaje): da profundidad al instrumento sin competir con él
const ESTRELLAS = (() => { let q = 7; const r = () => { q = (q * 16807) % 2147483647; return q / 2147483647; };
  return Array.from({ length: 1400 }, () => ({ x: r(), y: r(), m: Math.pow(r(), 3), z: 0.3 + r() * 0.7, f: r() * 6.28 })); })();
const estrellas = (ctx: Ctx, t: number, a: number, dx = 0, dy = 0, zoom = 1) => {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (const e of ESTRELLAS) {
    const x = ((e.x * W + dx * e.z - W / 2) * zoom ** e.z + W / 2 + W * 4) % W, y = ((e.y * H + dy * e.z - H / 2) * zoom ** e.z + H / 2 + H * 4) % H;
    const tw = 0.75 + 0.25 * Math.sin(t * 2.2 + e.f);
    const al = a * (0.12 + 0.75 * e.m) * tw;
    ctx.fillStyle = `rgba(255,${240 - Math.round(40 * e.m)},${220 - Math.round(70 * e.m)},${al})`;
    const r = 0.6 + 1.8 * e.m; ctx.fillRect(x - r / 2, y - r / 2, r, r);
  }
  ctx.restore();
};
const destello = (ctx: Ctx, t: number, t0: number, fuerza = 1, dur = 0.35, rgb = "255,240,215") => {
  if (t < t0 || t > t0 + dur) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(${rgb},${fuerza * Math.exp(-((t - t0) / dur) * 4)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
};
// estela anamórfica: un trazo horizontal de luz, como el reflejo de un lente
const estela = (ctx: Ctx, x: number, y: number, largo: number, a: number) => {
  if (a <= 0) return;
  const g = ctx.createLinearGradient(x - largo, 0, x + largo, 0);
  g.addColorStop(0, "rgba(255,220,170,0)"); g.addColorStop(0.5, `rgba(255,236,205,${a})`); g.addColorStop(1, "rgba(255,220,170,0)");
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(x - largo, y - 1.5, 2 * largo, 3);
  ctx.globalAlpha = 0.35; ctx.fillRect(x - largo * 0.6, y - 5, 1.2 * largo, 10); ctx.restore();
};

// ── el parpadeo: dos párpados de negro con borde curvo; cierra rápido, abre más lento (0,2 s = 6 cuadros) ──────────
const parpadeo = (ctx: Ctx, c: number) => {
  if (c <= 0) return;
  if (c >= 0.999) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); return; }
  const m = H / 2;
  const borde = (y: number, s: number) => {         // borde del párpado: arco suave (más cerrado al centro)
    ctx.beginPath();
    ctx.moveTo(-10, s < 0 ? -10 : H + 10);
    ctx.lineTo(-10, y + s * 140 * (1 - c));
    ctx.quadraticCurveTo(W / 2, y - s * 120 * (1 - c), W + 10, y + s * 140 * (1 - c));
    ctx.lineTo(W + 10, s < 0 ? -10 : H + 10);
    ctx.closePath(); ctx.fill();
  };
  ctx.save(); ctx.fillStyle = "#000";
  ctx.shadowColor = "rgba(0,0,0,1)"; ctx.shadowBlur = 40;
  borde(lerp(-200, m, eIO(c)), -1);
  borde(lerp(H + 200, m, eIO(c)), 1);
  ctx.restore();
};

// ══ Apertura · la línea del año, la cuenta y el destello de una vida ════════════════════════════════════════════
const dib0 = (t: number) => eIO(pr(t, K.voz[0] + 0.2, 3.0));     // la línea se dibuja con «…en un solo año»
// el destello: intensidad en función del tiempo propio del destello (0 → 0,18 s): sube rápido y se apaga más lento
const curvaDestello = (x: number) => (x <= 0 || x >= 1 ? 0 : x < 0.25 ? eOut(x / 0.25) : Math.pow(1 - (x - 0.25) / 0.75, 1.6));
const fogonazo = (ctx: Ctx, x: number, y: number, I: number, techo = 1) => {
  if (I <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  ctx.restore();
  brillo(ctx, x, y, 160 + 520 * I * techo, Math.min(1, 0.9 * I), "255,236,200");
  brillo(ctx, x, y, 60 + 120 * I, 1, "255,250,240");
  estela(ctx, x, y, 200 + 900 * I, Math.min(1, 1.3 * I));
};
const apertura = (ctx: Ctx, t: number) => {
  const t0 = K.voz[0], y = 860, TD = K.destello, [s0, s1] = K.lento;
  const x0 = 90, x1 = W - 90;
  if (t < TD + 0.8) {
    // desde «menos que un parpadeo» la cámara se lanza al extremo de la línea: el final del año viene al centro
    const zz = eIO(pr(t, t0 + 4.4, TD - (t0 + 4.4) - 0.15));
    const Z = Math.pow(14, zz), fxz = lerp(W / 2, x1, Math.min(1, zz * 1.6));
    const sx = (x: number) => W / 2 + (x - fxz) * Z;
    const vela = t < TD ? 1 : 1 - eSuave(pr(t, TD, 0.6));
    estrellas(ctx, t, 0.5 * eSuave(pr(t, 0, 1.5)) * vela, -t * 6 - zz * 900, 0, 1 + 0.02 * t + zz * 0.6);
    const dib = dib0(t);
    ctx.save();
    ctx.globalAlpha = 1 - eSuave(pr(t, TD, 0.7));
    ctx.strokeStyle = `rgba(${RGB.crema},0.34)`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx(x0), y); ctx.lineTo(sx(lerp(x0, x1, dib)), y); ctx.stroke();
    for (let i = 0; i <= 12; i++) {
      const x = sx(lerp(x0, x1, i / 12)), a = eSuave(pr(dib, i / 12 - 0.02, 0.08));
      if (x < -20 || x > W + 20) continue;
      ctx.strokeStyle = `rgba(${RGB.crema},${0.3 * a})`;
      ctx.beginPath(); ctx.moveTo(x, y - (i % 12 === 0 ? 16 : 8)); ctx.lineTo(x, y + (i % 12 === 0 ? 16 : 8)); ctx.stroke();
    }
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 220; i++) {
      const v = 0.05 + ((i * 0.6180339) % 1) * 0.16, u = (i * 0.37 + t * v) % 1;
      if (u > dib) continue;
      const x = sx(lerp(x0, x1, u)), yy = y + Math.sin(i * 12.9898) * 2.5, largo = Math.min(220, 40 * v * 6 * Z);
      if (x < -largo || x > W + 10) continue;
      const g = ctx.createLinearGradient(x - largo, 0, x, 0);
      g.addColorStop(0, `rgba(${ORO},0)`); g.addColorStop(1, `rgba(255,232,190,${0.25 + 0.5 * u})`);
      ctx.fillStyle = g; ctx.fillRect(x - largo, yy - 0.9, largo, 1.8);
    }
    ctx.restore();
    if (t < TD) {
      const fueraZ = 1 - eSuave(pr(zz, 0, 0.25));
      const ra = eSuave(pr(t, t0 + 1.0, 1.0)) * fueraZ;
      txt(ctx, "1 ENE", x0, y + 52, 22, 0.55 * ra, { esp: 3 });
      txt(ctx, "31 DIC", x1, y + 52, 22, 0.55 * ra, { esp: 3 });
      txt(ctx, "1 AÑO  =  13 800 000 000 AÑOS", W / 2, y - 70, 24, 0.5 * eSuave(pr(t, t0 + 2.4, 1.0)) * fueraZ, { esp: 4 });
      const tv = t0 + 4.1, av = eSuave(pr(t, tv, 0.7));
      if (av > 0) {
        const ex = sx(x1);
        const late = 0;
        const pulso = 0.75 + 0.25 * Math.sin((t - tv) * Math.PI * 2);
        brillo(ctx, ex, y, 60 + 120 * zz + 80 * late, (0.55 + 0.4 * zz) * av * pulso + 0.5 * late, ORO);
        const aRot = av * (1 - eSuave(pr(t, TD - 0.1, 0.35)));
        ctx.save(); ctx.strokeStyle = `rgba(${ORO},${aRot})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(ex, y + 26); ctx.lineTo(ex, y + 120); ctx.lineTo(ex - 40, y + 150); ctx.stroke(); ctx.restore();
        txt(ctx, "0,18 s", ex - 52, y + 168, 34 + 10 * zz, aRot, { rgb: ORO, al: "right", peso: 500 });
        txt(ctx, "23:59:59,82 → 24:00:00", ex - 52, y + 218, 22, 0.6 * aRot, { al: "right", esp: 1 });
      }
    }
  }
  // el destello, a velocidad real: 0,18 s
  fogonazo(ctx, W / 2, y, curvaDestello((t - TD) / 0.18));
  // resplandor que queda en la retina
  if (t > TD + 0.18 && t < K.lento[0] + 0.6) brillo(ctx, W / 2, y, 300, 0.5 * Math.exp(-(t - TD - 0.18) * 2.5) * (1 - eSuave(pr(t, K.lento[0], 0.6))), ORO);
  // «0,18 s = una vida de 80 años»: entra a mitad de la repetición y se queda hasta el cronómetro
  {
    const aV = eSuave(pr(t, s0 + 1.6, 0.8)) * (1 - eSuave(pr(t, K.voz[1] - 0.2, 0.8)));
    txt(ctx, "0,18 s", W / 2, 1460, 54, aV, { rgb: ORO, peso: 500 });
    txt(ctx, "UNA VIDA DE 80 AÑOS", W / 2, 1530, 32, 0.9 * aV, { esp: 6 });
  }
  // la repetición en cámara lenta, con su regla de tiempo
  if (t >= s0 - 0.2 && t < s1 + 1.2) {
    const u = cl((t - s0) / (s1 - s0)), dentro = 1 - eSuave(pr(t, s1 + 0.05, 1.1));
    const ent = eSuave(pr(t, s0 - 0.35, 0.7)) * dentro;
    estrellas(ctx, t, 0.3 * ent, -t * 2, 0, 1);
    fogonazo(ctx, W / 2, y, eSuave(curvaDestello(u)) * dentro * eSuave(pr(t, s0 - 0.2, 0.9)), 0.45);
    txt(ctx, "REPETICIÓN  ·  CÁMARA LENTA ×20", W / 2, 330, 24, 0.7 * ent, { esp: 5 });
    const yr = 1200, ra0 = 140, ra1 = W - 140;
    ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.45 * ent})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ra0, yr); ctx.lineTo(ra1, yr); ctx.stroke();
    for (let i = 0; i <= 9; i++) { const x = lerp(ra0, ra1, i / 9); ctx.beginPath(); ctx.moveTo(x, yr - (i % 9 === 0 ? 18 : 9)); ctx.lineTo(x, yr + (i % 9 === 0 ? 18 : 9)); ctx.stroke(); }
    // la curva de intensidad del destello, dibujada hasta el cursor
    ctx.strokeStyle = `rgba(${ORO},${0.9 * ent})`; ctx.lineWidth = 2.2; ctx.beginPath();
    for (let i = 0; i <= 200 * u; i++) { const q = i / 200, x = lerp(ra0, ra1, q), yy = yr - 34 - 150 * curvaDestello(q); if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
    ctx.stroke(); ctx.restore();
    const xc = lerp(ra0, ra1, u);
    ctx.save(); ctx.strokeStyle = `rgba(255,240,215,${0.8 * ent})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xc, yr - 200); ctx.lineTo(xc, yr + 24); ctx.stroke(); ctx.restore();
    txt(ctx, "0,00 s", ra0, yr + 52, 22, 0.6 * ent, { esp: 1 });
    txt(ctx, "0,18 s", ra1, yr + 52, 22, 0.6 * ent, { esp: 1, rgb: ORO });
    txt(ctx, `t = ${coma(0.18 * u, 3)} s`, W / 2, yr + 110, 40, 0.95 * ent, { peso: 500 });

  }
};

// ══ I · un segundo: la Tierra de noche (GPU) y la luz que la rodea; las lecturas del instrumento encima ══════════
import { Cam, V3, pintarTierraNoche, proyectar } from "./parpadeo/tierra";
export type Medios = { noche?: HTMLImageElement; dia?: HTMLImageElement; nubes?: HTMLImageElement; logo?: HTMLImageElement; fosil?: HTMLImageElement; manos?: HTMLImageElement; tablilla?: HTMLImageElement; cumulo?: HTMLImageElement; vid?: Record<string, HTMLImageElement | undefined> };
const lerp3 = (a: V3, b: V3, x: number): V3 => [lerp(a[0], b[0], x), lerp(a[1], b[1], x), lerp(a[2], b[2], x)];
const RLUZ = 1.035;                                              // la órbita del pulso, justo sobre la atmósfera
const camaraLuz = (t: number): Cam => {
  const T1 = K.acto1, [l0] = K.luz, [c0] = K.cesio;
  // 1) muy cerca, a ras del anillo, el borde iluminado arriba; 2) se aleja hasta ver el planeta entero con su órbita
  // de luz; 3) en el cesio baja al plano del ecuador: el anillo queda de canto (una recta en el centro)
  const back = eIO(pr(t, l0 + 0.2, 2.4)), canto = eIO(pr(t, c0 - 0.15, 0.75));
  const deriva = (t - T1) * 0.02;
  let pos = lerp3([0.25, 0.1, 2.0], [0.35 - deriva, 1.85, 5.7], back);
  pos = lerp3(pos, [0, 0, 6.0], canto);
  const mira = lerp3(lerp3([0.0, 0.38, 0.0], [0, -0.15, 0], back), [0, 0, 0], canto);
  const empuje = 1 - 0.08 * (1 - eOut(pr(t, T1, 1.6)));        // entra un poco más abierto y se cierra (empuje)
  return { pos, mira, fov: lerp(55, 38, back) * empuje * Math.PI / 180 };
};
const luz = (ctx: Ctx, t: number, m: Medios) => {
  const T1 = K.acto1, [l0, l1] = K.luz, [c0] = K.cesio;
  const cam = camaraLuz(t);
  const sale = eSuave(pr(t, T1 - 0.3, 1.6)) * (1 - eSuave(pr(t, c0 + 0.1, 1.3)));
  if (m.noche && m.dia && m.nubes && sale > 0) {
    const im = pintarTierraNoche(W, H, { noche: m.noche, dia: m.dia, nubes: m.nubes }, cam, {
      rot: -160 * Math.PI / 180 + (t - T1) * 0.035, sol: [-0.55, 0.42, -1], luces: 1.0, expo: 1.0, estrellas: 1.0,
    });
    ctx.save(); ctx.globalAlpha = sale; ctx.drawImage(im, 0, 0, W, H); ctx.restore();
  }
  const u = cl((t - l0) / (l1 - l0)), vueltas = 7.48 * u;
  const anillo = (th: number): V3 => [RLUZ * Math.cos(th), 0, RLUZ * Math.sin(th)];
  const th0 = Math.PI * 0.95;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  // el ecuador de luz que van dejando las vueltas (y que en el cesio queda de canto: una recta)
  const enc = Math.max(Math.min(1, vueltas) * 0.25 + 0.05 * Math.min(1, vueltas / 7.48) * 7, 0) * (1 - eSuave(pr(t, c0 + 1.0, 0.6)));
  const flashV = (() => { let f = 0; for (let k = 1; k <= 7; k++) { const d = t - (l0 + k * (l1 - l0) / 7.48); if (d >= 0 && d < 0.6) f = Math.max(f, Math.exp(-d * 6)); } return f; })();
  const canto = eIO(pr(t, c0 - 0.15, 0.75));
  const aAn = Math.max(enc + 0.7 * flashV, 0.85 * canto * (1 - eSuave(pr(t, c0 + 1.0, 0.6))));
  if (aAn > 0.01) {
    let prev: ReturnType<typeof proyectar> | null = null;
    for (let k = 0; k <= 240; k++) {
      const p = proyectar(anillo((k / 240) * Math.PI * 2), cam, W, H);
      if (prev && prev.z > 0 && p.z > 0 && !p.oculto && !prev.oculto) {
        ctx.strokeStyle = `rgba(255,224,170,${aAn})`; ctx.lineWidth = 2 + 2 * flashV;
        ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      prev = p;
    }
  }
  // el pulso con su cola
  if (u > 0 && u < 1 && t < c0) {
    const th = th0 + vueltas * Math.PI * 2, cola = Math.PI * 0.9;
    let prev: ReturnType<typeof proyectar> | null = null;
    for (let k = 0; k <= 80; k++) {
      const p = proyectar(anillo(th - (k / 80) * cola), cam, W, H);
      if (prev && !p.oculto && !prev.oculto && p.z > 0) {
        ctx.strokeStyle = `rgba(255,238,210,${0.95 * Math.pow(1 - k / 80, 1.5)})`; ctx.lineWidth = 7 * (1 - k / 80) + 1.5;
        ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      prev = p;
    }
    const ph = proyectar(anillo(th), cam, W, H);
    if (!ph.oculto && ph.z > 0) { brillo(ctx, ph.x, ph.y, 150, 0.95); estela(ctx, ph.x, ph.y, 380, 0.7); }
  }
  ctx.restore();
  // lecturas del instrumento
  const aL = eSuave(pr(t, T1 + 1.2, 1.0)) * (1 - eSuave(pr(t, c0 - 0.4, 0.8)));
  const yL = 1250;
  txt(ctx, "1 SEGUNDO  ·  CÁMARA LENTA", W / 2, 300, 22, 0.6 * aL, { esp: 4 });
  txt(ctx, `t = ${coma(u, 3)} s`, W / 2 - 170, yL, 36, 0.95 * aL, { peso: 500 });
  txt(ctx, `vueltas = ${coma(vueltas, 2)}`, W / 2 + 170, yL, 36 * (1 + 0.18 * flashV), 0.95 * aL, { peso: 500, rgb: ORO });
  txt(ctx, "c = 299 792 km/s  ·  equivalente en distancia", W / 2, yL + 55, 20, 0.5 * aL, { esp: 1 });
};

// ══ puente · «qué es un segundo»: un cronómetro de luz alrededor del punto que quedó del destello ═════════════════
// el anillo del cronómetro es el mismo que, al llegar la Tierra, queda como la órbita de la luz
const puente = (ctx: Ctx, t: number) => {
  const [, s1] = K.lento, a0 = s1 + 0.3, T1 = K.acto1;
  if (t < a0 || t >= T1 + 1.0) return;
  const ent = eSuave(pr(t, a0, 1.0)) * (1 - eSuave(pr(t, T1 - 0.3, 1.2)));
  const cx = W / 2, cy = 860, R = 330;
  estrellas(ctx, t, 0.35 * ent, -t * 3, 0, 1);
  brillo(ctx, cx, cy, 90, 0.7 * ent, ORO);
  // la aguja da una vuelta: de «Para entenderlo» hasta «un segundo»
  const v0 = K.voz[1], fin = v0 + (V[1].palabras.find((p) => p[0].startsWith("segundo"))?.[1] ?? 4) + 0.5;
  const u = eIO(pr(t, v0 + 0.3, fin - v0 - 0.3));
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(${RGB.crema},${0.22 * ent})`; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const a = -Math.PI / 2 + (i / 60) * Math.PI * 2, l = i % 5 === 0 ? 22 : 10;
    const on = i / 60 <= u ? 1 : 0.25;
    ctx.strokeStyle = `rgba(${on > 0.5 ? ORO : RGB.crema},${(on > 0.5 ? 0.85 : 0.25) * ent})`; ctx.lineWidth = i % 5 === 0 ? 2 : 1.2;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R - l), cy + Math.sin(a) * (R - l)); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
  }
  ctx.strokeStyle = `rgba(255,226,170,${0.9 * ent})`; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + u * Math.PI * 2); ctx.stroke();
  const ah = -Math.PI / 2 + u * Math.PI * 2;
  ctx.strokeStyle = `rgba(${RGB.crema},${0.8 * ent})`; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ah) * (R - 30), cy + Math.sin(ah) * (R - 30)); ctx.stroke();
  ctx.restore();
  brillo(ctx, cx + Math.cos(ah) * R, cy + Math.sin(ah) * R, 60, 0.8 * ent);
  txt(ctx, `${coma(u, 3)} s`, cx, cy + R + 90, 44, 0.9 * ent * eSuave(pr(t, K.lento[1] + 1.15, 0.5)) * (1 - eSuave(pr(t, T1 - 0.9, 0.5))), { peso: 500 });
  // al completar la vuelta: el anillo se enciende entero y se agranda hacia la órbita de la Tierra
  const llena = eSuave(pr(t, fin - 0.1, 1.0));
  if (llena > 0) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255,236,205,${llena})`; ctx.lineWidth = 3 + 6 * llena;
    ctx.beginPath(); ctx.arc(cx, cy, R * (1 + 0.5 * eSuave(pr(t, fin + 0.1, T1 - fin))), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
};

// ══ cesio · la nube del electrón 6s en GPU; la radiación sale en frentes de onda; el contador ══════════════════════
import { pintarAtomo } from "./parpadeo/atomo";
const cesio = (ctx: Ctx, t: number) => {
  const [c0, cStop] = K.cesio, fin = K.acto2;
  const aC = eSuave(pr(t, c0 + 0.1, 1.2)) * (1 - eSuave(pr(t, fin - 0.6, 1.4)));
  if (aC <= 0) return;
  const cy = 820;
  const uc = cl((t - (c0 + 0.8)) / (cStop - (c0 + 0.8)));
  // fase integrada: la onda acelera sin saltos
  let fase = 0; { const a0 = c0 + 0.4, n = 90, dt = Math.max(0, t - a0) / n;
    for (let i = 0; i < n; i++) { const ti = a0 + (i + 0.5) * dt; fase += lerp(1.5, 60, eIO(cl((ti - (c0 + 0.8)) / (cStop - (c0 + 0.8))))) * dt; }
    fase *= Math.PI * 2; }
  const kw = lerp(5, 70, eIO(uc));
  const abre = eOut(pr(t, c0 + 0.1, 1.2)) * (1 - 0.95 * eIO(pr(t, fin - 1.2, 1.0)));
  const im = pintarAtomo(W, H, {
    giro: t * 0.35, incl: 0.35 + 0.1 * Math.sin(t * 0.4), dist: lerp(6.2, 4.6, eIO(pr(t, c0, cStop - c0 + 1.5))), fov: 0.75,
    onda: eSuave(pr(t, c0 + 0.6, 0.8)) * (t < cStop ? 1 : Math.exp(-(t - cStop) * 0.8) * 0.6 + 0.2), kw, fase, abre, a: aC,
  });
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  // la nube se dibuja con su centro en cy (el lienzo GPU tiene el centro en H/2)
  ctx.drawImage(im, 0, cy - H / 2, W, H);
  // frentes de onda que salen de la nube y cruzan el cuadro (más juntos a medida que sube la frecuencia)
  const lam = lerp(240, 7, eIO(uc)), r0 = 380 * abre;
  const off = ((fase / (Math.PI * 2)) * lam * 0.25) % lam;
  for (let r = r0 + off; r < 1300; r += lam) {
    const a = 0.55 * aC * Math.exp(-(r - r0) / 650) * (lam < 14 ? lam / 14 : 1);
    ctx.strokeStyle = `rgba(255,226,170,${a})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(W / 2, cy, r, 0, Math.PI * 2); ctx.stroke();
  }
  if (lam < 14) brillo(ctx, W / 2, cy, 1300, 0.08 * (1 - lam / 14) * aC, ORO);
  ctx.restore();
  // niveles hiperfinos y rótulos
  const yN = 300, aN = eSuave(pr(t, c0 + 1.2, 0.9)) * aC;
  ctx.save(); ctx.strokeStyle = `rgba(${RGB.crema},${0.55 * aN})`; ctx.lineWidth = 1.5;
  for (const dy of [-34, 34]) { ctx.beginPath(); ctx.moveTo(W / 2 - 130, yN + dy); ctx.lineTo(W / 2 + 130, yN + dy); ctx.stroke(); }
  ctx.strokeStyle = `rgba(${ORO},${0.85 * aN})`; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2, yN + 28); ctx.lineTo(W / 2, yN - 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2 - 8, yN - 18); ctx.lineTo(W / 2, yN - 30); ctx.lineTo(W / 2 + 8, yN - 18); ctx.stroke(); ctx.restore();
  txt(ctx, "F = 4", W / 2 + 150, yN - 34, 22, 0.6 * aN, { al: "left" });
  txt(ctx, "F = 3", W / 2 + 150, yN + 34, 22, 0.6 * aN, { al: "left" });
  txt(ctx, "133", W / 2 - 222, yN - 99, 14, 0.55 * aN, { esp: 1, al: "left" });
  txt(ctx, "Cs  ·  TRANSICIÓN HIPERFINA", W / 2 - 192, yN - 90, 22, 0.55 * aN, { esp: 4, al: "left" });
  txt(ctx, "λ = 3,26 cm  ·  microondas", W / 2, yN + 90, 19, 0.45 * aN, { esp: 2 });
  const parado = t >= cStop, golpe = parado ? Math.exp(-(t - cStop) * 4) : 0;
  const ciclos = uc >= 1 ? 9192631770 : 9192631770 * (Math.pow(10, 10 * eIO(uc)) - 1) / (1e10 - 1);
  const yC = 1260;
  txt(ctx, "oscilaciones", W / 2, yC - 75, 22, 0.55 * aC, { esp: 4 });
  txt(ctx, miles(ciclos), W / 2 + (parado ? 0 : Math.sin(t * 91) * 1.5), yC, parado ? lerp(96, 114, golpe) : 96, aC, { peso: 500, rgb: parado ? ORO : RGB.crema });
  if (golpe > 0) brillo(ctx, W / 2, yC, 420, 0.25 * golpe * aC, ORO);
  const a1 = eSuave(pr(t, cStop + 0.9, 0.7)) * aC;
  txt(ctx, "=  1 segundo", W / 2, yC + 85, 42, a1, { fam: SANS, peso: 300, esp: 2 });
  txt(ctx, "exacto por definición (SI, BIPM)", W / 2, yC + 132, 19, 0.45 * a1, { esp: 1 });
  // el anillo de la Tierra, de canto, se recoge hacia el átomo
  const rec = 1 - eIO(pr(t, c0 + 0.05, 0.7));
  if (rec > 0 && rec < 1) {
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = `rgba(255,224,170,${0.85 * rec})`; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(W / 2 - 540 * rec, lerp(cy, H / 2, rec)); ctx.lineTo(W / 2 + 540 * rec, lerp(cy, H / 2, rec)); ctx.stroke(); ctx.restore();
  }
};

// ══ II · tiempo propio: líneas de universo (diagrama de espacio-tiempo) ═════════════════════════════════════════════
const CY_ANILLO = 820, R_ANILLO = 400, NL = 36;
const tiempoPropio = (ctx: Ctx, t: number) => {
  const T2 = K.acto2, v6 = K.voz[5], tP = K.propio, tA = K.anillo;
  const ent = eSuave(pr(t, T2 - 0.4, 1.6)), sale = 1 - eSuave(pr(t, tA + 1.0, 1.3));
  if (ent * sale <= 0) return;
  estrellas(ctx, t, 0.4 * ent * sale, -t * 4, t * 2, 1);
  const crece = eOut(pr(t, T2, 1.2));
  const campo = eIO(pr(t, v6, 1.6));                             // de dos líneas al tejido de muchas
  const dobla = eIO(pr(t, tA, 1.3));                             // las líneas se curvan y se cierran en el anillo
  const y0 = 1250, y1 = 330;                                     // el tiempo sube
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < NL; i++) {
    const esCab = i === NL / 2, esPie = i === NL / 2 - 1;
    const base = esCab || esPie;
    const aL = (base ? 1 : campo) * ent * sale;
    if (aL <= 0.01) continue;
    // posición de la línea: las dos del diagrama juntas al centro; las demás se reparten por el ancho
    const xDiag = esCab ? W / 2 + 120 : esPie ? W / 2 - 120 : W / 2;
    const xCampo = 60 + (i / (NL - 1)) * (W - 120);
    const x = lerp(xDiag, xCampo, campo);
    const ritmo = esCab ? 1.06 : esPie ? 1.0 : 0.9 + 0.2 * ((i * 0.6180339) % 1);   // (diferencia amplificada)
    // forma: vertical → arco del anillo (cada línea, un tramo del año)
    const pt = (s: number): [number, number] => {
      const yy = lerp(y0, lerp(y0, y1, crece), s);
      const ang = -Math.PI / 2 + ((i + s) / NL) * Math.PI * 2;
      return [lerp(x, W / 2 + Math.cos(ang) * R_ANILLO, dobla), lerp(yy, CY_ANILLO + Math.sin(ang) * R_ANILLO, dobla)];
    };
    ctx.strokeStyle = `rgba(${base ? ORO : RGB.crema},${(base ? 0.8 : 0.28) * aL})`; ctx.lineWidth = base ? 2.2 : 1.2;
    ctx.beginPath(); for (let k = 0; k <= 40; k++) { const [px, py] = pt(k / 40); if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke();
    // marcas de tic que suben por la línea con su ritmo propio
    const nT = 9;
    for (let k = 0; k < nT; k++) {
      const s = ((k / nT + (t - T2) * 0.22 * ritmo) % 1);
      const [px, py] = pt(s);
      const al = aL * (base ? 0.95 : 0.5) * Math.sin(Math.PI * s);
      ctx.fillStyle = `rgba(255,236,205,${al})`; ctx.fillRect(px - (base ? 9 : 5), py - 1.2, base ? 18 : 10, 2.4);
    }
  }
  ctx.restore();
  // rótulos del diagrama
  const aD = ent * (1 - campo) * sale;
  txt(ctx, "PIES", W / 2 - 120, y0 + 50, 22, 0.7 * aD, { esp: 4 });
  txt(ctx, "CABEZA", W / 2 + 120, y0 + 50, 22, 0.7 * aD, { esp: 4 });
  txt(ctx, "↑  TIEMPO", W / 2 - 330, 420, 20, 0.5 * aD, { esp: 3 });
  txt(ctx, "33 cm", W / 2, y0 + 50, 20, 0.5 * aD, { esp: 1 });
  const aDif = eSuave(pr(t, K.voz[4] + 4.2, 0.8)) * aD;
  txt(ctx, "DIFERENCIA AMPLIFICADA", W / 2, 250, 22, 0.7 * aDif, { esp: 5, rgb: ORO });
  txt(ctx, "real: ≈ 90 milmillonésimas de segundo en 79 años  ·  NIST, 2010", W / 2, 292, 18, 0.5 * aDif, { esp: 1 });
  // τ: el tiempo propio
  const aT = eSuave(pr(t, tP - 0.2, 0.5)) * (1 - dobla) * sale;
  if (aT > 0) {
    brillo(ctx, W / 2, 760, 260, 0.25 * aT, ORO);
    txt(ctx, "τ", W / 2, 760, 220, aT, { fam: "'STIX Two Text', serif", rgb: ORO });
    txt(ctx, "TIEMPO PROPIO", W / 2, 920, 26, 0.75 * aT, { esp: 8 });
  }
};

// ══ III · el año cósmico (anillo) y la espiral del último día ═══════════════════════════════════════════════════
const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const DIAS_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const fecha = (d: number) => { let m = 0, r = Math.floor(d); while (m < 11 && r >= DIAS_MES[m]) { r -= DIAS_MES[m]; m++; } return `${r + 1} ${MESES[m]}`; };
const interp = (ks: number[][], t: number, log = false) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) {
    const x = eIO((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]));
    return log ? Math.exp(lerp(Math.log(ks[i - 1][1]), Math.log(ks[i][1]), x)) : lerp(ks[i - 1][1], ks[i][1], x);
  }
  return ks[ks.length - 1][1];
};
const diaDe = (t: number) => interp(K.dias, t);
const angDia = (d: number) => -Math.PI / 2 + (d / 365) * Math.PI * 2;

// fondos del año: cada época con su propia simulación detrás del instrumento
const PART = (() => { let q = 99; const r = () => { q = (q * 16807) % 2147483647; return q / 2147483647; };
  return Array.from({ length: 5000 }, () => ({ x: r(), y: r(), a: r(), b: r(), c: r() })); })();
// las primeras estrellas, dentro del anillo: el gas cae a los pozos de un campo de densidad y se enciende; detrás,
// fundida con una máscara radial, la foto real de un cúmulo globular (Omega Centauri, ESO), con estrellas de las más viejas
const NUDOS = PART.slice(0, 34).map((p) => { const r = 40 + 250 * Math.sqrt(p.a), an = p.b * Math.PI * 2; return { x: W / 2 + Math.cos(an) * r, y: CY_ANILLO + Math.sin(an) * r }; });
let capaCum: HTMLCanvasElement | null = null;
const primerasEstrellas = (ctx: Ctx, t: number, t0: number, a: number, m: Medios) => {
  if (a <= 0) return;
  const u = eIO(pr(t, t0, 4.2)), enc = eSuave(pr(t, t0 + 2.6, 1.6));
  if (m.cumulo) {
    if (!capaCum) { capaCum = document.createElement("canvas"); capaCum.width = W; capaCum.height = H; }
    const c2 = capaCum.getContext("2d")!; c2.globalCompositeOperation = "source-over"; c2.clearRect(0, 0, W, H);
    const lado = lerp(980, 1060, pr(t, t0, 8)), im = m.cumulo;
    c2.save(); c2.translate(W / 2, CY_ANILLO); c2.rotate((t - t0) * 0.01); c2.drawImage(im, -lado / 2, -lado / 2 * (im.height / im.width), lado, lado * (im.height / im.width)); c2.restore();
    c2.globalCompositeOperation = "destination-in";
    const mg = c2.createRadialGradient(W / 2, CY_ANILLO, 60, W / 2, CY_ANILLO, 380);
    mg.addColorStop(0, "rgba(0,0,0,1)"); mg.addColorStop(0.7, "rgba(0,0,0,0.75)"); mg.addColorStop(1, "rgba(0,0,0,0)");
    c2.fillStyle = mg; c2.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.7 * enc * a; ctx.drawImage(capaCum, 0, 0); ctx.restore();
  }
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3600; i++) {
    const p = PART[i], n = NUDOS[i % NUDOS.length];
    const r0 = 380 * Math.sqrt(p.x), a0 = p.y * Math.PI * 2;
    const x0 = W / 2 + Math.cos(a0) * r0, y0 = CY_ANILLO + Math.sin(a0) * r0;
    const k = Math.pow(u, 0.6 + p.c);
    const x = lerp(x0, n.x + (p.a - 0.5) * 30 * (1 - u * 0.8), k), y = lerp(y0, n.y + (p.b - 0.5) * 30 * (1 - u * 0.8), k);
    ctx.fillStyle = `rgba(${lerp(150, 255, u) | 0},${lerp(120, 205, u) | 0},${lerp(200, 160, u) | 0},${0.4 * a * (1 - 0.5 * enc)})`; ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.restore();
  NUDOS.forEach((n, i) => brillo(ctx, n.x, n.y, 26 + 34 * ((i * 0.37) % 1), 0.8 * enc * a * (0.4 + 0.6 * ((i * 0.61) % 1)), "255,240,220"));
};
const disco = (ctx: Ctx, t: number, t0: number, a: number) => {
  // disco protoplanetario: órbitas keplerianas (ω ∝ r^−1,5) con huecos, como los anillos de HL Tauri (ALMA)
  const cx = W / 2, cy = CY_ANILLO, inc = 0.38;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 5000; i++) {
    const p = PART[i], r = 0.08 + 0.92 * Math.sqrt(p.a);
    const hueco = [0.32, 0.52, 0.71, 0.86].some((g) => Math.abs(r - g) < 0.018);
    if (hueco) continue;
    const ang = p.b * Math.PI * 2 + (t - t0) * 1.6 * Math.pow(r, -1.5);
    const x = cx + Math.cos(ang) * r * 620, y = cy + Math.sin(ang) * r * 620 * inc;
    const al = a * 0.5 * (1 - r * 0.6);
    ctx.fillStyle = `rgba(255,${lerp(210, 150, r) | 0},${lerp(150, 90, r) | 0},${al})`; ctx.fillRect(x, y, 1.8, 1.8);
  }
  ctx.restore();
  brillo(ctx, cx, cy, 140, 0.9 * a, "255,244,225"); brillo(ctx, cx, cy, 420, 0.25 * a, ORO);
};
const estromatolito = (ctx: Ctx, t: number, t0: number, a: number) => {
  // tapiz microbiano que crece en capas (domo de estromatolito): cada capa copia la anterior con un poco de ruido
  const capas = Math.floor(lerp(2, 46, eOut(pr(t, t0, 3.2))));
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let c = 0; c < capas; c++) {
    const h = 60 + c * 13, al = a * (0.12 + 0.5 * (c / 46)) * (c === capas - 1 ? 1.6 : 1);
    ctx.strokeStyle = `rgba(${c % 2 ? "180,220,160" : "236,200,140"},${al})`; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let k = 0; k <= 120; k++) {
      const x = 80 + (k / 120) * (W - 160), u = (k / 120) * 2 - 1;
      const y = 1500 - h * (1 - u * u * 0.85) - 6 * Math.sin(k * 0.7 + c * 1.3) * (c / 46);
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
};
const foto = (ctx: Ctx, im: HTMLImageElement | undefined, t: number, t0: number, t1: number, a: number, fx = 0.5, fy = 0.5) => {
  if (!im || a <= 0) return;
  const s = lerp(1.0, 1.08, pr(t, t0, t1 - t0));
  const k = Math.max(W / im.width, H / im.height) * s, w = im.width * k, h = im.height * k;
  ctx.save(); ctx.globalAlpha = a; ctx.drawImage(im, W / 2 - fx * w, H / 2 - fy * h, w, h); ctx.restore();
};
const anioCosmico = (ctx: Ctx, t: number, m: Medios) => {
  const tA = K.anillo, d0 = K.dias[0][0], tE = K.espiral[0][0];
  const ent = eSuave(pr(t, tA + 0.6, 1.4)), sale = 1 - eSuave(pr(t, tE - 0.6, 1.4));
  if (ent * sale <= 0) return;
  const d = diaDe(t);
  const kf = K.dias;
  // fondos por época (detrás del instrumento)
  // 1 ENE: el universo entero se ilumina a la vez y se enfría (sin centro: la expansión ocurre en todas partes)
  if (t >= d0 && t < d0 + 2.0) {
    const u = (t - d0) / 2.0, I = Math.sin(Math.PI * Math.min(1, u * 1.3)) * Math.exp(-u * 1.5);
    ctx.save(); ctx.fillStyle = `rgba(${lerp(255, 200, u) | 0},${lerp(225, 120, u) | 0},${lerp(190, 60, u) | 0},${0.3 * I})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  primerasEstrellas(ctx, t, d0 + 0.8, ventanaA(t, d0 + 0.8, kf[2][0] - 1.4), m);
  disco(ctx, t, kf[2][0] - 1.6, ventanaA(t, kf[2][0] - 1.4, kf[3][0] - 1.0));
  estromatolito(ctx, t, kf[3][0] - 1.2, ventanaA(t, kf[3][0] - 1.0, kf[4][0] - 1.0));
  foto(ctx, m.fosil, t, kf[4][0] - 1.2, tE, ventanaA(t, kf[4][0] - 1.0, tE + 0.4) * 0.42);
  estrellas(ctx, t, 0.4 * ent * sale, -t * 2, 0, 1);
  const a = ent * sale;
  const aTx = a * (1 - eSuave(pr(t, tE - 1.1, 0.5)));
  // el instrumento: anillo, días, meses, el arco recorrido y el marcador
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(${RGB.crema},${0.3 * a})`; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(W / 2, CY_ANILLO, R_ANILLO, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 365; i += 1) {
    const an = angDia(i), l = 6;
    ctx.strokeStyle = `rgba(${RGB.crema},${0.12 * a})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(an) * (R_ANILLO - l), CY_ANILLO + Math.sin(an) * (R_ANILLO - l)); ctx.lineTo(W / 2 + Math.cos(an) * R_ANILLO, CY_ANILLO + Math.sin(an) * R_ANILLO); ctx.stroke();
  }
  let acc = 0;
  MESES.forEach((ms, i) => {
    const an = angDia(acc);
    ctx.strokeStyle = `rgba(${RGB.crema},${0.6 * a})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(an) * (R_ANILLO - 26), CY_ANILLO + Math.sin(an) * (R_ANILLO - 26)); ctx.lineTo(W / 2 + Math.cos(an) * (R_ANILLO + 8), CY_ANILLO + Math.sin(an) * (R_ANILLO + 8)); ctx.stroke();
    const am = angDia(acc + DIAS_MES[i] / 2);
    txt(ctx, ms, W / 2 + Math.cos(am) * (R_ANILLO + 52), CY_ANILLO + Math.sin(am) * (R_ANILLO + 52), 22, 0.65 * a, { esp: 2 });
    acc += DIAS_MES[i];
  });
  ctx.strokeStyle = `rgba(255,214,150,${0.9 * a})`; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(W / 2, CY_ANILLO, R_ANILLO, -Math.PI / 2, angDia(d)); ctx.stroke();
  ctx.restore();
  const am = angDia(d), mx = W / 2 + Math.cos(am) * R_ANILLO, my = CY_ANILLO + Math.sin(am) * R_ANILLO;
  brillo(ctx, mx, my, 90, 0.95 * a); estela(ctx, mx, my, 160, 0.4 * a);
  // los hitos
  const hitos: [number, string, string][] = [
    [kf[1][0], "PRIMERAS ESTRELLAS", "≈ 100–200 Ma tras el inicio · modelo"],
    [kf[2][0], "NACE EL SOL", "hace 4 600 Ma"],
    [kf[3][0], "PRIMERAS HUELLAS DE VIDA", "≈ 3 700 Ma · evidencia en discusión"],
    [kf[4][0], "DINOSAURIOS", "hace ≈ 233 Ma"],
  ];
  hitos.forEach(([th, n, s], i) => {
    const sig = i + 1 < hitos.length ? hitos[i + 1][0] - 0.6 : tE - 0.6;
    const ah = eSuave(pr(t, th - 0.5, 1.0)) * (1 - eSuave(pr(t, sig - 0.3, 0.9))) * aTx;
    txt(ctx, n, W / 2, CY_ANILLO - 40, 30, ah, { esp: 4, rgb: ORO, peso: 500 });
    txt(ctx, s, W / 2, CY_ANILLO + 10, 20, 0.7 * ah, { esp: 1 });
  });
  // lectura: fecha y tiempo real equivalente
  const ma = Math.round(13800 * (1 - d / 365));
  txt(ctx, fecha(d), W / 2, 1330, 52, 0.95 * aTx, { peso: 500 });
  txt(ctx, `hace ${miles(ma)} millones de años`, W / 2, 1392, 22, 0.6 * aTx, { esp: 2 });
  txt(ctx, "1 AÑO  =  13 800 000 000 AÑOS", W / 2, 300, 22, 0.5 * aTx, { esp: 4 });
};
const ventanaA = (t: number, a: number, b: number) => eSuave(pr(t, a - 0.3, 1.2)) * (1 - eSuave(pr(t, b - 0.9, 1.2)));

// la espiral del 31 de diciembre: τ = segundos que faltan para la medianoche (del año cósmico). La posición de un
// instante es r = Rf·(τ/τc)^0,5 y ángulo 2π·log₁₀(τ/τc): cada vuelta hacia adentro es una ventana 10 veces más corta y
// la figura es autosemejante, así que acercarse (bajar τc) es girar y escalar la misma curva, sin cortes.
const fmtT = (s: number) => s >= 3600 ? `${coma(s / 3600, 1)} h` : s >= 60 ? `${coma(s / 60, 1)} min` : s >= 1 ? `${coma(s, 1)} s` : `${coma(s, 2)} s`;
const reloj = (tau: number) => {
  const r = 86400 - tau, h = Math.floor(r / 3600), mi = Math.floor((r % 3600) / 60), se = r % 60;
  return `31 DIC · ${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:${se < 10 ? "0" : ""}${coma(se, 2)}`;
};
const espiral = (ctx: Ctx, t: number, m: Medios) => {
  const tE = K.espiral[0][0], tD = K.destello2;
  const ent = eSuave(pr(t, tE - 0.6, 1.4)), sale = 1 - eSuave(pr(t, tD - 0.05, 1.0));
  if (ent * sale <= 0) return;
  const tc = interp(K.espiral, t, true);
  const CX = W / 2, CY = CY_ANILLO + 380, RF = 380;               // el foco queda arriba del centro de la espiral
  const pos = (tau: number): [number, number] => {
    const q = tau / tc, r = RF * Math.sqrt(q), an = -Math.PI / 2 + 2 * Math.PI * Math.log10(q);
    return [CX + Math.cos(an) * r, CY + Math.sin(an) * r];
  };
  // fondos: la Cueva de las Manos y la tablilla
  const kf = K.espiral;
  foto(ctx, m.manos, t, kf[1][0], kf[3][0], ventanaA(t, kf[1][0] + 0.3, kf[2][0] + 1.2) * 0.4);
  foto(ctx, m.tablilla, t, kf[2][0], tD, ventanaA(t, kf[2][0] + 0.8, tD + 0.6) * 0.4);
  estrellas(ctx, t, 0.35 * ent, -t * 2, 0, 1);
  const a = ent * sale;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(255,214,150,${0.75 * a})`; ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let k = 0; k <= 900; k++) {
    const tau = tc * Math.pow(10, lerp(3.2, -3.5, k / 900));
    const [x, y] = pos(tau); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // marcas: cada potencia de 10 de segundos (y sus divisiones)
  for (let e = -2; e <= 5; e++) for (const f of [1, 2, 5]) {
    const tau = f * Math.pow(10, e), q = tau / tc;
    if (q < 0.0005 || q > 1800) continue;
    const [x, y] = pos(tau), [x2, y2] = pos(tau * 1.0001), an = Math.atan2(y2 - y, x2 - x) + Math.PI / 2;
    const l = (f === 1 ? 16 : 8) * Math.min(1.6, Math.sqrt(q) + 0.3);
    ctx.strokeStyle = `rgba(${RGB.crema},${(f === 1 ? 0.7 : 0.35) * a})`; ctx.lineWidth = f === 1 ? 1.8 : 1;
    ctx.beginPath(); ctx.moveTo(x - Math.cos(an) * l, y - Math.sin(an) * l); ctx.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l); ctx.stroke();
    const lq = Math.log10(q), vis = eSuave(cl((lq + 1.8) / 0.5)) * eSuave(cl((1.8 - lq) / 0.5)) * eSuave(cl((Math.abs(lq) - 0.15) / 0.3));
    if (f === 1 && vis > 0) txt(ctx, fmtT(tau), x + Math.cos(an) * 46, y + Math.sin(an) * 46, 18 * Math.min(1.3, 0.6 + Math.sqrt(q) * 0.5), 0.55 * a * vis, { esp: 1 });
  }
  // el tramo de una vida (los últimos 0,18 s) en oro
  ctx.strokeStyle = `rgba(255,236,190,${a})`; ctx.lineWidth = 6;
  ctx.beginPath(); for (let k = 0; k <= 60; k++) { const [x, y] = pos(0.18 * Math.pow(10, -3 * (k / 60))); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
  ctx.restore();
  // hitos sobre la espiral
  const hitos: [number, string][] = [[685, "23:48:34 · HOMO SAPIENS"], [30, "23:59:30 · CUEVA DE LAS MANOS"], [12, "23:59:48 · ESCRITURA"], [0.18, "23:59:59,82 · UNA VIDA"]];
  hitos.forEach(([tau, s]) => {
    const q = tau / tc, al = a * eSuave(cl(1 - Math.abs(Math.log10(q)) / 0.55));
    if (al <= 0.01) return;
    const [x, y] = pos(tau);
    brillo(ctx, x, y, 50, 0.8 * al, ORO);
    txt(ctx, s, x, y - 44, 22, al, { esp: 2, rgb: ORO, peso: 500 });
  });
  const [fx, fy] = pos(tc); brillo(ctx, fx, fy, 110, 0.9 * a); estela(ctx, fx, fy, 200, 0.45 * a);
  const aTx = a * eSuave(pr(t, tE + 0.1, 0.6));
  txt(ctx, reloj(tc), W / 2, 372, 46, 0.95 * aTx, { peso: 500 });
  txt(ctx, `faltan ${fmtT(tc)} para terminar el año`, W / 2, 428, 22, 0.6 * aTx, { esp: 2 });
  txt(ctx, "EL ÚLTIMO DÍA  ·  CADA VUELTA, 10 VECES MÁS CORTA", W / 2, 300, 20, 0.5 * aTx, { esp: 3 });
  // (las lecturas van arriba: la espiral ocupa el centro y abajo)
  // el destello de una vida, otra vez (el mismo del comienzo)
};

// ══ IV · lo que cabe en un parpadeo: la luz cálida, las películas caseras, el cielo de una noche ═══════════════════
const calido = (ctx: Ctx, a: number) => {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = a; ctx.fillStyle = "rgb(255,214,170)"; ctx.fillRect(0, 0, W, H); ctx.restore();
};
const polvo = (ctx: Ctx, t: number, a: number) => {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 260; i++) {
    const p = PART[i + 1000], x = ((p.x + t * 0.006 * (p.c - 0.5)) % 1 + 1) % 1 * W, y = ((p.y - t * 0.01 * p.a) % 1 + 1) % 1 * H;
    const r = 1 + 3 * p.b; ctx.fillStyle = `rgba(255,220,170,${a * 0.35 * (0.3 + p.c)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
};
const cuadroVideo = (m: Medios, n: string) => m.vid?.[n];
const pelicula = (ctx: Ctx, t: number, m: Medios, n: string, t0: number, t1: number) => {
  const a = ventanaA(t, t0, t1 + 0.3);
  const im = cuadroVideo(m, n);
  if (im) { foto(ctx, im, t, t0, t1, a); calido(ctx, 0.35 * a); }
  else { const g = ctx.createRadialGradient(W / 2, 800, 0, W / 2, 800, 900); g.addColorStop(0, `rgba(255,190,120,${0.35 * a})`); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  polvo(ctx, t, a);
};
const conversacion = (ctx: Ctx, t: number, t0: number, t1: number) => {
  // dos voces como ondas de luz (crema y ámbar) que se turnan al hablar, como en una conversación de sobremesa;
  // a mitad de la frase, la voz ámbar se va apagando y queda una sola, cada vez más tenue: una línea
  const a = ventanaA(t, t0, t1 + 2);
  if (a <= 0) return;
  const g = ctx.createRadialGradient(W / 2, 960, 0, W / 2, 960, 900);
  g.addColorStop(0, `rgba(120,70,30,${0.35 * a})`); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  polvo(ctx, t, a * 0.8);
  const ida = 1 - eIO(pr(t, K.voz[15] + 1.6, 2.6));             // la voz que se va
  const queda = 1 - 0.85 * eIO(pr(t, K.voz[16] - 0.2, 2.8));      // la que queda, cada vez más quieta
  const voz = (fase: number, turno: number) => {                  // envolvente de habla: sílabas y turnos
    const s1 = 0.5 + 0.5 * Math.sin(t * 1.3 + turno * Math.PI), sil = 0.55 + 0.45 * Math.sin(t * 9.1 + fase) * Math.sin(t * 5.3 + fase * 2);
    return Math.max(0, s1) * sil;
  };
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (const [rgb, turno, k, amp] of [["255,236,205", 0, 1, queda], [ORO, 1, 1.35, ida * queda]] as const) {
    if (amp <= 0.01) continue;
    for (const [w, al] of [[10, 0.08], [3.5, 0.3], [1.6, 0.85]] as const) {
      ctx.strokeStyle = `rgba(${rgb},${al * a})`; ctx.lineWidth = w; ctx.beginPath();
      for (let i = 0; i <= 360; i++) {
        const u = i / 360, x = u * W, env = Math.sin(Math.PI * u) ** 1.5;
        const y = 960 - 300 * amp * (0.25 + voz(turno * 2.1, turno)) * env * Math.sin(u * 26 * k - t * 6.5 * k + turno) * (0.7 + 0.3 * Math.sin(u * 7 + t));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
};
// la última conversación: una toma real al atardecer, en cámara lenta, con un empuje muy suave; luz dorada encima
// (destello de lente cálido que respira), sin nada que tape a las personas
// una toma real con fundidos largos, empuje suave y su propia gradación; nada encima salvo un poco de polvo de luz
const toma = (ctx: Ctx, t: number, m: Medios, n: string, t0: number, t1: number, filtro: string) => {
  const a = ventanaA(t, t0, t1);
  const im = m.vid?.[n];
  if (a <= 0 || !im) return;
  const u = pr(t, t0 - 0.3, t1 - t0 + 0.6), s2 = lerp(1.0, 1.06, eIO(u));
  const k = Math.max(W / im.width, H / im.height) * s2, w = im.width * k, h = im.height * k;
  ctx.save(); ctx.globalAlpha = a; (ctx as unknown as { filter: string }).filter = filtro;
  ctx.drawImage(im, W / 2 - w / 2, H / 2 - h / 2, w, h); ctx.restore();
  const g = ctx.createLinearGradient(0, H * 0.6, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${0.35 * a})`); ctx.fillStyle = g; ctx.fillRect(0, H * 0.6, W, H * 0.4);
  polvo(ctx, t, 0.4 * a);
};
const atardecer = (ctx: Ctx, t: number, m: Medios, t0: number, t1: number) => {
  const a = ventanaA(t, t0, t1 + 1.5);
  if (a <= 0) return;
  const im = m.vid?.atardecer;
  if (!im) { conversacion(ctx, t, t0, t1); return; }
  const u = pr(t, t0, t1 - t0 + 1.5);
  const s = lerp(1.0, 1.07, eIO(u));
  const k = Math.max(W / im.width, H / im.height) * s, w = im.width * k, h = im.height * k;
  // sin lavar: un poco más de contraste y color, y algo más oscuro (el acabado agrega brillo)
  ctx.save(); ctx.globalAlpha = a; (ctx as unknown as { filter: string }).filter = "brightness(0.74) contrast(1.18) saturate(1.35) sepia(0.12)";
  ctx.drawImage(im, W / 2 - w / 2, H / 2 - h / 2 - lerp(0, 30, u), w, h); ctx.restore();
  // luz de atardecer: un velo cálido muy leve desde arriba y un destello que respira
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `rgba(255,150,70,${0.08 * a})`); g.addColorStop(0.55, "rgba(255,150,80,0)"); g.addColorStop(1, `rgba(20,10,5,${0.35 * a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  polvo(ctx, t, a * 0.6);
};
const recuerdos = (ctx: Ctx, t: number, m: Medios) => {
  const T4 = K.acto4, v = K.voz;
  if (t < T4 || t >= v[17] + 1.2) return;
  // el tramo de 0,18 s se abre como una ranura de luz cálida
  const abre = eIO(pr(t, T4 + 0.4, 2.2));
  if (t < v[13] + 0.4) {
    const h = lerp(6, H, abre);
    const g = ctx.createLinearGradient(0, H / 2 - h / 2, 0, H / 2 + h / 2);
    g.addColorStop(0, "rgba(255,180,110,0)"); g.addColorStop(0.5, `rgba(255,214,160,${lerp(1, 0.35, abre)})`); g.addColorStop(1, "rgba(255,180,110,0)");
    ctx.fillStyle = g; ctx.fillRect(0, H / 2 - h / 2, W, h);
    polvo(ctx, t, abre);
  }
  pelicula(ctx, t, m, "bebe", v[13] - 0.2, v[14] - 0.2);
  toma(ctx, t, m, "fuego", v[14] - 0.7, v[14] + 3.4, "brightness(0.92) contrast(1.08) saturate(1.1)");
  toma(ctx, t, m, "risa", v[14] + 2.6, v[15] + 0.6, "brightness(0.9) contrast(1.06) saturate(1.05)");
  atardecer(ctx, t, m, v[15] - 1.2, v[16] + 3.4);
  // «Todo eso cabe en menos de dos décimas de segundo»: el cuadro se cierra en una ranura de luz (la de 0,18 s)
  const cierra = eIO(pr(t, v[16] - 0.3, 3.4)), sueltaR = 1 - eSuave(pr(t, v[17] - 0.5, 1.5));
  if (cierra > 0) {
    const hh = lerp(H, 8, cierra) / 2;
    ctx.save(); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H / 2 - hh); ctx.fillRect(0, H / 2 + hh, W, H / 2 - hh); ctx.restore();
    const g = ctx.createLinearGradient(0, H / 2 - hh - 30, 0, H / 2 + hh + 30);
    g.addColorStop(0, "rgba(255,200,140,0)"); g.addColorStop(0.5, `rgba(255,220,170,${0.5 * cierra * sueltaR})`); g.addColorStop(1, "rgba(255,200,140,0)");
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(0, H / 2 - hh - 30, W, 2 * hh + 60); ctx.restore();
    txt(ctx, "0,18 s", W / 2, H / 2 + 120, 34, eSuave(pr(cierra, 0.75, 0.25)) * 0.9 * sueltaR, { rgb: ORO, peso: 500 });
  }
};

// ══ V · cierre: el año entero visto de lejos; la caída al tramo de una vida; τ; el parpadeo; el título; la firma ═══
let capaRec: HTMLCanvasElement | null = null;
const cierreFinal = (ctx: Ctx, t: number, m: Medios) => {
  const v = K.voz, t17 = v[17], t18 = v[18];
  if (t < t17 - 0.6 || t >= K.reflexion + 2.0) return;
  const ent = eSuave(pr(t, t17 - 0.6, 1.6)) * (1 - eSuave(pr(t, K.reflexion - 0.2, 2.0)));
  // «Para ti…»: caída hacia el punto final del año
  const tTi = t18 + (V[18].palabras.find((p) => p[0].startsWith("ti"))?.[1] ?? 3);
  const cae = eIO(pr(t, t18 + 0.2, tTi - t18 + 0.6));
  const Z = Math.pow(60, cae);
  const px = W / 2, py = CY_ANILLO - R_ANILLO;                     // el final del año (arriba del anillo)
  estrellas(ctx, t, 0.5 * ent, -t * 3, 0, 1 + cae * 2);
  ctx.save();
  ctx.translate(W / 2, 960); ctx.scale(Z, Z); ctx.translate(-px, -py);
  ctx.globalCompositeOperation = "lighter";
  const gira = (t - t17) * 0.05;
  ctx.strokeStyle = `rgba(${RGB.crema},${0.35 * ent})`; ctx.lineWidth = 1.4 / Z;
  ctx.beginPath(); ctx.arc(W / 2, CY_ANILLO, R_ANILLO, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = `rgba(255,214,150,${0.85 * ent})`; ctx.lineWidth = 4 / Z;
  ctx.beginPath(); ctx.arc(W / 2, CY_ANILLO, R_ANILLO, -Math.PI / 2 + gira * 0, -Math.PI / 2 + Math.PI * 2 * eIO(pr(t, t17, 3.5))); ctx.stroke();
  ctx.restore();
  const sx = W / 2, sy = 960;
  // el tramo de una vida: con la caída se vuelve una franja de luz cálida que llena el cuadro
  const ancho = lerp(8, H * 1.2, Math.pow(cae, 2.2));
  const g = ctx.createLinearGradient(0, sy - ancho / 2, 0, sy + ancho / 2);
  g.addColorStop(0, "rgba(255,190,120,0)"); g.addColorStop(0.5, `rgba(255,226,180,${0.9 * ent})`); g.addColorStop(1, "rgba(255,190,120,0)");
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(0, sy - ancho / 2, W, ancho); ctx.restore();
  brillo(ctx, sx, sy, 120 + 300 * cae, (0.35 + 0.55 * cae) * ent);
  const rec = m.vid?.bebeFin, aRec = eSuave(pr(t, tTi - 0.4, 1.8)) * 0.55 * ent;
  if (rec && aRec > 0) {
    if (!capaRec) { capaRec = document.createElement("canvas"); capaRec.width = W; capaRec.height = H; }
    const c2 = capaRec.getContext("2d")!; c2.globalCompositeOperation = "source-over"; c2.clearRect(0, 0, W, H);
    const k = Math.max(W / rec.width, H / rec.height) * lerp(1.08, 1.0, aRec), w = rec.width * k, h = rec.height * k;
    c2.drawImage(rec, W / 2 - w / 2, H / 2 - h / 2, w, h);
    c2.globalCompositeOperation = "destination-in";
    const mg = c2.createRadialGradient(W / 2, 960, 100, W / 2, 960, 820); mg.addColorStop(0, "rgba(0,0,0,1)"); mg.addColorStop(1, "rgba(0,0,0,0)");
    c2.fillStyle = mg; c2.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = aRec; ctx.drawImage(capaRec, 0, 0); ctx.restore();
  }
  const aE = eSuave(pr(t, t17 + 0.6, 0.8)) * (1 - cae) * ent;
  txt(ctx, "13 800 000 000 AÑOS", W / 2, CY_ANILLO + R_ANILLO + 140, 24, 0.6 * aE, { esp: 5 });
  // el rótulo del tramo: 0,18 s → τ
  const aR = eSuave(pr(t, t18 + 0.4, 0.6)) * ent;
  const aTau = eSuave(pr(t, tTi - 0.1, 0.8)) * ent;
  txt(ctx, "0,18 s", W / 2, sy + 160, 40, aR * (1 - aTau), { peso: 500, rgb: ORO });
  txt(ctx, "τ", W / 2, sy + 10, 300, aTau, { fam: "'STIX Two Text', serif", rgb: "70,40,15" });
  txt(ctx, "TIEMPO PROPIO", W / 2, sy + 210, 26, 0.85 * aTau, { esp: 8, rgb: "70,40,15" });
};
// ══ reflexión final: la luz de la franja se vuelve estrellas; dos luces se encuentran (un abrazo); una estrella se
// apaga y su luz sigue viajando (un frente que cruza el cielo); llega a dos luces juntas, cerca: «este parpadeo es tuyo» ═
const reflexion = (ctx: Ctx, t: number) => {
  const R0 = K.reflexion, v = K.voz, tB = K.parpadeo;
  if (t < R0 - 0.6 || t >= tB + 0.4) return;
  const ent = eSuave(pr(t, R0 - 0.6, 2.2));
  const cielo = eSuave(pr(t, R0 - 0.2, 4.5)) * (1 - 0.6 * eSuave(pr(t, v[22] + 1.6, 2.0)));
  estrellas(ctx, t, 1.0 * cielo, -t * 2.5, 0, 1 + 0.01 * (t - R0));
  // una banda de Vía Láctea (polvo de estrellas en diagonal con un resplandor suave), dibujada desde partículas
  if (cielo > 0) {
    ctx.save(); ctx.translate(W / 2, 860); ctx.rotate(-0.9 + (t - R0) * 0.006);
    const gb = ctx.createLinearGradient(0, -260, 0, 260);
    gb.addColorStop(0, "rgba(120,110,170,0)"); gb.addColorStop(0.5, `rgba(230,210,190,${0.16 * cielo})`); gb.addColorStop(1, "rgba(120,110,170,0)");
    ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = gb; ctx.fillRect(-1400, -260, 2800, 520);
    for (let i = 0; i < 5000; i++) {
      const p = PART[i], x = (p.x - 0.5) * 2800, gy = (p.a + p.b + p.c - 1.5) * 170;
      const al = cielo * (0.15 + 0.55 * p.c * p.c) * (0.7 + 0.3 * Math.sin(t * 1.7 + i));
      ctx.fillStyle = `rgba(255,${235 - (40 * p.a) | 0},${215 - (60 * p.b) | 0},${al})`; const r = 0.7 + 1.6 * p.c * p.c; ctx.fillRect(x, gy, r, r);
    }
    ctx.restore();
  }
  // 1) la luz de la franja se abre en miles de luces que se van alejando
  const u = Math.max(0, t - (R0 - 0.6));
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3200; i++) {
    const p = PART[(i * 7 + 500) % 5000], ang = (p.a + i * 0.000137) * Math.PI * 2, vel = 30 + 300 * p.b * p.b;
    const d = vel * Math.pow(u, 0.75), x = W / 2 + Math.cos(ang) * d * 1.1, y = 960 + Math.sin(ang) * d * 0.55 + (p.c - 0.5) * 40;
    if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
    const cal = Math.max(0, 1 - u / 5), al = Math.min(1, ent * (0.45 + 0.9 * p.c) * Math.min(1, u * 2) * (0.6 + 0.4 * Math.sin(t * 2 + i)) * (1 - 0.5 * eSuave(pr(u, 6, 6))));
    ctx.fillStyle = `rgba(255,${lerp(240, 205, cal) | 0},${lerp(225, 150, cal) | 0},${al})`;
    const r = 1.2 + 2.4 * p.c; ctx.fillRect(x - r / 2, y - r / 2, r, r);
  }
  ctx.restore();
  // 2) «un abrazo»: dos luces que vienen de lados opuestos y se juntan
  const tA = v[20], ab = eIO(pr(t, tA - 0.4, 3.4)), aA = eSuave(pr(t, tA - 0.6, 1.0));
  const px = W / 2, py = 1180;
  const sep = lerp(460, 54, ab);
  for (const sg of [-1, 1]) {
    const x = px + sg * sep / 2;
    brillo(ctx, x, py, 60 + 30 * ab, 0.95 * aA, sg < 0 ? "255,226,180" : "255,214,160"); estela(ctx, x, py, 90, 0.35 * aA);
  }
  brillo(ctx, px, py, 320 * ab, 0.3 * ab * aA, "255,200,140");
  // 3) una estrella se apaga y su luz sigue viajando: un frente que crece por todo el cielo
  const tS = v[21], sx = W * 0.5, sy = 520;
  const aS = eSuave(pr(t, tS - 0.8, 1.2)), apaga = eIO(pr(t, tS + 1.4, 1.8));
  brillo(ctx, sx, sy, 200, 1.0 * aS * (1 - apaga), "240,244,255"); brillo(ctx, sx, sy, 600, 0.25 * aS * (1 - apaga), "200,215,255"); estela(ctx, sx, sy, 320, 0.7 * aS * (1 - apaga));
  const fr = pr(t, tS + 1.2, 7.0);
  if (fr > 0 && fr < 1) {
    const r = lerp(40, 1500, fr * (2 - fr) * 0.5 + fr * 0.5);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const [w, al] of [[70, 0.07], [22, 0.2], [6, 0.45], [2, 0.9]] as const) {
      ctx.strokeStyle = `rgba(235,240,255,${al * Math.pow(1 - fr, 0.7) * ent})`; ctx.lineWidth = w;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  // 4) el frente llega a las dos luces juntas: se encienden (lo que dejamos en otros)
  const llega = Math.hypot(px - sx, py - sy), rNow = lerp(40, 1500, fr * (2 - fr) * 0.5 + fr * 0.5);
  const toca = fr > 0 ? eSuave(cl((rNow - llega + 80) / 160)) : 0;
  brillo(ctx, px, py, 160 + 220 * toca, 0.5 * toca * aA, "255,230,190");
  // «Este parpadeo es tuyo»: todo se aquieta; solo quedan ellas
  const quieto = eSuave(pr(t, v[22] + 1.6, 2.0));
  if (quieto > 0) { ctx.save(); ctx.fillStyle = `rgba(0,0,0,${0.5 * quieto})`; ctx.fillRect(0, 0, W, H); ctx.restore(); brillo(ctx, px, py, 300, 0.4 * quieto, "255,214,160"); }
};
const tituloFinal = (ctx: Ctx, t: number, m: Medios) => {
  const tT = K.titulo, tF = K.firma, tot = K.total;
  if (t < tT) return;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const fin = 1 - eSuave(pr(t, tot - 1.4, 1.3));
  if (m.logo) {
    const a = eSuave(pr(t, tT + 0.2, 1.6)) * fin, w = 520, h = (m.logo.height / m.logo.width) * w, y = 880;
    brillo(ctx, W / 2, y, 420, 0.1 * a, ORO);
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(m.logo, W / 2 - w / 2, y - h / 2, w, h); ctx.restore();
    const a2 = eSuave(pr(t, tF, 1.4)) * fin, a3 = eSuave(pr(t, tF + 1.2, 1.4)) * fin;
    txt(ctx, "UN PARPADEO", W / 2, y + h / 2 + 90, 40, 0.9 * a2, { fam: SANS, peso: 300, esp: lerp(18, 12, eOut(pr(t, tF, 4))) });
    txt(ctx, "UNA REFLEXIÓN SOBRE EL TIEMPO", W / 2, y + h / 2 + 150, 22, 0.65 * a3, { esp: 6 });
  }
};


// ══ subtítulos palabra por palabra (los de Existir) ══════════════════════════════════════════════════════════════
const SUB_Y = 1600, SUB_ANCHO = 920, SUB_TAM = 50;
const lineas = (ctx: Ctx, pal: string[]) => {
  const out: number[][] = [[]]; let ancho = 0; const esp = ctx.measureText(" ").width;
  pal.forEach((p, i) => {
    const w = ctx.measureText(p).width;
    if (ancho > 0 && ancho + esp + w > SUB_ANCHO) { out.push([]); ancho = 0; }
    out[out.length - 1].push(i); ancho += (ancho > 0 ? esp : 0) + w;
  });
  if (out.length === 2 && out[1].length === 1 && out[0].length > 2) out[1].unshift(out[0].pop()!);
  return out;
};
const subtitulos = (ctx: Ctx, t: number) => {
  for (let k = 0; k < V.length; k++) {
    const t0 = K.voz[k], t1 = t0 + V[k].fin;
    const sig = k + 1 < V.length ? K.voz[k + 1] : Infinity;
    const sale = Math.min(t1 + 0.7, sig - 0.05);
    if (t < t0 - 0.05 || t > sale) continue;
    const salida = 1 - eSuave(pr(t, sale - 0.35, 0.35));
    const pal = V[k].texto.split(/\s+/);
    ctx.save();
    ctx.font = `400 ${SUB_TAM}px ${SANS}`; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0.5px";
    const L = lineas(ctx, pal);
    const esp = ctx.measureText(" ").width;
    L.forEach((ids, li) => {
      const ancho = ids.reduce((a, i, j) => a + ctx.measureText(pal[i]).width + (j ? esp : 0), 0);
      let x = W / 2 - ancho / 2;
      const y = SUB_Y + (li - (L.length - 1) / 2) * SUB_TAM * 1.32;
      for (const i of ids) {
        const tp = t0 + (V[k].palabras[i]?.[1] ?? 0) - 0.06;
        const a = eSuave(pr(t, tp, 0.28)) * salida;
        if (a > 0) {
          const yy = y + (1 - eOut(pr(t, tp, 0.5))) * 8;
          const a2 = 1 - Math.sqrt(1 - Math.min(1, a));
          ctx.fillStyle = `rgba(${RGB.crema},${a2})`;
          ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 7; ctx.fillText(pal[i], x, yy);
          ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 20; ctx.fillText(pal[i], x, yy);
        }
        x += ctx.measureText(pal[i]).width + esp;
      }
    });
    ctx.restore();
  }
};

// ══ cuadro completo ════════════════════════════════════════════════════════════════════════════════════════════
export const dibujarParpadeo = (ctx: Ctx, t: number, frame: number, m: Medios, post = true, subs = true) => {
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const T1 = K.acto1;
  if (t < T1) apertura(ctx, t);
  if (t < T1 + 1.0) puente(ctx, t);
  if (t >= T1 - 0.3 && t < K.cesio[0] + 1.5) luz(ctx, t, m);
  if (t >= K.cesio[0] && t < K.acto2 + 0.9) cesio(ctx, t);
  if (t >= K.acto2 - 0.4 && t < K.anillo + 2.4) tiempoPropio(ctx, t);
  if (t >= K.anillo + 0.6 && t < K.espiral[0][0] + 0.9) anioCosmico(ctx, t, m);
  if (t >= K.espiral[0][0] - 0.6 && t < K.destello2 + 1.0) espiral(ctx, t, m);
  fogonazo(ctx, W / 2, CY_ANILLO, curvaDestello((t - K.destello2) / 0.18), 0.7);
  if (t > K.destello2 + 0.18 && t < K.destello2 + 0.9) brillo(ctx, W / 2, CY_ANILLO, 300, 0.35 * Math.exp(-(t - K.destello2 - 0.18) * 6), ORO);
  recuerdos(ctx, t, m);
  cierreFinal(ctx, t, m);
  reflexion(ctx, t);
  if (t >= K.titulo) tituloFinal(ctx, t, m);
  if (post) {
    let golpe = 0;
    for (const [g0, f] of [[K.destello, 0.5], [K.cesio[1], 0.4], [K.destello2, 0.5]] as const) if (t >= g0 && t - g0 < 1.5) golpe = Math.max(golpe, f * Math.exp(-(t - g0) * 3));
    const pp = postProceso(ctx.canvas, W, H, {
      px: 1, semilla: frame % 97, bloom: RETRO.bloom, expo: 0.95, aberr: RETRO.aberr, vineta: RETRO.vineta, grano: RETRO.grano, scan: RETRO.scan,
      curva: 0, esq: 0.03, impacto: 0, ruido: RETRO.ruido, flicker: 0, lineaY: -1, lineaA: 0, grade: RETRO.grade, tiempo: t, halo: RETRO.halo,
    });
    if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
  }
  if (subs) subtitulos(ctx, t);
  // el parpadeo final: cierra y ya no abre; detrás, el título y la firma
  const tB = K.parpadeo;
  if (t >= tB && t < K.titulo) parpadeo(ctx, eIO(pr(t, tB, 0.8)));
};

// ── cuadros de las películas que pide cada instante (el componente los carga antes de dibujar) ─────────────────────
export const PELIS: Record<string, [number, number]> = { bebe: [K.voz[13] - 0.6, K.voz[14] + 1.0], atardecer: [K.voz[15] - 1.4, K.voz[16] + 5.0], fuego: [K.voz[14] - 1.2, K.voz[14] + 4.0], risa: [K.voz[14] + 2.0, K.voz[15] + 1.2] };
// velocidad de cada película (0,5 = cámara lenta al 50 %)
// los cuadros ya vienen interpolados a la velocidad final (cámara lenta fluida): se avanza uno por cuadro
const VEL: Record<string, number> = {};
const TOPE: Record<string, number> = {};
export const cuadrosPeli = (t: number, cuantos: Record<string, number>) => {
  const out: Record<string, string> = {};
  for (const [n, [a, b]] of Object.entries(PELIS)) {
    if (t < a - 0.1 || t > b || !cuantos[n]) continue;
    // la última conversación se detiene en un cuadro (que después se deshace en luz)
    const i = Math.max(0, Math.min((TOPE[n] ?? cuantos[n]) - 1, Math.floor((t - a) * 30 * (VEL[n] ?? 1))));
    out[n] = `parpadeo/vid/${n}/${String(i + 1).padStart(4, "0")}.jpg`;
  }
  // en «Para ti…», dentro de la luz, vuelve el primer recuerdo (un cuadro quieto)
  if (cuantos.bebe && t > K.voz[18] && t < K.parpadeo + 0.3) out.bebeFin = "parpadeo/vid/bebe/0160.jpg";
  // en «Para ti…», dentro de la luz, vuelve el primer recuerdo (un cuadro quieto)
  if (cuantos.bebe && t > K.voz[18] && t < K.parpadeo + 0.3) out.bebeFin = "parpadeo/vid/bebe/0160.jpg";
  return out;
};
