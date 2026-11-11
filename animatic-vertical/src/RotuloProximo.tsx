import React from "react";
import { AbsoluteFill, getInputProps } from "remotion";
import { MONO, SANS } from "./theme";

// «Próximo capítulo» label for the YouTube episodes' end previews (transparent still, laid over the next chapter's shots).
// props: { cap: "II", nombre: "ENTRE LA NADA Y EL ALGO" }
export const RotuloProximo: React.FC = () => {
  const { cap = "II", nombre = "ENTRE LA NADA Y EL ALGO" } = getInputProps() as { cap?: string; nombre?: string };
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 0, bottom: 0, width: 900, height: 260,
        background: "radial-gradient(ellipse 70% 75% at 88% 75%, rgba(2,3,6,0.62), rgba(2,3,6,0.25) 55%, rgba(2,3,6,0) 100%)" }} />
      <div style={{ position: "absolute", right: 78, bottom: 64, textAlign: "right" }}>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 17, letterSpacing: 9, color: "rgba(255,190,120,0.95)",
          textShadow: "0 0 14px rgba(255,170,90,0.5)", marginBottom: 10 }}>PRÓXIMO CAPÍTULO · {cap}</div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 4, color: "rgba(255,244,222,0.97)",
          textShadow: "0 0 18px rgba(255,225,180,0.5), 0 0 3px rgba(2,3,6,0.9)" }}>{nombre}</div>
      </div>
    </AbsoluteFill>
  );
};
