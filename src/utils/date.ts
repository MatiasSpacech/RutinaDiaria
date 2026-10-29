import { format, isValid, parseISO, startOfDay, subMonths, subYears } from 'date-fns';
import { es } from 'date-fns/locale';

export type ChartRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export const chartRangeOptions: { label: string; value: ChartRange }[] = [
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1A', value: '1Y' },
  { label: 'Todo', value: 'ALL' },
];

export function parseDateSafe(iso: string): Date | null {
  const date = parseISO(iso);
  return isValid(date) ? date : null;
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function todayISODate(): string {
  return toISODate(new Date());
}

export function toLocalDateTime(date: Date, now = new Date()): string {
  return `${format(date, 'yyyy-MM-dd')}T${format(now, 'HH:mm:ss')}`;
}

export function formatDate(iso: string, pattern = "d 'de' MMM 'de' yyyy"): string {
  const date = parseDateSafe(iso);
  if (!date) return '—';
  return format(date, pattern, { locale: es });
}

export function formatDateShort(iso: string): string {
  return formatDate(iso, 'd MMM');
}

export function formatDateCompact(iso: string): string {
  return formatDate(iso, 'dd/MM');
}

export function formatDateLong(iso: string): string {
  return formatDate(iso, "EEEE d 'de' MMMM 'de' yyyy");
}

export function formatDateForTime(iso: string): string {
  const date = parseDateSafe(iso);
  if (!date) return '—';
  return format(date, "d MMM yyyy, HH:mm", { locale: es });
}

export function getRangeStart(range: ChartRange, now = new Date()): Date | null {
  switch (range) {
    case '1M':
      return startOfDay(subMonths(now, 1));
    case '3M':
      return startOfDay(subMonths(now, 3));
    case '6M':
      return startOfDay(subMonths(now, 6));
    case '1Y':
      return startOfDay(subYears(now, 1));
    case 'ALL':
      return null;
  }
}

export function isWithinRange(iso: string, range: ChartRange, now = new Date()): boolean {
  const date = parseDateSafe(iso);
  if (!date) return false;
  const start = getRangeStart(range, now);
  return start === null || date >= start;
}

export function isToday(isoDate: string, now = new Date()): boolean {
  return isoDate === toISODate(now);
}
