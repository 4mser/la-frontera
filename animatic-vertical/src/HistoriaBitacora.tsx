import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

// Instagram story (1080x1920): the film's version map. Every piece is a rail whose length is its number of
// iterations, discarded paths branch off and end in a cross, and the frozen architecture feeds chapters III–VII.
// Content stays between y = 250 and y = 1670 (app interface zones)
const fuentes = `
@font-face { font-family: "Space Grotesk"; font-weight: 500; src: url(${staticFile("fonts/grotesk-500.woff2")}) format("woff2"); }
@font-face { font-family: "Space Grotesk"; font-weight: 700; src: url(${staticFile("fonts/grotesk-700.woff2")}) format("woff2"); }
@font-face { font-family: "IBM Plex Mono"; font-weight: 500; src: url(${staticFile("fonts/plex-500.woff2")}) format("woff2"); }
`;
const fondo = "#020306";
const crema = "#FFF4DE";
const oro = "#F3D9A4";
const cobre = "#E9A66B";
const rosa = "#E7C3D8";
const lila = "#B9B0FF";
const degradado = "linear-gradient(100deg, #F3D9A4 0%, #E7C3D8 45%, #B9B0FF 100%)";
const mono: React.CSSProperties = { fontFamily: "IBM Plex Mono", fontWeight: 500 };

type Fila = {
  n: string;
  titulo: string;
  versiones: number;
  paso: number;
  color: string;
  alto: number;
  img?: string;
  dur?: string;
  final: string;
  marcas?: Record<number, string>;
  rechazos?: { i: number; t: string; arriba?: boolean; caida?: number }[];
  semilla: number;
};

const filas: Fila[] = [
  { n: "00", titulo: "El guion", versiones: 10, paso: 74, color: oro, alto: 98, final: "ARQ v3 · congelada", semilla: 0.4,
    marcas: { 0: "v1 · 3:30", 4: "película", 6: "v7", 7: "ARQ v1" } },
  { n: "01", titulo: "Teaser · la dirección", versiones: 8, paso: 92, color: oro, alto: 146, img: "teaser", dur: "0:59", final: "7 formatos", semilla: 1.3,
    marcas: { 1: "B", 2: "C · al pulso", 5: "MG" },
    rechazos: [
      { i: 0, t: "animatic de datos", arriba: true },
      { i: 2, t: "Julia 3D", caida: 52 },
      { i: 3, t: "cámara inclinada", arriba: true },
      { i: 4, t: "simulaciones realistas", caida: 52 },
      { i: 6, t: "acabado ACES", arriba: true },
    ] },
  { n: "02", titulo: "Prólogo + intro", versiones: 21, paso: 30, color: oro, alto: 88, img: "apertura", dur: "2:59", final: "v21", semilla: 2.1 },
  { n: "I", titulo: "La regla", versiones: 24, paso: 30, color: rosa, alto: 94, img: "c1", dur: "5:00", final: "v24", semilla: 3.7,
    rechazos: [{ i: 1, t: "animatic tipo clase", caida: 34 }] },
  { n: "II", titulo: "Entre la nada y el algo", versiones: 8, paso: 30, color: rosa, alto: 88, img: "c2", dur: "8:52", final: "v8", semilla: 4.4 },
  { n: "III", titulo: "La medida de lo irregular", versiones: 4, paso: 30, color: lila, alto: 94, img: "c3", dur: "5:59", final: "previa v4", semilla: 5.2,
    rechazos: [{ i: 1, t: "música de cámara", caida: 26 }] },
  { n: "IV", titulo: "Cómo crece una forma", versiones: 3, paso: 30, color: lila, alto: 88, img: "c4", dur: "4:56", final: "previa v1 · 2 muestras", semilla: 6.0 },
  { n: "V", titulo: "Un corazón no es un metrónomo", versiones: 7, paso: 30, color: lila, alto: 88, img: "c5", dur: "6:57", final: "previa v6 · 1 muestra", semilla: 6.9 },
  { n: "VI", titulo: "La misma regla, en el tiempo", versiones: 3, paso: 30, color: lila, alto: 88, img: "c6", dur: "4:30", final: "previa v3", semilla: 7.7 },
  { n: "VII", titulo: "Del patrón a la herramienta", versiones: 4, paso: 30, color: lila, alto: 88, img: "c7", dur: "4:36", final: "previa v4", semilla: 8.5 },
];

const X0 = 128;
const Y0 = 566;
const TH = { x: 884, w: 152, h: 82 };

