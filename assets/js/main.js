'use strict';

/*
 * alvrich — one small script for the whole page:
 * language and accent pickers, light/dark theme, header state,
 * scroll reveal and the AI radar feed.
 * English lives in the HTML; the other languages live in i18n.js.
 */

import { ACCENTS, EN_EXTRA, LANGUAGES, TRANSLATIONS } from './i18n.js';
import { BUBBLE_LINES } from './i18n-bubble.js';
import { RADAR_EN, RADAR_TRANSLATIONS } from './i18n-radar.js';

Object.assign(EN_EXTRA, RADAR_EN);
Object.entries(RADAR_TRANSLATIONS).forEach(([code, entries]) => Object.assign(TRANSLATIONS[code], entries));

const root = document.documentElement;
root.classList.add('js');

const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  },
};

const EN_ACCENT_NAMES = {
  blue: 'Blue', green: 'Green', red: 'Red', orange: 'Orange',
  yellow: 'Yellow', pink: 'Pink', white: 'White', black: 'Black',
};

let currentLang = 'en';

// Text for keys that only exist in JS. Falls back to English.
const t = (key) => TRANSLATIONS[currentLang]?.[key] || EN_EXTRA[key] || '';

const currentLocale = () => (LANGUAGES.find((lang) => lang.code === currentLang) || LANGUAGES[0]).locale;

/* ----------------------------------------------------------------- Pickers */

const pickers = Array.from(document.querySelectorAll('[data-picker]'));

const closePickers = (except) => {
  pickers.forEach((picker) => {
    if (picker === except) return;
    picker.classList.remove('is-open');
    picker.querySelector('.picker-trigger').setAttribute('aria-expanded', 'false');
    picker.querySelector('[data-picker-menu]').hidden = true;
  });
};

pickers.forEach((picker) => {
  const trigger = picker.querySelector('.picker-trigger');
  const menu = picker.querySelector('[data-picker-menu]');

  trigger.addEventListener('click', () => {
    const open = menu.hidden;
    closePickers(picker);
    menu.hidden = !open;
    picker.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    if (open) menu.querySelector('[aria-pressed="true"]')?.focus();
  });
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('[data-picker]')) closePickers();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const open = pickers.find((picker) => picker.classList.contains('is-open'));
  if (!open) return;
  closePickers();
  open.querySelector('.picker-trigger').focus();
});

const languageMenu = document.querySelector('[data-picker="language"] [data-picker-menu]');
const accentMenu = document.querySelector('[data-picker="accent"] [data-picker-menu]');
const currentFlag = document.querySelector('[data-language-current-flag]');

LANGUAGES.forEach((lang) => {
  const option = document.createElement('button');
  option.type = 'button';
  option.className = 'picker-option';
  option.dataset.lang = lang.code;
  option.lang = lang.htmlLang;
  option.innerHTML = `<img class="flag" src="./images/flag-${lang.flag}.svg" alt="" width="20" height="14"><span></span>`;
  option.querySelector('span').textContent = lang.label;
  option.addEventListener('click', () => {
    applyLanguage(lang.code);
    closePickers();
  });
  languageMenu.append(option);
});

ACCENTS.forEach((accent) => {
  const option = document.createElement('button');
  option.type = 'button';
  option.className = 'picker-option';
  option.dataset.accentOption = accent;
  // Each swatch previews its own accent by scoping data-accent to the dot.
  option.innerHTML = `<span class="swatch-dot" data-accent="${accent}"></span><span data-accent-name></span>`;
  option.addEventListener('click', () => {
    applyAccent(accent);
    closePickers();
  });
  accentMenu.append(option);
});

/* ---------------------------------------------------------------- Language */

const i18nNodes = Array.from(document.querySelectorAll('[data-i18n]'));
const original = new Map(
  i18nNodes.map((node) => {
    const attr = node.dataset.i18nAttr;
    return [node, attr ? node.getAttribute(attr) : node.innerHTML];
  }),
);

