import { getDatabase } from '@/db/client';

export function resetAllData() {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.withTransactionSync(() => {
    db.execSync(`
      DELETE FROM strength_sets;
      DELETE FROM activities;
      DELETE FROM routine_exercises;
      DELETE FROM routines;
      DELETE FROM measurements;
      DELETE FROM exercises WHERE is_custom = 1;
    `);

    db.runSync(
      `UPDATE profile SET
        name = '',
        birth_date = NULL,
        sex = 'other',
        height_cm = NULL,
        activity_level = 'moderate',
        goal_weight_kg = NULL,
        weekly_goal = 3,
        unit_system = 'metric',
        theme_preference = 'system',
        onboarded = 0,
        updated_at = ?
      WHERE id = 1`,
      now,
    );
  });
}
