import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle = await build({ entryPoints: ['bug-hunter/src/siege/model.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const m = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const run = (s, seconds) => { for (let i = 0; i < seconds * 30; i++) m.tick(s, 1 / 30); };
test('safe save validation and independent schema', () => {
  assert.deepEqual(m.readProgress('{'), m.freshProgress());
  assert.deepEqual(m.readProgress('{"version":2}'), m.freshProgress());
  const p = m.readProgress(JSON.stringify({ version: 1, unlocked: 500, coins: -20, upgrades: [99, -2, '3'], deck: [7, 7, 999, -1, 0], victories: [1, 1, 9, -2, 2.5] }));
  assert.equal(p.unlocked, 9); assert.equal(p.coins, 0); assert.deepEqual(p.upgrades, [5, 0, 0]); assert.equal(new Set(p.deck).size, 5); assert.deepEqual(p.victories, [1, 9]);
  assert.equal(m.readProgress('{"version":1,"deck":[7]}').deck.includes(7), false);
});
test('summoning enforces energy, deck, cooldown and population', () => {
  const s = m.newSiege(m.freshProgress(), 1); const energy = s.energy;
  assert.equal(m.summon(s, 0), true); assert.equal(s.energy, energy - m.UNITS[0].cost);
  assert.equal(m.summon(s, 0), false); assert.equal(m.summon(s, 7), false); assert.equal(m.summon(s, 999), false);
  s.energy = 0; assert.equal(m.summon(s, 1), false);
  s.energy = 999; s.cooldowns[0] = 0; s.units = Array.from({ length: m.CAP }, (_, uid) => ({ ...s.units[0], uid }));
  assert.equal(m.summon(s, 0), false);
});
test('generator spends energy, raises capacity/rate and caps at four', () => {
  const s = m.newSiege(m.freshProgress(), 1); const rate = m.energyRate(s);
  assert.equal(m.improveGenerator(s), true); assert.equal(s.energy, 15); assert.ok(m.energyRate(s) > rate);
  for (let i = 0; i < 4; i++) { s.energy = 999; m.improveGenerator(s); }
  assert.equal(s.generator, 4); assert.equal(m.improveGenerator(s), false);
  run(s, 1); assert.ok(s.energy <= m.energyMax(s));
});
test('weapons have separate recharge and never hurt friendly troops', () => {
  const s = m.newSiege(m.freshProgress(), 1); m.summon(s, 0); const u = s.units[0]; s.aim = u.x;
  const enemy = { ...u, uid: 100, side: 1, hp: 200, maxHp: 200 }; s.units.push(enemy);
  const hp = u.hp, energy = s.energy;
  assert.equal(m.fire(s), true); assert.equal(m.fire(s), false); assert.equal(u.hp, hp); assert.ok(enemy.hp < 200); assert.equal(s.energy, energy);
  assert.equal(m.strike(s), true); assert.equal(m.strike(s), false); assert.equal(u.hp, hp);
});
test('troops walk, engage opponents and cannot pass through them', () => {
  const s = m.newSiege(m.freshProgress(), 1); m.summon(s, 0); const a = s.units[0]; a.x = 500;
  const enemy = { ...a, uid: 100, side: 1, x: 550 }; s.units.push(enemy); run(s, 1);
  assert.ok(a.x < enemy.x); assert.ok(a.hp < a.maxHp); assert.ok(enemy.hp < enemy.maxHp);
});
test('units damage enemy fortress and win without touching their own', () => {
  const s = m.newSiege(m.freshProgress(), 1); m.summon(s, 0); s.units[0].x = m.FIELD - 110; s.hp[1] = 1; s.bossSpawned = true;
  m.tick(s, 1 / 30); assert.equal(s.phase, 'won'); assert.equal(s.hp[0], s.maxHp[0]); assert.equal(s.hp[1], 0);
  const snapshot = JSON.stringify(s); run(s, 5); assert.equal(JSON.stringify(s), snapshot);
});
test('base destruction, time limit and simultaneous destruction resolve defeat', () => {
  for (const reason of ['hp', 'time', 'both']) {
    const s = m.newSiege(m.freshProgress(), 1);
    if (reason === 'time') s.time = m.LIMIT; else s.hp[0] = 0;
    if (reason === 'both') s.hp[1] = 0;
    m.tick(s, 1 / 30); assert.equal(s.phase, 'lost');
  }
});
test('guardian appears once at low base health', () => {
  const s = m.newSiege(m.freshProgress(), 1); s.hp[1] = 500; m.tick(s, 1 / 30);
  assert.equal(s.units.filter(u => u.boss).length, 1); run(s, 2); assert.equal(s.units.filter(u => u.boss).length, 1);
});
test('rewards are idempotent and unlock only the next world', () => {
  const p = m.freshProgress(), s = m.newSiege(p, 1); assert.equal(m.settle(p, s), 0);
  s.phase = 'won'; assert.equal(m.settle(p, s), 190); assert.equal(m.settle(p, s), 0); assert.equal(p.coins, 190); assert.equal(p.unlocked, 2);
  const repeat = m.newSiege(p, 1); repeat.phase = 'won'; assert.equal(m.settle(p, repeat), 50);
  const defeat = m.newSiege(p, 2); defeat.phase = 'lost'; assert.equal(m.settle(p, defeat), 0); assert.equal(p.unlocked, 2);
  assert.equal(m.newSiege(m.freshProgress(), 9).world, 1);
});
test('workshop validates purchases and persists bonuses', () => {
  const p = m.freshProgress(); assert.equal(m.upgrade(p, 0), false); p.coins = 200;
  assert.equal(m.upgrade(p, 9), false); assert.equal(m.upgrade(p, 0), true); assert.equal(p.coins, 100);
  const restored = m.readProgress(JSON.stringify(p)); const s = m.newSiege(restored, 1);
  assert.equal(s.power, 1.08); assert.equal(restored.upgrades[0], 1);
});
test('fixed-step runs are deterministic and keep both armies bounded', () => {
  const a = m.newSiege(m.freshProgress(), 1), b = m.newSiege(m.freshProgress(), 1);
  run(a, 180); run(b, 180); assert.deepEqual(a, b); assert.ok(a.units.length <= m.CAP * 2);
});
test('Backlog can be won with a mixed army and active defenses, without upgrades', () => {
  const p = m.freshProgress(), s = m.newSiege(p, 1);
  for (let step = 0; step < m.LIMIT * 30 && s.phase === 'fight'; step++) {
    if (s.generator < 3 && s.energy >= m.generatorPrice(s) + 20) m.improveGenerator(s);
    for (const id of [4, 2, 1, 0, 3]) if (s.energy >= m.UNITS[id].cost + (s.time < 25 ? 30 : 0)) m.summon(s, id);
    const threats = s.units.filter(u => u.side).sort((a, b) => a.x - b.x);
    if (threats[0]) { s.aim = threats[0].x; if (s.aim < 1080) m.fire(s); m.strike(s); }
    m.tick(s, 1 / 30);
  }
  assert.equal(s.phase, 'won', `ended ${s.phase}: ${s.hp}, time ${s.time}`);
});
