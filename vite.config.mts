import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';

// Bug Hunter's build stamp, shown at the foot of its main menu: the commit (Vercel gives it in its environment;
// locally it comes from git) and the day it was built.
const commit = (() => {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return 'dev'; }
})();
const built = new Date().toISOString().slice(0, 10);

export default defineConfig(({ isSsrBuild }) => ({
  // Relative URLs, so the built pages also work from any sub-path.
  base: './',
  // Pictures, the CV and the radar data are copied as they are and keep their
  // URLs (./images, ./cv, ./data). Not "public": that's Vercel's output folder.
  publicDir: isSsrBuild ? false : 'static',
  plugins: [react()],
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
}));
