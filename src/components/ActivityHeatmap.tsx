import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/components/AppText';
import { buildHeatmapWeeks } from '@/domain/stats';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

type ActivityHeatmapProps = {
  activityDates: string[];
  weeks?: number;
};

const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function ActivityHeatmap({ activityDates, weeks = 12 }: ActivityHeatmapProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const weekData = buildHeatmapWeeks(activityDates, weeks);
  const gap = 3;
  const labelWidth = 14;
  const cellSize = Math.max(
    8,
    Math.floor((width - labelWidth - gap * (weeks + 1)) / weeks),
  );

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;
    if (Math.abs(nextWidth - width) > 1) setWidth(nextWidth);
  }

  function cellColor(count: number, isFuture: boolean): string {
    if (isFuture) return colors.backgroundAlt;
    if (count === 0) return colors.backgroundAlt;
    if (count === 1) return `${colors.primary}66`;
    if (count === 2) return `${colors.primary}99`;
    return colors.primary;
  }

  const activeDays = weekData.flat().filter((day) => day.count > 0).length;
  const firstDate = weekData[0]?.[0]?.date;
  const lastDate = weekData[weeks - 1]?.[6]?.date;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {width > 0 ? (
        <View style={styles.grid}>
          <View style={[styles.weekdayColumn, { gap, width: labelWidth }]}>
            {weekdayLabels.map((label) => (
              <View key={label} style={{ height: cellSize, justifyContent: 'center' }}>
                <AppText variant="caption" color="textMuted" style={styles.weekdayLabel}>
                  {label}
                </AppText>
              </View>
            ))}
          </View>
          {weekData.map((week, weekIndex) => (
            <View key={weekIndex} style={[styles.weekColumn, { gap, width: cellSize }]}>
              {week.map((day) => (
                <View
                  key={day.date}
                  style={{
                    backgroundColor: cellColor(day.count, day.isFuture),
                    borderRadius: 3,
                    height: cellSize,
                    opacity: day.isFuture ? 0.35 : 1,
                    width: cellSize,
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.legendRow}>
        <AppText variant="caption" color="textMuted">
          {activeDays} día{activeDays === 1 ? '' : 's'} activo{activeDays === 1 ? '' : 's'}
        </AppText>
        <View style={styles.legend}>
          <AppText variant="caption" color="textMuted">
            Menos
          </AppText>
          {[0, 1, 2, 3].map((count) => (
            <View
              key={count}
              style={{
                backgroundColor: cellColor(count, false),
                borderRadius: 2,
                height: 10,
                width: 10,
              }}
            />
          ))}
          <AppText variant="caption" color="textMuted">
            Más
          </AppText>
        </View>
      </View>

      {firstDate && lastDate ? (
        <AppText variant="caption" color="textMuted">
          {format(parseISO(firstDate), "d MMM", { locale: es })} –{' '}
          {format(parseISO(lastDate), "d MMM yyyy", { locale: es })}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    gap: 3,
  },
  legend: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  legendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekColumn: {
    flexDirection: 'column',
  },
  weekdayColumn: {
    flexDirection: 'column',
  },
  weekdayLabel: {
    fontSize: 9,
    textAlign: 'center',
  },
});
