import Constants from 'expo-constants';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Card,
  Divider,
  PageHeader,
  Screen,
  SectionHeader,
  SegmentedControl,
} from '@/components';
import { useSettingsStore, type ThemePreference, type UnitSystem } from '@/store/settings';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

const themeOptions: { label: string; value: ThemePreference }[] = [
  { label: 'Sistema', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Oscuro', value: 'dark' },
];

const unitOptions: { label: string; value: UnitSystem }[] = [
  { label: 'Métrico', value: 'metric' },
  { label: 'Imperial', value: 'imperial' },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const themePreference = useSettingsStore((state) => state.themePreference);
  const unitSystem = useSettingsStore((state) => state.unitSystem);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);
  const setUnitSystem = useSettingsStore((state) => state.setUnitSystem);

  return (
    <Screen>
      <PageHeader title="Ajustes" onBack={() => router.back()} />

      <View style={styles.section}>
        <SectionHeader title="Apariencia" />
        <Card style={styles.card}>
          <SegmentedControl
            options={themeOptions}
            value={themePreference}
            onChange={setThemePreference}
          />
          <AppText variant="caption" color="textSecondary">
            El tema del sistema se adapta automáticamente al modo claro u oscuro del teléfono.
          </AppText>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Unidades" />
        <Card style={styles.card}>
          <SegmentedControl
            options={unitOptions}
            value={unitSystem}
            onChange={setUnitSystem}
          />
          <AppText variant="caption" color="textSecondary">
            {unitSystem === 'metric'
              ? 'Peso en kilogramos, distancias en kilómetros y medidas en centímetros.'
              : 'Peso en libras, distancias en millas y medidas en pulgadas.'}
          </AppText>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Acerca de" />
        <Card padded={false}>
          <View style={styles.aboutRow}>
            <View style={styles.aboutText}>
              <AppText variant="bodyStrong">RutinaDiaria</AppText>
              <AppText variant="caption" color="textSecondary">
                Versión {Constants.expoConfig?.version ?? '1.0.0'}
              </AppText>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
              <AppText variant="caption" style={{ color: colors.primary }}>
                Offline
              </AppText>
            </View>
          </View>
          <Divider />
          <View style={styles.aboutRow}>
            <AppText variant="caption" color="textSecondary">
              Tus datos se guardan únicamente en este dispositivo.
            </AppText>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  aboutRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  aboutText: {
    flex: 1,
    gap: 2,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  card: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
});
