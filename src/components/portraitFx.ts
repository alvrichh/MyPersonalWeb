import type { CSSProperties } from 'react';

/*
 * The portrait easter egg (HeroAbout.tsx): every accent is an element with its
 * own burst, and each one moves in its own way. Pieces are plain <i>s placed
 * relative to the portrait's centre (--x0/--y0); the look and the motion live
 * in _portrait-fx.scss, keyed by the `fx-<kind>` class.
 *
 *   blue     ripple    rings spread out like water round a dropped stone
 *   green    leaf      a gust of wind blows leaves off to one side
 *   red      flame     the ring catches fire and flames rise straight up
 *   orange   spark     sparkler sparks shoot out fast, then arc down
 *   yellow   bolt      a storm: bolts flicker in place round the ring + a flash
 *   white    ghost     ghosts slip out from behind and drift up, weaving
 *   pink     heart     hearts orbit the portrait as they spiral away
 *   rainbow  confetti  (Disco) confetti bursts out in every colour
 */
export type FxKind = 'confetti' | 'ripple' | 'leaf' | 'flame' | 'spark' | 'bolt' | 'flash' | 'ghost' | 'heart';
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

/** How long the longest piece of each effect lasts, delays included (ms);
 *  kept in step with the durations in _portrait-fx.scss. */
const LIFE: Partial<Record<FxKind, number>> = {
  confetti: 1700,
  ripple: 2300,
  leaf: 3100,
  flame: 1600,
  spark: 1100,
  bolt: 1500,
  ghost: 3500,
  heart: 2600,
};

export const effectFor = (accent: string | undefined): FxKind => EFFECT_BY_ACCENT[accent ?? ''] ?? 'confetti';

/** When a burst's pieces can be dropped from the page. */
export const effectLife = (kind: FxKind) => (LIFE[kind] ?? 2000) + 200;

let nextPiece = 0;
const px = (value: number) => `${value.toFixed(1)}px`;
const ms = (value: number) => `${Math.round(value)}ms`;
const between = (low: number, high: number) => low + Math.random() * (high - low);

/**
 * One burst of `kind` for the `combo`-th quick click in a row: more pieces,
 * further, as the combo grows. On wide screens there are more pieces and they
 * travel further and may leave the window; on phones every effect stays
 * inside the screen's width so the page never scrolls sideways.
 */
