import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from '@/db/client';
import type {
  Routine,
  RoutineExercise,
  RoutineExerciseInput,
  RoutineInput,
  RoutineMode,
  RoutineWithExercises,
} from '@/domain/types';

type RoutineRow = {
  id: number;
  name: string;
  notes: string | null;
  mode: RoutineMode;
  rounds: number;
  prep_seconds: number;
  rest_between_exercises_seconds: number;
  rest_between_rounds_seconds: number;
  created_at: string;
  updated_at: string;
};

type RoutineExerciseRow = {
  id: number;
  routine_id: number;
  exercise_id: number | null;
  name: string;
  position: number;
  target_sets: number | null;
  target_reps: number | null;
  duration_seconds: number | null;
  rest_seconds: number | null;
};

function mapRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    mode: row.mode,
    rounds: row.rounds,
    prepSeconds: row.prep_seconds,
    restBetweenExercisesSeconds: row.rest_between_exercises_seconds,
    restBetweenRoundsSeconds: row.rest_between_rounds_seconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRoutineExercise(row: RoutineExerciseRow): RoutineExercise {
  return {
    id: row.id,
    routineId: row.routine_id,
    exerciseId: row.exercise_id,
    name: row.name,
    position: row.position,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    durationSeconds: row.duration_seconds,
    restSeconds: row.rest_seconds,
  };
}

function insertRoutineExercises(
  db: SQLiteDatabase,
  routineId: number,
  exercises: RoutineExerciseInput[],
) {
  exercises.forEach((exercise, index) => {
    db.runSync(
      `INSERT INTO routine_exercises (
        routine_id, exercise_id, name, position, target_sets, target_reps,
        duration_seconds, rest_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      routineId,
      exercise.exerciseId ?? null,
      exercise.name,
      index + 1,
      exercise.targetSets ?? null,
      exercise.targetReps ?? null,
      exercise.durationSeconds ?? null,
      exercise.restSeconds ?? null,
    );
  });
}

export function listRoutines(): Routine[] {
  const db = getDatabase();
  const rows = db.getAllSync<RoutineRow>(
    'SELECT * FROM routines ORDER BY updated_at DESC, id DESC',
  );
  return rows.map(mapRoutine);
}

export function getRoutine(id: number): RoutineWithExercises | null {
  const db = getDatabase();
  const row = db.getFirstSync<RoutineRow>('SELECT * FROM routines WHERE id = ?', id);
  if (!row) return null;

  const exercises = db
    .getAllSync<RoutineExerciseRow>(
      'SELECT * FROM routine_exercises WHERE routine_id = ? ORDER BY position ASC, id ASC',
      id,
    )
    .map(mapRoutineExercise);

  return { ...mapRoutine(row), exercises };
}

export function createRoutine(input: RoutineInput): number {
  const db = getDatabase();
  const now = new Date().toISOString();
  let routineId = 0;

  db.withTransactionSync(() => {
    const result = db.runSync(
      `INSERT INTO routines (
        name, notes, mode, rounds, prep_seconds, rest_between_exercises_seconds,
        rest_between_rounds_seconds, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.name,
      input.notes ?? null,
      input.mode,
      input.rounds ?? 1,
      input.prepSeconds ?? 5,
      input.restBetweenExercisesSeconds ?? 0,
      input.restBetweenRoundsSeconds ?? 0,
      now,
      now,
    );
    routineId = result.lastInsertRowId;
    insertRoutineExercises(db, routineId, input.exercises);
  });

  return routineId;
}

export function updateRoutine(id: number, input: RoutineInput) {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.withTransactionSync(() => {
    db.runSync(
      `UPDATE routines SET
        name = ?,
        notes = ?,
        mode = ?,
        rounds = ?,
        prep_seconds = ?,
        rest_between_exercises_seconds = ?,
        rest_between_rounds_seconds = ?,
        updated_at = ?
      WHERE id = ?`,
      input.name,
      input.notes ?? null,
      input.mode,
      input.rounds ?? 1,
      input.prepSeconds ?? 5,
      input.restBetweenExercisesSeconds ?? 0,
      input.restBetweenRoundsSeconds ?? 0,
      now,
      id,
    );

    db.runSync('DELETE FROM routine_exercises WHERE routine_id = ?', id);
    insertRoutineExercises(db, id, input.exercises);
  });
}

export function deleteRoutine(id: number) {
  getDatabase().runSync('DELETE FROM routines WHERE id = ?', id);
}
