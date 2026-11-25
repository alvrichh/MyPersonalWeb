import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { gameAssetEntries } from './asset-paths.mjs';

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
const copyAsset = (entry, destination) => {
  const target = join(destination, entry.path);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(entry.source, target);
};

/** Disposable compatibility files; canonical sources live in bug-hunter/. */
export function prepareGame(root, command = 'build') {
  root = resolve(root);
  if (!['serve', 'build'].includes(command)) throw new Error('Unexpected Vite command.');
  const game = join(root, 'bug-hunter');
  const assets = join(game, 'assets');
  const template = join(game, 'game.html');
  const publicDir = join(root, '.cache', `site-public-${command}`);
  for (const required of [template, join(game, 'src', 'main.ts'), assets]) {
    if (!existsSync(required)) throw new Error(`Missing Bug Hunter source: ${required}`);
  }
  if (existsSync(join(root, 'static', 'images', 'game'))) {
    throw new Error('Edit bug-hunter/assets, not the retired static/images/game directory.');
  }
  const entries = gameAssetEntries(assets);
  if (!entries.some(e => e.path === 'ui/logo.webp')) throw new Error('Missing Bug Hunter source: ui/logo.webp');
  const html = pageHtml(readFileSync(template, 'utf8'));
  // Validate all mappings before replacing a cache. Keep serve/build separate.
  rmSync(publicDir, { recursive: true, force: true });
  mkdirSync(publicDir, { recursive: true });
  cpSync(join(root, 'static'), publicDir, { recursive: true });
  const publishedAssets = join(publicDir, 'images', 'game');
  for (const entry of entries) copyAsset(entry, publishedAssets);
  writeFileSync(join(root, 'game.html'), html);
  return publicDir;
}

/** Mirror canonical HTML/static edits during development without copying code. */
export function gameSourcePlugin(root, publicDir) {
  root = resolve(root);
  const template = join(root, 'bug-hunter', 'game.html');
  const assets = join(root, 'bug-hunter', 'assets');
  const staticSource = join(root, 'static');
  const publishedAssets = join(publicDir, 'images', 'game');
  return {
    name: 'bug-hunter-source-layout',
    configureServer(server) {
      let previous = new Map(gameAssetEntries(assets).map(e => [e.path, e.source]));
      server.watcher.add([template, assets, staticSource]);
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
          if (file === assets || within(assets, file)) {
            // Re-index on additions/removals, but copy only changed files. A
            // deleted world directory must NOT delete other worlds' public files.
            const entries = gameAssetEntries(assets);
            const next = new Map(entries.map(e => [e.path, e.source]));
            for (const path of previous.keys()) {
              if (!next.has(path)) rmSync(join(publishedAssets, path), { force: true });
            }
            for (const entry of entries) {
              if (entry.source === file || within(file, entry.source) || previous.get(entry.path) !== entry.source) {
                copyAsset(entry, publishedAssets);
              }
            }
            previous = next;
            server.ws.send({ type: 'full-reload', path: '*' });
            return;
          }
          const rel = within(staticSource, file);
          if (!rel) return;
          if (existsSync(join(staticSource, 'images', 'game'))) throw new Error('Do not recreate the retired static/images/game directory.');
          const target = join(publicDir, rel);
          if (event === 'unlink' || event === 'unlinkDir') {
            // static/images shares its published parent with projected game art.
            // Rebuild from both sources rather than deleting the game alongside it.
            prepareGame(root, 'serve');
          } else {
            mkdirSync(dirname(target), { recursive: true });
            cpSync(file, target, { recursive: true });
          }
          server.ws.send({ type: 'full-reload', path: '*' });
        } catch (error) {
          server.config.logger.error(`[bug-hunter] ${error instanceof Error ? error.message : String(error)}`);
        }
      };
      server.watcher.on('all', sync);
      server.httpServer?.once('close', () => server.watcher.off('all', sync));
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
