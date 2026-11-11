// Microcosmos renderer: additive darkfield splatting with depth-of-field layers.
// Primitives (screen space, full-res pixel units) are splatted into depth-of-field layers
// (each layer = one blur level, rendered at reduced resolution for large blurs), every layer is
// blurred by its circle of confusion and all layers are summed into the output (RGB float).
// Build: cc -O3 -ffast-math -shared -fPIC -o librender.so render.c -lm
#include <math.h>
#include <stdlib.h>
#include <string.h>

#define NL 8
static const float SIG[NL] = {0.f, 1.f, 2.f, 4.f, 8.f, 16.f, 32.f, 64.f};
static const int DIV[NL] = {1, 1, 1, 2, 2, 4, 8, 8};

typedef struct { int w, h, div; float *p; } Layer;

static inline float clampf(float x, float a, float b) { return x < a ? a : (x > b ? b : x); }
static inline float smooth(float e0, float e1, float x) { float t = clampf((x - e0) / (e1 - e0), 0.f, 1.f); return t * t * (3.f - 2.f * t); }

// ---- blur: 3 box passes approximating a gaussian of sigma (in layer pixels) ----
static void box_h(const float *src, float *dst, int w, int h, int r) {
  if (r < 1) { memcpy(dst, src, sizeof(float) * 3 * w * h); return; }
  float inv = 1.f / (2 * r + 1);
  for (int y = 0; y < h; y++) {
    const float *s = src + (size_t)y * w * 3; float *d = dst + (size_t)y * w * 3;
    for (int c = 0; c < 3; c++) {
      float acc = 0;
      for (int i = -r; i <= r; i++) { int xi = i < 0 ? 0 : (i >= w ? w - 1 : i); acc += s[xi * 3 + c]; }
      for (int x = 0; x < w; x++) {
        d[x * 3 + c] = acc * inv;
        int xa = x + r + 1; if (xa >= w) xa = w - 1;
        int xr = x - r; if (xr < 0) xr = 0;
        acc += s[xa * 3 + c] - s[xr * 3 + c];
      }
    }
  }
}
static void box_v(const float *src, float *dst, int w, int h, int r) {
  if (r < 1) { memcpy(dst, src, sizeof(float) * 3 * w * h); return; }
  float inv = 1.f / (2 * r + 1);
  float *acc = (float *)calloc((size_t)w * 3, sizeof(float));
  for (int i = -r; i <= r; i++) { int yi = i < 0 ? 0 : (i >= h ? h - 1 : i); const float *s = src + (size_t)yi * w * 3; for (int k = 0; k < w * 3; k++) acc[k] += s[k]; }
  for (int y = 0; y < h; y++) {
    float *d = dst + (size_t)y * w * 3;
    for (int k = 0; k < w * 3; k++) d[k] = acc[k] * inv;
    int ya = y + r + 1; if (ya >= h) ya = h - 1;
    int yr = y - r; if (yr < 0) yr = 0;
    const float *sa = src + (size_t)ya * w * 3, *sr = src + (size_t)yr * w * 3;
    for (int k = 0; k < w * 3; k++) acc[k] += sa[k] - sr[k];
  }
  free(acc);
}
void blur_rgb(float *img, int w, int h, float sigma) {
  if (sigma < 0.3f) return;
  // box radius for 3 passes: sigma^2 = 3 * ((2r+1)^2 - 1) / 12
  float rr = sqrtf(4.f * sigma * sigma / 3.f + 1.f); int r = (int)floorf((rr - 1.f) * 0.5f + 0.5f); if (r < 1) r = 1;
  float *tmp = (float *)malloc(sizeof(float) * 3 * w * h);
  for (int p = 0; p < 3; p++) { box_h(img, tmp, w, h, r); box_v(tmp, img, w, h, r); }
  free(tmp);
}