function applyLanguage(code) {
  const lang = LANGUAGES.find((item) => item.code === code) || LANGUAGES[0];
  currentLang = lang.code;
  root.lang = lang.htmlLang;
  root.dir = lang.dir || 'ltr';

  const dictionary = TRANSLATIONS[currentLang] || {};

  i18nNodes.forEach((node) => {
    const key = node.dataset.i18n;
    const attr = node.dataset.i18nAttr;
    const value = dictionary[key] || original.get(node);
    if (attr) node.setAttribute(attr, value);
    else node.innerHTML = value;
  });

  if (currentFlag) currentFlag.src = `./images/flag-${lang.flag}.svg`;

  languageMenu.querySelectorAll('[data-lang]').forEach((option) => {
    option.setAttribute('aria-pressed', String(option.dataset.lang === currentLang));
  });

  accentMenu.querySelectorAll('[data-accent-option]').forEach((option) => {
    const accent = option.dataset.accentOption;
    option.querySelector('[data-accent-name]').textContent = dictionary[`theme.${accent}`] || EN_ACCENT_NAMES[accent];
  });

  syncThemeLabel();
  renderRadarMeta();
  renderArchive();
  renderExperienceMeta();
  storage.set('lang', currentLang);
}

/* -------------------------------------------------------------- Experience */

// "2026-01" -> months since year 0, so durations are simple subtraction.
const monthIndex = (value) => {
  const [year, month] = value.split('-').map(Number);
  return year * 12 + (month - 1);
};

const today = new Date();
const thisMonth = today.getFullYear() * 12 + today.getMonth();

const formatMonth = (index) =>
  new Date(Math.floor(index / 12), index % 12, 1).toLocaleDateString(currentLocale(), {
    month: 'short',
    year: 'numeric',
  });

// Inclusive month count, the way LinkedIn shows it: Jan–Oct = 10 months.
const formatDuration = (months) => {
  const unit = (name, value) =>
    new Intl.NumberFormat(currentLocale(), { style: 'unit', unit: name, unitDisplay: 'long' }).format(value);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years && unit('year', years), rest && unit('month', rest)].filter(Boolean).join(' ');
};

function renderExperienceMeta() {
  document.querySelectorAll('[data-xp-meta]').forEach((node) => {
    const { start, end, type, place, mode } = node.dataset;
    const startIndex = monthIndex(start);
    const endIndex = end ? monthIndex(end) : thisMonth;
    const parts = [];

    if (!('hideDates' in node.dataset)) {
      parts.push(`${formatMonth(startIndex)} – ${end ? formatMonth(endIndex) : t('xp.present')}`);
    }
    parts.push(formatDuration(endIndex - startIndex + 1));
    if (type) parts.push(t(`xp.type.${type}`));
    if (place) parts.push(t(`xp.place.${place}`));
    if (mode) parts.push(t(`xp.mode.${mode}`));

    node.textContent = parts.join(' · ');
  });
}

/* ------------------------------------------------------------------ Accent */

function applyAccent(accent) {
  const next = ACCENTS.includes(accent) ? accent : 'blue';
  root.dataset.accent = next;
  accentMenu.querySelectorAll('[data-accent-option]').forEach((option) => {
    option.setAttribute('aria-pressed', String(option.dataset.accentOption === next));
  });
  storage.set('accent', next);
  syncControlLabels();
}

/* ------------------------------------------------------------------- Theme */

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const effectiveTheme = () => root.dataset.theme || (prefersDark.matches ? 'dark' : 'light');
const themeToggle = document.querySelector('[data-theme-toggle]');

function syncThemeLabel() {
  if (!themeToggle) return;
  themeToggle.setAttribute('aria-label', t(effectiveTheme() === 'dark' ? 'controls.toLight' : 'controls.toDark'));
  syncControlLabels();
}

themeToggle?.addEventListener('click', () => {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  storage.set('theme', next);
  syncThemeLabel();
});

/* ------------------------------------------------------------ Talking logo */

// Hover the little figure in the topbar and it says something; every hover
// moves on to the next line, and it gets grumpier the more you poke it.
const brandLink = document.querySelector('.topbar .brand');
const bubble = document.createElement('span');
bubble.className = 'brand-bubble';
bubble.setAttribute('aria-hidden', 'true');
brandLink?.append(bubble);

