import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gameSourcePlugin, prepareGame } from './bug-hunter/build/integration.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const commit = (() => {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try { return execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return 'dev'; }
})();
const built = new Date().toISOString().slice(0, 10);

export default defineConfig(({ isSsrBuild, command }) => {
  // Repository paths move; game.html and /images/game public URLs do not.
  const publicDir = isSsrBuild ? false : prepareGame(root, command);
  return {
    root,
    base: './',
    publicDir,
    plugins: [react(), ...(publicDir ? [gameSourcePlugin(root, publicDir)] : [])],
    define: { __GAME_BUILD__: JSON.stringify({ commit, built }) },
    build: isSsrBuild
      ? { outDir: 'dist-ssr', emptyOutDir: true }
      : {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          input: {
            index: 'index.html',
            'ai-radar': 'ai-radar.html',
            calendar: 'calendar.html',
            gym: 'gym.html',
            game: 'game.html',
            planning: 'planning.html',
          },
        },
      },
  };
});
