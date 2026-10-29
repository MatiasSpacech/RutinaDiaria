import { getDatabase } from '@/db/client';
import type { StrengthSetRecord } from '@/domain/stats';

type StrengthSetRow = {
  exercise_name: string;
  reps: number | null;
  weight_kg: number | null;
  performed_at: string;
};

export function listStrengthSetRecords(): StrengthSetRecord[] {
  const db = getDatabase();
  const rows = db.getAllSync<StrengthSetRow>(
    `SELECT ss.exercise_name, ss.reps, ss.weight_kg, a.performed_at
     FROM strength_sets ss
     INNER JOIN activities a ON a.id = ss.activity_id
     ORDER BY a.performed_at ASC, ss.position ASC`,
  );

  return rows.map((row) => ({
    exerciseName: row.exercise_name,
    reps: row.reps,
    weightKg: row.weight_kg,
    performedAt: row.performed_at,
  }));
}
