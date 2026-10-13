import { createReadStream, cpSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Pictures, the CV and the radar data keep their old URLs (./images, ./cv,
// ./data) and their old place in the repo (assets/…), so the daily radar bot
// and its workflow work unchanged.
const STATIC_DIRS: Record<string, string> = {
  images: 'assets/images',
  cv: 'assets/cv',
  data: 'assets/data',
};

const MIME: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webp': 'image/webp', '.json': 'application/json', '.pdf': 'application/pdf',
};

function staticDirs(): Plugin {
  let outDir = 'dist';
  return {
    name: 'static-dirs',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0]);
        const [, top, ...rest] = url.split('/');
        const dir = STATIC_DIRS[top];
        if (!dir) return next();
        const file = path.resolve(dir, ...rest);
        if (!file.startsWith(path.resolve(dir)) || !existsSync(file) || !statSync(file).isFile()) return next();
        res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
        createReadStream(file).pipe(res);
      });
    },
    writeBundle() {
      for (const [name, dir] of Object.entries(STATIC_DIRS)) {
        cpSync(dir, path.join(outDir, name), { recursive: true });
      }
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  // Relative URLs, so the built pages also work from any sub-path.
  base: './',
  // Vercel publishes a folder called "public"; keep Vite away from that name.
  publicDir: false,
  plugins: [react(), ...(isSsrBuild ? [] : [staticDirs()])],
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
