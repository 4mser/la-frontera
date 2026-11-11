import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import { postProceso } from "../../../teaser-v1b/src/gl";

// Seven animated previews (1080 × 1920, ~8 s) of video ideas with a particle physicist, in the language of «La frontera».
// Physics drawn right: charged tracks are circles in the transverse view (radius ∝ pT), detector layers in their real
// order, LHC 26.7 km and FCC 90.7 km to scale, mH = 125 GeV. Instagram's UI covers ~250 px top and ~350 px bottom.
export const PROP_FPS = 30, PROP_DUR = 8.5;
const W = 1080, H = 1920;
const GROT = "Space Grotesk", MONO = "IBM Plex Mono";
const CREMA = "255,244,222", AMBAR = "255,190,120", AZUL = "120,190,255", MAGENTA = "255,110,200", VERDE = "140,255,190";
type Ctx = CanvasRenderingContext2D;
type P = [number, number];
const TAU = Math.PI * 2;
const cl = (x: number) => Math.min(1, Math.max(0, x));
const eo = (x: number) => 1 - Math.pow(1 - cl(x), 3);
const ei = (x: number) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const pr = (t: number, a: number, d: number) => cl((t - a) / d);
let sem = 1;
const azar = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
const sp = (c: Ctx, v: number) => { (c as unknown as { letterSpacing: string }).letterSpacing = `${v}px`; };

