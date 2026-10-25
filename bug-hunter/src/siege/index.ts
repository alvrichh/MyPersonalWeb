import './siege.css';
import { storage } from '../../lib/storage';
import type { Key, T } from '../strings';
import { CAP, FIELD, LIMIT, SAVE_KEY, UNITS, canSummon, energyMax, energyRate, fire, generatorPrice, improveGenerator, newSiege, readProgress, settle, strike, summon, tick, upgrade, upgradePrice, type Siege } from './model';
import { portrait, preload, render, type Camera } from './view';

const clock = (n: number) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
let closeActive: (() => void) | undefined;
/** Own root, event lifecycle and save: existing game modes are never entered or mutated. */
export function openSiege(t: T, onClose: () => void) {
  closeActive?.();
  const progress = readProgress(storage.get(SAVE_KEY));
  let selected = [...progress.deck], world = progress.unlocked;
  let state: Siege | null = null, paused = false, finished = false;
  let frame = 0, last = 0, accumulator = 0, uiAt = 0;
  const camera: Camera = { x: 0, width: 650 };
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
  const worldName = (n: number) => t(`world${n}Name` as Key);
  const focus = () => root.querySelector<HTMLElement>('.sg-overlay button, .sg-primary, button')?.focus();
  function close() {
    if (finished) return; finished = true;
    cancelAnimationFrame(frame); battleAbort.abort(); abort.abort(); root.remove(); siblings.forEach(({ el, inert }) => el.inert = inert);
    closeActive = undefined; onClose(); previousFocus?.isConnected && previousFocus.focus();
  }
  closeActive = close;
  function prep() {
    cancelAnimationFrame(frame); battleAbort.abort(); state = null; paused = false;
    root.innerHTML = `<div class="sg-shell"><header class="sg-top"><span class="sg-eyebrow">BUG HUNTER / ${t('siegeName')}</span><button data-sg="exit">← ${t('siegeExit')}</button></header>
      <div class="sg-hero"><span class="sg-eyebrow">${t('siegeSoon')}</span><h1 class="sg-title">${t('siegeName')}</h1><p class="sg-intro">${t('siegeIntro')}</p>
      <div class="sg-summary"><label>${t('siegeWorld')} <select data-sg-world aria-label="${t('siegeWorld')}">${Array.from({ length: 9 }, (_, i) => `<option value="${i + 1}" ${world === i + 1 ? 'selected' : ''} ${i + 1 > progress.unlocked ? 'disabled' : ''}>${i + 1}. ${worldName(i + 1)} ${progress.victories.includes(i + 1) ? '✓' : i + 1 > progress.unlocked ? '🔒' : ''}</option>`).join('')}</select></label><button class="sg-primary" data-sg="launch" ${selected.length !== 5 ? 'disabled' : ''}>${t('siegeLaunch')} →</button></div><p class="sg-muted">${t('siegePreviewNote')}</p></div>
      <h2 class="sg-heading">${t('siegeArmy', { n: selected.length })}</h2><p class="sg-muted">${t('siegeChoose')}</p><div class="sg-roster">${UNITS.map(u => `<button class="sg-card ${selected.includes(u.id) ? 'is-selected' : ''}" data-sg-unit="${u.id}" aria-pressed="${selected.includes(u.id)}" ${u.unlock > progress.unlocked ? 'disabled' : ''}><span class="sg-check">${selected.includes(u.id) ? '✓' : ''}</span><img src="${portrait(u.id)}" alt=""><strong>${name(u.id)}</strong><small>${t(`siegeRole${u.id}` as Key)}</small><small>${u.unlock > progress.unlocked ? t('siegeUnlock', { n: u.unlock }) : t('siegeStats', { cost: u.cost, hp: u.hp, damage: u.damage })}</small></button>`).join('')}</div>
      <p class="sg-message" role="status"></p><div class="sg-top"><h2 class="sg-heading">${t('siegeUpgrades')}</h2><strong>${t('siegeCoins', { n: progress.coins })}</strong></div>
      <div class="sg-upgrades">${progress.upgrades.map((level, i) => `<button data-sg-upgrade="${i}" ${level >= 5 || progress.coins < upgradePrice(level) ? 'disabled' : ''}><b>${t(`siegeUpgrade${i}` as Key)}</b><small>${level >= 5 ? t('siegeMax') : t('siegeUpgradeBuy', { n: level, cost: upgradePrice(level) })}</small></button>`).join('')}</div>
      <details class="sg-help"><summary>${t('siegeHow')}</summary><p>${t('siegeInstructions')}</p><p>${t('siegeKeys')}</p><p>${t('siegeRotate')}</p></details></div>`;
    focus();
  }
  function start() {
    cancelAnimationFrame(frame); battleAbort.abort(); battleAbort = new AbortController();
    const battleOptions = { signal: battleAbort.signal };
    if (selected.length !== 5) return;
    progress.deck = [...selected]; persist(); state = newSiege(progress, world);
    preload(world, selected); paused = false; camera.x = 0;
    root.innerHTML = `<div class="sg-battle"><header class="sg-hud"><div><small>${t('siegeHome')}</small><strong data-sg-health="0"></strong></div><div><small>${worldName(world)} · ${t('siegeSoon')}</small><strong data-sg-clock></strong></div><div><small>${t('siegeEnemy')}</small><strong data-sg-health="1"></strong></div><div class="sg-hud-actions"><button data-sg="pause">${t('pause')}</button></div></header>
      <canvas class="sg-arena" tabindex="0" role="img" aria-label="${t('siegeBattlefield')}"></canvas>
      <div class="sg-camera"><button data-sg="home">◀ ${t('siegeHome')}</button><input type="range" min="0" max="1000" value="0" data-sg-camera aria-label="${t('siegeCamera')}"><button data-sg="enemy">${t('siegeEnemy')} ▶</button></div>
      <div class="sg-controls"><div class="sg-resource"><strong data-sg-energy></strong><progress data-sg-meter></progress><small class="sg-status" data-sg-status></small></div><button data-sg="generator"></button><button data-sg="fire"></button><button data-sg="strike"></button></div>
      <div class="sg-deck">${selected.map((id, i) => `<button data-sg-summon="${id}" aria-label="${i + 1}. ${name(id)} · ${UNITS[id].cost}"><img src="${portrait(id)}" alt=""><span><b>${name(id)}</b><small data-sg-cost="${id}"></small></span><i class="sg-cooldown" data-sg-cooldown="${id}"></i></button>`).join('')}</div></div>`;
    const canvas = q<HTMLCanvasElement>('canvas'); const ctx = canvas.getContext('2d')!;
    let pointer: { id: number; start: number; camera: number; moved: boolean } | null = null;
    canvas.addEventListener('pointerdown', e => {
      if (paused || !state || state.phase !== 'fight') return;
      pointer = { id: e.pointerId, start: e.clientX, camera: camera.x, moved: false }; canvas.setPointerCapture(e.pointerId);
    }, battleOptions);
    canvas.addEventListener('pointermove', e => {
      if (!pointer || e.pointerId !== pointer.id) return;
      const delta = e.clientX - pointer.start; if (Math.abs(delta) > 6) pointer.moved = true;
      if (pointer.moved) camera.x = Math.max(0, Math.min(FIELD - camera.width, pointer.camera - delta * camera.width / canvas.clientWidth));
    }, battleOptions);
    canvas.addEventListener('pointerup', e => {
      if (pointer?.id !== e.pointerId) return;
      if (!pointer.moved && state && !paused) {
        const rect = canvas.getBoundingClientRect(); state.aim = Math.max(120, Math.min(FIELD - 120, camera.x + (e.clientX - rect.left) * camera.width / rect.width - Math.max(0, (camera.width - FIELD) / 2)));
      }
      pointer = null;
    }, battleOptions);
    canvas.addEventListener('pointercancel', () => pointer = null, battleOptions);
    last = performance.now(); accumulator = 0; uiAt = 0;
    function loop(now: number) {
      if (!state || finished) return;
      const delta = Math.min(0.15, (now - last) / 1000); last = now;
      if (!paused && state.phase === 'fight') {
        accumulator += delta;
        while (accumulator >= 1 / 30) { tick(state, 1 / 30); accumulator -= 1 / 30; }
      }
      render(ctx, canvas, state, camera, reduced);
      if (now >= uiAt) { updateUi(); uiAt = now + 100; }
      if (state.phase !== 'fight' && !state.paid) result();
      frame = requestAnimationFrame(loop);
    }
    updateUi(); canvas.focus(); frame = requestAnimationFrame(loop);
  }
  function updateUi() {
    if (!state) return; const s = state;
    q('[data-sg-health="0"]').textContent = `${Math.ceil(s.hp[0])} / ${s.maxHp[0]}`;
    q('[data-sg-health="1"]').textContent = `${Math.ceil(s.hp[1])} / ${s.maxHp[1]}`;
    q('[data-sg-clock]').textContent = `${clock(s.time)} / ${clock(LIMIT)}`;
    q('[data-sg-energy]').textContent = t('siegeEnergy', { n: Math.floor(s.energy), max: energyMax(s) });
    const meter = q<HTMLProgressElement>('[data-sg-meter]'); meter.max = energyMax(s); meter.value = s.energy;
    q('[data-sg-status]').textContent = `+${energyRate(s).toFixed(1)}/s · ${t('siegePopulation', { n: s.units.filter(u => !u.side).length, max: CAP })}`;
    const generator = q<HTMLButtonElement>('[data-sg="generator"]'); generator.textContent = s.generator >= 4 ? t('siegeMax') : t('siegeGenerator', { n: s.generator, cost: generatorPrice(s) }); generator.disabled = paused || s.phase !== 'fight' || s.generator >= 4 || s.energy < generatorPrice(s);
    for (const [action, key, cd] of [['fire', 'siegeCannon', s.weapon], ['strike', 'siegeSpell', s.spell]] as const) {
      const button = q<HTMLButtonElement>(`[data-sg="${action}"]`); button.textContent = `${t(key)} · ${cd > 0 ? `${Math.ceil(cd)}s` : t('siegeReady')}`; button.disabled = paused || s.phase !== 'fight' || cd > 0;
    }
    for (const id of selected) {
      q<HTMLButtonElement>(`[data-sg-summon="${id}"]`).disabled = paused || !canSummon(s, id);
      q(`[data-sg-cost="${id}"]`).textContent = s.cooldowns[id] > 0 ? `${Math.ceil(s.cooldowns[id])}s` : `⚡ ${UNITS[id].cost}`;
      q(`[data-sg-cooldown="${id}"]`).style.width = `${s.cooldowns[id] / UNITS[id].cooldown * 100}%`;
    }
    q<HTMLInputElement>('[data-sg-camera]').value = String(Math.round(camera.x / Math.max(1, FIELD - camera.width) * 1000));
  }
  function modal(content: string) {
    root.querySelector('.sg-overlay')?.remove();
    const overlay = document.createElement('div'); overlay.className = 'sg-overlay'; overlay.innerHTML = `<div class="sg-dialog" role="dialog" aria-modal="true">${content}</div>`;
    q('.sg-battle').inert = true; root.append(overlay); focus();
  }
  function pause() {
    if (!state || state.phase !== 'fight' || paused) return;
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
      else if (selected.length < 5) selected.push(id);
      else { q('.sg-message').textContent = t('siegeFull'); return; }
      prep(); root.querySelector<HTMLElement>(`[data-sg-unit="${id}"]`)?.focus(); return;
    }
    if (up !== undefined && !state) { if (upgrade(progress, Number(up))) { persist(); prep(); } return; }
    if (summonId !== undefined && state && !paused) { summon(state, Number(summonId)); updateUi(); return; }
    if (action === 'exit') close();
    else if (action === 'launch' || action === 'retry') start();
    else if (action === 'prep') prep();
    else if (action === 'next') { world = Math.min(9, world + 1); prep(); }
    else if (action === 'pause') pause();
    else if (action === 'resume') resume();
    else if (action === 'home') camera.x = 0;
    else if (action === 'enemy') camera.x = Math.max(0, FIELD - camera.width);
    else if (state && !paused) { if (action === 'generator') improveGenerator(state); if (action === 'fire') fire(state); if (action === 'strike') strike(state); updateUi(); }
  }, options);
  root.addEventListener('change', event => { if ((event.target as HTMLElement).hasAttribute('data-sg-world')) world = Number((event.target as HTMLSelectElement).value); }, options);
  root.addEventListener('input', event => { if ((event.target as HTMLElement).hasAttribute('data-sg-camera')) camera.x = Math.max(0, FIELD - camera.width) * Number((event.target as HTMLInputElement).value) / 1000; }, options);
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
    if (e.key === 'Escape') { e.preventDefault(); if (!state) close(); else if (state.phase === 'fight') paused ? resume() : pause(); return; }
    if (!state || paused || e.repeat || /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName)) return;
    const key = e.key.toLowerCase();
    if ('12345efq'.includes(key) || key.startsWith('arrow')) e.preventDefault();
    if (/^[1-5]$/.test(key)) summon(state, selected[Number(key) - 1]);
    else if (key === 'e') improveGenerator(state); else if (key === 'f') fire(state); else if (key === 'q') strike(state);
    else if (key === 'arrowleft') camera.x = Math.max(0, camera.x - 100); else if (key === 'arrowright') camera.x = Math.min(Math.max(0, FIELD - camera.width), camera.x + 100);
    updateUi();
  };
  window.addEventListener('keydown', keyHandler, { ...options, capture: true });
  window.addEventListener('keyup', e => e.stopImmediatePropagation(), { ...options, capture: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, options);
  window.addEventListener('blur', pause, options);
  prep();
}
