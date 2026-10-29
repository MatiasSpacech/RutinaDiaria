import {
  differenceInYears,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns';

import type {
  Activity,
  Measurement,
  StrengthSet,
  StrengthSetInput,
  UnitSystem,
} from '@/domain/types';

export type BmiTone = 'success' | 'warning' | 'danger' | 'info';

export type BmiClassification = {
  key: 'underweight' | 'normal' | 'overweight' | 'obesity1' | 'obesity2' | 'obesity3';
  label: string;
  tone: BmiTone;
};

export function calculateBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function classifyBmi(bmi: number | null): BmiClassification | null {
  if (bmi === null || Number.isNaN(bmi)) return null;
  if (bmi < 18.5) return { key: 'underweight', label: 'Bajo peso', tone: 'warning' };
  if (bmi < 25) return { key: 'normal', label: 'Peso normal', tone: 'success' };
  if (bmi < 30) return { key: 'overweight', label: 'Sobrepeso', tone: 'warning' };
  if (bmi < 35) return { key: 'obesity1', label: 'Obesidad grado I', tone: 'danger' };
  if (bmi < 40) return { key: 'obesity2', label: 'Obesidad grado II', tone: 'danger' };
  return { key: 'obesity3', label: 'Obesidad grado III', tone: 'danger' };
}

export function getHealthyWeightRange(heightCm: number | null): [number, number] | null {
  if (!heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return [18.5 * heightM * heightM, 24.9 * heightM * heightM];
}

export function calculateAge(birthDate: string | null, now = new Date()): number | null {
  if (!birthDate) return null;
  const parsed = parseISO(birthDate);
  if (!isValid(parsed)) return null;
  const age = differenceInYears(now, parsed);
  return age >= 0 ? age : null;
}

export function calculatePaceSecondsPerKm(
  distanceKm: number | null,
  durationMinutes: number | null,
): number | null {
  if (!distanceKm || !durationMinutes || distanceKm <= 0 || durationMinutes <= 0) return null;
  return (durationMinutes * 60) / distanceKm;
}

export function calculateSpeedKmh(
  distanceKm: number | null,
  durationMinutes: number | null,
): number | null {
  if (!distanceKm || !durationMinutes || distanceKm <= 0 || durationMinutes <= 0) return null;
  return distanceKm / (durationMinutes / 60);
}

export function formatPace(
  secondsPerKm: number | null,
  unitSystem: UnitSystem = 'metric',
): string {
  if (!secondsPerKm || secondsPerKm <= 0) return '—';
  const secondsPerUnit = unitSystem === 'imperial' ? secondsPerKm * 1.609344 : secondsPerKm;
  const minutes = Math.floor(secondsPerUnit / 60);
  const seconds = Math.round(secondsPerUnit % 60);
  const normalizedMinutes = seconds === 60 ? minutes + 1 : minutes;
  const normalizedSeconds = seconds === 60 ? 0 : seconds;
  const unit = unitSystem === 'metric' ? 'km' : 'mi';
  return `${normalizedMinutes}:${normalizedSeconds.toString().padStart(2, '0')} /${unit}`;
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null || Number.isNaN(minutes)) return '—';
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const remaining = total % 60;
  if (hours === 0) return `${remaining} min`;
  if (remaining === 0) return `${hours} h`;
  return `${hours} h ${remaining} min`;
}

export function formatTimerDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function calculateVolume(
  sets: (Pick<StrengthSet, 'reps' | 'weightKg'> | Pick<StrengthSetInput, 'reps' | 'weightKg'>)[],
): number {
  return sets.reduce((total, set) => {
    if (!set.reps || !set.weightKg || set.reps <= 0 || set.weightKg <= 0) return total;
    return total + set.reps * set.weightKg;
  }, 0);
}

export function estimateOneRepMax(weightKg: number | null, reps: number | null): number | null {
  if (!weightKg || !reps || weightKg <= 0 || reps <= 0) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function calculateStreak(activityDates: string[], now = new Date()): number {
  const activeDays = new Set(
    activityDates
      .map((value) => parseISO(value))
      .filter((date) => isValid(date))
      .map((date) => format(date, 'yyyy-MM-dd')),
  );

  let cursor = startOfDay(now);
  if (!activeDays.has(format(cursor, 'yyyy-MM-dd'))) {
    cursor = subDays(cursor, 1);
    if (!activeDays.has(format(cursor, 'yyyy-MM-dd'))) return 0;
  }

  let streak = 0;
  while (activeDays.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function isDateInWeek(date: Date, weekStart: Date): boolean {
  const start = startOfDay(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const target = startOfDay(date);
  return target >= start && target < end;
}

export function getLatestWeight(measurements: Measurement[]): number | null {
  const withWeight = measurements.filter((measurement) => measurement.weightKg !== null);
  if (withWeight.length === 0) return null;
  return withWeight[withWeight.length - 1].weightKg;
}

export function calculateWeightChange(measurements: Measurement[]): number | null {
  const withWeight = measurements.filter((measurement) => measurement.weightKg !== null);
  if (withWeight.length < 2) return null;
  return (withWeight[withWeight.length - 1].weightKg as number) - (withWeight[0].weightKg as number);
}

export function summarizeActivities(activities: Activity[]) {
  return activities.reduce(
    (totals, activity) => ({
      sessions: totals.sessions + 1,
      minutes: totals.minutes + activity.durationMinutes,
      distanceKm: totals.distanceKm + (activity.distanceKm ?? 0),
      elevationGainM: totals.elevationGainM + (activity.elevationGainM ?? 0),
    }),
    { sessions: 0, minutes: 0, distanceKm: 0, elevationGainM: 0 },
  );
}

export function kgToLb(kg: number): number {
  return kg * 2.2046226218;
}

export function lbToKg(lb: number): number {
  return lb / 2.2046226218;
}

export function cmToIn(cm: number): number {
  return cm / 2.54;
}

export function inToCm(inches: number): number {
  return inches * 2.54;
}

export function kmToMi(km: number): number {
  return km / 1.609344;
}

export function miToKm(mi: number): number {
  return mi * 1.609344;
}

export function mToFt(meters: number): number {
  return meters * 3.280839895;
}

export function ftToM(feet: number): number {
  return feet / 3.280839895;
}

export function elevationUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'metric' ? 'm' : 'ft';
}

export function formatElevation(
  elevationM: number | null,
  unitSystem: UnitSystem,
): string {
  if (elevationM === null) return '—';
  const value = unitSystem === 'metric' ? elevationM : mToFt(elevationM);
  return Math.round(value).toString();
}

export function volumeUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'metric' ? 'kg' : 'lb';
}

export function formatWeight(weightKg: number | null, unitSystem: UnitSystem): string {
  if (weightKg === null) return '—';
  const value = unitSystem === 'metric' ? weightKg : kgToLb(weightKg);
  return value.toFixed(1);
}

export function weightUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'metric' ? 'kg' : 'lb';
}

export function formatDistance(distanceKm: number | null, unitSystem: UnitSystem): string {
  if (distanceKm === null) return '—';
  const value = unitSystem === 'metric' ? distanceKm : kmToMi(distanceKm);
  return value.toFixed(2);
}

export function distanceUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'metric' ? 'km' : 'mi';
}

export function formatMeasure(cm: number | null, unitSystem: UnitSystem): string {
  if (cm === null) return '—';
  const value = unitSystem === 'metric' ? cm : cmToIn(cm);
  return value.toFixed(1);
}

export function measureUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'metric' ? 'cm' : 'in';
}

export function formatBmiValue(bmi: number | null): string {
  return bmi === null ? '—' : bmi.toFixed(1);
}
