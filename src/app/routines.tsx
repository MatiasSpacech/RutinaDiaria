import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  FAB,
  IconButton,
  PageHeader,
  Screen,
} from '@/components';
import { getRoutine, listRoutines } from '@/db/repositories/routines';
import { routineModeLabels } from '@/domain/labels';
import type { RoutineWithExercises } from '@/domain/types';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

export default function RoutinesScreen() {
  const { colors } = useTheme();
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loaded = listRoutines()
        .map((routine) => getRoutine(routine.id))
        .filter((routine): routine is RoutineWithExercises => routine !== null);
      setRoutines(loaded);
    }, []),
  );

  return (
    <>
      <Screen>
        <PageHeader
          title="Rutinas"
          subtitle="Plantillas de entrenamiento"
          onBack={() => router.back()}
          right={
            <IconButton
              name="plus"
              accessibilityLabel="Nueva rutina"
              variant="surface"
              onPress={() => router.push('/routine/new')}
            />
          }
        />

        {routines.length === 0 ? (
          <Card>
            <EmptyState
              icon="clipboard-text-outline"
              title="Sin rutinas todavía"
              description="Creá una rutina para reutilizar tus ejercicios y arrancar más rápido."
              actionLabel="Nueva rutina"
              onAction={() => router.push('/routine/new')}
            />
          </Card>
        ) : (
          routines.map((routine) => (
            <Card key={routine.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitle}>
                  <AppText variant="bodyStrong">{routine.name}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {routineModeLabels[routine.mode]} · {routine.exercises.length} ejercicio
                    {routine.exercises.length === 1 ? '' : 's'}
                    {routine.mode === 'time' ? ` · ${routine.rounds} rondas` : ''}
                  </AppText>
                </View>
                <Chip
                  label={routine.mode === 'time' ? 'Tiempo' : 'Series'}
                  selected={routine.mode === 'time'}
                />
              </View>

              {routine.notes ? (
                <AppText variant="caption" color="textMuted">
                  {routine.notes}
                </AppText>
              ) : null}

              <View style={[styles.exerciseList, { borderColor: colors.border }]}>
                {routine.exercises.slice(0, 4).map((exercise) => (
                  <View key={exercise.id} style={styles.exerciseRow}>
                    <MaterialCommunityIcons
                      name="dumbbell"
                      size={14}
                      color={colors.textMuted}
                    />
                    <AppText variant="caption" color="textSecondary" style={styles.exerciseName}>
                      {exercise.name}
                    </AppText>
                    <AppText variant="caption" color="textMuted">
                      {routine.mode === 'reps'
                        ? `${exercise.targetSets ?? 3} × ${exercise.targetReps ?? 10}`
                        : `${exercise.durationSeconds ?? 40}s`}
                    </AppText>
                  </View>
                ))}
                {routine.exercises.length > 4 ? (
                  <AppText variant="caption" color="textMuted">
                    +{routine.exercises.length - 4} más
                  </AppText>
                ) : null}
              </View>

              <View style={styles.actions}>
                {routine.mode === 'reps' ? (
                  <Button
                    label="Iniciar"
                    onPress={() =>
                      router.push({
                        pathname: '/activity/new',
                        params: { routineId: String(routine.id), type: 'strength' },
                      })
                    }
                    icon={<MaterialCommunityIcons name="play" size={18} color={colors.onPrimary} />}
                    fullWidth={false}
                    style={styles.actionButton}
                  />
                ) : (
                  <Button
                    label="Iniciar timer"
                    onPress={() =>
                      router.push({ pathname: '/timer/[id]', params: { id: String(routine.id) } })
                    }
                    icon={
                      <MaterialCommunityIcons
                        name="timer-play-outline"
                        size={18}
                        color={colors.onPrimary}
                      />
                    }
                    fullWidth={false}
                    style={styles.actionButton}
                  />
                )}
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/routine/new', params: { id: String(routine.id) } })
                  }
                  style={({ pressed }) => [
                    styles.editButton,
                    { borderColor: colors.border },
                    pressed && { opacity: 0.7 },
                  ]}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.text} />
                  <AppText variant="label">Editar</AppText>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </Screen>
      <FAB onPress={() => router.push('/routine/new')} accessibilityLabel="Nueva rutina" />
    </>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    gap: spacing.md,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    gap: 2,
  },
  editButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  exerciseList: {
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  exerciseName: {
    flex: 1,
  },
  exerciseRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
