import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { radius, spacing } from '@/theme';
import type { ThemeColors } from '@/theme';
import { useTheme } from '@/theme/useTheme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

type MetricCardProps = {
  label: string;
  value: string;
  unit?: string;
  icon?: IconName;
  hint?: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
};

export function MetricCard({
  label,
  value,
  unit,
  icon,
  hint,
  tone = 'primary',
  style,
}: MetricCardProps) {
  const { colors } = useTheme();

  const toneColors: Record<Tone, { fg: string; bg: keyof ThemeColors }> = {
    primary: { fg: colors.primary, bg: 'primarySoft' },
    success: { fg: colors.success, bg: 'successSoft' },
    warning: { fg: colors.warning, bg: 'warningSoft' },
    danger: { fg: colors.danger, bg: 'dangerSoft' },
    info: { fg: colors.info, bg: 'infoSoft' },
  };

  const toneColor = toneColors[tone];

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.topRow}>
        <AppText variant="caption" color="textSecondary">
          {label}
        </AppText>
        {icon ? (
          <View style={[styles.iconBadge, { backgroundColor: colors[toneColor.bg] }]}>
            <MaterialCommunityIcons name={icon} size={16} color={toneColor.fg} />
          </View>
        ) : null}
      </View>
      <View style={styles.valueRow}>
        <AppText variant="metric">{value}</AppText>
        {unit ? (
          <AppText variant="label" color="textSecondary" style={styles.unit}>
            {unit}
          </AppText>
        ) : null}
      </View>
      {hint ? (
        <AppText variant="caption" color="textMuted">
          {hint}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 150,
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  unit: {
    marginBottom: 4,
  },
  valueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
