import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Card,
  Chip,
  Divider,
  EvolutionChart,
  EmptyState,
  FAB,
  MetricCard,
  PageHeader,
  ProgressBar,
  Screen,
  SectionHeader,
  type EvolutionPoint,
} from '@/components';
import { listMeasurements } from '@/db/repositories/measurements';
import {
  calculateBmi,
  calculateWeightChange,
  classifyBmi,
  formatBmiValue,
  formatMeasure,
  formatWeight,
  kgToLb,
  measureUnit,
  weightUnit,
} from '@/domain/calculations';
import type { Measurement } from '@/domain/types';
import { useAppStore } from '@/store/app';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import {
  chartRangeOptions,
  formatDate,
  formatDateCompact,
  formatDateShort,
  isWithinRange,
  type ChartRange,
} from '@/utils/date';
import { clamp, formatSigned } from '@/utils/numbers';

type ChartMetric = 'weight' | 'bmi' | 'waist' | 'hip' | 'chest' | 'arm' | 'thigh' | 'bodyFat';

const metricOptions: { label: string; value: ChartMetric }[] = [
  { label: 'Peso', value: 'weight' },
  { label: 'IMC', value: 'bmi' },
  { label: 'Cintura', value: 'waist' },
  { label: 'Cadera', value: 'hip' },
  { label: 'Pecho', value: 'chest' },
  { label: 'Brazo', value: 'arm' },
  { label: 'Muslo', value: 'thigh' },
  { label: '% Grasa', value: 'bodyFat' },
];

function metricValue(measurement: Measurement, metric: ChartMetric): number | null {
  switch (metric) {
    case 'weight':
      return measurement.weightKg;
    case 'bmi':
      return null;
    case 'waist':
      return measurement.waistCm;
    case 'hip':
      return measurement.hipCm;
    case 'chest':
      return measurement.chestCm;
    case 'arm':
      return measurement.armCm;
    case 'thigh':
      return measurement.thighCm;
    case 'bodyFat':
      return measurement.bodyFatPct;
  }
}

