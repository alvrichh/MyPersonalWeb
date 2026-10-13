import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ACCENTS, LANGUAGES, useI18n, type Accent, type MessageKey } from '../i18n/I18nContext';
import { ChevronIcon, GlobeIcon, PaletteIcon } from './icons';

type PickerProps = {
  id: string;
  label: string;
  icon: ReactNode;
  current: ReactNode;
  currentName: string;
  children: (close: () => void) => ReactNode;
};

// A trigger with a dropdown of options. Closes on outside click and Escape,
// and moves focus to the selected option when it opens.
function Picker({ id, label, icon, current, currentName, children }: PickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    ref.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus();
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`picker${open ? ' is-open' : ''}`} ref={ref}>
      <button
        ref={triggerRef}
        className="picker-trigger"
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="picker-trigger-icon" aria-hidden="true">{icon}</span>
        {current}
        <span className="picker-trigger-copy">
          <span className="picker-trigger-label">{label}</span>
          <span className="picker-trigger-current">{currentName}</span>
        </span>
        <ChevronIcon />
      </button>
      <div className="picker-menu" id={id} hidden={!open}>
        {children(() => setOpen(false))}
      </div>
    </div>
  );
}

export function LanguagePicker() {
  const { lang, setLang, t } = useI18n();
  return (
    <Picker
      id="language-menu"
      label={t('controls.language')}
      icon={<GlobeIcon />}
      current={<img className="flag" src={`./images/flag-${lang.flag}.svg`} alt="" width={20} height={14} />}
      currentName={lang.label}
    >
      {(close) => LANGUAGES.map((option) => (
        <button
          key={option.code}
          type="button"
          className="picker-option"
          lang={option.htmlLang}
          aria-pressed={option.code === lang.code}
          onClick={() => { setLang(option.code); close(); }}
        >
          <img className="flag" src={`./images/flag-${option.flag}.svg`} alt="" width={20} height={14} />
          <span>{option.label}</span>
        </button>
      ))}
    </Picker>
  );
}

export function AccentPicker({ accent, setAccent }: { accent: Accent; setAccent: (accent: Accent) => void }) {
  const { t } = useI18n();
  return (
    <Picker
      id="accent-menu"
      label={t('controls.accent')}
      icon={<PaletteIcon />}
      current={<span className="swatch-dot" aria-hidden="true" />}
      currentName={t(`theme.${accent}` as MessageKey)}
    >
      {(close) => ACCENTS.map((option) => (
        <button
          key={option}
          type="button"
          className="picker-option"
          aria-pressed={option === accent}
          onClick={() => { setAccent(option); close(); }}
        >
          {/* Each swatch previews its own accent. */}
          <span className="swatch-dot" data-accent={option} />
          <span>{t(`theme.${option}` as MessageKey)}</span>
        </button>
      ))}
    </Picker>
  );
}
