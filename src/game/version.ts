/** Bug Hunter's version, shown at the foot of the main menu with the build's day and commit. Raised by hand: the major
    number for a new game mode (1 Sprints, 2 On call, 3 Boss Rush), the minor for a big drop of content in between
    (2.1 evolutions … 2.8 the mud world); the build stamp changes by itself on every deploy. */
export const GAME_VERSION = '3.0';

declare const __GAME_BUILD__: { commit: string; built: string };
/** The build stamp from vite.config.mts (missing only if the file is run outside Vite). */
export const GAME_BUILD = typeof __GAME_BUILD__ === 'undefined' ? { commit: 'dev', built: '' } : __GAME_BUILD__;
