/*
 * Bug Hunter's sound, all made with the Web Audio API: no files to download.
 *
 * The music is drum and bass at 174 BPM, played "back to back": two DJs take
 * turns in eight-bar blocks over a 64-bar set (about a minute and a half).
 * DJ A is liquid (soft pads, a rolling two-step, a clean sub) and DJ B is
 * neuro (a growling reese bass with a wobbling filter, busier drums). Halfway
 * through, the drums drop out for a trance breakdown (supersaw chords, a
 * gated arpeggio, a riser), then both DJs come back in together over a
 * lifted chord progression. Boss rooms push the filter open and add a stab.
 *
 * Nothing plays until the page gets a user gesture (browsers require it), so
 * `unlock()` is called from the first menu click.
 */

export type Sfx =
  | 'shoot' | 'knife' | 'boomerang' | 'hit' | 'kill' | 'gem' | 'hurt' | 'levelup' | 'pick'
  | 'door' | 'boss' | 'slam' | 'slash' | 'strike' | 'boom' | 'revive' | 'win' | 'over' | 'coin' | 'click'
  | 'laser1' | 'laser2' | 'laser3' | 'laserEvo';

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
// The second half lifts: Fm – Bbm – Ab – C, the C a dominant that pulls home.
const CHORDS_B: number[][] = [
  [0, 3, 7, 10],
  [5, 8, 12, 15],  // Bbm
  [3, 7, 10, 14],  // Ab
  [7, 11, 14, 19], // C
];
const BASS_ROOTS_B = [0, 5, 3, 7];

/* The set, in eight-bar blocks: the two DJs take turns, the drums drop out
   for a trance breakdown, then both come back in together. */
type Block = 'liquid' | 'neuro' | 'breakdown' | 'trance' | 'both';
const SET: Block[] = ['liquid', 'neuro', 'liquid', 'neuro', 'breakdown', 'trance', 'both', 'neuro'];

