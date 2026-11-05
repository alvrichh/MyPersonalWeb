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

/** Siege's troop sounds: attacks by weapon, deaths by body. */
export const SIEGE_SOUNDS = ['blade', 'blunt', 'pierce', 'claw', 'bite', 'throw', 'bow', 'gun', 'rifle', 'uzi', 'sniper', 'gatling', 'rocket', 'ray', 'flame', 'thunder', 'wind', 'meteor', 'breath', 'drill', 'magic', 'heal', 'slash', 'roar',
  'die-man', 'die-armor', 'die-beast', 'die-brute', 'die-bot', 'die-flyer', 'die-horse', 'die-dragon', 'base-falls', 'coin', 'corrupt-wind', 'death-ally', 'death-foe'] as const;
export type SiegeSound = (typeof SIEGE_SOUNDS)[number];
export type Sfx =
  | 'shoot' | 'knife' | 'boomerang' | 'hit' | 'kill' | 'gem' | 'hurt' | 'levelup' | 'pick'
  | 'door' | 'boss' | 'slam' | 'slash' | 'strike' | 'boom' | 'revive' | 'win' | 'over' | 'coin' | 'click'
  | 'laser1' | 'laser2' | 'laser3' | 'laserEvo' | 'zip' | 'arrow';

const BPM = 174;
const STEP = 60 / BPM / 4; // a sixteenth
const BAR = STEP * 16;
/* «Break to back» (`breaks`): UK bass breaks after mBreaks and Deekline's breakstep, at 134 BPM, the odd sixteenths
   swung a little late (straight in the breakstep blocks). */
const G_BPM = 134;
const GSTEP = 60 / G_BPM / 4;
const GBAR = GSTEP * 16;
const SWING = 0.12;
/** Its form in eight-bar blocks: a 2-step groove, a funky breakbeat, Deekline's breakstep (a straight funky break over
    a Miami 808 boom and a cowbell), a drumless break, and a drop with everything. */
type GBlock = 'intro' | 'garage' | 'breaks' | 'breakstep' | 'break' | 'drop';
const GARAGE_FORM: GBlock[] = ['intro', 'breakstep', 'garage', 'breaks', 'break', 'breakstep', 'drop', 'breakstep'];
/** The breakstep's break, two bars: kicks and snares straight on the grid (no swing), and the Miami cowbell. */
const STEP_KICK = [[0, 3, 10], [0, 6, 8, 11]];
const STEP_BELL = [[3, 6, 10, 14], [2, 7, 10, 13]];
/** The bass line, two bars of sixteenths over the chord's root ('r' rests, null holds), and the lead's four bars of eighths. */
const GARAGE_BASS: Note[] = [0, null, 'r', 12, 'r', 'r', 0, 'r', 'r', 'r', 10, null, 'r', 12, 'r', 7, 0, null, 'r', 'r', 12, 'r', 0, 'r', 'r', 3, 'r', 'r', 5, null, 7, 'r'];
/** «Break to back»'s chops of its break, one a bar: where the kick, the snare and the ghost snares fall. */
const BREAK_CHOPS: { kick: number[]; snare: number[]; ghost: number[] }[] = [
  { kick: [0, 6, 10], snare: [4, 12], ghost: [7, 9, 15] },
  { kick: [0, 3, 10], snare: [4, 12, 14], ghost: [7, 11] },
  { kick: [0, 8, 11], snare: [4, 12], ghost: [2, 7, 15] },
  { kick: [0, 6, 9, 14], snare: [4, 12], ghost: [3, 11] },
  { kick: [0, 10], snare: [4, 7, 12], ghost: [9, 13, 15] },
];
/** The Spanish breaks riff (after Colombo): two bars of sixteenths for the distorted mid bass that leads the breaks
    and the drop, octave jumps and a turn at the end ('r' rests, null holds). */
const COLOMBO_RIFF: Note[] = [0, null, 12, 0, 'r', 0, 10, null, 0, 'r', 12, 'r', 7, null, 10, 12, 0, null, 'r', 15, 12, null, 10, 'r', 0, 0, 'r', 12, 'r', 10, 7, 5];
/** Its acid line, two bars of eighths over the chord's root. */
const BREAK_ACID: Note[] = [0, 12, 'r', 0, 15, 'r', 12, 10, 0, 'r', 12, 13, 'r', 12, 7, 'r'];
/** «Juicio final»'s form, in eight-bar blocks: the cathedral alone, the drop with the hoover, the roll with the organ,
    the break, the peak with everything. */
type DBlock = 'intro' | 'drop' | 'roll' | 'break' | 'peak';
const DOOM_FORM: DBlock[] = ['intro', 'drop', 'roll', 'drop', 'break', 'peak', 'roll', 'peak'];
/** The hoover's line, two bars of quarter notes over the chord's root. */
const DOOM_HOOVER: Note[] = [0, 12, 1, 0, 0, 7, 12, 13];
/** The organ's melody, four bars of quarter notes in E Phrygian. */
const DOOM_ORGAN: Note[][] = [[7, null, 8, 7], [5, null, 3, null], [3, 5, 7, 8], [7, null, null, 'r']];
const GARAGE_LEAD: Note[][] = [
  [12, null, 15, 12, 'r', 10, 12, null], [10, null, 8, 7, 'r', 5, 7, null],
  [7, 10, 12, 15, 17, 15, 12, 10], [11, null, 12, null, 14, null, 'r', 'r'],
];

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

/* The songs. Each one keeps the same B2B set and drum patterns (the two DJs taking turns in eight-bar
   blocks); what changes is the key, the chords, the bass roots, the order of the blocks and the growl's line.
   `b2b` is the original; `doom` is the final boss's: D minor with a harmonic-minor A that pulls home,
   neuro first and the growl singing its own melody from the start. */
export type SongId = 'b2b' | 'doom' | 'breaks' | 'w1';
export type SongPick = 'auto' | 'worlds' | SongId | V2Id;
type Song = { root: number; chords: number[][]; roots: number[]; chordsB: number[][]; rootsB: number[]; set: Block[]; reese?: number[][]; pluck?: OscillatorType };
const SONGS: Record<SongId, Song> = {
  b2b: { root: ROOT, chords: CHORDS, roots: BASS_ROOTS, chordsB: CHORDS_B, rootsB: BASS_ROOTS_B, set: SET },
  breaks: {
    root: 36.71, // D1
    chords: [[0, 3, 7, 12], [-4, 0, 3, 8], [5, 8, 12, 15], [7, 11, 14, 19]],    // Dm – Bb – Gm7 – A
    roots: [0, -4, 5, 7],
    chordsB: [[0, 3, 7, 12], [-2, 2, 5, 10], [-4, 0, 3, 8], [7, 11, 14, 19]],   // Dm – C – Bb – A, a falling lament
    rootsB: [0, -2, -4, 7],
    set: ['neuro', 'liquid', 'neuro', 'both', 'breakdown', 'trance', 'both', 'neuro'],
    reese: [
      [0, 12, 10, 7, 3, 7],
      [12, 15, 14, 12, 10, 7],
      [0, 7, 12, 15, 17, 19],
      [15, 12, 10, 7, 5, 3],
    ],
  },
  /* «Juicio final», drum and bass unlike the rest: E Phrygian, the F a semitone over the root grinding on it. */
  doom: {
    root: 41.2, // E1
    chords: [[0, 3, 7, 12], [1, 5, 8, 13], [-4, 0, 3, 8], [1, 5, 8, 13]],    // Em – F – C – F
    roots: [0, 1, -4, 1],
    chordsB: [[5, 8, 12, 17], [1, 5, 8, 13], [-2, 2, 5, 10], [0, 3, 7, 12]],  // Am – F – D – Em
    rootsB: [5, 1, -2, 0],
    set: ['liquid', 'neuro', 'liquid', 'neuro', 'breakdown', 'trance', 'both', 'neuro'],
  },
  /* The first world's own song, on the same B2B beat in its own key, with its own chords, block order,
     growl line and pluck (the other worlds kept only their second versions, `V2S`). */
  w1: { // The Backlog: C minor, i–VI–III–VII, a chiptune pluck.
    root: 32.7,
    chords: [[0, 3, 7, 12], [-4, 0, 3, 8], [3, 7, 10, 15], [-2, 2, 5, 10]], roots: [0, -4, 3, -2],
    chordsB: [[-4, 0, 3, 8], [-2, 2, 5, 10], [0, 3, 7, 12], [7, 11, 14, 19]], rootsB: [-4, -2, 0, 7],
    set: ['liquid', 'neuro', 'liquid', 'neuro', 'breakdown', 'trance', 'both', 'neuro'],
    reese: [[0, 0, 7, 3, 0, 12], [0, 3, 5, 7, 5, 3]], pluck: 'square',
  },
};

/* The world songs' second versions (`w1v2`…`w8v2`): still drum and bass at 174, but each one built from its world's own
   sounds instead of the B2B set: its own drums (a two-step, the Amen break, half-time, techstep or a chopped jungle break),
   its own bass and lead voices, and its world's noises laid on the grid (typing and mail dings, fire, wind and ice, birds,
   taikos and a crowd, anvils and steam, a music box and whispers, a dragon and its heart), in a form of their own:
   eight-bar sections, the intro and the break without the main drums, the peak with everything. */
type Sec = 'intro' | 'drop' | 'roll' | 'break' | 'peak';
type Groove = 'twostep' | 'amen' | 'halftime' | 'techstep' | 'jungle';
type BassVoice = 'chip' | 'dist' | 'sub' | 'slide' | 'reese' | 'fm' | 'wobble' | 'squelch';
type LeadVoice = 'chip' | 'fire' | 'horn' | 'marimba' | 'brass' | 'robot' | 'musicbox' | 'crystal' | 'pungi';
/** A step of a bass line or a melody: a note (semitones), null to hold the one before, 'r' for silence. */
type Note = number | null | 'r';
/** The kit: how much the kick is driven, the snare's pitch and length, and how much of the snare goes to the reverb. */
type Kit = { drive: number; snare: number; decay: number; wet: number };
type V2 = {
  theme: number; root: number; chords: number[][]; roots: number[]; chordsB: number[][]; rootsB: number[];
  form: Sec[]; grooves: Partial<Record<Sec, Groove>>; kit: Kit;
  /** Two bars of sixteenths over the chord's root. */
  bass: BassVoice; line: Note[];
  /** Four bars of eighths over the song's root, in the lead's own octave (`leadOct` times the root). */
  lead: LeadVoice; leadOct: number; melody: Note[][];
};
export type V2Id = 'w1v2' | 'w2v2' | 'w3v2' | 'mudv2' | 'w4v2' | 'w5v2' | 'w6v2' | 'w7v2' | 'w8v2' | BossSongId | CartoonSongId;
/** Siege Cartoon's songs: drum and bass with an orchestra on top (strings, horns, timpani, cymbals, a choir at the peaks). */
export type CartoonSongId = 'cartoon-menu' | 'cartoon-battle' | 'cartoon-boss' | 'cartoon-villain-menu' | 'cartoon-villain';
/** The final bosses' own songs: each its world's song as a boss version, the same key, sounds (`theme`), lead and
    melody, its bass line and chords darker and harder, with no calm intro (it starts on the drop). «By world» plays it while that boss is out. */
