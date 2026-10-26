import './siege.css';
import { storage } from '../../lib/storage';
import type { Key, T } from '../strings';
import * as cartoonModel from './cartoon/model';
import * as cartoonView from './cartoon/view';
import * as legacyModel from './legacy/model';
import * as legacyView from './legacy/view';
import type { Camera } from './cartoon/view';
import type { Progress, Siege } from './cartoon/model';
import { GUARDIAN_NAMES, bossTalk, intro, type Line } from './legacy/story';
import * as cartoonStory from './cartoon/story';
/** Siege's two modes, each its own engine and save: Legacy (the old troops, the nine worlds and their story) and
    Cartoon (the new troops, six acts). Legacy's engine answers the same calls, its troops on a single level. */
type Mode = 'legacy' | 'cartoon';
const ENGINES = {
  cartoon: { m: cartoonModel, v: cartoonView },
  legacy: { m: legacyModel as unknown as typeof cartoonModel, v: legacyView as unknown as typeof cartoonView },
};
const { backdropUrl, guardianUrl } = legacyView;
/** The map's island pictures, world by world, and the workshop's pictures, upgrade by upgrade (army, fortress, energy, bow). */
/** Field units a second the landing spot moves with the stick pushed all the way. */
const AIM_SPEED = 650;
const ISLES = ['original', 'infierno', 'vikingos', 'lodo', 'jungla', 'rayo', 'robots', 'demonios', 'nucleo'];
const UPGRADE_PICS = ['items/gladHelm', 'items/plate', 'ui/orb', 'items/quiver'];
/** A workshop row's picture: the fortress and the crossbow show the look their level gives (`looksTier`). */
const upgradePic = (mode: Mode, i: number, level: number) => (mode === 'legacy' ? UPGRADE_PICS[i] : i === 1 ? `siege/castle-${cartoonModel.looksTier(level)}` : i === 3 ? `siege/xbow-${cartoonModel.looksTier(level)}` : UPGRADE_PICS[i]);

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
/** `music`: Siege Cartoon's songs, its menus' or its battles', or null to go back to the player's pick. */
export function openSiege(t: T, onClose: () => void, hero = { pic: '', name: '' }, sound: (name: string, vol?: number, pan?: number) => void = () => {}, music: (song: 'menu' | 'battle' | 'boss' | null) => void = () => {}) {
  closeActive?.();
  /** The mode being played (null on the mode screen), its engine and its save. */
  let mode: Mode | null = null, M = ENGINES.cartoon.m, V = ENGINES.cartoon.v;
  let progress: Progress = M.freshProgress();
  let selected: number[] = [], world = 1;
  let state: Siege | null = null, paused = false, finished = false;
  // Local checks (like `window.bugHunter` for the main game): the battle's state, read and nudged by test scripts.
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) Object.defineProperty(window, 'bugHunterSiege', { get: () => state, configurable: true });
  let frame = 0, last = 0, accumulator = 0, uiAt = 0, bossTalked = false, baseFell = false, lootHeard = 0, gustShown = false;
  /** How far the aim stick is pushed, -1 (down, nearer) to 1 (up, further); 0 at rest. */
  let aimPush = 0;
  /** The bottom bar's tab, Cartoon Wars 2's L · A · S: land troops, air troops, special powers. */
  let tab: 'land' | 'air' | 'special' = 'land';
  /** Army cards: a troop at a level (`id + (level - 1) * 100`; Legacy's are plain ids). */
  const cid = (c: number) => c % 100, clv = (c: number) => Math.floor(c / 100) + 1;
  const air = (c: number) => !!M.UNITS[cid(c)].air;
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
  const persist = () => { storage.set(M.SAVE_KEY, JSON.stringify(progress)); };
  const name = (id: number) => t(`${mode === 'legacy' ? 'siegeLegacyUnit' : 'siegeUnit'}${id}` as Key);
  const role = (id: number) => t(`${mode === 'legacy' ? 'siegeLegacyRole' : 'siegeRole'}${id}` as Key);
  const title = () => t(mode === 'legacy' ? 'siegeLegacy' : mode === 'cartoon' ? 'siegeCartoon' : 'siegeName');
  /** The battle's last world or act. */
  const lastWorld = () => M.LAST;
  /** The act a Cartoon battle belongs to. */
  const actNow = () => cartoonModel.actOf(world);
  /** Cartoon's act guardians, by their own names (their pictures stand in until each has its own sheet). */
  const actBoss = (n: number) => t(`siegeActBoss${n}` as Key);
  const worldName = (n: number) => (mode === 'cartoon' ? t('siegeAct', { n }) : t(`world${n}Name` as Key));
  const focus = () => root.querySelector<HTMLElement>('.sg-overlay button, .sg-primary, .sg-play, button')?.focus();
  function close() {
    if (finished) return; finished = true;
    cancelAnimationFrame(frame); battleAbort.abort(); abort.abort(); root.remove(); siblings.forEach(({ el, inert }) => el.inert = inert);
    closeActive = undefined; music(null); onClose(); previousFocus?.isConnected && previousFocus.focus();
  }
  closeActive = close;
  /** An army card: a troop to pick, or (Cartoon) one to recruit with gold once its act is open. */
  const armyCard = (id: number) => {
    const u = M.UNITS[id], open = M.isOpen(progress, id), owned = M.owns(progress, id), on = selected.includes(id), price = M.troopPrice(id);
    const lock = !open ? t(mode === 'cartoon' ? 'siegeOpensAct' : 'siegeUnlock', { n: u.unlock }) : '';
    const attrs = !open ? 'disabled' : owned ? `data-sg-unit="${id}" aria-pressed="${on}"` : `data-sg-buy="${id}"`;
    const stat = lock || (owned ? t('siegeStats', { cost: u.cost, hp: u.hp, damage: u.damage }) : t('siegeRecruit', { n: price }));
    return `<button class="sg-card ${on ? 'is-selected' : ''} ${open && !owned ? 'is-recruit' : ''} ${open && !owned && progress.coins < price ? 'is-poor' : ''}" ${attrs}><span class="sg-check">${on ? '✓' : !open ? '🔒' : ''}</span><img src="${V.portrait(id, progress.levels[id])}" data-trim="${V.portrait(id, progress.levels[id])}" alt=""><strong>${name(id)}</strong><small>${role(id)}</small><small class="sg-stat">${stat}</small></button>`;
  };
  /** The preparation screen's tab: the world map, the army, or the workshop (the mode's shop); Cartoon's shop is both
      the army and the workshop, Cartoon Wars 2-style. */
  let prepTab: 'map' | 'army' | 'shop' = 'map';
  /** Cartoon's map: 0 shows the world map (`siege/map-worlds`), a world's number its own map of five stages
      (`siege/map-N`). */
  let mapAct = 0;
  /** Where each map picture's platforms are (% of its width and height), measured on the owner's pictures: index 0 the
      world map's six, then each world's five stages, left to right. */
  const MAP_SPOTS: [number, number][][] = [
    [[10.2, 68], [26.3, 51], [44.3, 52.1], [62.8, 41.4], [81, 34], [93.6, 24.8]],
    [[14.1, 39.1], [41.6, 60.9], [54.1, 51], [70, 61.6], [86.4, 48.7]],
    [[7.8, 35.6], [28.1, 51.8], [49.9, 42.3], [69.1, 58.2], [89.4, 34.5]],
    [[11.1, 46], [33.2, 37.7], [51.7, 51.5], [71.2, 39.9], [89.7, 28.2]],
    [[12.6, 57.9], [32.6, 44.4], [50.2, 55.8], [68.2, 43], [86.4, 38.8]],
    [[7.2, 32.7], [31.1, 56.9], [51.1, 44.6], [68.5, 57.9], [89.7, 38.3]],
    [[7.8, 34], [28.7, 55.8], [47.8, 43.9], [70, 57.9], [90, 36.7]],
  ];
  /** Cartoon's shop: its tab (land, air or the base's upgrades) and the tile picked (a troop or upgrade, and a level). */
  let shopTab: 'land' | 'air' | 'base' = 'land';
  let pick = { row: 0, level: 1 };
  /** A tile of Cartoon's shop: owned, the next one to buy (with its price), or locked (and why). */
  const tile = (row: number, level: number) => {
    if (shopTab === 'base') {
      const have = progress.upgrades[row];
      return { have: level <= have, next: level === have + 1, price: M.upgradePrice(level - 1), why: t('siegeBuyFirst') };
    }
    const owned = M.owns(progress, row), now = progress.levels[row] ?? 1, open = M.isOpen(progress, row);
    const next = open && (owned ? level === now + 1 : level === 1);
    return { have: owned && level <= now, next, price: level === 1 || (mode === 'cartoon' && cartoonModel.testing.free) ? M.troopPrice(row) : M.UNITS[row].forms?.[level - 2]?.price ?? 0, why: !open ? t('siegeOpensAct', { n: M.UNITS[row].unlock }) : t('siegeBuyFirst') };
  };
  const shopRows = () => (shopTab === 'base' ? [0, 1, 2, 3] : M.ALLIES.filter(u => !!u.air === (shopTab === 'air')).map(u => u.id));
  const rowLevels = (row: number) => (shopTab === 'base' ? 5 : M.levelsOf(row));
  /** Cartoon's shop, laid out like Cartoon Wars 2's: tabs on top, a row of tiles per troop (each form, joined, its
      energy on it) or per upgrade, the equipped slots on the right, and below the picked tile's name, price, the gold,
      Purchase and Equip. */
  function cartoonShop() {
    const rows = shopRows(); if (!rows.includes(pick.row)) pick = { row: rows[0], level: 1 };
    const tabs = (['land', 'air', 'base'] as const).map(k => `<button role="tab" class="sg-st-tab is-${k} ${shopTab === k ? 'is-on' : ''}" aria-selected="${shopTab === k}" data-sg-shop-tab="${k}">${t(k === 'land' ? 'siegeShopLand' : k === 'air' ? 'siegeShopAir' : 'siegeShopBase')}</button>`).join('');
    const grid = rows.map(row => `<div class="sg-st-row">${Array.from({ length: rowLevels(row) }, (_, k) => {
      const level = k + 1, x = tile(row, level), on = pick.row === row && pick.level === level;
      const pic = shopTab === 'base' ? `/images/game/${upgradePic('cartoon', row, level)}.webp` : V.portrait(row, level);
      const corner = shopTab === 'base' ? (x.have ? '✓' : '') : String(M.specAt(row, level).cost);
      const worn = shopTab !== 'base' && selected.includes(cartoonModel.card(row, level));
      return `<button class="sg-st-tile ${x.have ? 'is-have' : x.next ? 'is-next' : 'is-locked'} ${on ? 'is-on' : ''} ${worn ? 'is-worn' : ''}" data-sg-tile="${row}:${level}" aria-pressed="${on}" aria-label="${shopTab === 'base' ? t(`siegeUpgrade${row}` as Key) : name(row)} · ${t('siegeLevel', { n: level })}"><img src="${pic}" ${shopTab === 'base' ? '' : `data-trim="${pic}"`} alt="">${corner ? `<small>${corner}</small>` : ''}${!x.have && !x.next ? '<i aria-hidden="true">🔒</i>' : ''}${worn ? '<b class="sg-st-worn" aria-hidden="true">✓</b>' : ''}</button>`;
    }).join('<span class="sg-st-link" aria-hidden="true"></span>')}</div>`).join('');
    const x = tile(pick.row, pick.level), troop = shopTab !== 'base';
    const label = troop ? `${name(pick.row)} · ${t('siegeLevel', { n: pick.level })} — ${role(pick.row)}` : `${t(`siegeUpgrade${pick.row}` as Key)} · ${t('siegeLevel', { n: pick.level })}`;
    const price = x.have ? `✓ ${t('siegeHave')}` : x.next ? (x.price ? `🪙 ${x.price}` : t('siegeFree')) : `🔒 ${x.why}`;
    const kind = shopTab === 'air';
    // The equipped cards; a tap on one takes it out of the army.
    const slots = Array.from({ length: M.DECK }, (_, i) => { const c = selected.filter(n => air(n) === kind)[i]; return c === undefined ? '<span class="sg-st-slot"></span>' : `<button class="sg-st-slot is-full" data-sg-tile="${cid(c)}:${clv(c)}" aria-label="${name(cid(c))} · ${t('siegeLevel', { n: clv(c) })}"><img src="${V.portrait(cid(c), clv(c))}" data-trim="${V.portrait(cid(c), clv(c))}" alt=""><small>${clv(c)}</small></button>`; }).join('');
    return `<div class="sg-store is-${shopTab}"><nav class="sg-st-tabs" role="tablist">${tabs}<button class="sg-st-back" data-sg-prep="map">◀ ${t('siegeShopBack')}</button></nav>
      <div class="sg-st-body"><div class="sg-st-frame"><div class="sg-st-grid">${grid}</div>${['top', 'bottom', 'left', 'right'].map(k => `<i class="sg-st-gem is-${k}" aria-hidden="true"></i>`).join('')}</div><aside class="sg-st-slots" aria-label="${t(kind ? 'siegeArmyAir' : 'siegeArmyLand', { n: selected.filter(n => air(n) === kind).length, max: M.DECK })}">${shopTab === 'base' ? '' : slots}</aside></div>
      <div class="sg-st-info"><p class="sg-st-desc"><b>${label}</b><span class="${x.next && progress.coins < x.price ? 'is-poor' : ''}">${price}</span></p><p class="sg-message" role="status"></p></div>
      <div class="sg-st-actions"><span class="sg-st-gold"><img src="/images/game/store/coins-2.webp" alt="">${progress.coins}</span>
        <button class="sg-st-buy" data-sg="purchase" ${x.next && progress.coins >= x.price ? '' : 'disabled'}>${t('siegeBuy')}</button>
        <button class="sg-st-go is-fight" data-sg="launch" ${selected.length ? '' : 'disabled'}>${t('siegeLaunch')} ▶</button></div></div>`;
  }
  /** Buys the picked tile: a troop's recruit or next form, or an upgrade's next level. */
  function purchase() {
    const x = tile(pick.row, pick.level); if (!x.next || progress.coins < x.price) return;
    const ok = shopTab === 'base' ? M.upgrade(progress, pick.row) : pick.level === 1 ? M.buyTroop(progress, pick.row) : M.levelUp(progress, pick.row);
    if (ok) { selected = [...progress.deck]; persist(); sound('click'); }
  }
  /** A tap on a troop form the player has puts that card in the army, or takes it out; it returns false (and says
      so) when that kind's five places are full. */
  function equip(row: number, level: number) {
    const c = cartoonModel.card(row, level);
    if (selected.includes(c)) selected = selected.filter(n => n !== c);
    else if (selected.filter(n => air(n) === air(c)).length < M.DECK) selected.push(c);
    else return false;
    progress.deck = [...selected]; persist(); sound('click'); return true;
  }
  const won = (n: number) => progress.victories.includes(n);
  /** What winning pays (the model's `settle`): Cartoon's acts on the nine-world scale. */
  const prize = (n: number, first: boolean) => (mode === 'cartoon' ? cartoonModel.prize(n, first) : first ? 160 + n * 30 : 45 + n * 5);
  function prep() {
    cancelAnimationFrame(frame); battleAbort.abort(); state = null; paused = false;
    music(mode === 'cartoon' ? 'menu' : null);
    const tabs = (mode === 'cartoon' ? ['map', 'shop'] as const : ['map', 'army', 'shop'] as const).map(k => `<button role="tab" class="${prepTab === k ? 'is-on' : ''}" aria-selected="${prepTab === k}" data-sg-prep="${k}"><img src="${mode === 'cartoon' ? (k === 'map' ? '/images/game/siege/enemy-1.webp' : k === 'army' ? V.portrait(0) : '/images/game/store/coins-2.webp') : `/images/game/${k === 'map' ? 'ui/ring_world' : k === 'army' ? 'enemies/original-bug-0' : 'store/coins-2'}.webp`}" alt="">${t(k === 'map' ? 'siegeTabMap' : k === 'army' ? 'siegeTabArmy' : mode === 'cartoon' ? 'siegeTabStore' : 'siegeTabShop')}</button>`).join('');
    // The map: the action modes' own islands, locked ones greyed with the padlock ring, won ones with the check ring.
    const cartoon = mode === 'cartoon';
    // Cartoon's map is its acts, each opening on its first stage and picking its furthest open one.
    const S = cartoonModel.STAGES, act = actNow();
    const isles = Array.from({ length: cartoon ? cartoonModel.ACTS : lastWorld() }, (_, i) => {
      const n = i + 1, open = (cartoon ? (n - 1) * S + 1 : n) <= progress.unlocked, on = cartoon ? n === act : n === world;
      const pick = cartoon ? Math.min(n * S, progress.unlocked) : n, done = cartoon ? won(n * S) : won(n);
      return `<button class="sg-isle ${on ? 'is-on' : ''} ${open ? '' : 'is-locked'}" data-sg-world-pick="${pick}" ${open ? '' : 'disabled'} aria-pressed="${on}" aria-label="${n}. ${worldName(n)}${cartoon ? ` · ${t(`siegeCtAct${n}` as Key)}` : ''}">
        ${cartoon ? `<img src="${V.portrait(cartoonModel.GUARDIAN[i])}" data-trim="${V.portrait(cartoonModel.GUARDIAN[i])}" alt="">` : `<img src="/images/game/map/${ISLES[i]}.webp" alt="">`}<span class="sg-isle-n">${n}</span>
        ${open ? done ? '<img class="sg-isle-ring" src="/images/game/ui/ring_check.webp" alt="">' : '' : '<img class="sg-isle-ring" src="/images/game/ui/ring_lock.webp" alt="">'}
        <b>${worldName(n)}</b></button>`;
    }).join('');
    const map = `<div class="sg-isles" role="list">${isles}</div>
      ${cartoon ? `<article class="sg-world is-act" style="--shade:${shade(act)}">
        <img class="sg-world-boss" src="${V.portrait(cartoonModel.GUARDIAN[act - 1])}" data-trim="${V.portrait(cartoonModel.GUARDIAN[act - 1])}" alt="">
        <span class="sg-eyebrow">${worldName(act)} · ${t('siegeStage', { n: cartoonModel.stageIn(world), max: S })}</span><h2>${t(`siegeCtAct${act}` as Key)}</h2>
        <div class="sg-stages">${Array.from({ length: S }, (_, k) => { const n = (act - 1) * S + k + 1, open = n <= progress.unlocked; return `<button data-sg-world-pick="${n}" class="${n === world ? 'is-on' : ''} ${won(n) ? 'is-won' : ''}" ${open ? '' : 'disabled'} aria-pressed="${n === world}" aria-label="${t('siegeStage', { n: k + 1, max: S })}${k + 1 === S ? ` · ${t('siegeGuardian')}` : ''}">${k + 1 === S ? '★' : k + 1}</button>`; }).join('')}</div>
        <p class="sg-guard">${t('siegeGuardian')} (${t('siegeStage', { n: S, max: S })}): <b>${actBoss(act)}</b></p>` : `<article class="sg-world" style="background-image:linear-gradient(90deg,#08101ef2 30%,#08101e66),url('${backdropUrl(world)}')">
        <img class="sg-world-boss" src="${guardianUrl(world)}" alt="">
        <span class="sg-eyebrow">${t('siegeWorld')} · ${world}</span><h2>${worldName(world)}</h2>
        <p>${t(`world${world}Text` as Key)}</p>
        <p class="sg-guard"><img src="/images/game/ui/boss_plate.webp" alt=""><span>${t('siegeGuardian')}: <b>${t(GUARDIAN_NAMES[world - 1])}</b></span></p>`}
        <p class="sg-prize"><img src="/images/game/store/coins-2.webp" alt="">${won(world) ? t('siegeRepeatWin', { n: prize(world, false) }) : t('siegeFirstWin', { n: prize(world, true) })}</p>
        <button class="sg-play" data-sg="launch" ${selected.length ? '' : 'disabled'}><span class="sg-play-tri" aria-hidden="true"></span>${t('siegeLaunch')}</button>
      </article>`;
    const army = `<p class="sg-muted">${t('siegeChoose')}</p>
      ${([false, true] as const).map(flying => `<h2 class="sg-heading">${t(flying ? 'siegeArmyAir' : 'siegeArmyLand', { n: selected.filter(id => air(id) === flying).length, max: M.DECK })}</h2><div class="sg-roster">${M.ALLIES.filter(u => !!u.air === flying).map(u => armyCard(u.id)).join('')}</div>`).join('')}
      <p class="sg-message" role="status"></p>`;
    const shop = mode === 'cartoon' ? cartoonShop() : `<p class="sg-muted">${t('siegeShopNote')}</p><div class="sg-upgrades">${progress.upgrades.map((level, i) => `<button data-sg-upgrade="${i}" ${level >= 5 || progress.coins < M.upgradePrice(level) ? 'disabled' : ''}>
        <span class="sg-up-pic"><img src="/images/game/${upgradePic(mode!, i, level)}.webp" alt=""></span>
        <span class="sg-up-text"><b>${t(`siegeUpgrade${i}` as Key)}</b><span class="sg-pips">${Array.from({ length: 5 }, (_, k) => `<i class="${k < level ? 'is-on' : ''}"></i>`).join('')}</span></span>
        <span class="sg-up-cost">${level >= 5 ? t('siegeMax') : `<img src="/images/game/store/coins-2.webp" alt="">${M.upgradePrice(level)}`}</span></button>`).join('')}</div>
      `;
    // Siege Cartoon's shop is the whole screen, Cartoon Wars 2-style: no header or page tabs, its own Back button.
    if (mode === 'cartoon' && prepTab === 'map') { root.innerHTML = `<div class="sg-shell sg-prep sg-map-only">${cartoonMap()}</div>`; V.trimImages(root); focus(); return; }
    if (mode === 'cartoon' && prepTab === 'shop') { root.innerHTML = `<div class="sg-shell sg-prep sg-shop-only">${shop}</div>`; V.trimImages(root); focus(); return; }
    root.innerHTML = `<div class="sg-shell sg-prep"><header class="sg-top"><button class="sg-back" data-sg="modes" aria-label="${t('siegeModes')}">←</button>
        <h1 class="sg-title"><small>${t('siegeSoon')}</small>${title()}</h1>
        <span class="sg-coins"><img src="/images/game/store/coins-2.webp" alt="">${progress.coins}</span></header>
      <nav class="sg-ptabs" role="tablist">${tabs}</nav>
      <section class="sg-page">${prepTab === 'map' ? map : prepTab === 'army' ? army : shop}</section>
      <details class="sg-help"><summary>${t('siegeHow')}</summary><p>${t('siegeIntro')}</p><p>${t('siegeInstructions')}</p><p>${t('siegeKeys')}</p><p>${t('siegeRotate')}</p><p>${t('siegePreviewNote')}</p></details></div>`;
    V.trimImages(root); focus();
  }
  /** Cartoon's map, the owner's pictures whole (16:9, fitted in the view) with buttons on their stone platforms
      (`MAP_SPOTS`, % of the picture): the world map's six worlds, or a world's five stages, the fifth the guardian's.
      Around it: Back, the gold, the Shop, and on a world's map the picked stage's prize and Launch. */
  function cartoonMap() {
    const S = cartoonModel.STAGES, act = mapAct, pic = `/images/game/siege/map-${act ? act : 'worlds'}.webp`;
    const spots = MAP_SPOTS[act];
    const at = (k: number) => `style="left:${spots[k][0]}%;top:${spots[k][1]}%"`;
    const ring = (open: boolean, done: boolean) => (!open ? '<img class="sg-spot-ring" src="/images/game/ui/ring_lock.webp" alt="">' : done ? '<img class="sg-spot-ring" src="/images/game/ui/ring_check.webp" alt="">' : '');
    const buttons = act
      ? Array.from({ length: S }, (_, k) => {
        const n = (act - 1) * S + k + 1, open = n <= progress.unlocked, boss = k + 1 === S;
        return `<button class="sg-spot ${boss ? 'is-boss' : ''} ${n === world ? 'is-on' : ''} ${open ? won(n) ? 'is-done' : '' : 'is-locked'}" ${at(k)} data-sg-world-pick="${n}" ${open ? '' : 'disabled'} aria-pressed="${n === world}" aria-label="${t('siegeStage', { n: k + 1, max: S })}${boss ? ` · ${t('siegeGuardian')}: ${actBoss(act)}` : ''}">
          ${boss ? `<img class="sg-spot-boss" src="${V.portrait(cartoonModel.GUARDIAN[act - 1])}" data-trim="${V.portrait(cartoonModel.GUARDIAN[act - 1])}" alt="">` : ''}<b>${k + 1}</b>${ring(open, won(n))}</button>`;
      }).join('')
      : Array.from({ length: cartoonModel.ACTS }, (_, i) => {
        const n = i + 1, open = (n - 1) * S + 1 <= progress.unlocked, on = n === actNow();
        return `<button class="sg-spot is-world ${on ? 'is-on' : ''} ${open ? won(n * S) ? 'is-done' : '' : 'is-locked'}" ${at(i)} data-sg-map-act="${n}" ${open ? '' : 'disabled'} aria-label="${worldName(n)} · ${t(`siegeCtAct${n}` as Key)}">
          <b>${n}</b>${ring(open, won(n * S))}<span class="sg-spot-name">${worldName(n)}</span></button>`;
      }).join('');
    const stage = cartoonModel.stageIn(world), here = act && actNow() === act;
    const panel = here ? `<div class="sg-map-go">
        <span class="sg-eyebrow">${worldName(act)} · ${t('siegeStage', { n: stage, max: S })}${stage === S ? ` · ${actBoss(act)}` : ''}</span>
        <p class="sg-prize"><img src="/images/game/store/coins-2.webp" alt="">${won(world) ? t('siegeRepeatWin', { n: prize(world, false) }) : t('siegeFirstWin', { n: prize(world, true) })}</p>
        <button class="sg-play" data-sg="launch" ${selected.length ? '' : 'disabled'}><span class="sg-play-tri" aria-hidden="true"></span>${t('siegeLaunch')}</button></div>` : '';
    return `<div class="sg-map" style="--map:url('${pic}')"><div class="sg-map-pic"><img src="${pic}" alt="">${buttons}</div>
      <header class="sg-map-top"><button class="sg-back" ${act ? 'data-sg-map-act="0"' : 'data-sg="modes"'} aria-label="${act ? t('siegeShopBack') : t('siegeModes')}">←</button>
        <h1 class="sg-map-title">${act ? `<small>${worldName(act)}</small>${t(`siegeCtAct${act}` as Key)}` : title()}</h1>
        <span class="sg-coins"><img src="/images/game/store/coins-2.webp" alt="">${progress.coins}</span></header>
      <button class="sg-map-shop" data-sg-prep="shop"><span>${t('siegeTabStore')}</span></button>${panel}</div>`;
  }
  /** The HUD's pictures of both sides: Legacy's Town Hall and world guardian, Cartoon's two fortresses. */
  const vsPic = (side: 0 | 1) => mode === 'cartoon'
    ? `/images/game/siege/${side ? `enemy-${cartoonModel.enemyTier(world)}` : `castle-${cartoonModel.looksTier(progress.upgrades[1])}`}.webp`
    : side ? guardianUrl(world) : '/images/game/fortress/backlog/town-hall.webp';
  function start() {
    cancelAnimationFrame(frame); battleAbort.abort(); battleAbort = new AbortController();
    const battleOptions = { signal: battleAbort.signal };
    if (!selected.length) return;
    progress.deck = [...selected]; persist(); mapAct = mode === 'cartoon' ? actNow() : 0; state = M.newSiege(progress, world); bossTalked = false; baseFell = false; lootHeard = 0; gustShown = false;
    if (mode === 'cartoon') music('battle');
    V.preload(world, selected, progress.levels); paused = false; camera.x = -Infinity;
    // Laid out like Cartoon Wars 2: mana top left, both fortresses' health face to face in the middle, coins and pause
    // top right; the field with the bow's aim on our wall; one bar below with the magic, the troop cards and the bow.
    root.innerHTML = `<div class="sg-battle"><header class="sg-hud">
        <div class="sg-mana"><img src="/images/game/ui/orb.webp" alt=""><span><b data-sg-energy></b><small data-sg-status></small></span><progress data-sg-meter></progress></div>
        <div class="sg-vs"><img class="sg-vs-pic" src="${vsPic(0)}" alt=""><span class="sg-hp"><i data-sg-bar="0"></i><small data-sg-health="0"></small></span><b>VS</b><span class="sg-hp is-enemy"><i data-sg-bar="1"></i><small data-sg-health="1"></small></span><img class="sg-vs-pic" src="${vsPic(1)}" alt=""></div>
        <div class="sg-hud-actions"><span class="sg-clock" data-sg-clock></span><span class="sg-gold"><img src="/images/game/store/coins-2.webp" alt=""><b data-sg-gold>${progress.coins}</b></span><button data-sg="pause" aria-label="${t('pause')}">⏸</button></div></header>
      <div class="sg-field"><div class="sg-turn" role="status"><span aria-hidden="true">📱↻</span><b>${t('siegeTurn')}</b><button type="button" data-sg-turn aria-label="${t('siegeTurnOk')}">✕</button></div><canvas class="sg-arena" tabindex="0" role="img" aria-label="${t('siegeBattlefield')}"></canvas>
      <div class="sg-aim" role="slider" tabindex="0" aria-orientation="vertical" aria-valuemin="140" aria-valuemax="1080" aria-valuenow="700" aria-label="${t('siegeAim')}" data-sg-aim><i class="sg-aim-up" aria-hidden="true"></i><i class="sg-aim-knob" aria-hidden="true"></i><i class="sg-aim-down" aria-hidden="true"></i></div>
      <div class="sg-camera"><button data-sg="home" aria-label="${t('siegeHome')}">◀</button><input type="range" min="0" max="1000" value="0" data-sg-camera aria-label="${t('siegeCamera')}"><button data-sg="enemy" aria-label="${t('siegeEnemy')}">▶</button></div></div>
      <div class="sg-bar"><div class="sg-tabs" role="tablist">${(['land', 'air', 'special'] as const).map(k => `<button role="tab" data-sg-tab="${k}" aria-label="${t(k === 'land' ? 'siegeTabLand' : k === 'air' ? 'siegeTabAir' : 'siegeTabSpecial')}">${k === 'land' ? 'L' : k === 'air' ? 'A' : 'S'}</button>`).join('')}</div>
      <div class="sg-deck" data-sg-cards></div>
      <button data-sg="fire" class="sg-bow" aria-label="${t('siegeCannon')}"><img src="/images/game/arrows/fire.webp" alt=""><span data-sg-bow-label></span></button></div></div>`;
    tab = 'land'; cards();
    window.addEventListener('resize', layoutBar, battleOptions);
    const canvas = q<HTMLCanvasElement>('canvas'); const ctx = canvas.getContext('2d')!;
    let pointer: { id: number; start: number; camera: number; moved: boolean } | null = null;
    canvas.addEventListener('pointerdown', e => {
      if (paused || !state || state.phase !== 'fight') return;
      pointer = { id: e.pointerId, start: e.clientX, camera: camera.x, moved: false }; canvas.setPointerCapture(e.pointerId);
    }, battleOptions);
    canvas.addEventListener('pointermove', e => {
      if (!pointer || e.pointerId !== pointer.id) return;
      const delta = e.clientX - pointer.start; if (Math.abs(delta) > 6) pointer.moved = true;
      if (pointer.moved) camera.x = Math.max(camera.min ?? 0, Math.min(M.FIELD - camera.width, pointer.camera - delta * camera.width / canvas.clientWidth));
    }, battleOptions);
    canvas.addEventListener('pointerup', e => {
      if (pointer?.id !== e.pointerId) return;
      if (!pointer.moved && state && !paused) {
        const rect = canvas.getBoundingClientRect();
        // Siege Cartoon: a tap on the mana monument raises the generator, as in Cartoon Wars 2.
        if (mode === 'cartoon' && cartoonView.onMana(e.clientX - rect.left, e.clientY - rect.top)) { if (M.improveGenerator(state)) sound('click'); updateUi(); pointer = null; return; } state.aim = Math.max(120, Math.min(M.FIELD - 120, camera.x + (e.clientX - rect.left) * camera.width / rect.width - Math.max(0, (camera.width - M.FIELD) / 2)));
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
    aimPad.addEventListener('keydown', e => { if (!state || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return; e.preventDefault(); e.stopPropagation(); state.aim = M.aimAt(state.aim + (e.key === 'ArrowUp' ? 40 : -40)); }, battleOptions);
    // The bow is a switch: one tap starts the arrows, the next stops them.
    // It answers the moment it is touched (pointerdown), so it works with another finger on the aim stick, where a
    // second finger's tap never becomes a click; a click from the keyboard (no pointer) still works.
    const fireButton = q<HTMLButtonElement>('[data-sg="fire"]');
    const fire = () => { if (state && !paused && state.phase === 'fight') { M.toggleBow(state); updateUi(); } };
    let pressedAt = -1e9;
    fireButton.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); pressedAt = performance.now(); fire(); }, battleOptions);
    fireButton.addEventListener('click', e => { e.stopPropagation(); if (performance.now() - pressedAt > 700) fire(); }, battleOptions);
    last = performance.now(); accumulator = 0; uiAt = 0;
    function loop(now: number) {
      if (!state || finished) return;
      const delta = Math.min(0.15, (now - last) / 1000); last = now;
      if (!paused && state.phase === 'fight') {
        if (aimPush) state.aim = M.aimAt(state.aim + aimPush * Math.abs(aimPush) * AIM_SPEED * delta);
        accumulator += delta;
        const shot = state.shots ?? 0;
        while (accumulator >= 1 / 30) { M.tick(state, 1 / 30); accumulator -= 1 / 30; }
        // Each bow shot is heard (at most one sound a frame, so a fast volley stays a rattle, not a roar).
        if ((state.shots ?? 0) > shot) sound('arrow');
        troopSounds(now);
        // The enemy fortress falling (its crumble, then the guardian's horn), and a coin for a fat bounty.
        if (mode === 'cartoon' && !baseFell && state.hp[1] <= 0) { baseFell = true; sound('base-falls'); if (state.bossSpawned) music('boss'); }
        // The corrupt wind's warning, across the top of the field for a moment.
        if (state.gusted && !gustShown) {
          gustShown = true; const note = document.createElement('div'); note.className = 'sg-alert'; note.setAttribute('role', 'status'); note.textContent = t('siegeGust');
          q('.sg-field').append(note); setTimeout(() => note.remove(), 2600);
        }
        if (mode === 'cartoon' && (state.loot ?? 0) - lootHeard >= 8) sound('coin', 0.7);
        lootHeard = state.loot ?? 0;
      }
      // Where the HUD's gold and energy counters are, for the fallen enemies' orbs.
      if (mode === 'cartoon' && now >= uiAt) {
        const c = canvas.getBoundingClientRect(), at = (sel: string) => { const r = root.querySelector(sel)?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2 - c.left, y: r.top + r.height / 2 - c.top } : undefined; };
        camera.goldAt = at('.sg-gold img'); camera.manaAt = at('.sg-mana img');
      }
      // Siege Cartoon lays its card bar over the field: the troops walk just above it.
      // The ground line sits on the wall's top (30% down the bar's picture), so the troops walk on the grass above it.
      if (mode === 'cartoon') { const bar = q<HTMLElement>('.sg-bar').getBoundingClientRect(), field = canvas.getBoundingClientRect(); camera.bottom = Math.max(0, field.bottom - bar.top - bar.height * 0.3); }
      else camera.bottom = 0;
      V.render(ctx, canvas, state, camera, reduced);
      // The aim control stands on the deck, wherever the field puts it.
      q<HTMLElement>('.sg-aim').style.bottom = `calc(${((1 - (camera.deck ?? 0.5)) * 100).toFixed(1)}% + 6px)`;
      if (now >= uiAt) { updateUi(); uiAt = now + 100; }
      if (state.phase !== 'fight' && !state.paid) result();
      // The guardian speaks the moment it joins, the battle held until the scene ends.
      else if (state.bossSpawned && !bossTalked && state.phase === 'fight') {
        bossTalked = true; paused = true; updateUi();
        talk(mode === 'cartoon' ? cartoonStory.bossTalk(actNow()) : bossTalk(world), () => { paused = false; last = performance.now(); accumulator = 0; q('canvas').focus(); });
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
      : list.length ? list.map((id, i) => `<button data-sg-summon="${id}" aria-label="${i + 1}. ${name(cid(id))} · ${t('siegeLevel', { n: clv(id) })} · ${M.specAt(cid(id), clv(id)).cost}"><img src="${V.portrait(cid(id), clv(id))}" data-trim="${V.portrait(cid(id), clv(id))}" alt=""><small data-sg-cost="${id}"></small><i class="sg-cooldown" data-sg-cooldown="${id}"></i></button>`).join('')
      : `<p class="sg-empty">${t('siegeAirEmpty')}</p>`;
    V.trimImages(root); layoutBar(); updateUi();
  }
  /** Siege Cartoon's bar runs the full width, its wall slot repeated (see siege.css): each card is laid on a slot, the
      repeated ones first (as many as fit, stretched a little to fill), then the picture's own right-hand ones. */
  function layoutBar() {
    if (mode !== 'cartoon') return;
    const bar = root.querySelector<HTMLElement>('.sg-bar'); if (!bar) return;
    // The bar is the owner's picture whole (2071 × 378, its seven wall slots 169 apart from x 646): a card on each slot.
    const u = bar.offsetHeight / 378;
    root.querySelectorAll<HTMLElement>('.sg-bar .sg-deck button').forEach((b, i) => { b.style.left = `${((646 + i * 169) * u).toFixed(1)}px`; b.style.width = `${(155 * u).toFixed(1)}px`; });
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
    q('[data-sg-clock]').textContent = clock(Math.max(0, M.LIMIT - s.time));
    q('[data-sg-gold]').textContent = `${progress.coins + (s.loot ?? 0)}`;
    q('[data-sg-energy]').textContent = `${Math.floor(s.energy)} / ${M.energyMax(s)}`;
    const meter = q<HTMLProgressElement>('[data-sg-meter]'); meter.max = M.energyMax(s); meter.value = s.energy;
    q('[data-sg-status]').textContent = `+${M.energyRate(s).toFixed(1)}/s · ${s.units.filter(u => !u.side).length}/${M.CAP}`;
    const generator = root.querySelector<HTMLButtonElement>('[data-sg="generator"]');
    if (generator) { setPicButton(generator, '/images/game/ui/orb.webp', s.generator >= 4 ? t('siegeMax') : `${s.generator}/4 · ${M.generatorPrice(s)}`); generator.setAttribute('aria-label', s.generator >= 4 ? t('siegeMax') : t('siegeGenerator', { n: s.generator, cost: M.generatorPrice(s) })); generator.disabled = paused || s.phase !== 'fight' || s.generator >= 4 || s.energy < M.generatorPrice(s); }
    const bowButton = q<HTMLButtonElement>('[data-sg="fire"]');
    const reloading = !s.bow.drawing && s.bow.quiver < M.BOW.cost;
    q('[data-sg-bow-label]').textContent = reloading ? t('siegeBowEmpty') : t('siegeCannon');
    // The bow button is a ball that empties as the quiver does: full colour when full, see-through when empty.
    bowButton.style.setProperty('--q', (s.bow.quiver / M.BOW.max).toFixed(3));
    bowButton.classList.toggle('is-empty', reloading); bowButton.classList.toggle('is-drawing', s.bow.drawing); bowButton.setAttribute('aria-pressed', String(s.bow.drawing));
    bowButton.disabled = paused || s.phase !== 'fight';
    for (const [action, key, cd, pic] of [['strike', 'siegeSpell', s.spell, 'skills/bolt'], ['missile', 'siegeMissile', s.rocket, 'fx/rocket']] as const) {
      const button = root.querySelector<HTMLButtonElement>(`[data-sg="${action}"]`); if (!button) continue;
      setPicButton(button, `/images/game/${pic}.webp`, cd > 0 ? `${Math.ceil(cd)}s` : t('siegeReady')); button.setAttribute('aria-label', t(key)); button.disabled = paused || s.phase !== 'fight' || cd > 0;
    }
    for (const id of tabCards()) {
      q<HTMLButtonElement>(`[data-sg-summon="${id}"]`).disabled = paused || !M.canSummon(s, id);
      const cd = s.cooldowns[id] ?? 0;
      q(`[data-sg-cost="${id}"]`).textContent = cd > 0 ? `${Math.ceil(cd)}s` : `⚡ ${M.costOf(s, id)}`;
      q(`[data-sg-cooldown="${id}"]`).style.width = `${cd / M.UNITS[cid(id)].cooldown * 100}%`;
    }
    q('[data-sg-aim]').setAttribute('aria-valuenow', String(Math.round(M.aimAt(s.aim))));
    q<HTMLInputElement>('[data-sg-camera]').value = String(Math.round(camera.x / Math.max(1, M.FIELD - camera.width) * 1000));
  }
  function modal(content: string) {
    root.querySelector('.sg-overlay')?.remove();
    const overlay = document.createElement('div'); overlay.className = 'sg-overlay'; overlay.innerHTML = `<div class="sg-dialog" role="dialog" aria-modal="true">${content}</div>`;
    q('.sg-battle').inert = true; root.append(overlay); focus();
  }
  /** A story scene, Cartoon Wars-style: the world's picture behind, the speaker's portrait on their side, a line at a
      time. Tap or Next to go on, Skip to jump to the end; `done` runs after the last line. */
  let story: (() => void) | null = null;
  function talk(lines: (Line | cartoonStory.Line)[], done: () => void) {
    let at = 0;
    root.querySelector('.sg-overlay')?.remove();
    const overlay = document.createElement('div'); overlay.className = 'sg-overlay sg-story';
    overlay.style.backgroundImage = mode === 'cartoon' ? `${shade(actNow())}, linear-gradient(#050a1499, #050a14ee), url('/images/game/siege/backdrop.webp')` : `linear-gradient(#050a14aa, #050a14ee), url('${backdropUrl(world)}')`;
    const battle = root.querySelector<HTMLElement>('.sg-battle'); if (battle) battle.inert = true;
    const end = () => { story = null; overlay.remove(); if (battle) battle.inert = false; done(); };
    const show = () => {
      const l = lines[at], last = at === lines.length - 1;
      // Legacy's speakers: the player's hero and the world's guardian.
      const cartoon = mode === 'cartoon', wizard = 6, act = actNow(), guard = cartoonModel.GUARDIAN[act - 1];
      const heroName = hero.name.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`), joker = 0;
      const who = l.who === 'king' ? t(cartoon ? 'siegeCastKing' : 'siegeKing') : l.who === 'boss' ? (cartoon ? actBoss(act) : t(GUARDIAN_NAMES[world - 1])) : l.who === 'hero' ? (cartoon ? t('siegeCastCaptain') : heroName) : l.who === 'wizard' ? t('siegeCastWizard') : l.who === 'joker' ? t('siegeCastJoker') : t('siegeNarrator');
      // The King is the great samurai: the heavy armour's last form.
      // Cartoon's cast: King Álvaro (the crowned giant) leads, Captain Jorge (the winged spearman) commands, Felipe the
      // Wizard is the clever one and Manolo (the swordsman with the club) the funny one. Legacy's hero is the player's.
      const pic = l.who === 'king' ? V.portrait(3, M.levelsOf(3)) : l.who === 'boss' ? (cartoon ? V.portrait(guard) : guardianUrl(world)) : l.who === 'hero' ? (cartoon ? V.portrait(1, 4) : hero.pic) : l.who === 'wizard' ? V.portrait(wizard, 1) : l.who === 'joker' ? V.portrait(joker, 1) : '';
      // A heated line shows the speaker mid-action (its sheet's wind-up, blow or hurt pose).
      const pose = 'pose' in l && l.pose && cartoon && l.who !== 'narrator' && pic.endsWith('-0.webp') ? pic.replace(/-0\.webp$/, `-${l.pose}.webp`) : pic;
      overlay.innerHTML = `<div class="sg-scene is-${l.who} ${pose !== pic ? 'is-heated' : ''}" role="dialog" aria-modal="true" aria-label="${t('siegeName')}">
        <span class="sg-eyebrow">${mode === 'cartoon' ? `${worldName(actNow())} · ${t(`siegeCtAct${actNow()}` as Key)}` : t(`world${world}Name` as Key)}</span>
        ${pic ? `<img class="sg-speaker" src="${pose}" alt="">` : ''}
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
  /** The Darkness over an act, as a CSS layer: deeper act by act. */
  const shade = (act: number) => { const g = cartoonStory.gloom(act); return `linear-gradient(90deg, rgba(14,4,22,${(g * 0.6).toFixed(2)}), rgba(30,2,14,${g.toFixed(2)}))`; };
  /** Siege Cartoon's act title, before its story: "Act N" and its name over the battlefield, the Darkness spreading
      over it from the last act's to this one's. Tap or wait to go on. */
  function actCard(act: number, done: () => void) {
    root.querySelector('.sg-overlay')?.remove();
    const overlay = document.createElement('div'); overlay.className = 'sg-overlay sg-story sg-actcard';
    overlay.style.setProperty('--from', String(cartoonStory.gloom(act - 1))); overlay.style.setProperty('--to', String(cartoonStory.gloom(act)));
    overlay.innerHTML = `<i class="sg-gloom" aria-hidden="true"></i><div class="sg-actcard-in" role="dialog" aria-modal="true" aria-label="${worldName(act)}">
      <small>${worldName(act)}</small><h2>${t(`siegeCtAct${act}` as Key)}</h2><button class="sg-primary" data-story="next">${t('siegeTalkNext')} ▶</button></div>`;
    let timer = 0;
    const end = () => { clearTimeout(timer); story = null; overlay.remove(); done(); };
    overlay.addEventListener('click', e => { e.stopPropagation(); end(); });
    story = end; root.append(overlay); overlay.querySelector<HTMLElement>('button')?.focus();
    timer = window.setTimeout(() => overlay.isConnected && end(), reduced ? 2500 : 4200);
  }
  function pause() {
    if (!state || state.phase !== 'fight' || paused || story) return;
    paused = true; updateUi();
    modal(`<span class="sg-eyebrow">${title()}</span><h2>${t('paused')}</h2><p>${t('siegePauseNote')}</p><div class="sg-dialog-actions"><button class="sg-primary" data-sg="resume">${t('resume')}</button><button data-sg="prep">${t('siegeLeave')}</button></div>`);
  }
  function resume() {
    root.querySelector('.sg-overlay')?.remove(); q('.sg-battle').inert = false; paused = false; last = performance.now(); accumulator = 0; q('canvas').focus();
  }
  function result() {
    if (!state) return;
    const reward = M.settle(progress, state); persist(); paused = true;
    // Winning Cartoon's last act tells its ending first.
    if (mode === 'cartoon' && state.phase === 'won' && world === lastWorld()) talk(cartoonStory.ending, () => outcome(reward));
    else outcome(reward);
  }
  function outcome(reward: number) {
    if (!state) return;
    modal(`<span class="sg-eyebrow">${t('siegeSoon')}</span><h2>${t(state.phase === 'won' ? 'siegeWon' : 'siegeLost')}</h2><p>${t('siegeResult', { kills: state.kills, time: clock(state.time) })}</p>${state.loot ? `<strong>${t('siegeLoot', { n: state.loot })}</strong>` : ''}${state.phase === 'won' ? `<strong>${t('siegeReward', { n: reward })}</strong>${world === lastWorld() ? `<p>${t(mode === 'cartoon' ? 'siegeCartoonComplete' : 'siegeComplete')}</p>` : ''}` : `<p>${t('siegeRetryHint')}</p>`}<div class="sg-dialog-actions">${state.phase === 'won' && world < lastWorld() ? `<button class="sg-primary" data-sg="next">${t('siegeNext')}</button>` : `<button class="sg-primary" data-sg="retry">${t('again')}</button>`}<button data-sg="prep">${t('siegeLeave')}</button></div>`);
  }
  root.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled) return;
    const { sg: action, sgUnit: unit, sgUpgrade: up, sgSummon: summonId } = button.dataset;
    if (unit !== undefined && !state) {
      const id = Number(unit); if (selected.includes(id)) selected = selected.filter(n => n !== id);
      else if (selected.filter(n => air(n) === air(id)).length < M.DECK) selected.push(id);
      else { q('.sg-message').textContent = t('siegeFull'); return; }
      prep(); root.querySelector<HTMLElement>(`[data-sg-unit="${id}"]`)?.focus(); return;
    }
    if (button.dataset.sgMode && !state) { choose(button.dataset.sgMode as Mode); return; }
    if (button.dataset.sgShopTab && !state) { shopTab = button.dataset.sgShopTab as typeof shopTab; pick = { row: shopRows()[0], level: 1 }; prep(); root.querySelector<HTMLElement>(`[data-sg-shop-tab="${shopTab}"]`)?.focus(); return; }
    if (button.dataset.sgTile && !state) { const [row, level] = button.dataset.sgTile.split(':').map(Number); pick = { row, level }; let full = false; if (shopTab !== 'base' && tile(row, level).have) full = !equip(row, level); const g = root.querySelector('.sg-st-grid')?.scrollTop ?? 0; prep(); const grid = root.querySelector('.sg-st-grid'); if (grid) grid.scrollTop = g; root.querySelector<HTMLElement>(`.sg-st-grid [data-sg-tile="${row}:${level}"]`)?.focus(); if (full) q('.sg-message').textContent = t('siegeFull'); return; }
    if (action === 'purchase' && !state) { const g = root.querySelector('.sg-st-grid')?.scrollTop ?? 0; purchase(); prep(); const grid = root.querySelector('.sg-st-grid'); if (grid) grid.scrollTop = g; root.querySelector<HTMLElement>(`[data-sg="${action}"]:not(:disabled)`)?.focus(); return; }
    if (button.dataset.sgBuy !== undefined && !state) {
      const id = Number(button.dataset.sgBuy);
      if (M.buyTroop(progress, id)) { persist(); selected = [...progress.deck]; prep(); root.querySelector<HTMLElement>(`[data-sg-unit="${id}"]`)?.focus(); }
      else q('.sg-message').textContent = t('siegeNoGold');
      return;
    }
    if (button.dataset.sgPrep && !state) { prepTab = button.dataset.sgPrep as typeof prepTab; prep(); root.querySelector<HTMLElement>(`[data-sg-prep="${prepTab}"]`)?.focus(); return; }
    if (button.dataset.sgMapAct !== undefined && !state) {
      mapAct = Number(button.dataset.sgMapAct);
      // A world opens on its furthest open stage (the one picked, if it is in that world).
      if (mapAct && actNow() !== mapAct) world = Math.min(mapAct * cartoonModel.STAGES, progress.unlocked);
      sound('click'); prep(); return;
    }
    if (button.dataset.sgWorldPick && !state) { world = Number(button.dataset.sgWorldPick); const left = root.querySelector('.sg-isles')?.scrollLeft ?? 0; prep(); const isles = root.querySelector('.sg-isles'); if (isles) isles.scrollLeft = left; root.querySelector<HTMLElement>(`[data-sg-world-pick="${world}"]`)?.focus(); return; }
    if (up !== undefined && !state) { if (M.upgrade(progress, Number(up))) { persist(); prep(); } return; }
    if (button.hasAttribute('data-sg-turn')) { button.parentElement?.remove(); return; }
    if (button.dataset.sgTab && state) { tab = button.dataset.sgTab as typeof tab; cards(); return; }
    if (summonId !== undefined && state && !paused) { if (M.summon(state, Number(summonId))) sound('click'); updateUi(); return; }
    if (action === 'exit') close();
    else if (action === 'launch') mode === 'legacy' ? talk(intro(world), start) : cartoonModel.stageIn(world) === 1 ? actCard(actNow(), () => talk(cartoonStory.intro(actNow()), start)) : start();
    else if (action === 'modes') modes();
    else if (action === 'retry') start();
    else if (action === 'prep') prep();
    else if (action === 'next') { world = Math.min(lastWorld(), world + 1); prep(); }
    else if (action === 'pause') pause();
    else if (action === 'resume') resume();
    else if (action === 'home') camera.x = -Infinity;
    else if (action === 'enemy') camera.x = Math.max(0, M.FIELD - camera.width);
    else if (state && !paused) { if (action === 'generator') M.improveGenerator(state); if (action === 'strike' && M.strike(state)) sound('strike'); if (action === 'missile' && M.missile(state)) sound('boom'); updateUi(); }
  }, options);
  root.addEventListener('input', event => {
    const el = event.target as HTMLInputElement;
    if (el.hasAttribute('data-sg-camera')) camera.x = Math.max(0, M.FIELD - camera.width) * Number(el.value) / 1000;
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
    if (e.key === 'Escape') { e.preventDefault(); if (!state) mode === 'cartoon' && prepTab === 'shop' ? (prepTab = 'map', prep()) : mode === 'cartoon' && mapAct ? (mapAct = 0, prep()) : mode ? modes() : close(); else if (state.phase === 'fight') paused ? resume() : pause(); return; }
    if (!state || paused || e.repeat || /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName)) return;
    const key = e.key.toLowerCase();
    if ('123456efqrlas'.includes(key) || key.startsWith('arrow')) e.preventDefault();
    if (key === 'l' || key === 'a' || key === 's') { tab = key === 'l' ? 'land' : key === 'a' ? 'air' : 'special'; cards(); return; }
    if (/^[1-6]$/.test(key)) { const n = Number(key) - 1; if (tab === 'special') [() => M.improveGenerator(state!), () => M.strike(state!), () => M.missile(state!)][n]?.(); else { const id = tabCards()[n]; if (id !== undefined) M.summon(state, id); } }
    else if (key === 'r') M.missile(state);
    else if (key === 'e') M.improveGenerator(state); else if (key === 'f') M.toggleBow(state); else if (key === 'q') M.strike(state);
    else if (key === 'arrowleft') camera.x = Math.max(camera.min ?? 0, camera.x - 100); else if (key === 'arrowright') camera.x = Math.min(Math.max(0, M.FIELD - camera.width), camera.x + 100);
    updateUi();
  };
  window.addEventListener('keydown', keyHandler, { ...options, capture: true });
  window.addEventListener('keyup', e => e.stopImmediatePropagation(), { ...options, capture: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, options);
  window.addEventListener('blur', pause, options);
  /** The first screen: Siege Legacy or Siege Cartoon, each with its own progress. */
  function modes() {
    cancelAnimationFrame(frame); battleAbort.abort(); state = null; paused = false; mode = null; root.classList.remove('is-cartoon', 'is-legacy'); music(null);
    const card = (m: Mode, pic: string) => `<button class="sg-mode is-${m}" data-sg-mode="${m}"><img src="${pic}" data-trim="${pic}" alt=""><b>${t(m === 'legacy' ? 'siegeLegacy' : 'siegeCartoon')}</b><small>${t(m === 'legacy' ? 'siegeLegacyNote' : 'siegeCartoonNote')}</small></button>`;
    root.innerHTML = `<div class="sg-shell sg-prep sg-modes-page"><header class="sg-top"><button class="sg-back" data-sg="exit" aria-label="${t('siegeExit')}">←</button>
        <h1 class="sg-title"><small>${t('siegeSoon')}</small>${t('siegeName')}</h1></header>
      <section class="sg-modes">${card('legacy', '/images/game/bosses/monolith-2.webp')}${card('cartoon', ENGINES.cartoon.v.portrait(0, 5))}</section></div>`;
    ENGINES.cartoon.v.trimImages(root); focus();
  }
  function choose(next: Mode) {
    mode = next; ({ m: M, v: V } = ENGINES[next]);
    root.classList.toggle('is-cartoon', next === 'cartoon'); root.classList.toggle('is-legacy', next === 'legacy');
    progress = M.readProgress(storage.get(M.SAVE_KEY)); selected = [...progress.deck]; world = progress.unlocked; prepTab = 'map'; mapAct = 0;
    prep();
  }
  modes();
}
