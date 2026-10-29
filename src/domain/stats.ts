import {
  addDays,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfWeek,
  subWeeks,
} from 'date-fns';

import { estimateOneRepMax } from '@/domain/calculations';
import type { Activity, ActivityType } from '@/domain/types';

export type StrengthSetRecord = {
  exerciseName: string;
  reps: number | null;
  weightKg: number | null;
  performedAt: string;
};

export type WeeklyBucket = {
  weekStart: string;
  label: string;
  sessions: number;
  minutes: number;
  distanceKm: number;
  volumeKg: number;
};

export type PersonalRecord = {
  exerciseName: string;
  bestWeightKg: number;
  bestWeightReps: number;
  bestWeightDate: string;
  bestOneRepMaxKg: number;
  bestOneRepMaxWeightKg: number;
  bestOneRepMaxReps: number;
  bestOneRepMaxDate: string;
  sets: number;
};

export type HeatmapDay = {
  date: string;
  count: number;
  isFuture: boolean;
};

export function buildWeeklyBuckets(
  activities: Activity[],
  sets: StrengthSetRecord[],
  weeks = 8,
  now = new Date(),
): WeeklyBucket[] {
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const buckets = new Map<string, WeeklyBucket>();

  for (let index = weeks - 1; index >= 0; index -= 1) {
    const weekStart = subWeeks(currentWeekStart, index);
    const key = format(weekStart, 'yyyy-MM-dd');
    buckets.set(key, {
      weekStart: key,
      label: format(weekStart, 'dd/MM'),
      sessions: 0,
      minutes: 0,
      distanceKm: 0,
      volumeKg: 0,
    });
  }

  function getBucket(iso: string): WeeklyBucket | undefined {
    const date = parseISO(iso);
    if (!isValid(date)) return undefined;
    const key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    return buckets.get(key);
  }

  for (const activity of activities) {
    const bucket = getBucket(activity.performedAt);
    if (!bucket) continue;
    bucket.sessions += 1;
    bucket.minutes += activity.durationMinutes;
    bucket.distanceKm += activity.distanceKm ?? 0;
  }

  for (const set of sets) {
    const bucket = getBucket(set.performedAt);
    if (!bucket) continue;
    if (set.reps && set.weightKg) {
      bucket.volumeKg += set.reps * set.weightKg;
    }
  }

  return Array.from(buckets.values());
}

export function calculatePersonalRecords(sets: StrengthSetRecord[]): PersonalRecord[] {
  const records = new Map<string, PersonalRecord>();

  for (const set of sets) {
    if (!set.reps || !set.weightKg || set.reps <= 0 || set.weightKg <= 0) continue;

    const current = records.get(set.exerciseName) ?? {
      exerciseName: set.exerciseName,
      bestWeightKg: 0,
      bestWeightReps: 0,
      bestWeightDate: set.performedAt,
      bestOneRepMaxKg: 0,
      bestOneRepMaxWeightKg: 0,
      bestOneRepMaxReps: 0,
      bestOneRepMaxDate: set.performedAt,
      sets: 0,
    };

    current.sets += 1;

    if (set.weightKg > current.bestWeightKg) {
      current.bestWeightKg = set.weightKg;
      current.bestWeightReps = set.reps;
      current.bestWeightDate = set.performedAt;
    }

    const estimated = estimateOneRepMax(set.weightKg, set.reps);
    if (estimated !== null && estimated > current.bestOneRepMaxKg) {
      current.bestOneRepMaxKg = estimated;
      current.bestOneRepMaxWeightKg = set.weightKg;
      current.bestOneRepMaxReps = set.reps;
      current.bestOneRepMaxDate = set.performedAt;
    }

    records.set(set.exerciseName, current);
  }

  return Array.from(records.values()).sort(
    (a, b) => b.bestOneRepMaxKg - a.bestOneRepMaxKg,
  );
}

export function buildHeatmapWeeks(
  activityDates: string[],
  weeks = 12,
  now = new Date(),
): HeatmapDay[][] {
  const today = startOfDay(now);
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const start = subWeeks(currentWeekStart, weeks - 1);
  const counts = new Map<string, number>();

  for (const iso of activityDates) {
    const date = parseISO(iso);
    if (!isValid(date)) continue;
    const key = format(date, 'yyyy-MM-dd');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: weeks }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(start, weekIndex * 7 + dayIndex);
      const key = format(date, 'yyyy-MM-dd');
      return {
        date: key,
        count: counts.get(key) ?? 0,
        isFuture: date > today,
      };
    }),
  );
}

export function countActivityTypes(activities: Activity[]): Record<ActivityType, number> {
  const counts: Record<ActivityType, number> = {
    strength: 0,
    walk: 0,
    hike: 0,
    cardio: 0,
    other: 0,
  };

  for (const activity of activities) {
    counts[activity.type] += 1;
  }

  return counts;
}
