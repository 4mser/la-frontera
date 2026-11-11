// Perturbation + BLA (bilinear approximation) renderer for a periodic reference orbit (a nucleus of period P).
// Zhuoran rebasing; BLA table nodes are aligned binary-tree nodes over [0, P).
// Build: cc -O3 -mcpu=native -shared -fPIC -o libbla.dylib bla.c -lpthread
#include <math.h>
#include <pthread.h>
#include <stdatomic.h>
#include <stdlib.h>
#include <string.h>

typedef struct { double ar, ai, br, bi, r2; } Node;

typedef struct {
  const double *ZR, *ZI;
  int P;            // period: Z[P] == Z[0] == 0
  int L;            // number of levels (level l has P >> l nodes)
  Node **lev;
  int w, h;
  double offr, offi, pix;
  long maxit;
  double absr, absi; int cardioid;   // absolute c of the reference (double) for the cardioid/bulb test
  float *nu, *de;
  const int *lista; long nlista;   // optional pixel list
  atomic_long next;
} Job;

static Node **build(const double *ZR, const double *ZI, int P, double dcmax, double eps, int *Lout) {
  int L = 1;
  while ((1 << L) <= P) L++;
  Node **lev = calloc(L, sizeof(Node *));
  lev[0] = malloc(sizeof(Node) * P);
  for (int m = 0; m < P; m++) {
    double az = sqrt(ZR[m] * ZR[m] + ZI[m] * ZI[m]);
    double r = eps * az;
    lev[0][m] = (Node){2 * ZR[m], 2 * ZI[m], 1, 0, r * r};
  }
  for (int l = 1; l < L; l++) {
    int n = P >> l;
    lev[l] = malloc(sizeof(Node) * (n > 0 ? n : 1));
    for (int j = 0; j < n; j++) {
      Node x = lev[l - 1][2 * j], y = lev[l - 1][2 * j + 1];
      Node z;
      // apply x first, then y: dz -> Ay (Ax dz + Bx dc) + By dc
      z.ar = y.ar * x.ar - y.ai * x.ai; z.ai = y.ar * x.ai + y.ai * x.ar;
      z.br = y.ar * x.br - y.ai * x.bi + y.br; z.bi = y.ar * x.bi + y.ai * x.br + y.bi;
      double rx = sqrt(x.r2), ry = sqrt(y.r2);
      double ax = sqrt(x.ar * x.ar + x.ai * x.ai), bx = sqrt(x.br * x.br + x.bi * x.bi);
      double r = ax > 0 ? (ry - bx * dcmax) / ax : 0;
      if (r < 0) r = 0;
      if (rx < r) r = rx;
      z.r2 = r * r;
      lev[l][j] = z;
    }
  }
  *Lout = L;
  return lev;
}

