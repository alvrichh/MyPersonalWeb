import './siege.css';
import { storage } from '../../lib/storage';
import type { Key, T } from '../strings';
import { ALLIES, costOf, specAt, levelPrice, levelsOf, levelUp, CAP, DECK, FIELD, aimAt, looksTier, missile, LIMIT, SAVE_KEY, UNITS, canSummon, energyMax, energyRate, toggleBow, BOW, generatorPrice, improveGenerator, newSiege, readProgress, settle, strike, summon, tick, upgrade, upgradePrice, type Siege } from './model';
import { backdropUrl, guardianUrl, trimImages, portrait, preload, render, type Camera } from './view';
import { GUARDIAN_NAMES, bossTalk, intro, type Line } from './story';
/** The map's island pictures, world by world, and the workshop's pictures, upgrade by upgrade (army, fortress, energy, bow). */
/** Field units a second the landing spot moves with the stick pushed all the way. */
const AIM_SPEED = 650;
const ISLES = ['original', 'infierno', 'vikingos', 'lodo', 'jungla', 'rayo', 'robots', 'demonios', 'nucleo'];
const UPGRADE_PICS = ['items/gladHelm', 'items/plate', 'ui/orb', 'items/quiver'];
/** A workshop row's picture: the fortress and the crossbow show the look their level gives (`looksTier`). */
const upgradePic = (i: number, level: number) => (i === 1 ? `siege/castle-${looksTier(level)}` : i === 3 ? `siege/xbow-arm-${looksTier(level)}` : UPGRADE_PICS[i]);

/** A bar button's picture and caption: the picture made once, only the caption's text changed after (ten times a
    second, so no `<img>` is re-created each time). */
