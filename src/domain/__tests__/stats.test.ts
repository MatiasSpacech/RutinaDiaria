import {
  buildHeatmapWeeks,
  buildWeeklyBuckets,
  calculatePersonalRecords,
  countActivityTypes,
  type StrengthSetRecord,
} from '@/domain/stats';
import type { Activity, ActivityType } from '@/domain/types';

function activity(
  id: number,
  type: ActivityType,
  performedAt: string,
  durationMinutes: number,
  distanceKm: number | null = null,
): Activity {
  return {
    id,
    type,
    title: `${type}-${id}`,
    performedAt,
    durationMinutes,
    distanceKm,
    elevationGainM: null,
    terrain: null,
    rpe: null,
    notes: null,
    routineId: null,
    roundsCompleted: null,
    details: null,
    createdAt: performedAt,
    updatedAt: performedAt,
  };
}

const activities: Activity[] = [
  activity(1, 'strength', '2026-10-27T10:00:00', 45),
  activity(2, 'walk', '2026-10-27T18:00:00', 30, 6),
  activity(3, 'hike', '2026-10-20T08:00:00', 120, 10),
  activity(4, 'cardio', '2026-09-01T08:00:00', 30, 4),
];

const sets: StrengthSetRecord[] = [
  { exerciseName: 'Press de banca', reps: 10, weightKg: 60, performedAt: '2026-10-27T10:00:00' },
  { exerciseName: 'Press de banca', reps: 10, weightKg: 60, performedAt: '2026-10-27T10:10:00' },
  { exerciseName: 'Press de banca', reps: 8, weightKg: 80, performedAt: '2026-10-27T10:20:00' },
  { exerciseName: 'Sentadilla', reps: 5, weightKg: 100, performedAt: '2026-10-20T08:00:00' },
];

describe('agregados semanales', () => {
  it('agrupa las últimas semanas con sesiones, minutos y volumen', () => {
    const buckets = buildWeeklyBuckets(activities, sets, 2, new Date(2026, 9, 29));

    expect(buckets).toHaveLength(2);
    expect(buckets[1].weekStart).toBe('2026-10-26');
    expect(buckets[1].sessions).toBe(2);
    expect(buckets[1].minutes).toBe(75);
    expect(buckets[1].distanceKm).toBe(6);
    expect(buckets[1].volumeKg).toBe(1840);

    expect(buckets[0].weekStart).toBe('2026-10-19');
    expect(buckets[0].sessions).toBe(1);
    expect(buckets[0].volumeKg).toBe(500);
  });
});

describe('récords personales', () => {
  it('calcula el mejor peso y el mejor 1RM estimado por ejercicio', () => {
    const records = calculatePersonalRecords(sets);

    expect(records).toHaveLength(2);
    expect(records[0].exerciseName).toBe('Sentadilla');
    expect(records[0].bestOneRepMaxKg).toBeCloseTo(116.67, 1);

    const bench = records.find((record) => record.exerciseName === 'Press de banca');
    expect(bench?.bestWeightKg).toBe(80);
    expect(bench?.bestWeightReps).toBe(8);
    expect(bench?.bestOneRepMaxKg).toBeCloseTo(101.33, 1);
    expect(bench?.sets).toBe(3);
  });
});

describe('heatmap y tipos', () => {
  it('cuenta actividades por día en la grilla de 12 semanas', () => {
    const weeks = buildHeatmapWeeks(
      activities.map((item) => item.performedAt),
      12,
      new Date(2026, 9, 29),
    );
    const days = weeks.flat();

    expect(weeks).toHaveLength(12);
    expect(days).toHaveLength(84);
    expect(days.find((day) => day.date === '2026-10-27')?.count).toBe(2);
    expect(days.find((day) => day.date === '2026-10-20')?.count).toBe(1);
    expect(days.find((day) => day.date === '2026-10-30')?.isFuture).toBe(true);
    expect(days.find((day) => day.date === '2026-10-27')?.isFuture).toBe(false);
  });

  it('cuenta actividades por tipo', () => {
    expect(countActivityTypes(activities)).toEqual({
      strength: 1,
      walk: 1,
      hike: 1,
      cardio: 1,
      other: 0,
    });
  });
});