export function makeBurst(kind: FxKind, burst: number, combo: number, figure: DOMRect): FxPiece[] {
  const wide = window.innerWidth > 760;
  const screen = wide ? Math.min(2, window.innerWidth / 640) : 1;
  const comboReach = 1 + (combo - 1) * 0.12;
  const radius = figure.width / 2;
  const ring = radius * 0.88;
  const centre = figure.left + radius;
  // Room from the portrait's centre to each edge of the screen.
  const roomLeft = centre - 12;
  const roomRight = window.innerWidth - centre - 12;
  const count = (base: number) => Math.round(base * (1 + (combo - 1) * 0.36) * screen);
  const piece = (pieceKind: FxKind, style: Record<string, string | number>): FxPiece => ({
    id: nextPiece++,
    burst,
    kind: pieceKind,
    style: style as CSSProperties,
  });
  // Horizontal travel from x0 that stays on screen on phones (soft limit, so
  // pieces don't stack up in a line at the edge).
  const fitX = (x0: number, dx: number) => {
    if (wide) return dx;
    const room = Math.max(1, (dx < 0 ? roomLeft + x0 : roomRight - x0) - 24);
    return Math.sign(dx) * room * Math.tanh(Math.abs(dx) / room);
  };

  switch (kind) {
    case 'ripple': {
      const limit = wide ? Infinity : (2 * Math.min(roomLeft, roomRight)) / figure.width;
      return [0, 1, 2].map((i) =>
        piece('ripple', {
          '--scale': Math.min(limit, (1.35 + i * 0.25) * comboReach).toFixed(2),
          '--delay': ms(i * 230),
        }),
      );
    }

    case 'leaf': {
      // One gust, all leaves the same way: towards the side with more room.
      const way = roomLeft >= roomRight ? -1 : 1;
      return Array.from({ length: count(14) }, () => {
        const angle = Math.random() * Math.PI * 2;
        const x0 = Math.cos(angle) * ring;
        return piece('leaf', {
          '--x0': px(x0),
          '--y0': px(Math.sin(angle) * ring),
          '--dx': px(fitX(x0, way * between(180, 380) * comboReach * screen * 0.8)),
          '--dy': px(between(-110, 50) * comboReach),
          '--wave': px(between(10, 26)),
          '--turn': `${Math.round(way * between(360, 900))}deg`,
          '--size': between(0.8, 1.25).toFixed(2),
          '--dur': ms(between(2300, 2900)),
          '--delay': ms(between(0, 180)),
        });
      });
    }

    case 'flame':
      return Array.from({ length: count(20) }, () => {
        const angle = Math.random() * Math.PI * 2;
        return piece('flame', {
          '--x0': px(Math.cos(angle) * radius * 0.98),
          '--y0': px(Math.sin(angle) * radius * 0.98),
          '--dx': px(between(-16, 16)),
          '--dy': px(-between(80, 190) * comboReach * (wide ? 1.3 : 1)),
          '--size': between(0.7, 1.3).toFixed(2),
          '--dur': ms(between(1000, 1400)),
          '--delay': ms(between(0, 200)),
        });
      });

    case 'spark': {
      const total = count(34);
      return Array.from({ length: total }, (_, i) => {
        const angle = ((i + Math.random() * 0.7) / total) * Math.PI * 2;
        const distance = between(120, 260) * comboReach * screen;
        const x0 = Math.cos(angle) * ring;
        return piece('spark', {
          '--x0': px(x0),
          '--y0': px(Math.sin(angle) * ring),
          '--dx': px(fitX(x0, Math.cos(angle) * distance * 1.15) / 1.15),
          '--dy': px(Math.sin(angle) * distance),
          '--fall': px(between(60, 140)),
          '--angle': `${((angle * 180) / Math.PI).toFixed(1)}deg`,
          '--delay': ms(between(0, 60)),
        });
      });
    }

    case 'bolt': {
      const total = Math.round((6 + (combo - 1) * 2) * Math.min(screen, 1.5));
      const bolts = Array.from({ length: total }, (_, i) => {
        const angle = ((i + between(0.2, 0.8)) / total) * Math.PI * 2;
        const distance = radius * between(1.12, 1.4) * Math.min(comboReach, 1.4);
        const reachX = wide ? Infinity : (Math.cos(angle) < 0 ? roomLeft : roomRight) - 30;
        const x0 = Math.sign(Math.cos(angle)) * Math.min(Math.abs(Math.cos(angle) * distance), reachX);
        return piece('bolt', {
          '--x0': px(x0),
          '--y0': px(Math.sin(angle) * distance),
          '--angle': `${((angle * 180) / Math.PI).toFixed(1)}deg`,
          '--size': between(0.85, 1.25).toFixed(2),
          '--dur': ms(between(900, 1200)),
          '--delay': ms(between(0, 260)),
        });
      });
      return [piece('flash', { '--delay': '0ms' }), ...bolts];
    }

    case 'ghost':
      return Array.from({ length: count(6) }, () => {
        // Mostly from the top half, so they rise away from behind the photo.
        const angle = -Math.PI / 2 + between(-0.6, 0.6) * Math.PI;
        const x0 = Math.cos(angle) * ring * 0.8;
        return piece('ghost', {
          '--x0': px(x0),
          '--y0': px(Math.sin(angle) * ring * 0.8),
          '--dx': px(fitX(x0, Math.cos(angle) * between(60, 150) * screen)),
          '--dy': px(-between(150, 280) * comboReach * (wide ? 1.2 : 1)),
          '--wave': px(between(18, 32)),
          '--tilt': `${Math.round(between(-12, 12))}deg`,
          '--size': between(0.85, 1.2).toFixed(2),
          '--dur': ms(between(2600, 3200)),
          '--delay': ms(between(0, 260)),
        });
      });

    case 'heart': {
      const total = Math.min(count(12), 48);
      const way = Math.random() < 0.5 ? -1 : 1;
      const maxRadius = wide ? Infinity : Math.min(roomLeft, roomRight) - 14;
      return Array.from({ length: total }, (_, i) =>
        piece('heart', {
          '--a0': `${Math.round((i / total) * 360 + between(-10, 10))}deg`,
          '--sweep': `${Math.round(way * between(300, 400))}deg`,
          '--r0': px(radius * 1.02),
          '--r1': px(Math.min(maxRadius, radius * between(1.25, 1.55) * comboReach)),
          '--size': between(0.8, 1.25).toFixed(2),
          '--dur': ms(between(2000, 2400)),
          '--delay': ms(between(0, 120)),
        }),
      );
    }

    default: {
      // Disco: confetti bursting out in every direction.
      const total = count(28);
      return Array.from({ length: total }, (_, i) => {
        const angle = ((i + Math.random() * 0.6) / total) * Math.PI * 2;
        const distance = between(80, 180) * comboReach * screen;
        const x0 = Math.cos(angle) * ring;
        return piece('confetti', {
          '--x0': px(x0),
          '--y0': px(Math.sin(angle) * ring),
          '--dx': px(fitX(x0, Math.cos(angle) * distance * 1.1) / 1.1),
          '--dy': px(Math.sin(angle) * distance),
          '--turn': `${Math.round((Math.random() - 0.5) * 900)}deg`,
          '--piece-hue': Math.round(Math.random() * 360),
          '--delay': ms(between(0, 60)),
        });
      });
    }
  }
}
