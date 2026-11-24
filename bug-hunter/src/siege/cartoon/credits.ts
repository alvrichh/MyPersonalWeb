/* The end of the hero campaign: a short film after the last guardian falls and the ending's dialogue. The enemy
   fortress sinks as the red sky clears, our army marches past by name, the six worlds go by on the way home with the
   ending's lines, the credits roll and «The end». About a minute and a half; Skip (or Escape) ends it at once, and
   with reduced motion every card simply fades in. It is drawn with the game's own pictures (no video), and can be
   watched again from the settings once the campaign is won. */
import type { Key, T } from '../../strings';
import { levelsOf, specAt, HERO_AIR, HERO_LAND } from './model';

/** The worlds on the way home, from the last back to the meadows. */
const HOME = ['bg-final', 'bg-snow', 'bg-desert', 'bg-forest', 'bg-islands', 'bg-clean'].map(n => `/images/game/siege/${n}.webp`);
/** The army in the parade: our land troops on foot, then the flyers above them, each in its last form. */
const MARCH = HERO_LAND.flat().slice(0, 11), FLY = HERO_AIR.flat().slice(0, 5);

const esc = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const pic = (id: number, pose: number) => `/images/game/${specAt(id, levelsOf(id)).sprite}-${pose}.webp`;

export function openCredits(root: HTMLElement, t: T, opts: { lines: string[]; villain: boolean }, done: () => void) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.createElement('div');
  el.className = `sg-credits${reduced ? ' is-still' : ''}`;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', t('siegeCredits'));
  const troop = (id: number, i: number, air: boolean) => `<figure class="sg-cr-troop${air ? ' is-air' : ''}" style="--i:${i}">
      <span class="sg-cr-walk"><img src="${pic(id, 0)}" alt=""><img src="${pic(id, 1)}" alt=""></span>
      <figcaption>${esc(t(`siegeUnit${id}` as Key))}</figcaption></figure>`;
  el.innerHTML = `
    <section class="sg-cr-scene is-victory"><div class="sg-cr-sky"></div><img class="sg-cr-fort" src="/images/game/siege/enemy-5.webp" alt="">
      <div class="sg-cr-flash"></div><h2 class="sg-cr-big">${esc(t('siegeCreditsVictory'))}</h2></section>
    <section class="sg-cr-scene is-parade"><img class="sg-cr-bg" src="${HOME[5]}" alt=""><h2 class="sg-cr-title">${esc(t('siegeCreditsParade'))}</h2>
      <div class="sg-cr-army"><div class="sg-cr-train is-air">${FLY.map((id, i) => troop(id, i, true)).join('')}</div><div class="sg-cr-train">${MARCH.map((id, i) => troop(id, i, false)).join('')}</div></div></section>
    ${HOME.map((src, i) => `<section class="sg-cr-scene is-home" data-home="${i}"><img class="sg-cr-bg" src="${src}" alt="">
      <p class="sg-cr-line">${esc(i < opts.lines.length ? opts.lines[i] : i === HOME.length - 1 ? t('siegeCreditsHome') : '')}</p></section>`).join('')}
    <section class="sg-cr-scene is-roll"><img class="sg-cr-bg" src="${HOME[5]}" alt=""><div class="sg-cr-roll">
      <img class="sg-cr-logo" src="/images/logo-640.webp" alt="Cartoon Siege">
      <dl><dt>${esc(t('siegeCreditsDesign'))}</dt><dd>Álvaro Rodríguez Molina</dd>
      <dt>${esc(t('siegeCreditsSound'))}</dt><dd>${esc(t('siegeCreditsSoundBy'))}</dd>
      <dt>${esc(t('siegeCreditsStars'))}</dt><dd>${esc(t('siegeCreditsStarsBy'))}</dd></dl>
      <p class="sg-cr-thanks">${esc(t('siegeCreditsThanks'))}</p></div></section>
    <section class="sg-cr-scene is-end"><img class="sg-cr-bg" src="${HOME[5]}" alt=""><h2 class="sg-cr-big">${esc(t('siegeCreditsEnd'))}</h2>
      ${opts.villain ? `<p class="sg-cr-hook">😈 ${esc(t('siegeCreditsVillain'))}</p>` : ''}
      <button class="sg-primary sg-cr-go" data-cr="done">${esc(t('siegeCreditsContinue'))}</button></section>
    <button class="sg-cr-skip" data-cr="done">${esc(t('siegeCreditsSkip'))} ⏭</button>`;
  // The logo is only on Cartoon Siege's own site; elsewhere the roll opens on the game's name.
  const logo = el.querySelector<HTMLImageElement>('.sg-cr-logo');
  if (logo) logo.onerror = () => { const h = document.createElement('h2'); h.className = 'sg-cr-big'; h.textContent = t('siegeCartoon'); logo.replaceWith(h); };
  root.append(el);

  // Each scene's time on screen (seconds), in order.
  const scenes = [...el.querySelectorAll<HTMLElement>('.sg-cr-scene')];
  const times = scenes.map(s => (s.classList.contains('is-victory') ? 5 : s.classList.contains('is-parade') ? 16 : s.classList.contains('is-home') ? 4.5 : s.classList.contains('is-roll') ? 18 : 0));
  const timers: number[] = [];
  let at = 0;
  scenes.forEach((s, i) => { timers.push(window.setTimeout(() => { scenes.forEach(o => o.classList.toggle('is-on', o === s)); }, at * 1000)); at += times[i]; });
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    timers.forEach(clearTimeout); window.removeEventListener('keydown', key, true);
    el.classList.add('is-leaving'); window.setTimeout(() => { el.remove(); done(); }, reduced ? 0 : 400);
  };
  const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  window.addEventListener('keydown', key, true);
  el.addEventListener('click', e => { if ((e.target as HTMLElement).closest('[data-cr="done"]')) close(); });
  el.querySelector<HTMLElement>('.sg-cr-skip')?.focus();
}
