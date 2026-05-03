'use strict';

const MOBILE_VCARD_BREAKPOINT = 760;

const createMobileVcardDrawerStyles = () => {
  if (document.querySelector('[data-mobile-vcard-drawer-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-mobile-vcard-drawer-style', 'true');
  style.textContent = `
    .mobile-vcard-trigger,
    .mobile-vcard-backdrop {
      display: none;
    }

    @media (max-width: 760px) {
      body.has-mobile-vcard-drawer .sidebar.card {
        display: none;
      }

      .mobile-vcard-trigger {
        position: fixed;
        top: max(.72rem, env(safe-area-inset-top));
        right: max(.72rem, env(safe-area-inset-right));
        z-index: 150;
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
      }

      .mobile-vcard-trigger span {
        position: relative;
        width: 1.24rem;
        height: 2px;
        border-radius: 999px;
        background: currentColor;
        transition: background .18s ease;
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
        transition: transform .18s ease, top .18s ease;
      }

      .mobile-vcard-trigger span::before { top: -.46rem; }
      .mobile-vcard-trigger span::after { top: .46rem; }

      body.mobile-vcard-open .mobile-vcard-trigger span {
        background: transparent;
      }

      body.mobile-vcard-open .mobile-vcard-trigger span::before {
        top: 0;
        transform: rotate(45deg);
      }

      body.mobile-vcard-open .mobile-vcard-trigger span::after {
        top: 0;
        transform: rotate(-45deg);
      }

      .mobile-vcard-backdrop {
        position: fixed;
        inset: 0;
        z-index: 140;
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
        max-height: calc(100vh - 1.8rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));
        margin-left: auto;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
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
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1rem .85rem;
        border-bottom: 1px solid rgba(255,255,255,.1);
      }

      .mobile-vcard-brand {
        display: inline-flex;
        align-items: center;
        gap: .75rem;
        min-width: 0;
      }

      .mobile-vcard-brand-mark {
        width: 2.55rem;
        height: 2.55rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 17px;
        font-family: var(--font-display);
        font-weight: 900;
        text-transform: uppercase;
        color: var(--accent-strong);
        background: linear-gradient(135deg, rgba(var(--accent-rgb), .24), rgba(var(--secondary-rgb), .14));
      }

      .mobile-vcard-brand-copy {
        display: grid;
        min-width: 0;
      }

      .mobile-vcard-brand-copy strong {
        font-family: var(--font-display);
        font-size: 1rem;
      }

      .mobile-vcard-brand-copy span {
        color: var(--text-soft);
        font-size: .78rem;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .mobile-vcard-close {
        width: 2.55rem;
        height: 2.55rem;
        flex: 0 0 auto;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 16px;
        color: var(--text);
        background: rgba(255,255,255,.055);
        font-size: 1.35rem;
        font-weight: 900;
      }

      .mobile-vcard-scroll {
        min-height: 0;
        overflow: auto;
        overscroll-behavior: contain;
        padding: 1rem;
      }

      .mobile-vcard-scroll::-webkit-scrollbar {
        width: 0;
      }

      .mobile-vcard-content .sidebar {
        display: block !important;
        padding: 0;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        background: transparent;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        animation: none;
      }

      .mobile-vcard-content .profile-block {
        gap: 1rem;
      }

      .mobile-vcard-content .avatar-wrap {
        width: 132px;
      }

      .mobile-vcard-content .contact-toggle {
        display: none;
      }

      .mobile-vcard-content .sidebar-panel {
        max-height: none !important;
        opacity: 1 !important;
        overflow: visible !important;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255,255,255,.1);
      }

      .mobile-vcard-content .sidebar-panel[hidden] {
        display: block !important;
      }

      .mobile-vcard-nav {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: .6rem;
        padding: 0 1rem 1rem;
        border-top: 1px solid rgba(255,255,255,.1);
      }

      .mobile-vcard-nav .nav-tab,
      .mobile-vcard-nav .gym-nav-link {
        width: 100%;
        justify-content: center;
        padding: .78rem .7rem;
        font-size: .86rem;
      }
    }
  `;

  document.head.appendChild(style);
};

const cloneSidebar = () => {
  const sidebar = document.querySelector('.sidebar.card');
  if (!sidebar) return '';

  const clone = sidebar.cloneNode(true);
  clone.removeAttribute('data-sidebar');
  clone.classList.remove('is-open');

  clone.querySelectorAll('[id]').forEach((node) => {
    node.id = `mobile-vcard-${node.id}`;
  });

  const panel = clone.querySelector('[data-sidebar-panel]');
  if (panel) {
    panel.hidden = false;
    panel.removeAttribute('data-sidebar-panel');
  }

  clone.querySelector('[data-sidebar-toggle]')?.remove();

  return clone.outerHTML;
};

const cloneNav = () => {
  const nav = document.querySelector('.section-nav');
  if (!nav) return '';

  const clone = nav.cloneNode(true);
  clone.className = 'mobile-vcard-nav';
  clone.removeAttribute('data-i18n');
  clone.removeAttribute('data-i18n-attr');
  clone.setAttribute('aria-label', 'Mobile menu sections');

  clone.querySelectorAll('[aria-pressed]').forEach((button) => {
    button.setAttribute('aria-pressed', 'false');
  });

  return clone.outerHTML;
};

const createMobileVcardDrawer = () => {
  if (document.querySelector('[data-mobile-vcard-trigger]')) return;

  const trigger = document.createElement('button');
  trigger.className = 'mobile-vcard-trigger';
  trigger.type = 'button';
  trigger.setAttribute('data-mobile-vcard-trigger', 'true');
  trigger.setAttribute('aria-label', 'Abrir vCard');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = '<span aria-hidden="true"></span>';

  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-vcard-backdrop';
  backdrop.setAttribute('data-mobile-vcard-backdrop', 'true');
  backdrop.innerHTML = `
    <aside class="mobile-vcard-panel" role="dialog" aria-modal="true" aria-label="vCard de Alvaro Molina">
      <header class="mobile-vcard-head">
        <div class="mobile-vcard-brand">
          <span class="mobile-vcard-brand-mark">am</span>
          <span class="mobile-vcard-brand-copy">
            <strong>alvrich</strong>
            <span>portfolio / vcard</span>
          </span>
        </div>
        <button class="mobile-vcard-close" type="button" data-mobile-vcard-close aria-label="Cerrar">×</button>
      </header>
      <div class="mobile-vcard-scroll">
        <div class="mobile-vcard-content">${cloneSidebar()}</div>
      </div>
      ${cloneNav()}
    </aside>
  `;

  document.body.append(trigger, backdrop);
};

const openMobileVcard = () => {
  document.body.classList.add('mobile-vcard-open');
  document.querySelector('[data-mobile-vcard-trigger]')?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
};

const closeMobileVcard = () => {
  document.body.classList.remove('mobile-vcard-open');
  document.querySelector('[data-mobile-vcard-trigger]')?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
};

const syncDrawerLanguage = () => {
  const backdrop = document.querySelector('[data-mobile-vcard-backdrop]');
  if (!backdrop) return;

  const content = backdrop.querySelector('.mobile-vcard-content');
  if (content) content.innerHTML = cloneSidebar();

  const oldNav = backdrop.querySelector('.mobile-vcard-nav');
  const newNavHtml = cloneNav();
  if (oldNav && newNavHtml) {
    const template = document.createElement('template');
    template.innerHTML = newNavHtml;
    oldNav.replaceWith(template.content.firstElementChild);
  }
};

const bindMobileVcardEvents = () => {
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-mobile-vcard-trigger]')) {
      openMobileVcard();
      return;
    }

    if (event.target.closest('[data-mobile-vcard-close]')) {
      closeMobileVcard();
      return;
    }

    const backdrop = event.target.closest('[data-mobile-vcard-backdrop]');
    const panel = event.target.closest('.mobile-vcard-panel');
    if (backdrop && !panel) {
      closeMobileVcard();
      return;
    }

    const navButton = event.target.closest('.mobile-vcard-nav .nav-tab[data-target]');
    if (navButton) {
      closeMobileVcard();
    }

    const drawerLink = event.target.closest('.mobile-vcard-content a');
    if (drawerLink && drawerLink.href) {
      closeMobileVcard();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMobileVcard();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > MOBILE_VCARD_BREAKPOINT) closeMobileVcard();
  });
};

const observeLanguageChanges = () => {
  if (!document.body) return;

  const observer = new MutationObserver(() => {
    window.setTimeout(syncDrawerLanguage, 0);
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-language'] });
};

const initMobileVcardDrawer = () => {
  document.body.classList.add('has-mobile-vcard-drawer');
  createMobileVcardDrawerStyles();
  createMobileVcardDrawer();
  bindMobileVcardEvents();
  observeLanguageChanges();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileVcardDrawer);
} else {
  initMobileVcardDrawer();
}
