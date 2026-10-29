import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  ExercisePickerModal,
  PageHeader,
  RpeSelector,
  Screen,
  SectionHeader,
  StrengthSessionEditor,
  TextField,
  createExerciseDraft,
  type ExerciseDraft,
} from '@/components';
import {
  createActivity,
  getActivity,
  updateActivity,
} from '@/db/repositories/activities';
import { getRoutine, listRoutines } from '@/db/repositories/routines';
import {
  calculatePaceSecondsPerKm,
  calculateSpeedKmh,
  distanceUnit,
  elevationUnit,
  formatPace,
  ftToM,
  kmToMi,
  miToKm,
  mToFt,
} from '@/domain/calculations';
import {
  activityTypeLabels,
  activityTypeOptions,
  terrainOptions,
} from '@/domain/labels';
import type {
  ActivityType,
  Exercise,
  RoutineWithExercises,
  StrengthSet,
  StrengthSetInput,
  UnitSystem,
} from '@/domain/types';
import { useAppStore } from '@/store/app';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import { toLocalDateTime } from '@/utils/date';
import { formatInputNumber, parseDecimal } from '@/utils/numbers';

const defaultTitles: Record<ActivityType, string> = {
  strength: 'Entrenamiento de fuerza',
  walk: 'Caminata',
  hike: 'Senderismo',
  cardio: 'Cardio',
  other: 'Actividad',
};

const validTypes: ActivityType[] = ['strength', 'walk', 'hike', 'cardio', 'other'];

function newKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function displayWeight(weightKg: number | null, unitSystem: UnitSystem): string {
  if (weightKg === null) return '';
  if (unitSystem === 'metric') return formatInputNumber(weightKg, 1);
  return formatInputNumber(weightKg * 2.2046226218, 1);
}

function draftsFromSets(sets: StrengthSet[], unitSystem: UnitSystem): ExerciseDraft[] {
  const groups = new Map<string, ExerciseDraft>();
  for (const set of sets) {
    const groupKey = `${set.exerciseId ?? 'custom'}-${set.exerciseName}`;
    let draft = groups.get(groupKey);
    if (!draft) {
      draft = {
        key: newKey(),
        exerciseId: set.exerciseId,
        name: set.exerciseName,
        sets: [],
      };
      groups.set(groupKey, draft);
    }
    draft.sets.push({
      reps: set.reps !== null ? String(set.reps) : '',
      weight: displayWeight(set.weightKg, unitSystem),
      rpe: set.rpe !== null ? String(set.rpe) : '',
    });
  }
  return Array.from(groups.values());
}

function draftsFromRoutine(routine: RoutineWithExercises): ExerciseDraft[] {
  return routine.exercises.map((exercise) => ({
    key: newKey(),
    exerciseId: exercise.exerciseId,
    name: exercise.name,
    sets: Array.from({ length: Math.max(1, exercise.targetSets ?? 3) }, () => ({
      reps: exercise.targetReps ? String(exercise.targetReps) : '',
      weight: '',
      rpe: '',
    })),
  }));
}

function hasDraftData(exercises: ExerciseDraft[]): boolean {
  return exercises.some((exercise) =>
    exercise.sets.some((set) => set.reps.trim() !== '' || set.weight.trim() !== ''),
  );
}

