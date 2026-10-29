import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { format } from 'date-fns';

import { getActivity, listActivities } from '@/db/repositories/activities';
import { listExercises } from '@/db/repositories/exercises';
import { listMeasurements } from '@/db/repositories/measurements';
import { getProfile } from '@/db/repositories/profile';
import { getRoutine, listRoutines } from '@/db/repositories/routines';

export async function exportBackup(): Promise<string> {
  const activities = listActivities({ limit: 10000 })
    .map((activity) => getActivity(activity.id))
    .filter((activity) => activity !== null);

  const routines = listRoutines()
    .map((routine) => getRoutine(routine.id))
    .filter((routine) => routine !== null);

  const payload = {
    app: 'RutinaDiaria',
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    exercises: listExercises(),
    routines,
    activities,
    measurements: listMeasurements('asc'),
  };

  const filename = `rutinadiaria-backup-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`;
  const file = new File(Paths.cache, filename);
  await file.write(JSON.stringify(payload, null, 2));

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Compartir archivos no está disponible en este dispositivo.');
  }

  await Sharing.shareAsync(file.uri, {
    dialogTitle: 'Compartir backup de RutinaDiaria',
    mimeType: 'application/json',
    UTI: 'public.json',
  });

  return file.uri;
}
