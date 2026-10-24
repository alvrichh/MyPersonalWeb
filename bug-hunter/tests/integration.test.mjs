import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { gameSourcePlugin, pageHtml, prepareGame, within } from '../build/integration.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'bug-hunter-layout-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (path, value) => { const full = join(root, path); mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, value); };
  const html = '<!doctype html><script type="module" src="/src/game/main.ts"></script><img src="./images/game/ui/logo.webp"><a href="./index.html">Back</a>';
  put('bug-hunter/game.html', html);
  put('bug-hunter/src/main.ts', 'export const unchanged = true;');
  put('bug-hunter/assets/ui/logo.webp', Buffer.from([82, 73, 70, 70, 0, 255]));
  put('bug-hunter/assets/floors/world5.webp', 'floor-bytes');
  put('static/data/sample.json', '{"portfolio":true}');
  put('static/privacy.html', '<h1>Unchanged legal page</h1>');
  return { root, put, html };
}
function server() {
  const watcher = Object.assign(new EventEmitter(), { add() {} });
  const messages = [], errors = [], middleware = [];
  return { watcher, httpServer: new EventEmitter(), ws: { send: m => messages.push(m) },
    config: { logger: { error: m => errors.push(m) } }, middlewares: { use: m => middleware.push(m) }, messages, errors, middleware };
}

test('generated HTML changes only the module URL and preserves its canonical template', t => {
  const f = fixture(t); prepareGame(f.root);
  assert.equal(readFileSync(join(f.root, 'game.html'), 'utf8'), f.html.replace('/src/game/main.ts', '/bug-hunter/src/main.ts'));
  assert.equal(readFileSync(join(f.root, 'bug-hunter/game.html'), 'utf8'), f.html);
});
test('site and game public URLs preserve asset bytes', t => {
  const f = fixture(t), out = prepareGame(f.root);
  assert.deepEqual(readFileSync(join(out, 'images/game/ui/logo.webp')), readFileSync(join(f.root, 'bug-hunter/assets/ui/logo.webp')));
  assert.equal(readFileSync(join(out, 'images/game/floors/world5.webp'), 'utf8'), 'floor-bytes');
  assert.equal(readFileSync(join(out, 'data/sample.json'), 'utf8'), '{"portfolio":true}');
  assert.equal(readFileSync(join(out, 'privacy.html'), 'utf8'), '<h1>Unchanged legal page</h1>');
});
test('stale generated output is removed without changing sources', t => {
  const f = fixture(t), out = prepareGame(f.root);
  writeFileSync(join(out, 'stale.txt'), 'remove'); prepareGame(f.root);
  assert.equal(existsSync(join(out, 'stale.txt')), false);
  assert.equal(readFileSync(join(f.root, 'bug-hunter/src/main.ts'), 'utf8'), 'export const unchanged = true;');
});
test('production preparation does not erase a development cache', t => {
  const f = fixture(t), dev = prepareGame(f.root, 'serve');
  writeFileSync(join(dev, 'dev-only.txt'), 'keep'); const prod = prepareGame(f.root, 'build');
  assert.notEqual(dev, prod); assert.equal(existsSync(join(dev, 'dev-only.txt')), true);
});
test('invalid commands and missing inputs fail before writing', t => {
  const f = fixture(t);
  assert.throws(() => prepareGame(f.root, '../outside'), /Unexpected/);
  rmSync(join(f.root, 'bug-hunter/src/main.ts'));
  assert.throws(() => prepareGame(f.root), /Missing Bug Hunter/);
  assert.equal(existsSync(join(f.root, 'game.html')), false);
});
test('retired asset directories are rejected rather than silently shadowed', t => {
  const f = fixture(t); f.put('static/images/game/old.webp', 'old');
  assert.throws(() => prepareGame(f.root), /retired/);
});
test('entry validation accepts a migrated template and rejects a missing entry', () => {
  const html = '<script src="/bug-hunter/src/main.ts"></script>';
  assert.equal(pageHtml(html), html); assert.throws(() => pageHtml('<html></html>'), /module entry/);
});
test('path mapping rejects siblings, parents and the mount itself', () => {
  assert.equal(within('/repo/static', '/repo/static/images/x.webp'), 'images/x.webp');
  assert.equal(within('/repo/static', '/repo/static-other/x'), null);
  assert.equal(within('/repo/static', '/repo/secret'), null);
  assert.equal(within('/repo/static', '/repo/static'), null);
});
test('asset additions, edits and deletion are mirrored during development', t => {
  const f = fixture(t), out = prepareGame(f.root, 'serve'), s = server();
  gameSourcePlugin(f.root, out).configureServer(s);
  f.put('bug-hunter/assets/ui/new.webp', 'new'); s.watcher.emit('all', 'add', join(f.root, 'bug-hunter/assets/ui/new.webp'));
  assert.equal(readFileSync(join(out, 'images/game/ui/new.webp'), 'utf8'), 'new');
  f.put('bug-hunter/assets/ui/new.webp', 'changed'); s.watcher.emit('all', 'change', join(f.root, 'bug-hunter/assets/ui/new.webp'));
  assert.equal(readFileSync(join(out, 'images/game/ui/new.webp'), 'utf8'), 'changed');
  rmSync(join(f.root, 'bug-hunter/assets/ui/new.webp')); s.watcher.emit('all', 'unlink', join(f.root, 'bug-hunter/assets/ui/new.webp'));
  assert.equal(existsSync(join(out, 'images/game/ui/new.webp')), false); assert.equal(s.errors.length, 0);
});
test('HTML edits regenerate the entry and shutdown removes listeners', t => {
  const f = fixture(t), out = prepareGame(f.root, 'serve'), s = server();
  gameSourcePlugin(f.root, out).configureServer(s);
  f.put('bug-hunter/game.html', f.html + '<!-- edit -->'); s.watcher.emit('all', 'change', join(f.root, 'bug-hunter/game.html'));
  assert.match(readFileSync(join(f.root, 'game.html'), 'utf8'), /<!-- edit -->$/);
  assert.deepEqual(s.messages.at(-1), { type: 'full-reload', path: '/game.html' });
  s.httpServer.emit('close'); assert.equal(s.watcher.listenerCount('all'), 0);
});
test('source-folder development URLs redirect with query strings intact', t => {
  const f = fixture(t), out = prepareGame(f.root, 'serve'), s = server(); gameSourcePlugin(f.root, out).configureServer(s);
  const res = { setHeader(k, v) { this[k] = v; }, end() { this.ended = true; } };
  s.middleware[0]({ url: '/bug-hunter/game.html?debug=1' }, res, () => assert.fail('unexpected fallthrough'));
  assert.equal(res.statusCode, 302); assert.equal(res.Location, '/game.html?debug=1'); assert.equal(res.ended, true);
  let next = false; s.middleware[0]({ url: '/index.html' }, {}, () => { next = true; }); assert.equal(next, true);
});
test('cache and TypeScript events do not cause recursive copies', t => {
  const f = fixture(t), out = prepareGame(f.root, 'serve'), s = server(); gameSourcePlugin(f.root, out).configureServer(s);
  s.watcher.emit('all', 'change', join(out, 'images/game/ui/logo.webp'));
  s.watcher.emit('all', 'change', join(f.root, 'bug-hunter/src/main.ts'));
  assert.equal(s.messages.length, 0); assert.equal(s.errors.length, 0);
});
