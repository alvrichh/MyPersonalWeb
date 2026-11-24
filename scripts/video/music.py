# Driving, professional tech bed: 124 BPM, A minor, rolling 16th bass, sidechained pads,
# drums from bar 2, a riser into a fuller section with a plucked arpeggio from bar 8.
import numpy as np, wave, sys
SR = 44100; DUR = float(sys.argv[1]); BPM = 124; beat = 60 / BPM; bar = 4 * beat; s16 = beat / 4
N = int(SR * (DUR + 2)); rng = np.random.default_rng(11)
mus = np.zeros((N, 2)); drm = np.zeros((N, 2))
midi = lambda n: 440 * 2 ** ((n - 69) / 12)
def add(bus, sig, t, pan=0.0, gain=1.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if i >= N or j <= i: return
    s = sig[:j - i] * gain
    bus[i:j, 0] += s * np.sqrt((1 - pan) / 2) * 1.414; bus[i:j, 1] += s * np.sqrt((1 + pan) / 2) * 1.414
def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); acc = 0.0
    for k in range(len(x)): acc = (1 - a) * x[k] + a * acc; y[k] = acc
    return y
def saw(f, n, det=0.0, voices=3):
    t = np.arange(n) / SR; out = np.zeros(n)
    for v in range(voices):
        d = (v - (voices - 1) / 2) * det; out += 2 * ((t * f * (1 + d) + rng.random()) % 1) - 1
    return out / voices
def adsr(n, a, d, s, length, r):
    t = np.arange(n) / SR; e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / d))
    return np.where(t > length, e * np.exp(-(t - length) / r), e)
def kick():
    n = int(0.4 * SR); t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(45 + 120 * np.exp(-t * 35)) / SR
    return np.sin(ph) * np.exp(-t * 7) + rng.standard_normal(n) * np.exp(-t * 400) * 0.15
def noise_hit(n_s, hp, decay, g):
    n = int(n_s * SR); t = np.arange(n) / SR; z = rng.standard_normal(n)
    return (z - lowpass(z, hp)) * np.exp(-t * decay) * g
def clap():
    n = int(0.3 * SR); t = np.arange(n) / SR; z = rng.standard_normal(n); bp = lowpass(z - lowpass(z, 1000), 4000)
    e = np.exp(-t * 16) * 0.8 + sum(np.exp(-np.clip(t - o, 0, None) * 250) * (t >= o) for o in (0, 0.009, 0.018)) * 0.5
    return bp * e * 0.22
K, CL = kick(), clap()
HAT, OHAT, SHK = noise_hit(0.06, 8000, 80, 0.10), noise_hit(0.22, 7000, 16, 0.07), noise_hit(0.08, 5000, 45, 0.05)
chords = [[57, 60, 64, 67, 71], [53, 57, 60, 64, 67], [55, 60, 62, 64, 67], [55, 59, 62, 64, 69]]  # Am9 Fmaj7 Cadd9 G6sus
roots = [33, 29, 36, 31]
cache = {}
def pad(ch, length):
    key = ('pad', tuple(ch))
    if key not in cache:
        n = int((length + 0.6) * SR); sig = sum(saw(midi(x), n, 0.008, 3) for x in ch) / len(ch)
        cache[key] = lowpass(sig, 1400) * adsr(n, 0.25, 1.0, 0.85, length, 0.3)
    return cache[key]
def pulse(note, length, bright):
    key = ('bass', note, bright)
    if key not in cache:
        n = int((length + 0.05) * SR); t = np.arange(n) / SR
        sig = lowpass(saw(midi(note), n, 0.004, 2), 300 + 900 * bright) + 0.5 * np.sin(2 * np.pi * midi(note) * t)
        cache[key] = sig * adsr(n, 0.003, 0.05, 0.4, length, 0.02)
    return cache[key]
def pluck(note):
    key = ('pl', note)
    if key not in cache:
        n = int(0.35 * SR); t = np.arange(n) / SR
        cache[key] = lowpass(saw(midi(note), n, 0.003, 2), 2200) * np.exp(-t * 14) + 0.4 * np.sin(2 * np.pi * midi(note) * t) * np.exp(-t * 10)
    return cache[key]
kicks = []; arp = [0, 2, 4, 2, 1, 3, 4, 3]
for bnum in range(int(np.ceil(DUR / bar)) + 1):
    t0 = bnum * bar; ci = bnum % 4; sec = 0 if bnum < 2 else (1 if bnum < 8 else 2)
    add(mus, pad(chords[ci], bar), t0, gain=0.22 if sec < 2 else 0.17)
    for k16 in range(16):
        t = t0 + k16 * s16
        add(mus, pulse(roots[ci] + (12 if k16 % 4 == 3 else 0), s16 * 0.7, (0.0, 0.5, 1.0)[sec]), t, gain=0.32)
        if sec >= 1:
            if k16 % 4 == 0: add(drm, K, t, gain=0.95); kicks.append(t)
            if k16 % 4 == 2: add(drm, HAT, t, pan=0.25)
            if k16 in (4, 12): add(drm, CL, t, pan=-0.05)
        add(drm, SHK, t, pan=-0.35, gain=(0.5 if k16 % 2 else 1.0) * (0.6 if sec == 0 else 1.0))
        if sec == 2:
            if k16 % 4 == 2: add(drm, OHAT, t, pan=0.35)
            if k16 % 2 == 0: add(mus, pluck(chords[ci][arp[(k16 // 2) % 8]] + 12), t, pan=(0.45 if (k16 // 2) % 2 else -0.45), gain=0.10)
    if bnum == 7:
        n = int(bar * SR); tt = np.arange(n) / SR; z = rng.standard_normal(n)
        add(drm, (z - lowpass(z, 2500)) * (tt / bar) ** 2.5 * 0.10, t0)
    if bnum == 8:
        n = int(1.6 * SR); tt = np.arange(n) / SR; z = rng.standard_normal(n)
        add(drm, lowpass(z, 3000) * np.exp(-tt * 3) * 0.10 + np.sin(2 * np.pi * 40 * tt) * np.exp(-tt * 4) * 0.5, t0)
t = np.arange(N) / SR; duck = np.ones(N)
for tk in kicks:
    i = int(tk * SR); j = min(N, i + int(0.35 * SR)); duck[i:j] = np.minimum(duck[i:j], 1 - 0.55 * np.exp(-(t[i:j] - tk) / 0.09))
mus *= duck[:, None]
d = int(beat * 0.75 * SR); tmp = mus.copy(); mus[d:, 0] += tmp[:-d, 1] * 0.18; mus[d:, 1] += tmp[:-d, 0] * 0.18
mix = np.tanh((mus + drm)[:int(DUR * SR)] * 1.3); mix /= np.abs(mix).max() / 0.9
with wave.open(sys.argv[2] if len(sys.argv) > 2 else 'music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('music ok', round(len(mix) / SR, 1), 's; full section at', round(8 * bar, 1), 's')
