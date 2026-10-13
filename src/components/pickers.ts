import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, afterNextRender, inject, input, signal } from '@angular/core';
import { ACCENTS, I18n, LANGUAGES, type Accent } from '../i18n/i18n';
import { Preferences } from '../lib/preferences';
import { Icon } from './icon';

// A trigger with a dropdown of options. Closes on outside click and Escape,
// and moves focus to the selected option when it opens. The icon, the current
// value and the options are projected in.
@Component({
  selector: '[appPicker]',
  exportAs: 'appPicker',
  imports: [Icon],
  host: { class: 'picker', '[class.is-open]': 'open()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      #trigger
      class="picker-trigger"
      type="button"
      aria-haspopup="true"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="menuId()"
      [attr.aria-label]="label()"
      (click)="toggle()"
    >
      <span class="picker-trigger-icon" aria-hidden="true"><ng-content select="[pickerIcon]" /></span>
      <ng-content select="[pickerCurrent]" />
      <span class="picker-trigger-copy">
        <span class="picker-trigger-label">{{ label() }}</span>
        <span class="picker-trigger-current">{{ currentName() }}</span>
      </span>
      <svg icon="chevron" class="picker-chevron"></svg>
    </button>
    <div class="picker-menu" [id]="menuId()" [hidden]="!open()">
      <ng-content />
    </div>
  `,
})
export class Picker {
  readonly menuId = input.required<string>();
  readonly label = input.required<string>();
  readonly currentName = input.required<string>();

  protected readonly open = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private removeListeners?: () => void;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.removeListeners?.());
  }

  toggle() {
    if (this.open()) this.close();
    else this.show();
  }

  close(returnFocus = false) {
    this.open.set(false);
    this.removeListeners?.();
    this.removeListeners = undefined;
    if (returnFocus) this.host.querySelector<HTMLElement>('.picker-trigger')?.focus();
  }

  private show() {
    this.open.set(true);
    afterNextRender(() => this.host.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus(), { injector: this.injector });

    const onClick = (event: MouseEvent) => {
      if (!this.host.contains(event.target as Node)) this.close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') this.close(true);
    };
    // Wait for this click to finish, or it would count as an outside click.
    setTimeout(() => document.addEventListener('click', onClick));
    document.addEventListener('keydown', onKey);
    this.removeListeners = () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }
}

@Component({
  selector: 'app-language-picker',
  imports: [Picker, Icon],
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div appPicker #picker="appPicker" menuId="language-menu" [label]="i18n.t('controls.language')" [currentName]="i18n.lang().label">
      <svg pickerIcon icon="globe"></svg>
      <img pickerCurrent class="flag" [src]="'./images/flag-' + i18n.lang().flag + '.svg'" alt="" width="20" height="14" />
      @for (option of languages; track option.code) {
        <button
          type="button"
          class="picker-option"
          [attr.lang]="option.htmlLang"
          [attr.aria-pressed]="option.code === i18n.lang().code"
          (click)="i18n.setLang(option.code); picker.close()"
        >
          <img class="flag" [src]="'./images/flag-' + option.flag + '.svg'" alt="" width="20" height="14" />
          <span>{{ option.label }}</span>
        </button>
      }
    </div>
  `,
})
export class LanguagePicker {
  protected readonly i18n = inject(I18n);
  protected readonly languages = LANGUAGES;
}

@Component({
  selector: 'app-accent-picker',
  imports: [Picker, Icon],
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div appPicker #picker="appPicker" menuId="accent-menu" [label]="i18n.t('controls.accent')" [currentName]="i18n.t('theme.' + prefs.accent())">
      <svg pickerIcon icon="palette"></svg>
      <span pickerCurrent class="swatch-dot" aria-hidden="true"></span>
      @for (option of accents; track option) {
        <button
          type="button"
          class="picker-option"
          [attr.aria-pressed]="option === prefs.accent()"
          (click)="choose(option); picker.close()"
        >
          <!-- Each swatch previews its own accent. -->
          <span class="swatch-dot" [attr.data-accent]="option"></span>
          <span>{{ i18n.t('theme.' + option) }}</span>
        </button>
      }
    </div>
  `,
})
export class AccentPicker {
  protected readonly i18n = inject(I18n);
  protected readonly prefs = inject(Preferences);
  protected readonly accents = ACCENTS;

  protected choose(accent: Accent) {
    this.prefs.setAccent(accent);
  }
}