let bubbleLine = -1;
let bubbleTimer;

const showBubble = () => {
  const lines = BUBBLE_LINES[currentLang] || BUBBLE_LINES.en;
  bubbleLine = (bubbleLine + 1) % lines.length;
  bubble.textContent = lines[bubbleLine];
  clearTimeout(bubbleTimer);
  // Restart the pop and the little hop even if the bubble is already open.
  brandLink.classList.remove('is-talking');
  void brandLink.offsetWidth;
  brandLink.classList.add('is-talking');
};

const hideBubble = () => {
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => brandLink.classList.remove('is-talking'), 900);
};

if (brandLink) {
  brandLink.addEventListener('mouseenter', showBubble);
  brandLink.addEventListener('mouseleave', hideBubble);
  brandLink.addEventListener('focus', showBubble);
  brandLink.addEventListener('blur', hideBubble);
}

/* ------------------------------------------------------------------ Header */

const header = document.querySelector('[data-header]');
const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const navLinks = Array.from(document.querySelectorAll('.section-nav a'));
// Only same-page anchors map to sections; on other pages the tabs point back
// to ./index.html#… and simply navigate.
const sections = navLinks
  .map((link) => link.getAttribute('href'))
  .filter((href) => href.startsWith('#'))
  .map((href) => document.querySelector(href))
  .filter(Boolean);

const setCurrentTab = (id) => {
  // The hero has no tab of its own; it belongs to "About".
  const target = id === 'top' ? 'about' : id;
  navLinks.forEach((link) => {
    const isCurrent = link.getAttribute('href') === `#${target}`;
    link.classList.toggle('is-current', isCurrent);
    if (isCurrent) {
      link.setAttribute('aria-current', 'true');
      // Keep the active tab visible when the tab row scrolls on small screens.
      link.parentElement.scrollTo({ left: link.offsetLeft - 16, behavior: 'smooth' });
    } else {
      link.removeAttribute('aria-current');
    }
  });
  document.querySelectorAll('.mobile-menu-nav [data-section]').forEach((link) => {
    link.classList.toggle('is-current', link.getAttribute('href') === `#${target}`);
  });
};

if ('IntersectionObserver' in window && sections.length) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setCurrentTab(entry.target.id);
      });
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );
  sections.forEach((section) => navObserver.observe(section));
}

setCurrentTab('top');

/* ------------------------------------------------------------- Mobile menu */

// On phones the topbar steps aside and a floating button opens a full menu:
// big section tabs, then language, accent and theme — the same layout the
// previous version of the site had on mobile.
const MOBILE_QUERY = window.matchMedia('(max-width: 760px)');

const menuTrigger = document.createElement('button');
menuTrigger.type = 'button';
menuTrigger.className = 'mobile-menu-trigger';
menuTrigger.setAttribute('aria-expanded', 'false');
menuTrigger.setAttribute('aria-controls', 'mobile-menu');
menuTrigger.innerHTML = '<span aria-hidden="true"></span>';

const menuBackdrop = document.createElement('div');
menuBackdrop.className = 'mobile-menu-backdrop';
menuBackdrop.id = 'mobile-menu';
menuBackdrop.hidden = true;
menuBackdrop.innerHTML = `
  <aside class="mobile-menu-panel" role="dialog" aria-modal="true">
    <header class="mobile-menu-head">
      <a class="brand" href="#top" data-menu-close>
        <span class="brand-mark" aria-hidden="true"><img src="./images/favicon-192.png" alt="" width="40" height="40"></span>
        <span class="brand-copy"><strong>alvrich</strong></span>
      </a>
      <button class="mobile-menu-close" type="button" data-menu-close>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </header>
    <nav class="mobile-menu-nav"></nav>
    <div class="mobile-menu-controls">
      <div class="mobile-control" data-mobile-control="language">
        <button class="mobile-control-trigger" type="button" aria-expanded="false">
          <span class="mobile-control-label"></span>
          <span class="mobile-control-value"><img class="flag" alt="" width="20" height="14"><span></span></span>
        </button>
        <div class="mobile-control-menu" hidden></div>
      </div>
      <div class="mobile-control" data-mobile-control="accent">
        <button class="mobile-control-trigger" type="button" aria-expanded="false">
          <span class="mobile-control-label"></span>
          <span class="mobile-control-value"><span class="swatch-dot"></span><span></span></span>
        </button>
        <div class="mobile-control-menu" hidden></div>
      </div>
      <button class="mobile-control-trigger mobile-theme-toggle" type="button">
        <span class="mobile-control-label"></span>
        <span class="mobile-control-value">
          <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
          <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        </span>
      </button>
    </div>
  </aside>`;

