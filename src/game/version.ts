/** Bug Hunter's version, shown at the foot of the main menu with the build's day and commit. Raise it by hand for a
    release worth naming (the build stamp changes by itself on every deploy). */
export const GAME_VERSION = '1.0';

declare const __GAME_BUILD__: { commit: string; built: string };
/** The build stamp from vite.config.mts (missing only if the file is run outside Vite). */
export const GAME_BUILD = typeof __GAME_BUILD__ === 'undefined' ? { commit: 'dev', built: '' } : __GAME_BUILD__;
