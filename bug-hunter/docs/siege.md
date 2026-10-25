# Siege / Asedio — playable preview

Status: **Coming soon · Playable preview**. Available in the fourth main-cover option, Coming Soon, after Sprints, On Call and Battle. The hub keeps its separate Fortress link. Battle still contains Fusion and Tactics. Fortress remains its separate construction prototype.

## Player flow

1. Select Coming Soon on the cover using the arrows or swipe, press the play bar, then choose Siege.
2. Pick an unlocked enemy world and exactly five troops. Eight troop families exist; the last three unlock at worlds 3, 5 and 7.
3. Summon with regenerating energy. Troops advance and fight automatically on a lateral battlefield.
4. Upgrade the generator during the battle (four levels). Tap the field to aim the cannon or area discharge; neither harms allies. Cannon range is capped at 1,080 world units, with a 3.5-second recharge; discharge recharges in 24 seconds.
5. Destroy the enemy fortress within five minutes. A guardian joins once the enemy base drops below 45% health or at 150 seconds. Losing your own base or reaching the time limit is defeat; simultaneous destruction is defeat.
6. Victories award mode-specific gold and unlock the next fortress, through all nine worlds. The workshop offers five levels each of army strength, base health and energy production. Repeat victories give smaller rewards. Defeats and abandoned battles give no reward.

The nine preview stages reuse world enemy art and share the initial guardian silhouette. Fortress scenery is procedural preview art. This is not a promise of nine fully authored campaigns or finished balance. Existing source images are reused without rewriting/recompressing their bytes; alpha bounds are measured only at render time.

## Controls and accessibility

- Touch/mouse: five unit cards, generator/cannon/discharge buttons. Tap the battlefield to aim; drag to pan. Camera slider and home/enemy buttons are alternative controls.
- Keyboard while the battlefield is focused: 1–5 summon, E generator, F cannon, Q discharge, left/right arrows pan, Escape pause.
- Landscape shows more of the field. Portrait keeps all five cards on screen and supports camera panning.
- The battlefield pauses on tab hiding or window blur. Returning requires Resume. Time does not advance while paused.
- The mode is a modal with background content inert, a focus loop, accessible button labels and reduced-motion support. All copy is in `src/strings.ts` in English and Spanish.

## Architecture and compatibility

- `src/siege/model.ts`: deterministic, DOM-free simulation, balance, save validation, upgrades and reward settlement.
- `src/siege/view.ts`: independent canvas renderer, camera and existing sprite loading.
- `src/siege/index.ts`: preparation, inputs, pause/results, lifecycle and local save.
- `src/siege/siege.css`: scoped responsive UI plus the fourth cover option's color.
- `tests/siege.test.mjs`: meaningful model regressions, including a complete first-stage win.

The existing `PlayMode`/action/board schema is intentionally unchanged. The cover has a separate four-entry selection; choosing Siege never writes an unsupported value into the previous save. The mode uses `bugHunter.siege.v1` through the shared safe storage adapter. Coins, unlocks, workshop levels and deck selection are separate from other modes. Battles are not resumed after reload. No server, multiplayer, paid currency or online synchronization is introduced.

Simulation runs at a fixed 30 Hz, rendering with requestAnimationFrame and DOM counters at 10 Hz. Each side has a 36-unit cap. Leaving cancels the animation frame, removes listeners and restores background interactivity. New-game initialization copies upgrade values and the deck, and in-battle generators reset every battle.

## Validation

From the repository root using Node 24:

```bash
npm run typecheck
npm run test:game:layout
npm run test:game
npm run build
```

`npm run test:game:siege` runs only the Siege model suite. UI checks must also cover the fourth cover option, choosing a deck, starting/restarting, a win/loss result, pause/resume, hidden-tab pausing, portrait/landscape, return to menu and storage isolation. Model and fixture tests are not visual gameplay verification.
