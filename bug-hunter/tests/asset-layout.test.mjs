import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { gameAssetEntries, publicAssetPath, WORLD_FOLDERS } from '../build/asset-paths.mjs';
import { gameSourcePlugin, prepareGame } from '../build/integration.mjs';

const casts = ['original', 'demon', 'viking', 'mud', 'jungle', 'greek', 'robot', 'nightmare', 'core'];
const bosses = ['kernel', 'overlord', 'valkyrie', 'medusa', 'queen', 'zeus', 'mech', 'wraith', 'chimera3'];
const bytes = Buffer.from([82, 73, 70, 70, 0, 255, 37]);
function fixture(t, legacy = false) {
  const root = mkdtempSync(join(tmpdir(), 'bug-hunter-world-assets-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (path, value = bytes) => { const full = join(root, path); mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, value); };
  put('bug-hunter/game.html', '<script type="module" src="/src/game/main.ts"></script><img src="./images/game/ui/logo.webp">');
  put('bug-hunter/src/main.ts', 'export const unchanged = true;');
  put(`bug-hunter/assets/${legacy ? '' : 'shared/'}ui/logo.webp`);
  put('static/images/portrait.png', 'portfolio-image');
  return { root, put, assets: join(root, 'bug-hunter/assets'), asset: (path, value) => put(`bug-hunter/assets/${path}`, value) };
}
function dev(t) {
  const f = fixture(t), out = prepareGame(f.root, 'serve');
  const watcher = Object.assign(new EventEmitter(), { add() {} });
  const errors = [], messages = [];
  const server = { watcher, httpServer: new EventEmitter(), ws: { send: m => messages.push(m) },
    config: { logger: { error: m => errors.push(m) } }, middlewares: { use() {} } };
  gameSourcePlugin(f.root, out).configureServer(server);
  return { ...f, out, errors, messages, event: (kind, path) => watcher.emit('all', kind, join(f.root, path)),
    get: path => readFileSync(join(out, 'images/game', path)) };
}
for (const [i, world] of WORLD_FOLDERS.entries()) test(`${world}: public URLs are unchanged`, () => {
  for (const suffix of [`enemies/${casts[i]}-bug-0.webp`, `bosses/${bosses[i]}-0.webp`, `floors/world${i + 1}.webp`]) {
    assert.equal(publicAssetPath(`worlds/${world}/${suffix}`), suffix);
  }
  assert.equal(publicAssetPath(`worlds/${world}/scenery/wall.webp`), `${casts[i]}/wall.webp`);
});
test('shared and special assets keep their old suffix, including Windows separators', () => {
  assert.equal(publicAssetPath('shared/ui/logo.webp'), 'ui/logo.webp');
  assert.equal(publicAssetPath('special/secret-shift/bosses/kratos2-9.webp'), 'bosses/kratos2-9.webp');
  assert.equal(publicAssetPath('shared\\hero\\boy.webp'), 'hero/boy.webp');
});
test('invalid or escaping paths and unknown groups fail explicitly', () => {
  for (const path of ['../x', '/x', 'shared//x', 'shared/../x', 'shared/./x', 'C:/x', 'worlds/10-unknown/a.webp', 'special/unknown/a.webp', 'shared', 'worlds/01-backlog', 'a\0b']) assert.throws(() => publicAssetPath(path));
});
test('all worlds publish together with identical bytes, unchanged public HTML and portfolio assets', t => {
  const f = fixture(t);
  for (const [i, slug] of WORLD_FOLDERS.entries()) {
    for (const suffix of [`enemies/${casts[i]}-bug-0.webp`, `bosses/${bosses[i]}-0.webp`, `floors/world${i + 1}.webp`, 'scenery/wall.webp']) f.asset(`worlds/${slug}/${suffix}`);
  }
  f.asset('special/secret-shift/bosses/kratos-0.webp');
  const out = prepareGame(f.root);
  for (const entry of gameAssetEntries(f.assets)) assert.deepEqual(readFileSync(join(out, 'images/game', entry.path)), readFileSync(entry.source));
  assert.equal(readFileSync(join(out, 'images/portrait.png'), 'utf8'), 'portfolio-image');
  assert.match(readFileSync(join(f.root, 'game.html'), 'utf8'), /src="\/bug-hunter\/src\/main.ts"/);
  assert.match(readFileSync(join(f.root, 'game.html'), 'utf8'), /\.\/images\/game\/ui\/logo.webp/);
  assert.match(readFileSync(join(f.root, 'bug-hunter/game.html'), 'utf8'), /\/src\/game\/main.ts/);
  assert.equal(existsSync(join(out, 'images/game/worlds')), false);
});
test('flat legacy fixtures still publish correctly', t => {
  const f = fixture(t, true); f.asset('floors/world5.webp');
  assert.deepEqual(readFileSync(join(prepareGame(f.root), 'images/game/floors/world5.webp')), bytes);
});
test('duplicate URLs fail before replacing a valid cache', t => {
  const f = fixture(t), out = prepareGame(f.root); writeFileSync(join(out, 'sentinel'), 'keep');
  f.asset('ui/logo.webp', 'wrong'); assert.throws(() => prepareGame(f.root), /Duplicate public asset/);
  assert.equal(readFileSync(join(out, 'sentinel'), 'utf8'), 'keep');
});
test('case-only collisions and target file/directory conflicts fail', t => {
  const f = fixture(t); f.asset('worlds/01-backlog/fx/Glow.webp'); f.asset('shared/fx/glow.webp');
  assert.throws(() => gameAssetEntries(f.assets), /Duplicate/);
  rmSync(join(f.assets, 'shared/fx'), { recursive: true }); f.asset('shared/fx');
  assert.throws(() => gameAssetEntries(f.assets), /file\/directory conflict/);
});
test('symlinks are rejected', t => {
  const f = fixture(t);
  try { symlinkSync(join(f.root, 'static'), join(f.assets, 'shared/external'), 'dir'); }
  catch (error) { if (error.code === 'EPERM') { t.skip('Host disallows symlinks.'); return; } throw error; }
  assert.throws(() => gameAssetEntries(f.assets), /symlinks/);
});
test('production and development caches remain independent', t => {
  const f = fixture(t), serve = prepareGame(f.root, 'serve'); writeFileSync(join(serve, 'keep'), 'yes');
  const build = prepareGame(f.root, 'build'); writeFileSync(join(build, 'stale'), 'old'); prepareGame(f.root, 'build');
  assert.equal(existsSync(join(build, 'stale')), false); assert.equal(readFileSync(join(serve, 'keep'), 'utf8'), 'yes');
  assert.equal(readFileSync(join(f.root, 'bug-hunter/src/main.ts'), 'utf8'), 'export const unchanged = true;');
});
test('missing required art or retired folders cannot replace a valid cache', t => {
  const f = fixture(t), out = prepareGame(f.root); rmSync(join(f.assets, 'shared/ui/logo.webp'));
  assert.throws(() => prepareGame(f.root), /Missing Bug Hunter/); assert.deepEqual(readFileSync(join(out, 'images/game/ui/logo.webp')), bytes);
  f.asset('shared/ui/logo.webp'); f.put('static/images/game/old.webp'); assert.throws(() => prepareGame(f.root), /retired/);
});
test('dev mirrors world asset additions, changes and removals at the old URL', t => {
  const f = dev(t), path = 'bug-hunter/assets/worlds/02-hotfix-inferno/bosses/overlord-0.webp';
  f.put(path, 'first'); f.event('add', path); assert.equal(f.get('bosses/overlord-0.webp').toString(), 'first');
  f.put(path, 'changed'); f.event('change', path); assert.equal(f.get('bosses/overlord-0.webp').toString(), 'changed');
  rmSync(join(f.root, path)); f.event('unlink', path); assert.equal(existsSync(join(f.out, 'images/game/bosses/overlord-0.webp')), false);
  assert.deepEqual(f.errors, []);
});
test('deleting one world does not delete another world sharing a public category', t => {
  const f = dev(t);
  for (const [world, name] of [[WORLD_FOLDERS[0], 'kernel'], [WORLD_FOLDERS[1], 'overlord']]) {
    const path = `bug-hunter/assets/worlds/${world}/bosses/${name}-0.webp`; f.put(path); f.event('add', path);
  }
  const dir = `bug-hunter/assets/worlds/${WORLD_FOLDERS[0]}`; rmSync(join(f.root, dir), { recursive: true }); f.event('unlinkDir', dir);
  assert.equal(existsSync(join(f.out, 'images/game/bosses/kernel-0.webp')), false); assert.deepEqual(f.get('bosses/overlord-0.webp'), bytes); assert.deepEqual(f.errors, []);
});
test('dev collisions do not overwrite existing files', t => {
  const f = dev(t); f.asset('ui/logo.webp', 'wrong'); f.event('add', 'bug-hunter/assets/ui/logo.webp');
  assert.deepEqual(f.get('ui/logo.webp'), bytes); assert.match(f.errors[0], /Duplicate/);
});
test('moving between shared and world folders retains the public suffix', t => {
  const f = dev(t), old = 'bug-hunter/assets/shared/fx/leaf.webp', next = 'bug-hunter/assets/worlds/05-legacy-jungle/fx/leaf.webp';
  f.put(old, 'before'); f.event('add', old); rmSync(join(f.root, old)); f.put(next, 'after'); f.event('add', next); f.event('unlink', old);
  assert.equal(f.get('fx/leaf.webp').toString(), 'after'); assert.deepEqual(f.errors, []);
});
test('deleting the portfolio images directory preserves game art', t => {
  const f = dev(t); rmSync(join(f.root, 'static/images'), { recursive: true }); f.event('unlinkDir', 'static/images');
  assert.deepEqual(f.get('ui/logo.webp'), bytes); assert.equal(existsSync(join(f.out, 'images/portrait.png')), false); assert.deepEqual(f.errors, []);
});
test('output verification rejects altered bytes and additional URLs', t => {
  const f = fixture(t), cache = prepareGame(f.root), game = fileURLToPath(new URL('../', import.meta.url));
  for (const path of ['build/asset-paths.mjs', 'scripts/check-public.mjs']) {
    const target = join(f.root, 'bug-hunter', path); mkdirSync(dirname(target), { recursive: true }); cpSync(join(game, path), target);
  }
  for (const out of ['dist', 'public']) {
    cpSync(cache, join(f.root, out), { recursive: true }); f.put(`${out}/game.html`, '<script src="./assets/game-hash.js"></script>'); f.put(`${out}/index.html`, 'portfolio');
  }
  const run = () => spawnSync(process.execPath, [join(f.root, 'bug-hunter/scripts/check-public.mjs')], { encoding: 'utf8' });
  let result = run(); assert.equal(result.status, 0, result.stderr);
  f.put('dist/images/game/ui/logo.webp', 'broken'); result = run(); assert.notEqual(result.status, 0); assert.match(result.stderr, /Changed asset bytes/);
  f.put('dist/images/game/ui/logo.webp', bytes); f.put('public/images/game/unexpected.webp'); result = run(); assert.notEqual(result.status, 0); assert.match(result.stderr, /Unexpected or missing/);
});
