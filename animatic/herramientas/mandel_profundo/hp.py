"""High-precision Mandelbrot tools using Python big-int fixed point.

Values are complex numbers stored as (re, im) integer pairs scaled by 2**B.
"""
import math
from decimal import Decimal, getcontext

B = 480  # fixed-point fraction bits (~144 decimal digits)
ONE = 1 << B


def set_bits(b):
    global B, ONE
    B = b
    ONE = 1 << b


def fx(x):
    """float or decimal string -> fixed point int."""
    if isinstance(x, str):
        getcontext().prec = 200
        return int((Decimal(x) * (Decimal(2) ** B)).to_integral_value())
    m, e = math.frexp(x)
    return int(m * (1 << 53)) << (B - 53 + e) if B - 53 + e >= 0 else int(m * (1 << 53)) >> -(B - 53 + e)


def tof(a):
    return math.ldexp(a, -B) if abs(a) < (1 << 1000) else float(a) / ONE


def todec(a, digits=100):
    getcontext().prec = digits + 20
    return str((Decimal(a) / (Decimal(2) ** B)).quantize(Decimal(1).scaleb(-digits)))


def orbit(cr, ci, n, bail=1e6):
    """Orbit of 0 under z^2+c (fixed point c); returns list of (float re, float im)."""
    zr = zi = 0
    out = [(0.0, 0.0)]
    for _ in range(n):
        zr, zi = ((zr * zr - zi * zi) >> B) + cr, ((zr * zi) >> (B - 1)) + ci
        fr, fi = tof(zr), tof(zi)
        out.append((fr, fi))
        if fr * fr + fi * fi > bail:
            break
    return out


def ball_period(cr, ci, r, maxit):
    """Lowest period of a nucleus (probably) inside the ball |c - c0| < r."""
    zr = zi = 0
    rz = 0.0
    for n in range(1, maxit + 1):
        fr, fi = tof(zr), tof(zi)
        az = math.hypot(fr, fi)
        rz = rz * (2 * az + rz) + r
        zr, zi = ((zr * zr - zi * zi) >> B) + cr, ((zr * zi) >> (B - 1)) + ci
        fr, fi = tof(zr), tof(zi)
        if fr * fr + fi * fi > 1e8:
            return None
        if math.hypot(fr, fi) <= rz:
            return n
    return None


def nucleus(cr, ci, p, steps=80, verbose=False):
    """Newton's method for z_p(c) = 0."""
    last = None
    for it in range(steps):
        zr = zi = 0
        dr = di = 0
        for _ in range(p):
            dr, di = ((zr * dr - zi * di) >> (B - 1)) + ONE, ((zr * di + zi * dr) >> (B - 1))
            zr, zi = ((zr * zr - zi * zi) >> B) + cr, ((zr * zi) >> (B - 1)) + ci
        den = dr * dr + di * di
        if den == 0:
            return None
        nr = zr * dr + zi * di
        ni = zi * dr - zr * di
        sr = (nr << B) // den
        si = (ni << B) // den
        cr -= sr
        ci -= si
        if abs(cr) > 4 * ONE or abs(ci) > 4 * ONE:
            return None
        st = abs(sr) + abs(si)
        if verbose:
            print(it, st.bit_length() - B)
        if st < (1 << 8):
            return cr, ci
        if last is not None and it > 40 and st >= last:
            return cr, ci
        last = st
    return cr, ci


def size(cr, ci, p):
    """Complex size estimate of the minibrot (Heiland-Allen): returns (abs, arg)."""
    zr = zi = 0
    l = complex(1, 0)
    b = complex(1, 0)
    for _ in range(1, p):
        zr, zi = ((zr * zr - zi * zi) >> B) + cr, ((zr * zi) >> (B - 1)) + ci
        z = complex(tof(zr), tof(zi))
        l = 2 * z * l
        b = b + 1 / l
    s = 1 / (b * l * l)
    return abs(s), math.atan2(s.imag, s.real), s


def true_period_check(cr, ci, p):
    zr = zi = 0
    for n in range(1, p + 1):
        zr, zi = ((zr * zr - zi * zi) >> B) + cr, ((zr * zi) >> (B - 1)) + ci
    return math.hypot(tof(zr), tof(zi))


def min_period(cr, ci, p, tol=1e-20):
    """Smallest q | p such that z_q(c) ~ 0 (Newton may land on a lower-period nucleus)."""
    zr = zi = 0
    for q in range(1, p + 1):
        zr, zi = ((zr * zr - zi * zi) >> B) + cr, ((zr * zi) >> (B - 1)) + ci
        if abs(zr) > (4 << B) or abs(zi) > (4 << B):
            return None
        if p % q == 0 and math.hypot(tof(zr), tof(zi)) < tol:
            return q
    return p


def periodic_orbit(cr, ci, p):
    """Z_0..Z_p (Z_p ~ 0) as a numpy complex array."""
    import numpy as np
    o = orbit(cr, ci, p, bail=1e300)
    return np.array([complex(a, b) for a, b in o])
