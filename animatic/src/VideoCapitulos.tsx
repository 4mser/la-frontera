import React from "react";
import { AbsoluteFill, getInputProps, useCurrentFrame } from "remotion";
import { MONO, SANS } from "./theme";

// The trailer's hypercut, by chapters: the number and the name of each chapter, over its shots (transparent, laid
// over). props: { bloques: [chapter, start, n, length][], dur }
type P = { bloques?: [number, number, number, number][]; dur?: number };
export const capDur = () => Math.round(((getInputProps() as P).dur ?? 10) * 30);
const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const NOMBRES = ["LA REGLA", "ENTRE LA NADA Y EL ALGO", "LA MEDIDA DE LO IRREGULAR", "CÓMO CRECE UNA FORMA", "UN CORAZÓN NO ES UN METRÓNOMO",
  "LA MISMA REGLA, EN EL TIEMPO", "DEL PATRÓN A LA HERRAMIENTA", "¿HASTA DÓNDE LLEGA LA ESTRUCTURA?", "EL LENGUAJE Y SUS RANGOS", "LA FRONTERA"];
const cl = (x: number) => Math.min(1, Math.max(0, x));
const eOut = (x: number) => 1 - Math.pow(1 - cl(x), 3);
export const VideoCapitulos: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const { bloques = [] } = getInputProps() as P;
  const b = bloques.find(([, a, , d]) => t >= a && t < a + d);
  if (!b) return <AbsoluteFill />;
  const [k, a, , d] = b;
  const u = t - a, hold = Math.min(3.4, d - 0.6);
  const ent = eOut(u / 0.45), sal = 1 - cl((u - hold) / 0.5), al = ent * sal;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 150 }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 420, opacity: al,
        background: "radial-gradient(ellipse 55% 70% at 50% 85%, rgba(2,3,6,0.78), rgba(2,3,6,0.35) 55%, rgba(2,3,6,0) 100%)" }} />
      <div style={{ textAlign: "center", opacity: al, transform: `translateY(${(12 * (1 - ent)).toFixed(1)}px)`, filter: `blur(${(8 * (1 - ent) + 6 * (1 - sal)).toFixed(1)}px)` }}>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, letterSpacing: 12, color: "rgba(255,190,120,0.95)", marginBottom: 14, textShadow: "0 0 16px rgba(255,170,90,0.5)" }}>CAPÍTULO {ROMANOS[k - 1]}</div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 56, letterSpacing: 6, color: "rgba(255,244,222,0.98)", textShadow: "0 0 22px rgba(255,225,180,0.55), 0 0 4px rgba(2,3,6,0.9)" }}>{NOMBRES[k - 1]}</div>
      </div>
    </AbsoluteFill>
  );
};
