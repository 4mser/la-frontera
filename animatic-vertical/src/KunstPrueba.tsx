// lámina de prueba: 4 familias × 3 especies, para revisar las recreaciones
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { pintarFamilia } from "./kunst/familias";
export const KunstPrueba: React.FC = () => {
  const frame = useCurrentFrame(); const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext("2d")!; ctx.fillStyle = "#03070c"; ctx.fillRect(0, 0, 1080, 1920);
    const cols: [number, number, number][][] = [[[1, 0.82, 0.55], [0.55, 0.85, 1]], [[0.6, 0.95, 1], [1, 0.75, 0.95]], [[1, 0.9, 0.7], [0.7, 0.8, 1]]];
    for (let fam = 0; fam < 4; fam++) for (let k = 0; k < 3; k++) {
      const im = pintarFamilia(360, 480, { fam, crece: 1, giro: frame * 0.02 + k, incl: 0.3 + 0.2 * k, dist: 3.6, frec: 6 + 2 * k, semilla: 3 + k * 2.3 + fam, a: 1, t: frame / 30, colA: cols[k][0], colB: cols[k][1] });
      ctx.globalCompositeOperation = "lighter"; ctx.drawImage(im, k * 360, fam * 480);
    }
  }, [frame]);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} style={{ width: "100%", height: "100%" }} /></AbsoluteFill>;
};
