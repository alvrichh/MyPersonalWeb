import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ isSsrBuild }) => ({
  // Relative URLs, so the built pages also work from any sub-path.
  base: './',
  // Pictures, the CV and the radar data are copied as they are and keep their
  // URLs (./images, ./cv, ./data). Not "public": that's Vercel's output folder.
  publicDir: isSsrBuild ? false : 'static',
  plugins: [react()],
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
          planning: 'planning.html',
        },
      },
    },
}));