/** The growl's line in boss fights, one note per hit (steps 0, 3, 6, 10, 11, 14), over two bars. */
const BOSS_REESE = [
  [0, 7, 3, 10, 7, 12],
  [0, 3, 5, 3, 0, -5],
];

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
  /** Pads and leads go through here so the kick can duck them (sidechain). */
  private padBus!: GainNode;
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
    this.padBus = this.ctx.createGain();
    this.padBus.connect(this.musicBus);
    this.sfxBus.connect(this.master);
    // Two seconds of white noise for drums and hits.
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.ready = true;
    this.setVolumes(this.volumes.music, this.volumes.sfx);
  }

  /** Silence everything while an ad plays (`ads.ts`), and back. */
  duck(on: boolean) {
    if (!this.ready) return;
    this.master.gain.setTargetAtTime(on ? 0 : 1, this.ctx.currentTime, 0.05);
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
    // Picks up where it stopped (muting and unmuting must not restart the song); only the very first start is at 0.
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
    // Never below half open: the cover and a run's first rooms sound as full as the rest.
    if (this.ready) this.filter.frequency.setTargetAtTime(1800 + Math.max(0.5, level) * 6000, this.ctx.currentTime, 0.4);
  }

  /** A boss is out: the growl plays its boss line (`BOSS_REESE`), from its next hit. */
  boss = false;
  setBoss(on: boolean) {
    this.boss = on;
  }

  /** A final boss is out (wanted), its tension layer playing (it only comes in or out where a four-bar phrase
      begins), the bar it came in on, and whether the boss is in its last stand. */
  private finalWanted = false;
  private final = false;
  private finalFrom = 0;
  private rage = false;
  setFinal(on: boolean, rage: boolean) {
    this.finalWanted = on;
    this.rage = on && rage;
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
    // The final boss's tension layer joins or leaves only where a phrase begins, so it grows out of the music.
    if (inBar === 0 && bar % 4 === 0 && this.final !== this.finalWanted) {
      this.final = this.finalWanted;
      this.finalFrom = bar;
    }
    const setBar = bar % (SET.length * 8);
    const block = SET[Math.floor(setBar / 8)];
    const blockBar = setBar % 8;
    const second = setBar >= 32; // the second half uses the lifted progression
    const chord = (second ? CHORDS_B : CHORDS)[Math.floor(bar / 2) % 4];
    const bassRoot = (second ? BASS_ROOTS_B : BASS_ROOTS)[Math.floor(bar / 2) % 4];
    if (this.final) this.tension(bar, inBar, at, chord);
    const last = blockBar === 7; // final bar of a block: a little fill
    const liquid = block === 'liquid' || block === 'both';
    const neuro = block === 'neuro' || block === 'both';
    const drums = block !== 'breakdown';

    // A crash on the first beat of every block but the very first.
    if (inBar === 0 && blockBar === 0 && setBar !== 0) this.crash(at);

    if (drums) {
      // Two-step drums. Kick on 1 and the "and" of 3, snares on 2 and 4.
      if (inBar === 0 || inBar === 10 || (neuro && inBar === 7)) this.kick(at);
      if (inBar === 4 || inBar === 12) this.snare(at, 1);
      if (neuro && (inBar === 7 || inBar === 15)) this.snare(at, 0.35);
      if (last && inBar >= 12) this.snare(at, 0.5 + (inBar - 12) * 0.15);
      if (last && block === 'neuro' && inBar >= 8 && inBar < 12 && inBar % 2 === 0) this.snare(at, 0.3);
      if (inBar % 2 === 0) this.hat(at, inBar % 4 === 2 ? 0.5 : 0.3, inBar % 8 === 6);
      if (neuro && inBar % 2 === 1) this.hat(at, 0.14, false);
      if (block === 'trance' && inBar % 2 === 1) this.hat(at, 0.22, false); // offbeat trance hats
    } else {
      // Breakdown: a soft hat on the offbeats, and a riser into the drop.
      if (inBar % 4 === 2) this.hat(at, 0.18, false);
      if (blockBar === 6 && inBar === 0) this.riser(at, BAR * 2);
      if (blockBar === 7 && inBar >= 8) this.snare(at, 0.25 + (inBar - 8) * 0.09);
    }

    // Bass: liquid holds the root; neuro growls a syncopated line; trance
    // bounces on the offbeats; the breakdown keeps one long sub.
    if (block === 'trance') {
      if (inBar % 2 === 1) this.sub(at, semi(ROOT * 2, bassRoot), STEP * 0.9);
      if (inBar === 0) this.sub(at, semi(ROOT, bassRoot), STEP * 3);
    } else if (block === 'breakdown') {
      if (inBar === 0 && bar % 2 === 0) this.sub(at, semi(ROOT, bassRoot), BAR * 1.6);
    } else {
      if (liquid && (inBar === 0 || inBar === 10)) this.sub(at, semi(ROOT, bassRoot), inBar === 0 ? STEP * 8 : STEP * 5);
      if (neuro) {
        const hits = [0, 3, 6, 10, 11, 14];
        const hit = hits.indexOf(inBar);
        // In a boss fight the growl keeps its sound and its rhythm (the same six hits, the same B2B set) but
        // plays another line over the chord: a two-bar call and answer that climbs and drops back.
        const note = this.boss ? BOSS_REESE[bar % 2][hit] : inBar === 14 ? 12 : inBar === 6 ? 3 : 0;
        if (hit >= 0) this.reese(at, semi(ROOT, bassRoot + note), STEP * (inBar === 10 ? 1 : 2.5));
        // A final boss in its last stand: the growl doubles some of its hits, the same note a sixteenth later.
        if (this.rage && (inBar === 4 || inBar === 12 || inBar === 15)) {
          const prev = BOSS_REESE[bar % 2][hits.indexOf(inBar === 15 ? 14 : inBar - 1)];
          this.reese(at, semi(ROOT, bassRoot + prev), STEP * 0.9);
        }
      }
    }

    // Pads on every chord change (liquid, breakdown), stabs on the offbeat (neuro / boss).
    if (inBar === 0 && bar % 2 === 0 && (liquid || block === 'breakdown')) this.pad(at, chord, BAR * 2);
    if ((neuro || this.intensity > 0.6) && block !== 'breakdown' && (inBar === 6 || inBar === 14) && bar % 2 === 1) this.stab(at, chord);
    // Trance: supersaw chords on the offbeat eighths and a gated 16th arpeggio;
    // the arpeggio also creeps into the breakdown, growing bar by bar.
    if (block === 'trance' || block === 'both') {
      if (inBar % 4 === 2) this.supersaw(at, chord, STEP * 1.6);
      if (block === 'trance') this.arp(at, semi(ROOT * 8, chord[step % chord.length]), inBar % 4 === 0 ? 0.16 : 0.1);
    }
    if (block === 'breakdown' && blockBar >= 2) this.arp(at, semi(ROOT * 8, chord[step % chord.length]), 0.07 + blockBar * 0.012);
    // A sparkle of plucks on top in the quieter half.
    if (block === 'liquid' && inBar % 4 === 2 && Math.random() < 0.6) this.pluck(at, semi(ROOT * 8, chord[(step >> 2) % chord.length]));
  }

  /* The final boss's tension, added on the music's own grid (nothing underneath changes): a thin high pedal
     ticking every sixteenth, a semitone higher every four bars it plays (back to the start after three),
     like a clock speeding up; and a low tower bell on every chord change. */
  private tension(bar: number, inBar: number, at: number, chord: number[]) {
    const rise = Math.floor((bar - this.finalFrom) / 4) % 4;
    this.tick16(at, semi(ROOT * 16, chord[0] + rise), inBar % 4 === 0 ? 0.05 : 0.028);
    if (inBar === 0 && bar % 2 === 0) this.bell(at, semi(ROOT * 4, chord[0]));
  }

  /** One pedal tick: a thin, short square, high-passed so it sits above everything. */
  private tick16(at: number, freq: number, vol: number) {
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = freq;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1200;
    const g = this.ctx.createGain();
    this.env(g, at, vol, 0.002, 0.05);
    o.connect(hp).connect(g).connect(this.padBus);
    o.start(at);
    o.stop(at + 0.08);
  }

  /** A tower bell: inharmonic sine partials, struck and left to ring. */
  private bell(at: number, freq: number) {
    const g = this.ctx.createGain();
    this.env(g, at, 0.13, 0.004, 2.6);
    g.connect(this.musicBus);
    for (const [ratio, vol] of [[1, 1], [2.76, 0.5], [5.4, 0.25], [8.93, 0.12]]) {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * ratio;
      const og = this.ctx.createGain();
      og.gain.value = vol;
      o.connect(og).connect(g);
      o.start(at);
      o.stop(at + 2.8);
    }
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
    // Duck the pads for a moment: the pumping sidechain.
    const duck = this.padBus.gain;
    duck.cancelScheduledValues(at);
    duck.setValueAtTime(1, at);
    duck.linearRampToValueAtTime(0.35, at + 0.01);
    duck.linearRampToValueAtTime(1, at + 0.22);
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
    lp.connect(g).connect(this.padBus);
  }

  /** Trance chord: five detuned saws per note, bright and wide, gated short. */
  private supersaw(at: number, chord: number[], length: number) {
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(4500, at);
    lp.frequency.exponentialRampToValueAtTime(1600, at + length);
    this.env(g, at, 0.1, 0.01, length * 0.7, 0.4, length * 0.3);
    for (const n of chord) {
      for (const detune of [-18, -9, 0, 9, 18]) {
        const o = this.ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = semi(ROOT * 4, n);
        o.detune.value = detune;
        o.connect(lp);
        o.start(at);
        o.stop(at + length + 0.4);
      }
    }
    lp.connect(g).connect(this.padBus);
  }

  /** One gated arpeggio note: a square with a quick, bright envelope. */
  private arp(at: number, freq: number, vol: number) {
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = freq;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3200, at);
    lp.frequency.exponentialRampToValueAtTime(900, at + 0.12);
    const g = this.ctx.createGain();
    this.env(g, at, vol, 0.003, 0.11);
    o.connect(lp).connect(g).connect(this.padBus);
    o.start(at);
    o.stop(at + 0.16);
  }

  /** White noise sweeping up into the drop. */
  private riser(at: number, length: number) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise;
    n.loop = true;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, at);
    bp.frequency.exponentialRampToValueAtTime(6000, at + length);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.28, at + length);
    g.gain.exponentialRampToValueAtTime(0.0001, at + length + 0.05);
    n.connect(bp).connect(g).connect(this.musicBus);
    n.start(at);
    n.stop(at + length + 0.1);
  }

  private crash(at: number) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5000;
    const g = this.ctx.createGain();
    this.env(g, at, 0.3, 0.002, 1.2);
    n.connect(hp).connect(g).connect(this.musicBus);
    n.start(at, Math.random());
    n.stop(at + 1.4);
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
      case 'laser1': return this.laser(at, 1);
      case 'laser2': return this.laser(at, 2);
      case 'laser3': return this.laser(at, 3);
      case 'laserEvo': return this.laser(at, 4);
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

  /* The sky laser, a tier per beam colour: yellow a thin quick zap, orange two detuned voices, red a deeper
     beam with a sub under it, and the evolved Death Ray a charge that rises before a heavy purple blast. */
  /* The laser: an electric buzz, not a whistle. Low detuned saws chopped by a fast square (the hum of a
     live wire) through a band-pass that closes as the beam fades, a crack of noise at the start and
     crackles over it; each tier lower, longer and with more voices, the Death Ray charging up first. */
  private laser(at: number, tier: number) {
    const evo = tier === 4;
    const start = evo ? at + 0.18 : at;
    const length = [0, 0.16, 0.22, 0.3, 0.5][tier];
    const hum = [0, 110, 92, 73, 55][tier];
    if (evo) {
      // The charge: a buzz rising to a crack.
      const c = this.ctx.createOscillator();
      c.type = 'sawtooth';
      c.frequency.setValueAtTime(45, at);
      c.frequency.exponentialRampToValueAtTime(220, start);
      const cb = this.ctx.createBiquadFilter();
      cb.type = 'bandpass';
      cb.frequency.setValueAtTime(600, at);
      cb.frequency.exponentialRampToValueAtTime(2600, start);
      cb.Q.value = 2;
      const cg = this.ctx.createGain();
      this.env(cg, at, 0.16, 0.12, 0.08);
      c.connect(cb).connect(cg).connect(this.sfxBus);
      c.start(at);
      c.stop(start + 0.05);
    }
    // The crack of the strike.
    this.hiss(start, 0.04, evo ? 0.4 : 0.22 + tier * 0.03, evo ? 3000 : 4200);
    // The buzz: detuned saws, chopped at mains-like speed, through a closing band-pass.
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 2.5;
    bp.frequency.setValueAtTime(evo ? 2600 : 3200, start);
    bp.frequency.exponentialRampToValueAtTime(500, start + length);
    const chop = this.ctx.createGain();
    chop.gain.value = 0.5;
    const lfo = this.ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 38 + tier * 9;
    const depth = this.ctx.createGain();
    depth.gain.value = 0.5;
    lfo.connect(depth).connect(chop.gain);
    const g = this.ctx.createGain();
    this.env(g, start, evo ? 0.34 : 0.2 + tier * 0.03, 0.004, length);
    const voices = tier === 1 ? [-8, 8] : [-15, 0, 15];
    for (const cents of voices) {
      for (const mult of [1, 2]) {
        const o = this.ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(hum * mult, start);
        o.frequency.exponentialRampToValueAtTime(hum * mult * 0.8, start + length);
        o.detune.value = cents;
        o.connect(bp);
        o.start(start);
        o.stop(start + length + 0.05);
      }
    }
    bp.connect(chop).connect(g).connect(this.sfxBus);
    lfo.start(start);
    lfo.stop(start + length + 0.05);
    // Crackles over the buzz, more each tier.
    for (let k = 0; k < tier + 1; k++) this.hiss(start + Math.random() * length * 0.8, 0.015, 0.12 + tier * 0.03, 2500 + Math.random() * 3500);
    // A sub thump under the red beam and the Death Ray.
    if (tier >= 3) {
      const sub = this.ctx.createOscillator();
      sub.frequency.setValueAtTime(evo ? 90 : 120, start);
      sub.frequency.exponentialRampToValueAtTime(40, start + length);
      const sg = this.ctx.createGain();
      this.env(sg, start, evo ? 0.45 : 0.3, 0.005, length);
      sub.connect(sg).connect(this.sfxBus);
      sub.start(start);
      sub.stop(start + length + 0.05);
    }
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
