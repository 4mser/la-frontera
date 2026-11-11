import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CORTES, TOTAL_REEL_EP1 } from "./VideoReelEp1";
import { CORTES_EP2, TOTAL_REEL_EP2 } from "./VideoReelEp2";
import SUBS1 from "./subs_ep1.json";
import SUBS2 from "./subs_ep2.json";
import { SANS } from "./theme";

// Burned-in subtitles for the vertical episode reels (props.ep), drawn on a transparent frame and laid over the video with ffmpeg.
// One short line at a time, in the strip under the film's labels and above the apps' captions (y ≈ 1585). The word
// being spoken lights up in amber with a glow; the words already said stay cream; the ones to come wait dimmed.
// While a part's closing label («Continúa en…») is on, the line rises out of its way.
// Times: src/subs_ep<N>.json (herramientas/subs_desde_voz.py <N>, from the voice's own word timings).
const FPS = 30;
const CREMA = "236,228,212", AMBAR = "255,190,120";
const Y_BASE = 1585, Y_ALTO = 1290;
type Linea = { t0: number; t1: number; palabras: [string, number][] };
const EPS: Record<number, { subs: Linea[]; cortes: number[]; total: number }> = {
  1: { subs: SUBS1 as Linea[], cortes: CORTES, total: TOTAL_REEL_EP1 },
  2: { subs: SUBS2 as Linea[], cortes: CORTES_EP2, total: TOTAL_REEL_EP2 },
};
export const totalSubs = (ep: number) => EPS[ep].total;
const cl = (v: number) => Math.min(1, Math.max(0, v));
const suave = (x: number) => x * x * (3 - 2 * x);

// 0 → 1 while a part's closing label is on screen (same window as VideoReelEp1's lower Rotulo), with soft edges
const alzado = (t: number, cortes: number[], FIN: number) => Math.max(0, ...cortes.map((c, k) => {
  const fin = k + 1 < cortes.length ? cortes[k + 1] : FIN;
  const a = fin - 4.2 - 0.5, b = fin - 0.2;
  return suave(cl((t - a) / 0.45)) * (1 - suave(cl((t - b) / 0.45)));
}));

export const SubtitulosReel: React.FC<{ ep: number }> = ({ ep }) => {
  const t = useCurrentFrame() / FPS;
  const E = EPS[ep], L = E.subs;
  const i = L.findIndex((l) => t >= l.t0 - 0.12 && t < l.t1 + 0.2);
  if (i < 0) return <AbsoluteFill />;
  const l = L[i];
  const entra = suave(cl((t - (l.t0 - 0.12)) / 0.16));
  const sale = 1 - suave(cl((t - l.t1) / 0.2));
  const sigue = i + 1 < L.length && L[i + 1].t0 - l.t1 < 0.05;      // the next line follows at once: no fade, a cut
  const a = entra * (sigue ? 1 : sale);
  const y = interpolate(alzado(t, E.cortes, E.total / FPS), [0, 1], [Y_BASE, Y_ALTO]) + (1 - entra) * 14;
  return (
    <AbsoluteFill>
      {/* a soft pool of night behind the line, so it reads over any picture without a hard box */}
      <div style={{ position: "absolute", left: 60, right: 60, top: y - 66, height: 132, borderRadius: 66, opacity: a * 0.9,
        background: "radial-gradient(ellipse at center, rgba(2,3,6,0.62) 0%, rgba(2,3,6,0.42) 45%, rgba(2,3,6,0) 72%)" }} />
      <div style={{ position: "absolute", left: 70, right: 70, top: y - 34, textAlign: "center", opacity: a,
        fontFamily: SANS, fontWeight: 600, fontSize: 54, lineHeight: "68px", letterSpacing: 0.3, whiteSpace: "nowrap" }}>
        {l.palabras.map(([w, ws], k) => {
          const we = k + 1 < l.palabras.length ? l.palabras[k + 1][1] : l.t1;
          const dicha = t >= ws;
          const ahora = dicha && t < we + 0.08;
          const pop = dicha ? suave(cl((t - ws) / 0.12)) : 0;
          const luz = ahora ? 1 - cl((t - we) / 0.18) : 0;
          const col = `rgb(${CREMA.split(",").map((c, j) => Math.round(+c + (+AMBAR.split(",")[j] - +c) * luz)).join(",")})`;
          return (
            <span key={k} style={{ display: "inline-block", marginRight: k + 1 < l.palabras.length ? "0.27em" : 0,
              color: col, opacity: dicha ? 1 : 0.4,
              transform: `translateY(${(1 - pop) * 6 - luz * 2}px) scale(${1 + 0.05 * luz})`,
              textShadow: `0 2px 14px rgba(0,0,0,0.85), 0 0 ${10 + 14 * luz}px rgba(${AMBAR},${0.55 * luz})` }}>{w}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
