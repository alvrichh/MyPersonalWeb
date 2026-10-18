/*
 * Bug Hunter's sound, all made with the Web Audio API: no files to download.
 *
 * The music is drum and bass at 174 BPM, played "back to back": two DJs take
 * turns every eight bars. DJ A is liquid (soft pads, a rolling two-step, a
 * clean sub) and DJ B is neuro (a growling reese bass with a wobbling filter,
 * busier drums). Boss rooms push the filter open and add a stab.
 *
 * Nothing plays until the page gets a user gesture (browsers require it), so
 * `unlock()` is called from the first menu click.
 */

export type Sfx =
  | 'shoot' | 'knife' | 'boomerang' | 'hit' | 'kill' | 'gem' | 'hurt' | 'levelup' | 'pick'
  | 'door' | 'boss' | 'slam' | 'slash' | 'strike' | 'boom' | 'revive' | 'win' | 'over' | 'coin' | 'click';

const BPM = 174;
const STEP = 60 / BPM / 4; // a sixteenth
const BAR = STEP * 16;

// F minor, PS2-era melancholy: Fm – Db – Ab – Eb, one chord per two bars.
const ROOT = 43.65; // F1
const CHORDS: number[][] = [
  [0, 3, 7, 10],   // Fm7
  [-4, 0, 3, 7],   // Dbmaj7 (as -4 = Db)
  [3, 7, 10, 14],  // Ab
  [-2, 2, 5, 10],  // Eb
];
const BASS_ROOTS = [0, -4, 3, -2];

const semi = (base: number, n: number) => base * Math.pow(2, n / 12);

class Engine {
  ctx!: AudioContext;
  master!: GainNode;
  musicBus!: GainNode;
  sfxBus!: GainNode;
  filter!: BiquadFilterNode;
  ready = false;
  playing = false;
  intensity = 0;
  private next = 0;
  private step = 0;
  private timer: number | undefined;
  private noise!: AudioBuffer;
  private volumes = { music: 0.6, sfx: 0.8 };

  unlock() {
    if (this.ready) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain();
    this.sfxBus = this.ctx.createGain();
    // The whole music bus runs through one low-pass filter that opens up as
    // the fight heats up.
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 2200;
    this.filter.Q.value = 0.7;
    this.musicBus.connect(this.filter).connect(this.master);
    this.sfxBus.connect(this.master);
    // Two seconds of white noise for drums and hits.
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.ready = true;
    this.setVolumes(this.volumes.music, this.volumes.sfx);
  }

  setVolumes(music: number, sfx: number) {
    this.volumes = { music, sfx };
    if (!this.ready) return;
    this.musicBus.gain.setTargetAtTime(music * 0.5, this.ctx.currentTime, 0.05);
    this.sfxBus.gain.setTargetAtTime(sfx * 0.6, this.ctx.currentTime, 0.05);
  }

  /* ---------------------------------------------------------------- music */

  start() {
    if (!this.ready || this.playing) return;
    this.playing = true;
    this.step = 0;
    this.next = this.ctx.currentTime + 0.1;
    this.tick();
  }

  stop() {
    this.playing = false;
    window.clearTimeout(this.timer);
  }

  /** 0 = menu / calm room, 1 = boss fight. */
  setIntensity(level: number) {
    this.intensity = level;
    if (this.ready) this.filter.frequency.setTargetAtTime(1800 + level * 6000, this.ctx.currentTime, 0.4);
  }

  private tick = () => {
    if (!this.playing) return;
    while (this.next < this.ctx.currentTime + 0.12) {
      this.schedule(this.step, this.next);
      this.next += STEP;
      this.step += 1;
    }
    this.timer = window.setTimeout(this.tick, 25);
  };

