import React from "react";
import { AbsoluteFill } from "remotion";
import { MONO, SANS } from "./theme";

// «En el próximo capítulo» card for the YouTube episode previews (transparent still, laid over a dimmed shot).
export const TarjetaProximo: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 20, letterSpacing: 12, color: "rgba(255,190,120,0.95)",
        textShadow: "0 0 16px rgba(255,170,90,0.5)", marginBottom: 18 }}>LA FRONTERA</div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 64, letterSpacing: 8, color: "rgba(255,244,222,0.98)",
        textShadow: "0 0 26px rgba(255,225,180,0.55), 0 0 4px rgba(2,3,6,0.9)" }}>EN EL PRÓXIMO CAPÍTULO</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 30 }}>
        {[0, 1, 2, 3].map((i) => <div key={i} style={{ width: 34, height: 2, background: "rgba(255,200,140,0.85)", boxShadow: "0 0 10px rgba(255,180,100,0.7)" }} />)}
      </div>
    </div>
  </AbsoluteFill>
);