// ---- splatting ----
static void splat_seg(Layer *L, float x0, float y0, float x1, float y1, float w0, float w1, const float *c0, const float *c1) {
  float s = 1.f / L->div; x0 *= s; y0 *= s; x1 *= s; y1 *= s; w0 *= s; w1 *= s;
  float hw0 = 0.5f * w0, hw1 = 0.5f * w1;
  float dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy, len = sqrtf(len2);
  if (len < 1e-4f) { len = 1e-4f; len2 = len * len; dx = len; dy = 0; }
  float ux = dx / len, uy = dy / len;
  float hwm = fmaxf(hw0, hw1);
  float pad = fmaxf(hwm, 0.f) + 2.5f;
  int xa = (int)floorf(fminf(x0, x1) - pad), xb = (int)ceilf(fmaxf(x0, x1) + pad);
  int ya = (int)floorf(fminf(y0, y1) - pad), yb = (int)ceilf(fmaxf(y0, y1) + pad);
  if (xa < 0) xa = 0; if (ya < 0) ya = 0; if (xb > L->w - 1) xb = L->w - 1; if (yb > L->h - 1) yb = L->h - 1;
  if (xa > xb || ya > yb) return;
  const float SG = 0.62f, inv2s2 = 1.f / (2.f * SG * SG), gnorm = 1.f / (SG * 2.5066f);
  for (int y = ya; y <= yb; y++) {
    float py = y + 0.5f - y0;
    float *row = L->p + (size_t)y * L->w * 3;
    for (int x = xa; x <= xb; x++) {
      float px = x + 0.5f - x0;
      float along = px * ux + py * uy;
      float perp = fabsf(-px * uy + py * ux);
      float cov = clampf(0.5f + along, 0.f, 1.f) * clampf(0.5f + len - along, 0.f, 1.f);
      if (cov <= 0.f) continue;
      float t = clampf(along / len, 0.f, 1.f);
      float hw = hw0 + (hw1 - hw0) * t;
      float I;
      if (hw < 1.6f) {
        // thin: energy conserving gaussian line (integral across = 2*hw)
        float g = 2.f * hw * gnorm * expf(-perp * perp * inv2s2);
        if (hw > 0.9f) {
          float rim = expf(-(perp - hw + 0.55f) * (perp - hw + 0.55f) * 2.2f);
          float core = clampf(hw + 0.5f - perp, 0.f, 1.f);
          float b = 0.9f * rim + 0.25f * core;
          float m = smooth(0.9f, 1.6f, hw); I = g * (1.f - m) + b * m;
        } else I = g;
      } else {
        // wide glass bar: bright fresnel rims, translucent core
        float rs = 0.6f + 0.05f * hw;                       // rim softness grows with the bar
        float rd = perp - hw + rs;
        float rim = expf(-rd * rd / (2.f * rs * rs * 0.36f));
        float q = perp / hw; q = q * q; q = q * q;
        float core = clampf(hw + 0.5f - perp, 0.f, 1.f) * (0.16f + 0.30f * q);
        float sp = expf(-perp * perp / (0.08f * hw * hw + 0.3f)) * 0.22f; // axial specular streak
        I = 0.9f * rim + core + sp;
      }
      I *= cov;
      if (I < 1e-5f) continue;
      float *o = row + x * 3;
      o[0] += I * (c0[0] + (c1[0] - c0[0]) * t);
      o[1] += I * (c0[1] + (c1[1] - c0[1]) * t);
      o[2] += I * (c0[2] + (c1[2] - c0[2]) * t);
    }
  }
}

static void splat_pt(Layer *L, float x0, float y0, float rad, const float *c) {
  float s = 1.f / L->div; x0 *= s; y0 *= s; rad *= s;
  float sg = fmaxf(rad, 0.55f);
  float gain = (rad / sg) * (rad / sg); // energy conserving below the pixel
  float inv = 1.f / (2.f * sg * sg);
  int R = (int)ceilf(sg * 3.2f + 1.f);
  int xa = (int)x0 - R, xb = (int)x0 + R, ya = (int)y0 - R, yb = (int)y0 + R;
  if (xa < 0) xa = 0; if (ya < 0) ya = 0; if (xb > L->w - 1) xb = L->w - 1; if (yb > L->h - 1) yb = L->h - 1;
  for (int y = ya; y <= yb; y++) {
    float dy = y + 0.5f - y0; float *row = L->p + (size_t)y * L->w * 3;
    for (int x = xa; x <= xb; x++) {
      float dx = x + 0.5f - x0; float I = gain * expf(-(dx * dx + dy * dy) * inv);
      if (I < 1e-5f) continue;
      float *o = row + x * 3; o[0] += I * c[0]; o[1] += I * c[1]; o[2] += I * c[2];
    }
  }
}

