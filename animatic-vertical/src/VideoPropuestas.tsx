import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, getInputProps, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { postProceso } from "../../../teaser-v1b/src/gl";

// Seven key frames (1920 × 1080) for video ideas with a particle physicist, in the language of «La frontera»:
// deep black, luminous strokes, the HUD (corners, Plex Mono labels), Space Grotesk titles, the film's retro post.
// The physics drawn is right: charged tracks are circles in the transverse view (radius ∝ pT), detector layers in
// their real order (pixels, tracker, ECAL, HCAL, solenoid, muon chambers), LHC 26.7 km, FCC 90.7 km, mH = 125 GeV.
const W = 1920, H = 1080;
const GROT = "Space Grotesk", MONO = "IBM Plex Mono";
const CREMA = "255,244,222", AMBAR = "255,190,120", AZUL = "120,190,255", MAGENTA = "255,110,200", VERDE = "140,255,190";
type Ctx = CanvasRenderingContext2D;
type P = [number, number];
const TAU = Math.PI * 2;
let sem = 1;
const azar = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
const sp = (c: Ctx, v: number) => { (c as unknown as { letterSpacing: string }).letterSpacing = `${v}px`; };

const glow = (ctx: Ctx, col: string, w: number, a = 1) => {
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `rgba(${col},${0.08 * a})`; ctx.lineWidth = w * 7; ctx.stroke();
  ctx.strokeStyle = `rgba(${col},${0.22 * a})`; ctx.lineWidth = w * 2.6; ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(${col},${0.95 * a})`; ctx.lineWidth = w; ctx.stroke();
  ctx.restore();
};
const luz = (ctx: Ctx, x: number, y: number, r: number, a: number, col = AMBAR) => {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.25, `rgba(${col},${0.55 * a})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
};
const texto = (ctx: Ctx, s: string, x: number, y: number, tam: number, col: string, fam = MONO, peso = 500, esp = 0.25, alin: CanvasTextAlign = "left", a = 0.9) => {
  ctx.save(); ctx.font = `${peso} ${tam}px "${fam}"`; sp(ctx, tam * esp); ctx.textAlign = alin;
  ctx.fillStyle = `rgba(${col},${a})`; ctx.fillText(s, x, y); ctx.restore();
};
const titulo = (ctx: Ctx, s: string, x: number, y: number, tam: number, alin: CanvasTextAlign = "left") => {
  ctx.save(); ctx.font = `700 ${tam}px "${GROT}"`; sp(ctx, tam * 0.06); ctx.textAlign = alin;
  ctx.globalCompositeOperation = "lighter"; ctx.filter = `blur(${tam * 0.1}px)`; ctx.fillStyle = `rgba(${CREMA},0.18)`; ctx.fillText(s, x, y);
  ctx.filter = "none"; ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = `rgba(${CREMA},0.97)`; ctx.fillText(s, x, y);
  ctx.restore();
};
const hud = (ctx: Ctx, n: number, formato: string, dato: string) => {
  const m = 40, b = 26;
  ctx.save(); ctx.strokeStyle = `rgba(${CREMA},0.5)`; ctx.lineWidth = 1.5; ctx.beginPath();
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { ctx.moveTo(x, y + sy * b); ctx.lineTo(x, y); ctx.lineTo(x + sx * b, y); }
  ctx.stroke(); ctx.restore();
  texto(ctx, `PROPUESTA ${String(n).padStart(2, "0")} / 07`, 72, 74, 17, CREMA, MONO, 500, 0.25, "left", 0.6);
  texto(ctx, formato, W - 72, 74, 17, AMBAR, MONO, 500, 0.25, "right", 0.9);
  texto(ctx, dato, W - 72, H - 64, 15, CREMA, MONO, 500, 0.25, "right", 0.55);
  texto(ctx, "B&N LECTURES", 72, H - 64, 15, CREMA, MONO, 500, 0.3, "left", 0.55);
};
const cabeza = (ctx: Ctx, t: string, sub: string, x = 110, y = 300, tam = 76) => {
  const ls = t.split("|");
  ls.forEach((l, i) => titulo(ctx, l, x, y + i * tam * 1.05, tam));
  const yb = y + (ls.length - 1) * tam * 1.05 + tam * 0.75;
  sub.split("\n").forEach((l, i) => texto(ctx, l, x + 4, yb + i * 32, 21, AMBAR, MONO, 500, 0.2, "left", 0.95));
};

