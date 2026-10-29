import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Divider,
  MetricCard,
  PageHeader,
  Screen,
  SectionHeader,
} from '@/components';
import { deleteActivity, getActivity } from '@/db/repositories/activities';
import { getRoutine } from '@/db/repositories/routines';
import {
  calculatePaceSecondsPerKm,
  calculateVolume,
  formatDistance,
  formatDuration,
  formatElevation,
  formatPace,
  formatTimerDuration,
  formatWeight,
  kgToLb,
  weightUnit,
} from '@/domain/calculations';
import {
  activityTypeIcons,
  activityTypeLabels,
} from '@/domain/labels';
import type { ActivitySet } from '@/domain/types';
import { useAppStore } from '@/store/app';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import { formatDateForTime } from '@/utils/date';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const profile = useAppStore((state) => state.profile);
  const unitSystem = profile?.unitSystem ?? 'metric';
  const [activity, setActivity] = useState<ActivitySet | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setActivity(getActivity(Number(id)));
      setLoaded(true);
    }, [id]),
  );

  if (loaded && !activity) {
    return (
      <Screen>
        <PageHeader title="Actividad" onBack={() => router.back()} />
        <Card style={styles.emptyCard}>
          <AppText variant="body">Esta actividad ya no existe.</AppText>
        </Card>
      </Screen>
    );
  }

  if (!activity) {
    return (
      <Screen>
        <PageHeader title="Actividad" onBack={() => router.back()} />
      </Screen>
    );
  }

  const routine = activity.routineId ? getRoutine(activity.routineId) : null;
  const volumeKg = calculateVolume(activity.sets);
  const volumeDisplay = unitSystem === 'metric' ? volumeKg : kgToLb(volumeKg);
  const pace = calculatePaceSecondsPerKm(activity.distanceKm, activity.durationMinutes);
  const isStrength = activity.type === 'strength';
  const showDistance = activity.distanceKm !== null;

  let timerDetails: {
    timer?: boolean;
    plannedSeconds?: number;
    elapsedSeconds?: number;
    rounds?: number;
    exercises?: string[];
  } | null = null;
  if (activity.details) {
    try {
      timerDetails = JSON.parse(activity.details);
    } catch {
      timerDetails = null;
    }
  }
  const isTimedSession = isStrength && Boolean(timerDetails?.timer);

  const groups = new Map<string, typeof activity.sets>();
  for (const set of activity.sets) {
    const current = groups.get(set.exerciseName) ?? [];
    current.push(set);
    groups.set(set.exerciseName, current);
  }

  function handleDelete() {
    if (!activity) return;
    const activityId = activity.id;
    Alert.alert('Eliminar actividad', '¿Querés eliminar esta actividad?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteActivity(activityId);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <PageHeader
        title={activity.title}
        subtitle={`${activityTypeLabels[activity.type]} · ${formatDateForTime(
          activity.performedAt,
        )}`}
        onBack={() => router.back()}
        right={
          <View style={[styles.typeBadge, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons
              name={activityTypeIcons[activity.type]}
              size={22}
              color={colors.primary}
            />
          </View>
        }
      />

      {routine ? (
        <AppText variant="caption" color="textMuted">
          Rutina: {routine.name}
        </AppText>
      ) : null}

      <View style={styles.metricsGrid}>
        <MetricCard
          label={isTimedSession ? 'Tiempo' : 'Duración'}
          value={
            isTimedSession && timerDetails?.elapsedSeconds
              ? formatTimerDuration(timerDetails.elapsedSeconds)
              : formatDuration(activity.durationMinutes)
          }
          icon="clock-outline"
          tone="info"
        />
        {isTimedSession ? (
          <MetricCard
            label="Rondas"
            value={`${activity.roundsCompleted ?? 0}/${timerDetails?.rounds ?? '—'}`}
            icon="repeat"
            tone="success"
          />
        ) : isStrength ? (
          <MetricCard
            label="Volumen"
            value={Math.round(volumeDisplay).toLocaleString('es-AR')}
            unit={weightUnit(unitSystem)}
            icon="weight-kilogram"
          />
        ) : showDistance ? (
          <MetricCard
            label="Distancia"
            value={formatDistance(activity.distanceKm, unitSystem)}
            unit={unitSystem === 'metric' ? 'km' : 'mi'}
            icon="map-marker-distance"
          />
        ) : (
          <MetricCard
            label="RPE"
            value={activity.rpe ? String(activity.rpe) : '—'}
            icon="speedometer"
            tone="warning"
          />
        )}
      </View>

      {!isStrength && showDistance ? (
        <View style={styles.metricsGrid}>
          <MetricCard
            label="Ritmo"
            value={formatPace(pace, unitSystem)}
            icon="run-fast"
            tone="success"
          />
          <MetricCard
            label="Desnivel"
            value={formatElevation(activity.elevationGainM, unitSystem)}
            unit={unitSystem === 'metric' ? 'm' : 'ft'}
            icon="elevation-rise"
            tone="warning"
          />
        </View>
      ) : null}

      {isTimedSession ? (
        <View style={styles.section}>
          <SectionHeader title="Sesión por tiempo" />
          <Card style={styles.timedCard}>
            <View style={styles.timedHeader}>
              <MaterialCommunityIcons name="timer-check-outline" size={24} color={colors.primary} />
              <View style={styles.timedText}>
                <AppText variant="bodyStrong">Circuito completado</AppText>
                <AppText variant="caption" color="textSecondary">
                  {activity.roundsCompleted ?? 0} de {timerDetails?.rounds ?? 0} rondas ·{' '}
                  {timerDetails?.exercises?.length ?? 0}{' '}
                  {(timerDetails?.exercises?.length ?? 0) === 1 ? 'ejercicio' : 'ejercicios'} por
                  ronda
                </AppText>
              </View>
              {activity.rpe ? (
                <View style={[styles.rpeBadge, { backgroundColor: colors.warningSoft }]}>
                  <AppText variant="caption" style={{ color: colors.warning }}>
                    RPE {activity.rpe}
                  </AppText>
                </View>
              ) : null}
            </View>
            {timerDetails?.exercises && timerDetails.exercises.length > 0 ? (
              <View style={styles.timedExercises}>
                {timerDetails.exercises.map((exercise: string) => (
                  <View key={exercise} style={styles.timedExerciseRow}>
                    <MaterialCommunityIcons
                      name="dumbbell"
                      size={14}
                      color={colors.textMuted}
                    />
                    <AppText variant="caption" color="textSecondary">
                      {exercise}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        </View>
      ) : null}

      {isStrength && !isTimedSession ? (
        <View style={styles.section}>
          <SectionHeader title="Series" />
          <Card style={styles.setsCard}>
            {activity.sets.length === 0 ? (
              <AppText variant="body" color="textSecondary">
                Esta sesión no tiene series registradas.
              </AppText>
            ) : (
              Array.from(groups.entries()).map(([exerciseName, sets], groupIndex) => {
                const exerciseVolume = calculateVolume(sets);
                return (
                  <View key={exerciseName} style={styles.exerciseGroup}>
                    {groupIndex > 0 ? <Divider style={styles.groupDivider} /> : null}
                    <View style={styles.exerciseHeader}>
                      <AppText variant="bodyStrong">{exerciseName}</AppText>
                      <AppText variant="caption" color="textMuted">
                        {Math.round(
                          unitSystem === 'metric' ? exerciseVolume : kgToLb(exerciseVolume),
                        ).toLocaleString('es-AR')}{' '}
                        {weightUnit(unitSystem)}
                      </AppText>
                    </View>
                    {sets.map((set, index) => (
                      <View key={set.id} style={styles.setRow}>
                        <AppText variant="caption" color="textMuted" style={styles.setIndex}>
                          {index + 1}
                        </AppText>
                        <AppText variant="caption" style={styles.setDetail}>
                          {set.reps ?? 0} reps × {formatWeight(set.weightKg, unitSystem)}{' '}
                          {weightUnit(unitSystem)}
                        </AppText>
                        {set.rpe ? (
                          <AppText variant="caption" color="textMuted">
                            RPE {set.rpe}
                          </AppText>
                        ) : null}
                      </View>
                    ))}
                  </View>
                );
              })
            )}
          </Card>
        </View>
      ) : null}

      {activity.notes ? (
        <View style={styles.section}>
          <SectionHeader title="Notas" />
          <Card>
            <AppText variant="body" color="textSecondary">
              {activity.notes}
            </AppText>
          </Card>
        </View>
      ) : null}

      {!isStrength ? (
        <View style={styles.metricsGrid}>
          <MetricCard
            label="RPE"
            value={activity.rpe ? String(activity.rpe) : '—'}
            icon="speedometer"
            tone="warning"
          />
          <MetricCard
            label="Terreno"
            value={activity.terrain || '—'}
            icon="terrain"
            tone="success"
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Editar"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/activity/new', params: { id: String(activity.id) } })
          }
          icon={<MaterialCommunityIcons name="pencil-outline" size={18} color={colors.text} />}
          style={styles.actionButton}
        />
        <Button
          label="Eliminar"
          variant="ghost"
          onPress={handleDelete}
          style={styles.actionButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  emptyCard: {
    padding: spacing.xl,
  },
  exerciseGroup: {
    gap: spacing.sm,
  },
  exerciseHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  groupDivider: {
    marginVertical: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  setDetail: {
    flex: 1,
  },
  setIndex: {
    width: 18,
  },
  rpeBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  setRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  setsCard: {
    gap: spacing.sm,
  },
  timedCard: {
    gap: spacing.md,
  },
  timedExerciseRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timedExercises: {
    gap: spacing.sm,
  },
  timedHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  timedText: {
    flex: 1,
    gap: 2,
  },
  typeBadge: {
    alignItems: 'center',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
