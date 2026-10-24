import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

/** Return a descendant's relative path, never a sibling or a parent. */
export function within(parent, file) {
  const rel = relative(parent, file);
  return rel && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel) ? rel : null;
}

/** Only the module URL moves; the page's public route remains /game.html. */
export function pageHtml(template) {
  const html = template.replaceAll('/src/game/main.ts', '/bug-hunter/src/main.ts');
  if (!html.includes('src="/bug-hunter/src/main.ts"')) throw new Error('Bug Hunter HTML is missing its module entry.');
  return html;
}

/** Disposable compatibility files; canonical sources live in bug-hunter/. */
export function prepareGame(root, command = 'build') {
  root = resolve(root);
  if (!['serve', 'build'].includes(command)) throw new Error('Unexpected Vite command.');
  const game = join(root, 'bug-hunter');
  const assets = join(game, 'assets');
  const template = join(game, 'game.html');
  const publicDir = join(root, '.cache', `site-public-${command}`);
  for (const required of [template, join(game, 'src', 'main.ts'), join(assets, 'ui', 'logo.webp')]) {
    if (!existsSync(required)) throw new Error(`Missing Bug Hunter source: ${required}`);
  }
  if (existsSync(join(root, 'static', 'images', 'game'))) {
    throw new Error('Edit bug-hunter/assets, not the retired static/images/game directory.');
  }
  const html = pageHtml(readFileSync(template, 'utf8'));
  // Separate caches prevent a production build from wiping a running dev server.
  rmSync(publicDir, { recursive: true, force: true });
  mkdirSync(publicDir, { recursive: true });
  cpSync(join(root, 'static'), publicDir, { recursive: true });
  mkdirSync(join(publicDir, 'images'), { recursive: true });
  cpSync(assets, join(publicDir, 'images', 'game'), { recursive: true });
  writeFileSync(join(root, 'game.html'), html);
  return publicDir;
}

/** Mirror canonical HTML/static edits during development without copying code. */
export function gameSourcePlugin(root, publicDir) {
  root = resolve(root);
  const template = join(root, 'bug-hunter', 'game.html');
  const mounts = [
    { from: join(root, 'bug-hunter', 'assets'), to: join(publicDir, 'images', 'game') },
    { from: join(root, 'static'), to: publicDir },
  ];
  return {
    name: 'bug-hunter-source-layout',
    configureServer(server) {
      server.watcher.add([template, ...mounts.map(m => m.from)]);
      const sync = (event, file) => {
        if (!['add', 'change', 'unlink', 'addDir', 'unlinkDir'].includes(event)) return;
        file = resolve(file);
        try {
          if (file === template) {
            if (event === 'unlink') throw new Error('Bug Hunter HTML template was removed.');
            writeFileSync(join(root, 'game.html'), pageHtml(readFileSync(template, 'utf8')));
            server.ws.send({ type: 'full-reload', path: '/game.html' });
            return;
          }
          for (const mount of mounts) {
            const rel = within(mount.from, file);
            if (!rel) continue;
            const target = join(mount.to, rel);
            if (event === 'unlink' || event === 'unlinkDir') rmSync(target, { recursive: true, force: true });
            else {
              mkdirSync(dirname(target), { recursive: true });
              cpSync(file, target, { recursive: true });
            }
            server.ws.send({ type: 'full-reload', path: '*' });
            return;
          }
        } catch (error) {
          server.config.logger.error(`[bug-hunter] ${error instanceof Error ? error.message : String(error)}`);
        }
      };
      server.watcher.on('all', sync);
      server.httpServer?.once('close', () => server.watcher.off('all', sync));
      // The source directory is not a second game URL with different asset paths.
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost');
        if (!['/bug-hunter/', '/bug-hunter/game.html'].includes(url.pathname)) return next();
        res.statusCode = 302;
        res.setHeader('Location', `/game.html${url.search}`);
        res.end();
      });
    },
  };
}
