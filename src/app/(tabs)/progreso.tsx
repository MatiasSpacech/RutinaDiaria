import { StyleSheet, View } from 'react-native';

import {
  Card,
  EmptyState,
  MetricCard,
  PageHeader,
  Screen,
  SectionHeader,
} from '@/components';
import { spacing } from '@/theme';

export default function ProgressScreen() {
  return (
    <Screen tabbed>
      <PageHeader title="Progreso" subtitle="Estadísticas, rachas y récords" />

      <View style={styles.metricsRow}>
        <MetricCard label="Racha" value="0" unit="días" icon="fire" tone="warning" />
        <MetricCard label="Sesiones" value="0" icon="calendar-check" tone="success" />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Estadísticas" />
        <Card>
          <EmptyState
            icon="chart-box-outline"
            title="Necesitamos algunos datos"
            description="Cuando registres actividades y mediciones vas a ver gráficos semanales, heatmap y tus récords personales."
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
});
