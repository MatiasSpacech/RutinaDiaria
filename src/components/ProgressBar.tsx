import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/useTheme';

type ProgressBarProps = {
  progress: number;
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({ progress, color, height = 8, style }: ProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: colors.backgroundAlt, height, borderRadius: height / 2 },
        style,
      ]}>
      <View
        style={{
          backgroundColor: color ?? colors.primary,
          borderRadius: height / 2,
          height,
          width: `${clamped * 100}%`,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
});
