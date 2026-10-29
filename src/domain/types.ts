export type ThemePreference = 'system' | 'light' | 'dark';
export type UnitSystem = 'metric' | 'imperial';
export type Sex = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type ActivityType = 'strength' | 'walk' | 'hike' | 'cardio' | 'other';
export type RoutineMode = 'reps' | 'time';

export type Profile = {
  id: number;
  name: string;
  birthDate: string | null;
  sex: Sex;
  heightCm: number | null;
  activityLevel: ActivityLevel;
  goalWeightKg: number | null;
  weeklyGoal: number;
  unitSystem: UnitSystem;
  themePreference: ThemePreference;
  createdAt: string;
  updatedAt: string;
};

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | 'name'
    | 'birthDate'
    | 'sex'
    | 'heightCm'
    | 'activityLevel'
    | 'goalWeightKg'
    | 'weeklyGoal'
    | 'unitSystem'
    | 'themePreference'
  >
>;

export type Exercise = {
  id: number;
  name: string;
  muscleGroup: string;
  isCustom: boolean;
  createdAt: string;
};

export type Routine = {
  id: number;
  name: string;
  notes: string | null;
  mode: RoutineMode;
  rounds: number;
  prepSeconds: number;
  restBetweenExercisesSeconds: number;
  restBetweenRoundsSeconds: number;
  createdAt: string;
  updatedAt: string;
};

export type RoutineExercise = {
  id: number;
  routineId: number;
  exerciseId: number | null;
  name: string;
  position: number;
  targetSets: number | null;
  targetReps: number | null;
  durationSeconds: number | null;
  restSeconds: number | null;
};

export type RoutineWithExercises = Routine & {
  exercises: RoutineExercise[];
};

export type RoutineExerciseInput = {
  exerciseId?: number | null;
  name: string;
  targetSets?: number | null;
  targetReps?: number | null;
  durationSeconds?: number | null;
  restSeconds?: number | null;
};

export type RoutineInput = {
  name: string;
  notes?: string | null;
  mode: RoutineMode;
  rounds?: number;
  prepSeconds?: number;
  restBetweenExercisesSeconds?: number;
  restBetweenRoundsSeconds?: number;
  exercises: RoutineExerciseInput[];
};

export type StrengthSet = {
  id: number;
  activityId: number;
  exerciseId: number | null;
  exerciseName: string;
  position: number;
  reps: number | null;
  weightKg: number | null;
  rpe: number | null;
  createdAt: string;
};

export type StrengthSetInput = {
  exerciseId?: number | null;
  exerciseName: string;
  reps?: number | null;
  weightKg?: number | null;
  rpe?: number | null;
};

export type Activity = {
  id: number;
  type: ActivityType;
  title: string;
  performedAt: string;
  durationMinutes: number;
  distanceKm: number | null;
  elevationGainM: number | null;
  terrain: string | null;
  rpe: number | null;
  notes: string | null;
  routineId: number | null;
  roundsCompleted: number | null;
  details: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActivitySet = Activity & {
  sets: StrengthSet[];
};

export type ActivityInput = {
  type: ActivityType;
  title: string;
  performedAt: string;
  durationMinutes: number;
  distanceKm?: number | null;
  elevationGainM?: number | null;
  terrain?: string | null;
  rpe?: number | null;
  notes?: string | null;
  routineId?: number | null;
  roundsCompleted?: number | null;
  details?: string | null;
  sets?: StrengthSetInput[];
};

export type Measurement = {
  id: number;
  measuredAt: string;
  weightKg: number | null;
  waistCm: number | null;
  hipCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  bodyFatPct: number | null;
  notes: string | null;
  createdAt: string;
};

export type MeasurementInput = {
  measuredAt: string;
  weightKg?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  chestCm?: number | null;
  armCm?: number | null;
  thighCm?: number | null;
  bodyFatPct?: number | null;
  notes?: string | null;
};
