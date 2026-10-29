import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  ExercisePickerModal,
  IconButton,
  PageHeader,
  Screen,
  SectionHeader,
  SegmentedControl,
  TextField,
} from '@/components';
import {
  createRoutine,
  deleteRoutine,
  getRoutine,
  updateRoutine,
} from '@/db/repositories/routines';
import type { Exercise, RoutineExerciseInput, RoutineMode } from '@/domain/types';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import { parseDecimal } from '@/utils/numbers';

type RoutineExerciseDraft = {
  key: string;
  exerciseId: number | null;
  name: string;
  targetSets: string;
  targetReps: string;
  duration: string;
  rest: string;
};

const modeOptions: { label: string; value: RoutineMode }[] = [
  { label: 'Series y reps', value: 'reps' },
  { label: 'Por tiempo', value: 'time' },
];

function newKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDraft(exerciseId: number | null, name: string): RoutineExerciseDraft {
  return {
    key: newKey(),
    exerciseId,
    name,
    targetSets: '3',
    targetReps: '10',
    duration: '40',
    rest: '20',
  };
}

export default function RoutineFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const existing = id ? getRoutine(Number(id)) : null;
  const isEditing = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [mode, setMode] = useState<RoutineMode>(existing?.mode ?? 'reps');
  const [rounds, setRounds] = useState(String(existing?.rounds ?? 1));
  const [prep, setPrep] = useState(String(existing?.prepSeconds ?? 5));
  const [restBetweenExercises, setRestBetweenExercises] = useState(
    String(existing?.restBetweenExercisesSeconds ?? 0),
  );
  const [restBetweenRounds, setRestBetweenRounds] = useState(
    String(existing?.restBetweenRoundsSeconds ?? 0),
  );
  const [exercises, setExercises] = useState<RoutineExerciseDraft[]>(
    existing?.exercises.map((exercise) => ({
      key: newKey(),
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      targetSets: String(exercise.targetSets ?? 3),
      targetReps: String(exercise.targetReps ?? 10),
      duration: String(exercise.durationSeconds ?? 40),
      rest: String(exercise.restSeconds ?? 20),
    })) ?? [],
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateExercise(key: string, field: keyof RoutineExerciseDraft, value: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.key === key ? { ...exercise, [field]: value } : exercise,
      ),
    );
  }

  function removeExercise(key: string) {
    setExercises((current) => current.filter((exercise) => exercise.key !== key));
  }

  function moveExercise(index: number, direction: -1 | 1) {
    setExercises((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function handleAddExercise(exercise: Exercise) {
    setExercises((current) => [
      ...current,
      createDraft(exercise.id, exercise.name),
    ]);
  }

  function handleModeChange(nextMode: RoutineMode) {
    setMode(nextMode);
  }

  function handleSave() {
    if (!name.trim()) {
      setError('Poné un nombre a la rutina.');
      return;
    }
    if (exercises.length === 0) {
      setError('Agregá al menos un ejercicio.');
      return;
    }

    const routineExercises: RoutineExerciseInput[] = exercises.map((exercise) => {
      const sets = parseDecimal(exercise.targetSets);
      const reps = parseDecimal(exercise.targetReps);
      const duration = parseDecimal(exercise.duration);
      const rest = parseDecimal(exercise.rest);
      return {
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        targetSets: mode === 'reps' && sets !== null ? Math.max(1, Math.round(sets)) : null,
        targetReps: mode === 'reps' && reps !== null ? Math.max(1, Math.round(reps)) : null,
        durationSeconds:
          mode === 'time' && duration !== null ? Math.max(1, Math.round(duration)) : null,
        restSeconds: mode === 'time' && rest !== null ? Math.max(0, Math.round(rest)) : null,
      };
    });

    if (mode === 'time') {
      const invalid = routineExercises.some(
        (exercise) => !exercise.durationSeconds || exercise.durationSeconds <= 0,
      );
      if (invalid) {
        setError('Cada ejercicio necesita una duración mayor que cero.');
        return;
      }
    }

    const input = {
      name: name.trim(),
      notes: notes.trim() || null,
      mode,
      rounds: Math.max(1, Math.round(parseDecimal(rounds) ?? 1)),
      prepSeconds: Math.max(0, Math.round(parseDecimal(prep) ?? 5)),
      restBetweenExercisesSeconds: Math.max(
        0,
        Math.round(parseDecimal(restBetweenExercises) ?? 0),
      ),
      restBetweenRoundsSeconds: Math.max(
        0,
        Math.round(parseDecimal(restBetweenRounds) ?? 0),
      ),
      exercises: routineExercises,
    };

    setError(null);
    if (existing) {
      updateRoutine(existing.id, input);
    } else {
      createRoutine(input);
    }
    router.back();
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert('Eliminar rutina', '¿Querés eliminar esta rutina?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteRoutine(existing.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <>
      <Screen>
        <PageHeader
          title={isEditing ? 'Editar rutina' : 'Nueva rutina'}
          subtitle={mode === 'reps' ? 'Series y repeticiones' : 'Intervalos y rondas'}
          onBack={() => router.back()}
        />

        <Card style={styles.formCard}>
          <TextField
            label="Nombre de la rutina"
            placeholder="Ej. Full body A"
            value={name}
            onChangeText={setName}
          />
          <TextField
            label="Notas"
            placeholder="Opcional"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          <View style={styles.field}>
            <AppText variant="label">Tipo de rutina</AppText>
            <SegmentedControl options={modeOptions} value={mode} onChange={handleModeChange} />
          </View>

          {mode === 'time' ? (
            <View style={styles.timeSettings}>
              <AppText variant="label">Configuración del circuito</AppText>
              <View style={styles.row}>
                <TextField
                  label="Rondas"
                  value={rounds}
                  onChangeText={setRounds}
                  keyboardType="number-pad"
                  containerStyle={styles.rowField}
                />
                <TextField
                  label="Preparación (s)"
                  value={prep}
                  onChangeText={setPrep}
                  keyboardType="number-pad"
                  containerStyle={styles.rowField}
                />
              </View>
              <View style={styles.row}>
                <TextField
                  label="Descanso entre ejercicios (s)"
                  value={restBetweenExercises}
                  onChangeText={setRestBetweenExercises}
                  keyboardType="number-pad"
                  containerStyle={styles.rowField}
                />
                <TextField
                  label="Descanso entre rondas (s)"
                  value={restBetweenRounds}
                  onChangeText={setRestBetweenRounds}
                  keyboardType="number-pad"
                  containerStyle={styles.rowField}
                />
              </View>
            </View>
          ) : null}
        </Card>

        <SectionHeader title="Ejercicios" />
        {exercises.length === 0 ? (
          <Card style={styles.emptyCard}>
            <AppText variant="bodyStrong" align="center">
              La rutina está vacía
            </AppText>
            <AppText variant="caption" color="textSecondary" align="center">
              Agregá ejercicios y definí sus objetivos.
            </AppText>
          </Card>
        ) : null}

        {exercises.map((exercise, index) => (
          <Card key={exercise.key} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseTitle}>
                <MaterialCommunityIcons name="dumbbell" size={18} color={colors.primary} />
                <AppText variant="bodyStrong" style={styles.exerciseName}>
                  {exercise.name}
                </AppText>
              </View>
              <View style={styles.orderButtons}>
                <IconButton
                  name="chevron-up"
                  accessibilityLabel="Mover arriba"
                  size={20}
                  onPress={() => moveExercise(index, -1)}
                  color={index === 0 ? colors.border : colors.textSecondary}
                />
                <IconButton
                  name="chevron-down"
                  accessibilityLabel="Mover abajo"
                  size={20}
                  onPress={() => moveExercise(index, 1)}
                  color={index === exercises.length - 1 ? colors.border : colors.textSecondary}
                />
                <IconButton
                  name="trash-can-outline"
                  accessibilityLabel={`Quitar ${exercise.name}`}
                  size={20}
                  onPress={() => removeExercise(exercise.key)}
                />
              </View>
            </View>

            {mode === 'reps' ? (
              <View style={styles.row}>
                <TextField
                  label="Series"
                  value={exercise.targetSets}
                  onChangeText={(value) => updateExercise(exercise.key, 'targetSets', value)}
                  keyboardType="number-pad"
                  containerStyle={styles.rowField}
                />
                <TextField
                  label="Reps"
                  value={exercise.targetReps}
                  onChangeText={(value) => updateExercise(exercise.key, 'targetReps', value)}
                  keyboardType="number-pad"
                  containerStyle={styles.rowField}
                />
              </View>
            ) : (
              <View style={styles.row}>
                <TextField
                  label="Duración (s)"
                  value={exercise.duration}
                  onChangeText={(value) => updateExercise(exercise.key, 'duration', value)}
                  keyboardType="number-pad"
                  containerStyle={styles.rowField}
                />
                <TextField
                  label="Descanso (s)"
                  value={exercise.rest}
                  onChangeText={(value) => updateExercise(exercise.key, 'rest', value)}
                  keyboardType="number-pad"
                  containerStyle={styles.rowField}
                />
              </View>
            )}
          </Card>
        ))}

        <Pressable
          onPress={() => setPickerVisible(true)}
          style={({ pressed }) => [
            styles.addExercise,
            { borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}>
          <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
          <AppText variant="label" style={{ color: colors.primary }}>
            Agregar ejercicio
          </AppText>
        </Pressable>

        {error ? (
          <AppText variant="caption" color="danger">
            {error}
          </AppText>
        ) : null}

        <Button label={isEditing ? 'Guardar cambios' : 'Crear rutina'} onPress={handleSave} size="lg" />
        {isEditing ? (
          <Button label="Eliminar rutina" variant="ghost" onPress={handleDelete} />
        ) : null}
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
  addExercise: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  exerciseCard: {
    gap: spacing.md,
  },
  exerciseHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  exerciseName: {
    flexShrink: 1,
  },
  exerciseTitle: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  field: {
    gap: spacing.sm,
  },
  formCard: {
    gap: spacing.lg,
  },
  orderButtons: {
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowField: {
    flex: 1,
  },
  timeSettings: {
    gap: spacing.md,
  },
});
