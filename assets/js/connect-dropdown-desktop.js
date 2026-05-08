'use strict';

const ensureConnectDropdownStyles = () => {
  if (document.querySelector('[data-connect-dropdown-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-connect-dropdown-style', 'true');
  style.textContent = `
    .connect-dropdown {
      display: grid;
      gap: .72rem;
    }

    .connect-dropdown-trigger {
      width: 100%;
      min-height: 3.35rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .75rem;
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 1.1rem;
      padding: .82rem .95rem;
      color: var(--text, #fff);
      background:
        radial-gradient(circle at 12% 0%, rgba(112,225,161,.16), transparent 38%),
        linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.035));
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 18px 42px rgba(0,0,0,.14);
      cursor: pointer;
      transition: transform .18s ease, border-color .18s ease, background .18s ease;
    }

    .connect-dropdown-trigger:hover,
    .connect-dropdown-trigger:focus-visible {
      transform: translateY(-1px);
      border-color: rgba(112,225,161,.34);
      background:
        radial-gradient(circle at 12% 0%, rgba(112,225,161,.22), transparent 38%),
        linear-gradient(135deg, rgba(255,255,255,.095), rgba(255,255,255,.045));
    }

    .connect-dropdown-title {
      display: inline-flex;
      align-items: center;
      gap: .58rem;
      font-size: .96rem;
      font-weight: 900;
      letter-spacing: -.01em;
    }

    .connect-dropdown-title::before {
      content: "";
      width: .58rem;
      height: .58rem;
      border-radius: 999px;
      background: var(--accent, #70e1a1);
      box-shadow: 0 0 0 6px rgba(112,225,161,.12);
    }

    .connect-dropdown-chevron {
      display: inline-grid;
      place-items: center;
      opacity: .75;
      transition: transform .2s ease;
    }

    .connect-dropdown.is-open .connect-dropdown-chevron {
      transform: rotate(180deg);
    }

    @media (min-width: 1024px) {
      .connect-dropdown .meta-list {
        display: grid;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        margin: 0;
        transform: translateY(-.35rem);
        transition: max-height .28s ease, opacity .22s ease, transform .22s ease, margin .22s ease;
      }

      .connect-dropdown.is-open .meta-list {
        max-height: 28rem;
        opacity: 1;
        margin-top: .05rem;
        transform: translateY(0);
      }
    }

    @media (max-width: 1023px) {
      .connect-dropdown-trigger {
        display: none;
      }

      .connect-dropdown .meta-list {
        display: grid;
      }
    }
  `;

  document.head.appendChild(style);
};

const createConnectDropdown = () => {
  const sidebarPanel = document.querySelector('.sidebar-panel');
  const metaList = sidebarPanel?.querySelector('.meta-list');
  if (!sidebarPanel || !metaList || document.querySelector('[data-connect-dropdown]')) return;

  const dropdown = document.createElement('div');
  dropdown.className = 'connect-dropdown';
  dropdown.setAttribute('data-connect-dropdown', 'true');

  const trigger = document.createElement('button');
  trigger.className = 'connect-dropdown-trigger';
  trigger.type = 'button';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = `
    <span class="connect-dropdown-title">Let&rsquo;s Connect!</span>
    <span class="connect-dropdown-chevron" aria-hidden="true">
      <ion-icon name="chevron-down-outline"></ion-icon>
    </span>
  `;

  metaList.insertAdjacentElement('beforebegin', dropdown);
  dropdown.appendChild(trigger);
  dropdown.appendChild(metaList);

  trigger.addEventListener('click', () => {
    const isOpen = dropdown.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', String(isOpen));
  });
};

const initConnectDropdown = () => {
  ensureConnectDropdownStyles();
  createConnectDropdown();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initConnectDropdown);
} else {
  initConnectDropdown();
}
