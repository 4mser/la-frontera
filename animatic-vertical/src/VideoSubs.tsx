import React from "react";
import { AbsoluteFill, getInputProps, useCurrentFrame } from "remotion";
import { SANS } from "./theme";

// Subtitles for the trailer, animated as the film's lettering: every word arrives at the instant the voice says it
// (blur → sharp, a small rise, a cream glow); the line leaves together. On transparency (ProRes 4444), laid over.
// props: { cues: [start, end, [word, time][]][], dur }
type Cue = [number, number, [string, number][]];
type P = { cues?: Cue[]; dur?: number };
export const subsDur = () => Math.round(((getInputProps() as P).dur ?? 10) * 30);
const cl = (x: number) => Math.min(1, Math.max(0, x));
const eOut = (x: number) => 1 - Math.pow(1 - cl(x), 3);
export const VideoSubs: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const cues = (getInputProps() as P).cues ?? [];
  const c = cues.find(([a, b]) => t >= a - 0.05 && t < b);
  if (!c) return <AbsoluteFill />;
  const [, b, palabras] = c;
  const sale = cl((b - t) / 0.35);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 96 }}>
      <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 42, letterSpacing: 1, textAlign: "center", maxWidth: 1560, lineHeight: 1.3, filter: `blur(${(4 * (1 - sale)).toFixed(2)}px)`, opacity: sale }}>
        {palabras.map(([w, tw], i) => {
          const k = eOut((t - tw + 0.04) / 0.32);
          return (
            <span key={i} style={{ display: "inline-block", marginRight: "0.32em", opacity: k, transform: `translateY(${(10 * (1 - k)).toFixed(2)}px)`, filter: `blur(${(6 * (1 - k)).toFixed(2)}px)`,
              color: "rgba(255,244,222,0.97)", textShadow: `0 0 ${(14 + 18 * (1 - k)).toFixed(1)}px rgba(255,220,170,${(0.35 + 0.4 * (1 - k)).toFixed(2)}), 0 0 22px rgba(2,3,6,0.95), 0 2px 4px rgba(2,3,6,1)` }}>{w}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
