import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, PageHeader, Screen } from '@/components';
import { ProfileForm } from '@/components/ProfileForm';
import { updateProfile } from '@/db/repositories/profile';
import { useAppStore } from '@/store/app';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

export default function OnboardingScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { colors } = useTheme();
  const profile = useAppStore((state) => state.profile);
  const setProfile = useAppStore((state) => state.setProfile);
  const isEditing = edit === '1';

  if (!profile) return null;

  function handleSubmit(update: Parameters<typeof updateProfile>[0]) {
    const updated = updateProfile(update);
    setProfile(updated);
    if (isEditing) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <Screen>
      {isEditing ? (
        <PageHeader title="Editar perfil" onBack={() => router.back()} />
      ) : (
        <PageHeader title="Tu perfil" subtitle="Un punto de partida para medir tu progreso" />
      )}

      {!isEditing ? (
        <Card style={[styles.hero, { backgroundColor: colors.primarySoft }]}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="dumbbell" size={34} color={colors.onPrimary} />
          </View>
          <View style={styles.heroText}>
            <AppText variant="subtitle">Bienvenido a RutinaDiaria</AppText>
            <AppText variant="body" color="textSecondary">
              Completá tus datos para calcular tu IMC y personalizar tus objetivos. Podés
              cambiarlos cuando quieras desde Ajustes.
            </AppText>
          </View>
        </Card>
      ) : null}

      <Card>
        <ProfileForm
          initialProfile={profile}
          submitLabel={isEditing ? 'Guardar cambios' : 'Empezar'}
          onSubmit={handleSubmit}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  logoCircle: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
});
