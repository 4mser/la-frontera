"""Gives a line of the synthetic voice a pitch contour of its own (TD-PSOLA: the voice's periods are cut out one by
one and laid again closer together or further apart, so the pitch moves and the timbre stays).

usage: python3 audio/entona.py in.mp3 out.wav "t0:f0,t1:f1,…"   (times in s, pitch factors; linear between them)
"""
import subprocess, sys, wave
import numpy as np

SR = 24000


def leer(ruta):
    b = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", ruta, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(b, np.int16).astype(np.float64) / 32767


def f0_pista(x, hop):
    """pitch every hop samples by autocorrelation (NaN where unvoiced)"""
    win = int(0.04 * SR); lo, hi = int(SR / 320), int(SR / 65)
    out = []
    for i in range(0, len(x), hop):
        w = x[max(0, i - win // 2): i + win // 2]
        if len(w) < win or np.sqrt((w ** 2).mean()) < 0.015: out.append(np.nan); continue
        w = (w - w.mean()) * np.hanning(len(w))
        ac = np.correlate(w, w, "full")[len(w) - 1:]
        k = lo + int(np.argmax(ac[lo:hi]))
        out.append(SR / k if ac[k] > 0.35 * ac[0] else np.nan)
    return np.array(out)


def marcas(x, f0, hop):
    """analysis marks: one per period in voiced stretches (on the local peak), every 5 ms elsewhere"""
    m, i = [], 0
    while i < len(x):
        f = f0[min(len(f0) - 1, i // hop)]
        if np.isnan(f): m.append((i, int(0.005 * SR), False)); i += int(0.005 * SR); continue
        T = int(SR / f)
        j = i + int(np.argmax(np.abs(x[i:i + T]))) if i + T < len(x) else i
        m.append((j, T, True)); i = j + T
    return m


def psola(x, contorno):
    hop = int(0.005 * SR)
    f0 = f0_pista(x, hop)
    A = marcas(x, f0, hop)
    ts = np.array([a for a, _, _ in A], float)
    y = np.zeros(len(x) + SR); norm = np.zeros_like(y)
    t = A[0][0]
    while t < len(x):
        k = int(np.argmin(np.abs(ts - t))); a, T, voz = A[k]
        beta = float(np.interp(t / SR, contorno[:, 0], contorno[:, 1])) if voz else 1.0
        L = 2 * T
        lo, hi = max(0, a - T), min(len(x), a + T)
        seg = x[lo:hi] * np.hanning(L)[(lo - (a - T)):(lo - (a - T)) + (hi - lo)]
        p = int(t) - (a - lo)
        if p >= 0:
            y[p:p + len(seg)] += seg; norm[p:p + len(seg)] += np.hanning(L)[(lo - (a - T)):(lo - (a - T)) + (hi - lo)]
        t += T / beta
    norm[norm < 0.1] = 1.0
    return (y / norm)[:len(x)]


if __name__ == "__main__":
    x = leer(sys.argv[1])
    c = np.array([[float(v) for v in p.split(":")] for p in sys.argv[3].split(",")])
    y = psola(x, c)
    y = y / max(1e-9, np.abs(y).max()) * np.abs(x).max()
    with wave.open(sys.argv[2], "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