document.body.append(menuTrigger, menuBackdrop);

const menuPanel = menuBackdrop.querySelector('.mobile-menu-panel');
const menuNav = menuBackdrop.querySelector('.mobile-menu-nav');

// Same sections as the topbar, plus the "Life" tab that pointed to the gym page.
navLinks.forEach((link) => {
  const item = document.createElement('a');
  item.href = link.getAttribute('href');
  item.dataset.section = '';
  item.dataset.menuClose = '';
  menuNav.append(item);
});
const lifeLink = document.createElement('a');
lifeLink.href = './gym.html';
lifeLink.textContent = 'Life';
menuNav.append(lifeLink);

const languageControl = menuBackdrop.querySelector('[data-mobile-control="language"]');
const accentControl = menuBackdrop.querySelector('[data-mobile-control="accent"]');
const mobileThemeToggle = menuBackdrop.querySelector('.mobile-theme-toggle');

LANGUAGES.forEach((lang) => {
  const option = document.createElement('button');
  option.type = 'button';
  option.className = 'mobile-control-option';
  option.dataset.lang = lang.code;
  option.lang = lang.htmlLang;
  option.innerHTML = `<span></span><img class="flag" src="./images/flag-${lang.flag}.svg" alt="" width="20" height="14">`;
  option.querySelector('span').textContent = lang.label;
  option.addEventListener('click', () => {
    applyLanguage(lang.code);
    toggleControl(languageControl, false);
  });
  languageControl.querySelector('.mobile-control-menu').append(option);
});

ACCENTS.forEach((accent) => {
  const option = document.createElement('button');
  option.type = 'button';
  option.className = 'mobile-control-option';
  option.dataset.accentOption = accent;
  option.innerHTML = `<span data-accent-name></span><span class="swatch-dot" data-accent="${accent}"></span>`;
  option.addEventListener('click', () => {
    applyAccent(accent);
    toggleControl(accentControl, false);
  });
  accentControl.querySelector('.mobile-control-menu').append(option);
});

function toggleControl(control, open) {
  const trigger = control.querySelector('.mobile-control-trigger');
  const menu = control.querySelector('.mobile-control-menu');
  const next = open ?? menu.hidden;
  [languageControl, accentControl].forEach((other) => {
    if (other === control || !next) return;
    other.querySelector('.mobile-control-menu').hidden = true;
    other.querySelector('.mobile-control-trigger').setAttribute('aria-expanded', 'false');
    other.classList.remove('is-open');
  });
  menu.hidden = !next;
  trigger.setAttribute('aria-expanded', String(next));
  control.classList.toggle('is-open', next);
}

[languageControl, accentControl].forEach((control) => {
  control.querySelector('.mobile-control-trigger').addEventListener('click', () => toggleControl(control));
});

mobileThemeToggle.addEventListener('click', () => themeToggle?.click());

let menuReturnFocus = null;

function openMenu() {
  menuReturnFocus = document.activeElement;
  menuBackdrop.hidden = false;
  // Next frame, so the slide-in transition runs from the closed state.
  requestAnimationFrame(() => document.body.classList.add('mobile-menu-open'));
  menuTrigger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  menuPanel.querySelector('.mobile-menu-close').focus();
}

function closeMenu() {
  if (menuBackdrop.hidden) return;
  document.body.classList.remove('mobile-menu-open');
  menuTrigger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  [languageControl, accentControl].forEach((control) => toggleControl(control, false));
  setTimeout(() => { menuBackdrop.hidden = true; }, 220);
  menuReturnFocus?.focus?.();
}

