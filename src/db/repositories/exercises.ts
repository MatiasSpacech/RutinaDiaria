import { getDatabase } from '@/db/client';
import type { Exercise } from '@/domain/types';

type ExerciseRow = {
  id: number;
  name: string;
  muscle_group: string;
  is_custom: number;
  created_at: string;
};

function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    isCustom: row.is_custom === 1,
    createdAt: row.created_at,
  };
}

export function listExercises(search = ''): Exercise[] {
  const db = getDatabase();
  const term = search.trim();
  const rows = term
    ? db.getAllSync<ExerciseRow>(
        'SELECT * FROM exercises WHERE name LIKE ? ORDER BY name COLLATE NOCASE',
        `%${term}%`,
      )
    : db.getAllSync<ExerciseRow>('SELECT * FROM exercises ORDER BY name COLLATE NOCASE');
  return rows.map(mapExercise);
}

export function getExercise(id: number): Exercise | null {
  const db = getDatabase();
  const row = db.getFirstSync<ExerciseRow>('SELECT * FROM exercises WHERE id = ?', id);
  return row ? mapExercise(row) : null;
}

export function createExercise(name: string, muscleGroup: string): Exercise {
  const db = getDatabase();
  const createdAt = new Date().toISOString();
  db.runSync(
    'INSERT OR IGNORE INTO exercises (name, muscle_group, is_custom, created_at) VALUES (?, ?, 1, ?)',
    name.trim(),
    muscleGroup,
    createdAt,
  );
  const row = db.getFirstSync<ExerciseRow>(
    'SELECT * FROM exercises WHERE name = ? COLLATE NOCASE',
    name.trim(),
  );
  if (!row) throw new Error('No se pudo crear el ejercicio');
  return mapExercise(row);
}
