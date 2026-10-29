import { StyleSheet, View } from 'react-native';

import { Card, EmptyState, PageHeader, Screen, SectionHeader } from '@/components';
import { spacing } from '@/theme';

export default function ActivitiesScreen() {
  return (
    <Screen tabbed>
      <PageHeader title="Actividades" subtitle="Fuerza, caminatas y senderismo" />

      <View style={styles.section}>
        <SectionHeader title="Historial" />
        <Card>
          <EmptyState
            icon="dumbbell"
            title="Sin actividades todavía"
            description="Registrá una rutina de fuerza, una caminata o una salida a las sierras para empezar tu historial."
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
});
