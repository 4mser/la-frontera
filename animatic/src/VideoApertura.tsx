import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { VideoMG } from "./VideoMG";
import { VideoPrologo2 } from "./VideoPrologo2";
import MONT from "./montaje.json";
import P from "./prologo2.json";

// The opening of the film, as a cold open: the prologue (heart, the world's forms, the measured coast, the question)
// and then the intro bursts in on the next beat (the teaser, without its own voice), collapses, and the last two lines
// of the prologue are spoken over its calm ending, before the title.
// The intro starts one second before the prologue's last beat, so that beat is the intro's first hit (L[0] = 1 s).
const fps = 30;
export const INICIO_INTRO = Math.round((P.inicioIntro - MONT.latidos[0]) * fps);
export const TOTAL_APERTURA = INICIO_INTRO + Math.round(MONT.total * fps);
export const VideoApertura: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Sequence from={INICIO_INTRO}>
      <VideoMG pelicula />
    </Sequence>
    <Sequence durationInFrames={Math.round(P.total * fps)}>
      <VideoPrologo2 />
    </Sequence>
    {P.vozIntro.map((t, k) => (
      <Sequence key={k} from={INICIO_INTRO + Math.round(t * fps)}>
        <Audio src={staticFile(`voz/p2-${k + 5}.mp3`)} volume={1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
