/* Off-lattice diffusion-limited aggregation (Witten & Sander 1981, without the lattice): discs of diameter 2; a
   fixed seed at the centre; each particle is launched on a circle just outside the cluster, walks at random and sticks
   when it touches a disc. Steps are as long as the free space around the walker allows (the standard speed-up), so the
   walk statistics are those of a Brownian walker.
   Prints, in arrival order, "p x y parent" and, for the recorded particles, "w k x y x y ..." (their walk).
   Usage: dla2 N seed recFrom recTo rVis(0 = none) */
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#define G 1600          /* hash grid: cells of 4 units */
#define CS 4.0
#define OFF (G * CS / 2)
#define MAXP 400000
static int head[G][G], nxt[MAXP];
static double X[MAXP], Y[MAXP];
static int n = 0;
static unsigned long long s;
static unsigned long long rnd(void) { s ^= s << 13; s ^= s >> 7; s ^= s << 17; return s; }
static double uni(void) { return (rnd() >> 11) * (1.0 / 9007199254740992.0); }
static void pon(double x, double y) { int i = (int)((x + OFF) / CS), j = (int)((y + OFF) / CS); X[n] = x; Y[n] = y; nxt[n] = head[i][j]; head[i][j] = n; n++; }
/* nearest disc within ~2 cells; returns its index and the distance in *dd (big if none) */
static int cerca(double x, double y, double *dd) {
  int i = (int)((x + OFF) / CS), j = (int)((y + OFF) / CS), best = -1; double b = 1e9;
  for (int a = i - 2; a <= i + 2; a++) for (int c = j - 2; c <= j + 2; c++) {
    if (a < 0 || c < 0 || a >= G || c >= G) continue;
    for (int k = head[a][c]; k >= 0; k = nxt[k]) { double d = hypot(X[k] - x, Y[k] - y); if (d < b) { b = d; best = k; } }
  }
  *dd = b; return best;
}
static double wx[2000000], wy[2000000];
int main(int argc, char **argv) {
  int N = atoi(argv[1]); s = 88172645463325252ULL ^ (unsigned long long)atoll(argv[2]) * 2654435761ULL;
  int r0 = atoi(argv[3]), r1 = atoi(argv[4]); double rVis = atof(argv[5]);
  for (int a = 0; a < G; a++) for (int c = 0; c < G; c++) head[a][c] = -1;
  pon(0, 0); printf("p 0 0 -1\n");
  double rmax = 0;
  for (int k = 1; k < N; k++) {
    int rec = (k >= r0 && k < r1);
    int vis = rVis > 0 && k <= 3;
    for (;;) {
      double R0 = vis ? rVis : rmax + 6, RK = vis ? rVis * 1.6 : 3 * rmax + 60;
      double a = uni() * 2 * M_PI, x = R0 * cos(a), y = R0 * sin(a); int m = 0, ok = 0, par = -1;
      for (;;) {
        double d = hypot(x, y);
        if (d > RK) break;
        if ((rec || vis) && m < 2000000) { wx[m] = x; wy[m] = y; m++; }
        double step;
        if (vis) { double dd; int q = cerca(x, y, &dd);   /* the walks we show: small even steps, no jumps */
          if (q >= 0 && dd < 2.0 + 1e-6) { double ux = (x - X[q]) / dd, uy = (y - Y[q]) / dd; x = X[q] + 2 * ux; y = Y[q] + 2 * uy; par = q; ok = 1; break; }
          step = q >= 0 ? fmax(0.2, fmin(dd - 2.0, 1.6)) : 1.6; }
        else if (d > rmax + 8) step = d - rmax - 4;                 /* far away: jump to just outside the cluster's circle */
        else {
          double dd; int q = cerca(x, y, &dd);
          if (q >= 0 && dd < 2.0 + 1e-6) { /* touching: stick at exact contact distance */
            double ux = (x - X[q]) / dd, uy = (y - Y[q]) / dd; x = X[q] + 2 * ux; y = Y[q] + 2 * uy; par = q; ok = 1; break; }
          step = q >= 0 ? fmax(0.25, fmin(dd - 2.0, 4.0)) : 4.0;
          if (q >= 0 && dd - 2.0 < 0.25) { /* close: move a small step, then contact if within reach */
            double b = uni() * 2 * M_PI, nx = x + 0.25 * cos(b), ny = y + 0.25 * sin(b), d2; int q2 = cerca(nx, ny, &d2);
            if (q2 >= 0 && d2 < 2.0) { double ux = (nx - X[q2]) / d2, uy = (ny - Y[q2]) / d2; x = X[q2] + 2 * ux; y = Y[q2] + 2 * uy; par = q2; ok = 1; break; }
            x = nx; y = ny; continue;
          }
        }
        double b = uni() * 2 * M_PI; x += step * cos(b); y += step * sin(b);
      }
      if (ok) {
        pon(x, y); double d = hypot(x, y); if (d > rmax) rmax = d;
        printf("p %.2f %.2f %d\n", x, y, par);
        if (rec || vis) { printf("w %d", k); int st = m > 3000 ? m / 3000 : 1; for (int i = 0; i < m; i += st) printf(" %.1f %.1f", wx[i], wy[i]); printf(" %.1f %.1f\n", x, y); }
        break;
      }
    }
  }
  fprintf(stderr, "N %d rmax %.1f D(mass-radius) %.3f\n", n, rmax, log((double)n) / log(rmax / 1.0));
  return 0;
}