  private schedule(step: number, at: number) {
    const bar = Math.floor(step / 16);
    const inBar = step % 16;
    const dj = Math.floor(bar / 8) % 2; // 0 = liquid, 1 = neuro
    const chord = CHORDS[Math.floor(bar / 2) % 4];
    const bassRoot = BASS_ROOTS[Math.floor(bar / 2) % 4];
    const last = bar % 8 === 7; // final bar before the swap: a little fill

    // Two-step drums. Kick on 1 and the "and" of 3, snares on 2 and 4.
    if (inBar === 0 || inBar === 10 || (dj === 1 && inBar === 7)) this.kick(at);
    if (inBar === 4 || inBar === 12) this.snare(at, 1);
    if (dj === 1 && (inBar === 7 || inBar === 15)) this.snare(at, 0.35);
    if (last && inBar >= 12) this.snare(at, 0.5 + (inBar - 12) * 0.15);
    if (inBar % 2 === 0) this.hat(at, inBar % 4 === 2 ? 0.5 : 0.3, inBar % 8 === 6);
    if (dj === 1 && inBar % 2 === 1) this.hat(at, 0.14, false);

    // Bass: liquid holds the root; neuro growls a syncopated line.
    if (dj === 0) {
      if (inBar === 0 || inBar === 10) this.sub(at, semi(ROOT, bassRoot), inBar === 0 ? STEP * 8 : STEP * 5);
    } else {
      const hits = [0, 3, 6, 10, 11, 14];
      if (hits.includes(inBar)) this.reese(at, semi(ROOT, bassRoot + (inBar === 14 ? 12 : inBar === 6 ? 3 : 0)), STEP * (inBar === 10 ? 1 : 2.5));
    }

    // Pads on every chord change (liquid), stabs on the offbeat (neuro / boss).
    if (inBar === 0 && bar % 2 === 0 && dj === 0) this.pad(at, chord, BAR * 2);
    if ((dj === 1 || this.intensity > 0.6) && (inBar === 6 || inBar === 14) && bar % 2 === 1) this.stab(at, chord);
    // A sparkle of arpeggio on top in the quieter half.
    if (dj === 0 && inBar % 4 === 2 && Math.random() < 0.6) this.pluck(at, semi(ROOT * 8, chord[(step >> 2) % chord.length]));
  }

  private env(gain: GainNode, at: number, peak: number, attack: number, decay: number, sustain = 0, release = 0.01) {
    const g = gain.gain;
    g.cancelScheduledValues(at);
    g.setValueAtTime(0.0001, at);
    g.linearRampToValueAtTime(peak, at + attack);
    g.exponentialRampToValueAtTime(Math.max(0.0001, peak * sustain), at + attack + decay);
    if (release) g.exponentialRampToValueAtTime(0.0001, at + attack + decay + release);
  }