menuTrigger.addEventListener('click', () => (menuBackdrop.hidden ? openMenu() : closeMenu()));

menuBackdrop.addEventListener('click', (event) => {
  if (event.target.closest('[data-menu-close]') || !event.target.closest('.mobile-menu-panel')) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

MOBILE_QUERY.addEventListener('change', (event) => {
  if (!event.matches) closeMenu();
});

function syncControlLabels() {
  const lang = LANGUAGES.find((item) => item.code === currentLang) || LANGUAGES[0];
  const accent = root.dataset.accent || 'blue';
  const accentName = TRANSLATIONS[currentLang]?.[`theme.${accent}`] || EN_ACCENT_NAMES[accent];
  const dark = effectiveTheme() === 'dark';

  // Topbar triggers (their text only shows on mobile).
  const langName = document.querySelector('[data-language-current-name]');
  const accentNameNode = document.querySelector('[data-accent-current-name]');
  if (langName) langName.textContent = lang.label;
  if (accentNameNode) accentNameNode.textContent = accentName;

  if (!menuNav) return;

  menuTrigger.setAttribute('aria-label', TRANSLATIONS[currentLang]?.['nav.aria'] || 'Main sections');
  menuPanel.setAttribute('aria-label', TRANSLATIONS[currentLang]?.['nav.aria'] || 'Main sections');
  menuPanel.querySelector('.mobile-menu-close').setAttribute('aria-label', '×');

  menuNav.querySelectorAll('[data-section]').forEach((item, index) => {
    item.textContent = navLinks[index].textContent.trim();
  });

  languageControl.querySelector('.mobile-control-label').textContent = t('controls.language') || 'Language';
  languageControl.querySelector('.mobile-control-value img').src = `./images/flag-${lang.flag}.svg`;
  languageControl.querySelector('.mobile-control-value span').textContent = lang.label;
  languageControl.querySelectorAll('[data-lang]').forEach((option) => {
    option.setAttribute('aria-pressed', String(option.dataset.lang === currentLang));
  });

  accentControl.querySelector('.mobile-control-label').textContent = t('controls.accent') || 'Accent';
  accentControl.querySelector('.mobile-control-value span:last-child').textContent = accentName;
  accentControl.querySelectorAll('[data-accent-option]').forEach((option) => {
    const name = option.dataset.accentOption;
    option.querySelector('[data-accent-name]').textContent = TRANSLATIONS[currentLang]?.[`theme.${name}`] || EN_ACCENT_NAMES[name];
    option.setAttribute('aria-pressed', String(name === accent));
  });

  mobileThemeToggle.querySelector('.mobile-control-label').textContent = t(dark ? 'controls.toLight' : 'controls.toDark');
}

/* --------------------------------------------------------- Scroll progress */

// A thin bar pinned to the top of the viewport that fills as you scroll.
const progress = document.createElement('div');
progress.className = 'scroll-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.prepend(progress);

let progressFrame;
const updateProgress = () => {
  progressFrame = null;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
};

window.addEventListener('scroll', () => {
  progressFrame ??= requestAnimationFrame(updateProgress);
}, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();

/* ------------------------------------------------------------------ Reveal */

const revealTargets = document.querySelectorAll(
  '.section-head, .work-item, .xp-item, .edu, .skills-grid > div, .off-body, .off-card, .contact > *',
);

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px' },
  );

  revealTargets.forEach((el) => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });
}

/* ---------------------------------------------------------------- AI radar */

// The home shows a short preview list; ai-radar.html shows every item the
// daily bot collected as cards with picture, summary and tags, plus filters.
const RADAR_PREVIEW = 5;
const RADAR_MAX_FILTERS = 8;

const radarList = document.querySelector('[data-radar-list]');
const radarGrid = document.querySelector('[data-radar-grid]');
const radarFilters = document.querySelector('[data-radar-filters]');
const radarCount = document.querySelector('[data-radar-count]');
const radarInsight = document.querySelector('[data-radar-insight]');
const radarUpdatedNodes = document.querySelectorAll('[data-radar-updated]');
let radarDate = null;
let radarItems = [];
let radarTag = 'all';

