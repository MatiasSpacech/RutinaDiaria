import type { SQLiteDatabase } from 'expo-sqlite';

const exercises: [string, string][] = [
  ['Press de banca', 'pecho'],
  ['Press inclinado con mancuernas', 'pecho'],
  ['Aperturas con mancuernas', 'pecho'],
  ['Fondos en paralelas', 'pecho'],
  ['Flexiones', 'pecho'],
  ['Dominadas', 'espalda'],
  ['Remo con barra', 'espalda'],
  ['Remo con mancuerna', 'espalda'],
  ['Jalón al pecho', 'espalda'],
  ['Peso muerto convencional', 'espalda'],
  ['Hiperextensiones', 'espalda'],
  ['Sentadilla con barra', 'piernas'],
  ['Sentadilla búlgara', 'piernas'],
  ['Prensa de piernas', 'piernas'],
  ['Zancadas', 'piernas'],
  ['Peso muerto rumano', 'piernas'],
  ['Curl femoral', 'piernas'],
  ['Extensión de cuádriceps', 'piernas'],
  ['Elevación de gemelos', 'piernas'],
  ['Hip thrust', 'gluteos'],
  ['Patada de glúteo', 'gluteos'],
  ['Press militar', 'hombros'],
  ['Press Arnold', 'hombros'],
  ['Elevaciones laterales', 'hombros'],
  ['Elevaciones frontales', 'hombros'],
  ['Pájaros', 'hombros'],
  ['Curl con barra', 'biceps'],
  ['Curl con mancuernas', 'biceps'],
  ['Curl martillo', 'biceps'],
  ['Curl predicador', 'biceps'],
  ['Extensión de tríceps en polea', 'triceps'],
  ['Fondos en banco', 'triceps'],
  ['Press francés', 'triceps'],
  ['Patada de tríceps', 'triceps'],
  ['Plancha', 'core'],
  ['Plancha lateral', 'core'],
  ['Crunch', 'core'],
  ['Elevación de piernas', 'core'],
  ['Russian twist', 'core'],
  ['Rueda abdominal', 'core'],
  ['Burpees', 'cardio'],
  ['Saltar la cuerda', 'cardio'],
  ['Escaladores', 'cardio'],
  ['Bicicleta fija', 'cardio'],
  ['Elíptica', 'cardio'],
  ['Remo ergómetro', 'cardio'],
  ['Kettlebell swing', 'cuerpo-completo'],
  ['Thrusters', 'cuerpo-completo'],
  ['Sentadilla con salto', 'cuerpo-completo'],
  ['Battle rope', 'cuerpo-completo'],
  ['Movilidad articular', 'movilidad'],
  ['Estiramientos', 'movilidad'],
  ['Yoga', 'movilidad'],
];

export function seedExercises(db: SQLiteDatabase) {
  const row = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises WHERE is_custom = 0',
  );
  if (row && row.count > 0) return;

  const createdAt = new Date().toISOString();
  db.withTransactionSync(() => {
    for (const [name, muscleGroup] of exercises) {
      db.runSync(
        'INSERT OR IGNORE INTO exercises (name, muscle_group, is_custom, created_at) VALUES (?, ?, 0, ?)',
        name,
        muscleGroup,
        createdAt,
      );
    }
  });
}