// rail points: a nervous line that never sits still, like the film's boundary
const puntos = (f: Fila, yc: number) =>
  Array.from({ length: f.versiones }, (_, i) => ({
    x: X0 + i * f.paso,
    y: yc + (i === 0 ? 0 : 9 * Math.sin(i * 1.9 + f.semilla) + 4 * Math.sin(i * 4.3 + f.semilla * 2)),
  }));

// Catmull-Rom through the points, as cubic Béziers
const curva = (p: { x: number; y: number }[]) => {
  if (p.length < 2) return "";
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i];
    const b = p[i];
    const c = p[i + 1];
    const e = p[i + 2] ?? c;
    d += ` C${b.x + (c.x - a.x) / 6},${b.y + (c.y - a.y) / 6} ${c.x - (e.x - b.x) / 6},${c.y - (e.y - b.y) / 6} ${c.x},${c.y}`;
  }
  return d;
};

const layout = (() => {
  let y = Y0;
  return filas.map((f) => {
    const top = y;
    y += f.alto;
    const yc = top + (f.n === "01" ? 80 : 54);
    return { f, top, yc, p: puntos(f, yc) };
  });
})();
const yPend = layout[layout.length - 1].top + layout[layout.length - 1].f.alto + 4;

const Grano: React.FC = () => (
  <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.22 }}>
    <filter id="grano">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="1080" height="1920" filter="url(#grano)" />
  </svg>
);