// ─── a detector in the transverse view: beam pipe, pixels, tracker, ECAL, HCAL, solenoid, muon stations ────────────
const detector = (ctx: Ctx, cx: number, cy: number, s: number, a = 1) => {
  const anillo = (r: number, w: number, col: string, al: number) => { ctx.beginPath(); ctx.arc(cx, cy, r * s, 0, TAU); ctx.strokeStyle = `rgba(${col},${al * a})`; ctx.lineWidth = w; ctx.stroke(); };
  ctx.save();
  for (let i = 0; i < 4; i++) anillo(0.06 + i * 0.03, 1, CREMA, 0.35);                       // pixels
  for (let i = 0; i < 10; i++) anillo(0.2 + i * 0.075, 1, CREMA, 0.18);                     // strip tracker
  ctx.globalAlpha = a; ctx.fillStyle = `rgba(${VERDE},0.06)`; ctx.beginPath(); ctx.arc(cx, cy, 1.38 * s, 0, TAU); ctx.arc(cx, cy, 1.0 * s, 0, TAU, true); ctx.fill(); // ECAL
  anillo(1.0, 1.2, VERDE, 0.4); anillo(1.38, 1.2, VERDE, 0.4);
  ctx.fillStyle = `rgba(${AZUL},0.05)`; ctx.beginPath(); ctx.arc(cx, cy, 2.05 * s, 0, TAU); ctx.arc(cx, cy, 1.42 * s, 0, TAU, true); ctx.fill(); // HCAL
  anillo(1.42, 1.2, AZUL, 0.35); anillo(2.05, 1.2, AZUL, 0.35);
  anillo(2.15, 3, CREMA, 0.25);                                                               // solenoid
  for (let k = 0; k < 4; k++) { const r = 2.45 + k * 0.32; for (let j = 0; j < 12; j++) { const a0 = (j / 12) * TAU + 0.03, a1 = a0 + TAU / 12 - 0.06; ctx.beginPath(); ctx.arc(cx, cy, r * s, a0, a1); ctx.strokeStyle = `rgba(${MAGENTA},${0.3 * a})`; ctx.lineWidth = 6; ctx.stroke(); } }
  ctx.restore();
};
// a charged track from the origin (ox, oy): a circle of radius R (∝ pT) bending with sign q, out to radius rmax
const traza = (ctx: Ctx, ox: number, oy: number, phi: number, R: number, q: number, rmax: number, col: string, w = 2, cx = ox, cy = oy) => {
  ctx.beginPath();
  const pts: P[] = [];
  for (let u = 0; u < 3; u += 0.004) {
    const th = u * q;
    const x = ox + R * (Math.sin(phi + th) - Math.sin(phi)) * q, y = oy - R * (Math.cos(phi + th) - Math.cos(phi)) * q;
    if (Math.hypot(x - cx, y - cy) > rmax) break;
    pts.push([x, y]);
  }
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  glow(ctx, col, w);
  return pts[pts.length - 1] ?? [ox, oy];
};
const deposito = (ctx: Ctx, cx: number, cy: number, phi: number, r0: number, r1: number, ancho: number, col: string, a: number) => {
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(${col},${a})`;
  ctx.beginPath(); ctx.arc(cx, cy, r1, phi - ancho, phi + ancho); ctx.arc(cx, cy, r0, phi + ancho, phi - ancho, true); ctx.closePath(); ctx.fill(); ctx.restore();
};

// ─── the seven frames ─────────────────────────────────────────────────────────────────────────────────────────────
const vidaLarga = (ctx: Ctx) => {
  const cx = 1260, cy = 560, s = 150;
  detector(ctx, cx, cy, s);
  sem = 7;
  for (let i = 0; i < 26; i++) traza(ctx, cx, cy, azar() * TAU, 120 + azar() * 900, azar() < 0.5 ? 1 : -1, 1.0 * s + azar() * 0.3 * s, i % 3 ? AZUL : CREMA, 1.3);
  luz(ctx, cx, cy, 34, 1, CREMA);
  // the long-lived particle: invisible, a dashed path, then a displaced vertex far from the collision
  const phi = -0.62, d = 1.75 * s, vx = cx + Math.cos(phi) * d, vy = cy + Math.sin(phi) * d;
  ctx.save(); ctx.setLineDash([10, 12]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(vx, vy); ctx.strokeStyle = `rgba(${AMBAR},0.7)`; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  for (const [dp, R, q] of [[-0.32, 2600, 1], [0.08, 4200, -1], [0.3, 1800, -1], [-0.12, 6000, 1]] as [number, number, number][]) traza(ctx, vx, vy, phi + dp, R, q, 3.6 * s, AMBAR, 2.2, cx, cy);
  luz(ctx, vx, vy, 46, 1, AMBAR);
  ctx.save(); ctx.strokeStyle = `rgba(${AMBAR},0.9)`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(vx, vy, 26, 0, TAU); ctx.stroke(); ctx.restore();
  texto(ctx, "VÉRTICE DESPLAZADO", vx + 40, vy - 34, 17, AMBAR, MONO, 500, 0.25, "left", 1);
  texto(ctx, "AQUÍ DECAYÓ, METROS DESPUÉS", vx + 40, vy - 10, 15, CREMA, MONO, 500, 0.25, "left", 0.7);
  texto(ctx, "COLISIÓN", cx - 26, cy + 58, 15, CREMA, MONO, 500, 0.25, "right", 0.7);
  cabeza(ctx, "UNA PARTÍCULA|QUE VIVE|DEMASIADO", "PARTÍCULAS DE VIDA LARGA\nEL TEMA DE SU DOCTORADO", 110, 330);
  hud(ctx, 1, "REEL · 60–90 S", "VISTA TRANSVERSAL · SIMULACIÓN PROPIA");
};
const colision = (ctx: Ctx) => {
  const cx = W / 2, cy = 560, s = 158;
  detector(ctx, cx, cy, s);
  sem = 21;
  // a two-jet event: two back-to-back cones of tracks, energy in the calorimeters, a muon reaching the outer stations
  for (const jet of [0.35, 0.35 + Math.PI]) {
    for (let i = 0; i < 14; i++) {
      const phi = jet + (azar() - 0.5) * 0.5;
      traza(ctx, cx, cy, phi, 300 + azar() * 2500, azar() < 0.5 ? 1 : -1, 1.0 * s, i % 2 ? CREMA : AZUL, 1.4);
    }
    deposito(ctx, cx, cy, jet, 1.0 * s, 1.38 * s, 0.2, VERDE, 0.35);
    deposito(ctx, cx, cy, jet, 1.42 * s, 2.05 * s, 0.26, AZUL, 0.3);
  }
  for (let i = 0; i < 18; i++) traza(ctx, cx, cy, azar() * TAU, 90 + azar() * 260, azar() < 0.5 ? 1 : -1, 0.9 * s, CREMA, 1, cx, cy);
  traza(ctx, cx, cy, 2.1, 2600, 1, 3.5 * s, MAGENTA, 2.4);
  luz(ctx, cx, cy, 40, 1, CREMA);
  // the two protons coming in
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sx * 920, cy); ctx.lineTo(cx + sx * 60, cy); glow(ctx, AMBAR, 1.4, 0.6); }
  titulo(ctx, "¿QUÉ PASA EN UNA", W / 2, 170, 64, "center");
  titulo(ctx, "COLISIÓN DEL LHC?", W / 2, 245, 64, "center");
  texto(ctx, "DOS CHORROS · UN MUON · 13,6 TeV", W / 2, 296, 20, AMBAR, MONO, 500, 0.25, "center", 0.95);
  texto(ctx, "TRAZADOR", cx + 0.6 * s, cy + 1.9 * s + 160, 15, CREMA, MONO, 500, 0.25, "center", 0.0);
  [["TRAZADOR", CREMA, 0.5], ["CALORÍMETRO EM", VERDE, 1.2], ["CALORÍMETRO HADRÓNICO", AZUL, 1.75], ["CÁMARAS DE MUONES", MAGENTA, 2.9]].forEach(([n, c], i) =>
    texto(ctx, n as string, 110, 760 + i * 34, 16, c as string, MONO, 500, 0.25, "left", 0.85));
  hud(ctx, 2, "REEL · 60–90 S", "CAPAS EN SU ORDEN REAL · CURVATURA ∝ 1 / MOMENTO");
};
const fcc = (ctx: Ctx) => {
  // to scale (radius ∝ circumference): FCC 90,7 km (≈29 km across), LHC 26,7 km, over Santiago's urban area (~40 × 34 km)
  const kmpx = 19, cx = 1260, cy = 560;
  ctx.save(); ctx.strokeStyle = `rgba(${CREMA},0.05)`; ctx.lineWidth = 1;
  for (let x = cx % (kmpx * 5); x < W; x += kmpx * 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = cy % (kmpx * 5); y < H; y += kmpx * 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
  const rF = (90.7 / TAU) * kmpx, rL = (26.7 / TAU) * kmpx;
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx + 20, cy + 10, 20 * kmpx, 17 * kmpx, 0.15, 0, TAU);
  ctx.fillStyle = `rgba(${CREMA},0.03)`; ctx.fill(); ctx.strokeStyle = `rgba(${CREMA},0.4)`; ctx.setLineDash([7, 9]); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
  texto(ctx, "SANTIAGO · MANCHA URBANA", cx + 20, cy + 17 * kmpx + 50, 17, CREMA, MONO, 500, 0.25, "center", 0.65);
  ctx.beginPath(); ctx.arc(cx, cy, rF, 0, TAU); glow(ctx, AMBAR, 3.2);
  ctx.beginPath(); ctx.arc(cx - rF + rL + 40, cy + 30, rL, 0, TAU); glow(ctx, AZUL, 2.4);
  texto(ctx, "FCC · 90,7 KM", cx, cy - rF - 26, 21, AMBAR, MONO, 500, 0.25, "center", 1);
  texto(ctx, "LHC · 26,7 KM", cx - rF + rL + 40, cy + 30 + rL + 34, 17, AZUL, MONO, 500, 0.25, "center", 1);
  luz(ctx, cx + rF, cy, 34, 0.9, AMBAR); luz(ctx, cx - rF + 2 * rL + 40, cy + 30, 24, 0.8, AZUL);
  ctx.beginPath(); ctx.moveTo(110, 900); ctx.lineTo(110 + 10 * kmpx, 900); glow(ctx, CREMA, 1.5, 0.8);
  texto(ctx, "10 KM", 110, 935, 16, CREMA, MONO, 500, 0.25, "left", 0.7);
  cabeza(ctx, "91 KM|BAJO TIERRA", "EL FUTURO COLISIONADOR CIRCULAR\nDEL TAMAÑO DE SANTIAGO", 110, 360, 80);
  hud(ctx, 3, "REEL · 60 S", "ANILLOS A ESCALA · CIRCUNFERENCIAS DEL CERN");
};
const loQueVe = (ctx: Ctx) => {
  // left: what happens (every particle, even the invisible ones); right: what the detector keeps (hits and deposits)
  const s = 112;
  for (const [cx, real] of [[W * 0.3, true], [W * 0.72, false]] as [number, boolean][]) {
    const cy = 600;
    detector(ctx, cx, cy, s, real ? 0.35 : 1);
    sem = 33;
    for (let i = 0; i < 18; i++) {
      const phi = azar() * TAU, R = 150 + azar() * 1600, q = azar() < 0.5 ? 1 : -1, neutro = i % 5 === 0;
      if (real) {
        if (neutro) { ctx.save(); ctx.setLineDash([8, 9]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(phi) * 2.2 * s, cy + Math.sin(phi) * 2.2 * s); ctx.strokeStyle = `rgba(${MAGENTA},0.8)`; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore(); }
        else traza(ctx, cx, cy, phi, R, q, 1.0 * s, CREMA, 1.4);
      } else if (!neutro) {
        // the hits: a dot where each track crosses a tracker layer, then a calorimeter deposit
        const pts: P[] = [];
        for (let u = 0; u < 3; u += 0.003) { const x = cx + R * (Math.sin(phi + u * q) - Math.sin(phi)) * q, y = cy - R * (Math.cos(phi + u * q) - Math.cos(phi)) * q; if (Math.hypot(x - cx, y - cy) > s) break; pts.push([x, y]); }
        for (const r of [0.06, 0.09, 0.12, 0.15, 0.2, 0.275, 0.35, 0.425, 0.5, 0.575, 0.65, 0.725, 0.8, 0.875, 0.95]) {
          const p = pts.find(([x, y]) => Math.hypot(x - cx, y - cy) >= r * s); if (p) luz(ctx, p[0], p[1], 6, 0.9, AZUL);
        }
        const e = pts[pts.length - 1]; if (e) deposito(ctx, cx, cy, Math.atan2(e[1] - cy, e[0] - cx), 1.0 * s, 1.38 * s, 0.06, VERDE, 0.45);
      }
    }
    luz(ctx, cx, cy, 26, real ? 1 : 0.4, CREMA);
    texto(ctx, real ? "LO QUE OCURRE" : "LO QUE QUEDA REGISTRADO", cx, 300, 22, real ? CREMA : AMBAR, MONO, 500, 0.25, "center", 0.95);
  }
  texto(ctx, "LAS NEUTRAS NO DEJAN RASTRO", W * 0.3, 955, 15, MAGENTA, MONO, 500, 0.25, "center", 0.85);
  texto(ctx, "PUNTOS Y DEPÓSITOS: DE AQUÍ SE RECONSTRUYE TODO", W * 0.72, 955, 15, CREMA, MONO, 500, 0.25, "center", 0.7);
  titulo(ctx, "LO QUE VE UN DETECTOR", W / 2, 190, 64, "center");
  hud(ctx, 4, "REEL · 60 S", "MISMO EVENTO · DOS MIRADAS");
};
const modeloEstandar = (ctx: Ctx) => {
  // the Standard Model as a lit grid: quarks, leptons, bosons, the Higgs; a dashed empty cell for what is missing
  const filas: [string, string, string][][] = [
    [["u", "ARRIBA", AMBAR], ["c", "ENCANTO", AMBAR], ["t", "CIMA", AMBAR], ["g", "GLUON", AZUL], ["H", "HIGGS", CREMA]],
    [["d", "ABAJO", AMBAR], ["s", "EXTRAÑO", AMBAR], ["b", "FONDO", AMBAR], ["γ", "FOTÓN", AZUL], ["?", "MATERIA OSCURA", MAGENTA]],
    [["e", "ELECTRÓN", VERDE], ["μ", "MUON", VERDE], ["τ", "TAU", VERDE], ["Z", "BOSÓN Z", AZUL], ["", "", ""]],
    [["νe", "NEUTRINO e", VERDE], ["νμ", "NEUTRINO μ", VERDE], ["ντ", "NEUTRINO τ", VERDE], ["W", "BOSÓN W", AZUL], ["", "", ""]],
  ];
  const x0 = 880, y0 = 190, c = 150, g = 14;
  filas.forEach((fila, r) => fila.forEach(([sym, nom, col], k) => {
    if (!sym) return;
    const x = x0 + k * (c + g) + (k === 4 ? 30 : 0), y = y0 + r * (c + g);
    ctx.save();
    if (sym === "?") { ctx.setLineDash([8, 8]); ctx.strokeStyle = `rgba(${col},0.8)`; } else { ctx.fillStyle = `rgba(${col},0.07)`; ctx.fillRect(x, y, c, c); ctx.strokeStyle = `rgba(${col},0.7)`; }
    ctx.lineWidth = 1.6; ctx.strokeRect(x, y, c, c); ctx.restore();
    titulo(ctx, sym, x + c / 2, y + c / 2 + 22, sym.length > 1 ? 50 : 62, "center");
    texto(ctx, nom, x + c / 2, y + c - 16, 12, col, MONO, 500, 0.2, "center", 0.9);
    if (sym === "H") luz(ctx, x + c / 2, y + c / 2, 90, 0.35, CREMA);
  }));
  texto(ctx, "QUARKS", x0 + 1.5 * c + g, y0 - 22, 16, AMBAR, MONO, 500, 0.3, "center", 0.9);
  texto(ctx, "LEPTONES", x0 + 1.5 * c + g, y0 + 4 * (c + g) + 30, 16, VERDE, MONO, 500, 0.3, "center", 0.9);
  texto(ctx, "FUERZAS", x0 + 3 * (c + g) + c / 2, y0 - 22, 16, AZUL, MONO, 500, 0.3, "center", 0.9);
  cabeza(ctx, "TODO LO QUE|CONOCEMOS", "EL MODELO ESTÁNDAR EN SIMULACIONES\nY POR QUÉ SABEMOS QUE FALTA ALGO", 110, 420, 72);
  hud(ctx, 5, "CLASE · 10–20 MIN", "17 PARTÍCULAS · UNA CASILLA VACÍA");
};
const higgs = (ctx: Ctx) => {
  // the diphoton spectrum: a falling background of simulated events and the bump at 125 GeV
  const x0 = 760, x1 = 1780, y0 = 860, y1 = 220;
  const X = (m: number) => x0 + ((m - 100) / 60) * (x1 - x0);
  const fondo = (m: number) => 5200 * Math.exp(-(m - 100) / 22);
  const senal = (m: number) => 620 * Math.exp(-0.5 * ((m - 125) / 1.7) ** 2);
  const Y = (n: number) => y0 - (n / 5600) * (y0 - y1);
  ctx.save(); ctx.strokeStyle = `rgba(${CREMA},0.5)`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0, y1 - 20); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke(); ctx.restore();
  sem = 5;
  for (let m = 100.5; m < 160; m += 1) {
    const n = fondo(m) + senal(m), err = Math.sqrt(n) * (azar() - 0.5) * 1.6, v = n + err;
    luz(ctx, X(m), Y(v), 9, 0.9, CREMA);
    ctx.beginPath(); ctx.moveTo(X(m), Y(v - Math.sqrt(n))); ctx.lineTo(X(m), Y(v + Math.sqrt(n))); glow(ctx, CREMA, 1, 0.5);
  }
  ctx.beginPath(); for (let m = 100; m <= 160; m += 0.25) { const x = X(m), y = Y(fondo(m)); if (m === 100) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.setLineDash([8, 8]); glow(ctx, AZUL, 1.6, 0.8); ctx.setLineDash([]);
  ctx.beginPath(); for (let m = 100; m <= 160; m += 0.25) { const x = X(m), y = Y(fondo(m) + senal(m)); if (m === 100) ctx.moveTo(x, y); else ctx.lineTo(x, y); } glow(ctx, AMBAR, 2.4);
  luz(ctx, X(125), Y(fondo(125) + senal(125)) - 10, 70, 0.5, AMBAR);
  texto(ctx, "125 GeV", X(125), Y(fondo(125) + senal(125)) - 50, 22, AMBAR, MONO, 500, 0.25, "center", 1);
  for (const m of [100, 110, 120, 130, 140, 150, 160]) texto(ctx, String(m), X(m), y0 + 34, 15, CREMA, MONO, 500, 0.2, "center", 0.6);
  texto(ctx, "MASA DE DOS FOTONES (GeV)", (x0 + x1) / 2, y0 + 72, 16, CREMA, MONO, 500, 0.25, "center", 0.7);
  texto(ctx, "FONDO ESPERADO", X(150), Y(fondo(150)) - 28, 15, AZUL, MONO, 500, 0.25, "center", 0.9);
  cabeza(ctx, "CÓMO SE|DESCUBRE UNA|PARTÍCULA", "DEL RUIDO A UN DESCUBRIMIENTO\nEL BOSÓN DE HIGGS · MONTECARLO", 110, 380, 64);
  hud(ctx, 6, "CLASE · 10–20 MIN", "DATOS SIMULADOS · ILUSTRATIVO");
};
const historia = (ctx: Ctx) => {
  // a line from Santiago to Geneva over a dim globe of meridians; the collision light at the end
  const cx = 1240, cy = 560, R = 380;
  ctx.save(); ctx.strokeStyle = `rgba(${CREMA},0.12)`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(Math.cos((k / 9) * Math.PI)) * R, R, 0, 0, TAU); ctx.stroke(); }
  for (let k = -3; k <= 3; k++) { const y = cy + (k / 4) * R, w = Math.sqrt(Math.max(0, R * R - (y - cy) ** 2)); ctx.beginPath(); ctx.moveTo(cx - w, y); ctx.lineTo(cx + w, y); ctx.stroke(); }
  ctx.restore();
  const scl: P = [cx - 150, cy + 250], gva: P = [cx + 110, cy - 170];
  ctx.beginPath(); ctx.moveTo(scl[0], scl[1]); ctx.bezierCurveTo(scl[0] - 120, cy - 60, gva[0] - 260, gva[1] - 160, gva[0], gva[1]); glow(ctx, AMBAR, 2.2);
  luz(ctx, scl[0], scl[1], 30, 0.9, AMBAR); luz(ctx, gva[0], gva[1], 44, 1, CREMA);
  texto(ctx, "SANTIAGO", scl[0] + 24, scl[1] + 8, 17, AMBAR, MONO, 500, 0.25, "left", 1);
  texto(ctx, "GINEBRA · CERN", gva[0] + 30, gva[1] - 14, 17, CREMA, MONO, 500, 0.25, "left", 1);
  sem = 3;
  for (let i = 0; i < 12; i++) traza(ctx, gva[0], gva[1], azar() * TAU, 30 + azar() * 160, azar() < 0.5 ? 1 : -1, 70, i % 2 ? AZUL : CREMA, 1.1);
  cabeza(ctx, "UNA FÍSICA|CHILENA|EN EL CERN", "DE LA UNIVERSIDAD AL FUTURO COLISIONADOR\nSU HISTORIA, CON IMAGEN PROPIA", 110, 360, 76);
  hud(ctx, 7, "MINIDOCUMENTAL · 5–8 MIN", "RETRATO · ENTREVISTA + SIMULACIONES");
};

export const VideoPropuestas: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender("fuentes"));
  const v = Number((getInputProps() as { v?: number }).v ?? 1);
  useLayoutEffect(() => {
    Promise.all([
      loadFont({ family: GROT, url: staticFile("fonts/grotesk-700.woff2"), weight: "700" }),
      loadFont({ family: MONO, url: staticFile("fonts/plex-500.woff2"), weight: "500" }),
    ]).then(() => {
      const ctx = ref.current!.getContext("2d")!;
      ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, W, H);
      [vidaLarga, colision, fcc, loQueVe, modeloEstandar, higgs, historia][v - 1](ctx);
      const pp = postProceso(ctx.canvas, W, H, { px: 1, semilla: 7 * v, bloom: 0.38, expo: 0.92, aberr: 0.03, vineta: 0.6, grano: 0.05, scan: 0.18, curva: 0, esq: 0.03, impacto: 0, ruido: 0.5, flicker: 0, lineaY: -1, lineaA: 0, grade: 1.8, tiempo: v, halo: 0.75 });
      if (pp) { ctx.save(); ctx.globalCompositeOperation = "copy"; ctx.drawImage(pp, 0, 0, W, H); ctx.restore(); }
      continueRender(h);
    });
  }, [h, v]);
  return <AbsoluteFill style={{ backgroundColor: "#020306" }}><canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
