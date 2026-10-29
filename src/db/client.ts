import * as SQLite from 'expo-sqlite';

import { migrate } from '@/db/migrations';
import { seedExercises } from '@/db/seed';

let database: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!database) {
    database = SQLite.openDatabaseSync('rutinadiaria.db');
    database.execSync('PRAGMA journal_mode = WAL;');
    database.execSync('PRAGMA foreign_keys = ON;');
    migrate(database);
    seedExercises(database);
  }
  return database;
}

export function initDatabase() {
  getDatabase();
}
