import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Inline SVG icons, as path data only. Stroke-based; colour and size come from
// CSS. Circles and rectangles are written as arcs so every icon is a list of
// paths.
const ICONS = {
  globe: ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z'],
  palette: [
    'M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7h2A4.6 4.6 0 0 0 21 10.6C21 6.4 17 3 12 3z',
    'M6.5 11.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M9.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M14 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
  ],
  chevron: ['M6 9l6 6 6-6'],
  sun: ['M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0', 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  moon: ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'],
  close: ['M6 6l12 12M18 6L6 18'],
  pin: ['M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z', 'M9.5 9.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0'],
  linkedin: ['M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3z', 'M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7'],
  mail: ['M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2z', 'M3 7l9 6 9-6'],
  download: ['M12 3v12m0 0l-5-5m5 5l5-5M4 21h16'],
  search: ['M4 11a7 7 0 1 0 14 0a7 7 0 1 0 -14 0', 'M20 20l-4-4'],
  instagram: ['M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4v-8a4 4 0 0 1 4 -4z', 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', 'M16.5 7.5v.01'],

  // Tabler icons (MIT) used by the "Off the clock" cards.
  barbell: ['M2 12h1M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1M9 12h6M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2M22 12h-1'],
  calendar: ['M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12zM16 3v4M8 3v4M4 11h16M9 16l2 2l4 -4'],
  sparkles: ['M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z'],
  calendarMonth: ['M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12zM16 3v4M8 3v4M4 11h16M7 14h.01M10 14h.01M13 14h.01M16 14h.01M7 17h.01M10 17h.01M13 17h.01'],
} as const;

export type IconName = keyof typeof ICONS;

/** <svg icon="globe"></svg> — no wrapper element, so CSS that styles "svg" still applies. */
@Component({
  selector: 'svg[icon]',
  template: `@for (d of paths(); track $index) { <svg:path [attr.d]="d" /> }`,
  host: { viewBox: '0 0 24 24', 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly icon = input.required<IconName>();
  protected readonly paths = computed(() => ICONS[this.icon()]);
}