// bokeh disc (full res, already defocused): radius R, total energy = pi*r0^2 * c
static void splat_disc(Layer *L, float x0, float y0, float r0, float R, const float *c) {
  float s = 1.f / L->div; x0 *= s; y0 *= s; r0 *= s; R *= s;
  if (R < 0.6f) R = 0.6f;
  float gain = (r0 * r0) / (R * R) * 1.0f;
  int Ri = (int)ceilf(R + 2.f);
  int xa = (int)x0 - Ri, xb = (int)x0 + Ri, ya = (int)y0 - Ri, yb = (int)y0 + Ri;
  if (xa < 0) xa = 0; if (ya < 0) ya = 0; if (xb > L->w - 1) xb = L->w - 1; if (yb > L->h - 1) yb = L->h - 1;
  for (int y = ya; y <= yb; y++) {
    float dy = y + 0.5f - y0; float *row = L->p + (size_t)y * L->w * 3;
    for (int x = xa; x <= xb; x++) {
      float dx = x + 0.5f - x0; float r = sqrtf(dx * dx + dy * dy);
      float edge = clampf(R + 0.5f - r, 0.f, 1.f);
      if (edge <= 0.f) continue;
      float q = r / R; float prof = 0.55f + 0.45f * q * q * q * q; // brighter rim, like real bokeh
      float I = gain * edge * prof;
      float *o = row + x * 3; o[0] += I * c[0]; o[1] += I * c[1]; o[2] += I * c[2];
    }
  }
}

// translucent membrane sphere: projected thin-shell profile (1/sqrt(1-r^2)) plus fill
static void splat_sph(Layer *L, float x0, float y0, float R, float rim, float fill, const float *c) {
  float s = 1.f / L->div; x0 *= s; y0 *= s; R *= s;
  if (R < 0.5f) R = 0.5f;
  int Ri = (int)ceilf(R + 2.f);
  int xa = (int)x0 - Ri, xb = (int)x0 + Ri, ya = (int)y0 - Ri, yb = (int)y0 + Ri;
  if (xa < 0) xa = 0; if (ya < 0) ya = 0; if (xb > L->w - 1) xb = L->w - 1; if (yb > L->h - 1) yb = L->h - 1;
  float lim = 1.f - 1.f / (R + 1.f);
  for (int y = ya; y <= yb; y++) {
    float dy = y + 0.5f - y0; float *row = L->p + (size_t)y * L->w * 3;
    for (int x = xa; x <= xb; x++) {
      float dx = x + 0.5f - x0; float r = sqrtf(dx * dx + dy * dy);
      float ew = 0.5f + 0.015f * R;
      float edge = clampf((R - r) / ew + 0.5f, 0.f, 1.f);
      if (edge <= 0.f) continue;
      float q = fminf(r / R, lim);
      float prof = 1.f / sqrtf(1.f - q * q) - 1.f;
      float I = edge * (fill + rim * fminf(prof, 3.f) * 0.35f);
      float *o = row + x * 3; o[0] += I * c[0]; o[1] += I * c[1]; o[2] += I * c[2];
    }
  }
}

// coc (sigma px, full res) -> two layers + weights (log interpolation)
static void pick(float coc, int *k0, int *k1, float *wa) {
  if (coc <= 0.5f) { *k0 = 0; *k1 = 0; *wa = 1.f; return; }
  if (coc >= SIG[NL - 1]) { *k0 = NL - 1; *k1 = NL - 1; *wa = 1.f; return; }
  if (coc < 1.f) { *k0 = 0; *k1 = 1; *wa = 1.f - (coc - 0.5f) / 0.5f; return; }
  int k = 1; while (k < NL - 1 && SIG[k + 1] <= coc) k++;
  float f = logf(coc / SIG[k]) / logf(SIG[k + 1] / SIG[k]);
  *k0 = k; *k1 = k + 1; *wa = 1.f - f;
}