static void pixel(Job *J, long k) {
  const double *ZR = J->ZR, *ZI = J->ZI;
  const int P = J->P, L = J->L;
  const long maxit = J->maxit;
  const double bail = 1e10, pix = J->pix;
  int x = k % J->w, y = k / J->w;
  double cr = J->offr + (x - 0.5 * J->w + 0.5) * pix;
  double ci = J->offi - (y - 0.5 * J->h + 0.5) * pix;
  double dr = 0, di = 0, sr = 0, si = 0, zr = 0, zi = 0, r2 = 0;
  int m = 0;
  long n = 0;
  if (J->cardioid) {
    double xr = J->absr + cr, xi = J->absi + ci;
    double q = (xr - 0.25) * (xr - 0.25) + xi * xi;
    if (q * (q + (xr - 0.25)) <= 0.25 * xi * xi || (xr + 1) * (xr + 1) + xi * xi <= 0.0625) {
      J->nu[k] = -1.0f; J->de[k] = 0.0f; return;
    }
  }
  while (n < maxit) {
    // BLA jump if possible
    if (m > 0) {
      int l = __builtin_ctz(m);
      if (l > L - 1) l = L - 1;
      double d2 = dr * dr + di * di;
      int done = 0;
      for (; l >= 1; l--) {
        int st = 1 << l;
        if (m + st > P || n + st > maxit) continue;
        Node *b = &J->lev[l][m >> l];
        if (d2 < b->r2) {
          double ndr = b->ar * dr - b->ai * di + b->br * cr - b->bi * ci;
          double ndi = b->ar * di + b->ai * dr + b->br * ci + b->bi * cr;
          double nsr = b->ar * sr - b->ai * si + b->br * pix;
          double nsi = b->ar * si + b->ai * sr + b->bi * pix;
          dr = ndr; di = ndi; sr = nsr; si = nsi;
          m += st; n += st;
          if (m >= P) m = 0;
          done = 1;
          break;
        }
      }
      if (done) {
        zr = ZR[m] + dr; zi = ZI[m] + di;
        r2 = zr * zr + zi * zi;
        if (r2 > bail) break;
        if (r2 < dr * dr + di * di) { dr = zr; di = zi; m = 0; }
        continue;
      }
    }
    // exact perturbation step
    double nsr = 2 * (zr * sr - zi * si) + pix;
    double nsi = 2 * (zr * si + zi * sr);
    sr = nsr; si = nsi;
    double Zr = ZR[m], Zi = ZI[m];
    double ndr = 2 * (Zr * dr - Zi * di) + (dr * dr - di * di) + cr;
    double ndi = 2 * (Zr * di + Zi * dr) + 2 * dr * di + ci;
    dr = ndr; di = ndi;
    m++; n++;
    if (m >= P) m = 0;
    zr = ZR[m] + dr; zi = ZI[m] + di;
    r2 = zr * zr + zi * zi;
    if (r2 > bail) break;
    if (r2 < dr * dr + di * di) { dr = zr; di = zi; m = 0; }
  }
  if (n >= maxit) { J->nu[k] = -1.0f; J->de[k] = 0.0f; return; }
  double lz = 0.5 * log(r2);
  J->nu[k] = (float)(n + 1.0 - log2(lz / log(bail) * 2.0));
  double ds = sqrt(sr * sr + si * si);
  double d = sqrt(r2) * lz / (ds > 1e-300 ? ds : 1e-300);
  J->de[k] = (float)(d > 1e30 ? 1e30 : d);
}

static void *worker(void *arg) {
  Job *J = (Job *)arg;
  const long CH = 64;
  long total = J->lista ? J->nlista : (long)J->w * J->h;
  for (;;) {
    long a = atomic_fetch_add(&J->next, CH);
    if (a >= total) break;
    long b = a + CH < total ? a + CH : total;
    for (long i = a; i < b; i++) pixel(J, J->lista ? J->lista[i] : i);
  }
  return NULL;
}

// nu/de are full-size (h*w) arrays; if lista != NULL only those pixel indices are computed.
int render_bla(const double *ZR, const double *ZI, int P, int w, int h, double offr, double offi, double pix,
               long maxit, float *nu, float *de, int nthreads, double eps, const int *lista, long nlista,
               double absr, double absi, int cardioid) {
  double hx = 0.5 * w * pix, hy = 0.5 * h * pix;
  double dcmax = sqrt((fabs(offr) + hx) * (fabs(offr) + hx) + (fabs(offi) + hy) * (fabs(offi) + hy));
  int L;
  Node **lev = build(ZR, ZI, P, dcmax, eps, &L);
  Job J;
  memset(&J, 0, sizeof J);
  J.ZR = ZR; J.ZI = ZI; J.P = P; J.L = L; J.lev = lev; J.w = w; J.h = h;
  J.offr = offr; J.offi = offi; J.pix = pix; J.maxit = maxit; J.nu = nu; J.de = de;
  J.lista = lista; J.nlista = nlista;
  J.absr = absr; J.absi = absi; J.cardioid = cardioid;
  atomic_init(&J.next, 0);
  pthread_t th[256];
  if (nthreads > 256) nthreads = 256;
  for (int i = 0; i < nthreads; i++) pthread_create(&th[i], NULL, worker, &J);
  for (int i = 0; i < nthreads; i++) pthread_join(th[i], NULL);
  for (int l = 0; l < L; l++) free(lev[l]);
  free(lev);
  return L;
}
