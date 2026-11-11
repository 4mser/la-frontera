import React from "react";
import { Composition } from "remotion";
import "./theme";
import { CARTEL_FRAMES, VideoCartel } from "./VideoCartel";
import { APERTURA_FRAMES, VideoAperturaTrailer } from "./VideoAperturaTrailer";
import { VideoIntertitulo, interDur } from "./VideoIntertitulo";
import { VideoCapitulos, capDur } from "./VideoCapitulos";
import { RotuloProximo } from "./RotuloProximo";
import { TarjetaProximo } from "./TarjetaProximo";
import { MiniaturaEpisodio } from "./MiniaturaEpisodio";
import { VideoPortadaTrailer } from "./VideoPortadaTrailer";
import { VideoPortadaEstreno } from "./VideoPortadaEstreno";
import { VideoPortadaYoutube } from "./VideoPortadaYoutube";
import { VideoSubs, subsDur } from "./VideoSubs";
import { Video } from "./Video";
import { VideoDireccion } from "./VideoDireccion";
import LINEA from "./linea.json";
import DIR from "./direcciones.json";
import { VideoMontaje } from "./VideoMontaje";
import MONT from "./montaje.json";
import { Prueba } from "./Prueba";
import { VideoTeaser } from "./VideoTeaser";
import { VideoMG } from "./VideoMG";
import { VideoDeleite } from "./VideoDeleite";
import { VideoCatalogo } from "./VideoCatalogo";
import { VideoLoco } from "./VideoLoco";
import { LOCO_TOTAL } from "./loco";
import DEL from "./deleite.json";
import FORMATO from "./formato.json";
import { Historia } from "./Historia";
import { HistoriaBitacora } from "./HistoriaBitacora";
import { HistoriaCapitulos } from "./HistoriaCapitulos";
import { VideoPrologo } from "./VideoPrologo";
import { VideoPrologo2 } from "./VideoPrologo2";
import { TOTAL_APERTURA, VideoApertura } from "./VideoApertura";
import PRO2 from "./prologo2.json";
import PRO from "./prologo.json";
import { Still } from "remotion";
import { VideoFrontera } from "./VideoFrontera";
import { PortadaLinkedIn } from "./PortadaLinkedIn";
import { VideoVivo } from "./VideoVivo";
import { VideoPlanoVivo } from "./VideoPlanoVivo";
import VV from "./vivo.json";
import FR from "./frontera.json";
import { VideoCap1 } from "./VideoCap1";
import { TOTAL_REEL_EP1, VideoReelEp1 } from "./VideoReelEp1";
import { SubtitulosReel } from "./SubtitulosReel";
import { TOTAL_REEL_EP2, VideoReelEp2 } from "./VideoReelEp2";
import CAP1 from "./cap1.json";
import { VideoCap1p } from "./VideoCap1p";
import CAP1P from "./cap1p.json";
import { VideoCap2 } from "./VideoCap2";
import CAP2 from "./cap2.json";
import { VideoCap3 } from "./VideoCap3";
import CAP3 from "./cap3.json";
import { VideoCap4 } from "./VideoCap4";
import CAP4 from "./cap4.json";
import { VideoCap5 } from "./VideoCap5";
import CAP5 from "./cap5.json";
import { VideoCap6 } from "./VideoCap6";
import CAP6 from "./cap6.json";
import { VideoCap7 } from "./VideoCap7";
import { VideoCap8 } from "./VideoCap8";
import { VideoCap9 } from "./VideoCap9";
import { VideoCap10 } from "./VideoCap10";
import CAP7 from "./cap7.json";
import CAP8 from "./cap8.json";
import CAP9 from "./cap9.json";
import CAP10 from "./cap10.json";
import EPI10 from "./epilogo.json";
import { VideoFinA, VideoFinB } from "./VideoFinales";
import { VideoExistir } from "./VideoExistir";
import EXI from "./existir.json";
import { VideoParpadeo } from "./VideoParpadeo";
import PAR from "./parpadeo.json";
import { VideoKunst } from "./VideoKunst";
import { KunstPrueba } from "./KunstPrueba";
import KUN from "./kunst.json";