// Main entry.
// segs: nseg x 13 floats: x0 y0 x1 y1 w0 w1 r0 g0 b0 r1 g1 b1 coc
// pts:  npt x 6: x y rad r g b ... + coc  (7 floats)
// sph:  nsph x 9: x y R rim fill r g b coc
// out: H x W x 3 (accumulated into, not cleared)
void render(int W, int H, const float *segs, int nseg, const float *pts, int npt, const float *sph, int nsph, float *out) {
  Layer L[NL];
  for (int k = 0; k < NL; k++) {
    L[k].div = DIV[k]; L[k].w = (W + DIV[k] - 1) / DIV[k]; L[k].h = (H + DIV[k] - 1) / DIV[k];
    L[k].p = (float *)calloc((size_t)L[k].w * L[k].h * 3, sizeof(float));
  }
  float c0[3], c1[3];
  for (int i = 0; i < nsph; i++) {
    const float *q = sph + i * 9; int k0, k1; float wa; pick(q[8], &k0, &k1, &wa);
    for (int j = 0; j < 3; j++) c0[j] = q[5 + j] * wa, c1[j] = q[5 + j] * (1.f - wa);
    splat_sph(&L[k0], q[0], q[1], q[2], q[3], q[4], c0);
    if (k1 != k0) splat_sph(&L[k1], q[0], q[1], q[2], q[3], q[4], c1);
  }
  for (int i = 0; i < nseg; i++) {
    const float *q = segs + i * 13; int k0, k1; float wa; pick(q[12], &k0, &k1, &wa);
    float a0[3], a1[3], b0[3], b1[3];
    for (int j = 0; j < 3; j++) { a0[j] = q[6 + j] * wa; a1[j] = q[9 + j] * wa; b0[j] = q[6 + j] * (1 - wa); b1[j] = q[9 + j] * (1 - wa); }
    splat_seg(&L[k0], q[0], q[1], q[2], q[3], q[4], q[5], a0, a1);
    if (k1 != k0) splat_seg(&L[k1], q[0], q[1], q[2], q[3], q[4], q[5], b0, b1);
  }
  for (int i = 0; i < npt; i++) {
    const float *q = pts + i * 7; float coc = q[6];
    if (coc > 2.5f) {
      // real bokeh disc, put into the layer whose blur is small relative to the disc
      float R = sqrtf(q[2] * q[2] + coc * coc * 2.2f);
      int k = 0; if (R > 24.f) k = 3; if (R > 60.f) k = 5;
      // soften the disc edge slightly via a small blur layer
      splat_disc(&L[k > 0 ? k : 1], q[0], q[1], fmaxf(q[2], 0.6f), R, q + 3);
    } else {
      int k0, k1; float wa; pick(coc, &k0, &k1, &wa);
      for (int j = 0; j < 3; j++) c0[j] = q[3 + j] * wa, c1[j] = q[3 + j] * (1.f - wa);
      splat_pt(&L[k0], q[0], q[1], q[2], c0);
      if (k1 != k0) splat_pt(&L[k1], q[0], q[1], q[2], c1);
    }
  }
  for (int k = 0; k < NL; k++) {
    Layer *l = &L[k];
    blur_rgb(l->p, l->w, l->h, SIG[k] / l->div);
    if (l->div == 1) { for (size_t i = 0; i < (size_t)W * H * 3; i++) out[i] += l->p[i]; }
    else {
      float s = 1.f / l->div;
      for (int y = 0; y < H; y++) {
        float fy = (y + 0.5f) * s - 0.5f; int y0 = (int)floorf(fy); float ty = fy - y0; int y1 = y0 + 1;
        if (y0 < 0) y0 = 0; if (y1 > l->h - 1) y1 = l->h - 1; if (y0 > l->h - 1) y0 = l->h - 1;
        for (int x = 0; x < W; x++) {
          float fx = (x + 0.5f) * s - 0.5f; int x0 = (int)floorf(fx); float tx = fx - x0; int x1 = x0 + 1;
          if (x0 < 0) x0 = 0; if (x1 > l->w - 1) x1 = l->w - 1; if (x0 > l->w - 1) x0 = l->w - 1;
          const float *a = l->p + ((size_t)y0 * l->w + x0) * 3, *b = l->p + ((size_t)y0 * l->w + x1) * 3;
          const float *c = l->p + ((size_t)y1 * l->w + x0) * 3, *d = l->p + ((size_t)y1 * l->w + x1) * 3;
          float *o = out + ((size_t)y * W + x) * 3;
          for (int j = 0; j < 3; j++) o[j] += (a[j] * (1 - tx) + b[j] * tx) * (1 - ty) + (c[j] * (1 - tx) + d[j] * tx) * ty;
        }
      }
    }
    free(l->p);
  }
}