function setPicButton(b: HTMLButtonElement, src: string, caption: string) {
  if (!b.firstElementChild) b.innerHTML = '<img alt=""><small></small>';
  const img = b.firstElementChild as HTMLImageElement;
  if (img.getAttribute('src') !== src) img.src = src;
  const small = b.lastElementChild as HTMLElement;
  if (small.textContent !== caption) small.textContent = caption;
}
const clock = (n: number) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
let closeActive: (() => void) | undefined;
/** Own root, event lifecycle and save: existing game modes are never entered or mutated. */
/** `hero`: the player's hero picture and name, the commander who speaks in the story scenes. */
export function openSiege(t: T, onClose: () => void, hero = { pic: '', name: '' }, sound: (name: string, vol?: number, pan?: number) => void = () => {}) {
  closeActive?.();
  const progress = readProgress(storage.get(SAVE_KEY));
  let selected = [...progress.deck], world = progress.unlocked;
  let state: Siege | null = null, paused = false, finished = false;
  // Local checks (like `window.bugHunter` for the main game): the battle's state, read and nudged by test scripts.
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) Object.defineProperty(window, 'bugHunterSiege', { get: () => state, configurable: true });
  let frame = 0, last = 0, accumulator = 0, uiAt = 0, bossTalked = false;
  /** How far the aim stick is pushed, -1 (down, nearer) to 1 (up, further); 0 at rest. */
  let aimPush = 0;
  /** The bottom bar's tab, Cartoon Wars 2's L · A · S: land troops, air troops, special powers. */
  let tab: 'land' | 'air' | 'special' = 'land';
  const air = (id: number) => !!UNITS[id].air;
  const tabCards = () => tab === 'special' ? [] : selected.filter(id => air(id) === (tab === 'air'));
  const camera: Camera = { x: 0, width: 650 };
  /** When each troop sound last played (ms): the same sound at most every 70 ms, and no more than four a frame, so a
      big battle stays a clash of distinct blows rather than a roar. */
  const heard = new Map<string, number>();
  function troopSounds(now: number) {
    const q = state?.sounds; if (!q?.length) return;
    let played = 0;
    for (const { k, x } of q.splice(0)) {
      if (played >= 4 || now - (heard.get(k) ?? -1e9) < 70) continue;
      heard.set(k, now); played++;
      // Louder and centred where the camera looks, softer off screen, panned left or right by its place.
      const mid = camera.x + camera.width / 2, off = Math.abs(x - mid) / (camera.width / 2);
      sound(k, off <= 1 ? 1 - off * 0.25 : Math.max(0.15, 0.6 - (off - 1) * 0.5), Math.max(-1, Math.min(1, (x - mid) / (camera.width / 2))) * 0.7);
    }
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const previousFocus = document.activeElement as HTMLElement | null;
  const root = document.createElement('section'); root.className = 'siege-root'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', t('siegeName'));
  const siblings = [...document.body.children].filter((el): el is HTMLElement => el instanceof HTMLElement).map(el => ({ el, inert: el.inert }));
  siblings.forEach(({ el }) => el.inert = true);
  document.body.append(root);
  let battleAbort = new AbortController();
  const abort = new AbortController(); const options = { signal: abort.signal };
  const q = <E extends HTMLElement>(selector: string) => root.querySelector<E>(selector)!;
  const persist = () => { storage.set(SAVE_KEY, JSON.stringify(progress)); };
  const name = (id: number) => t(`siegeUnit${id}` as Key);
  /** The workshop's troop rows: every troop with upgrade forms, its look at its level, its pips and the next price. */
  const troopRows = () => {
    const rows = ALLIES.filter(u => u.forms?.length).map(u => {
      const level = progress.levels[u.id] ?? 1, max = levelsOf(u.id), price = levelPrice(progress, u.id), locked = u.unlock > progress.unlocked;
      return `<button data-sg-level="${u.id}" ${!price || locked || progress.coins < price ? 'disabled' : ''}>
        <span class="sg-up-pic"><img src="${portrait(u.id, level)}" data-trim="${portrait(u.id, level)}" alt=""></span>
        <span class="sg-up-text"><b>${name(u.id)} · ${t('siegeLevel', { n: level })}</b><span class="sg-pips">${Array.from({ length: max }, (_, k) => `<i class="${k < level ? 'is-on' : ''}"></i>`).join('')}</span></span>
        <span class="sg-up-cost">${!price ? t('siegeMax') : locked ? '🔒' : `<img src="/images/game/store/coins-2.webp" alt="">${price}`}</span></button>`;
    }).join('');
    return rows ? `<h2 class="sg-heading">${t('siegeTroopLevels')}</h2><div class="sg-upgrades">${rows}</div>` : '';
  };
  const worldName = (n: number) => t(`world${n}Name` as Key);
  const focus = () => root.querySelector<HTMLElement>('.sg-overlay button, .sg-primary, .sg-play, button')?.focus();
  function close() {
    if (finished) return; finished = true;
    cancelAnimationFrame(frame); battleAbort.abort(); abort.abort(); root.remove(); siblings.forEach(({ el, inert }) => el.inert = inert);
    closeActive = undefined; onClose(); previousFocus?.isConnected && previousFocus.focus();
  }
  closeActive = close;
  /** The preparation screen's tab: the world map, the army, or the workshop (the mode's shop). */
  let prepTab: 'map' | 'army' | 'shop' = 'map';
  const won = (n: number) => progress.victories.includes(n);
  const firstWin = (n: number) => 160 + n * 30;
  function prep() {
    cancelAnimationFrame(frame); battleAbort.abort(); state = null; paused = false;
    const tabs = (['map', 'army', 'shop'] as const).map(k => `<button role="tab" class="${prepTab === k ? 'is-on' : ''}" aria-selected="${prepTab === k}" data-sg-prep="${k}"><img src="/images/game/${k === 'map' ? 'ui/ring_world' : k === 'army' ? 'enemies/original-bug-0' : 'store/coins-2'}.webp" alt="">${t(k === 'map' ? 'siegeTabMap' : k === 'army' ? 'siegeTabArmy' : 'siegeTabShop')}</button>`).join('');
    // The map: the action modes' own islands, locked ones greyed with the padlock ring, won ones with the check ring.
    const isles = Array.from({ length: 9 }, (_, i) => {
      const n = i + 1, open = n <= progress.unlocked;
      return `<button class="sg-isle ${n === world ? 'is-on' : ''} ${open ? '' : 'is-locked'}" data-sg-world-pick="${n}" ${open ? '' : 'disabled'} aria-pressed="${n === world}" aria-label="${n}. ${worldName(n)}">
        <img src="/images/game/map/${ISLES[i]}.webp" alt=""><span class="sg-isle-n">${n}</span>
        ${open ? won(n) ? '<img class="sg-isle-ring" src="/images/game/ui/ring_check.webp" alt="">' : '' : '<img class="sg-isle-ring" src="/images/game/ui/ring_lock.webp" alt="">'}
        <b>${worldName(n)}</b></button>`;
    }).join('');
    const map = `<div class="sg-isles" role="list">${isles}</div>
      <article class="sg-world" style="background-image:linear-gradient(90deg,#08101ef2 30%,#08101e66),url('${backdropUrl(world)}')">
        <img class="sg-world-boss" src="${guardianUrl(world)}" alt="">
        <span class="sg-eyebrow">${t('siegeWorld')} · ${world}</span><h2>${worldName(world)}</h2>
        <p>${t(`world${world}Text` as Key)}</p>
        <p class="sg-guard"><img src="/images/game/ui/boss_plate.webp" alt=""><span>${t('siegeGuardian')}: <b>${t(GUARDIAN_NAMES[world - 1])}</b></span></p>
        <p class="sg-prize"><img src="/images/game/store/coins-2.webp" alt="">${won(world) ? t('siegeRepeatWin', { n: 45 + world * 5 }) : t('siegeFirstWin', { n: firstWin(world) })}</p>
        <button class="sg-play" data-sg="launch" ${selected.length ? '' : 'disabled'}><span class="sg-play-tri" aria-hidden="true"></span>${t('siegeLaunch')}</button>
      </article>`;
    const army = `<p class="sg-muted">${t('siegeChoose')}</p>
      ${([false, true] as const).map(flying => `<h2 class="sg-heading">${t(flying ? 'siegeArmyAir' : 'siegeArmyLand', { n: selected.filter(id => air(id) === flying).length, max: DECK })}</h2><div class="sg-roster">${ALLIES.filter(u => !!u.air === flying).map(u => `<button class="sg-card ${selected.includes(u.id) ? 'is-selected' : ''}" data-sg-unit="${u.id}" aria-pressed="${selected.includes(u.id)}" ${u.unlock > progress.unlocked ? 'disabled' : ''}><span class="sg-check">${selected.includes(u.id) ? '✓' : u.unlock > progress.unlocked ? '🔒' : ''}</span><img src="${portrait(u.id)}" data-trim="${portrait(u.id)}" alt=""><strong>${name(u.id)}</strong><small>${t(`siegeRole${u.id}` as Key)}</small><small class="sg-stat">${u.unlock > progress.unlocked ? t('siegeUnlock', { n: u.unlock }) : t('siegeStats', { cost: u.cost, hp: u.hp, damage: u.damage })}</small></button>`).join('')}</div>`).join('')}
      <p class="sg-message" role="status"></p>`;
    const shop = `<p class="sg-muted">${t('siegeShopNote')}</p><div class="sg-upgrades">${progress.upgrades.map((level, i) => `<button data-sg-upgrade="${i}" ${level >= 5 || progress.coins < upgradePrice(level) ? 'disabled' : ''}>
        <span class="sg-up-pic"><img src="/images/game/${upgradePic(i, level)}.webp" alt=""></span>
        <span class="sg-up-text"><b>${t(`siegeUpgrade${i}` as Key)}</b><span class="sg-pips">${Array.from({ length: 5 }, (_, k) => `<i class="${k < level ? 'is-on' : ''}"></i>`).join('')}</span></span>
        <span class="sg-up-cost">${level >= 5 ? t('siegeMax') : `<img src="/images/game/store/coins-2.webp" alt="">${upgradePrice(level)}`}</span></button>`).join('')}</div>
      ${troopRows()}`;
    root.innerHTML = `<div class="sg-shell sg-prep"><header class="sg-top"><button class="sg-back" data-sg="exit" aria-label="${t('siegeExit')}">←</button>
        <h1 class="sg-title"><small>${t('siegeSoon')}</small>${t('siegeName')}</h1>
        <span class="sg-coins"><img src="/images/game/store/coins-2.webp" alt="">${progress.coins}</span></header>
      <nav class="sg-ptabs" role="tablist">${tabs}</nav>
      <section class="sg-page">${prepTab === 'map' ? map : prepTab === 'army' ? army : shop}</section>
      <details class="sg-help"><summary>${t('siegeHow')}</summary><p>${t('siegeIntro')}</p><p>${t('siegeInstructions')}</p><p>${t('siegeKeys')}</p><p>${t('siegeRotate')}</p><p>${t('siegePreviewNote')}</p></details></div>`;
    trimImages(root); focus();
  }
  function start() {
    cancelAnimationFrame(frame); battleAbort.abort(); battleAbort = new AbortController();
    const battleOptions = { signal: battleAbort.signal };
    if (!selected.length) return;
    progress.deck = [...selected]; persist(); state = newSiege(progress, world); bossTalked = false;
    preload(world, selected, progress.levels); paused = false; camera.x = -Infinity;
    // Laid out like Cartoon Wars 2: mana top left, both fortresses' health face to face in the middle, coins and pause
    // top right; the field with the bow's aim on our wall; one bar below with the magic, the troop cards and the bow.
    root.innerHTML = `<div class="sg-battle"><header class="sg-hud">
        <div class="sg-mana"><img src="/images/game/ui/orb.webp" alt=""><span><b data-sg-energy></b><small data-sg-status></small></span><progress data-sg-meter></progress></div>
        <div class="sg-vs"><img class="sg-vs-pic" src="/images/game/fortress/backlog/town-hall.webp" alt=""><span class="sg-hp"><i data-sg-bar="0"></i><small data-sg-health="0"></small></span><b>VS</b><span class="sg-hp is-enemy"><i data-sg-bar="1"></i><small data-sg-health="1"></small></span><img class="sg-vs-pic" src="${guardianUrl(world)}" alt=""></div>
        <div class="sg-hud-actions"><span class="sg-clock" data-sg-clock></span><span class="sg-gold">🪙 ${progress.coins}</span><button data-sg="pause" aria-label="${t('pause')}">⏸</button></div></header>
      <div class="sg-field"><div class="sg-turn" role="status"><span aria-hidden="true">📱↻</span><b>${t('siegeTurn')}</b><button type="button" data-sg-turn aria-label="${t('siegeTurnOk')}">✕</button></div><canvas class="sg-arena" tabindex="0" role="img" aria-label="${t('siegeBattlefield')}"></canvas>
      <div class="sg-aim" role="slider" tabindex="0" aria-orientation="vertical" aria-valuemin="140" aria-valuemax="1080" aria-valuenow="700" aria-label="${t('siegeAim')}" data-sg-aim><i class="sg-aim-up" aria-hidden="true"></i><i class="sg-aim-knob" aria-hidden="true"></i><i class="sg-aim-down" aria-hidden="true"></i></div>
      <div class="sg-camera"><button data-sg="home" aria-label="${t('siegeHome')}">◀</button><input type="range" min="0" max="1000" value="0" data-sg-camera aria-label="${t('siegeCamera')}"><button data-sg="enemy" aria-label="${t('siegeEnemy')}">▶</button></div></div>
      <div class="sg-bar"><div class="sg-tabs" role="tablist">${(['land', 'air', 'special'] as const).map(k => `<button role="tab" data-sg-tab="${k}" aria-label="${t(k === 'land' ? 'siegeTabLand' : k === 'air' ? 'siegeTabAir' : 'siegeTabSpecial')}">${k === 'land' ? 'L' : k === 'air' ? 'A' : 'S'}</button>`).join('')}</div>
      <div class="sg-deck" data-sg-cards></div>
      <button data-sg="fire" class="sg-bow" aria-label="${t('siegeCannon')}"><img src="/images/game/arrows/fire.webp" alt=""><span data-sg-bow-label></span></button></div></div>`;
    tab = 'land'; cards();
    const canvas = q<HTMLCanvasElement>('canvas'); const ctx = canvas.getContext('2d')!;
    let pointer: { id: number; start: number; camera: number; moved: boolean } | null = null;
    canvas.addEventListener('pointerdown', e => {
      if (paused || !state || state.phase !== 'fight') return;
      pointer = { id: e.pointerId, start: e.clientX, camera: camera.x, moved: false }; canvas.setPointerCapture(e.pointerId);
    }, battleOptions);
    canvas.addEventListener('pointermove', e => {
      if (!pointer || e.pointerId !== pointer.id) return;
      const delta = e.clientX - pointer.start; if (Math.abs(delta) > 6) pointer.moved = true;
      if (pointer.moved) camera.x = Math.max(camera.min ?? 0, Math.min(FIELD - camera.width, pointer.camera - delta * camera.width / canvas.clientWidth));
    }, battleOptions);
    canvas.addEventListener('pointerup', e => {
      if (pointer?.id !== e.pointerId) return;
      if (!pointer.moved && state && !paused) {
        const rect = canvas.getBoundingClientRect(); state.aim = Math.max(120, Math.min(FIELD - 120, camera.x + (e.clientX - rect.left) * camera.width / rect.width - Math.max(0, (camera.width - FIELD) / 2)));
      }
      pointer = null;
    }, battleOptions);
    canvas.addEventListener('pointercancel', () => pointer = null, battleOptions);
    // The aim is a stick, Cartoon Wars-style: its knob rests in the middle; pushed up the arrows' landing spot moves
    // away (down, nearer) as long as it is held, faster the further it is pushed, and let go the knob springs back to
    // the middle while the landing spot stays where it was.
    const aimPad = q<HTMLElement>('[data-sg-aim]'), knob = q<HTMLElement>('.sg-aim-knob');
    let stick: { id: number; mid: number; half: number } | null = null;
    const push = (y: number) => { if (!stick) return; aimPush = Math.max(-1, Math.min(1, (stick.mid - y) / stick.half)); knob.style.transform = `translateY(${(-aimPush * stick.half * 0.8).toFixed(1)}px)`; };
    aimPad.addEventListener('pointerdown', e => {
      e.preventDefault(); const r = aimPad.getBoundingClientRect();
      stick = { id: e.pointerId, mid: r.top + r.height / 2, half: r.height / 2 - 14 }; aimPad.setPointerCapture(e.pointerId); aimPad.classList.add('is-held'); push(e.clientY);
    }, battleOptions);
    aimPad.addEventListener('pointermove', e => { if (stick?.id === e.pointerId) push(e.clientY); }, battleOptions);
    const release = () => { stick = null; aimPush = 0; knob.style.transform = ''; aimPad.classList.remove('is-held'); };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) aimPad.addEventListener(type, release, battleOptions);
    aimPad.addEventListener('keydown', e => { if (!state || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return; e.preventDefault(); e.stopPropagation(); state.aim = aimAt(state.aim + (e.key === 'ArrowUp' ? 40 : -40)); }, battleOptions);
    // The bow is a switch: one tap starts the arrows, the next stops them.
    q<HTMLButtonElement>('[data-sg="fire"]').addEventListener('click', e => { e.stopPropagation(); if (state && !paused) { toggleBow(state); updateUi(); } }, battleOptions);
    last = performance.now(); accumulator = 0; uiAt = 0;
    function loop(now: number) {
      if (!state || finished) return;
      const delta = Math.min(0.15, (now - last) / 1000); last = now;
      if (!paused && state.phase === 'fight') {
        if (aimPush) state.aim = aimAt(state.aim + aimPush * Math.abs(aimPush) * AIM_SPEED * delta);
        accumulator += delta;
        const shot = state.shots ?? 0;
        while (accumulator >= 1 / 30) { tick(state, 1 / 30); accumulator -= 1 / 30; }
        // Each bow shot is heard (at most one sound a frame, so a fast volley stays a rattle, not a roar).
        if ((state.shots ?? 0) > shot) sound('arrow');
        troopSounds(now);
      }
      render(ctx, canvas, state, camera, reduced);
      // The aim control stands on the deck, wherever the field puts it.
      q<HTMLElement>('.sg-aim').style.bottom = `calc(${((1 - (camera.deck ?? 0.5)) * 100).toFixed(1)}% + 6px)`;
      if (now >= uiAt) { updateUi(); uiAt = now + 100; }
      if (state.phase !== 'fight' && !state.paid) result();
      // The guardian speaks the moment it joins, the battle held until the scene ends.
      else if (state.bossSpawned && !bossTalked && state.phase === 'fight') {
        bossTalked = true; paused = true; updateUi();
        talk(bossTalk(world), () => { paused = false; last = performance.now(); accumulator = 0; q('canvas').focus(); });
      }
      frame = requestAnimationFrame(loop);
    }
    updateUi(); canvas.focus(); frame = requestAnimationFrame(loop);
  }
  /** Fill the bar's middle with the active tab's cards: its troops, or the special powers. */
  function cards() {
    root.querySelectorAll<HTMLElement>('[data-sg-tab]').forEach(b => { const on = b.dataset.sgTab === tab; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); });
    const list = tabCards();
    q('[data-sg-cards]').innerHTML = tab === 'special'
      ? `<button data-sg="generator"></button><button data-sg="strike"></button><button data-sg="missile"></button>`
      : list.length ? list.map((id, i) => `<button data-sg-summon="${id}" aria-label="${i + 1}. ${name(id)} · ${specAt(id, progress.levels[id]).cost}"><img src="${portrait(id, progress.levels[id])}" data-trim="${portrait(id, progress.levels[id])}" alt=""><small data-sg-cost="${id}"></small><i class="sg-cooldown" data-sg-cooldown="${id}"></i></button>`).join('')
      : `<p class="sg-empty">${t('siegeAirEmpty')}</p>`;
    trimImages(root); updateUi();
  }
  function updateUi() {
    if (!state) return; const s = state;
    // Once the fortress falls, the enemy's bar is its guardian's, as in Cartoon Wars 2.
    const guard = s.units.find(u => u.boss && u.side);
    for (const side of [0, 1]) {
      const [hp, max] = side && guard ? [guard.hp, guard.maxHp] : [s.hp[side], s.maxHp[side]];
      q(`[data-sg-health="${side}"]`).textContent = `${Math.ceil(Math.max(0, hp))}`;
      q(`[data-sg-bar="${side}"]`).style.width = `${Math.max(0, hp) / max * 100}%`;
    }
    q('.sg-hp.is-enemy').classList.toggle('is-boss', !!guard);
    q('[data-sg-clock]').textContent = clock(Math.max(0, LIMIT - s.time));
    q('[data-sg-energy]').textContent = `${Math.floor(s.energy)} / ${energyMax(s)}`;
    const meter = q<HTMLProgressElement>('[data-sg-meter]'); meter.max = energyMax(s); meter.value = s.energy;
    q('[data-sg-status]').textContent = `+${energyRate(s).toFixed(1)}/s · ${s.units.filter(u => !u.side).length}/${CAP}`;
    const generator = root.querySelector<HTMLButtonElement>('[data-sg="generator"]');
    if (generator) { setPicButton(generator, '/images/game/ui/orb.webp', s.generator >= 4 ? t('siegeMax') : `${s.generator}/4 · ${generatorPrice(s)}`); generator.setAttribute('aria-label', s.generator >= 4 ? t('siegeMax') : t('siegeGenerator', { n: s.generator, cost: generatorPrice(s) })); generator.disabled = paused || s.phase !== 'fight' || s.generator >= 4 || s.energy < generatorPrice(s); }
    const bowButton = q<HTMLButtonElement>('[data-sg="fire"]');
    const reloading = !s.bow.drawing && s.bow.quiver < BOW.cost;
    q('[data-sg-bow-label]').textContent = reloading ? t('siegeBowEmpty') : t('siegeCannon');
    // The bow button is a ball that empties as the quiver does: full colour when full, see-through when empty.
    bowButton.style.setProperty('--q', (s.bow.quiver / BOW.max).toFixed(3));
    bowButton.classList.toggle('is-empty', reloading); bowButton.classList.toggle('is-drawing', s.bow.drawing); bowButton.setAttribute('aria-pressed', String(s.bow.drawing));
    bowButton.disabled = paused || s.phase !== 'fight';
    for (const [action, key, cd, pic] of [['strike', 'siegeSpell', s.spell, 'skills/bolt'], ['missile', 'siegeMissile', s.rocket, 'fx/rocket']] as const) {
      const button = root.querySelector<HTMLButtonElement>(`[data-sg="${action}"]`); if (!button) continue;
      setPicButton(button, `/images/game/${pic}.webp`, cd > 0 ? `${Math.ceil(cd)}s` : t('siegeReady')); button.setAttribute('aria-label', t(key)); button.disabled = paused || s.phase !== 'fight' || cd > 0;
    }
    for (const id of tabCards()) {
      q<HTMLButtonElement>(`[data-sg-summon="${id}"]`).disabled = paused || !canSummon(s, id);
      q(`[data-sg-cost="${id}"]`).textContent = s.cooldowns[id] > 0 ? `${Math.ceil(s.cooldowns[id])}s` : `⚡ ${costOf(s, id)}`;
      q(`[data-sg-cooldown="${id}"]`).style.width = `${s.cooldowns[id] / UNITS[id].cooldown * 100}%`;
    }
    q('[data-sg-aim]').setAttribute('aria-valuenow', String(Math.round(aimAt(s.aim))));
    q<HTMLInputElement>('[data-sg-camera]').value = String(Math.round(camera.x / Math.max(1, FIELD - camera.width) * 1000));
  }
  function modal(content: string) {
    root.querySelector('.sg-overlay')?.remove();
    const overlay = document.createElement('div'); overlay.className = 'sg-overlay'; overlay.innerHTML = `<div class="sg-dialog" role="dialog" aria-modal="true">${content}</div>`;
    q('.sg-battle').inert = true; root.append(overlay); focus();
  }
  /** A story scene, Cartoon Wars-style: the world's picture behind, the speaker's portrait on their side, a line at a
      time. Tap or Next to go on, Skip to jump to the end; `done` runs after the last line. */
  let story: (() => void) | null = null;
  function talk(lines: Line[], done: () => void) {
    let at = 0;
    root.querySelector('.sg-overlay')?.remove();
    const overlay = document.createElement('div'); overlay.className = 'sg-overlay sg-story';
    overlay.style.backgroundImage = `linear-gradient(#050a14aa, #050a14ee), url('${backdropUrl(world)}')`;
    const battle = root.querySelector<HTMLElement>('.sg-battle'); if (battle) battle.inert = true;
    const end = () => { story = null; overlay.remove(); if (battle) battle.inert = false; done(); };
    const show = () => {
      const l = lines[at], last = at === lines.length - 1;
      const who = l.who === 'boss' ? t(GUARDIAN_NAMES[world - 1]) : l.who === 'hero' ? hero.name.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`) : t('siegeNarrator');
      const pic = l.who === 'boss' ? guardianUrl(world) : l.who === 'hero' ? hero.pic : '';
      overlay.innerHTML = `<div class="sg-scene is-${l.who}" role="dialog" aria-modal="true" aria-label="${t('siegeName')}">
        <span class="sg-eyebrow">${t(`world${world}Name` as Key)}</span>
        ${pic ? `<img class="sg-speaker" src="${pic}" alt="">` : ''}
        <div class="sg-line"><b>${who}</b><p>${t(l.key)}</p>
        <div class="sg-dialog-actions"><button class="sg-primary" data-story="next">${last ? t(state ? 'resume' : 'siegeTalkGo') : `${t('siegeTalkNext')} ▶`}</button>${last ? '' : `<button data-story="skip">${t('siegeTalkSkip')}</button>`}</div></div></div>`;
      overlay.querySelector<HTMLElement>('[data-story="next"]')?.focus();
    };
    const next = () => { if (++at >= lines.length) end(); else show(); };
    overlay.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-story]');
      e.stopPropagation();
      if (b?.dataset.story === 'skip') end(); else next();
    });
    story = end;
    root.append(overlay); show();
  }
  function pause() {
    if (!state || state.phase !== 'fight' || paused || story) return;
    paused = true; updateUi();
    modal(`<span class="sg-eyebrow">${t('siegeName')}</span><h2>${t('paused')}</h2><p>${t('siegePauseNote')}</p><div class="sg-dialog-actions"><button class="sg-primary" data-sg="resume">${t('resume')}</button><button data-sg="prep">${t('siegeLeave')}</button></div>`);
  }
  function resume() {
    root.querySelector('.sg-overlay')?.remove(); q('.sg-battle').inert = false; paused = false; last = performance.now(); accumulator = 0; q('canvas').focus();
  }
  function result() {
    if (!state) return;
    const reward = settle(progress, state); persist(); paused = true;
    modal(`<span class="sg-eyebrow">${t('siegeSoon')}</span><h2>${t(state.phase === 'won' ? 'siegeWon' : 'siegeLost')}</h2><p>${t('siegeResult', { kills: state.kills, time: clock(state.time) })}</p>${state.phase === 'won' ? `<strong>${t('siegeReward', { n: reward })}</strong>${world === 9 ? `<p>${t('siegeComplete')}</p>` : ''}` : `<p>${t('siegeRetryHint')}</p>`}<div class="sg-dialog-actions">${state.phase === 'won' && world < 9 ? `<button class="sg-primary" data-sg="next">${t('siegeNext')}</button>` : `<button class="sg-primary" data-sg="retry">${t('again')}</button>`}<button data-sg="prep">${t('siegeLeave')}</button></div>`);
  }
  root.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled) return;
    const { sg: action, sgUnit: unit, sgUpgrade: up, sgSummon: summonId } = button.dataset;
    if (unit !== undefined && !state) {
      const id = Number(unit); if (selected.includes(id)) selected = selected.filter(n => n !== id);
      else if (selected.filter(n => air(n) === air(id)).length < DECK) selected.push(id);
      else { q('.sg-message').textContent = t('siegeFull'); return; }
      prep(); root.querySelector<HTMLElement>(`[data-sg-unit="${id}"]`)?.focus(); return;
    }
    if (button.dataset.sgPrep && !state) { prepTab = button.dataset.sgPrep as typeof prepTab; prep(); root.querySelector<HTMLElement>(`[data-sg-prep="${prepTab}"]`)?.focus(); return; }
    if (button.dataset.sgWorldPick && !state) { world = Number(button.dataset.sgWorldPick); const left = root.querySelector('.sg-isles')?.scrollLeft ?? 0; prep(); const isles = root.querySelector('.sg-isles'); if (isles) isles.scrollLeft = left; root.querySelector<HTMLElement>(`[data-sg-world-pick="${world}"]`)?.focus(); return; }
    if (up !== undefined && !state) { if (upgrade(progress, Number(up))) { persist(); prep(); } return; }
    if (button.dataset.sgLevel !== undefined && !state) { if (levelUp(progress, Number(button.dataset.sgLevel))) { persist(); prep(); } return; }
    if (button.hasAttribute('data-sg-turn')) { button.parentElement?.remove(); return; }
    if (button.dataset.sgTab && state) { tab = button.dataset.sgTab as typeof tab; cards(); return; }
    if (summonId !== undefined && state && !paused) { if (summon(state, Number(summonId))) sound('click'); updateUi(); return; }
    if (action === 'exit') close();
    else if (action === 'launch') talk(intro(world), start);
    else if (action === 'retry') start();
    else if (action === 'prep') prep();
    else if (action === 'next') { world = Math.min(9, world + 1); prep(); }
    else if (action === 'pause') pause();
    else if (action === 'resume') resume();
    else if (action === 'home') camera.x = -Infinity;
    else if (action === 'enemy') camera.x = Math.max(0, FIELD - camera.width);
    else if (state && !paused) { if (action === 'generator') improveGenerator(state); if (action === 'strike' && strike(state)) sound('strike'); if (action === 'missile' && missile(state)) sound('boom'); updateUi(); }
  }, options);
  root.addEventListener('input', event => {
    const el = event.target as HTMLInputElement;
    if (el.hasAttribute('data-sg-camera')) camera.x = Math.max(0, FIELD - camera.width) * Number(el.value) / 1000;
  }, options);
  // Capture keyboard input so legacy page-level hotkeys never run behind this modal.
  const keyHandler = (e: KeyboardEvent) => {
    e.stopImmediatePropagation();
    if (e.key === 'Tab') {
      const scope = root.querySelector('.sg-overlay') ?? root;
      const items = [...scope.querySelectorAll<HTMLElement>('button:not(:disabled), select, input, canvas[tabindex], summary')];
      const first = items[0], end = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end?.focus(); }
      else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first?.focus(); }
      return;
    }
    if (story) { if (e.key === 'Escape') { e.preventDefault(); story(); } return; }
    if (e.key === 'Escape') { e.preventDefault(); if (!state) close(); else if (state.phase === 'fight') paused ? resume() : pause(); return; }
    if (!state || paused || e.repeat || /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName)) return;
    const key = e.key.toLowerCase();
    if ('12345efqrlas'.includes(key) || key.startsWith('arrow')) e.preventDefault();
    if (key === 'l' || key === 'a' || key === 's') { tab = key === 'l' ? 'land' : key === 'a' ? 'air' : 'special'; cards(); return; }
    if (/^[1-5]$/.test(key)) { const n = Number(key) - 1; if (tab === 'special') [() => improveGenerator(state!), () => strike(state!), () => missile(state!)][n]?.(); else { const id = tabCards()[n]; if (id !== undefined) summon(state, id); } }
    else if (key === 'r') missile(state);
    else if (key === 'e') improveGenerator(state); else if (key === 'f') toggleBow(state); else if (key === 'q') strike(state);
    else if (key === 'arrowleft') camera.x = Math.max(camera.min ?? 0, camera.x - 100); else if (key === 'arrowright') camera.x = Math.min(Math.max(0, FIELD - camera.width), camera.x + 100);
    updateUi();
  };
  window.addEventListener('keydown', keyHandler, { ...options, capture: true });
  window.addEventListener('keyup', e => e.stopImmediatePropagation(), { ...options, capture: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, options);
  window.addEventListener('blur', pause, options);
  prep();
}
