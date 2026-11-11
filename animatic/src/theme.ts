import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// La frontera: negro profundo, crema, durazno, magenta apagado, cian tenue y violeta (paleta del guion v7).
export const C = {
  fondo: "#07060f",
  crema: "#fff4de",
  durazno: "#ee8c78",
  magenta: "#b04080",
  cian: "#96dee2",
  violeta: "#46185c",
};
export const RGB = {
  crema: "255,244,222",
  durazno: "238,140,120",
  magenta: "176,64,128",
  cian: "150,222,226",
};
export const SANS = "Space Grotesk";
export const MONO = "IBM Plex Mono";

for (const w of ["300", "400", "500", "600", "700"]) {
  loadFont({ family: SANS, url: staticFile(`fonts/grotesk-${w}.woff2`), weight: w });
}
for (const w of ["400", "500"]) {
  loadFont({ family: MONO, url: staticFile(`fonts/plex-${w}.woff2`), weight: w });
}

// Curves: everything is a pure function of t.
export const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const pr = (t: number, a: number, d: number) => cl((t - a) / d);
export const eOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const eIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const eSuave = (x: number) => x * x * (3 - 2 * x);
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
// Fade in over d1 from a, hold, fade out over d2 ending at b.
export const ventana = (t: number, a: number, b: number, d1 = 0.6, d2 = 0.6) => Math.min(eSuave(pr(t, a, d1)), 1 - eSuave(pr(t, b - d2, d2)));
// Number with a decimal comma, as written in Chile.
export const num = (v: number, d = 2) => v.toFixed(d).replace(".", ",").replace("-", "−");