// Julia boundary field with a morph from a (gently wobbling) circle.
// The Julia side uses the Green potential G = log|z_n| / 2^n on a 2x supersampled grid; the signed
// distance to the equipotential G = lev is (G - lev) / |grad G| (finite differences), which tends to
// the classic distance estimate when lev -> 0 and stays smooth around the critical points.
// Writes two channels per pixel: edge glow, inner glow.
void julia(int W, int H, float cx, float cy, double scale, double rot, double cre, double cim, int maxit,
           float m, float rc, float llev, float gw_px, float wob, float tph, int bx0, int by0, int bx1, int by1, float *out) {
  double cr = cos(rot), sr = sin(rot);
  if (bx0 < 0) bx0 = 0; if (by0 < 0) by0 = 0; if (bx1 > W - 1) bx1 = W - 1; if (by1 > H - 1) by1 = H - 1;
  if (bx0 > bx1 || by0 > by1) return;
  int gw = (bx1 - bx0 + 1) * 2 + 2, gh = (by1 - by0 + 1) * 2 + 2;   // supersampled grid with a 1-sample border
  double *G = (double *)malloc(sizeof(double) * gw * gh);
  double *C = (double *)malloc(sizeof(double) * gw * gh);
  double *T = (double *)malloc(sizeof(double) * gw * gh);
  double s2 = scale * 0.5;
  for (int j = 0; j < gh; j++) {
    for (int i = 0; i < gw; i++) {
      double px = (bx0 + (i - 1 + 0.5) * 0.5 - cx) * scale, py = (by0 + (j - 1 + 0.5) * 0.5 - cy) * scale;
      double zr = cr * px - sr * py, zi = sr * px + cr * py;
      double r0 = sqrt(zr * zr + zi * zi), th = atan2(zi, zr);
      C[j * gw + i] = r0 - rc * (1.0 + wob * (0.6 * sin(3 * th + tph) + 0.4 * sin(5 * th - 1.7 * tph + 1.0) + 0.25 * sin(8 * th + 2.3 * tph)));
      double g = -1e300, trap = 1e9;   // g holds log(G); -1e300 = never escaped (inside)
      if (m > 0.f) {
        double ar = zr, ai = zi;
        for (int it = 0; it < maxit; it++) {
          double nr = ar * ar - ai * ai + cre; ai = 2 * ar * ai + cim; ar = nr;
          double a2 = ar * ar + ai * ai;
          if (it > 2 && a2 < trap) trap = a2;
          if (a2 > 1e12) { g = log(0.5 * log(a2)) - (it + 1) * 0.6931471805599453; break; }
        }
      }
      G[j * gw + i] = g;
      T[j * gw + i] = sqrt(trap);
    }
  }
  for (int y = by0; y <= by1; y++) {
    for (int x = bx0; x <= bx1; x++) {
      double acc_e = 0, acc_f = 0;
      for (int sy = 0; sy < 2; sy++) for (int sx = 0; sx < 2; sx++) {
        int i = (x - bx0) * 2 + sx + 1, j = (y - by0) * 2 + sy + 1;
        double sdc = C[j * gw + i] / scale;   // pixels
        double sd = sdc;
        if (m > 0.f) {
          // signed distance (pixels) to the equipotential G = lev, computed in log space: no underflow
          double lg = G[j * gw + i];
          double sdj;
          if (lg < -1e299) sdj = (llev < -1e3) ? -1.5 : -0.9 / scale;
          else {
            double l1 = G[j * gw + i + 1], l0 = G[j * gw + i - 1], u1 = G[(j + 1) * gw + i], u0 = G[(j - 1) * gw + i];
            if (l1 < -1e299) l1 = lg; if (l0 < -1e299) l0 = lg; if (u1 < -1e299) u1 = lg; if (u0 < -1e299) u0 = lg;
            double gx = (l1 - l0) / (2 * s2), gy = (u1 - u0) / (2 * s2);
            double gn = sqrt(gx * gx + gy * gy) * scale;           // |grad log G| per pixel
            if (gn < 1e-9) gn = 1e-9;
            double q = llev - lg;                                    // log(lev / G)
            // outside the equipotential: (1 - lev/G)/|grad log G| (-> distance estimate as lev -> 0);
            // inside: strongly negative (dark protoplasm)
            if (q > 30) q = 30;
            sdj = (1.0 - exp(q)) / gn;
          }
          { double cl = 0.9 / scale; if (sdj > cl) sdj = cl; if (sdj < -cl) sdj = -cl; }
          sd = (1.0 - m) * sdc + m * sdj;
        }
        double e = exp(-fabs(sd) / gw_px);
        double e2 = exp(-fabs(sd) / (gw_px * 4.0));
        acc_e += 0.92 * e + 0.08 * e2;
        if (0)
          acc_f += (1.0 - m) * (sd < 0 ? exp(sd / 60.0) : 0.0) + m * (0.3 + 0.7 * exp(-6.0 * T[((y - by0) * 2 + sy + 1) * gw + (x - bx0) * 2 + sx + 1]));
        else acc_f += sd < 0 ? exp(sd / 60.0) : 0.0;
      }
      out[((size_t)y * W + x) * 2 + 0] = (float)(acc_e * 0.25);
      out[((size_t)y * W + x) * 2 + 1] = (float)(acc_f * 0.25);
    }
  }
  free(G); free(C); free(T);
}
