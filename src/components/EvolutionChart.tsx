import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { AppText } from '@/components/AppText';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

export type EvolutionPoint = {
  value: number;
  label?: string;
};

function niceStep(value: number): number {
  const safeValue = Math.max(0.1, value);
  const exponent = Math.floor(Math.log10(safeValue));
  const fraction = safeValue / 10 ** exponent;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * 10 ** exponent;
}

type EvolutionChartProps = {
  points: EvolutionPoint[];
  unitLabel?: string;
  color?: string;
  height?: number;
  referenceValue?: number | null;
  referenceLabel?: string;
};

export function EvolutionChart({
  points,
  unitLabel,
  color,
  height = 190,
  referenceValue,
  referenceLabel,
}: EvolutionChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const chartColor = color ?? colors.primary;

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;
    if (Math.abs(nextWidth - width) > 1) {
      setWidth(nextWidth);
    }
  }

  if (points.length === 0) return null;

  const values = points.map((point) => point.value);
  if (referenceValue !== null && referenceValue !== undefined) values.push(referenceValue);

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = Math.max(1, maxValue - minValue);
  const offset = Math.max(0, Math.floor((minValue - spread * 0.25) * 10) / 10);
  const step = niceStep((maxValue + spread * 0.2 - offset) / 4);

  const chartData = points.map((point) => ({ value: point.value }));

  const showReference =
    referenceValue !== null && referenceValue !== undefined && points.length > 0;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {unitLabel ? (
        <AppText variant="caption" color="textMuted" align="right">
          {unitLabel}
        </AppText>
      ) : null}
      {width > 0 ? (
        <LineChart
          data={chartData}
          width={Math.max(120, width - 52)}
          height={height}
          adjustToWidth
          disableScroll
          initialSpacing={10}
          endSpacing={10}
          curved
          thickness={2.5}
          color={chartColor}
          areaChart
          startFillColor={chartColor}
          endFillColor={chartColor}
          startOpacity={0.22}
          endOpacity={0.01}
          hideDataPoints={points.length > 14}
          dataPointsColor={chartColor}
          dataPointsRadius={3.5}
          yAxisOffset={offset}
          stepValue={step}
          noOfSections={4}
          showFractionalValues
          roundToDigits={1}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.border}
          rulesColor={colors.chartGrid}
          rulesType="dashed"
          yAxisLabelWidth={40}
          yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
          showReferenceLine1={showReference}
          referenceLine1Position={referenceValue ?? 0}
          referenceLine1Config={{
            color: colors.textMuted,
            dashWidth: 4,
            dashGap: 4,
            thickness: 1,
            labelText: referenceLabel,
            labelTextStyle: {
              color: colors.textMuted,
              fontSize: 9,
            },
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    width: '100%',
  },
});