export const BOSS_SONGS = ['kernel', 'archdemon', 'drakkar', 'medusa', 'queen', 'zeus', 'mech', 'wraith', 'chimera'] as const;
export type BossSongId = `boss-${(typeof BOSS_SONGS)[number]}`;
const BOSS_FORM: Sec[] = ['drop', 'peak', 'roll', 'peak', 'break', 'drop', 'roll', 'peak'];
/** «By world»: each world's second version, in world order (the first world's in the menus too). */
const WORLD_V2: V2Id[] = ['w1v2', 'w2v2', 'w3v2', 'mudv2', 'w4v2', 'w5v2', 'w6v2', 'w7v2', 'w8v2'];
const V2S: Record<V2Id, V2> = {
  'cartoon-menu': { // Siege Cartoon's menus: liquid drum and bass in D minor, a heroic horn call over strings and timpani.
    theme: 10, root: 36.71,
    chords: [[0, 3, 7, 12], [-4, 0, 3, 8], [-2, 2, 5, 10], [-5, -1, 2, 7]], roots: [0, -4, -2, -5],
    chordsB: [[3, 7, 10, 15], [-2, 2, 5, 10], [-4, 0, 3, 8], [-5, -1, 2, 7]], rootsB: [3, -2, -4, -5],
    form: ['intro', 'roll', 'drop', 'roll', 'break', 'drop', 'peak', 'roll'],
    grooves: { drop: 'twostep', roll: 'twostep', peak: 'amen' }, kit: { drive: 0.2, snare: 2200, decay: 0.16, wet: 0.45 },
    bass: 'sub', line: [0, null, null, null, null, null, 0, null, null, null, 7, null, null, null, 5, null, 0, null, null, null, null, null, 0, null, null, null, 3, null, 2, null, null, null],
    lead: 'horn', leadOct: 4,
    melody: [[12, null, null, 15, 19, null, 17, 15], [14, null, 12, null, 10, null, 'r', null], [12, null, 15, 19, 24, null, 22, 19], [19, null, null, 17, 19, null, 'r', null]],
  },
  'cartoon-villain-menu': { // The Villain's menus: C minor creeping in half-time, a music box with whispers and the choir
    // (theme 7), the Phrygian Db and the tritone's F# lurking under its tune.
    theme: 7, root: 32.7,
    chords: [[0, 3, 7, 12], [5, 8, 12, 17], [1, 5, 8, 13], [7, 11, 14, 19]], roots: [0, 5, 1, 7],
    chordsB: [[-4, 0, 3, 8], [5, 8, 12, 17], [6, 10, 13, 18], [7, 11, 14, 19]], rootsB: [-4, 5, 6, 7],
    form: ['intro', 'roll', 'drop', 'roll', 'break', 'drop', 'peak', 'roll'],
    grooves: { drop: 'halftime', roll: 'halftime', peak: 'techstep' }, kit: { drive: 0.5, snare: 1500, decay: 0.24, wet: 0.5 },
    bass: 'sub', line: [0, null, null, null, null, null, 0, null, null, null, 1, null, null, null, 0, null, 0, null, null, null, null, null, 0, null, null, null, 6, null, 7, null, null, null],
    lead: 'musicbox', leadOct: 8,
    melody: [[12, null, 15, null, 14, null, 12, null], [11, null, 12, null, 'r', null, 'r', null], [15, null, 18, null, 17, null, 15, null], [14, null, 13, null, 12, null, 'r', null]],
  },
  'cartoon-villain': { // The Villain's battles: C harmonic minor marching on techstep, a driven bass grinding on the Db, a
    // low brass theme with the tritone in it and the choir at every peak (theme 8: the dragon and its heart).
    theme: 8, root: 32.7,
    chords: [[0, 3, 7, 12], [-4, 0, 3, 8], [5, 8, 12, 17], [7, 11, 14, 19]], roots: [0, -4, 5, 7],
    chordsB: [[0, 3, 7, 12], [1, 5, 8, 13], [-4, 0, 3, 8], [7, 11, 14, 19]], rootsB: [0, 1, -4, 7],
    form: ['intro', 'drop', 'roll', 'peak', 'break', 'drop', 'peak', 'peak'],
    grooves: { drop: 'halftime', roll: 'techstep', peak: 'techstep' }, kit: { drive: 1, snare: 1400, decay: 0.22, wet: 0.3 },
    bass: 'dist', line: [0, null, null, 0, null, 'r', 1, null, 0, null, null, 0, null, 'r', -1, null, 0, null, null, 0, null, 'r', 1, null, 3, null, 1, null, 0, null, -1, null],
    lead: 'brass', leadOct: 4,
    melody: [[0, null, 0, 3, 7, null, 6, null], [5, null, 3, 2, 3, null, 'r', null], [0, null, 0, 3, 8, null, 7, 6], [7, null, null, null, 'r', null, 'r', null]],
  },
  'cartoon-boss': { // Siege Cartoon's guardians: Nocthrax's E minor wobble and its Phrygian pull, brass for its crystal bells,
    // the orchestra crashing in on top (theme 10) and the choir at every peak.
    theme: 10, root: 41.2,
    chords: [[0, 3, 7, 12], [1, 5, 8, 13], [0, 3, 7, 12], [7, 11, 14, 19]], roots: [0, 1, 0, 7],
    chordsB: [[-4, 0, 3, 8], [-2, 2, 5, 10], [-1, 3, 6, 11], [7, 11, 14, 19]], rootsB: [-4, -2, -1, 7],
    form: BOSS_FORM, grooves: { drop: 'techstep', roll: 'jungle', peak: 'halftime' }, kit: { drive: 0.9, snare: 1900, decay: 0.2, wet: 0.4 },
    bass: 'wobble', line: [0, null, null, null, 1, null, 0, null, null, null, 12, null, 13, null, 0, null, 0, null, null, null, 1, null, 0, null, null, null, 15, null, 13, null, 12, null],
    lead: 'brass', leadOct: 4,
    melody: [[12, null, 15, 19, 24, null, 19, 15], [13, null, 17, 20, 25, null, 20, 17], [19, null, 23, 26, 31, null, 26, 23], [24, 19, 15, 12, 11, null, 12, 'r']],
  },
  'cartoon-battle': { // Siege Cartoon's battles: half-time drum and bass in D minor, a war brass theme, the orchestra crashing in.
    theme: 10, root: 36.71,
    chords: [[0, 3, 7, 12], [-2, 2, 5, 10], [-4, 0, 3, 8], [-5, -1, 2, 7]], roots: [0, -2, -4, -5],
    chordsB: [[5, 8, 12, 17], [3, 7, 10, 15], [-2, 2, 5, 10], [-5, -1, 2, 7]], rootsB: [5, 3, -2, -5],
    form: ['intro', 'drop', 'roll', 'peak', 'break', 'drop', 'peak', 'peak'],
    grooves: { drop: 'halftime', roll: 'amen', peak: 'amen' }, kit: { drive: 0.7, snare: 1700, decay: 0.2, wet: 0.4 },
    bass: 'reese', line: [0, null, null, 0, null, null, 0, null, 'r', 0, null, null, 7, null, 5, null, 0, null, null, 0, null, null, 12, null, 'r', 10, null, null, 7, null, 3, 2],
    lead: 'brass', leadOct: 4,
    melody: [[12, null, 12, 15, 19, null, null, null], [17, null, 15, 14, 15, null, 'r', null], [12, null, 12, 15, 20, null, 19, null], [19, null, null, null, 'r', null, 'r', null]],
  },
  'boss-kernel': { // Kernel Panic: the Backlog's chiptune turned to C minor (its thirds flattened, the B kept sharp), still on the Amen, a driven bass.
    theme: 1, root: 32.7,
    chords: [[5, 8, 12, 17], [7, 11, 14, 19], [3, 7, 10, 15], [8, 12, 15, 20]], roots: [5, 7, 3, 8],
    chordsB: [[0, 3, 7, 12], [8, 12, 15, 20], [5, 8, 12, 17], [7, 11, 14, 19]], rootsB: [0, 8, 5, 7],
    form: BOSS_FORM, grooves: { drop: 'amen', roll: 'jungle', peak: 'amen' }, kit: { drive: 0.8, snare: 2400, decay: 0.12, wet: 0 },
    bass: 'dist', line: [0, null, null, 0, 12, null, 0, null, 'r', 0, null, 12, 12, null, 7, null, 0, null, null, 0, 12, null, 0, null, 'r', 0, null, 11, 3, null, 5, 7],
    lead: 'chip', leadOct: 8,
    melody: [[12, null, 15, 19, 17, 15, 14, 12], [14, null, null, 11, 12, 14, 15, null], [15, 19, 20, 19, 15, 14, 12, null], [8, null, 12, 14, 12, 11, 12, 'r']],
  },
  'boss-archdemon': { // The Archdemon: E Phrygian dominant at its darkest, half-time and driven, a burning lead.
    theme: 2, root: 41.2,
    chords: [[0, 4, 7, 12], [1, 5, 8, 13], [-2, 1, 5, 10], [0, 4, 7, 12]], roots: [0, 1, -2, 0],
    chordsB: [[5, 8, 12, 17], [1, 5, 8, 13], [-4, -1, 2, 8], [0, 4, 7, 12]], rootsB: [5, 1, -4, 0],
    form: BOSS_FORM, grooves: { drop: 'halftime', roll: 'techstep', peak: 'techstep' }, kit: { drive: 1, snare: 1300, decay: 0.22, wet: 0.25 },
    bass: 'dist', line: [0, null, null, 1, 0, 'r', 0, null, 'r', 0, 1, null, 0, 'r', -2, null, 0, null, null, 1, 0, 'r', 12, null, 13, 12, 'r', 8, 7, 'r', 1, 0],
    lead: 'fire', leadOct: 8,
    melody: [[12, 13, 16, 13, 12, null, 8, null], [7, 8, 7, 5, 4, null, 1, null], [12, 16, 17, 19, 20, 19, 17, 16], [13, null, 12, null, 8, 7, 4, 'r']],
  },
  'boss-drakkar': { // The Drakkar and Valdur: Code Freeze's horn call as a D minor war march, rowing drums, an A major pull to the charge.
    theme: 3, root: 36.71,
    chords: [[0, 3, 7, 12], [-2, 2, 5, 10], [-4, 0, 3, 8], [-2, 2, 5, 10]], roots: [0, -2, -4, -2],
    chordsB: [[0, 3, 7, 12], [3, 7, 10, 15], [-2, 2, 5, 10], [7, 11, 14, 19]], rootsB: [0, 3, -2, 7],
    form: BOSS_FORM, grooves: { drop: 'twostep', roll: 'halftime', peak: 'amen' }, kit: { drive: 0.3, snare: 1900, decay: 0.24, wet: 0.5 },
    bass: 'reese', line: [0, null, null, 0, null, null, 0, null, null, null, 0, null, null, null, 7, null, 0, null, null, 0, null, null, 0, null, null, null, -2, null, null, null, -5, null],
    lead: 'horn', leadOct: 4,
    melody: [[0, null, 0, null, 7, null, 7, null], [5, null, 3, null, 2, null, 0, null], [0, null, 3, null, 7, null, 10, null], [12, null, 14, null, 10, null, 7, null]],
  },
  'boss-medusa': { // The Medusa: Big Ball of Mud's snake charmer tune in its own D double harmonic, frantic, its third phrase an octave up.
    theme: 9, root: 36.71,
    chords: [[0, 3, 7, 12], [1, 5, 8, 13], [0, 3, 7, 12], [-1, 2, 5, 11]], roots: [0, 1, 0, -1],
    chordsB: [[5, 8, 12, 17], [1, 5, 8, 13], [-1, 3, 6, 11], [0, 4, 7, 12]], rootsB: [5, 1, -1, 0],
    form: BOSS_FORM, grooves: { drop: 'halftime', roll: 'jungle', peak: 'techstep' }, kit: { drive: 0.6, snare: 1700, decay: 0.18, wet: 0.35 },
    bass: 'squelch', line: [0, null, 'r', 0, 12, 'r', 0, 1, 1, 'r', 0, null, 'r', 12, 0, 'r', 0, null, 'r', 0, 12, 'r', 0, 1, 13, 12, 'r', 0, 11, 1, 0, 'r'],
    lead: 'pungi', leadOct: 8,
    melody: [[12, 13, 12, 11, 12, null, 8, 7], [8, null, 7, 5, 4, null, 'r', null], [19, 20, 23, 24, 25, 24, 23, 20], [7, null, 5, 4, 1, null, 0, null]],
  },
  'boss-queen': { // The Carnivorous Queen: Legacy Jungle's marimba tune with a Phrygian Ab biting into it, the break chopped harder.
    theme: 4, root: 49,
    chords: [[0, 3, 7, 10], [-4, 0, 3, 7], [-2, 2, 5, 9], [0, 3, 7, 10]], roots: [0, -4, -2, 0],
    chordsB: [[5, 8, 12, 15], [1, 5, 8, 13], [3, 7, 10, 15], [-5, -1, 2, 7]], rootsB: [5, 1, 3, -5],
    form: BOSS_FORM, grooves: { drop: 'jungle', roll: 'jungle', peak: 'jungle' }, kit: { drive: 0.3, snare: 2500, decay: 0.12, wet: 0.15 },
    bass: 'slide', line: [0, null, null, 'r', 1, null, 0, null, null, null, 7, null, 5, null, 3, null, 0, null, null, 'r', 1, null, 0, null, null, null, -2, null, 0, null, null, null],
    lead: 'marimba', leadOct: 8,
    melody: [[12, 10, 7, null, 10, 12, 15, null], [13, null, 12, 10, 7, null, 8, 7], [7, null, 10, 12, 15, 17, 15, 12], [13, 12, 10, 8, 7, null, null, 'r']],
  },
  'boss-zeus': { // Zeus: A minor at full storm, epic brass over taikos, two-step and a chopped break in turn.
    theme: 5, root: 55,
    chords: [[0, 3, 7, 12], [-4, 0, 3, 8], [-7, -4, 0, 5], [-5, -1, 2, 7]], roots: [0, -4, -7, -5],
    chordsB: [[-4, 0, 3, 8], [-2, 2, 5, 10], [-5, -1, 2, 7], [-5, -1, 2, 7]], rootsB: [-4, -2, -5, -5],
    form: BOSS_FORM, grooves: { drop: 'twostep', roll: 'amen', peak: 'jungle' }, kit: { drive: 0.4, snare: 1800, decay: 0.2, wet: 0.45 },
    bass: 'reese', line: [0, null, 0, null, 12, null, 0, 10, null, 0, null, 7, null, 0, 3, null, 0, null, 0, null, 12, null, 0, 10, null, 12, null, 14, null, 15, null, 12],
    lead: 'brass', leadOct: 4,
    melody: [[12, null, 12, 15, 19, null, 24, null], [22, 20, 19, null, 17, null, 15, null], [12, null, 12, 15, 19, null, 24, 26], [27, null, 26, null, 23, null, 24, null]],
  },
  'boss-mech': { // The Overclock Mech: The Forge's robot riff at full speed, a semitone grinding under it, metal bass, the robot screaming.
    theme: 6, root: 46.25,
    chords: [[0, 3, 7, 12], [0, 3, 7, 12], [-4, 0, 3, 8], [-2, 2, 5, 10]], roots: [0, 0, -4, -2],
    chordsB: [[0, 3, 7, 12], [6, 9, 13, 18], [5, 8, 12, 17], [1, 5, 8, 13]], rootsB: [0, 6, 5, 1],
    form: BOSS_FORM, grooves: { drop: 'techstep', roll: 'techstep', peak: 'amen' }, kit: { drive: 1, snare: 1150, decay: 0.15, wet: 0.1 },
    bass: 'fm', line: [0, 'r', 0, 'r', 12, 'r', 0, 0, 'r', 0, 'r', 12, 0, 'r', 1, 'r', 0, 'r', 0, 'r', 12, 'r', 0, 0, 'r', 12, 'r', 0, 13, 'r', 12, 1],
    lead: 'robot', leadOct: 8,
    melody: [[0, 0, 0, null, 3, null, 0, null], [7, null, 6, null, 3, null, 1, 0], [0, 0, 12, null, 13, null, 12, 10], [7, null, 6, null, 3, null, 1, 0]],
  },
  'boss-wraith': { // The Shadow Wraith: Haunted Servers' broken music box tune turned sinister with the tritone, a deep growl.
    theme: 7, root: 30.87,
    chords: [[0, 3, 7, 12], [-4, 0, 3, 8], [5, 8, 12, 17], [7, 11, 14, 19]], roots: [0, -4, 5, 7],
    chordsB: [[-4, 0, 3, 8], [-2, 1, 5, 10], [6, 9, 13, 18], [7, 11, 14, 19]], rootsB: [-4, -2, 6, 7],
    form: BOSS_FORM, grooves: { drop: 'halftime', roll: 'amen', peak: 'halftime' }, kit: { drive: 0.2, snare: 1550, decay: 0.24, wet: 0.5 },
    bass: 'reese', line: [0, null, null, null, 1, null, null, null, 'r', null, 1, null, 0, null, null, null, 0, null, null, null, 1, null, 6, null, null, null, 5, null, null, null, 1, null],
    lead: 'musicbox', leadOct: 16,
    melody: [[7, null, 5, 3, 5, null, 7, null], [10, null, 7, null, 6, null, 'r', null], [7, 6, 5, 3, 2, null, 1, null], [0, null, 6, null, 0, null, null, 'r']],
  },
  'boss-chimera': { // Nocthrax: E minor at the end of everything, a wobbling bass, crystal bells, the dragon roaring every drop.
    theme: 8, root: 41.2,
    chords: [[0, 3, 7, 12], [1, 5, 8, 13], [0, 3, 7, 12], [7, 11, 14, 19]], roots: [0, 1, 0, 7],
    chordsB: [[-4, 0, 3, 8], [-2, 2, 5, 10], [-1, 3, 6, 11], [7, 11, 14, 19]], rootsB: [-4, -2, -1, 7],
    form: BOSS_FORM, grooves: { drop: 'techstep', roll: 'jungle', peak: 'twostep' }, kit: { drive: 0.9, snare: 2000, decay: 0.18, wet: 0.35 },
    bass: 'wobble', line: [0, null, null, null, 1, null, 0, null, null, null, 12, null, 13, null, 0, null, 0, null, null, null, 1, null, 0, null, null, null, 15, null, 13, null, 12, null],
    lead: 'crystal', leadOct: 16,
    melody: [[0, 3, 7, 12, 13, 12, 7, 3], [1, 5, 8, 13, 8, 5, 1, 0], [7, 11, 14, 19, 14, 11, 7, 11], [12, 7, 3, 0, -1, 0, 3, 7]],
  },
  w1v2: { // The Backlog: a bright C major chiptune roller on the Amen break; keyboards typing, mail dings, a dial-up modem.
    theme: 1, root: 32.7,
    chords: [[5, 9, 12, 16], [7, 11, 14, 17], [4, 7, 11, 16], [9, 12, 16, 19]], roots: [5, 7, 4, 9],
    chordsB: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 19]], rootsB: [0, 9, 5, 7],
    form: ['intro', 'drop', 'roll', 'drop', 'break', 'peak', 'roll', 'peak'],
    grooves: { drop: 'amen', roll: 'amen', peak: 'amen' }, kit: { drive: 0, snare: 2600, decay: 0.1, wet: 0 },
    // Half the notes it had (a busy, loud chip line on every other sixteenth was too much when the drums come in).
    bass: 'chip', line: [0, null, null, null, 12, null, 0, null, 'r', 0, null, null, 12, null, 7, null, 0, null, null, null, 12, null, 0, null, 'r', 0, null, null, 3, null, 5, 7],
    lead: 'chip', leadOct: 8,
    melody: [[12, null, 16, 19, 17, 16, 14, 12], [14, null, null, 11, 12, 14, 16, null], [16, 19, 21, 19, 16, 14, 12, null], [9, null, 12, 14, 12, 11, 12, 'r']],
  },
  w2v2: { // Hotfix Inferno: E Phrygian dominant, half-time and heavy; crackling fire, flame sweeps, an alarm, tribal toms, a driven bass.
    theme: 2, root: 41.2,
    chords: [[0, 4, 7, 12], [1, 5, 8, 13], [0, 4, 7, 12], [-2, 1, 5, 10]], roots: [0, 1, 0, -2],
    chordsB: [[5, 8, 12, 17], [1, 5, 8, 13], [-2, 1, 5, 10], [0, 4, 7, 12]], rootsB: [5, 1, -2, 0],
    form: ['intro', 'drop', 'drop', 'roll', 'break', 'peak', 'peak', 'roll'],
    grooves: { drop: 'halftime', roll: 'techstep', peak: 'twostep' }, kit: { drive: 1, snare: 1500, decay: 0.2, wet: 0.15 },
    bass: 'dist', line: [0, null, null, null, 'r', null, 0, null, 0, 1, null, 'r', 0, null, null, -2, 0, null, null, null, 'r', null, 12, null, 13, 12, 'r', 0, null, 1, null, 0],
    lead: 'fire', leadOct: 8,
    melody: [[12, null, 13, null, 16, null, 13, 12], [10, null, 12, null, 8, null, null, 'r'], [12, 13, 16, 17, 19, 17, 16, 13], [12, null, null, null, 8, 7, 8, null]],
  },
  w3v2: { // Code Freeze: D minor, glacial and wide; wind, ice tinkling, a celesta, a choir, war drums and a Viking horn.
    theme: 3, root: 36.71,
    chords: [[0, 3, 7, 12], [-2, 2, 5, 10], [-4, 0, 3, 8], [-2, 2, 5, 10]], roots: [0, -2, -4, -2],
    chordsB: [[0, 3, 7, 12], [3, 7, 10, 15], [-2, 2, 5, 10], [0, 3, 7, 12]], rootsB: [0, 3, -2, 0],
    form: ['intro', 'break', 'drop', 'roll', 'break', 'peak', 'drop', 'peak'],
    grooves: { drop: 'twostep', roll: 'halftime', peak: 'twostep' }, kit: { drive: 0, snare: 2000, decay: 0.24, wet: 0.5 },
    bass: 'sub', line: [0, null, null, null, null, null, null, null, null, null, 0, null, null, null, 7, null, 0, null, null, null, null, null, null, null, null, null, -2, null, null, null, -5, null],
    lead: 'horn', leadOct: 4,
    melody: [[0, null, null, null, 7, null, null, null], [5, null, 3, null, 2, null, null, null], [0, null, null, 3, 7, null, 10, null], [12, null, null, null, 10, null, 7, null]],
  },
  mudv2: { // Big Ball of Mud: D double harmonic, a snake charmer's tune for the Medusa over a squelching bass;
    // frogs croaking in turn, mud bubbling, drips into the swamp, a rattling hiss.
    theme: 9, root: 36.71,
    chords: [[0, 3, 7, 12], [1, 5, 8, 13], [0, 3, 7, 12], [-1, 2, 5, 11]], roots: [0, 1, 0, -1],
    chordsB: [[5, 8, 12, 17], [1, 5, 8, 13], [3, 7, 10, 15], [0, 4, 7, 12]], rootsB: [5, 1, 3, 0],
    form: ['intro', 'drop', 'roll', 'drop', 'break', 'peak', 'roll', 'peak'],
    grooves: { drop: 'halftime', roll: 'amen', peak: 'twostep' }, kit: { drive: 0.5, snare: 1700, decay: 0.18, wet: 0.3 },
    bass: 'squelch', line: [0, null, 'r', 0, 12, 'r', 0, null, 1, 'r', 0, null, 'r', 12, 0, 'r', 0, null, 'r', 0, 12, 'r', 0, null, 13, 12, 'r', 0, null, 1, 0, 'r'],
    lead: 'pungi', leadOct: 8,
    melody: [[12, 13, 12, 11, 12, null, 8, 7], [8, null, 7, 5, 4, null, 'r', null], [7, 8, 11, 12, 13, 12, 11, 8], [7, null, 5, 4, 1, null, 0, null]],
  },
  w4v2: { // Legacy Jungle: real ragga jungle in G minor; a chopped Amen, sliding sub, reggae skanks, log drums, birds and insects.
    theme: 4, root: 49,
    chords: [[0, 3, 7, 10], [-4, 0, 3, 7], [-2, 2, 5, 9], [0, 3, 7, 10]], roots: [0, -4, -2, 0],
    chordsB: [[5, 8, 12, 15], [-2, 2, 5, 9], [-4, 0, 3, 7], [-5, -1, 2, 5]], rootsB: [5, -2, -4, -5],
    form: ['intro', 'drop', 'roll', 'drop', 'break', 'roll', 'peak', 'peak'],
    grooves: { drop: 'jungle', roll: 'jungle', peak: 'jungle' }, kit: { drive: 0, snare: 2400, decay: 0.12, wet: 0.1 },
    bass: 'slide', line: [0, null, null, 'r', null, null, 0, null, null, null, 7, null, 5, null, 3, null, 0, null, null, 'r', null, null, 0, null, null, null, -2, null, 0, null, null, null],
    lead: 'marimba', leadOct: 8,
    melody: [[12, 10, 7, null, 10, 12, 15, null], [12, null, 10, 7, 5, null, 3, null], [7, null, 10, 12, 15, 17, 15, 12], [10, null, 7, 5, 7, null, null, 'r']],
  },
  w5v2: { // The Arena: A harmonic minor, epic; taikos, brass fanfares and stabs, swords clashing, a crowd roaring on every drop.
    theme: 5, root: 55,
    chords: [[0, 3, 7, 12], [-4, 0, 3, 8], [-2, 2, 5, 10], [-5, -1, 2, 7]], roots: [0, -4, -2, -5],
    chordsB: [[5, 8, 12, 17], [0, 3, 7, 12], [7, 11, 14, 19], [7, 11, 14, 19]], rootsB: [5, 0, 7, 7],
    form: ['intro', 'drop', 'roll', 'peak', 'break', 'peak', 'roll', 'peak'],
    grooves: { drop: 'twostep', roll: 'amen', peak: 'twostep' }, kit: { drive: 0.3, snare: 1800, decay: 0.2, wet: 0.4 },
    bass: 'reese', line: [0, null, null, 0, null, null, 12, null, null, null, 0, 10, null, null, 7, null, 0, null, null, 0, null, null, 12, null, null, null, 3, 5, null, null, 7, null],
    lead: 'brass', leadOct: 4,
    melody: [[12, null, 'r', 12, 19, null, 24, null], [22, null, 20, 19, 17, null, 19, null], [12, null, 'r', 12, 19, null, 24, null], [27, 26, 24, 23, 24, null, null, null]],
  },
  w6v2: { // The Forge: F# minor techstep; anvils on the offbeat, clanking machines, steam, servos, a metallic FM bass and a robot lead.
    theme: 6, root: 46.25,
    chords: [[0, 3, 7, 12], [0, 3, 7, 12], [-4, 0, 3, 8], [-2, 2, 5, 10]], roots: [0, 0, -4, -2],
    chordsB: [[0, 3, 7, 12], [1, 5, 8, 13], [0, 3, 7, 12], [1, 4, 8, 13]], rootsB: [0, 1, 0, 1],
    form: ['drop', 'roll', 'drop', 'roll', 'break', 'peak', 'roll', 'peak'],
    grooves: { drop: 'techstep', roll: 'techstep', peak: 'techstep' }, kit: { drive: 1, snare: 1200, decay: 0.16, wet: 0.1 },
    bass: 'fm', line: [0, 'r', 0, 'r', 12, 'r', 0, 0, 'r', 0, 'r', 12, 0, 'r', 1, 'r', 0, 'r', 0, 'r', 12, 'r', 0, 0, 'r', 12, 'r', 0, 13, 'r', 12, 'r'],
    lead: 'robot', leadOct: 8,
    melody: [[0, null, 0, null, 3, null, 0, null], [7, null, 6, null, 3, null, 'r', null], [0, 0, 12, null, 10, null, 7, null], [6, null, 3, null, 1, null, 0, null]],
  },
  w7v2: { // Haunted Servers: B minor darkstep with tritones; a broken music box, a theremin, whispers, creaking doors, a heartbeat, a bell.
    theme: 7, root: 30.87,
    chords: [[0, 3, 7, 12], [-4, 0, 3, 8], [5, 8, 12, 17], [7, 11, 14, 19]], roots: [0, -4, 5, 7],
    chordsB: [[0, 3, 7, 12], [1, 5, 8, 13], [0, 3, 7, 12], [6, 9, 13, 18]], rootsB: [0, 1, 0, 6],
    form: ['intro', 'break', 'drop', 'roll', 'break', 'peak', 'drop', 'roll'],
    grooves: { drop: 'halftime', roll: 'amen', peak: 'halftime' }, kit: { drive: 0.4, snare: 1600, decay: 0.22, wet: 0.45 },
    bass: 'reese', line: [0, null, null, null, null, null, null, null, 'r', null, 1, null, 0, null, null, null, 0, null, null, null, null, null, 6, null, null, null, 5, null, null, null, 1, null],
    lead: 'musicbox', leadOct: 16,
    melody: [[7, null, 5, 3, 5, null, 7, null], [10, null, 7, null, 3, null, 'r', null], [7, null, 5, 3, 2, null, 3, null], [0, null, null, null, 6, null, null, 'r']],
  },
  w8v2: { // The Core: E minor, cosmic and massive; the dragon's roar, its heartbeat, magma, laser zaps, crystal bells, a choir, a wobbling bass.
    theme: 8, root: 41.2,
    chords: [[0, 3, 7, 12], [-4, 0, 3, 8], [5, 8, 12, 17], [7, 11, 14, 19]], roots: [0, -4, 5, 7],
    chordsB: [[-4, 0, 3, 8], [-2, 2, 5, 10], [7, 11, 14, 19], [7, 11, 14, 19]], rootsB: [-4, -2, 7, 7],
    form: ['intro', 'peak', 'roll', 'drop', 'break', 'peak', 'roll', 'peak'],
    grooves: { drop: 'techstep', roll: 'amen', peak: 'twostep' }, kit: { drive: 0.8, snare: 2000, decay: 0.18, wet: 0.3 },
    bass: 'wobble', line: [0, null, null, null, null, null, 0, null, null, null, 12, null, null, null, 0, null, 0, null, null, null, null, null, 0, null, null, null, 15, null, 12, null, 7, null],
    lead: 'crystal', leadOct: 16,
    melody: [[0, 3, 7, 12, 7, 3, 0, 3], [-4, 0, 3, 8, 3, 0, -4, 0], [5, 8, 12, 17, 12, 8, 5, 8], [7, 11, 14, 19, 14, 11, 7, 11]],
  },
};

