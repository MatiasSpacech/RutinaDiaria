import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

type RpeSelectorProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  label?: string;
};

const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function RpeSelector({ value, onChange, label = 'RPE (esfuerzo)' }: RpeSelectorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.chips}>
        {values.map((number) => {
          const selected = value === number;
          return (
            <Pressable
              key={number}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(selected ? null : number)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}>
              <AppText variant="label" color={selected ? 'onPrimary' : 'textSecondary'}>
                {number}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 42,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  container: {
    gap: spacing.sm,
  },
});
