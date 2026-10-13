import type { MessageKey } from '../i18n/i18n';

/** The home page sections the header tabs point to. */
export const NAV: { id: string; label: MessageKey }[] = [
  { id: 'about', label: 'nav.about' },
  { id: 'work', label: 'nav.work' },
  { id: 'experience', label: 'nav.experience' },
  { id: 'skills', label: 'nav.skills' },
  { id: 'contact', label: 'nav.contact' },
];
