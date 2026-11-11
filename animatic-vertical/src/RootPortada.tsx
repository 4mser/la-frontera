import React from "react";
import { Composition } from "remotion";
import { VideoPortadaYoutube } from "./VideoPortadaYoutube";
import { VideoPortadaEstreno } from "./VideoPortadaEstreno";
import { VideoMiniaturaDoc } from "./VideoMiniaturaDoc";
import { VideoMiniatura2 } from "./VideoMiniatura2";
import { VideoMiniatura3 } from "./VideoMiniatura3";
import { VideoPromoTexto } from "./VideoPromoTexto";
import { VideoPropuestas } from "./VideoPropuestas";
import { PROP_DUR, PROP_FPS, VideoPropuestasReel } from "./VideoPropuestasReel";
import { VideoCierreReel } from "./VideoCierreReel";
export const RootPortada: React.FC = () => (
  <>
    <Composition id="PortadaYoutube" component={VideoPortadaYoutube} defaultProps={{}} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="PropuestasReel" component={VideoPropuestasReel} defaultProps={{}} durationInFrames={Math.round(PROP_DUR * PROP_FPS)} fps={PROP_FPS} width={1080} height={1920} />
    <Composition id="Propuestas" component={VideoPropuestas} defaultProps={{}} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="PromoTexto" component={VideoPromoTexto} defaultProps={{}} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="Miniatura3" component={VideoMiniatura3} defaultProps={{}} durationInFrames={1} fps={30} width={2560} height={1440} />
    <Composition id="Miniatura2" component={VideoMiniatura2} defaultProps={{}} durationInFrames={1} fps={30} width={2560} height={1440} />
    <Composition id="MiniaturaDoc" component={VideoMiniaturaDoc} defaultProps={{}} durationInFrames={1} fps={30} width={2560} height={1440} />
    <Composition id="PortadaEstreno" component={VideoPortadaEstreno} defaultProps={{}} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="CierreReel" component={VideoCierreReel} durationInFrames={180} fps={30} width={1080} height={1920} />
  </>
);
