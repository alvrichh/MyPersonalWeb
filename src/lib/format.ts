// Dates and durations, written the way the active language writes them.

/** "2026-01" → months since year 0, so durations are simple subtraction. */
export const monthIndex = (value: string) => {
  const [year, month] = value.split('-').map(Number);
  return year * 12 + (month - 1);
};

export const thisMonth = () => {
  const today = new Date();
  return today.getFullYear() * 12 + today.getMonth();
};

export const formatMonth = (index: number, locale: string) =>
  new Date(Math.floor(index / 12), index % 12, 1).toLocaleDateString(locale, { month: 'short', year: 'numeric' });

/** Inclusive month count, the way LinkedIn shows it: Jan–Oct = 10 months. */
export const formatDuration = (months: number, locale: string) => {
  const unit = (name: 'year' | 'month', value: number) =>
    new Intl.NumberFormat(locale, { style: 'unit', unit: name, unitDisplay: 'long' }).format(value);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years && unit('year', years), rest && unit('month', rest)].filter(Boolean).join(' ');
};

/** "2026-10-13" → "13 Oct 2026" in the given locale. */
export const formatDay = (value: string, locale: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale, options);
};
