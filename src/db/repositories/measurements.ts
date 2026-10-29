import { getDatabase } from '@/db/client';
import type { Measurement, MeasurementInput } from '@/domain/types';

type MeasurementRow = {
  id: number;
  measured_at: string;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  body_fat_pct: number | null;
  notes: string | null;
  created_at: string;
};

function mapMeasurement(row: MeasurementRow): Measurement {
  return {
    id: row.id,
    measuredAt: row.measured_at,
    weightKg: row.weight_kg,
    waistCm: row.waist_cm,
    hipCm: row.hip_cm,
    chestCm: row.chest_cm,
    armCm: row.arm_cm,
    thighCm: row.thigh_cm,
    bodyFatPct: row.body_fat_pct,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function listMeasurements(order: 'asc' | 'desc' = 'asc'): Measurement[] {
  const db = getDatabase();
  const rows = db.getAllSync<MeasurementRow>(
    `SELECT * FROM measurements ORDER BY measured_at ${order === 'asc' ? 'ASC' : 'DESC'}, id ${
      order === 'asc' ? 'ASC' : 'DESC'
    }`,
  );
  return rows.map(mapMeasurement);
}

export function getMeasurement(id: number): Measurement | null {
  const db = getDatabase();
  const row = db.getFirstSync<MeasurementRow>('SELECT * FROM measurements WHERE id = ?', id);
  return row ? mapMeasurement(row) : null;
}

export function getLatestMeasurement(): Measurement | null {
  const db = getDatabase();
  const row = db.getFirstSync<MeasurementRow>(
    'SELECT * FROM measurements ORDER BY measured_at DESC, id DESC LIMIT 1',
  );
  return row ? mapMeasurement(row) : null;
}

export function createMeasurement(input: MeasurementInput): number {
  const db = getDatabase();
  const result = db.runSync(
    `INSERT INTO measurements (
      measured_at, weight_kg, waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm,
      body_fat_pct, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.measuredAt,
    input.weightKg ?? null,
    input.waistCm ?? null,
    input.hipCm ?? null,
    input.chestCm ?? null,
    input.armCm ?? null,
    input.thighCm ?? null,
    input.bodyFatPct ?? null,
    input.notes ?? null,
    new Date().toISOString(),
  );
  return result.lastInsertRowId;
}

export function updateMeasurement(id: number, input: MeasurementInput) {
  const db = getDatabase();
  db.runSync(
    `UPDATE measurements SET
      measured_at = ?,
      weight_kg = ?,
      waist_cm = ?,
      hip_cm = ?,
      chest_cm = ?,
      arm_cm = ?,
      thigh_cm = ?,
      body_fat_pct = ?,
      notes = ?
    WHERE id = ?`,
    input.measuredAt,
    input.weightKg ?? null,
    input.waistCm ?? null,
    input.hipCm ?? null,
    input.chestCm ?? null,
    input.armCm ?? null,
    input.thighCm ?? null,
    input.bodyFatPct ?? null,
    input.notes ?? null,
    id,
  );
}

export function deleteMeasurement(id: number) {
  getDatabase().runSync('DELETE FROM measurements WHERE id = ?', id);
}
