// Skins, their pictures and the shop's texts: data checks run without a browser (`npm run test:game`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({
  stdin: { contents: "export * as save from './src/save.ts'; export * as shop from './src/shop.ts'; export * as strings from './src/strings.ts';", resolveDir: root },
  bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent',
});
const { save: s, shop, strings } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const T = { en: strings.makeT('en'), es: strings.makeT('es') };
const cap = (k) => k[0].toUpperCase() + k.slice(1);
const heroDir = `${root}assets/shared/hero/`;
const heroFiles = new Set(readdirSync(heroDir));
/** A picture's height, read from its WebP header (VP8X canvas, VP8L or lossy VP8 frame). */
function webpHeight(file) {
  const b = readFileSync(file);
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return 1 + b.readUIntLE(27, 3);
  if (kind === 'VP8L') { const bits = b.readUInt32LE(21); return 1 + ((bits >> 14) & 0x3fff); }
  return b.readUInt16LE(28) & 0x3fff;
}

test('skin groups: world, specials, bosses; every skin in exactly one', () => {
  const { world, special, boss } = s.SKIN_GROUPS;
  assert.deepEqual(world, ['boy', ...s.WORLD_SKINS]);
  const all = [...world, ...special, ...boss];
  assert.equal(all.length, s.SKINS.length);
  assert.deepEqual([...all].sort(), [...s.SKINS].sort());
});
test('skin groups: specials have no gate and go cheapest first', () => {
  const { special } = s.SKIN_GROUPS;
  for (const k of special) assert.equal(s.SKIN_GATE[k], null, `${k} should be sold without a gate`);
  for (let i = 1; i < special.length; i++) assert.ok(s.SKIN_PRICE[special[i - 1]] <= s.SKIN_PRICE[special[i]], `${special[i - 1]} before ${special[i]}`);
});
test('skin groups: bosses in the order of the boss that opens each (1 to 9), the secret one last', () => {
  const gates = s.SKIN_GROUPS.boss.map((k) => s.SKIN_GATE[k]);
  assert.deepEqual(gates.slice(0, -1).map((g) => g.boss), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(gates.at(-1), { secret: true });
});
test('world outfits: free, one per world, opened by winning the world before in sprints', () => {
  for (let n = 0; n < s.WORLD_SKINS.length; n++) {
    const skin = s.WORLD_SKINS[n];
    assert.equal(s.SKIN_PRICE[skin], 0);
    assert.equal(s.worldOutfit(n), skin);
    assert.deepEqual(s.SKIN_GATE[skin], n === 0 ? null : { world: n });
  }
});
test('every skin has its name and line in English and Spanish', () => {
  for (const k of s.SKINS) for (const lang of ['en', 'es']) {
    assert.ok(T[lang](`skin${cap(k)}Name`), `${lang} skin${cap(k)}Name`);
    assert.ok(T[lang](`skin${cap(k)}Text`), `${lang} skin${cap(k)}Text`);
  }
  for (const key of ['skinGroupWorld', 'skinGroupSpecial', 'skinGroupBoss', 'skinLockWorld', 'skinLockBoss', 'skinLockSecret', 'equip', 'worn'])
    for (const lang of ['en', 'es']) assert.ok(T[lang](key), `${lang} ${key}`);
});
test('every skin has its pictures: the 13 base poses, side walk and aim in fours, back walk in pairs', () => {
  const base = ['front', 'idle', 'back', 'fwalk', 'fwalk2', 'walk', 'walk2', 'shoot', 'wshoot', 'wshoot2', 'cheer', 'hurt', 'down'];
  for (const k of s.SKINS) {
    for (const pose of base) assert.ok(heroFiles.has(`${k}-base-${pose}.webp`), `${k}-base-${pose}`);
    for (const group of ['swalk', 'saim']) {
      const n = [0, 1, 2, 3].filter((i) => heroFiles.has(`${k}-base-${group}-${i}.webp`)).length;
      assert.ok(n === 0 || n === 4, `${k} ${group}: ${n} of 4`);
    }
  }
});
test('back walk: exactly the listed skins have both steps', () => {
  for (const k of s.SKINS) {
    const has = [0, 1].map((i) => heroFiles.has(`${k}-base-bwalk-${i}.webp`));
    assert.equal(has[0], has[1], `${k}: one back step without the other`);
    assert.equal(has[0], s.BACK_WALK_SKINS.includes(k), `${k}: back walk pictures and BACK_WALK_SKINS disagree`);
  }
});
test('tall skins: a front picture past 150 px is listed in SKIN_TALL with its height over 144', () => {
  for (const k of s.SKINS) {
    const h = webpHeight(`${heroDir}${k}-base-front.webp`);
    if (h > 150) assert.ok(Math.abs((s.SKIN_TALL[k] ?? 1) - h / 144) < 0.01, `${k} is ${h} px tall: SKIN_TALL should be ${h}/144`);
    else assert.equal(s.SKIN_TALL[k], undefined, `${k} is ${h} px tall and needs no SKIN_TALL`);
  }
});
test('shop short lines: both languages, shorter than the full text, about the same length', () => {
  for (const id of shop.SHOP_SHORT) for (const lang of ['en', 'es']) {
    const short = T[lang](`${id}Shop`), full = T[lang](`${id}Text`);
    assert.ok(short, `${lang} ${id}Shop missing`);
    assert.ok(full, `${lang} ${id}Text missing`);
    assert.ok(short.length <= 72, `${lang} ${id}Shop is ${short.length} characters (72 at most)`);
    assert.ok(short.length < full.length, `${lang} ${id}Shop is not shorter than its full text`);
  }
});
