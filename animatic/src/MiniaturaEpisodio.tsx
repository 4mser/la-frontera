import React from "react";
import { AbsoluteFill, Img, getInputProps, staticFile } from "remotion";
import { SANS } from "./theme";

// YouTube thumbnail of each episode of La frontera (1280 × 720): a frame of the chapter, two very large hook lines
// (cream + amber) and the episode label. props: { ep, l1, l2, z, x, y } (z/x/y: zoom and offset of the frame, in %)
type P = { ep?: number; l1?: string; l2?: string; z?: number; x?: number; y?: number; cap?: string; br?: number };
export const MiniaturaEpisodio: React.FC = () => {
  const { ep = 1, l1 = "NO TIENE", l2 = "FONDO", z = 1.1, x = 18, y = 0, cap = "", br = 1.25 } = getInputProps() as P;
  const sombra = "0 4px 24px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.9)";
  return (
    <AbsoluteFill style={{ background: "#020306", overflow: "hidden" }}>
      <Img src={staticFile(`episodios/ep${ep}.jpg`)} style={{ position: "absolute", width: `${100 * z}%`, left: `${x - (z - 1) * 50}%`, top: `${y - (z - 1) * 50}%`,
        filter: `brightness(${br}) saturate(1.3) contrast(1.1)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(2,3,6,0.97) 0%, rgba(2,3,6,0.85) 34%, rgba(2,3,6,0.25) 62%, rgba(2,3,6,0) 80%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(2,3,6,0.6) 0%, rgba(2,3,6,0) 25%)" }} />
      <div style={{ position: "absolute", left: 64, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 112, lineHeight: 1.0, letterSpacing: -1, color: "#fff6e4", textShadow: sombra }}>{l1}</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 112, lineHeight: 1.05, letterSpacing: -1, color: "#ffb35c", textShadow: sombra + ", 0 0 30px rgba(255,160,70,0.35)" }}>{l2}</div>
        <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 27, letterSpacing: 2, color: "#0b0c10", background: "#fff3dc", borderRadius: 10, padding: "7px 16px" }}>EP. {ep} · LA FRONTERA</div>
          {cap && <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: "rgba(255,246,228,0.85)", textShadow: sombra }}>{cap}</div>}
        </div>
      </div>
    </AbsoluteFill>
  );
};