export default function ActivityFormScreen() {
  const { id, type: typeParam, routineId } = useLocalSearchParams<{
    id?: string;
    type?: string;
    routineId?: string;
  }>();
  const { colors } = useTheme();
  const profile = useAppStore((state) => state.profile);
  const unitSystem = profile?.unitSystem ?? 'metric';

  const existing = id ? getActivity(Number(id)) : null;
  const initialRoutine =
    !existing && routineId ? getRoutine(Number(routineId)) : null;
  const [routines] = useState<RoutineWithExercises[]>(() =>
    listRoutines()
      .filter((routine) => routine.mode === 'reps')
      .map((routine) => getRoutine(routine.id))
      .filter((routine): routine is RoutineWithExercises => routine !== null),
  );

  const initialType: ActivityType =
    existing?.type ??
    (typeParam && validTypes.includes(typeParam as ActivityType)
      ? (typeParam as ActivityType)
      : 'strength');

  const [type, setType] = useState<ActivityType>(initialType);
  const [title, setTitle] = useState(
    existing?.title ??
      (initialRoutine?.mode === 'reps' ? initialRoutine.name : defaultTitles[initialType]),
  );
  const [activityDate, setActivityDate] = useState<Date>(
    existing ? parseISO(existing.performedAt) : new Date(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [duration, setDuration] = useState(
    existing ? String(existing.durationMinutes) : '',
  );
  const [distance, setDistance] = useState(
    existing?.distanceKm === null || existing?.distanceKm === undefined
      ? ''
      : formatInputNumber(
          unitSystem === 'metric' ? existing.distanceKm : kmToMi(existing.distanceKm),
          2,
        ),
  );
  const [elevation, setElevation] = useState(
    existing?.elevationGainM === null || existing?.elevationGainM === undefined
      ? ''
      : String(
          Math.round(
            unitSystem === 'metric' ? existing.elevationGainM : mToFt(existing.elevationGainM),
          ),
        ),
  );
  const [terrain, setTerrain] = useState(existing?.terrain ?? '');
  const [rpe, setRpe] = useState<number | null>(existing?.rpe ?? null);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(
    initialRoutine?.mode === 'reps' ? initialRoutine.id : (existing?.routineId ?? null),
  );
  const [exercises, setExercises] = useState<ExerciseDraft[]>(() => {
    if (existing) return draftsFromSets(existing.sets, unitSystem);
    if (initialRoutine?.mode === 'reps') return draftsFromRoutine(initialRoutine);
    return [];
  });
  const [pickerVisible, setPickerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationValue = parseDecimal(duration);
  const distanceDisplay = parseDecimal(distance);
  const distanceKm =
    distanceDisplay === null
      ? null
      : unitSystem === 'metric'
        ? distanceDisplay
        : miToKm(distanceDisplay);
  const pace = calculatePaceSecondsPerKm(distanceKm, durationValue);
  const speed = calculateSpeedKmh(distanceKm, durationValue);
  const isStrength = type === 'strength';
  const supportsDistance = type === 'walk' || type === 'hike' || type === 'cardio' || type === 'other';
  const supportsElevation = type === 'walk' || type === 'hike';
  const supportsTerrain = type === 'walk' || type === 'hike';

  function handleTypeChange(nextType: ActivityType) {
    setType(nextType);
    if (Object.values(defaultTitles).includes(title) || title.trim() === '') {
      setTitle(defaultTitles[nextType]);
    }
  }

  function handleDateChange(event: DateTimePickerEvent, selected?: Date) {
    setShowDatePicker(false);
    if (event.type === 'set' && selected) setActivityDate(selected);
  }

  function applyRoutine(nextRoutineId: number | null) {
    const routine = nextRoutineId ? getRoutine(nextRoutineId) : null;
    const apply = () => {
      setSelectedRoutineId(nextRoutineId);
      if (routine) {
        setExercises(draftsFromRoutine(routine));
        if (Object.values(defaultTitles).includes(title) || title.trim() === '') {
          setTitle(routine.name);
        }
      } else {
        setExercises([]);
        setTitle(defaultTitles.strength);
      }
    };

    if (hasDraftData(exercises)) {
      Alert.alert(
        'Reemplazar ejercicios',
        'La sesión actual tiene series cargadas. ¿Querés reemplazarla por esta rutina?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reemplazar', style: 'destructive', onPress: apply },
        ],
      );
    } else {
      apply();
    }
  }

  function handleAddExercise(exercise: Exercise) {
    setExercises((current) => [
      ...current,
      createExerciseDraft(exercise.name, exercise.id),
    ]);
  }

  function handleSave() {
    if (!title.trim()) {
      setError('Poné un nombre a la actividad.');
      return;
    }
    if (durationValue === null || durationValue <= 0) {
      setError('Ingresá una duración mayor que cero.');
      return;
    }
    if ((type === 'walk' || type === 'hike') && (distanceDisplay === null || distanceDisplay <= 0)) {
      setError('Ingresá la distancia recorrida.');
      return;
    }
    if (distanceDisplay !== null && distanceDisplay < 0) {
      setError('La distancia no puede ser negativa.');
      return;
    }

    let sets: StrengthSetInput[] = [];
    if (isStrength) {
      for (const exercise of exercises) {
        for (const set of exercise.sets) {
          const reps = parseDecimal(set.reps);
          const weight = parseDecimal(set.weight);
          const setRpe = parseDecimal(set.rpe);
          if (reps === null && weight === null) continue;
          if (reps === null || reps <= 0) {
            setError(`Completá las repeticiones de ${exercise.name}.`);
            return;
          }
          if (weight !== null && weight < 0) {
            setError('El peso no puede ser negativo.');
            return;
          }
          if (setRpe !== null && (setRpe < 1 || setRpe > 10)) {
            setError('El RPE debe estar entre 1 y 10.');
            return;
          }
          sets.push({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.name,
            reps: Math.round(reps),
            weightKg:
              weight === null
                ? null
                : unitSystem === 'metric'
                  ? weight
                  : weight / 2.2046226218,
            rpe: setRpe,
          });
        }
      }

      if (sets.length === 0) {
        setError('Agregá al menos una serie con repeticiones.');
        return;
      }
    }

    const elevationValue = parseDecimal(elevation);
    if (elevationValue !== null && elevationValue < 0) {
      setError('El desnivel no puede ser negativo.');
      return;
    }

    setError(null);
    const input = {
      type,
      title: title.trim(),
      performedAt: toLocalDateTime(activityDate),
      durationMinutes: Math.max(1, Math.round(durationValue)),
      distanceKm: supportsDistance ? distanceKm : null,
      elevationGainM:
        supportsElevation && elevationValue !== null
          ? unitSystem === 'metric'
            ? elevationValue
            : ftToM(elevationValue)
          : null,
      terrain: supportsTerrain ? terrain || null : null,
      rpe,
      notes: notes.trim() || null,
      routineId: isStrength ? selectedRoutineId : null,
      roundsCompleted: existing?.roundsCompleted ?? null,
      details: existing?.details ?? null,
      sets,
    };

    if (existing) {
      updateActivity(existing.id, input);
    } else {
      createActivity(input);
    }
    router.back();
  }

  return (
    <>
      <Screen>
        <PageHeader
          title={existing ? 'Editar actividad' : 'Nueva actividad'}
          subtitle={format(activityDate, "EEEE d 'de' MMMM", { locale: es })}
          onBack={() => router.back()}
        />

        <View style={styles.chips}>
          {activityTypeOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={type === option.value}
              onPress={() => handleTypeChange(option.value)}
            />
          ))}
        </View>

        <Card style={styles.formCard}>
          <TextField
            label="Título"
            value={title}
            onChangeText={setTitle}
            placeholder={defaultTitles[type]}
          />

          <View style={styles.row}>
            <View style={[styles.field, styles.rowField]}>
              <AppText variant="label">Fecha</AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.dateButton,
                  { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
                ]}>
                <MaterialCommunityIcons
                  name="calendar-blank-outline"
                  size={18}
                  color={colors.textMuted}
                />
                <AppText variant="body" numberOfLines={1}>
                  {format(activityDate, 'd MMM yyyy', { locale: es })}
                </AppText>
              </Pressable>
              {showDatePicker ? (
                <DateTimePicker
                  value={activityDate}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                />
              ) : null}
            </View>
            <TextField
              label="Duración (min)"
              placeholder="Ej. 45"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              containerStyle={styles.rowField}
            />
          </View>

          {supportsDistance ? (
            <View style={styles.row}>
              <TextField
                label={`Distancia (${distanceUnit(unitSystem)})`}
                placeholder="0.0"
                value={distance}
                onChangeText={setDistance}
                keyboardType="decimal-pad"
                containerStyle={styles.rowField}
              />
              {supportsElevation ? (
                <TextField
                  label={`Desnivel (${elevationUnit(unitSystem)})`}
                  placeholder="0"
                  value={elevation}
                  onChangeText={setElevation}
                  keyboardType="number-pad"
                  containerStyle={styles.rowField}
                />
              ) : null}
            </View>
          ) : null}

          {supportsTerrain ? (
            <View style={styles.field}>
              <AppText variant="label">Terreno</AppText>
              <View style={styles.chips}>
                {terrainOptions.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    selected={terrain === option}
                    onPress={() => setTerrain(terrain === option ? '' : option)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {!isStrength && pace !== null ? (
            <View style={[styles.paceCard, { backgroundColor: colors.primarySoft }]}>
              <View style={styles.paceItem}>
                <AppText variant="caption" color="textSecondary">
                  Ritmo
                </AppText>
                <AppText variant="bodyStrong">{formatPace(pace, unitSystem)}</AppText>
              </View>
              <View style={styles.paceItem}>
                <AppText variant="caption" color="textSecondary">
                  Velocidad
                </AppText>
                <AppText variant="bodyStrong">
                  {speed !== null ? speed.toFixed(1) : '—'}{' '}
                  {unitSystem === 'metric' ? 'km/h' : 'mph'}
                </AppText>
              </View>
            </View>
          ) : null}

          {isStrength ? (
            <>
              <View style={styles.field}>
                <AppText variant="label">Rutina</AppText>
                {existing ? (
                  <AppText variant="caption" color="textSecondary">
                    {existing.routineId
                      ? 'Sesión basada en una rutina. Podés editar las series libremente.'
                      : 'Sesión libre.'}
                  </AppText>
                ) : (
                  <>
                    <View style={styles.chips}>
                      <Chip
                        label="Libre"
                        selected={selectedRoutineId === null}
                        onPress={() => applyRoutine(null)}
                      />
                      {routines.map((routine) => (
                        <Chip
                          key={routine.id}
                          label={routine.name}
                          selected={selectedRoutineId === routine.id}
                          onPress={() => applyRoutine(routine.id)}
                        />
                      ))}
                    </View>
                    <AppText variant="caption" color="textMuted">
                      Elegí una rutina para precargar ejercicios o empezá una sesión libre.
                    </AppText>
                  </>
                )}
              </View>

              <SectionHeader title="Ejercicios" />
              <StrengthSessionEditor
                exercises={exercises}
                onChange={setExercises}
                onAddExercise={() => setPickerVisible(true)}
                unitSystem={unitSystem}
              />
            </>
          ) : null}

          <RpeSelector value={rpe} onChange={setRpe} label="Esfuerzo general (RPE)" />
          <TextField
            label="Notas"
            placeholder="¿Cómo te sentiste?"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {error ? (
            <AppText variant="caption" color="danger">
              {error}
            </AppText>
          ) : null}

          <Button
            label={existing ? 'Guardar cambios' : `Guardar ${activityTypeLabels[type].toLowerCase()}`}
            onPress={handleSave}
            size="lg"
          />
        </Card>
      </Screen>

      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleAddExercise}
      />
    </>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dateButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  formCard: {
    gap: spacing.lg,
  },
  paceCard: {
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: spacing.lg,
  },
  paceItem: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowField: {
    flex: 1,
  },
});
