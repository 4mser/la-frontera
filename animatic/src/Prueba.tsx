import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { pintarMandel } from "./mandel";

// Scouting tool: one still of the fractal at a given place, to choose the shots of the montage.
export const Prueba: React.FC<{ cx: number; cy: number; ancho: number; jx?: number; jy?: number; fase?: number }> = (p) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const l = pintarMandel(960, 540, { cx: p.cx, cy: p.cy, ancho: p.ancho, fase: p.fase ?? 0.3, respira: 1, iter: 900, julia: p.jx !== undefined ? [p.jx, p.jy ?? 0] : undefined });
    ref.current!.getContext("2d")!.drawImage(l, 0, 0);
  }, [p]);
  return (
    <AbsoluteFill>
      <canvas ref={ref} width={960} height={540} />
    </AbsoluteFill>
  );
};
