// Called after the shared build. Repository folders must not change public URLs.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gameAssetEntries } from '../build/asset-paths.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const assets = gameAssetEntries(join(root, 'bug-hunter', 'assets'));
assert.ok(assets.length > 0, 'No source game assets found.');
function files(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? files(join(dir, entry.name), path) : [path];
  });
}
for (const output of ['dist', 'public']) {
  const page = join(root, output, 'game.html');
  assert.ok(existsSync(page), `Missing ${output}/game.html`);
  const html = readFileSync(page, 'utf8');
  assert.ok(!html.includes('/src/game/main.ts') && !html.includes('/bug-hunter/src/main.ts'), 'HTML entry was not bundled.');
  assert.ok(existsSync(join(root, output, 'index.html')), `Missing portfolio ${output}/index.html`);
  const destination = join(root, output, 'images', 'game');
  assert.deepEqual(files(destination).sort(), assets.map(e => e.path).sort(), `Unexpected or missing ${output} asset URLs`);
  for (const asset of assets) {
    const file = join(destination, asset.path);
    assert.ok(readFileSync(asset.source).equals(readFileSync(file)), `Changed asset bytes: ${file}`);
  }
  console.log(`Verified ${output}/game.html and ${assets.length} byte-identical game assets at their public URLs.`);
}
