'use strict';

const createMobileControlsCleanup = () => {
  if (document.querySelector('[data-mobile-controls-cleanup-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-mobile-controls-cleanup-style', 'true');
  style.textContent = `
    @media (max-width: 760px) {
      body.has-mobile-vcard-drawer .topbar {
        display: none !important;
      }

      .floating-controls .picker-trigger {
        justify-content: stretch;
      }

      .floating-controls .picker-trigger-main {
        width: 100%;
        display: grid;
        grid-template-columns: 2rem minmax(0, 1fr);
        align-items: center;
        gap: .72rem;
      }

      .floating-controls .picker-trigger-copy {
        width: 100%;
        min-width: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: .75rem;
      }

      .floating-controls .picker-trigger-label {
        justify-self: start;
        text-align: left;
      }

      .floating-controls .picker-trigger-current {
        justify-self: end;
        display: inline-flex;
        align-items: center;
        gap: .42rem;
        min-width: 0;
      }

      .floating-controls .picker-trigger-current .flag-custom,
      .floating-controls .picker-trigger-current .flag-emoji,
      .floating-controls .picker-trigger-dot {
        flex: 0 0 auto;
      }
    }
  `;

  document.head.appendChild(style);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createMobileControlsCleanup);
} else {
  createMobileControlsCleanup();
}
