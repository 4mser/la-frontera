/* Hydraulic erosion by raindrops (after H. Beyer, 2015): every drop falls on a random point of a heightmap, runs
   downhill with a little inertia, picks up sediment where it is fast and the slope is steep (its capacity grows with
   speed, water and slope) and drops it where it slows. Where more water passes, the bed is cut deeper, and the deeper
   bed gathers still more water: a network of channels organizes itself.
   Usage: gotas W H drops snapshots seed out_prefix
   Writes out_prefix_NN.f32 (height, W*H floats) and out_prefix_NN.q32 (water passages in the window, W*H floats). */
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
static int W, H;
static float *z, *q;
static unsigned long long s;
static unsigned long long rnd(void) { s ^= s << 13; s ^= s >> 7; s ^= s << 17; return s; }
static double uni(void) { return (rnd() >> 11) * (1.0 / 9007199254740992.0); }
static void grad(double x, double y, double *h, double *gx, double *gy) {
  int i = (int)x, j = (int)y; double u = x - i, v = y - j;
  float a = z[j * W + i], b = z[j * W + i + 1], c = z[(j + 1) * W + i], d = z[(j + 1) * W + i + 1];
  *gx = (b - a) * (1 - v) + (d - c) * v; *gy = (c - a) * (1 - u) + (d - b) * u;
  *h = a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}
/* change the height around (x, y) by amount, spread over a small brush (radius R) */
static void pincel(double x, double y, double amount, int R) {
  int ci = (int)x, cj = (int)y; double tot = 0, wts[64]; int idx[64], n = 0;
  for (int dj = -R; dj <= R; dj++) for (int di = -R; di <= R; di++) {
    int i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= W || j >= H) continue;
    double d = hypot(i - x, j - y); if (d > R) continue;
    double w = R - d; wts[n] = w; idx[n] = j * W + i; tot += w; n++;
  }
  for (int k = 0; k < n; k++) z[idx[k]] += (float)(amount * wts[k] / tot);
}
int main(int argc, char **argv) {
  W = atoi(argv[1]); H = atoi(argv[2]); long N = atol(argv[3]); int S = atoi(argv[4]); s = 0x9E3779B97F4A7C15ULL ^ atoll(argv[5]);
  const char *pre = argv[6];
  z = malloc(sizeof(float) * W * H); q = calloc(W * H, sizeof(float));
  if (fread(z, sizeof(float), W * H, stdin) != (size_t)(W * H)) { fprintf(stderr, "need initial heightmap on stdin\n"); return 1; }
  const double INER = 0.1, CAP = 6, MINS = 0.004, ERO = 0.3, DEP = 0.04, EVA = 0.0025, G = 4; const int R = 1, VIDA = 700;
  int foto = 0;
  for (long k = 0; k < N; k++) {
    if (k % 2000 == 0) for (int t = 0; t < W * H; t++) if (z[t] < 0) z[t] = 0;   /* the sea: nothing is cut below it */
    double x = 1 + uni() * (W - 3), y = 1 + uni() * (H - 3), dx = 0, dy = 0, vel = 1, agua = 1, sed = 0;
    for (int paso = 0; paso < VIDA; paso++) {
      int i = (int)x, j = (int)y; double u = x - i, v = y - j, h, gx, gy;
      grad(x, y, &h, &gx, &gy);
      q[j * W + i] += (float)agua;
      dx = dx * INER - gx * (1 - INER); dy = dy * INER - gy * (1 - INER);
      double L = hypot(dx, dy); if (L < 1e-9) { double a = uni() * 6.283; dx = cos(a); dy = sin(a); L = 1; }
      dx /= L; dy /= L; x += dx; y += dy;
      if (x < 0 || y < 0 || x >= W - 1 || y >= H - 1) break;   /* it leaves the map: the sea */
      double h2, g2x, g2y; grad(x, y, &h2, &g2x, &g2y);
      double dh = h2 - h;
      double cap = fmax(-dh, MINS) * vel * agua * CAP;
      if (sed > cap || dh > 0) {
        double dep = dh > 0 ? fmin(dh, sed) : (sed - cap) * DEP;
        sed -= dep;
        float a = z[j * W + i], b = z[j * W + i + 1], c = z[(j + 1) * W + i], d = z[(j + 1) * W + i + 1]; (void)a; (void)b; (void)c; (void)d;
        z[j * W + i] += dep * (1 - u) * (1 - v); z[j * W + i + 1] += dep * u * (1 - v);
        z[(j + 1) * W + i] += dep * (1 - u) * v; z[(j + 1) * W + i + 1] += dep * u * v;
      } else {
        double e = fmin((cap - sed) * ERO, -dh * 0.8);   /* never dig below the next point */
        pincel(x - dx, y - dy, -e, R); sed += e;
      }
      vel = fmin(sqrt(fmax(0, vel * vel - dh * G)), 6.0); agua *= (1 - EVA);
    }
    /* snapshots closer together at the start, when the network is being born: drop counts N·(i/S)^2 */
    long marca = (long)(N * pow((foto + 1.0) / S, 2.0));
    if (k + 1 >= marca && foto < S) {
      char f[512]; FILE *o;
      sprintf(f, "%s_%02d.f32", pre, foto); o = fopen(f, "wb"); fwrite(z, sizeof(float), W * H, o); fclose(o);
      sprintf(f, "%s_%02d.q32", pre, foto); o = fopen(f, "wb"); fwrite(q, sizeof(float), W * H, o); fclose(o);
      for (int t = 0; t < W * H; t++) q[t] = 0;
      foto++;
    }
  }
  return 0;
}
