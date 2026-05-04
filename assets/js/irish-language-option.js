'use strict';

const IRISH_LANGUAGE_CODE = 'ga';
const IRISH_LANGUAGE_LABEL = 'Gaeilge';
const IRISH_LANGUAGE_FLAG = '🇮🇪';

const createIrishLanguageButton = () => {
  const button = document.createElement('button');
  button.className = 'picker-option language-option';
  button.type = 'button';
  button.dataset.languageOption = IRISH_LANGUAGE_CODE;
  button.setAttribute('aria-pressed', 'false');
  button.innerHTML = `
    <span class="flag-emoji" aria-hidden="true">${IRISH_LANGUAGE_FLAG}</span>
    <span>${IRISH_LANGUAGE_LABEL}</span>
  `;
  return button;
};

const ensureIrishLanguageOption = () => {
  const languageMenu = document.querySelector('[data-language-menu]');
  if (!languageMenu || languageMenu.querySelector(`[data-language-option="${IRISH_LANGUAGE_CODE}"]`)) return;

  const arabicOption = languageMenu.querySelector('[data-language-option="ar"]');
  const andalusianOption = languageMenu.querySelector('[data-language-option="and"]');
  const button = createIrishLanguageButton();

  languageMenu.insertBefore(button, arabicOption || andalusianOption || null);
};

const updateIrishCurrentState = () => {
  document.body.dataset.language = IRISH_LANGUAGE_CODE;
  document.documentElement.lang = IRISH_LANGUAGE_CODE;

  document.querySelectorAll('.language-option').forEach((option) => {
    const isIrish = option.dataset.languageOption === IRISH_LANGUAGE_CODE;
    option.classList.toggle('is-active', isIrish);
    option.setAttribute('aria-pressed', String(isIrish));
  });

  document.querySelectorAll('[data-language-current]').forEach((label) => {
    label.textContent = IRISH_LANGUAGE_LABEL;
  });

  document.querySelectorAll('[data-language-current-flag]').forEach((flag) => {
    flag.className = 'flag-emoji';
    flag.textContent = IRISH_LANGUAGE_FLAG;
  });
};

const selectIrishLanguage = () => {
  const englishOption = document.querySelector('.language-option[data-language-option="en"]');
  englishOption?.click();
  window.requestAnimationFrame(updateIrishCurrentState);
};

const bindIrishLanguageOption = () => {
  document.addEventListener('click', (event) => {
    const irishOption = event.target.closest(`[data-language-option="${IRISH_LANGUAGE_CODE}"], [data-mobile-language="${IRISH_LANGUAGE_CODE}"]`);
    if (!irishOption) return;

    event.preventDefault();
    event.stopPropagation();
    selectIrishLanguage();
  }, true);
};

const initIrishLanguageOption = () => {
  ensureIrishLanguageOption();
  bindIrishLanguageOption();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIrishLanguageOption);
} else {
  initIrishLanguageOption();
}
