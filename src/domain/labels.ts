import type {
  ActivityLevel,
  ActivityType,
  RoutineMode,
  Sex,
  UnitSystem,
} from '@/domain/types';

export const activityTypeLabels: Record<ActivityType, string> = {
  strength: 'Fuerza',
  walk: 'Caminata',
  hike: 'Senderismo',
  cardio: 'Cardio',
  other: 'Otro',
};

export const activityTypeIcons = {
  strength: 'dumbbell',
  walk: 'walk',
  hike: 'hiking',
  cardio: 'heart-pulse',
  other: 'dots-horizontal-circle-outline',
} as const;

export const muscleGroupLabels: Record<string, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  piernas: 'Piernas',
  gluteos: 'Glúteos',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  core: 'Core',
  cardio: 'Cardio',
  'cuerpo-completo': 'Cuerpo completo',
  movilidad: 'Movilidad',
  otro: 'Otro',
};

export const sexLabels: Record<Sex, string> = {
  male: 'Masculino',
  female: 'Femenino',
  other: 'Prefiero no decir',
};

export const activityLevelLabels: Record<ActivityLevel, string> = {
  sedentary: 'Sedentario',
  light: 'Ligero',
  moderate: 'Moderado',
  active: 'Activo',
  very_active: 'Muy activo',
};

export const unitSystemLabels: Record<UnitSystem, string> = {
  metric: 'Métrico (kg, km)',
  imperial: 'Imperial (lb, mi)',
};

export const routineModeLabels: Record<RoutineMode, string> = {
  reps: 'Por series y repeticiones',
  time: 'Por tiempo',
};

export const activityLevelOptions: { label: string; value: ActivityLevel }[] = [
  { label: 'Sedentario', value: 'sedentary' },
  { label: 'Ligero', value: 'light' },
  { label: 'Moderado', value: 'moderate' },
  { label: 'Activo', value: 'active' },
  { label: 'Muy activo', value: 'very_active' },
];

export const sexOptions: { label: string; value: Sex }[] = [
  { label: 'Masculino', value: 'male' },
  { label: 'Femenino', value: 'female' },
  { label: 'Prefiero no decir', value: 'other' },
];

export const activityTypeOptions: { label: string; value: ActivityType }[] = [
  { label: 'Fuerza', value: 'strength' },
  { label: 'Caminata', value: 'walk' },
  { label: 'Senderismo', value: 'hike' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'Otro', value: 'other' },
];

export const terrainOptions = ['Asfalto', 'Tierra', 'Sendero', 'Montaña', 'Playa', 'Otro'];
