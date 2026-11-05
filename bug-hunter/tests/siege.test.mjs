import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle = await build({ entryPoints: ['bug-hunter/src/siege/cartoon/model.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const m = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
m.testing.free = false; // the gold economy, as it ships
const run = (s, seconds) => { for (let i = 0; i < seconds * 30; i++) m.tick(s, 1 / 30); };
test('safe save validation and independent schema', () => {
  assert.deepEqual(m.readProgress('{'), m.freshProgress());
  assert.deepEqual(m.readProgress('{"version":2}'), m.freshProgress());
  const p = m.readProgress(JSON.stringify({ version: 1, unlocked: 500, coins: -20, upgrades: [99, -2, '3', 7], owned: [7, 1, 2, 999, 20], deck: [7, 7, 999, -1, 0, 3], victories: [1, 1, 6, 30, 31, -2, 2.5] }));
  assert.equal(p.unlocked, m.LAST); assert.equal(p.coins, 0); assert.deepEqual(p.upgrades, [5, 0, 0, 5, 5, 0, 0], 'an old four-upgrade save: its Bow becomes both power and speed'); assert.deepEqual(p.victories, [1, 6, 30]);
  assert.deepEqual(p.owned, [0, 7, 1, 2], 'the swordsman always, never a foe or unknown'); assert.deepEqual(p.deck, [7, 0], 'only recruited troops');
  assert.equal(m.readProgress('{"version":1,"deck":[7],"owned":[7]}').deck.includes(7), false, 'not before its act opens');
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
test('weapons have separate recharge; neither arrows nor the spell strike our own troops', () => {
  const s = m.newSiege(m.freshProgress(), 1); m.summon(s, 0); const u = s.units[0]; s.aim = u.x;
  const enemy = { ...u, uid: 100, side: 1, hp: 200, maxHp: 200 }; s.units.push(enemy);
  u.damage = 0; enemy.damage = 0; u.hp = u.maxHp = 500; const energy = s.energy;
  m.draw(s, true); m.tick(s, 1 / 30); assert.equal(u.hp, 500, 'an arrow landing on ours passes over it'); assert.ok(enemy.hp < 200); m.draw(s, false); assert.ok(s.bow.quiver < m.BOW.max);
  const hp = u.hp; assert.equal(m.strike(s), true); assert.equal(m.strike(s), false); assert.equal(u.hp, hp);
});
test('troops walk, engage opponents and cannot pass through them', () => {
  const s = m.newSiege(m.freshProgress(), 1); m.summon(s, 0); const a = s.units[0]; a.x = 500;
  const enemy = { ...a, uid: 100, side: 1, x: 550 }; s.units.push(enemy); run(s, 1);
  assert.ok(a.x < enemy.x); assert.ok(a.hp < a.maxHp); assert.ok(enemy.hp < enemy.maxHp);
});
test('units damage enemy fortress and win without touching their own', () => {
  const s = m.newSiege(m.freshProgress(), 1); m.summon(s, 0); s.units[0].x = m.FIELD - 110; s.hp[1] = 1; s.bossSpawned = true; s.gusted = true;
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
test('a guardian stage lasts ten minutes, the others five', () => {
  assert.equal(m.limitOf(1), 300); assert.equal(m.limitOf(5), 600); assert.equal(m.limitOf(30), 600);
  const p = m.freshProgress(); p.unlocked = 5; const s = m.newSiege(p, 5); assert.equal(s.world, 5); s.time = 300; m.tick(s, 1 / 30); assert.equal(s.phase, 'fight');
  s.time = 600; m.tick(s, 1 / 30); assert.equal(s.phase, 'lost');
});
test('the guardian comes out only when the fortress falls, and must fall for the win', () => {
  const plain = m.newSiege(m.freshProgress(), 1); plain.nextWave = 999; plain.hp[1] = 0; m.tick(plain, 1 / 30);
  assert.equal(plain.phase, 'won', 'an act\'s first stages are won with the fortress'); assert.equal(plain.units.filter(u => u.boss).length, 0);
  const s = m.newSiege({ ...m.freshProgress(), unlocked: 5 }, 5); s.nextWave = 999; s.hp[1] = 500; run(s, 1);
  assert.equal(s.units.filter(u => u.boss).length, 0, 'not while the fortress stands');
  s.hp[1] = 0; m.tick(s, 1 / 30);
  assert.equal(s.units.filter(u => u.boss).length, 1); assert.equal(s.phase, 'fight', 'not won while the guardian stands');
  run(s, 2); assert.equal(s.units.filter(u => u.boss).length, 1, 'only once');
  s.units.find(u => u.boss).hp = 0; m.tick(s, 1 / 30); assert.equal(s.phase, 'won');
});
test('no enemy flyers in the first world; they join the waves later on', () => {
  assert.deepEqual(m.foesAt(m.FOE_AIR, 5), [], 'none in world 1'); assert.ok(m.ALLIES.filter(u => u.air).every(u => u.unlock >= 2), 'nor our flyers');
  const s = m.newSiege({ ...m.freshProgress(), unlocked: 7 }, 7); s.hp[0] = 1e9; s.hp[1] = 1e9;
  run(s, 20); assert.equal(s.units.some(u => u.side && m.UNITS[u.id].air), false);
  run(s, 120); assert.ok(s.waves > 0); assert.ok(s.kills + s.units.filter(u => u.side).length > 0);
  const seen = new Set(); for (let i = 0; i < 120 * 30; i++) { m.tick(s, 1 / 30); for (const u of s.units) if (u.side && m.UNITS[u.id].air) seen.add(u.id); if (i % 30 === 0) s.units = s.units.filter(u => !u.side); }
  assert.ok(seen.size > 0);
});
test('Siege Cartoon: six acts of five stages, each with its foes and guardian, saved apart from Siege Legacy', () => {
  assert.equal(m.ACTS, 6); assert.equal(m.STAGES, 5); assert.equal(m.LAST, 30);
  assert.deepEqual([1, 5, 6, 30].map(m.actOf), [1, 1, 2, 6]); assert.deepEqual([1, 5, 6, 30].map(m.stageIn), [1, 5, 1, 5]); assert.deepEqual([4, 5, 30].map(m.guarded), [false, true, true]);
  assert.deepEqual(m.foesAt(m.FOE_LAND, 1), [15], 'the first battle brings one kind of troop'); assert.deepEqual(m.foesAt(m.FOE_LAND, 7), [15, 16, 17, 22, 19]); assert.equal(m.FOE_LAND.length, 6); assert.equal(m.FOE_AIR.length, 6); assert.equal(m.GUARDIAN.length, 6);
  assert.notEqual(m.SAVE_KEY, 'bugHunter.siege.v1');
  for (const id of [...m.FOE_LAND.flat(), ...m.FOE_AIR.flat(), ...m.GUARDIAN]) assert.ok(m.UNITS[id].foe, `foe ${id}`);
  assert.ok(m.ALLIES.every(u => u.unlock >= 1 && u.unlock <= m.ACTS));
  assert.equal(m.newSiege({ ...m.freshProgress(), unlocked: 99 }, 40).world, 30, 'never past the last battle');
  assert.equal(m.readProgress(JSON.stringify({ version: 1, unlocked: 99 })).unlocked, 30);
});
test('rewards are idempotent and unlock only the next world', () => {
  const p = m.freshProgress(), s = m.newSiege(p, 1); assert.equal(m.settle(p, s), 0);
  s.phase = 'won'; assert.equal(m.settle(p, s), 90); assert.equal(m.settle(p, s), 0); assert.equal(p.coins, 90); assert.equal(p.unlocked, 2);
  const repeat = m.newSiege(p, 1); repeat.phase = 'won'; assert.equal(m.settle(p, repeat), 30);
  assert.equal(m.prize(5, true), 195, 'a guardian pays half as much again');
  const defeat = m.newSiege(p, 2); defeat.phase = 'lost'; assert.equal(m.settle(p, defeat), 0); assert.equal(p.unlocked, 2);
  assert.equal(m.newSiege(m.freshProgress(), 9).world, 1);
});
test('workshop validates purchases and persists bonuses', () => {
  const p = m.freshProgress(); assert.equal(m.upgrade(p, 0), false); p.coins = 200;
  assert.equal(m.upgrade(p, 9), false); assert.equal(m.upgrade(p, 0), true); assert.equal(p.coins, 200 - m.UPGRADE_PRICES[0]);
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

test('arrows strike the flyers their path crosses, not those above or behind it', () => {
  const along = m.SCATTER.along; m.SCATTER.along = 0; // the aim exactly, for this geometry
  const fast = m.freshProgress(); fast.upgrades[4] = 5; // a bow that reaches this far
  const s = m.newSiege(fast, 1); s.nextWave = 999; s.gusted = true; s.aim = 1000; s.bowFrom = { x: 150, up: 140 };
  const path = m.flight({ x: 150, y: -140 }, { x: 1000, y: -2 }), mid = 600, height = -path((mid - 150) / 850).y;
  const flyer = (uid, x, alt) => ({ uid, id: 28, side: 1, x, lane: 0, alt, hp: 500, maxHp: 500, damage: 0, attack: 9, flash: 0, boss: false });
  const crossed = flyer(1, mid, height - 20), above = flyer(2, mid, height + 200), walker = { ...flyer(3, mid, 0), id: 15 };
  s.units.push(crossed, above, walker); m.toggleBow(s); m.tick(s, 1 / 30);
  assert.ok(crossed.hp < 500, 'the flyer in its path is hit'); assert.equal(above.hp, 500, 'not one high above it'); assert.equal(walker.hp, 500, 'nor a walker short of where it lands'); m.SCATTER.along = along;
});

test('the bow: a tap starts it, it shoots steadily, stops on a tap or an empty quiver, and refills only while stopped', () => {
  const s = m.newSiege(m.freshProgress(), 1); s.nextWave = 999;
  m.toggleBow(s); m.tick(s, 1 / 30);
  assert.equal(s.effects.filter(e => e.kind === 'arrow').length, 1);
  const every = m.bowEvery(s.bow); run(s, 3); assert.equal(m.bowEvery(s.bow), every, 'always the same speed'); assert.equal(m.bowCount(s.bow), 1, 'and count');
  m.toggleBow(s); const left = s.bow.quiver; assert.equal(s.bow.drawing, false); run(s, 1); assert.ok(s.bow.quiver > left, 'refills while stopped');
  m.toggleBow(s); const before = s.bow.quiver; m.tick(s, 1 / 30); assert.ok(s.bow.quiver < before, 'no refill while shooting');
  for (let i = 0; i < 1800 && s.bow.drawing; i++) m.tick(s, 1 / 30);
  assert.equal(s.bow.drawing, false, 'an empty quiver stops it'); assert.ok(s.bow.quiver < m.BOW.cost + 1);
  const p = m.freshProgress(); p.upgrades[3] = 4; p.upgrades[4] = 4; const up = m.newSiege(p, 1);
  assert.ok(m.bowEvery(up.bow) < m.bowEvery(m.newSiege(m.freshProgress(), 1).bow)); assert.equal(m.bowCount(up.bow), 3, 'the shop\'s Bow level adds arrows');
  p.upgrades[3] = 5; assert.equal(m.bowCount(m.newSiege(p, 1).bow), 4);
});
test('a volley lands spread out, not in one line', () => {
  const p = m.freshProgress(); p.upgrades[3] = 5; const s = m.newSiege(p, 1); s.nextWave = 999; s.aim = 900;
  m.toggleBow(s); m.tick(s, 1 / 30); const shots = s.effects.filter(e => e.kind === 'arrow');
  assert.ok(shots.length > 1); assert.ok(new Set(shots.map(e => e.up)).size > 1 || new Set(shots.map(e => Math.round(e.x - 900) % 24)).size > 1, 'arrows stray along and in depth');
  for (const e of shots) assert.ok(Math.abs(e.x - 900) <= m.SCATTER.along + 2 * m.BOW.gap, 'but stay near the aim');
});
test('only some troops reach the air, and only some flyers the ground; armies keep six of each', () => {
  assert.equal(m.canHit(0, 28), false, 'a swordsman cannot reach an eagle'); assert.equal(m.canHit(2, 28), false, 'nor a rock thrower');
  assert.equal(m.canHit(9, 28), false, 'the heavy armed robot at first neither'); assert.equal(m.specAt(9, 3).hitsAir, true, 'but from its third form');
  assert.equal(m.canHit(28, 0), false, 'an eagle fights only in the sky'); assert.equal(m.canHit(10, 15), false, 'so does our aircraft fighter');
  assert.equal(m.canHit(10, 28), true, 'flyers fight each other'); assert.equal(m.canHit(12, 15), true, 'the helicopter strikes the ground'); assert.equal(m.canHit(27, 0), true, 'and so does the death angel');
  const s = m.newSiege(m.freshProgress(), 1); s.nextWave = 999; s.deck.push(12); s.energy = 999;
  assert.equal(m.summon(s, 12), true); const plane = s.units[0]; plane.x = 500;
  const foe = { ...plane, uid: 100, id: 15, side: 1, x: 520, hp: 9999, maxHp: 9999, damage: 50 };
  s.units.push(foe); run(s, 2); assert.equal(plane.hp, plane.maxHp, 'the enemy swordsman never hits it'); assert.ok(foe.hp < 9999);
  const p = m.readProgress(JSON.stringify({ version: 1, unlocked: 30, cards: 1, owned: m.ALLIES.map(u => u.id), deck: [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 33, 20, 31] }));
  assert.equal(m.DECK, 6); assert.equal(p.deck.filter(id => !m.UNITS[id].air).length, 6); assert.equal(p.deck.filter(id => m.UNITS[id].air).length, 6);
  assert.equal(p.deck.some(id => m.UNITS[id].foe), false, 'never an enemy troop');
});
test('the missile blasts the aim and recharges', () => {
  const s = m.newSiege(m.freshProgress(), 1); s.aim = 600;
  s.units.push({ uid: 1, id: 0, side: 1, x: 620, lane: 0, hp: 200, maxHp: 200, damage: 0, attack: 0, flash: 0, boss: false });
  assert.equal(m.missile(s), true); assert.ok(s.units[0].hp < 200); assert.equal(m.missile(s), false);
  run(s, m.ROCKET.every + 0.1); assert.equal(m.missile(s), true);
});
test('every troop id is its place in the list; ours are 16 land and 9 air, the enemy\'s are theirs only', () => {
  m.UNITS.forEach((u, i) => assert.equal(u.id, i));
  assert.equal(m.ALLIES.filter(u => !u.air).length, 16); assert.equal(m.ALLIES.filter(u => u.air).length, 9);
  const p = m.freshProgress(); p.levels[33] = 6; assert.equal(m.readProgress(JSON.stringify(p)).levels[33], 6, 'a troop appended after the enemy keeps its level');
  const foes = m.UNITS.filter(u => u.foe); assert.ok(foes.length >= 18);
  const s = m.newSiege(m.freshProgress(), 1); s.energy = 999; s.deck.push(15);
  assert.equal(m.summon(s, 15), false, 'an enemy troop cannot be summoned');
  for (const lists of [m.FOE_LAND, m.FOE_AIR]) for (const id of lists.flat()) assert.ok(m.UNITS[id].foe && !!m.UNITS[id].air === (lists === m.FOE_AIR));
});
test('a heavy blow throws infantry back, stuns the rest, and never moves the steady dragon rider', () => {
  const s = m.newSiege(m.freshProgress(), 1); s.nextWave = 999;
  const at = (id, x, side, extra = {}) => ({ uid: 900 + id + side * 50, id, side, x, lane: 0, hp: 100, maxHp: 100, damage: 0, attack: 9, flash: 0, boss: false, ...extra });
  const hammer = at(20, 560, 1, { damage: 60, attack: 0 });
  const soldier = at(0, 520, 0); s.units.push(soldier, hammer);
  m.tick(s, 1 / 30); assert.ok(soldier.knock > 0, 'infantry knocked'); const x = soldier.x; run(s, 0.3); assert.ok(soldier.x < x, 'flies back');
  run(s, 1); assert.equal(soldier.knock, 0, 'and gets up');
  const t = m.newSiege(m.freshProgress(), 1); t.nextWave = 999;
  const robot = at(8, 520, 0), heavy = at(20, 560, 1, { damage: 60, attack: 0 }); t.units.push(robot, heavy);
  m.tick(t, 1 / 30); assert.ok(robot.stun > 0 && !robot.knock, 'a robot is stunned, not thrown');
  const u = m.newSiege(m.freshProgress(), 1); u.nextWave = 999;
  const rider = at(31, 560, 1), gunner = at(12, 400, 0, { damage: 80, attack: 0 }); u.units.push(rider, gunner);
  m.tick(u, 1 / 30); assert.ok(rider.hp < 100); assert.ok(!rider.knock && !rider.stun, 'the red dragon rider cannot be stunned');
});
test('gatling robots break twice into weaker wrecks; horned gunners come later and hit harder', () => {
  const open = { ...m.freshProgress(), unlocked: m.LAST };
  const s = m.newSiege(open, 6); s.nextWave = 999; assert.equal(s.world, 6);
  s.units.push({ uid: 50, id: 32, side: 1, x: 900, lane: 0, hp: 0, maxHp: 400, damage: 40, attack: 0, flash: 0, boss: false });
  m.tick(s, 1 / 30); let wreck = s.units.find(u => u.side);
  assert.equal(wreck.stage, 1); assert.equal(wreck.maxHp, 400 * m.SPLIT.hp); assert.ok(wreck.damage < 40);
  wreck.hp = 0; m.tick(s, 1 / 30); wreck = s.units.find(u => u.side); assert.equal(wreck.stage, 2);
  wreck.hp = 0; m.tick(s, 1 / 30); assert.equal(s.units.filter(u => u.side).length, 0, 'gone after its second break');
  const other = m.newSiege(m.freshProgress(), 1); other.nextWave = 999;
  other.units.push({ uid: 50, id: 18, side: 1, x: 900, lane: 0, hp: 0, maxHp: 400, damage: 40, attack: 0, flash: 0, boss: false });
  m.tick(other, 1 / 30); assert.equal(other.units.length, 0, 'only gatling robots break');
  const late = m.newSiege(open, 7); late.hp[0] = late.hp[1] = 1e9;
  // (Enemies are cleared every second, as if fought off, so the waves keep coming instead of filling the field.)
  let elite = null; for (let i = 0; i < 300 * 30 && !elite; i++) { m.tick(late, 1 / 30); elite = late.units.find(u => u.elite); if (i % 30 === 0) late.units = late.units.filter(u => !u.side); }
  assert.ok(elite, 'an elite shooter comes'); assert.ok(late.time >= m.ELITE.from); assert.equal(elite.id, m.ELITE_ID);
});
test('troop levels: bought in order with gold, saved, and the master swordsman hits harder and reaches flyers', () => {
  const p = m.freshProgress(); assert.equal(p.levels[0], 1); assert.equal(m.levelsOf(0), 5);
  assert.equal(m.levelUp(p, 0), false, 'no gold'); p.coins = 5000;
  for (const price of [120, 300, 400, 2000]) { assert.equal(m.levelPrice(p, 0), price); assert.equal(m.levelUp(p, 0), true); }
  assert.equal(p.levels[0], 5); assert.equal(m.levelUp(p, 0), false, 'at its last form'); assert.equal(p.coins, 5000 - 2820);
  assert.equal(m.levelUp(p, 15), false, 'never an enemy troop');
  assert.equal(m.readProgress(JSON.stringify({ ...p, levels: [99, -3] })).levels[0], 5, 'clamped to its forms');
  const s = m.newSiege(p, 1); s.nextWave = 999; s.energy = 999;
  s.deck = [m.card(0, 5)]; assert.equal(m.costOf(s, m.card(0, 5)), m.specAt(0, 5).cost); assert.equal(m.summon(s, m.card(0, 5)), true);
  const master = s.units[0]; assert.equal(master.lv, 5); assert.ok(master.maxHp > m.UNITS[0].hp);
  master.x = 500; const eagle = { uid: 99, id: 28, side: 1, x: 530, lane: 0, hp: 9999, maxHp: 9999, damage: 0, attack: 9, flash: 0, boss: false };
  s.units.push(eagle); run(s, 1); assert.ok(eagle.hp < 9999, 'the master reaches a flyer');
  const plain = m.newSiege(m.freshProgress(), 1); plain.nextWave = 999; m.summon(plain, 0); plain.units[0].x = 500;
  const eagle2 = { ...eagle, hp: 9999, flash: 0 }; plain.units.push(eagle2); run(plain, 1); assert.equal(eagle2.hp, 9999, 'the first form does not');
});
test('troop sounds: each attack and each death is heard as its weapon and body', () => {
  const s = m.newSiege({ ...m.freshProgress(), levels: [1, 5, 1, 1, 4] }, 1); s.nextWave = 999;
  const at = (id, x, side, extra = {}) => ({ uid: 300 + id + side * 50, id, side, x, lane: 0, hp: 100, maxHp: 100, damage: 5, attack: 0, flash: 0, boss: false, ...extra });
  s.units.push(at(4, 500, 0, { lv: 4 }), at(17, 560, 1, { hp: 1 }));
  m.tick(s, 1 / 30);
  const kinds = s.sounds.map(x => x.k);
  assert.ok(kinds.includes('sniper'), 'a level 4 gunner fires a sniper rifle');
  assert.ok(kinds.includes('die-beast'), 'the dog dies as a beast');
  assert.deepEqual(m.soundsOf(at(1, 0, 0, { lv: 5 })), ['pierce', 'die-horse']);
  assert.deepEqual(m.soundsOf(at(6, 0, 0, { lv: 3 })), ['meteor', 'die-man']);
  assert.deepEqual(m.soundsOf(at(0, 0, 0, { lv: 1 })), ['blunt', 'die-man']);
  for (let i = 0; i < 60; i++) { s.units.push(at(15, 520, 1, { uid: 900 + i, hp: 0 })); m.tick(s, 1 / 30); }
  assert.ok(s.sounds.length <= 24, 'the queue stays short');
});
test('recruiting: the swordsman first, the rest bought with gold once their act opens; enemies drop gold, kept even in defeat', () => {
  const p = m.freshProgress(); assert.deepEqual(p.owned, [0]); assert.deepEqual(p.deck, [0]);
  assert.equal(m.buyTroop(p, 1), false, 'no gold'); p.coins = 1000;
  assert.equal(m.buyTroop(p, 5), false, 'its act is not open'); assert.equal(m.buyTroop(p, 15), false, 'never an enemy');
  assert.equal(m.buyTroop(p, 1), true); assert.equal(p.coins, 1000 - m.troopPrice(1)); assert.deepEqual(p.deck, [0, 1]); assert.equal(m.buyTroop(p, 1), false, 'once');
  assert.equal(m.levelUp(p, 2), false, 'not before it is recruited');
  const s = m.newSiege(p, 1); s.nextWave = 999;
  s.units.push({ uid: 90, id: 15, side: 1, x: 900, lane: 0, hp: 0, maxHp: 100, damage: 1, attack: 9, flash: 0, boss: false });
  m.tick(s, 1 / 30); assert.equal(s.loot, m.dropOf({ id: 15, boss: false }));
  s.hp[0] = 0; m.tick(s, 1 / 30); const coins = p.coins; m.settle(p, s); assert.equal(p.coins, coins + s.loot, 'lost, but the gold is kept');
  // After the first battle won, a second troop is within reach.
  const q = m.freshProgress(), first = m.newSiege(q, 1); first.phase = 'won'; first.loot = 20; m.settle(q, first);
  assert.ok(q.coins >= Math.min(m.troopPrice(1), m.troopPrice(2)));
});
test('army cards: two forms of one troop in the army at once, each its own card; an old save keeps its troops\' levels', () => {
  const p = m.freshProgress(); p.owned = [0, 1]; p.levels[0] = 3; p.levels[1] = 2;
  assert.equal(m.hasCard(p, m.card(0, 2)), true); assert.equal(m.hasCard(p, m.card(0, 4)), false, 'not a level not bought'); assert.equal(m.hasCard(p, m.card(2, 1)), false, 'not a troop not recruited');
  p.deck = [m.card(0, 1), m.card(0, 3)]; const restored = m.readProgress(JSON.stringify(p)); assert.deepEqual(restored.deck, [0, 200]);
  const old = m.readProgress(JSON.stringify({ version: 1, unlocked: 5, owned: [0, 1], levels: [3, 2], deck: [0, 1] }));
  assert.deepEqual(old.deck, [m.card(0, 3), m.card(1, 2)], 'ids from before cards mean the troop at its level then');
  const s = m.newSiege(restored, 1); s.nextWave = 999; s.energy = 999;
  assert.equal(m.summon(s, 0), true); assert.equal(m.summon(s, 200), true, 'its own cooldown'); assert.equal(m.summon(s, 0), false);
  assert.deepEqual(s.units.map(u => u.lv), [1, 3]);
});
test('testing switch: every troop open, recruited and levelled for free', () => {
  m.testing.free = true;
  try {
    const p = m.freshProgress(); assert.equal(p.coins, 0);
    assert.equal(m.buyTroop(p, 14), true, 'the dearest, at act 1, with no gold'); assert.equal(m.levelUp(p, 14), true); assert.equal(p.coins, 0);
  } finally { m.testing.free = false; }
});
test('the corrupt wind: at half the fortress\'s health, once, it blows our troops back and a horde comes; the fallen give gold and energy', () => {
  const s = m.newSiege(m.freshProgress(), 1); s.nextWave = 999; s.energy = 999; m.summon(s, 0); const troop = s.units[0]; troop.x = 900;
  s.hp[1] = s.maxHp[1] * 0.6; m.tick(s, 1 / 30); assert.equal(s.gusted ?? false, false, 'not yet');
  s.hp[1] = s.maxHp[1] * 0.5; m.tick(s, 1 / 30);
  assert.equal(s.gusted, true); assert.ok(troop.blown > 0); assert.equal(s.units.filter(u => u.side).length, m.hordeOf(1).weak + m.hordeOf(1).strong); assert.ok(m.hordeOf(30).weak > m.hordeOf(1).weak);
  const x = troop.x; run(s, 0.5); assert.ok(troop.x < x - 100, 'blown back');
  const count = s.units.filter(u => u.side).length; s.hp[1] = s.maxHp[1] * 0.2; m.tick(s, 1 / 30); assert.equal(s.units.filter(u => u.side).length, count, 'only once');
  const t = m.newSiege(m.freshProgress(), 1); t.nextWave = 999; t.gusted = true; t.energy = 0;
  t.units.push({ uid: 90, id: 18, side: 1, x: 900, lane: 0, hp: 0, maxHp: 480, damage: 1, attack: 9, flash: 0, boss: false });
  t.units.push({ uid: 91, id: 15, side: 1, x: 900, lane: 0, hp: 0, maxHp: 115, damage: 1, attack: 9, flash: 0, boss: false });
  m.tick(t, 1 / 30); assert.ok(t.energy > 0, 'energy for the fallen');
  assert.ok(m.dropOf({ id: 18 }) > 3 * m.dropOf({ id: 15 }), 'a bear is worth far more than a swordsman');
  const late = m.newSiege({ ...m.freshProgress(), unlocked: m.LAST }, m.LAST); late.nextWave = 0; m.tick(late, 1 / 30);
  assert.ok(late.units.find(u => u.side).grow > 1.25, 'the last battle\'s enemies are bigger');
});
test('special powers: bought with gold by act, any bought form goes in the kit (four), saves are sanitised', () => {
  const p = m.freshProgress(); p.coins = 9000;
  assert.equal(m.buyPower(p, 2), false, 'tsunami is not open in act 1');
  assert.equal(m.buyPower(p, 0), true); assert.equal(p.powers[0], 1); assert.deepEqual(p.kit, [m.powerCard(0, 1)]); assert.equal(p.coins, 9000 - m.POWERS[0].price);
  assert.equal(m.buyPower(p, 0), true); assert.equal(p.powers[0], 2, 'the next form'); assert.ok(p.kit.includes(m.powerCard(0, 1)) && p.kit.includes(m.powerCard(0, 2)), 'the earlier form stays and can be used with the new one');
  assert.equal(m.toggleKit(p, 0, 1), true); assert.ok(!p.kit.includes(m.powerCard(0, 1)), 'taken out'); assert.equal(m.toggleKit(p, 0, 1), true); assert.ok(p.kit.includes(m.powerCard(0, 1)), 'and back in');
  assert.equal(m.toggleKit(p, 0, 3), false, 'a form not bought yet cannot go in');
  for (let i = 0; i < 5; i++) m.buyPower(p, 0); assert.equal(p.powers[0], m.POWERS[0].forms.length, 'no further than the last form');
  assert.equal(p.kit.length, m.KIT, 'the kit holds four'); assert.equal(m.toggleKit(p, 0, 1), true); assert.equal(m.toggleKit(p, 0, 1), true, 'out and back in'); 
  p.unlocked = 30; p.coins = 99999; m.buyPower(p, 1); assert.equal(p.kit.length, m.KIT, 'a full kit takes no more by itself'); assert.equal(m.toggleKit(p, 1, 1), false, 'full');
  const back = m.readProgress(JSON.stringify({ ...p, powers: [99, -4, 'x', 2], kit: [0, 0, 100, 900, 1, 'a', 3, 301, 200] }));
  assert.equal(back.powers[0], m.POWERS[0].forms.length); assert.equal(back.powers[1], 0);
  assert.ok(back.kit.length <= m.KIT && back.kit.every(c => m.hasPower(back, c)), 'only bought forms stay'); assert.ok(!back.kit.includes(1) && !back.kit.includes(900) && back.kit.includes(200));
  assert.equal(m.readProgress('{"version":1}').powers.length, m.POWERS.length, 'an older save has none');
});
test('special powers cover the stretch of field on screen, then recharge', () => {
  for (const id of [0, 1, 2, 3]) {
    const p = m.freshProgress(); p.unlocked = 30; p.coins = 99999; m.buyPower(p, id);
    const s = m.newSiege(p, 1); s.view = { x: 500, width: 700 };
    const foes = [300, 600, 900, 1150, 1500].map((x, i) => { const u = { ...s.units[0] ?? { id: 0, lane: 0, uid: 0, damage: 0, attack: 9, flash: 0, boss: false }, uid: 100 + i, side: 1, x, hp: 4000, maxHp: 4000, damage: 0, attack: 99 }; s.units.push(u); return u; });
    assert.equal(m.castPower(s, id), true); assert.equal(s.energy, 80, 'it costs no energy'); assert.equal(m.castPower(s, id), false, 'it recharges first');
    const fx = s.effects.filter(e => e.kind !== 'wave'); for (const e of fx) assert.ok(e.x >= 500 && e.x <= 1200, `${id}: every blow lands on screen (${e.x})`);
    run(s, 4);
    assert.ok(foes[1].hp < 4000 && foes[2].hp < 4000 && foes[3].hp < 4000, `${id}: the enemies on screen are hurt`);
    assert.equal(foes[0].hp, 4000, `${id}: not those off the left`); assert.equal(foes[4].hp, 4000, `${id}: nor off the right`);
    s.kitCd[id] = 0; assert.equal(m.castPower(s, id), true);
  }
});
test('the tsunami throws the enemy back; ice and lightning freeze or stun; an unbought power cannot be cast', () => {
  const p = m.freshProgress(); p.unlocked = 30; p.coins = 99999; m.buyPower(p, 2); m.buyPower(p, 2); m.buyPower(p, 2);
  const s = m.newSiege(p, 1); s.view = { x: 400, width: 700 }; m.summon(s, 0);
  const foe = { ...s.units[0], uid: 50, side: 1, x: 700, hp: 9000, maxHp: 9000, damage: 0 }; s.units.push(foe); s.units[0].x = 150;
  assert.equal(m.castPower(s, 0), false, 'the arrow rain is not in the kit');
  assert.equal(m.castPower(s, 2), true); run(s, 3); assert.ok(foe.x > 800, `pushed back (${foe.x})`);
});
test('an upgraded power still casts its earlier form, with its own recharge', () => {
  const p = m.freshProgress(); p.coins = 9000; m.buyPower(p, 0); m.buyPower(p, 0);
  const s = m.newSiege(p, 1); s.view = { x: 300, width: 700 };
  assert.equal(m.castPower(s, m.powerCard(0, 1)), true); assert.equal(m.castPower(s, m.powerCard(0, 2)), true, 'the other form is not on the same recharge'); assert.equal(m.castPower(s, m.powerCard(0, 1)), false);
  assert.equal(m.castPower(s, m.powerCard(0, 3)), false, 'a form not in the kit');
});
test('the free test mode: free base upgrades, free powers and troops, endless energy in battle', () => {
  m.testing.free = true;
  try {
    const p = m.freshProgress(); p.coins = 0;
    assert.equal(m.upgrade(p, 1), true); assert.equal(p.upgrades[1], 1, 'a base upgrade costs nothing'); assert.equal(p.coins, 0);
    assert.equal(m.buyPower(p, 3), true, 'an unopened power too'); assert.equal(m.buyPower(p, 3), true); assert.equal(m.buyTroop(p, 5), true);
    const s = m.newSiege(p, 1); s.energy = 0; run(s, 1); assert.equal(s.energy, m.energyMax(s), 'the energy is always full');
    m.summon(s, 0); assert.ok(s.units.length >= 1); run(s, 0.1); assert.equal(s.energy, m.energyMax(s), 'and refills at once');
  } finally { m.testing.free = false; }
  const q = m.freshProgress(); assert.equal(m.upgrade(q, 1), false, 'not free once the mode is off');
});
test('our arrows pass over our own troops and strike the enemy', () => {
  const s = m.newSiege(m.freshProgress(), 1); m.summon(s, 0); const u = s.units[0]; u.hp = u.maxHp = 500; s.aim = u.x; m.draw(s, true); m.tick(s, 1 / 30);
  const foe = { ...u, uid: 77, side: 1, hp: 500, maxHp: 500, damage: 0 }; s.units.push(foe); s.bow.next = 0; m.tick(s, 1 / 30);
  assert.equal(u.hp, 500, 'no friendly fire'); assert.ok(foe.hp < 500, 'the enemy is struck');
});
test('every troop grows with its level, and the archangel sweeps everything ahead of it far back', () => {
  for (const u of m.ALLIES) for (let l = 2; l <= m.levelsOf(u.id); l++) assert.ok(m.specAt(u.id, l).size >= m.specAt(u.id, l - 1).size, `${u.id} level ${l} is not smaller than level ${l - 1}`);
  const p = m.freshProgress(); p.unlocked = 30; p.owned = [14]; p.levels[14] = 3; const s = m.newSiege(p, 30); s.deck = [m.card(14, 3)]; s.energy = 999; assert.equal(m.summon(s, m.card(14, 3)), true);
  const angel = s.units[0]; angel.x = 600; const foes = [700, 760, 820, 1100].map((x, i) => { const f = { ...angel, uid: 50 + i, id: 15, side: 1, x, hp: 900, maxHp: 900, damage: 0, attack: 99 }; s.units.push(f); return f; });
  run(s, 0.3);
  assert.ok(foes.slice(0, 3).every(f => f.hp < 900), 'all those in front within reach are struck'); assert.equal(foes[3].hp, 900, 'not the far one');
  run(s, 0.5); assert.ok(foes.slice(0, 3).every(f => f.x > 800) || foes.every(f => f.x > 760), 'and thrown back');
});
test('ground troops with bows, guns, rockets, rays and spells reach flyers; close weapons, flames and thrown rocks do not', () => {
  const air = (id, lv) => !!m.specAt(id, lv).hitsAir;
  for (const [id, lv] of [[2, 3], [2, 4], [4, 2], [4, 3], [4, 4], [5, 1], [5, 2], [5, 3], [6, 2], [6, 3], [8, 2], [8, 3], [9, 2], [9, 3], [0, 5]]) assert.ok(air(id, lv), `troop ${id} form ${lv} reaches flyers`);
  for (const [id, lv] of [[0, 1], [0, 4], [1, 1], [1, 5], [2, 1], [2, 2], [3, 1], [3, 4], [4, 1], [5, 4], [6, 1], [8, 1], [7, 1], [7, 2]]) assert.ok(!air(id, lv), `troop ${id} form ${lv} does not`);
  for (const id of [22, 23, 24, 32]) assert.ok(m.canHit(id, 10), `enemy ${id} shoots at flyers`);
  for (const id of [15, 16, 17, 18, 20, 21, 25]) assert.ok(!m.canHit(id, 10), `enemy ${id} cannot`);
});
test('every guardian reaches flyers and its blows throw our flyers back', () => {
  for (const id of m.GUARDIAN) assert.ok(m.canHit(id, 10), `guardian ${id} reaches flyers`);
  const s = m.newSiege(m.freshProgress(), 5); const boss = { id: m.GUARDIAN[0], side: 1, uid: 70, x: 900, lane: 1, hp: 4000, maxHp: 4000, damage: 50, attack: 0, flash: 0, boss: true };
  const flyer = { id: 10, side: 0, uid: 71, x: 860, lane: 1, hp: 3000, maxHp: 3000, damage: 0, attack: 99, flash: 0, boss: false, alt: 70 };
  s.units.push(boss, flyer); s.bossSpawned = true; s.gusted = true; m.tick(s, 1 / 30); run(s, 0.4);
  assert.ok(flyer.hp < 3000, 'struck'); assert.ok(flyer.x < 860, 'and thrown back');
});
test('an arrow passing through a tall enemy on the ground hits it; it flies over a short one', () => {
  const s = m.newSiege(m.freshProgress(), 1); s.bowFrom = { x: 150, up: 140 }; s.aim = 900;
  const along = m.SCATTER.along, deep = m.SCATTER.deep; m.SCATTER.along = 0; m.SCATTER.deep = 0;
  const mk = (uid, id, x, boss) => ({ uid, id, side: 1, x, lane: 1, hp: 5000, maxHp: 5000, damage: 0, attack: 99, flash: 0, boss, grow: 1 });
  const tall = mk(1, m.GUARDIAN[5], 860, true), short = mk(2, 17, 400, false); s.units.push(tall, short);
  m.draw(s, true); m.tick(s, 1 / 30); m.draw(s, false);
  m.SCATTER.along = along; m.SCATTER.deep = deep;
  assert.ok(tall.hp < 5000, 'the tall one, short of where it lands, is hit in the head'); assert.equal(short.hp, 5000, 'the short one far before is flown over');
});
test('walkers strike a flyer only once it has swooped down to fight on the ground', () => {
  const s = m.newSiege(m.freshProgress(), 1); s.nextWave = 999; s.gusted = true;
  m.summon(s, 0); const sw = s.units[0]; sw.x = 600; sw.hp = sw.maxHp = 9000;
  const high = { uid: 80, id: 28, side: 1, x: 640, lane: 1, hp: 500, maxHp: 500, damage: 0, attack: 99, flash: 0, boss: false, alt: 70 };
  s.units.push(high); run(s, 1);
  assert.equal(high.hp, 500, 'a sky-only flyer up high is out of a swordsman reach');
  const diver = { uid: 81, id: 27, side: 1, x: 640, lane: 1, hp: 500, maxHp: 500, damage: 1, attack: 0, flash: 0, boss: false, alt: 70 };
  s.units = [sw, diver]; run(s, 2);
  assert.ok(diver.alt <= 32, 'the death angel swoops down to strike'); assert.ok(diver.hp < 500, 'and the swordsman hits it back');
});
test('the armed flyer shoots ground troops from above, and the enemy walkers below cannot reach it', () => {
  const s = m.newSiege({ ...m.freshProgress(), owned: [0, 11], deck: [11] }, 1); s.nextWave = 999; s.gusted = true; s.energy = 999;
  assert.equal(m.summon(s, 11), true); const gun = s.units[0]; gun.x = 600; gun.hp = gun.maxHp = 9000;
  const foe = { uid: 90, id: 15, side: 1, x: 640, lane: 1, hp: 500, maxHp: 500, damage: 50, attack: 0, flash: 0, boss: false };
  s.units.push(foe); run(s, 3);
  assert.ok(foe.hp < 500, 'it shoots down at the walker'); assert.equal(gun.hp, 9000, 'the walker cannot hit it up there');
});
test('every robot hits an area, at every level', () => {
  for (const id of [8, 9, 32, 33, 35]) for (const f of m.UNITS[id].forms ?? [m.UNITS[id]]) assert.ok((f.splash ?? m.UNITS[id].splash ?? 0) > 0, `${m.UNITS[id].name ?? id}`);
});
test('every troop level has its own shop description in both languages', async () => {
  const src = (await import('node:fs')).readFileSync('bug-hunter/src/strings.ts', 'utf8'); const i = src.indexOf('const es');
  for (const u of m.ALLIES) for (let l = 1; l <= m.levelsOf(m.UNITS.indexOf(u)); l++) {
    const k = `siegeRole${m.UNITS.indexOf(u)}L${l}:`; assert.ok(src.slice(0, i).includes(k) && src.slice(i).includes(k), k);
  }
});
test('the bow\'s three upgrades: power, speed (and reach) and quiver, each on its own', () => {
  const base = m.newSiege(m.freshProgress(), 1).bow;
  const only = i => { const p = m.freshProgress(); p.upgrades[i] = 5; return m.newSiege(p, 1).bow; };
  const power = only(3), speed = only(4), quiver = only(5);
  assert.ok(m.bowDamage(power) > m.bowDamage(base) && m.bowCount(power) > m.bowCount(base)); assert.equal(m.bowEvery(power), m.bowEvery(base), 'power does not shoot faster');
  assert.ok(m.bowEvery(speed) < m.bowEvery(base) && m.bowReach(speed) > m.bowReach(base)); assert.equal(m.bowDamage(speed), m.bowDamage(base), 'speed does not hit harder');
  assert.ok(m.bowMax(quiver) > m.bowMax(base) && m.bowRegen(quiver) > m.bowRegen(base)); assert.equal(quiver.quiver, m.bowMax(quiver), 'it starts full');
  const s = m.newSiege(m.freshProgress(), 1); s.aim = 2000; m.tick(s, 1 / 30); assert.equal(s.aim, m.bowReach(s.bow), 'the aim stops at the bow\'s reach');
  const p = m.freshProgress(); p.coins = 9999; for (let i = 0; i < m.UPGRADES; i++) assert.equal(m.upgrade(p, i), true); assert.equal(m.upgrade(p, m.UPGRADES), false);
});
test('the mana pool upgrade raises the energy a battle can hold from the start', () => {
  const p = m.freshProgress(), plain = m.energyMax(m.newSiege(p, 1)); p.upgrades[6] = 5;
  const s = m.newSiege(p, 1); assert.equal(m.energyMax(s), plain + 5 * m.MANA_STEP);
  s.generator = 1; assert.equal(m.energyMax(s), plain + 5 * m.MANA_STEP + 70, 'the generator still adds on top');
});
test('the discharge lands at the aim, costs energy and waits for enough of it', () => {
  const s = m.newSiege(m.freshProgress(), 1); s.nextWave = 999; s.aim = 900; s.energy = m.STRIKE_COST - 1;
  assert.equal(m.strike(s), false, 'not without the energy');
  s.energy = 200; assert.equal(m.strike(s), true); assert.equal(s.energy, 200 - m.STRIKE_COST);
  assert.ok(s.effects.some(e => e.kind === 'zap' && Math.abs(e.x - 900) <= 60), 'its lightning falls where the bow aims');
});
test('flyers cruise at heights by kind: people low, machines higher, the helicopter and angels highest', () => {
  const at = id => m.highOf({ id, side: m.UNITS[id].foe ? 1 : 0 });
  assert.equal(at(12), at(14), 'the helicopter and the angels at the top'); assert.ok(at(33) < at(12) && at(33) > at(10), 'the mech between them and the people');
  for (const id of [10, 11, 28, 29, 30, 31]) assert.ok(at(id) > 32 && at(id) < at(33), `${id} flies low, as before, out of walkers' reach`);
});
test('a troop form recharges a second for every 10 energy it costs, 2 to 30 s', () => {
  assert.equal(m.cooldownOf(0, 1), 2); assert.equal(m.cooldownOf(0, 5), 20, 'the master swordsman cannot be sent over and over');
  assert.equal(m.cooldownOf(9, 4), 30, 'capped'); assert.equal(m.cooldownOf(6, 3), 17);
  const s = m.newSiege({ ...m.freshProgress(), owned: [0], levels: [5], deck: [400] }, 1); s.energy = 999;
  assert.equal(m.summon(s, 400), true); assert.equal(s.cooldowns[400], 20);
});
test('flyers that shoot stay up at their height to fire on walkers; close fighters drop to strike', () => {
  const s = m.newSiege({ ...m.freshProgress(), owned: [0, 12, 13], deck: [12, 13] }, 1); s.nextWave = 999; s.gusted = true; s.energy = 999;
  m.summon(s, 12); m.summon(s, 13);
  const heli = s.units.find(u => u.id === 12), fighter = s.units.find(u => u.id === 13);
  for (const u of [heli, fighter]) { u.x = 600; u.hp = u.maxHp = 9000; }
  s.units.push({ uid: 99, id: 15, side: 1, x: 640, lane: 1, hp: 9000, maxHp: 9000, damage: 0, attack: 99, flash: 0, boss: false });
  let lowest = 999; for (let i = 0; i < 90; i++) { m.tick(s, 1 / 30); lowest = Math.min(lowest, fighter.alt ?? 999); }
  assert.ok(heli.alt >= m.highOf(heli) - 1, 'the helicopter never comes low'); assert.ok(lowest <= 40, 'the drill swoops');
});
test('the drill scoops: it dives, drives what it hits back rushing along with it, and stays low before it climbs', () => {
  const s = m.newSiege({ ...m.freshProgress(), owned: [0, 13], deck: [13] }, 1); s.nextWave = 999; s.gusted = true; s.energy = 999;
  m.summon(s, 13); const drill = s.units.find(u => u.id === 13); drill.x = 600; drill.hp = drill.maxHp = 9000;
  const foe = { uid: 99, id: 15, side: 1, x: 640, lane: 1, hp: 9000, maxHp: 9000, damage: 0, attack: 99, flash: 0, boss: false }; s.units.push(foe);
  let lunged = false;
  for (let i = 0; i < 90 && !lunged; i++) { m.tick(s, 1 / 30); if (drill.lunge) lunged = true; }
  assert.ok(lunged, 'the drill lunges on its blow'); assert.ok(drill.alt <= 40, 'it struck from low');
  const dx = drill.x, fx = foe.x; run(s, m.KNOCK.time);
  assert.ok(drill.x > dx + 40 && drill.x < foe.x - 20, 'the drill rushes forward, short of where its target lands'); assert.ok(foe.x > fx + 60, 'its target is driven back'); assert.ok(drill.alt <= 40, 'and it is still low');
  run(s, m.RAM.low - 0.1); assert.ok(drill.alt <= 40, 'low for a while'); run(s, 0.6); assert.ok(drill.alt > 60 || drill.lunge || drill.low, 'then it climbs, unless it is on the next blow');
});
test('the gold drill scoops two at once, the first drill one', () => {
  for (const [level, expected] of [[1, 1], [2, 2]]) {
    const levels = Array(14).fill(1); levels[13] = level;
    const s = m.newSiege({ ...m.freshProgress(), owned: [0, 13], levels, deck: [m.card(13, level)] }, 1); s.nextWave = 999; s.gusted = true; s.energy = 999;
    m.summon(s, m.card(13, level)); const drill = s.units.find(u => u.id === 13); drill.x = 600; drill.hp = drill.maxHp = 9000;
    const foes = [640, 655, 670].map((x, i) => ({ uid: 90 + i, id: 15, side: 1, x, lane: 1, hp: 9000, maxHp: 9000, damage: 0, attack: 99, flash: 0, boss: false })); s.units.push(...foes);
    for (let i = 0; i < 90 && !drill.lunge; i++) m.tick(s, 1 / 30);
    assert.equal(foes.filter(f => f.hp < 9000).length, expected, `level ${level} scoops ${expected}`);
  }
});
test('the tiger pounces: it leaps on its prey, strikes as it lands, then bounds back', () => {
  const s = m.newSiege({ ...m.freshProgress(), owned: [0], deck: [0] }, 1); s.nextWave = 999; s.gusted = true; s.energy = 999;
  m.summon(s, 0); const prey = s.units.find(u => !u.side); prey.x = 600; prey.hp = prey.maxHp = 9000; prey.attack = 99;
  const tiger = { uid: 99, id: 25, side: 1, x: 645, lane: 1, hp: 9000, maxHp: 9000, damage: 36, attack: 0, flash: 0, boss: false }; s.units.push(tiger);
  let leapt = false; for (let i = 0; i < 60 && !leapt; i++) { m.tick(s, 1 / 30); if (tiger.leap) leapt = true; }
  assert.ok(leapt, 'it leaps'); const from = tiger.x; assert.equal(prey.hp, 9000, 'no blow before it lands');
  run(s, m.POUNCE.time + 0.04); assert.ok(tiger.x < from - 30, 'it leaps forward'); assert.ok(prey.hp < 9000, 'the blow lands with it'); assert.ok(tiger.bound > 0, 'then it bounds back');
  run(s, m.POUNCE.time); assert.ok(Math.abs(tiger.x - from) < 3, 'the same leap back: it lands where it started');
});
test('the rhinoceratops charges: it rushes in, throws its target back and stands dazed', () => {
  const s = m.newSiege({ ...m.freshProgress(), owned: [0], deck: [0] }, 1); s.nextWave = 999; s.gusted = true; s.energy = 999;
  m.summon(s, 0); const mine = s.units.find(u => !u.side); mine.x = 560; mine.hp = mine.maxHp = 9000; mine.attack = 99;
  const rhino = { uid: 99, id: 42, side: 1, x: 700, lane: 1, hp: 9000, maxHp: 9000, damage: 42, attack: 0, flash: 0, boss: false }; s.units.push(rhino);
  m.tick(s, 1 / 30); assert.ok(rhino.rushing, 'it charges from a little way off');
  let struck = false; for (let i = 0; i < 60 && !struck; i++) { m.tick(s, 1 / 30); struck = mine.hp < 9000; }
  assert.ok(struck, 'the charge lands'); assert.ok(rhino.stun > 0, 'and it stands dazed');
  const at = mine.x; run(s, m.KNOCK.time + 0.05); assert.ok(mine.x < at - 100, 'its target is thrown back');
});
test('the rhinoceratops\'s charge always lands, even on a spearman (rounding once left it rushing in place)', () => {
  const s = m.newSiege({ ...m.freshProgress(), owned: [0, 1], deck: [1] }, 1); s.nextWave = 999; s.gusted = true; s.energy = 999;
  m.summon(s, 1); const mine = s.units[0]; mine.x = 500; mine.hp = mine.maxHp = 1e6;
  const rhino = { uid: 99, id: 42, side: 1, x: 760, lane: 1, hp: 1e6, maxHp: 1e6, damage: 40, attack: 0, flash: 0, boss: false }; s.units.push(rhino);
  let blows = 0, hp = mine.hp;
  for (let i = 0; i < 30 * 15; i++) { m.tick(s, 1 / 30); if (mine.hp < hp) { blows++; hp = mine.hp; } }
  assert.ok(blows >= 5, `it keeps striking (${blows} blows in 15 s)`);
});
test('the mammothsaurus sweeps: every troop in front of it is struck and thrown far back', () => {
  const s = m.newSiege({ ...m.freshProgress(), owned: [0], deck: [0] }, 1); s.nextWave = 999; s.gusted = true; s.energy = 999;
  for (let i = 0; i < 3; i++) m.summon(s, 0), s.cooldowns = {};
  const mine = s.units.filter(u => !u.side); mine.forEach((u, i) => { u.x = 600 - i * 25; u.hp = u.maxHp = 9000; u.attack = 99; });
  const mammoth = { uid: 99, id: 44, side: 1, x: 650, lane: 1, hp: 9000, maxHp: 9000, damage: 60, attack: 0, flash: 0, boss: false }; s.units.push(mammoth);
  const from = mine.map(u => u.x); run(s, m.KNOCK.time + 0.1);
  assert.ok(mine.every(u => u.hp < 9000), 'all three are struck'); assert.ok(mine.every((u, i) => u.x < from[i] - 150), 'and thrown far back');
});
test('the new recruits: the medic heals, the balloon only bombs the fortress, the ninja goes unseen, the catapult hits the fortress twice', () => {
  const fresh = (ids) => { const s = m.newSiege({ ...m.freshProgress(), owned: [0, ...ids], deck: ids }, 30); s.nextWave = 999; s.gusted = true; s.energy = 9999; return s; };
  let s = fresh([53, 0]); m.summon(s, 53); m.summon(s, 0);
  const medic = s.units.find(u => u.id === 53), mate = s.units.find(u => u.id === 0); medic.x = 500; mate.x = 560; mate.hp = 10;
  s.units.push({ uid: 99, id: 15, side: 1, x: 600, lane: 1, hp: 9000, maxHp: 9000, damage: 0, attack: 99, flash: 0, boss: false });
  run(s, 2); assert.ok(mate.hp > 10, 'the medic heals'); assert.equal(s.units.find(u => u.uid === 99).hp <= 9000, true);
  assert.equal(medic.damage, 0, 'and has no blow of its own');
  s = fresh([52]); m.summon(s, 52); const balloon = s.units[0]; balloon.x = 600;
  s.units.push({ uid: 98, id: 15, side: 1, x: 620, lane: 1, hp: 9000, maxHp: 9000, damage: 0, attack: 99, flash: 0, boss: false });
  run(s, 3); assert.equal(s.units.find(u => u.uid === 98).hp, 9000, 'the balloon never fights troops'); assert.ok(balloon.x > 660, 'it flies on');
  s = fresh([55]); m.summon(s, 55); const ninja = s.units[0]; ninja.x = 300; ninja.hp = ninja.maxHp = 9000;
  s.units.push({ uid: 97, id: 22, side: 1, x: 460, lane: 1, hp: 9000, maxHp: 9000, damage: 50, attack: 0, flash: 0, boss: false });
  run(s, 0.6); assert.ok(ninja.hidden > 0, 'the ninja walks in unseen'); assert.equal(ninja.hp, 9000, 'the gunner cannot shoot it');
  let seen = false; for (let i = 0; i < 90 && !seen; i++) { m.tick(s, 1 / 30); seen = !ninja.hidden; }
  assert.ok(seen, 'it shows as it strikes'); run(s, 0.5); assert.ok(ninja.damage >= 400 && s.units.find(u => u.uid === 97).hp <= 9000 - ninja.damage + 1, 'and its blow is a killing one');
  s = fresh([51]); m.summon(s, 51); const cat = s.units[0]; cat.x = m.FIELD - 80 - 380; const before = s.hp[1];
  for (let i = 0; i < 120 && s.hp[1] === before; i++) m.tick(s, 1 / 30);
  assert.equal(Math.round(before - s.hp[1]), Math.round(cat.damage * 2), 'twice its blow on the fortress');
});
test('the legendary troops open when the game is won, both can go in one army; the dragon sweeps and throws back', () => {
  const p = m.freshProgress(); p.unlocked = m.LAST; p.coins = 99999;
  assert.equal(m.isOpen(p, 56), false, 'not before the last battle is won'); assert.equal(m.buyTroop(p, 56), false);
  p.victories.push(m.LAST); assert.ok(m.buyTroop(p, 56) && m.buyTroop(p, 55), 'then they can be bought');
  assert.equal(p.deck.filter(c => m.UNITS[m.cardId(c)].legend).length, 2, 'both go into the army');
  assert.deepEqual(m.capDeck([56, 55, 0]), [56, 55, 0], 'a saved army keeps both');
  assert.deepEqual(m.ALLIES.slice(-5).map(u => u.id).sort(), [55, 56, 57, 58, 59], 'listed last');
  const s = m.newSiege({ ...m.freshProgress(), owned: [0, 56], deck: [56], upgrades: [0, 0, 0, 0, 0, 0, 5] }, 1); s.nextWave = 999; s.gusted = true; s.energy = 9999;
  m.summon(s, 56); const dragon = s.units[0]; dragon.x = 500;
  const foes = [620, 700, 780].map((x, i) => ({ uid: 90 + i, id: 15, side: 1, x, lane: i % 3, hp: 9000, maxHp: 9000, damage: 0, attack: 99, flash: 0, boss: false })); s.units.push(...foes);
  const from = foes.map(f => f.x); run(s, 1.5);
  assert.ok(foes.every(f => f.hp < 9000), 'its breath reaches all three'); assert.ok(foes.every((f, i) => f.x > from[i] + 60), 'and throws them back');
});
test('the golem punches a shockwave: everything in front is struck and thrown far back; it is legendary', () => {
  assert.ok(m.UNITS[57].legend && m.UNITS[57].steady);
  const s = m.newSiege({ ...m.freshProgress(), owned: [0, 57], deck: [57], upgrades: [0, 0, 0, 0, 0, 0, 5] }, 1); s.nextWave = 999; s.gusted = true; s.energy = 9999;
  m.summon(s, 57); const golem = s.units[0]; golem.x = 500;
  const foes = [570, 610, 650].map((x, i) => ({ uid: 90 + i, id: 15, side: 1, x, lane: i % 3, hp: 9000, maxHp: 9000, damage: 0, attack: 99, flash: 0, boss: false })); s.units.push(...foes);
  const from = foes.map(f => f.x); run(s, 1.2);
  assert.ok(foes.every(f => f.hp < 9000), 'all three struck'); assert.ok(foes.every((f, i) => f.x > from[i] + 150), 'and thrown far back');
});
test('the star eater\'s beam pierces everything ahead as far as it reaches', () => {
  const s = m.newSiege({ ...m.freshProgress(), owned: [0, 58], deck: [58], upgrades: [0, 0, 0, 0, 0, 0, 5] }, 1); s.nextWave = 999; s.gusted = true; s.energy = 9999;
  m.summon(s, 58); const eater = s.units[0]; eater.x = 400;
  const foes = [600, 650, 700].map((x, i) => ({ uid: 90 + i, id: 15, side: 1, x, lane: i % 3, hp: 9000, maxHp: 9000, damage: 0, attack: 99, flash: 0, boss: false })); s.units.push(...foes);
  run(s, 0.5); assert.ok(foes.every(f => f.hp < 9000), 'one beam strikes all three');
});
test('the weary reaper hooks from afar and drags its prey to it', () => {
  const s = m.newSiege({ ...m.freshProgress(), owned: [0, 59], deck: [59], upgrades: [0, 0, 0, 0, 0, 0, 5] }, 1); s.nextWave = 999; s.gusted = true; s.energy = 9999;
  m.summon(s, 59); const reaper = s.units[0]; reaper.x = 400;
  const foe = { uid: 90, id: 16, side: 1, x: 580, lane: 1, hp: 9000, maxHp: 9000, damage: 0, attack: 99, flash: 0, boss: false }; s.units.push(foe);
  let struck = false; for (let i = 0; i < 60 && !struck; i++) { m.tick(s, 1 / 30); struck = foe.hp < 9000; }
  assert.ok(struck, 'it strikes from afar'); const at = foe.x; run(s, m.KNOCK.time + 0.05); assert.ok(foe.x < at - 100, 'and drags its prey towards it');
});
test('heavy robots never get knocked back, and the last one fires a cyan plasma ball and bullets', () => {
  for (const id of [9, 32, 35]) assert.ok(m.UNITS[id].steady, `robot ${id} stands firm`);
  const s = m.newSiege({ ...m.freshProgress(), unlocked: 30, owned: [0, 9], deck: [m.card(9, 4)], levels: m.UNITS.map((_, i) => (i === 9 ? 4 : 1)) }, 20); s.nextWave = 999; s.gusted = true; s.energy = 999;
  m.summon(s, m.card(9, 4)); const bot = s.units[0]; bot.x = 400;
  s.units.push({ uid: 98, id: 44, side: 1, x: 470, lane: 1, hp: 9e6, maxHp: 9e6, damage: 60, attack: 0, flash: 0, boss: false });
  let rockets = false, bullets = false;
  for (let i = 0; i < 150; i++) { m.tick(s, 1 / 30); assert.ok(!bot.knock && !bot.nudge, 'never thrown back'); rockets ||= s.effects.some(e => e.art === 'plasma-cyan' && e.gun?.sprite === 'siege/units/ally-heavy-robot-4'); bullets ||= s.effects.some(e => e.art === 'bullet' && e.gun?.sprite === 'siege/units/ally-heavy-robot-4+'); }
  assert.ok(rockets && bullets, 'a cyan plasma ball from its back cannon and bullets from its arms');
  // The plasma ball strikes too: a strike is its rockets' damage and its share on top.
  const a = m.specAt(9, 4), foe = s.units.find(u => u.uid === 98);
  const before = foe.hp; bot.attack = 0; m.tick(s, 1 / 30);
  assert.ok(Math.abs(before - foe.hp - bot.damage * (1 + a.alsoShare)) < 1, 'the second gun deals damage');
});

test('without the time limit a battle goes on past it', () => {
  const s = m.newSiege(m.freshProgress(), 1); s.nextWave = 999;
  m.prefs.untimed = true; s.time = m.limitOf(1) + 5; m.tick(s, 1 / 30); assert.equal(s.phase, 'fight');
  m.prefs.untimed = false; m.tick(s, 1 / 30); assert.equal(s.phase, 'lost');
});

test('the owner\'s drawn effects: arrivals, hits, frozen troops shatter, machines burst into scrap, foes give up their soul', () => {
  const s = m.newSiege({ ...m.freshProgress(), unlocked: 30, owned: [0, 4], deck: [0, 4] }, 20); s.nextWave = 999; s.gusted = true; s.energy = 999;
  m.summon(s, 0); assert.ok(s.effects.some(e => e.kind === 'anim' && e.art === 'arrive-land'), 'a troop arrives in a summoning circle');
  m.summon(s, 4); const gun = s.units[1]; gun.x = 400;
  const foe = { uid: 99, id: 15, side: 1, x: 560, lane: 1, hp: 9000, maxHp: 9000, damage: 0, attack: 99, flash: 0, boss: false }; s.units.push(foe);
  let sparked = false, casing = false; for (let i = 0; i < 90; i++) { m.tick(s, 1 / 30); sparked ||= s.effects.some(e => e.art === 'hit-bullet'); casing ||= s.effects.some(e => e.kind === 'piece' && e.art === 'casing'); }
  assert.ok(sparked && casing, 'bullets spark and throw casings');
  m.tick(s, 0); foe.frozen = 0.05; foe.stun = 0.05; run(s, 0.2); assert.ok(s.effects.some(e => e.art === 'shatter'), 'the ice shatters');
  const bot = { uid: 98, id: 32, side: 1, x: 600, lane: 1, hp: 0, maxHp: 760, damage: 0, attack: 99, flash: 0, boss: false, stage: 2 }; foe.hp = 0; s.units.push(bot);
  m.tick(s, 1 / 30);
  assert.ok(s.effects.some(e => e.art === 'wreck') && s.effects.some(e => e.art === 'piece-gear'), 'a robot bursts into scrap');
  assert.ok(s.effects.some(e => e.art === 'soul') && s.effects.some(e => e.art === 'loot'), 'a foe gives up its soul and its loot');
});

test('the owner\'s second batch: the fortress collapses, the horn sounds when we reach it, meteors warn and leave craters, giants raise dust', () => {
  const s = m.newSiege({ ...m.freshProgress(), unlocked: 30, owned: [0, 9], deck: [9] }, 3); s.gusted = true; s.energy = 999;
  s.nextWave = 0; m.tick(s, 1 / 30); s.nextWave = 0; m.tick(s, 1 / 30);
  assert.ok(!s.effects.some(e => e.art === 'horn'), 'a new wave sounds no horn');
  const h = m.newSiege({ ...m.freshProgress(), unlocked: 30, owned: [0], deck: [0] }, 3); h.gusted = true; h.energy = 999; h.nextWave = 999; m.summon(h, 0); h.units[0].x = m.FIELD - 130;
  const horns = new Set(); for (let i = 0; i < 120; i++) { m.tick(h, 1 / 30); h.effects.filter(e => e.art === 'horn').forEach(e => horns.add(e)); }
  assert.equal(horns.size, 1, 'the war horn sounds once, the first time our troops strike the enemy fortress');
  const g = m.newSiege({ ...m.freshProgress(), unlocked: 30, owned: [0, 9], deck: [9] }, 3); g.gusted = true; g.energy = 999; g.nextWave = 999;
  m.summon(g, 9); let dust = false; for (let i = 0; i < 60; i++) { m.tick(g, 1 / 30); dust ||= g.effects.some(e => e.art === 'step' && e.floor); }
  assert.ok(dust, 'a heavy walker raises dust at its steps');
  s.hp[1] = 0; m.tick(s, 1 / 30);
  assert.ok(s.razed && s.effects.some(e => e.art === 'collapse') && s.effects.some(e => e.kind === 'piece' && e.art === 'piece-flag'), 'the fortress collapses, its flag thrown out');
  const t = m.newSiege({ ...m.freshProgress(), unlocked: 30, powers: [0, 0, 0, 1], kit: [3] }, 20); t.nextWave = 999;
  assert.ok(m.castPower(t, 3)); assert.ok(t.effects.some(e => e.art === 'warn') && t.effects.some(e => e.art === 'crater'), 'meteors warn where they will fall and leave craters');
});

test('the new powers: a black hole drags the enemy in and bursts, the sword strikes the strongest, the sanctuary heals ours', () => {
  const at = (id) => { const p = { ...m.freshProgress(), unlocked: 30 }; p.coins = 99999; assert.ok(m.buyPower(p, id)); const s = m.newSiege(p, 20); s.nextWave = 999; s.gusted = true; s.view = { x: 300, width: 800 }; return s; };
  const foe = (s, uid, x, hp = 3000, o = {}) => { const u = { uid, id: 15, side: 1, x, lane: 1, hp, maxHp: hp, damage: 0, attack: 99, flash: 0, boss: false, ...o }; s.units.push(u); return u; };
  let s = at(4); const a = foe(s, 1, 600), b = foe(s, 2, 760), far = foe(s, 3, 1300);
  assert.ok(m.castPower(s, 4)); const mid = s.zones[0].x; run(s, 1.5);
  assert.ok(Math.abs(a.x - mid) < 40 && Math.abs(b.x - mid) < 40, 'pulled into the centre'); run(s, 1.2);
  assert.ok(a.hp < 3000 && b.hp < 3000, 'then it bursts on them');
  s = at(5); const weak = foe(s, 1, 500, 400), strong = foe(s, 2, 900, 6000);
  assert.ok(m.castPower(s, 5)); run(s, 5); assert.ok(strong.hp < 6000 - 300 && weak.hp === 400, 'it falls on the strongest and keeps striking round it');
  s = at(6); s.units.push({ uid: 9, id: 0, side: 0, x: 600, lane: 1, hp: 50, maxHp: 200, damage: 0, attack: 99, flash: 0, boss: false, lv: 1, stun: 99 });
  assert.ok(m.castPower(s, 6)); run(s, 3); assert.ok(s.units[0].hp > 80, 'ours heal inside it');
});

test('the catapult lobs its rock: it strikes where it lands, when it lands', () => {
  const s = m.newSiege({ ...m.freshProgress(), unlocked: 30, owned: [0, 51], deck: [51] }, 20); s.nextWave = 999; s.gusted = true; s.energy = 999;
  m.summon(s, 51); const cat = s.units[0]; cat.x = 400;
  const foe = { uid: 99, id: 15, side: 1, x: 700, lane: 1, hp: 9000, maxHp: 9000, damage: 0, attack: 99, flash: 0, boss: false }; s.units.push(foe);
  let thrown = false; for (let i = 0; i < 120 && !thrown; i++) { m.tick(s, 1 / 30); thrown = s.effects.some(e => e.kind === 'shot' && e.art === 'boulder'); }
  assert.ok(thrown, 'the rock is in the air'); assert.equal(foe.hp, 9000, 'nothing struck yet');
  const rock = s.effects.find(e => e.art === 'boulder'); assert.ok(rock.arc > 120, 'thrown high');
  run(s, m.UNITS[51].lob + 0.1); assert.ok(foe.hp < 9000, 'it strikes as it lands');
});
test('every rocket blows up where it lands', () => {
  const s = m.newSiege({ ...m.freshProgress(), owned: [0, 5], deck: [5] }, 1); s.nextWave = 999; s.gusted = true; s.energy = 999;
  m.summon(s, 5); const b = s.units[0]; b.x = 600; b.hp = b.maxHp = 9000;
  s.units.push({ uid: 99, id: 15, side: 1, x: 760, lane: 1, hp: 9000, maxHp: 9000, damage: 0, attack: 99, flash: 0, boss: false });
  let booms = 0; for (let i = 0; i < 90; i++) { m.tick(s, 1 / 30); booms = Math.max(booms, s.effects.filter(e => e.kind === 'boom').length); }
  assert.ok(booms > 0, 'the bazooka\'s rocket explodes');
});
test('each stage has a threat: its troops come mostly from it, at the strength of a plain wave', () => {
  const sent = (stage, secs) => { const s = m.newSiege({ ...m.freshProgress(), unlocked: m.LAST }, stage); s.hp[1] = 1e9; s.maxHp[1] = 1e9; const ids = []; const seen = new Set();
    for (let i = 0; i < secs * 30; i++) { m.tick(s, 1 / 30); for (const u of s.units) if (u.side && !seen.has(u.uid)) { seen.add(u.uid); ids.push(u.id); } s.units = s.units.filter(u => !u.side); } return ids; };
  const sky = sent(6, 90); assert.ok(sky.filter(id => m.UNITS[id].air).length >= sky.length / 2, 'a sky stage sends mostly flyers');
  const wall = sent(12, 90); assert.ok(wall.filter(id => m.threatPool(12).includes(id)).length >= wall.length / 2, 'a wall stage sends its wall');
  const giants = sent(21, 150), swarm = sent(23, 150), power = ids => ids.reduce((a, id) => a + m.foePower(id), 0);
  assert.ok(giants.length < swarm.length, 'giants come fewer'); assert.ok(Math.abs(power(giants) / power(swarm) - 1) < 0.6, 'but weigh about the same');
});
test('the map knows what answers a threat', () => {
  assert.equal(m.counters(m.card(10, 1), 'sky'), true, 'a fighter meets flyers'); assert.equal(m.counters(m.card(0, 1), 'sky'), false);
  assert.equal(m.counters(m.card(5, 1), 'swarm'), true, 'a bazooka hits an area'); assert.equal(m.counters(m.card(12, 1), 'wall'), true, 'a helicopter shoots the wall from above');
  assert.equal(m.counters(m.card(3, 1), 'shooters'), true, 'a heavy knight takes the shots'); assert.equal(m.counters(m.card(6, 1), 'shooters'), true, 'the wizard\'s blow breaks them up');
});
