import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { AppText } from '@/components/AppText';
import { useTheme } from '@/theme/useTheme';

type DataPoint = {
  label: string;
  value: number;
};

type ActivityBarChartProps = {
  data: DataPoint[];
  unitLabel?: string;
  color?: string;
};

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  const fraction = value / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return Math.max(4, nice * power);
}

export function ActivityBarChart({ data, unitLabel, color }: ActivityBarChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const chartColor = color ?? colors.primary;

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;
    if (Math.abs(nextWidth - width) > 1) setWidth(nextWidth);
  }

  if (data.length === 0) return null;

  const chartWidth = Math.max(120, width - 52);
  const rawMax = Math.max(1, ...data.map((item) => item.value));
  const maxValue = niceMax(rawMax);
  const slot = chartWidth / Math.max(1, data.length);
  const barWidth = Math.max(10, Math.min(30, slot * 0.52));
  const spacing = Math.max(6, slot - barWidth - 8);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {unitLabel ? (
        <AppText variant="caption" color="textMuted" align="right">
          {unitLabel}
        </AppText>
      ) : null}
      {width > 0 ? (
        <BarChart
          data={data}
          width={chartWidth}
          height={170}
          barWidth={barWidth}
          spacing={spacing}
          initialSpacing={8}
          endSpacing={8}
          frontColor={chartColor}
          barBorderRadius={4}
          noOfSections={4}
          maxValue={maxValue}
          stepValue={maxValue / 4}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.border}
          rulesColor={colors.chartGrid}
          rulesType="dashed"
          yAxisLabelWidth={40}
          yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
          formatYLabel={(label) => {
            const value = Number(label);
            if (value >= 1000) return `${Math.round(value / 1000)}k`;
            return Number.isInteger(value) ? String(value) : value.toFixed(1);
          }}
          disableScroll
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    width: '100%',
  },
});
