import type { SQLiteDatabase } from 'expo-sqlite';

type Migration = {
  version: number;
  up: (db: SQLiteDatabase) => void;
};

const migrationOne = `
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL DEFAULT '',
    birth_date TEXT,
    sex TEXT NOT NULL DEFAULT 'other' CHECK (sex IN ('male', 'female', 'other')),
    height_cm REAL,
    activity_level TEXT NOT NULL DEFAULT 'moderate'
      CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    goal_weight_kg REAL,
    weekly_goal INTEGER NOT NULL DEFAULT 3,
    unit_system TEXT NOT NULL DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
    theme_preference TEXT NOT NULL DEFAULT 'system'
      CHECK (theme_preference IN ('system', 'light', 'dark')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  INSERT OR IGNORE INTO profile (id, created_at, updated_at)
  VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    is_custom INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);

  CREATE TABLE IF NOT EXISTS routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    notes TEXT,
    mode TEXT NOT NULL DEFAULT 'reps' CHECK (mode IN ('reps', 'time')),
    rounds INTEGER NOT NULL DEFAULT 1,
    prep_seconds INTEGER NOT NULL DEFAULT 5,
    rest_between_exercises_seconds INTEGER NOT NULL DEFAULT 0,
    rest_between_rounds_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS routine_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    target_sets INTEGER,
    target_reps INTEGER,
    duration_seconds INTEGER,
    rest_seconds INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine ON routine_exercises(routine_id);

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('strength', 'walk', 'hike', 'cardio', 'other')),
    title TEXT NOT NULL,
    performed_at TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    distance_km REAL,
    elevation_gain_m REAL,
    terrain TEXT,
    rpe INTEGER,
    notes TEXT,
    routine_id INTEGER REFERENCES routines(id) ON DELETE SET NULL,
    rounds_completed INTEGER,
    details TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_activities_performed_at ON activities(performed_at DESC);
  CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

  CREATE TABLE IF NOT EXISTS strength_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE SET NULL,
    exercise_name TEXT NOT NULL,
    position INTEGER NOT NULL,
    reps INTEGER,
    weight_kg REAL,
    rpe INTEGER,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_strength_sets_activity ON strength_sets(activity_id);
  CREATE INDEX IF NOT EXISTS idx_strength_sets_exercise ON strength_sets(exercise_name);

  CREATE TABLE IF NOT EXISTS measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    measured_at TEXT NOT NULL,
    weight_kg REAL,
    waist_cm REAL,
    hip_cm REAL,
    chest_cm REAL,
    arm_cm REAL,
    thigh_cm REAL,
    body_fat_pct REAL,
    notes TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_measurements_measured_at ON measurements(measured_at DESC);
`;

const migrationTwo = `
  ALTER TABLE profile ADD COLUMN onboarded INTEGER NOT NULL DEFAULT 0;
`;

const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.execSync(migrationOne);
    },
  },
  {
    version: 2,
    up: (db) => {
      db.execSync(migrationTwo);
    },
  },
];

export function migrate(db: SQLiteDatabase) {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;
    db.withTransactionSync(() => {
      migration.up(db);
      db.execSync(`PRAGMA user_version = ${migration.version};`);
    });
    currentVersion = migration.version;
  }
}