// Archive (ai-radar.html): every story since the radar started, as a list
// grouped by month, searchable, loaded 50 at a time.
const ARCHIVE_PAGE = 50;
const archiveSection = document.querySelector('[data-archive]');
const archiveList = document.querySelector('[data-archive-list]');
const archiveMore = document.querySelector('[data-archive-more]');
const archiveSearch = document.querySelector('[data-archive-search]');
const archiveCount = document.querySelector('[data-archive-count]');
let archiveItems = [];
let archiveQuery = '';
let archiveShown = ARCHIVE_PAGE;

const formatDate = (value) => {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(currentLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
};

// Feed text sometimes arrives with HTML entities (&#8217;). Decode them as inert text.
const decodeEntities = (value) =>
  new DOMParser().parseFromString(String(value), 'text/html').documentElement.textContent;

const isSafeUrl = (value) => {
  try {
    return ['https:', 'http:'].includes(new URL(value).protocol);
  } catch (e) {
    return false;
  }
};

// WordPress image CDNs (The Verge, GitHub blog…) resize on request with ?w=.
// Without it a 64px thumbnail would download the full original.
const RESIZABLE_IMAGE_HOSTS = ['platform.theverge.com', 'github.blog', 'blogs.microsoft.com'];
const sizedImage = (url, width) => {
  try {
    const parsed = new URL(url);
    const resizable = RESIZABLE_IMAGE_HOSTS.includes(parsed.hostname) || parsed.hostname.endsWith('.wp.com');
    if (!resizable) return url;
    parsed.searchParams.set('w', String(width));
    return parsed.href;
  } catch (e) {
    return url;
  }
};

const visibleRadarItems = () => (radarTag === 'all'
  ? radarItems
  : radarItems.filter((item) => (item.tags || []).includes(radarTag)));

function renderRadarMeta() {
  radarUpdatedNodes.forEach((node) => {
    if (radarDate) node.textContent = `${t('radar.updated')} ${formatDate(radarDate)}`;
  });
  document.querySelectorAll('[data-radar-item-date]').forEach((node) => {
    node.textContent = formatDate(node.dataset.radarItemDate);
  });
  document.querySelectorAll('[data-radar-read]').forEach((node) => {
    node.textContent = t('radar.read').replace('{source}', node.dataset.radarRead);
  });
  document.querySelectorAll('[data-radar-empty]').forEach((node) => {
    node.textContent = t('radar.empty');
  });
  if (radarCount && radarItems.length) {
    radarCount.textContent = t('radar.count').replace('{n}', visibleRadarItems().length);
  }
  const allChip = radarFilters?.querySelector('[data-radar-tag="all"] span');
  if (allChip) allChip.textContent = t('radar.all');
}

const emptyRow = (tag) => {
  const node = document.createElement(tag);
  node.className = 'radar-empty';
  node.dataset.radarEmpty = '';
  return node;
};

// Home: date · title · source rows.
const renderRadarList = () => {
  radarList.replaceChildren();
  const items = radarItems.slice(0, RADAR_PREVIEW);
  if (!items.length) radarList.append(emptyRow('li'));

  items.forEach((item) => {
    const li = document.createElement('li');

    const date = document.createElement('span');
    date.className = 'radar-date';
    date.dataset.radarItemDate = item.date;

    const link = document.createElement('a');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = decodeEntities(item.title);

    const source = document.createElement('span');
    source.className = 'radar-source';
    source.textContent = item.source;

    li.append(date, link, source);
    radarList.append(li);
  });
};

// Radar page: a card per story. Pictures come from third-party sites, so a
// broken one falls back to a tinted panel with the source name.
const radarFallback = (source) => {
  const fallback = document.createElement('span');
  fallback.className = 'radar-card-fallback';
  fallback.textContent = source;
  return fallback;
};

const renderRadarGrid = () => {
  radarGrid.replaceChildren();
  const items = visibleRadarItems();
  if (!items.length) radarGrid.append(emptyRow('li'));

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'radar-card' + (index === 0 && radarTag === 'all' ? ' is-featured' : '');

    const link = document.createElement('a');
    link.className = 'radar-card-link';
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noreferrer';

    const media = document.createElement('span');
    media.className = 'radar-card-media';
    if (item.image && isSafeUrl(item.image)) {
      const img = document.createElement('img');
      img.src = sizedImage(item.image, index === 0 && radarTag === 'all' ? 1200 : 800);
      img.alt = '';
      img.loading = index < 3 ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => img.replaceWith(radarFallback(item.source)), { once: true });
      media.append(img);
    } else {
      media.append(radarFallback(item.source));
    }

    const body = document.createElement('span');
    body.className = 'radar-card-body';

    const meta = document.createElement('span');
    meta.className = 'radar-card-meta';
    const source = document.createElement('span');
    source.textContent = item.source;
    const date = document.createElement('span');
    date.dataset.radarItemDate = item.date;
    meta.append(source, date);

    const title = document.createElement('span');
    title.className = 'radar-card-title';
    title.textContent = decodeEntities(item.title);

    body.append(meta, title);

    // WordPress feeds append "The post <title> appeared first on <site>"; drop it,
    // even when the bot has already cut it short with "...".
    const summaryText = decodeEntities(item.summary || '').replace(/\s+The post\s[\s\S]*$/, '').trim();
    if (summaryText && summaryText !== title.textContent) {
      const summary = document.createElement('span');
      summary.className = 'radar-card-summary';
      summary.textContent = summaryText;
      body.append(summary);
    }

    if ((item.tags || []).length) {
      const tags = document.createElement('span');
      tags.className = 'radar-card-tags';
      item.tags.forEach((tag) => {
        const chip = document.createElement('span');
        chip.textContent = tag;
        tags.append(chip);
      });
      body.append(tags);
    }

    const cta = document.createElement('span');
    cta.className = 'radar-card-cta';
    cta.dataset.radarRead = item.source;
    body.append(cta);

    link.append(media, body);
    li.append(link);
    radarGrid.append(li);
  });
};