// La frontera · animatic of the prologue and chapter I (16:9 master), and three opening directions to compare.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Animatic" component={Video} durationInFrames={Math.round(LINEA.total * LINEA.fps)} fps={LINEA.fps} width={1920} height={1080} />
    {(["A", "B", "C"] as const).map((d) => (
      <Composition key={d} id={`Direccion${d}`} component={VideoDireccion} defaultProps={{ dir: d }} durationInFrames={Math.round(DIR[d].total * DIR.fps)} fps={DIR.fps} width={1920} height={1080} />
    ))}
    {(["A", "B"] as const).map((v) => (
      <Composition key={v} id={`Montaje${v}`} component={VideoMontaje} defaultProps={{ variante: v }} durationInFrames={Math.round(MONT.total * MONT.fps)} fps={MONT.fps} width={1920} height={1080} />
    ))}
    <Composition id="Prueba" component={Prueba} defaultProps={{ cx: -0.62, cy: 0, ancho: 3.5 }} durationInFrames={1} fps={30} width={960} height={540} />
    <Composition id="MontajeTeaser" component={VideoTeaser} durationInFrames={Math.round(MONT.total * MONT.fps)} fps={MONT.fps} width={1920} height={1080} />
    <Composition id="Apertura" component={VideoApertura} durationInFrames={TOTAL_APERTURA} fps={30} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Prologo2" component={VideoPrologo2} durationInFrames={Math.round(PRO2.total * PRO2.fps)} fps={PRO2.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Prologo" component={VideoPrologo} durationInFrames={Math.round(PRO.total * PRO.fps)} fps={PRO.fps} width={FORMATO.W} height={FORMATO.H} />
    <Still id="Historia" component={Historia} width={1080} height={1920} />
    <Still id="HistoriaBitacora" component={HistoriaBitacora} width={1080} height={1920} />
    <Still id="HistoriaCapitulos" component={HistoriaCapitulos} defaultProps={{ v: "a", guia: false }} width={1080} height={1920} />
    <Composition id="Loco" component={VideoLoco} durationInFrames={Math.round(LOCO_TOTAL * 30)} fps={30} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Catalogo" component={VideoCatalogo} durationInFrames={30} fps={30} width={1920} height={1080} />
    <Composition id="Deleite" component={VideoDeleite} durationInFrames={Math.round(DEL.total * DEL.fps)} fps={DEL.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="MontajeMG" component={VideoMG} durationInFrames={Math.round(MONT.total * MONT.fps)} fps={MONT.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Frontera" component={VideoFrontera} durationInFrames={Math.round(FR.total * FR.fps)} fps={FR.fps} width={1920} height={1080} />
    <Composition id="PlanoVivo" component={VideoPlanoVivo} defaultProps={{ nombre: "transformacion" }} durationInFrames={120} fps={30} width={1920} height={1080} />
    <Composition id="Cap1" component={VideoCap1} durationInFrames={Math.round(CAP1.total * CAP1.fps)} fps={CAP1.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="ReelEp1" component={VideoReelEp1} durationInFrames={TOTAL_REEL_EP1} fps={30} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="SubtitulosEp1" component={SubtitulosReel} defaultProps={{ ep: 1 }} durationInFrames={TOTAL_REEL_EP1} fps={30} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="ReelEp2" component={VideoReelEp2} durationInFrames={TOTAL_REEL_EP2} fps={30} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="SubtitulosEp2" component={SubtitulosReel} defaultProps={{ ep: 2 }} durationInFrames={TOTAL_REEL_EP2} fps={30} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Cap1p" component={VideoCap1p} durationInFrames={Math.round(CAP1P.total * CAP1P.fps)} fps={CAP1P.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Cap2" component={VideoCap2} durationInFrames={Math.round(CAP2.total * CAP2.fps)} fps={CAP2.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Cap3" component={VideoCap3} durationInFrames={Math.round(CAP3.total * CAP3.fps)} fps={CAP3.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Cap4" component={VideoCap4} durationInFrames={Math.round(CAP4.total * CAP4.fps)} fps={CAP4.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Cap5" component={VideoCap5} durationInFrames={Math.round(CAP5.total * CAP5.fps)} fps={CAP5.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Cap6" component={VideoCap6} durationInFrames={Math.round(CAP6.total * CAP6.fps)} fps={CAP6.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Cap7" component={VideoCap7} durationInFrames={Math.round(CAP7.total * CAP7.fps)} fps={CAP7.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Cap8" component={VideoCap8} durationInFrames={Math.round(CAP8.total * CAP8.fps)} fps={CAP8.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Cap9" component={VideoCap9} durationInFrames={Math.round(CAP9.total * CAP9.fps)} fps={CAP9.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="SubsTrailer" component={VideoSubs} durationInFrames={subsDur()} fps={30} width={1920} height={1080} />
    <Composition id="AperturaTrailer" component={VideoAperturaTrailer} durationInFrames={APERTURA_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Intertitulo" component={VideoIntertitulo} durationInFrames={interDur()} fps={30} width={1920} height={1080} />
    <Composition id="MiniaturaEpisodio" component={MiniaturaEpisodio} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="TarjetaProximo" component={TarjetaProximo} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="RotuloProximo" component={RotuloProximo} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="CapitulosTrailer" component={VideoCapitulos} durationInFrames={capDur()} fps={30} width={1920} height={1080} />
    <Composition id="PortadaTrailer" component={VideoPortadaTrailer} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="PortadaEstreno" component={VideoPortadaEstreno} defaultProps={{}} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="PortadaYoutube" component={VideoPortadaYoutube} defaultProps={{}} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="CartelTrailer" component={VideoCartel} durationInFrames={CARTEL_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Cap10" component={VideoCap10} durationInFrames={Math.round((EPI10.activo ? EPI10.fin : CAP10.total) * CAP10.fps)} fps={CAP10.fps} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="FinA" component={VideoFinA} durationInFrames={360} fps={30} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="FinB" component={VideoFinB} durationInFrames={360} fps={30} width={FORMATO.W} height={FORMATO.H} />
    <Composition id="Vivo" component={VideoVivo} durationInFrames={Math.round(VV.total * VV.fps)} fps={VV.fps} width={1920} height={1080} />
    <Composition id="PortadaLinkedIn" component={PortadaLinkedIn} defaultProps={{ v: "m" }} durationInFrames={1} fps={30} width={3168} height={792} />
    <Composition id="KunstPrueba" component={KunstPrueba} durationInFrames={60} fps={30} width={1080} height={1920} />
    <Composition id="Kunstformen" component={VideoKunst} durationInFrames={Math.round(KUN.total * KUN.fps)} fps={30} width={1080} height={1920} />
    <Composition id="Parpadeo" component={VideoParpadeo} durationInFrames={Math.round(PAR.total * PAR.fps)} fps={PAR.fps} width={1080} height={1920} />
    <Composition id="Existir" component={VideoExistir} durationInFrames={Math.round((EXI.total + 0.2 + 34.0) * EXI.fps)} fps={EXI.fps} width={1080} height={1920} />
  </>
);
