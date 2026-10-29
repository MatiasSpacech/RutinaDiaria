import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ActivityBarChart,
  ActivityHeatmap,
  AppText,
  Card,
  Chip,
  Divider,
  EmptyState,
  MetricCard,
  PageHeader,
  ProgressBar,
  Screen,
  SectionHeader,
} from '@/components';
import { listActivities } from '@/db/repositories/activities';
import { listStrengthSetRecords } from '@/db/repositories/stats';
import {
  calculateStreak,
  formatWeight,
  kgToLb,
  kmToMi,
  weightUnit,
} from '@/domain/calculations';
import {
  activityTypeIcons,
  activityTypeLabels,
  activityTypeOptions,
} from '@/domain/labels';
import {
  buildWeeklyBuckets,
  calculatePersonalRecords,
  countActivityTypes,
  type StrengthSetRecord,
} from '@/domain/stats';
import type { Activity } from '@/domain/types';
import { useAppStore } from '@/store/app';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import { formatDateShort } from '@/utils/date';

type ChartMetric = 'sessions' | 'minutes' | 'distance' | 'volume';

const chartMetrics: { label: string; value: ChartMetric }[] = [
  { label: 'Sesiones', value: 'sessions' },
  { label: 'Minutos', value: 'minutes' },
  { label: 'Distancia', value: 'distance' },
  { label: 'Volumen', value: 'volume' },
];

export default function ProgressScreen() {
  const { colors } = useTheme();
  const profile = useAppStore((state) => state.profile);
  const unitSystem = profile?.unitSystem ?? 'metric';
  const weeklyGoal = Math.max(1, profile?.weeklyGoal ?? 3);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [strengthSets, setStrengthSets] = useState<StrengthSetRecord[]>([]);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('sessions');

  useFocusEffect(
    useCallback(() => {
      setActivities(listActivities({ limit: 500 }));
      setStrengthSets(listStrengthSetRecords());
    }, []),
  );

  const streak = calculateStreak(activities.map((activity) => activity.performedAt));
  const weeklyBuckets = buildWeeklyBuckets(activities, strengthSets, 8);
  const currentWeek = weeklyBuckets[weeklyBuckets.length - 1];
  const currentWeekSessions = currentWeek?.sessions ?? 0;
  const records = calculatePersonalRecords(strengthSets);
  const typeCounts = countActivityTypes(activities);
  const activeTypes = activityTypeOptions.filter((option) => typeCounts[option.value] > 0);
  const totalTyped = activeTypes.reduce((total, option) => total + typeCounts[option.value], 0);

  const chartData = weeklyBuckets.map((bucket) => {
    let value = bucket.sessions;
    if (chartMetric === 'minutes') value = bucket.minutes;
    if (chartMetric === 'distance') {
      value = unitSystem === 'metric' ? bucket.distanceKm : kmToMi(bucket.distanceKm);
    }
    if (chartMetric === 'volume') {
      value = unitSystem === 'metric' ? bucket.volumeKg : kgToLb(bucket.volumeKg);
    }
    return {
      label: bucket.label,
      value: Math.round(value * 10) / 10,
    };
  });

  const chartUnit =
    chartMetric === 'sessions'
      ? 'sesiones'
      : chartMetric === 'minutes'
        ? 'min'
        : chartMetric === 'distance'
          ? unitSystem === 'metric'
            ? 'km'
            : 'mi'
          : weightUnit(unitSystem);

  const prs = records.slice(0, 6);
  const typeColors: Record<string, string> = {
    strength: colors.primary,
    walk: colors.info,
    hike: colors.success,
    cardio: colors.danger,
    other: colors.textMuted,
  };

  return (
    <Screen tabbed>
      <PageHeader title="Progreso" subtitle="Estadísticas, rachas y récords" />

      <View style={styles.metricsRow}>
        <MetricCard
          label="Racha"
          value={String(streak)}
          unit={streak === 1 ? 'día' : 'días'}
          icon="fire"
          tone="warning"
        />
        <MetricCard
          label="Esta semana"
          value={`${currentWeekSessions}/${weeklyGoal}`}
          unit="sesiones"
          icon="calendar-check"
          tone="success"
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Actividad semanal" />
        <Card style={styles.chartCard}>
          {activities.length === 0 ? (
            <EmptyState
              icon="chart-bar"
              title="Todavía no hay datos"
              description="Cuando registres actividades vas a ver tu evolución semana a semana."
            />
          ) : (
            <>
              <View style={styles.chips}>
                {chartMetrics.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    selected={chartMetric === option.value}
                    onPress={() => setChartMetric(option.value)}
                  />
                ))}
              </View>
              <ActivityBarChart data={chartData} unitLabel={chartUnit} />
              <AppText variant="caption" color="textMuted">
                Últimas 8 semanas · semana actual a la derecha
              </AppText>
            </>
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Calendario" />
        <Card>
          <ActivityHeatmap
            activityDates={activities.map((activity) => activity.performedAt)}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Por tipo" />
        <Card style={styles.typeCard}>
          {activeTypes.length === 0 ? (
            <AppText variant="body" color="textSecondary">
              Sin actividades registradas.
            </AppText>
          ) : (
            activeTypes.map((option) => {
              const count = typeCounts[option.value];
              return (
                <View key={option.value} style={styles.typeRow}>
                  <View
                    style={[
                      styles.typeIcon,
                      { backgroundColor: `${typeColors[option.value]}22` },
                    ]}>
                    <MaterialCommunityIcons
                      name={activityTypeIcons[option.value]}
                      size={18}
                      color={typeColors[option.value]}
                    />
                  </View>
                  <View style={styles.typeInfo}>
                    <View style={styles.typeHeader}>
                      <AppText variant="bodyStrong">{activityTypeLabels[option.value]}</AppText>
                      <AppText variant="caption" color="textSecondary">
                        {count}
                      </AppText>
                    </View>
                    <ProgressBar
                      progress={count / Math.max(1, totalTyped)}
                      color={typeColors[option.value]}
                      height={6}
                    />
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Récords personales" />
        <Card padded={false}>
          {prs.length === 0 ? (
            <EmptyState
              icon="trophy-outline"
              title="Sin récords todavía"
              description="Agregá peso y repeticiones en tus series de fuerza para calcular tus récords y el 1RM estimado."
            />
          ) : (
            prs.map((record, index) => (
              <View key={record.exerciseName}>
                {index > 0 ? <Divider /> : null}
                <View style={styles.prRow}>
                  <View style={[styles.prIcon, { backgroundColor: colors.primarySoft }]}>
                    <MaterialCommunityIcons name="trophy-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.prText}>
                    <AppText variant="bodyStrong">{record.exerciseName}</AppText>
                    <AppText variant="caption" color="textMuted">
                      Mejor: {formatWeight(record.bestWeightKg, unitSystem)}{' '}
                      {weightUnit(unitSystem)} × {record.bestWeightReps} ·{' '}
                      {formatDateShort(record.bestOneRepMaxDate)}
                    </AppText>
                  </View>
                  <View style={styles.prValue}>
                    <AppText variant="bodyStrong">
                      1RM {formatWeight(record.bestOneRepMaxKg, unitSystem)}
                    </AppText>
                    <AppText variant="caption" color="textMuted">
                      {weightUnit(unitSystem)} estimado
                    </AppText>
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    gap: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  prIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  prRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  prText: {
    flex: 1,
    gap: 2,
  },
  prValue: {
    alignItems: 'flex-end',
    gap: 2,
  },
  section: {
    gap: spacing.md,
  },
  typeCard: {
    gap: spacing.md,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  typeInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  typeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
});
