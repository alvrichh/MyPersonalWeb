'use strict';

const MOBILE_MENU_BREAKPOINT = 760;

const createMobileMenuDrawerStyles = () => {
  if (document.querySelector('[data-mobile-vcard-drawer-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-mobile-vcard-drawer-style', 'true');
  style.textContent = `
    .mobile-vcard-trigger,
    .mobile-vcard-backdrop {
      display: none;
    }

    @media (max-width: 760px) {
      body.has-mobile-vcard-drawer .topbar .section-nav {
        display: none;
      }

      .mobile-vcard-trigger {
        position: fixed;
        top: max(.72rem, env(safe-area-inset-top));
        right: max(.72rem, env(safe-area-inset-right));
        z-index: 180;
        width: 3.15rem;
        height: 3.15rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 19px;
        color: var(--text);
        background:
          linear-gradient(180deg, rgba(255,255,255,.105), rgba(255,255,255,.035)),
          rgba(8, 13, 22, .74);
        box-shadow:
          0 18px 48px rgba(0,0,0,.28),
          inset 0 1px 0 rgba(255,255,255,.08);
        backdrop-filter: blur(22px) saturate(1.2);
        -webkit-backdrop-filter: blur(22px) saturate(1.2);
        transition: opacity .16s ease, transform .16s ease;
      }

      body.mobile-vcard-open .mobile-vcard-trigger {
        opacity: 0;
        transform: scale(.88);
        pointer-events: none;
      }

      .mobile-vcard-trigger span {
        position: relative;
        width: 1.24rem;
        height: 2px;
        border-radius: 999px;
        background: currentColor;
      }

      .mobile-vcard-trigger span::before,
      .mobile-vcard-trigger span::after {
        content: "";
        position: absolute;
        left: 0;
        width: 1.24rem;
        height: 2px;
        border-radius: 999px;
        background: currentColor;
      }

      .mobile-vcard-trigger span::before { top: -.46rem; }
      .mobile-vcard-trigger span::after { top: .46rem; }

      .mobile-vcard-backdrop {
        position: fixed;
        inset: 0;
        z-index: 170;
        display: block;
        padding: max(.9rem, env(safe-area-inset-top)) max(.72rem, env(safe-area-inset-right)) max(.9rem, env(safe-area-inset-bottom)) max(.72rem, env(safe-area-inset-left));
        background: rgba(3, 6, 12, .64);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        opacity: 0;
        pointer-events: none;
        transition: opacity .2s ease;
      }

      body.mobile-vcard-open .mobile-vcard-backdrop {
        opacity: 1;
        pointer-events: auto;
      }

      .mobile-vcard-panel {
        width: min(100%, 430px);
        height: auto;
        max-height: calc(100vh - 1.8rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));
        margin-left: auto;
        position: relative;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 34px;
        overflow: hidden;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(var(--accent-rgb), .16), transparent 36%),
          radial-gradient(circle at 90% 10%, rgba(var(--secondary-rgb), .11), transparent 30%),
          linear-gradient(180deg, rgba(23, 28, 38, .96), rgba(10, 14, 22, .97));
        box-shadow:
          0 34px 92px rgba(0,0,0,.48),
          inset 0 1px 0 rgba(255,255,255,.08);
        transform: translateX(26px) scale(.985);
        transition: transform .22s cubic-bezier(.22, 1, .36, 1);
      }

      body.mobile-vcard-open .mobile-vcard-panel {
        transform: translateX(0) scale(1);
      }

      .mobile-vcard-head {
        min-height: 3.55rem;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: .72rem .72rem .25rem;
      }

      .mobile-vcard-brand {
        display: none;
      }

      .mobile-vcard-close {
        width: 2.6rem;
        height: 2.6rem;
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 17px;
        color: var(--text);
        background: rgba(255,255,255,.065);
        font-size: 1.35rem;
        line-height: 1;
        font-weight: 700;
        box-shadow: none;
      }

      .mobile-vcard-nav {
        display: grid;
        gap: .6rem;
        padding: .2rem 1rem 1rem;
        max-height: calc(100vh - 5.6rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));
        overflow: auto;
        overscroll-behavior: contain;
      }

      .mobile-vcard-nav::-webkit-scrollbar {
        width: 0;
      }

      .mobile-vcard-nav .nav-tab,
      .mobile-vcard-nav .gym-nav-link {
        width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: .82rem 1rem;
        min-height: 4.25rem;
        border-radius: 20px;
        font-family: var(--font-display);
        font-size: clamp(1.25rem, 6.8vw, 2rem);
        line-height: 1;
        letter-spacing: -.05em;
        background: rgba(255,255,255,.055);
      }

      .mobile-vcard-nav .gym-nav-link {
        text-decoration: none;
      }

      .mobile-vcard-nav .nav-tab.is-active,
      .mobile-vcard-nav .nav-tab:hover,
      .mobile-vcard-nav .gym-nav-link:hover {
        background: linear-gradient(135deg, rgba(var(--accent-rgb), .95), rgba(var(--accent-strong-rgb), .95));
        color: var(--accent-text);
        border-color: transparent;
      }

      .mobile-vcard-controls {
        display: grid;
        gap: .62rem;
        margin-top: .32rem;
        padding-top: .8rem;
        border-top: 1px solid rgba(255,255,255,.065);
      }

      .mobile-menu-control {
        position: relative;
      }

      .mobile-menu-control__trigger {
        width: 100%;
        min-height: 3.45rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: .85rem;
        padding: .8rem .95rem;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 18px;
        color: var(--text);
        background: rgba(255,255,255,.052);
      }

      .mobile-menu-control__label {
        display: grid;
        gap: .08rem;
        text-align: left;
      }

      .mobile-menu-control__label small {
        display: none;
      }

      .mobile-menu-control__label strong {
        color: var(--text);
        font-size: 1rem;
      }

      .mobile-menu-control__value {
        display: inline-flex;
        align-items: center;
        gap: .45rem;
        color: var(--accent-strong);
        font-weight: 900;
        white-space: nowrap;
      }

      .mobile-menu-control__menu {
        display: none;
        gap: .5rem;
        margin-top: .55rem;
        padding: .65rem;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 20px;
        background: rgba(0,0,0,.18);
      }

      .mobile-menu-control.is-open .mobile-menu-control__menu {
        display: grid;
      }

      .mobile-menu-option {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: .8rem;
        padding: .78rem .85rem;
        border: 1px solid transparent;
        border-radius: 16px;
        color: var(--text);
        background: rgba(255,255,255,.05);
        font-weight: 900;
      }

      .mobile-menu-option.is-active {
        border-color: rgba(var(--accent-rgb), .34);
        background: rgba(var(--accent-rgb), .14);
        color: var(--accent-strong);
      }
    }
  `;

  document.head.appendChild(style);
};

const cloneNav = () => {
  const nav = document.querySelector('.topbar .section-nav') || document.querySelector('.section-nav');
  if (!nav) return '';

  const clone = nav.cloneNode(true);
  clone.className = 'mobile-vcard-nav';
  clone.removeAttribute('data-i18n');
  clone.removeAttribute('data-i18n-attr');
  clone.setAttribute('aria-label', 'Mobile section menu');

  clone.querySelectorAll('[aria-pressed]').forEach((button) => {
    button.setAttribute('aria-pressed', 'false');
  });

  const controls = document.createElement('div');
  controls.className = 'mobile-vcard-controls';
  controls.innerHTML = createControlsMarkup();
  clone.appendChild(controls);

  return clone.outerHTML;
};

const getActiveLanguageOption = () => document.querySelector('.language-option.is-active') || document.querySelector('.language-option');
const getActiveThemeOption = () => document.querySelector('.theme-option.is-active') || document.querySelector('.theme-option');

const optionLabel = (option) => option?.textContent?.trim() || '';
const optionIcon = (option) => {
  const icon = option?.querySelector('.flag-custom, .flag-emoji, .swatch-dot');
  return icon ? icon.outerHTML : '';
};

const createOptionButtons = (selector, type) => {
  return [...document.querySelectorAll(selector)].map((option) => {
    const value = option.dataset.languageOption || option.dataset.themeOption || '';
    const active = option.classList.contains('is-active') ? ' is-active' : '';
    return `<button class="mobile-menu-option${active}" type="button" data-mobile-${type}="${value}"><span>${optionLabel(option)}</span>${optionIcon(option)}</button>`;
  }).join('');
};

const createControlsMarkup = () => {
  const activeLanguage = getActiveLanguageOption();
  const activeTheme = getActiveThemeOption();

  return `
    <div class="mobile-menu-control" data-mobile-control="language">
      <button class="mobile-menu-control__trigger" type="button" data-mobile-control-trigger="language">
        <span class="mobile-menu-control__label"><small>Idioma</small><strong>Language</strong></span>
        <span class="mobile-menu-control__value">${optionIcon(activeLanguage)}${optionLabel(activeLanguage)}</span>
      </button>
      <div class="mobile-menu-control__menu">${createOptionButtons('.language-option', 'language')}</div>
    </div>
    <div class="mobile-menu-control" data-mobile-control="theme">
      <button class="mobile-menu-control__trigger" type="button" data-mobile-control-trigger="theme">
        <span class="mobile-menu-control__label"><small>Color</small><strong>Accent</strong></span>
        <span class="mobile-menu-control__value">${optionIcon(activeTheme)}${optionLabel(activeTheme)}</span>
      </button>
      <div class="mobile-menu-control__menu">${createOptionButtons('.theme-option', 'theme')}</div>
    </div>
  `;
};

const createMobileMenuDrawer = () => {
  if (document.querySelector('[data-mobile-vcard-trigger]')) return;

  const trigger = document.createElement('button');
  trigger.className = 'mobile-vcard-trigger';
  trigger.type = 'button';
  trigger.setAttribute('data-mobile-vcard-trigger', 'true');
  trigger.setAttribute('aria-label', 'Abrir menú');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = '<span aria-hidden="true"></span>';

  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-vcard-backdrop';
  backdrop.setAttribute('data-mobile-vcard-backdrop', 'true');
  backdrop.innerHTML = `
    <aside class="mobile-vcard-panel" role="dialog" aria-modal="true" aria-label="Menú de secciones">
      <header class="mobile-vcard-head">
        <div class="mobile-vcard-brand" aria-hidden="true"></div>
        <button class="mobile-vcard-close" type="button" data-mobile-vcard-close aria-label="Cerrar">×</button>
      </header>
      ${cloneNav()}
    </aside>
  `;

  document.body.append(trigger, backdrop);
};

const openMobileMenu = () => {
  document.body.classList.add('mobile-vcard-open');
  document.querySelector('[data-mobile-vcard-trigger]')?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
};

const closeMobileMenu = () => {
  document.body.classList.remove('mobile-vcard-open');
  document.querySelector('[data-mobile-vcard-trigger]')?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
};

const syncDrawerLanguage = () => {
  const backdrop = document.querySelector('[data-mobile-vcard-backdrop]');
  if (!backdrop) return;

  const oldNav = backdrop.querySelector('.mobile-vcard-nav');
  const newNavHtml = cloneNav();
  if (oldNav && newNavHtml) {
    const template = document.createElement('template');
    template.innerHTML = newNavHtml;
    oldNav.replaceWith(template.content.firstElementChild);
  }
};

const bindMobileMenuEvents = () => {
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-mobile-vcard-trigger]')) {
      event.preventDefault();
      if (document.body.classList.contains('mobile-vcard-open')) {
        closeMobileMenu();
      } else {
        syncDrawerLanguage();
        openMobileMenu();
      }
      return;
    }

    if (event.target.closest('[data-mobile-vcard-close]')) {
      event.preventDefault();
      closeMobileMenu();
      return;
    }

    const controlTrigger = event.target.closest('[data-mobile-control-trigger]');
    if (controlTrigger) {
      event.preventDefault();
      const control = controlTrigger.closest('.mobile-menu-control');
      document.querySelectorAll('.mobile-menu-control.is-open').forEach((node) => {
        if (node !== control) node.classList.remove('is-open');
      });
      control?.classList.toggle('is-open');
      return;
    }

    const languageOption = event.target.closest('[data-mobile-language]');
    if (languageOption) {
      event.preventDefault();
      document.querySelector(`.language-option[data-language-option="${languageOption.dataset.mobileLanguage}"]`)?.click();
      window.setTimeout(syncDrawerLanguage, 80);
      return;
    }

    const themeOption = event.target.closest('[data-mobile-theme]');
    if (themeOption) {
      event.preventDefault();
      document.querySelector(`.theme-option[data-theme-option="${themeOption.dataset.mobileTheme}"]`)?.click();
      window.setTimeout(syncDrawerLanguage, 80);
      return;
    }

    const backdrop = event.target.closest('[data-mobile-vcard-backdrop]');
    const panel = event.target.closest('.mobile-vcard-panel');
    if (backdrop && !panel) {
      closeMobileMenu();
      return;
    }

    const navButton = event.target.closest('.mobile-vcard-nav .nav-tab[data-target], .mobile-vcard-nav .gym-nav-link');
    if (navButton) {
      window.setTimeout(closeMobileMenu, 80);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMobileMenu();
  });

  window.addEventListener('alvrich:close-mobile-menu', closeMobileMenu);

  window.addEventListener('resize', () => {
    if (window.innerWidth > MOBILE_MENU_BREAKPOINT) closeMobileMenu();
  });
};

const observeLanguageChanges = () => {
  if (!document.body) return;

  const observer = new MutationObserver(() => {
    window.setTimeout(syncDrawerLanguage, 0);
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-language', 'data-theme'] });
};

const initMobileMenuDrawer = () => {
  document.body.classList.add('has-mobile-vcard-drawer');
  createMobileMenuDrawerStyles();
  createMobileMenuDrawer();
  bindMobileMenuEvents();
  observeLanguageChanges();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileMenuDrawer);
} else {
  initMobileMenuDrawer();
}
