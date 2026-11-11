import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { pintarMulti } from "./multiFractal";
import { PALETAS } from "./fractalTeaser";
import { clifford, dejong, helecho, medusa, milpies } from "./vida";
// a test sheet: every rule of src/multiFractal.ts with its view
export const VISTAS: [number, number, number, number, [number, number] | undefined, number?][] = [
  [0, -0.0, 0, 3.2, [-0.8, 0.156]], [1, -1.75, -0.035, 0.12, undefined], [2, -0.25, 0, 4.6, undefined], [3, 0, 0, 3.0, undefined, 4],
  [4, -0.5, 0, 3.5, undefined], [5, -0.5, -0.4, 3.5, undefined], [6, -0.5, 0, 3.5, undefined], [7, 0, 0, 3.2, [0.5667, -0.5]],
  [8, 0, 0, 3.0, undefined], [9, -0.3, 0, 2.4, undefined], [10, 1.5, 0, 5, undefined], [11, 1, 0, 6, undefined],
  [12, 0, 0, 6, [1, 0.3]], [13, 3.3, 3.2, 1.6, undefined], [14, -0.5, 0, 3.4, undefined], [15, -0.75, 0.1, 0.3, undefined],
];
export const VideoCatalogo: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    if (frame >= 1) {
      ctx.fillStyle = "#020306"; ctx.fillRect(0, 0, 1920, 1080);
      ctx.drawImage(clifford(640, 540, -1.7, 1.8, -1.9, -0.4, PALETAS[0]), 0, 0);
      ctx.drawImage(dejong(640, 540, -2.0, -2.0, -1.2, 2.0, PALETAS[1]), 640, 0);
      ctx.drawImage(helecho(640, 540, PALETAS[2], 0.02), 1280, 0);
      milpies(ctx, frame / 30, (s) => [100 + s * 1100, 800 + 120 * Math.sin(s * 6)], 0.85, 1.0, 1);
      medusa(ctx, frame / 30, 1550, 700, 140, 1);
      return;
    }
    const w = 480, h = 270;
    VISTAS.forEach(([r, cx, cy, ancho, julia, pot], i) => {
      const l = pintarMulti(w, h, { cx, cy, esc: ancho / w, regla: r, julia, pot, paleta: PALETAS[i % 3], maxIt: r === 15 ? 600 : 300, tiempo: frame / 30 });
      ctx.drawImage(l, (i % 4) * w, Math.floor(i / 4) * h, w, h);
      ctx.fillStyle = "#fff"; ctx.font = "20px monospace"; ctx.fillText(String(r), (i % 4) * w + 8, Math.floor(i / 4) * h + 24);
    });
  }, [frame]);
  return <AbsoluteFill><canvas ref={ref} width={1920} height={1080} /></AbsoluteFill>;
};
