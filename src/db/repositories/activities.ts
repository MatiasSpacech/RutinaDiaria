import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from '@/db/client';
import type {
  Activity,
  ActivityInput,
  ActivitySet,
  ActivityType,
  StrengthSet,
  StrengthSetInput,
} from '@/domain/types';

type ActivityRow = {
  id: number;
  type: ActivityType;
  title: string;
  performed_at: string;
  duration_minutes: number;
  distance_km: number | null;
  elevation_gain_m: number | null;
  terrain: string | null;
  rpe: number | null;
  notes: string | null;
  routine_id: number | null;
  rounds_completed: number | null;
  details: string | null;
  created_at: string;
  updated_at: string;
};

type SetRow = {
  id: number;
  activity_id: number;
  exercise_id: number | null;
  exercise_name: string;
  position: number;
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  created_at: string;
};

function mapActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    performedAt: row.performed_at,
    durationMinutes: row.duration_minutes,
    distanceKm: row.distance_km,
    elevationGainM: row.elevation_gain_m,
    terrain: row.terrain,
    rpe: row.rpe,
    notes: row.notes,
    routineId: row.routine_id,
    roundsCompleted: row.rounds_completed,
    details: row.details,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSet(row: SetRow): StrengthSet {
  return {
    id: row.id,
    activityId: row.activity_id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    position: row.position,
    reps: row.reps,
    weightKg: row.weight_kg,
    rpe: row.rpe,
    createdAt: row.created_at,
  };
}

function insertSets(
  db: SQLiteDatabase,
  activityId: number,
  sets: StrengthSetInput[],
  createdAt: string,
) {
  sets.forEach((set, index) => {
    db.runSync(
      `INSERT INTO strength_sets (
        activity_id, exercise_id, exercise_name, position, reps, weight_kg, rpe, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      activityId,
      set.exerciseId ?? null,
      set.exerciseName,
      index + 1,
      set.reps ?? null,
      set.weightKg ?? null,
      set.rpe ?? null,
      createdAt,
    );
  });
}

export function listActivities(
  options: { type?: ActivityType; limit?: number } = {},
): Activity[] {
  const db = getDatabase();
  let sql = 'SELECT * FROM activities';
  const params: (string | number)[] = [];

  if (options.type) {
    sql += ' WHERE type = ?';
    params.push(options.type);
  }

  sql += ' ORDER BY performed_at DESC, id DESC';

  if (options.limit && options.limit > 0) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  const rows = db.getAllSync<ActivityRow>(sql, ...params);
  return rows.map(mapActivity);
}

export function listActivitiesBetween(startIso: string, endIso: string): Activity[] {
  const db = getDatabase();
  const rows = db.getAllSync<ActivityRow>(
    `SELECT * FROM activities
     WHERE performed_at >= ? AND performed_at < ?
     ORDER BY performed_at ASC, id ASC`,
    startIso,
    endIso,
  );
  return rows.map(mapActivity);
}

export function getActivity(id: number): ActivitySet | null {
  const db = getDatabase();
  const row = db.getFirstSync<ActivityRow>('SELECT * FROM activities WHERE id = ?', id);
  if (!row) return null;

  const sets = db
    .getAllSync<SetRow>(
      'SELECT * FROM strength_sets WHERE activity_id = ? ORDER BY position ASC, id ASC',
      id,
    )
    .map(mapSet);

  return { ...mapActivity(row), sets };
}

export function getRecentActivities(limit = 5): Activity[] {
  return listActivities({ limit });
}

export function getActivityDates(): string[] {
  const db = getDatabase();
  const rows = db.getAllSync<{ day: string }>(
    'SELECT DISTINCT substr(performed_at, 1, 10) as day FROM activities ORDER BY day DESC',
  );
  return rows.map((row) => row.day);
}

export function createActivity(input: ActivityInput): number {
  const db = getDatabase();
  const now = new Date().toISOString();
  let activityId = 0;

  db.withTransactionSync(() => {
    const result = db.runSync(
      `INSERT INTO activities (
        type, title, performed_at, duration_minutes, distance_km, elevation_gain_m,
        terrain, rpe, notes, routine_id, rounds_completed, details, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.type,
      input.title,
      input.performedAt,
      input.durationMinutes,
      input.distanceKm ?? null,
      input.elevationGainM ?? null,
      input.terrain ?? null,
      input.rpe ?? null,
      input.notes ?? null,
      input.routineId ?? null,
      input.roundsCompleted ?? null,
      input.details ?? null,
      now,
      now,
    );
    activityId = result.lastInsertRowId;
    if (input.sets && input.sets.length > 0) {
      insertSets(db, activityId, input.sets, now);
    }
  });

  return activityId;
}

export function updateActivity(id: number, input: ActivityInput) {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.withTransactionSync(() => {
    db.runSync(
      `UPDATE activities SET
        type = ?,
        title = ?,
        performed_at = ?,
        duration_minutes = ?,
        distance_km = ?,
        elevation_gain_m = ?,
        terrain = ?,
        rpe = ?,
        notes = ?,
        routine_id = ?,
        rounds_completed = ?,
        details = ?,
        updated_at = ?
      WHERE id = ?`,
      input.type,
      input.title,
      input.performedAt,
      input.durationMinutes,
      input.distanceKm ?? null,
      input.elevationGainM ?? null,
      input.terrain ?? null,
      input.rpe ?? null,
      input.notes ?? null,
      input.routineId ?? null,
      input.roundsCompleted ?? null,
      input.details ?? null,
      now,
      id,
    );

    if (input.sets !== undefined) {
      db.runSync('DELETE FROM strength_sets WHERE activity_id = ?', id);
      if (input.sets.length > 0) {
        insertSets(db, id, input.sets, now);
      }
    }
  });
}

export function deleteActivity(id: number) {
  getDatabase().runSync('DELETE FROM activities WHERE id = ?', id);
}
