import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle = await build({ entryPoints: ['bug-hunter/src/siege/cartoon/model.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const m = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const run = (s, seconds) => { for (let i = 0; i < seconds * 30; i++) m.tick(s, 1 / 30); };
test('safe save validation and independent schema', () => {
  assert.deepEqual(m.readProgress('{'), m.freshProgress());
  assert.deepEqual(m.readProgress('{"version":2}'), m.freshProgress());
  const p = m.readProgress(JSON.stringify({ version: 1, unlocked: 500, coins: -20, upgrades: [99, -2, '3', 7], owned: [7, 1, 2, 999, 20], deck: [7, 7, 999, -1, 0, 3], victories: [1, 1, 6, 30, 31, -2, 2.5] }));
  assert.equal(p.unlocked, m.LAST); assert.equal(p.coins, 0); assert.deepEqual(p.upgrades, [5, 0, 0, 5]); assert.deepEqual(p.victories, [1, 6, 30]);
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
  const plain = m.newSiege(m.freshProgress(), 1); plain.nextWave = 999; plain.hp[1] = 0; m.tick(plain, 1 / 30);
  assert.equal(plain.phase, 'won', 'an act\'s first stages are won with the fortress'); assert.equal(plain.units.filter(u => u.boss).length, 0);
  const s = m.newSiege({ ...m.freshProgress(), unlocked: 5 }, 5); s.nextWave = 999; s.hp[1] = 500; run(s, 1);
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
  assert.equal(m.canHit(0, 28), false, 'a swordsman cannot reach an eagle'); assert.equal(m.canHit(2, 28), true, 'an archer shoots it');
  assert.equal(m.canHit(28, 0), true, 'an eagle dives on the ground');
  const s = m.newSiege(m.freshProgress(), 1); s.nextWave = 999; s.deck.push(10); s.energy = 999;
  assert.equal(m.summon(s, 10), true); const plane = s.units[0]; plane.x = 500;
  const foe = { ...plane, uid: 100, id: 15, side: 1, x: 520, hp: 9999, maxHp: 9999, damage: 50 };
  s.units.push(foe); run(s, 2); assert.equal(plane.hp, plane.maxHp, 'the enemy swordsman never hits it'); assert.ok(foe.hp < 9999);
  const p = m.readProgress(JSON.stringify({ version: 1, unlocked: 30, owned: m.ALLIES.map(u => u.id), deck: [0, 1, 2, 3, 4, 5, 6, 10, 11, 12, 13, 14, 20, 31] }));
  assert.equal(p.deck.filter(id => !m.UNITS[id].air).length, 5); assert.equal(p.deck.filter(id => m.UNITS[id].air).length, 5);
  assert.equal(p.deck.some(id => m.UNITS[id].foe), false, 'never an enemy troop');
});
test('the missile blasts the aim and recharges', () => {
  const s = m.newSiege(m.freshProgress(), 1); s.aim = 600;
  s.units.push({ uid: 1, id: 0, side: 1, x: 620, lane: 0, hp: 200, maxHp: 200, damage: 0, attack: 0, flash: 0, boss: false });
  assert.equal(m.missile(s), true); assert.ok(s.units[0].hp < 200); assert.equal(m.missile(s), false);
  run(s, m.ROCKET.every + 0.1); assert.equal(m.missile(s), true);
});
test('every troop id is its place in the list; ours are 10 land and 6 air, the enemy\'s are theirs only', () => {
  m.UNITS.forEach((u, i) => assert.equal(u.id, i));
  assert.equal(m.ALLIES.filter(u => !u.air).length, 10); assert.equal(m.ALLIES.filter(u => u.air).length, 6);
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
  const rider = at(31, 560, 1), gunner = at(4, 400, 0, { damage: 80, attack: 0 }); u.units.push(rider, gunner);
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