const matchesArchive = (item) => {
  if (radarTag !== 'all' && !(item.tags || []).includes(radarTag)) return false;
  return !archiveQuery || item.searchText.includes(archiveQuery);
};

function renderArchive() {
  if (!archiveList || !archiveItems.length) return;

  const matching = archiveItems.filter(matchesArchive);
  const shown = matching.slice(0, archiveShown);
  archiveList.replaceChildren();

  if (!shown.length) {
    const empty = document.createElement('li');
    empty.className = 'radar-empty';
    empty.textContent = t('radar.noResults');
    archiveList.append(empty);
  }

  let monthList = null;
  let monthKey = '';
  shown.forEach((item) => {
    const key = String(item.date).slice(0, 7);
    if (key !== monthKey) {
      monthKey = key;
      const month = document.createElement('li');
      month.className = 'radar-archive-month';
      const heading = document.createElement('h3');
      const [year, monthNumber] = key.split('-').map(Number);
      heading.textContent = new Date(year, monthNumber - 1, 1)
        .toLocaleDateString(currentLocale(), { month: 'long', year: 'numeric' });
      monthList = document.createElement('ul');
      month.append(heading, monthList);
      archiveList.append(month);
    }

    const row = document.createElement('li');

    // Small picture when the story has one; an empty tinted square otherwise,
    // so titles stay aligned.
    const thumb = document.createElement('span');
    thumb.className = 'radar-archive-thumb';
    thumb.setAttribute('aria-hidden', 'true');
    if (item.image && isSafeUrl(item.image)) {
      const img = document.createElement('img');
      img.src = sizedImage(item.image, 160);
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => img.remove(), { once: true });
      thumb.append(img);
    }

    const day = document.createElement('span');
    day.className = 'radar-date';
    day.textContent = new Date(`${item.date}T12:00:00`)
      .toLocaleDateString(currentLocale(), { day: 'numeric', month: 'short' });
    const link = document.createElement('a');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = item.displayTitle;
    const source = document.createElement('span');
    source.className = 'radar-source';
    source.textContent = item.source;
    row.append(thumb, day, link, source);
    monthList.append(row);
  });

  if (archiveCount) archiveCount.textContent = t('radar.count').replace('{n}', matching.length);
  if (archiveMore) {
    const remaining = matching.length - shown.length;
    archiveMore.hidden = remaining <= 0;
    archiveMore.textContent = `${t('radar.loadMore')} (${remaining})`;
  }
}