/** The drum patterns, a bar of sixteenths each (kick, snare, ghost snare, hats); the Amen and the jungle chop take two bars. */
const GROOVES: Record<Groove, { k: string; s: string; g: string; h: string }[]> = {
  twostep: [{ k: 'x.........x.....', s: '....x.......x...', g: '.......x......x.', h: 'x.x.x.x.x.x.x.x.' }],
  amen: [
    { k: 'x.x.......x.....', s: '....x.......x...', g: '.......x.x....x.', h: 'x.x.x.x.x.x.x.x.' },
    { k: 'x.x.......xx....', s: '....x.......x...', g: '.......x.x.x...x', h: 'x.x.x.x.x.x.x.x.' },
  ],
  halftime: [{ k: 'x.....x...x.....', s: '........x.......', g: '.............x..', h: 'x.x.x.x.x.x.x.x.' }],
  techstep: [{ k: 'x......x..x.....', s: '....x.......x...', g: '...x......x...x.', h: 'xxxxxxxxxxxxxxxx' }],
  jungle: [
    { k: 'x.x.......x.....', s: '....x.......x...', g: '.......x.x....x.', h: 'x.x.x.x.x.x.x.x.' },
    { k: 'x.x.......xx....', s: '....x.......x...', g: '.......x.x.x...x', h: 'x.x.x.x.x.x.x.x.' },
  ],
};
/** How the jungle groove chops its break, bar by bar: which beat of the break each beat plays. */
const CHOPS = [[0, 1, 2, 3], [0, 1, 0, 3], [0, 3, 2, 1], [2, 1, 0, 3]];

/** The growl's line in boss fights, one note per hit (steps 0, 3, 6, 10, 11, 14), over two bars. */
const BOSS_REESE = [
  [0, 7, 3, 10, 7, 12],
  [0, 3, 5, 3, 0, -5],
];

