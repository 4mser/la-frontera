/* Diffusion-limited aggregation on a square lattice (Witten & Sander 1981): a fixed seed at the centre; each new
   particle is launched on a circle just outside the cluster, walks at random and sticks at its first contact.
   Prints, in arrival order, "p x y" for every stuck particle and "w i x y ..." for the walks we want to show.
   Usage: dla N seed walkRecordFirst walkRecordLast > out.txt */
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#define L 2001
#define C (L / 2)
static unsigned char g[L][L];
static unsigned long long s;
static unsigned long long rnd(void) { s ^= s << 13; s ^= s >> 7; s ^= s << 17; return s; }
static double uni(void) { return (rnd() >> 11) * (1.0 / 9007199254740992.0); }
static int toca(int x, int y) { return g[x + 1][y] | g[x - 1][y] | g[x][y + 1] | g[x][y - 1]; }
int main(int argc, char **argv) {
  int N = atoi(argv[1]); s = 88172645463325252ULL ^ (unsigned long long)atoll(argv[2]);
  int w0 = argc > 3 ? atoi(argv[3]) : 0, w1 = argc > 4 ? atoi(argv[4]) : 0;
  /* the first walks are launched from a visible circle so the viewer can follow them */
  double rVis = argc > 5 ? atof(argv[5]) : 0;
  g[C][C] = 1; double rmax = 0; printf("p 0 0\n");
  static int px[400000], py[400000];
  for (int k = 1; k < N; k++) {
    int grab = (k >= w0 && k < w1) || (k < 4 && rVis > 0);
    double r0 = (k < 4 && rVis > 0) ? rVis : rmax + 5, rkill = (k < 4 && rVis > 0) ? rVis * 1.5 : rmax * 2 + 50;
    for (;;) {
      double a = uni() * 2 * M_PI; int x = C + (int)lround(r0 * cos(a)), y = C + (int)lround(r0 * sin(a)), n = 0;
      int ok = 0;
      for (;;) {
        double dx = x - C, dy = y - C, d = sqrt(dx * dx + dy * dy);
        if (d > rkill || x < 2 || y < 2 || x > L - 3 || y > L - 3) break;
        if (grab && n < 400000) { px[n] = x - C; py[n] = y - C; n++; }
        if (toca(x, y)) { g[x][y] = 1; if (d > rmax) rmax = d; ok = 1; break; }
        /* far from the cluster: a long jump that keeps the walk statistics (circle of radius d - rmax - 2) */
        double lib = d - rmax - 2;
        if (lib > 4 && !grab) { double b = uni() * 2 * M_PI; x += (int)lround(lib * cos(b)); y += (int)lround(lib * sin(b)); continue; }
        switch (rnd() & 3) { case 0: x++; break; case 1: x--; break; case 2: y++; break; default: y--; }
      }
      if (ok) {
        printf("p %d %d\n", x - C, y - C);
        if (grab) { printf("w %d", k); for (int i = 0; i < n; i++) printf(" %d %d", px[i], py[i]); printf("\n"); }
        break;
      }
    }
  }
  fprintf(stderr, "rmax %.1f\n", rmax);
  return 0;
}
