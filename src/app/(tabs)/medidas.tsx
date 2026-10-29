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

export default function MeasurementsScreen() {
  return (
    <Screen tabbed>
      <PageHeader title="Medidas" subtitle="Peso, IMC y evolución corporal" />

      <View style={styles.metricsRow}>
        <MetricCard label="Peso" value="—" unit="kg" icon="scale-bathroom" hint="Último registro" />
        <MetricCard label="IMC" value="—" icon="human-male-height" tone="info" hint="Calculado" />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Evolución" />
        <Card>
          <EmptyState
            icon="chart-timeline-variant"
            title="Tu evolución va a aparecer acá"
            description="Cargá tu primera medición para ver gráficos de peso, IMC y medidas."
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
