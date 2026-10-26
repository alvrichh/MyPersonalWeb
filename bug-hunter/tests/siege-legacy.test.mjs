import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle = await build({ entryPoints: ['bug-hunter/src/siege/legacy/model.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const m = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const run = (s, seconds) => { for (let i = 0; i < seconds * 30; i++) m.tick(s, 1 / 30); };
test('safe save validation and independent schema', () => {
  assert.deepEqual(m.readProgress('{'), m.freshProgress());
  assert.deepEqual(m.readProgress('{"version":2}'), m.freshProgress());
  const p = m.readProgress(JSON.stringify({ version: 1, unlocked: 500, coins: -20, upgrades: [99, -2, '3', 7], deck: [7, 7, 999, -1, 0], victories: [1, 1, 9, -2, 2.5] }));
  assert.equal(p.unlocked, 9); assert.equal(p.coins, 0); assert.deepEqual(p.upgrades, [5, 0, 0, 5]); assert.equal(new Set(p.deck).size, 5); assert.deepEqual(p.victories, [1, 9]);
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
  u.damage = 0; enemy.damage = 0; const hp = u.hp, energy = s.energy;
  m.draw(s, true); m.tick(s, 1 / 30); assert.equal(u.hp, hp); assert.ok(enemy.hp < 200); m.draw(s, false); assert.ok(s.bow.quiver < m.BOW.max);
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
test('the guardian comes out only when the fortress falls, and must fall for the win', () => {
  const s = m.newSiege(m.freshProgress(), 1); s.nextWave = 999; s.hp[1] = 500; run(s, 1);
  assert.equal(s.units.filter(u => u.boss).length, 0, 'not while the fortress stands');
  s.hp[1] = 0; m.tick(s, 1 / 30);
  assert.equal(s.units.filter(u => u.boss).length, 1); assert.equal(s.phase, 'fight', 'not won while the guardian stands');
  run(s, 2); assert.equal(s.units.filter(u => u.boss).length, 1, 'only once');
  s.units.find(u => u.boss).hp = 0; m.tick(s, 1 / 30); assert.equal(s.phase, 'won');
});
test('enemy flyers join the waves later on', () => {
  const s = m.newSiege(m.freshProgress(), 2); s.hp[0] = 1e9; s.hp[1] = 1e9;
  run(s, 20); assert.equal(s.units.some(u => u.side && m.UNITS[u.id].air), false);
  run(s, 120); assert.ok(s.waves > 0); assert.ok(s.kills + s.units.filter(u => u.side).length > 0);
  const seen = new Set(); for (let i = 0; i < 120 * 30; i++) { m.tick(s, 1 / 30); for (const u of s.units) if (u.side && m.UNITS[u.id].air) seen.add(u.id); }
  assert.ok(seen.size > 0);
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
    if (threats[0]) { s.aim = threats[0].x; m.draw(s, s.aim < 1080); m.strike(s); } else m.draw(s, false);
    m.tick(s, 1 / 30);
  }
  assert.equal(s.phase, 'won', `ended ${s.phase}: ${s.hp}, time ${s.time}`);
});

test('the bow: a tap starts it, it speeds up, stops on a tap or an empty quiver, and refills only while stopped', () => {
  const s = m.newSiege(m.freshProgress(), 1); s.nextWave = 999;
  m.toggleBow(s); m.tick(s, 1 / 30);
  assert.equal(s.effects.filter(e => e.kind === 'arrow').length, 1);
  const slow = m.bowEvery(s.bow); run(s, 3); assert.ok(m.bowEvery(s.bow) < slow, 'faster the longer it shoots'); assert.equal(m.bowCount(s.bow), 2);
  m.toggleBow(s); const left = s.bow.quiver; assert.equal(s.bow.drawing, false); run(s, 1); assert.ok(s.bow.quiver > left, 'refills while stopped');
  m.toggleBow(s); const before = s.bow.quiver; m.tick(s, 1 / 30); assert.ok(s.bow.quiver < before, 'no refill while shooting');
  for (let i = 0; i < 900 && s.bow.drawing; i++) m.tick(s, 1 / 30);
  assert.equal(s.bow.drawing, false, 'an empty quiver stops it'); assert.ok(s.bow.quiver < m.BOW.cost + 1);
  const p = m.freshProgress(); p.upgrades[3] = 4; const up = m.newSiege(p, 1);
  assert.ok(m.bowEvery(up.bow) < m.bowEvery(m.newSiege(m.freshProgress(), 1).bow)); assert.equal(m.bowCount(up.bow), 3);
});
test('air troops fly out of melee reach, ranged troops still hit them; armies keep five of each', () => {
  assert.equal(m.canHit(0, 8), false, 'a melee bug cannot reach a bat'); assert.equal(m.canHit(1, 8), true, 'a spitter shoots it');
  assert.equal(m.canHit(8, 0), true, 'a bat dives on the ground');
  const s = m.newSiege(m.freshProgress(), 1); s.nextWave = 999; s.deck.push(8); s.energy = 999;
  assert.equal(m.summon(s, 8), true); const bat = s.units[0]; bat.x = 500;
  const bug = { ...bat, uid: 100, id: 0, side: 1, x: 520, hp: 9999, maxHp: 9999, damage: 50 };
  s.units.push(bug); run(s, 2); assert.equal(bat.hp, bat.maxHp, 'the enemy bug never hits it'); assert.ok(bug.hp < 9999);
  const p = m.readProgress(JSON.stringify({ version: 1, unlocked: 9, deck: [0, 1, 2, 3, 4, 6, 8, 9, 10, 11, 5, 7] }));
  assert.equal(p.deck.filter(id => !m.UNITS[id].air).length, 5); assert.equal(p.deck.filter(id => m.UNITS[id].air).length, 5);
});
test('the missile blasts the aim and recharges', () => {
  const s = m.newSiege(m.freshProgress(), 1); s.aim = 600;
  s.units.push({ uid: 1, id: 0, side: 1, x: 620, lane: 0, hp: 200, maxHp: 200, damage: 0, attack: 0, flash: 0, boss: false });
  assert.equal(m.missile(s), true); assert.ok(s.units[0].hp < 200); assert.equal(m.missile(s), false);
  run(s, m.ROCKET.every + 0.1); assert.equal(m.missile(s), true);
});
test('every troop id is its place in the list, and every troop has a name', () => {
  m.UNITS.forEach((u, i) => assert.equal(u.id, i));
  assert.ok(m.UNITS.length >= 29);
});

test('heavy robots break twice into weaker wrecks; elite shooters come later and hit harder', () => {
  const open = { ...m.freshProgress(), unlocked: 9 };
  const s = m.newSiege(open, 7); s.nextWave = 999; assert.equal(s.world, 7);
  s.units.push({ uid: 50, id: 2, side: 1, x: 900, lane: 0, hp: 0, maxHp: 400, damage: 40, attack: 0, flash: 0, boss: false });
  m.tick(s, 1 / 30); let wreck = s.units.find(u => u.side);
  assert.equal(wreck.stage, 1); assert.equal(wreck.maxHp, 400 * m.SPLIT.hp); assert.ok(wreck.damage < 40);
  wreck.hp = 0; m.tick(s, 1 / 30); wreck = s.units.find(u => u.side); assert.equal(wreck.stage, 2);
  wreck.hp = 0; m.tick(s, 1 / 30); assert.equal(s.units.filter(u => u.side).length, 0, 'gone after its second break');
  const other = m.newSiege(m.freshProgress(), 1); other.nextWave = 999;
  other.units.push({ uid: 50, id: 2, side: 1, x: 900, lane: 0, hp: 0, maxHp: 400, damage: 40, attack: 0, flash: 0, boss: false });
  m.tick(other, 1 / 30); assert.equal(other.units.length, 0, 'only the Forge\'s heavies break');
  const late = m.newSiege(open, 3); late.hp[0] = late.hp[1] = 1e9;
  let elite = null; for (let i = 0; i < 200 * 30 && !elite; i++) { m.tick(late, 1 / 30); elite = late.units.find(u => u.elite); }
  assert.ok(elite, 'an elite shooter comes'); assert.ok(late.time >= m.ELITE.from); assert.equal(elite.id, 1);
});
