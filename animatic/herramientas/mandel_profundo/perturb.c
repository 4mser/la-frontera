// Perturbation renderer for deep Mandelbrot zooms (Zhuoran rebasing, single reference).
// Build: cc -O3 -march=native -shared -fPIC -o libperturb.dylib perturb.c -lpthread
#include <math.h>
#include <pthread.h>
#include <stdatomic.h>
#include <stdlib.h>

typedef struct {
  const double *zr, *zi;
  int len, periodic;
  int w, h;
  double offr, offi, pix;
  int maxit;
  float *nu, *de;
  atomic_int next_row;
} Job;

static void *worker(void *arg) {
  Job *J = (Job *)arg;
  const double *ZR = J->zr, *ZI = J->zi;
  const int len = J->len, periodic = J->periodic, maxit = J->maxit;
  const double bail = 1e10;
  for (;;) {
    int y = atomic_fetch_add(&J->next_row, 1);
    if (y >= J->h) break;
    double ci = J->offi - (y - 0.5 * J->h + 0.5) * J->pix;
    for (int x = 0; x < J->w; x++) {
      double cr = J->offr + (x - 0.5 * J->w + 0.5) * J->pix;
      double dr = 0, di = 0;     // delta z
      double sr = 0, si = 0;     // dz/dc times pix
      double zr = 0, zi = 0, r2 = 0;
      int m = 0, n = 0;
      const double pix = J->pix;
      for (; n < maxit; n++) {
        // derivative uses the current full z
        double nsr = 2 * (zr * sr - zi * si) + pix;
        double nsi = 2 * (zr * si + zi * sr);
        sr = nsr; si = nsi;
        double Zr = ZR[m], Zi = ZI[m];
        double ndr = 2 * (Zr * dr - Zi * di) + (dr * dr - di * di) + cr;
        double ndi = 2 * (Zr * di + Zi * dr) + 2 * dr * di + ci;
        dr = ndr; di = ndi;
        m++;
        if (periodic && m >= len - 1) m = 0;  // Z_P = Z_0 = 0
        zr = ZR[m] + dr; zi = ZI[m] + di;
        r2 = zr * zr + zi * zi;
        if (r2 > bail) break;
        if (r2 < dr * dr + di * di || (!periodic && m >= len - 1)) { dr = zr; di = zi; m = 0; }
      }
      size_t k = (size_t)y * J->w + x;
      if (n >= maxit) { J->nu[k] = -1.0f; J->de[k] = 0.0f; }
      else {
        double lz = 0.5 * log(r2);
        double nu = n + 1.0 - log2(lz / log(bail) * 2.0);
        J->nu[k] = (float)nu;
        double ds = sqrt(sr * sr + si * si);
        double d = sqrt(r2) * lz / (ds > 1e-300 ? ds : 1e-300);  // distance estimate in pixels
        J->de[k] = (float)(d > 1e30 ? 1e30 : d);
      }
    }
  }
  return NULL;
}

int render(const double *zr, const double *zi, int len, int periodic, int w, int h,
           double offr, double offi, double pix, int maxit, float *nu, float *de, int nthreads) {
  Job J = {zr, zi, len, periodic, w, h, offr, offi, pix, maxit, nu, de};
  atomic_init(&J.next_row, 0);
  pthread_t th[128];
  if (nthreads > 128) nthreads = 128;
  for (int i = 0; i < nthreads; i++) pthread_create(&th[i], NULL, worker, &J);
  for (int i = 0; i < nthreads; i++) pthread_join(th[i], NULL);
  return 0;
}

// Ball-method period detection around c = ref + (offr, offi), radius r, via perturbation.
int ball_period(const double *ZR, const double *ZI, int len, int periodic, double offr, double offi, double r, int maxit) {
  double dr = 0, di = 0, rz = 0;
  int m = 0;
  for (int n = 1; n <= maxit; n++) {
    double zr = ZR[m] + dr, zi = ZI[m] + di;
    double az = sqrt(zr * zr + zi * zi);
    rz = rz * (2 * az + rz) + r;
    double Zr = ZR[m], Zi = ZI[m];
    double ndr = 2 * (Zr * dr - Zi * di) + (dr * dr - di * di) + offr;
    double ndi = 2 * (Zr * di + Zi * dr) + 2 * dr * di + offi;
    dr = ndr; di = ndi;
    m++;
    if (periodic && m >= len - 1) m = 0;
    zr = ZR[m] + dr; zi = ZI[m] + di;
    double r2 = zr * zr + zi * zi;
    if (r2 > 1e8) return -n;
    if (sqrt(r2) <= rz) return n;
    if (r2 < dr * dr + di * di || (!periodic && m >= len - 1)) { dr = zr; di = zi; m = 0; }
  }
  return 0;
}

// Newton's method for a nucleus of period p near ref + (offr, offi), perturbed (double precision).
// Returns the number of steps; result in out[0..1] (offset from the reference).
int newton_pert(const double *ZR, const double *ZI, int len, int periodic, double offr, double offi, int p, int steps, double *out) {
  int it;
  for (it = 0; it < steps; it++) {
    double dr = 0, di = 0, sr = 0, si = 0;
    int m = 0;
    double zr = 0, zi = 0;
    for (int n = 0; n < p; n++) {
      double nsr = 2 * (zr * sr - zi * si) + 1;
      double nsi = 2 * (zr * si + zi * sr);
      sr = nsr; si = nsi;
      double Zr = ZR[m], Zi = ZI[m];
      double ndr = 2 * (Zr * dr - Zi * di) + (dr * dr - di * di) + offr;
      double ndi = 2 * (Zr * di + Zi * dr) + 2 * dr * di + offi;
      dr = ndr; di = ndi;
      m++;
      if (periodic && m >= len - 1) m = 0;
      zr = ZR[m] + dr; zi = ZI[m] + di;
      if (zr * zr + zi * zi < dr * dr + di * di || (!periodic && m >= len - 1)) { dr = zr; di = zi; m = 0; }
    }
    double den = sr * sr + si * si;
    if (den == 0) break;
    double qr = (zr * sr + zi * si) / den, qi = (zi * sr - zr * si) / den;
    offr -= qr; offi -= qi;
    double st = fabs(qr) + fabs(qi), sc = fabs(offr) + fabs(offi);
    if (!(st == st) || sc > 4) { it = -1; break; }
    if (st <= sc * 1e-15) break;
  }
  out[0] = offr; out[1] = offi;
  return it;
}
