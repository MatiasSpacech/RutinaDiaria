export function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatInputNumber(value: number | null, decimals = 1): string {
  if (value === null) return '';
  return Number.isInteger(value) ? String(value) : value.toFixed(decimals).replace(/\.?0+$/, '');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatSigned(value: number | null, decimals = 1, unit = ''): string {
  if (value === null) return '—';
  const rounded = Math.abs(value) < 0.05 ? 0 : value;
  const sign = rounded > 0 ? '+' : '';
  const suffix = unit ? ` ${unit}` : '';
  return `${sign}${rounded.toFixed(decimals)}${suffix}`;
}
