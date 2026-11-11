import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { VideoCap2 } from "./VideoCap2";
import K from "./cap2.json";
import { Rotulo } from "./RotuloReel";

// Episode 2 for Reels / Shorts / TikTok (1080 × 1920): chapter II, laid out for a tall frame (cap2.ts, VT), as one
// timeline cut into parts of under three minutes, as VideoReelEp1. The cuts fall in silences between sentences: the
// chapter lasts 531.9 s, so three parts of at most 180 s leave little room (voice ends 173.75 / next 175.35; voice
// ends 354.06 / next 356.66).
const FPS = 30;
export const CORTES_EP2 = [0, 5238 / FPS, 10629 / FPS];   // frames 5238 (174.6 s) and 10629 (354.3 s)
export const TOTAL_REEL_EP2 = Math.round(K.total * FPS);
const FIN = TOTAL_REEL_EP2 / FPS;

export const VideoReelEp2: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const n = CORTES_EP2.length;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <VideoCap2 />
      {CORTES_EP2.map((c, k) => {
        const fin = k + 1 < n ? CORTES_EP2[k + 1] : FIN;
        return (
          <React.Fragment key={k}>
            <Rotulo t={t} t0={c + 0.4} t1={c + 4.4} arriba="LA FRONTERA · EPISODIO 2" abajo={`PARTE ${k + 1} DE ${n}`} posicion="arriba" />
            <Rotulo t={t} t0={fin - 4.2} t1={fin - 0.2} arriba={k + 1 < n ? "CONTINÚA EN" : "EL DOCUMENTAL COMPLETO, EN YOUTUBE"} abajo={k + 1 < n ? `LA PARTE ${k + 2}` : "B&N LECTURES"} posicion="abajo" />
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
