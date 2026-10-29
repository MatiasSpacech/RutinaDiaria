import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDays, parseISO } from 'date-fns';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Card,
  Divider,
  EmptyState,
  IconButton,
  MetricCard,
  PageHeader,
  ProgressBar,
  Screen,
  SectionHeader,
} from '@/components';
import { getActivityDates, listActivities } from '@/db/repositories/activities';
import { getLatestMeasurement } from '@/db/repositories/measurements';
import {
  calculateBmi,
  calculateStreak,
  classifyBmi,
  formatBmiValue,
  formatDistance,
  formatDuration,
  formatWeight,
  getWeekStart,
  kmToMi,
  summarizeActivities,
  weightUnit,
} from '@/domain/calculations';
import { activityTypeIcons, activityTypeLabels } from '@/domain/labels';
import type { Activity, Measurement } from '@/domain/types';
import { useAppStore } from '@/store/app';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import { formatDate } from '@/utils/date';

export default function HomeScreen() {
  const { colors } = useTheme();
  const profile = useAppStore((state) => state.profile);
  const unitSystem = profile?.unitSystem ?? 'metric';
  const [activities, setActivities] = useState<Activity[]>([]);
  const [latestMeasurement, setLatestMeasurement] = useState<Measurement | null>(null);
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setActivities(listActivities({ limit: 60 }));
      setLatestMeasurement(getLatestMeasurement());
      setStreak(calculateStreak(getActivityDates()));
    }, []),
  );

  const weekStart = getWeekStart(new Date());
  const weekEnd = addDays(weekStart, 7);
  const weekActivities = activities.filter((activity) => {
    const date = parseISO(activity.performedAt);
    return date >= weekStart && date < weekEnd;
  });
  const week = summarizeActivities(weekActivities);
  const weeklyGoal = Math.max(1, profile?.weeklyGoal ?? 3);
  const weeklyProgress = Math.min(1, week.sessions / weeklyGoal);
  const recent = activities.slice(0, 3);

  const latestBmi = calculateBmi(latestMeasurement?.weightKg ?? null, profile?.heightCm ?? null);
  const bmiClassification = classifyBmi(latestBmi);

  return (
    <Screen tabbed>
      <PageHeader
        title="RutinaDiaria"
        subtitle="Tu progreso, todos los días."
        right={
          <IconButton
            name="cog-outline"
            accessibilityLabel="Abrir ajustes"
            onPress={() => router.push('/settings')}
            size={24}
          />
        }
      />

      <Card style={[styles.heroCard, { backgroundColor: colors.primarySoft }]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroTitle}>
            <AppText variant="label" color="textSecondary">
              ESTA SEMANA
            </AppText>
            <AppText variant="title">
              {week.sessions > 0 ? 'Semana en curso' : 'Empezá a moverte'}
            </AppText>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="fire" size={16} color={colors.warning} />
            <AppText variant="label">
              {streak} día{streak === 1 ? '' : 's'}
            </AppText>
          </View>
        </View>
        <View style={styles.heroMetrics}>
          <View style={styles.heroMetric}>
            <AppText variant="subtitle">{week.sessions}</AppText>
            <AppText variant="caption" color="textSecondary">
              actividades
            </AppText>
          </View>
          <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
          <View style={styles.heroMetric}>
            <AppText variant="subtitle">{week.minutes}</AppText>
            <AppText variant="caption" color="textSecondary">
              minutos
            </AppText>
          </View>
          <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
          <View style={styles.heroMetric}>
            <AppText variant="subtitle">
              {week.distanceKm > 0
                ? (unitSystem === 'metric' ? week.distanceKm : kmToMi(week.distanceKm)).toFixed(1)
                : '0'}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {unitSystem === 'metric' ? 'km' : 'mi'}
            </AppText>
          </View>
        </View>
        <View style={styles.goalBlock}>
          <View style={styles.goalHeader}>
            <AppText variant="caption" color="textSecondary">
              Meta semanal
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {week.sessions} de {weeklyGoal} sesiones
            </AppText>
          </View>
          <ProgressBar progress={weeklyProgress} height={6} />
        </View>
      </Card>

      <View style={styles.metricsRow}>
        <MetricCard
          label="Peso actual"
          value={formatWeight(latestMeasurement?.weightKg ?? null, unitSystem)}
          unit={weightUnit(unitSystem)}
          icon="scale-bathroom"
          hint={
            latestMeasurement
              ? formatDate(latestMeasurement.measuredAt, 'd MMM yyyy')
              : 'Sin mediciones'
          }
        />
        <MetricCard
          label="IMC"
          value={formatBmiValue(latestBmi)}
          icon="human-male-height"
          tone={bmiClassification?.tone ?? 'info'}
          hint={bmiClassification?.label ?? 'Se calcula solo'}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Actividad reciente"
          actionLabel={activities.length > 0 ? 'Ver todo' : undefined}
          onAction={activities.length > 0 ? () => router.push('/actividades') : undefined}
        />
        <Card padded={false}>
          {recent.length === 0 ? (
            <EmptyState
              icon="run"
              title="Todavía no hay actividad"
              description="Cuando completes una rutina o una caminata, tu resumen va a aparecer acá."
              actionLabel="Registrar actividad"
              onAction={() => router.push('/activity/new')}
            />
          ) : (
            recent.map((activity, index) => (
              <View key={activity.id}>
                {index > 0 ? <Divider /> : null}
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/activity/[id]',
                      params: { id: String(activity.id) },
                    })
                  }
                  style={({ pressed }) => [styles.activityRow, pressed && { opacity: 0.7 }]}>
                  <View style={[styles.activityIcon, { backgroundColor: colors.primarySoft }]}>
                    <MaterialCommunityIcons
                      name={activityTypeIcons[activity.type]}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.activityText}>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {activity.title}
                    </AppText>
                    <AppText variant="caption" color="textMuted">
                      {activityTypeLabels[activity.type]} ·{' '}
                      {formatDate(activity.performedAt, 'd MMM yyyy')}
                    </AppText>
                  </View>
                  <View style={styles.activityValues}>
                    <AppText variant="label">
                      {activity.distanceKm !== null
                        ? `${formatDistance(activity.distanceKm, unitSystem)} ${
                            unitSystem === 'metric' ? 'km' : 'mi'
                          }`
                        : formatDuration(activity.durationMinutes)}
                    </AppText>
                    <AppText variant="caption" color="textMuted">
                      {activity.distanceKm !== null
                        ? formatDuration(activity.durationMinutes)
                        : activity.rpe
                          ? `RPE ${activity.rpe}`
                          : 'Ver detalle'}
                    </AppText>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            ))
          )}
        </Card>
      </View>

      <Card padded={false}>
        <View style={styles.infoCard}>
          <AppText variant="bodyStrong">Todo guardado en tu teléfono</AppText>
          <AppText variant="caption" color="textSecondary">
            RutinaDiaria funciona sin conexión. Tus datos no salen del dispositivo.
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  activityIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  activityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  activityText: {
    flex: 1,
    gap: 2,
  },
  activityValues: {
    alignItems: 'flex-end',
    gap: 2,
  },
  goalBlock: {
    gap: spacing.xs,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroCard: {
    gap: spacing.lg,
  },
  heroDivider: {
    width: 1,
  },
  heroHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  heroMetric: {
    flex: 1,
    gap: 2,
  },
  heroMetrics: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroTitle: {
    flex: 1,
    gap: 2,
  },
  infoCard: {
    gap: spacing.xs,
    padding: spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  streakBadge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