  private kick(at: number) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(150, at);
    o.frequency.exponentialRampToValueAtTime(42, at + 0.11);
    this.env(g, at, 1, 0.002, 0.22);
    o.connect(g).connect(this.musicBus);
    o.start(at);
    o.stop(at + 0.3);
  }

  private snare(at: number, vol: number) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.8;
    const g = this.ctx.createGain();
    this.env(g, at, 0.7 * vol, 0.001, 0.14);
    n.connect(bp).connect(g).connect(this.musicBus);
    n.start(at, Math.random() * 1.5);
    n.stop(at + 0.2);
    const o = this.ctx.createOscillator();
    const og = this.ctx.createGain();
    o.frequency.setValueAtTime(220, at);
    o.frequency.exponentialRampToValueAtTime(160, at + 0.05);
    this.env(og, at, 0.4 * vol, 0.001, 0.07);
    o.connect(og).connect(this.musicBus);
    o.start(at);
    o.stop(at + 0.1);
  }

  private hat(at: number, vol: number, open: boolean) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 8000;
    const g = this.ctx.createGain();
    this.env(g, at, 0.35 * vol, 0.001, open ? 0.12 : 0.03);
    n.connect(hp).connect(g).connect(this.musicBus);
    n.start(at, Math.random() * 1.5);
    n.stop(at + 0.2);
  }

  private sub(at: number, freq: number, length: number) {
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    this.env(g, at, 0.8, 0.02, length * 0.3, 0.7, length * 0.6);
    o.connect(g).connect(this.musicBus);
    o.start(at);
    o.stop(at + length + 0.1);
  }

  private reese(at: number, freq: number, length: number) {
    // Two detuned saws through a wobbling low-pass: the growl.
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 6;
    lp.frequency.setValueAtTime(220, at);
    lp.frequency.linearRampToValueAtTime(1400 + this.intensity * 1200, at + length * 0.5);
    lp.frequency.linearRampToValueAtTime(260, at + length);
    this.env(g, at, 0.55, 0.01, length * 0.4, 0.6, length * 0.4);
    for (const detune of [-12, 12]) {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = detune;
      o.connect(lp);
      o.start(at);
      o.stop(at + length + 0.1);
    }
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = freq / 2;
    sub.connect(g);
    sub.start(at);
    sub.stop(at + length + 0.1);
    lp.connect(g).connect(this.musicBus);
  }

  private pad(at: number, chord: number[], length: number) {
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    this.env(g, at, 0.16, 0.6, length * 0.4, 0.7, length * 0.5);
    for (const n of chord) {
      for (const detune of [-7, 7]) {
        const o = this.ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = semi(ROOT * 4, n);
        o.detune.value = detune;
        o.connect(lp);
        o.start(at);
        o.stop(at + length + 0.5);
      }
    }
    lp.connect(g).connect(this.musicBus);
  }

  private stab(at: number, chord: number[]) {
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3000, at);
    lp.frequency.exponentialRampToValueAtTime(500, at + 0.18);
    this.env(g, at, 0.22, 0.005, 0.16);
    for (const n of chord) {
      const o = this.ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = semi(ROOT * 4, n);
      o.connect(lp);
      o.start(at);
      o.stop(at + 0.25);
    }
    lp.connect(g).connect(this.musicBus);
  }

  private pluck(at: number, freq: number) {
    const o = this.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    this.env(g, at, 0.12, 0.003, 0.25);
    o.connect(g).connect(this.musicBus);
    o.start(at);
    o.stop(at + 0.3);
  }

  /* ------------------------------------------------------------------ sfx */

  play(name: Sfx) {
    if (!this.ready || this.volumes.sfx === 0) return;
    const at = this.ctx.currentTime;
    switch (name) {
      case 'shoot': return this.blip(at, 900, 500, 0.05, 0.25, 'square');
      case 'knife': return this.blip(at, 1400, 700, 0.04, 0.18, 'triangle');
      case 'boomerang': return this.blip(at, 500, 900, 0.12, 0.2, 'triangle');
      case 'hit': return this.hiss(at, 0.03, 0.25, 3000);
      case 'kill': return this.blip(at, 600, 120, 0.16, 0.35, 'sawtooth');
      case 'gem': return this.blip(at, 1500, 2200, 0.07, 0.18, 'sine');
      case 'coin': return this.chime(at, [1760, 2349], 0.08, 0.2);
      case 'hurt': return this.thud(at, 0.5);
      case 'levelup': return this.chime(at, [523, 659, 784, 1047], 0.09, 0.4);
      case 'pick': return this.chime(at, [784, 1047], 0.07, 0.3);
      case 'door': return this.chime(at, [659, 988, 1319], 0.12, 0.35);
      case 'boss': return this.roar(at);
      case 'slam': return this.thud(at, 0.9);
      case 'slash': return this.hiss(at, 0.08, 0.3, 1600);
      case 'strike': return this.hiss(at, 0.12, 0.5, 6000);
      case 'boom': return this.thud(at, 0.7, true);
      case 'revive': return this.chime(at, [392, 523, 659, 784, 1047, 1319], 0.1, 0.6);
      case 'win': return this.chime(at, [523, 659, 784, 1047, 1319, 1568], 0.14, 0.7);
      case 'over': return this.chime(at, [440, 415, 392, 349], 0.22, 0.5);
      case 'click': return this.blip(at, 1200, 1200, 0.02, 0.15, 'sine');
    }
  }

  private blip(at: number, from: number, to: number, length: number, vol: number, type: OscillatorType) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, at);
    o.frequency.exponentialRampToValueAtTime(to, at + length);
    const g = this.ctx.createGain();
    this.env(g, at, vol, 0.003, length);
    o.connect(g).connect(this.sfxBus);
    o.start(at);
    o.stop(at + length + 0.05);
  }

  private hiss(at: number, length: number, vol: number, freq: number) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    this.env(g, at, vol, 0.002, length);
    n.connect(f).connect(g).connect(this.sfxBus);
    n.start(at, Math.random());
    n.stop(at + length + 0.05);
  }

  private thud(at: number, vol: number, fire = false) {
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(fire ? 220 : 120, at);
    o.frequency.exponentialRampToValueAtTime(30, at + 0.25);
    const g = this.ctx.createGain();
    this.env(g, at, vol, 0.002, 0.3);
    o.connect(g).connect(this.sfxBus);
    o.start(at);
    o.stop(at + 0.4);
    this.hiss(at, fire ? 0.3 : 0.1, vol * 0.5, fire ? 900 : 400);
  }

  private chime(at: number, notes: number[], gap: number, vol: number) {
    notes.forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const g = this.ctx.createGain();
      this.env(g, at + i * gap, vol * 0.5, 0.005, 0.25);
      o.connect(g).connect(this.sfxBus);
      o.start(at + i * gap);
      o.stop(at + i * gap + 0.35);
    });
  }

  private roar(at: number) {
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(60, at);
    o.frequency.linearRampToValueAtTime(38, at + 0.8);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(300, at);
    lp.frequency.linearRampToValueAtTime(1200, at + 0.4);
    lp.frequency.linearRampToValueAtTime(200, at + 0.9);
    const g = this.ctx.createGain();
    this.env(g, at, 0.6, 0.05, 0.6, 0.5, 0.3);
    o.connect(lp).connect(g).connect(this.sfxBus);
    o.start(at);
    o.stop(at + 1.1);
  }
}

export const audio = new Engine();
