import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Divider,
  PageHeader,
  Screen,
  SectionHeader,
  SegmentedControl,
} from '@/components';
import { exportBackup } from '@/db/repositories/backup';
import { resetAllData } from '@/db/repositories/maintenance';
import { getProfile, updateProfile } from '@/db/repositories/profile';
import { calculateAge, cmToIn, formatWeight, weightUnit } from '@/domain/calculations';
import { useAppStore } from '@/store/app';
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
  const profile = useAppStore((state) => state.profile);
  const setProfile = useAppStore((state) => state.setProfile);
  const [exporting, setExporting] = useState(false);

  function handleThemeChange(preference: ThemePreference) {
    setThemePreference(preference);
    const updated = updateProfile({ themePreference: preference });
    setProfile(updated);
  }

  function handleUnitChange(system: UnitSystem) {
    setUnitSystem(system);
    const updated = updateProfile({ unitSystem: system });
    setProfile(updated);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportBackup();
    } catch (error) {
      Alert.alert(
        'No se pudo exportar',
        error instanceof Error ? error.message : 'Intentá nuevamente.',
      );
    } finally {
      setExporting(false);
    }
  }

  function handleReset() {
    Alert.alert(
      'Borrar todos los datos',
      'Se van a eliminar tu perfil, mediciones, actividades y rutinas. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: () => {
            resetAllData();
            setThemePreference('system');
            setUnitSystem('metric');
            setProfile(getProfile());
            router.replace('/onboarding');
          },
        },
      ],
    );
  }

  const age = profile ? calculateAge(profile.birthDate) : null;
  const height =
    profile?.heightCm === null || profile?.heightCm === undefined
      ? null
      : unitSystem === 'metric'
        ? profile.heightCm
        : cmToIn(profile.heightCm);
  const goalWeight =
    profile?.goalWeightKg === null || profile?.goalWeightKg === undefined
      ? null
      : formatWeight(profile.goalWeightKg, unitSystem);

  return (
    <Screen>
      <PageHeader title="Ajustes" onBack={() => router.back()} />

      <View style={styles.section}>
        <SectionHeader title="Perfil" />
        <Card style={styles.card}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons name="account" size={28} color={colors.primary} />
            </View>
            <View style={styles.profileText}>
              <AppText variant="subtitle">{profile?.name || 'Sin nombre'}</AppText>
              <AppText variant="caption" color="textSecondary">
                {[
                  age !== null ? `${age} años` : null,
                  height !== null
                    ? `${height.toFixed(1)} ${unitSystem === 'metric' ? 'cm' : 'in'}`
                    : null,
                  goalWeight
                    ? `Objetivo ${goalWeight} ${weightUnit(unitSystem)}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Completá tus datos personales'}
              </AppText>
            </View>
          </View>
          <Divider />
          <View style={styles.profileFooter}>
            <AppText variant="caption" color="textSecondary">
              Meta semanal: {profile?.weeklyGoal ?? 3} sesiones
            </AppText>
            <Button
              label="Editar perfil"
              variant="secondary"
              fullWidth={false}
              onPress={() => router.push('/onboarding?edit=1')}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Apariencia" />
        <Card style={styles.card}>
          <SegmentedControl
            options={themeOptions}
            value={themePreference}
            onChange={handleThemeChange}
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
            onChange={handleUnitChange}
          />
          <AppText variant="caption" color="textSecondary">
            {unitSystem === 'metric'
              ? 'Peso en kilogramos, distancias en kilómetros y medidas en centímetros.'
              : 'Peso en libras, distancias en millas y medidas en pulgadas.'}
          </AppText>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Datos" />
        <Card style={styles.card}>
          <Button
            label="Exportar backup JSON"
            variant="secondary"
            onPress={handleExport}
            loading={exporting}
            icon={
              <MaterialCommunityIcons
                name="download-outline"
                size={18}
                color={colors.text}
              />
            }
          />
          <AppText variant="caption" color="textSecondary">
            Genera un archivo con tu perfil, rutinas, actividades y mediciones para
            guardarlo o compartirlo.
          </AppText>
          <Divider />
          <Button
            label="Borrar todos los datos"
            variant="danger"
            onPress={handleReset}
            icon={
              <MaterialCommunityIcons
                name="delete-outline"
                size={18}
                color="#FFFFFF"
              />
            }
          />
          <AppText variant="caption" color="textSecondary">
            Elimina todo el contenido de la app y vuelve a empezar. No se puede deshacer.
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
  avatar: {
    alignItems: 'center',
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  card: {
    gap: spacing.md,
  },
  profileFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  section: {
    gap: spacing.md,
  },
});
