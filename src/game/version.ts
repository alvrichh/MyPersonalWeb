/** Bug Hunter's version, shown at the foot of the main menu with the build's day and commit. Raised by hand,
    major.minor.patch: the major stays 1 for the published game (2 only for something as big as player accounts or
    real payments), the minor goes up with each big drop (1.1 On call, 1.2 evolutions, masteries, passives and the
    boss chest, 1.3 the arsenal and fusions, 1.4 the final bosses, 1.5 the daily chest, coin store and ads,
    1.6 Nightmare, 1.7 the mud world and the songs, 1.8 Boss Rush and the Archero upgrades, 1.9 the secret shift, 1.10 the board), the patch with each
    smaller change since; the build stamp changes by itself on every deploy. */
export const GAME_VERSION = '1.10.1';

declare const __GAME_BUILD__: { commit: string; built: string };
/** The build stamp from vite.config.mts (missing only if the file is run outside Vite). */
export const GAME_BUILD = typeof __GAME_BUILD__ === 'undefined' ? { commit: 'dev', built: '' } : __GAME_BUILD__;