export default function MeasurementsScreen() {
  const { colors } = useTheme();
  const profile = useAppStore((state) => state.profile);
  const unitSystem = profile?.unitSystem ?? 'metric';

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [range, setRange] = useState<ChartRange>('3M');
  const [metric, setMetric] = useState<ChartMetric>('weight');

  useFocusEffect(
    useCallback(() => {
      setMeasurements(listMeasurements('asc'));
    }, []),
  );

  const filtered = measurements.filter((measurement) =>
    isWithinRange(measurement.measuredAt, range),
  );
  const latest = measurements[measurements.length - 1] ?? null;
  const latestBmi = calculateBmi(latest?.weightKg ?? null, profile?.heightCm ?? null);
  const latestClassification = classifyBmi(latestBmi);
  const weightChange = calculateWeightChange(filtered);

  const points: EvolutionPoint[] = filtered
    .map((measurement): EvolutionPoint | null => {
      const rawValue =
        metric === 'bmi'
          ? calculateBmi(measurement.weightKg, profile?.heightCm ?? null)
          : metricValue(measurement, metric);
      if (rawValue === null) return null;
      const displayValue =
        metric === 'weight'
          ? unitSystem === 'metric'
            ? rawValue
            : kgToLb(rawValue)
          : metric === 'bmi' || metric === 'bodyFat'
            ? rawValue
            : unitSystem === 'metric'
              ? rawValue
              : rawValue / 2.54;
      return {
        value: Number(displayValue.toFixed(1)),
        label: formatDateCompact(measurement.measuredAt),
      };
    })
    .filter((point): point is EvolutionPoint => point !== null);

  const chartUnit =
    metric === 'weight'
      ? weightUnit(unitSystem)
      : metric === 'bmi'
        ? 'IMC'
        : metric === 'bodyFat'
          ? '%'
          : measureUnit(unitSystem);

  const chartRangeLabel =
    filtered.length > 0
      ? filtered.length === 1
        ? formatDate(filtered[0].measuredAt, 'd MMM yyyy')
        : `${formatDateShort(filtered[0].measuredAt)} – ${formatDateShort(
            filtered[filtered.length - 1].measuredAt,
          )}`
      : '';

  const goalDisplay =
    metric === 'weight' && profile?.goalWeightKg
      ? unitSystem === 'metric'
        ? profile.goalWeightKg
        : kgToLb(profile.goalWeightKg)
      : null;

  const pointValues = points.map((point) => point.value);
  const showGoalLine =
    goalDisplay !== null &&
    pointValues.length > 0 &&
    goalDisplay >= Math.min(...pointValues) &&
    goalDisplay <= Math.max(...pointValues);

  const firstWeight =
    measurements.find((measurement) => measurement.weightKg !== null)?.weightKg ?? null;
  const goalProgress =
    latest && firstWeight !== null && profile?.goalWeightKg
      ? firstWeight === profile.goalWeightKg
        ? latest.weightKg === profile.goalWeightKg
          ? 1
          : 0
        : clamp(
            1 -
              Math.abs((latest.weightKg ?? firstWeight) - profile.goalWeightKg) /
                Math.abs(firstWeight - profile.goalWeightKg),
            0,
            1,
          )
      : null;

  return (
    <>
      <Screen tabbed>
        <PageHeader title="Medidas" subtitle="Peso, IMC y evolución corporal" />

        <View style={styles.metricsRow}>
          <MetricCard
            label="Peso"
            value={latest ? formatWeight(latest.weightKg, unitSystem) : '—'}
            unit={weightUnit(unitSystem)}
            icon="scale-bathroom"
            hint={latest ? formatDate(latest.measuredAt, 'd MMM yyyy') : 'Sin registros'}
          />
          <MetricCard
            label="IMC"
            value={formatBmiValue(latestBmi)}
            icon="human-male-height"
            tone={latestClassification?.tone ?? 'info'}
            hint={latestClassification?.label ?? 'Sin datos'}
          />
        </View>

        {profile?.goalWeightKg ? (
          <Card style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View>
                <AppText variant="label" color="textSecondary">
                  OBJETIVO DE PESO
                </AppText>
                <AppText variant="subtitle">
                  {formatWeight(profile.goalWeightKg, unitSystem)} {weightUnit(unitSystem)}
                </AppText>
              </View>
              <MaterialCommunityIcons name="target" size={28} color={colors.primary} />
            </View>
            <ProgressBar progress={goalProgress ?? 0} />
            <AppText variant="caption" color="textSecondary">
              {latest?.weightKg === null || latest?.weightKg === undefined
                ? 'Cargá una medición para ver tu avance.'
                : latest.weightKg === profile.goalWeightKg
                  ? '¡Llegaste a tu objetivo!'
                  : `Te faltan ${formatWeight(
                      Math.abs(latest.weightKg - profile.goalWeightKg),
                      unitSystem,
                    )} ${weightUnit(unitSystem)} para tu objetivo.`}
            </AppText>
          </Card>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Evolución" />
          <Card style={styles.chartCard}>
            {measurements.length > 0 ? (
              <>
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
                <View style={styles.chips}>
                  {metricOptions.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={metric === option.value}
                      onPress={() => setMetric(option.value)}
                    />
                  ))}
                </View>
                {points.length > 0 ? (
                  <>
                    <EvolutionChart
                      points={points}
                      unitLabel={chartUnit}
                      referenceValue={showGoalLine ? goalDisplay : null}
                      referenceLabel="Objetivo"
                    />
                    <View style={styles.chartFooter}>
                      <AppText variant="caption" color="textMuted">
                        {chartRangeLabel}
                      </AppText>
                      <AppText variant="caption" color="textSecondary">
                        {metric === 'weight' && weightChange !== null
                          ? `Cambio: ${formatSigned(
                              unitSystem === 'metric' ? weightChange : kgToLb(weightChange),
                              1,
                              weightUnit(unitSystem),
                            )}`
                          : `${points.length} registro${points.length === 1 ? '' : 's'}`}
                      </AppText>
                    </View>
                    {metric === 'bmi' && latestClassification ? (
                      <AppText variant="caption" color="textMuted">
                        {latestClassification.label} · El IMC es una referencia general.
                      </AppText>
                    ) : null}
                  </>
                ) : (
                  <AppText variant="caption" color="textSecondary">
                    No hay datos de {metricOptions.find((option) => option.value === metric)?.label.toLowerCase()} en este período.
                  </AppText>
                )}
              </>
            ) : (
              <EmptyState
                icon="chart-timeline-variant"
                title="Tu evolución va a aparecer acá"
                description="Cargá tu primera medición para ver la evolución de tu peso, IMC y medidas."
                actionLabel="Cargar medición"
                onAction={() => router.push('/measurement/new')}
              />
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Historial" />
          <Card padded={false}>
            {measurements.length === 0 ? (
              <EmptyState
                icon="scale-bathroom"
                title="Sin mediciones"
                description="Registrá tu peso y medidas para empezar a seguir tu progreso."
                actionLabel="Cargar medición"
                onAction={() => router.push('/measurement/new')}
              />
            ) : (
              [...measurements].reverse().map((measurement, index) => {
                const measurementBmi = calculateBmi(
                  measurement.weightKg,
                  profile?.heightCm ?? null,
                );
                return (
                  <View key={measurement.id}>
                    {index > 0 ? <Divider /> : null}
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/measurement/new',
                          params: { id: String(measurement.id) },
                        })
                      }
                      style={({ pressed }) => [
                        styles.row,
                        pressed && { opacity: 0.7 },
                      ]}>
                      <View style={styles.rowDate}>
                        <AppText variant="bodyStrong">
                          {formatDate(measurement.measuredAt, 'd MMM yyyy')}
                        </AppText>
                        <AppText variant="caption" color="textMuted">
                          {measurementBmi !== null
                            ? `IMC ${formatBmiValue(measurementBmi)}`
                            : 'Sin IMC'}
                        </AppText>
                      </View>
                      <View style={styles.rowValues}>
                        <AppText variant="bodyStrong">
                          {formatWeight(measurement.weightKg, unitSystem)}{' '}
                          {weightUnit(unitSystem)}
                        </AppText>
                        {measurement.waistCm !== null ? (
                          <AppText variant="caption" color="textMuted">
                            Cintura {formatMeasure(measurement.waistCm, unitSystem)}{' '}
                            {measureUnit(unitSystem)}
                          </AppText>
                        ) : null}
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={22}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  </View>
                );
              })
            )}
          </Card>
        </View>
      </Screen>
      <FAB
        onPress={() => router.push('/measurement/new')}
        accessibilityLabel="Agregar medición"
      />
    </>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    gap: spacing.md,
  },
  chartFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  goalCard: {
    gap: spacing.md,
  },
  goalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowDate: {
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
});