export const HistoriaBitacora: React.FC = () => {
  const guion = layout[0];
  const arq = guion.p[guion.p.length - 1];
  const teaser = layout[1];
  return (
    <AbsoluteFill style={{ backgroundColor: fondo, color: crema, fontFamily: "Space Grotesk", overflow: "hidden" }}>
      <style>{fuentes}</style>

      {/* living fractal behind the title, sinking into black */}
      <Img src={staticFile("bitacora/teaser.jpg")} style={{ position: "absolute", top: -120, left: -300, width: 1700, opacity: 0.62, filter: "blur(1px) saturate(1.25)" }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(2,3,6,0.75) 0%, rgba(2,3,6,0.55) 13%, rgba(2,3,6,0.35) 18%, rgba(2,3,6,0.6) 23%, rgba(2,3,6,0.95) 28.5%, ${fondo} 31%)` }} />
      <Img src={staticFile("bitacora/c2.jpg")} style={{ position: "absolute", top: 1560, left: -300, width: 1700, opacity: 0.16, filter: "blur(2px)", maskImage: "linear-gradient(180deg, transparent 0%, black 25%, transparent 70%)", WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 25%, transparent 70%)" }} />

      {/* title card */}
      <div style={{ position: "absolute", top: 258, left: 64, right: 64 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Img src={staticFile("lectures-logo.png")} style={{ width: 112, opacity: 0.92 }} />
          <div style={{ ...mono, fontSize: 17, letterSpacing: 6, opacity: 0.8 }}>MAPA DE VERSIONES</div>
        </div>
        <div style={{ marginTop: 20, fontWeight: 700, fontSize: 100, letterSpacing: 4, lineHeight: 0.95, background: degradado, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 0 22px rgba(243,217,164,0.35))" }}>
          LA FRONTERA
        </div>
        <div style={{ ...mono, fontSize: 18, letterSpacing: 5, marginTop: 12, opacity: 0.85 }}>
          CADA PUNTO ES UNA VERSIÓN · CADA ✕ UN CAMINO DESCARTADO
        </div>
        <div style={{ display: "flex", gap: 0, marginTop: 22 }}>
          {[
            ["74", "versiones de video"],
            ["30", "guiones y arquitecturas"],
            ["7", "caminos descartados"],
          ].map(([a, b], i) => (
            <div key={b} style={{ flex: 1, paddingLeft: i ? 26 : 0, borderLeft: i ? "1px solid rgba(255,244,222,0.22)" : "none" }}>
              <div style={{ fontWeight: 700, fontSize: 50, lineHeight: 1, color: i === 2 ? cobre : crema, textShadow: `0 0 18px ${i === 2 ? "rgba(233,166,107,0.5)" : "rgba(255,244,222,0.3)"}` }}>{a}</div>
              <div style={{ ...mono, fontSize: 14, letterSpacing: 2, opacity: 0.72, marginTop: 4, textTransform: "uppercase" }}>{b}</div>
            </div>
          ))}
        </div>
      </div>

      {/* the map */}
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="brillo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="halo" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <linearGradient id="hilo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={oro} />
            <stop offset="0.45" stopColor={rosa} />
            <stop offset="1" stopColor={lila} />
          </linearGradient>
        </defs>

        {/* spine: the film itself, from the first script to the chapters still to come */}
        <path d={`M${X0 - 46},${guion.yc} L${X0 - 46},${yPend + 76}`} stroke="url(#hilo)" strokeWidth="2" opacity="0.55" />
        {layout.map(({ yc, f }) => (
          <path key={`s${f.n}`} d={`M${X0 - 46},${yc} C${X0 - 26},${yc} ${X0 - 18},${yc} ${X0},${yc}`} stroke={f.color} strokeWidth="1.6" fill="none" opacity="0.6" />
        ))}

        {/* the frozen architecture feeds chapters III to VII: threads that cross every rail */}
        {layout.slice(5).map(({ p, f }, k) => (
          <path key={`a${f.n}`} d={`M${arq.x},${arq.y} C${arq.x + 60 - k * 30},${arq.y + 340 + k * 40} ${p[0].x + 380 - k * 40},${p[0].y - 260} ${p[0].x},${p[0].y}`}
            stroke={lila} strokeWidth="1.1" fill="none" opacity="0.32" strokeDasharray="2 5" />
        ))}
        {/* the script also feeds the teaser and the opening */}
        <path d={`M${guion.p[6].x},${guion.p[6].y} C${guion.p[6].x - 40},${guion.p[6].y + 70} ${teaser.p[0].x + 120},${teaser.p[0].y - 60} ${teaser.p[0].x},${teaser.p[0].y}`} stroke={oro} strokeWidth="1.1" fill="none" opacity="0.35" strokeDasharray="2 5" />
        {/* the teaser's look becomes the opening */}
        <path d={`M${teaser.p[7].x},${teaser.p[7].y} C${teaser.p[7].x + 60},${teaser.p[7].y + 90} ${layout[2].p[0].x + 200},${layout[2].p[0].y - 40} ${layout[2].p[0].x},${layout[2].p[0].y}`} stroke={oro} strokeWidth="1.3" fill="none" opacity="0.45" />

        {layout.map(({ f, p }) => {
          const ult = p[p.length - 1];
          return (
            <g key={f.n}>
              {/* halo under the rail */}
              <path d={curva(p)} stroke={f.color} strokeWidth="6" fill="none" opacity="0.28" filter="url(#halo)" />
              <path d={curva(p)} stroke={f.color} strokeWidth="2" fill="none" opacity="0.9" filter="url(#brillo)" />
              {/* link to the frame */}
              {f.img && <path d={`M${ult.x},${ult.y} C${ult.x + 40},${ult.y} ${TH.x - 40},${ult.y} ${TH.x},${ult.y}`} stroke={f.color} strokeWidth="1.2" fill="none" opacity="0.5" strokeDasharray="3 4" />}
              {/* discarded paths */}
              {f.rechazos?.map((r) => {
                const a = p[r.i];
                const s = r.arriba ? -1 : 1;
                const ex = a.x + 34;
                const ey = a.y + s * (r.caida ?? 40);
                return (
                  <g key={r.t}>
                    <path d={`M${a.x},${a.y} C${a.x + 4},${a.y + s * 24} ${ex - 14},${ey} ${ex},${ey}`} stroke={cobre} strokeWidth="1.4" fill="none" opacity="0.75" />
                    <path d={`M${ex - 6},${ey - 6} L${ex + 6},${ey + 6} M${ex + 6},${ey - 6} L${ex - 6},${ey + 6}`} stroke={cobre} strokeWidth="2.2" strokeLinecap="round" filter="url(#brillo)" />
                    <text x={ex + 13} y={ey + 5} fill={cobre} opacity="0.92" fontFamily="IBM Plex Mono" fontSize="14" letterSpacing="0.5">{r.t}</text>
                  </g>
                );
              })}
              {/* every version */}
              {p.map((q, i) => {
                const fin = i === p.length - 1;
                return (
                  <g key={i}>
                    {fin && <circle cx={q.x} cy={q.y} r="16" fill={f.color} opacity="0.45" filter="url(#halo)" />}
                    <circle cx={q.x} cy={q.y} r={fin ? 8 : 4.2} fill={fin ? f.color : fondo} stroke={f.color} strokeWidth={fin ? 0 : 1.8} filter={fin ? "url(#brillo)" : undefined} />
                  </g>
                );
              })}
              {/* labels on key versions */}
              {Object.entries(f.marcas ?? {}).map(([k, t]) => {
                const q = p[Number(k)];
                return <text key={k} x={q.x} y={q.y + 24} textAnchor={Number(k) === 0 ? "start" : "middle"} fill={crema} opacity="0.78" fontFamily="IBM Plex Mono" fontSize="13">{t}</text>;
              })}
              {/* version count at the end of short rails, under the long ones */}
              <text x={f.img ? TH.x - 14 : ult.x} y={f.img ? ult.y - 12 : ult.y + 26} textAnchor="end" fill={f.color} fontFamily="IBM Plex Mono" fontSize="14" letterSpacing="0.5">{f.img ? f.final : ""}</text>
              {!f.img && <text x={ult.x} y={ult.y + 26} textAnchor="middle" fill={f.color} fontFamily="IBM Plex Mono" fontSize="13">{f.final}</text>}
            </g>
          );
        })}

        {/* what is still ahead */}
        {["VIII", "IX", "X"].map((n, k) => {
          const y = yPend + 20 + k * 28;
          return (
            <g key={n} opacity="0.5">
              <path d={`M${X0 - 46},${y} C${X0 - 26},${y} ${X0 - 18},${y} ${X0},${y}`} stroke={crema} strokeWidth="1.2" fill="none" />
              <circle cx={X0} cy={y} r="4" fill="none" stroke={crema} strokeWidth="1.4" strokeDasharray="2 2" />
              <path d={`M${X0 + 10},${y} L${X0 + 160},${y}`} stroke={crema} strokeWidth="1" strokeDasharray="2 6" />
            </g>
          );
        })}
      </svg>

      {/* rail titles, like the chapter cards */}
      {layout.map(({ f, top }) => (
        <div key={f.n} style={{ position: "absolute", left: X0 - 8, top: top + (f.n === "01" ? 4 : 6), display: "flex", alignItems: "baseline", gap: 12, whiteSpace: "nowrap" }}>
          <span style={{ ...mono, fontSize: 15, letterSpacing: 2, color: f.color }}>{/^\d/.test(f.n) ? f.n : `CAP. ${f.n}`}</span>
          <span style={{ fontWeight: 500, fontSize: 21, letterSpacing: 0.2 }}>{f.titulo}</span>
          <span style={{ ...mono, fontSize: 13, opacity: 0.55 }}>{f.versiones} {f.versiones === 1 ? "versión" : "versiones"}</span>
        </div>
      ))}
      {/* frames from the latest version of each piece */}
      {layout.filter(({ f }) => f.img).map(({ f, yc }) => (
        <div key={`t${f.n}`} style={{ position: "absolute", left: TH.x, top: yc - TH.h / 2 + 4, width: TH.w, height: TH.h, borderRadius: 8, overflow: "hidden", border: `1.5px solid ${f.color}`, boxShadow: `0 0 22px ${f.color}55` }}>
          <Img src={staticFile(`bitacora/${f.img}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", right: 5, bottom: 4, ...mono, fontSize: 12, padding: "1px 5px", borderRadius: 4, background: "rgba(2,3,6,0.8)" }}>{f.dur}</div>
        </div>
      ))}
      {/* chapters still to produce */}
      {[
        ["VIII", "¿Hasta dónde llega la estructura?"],
        ["IX", "El lenguaje y sus rangos"],
        ["X", "La frontera"],
      ].map(([n, t], k) => (
        <div key={n} style={{ position: "absolute", left: X0 + 176, top: yPend + 10 + k * 28, display: "flex", gap: 12, alignItems: "baseline", opacity: 0.55, whiteSpace: "nowrap" }}>
          <span style={{ ...mono, fontSize: 14, letterSpacing: 2 }}>CAP. {n}</span>
          <span style={{ fontSize: 17 }}>{t}</span>
          <span style={{ ...mono, fontSize: 12, letterSpacing: 2 }}>· POR PRODUCIR</span>
        </div>
      ))}
      {/* legend + running time */}
      <div style={{ position: "absolute", left: 64, right: 40, top: yPend + 98, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ display: "flex", gap: 18, ...mono, fontSize: 13, letterSpacing: 1.5 }}>
          {[[oro, "ENTREGADO"], [rosa, "PRODUCIDO"], [lila, "PREVIA"], [cobre, "✕ DESCARTADO"]].map(([c, t]) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 6, color: c }}>
              {t !== "✕ DESCARTADO" && <span style={{ width: 8, height: 8, borderRadius: 4, background: c, boxShadow: `0 0 8px ${c}` }} />}
              {t}
            </span>
          ))}
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontWeight: 700, fontSize: 30, textShadow: "0 0 14px rgba(255,244,222,0.35)" }}>43:49</span>
          <span style={{ ...mono, fontSize: 13, opacity: 0.7, marginLeft: 8 }}>DE ~55 MIN</span>
        </div>
      </div>

      {/* film finish: scanlines, vignette, grain */}
      <AbsoluteFill style={{ background: "repeating-linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.13) 3px)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 70% at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.7) 100%)" }} />
      <Grano />
    </AbsoluteFill>
  );
};
