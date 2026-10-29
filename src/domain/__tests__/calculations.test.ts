import {
  calculateAge,
  calculateBmi,
  calculatePaceSecondsPerKm,
  calculateStreak,
  calculateVolume,
  calculateWeightChange,
  classifyBmi,
  estimateOneRepMax,
  formatDuration,
  formatPace,
  getHealthyWeightRange,
  summarizeActivities,
} from '@/domain/calculations';
import type { Activity, Measurement } from '@/domain/types';

function daysAgo(days: number): string {
  const date = new Date(2026, 9, 29, 12, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

describe('IMC', () => {
  it('calcula el IMC con peso y altura', () => {
    expect(calculateBmi(70, 175)).toBeCloseTo(22.86, 2);
  });

  it('devuelve null con datos inválidos', () => {
    expect(calculateBmi(null, 175)).toBeNull();
    expect(calculateBmi(70, 0)).toBeNull();
  });

  it('clasifica los rangos de la OMS', () => {
    expect(classifyBmi(18.4)?.key).toBe('underweight');
    expect(classifyBmi(18.5)?.key).toBe('normal');
    expect(classifyBmi(25)?.key).toBe('overweight');
    expect(classifyBmi(30)?.key).toBe('obesity1');
    expect(classifyBmi(35)?.key).toBe('obesity2');
    expect(classifyBmi(40)?.key).toBe('obesity3');
    expect(classifyBmi(null)).toBeNull();
  });

  it('calcula el rango de peso saludable', () => {
    const range = getHealthyWeightRange(170);
    expect(range?.[0]).toBeCloseTo(53.47, 1);
    expect(range?.[1]).toBeCloseTo(71.96, 1);
  });
});

describe('ritmo y duración', () => {
  it('calcula el ritmo en segundos por kilómetro', () => {
    expect(calculatePaceSecondsPerKm(5, 30)).toBe(360);
    expect(calculatePaceSecondsPerKm(0, 30)).toBeNull();
  });

  it('formatea el ritmo en métrico e imperial', () => {
    expect(formatPace(360)).toBe('6:00 /km');
    expect(formatPace(360, 'imperial')).toBe('9:39 /mi');
    expect(formatPace(null)).toBe('—');
  });

  it('formatea duraciones', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(90)).toBe('1 h 30 min');
    expect(formatDuration(120)).toBe('2 h');
    expect(formatDuration(0)).toBe('0 min');
  });
});

describe('fuerza', () => {
  it('suma el volumen de las series válidas', () => {
    expect(
      calculateVolume([
        { reps: 10, weightKg: 50 },
        { reps: 8, weightKg: 60 },
        { reps: null, weightKg: 80 },
      ]),
    ).toBe(980);
  });

  it('estima el 1RM con Epley', () => {
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.67, 2);
    expect(estimateOneRepMax(100, 1)).toBe(100);
    expect(estimateOneRepMax(100, 0)).toBeNull();
  });
});

describe('rachas', () => {
  const now = new Date(2026, 9, 29, 18, 0, 0);

  it('cuenta días consecutivos hasta hoy', () => {
    expect(calculateStreak([daysAgo(0), daysAgo(1), daysAgo(2)], now)).toBe(3);
  });

  it('mantiene la racha si el último día fue ayer', () => {
    expect(calculateStreak([daysAgo(1), daysAgo(2)], now)).toBe(2);
  });

  it('devuelve cero si hay un día sin actividad', () => {
    expect(calculateStreak([daysAgo(2), daysAgo(3)], now)).toBe(0);
  });

  it('ignora fechas inválidas', () => {
    expect(calculateStreak(['no-es-fecha', daysAgo(0)], now)).toBe(1);
  });
});

describe('actividades y medidas', () => {
  it('resume las actividades', () => {
    const activities: Activity[] = [
      {
        id: 1,
        type: 'walk',
        title: 'Caminata',
        performedAt: daysAgo(0),
        durationMinutes: 45,
        distanceKm: 4,
        elevationGainM: 50,
        terrain: null,
        rpe: null,
        notes: null,
        routineId: null,
        roundsCompleted: null,
        details: null,
        createdAt: daysAgo(0),
        updatedAt: daysAgo(0),
      },
      {
        id: 2,
        type: 'hike',
        title: 'Sierra',
        performedAt: daysAgo(1),
        durationMinutes: 120,
        distanceKm: 8,
        elevationGainM: 400,
        terrain: null,
        rpe: null,
        notes: null,
        routineId: null,
        roundsCompleted: null,
        details: null,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
    ];

    expect(summarizeActivities(activities)).toEqual({
      sessions: 2,
      minutes: 165,
      distanceKm: 12,
      elevationGainM: 450,
    });
  });

  it('calcula la variación de peso', () => {
    const measurements = [
      { weightKg: 80 },
      { weightKg: 79 },
      { weightKg: 78.5 },
    ] as Measurement[];
    expect(calculateWeightChange(measurements)).toBeCloseTo(-1.5, 2);
    expect(calculateWeightChange([])).toBeNull();
  });

  it('calcula la edad', () => {
    expect(calculateAge('1990-05-10', new Date(2026, 9, 29))).toBe(36);
    expect(calculateAge(null)).toBeNull();
  });
});
