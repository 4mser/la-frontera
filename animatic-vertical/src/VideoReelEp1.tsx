import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { TOTAL_APERTURA, VideoApertura } from "./VideoApertura";
import { VideoCap1p } from "./VideoCap1p";
import K from "./cap1p.json";
import { Rotulo } from "./RotuloReel";

// Episode 1 for Reels / Shorts / TikTok (1080 × 1920): the opening and chapter I, laid out for a tall frame
// (formato.json 1080 × 1920), as one timeline; it is cut into parts of under three minutes. Each part opens with its
// number and closes with where it goes on, in the strip above the apps' captions.
const FPS = 30;
const NEGRO = 9;                                   // 0.3 s of black between the opening and the chapter, as in the film
export const INICIO_CAP1 = TOTAL_APERTURA + NEGRO;
// where each part starts (s): the opening; the chapter; the chapter from the infinite snowflake (in the 2-s silence between two sentences)
export const CORTES = [0, INICIO_CAP1 / FPS, INICIO_CAP1 / FPS + 147.2];
export const TOTAL_REEL_EP1 = INICIO_CAP1 + Math.round(K.total * FPS);
const FIN = TOTAL_REEL_EP1 / FPS;

export const VideoReelEp1: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const n = CORTES.length;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence durationInFrames={TOTAL_APERTURA}><VideoApertura /></Sequence>
      <Sequence from={INICIO_CAP1}><VideoCap1p /></Sequence>
      {CORTES.map((c, k) => {
        const fin = k + 1 < n ? CORTES[k + 1] : FIN;
        return (
          <React.Fragment key={k}>
            <Rotulo t={t} t0={c + 0.4} t1={c + 4.4} arriba="LA FRONTERA · EPISODIO 1" abajo={`PARTE ${k + 1} DE ${n}`} posicion="arriba" />
            <Rotulo t={t} t0={fin - 4.2} t1={fin - 0.2} arriba={k + 1 < n ? "CONTINÚA EN" : "EL DOCUMENTAL COMPLETO, EN YOUTUBE"} abajo={k + 1 < n ? `LA PARTE ${k + 2}` : "B&N LECTURES"} posicion="abajo" />
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
