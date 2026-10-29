import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

type FABProps = {
  onPress: () => void;
  icon?: 'plus' | 'timer-outline' | 'play';
  accessibilityLabel: string;
};

export function FAB({ onPress, icon = 'plus', accessibilityLabel }: FABProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: colors.primary,
          bottom: insets.bottom + spacing.xxxl + 48,
          opacity: pressed ? 0.85 : 1,
          shadowColor: '#000000',
        },
      ]}>
      <MaterialCommunityIcons name={icon} size={28} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.pill,
    elevation: 6,
    height: 58,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.xl,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    width: 58,
  },
});
