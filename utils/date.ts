export const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDateKeyInTimeZone = (date: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
};

export const getTodayISTKey = (): string => getDateKeyInTimeZone(new Date(), 'Asia/Kolkata');

export const fromDateKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Mandatory company holidays for 2026 from admin-provided calendar.
export const MANDATORY_HOLIDAY_KEYS_2026 = new Set<string>([
  '2026-01-01', // New Year
  '2026-01-26', // Republic Day
  '2026-03-04', // Holi
  '2026-05-01', // May Day / Buddha Pournima
  '2026-09-14', // Ganesh Chaturthi
  '2026-10-02', // Gandhi Jayanti
  '2026-10-21', // Dussehra / Vijaya Dashami
  '2026-11-09', // Diwali
  '2026-12-25', // Christmas
]);

export const isMandatoryHoliday = (date: Date): boolean =>
  MANDATORY_HOLIDAY_KEYS_2026.has(toDateKey(date));

export const isNonWorkingDay = (date: Date): boolean =>
  isWeekend(date) || isMandatoryHoliday(date);

export const isSameMonth = (a: Date, b: Date): boolean =>
  a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

export const monthStart = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const monthEnd = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const addMonths = (date: Date, months: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

export const eachDay = (start: Date, end: Date): Date[] => {
  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

export const getMonthLabel = (date: Date): string =>
  date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

export const clampDate = (date: Date, min: Date, max: Date): Date => {
  if (date < min) return min;
  if (date > max) return max;
  return date;
};