const glow = (ctx: Ctx, col: string, w: number, a = 1) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(${col},${0.08 * a})`; ctx.lineWidth = w * 7; ctx.stroke();
  ctx.strokeStyle = `rgba(${col},${0.22 * a})`; ctx.lineWidth = w * 2.6; ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(${col},${0.95 * a})`; ctx.lineWidth = w; ctx.stroke();
  ctx.restore();
};
const luz = (ctx: Ctx, x: number, y: number, r: number, a: number, col = AMBAR) => {
  if (a <= 0.01 || r < 0.5) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.25, `rgba(${col},${0.55 * a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
};
const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, col: string, a = 0.9, alin: CanvasTextAlign = "center", esp = 0.25) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.font = `500 ${tam}px "${MONO}"`; sp(ctx, tam * esp); ctx.textAlign = alin;
  ctx.fillStyle = `rgba(${col},${a})`; ctx.fillText(s, x, y); ctx.restore();
};
const titulo = (ctx: Ctx, s: string, y: number, tam: number, a = 1) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.font = `700 ${tam}px "${GROT}"`; sp(ctx, tam * 0.06); ctx.textAlign = "center";
  ctx.globalCompositeOperation = "lighter"; ctx.filter = `blur(${tam * 0.1}px)`; ctx.fillStyle = `rgba(${CREMA},${0.18 * a})`; ctx.fillText(s, W / 2, y);
  ctx.filter = "none"; ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = `rgba(${CREMA},${0.97 * a})`; ctx.fillText(s, W / 2, y);
  ctx.restore();
};
// the title block at the top of the safe area; lines «|», a subtitle in amber mono
const cabeza = (ctx: Ctx, t: number, lineas: string, sub: string, tam = 86) => {
  const ls = lineas.split("|"), y0 = 400;
  ls.forEach((l, i) => titulo(ctx, l, y0 + i * tam * 1.05, tam, eo(pr(t, 0.2 + i * 0.12, 0.6))));
  const yb = y0 + (ls.length - 1) * tam * 1.05 + tam * 0.72;
  sub.split("\n").forEach((l, i) => texto(ctx, l, W / 2, yb + i * 36, 24, AMBAR, 0.95 * eo(pr(t, 0.7, 0.6))));
};
const hud = (ctx: Ctx, n: number, formato: string, dato: string) => {
  const m = 56, b = 30, y0 = 230, y1 = 1600;
  ctx.save(); ctx.strokeStyle = `rgba(${CREMA},0.5)`; ctx.lineWidth = 2; ctx.beginPath();
  for (const [x, y, sx, sy] of [[m, y0, 1, 1], [W - m, y0, -1, 1], [m, y1, 1, -1], [W - m, y1, -1, -1]]) { ctx.moveTo(x, y + sy * b); ctx.lineTo(x, y); ctx.lineTo(x + sx * b, y); }
  ctx.stroke(); ctx.restore();
  texto(ctx, `PROPUESTA ${String(n).padStart(2, "0")} / 07`, 90, y0 + 50, 20, CREMA, 0.65, "left");
  texto(ctx, formato, W - 90, y0 + 50, 20, AMBAR, 0.95, "right");
  texto(ctx, dato, W / 2, y1 - 40, 17, CREMA, 0.55);
  texto(ctx, "B&N LECTURES", W / 2, y1 - 12, 17, CREMA, 0.55, "center", 0.35);
};

// ─── detector (transverse view) ───────────────────────────────────────────────────────────────────────────────────
const detector = (ctx: Ctx, cx: number, cy: number, s: number, a = 1) => {
  if (a <= 0.01) return;
  const anillo = (r: number, w: number, col: string, al: number) => { ctx.beginPath(); ctx.arc(cx, cy, r * s, 0, TAU); ctx.strokeStyle = `rgba(${col},${al * a})`; ctx.lineWidth = w; ctx.stroke(); };
  ctx.save();
  for (let i = 0; i < 4; i++) anillo(0.06 + i * 0.03, 1, CREMA, 0.35);
  for (let i = 0; i < 10; i++) anillo(0.2 + i * 0.075, 1, CREMA, 0.18);
  ctx.fillStyle = `rgba(${VERDE},${0.06 * a})`; ctx.beginPath(); ctx.arc(cx, cy, 1.38 * s, 0, TAU); ctx.arc(cx, cy, 1.0 * s, 0, TAU, true); ctx.fill();
  anillo(1.0, 1.2, VERDE, 0.4); anillo(1.38, 1.2, VERDE, 0.4);
  ctx.fillStyle = `rgba(${AZUL},${0.05 * a})`; ctx.beginPath(); ctx.arc(cx, cy, 2.05 * s, 0, TAU); ctx.arc(cx, cy, 1.42 * s, 0, TAU, true); ctx.fill();
  anillo(1.42, 1.2, AZUL, 0.35); anillo(2.05, 1.2, AZUL, 0.35);
  anillo(2.15, 3, CREMA, 0.25);
  for (let k = 0; k < 4; k++) { const r = 2.45 + k * 0.3; for (let j = 0; j < 12; j++) { const a0 = (j / 12) * TAU + 0.03, a1 = a0 + TAU / 12 - 0.06; ctx.beginPath(); ctx.arc(cx, cy, r * s, a0, a1); ctx.strokeStyle = `rgba(${MAGENTA},${0.3 * a})`; ctx.lineWidth = 5; ctx.stroke(); } }
  ctx.restore();
};
// the points of a charged track from (ox, oy), out to radius rmax around (cx, cy)
const puntosTraza = (ox: number, oy: number, phi: number, R: number, q: number, rmax: number, cx = ox, cy = oy) => {
  const pts: P[] = [];
  for (let u = 0; u < 3; u += 0.004) {
    const x = ox + R * (Math.sin(phi + u * q) - Math.sin(phi)) * q, y = oy - R * (Math.cos(phi + u * q) - Math.cos(phi)) * q;
    if (Math.hypot(x - cx, y - cy) > rmax) break;
    pts.push([x, y]);
  }
  return pts;
};
// draw the first fraction f of a track, with a bright head while it grows
const dibujaTraza = (ctx: Ctx, pts: P[], f: number, col: string, w = 2) => {
  const n = Math.floor(pts.length * cl(f));
  if (n < 2) return;
  ctx.beginPath(); for (let i = 0; i < n; i++) (i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]));
  glow(ctx, col, w);
  if (f < 1) luz(ctx, pts[n - 1][0], pts[n - 1][1], 10, 0.8, col);
};
const deposito = (ctx: Ctx, cx: number, cy: number, phi: number, r0: number, r1: number, ancho: number, col: string, a: number) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(${col},${a})`;
  ctx.beginPath(); ctx.arc(cx, cy, r1, phi - ancho, phi + ancho); ctx.arc(cx, cy, r0, phi + ancho, phi - ancho, true); ctx.closePath(); ctx.fill(); ctx.restore();
};
const destello = (ctx: Ctx, x: number, y: number, t: number, t0: number, r = 120, col = CREMA) => {
  const u = t - t0; if (u < 0) return;
  luz(ctx, x, y, r * (0.4 + 0.6 * eo(u / 0.4)), Math.exp(-u * 2.5) + 0.25, col);
};

// the muon: inside the solenoid it bends one way; in the iron return yoke the field reverses (CMS), so it bends back
const puntosMuon = (cx: number, cy: number, phi: number, R: number, q: number, rSol: number, rmax: number) => {
  const dentro = puntosTraza(cx, cy, phi, R, q, rSol);
  const n = dentro.length, [x1, y1] = dentro[n - 1], [x0, y0] = dentro[Math.max(0, n - 2)];
  const dir = Math.atan2(y1 - y0, x1 - x0);                         // puntosTraza starts along the angle phi
  return [...dentro, ...puntosTraza(x1, y1, dir, R * 1.9, -q, rmax, cx, cy)];
};

