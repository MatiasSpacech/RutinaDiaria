import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextStyle,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { calculateVolume, volumeUnit } from '@/domain/calculations';
import type { UnitSystem } from '@/domain/types';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import { parseDecimal } from '@/utils/numbers';

export type SetDraft = {
  reps: string;
  weight: string;
  rpe: string;
};

export type ExerciseDraft = {
  key: string;
  exerciseId: number | null;
  name: string;
  sets: SetDraft[];
};

type StrengthSessionEditorProps = {
  exercises: ExerciseDraft[];
  onChange: (exercises: ExerciseDraft[]) => void;
  onAddExercise: () => void;
  unitSystem: UnitSystem;
};

export function createExerciseDraft(name: string, exerciseId: number | null): ExerciseDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    exerciseId,
    name,
    sets: [
      { reps: '', weight: '', rpe: '' },
      { reps: '', weight: '', rpe: '' },
      { reps: '', weight: '', rpe: '' },
    ],
  };
}

function SetInput({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'decimal-pad',
  style,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'decimal-pad' | 'number-pad';
  style?: TextStyle;
}) {
  const { colors } = useTheme();

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.primary}
      keyboardType={keyboardType}
      style={[
        styles.setInput,
        {
          backgroundColor: colors.backgroundAlt,
          borderColor: colors.border,
          color: colors.text,
        },
        style,
      ]}
    />
  );
}

export function StrengthSessionEditor({
  exercises,
  onChange,
  onAddExercise,
  unitSystem,
}: StrengthSessionEditorProps) {
  const { colors } = useTheme();
  const weightLabel = volumeUnit(unitSystem);
  const volume = calculateVolume(
    exercises.flatMap((exercise) =>
      exercise.sets.map((set) => ({
        reps: parseDecimal(set.reps),
        weightKg: parseDecimal(set.weight),
      })),
    ),
  );

  function updateExercise(key: string, updater: (exercise: ExerciseDraft) => ExerciseDraft) {
    onChange(exercises.map((exercise) => (exercise.key === key ? updater(exercise) : exercise)));
  }

  function updateSet(
    exerciseKey: string,
    setIndex: number,
    field: keyof SetDraft,
    value: string,
  ) {
    updateExercise(exerciseKey, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set, index) =>
        index === setIndex ? { ...set, [field]: value } : set,
      ),
    }));
  }

  function addSet(exerciseKey: string) {
    updateExercise(exerciseKey, (exercise) => {
      const last = exercise.sets[exercise.sets.length - 1];
      return {
        ...exercise,
        sets: [
          ...exercise.sets,
          {
            reps: last?.reps ?? '',
            weight: last?.weight ?? '',
            rpe: last?.rpe ?? '',
          },
        ],
      };
    });
  }

  function removeSet(exerciseKey: string, setIndex: number) {
    updateExercise(exerciseKey, (exercise) => ({
      ...exercise,
      sets: exercise.sets.filter((_, index) => index !== setIndex),
    }));
  }

  function removeExercise(key: string) {
    onChange(exercises.filter((exercise) => exercise.key !== key));
  }

  return (
    <View style={styles.container}>
      {exercises.length === 0 ? (
        <Card style={styles.emptyCard}>
          <AppText variant="bodyStrong" align="center">
            Todavía no agregaste ejercicios
          </AppText>
          <AppText variant="caption" color="textSecondary" align="center">
            Armá tu sesión eligiendo ejercicios de la biblioteca.
          </AppText>
        </Card>
      ) : null}

      {exercises.map((exercise) => (
        <Card key={exercise.key} style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseTitle}>
              <MaterialCommunityIcons name="dumbbell" size={18} color={colors.primary} />
              <AppText variant="bodyStrong">{exercise.name}</AppText>
            </View>
            <IconButton
              name="trash-can-outline"
              accessibilityLabel={`Quitar ${exercise.name}`}
              color={colors.textMuted}
              size={20}
              onPress={() => removeExercise(exercise.key)}
            />
          </View>

          <View style={styles.tableHeader}>
            <AppText variant="caption" color="textMuted" style={styles.indexHeader}>
              #
            </AppText>
            <AppText variant="caption" color="textMuted" style={styles.headerFlex}>
              Reps
            </AppText>
            <AppText variant="caption" color="textMuted" style={styles.headerFlex}>
              Peso ({weightLabel})
            </AppText>
            <AppText variant="caption" color="textMuted" style={styles.rpeHeader}>
              RPE
            </AppText>
            <View style={styles.deleteSpace} />
          </View>

          {exercise.sets.map((set, index) => (
            <View key={`${exercise.key}-${index}`} style={styles.setRow}>
              <AppText variant="caption" color="textMuted" style={styles.indexHeader}>
                {index + 1}
              </AppText>
              <SetInput
                value={set.reps}
                onChangeText={(value) => updateSet(exercise.key, index, 'reps', value)}
                placeholder="10"
                keyboardType="number-pad"
                style={styles.flexInput}
              />
              <SetInput
                value={set.weight}
                onChangeText={(value) => updateSet(exercise.key, index, 'weight', value)}
                placeholder="0"
                style={styles.flexInput}
              />
              <SetInput
                value={set.rpe}
                onChangeText={(value) => updateSet(exercise.key, index, 'rpe', value)}
                placeholder="—"
                keyboardType="number-pad"
                style={styles.rpeInput}
              />
              <Pressable
                accessibilityLabel="Quitar serie"
                onPress={() => removeSet(exercise.key, index)}
                hitSlop={8}
                style={styles.deleteSpace}>
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={() => addSet(exercise.key)}
            style={({ pressed }) => [
              styles.addSet,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}>
            <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
            <AppText variant="label" style={{ color: colors.primary }}>
              Agregar serie
            </AppText>
          </Pressable>
        </Card>
      ))}

      <Button
        label="Agregar ejercicio"
        variant="secondary"
        onPress={onAddExercise}
        icon={<MaterialCommunityIcons name="plus" size={18} color={colors.text} />}
      />

      {exercises.length > 0 ? (
        <View style={styles.volumeRow}>
          <AppText variant="caption" color="textSecondary">
            Volumen total
          </AppText>
          <AppText variant="bodyStrong">
            {Math.round(volume).toLocaleString('es-AR')} {weightLabel}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  addSet: {
    alignItems: 'center',
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  container: {
    gap: spacing.md,
  },
  deleteSpace: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
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
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  exerciseTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
  },
  flexInput: {
    flex: 1,
  },
  headerFlex: {
    flex: 1,
  },
  indexHeader: {
    width: 18,
  },
  rpeHeader: {
    width: 56,
  },
  rpeInput: {
    width: 56,
  },
  setInput: {
    borderRadius: radius.sm,
    borderWidth: 1,
    fontSize: 14,
    height: 42,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
  },
  setRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tableHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  volumeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
