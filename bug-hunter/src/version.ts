/** Bug Hunter uses major.minor.patch. Minor versions mark substantial game
 * updates (1.13: Tactics); patches cover fixes and maintenance.
 * The game now lives in bug-hunter/. Release notes: ../CHANGELOG.md.
 * This folder migration preserves the public game URL, saves and gameplay.
 * The build stamp changes automatically on each deployment.
 */
export const GAME_VERSION = '1.15.77';

declare const __GAME_BUILD__: { commit: string; built: string };
/** Build stamp from the shared Vite configuration; safe outside Vite too. */
export const GAME_BUILD = typeof __GAME_BUILD__ === 'undefined' ? { commit: 'dev', built: '' } : __GAME_BUILD__;