// ─── 1 · a particle that lives too long ───────────────────────────────────────────────────────────────────────────
const vidaLarga = (ctx: Ctx, t: number) => {
  const cx = W / 2, cy = 1120, s = 118;
  detector(ctx, cx, cy, s, eo(pr(t, 0, 0.8)));
  destello(ctx, cx, cy, t, 1.2, 130);
  sem = 7;
  // prompt charged tracks from the collision, ending at the calorimeter's face
  for (let i = 0; i < 24; i++) {
    const pts = puntosTraza(cx, cy, azar() * TAU, 120 + azar() * 900, azar() < 0.5 ? 1 : -1, s);
    dibujaTraza(ctx, pts, eo(pr(t, 1.2 + i * 0.012, 0.9)), i % 3 ? AZUL : CREMA, 1.4);
  }
  // the long-lived particle is neutral (no track, dashed): it flies ~70 cm inside the tracker and decays there
  const phi = -1.05, d = 0.55 * s, vx = cx + Math.cos(phi) * d, vy = cy + Math.sin(phi) * d;
  const u = ei(pr(t, 1.8, 2.2));
  if (u > 0) {
    ctx.save(); ctx.setLineDash([7, 8]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(phi) * d * u, cy + Math.sin(phi) * d * u); ctx.strokeStyle = `rgba(${AMBAR},0.85)`; ctx.lineWidth = 2.6; ctx.stroke(); ctx.restore();
    if (u < 1) luz(ctx, cx + Math.cos(phi) * d * u, cy + Math.sin(phi) * d * u, 16, 0.8, AMBAR);
  }
  destello(ctx, vx, vy, t, 4.0, 80, AMBAR);
  // its charged daughters start at the displaced vertex, cross the outer tracker and stop in the calorimeters
  const hijas: [number, number, number][] = [[-0.28, 2600, 1], [0.06, 4200, -1], [0.26, 1800, -1], [-0.1, 6000, 1]];
  hijas.forEach(([dp, R, q], k) => {
    const pts = puntosTraza(vx, vy, phi + dp, R, q, s, cx, cy);
    dibujaTraza(ctx, pts, eo(pr(t, 4.0 + k * 0.05, 1.0)), AMBAR, 2.4);
    const e = pts[pts.length - 1];
    if (e) deposito(ctx, cx, cy, Math.atan2(e[1] - cy, e[0] - cx), s, 1.38 * s, 0.07, VERDE, 0.45 * eo(pr(t, 4.9 + k * 0.05, 0.5)));
  });
  const al = eo(pr(t, 4.6, 0.6));
  if (al > 0) {
    ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},${0.95 * al})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(vx, vy, 16, 0, TAU); ctx.stroke(); ctx.restore();
    // a thin leader from the vertex to its label, outside the detector
    ctx.beginPath(); ctx.moveTo(vx + 14, vy - 10); ctx.lineTo(cx + 3.45 * s * 0.62, cy - 3.45 * s * 0.8); glow(ctx, AMBAR, 1, 0.6 * al);
  }
  texto(ctx, "VÉRTICE DESPLAZADO", cx + 3.45 * s * 0.62, cy - 3.45 * s * 0.8 - 40, 20, AMBAR, al);
  texto(ctx, "A ~70 CM DEL CHOQUE", cx + 3.45 * s * 0.62, cy - 3.45 * s * 0.8 - 14, 16, CREMA, 0.75 * al);
  texto(ctx, "LA PARTÍCULA NEUTRA NO DEJA TRAZA: SE VE DONDE DECAE", W / 2, 1548, 17, CREMA, 0.75 * eo(pr(t, 5.2, 0.6)), "center", 0.15);
  cabeza(ctx, t, "UNA PARTÍCULA|QUE VIVE|DEMASIADO", "PARTÍCULAS DE VIDA LARGA\nEL TEMA DE SU DOCTORADO");
  hud(ctx, 1, "REEL · 60–90 S", "");
};
// ─── 2 · what happens in an LHC collision ─────────────────────────────────────────────────────────────────────────
const colision = (ctx: Ctx, t: number) => {
  const cx = W / 2, cy = 1130, s = 122;
  detector(ctx, cx, cy, s, eo(pr(t, 0, 0.8)));
  // the beams run through the screen (transverse view): the bunches arrive as a glow that gathers at the centre
  const llega = ei(pr(t, 0.3, 1.1));
  if (t < 1.45) for (let k = 0; k < 3; k++) luz(ctx, cx, cy, (90 - 70 * llega) * (1 + k * 0.6), (0.25 + 0.5 * llega) / (k + 1), AMBAR);
  destello(ctx, cx, cy, t, 1.4, 150);
  sem = 21;
  for (const [j, jet] of [-0.9, -0.9 + Math.PI].entries()) {
    for (let i = 0; i < 14; i++) dibujaTraza(ctx, puntosTraza(cx, cy, jet + (azar() - 0.5) * 0.5, 300 + azar() * 2500, azar() < 0.5 ? 1 : -1, s), eo(pr(t, 1.4 + i * 0.015, 0.8)), i % 2 ? CREMA : AZUL, 1.4);
    deposito(ctx, cx, cy, jet, s, 1.38 * s, 0.2, VERDE, 0.35 * eo(pr(t, 2.1 + j * 0.1, 0.6)));
    deposito(ctx, cx, cy, jet, 1.42 * s, 2.05 * s, 0.26, AZUL, 0.3 * eo(pr(t, 2.4 + j * 0.1, 0.6)));
  }
  for (let i = 0; i < 16; i++) dibujaTraza(ctx, puntosTraza(cx, cy, azar() * TAU, 90 + azar() * 260, azar() < 0.5 ? 1 : -1, 0.9 * s), eo(pr(t, 1.4, 0.7)), CREMA, 1);
  // the muon crosses everything; its curvature flips in the return yoke
  dibujaTraza(ctx, puntosMuon(cx, cy, 0.35, 700, 1, 2.15 * s, 3.4 * s), eo(pr(t, 1.6, 2.2)), MAGENTA, 2.6);
  texto(ctx, "EL MUON CAMBIA DE CURVA FUERA DEL IMÁN", W / 2, 1548, 17, MAGENTA, 0.85 * eo(pr(t, 3.9, 0.6)), "center", 0.15);
  cabeza(ctx, t, "¿QUÉ PASA|EN UNA COLISIÓN?", "DOS CHORROS · UN MUON · 13,6 TeV");
  hud(ctx, 2, "REEL · 60–90 S", "");
};
// ─── 3 · 91 km underground ────────────────────────────────────────────────────────────────────────────────────────
const fcc = (ctx: Ctx, t: number) => {
  // to scale: FCC 90,7 km of circumference (14,4 km radius, ~655 km² inside); LHC 26,7 km; Santiago's urban area
  // (~640 km²) as an ellipse 26 × 32 km, longer north–south
  const kmpx = 17, cx = W / 2, cy = 1120;
  ctx.save(); ctx.strokeStyle = `rgba(${CREMA},${0.05 * eo(pr(t, 0, 1))})`; ctx.lineWidth = 1;
  for (let x = cx % (kmpx * 5); x < W; x += kmpx * 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = cy % (kmpx * 5); y < H; y += kmpx * 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
  const rF = (90.7 / TAU) * kmpx, rL = (26.7 / TAU) * kmpx;
  const aS = eo(pr(t, 0.4, 0.8));
  ctx.save(); ctx.globalAlpha = aS; ctx.beginPath(); ctx.ellipse(cx, cy, 13 * kmpx, 16 * kmpx, 0, 0, TAU);
  ctx.fillStyle = `rgba(${CREMA},0.04)`; ctx.fill(); ctx.strokeStyle = `rgba(${CREMA},0.5)`; ctx.setLineDash([7, 9]); ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
  texto(ctx, "SANTIAGO · ~640 KM² URBANOS", cx, cy + 16 * kmpx + 52, 19, CREMA, 0.75 * aS);
  const lx = cx - rF + rL + 40, ly = cy + 30;
  const uL = ei(pr(t, 1.3, 1.2));
  if (uL > 0) { ctx.beginPath(); ctx.arc(lx, ly, rL, -Math.PI / 2, -Math.PI / 2 + TAU * uL); glow(ctx, AZUL, 2.6); }
  texto(ctx, "LHC · 26,7 KM", lx, ly + rL + 36, 18, AZUL, eo(pr(t, 2.3, 0.5)));
  const uF = ei(pr(t, 2.6, 2.2));
  if (uF > 0) { ctx.beginPath(); ctx.arc(cx, cy, rF, -Math.PI / 2, -Math.PI / 2 + TAU * uF); glow(ctx, AMBAR, 3.4); }
  texto(ctx, "FCC · 90,7 KM · ~655 KM²", cx, cy - Math.max(rF, 16 * kmpx) - 30, 22, AMBAR, eo(pr(t, 4.5, 0.5)));
  for (let k = 0; k < 3; k++) {
    if (uL >= 1) { const a = -Math.PI / 2 + (t - 2.5) * 2.2 + (k * TAU) / 3; luz(ctx, lx + Math.cos(a) * rL, ly + Math.sin(a) * rL, 20, 0.9, AZUL); }
    if (uF >= 1) { const a = -Math.PI / 2 + (t - 4.8) * 0.8 + (k * TAU) / 3; luz(ctx, cx + Math.cos(a) * rF, cy + Math.sin(a) * rF, 28, 0.95, AMBAR); }
  }
  ctx.beginPath(); ctx.moveTo(110, 1505); ctx.lineTo(110 + 10 * kmpx, 1505); glow(ctx, CREMA, 1.5, 0.8 * aS);
  texto(ctx, "10 KM", 110, 1537, 17, CREMA, 0.7 * aS, "left");
  cabeza(ctx, t, "91 KM|BAJO TIERRA", "EL FUTURO COLISIONADOR CIRCULAR\nENCIERRA UN ÁREA COMO LA DE SANTIAGO", 100);
  hud(ctx, 3, "REEL · 60 S", "A ESCALA");
};
// ─── 4 · what a detector sees ─────────────────────────────────────────────────────────────────────────────────────
const loQueVe = (ctx: Ctx, t: number) => {
  // the same event twice: as it happens (neutral particles dashed: they leave no track), then as it is recorded:
  // hits on the tracker layers, deposits in the calorimeters (photons too), and the neutrino only as missing energy
  const cx = W / 2, cy = 1090, s = 120;
  const cambia = ei(pr(t, 4.0, 1.0));
  detector(ctx, cx, cy, s, 0.35 + 0.65 * cambia);
  destello(ctx, cx, cy, t, 0.8, 140);
  sem = 33;
  for (let i = 0; i < 18; i++) {
    const phi = azar() * TAU, R = 150 + azar() * 1600, q = azar() < 0.5 ? 1 : -1;
    const f = eo(pr(t, 0.8 + i * 0.03, 1.2));
    const foton = i === 0 || i === 10, neutrino = i === 5;
    if (foton || neutrino) {
      const L = (foton ? 1.0 : 3.4) * s, col = foton ? VERDE : MAGENTA, a = 0.85 * (1 - cambia);
      if (a > 0.01) { ctx.save(); ctx.setLineDash([8, 9]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(phi) * L * f, cy + Math.sin(phi) * L * f); ctx.strokeStyle = `rgba(${col},${a})`; ctx.lineWidth = 1.9; ctx.stroke(); ctx.restore(); }
      if (foton) deposito(ctx, cx, cy, phi, s, 1.38 * s, 0.05, VERDE, 0.55 * eo(pr(t, 4.8, 0.5)));
      if (neutrino && cambia > 0) {
        // missing transverse energy: an arrow along the neutrino, drawn only from the imbalance
        const ae = eo(pr(t, 5.4, 0.6)), L2 = 2.6 * s;
        ctx.save(); ctx.setLineDash([12, 8]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(phi) * L2, cy + Math.sin(phi) * L2); ctx.strokeStyle = `rgba(${AMBAR},${0.9 * ae})`; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        const hx = cx + Math.cos(phi) * L2, hy = cy + Math.sin(phi) * L2;
        ctx.save(); ctx.fillStyle = `rgba(${AMBAR},${0.95 * ae})`; ctx.beginPath(); ctx.moveTo(hx + Math.cos(phi) * 18, hy + Math.sin(phi) * 18); ctx.lineTo(hx + Math.cos(phi + 2.5) * 14, hy + Math.sin(phi + 2.5) * 14); ctx.lineTo(hx + Math.cos(phi - 2.5) * 14, hy + Math.sin(phi - 2.5) * 14); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      continue;
    }
    const pts = puntosTraza(cx, cy, phi, R, q, s);
    ctx.save(); ctx.globalAlpha = 1 - cambia; dibujaTraza(ctx, pts, f, CREMA, 1.5); ctx.restore();
    if (cambia > 0) {
      [0.06, 0.09, 0.12, 0.15, 0.2, 0.275, 0.35, 0.425, 0.5, 0.575, 0.65, 0.725, 0.8, 0.875, 0.95].forEach((r, k) => {
        const p = pts.find(([x, y]) => Math.hypot(x - cx, y - cy) >= r * s);
        if (p) luz(ctx, p[0], p[1], 7, cambia * eo(pr(t, 4.2 + k * 0.03, 0.3)), AZUL);
      });
      const e = pts[pts.length - 1]; if (e) deposito(ctx, cx, cy, Math.atan2(e[1] - cy, e[0] - cx), s, 1.38 * s, 0.06, VERDE, 0.45 * eo(pr(t, 4.8, 0.5)));
    }
  }
  texto(ctx, "LO QUE OCURRE", W / 2, 1525, 24, CREMA, 0.95 * (1 - cambia) * eo(pr(t, 1, 0.5)));
  texto(ctx, "LAS PARTÍCULAS NEUTRAS NO DEJAN TRAZA", W / 2, 1558, 17, MAGENTA, 0.85 * (1 - cambia) * eo(pr(t, 2, 0.5)), "center", 0.18);
  texto(ctx, "LO QUE QUEDA REGISTRADO", W / 2, 1525, 24, AMBAR, 0.95 * cambia);
  texto(ctx, "PUNTOS · DEPÓSITOS · ENERGÍA FALTANTE (EL NEUTRINO)", W / 2, 1558, 16, CREMA, 0.8 * eo(pr(t, 5.4, 0.5)), "center", 0.12);
  cabeza(ctx, t, "LO QUE VE|UN DETECTOR", "MISMO EVENTO · DOS MIRADAS");
  hud(ctx, 4, "REEL · 60 S", "");
};
// ─── 5 · everything we know ───────────────────────────────────────────────────────────────────────────────────────
const modeloEstandar = (ctx: Ctx, t: number) => {
  const filas: [string, string, string][][] = [
    [["u", "ARRIBA", AMBAR], ["c", "ENCANTO", AMBAR], ["t", "TOP", AMBAR], ["g", "GLUON", AZUL]],
    [["d", "ABAJO", AMBAR], ["s", "EXTRAÑO", AMBAR], ["b", "BOTTOM", AMBAR], ["γ", "FOTÓN", AZUL]],
    [["e", "ELECTRÓN", VERDE], ["μ", "MUON", VERDE], ["τ", "TAU", VERDE], ["Z", "BOSÓN Z", AZUL]],
    [["νe", "NEUTRINO e", VERDE], ["νμ", "NEUTRINO μ", VERDE], ["ντ", "NEUTRINO τ", VERDE], ["W", "BOSÓN W", AZUL]],
  ];
  const c = 158, g = 14, x0 = (W - (5 * c + 4 * g)) / 2, y0 = 800;
  const celda = (x: number, y: number, sym: string, nom: string, col: string, a: number, vacia = false) => {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    if (vacia) { ctx.setLineDash([9, 9]); ctx.strokeStyle = `rgba(${col},0.85)`; } else { ctx.fillStyle = `rgba(${col},0.08)`; ctx.fillRect(x, y, c, c); ctx.strokeStyle = `rgba(${col},0.75)`; }
    ctx.lineWidth = 2; ctx.strokeRect(x, y, c, c); ctx.restore();
    ctx.save(); ctx.font = `700 ${sym.length > 1 ? 52 : 68}px "${GROT}"`; ctx.textAlign = "center"; ctx.fillStyle = `rgba(${CREMA},${0.97 * a})`; ctx.fillText(sym, x + c / 2, y + c / 2 + 20); ctx.restore();
    texto(ctx, nom, x + c / 2, y + c - 16, 12, col, 0.9 * a, "center", 0.14);
  };
  let k = 0;
  filas.forEach((fila, r) => fila.forEach(([sym, nom, col], j) => { celda(x0 + j * (c + g), y0 + r * (c + g), sym, nom, col, eo(pr(t, 0.9 + k * 0.17, 0.4))); k++; }));
  // the Higgs, last, in a fifth column; the empty cell under it, pulsing
  const xH = x0 + 4 * (c + g), aH = eo(pr(t, 4.0, 0.5));
  celda(xH, y0, "H", "HIGGS", CREMA, aH);
  if (aH > 0) luz(ctx, xH + c / 2, y0 + c / 2, 150 * (0.6 + 0.4 * Math.exp(-(t - 4.0) * 2)), 0.4 * aH, CREMA);
  const aQ = eo(pr(t, 5.0, 0.6)) * (0.75 + 0.25 * Math.sin((t - 5) * 4));
  celda(xH, y0 + c + g, "?", "¿MATERIA OSCURA?", MAGENTA, aQ, true);
  texto(ctx, "QUARKS", x0 + 1.5 * c + g, y0 - 26, 19, AMBAR, eo(pr(t, 1, 0.5)), "center", 0.3);
  texto(ctx, "FUERZAS", x0 + 3 * (c + g) + c / 2, y0 - 26, 17, AZUL, eo(pr(t, 1.6, 0.5)), "center", 0.3);
  cabeza(ctx, t, "TODO LO QUE|CONOCEMOS", "EL MODELO ESTÁNDAR EN SIMULACIONES\nY POR QUÉ SABEMOS QUE FALTA ALGO");
  hud(ctx, 5, "CLASE · 10–20 MIN", "");
};
// ─── 6 · how a particle is discovered ─────────────────────────────────────────────────────────────────────────────
const higgs = (ctx: Ctx, t: number) => {
  // a realistic diphoton picture: the signal is a few per cent of the background (S/B ≈ 4 % at the peak, σ ≈ 1,7 GeV),
  // invisible by eye on the main plot; the panel below (data − fitted background) is where it appears as data pile up
  const x0 = 150, x1 = 950, y0 = 1180, y1 = 820, r0 = 1250, r1 = 1430;
  const X = (m: number) => x0 + ((m - 100) / 60) * (x1 - x0);
  const fondo = (m: number) => 5200 * Math.exp(-(m - 100) / 22);
  const senal = (m: number) => 0.045 * fondo(125) * Math.exp(-0.5 * ((m - 125) / 1.7) ** 2);
  const Y = (n: number) => y0 - (n / 5600) * (y0 - y1);
  const RY = (d: number) => (r0 + r1) / 2 - (d / 260) * ((r1 - r0) / 2);
  const aE = eo(pr(t, 0.6, 0.6));
  ctx.save(); ctx.strokeStyle = `rgba(${CREMA},${0.5 * aE})`; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x0, y1 - 20); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, r0); ctx.lineTo(x0, r1); ctx.stroke();
  ctx.setLineDash([6, 8]); ctx.strokeStyle = `rgba(${CREMA},${0.3 * aE})`; ctx.beginPath(); ctx.moveTo(x0, RY(0)); ctx.lineTo(x1, RY(0)); ctx.stroke(); ctx.restore();
  for (const m of [100, 120, 140, 160]) texto(ctx, String(m), X(m), r1 + 34, 18, CREMA, 0.6 * aE);
  texto(ctx, "MASA DE DOS FOTONES (GeV)", W / 2, r1 + 72, 18, CREMA, 0.7 * aE);
  texto(ctx, "DATOS − FONDO", x0 + 12, r0 + 4, 16, AMBAR, 0.9 * aE, "left", 0.2);
  // events pile up: the error bars shrink like 1/√N
  const f = 0.03 + 0.97 * ei(pr(t, 1.0, 4.6));
  sem = 5;
  for (let m = 100.5; m < 160; m += 1) {
    const n = fondo(m) + senal(m), z = (azar() + azar() + azar() - 1.5) * 1.4, e = Math.sqrt(n / f), v = n + z * e;
    luz(ctx, X(m), Y(v), 9, 0.95 * aE, CREMA);
    ctx.beginPath(); ctx.moveTo(X(m), Y(v - e)); ctx.lineTo(X(m), Y(v + e)); glow(ctx, CREMA, 1, 0.4 * aE);
    const dv = v - fondo(m);
    if (Math.abs(dv) < 255) { luz(ctx, X(m), RY(dv), 8, 0.95 * aE, CREMA); ctx.beginPath(); ctx.moveTo(X(m), RY(Math.max(-260, dv - e))); ctx.lineTo(X(m), RY(Math.min(260, dv + e))); glow(ctx, CREMA, 1, 0.4 * aE); }
  }
  const aF = ei(pr(t, 5.6, 0.9));
  if (aF > 0) {
    ctx.beginPath(); for (let m = 100; m <= 100 + 60 * aF; m += 0.25) { const x = X(m), y = Y(fondo(m)); if (m === 100) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.setLineDash([8, 8]); glow(ctx, AZUL, 1.8, 0.85); ctx.setLineDash([]);
    ctx.beginPath(); for (let m = 100; m <= 100 + 60 * aF; m += 0.25) { const x = X(m), y = RY(senal(m)); if (m === 100) ctx.moveTo(x, y); else ctx.lineTo(x, y); } glow(ctx, AMBAR, 2.6);
  }
  const aP = eo(pr(t, 6.3, 0.5));
  luz(ctx, X(125), RY(senal(125)), 70, 0.45 * aP, AMBAR);
  texto(ctx, "125 GeV", X(125), RY(senal(125)) - 40, 24, AMBAR, aP);
  texto(ctx, "FONDO", X(150), Y(fondo(150)) - 26, 16, AZUL, 0.9 * aF);
  texto(ctx, `EVENTOS SIMULADOS · ${Math.round(f * 100)} %`, W / 2, y1 - 50, 18, CREMA, 0.7 * aE);
  cabeza(ctx, t, "CÓMO SE|DESCUBRE UNA|PARTÍCULA", "DEL RUIDO A UN DESCUBRIMIENTO\nEL BOSÓN DE HIGGS · MONTECARLO", 80);
  hud(ctx, 6, "CLASE · 10–20 MIN", "");
};
// ─── 7 · a Chilean physicist at CERN ──────────────────────────────────────────────────────────────────────────────
const historia = (ctx: Ctx, t: number) => {
  // a slowly turning globe of meridians; a line of light from Santiago to Geneva; a collision where it lands
  const cx = W / 2, cy = 1150, R = 380, giro = t * 0.12;
  ctx.save(); ctx.strokeStyle = `rgba(${CREMA},${0.14 * eo(pr(t, 0, 1))})`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  for (let k = 0; k < 9; k++) { const a = ((k / 9) * Math.PI + giro) % Math.PI; ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(Math.cos(a)) * R, R, 0, 0, TAU); ctx.stroke(); }
  for (let k = -3; k <= 3; k++) { const y = cy + (k / 4) * R, w = Math.sqrt(Math.max(0, R * R - (y - cy) ** 2)); ctx.beginPath(); ctx.moveTo(cx - w, y); ctx.lineTo(cx + w, y); ctx.stroke(); }
  ctx.restore();
  const scl: P = [cx - 120, cy + 260], gva: P = [cx + 120, cy - 180];
  luz(ctx, scl[0], scl[1], 34, 0.9 * eo(pr(t, 0.8, 0.5)), AMBAR);
  texto(ctx, "SANTIAGO", scl[0], scl[1] + 56, 20, AMBAR, eo(pr(t, 0.9, 0.5)));
  const u = ei(pr(t, 1.4, 2.8));
  if (u > 0) {
    ctx.beginPath(); const n = 120;
    let px = 0, py = 0;
    for (let i = 0; i <= n * u; i++) {
      const s = i / n, a = 1 - s;
      px = a * a * a * scl[0] + 3 * a * a * s * (scl[0] - 260) + 3 * a * s * s * (gva[0] - 300) + s * s * s * gva[0];
      py = a * a * a * scl[1] + 3 * a * a * s * (cy - 40) + 3 * a * s * s * (gva[1] - 200) + s * s * s * gva[1];
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    glow(ctx, AMBAR, 2.4);
    if (u < 1) luz(ctx, px, py, 22, 0.9, AMBAR);
  }
  destello(ctx, gva[0], gva[1], t, 4.2, 120);
  sem = 3;
  for (let i = 0; i < 14; i++) dibujaTraza(ctx, puntosTraza(gva[0], gva[1], azar() * TAU, 40 + azar() * 220, azar() < 0.5 ? 1 : -1, 110), eo(pr(t, 4.2, 0.9)), i % 2 ? AZUL : CREMA, 1.3);
  texto(ctx, "GINEBRA · CERN", gva[0], gva[1] - 140, 20, CREMA, eo(pr(t, 4.6, 0.5)));
  cabeza(ctx, t, "UNA FÍSICA|CHILENA|EN EL CERN", "DE LA UNIVERSIDAD AL FUTURO COLISIONADOR\nSU HISTORIA, CON IMAGEN PROPIA", 84);
  hud(ctx, 7, "MINIDOCUMENTAL · 5–8 MIN", "RETRATO · ENTREVISTA + SIMULACIONES");
};

const ESCENAS = [vidaLarga, colision, fcc, loQueVe, modeloEstandar, higgs, historia];
let listo = false;
export const VideoPropuestasReel: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => (listo ? null : delayRender("fuentes")));
  const [ok, setOk] = useState(listo);
  const v = Number((getInputProps() as { v?: number }).v ?? 1);
  useLayoutEffect(() => {
    if (listo) return;
    Promise.all([
      loadFont({ family: GROT, url: staticFile("fonts/grotesk-700.woff2"), weight: "700" }),
      loadFont({ family: MONO, url: staticFile("fonts/plex-500.woff2"), weight: "500" }),
    ]).then(() => { listo = true; setOk(true); if (h) continueRender(h); });
  }, [h]);
  useLayoutEffect(() => {
    if (!ok || !ref.current) return;
    const t = frame / PROP_FPS;
    const ctx = ref.current.getContext("2d")!;
    ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
    ESCENAS[v - 1](ctx, t);
    // fade in from black, fade out at the end
    const neg = Math.max(1 - eo(pr(t, 0, 0.4)), ei(pr(t, PROP_DUR - 0.7, 0.7)));
    if (neg > 0.001) { ctx.fillStyle = `rgba(2,3,6,${neg})`; ctx.fillRect(0, 0, W, H); }
    const pp = postProceso(ctx.canvas, W, H, { px: 1, semilla: frame % 97, bloom: 0.38, expo: 0.92, aberr: 0.03, vineta: 0.6, grano: 0.05, scan: 0.18, curva: 0, esq: 0.03, impacto: 0, ruido: 0.5, flicker: 0, lineaY: -1, lineaA: 0, grade: 1.8, tiempo: t, halo: 0.75 });
    if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
  }, [frame, ok, v]);
  return <AbsoluteFill style={{ backgroundColor: "#020306" }}><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
