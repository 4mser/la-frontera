import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { MONO, SANS } from "./theme";

// The label that opens and closes each part of an episode reel («PARTE 2 DE 3», «CONTINÚA EN LA PARTE 3»), shared by
// VideoReelEp1 and VideoReelEp2. Its shade fades in and out on both edges (a band that ended at full strength left a
// hard line across the frame): above, from the frame's top edge down past the text; below, a soft pool around it.
const SEG_A = 170, SEG_B = 400;
const CREMA = "236,228,212", AMBAR = "255,190,120";
export const Rotulo: React.FC<{ t: number; t0: number; t1: number; arriba: string; abajo: string; posicion: "arriba" | "abajo" }> = ({ t, t0, t1, arriba, abajo, posicion }) => {
  const a = Math.min(interpolate(t, [t0, t0 + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), interpolate(t, [t1 - 0.5, t1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  if (a <= 0.01) return null;
  const y = posicion === "arriba" ? SEG_A + 30 : 1920 - SEG_B - 120;
  const sombra = posicion === "arriba"
    ? { top: 0, height: y + 270, background: "linear-gradient(rgba(2,3,6,0.85) 0%, rgba(2,3,6,0.8) 58%, rgba(2,3,6,0.4) 78%, rgba(2,3,6,0) 100%)" }
    : { top: y - 130, height: 420, background: "linear-gradient(rgba(2,3,6,0) 0%, rgba(2,3,6,0.45) 22%, rgba(2,3,6,0.82) 42%, rgba(2,3,6,0.82) 62%, rgba(2,3,6,0.45) 80%, rgba(2,3,6,0) 100%)" };
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <div style={{ position: "absolute", left: 0, right: 0, ...sombra }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: y + (posicion === "abajo" ? 40 : 0), textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 26, letterSpacing: 8, color: `rgba(${AMBAR},0.95)` }}>{arriba}</div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 52, letterSpacing: 6, marginTop: 12, color: `rgba(${CREMA},0.97)`, textShadow: `0 0 18px rgba(${CREMA},0.35)` }}>{abajo}</div>
      </div>
    </AbsoluteFill>
  );
};
