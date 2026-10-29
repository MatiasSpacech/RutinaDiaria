import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@/store/settings';
import { palettes, radius, spacing, typography, type Theme } from '@/theme';

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const preference = useSettingsStore((state) => state.themePreference);

  const scheme =
    preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;

  return {
    scheme,
    colors: palettes[scheme],
    spacing,
    radius,
    typography,
    isDark: scheme === 'dark',
  };
}
