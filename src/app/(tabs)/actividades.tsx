import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Card,
  Chip,
  Divider,
  EmptyState,
  FAB,
  PageHeader,
  Screen,
  SectionHeader,
} from '@/components';
import { listActivities } from '@/db/repositories/activities';
import { listRoutines } from '@/db/repositories/routines';
import { formatDistance, formatDuration } from '@/domain/calculations';
import {
  activityTypeIcons,
  activityTypeLabels,
  activityTypeOptions,
} from '@/domain/labels';
import type { Activity, ActivityType } from '@/domain/types';
import { useAppStore } from '@/store/app';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import {
  chartRangeOptions,
  formatDate,
  isWithinRange,
  type ChartRange,
} from '@/utils/date';

type TypeFilter = 'all' | ActivityType;

export default function ActivitiesScreen() {
  const { colors } = useTheme();
  const profile = useAppStore((state) => state.profile);
  const unitSystem = profile?.unitSystem ?? 'metric';
  const [activities, setActivities] = useState<Activity[]>([]);
  const [routinesCount, setRoutinesCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [range, setRange] = useState<ChartRange>('ALL');

  useFocusEffect(
    useCallback(() => {
      setActivities(listActivities({ limit: 200 }));
      setRoutinesCount(listRoutines().length);
    }, []),
  );

  const filtered = activities.filter(
    (activity) =>
      (typeFilter === 'all' || activity.type === typeFilter) &&
      isWithinRange(activity.performedAt, range),
  );

  const hasFilters = typeFilter !== 'all' || range !== 'ALL';

  return (
    <>
      <Screen tabbed>
        <PageHeader title="Actividades" subtitle="Fuerza, caminatas y senderismo" />

        <Card
          onPress={() => router.push('/routines')}
          style={styles.routinesCard}>
          <View style={[styles.routinesIcon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.routinesText}>
            <AppText variant="bodyStrong">Mis rutinas</AppText>
            <AppText variant="caption" color="textSecondary">
              {routinesCount === 0
                ? 'Creá plantillas para reutilizar'
                : `${routinesCount} rutina${routinesCount === 1 ? '' : 's'} guardada${
                    routinesCount === 1 ? '' : 's'
                  }`}
            </AppText>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
        </Card>

        <View style={styles.section}>
          <SectionHeader title="Historial" />
          <View style={styles.filters}>
            <View style={styles.chips}>
              <Chip
                label="Todas"
                selected={typeFilter === 'all'}
                onPress={() => setTypeFilter('all')}
              />
              {activityTypeOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={typeFilter === option.value}
                  onPress={() => setTypeFilter(option.value)}
                />
              ))}
            </View>
            <View style={styles.chips}>
              {chartRangeOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={range === option.value}
                  onPress={() => setRange(option.value)}
                />
              ))}
            </View>
          </View>

          <Card padded={false}>
            {filtered.length === 0 ? (
              <EmptyState
                icon={hasFilters ? 'filter-remove-outline' : 'dumbbell'}
                title={hasFilters ? 'Sin resultados' : 'Sin actividades todavía'}
                description={
                  hasFilters
                    ? 'Probá con otro tipo de actividad o ampliá el rango de fechas.'
                    : 'Registrá una rutina de fuerza, una caminata o una salida a las sierras para empezar tu historial.'
                }
                actionLabel={hasFilters ? 'Limpiar filtros' : 'Registrar actividad'}
                onAction={
                  hasFilters
                    ? () => {
                        setTypeFilter('all');
                        setRange('ALL');
                      }
                    : () => router.push('/activity/new')
                }
              />
            ) : (
              filtered.map((activity, index) => (
                <View key={activity.id}>
                  {index > 0 ? <Divider /> : null}
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/activity/[id]',
                        params: { id: String(activity.id) },
                      })
                    }
                    style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
                    <View style={[styles.typeIcon, { backgroundColor: colors.primarySoft }]}>
                      <MaterialCommunityIcons
                        name={activityTypeIcons[activity.type]}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.rowText}>
                      <AppText variant="bodyStrong" numberOfLines={1}>
                        {activity.title}
                      </AppText>
                      <AppText variant="caption" color="textMuted">
                        {activityTypeLabels[activity.type]} ·{' '}
                        {formatDate(activity.performedAt, 'd MMM yyyy')}
                      </AppText>
                    </View>
                    <View style={styles.rowValues}>
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
          {filtered.length > 0 ? (
            <AppText variant="caption" color="textMuted">
              {filtered.length} actividad{filtered.length === 1 ? '' : 'es'} en el período
            </AppText>
          ) : null}
        </View>
      </Screen>
      <FAB onPress={() => router.push('/activity/new')} accessibilityLabel="Registrar actividad" />
    </>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filters: {
    gap: spacing.sm,
  },
  routinesCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  routinesIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  routinesText: {
    flex: 1,
    gap: 2,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowValues: {
    alignItems: 'flex-end',
    gap: 2,
  },
  section: {
    gap: spacing.md,
  },
  typeIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
