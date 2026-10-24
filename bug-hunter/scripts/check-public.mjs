// Called after the shared build. Missing or altered public game assets fail it.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = join(root, 'bug-hunter', 'assets');
function files(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(prefix, entry.name);
    return entry.isDirectory() ? files(join(dir, entry.name), path) : [path];
  });
}
const assets = files(source);
assert.ok(assets.length > 0, 'No source game assets found.');
for (const output of ['dist', 'public']) {
  const page = join(root, output, 'game.html');
  assert.ok(existsSync(page), `Missing ${output}/game.html`);
  const html = readFileSync(page, 'utf8');
  assert.ok(!html.includes('/src/game/main.ts') && !html.includes('/bug-hunter/src/main.ts'), 'HTML entry was not bundled.');
  assert.ok(existsSync(join(root, output, 'index.html')), `Missing portfolio ${output}/index.html`);
  for (const asset of assets) {
    const destination = join(root, output, 'images', 'game', asset);
    assert.ok(existsSync(destination), `Missing published asset: ${destination}`);
    assert.ok(readFileSync(join(source, asset)).equals(readFileSync(destination)), `Changed asset bytes: ${destination}`);
  }
  console.log(`Verified ${output}/game.html and ${assets.length} byte-identical game assets.`);
}
