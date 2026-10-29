import type { ReactNode } from 'react';
import {
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  tabbed?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  scroll = true,
  tabbed = false,
  edges = ['top', 'left', 'right'],
  style,
  contentContainerStyle,
}: ScreenProps) {
  const { colors } = useTheme();

  if (scroll) {
    return (
      <SafeAreaView
        edges={edges}
        style={[{ backgroundColor: colors.background, flex: 1 }, style]}>
        <ScrollView
          contentContainerStyle={[
            {
              gap: spacing.lg,
              padding: spacing.xl,
              paddingBottom: tabbed ? 120 : spacing.xxxl,
            },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={edges}
      style={[{ backgroundColor: colors.background, flex: 1 }, style]}>
      <View
        style={[
          { flex: 1, gap: spacing.lg, padding: spacing.xl },
          contentContainerStyle,
        ]}>
        {children}
      </View>
    </SafeAreaView>
  );
}
