import { Text, type TextProps, type TextStyle } from 'react-native';

import { typography, type ThemeColors } from '@/theme';
import { useTheme } from '@/theme/useTheme';

type Variant = keyof typeof typography;

type AppTextProps = TextProps & {
  variant?: Variant;
  color?: keyof ThemeColors;
  align?: TextStyle['textAlign'];
};

export function AppText({
  variant = 'body',
  color = 'text',
  align,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();

  return (
    <Text
      {...rest}
      style={[typography[variant], { color: colors[color], textAlign: align }, style]}
    />
  );
}
