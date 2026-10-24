// Run with node bug-hunter/scripts/check-regressions.mjs. Uses Vite's installed esbuild.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({
  stdin: { contents: "export * as world from './src/world.ts'; export * as board from './src/board.ts';", resolveDir: root },
  bundle: true, platform: 'node', format: 'esm', write: false,
});
const { world: w, board: b } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
let failures = 0, checks = 0;
function check(name, run) {
  checks++;
  try { run(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}: ${error.message}`); }
}
const offer = (game, tier = 0, cast = 1) => { game.shop = [{ tier, cast, price: b.priceOf(tier, game.world, game.variant) }]; };
const tactics = () => { const g = b.newBoard(1, 1, 'tactics'); g.gold = 100; return g; };
check('Tactics AI: round 2 guarantees a two-star rival unit', () => {
  const stars = b.enemyWaveStars(2, [2, 1, 0], 'tactics');
  assert.ok(stars.includes(2)); assert.equal(stars.includes(3), false);
});
check('Tactics AI: star pressure escalates early and reaches three stars by round 7', () => {
  assert.deepEqual(b.enemyWaveStars(1, [4, 3, 2], 'tactics'), [1, 1, 1]);
  assert.ok(b.enemyWaveStars(4, [4, 3, 2, 1], 'tactics').filter(x => x === 2).length >= 2);
  assert.equal(b.enemyWaveStars(7, [4, 3, 2, 1, 0], 'tactics')[0], 3);
  assert.equal(b.enemyWaveStars(9, [4, 3, 2, 1, 0], 'tactics').filter(x => x === 3).length, 2);
});
check('Tactics AI: combat scaling rises after the introductory round', () => {
  assert.equal(b.tacticsEnemyPower(1), 0.9);
  assert.equal(b.tacticsEnemyPower(2), 1);
  assert.ok(b.tacticsEnemyPower(10) > 1.3);
});
check('Fusion: rival stars remain unupgraded by Tactics difficulty', () => {
  assert.deepEqual(b.enemyWaveStars(10, [4, 3, 2, 1], 'fusion'), [1, 1, 1, 1]);
});
check('Tactics: second identical card upgrades the first, keeping its type and cell', () => {
  const g = tactics(), first = structuredClone(g.army[0]); offer(g);
  assert.equal(b.buy(g, 0), true);
  assert.equal(g.army.length, 1);
  assert.deepEqual(g.army[0], { ...first, star: 2 });
  // The bought card's slot is refilled with a new offer.
  assert.equal(g.gold, 99); assert.ok(g.shop[0]); assert.equal(g.lastMerge.star, 2);
});
check('Tactics: four base copies chain to three stars; three stars is the limit', () => {
  const g = tactics();
  for (let i = 0; i < 3; i++) { offer(g); assert.equal(b.buy(g, 0), true); }
  assert.equal(g.army.length, 1); assert.equal(g.army[0].star, 3);
  for (let i = 0; i < 4; i++) { offer(g); assert.equal(b.buy(g, 0), true); }
  assert.deepEqual(g.army.map(p => p.star), [3, 3]);
});
check('Tactics: different casts and rarities remain separate', () => {
  const g = tactics(); offer(g, 0, 2); b.buy(g, 0); offer(g, 1, 1); b.buy(g, 0);
  assert.equal(g.army.length, 3); assert.ok(g.army.every(p => p.star === 1));
});
check('Tactics: at army capacity a matching purchase merges, an unrelated one goes to the bench, then is rejected', () => {
  const g = tactics();
  for (let cast = 2; cast <= b.armyCap(1); cast++) { offer(g, 0, cast); assert.equal(b.buy(g, 0), true); }
  for (let i = 0; i < b.BENCH_CAP; i++) { offer(g, 1, 5 + (i % 4)); assert.equal(b.buy(g, 0), true); }
  assert.equal(g.bench.length, b.BENCH_CAP); assert.equal(g.army.length, b.armyCap(1));
  offer(g, 4, 9); const gold = g.gold; assert.equal(b.buy(g, 0), false); assert.equal(g.gold, gold);
  offer(g); assert.equal(b.buy(g, 0), true); assert.equal(g.army.length, b.armyCap(1)); assert.equal(g.army[0].star, 2);
});
check('Tactics: cannot buy without gold or during combat', () => {
  const g = tactics(); offer(g); g.gold = 0;
  assert.equal(b.buy(g, 0), false); assert.ok(g.shop[0]); assert.equal(g.army[0].star, 1);
  g.gold = 100; g.phase = 'fight'; assert.equal(b.buy(g, 0), false);
});
check('Tactics: resale reflects two and four original copies', () => {
  const g = tactics(), p = { ...g.army[0], tier: 4 };
  assert.equal(b.saleOf({ ...p, star: 2 }, 'tactics', 1), 8);
  assert.equal(b.saleOf({ ...p, star: 3 }, 'tactics', 1), 16);
});
check('Board: a run with no units and too little gold can still fight (and lose) instead of locking', () => {
  for (const variant of ['tactics', 'fusion']) {
    const g = b.newBoard(9, 9, variant); g.army = []; g.bench = []; g.gold = 0;
    assert.equal(b.canFight(g), true); assert.equal(b.startFight(g), true);
    for (let t = 0; t < 2 && g.phase === 'fight'; t += 1 / 60) b.updateBoard(g, 1 / 60);
    assert.equal(g.last.result, 'loss');
    const rich = b.newBoard(9, 9, variant); rich.army = []; rich.gold = 99; assert.equal(b.canFight(rich), false);
  }
});
check('Fusion: a cancelled auto-merge still merges the other pairs', () => {
  const g = b.newBoard(1, 1, 'fusion'), first = g.army[0]; g.gold = 99;
  g.army.push({ ...structuredClone(first), id: 9001, slot: { c: 3, r: 6 } }, { ...structuredClone(first), id: 9002, tier: 1, slot: { c: 4, r: 6 } }, { ...structuredClone(first), id: 9003, tier: 1, slot: { c: 1, r: 6 } });
  assert.equal(b.buyAutoMerge(g), true);
  const pend = g.pending; g.army = g.army.filter((p) => p.id !== pend.a);
  b.tickMerge(g, b.MERGE_DELAY + 0.01); b.tickMerge(g, b.MERGE_DELAY + 0.01);
  assert.ok(g.army.filter((p) => p.tier === 1).length < 2 || g.army.some((p) => p.tier === 2));
});
check('Fusion: two identical units still merge to the next character', () => {
  const g = b.newBoard(1, 1, 'fusion'), first = g.army[0];
  const slot = { c: 3, r: 6 }; g.army.push({ ...structuredClone(first), id: first.id + 100, slot });
  assert.equal(b.moveUnit(g, slot, first.slot), 'merged');
  assert.equal(g.army.length, 1); assert.equal(first.tier, 1); assert.equal(first.star, 1);
});
check('Fusion: automatic merge and price are unchanged', () => {
  const g = b.newBoard(1, 1, 'fusion'), first = g.army[0];
  g.army.push({ ...structuredClone(first), id: first.id + 100, slot: { c: 3, r: 6 } });
  assert.equal(b.buyAutoMerge(g), true); b.tickMerge(g, b.MERGE_DELAY + 0.01);
  assert.equal(g.army.length, 1); assert.equal(g.army[0].tier, 1);
  assert.equal(b.saleOf({ ...g.army[0], tier: 2 }, 'fusion'), 2);
});
check('Fusion AI: round 2 guarantees a merged Ticket-tier enemy', () => {
  assert.ok(b.enemyWave(1, 2, 'fusion').some(tier => tier >= 1));
});
check('Fusion AI: round 4 guarantees a Legacy-tier enemy and round 7 guarantees two', () => {
  assert.ok(b.enemyWave(1, 4, 'fusion').some(tier => tier >= 2));
  assert.ok(b.enemyWave(1, 7, 'fusion').filter(tier => tier >= 2).length >= 2);
});
check('Fusion AI: combat scaling rises sharply after round 1', () => {
  assert.equal(b.fusionEnemyPower(1), 0.95);
  assert.equal(b.fusionEnemyPower(2), 1.05);
  assert.ok(b.fusionEnemyPower(10) > 1.42);
});
check('Battle: the commander fireball still targets a cluster, once per fight', () => {
  const g = tactics(); b.startFight(g);
  const template = g.fighters.find(f => f.side === 1);
  g.fighters = [[40, 100], [70, 100], [90, 100], [300, 400]].map(([x, y], i) => ({ ...structuredClone(template), id: i + 100, x, y }));
  assert.equal(b.commanderStrike(g), true);
  assert.deepEqual(g.strike, { x: 40, y: 100, t: b.STRIKE.fly });
  assert.equal(b.commanderStrike(g), false);
});
for (const mode of ['sprints', 'horde']) for (const [level, evolved] of [[1, false], [2, false], [3, false], [3, true]]) {
  check(`Fireball ${mode}, level=${level}, evolved=${evolved}: every projectile targets the closest active enemy`, () => {
    const g = w.newGame(undefined, 'world', 1, mode);
    const template = w.newGame().enemies[0];
    assert.ok(template);
    g.player.x = 180; g.player.y = 300; g.obstacles = []; g.hazards = [];
    const enemy = (id, x, y, extra = {}) => ({ ...structuredClone(template), id, x, y, spawn: 0, speed: 0, hp: 10000, maxHp: 10000, cd: 100, ...extra });
    g.enemies = [enemy(100, 180, 240), enemy(101, 300, 300), enemy(102, 200, 300, { dead: true }), enemy(103, 180, 280, { spawn: 1 })];
    for (const key of Object.keys(g.skills)) g.skills[key] = 0;
    for (const key of Object.keys(g.gear)) g.gear[key] = 100;
    g.skills.fireball = level; g.gear.fireball = 0; g.evolved.fireball = evolved;
    const random = Math.random; Math.random = () => 0.99;
    try { w.update(g, 0, { x: 0, y: 0 }); } finally { Math.random = random; }
    assert.equal(g.fireballs.length, evolved ? 3 : level === 3 ? 2 : 1);
    for (const shot of g.fireballs) { assert.ok(Math.abs(shot.vx) < 1e-9); assert.equal(shot.vy, -240); }
    // The next cast must pick again when a different enemy is now nearest.
    g.fireballs = []; g.gear.fireball = 0; g.enemies.find(e => e.id === 101).x = 220;
    w.update(g, 0, { x: 0, y: 0 });
    for (const shot of g.fireballs) { assert.equal(shot.vx, 240); assert.ok(Math.abs(shot.vy) < 1e-9); }
  });
}
check('Fireball: no active enemy means no projectile', () => {
  const g = w.newGame(); g.enemies = []; g.skills.fireball = 1; g.gear.fireball = 0;
  w.update(g, 0, { x: 0, y: 0 }); assert.equal(g.fireballs.length, 0);
});
console.log(`${checks - failures}/${checks} checks passed`);
process.exitCode = failures ? 1 : 0;
