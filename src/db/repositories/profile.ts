import { getDatabase } from '@/db/client';
import type { Profile, ProfileUpdate } from '@/domain/types';

type ProfileRow = {
  id: number;
  name: string;
  birth_date: string | null;
  sex: Profile['sex'];
  height_cm: number | null;
  activity_level: Profile['activityLevel'];
  goal_weight_kg: number | null;
  weekly_goal: number;
  unit_system: Profile['unitSystem'];
  theme_preference: Profile['themePreference'];
  onboarded: number;
  created_at: string;
  updated_at: string;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    birthDate: row.birth_date,
    sex: row.sex,
    heightCm: row.height_cm,
    activityLevel: row.activity_level,
    goalWeightKg: row.goal_weight_kg,
    weeklyGoal: row.weekly_goal,
    unitSystem: row.unit_system,
    themePreference: row.theme_preference,
    onboarded: row.onboarded === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getProfile(): Profile {
  const db = getDatabase();
  const row = db.getFirstSync<ProfileRow>('SELECT * FROM profile WHERE id = 1');
  if (!row) throw new Error('No se encontró el perfil');
  return mapProfile(row);
}

export function updateProfile(update: ProfileUpdate): Profile {
  const db = getDatabase();
  const current = getProfile();
  const merged: Profile = { ...current, ...update, updatedAt: new Date().toISOString() };

  db.runSync(
    `UPDATE profile SET
      name = ?,
      birth_date = ?,
      sex = ?,
      height_cm = ?,
      activity_level = ?,
      goal_weight_kg = ?,
      weekly_goal = ?,
      unit_system = ?,
      theme_preference = ?,
      onboarded = ?,
      updated_at = ?
    WHERE id = 1`,
    merged.name,
    merged.birthDate,
    merged.sex,
    merged.heightCm,
    merged.activityLevel,
    merged.goalWeightKg,
    merged.weeklyGoal,
    merged.unitSystem,
    merged.themePreference,
    merged.onboarded ? 1 : 0,
    merged.updatedAt,
  );

  return getProfile();
}