archiveMore?.addEventListener('click', () => {
  archiveShown += ARCHIVE_PAGE;
  renderArchive();
});

let archiveSearchTimer;
archiveSearch?.addEventListener('input', () => {
  clearTimeout(archiveSearchTimer);
  archiveSearchTimer = setTimeout(() => {
    archiveQuery = archiveSearch.value.trim().toLowerCase();
    archiveShown = ARCHIVE_PAGE;
    // While searching, the results replace the "Latest" cards right under the filters.
    document.querySelector('[data-radar-latest]')?.toggleAttribute('hidden', Boolean(archiveQuery));
    renderArchive();
  }, 150);
});

const renderRadarFilters = () => {
  if (!radarFilters) return;

  const pool = archiveItems.length ? archiveItems : radarItems;
  const counts = new Map();
  pool.forEach((item) => (item.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, RADAR_MAX_FILTERS);
  if (!tags.length) return;

  const chip = (value, label, count) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'radar-chip';
    button.dataset.radarTag = value;
    button.setAttribute('aria-pressed', String(value === radarTag));
    button.innerHTML = '<span></span><small></small>';
    button.querySelector('span').textContent = label;
    button.querySelector('small').textContent = count;
    button.addEventListener('click', () => {
      radarTag = value;
      archiveShown = ARCHIVE_PAGE;
      radarFilters.querySelectorAll('[data-radar-tag]').forEach((node) => {
        node.setAttribute('aria-pressed', String(node.dataset.radarTag === radarTag));
      });
      renderRadar();
    });
    return button;
  };

  radarFilters.replaceChildren(
    chip('all', t('radar.all'), pool.length),
    ...tags.map(([tag, count]) => chip(tag, tag, count)),
  );
  radarFilters.hidden = false;
};

const renderRadar = () => {
  if (radarList) renderRadarList();
  if (radarGrid) renderRadarGrid();
  renderArchive();
  renderRadarMeta();
};

if (radarList || radarGrid) {
  fetch('./data/ai-radar.json', { cache: 'no-cache' })
    .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
    .then((data) => {
      radarDate = data.date || null;
      radarItems = (Array.isArray(data.items) ? data.items : [])
        .filter((item) => item && item.title && isSafeUrl(item.url));
      if (radarInsight && data.insight) {
        radarInsight.querySelector('[data-radar-insight-text]').textContent = decodeEntities(data.insight);
        radarInsight.hidden = false;
      }
      renderRadarFilters();
      renderRadar();
    })
    .catch(() => {
      radarItems = [];
      renderRadar();
    });
}

if (archiveList) {
  fetch('./data/ai-radar-archive.json', { cache: 'no-cache' })
    .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
    .then((data) => {
      archiveItems = (Array.isArray(data.items) ? data.items : [])
        .filter((item) => item && item.title && isSafeUrl(item.url))
        .map((item) => {
          const displayTitle = decodeEntities(item.title);
          return { ...item, displayTitle, searchText: `${displayTitle} ${item.source}`.toLowerCase() };
        });
      if (!archiveItems.length) return;
      archiveSection.hidden = false;
      renderRadarFilters();
      renderArchive();
    })
    .catch(() => {});
}

/* -------------------------------------------------------------------- Init */

const yearNode = document.querySelector('[data-year]');
if (yearNode) yearNode.textContent = String(new Date().getFullYear());

const detectLanguage = () => {
  const saved = storage.get('lang');
  if (saved && LANGUAGES.some((lang) => lang.code === saved)) return saved;
  const browser = (navigator.language || 'en').toLowerCase().split('-')[0];
  return LANGUAGES.some((lang) => lang.code === browser) ? browser : 'en';
};

applyAccent(storage.get('accent') || root.dataset.accent);
applyLanguage(detectLanguage());
