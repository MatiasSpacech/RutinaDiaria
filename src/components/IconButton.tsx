import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '@/theme';
import { useTheme } from '@/theme/useTheme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type IconButtonProps = {
  name: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  color?: string;
  size?: number;
  variant?: 'plain' | 'surface';
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  color,
  size = 22,
  variant = 'plain',
  style,
}: IconButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        variant === 'surface' && {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.pill,
        },
        pressed && { opacity: 0.7 },
        style,
      ]}>
      <MaterialCommunityIcons name={name} size={size} color={color ?? colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
