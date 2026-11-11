import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

// Instagram story (1080x1920) before the spoiler: the colour spiral of the film's opening, full bleed, a line from
// the film's idea and a pointer to the next story; nothing in the top 250 px or the bottom 250 px, where the app
// draws its own interface
const fuentes = `
@font-face { font-family: "Space Grotesk"; font-weight: 500; src: url(${staticFile("fonts/grotesk-500.woff2")}) format("woff2"); }
@font-face { font-family: "Space Grotesk"; font-weight: 700; src: url(${staticFile("fonts/grotesk-700.woff2")}) format("woff2"); }
@font-face { font-family: "IBM Plex Mono"; font-weight: 500; src: url(${staticFile("fonts/plex-500.woff2")}) format("woff2"); }
`;
const crema = "#FFF4DE";

export const Historia: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#020306" }}>
    <style>{fuentes}</style>
    <Img src={staticFile("historia/f-3.2.png")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.08)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #020306 0%, #020306 5%, rgba(2,3,6,0.35) 18%, rgba(2,3,6,0) 28%, rgba(2,3,6,0.15) 34%, rgba(2,3,6,0.72) 44%, rgba(2,3,6,0.93) 58%, #020306 100%)" }} />
    <Img src={staticFile("lectures-logo.png")} style={{ position: "absolute", top: 270, left: 90, width: 150, opacity: 0.9 }} />
    <div style={{ position: "absolute", left: 96, width: 780, bottom: 470, color: crema, fontFamily: "Space Grotesk" }}>
      <p style={{ margin: 0, fontWeight: 500, fontSize: 44, lineHeight: 1.28, letterSpacing: -0.3 }}>
        Hay patrones en la naturaleza que parecen repetirse hasta el infinito.
      </p>
      <p style={{ margin: "22px 0 0", fontWeight: 500, fontSize: 44, lineHeight: 1.28, letterSpacing: -0.3, background: "linear-gradient(100deg, #F3D9A4 0%, #E7C3D8 45%, #B9B0FF 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
        Desde las formas más pequeñas hasta las estructuras más inmensas del universo.
      </p>
      <div style={{ width: 56, height: 2, background: crema, opacity: 0.5, margin: "52px 0 40px" }} />
      <p style={{ margin: 0, fontWeight: 500, fontSize: 32, lineHeight: 1.45, opacity: 0.85 }}>
        Llevo años obsesionado con esa idea y estoy preparando algo que me hace mucha ilusión compartir.
      </p>
    </div>
    <div style={{ position: "absolute", left: 96, right: 96, bottom: 300, display: "flex", alignItems: "center", gap: 28, color: crema }}>
      <div style={{ fontFamily: "IBM Plex Mono", fontWeight: 500, fontSize: 24, letterSpacing: 7, opacity: 0.85 }}>UN PEQUEÑO ADELANTO</div>
      <svg width="78" height="30" viewBox="0 0 78 30" fill="none">
        <path d="M2 15 H72 M58 3 L74 15 L58 27" stroke={crema} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </AbsoluteFill>
);
