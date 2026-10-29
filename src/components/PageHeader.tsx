import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { spacing } from '@/theme';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PageHeader({ title, subtitle, onBack, right, style }: PageHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      {onBack ? (
        <IconButton name="arrow-left" accessibilityLabel="Volver" onPress={onBack} />
      ) : null}
      <View style={styles.textColumn}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
});
