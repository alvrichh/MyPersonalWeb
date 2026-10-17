import type { CSSProperties } from 'react';

/*
 * The portrait easter egg (HeroAbout.tsx): every accent is an element with its
 * own burst. Pieces are plain <i>s positioned on the ring; the look and the
 * motion live in _portrait-fx.scss, keyed by the `fx-<kind>` class.
 */
export type FxKind = 'confetti' | 'ripple' | 'leaf' | 'flame' | 'spark' | 'bolt' | 'ghost' | 'heart';
export type FxPiece = { id: number; burst: number; kind: FxKind; style: CSSProperties };

const EFFECT_BY_ACCENT: Record<string, FxKind> = {
  blue: 'ripple',
  green: 'leaf',
  red: 'flame',
  orange: 'spark',
  yellow: 'bolt',
  white: 'ghost',
  pink: 'heart',
  rainbow: 'confetti',
};

/** How many pieces a single click throws, how far they travel (px) and how
 *  long the longest one lasts (ms, kept in step with the SCSS durations). */
type Spec = { count: number; near: number; far: number; life: number };

const SPECS: Record<Exclude<FxKind, 'ripple'>, Spec> = {
  confetti: { count: 28, near: 80, far: 180, life: 1700 },
  leaf: { count: 18, near: 70, far: 170, life: 2300 },
  flame: { count: 22, near: 30, far: 90, life: 1400 },
  spark: { count: 36, near: 110, far: 230, life: 900 },
  bolt: { count: 9, near: 40, far: 90, life: 700 },
  ghost: { count: 8, near: 60, far: 140, life: 2500 },
  heart: { count: 16, near: 70, far: 160, life: 1900 },
};

const RIPPLES = 3;
const RIPPLE_LIFE = 1800 + (RIPPLES - 1) * 230;

export const effectFor = (accent: string | undefined): FxKind => EFFECT_BY_ACCENT[accent ?? ''] ?? 'confetti';

/** When a burst's pieces can be dropped from the page. */
export const effectLife = (kind: FxKind) => (kind === 'ripple' ? RIPPLE_LIFE : SPECS[kind].life) + 200;

let nextPiece = 0;
const px = (value: number) => `${value.toFixed(1)}px`;

/**
 * One burst of `kind` for the `combo`-th quick click in a row (more pieces,
 * further, as the combo grows). On wide screens there are more pieces and
 * they fly further (both up to twice as many/far) and may leave the window;
 * on phones, sideways travel eases off before the screen edge on each side
 * (a soft limit, so pieces don't stack up in a line) so the page never scrolls.
 */
export function makeBurst(kind: FxKind, burst: number, combo: number, figure: DOMRect): FxPiece[] {
  const wide = window.innerWidth > 760;
  const screen = wide ? Math.min(2, window.innerWidth / 640) : 1;
  const comboReach = 1 + (combo - 1) * 0.12;
  const centre = figure.left + figure.width / 2;

  if (kind === 'ripple') {
    // Rings the size of the portrait, like a stone dropped in water.
    const room = Math.min(centre, window.innerWidth - centre) - 8;
    const limit = wide ? Infinity : (2 * room) / figure.width;
    return Array.from({ length: RIPPLES }, (_, i) => ({
      id: nextPiece++,
      burst,
      kind,
      style: {
        ['--scale' as string]: Math.min(limit, (1.35 + i * 0.25) * comboReach).toFixed(2),
        ['--delay' as string]: `${i * 230}ms`,
      },
    }));
  }

  const spec = SPECS[kind];
  const count = Math.round(spec.count * (1 + (combo - 1) * 0.36) * screen);
  const reach = comboReach * screen;
  const ring = figure.width * 0.44;
  return Array.from({ length: count }, (_, i) => {
    const angle = ((i + Math.random() * 0.6) / count) * Math.PI * 2;
    const distance = (spec.near + Math.random() * (spec.far - spec.near)) * reach;
    const x0 = Math.cos(angle) * ring;
    const room = (x0 < 0 ? centre : window.innerWidth - centre) - 12;
    const maxDx = Math.max(1, room / 1.1 - Math.abs(x0));
    const dx = wide
      ? Math.cos(angle) * distance
      : Math.sign(x0) * maxDx * Math.tanh(Math.abs(Math.cos(angle) * distance) / maxDx);
    return {
      id: nextPiece++,
      burst,
      kind,
      style: {
        ['--x0' as string]: px(x0),
        ['--y0' as string]: px(Math.sin(angle) * ring),
        ['--dx' as string]: px(dx),
        ['--dy' as string]: px(Math.sin(angle) * distance),
        ['--angle' as string]: `${((angle * 180) / Math.PI).toFixed(1)}deg`,
        ['--turn' as string]: `${Math.round((Math.random() - 0.5) * 900)}deg`,
        ['--tilt' as string]: `${Math.round((Math.random() - 0.5) * 40)}deg`,
        ['--size' as string]: (0.8 + Math.random() * 0.45).toFixed(2),
        ['--piece-hue' as string]: Math.round(Math.random() * 360),
        ['--delay' as string]: `${Math.round(Math.random() * 80)}ms`,
      },
    };
  });
}
