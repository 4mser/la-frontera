// Epilogue, act C: the Mandelbrot set at double precision, smooth escape count and distance estimate per pixel,
// for herramientas/epilogo_c.py (coloured there with herramientas/mandel_profundo/color.py).
// Build: cc -O3 -ffast-math -shared -fPIC -o libmandel_epi.dylib mandel_epi.c -lpthread
#include <math.h>
#include <pthread.h>

typedef struct { double cx, cy, ancho; int w, h, maxit, y0, y1; float *nu, *de; } Trabajo;

static void *fila(void *p) {
  Trabajo *T = (Trabajo *)p;
  double px = T->ancho / T->w;
  for (int j = T->y0; j < T->y1; j++) {
    double ci = T->cy + (j - T->h / 2.0 + 0.5) * px;
    for (int i = 0; i < T->w; i++) {
      double cr = T->cx + (i - T->w / 2.0 + 0.5) * px;
      // main cardioid and period-2 bulb: inside
      double q = (cr - 0.25) * (cr - 0.25) + ci * ci;
      if (q * (q + (cr - 0.25)) < 0.25 * ci * ci || (cr + 1) * (cr + 1) + ci * ci < 0.0625) { T->nu[j * T->w + i] = -1; T->de[j * T->w + i] = 0; continue; }
      double zr = 0, zi = 0, dr = 0, di = 0, r2 = 0;
      int n = 0;
      for (; n < T->maxit; n++) {
        double ndr = 2 * (zr * dr - zi * di) + 1, ndi = 2 * (zr * di + zi * dr);
        double nzr = zr * zr - zi * zi + cr, nzi = 2 * zr * zi + ci;
        zr = nzr; zi = nzi; dr = ndr; di = ndi;
        r2 = zr * zr + zi * zi;
        if (r2 > 1e8) break;
      }
      if (n >= T->maxit) { T->nu[j * T->w + i] = -1; T->de[j * T->w + i] = 0; continue; }
      double lz = 0.5 * log(r2);
      T->nu[j * T->w + i] = (float)(n + 1 - log(lz / log(2.0)) / log(2.0));
      double dz = sqrt(dr * dr + di * di);
      T->de[j * T->w + i] = (float)(sqrt(r2) * lz / dz / px);       // distance to the set, in pixels
    }
  }
  return 0;
}

void calcula(double cx, double cy, double ancho, int w, int h, int maxit, float *nu, float *de, int hilos) {
  pthread_t th[64]; Trabajo T[64];
  if (hilos > 64) hilos = 64;
  for (int k = 0; k < hilos; k++) {
    T[k] = (Trabajo){cx, cy, ancho, w, h, maxit, h * k / hilos, h * (k + 1) / hilos, nu, de};
    pthread_create(&th[k], 0, fila, &T[k]);
  }
  for (int k = 0; k < hilos; k++) pthread_join(th[k], 0);
}
