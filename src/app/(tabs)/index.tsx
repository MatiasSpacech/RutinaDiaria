import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Card,
  EmptyState,
  IconButton,
  MetricCard,
  PageHeader,
  Screen,
  SectionHeader,
} from '@/components';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <Screen tabbed>
      <PageHeader
        title="RutinaDiaria"
        subtitle="Tu progreso, todos los días."
        right={
          <IconButton
            name="cog-outline"
            accessibilityLabel="Abrir ajustes"
            onPress={() => router.push('/settings')}
            size={24}
          />
        }
      />

      <Card style={[styles.heroCard, { backgroundColor: colors.primarySoft }]}>
        <View style={styles.heroHeader}>
          <View>
            <AppText variant="label" color="textSecondary">
              ESTA SEMANA
            </AppText>
            <AppText variant="title">Empezá a moverte</AppText>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: colors.surface }]}>
            <AppText variant="label">0 días</AppText>
          </View>
        </View>
        <View style={styles.heroMetrics}>
          <View style={styles.heroMetric}>
            <AppText variant="subtitle">0</AppText>
            <AppText variant="caption" color="textSecondary">
              actividades
            </AppText>
          </View>
          <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
          <View style={styles.heroMetric}>
            <AppText variant="subtitle">0</AppText>
            <AppText variant="caption" color="textSecondary">
              minutos
            </AppText>
          </View>
          <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
          <View style={styles.heroMetric}>
            <AppText variant="subtitle">0</AppText>
            <AppText variant="caption" color="textSecondary">
              kcal
            </AppText>
          </View>
        </View>
      </Card>

      <View style={styles.metricsRow}>
        <MetricCard
          label="Peso actual"
          value="—"
          unit="kg"
          icon="scale-bathroom"
          hint="Sin mediciones"
        />
        <MetricCard
          label="IMC"
          value="—"
          icon="human-male-height"
          tone="info"
          hint="Se calcula solo"
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Actividad reciente" />
        <Card>
          <EmptyState
            icon="run"
            title="Todavía no hay actividad"
            description="Cuando completes una rutina o una caminata, tu resumen va a aparecer acá."
          />
        </Card>
      </View>

      <Card padded={false}>
        <View style={styles.infoCard}>
          <AppText variant="bodyStrong">Todo guardado en tu teléfono</AppText>
          <AppText variant="caption" color="textSecondary">
            RutinaDiaria funciona sin conexión. Tus datos no salen del dispositivo.
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: spacing.lg,
  },
  heroDivider: {
    width: 1,
  },
  heroHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  heroMetric: {
    flex: 1,
    gap: 2,
  },
  heroMetrics: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoCard: {
    gap: spacing.xs,
    padding: spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  streakBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
