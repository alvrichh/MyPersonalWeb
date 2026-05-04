'use strict';

const CUSTOM_LANGUAGE_OPTIONS = {
  fr: {
    label: 'Français',
    flagClass: 'flag-france',
  },
  ga: {
    label: 'Gaeilge',
    flagClass: 'flag-ireland',
  },
};

const LANGUAGE_OPTION_ORDER = ['en', 'es', 'de', 'fr', 'ru', 'pl', 'zh', 'ar', 'and', 'ga'];

const ensureLanguageReliabilityStyles = () => {
  if (document.querySelector('[data-language-reliability-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-language-reliability-style', 'true');
  style.textContent = `
    .flag-france {
      background-image: url('./images/flag-france.svg'), url('../images/flag-france.svg') !important;
    }

    .flag-ireland {
      background-image: url('./images/flag-ireland.svg'), url('../images/flag-ireland.svg') !important;
    }

    .language-picker .picker-menu {
      max-height: min(25rem, calc(100vh - 7rem)) !important;
      overflow-y: auto !important;
      overscroll-behavior: contain;
      scrollbar-width: thin;
    }

    .language-picker .picker-menu::-webkit-scrollbar {
      width: .35rem;
    }

    .language-picker .picker-menu::-webkit-scrollbar-thumb {
      border-radius: 999px;
      background: rgba(var(--accent-rgb), .42);
    }

    @media (max-width: 760px) {
      .language-picker .picker-menu {
        max-height: min(22rem, calc(100vh - 10rem)) !important;
      }

      .mobile-menu-control[data-mobile-control='language'] .mobile-menu-control__menu {
        max-height: min(23rem, calc(100vh - 14rem)) !important;
        overflow-y: auto !important;
        overscroll-behavior: contain;
      }
    }
  `;

  document.head.appendChild(style);
};

const customFlagMarkup = (option) => `<span class="flag-custom ${option.flagClass}" aria-hidden="true"></span>`;

const createCustomLanguageButton = (code) => {
  const option = CUSTOM_LANGUAGE_OPTIONS[code];
  const button = document.createElement('button');
  button.className = 'picker-option language-option';
  button.type = 'button';
  button.dataset.languageOption = code;
  button.setAttribute('aria-pressed', 'false');
  button.innerHTML = `
    ${customFlagMarkup(option)}
    <span>${option.label}</span>
  `;
  return button;
};

const ensureCustomLanguageOptions = () => {
  const languageMenu = document.querySelector('[data-language-menu]');
  if (!languageMenu) return;

  Object.keys(CUSTOM_LANGUAGE_OPTIONS).forEach((code) => {
    if (!languageMenu.querySelector(`[data-language-option="${code}"]`)) {
      languageMenu.appendChild(createCustomLanguageButton(code));
    }
  });
};

const orderLanguageOptions = () => {
  const languageMenu = document.querySelector('[data-language-menu]');
  if (!languageMenu) return;

  LANGUAGE_OPTION_ORDER.forEach((code) => {
    const option = languageMenu.querySelector(`[data-language-option="${code}"]`);
    if (option) languageMenu.appendChild(option);
  });
};

const updateCustomLanguageCurrentState = (code) => {
  const option = CUSTOM_LANGUAGE_OPTIONS[code];
  if (!option) return;

  document.body.dataset.language = code;
  document.documentElement.lang = code;

  document.querySelectorAll('.language-option').forEach((languageOption) => {
    const isCurrent = languageOption.dataset.languageOption === code;
    languageOption.classList.toggle('is-active', isCurrent);
    languageOption.setAttribute('aria-pressed', String(isCurrent));
  });

  document.querySelectorAll('[data-language-current]').forEach((label) => {
    label.textContent = option.label;
  });

  document.querySelectorAll('[data-language-current-flag]').forEach((flag) => {
    flag.className = `flag-custom ${option.flagClass}`;
    flag.textContent = '';
  });
};

const selectCustomLanguage = (code) => {
  const englishOption = document.querySelector('.language-option[data-language-option="en"]');
  englishOption?.click();
  window.requestAnimationFrame(() => updateCustomLanguageCurrentState(code));
};

const bindCustomLanguageOptions = () => {
  document.addEventListener('click', (event) => {
    const customOption = event.target.closest('[data-language-option="fr"], [data-language-option="ga"], [data-mobile-language="fr"], [data-mobile-language="ga"]');
    if (!customOption) return;

    event.preventDefault();
    event.stopPropagation();

    const code = customOption.dataset.languageOption || customOption.dataset.mobileLanguage;
    selectCustomLanguage(code);
  }, true);
};

const initLanguageOptionsOrder = () => {
  ensureLanguageReliabilityStyles();
  ensureCustomLanguageOptions();
  orderLanguageOptions();
  bindCustomLanguageOptions();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanguageOptionsOrder);
} else {
  initLanguageOptionsOrder();
}