/** The final boss's growl melody over four bars (rising, peaking, then falling home), in semitones over the chord's root. */
const FINAL_REESE = [
  [0, 12, 10, 7, 3, 7],
  [12, 15, 14, 12, 10, 7],
  [0, 7, 12, 15, 17, 19],
  [15, 12, 10, 7, 5, 3],
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
  /** The reverb's input (the v2 songs send to it). */
  private verbIn!: GainNode;
  private volumes = { music: 0.6, sfx: 0.8 };

  unlock() {
    if (this.ready) {
      // iOS leaves it 'interrupted' after a call or the phone locking, not only 'suspended'.
      if (this.ctx.state !== 'running') void this.ctx.resume();
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
    // Opened as far as the intensity already set says (the cover sets it before the sound starts; it was left at
    // 2200 Hz, every song muffled there until a run began).
    this.filter.frequency.value = 1800 + Math.max(0.5, this.intensity) * 6000;
    this.filter.Q.value = 0.7;
    this.musicBus.connect(this.filter).connect(this.master);
    this.padBus = this.ctx.createGain();
    this.padBus.connect(this.musicBus);
    // A plate of reverb for the v2 songs' cold, haunted and epic sounds: two and a half seconds of decaying noise.
    const sr = this.ctx.sampleRate;
    const ir = this.ctx.createBuffer(2, Math.floor(sr * 2.5), sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    }
    const verb = this.ctx.createConvolver();
    verb.buffer = ir;
    this.verbIn = this.ctx.createGain();
    this.verbIn.gain.value = 0.5;
    this.verbIn.connect(verb).connect(this.musicBus);
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
    if (this.ctx.state !== 'running') void this.ctx.resume();
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

  /** Which song plays (picked in Customise): 'auto' is the original with the final boss's own song for that fight. */
  private pick: SongPick = 'auto';
  private songId: SongId | V2Id | 'mix' = 'b2b';
  private songNow = false;
  private root = ROOT;
  setSong(pick: SongPick) {
    this.pick = pick;
    this.songNow = true;
  }
  /** The world being played (0 in the menus, where «by world» plays the original, `b2b`, like «automatic»). */
  private world = 0;
  setWorld(n: number) {
    if (n === this.world) return;
    this.world = n;
    this.songNow = true;
  }
  /** Customise's music list is open: the menus play what is picked there, to listen to it. */
  private preview = false;
  setPreview(on: boolean) {
    if (on === this.preview) return;
    this.preview = on;
    this.songNow = true;
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
  /** Which final boss is out (its `bossId`; Valdur fights to the Drakkar's song). */
  private finalId = '';
  setFinal(on: boolean, rage: boolean, id = '') {
    this.finalWanted = on;
    this.rage = on && rage;
    // Valdur fights to the Drakkar's song, the secret Kratos to the Archdemon's.
    this.finalId = id === 'valdur' ? 'drakkar' : id === 'kratos' ? 'archdemon' : id;
  }

  /** A sixteenth of the song playing (the epic songs keep their own tempo). */
  private stepLen() { return this.songId === 'breaks' ? GSTEP : STEP; }
  private tick = () => {
    if (!this.playing) return;
    // After a stall of the main thread (a long frame, a tab switch) the steps missed are skipped, not all fired at
    // once in the past: that burst of stacked drums was itself a hitch.
    if (this.next < this.ctx.currentTime) {
      const step = this.stepLen();
      const missed = Math.ceil((this.ctx.currentTime - this.next) / step);
      this.step += missed;
      this.next += missed * step;
    }
    // Most of a second scheduled ahead: a busy stretch of frames (a big battle, pictures decoding) no longer runs the
    // music dry.
    while (this.next < this.ctx.currentTime + 0.8) {
      this.schedule(this.step, this.next);
      this.next += this.stepLen();
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
      // The final boss arrives: two siren calls, "biii-u, biii-u", over the first bar.
      if (this.final) { this.siren(at); this.siren(at + BAR / 2); }
    }
    // The song changes only where a phrase begins (or on the next bar, when picked by hand).
    // «By world» keeps the world's song for its final boss too: the tension layer goes on top of it.
    // «By world»: the world's song, and its final boss's own while it is out (with the tension layer on top).
    const bossSong = `boss-${this.finalId}` as BossSongId;
    // The last boss, Nocthrax, fights to Doomsday, the game's final-boss song.
    const byWorld = this.finalWanted && this.finalId === 'chimera' ? 'doom' : this.finalWanted && bossSong in V2S ? bossSong : WORLD_V2[this.world - 1] ?? 'w1v2';
    // In the menus «by world» plays what «automatic» does, the original; a song picked to play always plays there too.
    const menu = this.pick === 'worlds' && this.world === 0 && !this.preview;
    // Listening to «by world» in Customise's music list: a mix of every world's song (`scheduleMix`).
    const mixing = this.pick === 'worlds' && this.world === 0 && this.preview;
    const wanted = menu ? 'b2b' : mixing ? 'mix' : this.pick === 'auto' ? (this.finalWanted ? 'doom' : 'b2b') : this.pick === 'worlds' ? byWorld : this.pick;
    if (inBar === 0 && wanted !== this.songId && (bar % 4 === 0 || this.songNow)) { this.songId = wanted; this.songNow = false; }
    if (this.songId === 'mix') { this.scheduleMix(step, at); return; }
    const v2 = V2S[this.songId as V2Id];
    if (v2) { this.root = v2.root; this.scheduleV2(step, at, v2); return; }
    const song = SONGS[this.songId as SongId];
    this.root = song.root;
    if (this.songId === 'breaks') { this.scheduleGarage(step, at, song); return; }
    if (this.songId === 'doom') { this.scheduleDoom(step, at, song); return; }
    const setBar = bar % (song.set.length * 8);
    const block = song.set[Math.floor(setBar / 8)];
    const blockBar = setBar % 8;
    const second = setBar >= 32; // the second half uses the lifted progression
    const chord = (second ? song.chordsB : song.chords)[Math.floor(bar / 2) % 4];
    const bassRoot = (second ? song.rootsB : song.roots)[Math.floor(bar / 2) % 4];
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
      if (inBar % 2 === 1) this.sub(at, semi(this.root * 2, bassRoot), STEP * 0.9);
      if (inBar === 0) this.sub(at, semi(this.root, bassRoot), STEP * 3);
    } else if (block === 'breakdown') {
      if (inBar === 0 && bar % 2 === 0) this.sub(at, semi(this.root, bassRoot), BAR * 1.6);
    } else {
      if (liquid && (inBar === 0 || inBar === 10)) this.sub(at, semi(this.root, bassRoot), inBar === 0 ? STEP * 8 : STEP * 5);
      // With a final boss out the growl also plays in the liquid blocks, so it carries the fight throughout.
      if (neuro || this.final) {
        const hits = [0, 3, 6, 10, 11, 14];
        const hit = hits.indexOf(inBar);
        // In a boss fight the growl keeps its sound and its rhythm (the same six hits, the same B2B set) but
        // plays another line over the chord: a two-bar call and answer for any boss, and for a final boss a
        // four-bar melody that sings over a wider range.
        const line = song.reese ? song.reese[bar % song.reese.length] : this.final ? FINAL_REESE[bar % 4] : BOSS_REESE[bar % 2];
        const note = song.reese || this.boss || this.final ? line[hit] : inBar === 14 ? 12 : inBar === 6 ? 3 : 0;
        if (hit >= 0) this.reese(at, semi(this.root, bassRoot + note), STEP * (inBar === 10 ? 1 : 2.5));
        // A final boss in its last stand: the growl doubles some of its hits, the same note a sixteenth later.
        if (this.rage && (inBar === 4 || inBar === 12 || inBar === 15)) {
          const prev = line[hits.indexOf(inBar === 15 ? 14 : inBar - 1)];
          this.reese(at, semi(this.root, bassRoot + prev), STEP * 0.9);
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
      if (block === 'trance') this.arp(at, semi(this.root * 8, chord[step % chord.length]), inBar % 4 === 0 ? 0.16 : 0.1);
    }
    if (block === 'breakdown' && blockBar >= 2) this.arp(at, semi(this.root * 8, chord[step % chord.length]), 0.07 + blockBar * 0.012);
    // A sparkle of plucks on top in the quieter half.
    if (block === 'liquid' && inBar % 4 === 2 && Math.random() < 0.6) this.pluck(at, semi(this.root * 8, chord[(step >> 2) % chord.length]), song.pluck);
  }

  /* The final boss's tension, added on the music's own grid (nothing underneath changes): a thin high pedal
     ticking every sixteenth, a semitone higher every four bars it plays (back to the start after three),
     like a clock speeding up; and a low tower bell on every chord change. */
  private tension(bar: number, inBar: number, at: number, chord: number[]) {
    const rise = Math.floor((bar - this.finalFrom) / 4) % 4;
    this.tick16(at, semi(this.root * 16, chord[0] + rise), inBar % 4 === 0 ? 0.05 : 0.028);
    if (inBar === 0 && bar % 2 === 0) this.bell(at, semi(this.root * 4, chord[0]));
  }

  /** One siren call: a held high note that drops at the end ("biii-u"), two detuned saws with a fast wobble. */
  private siren(at: number) {
    const hold = BAR * 0.32;
    const fall = BAR * 0.14;
    const g = this.ctx.createGain();
    this.env(g, at, 0.12, 0.02, hold + fall, 0.9, 0.05);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 9;
    const depth = this.ctx.createGain();
    depth.gain.value = 18;
    lfo.connect(depth);
    for (const detune of [-8, 8]) {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      o.detune.value = detune;
      o.frequency.setValueAtTime(1050, at);
      o.frequency.setValueAtTime(1050, at + hold);
      o.frequency.exponentialRampToValueAtTime(420, at + hold + fall);
      depth.connect(o.frequency);
      o.connect(lp);
      o.start(at);
      o.stop(at + hold + fall + 0.1);
    }
    lfo.start(at);
    lfo.stop(at + hold + fall + 0.1);
    lp.connect(g).connect(this.musicBus);
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
        o.frequency.value = semi(this.root * 4, n);
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
        o.frequency.value = semi(this.root * 4, n);
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
      o.frequency.value = semi(this.root * 4, n);
      o.connect(lp);
      o.start(at);
      o.stop(at + 0.25);
    }
    lp.connect(g).connect(this.musicBus);
  }

  private pluck(at: number, freq: number, wave: OscillatorType = 'triangle') {
    const o = this.ctx.createOscillator();
    o.type = wave;
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    this.env(g, at, 0.12, 0.003, 0.25);
    o.connect(g).connect(this.musicBus);
    o.start(at);
    o.stop(at + 0.3);
  }

  /* ------------------------------------------------- «Juicio final», UK garage */

  /** One swung sixteenth of the final boss's song: 2-step garage and funky breakbeat in D minor, organ stabs on the
      offbeats, a dubby sub bass, a bell lead, and the final boss's tension layer on top as in every song. */
  /** Horns: soft saws in a low chord, swelling in. */
  private epicHorns(at: number, freqs: number[], len: number, vol: number) {
    const g = this.ctx.createGain(), lp = this.filt('lowpass', 950, 0.8);
    for (const fr of freqs) for (const d of [-7, 7]) this.osc('sawtooth', fr, at, at + len + 0.4, d).connect(lp);
    this.env(g, at, vol, 0.14, len, 0.85, 0.3); lp.connect(g); this.out(g, 0.5);
  }
  /** Strings: a wide, slow-bowed chord. */
  private epicStrings(at: number, freqs: number[], len: number, vol: number) {
    const g = this.ctx.createGain(), lp = this.filt('lowpass', 2200, 0.7);
    for (const fr of freqs) for (const d of [-12, 0, 12]) this.osc('sawtooth', fr, at, at + len + 0.5, d).connect(lp);
    this.env(g, at, vol, 0.3, len, 0.9, 0.4); lp.connect(g); this.out(g, 0.6, this.padBus);
  }
  /** A cymbal crash opening the fanfare. */
  private epicCrash(at: number) {
    const n = this.noiseAt(at, 2), hp = this.filt('highpass', 5200, 0.6), g = this.ctx.createGain();
    this.env(g, at, 0.09, 0.004, 1.8); n.connect(hp).connect(g); this.out(g, 0.5);
  }

  private scheduleGarage(step: number, at: number, song: Song) {
    const bar = Math.floor(step / 16);
    const inBar = step % 16;
    const setBar = bar % (GARAGE_FORM.length * 8);
    const block = GARAGE_FORM[Math.floor(setBar / 8)];
    const blockBar = setBar % 8;
    const second = setBar >= 32;
    const chord = (second ? song.chordsB : song.chords)[Math.floor(bar / 2) % 4];
    const bassRoot = (second ? song.rootsB : song.roots)[Math.floor(bar / 2) % 4];
    if (this.final) this.tension(bar, inBar, at, chord);
    // The garage swing: every odd sixteenth comes a little late (the breakstep plays straight).
    const t = inBar % 2 && block !== 'breakstep' ? at + GSTEP * SWING : at;
    const last = blockBar === 7;
    const garage = block === 'garage' || block === 'drop';
    const breaks = block === 'breaks' || block === 'drop';
    if (inBar === 0 && blockBar === 0 && setBar !== 0) this.crash(at);
    if (block === 'intro' || block === 'break') {
      // No kick: shuffled hats and a rim, a riser into what comes next.
      if (inBar % 2 === 1) this.hat(t, 0.12, false);
      if (inBar === 4 || inBar === 12) this.hat(t, 0.3, true);
      if (blockBar === 6 && inBar === 0) this.riser(at, GBAR * 2);
      if (last && inBar >= 8 && inBar % 2 === 0) this.snare(at, 0.2 + (inBar - 8) * 0.07);
    }
    if (garage) {
      // 2-step: the kick on one and the "and" of three, skipping the downbeat of two and four; a clap on two and four.
      if (inBar === 0 || inBar === 10 || (blockBar % 2 === 1 && inBar === 7)) this.kick(t);
      // The big clap on two and four, over a snare (the backbeat everything hangs on, clean and loud).
      if (inBar === 4 || inBar === 12) { this.snare(at, 0.6); this.bigClap(at, 0.9); }
      // Swung sixteenth hats, the open one on every offbeat eighth.
      this.hat(t, inBar % 4 === 2 ? 0.3 : 0.11, inBar % 4 === 2);
    }
    if (block === 'breakstep') {
      // Breakstep: a straight, funky break with a hard snare and clap, eighth hats opening on the offbeats, ghost snares
      // rolling into the next bar, the Miami cowbell, and every kick an 808 that booms and slides under it.
      const two = bar % 2;
      if (STEP_KICK[two].includes(inBar)) { this.kick(at); this.boom808(at, semi(this.root, bassRoot + (inBar >= 8 && two ? 7 : 0)), GSTEP * (inBar === 0 ? 7 : 4)); }
      if (inBar === 4 || inBar === 12) { this.snare(at, 0.75); this.bigClap(at, 0.9); }
      if (inBar === 7 || (two && inBar === 15)) this.snare(at, 0.2);
      if (inBar % 2 === 0) this.hat(at, inBar % 4 === 2 ? 0.32 : 0.16, inBar % 4 === 2);
      if (blockBar >= 2 && STEP_BELL[two].includes(inBar)) this.cowbell(at, inBar === STEP_BELL[two][0] ? 0.16 : 0.11);
      // The DJ's scratch closing every four bars, back and forth on the last beat.
      if (blockBar % 4 === 3 && inBar === 12) this.scratch(at);
      if (last && inBar >= 12) this.snare(at, 0.35 + (inBar - 12) * 0.12);
      // Stabs on the offbeats in the second half of the block, the garage's chords over the breakstep.
      if (blockBar >= 4 && (inBar === 6 || inBar === 14)) this.stab(at, chord);
    }
    if (breaks) {
      // Choppy breaks: each bar another chop of the same break (`BREAK_CHOPS`), the kick and snare moved about, the big
      // clap on the snares, a few ghost snares, and only the block's last beat stuttered in thirty-seconds.
      const chop = BREAK_CHOPS[(bar * 3 + blockBar) % BREAK_CHOPS.length];
      if (!garage && chop.kick.includes(inBar)) this.kick(t);
      if (!garage && chop.snare.includes(inBar)) { this.snare(at, 0.75); this.bigClap(at, inBar === 4 || inBar === 12 ? 0.85 : 0.5); }
      if (bar % 2 === 0 && chop.ghost.includes(inBar)) this.snare(t, 0.18);
      if (!garage && inBar % 2 === 0) this.hat(t, inBar % 4 === 2 ? 0.26 : 0.14, false);
      if (last && inBar >= 12) { this.snare(at, 0.3 + (inBar - 12) * 0.1); this.snare(at + GSTEP / 2, 0.2 + (inBar - 12) * 0.08); }
    }
    // The electronic detail, kept sparse so the beat stays clean: an acid line in the drop's second half, a laser
    // falling into every block, and an 808 sub sliding down under each block's first beat.
    if (block === 'drop' && blockBar >= 4 && inBar % 2 === 0) {
      const n = BREAK_ACID[(bar % 2) * 8 + inBar / 2];
      if (typeof n === 'number') this.acid(t, semi(this.root * 2, bassRoot + n), GSTEP * 1.8, inBar % 8 === 0);
    }
    if (last && inBar === 8) this.bleep(at, 3200, 120, GSTEP * 8, 0.05, 'square');
    if (blockBar === 0 && inBar === 0 && block !== 'intro' && block !== 'break') this.slideSub(at, semi(this.root, bassRoot + 12), semi(this.root, bassRoot), GSTEP * 6);
    // The bass: a dubby sub line in the garage blocks, the Spanish breaks mid bass in the breakbeat ones and the drop,
    // the 808 in the breakstep, one long sub in the break.
    if (block === 'break') {
      if (inBar === 0 && bar % 2 === 0) this.sub(at, semi(this.root, bassRoot), GBAR * 1.7);
    } else if (block === 'breakstep') {
      // The 808 under the kicks is the bass here; the UK wah line rides above it, and the reese in the second half.
      const n = GARAGE_BASS[(bar % 2) * 16 + inBar];
      if (typeof n === 'number') {
        this.ukBass(t, semi(this.root * 2, bassRoot + n), GSTEP * 1.5, blockBar >= 4);
        // The second half grows: the reese growl joins the 808.
        if (blockBar >= 4) { let len = 1; while (GARAGE_BASS[((bar % 2) * 16 + inBar + len) % 32] === null) len += 1; this.reese(t, semi(this.root, bassRoot + n), GSTEP * len * 1.1); }
      }
    } else if (breaks) {
      // The breaks and the drop: a clean sub on the beat, and the distorted mid bass leading with its own riff.
      if (inBar === 0 || inBar === 8) this.sub(at, semi(this.root, bassRoot), GSTEP * 3);
      const n = COLOMBO_RIFF[(bar % 2) * 16 + inBar];
      if (typeof n === 'number') {
        let len = 1;
        while (COLOMBO_RIFF[((bar % 2) * 16 + inBar + len) % 32] === null) len += 1;
        this.colomboBass(t, semi(this.root * 2, bassRoot + n), GSTEP * len, block === 'drop');
      }
    } else if (block === 'garage') {
      const n = GARAGE_BASS[(bar % 2) * 16 + inBar];
      if (typeof n === 'number') {
        let len = 1;
        while (GARAGE_BASS[((bar % 2) * 16 + inBar + len) % 32] === null) len += 1;
        this.sub(t, semi(this.root, bassRoot + n), GSTEP * len);
        // The UK bass on top: the same line an octave up, a driven square-and-saw wah that opens on each note,
        // so the bass is heard on a phone too, not only felt.
        this.ukBass(t, semi(this.root * 2, bassRoot + n), GSTEP * len, false);
      }
    }
    // Organ stabs on the offbeats (the garage sound), a pad on every chord change in the quieter blocks.
    if (garage && (inBar === 3 || inBar === 6 || (inBar === 11 && bar % 2 === 1))) this.stab(t, chord);
    if (inBar === 0 && bar % 2 === 0 && (block === 'intro' || block === 'break' || block === 'breaks')) this.pad(at, chord, GBAR * 2);
    // The lead: a bell melody over four bars, in the garage drop and the break.
    if ((block === 'drop' || block === 'break' || (block === 'garage' && blockBar >= 4)) && inBar % 2 === 0) {
      const line = GARAGE_LEAD[bar % 4];
      const n = line[inBar / 2];
      if (typeof n === 'number') {
        let len = 1;
        while (line[inBar / 2 + len] === null) len += 1;
        this.synthLead(t, semi(this.root * 4, n), GSTEP * 2 * len, block === 'drop');
      }
    }
    // A sparkle of plucks over the intro.
    if (block === 'intro' && inBar % 4 === 2 && Math.random() < 0.5) this.synthLead(t, semi(this.root * 4, chord[(step >> 2) % chord.length] + 12), GSTEP * 1.2, false);
  }

  /** The big clap (after The Prodigy's backbeat): the clap, a tight bright snap on top and a short body under it, loud and
      dry, so two and four stand out of everything else. */
  private bigClap(at: number, vol: number) {
    this.clap(at, vol * 1.5);
    const snap = this.noiseAt(at, 0.06), hp = this.filt('highpass', 2600, 0.7), gs = this.ctx.createGain();
    this.env(gs, at, vol * 0.9, 0.001, 0.04);
    snap.connect(hp).connect(gs); this.out(gs, 0.05);
    const body = this.noiseAt(at, 0.12), bp = this.filt('bandpass', 1900, 0.9), gb = this.ctx.createGain();
    this.env(gb, at, vol * 0.8, 0.002, 0.09);
    body.connect(bp).connect(gb); this.out(gb, 0.1);
  }
  /** A clap: three quick bursts of filtered noise a few milliseconds apart and a short tail, into the reverb a little. */
  private clap(at: number, vol: number) {
    for (const [d, v, len] of [[0, 1, 0.02], [0.011, 0.85, 0.02], [0.022, 0.75, 0.13]] as [number, number, number][]) {
      const n = this.noiseAt(at + d, len + 0.05);
      const bp = this.filt('bandpass', 1150, 1.3);
      const g = this.ctx.createGain();
      this.env(g, at + d, vol * v, 0.001, len);
      n.connect(bp).connect(g);
      this.out(g, 0.18);
    }
  }
  /** «Break to back»'s mid bass: a square and a saw through a resonant low-pass that opens on each note and
      wobbles shut, driven a little; louder in the drop. */
  private ukBass(at: number, freq: number, length: number, big: boolean) {
    const end = at + length + 0.05;
    const lp = this.filt('lowpass', 400, 8);
    lp.frequency.setValueAtTime(big ? 1800 : 1300, at);
    lp.frequency.exponentialRampToValueAtTime(260, at + Math.max(0.08, length * 0.9));
    const g = this.ctx.createGain();
    this.env(g, at, big ? 0.17 : 0.13, 0.004, length * 0.85, 0.6, 0.03);
    this.osc('square', freq, at, end).connect(lp);
    this.osc('sawtooth', freq, at, end, 9).connect(lp);
    lp.connect(this.shaper(2.5)).connect(g);
    this.out(g, 0.06);
  }
  /** The Spanish breaks mid bass (after Colombo): three detuned saws and a square an octave down, driven hard, through
      a resonant low-pass that opens, shuts and opens again within the note so it talks, with its middle pushed up so a
      phone speaker carries it. */
  private colomboBass(at: number, freq: number, length: number, big: boolean) {
    const end = at + length + 0.05, d = Math.max(0.09, length);
    const lp = this.filt('lowpass', 500, 9);
    lp.frequency.setValueAtTime(260, at);
    lp.frequency.exponentialRampToValueAtTime(big ? 2600 : 2000, at + d * 0.25);
    lp.frequency.exponentialRampToValueAtTime(420, at + d * 0.55);
    lp.frequency.exponentialRampToValueAtTime(big ? 1700 : 1300, at + d * 0.85);
    const mid = this.ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 750; mid.Q.value = 0.9; mid.gain.value = 9;
    const g = this.ctx.createGain();
    this.env(g, at, big ? 0.24 : 0.2, 0.004, length * 0.9, 0.75, 0.03);
    for (const det of [-14, 0, 14]) this.osc('sawtooth', freq, at, end, det).connect(lp);
    this.osc('square', freq / 2, at, end).connect(lp);
    lp.connect(this.shaper(6)).connect(mid).connect(g);
    this.out(g, 0.05);
  }
  /** An acid line: a saw through a resonant low-pass whose envelope snaps open, harder on the accents. */
  private acid(at: number, freq: number, length: number, accent: boolean) {
    const o = this.osc('sawtooth', freq, at, at + length + 0.05);
    const lp = this.filt('lowpass', 300, accent ? 14 : 9);
    lp.frequency.setValueAtTime(accent ? 2600 : 1500, at);
    lp.frequency.exponentialRampToValueAtTime(260, at + length);
    const g = this.ctx.createGain();
    this.env(g, at, accent ? 0.16 : 0.11, 0.003, length * 0.8, 0.3, 0.03);
    o.connect(lp).connect(g);
    this.out(g, 0.12);
  }
  /** «Break to back»'s lead: three detuned saws and a square an octave down, through a resonant low-pass that snaps
      open on each note and closes, a quick vibrato on long notes, and a dotted-eighth echo; louder and brighter in the drop. */
  private synthLead(at: number, freq: number, length: number, big: boolean) {
    const end = at + length + 0.08;
    const lp = this.filt('lowpass', 800, 7);
    lp.frequency.setValueAtTime(big ? 5200 : 3800, at);
    lp.frequency.exponentialRampToValueAtTime(big ? 1400 : 1000, at + Math.min(length, 0.25));
    const g = this.ctx.createGain();
    this.env(g, at, big ? 0.13 : 0.1, 0.004, length * 0.85, 0.55, 0.06);
    const vib = this.osc('sine', 6, at, end);
    const depth = this.ctx.createGain();
    depth.gain.setValueAtTime(0, at);
    depth.gain.linearRampToValueAtTime(length > 0.2 ? 14 : 0, at + length);
    vib.connect(depth);
    for (const d of [-14, 0, 14]) {
      const o = this.osc('sawtooth', freq, at, end, d);
      depth.connect(o.detune);
      o.connect(lp);
    }
    const sq = this.osc('square', freq / 2, at, end);
    const sqg = this.ctx.createGain();
    sqg.gain.value = 0.35;
    sq.connect(sqg).connect(lp);
    lp.connect(g);
    this.out(g, 0.2);
    // The echo: the same note a dotted eighth later, softer and darker.
    const echo = this.ctx.createDelay(1);
    echo.delayTime.value = GSTEP * 3;
    const eg = this.ctx.createGain();
    eg.gain.value = 0.35;
    const elp = this.filt('lowpass', 2200, 0.7);
    g.connect(echo).connect(elp).connect(eg);
    this.out(eg);
  }
  /** A bleep on the music: a quick pitch sweep. */
  private bleep(at: number, from: number, to: number, length: number, vol: number, type: OscillatorType = 'square') {
    const o = this.osc(type, from, at, at + length + 0.03);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, to), at + length);
    const g = this.ctx.createGain();
    this.env(g, at, vol, 0.002, length);
    o.connect(g);
    this.out(g, 0.25);
  }
  /** A Miami 808: a long sine boom that starts a little sharp, slides onto its note and rings out, driven so a phone
      speaker hears it as well as feels it. */
  private boom808(at: number, freq: number, length: number) {
    const o = this.osc('sine', freq * 1.5, at, at + length + 0.1);
    o.frequency.exponentialRampToValueAtTime(freq, at + 0.06);
    o.frequency.exponentialRampToValueAtTime(freq * 0.94, at + length);
    const g = this.ctx.createGain();
    this.env(g, at, 0.95, 0.004, length * 0.5, 0.55, length * 0.5);
    o.connect(this.shaper(4)).connect(g);
    this.out(g);
  }
  /** The 808 cowbell: two detuned squares (540 and 800 Hz) through a band-pass, short and bright. */
  private cowbell(at: number, vol: number) {
    const g = this.ctx.createGain(), bp = this.filt('bandpass', 1100, 2.2);
    for (const f of [540, 800]) this.osc('square', f, at, at + 0.3).connect(bp);
    this.env(g, at, vol, 0.001, 0.22);
    bp.connect(g);
    this.out(g, 0.12);
  }
  /** A DJ's scratch: a burst of noise through a narrow band-pass swept up, down and up again, like a record pushed back
      and forth under the needle. */
  private scratch(at: number) {
    const len = GSTEP * 4, n = this.noiseAt(at, len + 0.05), bp = this.filt('bandpass', 600, 6), g = this.ctx.createGain();
    bp.frequency.setValueAtTime(500, at);
    bp.frequency.exponentialRampToValueAtTime(2600, at + len * 0.3);
    bp.frequency.exponentialRampToValueAtTime(400, at + len * 0.6);
    bp.frequency.exponentialRampToValueAtTime(2200, at + len);
    this.env(g, at, 0.3, 0.005, len, 0.6, 0.03);
    n.connect(bp).connect(g);
    this.out(g, 0.1);
  }
  /** An 808 sub sliding down to its note. */
  private slideSub(at: number, from: number, to: number, length: number) {
    const o = this.osc('sine', from, at, at + length + 0.05);
    o.frequency.exponentialRampToValueAtTime(to, at + 0.12);
    const g = this.ctx.createGain();
    this.env(g, at, 0.5, 0.005, length, 0.2, 0.05);
    o.connect(this.shaper(2)).connect(g);
    this.out(g);
  }

  /* --------------------------------------------- «Juicio final», drum and bass */

  /** One sixteenth of the final boss's song, drum and bass unlike the rest: E Phrygian, a cathedral organ and choir,
      a hoover bass diving into its notes and sliding between them, rolling drums with a ride and timpani, and the
      final boss's tension layer on top as in every song. */
  private scheduleDoom(step: number, at: number, song: Song) {
    const bar = Math.floor(step / 16);
    const inBar = step % 16;
    const setBar = bar % (DOOM_FORM.length * 8);
    const block = DOOM_FORM[Math.floor(setBar / 8)];
    const blockBar = setBar % 8;
    const second = setBar >= 32;
    const chord = (second ? song.chordsB : song.chords)[Math.floor(bar / 2) % 4];
    const bassRoot = (second ? song.rootsB : song.roots)[Math.floor(bar / 2) % 4];
    if (this.final) this.tension(bar, inBar, at, chord);
    const drums = block === 'roll' || block === 'drop' || block === 'peak';
    const last = blockBar === 7;
    if (inBar === 0 && blockBar === 0 && setBar !== 0) this.crash(at);
    if (drums) {
      // Rolling drums: the kick on one, the «and» of two and three, the snare on two and four, a ride on every eighth.
      if (inBar === 0 || inBar === 7 || inBar === 10 || (block === 'peak' && inBar === 13)) this.kick(at);
      if (inBar === 4 || inBar === 12) this.snare(at, 1);
      if (inBar === 14 || (block !== 'roll' && inBar === 9)) this.snare(at, 0.22);
      if (inBar % 2 === 0) this.ride(at, inBar % 4 === 0 ? 0.08 : 0.12);
      if (inBar % 2 === 1) this.hat(at, 0.09, false);
      // A snare roll building into each block's end, in thirty-seconds in the peak.
      if (last && inBar >= 8) { this.snare(at, 0.25 + (inBar - 8) * 0.08); if (block === 'peak') this.snare(at + STEP / 2, 0.2 + (inBar - 8) * 0.06); }
    } else {
      // The intro and the break: timpani on the chord's root and a riser at the end.
      if (inBar === 0 || (inBar === 12 && bar % 2 === 1)) this.timpani(at, semi(this.root * 2, bassRoot), inBar === 0 ? 0.5 : 0.3);
      if (last && inBar >= 8 && inBar % 2 === 0) this.timpani(at, semi(this.root * 2, bassRoot), 0.2 + (inBar - 8) * 0.05);
      if (blockBar === 6 && inBar === 0) this.riser(at, BAR * 2);
    }
    // The hoover: long notes that dive into place and slide to the next, two bars a line (`DOOM_HOOVER`).
    if (block === 'drop' || block === 'peak') {
      const n = DOOM_HOOVER[(bar % 2) * 4 + Math.floor(inBar / 4)];
      if (inBar % 4 === 0 && typeof n === 'number') this.hoover(at, semi(this.root, bassRoot + n), STEP * 3.6, block === 'peak');
      if (inBar === 0 || inBar === 8) this.sub(at, semi(this.root, bassRoot), STEP * 7);
    } else if (block === 'roll') {
      if (inBar === 0 || inBar === 10) this.sub(at, semi(this.root, bassRoot), inBar === 0 ? STEP * 9 : STEP * 5);
    } else if (inBar === 0 && bar % 2 === 0) this.sub(at, semi(this.root, bassRoot), BAR * 1.8);
    // The cathedral: a choir on every chord change, and the organ's slow melody (`DOOM_ORGAN`) over the roll, the break and the peak.
    if (inBar === 0 && bar % 2 === 0) this.choir(at, chord, BAR * 2);
    if (block === 'roll' || block === 'break' || block === 'peak' || block === 'intro') {
      const line = DOOM_ORGAN[bar % 4];
      const n = line[inBar / 4];
      if (inBar % 4 === 0 && typeof n === 'number') {
        let len = 1;
        while (line[inBar / 4 + len] === null) len += 1;
        this.organ(at, semi(this.root * 8, n), STEP * 4 * len - 0.02, block === 'intro' ? 0.05 : 0.08);
      }
    }
    // A bell on the downbeat of every other bar in the peak.
    if (block === 'peak' && inBar === 0 && bar % 2 === 0) this.bell(at, semi(this.root * 8, chord[0]));
    // Little glass crystals glinting high over the chord, soft, now and then (never in the intro's first bars).
    if ((block !== 'intro' || blockBar >= 4) && inBar % 4 === 2 && Math.random() < (block === 'break' ? 0.7 : 0.45))
      this.glass(at, semi(this.root * 32, chord[(step >> 2) % chord.length]), block === 'break' ? 0.05 : 0.035);
  }
  /** A glass crystal: a short inharmonic bell high up, into the reverb. */
  private glass(at: number, freq: number, vol: number) {
    const g = this.ctx.createGain();
    for (const [ratio, v] of [[1, 1], [2.76, 0.35], [5.4, 0.12]]) {
      const pg = this.ctx.createGain();
      pg.gain.value = v;
      this.osc('sine', freq * ratio, at, at + 0.9).connect(pg).connect(g);
    }
    this.env(g, at, vol, 0.002, 0.45);
    this.out(g, 0.6, this.padBus);
  }
  /** A ride cymbal: bright noise through a high band, ringing a little. */
  private ride(at: number, vol: number) {
    const n = this.noiseAt(at, 0.4);
    const bp = this.filt('bandpass', 7200, 1.4);
    const g = this.ctx.createGain();
    this.env(g, at, vol, 0.001, 0.32);
    n.connect(bp).connect(g);
    this.out(g, 0.1);
  }
  /** A timpani: a low sine with a drop in pitch and a thump of noise. */
  private timpani(at: number, freq: number, vol: number) {
    const o = this.osc('sine', freq * 1.5, at, at + 1.2);
    o.frequency.exponentialRampToValueAtTime(freq, at + 0.08);
    const g = this.ctx.createGain();
    this.env(g, at, vol, 0.004, 0.9);
    o.connect(g);
    this.out(g, 0.35);
    const n = this.noiseAt(at, 0.12);
    const lp = this.filt('lowpass', 900, 1);
    const ng = this.ctx.createGain();
    this.env(ng, at, vol * 0.4, 0.001, 0.08);
    n.connect(lp).connect(ng);
    this.out(ng, 0.2);
  }
  /** The hoover: five wide-detuned saws diving into the note from above, through a low-pass that opens with it. */
  private hoover(at: number, freq: number, length: number, big: boolean) {
    const g = this.ctx.createGain();
    const lp = this.filt('lowpass', 500, 3);
    lp.frequency.setValueAtTime(600, at);
    lp.frequency.linearRampToValueAtTime(big ? 3200 : 2200, at + length * 0.4);
    lp.frequency.linearRampToValueAtTime(700, at + length);
    this.env(g, at, big ? 0.5 : 0.42, 0.02, length * 0.6, 0.55, length * 0.3);
    // The «wua wua»: the filter swings open and shut twice a note (louder and deeper at the owner's wish).
    const wah = this.osc('sine', 2 / length, at, at + length + 0.1);
    const wd = this.ctx.createGain();
    wd.gain.value = big ? 1400 : 1100;
    wah.connect(wd).connect(lp.frequency);
    for (const d of [-38, -18, 0, 18, 38]) {
      const o = this.osc('sawtooth', freq * 2 * 1.06, at, at + length + 0.1, d);
      o.frequency.exponentialRampToValueAtTime(freq * 2, at + 0.09);
      o.connect(lp);
    }
    const sub = this.osc('square', freq, at, at + length + 0.1);
    sub.frequency.setValueAtTime(freq * 1.06, at);
    sub.frequency.exponentialRampToValueAtTime(freq, at + 0.09);
    sub.connect(lp);
    lp.connect(this.shaper(3)).connect(g);
    this.out(g, 0.15);
  }
  /** A cathedral organ: octaves of sine and square with a slow tremolo, into the reverb. */
  private organ(at: number, freq: number, length: number, vol: number) {
    const g = this.ctx.createGain();
    this.env(g, at, vol, 0.03, length, 0.7, 0.25);
    const trem = this.osc('sine', 5.5, at, at + length + 0.3);
    const depth = this.ctx.createGain();
    depth.gain.value = vol * 0.25;
    trem.connect(depth).connect(g.gain);
    for (const [mult, type] of [[1, 'square'], [2, 'sine'], [0.5, 'sine'], [3, 'sine']] as [number, OscillatorType][]) {
      const o = this.osc(type, freq * mult, at, at + length + 0.3);
      const lvl = this.ctx.createGain();
      lvl.gain.value = type === 'square' ? 0.25 : 0.5;
      o.connect(lvl).connect(g);
    }
    this.out(g, 0.5);
  }

  /* ------------------------------------------------------- v2 world songs */

  /** A world song's second version, one sixteenth: its section, drums, bass, lead, pads and its world's own sounds. */
  /** «By world» previewed in Customise: every world's song in turn, four bars each (its drums, bass, lead and key),
      with another world's own sounds laid over it, changing every two bars, so all their sounds come by mixed. */
  private scheduleMix(step: number, at: number) {
    const bar = Math.floor(step / 16);
    const turn = Math.floor(bar / 4) % WORLD_V2.length;
    const v = V2S[WORLD_V2[turn]];
    let other = (turn + 1 + (Math.floor(bar / 2) % (WORLD_V2.length - 1))) % WORLD_V2.length;
    if (other === turn) other = (other + 1) % WORLD_V2.length;
    this.root = v.root;
    this.scheduleV2(step, at, v, [V2S[WORLD_V2[other]]]);
  }

  private scheduleV2(step: number, at: number, v: V2, more: V2[] = []) {
    const bar = Math.floor(step / 16);
    const inBar = step % 16;
    const setBar = bar % (v.form.length * 8);
    const sec = v.form[Math.floor(setBar / 8)];
    const blockBar = setBar % 8;
    const second = setBar >= 32;
    const chord = (second ? v.chordsB : v.chords)[Math.floor(bar / 2) % 4];
    const bassRoot = (second ? v.rootsB : v.roots)[Math.floor(bar / 2) % 4];
    if (this.final) this.tension(bar, inBar, at, chord);
    const calm = sec === 'intro' || sec === 'break';
    if (inBar === 0 && blockBar === 0 && setBar !== 0) this.crash(at);

    // Drums, in the section's groove; the calm sections keep only a soft hat, a riser and a snare roll into the next one.
    const groove = v.grooves[sec];
    if (groove) this.drumsV2(at, groove, bar, inBar, v.kit, sec === 'roll' && blockBar === 7);
    else {
      if (blockBar >= 4 && inBar % 4 === 2) this.hat(at, 0.16, false);
      if (blockBar === 6 && inBar === 0) this.riser(at, BAR * 2);
      if (blockBar === 7 && inBar >= 8) this.snareV2(at, 0.25 + (inBar - 8) * 0.09, v.kit);
    }

    // Bass: the line in the drop, the roll and the peak; the calm sections hold one long sub per chord.
    if (calm) {
      if (inBar === 0 && bar % 2 === 0) this.sub(at, semi(this.root, bassRoot), BAR * 1.8);
    } else {
      const i = (bar % 2) * 16 + inBar;
      const n = v.line[i];
      if (typeof n === 'number') {
        let len = 1;
        while (len < 16 && v.line[(i + len) % 32] === null) len++;
        this.bassV2(at, semi(this.root, bassRoot + n), STEP * len, v.bass);
      }
    }

    // Pads on each chord change (the choir in the cold, haunted and cosmic worlds), stabs in the drops.
    if (inBar === 0 && bar % 2 === 0 && (calm || sec === 'peak')) {
      if (v.theme === 3 || v.theme === 7 || v.theme === 8) this.choir(at, chord, BAR * 2);
      else this.pad(at, chord, BAR * 2);
    }
    if (sec === 'drop' && (inBar === 6 || inBar === 14) && bar % 2 === 1 && v.theme !== 4 && v.theme !== 5) this.stab(at, chord);

    // The lead sings its four bars in the break and the peak.
    if ((sec === 'break' || sec === 'peak') && inBar % 2 === 0) {
      const line = v.melody[bar % 4];
      const n = line[inBar / 2];
      if (typeof n === 'number') {
        let len = 1;
        while (len < 4 && inBar / 2 + len < 8 && line[inBar / 2 + len] === null) len++;
        this.leadV2(at, semi(this.root * v.leadOct, n), STEP * 2 * len, v.lead);
      }
    }

    this.colour(v, { at, step, bar, inBar, blockBar, sec, chord, calm });
    for (const o of more) this.colour(o, { at, step, bar, inBar, blockBar, sec, chord, calm });
  }

  private drumsV2(at: number, groove: Groove, bar: number, inBar: number, kit: Kit, roll: boolean) {
    const bars = GROOVES[groove];
    let pat = bars[bar % bars.length];
    let s = inBar;
    // The jungle groove chops its break into beats and plays them back in another order every bar.
    if (groove === 'jungle') {
      pat = bars[(bar >> 1) % 2];
      s = CHOPS[bar % 4][inBar >> 2] * 4 + (inBar % 4);
    }
    if (pat.k[s] === 'x') this.kickV2(at, kit.drive);
    if (pat.s[s] === 'x') this.snareV2(at, 1, kit);
    if (pat.g[s] === 'x') this.snareV2(at, 0.3, kit);
    if (pat.h[s] === 'x') this.hat(at, groove === 'techstep' ? (s % 2 ? 0.14 : 0.3) : s % 4 === 2 ? 0.45 : 0.28, s % 8 === 6);
    // The roll's last bar, and every fourth bar of the jungle: the snare rolls in.
    if ((roll || (groove === 'jungle' && bar % 4 === 3)) && inBar >= 12) {
      this.snareV2(at, 0.4 + (inBar - 12) * 0.15, kit);
      if (groove === 'jungle') this.snareV2(at + STEP / 2, 0.3 + (inBar - 12) * 0.1, kit);
    }
  }

  private kickV2(at: number, drive: number) {
    const duck = this.padBus.gain;
    duck.cancelScheduledValues(at);
    duck.setValueAtTime(1, at);
    duck.linearRampToValueAtTime(0.35, at + 0.01);
    duck.linearRampToValueAtTime(1, at + 0.22);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(drive ? 190 : 150, at);
    o.frequency.exponentialRampToValueAtTime(40, at + 0.12);
    this.env(g, at, 1, 0.002, 0.24);
    if (drive) {
      const ws = this.shaper(10 + drive * 30);
      const post = this.ctx.createGain();
      post.gain.value = 0.7;
      o.connect(g).connect(ws).connect(post).connect(this.musicBus);
    } else o.connect(g).connect(this.musicBus);
    o.start(at);
    o.stop(at + 0.32);
  }

  private snareV2(at: number, vol: number, kit: Kit) {
    const n = this.noiseAt(at, kit.decay + 0.08);
    const bp = this.filt('bandpass', kit.snare, 0.9);
    const g = this.ctx.createGain();
    this.env(g, at, 0.75 * vol, 0.001, kit.decay);
    n.connect(bp).connect(g);
    this.out(g, kit.wet);
    const o = this.ctx.createOscillator();
    const og = this.ctx.createGain();
    o.frequency.setValueAtTime(kit.snare / 8, at);
    o.frequency.exponentialRampToValueAtTime(kit.snare / 12, at + 0.05);
    this.env(og, at, 0.4 * vol, 0.001, 0.07);
    o.connect(og).connect(this.musicBus);
    o.start(at);
    o.stop(at + 0.1);
  }

  private bassV2(at: number, freq: number, length: number, voice: BassVoice) {
    const from = this.lastBass || freq;
    this.lastBass = freq;
    if (voice === 'reese') { this.reese(at, freq, length); return; }
    if (voice === 'sub') { this.sub(at, freq, length); return; }
    const g = this.ctx.createGain();
    const end = at + length + 0.1;
    if (voice === 'chip') {
      // A chiptune bass: a square, lightly filtered, cut short.
      const o = this.osc('square', freq * 2, at, end);
      const lp = this.filt('lowpass', 1100, 1);
      this.env(g, at, 0.3, 0.003, length * 0.6, 0.5, length * 0.3);
      this.sub(at, freq, length);
      o.connect(lp).connect(g).connect(this.musicBus);
    } else if (voice === 'dist') {
      // A driven saw, its filter snapping open and shut, with a clean sub underneath.
      const o = this.osc('sawtooth', freq, at, end);
      const ws = this.shaper(45);
      const lp = this.filt('lowpass', 300, 4);
      lp.frequency.setValueAtTime(300, at);
      lp.frequency.linearRampToValueAtTime(1500 + this.intensity * 800, at + 0.04);
      lp.frequency.exponentialRampToValueAtTime(260, at + length);
      this.env(g, at, 0.3, 0.005, length * 0.5, 0.6, length * 0.4);
      o.connect(ws).connect(lp).connect(g).connect(this.musicBus);
      this.sub(at, freq / 2, length);
    } else if (voice === 'slide') {
      // A dub sub that slides from the note before, with a soft octave on top.
      const o = this.osc('sine', from, at, end);
      o.frequency.setValueAtTime(from, at);
      o.frequency.exponentialRampToValueAtTime(freq, at + 0.07);
      const o2 = this.osc('triangle', from * 2, at, end);
      o2.frequency.setValueAtTime(from * 2, at);
      o2.frequency.exponentialRampToValueAtTime(freq * 2, at + 0.07);
      const g2 = this.ctx.createGain();
      g2.gain.value = 0.18;
      this.env(g, at, 0.85, 0.01, length * 0.4, 0.75, length * 0.5);
      o.connect(g);
      o2.connect(g2).connect(g);
      g.connect(this.musicBus);
    } else if (voice === 'fm') {
      // Metal: a sine whose pitch is shaken by another at an unharmonic ratio, the shaking dying away.
      const car = this.osc('sine', freq * 2, at, end);
      const mod = this.osc('sine', freq * 2 * 1.41, at, end);
      const depth = this.ctx.createGain();
      depth.gain.setValueAtTime(freq * 9, at);
      depth.gain.exponentialRampToValueAtTime(freq * 0.5, at + length);
      mod.connect(depth).connect(car.frequency);
      const lp = this.filt('lowpass', 2400, 1);
      this.env(g, at, 0.38, 0.003, length * 0.5, 0.5, length * 0.3);
      car.connect(lp).connect(g).connect(this.musicBus);
      this.sub(at, freq / 2, length);
    } else if (voice === 'squelch') {
      // Mud: a saw through a low-pass that closes on each note, with a sub under it. It was sharper (resonance 13,
      // snapping from 2600 to 140 Hz in 0.22 s), a short frog-like sweep on every note that the owner found too much.
      const o = this.osc('sawtooth', freq, at, end);
      const lp = this.filt('lowpass', 1500, 4);
      lp.frequency.setValueAtTime(1500 + this.intensity * 500, at);
      lp.frequency.exponentialRampToValueAtTime(320, at + Math.min(0.35, length));
      this.env(g, at, 0.42, 0.004, length * 0.6, 0.5, length * 0.3);
      o.connect(lp).connect(g).connect(this.musicBus);
      this.sub(at, freq / 2, length);
    } else {
      // Wobble: two saws through a low-pass that an eighth-note LFO swings open and shut.
      const lp = this.filt('lowpass', 700, 7);
      const lfo = this.osc('sine', (BPM / 60) * 2, at, end);
      const depth = this.ctx.createGain();
      depth.gain.value = 600 + this.intensity * 400;
      lfo.connect(depth).connect(lp.frequency);
      for (const detune of [-14, 14]) {
        const o = this.osc('sawtooth', freq, at, end);
        o.detune.value = detune;
        o.connect(lp);
      }
      this.env(g, at, 0.42, 0.01, length * 0.5, 0.7, length * 0.4);
      lp.connect(g).connect(this.musicBus);
      this.sub(at, freq / 2, length);
    }
  }
  private lastBass = 0;

  private leadV2(at: number, freq: number, length: number, voice: LeadVoice) {
    const g = this.ctx.createGain();
    const end = at + length + 1.2;
    if (voice === 'chip') {
      // A Game Boy lead: a square with a quick vibrato coming in late.
      const o = this.osc('square', freq, at, end);
      const vib = this.osc('sine', 6, at, end);
      const vd = this.ctx.createGain();
      vd.gain.setValueAtTime(0, at);
      vd.gain.linearRampToValueAtTime(freq * 0.012, at + length);
      vib.connect(vd).connect(o.frequency);
      this.env(g, at, 0.09, 0.003, length * 0.8, 0.6, 0.05);
      o.connect(g).connect(this.padBus);
    } else if (voice === 'fire') {
      // A burning lead: a saw through a hard drive and a band that rises with the note.
      const o = this.osc('sawtooth', freq, at, end);
      const ws = this.shaper(25);
      const bp = this.filt('bandpass', 1200, 1.5);
      bp.frequency.setValueAtTime(900, at);
      bp.frequency.linearRampToValueAtTime(2600, at + length);
      this.env(g, at, 0.1, 0.01, length * 0.8, 0.6, 0.08);
      o.connect(ws).connect(bp).connect(g);
      this.out(g, 0.2, this.padBus);
    } else if (voice === 'horn') {
      // A Viking war horn: three low saws opening slowly, ringing out into the cold.
      const lp = this.filt('lowpass', 300, 2);
      lp.frequency.setValueAtTime(300, at);
      lp.frequency.linearRampToValueAtTime(1800, at + Math.min(0.4, length));
      lp.frequency.linearRampToValueAtTime(700, at + length);
      for (const detune of [-10, 0, 10]) this.osc('sawtooth', freq, at, end, detune).connect(lp);
      this.env(g, at, 0.16, 0.14, length, 0.7, 0.3);
      lp.connect(g);
      this.out(g, 0.6, this.padBus);
    } else if (voice === 'marimba') {
      // Wood: a sine with its bright fourth partial, both dying fast.
      this.osc('sine', freq, at, end).connect(g);
      const p = this.ctx.createGain();
      p.gain.value = 0.25;
      this.osc('sine', freq * 4, at, end).connect(p).connect(g);
      this.env(g, at, 0.2, 0.002, 0.35);
      this.out(g, 0.15, this.padBus);
    } else if (voice === 'brass') {
      // A brass section: saws whose filter blares open and settles.
      const lp = this.filt('lowpass', 500, 1.5);
      lp.frequency.setValueAtTime(500, at);
      lp.frequency.linearRampToValueAtTime(3200, at + 0.06);
      lp.frequency.linearRampToValueAtTime(1300, at + length);
      for (const detune of [-8, 8]) {
        this.osc('sawtooth', freq, at, end, detune).connect(lp);
        this.osc('sawtooth', freq * 2, at, end, detune).connect(lp);
      }
      this.env(g, at, 0.08, 0.04, length, 0.75, 0.15);
      lp.connect(g);
      this.out(g, 0.45, this.padBus);
    } else if (voice === 'robot') {
      // A robot singing: a square through a narrow band that sweeps like a vowel.
      const o = this.osc('square', freq, at, end);
      const bp = this.filt('bandpass', 700, 6);
      bp.frequency.setValueAtTime(600, at);
      bp.frequency.exponentialRampToValueAtTime(2200, at + length * 0.6);
      bp.frequency.exponentialRampToValueAtTime(800, at + length);
      this.env(g, at, 0.3, 0.005, length * 0.8, 0.5, 0.04);
      o.connect(bp).connect(g).connect(this.padBus);
    } else if (voice === 'musicbox') {
      // A broken music box: bright tines a little out of tune, ringing on.
      const off = (Math.random() - 0.5) * 30;
      for (const [ratio, vol] of [[1, 1], [3, 0.3], [5.4, 0.12]]) {
        const pg = this.ctx.createGain();
        pg.gain.value = vol;
        this.osc('sine', freq * ratio, at, end, off).connect(pg).connect(g);
      }
      this.env(g, at, 0.12, 0.002, 0.9);
      this.out(g, 0.55, this.padBus);
    } else if (voice === 'pungi') {
      // A snake charmer's pungi: a nasal reed (a square and a saw through a narrow band) with a wide vibrato.
      const bp = this.filt('bandpass', freq * 2.2, 3.5);
      const vib = this.osc('sine', 6.5, at, end);
      const vd = this.ctx.createGain();
      vd.gain.value = freq * 0.025;
      for (const type of ['square', 'sawtooth'] as const) {
        const o = this.osc(type, freq, at, end);
        vib.connect(vd).connect(o.frequency);
        o.connect(bp);
      }
      this.env(g, at, 0.13, 0.03, length * 0.85, 0.75, 0.06);
      bp.connect(g);
      this.out(g, 0.3, this.padBus);
    } else {
      // Crystal: a glassy bell, inharmonic and short.
      for (const [ratio, vol] of [[1, 1], [2.4, 0.4], [6.8, 0.15]]) {
        const pg = this.ctx.createGain();
        pg.gain.value = vol;
        this.osc('sine', freq * ratio, at, end).connect(pg).connect(g);
      }
      this.env(g, at, 0.08, 0.002, 0.5);
      this.out(g, 0.5, this.padBus);
    }
  }

  /** Each world's own sounds, laid on the grid. */
  private colour(v: V2, c: { at: number; step: number; bar: number; inBar: number; blockBar: number; sec: Sec; chord: number[]; calm: boolean }) {
    const { at, step, bar, inBar, blockBar, sec, chord, calm } = c;
    const r = Math.random();
    const loud = sec === 'drop' || sec === 'peak';
    switch (v.theme) {
      case 1: // The Backlog: someone typing, mail dings, a modem, a chip arpeggio, an error beep.
        // Typing in bursts, like a person: three or four keys in a row on some beats, then a pause (it was a key on
        // more than half the sixteenths, a stream of clicks over the drumless intro).
        if (inBar % 4 === 0 && r < (calm ? 0.55 : 0.4)) {
          const keys = 3 + (bar + inBar) % 2;
          for (let k = 0; k < keys; k++) this.typing(at + k * STEP * 0.5 + Math.random() * STEP * 0.15, calm ? 0.2 : 0.22);
        }
        if (inBar === 0 && bar % 4 === 0) this.ding(at, semi(this.root * 32, chord[2]));
        if (loud && blockBar === 7 && inBar === 8) this.modem(at);
        if (sec === 'roll' && blockBar === 7 && inBar === 12) { this.beep(at, 880); this.beep(at + STEP, 440); }
        if (sec === 'break' || sec === 'peak') this.arp(at, semi(this.root * 16, chord[step % 4]), 0.05);
        break;
      case 2: // Hotfix Inferno: the fire crackles, flames sweep, the alarm goes off, toms fill.
        if (r < (calm ? 0.5 : 0.25)) this.crackle(at + Math.random() * STEP);
        if (loud && blockBar % 4 === 0 && inBar === 0) this.whoosh(at, BAR);
        if (sec === 'intro' && blockBar === 7 && (inBar === 0 || inBar === 8)) this.alarm(at);
        if (sec === 'roll' && bar % 2 === 1 && inBar >= 12) this.tom(at, 180 - (inBar - 12) * 30, 0.1);
        if (sec === 'peak' && (inBar === 3 || inBar === 11)) this.tom(at, 90, 0.1);
        break;
      case 3: // Code Freeze: the wind, ice tinkling, a celesta, war drums, the ice cracking.
        if (inBar === 0 && bar % 2 === 0) this.wind(at, BAR * 2, calm ? 0.09 : 0.05);
        if ((calm || sec === 'peak') && r < 0.18) this.tinkle(at, semi(this.root * 32, chord[Math.floor(Math.random() * 4)] + 12));
        if (calm && inBar % 2 === 0) this.celesta(at, semi(this.root * 16, chord[(step >> 1) % 4]));
        if ((sec === 'roll' || sec === 'peak') && (inBar === 0 || inBar === 6 || inBar === 8)) this.tom(at, inBar === 8 ? 70 : 55, 0.5);
        if (inBar === 0 && blockBar === 0 && bar > 0) this.crack(at);
        break;
      case 4: // Legacy Jungle: birds, crickets, reggae skanks, log drums.
        if (calm && ((inBar === 2 && bar % 2 === 0) || (inBar === 11 && bar % 3 === 0))) this.bird(at);
        if (inBar === 0 && (calm || bar % 2 === 0)) this.cricket(at);
        if (loud && (inBar === 4 || inBar === 12)) this.skank(at, chord);
        if ((sec === 'roll' || sec === 'peak') && [0, 3, 6, 8, 11, 14].includes(inBar)) this.logdrum(at, semi(this.root * 4, chord[inBar % 3]));
        break;
      case 5: // The Arena: taikos, brass stabs, the crowd, swords, a horn call to open.
        if (!calm && bar % 2 === 0 && (inBar === 0 || inBar === 3 || inBar === 8)) this.taiko(at);
        if (sec === 'intro' && blockBar >= 4 && inBar % 4 === 0) this.taiko(at);
        if (loud && (inBar === 6 || inBar === 14) && bar % 2 === 1) this.leadV2(at, semi(this.root * 4, chord[0] + 12), STEP * 1.5, 'brass');
        if (loud && blockBar === 0 && inBar === 0) this.crowd(at, BAR * 2, 0.16);
        if (sec === 'intro' && inBar === 0 && bar % 2 === 0) this.crowd(at, BAR * 2, 0.05);
        if (loud && bar % 4 === 3 && inBar === 12) this.clang(at, 420);
        if (sec === 'intro' && (blockBar === 0 || blockBar === 4) && inBar === 0) this.leadV2(at, this.root * 4, BAR * 1.5, 'brass');
        break;
      case 6: // The Forge: anvils, clanking machines, steam, servos.
        if (!calm && (inBar === 2 || inBar === 10)) this.clang(at, 1100);
        if (sec === 'intro' && (inBar === 0 || inBar === 8)) this.clang(at, 900);
        if (loud && r < 0.45) this.clank(at);
        if ((blockBar === 3 || blockBar === 7) && inBar === 12) this.steam(at, BAR / 4);
        if (sec === 'roll' && bar % 2 === 1 && inBar === 8) this.servo(at);
        break;
      case 7: // Haunted Servers: whispers, creaking doors, a heartbeat, a bell, a theremin.
        if (calm && inBar === 0 && bar % 2 === 0) this.whisper(at, BAR * 1.5);
        if (inBar === 8 && bar % 4 === 1) this.creak(at);
        if ((sec === 'break' || (sec === 'intro' && blockBar >= 4)) && (inBar === 0 || inBar === 8)) this.heartbeat(at, 0.7);
        if (loud && blockBar === 0 && inBar === 0) this.bell(at, semi(this.root * 4, chord[0]));
        if (sec === 'peak' && inBar === 0 && bar % 2 === 0) this.theremin(at, semi(this.root * 16, chord[1]), BAR * 1.9);
        break;
      case 9: // Big Ball of Mud: frogs croaking in turn, mud bubbling, drips, crickets, a snake's rattling hiss.
        // Two frogs answering each other on the beat, a low croak then a higher one an eighth later, at the end of
        // every fourth bar (every eighth in the loud parts), the owner's wish: before they came often and off the grid.
        const frogs = bar % (calm ? 4 : 8) === (calm ? 3 : 7);
        if (frogs && inBar === 12) this.croak(at, 1);
        if (frogs && inBar === 14) this.croak(at, 1.335);
        // The mud's bubbles, which the owner likes: a little more often and louder than they first were.
        if (r < (calm ? 0.08 : 0.03)) this.bloop(at + Math.random() * STEP, true);
        if (calm && inBar % 4 === 2 && Math.random() < 0.35) this.drip(at);
        if (calm && inBar === 8 && bar % 2 === 0) this.cricket(at);
        if (sec === 'peak' && inBar === 14 && bar % 2 === 1) this.rattle(at);
        break;
      case 10: // Siege Cartoon: an orchestra over the drums: strings and horns on each chord, timpani, a cymbal on each
        // section, the choir at the peaks.
        if (inBar === 0 && bar % 2 === 0) {
          this.epicStrings(at, chord.map((n) => semi(this.root, n + 36)), BAR * 2, calm ? 0.014 : 0.01);
          this.epicHorns(at, chord.slice(0, 3).map((n) => semi(this.root, n + 24)), BAR * 2, calm ? 0.02 : 0.026);
          if (sec === 'peak') this.choir(at, chord, BAR * 2);
        }
        if (!calm && (inBar === 0 || inBar === 8)) this.timpani(at, semi(this.root, chord[0] + 24), inBar ? 0.22 : 0.32);
        if (calm && inBar === 0 && bar % 4 === 0) this.timpani(at, semi(this.root, chord[0] + 24), 0.2);
        if (loud && inBar === 0 && blockBar === 0) this.epicCrash(at);
        break;
      default: // The Core: its heart, magma, the dragon, laser zaps, crystal bells.
        if (calm && (inBar === 0 || inBar === 8)) this.heartbeat(at, 1);
        if (!calm && inBar === 0) this.heartbeat(at, 0.5);
        if (calm && inBar === 0 && bar % 2 === 0) this.magma(at, BAR * 2);
        if (loud && blockBar === 0 && inBar === 0) this.dragon(at);
        if (sec === 'peak' && (inBar === 7 || inBar === 15) && r < 0.6) this.zap(at);
        if ((sec === 'break' || sec === 'peak') && inBar % 2 === 1) this.leadV2(at, semi(this.root * 32, chord[(step >> 1) % 4]), STEP, 'crystal');
    }
  }

  /* The v2 songs' building blocks. */
  private osc(type: OscillatorType, freq: number, at: number, end: number, detune = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    o.start(at);
    o.stop(end);
    return o;
  }
  private filt(type: BiquadFilterType, freq: number, q: number) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }
  private noiseAt(at: number, length: number) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise;
    n.loop = true;
    n.start(at, Math.random() * 1.5);
    n.stop(at + length);
    return n;
  }
  /** Out to the music, with some of it sent to the reverb. */
  private out(node: AudioNode, wet = 0, bus: AudioNode = this.musicBus) {
    node.connect(bus);
    if (wet > 0) {
      const s = this.ctx.createGain();
      s.gain.value = wet;
      node.connect(s).connect(this.verbIn);
    }
  }
  /** A soft-clipping drive, its curves kept by amount. */
  private curves = new Map<number, Float32Array<ArrayBuffer>>();
  private shaper(amount: number) {
    const ws = this.ctx.createWaveShaper();
    let curve = this.curves.get(amount);
    if (!curve) {
      const n = 1024;
      curve = new Float32Array(new ArrayBuffer(n * 4));
      for (let i = 0; i < n; i++) curve[i] = Math.tanh(((i / (n - 1)) * 2 - 1) * (amount / 10));
      this.curves.set(amount, curve);
    }
    ws.curve = curve;
    return ws;
  }
  /** A short burst of filtered noise: the shared shape of clicks, crackles and hisses. */
  private burst(at: number, length: number, type: BiquadFilterType, freq: number, q: number, vol: number, wet = 0, attack = 0.001) {
    const n = this.noiseAt(at, length + 0.05);
    const f = this.filt(type, freq, q);
    const g = this.ctx.createGain();
    this.env(g, at, vol, attack, length);
    n.connect(f).connect(g);
    this.out(g, wet);
    return f;
  }
  private typing(at: number, vol = 0.18) { this.burst(at, 0.012, 'bandpass', 2500 + Math.random() * 3000, 3, vol); }
  private ding(at: number, freq: number) {
    const g = this.ctx.createGain();
    this.env(g, at, 0.07, 0.002, 0.7);
    this.osc('sine', freq, at, at + 0.8).connect(g);
    this.osc('sine', freq * 1.5, at + 0.09, at + 0.8).connect(g);
    this.out(g, 0.3);
  }
  private modem(at: number) {
    const o = this.osc('square', 1200, at, at + BAR / 2);
    for (let i = 0; i < 8; i++) o.frequency.setValueAtTime(600 + Math.random() * 2400, at + i * (BAR / 16));
    const g = this.ctx.createGain();
    this.env(g, at, 0.035, 0.005, BAR / 2 - 0.01);
    o.connect(g).connect(this.musicBus);
  }
  private beep(at: number, freq: number) {
    const g = this.ctx.createGain();
    this.env(g, at, 0.06, 0.002, STEP * 0.8);
    this.osc('square', freq, at, at + STEP).connect(g).connect(this.musicBus);
  }
  private crackle(at: number) { this.burst(at, 0.004 + Math.random() * 0.01, 'highpass', 1500 + Math.random() * 3000, 0.7, 0.1 + Math.random() * 0.25); }
  private whoosh(at: number, length: number) {
    const f = this.burst(at, length, 'bandpass', 300, 1.2, 0.2, 0.2, length * 0.4);
    f.frequency.setValueAtTime(250, at);
    f.frequency.exponentialRampToValueAtTime(3500, at + length * 0.6);
    f.frequency.exponentialRampToValueAtTime(600, at + length);
  }
  private alarm(at: number) {
    const o = this.osc('square', 880, at, at + BAR / 2);
    for (let i = 0; i < 4; i++) o.frequency.setValueAtTime(i % 2 ? 660 : 880, at + i * (BAR / 8));
    const lp = this.filt('lowpass', 2500, 1);
    const g = this.ctx.createGain();
    this.env(g, at, 0.05, 0.01, BAR / 2 - 0.02, 0.8);
    o.connect(lp).connect(g).connect(this.musicBus);
  }
  private tom(at: number, freq: number, wet: number) {
    const o = this.osc('sine', freq * 1.6, at, at + 0.5);
    o.frequency.setValueAtTime(freq * 1.6, at);
    o.frequency.exponentialRampToValueAtTime(freq, at + 0.08);
    const g = this.ctx.createGain();
    this.env(g, at, 0.55, 0.002, 0.35);
    o.connect(g);
    this.out(g, wet);
  }
  private wind(at: number, length: number, vol: number) {
    const f = this.burst(at, length, 'bandpass', 700, 5, vol, 0.3, length * 0.4);
    f.frequency.setValueAtTime(500 + Math.random() * 300, at);
    f.frequency.linearRampToValueAtTime(1200 + Math.random() * 800, at + length * 0.5);
    f.frequency.linearRampToValueAtTime(600, at + length);
  }
  private tinkle(at: number, freq: number) {
    const g = this.ctx.createGain();
    this.env(g, at, 0.035, 0.001, 0.3);
    this.osc('sine', freq, at, at + 0.4).connect(g);
    this.out(g, 0.7);
  }
  private celesta(at: number, freq: number) {
    const g = this.ctx.createGain();
    this.env(g, at, 0.05, 0.002, 0.5);
    this.osc('sine', freq, at, at + 0.6).connect(g);
    const p = this.ctx.createGain();
    p.gain.value = 0.3;
    this.osc('sine', freq * 4, at, at + 0.6).connect(p).connect(g);
    this.out(g, 0.6, this.padBus);
  }
  private crack(at: number) {
    this.burst(at, 0.09, 'highpass', 2500, 0.8, 0.35, 0.6);
    const o = this.osc('sine', 1800, at, at + 0.2);
    o.frequency.exponentialRampToValueAtTime(200, at + 0.15);
    const g = this.ctx.createGain();
    this.env(g, at, 0.1, 0.001, 0.15);
    o.connect(g);
    this.out(g, 0.5);
  }
  /** A choir: saws per note through two vowel bands ("ah"), slow to swell. */
  private choir(at: number, chord: number[], length: number) {
    const g = this.ctx.createGain();
    const f1 = this.filt('bandpass', 750, 4);
    const f2 = this.filt('bandpass', 1150, 5);
    for (const n of chord) for (const detune of [-9, 9]) {
      const o = this.osc('sawtooth', semi(this.root * 4, n), at, at + length + 0.6, detune);
      o.connect(f1);
      o.connect(f2);
    }
    f1.connect(g);
    f2.connect(g);
    this.env(g, at, 0.22, 0.7, length * 0.4, 0.7, length * 0.4);
    this.out(g, 0.6, this.padBus);
  }
  private bird(at: number) {
    for (let i = 0; i < 3; i++) {
      const t = at + i * 0.07;
      const base = 2200 + Math.random() * 1500;
      const o = this.osc('sine', base, t, t + 0.07);
      o.frequency.setValueAtTime(base, t);
      o.frequency.exponentialRampToValueAtTime(base * 1.6, t + 0.03);
      o.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.06);
      const g = this.ctx.createGain();
      this.env(g, t, 0.05, 0.003, 0.05);
      o.connect(g);
      this.out(g, 0.4);
    }
  }
  private cricket(at: number) {
    for (let i = 0; i < 6; i++) {
      const t = at + i * 0.022;
      const g = this.ctx.createGain();
      this.env(g, t, 0.025, 0.001, 0.012);
      this.osc('square', 4300, t, t + 0.02).connect(g).connect(this.musicBus);
    }
  }
  /** The reggae skank: a short, bright chord on the offbeat. */
  private skank(at: number, chord: number[]) {
    const g = this.ctx.createGain();
    const hp = this.filt('highpass', 600, 0.7);
    for (const n of chord) this.osc('triangle', semi(this.root * 8, n), at, at + 0.15).connect(hp);
    this.env(g, at, 0.1, 0.002, 0.08);
    hp.connect(g);
    this.out(g, 0.25, this.padBus);
  }
  private logdrum(at: number, freq: number) {
    const o = this.osc('sine', freq * 1.5, at, at + 0.3);
    o.frequency.setValueAtTime(freq * 1.5, at);
    o.frequency.exponentialRampToValueAtTime(freq, at + 0.03);
    const g = this.ctx.createGain();
    this.env(g, at, 0.22, 0.002, 0.2);
    o.connect(g);
    this.out(g, 0.15);
  }
  private taiko(at: number) {
    this.tom(at, 52, 0.6);
    this.burst(at, 0.12, 'lowpass', 500, 0.7, 0.4, 0.5);
  }
  private crowd(at: number, length: number, vol: number) {
    for (const f of [900, 2300]) this.burst(at, length, 'bandpass', f, 0.6, vol, 0.4, length * 0.35);
  }
  /** Metal struck: square partials at unharmonic ratios, for swords and anvils. */
  private clang(at: number, freq: number) {
    const g = this.ctx.createGain();
    const hp = this.filt('highpass', freq * 0.8, 0.7);
    for (const ratio of [1, 1.48, 2.17, 2.9, 3.6]) this.osc('square', freq * ratio, at, at + 0.6).connect(hp);
    this.env(g, at, 0.05, 0.001, 0.4);
    hp.connect(g);
    this.out(g, 0.4);
  }
  private clank(at: number) { this.burst(at, 0.02, 'bandpass', 3000 + Math.random() * 2000, 8, 0.2); }
  private steam(at: number, length: number) { this.burst(at, length, 'highpass', 4000, 0.7, 0.16, 0.2, 0.01); }
  private servo(at: number) {
    const o = this.osc('sawtooth', 200, at, at + 0.3);
    o.frequency.linearRampToValueAtTime(800, at + 0.12);
    o.frequency.linearRampToValueAtTime(500, at + 0.25);
    const bp = this.filt('bandpass', 1200, 2);
    const g = this.ctx.createGain();
    this.env(g, at, 0.05, 0.01, 0.24);
    o.connect(bp).connect(g).connect(this.musicBus);
  }
  private whisper(at: number, length: number) {
    const f = this.burst(at, length, 'bandpass', 2600, 4, 0.06, 0.8, length * 0.3);
    for (let i = 0; i < 6; i++) f.frequency.setValueAtTime(1800 + Math.random() * 2400, at + (i * length) / 6);
  }
  private creak(at: number) {
    const o = this.osc('sawtooth', 70, at, at + 0.7);
    for (let i = 0; i < 6; i++) o.frequency.setValueAtTime(55 + Math.random() * 60, at + i * 0.1);
    const bp = this.filt('bandpass', 700, 9);
    const g = this.ctx.createGain();
    this.env(g, at, 0.12, 0.05, 0.55);
    o.connect(bp).connect(g);
    this.out(g, 0.5);
  }
  private heartbeat(at: number, vol: number) {
    for (const [dt, v] of [[0, 1], [0.17, 0.7]]) {
      const t = at + dt;
      const o = this.osc('sine', 75, t, t + 0.2);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      const g = this.ctx.createGain();
      this.env(g, t, 0.6 * v * vol, 0.004, 0.15);
      o.connect(g).connect(this.musicBus);
    }
  }
  private theremin(at: number, freq: number, length: number) {
    const o = this.osc('sine', freq, at, at + length + 0.3);
    o.frequency.setValueAtTime(freq * 0.94, at);
    o.frequency.exponentialRampToValueAtTime(freq, at + 0.25);
    const vib = this.osc('sine', 5.5, at, at + length + 0.3);
    const vd = this.ctx.createGain();
    vd.gain.value = freq * 0.012;
    vib.connect(vd).connect(o.frequency);
    const g = this.ctx.createGain();
    this.env(g, at, 0.07, 0.3, length * 0.5, 0.7, length * 0.3);
    o.connect(g);
    this.out(g, 0.6, this.padBus);
  }
  private magma(at: number, length: number) { this.burst(at, length, 'lowpass', 160, 1, 0.5, 0.2, length * 0.3); }
  /** The dragon: a falling, driven growl with a rush of breath. */
  private dragon(at: number) {
    const o = this.osc('sawtooth', 110, at, at + 1.6);
    o.frequency.setValueAtTime(110, at);
    o.frequency.exponentialRampToValueAtTime(38, at + 1.4);
    const ws = this.shaper(40);
    const lp = this.filt('lowpass', 500, 3);
    lp.frequency.setValueAtTime(400, at);
    lp.frequency.linearRampToValueAtTime(1600, at + 0.3);
    lp.frequency.exponentialRampToValueAtTime(200, at + 1.4);
    const g = this.ctx.createGain();
    this.env(g, at, 0.22, 0.08, 1.1, 0.4, 0.3);
    o.connect(ws).connect(lp).connect(g);
    this.out(g, 0.4);
    this.burst(at, 1.2, 'bandpass', 900, 0.6, 0.18, 0.4, 0.15);
  }
  /** A frog: two quick, throaty pulses dropping in pitch ("rib-bit"). */
  private croak(at: number, pitch: number) {
    for (const [dt, f] of [[0, 190]]) {
      const t = at + dt;
      const o = this.osc('square', f * pitch, t, t + 0.09);
      o.frequency.exponentialRampToValueAtTime(f * pitch * 0.85, t + 0.08);
      const am = this.osc('square', 45, t, t + 0.09);
      const amg = this.ctx.createGain();
      amg.gain.value = 0.5;
      const bp = this.filt('bandpass', 700, 3);
      const g = this.ctx.createGain();
      this.env(g, t, 0.12, 0.004, 0.07);
      am.connect(amg).connect(g.gain);
      o.connect(bp).connect(g);
      this.out(g, 0.2);
    }
  }
  /** A bubble of mud popping: a sine rising fast. */
  private bloop(at: number, loud = false) {
    const f = 140 + Math.random() * 120;
    const o = this.osc('sine', f, at, at + 0.12);
    o.frequency.exponentialRampToValueAtTime(f * 3.2, at + 0.08);
    const g = this.ctx.createGain();
    this.env(g, at, loud ? 0.2 : 0.1, 0.003, 0.09);
    o.connect(g);
    this.out(g, 0.18);
  }
  /** A drop falling into the swamp. */
  private drip(at: number) {
    const o = this.osc('sine', 1700, at, at + 0.2);
    o.frequency.exponentialRampToValueAtTime(520, at + 0.06);
    const g = this.ctx.createGain();
    this.env(g, at, 0.06, 0.002, 0.12);
    o.connect(g);
    this.out(g, 0.7);
  }
  /** A snake's rattle and hiss: high noise shaken by a fast tremolo. */
  private rattle(at: number) {
    this.burst(at, 0.5, 'highpass', 5000, 0.8, 0.12, 0.3, 0.02);
    for (let i = 0; i < 8; i++) this.burst(at + i * 0.05, 0.02, 'bandpass', 6500, 2, 0.1);
  }
  private zap(at: number) {
    const o = this.osc('sine', 2400, at, at + 0.2);
    o.frequency.exponentialRampToValueAtTime(90, at + 0.16);
    const g = this.ctx.createGain();
    this.env(g, at, 0.08, 0.001, 0.16);
    o.connect(g);
    this.out(g, 0.4);
  }

  /* ------------------------------------------------------------------ sfx */

  /* ------------------------------------------------------------ siege */

  /** One of Siege's troop sounds (`SiegeSound`): an attack by its weapon or a death by its body, synthesised to
      sound like the real thing (a blade's swish and ring, a gun's crack and body, a fall's thump), at a volume and a
      left-right place for where it happens on screen. Each is a little different every time. */
  siege(kind: SiegeSound, vol = 1, pan = 0) {
    if (!this.ready || this.volumes.sfx === 0) return;
    const ctx = this.ctx, at = ctx.currentTime, v = vol * 0.9, r = (k = 0.08) => 1 + (Math.random() - 0.5) * k * 2;
    const out = ctx.createGain(); out.gain.value = v;
    const panner = ctx.createStereoPanner(); panner.pan.value = Math.max(-1, Math.min(1, pan));
    out.connect(panner).connect(this.sfxBus);
    const tone = (t: number, type: OscillatorType, f0: number, f1: number, len: number, peak: number, attack = 0.003, filter?: [BiquadFilterType, number, number?]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, at + t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + t + len);
      const g = ctx.createGain(); this.env(g, at + t, peak, attack, len);
      let node: AudioNode = o;
      if (filter) { const f = ctx.createBiquadFilter(); f.type = filter[0]; f.frequency.value = filter[1]; if (filter[2]) f.Q.value = filter[2]; node = o.connect(f); }
      node.connect(g).connect(out); o.start(at + t); o.stop(at + t + len + 0.05);
    };
    const noise = (t: number, len: number, peak: number, type: BiquadFilterType, f0: number, f1 = f0, q = 1, attack = 0.002) => {
      const n = ctx.createBufferSource(); n.buffer = this.noise;
      const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, at + t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + t + len);
      const g = ctx.createGain(); this.env(g, at + t, peak, attack, len);
      n.connect(f).connect(g).connect(out); n.start(at + t, Math.random()); n.stop(at + t + len + 0.05);
    };
    const ring = (t: number, freqs: number[], peak: number, len = 0.22) => freqs.forEach((f) => tone(t, 'sine', f * r(0.03), f * 0.98, len, peak / freqs.length * 1.6, 0.001));
    const crack = (t: number, peak: number, body: number, tail = 0.12) => {
      noise(t, 0.035, peak, 'highpass', 2400); noise(t, tail, peak * 0.8, 'lowpass', 1100 * r(), 260, 0.7);
      tone(t, 'triangle', 170 * r(), 50, 0.09, body);
    };
    const boom = (t: number, peak: number, len = 0.55) => {
      tone(t, 'sine', 95 * r(), 32, len * 0.7, peak); noise(t, len, peak * 0.9, 'lowpass', 1400, 120, 0.6, 0.004);
      noise(t, 0.08, peak * 0.5, 'bandpass', 2600, 1200, 0.8);
    };
    const fall = (t: number, peak = 0.32) => { tone(t, 'sine', 120 * r(), 48, 0.12, peak); noise(t, 0.1, peak * 0.7, 'lowpass', 420, 140, 0.7); };
    // A cry: a voiced sawtooth through a vowel-like band, falling in pitch (male-ish, lower for brutes).
    const cry = (t: number, f0: number, f1: number, len: number, peak: number, vowel = 750) => {
      tone(t, 'sawtooth', f0 * r(), f1, len, peak, 0.012, ['bandpass', vowel * r(0.1), 4]);
      tone(t, 'sawtooth', f0 * r(), f1, len, peak * 0.6, 0.012, ['bandpass', vowel * 1.6, 5]);
    };
    // Cartoon touches: a springy boing, a quick pop, a squeaky voice, a puff of smoke.
    const boing = (t: number, f: number, peak: number, len = 0.22) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f, at + t); o.frequency.exponentialRampToValueAtTime(f * 2.2, at + t + len);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 26; const lg = ctx.createGain(); lg.gain.value = f * 0.12; lfo.connect(lg).connect(o.frequency);
      const g = ctx.createGain(); this.env(g, at + t, peak, 0.004, len); o.connect(g).connect(out);
      o.start(at + t); lfo.start(at + t); o.stop(at + t + len + 0.05); lfo.stop(at + t + len + 0.05);
    };
    const pop = (t: number, peak: number) => { tone(t, 'sine', 520 * r(), 1500, 0.05, peak); noise(t, 0.04, peak * 0.6, 'bandpass', 2500, 1800, 1.5); };
    const squeak = (t: number, f0: number, f1: number, len: number, peak: number, vowel = 1300) => {
      tone(t, 'square', f0 * r(), f1, len, peak, 0.008, ['bandpass', vowel * r(0.1), 5]);
      tone(t, 'sawtooth', f0 * 2 * r(), f1 * 2, len, peak * 0.4, 0.008, ['bandpass', vowel * 1.8, 6]);
    };
    // A pained «ouch!» that trails off into a groan: a sharp "ow" (the mouth gliding from an open "a" to a closed "u", the
    // pitch snapping up) that sags into a dying "uuugh", the voice wavering and breathy. Two slightly detuned voices and a
    // breath of noise through the same mouth keep it from sounding like a machine. `f0` is the voice, `len` the whole cry,
    // `grit` how rough and shaky it is.
    const ouch = (t: number, f0: number, len: number, peak: number, grit: number) => {
      const t0 = at + t, end = t0 + len, hit = len * 0.22;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + 0.018);
      g.gain.exponentialRampToValueAtTime(peak * 0.55, t0 + hit); g.gain.linearRampToValueAtTime(peak * 0.35, t0 + len * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, end + 0.05);
      const mouth: AudioNode[] = [];
      for (const [fa, fu, q, k] of [[850, 380, 5, 1.5], [1350, 760, 7, 0.9], [2600, 2300, 8, 0.3]] as const) {
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
        bp.frequency.setValueAtTime(fa, t0); bp.frequency.exponentialRampToValueAtTime(fu, t0 + hit * 1.4);
        const kg = ctx.createGain(); kg.gain.value = k * 2.2; bp.connect(kg).connect(g); mouth.push(bp);
      }
      const pitch = (o: OscillatorNode, detune: number) => {
        o.frequency.setValueAtTime(f0 * 1.22 * detune, t0); o.frequency.exponentialRampToValueAtTime(f0 * 1.05 * detune, t0 + hit);
        o.frequency.exponentialRampToValueAtTime(f0 * 0.62 * detune, end);
      };
      // A slow, uneven waver (two sines), not a buzz.
      const wob = ctx.createGain(); wob.gain.value = f0 * (0.02 + grit);
      for (const [rate, k] of [[5.3, 1], [8.7, 0.5]] as const) { const l = ctx.createOscillator(); l.frequency.value = rate * r(); const lk = ctx.createGain(); lk.gain.value = k; l.connect(lk).connect(wob); l.start(t0); l.stop(end + 0.1); }
      for (const d of [1, 1.012]) {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; pitch(o, d * r());
        wob.connect(o.frequency);
        const ok = ctx.createGain(); ok.gain.value = 0.5; o.connect(ok); mouth.forEach(m => ok.connect(m));
        o.start(t0); o.stop(end + 0.1);
      }
      // Breath through the same mouth, stronger as the voice fades.
      const n = ctx.createBufferSource(); n.buffer = this.noise; const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.08 + grit * 2, t0); ng.gain.linearRampToValueAtTime(0.22 + grit * 3, end);
      n.connect(ng); mouth.forEach(m => ng.connect(m)); n.start(t0); n.stop(end + 0.1);
      g.connect(out);
    };
    const puff = (t: number, peak = 0.3) => noise(t, 0.3, peak, 'lowpass', 900 * r(), 180, 0.6, 0.02);
    const slide = (t: number, f0: number, f1: number, len: number, peak: number) => tone(t, 'sine', f0 * r(), f1, len, peak, 0.02);
    switch (kind) {
      // Attacks.
      case 'blade': noise(0, 0.09, 0.32, 'bandpass', 700 * r(), 4500, 1.4, 0.01); return ring(0.07, [2600, 3900, 5400], 0.08, 0.16);
      case 'blunt': tone(0, 'square', 560 * r(), 300, 0.06, 0.16, 0.002, ['bandpass', 900, 3]); tone(0, 'sine', 170 * r(), 70, 0.12, 0.5); return boing(0.03, 260, 0.06, 0.14);
      case 'pierce': tone(0, 'sine', 1500 * r(), 320, 0.07, 0.22); return noise(0.04, 0.05, 0.2, 'lowpass', 900);
      case 'claw': for (let i = 0; i < 3; i++) tone(i * 0.03, 'sine', 1400 * r(), 3200, 0.04, 0.16); return noise(0, 0.1, 0.18, 'bandpass', 3000, 2000, 2);
      case 'bite': tone(0, 'square', 300 * r(), 160, 0.05, 0.14, 0.002, ['lowpass', 1200]); tone(0.07, 'square', 280 * r(), 140, 0.05, 0.16, 0.002, ['lowpass', 1200]); return tone(0, 'sawtooth', 95 * r(), 70, 0.24, 0.1, 0.02, ['lowpass', 500]);
      case 'throw': slide(0, 320, 950, 0.16, 0.14); return noise(0, 0.18, 0.3, 'bandpass', 800 * r(), 2300, 1.2, 0.03);
      case 'bow': { const d = r(0.05); tone(0, 'triangle', 440 * d, 400 * d, 0.22, 0.22, 0.002); tone(0, 'triangle', 446 * d, 404 * d, 0.22, 0.12, 0.002); return noise(0.01, 0.12, 0.12, 'bandpass', 2800 * d, 2400, 1.2); }
      case 'gun': slide(0, 1600, 420, 0.08, 0.12); return crack(0, 0.42, 0.26);
      case 'rifle': slide(0, 1300, 300, 0.1, 0.1); return crack(0, 0.55, 0.36, 0.2);
      case 'uzi': for (let i = 0; i < 4; i++) { crack(i * 0.055, 0.28, 0.14, 0.06); slide(i * 0.055, 1800, 700, 0.04, 0.06); } return;
      case 'sniper': crack(0, 0.7, 0.45, 0.32); slide(0, 2400, 500, 0.18, 0.1); return noise(0.05, 0.6, 0.12, 'lowpass', 700, 200, 0.5, 0.05);
      case 'gatling': for (let i = 0; i < 6; i++) crack(i * 0.045, 0.24, 0.11, 0.05); return;
      case 'rocket': tone(0, 'sine', 140, 60, 0.1, 0.3); slide(0.02, 300, 1100, 0.4, 0.06); return noise(0.02, 0.5, 0.24, 'bandpass', 500 * r(), 2600, 0.9, 0.03);
      case 'ray': tone(0, 'sine', 2200 * r(), 300, 0.24, 0.16); tone(0.02, 'sine', 1800, 250, 0.22, 0.08); return tone(0, 'square', 950, 160, 0.26, 0.04, 0.003, ['lowpass', 2500]);
      case 'flame': noise(0, 0.5, 0.48, 'lowpass', 1300 * r(), 700, 0.7, 0.05); return noise(0, 0.45, 0.16, 'bandpass', 420, 300, 1.2, 0.04);
      case 'thunder': noise(0, 0.05, 0.55, 'highpass', 4200); noise(0.01, 0.12, 0.4, 'bandpass', 1800, 900, 0.8); return noise(0.04, 0.95, 0.42, 'lowpass', 300 * r(), 90, 0.6, 0.03);
      case 'wind': noise(0, 0.85, 0.7, 'bandpass', 380 * r(), 950, 1.8, 0.18); return slide(0.05, 500, 900, 0.7, 0.04);
      case 'meteor': slide(0, 2000, 300, 0.5, 0.09); noise(0, 0.5, 0.12, 'bandpass', 1500, 500, 2, 0.1); return boom(0.48, 0.6, 0.7);
      case 'breath': noise(0, 0.6, 0.32, 'lowpass', 1500 * r(), 600, 0.7, 0.04); return tone(0, 'sawtooth', 110 * r(), 70, 0.5, 0.12, 0.05, ['lowpass', 420]);
      case 'drill': tone(0, 'sawtooth', 72 * r(), 80, 0.32, 0.18, 0.01, ['lowpass', 900]); return noise(0, 0.32, 0.18, 'bandpass', 2400 * r(), 2600, 3, 0.01);
      case 'heal': for (let i = 0; i < 3; i++) tone(i * 0.09, 'sine', [660, 880, 1320][i] * r(0.01), [660, 880, 1320][i] * 1.02, 0.32, 0.08, 0.01); return noise(0.05, 0.4, 0.03, 'highpass', 6000);
      case 'slash': noise(0, 0.12, 0.3, 'highpass', 2800 * r(), 6500, 0.8, 0.003); noise(0.06, 0.1, 0.22, 'highpass', 3400, 7000, 0.8, 0.003); return slide(0, 2200, 600, 0.12, 0.05);
      case 'roar': tone(0, 'sawtooth', 160 * r(), 55, 0.9, 0.2, 0.06, ['lowpass', 700]); tone(0.04, 'square', 90, 40, 0.8, 0.08, 0.06, ['lowpass', 400]); noise(0.15, 0.9, 0.5, 'lowpass', 1600 * r(), 500, 0.7, 0.05); return noise(0.2, 0.7, 0.2, 'bandpass', 420, 300, 1.2, 0.05);
      case 'magic': for (let i = 0; i < 4; i++) tone(i * 0.04, 'sine', [880, 1110, 1320, 1760][i] * r(0.02), [880, 1110, 1320, 1760][i] * 1.01, 0.18, 0.07, 0.003); return noise(0, 0.25, 0.05, 'highpass', 7000);
      // Deaths: a cartoon cry, a pop and a puff of smoke as they fall.
      // The cry of the one killed, a cartoon "aww!": a voice sliding down through the vowel's two formants (/ɔ/, about
      // 650 and 1000 Hz), a little vibrato as it fades. Ours a higher, sadder one; theirs a lower, rougher groan.
      case 'death-ally': ouch(0, 300, 0.6, 0.14, 0.01); return;
      case 'death-foe': ouch(0, 170, 0.65, 0.16, 0.03); return;
      case 'die-man': squeak(0, 620, 280, 0.26, 0.11); pop(0.24, 0.16); return puff(0.25, 0.22);
      case 'die-armor': squeak(0, 480, 220, 0.24, 0.1, 1100); fall(0.2, 0.32); [0.22, 0.27, 0.33].forEach((t) => ring(t, [1800 * r(), 2700 * r(), 3500 * r()], 0.05, 0.14)); return puff(0.3, 0.18);
      case 'die-beast': squeak(0, 900, 360, 0.3, 0.1, 1600); fall(0.28, 0.34); return puff(0.3, 0.2);
      case 'die-brute': cry(0, 150, 70, 0.4, 0.18, 520); fall(0.34, 0.45); return puff(0.36, 0.3);
      case 'die-bot': noise(0, 0.2, 0.14, 'highpass', 5200); boing(0, 180, 0.12, 0.35); return boom(0.2, 0.3, 0.4);
      case 'die-flyer': slide(0, 1500, 260, 0.55, 0.12); return puff(0.5, 0.22);
      case 'die-horse': tone(0, 'sawtooth', 760 * r(), 480, 0.45, 0.1, 0.02, ['bandpass', 1300, 3]); squeak(0.12, 520, 240, 0.25, 0.08); return fall(0.42, 0.45);
      case 'die-dragon': tone(0, 'sawtooth', 120 * r(), 55, 0.75, 0.2, 0.04, ['bandpass', 480, 2]); noise(0, 0.7, 0.16, 'lowpass', 600, 150, 0.6, 0.05); fall(0.6, 0.5); return puff(0.62, 0.3);
      // The enemy fortress falls: a long crumble of booms and stones, then the guardian's war horn and its roar.
      case 'base-falls': {
        for (let i = 0; i < 5; i++) boom(i * 0.16, 0.5 - i * 0.06, 0.5);
        for (let i = 0; i < 9; i++) noise(0.1 + i * 0.07, 0.08, 0.16, 'bandpass', 900 * r(0.3), 500, 1.5);
        [0, 7, 12].forEach((n) => tone(0.9, 'sawtooth', 110 * 2 ** (n / 12), 108 * 2 ** (n / 12), 1.1, 0.07, 0.15, ['lowpass', 1400]));
        tone(1.3, 'sawtooth', 90, 45, 0.9, 0.2, 0.08, ['bandpass', 420, 2]); return noise(1.3, 0.9, 0.18, 'lowpass', 700, 150, 0.6, 0.08);
      }
      // The corrupt wind: a low howl rising, a rushing gust, and a dark chord under it.
      case 'corrupt-wind': {
        noise(0, 1.3, 0.7, 'bandpass', 220, 1400, 1.4, 0.25); noise(0.15, 1.1, 0.35, 'lowpass', 600, 200, 0.6, 0.2);
        [0, 1, 6].forEach((n) => tone(0, 'sawtooth', 73 * 2 ** (n / 12), 70 * 2 ** (n / 12), 1.4, 0.06, 0.3, ['lowpass', 700]));
        return slide(0.1, 180, 520, 1.1, 0.06);
      }
      case 'coin': tone(0, 'square', 1320, 1320, 0.06, 0.06, 0.002, ['lowpass', 5000]); return tone(0.06, 'square', 1760, 1760, 0.16, 0.06, 0.002, ['lowpass', 5000]);
    }
  }

  /** When the hit sound last played: a crowd being hit sounds once every 50 ms, not once a frame. */
  private lastHit = -1;
  play(name: Sfx) {
    if (!this.ready || this.volumes.sfx === 0) return;
    const at = this.ctx.currentTime;
    if (name === 'hit') { if (at - this.lastHit < 0.05) return; this.lastHit = at; }
    switch (name) {
      case 'shoot': return this.blip(at, 900, 500, 0.05, 0.25, 'square');
      // A bowstring's twang and the arrow's whoosh, a little different each time so a volley does not drone.
      case 'arrow': { const d = 1 + (Math.random() - 0.5) * 0.12; this.blip(at, 240 * d, 150 * d, 0.07, 0.2, 'triangle'); return this.hiss(at + 0.015, 0.14, 0.12, 2600 * d); }
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
      // A merge on the board, after the merge games (Cow Evolution and the like): a round bubbly «bloop» rising
      // with a wobble, a soft pop, then a bright little sparkle of two notes.
      case 'zip': {
        const o = this.ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(260, at);
        o.frequency.exponentialRampToValueAtTime(980, at + 0.14);
        const wob = this.ctx.createOscillator();
        wob.frequency.value = 28;
        const depth = this.ctx.createGain();
        depth.gain.value = 40;
        wob.connect(depth).connect(o.frequency);
        const g = this.ctx.createGain();
        this.env(g, at, 0.42, 0.006, 0.16);
        o.connect(g).connect(this.sfxBus);
        o.start(at);
        wob.start(at);
        o.stop(at + 0.22);
        wob.stop(at + 0.22);
        this.hiss(at + 0.13, 0.03, 0.14, 2500);
        return this.chime(at + 0.15, [1568, 2093], 0.06, 0.2);
      }
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
