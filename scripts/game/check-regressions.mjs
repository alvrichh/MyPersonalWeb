// Run with node scripts/game/check-regressions.mjs. Uses Vite's installed esbuild.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const bundle = await build({
  stdin: { contents: "export * as world from './src/game/world.ts'; export * as board from './src/game/board.ts';", resolveDir: root },
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
check('Tactics: second identical card upgrades the first, keeping its type and cell', () => {
  const g = tactics(), first = structuredClone(g.army[0]); offer(g);
  assert.equal(b.buy(g, 0), true);
  assert.equal(g.army.length, 1);
  assert.deepEqual(g.army[0], { ...first, star: 2 });
  assert.equal(g.gold, 99); assert.equal(g.shop[0], null); assert.equal(g.lastMerge.star, 2);
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
check('Tactics: matching purchase works at army capacity, unrelated purchase is rejected', () => {
  const g = tactics();
  for (let cast = 2; cast <= b.armyCap(1); cast++) { offer(g, 0, cast); assert.equal(b.buy(g, 0), true); }
  offer(g, 1, 5); const gold = g.gold; assert.equal(b.buy(g, 0), false); assert.equal(g.gold, gold);
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
